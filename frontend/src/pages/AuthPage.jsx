import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Shield, Mail, Lock, User, Briefcase, AlertCircle,
    ChevronDown, Terminal, Key, ArrowRight, Eye, EyeOff
} from 'lucide-react';

// ── Hex Canvas Background ─────────────────────────────────────────────────────
const HexCanvas = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W = canvas.width = canvas.offsetWidth;
        let H = canvas.height = canvas.offsetHeight;
        let animId;
        let tick = 0;

        const hexes = [];
        const HEX_SIZE = 34;
        const cols = Math.ceil(W / (HEX_SIZE * 1.75)) + 2;
        const rows = Math.ceil(H / (HEX_SIZE * 1.52)) + 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * HEX_SIZE * 1.75 + (r % 2 === 0 ? 0 : HEX_SIZE * 0.875);
                const y = r * HEX_SIZE * 1.52;
                hexes.push({ x, y, phase: Math.random() * Math.PI * 2, speed: 0.004 + Math.random() * 0.003 });
            }
        }

        const drawHex = (x, y, size, alpha) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const px = x + size * Math.cos(angle);
                const py = y + size * Math.sin(angle);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(0,243,255,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
        };

        const drawFrame = () => {
            ctx.clearRect(0, 0, W, H);
            tick++;
            hexes.forEach(h => {
                h.phase += h.speed;
                const alpha = (Math.sin(h.phase) * 0.5 + 0.5) * 0.10 + 0.02;
                drawHex(h.x, h.y, HEX_SIZE * 0.88, alpha);
            });
            if (tick % 90 === 0) {
                const rh = hexes[Math.floor(Math.random() * hexes.length)];
                drawHex(rh.x, rh.y, HEX_SIZE * 0.88, 0.4);
            }
            animId = requestAnimationFrame(drawFrame);
        };

        const onResize = () => {
            W = canvas.width = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', onResize);
        drawFrame();
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

// ── Reusable Input Field ──────────────────────────────────────────────────────
const Field = ({ id, label, type = 'text', value, onChange, placeholder, icon, required = true, autoComplete }) => {
    const [show, setShow] = useState(false);
    const isPass = type === 'password';
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f3ff]/60 ml-0.5">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#00f3ff]/30">
                    {icon}
                </div>
                <input
                    id={id}
                    type={isPass && show ? 'text' : type}
                    value={value}
                    onChange={onChange}
                    className="w-full rounded-xl border border-white/8 bg-white/[0.03] py-3 pl-10 pr-10 text-sm text-white placeholder-gray-700 outline-none transition-all duration-200 font-medium focus:border-[#00f3ff]/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#00f3ff]/15"
                    placeholder={placeholder}
                    required={required}
                    autoComplete={autoComplete}
                    aria-label={label}
                />
                {isPass && (
                    <button type="button" onClick={() => setShow(s => !s)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-700 hover:text-gray-400 transition-colors"
                        aria-label={show ? 'Hide password' : 'Show password'}>
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
        </div>
    );
};

// ── SELECT FIELD ──────────────────────────────────────────────────────────────
const SelectField = ({ id, label, value, onChange, icon, children, required = false }) => (
    <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-[9px] font-black uppercase tracking-[0.22em] text-[#00f3ff]/60 ml-0.5">
            {label}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#00f3ff]/30">
                {icon}
            </div>
            <select id={id} value={value} onChange={onChange} required={required}
                className="w-full rounded-xl border border-white/8 bg-[#030510] py-3 pl-10 pr-8 text-sm text-white outline-none transition-all duration-200 font-medium appearance-none cursor-pointer focus:border-[#00f3ff]/40 focus:ring-1 focus:ring-[#00f3ff]/15"
                aria-label={label}>
                {children}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-600">
                <ChevronDown size={15} />
            </div>
        </div>
    </div>
);

// ── LOGIN FORM ────────────────────────────────────────────────────────────────
const LoginForm = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-7">
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#00f3ff]/8 border border-[#00f3ff]/15">
                        <Terminal size={20} className="text-[#00f3ff]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-[0.08em] text-white uppercase">Access Portal</h1>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.25em]">Identity Verification</p>
                    </div>
                </div>
                <div className="h-px bg-gradient-to-r from-[#00f3ff]/25 to-transparent" />
            </div>

            {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-[#ff003c]/8 px-3.5 py-3 text-xs font-semibold text-[#ff003c] border border-[#ff003c]/15 mb-5">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="leading-tight">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Field id="login-email" label="Email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="user@sector.crip"
                    icon={<Mail size={15} />} autoComplete="email" />

                <Field id="login-password" label="Password" type="password" value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    icon={<Key size={15} />} autoComplete="current-password" />

                <div className="flex justify-end -mt-1">
                    <Link to="/forgot-password" className="text-[9px] font-bold uppercase tracking-wider text-gray-600 hover:text-[#00f3ff] transition-colors">
                        Forgot password?
                    </Link>
                </div>

                <button type="submit" disabled={isLoading}
                    className="w-full mt-1 rounded-xl py-3.5 text-[11px] font-black uppercase tracking-[0.18em] text-black transition-all active:scale-[0.98] disabled:opacity-60 relative overflow-hidden group"
                    style={{ background: 'linear-gradient(135deg, #00f3ff 0%, #00c8d4 100%)', boxShadow: '0 0 24px rgba(0,243,255,0.2)' }}>
                    <span className="relative z-10">{isLoading ? 'Verifying...' : 'Initialize Session'}</span>
                    <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
            </form>

            <div className="mt-7 pt-5 border-t border-white/5 text-center">
                <p className="text-[10px] text-gray-600 mb-2.5">No clearance yet?</p>
                <button onClick={onSwitch}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#00f3ff]/70 hover:text-[#00f3ff] transition-colors group"
                    aria-label="Switch to registration form">
                    Request Credentials
                    <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
                <p className="text-[8px] font-bold text-gray-700 uppercase tracking-[0.35em] mt-4">
                    Unauthorized access is strictly monitored
                </p>
            </div>
        </div>
    );
};

// ── REGISTER FORM ─────────────────────────────────────────────────────────────
const RegisterForm = ({ onSwitch }) => {
    const [formData, setFormData] = useState({ email: '', password: '', name: '', role: 'ANALYST', sector: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const isSectorOwner = formData.role === 'SECTOR_OWNER';
    const canSubmit = !isSectorOwner || (isSectorOwner && formData.sector);

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) { setError('Domain assignment required for Sector Authority role.'); return; }
        setLoading(true); setError('');
        try {
            await register(formData);
            navigate('/verify-otp', { state: { email: formData.email, purpose: 'REGISTER' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#00f3ff]/8 border border-[#00f3ff]/15 shrink-0">
                        <Shield size={20} className="text-[#00f3ff]" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-black tracking-[0.06em] text-white uppercase leading-tight whitespace-nowrap">Personnel Registry</h1>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em]">Initialize Operational Identity</p>
                    </div>
                </div>
                <div className="h-px bg-gradient-to-r from-[#00f3ff]/25 to-transparent" />
            </div>

            {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-[#ff003c]/8 px-3.5 py-3 text-xs font-semibold text-[#ff003c] border border-[#ff003c]/15 mb-4">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="leading-tight">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Name + Email — stacked to avoid label wrapping */}
                <Field id="reg-name" label="Full Name" value={formData.name}
                    onChange={set('name')} placeholder="Agent Name"
                    icon={<User size={15} />} autoComplete="name" />

                <Field id="reg-email" label="Email Address" type="email" value={formData.email}
                    onChange={set('email')} placeholder="agent@sector.crip"
                    icon={<Mail size={15} />} autoComplete="email" />

                <Field id="reg-password" label="Password" type="password" value={formData.password}
                    onChange={set('password')} placeholder="••••••••"
                    icon={<Lock size={15} />} autoComplete="new-password" />

                {/* Role */}
                <SelectField id="reg-role" label="Sector Role" value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value, sector: e.target.value !== 'SECTOR_OWNER' ? '' : prev.sector }))}
                    icon={<Briefcase size={15} />}>
                    <option value="ANALYST">Analyst</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="SECTOR_OWNER">Sector Authority</option>
                </SelectField>

                {/* Domain — only for Sector Authority */}
                {isSectorOwner && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                        <SelectField id="reg-sector" label="Domain Assignment" value={formData.sector}
                            onChange={set('sector')} icon={<Shield size={15} />} required>
                            <option value="">Select Domain</option>
                            <option value="HEALTHCARE">Healthcare Grid</option>
                            <option value="AGRICULTURE">Agricultural Network</option>
                            <option value="URBAN">Urban Infrastructure</option>
                        </SelectField>
                    </div>
                )}

                <button type="submit" disabled={loading || !canSubmit}
                    className="w-full rounded-xl py-3.5 text-[11px] font-black uppercase tracking-[0.18em] text-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group pt-3"
                    style={{ background: 'linear-gradient(135deg, #00f3ff 0%, #00c8d4 100%)', boxShadow: '0 0 24px rgba(0,243,255,0.2)' }}>
                    <span className="relative z-10">{loading ? 'Synthesizing Clearance...' : 'Deploy Credentials'}</span>
                    <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/5 text-center">
                <p className="text-[10px] text-gray-600 mb-2.5">Already have clearance?</p>
                <button onClick={onSwitch}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#00f3ff]/70 hover:text-[#00f3ff] transition-colors group"
                    aria-label="Switch to login form">
                    Sign In
                    <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
                <p className="text-[8px] font-bold text-gray-700 uppercase tracking-[0.35em] mt-4">
                    All deployments are cryptographically logged
                </p>
            </div>
        </div>
    );
};

// ── MAIN AUTH PAGE ─────────────────────────────────────────────────────────────
const AuthPage = ({ defaultPanel = 'login' }) => {
    const [activePanel, setActivePanel] = useState(defaultPanel);
    const navigate = useNavigate();
    const isLogin = activePanel === 'login';

    const switchTo = (panel) => {
        setActivePanel(panel);
        navigate(panel === 'login' ? '/login' : '/register', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#020204] flex overflow-hidden">

            {/* ── LEFT: Visual Panel ───────────────────────────── */}
            <div className="hidden lg:flex flex-1 relative flex-col items-center justify-center overflow-hidden border-r border-white/5"
                style={{ background: 'linear-gradient(160deg, #020407 0%, #040a12 50%, #020407 100%)' }}>
                <HexCanvas />

                {/* Vertical glow bar */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#00f3ff]/15 to-transparent" />

                <div className="relative z-10 flex flex-col items-center text-center max-w-xs px-8">
                    {/* Logo */}
                    <div className="mb-8 h-16 w-16 flex items-center justify-center rounded-2xl bg-[#00f3ff]/8 border border-[#00f3ff]/15"
                        style={{ boxShadow: '0 0 40px rgba(0,243,255,0.1)' }}>
                        <Shield size={32} className="text-[#00f3ff]" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-[-0.02em] mb-2 uppercase">KavachX</h2>
                    <p className="text-[10px] font-bold text-[#00f3ff]/40 uppercase tracking-[0.4em] mb-6">Powered by AstraX</p>
                    <p className="text-xs text-gray-600 leading-relaxed mb-10">
                        Autonomous neural defense for critical infrastructure — securing Healthcare, Agriculture, and Urban sectors in real time.
                    </p>

                    {/* Stats — 2×2 grid, all same color */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        {[
                            { label: 'Threats Blocked', value: '2.8M+' },
                            { label: 'Sectors Active', value: '3' },
                            { label: 'Neural Uptime', value: '99.9%' },
                            { label: 'Avg Response', value: '14ms' },
                        ].map((s, i) => (
                            <div key={i} className="rounded-xl px-4 py-3.5 border border-white/5 text-center"
                                style={{ background: 'rgba(0,243,255,0.03)' }}>
                                <div className="text-lg font-black font-mono text-[#00f3ff] mb-0.5">{s.value}</div>
                                <div className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-700">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Live indicator */}
                    <div className="flex items-center gap-2 mt-8">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00f3ff] animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00f3ff]/50">Neural Grid Online</span>
                    </div>
                </div>

                {/* Corner HUDs */}
                <div className="absolute top-5 left-5 w-6 h-6 border-t border-l border-[#00f3ff]/15 rounded-tl" />
                <div className="absolute top-5 right-5 w-6 h-6 border-t border-r border-[#00f3ff]/15 rounded-tr" />
                <div className="absolute bottom-5 left-5 w-6 h-6 border-b border-l border-[#00f3ff]/15 rounded-bl" />
                <div className="absolute bottom-5 right-5 w-6 h-6 border-b border-r border-[#00f3ff]/15 rounded-br" />

                {/* Footer bar */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-5 py-3 border-t border-white/[0.04]">
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-800">KAVACHX // CLEARANCE ALPHA-4</span>
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-800">CLASSIFIED</span>
                </div>
            </div>

            {/* ── RIGHT: Form Panel ────────────────────────────── */}
            <div className="w-full lg:w-[520px] xl:w-[560px] flex flex-col items-center justify-center relative bg-[#020204] px-8 py-10 overflow-y-auto">

                {/* Mobile scanline */}
                <div className="lg:hidden absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
                <div className="cyber-scanline pointer-events-none lg:hidden" />

                {/* Mobile logo */}
                <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 relative z-10">
                    <Shield size={18} className="text-[#00f3ff]" />
                    <span className="font-black text-white tracking-[0.2em] uppercase text-sm">KavachX</span>
                </Link>

                {/* Tab toggle — clean, single accent */}
                <div className="w-full max-w-[400px] mb-7 relative z-10">
                    <div className="flex rounded-xl border border-white/8 bg-white/[0.02] p-1">
                        {[
                            { key: 'login', label: 'Sign In' },
                            { key: 'register', label: 'Register' },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => switchTo(tab.key)}
                                className="flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-300"
                                style={{
                                    background: activePanel === tab.key ? '#00f3ff' : 'transparent',
                                    color: activePanel === tab.key ? '#000' : 'rgba(255,255,255,0.3)',
                                    boxShadow: activePanel === tab.key ? '0 0 16px rgba(0,243,255,0.25)' : 'none',
                                }}
                                aria-pressed={activePanel === tab.key}
                                aria-label={`Switch to ${tab.label}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form card */}
                <div className="w-full max-w-[400px] relative z-10">
                    <div className="rounded-2xl border border-white/8 p-7 relative overflow-hidden"
                        style={{ background: 'rgba(3,5,14,0.85)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>

                        {/* Top accent line */}
                        <div className="absolute top-0 left-10 right-10 h-px"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,243,255,0.4), transparent)' }} />

                        <div key={activePanel} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {isLogin
                                ? <LoginForm onSwitch={() => switchTo('register')} />
                                : <RegisterForm onSwitch={() => switchTo('login')} />
                            }
                        </div>
                    </div>
                </div>

                <p className="text-[7px] font-bold text-gray-800 uppercase tracking-[0.4em] mt-7 text-center relative z-10">
                    © 2026 KavachX Advanced Systems
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
