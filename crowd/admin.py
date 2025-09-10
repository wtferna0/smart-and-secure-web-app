# crowd/admin.py
from django.contrib import admin
from .models import CrowdSnapshot

@admin.register(CrowdSnapshot)
class CrowdSnapshotAdmin(admin.ModelAdmin):
    # keep it barebones for now
    list_display = ("id",)   # only show the PK
    ordering = ("-id",)      # newest first
    # no filters, no search, no custom columns yet
    pass
