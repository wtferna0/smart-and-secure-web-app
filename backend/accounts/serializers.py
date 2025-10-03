from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import UserProfile  # Make sure this import is there

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    display_name = serializers.CharField(max_length=120, required=False, allow_blank=True, write_only=True)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True, write_only=True)
    contact_email = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    marketing_opt_in = serializers.BooleanField(required=False, default=False, write_only=True)
    default_currency = serializers.CharField(max_length=3, required=False, default="LKR", write_only=True)

    class Meta:
        model = User
        fields = [
            "username", "email", "password", "first_name", "last_name", 
            "display_name", "phone", "contact_email", "marketing_opt_in", "default_currency"
        ]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        # Extract UserProfile fields from validated_data
        profile_data = {
            'display_name': validated_data.pop('display_name', ''),
            'phone': validated_data.pop('phone', ''),
            'contact_email': validated_data.pop('contact_email', ''),
            'marketing_opt_in': validated_data.pop('marketing_opt_in', False),
            'default_currency': validated_data.pop('default_currency', 'LKR'),
            'points_balance': 0,
        }
        
        # Create User
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # Set defaults for profile if not provided
        if not profile_data['contact_email'] and user.email:
            profile_data['contact_email'] = user.email
            
        if not profile_data['display_name']:
            profile_data['display_name'] = user.username
            
        # Create UserProfile
        UserProfile.objects.create(user=user, **profile_data)
        
        return user

class UserSerializer(serializers.ModelSerializer):
    # Profile fields
    display_name = serializers.CharField(source='profile.display_name', read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)
    contact_email = serializers.EmailField(source='profile.contact_email', read_only=True)
    points_balance = serializers.IntegerField(source='profile.points_balance', read_only=True)
    paid_order_count = serializers.IntegerField(source='profile.paid_order_count', read_only=True)
    default_currency = serializers.CharField(source='profile.default_currency', read_only=True)
    marketing_opt_in = serializers.BooleanField(source='profile.marketing_opt_in', read_only=True)
    profile_created_at = serializers.DateTimeField(source='profile.created_at', read_only=True)
    profile_updated_at = serializers.DateTimeField(source='profile.updated_at', read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", 
            "is_staff", "is_superuser", "is_active", "date_joined", "last_login",
            # Profile fields
            "display_name", "phone", "contact_email", "points_balance", 
            "paid_order_count", "default_currency", "marketing_opt_in",
            "profile_created_at", "profile_updated_at"
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id", "display_name", "phone", "contact_email", 
            "points_balance", "default_currency", "marketing_opt_in",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]