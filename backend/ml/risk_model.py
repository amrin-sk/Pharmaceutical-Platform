from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

def create_risk_label(df):
    if 'Expiry_Days_Left' not in df.columns:
        raise Exception("Column 'Expiry_Days_Left' not found")

    df['risk'] = df['Expiry_Days_Left'].apply(
        lambda x: 2 if x < 30 else (1 if x < 90 else 0)
    )
    return df

def train_risk_model(df):
    df = create_risk_label(df)

    X = df.drop(['risk', 'Expiry_Days_Left'], axis=1)
    y = df['risk']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(n_estimators=100)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)

    acc = accuracy_score(y_test, preds)

    print(" Risk Model Accuracy:", acc)

    return model