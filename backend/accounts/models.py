from django.db import models
from django.contrib.auth.models import User
from django.apps import apps

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=120, blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    points_balance = models.IntegerField(default=0)
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
            Order = apps.get_model('orders', 'Order')
            
            PAID_STATUSES = [
                Order.Status.PLACED,      # Order has been placed
                Order.Status.ACCEPTED,    # Order accepted by merchant
                Order.Status.DONE,        # Order completed
            ]
            
            return Order.objects.filter(
                customer_id=self.user_id, 
                status__in=PAID_STATUSES
            ).count()
        except LookupError:
            return 0
        except Exception as e:
            logger.error(f"Error calculating paid_order_count: {e}")
            return 0


class AuditLog(models.Model):
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=60)                
    object_type = models.CharField(max_length=40)            
    object_id = models.CharField(max_length=64)             
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