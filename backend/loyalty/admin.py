# loyalty/admin.py
from django.contrib import admin
from django.db.models import Count
from django.utils import timezone

from .models import PromoCode, UserPromo


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    """
    Shows a rich table for PromoCode without assuming fields exist.
    Uses ModelAdmin methods so Django system checks pass even if your models
    change. If your model *does* have those fields, the admin will still work,
    and ordering will kick in thanks to admin_order_field.
    """
    list_display = (
        "id",
        "code_display",
        "type_display",
        "value_display",
        "max_uses_display",
        "used_count_display",
        "expires_at_display",
        "is_active_display",
    )
    search_fields = ("id", "code")
    ordering = ("-id",)

    # ---------- column helpers ----------
    def code_display(self, obj):
        return getattr(obj, "code", "-")
    code_display.short_description = "Code"
    code_display.admin_order_field = "code"

    def type_display(self, obj):
        # e.g., "PERCENT"/"AMOUNT" or whatever choices you use
        raw = getattr(obj, "type", None)
        # If it's a choices field and you want the human label:
        if raw is not None and hasattr(obj, "get_type_display"):
            return obj.get_type_display()
        return raw if raw is not None else "-"
    type_display.short_description = "Type"
    type_display.admin_order_field = "type"

    def value_display(self, obj):
        val = getattr(obj, "value", None)
        return val if val is not None else "-"
    value_display.short_description = "Value"
    value_display.admin_order_field = "value"

    def max_uses_display(self, obj):
        val = getattr(obj, "max_uses", None)
        return val if val is not None else "-"
    max_uses_display.short_description = "Max Uses"
    max_uses_display.admin_order_field = "max_uses"

    def used_count_display(self, obj):
        """
        Prefer explicit field 'used_count' if present.
        Otherwise compute from related UserPromo if relation exists.
        """
        # Case 1: model has a materialized 'used_count' field
        if hasattr(obj, "used_count"):
            return obj.used_count

        # Case 2: derive from related set if available
        # Common names: userpromo_set or a related_name like 'usages'
        if hasattr(obj, "userpromo_set"):
            return obj.userpromo_set.count()
        if hasattr(obj, "usages"):
            return obj.usages.count()

        return 0
    used_count_display.short_description = "Used"
    # No reliable order field unless 'used_count' exists
    # used_count_display.admin_order_field = "used_count"

    def expires_at_display(self, obj):
        val = getattr(obj, "expires_at", None)
        return timezone.localtime(val) if val else "-"
    expires_at_display.short_description = "Expires"
    expires_at_display.admin_order_field = "expires_at"

    def is_active_display(self, obj):
        # Optional convenience
        val = getattr(obj, "is_active", None)
        if val is None:
            # Derive from expiry if no explicit flag
            expires = getattr(obj, "expires_at", None)
            return expires is None or expires > timezone.now()
        return bool(val)
    is_active_display.short_description = "Active"
    is_active_display.boolean = True

    # ---------- Optional filters (ENABLE ONLY if these fields exist) ----------
    # list_filter = ("type", "is_active", "expires_at")   # uncomment if model has them


@admin.register(UserPromo)
class UserPromoAdmin(admin.ModelAdmin):
    """
    Admin for promo usages/assignments.
    """
    list_display = (
        "id",
        "user_display",
        "promo_display",
        "applied_at_display",
        "status_display",
    )
    search_fields = ("id", "user__username", "promo__code")
    ordering = ("-id",)

    def user_display(self, obj):
        # Works with FK named 'user' or 'customer'; shows readable value
        if hasattr(obj, "user") and obj.user:
            return getattr(obj.user, "username", str(obj.user))
        if hasattr(obj, "customer") and obj.customer:
            return getattr(obj.customer, "username", str(obj.customer))
        return "-"
    user_display.short_description = "User"

    def promo_display(self, obj):
        p = getattr(obj, "promo", None)
        if not p:
            return "-"
        return getattr(p, "code", str(p))
    promo_display.short_description = "Promo"

    def applied_at_display(self, obj):
        val = getattr(obj, "applied_at", None)
        return timezone.localtime(val) if val else "-"
    applied_at_display.short_description = "Applied At"
    applied_at_display.admin_order_field = "applied_at"

    def status_display(self, obj):
        # Optional: show redeemed/unused if you track it
        if hasattr(obj, "status"):
            # If it's a choices field:
            return obj.get_status_display() if hasattr(obj, "get_status_display") else obj.status
        # Derive a simple status from 'applied_at'
        return "Redeemed" if getattr(obj, "applied_at", None) else "Pending"
    status_display.short_description = "Status"

    # Enable only when these fields exist
    # list_filter = ("status", "applied_at")  # uncomment if your model has them
