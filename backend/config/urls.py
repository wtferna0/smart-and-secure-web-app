from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from loyalty.api import PointsView, RedeemPointsView, ApplyPromoView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("payments.urls")),  # <-- add this
    path("api/crowd/", include("crowd.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),


    path("api/", include("chatbot.urls")),
    path("puzzle/", include("puzzle.urls")),

    path('api/loyalty/points/', PointsView.as_view(), name='check-points'),
    path('api/loyalty/redeem/', RedeemPointsView.as_view(), name='redeem-points'),
    path('api/promos/apply/', ApplyPromoView.as_view(), name='apply-promo'),
]
