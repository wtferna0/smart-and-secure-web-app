# loyalty/urls.py - UPDATED with points endpoints
from django.urls import path
from .views import ApplyPromoCodeView, DebugPromoView, TestPromoCreationView, UserPointsView, RedeemPointsView

urlpatterns = [
    path('apply-promo/', ApplyPromoCodeView.as_view(), name='apply-promo'),
    path('debug-promos/', DebugPromoView.as_view(), name='debug-promos'),
    path('test-creation/', TestPromoCreationView.as_view(), name='test-creation'),
    
    # Add these new points endpoints
    path('points/', UserPointsView.as_view(), name='user-points'),
    path('redeem-points/', RedeemPointsView.as_view(), name='redeem-points'),
]