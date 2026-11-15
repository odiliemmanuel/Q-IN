import { api } from './client'
import { API_ENDPOINTS } from './config'

export interface UpdatePasswordRequest {
  oldPassword: string
  newPassword: string
}

export const usersApi = {
  async uploadCaricature(userId: string, file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload<void>(API_ENDPOINTS.users.caricature(userId), formData)
  },

  async updatePassword(data: UpdatePasswordRequest): Promise<void> {
    return api.patch<void>(API_ENDPOINTS.users.updatePassword, data)
  },
}