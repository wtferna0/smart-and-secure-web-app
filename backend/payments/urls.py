from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PayHereCheckoutCreate, payhere_ipn

router = DefaultRouter()
router.register("payments", PaymentViewSet, basename="payment")

urlpatterns = [
    path("", include(router.urls)),
    path("payhere/checkout/", PayHereCheckoutCreate.as_view(), name="payhere-checkout"),
    path("payhere/ipn/", payhere_ipn, name="payhere-ipn"),
]