from ml.preprocess import load_data, preprocess
from ml.demand_model import train_demand_model
from ml.risk_model import train_risk_model

# Load
df = load_data()
print(df.head())

# Preprocess
df = preprocess(df)
print(df.columns)
print("\n Feature Columns:", df.columns)
# Train
print("Training Demand Model...")
train_demand_model(df)

print("\nTraining Risk Model...")
train_risk_model(df)

print("\n Done")
print("\n Sample Insights:")

for i in range(5):
    sales = df['Sales'].iloc[i]
    stock = df['Stock'].iloc[i]
    expiry = df['Expiry_Days_Left'].iloc[i]

    if stock < sales:
        print(f"Medicine {i}: Reorder Suggested")

    if expiry < 30:
        print(f"Medicine {i}: High Expiry Risk")