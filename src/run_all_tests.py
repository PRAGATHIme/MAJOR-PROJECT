# src/run_all_tests.py

from run_test_case import run_test_case

TEST_CASES = [
    "TC-01",  # Normal behavior
    "TC-02",  # High amount
    "TC-03",  # International transaction
    "TC-04"   # Frequent transactions
]

print("\nRunning ALL Fraud Test Cases\n")

for tc_id in TEST_CASES:
    print("=" * 50)
    run_test_case(tc_id)
