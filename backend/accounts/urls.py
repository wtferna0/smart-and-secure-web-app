from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, MyTokenObtainPairView, MeView, LogoutView, 
    AdminUserListView, AdminUserDetailView, AdminUserSearchView, AdminUserProfileUpdateView
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("token/", MyTokenObtainPairView.as_view(), name="auth-token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    
    path("admin/users/", AdminUserListView.as_view(), name="admin-users-list"),
    path("admin/users/<int:id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("admin/users/search/", AdminUserSearchView.as_view(), name="admin-users-search"),
    path("admin/users/<int:user_id>/profile/", AdminUserProfileUpdateView.as_view(), name="admin-user-profile-update"),
]