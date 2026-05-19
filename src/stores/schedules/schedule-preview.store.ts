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
const baseScheduleExportUrl = `${import.meta.env.VITE_API_URL}/schedules/export`

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
    exporting: false,
    error: null as string | null,
  }),

  getters: {
    isClassMode: (state) => state.selectedMode === 'CLASS',
    isTeacherMode: (state) => state.selectedMode === 'TEACHER',

    selectedClass: (state) => {
      if (!state.selectedClassId) return null
      return state.classes.find((cls) => cls.id === state.selectedClassId) ?? null
    },

    selectedTeacher: (state) => {
      if (!state.selectedTeacherId) return null
      return state.teachers.find((teacher) => teacher.id === state.selectedTeacherId) ?? null
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

    async getTeachers() {
      this.loadingOptions = true
      this.error = null

      try {
        const response = await axios.get<BaseResponse<SchedulePreviewOption[]>>(
          `${baseSchedulePreviewOptionUrl}/teachers`,
          { headers: getAuthHeaders() },
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

    async exportSchedule(format: 'PDF' | 'EXCEL') {
      if (!this.selectedSemesterId) {
        this.error = 'Semester belum dipilih'
        toast.warning(this.error)
        return false
      }

      if (this.selectedMode === 'CLASS' && !this.selectedClassId) {
        this.error = 'Kelas belum dipilih'
        toast.warning(this.error)
        return false
      }

      if (this.selectedMode === 'TEACHER' && !this.selectedTeacherId) {
        this.error = 'Guru belum dipilih'
        toast.warning(this.error)
        return false
      }

      this.exporting = true
      this.error = null

      try {
        const endpoint =
          this.selectedMode === 'CLASS'
            ? `${baseScheduleExportUrl}/semester/${this.selectedSemesterId}/class/${this.selectedClassId}`
            : `${baseScheduleExportUrl}/semester/${this.selectedSemesterId}/teacher/${this.selectedTeacherId}`

        const response = await axios.get(endpoint, {
          params: { format },
          responseType: 'blob',
          headers: getAuthHeaders(),
        })

        const extension = format === 'PDF' ? 'pdf' : 'xlsx'
        const filename = this.buildExportFilename(extension)

        const blob = new Blob([response.data])
        const downloadUrl = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        window.URL.revokeObjectURL(downloadUrl)

        return true
      } catch (error) {
        this.error = showError(error)
        return false
      } finally {
        this.exporting = false
      }
    },

    buildExportFilename(extension: 'pdf' | 'xlsx') {
      const targetName =
        this.selectedMode === 'CLASS'
          ? this.preview?.selectedClassName || this.getSelectedClassName()
          : this.preview?.selectedTeacherName || this.getSelectedTeacherName()

      const safeName = this.sanitizeFilename(targetName || 'Jadwal')

      return `RingkasanJadwal_${safeName}.${extension}`
    },

    getSelectedClassName() {
      if (!this.selectedClassId) return null
      return this.classes.find((cls) => cls.id === this.selectedClassId)?.name ?? null
    },

    getSelectedTeacherName() {
      if (!this.selectedTeacherId) return null
      return this.teachers.find((teacher) => teacher.id === this.selectedTeacherId)?.name ?? null
    },

    sanitizeFilename(value: string) {
      return value
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-.]/g, '')
        .replace(/_+/g, '_')
    },
  },
})