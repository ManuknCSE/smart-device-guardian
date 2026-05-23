import sys
import json
import joblib
import os
import numpy as np

def main():
    try:
        if len(sys.argv) < 5:
            raise ValueError("Expected 4 arguments: temperature, humidity, current, voltage")

        temperature = float(sys.argv[1])
        humidity = float(sys.argv[2])
        current = float(sys.argv[3])
        voltage = float(sys.argv[4])

        model_path = os.path.join(os.path.dirname(__file__), 'device_health_model.pkl')
        if not os.path.exists(model_path):
            raise FileNotFoundError("Model file not found. Train the model first.")

        model = joblib.load(model_path)

        # Predict
        X_new = np.array([[temperature, humidity, current, voltage]])
        health_score = model.predict(X_new)[0]

        # Determine risk
        if health_score > 80:
            risk = "low"
        elif health_score >= 60:
            risk = "medium"
        else:
            risk = "high"

        result = {
            "healthScore": round(health_score, 2),
            "risk": risk
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
