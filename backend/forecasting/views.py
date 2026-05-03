"""
Forecasting App — API Views
Exposes all ML/SNA intelligence endpoints.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

import pandas as pd
import os
from django.db.models import Sum
from datetime import date

from inventory.models import Medicine
from sales.models import Sale

from .sna_engine import build_copurchase_graph
from .demand_engine import predict_demand_all, train_and_cache_demand_model
from .risk_engine import predict_expiry_risks, train_and_cache_risk_model
from .decision_engine import generate_recommendations, get_summary_stats

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "pharma_large_dataset.csv")


# ─────────────────────────────────────────────
# ORIGINAL ENDPOINTS (preserved)
# ─────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def run_ml(request):
    """Quick per-medicine ML prediction (original endpoint, kept for compatibility)."""
    try:
        medicine_name = request.data.get('medicine')
        if not medicine_name:
            return Response({"error": "Medicine not provided"}, status=400)

        df = pd.read_csv(DATASET_PATH)
        df['Date'] = pd.to_datetime(df['Date'])
        med_data = df[df['Medicine'] == medicine_name]

        if med_data.empty:
            return Response({"error": "Medicine not found"}, status=404)

        med_data = med_data.sort_values(by='Date')
        sample = med_data.iloc[-1]

        sales = float(sample['Sales'])
        stock = float(sample['Stock'])
        expiry = float(sample['Expiry_Days_Left'])

        if expiry < 30:
            decision = "High Risk — Expiring Soon"
        elif stock < sales * 7:
            decision = "Reorder Recommended"
        else:
            decision = "Stock Healthy"

        return Response({
            "medicine": medicine_name,
            "sales": sales,
            "stock": stock,
            "expiry": expiry,
            "decision": decision
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def sales_trend(request):
    """Daily aggregated sales trend from dataset."""
    try:
        df = pd.read_csv(DATASET_PATH)
        df['Date'] = pd.to_datetime(df['Date'])
        trend = df.groupby('Date')['Sales'].sum().reset_index()
        data = [
            {"date": row['Date'].strftime("%b %d"), "sales": int(row['Sales'])}
            for _, row in trend.iterrows()
        ]
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_medicines(request):
    """Unique medicine list for dropdown."""
    try:
        df = pd.read_csv(DATASET_PATH)
        medicines = sorted(df['Medicine'].unique().tolist())
        return Response(medicines)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_dashboard(request):
    """Dashboard KPIs from DB instead of static dataset."""
    try:
        from datetime import timedelta
        
        # Pull live stats from Inventory and Sales models
        total_medicines = Medicine.objects.aggregate(total=Sum('quantity'))['total'] or 0
        low_stock = Medicine.objects.filter(quantity__lt=20).count()
        
        # SQLite date__date extractor crashes on Windows/tzdata. Using date__gte is faster and fixes the 500 error.
        today_sales = Sale.objects.filter(date__gte=date.today()).count()
        total_revenue = Sale.objects.aggregate(total=Sum('total_price'))['total'] or 0
        
        thirty_days_later = date.today() + timedelta(days=30)
        expiring_soon = Medicine.objects.filter(expiry_date__lte=thirty_days_later).count()

        return Response({
            "total_medicines": total_medicines,
            "low_stock_count": low_stock,
            "today_sales": today_sales,
            "total_revenue": total_revenue,
            "expiring_soon": expiring_soon
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ─────────────────────────────────────────────
# NEW INTELLIGENCE ENDPOINTS
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def sna_graph(request):
    """
    GET /api/ml/sna-graph/
    Returns co-purchase network graph (nodes + edges).
    """
    try:
        graph_data = build_copurchase_graph()
        return Response(graph_data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def demand_forecast(request):
    """
    GET /api/ml/demand-forecast/
    Returns XGBoost predicted 7-day demand for all medicines.
    """
    try:
        results = predict_demand_all()
        return Response({"results": results, "count": len(results)})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def expiry_risks(request):
    """
    GET /api/ml/expiry-risks/
    Returns Random Forest risk classification for all medicines.
    """
    try:
        results = predict_expiry_risks()
        return Response({"results": results, "count": len(results)})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def recommendations(request):
    """
    GET /api/ml/recommendations/
    Returns prioritized reorder/action recommendations.
    """
    try:
        demand = predict_demand_all()
        risks = predict_expiry_risks()
        recs = generate_recommendations(demand, risks)
        stats = get_summary_stats(recs)
        return Response({"recommendations": recs[:50], "summary": stats})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def retrain_models(request):
    """
    POST /api/ml/retrain/
    Trigger retraining of all ML models (demand + risk).
    """
    try:
        _, demand_acc = train_and_cache_demand_model()
        _, risk_acc = train_and_cache_risk_model()
        return Response({
            "status": "Models retrained successfully",
            "demand_model_accuracy": round(demand_acc, 4),
            "risk_model_accuracy": round(risk_acc, 4)
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)