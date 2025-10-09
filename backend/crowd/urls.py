# backend/crowd/urls.py
from django.urls import path
from .views import current, history, override, crowd_prediction

urlpatterns = [
    path("current/", current, name="crowd-current"),
    path("history/", history, name="crowd-history"),
    path("override/", override, name="crowd-override"),
    path("prediction/", crowd_prediction, name="crowd-prediction"),
]
