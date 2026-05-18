<script setup lang="ts">
import { computed, ref } from 'vue'
import { useScheduleWorkspaceStore } from '@/stores/schedules/scheduleWorkspaceStore'
import { useJpBadge } from '@/composables/useJpBadge'
import { DAY_LABELS } from '@/interfaces/schedules/timeSlot.types'
import { ChevronRight, User, Mailbox } from 'lucide-vue-next'

const store = useScheduleWorkspaceStore()
const { getBadgeClass } = useJpBadge()

const openSubjects = ref<Record<string, boolean>>({})

function toggleSubject(subjectId: string) {
  openSubjects.value[subjectId] = !openSubjects.value[subjectId]
}

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
  const fullItem = store.filteredSidebarItems.find((s: { teacherId: string; subjectId: string }) => s.teacherId === item.teacherId && s.subjectId === item.subjectId)
  if (fullItem) {
    store.startDrag(fullItem)
  }
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
  store.endDrag()
}

function groupCurrentHours(subjectId: string): number {
  return store.gridEntries.filter((e: any) => e.subjectId === subjectId).length
}

function groupTargetHours(subjectId: string): number {
  const activeClass = store.classSummaries.find((c: any) => c.classId === store.activeClassId)
  const subjectCompletion = activeClass?.subjectCompletions?.find((s: any) => s.subjectId === subjectId)
  return subjectCompletion?.targetJp ?? 0
}

const activeClassId = computed(() => store.activeClassId)
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h3 class="mb-1 font-bold text-emerald-800">Sumber Daya Guru</h3>
    <p class="mb-4 text-xs text-gray-400">Drag kartu guru ke sel kalender untuk assign jadwal.</p>

    <div v-if="!activeClassId" class="py-6 text-center text-sm text-gray-400">
      Pilih kelas untuk melihat daftar mapel &amp; guru.
    </div>

    <div v-else-if="store.isLoadingSidebar" class="flex flex-col gap-2">
      <div v-for="i in 4" :key="i" class="h-12 animate-pulse rounded-lg bg-gray-100" />
    </div>

    <!-- Kondisi 1: Tidak ada beban mengajar sama sekali -->
    <div
      v-else-if="store.filteredSidebarItems.length === 0 && !store.activeDayFilter"
      class="py-6 text-center text-sm text-gray-400"
    >
      Tidak ada target beban mengajar untuk kelas ini.
    </div>

    <!-- Kondisi 2: Difilter per hari, tapi TIDAK ADA guru yang tersedia -->
    <div
      v-else-if="store.sidebarBySubject.length === 0 && store.activeDayFilter"
      class="py-10 text-center text-sm text-gray-500"
    >
      <div class="mb-4 flex justify-center text-gray-300">
        <Mailbox class="h-12 w-12 opacity-60" />
      </div>
      <p>
        Tidak ada guru yang tersedia untuk diisi pada hari 
        <strong class="text-emerald-700">{{ DAY_LABELS[store.activeDayFilter] }}</strong>.
      </p>
      <button
        @click="store.setDayFilter(null)"
        class="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
      >
        Tampilkan Semua Hari
      </button>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="group in store.sidebarBySubject"
        :key="group.subjectId"
        class="overflow-hidden rounded-lg border border-gray-200"
      >
        <button
          class="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
          @click="toggleSubject(group.subjectId)"
        >
          <div class="flex items-center gap-2">
            <ChevronRight
              class="h-4 w-4 transition-transform text-gray-400"
              :class="openSubjects[group.subjectId] ? 'rotate-90' : ''"
            />
            <span
              class="text-sm font-semibold uppercase text-gray-800"
              :title="group.subjectName"
              >{{ group.subjectKode }}</span
            >
          </div>
          <span
            :class="[
              'rounded-full px-2.5 py-0.5 text-xs font-bold',
              getBadgeClass(groupCurrentHours(group.subjectId), groupTargetHours(group.subjectId)),
            ]"
          >
            {{ groupCurrentHours(group.subjectId) }} / {{ groupTargetHours(group.subjectId) }} JP
          </span>
        </button>

        <div
          v-if="openSubjects[group.subjectId]"
          class="border-t border-gray-200 bg-white px-4 py-2"
        >
          <div
            v-for="teacher in group.teachers"
            :key="teacher.teacherId"
            :class="[
              'mb-1 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-all',
              teacher.isDimmed
                ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-40 grayscale'
                : 'cursor-grab border-transparent hover:border-emerald-300 hover:bg-emerald-50 active:cursor-grabbing',
            ]"
            :draggable="!teacher.isDimmed"
            @dragstart="
              !teacher.isDimmed &&
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
              <User class="h-4 w-4 text-gray-400" />
              <span :class="['font-medium', teacher.isDimmed ? 'text-gray-400' : 'text-gray-700']">
                {{ teacher.teacherName }}
              </span>
            </div>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                getBadgeClass(teacher.currentHours, teacher.targetHours),
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