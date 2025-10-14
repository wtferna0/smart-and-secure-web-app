from django.db import models
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from django.contrib.auth.models import User

class CrowdSnapshot(models.Model):
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    level = models.PositiveIntegerField()
    source = models.CharField(max_length=16, default="system")  # system|manual|ml

    def __str__(self):
        return f"{self.level} @ {self.timestamp} ({self.source})"

class CrowdOverride(models.Model):
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    level = models.PositiveIntegerField()
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    ttl_minutes = models.PositiveIntegerField(default=30)

    @property
    def expires_at(self):
        return self.created_at + timedelta(minutes=self.ttl_minutes)

    def is_active(self):
        return timezone.now() < self.expires_at

    def __str__(self):
        return f"Override {self.level} by {self.staff} until {self.expires_at:%H:%M}"