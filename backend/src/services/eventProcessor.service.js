import redisClient from '../utils/redisClient.js';
import pool from '../utils/db.js';
import { analyzeMetrics } from '../utils/mlClient.js';
import { createAlert } from './alert.service.js';

/**
 * Main event processing pipeline.
 * Flow: Receive Event → Store in DB → Update Redis Window → Extract 36 Features → Call ML → Create Alert
 *
 * Severity categorization (High / Medium / Low) is determined EXCLUSIVELY by the ML model.
 * There is NO hardcoded severity logic here.
 */
export const processEvent = async (event) => {
    const { sector: rawSector, type, metadata } = event;
    const sector = rawSector.toUpperCase();
    const timestamp = Date.now();
    const isoTimestamp = new Date(timestamp).toISOString();
    const ip = metadata?.ip || '127.0.0.1';

    try {
        // ── Step 1: Store raw event in PostgreSQL ──────────────────────────────
        console.log(`[Processor] Step 1: Storing event in PostgreSQL...`);
        const insertEventQuery = `
            INSERT INTO events (sector, type, severity, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        // The events table has a NOT NULL constraint on severity. 
        // We insert a default 'LOW' here. The actual critical evaluation and 
        // accurate severity classification happens in the ML model and is stored in the 'alerts' table.
        const eventValues = [sector, type, 'LOW', JSON.stringify(metadata), isoTimestamp];
        const { rows: eventRows } = await pool.query(insertEventQuery, eventValues);
        const storedEvent = eventRows[0];
        console.log(`[Processor] Event stored successfully with ID: ${storedEvent?.id}`);

        // ── Step 2: Update Redis Sliding Window ───────────────────────────────
        const windowKey = `window:events:${sector}`;
        console.log(`[Processor] Step 2: Adding to Redis window: ${windowKey}`);
        const eventData = { type, ip, timestamp, eventId: storedEvent?.id };
        try {
            await redisClient.zAdd(windowKey, { score: timestamp, value: JSON.stringify(eventData) });
            await redisClient.zRemRangeByScore(windowKey, 0, timestamp - 2 * 60 * 1000);
        } catch (redisErr) {
            console.error('[Processor] Redis Error (Non-blocking):', redisErr);
        }

        // ── Step 3: Gather lightweight context from Redis window ───────────────
        const oneMinuteAgo = timestamp - 60 * 1000;
        let recentEventsRaw = [];
        try {
            recentEventsRaw = await redisClient.zRange(windowKey, oneMinuteAgo, timestamp, { BY: 'SCORE' });
        } catch (e) {
            console.warn('[Processor] Redis zRange failed (Non-blocking):', e.message);
        }
        const eventRate60s = recentEventsRaw.length;

        // ── Step 4: Extract all 36 ML Features from metadata ──────────────────
        // These are the exact features the new ML model was trained on.
        // Defaults represent benign / normal traffic so the model can still run
        // even on events that don't carry every feature.
        console.log(`[Processor] Step 4: Extracting 36 ML features from metadata...`);
        const mlFeatures = {
            // Network Traffic
            packet_count:               metadata?.packet_count               ?? 50,
            byte_count:                 metadata?.byte_count                 ?? 5000,
            syn_packet_count:           metadata?.syn_packet_count           ?? 5,
            syn_ack_ratio:              metadata?.syn_ack_ratio              ?? 0.8,
            unique_source_ips:          metadata?.unique_source_ips          ?? 2,
            unique_destination_ips:     metadata?.unique_destination_ips     ?? 2,
            packets_per_second:         metadata?.packets_per_second         ?? 1,

            // Authentication
            failed_login_count:         metadata?.failed_login_count         ?? 0,
            login_attempts:             metadata?.login_attempts             ?? 1,

            // SSL / TLS
            ssl_certificate_valid:      metadata?.ssl_certificate_valid      ?? 1,
            certificate_mismatch:       metadata?.certificate_mismatch       ?? 0,

            // ARP / Network Scanning
            arp_request_rate:           metadata?.arp_request_rate           ?? 2,
            mac_change_rate:            metadata?.mac_change_rate            ?? 0,
            duplicate_ip_detected:      metadata?.duplicate_ip_detected      ?? 0,

            // Phishing / Web
            url_length:                 metadata?.url_length                 ?? 25,
            suspicious_keyword_count:   metadata?.suspicious_keyword_count   ?? 0,
            domain_age:                 metadata?.domain_age                 ?? 1000,
            redirect_count:             metadata?.redirect_count             ?? 0,

            // File System / Ransomware
            file_modification_rate:     metadata?.file_modification_rate     ?? 5,
            file_rename_count:          metadata?.file_rename_count          ?? 1,
            file_extension_change:      metadata?.file_extension_change      ?? 0,
            registry_modification_rate: metadata?.registry_modification_rate ?? 1,

            // System Performance
            cpu_usage_spike:            metadata?.cpu_usage_spike            ?? 10,
            disk_write_rate:            metadata?.disk_write_rate            ?? 20,

            // API / HTTP
            api_request_count:          metadata?.api_request_count          ?? 5,
            http_response_code_200:     metadata?.http_response_code_200     ?? 100,
            http_response_code_404:     metadata?.http_response_code_404     ?? 0,
            user_agent_missing:         metadata?.user_agent_missing         ?? 0,
            referrer_missing:           metadata?.referrer_missing           ?? 0,

            // Session
            cookie_count:               metadata?.cookie_count               ?? 5,
            session_duration:           metadata?.session_duration           ?? 1200,

            // System Resources
            process_count:              metadata?.process_count              ?? 40,
            thread_count:               metadata?.thread_count               ?? 100,
            memory_usage_mb:            metadata?.memory_usage_mb            ?? 2048,
            network_io_rate:            metadata?.network_io_rate            ?? 50,
            system_up_time:             metadata?.system_up_time             ?? 7200,
        };

        // ── Step 5: Call ML Model ──────────────────────────────────────────────
        console.log(`[Processor] Step 5: Calling ML Service...`);
        const analysis = await analyzeMetrics(sector, mlFeatures);
        console.log(`[Processor] ML Result: attack_detected=${analysis.attack_detected}, type=${analysis.attack_type}, severity=${analysis.severity}, risk=${analysis.risk_score}`);

        // ── Step 6: Build alert from ML output (no hardcoded overrides) ────────
        // severity comes directly from the ML model as 'High', 'Medium', or 'Low'
        // and is null for normal (non-attack) traffic.
        const mlSeverity = analysis.severity
            ? analysis.severity.toUpperCase()
            : null;

        const alertType = analysis.attack_type !== 'Normal'
            ? `ML_${analysis.attack_type.toUpperCase()}`
            : 'ML_NORMAL';

        // Always create an alert so every event is tracked; Normal traffic has null severity.
        console.log(`[Processor] Step 6: Creating alert... Type: ${alertType}, Severity: ${mlSeverity ?? 'NULL (Normal)'}`);
        try {
            const alertResult = await createAlert({
                sector,
                type:        alertType,
                severity:    mlSeverity,
                score:       parseFloat(analysis.confidence   ?? 0),
                confidence:  parseFloat(analysis.confidence   ?? 0),
                explanation: analysis.explanation,
                metadata: {
                    ...metadata,
                    ml_features:  mlFeatures,
                    context: {
                        event_rate_60s: eventRate60s,
                    },
                    ml_response:  analysis,
                }
            });
            console.log(`[Processor] Alert creation result:`, alertResult.success ? 'Success' : 'Failed');
        } catch (alertErr) {
            console.error('[Processor] Alert Creation Failed (Non-blocking):', alertErr.message);
        }

        console.log(`[Processor] SUCCESS: Pipeline complete for event ID: ${storedEvent?.id || 'N/A'}`);
        return {
            success: true,
            eventId: storedEvent?.id || null,
            analysis,
            ml_features: mlFeatures
        };

    } catch (error) {
        console.error('CRITICAL: Event Processing System Error:', error);
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        return { success: false, error: errorMessage };
    }
};
