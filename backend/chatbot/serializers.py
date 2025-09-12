from rest_framework import serializers
from .models import ChatMenuItem, ChatOrder, ChatCustomer

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMenuItem
        fields = ["id","name","description","price","category","image_url"]

class OrderSerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    class Meta:
        model = ChatOrder
        fields = ["id","status","total_price","created_at","items"]

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatCustomer
        fields = ["id","email","name","loyalty_points"]
