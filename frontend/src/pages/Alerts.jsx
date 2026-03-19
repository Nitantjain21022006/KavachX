import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertTriangle, Eye, CheckCircle, ChevronDown, ChevronUp, Info, Shield } from 'lucide-react';
import api from '../api/axiosInstance';
import SeverityBadge from '../components/SeverityBadge';
import AlertReasonPanel from '../components/AlertReasonPanel';

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterSector, setFilterSector] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [hideNormal, setHideNormal] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedAlerts, setExpandedAlerts] = useState(new Set());
    const alertsPerPage = 10;

    useEffect(() => {
        fetchAlerts();
        setCurrentPage(1); // Reset to first page on filter change
    }, [filterSector, filterSeverity]);

    // Auto-refresh alerts every 2 seconds to catch auto-resolved LOW/MEDIUM alerts
    // This ensures RESOLVED status is shown after auto-resolution (5s for LOW, 10s for MEDIUM)
    useEffect(() => {
        const interval = setInterval(() => {
            // Fetch fresh alerts to update status from ACTIVE to RESOLVED
            api.get('/alerts', {
                params: { sector: filterSector, severity: filterSeverity }
            }).then(response => {
                setAlerts(response.data.alerts);
            }).catch(error => {
                console.error('Error refreshing alerts:', error);
            });
        }, 2000);
        
        return () => clearInterval(interval);
    }, [filterSector, filterSeverity]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/alerts', {
                params: { sector: filterSector, severity: filterSeverity }
            });
            setAlerts(response.data.alerts);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    // Aggregation Logic - Group similar alerts by type, sector, and severity
    const aggregatedAlerts = useMemo(() => {
        const groups = {};
        const now = Date.now();
        const sixtySecondsAgo = now - 60 * 1000;

        alerts.forEach(alert => {
            if (hideNormal && alert.type === 'ML_NORMAL') return;
            
            const alertTime = new Date(alert.created_at).getTime();
            const key = `${alert.type}_${alert.sector}_${alert.severity || 'NULL'}`;
            
            if (!groups[key]) {
                groups[key] = {
                    key,
                    type: alert.type,
                    sector: alert.sector,
                    severity: alert.severity,
                    alerts: [],
                    count: 0,
                    latestAlert: alert,
                    minCreated: alertTime,
                    maxCreated: alertTime
                };
            }
            
            groups[key].alerts.push(alert);
            groups[key].count++;
            
            // Check if this alert is within last 60s
            if (alertTime >= sixtySecondsAgo) {
                groups[key].recentCount = (groups[key].recentCount || 0) + 1;
            }
            
            if (alertTime > groups[key].maxCreated) {
                groups[key].maxCreated = alertTime;
                groups[key].latestAlert = alert;
            }
            if (alertTime < groups[key].minCreated) {
                groups[key].minCreated = alertTime;
            }
        });

        return Object.values(groups).sort((a, b) => b.maxCreated - a.maxCreated);
    }, [alerts]);

    // Near-Miss Detection - Alerts that were anomalous but LOW severity
    const nearMisses = useMemo(() => {
        return alerts.filter(alert => {
            const mlResponse = alert.metadata?.ml_response;
            const context = alert.metadata?.context || {};
            const isAnomalous = mlResponse?.is_anomalous || false;
            const severity = alert.severity;
            const eventRate = context.event_rate_60s || 0;
            
            // Near-miss: Anomalous but LOW severity, or event rate close to threshold
            return (isAnomalous && severity === 'LOW') || (severity === 'LOW' && eventRate >= 2 && eventRate < 4);
        }).slice(0, 5); // Show top 5 near-misses
    }, [alerts]);

    // Pagination Logic for aggregated alerts
    const indexOfLastAlert = currentPage * alertsPerPage;
    const indexOfFirstAlert = indexOfLastAlert - alertsPerPage;
    const currentAlerts = aggregatedAlerts.slice(indexOfFirstAlert, indexOfLastAlert);
    const totalPages = Math.ceil(aggregatedAlerts.length / alertsPerPage);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[#ff003c] text-[10px] font-black uppercase tracking-[0.3em] mb-1">
                        <AlertTriangle size={12} className="animate-pulse" />
                        Active Vector Intelligence
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Anomaly Stream</h1>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">Intercepted Infrastructure Events</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-widest text-[#00f3ff] hover:text-white transition-colors bg-[#00f3ff]/5 px-3 py-2.5 rounded-xl border border-[#00f3ff]/10">
                        <input
                            type="checkbox"
                            checked={hideNormal}
                            onChange={(e) => setHideNormal(e.target.checked)}
                            className="accent-[#00f3ff] h-3 w-3 bg-black/40 border-white/10"
                        />
                        Hide 'Normal' Traffic
                    </label>

                    <div className="relative group">
                        <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00f3ff]/40 group-focus-within:text-[#00f3ff]" />
                        <select
                            value={filterSector}
                            onChange={(e) => setFilterSector(e.target.value)}
                            className="appearance-none rounded-xl border border-white/5 bg-black/40 py-3 pl-12 pr-10 text-[10px] font-black uppercase tracking-widest text-[#ff003c] outline-none focus:border-[#ff003c]/50 transition-all cursor-pointer shadow-inner"
                        >
                            <option value=""  className="bg-[#0a0a0a] text-gray-400"  >All Sectors</option>
                            <option value="HEALTHCARE"  className="bg-[#0a0a0a] text-gray-400" >Healthcare Grid</option>
                            <option value="AGRICULTURE"  className="bg-[#0a0a0a] text-gray-400" >Agro-Network</option>
                            <option value="URBAN"  className="bg-[#0a0a0a] text-gray-400">Urban Nexus</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00f3ff]/40 pointer-events-none" />
                    </div>

                    <div className="relative group">
                        <select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            className="appearance-none rounded-xl border border-white/5 bg-black/40 py-3 px-6 pr-10 text-[10px] font-black uppercase tracking-widest text-[#ff003c] outline-none focus:border-[#ff003c]/50 transition-all cursor-pointer shadow-inner"
                        >
                            <option value="" className="bg-[#0a0a0a] text-gray-400">All Severities</option>
                            <option value="LOW" className="bg-[#0a0a0a] text-gray-400">Class: LOW</option>
                            <option value="MEDIUM" className="bg-[#0a0a0a] text-gray-400">Class: MEDIUM</option>
                            <option value="HIGH" className="bg-[#0a0a0a] text-gray-400">Class: HIGH</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ff003c]/40 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="glass rounded-[2rem] overflow-hidden border-[#00f3ff]/5 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/20 to-transparent" />

                {loading ? (
                    <div className="p-20 text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#00f3ff]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f3ff] animate-pulse">Decrypting Anomaly Pipeline...</span>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/20 shadow-[0_0_20px_rgba(57,255,20,0.1)]">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase italic italic">Neural Shield Active</h3>
                        <p className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">No critical anomalies detected in current cycle</p>
                    </div>
                ) : (
                    <div className="space-y-4 p-8">
                        {/* Aggregated Alert Cards */}
                        {currentAlerts.map((group) => {
                            const isExpanded = expandedAlerts.has(group.key);
                            const latestAlert = group.latestAlert;
                            
                            return (
                                <div 
                                    key={group.key} 
                                    className="glass rounded-2xl border-[#00f3ff]/5 overflow-hidden hover:border-[#00f3ff]/20 transition-all"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-black/60 border border-white/5 ${latestAlert.severity === 'HIGH' ? 'text-[#ff003c] shadow-[0_0_15px_rgba(255,0,60,0.1)]' : latestAlert.severity === 'MEDIUM' ? 'text-[#ff9900]' : 'text-gray-500'
                                                        }`}>
                                                        <AlertTriangle size={20} className={latestAlert.severity === 'HIGH' ? 'animate-pulse' : ''} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="font-black text-white uppercase italic tracking-wider text-lg">{group.type.replace(/^ML_/, '')}</span>
                                                            {group.count > 1 && (
                                                                <span className="px-2.5 py-0.5 rounded-full bg-[#00f3ff]/10 text-[#00f3ff] text-[9px] font-black uppercase border border-[#00f3ff]/20">
                                                                    Aggregated from {group.count} events
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 flex-wrap mt-2">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{group.sector}</span>
                                                            <SeverityBadge severity={group.severity} />
                                                            <span className="text-[10px] font-black text-[#00f3ff] uppercase tracking-widest bg-[#00f3ff]/10 px-2 py-0.5 rounded border border-[#00f3ff]/20">
                                                                CAT: {latestAlert.metadata?.ml_response?.attack_category || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                        <span className="font-black">Confidence:</span>
                                                        <span className="text-white font-mono">{(latestAlert.confidence || latestAlert.score || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                        <span className="font-black">Latest:</span>
                                                        <span className="text-gray-400">{new Date(latestAlert.created_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/alerts/${latestAlert.id}`}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-500 hover:bg-[#00f3ff]/10 hover:text-[#00f3ff] border border-white/5 transition-all"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                {group.count > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            const newExpanded = new Set(expandedAlerts);
                                                            if (isExpanded) {
                                                                newExpanded.delete(group.key);
                                                            } else {
                                                                newExpanded.add(group.key);
                                                            }
                                                            setExpandedAlerts(newExpanded);
                                                        }}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-500 hover:bg-white/10 border border-white/5 transition-all"
                                                    >
                                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Alert Reason Panel */}
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <AlertReasonPanel alert={latestAlert} />
                                        </div>
                                        
                                        {/* Expanded suppressed events */}
                                        {isExpanded && group.count > 1 && (
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <div className="flex justify-between items-end mb-3">
                                                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                                        Suppressed Events ({group.count - 1} similar in last 60s)
                                                    </div>
                                                    <div className="text-[9px] font-black text-[#00f3ff] uppercase tracking-widest bg-[#00f3ff]/10 px-2.5 py-1 rounded-lg border border-[#00f3ff]/20">
                                                        {new Set(group.alerts.map(a => a.metadata?.ip).filter(Boolean)).size} Unique Source IPs
                                                    </div>
                                                </div>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {group.alerts.slice(1).map((suppressedAlert, idx) => (
                                                        <div key={suppressedAlert.id} className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 text-[9px]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-1 w-1 rounded-full bg-gray-600" />
                                                                <span className="text-gray-500">ID: {suppressedAlert.id.slice(0, 8)}</span>
                                                                <span className="text-gray-600">•</span>
                                                                <span className="text-gray-400">{new Date(suppressedAlert.created_at).toLocaleTimeString()}</span>
                                                            </div>
                                                            <span className="text-gray-600 italic">Suppressed (pattern match)</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && aggregatedAlerts.length > 0 && (
                    <div className="flex items-center justify-between px-8 py-6 bg-black/40 border-t border-white/5">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                            Displaying {indexOfFirstAlert + 1}-{Math.min(indexOfLastAlert, aggregatedAlerts.length)} OF {aggregatedAlerts.length} Aggregated Alerts
                            <span className="ml-4 text-gray-600">({alerts.length} total events processed)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex h-10 w-24 items-center justify-center rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 transition-all"
                            >
                                <ChevronDown size={14} className="rotate-90 mr-1" />
                                Previous
                            </button>
                            <div className="flex items-center gap-1.5 mx-4">
                                {[...Array(totalPages)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-500 ${currentPage === i + 1 ? 'w-6 bg-[#00f3ff]' : 'w-2 bg-white/10'}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex h-10 w-24 items-center justify-center rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 transition-all"
                            >
                                Next
                                <ChevronDown size={14} className="-rotate-90 ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Near-Miss / Watchlist Section */}
            {nearMisses.length > 0 && (
                <div className="glass rounded-3xl p-8 border-[#ff9900]/20">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield size={20} className="text-[#ff9900]" />
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Near-Escalation Watchlist</h3>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-1">False-negative awareness monitoring</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {nearMisses.map((alert) => {
                            const context = alert.metadata?.context || {};
                            const eventRate = context.event_rate_60s || 0;
                            return (
                                <div key={alert.id} className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-[#ff9900]/10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff9900]/10 text-[#ff9900] border border-[#ff9900]/20">
                                            <Info size={16} />
                                        </div>
                                        <div>
                                            <div className="font-black text-white text-sm uppercase tracking-wider">{alert.type}</div>
                                            <div className="text-[9px] text-gray-500 mt-1">
                                                {alert.sector} • Event Rate: {eventRate}/min • Anomalous but LOW severity
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-[#ff9900] font-black uppercase italic px-3 py-1.5 rounded-lg bg-[#ff9900]/10 border border-[#ff9900]/20">
                                        Would escalate if activity persists
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Footer Note */}
            <div className="glass rounded-xl p-6 border-white/5 bg-black/20">
                <div className="flex items-start gap-3">
                    <Info size={16} className="text-gray-600 mt-0.5" />
                    <div className="text-[10px] text-gray-600 leading-relaxed">
                        <span className="font-black uppercase tracking-wider">Note:</span> Alerts represent confirmed risk patterns, not individual anomalies. 
                        Events are aggregated by type, sector, and severity to minimize false positives and focus on actionable threats.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Alerts;
