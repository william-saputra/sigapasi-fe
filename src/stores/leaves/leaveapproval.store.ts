import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAuthToken, handleApiResponse } from '@/lib/auth'
import type {
  LeaveRequestResponseDTO,
  LeaveRequestDetailAdminDTO,
} from '@/interfaces/leaves/leaverequest.interface'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api') + '/leaves'

const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const useLeaveApprovalStore = defineStore('leaveApproval', () => {
  // ====================
  // STATE
  // ====================
  const pendingRequests = ref<LeaveRequestResponseDTO[]>([])

  const selectedRequestDetail = ref<LeaveRequestDetailAdminDTO | null>(null)
  const isDetailLoading = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ====================
  // ACTIONS
  // ====================

  // 1. Fetch Daftar Approval
  const fetchPendingRequests = async (status: string = 'PENDING') => {
    try {
      isLoading.value = true
      error.value = null

      const params = new URLSearchParams()
      if (status !== 'ALL') {
        params.append('status', status)
      }

      const url = `${API_BASE_URL}/approvals${params.toString() ? '?' + params.toString() : ''}`

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      })

      const result = await handleApiResponse(response)
      pendingRequests.value = result.data || []
    } catch (err) {
      console.error('Error fetching pending requests:', err)
      error.value = err instanceof Error ? err.message : 'Gagal mengambil data antrean cuti.'
      pendingRequests.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Fetch Detail SATU Pengajuan Cuti (Buat Modal Review)
  const fetchRequestDetail = async (id: string) => {
    try {
      isDetailLoading.value = true
      error.value = null
      selectedRequestDetail.value = null

      const response = await fetch(`${API_BASE_URL}/approvals/${id}`, {
        headers: getAuthHeaders(),
      })

      const result = await handleApiResponse(response)
      selectedRequestDetail.value = result.data
    } catch (err) {
      console.error('Error fetching detail:', err)
      error.value = err instanceof Error ? err.message : 'Gagal mengambil detail pengajuan.'
    } finally {
      isDetailLoading.value = false
    }
  }

  // 2. Setujui Pengajuan
  const approveRequest = async (id: string): Promise<{ success: boolean; count?: number }> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${API_BASE_URL}/approvals/${id}/approve`, {
        method: 'POST', // Pastikan method POST sesuai dengan Controller Java-mu
        headers: getAuthHeaders(),
      })

      // Parse response dari BaseResponseDTO backend
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyetujui pengajuan cuti.')
      }

      // result.data berisi return 'int' dari backend (total Substitute Assignments)
      return { success: true, count: result.data }
    } catch (err) {
      console.error('Error approving request:', err)
      error.value = err instanceof Error ? err.message : 'Terjadi kesalahan pada sistem.'
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  // 3. Tolak Pengajuan
  const rejectRequest = async (id: string, reason: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${API_BASE_URL}/approvals/reject`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json', // 2. Header ini WAJIB ada
        },
        body: JSON.stringify({
          leaveRequestId: id,
          rejectionReason: reason,
        }),
      })

      await handleApiResponse(response)
      return true
    } catch (err) {
      console.error('Error rejecting request:', err)
      error.value = err instanceof Error ? err.message : 'Gagal menolak pengajuan.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    pendingRequests,
    selectedRequestDetail,
    isDetailLoading,
    isLoading,
    error,
    fetchPendingRequests,
    fetchRequestDetail,
    approveRequest,
    rejectRequest,
  }
})
