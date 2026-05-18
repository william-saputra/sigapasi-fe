import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { scheduleService } from '@/services/schedule/schedule.service'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { ALL_DAYS } from '@/interfaces/schedules/timeSlot.types'
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
  DayOfWeek,
  SlotAvailabilityStatus,
  ValidationSummary,
  IncompleteClassDetail,
  CompletionStatus,
  BlockedReason,
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

  const isWorkspaceActive = ref(false)

  // ─── Edge Pull State ────────────────────────────────────────────────
  const edgePull = ref<EdgePullState>({
    isPulling: false,
    sourceEntry: null,
    sourceSlotId: null,
    sourceDay: null,
    targetSlotIds: [],
    previewSlotIds: new Set(),
  })

  // ─── Proactive Guided UI State ─────────────────────────────────────
  const activeDayFilter = ref<DayOfWeek | null>(null)
  const highlightedSlots = ref<Map<string, { status: SlotAvailabilityStatus; blockedReason?: BlockedReason | null }>>(new Map())
  const activeDragItem = ref<SidebarItemDTO | null>(null)
  const isValidationModalOpen = ref(false)
  const validationSummary = ref<ValidationSummary | null>(null)
  const pendingNavigation = ref<(() => void) | null>(null)
  const pendingCancelNavigation = ref<(() => void) | null>(null)

  // ─── Getters ───────────────────────────────────────────────────────────
  const entryBySlotId = computed<Record<string, ScheduleEntryDTO>>(() =>
    Object.fromEntries(gridEntries.value.map((e) => [e.timeSlotId, e])),
  )

  const sidebarBySubject = computed(() => {
    const itemsToGroup = filteredSidebarItems.value
    const map = new Map<
      string,
      { subjectId: string; subjectName: string; subjectKode: string; teachers: Array<SidebarItemDTO & { isDimmed: boolean }> }
    >()
    for (const item of itemsToGroup) {
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
    
    // Buang grup mata pelajaran yang tidak memiliki guru (akibat strict filtering)
    const groups = Array.from(map.values()).filter(group => group.teachers.length > 0)
    
    groups.sort((a, b) => {
      const activeClass = classSummaries.value.find((c) => c.classId === activeClassId.value)
      
      const getSubjectRatio = (subjectId: string) => {
        const subjectCompletion = activeClass?.subjectCompletions?.find((s: any) => s.subjectId === subjectId)
        const target = subjectCompletion?.targetJp ?? 0
        const current = gridEntries.value.filter((e) => e.subjectId === subjectId).length
        return target > 0 ? current / target : 1
      }

      const ratioA = getSubjectRatio(a.subjectId)
      const ratioB = getSubjectRatio(b.subjectId)
      
      if (ratioA < 1 && ratioB >= 1) return -1
      if (ratioA >= 1 && ratioB < 1) return 1
      return a.subjectName.localeCompare(b.subjectName)
    })
    
    return groups
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

    const levelId = activeClass?.schoolLevelId || (activeClass as any)?.school_level_id
    if (!levelId) {
      console.warn(
        `[DEBUG] Gagal merender Grid! Class ${activeClassName.value} tidak memiliki schoolLevelId dari API.`,
      )
      return result
    }
    const schedules = tsStore.schedules

    for (const day of ALL_DAYS) {
      const dailySlots = schedules[day] || []

      result[day] = dailySlots.filter((s) => {
        const slotLevelId = s.school_level_id
        return String(slotLevelId) === String(levelId)
      })
    }
    return result
  })

  const filteredSidebarItems = computed(() => {
    return sidebarItems.value
      .filter((item) => {
        // Strict Filtering: Jika hari difilter, WAJIB punya slot AVAILABLE/OVERRIDABLE
        if (!activeDayFilter.value) return true
        
        const daySlots = item.availableSlotsByDay[activeDayFilter.value] ?? []
        return daySlots.some(
          (s: any) => s.status === 'AVAILABLE' || s.status === 'OVERRIDABLE'
        )
      })
      .map((item) => {
        const teacherCurrentHours = gridEntries.value.filter(
          (entry) => entry.teacherId === item.teacherId && entry.subjectId === item.subjectId
        ).length;

        const subjectCurrentHours = gridEntries.value.filter(
          (entry) => entry.subjectId === item.subjectId
        ).length;

        const activeClass = classSummaries.value.find((c) => c.classId === activeClassId.value);
        const subjectCompletion = activeClass?.subjectCompletions?.find((s: any) => s.subjectId === item.subjectId);
        const subjectTargetHours = subjectCompletion?.targetJp ?? 0;
        
        const isTeacherFull = item.targetHours > 0 && teacherCurrentHours >= item.targetHours;
        const isSubjectFull = subjectTargetHours > 0 && subjectCurrentHours >= subjectTargetHours;

        return { 
          ...item, 
          currentHours: teacherCurrentHours,
          subjectCurrentHours,
          subjectTargetHours,
          isDimmed: isTeacherFull || isSubjectFull 
        };
      })
  })

  const activeClassFeasibility = computed(() => {
    const cls = classSummaries.value.find((c) => c.classId === activeClassId.value)
    if (!cls) return null
    return {
      isFeasible: cls.isFeasible,
      deficit: cls.deficit,
      availableLessonSlots: cls.availableLessonSlots,
      totalTargetJp: cls.totalTargetJp,
    }
  })

  // ─── Actions ───────────────────────────────────────────────────────────

  async function initWorkspace(draft: ScheduleDraftDTO): Promise<void> {
    activeDraft.value = draft
    activeClassId.value = null
    sidebarItems.value = []
    gridEntries.value = []
    validationResult.value = null
    isWorkspaceActive.value = true
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
    isWorkspaceActive.value = false
  }

  async function fetchClassesSummary(): Promise<void> {
    if (!activeDraft.value) return
    isLoadingSummary.value = true
    try {
      const data = await scheduleService.getClassesSummary(activeDraft.value.scheduleId)
      const rawSummaries = Array.isArray(data) ? data : ((data as any)?.data ?? [])
      classSummaries.value = rawSummaries.map((cls: any) => ({
        ...cls,
        subjectCompletions: cls.subjectCompletions || [],
        completionStatus: (cls.completionStatus as any) || _computeCompletionStatus(cls),
      }))
    } catch (err: any) {
      console.error('Gagal mengambil ringkasan kelas:', err)
    } finally {
      isLoadingSummary.value = false
    }
  }

  async function fetchSidebar(): Promise<void> {
    if (!activeDraft.value || !activeClassId.value) return
    isLoadingSidebar.value = true
    try {
      const data = await scheduleService.getSidebar(
        activeDraft.value.scheduleId,
        activeClassId.value,
      )
      const rawResponse = Array.isArray(data) ? data : ((data as any)?.data ?? [])
      
      const flattened: SidebarItemDTO[] = []
      for (const subjectGroup of rawResponse) {
        for (const teacher of subjectGroup.teachers || []) {
          flattened.push({
            teacherId: teacher.teacherId,
            teacherName: teacher.teacherName,
            subjectId: subjectGroup.subjectId,
            subjectName: subjectGroup.subjectName,
            subjectKode: subjectGroup.subjectKode,
            targetHours: subjectGroup.targetJp || teacher.targetJp || 0,
            currentHours: subjectGroup.currentJp || teacher.currentJp || 0,
            availableSlotsByDay: _mapAvailableSlotsByDay(teacher.availableSlotsByDay),
          })
        }
      }
      sidebarItems.value = flattened
    } catch (err: any) {
      console.error('Gagal mengambil data sidebar:', err)
    } finally {
      isLoadingSidebar.value = false
    }
  }

  async function setActiveClass(classId: string): Promise<void> {
    activeClassId.value = classId
    sidebarItems.value = []
    gridEntries.value = []
    validationResult.value = null
    await Promise.all([fetchSidebar(), fetchGridEntries()])
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

  async function assignEntry(
    payload: BulkAssignRequestDTO,
  ): Promise<{ success?: string; warning?: string; error?: string }> {
    if (!activeDraft.value) return { error: 'Tidak ada draf aktif.' }

    // Validasi kuota JP di frontend sebelum hit API
    const targetItem = sidebarItems.value.find(
      (item) => item.subjectId === payload.subjectId && item.teacherId === payload.teacherId
    )

    if (targetItem) {
      const teacherCurrentHours = gridEntries.value.filter(
        (entry) => entry.teacherId === payload.teacherId && entry.subjectId === payload.subjectId
      ).length;

      const subjectCurrentHours = gridEntries.value.filter(
        (entry) => entry.subjectId === payload.subjectId
      ).length;

      const activeClass = classSummaries.value.find((c) => c.classId === activeClassId.value);
      const subjectCompletion = activeClass?.subjectCompletions?.find((s: any) => s.subjectId === payload.subjectId);
      const subjectTargetHours = subjectCompletion?.targetJp ?? 0;

      if (subjectTargetHours > 0 && subjectCurrentHours + payload.timeSlotIds.length > subjectTargetHours) {
        const errorMsg = `Gagal menetapkan jadwal: Melebihi batas kuota mata pelajaran (${subjectTargetHours} JP).`
        if (toast) toast.error(errorMsg)
        return { error: errorMsg }
      }

      if (targetItem.targetHours > 0 && teacherCurrentHours + payload.timeSlotIds.length > targetItem.targetHours) {
        const errorMsg = `Gagal menetapkan jadwal: Melebihi batas kuota jam mengajar guru (${targetItem.targetHours} JP).`
        if (toast) toast.error(errorMsg)
        return { error: errorMsg }
      }
    }

    payload.timeSlotIds.forEach((id) => pendingCells.value.add(id))

    try {
      const result: any = await scheduleService.bulkAssign(activeDraft.value.scheduleId, payload)

      await Promise.all([
        fetchGridEntries(),
        fetchClassesSummary(),
        fetchSidebar(),
      ])

      if (result.status === 'WARNING') {
        return { warning: result?.message }
      }
      return { success: result?.message ?? 'Jadwal berhasil ditambahkan.' }
    } catch (err: any) {
      console.error('DEBUG CATCH ASSIGN ENTRY:', err)
      const apiMessage = err.response?.data?.message || 'Terjadi kesalahan server'

      if (toast) {
        toast.error(apiMessage)
      }

      return { error: apiMessage }
    } finally {
      payload.timeSlotIds.forEach((id) => pendingCells.value.delete(id))
    }
  }

  async function deleteEntry(entryId: string): Promise<{ success?: string; error?: string }> {
    if (!entryId) return { error: 'Jadwal belum tersimpan di database. Silakan tunggu sebentar.' }
    try {
      await scheduleService.deleteEntry(entryId)
      await Promise.all([fetchGridEntries(), fetchClassesSummary(), fetchSidebar()])
      return { success: 'Jadwal berhasil dihapus.' }
    } catch (err: any) {
      const apiMessage = err.response?.data?.message ?? 'Terjadi kesalahan saat menghapus jadwal.'
      if (toast) toast.error(apiMessage)
      return { error: apiMessage }
    }
  }

  async function clearClassEntries(): Promise<{ success?: string; error?: string }> {
    if (!activeDraft.value || !activeClassId.value) return { error: 'Kelas tidak aktif.' }
    try {
      await scheduleService.clearClass(activeDraft.value.scheduleId, activeClassId.value)
      await Promise.all([fetchGridEntries(), fetchClassesSummary(), fetchSidebar()])
      return { success: 'Jadwal kelas berhasil dikosongkan.' }
    } catch (err: any) {
      const apiMessage =
        err.response?.data?.message ?? 'Terjadi kesalahan saat mengosongkan jadwal.'
      if (toast) toast.error(apiMessage)
      return { error: apiMessage }
    }
  }

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

  // ─── Proactive Guided UI Actions ─────────────────────────────────────
  function setDayFilter(day: DayOfWeek | null): void {
    activeDayFilter.value = activeDayFilter.value === day ? null : day
  }

  function startDrag(item: SidebarItemDTO): void {
    activeDragItem.value = item
    highlightedSlots.value.clear()
    if (activeDayFilter.value) {
      const daySlots = (item.availableSlotsByDay as any)[activeDayFilter.value as any]
      if (daySlots) {
        for (const slot of daySlots) {
          highlightedSlots.value.set(slot.slotId, { status: slot.status, blockedReason: slot.blockedReason })
        }
      }
    } else {
      for (const day of ALL_DAYS) {
        const slots = (item.availableSlotsByDay as any)[day as any] ?? []
        for (const slot of slots) {
          highlightedSlots.value.set(slot.slotId, { status: slot.status, blockedReason: slot.blockedReason })
        }
      }
    }
  }

  function endDrag(): void {
    activeDragItem.value = null
    highlightedSlots.value.clear()
  }

  async function openValidationModal(): Promise<void> {
    validationSummary.value = null
    isValidationModalOpen.value = true
    
    if (!activeDraft.value) return
    
    const results = await fetchBatchValidation(activeDraft.value.scheduleId)
    
    if (!results) return
    
    const incompleteClasses: IncompleteClassDetail[] = []
    let actualCompleteCount = 0

    for (const cls of results) {
      const classSummary = classSummaries.value.find((c) => c.classId === cls.classId)
      
      // Frontend Override: Validate against our local summary
      const isComplete = classSummary 
        ? classSummary.completionStatus === 'COMPLETE' || classSummary.filledHours >= classSummary.targetHours
        : cls.isValid

      if (isComplete) {
        actualCompleteCount++
      } else {
        const isFeasible = classSummary?.isFeasible ?? true
        const deficit = classSummary?.deficit ?? 0
        
        if (!isFeasible) {
          incompleteClasses.push({
            classId: cls.classId,
            className: cls.className,
            missingSubjects: [],
            isFeasible: false,
            deficit,
          })
        } else {
          incompleteClasses.push({
            classId: cls.classId,
            className: cls.className,
            missingSubjects: (cls.incompleteSubjects || []).map((s) => ({
              subjectName: s.subjectName,
              missingHours: s.shortfall,
            })),
            isFeasible: true,
            deficit: 0,
          })
        }
      }
    }
    
    validationSummary.value = {
      totalClasses: results.length,
      completeCount: actualCompleteCount,
      incompleteClasses,
    }
  }

  function confirmValidationAndNavigate(): void {
    isValidationModalOpen.value = false
    if (pendingNavigation.value) {
      pendingNavigation.value()
      pendingNavigation.value = null
      pendingCancelNavigation.value = null
    }
  }

  function cancelValidation(): void {
    isValidationModalOpen.value = false
    if (pendingCancelNavigation.value) {
      pendingCancelNavigation.value()
    }
    pendingNavigation.value = null
    pendingCancelNavigation.value = null
  }

  function setPendingNavigation(callback: (() => void) | null, cancelCallback: (() => void) | null = null): void {
    pendingNavigation.value = callback
    pendingCancelNavigation.value = cancelCallback
  }

  // ─── Private helpers ───────────────────────────────────────────────────
  function _findTeacherName(teacherId: string): string {
    return sidebarItems.value.find((s) => s.teacherId === teacherId)?.teacherName ?? ''
  }

  function _findSubjectName(subjectId: string): string {
    return sidebarItems.value.find((s) => s.subjectId === subjectId)?.subjectName ?? ''
  }

  function _computeCompletionStatus(cls: ClassSummaryDTO): CompletionStatus {
    if (!cls.targetHours || cls.targetHours === 0) return 'EMPTY'
    if (cls.filledHours >= cls.targetHours) return 'COMPLETE'
    if (cls.filledHours > 0) return 'PARTIAL'
    return 'EMPTY'
  }

  function _mapAvailableSlotsByDay(raw: any): Record<DayOfWeek, Array<{ slotId: string; status: SlotAvailabilityStatus; existingEntryId?: string | null; blockedReason?: BlockedReason | null }>> {
    const DAY_NUMBER_TO_KEY: Record<string, DayOfWeek> = {
      '1': 'MON', '2': 'TUE', '3': 'WED', '4': 'THU', '5': 'FRI',
      '6': 'SAT', '7': 'SUN',
    }
    
    const result: Record<DayOfWeek, Array<any>> = {
      MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [], SUN: [],
    }
    
    if (!raw) return result
    
    for (const [dayNum, slots] of Object.entries(raw)) {
      const dayKey = DAY_NUMBER_TO_KEY[dayNum]
      if (dayKey && Array.isArray(slots)) {
        result[dayKey] = slots
      }
    }
    return result
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
    isWorkspaceActive,
    edgePull,
    activeDayFilter,
    highlightedSlots,
    activeDragItem,
    isValidationModalOpen,
    validationSummary,
    pendingNavigation,
    // Getters
    entryBySlotId,
    sidebarBySubject,
    activeClassName,
    filteredTimeSlots,
    filteredSidebarItems,
    activeClassFeasibility,
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
    setDayFilter,
    startDrag,
    endDrag,
    openValidationModal,
    confirmValidationAndNavigate,
    cancelValidation,
    setPendingNavigation,
  }
})