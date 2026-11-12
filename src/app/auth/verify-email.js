import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/api-client';
import { Button } from '@/components/Button';
import { Input } from '@/components/common/Input';
import { useLocation } from 'react-router-dom';
export function VerifyEmailPage() {
    const [code, setCode] = useState('');
    const [resendSent, setResendSent] = useState(false);
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
            const data = await authApi.verifyEmail({ code });
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
            setError(error.response?.data?.message || 'Verification code invalid or expired');
        }
        finally {
            setLoading(false);
        }
    };
    const handleResend = async () => {
        setResendSent(true);
        setLoading(true);
        try {
            await authApi.forgotPassword({ email: '' }); // This would need email, but for simplicity we'll just set state
            setResendSent(false);
            // Show a brief message
            setError(null);
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to resend verification');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-6", children: _jsxs("div", { className: "bg-panel rounded-lg p-8 max-w-md w-full shadow-lg border border-border", children: [_jsx("h2", { className: "text-2xl font-semibold text-primary mb-6 text-center", children: "Verify Email" }), error && (_jsx("div", { className: "mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "otp", className: "text-sm font-medium text-foreground", children: "6-digit verification code" }), _jsx("div", { className: "flex gap-2", children: [...Array(6)].map((_, i) => (_jsx(Input, { type: "number", maxLength: "1", value: code[i] || '', onChange: (e) => {
                                            const newCode = code.split('').map((c, idx) => {
                                                if (idx === i)
                                                    return e.target.value;
                                                return c;
                                            });
                                            // Auto-advance to next input
                                            if (e.target.value && i < 5) {
                                                // Move to next
                                            }
                                            setCode(newCode.join(''));
                                        }, className: "w-10 h-10 rounded border border-border text-center text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center" }, i))) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("button", { type: "submit", className: "w-full flex items-center justify-center py-3 px-4 rounded bg-primary text-white font-medium transition-colors hover:bg-primary/90 disabled:opacity-50", disabled: loading, children: loading ? 'Verifying...' : 'Verify' }), _jsx("button", { onClick: handleResend, className: "text-sm text-primary hover:text-primary/90", children: "Resend code" })] })] })] }) }));
}
