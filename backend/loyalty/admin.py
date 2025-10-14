from django.contrib import admin
from django.db.models import Count
from django.utils import timezone
from .models import PromoCode, UserPromo

@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "code_display",
        "discount_type_display",
        "amount_display",
        "max_redemptions_display",
        "current_redemptions_display",
        "end_date_display",
        "active_display",
    )
    search_fields = ("id", "code")
    ordering = ("-id",)

    def code_display(self, obj):
        return getattr(obj, "code", "-")
    code_display.short_description = "Code"
    code_display.admin_order_field = "code"

    def discount_type_display(self, obj):
        raw = getattr(obj, "discount_type", None)

        if raw is not None and hasattr(obj, "get_discount_type_display"):
            return obj.get_discount_type_display()
        return raw if raw is not None else "-"
    discount_type_display.short_description = "Discount Type"
    discount_type_display.admin_order_field = "discount_type"

    def amount_display(self, obj):
        val = getattr(obj, "amount", None)
        return val if val is not None else "-"
    amount_display.short_description = "Amount"
    amount_display.admin_order_field = "amount"

    def max_redemptions_display(self, obj):
        val = getattr(obj, "max_redemptions", None)
        return val if val is not None else "-"
    max_redemptions_display.short_description = "Max Redemptions"
    max_redemptions_display.admin_order_field = "max_redemptions"

    def current_redemptions_display(self, obj):
        return getattr(obj, "current_redemptions", 0)
    current_redemptions_display.short_description = "Used"

    def end_date_display(self, obj):
        val = getattr(obj, "end_date", None)
        return val if val else "-"
    end_date_display.short_description = "End Date"
    end_date_display.admin_order_field = "end_date"

    def active_display(self, obj):
        val = getattr(obj, "active", None)
        if val is None:
            end_date = getattr(obj, "end_date", None)
            return end_date is None or end_date > timezone.now().date()
        return bool(val)
    active_display.short_description = "Active"
    active_display.boolean = True

@admin.register(UserPromo)
class UserPromoAdmin(admin.ModelAdmin):
    """
    Admin for promo usages/assignments.
    """
    list_display = (
        "id",
        "user_display",
        "promo_display",
        "redeemed_at_display",
        "status_display",
    )
    search_fields = ("id", "user__username", "promo__code")
    ordering = ("-id",)

    def user_display(self, obj):
        if hasattr(obj, "user") and obj.user:
            return getattr(obj.user, "username", str(obj.user))
        if hasattr(obj, "customer") and obj.customer:
            return getattr(obj.customer, "username", str(obj.customer))
        return getattr(obj, "email", "-")
    user_display.short_description = "User"

    def promo_display(self, obj):
        p = getattr(obj, "promo", None)
        if not p:
            return "-"
        return getattr(p, "code", str(p))
    promo_display.short_description = "Promo"

    def redeemed_at_display(self, obj):
        val = getattr(obj, "redeemed_at", None)
        return timezone.localtime(val) if val else "-"
    redeemed_at_display.short_description = "Redeemed At"
    redeemed_at_display.admin_order_field = "redeemed_at"

    def status_display(self, obj):
        return "Redeemed" if getattr(obj, "redeemed_at", None) else "Pending"
    status_display.short_description = "Status"