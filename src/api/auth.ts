import { api, type ApiResponse } from './client'
import { API_ENDPOINTS } from './config'

export interface LoginRequest {
  userIdentifier: string
  pin: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  userId: string
  role: string
  message: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  userName: string
  pin: string
  email: string
  phoneNumber: string
  whatsappNumber: string
  gender: 'MALE' | 'FEMALE'
  cohortId: string
}

export interface RegisterResponse {
  userId: string
  message: string
  successFull: boolean
}

export interface VerifyEmailRequest {
  email: string
  otp: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
  data: string
}

export interface VerifyEmailAndLoginResponse {
  accessToken: string
  refreshToken: string
  userId: string
  role: string
  message: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  userId: string
  role: string
  message: string
}

export interface LogoutResponse {
  message: string
  success: boolean
}

export interface ResendVerificationRequest {
  email: string
}

export interface UpdatePasswordRequest {
  oldPassword: string
  newPassword: string
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>(API_ENDPOINTS.auth.login, credentials, false)
  },

  async adminLogin(credentials: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>(API_ENDPOINTS.auth.adminLogin, credentials, false)
  },

  async superAdminLogin(credentials: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>(API_ENDPOINTS.auth.superAdminLogin, credentials, false)
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return api.post<RegisterResponse>(API_ENDPOINTS.auth.register, data, false)
  },

  async verifyEmail(params: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const query = new URLSearchParams({ email: params.email, otp: params.otp }).toString()
    return api.get<VerifyEmailResponse>(`${API_ENDPOINTS.auth.verifyEmail}?${query}`, false)
  },

  async verifyEmailAndLogin(params: VerifyEmailRequest): Promise<VerifyEmailAndLoginResponse> {
    const query = new URLSearchParams({ email: params.email, otp: params.otp }).toString()
    return api.post<VerifyEmailAndLoginResponse>(`${API_ENDPOINTS.auth.verifyEmailAndLogin}?${query}`, {}, false)
  },

  async resendVerification(email: string): Promise<ApiResponse<string>> {
    const query = new URLSearchParams({ email }).toString()
    return api.post<ApiResponse<string>>(`${API_ENDPOINTS.auth.resendVerification}?${query}`, {}, false)
  },

  async forgotPassword(email: string): Promise<ApiResponse<string>> {
    const query = new URLSearchParams({ email }).toString()
    return api.post<ApiResponse<string>>(`${API_ENDPOINTS.auth.forgotPassword}?${query}`, {}, false)
  },

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<string>> {
    const query = new URLSearchParams({ token, newPassword }).toString()
    return api.post<ApiResponse<string>>(`${API_ENDPOINTS.auth.resetPassword}?${query}`, {}, false)
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const query = new URLSearchParams({ refreshToken }).toString()
    return api.post<RefreshTokenResponse>(`${API_ENDPOINTS.auth.refreshToken}?${query}`, {}, false)
  },

  async logout(): Promise<LogoutResponse> {
    return api.post<LogoutResponse>(API_ENDPOINTS.auth.logout)
  },

  async updatePassword(data: UpdatePasswordRequest): Promise<ApiResponse<string>> {
    return api.patch<ApiResponse<string>>(API_ENDPOINTS.auth.updatePassword, data)
  },
}