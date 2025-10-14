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
    
    def get_queryset(self):
        queryset = MenuCategory.objects.all().order_by("name")
        # For non-staff users, only show active categories
        if not getattr(self.request.user, 'is_staff', False):
            queryset = queryset.filter(is_active=True)
        return queryset

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related("category").order_by("id")
    serializer_class = MenuItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "category__name", "description"]
    ordering_fields = ["name", "price", "rating", "created_at"]
    ordering = ["name"]
    pagination_class = None
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]
    
    def get_queryset(self):
        queryset = MenuItem.objects.select_related("category").order_by("name")
        
        # Check if user is authenticated and staff
        if not getattr(self.request.user, 'is_staff', False):
            queryset = queryset.filter(is_active=True, category__is_active=True)
        
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def featured(self, request):
        """Get featured menu items (high rating and in stock)"""
        featured_items = self.get_queryset().filter(
            rating__gte=4.0,
            stock_qty__gt=0
        )[:10]
        serializer = self.get_serializer(featured_items, many=True)
        return Response(serializer.data)