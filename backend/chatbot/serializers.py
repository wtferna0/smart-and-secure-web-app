from rest_framework import serializers
from .models import ChatMenuItem, ChatOrder, ChatCustomer

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMenuItem
        fields = ["id","name","category","price","is_available"]

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatOrder
        fields = ["id","status","created_at","total"]

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatCustomer
        fields = ["email","name","loyalty_points"]
