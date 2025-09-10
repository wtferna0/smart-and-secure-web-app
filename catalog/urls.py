# catalog/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MenuItemViewSet, CategoryViewSet

router = DefaultRouter()
router.register("items", MenuItemViewSet, basename="menuitem")
router.register("categories", CategoryViewSet, basename="menucategory")

urlpatterns = [path("", include(router.urls))]
