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
