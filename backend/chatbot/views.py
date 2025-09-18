from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from .models import ChatMenuItem, ChatOrder
from .serializers import MenuItemSerializer, OrderSerializer
from .services import (
    get_or_create_customer, intent_menu, intent_order_status, intent_loyalty,
    intent_hours, intent_location, intent_crowd
)

class ChatbotQueryView(APIView):
    def post(self, request):
        msg = (request.data.get("message") or "").strip().lower()
        email = (request.data.get("email") or "").strip().lower()
        name = (request.data.get("name") or "").strip()
        customer = get_or_create_customer(email, name) if email else None
        if not msg:
            return Response({"reply":"Hi! Try 'menu', 'order status', 'loyalty', 'hours', 'location', or 'crowd'."})
        if "menu" in msg: data = intent_menu()
        elif "order" in msg and "status" in msg: data = intent_order_status(customer)
        elif "loyalty" in msg or "points" in msg: data = intent_loyalty(customer)
        elif "hour" in msg or "open" in msg or "time" in msg: data = intent_hours()
        elif "location" in msg or "where" in msg or "address" in msg: data = intent_location()
        elif "crowd" in msg or "busy" in msg: data = intent_crowd()
        else: data = {"reply":"Sorry, I didn't understand. Try 'menu', 'order status', 'loyalty', 'hours', 'location', or 'crowd'."}
        return Response(data, status=status.HTTP_200_OK)

class MenuListView(generics.ListAPIView):
    queryset = ChatMenuItem.objects.all().order_by("category","name")
    serializer_class = MenuItemSerializer

class OrderDetailView(generics.RetrieveAPIView):
    queryset = ChatOrder.objects.all()
    serializer_class = OrderSerializer
