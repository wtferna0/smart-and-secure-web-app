import random
import string
from typing import Optional, Tuple
from django.utils import timezone
from datetime import timedelta

def _generate_promo_code() -> str:
    """Generate a unique puzzle reward promo code"""
    return "PUZZLE" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

def award_loyalty(email: Optional[str], points: int, grid_size: int) -> Tuple[int, str]:
    """
    Award loyalty and create promo codes in database
    """
    awarded_points = 0
    promo_code = _generate_promo_code()
    
    try:
        from django.apps import apps
        PromoCode = apps.get_model('loyalty', 'PromoCode')
        UserPromo = apps.get_model('loyalty', 'UserPromo')
        User = apps.get_model('auth', 'User')
        
        print("Successfully imported loyalty models")
        
        # Calculate promo code value
        promo_values = {3: 50, 4: 100, 5: 150}
        promo_amount = promo_values.get(grid_size, 50)
        
        # Create the promo code
        promo = PromoCode.objects.create(
            code=promo_code,
            discount_type='AMOUNT', 
            amount=promo_amount,
            min_order_total=promo_amount * 2,
            active=True,
            is_puzzle_reward=True,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=30),
            max_redemptions=1,
            current_redemptions=0
        )
        
        # Find user by email if provided
        user = None
        if email:
            try:
                user = User.objects.filter(email=email).first()
            except Exception as e:
                pass
        
        # Create UserPromo record
        if user:
            UserPromo.objects.create(
                promo=promo,
                user=user,
                is_puzzle_reward=True
            )
        elif email:
            UserPromo.objects.create(
                promo=promo,
                email=email,
                is_puzzle_reward=True
            )
        else:
            # Still create UserPromo even without email/user
            UserPromo.objects.create(
                promo=promo,
                is_puzzle_reward=True
            )
        
        # Award points to user if they exist and qualify
        if user:
            try:
                from accounts.models import UserProfile
                profile = user.profile
                if profile.paid_order_count >= 3:
                    profile.points_balance += points
                    profile.save(update_fields=['points_balance'])
                    awarded_points = points
            except Exception as e:
                pass

        return (awarded_points, promo_code)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return (0, promo_code)