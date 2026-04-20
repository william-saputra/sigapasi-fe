<script setup lang="ts">
import { computed, ref } from 'vue'
import { useScheduleWorkspaceStore } from '@/stores/schedules/scheduleWorkspaceStore'

const store = useScheduleWorkspaceStore()

// Accordion open state per subject
const openSubjects = ref<Record<string, boolean>>({})

function toggleSubject(subjectId: string) {
  openSubjects.value[subjectId] = !openSubjects.value[subjectId]
}

// ─── Drag handler ────────────────────────────────────────────────────────────
function onDragStart(
  event: DragEvent,
  item: {
    teacherId: string
    teacherName: string
    subjectId: string
    subjectName: string
    subjectKode: string
  },
) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        teacherId: item.teacherId,
        teacherName: item.teacherName,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        subjectKode: item.subjectKode,
      }),
    )
  }
}

function onDragEnd() {
  window.dispatchEvent(new CustomEvent('drag-session-end'))
}

// ─── Progress indicator ──────────────────────────────────────────────────────
function indicatorClass(currentHours: number, targetHours: number): string {
  if (targetHours === 0) return 'bg-gray-100 text-gray-500'
  if (currentHours >= targetHours) return 'bg-green-100 text-green-700'
  if (currentHours > 0) return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-500'
}

/** Total filled hours per subject group (sum across all teachers in that group) */
function groupCurrentHours(subjectId: string): number {
  return store.sidebarItems
    .filter((s) => s.subjectId === subjectId)
    .reduce((sum, s) => sum + s.currentHours, 0)
}

function groupTargetHours(subjectId: string): number {
  // target hours sama untuk semua teacher dalam satu subject group
  return store.sidebarItems.find((s) => s.subjectId === subjectId)?.targetHours ?? 0
}

const activeClassId = computed(() => store.activeClassId)
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h3 class="mb-1 font-bold text-emerald-800">Sumber Daya Guru</h3>
    <p class="mb-4 text-xs text-gray-400">Drag kartu guru ke sel kalender untuk assign jadwal.</p>

    <!-- Pilih kelas terlebih dahulu -->
    <div v-if="!activeClassId" class="py-6 text-center text-sm text-gray-400">
      Pilih kelas untuk melihat daftar mapel &amp; guru.
    </div>

    <!-- Loading skeleton -->
    <div v-else-if="store.isLoadingSidebar" class="flex flex-col gap-2">
      <div v-for="i in 4" :key="i" class="h-12 animate-pulse rounded-lg bg-gray-100" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="store.sidebarBySubject.length === 0"
      class="py-6 text-center text-sm text-gray-400"
    >
      Tidak ada target beban mengajar untuk kelas ini.
    </div>

    <!-- Accordion daftar mapel -->
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="group in store.sidebarBySubject"
        :key="group.subjectId"
        class="overflow-hidden rounded-lg border border-gray-200"
      >
        <!-- Subject header -->
        <button
          class="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
          @click="toggleSubject(group.subjectId)"
        >
          <div class="flex items-center gap-2">
            <span
              class="text-xs transition-transform"
              :class="openSubjects[group.subjectId] ? 'rotate-90' : ''"
              >▶</span
            >
            <span
              class="text-sm font-semibold uppercase text-gray-800"
              :title="group.subjectName"
              >{{ group.subjectKode }}</span
            >
          </div>
          <!-- JP Indicator -->
          <span
            :class="[
              'rounded-full px-2.5 py-0.5 text-xs font-bold',
              indicatorClass(groupCurrentHours(group.subjectId), groupTargetHours(group.subjectId)),
            ]"
          >
            {{ groupCurrentHours(group.subjectId) }} / {{ groupTargetHours(group.subjectId) }} JP
          </span>
        </button>

        <!-- Teacher list -->
        <div
          v-if="openSubjects[group.subjectId]"
          class="border-t border-gray-200 bg-white px-4 py-2"
        >
          <div
            v-for="teacher in group.teachers"
            :key="teacher.teacherId"
            class="mb-1 flex cursor-grab items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2 text-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 active:cursor-grabbing"
            draggable="true"
            @dragstart="
              onDragStart($event, {
                teacherId: teacher.teacherId,
                teacherName: teacher.teacherName,
                subjectId: teacher.subjectId,
                subjectName: teacher.subjectName,
                subjectKode: teacher.subjectKode,
              })
            "
            @dragend="onDragEnd"
          >
            <div class="flex items-center gap-2">
              <span class="text-base">👤</span>
              <span class="font-medium text-gray-700">{{ teacher.teacherName }}</span>
            </div>
            <!-- Jam jam mengajar guru ini -->
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                indicatorClass(teacher.currentHours, teacher.targetHours),
              ]"
            >
              {{ teacher.currentHours }}/{{ teacher.targetHours }} jam
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
