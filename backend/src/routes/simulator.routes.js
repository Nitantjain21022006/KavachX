import express from 'express';
import logBroadcaster from '../utils/logBroadcaster.js';

const router = express.Router();

/**
 * GET /api/simulator/logs
 * Server-Sent Events stream — pushes live backend log lines to AstraXfront.
 * No authentication required (dev/demo tool).
 */
router.get('/logs', (req, res) => {
    // SSE headers
    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send a welcome ping so the client knows the stream is alive
    res.write(`data: ${JSON.stringify({ level: 'info', message: '🔗 AstraXfront log stream connected', ts: Date.now() })}\n\n`);

    // Subscribe to log events
    const onLog = (entry) => {
        try {
            res.write(`data: ${JSON.stringify(entry)}\n\n`);
        } catch (_) {
            // Client disconnected mid-write — ignore
        }
    };

    logBroadcaster.on('log', onLog);

    // Heartbeat every 15s to prevent proxy timeouts
    const heartbeat = setInterval(() => {
        try {
            res.write(`: heartbeat\n\n`);
        } catch (_) {
            clearInterval(heartbeat);
        }
    }, 15000);

    // Cleanup when client disconnects
    req.on('close', () => {
        logBroadcaster.off('log', onLog);
        clearInterval(heartbeat);
    });
});

export default router;
