from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from django.views.generic import TemplateView
from django.utils import timezone
from .models import PuzzleSession
from .serializers import PuzzleSessionSerializer
from .adapters import award_loyalty

class PuzzlePageView(TemplateView):
    template_name = 'puzzle/puzzle.html'

class StartPuzzleView(APIView):
    def post(self, request):
        try:
            email = (request.data.get('email') or '').strip() or None
            grid_size = int(request.data.get('grid_size') or 3)
            grid_size = max(3, min(5, grid_size))
            
            s = PuzzleSession.objects.create(email=email, grid_size=grid_size)
            return Response({'session_id': s.id, 'grid_size': s.grid_size}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# puzzle/views.py
class CompletePuzzleView(APIView):
    def post(self, request):
        print("CompletePuzzleView called with:", request.data)
        
        try:
            data = request.data
            
            sid = data.get('session_id') or data.get('sessionId') or 0
            moves = data.get('moves') or data.get('moveCount') or 0
            time_ms = data.get('time_ms') or data.get('timeMs') or 0
            
            sid = int(sid)
            moves = int(moves) 
            time_ms = int(time_ms)
            
            s = PuzzleSession.objects.get(id=sid)
            
            if s.completed_at:
                return Response({
                    'session_id': s.id,
                    'message': 'already completed'
                }, status=200)
                
            s.completed_at = timezone.now()
            s.moves = moves
            s.time_ms = time_ms
            
            # Calculate points
            base_points = {3: 20, 4: 35, 5: 50}.get(s.grid_size, 20)
            points = base_points
            
            if time_ms > 0 and time_ms < 60000: 
                points += 20
            elif time_ms > 0 and time_ms < 90000: 
                points += 10
                
            awarded, code = award_loyalty(s.email, points, s.grid_size)
            
            s.points_awarded = awarded
            s.reward_code = code
            s.save()
            
            return Response({
                'session_id': s.id, 
                'awarded_points': awarded, 
                'promo_code': code, 
                'message': 'Congrats! Reward applied.' if (awarded or code) else 'Completed.'
            }, status=200)
            
        except PuzzleSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)
        except (TypeError, ValueError) as e:
            return Response({'error': f'Invalid data: {str(e)}'}, status=400)
        except Exception as e:
            return Response({
                'session_id': sid if 'sid' in locals() else 'unknown',
                'awarded_points': 0,
                'promo_code': '',
                'message': 'Completed with errors'
            }, status=200)

class SessionDetailView(generics.RetrieveAPIView):
    queryset = PuzzleSession.objects.all()
    serializer_class = PuzzleSessionSerializer

class DebugPuzzleView(APIView):
    def post(self, request):
        import traceback
        try:
            from .adapters import award_loyalty
            
            test_email = "test@example.com"
            test_points = 20
            test_grid_size = 3
            
            result = award_loyalty(test_email, test_points, test_grid_size)
            
            return Response({
                'debug': 'award_loyalty function test',
                'result': result,
                'email': test_email,
                'points': test_points,
                'grid_size': test_grid_size
            })
            
        except Exception as e:
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=500)