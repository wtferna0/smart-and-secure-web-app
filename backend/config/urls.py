# from django.contrib import admin
# from django.urls import path, include
# from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# urlpatterns = [
#     path("admin/", admin.site.urls),

#     # APIs
#     path("api/catalog/", include("catalog.urls")),
#     path("api/", include("orders.urls")),  # will add orders.urls next

#     # API schema & docs
#     path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
#     path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
# ]

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/catalog/", include("catalog.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("payments.urls")),  # <-- add this
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),


    path("api/", include("chatbot.urls")),
    path("api/", include("puzzle.urls")),
]
