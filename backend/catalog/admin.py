from django.contrib import admin
from .models import MenuCategory, MenuItem, ItemStockMovement

@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active")
    search_fields = ("name",)
    list_editable = ("is_active",)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "price", "stock_qty", "is_active", "created_at")
    list_filter = ("is_active", "category")
    search_fields = ("name", "category__name")
    list_editable = ("price", "stock_qty", "is_active")

@admin.register(ItemStockMovement)
class ItemStockMovementAdmin(admin.ModelAdmin):
    list_display = ("id", "menu_item", "delta_qty", "reason", "ref_order", "created_by", "created_at")
    list_filter = ("reason", "created_at")
    search_fields = ("menu_item__name", "note")
    readonly_fields = ("created_at",)