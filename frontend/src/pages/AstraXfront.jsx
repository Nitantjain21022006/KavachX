import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Zap, Square, RotateCcw, Terminal, Wifi, WifiOff,
    Shield, Activity, Crosshair, ChevronRight, AlertTriangle, CheckCircle,
    Target, Cpu, Network, Database, Lock, Eye, Fish, Settings as SettingsIcon,
    ArrowRight, Maximize2, Trash2
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK PAYLOAD PROFILES
// ─────────────────────────────────────────────────────────────────────────────
const SECTORS = ['healthcare', 'agriculture', 'urban'];

const ATTACK_TYPES = [
    { id: 'DDoS',       label: 'DDoS',        color: '#ff003c', icon: <Zap size={22}/>, desc: 'Distributed Denial of Service', longDesc: 'Flood the target with high-volume SYNC packets to exhaust resources.' },
    { id: 'BruteForce', label: 'Brute Force',  color: '#ff6b00', icon: <Lock size={22}/>, desc: 'Credential Stuffing', longDesc: 'Automated trial-and-error login attempts to breach authentication layers.' },
    { id: 'Ransomware', label: 'Ransomware',   color: '#ff003c', icon: <Database size={22}/>, desc: 'File Encryption', longDesc: 'Encrypt sensitive data and demand ransom for decryption keys.' },
    { id: 'MITM',       label: 'MITM',         color: '#ffd700', icon: <Eye size={22}/>, desc: 'Man-in-the-Middle', longDesc: 'Interception of live data traffic between two authorized communication nodes.' },
    { id: 'Phishing',   label: 'Phishing',     color: '#ff6b00', icon: <Fish size={22}/>, desc: 'Social Engineering', longDesc: 'Craft deceptive communications to steal sensitive user credentials.' },
    { id: 'Normal',     label: 'Normal',       color: '#00f3ff', icon: <CheckCircle size={22}/>, desc: 'Benign Traffic', longDesc: 'Simulate legitimate baseline network traffic for calibration.' },
];

