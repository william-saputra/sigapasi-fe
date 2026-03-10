// --- Enum Types ---
export type DayOfWeekEnum = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
export type SlotTypeEnum = 'LESSON' | 'BREAK'
export interface SchoolLevelResponseDTO {
    id: string
    name: string
}

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
    school_level_id: string
    school_level_name: string
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
    school_level_id: string
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
    school_level_id?: string
    school_level_name?: string
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

