from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import User
from accounts.models import UserProfile
from .models import PointsTransaction
import logging

logger = logging.getLogger(__name__)

class PointsService:
    
    @staticmethod
    def get_user_profile(user):
        """Get or create user profile with points fields"""
        try:
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            fields_to_check = ['points_balance', 'total_points_earned', 'total_points_redeemed', 'paid_order_count']
            needs_save = False
            
            for field in fields_to_check:
                if not hasattr(profile, field):
                    setattr(profile, field, 0)
                    needs_save = True
            
            if needs_save:
                profile.save()

            return profile
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise
    
    @staticmethod
    def get_user_points_summary(user):
        """Get user's points summary"""
        profile = PointsService.get_user_profile(user)
        
        return {
            'points_balance': getattr(profile, 'points_balance', 0),
            'total_points_earned': getattr(profile, 'total_points_earned', 0),
            'total_points_redeemed': getattr(profile, 'total_points_redeemed', 0),
        }
    
    @staticmethod
    def award_points(user, points, source, order=None, description=""):
        """Award points to a user with transaction tracking"""
        try:            
            with transaction.atomic():
                profile = PointsService.get_user_profile(user)
                
                old_balance = profile.points_balance
                profile.points_balance += points
                
                try:
                    current_earned = getattr(profile, 'total_points_earned', 0)
                    profile.total_points_earned = current_earned + points
                except AttributeError:
                    pass

                profile.save()
                
                # Create transaction record
                transaction_obj = PointsTransaction.objects.create(
                    user=user,
                    points=points,
                    transaction_type='earned',
                    source=source,
                    order=order,
                    description=description,
                    balance_after=profile.points_balance
                )

                profile.refresh_from_db()
                
                logger.info(f"✅ Awarded {points} points to {user.email} from {source}. New balance: {profile.points_balance}")
                return transaction_obj
                
        except Exception as e:
            logger.error(f"❌ Failed to award points to {user.email}: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    @staticmethod
    def redeem_points(user, points, order=None, description=""):
        """Redeem points from a user's balance"""
        try:
            with transaction.atomic():
                profile = PointsService.get_user_profile(user)
                
                if profile.points_balance < points:
                    raise ValueError(f"Insufficient points. Available: {profile.points_balance}, Requested: {points}")
                
                # Update points balance
                profile.points_balance -= points
                
                # SAFELY update total_points_redeemed
                try:
                    current_redeemed = getattr(profile, 'total_points_redeemed', 0)
                    profile.total_points_redeemed = current_redeemed + points
                except AttributeError:
                    pass
                
                profile.save()
                
                # Create transaction record
                transaction_obj = PointsTransaction.objects.create(
                    user=user,
                    points=-points, 
                    transaction_type='redeemed',
                    source='redemption',
                    order=order,
                    description=description,
                    balance_after=profile.points_balance
                )
                
                logger.info(f"✅ Redeemed {points} points from {user.email}. New balance: {profile.points_balance}")
                return transaction_obj
                
        except Exception as e:
            logger.error(f"❌ Failed to redeem points from {user.email}: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    @staticmethod
    def calculate_order_points(order_total, user, used_points=False, used_promo=False):
        """Calculate points earned from an order - NO POINTS if used points or promo"""
        
        if used_points or used_promo:
            return 0
        
        base_points = max(1, int(order_total * 0.05))
        
        profile = PointsService.get_user_profile(user)
        is_first_order = getattr(profile, 'paid_order_count', 0) == 0
        
        if is_first_order:
            base_points += 100
        
        if order_total > 1000:
            base_points += 50  # Big spender bonus
        elif order_total > 500:
            base_points += 25  # Medium spender bonus
        
        final_points = max(base_points, 10)  # Minimum 10 points
        
        return final_points
    
    @staticmethod
    def process_order_points(user, order_total, order, used_points=False, used_promo=False):
        """Process points for a completed order"""
        try:
            points_earned = PointsService.calculate_order_points(
                order_total, 
                user, 
                used_points=used_points, 
                used_promo=used_promo
            )
            
            if points_earned > 0:
                # Award points only if eligible
                PointsService.award_points(
                    user=user,
                    points=points_earned,
                    source='purchase',
                    order=order,
                    description=f"Points earned from order #{order.id}"
                )
                logger.info(f"📦 Processed {points_earned} points for order #{order.id} for {user.email}")
            else:
                logger.info(f"📦 No points awarded for order #{order.id} - used_points: {used_points}, used_promo: {used_promo}")
            
            return points_earned
            
        except Exception as e:
            logger.error(f"❌ Failed to process order points for {user.email}: {e}")
            import traceback
            traceback.print_exc()
            return 0