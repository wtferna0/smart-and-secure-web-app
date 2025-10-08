from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from .models import ChatMenuItem, ChatOrder
from .serializers import MenuItemSerializer, OrderSerializer
import logging
from .services import (
    get_or_create_customer, intent_menu, intent_order_status, intent_loyalty,
    intent_hours, intent_location, intent_crowd
)

logger = logging.getLogger(__name__)

class ChatbotQueryView(APIView):
    def post(self, request):
        try:
            msg = (request.data.get("message") or "").strip().lower()
            email = (request.data.get("email") or "").strip().lower()
            name = (request.data.get("name") or "").strip()
            
            logger.info(f"Chatbot query: {msg} from {email}")
            
            customer = get_or_create_customer(email, name) if email else None
            
            if not msg:
                return Response({
                    "reply": "Hi! I'm your Brew assistant ☕ How can I help? Try 'menu', 'order status', 'loyalty', 'hours', 'location', or 'crowd'."
                })
            
            # Intent mapping
            intents = {
                'menu': intent_menu,
                'order status': intent_order_status,
                'loyalty': intent_loyalty, 
                'points': intent_loyalty,
                'hours': intent_hours,
                'open': intent_hours,
                'time': intent_hours,
                'location': intent_location,
                'where': intent_location,
                'address': intent_location,
                'crowd': intent_crowd,
                'busy': intent_crowd
            }
            
            # Find matching intent
            for intent_key, intent_func in intents.items():
                if intent_key in msg:
                    data = intent_func(customer)
                    break
            else:
                data = {
                    "reply": "Sorry, I didn't understand. Try 'menu', 'order status', 'loyalty', 'hours', 'location', or 'crowd'."
                }
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Chatbot error: {str(e)}")
            return Response({
                "reply": "Sorry, I'm having trouble right now. Please try again in a moment."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
class MenuListView(generics.ListAPIView):
    queryset = ChatMenuItem.objects.all().order_by("category","name")
    serializer_class = MenuItemSerializer

class OrderDetailView(generics.RetrieveAPIView):
    queryset = ChatOrder.objects.all()
    serializer_class = OrderSerializer
