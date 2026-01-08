import streamlit as st
import pandas as pd
import numpy as np
import time
import matplotlib.pyplot as plt
import seaborn as sns

from src.data_simulation import generate_stream
from src.preprocessing import preprocess_transactions
from src.model_training import train_isolation_forest, predict_fraud

# -----------------------------------
# Page Configuration
# -----------------------------------
st.set_page_config(
    page_title="Real-Time Fraud Detection Dashboard",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("Real-Time Fraud Detection System")
st.markdown("""
This dashboard simulates **live financial transactions** and detects potential fraud in real-time.
Use the sidebar to configure simulation settings.
""")

# -----------------------------------
# Sidebar Controls
# -----------------------------------
st.sidebar.header("Simulation Settings")

n_init = st.sidebar.slider("Initial Transactions", 500, 5000, 1000, step=500)
n_stream = st.sidebar.slider("Transactions per Stream Batch", 100, 1000, 200, step=100)
refresh_time = st.sidebar.slider("Seconds between batches", 1, 10, 3)
contamination = st.sidebar.slider("Fraud Contamination Level", 0.01, 0.1, 0.02)

# -----------------------------------
# Initial Training Data
# -----------------------------------
st.subheader("Model Initialization")
st.write(f"Generating initial {n_init} transactions...")

df_init = generate_stream(n_init)
df_encoded, scaler = preprocess_transactions(df_init)
feature_columns = df_encoded.columns

model = train_isolation_forest(df_encoded, contamination=contamination)
df_init["fraud_score"], df_init["is_fraud"] = predict_fraud(model, df_encoded)

fraud_count = df_init["is_fraud"].sum()
fraud_rate = fraud_count / len(df_init)

st.metric("Initial Fraudulent Transactions", fraud_count)
st.metric("Initial Fraud Rate", f"{fraud_rate:.2%}")

# -----------------------------------
# Static Visualizations (Initial)
# -----------------------------------
col1, col2 = st.columns(2)

with col1:
    st.write("### Fraud vs Normal Transaction Amounts")
    fig, ax = plt.subplots(figsize=(6,4))
    sns.histplot(data=df_init, x="amount", hue="is_fraud", bins=30, kde=True, ax=ax)
    ax.set_title("Transaction Amount Distribution")
    st.pyplot(fig)

with col2:
    st.write("### Top Merchant Types Flagged as Fraudulent")
    fraud_summary = df_init[df_init["is_fraud"] == 1]["merchant_type"].value_counts().head(10)
    fig2, ax2 = plt.subplots(figsize=(6,4))
    fraud_summary.plot(kind="barh", color="salmon", ax=ax2)
    ax2.set_xlabel("Count")
    ax2.set_ylabel("Merchant Type")
    st.pyplot(fig2)

# -----------------------------------
# Streaming Simulation
# -----------------------------------
st.subheader("Real-Time Streaming Simulation")
placeholder = st.empty()

stream_batches = st.sidebar.number_input("Number of Batches to Stream", 1, 20, 5)

for i in range(stream_batches):
    new_batch = generate_stream(n_stream)
    new_encoded, _ = preprocess_transactions(new_batch)
    new_encoded = new_encoded.reindex(columns=feature_columns, fill_value=0)

    preds = model.predict(new_encoded)
    new_batch["is_fraud"] = np.where(preds == -1, 1, 0)

    batch_fraud_count = new_batch["is_fraud"].sum()
    batch_fraud_rate = batch_fraud_count / len(new_batch)

    with placeholder.container():
        st.markdown(f"### Batch {i+1} Results")
        st.metric("Frauds Detected in Batch", batch_fraud_count)
        st.metric("Fraud Rate", f"{batch_fraud_rate:.2%}")

        st.dataframe(new_batch.head(10))

        fraud_summary = new_batch[new_batch["is_fraud"] == 1]["merchant_type"].value_counts()
        fig3, ax3 = plt.subplots(figsize=(6,3))
        fraud_summary.plot(kind="barh", color="salmon", ax=ax3)
        ax3.set_title("Fraudulent Merchant Types (Batch)")
        st.pyplot(fig3)

    time.sleep(refresh_time)

# -----------------------------------
# SHAP Explainability (Feature Importance)
# -----------------------------------
import shap
from src.explainability import compute_shap_values

st.subheader("Model Explainability (SHAP Analysis)")
st.markdown("""
This section uses **SHAP (SHapley Additive exPlanations)** to show which features most influenced the model's fraud detection decisions.
""")

@st.cache_resource(show_spinner=False)
def get_shap_analysis(_model, df_encoded):
    explainer, shap_values, sample_df = compute_shap_values(_model, df_encoded)
    return explainer, shap_values, sample_df

explainer, shap_values, sample_df = get_shap_analysis(model, df_encoded)

# Plot summary of feature importance
with st.expander("Top SHAP Feature Importances", expanded=True):
    fig, ax = plt.subplots(figsize=(7, 4))
    shap.summary_plot(shap_values, sample_df, plot_type="bar", show=False)
    st.pyplot(fig)

# Optional: Show top numeric feature importance values
with st.expander("Feature Importance Table"):
    importance_df = pd.DataFrame(
        np.abs(shap_values).mean(axis=0),
        index=sample_df.columns,
        columns=["Mean(|SHAP Value|)"]
    ).sort_values(by="Mean(|SHAP Value|)", ascending=False).head(10)

    st.write("#### Top 10 Most Influential Features")
    st.dataframe(importance_df.style.format("{:.4f}"))
