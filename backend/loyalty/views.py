from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from .models import PromoCode, UserPromo
from django.contrib.auth.models import User 
from rest_framework.permissions import IsAuthenticated
from .services import PointsService

class ApplyPromoCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            code = request.data.get('code', '').strip().upper()
            order_total = float(request.data.get('order_total', 0))
            user_email = request.data.get('email', '')
            
            if not code:
                return Response({"error": "Promo code is required"}, status=400)
            
            # Find the promo code
            try:
                promo = PromoCode.objects.get(code__iexact=code)
            except PromoCode.DoesNotExist:
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
            
            # Check redemption limits
            if promo.max_redemptions and promo.current_redemptions >= promo.max_redemptions:
                # Disable the promo code if max redemptions reached
                promo.active = False
                promo.save()
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
                # Registered user check - only count REDEEMED promos
                user_promo_count = UserPromo.objects.filter(
                    promo=promo, 
                    user=user,
                    order__isnull=False  # Only count ones that were actually used in orders
                ).count()
            elif user_email:
                # Guest user check by email - only count REDEEMED promos
                user_promo_count = UserPromo.objects.filter(
                    promo=promo, 
                    email=user_email,
                    order__isnull=False  # Only count ones that were actually used in orders
                ).count()
            
            if user_promo_count >= 1:
                return Response({"error": "You have already used this promo code in a previous order"}, status=400)
            
            # Calculate discount
            if promo.discount_type == PromoCode.Type.PERCENT:
                discount = order_total * (promo.amount / 100)
            else: 
                discount = min(float(promo.amount), order_total)
            
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
            return Response({"error": "Invalid order total format"}, status=400)
        except Exception as e:
            return Response({"error": f"Failed to apply promo code: {str(e)}"}, status=400)

class RedeemPromoCodeView(APIView):
    """Redeem the promo code when order is paid"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            code = request.data.get('code', '').strip().upper()
            order_id = request.data.get('order_id')
            user_email = request.data.get('email', '')
            
            if not code or not order_id:
                return Response({"error": "Code and order_id are required"}, status=400)
            
            # Find the promo code
            try:
                promo = PromoCode.objects.get(code__iexact=code)
            except PromoCode.DoesNotExist:
                return Response({"error": "Invalid promo code"}, status=400)
            
            # Get the order
            from orders.models import Order
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return Response({"error": "Order not found"}, status=400)
            
            if not promo.active:
                return Response({"error": "This promo code is no longer active"}, status=400)
            
            if promo.max_redemptions and promo.current_redemptions >= promo.max_redemptions:
                return Response({"error": "This promo code has reached its usage limit"}, status=400)

            promo.current_redemptions += 1
            
            if promo.max_redemptions and promo.current_redemptions >= promo.max_redemptions:
                promo.active = False
                print(f"🔒 Disabling promo code {promo.code} - max redemptions reached")
            
            promo.save()
            
            user = request.user if request.user.is_authenticated else None
            user_promo = UserPromo.objects.create(
                promo=promo,
                user=user if user else None,
                email=user_email if not user and user_email else None,
                order=order,  
                redeemed_at=timezone.now(),
                is_puzzle_reward=promo.is_puzzle_reward
            )
            
            return Response({
                "success": True,
                "message": f"Promo code {code} redeemed for order #{order.id}"
            })
            
        except Exception as e:
            print(f"❌ Error redeeming promo code: {e}")
            return Response({"error": f"Failed to redeem promo code: {str(e)}"}, status=400)

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
            
            # Get order object if order_id provided
            order = None
            if order_id:
                from orders.models import Order
                try:
                    order = Order.objects.get(id=order_id)
                except Order.DoesNotExist:
                    pass
            
            # Redeem points
            transaction = PointsService.redeem_points(
                user=request.user,
                points=points,
                order=order,
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

class UserPromosView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all promo codes earned by the current user"""
        try:
            user_promos = UserPromo.objects.filter(user=request.user).select_related('promo')
            
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
            
            return Response(promos_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)