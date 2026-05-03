from django.urls import path
from .views import SaleView

urlpatterns = [
    path('', SaleView.as_view()),
]