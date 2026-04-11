// ─── Legacy types (used by scheduleStore.ts — do NOT remove) ────────────────
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

// ─── Grup A: Manajemen Draf ────────────────────────────────────────────────
export interface ScheduleDraftDTO {
    scheduleId: string
    name: string
    status: 'DRAFT' | 'PUBLISHED'
    createdAt: string
}

export interface CreateScheduleDraftRequestDTO {
    semesterId: string
    name: string
}

// ─── Grup B: Data Persiapan UI ─────────────────────────────────────────────
export interface ClassSummaryDTO {
    classId: string
    className: string
    schoolLevelId: string
    filledHours: number
    targetHours: number
}

export interface SidebarItemDTO {
    teacherId: string
    teacherName: string
    subjectId: string
    subjectName: string
    targetHours: number
    currentHours: number
}

export interface ScheduleEntryDTO {
    entryId: string
    timeSlotId: string
    dayOfWeek: string
    startTime: string
    endTime: string
    teacherId: string
    teacherName: string
    subjectId: string
    subjectName: string
}

// ─── Grup C: Aksi Drag & Drop ──────────────────────────────────────────────
export interface BulkAssignRequestDTO {
    classId: string
    timeSlotIds: string[]
    subjectId: string
    teacherId: string
}

export interface OverriddenEntry {
    oldTeacherId: string
    oldTeacherCurrentLoad: number
}

export interface BulkAssignResultDTO {
    status: 'SUCCESS' | 'WARNING'
    warningCode: string | null
    message: string | null
    newTeacherCurrentLoad: number
    overriddenEntries: OverriddenEntry[]
}

// ─── Grup C: Hapus Satu Entry ──────────────────────────────────────────────
export interface DeleteEntryResultDTO {
    entryId: string
    newCurrentLoad: number
}

// ─── Grup D: Validasi Akhir ────────────────────────────────────────────────
export interface UnfulfilledSubjectDTO {
    subjectName: string
    targetHours: number
    assignedHours: number
}

export interface ClassValidationResultDTO {
    status: 'OK' | 'WARNING'
    unfulfilledSubjects: UnfulfilledSubjectDTO[]
}

// ─── DnD Payload (dipakai di dataTransfer) ────────────────────────────────
export interface DragPayload {
    teacherId: string
    teacherName: string
    subjectId: string
    subjectName: string
}
