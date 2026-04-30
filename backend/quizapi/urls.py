from django.urls import path

from .views import fetch_quiz_questions, health, submit_answers

urlpatterns = [
    path("health", health),
    path("quiz-questions", fetch_quiz_questions),
    path("submit-answers", submit_answers),
]
