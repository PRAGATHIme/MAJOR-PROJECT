# src/pyspark_stream_simulation.py
"""
PySpark Structured Streaming Simulation
---------------------------------------
Simulates real-time transaction ingestion using PySpark
and applies the trained Isolation Forest model to detect anomalies.
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import pandas_udf, struct
from pyspark.sql.types import IntegerType
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from src.data_simulation import generate_stream
from src.preprocessing import preprocess_transactions

# ---------------------------------------
# Initialize Spark
# ---------------------------------------
spark = (
    SparkSession.builder
    .appName("RealTimeFraudDetection")
    .getOrCreate()
)

spark.sparkContext.setLogLevel("ERROR")

# ---------------------------------------
# Create Static Model (reused for streaming)
# ---------------------------------------
print("Training initial Isolation Forest model...")
df_init = generate_stream(1000)
df_encoded, scaler = preprocess_transactions(df_init)
model = IsolationForest(n_estimators=100, contamination=0.02, random_state=42)
model.fit(df_encoded)

print("Model trained. Starting PySpark simulation...")

# ---------------------------------------
# Define UDF for Fraud Detection
# ---------------------------------------
@pandas_udf(IntegerType())
def predict_fraud(*cols):
    pdf = pd.concat(cols, axis=1)
    pdf.columns = df_encoded.columns
    preds = model.predict(pdf)
    return pd.Series(np.where(preds == -1, 1, 0))

# ---------------------------------------
# Generate Simulated Streaming Data
# ---------------------------------------
schema = spark.createDataFrame(generate_stream(1)).schema

stream_df = (
    spark.readStream
    .schema(schema)
    .option("maxFilesPerTrigger", 1)
    .csv("data/stream_input")  # placeholder folder for stream batches
)

# ---------------------------------------
# Apply Transformations
# ---------------------------------------
# NOTE: This assumes you’d be feeding incoming data via files
# in the "data/stream_input" directory, one per batch.

# (1) Preprocess incoming batch
# (2) Apply UDF model prediction
# (3) Write results to console

result_df = stream_df.withColumn("is_fraud", predict_fraud(*[stream_df[c] for c in stream_df.columns]))

query = (
    result_df.writeStream
    .outputMode("append")
    .format("console")
    .option("truncate", False)
    .start()
)

query.awaitTermination()
