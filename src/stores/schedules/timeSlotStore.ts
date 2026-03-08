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
    const activeSemesterId = ref<string>('')
    const activeGrade = ref<number | null>(10)
    const availableGrades = ref<number[]>([10, 11, 12])

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
        slots: Record<number, UISlot | undefined>
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

                // Build slot-map: grade_level -> UISlot
                const slotsByGrade: Record<number, UISlot | undefined> = {}
                for (const sl of slotsAtTime) {
                    if (sl.grade_level !== undefined) {
                        slotsByGrade[sl.grade_level] = sl
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
                    slots: slotsByGrade,
                } as MasterGridRow
            })
        }

        return result as Record<string, MasterGridRow[]>
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

    /** Fetch all Academic Years and their semesters from the backend */
    async function fetchAcademicYears(): Promise<void> {
        error.value = null
        try {
            const data = await apiService.get<AcademicYearSemesterResponseDTO[]>('/slot/academic-years')
            academicYears.value = data

            // Auto-select the active semester if not already set
            if (!activeSemesterId.value) {
                for (const ay of data) {
                    const activeSemester = ay.listSemesters.find((s) => s.isActive)
                    if (activeSemester) {
                        activeSemesterId.value = activeSemester.id
                        break
                    }
                }
                // Fallback: pick the first semester available
                if (!activeSemesterId.value && data.length > 0) {
                    const firstSemester = data[0]?.listSemesters?.[0]
                    if (firstSemester) {
                        activeSemesterId.value = firstSemester.id
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

    /** Retrieves slot configurations for all grade levels operating in parallel */
    async function fetchSlotStructureForAll(): Promise<void> {
        if (!activeSemesterId.value) {
            schedules.value = emptySchedules()
            return
        }

        isLoading.value = true
        error.value = null
        try {
            // Fetch all grades in parallel
            const requests = availableGrades.value.map(grade =>
                apiService.get<TimeSlotResponseDTO[]>('/slot/structure', {
                    params: { semester_id: activeSemesterId.value, grade_level: grade },
                })
            )
            const results = await Promise.all(requests)

            // Reset schedules
            schedules.value = emptySchedules()

            // Merge all results
            results.flat().forEach((dto: any) => {
                const day = (dto.dayOfWeek || dto.day_of_week) as DayOfWeekEnum
                const startStr = dto.startTime || dto.start_time
                const endStr = dto.endTime || dto.end_time
                const sessionNum = dto.sessionNumber !== undefined ? dto.sessionNumber : dto.session_number
                const slotType = dto.slotType || dto.slot_type
                const isLocked = dto.isLocked !== undefined ? dto.isLocked : dto.is_locked
                const lockedLabel = dto.lockedLabel !== undefined ? dto.lockedLabel : dto.locked_label
                const gradeLevel = dto.gradeLevel !== undefined ? dto.gradeLevel : dto.grade_level

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
                    grade_level: gradeLevel,
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
    async function fetchSlotStructure(): Promise<void> {
        // Guard: only fetch when both semester and grade are selected
        if (!activeSemesterId.value || activeGrade.value === null) {
            schedules.value = emptySchedules()
            return
        }

        isLoading.value = true
        error.value = null
        try {
            const data = await apiService.get<TimeSlotResponseDTO[]>('/slot/structure', {
                params: {
                    semester_id: activeSemesterId.value,
                    grade_level: activeGrade.value,
                },
            })

            console.log(data)
            // Reset all days
            schedules.value = emptySchedules()

            // Group by day_of_week, parse times
            data.forEach((dto: any) => {
                const day = (dto.dayOfWeek || dto.day_of_week) as DayOfWeekEnum
                const startStr = dto.startTime || dto.start_time
                const endStr = dto.endTime || dto.end_time
                const sessionNum = dto.sessionNumber !== undefined ? dto.sessionNumber : dto.session_number
                const slotType = dto.slotType || dto.slot_type
                const isLocked = dto.isLocked !== undefined ? dto.isLocked : dto.is_locked
                const lockedLabel = dto.lockedLabel !== undefined ? dto.lockedLabel : dto.locked_label
                const gradeLevel = dto.gradeLevel !== undefined ? dto.gradeLevel : dto.grade_level

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
                    grade_level: gradeLevel,
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
            error.value =
                err.response?.data?.message || err.message || 'Gagal mengambil data struktur slot.'
        } finally {
            isLoading.value = false
        }
    }

    /** Persists slot structure modifications for specific grades to the backend API */
    async function saveSlotStructure(
        day: DayOfWeekEnum,
        slotsToSave: UISlot[],
        semesterId: string,
        targetGrades: number[],
    ): Promise<void> {
        isSaving.value = true
        error.value = null
        try {
            const pendingLocks = slotsToSave.filter((s) => s.is_locked)

            const slots: any[] = slotsToSave.map((s) => ({
                sessionNumber: s.session_number,
                session_number: s.session_number,
                startTime: formatToLocalTime(s.start_time),
                start_time: formatToLocalTime(s.start_time),
                endTime: formatToLocalTime(s.end_time),
                end_time: formatToLocalTime(s.end_time),
                slotType: s.slot_type as SlotTypeEnum,
                slot_type: s.slot_type as SlotTypeEnum,
            }))

            // POST once per target grade
            for (const targetGrade of targetGrades) {
                const payload: any = {
                    semesterId: semesterId,
                    semester_id: semesterId,
                    dayOfWeek: day,
                    day_of_week: day,
                    gradeLevel: targetGrade,
                    grade_level: targetGrade,
                    slots,
                }
                await apiService.post('/slot/structure', payload)
            }

            // Refresh from the backend to get server-generated IDs & validated data
            await fetchSlotStructure()

            // Re-apply locks: match by start_time to get the new server UUIDs
            if (pendingLocks.length > 0) {
                const newSlots = schedules.value[day]

                for (const lock of pendingLocks) {
                    const matchingNewSlot = newSlots.find((s) => s.start_time === lock.start_time)

                    if (matchingNewSlot && matchingNewSlot.id && lock.locked_label) {
                        await apiService.post(`/slot/locked-slots/${matchingNewSlot.id}`, {
                            lockedLabel: lock.locked_label,
                        })
                    }
                }

                // Final refresh to sync lock state
                await fetchSlotStructure()
            }
        } catch (err: any) {
            error.value =
                err.response?.data?.message || 'Terjadi konflik jadwal. Gagal menyimpan.'
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
        activeSemesterId,
        activeGrade,
        availableGrades,
        // Getters
        currentSchedule,
        masterGridData,
        // API Actions
        fetchAcademicYears,
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
