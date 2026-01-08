# src/forensic_logger.py

import pandas as pd
from datetime import datetime
import os

LOG_FILE = "forensic_logs.csv"

def log_fraud_events(tc_id, df, anomaly_scores, is_fraud):
    logs = []

    for i in range(len(df)):
        if is_fraud[i] == 1:
            logs.append({
                "test_case": tc_id,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "transaction_id": df.iloc[i]["transaction_id"],
                "amount": df.iloc[i]["amount"],
                "country": df.iloc[i]["country"],
                "anomaly_score": anomaly_scores[i],
                "status": "Fraud Suspected"
            })

    if logs:
        log_df = pd.DataFrame(logs)

        if os.path.exists(LOG_FILE):
            log_df.to_csv(LOG_FILE, mode="a", header=False, index=False)
        else:
            log_df.to_csv(LOG_FILE, index=False)
