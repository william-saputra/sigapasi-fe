import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ScheduleDraft,
  ScheduleEntry,
  ClassSubjectTarget,
  Teacher,
  Subject,
  SchoolClass,
} from '@/interfaces/schedules/schedule.types'

// --- Dummy Data ---
const DUMMY_CLASSES: SchoolClass[] = [
  { id: 'cls-1', name: 'X-IPA-1' },
  { id: 'cls-2', name: 'X-IPA-2' },
]

const DUMMY_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Matematika', code: 'MTK' },
  { id: 'sub-2', name: 'Fisika', code: 'FIS' },
  { id: 'sub-3', name: 'Bahasa Indonesia', code: 'BIN' },
]

const DUMMY_TEACHERS: Teacher[] = [
  { id: 'tch-1', name: 'Pak Andi' },
  { id: 'tch-2', name: 'Bu Sari' },
  { id: 'tch-3', name: 'Pak Budi' },
  { id: 'tch-4', name: 'Bu Rina' },
]

// Maps subjects to teachers capable of teaching them
const TEACHER_SUBJECT_MAP: Record<string, string[]> = {
  'sub-1': ['tch-1', 'tch-3'],
  'sub-2': ['tch-2', 'tch-4'],
  'sub-3': ['tch-3', 'tch-4'],
}

const DUMMY_TARGETS: ClassSubjectTarget[] = [
  { id: 'tgt-1', class_id: 'cls-1', subject_id: 'sub-1', target_hours: 4 },
  { id: 'tgt-2', class_id: 'cls-1', subject_id: 'sub-2', target_hours: 3 },
  { id: 'tgt-3', class_id: 'cls-1', subject_id: 'sub-3', target_hours: 3 },
  { id: 'tgt-4', class_id: 'cls-2', subject_id: 'sub-1', target_hours: 4 },
  { id: 'tgt-5', class_id: 'cls-2', subject_id: 'sub-2', target_hours: 3 },
  { id: 'tgt-6', class_id: 'cls-2', subject_id: 'sub-3', target_hours: 3 },
]

const DUMMY_DRAFTS: ScheduleDraft[] = [
  {
    id: 'draft-1',
    semester_id: 'sem-1',
    name: 'Jadwal Ganjil 2025/2026 v1',
    status: 'DRAFT',
    updatedAt: '2025-08-15',
  },
]

// --- Store ---
export const useScheduleStore = defineStore('schedule', () => {
  // --- State ---
  const drafts = ref<ScheduleDraft[]>([...DUMMY_DRAFTS])
  const currentDraft = ref<ScheduleDraft | null>(null)
  const activeClassId = ref<string | null>(null)
  const entries = ref<ScheduleEntry[]>([])
  const targets = ref<ClassSubjectTarget[]>([...DUMMY_TARGETS])

  // Reference data exposures
  const teachers = ref<Teacher[]>([...DUMMY_TEACHERS])
  const subjects = ref<Subject[]>([...DUMMY_SUBJECTS])
  const classes = ref<SchoolClass[]>([...DUMMY_CLASSES])
  const teacherSubjectMap = ref<Record<string, string[]>>({ ...TEACHER_SUBJECT_MAP })

  // --- Computed & Getters ---
  const activeClassName = computed(() => {
    const cls = classes.value.find((c) => c.id === activeClassId.value)
    return cls?.name ?? null
  })

  /** Calculates total assigned hours for a specific class and subject */
  function getAssignedHours(classId: string, subjectId: string): number {
    return entries.value.filter((e) => e.class_id === classId && e.subject_id === subjectId).length
  }

  /** Retrieves target hours requirement for a specific class and subject */
  function getTargetHours(classId: string, subjectId: string): number {
    const target = targets.value.find((t) => t.class_id === classId && t.subject_id === subjectId)
    return target?.target_hours ?? 0
  }

  /** Finds the schedule entry occupying a specific time slot for a given class */
  function getEntryForCell(timeSlotId: string, classId: string): ScheduleEntry | undefined {
    return entries.value.find((e) => e.time_slot_id === timeSlotId && e.class_id === classId)
  }

  // --- Actions ---
  /** Generates a new schedule draft wrapper entity */
  function createDraft(name: string): ScheduleDraft {
    const newDraft: ScheduleDraft = {
      id: crypto.randomUUID(),
      semester_id: 'sem-1',
      name,
      status: 'DRAFT',
      updatedAt: new Date().toISOString().split('T')[0] ?? '',
    }
    drafts.value.push(newDraft)
    return newDraft
  }

  /** Sets the specified draft id as the active workspace draft */
  function openDraft(id: string): void {
    const draft = drafts.value.find((d) => d.id === id)
    currentDraft.value = draft ?? null
    activeClassId.value = null
  }

  /** Closes active workspace draft gracefully */
  function closeDraft(): void {
    currentDraft.value = null
    activeClassId.value = null
  }

  /** Updates the currently active class focus */
  function setActiveClass(classId: string | null): void {
    activeClassId.value = classId
  }

  /** Validates if a teacher is already booked in another class at precisely the same slot */
  function checkConflict(teacherId: string, timeSlotId: string): string | null {
    const conflicting = entries.value.find(
      (e) =>
        e.teacher_id === teacherId &&
        e.time_slot_id === timeSlotId &&
        e.class_id !== activeClassId.value,
    )
    if (conflicting) {
      const cls = classes.value.find((c) => c.id === conflicting.class_id)
      return cls?.name ?? 'Kelas lain'
    }
    return null
  }

  /**
   * Adds an entry safely by checking teacher conflicts first.
   * Replaces the currently assigned entry in the same class and time slot if there is one.
   */
  async function addEntry(
    classId: string,
    timeSlotId: string,
    subjectId: string,
    teacherId: string,
    subjectName: string,
    teacherName: string,
  ): Promise<{ success: boolean; conflictClass?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const conflictClass = checkConflict(teacherId, timeSlotId)
    if (conflictClass) {
      return { success: false, conflictClass }
    }

    const existing = entries.value.find(
      (e) => e.time_slot_id === timeSlotId && e.class_id === classId,
    )
    if (existing) {
      existing.subject_id = subjectId
      existing.teacher_id = teacherId
      existing.subject_name = subjectName
      existing.teacher_name = teacherName
      return { success: true }
    }

    const entry: ScheduleEntry = {
      id: crypto.randomUUID(),
      schedule_id: currentDraft.value?.id ?? '',
      class_id: classId,
      time_slot_id: timeSlotId,
      subject_id: subjectId,
      teacher_id: teacherId,
      subject_name: subjectName,
      teacher_name: teacherName,
    }
    entries.value.push(entry)
    return { success: true }
  }

  /** Deletes a scheduled entry linked strictly to a given class and slot ID */
  function removeEntry(timeSlotId: string, classId: string): void {
    const idx = entries.value.findIndex(
      (e) => e.time_slot_id === timeSlotId && e.class_id === classId,
    )
    if (idx >= 0) {
      entries.value.splice(idx, 1)
    }
  }

  return {
    // State
    drafts,
    currentDraft,
    activeClassId,
    entries,
    targets,
    teachers,
    subjects,
    classes,
    teacherSubjectMap,

    // Computed and Getters
    activeClassName,
    getAssignedHours,
    getTargetHours,
    getEntryForCell,

    // Actions
    createDraft,
    openDraft,
    closeDraft,
    setActiveClass,
    checkConflict,
    addEntry,
    removeEntry,
  }
})
