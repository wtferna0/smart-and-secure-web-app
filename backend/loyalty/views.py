# loyalty/views.py - UPDATE to use correct field names
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from .models import PromoCode, UserPromo
from django.contrib.auth.models import User 
from rest_framework.permissions import IsAuthenticated
from .services import PointsService

# In loyalty/views.py - Update the ApplyPromoCodeView class
class ApplyPromoCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            code = request.data.get('code', '').strip().upper()
            order_total = float(request.data.get('order_total', 0))
            user_email = request.data.get('email', '')
            
            print(f"🔍 Applying promo code: {code}, order_total: {order_total}, email: {user_email}")
            
            if not code:
                return Response({"error": "Promo code is required"}, status=400)
            
            # Find the promo code
            try:
                promo = PromoCode.objects.get(code__iexact=code)
                print(f"✅ Found promo code: {promo.code}, active: {promo.active}, current_redemptions: {promo.current_redemptions}/{promo.max_redemptions}")
            except PromoCode.DoesNotExist:
                print(f"❌ Promo code not found: {code}")
                return Response({"error": "Invalid promo code"}, status=400)
            
            # Check if promo code is active
            if not promo.active:
                return Response({"error": "This promo code is no longer active"}, status=400)
            
            # Check validity (dates and usage limits)
            now = timezone.now().date()
            if promo.start_date and now < promo.start_date:
                return Response({"error": "This promo code is not yet active"}, status=400)
            
            if promo.end_date and now > promo.end_date:
                return Response({"error": "This promo code has expired"}, status=400)
            
            # CHECK REDEMPTION LIMITS - SINGLE USE LOGIC
            if promo.max_redemptions:
                if promo.current_redemptions >= promo.max_redemptions:
                    # Auto-disable the promo code if max redemptions reached
                    promo.active = False
                    promo.save()
                    print(f"🔒 Auto-disabled promo code {promo.code} - max redemptions reached")
                    return Response({"error": "This promo code has reached its usage limit"}, status=400)
            
            # Check minimum order total
            if order_total < promo.min_order_total:
                return Response({
                    "error": f"Minimum order total LKR {promo.min_order_total:.2f} required for this promo"
                }, status=400)
            
            # Check per-user limit (prevent same user from using same code multiple times)
            user = request.user if request.user.is_authenticated else None
            user_promo_count = 0
            
            if user:
                # Registered user check
                user_promo_count = UserPromo.objects.filter(promo=promo, user=user).count()
            elif user_email:
                # Guest user check by email
                user_promo_count = UserPromo.objects.filter(promo=promo, email=user_email).count()
            
            if user_promo_count >= 1:
                return Response({"error": "You have already used this promo code"}, status=400)
            
            # Calculate discount
            if promo.discount_type == PromoCode.Type.PERCENT:
                discount = order_total * (promo.amount / 100)
            else:  # AMOUNT
                discount = min(float(promo.amount), order_total)
            
            print(f"✅ Promo code valid! Discount: LKR {discount:.2f}")
            
            # ✅ INCREMENT REDEMPTION COUNT - MARK AS USED
            promo.current_redemptions += 1
            print(f"📈 Incremented redemption count for {promo.code}: {promo.current_redemptions}/{promo.max_redemptions}")
            
            # If this was the last redemption, disable the promo
            if promo.max_redemptions and promo.current_redemptions >= promo.max_redemptions:
                promo.active = False
                print(f"🔒 Disabling promo code {promo.code} - max redemptions reached")
            
            promo.save()
            
            # Create UserPromo record to track this usage
            user_promo = UserPromo.objects.create(
                promo=promo,
                user=user if user else None,
                email=user_email if not user and user_email else None,
                is_puzzle_reward=promo.is_puzzle_reward
            )
            
            print(f"📝 Created UserPromo record: {user_promo.id}")
            
            return Response({
                "success": True,
                "code": promo.code,
                "discount_type": promo.discount_type,
                "discount_amount": discount,
                "promo_amount": float(promo.amount),
                "min_order_total": float(promo.min_order_total),
                "message": f"Promo code applied! Discount: LKR {discount:.2f}",
                "remaining_redemptions": promo.max_redemptions - promo.current_redemptions if promo.max_redemptions else None
            })
            
        except ValueError as e:
            print(f"❌ Value error: {e}")
            return Response({"error": "Invalid order total format"}, status=400)
        except Exception as e:
            print(f"❌ Unexpected error applying promo code: {e}")
            return Response({"error": f"Failed to apply promo code: {str(e)}"}, status=400)

