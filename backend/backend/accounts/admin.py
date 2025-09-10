from django.contrib import admin
from .models import UserProfile, AuditLog

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "display_name", "contact_email", "points_balance", "paid_order_count")
    search_fields = ("user__username", "contact_email")

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "object_type", "object_id", "actor", "created_at")
    list_filter = ("object_type", "action")
