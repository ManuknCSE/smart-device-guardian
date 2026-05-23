# =========================================================
# Smart Device Aging Predictor System
# Flask + MongoDB Backend
# =========================================================

import os
import json
import socket
from datetime import datetime, timedelta
from bson.objectid import ObjectId

from flask import Flask, request, jsonify, render_template
from flask_pymongo import PyMongo
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
import joblib
import google.generativeai as genai

# Load environment variables
load_dotenv()

# =========================================================
# Flask App Configuration
# =========================================================
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# =========================================================
# MongoDB Configuration
# =========================================================
# Prioritize MONGODB_URI from environment variables, fallback to local
mongo_uri = os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URI")
if not mongo_uri or "YOUR_USERNAME" in mongo_uri:
    mongo_uri = "mongodb://localhost:27017/smart-device-guardian"

app.config["MONGO_URI"] = mongo_uri
mongo = PyMongo(app)

# =========================================================
# ML Model Loading
# =========================================================
model_path = os.path.join(os.path.dirname(__file__), 'ml', 'device_health_model.pkl')
ml_model = None

def load_ml_model():
    global ml_model
    if os.path.exists(model_path):
        try:
            ml_model = joblib.load(model_path)
            print(f"ML Model loaded successfully from {model_path}")
        except Exception as e:
            print(f"Error loading ML model: {e}")
    else:
        print("ML Model file not found. Please train the model first.")

load_ml_model()

# =========================================================
# Helper Function: Get Local Network IP
# =========================================================
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

# =========================================================
# Helper Function: Format MongoDB Documents
# =========================================================
def format_sensor_data(record):
    if not record:
        return None
    return {
        "id": str(record.get("_id")),
        "timestamp": record.get("timestamp"),
        "temperature": record.get("temperature", 0.0),
        "humidity": record.get("humidity", 0.0),
        "current": record.get("current", 0.0),
        "voltage": record.get("voltage", 0.0),
        "vibration": record.get("vibration", "UNKNOWN"),
        "relay_status": record.get("relay_status", "UNKNOWN"),
        "led_status": record.get("led_status", "UNKNOWN"),
        "health_score": record.get("health_score", 100.0),
        "risk": record.get("risk", "low"),
        "alerts": record.get("alerts", [])
    }

# =========================================================
# Database Seeder (for visual demo when empty)
# =========================================================
def seed_db_if_empty():
    try:
        if mongo.db.sensor_logs.count_documents({}) == 0:
            print("Database is empty, seeding historical data for visualization...")
            now = datetime.now()
            records = []
            for i in range(24, 0, -1):
                time_offset = now - timedelta(hours=i)
                # Generate realistic telemetry
                temp = 42.5 + np.sin(i / 3) * 8 + np.random.normal(0, 1)
                humidity = 55.0 + np.cos(i / 4) * 5 + np.random.normal(0, 1)
                current = 4.5 + np.sin(i / 5) * 1.5 + np.random.normal(0, 0.2)
                voltage = 220.0 + np.random.normal(0, 2)
                
                # Default ML predictions
                health_score = 100.0
                risk = "low"
                if ml_model:
                    try:
                        features = np.array([[temp, humidity, current, voltage]])
                        health_score = float(ml_model.predict(features)[0])
                        health_score = max(0.0, min(100.0, health_score))
                        if health_score > 80:
                            risk = "low"
                        elif health_score >= 60:
                            risk = "medium"
                        else:
                            risk = "high"
                    except:
                        pass
                
                # Check alerts
                alerts = []
                if temp > 75:
                    alerts.append({"id": f"a_t_{i}", "level": "critical", "message": "High temperature exceeds safe threshold (>75°C)", "timestamp": "Recent"})
                elif temp > 60:
                    alerts.append({"id": f"a_t_{i}", "level": "warning", "message": "Temperature trending upward over last 24h", "timestamp": "Recent"})
                if current > 8:
                    alerts.append({"id": f"a_c_{i}", "level": "warning", "message": "Current increasing rapidly, possible internal wear", "timestamp": "Recent"})
                if health_score < 60:
                    alerts.append({"id": f"a_h_{i}", "level": "critical", "message": "Device health low, maintenance recommended immediately", "timestamp": "Recent"})
                elif health_score < 80:
                    alerts.append({"id": f"a_h_{i}", "level": "warning", "message": "Device health moderate, schedule preventative maintenance", "timestamp": "Recent"})
                
                records.append({
                    "timestamp": time_offset.strftime("%Y-%m-%d %H:%M:%S"),
                    "temperature": round(temp, 2),
                    "humidity": round(humidity, 2),
                    "current": round(current, 2),
                    "voltage": round(voltage, 2),
                    "vibration": "NORMAL" if temp < 60 else "HIGH",
                    "relay_status": "ON" if temp < 75 else "OFF",
                    "led_status": "GREEN" if health_score > 75 else "RED",
                    "health_score": round(health_score, 2),
                    "risk": risk,
                    "alerts": alerts
                })
            mongo.db.sensor_logs.insert_many(records)
            print(f"Seeded {len(records)} entries into sensor_logs collection.")
    except Exception as e:
        print(f"Failed to seed database: {e}")

