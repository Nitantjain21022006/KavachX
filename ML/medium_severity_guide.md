# 🟡 Medium Severity API Testing Guide

This guide contains **Medium Severity** (Risk Score > 40 and <= 80) testing payloads.

---

## 🟢 1. CLASS: Normal
*   *Normal traffic does not trigger Medium or High severity alerts.*

---

## 🔴 2. CLASS: DDoS (Moderate)

*   **Input Payload**:
```json
{
    "packet_count": 10000, "byte_count": 5000, "syn_packet_count": 8000, "syn_ack_ratio": 0.4,
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
    "attack_type": "DDoS",
    "attack_category": "many-1 server",
    "confidence_score": 0.6034,
    "false_positive_prob": 0.3302,
    "severity_score": "Medium",
    "risk_score": 59.19,
    "recommended_action": "Alert Admin"
}
```

---

## 🟡 3. CLASS: MITM (Anomalous)

*   **Input Payload**:
```json
{
    "packet_count": 50, "byte_count": 5000, "syn_packet_count": 5, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
    "failed_login_count": 0, "login_attempts": 1, "ssl_certificate_valid": 1, "certificate_mismatch": 0,
    "arp_request_rate": 5, "mac_change_rate": 0, "duplicate_ip_detected": 0,
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
    "anomaly_score": 0.369,
    "attack_type": "MITM",
    "attack_category": "many-1 server",
    "confidence_score": 0.7945,
    "false_positive_prob": 0.1783,
    "severity_score": "Medium",
    "risk_score": 61.72,
    "recommended_action": "Alert Admin"
}
```

---

## 🔴 4. CLASS: Ransomware (Suspicious)

*   **Input Payload**:
```json
{
    "packet_count": 50, "byte_count": 5000, "syn_packet_count": 5, "syn_ack_ratio": 0.8,
    "unique_source_ips": 2, "unique_destination_ips": 5, "packets_per_second": 10,
    "failed_login_count": 0, "login_attempts": 1, "ssl_certificate_valid": 1, "certificate_mismatch": 0,
    "arp_request_rate": 2, "mac_change_rate": 0, "duplicate_ip_detected": 0,
    "url_length": 25, "suspicious_keyword_count": 0, "domain_age": 1000, "redirect_count": 0,
    "file_modification_rate": 15, "file_rename_count": 1, "file_extension_change": 0,
    "registry_modification_rate": 1, "cpu_usage_spike": 30, "disk_write_rate": 20,
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
    "anomaly_score": 0.3584,
    "attack_type": "Ransomware",
    "attack_category": "1-1 server",
    "confidence_score": 0.8938,
    "false_positive_prob": 0.0913,
    "severity_score": "Medium",
    "risk_score": 70.83,
    "recommended_action": "Alert Admin"
}
```
