import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ShieldCheck, Zap, Activity, AlertTriangle, ArrowUpRight, Download,
    X, ChevronRight, Network, Terminal, Database,
    Eye, Radio, BarChart2, RefreshCw, ShieldAlert, TrendingUp, Clock,
    Lock, Globe
} from 'lucide-react';
import { EventThroughputChart, SeverityDistributionChart, AttackVectorChart, SectorRadarChart, StatusDonutChart } from '../components/Charts';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM TOKENS (HCI Consistency)
// ─────────────────────────────────────────────────────────────────────────────
const DS = {
    // Color semantic tokens
    primary:   '#00f3ff',   // Cyan  — primary actions, live indicators
    danger:    '#ff003c',   // Red   — threats, errors, critical
    success:   '#39ff14',   // Green — resolved, safe, optimal
    warning:   '#ff9900',   // Orange — medium risk, attention
    accent:    '#bc13fe',   // Purple — secondary accent, analytics

    // Border radius consistency
    card:   'rounded-2xl',
    modal:  'rounded-3xl',
    badge:  'rounded-md',
    pill:   'rounded-full',

    // Typography scale (tracking widths)
    label:     'text-[9px] font-black uppercase tracking-[0.25em]',
    sublabel:  'text-[8px] font-bold uppercase tracking-[0.15em]',
    mono:      'font-mono font-black',
    heading:   'text-[11px] font-black uppercase tracking-[0.2em]',
};

// HCI STATUS → colors map
const statusColor = (sys) => sys === 'CRITICAL' ? DS.danger : sys === 'COMPROMISED' ? DS.warning : DS.primary;
const riskColor   = (r)   => r === 'HIGH' ? DS.danger : r === 'MEDIUM' ? DS.warning : DS.success;

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CLOCK
// ─────────────────────────────────────────────────────────────────────────────
const LiveClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return (
        <span className="font-mono text-[#00f3ff] text-xs font-black tracking-widest tabular-nums">
            {time.toLocaleTimeString('en-US', { hour12: false })}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// CYBER BACKGROUND — animated dots grid + corner HUD decorations
// ─────────────────────────────────────────────────────────────────────────────
const CyberBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Animated dot grid */}
        <div
            className="absolute inset-0 opacity-[0.055] animate-grid-drift"
            style={{
                backgroundImage: 'radial-gradient(rgba(0,243,255,1) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
            }}
        />
        {/* Vertical scan line */}
        <div className="cyber-scanline" />
        {/* Top glow bar */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/30 to-transparent" />
        {/* Corner HUD — Top Left */}
        <div className="absolute top-6 left-6 opacity-[0.18]">
            <div className="w-6 h-6 border-t-2 border-l-2 border-[#00f3ff] rounded-tl-sm" />
        </div>
        {/* Corner HUD — Top Right */}
        <div className="absolute top-6 right-6 opacity-[0.18]">
            <div className="w-6 h-6 border-t-2 border-r-2 border-[#00f3ff] rounded-tr-sm" />
        </div>
        {/* Corner HUD — Bottom Left */}
        <div className="absolute bottom-6 left-6 opacity-[0.12]">
            <div className="w-6 h-6 border-b-2 border-l-2 border-[#bc13fe] rounded-bl-sm" />
        </div>
        {/* Corner HUD — Bottom Right */}
        <div className="absolute bottom-6 right-6 opacity-[0.12]">
            <div className="w-6 h-6 border-b-2 border-r-2 border-[#bc13fe] rounded-br-sm" />
        </div>
        {/* Radial center glow */}
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] opacity-[0.04] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, #00f3ff 0%, transparent 70%)' }}
        />
        {/* Side vertical accent lines */}
        <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#00f3ff]/12 via-[#00f3ff]/06 to-transparent" />
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-[#bc13fe]/08 via-transparent to-[#bc13fe]/04" />
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL — reusable HCI-consistent section header
// ─────────────────────────────────────────────────────────────────────────────
const SectionLabel = ({ icon, title, sub, right }) => (
    <div className="flex items-start justify-between mb-4">
        <div>
            <div className="flex items-center gap-2">
                <span className="text-gray-500">{icon}</span>
                <h3 className={`${DS.heading} text-white`}>{title}</h3>
            </div>
            {sub && <p className={`${DS.sublabel} text-gray-600 mt-0.5 ml-[22px]`}>{sub}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD — HCI-consistent metric card
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, sub, blink }) => (
    <div
        className="glass card-hover rounded-2xl p-5 border border-[#00f3ff]/08 relative overflow-hidden group"
        style={{ '--card-color': color, '--card-glow': `${color}30` }}
    >
        {/* Hover radial glow */}
        <div
            className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }}
        />
        {/* Ghost icon */}
        <div className="absolute -bottom-2 -right-2 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
            {React.cloneElement(icon, { size: 64 })}
        </div>

        <div className="flex items-start justify-between mb-4 relative z-10">
            <div
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/60 border border-white/5"
                style={{ color, boxShadow: `0 0 14px ${color}22` }}
            >
                {React.cloneElement(icon, { size: 18 })}
            </div>
            <ArrowUpRight className="text-gray-700 group-hover:text-gray-500 transition-colors mt-0.5" size={12} />
        </div>

        <p className={`${DS.label} text-gray-500 mb-1.5 relative z-10`}>{label}</p>
        <p
            className={`text-2xl ${DS.mono} uppercase italic tracking-tight relative z-10 flex items-center gap-2`}
            style={{ color }}
        >
            {value}
            {blink && (
                <span className="inline-flex relative h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: color }} />
                </span>
            )}
        </p>
        {sub && <p className={`${DS.sublabel} text-gray-600 mt-1.5 relative z-10`}>{sub}</p>}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// GLASS CARD — unified panel wrapper
