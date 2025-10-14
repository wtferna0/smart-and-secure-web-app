from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Payment(models.Model):
    class Provider(models.TextChoices):
        PAYHERE = "PAYHERE", "PayHere"
        STRIPE = "STRIPE", "Stripe"
        MOCK = "MOCK", "Mock"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    provider = models.CharField(max_length=16, choices=Provider.choices, default=Provider.PAYHERE)
    payment_ref = models.CharField(max_length=80, unique=True)  # gateway txn id
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="LKR")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    raw_payload = models.JSONField(default=dict, blank=True)

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="payments",
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["provider", "payment_ref"]),
            models.Index(fields=["status"]),
            models.Index(fields=["order", "created_at"]),
        ]

    def __str__(self):
        return f"{self.provider}:{self.payment_ref}"