import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAuthToken, handleApiResponse } from '@/lib/auth'
import type {
  CreateLeaveRequestDTO,
  LeaveRequestResponseDTO,
} from '@/interfaces/leaves/leaverequest.interface'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api') + '/leaves'

// Helper khusus request JSON
const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Helper KHUSUS request Multipart (File Upload)
const getMultipartAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const useLeaveStore = defineStore('leave', () => {
  const leaves = ref<LeaveRequestResponseDTO[]>([])
  const currentLeave = ref<LeaveRequestResponseDTO | null>(null)

  const leaveQuota = ref<number>(0)

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const sortedLeaves = computed(() => {
    return [...leaves.value].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  })

  // Actions
  // Fetch Sisa Kuota Cuti
  const fetchLeaveQuota = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quota`, {
        headers: getAuthHeaders(),
      })

      const result = await handleApiResponse(response)
      leaveQuota.value = result.data || 0
    } catch (err) {
      console.error('Error fetching quota:', err)
      leaveQuota.value = 0 // Default ke 0 kalau ada error
    }
  }

  // Fetch all leaves (opsional: filter by status)
  const fetchAllLeaves = async (status?: string) => {
    try {
      isLoading.value = true
      error.value = null

      const params = new URLSearchParams()
      if (status) params.append('status', status)

      const url = `${API_BASE_URL}/requests/history${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      })

      if (response.status === 404) {
        leaves.value = []
        error.value = null
        return
      }

      const result = await handleApiResponse(response)
      leaves.value = result.data || []
    } catch (err) {
      console.error('Error fetching leaves:', err)

      const message =
        err instanceof Error
          ? err.message.toLowerCase()
          : ''

      if (
        message.includes('not found') ||
        message.includes('tidak ditemukan') ||
        message.includes('no leave') ||
        message.includes('belum ada')
      ) {
        leaves.value = []
        error.value = null
        return
      }

      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to load leave requests. Please try again later.'
      leaves.value = []
    } finally {
      isLoading.value = false
    }
  }

  const createLeaveRequest = async (payload: CreateLeaveRequestDTO) => {
    try {
      isLoading.value = true
      error.value = null

      const formData = new FormData()
      formData.append('type', payload.type)
      formData.append('category', payload.category)
      formData.append('startDate', payload.startDate)
      formData.append('endDate', payload.endDate)
      formData.append('reason', payload.reason)

      if (payload.startTime) formData.append('startTime', payload.startTime)
      if (payload.endTime) formData.append('endTime', payload.endTime)
      if (payload.attachment) formData.append('attachment', payload.attachment)

      const response = await fetch(`${API_BASE_URL}/requests/create`, {
        method: 'POST',
        headers: getMultipartAuthHeaders(),
        body: formData,
      })

      const result = await handleApiResponse(response)

      await fetchAllLeaves()

      return result.data
    } catch (err) {
      console.error('Error creating leave request:', err)

      error.value =
        err instanceof Error ? err.message : 'Failed to create leave request. Please try again.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    leaves,
    currentLeave,
    leaveQuota,
    isLoading,
    error,

    // Getters
    sortedLeaves,

    // Actions
    fetchLeaveQuota,
    fetchAllLeaves,
    createLeaveRequest,
  }
})
