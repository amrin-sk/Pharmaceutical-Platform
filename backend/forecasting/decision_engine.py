"""
Decision & Recommendation Engine
Combines demand forecast + risk classification to generate
actionable reorder and stock optimization recommendations.
"""
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "pharma_large_dataset.csv")

# Reorder threshold: stock coverage below N days → recommend reorder
REORDER_THRESHOLD_DAYS = 14
# Expiry urgent: less than N days left
EXPIRY_URGENT_DAYS = 30


def generate_recommendations(demand_results, risk_results):
    """
    Merge demand + risk data and generate recommendations.

    demand_results: output from demand_engine.predict_demand_all()
    risk_results:   output from risk_engine.predict_expiry_risks()

    Returns a list of recommendation cards sorted by priority.
    """
    # Build lookup by medicine name
    risk_by_med = {r['medicine']: r for r in risk_results}
    demand_by_med = {d['medicine']: d for d in demand_results}

    all_meds = set(list(risk_by_med.keys()) + list(demand_by_med.keys()))

    recommendations = []

    for med in all_meds:
        demand = demand_by_med.get(med, {})
        risk = risk_by_med.get(med, {})

        stock = demand.get('current_stock') or risk.get('current_stock', 0)
        expiry_days = risk.get('expiry_days_left', 999)
        risk_level = risk.get('risk_level', 'Low')
        predicted_7d = demand.get('predicted_7d_demand', 0)
        coverage_days = demand.get('stock_coverage_days', 999)
        category = demand.get('category') or risk.get('category', 'General')

        # --- Decision Logic ---
        action = "Monitor"
        action_type = "info"
        priority = 3

        if expiry_days < EXPIRY_URGENT_DAYS and stock > 50:
            action = "Clear Stock — Expiring Soon"
            action_type = "danger"
            priority = 1
            reorder_qty = 0
        elif coverage_days < REORDER_THRESHOLD_DAYS or (
            stock < predicted_7d * 0.5
        ):
            # Use actual store sales velocity (real DB sales) for a realistic reorder quantity.
            # sales_velocity = avg units sold per day in this store (not the large dataset)
            actual_daily = risk.get('sales_velocity', 0)
            if actual_daily <= 0:
                # Fallback: scale down XGBoost prediction to 10% for small store
                actual_daily = max(1, demand.get('daily_avg_predicted', 1) * 0.1)
            # Target 30 days of stock, cap at 100 units (realistic for small medical store)
            reorder_qty = max(0, int(actual_daily * 30 - stock))
            reorder_qty = min(reorder_qty, 100)
            action = f"Reorder {reorder_qty} units"
            action_type = "warning"
            priority = 2
        elif risk_level == "High":
            action = "High Expiry Risk — Review Policy"
            action_type = "danger"
            priority = 1
            reorder_qty = 0
        else:
            action = "Stock Healthy"
            action_type = "success"
            priority = 3
            reorder_qty = 0

        recommendations.append({
            "medicine": med,
            "category": category,
            "current_stock": stock,
            "expiry_days_left": expiry_days,
            "risk_level": risk_level,
            "predicted_7d_demand": round(predicted_7d, 1),
            "stock_coverage_days": round(coverage_days, 1),
            "action": action,
            "action_type": action_type,
            "priority": priority,
            "reorder_quantity": reorder_qty
        })

    # Sort by priority (1=Critical first), then by expiry
    recommendations.sort(key=lambda x: (x['priority'], x['expiry_days_left']))
    return recommendations


def get_summary_stats(recommendations):
    """Compute headline KPIs from merged recommendation data."""
    total = len(recommendations)
    critical = sum(1 for r in recommendations if r['action_type'] == 'danger')
    reorder = sum(1 for r in recommendations if 'Reorder' in r['action'])
    healthy = sum(1 for r in recommendations if r['action_type'] == 'success')

    return {
        "total_medicines": total,
        "critical_alerts": critical,
        "reorder_needed": reorder,
        "healthy_stock": healthy,
        "health_score": round(healthy / total * 100, 1) if total else 0
    }
