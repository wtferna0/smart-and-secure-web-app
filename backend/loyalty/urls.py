from django.urls import path
from .views import ApplyPromoCodeView, UserPointsView, RedeemPointsView, UserPromosView, RedeemPromoCodeView

urlpatterns = [
    path('apply-promo/', ApplyPromoCodeView.as_view(), name='apply-promo'),
    path('redeem-promo/', RedeemPromoCodeView.as_view(), name='redeem-promo'),
    path('points/', UserPointsView.as_view(), name='user-points'),
    path('redeem-points/', RedeemPointsView.as_view(), name='redeem-points'),
    path('user-promos/', UserPromosView.as_view(), name='user-promos'),
]