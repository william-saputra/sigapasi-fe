export interface SubstituteAssignmentsCardDTO {
  scheduleEntryId: string;
  leaveRequestId: string;
  assignmentId: string | null;
  timeSlotId: string;
  className: string;
  sessionNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  originalTeacherName: string;
  substituteTeacherId: string | null;
  substituteTeacherName: string | null;
  status: string; // 'NOT ASSIGNED' | 'ASSIGNED'
}

export interface SubstituteAssignmentsDashboardResponseDTO {
  totalGuruCuti: number;
  totalSesiKosong: number;
  emptyClasses: SubstituteAssignmentsCardDTO[];
}

export interface AvailableTeacherDTO {
  teacherId: string;
  namaGuru: string;
  deskripsiMapel: string;
}
