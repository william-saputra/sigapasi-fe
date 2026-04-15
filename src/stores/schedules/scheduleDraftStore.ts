import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { scheduleService } from '@/services/schedule/schedule.service'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import type {
    ScheduleDraftDTO,
    CreateScheduleDraftRequestDTO,
} from '@/interfaces/schedules/schedule.types'
import type { AcademicYearSemesterResponseDTO, SemesterResponseDTO } from '@/interfaces/schedules/timeSlot.types'

export const useScheduleDraftStore = defineStore('scheduleDraft', () => {
    // ─── State ─────────────────────────────────────────────────────────────
    const drafts = ref<ScheduleDraftDTO[]>([])
    const isLoadingDrafts = ref(false)
    const isCreating = ref(false)
    const isPublishing = ref(false)
    const errorMessage = ref<string | null>(null)

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
        const ay = academicYears.value.find(a => a.id === selectedAcademicYearId.value)
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
            drafts.value = Array.isArray(data) ? data : (data as any)?.data ?? []
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
            const idx = drafts.value.findIndex(d => d.scheduleId === scheduleId)
            if (idx >= 0) drafts.value[idx] = updated
            return true
        } catch (err: any) {
            if (err.response?.status === 409) {
                errorMessage.value = 'Jadwal sudah dipublikasikan sebelumnya.'
            } else {
                errorMessage.value = err.response?.data?.message || 'Gagal mempublikasikan jadwal.'
            }
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
        createDraft,
        publishDraft,
        selectAcademicYear,
        selectSemester,
        clearError,
    }
})
