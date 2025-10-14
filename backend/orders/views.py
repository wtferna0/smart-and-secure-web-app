from django.db import transaction
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
import logging
from .models import Order, OrderItem, OrderStatusEvent
from .serializers import OrderCreateSerializer, OrderSerializer
from catalog.models import MenuItem

logger = logging.getLogger(__name__)

try:
    from loyalty.services import PointsService
    from loyalty.models import PointsTransaction
    POINTS_ENABLED = True
except ImportError as e:
    logger.warning("Loyalty app not available: %s", e)
    POINTS_ENABLED = False

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
                create_serializer = OrderCreateSerializer(
                    data=request.data, 
                    context={'request': request}
                )
                create_serializer.is_valid(raise_exception=True)
                order = create_serializer.save()
                
                if request.user.is_authenticated and POINTS_ENABLED:
                    try:
                        self._process_order_points(request.user, order, request.data)
                    except Exception as e:
                        logger.error("Error processing order points: %s", e)

                points_redeemed = request.data.get('points_redeemed', 0)
                if points_redeemed and request.user.is_authenticated and POINTS_ENABLED:
                    try:
                        self._process_points_redemption(request.user, order, points_redeemed)
                    except Exception as e:
                        logger.error("Error processing points redemption: %s", e)
                        raise
                
                response_serializer = OrderSerializer(order, context=self.get_serializer_context())
                response_data = response_serializer.data
                
                # Add points info to response
                if request.user.is_authenticated and POINTS_ENABLED:
                    from accounts.models import UserProfile
                    try:
                        profile = UserProfile.objects.get(user=request.user)
                        response_data['points_balance'] = profile.points_balance
                        if hasattr(order, 'points_earned'):
                            response_data['points_earned'] = order.points_earned
                    except UserProfile.DoesNotExist:
                        response_data['points_balance'] = 0
                    except Exception as e:
                        logger.error("Error getting user profile: %s", e)
                        response_data['points_balance'] = 0
                
                return Response(response_data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error("Order creation failed: %s", e)
            return Response({"error": f"Order creation failed: {str(e)}"}, 
                        status=status.HTTP_400_BAD_REQUEST)

    def _process_order_points(self, user, order, request_data=None):
        """Process points earning for orders"""
        if request_data is None:
            request_data = {}
            
        try:
            points_redeemed = request_data.get('points_redeemed', 0)
            has_promo_code = bool(request_data.get('applied_promo_code'))
            
            if points_redeemed > 0 or has_promo_code:
                points_earned = 0
            else:
                # Calculate points based on order total (5% of total)
                points_earned = max(1, int(float(order.total) * 0.05))
            
            if points_earned > 0:
                # Award points
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
            else:
                order.points_earned = 0
                order.save(update_fields=['points_earned'])
                
        except Exception as e:
            logger.error("Error in _process_order_points: %s", e)

    def _process_points_redemption(self, user, order, points_redeemed):
        """Process points redemption for an order"""
        try:
            points_redeemed = int(points_redeemed)
            
            if points_redeemed > 0:
                PointsService.redeem_points(
                    user=user,
                    points=points_redeemed,
                    order=order,
                    description=f"Points redeemed for order #{order.id}"
                )
                
        except Exception as e:
            logger.error("Error in _process_points_redemption: %s", e)
            raise

    # Order completion and points processing
    @action(detail=True, methods=['post'])
    def complete_order(self, request, pk=None):
        """Mark order as completed and ensure points are awarded"""
        order = self.get_object()
        
        if order.status != Order.Status.COMPLETED:
            # Update order status to completed
            old_status = order.status
            order.status = Order.Status.COMPLETED
            order.completed_at = timezone.now()
            order.save(update_fields=['status', 'completed_at'])
            
            # Create status event
            OrderStatusEvent.objects.create(
                order=order,
                changed_by=request.user,
                from_status=old_status,
                to_status=Order.Status.COMPLETED,
                note="Order completed"
            )
            
            # Ensure points are awarded for completed order
            if request.user.is_authenticated and POINTS_ENABLED:
                self._process_order_points(request.user, order, {})
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    # Points summary endpoint
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
                    status__in=[Order.Status.PLACED, Order.Status.ACCEPTED, Order.Status.DONE, Order.Status.COMPLETED]
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
            logger.error("Error in points_summary: %s", e)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
        
        # Award points when order moves to paid status
        if (old_status != Order.Status.PENDING_PAYMENT and new_status == Order.Status.PLACED and 
            request.user.is_authenticated and POINTS_ENABLED):
            
            # Check if points were redeemed or promo was used in this order
            points_redeemed = getattr(order, 'points_redeemed', 0)
            has_promo_code = bool(getattr(order, 'applied_promo_code', None))
            
            if points_redeemed == 0 and not has_promo_code:
                self._process_order_points(request.user, order, {})
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
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
            
            # Award points when order moves to paid status
            if (old_status != Order.Status.PENDING_PAYMENT and new_status == Order.Status.PLACED and 
                request.user.is_authenticated and POINTS_ENABLED):
                self._process_order_points(request.user, instance, {})
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)