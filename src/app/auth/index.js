import { jsx as _jsx } from "react/jsx-runtime";
import { Route } from 'react-router-dom';
import { LoginPage } from './login';
import { RegisterPage } from './register';
import { VerifyEmailPage } from './verify-email';
import { ForgotPasswordPage } from './forgot-password';
export const AuthRoutes = [
    {
        path: '/auth/login',
        element: _jsx(LoginPage, {}),
        metadata: { title: 'Sign In' },
    },
    {
        path: '/auth/register',
        element: _jsx(RegisterPage, {}),
        metadata: { title: 'Create Account' },
    },
    {
        path: '/auth/verify-email',
        element: _jsx(VerifyEmailPage, {}),
        metadata: { title: 'Verify Email' },
    },
    {
        path: '/auth/forgot-password',
        element: _jsx(ForgotPasswordPage, {}),
        metadata: { title: 'Forgot Password' },
    },
];
