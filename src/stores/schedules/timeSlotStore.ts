import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api.service'
import type {
    TimeSlotResponseDTO,
    SlotStructureRequestDTO,
    SlotRequestDTO,
    DayOfWeekEnum,
    SlotTypeEnum,
    UISlot,
    AcademicYearSemesterResponseDTO,
    SchoolLevelResponseDTO,
    CreateAcademicYearRequestDTO,
    CreateSemesterRequestDTO,
} from '@/interfaces/schedules/timeSlot.types'
import { ALL_DAYS } from '@/interfaces/schedules/timeSlot.types'

// --- Configuration Helpers ---

/** Extract "HH:mm" from ISO LocalDateTime string like "1970-01-01T07:45:00" */
function parseIsoTime(isoString: string): string {
    if (!isoString) return '00:00'
    const timePart = isoString.includes('T') ? isoString.split('T')[1] : isoString
    const [h, m] = (timePart ?? '00:00:00').split(':')
    return `${h}:${m}`
}

/** Convert "07:45" → "07:45:00" for backend requests */
function formatToLocalTime(hhMm: string): string {
    return hhMm.length === 5 ? `${hhMm}:00` : hhMm
}

/** Calculate duration in minutes between two "HH:mm" strings */
function calcDuration(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    return ((eh ?? 0) * 60 + (em ?? 0)) - ((sh ?? 0) * 60 + (sm ?? 0))
}

/** Build an empty schedules record */
function emptySchedules(): Record<DayOfWeekEnum, UISlot[]> {
    return ALL_DAYS.reduce(
        (acc, day) => {
            acc[day] = []
            return acc
        },
        {} as Record<DayOfWeekEnum, UISlot[]>,
    )
}

// --- Store ---

