export interface AvailabilityDetailResponseDTO {
    id: string
    timeSlotId: string
    dayOfWeek: string
    startTime: string
    endTime: string
    isAvailable: boolean
}

export interface TeacherAvailabilityResponseDTO {
    deadlineDate: string
    Editable: boolean
    schedules: AvailabilityDetailResponseDTO[]
}

export interface AvailabilityItemRequestDTO {
    timeSlotId: string
    isAvailable: boolean
}

export interface BulkAvailabilityRequestDTO {
    availabilities: AvailabilityItemRequestDTO[]
}