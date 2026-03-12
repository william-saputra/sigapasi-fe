import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api.service'

interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
}

interface LoginResponse {
  token: string
  id: string
  email: string
  fullName: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  // Hydrate from localStorage on store init (survives page refresh)
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<AuthUser | null>(
    JSON.parse(localStorage.getItem('user') ?? 'null'),
  )

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role ?? null)

  async function login(email: string, password: string): Promise<void> {
    const data = await apiService.post<LoginResponse>('/auth/login', { email, password })

    token.value = data.token
    user.value = {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  function logout(): void {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isAuthenticated, userRole, login, logout }
})
