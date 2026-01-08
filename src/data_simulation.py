# src/data_simulation.py
import numpy as np
import pandas as pd
import random

def simulate_transaction(fraud_type=None):
    transaction = {
        "transaction_id": np.random.randint(100000, 999999),
        "customer_id": np.random.randint(1000, 9999),
        "amount": round(np.random.uniform(1, 5000), 2),
        "merchant_type": random.choice(
            ["electronics", "grocery", "fashion", "gaming", "travel"]
        ),
        "transaction_hour": np.random.randint(0, 24),
        "country": random.choice(["US", "CA", "UK", "DE", "IN"]),
        "is_international": random.choice([0, 1]),
        "device_type": random.choice(["mobile", "web", "tablet"]),
        "previous_fraud_count": np.random.randint(0, 5),
    }

    # 🔴 Inject abnormal behavior based on test case
    if fraud_type == "HIGH_VALUE_CART":          # TC-06
        transaction["amount"] = round(np.random.uniform(100000, 200000), 2)

    elif fraud_type == "UNUSUAL_TIME":            # TC-03
        transaction["transaction_hour"] = random.choice([2, 3, 4])

    elif fraud_type == "GEO_ANOMALY":              # TC-09
        transaction["country"] = "RU"
        transaction["is_international"] = 1

    elif fraud_type == "REPEAT_FRAUD_USER":        # helps TC-12
        transaction["previous_fraud_count"] = np.random.randint(10, 20)

    return transaction


def generate_stream(n=1000, fraud_type=None):
    return pd.DataFrame(
        [simulate_transaction(fraud_type) for _ in range(n)]
    )
