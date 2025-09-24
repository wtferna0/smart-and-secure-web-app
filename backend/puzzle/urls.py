from django.urls import path
from .views import PuzzlePageView, StartPuzzleView, CompletePuzzleView, SessionDetailView

urlpatterns = [
    path('puzzle/', PuzzlePageView.as_view(), name='puzzle-page'), # GET /api/puzzle/
    path('start/', StartPuzzleView.as_view(), name='puzzle-start'), # POST /api/puzzle/start/
    path('complete/', CompletePuzzleView.as_view(), name='puzzle-complete'), # POST /api/puzzle/complete/
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='puzzle-session-detail'), # GET /api/puzzle/session/1/
]