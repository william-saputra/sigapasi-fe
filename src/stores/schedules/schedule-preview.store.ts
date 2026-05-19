import type { BaseResponse } from '@/interfaces/base-response.interface'
import type { ClassResponseDTO } from '@/interfaces/schedules/classManagement.types'
import type {
  SchedulePreviewMode,
  SchedulePreviewOption,
  SchedulePreviewResponse,
  TeacherOption,
} from '@/interfaces/schedules/schedule-preview.interface'

import { defineStore } from 'pinia'
import axios from 'axios'
import { toast } from 'vue-sonner'
import { getAuthToken } from '@/lib/auth'

const baseSchedulePreviewUrl = `${import.meta.env.VITE_API_URL}/schedules/preview`
const baseSchedulePreviewOptionUrl = `${import.meta.env.VITE_API_URL}/schedules/preview/options`

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

function showError(error: unknown) {
  const message = getErrorMessage(error)
  toast.error(message)
  return message
}

export const useSchedulePreviewStore = defineStore('schedulePreview', {
  state: () => ({
    preview: null as SchedulePreviewResponse | null,

    selectedSemesterId: null as string | null,
    selectedMode: 'CLASS' as SchedulePreviewMode,
    selectedClassId: null as string | null,
    selectedTeacherId: null as string | null,

    classes: [] as ClassResponseDTO[],
    teachers: [] as TeacherOption[],

    loading: false,
    loadingOptions: false,
    error: null as string | null,
  }),

  getters: {
    isClassMode: (state) => state.selectedMode === 'CLASS',
    isTeacherMode: (state) => state.selectedMode === 'TEACHER',

    selectedClass: (state) => {
      if (!state.selectedClassId) return null
      return state.classes.find((cls) => cls.id === state.selectedClassId) ?? null
    },

    canLoadPreview: (state) => {
      if (!state.selectedSemesterId) return false

      if (state.selectedMode === 'CLASS') {
        return !!state.selectedClassId
      }

      return !!state.selectedTeacherId
    },

    previewTitle: (state) => {
      if (!state.preview) return ''

      if (state.preview.mode === 'CLASS') {
        return `Jadwal ${state.preview.selectedClassName || 'Kelas'}`
      }

      return `Jadwal Mengajar: ${state.preview.selectedTeacherName || 'Guru'}`
    },
  },

  actions: {
    setSemesterId(semesterId: string | null) {
      this.selectedSemesterId = semesterId
      this.preview = null
      this.error = null
    },

    setMode(mode: SchedulePreviewMode) {
      this.selectedMode = mode
      this.preview = null
      this.error = null
    },

    setSelectedClassId(classId: string | null) {
      this.selectedClassId = classId
      this.selectedTeacherId = null
      this.preview = null
      this.error = null
    },

    setSelectedTeacherId(teacherId: string | null) {
      this.selectedTeacherId = teacherId
      this.preview = null
      this.error = null
    },

    clearPreview() {
      this.preview = null
      this.error = null
    },

    clearError() {
      this.error = null
    },

    async getClassPreview() {
      if (!this.selectedSemesterId) {
        this.error = 'Semester belum dipilih'
        toast.warning(this.error)
        return null
      }

      if (!this.selectedClassId) {
        this.error = 'Kelas belum dipilih'
        toast.warning(this.error)
        return null
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get<BaseResponse<SchedulePreviewResponse>>(
          `${baseSchedulePreviewUrl}/semester/${this.selectedSemesterId}/class/${this.selectedClassId}`,
          { headers: getAuthHeaders() },
        )

        this.preview = response.data.data ?? null
        this.selectedMode = 'CLASS'

        return this.preview
      } catch (error) {
        this.error = showError(error)
        this.preview = null
        return null
      } finally {
        this.loading = false
      }
    },

    async getTeacherPreview() {
      if (!this.selectedSemesterId) {
        this.error = 'Semester belum dipilih'
        toast.warning(this.error)
        return null
      }

      if (!this.selectedTeacherId) {
        this.error = 'Guru belum dipilih'
        toast.warning(this.error)
        return null
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get<BaseResponse<SchedulePreviewResponse>>(
          `${baseSchedulePreviewUrl}/semester/${this.selectedSemesterId}/teacher/${this.selectedTeacherId}`,
          { headers: getAuthHeaders() },
        )

        this.preview = response.data.data ?? null
        this.selectedMode = 'TEACHER'

        return this.preview
      } catch (error) {
        this.error = showError(error)
        this.preview = null
        return null
      } finally {
        this.loading = false
      }
    },

    async getPreview() {
      if (this.selectedMode === 'CLASS') {
        return this.getClassPreview()
      }

      return this.getTeacherPreview()
    },

    /**
     * Sesuaikan endpoint classes ini dengan endpoint yang sudah ada di project kamu.
     * Response harus BaseResponse<ClassResponseDTO[]>.
     */
    async getClasses() {
      this.loadingOptions = true
      this.error = null

      try {
        const response = await axios.get<BaseResponse<ClassResponseDTO[]>>(
          `${import.meta.env.VITE_API_URL}/classes`,
          { headers: getAuthHeaders() },
        )

        this.classes = response.data.data ?? []
        return this.classes
      } catch (error) {
        this.error = showError(error)
        return []
      } finally {
        this.loadingOptions = false
      }
    },

    async getTeachers(schoolLevelId?: string | null) {
      this.loadingOptions = true
      this.error = null

      try {
        const params = schoolLevelId
          ? { schoolLevelId }
          : undefined

        const response = await axios.get<BaseResponse<SchedulePreviewOption[]>>(
          `${baseSchedulePreviewOptionUrl}/teachers`,
          {
            headers: getAuthHeaders(),
            params,
          },
        )

        this.teachers = response.data.data ?? []
        return this.teachers
      } catch (error) {
        this.error = showError(error)
        return []
      } finally {
        this.loadingOptions = false
      }
    },
  },
})