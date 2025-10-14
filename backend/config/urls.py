from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.views.generic import TemplateView
from django.conf.urls.static import static


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/catalog/", include("catalog.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("payments.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path('api/auth/', include('accounts.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path("api/", include("puzzle.urls")),
    path('api/loyalty/', include('loyalty.urls')),
    path('api/crowd/', include('crowd.urls')),


    path('', TemplateView.as_view(template_name='index.html')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)