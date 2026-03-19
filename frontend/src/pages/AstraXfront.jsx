import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Zap, Square, RotateCcw, Terminal, Wifi, WifiOff,
    Shield, Activity, Crosshair, ChevronRight, AlertTriangle, CheckCircle
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ATTACK PAYLOAD PROFILES
// Each profile returns the 36 ML features for a given attackType + severityProfile
// ─────────────────────────────────────────────────────────────────────────────
const SECTORS = ['healthcare', 'agriculture', 'urban'];

const ATTACK_TYPES = [
    { id: 'DDoS',       label: 'DDoS',        color: '#ff003c', icon: '💥', desc: 'Distributed Denial of Service' },
    { id: 'BruteForce', label: 'Brute Force',  color: '#ff6b00', icon: '🔑', desc: 'Credential stuffing / Login flood' },
    { id: 'Ransomware', label: 'Ransomware',   color: '#ff003c', icon: '🔒', desc: 'File encryption & extortion' },
    { id: 'MITM',       label: 'MITM',         color: '#ffd700', icon: '👁️', desc: 'Man-in-the-Middle interception' },
    { id: 'Phishing',   label: 'Phishing',     color: '#ff6b00', icon: '🎣', desc: 'Social engineering / Credential theft' },
    { id: 'Normal',     label: 'Normal',       color: '#00f3ff', icon: '✅', desc: 'Benign baseline traffic' },
];

function buildPayload(attackType, sector, severityProfile) {
    // Base Normal traffic payload explicitly mapping to the `Normal` definition.
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
            Injection:  { packet_count: 50, http_response_code_404: 80, api_request_count: 500, user_agent_missing: 1, referrer_missing: 1, suspicious_keyword_count: 20, packets_per_second: 150 },
            Normal:     {}
        },
        Medium: {
            DDoS:       { packet_count: 10000, syn_packet_count: 8000, syn_ack_ratio: 0.4 },
            MITM:       { packet_count: 50, arp_request_rate: 5 },
            Ransomware: { packet_count: 50, file_modification_rate: 15, cpu_usage_spike: 30 },
            BruteForce: { packet_count: 50, failed_login_count: 50, login_attempts: 100 },
            Phishing:   { packet_count: 50, url_length: 150, suspicious_keyword_count: 2, domain_age: 200 },
            Injection:  { packet_count: 50, http_response_code_404: 40, api_request_count: 250, user_agent_missing: 1 },
            Normal:     {}
        },
        Low: {
            DDoS:       { packet_count: 1000, syn_packet_count: 500 },
            BruteForce: { packet_count: 50, failed_login_count: 3, login_attempts: 5 },
            Phishing:   { packet_count: 50, url_length: 60, domain_age: 500 },
            MITM:       {},
            Ransomware: {},
            Injection:  {},
            Normal:     {}
        }
    };

    const severityDict = overrides[severityProfile] || overrides['Low'];
    const specificOverrides = severityDict[attackType] || {};

    return { ...base, ...specificOverrides };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEVERITY BADGE
// ─────────────────────────────────────────────────────────────────────────────
const SEV_COLORS = { High: '#ff003c', Medium: '#ffd700', Low: '#00f3ff', null: '#888' };

// ─────────────────────────────────────────────────────────────────────────────
// LOG LEVEL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const LOG_COLORS = { info: '#00f3ff', error: '#ff003c', warn: '#ffd700', success: '#00ff88' };

