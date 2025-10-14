from django.views.generic import TemplateView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from rest_framework import status
from .models import ChatMenuItem, ChatOrder
from .serializers import MenuItemSerializer, OrderSerializer
from . import services
from .intents import detect_intent

class ChatbotPageView(TemplateView):
    template_name = "chatbot/chat.html"

@method_decorator(csrf_exempt, name="dispatch")
class ChatbotQueryView(APIView):
    def post(self, request):
        message = (request.data.get("message") or request.data.get("text") or "").strip()
        email = (request.data.get("email") or "").strip()

        intent, score, _ = detect_intent(message)

        if intent == "menu":
            return Response(services.intent_menu(), 200)
        elif intent == "order_status":
            return Response(services.intent_order_status(email=email, text=message), 200)
        elif intent == "loyalty":
            return Response(services.intent_loyalty(email=email), 200)
        elif intent == "hours":
            return Response(services.intent_hours(), 200)
        elif intent == "location":
            return Response(services.intent_location(), 200)
        elif intent == "crowd":
            return Response(services.intent_crowd(), 200)
        else:
            return Response({
                "reply": "I didn't quite get that. I can try a smarter answer — press 'Ask AI' or rephrase.",
                "ai_fallback": True,
                "suggestions": ["menu","order status","loyalty","hours","location","crowd"]
            }, 200)

class MenuListView(generics.ListAPIView):
    queryset = ChatMenuItem.objects.filter(is_available=True).order_by("category","name")
    serializer_class = MenuItemSerializer

class OrderDetailView(generics.RetrieveAPIView):
    queryset = ChatOrder.objects.all()
    serializer_class = OrderSerializer
