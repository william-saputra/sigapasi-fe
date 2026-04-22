import apiService from './api.service'
import type { ActiveAcademicCalendar } from '@/interfaces/academic-setup.interface'

export const academicSetupService = {
  /**
   * Retrieves the currently active academic calendar (both year and semester).
   * Returns null if no active calendar exists.
   */
  async getActiveAcademicSetup(): Promise<ActiveAcademicCalendar | null> {
    try {
      return await apiService.get<ActiveAcademicCalendar>('/academic-setup/active')
    } catch (error) {
      console.error('Failed to get active academic setup', error)
      return null
    }
  },
}
