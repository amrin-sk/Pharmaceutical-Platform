from django.urls import path
from .views import SupplierView

urlpatterns = [
    path('', SupplierView.as_view()),
]