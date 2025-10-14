from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps
import logging
from .models import Order

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Order)
def handle_order_completion(sender, instance, created, **kwargs):
    if instance.status == Order.Status.COMPLETED and instance.customer:
        try:
            UserProfile = apps.get_model('accounts', 'UserProfile')
            profile = instance.customer.profile
            
            # Get paid orders count
            paid_orders_count = Order.objects.filter(
                customer=instance.customer, 
                status=Order.Status.COMPLETED
            ).count()

            if instance.points_redeemed == 0 and paid_orders_count >= 3:
                if instance.points_earned > 0:
                    profile.points_balance += instance.points_earned
                    profile.save(update_fields=['points_balance'])
                    logger.info(f"Added {instance.points_earned} points to user {instance.customer.username}")
                    
        except Exception as e:
            logger.error(f"Error processing loyalty points for order {instance.id}: {e}")