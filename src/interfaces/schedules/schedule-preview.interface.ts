export type SchedulePreviewMode = 'CLASS' | 'TEACHER'

export interface SchedulePreviewCell {
  timeSlotId?: string | null

  empty: boolean
  locked: boolean
  breakTime: boolean

  label?: string | null

  entryId?: string | null

  subjectId?: string | null
  subjectName?: string | null

  classId?: string | null
  className?: string | null

  teacherId?: string | null
  teacherName?: string | null
}

export interface SchedulePreviewRow {
  sessionNumber: number
  startTime: string
  endTime: string
  timeLabel: string

  breakTime: boolean
  breakLabel?: string | null

  cells: Record<string, SchedulePreviewCell>
}

export interface SchedulePreviewResponse {
  scheduleId: string
  scheduleName: string

  academicYear?: string | null
  semesterName?: string | null

  mode: SchedulePreviewMode

  selectedClassId?: string | null
  selectedClassName?: string | null

  selectedTeacherId?: string | null
  selectedTeacherName?: string | null

  days: string[]
  rows: SchedulePreviewRow[]
}

export interface SchedulePreviewOption {
  id: string
  name: string
}

export interface SemesterOption {
  id: string
  display_name: string
  academic_year_id: string
}

export interface TeacherOption {
  id: string
  name: string
}