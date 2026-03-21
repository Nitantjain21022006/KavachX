import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye, CheckCircle, ChevronDown, ChevronUp, Info, Shield, Zap, Lock, Radio, ShieldAlert, Key, Activity, Crosshair } from 'lucide-react';
import api from '../api/axiosInstance';
import SeverityBadge from '../components/SeverityBadge';
import AlertReasonPanel from '../components/AlertReasonPanel';

const ATTACK_CLASSES = [
    { id: 'DDoS', label: 'DDoS', icon: Zap, color: '#ff003c' },
    { id: 'BruteForce', label: 'Brute Force', icon: Key, color: '#ff9900' },
    { id: 'Ransomware', label: 'Ransomware', icon: Lock, color: '#ff003c' },
    { id: 'MITM', label: 'MITM', icon: Radio, color: '#ffd700' },
    { id: 'Phishing', label: 'Phishing', icon: ShieldAlert, color: '#ff9900' },
    { id: 'Normal', label: 'Normal', icon: CheckCircle, color: '#00f3ff' },
];

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeClass, setActiveClass] = useState('DDoS');
    const [expandedAlerts, setExpandedAlerts] = useState(new Set());

    useEffect(() => {
        fetchAlerts();
    }, []);

    // Auto-refresh alerts every 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            api.get('/alerts').then(response => {
                setAlerts(response.data.alerts);
            }).catch(error => console.error('Error refreshing alerts:', error));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/alerts');
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
            const cleanType = alert.type.replace(/^ML_/, ''); 
            
            const alertTime = new Date(alert.created_at).getTime();
            const key = `${cleanType}_${alert.sector}_${alert.severity || 'NULL'}`;
            
            if (!groups[key]) {
                groups[key] = {
                    key,
                    type: cleanType,
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

    // Filter aggregated alerts by active class
    const filteredByClass = useMemo(() => {
        return aggregatedAlerts.filter(group => {
            const groupTypeStr = group.type.toLowerCase().replace(/\s+/g, '');
            const targetTypeStr = activeClass.toLowerCase().replace(/\s+/g, '');
            
            if (targetTypeStr === 'normal' && groupTypeStr === 'normal') return true;
            if (groupTypeStr.includes(targetTypeStr)) return true;
            if (targetTypeStr === 'bruteforce' && groupTypeStr.includes('brute')) return true;
            if (targetTypeStr === 'phishing' && (groupTypeStr.includes('phishing') || groupTypeStr.includes('injection'))) return true;
            
            return false;
        });
    }, [aggregatedAlerts, activeClass]);

    // Categorize by severity
    const columns = useMemo(() => {
        return {
            HIGH: filteredByClass.filter(g => g.severity === 'HIGH'),
            MEDIUM: filteredByClass.filter(g => g.severity === 'MEDIUM'),
            LOW: filteredByClass.filter(g => g.severity === 'LOW' || !g.severity),
        };
    }, [filteredByClass]);

    const activeClassData = ATTACK_CLASSES.find(c => c.id === activeClass);

    return (
        <div className="space-y-8 pb-20 relative">
            {/* Cyber Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" style={{
                backgroundImage: `linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }} />

            {/* Header section */}
            <div className="relative border-b border-[#00f3ff]/20 pb-6 mb-8 group overflow-hidden">
                {/* Horizontal Scanning Line */}
                <div className="absolute top-0 left-0 h-[1px] w-full bg-[#00f3ff] animate-[scan_3s_ease-in-out_infinite] opacity-50 shadow-[0_0_10px_#00f3ff]" />
                <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex items-center gap-3 text-[#00f3ff] text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] mb-1 font-mono">
                        <Crosshair size={18} className="animate-[spin_4s_linear_infinite]" />
                        Infrastructure Security Operations <span className="text-[#ff003c] animate-pulse">:: ACTIVE</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-widest uppercase italic flex items-center gap-4 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                        Threat <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff003c]">Intelligence</span>
                    </h1>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] font-mono mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00f3ff] animate-ping" />
                        Real-time classification and response tracking matrix
                    </p>
                </div>
            </div>

            {/* Extreme Cyber Top Menu Bar */}
            <div className="flex flex-wrap gap-2 lg:flex-nowrap items-center justify-between relative z-10 mb-10 overflow-x-auto pb-4 custom-scrollbar">
                {ATTACK_CLASSES.map((atk) => {
                    const isActive = activeClass === atk.id;
                    const Icon = atk.icon;
                    return (
                        <button
                            key={atk.id}
                            onClick={() => setActiveClass(atk.id)}
                            className={`flex flex-1 items-center justify-center gap-3 px-6 py-4 transition-all duration-300 relative group overflow-hidden border min-w-[140px] ${
                                isActive 
                                ? 'bg-black/80 shadow-[0_0_20px_rgba(0,0,0,0.8)]' 
                                : 'bg-black/40 hover:bg-black/60 border-white/5 opacity-70 hover:opacity-100'
                            }`}
                            style={{
                                borderColor: isActive ? atk.color : 'rgba(255,255,255,0.05)',
                                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                            }}
                        >
                            {/* Neon glow underneath */}
                            {isActive && (
                                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${atk.color}, transparent 70%)` }} />
                            )}
                            
                            <Icon 
                                size={20} 
                                className={`transition-transform duration-300 z-10 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_currentColor]' : 'group-hover:scale-110'}`} 
                                style={{ color: isActive ? atk.color : '#666' }} 
                            />
                            <span 
                                className={`text-[12px] font-black uppercase tracking-[0.2em] font-mono z-10 ${isActive ? 'text-white drop-shadow-[0_0_5px_currentColor]' : 'text-gray-500 group-hover:text-gray-300'}`}
                            >
                                {atk.label}
                            </span>
                            
                            {/* Cyber decoration lines */}
                            {isActive && (
                                <>
                                    <div className="absolute top-0 left-0 w-2 h-[2px]" style={{ backgroundColor: atk.color }} />
                                    <div className="absolute bottom-0 right-0 w-2 h-[2px]" style={{ backgroundColor: atk.color }} />
                                </>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Main Content Area - Severity Columns */}
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-6 w-2" style={{ backgroundColor: activeClassData.color, boxShadow: `0 0 10px ${activeClassData.color}` }} />
                    <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] italic font-mono flex items-center gap-3">
                        <span style={{ color: activeClassData.color, textShadow: `0 0 15px ${activeClassData.color}` }}>//</span>
                        {activeClassData.label} Signatures
                    </h2>
                </div>

                {loading ? (
                    <div className="p-32 text-center border border-[#00f3ff]/20 bg-black/60 flex flex-col items-center justify-center relative overflow-hidden"
                         style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
                        <div className="h-20 w-20 mb-6 relative">
                            <div className="absolute inset-0 border-y-4 border-[#00f3ff]/40 rounded-full animate-[spin_3s_linear_infinite]" />
                            <div className="absolute inset-2 border-x-4 border-[#ff003c]/40 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
                            <Activity size={32} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00f3ff] animate-pulse" />
                        </div>
                        <span className="text-[14px] font-mono font-black uppercase tracking-[0.5em] text-[#00f3ff] animate-pulse">Decrypting Threat Matrix...</span>
                    </div>
                ) : filteredByClass.length === 0 ? (
                    <div className="p-24 text-center border border-[#00ff88]/20 bg-black/80 relative"
                         style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center bg-[#00ff88]/5 border-2 border-[#00ff88]/30 relative rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-[#00ff88]/20 animate-ping opacity-30" />
                            <CheckCircle size={48} className="text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,1)]" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-[0.2em] font-mono text-shadow-[0_0_10px_#00ff88]">System Secure</h3>
                        <p className="mt-4 text-[12px] text-[#00ff88]/60 font-mono font-bold uppercase tracking-[0.4em] max-w-sm mx-auto">
                            No active {activeClassData.label} signatures in current sector monitoring.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* HIGH SEVERITY COLUMN */}
                        <div className="space-y-5 bg-[#ff003c]/[0.02] border border-[#ff003c]/10 p-4 relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#ff003c] to-transparent opacity-50" />
                            <div className="flex items-center justify-between pb-4 border-b border-[#ff003c]/30">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-none bg-[#ff003c] animate-pulse shadow-[0_0_15px_rgba(255,0,60,1)] rotate-45" />
                                    <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-[#ff003c] font-mono">High_Severity</h3>
                                </div>
                                <span className="text-[12px] font-black font-mono text-[#ff003c] bg-[#ff003c]/10 px-3 py-1 border border-[#ff003c]/30 shadow-[0_0_10px_rgba(255,0,60,0.2)]">
                                    [ {columns.HIGH.length.toString().padStart(2, '0')} ]
                                </span>
                            </div>
                            <div className="space-y-5">
                                {columns.HIGH.length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-[#ff003c]/20 bg-black/40">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600">No critical events</span>
                                    </div>
                                ) : (
                                    columns.HIGH.map(group => <AlertCard key={group.key} group={group} activeColor="#ff003c" expandedAlerts={expandedAlerts} setExpandedAlerts={setExpandedAlerts} />)
                                )}
                            </div>
                        </div>

                        {/* MEDIUM SEVERITY COLUMN */}
                        <div className="space-y-5 bg-[#ff9900]/[0.02] border border-[#ff9900]/10 p-4 relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#ff9900] to-transparent opacity-50" />
                            <div className="flex items-center justify-between pb-4 border-b border-[#ff9900]/30">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-none bg-[#ff9900] rotate-45" />
                                    <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-[#ff9900] font-mono">Medium_Severity</h3>
                                </div>
                                <span className="text-[12px] font-black font-mono text-[#ff9900] bg-[#ff9900]/10 px-3 py-1 border border-[#ff9900]/30 shadow-[0_0_10px_rgba(255,153,0,0.2)]">
                                    [ {columns.MEDIUM.length.toString().padStart(2, '0')} ]
                                </span>
                            </div>
                            <div className="space-y-5">
                                {columns.MEDIUM.length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-[#ff9900]/20 bg-black/40">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600">No elevated events</span>
                                    </div>
                                ) : (
                                    columns.MEDIUM.map(group => <AlertCard key={group.key} group={group} activeColor="#ff9900" expandedAlerts={expandedAlerts} setExpandedAlerts={setExpandedAlerts} />)
                                )}
                            </div>
                        </div>

                        {/* LOW SEVERITY COLUMN */}
                        <div className="space-y-5 bg-[#00f3ff]/[0.02] border border-[#00f3ff]/10 p-4 relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#00f3ff] to-transparent opacity-50" />
                            <div className="flex items-center justify-between pb-4 border-b border-[#00f3ff]/30">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-none bg-[#00f3ff] rotate-45" />
                                    <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-[#00f3ff] font-mono">Low_Severity</h3>
                                </div>
                                <span className="text-[12px] font-black font-mono text-[#00f3ff] bg-[#00f3ff]/10 px-3 py-1 border border-[#00f3ff]/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                                    [ {columns.LOW.length.toString().padStart(2, '0')} ]
                                </span>
                            </div>
                            <div className="space-y-5">
                                {columns.LOW.length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-[#00f3ff]/20 bg-black/40">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600">No low-level events</span>
                                    </div>
                                ) : (
                                    columns.LOW.map(group => <AlertCard key={group.key} group={group} activeColor="#00f3ff" expandedAlerts={expandedAlerts} setExpandedAlerts={setExpandedAlerts} />)
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AlertCard = ({ group, activeColor, expandedAlerts, setExpandedAlerts }) => {
    const isExpanded = expandedAlerts.has(group.key);
    const latestAlert = group.latestAlert;
    
    return (
        <div 
            className="border bg-black/80 overflow-hidden hover:bg-black group relative transition-all duration-300"
            style={{ 
                borderColor: `${activeColor}40`,
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                boxShadow: `inset 0 0 20px rgba(0,0,0,0.5)`
            }}
        >
            {/* Cyber hover scanline */}
            <div className="absolute top-0 left-[-100%] w-[200%] h-[1px] opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_linear_infinite]" style={{ background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)` }} />
            
            <div className="p-5">
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[10px] font-mono font-black text-gray-300 uppercase tracking-[0.2em] bg-white/5 py-1 px-3 border border-white/10" style={{ borderLeftColor: activeColor, borderLeftWidth: '3px' }}>
                            {group.sector}
                        </span>
                        {group.count > 1 && (
                            <span className="px-3 py-1 text-white text-[10px] font-mono font-black uppercase border" style={{ borderColor: activeColor, backgroundColor: `${activeColor}20`, textShadow: `0 0 5px ${activeColor}` }}>
                                {group.count} Bundled Events
                            </span>
                        )}
                    </div>
                    <div>
                        <h4 className="font-black text-white uppercase italic tracking-[0.2em] text-lg truncate font-mono" style={{ textShadow: `0 0 10px ${activeColor}80` }}>
                            {latestAlert.metadata?.ml_response?.attack_category || group.type}
                        </h4>
                        
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-2">
                            <span>CONF: {(latestAlert.confidence || latestAlert.score || 0).toFixed(2)}</span>
                            <span className="text-gray-600">/</span>
                            <span>TS: {new Date(latestAlert.created_at).toLocaleTimeString('en-GB')}</span>
                        </div>
                    </div>
                </div>
                
                {group.count === 1 && (
                    <div className="mb-4">
                        <AlertReasonPanel alert={latestAlert} compact />
                    </div>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <Link
                        to={`/alerts/${latestAlert.id}`}
                        state={{ relatedAlerts: group.alerts }}
                        className="flex-1 flex h-10 items-center justify-center gap-2 bg-gradient-to-r from-transparent to-white/5 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] font-mono hover:text-white border border-white/10 hover:border-white/30 transition-all relative overflow-hidden group/btn"
                        style={{ borderRightColor: activeColor, borderRightWidth: '4px' }}
                    >
                        <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-500" style={{ backgroundColor: activeColor }} />
                        <Eye size={14} className="group-hover/btn:animate-pulse" /> View Investigation
                    </Link>
                    {group.count > 1 && (
                        <button
                            onClick={() => {
                                const newExpanded = new Set(expandedAlerts);
                                if (isExpanded) newExpanded.delete(group.key);
                                else newExpanded.add(group.key);
                                setExpandedAlerts(newExpanded);
                            }}
                            className="flex h-10 w-10 items-center justify-center bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:border-white/30 transition-all"
                        >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                </div>

                {isExpanded && group.count > 1 && (
                    <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                        <AlertReasonPanel alert={latestAlert} compact />
                        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Bundled Event Log</p>
                            {group.alerts.slice(1).map((a) => (
                                <div key={a.id} className="flex flex-col gap-1 p-2 bg-black/60 border border-white/5 hover:border-white/20 transition-colors"
                                     style={{ borderLeftColor: `${activeColor}40`, borderLeftWidth: '2px' }}>
                                    <div className="flex justify-between items-center text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                                        <span>ID_{a.id.slice(0, 6)}</span>
                                        <span className="text-gray-500">{new Date(a.created_at).toLocaleTimeString('en-GB')}</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-gray-500 truncate w-full">IP: {a.metadata?.ip || 'UNKNOWN'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alerts;
