import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { scheduleService } from '@/services/schedule/schedule.service'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import type {
  ScheduleDraftDTO,
  CreateScheduleDraftRequestDTO,
  ScheduleApprovalListDTO,
} from '@/interfaces/schedules/schedule.types'
import type {
  AcademicYearSemesterResponseDTO,
  SemesterResponseDTO,
} from '@/interfaces/schedules/timeSlot.types'

export const useScheduleDraftStore = defineStore('scheduleDraft', () => {
  const toast = useToast()

  // ─── State ─────────────────────────────────────────────────────────────
  const drafts = ref<ScheduleDraftDTO[]>([])
  const isLoadingDrafts = ref(false)
  const isCreating = ref(false)
  const isPublishing = ref(false)
  const errorMessage = ref<string | null>(null)

  const allSchedules = ref<ScheduleApprovalListDTO[]>([])
  const isLoadingAllSchedules = ref(false)

  // Seleksi Tahun Ajaran / Semester (reuse data dari timeSlotStore)
  const selectedAcademicYearId = ref<string | null>(null)
  const selectedSemesterId = ref<string | null>(null)

  // ─── Getters ───────────────────────────────────────────────────────────
  /** Ambil daftar semua semester dari timeSlotStore tanpa duplikasi logika fetch */
  const academicYears = computed<AcademicYearSemesterResponseDTO[]>(() => {
    const tsStore = useTimeSlotStore()
    return tsStore.academicYears
  })

  const availableSemesters = computed<SemesterResponseDTO[]>(() => {
    if (!selectedAcademicYearId.value) return []
    const ay = academicYears.value.find((a) => a.id === selectedAcademicYearId.value)
    return ay?.listSemesters ?? []
  })

  // ─── Actions ───────────────────────────────────────────────────────────
  /** Fetch daftar draft berdasarkan semesterId yang aktif */
  async function fetchDrafts(): Promise<void> {
    if (!selectedSemesterId.value) {
      drafts.value = []
      return
    }
    isLoadingDrafts.value = true
    errorMessage.value = null
    try {
      const data = await scheduleService.getDrafts(selectedSemesterId.value)
      drafts.value = Array.isArray(data) ? data : ((data as any)?.data ?? [])
      console.log(drafts.value)
    } catch (err: any) {
      errorMessage.value = err.response?.data?.message || 'Gagal mengambil daftar draf jadwal.'
    } finally {
      isLoadingDrafts.value = false
    }
  }

  /** Buat draf baru. Kembali null jika gagal (mis. 409 duplikat nama). */
  async function createDraft(name: string): Promise<ScheduleDraftDTO | null> {
    if (!selectedSemesterId.value) return null
    isCreating.value = true
    errorMessage.value = null
    const payload: CreateScheduleDraftRequestDTO = {
      semesterId: selectedSemesterId.value,
      name,
    }
    try {
      const newDraft = await scheduleService.createDraft(payload)
      drafts.value.unshift(newDraft)
      return newDraft
    } catch (err: any) {
      if (err.response?.status === 409) {
        errorMessage.value = 'Nama draf sudah dipakai di semester ini. Gunakan nama lain.'
      } else {
        errorMessage.value = err.response?.data?.message || 'Gagal membuat draf baru.'
      }
      return null
    } finally {
      isCreating.value = false
    }
  }

  /** Publikasikan draf (DRAFT → PUBLISHED) */
  async function publishDraft(scheduleId: string): Promise<boolean> {
    isPublishing.value = true
    errorMessage.value = null
    try {
      const updated = await scheduleService.publishDraft(scheduleId)
      // Update item in place
      const idx = drafts.value.findIndex((d) => d.scheduleId === scheduleId)
      if (idx >= 0) drafts.value[idx] = updated
      return true
    } catch (err: any) {
      let errorMsg = 'Gagal mempublikasikan jadwal.'
      if (err.response?.status === 409) {
        errorMsg = 'Jadwal sudah dipublikasikan sebelumnya.'
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message
      }
      if (toast) toast.error(errorMsg)
      return false
    } finally {
      isPublishing.value = false
    }
  }

  /** Update Status Draft menggunakan Master Draft Paradigm */
  async function updateScheduleStatus(
    scheduleId: string,
    status: string,
    revisionNote?: string | null,
  ): Promise<boolean> {
    isPublishing.value = true // Reusing isPublishing flag or might need a new one
    errorMessage.value = null
    try {
      const updated = await scheduleService.updateScheduleStatus(scheduleId, {
        status,
        revisionNote,
      })
      const idx = drafts.value.findIndex((d) => d.scheduleId === scheduleId)
      if (idx >= 0) drafts.value[idx] = updated
      return true
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Gagal mengupdate status jadwal.'
      if (toast) toast.error(errorMsg)
      return false
    } finally {
      isPublishing.value = false
    }
  }

  async function fetchAllSchedules(): Promise<void> {
    isLoadingAllSchedules.value = true
    errorMessage.value = null
    try {
      const data = await scheduleService.getAllSchedules()
      // Pastikan mengecek struktur axios response (data.data atau data langsung)
      allSchedules.value = Array.isArray(data) ? data : ((data as any)?.data ?? [])
    } catch (err: any) {
      errorMessage.value =
        err.response?.data?.message || 'Gagal mengambil daftar persetujuan jadwal.'
      if (toast) toast.error(errorMessage.value)
    } finally {
      isLoadingAllSchedules.value = false
    }
  }

  async function submitDraft(scheduleId: string): Promise<boolean> {
    isPublishing.value = true
    errorMessage.value = null
    try {
      const updated = await scheduleService.submitSchedule(scheduleId)

      const idx = drafts.value.findIndex((d) => d.scheduleId === scheduleId)
      if (idx >= 0) drafts.value[idx] = updated

      await fetchAllSchedules()

      if (toast) toast.success('Jadwal berhasil diajukan untuk persetujuan.')
      return true
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Gagal mengajukan jadwal.'
      if (toast) toast.error(errorMsg)
      return false
    } finally {
      isPublishing.value = false
    }
  }

  function selectAcademicYear(id: string) {
    selectedAcademicYearId.value = id
    selectedSemesterId.value = null
    drafts.value = []
  }

  function selectSemester(id: string) {
    selectedSemesterId.value = id
  }

  function clearError() {
    errorMessage.value = null
  }

  return {
    // State
    drafts,
    allSchedules,
    isLoadingAllSchedules,
    isLoadingDrafts,
    isCreating,
    isPublishing,
    errorMessage,
    selectedAcademicYearId,
    selectedSemesterId,
    // Getters
    academicYears,
    availableSemesters,
    // Actions
    fetchDrafts,
    fetchAllSchedules,
    createDraft,
    publishDraft,
    submitDraft,
    updateScheduleStatus,
    selectAcademicYear,
    selectSemester,
    clearError,
  }
})
