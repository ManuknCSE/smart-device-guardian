import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# Generate some synthetic data for training
np.random.seed(42)
n_samples = 1000

# Features: temperature, humidity, current, voltage
temperature = np.random.normal(50, 15, n_samples)
humidity = np.clip(np.random.normal(60, 15, n_samples), 0, 100)
current = np.random.normal(5, 2, n_samples)
voltage = np.random.normal(220, 10, n_samples)

# Synthetic Health Score logic (0-100)
# Higher temperature, higher humidity, higher current, voltage dev = lower health
healthScore = 100 - (
    (temperature - 40).clip(0) * 0.6 +
    (humidity - 60).clip(0) * 0.3 +
    (current - 5).clip(0) * 2.5 +
    np.abs(voltage - 220) * 0.4 +
    np.random.normal(0, 2, n_samples)
)
healthScore = np.clip(healthScore, 0, 100)

X = np.column_stack((temperature, humidity, current, voltage))
y = healthScore

# Train model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model
model_path = os.path.join(os.path.dirname(__file__), 'device_health_model.pkl')
joblib.dump(model, model_path)

print(f"Model trained and saved to {model_path}")
