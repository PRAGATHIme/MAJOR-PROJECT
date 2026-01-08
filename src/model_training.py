import numpy as np
from sklearn.ensemble import IsolationForest

def train_isolation_forest(df_encoded, contamination=0.02, random_state=42):
    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=random_state
    )
    model.fit(df_encoded)
    return model


def predict_fraud(model, df_encoded):
    anomaly_scores = model.decision_function(df_encoded)
    predictions = model.predict(df_encoded)

    # -1 → fraud, 1 → normal
    is_fraud = np.where(predictions == -1, 1, 0)

    return anomaly_scores, is_fraud

































































