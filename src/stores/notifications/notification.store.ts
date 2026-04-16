import type { Notification } from '@/interfaces/notifications/notification.interface'
import type { BaseResponse } from '@/interfaces/base-response.interface'

import { defineStore } from 'pinia'
import axios from 'axios'
import { toast } from 'vue-sonner'
import { getAuthToken } from '@/lib/auth'

const baseAccountUrl = `${import.meta.env.VITE_API_URL}/notifications`

function getAuthHeaders() {
  const token = getAuthToken()

  return {
    Authorization: `Bearer ${token}`,
  }
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unknown error'
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown error'
}

function showSuccess(message?: string) {
  toast.success(message || 'Operation successful')
}

function showWarning(message?: string) {
  toast.warning(message || 'Operation failed')
}

function showError(error: unknown) {
  const message = getErrorMessage(error)
  toast.error(message)
  return message
}

export const useAccountStore = defineStore('account', {
  state: () => ({
    notifications: [] as Notification[],
    loading: false,
    error: null as string | null,
  }),

  actions: {

    async getMyNotification(userId: string) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get<BaseResponse<Notification[]>>(
          `${baseAccountUrl}/${userId}`,
          {
            headers: getAuthHeaders(),
          },
        )

        this.notifications = response.data.data ?? []

        return this.notifications
      } catch (error) {
        this.error = showError(error)
        return []
      } finally {
        this.loading = false
      }
    },

    
  },
})
