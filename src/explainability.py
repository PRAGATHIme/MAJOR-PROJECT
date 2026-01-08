# src/explainability.py
"""
Explainability utilities for the Real-Time Fraud Detection System.
Provides SHAP-based feature importance and interpretability visualizations.
"""

import shap
import pandas as pd
import matplotlib.pyplot as plt

def compute_shap_values(model, df_encoded, sample_size=200):
    """
    Compute SHAP values for a given trained IsolationForest model.
    Since IsolationForest isn't natively supported by SHAP TreeExplainer,
    we use KernelExplainer on a sample of the data.
    """
    # Sample subset for faster computation
    sample_df = df_encoded.sample(min(sample_size, len(df_encoded)), random_state=42)
    background = shap.sample(df_encoded, 100, random_state=42)

    # Create SHAP explainer
    explainer = shap.KernelExplainer(model.decision_function, background)
    shap_values = explainer.shap_values(sample_df, nsamples=100)

    return explainer, shap_values, sample_df


def plot_shap_summary(shap_values, sample_df):
    """Display a SHAP summary plot of feature impact."""
    shap.summary_plot(shap_values, sample_df, plot_type="bar", show=False)
    plt.title("SHAP Feature Importance (Top Drivers of Fraud Scores)")
    plt.tight_layout()
    plt.show()


def plot_single_explanation(explainer, shap_values, sample_df, index=0):
    """Display a SHAP force plot for an individual transaction."""
    sample = sample_df.iloc[index:index+1]
    shap.initjs()
    return shap.force_plot(explainer.expected_value, shap_values[index], sample)