# =========================================================
# Dashboard Route
# =========================================================
@app.route('/')
def dashboard():
    latest = mongo.db.sensor_logs.find_one(
        sort=[("timestamp", -1)]
    )
    history_cursor = mongo.db.sensor_logs.find().sort(
        "timestamp", -1
    ).limit(50)

    history = [format_sensor_data(doc) for doc in history_cursor]

    return render_template(
        "dashboard.html",
        latest=format_sensor_data(latest) if latest else None,
        history=history
    )

# =========================================================
# Health Check Route
# =========================================================
@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Check database connectivity
        mongo.db.sensor_logs.find_one()
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    return jsonify({
        "status": "MongoDB backend running",
        "database": db_status,
        "ml_model_loaded": ml_model is not None
    })

# =========================================================
# Arduino Sensor Data Upload Endpoint
# =========================================================
@app.route('/api/sensor-data', methods=['POST'])
def receive_sensor_data():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No JSON payload received"
            }), 400

        # Reload model if it wasn't loaded
        if ml_model is None:
            load_ml_model()

        # Parse variables
        temperature = float(data.get("temperature", 0.0))
        humidity = float(data.get("humidity", 0.0))
        current = float(data.get("current", 0.0))
        voltage = float(data.get("voltage", 0.0))
        vibration = data.get("vibration", "NORMAL")
        relay_status = data.get("relay_status", "ON")
        led_status = data.get("led_status", "GREEN")

        # ML health prediction
        health_score = 100.0
        risk = "low"
        if ml_model:
            try:
                features = np.array([[temperature, humidity, current, voltage]])
                health_score = float(ml_model.predict(features)[0])
                health_score = max(0.0, min(100.0, health_score))
                if health_score > 80:
                    risk = "low"
                elif health_score >= 60:
                    risk = "medium"
                else:
                    risk = "high"
            except Exception as e:
                print(f"ML Prediction failed: {e}")

        # Check alerts
        alerts = []
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if temperature > 75:
            alerts.append({"id": f"alert_{int(datetime.now().timestamp())}_1", "level": "critical", "message": "High temperature exceeds safe threshold (>75°C)", "timestamp": now_str})
        elif temperature > 60:
            alerts.append({"id": f"alert_{int(datetime.now().timestamp())}_1", "level": "warning", "message": "Temperature trending upward over last 24h", "timestamp": now_str})
        if current > 8:
            alerts.append({"id": f"alert_{int(datetime.now().timestamp())}_2", "level": "warning", "message": "Current increasing rapidly, possible internal wear", "timestamp": now_str})
        if health_score < 60:
            alerts.append({"id": f"alert_{int(datetime.now().timestamp())}_3", "level": "critical", "message": "Device health low, maintenance recommended immediately", "timestamp": now_str})
        elif health_score < 80:
            alerts.append({"id": f"alert_{int(datetime.now().timestamp())}_3", "level": "warning", "message": "Device health moderate, schedule preventative maintenance", "timestamp": now_str})

        # Set up RTC timestamp or current time
        arduino_timestamp = data.get("timestamp")
        timestamp_value = arduino_timestamp if arduino_timestamp else now_str

        # Sensor Record
        sensor_record = {
            "timestamp": timestamp_value,
            "temperature": temperature,
            "humidity": humidity,
            "current": current,
            "voltage": voltage,
            "vibration": vibration,
            "relay_status": relay_status,
            "led_status": led_status,
            "health_score": round(health_score, 2),
            "risk": risk,
            "alerts": alerts
        }

        result = mongo.db.sensor_logs.insert_one(sensor_record)

        return jsonify({
            "message": "Sensor data stored successfully",
            "entry_id": str(result.inserted_id),
            "health_score": round(health_score, 2),
            "risk": risk
        }), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# Latest Sensor Data API
# =========================================================
@app.route('/api/latest', methods=['GET'])
def latest_sensor_data():
    latest = mongo.db.sensor_logs.find_one(
        sort=[("timestamp", -1)]
    )

    if latest:
        return jsonify(format_sensor_data(latest))

    return jsonify({
        "message": "No sensor data available"
    }), 404

# =========================================================
# Full Sensor History API
# =========================================================
@app.route('/api/history', methods=['GET'])
def sensor_history():
    records = mongo.db.sensor_logs.find().sort(
        "timestamp", -1
    ).limit(100)  # Limit to 100 items for stability

    return jsonify([
        format_sensor_data(record)
        for record in records
    ])

