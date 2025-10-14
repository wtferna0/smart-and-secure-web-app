from rest_framework import serializers
from .models import CrowdSnapshot, CrowdOverride

class SnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrowdSnapshot
        fields = ["timestamp", "level", "source"]

class OverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrowdOverride
        fields = ["level", "ttl_minutes"]