import redisClient from '../utils/redisClient.js';
import pool from '../utils/db.js';
import { sendAlertEmail } from '../utils/mailer.js';

export const executeResponse = async (alertId, action, target) => {
    console.log(`Executing response action: ${action} on target: ${target} for alert: ${alertId}`);

    try {
        let resultMessage = '';

        switch (action) {
            case 'BLOCK_IP':
                await redisClient.sAdd('security:blocked_ips', target);
                resultMessage = `IP Address ${target} has been blocked and added to Redis firewall set.`;
                break;

            case 'DISABLE_USER':
                const updateUserQuery = 'UPDATE users SET is_active = false WHERE email = $1';
                await pool.query(updateUserQuery, [target]);
                resultMessage = `User account ${target} has been disabled in the primary identity database.`;
                break;

            case 'NOTIFY_ADMIN':
                const selectAlertQuery = 'SELECT * FROM alerts WHERE id = $1';
                const { rows: alertRows } = await pool.query(selectAlertQuery, [alertId]);
                const alertData = alertRows[0];

                if (!alertData) throw new Error('Alert not found');

                await sendAlertEmail(process.env.BREVO_USER, alertData);
                resultMessage = `Security administrator has been notified via emergency email channel.`;
                break;

            default:
                throw new Error('Unknown security action specified.');
        }

        // Log the response in the alert metadata
        const { rows: currentAlertRows } = await pool.query('SELECT metadata FROM alerts WHERE id = $1', [alertId]);
        const currentAlert = currentAlertRows[0];
        
        const updatedMetadata = {
            ...(currentAlert?.metadata || {}),
            automation_response: {
                action,
                target,
                executed_at: new Date().toISOString(),
                result: resultMessage
            }
        };

        const updateAlertQuery = `
            UPDATE alerts 
            SET metadata = $1, status = $2, resolution_type = 'MANUAL', resolution_notes = $3, resolved_at = $4 
            WHERE id = $5
        `;
        await pool.query(updateAlertQuery, [JSON.stringify(updatedMetadata), 'RESOLVED', resultMessage, new Date().toISOString(), alertId]);

        return { success: true, message: resultMessage };
    } catch (error) {
        console.error('Response Execution Error:', error);
        return { success: false, error: error.message };
    }
};

export const executeBulkResponse = async (alertIds, action, target) => {
    console.log(`Executing BULK response action: ${action} on target: ${target} for ${alertIds?.length || 0} alerts`);

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
        return { success: false, error: 'No alerts specified for bulk action' };
    }

    try {
        let resultMessage = '';

        switch (action) {
            case 'BLOCK_IP':
                await redisClient.sAdd('security:blocked_ips', target);
                resultMessage = `IP Address ${target} blocked and added to Redis firewall set.`;
                break;

            case 'DISABLE_USER':
                const updateUserQuery = 'UPDATE users SET is_active = false WHERE email = $1';
                await pool.query(updateUserQuery, [target]);
                resultMessage = `User account ${target} disabled.`;
                break;

            case 'NOTIFY_ADMIN':
                const selectAlertQuery = 'SELECT * FROM alerts WHERE id = $1';
                const { rows: alertRows } = await pool.query(selectAlertQuery, [alertIds[0]]);
                const alertData = alertRows[0];

                if (alertData) {
                    const emailData = { ...alertData, explanation: `[BULK ACTION - ${alertIds.length} EVENTS] ${alertData.explanation}` };
                    await sendAlertEmail(process.env.BREVO_USER, emailData);
                }
                resultMessage = `Security admin notified regarding ${alertIds.length} bundled events.`;
                break;

            default:
                throw new Error('Unknown security action specified.');
        }

        const { rows: currentAlerts } = await pool.query('SELECT id, metadata FROM alerts WHERE id = ANY($1)', [alertIds]);
        
        const updatePromises = currentAlerts.map(alert => {
            const updatedMetadata = {
                ...(alert.metadata || {}),
                automation_response: {
                    action,
                    target,
                    executed_at: new Date().toISOString(),
                    result: resultMessage,
                    bulk: true
                }
            };
            return pool.query(
                `UPDATE alerts 
                 SET metadata = $1, status = $2, resolution_type = 'MANUAL', resolution_notes = $3, resolved_at = $4 
                 WHERE id = $5`, 
                [JSON.stringify(updatedMetadata), 'RESOLVED', resultMessage, new Date().toISOString(), alert.id]
            );
        });

        await Promise.all(updatePromises);

        return { success: true, message: resultMessage, resolvedCount: alertIds.length };
    } catch (error) {
        console.error('Bulk Response Execution Error:', error);
        return { success: false, error: error.message };
    }
};

