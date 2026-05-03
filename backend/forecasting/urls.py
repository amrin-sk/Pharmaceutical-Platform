from django.urls import path
from .views import (
    run_ml, sales_trend, get_medicines, get_dashboard,
    sna_graph, demand_forecast, expiry_risks,
    recommendations, retrain_models
)

urlpatterns = [
    # --- Original ---
    path('run-ml/', run_ml),
    path('sales-trend/', sales_trend),
    path('medicines/', get_medicines),
    path('dashboard/', get_dashboard),

    # --- Intelligence APIs ---
    path('sna-graph/', sna_graph),
    path('demand-forecast/', demand_forecast),
    path('expiry-risks/', expiry_risks),
    path('recommendations/', recommendations),
    path('retrain/', retrain_models),
]