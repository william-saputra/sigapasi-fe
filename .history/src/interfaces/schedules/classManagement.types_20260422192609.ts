export interface SchoolLevelResponseDTO {
  id: string // assumed UUID
  name: string // "SD", "SMP", "SMA"
  levelOrder?: number
}

export interface SubjectResponseDTO {
  id: string
  name: string
  code?: string
  schoolLevelId?: string
}

export interface ClassRequestDTO {
  name: string
  gradeLevel: number
  schoolLevelId: string
}

export interface ClassResponseDTO {
  id: string
  name: string
  gradeLevel: number
  schoolLevelId: string
  schoolLevelName?: string
}

export interface ClassSubjectTargetRequestDTO {
  subjectId: string
  targetHours: number
}

export interface ClassSubjectTargetResponseDTO {
  id: string
  classId: string
  subjectId: string
  subjectName?: string
  targetHours: number
}

export interface BulkClassSubjectTargetRequestDTO {
  targets: ClassSubjectTargetRequestDTO[]
}

export interface ClassTargetSummaryDTO {
  totalTargetHours: number
  totalSubjects: number
}
