from django.urls import path
from .views import MedicineListCreateView, MedicineDetailView

urlpatterns = [
    path('medicines/', MedicineListCreateView.as_view()),
    path('medicines/<int:pk>/', MedicineDetailView.as_view()),  # ✅ ADD THIS
  
]