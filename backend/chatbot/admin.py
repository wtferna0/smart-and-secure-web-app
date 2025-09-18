from django.contrib import admin
from .models import ChatCustomer, ChatMenuItem, ChatOrder

@admin.register(ChatCustomer)
class ChatCustomerAdmin(admin.ModelAdmin):
    list_display = ("id","email","name","loyalty_points")
    search_fields = ("email","name")

@admin.register(ChatMenuItem)
class ChatMenuItemAdmin(admin.ModelAdmin):
    list_display = ("id","name","category","price")
    list_filter = ("category",)
    search_fields = ("name",)

@admin.register(ChatOrder)
class ChatOrderAdmin(admin.ModelAdmin):
    list_display = ("id","customer","status","total_price","created_at")
    list_filter = ("status",)
    search_fields = ("customer__email",)
