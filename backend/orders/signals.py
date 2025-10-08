# orders/signals.py (create this file)
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps
from .models import Order

@receiver(post_save, sender=Order)
def handle_order_completion(sender, instance, created, **kwargs):
    """
    Handle loyalty points when order is completed
    Only award points if:
    - Order is completed
    - User is authenticated
    - User has 3+ paid orders (now including this one)
    - No points were redeemed in this order
    """
    if instance.status == Order.Status.COMPLETED and instance.customer:
        try:
            UserProfile = apps.get_model('accounts', 'UserProfile')
            profile = instance.customer.profile
            
            # Check if this order qualifies for points
            # User needs 3+ paid orders AFTER this one is completed
            paid_orders_count = profile.paid_order_count
            
            # Award points only if:
            # 1. No points were redeemed in this order
            # 2. User now has 3+ paid orders
            if instance.points_redeemed == 0 and paid_orders_count >= 3:
                # Points were already calculated at order creation (5% of total)
                # Just ensure they're added to balance
                if instance.points_earned > 0:
                    profile.points_balance += instance.points_earned
                    profile.save(update_fields=['points_balance'])
                    
        except Exception as e:
            print(f"Error processing loyalty points for order {instance.id}: {e}")