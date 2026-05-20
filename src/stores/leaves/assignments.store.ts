import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAuthToken, handleApiResponse } from '@/lib/auth'
import type { SubstituteAssignmentsDashboardResponseDTO, AvailableTeacherDTO, SubstituteAssignmentsCardDTO } from '@/interfaces/leaves/assignments.interface'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api') + '/assignments'

const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const useAssignmentStore = defineStore('assignment', () => {
  const dashboardData = ref<SubstituteAssignmentsDashboardResponseDTO>({
    totalGuruCuti: 0,
    totalSesiKosong: 0,
    emptyClasses: []
  })

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const availableTeachers = ref<AvailableTeacherDTO[]>([])
  const isFetchingTeachers = ref(false)

  // Fetch data berdasarkan tanggal
  const fetchEmptyClasses = async (date: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${API_BASE_URL}/empty-classes?date=${date}`, {
        headers: getAuthHeaders(),
      })

      const result = await handleApiResponse(response)
      dashboardData.value = result.data || result
    } catch (err) {
      console.error('Error fetching empty classes:', err)
      error.value = err instanceof Error ? err.message : 'Gagal memuat data kelas kosong.'
      dashboardData.value = { totalGuruCuti: 0, totalSesiKosong: 0, emptyClasses: [] }
    } finally {
      isLoading.value = false
    }
  }

  // Fetch guru available
  const fetchAvailableTeachers = async (date: string, timeSlotId: string, leaveRequestId: string) => {
    try {
      isFetchingTeachers.value = true
      availableTeachers.value = []

      const response = await fetch(`${API_BASE_URL}/available-teachers?date=${date}&timeSlotId=${timeSlotId}&leaveRequestId=${leaveRequestId}`, {
        headers: getAuthHeaders(),
      })

      const result = await handleApiResponse(response)
      availableTeachers.value = result.data || result || []
    } catch (err) {
      console.error('Error fetching available teachers:', err)
      error.value = 'Gagal mengambil daftar guru pengganti.'
    } finally {
      isFetchingTeachers.value = false
    }
  }

  // ACTION BARU: POST Assign Teacher
  const assignTeacher = async (assignmentId: string, substituteTeacherId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${API_BASE_URL}/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assignmentId, substituteTeacherId })
      })

      const result = await handleApiResponse(response)

      // PERBAIKAN 2: Tambahkan "|| result" karena endpoint POST /assign di Controller
      // mengembalikan object langsung tanpa dibungkus BaseResponseDTO
      const updatedCard: SubstituteAssignmentsCardDTO = result.data || result

      const index = dashboardData.value.emptyClasses.findIndex(c => c.assignmentId === assignmentId)

      if (index !== -1) {
        const targetItem = dashboardData.value.emptyClasses[index]

        if (targetItem) {
          const oldStatus = targetItem.status

          dashboardData.value.emptyClasses[index] = updatedCard

          if (oldStatus === 'NOT_ASSIGNED' && updatedCard.status === 'ASSIGNED') {
            dashboardData.value.totalSesiKosong = Math.max(0, (dashboardData.value.totalSesiKosong || 0) - 1)
          }
        }
      }

      return true
    } catch (err) {
      console.error('Error assigning teacher:', err)
      error.value = err instanceof Error ? err.message : 'Gagal menugaskan guru pengganti.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    dashboardData,
    isLoading,
    error,
    availableTeachers,
    isFetchingTeachers,
    fetchEmptyClasses,
    fetchAvailableTeachers,
    assignTeacher
  }
})
