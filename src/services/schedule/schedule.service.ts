import apiService from '../api.service'
import type {
    ScheduleDraftDTO,
    CreateScheduleDraftRequestDTO,
    ClassSummaryDTO,
    SidebarItemDTO,
    ScheduleEntryDTO,
    BulkAssignRequestDTO,
    BulkAssignResultDTO,
    DeleteEntryResultDTO,
    ClassValidationResultDTO,
} from '@/interfaces/schedules/schedule.types'

const BASE = '/schedules'

export const scheduleService = {
    // ─── Grup A: Manajemen Draf ────────────────────────────────────────────
    getDrafts: (semesterId: string) =>
        apiService.get<ScheduleDraftDTO[]>(`${BASE}`, { params: { semesterId } }),

    createDraft: (payload: CreateScheduleDraftRequestDTO) =>
        apiService.post<ScheduleDraftDTO>(`${BASE}`, payload),

    publishDraft: (scheduleId: string) =>
        apiService.put<ScheduleDraftDTO>(`${BASE}/${scheduleId}/publish`, {}),

    // ─── Grup B: Persiapan UI ─────────────────────────────────────────────
    getClassesSummary: (scheduleId: string) =>
        apiService.get<ClassSummaryDTO[]>(`${BASE}/${scheduleId}/classes-summary`),

    getSidebar: (scheduleId: string, classId: string) =>
        apiService.get<SidebarItemDTO[]>(`${BASE}/${scheduleId}/sidebar`, { params: { classId } }),

    getEntries: (scheduleId: string, classId: string) =>
        apiService.get<ScheduleEntryDTO[]>(`${BASE}/${scheduleId}/entries`, { params: { classId } }),

    // ─── Grup C:
    bulkAssign: (scheduleId: string, payload: BulkAssignRequestDTO) => 
        apiService.post<BulkAssignResultDTO>(`${BASE}/${scheduleId}/bulk-assign`, payload),

    deleteEntry: (entryId: string) => 
        apiService.delete<DeleteEntryResultDTO>(`${BASE}/entries/${entryId}`),

    clearClass: (scheduleId: string, classId: string) => 
        apiService.delete<any>(`${BASE}/${scheduleId}/classes/${classId}/clear`),

    // ─── Grup D: Validasi ─────────────────────────────────────────────────
    validateClass: (scheduleId: string, classId: string) =>
        apiService.get<ClassValidationResultDTO>(
            `${BASE}/${scheduleId}/classes/${classId}/validate`,
        ),
}