function buildPayload(attackType, sector, severityProfile) {
    const base = {
        packet_count: 40, byte_count: 5000, syn_packet_count: 5,
        syn_ack_ratio: 0.8, unique_source_ips: 2, unique_destination_ips: 5,
        packets_per_second: 10, failed_login_count: 0, login_attempts: 1,
        ssl_certificate_valid: 1, certificate_mismatch: 0,
        arp_request_rate: 2, mac_change_rate: 0, duplicate_ip_detected: 0,
        url_length: 25, suspicious_keyword_count: 0, domain_age: 1000,
        redirect_count: 0, file_modification_rate: 5, file_rename_count: 1,
        file_extension_change: 0, registry_modification_rate: 1,
        cpu_usage_spike: 10, disk_write_rate: 20, api_request_count: 5,
        http_response_code_200: 100, http_response_code_404: 0,
        user_agent_missing: 0, referrer_missing: 0,
        cookie_count: 5, session_duration: 1200,
        process_count: 40, thread_count: 100, memory_usage_mb: 2048,
        network_io_rate: 50, system_up_time: 7200,
    };

    const overrides = {
        High: {
            DDoS:       { packet_count: 50000, syn_packet_count: 45000, syn_ack_ratio: 0.05, unique_source_ips: 1000 },
            BruteForce: { packet_count: 50, failed_login_count: 490, login_attempts: 500 },
            MITM:       { packet_count: 50, ssl_certificate_valid: 0, certificate_mismatch: 1, arp_request_rate: 100, mac_change_rate: 1, duplicate_ip_detected: 1 },
            Phishing:   { packet_count: 50, url_length: 400, suspicious_keyword_count: 8, domain_age: 5 },
            Ransomware: { packet_count: 50, file_modification_rate: 1000, file_rename_count: 900, file_extension_change: 1, cpu_usage_spike: 98, disk_write_rate: 500 },
            Normal:     {}
        },
        Medium: {
            DDoS:       { packet_count: 10000, syn_packet_count: 8000, syn_ack_ratio: 0.4 },
            MITM:       { packet_count: 50, arp_request_rate: 5 },
            Ransomware: { packet_count: 50, file_modification_rate: 15, cpu_usage_spike: 30 },
            BruteForce: { packet_count: 50, failed_login_count: 50, login_attempts: 100 },
            Phishing:   { packet_count: 50, url_length: 150, suspicious_keyword_count: 2, domain_age: 200 },
            Normal:     {}
        },
        Low: {
            DDoS:       { packet_count: 1000, syn_packet_count: 500 },
            BruteForce: { packet_count: 50, failed_login_count: 3, login_attempts: 5 },
            Phishing:   { packet_count: 50, url_length: 60, domain_age: 500 },
            MITM:       {}, Ransomware: {}, Normal:     {}
        }
    };

    const severityDict = overrides[severityProfile] || overrides['Low'];
    const specificOverrides = severityDict[attackType] || {};

    return { ...base, ...specificOverrides };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const SEV_COLORS = { High: '#ff003c', Medium: '#ffd700', Low: '#00f3ff', null: '#888' };
const LOG_COLORS = { info: '#00f3ff', error: '#ff003c', warn: '#ffd700', success: '#39ff14' };

function LogLine({ entry }) {
    const col = LOG_COLORS[entry.level] || '#00f3ff';
    const time = new Date(entry.ts).toLocaleTimeString('en-US', { hour12: false });
    return (
        <div className="flex gap-2 py-0.5 border-b border-white/[0.03] last:border-0 group hover:bg-white/[0.02] transition-colors">
            <span className="opacity-30 text-[9px] font-mono shrink-0">[{time}]</span>
            <span className="opacity-50 text-[9px] font-bold uppercase shrink-0 w-12" style={{ color: col }}>{entry.level}</span>
            <span className="text-[10px] font-mono tracking-tight break-all leading-relaxed" style={{ color: col }}>{entry.message}</span>
        </div>
    );
}

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

export default function AstraXfront() {
    const [attackType,      setAttackType]      = useState('DDoS');
    const [sector,          setSector]          = useState('healthcare');
    const [severityProfile, setSeverityProfile] = useState('High');
    const [eventsPerMin,    setEventsPerMin]    = useState(20);
    const [totalBursts,     setTotalBursts]     = useState(20);

    const [running,  setRunning]  = useState(false);
    const [sent,     setSent]     = useState(0);
    const [failed,   setFailed]   = useState(0);
    const [lastResult, setLastResult] = useState(null);

    const [logs,       setLogs]       = useState([]);
    const [sseStatus,  setSseStatus]  = useState('disconnected');
    const [isConsoleMin, setIsConsoleMin] = useState(false);

    const intervalRef  = useRef(null);
    const logEndRef    = useRef(null);
    const eventSrcRef  = useRef(null);
    const sentCountRef = useRef(0);

    useEffect(() => {
        if (!isConsoleMin) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, isConsoleMin]);

    useEffect(() => {
        connectSSE();
        return () => { eventSrcRef.current?.close(); };
    }, []);

    const connectSSE = () => {
        setSseStatus('disconnected');
        const es = new EventSource(`${BACKEND_URL}/api/simulator/logs`);
        eventSrcRef.current = es;
        es.onopen = () => setSseStatus('connected');
        es.onmessage = (e) => {
            try {
                const entry = JSON.parse(e.data);
                setLogs(prev => {
                    const next = [...prev, entry];
                    return next.length > 500 ? next.slice(-500) : next;
                });
            } catch (_) {}
        };
        es.onerror = () => {
            setSseStatus('error');
            es.close();
            setTimeout(connectSSE, 3000);
        };
    };

    const fireEvent = useCallback(async () => {
        const features = buildPayload(attackType, sector, severityProfile);
        if (sentCountRef.current >= totalBursts) return;
        
        const reqIp = `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
        sentCountRef.current += 1;
        
        setLastResult({ ok: true, status: 'INGESTING', ip: reqIp });

        fetch(`${BACKEND_URL}/api/events/ingest`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sector,
                type: `ASTRAX_${attackType.toUpperCase()}_SIMULATION`,
                metadata: {
                    ...features,
                    ip: reqIp,
                    simulation: true,
                    severity_profile: severityProfile,
                    source: 'AstraXfront'
                }
            })
        }).then(async (res) => {
            const data = await res.json();
            setSent(s => s + 1);
            setLastResult({ ok: true, eventId: data.eventId, status: 'CAPTURED', ip: reqIp });
        }).catch(err => {
            setFailed(f => f + 1);
            setLastResult({ ok: false, msg: err.message, status: 'DROPPED', ip: reqIp });
        });
    }, [attackType, sector, severityProfile, totalBursts]);

    const launch = useCallback(() => {
        setSent(0);
        setFailed(0);
        sentCountRef.current = 0;
        setRunning(true);
        const intervalMs = Math.round(60000 / eventsPerMin);
        fireEvent();
        intervalRef.current = setInterval(() => {
            if (sentCountRef.current >= totalBursts) {
                stop();
                return;
            }
            fireEvent();
        }, intervalMs);
    }, [eventsPerMin, totalBursts, fireEvent]);

    const stop = useCallback(() => {
        clearInterval(intervalRef.current);
        setRunning(false);
    }, []);

    const reset = useCallback(() => {
        stop();
        setSent(0);
        setFailed(0);
        setLastResult(null);
    }, [stop]);

    const clearLogs = () => setLogs([]);

    const progress = totalBursts > 0 ? Math.min((sent / totalBursts) * 100, 100) : 0;
    const currentAtk = ATTACK_TYPES.find(a => a.id === attackType) || ATTACK_TYPES[0];

    return (
        <div className="min-h-screen bg-[#020204] text-white flex flex-col relative overflow-hidden font-inter selection:bg-red-500/30">
            {/* ── BACKGROUND LAYER (Dots & Scanline from Settings) ── */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ff003c]/10 shadow-[0_0_15px_#ff003c] animate-scan-slow opacity-20" />
                <div className="absolute inset-0 opacity-[0.1] animate-grid-drift" 
                     style={{ backgroundImage: `radial-gradient(${currentAtk.color} 1.5px, transparent 1.5px)`, backgroundSize: '40px 40px' }} />
            </div>

            {/* ── HEADER ── */}
            <header className="z-10 px-6 py-5 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(255,0,60,0.2)]">
                        <Crosshair size={20} className="text-[#ff003c] animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-[0.2em] uppercase flex items-center gap-2">
                            AstraX<span className="text-red-500 font-bold opacity-80">Front</span>
                        </h1>
                        <p className="text-[9px] uppercase tracking-[0.4em] text-gray-500 font-black">Strategic Red Team Operations Cluster</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${sseStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Log Downlink: <span className={sseStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>{sseStatus}</span>
                            </span>
                        </div>
                        <span className="text-[8px] text-gray-600 uppercase tracking-widest mt-1">Encrypted SOC Session ID: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <button className="h-9 w-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-white/30 transition-all text-gray-400 hover:text-white">
                        <SettingsIcon size={16} />
                    </button>
                </div>
            </header>

            {/* ── MAIN SOC CONTENT ── */}
            <main className="z-10 flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] overflow-hidden bg-white/[0.01]">
                
                {/* ════ PARAMETER CONTROL SIDEBAR ════ */}
                <aside className="border-r border-white/5 p-6 flex flex-col gap-6 overflow-y-auto bg-black/20">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu size={14} className="text-red-500" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Operation Parameters</h2>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Sector Selection */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Target Sector Infrastructure</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {SECTORS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSector(s)}
                                            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                                                sector === s ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-white/[0.02] border-white/5 text-gray-600 hover:border-white/20'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Network size={14} className={sector === s ? 'text-cyan-400' : 'text-gray-600'} />
                                                {s} Domain
                                            </span>
                                            {sector === s && <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Severity Profile */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-1">Threat Intensity Level</label>
                                <div className="flex gap-2">
                                    {['High', 'Medium', 'Low'].map(sv => (
                                        <button
                                            key={sv}
                                            onClick={() => setSeverityProfile(sv)}
                                            className={`flex-1 py-10 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all group ${
                                                severityProfile === sv 
                                                ? 'bg-white/[0.03]' 
                                                : 'bg-transparent border-white/5 opacity-40 grayscale hover:opacity-100'
                                            }`}
                                            style={{ borderColor: severityProfile === sv ? SEV_COLORS[sv] : 'transparent' }}
                                        >
                                            <div className="h-6 w-6 rounded-md border flex items-center justify-center mb-1 transition-transform group-hover:scale-110" 
                                                 style={{ borderColor: `${SEV_COLORS[sv]}40`, background: `${SEV_COLORS[sv]}10`, color: SEV_COLORS[sv] }}>
                                                <Shield size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: SEV_COLORS[sv] }}>{sv}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sliders */}
                            <div className="space-y-6 bg-white/[0.02] rounded-2xl p-5 border border-white/5 shadow-inner">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Injection Velocity</p>
                                        <span className="text-[12px] font-black text-white">{eventsPerMin} <span className="opacity-30 text-[9px]">Hz</span></span>
                                    </div>
                                    <input
                                        type="range" min="1" max="150" value={eventsPerMin}
                                        onChange={e => setEventsPerMin(Number(e.target.value))}
                                        className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-red-500"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Burst Capacity</p>
                                        <span className="text-[12px] font-black text-white">{totalBursts} <span className="opacity-30 text-[9px]">Pkt</span></span>
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {[10, 20, 50, 100, 200, 500].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setTotalBursts(n)}
                                                className={`px-3 py-1.5 rounded-md text-[10px] font-black border transition-all ${
                                                    totalBursts === n ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-white/5 bg-black/40 text-gray-500'
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 relative bg-[#050505]/50 -mx-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Operation Status</span>
                            <span className="text-[9px] font-mono opacity-50">{progress.toFixed(0)}%</span>
                        </div>
                        
                        <div className="h-1.5 w-full bg-white/5 rounded-full mb-6 overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-red-500 shadow-[0_0_10px_#ef4444] transition-all duration-700 ease-out" 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {!running ? (
                                <button
                                    onClick={launch}
                                    className="col-span-2 group relative h-16 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                                >
                                    <Zap size={18} className="transition-transform group-hover:scale-125 group-hover:rotate-12" />
                                    Launch Operation
                                </button>
                            ) : (
                                <button
                                    onClick={stop}
                                    className="col-span-2 relative h-16 rounded-xl bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500/10 font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all"
                                >
                                    <Square size={18} />
                                    Abort Attack
                                </button>
                            )}
                            <button
                                onClick={reset}
                                className="h-12 rounded-xl bg-white/[0.03] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button
                                onClick={clearLogs}
                                className="h-12 rounded-xl bg-white/[0.03] border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/5 flex items-center justify-center transition-all"
                                title="Purge Telemetry Buffer"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ════ MAIN GRID: ATTACK SELECTION & INTERCEPTOR ════ */}
                <section className="flex flex-col overflow-hidden">
                    
                    {/* Attack Grid */}
                    <div className="p-8 flex-1 overflow-y-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <Target size={18} className="text-gray-400" />
                            <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-gray-200">Select Weaponized Payload Class</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ATTACK_TYPES.map(atk => (
                                <div
                                    key={atk.id}
                                    onClick={() => setAttackType(atk.id)}
                                    className={`relative group cursor-pointer rounded-2xl p-6 border transition-all duration-500 overflow-hidden ${
                                        attackType === atk.id 
                                        ? 'bg-white/[0.03] shadow-2xl scale-[1.02]' 
                                        : 'bg-transparent border-white/5 hover:border-white/20 hover:bg-white/[0.01]'
                                    }`}
                                    style={{ borderColor: attackType === atk.id ? atk.color : '' }}
                                >
                                    {/* Accent background glow */}
                                    {attackType === atk.id && (
                                        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" 
                                             style={{ background: `radial-gradient(circle at top right, ${atk.color} 0%, transparent 70%)` }} />
                                    )}

                                    <div className="relative z-10">
                                        <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300"
                                             style={{ background: `${atk.color}15`, border: `1px solid ${atk.color}40`, color: atk.color }}>
                                            {atk.icon}
                                        </div>
                                        <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2 leading-none flex items-center justify-between">
                                            {atk.label}
                                            {attackType === atk.id && <ArrowRight size={16} className="text-white/20" />}
                                        </h3>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-4">{atk.desc}</p>
                                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium line-clamp-2 italic opacity-60">
                                            "{atk.longDesc}"
                                        </p>
                                    </div>

                                    {/* Bottom indicator */}
                                    <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${attackType === atk.id ? 'w-full' : 'w-0'}`} 
                                         style={{ backgroundColor: atk.color, boxShadow: `0 0 10px ${atk.color}` }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Integrated LOG COMPONENT ("Logical Difference") */}
                    <div className={`transition-all duration-500 ease-in-out px-8 flex flex-col bg-black/40 backdrop-blur-3xl border-t border-white/5 relative ${isConsoleMin ? 'h-16' : 'h-[320px]'}`}>
                        
                        {/* Console Controls */}
                        <div className="flex items-center justify-between py-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <Terminal size={14} className="text-cyan-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Signal Interceptor Downlink</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-[8px] font-mono text-gray-600 ml-4 font-black">TCP://LOCAL-NODE.INFRA.RES/[0.0.0.0]</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-6 px-4 py-1.5 rounded-lg bg-black/60 border border-white/5">
                                    <div className="text-[9px] flex gap-2">
                                        <span className="text-gray-600 font-black uppercase tracking-widest">Sent:</span>
                                        <span className="text-gray-300 font-mono tracking-tight">{sent}</span>
                                    </div>
                                    <div className="text-[9px] flex gap-2">
                                        <span className="text-gray-600 font-black uppercase tracking-widest">Loss:</span>
                                        <span className="text-red-500 font-mono tracking-tight">{failed}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsConsoleMin(!isConsoleMin)}
                                    className="p-1.5 text-gray-500 hover:text-white transition-colors"
                                >
                                    {isConsoleMin ? <Maximize2 size={14}/> : <ChevronRight size={16} className="rotate-90" />}
                                </button>
                            </div>
                        </div>

                        {!isConsoleMin && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-1">
                                {logs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                                        <Activity size={32} className="text-cyan-400 mb-4 animate-pulse" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Cluster Synchronization...</p>
                                    </div>
                                ) : (
                                    logs.map((entry, i) => <LogLine key={i} entry={entry} />)
                                )}
                                <div ref={logEndRef} />
                            </div>
                        )}
                        
                        {/* Dynamic Floating Feedback (HCI: Visibility of System Status) */}
                        {lastResult && (
                            <div className={`absolute -top-12 right-12 z-[100] px-4 py-2 rounded-[0.5rem] shadow-2xl border transition-all duration-300 flex items-center gap-3 bg-black/90 backdrop-blur-xl ${
                                lastResult.ok ? 'border-cyan-500/50 text-cyan-400 shadow-cyan-500/10' : 'border-red-500/50 text-red-500 shadow-red-500/10'
                            }`}>
                                <Activity size={12} className={lastResult.status === 'INGESTING' ? 'animate-spin' : ''} />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none mb-0.5">{lastResult.status}</span>
                                    <span className="text-[8px] font-mono opacity-50 tracking-tight">{lastResult.eventId || lastResult.ip || '...'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* ── FOOTER STATS BAR ── */}
            <footer className="z-10 h-10 px-6 border-t border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between pointer-events-none select-none shrink-0">
                <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Core Frequency</span>
                        <span className="text-[9px] font-mono text-cyan-400 tracking-tighter">4.82 GHZ</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Neural Link</span>
                        <span className="text-[9px] font-mono text-green-400 tracking-tighter">SYNCHRONIZED</span>
                    </div>
                </div>
                <div className="text-[8px] font-black text-gray-700 uppercase tracking-[0.5em]">
                    KavachX Distributed Defensive Grid · v3.0.4-Sim
                </div>
            </footer>
        </div>
    );
}

