import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LayoutDashboard, AlertTriangle, BarChart3, Settings, LogOut, Crosshair } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { to: '/alerts', label: 'Alerts', icon: <AlertTriangle size={18} /> },
        { to: '/metrics', label: 'System Metrics', icon: <BarChart3 size={18} /> },
        { to: '/astraxfront', label: 'AstraX', icon: <Crosshair size={18} style={{ color: '#ff003c' }} /> },
        ...(user?.role === 'ADMIN' ? [{ to: '/settings', label: 'Settings', icon: <Settings size={18} /> }] : []),
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-[#00f3ff]/10 bg-black/60 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3 font-black text-white group cursor-pointer">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                        <Shield size={22} className="group-hover:animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm tracking-[0.2em] neon-text-blue">CYBER-RESILIENT</span>
                        <span className="text-[8px] text-[#00f3ff]/50 uppercase tracking-[0.3em] -mt-1 font-bold">Secure Core</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20 shadow-[0_0_10px_rgba(0,243,255,0.1)]' : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {React.cloneElement(item.icon, { size: 16 })}
                            <span className="hidden md:inline-block">{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-3 lg:flex">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">{user?.name}</span>
                            <span className="text-[8px] text-[#00f3ff] uppercase tracking-[0.2em] font-bold">{user?.role}</span>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 flex items-center justify-center text-[#00f3ff] font-black shadow-[0_0_15px_rgba(0,243,255,0.1)]">
                            {user?.name?.charAt(0)}
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="rounded-xl p-2.5 text-gray-500 hover:bg-[#ff003c]/10 hover:text-[#ff003c] transition-all border border-transparent hover:border-[#ff003c]/20"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
