# payments/views.py
from decimal import Decimal

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from rest_framework import mixins, viewsets, status as http_status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

from .models import Payment
from .serializers import PaymentCreateSerializer
from .utils import payhere_verify_md5sig
from orders.models import Order, OrderStatusEvent


class PaymentViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    POST /api/payments/  -> create payment (marks order as PAID)
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentCreateSerializer


class PayHereCheckoutCreate(APIView):
    """
    POST /api/payhere/checkout/
    Body:
      {
        "order_id": int,
        "first_name": "...",
        "last_name": "...",
        "email": "...",
        "phone": "...",
        "address": "...",
        "city": "...",
        "country": "Sri Lanka"
      }
    Returns: { "action_url": str, "form_fields": {...} } to submit to PayHere.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request):
        data = request.data or {}
        order = get_object_or_404(Order, pk=data.get("order_id"))

        # Only allow payment from valid states
        if order.status not in [Order.Status.PENDING_PAYMENT, Order.Status.PLACED]:
            return Response(
                {"detail": "Order not payable in current state."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        cfg = settings.PAYHERE
        amount = str(order.total.quantize(Decimal("0.01")))
        currency = "LKR"  # PayHere (Sri Lanka)

        # Use your DB order id as reference; PayHere echoes this back in IPN
        order_ref = str(order.id)

        # Create a Payment row in PENDING; provider ref will be updated on IPN
        payment = Payment.objects.create(
            provider=Payment.Provider.PAYHERE,
            payment_ref=f"PRE-{order_ref}",  # temporary; replace with PayHere payment_id on IPN
            amount=Decimal(amount),
            currency=currency,
            status="PENDING",
            order=order,
            created_by=request.user if request.user.is_authenticated else None,
        )

        # Required fields for PayHere Checkout POST
        form_fields = {
            "merchant_id": cfg["MERCHANT_ID"],
            "return_url": cfg["RETURN_URL"],
            "cancel_url": cfg["CANCEL_URL"],
            "notify_url": cfg["NOTIFY_URL"],

            "order_id": order_ref,                  # your identifier; echoed back in IPN
            "items": f"Order {order.order_token}",  # description visible to customer
            "currency": currency,
            "amount": amount,

            # Customer details
            "first_name": data.get("first_name", "Guest"),
            "last_name": data.get("last_name", "Customer"),
            "email": data.get("email") or order.guest_email or "",
            "phone": data.get("phone", ""),
            "address": data.get("address", ""),
            "city": data.get("city", ""),
            "country": data.get("country", "Sri Lanka"),

            # Optional passthrough for faster reconciliation
            "custom_1": str(payment.id),        # Payment row id
            "custom_2": order.order_token,      # extra reference
        }

        return Response({
            "action_url": cfg["CHECKOUT_URL"],
            "form_fields": form_fields,
        })


# ---------------------------
# PayHere IPN (webhook) view
# ---------------------------

STATUS_MAP = {
    "2": "PAID",        # success
    "0": "PENDING",
    "-1": "CANCELLED",
    "-2": "FAILED",
    "-3": "FAILED",     # treat chargeback as FAILED internally (or add explicit status if needed)
}

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])   # PayHere servers are unauthenticated
def payhere_ipn(request):
    p = request.POST

    # 1) Verify signature
    if not payhere_verify_md5sig(p):
        return Response({"ok": False, "reason": "bad_signature"}, status=http_status.HTTP_400_BAD_REQUEST)

    # 2) Pull key fields
    merchant_id = p.get("merchant_id")
    order_id = p.get("order_id")                     # your reference (we set this to Order.id)
    payment_id = p.get("payment_id")                 # PayHere txn id
    payhere_amount = p.get("payhere_amount")
    payhere_currency = p.get("payhere_currency")
    status_code = p.get("status_code")               # '2','0','-1','-2','-3'
    status_message = p.get("status_message", "")
    method = p.get("method", "")

    # 3) Find the order & existing Payment row (order_id is enough here)
    order = get_object_or_404(Order, pk=order_id)

    payment = (
        Payment.objects.filter(order=order, provider=Payment.Provider.PAYHERE)
        .order_by("-created_at")
        .first()
    ) or Payment(order=order, provider=Payment.Provider.PAYHERE)

    # Update/record payment details
    if payhere_amount:
        payment.amount = Decimal(payhere_amount)
    if payhere_currency:
        payment.currency = payhere_currency
    if payment_id:
        payment.payment_ref = payment_id

    payment.status = STATUS_MAP.get(status_code, "FAILED")
    # Store raw payload if your model has this JSON/TextField
    try:
        payment.raw_payload = {k: p.get(k) for k in p.keys()}
    except Exception:
        # If raw_payload field doesn't exist, just ignore
        pass
    payment.save()

    # 4) Update order status transitions you want
    prev = order.status
    if status_code == "2":
        # Success → mark order as PLACED/PAID and let the normal flow continue
        order.status = getattr(Order.Status, "PLACED", "PLACED")
    elif status_code == "0":
        order.status = getattr(Order.Status, "PENDING_PAYMENT", "PENDING_PAYMENT")
    elif status_code in ("-1", "-2", "-3"):
        order.status = getattr(Order.Status, "FAILED", "FAILED")
    order.save(update_fields=["status"])

    # Record the transition
    OrderStatusEvent.objects.create(
        order=order,
        from_status=prev,
        to_status=order.status,
        note=f"PayHere {status_message or status_code} ({method})"
    )

    return Response({"ok": True})