export const useTimeSlotStore = defineStore('timeSlot', () => {
    // --- State ---
    const currentDay = ref<DayOfWeekEnum>('MON')
    const schedules = ref<Record<DayOfWeekEnum, UISlot[]>>(emptySchedules())
    const isLoading = ref(false)
    const isSaving = ref(false)
    const error = ref<string | null>(null)

    const academicYears = ref<AcademicYearSemesterResponseDTO[]>([])
    const activeAcademicYearId = ref<string>('')
    const activeSemesterId = ref<string>('')
    const activeSchoolLevelId = ref<string>('')
    const schoolLevels = ref<SchoolLevelResponseDTO[]>([])

    // --- Computed & Getters ---
    const currentSchedule = computed(() => schedules.value[currentDay.value])

    /**
     * Constructs a unified master grid representation.
     * Groups slots by start times across all available grades.
     */
    interface MasterGridRow {
        timeLabel: string
        start_time: string
        end_time: string
        duration: number
        sessionLabel: string
        slots: Partial<Record<string, UISlot>>
    }

    const masterGridData = computed(() => {
        const result: Record<string, MasterGridRow[]> = {}

        for (const day of ALL_DAYS) {
            const daySlots = schedules.value[day] ?? []

            // Collect all unique start_times across all grades, sorted
            const timeKeySet = new Set<string>()
            daySlots.forEach(s => timeKeySet.add(s.start_time))
            const sortedTimes = Array.from(timeKeySet).sort()

            result[day] = sortedTimes.map(startTime => {
                // All slots at this start_time (could be multiple grades)
                const slotsAtTime = daySlots.filter(s => s.start_time === startTime)
                const representative = slotsAtTime[0]

                // Build slot-map: school_level_id -> UISlot
                const slotsByLevel: Partial<Record<string, UISlot>> = {}
                for (const sl of slotsAtTime) {
                    if (sl.school_level_id !== undefined) {
                        slotsByLevel[sl.school_level_id] = sl
                    }
                }

                // Determine session label
                let sessionLabel = '–'
                if (representative) {
                    if (representative.slot_type === 'BREAK') {
                        sessionLabel = 'Istirahat'
                    } else if (representative.slot_type === 'LESSON' && representative.session_number > 0) {
                        sessionLabel = `JP ${representative.session_number}`
                    }
                    if (representative.is_locked && representative.locked_label) {
                        sessionLabel = representative.locked_label
                    }
                }

                return {
                    start_time: startTime,
                    end_time: representative?.end_time ?? '',
                    timeLabel: `${startTime}${representative?.end_time ? ' – ' + representative.end_time : ''}`,
                    duration: representative?.duration ?? 0,
                    sessionLabel,
                    slots: slotsByLevel,
                } as MasterGridRow
            })
        }

        return result as Record<string, MasterGridRow[]>
    })

    /**
     * Flattened semesters for the integrated semester dropdown UI
     */
    const flattenedSemesters = computed(() => {
        const result: { id: string; academic_year_id: string; display_name: string }[] = []
        for (const ay of academicYears.value) {
            for (const sem of ay.listSemesters) {
                result.push({
                    id: sem.id,
                    academic_year_id: ay.id,
                    display_name: `${sem.name}`,
                })
            }
        }
        return result
    })

    // --- Store Local Utilities ---

    /** Generates a formatted time string from numerical hour and minute values */
    function formatTime(h: number, m: number): string {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    /** Parses a formatted time string into numerical hour and minute values */
    function parseTime(time: string): { h: number; m: number } {
        const parts = time.split(':').map(Number)
        return { h: parts[0] ?? 0, m: parts[1] ?? 0 }
    }

    /** Recalculates end times and session numbers sequentially based on durations */
    function recalculateTimes(day?: DayOfWeekEnum, startTime?: string): void {
        const targetDay = day ?? currentDay.value
        const slots = schedules.value[targetDay]
        if (!slots || slots.length === 0) return

        const firstStart = startTime ?? slots[0]?.start_time ?? '07:00'
        let { h, m } = parseTime(firstStart)
        let lessonCounter = 1

        slots.forEach((slot) => {
            slot.start_time = formatTime(h, m)
            m += slot.duration
            while (m >= 60) {
                m -= 60
                h++
            }
            slot.end_time = formatTime(h, m)

            if (slot.slot_type === 'LESSON') {
                slot.session_number = lessonCounter++
            } else {
                slot.session_number = 0
            }
        })
    }

    // --- Actions ---

    function setCurrentDay(day: DayOfWeekEnum): void {
        currentDay.value = day
    }

    /** Fetch all School Levels from the backend */
    async function fetchSchoolLevels(): Promise<void> {
        error.value = null
        try {
            const data = await apiService.get<SchoolLevelResponseDTO[]>('/school-levels')
            // Deduplicate school levels on save
            const uniqueMap = new Map<string, SchoolLevelResponseDTO>()
            data.forEach((level) => {
                if (!uniqueMap.has(level.id)) {
                    uniqueMap.set(level.id, level)
                }
            })
            schoolLevels.value = Array.from(uniqueMap.values())

            if (schoolLevels.value.length > 0 && !activeSchoolLevelId.value) {
                const firstData = schoolLevels.value[0]
                if (firstData) activeSchoolLevelId.value = firstData.id
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || err.message || 'Gagal mengambil data jenjang pendidikan.'
        }
    }

    /** Fetch all Academic Years and their semesters from the backend */
    async function fetchAcademicYears(): Promise<void> {
        error.value = null
        try {
            const data = await apiService.get<AcademicYearSemesterResponseDTO[]>('/slot/academic-years')
            academicYears.value = data

            // Auto-select the active academic year if not already set
            if (!activeAcademicYearId.value) {
                const activeYear = data.find((ay) => ay.is_active || ay.isActive)
                if (activeYear) {
                    activeAcademicYearId.value = activeYear.id
                } else if (data.length > 0) {
                    const firstData = data[0]
                    if (firstData) activeAcademicYearId.value = firstData.id
                }
            }

            // Auto-select the active semester if not already set
            if (!activeSemesterId.value && activeAcademicYearId.value) {
                const selectedYear = data.find(ay => ay.id === activeAcademicYearId.value)
                if (selectedYear) {
                    const activeSemester = selectedYear.listSemesters.find((s) => s.is_active || s.isActive)
                    if (activeSemester) {
                        activeSemesterId.value = activeSemester.id
                    } else if (selectedYear.listSemesters.length > 0) {
                        const firstSemester = selectedYear.listSemesters[0]
                        if (firstSemester) activeSemesterId.value = firstSemester.id
                    }
                }
            }
        } catch (err: any) {
            error.value =
                err.response?.data?.message || err.message || 'Gagal mengambil data tahun ajaran.'
            return
        }

        // After fetching academic years & resolving semester, load the slot structure
        await fetchSlotStructure()
    }

    async function createAcademicYear(payload: CreateAcademicYearRequestDTO): Promise<void> {
        error.value = null
        try {
            await apiService.post('/academic-setup/academic-years', payload)
            await fetchAcademicYears()
        } catch (err: any) {
            console.log(err.response.data.message)
            error.value = err.response?.data?.message || 'Gagal membuat tahun ajaran baru.'
            throw err
        }
    }

    async function createSemester(payload: CreateSemesterRequestDTO): Promise<void> {
        error.value = null
        try {
            await apiService.post('/academic-setup/semesters', payload)
            await fetchAcademicYears() // Refetch to update list
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal membuat semester baru.'
            throw err
        }
    }

    /** Retrieves slot configurations for all grade levels operating in parallel */
    async function fetchSlotStructureForAll(): Promise<void> {
        if (!activeSemesterId.value) {
            schedules.value = emptySchedules()
            return
        }

        isLoading.value = true
        error.value = null
        try {
            // Fetch all grades at once (no grade_level param)
            const data = await apiService.get<TimeSlotResponseDTO[]>('/slot/structure', {
                params: { semester_id: activeSemesterId.value },
            })

            // Reset schedules
            schedules.value = emptySchedules()
            
            if (!data || data.length === 0) {
                return // Graceful Empty State
            }

            // Merge all results
            data.forEach((dto: any) => {
                const day = (dto.dayOfWeek || dto.day_of_week) as DayOfWeekEnum
                const startStr = dto.startTime || dto.start_time
                const endStr = dto.endTime || dto.end_time
                const sessionNum = dto.sessionNumber !== undefined ? dto.sessionNumber : dto.session_number
                const slotType = dto.slotType || dto.slot_type
                const isLocked = dto.isLocked !== undefined ? dto.isLocked : dto.is_locked
                const lockedLabel = dto.lockedLabel !== undefined ? dto.lockedLabel : dto.locked_label
                const schoolLevelId = dto.schoolLevelId !== undefined ? dto.schoolLevelId : dto.school_level_id
                const schoolLevelName = dto.schoolLevelName !== undefined ? dto.schoolLevelName : dto.school_level_name

                const startHHmm = parseIsoTime(startStr)
                const endHHmm = parseIsoTime(endStr)

                const uiSlot: UISlot = {
                    id: dto.id,
                    session_number: sessionNum,
                    start_time: startHHmm,
                    end_time: endHHmm,
                    slot_type: slotType,
                    is_locked: !!isLocked,
                    locked_label: lockedLabel,
                    duration: calcDuration(startHHmm, endHHmm),
                    school_level_id: schoolLevelId,
                    school_level_name: schoolLevelName,
                }

                if (schedules.value[day]) {
                    schedules.value[day].push(uiSlot)
                }
            })

            // Sort each day by start_time
            for (const day of ALL_DAYS) {
                schedules.value[day].sort((a, b) => {
                    const aMin = parseTime(a.start_time)
                    const bMin = parseTime(b.start_time)
                    return (aMin.h * 60 + aMin.m) - (bMin.h * 60 + bMin.m)
                })
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || err.message || 'Gagal mengambil data semua tingkatan.'
        } finally {
            isLoading.value = false
        }
    }

    /** Fetch all slot structures from the backend and populate schedules */
/** Fetch all slot structures from the backend and populate schedules */
    async function fetchSlotStructure(): Promise<void> {
        // PERBAIKAN: Hapus guard activeSchoolLevelId karena halaman Guru tidak punya dropdown itu.
        if (!activeSemesterId.value) {
            schedules.value = emptySchedules()
            return
        }

        isLoading.value = true
        error.value = null
        try {
            // PERBAIKAN: Hanya kirim school_level_id JIKA isinya tidak kosong (berasal dari halaman Admin)
            const params: any = { semester_id: activeSemesterId.value }
            if (activeSchoolLevelId.value) {
                params.school_level_id = activeSchoolLevelId.value
            }

            const data = await apiService.get<TimeSlotResponseDTO[]>('/slot/structure', { params })

            // Reset all days
            schedules.value = emptySchedules()

            if (!data || data.length === 0) {
                return // Graceful Empty State
            }

            // Group by day_of_week, parse times
            data.forEach((dto: any) => {
                const day = (dto.dayOfWeek || dto.day_of_week) as DayOfWeekEnum
                const startStr = dto.startTime || dto.start_time
                const endStr = dto.endTime || dto.end_time
                const sessionNum = dto.sessionNumber !== undefined ? dto.sessionNumber : dto.session_number
                const slotType = dto.slotType || dto.slot_type
                const isLocked = dto.isLocked !== undefined ? dto.isLocked : dto.is_locked
                const lockedLabel = dto.lockedLabel !== undefined ? dto.lockedLabel : dto.locked_label
                const schoolLevelId = dto.schoolLevelId !== undefined ? dto.schoolLevelId : dto.school_level_id
                const schoolLevelName = dto.schoolLevelName !== undefined ? dto.schoolLevelName : dto.school_level_name

                const startHHmm = parseIsoTime(startStr)
                const endHHmm = parseIsoTime(endStr)

                const uiSlot: UISlot = {
                    id: dto.id,
                    session_number: sessionNum,
                    start_time: startHHmm,
                    end_time: endHHmm,
                    slot_type: slotType,
                    is_locked: !!isLocked,
                    locked_label: lockedLabel,
                    duration: calcDuration(startHHmm, endHHmm),
                    school_level_id: schoolLevelId,
                    school_level_name: schoolLevelName,
                }

                if (schedules.value[day]) {
                    schedules.value[day].push(uiSlot)
                }
            })

            // Sort each day by start_time
            for (const day of ALL_DAYS) {
                schedules.value[day].sort((a, b) => {
                    const aMin = parseTime(a.start_time)
                    const bMin = parseTime(b.start_time)
                    return (aMin.h * 60 + aMin.m) - (bMin.h * 60 + bMin.m)
                })
            }
        } catch (err: any) {
            // Only set error for non-200 HTTP errors. Axios treats 200 OK as success, so [] won't throw error
            error.value = err.response?.data?.message || err.message || 'Gagal mengambil data struktur slot.'
        } finally {
            isLoading.value = false
        }
    }
    
    /** Persists slot structure modifications for specific grades to the backend API */
    async function saveSlotStructure(
        day: DayOfWeekEnum,
        slotsToSave: UISlot[],
        semesterId: string,
        applyToAllLevels: boolean,
        skipFetch: boolean = false,
    ): Promise<void> {
        isSaving.value = true
        error.value = null
        try {
            const totalDuration = slotsToSave.reduce((sum, slot) => sum + slot.duration, 0)
            if (totalDuration > 1440) {
                console.log(totalDuration)
                throw new Error('Total durasi keseluruhan dalam satu hari tidak boleh melebihi 1440 menit.')
            }

            const hasInvalidTime = slotsToSave.some(slot => {
                const startHour = parseInt(slot.start_time.split(':')[0] || '0')
                const endHour = parseInt(slot.end_time.split(':')[0] || '0')
                return startHour >= 24 || endHour >= 24
            })
            if (hasInvalidTime) {
                throw new Error('Akumulasi waktu berakhir melebihi jam 23:59. Silakan sesuaikan kembali jadwal.')
            }

            const pendingLocks = slotsToSave.filter((s) => s.is_locked)
            console.log("Saving slot structure. pendingLocks size:", pendingLocks.length, pendingLocks);

            const slots: any[] = slotsToSave.map((s) => ({
                session_number: s.session_number,
                start_time: formatToLocalTime(s.start_time),
                end_time: formatToLocalTime(s.end_time),
                slot_type: s.slot_type as SlotTypeEnum,
                is_locked: s.is_locked,
                locked_label: s.locked_label,
            }))

            const applyLocks = async (gradeData: any[]) => {
                if (pendingLocks.length === 0) return;
                for (const lock of pendingLocks) {
                    const matchingDto = gradeData.find((dto: any) => {
                        const startStr = dto.startTime || dto.start_time
                        return parseIsoTime(startStr) === lock.start_time &&
                            (dto.dayOfWeek || dto.day_of_week) === day
                    })
                    if (matchingDto && matchingDto.id && lock.locked_label) {
                        try {
                            await apiService.post(`/slot/locked-slots/${matchingDto.id}`, {
                                lockedLabel: lock.locked_label,
                                locked_label: lock.locked_label
                            })
                        } catch (e) {
                            console.error("Locking failed for slot", matchingDto.id, e);
                        }
                    }
                }
            }

            if (applyToAllLevels) {
                for (const level of schoolLevels.value) {
                    const payload: any = {
                        semester_id: semesterId,
                        day_of_week: day,
                        school_level_id: level.id,
                        slots,
                    }
                    try {
                        const response = await apiService.post<any>('/slot/structure', payload)
                        
                        // If response is an array, apply locks immediately using its elements
                        if (response && Array.isArray(response)) {
                            await applyLocks(response)
                        } else if (response && response.data && Array.isArray(response.data)) {
                            await applyLocks(response.data)
                        } else {
                            // Fallback to GET
                            const gradeData = await apiService.get<TimeSlotResponseDTO[]>('/slot/structure', {
                                params: {
                                    semester_id: semesterId,
                                    school_level_id: level.id,
                                },
                            })
                            await applyLocks(Array.isArray(gradeData) ? gradeData : (gradeData as any).data || [])
                        }
                    } catch (err: any) {
                        if (err.response?.status === 409) {
                            console.warn(`Pengaturan slot waktu pada semester dan tingkat ${level.id} ini sudah ada (409 Conflict).`)
                        } else {
                            throw err
                        }
                    }
                }
            } else {
                const payload: any = {
                    semester_id: semesterId,
                    day_of_week: day,
                    school_level_id: activeSchoolLevelId.value,
                    slots,
                }
                try {
                    const response = await apiService.post<any>('/slot/structure', payload)
                    
                    if (response && Array.isArray(response)) {
                        await applyLocks(response)
                    } else if (response && response.data && Array.isArray(response.data)) {
                        await applyLocks(response.data)
                    } else {
                        const gradeData = await apiService.get<TimeSlotResponseDTO[]>('/slot/structure', {
                            params: {
                                semester_id: semesterId,
                                school_level_id: activeSchoolLevelId.value,
                            },
                        })
                        await applyLocks(Array.isArray(gradeData) ? gradeData : (gradeData as any).data || [])
                    }
                } catch (err: any) {
                    if (err.response?.status === 409) {
                        console.warn('Pengaturan slot waktu pada semester dan tingkat ini sudah ada (409 Conflict).')
                        // You could add an error message store here if TimeSlotConfig uses it.
                    } else {
                        throw err
                    }
                }
            }

            // Final refresh to sync lock state
            if (!skipFetch) {
                await fetchSlotStructure()
            }

        } catch (err: any) {
            if (err.response) {
                error.value = err.response?.data?.message || 'Terjadi konflik jadwal. Gagal menyimpan.'
            } else {
                error.value = err.message || 'Terjadi konflik jadwal. Gagal menyimpan.'
            }
            throw err
        } finally {
            isSaving.value = false
        }
    }

    /** Lock a specific slot via the backend */
    async function lockSlot(slotId: string, label: string): Promise<void> {
        isSaving.value = true
        error.value = null
        try {
            await apiService.post(`/slot/locked-slots/${slotId}`, {
                lockedLabel: label,
                locked_label: label
            })
            await fetchSlotStructure()
        } catch (err: any) {
            error.value =
                err.response?.data?.message || 'Gagal mengunci slot.'
            throw err
        } finally {
            isSaving.value = false
        }
    }

    /** Unlock a specific slot via the backend */
    async function unlockSlot(slotId: string): Promise<void> {
        isSaving.value = true
        error.value = null
        try {
            await apiService.delete(`/slot/locked-slots/${slotId}`)
            await fetchSlotStructure()
        } catch (err: any) {
            error.value =
                err.response?.data?.message || 'Gagal membuka kunci slot.'
            throw err
        } finally {
            isSaving.value = false
        }
    }

    // --- Local Configuration Procedures ---

    /** Generates sequential default slots starting from the active configuration time */
    function generateSlots(count: number, duration: number, startTime: string): void {
        const slots: UISlot[] = []
        for (let i = 0; i < count; i++) {
            slots.push({
                session_number: i + 1,
                start_time: '',
                end_time: '',
                slot_type: 'LESSON',
                duration,
                is_locked: false,
                locked_label: null,
            })
        }
        schedules.value[currentDay.value] = slots
        recalculateTimes(currentDay.value, startTime)
    }

    function addSlot(type: SlotTypeEnum): void {
        schedules.value[currentDay.value].push({
            session_number: 0,
            start_time: '',
            end_time: '',
            slot_type: type,
            duration: type === 'BREAK' ? 15 : 45,
            is_locked: false,
            locked_label: null,
        })
        recalculateTimes()
    }

    function removeSlot(index: number): void {
        schedules.value[currentDay.value].splice(index, 1)
        recalculateTimes()
    }

    function updateSlotDuration(index: number, newDuration: number): void {
        const slot = schedules.value[currentDay.value][index]
        if (slot) {
            slot.duration = newDuration
            recalculateTimes()
        }
    }

    function updateStartTime(startTime: string): void {
        recalculateTimes(currentDay.value, startTime)
    }

    function copyScheduleToDays(targetDays: DayOfWeekEnum[]): void {
        const sourceSlots = schedules.value[currentDay.value]
        targetDays.forEach((day) => {
            if (day !== currentDay.value) {
                schedules.value[day] = sourceSlots.map((slot) => ({
                    ...slot,
                    id: undefined, // new unsaved slots
                }))
                recalculateTimes(day)
            }
        })
    }

    function reorderSlots(oldIndex: number, newIndex: number): void {
        const slots = schedules.value[currentDay.value]
        const removed = slots.splice(oldIndex, 1)
        if (removed[0]) {
            slots.splice(newIndex, 0, removed[0])
        }
        recalculateTimes()
    }

    function clearError(): void {
        error.value = null
    }

    /** Flushes any configuration locally made on the active day */
    function clearCurrentDaySlots(): void {
        schedules.value[currentDay.value] = []
    }

    return {
        // State
        currentDay,
        schedules,
        isLoading,
        isSaving,
        error,
        // NEW State
        academicYears,
        activeAcademicYearId,
        activeSemesterId,
        activeSchoolLevelId,
        schoolLevels,
        // Getters
        currentSchedule,
        masterGridData,
        flattenedSemesters,
        // API Actions
        fetchSchoolLevels,
        fetchAcademicYears,
        createAcademicYear,
        createSemester,
        fetchSlotStructure,
        fetchSlotStructureForAll,
        saveSlotStructure,
        lockSlot,
        unlockSlot,
        clearError,
        // Local Procedures
        setCurrentDay,
        generateSlots,
        addSlot,
        removeSlot,
        clearCurrentDaySlots,
        updateSlotDuration,
        updateStartTime,
        copyScheduleToDays,
        reorderSlots,
    }
})
