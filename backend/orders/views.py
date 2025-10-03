# orders/views.py
from django.db import transaction
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Order, OrderItem, OrderStatusEvent
from .serializers import OrderCreateSerializer, OrderSerializer
from catalog.models import MenuItem

class OrderViewSet(mixins.CreateModelMixin,
                   mixins.RetrieveModelMixin,
                   mixins.ListModelMixin,
                   mixins.UpdateModelMixin,  # ✅ Add this
                   viewsets.GenericViewSet):
    serializer_class = OrderSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            base_queryset = Order.objects.prefetch_related(
                'orderitem_set',
                'orderitem_set__menu_item',
                'customer'
            ).select_related('customer')
            
            if self.request.user.is_staff:
                orders = base_queryset.all().order_by("-placed_at")
            else:
                orders = base_queryset.filter(customer=self.request.user).order_by("-placed_at")
            
            return orders
        else:
            return Order.objects.none()

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        create_serializer = OrderCreateSerializer(
            data=request.data, 
            context={'request': request}
        )
        create_serializer.is_valid(raise_exception=True)
        order = create_serializer.save()
        
        response_serializer = OrderSerializer(order, context=self.get_serializer_context())
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    # ✅ Add this method to handle status updates
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({"error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate the status
        valid_statuses = dict(Order.Status.choices)
        if new_status not in valid_statuses:
            return Response({"error": f"Invalid status. Valid choices: {list(valid_statuses.keys())}"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create status event record
        OrderStatusEvent.objects.create(
            order=order,
            changed_by=request.user,
            from_status=order.status,
            to_status=new_status,
            note=f"Status updated via admin dashboard"
        )
        
        # Update order status
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    # ✅ Or simply override the update method to handle status changes
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle status changes specifically
        if 'status' in request.data:
            new_status = request.data['status']
            old_status = instance.status
            
            # Create status event record
            OrderStatusEvent.objects.create(
                order=instance,
                changed_by=request.user,
                from_status=old_status,
                to_status=new_status,
                note=f"Status updated via admin dashboard"
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)