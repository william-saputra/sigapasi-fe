import apiService from '@/services/api.service'
import type {
<<<<<<< HEAD
    SchoolLevelResponseDTO,
    SubjectResponseDTO,
    ClassRequestDTO,
    ClassResponseDTO,
    ClassSubjectTargetRequestDTO,
    ClassSubjectTargetResponseDTO,
    BulkClassSubjectTargetRequestDTO,
    ClassTargetSummaryDTO
} from '@/interfaces/schedules/classManagement.types'

export const classManagementService = {
    // ─── School Levels ────────────────────────────────────────────────────────
    async getSchoolLevels(): Promise<SchoolLevelResponseDTO[]> {
        return apiService.get<SchoolLevelResponseDTO[]>('/school-levels')
    },

    // ─── Classes ──────────────────────────────────────────────────────────────
    async getAllClasses(): Promise<ClassResponseDTO[]> {
        const rawData = await apiService.get<any[]>('/classes')
        return rawData.map(mapClassResponseToDTO)
    },

    async getClassById(id: string): Promise<ClassResponseDTO> {
        const rawData = await apiService.get<any>(`/classes/${id}`)
        return mapClassResponseToDTO(rawData)
    },

    async createClass(payload: ClassRequestDTO): Promise<ClassResponseDTO> {
        const rawData = await apiService.post<any>('/classes', payload)
        return mapClassResponseToDTO(rawData)
    },

    async updateClass(id: string, payload: ClassRequestDTO): Promise<ClassResponseDTO> {
        const rawData = await apiService.put<any>(`/classes/${id}`, payload)
        return mapClassResponseToDTO(rawData)
    },

    async deleteClass(id: string): Promise<void> {
        return apiService.delete<void>(`/classes/${id}`)
    },

    // ─── Subjects ─────────────────────────────────────────────────────────────
    async getAllSubjects(schoolLevelId?: string): Promise<SubjectResponseDTO[]> {
        const query = schoolLevelId ? `?schoolLevelId=${schoolLevelId}` : ''
        return apiService.get<SubjectResponseDTO[]>(`/subjects${query}`)
    },

    async getUnassignedSubjects(classId: string): Promise<SubjectResponseDTO[]> {
        return apiService.get<SubjectResponseDTO[]>(`/subjects/unassigned?classId=${classId}`)
    },

    // ─── Class Subject Targets ────────────────────────────────────────────────
    async getTargetsByClass(classId: string): Promise<ClassSubjectTargetResponseDTO[]> {
        return apiService.get<ClassSubjectTargetResponseDTO[]>(`/classes/${classId}/targets`)
    },

    async getTargetSummary(classId: string): Promise<ClassTargetSummaryDTO> {
        return apiService.get<ClassTargetSummaryDTO>(`/classes/${classId}/target-summary`)
    },

    async addTarget(classId: string, payload: ClassSubjectTargetRequestDTO): Promise<ClassSubjectTargetResponseDTO> {
        return apiService.post<ClassSubjectTargetResponseDTO>(`/classes/${classId}/targets`, payload)
    },

    async updateTarget(targetId: string, payload: ClassSubjectTargetRequestDTO): Promise<ClassSubjectTargetResponseDTO> {
        return apiService.put<ClassSubjectTargetResponseDTO>(`/targets/${targetId}`, payload)
    },

    async deleteTarget(targetId: string): Promise<void> {
        return apiService.delete<void>(`/targets/${targetId}`)
    },

    async bulkAssignTargets(classId: string, payload: BulkClassSubjectTargetRequestDTO): Promise<ClassSubjectTargetResponseDTO[]> {
        return apiService.post<ClassSubjectTargetResponseDTO[]>(`/classes/${classId}/targets/bulk`, payload)
    }
=======
  SchoolLevelResponseDTO,
  SubjectResponseDTO,
  ClassRequestDTO,
  ClassResponseDTO,
  ClassSubjectTargetRequestDTO,
  ClassSubjectTargetResponseDTO,
  BulkClassSubjectTargetRequestDTO,
  ClassTargetSummaryDTO,
} from '@/interfaces/schedules/classManagement.types'