# =========================================================
# Delete Record Endpoint
# =========================================================
@app.route('/api/delete/<record_id>', methods=['DELETE'])
def delete_record(record_id):
    try:
        result = mongo.db.sensor_logs.delete_one({
            "_id": ObjectId(record_id)
        })

        if result.deleted_count == 1:
            return jsonify({
                "message": "Record deleted successfully"
            })

        return jsonify({
            "error": "Record not found"
        }), 404

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# Baseline Data Endpoint
# =========================================================
@app.route('/api/baseline', methods=['GET'])
def baseline_data():
    records = list(
        mongo.db.sensor_logs.find().limit(100)
    )

    if not records:
        return jsonify({
            "message": "Not enough baseline data"
        }), 404

    avg_temp = sum(r.get("temperature", 0.0) for r in records) / len(records)
    avg_humidity = sum(r.get("humidity", 0.0) for r in records) / len(records)
    avg_current = sum(r.get("current", 0.0) for r in records) / len(records)
    avg_voltage = sum(r.get("voltage", 0.0) for r in records) / len(records)

    return jsonify({
        "baseline_temperature": round(avg_temp, 2),
        "baseline_humidity": round(avg_humidity, 2),
        "baseline_current": round(avg_current, 2),
        "baseline_voltage": round(avg_voltage, 2)
    })

# =========================================================
# Direct ML Prediction Endpoint
# =========================================================
@app.route('/api/ai/predict', methods=['POST'])
def api_ai_predict():
    try:
        data = request.get_json() or {}
        temperature = float(data.get("temperature", 0.0))
        humidity = float(data.get("humidity", 0.0))
        current = float(data.get("current", 0.0))
        voltage = float(data.get("voltage", 0.0))
        
        # Reload model if needed
        if ml_model is None:
            load_ml_model()
            
        if ml_model:
            features = np.array([[temperature, humidity, current, voltage]])
            health_score = float(ml_model.predict(features)[0])
            health_score = max(0.0, min(100.0, health_score))
            
            if health_score > 80:
                risk = "low"
            elif health_score >= 60:
                risk = "medium"
            else:
                risk = "high"
                
            return jsonify({
                "healthScore": round(health_score, 2),
                "risk": risk
            })
        else:
            return jsonify({"error": "ML model not trained/loaded"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# Maintenance Suggestions Endpoint
# =========================================================
@app.route('/api/ai/suggest', methods=['POST'])
def api_ai_suggest():
    try:
        data = request.get_json() or {}
        temperature = float(data.get("temperature", 0.0))
        health_score = float(data.get("healthScore", 100.0))
        risk = data.get("risk", "low")
        current = float(data.get("current", 0.0))
        
        suggestions = []
        if temperature > 75:
            suggestions.append("Device overheating, consider shutdown.")
        elif temperature > 60:
            suggestions.append("Temperature is running high, monitor closely.")
            
        if current > 8:
            suggestions.append("Current increasing rapidly, possible internal wear.")
            
        if health_score < 60:
            suggestions.append("Device health low, maintenance recommended immediately.")
        elif health_score < 80:
            suggestions.append("Device health moderate, schedule preventative maintenance.")
            
        if risk == "high":
            suggestions.append("Risk of failure is HIGH. Replacement or critical maintenance required.")
            
        if not suggestions:
            suggestions.append("Device is operating optimally. No action required.")
            
        return jsonify({"suggestions": suggestions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# AI Assistant Chat Endpoint
# =========================================================
@app.route('/api/ai/chat', methods=['POST'])
def api_ai_chat():
    try:
        data = request.get_json() or {}
        message = data.get("message")
        context = data.get("context", {})
        
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return jsonify({"error": "Gemini API Key is missing. Please add it to backend/.env"}), 500
        
        genai.configure(api_key=api_key)
        
        system_instruction = (
            "You are a Smart Device Guardian AI assistant. "
            "You analyze IoT devices for health, temperature, humidity, current, voltage, and predict failures. "
            f"Current Device Context: {json.dumps(context)} "
            "Be helpful, concise, and provide actionable maintenance advice based on the data."
        )
        
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
        
        response = model.generate_content(message)
        return jsonify({"reply": response.text})
    except Exception as e:
        print(f"Gemini error: {e}")
        return jsonify({"error": f"Failed to communicate with Gemini API: {str(e)}"}), 500

# =========================================================
# Main Server Launch
# =========================================================
if __name__ == "__main__":
    # Seed data if DB is empty
    seed_db_if_empty()
    
    local_ip = get_local_ip()

    print("=================================================")
    print(" SMART DEVICE AGING PREDICTOR FLASK SERVER ")
    print("=================================================")
    print(f" Local Dashboard:   http://127.0.0.1:5000")
    print(f" Network Dashboard: http://{local_ip}:5000")
    print("=================================================")
    print(" Use this IP in Arduino code:")
    print(f' char serverAddress[] = "{local_ip}";')
    print("=================================================")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
