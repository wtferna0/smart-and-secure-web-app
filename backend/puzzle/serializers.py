from rest_framework import serializers
from .models import PuzzleSession

class PuzzleSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PuzzleSession
        fields = ["id","email","grid_size","started_at","completed_at","moves","time_ms","points_awarded","reward_code"]
