// Struktur umum respons dari backend
export interface BaseResponse<T> {
  data: T
  message: string
  status: number
  timestamp: Date
}
