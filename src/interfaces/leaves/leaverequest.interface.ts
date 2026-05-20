export interface CreateLeaveRequestDTO {
  type: string
  category: string
  startDate: string
  endDate: string
  startTime?: string | null
  endTime?: string | null
  reason: string
  attachment?: File | null
}

export interface LeaveRequestResponseDTO {
  id: string
  teacherId: string
  teacherName: string
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  status: string
  approvedBy: string | null
  rejectionReason: string | null
  category: string
  type: string
  reason: string
  attachmentUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface LeaveRequestDetailAdminDTO {
  id: string
  teacherId: string
  teacherName: string
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  status: string
  approvedBy: string | null
  rejectionReason: string | null
  category: string
  type: string
  reason: string
  attachmentUrl: string | null
  createdAt: string
  updatedAt: string
  remainingQuota: number
}

export interface LeaveRequestDetailAdminDTO {
  id: string;
  teacherId: string;
  teacherName: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  approvedBy: string | null;
  rejectionReason: string | null;
  category: string;
  type: string;
  reason: string;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
  remainingQuota: number;
}

export interface LeaveRequestDetailAdminDTO {
  id: string;
  teacherId: string;
  teacherName: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  approvedBy: string | null;
  rejectionReason: string | null;
  category: string;
  type: string;
  reason: string;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
  remainingQuota: number;
}

export interface BaseResponseDTO<T> {
  data: T
  message: string
  status: number
}
