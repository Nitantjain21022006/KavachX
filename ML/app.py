import os
import numpy as np
import logging
from flask import Flask, request, jsonify

# Modular Imports
from core.processor import engineer_features_row
from core.loader import load_bundle
from core.engine import calculate_risk_score, get_severity_label, get_recommended_action

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Resolve paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model/cybersecurity_model.pkl")

# Global Bundle
BUNDLE = load_bundle(MODEL_PATH)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint to ensure the API and model are ready."""
    return jsonify({
        "status": "healthy",
        "model_loaded": BUNDLE is not None,
        "version": BUNDLE.get("version", "unknown") if BUNDLE else "N/A"
    })

@app.route('/predict', methods=['POST'])
@app.route('/api/ml/analyze', methods=['POST'])
def predict():
    """
    Main prediction endpoint.
    1. Receives 36 raw features.
    2. Performs on-the-fly feature engineering.
    3. Executes multi-output prediction.
    4. Calculates risk and severity.
    """
    if BUNDLE is None:
        logger.error("Prediction attempt failed: Model bundle not loaded.")
        return jsonify({"error": "Model bundle not loaded"}), 500

    raw_data = request.get_json()
    if not raw_data:
        return jsonify({"error": "No JSON payload provided"}), 400

    try:
        # 1. Modular Feature Engineering
        eng_data = engineer_features_row(raw_data)
        
        # 2. Vectorize features in correct order
        X_raw = np.array([eng_data.get(f, 0) for f in BUNDLE["feature_cols"]]).reshape(1, -1)
        
        # 3. Scale & Predict
        X_sc = BUNDLE["scaler"].transform(X_raw)
        preds = BUNDLE["model"].predict(X_sc)[0] 
        probas = BUNDLE["model"].predict_proba(X_sc)
        
        # 4. Extract metrics
        anomaly_score = float(probas[0][0][1])
        confidence = float(np.max(probas[1][0]))
        attack_type = BUNDLE["label_map"][int(preds[1])]
        prob_normal = probas[1][0][0]
        
        # 5. Modular Risk Calculation
        fp_prob = (1 - confidence) * 0.6 + prob_normal * 0.4
        risk_score = calculate_risk_score(anomaly_score, confidence, attack_type)
        severity = get_severity_label(risk_score)
        action = get_recommended_action(attack_type, severity)

        # 6. Response Construction
        alert = {
            "attack_detected": bool(preds[0] > 0),
            "anomaly_score": round(anomaly_score, 4),
            "attack_type": attack_type,
            "attack_category": BUNDLE["category_map"].get(attack_type, "N/A"),
            "confidence_score": round(confidence, 4),
            "false_positive_prob": round(fp_prob, 4),
            "severity_score": severity,
            "risk_score": risk_score, # Already rounded to 2 decimals
            "recommended_action": action
        }
        
        logger.info(f"Prediction: {attack_type} | Severity: {severity} | Risk: {risk_score}")
        return jsonify(alert)

    except Exception as e:
        logger.exception("Internal error during prediction processing.")
        return jsonify({"error": "Server error", "message": str(e)}), 500

if __name__ == '__main__':
    logger.info("Initializing Cyber-ML Unified API...")
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)