# accounts/models.py
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=120, blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True, null=True)

    # new field for contact email (redundant but useful)
    contact_email = models.EmailField(blank=True, null=True)

    # Loyalty inside user
    points_balance = models.IntegerField(default=0)
    
    # 🆕 ADD THESE MISSING FIELDS:
    total_points_earned = models.IntegerField(default=0)
    total_points_redeemed = models.IntegerField(default=0)
    
    default_currency = models.CharField(max_length=3, default="LKR")
    marketing_opt_in = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name or self.user.username

    @property
    def paid_order_count(self):
        """
        Dynamically calculate paid orders count from orders_order table
        Counts orders that are PLACED, ACCEPTED, or DONE (considered paid/completed)
        """
        try:
            from orders.models import Order
            # Orders that are considered "paid" - adjust as needed for your business logic
            PAID_STATUSES = [
                Order.Status.PLACED,      # Order has been placed (usually after payment)
                Order.Status.ACCEPTED,    # Order accepted by merchant
                Order.Status.DONE,        # Order completed
            ]
            return Order.objects.filter(
                customer_id=self.user_id, 
                status__in=PAID_STATUSES
            ).count()
        except ImportError:
            # Fallback if orders app is not available or not installed
            return 0
        except Exception as e:
            # Handle any other exceptions gracefully
            return 0


class AuditLog(models.Model):
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=60)                 # e.g. ORDER_STATUS_UPDATE
    object_type = models.CharField(max_length=40)            # e.g. "order"
    object_id = models.CharField(max_length=64)              # e.g. order_token or row id
    ip = models.CharField(max_length=45, blank=True, null=True)
    meta = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["object_type", "object_id"]),
            models.Index(fields=["actor", "created_at"]),
        ]

    def __str__(self):
        return f"{self.action} {self.object_type} {self.object_id}"