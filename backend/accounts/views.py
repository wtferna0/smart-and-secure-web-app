from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer

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
    Blacklist the given refresh token so it can't be used again.
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

# Admin User Management Views
class AdminUserListView(generics.ListAPIView):
    """
    Admin view to list all users with their profiles
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-date_joined')
    
    def get_queryset(self):
        # Prefetch related profile to avoid N+1 queries
        return super().get_queryset().select_related('profile')

class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """
    Admin view to retrieve/update user details
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        """
        Handle updates to both User and UserProfile models
        """
        user = self.get_object()
        
        # Separate user data and profile data
        user_data = {}
        profile_data = {}
        
        # Define which fields belong to User vs UserProfile
        user_fields = ['first_name', 'last_name', 'email', 'is_active']
        profile_fields = ['display_name', 'phone', 'contact_email', 'points_balance', 
                         'default_currency', 'marketing_opt_in']
        
        for field, value in request.data.items():
            if field in user_fields:
                user_data[field] = value
            elif field in profile_fields:
                profile_data[field] = value
        
        # Update User model
        if user_data:
            for field, value in user_data.items():
                setattr(user, field, value)
            user.save()
        
        # Update UserProfile model
        if profile_data:
            profile = user.profile
            for field, value in profile_data.items():
                setattr(profile, field, value)
            profile.save()
        
        # Return updated user data
        serializer = self.get_serializer(user)
        return Response(serializer.data)

class AdminUserSearchView(generics.ListAPIView):
    """
    Admin view to search users
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if query:
            return User.objects.filter(
                Q(username__icontains=query) |
                Q(email__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(profile__display_name__icontains=query) |
                Q(profile__contact_email__icontains=query)
            ).select_related('profile').order_by('-date_joined')
        return User.objects.all().select_related('profile').order_by('-date_joined')

class AdminUserProfileUpdateView(APIView):
    """
    Admin view to update user profile data
    """
    permission_classes = [permissions.IsAdminUser]
    
    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            profile = user.profile
            
            # Update allowed profile fields
            serializer = UserProfileSerializer(
                profile, 
                data=request.data, 
                partial=True  # Allow partial updates
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(serializer.errors, status=400)
            
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)
        except UserProfile.DoesNotExist:
            return Response({"detail": "User profile not found"}, status=404)