class DebugPromoView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Debug endpoint to check all promo codes"""
        try:
            promos = PromoCode.objects.all()
            promo_list = []
            
            for promo in promos:
                promo_list.append({
                    'id': promo.id,
                    'code': promo.code,
                    'type': promo.discount_type,
                    'amount': float(promo.amount),
                    'min_order': float(promo.min_order_total),
                    'active': promo.active,
                    'is_valid': promo.is_valid,
                    'is_puzzle_reward': promo.is_puzzle_reward,
                    'start_date': promo.start_date.isoformat() if promo.start_date else None,
                    'end_date': promo.end_date.isoformat() if promo.end_date else None,
                    'max_redemptions': promo.max_redemptions,
                    'current_redemptions': promo.current_redemptions
                })
            
            return Response({
                'total_promos': len(promo_list),
                'promos': promo_list
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class TestPromoCreationView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Test if we can create promo codes in the database"""
        try:
            from django.utils import timezone
            from datetime import timedelta
            import random
            import string
            
            # Generate a test promo code
            test_code = "TEST" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
            
            print(f"🧪 Testing promo code creation: {test_code}")
            
            # Try to create a promo code WITH start_date
            promo = PromoCode.objects.create(
                code=test_code,
                discount_type='AMOUNT',
                amount=50,
                min_order_total=100,
                active=True,
                is_puzzle_reward=True,
                start_date=timezone.now().date(),  # ADD THIS LINE - FIXES THE ERROR
                end_date=timezone.now().date() + timedelta(days=30),
                max_redemptions=1,
                current_redemptions=0
            )
            
            print(f"✅ SUCCESS: Created test promo code: {promo.code}")
            
            # Verify it exists
            exists = PromoCode.objects.filter(code=test_code).exists()
            
            return Response({
                'success': True,
                'message': f'Test promo code {test_code} created successfully',
                'exists_in_db': exists,
                'test_code': test_code
            })
            
        except Exception as e:
            print(f"❌ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

class UserPointsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's points summary"""
        try:
            summary = PointsService.get_user_points_summary(request.user)
            return Response(summary)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class RedeemPointsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Redeem points for discount"""
        try:
            points = int(request.data.get('points', 0))
            order_id = request.data.get('order_id')
            
            if points <= 0:
                return Response({'error': 'Invalid points amount'}, status=400)
            
            # Redeem points
            transaction = PointsService.redeem_points(
                user=request.user,
                points=points,
                order_id=order_id,
                description="Points redeemed for order discount"
            )
            
            return Response({
                'success': True,
                'points_redeemed': points,
                'new_balance': transaction.balance_after,
                'message': f'Successfully redeemed {points} points'
            })
            
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            return Response({'error': f'Failed to redeem points: {str(e)}'}, status=400)

# Add this to loyalty/views.py
class UserPromosView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all promo codes earned by the current user"""
        try:
            user_promos = UserPromo.objects.filter(user=request.user).select_related('promo')
            
            # Format the response to match frontend expectations
            promos_data = []
            for user_promo in user_promos:
                promo_data = {
                    'id': user_promo.id,
                    'promo_code': user_promo.promo.code,
                    'promo_discount_type': user_promo.promo.discount_type,
                    'promo_amount': float(user_promo.promo.amount),
                    'redeemed_at': user_promo.redeemed_at.isoformat() if user_promo.redeemed_at else None,
                    'is_puzzle_reward': user_promo.is_puzzle_reward,
                    'created_at': user_promo.created_at.isoformat(),
                    # Include full promo object for frontend
                    'promo': {
                        'id': user_promo.promo.id,
                        'code': user_promo.promo.code,
                        'discount_type': user_promo.promo.discount_type,
                        'amount': float(user_promo.promo.amount),
                        'min_order_total': float(user_promo.promo.min_order_total),
                        'active': user_promo.promo.active,
                        'start_date': user_promo.promo.start_date.isoformat() if user_promo.promo.start_date else None,
                        'end_date': user_promo.promo.end_date.isoformat() if user_promo.promo.end_date else None,
                        'max_redemptions': user_promo.promo.max_redemptions,
                        'current_redemptions': user_promo.promo.current_redemptions,
                        'is_puzzle_reward': user_promo.promo.is_puzzle_reward,
                        'puzzle_points_required': user_promo.promo.puzzle_points_required
                    }
                }
                promos_data.append(promo_data)
            
            print(f"✅ Found {len(promos_data)} promo codes for user {request.user.email}")
            return Response(promos_data)
            
        except Exception as e:
            print(f"❌ Error fetching user promos: {e}")
            return Response({'error': str(e)}, status=400)