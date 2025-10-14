from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import Payment
from orders.models import Order, OrderStatusEvent

class PaymentCreateSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Payment
        fields = ["id", "order_id", "provider", "amount", "currency", "status", "payment_ref", "created_at"]
        read_only_fields = ["id", "created_at", "status"]

    def validate(self, attrs):
        order_id = attrs.get("order_id")
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            raise serializers.ValidationError({"order_id": "Order not found."})

        # Use string values for status comparison
        if order.status not in ["PENDING_PAYMENT", "PENDING", "PLACED"]:
            raise serializers.ValidationError({"order": f"Order in state {order.status} cannot be paid."})

        amt = attrs.get("amount")
        if amt is None:
            raise serializers.ValidationError({"amount": "Amount is required."})
        
        try:
            if Decimal(str(amt)) != order.total:
                raise serializers.ValidationError({"amount": "Amount must match the order total."})
        except (TypeError, ValueError):
            raise serializers.ValidationError({"amount": "Invalid amount format."})
            
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        order = Order.objects.select_for_update().get(pk=validated_data.pop("order_id"))

        payment = Payment.objects.create(
            order=order,
            provider=validated_data["provider"],
            amount=validated_data["amount"],
            currency=validated_data.get("currency", "LKR"),
            status=Payment.Status.PAID,
            payment_ref=validated_data.get("payment_ref", f"MOCK-{order.id}-{uuid.uuid4().hex[:8]}"),
        )

        prev = order.status
        order.status = "PLACED"
        order.save(update_fields=["status"])

        OrderStatusEvent.objects.create(
            order=order, 
            from_status=prev, 
            to_status=order.status, 
            note=f"Payment {payment.id} captured"
        )
        return payment