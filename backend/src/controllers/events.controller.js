import * as eventProcessor from '../services/eventProcessor.service.js';
import pool from '../utils/db.js';

export const ingestEvent = async (req, res) => {
    // Note: `severity` is intentionally NOT destructured from req.body.
    // Severity categorization (High / Medium / Low) is determined exclusively
    // by the ML model. External clients should not and cannot override it.
    const { sector, type, metadata } = req.body;

    if (!sector || !type) {
        return res.status(400).json({
            success: false,
            message: 'Missing required event fields: sector, type'
        });
    }

    const remoteIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const enhancedMetadata = { ip: remoteIp, ...metadata };

    const result = await eventProcessor.processEvent({
        sector,
        type,
        metadata: enhancedMetadata
    });

    if (result.success) {
        res.status(201).json({
            success: true,
            message: 'Event ingested and processed',
            eventId: result.eventId
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to process event',
            error: result.error
        });
    }
};

export const getEventStats = async (req, res) => {
    try {
        const queryText = `
            SELECT COUNT(*) FROM events 
            WHERE created_at > $1
        `;
        const values = [new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()];

        const { rows } = await pool.query(queryText, values);
        const count = parseInt(rows[0].count, 10);

        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

