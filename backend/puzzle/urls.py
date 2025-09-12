from django.urls import path
from .views import PuzzlePageView, StartPuzzleView, CompletePuzzleView, SessionDetailView

urlpatterns = [
    path('puzzle/', PuzzlePageView.as_view(), name='puzzle-page'),
    path('puzzle/start', StartPuzzleView.as_view(), name='puzzle-start'),
    path('puzzle/complete', CompletePuzzleView.as_view(), name='puzzle-complete'),
    path('puzzle/sessions/<int:pk>/', SessionDetailView.as_view(), name='puzzle-session-detail'),
]
