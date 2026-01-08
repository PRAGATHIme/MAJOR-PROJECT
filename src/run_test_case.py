# src/run_test_case.py

from data_simulation import generate_stream
from preprocessing import preprocess_transactions
from model_training import train_isolation_forest, predict_fraud
from forensic_logger import log_fraud_events

# -------------------------------
# Test Case Mapping
# -------------------------------
TEST_CASES = {
    "TC-01": "normal",
    "TC-02": "high_amount",
    "TC-03": "international",
    "TC-04": "frequent_transactions"
}

def get_fraud_type(tc_id):
    return TEST_CASES.get(tc_id, "normal")

# -------------------------------
# Run Test Case
# -------------------------------
def run_test_case(tc_id="TC-01", n_samples=500):
    print(f"\nRunning Test Case: {tc_id}")

    # 1️⃣ Get fraud scenario
    fraud_type = get_fraud_type(tc_id)
    print(f"Fraud Scenario: {fraud_type}")

    # 2️⃣ Generate simulated transactions
    df = generate_stream(n=n_samples)

    # 3️⃣ Preprocess data
    df_encoded, scaler = preprocess_transactions(df)

    # 4️⃣ Train Isolation Forest
    model = train_isolation_forest(df_encoded)

    # 5️⃣ Predict fraud
    anomaly_scores, is_fraud = predict_fraud(model, df_encoded)

    # 6️⃣ Log forensic evidence
    log_fraud_events(tc_id, df, anomaly_scores, is_fraud)

    # 7️⃣ Summary
    fraud_count = is_fraud.sum()
    print(f"Detected Fraud Transactions: {fraud_count}/{n_samples}")

    return fraud_count

# -------------------------------
# Entry Point
# -------------------------------
if __name__ == "__main__":
    run_test_case("TC-04")
