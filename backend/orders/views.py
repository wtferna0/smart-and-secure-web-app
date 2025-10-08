# orders/views.py
from django.db import transaction
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import Order, OrderItem, OrderStatusEvent
from .serializers import OrderCreateSerializer, OrderSerializer
from catalog.models import MenuItem

# Import the points service
try:
    from loyalty.services import PointsService
    from loyalty.models import PointsTransaction
    POINTS_ENABLED = True
    print("✅ Loyalty points system is available")
except ImportError as e:
    POINTS_ENABLED = False
    print(f"⚠️ Loyalty points system not available: {e}")

class OrderViewSet(mixins.CreateModelMixin,
                   mixins.RetrieveModelMixin,
                   mixins.ListModelMixin,
                   mixins.UpdateModelMixin,
                   viewsets.GenericViewSet):
    serializer_class = OrderSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            base_queryset = Order.objects.prefetch_related(
                'orderitem_set',
                'orderitem_set__menu_item',
                'customer'
            ).select_related('customer')
            
            if self.request.user.is_staff:
                orders = base_queryset.all().order_by("-placed_at")
            else:
                orders = base_queryset.filter(customer=self.request.user).order_by("-placed_at")
            
            return orders
        else:
            return Order.objects.none()

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                print(f"🔍 DEBUG: Starting order creation for user: {request.user.email if request.user.is_authenticated else 'Anonymous'}")
                
                create_serializer = OrderCreateSerializer(
                    data=request.data, 
                    context={'request': request}
                )
                create_serializer.is_valid(raise_exception=True)
                order = create_serializer.save()
                
                print(f"🔍 DEBUG: Order created successfully: {order.id}")
                print(f"🔍 DEBUG: Order total: {order.total}")
                print(f"🔍 DEBUG: User authenticated: {request.user.is_authenticated}")
                print(f"🔍 DEBUG: Points enabled: {POINTS_ENABLED}")
                
                # ✅ PROCESS LOYALTY POINTS IF USER IS AUTHENTICATED
                if request.user.is_authenticated and POINTS_ENABLED:
                    print("🔍 DEBUG: Processing order points...")
                    try:
                        self._process_order_points(request.user, order)
                    except Exception as e:
                        print(f"❌ Error in order points processing: {e}")
                        # Don't fail the order if points processing fails
                
                # ✅ PROCESS POINTS REDEMPTION IF APPLIED
                points_redeemed = request.data.get('points_redeemed', 0)
                if points_redeemed and request.user.is_authenticated and POINTS_ENABLED:
                    print(f"🔍 DEBUG: Processing points redemption: {points_redeemed} points")
                    try:
                        self._process_points_redemption(request.user, order, points_redeemed)
                    except Exception as e:
                        print(f"❌ Error in points redemption: {e}")
                        # Re-raise since this affects order total
                        raise
                
                response_serializer = OrderSerializer(order, context=self.get_serializer_context())
                response_data = response_serializer.data
                
                # Add points info to response
                if request.user.is_authenticated and POINTS_ENABLED:
                    from accounts.models import UserProfile
                    try:
                        profile = UserProfile.objects.get(user=request.user)
                        response_data['points_balance'] = profile.points_balance
                        print(f"🔍 DEBUG: Sending points_balance in response: {profile.points_balance}")
                        if hasattr(order, 'points_earned'):
                            response_data['points_earned'] = order.points_earned
                    except UserProfile.DoesNotExist:
                        print("🔍 DEBUG: UserProfile does not exist")
                        response_data['points_balance'] = 0
                    except Exception as e:
                        print(f"🔍 DEBUG: Error getting user profile: {e}")
                        response_data['points_balance'] = 0
                
                print(f"✅ Order creation completed successfully: {order.id}")
                return Response(response_data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            print(f"❌ Order creation failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Order creation failed: {str(e)}"}, 
                          status=status.HTTP_400_BAD_REQUEST)

    def _process_order_points(self, user, order):
        """Process points earning for any order immediately"""
        try:
            print(f"🔍 DEBUG: _process_order_points called for order {order.id}")
            print(f"🔍 DEBUG: Order total: {order.total}")
            
            # Calculate points based on order total (5% of total)
            points_earned = max(1, int(float(order.total) * 0.05))
            print(f"🔍 DEBUG: Calculated points to earn: {points_earned}")
            
            # Award points using PointsService
            PointsService.award_points(
                user=user,
                points=points_earned,
                source='purchase',
                order=order,
                description=f"Points earned for order #{order.id}"
            )
            
            # Store points earned on order for reference
            order.points_earned = points_earned
            order.save(update_fields=['points_earned'])
            print(f"🔍 DEBUG: Updated order points_earned to: {points_earned}")
            
            print(f"✅ Awarded {points_earned} points to {user.email} for order #{order.id}")
            
        except Exception as e:
            print(f"❌ Failed to process order points: {e}")
            import traceback
            traceback.print_exc()

    def _process_points_redemption(self, user, order, points_redeemed):
        """Process points redemption for an order"""
        try:
            points_redeemed = int(points_redeemed)
            print(f"🔍 DEBUG: _process_points_redemption called with {points_redeemed} points")
            
            if points_redeemed > 0:
                PointsService.redeem_points(
                    user=user,
                    points=points_redeemed,
                    order=order,
                    description=f"Points redeemed for order #{order.id}"
                )
                
                print(f"✅ Redeemed {points_redeemed} points from {user.email} for order #{order.id}")
                
        except Exception as e:
            print(f"❌ Failed to process points redemption: {e}")
            import traceback
            traceback.print_exc()
            raise  # Re-raise since this affects order total

    # ✅ Diagnostic endpoints
    @action(detail=False, methods=['get'])
    def diagnostic_points(self, request):
        """Diagnostic endpoint to check points system state"""
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)
        
        try:
            from accounts.models import UserProfile
            from loyalty.models import PointsTransaction
            
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            transactions = PointsTransaction.objects.filter(user=request.user).order_by('-created_at')
            
            diagnostic_info = {
                "user": request.user.email,
                "user_profile_exists": True,
                "user_profile_created": created,
                "current_points_balance": profile.points_balance,
                "total_points_earned": getattr(profile, 'total_points_earned', 'FIELD_MISSING'),
                "total_points_redeemed": getattr(profile, 'total_points_redeemed', 'FIELD_MISSING'),
                "points_transactions_count": transactions.count(),
                "recent_transactions": [
                    {
                        'id': t.id,
                        'points': t.points,
                        'type': t.transaction_type,
                        'source': t.source,
                        'description': t.description,
                        'balance_after': t.balance_after,
                        'created_at': t.created_at.isoformat()
                    }
                    for t in transactions[:5]
                ],
                "user_profile_fields": [f.name for f in UserProfile._meta.get_fields()]
            }
            
            return Response(diagnostic_info)
            
        except Exception as e:
            return Response({"error": f"Diagnostic failed: {str(e)}"}, status=400)

    @action(detail=False, methods=['post'])
    def test_points_award(self, request):
        """Test endpoint to verify points awarding works"""
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)
        
        try:
            print(f"🔍 DEBUG: Starting points award test for {request.user.email}")
            
            # Test awarding points
            test_points = 25
            transaction = PointsService.award_points(
                user=request.user,
                points=test_points,
                source='test',
                description="Test points award"
            )
            
            from accounts.models import UserProfile
            profile = UserProfile.objects.get(user=request.user)
            
            return Response({
                "message": "Points award test successful",
                "points_awarded": test_points,
                "final_points_balance": profile.points_balance,
                "total_points_earned": getattr(profile, 'total_points_earned', 'N/A'),
                "transaction_id": transaction.id,
                "profile_fields": [f.name for f in UserProfile._meta.get_fields()]
            })
            
        except Exception as e:
            print(f"🔍 DEBUG: Points award test failed: {e}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Points award test failed: {str(e)}"}, status=400)

    # ✅ Order completion and points processing
    @action(detail=True, methods=['post'])
    def complete_order(self, request, pk=None):
        """Mark order as completed and ensure points are awarded"""
        order = self.get_object()
        
        if order.status != 'completed':
            # Update order status to completed
            old_status = order.status
            order.status = 'completed'
            order.completed_at = timezone.now()
            order.save(update_fields=['status', 'completed_at'])
            
            # Create status event
            OrderStatusEvent.objects.create(
                order=order,
                changed_by=request.user,
                from_status=old_status,
                to_status='completed',
                note="Order completed"
            )
            
            # ✅ Ensure points are awarded for completed order
            if request.user.is_authenticated and POINTS_ENABLED:
                self._process_order_points(request.user, order)
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    # ✅ Points summary endpoint
    @action(detail=False, methods=['get'])
    def points_summary(self, request):
        """Get user's points summary and order history"""
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            if POINTS_ENABLED:
                summary = PointsService.get_user_points_summary(request.user)
                
                # Add recent orders
                recent_orders = Order.objects.filter(
                    customer=request.user, 
                    status__in=['PLACED', 'ACCEPTED', 'DONE', 'COMPLETED']  # Use actual status values
                ).order_by('-placed_at')[:5]
                
                order_data = []
                for order in recent_orders:
                    order_data.append({
                        'id': order.id,
                        'order_token': order.order_token,
                        'total': float(order.total),
                        'status': order.status,
                        'date': order.placed_at,
                        'points_earned': getattr(order, 'points_earned', 0)
                    })
                
                summary['recent_orders'] = order_data
                return Response(summary)
            else:
                return Response({"error": "Points system not available"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ✅ Status update methods
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({"error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate the status
        valid_statuses = dict(Order.Status.choices)
        if new_status not in valid_statuses:
            return Response({"error": f"Invalid status. Valid choices: {list(valid_statuses.keys())}"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create status event record
        OrderStatusEvent.objects.create(
            order=order,
            changed_by=request.user,
            from_status=order.status,
            to_status=new_status,
            note=f"Status updated via admin dashboard"
        )
        
        old_status = order.status
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])
        
        # ✅ Award points when order moves to paid status
        if old_status != 'PAID' and new_status == 'PAID' and request.user.is_authenticated and POINTS_ENABLED:
            self._process_order_points(request.user, order)
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle status changes specifically
        if 'status' in request.data:
            new_status = request.data['status']
            old_status = instance.status
            
            # Create status event record
            OrderStatusEvent.objects.create(
                order=instance,
                changed_by=request.user,
                from_status=old_status,
                to_status=new_status,
                note=f"Status updated via admin dashboard"
            )
            
            # ✅ Award points when order moves to paid status
            if old_status != 'PAID' and new_status == 'PAID' and request.user.is_authenticated and POINTS_ENABLED:
                self._process_order_points(request.user, instance)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def test_points_system(self, request):
        """Test endpoint to verify points system is working"""
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)
        
        try:
            print(f"🔍 DEBUG: Testing points system for {request.user.email}")
            
            # Test awarding points
            test_points = 50
            PointsService.award_points(
                user=request.user,
                points=test_points,
                source='test',
                description="Test points award"
            )
            
            from accounts.models import UserProfile
            profile = UserProfile.objects.get(user=request.user)
            
            # Test redeeming points
            PointsService.redeem_points(
                user=request.user,
                points=20,
                description="Test points redemption"
            )
            
            profile.refresh_from_db()
            
            return Response({
                "message": "Points system test successful",
                "initial_points_awarded": test_points,
                "points_redeemed": 20,
                "final_points_balance": profile.points_balance,
                "total_earned": getattr(profile, 'total_points_earned', 0),
                "total_redeemed": getattr(profile, 'total_points_redeemed', 0)
            })
            
        except Exception as e:
            print(f"🔍 DEBUG: Points test failed: {e}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Points test failed: {str(e)}"}, status=400)