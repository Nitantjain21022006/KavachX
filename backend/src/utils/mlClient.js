import axios from 'axios';

// Points to the ML Flask service /predict endpoint
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000/predict';

/**
 * Sends all 36 raw features to the ML service and returns the parsed response.
 * All severity/categorization is determined exclusively by the ML model.
 * No hardcoded overrides are applied.
 *
 * @param {string} sector - The sector of the event (e.g., 'HEALTHCARE').
 * @param {object} metrics - An object containing the 36 raw feature values.
 * @returns {object} - Parsed ML response with attack_detected, severity_score, etc.
 */
export const analyzeMetrics = async (sector, metrics) => {
    try {
        // Build the 36-feature payload exactly as the ML model expects.
        // Defaults are set to values representing "normal/benign" traffic.
        const payload = {
            // --- Network Traffic Features ---
            packet_count:               metrics.packet_count               ?? 50,
            byte_count:                 metrics.byte_count                 ?? 5000,
            syn_packet_count:           metrics.syn_packet_count           ?? 5,
            syn_ack_ratio:              metrics.syn_ack_ratio              ?? 0.8,
            unique_source_ips:          metrics.unique_source_ips          ?? 2,
            unique_destination_ips:     metrics.unique_destination_ips     ?? 2,
            packets_per_second:         metrics.packets_per_second         ?? 1,

            // --- Authentication Features ---
            failed_login_count:         metrics.failed_login_count         ?? 0,
            login_attempts:             metrics.login_attempts             ?? 1,

            // --- SSL / TLS Features ---
            ssl_certificate_valid:      metrics.ssl_certificate_valid      ?? 1,
            certificate_mismatch:       metrics.certificate_mismatch       ?? 0,

            // --- ARP / Network Scanning Features ---
            arp_request_rate:           metrics.arp_request_rate           ?? 2,
            mac_change_rate:            metrics.mac_change_rate            ?? 0,
            duplicate_ip_detected:      metrics.duplicate_ip_detected      ?? 0,

            // --- Phishing / Web Features ---
            url_length:                 metrics.url_length                 ?? 25,
            suspicious_keyword_count:   metrics.suspicious_keyword_count   ?? 0,
            domain_age:                 metrics.domain_age                 ?? 1000,
            redirect_count:             metrics.redirect_count             ?? 0,

            // --- File System / Ransomware Features ---
            file_modification_rate:     metrics.file_modification_rate     ?? 5,
            file_rename_count:          metrics.file_rename_count          ?? 1,
            file_extension_change:      metrics.file_extension_change      ?? 0,
            registry_modification_rate: metrics.registry_modification_rate ?? 1,

            // --- System Performance Features ---
            cpu_usage_spike:            metrics.cpu_usage_spike            ?? 10,
            disk_write_rate:            metrics.disk_write_rate            ?? 20,

            // --- API / HTTP Features ---
            api_request_count:          metrics.api_request_count          ?? 5,
            http_response_code_200:     metrics.http_response_code_200     ?? 100,
            http_response_code_404:     metrics.http_response_code_404     ?? 0,
            user_agent_missing:         metrics.user_agent_missing         ?? 0,
            referrer_missing:           metrics.referrer_missing           ?? 0,

            // --- Session Features ---
            cookie_count:               metrics.cookie_count               ?? 5,
            session_duration:           metrics.session_duration           ?? 1200,

            // --- System Resource Features ---
            process_count:              metrics.process_count              ?? 40,
            thread_count:               metrics.thread_count               ?? 100,
            memory_usage_mb:            metrics.memory_usage_mb            ?? 2048,
            network_io_rate:            metrics.network_io_rate            ?? 50,
            system_up_time:             metrics.system_up_time             ?? 7200,
        };

        const response = await axios.post(ML_API_URL, payload, { timeout: 8000 });
        const data = response.data;

        // --- Parse the ML response directly. No hardcoded overrides. ---
        // Expected fields from ML/expected_output.json:
        //   attack_detected, anomaly_score, attack_type, attack_category,
        //   confidence_score, false_positive_prob, severity_score, risk_score, recommended_action

        const attackType = data.attack_type || 'Normal';
        const isAnomaly = data.attack_detected === true;
        // Respect the ML model's explicit severity_score if the type is not Normal.
        const severity = attackType !== 'Normal' && data.severity_score
            ? data.severity_score.toLowerCase()
            : null; // null severity for normal traffic

        return {
            is_anomaly:          isAnomaly,
            attack_detected:     isAnomaly,
            anomaly_score:       parseFloat(data.anomaly_score    ?? 0),
            confidence:          parseFloat(data.confidence_score ?? 0),
            attack_type:         attackType,
            attack_category:     data.attack_category      || 'N/A',
            false_positive_prob: parseFloat(data.false_positive_prob ?? 0),
            severity:            severity,               // Raw from ML: 'High', 'Medium', 'Low', or null
            risk_score:          parseFloat(data.risk_score ?? 0),
            recommended_action:  data.recommended_action  || 'Monitor',
            explanation:         `Attack: ${attackType} | Severity: ${data.severity_score || 'N/A'} | Risk: ${data.risk_score ?? 0} | Action: ${data.recommended_action || 'Monitor'}`
        };

    } catch (error) {
        const errorDetail = error.response?.data?.error || error.message;
        console.error(`[ML Client] Analysis Error: ${errorDetail}`);
        // On ML service failure, return a safe fallback that still creates a basic alert.
        // We set severity to 'low' to satisfy the alerts table NOT NULL constraint.
        return {
            is_anomaly:          true,
            attack_detected:     true,
            anomaly_score:       0,
            confidence:          0.0,
            attack_type:         'ML_UNAVAILABLE',
            attack_category:     'System Error',
            false_positive_prob: 0,
            severity:            'low',
            risk_score:          0,
            recommended_action:  'Check ML Service',
            explanation:         `ML Analysis unavailable: ${errorDetail}`
        };
    }
};
