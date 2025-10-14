from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "provider", "amount", "currency", "status", "payment_ref", "created_at")
    list_filter = ("provider", "status")
    search_fields = ("payment_ref", "order__id")
    readonly_fields = ("created_at",)
    list_select_related = ("order",)