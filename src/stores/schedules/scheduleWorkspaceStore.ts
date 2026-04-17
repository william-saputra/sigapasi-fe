import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { scheduleService } from '@/services/schedule/schedule.service'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import type {
    ScheduleDraftDTO,
    ClassSummaryDTO,
    SidebarItemDTO,
    ScheduleEntryDTO,
    BulkAssignRequestDTO,
    ClassValidationResultDTO,
} from '@/interfaces/schedules/schedule.types'

export const useScheduleWorkspaceStore = defineStore('scheduleWorkspace', () => {
    const toast = useToast()

    // ─── State ─────────────────────────────────────────────────────────────
    const activeDraft = ref<ScheduleDraftDTO | null>(null)
    const activeClassId = ref<string | null>(null)

    const classSummaries = ref<ClassSummaryDTO[]>([])
    const sidebarItems = ref<SidebarItemDTO[]>([])
    const gridEntries = ref<ScheduleEntryDTO[]>([])
    const validationResult = ref<ClassValidationResultDTO | null>(null)

    /** Set berisi timeSlotId yang sedang dalam proses API (spinner aktif) */
    const pendingCells = ref<Set<string>>(new Set())

    const isLoadingSidebar = ref(false)
    const isLoadingGrid = ref(false)
    const isLoadingSummary = ref(false)

    // ─── Getters ───────────────────────────────────────────────────────────
    /** Map O(1): timeSlotId → ScheduleEntryDTO untuk rendering grid */
    const entryBySlotId = computed<Record<string, ScheduleEntryDTO>>(() =>
        Object.fromEntries(gridEntries.value.map(e => [e.timeSlotId, e]))
    )

    /** Sidebar dikelompokkan berdasarkan subjectId untuk render akordion */
    const sidebarBySubject = computed(() => {
        const map = new Map<string, { subjectId: string; subjectName: string; teachers: SidebarItemDTO[] }>()
        for (const item of sidebarItems.value) {
            if (!map.has(item.subjectId)) {
                map.set(item.subjectId, {
                    subjectId: item.subjectId,
                    subjectName: item.subjectName,
                    teachers: [],
                })
            }
            map.get(item.subjectId)!.teachers.push(item)
        }
        return Array.from(map.values())
    })

    const activeClassName = computed(() => {
        const cls = classSummaries.value.find(c => c.classId === activeClassId.value)
        return cls?.className ?? null
    })

    const filteredTimeSlots = computed(() => {
        const tsStore = useTimeSlotStore()

        // Return kosong (Record default) jika tidak ada class active
        const result: Record<string, any[]> = {}
        if (!activeClassId.value) return result

        const activeClass = classSummaries.value.find(c => c.classId === activeClassId.value)
        if (!activeClass || !activeClass.schoolLevelId) return result

        const levelId = activeClass.schoolLevelId

        // Filter time slots raw api dengan schoolLevelId
        for (const day of ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']) {
            const dailySlots = tsStore.schedules[day as keyof typeof tsStore.schedules] || []
            result[day] = dailySlots.filter(s => s.school_level_id === levelId)
        }
        return result
    })

    // ─── Actions ───────────────────────────────────────────────────────────

    /** Inisialisasi workspace dengan draf yang dipilih */
    async function initWorkspace(draft: ScheduleDraftDTO): Promise<void> {
        activeDraft.value = draft
        activeClassId.value = null
        sidebarItems.value = []
        gridEntries.value = []
        validationResult.value = null
        await fetchClassesSummary()
    }

    /** Reset total workspace saat kembali ke dashboard */
    function resetWorkspace(): void {
        activeDraft.value = null
        activeClassId.value = null
        classSummaries.value = []
        sidebarItems.value = []
        gridEntries.value = []
        pendingCells.value = new Set()
        validationResult.value = null
    }

    async function fetchClassesSummary(): Promise<void> {
        if (!activeDraft.value) return
        isLoadingSummary.value = true
        try {
            const data = await scheduleService.getClassesSummary(activeDraft.value.scheduleId)
            classSummaries.value = Array.isArray(data) ? data : (data as any)?.data ?? []
        } catch (err: any) {
            console.error('Gagal mengambil ringkasan kelas:', err)
        } finally {
            isLoadingSummary.value = false
        }
    }

    /** Set kelas aktif dan langsung muat sidebar + grid secara paralel */
    async function setActiveClass(classId: string): Promise<void> {
        activeClassId.value = classId
        sidebarItems.value = []
        gridEntries.value = []
        validationResult.value = null
        await Promise.all([fetchSidebar(), fetchGridEntries()])
    }

    async function fetchSidebar(): Promise<void> {
        if (!activeDraft.value || !activeClassId.value) return
        isLoadingSidebar.value = true
        try {
            const data = await scheduleService.getSidebar(
                activeDraft.value.scheduleId,
                activeClassId.value,
            )
            sidebarItems.value = Array.isArray(data) ? data : (data as any)?.data ?? []
        } catch (err: any) {
            console.error('Gagal mengambil data sidebar:', err)
        } finally {
            isLoadingSidebar.value = false
        }
    }

    async function fetchGridEntries(): Promise<void> {
        if (!activeDraft.value || !activeClassId.value) return
        isLoadingGrid.value = true
        try {
            const data = await scheduleService.getEntries(
                activeDraft.value.scheduleId,
                activeClassId.value,
            )
            gridEntries.value = Array.isArray(data) ? data : (data as any)?.data ?? []
        } catch (err: any) {
            console.error('Gagal mengambil data grid:', err)
        } finally {
            isLoadingGrid.value = false
        }
    }

    /**
     * Assign guru ke slot via bulk-assign (Pessimistic Update).
     * Returns: success, warning or error message.
     */
    async function assignEntry(payload: BulkAssignRequestDTO): Promise<{ success?: string, warning?: string, error?: string }> {
        if (!activeDraft.value) return { error: 'Tidak ada draf aktif.' }

        // STEP 1: Tandai sel sebagai pending (tampilkan spinner)
        payload.timeSlotIds.forEach(id => pendingCells.value.add(id))

        try {
            // STEP 2: Panggil API
            // apiService returns data directly, so response is already the unwrapped result
            const result: any = await scheduleService.bulkAssign(activeDraft.value.scheduleId, payload)

            // STEP 3a: Update gridEntries — tambah atau timpa entry untuk setiap timeSlotId
            for (const slotId of payload.timeSlotIds) {
                const idx = gridEntries.value.findIndex(e => e.timeSlotId === slotId)
                const newEntry: ScheduleEntryDTO = {
                    entryId: '',          // akan diisi oleh fetch berikutnya jika perlu
                    timeSlotId: slotId,
                    dayOfWeek: '',        // dihitung dari masterTimeSlots di komponen
                    startTime: '',
                    endTime: '',
                    teacherId: payload.teacherId,
                    teacherName: _findTeacherName(payload.teacherId),
                    subjectId: payload.subjectId,
                    subjectName: _findSubjectName(payload.subjectId),
                }
                if (idx >= 0) {
                    gridEntries.value[idx] = newEntry
                } else {
                    gridEntries.value.push(newEntry)
                }
            }

            // STEP 3b: Update currentHours guru baru di sidebar
            _updateSidebarHours(payload.teacherId, result.newTeacherCurrentLoad)

            // STEP 3c: Update currentHours guru lama jika terjadi override
            for (const ov of (result?.overriddenEntries || [])) {
                _updateSidebarHours(ov.oldTeacherId, ov.oldTeacherCurrentLoad)
            }

            // STEP 3d: Update classSummaries
            await fetchClassesSummary()

            // Lakukan sinkronisasi grid di background tanpa loader agar entryId terisi
            if (activeDraft.value && activeClassId.value) {
                scheduleService.getEntries(activeDraft.value.scheduleId, activeClassId.value)
                    .then(data => {
                        gridEntries.value = Array.isArray(data) ? data : (data as any)?.data ?? []
                    })
                    .catch(err => console.error('Gagal sinkronisasi background:', err))
            }

            // STEP 3e: Kembalikan warning jika ada
            if (result.status === 'WARNING') {
                return { warning: result?.message }
            }
            return { success: result?.message ?? 'Jadwal berhasil ditambahkan.' }

        } catch (err: any) {
            console.error("DEBUG CATCH ASSIGN ENTRY:", err);
            const apiMessage = err.response?.data?.message || 'Terjadi kesalahan server';
            
            // 1. Panggil library Toast
            if (toast) {
                toast.error(apiMessage);
            }
            
            return { error: apiMessage };
        } finally {
            // STEP 5: Hapus spinner di semua sel yang terlibat
            payload.timeSlotIds.forEach(id => pendingCells.value.delete(id))
        }
    }

    /** Hapus satu entry dari grid */
    async function deleteEntry(entryId: string): Promise<{ success?: string, error?: string }> {
        if (!entryId) return { error: 'Jadwal belum tersimpan di database. Silakan tunggu sebentar.' }
        try {
            const response: any = await scheduleService.deleteEntry(entryId)
            const result = response.data
            // Hapus dari gridEntries
            const idx = gridEntries.value.findIndex(e => e.entryId === entryId)
            if (idx >= 0) {
                const removedEntry = gridEntries.value[idx]!
                gridEntries.value.splice(idx, 1)
                // Update currentHours guru yang bersangkutan
                _updateSidebarHours(removedEntry.teacherId, result.newCurrentLoad)
            }
            await fetchClassesSummary()
            return { success: response.message ?? 'Jadwal berhasil dihapus.' }
        } catch (err: any) {
            return { error: err.response?.data?.message ?? 'Terjadi kesalahan saat menyimpan jadwal.' }
        }
    }

    /** Kosongkan seluruh jadwal kelas aktif */
    async function clearClassEntries(): Promise<{ success?: string, error?: string }> {
        if (!activeDraft.value || !activeClassId.value) return { error: 'Kelas tidak aktif.' }
        try {
            const response: any = await scheduleService.clearClass(activeDraft.value.scheduleId, activeClassId.value)
            gridEntries.value = []
            // Reset semua currentHours di sidebar ke 0
            sidebarItems.value = sidebarItems.value.map(s => ({ ...s, currentHours: 0 }))
            await fetchClassesSummary()
            return { success: response.message ?? 'Jadwal kelas berhasil dikosongkan.' }
        } catch (err: any) {
            return { error: err.response?.data?.message ?? 'Terjadi kesalahan saat menyimpan jadwal.' }
        }
    }

    /** Validasi kelengkapan kelas sebelum simpan & tutup */
    async function validateClass(): Promise<ClassValidationResultDTO | null> {
        if (!activeDraft.value || !activeClassId.value) return null
        try {
            const result = await scheduleService.validateClass(
                activeDraft.value.scheduleId,
                activeClassId.value,
            )
            validationResult.value = result
            return result
        } catch (err: any) {
            console.error('Gagal memvalidasi kelas:', err)
            return null
        }
    }

    // ─── Private helpers ───────────────────────────────────────────────────
    function _updateSidebarHours(teacherId: string, newLoad: number) {
        sidebarItems.value = sidebarItems.value.map(s =>
            s.teacherId === teacherId ? { ...s, currentHours: newLoad } : s
        )
    }

    function _findTeacherName(teacherId: string): string {
        return sidebarItems.value.find(s => s.teacherId === teacherId)?.teacherName ?? ''
    }

    function _findSubjectName(subjectId: string): string {
        return sidebarItems.value.find(s => s.subjectId === subjectId)?.subjectName ?? ''
    }

    return {
        // State
        activeDraft,
        activeClassId,
        classSummaries,
        sidebarItems,
        gridEntries,
        pendingCells,
        validationResult,
        isLoadingSidebar,
        isLoadingGrid,
        isLoadingSummary,
        // Getters
        entryBySlotId,
        sidebarBySubject,
        activeClassName,
        filteredTimeSlots,
        // Actions
        initWorkspace,
        resetWorkspace,
        setActiveClass,
        fetchClassesSummary,
        fetchSidebar,
        fetchGridEntries,
        assignEntry,
        deleteEntry,
        clearClassEntries,
        validateClass,
    }
})
