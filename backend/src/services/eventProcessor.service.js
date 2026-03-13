import redisClient from '../utils/redisClient.js';
import pool from '../utils/db.js';
import { analyzeMetrics } from '../utils/mlClient.js';
import { createAlert } from './alert.service.js';

export const processEvent = async (event) => {
    const { sector: rawSector, type, severity: eventSeverity = 'LOW', metadata } = event;
    const sector = rawSector.toUpperCase(); // Ensure sector is uppercase for consistency
    const timestamp = Date.now();
    const isoTimestamp = new Date(timestamp).toISOString();
    const ip = metadata?.ip || '127.0.0.1';

    try {
        console.log(`[Processor] Step 1: Storing event in PostgreSQL...`);
        const insertEventQuery = `
            INSERT INTO events (sector, type, severity, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const eventValues = [
            sector,
            type,
            eventSeverity.toUpperCase(),
            JSON.stringify(metadata),
            isoTimestamp
        ];

        const { rows: eventRows } = await pool.query(insertEventQuery, eventValues);
        const storedEvent = eventRows[0];

        console.log(`[Processor] Event stored successfully with ID: ${storedEvent?.id}`);

        // 2. Update Redis Tracking
        const windowKey = `window:events:${sector}`;
        console.log(`[Processor] Step 2: Adding to Redis window: ${windowKey}`);

        const eventData = {
            type,
            severity: eventSeverity,
            ip,
            timestamp,
            eventId: storedEvent?.id
        };

        try {
            await redisClient.zAdd(windowKey, { score: timestamp, value: JSON.stringify(eventData) });
            await redisClient.zRemRangeByScore(windowKey, 0, timestamp - 2 * 60 * 1000);
        } catch (redisErr) {
            console.error('[Processor] Redis Error (Non-blocking):', redisErr);
        }

        // 3. Extract High-Fidelity Metrics from Metadata (Prioritize individual event features)
        console.log(`[Processor] Step 3: Extracting high-fidelity metrics...`);
        const highFidelityMetrics = {
            device_id: metadata?.device_id || 0,
            location_id: metadata?.location_id || 0,
            ip: metadata?.ip || ip,
            ip_src: metadata?.ip_src || 0,
            ip_dest: metadata?.ip_dest || 0,
            protocol: metadata?.protocol || 'TCP',
            packet_size: metadata?.packet_size || 500,
            latency_ms: metadata?.latency_ms || 50,
            cpu_usage_percent: metadata?.cpu_usage_percent || 30,
            memory_usage_percent: metadata?.memory_usage_percent || 40,
            battery_level: metadata?.battery_level || 80,
            temperature_c: metadata?.temperature_c || 25,
            connection_status: metadata?.connection_status || 'Connected',
            operation_type: metadata?.operation_type || 'Read',
            data_value_integrity: metadata?.data_value_integrity ?? 1,
            is_anomaly: metadata?.is_anomaly || 0,
            event_type: type // Pass event type for hardcoded pattern matching
        };

        // Also aggregate window metrics for additional context (optional, but good for logs)
        const oneMinuteAgo = timestamp - 60 * 1000;
        const recentEventsRaw = await redisClient.zRange(windowKey, oneMinuteAgo, timestamp, { BY: 'SCORE' });

        let uniqueIps = 0;
        try {
            uniqueIps = new Set(recentEventsRaw.map(e => {
                try { return JSON.parse(e).ip; } catch { return null; }
            }).filter(Boolean)).size;
        } catch (e) {
            console.warn('[Processor] Context aggregation failed:', e.message);
        }

        const contextMetrics = {
            event_rate_60s: recentEventsRaw.length,
            unique_ips_60s: uniqueIps
        };

        console.log(`[Processor] Step 4: Calling ML Service with high-fidelity data...`);
        const analysis = await analyzeMetrics(sector, highFidelityMetrics);
        console.log(`[Processor] ML Result: is_anomaly=${analysis.is_anomaly}, attack=${analysis.attack_type}, severity=${analysis.severity}`);

        // 5. Severity Escalation Layer (Fixing Temporal Blindness)
        let finalSeverity = (analysis.severity || 'LOW').toUpperCase();
        const eventRate = contextMetrics.event_rate_60s || 0;
        const currentUniqueIps = contextMetrics.unique_ips_60s || 0;
        let escalationReason = '';

        // --- Sector-Specific Refinement: AGRICULTURE ---
        if (sector === 'AGRICULTURE') {
            const { latency_ms, packet_size, battery_level, data_value_integrity } = highFidelityMetrics;

            // Trigger HIGH: Critical Malicious Signals
            if (eventRate >= 30 || data_value_integrity === 0 || latency_ms >= 800) {
                if (finalSeverity !== 'HIGH') {
                    finalSeverity = 'HIGH';
                    escalationReason = ` [AGRICULTURE_CRITICAL: ${data_value_integrity === 0 ? 'INTEGRITY_FAILURE' : 'HIGH_FREQUENCY_BURST'}]`;
                }
            }
            // Trigger MEDIUM: Operational Instability Signals
            else if (eventRate >= 15 || latency_ms >= 400 || packet_size >= 1000 || battery_level < 50) {
                if (finalSeverity === 'LOW') {
                    finalSeverity = 'MEDIUM';
                    escalationReason = ' [AGRICULTURE_STRESS: SENSOR_INSTABILITY_DETECTED]';
                }
            }
        }
        // --- Sector-Specific Refinement: URBAN ---
        else if (sector === 'URBAN') {
            const { operation_type, data_value_integrity, connection_status } = highFidelityMetrics;

            // Trigger HIGH: Active Infrastructure Compromise
            if (eventRate >= 40 && currentUniqueIps >= 5 && data_value_integrity === 0 && operation_type === 'Write') {
                if (finalSeverity !== 'HIGH') {
                    finalSeverity = 'HIGH';
                    escalationReason = ' [URBAN_CRITICAL: COORDINATED_OVERRIDE_ATTEMPT]';
                }
            }
            // Trigger MEDIUM: Suspicious Activity
            else if (eventRate >= 10 && currentUniqueIps >= 2 && operation_type === 'Write') {
                if (finalSeverity === 'LOW') {
                    finalSeverity = 'MEDIUM';
                    escalationReason = ' [URBAN_STRESS: MULTI_IP_WRITE_BURST]';
                }
            }
        }
        // --- Generic Escalation (Other Sectors) ---
        else {
            if (eventRate > 10) {
                finalSeverity = 'HIGH';
            } else if (eventRate > 3) {
                if (finalSeverity === 'LOW') finalSeverity = 'MEDIUM';
            }
        }

        // 6. If Anomaly or Attack Detected, create an alert (including Normal for display)
        if (analysis.is_anomaly || analysis.attack_type !== 'Normal' || finalSeverity !== 'LOW' || analysis.attack_type === 'Normal') {
            // For Normal attack type, set severity to NULL (not a threat)
            const alertSeverity = analysis.attack_type === 'Normal' ? null : finalSeverity;
            const alertType = analysis.attack_type !== 'Normal' ? `ML_${analysis.attack_type.toUpperCase()}` : `ML_NORMAL`;
            
            console.log(`[Processor] Step 6: Creating alert... Type: ${alertType}, Severity: ${alertSeverity || 'NULL'} (Rate: ${eventRate})`);
            try {
                const alertResult = await createAlert({
                    sector,
                    type: alertType,
                    severity: alertSeverity,
                    score: parseFloat(analysis.confidence || 0),
                    confidence: parseFloat(analysis.confidence || 0),
                    explanation: analysis.explanation + escalationReason + (finalSeverity !== (analysis.severity || 'LOW').toUpperCase() && !escalationReason && alertSeverity !== null ? ` [FREQUENCY ESCALATION: ${eventRate} events/min]` : ''),
                    metadata: {
                        ...metadata,
                        metrics: highFidelityMetrics,
                        context: contextMetrics,
                        ml_response: analysis,
                        escalated: alertSeverity !== null && finalSeverity !== (analysis.severity || 'LOW').toUpperCase()
                    }
                });
                console.log(`[Processor] Alert creation result:`, alertResult.success ? 'Success' : 'Failed');
            } catch (alertErr) {
                console.error('[Processor] Alert Escalation Failed (Non-blocking):', alertErr.message);
            }
        }

        console.log(`[Processor] SUCCESS: Pipeline complete for event ID: ${storedEvent?.id || 'N/A'}`);
        return {
            success: true,
            eventId: storedEvent?.id || null,
            analysis: analysis || null,
            metrics: highFidelityMetrics || null
        };
    } catch (error) {
        console.error('CRITICAL: Event Processing System Error:', error);
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        return { success: false, error: errorMessage };
    }
};
