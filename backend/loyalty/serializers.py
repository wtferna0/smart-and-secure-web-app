# loyalty/serializers.py
from rest_framework import serializers
from .models import PromoCode, UserPromo

class PromoCodeSerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = PromoCode
        fields = ['id', 'code', 'discount_type', 'amount', 'min_order_total', 
                 'is_active', 'is_valid', 'is_puzzle_reward']

class PointsRedemptionSerializer(serializers.Serializer):
    points = serializers.IntegerField(min_value=1)
    order_id = serializers.IntegerField(required=False)

class UserPromoSerializer(serializers.ModelSerializer):
    promo_code = serializers.CharField(source='promo.code', read_only=True)
    promo_discount_type = serializers.CharField(source='promo.discount_type', read_only=True)
    promo_amount = serializers.DecimalField(source='promo.amount', read_only=True, max_digits=10, decimal_places=2)
    
    class Meta:
        model = UserPromo
        fields = ['id', 'promo_code', 'promo_discount_type', 'promo_amount', 
                 'redeemed_at', 'is_puzzle_reward', 'created_at']