# catalog/serializers.py
from rest_framework import serializers
from .models import MenuCategory, MenuItem

class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ["id", "name", "is_active"]

class MenuItemSerializer(serializers.ModelSerializer):
    category = MenuCategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()  # Change back to image
    
    class Meta:
        model = MenuItem
        fields = ["id", "name", "price", "is_active", "stock_qty", "category", "image", "rating", "created_at"]
    
    def get_image(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None