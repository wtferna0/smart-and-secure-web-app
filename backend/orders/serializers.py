# orders/serializers.py
from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem, OrderStatusEvent
from catalog.models import MenuItem
from django.contrib.auth import get_user_model

User = get_user_model()


# ----- User Serializer -----
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


# ----- Order Item (nested read) -----
class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "menu_item", "menu_item_name", "item_name", "price_each", "qty", "line_total"]
        depth = 1  # Add this to include nested menu_item data


# ----- For creating order items -----
class OrderItemCreateSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1)


# In orders/serializers.py - FIXED VERSION
# orders/serializers.py
from rest_framework import serializers
from django.db import transaction
import uuid  # Add this import
from .models import Order, OrderItem, OrderStatusEvent
from catalog.models import MenuItem
from django.contrib.auth import get_user_model

User = get_user_model()

# ... your other serializers remain the same ...

class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemCreateSerializer(many=True)
    guest_email = serializers.EmailField(required=False, allow_blank=True)
    
    # ✅ Only use fields that exist in Order model
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    discount_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    status = serializers.ChoiceField(choices=Order.Status.choices, required=False, default=Order.Status.PENDING_PAYMENT)
    points_redeemed = serializers.IntegerField(required=False, default=0)
    points_earned = serializers.IntegerField(required=False, default=0)
    applied_promo_code = serializers.CharField(required=False, allow_blank=True, default='')

    def _gen(self):
        """Generate unique order token"""
        return str(uuid.uuid4())

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        
        # ✅ Get ALL provided amounts
        provided_subtotal = validated_data.get("subtotal")
        provided_total = validated_data.get("total")
        provided_discount = validated_data.get("discount_total")
        provided_status = validated_data.get("status", Order.Status.PENDING_PAYMENT)
        points_redeemed = validated_data.get("points_redeemed", 0)
        points_earned = validated_data.get("points_earned", 0)
        applied_promo_code = validated_data.get("applied_promo_code", "")
        guest_email = validated_data.get("guest_email", "")
        
        # Get the current user from the request
        request = self.context.get('request')
        customer = request.user if request and request.user.is_authenticated else None
        
        print(f"🔄 Creating order with provided amounts:")
        print(f"   Subtotal: {provided_subtotal}")
        print(f"   Total: {provided_total}")
        print(f"   Discount: {provided_discount}")
        print(f"   Promo Code: {applied_promo_code}")
        print(f"   Points Redeemed: {points_redeemed}")
        print(f"   Points Earned: {points_earned}")
        print(f"   Customer: {customer.email if customer else 'Guest'}")
        
        # ✅ Create order with ONLY EXISTING FIELDS
        order = Order.objects.create(
            order_token=self._gen(),  # This will now work!
            status=provided_status,
            customer=customer,
            guest_email=guest_email if not customer else None,
            # ✅ USE PROVIDED AMOUNTS DIRECTLY - NO RECALCULATION
            subtotal=provided_subtotal,
            total=provided_total,
            discount_total=provided_discount,
            points_redeemed=points_redeemed,
            points_earned=points_earned,
            applied_promo_code=applied_promo_code
        )

        # Create order items but DON'T recalculate totals
        calculated_subtotal = 0
        for row in items_data:
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

            calculated_subtotal += line_total

        print(f"✅ Order created:")
        print(f"   Order ID: {order.id}")
        print(f"   Order Token: {order.order_token}")
        print(f"   Provided Subtotal: {provided_subtotal}")
        print(f"   Calculated Subtotal: {calculated_subtotal}")
        print(f"   Provided Total: {provided_total}")
        print(f"   Provided Discount: {provided_discount}")
        print(f"   Actual Order Total: {order.total}")
        print(f"   Points Earned (stored): {order.points_earned}")
        print(f"   Points Redeemed (stored): {order.points_redeemed}")
        
        return order

# ----- Read Order (with nested items + status history) -----
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True, source='orderitem_set')
    status_events = serializers.StringRelatedField(many=True, read_only=True)
    customer = UserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_token", "status", "customer", "guest_email",
            "subtotal", "discount_total", "total", "points_redeemed", "points_earned", 
            "applied_promo_code", "placed_at", "updated_at", "items", "status_events"
        ]
        depth = 1

# ----- Order Status Event Serializer (optional API use) -----
class OrderStatusEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusEvent
        fields = ["id", "order", "from_status", "to_status", "note", "created_at", "changed_by"]