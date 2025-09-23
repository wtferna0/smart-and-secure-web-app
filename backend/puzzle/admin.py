from django.contrib import admin
from .models import PuzzleSession

@admin.register(PuzzleSession)
class PuzzleSessionAdmin(admin.ModelAdmin):
    list_display = ("id","email","grid_size","moves","time_ms","points_awarded","reward_code","started_at","completed_at")
    search_fields = ("email","reward_code")
    list_filter = ("grid_size",)