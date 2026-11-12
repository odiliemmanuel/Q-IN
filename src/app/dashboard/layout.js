import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useLocation, useOutlet } from 'react-router-dom';
import { Button } from '@/components/Button';
export function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, role, logout } = useAuthStore();
    const { toggleSidebar, theme, setTheme } = useUIStore();
    const outlet = useOutlet();
    // Handle logout
    const handleLogout = () => {
        logout();
        navigate('/auth/login', { replace: true });
    };
    // Check if user is authenticated
    if (!user) {
        return null; // Should not happen with route protection
    }
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, { toggleSidebar: toggleSidebar, theme: theme, setTheme: setTheme, user: user, onLogout: handleLogout }), _jsxs("main", { className: "flex min-h-[calc(100vh-64px)]", children: [_jsx(Sidebar, { sidebarOpen: useUIStore.getState().sidebarOpen, setSidebarOpen: toggleSidebar, role: role }), _jsx("div", { className: "flex-1 flex flex-col p-6 overflow-y-auto", children: outlet })] })] }));
}
