import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import AlertDetails from './pages/AlertDetails';
import SystemMetrics from './pages/SystemMetrics';
import Settings from './pages/Settings';
import AstraXfront from './pages/AstraXfront';
import Navbar from './components/Navbar';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#020204] text-[#00f3ff] cyber-grid">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#00f3ff]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Initializing Neural Link...</span>
        </div>
    );
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-background text-white">
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/verify-otp" element={<VerifyOTP />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        
                        {/* Simulation Tool - Unprotected for dev ease */}
                        <Route path="/astraxfront" element={<AstraXfront />} />

                        {/* Protected App Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                        <Route path="/alerts" element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />
                        <Route path="/alerts/:id" element={<ProtectedRoute><Layout><AlertDetails /></Layout></ProtectedRoute>} />
                        <Route path="/metrics" element={<ProtectedRoute><Layout><SystemMetrics /></Layout></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><Settings /></Layout></ProtectedRoute>} />

                        {/* Catch-all redirect to Landing */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
