# loyalty/services.py
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
        """Get or create user profile with points fields - SINGLE VERSION"""
        try:
            print(f"🔍 DEBUG: get_user_profile called for {user.email}")
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            if created:
                print(f"🔍 DEBUG: Created new UserProfile for {user.email}")
            else:
                print(f"🔍 DEBUG: Found existing UserProfile for {user.email}")
            
            # 🆕 SAFELY initialize fields (don't assume they exist)
            fields_to_check = ['points_balance', 'total_points_earned', 'total_points_redeemed']
            needs_save = False
            
            for field in fields_to_check:
                if not hasattr(profile, field):
                    print(f"🔍 DEBUG: Initializing {field} to 0")
                    setattr(profile, field, 0)
                    needs_save = True
            
            if needs_save:
                profile.save()
                print(f"🔍 DEBUG: Saved UserProfile with initialized fields")
            
            print(f"🔍 DEBUG: Final profile state:")
            print(f"  - points_balance: {getattr(profile, 'points_balance', 'N/A')}")
            print(f"  - total_points_earned: {getattr(profile, 'total_points_earned', 'N/A')}")
            print(f"  - total_points_redeemed: {getattr(profile, 'total_points_redeemed', 'N/A')}")
            
            return profile
            
        except Exception as e:
            print(f"🔍 DEBUG: Error in get_user_profile: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    @staticmethod
    def award_points(user, points, source, order=None, description=""):
        """Award points to a user with transaction tracking"""
        try:
            print(f"🔍 DEBUG: award_points called for user {user.email}")
            print(f"🔍 DEBUG: Points to award: {points}, Source: {source}")
            
            with transaction.atomic():
                print(f"🔍 DEBUG: Getting user profile...")
                profile = PointsService.get_user_profile(user)
                print(f"🔍 DEBUG: Current points balance: {profile.points_balance}")
                
                # Update points balance
                old_balance = profile.points_balance
                profile.points_balance += points
                
                # 🆕 SAFELY update total_points_earned (handle missing field)
                try:
                    current_earned = getattr(profile, 'total_points_earned', 0)
                    profile.total_points_earned = current_earned + points
                    print(f"🔍 DEBUG: Updated total_points_earned: {profile.total_points_earned}")
                except AttributeError:
                    print(f"⚠️ WARNING: total_points_earned field not found, skipping...")
                
                print(f"🔍 DEBUG: New points balance: {profile.points_balance}")
                
                print(f"🔍 DEBUG: Saving profile...")
                profile.save()
                print(f"🔍 DEBUG: Profile saved successfully")
                
                # Create transaction record
                print(f"🔍 DEBUG: Creating PointsTransaction...")
                transaction_obj = PointsTransaction.objects.create(
                    user=user,
                    points=points,
                    transaction_type='earned',
                    source=source,
                    order=order,
                    description=description,
                    balance_after=profile.points_balance
                )
                print(f"🔍 DEBUG: PointsTransaction created: {transaction_obj.id}")
                
                # Verify the points were actually saved
                profile.refresh_from_db()
                print(f"🔍 DEBUG: Verified points balance after save: {profile.points_balance}")
                
                logger.info(f"✅ Awarded {points} points to {user.email} from {source}. New balance: {profile.points_balance}")
                return transaction_obj
                
        except Exception as e:
            logger.error(f"❌ Failed to award points to {user.email}: {e}")
            print(f"🔍 DEBUG: Exception in award_points: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    @staticmethod
    def redeem_points(user, points, order=None, description=""):
        """Redeem points from a user's balance"""
        try:
            print(f"🔍 DEBUG: redeem_points called for user {user.email}")
            print(f"🔍 DEBUG: Points to redeem: {points}")
            
            with transaction.atomic():
                profile = PointsService.get_user_profile(user)
                print(f"🔍 DEBUG: Current points balance: {profile.points_balance}")
                
                if profile.points_balance < points:
                    raise ValueError(f"Insufficient points. Available: {profile.points_balance}, Requested: {points}")
                
                # Update points balance
                profile.points_balance -= points
                
                # 🆕 SAFELY update total_points_redeemed
                try:
                    current_redeemed = getattr(profile, 'total_points_redeemed', 0)
                    profile.total_points_redeemed = current_redeemed + points
                    print(f"🔍 DEBUG: Updated total_points_redeemed: {profile.total_points_redeemed}")
                except AttributeError:
                    print(f"⚠️ WARNING: total_points_redeemed field not found, skipping...")
                
                profile.save()
                print(f"🔍 DEBUG: Profile saved after redemption")
                
                # Create transaction record
                transaction_obj = PointsTransaction.objects.create(
                    user=user,
                    points=-points,  # Negative for redemption
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
            print(f"🔍 DEBUG: Exception in redeem_points: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    @staticmethod
    def calculate_order_points(order_total, user):
        """Calculate points earned from an order"""
        print(f"🔍 DEBUG: calculate_order_points called - order_total: {order_total}")
        
        # Base points: 5% of order value
        base_points = max(1, int(order_total * 0.05))
        print(f"🔍 DEBUG: Base points (5%): {base_points}")
        
        # Check if this is user's first paid order
        profile = PointsService.get_user_profile(user)
        is_first_order = getattr(profile, 'paid_order_count', 0) == 0
        
        if is_first_order:
            base_points += 100  # First order bonus
            print(f"🔍 DEBUG: First order bonus: +100 points")
        
        # Tier bonuses
        if order_total > 1000:
            base_points += 50  # Big spender bonus
            print(f"🔍 DEBUG: Big spender bonus: +50 points")
        elif order_total > 500:
            base_points += 25  # Medium spender bonus
            print(f"🔍 DEBUG: Medium spender bonus: +25 points")
        
        final_points = max(base_points, 10)  # Minimum 10 points
        print(f"🔍 DEBUG: Final calculated points: {final_points}")
        
        return final_points
    
    @staticmethod
    def process_order_points(user, order_total, order):
        """Process points for a completed order"""
        try:
            print(f"🔍 DEBUG: process_order_points called for order #{order.id}")
            points_earned = PointsService.calculate_order_points(order_total, user)
            
            # Award points
            PointsService.award_points(
                user=user,
                points=points_earned,
                source='purchase',
                order=order,
                description=f"Points earned from order #{order.id}"
            )
            
            logger.info(f"📦 Processed {points_earned} points for order #{order.id} for {user.email}")
            return points_earned
            
        except Exception as e:
            logger.error(f"❌ Failed to process order points for {user.email}: {e}")
            print(f"🔍 DEBUG: Exception in process_order_points: {e}")
            import traceback
            traceback.print_exc()
            return 0