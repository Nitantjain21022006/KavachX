import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Cpu, Activity, Send, CheckCircle, XCircle, Terminal, Globe, HardDrive, Database, Network, Crosshair, Server } from 'lucide-react';
import api from '../api/axiosInstance';
import SeverityBadge from '../components/SeverityBadge';

const AlertDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Grouped alerts passed from Alerts.jsx
    const relatedAlertsState = location.state?.relatedAlerts || [];
    
    const [alert, setAlert] = useState(null);
    const [relatedAlerts, setRelatedAlerts] = useState(relatedAlertsState);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionResult, setActionResult] = useState(null);
    const [activeTab, setActiveTab] = useState('structured');

    useEffect(() => {
        // Fetch the main alert requested by ID
        fetchAlertData();
    }, [id]);

    const fetchAlertData = async () => {
        try {
            const response = await api.get(`/alerts/${id}`);
            const mainAlert = response.data.alert;
            setAlert(mainAlert);
            
            // If we didn't get related alerts via React Router state (e.g. direct link),
            // we'll just treat it as a single event for now to save a heavy backend search.
            if (relatedAlerts.length === 0) {
                setRelatedAlerts([mainAlert]);
            }
        } catch (error) {
            console.error('Error fetching alert details:', error);
        } finally {
            setLoading(false);
        }
    };

    const activeAlerts = useMemo(() => relatedAlerts.filter(a => a.status === 'ACTIVE' || a.status === 'OPEN'), [relatedAlerts]);
    const resolvedAlerts = useMemo(() => relatedAlerts.filter(a => a.status === 'RESOLVED'), [relatedAlerts]);

    const handleExecuteBulkAction = async (action, target) => {
        if (activeAlerts.length === 0) return;
        
        setActionLoading(true);
        setActionResult(null);
        
        const activeIds = activeAlerts.map(a => a.id);
        
        try {
            const response = await api.post('/responses/execute-bulk', { 
                action, 
                target, 
                alertIds: activeIds 
            });
            
            setActionResult({ 
                success: true, 
                message: `Bulk Protocol ${action} executed. ${response.data.resolvedCount} events isolated.` 
            });
            
            // Optimistically update local state to reflect resolved status
            setRelatedAlerts(prev => prev.map(a => 
                activeIds.includes(a.id) ? { ...a, status: 'RESOLVED' } : a
            ));
            
            // Update main alert if it was active
            if (activeIds.includes(alert.id)) setAlert(prev => ({ ...prev, status: 'RESOLVED' }));
            
        } catch (error) {
            setActionResult({ success: false, message: error.response?.data?.message || 'Protocol execution failed.' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 h-[80vh] relative">
            <div className="absolute inset-0 bg-[#00f3ff]/5 bg-[size:40px_40px] opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)' }} />
            <div className="h-24 w-24 mb-6 relative">
                <div className="absolute inset-0 border-y-4 border-[#ff003c]/20 rounded-full animate-[spin_4s_linear_infinite]" />
                <div className="absolute inset-2 border-x-4 border-[#00f3ff]/40 rounded-full animate-[spin_2s_linear_infinite]" />
                <Activity size={32} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00f3ff] animate-pulse" />
            </div>
            <span className="text-[14px] font-black uppercase tracking-[0.5em] text-[#00f3ff] animate-pulse font-mono drop-shadow-[0_0_10px_#00f3ff]">Extracting Payload...</span>
        </div>
    );
    
    if (!alert) return (
        <div className="flex flex-col items-center justify-center p-32 h-[80vh]">
            <XCircle size={64} className="text-[#ff003c] mb-6 animate-pulse drop-shadow-[0_0_20px_#ff003c]" />
            <div className="text-[20px] text-center text-[#ff003c] font-black uppercase font-mono tracking-[0.3em]">Signature Not Found</div>
            <div className="text-[12px] text-[#ff003c]/60 uppercase font-mono mt-2 tracking-widest">Data block corrupted or expunged</div>
        </div>
    );

    const themeColor = alert.severity === 'HIGH' ? '#ff003c' : alert.severity === 'MEDIUM' ? '#ff9900' : '#00f3ff';

    const renderStructuredData = (metadata) => {
        if (!metadata) return null;
        
        const networkKeys = ['ip', 'packet_count', 'byte_count', 'syn_packet_count', 'syn_ack_ratio', 'packets_per_second', 'unique_source_ips'];
        const hostKeys = ['cpu_usage_spike', 'memory_usage_mb', 'disk_write_rate', 'process_count', 'thread_count', 'file_modification_rate'];
        const appKeys = ['url_length', 'domain_age', 'api_request_count', 'failed_login_count', 'login_attempts', 'http_response_code_404', 'http_response_code_200'];
        
        const getGroup = (keys) => Object.entries(metadata).filter(([k]) => keys.includes(k));
        
        const otherEntries = Object.entries(metadata).filter(([k, v]) => 
            !networkKeys.includes(k) && !hostKeys.includes(k) && !appKeys.includes(k) && 
            k !== 'ml_response' && k !== 'simulation' && k !== 'severity_profile' && k !== 'source' && typeof v !== 'object'
        );

        const DataBlock = ({ title, icon: Icon, entries, borderColor }) => {
            if (entries.length === 0) return null;
            return (
                <div className="bg-black/80 p-5 relative group overflow-hidden border border-white/5 transition-colors hover:border-white/20"
                     style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                     <div className="absolute top-0 left-0 w-1 h-full opacity-50" style={{ backgroundColor: borderColor }} />
                    <h4 className="flex items-center gap-3 text-[11px] font-black font-mono text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-3">
                        <Icon size={16} style={{ color: borderColor }} className="drop-shadow-[0_0_5px_currentColor]" /> {title}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4 relative z-10">
                        {entries.map(([k, v]) => (
                            <div key={k} className="flex flex-col gap-1">
                                <span className="text-[9px] text-gray-500 uppercase font-mono tracking-widest truncate">{k.replace(/_/g, ' ')}</span>
                                <span className="text-sm font-mono font-black text-gray-200 truncate">{String(v)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 object-contain">
                <DataBlock title="Network Telemetry" icon={Network} entries={getGroup(networkKeys)} borderColor="#00f3ff" />
                <DataBlock title="Application Layer" icon={Globe} entries={getGroup(appKeys)} borderColor="#ff9900" />
                <DataBlock title="Host Infrastructure" icon={HardDrive} entries={getGroup(hostKeys)} borderColor="#ff003c" />
                <DataBlock title="Anomalous Tags" icon={Database} entries={otherEntries} borderColor="#a855f7" />
                
                {metadata.ml_response && (
                    <div className="md:col-span-2 bg-black/80 p-6 border transition-all duration-300 relative group overflow-hidden"
                         style={{ borderColor: `${themeColor}40`, clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                        <div className="absolute top-0 right-0 w-48 h-48 blur-3xl opacity-10 pointer-events-none" style={{ backgroundColor: themeColor }} />
                        <h4 className="flex items-center gap-3 text-[12px] font-black uppercase font-mono tracking-[0.2em] mb-5 border-b pb-3" style={{ color: themeColor, borderBottomColor: `${themeColor}20` }}>
                            <Activity size={18} className="animate-pulse" /> ML Classification Tensor
                        </h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                            {Object.entries(metadata.ml_response).map(([k, v]) => {
                                if (typeof v === 'object') return null;
                                return (
                                    <div key={k} className="flex flex-col gap-1 p-3 bg-white/[0.02] border border-white/5 shadow-inner">
                                        <span className="text-[9px] uppercase font-mono tracking-widest" style={{ color: `${themeColor}80` }}>{k.replace(/_/g, ' ')}</span>
                                        <span className="text-[13px] font-mono font-black text-white truncate">{String(v)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="px-4 mx-auto max-w-7xl space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Ambient cyber bg */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-[-1]" style={{ backgroundImage: `linear-gradient(${themeColor} 1px, transparent 1px), linear-gradient(90deg, ${themeColor} 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />

            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-3 text-[10px] font-black font-mono uppercase text-gray-400 hover:text-white transition-all tracking-[0.2em] bg-black/80 py-3 px-5 border border-white/10 hover:border-white/30 shadow-lg relative overflow-hidden group w-max"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
                <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <ArrowLeft size={16} className="relative z-10" />
                <span className="relative z-10">Abort Connection</span>
            </button>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                <div className="xl:col-span-2 space-y-8">
                    {/* Header Panel */}
                    <div className="bg-black/90 p-8 border relative overflow-hidden group shadow-2xl"
                         style={{ 
                             borderColor: `${themeColor}40`, 
                             clipPath: 'polygon(30px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 30px)',
                             boxShadow: `inset 0 0 50px rgba(0,0,0,0.8), 0 0 30px ${themeColor}10`
                          }}>
                        
                        <div className="absolute top-0 right-[-100px] w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none opacity-20" style={{ backgroundColor: themeColor }} />
                        <div className="absolute top-0 left-0 h-full w-2" style={{ backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}` }} />
                        
                        {/* Decorative scanning line */}
                        <div className="absolute top-0 left-0 w-full h-[1px] animate-[scan_2s_linear_infinite]" style={{ backgroundColor: themeColor, boxShadow: `0 0 15px ${themeColor}` }} />

                        <div className="mb-10 flex flex-wrap gap-6 items-start justify-between relative z-10">
                            <div>
                                <div className="mb-4 flex items-center gap-4">
                                    <span className="text-[12px] font-black text-white bg-black border py-1.5 px-4 uppercase font-mono tracking-[0.3em] shadow-inner" style={{ borderColor: themeColor }}>
                                        {alert.sector}
                                    </span>
                                    <span className="text-[10px] font-black text-gray-500 font-mono tracking-widest uppercase border border-gray-700 px-3 py-1.5 bg-white/5">
                                        ID: {alert.id.slice(0,8)}
                                    </span>
                                </div>
                                <h1 className="text-5xl lg:text-6xl font-black italic tracking-widest font-mono text-white drop-shadow-2xl break-all leading-tight">
                                    {alert.type.replace(/^ML_/, '')}
                                </h1>
                                <p className="mt-4 text-gray-400 text-sm font-mono tracking-wide max-w-xl leading-relaxed border-l-2 pl-4" style={{ borderColor: `${themeColor}40` }}>
                                    {alert.explanation}
                                </p>
                            </div>
                            <div className="bg-black/80 p-6 border shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative overflow-hidden"
                                 style={{ borderColor: `${themeColor}50`, color: themeColor, clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                                <div className="absolute inset-0 opacity-10 blur-md bg-current" />
                                <ShieldAlert size={64} className="relative z-10 drop-shadow-[0_0_15px_currentColor]" />
                            </div>
                        </div>

                        {/* Status Blocks */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 border-t pt-8 relative z-10" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <div className="bg-black/60 p-5 border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 font-mono uppercase tracking-[0.2em] mb-2">Confidence Matrix</p>
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl font-black font-mono tracking-tighter text-white" style={{ textShadow: `0 0 10px ${themeColor}80` }}>
                                        {(alert.score * 100).toFixed(0)}<span className="text-gray-600 text-sm">%</span>
                                    </span>
                                    <div className="flex-1 h-2 bg-black border border-white/10 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 h-full" style={{ width: `${alert.score * 100}%`, backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-black/60 p-5 border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 font-mono uppercase tracking-[0.2em] mb-2">Severity Level</p>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="h-4 w-4 bg-transparent border-2 shadow-[0_0_10px_currentColor] animate-pulse rotate-45" style={{ borderColor: themeColor, backgroundColor: `${themeColor}40` }} />
                                    <p className="text-2xl font-black tracking-[0.2em] italic font-mono" style={{ color: themeColor }}>
                                        {alert.severity}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-black/60 p-5 border border-white/5 col-span-2 lg:col-span-1">
                                <p className="text-[10px] font-black text-gray-500 font-mono uppercase tracking-[0.2em] mb-2">Cluster Status</p>
                                <div className="mt-2 flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-widest text-[#00ff88]">
                                        <span>Resolved</span>
                                        <span>{resolvedAlerts.length} / {relatedAlerts.length}</span>
                                    </div>
                                    <div className="h-2 w-full bg-black border border-white/10 mt-1 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 h-full bg-[#00ff88] transition-all duration-500 shadow-[0_0_10px_#00ff88]" 
                                             style={{ width: `${(resolvedAlerts.length / relatedAlerts.length) * 100}%` }} />
                                    </div>
                                    {activeAlerts.length > 0 && (
                                        <div className="text-[9px] font-mono text-[#ff003c] uppercase tracking-widest mt-2 animate-pulse">
                                            {activeAlerts.length} signatures require action
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Section - Structured vs Raw */}
                    <div className="bg-black/80 p-8 border border-white/5 relative shadow-xl" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-5 border-b border-white/5 gap-4">
                            <h3 className="flex items-center gap-4 text-2xl font-black italic tracking-[0.2em] text-white font-mono">
                                <Cpu size={28} style={{ color: themeColor }} className="drop-shadow-[0_0_8px_currentColor]" />
                                Payload Data
                            </h3>
                            <div className="flex bg-black p-1 border border-white/10" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                                <button
                                    onClick={() => setActiveTab('structured')}
                                    className={`px-6 py-2.5 text-[10px] font-black font-mono uppercase tracking-[0.2em] transition-all ${
                                        activeTab === 'structured' 
                                            ? 'bg-white/10 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] border border-white/5' 
                                            : 'text-gray-600 hover:text-gray-300'
                                    }`}
                                >
                                    Visualizer
                                </button>
                                <button
                                    onClick={() => setActiveTab('raw')}
                                    className={`px-6 py-2.5 text-[10px] font-black font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                                        activeTab === 'raw' 
                                            ? 'bg-white/10 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] border border-white/5' 
                                            : 'text-gray-600 hover:text-gray-300'
                                    }`}
                                >
                                    <Terminal size={12} /> JSON Dump
                                </button>
                            </div>
                        </div>

                        <div className="min-h-[300px]">
                            {activeTab === 'structured' ? (
                                renderStructuredData(alert.metadata)
                            ) : (
                                <div className="relative animate-in fade-in zoom-in-95 duration-300">
                                    <div className="absolute top-0 right-0 bg-[#00f3ff]/10 text-[#00f3ff] text-[10px] font-mono font-black uppercase tracking-widest px-4 py-1.5 border-b border-l border-[#00f3ff]/20 z-10">
                                        Raw__Binary_Feed
                                    </div>
                                    <pre className="overflow-x-auto bg-[#050505] p-6 text-[11px] text-[#00ff88] font-mono leading-[1.8] border border-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,1)] custom-scrollbar">
                                        {JSON.stringify(alert.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                    {/* Tactical Response (BULK) */}
                    <div className="bg-black/90 p-8 relative overflow-hidden border shadow-2xl"
                         style={{ borderColor: `${themeColor}40`, clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}>
                        
                        {/* Background warning stripes */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" 
                             style={{ background: `repeating-linear-gradient(45deg, ${themeColor}, ${themeColor} 10px, transparent 10px, transparent 20px)` }} />
                        
                        <h3 className="mb-3 text-2xl font-black italic tracking-[0.2em] font-mono text-white flex items-center gap-3 relative z-10">
                            <Crosshair size={24} style={{ color: themeColor }} className="animate-[spin_4s_linear_infinite]" />
                            Tactical Ops
                        </h3>
                        
                        <div className="flex flex-col gap-1 mb-8 pb-4 border-b border-white/10 relative z-10">
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-mono font-bold">
                                Target Cluster: <span className="text-white">{relatedAlerts.length} Events</span>
                            </p>
                            {activeAlerts.length > 0 ? (
                                <p className="text-[10px] uppercase font-mono tracking-widest text-[#ff003c] animate-pulse">
                                    {activeAlerts.length} pending resolution
                                </p>
                            ) : (
                                <p className="text-[10px] uppercase font-mono tracking-widest text-[#00ff88]">
                                    Cluster fully neutralized
                                </p>
                            )}
                        </div>

                        {activeAlerts.length > 0 ? (
                            <div className="space-y-4 relative z-10">
                                <button
                                    onClick={() => handleExecuteBulkAction('BLOCK_IP', alert.metadata?.ip || 'UNKNOWN_IP')}
                                    disabled={actionLoading}
                                    className="w-full relative group overflow-hidden border bg-black py-4 text-[12px] font-black uppercase tracking-[0.2em] font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
                                    style={{ borderColor: '#ff003c', color: '#ff003c' }}
                                >
                                    <div className="absolute inset-0 bg-[#ff003c]/20 -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-300" />
                                    <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-[0_0_5px_currentColor]">
                                        <Server size={18} /> Bulk Block IP
                                    </span>
                                </button>
                                
                                <button
                                    onClick={() => handleExecuteBulkAction('DISABLE_USER', alert.metadata?.email || alert.metadata?.user_id || 'UNKNOWN_USER')}
                                    disabled={actionLoading}
                                    className="w-full relative group overflow-hidden border bg-black py-4 text-[12px] font-black uppercase tracking-[0.2em] font-mono transition-all disabled:opacity-50 text-center"
                                    style={{ borderColor: '#ff9900', color: '#ff9900' }}
                                >
                                    <div className="absolute inset-0 bg-[#ff9900]/20 -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-300" />
                                    <span className="relative z-10 drop-shadow-[0_0_5px_currentColor]">Isolate User Node</span>
                                </button>
                                
                                <button
                                    onClick={() => handleExecuteBulkAction('NOTIFY_ADMIN', 'SECURITY_OFFICER')}
                                    disabled={actionLoading}
                                    className="w-full relative group overflow-hidden border bg-black py-4 text-[12px] font-black uppercase tracking-[0.2em] font-mono transition-all disabled:opacity-50 text-center"
                                    style={{ borderColor: '#00f3ff', color: '#00f3ff' }}
                                >
                                    <div className="absolute inset-0 bg-[#00f3ff]/20 -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-300" />
                                    <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-[0_0_5px_currentColor]">
                                        <Send size={18} /> Escalate Cluster
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <div className="border border-dashed border-[#00ff88]/40 bg-[#00ff88]/5 p-8 text-center" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                                <CheckCircle size={48} className="mx-auto text-[#00ff88] mb-4 drop-shadow-[0_0_10px_currentColor]" />
                                <p className="text-[14px] text-[#00ff88] uppercase font-black font-mono tracking-[0.2em]">
                                    Cluster Mitigated
                                </p>
                                <p className="text-[10px] text-[#00ff88]/60 mt-3 font-mono tracking-widest uppercase">
                                    All events in this signature block have been resolved.
                                </p>
                            </div>
                        )}

                        {actionResult && (
                            <div className={`mt-6 p-5 text-[10px] font-black font-mono uppercase tracking-[0.2em] flex items-start gap-4 animate-in fade-in slide-in-from-top-2 border ${
                                actionResult.success 
                                    ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/40 shadow-[0_0_20px_rgba(0,255,136,0.15)]' 
                                    : 'bg-[#ff003c]/10 text-[#ff003c] border-[#ff003c]/40 shadow-[0_0_20px_rgba(255,0,60,0.15)]'
                            }`} style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                                {actionResult.success ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 animate-pulse mt-0.5" />}
                                <span className="leading-relaxed text-[#00ff88] break-words">{actionResult.message}</span>
                            </div>
                        )}
                    </div>

                    {/* Clustered Events List */}
                    <div className="bg-black/80 border border-white/5 relative p-6 shadow-xl" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                        <h3 className="mb-5 text-[14px] font-black font-mono uppercase tracking-[0.2em] text-gray-300 border-b border-white/10 pb-4 flex justify-between items-center">
                            <span>Bundled Logs</span>
                            <span className="text-[10px] bg-white/10 px-2 py-1">{relatedAlerts.length} total</span>
                        </h3>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {relatedAlerts.map(a => (
                                <div key={a.id} className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/5 hover:border-white/20 transition-colors group">
                                    <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                                        <span>ID: {a.id.slice(0, 8)}</span>
                                        <span className={`px-2 py-0.5 border ${a.status === 'RESOLVED' ? 'border-[#00ff88]/50 text-[#00ff88]' : 'border-[#ff003c]/50 text-[#ff003c] animate-pulse'}`}>
                                            {a.status === 'RESOLVED' ? 'CLR' : 'ACT'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-mono text-gray-500">
                                        <span className="truncate w-32">{a.metadata?.ip || 'N/A'}</span>
                                        <span>{new Date(a.created_at).toLocaleTimeString('en-GB')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertDetails;
