from django.urls import path
from .views import PuzzlePageView, StartPuzzleView, CompletePuzzleView, SessionDetailView

urlpatterns = [
    path('puzzle/', PuzzlePageView.as_view(), name='puzzle-page'),  # GET /api/puzzle/
    path('start-puzzle/', StartPuzzleView.as_view(), name='start-puzzle'),  # POST /api/start-puzzle/
    path('complete-puzzle/', CompletePuzzleView.as_view(), name='complete-puzzle'),  # POST /api/complete-puzzle/
    path('session/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),  # GET /api/session/1/
]
