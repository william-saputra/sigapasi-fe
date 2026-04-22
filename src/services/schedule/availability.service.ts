import apiService from '../api.service'
import type {
  TeacherAvailabilityResponseDTO,
  BulkAvailabilityRequestDTO,
} from '@/interfaces/schedules/availability.types'

export const availabilityService = {
  // Mengambil data ketersediaan guru yang sedang login
  getAvailability: () => apiService.get<TeacherAvailabilityResponseDTO>('/availability'),

  // Membuat data baru (jika belum pernah isi sama sekali)
  createAvailability: (data: BulkAvailabilityRequestDTO) =>
    apiService.post<any>('/availability', data),

  // Memperbarui data ketersediaan (jika sudah pernah isi)
  updateAvailability: (data: BulkAvailabilityRequestDTO) =>
    apiService.put<any>('/availability', data),
}
