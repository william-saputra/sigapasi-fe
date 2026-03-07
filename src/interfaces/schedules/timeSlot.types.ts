// --- Enum Types ---
export type DayOfWeekEnum = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
export type SlotTypeEnum = 'LESSON' | 'BREAK'

// Backward compatible aliases used by existing components
export type DayOfWeek = DayOfWeekEnum
export type SlotType = SlotTypeEnum

// --- Academic Year and Semester Interfaces ---
export interface SemesterResponseDTO {
    id: string
    name: string
    startDate: string
    endDate: string
    isActive: boolean
}

export interface AcademicYearSemesterResponseDTO {
    id: string
    yearStart: string
    yearEnd: string
    isActive: boolean
    listSemesters: SemesterResponseDTO[]
}

// --- Backend Response Interfaces ---
export interface TimeSlotResponseDTO {
    id: string
    semesterId: string
    dayOfWeek: DayOfWeekEnum
    sessionNumber: number
    startTime: string // Formatted ISO local date time string
    endTime: string   // Formatted ISO local date time string
    isLocked: boolean
    lockedLabel: string | null
    slotType: SlotTypeEnum
    gradeLevel: number // Added for grade differentiation
}

// --- Backend Request Interfaces ---
export interface SlotRequestDTO {
    sessionNumber: number
    startTime: string // Formatted time string
    endTime: string   // Formatted time string
    slotType: SlotTypeEnum
}

export interface SlotStructureRequestDTO {
    semesterId: string
    dayOfWeek: DayOfWeekEnum
    gradeLevel: number // Added for grade differentiation
    slots: SlotRequestDTO[]
}

export interface LockSlotRequestDTO {
    lockedLabel: string
}

// --- Component User Interface Models ---
export interface UISlot {
    id?: string
    session_number: number
    start_time: string // Formatted time string
    end_time: string   // Formatted time string
    slot_type: SlotTypeEnum
    is_locked: boolean
    locked_label: string | null
    duration: number   // Computed elapsed minutes for rendering
    grade_level?: number // Added for grade differentiation
}

// --- Legacy Compatibility ---
export type TimeSlot = UISlot

// --- Constants ---
export const DAY_LABELS: Record<DayOfWeekEnum, string> = {
    MON: 'Senin',
    TUE: 'Selasa',
    WED: 'Rabu',
    THU: 'Kamis',
    FRI: 'Jumat',
    SAT: 'Sabtu',
    SUN: 'Minggu',
}

export const ALL_DAYS: DayOfWeekEnum[] = ['MON', 'TUE', 'WED', 'THU', 'FRI']

