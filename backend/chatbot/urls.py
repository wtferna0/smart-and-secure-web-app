from django.urls import path
from .views import ChatbotQueryView, MenuListView, OrderDetailView, ChatbotPageView

urlpatterns = [
    path("", ChatbotPageView.as_view(), name="chatbot-page"),
    path("query/", ChatbotQueryView.as_view(), name="chatbot-query"),
    path("menu/", MenuListView.as_view(), name="menu-list"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
]