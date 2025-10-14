import uuid
from datetime import datetime
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from rest_framework import mixins, viewsets, status as http_status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Payment
from .serializers import PaymentCreateSerializer
from .utils import payhere_verify_md5sig
from orders.models import Order, OrderStatusEvent


class PaymentViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    POST /api/payments/ ,  create payment 
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentCreateSerializer
    permission_classes = [IsAuthenticated]


class PayHereCheckoutCreate(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        data = request.data or {}
        order_id = data.get("order_id")
        
        if not order_id:
            return Response(
                {"detail": "Order ID is required."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
            
        order = get_object_or_404(Order, pk=order_id)

        if order.status not in ["PENDING_PAYMENT", "PLACED", "PENDING"]:
            return Response(
                {"detail": "Order not payable in current state."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        cfg = settings.PAYHERE
        amount = f"{order.total:.2f}"
        currency = "LKR"

        # Generate UNIQUE payment reference to prevent duplicates
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_id = uuid.uuid4().hex[:6]
        payment_ref = f"PH-{order.id}-{timestamp}-{unique_id}"

        payment = Payment.objects.create(
            provider=Payment.Provider.PAYHERE,
            payment_ref=payment_ref,
            amount=Decimal(amount),
            currency=currency,
            status=Payment.Status.PENDING,
            order=order,
            created_by=request.user if request.user.is_authenticated else None,
        )

        # Required fields for PayHere Checkout POST
        form_fields = {
            "merchant_id": cfg["MERCHANT_ID"],
            "return_url": cfg["RETURN_URL"],
            "cancel_url": cfg["CANCEL_URL"],
            "notify_url": cfg["NOTIFY_URL"],

            "order_id": str(order.id),
            "items": f"Order {order.order_token}",
            "currency": currency,
            "amount": amount,

            # Customer details
            "first_name": data.get("first_name", "Guest"),
            "last_name": data.get("last_name", "Customer"),
            "email": data.get("email") or getattr(order, 'guest_email', ''),
            "phone": data.get("phone", ""),
            "address": data.get("address", ""),
            "city": data.get("city", ""),
            "country": data.get("country", "Sri Lanka"),

            "custom_1": str(payment.id),
            "custom_2": getattr(order, 'order_token', ''),
        }

        if order.total <= 0:
            return Response(
                {"detail": "Order amount must be greater than 0."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "action_url": cfg["CHECKOUT_URL"],
            "form_fields": form_fields,
        })

STATUS_MAP = {
    "2": Payment.Status.PAID,
    "0": Payment.Status.PENDING,
    "-1": Payment.Status.CANCELLED,
    "-2": Payment.Status.FAILED,
    "-3": Payment.Status.FAILED,
}

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
@transaction.atomic
def payhere_ipn(request):
    p = request.POST

    # Verify signature
    if not payhere_verify_md5sig(p):
        return Response({"ok": False, "reason": "bad_signature"}, status=http_status.HTTP_400_BAD_REQUEST)

    # Pull key fields
    merchant_id = p.get("merchant_id")
    order_id = p.get("order_id")                     
    payment_id = p.get("payment_id")                 
    payhere_amount = p.get("payhere_amount")
    payhere_currency = p.get("payhere_currency")
    status_code = p.get("status_code")               
    status_message = p.get("status_message", "")
    method = p.get("method", "")

    if not order_id:
        return Response({"ok": False, "reason": "missing_order_id"}, status=http_status.HTTP_400_BAD_REQUEST)

    # Find the order & existing Payment row
    order = get_object_or_404(Order.objects.select_for_update(), pk=order_id)

    payment = (
        Payment.objects.filter(order=order, provider=Payment.Provider.PAYHERE)
        .order_by("-created_at")
        .first()
    )
    
    if not payment:
        # Create new payment record if none exists
        payment = Payment(
            order=order, 
            provider=Payment.Provider.PAYHERE,
            payment_ref=payment_id or f"PH-{order_id}-{uuid.uuid4().hex[:8]}"
        )

    # Update/record payment details
    if payhere_amount:
        try:
            amount_str = str(payhere_amount).replace(',', '')
            payment.amount = Decimal(amount_str)
        except (InvalidOperation, TypeError, ValueError):
            payment.amount = Decimal('0.00')
            
    if payhere_currency:
        payment.currency = payhere_currency
        
    if payment_id:
        payment.payment_ref = payment_id

    payment.status = STATUS_MAP.get(status_code, Payment.Status.FAILED)
    
    # Store raw payload
    try:
        payment.raw_payload = {k: p.get(k) for k in p.keys()}
    except Exception:
        payment.raw_payload = {}
        
    payment.save()

    # Update order status transitions
    prev = order.status
    # Update order status transitions
    if status_code == "2":
        with transaction.atomic():
            # Idempotency: only one PLACED event per order
            already = OrderStatusEvent.objects.filter(
                order=order,
                to_status=Order.Status.PLACED,
            ).exists()

            if not already:
                if order.status != Order.Status.PLACED:
                    order.status = Order.Status.PLACED
                    order.save(update_fields=["status"])

                OrderStatusEvent.objects.get_or_create(
                    order=order,
                    to_status=Order.Status.PLACED,
                    defaults={"note": "IPN"},
                )
        return Response(status=204)

    return Response(status=204)