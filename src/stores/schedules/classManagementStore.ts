import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { classManagementService } from '@/services/schedule/classManagement.service'
import type {
  SchoolLevelResponseDTO,
  SubjectResponseDTO,
  ClassResponseDTO,
  ClassRequestDTO,
  ClassSubjectTargetResponseDTO,
  ClassSubjectTargetRequestDTO,
  ClassTargetSummaryDTO,
} from '@/interfaces/schedules/classManagement.types'

export const useClassManagementStore = defineStore('classManagement', () => {
  const toast = useToast()

  // --- State ---
  const loading = ref(false)
  const error = ref<string | null>(null)

  const classes = ref<ClassResponseDTO[]>([])
  const schoolLevels = ref<SchoolLevelResponseDTO[]>([])
  const allSubjectsByLevel = ref<SubjectResponseDTO[]>([])

  // Active View State
  const selectedClass = ref<ClassResponseDTO | null>(null)
  const activeTargets = ref<ClassSubjectTargetResponseDTO[]>([])
  const unassignedSubjects = ref<SubjectResponseDTO[]>([])
  const activeTargetSummary = ref<ClassTargetSummaryDTO | null>(null)

  // --- Computed ---
  const isEditingExistingClass = computed(() => !!selectedClass.value?.id)

  // --- Actions ---

  // Generic clear error
  function clearError() {
    error.value = null
  }

  // 1. School Levels & Global Data
  async function fetchSchoolLevels() {
    try {
      loading.value = true
      clearError()
      const levels = await classManagementService.getSchoolLevels()
      schoolLevels.value = levels.sort((a, b) => {
        const order = ['SD', 'SMP', 'SMA']
        let indexA = order.indexOf(a.name)
        let indexB = order.indexOf(b.name)
        if (indexA === -1) indexA = 999
        if (indexB === -1) indexB = 999
        return indexA - indexB
      })
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal memuat jenjang sekolah.'
    } finally {
      loading.value = false
    }
  }

  async function fetchAllSubjectsByLevel(levelId: string) {
    try {
      allSubjectsByLevel.value = await classManagementService.getAllSubjects(levelId)
    } catch (err: any) {
      console.error('Failed to load subjects', err)
    }
  }

  // 2. Classes
  async function fetchClasses() {
    try {
      loading.value = true
      clearError()
      classes.value = await classManagementService.getAllClasses()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Gagal memuat daftar kelas.'
    } finally {
      loading.value = false
    }
  }

  async function selectClass(cls: ClassResponseDTO) {
    selectedClass.value = { ...cls }
    clearError()
    await fetchTargetsForSelectedClass()
  }

  function initNewClass() {
    selectedClass.value = {
      id: '',
      name: '',
      gradeLevel: 1,
      schoolLevelId: schoolLevels.value[0]?.id || '',
    }
    activeTargets.value = []
    unassignedSubjects.value = []
    activeTargetSummary.value = null
    clearError()
  }

  async function saveClassInfo(): Promise<boolean> {
    if (!selectedClass.value) return false

    try {
      loading.value = true
      clearError()

      const payload: ClassRequestDTO = {
        name: selectedClass.value.name,
        gradeLevel: selectedClass.value.gradeLevel,
        schoolLevelId: selectedClass.value.schoolLevelId,
      }

      if (isEditingExistingClass.value && selectedClass.value.id) {
        const updated = await classManagementService.updateClass(selectedClass.value.id, payload)
        const index = classes.value.findIndex((c) => c.id === updated.id)
        if (index !== -1) classes.value[index] = updated
        selectedClass.value = updated
      } else {
        const created = await classManagementService.createClass(payload)
        classes.value.push(created)
        selectedClass.value = created
      }
      return true
    } catch (err: any) {
      const errorMsg = (err.response?.data?.message || 'Gagal menyimpan detail kelas.').replace(/\bJP\b/g, 'Jam Pelajaran')
      if (toast) toast.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteSelectedClass(): Promise<boolean> {
    if (!selectedClass.value?.id) return false

    try {
      loading.value = true
      await classManagementService.deleteClass(selectedClass.value.id)
      classes.value = classes.value.filter((c) => c.id !== selectedClass.value!.id)
      selectedClass.value = null
      activeTargets.value = []
      return true
    } catch (err: any) {
      const errorMsg = (err.response?.data?.message || 'Gagal menghapus kelas.').replace(/\bJP\b/g, 'Jam Pelajaran')
      if (toast) toast.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  // 3. Targets
  async function fetchTargetsForSelectedClass() {
    if (!selectedClass.value?.id) return

    try {
      loading.value = true
      const classId = selectedClass.value.id
      activeTargets.value = await classManagementService.getTargetsByClass(classId)
      activeTargetSummary.value = await classManagementService.getTargetSummary(classId)
      unassignedSubjects.value = await classManagementService.getUnassignedSubjects(classId)

      // Populate subject pool for the class's level if not available
      if (
        allSubjectsByLevel.value.length === 0 ||
        allSubjectsByLevel.value[0]?.schoolLevelId !== selectedClass.value.schoolLevelId
      ) {
        await fetchAllSubjectsByLevel(selectedClass.value.schoolLevelId)
      }
    } catch (err: any) {
      console.error('Failed to load targets', err)
    } finally {
      loading.value = false
    }
  }

  async function bulkSaveTargets(targetPayloads: ClassSubjectTargetRequestDTO[]): Promise<boolean> {
    if (!selectedClass.value?.id) return false

    try {
      loading.value = true
      clearError()
      const result = await classManagementService.bulkAssignTargets(selectedClass.value.id, {
        targets: targetPayloads,
      })
      // Refresh target data
      await fetchTargetsForSelectedClass()
      return true
    } catch (err: any) {
      const errorMsg = (err.response?.data?.message || 'Gagal menyimpan target mapel.').replace(/\bJP\b/g, 'Jam Pelajaran')
      if (toast) toast.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  async function saveAllConfig(
    editedTargets: { id?: string; subjectId: string; targetHours: number }[],
  ): Promise<boolean> {
    // Step 1: Save class info
    const isClassSaved = await saveClassInfo()
    if (!isClassSaved || !selectedClass.value?.id) {
      return false
    }

    try {
      loading.value = true
      clearError()

      const newTargets: ClassSubjectTargetRequestDTO[] = []

      for (const target of editedTargets) {
        if (target.id && target.id !== '') {
          // Update existing target via PUT
          await classManagementService.updateTarget(target.id, {
            subjectId: target.subjectId,
            targetHours: target.targetHours,
          })
        } else {
          // Accumulate new targets
          newTargets.push({
            subjectId: target.subjectId,
            targetHours: target.targetHours,
          })
        }
      }

      // Bulk save accumulated new targets
      if (newTargets.length > 0) {
        await classManagementService.bulkAssignTargets(selectedClass.value.id, {
          targets: newTargets,
        })
      }

      // Refresh targets from server to ensure sync
      await fetchTargetsForSelectedClass()
      return true
    } catch (err: any) {
      const errorMsg = (err.response?.data?.message || 'Gagal menyimpan target mapel.').replace(/\bJP\b/g, 'Jam Pelajaran')
      if (toast) toast.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteTargetForSelectedClass(targetId: string): Promise<boolean> {
    try {
      loading.value = true
      clearError()
      await classManagementService.deleteTarget(targetId)
      await fetchTargetsForSelectedClass()
      return true
    } catch (err: any) {
      const errorMsg = (err.response?.data?.message || 'Gagal menghapus target mata pelajaran.').replace(/\bJP\b/g, 'Jam Pelajaran')
      if (toast) toast.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading,
    error,
    classes,
    schoolLevels,
    allSubjectsByLevel,
    selectedClass,
    activeTargets,
    unassignedSubjects,
    activeTargetSummary,

    // Computed
    isEditingExistingClass,

    // Actions
    clearError,
    fetchSchoolLevels,
    fetchAllSubjectsByLevel,
    fetchClasses,
    selectClass,
    initNewClass,
    saveClassInfo,
    deleteSelectedClass,
    fetchTargetsForSelectedClass,
    bulkSaveTargets,
    saveAllConfig,
    deleteTargetForSelectedClass,
  }
})
