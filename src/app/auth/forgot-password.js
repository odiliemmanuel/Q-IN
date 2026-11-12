import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api-client';
import { Button } from '@/components/Button';
import { Input } from '@/components/common/Input';
export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await authApi.forgotPassword({ email });
            // Show success message - in a real app, show a proper alert
            setError('A password reset link has been sent to your email');
            navigate('/auth/reset-password', { state: { token: 'placeholder' } });
        }
        catch (error) {
            setError(error.response?.data?.message || 'Failed to send reset link');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-6", children: _jsxs("div", { className: "bg-panel rounded-lg p-8 max-w-md w-full shadow-lg border border-border", children: [_jsx("h2", { className: "text-2xl font-semibold text-primary mb-6 text-center", children: "Forgot Password" }), error && (_jsx("div", { className: "mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "email", className: "text-sm font-medium text-foreground", children: "Email" }), _jsx(Input, { id: "email", type: "email", placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsx("button", { type: "submit", className: "w-full flex items-center justify-center py-3 px-4 rounded bg-primary text-white font-medium transition-colors hover:bg-primary/90 disabled:opacity-50", disabled: loading, children: loading ? 'Sending...' : 'Send Reset Link' })] })] }) }));
}
