import axios from 'axios'
import type { BaseResponse } from '@/interfaces/base-response.interface'

// Instance utama Axios untuk seluruh request API
const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Intercept setiap request: sisipkan JWT token dari localStorage jika tersedia
apiClient.interceptors.request.use((config: import('axios').InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Wrapper umum untuk semua request API
// Tujuannya agar response berbentuk BaseResponse<T> bisa langsung diambil nilai data-nya
const apiService = {
  // Request GET dengan dukungan konfigurasi tambahan (params, headers, dsb)
  async get<T>(resource: string, config?: object): Promise<T> {
    try {
      const response = await apiClient.get<BaseResponse<T>>(resource, config)
      return response.data.data
    } catch (error) {
      console.error('API GET Error', error)
      throw error
    }
  },

  // Request POST untuk membuat data baru
  async post<T>(resource: string, data: any, config?: object): Promise<T> {
    try {
      const response = await apiClient.post<BaseResponse<T>>(resource, data, config)
      return response.data.data
    } catch (error) {
      console.error('API POST Error', error)
      throw error
    }
  },

  // Request PUT untuk memperbarui data
  async put<T>(resource: string, data: any, config?: object): Promise<T> {
    try {
      const response = await apiClient.put<BaseResponse<T>>(resource, data, config)
      return response.data.data
    } catch (error) {
      console.error('API PUT Error', error)
      throw error
    }
  },

  // Request DELETE untuk menghapus data
  async delete<T>(resource: string, config?: object): Promise<T> {
    try {
      const response = await apiClient.delete<BaseResponse<T>>(resource, config)
      return response.data.data
    } catch (error) {
      console.error('API DELETE Error', error)
      throw error
    }
  },
}

export default apiService