function LogLine({ entry }) {
    const col = LOG_COLORS[entry.level] || '#00f3ff';
    const time = new Date(entry.ts).toLocaleTimeString('en-US', { hour12: false });
    return (
        <div style={{ color: col, fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.7', wordBreak: 'break-all' }}>
            <span style={{ opacity: 0.5 }}>[{time}] </span>
            {entry.message}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
// If VITE_API_URL includes `/api` (e.g., http://localhost:5001/api), we should not append `/api` again.
// To perfectly handle both cases, we strip any trailing `/api` from the env var.
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

export default function AstraXfront() {
    // Config state
    const [attackType,      setAttackType]      = useState('DDoS');
    const [sector,          setSector]          = useState('healthcare');
    const [severityProfile, setSeverityProfile] = useState('High');
    const [eventsPerMin,    setEventsPerMin]    = useState(10);
    const [totalBursts,     setTotalBursts]     = useState(20);

    // Run state
    const [running,  setRunning]  = useState(false);
    const [sent,     setSent]     = useState(0);
    const [failed,   setFailed]   = useState(0);
    const [lastResult, setLastResult] = useState(null);

    // Log stream state
    const [logs,       setLogs]       = useState([]);
    const [sseStatus,  setSseStatus]  = useState('disconnected'); // 'connected' | 'disconnected' | 'error'

    const intervalRef  = useRef(null);
    const logEndRef    = useRef(null);
    const eventSrcRef  = useRef(null);
    const sentCountRef = useRef(0);  // shadow ref so interval always sees fresh value

    // ── Auto-scroll logs ──────────────────────────────────────────────────
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // ── SSE — connect on mount ────────────────────────────────────────────
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
                    return next.length > 300 ? next.slice(-300) : next; // cap at 300 lines
                });
            } catch (_) {}
        };

        es.onerror = () => {
            setSseStatus('error');
            es.close();
            // Retry after 3s
            setTimeout(connectSSE, 3000);
        };
    };

    // ── Fire events (Single or Distributed) ────────────────────────────────
    const fireEvent = useCallback(async () => {
        const features = buildPayload(attackType, sector, severityProfile);
        const countToFire = 1;
        
        for (let i = 0; i < countToFire; i++) {
            if (sentCountRef.current >= totalBursts) break;
            
            const reqIp = `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
            sentCountRef.current += 1; // Increment immediately to prevent race conditions
            
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
                setLastResult({ ok: true, eventId: data.eventId });
            }).catch(err => {
                setFailed(f => f + 1);
                setLastResult({ ok: false, msg: err.message });
            });
        }
    }, [attackType, sector, severityProfile, totalBursts]);

    // ── Launch / Stop ─────────────────────────────────────────────────────
    const launch = useCallback(() => {
        setSent(0);
        setFailed(0);
        sentCountRef.current = 0;
        setRunning(true);

        const intervalMs = Math.round(60000 / eventsPerMin);

        // Fire first event immediately
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

    // ── Derived ───────────────────────────────────────────────────────────
    const progress     = totalBursts > 0 ? Math.min((sent / totalBursts) * 100, 100) : 0;
    const selectedAtk  = ATTACK_TYPES.find(a => a.id === attackType) || ATTACK_TYPES[0];
    const atkColor     = selectedAtk.color;

    // stop automatically when done
    useEffect(() => {
        if (running && sent >= totalBursts) stop();
    }, [sent, totalBursts, running, stop]);

    // ─────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#020204] text-white p-4 md:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* ── Header ── */}
            <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ff003c]/30 bg-[#ff003c]/10 shadow-[0_0_20px_rgba(255,0,60,0.3)]">
                    <Crosshair size={24} style={{ color: '#ff003c' }} />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-[0.2em] uppercase" style={{ color: '#ff003c', textShadow: '0 0 20px rgba(255,0,60,0.5)' }}>
                        AstraX<span className="text-white">front</span>
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mt-0.5">
                        Cyber Attack Simulator · KavachX Red Team Module
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {sseStatus === 'connected'
                        ? <><Wifi size={14} className="text-green-400" /><span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Log Stream Live</span></>
                        : sseStatus === 'error'
                        ? <><WifiOff size={14} className="text-red-400" /><span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Stream Error · Retrying</span></>
                        : <><WifiOff size={14} className="text-gray-500" /><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Connecting...</span></>
                    }
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">

                {/* ════════ LEFT COLUMN ════════ */}
                <div className="space-y-5">

                    {/* ── Attack Type Grid ── */}
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">① Select Attack Class</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ATTACK_TYPES.map(atk => (
                                <button
                                    key={atk.id}
                                    onClick={() => setAttackType(atk.id)}
                                    className="relative rounded-xl p-3 text-left transition-all border"
                                    style={{
                                        borderColor:   attackType === atk.id ? atk.color : 'rgba(255,255,255,0.05)',
                                        background:    attackType === atk.id ? `${atk.color}18` : 'rgba(255,255,255,0.02)',
                                        boxShadow:     attackType === atk.id ? `0 0 15px ${atk.color}40` : 'none',
                                    }}
                                >
                                    <span className="text-xl">{atk.icon}</span>
                                    <p className="mt-1 text-[11px] font-black uppercase tracking-wider" style={{ color: attackType === atk.id ? atk.color : '#888' }}>{atk.label}</p>
                                    <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">{atk.desc}</p>
                                    {attackType === atk.id && (
                                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full animate-pulse" style={{ background: atk.color }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Sector + Severity + Rate ── */}
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">② Configure Parameters</p>

                        {/* Sector */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Target Sector</p>
                            <div className="flex gap-2">
                                {SECTORS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSector(s)}
                                        className="flex-1 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-wider transition-all border"
                                        style={{
                                            borderColor: sector === s ? '#00f3ff' : 'rgba(255,255,255,0.08)',
                                            background:  sector === s ? 'rgba(0,243,255,0.1)' : 'transparent',
                                            color:       sector === s ? '#00f3ff' : '#666',
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Severity Profile */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Severity Profile (scales ML features)</p>
                            <div className="flex gap-2">
                                {['High', 'Medium', 'Low'].map(sv => (
                                    <button
                                        key={sv}
                                        onClick={() => setSeverityProfile(sv)}
                                        className="flex-1 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-wider transition-all border"
                                        style={{
                                            borderColor: severityProfile === sv ? SEV_COLORS[sv] : 'rgba(255,255,255,0.08)',
                                            background:  severityProfile === sv ? `${SEV_COLORS[sv]}18` : 'transparent',
                                            color:       severityProfile === sv ? SEV_COLORS[sv] : '#666',
                                            boxShadow:   severityProfile === sv ? `0 0 12px ${SEV_COLORS[sv]}40` : 'none',
                                        }}
                                    >
                                        {sv}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rate slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Events / minute</p>
                                <span className="text-[12px] font-black text-white">{eventsPerMin} <span className="text-gray-500 font-normal">/ min</span></span>
                            </div>
                            <input
                                type="range" min="1" max="120" value={eventsPerMin}
                                onChange={e => setEventsPerMin(Number(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                style={{ accentColor: atkColor }}
                            />
                            <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                                <span>1/min</span><span>30/min</span><span>60/min</span><span>120/min</span>
                            </div>
                        </div>

                        {/* Total bursts */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Bursts</p>
                            <div className="flex gap-2 flex-wrap">
                                {[5, 10, 20, 30, 50, 100].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setTotalBursts(n)}
                                        className="rounded-lg px-4 py-2 text-[11px] font-black transition-all border"
                                        style={{
                                            borderColor: totalBursts === n ? atkColor : 'rgba(255,255,255,0.08)',
                                            background:  totalBursts === n ? `${atkColor}18` : 'transparent',
                                            color:       totalBursts === n ? atkColor : '#666',
                                        }}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <input
                                    type="number" min="1" max="500"
                                    value={totalBursts}
                                    onChange={e => setTotalBursts(Math.max(1, Math.min(500, Number(e.target.value))))}
                                    className="w-20 rounded-lg px-3 py-2 text-[11px] font-black text-center bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Fire Controls ── */}
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">③ Fire Controls</p>

                        {/* Progress bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] mb-1.5">
                                <span className="text-gray-400">Progress</span>
                                <span style={{ color: atkColor }} className="font-black">{sent} / {totalBursts} events</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${atkColor}, ${atkColor}80)`, boxShadow: `0 0 8px ${atkColor}` }}
                                />
                            </div>
                            {failed > 0 && (
                                <p className="text-[10px] text-red-400 mt-1">⚠ {failed} events failed — is the backend running?</p>
                            )}
                        </div>

                        {/* Status badge */}
                        {lastResult && (
                            <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold" style={{
                                background: lastResult.ok ? 'rgba(0,255,136,0.08)' : 'rgba(255,0,60,0.08)',
                                border:     `1px solid ${lastResult.ok ? 'rgba(0,255,136,0.2)' : 'rgba(255,0,60,0.2)'}`,
                                color:      lastResult.ok ? '#00ff88' : '#ff003c',
                            }}>
                                {lastResult.ok
                                    ? <><CheckCircle size={13} /> Event #{sent} queued · ID {lastResult.eventId}</>
                                    : <><AlertTriangle size={13} /> Failed: {lastResult.msg}</>
                                }
                            </div>
                        )}

                        <div className="flex gap-3">
                            {!running ? (
                                <button
                                    onClick={launch}
                                    disabled={running}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 text-[12px] font-black uppercase tracking-widest transition-all active:scale-95"
                                    style={{
                                        background:  `linear-gradient(135deg, ${atkColor}cc, ${atkColor}66)`,
                                        border:      `1px solid ${atkColor}`,
                                        boxShadow:   `0 0 25px ${atkColor}60`,
                                        color:       '#fff',
                                    }}
                                >
                                    <Zap size={18} />
                                    Launch Attack
                                </button>
                            ) : (
                                <button
                                    onClick={stop}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 border border-[#ff003c]/50 hover:border-[#ff003c] bg-[#ff003c]/10 hover:bg-[#ff003c]/20"
                                    style={{ color: '#ff003c' }}
                                >
                                    <Square size={18} />
                                    Stop
                                </button>
                            )}
                            <button
                                onClick={reset}
                                className="rounded-xl px-5 py-4 text-[12px] font-black uppercase tracking-widest transition-all border border-white/10 hover:border-white/20 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
                                title="Reset counters"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>

                        {/* Interval info */}
                        <p className="text-center text-[9px] text-gray-600 mt-3 uppercase tracking-wider">
                            Interval: {Math.round(60000 / eventsPerMin)}ms · Target: {eventsPerMin}/min · {totalBursts} total
                        </p>
                    </div>
                </div>

                {/* ════════ RIGHT COLUMN — Log Terminal ════════ */}
                <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] flex flex-col overflow-hidden" style={{ minHeight: '600px', maxHeight: '85vh' }}>
                    {/* Terminal header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/[0.02] shrink-0">
                        <Terminal size={15} className="text-[#00f3ff]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00f3ff]">Backend Log Stream</span>
                        <span className="ml-auto text-[9px] text-gray-600">{logs.length} lines</span>
                        <button onClick={clearLogs} className="text-[9px] text-gray-600 hover:text-gray-400 uppercase tracking-wider transition-colors">clear</button>
                    </div>

                    {/* Dot row */}
                    <div className="flex gap-1.5 px-4 pt-2 shrink-0">
                        <div className="h-3 w-3 rounded-full bg-[#ff003c]/60" />
                        <div className="h-3 w-3 rounded-full bg-[#ffd700]/60" />
                        <div className="h-3 w-3 rounded-full bg-[#00ff88]/60" />
                    </div>

                    {/* Log body */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-700">
                                <Activity size={28} className="mb-3 animate-pulse" />
                                <p className="text-[11px] uppercase tracking-wider">Waiting for backend logs…</p>
                                <p className="text-[10px] mt-1">Launch an attack to see live output</p>
                            </div>
                        ) : (
                            logs.map((entry, i) => <LogLine key={i} entry={entry} />)
                        )}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>

            {/* ── Payload Preview ── */}
            <details className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <summary className="px-5 py-3 cursor-pointer text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-gray-300 flex items-center gap-2 transition-colors">
                    <ChevronRight size={14} />
                    ML Feature Payload Preview — {attackType} · {severityProfile}
                </summary>
                <div className="px-5 pb-4">
                    <pre className="text-[10px] text-green-400 overflow-x-auto leading-relaxed" style={{ fontFamily: 'monospace' }}>
                        {JSON.stringify(buildPayload(attackType, sector, severityProfile), null, 2)}
                    </pre>
                </div>
            </details>
        </div>
    );
}
