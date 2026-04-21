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
  ClassValidationSummaryDTO,
  ScheduleApprovalListDTO,
} from '@/interfaces/schedules/schedule.types'

const BASE = '/schedules'

export const scheduleService = {
  // ─── Grup A: Manajemen Draf ────────────────────────────────────────────
  getDrafts: (semesterId: string) =>
    apiService.get<ScheduleDraftDTO[]>(`${BASE}`, { params: { semesterId } }),

  createDraft: (payload: CreateScheduleDraftRequestDTO) =>
    apiService.post<ScheduleDraftDTO>(`${BASE}`, payload),

  updateScheduleStatus: (
    scheduleId: string,
    payload: { status: string; revisionNote?: string | null },
  ) => apiService.patch<ScheduleDraftDTO>(`${BASE}/${scheduleId}/status`, payload),

  publishDraft: (scheduleId: string) =>
    apiService.put<ScheduleDraftDTO>(`${BASE}/${scheduleId}/publish`, {}),

  // ─── Grup B: Persiapan UI ─────────────────────────────────────────────
  getClassesSummary: (scheduleId: string) =>
    apiService.get<ClassSummaryDTO[]>(`${BASE}/${scheduleId}/classes-summary`),

  getSidebar: (scheduleId: string, classId: string) =>
    apiService.get<SidebarItemDTO[]>(`${BASE}/${scheduleId}/sidebar`, { params: { classId } }),

  getEntries: (scheduleId: string, classId: string) =>
    apiService.get<ScheduleEntryDTO[]>(`${BASE}/${scheduleId}/entries`, { params: { classId } }),

  // ─── Grup C: Assignment
  bulkAssign: (scheduleId: string, payload: BulkAssignRequestDTO) =>
    apiService.post<BulkAssignResultDTO>(`${BASE}/${scheduleId}/bulk-assign`, payload),

  singleAssign: (
    scheduleId: string,
    slotId: string,
    payload: Omit<BulkAssignRequestDTO, 'timeSlotIds'>,
  ) =>
    apiService.post<BulkAssignResultDTO>(`${BASE}/${scheduleId}/bulk-assign`, {
      ...payload,
      timeSlotIds: [slotId],
    }),

  deleteEntry: (entryId: string) => {
    if (!entryId) {
      console.error('Gagal menghapus: entryId tidak valid atau kosong!')
      return Promise.reject(new Error('Silakan tunggu data tersinkronisasi'))
    }
    return apiService.delete<DeleteEntryResultDTO>(`${BASE}/entries/${entryId}`)
  },

  clearClass: (scheduleId: string, classId: string) =>
    apiService.delete<any>(`${BASE}/${scheduleId}/classes/${classId}/clear`),

  // ─── Grup D: Validasi ─────────────────────────────────────────────────
  validateClass: (scheduleId: string, classId: string) =>
    apiService.get<ClassValidationResultDTO>(`${BASE}/${scheduleId}/classes/${classId}/validate`),

  validateAllClasses: (scheduleId: string) =>
    apiService.get<ClassValidationSummaryDTO[]>(`${BASE}/${scheduleId}/validate-all`),

  getAllSchedules: () => apiService.get<ScheduleApprovalListDTO[]>(`${BASE}/approvals`),

  submitSchedule: (scheduleId: string) =>
    apiService.put<ScheduleDraftDTO>(`${BASE}/${scheduleId}/submit`, {}),
}
