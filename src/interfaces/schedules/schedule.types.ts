export interface ScheduleDraft {
    id: string
    semester_id: string
    name: string
    status: 'DRAFT' | 'WAITING_APPROVAL' | 'REVISION' | 'PUBLISHED'
    updatedAt: string
}

export interface ScheduleEntry {
    id: string
    schedule_id: string
    class_id: string
    time_slot_id: string
    subject_id: string
    teacher_id: string
    subject_name?: string
    teacher_name?: string
}

export interface ClassSubjectTarget {
    id: string
    class_id: string
    subject_id: string
    target_hours: number
}

export interface Teacher {
    id: string
    name: string
}

export interface Subject {
    id: string
    name: string
    code: string
}

export interface SchoolClass {
    id: string
    name: string
}
