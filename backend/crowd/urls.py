# backend/crowd/urls.py
from django.urls import path
from .views import current, history, override

urlpatterns = [
    path("current/", current, name="crowd-current"),
    path("history/", history, name="crowd-history"),
    path("override/", override, name="crowd-override"),
]
