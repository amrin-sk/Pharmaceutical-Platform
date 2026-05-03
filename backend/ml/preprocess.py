import pandas as pd

def load_data():
    df = pd.read_csv("dataset/pharma_large_dataset.csv")
    return df

def preprocess(df):
    df = df.fillna(0)

    # Drop Date column
    if 'Date' in df.columns:
        df = df.drop(['Date'], axis=1)

    # Convert categorical columns
    df = pd.get_dummies(
        df,
        columns=['Category', 'Medicine', 'Supplier'],
        drop_first=True
    )

    return df