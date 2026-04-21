import { defineStore } from 'pinia'
import { ref } from 'vue'
import { academicSetupService } from '@/services/academicSetup.service'
import type { AcademicYear, Semester } from '@/interfaces/academic-setup.interface'

export const useAcademicSetupStore = defineStore('academicSetup', () => {
  const activeAcademicYear = ref<AcademicYear | null>(null)
  const activeSemester = ref<Semester | null>(null)
  const isLoaded = ref<boolean>(false)
  const isLoading = ref<boolean>(false)

  const fetchActiveSetup = async () => {
    isLoading.value = true
    try {
      const data = await academicSetupService.getActiveAcademicSetup()
      if (data) {
        activeAcademicYear.value = data.academicYear
        activeSemester.value = data.semester
      } else {
        activeAcademicYear.value = null
        activeSemester.value = null
      }
      isLoaded.value = true
    } catch (error) {
      console.error('Failed to parse active setup', error)
      activeAcademicYear.value = null
      activeSemester.value = null
      isLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  const resetState = () => {
    activeAcademicYear.value = null
    activeSemester.value = null
    isLoaded.value = false
  }

  return {
    activeAcademicYear,
    activeSemester,
    isLoaded,
    isLoading,
    fetchActiveSetup,
    resetState,
  }
})
