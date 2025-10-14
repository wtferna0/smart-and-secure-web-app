from django.contrib import admin
from .models import CrowdSnapshot, CrowdOverride

@admin.register(CrowdSnapshot)
class CrowdSnapshotAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "level", "source")
    list_filter = ("source", "timestamp")
    ordering = ("-timestamp",)

@admin.register(CrowdOverride)
class CrowdOverrideAdmin(admin.ModelAdmin):
    list_display = ("staff", "level", "created_at", "expires_at", "is_active")
    list_filter = ("created_at",)
    ordering = ("-created_at",)