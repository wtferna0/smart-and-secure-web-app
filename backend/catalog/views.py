# catalog/views.py
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.db.models import Q
from .models import MenuCategory, MenuItem
from .serializers import MenuCategorySerializer, MenuItemSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.all().order_by("name")
    serializer_class = MenuCategorySerializer
    
    def get_permissions(self):
        # Allow anyone to view categories
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        # Require admin for create, update, delete
        return [IsAuthenticated(), IsAdminUser()]

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related("category").order_by("id")
    serializer_class = MenuItemSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "category__name"]
    # REMOVE parser_classes - use default
    
    def get_permissions(self):
        # Allow anyone to view menu items
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        # Require admin for create, update, delete
        return [IsAuthenticated(), IsAdminUser()]
    
    def get_queryset(self):
        queryset = MenuItem.objects.select_related("category").order_by("id")
        
        # For guest users, only show active items
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context