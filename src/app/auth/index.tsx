import { Route } from 'react-router-dom'
import { LoginPage } from './login'
import { RegisterPage } from './register'
import { VerifyEmailPage } from './verify-email'
import { ForgotPasswordPage } from './forgot-password'

export const AuthRoutes: Route[] = [
  {
    path: '/auth/login',
    element: <LoginPage />,
    metadata: { title: 'Sign In' },
  },
  {
    path: '/auth/register',
    element: <RegisterPage />,
    metadata: { title: 'Create Account' },
  },
  {
    path: '/auth/verify-email',
    element: <VerifyEmailPage />,
    metadata: { title: 'Verify Email' },
  },
  {
    path: '/auth/forgot-password',
    element: <ForgotPasswordPage />,
    metadata: { title: 'Forgot Password' },
  },
]