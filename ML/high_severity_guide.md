# 🔴 High Severity API Testing Guide

This guide contains **High Severity** (Risk Score > 80) testing payloads targeting absolute decision extrema.

---

## 🔴 1. CLASS: DDoS (Critical)

*   **Input Payload**:
```json
{
    "packet_count": 50000, "byte_count": 5000, "syn_packet_count": 45000, "syn_ack_ratio": 0.05,
    "unique_source_ips": 1000, "unique_destination_ips": 5, "packets_per_second": 10,
    "failed_login_count": 0, "login_attempts": 1, "ssl_certificate_valid": 1, "certificate_mismatch": 0,
    "arp_request_rate": 2, "mac_change_rate": 0, "duplicate_ip_detected": 0,
    "url_length": 25, "suspicious_keyword_count": 0, "domain_age": 1000, "redirect_count": 0,
    "file_modification_rate": 5, "file_rename_count": 1, "file_extension_change": 0,
    "registry_modification_rate": 1, "cpu_usage_spike": 10, "disk_write_rate": 20,
    "api_request_count": 5, "http_response_code_200": 100, "http_response_code_404": 0,
    "user_agent_missing": 0, "referrer_missing": 0, "cookie_count": 5,
    "session_duration": 1200, "process_count": 40, "thread_count": 100,
    "memory_usage_mb": 2048, "network_io_rate": 50, "system_up_time": 7200
}
```
*   **Expected Response**:
```json
{
    "attack_detected": true,
    "anomaly_score": 0.9564,
    "attack_type": "DDoS",
    "attack_category": "many-1 server",
    "confidence_score": 0.9957,
    "false_positive_prob": 0.0029,
    "severity_score": "High",
    "risk_score": 95.32,
    "recommended_action": "Block IP"
}
```

---

## 🟠 2. CLASS: BruteForce (Aggressive)

*   **Input Payload**:
```json
{
    "packet_count": 50, "byte_count": 5000, "syn_packet_count": 5, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
    "failed_login_count": 490, "login_attempts": 500, "ssl_certificate_valid": 1, "certificate_mismatch": 0,
    "arp_request_rate": 2, "mac_change_rate": 0, "duplicate_ip_detected": 0,
    "url_length": 25, "suspicious_keyword_count": 0, "domain_age": 1000, "redirect_count": 0,
    "file_modification_rate": 5, "file_rename_count": 1, "file_extension_change": 0,
    "registry_modification_rate": 1, "cpu_usage_spike": 10, "disk_write_rate": 20,
    "api_request_count": 5, "http_response_code_200": 100, "http_response_code_404": 0,
    "user_agent_missing": 0, "referrer_missing": 0, "cookie_count": 5,
    "session_duration": 1200, "process_count": 40, "thread_count": 100,
    "memory_usage_mb": 2048, "network_io_rate": 50, "system_up_time": 7200
}
```
*   **Expected Response**:
```json
{
    "attack_detected": true,
    "anomaly_score": 0.9474,
    "attack_type": "BruteForce",
    "attack_category": "many-1 server",
    "confidence_score": 0.9936,
    "false_positive_prob": 0.0044,
    "severity_score": "High",
    "risk_score": 91.94,
    "recommended_action": "Block IP"
}
```

---

## 🟡 3. CLASS: MITM (Active Exploitation)

*   **Input Payload**:
```json
{
    "packet_count": 50, "byte_count": 5000, "syn_packet_count": 5, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
    "failed_login_count": 0, "login_attempts": 1, "ssl_certificate_valid": 0, "certificate_mismatch": 1,
    "arp_request_rate": 100, "mac_change_rate": 1, "duplicate_ip_detected": 1,
    "url_length": 25, "suspicious_keyword_count": 0, "domain_age": 1000, "redirect_count": 0,
    "file_modification_rate": 5, "file_rename_count": 1, "file_extension_change": 0,
    "registry_modification_rate": 1, "cpu_usage_spike": 10, "disk_write_rate": 20,
    "api_request_count": 5, "http_response_code_200": 100, "http_response_code_404": 0,
    "user_agent_missing": 0, "referrer_missing": 0, "cookie_count": 5,
    "session_duration": 1200, "process_count": 40, "thread_count": 100,
    "memory_usage_mb": 2048, "network_io_rate": 50, "system_up_time": 7200
}
```
*   **Expected Response**:
```json
{
    "attack_detected": true,
    "anomaly_score": 0.926,
    "attack_type": "MITM",
    "attack_category": "many-1 server",
    "confidence_score": 0.9951,
    "false_positive_prob": 0.0034,
    "severity_score": "High",
    "risk_score": 88.24,
    "recommended_action": "Block IP"
}
```

---

## 🟣 4. CLASS: Phishing (Critical Exfiltration)

*   **Input Payload**:
```json
{
    "packet_count": 50, "byte_count": 5000, "syn_packet_count": 5, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
    "failed_login_count": 0, "login_attempts": 1, "ssl_certificate_valid": 1, "certificate_mismatch": 0,
    "arp_request_rate": 2, "mac_change_rate": 0, "duplicate_ip_detected": 0,
    "url_length": 400, "suspicious_keyword_count": 8, "domain_age": 5, "redirect_count": 0,
    "file_modification_rate": 5, "file_rename_count": 1, "file_extension_change": 0,
    "registry_modification_rate": 1, "cpu_usage_spike": 10, "disk_write_rate": 20,
    "api_request_count": 5, "http_response_code_200": 100, "http_response_code_404": 0,
    "user_agent_missing": 0, "referrer_missing": 0, "cookie_count": 5,
    "session_duration": 1200, "process_count": 40, "thread_count": 100,
    "memory_usage_mb": 2048, "network_io_rate": 50, "system_up_time": 7200
}
```
*   **Expected Response**:
```json
{
    "attack_detected": true,
    "anomaly_score": 0.8974,
    "attack_type": "Phishing",
    "attack_category": "1-many server",
    "confidence_score": 0.9882,
    "false_positive_prob": 0.0082,
    "severity_score": "High",
    "risk_score": 83.99,
    "recommended_action": "Block IP"
}
```

---

## 🔴 5. CLASS: Ransomware (Active Encryption)

*   **Input Payload**:
```json
{
    "packet_count": 50, "byte_count": 5000, "syn_packet_count": 5, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
    "failed_login_count": 0, "login_attempts": 1, "ssl_certificate_valid": 1, "certificate_mismatch": 0,
    "arp_request_rate": 2, "mac_change_rate": 0, "duplicate_ip_detected": 0,
    "url_length": 25, "suspicious_keyword_count": 0, "domain_age": 1000, "redirect_count": 0,
    "file_modification_rate": 1000, "file_rename_count": 900, "file_extension_change": 1,
    "registry_modification_rate": 1, "cpu_usage_spike": 98, "disk_write_rate": 500,
    "api_request_count": 5, "http_response_code_200": 100, "http_response_code_404": 0,
    "user_agent_missing": 0, "referrer_missing": 0, "cookie_count": 5,
    "session_duration": 1200, "process_count": 40, "thread_count": 100,
    "memory_usage_mb": 2048, "network_io_rate": 50, "system_up_time": 7200
}
```
*   **Expected Response**:
```json
{
    "attack_detected": true,
    "anomaly_score": 0.9222,
    "attack_type": "Ransomware",
    "attack_category": "1-1 server",
    "confidence_score": 0.9945,
    "false_positive_prob": 0.0038,
    "severity_score": "High",
    "risk_score": 94.08,
    "recommended_action": "Block IP"
}
```
