from django.db import models
from django.contrib.auth.models import User

class MenuCategory(models.Model):
    name = models.CharField(max_length=80)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class MenuItem(models.Model):
    category = models.ForeignKey(MenuCategory, on_delete=models.PROTECT, related_name="items")
    name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    stock_qty = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)


    def __str__(self):
        return self.name

class ItemStockMovement(models.Model):
    class Reason(models.TextChoices):
        ADJUST = "ADJUST", "Adjust"
        PURCHASE = "PURCHASE", "Purchase"
        REFUND = "REFUND", "Refund"
        CORRECTION = "CORRECTION", "Correction"
        WASTAGE = "WASTAGE", "Wastage"

    menu_item = models.ForeignKey("catalog.MenuItem", on_delete=models.PROTECT)
    delta_qty = models.IntegerField()  # +in / -out
    reason = models.CharField(max_length=16, choices=Reason.choices, default=Reason.ADJUST)
    ref_order = models.ForeignKey("orders.Order", null=True, blank=True, on_delete=models.SET_NULL)
    note = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)


    class Meta:
        indexes = [
            models.Index(fields=["menu_item", "created_at"]),
            models.Index(fields=["reason"]),
        ]

    def __str__(self):
        return f"{self.menu_item} {self.delta_qty} ({self.reason})"
