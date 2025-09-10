from rest_framework import viewsets, filters
from .models import MenuCategory, MenuItem
from .serializers import MenuCategorySerializer, MenuItemSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MenuCategory.objects.filter(is_active=True).order_by("name")
    serializer_class = MenuCategorySerializer

class MenuItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MenuItem.objects.filter(is_active=True).select_related("category").order_by("id")
    serializer_class = MenuItemSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "category__name"]
