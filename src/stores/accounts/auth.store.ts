import type { LoginRequest } from '../../interfaces/accounts/auth.interface'
import type { BaseResponse } from '@/interfaces/base-response.interface'
import type { CurrentUser } from '@/interfaces/accounts/profile.interface'
import { getCurrentUser, getAuthToken } from '@/lib/auth'
import { defineStore } from 'pinia'
import axios from 'axios'
import { toast } from 'vue-sonner'

import { setLocalStorage, clearLocalStorage } from '@/lib/auth'

const basePostUrl = import.meta.env.VITE_API_URL + '/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as CurrentUser | null,
    token: null as string | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    initializeAuth() {
      this.token = getAuthToken()
      this.user = getCurrentUser()
    },
    // User Login
    async login(payload: LoginRequest) {
      try {
        this.loading = true

        const response = await axios.post<BaseResponse<{ token: string } & CurrentUser>>(
          `${basePostUrl}/login`,
          payload,
        )

        const respData = response.data.data

        this.token = respData.token
        const { token, ...userFields } = respData
        this.user = userFields as CurrentUser

        toast.success(response.data.message || 'Login successful')
        this.error = null

        setLocalStorage('token', this.token)
        setLocalStorage('user', this.user)
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            this.error = 'Email atau Password salah'
            toast.error('Email atau Password salah')
          } else {
            this.error = error.response?.data?.message || 'Terjadi kesalahan'
            toast.error(this.error ?? 'Unknown error')
          }
        } else {
          this.error = 'Unknown error'
          toast.error(this.error ?? 'Unknown error')
        }
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        this.loading = true

        clearLocalStorage()
        this.user = null
        this.token = null

        toast.success('Logout successful')
        this.error = null
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        toast.error(this.error ?? 'Unknown error')
      } finally {
        this.loading = false
      }
    },
  },
})
