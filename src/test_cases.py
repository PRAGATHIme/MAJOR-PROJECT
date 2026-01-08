# src/test_cases.py

TEST_CASES = {
    "TC-01": "MULTI_ACCOUNT_IP",
    "TC-02": "EMAIL_PATTERN",
    "TC-03": "UNUSUAL_TIME",
    "TC-04": "CART_ABUSE",
    "TC-05": "ADD_REMOVE_LOOP",
    "TC-06": "HIGH_VALUE_CART",
    "TC-07": "LOGIN_FLOOD",
    "TC-08": "MULTI_IP_SESSION",
    "TC-09": "GEO_ANOMALY",
    "TC-10": "COD_BURST",
    "TC-11": "ADDRESS_MISMATCH",
    "TC-12": "CANCEL_FLOOD"
}

def get_fraud_type(tc_id):
    return TEST_CASES.get(tc_id, None)
