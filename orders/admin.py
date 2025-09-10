# from django.contrib import admin
# from .models import Order, OrderItem, OrderStatusEvent
# admin.site.register(Order)
# admin.site.register(OrderItem)
# admin.site.register(OrderStatusEvent)
from django.contrib import admin
from .models import Order, OrderItem, OrderStatusEvent

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "order_token", "status", "customer", "total", "placed_at")
    list_filter = ("status",)
    search_fields = ("order_token", "customer__username", "guest_email")
    inlines = [OrderItemInline]

@admin.register(OrderStatusEvent)
class OrderStatusEventAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "from_status", "to_status", "created_at", "changed_by")
