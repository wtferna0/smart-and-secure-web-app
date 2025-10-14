from rest_framework import serializers
from .models import MenuCategory, MenuItem

class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ["id", "name", "is_active"]

class MenuItemSerializer(serializers.ModelSerializer):
    #category = MenuCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=MenuCategory.objects.all(), 
        source='category', 
        write_only=True,
        required=False
    )
    image_url = serializers.SerializerMethodField()
    category_detail = MenuCategorySerializer(source="category", read_only=True)
    
    class Meta:
        model = MenuItem
        fields = [
            "id", "name", "price", "is_active", "stock_qty", 
            "category", "category_id","category_detail", "image", "image_url", 
            "rating", "description", "created_at", 
            "image_url", "created_at"]
    
    def get_image_url(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value
    
    def validate_stock_qty(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value