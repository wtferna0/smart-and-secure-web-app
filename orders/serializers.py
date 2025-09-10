# orders/serializers.py
from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem, OrderStatusEvent
from catalog.models import MenuItem


# ----- Order Item (nested read) -----
class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "menu_item", "menu_item_name", "item_name", "price_each", "qty", "line_total"]


# ----- For creating order items -----
class OrderItemCreateSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1)


# ----- Create Order -----
class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemCreateSerializer(many=True)

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data["items"]
        order = Order.objects.create(
            order_token=self._gen(),
            status=Order.Status.PENDING_PAYMENT
        )

        subtotal = 0
        for row in items:
            mi = MenuItem.objects.select_for_update().get(pk=row["menu_item_id"])
            price = mi.price
            line_total = price * row["qty"]

            OrderItem.objects.create(
                order=order,
                menu_item=mi,
                item_name=mi.name,
                price_each=price,
                qty=row["qty"],
                line_total=line_total
            )

            # reduce stock
            mi.stock_qty = mi.stock_qty - row["qty"]
            mi.save(update_fields=["stock_qty"])

            subtotal += line_total

        order.subtotal = subtotal
        order.total = subtotal  # promos/taxes later
        order.save(update_fields=["subtotal", "total"])
        return order

    def _gen(self):
        from uuid import uuid4
        return uuid4().hex[:16]


# ----- Read Order (with nested items + status history) -----
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_events = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_token", "status", "subtotal", "discount_total", "total",
            "placed_at", "updated_at", "items", "status_events"
        ]


# ----- Order Status Event Serializer (optional API use) -----
class OrderStatusEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusEvent
        fields = ["id", "order", "from_status", "to_status", "note", "created_at", "changed_by"]