// ─────────────────────────────────────────────────────────────────────────────
const GlassCard = ({ className = '', children }) => (
    <div className={`glass rounded-2xl border border-[#00f3ff]/08 p-5 ${className}`}>
        {children}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge = ({ label, color }) => (
    <span
        className="text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-md border"
        style={{ color, borderColor: `${color}35`, backgroundColor: `${color}12` }}
    >
        {label}
    </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// TERMINAL FEED — live alert scrolling log
// ─────────────────────────────────────────────────────────────────────────────
const TerminalFeed = ({ alerts }) => {
    const endRef = useRef(null);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [alerts]);

    return (
        <div className="flex flex-col h-full">
            <SectionLabel
                icon={<Terminal size={13} className="text-[#39ff14]" />}
                title="Live Alert Feed"
                sub="Real-time threat stream"
                right={
                    <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#39ff14] animate-pulse" />
                        <span className={`${DS.sublabel} text-[#39ff14]`}>LIVE</span>
                    </div>
                }
            />
            <div className="flex-1 overflow-y-auto space-y-px font-mono text-[10px] custom-scrollbar">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 opacity-25 gap-2">
                        <Terminal size={24} className="text-gray-600" />
                        <span className={`${DS.sublabel} text-gray-600`}>Awaiting threat signal...</span>
                    </div>
                ) : alerts.map((a, i) => {
                    const sev = a.severity;
                    const col = sev === 'HIGH' ? DS.danger : sev === 'MEDIUM' ? DS.warning : DS.primary;
                    return (
                        <div key={a.id || i} className="flex gap-2 py-1.5 border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors px-1 rounded">
                            <span className="text-gray-700 shrink-0 tabular-nums">[{fmtTime(a.created_at)}]</span>
                            <span className="font-bold shrink-0 w-10 text-right" style={{ color: col }}>
                                {(sev || '???').substring(0, 3)}
                            </span>
                            <span className="text-gray-400 truncate leading-tight">
                                {a.type.replace(/^(ML_|ASTRAX_)/, '').replace(/_SIMULATION$/, '').replace(/_/g, ' ')}
                                <span className="text-gray-600 ml-1.5">· {a.sector}</span>
                            </span>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTOR DOSSIER MODAL — responsive, scrollable
// ─────────────────────────────────────────────────────────────────────────────
const SectorDossierModal = ({ sector, onClose }) => {
    const handlePrint = () => window.print();
    const rc = riskColor(sector.risk);
    const docRef = useRef(null);

    // Close on backdrop click
    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const TELEMETRY = [
        { label: 'Encryption Layer', value: 'AES-256-GCM' },
        { label: 'Auth Protocol',    value: 'JWT + mTLS' },
        { label: 'Packet Integrity', value: sector.health > 80 ? 'VERIFIED' : 'DEGRADED' },
        { label: 'Neural Jitter',    value: `${(Math.random() * 0.1 + 0.01).toFixed(3)}%` },
        { label: 'Latency Offset',   value: `${(Math.random() * 20 + 5).toFixed(1)}ms` },
        { label: 'Entropy (Enc)',    value: '99.98%' },
    ];

    const THREAT_IND = [
        { label: 'CVE Exposure',       value: sector.incidents > 0 ? 'DETECTED' : 'CLEAN',  danger: sector.incidents > 0 },
        { label: 'Zero-Days',          value: 'SCANNING',                                   danger: false },
        { label: 'Lateral Movement',   value: sector.risk === 'HIGH' ? 'ACTIVE' : 'NONE',   danger: sector.risk === 'HIGH' },
        { label: 'Data Exfil Risk',    value: sector.risk === 'HIGH' ? 'HIGH' : 'LOW',       danger: sector.risk === 'HIGH' },
    ];

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300"
            onClick={handleBackdrop}
        >
            {/* Classification watermarks */}
            <div className="absolute top-4 left-4 opacity-30 pointer-events-none">
                <span className={`${DS.sublabel} text-[#00f3ff]`}>KAVACHX // CLASSIFIED</span>
            </div>
            <div className="absolute top-4 right-20 opacity-30 pointer-events-none">
                <span className={`${DS.sublabel} text-[#00f3ff]`}>CLEARANCE: ALPHA-4</span>
            </div>

            {/* Modal: full responsive, scrollable */}
            <div
                id="printable-report"
                ref={docRef}
                className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-[#00f3ff]/20 shadow-[0_0_80px_rgba(0,243,255,0.08)] overflow-hidden animate-in zoom-in-95 duration-300"
                style={{ background: 'rgba(3, 5, 18, 0.98)', backdropFilter: 'blur(24px)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── HEADER (sticky) ──────────────────────── */}
                <div className="relative shrink-0 p-6 border-b border-white/5 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.06]"
                        style={{ background: `radial-gradient(circle at top right, ${rc}, transparent 60%)` }} />
                    <div className="absolute top-0 right-0 p-6 opacity-[0.04] pointer-events-none">
                        <ShieldCheck size={100} />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2" style={{ color: rc }}>
                            <Lock size={11} />
                            <span className={DS.label}>Sector Intelligence Dossier</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl hover:bg-white/5 text-gray-600 hover:text-white transition-all print:hidden"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none relative z-10 mb-2">
                        {sector.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 relative z-10">
                        <span className={`${DS.sublabel} text-gray-500 font-mono`}>REF: KVX-{sector.id}-{new Date().getFullYear()}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-700" />
                        <span className={`${DS.sublabel} text-gray-500`}>{fmtDate(new Date())} {fmtTime(new Date())}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-700" />
                        <StatusBadge label="UPLINK ACTIVE" color={DS.primary} />
                    </div>
                </div>

                {/* ── SCROLLABLE BODY ──────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-6">
                        {/* KPI row */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Resilience', value: `${sector.health}%`, color: sector.health > 80 ? DS.success : rc, bar: true },
                                { label: 'Risk Class', value: sector.risk, color: rc },
                                { label: 'Anomalies', value: sector.incidents, color: DS.warning },
                            ].map((kpi) => (
                                <div key={kpi.label} className="p-4 rounded-2xl bg-black/50 border border-white/5 text-center">
                                    <div className={`${DS.sublabel} text-gray-600 mb-2`}>{kpi.label}</div>
                                    <div className="text-2xl font-black font-mono italic" style={{ color: kpi.color }}>{kpi.value}</div>
                                    {kpi.bar && (
                                        <div className="h-0.5 w-full bg-white/5 rounded-full mt-2.5 overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${sector.health}%`, backgroundColor: kpi.color, boxShadow: `0 0 6px ${kpi.color}` }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Executive Summary */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h4 className={`${DS.label} text-white`}>Executive Summary</h4>
                                <div className="h-px flex-1 bg-gradient-to-r from-[#00f3ff]/20 to-transparent" />
                            </div>
                            <p className="text-gray-400 text-[12px] leading-relaxed border-l-2 border-[#00f3ff]/25 pl-4">
                                The <span className="text-white font-bold">{sector.name}</span> domain is at{' '}
                                <span className="font-black italic" style={{ color: sector.health > 80 ? DS.success : rc }}>
                                    {sector.health > 80 ? 'OPTIMAL RESILIENCE' : 'DEGRADED STATUS'}
                                </span>. {sector.incidents} active anomalies recorded. The Autonomous Resilience Engine is{' '}
                                <span className="italic">{sector.risk === 'HIGH' ? 'executing active-mitigation sequences' : 'maintaining passive synchronization'}</span>.
                            </p>
                        </div>

                        {/* Two columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Telemetry */}
                            <div className="p-4 rounded-2xl border border-[#00f3ff]/10 bg-[#00f3ff]/[0.025]">
                                <h5 className={`${DS.label} text-[#00f3ff] mb-3`}>Core Telemetry</h5>
                                <div className="space-y-2">
                                    {TELEMETRY.map(m => (
                                        <div key={m.label} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                            <span className="text-gray-500 font-bold uppercase tracking-tight">{m.label}</span>
                                            <span className="text-white font-mono font-black">{m.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Threat Indicators */}
                            <div className="p-4 rounded-2xl border border-[#ff003c]/10 bg-[#ff003c]/[0.02]">
                                <h5 className={`${DS.label} text-[#ff003c] mb-3`}>Threat Indicators</h5>
                                <div className="space-y-2">
                                    {THREAT_IND.map(t => (
                                        <div key={t.label} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                            <span className="text-gray-500 font-bold uppercase tracking-tight">{t.label}</span>
                                            <span className="font-mono font-black" style={{ color: t.danger ? DS.danger : DS.success }}>{t.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                    <ShieldCheck size={22} className="text-[#39ff14] animate-pulse shrink-0" />
                                    <div>
                                        <div className={`${DS.sublabel} text-white`}>A.R.E. Certified</div>
                                        <div className={`${DS.sublabel} text-gray-600`}>Autonomous Resilience Engine</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ACTIONS (sticky) ───────────────── */}
                <div className="shrink-0 p-5 border-t border-white/5 flex gap-3 bg-black/30 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-3 rounded-xl font-black uppercase tracking-[0.15em] text-[9px] flex items-center justify-center gap-2 transition-all hover:opacity-90 group"
                        style={{ background: `linear-gradient(135deg, ${DS.primary}, #009dab)`, color: '#000' }}
                    >
                        <Download size={14} className="group-hover:animate-bounce" />
                        Export Classified PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-black uppercase tracking-[0.15em] text-[9px] text-gray-400 hover:text-white hover:bg-white/8 transition-all border border-white/5"
                    >
                        Dismiss
                    </button>
                </div>

                <div className="shrink-0 py-3 text-center text-[7px] text-gray-700 font-black uppercase tracking-[0.5em] bg-black/40 print:block">
                    CONFIDENTIAL — KAVACHX NEURAL SHIELD — ALPHA-4 CLEARANCE
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { user } = useAuth();
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedSector, setSelectedSector] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);
        try {
            const res = await api.get('/dashboard');
            setData(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('[Dashboard] fetch error:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const summary         = data?.summary || {};
    const sectors         = data?.sectors || [];
    const recentAlerts    = data?.recentAlerts || [];
    const severityData    = data?.severityData || [];
    const attackTypes     = data?.attackTypes || [];
    const throughputData  = data?.throughputData || [];
    const statusBreakdown = data?.statusBreakdown || { active: 0, resolved: 0 };
    const sysColor        = statusColor(summary.systemStatus);

    const filteredSectors = user?.role === 'SECTOR_OWNER'
        ? sectors.filter(s => s.id === user?.sector?.toUpperCase())
        : sectors;

    const radarData = filteredSectors.map(s => ({ label: s.name.split(' ')[0], health: s.health }));

    // KPI card definitions
    const STAT_CARDS = [
        {
            label: 'System Status',
            value: summary.systemStatus || 'OPTIMAL',
            icon:  <ShieldCheck />,
            color: sysColor,
            sub:   'Neural uplink active',
            blink: summary.systemStatus !== 'OPTIMAL',
        },
        {
            label: 'Active Threats',
            value: summary.activeThreats ?? '—',
            icon:  <AlertTriangle />,
            color: DS.danger,
            sub:   'Unresolved alerts',
            blink: (summary.activeThreats || 0) > 0,
        },
        {
            label: 'Events (24h)',
            value: (summary.totalEvents || 0).toLocaleString(),
            icon:  <Zap />,
            color: DS.accent,
            sub:   'Raw ingestion count',
        },
        {
            label: 'Risk Vector',
            value: summary.riskLevel || 'STABLE',
            icon:  <Activity />,
            color: summary.riskLevel === 'ELEVATED' ? DS.warning : DS.success,
            sub:   'Threat posture',
            blink: summary.riskLevel === 'ELEVATED',
        },
        {
            label: 'Suppression',
            value: `${summary.suppressionRate ?? 0}%`,
            icon:  <Database />,
            color: DS.success,
            sub:   'False positive reduction',
        },
        {
            label: 'Alerts (Total)',
            value: (summary.totalAlerts || 0).toLocaleString(),
            icon:  <ShieldAlert />,
            color: DS.warning,
            sub:   'Confirmed threats',
        },
    ];

    // ── LOADING STATE ──────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 gap-5 relative">
            <CyberBackground />
            <div className="relative z-10">
                <div className="h-16 w-16 rounded-full border border-[#00f3ff]/15 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-2 border-t-[#00f3ff] border-transparent animate-spin" />
                </div>
            </div>
            <div className="text-center z-10 space-y-1">
                <p className="text-[#00f3ff] font-black uppercase tracking-[0.4em] text-sm">Initializing Command Matrix</p>
                <p className={`${DS.sublabel} text-gray-600`}>Establishing secure uplink...</p>
            </div>
        </div>
    );

    // ── MAIN RENDER ────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            <CyberBackground />

            {/* ════ HEADER ════════════════════════════════════════════════════ */}
            <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-[#00f3ff] text-[9px] font-black uppercase tracking-[0.3em]">
                        <Radio size={9} className="animate-pulse" />
                        Live Neural Link Established · KavachX Defensive Grid
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
                        Command <span className="text-[#00f3ff]">Center</span>
                    </h1>
                    <p className={`${DS.sublabel} text-gray-600`}>
                        Infrastructure Resilience Protocol v4.2 &nbsp;·&nbsp; Sector Intelligence Dashboard
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="glass flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-[#00f3ff]/12">
                        <div className="relative">
                            <div className="h-1.5 w-1.5 bg-[#00f3ff] rounded-full animate-ping absolute inset-0" />
                            <div className="h-1.5 w-1.5 bg-[#00f3ff] rounded-full relative" />
                        </div>
                        <span className={`${DS.label} text-[#00f3ff]`}>Secure Uplink</span>
                        <div className="h-3 w-px bg-white/10" />
                        <LiveClock />
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        title="Refresh"
                        className={`glass p-2 rounded-xl border border-white/5 hover:border-[#00f3ff]/20 text-gray-600 hover:text-[#00f3ff] transition-all ${isRefreshing ? 'animate-spin text-[#00f3ff]' : ''}`}
                    >
                        <RefreshCw size={13} />
                    </button>
                    {lastUpdated && (
                        <span className={`hidden md:flex items-center gap-1 ${DS.sublabel} text-gray-600`}>
                            <Clock size={9} /> Synced {fmtTime(lastUpdated)}
                        </span>
                    )}
                </div>
            </div>

            {/* ════ KPI GRID ══════════════════════════════════════════════════ */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                {STAT_CARDS.map((card, i) => <StatCard key={i} {...card} />)}
            </div>

            {/* ════ ROW 2: Throughput + Threat Matrix + Status ════════════════ */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3.5">

                {/* Ingestion Telemetry — 7 cols */}
                <GlassCard className="lg:col-span-7">
                    <SectionLabel
                        icon={<TrendingUp size={13} />}
                        title="Ingestion Telemetry"
                        sub="24-hour alert throughput window"
                        right={
                            <div className="flex items-center gap-1.5">
                                <div className="h-1 w-1 rounded-full bg-[#00f3ff]" />
                                <span className={`${DS.sublabel} text-[#00f3ff]`}>Events/hr</span>
                            </div>
                        }
                    />
                    <div className="h-[220px]">
                        <EventThroughputChart data={throughputData.length > 0 ? throughputData : [{ time: '00:00', value: 0 }]} />
                    </div>
                </GlassCard>

                {/* Threat Matrix — 3 cols */}
                <GlassCard className="lg:col-span-3">
                    <SectionLabel
                        icon={<Eye size={13} />}
                        title="Threat Matrix"
                        sub="24h severity divergence"
                        right={<StatusBadge label="24H" color={DS.accent} />}
                    />
                    <div className="h-[150px]">
                        <SeverityDistributionChart data={severityData} />
                    </div>
                    <div className="flex justify-center gap-5 mt-3">
                        {[
                            { label: 'Low',    color: DS.primary },
                            { label: 'Medium', color: DS.warning },
                            { label: 'High',   color: DS.danger  },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color, boxShadow: `0 0 5px ${l.color}` }} />
                                <span className={`${DS.sublabel} text-gray-500`}>{l.label}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Status Split — 2 cols */}
                <GlassCard className="lg:col-span-2 flex flex-col">
                    <SectionLabel icon={<BarChart2 size={13} />} title="Status Split" sub="Active vs resolved" />
                    <div className="flex-1 min-h-[120px]">
                        <StatusDonutChart active={statusBreakdown.active} resolved={statusBreakdown.resolved} />
                    </div>
                    <div className="space-y-2 mt-2">
                        {[
                            { label: 'Active',   value: statusBreakdown.active,   color: DS.danger  },
                            { label: 'Resolved', value: statusBreakdown.resolved, color: DS.success },
                        ].map(s => (
                            <div key={s.label} className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1 w-1 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className={`${DS.sublabel} text-gray-500`}>{s.label}</span>
                                </div>
                                <span className={`text-[11px] ${DS.mono}`} style={{ color: s.color }}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* ════ ROW 3: Attack Vectors + Radar + Terminal ══════════════════ */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3.5">

                {/* Attack Vector Chart — 4 cols */}
                <GlassCard className="lg:col-span-4">
                    <SectionLabel
                        icon={<ShieldAlert size={13} />}
                        title="Attack Vector Analysis"
                        sub="24h threat classification"
                        right={<StatusBadge label="ML-Classified" color={DS.danger} />}
                    />
                    <div className="h-[210px]">
                        {attackTypes.length > 0 ? (
                            <AttackVectorChart data={attackTypes} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-700">
                                <div className="text-center space-y-1 opacity-40">
                                    <ShieldAlert size={28} className="mx-auto text-gray-700" />
                                    <p className={DS.sublabel}>No attacks in 24h window</p>
                                </div>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Sector Radar — 3 cols */}
                <GlassCard className="lg:col-span-3">
                    <SectionLabel icon={<Globe size={13} />} title="Sector Resilience" sub="Cross-domain health radar" />
                    <div className="h-[210px]">
                        <SectorRadarChart data={radarData.length > 0 ? radarData : [{ label: 'N/A', health: 0 }]} />
                    </div>
                </GlassCard>

                {/* Live Terminal Feed — 5 cols */}
                <GlassCard className="lg:col-span-5">
                    <div className="h-[270px] flex flex-col">
                        <TerminalFeed alerts={recentAlerts} />
                    </div>
                </GlassCard>
            </div>

            {/* ════ ROW 4: SECTOR VULNERABILITY TABLE ═════════════════════════ */}
            <div className="relative z-10 glass rounded-2xl overflow-hidden border border-[#00f3ff]/08">
                {/* Table header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Network size={13} className="text-[#00f3ff]" />
                            <h3 className={`${DS.heading} text-white`}>Sector Vulnerability Analysis</h3>
                        </div>
                        <p className={`${DS.sublabel} text-gray-600 mt-0.5 ml-[22px]`}>
                            Cross-domain infrastructure auditing · Click sector to generate intelligence dossier
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-[#39ff14] animate-pulse" />
                        <span className={`${DS.sublabel} text-[#39ff14]`}>Live</span>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/[0.04]">
                                {['Domain', 'Resilience Score', 'Risk Class', 'Active Cycles', 'Total (24h)', 'Intel Ops'].map((h, i) => (
                                    <th key={h} className={`px-5 py-3.5 ${DS.sublabel} text-gray-600 ${i === 5 ? 'text-right' : i === 3 || i === 4 ? 'text-center' : ''}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSectors.map((sector, i) => {
                                const rc = riskColor(sector.risk);
                                return (
                                    <tr key={i} className="border-b border-white/[0.03] hover:bg-[#00f3ff]/[0.02] transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: rc }} />
                                                <span className="font-black text-white text-[12px] uppercase tracking-wide">{sector.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1 w-24 rounded-full bg-white/5 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${sector.health}%`, backgroundColor: rc, boxShadow: `0 0 6px ${rc}50` }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] ${DS.mono} text-gray-400`}>{sector.health}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge label={sector.risk} color={rc} />
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`text-[11px] ${DS.mono}`} style={{ color: sector.incidents > 0 ? DS.warning : DS.success }}>
                                                {sector.incidents}
                                            </span>
                                        </td>
                                        <td className={`px-5 py-4 text-center text-[11px] ${DS.mono} text-gray-600`}>{sector.total || 0}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedSector(sector)}
                                                className="flex items-center gap-1 ml-auto text-[9px] font-black uppercase tracking-[0.15em] text-gray-600 hover:text-[#00f3ff] transition-colors group/btn"
                                            >
                                                Generate Dossier
                                                <ChevronRight size={11} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile — sector cards */}
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                    {filteredSectors.map((sector, i) => {
                        const rc = riskColor(sector.risk);
                        return (
                            <div key={i} className="p-4 rounded-2xl bg-black/40 border border-white/5 cursor-pointer hover:border-white/10 transition-all" onClick={() => setSelectedSector(sector)}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-black text-[11px] text-white uppercase">{sector.name}</span>
                                    <StatusBadge label={sector.risk} color={rc} />
                                </div>
                                <div className="h-0.5 w-full bg-white/5 rounded-full mb-2">
                                    <div className="h-full rounded-full" style={{ width: `${sector.health}%`, backgroundColor: rc }} />
                                </div>
                                <span className={`${DS.sublabel} text-gray-600`}>{sector.incidents} anomalies</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dossier Modal */}
            {selectedSector && (
                <SectorDossierModal sector={selectedSector} onClose={() => setSelectedSector(null)} />
            )}
        </div>
    );
};

export default Dashboard;
