# puzzle/adapters.py - UPDATED VERSION with start_date
"""Loyalty integration for puzzle game - FIXED version"""
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
    Award loyalty and create actual promo codes in database
    FIXED VERSION with start_date
    """
    awarded_points = 0
    promo_code = _generate_promo_code()
    
    print(f"🎯 award_loyalty called with: email={email}, points={points}, grid_size={grid_size}")
    
    try:
        # Import models inside try block
        from django.apps import apps
        PromoCode = apps.get_model('loyalty', 'PromoCode')
        UserPromo = apps.get_model('loyalty', 'UserPromo')
        User = apps.get_model('auth', 'User')
        
        print("✅ Successfully imported loyalty models")
        
        # Calculate promo code value
        promo_values = {3: 50, 4: 100, 5: 150}
        promo_amount = promo_values.get(grid_size, 50)
        
        print(f"🎁 Creating promo code: {promo_code} with amount: {promo_amount}")
        
        # Create the promo code - WITH START_DATE
        promo = PromoCode.objects.create(
            code=promo_code,
            discount_type='AMOUNT',  # Use string directly
            amount=promo_amount,
            min_order_total=promo_amount * 2,
            active=True,
            is_puzzle_reward=True,
            start_date=timezone.now().date(),  # ADD THIS REQUIRED FIELD
            end_date=timezone.now().date() + timedelta(days=30),
            max_redemptions=1,
            current_redemptions=0
        )
        
        print(f"✅ SUCCESS: Created promo code in database: {promo.code}")
        
        # Find user by email if provided
        user = None
        if email:
            try:
                user = User.objects.filter(email=email).first()
                print(f"🔍 User lookup for {email}: {user}")
            except Exception as e:
                print(f"❌ User lookup failed: {e}")
        
        # Create UserPromo record
        if user:
            UserPromo.objects.create(
                promo=promo,
                user=user,
                is_puzzle_reward=True
            )
            print(f"✅ Assigned promo code to user: {user.username}")
        elif email:
            UserPromo.objects.create(
                promo=promo,
                email=email,
                is_puzzle_reward=True
            )
            print(f"✅ Assigned promo code to email: {email}")
        else:
            # Still create UserPromo even without email/user
            UserPromo.objects.create(
                promo=promo,
                is_puzzle_reward=True
            )
            print("✅ Created standalone UserPromo record")
        
        # Award points to user if they exist and qualify
        if user:
            try:
                from accounts.models import UserProfile
                profile = user.profile
                if profile.paid_order_count >= 3:
                    profile.points_balance += points
                    profile.save(update_fields=['points_balance'])
                    awarded_points = points
                    print(f"✅ Awarded {points} points to user: {user.username}")
            except Exception as e:
                print(f"⚠️ Could not award points: {e}")
        
        print(f"🎉 SUCCESS: Puzzle reward completed - Code: {promo_code}, Points: {awarded_points}")
        return (awarded_points, promo_code)
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR in award_loyalty: {e}")
        import traceback
        traceback.print_exc()
        # Return the code anyway so user gets something
        return (0, promo_code)