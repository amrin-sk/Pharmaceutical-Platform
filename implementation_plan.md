# Pharmaceutical Intelligence Platform Implementation Plan

This document outlines the architecture and implementation steps for building the Pharmaceutical Intelligence Platform. The system aims to optimize medical store management by integrating unstructured data, applying Machine Learning and Social Network Analysis (SNA), generating actionable recommendations, and visualizing the insights.

## Background Context
The existing codebase consists of a React boilerplate (`frontend/`) and a Django skeleton (`backend/`) with several barebones apps (`inventory`, `sales`, `suppliers`, `forecasting`, `dashboard`, `users`). We also have a structured dataset (`dataset/pharma_large_dataset.csv`) that we will use to populate the database and train our initial models.

## User Review Required

> [!IMPORTANT]
> - Please review the **Proposed Changes** for the ML and Network Analysis approach.
> - Ensure the technical stack (Django Rest Framework, scikit-learn, XGBoost, NetworkX for backend; React, Recharts, React Force Graph for frontend) meets your expectations.

---

## Proposed Changes

### Backend: Database & Data Loading
To accommodate `pharma_large_dataset.csv`, we need to adjust existing models and load the data.

#### [MODIFY] backend/inventory/models.py
- Add `category` (CharField) to `Medicine`.
- Update `Expiry_Days_Left` to either be calculated dynamically from an `expiry_date` or stored explicitly as an integer field for ML integration.

#### [MODIFY] backend/sales/models.py
- Add explicit `date` field to allow historical seeding, as `created_at` (auto_now_add) will not realistically reflect historical sales.

#### [NEW] backend/core/management/commands/load_pharma_data.py
- A Django management command that reads `pharma_large_dataset.csv` and populates the `Supplier`, `Medicine`, and `Sale` tables.

---

### Backend: Machine Learning & Analytics (`forecasting` app)

#### [NEW] backend/forecasting/ml/sna_engine.py
- Implements Social Network Analysis (SNA) using `NetworkX`.
- Calculates co-purchase patterns by identifying medicines that are frequently sold on the same day. Generates nodes and weighted edges to identify product associations.

#### [NEW] backend/forecasting/ml/demand_model.py
- Trains an **XGBoost regression model** to predict future demand (Sales volume).
- Features will include: rolling sale averages, current stock, price, category, and historical trends.

#### [NEW] backend/forecasting/ml/risk_model.py
- Trains a **Random Forest classification model** to classify expiry risk (e.g., Low, Medium, High).
- Features will include: Expiry_Days_Left, current stock levels, historical demand velocity, and price.

#### [NEW] backend/forecasting/engine.py
- The Decision Engine that aggregates predictions.
- **Output:** Stock optimization scenarios, recommended reorder quantities, and immediate expiry alerts.

#### [NEW] backend/forecasting/views.py & urls.py
- Django REST Framework views exposing API endpoints:
  - `GET /api/insights/network-graph`: Returns graph structure.
  - `GET /api/insights/demand-forecast`: Returns demand predictions.
  - `GET /api/insights/expiry-risks`: Returns expiry warnings.
  - `GET /api/insights/recommendations`: Returns actionable decisions (reorder suggestions).

---

### Frontend: UI Configuration & Styling

#### [MODIFY] frontend/package.json
- Add dependencies for data visualization (`recharts`) and network graphing (`react-force-graph-2d` or `vis-network`).
- Add standard UI utilities if needed (like `lucide-react` for icons).
- Add `tailwind-merge` and `clsx` for structural robust standard styling configurations. *Note: TailwindCSS will NOT be used directly as per core system rules unless explicitly asked; Vanilla CSS will drive the core theme.*

#### [NEW] frontend/src/index.css
- Build a premium, dark-mode focused modern design system with vibrant gradients, glassmorphism utilities, and soft interaction micro-animations.

#### [NEW] frontend/src/components/
- `NetworkGraph.jsx`: Interactive graph visualization of medicine correlations.
- `DemandChart.jsx`: Line chart visualizing historical sales vs. predicted demand.
- `RiskAlertsTable.jsx`: An interactive table prioritizing items with high expiry risk.
- `RecommendationCards.jsx`: Display actionable reorder metrics.

#### [NEW] frontend/src/pages/Dashboard.jsx
- The main cockpit view. Integrates the components logically. Uses seamless loading states while waiting for ML predictions.

## Open Questions

> [!WARNING]
> 1. Do you have a preference for the Machine Learning training trigger? Should the models be trained immediately upon data load, or should we expose an explicit API endpoint/button in the dashboard to retrain models dynamically?
> 2. Should we handle user authentication right away in the dashboard, or can we bypass authentication for the initial intelligence prototype?

## Verification Plan

### Automated Tests
- Run Backend tests to ensure models align with the schema.
- Validate API endpoints (`curl` checks) predicting ML outputs and returning well-formatted JSON Data.

### Manual Verification
- View the network graph visually resolving nodes clustering together.
- Analyze the Random Forest evaluation logs explicitly confirming reasonable accuracy for Expiry Risk.
- Run `npm start` locally and demonstrate the UI functionality.
