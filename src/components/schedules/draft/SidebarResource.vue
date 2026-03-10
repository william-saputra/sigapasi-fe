<script setup lang="ts">
import { computed, ref } from 'vue'
import { useScheduleStore } from '@/stores/schedules/scheduleStore'

const store = useScheduleStore()

// Accordion open state per subject
const openSubjects = ref<Record<string, boolean>>({})

function toggleSubject(subjectId: string) {
  openSubjects.value[subjectId] = !openSubjects.value[subjectId]
}

// Drag handler
function onDragStart(
  event: DragEvent,
  subjectId: string,
  teacherId: string,
  subjectName: string,
  teacherName: string,
) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({ subjectId, teacherId, subjectName, teacherName }),
    )
  }
}

// JP indicator for each subject
function getIndicatorClass(classId: string, subjectId: string): string {
  const assigned = store.getAssignedHours(classId, subjectId)
  const target = store.getTargetHours(classId, subjectId)
  if (target === 0) return 'bg-gray-100 text-gray-600'
  if (assigned === target) return 'bg-green-100 text-green-600'
  if (assigned > target) return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-600'
}

// Teachers available for a subject
function getTeachersForSubject(subjectId: string) {
  const teacherIds = store.teacherSubjectMap[subjectId] ?? []
  return store.teachers.filter((t) => teacherIds.includes(t.id))
}

const activeClassId = computed(() => store.activeClassId)
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h3 class="mb-4 font-bold text-emerald-800">Sumber Daya</h3>

    <div v-if="!activeClassId" class="py-6 text-center text-sm text-gray-400">
      Pilih kelas untuk melihat daftar mapel & guru.
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="subject in store.subjects"
        :key="subject.id"
        class="overflow-hidden rounded-lg border border-gray-200"
      >
        <!-- Subject header (accordion toggle) -->
        <button
          class="flex w-full cursor-pointer items-center justify-between bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100"
          @click="toggleSubject(subject.id)"
        >
          <div class="flex items-center gap-2">
            <span
              class="text-xs transition-transform"
              :class="openSubjects[subject.id] ? 'rotate-90' : ''"
              >▶</span
            >
            <span class="text-sm font-semibold text-gray-800">{{ subject.name }}</span>
          </div>
          
          <!-- JP Indicator -->
          <span
            :class="[
              'rounded-full px-2.5 py-0.5 text-xs font-bold',
              getIndicatorClass(activeClassId, subject.id),
            ]"
          >
            {{ store.getAssignedHours(activeClassId, subject.id) }}
            / {{ store.getTargetHours(activeClassId, subject.id) }} JP
          </span>
        </button>

        <!-- Teacher list (accordion content) -->
        <div v-if="openSubjects[subject.id]" class="border-t border-gray-200 bg-white px-4 py-2">
          <div
            v-for="teacher in getTeachersForSubject(subject.id)"
            :key="teacher.id"
            class="mb-1 flex cursor-grab items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm transition-all hover:border-emerald-300 hover:bg-emerald-50"
            draggable="true"
            @dragstart="onDragStart($event, subject.id, teacher.id, subject.name, teacher.name)"
          >
            <span class="text-base">👤</span>
            <span class="font-medium text-gray-700">{{ teacher.name }}</span>
          </div>
          <div
            v-if="getTeachersForSubject(subject.id).length === 0"
            class="py-2 text-xs text-gray-400"
          >
            Tidak ada guru tersedia.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
