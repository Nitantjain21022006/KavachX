import pool from '../utils/db.js';
import { sendAlertEmail } from '../utils/mailer.js';

// Auto-resolve function that can be called after a delay
const autoResolveAlert = async (alertId, severity) => {
    try {
        const queryText = `
            UPDATE alerts
            SET 
                status = 'RESOLVED',
                resolution_type = 'AUTOMATED',
                resolved_at = $1,
                resolution_notes = $2
            WHERE id = $3 AND status = 'ACTIVE'
            RETURNING *
        `;
        const values = [
            new Date().toISOString(),
            `Auto-resolved by system: ${severity} severity alerts are automatically mitigated after a short delay.`,
            alertId
        ];

        const { rows } = await pool.query(queryText, values);
        
        if (rows.length > 0) {
            console.log(`[Alert Service] Auto-resolved ${severity} severity alert: ${alertId} after delay`);
        }
    } catch (error) {
        console.error(`[Alert Service] Auto-resolve failed for alert ${alertId}:`, error.message);
    }
};

export const createAlert = async (alertData) => {
    const { sector, type, severity, score, explanation, metadata } = alertData;
    // If severity is null (Normal attack type), keep it as null; otherwise normalize
    const normalizedSeverity = severity === null ? null : (severity?.toUpperCase() || 'LOW');

    try {
        const queryText = `
            INSERT INTO alerts (sector, type, severity, score, explanation, metadata, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [
            sector,
            type,
            normalizedSeverity,
            score,
            explanation,
            JSON.stringify(metadata),
            'ACTIVE',
            new Date().toISOString()
        ];

        const { rows } = await pool.query(queryText, values);
        const alert = rows[0] || alertData;

        // Schedule auto-resolution for LOW and MEDIUM alerts (skip if severity is NULL)
        const shouldAutoResolve = normalizedSeverity && (normalizedSeverity === 'LOW' || normalizedSeverity === 'MEDIUM');
        if (shouldAutoResolve) {
            const delayMs = normalizedSeverity === 'LOW' ? 5000 : 10000;
            
            setTimeout(() => {
                autoResolveAlert(alert.id, normalizedSeverity);
            }, delayMs);

            console.log(`[Alert Service] Scheduled auto-resolve for ${normalizedSeverity} severity alert: ${alert.id} in ${delayMs/1000}s`);
        }

        if (normalizedSeverity === 'HIGH') {
            try {
                await sendAlertEmail(process.env.BREVO_USER || 'admin@cyber.res', alert);
            } catch (emailError) {
                console.error('Non-critical: Alert email failed:', emailError.message);
            }
        }

        return { success: true, alert };
    } catch (error) {
        console.error('Error creating alert:', error);
        const errorMessage = typeof error === 'object' ? JSON.stringify(error) : error.toString();
        return { success: false, error: errorMessage };
    }
};

export const resolveAlert = async (alertId, resolutionData) => {
    try {
        // 1. Check existing resolution_type
        const checkQuery = 'SELECT resolution_type FROM alerts WHERE id = $1';
        const { rows: existingRows } = await pool.query(checkQuery, [alertId]);
        const existingAlert = existingRows[0];

        let queryText;
        let values;

        if (existingAlert?.resolution_type === 'AUTOMATED') {
            queryText = `
                UPDATE alerts
                SET 
                    status = 'RESOLVED',
                    resolution_notes = $1,
                    resolved_at = $2,
                    resolved_by = $3
                WHERE id = $4
                RETURNING *
            `;
            values = [resolutionData.notes, new Date().toISOString(), resolutionData.userId, alertId];
        } else {
            queryText = `
                UPDATE alerts
                SET 
                    status = 'RESOLVED',
                    resolution_notes = $1,
                    resolved_at = $2,
                    resolved_by = $3,
                    resolution_type = 'MANUAL'
                WHERE id = $4
                RETURNING *
            `;
            values = [resolutionData.notes, new Date().toISOString(), resolutionData.userId, alertId];
        }

        const { rows } = await pool.query(queryText, values);
        return { success: true, alert: rows[0] };
    } catch (error) {
        console.error('Error resolving alert:', error);
        return { success: false, error: error.message };
    }
};

