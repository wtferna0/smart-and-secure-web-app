from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.views.generic import TemplateView
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import PuzzleSession
from .serializers import PuzzleSessionSerializer
from .adapters import award_loyalty

class PuzzlePageView(TemplateView):
    template_name = 'puzzle/puzzle.html'

@method_decorator(csrf_exempt, name='dispatch')
class StartPuzzleView(APIView):
    def post(self, request):
        email = (request.data.get('email') or '').strip() or None
        grid_size = int(request.data.get('grid_size') or 3)
        grid_size = max(3, min(5, grid_size))
        s = PuzzleSession.objects.create(email=email, grid_size=grid_size)
        return Response({'session_id': s.id, 'grid_size': s.grid_size}, status=status.HTTP_201_CREATED)

@method_decorator(csrf_exempt, name='dispatch')
class CompletePuzzleView(APIView):
    def post(self, request):
        try:
            sid = int(request.data.get('session_id'))
            moves = int(request.data.get('moves'))
            time_ms = int(request.data.get('time_ms'))
        except (TypeError, ValueError):
            return Response({'error':'invalid payload'}, status=400)
        try:
            s = PuzzleSession.objects.get(id=sid)
        except PuzzleSession.DoesNotExist:
            return Response({'error':'session not found'}, status=404)
        if s.completed_at:
            data = PuzzleSessionSerializer(s).data
            data['message'] = 'already completed'
            return Response(data, status=200)
        s.completed_at = timezone.now()
        s.moves = max(0, moves)
        s.time_ms = max(0, time_ms)
        base = {3:20, 4:35, 5:50}.get(s.grid_size, 20)
        points = base
        if s.time_ms < 60000: points += 20
        elif s.time_ms < 90000: points += 10
        awarded, code = award_loyalty(s.email, points)
        s.points_awarded = awarded
        s.reward_code = code
        s.save()
        return Response({'session_id': s.id, 'awarded_points': awarded, 'promo_code': code, 'message':'Congrats! Reward applied.' if (awarded or code) else 'Completed.'}, status=200)

class SessionDetailView(generics.RetrieveAPIView):
    queryset = PuzzleSession.objects.all()
    serializer_class = PuzzleSessionSerializer
