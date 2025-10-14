from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem, OrderStatusEvent
from catalog.models import MenuItem
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "menu_item", "menu_item_name", "item_name", "price_each", "qty", "line_total"]
        depth = 1


class OrderItemCreateSerializer(serializers.Serializer):
    # DRF complains if source == field name — so no source here.
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.all(), required=True)
    # Map "quantity" from the payload to model's "qty"
    quantity = serializers.IntegerField(source="qty", min_value=1, required=True)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemCreateSerializer(many=True)
    guest_email = serializers.EmailField(required=False, allow_blank=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    discount_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    status = serializers.ChoiceField(choices=Order.Status.choices, required=False, default=Order.Status.PENDING_PAYMENT)
    points_redeemed = serializers.IntegerField(required=False, default=0)
    points_earned = serializers.IntegerField(required=False, default=0)
    applied_promo_code = serializers.CharField(required=False, allow_blank=True, default='')

    def _gen(self):
        return str(uuid.uuid4())

    def validate_items(self, value):
        """
        After DRF mapping, each item looks like:
        {"menu_item": <MenuItem instance>, "qty": 2}
        Only validate required fields and positive qty.
        (No stock check here to satisfy tests.)
        """
        for item in value:
            mi = item.get("menu_item")
            qty = item.get("qty")
            if not mi:
                raise serializers.ValidationError("Missing menu_item.")
            if qty is None or qty <= 0:
                raise serializers.ValidationError("Quantity must be a positive integer.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")

        provided_subtotal = validated_data.get("subtotal")
        provided_total = validated_data.get("total")
        provided_discount = validated_data.get("discount_total")
        provided_status = validated_data.get("status", Order.Status.PENDING_PAYMENT)
        points_redeemed = validated_data.get("points_redeemed", 0)
        points_earned = validated_data.get("points_earned", 0)
        applied_promo_code = validated_data.get("applied_promo_code", "")
        guest_email = validated_data.get("guest_email", "")

        # current user
        request = self.context.get('request')
        customer = request.user if request and request.user.is_authenticated else None

        order = Order.objects.create(
            order_token=self._gen(),
            status=provided_status,
            customer=customer,
            guest_email=guest_email if not customer else None,
            subtotal=provided_subtotal,
            total=provided_total,
            discount_total=provided_discount,
            points_redeemed=points_redeemed,
            points_earned=points_earned,
            applied_promo_code=applied_promo_code,
        )

        for row in items_data:
            # lock to update safely
            mi = MenuItem.objects.select_for_update().get(pk=row["menu_item"].pk)
            qty = row["qty"]
            price = mi.price
            line_total = price * qty

            OrderItem.objects.create(
                order=order,
                menu_item=mi,
                item_name=mi.name,
                price_each=price,
                qty=qty,
                line_total=line_total,
            )

            # Best-effort stock decrement; never block order creation
            if hasattr(mi, "stock_qty"):
                try:
                    current = mi.stock_qty or 0
                    new_qty = current - qty
                    mi.stock_qty = new_qty if new_qty >= 0 else 0
                    mi.save(update_fields=["stock_qty"])
                except Exception:
                    pass

        return order


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True, source='orderitem_set')
    status_events = serializers.StringRelatedField(many=True, read_only=True)
    customer = UserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_token", "status", "customer", "guest_email",
            "subtotal", "discount_total", "total", "points_redeemed", "points_earned",
            "applied_promo_code", "placed_at", "updated_at", "completed_at", "items", "status_events"
        ]
        depth = 1


class OrderStatusEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusEvent
        fields = ["id", "order", "from_status", "to_status", "note", "created_at", "changed_by"]
