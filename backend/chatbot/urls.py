from django.urls import path
from .views import ChatbotQueryView, MenuListView, OrderDetailView
urlpatterns = [
    path('chatbot/query', ChatbotQueryView.as_view(), name='chatbot-query'),
    path('menu/', MenuListView.as_view(), name='menu-list'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
