import pool from '../utils/db.js';

// 1. Security Thresholds
export const getSecuritySettings = async (req, res) => {
    try {
        const queryText = 'SELECT * FROM settings_security ORDER BY updated_at DESC LIMIT 1';
        const { rows } = await pool.query(queryText);
        res.json({ success: true, settings: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSecuritySettings = async (req, res) => {
    try {
        const { low_threshold, medium_threshold, high_threshold, auto_response } = req.body;
        const queryText = `
            INSERT INTO settings_security (low_threshold, medium_threshold, high_threshold, auto_response, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [low_threshold, medium_threshold, high_threshold, auto_response, new Date().toISOString()];
        const { rows } = await pool.query(queryText, values);
        res.json({ success: true, settings: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Notifications
export const getNotificationSettings = async (req, res) => {
    try {
        const queryText = 'SELECT * FROM settings_notifications ORDER BY updated_at DESC LIMIT 1';
        const { rows } = await pool.query(queryText);
        res.json({ success: true, settings: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateNotificationSettings = async (req, res) => {
    try {
        const { email_enabled, admin_email } = req.body;
        const queryText = `
            INSERT INTO settings_notifications (email_enabled, admin_email, updated_at)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const values = [email_enabled, admin_email, new Date().toISOString()];
        const { rows } = await pool.query(queryText, values);
        res.json({ success: true, settings: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. API Keys
export const getApiKeys = async (req, res) => {
    try {
        const queryText = 'SELECT * FROM api_keys ORDER BY created_at DESC';
        const { rows } = await pool.query(queryText);
        res.json({ success: true, keys: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const rotateApiKey = async (req, res) => {
    try {
        // Deactivate all previous keys
        await pool.query('UPDATE api_keys SET is_active = false WHERE is_active = true');

        const newKey = 'cyber_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const queryText = `
            INSERT INTO api_keys (key_value, label, is_active)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const values = [newKey, 'Default Ingestion Key', true];
        const { rows } = await pool.query(queryText, values);
        res.json({ success: true, key: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Sector Management
export const getSectors = async (req, res) => {
    try {
        const queryText = `
            SELECT s.*, u.name as owner_name, u.email as owner_email
            FROM sectors s
            LEFT JOIN users u ON s.owner_id = u.id
            ORDER BY s.name
        `;
        const { rows } = await pool.query(queryText);

        const formattedSectors = rows.map(s => ({
            id: s.id,
            name: s.name.charAt(0) + s.name.slice(1).toLowerCase(),
            is_enabled: s.is_enabled,
            owner_id: s.owner_id,
            owner: s.owner_id ? { name: s.owner_name, email: s.owner_email } : null
        }));

        res.json({ success: true, sectors: formattedSectors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSectorStatus = async (req, res) => {
    try {
        const { id, is_enabled, owner_id } = req.body;
        const queryText = `
            UPDATE sectors
            SET is_enabled = $1, owner_id = $2, updated_at = $3
            WHERE id = $4
            RETURNING *
        `;
        const values = [is_enabled, owner_id, new Date().toISOString(), id];
        const { rows } = await pool.query(queryText, values);
        res.json({ success: true, sector: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

