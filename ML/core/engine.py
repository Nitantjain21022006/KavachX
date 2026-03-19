import numpy as np

# Attack severity weights used in risk score calculation.
# Represents the inherent danger of each attack class (0.0 to 1.0).
# Used purely by the ML model's risk calculation. NOT used anywhere in the backend.
SEVERITY_BASE = {
    "Normal":     0.0,
    "DDoS":       0.9,
    "BruteForce": 0.8,
    "MITM":       0.7,
    "Phishing":   0.6,
    "Ransomware": 0.9,
    "Injection":  0.75,
    "Spoofing":   0.65,
}

def calculate_risk_score(anomaly_score, confidence, attack_type):
    """
    Calculates the final Risk Score (0-100) using a weighted combination:
    - 35% Anomaly Probability
    - 35% Model Confidence
    - 30% Inherent Attack Severity Weight
    """
    base_sev = SEVERITY_BASE.get(attack_type, 0.5)
    risk = (anomaly_score * 0.35 + confidence * 0.35 + base_sev * 0.30)
    return round(risk * 100, 2)

def get_severity_label(risk_score):
    """
    Maps the 0-100 risk score to a qualitative severity tier.
    This is the authoritative label returned by the ML model.
    The backend uses this value as-is with no overrides.
    """
    if risk_score > 80: return "High"
    if risk_score > 40: return "Medium"
    return "Low"

def get_recommended_action(attack_type, severity):
    """Determines the immediate response based on attack type and ML severity."""
    if attack_type == "Normal":
        return "Monitor"
    if severity == "High":
        return "Block IP"
    if severity == "Medium":
        return "Alert Admin"
    return "Monitor"
