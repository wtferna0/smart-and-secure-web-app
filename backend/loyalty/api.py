# loyalty/api.py
from rest_framework import serializers, views, status
from rest_framework.response import Response
from .services import apply_promo_to_order, redeem_points_for_order

class ApplyPromoIn(serializers.Serializer):
    order_id = serializers.IntegerField()
    code = serializers.CharField()

class RedeemPointsIn(serializers.Serializer):
    order_id = serializers.IntegerField()
    points = serializers.IntegerField(min_value=1)

class PointsView(views.APIView):
    def get(self, request):
        user_profile = UserProfile.objects.get(user=request.user)
        return Response({"points": user_profile.points_balance})

class RedeemPointsView(views.APIView):
    def post(self, request):
        data = RedeemPointsIn(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            order = redeem_points_for_order(
                order_id=data.validated_data['order_id'],
                user=request.user,
                points=data.validated_data['points']
            )
            return Response({"order_id": order.id, "total": str(order.total)})
        except ValidationError as e:
            return Response({"error": e.message}, status=status.HTTP_400_BAD_REQUEST)

class ApplyPromoView(views.APIView):
    def post(self, request):
        data = ApplyPromoIn(data=request.data)
        data.is_valid(raise_exception=True)
        try:
            order = apply_promo_to_order(
                order_id=data.validated_data['order_id'],
                code=data.validated_data['code'],
                user=request.user
            )
            return Response({"order_id": order.id, "total": str(order.total)})
        except ValidationError as e:
            return Response({"error": e.message}, status=status.HTTP_400_BAD_REQUEST)
