from django.db import models
from django.contrib.auth.models import User

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "PENDING_PAYMENT"
        PLACED = "PLACED"
        ACCEPTED = "ACCEPTED"
        DONE = "DONE"
        FAILED = "FAILED"
        CANCELLED = "CANCELLED"

    customer = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    order_token = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)
    guest_email = models.EmailField(blank=True, null=True)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    points_redeemed = models.IntegerField(default=0)
    points_earned = models.IntegerField(default=0)
    applied_promo_code = models.CharField(max_length=40, blank=True, null=True)

    placed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["customer", "placed_at"]),
        ]

    def __str__(self):
        return self.order_token

# orders/models.py
class OrderItem(models.Model):
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE)
    menu_item = models.ForeignKey('catalog.MenuItem', on_delete=models.PROTECT, null=True, blank=True)  # <- ensure this
    item_name = models.CharField(max_length=255)
    price_each = models.DecimalField(max_digits=10, decimal_places=2)
    qty = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=2)


    def __str__(self):
        return f"{self.item_name} x{self.qty}"

class OrderStatusEvent(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_events")
    changed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    from_status = models.CharField(max_length=20, blank=True, null=True)
    to_status = models.CharField(max_length=20)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["order", "created_at"])]

    def __str__(self):
        return f"{self.order.order_token}: {self.to_status}"
