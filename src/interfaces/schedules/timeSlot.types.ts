// --- Enum Types ---
export type DayOfWeekEnum = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
export type SlotTypeEnum = 'LESSON' | 'BREAK'
export type GradeLevelEnum = 'SD' | 'SMP' | 'SMA'

// Backward compatible aliases used by existing components
export type DayOfWeek = DayOfWeekEnum
export type SlotType = SlotTypeEnum

// --- Academic Year and Semester Interfaces ---
export interface SemesterResponseDTO {
    id: string
    name: string
    start_date: string
    end_date: string
    is_active: boolean
    isActive?: boolean // fallback
}

export interface AcademicYearSemesterResponseDTO {
    id: string
    year_start: string
    year_end: string
    is_active: boolean
    yearStart?: string // fallback
    yearEnd?: string   // fallback
    isActive?: boolean // fallback
    listSemesters: SemesterResponseDTO[]
}

export interface CreateAcademicYearRequestDTO {
    year_start: string
    year_end: string
}

export interface CreateSemesterRequestDTO {
    academic_year_id: string
    name: string
}

// --- Backend Response Interfaces ---
export interface TimeSlotResponseDTO {
    id: string
    semester_id: string
    day_of_week: DayOfWeekEnum
    session_number: number
    start_time: string // Formatted ISO local date time string
    end_time: string   // Formatted ISO local date time string
    is_locked: boolean
    locked_label: string | null
    slot_type: SlotTypeEnum
    grade_level: GradeLevelEnum // Changed to string enum
}

// --- Backend Request Interfaces ---
export interface SlotRequestDTO {
    session_number: number
    start_time: string // Formatted time string
    end_time: string   // Formatted time string
    slot_type: SlotTypeEnum
}

export interface SlotStructureRequestDTO {
    semester_id: string
    day_of_week: DayOfWeekEnum
    grade_level: GradeLevelEnum // Changed to string enum
    slots: SlotRequestDTO[]
}

export interface LockSlotRequestDTO {
    locked_label: string
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
    grade_level?: GradeLevelEnum // Changed to string enum or undefined
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

