import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { 
    Settings as SettingsIcon, Bell, Shield, Key, Globe, 
    Loader2, Save, RefreshCw, CheckCircle2, X, AlertTriangle, 
    Terminal as TerminalIcon, Copy, MessageSquare, ShieldAlert, 
    Power, Activity, Target
} from 'lucide-react';

const Settings = () => {
    const [activeModule, setActiveModule] = useState(null);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        security: { low_threshold: 0.3, medium_threshold: 0.6, high_threshold: 0.8, auto_response: false },
        notifications: { admin_email: 'admin@cyber.res', email_enabled: true },
        apiKeys: [],
        sectors: []
    });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                api.get('/settings/security'),
                api.get('/settings/notifications'),
                api.get('/settings/api-keys'),
                api.get('/settings/sectors')
            ]);
            
            const [sec, notch, keys, sectors] = results;
            
            setSettings({
                security: sec.status === 'fulfilled' && sec.value.data.settings ? sec.value.data.settings : settings.security,
                notifications: notch.status === 'fulfilled' && notch.value.data.settings ? notch.value.data.settings : settings.notifications,
                apiKeys: keys.status === 'fulfilled' && keys.value.data.keys ? keys.value.data.keys : [],
                sectors: sectors.status === 'fulfilled' && sectors.value.data.sectors ? sectors.value.data.sectors : []
            });

            if (results.some(r => r.status === 'rejected')) {
                showToast('Partial sync failure: Some neural links are degraded', 'error');
            }
        } catch (err) {
            showToast('Sync failure: Governance link offline', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // --- Module Handlers ---

    const handleSaveSecurity = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/settings/security', settings.security);
            setSettings({ ...settings, security: res.data.settings });
            showToast('Security heuristics recalibrated');
            setActiveModule(null);
        } catch (err) {
            showToast('Update aborted: Buffer error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotifications = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/settings/notifications', settings.notifications);
            setSettings({ ...settings, notifications: res.data.settings });
            showToast('Telemetry channels confirmed');
            setActiveModule(null);
        } catch (err) {
            showToast('Update aborted: Link error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRotateKey = async () => {
        setLoading(true);
        try {
            const res = await api.post('/settings/api-keys/rotate');
            setSettings({ ...settings, apiKeys: [res.data.key, ...settings.apiKeys] });
            showToast('Ingestion Key Recalibrated');
        } catch (err) {
            showToast('Rotation failed: Neural lockout', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSector = async (sector) => {
        setLoading(true);
        try {
            const newStatus = !sector.is_enabled;
            const res = await api.post('/settings/sectors', {
                id: sector.id,
                is_enabled: newStatus,
                owner_id: sector.owner_id
            });
            
            const updatedSectors = settings.sectors.map(s => 
                s.id === sector.id ? { ...s, is_enabled: newStatus } : s
            );
            setSettings({ ...settings, sectors: updatedSectors });
            
            showToast(`Sector ${sector.name} ${newStatus ? 'Activated' : 'Suspended'}`);
        } catch (err) {
            showToast('Sector toggle failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- UI Data ---

    const modules = [
        { id: 'security', icon: <Shield />, title: 'Threat Thresholds', desc: 'Recalibrate ML divergence sensitivity and automated interception triggers.', color: '#ff003c', glow: 'rgba(255,0,60,0.5)' },
        { id: 'notifications', icon: <Bell />, title: 'Telemetry Uplink', desc: 'Secure dispatch channels for high-priority anomaly broadcasts.', color: '#39ff14', glow: 'rgba(57,255,20,0.5)' },
        { id: 'api', icon: <Key />, title: 'Ingestion Keys', desc: 'Manage crypt-tokens for external sector data collection.', color: '#00f3ff', glow: 'rgba(0,243,255,0.5)' },
        { id: 'sectors', icon: <Globe />, title: 'Grid Domains', desc: 'Assign infrastructure owners and verify regional grid synchronicity.', color: '#bc13fe', glow: 'rgba(188,19,254,0.5)' },
    ];

    const activeModData = modules.find(m => m.id === activeModule);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-10 min-h-screen">
            {/* CYBER ANIMATIONS: SCANLINE & GRID */}
            <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
                {/* Moving Scanline */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#39ff14]/20 shadow-[0_0_15px_#39ff14] animate-scan-slow opacity-30" />
                {/* Pulsing & Drifting Grid Background */}
                <div className="absolute inset-0 opacity-[0.2] animate-grid-drift" 
                     style={{ backgroundImage: `radial-gradient(#00f3ff 1.5px, transparent 1.5px)`, backgroundSize: '40px 40px' }} />
            </div>

            {toast && (
                <div className={`fixed top-12 right-12 z-[100] flex items-center gap-4 px-6 py-4 rounded-[1rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-right-10 duration-500 bg-black/90 backdrop-blur-xl border ${toast.type === 'error' ? 'border-[#ff003c] text-[#ff003c]' : 'border-[#00f3ff] text-[#00f3ff]'}`}>
                    {toast.type === 'error' ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
                    <span className="font-black uppercase tracking-widest text-[11px]">{toast.message}</span>
                </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-[#bc13fe] text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                        <SettingsIcon size={14} className="animate-spin-slow" />
                        Root Governance Interface
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-widest uppercase text-shadow-glow">Admin Command</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 px-1 border-l-2 border-[#bc13fe]/50 ml-1">Infrastructure Control & Resilience Protocols</p>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-black/60 border border-[#bc13fe]/30 px-5 py-3 text-[10px] font-black text-[#bc13fe] shadow-[0_0_20px_rgba(188,19,254,0.1)] backdrop-blur-md">
                    <div className="h-2 w-2 rounded-full bg-[#bc13fe] animate-pulse shadow-[0_0_10px_#bc13fe]" />
                    ENCRYPTED SUDO SESSION
                </div>
            </div>

            {loading && !activeModule && (
                <div className="py-32 flex flex-col items-center justify-center border border-white/5 rounded-[2rem] bg-white/[0.02]">
                    <Loader2 className="h-12 w-12 animate-spin text-[#bc13fe] mb-6" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#bc13fe] animate-pulse">Synchronizing Core Logic...</span>
                </div>
            )}

            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((mod) => (
                        <div key={mod.id} 
                            onClick={() => setActiveModule(mod.id)}
                            className="cyber-card bg-black/40 backdrop-blur-xl rounded-[1.5rem] p-8 flex flex-col transition-all cursor-pointer overflow-hidden group relative min-h-[220px]"
                            style={{ 
                                '--card-color': mod.color, 
                                '--card-glow': `${mod.color}40` 
                            }}
                        >
                            {/* Hover Gradient Background */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${mod.glow} 0%, transparent 70%)` }} />
                            
                            {/* Giant faded Background Icon */}
                            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 group-hover:text-white" style={{ color: mod.color }}>
                                {React.cloneElement(mod.icon, { size: 140 })}
                            </div>

                            <div className="flex items-start gap-5 mb-6 relative z-10">
                                <div className="h-14 w-14 shrink-0 flex items-center justify-center rounded-xl bg-black/80 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300" style={{ color: mod.color, borderColor: `${mod.color}40`, boxShadow: `0 0 20px ${mod.color}20` }}>
                                    {React.cloneElement(mod.icon, { size: 24 })}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest">{mod.title}</h3>
                                    <div className="h-0.5 w-12 mt-2" style={{ backgroundColor: mod.color }} />
                                </div>
                            </div>
                            
                            <p className="text-[11px] text-gray-400 font-medium uppercase leading-relaxed tracking-wider mb-8 relative z-10">
                                {mod.desc}
                            </p>

                            <div className="mt-auto flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] relative z-10" style={{ color: mod.color }}>
                                <span>Initialize Override</span>
                                <TerminalIcon size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODALS */}
            {activeModule && activeModData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300 overflow-y-auto">
                    <div className="my-auto w-full max-w-2xl bg-[#050505] rounded-[2rem] border overflow-hidden animate-in zoom-in-95 duration-300 relative shadow-2xl" style={{ borderColor: `${activeModData.color}40`, boxShadow: `0 0 100px ${activeModData.glow}` }}>
                        
                        {/* Header */}
                        <div className="p-8 border-b flex items-center justify-between" style={{ borderColor: `${activeModData.color}20`, background: `linear-gradient(to right, ${activeModData.color}10, transparent)` }}>
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-xl bg-black flex items-center justify-center border shadow-inner" style={{ color: activeModData.color, borderColor: `${activeModData.color}40`, boxShadow: `0 0 20px ${activeModData.color}20` }}>
                                    {React.cloneElement(activeModData.icon, { size: 24 })}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-none mb-1">Trm: {activeModData.title}</h2>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.3em]">Neural Interface Level 5</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveModule(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            
                            {/* 1. SECURITY THRESHOLDS */}
                            {activeModule === 'security' && (
                                <form onSubmit={handleSaveSecurity} className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <ThresholdInput
                                            label="LOW Threat Sigma"
                                            value={settings.security.low_threshold}
                                            color="#00f3ff"
                                            onChange={(v) => setSettings({ ...settings, security: { ...settings.security, low_threshold: v } })}
                                        />
                                        <ThresholdInput
                                            label="MED Threat Sigma"
                                            value={settings.security.medium_threshold}
                                            color="#ffd700"
                                            onChange={(v) => setSettings({ ...settings, security: { ...settings.security, medium_threshold: v } })}
                                        />
                                        <ThresholdInput
                                            label="HIGH Threat Sigma"
                                            value={settings.security.high_threshold}
                                            color="#ff003c"
                                            onChange={(v) => setSettings({ ...settings, security: { ...settings.security, high_threshold: v } })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-6 rounded-xl bg-black/60 border border-[#ff003c]/20 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#ff003c]" />
                                        <div className="pl-2">
                                            <h4 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <TargetIcon size={14} className="text-[#ff003c]" />
                                                Autonomous Defense Execution
                                            </h4>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1.5">Permit ML model to execute mitigations without human confirmation</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSettings({ ...settings, security: { ...settings.security, auto_response: !settings.security.auto_response } })}
                                            className={`w-16 h-8 rounded-full transition-all relative border-2 ${settings.security.auto_response ? 'bg-[#ff003c]/20 border-[#ff003c]' : 'bg-black border-white/20'}`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${settings.security.auto_response ? 'right-1 bg-[#ff003c] shadow-[0_0_15px_#ff003c]' : 'left-1 bg-gray-600'}`} />
                                        </button>
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full bg-[#ff003c] hover:bg-[#ff003c]/90 text-white py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(255,0,60,0.3)]">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Update Security Matrix
                                    </button>
                                </form>
                            )}

                            {/* 2. NOTIFICATIONS */}
                            {activeModule === 'notifications' && (
                                <form onSubmit={handleSaveNotifications} className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[#39ff14] uppercase tracking-widest flex items-center gap-2">
                                                <MessageSquare size={14} />
                                                Primary Dispatch Email
                                            </label>
                                            <div className="relative">
                                                <input
                                                    className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-sm font-black text-white outline-none focus:border-[#39ff14]/50 transition-all font-mono"
                                                    value={settings.notifications.admin_email || ''}
                                                    onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, admin_email: e.target.value } })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-6 rounded-xl bg-black/60 border border-[#39ff14]/20 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#39ff14]" />
                                            <div className="pl-2">
                                                <h4 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                    <Bell size={14} className="text-[#39ff14]" />
                                                    Enable Email Broadcasts
                                                </h4>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1.5">Dispatch alerts & system metrics to the primary email</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, email_enabled: !settings.notifications.email_enabled } })}
                                                className={`w-16 h-8 rounded-full transition-all relative border-2 ${settings.notifications.email_enabled ? 'bg-[#39ff14]/20 border-[#39ff14]' : 'bg-black border-white/20'}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${settings.notifications.email_enabled ? 'right-1 bg-[#39ff14] shadow-[0_0_15px_#39ff14]' : 'left-1 bg-gray-600'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full bg-[#39ff14] hover:bg-[#39ff14]/90 text-black py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(57,255,20,0.3)]">
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Update Telemetry Uplink
                                    </button>
                                </form>
                            )}

                            {/* 3. API KEYS */}
                            {activeModule === 'api' && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        {settings.apiKeys.length === 0 && (
                                            <div className="p-8 text-center text-gray-500 text-[11px] font-bold uppercase tracking-widest border border-white/5 rounded-xl border-dashed">
                                                No ingestion keys generated
                                            </div>
                                        )}
                                        {settings.apiKeys.map((key, idx) => (
                                            <div key={key.id} className="p-5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-4 relative overflow-hidden">
                                                <div className={`absolute top-0 left-0 w-1 h-full ${key.is_active ? 'bg-[#00f3ff]' : 'bg-gray-700'}`} />
                                                <div className="flex-1 overflow-hidden pl-2">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`text-[11px] font-black uppercase tracking-widest ${key.is_active ? 'text-[#00f3ff]' : 'text-gray-500'}`}>
                                                            {key.label} {idx === 0 && key.is_active && '(Current)'}
                                                        </span>
                                                        {key.is_active && <span className="text-[8px] bg-[#00f3ff]/10 text-[#00f3ff] px-2 py-0.5 rounded-sm font-black border border-[#00f3ff]/30 animate-pulse">ACTIVE</span>}
                                                    </div>
                                                    <div className="text-xs font-mono text-gray-400 truncate bg-black p-3 rounded-lg border border-white/5">{key.key_value}</div>
                                                </div>
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(key.key_value); showToast('Key Synchronized to Clipboard'); }}
                                                    className="h-12 w-12 shrink-0 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-[#00f3ff] hover:bg-[#00f3ff]/10 border border-white/10 transition-all hover:border-[#00f3ff]/30"
                                                    title="Copy to clipboard"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleRotateKey}
                                        disabled={loading}
                                        className="w-full bg-transparent border-2 border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff]/10 py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(0,243,255,0.1)]"
                                    >
                                        <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
                                        Generate New Token
                                    </button>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest text-center">Rotating the key will immediately invalidate all existing endpoints.</p>
                                </div>
                            )}

                            {/* 4. SECTORS */}
                            {activeModule === 'sectors' && (
                                <div className="space-y-4">
                                    {settings.sectors.map((sector) => (
                                        <div key={sector.id} className="p-6 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-4 transition-all hover:bg-black/80">
                                            <div className="flex items-center gap-5">
                                                <div className="relative flex items-center justify-center">
                                                    <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${sector.is_enabled ? 'bg-[#39ff14]' : 'bg-[#ff003c]'}`} />
                                                    <div className={`h-4 w-4 rounded-full ${sector.is_enabled ? 'bg-[#39ff14] shadow-[0_0_15px_#39ff14]' : 'bg-[#ff003c] shadow-[0_0_15px_#ff003c]'} border-2 border-black relative z-10`} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white text-[13px] uppercase tracking-[0.2em]">{sector.name}</h4>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 font-mono">ID: {sector.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right hidden sm:block bg-white/5 py-2 px-4 rounded-lg border border-white/5">
                                                    <div className="text-[9px] text-[#bc13fe] font-black uppercase tracking-widest mb-0.5">Admin Entity</div>
                                                    <div className="text-[11px] text-white font-black">{sector.owner?.name || 'ROOT'}</div>
                                                </div>
                                                <button 
                                                    onClick={() => handleToggleSector(sector)}
                                                    className="h-10 w-10 shrink-0 rounded-lg bg-black text-gray-400 hover:text-[#bc13fe] border border-white/10 hover:border-[#bc13fe]/50 flex items-center justify-center transition-all shadow-inner"
                                                    title={sector.is_enabled ? 'Suspend Sector' : 'Activate Sector'}
                                                >
                                                    <Power size={16} className={sector.is_enabled ? 'text-[#39ff14]' : 'text-[#ff003c]'} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 bg-black text-[9px] text-gray-600 font-black uppercase tracking-[0.4em] select-none text-center border-t border-white/5">
                            KavachX Neural Network Sync: NORMAL
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

const ThresholdInput = ({ label, value, color, onChange }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color }}>
            <Activity size={12} />
            {label}
        </label>
        <div className="relative group">
            <input
                type="number"
                step="0.05" min="0.1" max="1.0"
                value={value || ''}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white outline-none transition-all font-mono text-[14px] font-black focus:border-white/30"
                style={{ 
                    // @ts-ignore
                    '--tw-ring-color': color 
                }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[12px] opacity-40 uppercase font-mono italic select-none">Σ</div>
        </div>
    </div>
);

// Lucide icon not imported in top level: Target
const TargetIcon = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
);

export default Settings;
