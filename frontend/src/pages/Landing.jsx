import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield, Zap, Lock, ArrowRight, ShieldCheck, Activity, Cpu,
    Database, Network, Brain, Eye, Server, Radio, Terminal,
    TrendingUp, CheckCircle, ChevronRight, Globe, Heart, Leaf, Building2
} from 'lucide-react';

// ── Animated Particle Canvas ──────────────────────────────────────────────────
const ParticleCanvas = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let particles = [];
        const COUNT = 120;

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.size = Math.random() * 1.5 + 0.5;
                this.alpha = Math.random() * 0.5 + 0.2;
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,243,255,${this.alpha})`;
                ctx.fill();
            }
        }

        const init = () => { particles = []; for (let i = 0; i < COUNT; i++) particles.push(new Particle()); };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = 'rgba(0,243,255,0.04)';
            ctx.lineWidth = 1;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 130) {
                        ctx.globalAlpha = 1 - dist / 130;
                        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        };

        const onResize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; init(); };
        window.addEventListener('resize', onResize);
        init(); animate();
        return () => window.removeEventListener('resize', onResize);
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-40" />;
};

// ── Counter Animation Hook ────────────────────────────────────────────────────
const useCounter = (target, duration = 2000) => {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started) setStarted(true);
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [started]);
    useEffect(() => {
        if (!started) return;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [started, target, duration]);
    return [count, ref];
};

// ── Stat Counter Card ──────────────────────────────────────────────────────────
const StatCounter = ({ value, suffix = '', label }) => {
    const [count, ref] = useCounter(value);
    return (
        <div ref={ref} className="text-center min-w-0 px-4">
            <div className="text-4xl md:text-5xl font-black font-mono italic mb-2 text-white leading-none truncate">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">{label}</div>
        </div>
    );
};

const Landing = () => {
    return (
        <div className="min-h-screen bg-[#020204] text-white selection:bg-[#00f3ff]/30 overflow-x-hidden relative">
            <ParticleCanvas />
            <div className="cyber-scanline pointer-events-none" />

            {/* ══ NAV ══════════════════════════════════════════════════════════ */}
            <nav className="relative z-50 border-b border-[#00f3ff]/10 bg-black/50 backdrop-blur-xl sticky top-0">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20 shadow-[0_0_15px_rgba(0,243,255,0.2)] group-hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all duration-500">
                            <Shield size={24} className="animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-[0.2em] text-white neon-text-blue">KAVACHX</span>
                            <span className="text-[9px] font-bold text-[#00f3ff]/50 tracking-[0.4em] uppercase -mt-0.5">Powered by AstraX</span>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {['Platform', 'AstraX', 'Sectors', 'Intelligence'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#00f3ff] transition-all hover:-translate-y-0.5">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-[11px] font-bold uppercase tracking-widest text-[#00f3ff] hover:text-white transition-all">
                            Sign In
                        </Link>
                        <Link to="/register" className="relative group overflow-hidden rounded-lg bg-[#00f3ff] px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all hover:shadow-[0_0_25px_rgba(0,243,255,0.5)] active:scale-95">
                            <span className="relative z-10">Get Access</span>
                            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ══ HERO ═════════════════════════════════════════════════════════ */}
            <header id="platform" className="relative pt-28 pb-24 px-6 overflow-hidden z-10">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="inline-flex items-center gap-3 rounded-full border border-[#00f3ff]/20 bg-[#00f3ff]/5 px-6 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#00f3ff] animate-in fade-in slide-in-from-top-4 duration-1000">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f3ff] opacity-60" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f3ff]" />
                            </span>
                            Neural Defense Grid — Active
                        </div>

                        <h1 className="text-6xl md:text-[110px] font-black tracking-tighter mb-4 leading-[0.85] text-white animate-in zoom-in-95 duration-1000">
                            FIGHT <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(0,243,255,0.25)' }}>THE</span><br />
                            <span className="text-[#00f3ff] neon-text-blue animate-glitch">INVISIBLE</span>
                        </h1>

                        <p className="mx-auto max-w-2xl text-base text-gray-400 font-medium leading-relaxed animate-in fade-in duration-1000 delay-300">
                            KavachX is the autonomous neural defense framework for critical infrastructure.
                            Powered by <span className="text-[#00f3ff] font-bold">AstraX</span> — our proprietary deep-learning anomaly engine —
                            safeguarding <span className="text-white">Healthcare</span>, <span className="text-white">Agriculture</span>, and <span className="text-white">Urban Grids</span> in real time.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6 animate-in slide-in-from-bottom-8 duration-1000 delay-500">
                            <Link to="/register" className="flex items-center gap-3 rounded-xl bg-[#00f3ff] px-10 py-4 text-sm font-black uppercase tracking-widest text-black shadow-2xl shadow-[#00f3ff]/20 hover:scale-105 transition-all group active:scale-95">
                                Build Resilience <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/login" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all border-b-2 border-b-[#00f3ff]/40">
                                Command Center
                            </Link>
                        </div>

                        {/* Hero Stats */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl animate-in fade-in duration-1000 delay-700">
                            {[
                                { label: 'Network Latency', value: '14.2ms' },
                                { label: 'Threat Suppression', value: '99.9%' },
                                { label: 'Sensor Overrides', value: '0 Active' },
                            ].map((item, i) => (
                                <div key={i} className="glass p-5 rounded-2xl border border-white/5 flex flex-col items-center space-y-2">
                                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">{item.label}</span>
                                    <span className="text-2xl font-black text-white leading-none tracking-tighter">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Glow orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none -z-10"
                    style={{ background: 'radial-gradient(ellipse, rgba(0,243,255,0.05) 0%, transparent 70%)' }} />
            </header>

            {/* ══ THREAT STATS ═════════════════════════════════════════════════ */}
            <section className="py-20 px-6 relative z-10 border-y border-white/5 bg-black/70">
                <div className="mx-auto max-w-5xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 overflow-hidden">
                        <StatCounter value={2847391} suffix="+" label="Attacks Neutralized" />
                        <StatCounter value={99} suffix=".9%" label="Uptime SLA" />
                        <StatCounter value={3} label="Sectors Protected" />
                        <StatCounter value={14} suffix="ms" label="Avg Response Time" />
                    </div>
                </div>
            </section>

            {/* ══ ASTRAX ENGINE ════════════════════════════════════════════════ */}
            <section id="astrax" className="py-32 px-6 relative z-10">
                <div className="mx-auto max-w-7xl">
                    {/* Section header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div>
                            <span className="text-[#2176ff] font-black text-[10px] uppercase tracking-[0.4em] mb-3 block">Core Intelligence Engine</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                Meet <span className="text-[#2176ff]" style={{ textShadow: '0 0 20px rgba(33,118,255,0.5)' }}>AstraX</span>
                            </h2>
                            <p className="text-gray-500 mt-4 max-w-xl leading-relaxed text-sm">
                                AstraX is the autonomous neural anomaly detection engine at the heart of KavachX.
                                Trained on millions of industrial sensor events, it classifies threats with sub-second precision.
                            </p>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#2176ff]/30 to-transparent hidden md:block mb-3" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        {/* Engine visual */}
                        <div className="relative flex items-center justify-center py-10">
                            {/* Outer rings */}
                            <div className="absolute w-64 h-64 rounded-full border border-[#2176ff]/15 animate-spin" style={{ animationDuration: '20s' }} />
                            <div className="absolute w-48 h-48 rounded-full border border-[#00f3ff]/15 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
                            <div className="absolute w-32 h-32 rounded-full border border-[#00f3ff]/10 animate-spin" style={{ animationDuration: '8s' }} />
                            {/* Dots on rings */}
                            <div className="absolute w-64 h-64 rounded-full" style={{ animation: 'spin 20s linear infinite' }}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#2176ff] shadow-[0_0_8px_#2176ff]" />
                            </div>
                            <div className="absolute w-48 h-48 rounded-full" style={{ animation: 'spin 12s linear infinite reverse' }}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]" />
                            </div>
                            {/* Core */}
                            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2176ff]/10 border border-[#2176ff]/30 shadow-[0_0_40px_rgba(33,118,255,0.3)]">
                                <Brain size={36} className="text-[#2176ff] animate-pulse" />
                            </div>
                            {/* Floating labels */}
                            {[
                                { label: 'DDoS', color: '#ff003c', pos: '-top-4 left-4' },
                                { label: 'Phishing', color: '#ff9900', pos: '-top-4 right-4' },
                                { label: 'Injection', color: '#2176ff', pos: '-bottom-4 left-8' },
                                { label: 'Anomaly', color: '#00f3ff', pos: '-bottom-4 right-8' },
                            ].map(f => (
                                <div key={f.label} className={`absolute ${f.pos} text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border`}
                                    style={{ color: f.color, borderColor: `${f.color}40`, background: `${f.color}12` }}>
                                    {f.label}
                                </div>
                            ))}
                        </div>

                        {/* Feature list */}
                        <div className="space-y-5">
                            {[
                                {
                                    icon: <Brain className="text-[#2176ff]" size={24} />,
                                    title: 'Deep Neural Classification',
                                    desc: 'Multi-layer LSTM + transformer architecture processes raw sensor telemetry and classifies attack vectors — DDoS, Phishing, Port Scan, Injection, Ransomware, Anomaly — with 99.3% accuracy.',
                                    color: '#2176ff'
                                },
                                {
                                    icon: <Activity className="text-[#00f3ff]" size={24} />,
                                    title: 'Behavioral Fingerprinting',
                                    desc: 'Establishes a dynamic baseline for each sector\'s network behavior. Any statistical deviation from the norm triggers AstraX\'s anomaly cascade.',
                                    color: '#00f3ff'
                                },
                                {
                                    icon: <Zap className="text-[#00a8ff]" size={24} />,
                                    title: 'Zero-Day Response Protocol',
                                    desc: 'Autonomous IP quarantine and circuit-break sequences engage within milliseconds of detection — before signatures are even published.',
                                    color: '#00a8ff'
                                },
                                {
                                    icon: <Eye className="text-[#ff9900]" size={24} />,
                                    title: 'Explainability Layer (XAI)',
                                    desc: 'Every prediction comes with a human-readable explanation — what triggered it, which features spiked, and the confidence score.',
                                    color: '#ff9900'
                                },
                            ].map((f, i) => (
                                <div key={i} className="glass group p-5 rounded-2xl border border-white/5 hover:border-white/15 transition-all duration-500 flex gap-4 items-start cursor-default">
                                    <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl" style={{ background: `${f.color}12`, border: `1px solid ${f.color}25` }}>
                                        {f.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white text-sm mb-1 tracking-tight">{f.title}</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ HOW IT WORKS ═════════════════════════════════════════════════ */}
            <section className="py-28 px-6 relative z-10 bg-black/50">
                <div className="mx-auto max-w-5xl">
                    <div className="text-center mb-16">
                        <span className="text-[#00f3ff] font-black text-[10px] uppercase tracking-[0.4em] mb-3 block">Defense Lifecycle</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white">How It Works</h2>
                    </div>

                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#00f3ff]/20 via-[#2176ff]/20 to-transparent -translate-x-1/2 hidden md:block" />

                        <div className="space-y-10">
                            {[
                                { step: '01', title: 'Sensor Ingestion', desc: 'Raw telemetry streams from IoT sensors, network probes, and system monitors across all three sectors flow into KavachX\'s ingestion pipeline at sub-millisecond intervals.', icon: <Radio size={20} />, color: '#00f3ff', side: 'left' },
                                { step: '02', title: 'AstraX Detection', desc: 'The neural engine processes each packet through its classification model — identifying attack vectors, anomalies, and lateral movement with explainable confidence scores.', icon: <Brain size={20} />, color: '#2176ff', side: 'right' },
                                { step: '03', title: 'Threat Classification', desc: 'Detected events are categorized by type (DDoS, Phishing, Ransomware, etc.), severity (LOW → HIGH), and sector origin — then logged to the immutable audit trail.', icon: <Terminal size={20} />, color: '#ff9900', side: 'left' },
                                { step: '04', title: 'Autonomous Response', desc: 'If the risk score exceeds threshold, the Autonomous Resilience Engine (A.R.E.) fires — quarantining IPs, alerting sector owners, and triggering circuit-breaks.', icon: <Zap size={20} />, color: '#ff003c', side: 'right' },
                                { step: '05', title: 'Intelligence Dossier', desc: 'Sector operators receive a cryptographically signed intelligence dossier: health score, threat indicators, CVE exposure, and executive summary — ready to act on.', icon: <Database size={20} />, color: '#00a8ff', side: 'left' },
                            ].map((item, i) => (
                                <div key={i} className={`flex ${item.side === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} flex-col items-center gap-6 md:gap-12`}>
                                    <div className="md:flex-1 relative rounded-2xl border border-white/8 hover:border-white/20 transition-all duration-500 overflow-hidden group"
                                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        {/* Colored top accent bar */}
                                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                                            style={{ background: `linear-gradient(90deg, ${item.color}60, ${item.color}20, transparent)` }} />
                                        <div className="p-6 flex items-start gap-4">
                                            <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl"
                                                style={{ background: `${item.color}12`, border: `1px solid ${item.color}25`, color: item.color }}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: `${item.color}80` }}>Step {item.step}</div>
                                                <h3 className="font-black text-white text-sm mb-1.5">{item.title}</h3>
                                                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Center badge */}
                                    <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 z-10"
                                        style={{ borderColor: item.color, background: '#020204', color: item.color, boxShadow: `0 0 20px ${item.color}30` }}>
                                        <span className="font-black text-xs">{item.step}</span>
                                    </div>
                                    <div className="md:flex-1 hidden md:block" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ SECTORS PROTECTED ════════════════════════════════════════════ */}
            <section id="sectors" className="py-32 px-6 relative z-10">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div>
                            <span className="text-[#39ff14] font-black text-[10px] uppercase tracking-[0.4em] mb-3 block">Critical Domains</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white">Sectors Protected</h2>
                            <p className="text-gray-500 mt-4 max-w-lg text-sm leading-relaxed">
                                KavachX provides dedicated neural shielding across three mission-critical infrastructure domains.
                            </p>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#39ff14]/30 to-transparent hidden md:block mb-3" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Heart size={40} className="text-[#ff003c]" />,
                                title: 'Healthcare Grid',
                                code: 'SECTOR-HC',
                                desc: 'Hospital networks, patient data systems, medical IoT devices, and critical care infrastructure. Any breach here is life-threatening — AstraX operates with zero-tolerance thresholds.',
                                stats: [
                                    { label: 'Devices Monitored', value: '12,400+' },
                                    { label: 'Threats Blocked', value: '94,211' },
                                    { label: 'Response Time', value: '8ms avg' },
                                ],
                                color: '#ff003c',
                                border: 'hover:border-[#ff003c]/40',
                            },
                            {
                                icon: <Leaf size={40} className="text-[#39ff14]" />,
                                title: 'Agricultural Network',
                                code: 'SECTOR-AG',
                                desc: 'Smart irrigation, drone fleet management, soil sensor grids, supply chain logistics, and food processing automation. Disruption here cascades to national food security.',
                                stats: [
                                    { label: 'Sensor Nodes', value: '8,900+' },
                                    { label: 'Threats Blocked', value: '51,780' },
                                    { label: 'Uptime', value: '99.97%' },
                                ],
                                color: '#39ff14',
                                border: 'hover:border-[#39ff14]/40',
                            },
                            {
                                icon: <Building2 size={40} className="text-[#00f3ff]" />,
                                title: 'Urban Infrastructure',
                                code: 'SECTOR-UR',
                                desc: 'Power grids, smart city platforms, traffic management, water treatment systems, and emergency services communication networks — the backbone of every modern city.',
                                stats: [
                                    { label: 'Grid Nodes', value: '23,100+' },
                                    { label: 'Threats Blocked', value: '218,430' },
                                    { label: 'Avg Detection', value: '14ms' },
                                ],
                                color: '#00f3ff',
                                border: 'hover:border-[#00f3ff]/40',
                            },
                        ].map((sector, i) => (
                            <div key={i} className={`glass group p-8 rounded-3xl border border-white/5 ${sector.border} transition-all duration-700 relative overflow-hidden`}>
                                {/* Ghost glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at top right, ${sector.color}, transparent 60%)` }} />
                                <div className="absolute top-4 right-4 opacity-[9px] font-black uppercase tracking-[0.25em] px-2 py-0.5 rounded border text-[8px]"
                                    style={{ color: sector.color, borderColor: `${sector.color}30`, background: `${sector.color}10` }}>
                                    {sector.code}
                                </div>

                                <div className="mb-6 h-16 w-16 flex items-center justify-center rounded-2xl"
                                    style={{ background: `${sector.color}12`, border: `1px solid ${sector.color}25` }}>
                                    {sector.icon}
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{sector.title}</h3>
                                <p className="text-gray-500 text-xs leading-relaxed mb-6">{sector.desc}</p>

                                <div className="space-y-2 border-t border-white/5 pt-5">
                                    {sector.stats.map((s, si) => (
                                        <div key={si} className="flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-600">{s.label}</span>
                                            <span className="text-xs font-black font-mono" style={{ color: sector.color }}>{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ CORE CAPABILITIES ════════════════════════════════════════════ */}
            <section id="intelligence" className="py-28 px-6 relative z-10 bg-black/60">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-[#00f3ff] font-black text-[10px] uppercase tracking-[0.4em] mb-3 block">Defense Layers</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white">Advanced Core Capabilities</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Neural Anomaly Engine',
                                desc: 'Proprietary ML models trained on real industrial sensor data identify sub-second irregularities across all monitored domains.',
                                icon: <Database className="text-[#00f3ff]" size={32} />, color: '#00f3ff',
                                features: ['LSTM + Transformer', '6 Attack Vectors', 'Real-time inference'],
                            },
                            {
                                title: 'Infrastructure Hardening',
                                desc: 'Deep kernel-level monitoring for CPU, RAM and I/O pipelines across distributed networks with automated circuit-breaking.',
                                icon: <Network className="text-[#39ff14]" size={32} />, color: '#39ff14',
                                features: ['Kernel telemetry', 'Auto circuit-break', 'Zero-trust posture'],
                            },
                            {
                                title: 'Autonomous Lockdown',
                                desc: 'AI-driven IP isolation protocols that engage within milliseconds of detection — no human latency in the critical path.',
                                icon: <ShieldCheck className="text-[#00a8ff]" size={32} />, color: '#00a8ff',
                                features: ['<15ms response', 'IP quarantine', 'A.R.E. certified'],
                            }
                        ].map((f, i) => (
                            <div key={i} className="glass group p-10 rounded-3xl border border-white/5 hover:border-white/15 transition-all duration-700 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at top right, ${f.color}, transparent 60%)` }} />
                                <div className="mb-8 h-16 w-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-all duration-500"
                                    style={{ background: `${f.color}10`, border: `1px solid ${f.color}20` }}>
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-black mb-4 text-white tracking-tight">{f.title}</h3>
                                <p className="text-gray-500 text-xs leading-relaxed mb-6">{f.desc}</p>
                                <div className="flex flex-col gap-2">
                                    {f.features.map(feat => (
                                        <div key={feat} className="flex items-center gap-2">
                                            <CheckCircle size={12} style={{ color: f.color }} />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ KAVACHX vs TRADITIONAL ═══════════════════════════════════════ */}
            <section className="py-24 px-6 relative z-10">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center mb-14">
                        <span className="text-[#00f3ff] font-black text-[10px] uppercase tracking-[0.4em] mb-3 block">Competitive Edge</span>
                        <h2 className="text-4xl font-black text-white mb-4">KavachX vs Traditional SIEM</h2>
                        <p className="text-gray-600 text-sm max-w-lg mx-auto">See why KavachX outperforms legacy security solutions across every critical dimension.</p>
                    </div>

                    {/* 2-column layout: KavachX advantages on left, SIEM weaknesses on right */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left — KavachX */}
                        <div className="rounded-3xl border border-[#00f3ff]/15 overflow-hidden"
                            style={{ background: 'linear-gradient(160deg, rgba(0,243,255,0.04) 0%, rgba(33,118,255,0.03) 100%)' }}>
                            <div className="px-7 py-5 border-b border-[#00f3ff]/10 flex items-center gap-3">
                                <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#00f3ff]/10 border border-[#00f3ff]/20">
                                    <Shield size={16} className="text-[#00f3ff]" />
                                </div>
                                <div>
                                    <div className="font-black text-[#00f3ff] text-sm uppercase tracking-wider">KavachX</div>
                                    <div className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.3em]">Neural Defense Platform</div>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                {[
                                    { label: 'Detection Latency', value: '<15ms', icon: <Zap size={14} /> },
                                    { label: 'Zero-Day Coverage', value: 'Behavioral AI', icon: <Brain size={14} /> },
                                    { label: 'Explainability', value: 'Full XAI output', icon: <Eye size={14} /> },
                                    { label: 'Autonomous Response', value: 'Yes — A.R.E.', icon: <ShieldCheck size={14} /> },
                                    { label: 'Sector Intelligence', value: 'Dossier + Email', icon: <Database size={14} /> },
                                    { label: 'False Positive Rate', value: '<0.1%', icon: <Activity size={14} /> },
                                ].map(({ label, value, icon }) => (
                                    <div key={label} className="flex items-center justify-between rounded-xl px-4 py-3 group transition-all"
                                        style={{ background: 'rgba(0,243,255,0.04)', border: '1px solid rgba(0,243,255,0.08)' }}>
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-[#00f3ff]/50">{icon}</span>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle size={11} className="text-[#00f3ff]" />
                                            <span className="text-[11px] font-black text-[#00f3ff]">{value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — Traditional SIEM */}
                        <div className="rounded-3xl border border-white/8 overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.015)' }}>
                            <div className="px-7 py-5 border-b border-white/6 flex items-center gap-3">
                                <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10">
                                    <Server size={16} className="text-gray-500" />
                                </div>
                                <div>
                                    <div className="font-black text-gray-500 text-sm uppercase tracking-wider">Traditional SIEM</div>
                                    <div className="text-[8px] font-bold text-gray-700 uppercase tracking-[0.3em]">Legacy Security Operations</div>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                {[
                                    { label: 'Detection Latency', value: '10–60 min' },
                                    { label: 'Zero-Day Coverage', value: 'Signature-based only' },
                                    { label: 'Explainability', value: 'None' },
                                    { label: 'Autonomous Response', value: 'Manual only' },
                                    { label: 'Sector Intelligence', value: 'Static reports' },
                                    { label: 'False Positive Rate', value: '30–40%' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between rounded-xl px-4 py-3"
                                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{label}</span>
                                        <span className="text-[11px] font-bold text-gray-600 line-through">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ CTA ══════════════════════════════════════════════════════════ */}
            <section className="py-32 px-6 relative overflow-hidden z-10">
                <div className="absolute inset-0 bg-gradient-to-t from-[#00f3ff]/8 to-transparent pointer-events-none" />
                <div className="mx-auto max-w-4xl glass p-16 md:p-20 rounded-[3rem] text-center border-t-2 border-[#00f3ff]/25 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-1.5 bg-black border border-[#00f3ff]/30 rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-[#00f3ff]">
                        System Ready
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        PROTECT YOUR <br /><span className="text-[#00f3ff] neon-text-blue">LEGACY</span>
                    </h2>
                    <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto leading-relaxed">
                        Deploy KavachX across your critical infrastructure in minutes. AstraX starts learning your network baseline immediately.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="w-full sm:w-auto bg-[#00f3ff] text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white transition-all shadow-[#00f3ff]/20 shadow-2xl active:scale-95">
                            Initialize Defense
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto glass text-[#00f3ff] border border-[#00f3ff]/20 px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:border-[#00f3ff]/50 transition-all">
                            Access Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
            <footer className="border-t border-white/5 py-16 px-6 relative z-10 bg-black">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield size={24} className="text-[#00f3ff]" />
                                <span className="font-black text-xl tracking-[0.2em]">KAVACHX</span>
                            </div>
                            <p className="text-gray-600 text-xs leading-relaxed max-w-xs">
                                Autonomous neural defense for critical infrastructure. Powered by AstraX — the next generation of cyber resilience.
                            </p>
                            <div className="flex items-center gap-3 mt-5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#39ff14] animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#39ff14]">All Systems Operational</span>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">Platform</h4>
                            {['Dashboard', 'AstraX Engine', 'Threat Intelligence', 'Sector Reports'].map(l => (
                                <div key={l}><a href="#" className="text-[11px] text-gray-600 hover:text-[#00f3ff] transition-colors block mb-2 font-medium">{l}</a></div>
                            ))}
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">Legal</h4>
                            {['Privacy Policy', 'Terms of Access', 'Audit Logs', 'GDPR Compliance'].map(l => (
                                <div key={l}><a href="#" className="text-[11px] text-gray-600 hover:text-[#00f3ff] transition-colors block mb-2 font-medium">{l}</a></div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-700 text-[9px] font-bold uppercase tracking-[0.5em]">© 2026 KavachX Advanced Systems · Powered by AstraX Neural Engine</p>
                        <p className="text-gray-700 text-[9px] font-bold uppercase tracking-[0.3em]">ALPHA-4 CLEARANCE · CLASSIFIED</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
