import { api } from './client'
import { API_ENDPOINTS } from './config'

export const usersApi = {
  async uploadProfilePicture(userId: string, file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload<void>(API_ENDPOINTS.users.profilePicture(userId), formData)
  },

  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    return api.patch<void>(API_ENDPOINTS.auth.updatePassword, { oldPassword, newPassword })
  },
}