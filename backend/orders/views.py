# from rest_framework import viewsets, mixins
# from rest_framework.response import Response
# from rest_framework.decorators import action
# from .models import Order
# from .serializers import OrderCreateSerializer, OrderSerializer

# class OrderViewSet(mixins.CreateModelMixin,
#                    mixins.RetrieveModelMixin,
#                    viewsets.GenericViewSet):
#     queryset = Order.objects.all().order_by("-placed_at")

#     def get_serializer_class(self):
#         return OrderCreateSerializer if self.action == "create" else OrderSerializer

#     @action(detail=True, methods=["get"])
#     def status(self, request, pk=None):
#         order = self.get_object()
#         return Response({"status": order.status})

from django.db import transaction
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Order, OrderItem, OrderStatusEvent
from .serializers import OrderCreateSerializer, OrderSerializer
from catalog.models import MenuItem


class OrderViewSet(mixins.CreateModelMixin,
                   mixins.RetrieveModelMixin,
                   viewsets.GenericViewSet):
    """
    - POST /api/orders/           -> create order (uses OrderCreateSerializer)
    - GET  /api/orders/{id}/      -> retrieve order
    - GET  /api/orders/{id}/status/ -> {"status": "..."}
    - POST /api/orders/{id}/cancel/ -> cancel & restore stock (only if not PAID/FULFILLED)
    """
    queryset = Order.objects.all().order_by("-placed_at")

    def get_serializer_class(self):
        return OrderCreateSerializer if self.action == "create" else OrderSerializer

    @action(detail=True, methods=["get"])
    def status(self, request, pk=None):
        order = self.get_object()
        return Response({"status": order.status})

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def cancel(self, request, pk=None):
        """
        Cancel an order and restore item stock.
        Allowed only when order is not already PAID or FULFILLED or CANCELLED.
        """
        order: Order = self.get_object()
        if order.status in [Order.Status.PAID, Order.Status.FULFILLED, Order.Status.CANCELLED]:
            return Response(
                {"detail": f"Cannot cancel from status {order.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # restore stock
        items = OrderItem.objects.select_related("menu_item").filter(order=order)
        for it in items:
            # lock the row for safety
            mi = MenuItem.objects.select_for_update().get(pk=it.menu_item_id)
            mi.stock_qty = mi.stock_qty + it.qty
            mi.save(update_fields=["stock_qty"])

        prev = order.status
        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])

        OrderStatusEvent.objects.create(
            order=order, from_status=prev, to_status=order.status, note="Cancelled by API"
        )
        return Response({"ok": True, "status": order.status})
