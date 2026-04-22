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
  ClassValidationSummaryDTO,
  EdgePullState,
  EdgePullResult,
  BlockPosition,
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

  const pendingCells = ref<Set<string>>(new Set())

  const isLoadingSidebar = ref(false)
  const isLoadingGrid = ref(false)
  const isLoadingSummary = ref(false)

  const batchValidationResults = ref<ClassValidationSummaryDTO[]>([])
  const isBatchValidating = ref(false)

  // ─── Edge Pull State ────────────────────────────────────────────────
  const edgePull = ref<EdgePullState>({
    isPulling: false,
    sourceEntry: null,
    sourceSlotId: null,
    sourceDay: null,
    targetSlotIds: [],
    previewSlotIds: new Set(),
  })

  // ─── Getters ───────────────────────────────────────────────────────────
  const entryBySlotId = computed<Record<string, ScheduleEntryDTO>>(() =>
    Object.fromEntries(gridEntries.value.map((e) => [e.timeSlotId, e])),
  )

  const sidebarBySubject = computed(() => {
    const map = new Map<
      string,
      { subjectId: string; subjectName: string; subjectKode: string; teachers: SidebarItemDTO[] }
    >()
    for (const item of sidebarItems.value) {
      if (!map.has(item.subjectId)) {
        map.set(item.subjectId, {
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          subjectKode: item.subjectKode,
          teachers: [],
        })
      }
      map.get(item.subjectId)!.teachers.push(item)
    }
    return Array.from(map.values())
  })

  const activeClassName = computed(() => {
    const cls = classSummaries.value.find((c) => c.classId === activeClassId.value)
    return cls?.className ?? null
  })

  const filteredTimeSlots = computed(() => {
    const tsStore = useTimeSlotStore()
    const result: Record<string, any[]> = {}

    if (!activeClassId.value) return result

    const activeClass = classSummaries.value.find((c) => c.classId === activeClassId.value)

    // activeClass menggunakan camelCase (schoolLevelId) dari ClassSummaryDTO
    const levelId = activeClass?.schoolLevelId || (activeClass as any)?.school_level_id
    if (!levelId) {
      console.warn(
        `[DEBUG] Gagal merender Grid! Class ${activeClassName.value} tidak memiliki schoolLevelId dari API.`,
      )
      return result
    }
    const schedules = tsStore.schedules

    for (const day of ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const) {
      const dailySlots = schedules[day] || []

      result[day] = dailySlots.filter((s) => {
        // FIX: Gunakan s.school_level_id sesuai dengan definisi TypeScript
        const slotLevelId = s.school_level_id

        return String(slotLevelId) === String(levelId)
      })
    }
    return result
  })

  // ─── Actions ───────────────────────────────────────────────────────────

  async function initWorkspace(draft: ScheduleDraftDTO): Promise<void> {
    activeDraft.value = draft
    activeClassId.value = null
    sidebarItems.value = []
    gridEntries.value = []
    validationResult.value = null
    await fetchClassesSummary()
  }

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
      classSummaries.value = Array.isArray(data) ? data : ((data as any)?.data ?? [])
    } catch (err: any) {
      console.error('Gagal mengambil ringkasan kelas:', err)
    } finally {
      isLoadingSummary.value = false
    }
  }

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
      sidebarItems.value = Array.isArray(data) ? data : ((data as any)?.data ?? [])
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
      gridEntries.value = Array.isArray(data) ? data : ((data as any)?.data ?? [])
    } catch (err: any) {
      console.error('Gagal mengambil data grid:', err)
    } finally {
      isLoadingGrid.value = false
    }
  }

  /**
   * Assign guru ke slot via bulk-assign
   * Menggunakan Single Source of Truth (Fetch Ulang setelah API sukses)
   */
  /**
   * Assign guru ke slot via bulk-assign (100% Pessimistic & Single Source of Truth)
   */
  async function assignEntry(
    payload: BulkAssignRequestDTO,
  ): Promise<{ success?: string; warning?: string; error?: string }> {
    if (!activeDraft.value) return { error: 'Tidak ada draf aktif.' }

    // 1. Tampilkan spinner di kotak grid yang sedang ditarik
    payload.timeSlotIds.forEach((id) => pendingCells.value.add(id))

    try {
      // 2. PANGGIL API LANGSUNG (TIDAK ADA manipulasi state lokal di awal!)
      const result: any = await scheduleService.bulkAssign(activeDraft.value.scheduleId, payload)

      // 3. JIKA SUKSES (HTTP 200): Ambil ulang SEMUA data terbaru dari Database
      await Promise.all([
        fetchGridEntries(), // Refresh grid
        fetchClassesSummary(), // Refresh summary
        fetchSidebar(), // Refresh sidebar
      ])

      if (result.status === 'WARNING') {
        return { warning: result?.message }
      }
      return { success: result?.message ?? 'Jadwal berhasil ditambahkan.' }
    } catch (err: any) {
      console.error('DEBUG CATCH ASSIGN ENTRY:', err)
      const apiMessage = err.response?.data?.message || 'Terjadi kesalahan server'

      // 4. JIKA GAGAL (HTTP 409 Bentrok): Tampilkan Error dan JANGAN UBAH STATE APAPUN!
      if (toast) {
        toast.error(apiMessage)
      }

      return { error: apiMessage }
    } finally {
      // 5. Matikan spinner
      payload.timeSlotIds.forEach((id) => pendingCells.value.delete(id))
    }
  }

  /** Hapus satu entry dari grid */
  async function deleteEntry(entryId: string): Promise<{ success?: string; error?: string }> {
    if (!entryId) return { error: 'Jadwal belum tersimpan di database. Silakan tunggu sebentar.' }
    try {
      // 1. Panggil API Delete
      await scheduleService.deleteEntry(entryId)

      // 2. Jika sukses, ambil ulang data terbaru dari Database
      await Promise.all([fetchGridEntries(), fetchClassesSummary(), fetchSidebar()])

      return { success: 'Jadwal berhasil dihapus.' }
    } catch (err: any) {
      const apiMessage = err.response?.data?.message ?? 'Terjadi kesalahan saat menghapus jadwal.'
      if (toast) toast.error(apiMessage)
      return { error: apiMessage }
    }
  }

  /** Kosongkan seluruh jadwal kelas aktif */
  async function clearClassEntries(): Promise<{ success?: string; error?: string }> {
    if (!activeDraft.value || !activeClassId.value) return { error: 'Kelas tidak aktif.' }
    try {
      // 1. Panggil API Clear
      await scheduleService.clearClass(activeDraft.value.scheduleId, activeClassId.value)

      // 2. Jika sukses, ambil ulang data terbaru dari Database
      await Promise.all([fetchGridEntries(), fetchClassesSummary(), fetchSidebar()])

      return { success: 'Jadwal kelas berhasil dikosongkan.' }
    } catch (err: any) {
      const apiMessage =
        err.response?.data?.message ?? 'Terjadi kesalahan saat mengosongkan jadwal.'
      if (toast) toast.error(apiMessage)
      return { error: apiMessage }
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

  /** Validasi kelengkapan seluruh kelas (Batch) */
  async function fetchBatchValidation(
    scheduleId: string,
  ): Promise<ClassValidationSummaryDTO[] | null> {
    isBatchValidating.value = true
    try {
      const data = await scheduleService.validateAllClasses(scheduleId)
      batchValidationResults.value = Array.isArray(data) ? data : ((data as any)?.data ?? [])
      return batchValidationResults.value
    } catch (err: any) {
      console.error('Gagal memvalidasi seluruh kelas:', err)
      const apiMessage = err.response?.data?.message ?? 'Terjadi kesalahan saat memvalidasi kelas.'
      if (toast) toast.error(apiMessage)
      return null
    } finally {
      isBatchValidating.value = false
    }
  }

  // ─── Edge Pull Actions ─────────────────────────────────────────────────
  function startEdgePull(entry: ScheduleEntryDTO, slotId: string, day: string): void {
    edgePull.value = {
      isPulling: true,
      sourceEntry: entry,
      sourceSlotId: slotId,
      sourceDay: day,
      targetSlotIds: [],
      previewSlotIds: new Set(),
    }
  }

  function updateEdgePullTarget(slotIds: string[]): void {
    if (!edgePull.value.isPulling) return
    edgePull.value.targetSlotIds = slotIds
    edgePull.value.previewSlotIds = new Set(slotIds)
  }

  function cancelEdgePull(): void {
    edgePull.value = {
      isPulling: false,
      sourceEntry: null,
      sourceSlotId: null,
      sourceDay: null,
      targetSlotIds: [],
      previewSlotIds: new Set(),
    }
  }

  async function executeEdgePull(): Promise<EdgePullResult> {
    const { sourceEntry, targetSlotIds, sourceSlotId } = edgePull.value

    if (!sourceEntry || !sourceSlotId || !activeDraft.value || !activeClassId.value) {
      cancelEdgePull()
      return { successSlots: [], failedSlots: [], warnings: [] }
    }

    if (targetSlotIds.length === 0) {
      cancelEdgePull()
      return { successSlots: [], failedSlots: [], warnings: [] }
    }

    const result = await assignEntry({
      classId: activeClassId.value,
      timeSlotIds: targetSlotIds,
      subjectId: sourceEntry.subjectId,
      teacherId: sourceEntry.teacherId,
    })

    cancelEdgePull()

    if (result.error) {
      return {
        successSlots: [],
        failedSlots: targetSlotIds.map((id: any) => ({ slotId: id, error: result.error! })),
        warnings: [],
      }
    }

    const warnings: { slotId: string; message: string }[] = []
    if (result.warning) {
      warnings.push({ slotId: targetSlotIds[0] ?? '', message: result.warning })
    }

    return {
      successSlots: targetSlotIds,
      failedSlots: [],
      warnings,
    }
  }

  function getBlockPosition(slotId: string, day: string): BlockPosition {
    const entry = entryBySlotId.value[slotId]
    if (!entry) return 'single'

    const daySlots = filteredTimeSlots.value[day] ?? []
    const currentIndex = daySlots.findIndex((s) => s.id === slotId)
    if (currentIndex === -1) return 'single'

    const prevSlot = daySlots[currentIndex - 1]
    const nextSlot = daySlots[currentIndex + 1]

    const hasPrev =
      prevSlot?.id &&
      entryBySlotId.value[prevSlot.id]?.teacherId === entry.teacherId &&
      entryBySlotId.value[prevSlot.id]?.subjectId === entry.subjectId
    const hasNext =
      nextSlot?.id &&
      entryBySlotId.value[nextSlot.id]?.teacherId === entry.teacherId &&
      entryBySlotId.value[nextSlot.id]?.subjectId === entry.subjectId

    if (!hasPrev && !hasNext) return 'single'
    if (!hasPrev && hasNext) return 'start'
    if (hasPrev && !hasNext) return 'end'
    return 'middle'
  }

  // ─── Private helpers ───────────────────────────────────────────────────
  function _findTeacherName(teacherId: string): string {
    return sidebarItems.value.find((s) => s.teacherId === teacherId)?.teacherName ?? ''
  }

  function _findSubjectName(subjectId: string): string {
    return sidebarItems.value.find((s) => s.subjectId === subjectId)?.subjectName ?? ''
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
    batchValidationResults,
    isBatchValidating,
    edgePull,
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
    fetchBatchValidation,
    startEdgePull,
    updateEdgePullTarget,
    cancelEdgePull,
    executeEdgePull,
    getBlockPosition,
  }
})
