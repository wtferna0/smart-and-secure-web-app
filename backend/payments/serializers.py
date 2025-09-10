from decimal import Decimal
from django.db import transaction
from rest_framework import serializers

from .models import Payment
from orders.models import Order, OrderStatusEvent


class PaymentCreateSerializer(serializers.ModelSerializer):
    # accept order_id in payload; keep amount/currency/provider/status as in your model
    order_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Payment
        fields = ["id", "order_id", "provider", "amount", "currency", "status", "payment_ref", "created_at"]
        read_only_fields = ["id", "created_at", "status"]  # we'll set status=SUCCESS in create()

    def validate(self, attrs):
        order_id = attrs.get("order_id")
        if not Order.objects.filter(pk=order_id).exists():
            raise serializers.ValidationError({"order_id": "Order not found."})
        order = Order.objects.get(pk=order_id)

        if order.status not in [Order.Status.PENDING_PAYMENT, Order.Status.PENDING]:
            raise serializers.ValidationError({"order": f"Order in state {order.status} cannot be paid."})

        # Optional: enforce amount matches order.total
        amt = attrs.get("amount")
        if amt is None:
            raise serializers.ValidationError({"amount": "Amount is required."})
        if Decimal(amt) != order.total:
            # You can relax this to <= if you support partials
            raise serializers.ValidationError({"amount": "Amount must match the order total."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        order = Order.objects.select_for_update().get(pk=validated_data.pop("order_id"))

        # Create payment and mark success (simplified flow)
        payment = Payment.objects.create(
            order=order,
            provider=validated_data["provider"],
            amount=validated_data["amount"],
            currency=validated_data.get("currency", order.default_currency if hasattr(order, "default_currency") else "LKR"),
            status=Payment.Status.SUCCESS if hasattr(Payment, "Status") else "SUCCESS",
            payment_ref=validated_data.get("payment_ref", ""),
        )

        # flip order to PAID if not already
        prev = order.status
        order.status = Order.Status.PAID
        order.save(update_fields=["status"])

        OrderStatusEvent.objects.create(
            order=order, from_status=prev, to_status=order.status, note=f"Payment {payment.id} captured"
        )
        return payment
