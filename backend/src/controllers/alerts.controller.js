import * as alertService from '../services/alert.service.js';
import pool from '../utils/db.js';

export const getAlerts = async (req, res) => {
    try {
        const { sector, severity, status } = req.query;

        let queryText = 'SELECT * FROM alerts';
        let conditions = [];
        let values = [];

        // Sector Scoping: SECTOR_OWNERs only see their assigned sector
        if (req.user.role === 'SECTOR_OWNER' && req.user.sector) {
            conditions.push(`sector = $${values.length + 1}`);
            values.push(req.user.sector);
        } else if (sector) {
            conditions.push(`sector = $${values.length + 1}`);
            values.push(sector);
        }

        if (severity) {
            conditions.push(`severity = $${values.length + 1}`);
            values.push(severity);
        }
        if (status) {
            conditions.push(`status = $${values.length + 1}`);
            values.push(status);
        }

        if (conditions.length > 0) {
            queryText += ' WHERE ' + conditions.join(' AND ');
        }

        queryText += ' ORDER BY created_at DESC';

        const { rows } = await pool.query(queryText, values);
        res.json({ success: true, alerts: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM alerts WHERE id = $1', [id]);
        const alert = rows[0];

        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, alert });
    } catch (error) {
        res.status(404).json({ success: false, message: 'Alert not found' });
    }
};

export const resolveAlert = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await alertService.resolveAlert(id, { notes, userId: req.user.id });

    if (result.success) {
        res.json({ success: true, message: 'Alert resolved', alert: result.alert });
    } else {
        res.status(500).json({ success: false, message: result.error });
    }
};

