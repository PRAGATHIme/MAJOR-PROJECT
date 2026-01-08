# src/preprocessing.py
import pandas as pd
from sklearn.preprocessing import StandardScaler

def preprocess_transactions(df):
    """Encode categorical features and normalize numeric ones."""
    
    df_encoded = pd.get_dummies(
        df,
        columns=["merchant_type", "country", "device_type"],
        drop_first=True
    )

    numeric_cols = [
        "amount",
        "transaction_hour",
        "previous_fraud_count",
        "is_international"
    ]

    scaler = StandardScaler()
    df_encoded[numeric_cols] = scaler.fit_transform(df_encoded[numeric_cols])

    return df_encoded, scaler
