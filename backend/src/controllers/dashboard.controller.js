import pool from '../utils/db.js';

/**
 * GET /api/dashboard
 * Returns all data the dashboard needs in a single, efficient query bundle.
 */
export const getDashboardData = async (req, res) => {
    try {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Build sector filter for SECTOR_OWNER role
        const isSectorOwner = req.user.role === 'SECTOR_OWNER' && req.user.sector;
        const sectorParam = isSectorOwner ? req.user.sector : null;

        // 1. Total events last 24h
        const eventsCountQuery = pool.query(
            `SELECT COUNT(*) as count FROM events WHERE created_at > $1${sectorParam ? ' AND sector = $2' : ''}`,
            sectorParam ? [since24h, sectorParam] : [since24h]
        );

        // 2. All alerts (for suppression calc and severity breakdown)
        const allAlertsQuery = pool.query(
            `SELECT id, sector, type, severity, score, status, created_at, explanation, metadata FROM alerts${sectorParam ? ' WHERE sector = $1' : ''} ORDER BY created_at DESC`,
            sectorParam ? [sectorParam] : []
        );

        // 3. 24h severity breakdown (the fix for the "all high" issue)
        // Use ALL alerts (not just ACTIVE) for a fair statistical distribution
        const severityBreakdownQuery = pool.query(
            `SELECT severity, COUNT(*) as count FROM alerts WHERE created_at > $1${sectorParam ? ' AND sector = $2' : ''} GROUP BY severity`,
            sectorParam ? [since24h, sectorParam] : [since24h]
        );

        // 4. Attack type breakdown - last 24h
        const attackTypeQuery = pool.query(
            `SELECT type, COUNT(*) as count FROM alerts WHERE created_at > $1${sectorParam ? ' AND sector = $2' : ''} GROUP BY type ORDER BY count DESC LIMIT 8`,
            sectorParam ? [since24h, sectorParam] : [since24h]
        );

        // 5. Hourly throughput - last 24 hours, as raw epoch hours for reliable matching
        const throughputQuery = pool.query(
            `SELECT 
                EXTRACT(EPOCH FROM DATE_TRUNC('hour', created_at))::BIGINT as epoch_hour,
                COUNT(*) as alert_count
             FROM alerts 
             WHERE created_at > NOW() - INTERVAL '24 hours'${sectorParam ? ' AND sector = $1' : ''}
             GROUP BY epoch_hour 
             ORDER BY epoch_hour ASC`,
            sectorParam ? [sectorParam] : []
        );

        // 6. Sector health
        const sectorHealthQuery = pool.query(
            `SELECT sector, COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_count, COUNT(*) as total_count
             FROM alerts 
             WHERE created_at > $1
             GROUP BY sector`,
            [since24h]
        );

        // 7. Recent alerts feed (top 12)
        const recentAlertsQuery = pool.query(
            `SELECT id, sector, type, severity, score, status, created_at, explanation FROM alerts${sectorParam ? ' WHERE sector = $1' : ''} ORDER BY created_at DESC LIMIT 12`,
            sectorParam ? [sectorParam] : []
        );

        // 8. Status breakdown (Active vs Resolved)
        const statusBreakdownQuery = pool.query(
            `SELECT status, COUNT(*) as count FROM alerts${sectorParam ? ' WHERE sector = $1' : ''} GROUP BY status`,
            sectorParam ? [sectorParam] : []
        );

        // Run all queries in parallel for performance
        const [
            eventsRes,
            allAlertsRes,
            severityRes,
            attackTypeRes,
            throughputRes,
            sectorHealthRes,
            recentAlertsRes,
            statusBreakdownRes,
        ] = await Promise.all([
            eventsCountQuery,
            allAlertsQuery,
            severityBreakdownQuery,
            attackTypeQuery,
            throughputQuery,
            sectorHealthQuery,
            recentAlertsQuery,
            statusBreakdownQuery,
        ]);

        const totalEvents = parseInt(eventsRes.rows[0].count, 10);
        const allAlerts = allAlertsRes.rows;
        const totalAlerts = allAlerts.length;
        const suppressionRate = totalEvents > 0 ? Math.round(((totalEvents - totalAlerts) / totalEvents) * 100) : 0;

        // Active alerts
        const activeAlerts = allAlerts.filter(a => a.status === 'ACTIVE');
        const highSeverityCount = activeAlerts.filter(a => a.severity === 'HIGH').length;

        // Compute summary stats
        const systemStatus = highSeverityCount > 5 ? 'CRITICAL' : highSeverityCount > 0 ? 'COMPROMISED' : 'OPTIMAL';
        const riskLevel = highSeverityCount > 0 ? 'ELEVATED' : 'STABLE';

        // Severity distribution (24h window, all alerts - not just ACTIVE)
        const SEVERITY_NAMES = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
        const severityMap = { Low: 0, Medium: 0, High: 0 };
        severityRes.rows.forEach(row => {
            const normalized = row.severity?.toUpperCase();
            if (normalized === 'CRITICAL') severityMap['High'] = (severityMap['High'] || 0) + parseInt(row.count, 10);
            else {
                const label = SEVERITY_NAMES[normalized] || 'Low';
                severityMap[label] = (severityMap[label] || 0) + parseInt(row.count, 10);
            }
        });
        const severityData = Object.entries(severityMap).map(([name, value]) => ({ name, value }));

        // Attack type breakdown (strip ML_ prefix)
        const attackTypes = attackTypeRes.rows.map(row => ({
            name: row.type.replace(/^(ML_|ASTRAX_)/, '').replace(/_SIMULATION$/, '').replace(/_/g, ' '),
            rawType: row.type,
            count: parseInt(row.count, 10),
        }));

        // Throughput data: match DB epoch hours directly against 24 generated slots
        // This avoids timezone formatting mismatches (e.g. IST +05:30 offset)
        const throughputEpochMap = {};
        throughputRes.rows.forEach(row => {
            throughputEpochMap[parseInt(row.epoch_hour, 10)] = parseInt(row.alert_count, 10);
        });

        // Generate 24-slot labels aligned to UTC hours (same as DB)
        const throughputData = [];
        const nowEpoch = Math.floor(Date.now() / 1000);
        const currentHourEpoch = nowEpoch - (nowEpoch % 3600); // snap to start of current UTC hour
        for (let i = 23; i >= 0; i--) {
            const slotEpoch = currentHourEpoch - (i * 3600);
            const slotDate = new Date(slotEpoch * 1000);
            // Display time in user's local timezone (browser will handle this on frontend)
            const label = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            throughputData.push({
                time: label,
                epoch: slotEpoch,
                value: throughputEpochMap[slotEpoch] || 0,
            });
        }

        // Sector health computation
        const sectorHealthMap = {};
        sectorHealthRes.rows.forEach(row => {
            sectorHealthMap[row.sector] = {
                activeCount: parseInt(row.active_count, 10),
                totalCount: parseInt(row.total_count, 10),
            };
        });

        const SECTORS_CONFIG = [
            { id: 'HEALTHCARE', name: 'Healthcare Grid' },
            { id: 'AGRICULTURE', name: 'Agro-Network' },
            { id: 'URBAN', name: 'Urban Nexus' },
        ];

        const sectors = SECTORS_CONFIG.map(s => {
            const data = sectorHealthMap[s.id] || { activeCount: 0, totalCount: 0 };
            const sectorHealth = Math.max(0, 100 - (data.activeCount * 8));
            return {
                ...s,
                incidents: data.activeCount,
                total: data.totalCount,
                health: sectorHealth,
                risk: data.activeCount > 3 ? 'HIGH' : data.activeCount > 0 ? 'MEDIUM' : 'LOW',
            };
        });

        // Status breakdown
        const statusMap = {};
        statusBreakdownRes.rows.forEach(row => {
            statusMap[row.status] = parseInt(row.count, 10);
        });

        res.json({
            success: true,
            summary: {
                totalEvents,
                totalAlerts,
                suppressionRate,
                activeThreats: activeAlerts.length,
                systemStatus,
                riskLevel,
            },
            severityData,
            attackTypes,
            throughputData,
            sectors,
            recentAlerts: recentAlertsRes.rows,
            statusBreakdown: {
                active: statusMap['ACTIVE'] || 0,
                resolved: statusMap['RESOLVED'] || 0,
            },
        });
    } catch (error) {
        console.error('[Dashboard] Error fetching dashboard data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
