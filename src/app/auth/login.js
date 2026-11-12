import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/api-client';
import { Button } from '@/components/Button';
import { Input } from '@/components/common/Input';
import { useLocation } from 'react-router-dom';
export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const redirectFrom = location.state?.redirect || '/dashboard/cohorts/queues';
    const setUser = useAuthStore(state => state.setUser);
    const setTokens = useAuthStore(state => state.setTokens);
    const setRole = useAuthStore(state => state.setRole);
    const setAuthenticated = useAuthStore(state => state.setAuthenticated);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await authApi.login({ email, password });
            setTokens(data.tokens || data);
            const user = {
                id: data.user?.id || data.id,
                name: data.user?.name || data.name || '',
                email: data.user?.email || data.email || '',
                role: data.user?.role || data.role || 'NATIVE',
                emailVerified: data.user?.emailVerified || data.emailVerified || false,
                createdAt: data.user?.createdAt || data.createdAt || new Date().toISOString(),
            };
            setUser(user);
            setRole(data.user?.role || data.role || 'NATIVE');
            setAuthenticated(true);
            // Navigate based on role
            let redirectPath = redirectFrom;
            if (role === 'SUPER_ADMIN') {
                redirectPath = '/dashboard/super-admin';
            }
            else if (role === 'ADMIN') {
                redirectPath = '/dashboard/admin';
            }
            else if (role === 'NATIVE') {
                redirectPath = '/dashboard/cohorts/queues';
            }
            navigate(redirectPath, { replace: true });
        }
        catch (error) {
            setError(error.response?.data?.message || 'Login failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-6", children: _jsxs("div", { className: "bg-panel rounded-lg p-8 max-w-md w-full shadow-lg border border-border", children: [_jsx("h2", { className: "text-2xl font-semibold text-primary mb-6 text-center", children: "Sign In" }), error && (_jsx("div", { className: "mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "email", className: "text-sm font-medium text-foreground", children: "Email" }), _jsx(Input, { id: "email", type: "email", placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), disabled: loading })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "password", className: "text-sm font-medium text-foreground", children: "Password" }), _jsx(Input, { id: "password", type: "password", placeholder: "Enter your password", value: password, onChange: (e) => setPassword(e.target.value), disabled: loading })] }), _jsx("button", { type: "submit", className: "w-full flex items-center justify-center py-3 px-4 rounded bg-primary text-white font-medium transition-colors hover:bg-primary/90 disabled:opacity-50", disabled: loading, children: loading ? 'Signing in...' : 'Sign In' })] }), _jsx("div", { className: "mt-6 text-center text-sm", children: _jsx("a", { href: "/auth/register", className: "underline text-primary hover:text-primary/90", children: "Create account" }) })] }) }));
}
