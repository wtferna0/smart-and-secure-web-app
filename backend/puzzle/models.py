from django.db import models

class PuzzleSession(models.Model):
    email = models.EmailField(blank=True, null=True)
    grid_size = models.PositiveSmallIntegerField(default=3)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    moves = models.PositiveIntegerField(default=0)
    time_ms = models.PositiveIntegerField(default=0)
    points_awarded = models.IntegerField(default=0)
    reward_code = models.CharField(max_length=32, blank=True, default="")
    def __str__(self): return f"PuzzleSession #{self.id} ({self.grid_size}x{self.grid_size})"
