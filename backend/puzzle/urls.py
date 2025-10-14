from django.urls import path
from .views import PuzzlePageView, StartPuzzleView, CompletePuzzleView, SessionDetailView, DebugPuzzleView

urlpatterns = [
    path('puzzle/', PuzzlePageView.as_view(), name='puzzle-page'),
    path('start-puzzle/', StartPuzzleView.as_view(), name='start-puzzle'),
    path('complete-puzzle/', CompletePuzzleView.as_view(), name='complete-puzzle'),
    path('session/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('debug-puzzle/', DebugPuzzleView.as_view(), name='debug-puzzle'),
]
