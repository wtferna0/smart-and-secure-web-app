from django.db import models
from django.contrib.auth.models import User

class CrowdSnapshot(models.Model):
    set_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    as_of = models.DateTimeField(auto_now_add=True)
    level = models.PositiveSmallIntegerField(default=1)   # 1..5
    orders_in_last_30m = models.IntegerField(default=0)
    note = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        indexes = [models.Index(fields=["as_of"])]

    def __str__(self):
        return f"{self.as_of:%Y-%m-%d %H:%M} -> {self.level}"
