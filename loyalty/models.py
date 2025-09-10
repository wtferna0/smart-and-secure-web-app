from django.db import models
from django.contrib.auth.models import User

class PromoCode(models.Model):
    class Type(models.TextChoices):
        PERCENT = "PERCENT"
        AMOUNT = "AMOUNT"

    code = models.CharField(max_length=40, unique=True)
    discount_type = models.CharField(max_length=10, choices=Type.choices, default=Type.AMOUNT)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_order_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    starts_at = models.DateTimeField(blank=True, null=True)
    ends_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    max_redemptions = models.IntegerField(blank=True, null=True)
    per_user_limit = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code

class UserPromo(models.Model):
    promo = models.ForeignKey(PromoCode, on_delete=models.PROTECT)
    order = models.OneToOneField("orders.Order", on_delete=models.CASCADE)  # one promo per order
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)  # guest = NULL
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "promo"])]

    def __str__(self):
        return f"{self.promo.code} -> {self.order.order_token}"
