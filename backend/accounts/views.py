from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer

# ▶ ADDED: imports for the points endpoint
from rest_framework.decorators import api_view, permission_classes   # ADDED
from .models import UserProfile                                      # ADDED


# Customize login to include some extra claims in the token response (optional)
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # extra claims for frontend convenience
        token["username"] = user.username
        token["is_staff"] = user.is_staff
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    # Optionally return tokens after signup (auto-login)
    def create(self, request, *args, **kwargs):
        resp = super().create(request, *args, **kwargs)
        user = User.objects.get(username=resp.data["username"])
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    """
    Blacklist the given refresh token so it can’t be used again.
    Requires SIMPLE_JWT token_blacklist app installed.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            token = request.data.get("refresh")
            if not token:
                return Response({"detail": "refresh token required"}, status=400)
            RefreshToken(token).blacklist()
            return Response({"detail": "logged out"}, status=205)
        except Exception:
            return Response({"detail": "invalid refresh"}, status=400)


# ▶ ADDED: Points Check Endpoint (from the image, with auth protection)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_points(request):
    """
    Returns the points_balance of the authenticated user.
    """
    user_profile = UserProfile.objects.get(user=request.user)
    return Response({"points_balance": user_profile.points_balance})
