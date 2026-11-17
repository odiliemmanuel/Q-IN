export const ROUTES = {
  landing: '/',
  login: '/login',
  adminLogin: '/admin/login',
  verifyEmail: '/verify-email',
  dashboard: '/app/dashboard',
} as const

export function redirectToLogin(): void {
  if (typeof window !== 'undefined' && window.location.pathname !== ROUTES.login) {
    window.location.replace(ROUTES.login)
  }
}
