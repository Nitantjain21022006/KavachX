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

        const updateAlertQuery = 'UPDATE alerts SET metadata = $1, status = $2 WHERE id = $3';
        await pool.query(updateAlertQuery, [JSON.stringify(updatedMetadata), 'OPEN', alertId]);

        return { success: true, message: resultMessage };
    } catch (error) {
        console.error('Response Execution Error:', error);
        return { success: false, error: error.message };
    }
};

