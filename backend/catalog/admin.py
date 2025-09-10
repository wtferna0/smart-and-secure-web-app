from django.contrib import admin
from .models import MenuCategory, MenuItem, ItemStockMovement

@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active")
    search_fields = ("name",)

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "price", "stock_qty", "is_active", "created_at")
    list_filter = ("is_active", "category")
    search_fields = ("name",)

@admin.register(ItemStockMovement)
class ItemStockMovementAdmin(admin.ModelAdmin):
    list_display = ("id", "menu_item", "delta_qty", "reason", "ref_order", "created_by", "created_at")
    list_filter = ("reason",)
