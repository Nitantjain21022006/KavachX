# 🟢 Low Severity API Testing Guide

This guide contains **Low Severity** (Risk Score <= 40 or Normal) testing payloads for all applicable traffic classes.

---

## 🟢 1. CLASS: Normal

*   **Input Payload**:
```json
{
    "packet_count": 40, "byte_count": 5000, "syn_packet_count": 5, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
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
    "attack_detected": false,
    "anomaly_score": 0.0946,
    "attack_type": "Normal",
    "attack_category": "1-1 server",
    "confidence_score": 0.6174,
    "false_positive_prob": 0.4765,
    "severity_score": "Low",
    "risk_score": 24.92,
    "recommended_action": "Monitor"
}
```

---

## 🔴 2. CLASS: DDoS (Low Impact)

*   **Input Payload**:
```json
{
    "packet_count": 1000, "byte_count": 5000, "syn_packet_count": 500, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
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
    "attack_detected": false,
    "anomaly_score": 0.3162,
    "attack_type": "Normal",
    "attack_category": "1-1 server",
    "confidence_score": 0.4885,
    "false_positive_prob": 0.5023,
    "severity_score": "Low",
    "risk_score": 28.16,
    "recommended_action": "Monitor"
}
```

---

## 🟠 3. CLASS: BruteForce (Insignificant)

*   **Input Payload**:
```json
{
    "packet_count": 50, "byte_count": 5000, "syn_packet_count": 5, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
    "failed_login_count": 3, "login_attempts": 5, "ssl_certificate_valid": 1, "certificate_mismatch": 0,
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
    "attack_detected": false,
    "anomaly_score": 0.2835,
    "attack_type": "Normal",
    "attack_category": "1-1 server",
    "confidence_score": 0.5746,
    "false_positive_prob": 0.4851,
    "severity_score": "Low",
    "risk_score": 30.03,
    "recommended_action": "Monitor"
}
```

---

## 🟣 4. CLASS: Phishing (Routine)

*   **Input Payload**:
```json
{
    "packet_count": 50, "byte_count": 5000, "syn_packet_count": 5, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
    "failed_login_count": 0, "login_attempts": 1, "ssl_certificate_valid": 1, "certificate_mismatch": 0,
    "arp_request_rate": 2, "mac_change_rate": 0, "duplicate_ip_detected": 0,
    "url_length": 60, "suspicious_keyword_count": 0, "domain_age": 500, "redirect_count": 0,
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
    "attack_detected": false,
    "anomaly_score": 0.0946,
    "attack_type": "Normal",
    "attack_category": "1-1 server",
    "confidence_score": 0.6152,
    "false_positive_prob": 0.477,
    "severity_score": "Low",
    "risk_score": 24.84,
    "recommended_action": "Monitor"
}
```