export const classManagementService = {
  // ─── School Levels ────────────────────────────────────────────────────────
  async getSchoolLevels(): Promise<SchoolLevelResponseDTO[]> {
    return apiService.get<SchoolLevelResponseDTO[]>('/school-levels')
  },

  // ─── Classes ──────────────────────────────────────────────────────────────
  async getAllClasses(): Promise<ClassResponseDTO[]> {
    const rawData = await apiService.get<any[]>('/classes')
    return rawData.map(mapClassResponseToDTO)
  },

  async getClassById(id: string): Promise<ClassResponseDTO> {
    const rawData = await apiService.get<any>(`/classes/${id}`)
    return mapClassResponseToDTO(rawData)
  },

  async createClass(payload: ClassRequestDTO): Promise<ClassResponseDTO> {
    const rawData = await apiService.post<any>('/classes', payload)
    return mapClassResponseToDTO(rawData)
  },

  async updateClass(id: string, payload: ClassRequestDTO): Promise<ClassResponseDTO> {
    const rawData = await apiService.put<any>(`/classes/${id}`, payload)
    return mapClassResponseToDTO(rawData)
  },

  async deleteClass(id: string): Promise<void> {
    return apiService.delete<void>(`/classes/${id}`)
  },

  // ─── Subjects ─────────────────────────────────────────────────────────────
  async getAllSubjects(schoolLevelId?: string): Promise<SubjectResponseDTO[]> {
    const query = schoolLevelId ? `?schoolLevelId=${schoolLevelId}` : ''
    return apiService.get<SubjectResponseDTO[]>(`/subjects${query}`)
  },

  async getUnassignedSubjects(classId: string): Promise<SubjectResponseDTO[]> {
    return apiService.get<SubjectResponseDTO[]>(`/subjects/unassigned?classId=${classId}`)
  },

  // ─── Class Subject Targets ────────────────────────────────────────────────
  async getTargetsByClass(classId: string): Promise<ClassSubjectTargetResponseDTO[]> {
    return apiService.get<ClassSubjectTargetResponseDTO[]>(`/classes/${classId}/targets`)
  },

  async getTargetSummary(classId: string): Promise<ClassTargetSummaryDTO> {
    return apiService.get<ClassTargetSummaryDTO>(`/classes/${classId}/target-summary`)
  },

  async addTarget(
    classId: string,
    payload: ClassSubjectTargetRequestDTO,
  ): Promise<ClassSubjectTargetResponseDTO> {
    return apiService.post<ClassSubjectTargetResponseDTO>(`/classes/${classId}/targets`, payload)
  },

  async updateTarget(
    targetId: string,
    payload: ClassSubjectTargetRequestDTO,
  ): Promise<ClassSubjectTargetResponseDTO> {
    return apiService.put<ClassSubjectTargetResponseDTO>(`/targets/${targetId}`, payload)
  },

  async deleteTarget(targetId: string): Promise<void> {
    return apiService.delete<void>(`/targets/${targetId}`)
  },

  async bulkAssignTargets(
    classId: string,
    payload: BulkClassSubjectTargetRequestDTO,
  ): Promise<ClassSubjectTargetResponseDTO[]> {
    return apiService.post<ClassSubjectTargetResponseDTO[]>(
      `/classes/${classId}/targets/bulk`,
      payload,
    )
  },
>>>>>>> origin/staging
}

// ─── Transformer Functions ────────────────────────────────────────────────
function mapClassResponseToDTO(raw: any): ClassResponseDTO {
<<<<<<< HEAD
    return {
        id: raw.id,
        name: raw.name,
        gradeLevel: raw.gradeLevel,
        schoolLevelId: raw.schoolLevel?.id,
        schoolLevelName: raw.schoolLevel?.name
    }
=======
  return {
    id: raw.id,
    name: raw.name,
    gradeLevel: raw.gradeLevel,
    schoolLevelId: raw.schoolLevel?.id,
    schoolLevelName: raw.schoolLevel?.name,
  }
>>>>>>> origin/staging
}
