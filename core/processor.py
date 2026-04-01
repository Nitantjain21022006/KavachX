import numpy as np

def safe_div(a, b):
    """Helper to prevent division by zero during live inference."""
    return a / (b + 1e-6)

def engineer_features_row(data):
    """
    Performs on-the-fly feature engineering for a single incoming JSON request.
    Matches the 7 composite scores defined in the training pipeline.
    """
    # 1. login_failure_rate
    login_failure_rate = safe_div(data.get("failed_login_count", 0), data.get("login_attempts", 0))
    
    # 2. bytes_per_packet
    bytes_per_packet = safe_div(data.get("byte_count", 0), data.get("packet_count", 0))
    
    # 3. syn_flood_score
    syn_flood_score = np.log1p(data.get("syn_packet_count", 0)) * (1 - data.get("syn_ack_ratio", 0))
    
    # 4. mitm_risk_score
    mitm_risk_score = (
        (1 - data.get("ssl_certificate_valid", 1)) * 0.30 +
        data.get("certificate_mismatch", 0) * 0.25 +
        np.log1p(data.get("arp_request_rate", 0)) * 0.15 +
        data.get("mac_change_rate", 0) * 0.15 +
        data.get("duplicate_ip_detected", 0) * 0.15
    )
    
    # 5. ransomware_risk_score
    ransomware_risk_score = (
        np.log1p(data.get("file_modification_rate", 0)) * 0.25 +
        np.log1p(data.get("file_rename_count", 0)) * 0.20 +
        data.get("file_extension_change", 0) * 0.20 +
        np.log1p(data.get("registry_modification_rate", 0)) * 0.15 +
        (data.get("cpu_usage_spike", 0) / 100) * 0.10 +
        np.log1p(data.get("disk_write_rate", 0)) * 0.10
    )
    
    # 6. network_scan_score
    network_scan_score = np.log1p(data.get("unique_destination_ips", 0)) / (np.log1p(data.get("unique_source_ips", 0)) + 1e-6)
    
    # 7. phishing_risk_score
    phishing_risk_score = (
        np.log1p(data.get("url_length", 0)) * 0.25 +
        data.get("suspicious_keyword_count", 0) * 0.30 +
        (1 / (data.get("domain_age", 0) + 1)) * 100 * 0.25 +
        np.log1p(data.get("redirect_count", 0)) * 0.20
    )
    
    # Build complete feature set
    eng_data = data.copy()
    eng_data["login_failure_rate"] = login_failure_rate
    eng_data["bytes_per_packet"] = bytes_per_packet
    eng_data["syn_flood_score"] = syn_flood_score
    eng_data["mitm_risk_score"] = mitm_risk_score
    eng_data["ransomware_risk_score"] = ransomware_risk_score
    eng_data["network_scan_score"] = network_scan_score
    eng_data["phishing_risk_score"] = phishing_risk_score
    
    return eng_data
