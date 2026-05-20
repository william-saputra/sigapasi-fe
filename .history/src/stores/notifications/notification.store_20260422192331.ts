import type {
  DeleteNotification,
  Notifications,
  NotificationRequest,
} from '@/interfaces/notifications/notification.interface'
import type { BaseResponse } from '@/interfaces/base-response.interface'

import { defineStore } from 'pinia'
import axios from 'axios'
import { toast } from 'vue-sonner'
import { getAuthToken } from '@/lib/auth'
import { fetchEventSource, EventStreamContentType } from '@microsoft/fetch-event-source'

const baseNotificationUrl = `${import.meta.env.VITE_API_URL}/notifications`

function getAuthHeaders() {
  const token = getAuthToken()
  return { Authorization: `Bearer ${token}` }
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
  if (error instanceof Error) return error.message
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

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notifications[],
    loading: false,
    error: null as string | null,
    sseAbortController: null as AbortController | null,
    sseConnected: false,
    sseStarting: false,
  }),

  getters: {
    hasUnread: (state) => state.notifications.some((notif) => !notif.read),
    latestNotifications: (state) => state.notifications.slice(0, 5),
  },

  actions: {
    prependNotification(notification: Notifications) {
      const exists = this.notifications.some((notif) => notif.id === notification.id)
      if (exists) return

      this.notifications.unshift(notification)

      toast(notification.title, {
        description: notification.message || undefined,
        duration: 5000,
        closeButton: true,
      })
    },

    disconnectNotificationStream() {
      if (this.sseAbortController) {
        this.sseAbortController.abort()
        this.sseAbortController = null
      }
      this.sseConnected = false
      this.sseStarting = false
    },

    async connectNotificationStream() {
      if (this.sseConnected || this.sseStarting) return

      const token = getAuthToken()
      if (!token) {
        this.error = 'Missing auth token for notification stream'
        return
      }

      this.sseStarting = true
      this.error = null

      const controller = new AbortController()
      this.sseAbortController = controller

      try {
        await fetchEventSource(`${baseNotificationUrl}/stream`, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          openWhenHidden: true,

          async onopen(response: Response) {
            if (!response.ok) {
              throw new Error(`SSE connection failed with status ${response.status}`)
            }

            const contentType = response.headers.get('content-type')
            if (!contentType?.includes(EventStreamContentType)) {
              throw new Error(`Unexpected content-type: ${contentType}`)
            }
          },

          onmessage(event: any) {
            console.log('[SSE] message:', event.event, event.data)

            if (event.event === 'connected') {
              this.sseConnected = true
              this.sseStarting = false
              console.log('[SSE] connected')
              return
            }

            if (event.event === 'heartbeat') {
              return
            }

            if (event.event !== 'notification') return

            try {
              const payload = JSON.parse(event.data) as Notifications & { read?: boolean }

              const normalizedNotification: Notifications = {
                ...payload,
                read: payload.read ?? payload.read ?? false,
              }

              this.prependNotification(normalizedNotification)
            } catch (error) {
              console.error('[SSE] failed to parse payload:', error)
            }
          },

          onclose() {
            console.warn('[SSE] connection closed by server')
            this.sseConnected = false
            this.sseStarting = false
          },

          onerror(error: any) {
            console.error('[SSE] error:', error)
            this.sseConnected = false
            this.sseStarting = false

            // jangan throw untuk network error biasa
            // biarkan fetch-event-source retry otomatis
            return 3000
          },
        })
      } catch (error) {
        if (controller.signal.aborted) return

        this.error = getErrorMessage(error)
        this.sseConnected = false
        this.sseStarting = false
        console.error('Failed to connect notification SSE:', error)
      }
    },

    async getMyNotification() {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get<BaseResponse<Notifications[]>>(
          `${baseNotificationUrl}/user`,
          { headers: getAuthHeaders() },
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

    async createNotification(notifData: NotificationRequest) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post<BaseResponse<Notifications>>(
          `${baseNotificationUrl}`,
          notifData,
          { headers: getAuthHeaders() },
        )

        const createdNotification = response.data.data ?? null

        if (createdNotification) {
          const exists = this.notifications.some(
            (notif) => notif.id === createdNotification.id,
          )
          if (!exists) {
            this.notifications.unshift(createdNotification)
          }
        }

        return createdNotification
      } catch (error) {
        this.error = showError(error)
        return null
      } finally {
        this.loading = false
      }
    },

    async markAsRead(notificationId: string) {
      this.error = null

      const originalNotifications = [...this.notifications]
      this.notifications = this.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif,
      )

      try {
        const response = await axios.patch<BaseResponse<Notifications>>(
          `${baseNotificationUrl}/${notificationId}/read`,
          {},
          { headers: getAuthHeaders() },
        )

        const updatedNotification = response.data.data ?? null

        if (updatedNotification) {
          this.notifications = this.notifications.map((notif) =>
            notif.id === notificationId ? updatedNotification : notif,
          )
        }

        return updatedNotification
      } catch (error) {
        this.notifications = originalNotifications
        this.error = showError(error)
        return null
      }
    },

    async markAllAsRead() {
      this.error = null

      const originalNotifications = [...this.notifications]
      this.notifications = this.notifications.map((notif) => ({
        ...notif,
        isRead: true,
      }))

      try {
        const response = await axios.patch<BaseResponse<Notifications[]>>(
          `${baseNotificationUrl}/read-all`,
          {},
          { headers: getAuthHeaders() },
        )

        const updatedNotifications = response.data.data ?? []

        if (updatedNotifications.length) {
          this.notifications = updatedNotifications
        }

        showSuccess(response.data.message || 'Semua notifikasi ditandai dibaca')
        return this.notifications
      } catch (error) {
        this.notifications = originalNotifications
        this.error = showError(error)
        return []
      }
    },

    async deleteNotification(notifData: DeleteNotification) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.delete<BaseResponse<Notifications[]>>(
          `${baseNotificationUrl}/delete`,
          {
            headers: getAuthHeaders(),
            data: notifData,
          },
        )

        const deletedNotifications = response.data.data ?? []

        if (!deletedNotifications.length) {
          showWarning(response.data.message || 'Failed to delete notifications')
          return []
        }

        const deletedIds = deletedNotifications.map((notif) => notif.id)
        this.notifications = this.notifications.filter(
          (notif) => !deletedIds.includes(notif.id),
        )

        showSuccess(response.data.message || 'Notifications deleted successfully')
        return deletedNotifications
      } catch (error) {
        this.error = showError(error)
        return []
      } finally {
        this.loading = false
      }
    },
  },
})