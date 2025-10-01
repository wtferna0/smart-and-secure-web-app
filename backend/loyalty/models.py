from django.db import models
from django.contrib.auth.models import User
# NEW: needed by is_valid()
from django.utils import timezone


class PromoCode(models.Model):
    class Type(models.TextChoices):
        PERCENT = "PERCENT"
        AMOUNT  = "AMOUNT"

    code             = models.CharField(max_length=40, unique=True)
    discount_type    = models.CharField(max_length=10, choices=Type.choices, default=Type.AMOUNT)
    amount           = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_order_total  = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # CHANGED: was IntegerField/null -> PositiveIntegerField with default
    max_redemptions      = models.PositiveIntegerField(default=1)
    # NEW: track how many times used
    current_redemptions  = models.PositiveIntegerField(default=0)

    # CHANGED: was is_active -> active (BooleanField)
    active           = models.BooleanField(default=True)

    # CHANGED: was starts_at/ends_at (DateTimeField) -> start_date/end_date (DateField)
    start_date       = models.DateField()
    end_date         = models.DateField()

    def __str__(self):
        return self.code

    # NEW: validity helper used by services
    def is_valid(self):
        if not self.active:
            return False
        today = timezone.now().date()
        if self.start_date and today < self.start_date:
            return False
        if self.end_date and today > self.end_date:
            return False
        return True


class UserPromo(models.Model):
    promo  = models.ForeignKey(PromoCode, on_delete=models.PROTECT)
    # one promo per order
    order  = models.OneToOneField("orders.Order", on_delete=models.CASCADE)
    # guest = NULL
    user   = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "promo"])]

    def __str__(self):
        return f"{self.promo.code} -> {self.order.order_token}"
