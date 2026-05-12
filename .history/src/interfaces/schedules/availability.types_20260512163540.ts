export interface AvailabilityDetailResponseDTO {
  id: string
  timeSlotId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface TeacherAvailabilityResponseDTO {
<<<<<<< HEAD
    schoolLevelId: any
    deadlineDate: string
    Editable: boolean
    schedules: AvailabilityDetailResponseDTO[]
=======
  schoolLevelId: any
  deadlineDate: string
  Editable: boolean
  schedules: AvailabilityDetailResponseDTO[]
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
}

export interface AvailabilityItemRequestDTO {
  timeSlotId: string
  isAvailable: boolean
}

export interface BulkAvailabilityRequestDTO {
  availabilities: AvailabilityItemRequestDTO[]
}
