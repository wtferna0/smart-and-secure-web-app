from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status, throttling
from django.utils import timezone
from .models import CrowdSnapshot, CrowdOverride
from .serializers import SnapshotSerializer, OverrideSerializer
from .services import current_level

class Burst(throttling.SimpleRateThrottle):
    scope = "crowdmeter_burst"
    def get_cache_key(self, request, view): return self.get_ident(request)

@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([Burst])
def current(request):
    return Response(current_level())

@api_view(["GET"])
@permission_classes([AllowAny])
def history(request):
    limit = int(request.query_params.get("limit", 50))
    qs = CrowdSnapshot.objects.order_by("-timestamp")[:limit]
    return Response(SnapshotSerializer(qs, many=True).data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def override(request):
    ser = OverrideSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    ov = ser.save(staff=request.user)
    return Response({"ok": True, "expires_at": ov.expires_at}, status=status.HTTP_201_CREATED)

@api_view(["GET"])
@permission_classes([AllowAny])
def crowd_prediction(request):
    """
    Simple endpoint for frontend crowd meter
    Returns state and confidence level
    """
    from .services import current_level
    
    data = current_level()
    
    # Map numeric level to state categories
    level = data["level"]
    capacity = _cfg().get("CAPACITY", 50)
    
    # Calculate percentage for confidence
    percentage = min(100, max(0, int((level / capacity) * 100)))
    
    # Determine state based on capacity percentage
    if percentage <= 30:
        state = "Quiet"
        confidence = 0.3 + (percentage / 30) * 0.4  # 0.3-0.7 range
    elif percentage <= 70:
        state = "Normal"
        confidence = 0.5 + ((percentage - 30) / 40) * 0.3  # 0.5-0.8 range
    else:
        state = "Busy" 
        confidence = 0.7 + ((percentage - 70) / 30) * 0.2  # 0.7-0.9 range
    
    return Response({
        "state": state,
        "confidence": min(0.95, confidence),  # Cap at 95%
        "level": level,
        "capacity": capacity,
        "percentage": percentage,
        "updated_at": data["updated_at"],
        "source": data["source"]
    })