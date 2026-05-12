<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { useScheduleWorkspaceStore } from '@/stores/schedules/scheduleWorkspaceStore'
import { ALL_DAYS, DAY_LABELS } from '@/interfaces/schedules/timeSlot.types'
import type { DayOfWeek } from '@/interfaces/schedules/timeSlot.types'
import type { DragPayload, ScheduleEntryDTO } from '@/interfaces/schedules/schedule.types'
import TimeSlotCell from './components/TimeSlotCell.vue'

const props = defineProps<{
  isGridReady?: boolean
}>()

const emit = defineEmits<{
  'show-toast': [message: string, type: 'success' | 'warning' | 'error']
}>()

const timeSlotStore = useTimeSlotStore()
const workspaceStore = useScheduleWorkspaceStore()

const dragOverCell = ref<string | null>(null)
const confirmDeleteEntryId = ref<string | null>(null)
const gridBodyRef = ref<HTMLElement | null>(null)

const maxSlotCount = computed(() => {
  let max = 0
  for (const day of ALL_DAYS) {
    const schedule = workspaceStore.filteredTimeSlots[day]
    if (schedule && schedule.length > max) max = schedule.length
  }
  return max
})

// Menghitung hari apa saja yang memiliki minimal 1 slot waktu
const activeDays = computed(() => {
  return ALL_DAYS.filter((day) => {
    const slots = workspaceStore.filteredTimeSlots[day]
    return slots && slots.length > 0
  })
})

function cellKey(slotId: string | undefined, day: DayOfWeek): string {
  return `${slotId ?? 'unknown'}-${day}`
}

function getSlotAt(day: DayOfWeek, rowIndex: number) {
  return workspaceStore.filteredTimeSlots[day]?.[rowIndex]
}

function getRowTimeLabel(rowIndex: number): string {
  for (const day of ALL_DAYS) {
    const slot = workspaceStore.filteredTimeSlots[day]?.[rowIndex]
    if (slot) return `${slot.start_time} – ${slot.end_time}`
  }
  return ''
}

function getRowLabel(rowIndex: number): string {
  for (const day of ALL_DAYS) {
    const slot = workspaceStore.filteredTimeSlots[day]?.[rowIndex]
    if (slot) {
      if (slot.slot_type === 'BREAK') return 'Istirahat'
      if (slot.is_locked && slot.locked_label) return slot.locked_label
      return `Sesi ${slot.session_number}`
    }
  }
  return ''
}

function getBlockPosition(day: DayOfWeek, rowIndex: number) {
  const slot = getSlotAt(day, rowIndex)
  if (!slot?.id) return 'single'
  return workspaceStore.getBlockPosition(slot.id, day)
}

function isDroppable(slot: ReturnType<typeof getSlotAt>): boolean {
  if (!slot) return false
  return slot.slot_type === 'LESSON' && !slot.is_locked
}

/** Secures execution drop events translating stringified payloads appending data securely without overlaps */
async function onDrop(event: DragEvent, slot: TimeSlot, _day: DayOfWeek) {
  const classId = scheduleStore.activeClassId
  if (!classId || !event.dataTransfer) return

  const raw = event.dataTransfer.getData('application/json')
  if (!raw) return

  let payload: { subjectId: string; teacherId: string; subjectName: string; teacherName: string }
  try {
    payload = JSON.parse(raw)
  } catch {
    return
  }

  const key = cellKey(slot.id, _day)

  delete alertCells.value[key]
  loadingCells.value[key] = true

  const result = await scheduleStore.addEntry(
    classId,
    slot.id!,
    payload.subjectId,
    payload.teacherId,
    payload.subjectName,
    payload.teacherName,
  )

  loadingCells.value[key] = false

  if (!result.success) {
    alertCells.value[key] =
      `Konflik! ${payload.teacherName} sudah mengajar di ${result.conflictClass ?? 'kelas lain'} pada jam ini.`

    setTimeout(() => {
      delete alertCells.value[key]
    }, 4000)
  }
}

/** Initiates unassign action detaching entries associated strongly to current grid perspective */
function onRemoveEntry(slotId: string, _day: DayOfWeek) {
  if (scheduleStore.activeClassId) {
    scheduleStore.removeEntry(slotId, scheduleStore.activeClassId)
  }
}

/** Exposes hovering target indication explicitly bounding focus element classes */
function onDragOver(key: string) {
  dragOverCell.value = key
}

/** Retracts target hovering indicator safely returning element styling baseline */
function onDragLeave() {
  dragOverCell.value = null
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="font-bold text-emerald-800">
        Grid Jadwal — {{ workspaceStore.activeClassName ?? '...' }}
      </h3>
      <span class="text-xs text-gray-400">Drop guru dari sidebar ke sel jadwal</span>
    </div>

    <!-- Empty Missing Requirements State -->
    <div
      v-if="maxSlotCount === 0"
      class="py-10 text-center text-gray-400"
    >
      <div class="mb-3 text-4xl">📅</div>
      <p>
        Belum ada slot waktu.<br />
        Silakan atur slot waktu di halaman
        <router-link to="/pengaturan-slot-waktu" class="font-semibold text-emerald-700 underline">
          Pengaturan Waktu
        </router-link>
        terlebih dahulu.
      </p>
    </div>

    <div v-else ref="gridBodyRef" class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th
              class="border border-gray-200 bg-emerald-800 px-3 py-2.5 text-left text-xs font-semibold text-white"
            >
              Waktu
            </th>
            <th
              v-for="day in activeDays"
              :key="day"
              class="border border-gray-200 bg-emerald-800 px-3 py-2.5 text-center text-xs font-semibold text-white"
            >
              {{ DAY_LABELS[day] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rowIndex in maxSlotCount" :key="rowIndex">
            <td
              class="whitespace-nowrap border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600"
            >
              <div>{{ getRowTimeLabel(rowIndex - 1) }}</div>
              <div class="text-[10px] font-normal text-gray-400">
                {{ getRowLabel(rowIndex - 1) }}
              </div>
            </td>

            <!-- Interactive Assignment Cells Map -->
            <td
              v-for="day in ALL_DAYS"
              :key="day"
              :class="[
                'border border-gray-200 px-2 py-2 text-center text-xs transition-colors',
                (() => {
                  const slot = getSlotAt(day, rowIndex - 1)
                  if (!slot) return 'bg-gray-100'
                  if (slot.slot_type === 'BREAK') return 'bg-amber-50 text-amber-600'
                  if (slot.is_locked) return 'bg-gray-100 text-gray-400'
                  if (dragOverCell === cellKey(slot.id, day)) return 'bg-emerald-50 ring-2 ring-inset ring-emerald-400'
                  return 'bg-white'
                })(),
              ]"
              @dragover.prevent="() => {
                const slot = getSlotAt(day, rowIndex - 1)
                if (slot && isDroppable(slot)) onDragOver(cellKey(slot.id, day))
              }"
              @dragleave="onDragLeave"
              @drop="(e: DragEvent) => {
                const slot = getSlotAt(day, rowIndex - 1)
                if (slot && isDroppable(slot)) {
                  dragOverCell = null
                  onDrop(e, slot, day)
                }
              }"
            >
              <!-- Unused Void Rendering -->
              <template v-if="!getSlotAt(day, rowIndex - 1)">
                <span class="text-gray-300">—</span>
              </template>

              <!-- Standard Break Constraint Rendering -->
              <template v-else-if="getSlotAt(day, rowIndex - 1)!.slot_type === 'BREAK'">
                <span class="text-xs font-semibold">Istirahat</span>
              </template>

              <!-- Fixed Configuration Lock Render -->
              <template v-else-if="getSlotAt(day, rowIndex - 1)!.is_locked">
                <span class="text-xs font-semibold">{{
                  getSlotAt(day, rowIndex - 1)!.locked_label ?? 'Locked'
                }}</span>
              </template>

              <!-- Process Interactive Lesson Block -->
              <template v-else>

                <!-- Background Action Spinner UI -->
                <div
                  v-if="loadingCells[cellKey(getSlotAt(day, rowIndex - 1)!.id, day)]"
                  class="flex items-center justify-center py-1"
                >
                  <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700"></span>
                </div>

                <!-- Ephemeral Error Indicator Graphic -->
                <div
                  v-else-if="alertCells[cellKey(getSlotAt(day, rowIndex - 1)!.id, day)]"
                  class="rounded bg-red-50 px-1 py-1 text-[10px] font-semibold text-red-600"
                >
                  {{ alertCells[cellKey(getSlotAt(day, rowIndex - 1)!.id, day)] }}
                </div>

                <!-- Standard Display State Success Content -->
                <div
                  v-else-if="
                    scheduleStore.activeClassId &&
                    scheduleStore.getEntryForCell(
                      getSlotAt(day, rowIndex - 1)!.id!,
                      scheduleStore.activeClassId,
                    )
                  "
                  class="group relative rounded bg-emerald-50 px-1.5 py-1"
                >
                  <div class="text-[11px] font-bold text-emerald-800">
                    {{
                      scheduleStore.getEntryForCell(
                        getSlotAt(day, rowIndex - 1)!.id!,
                        scheduleStore.activeClassId!,
                      )?.subject_name
                    }}
                  </div>
                  <div class="text-[10px] text-gray-500">
                    {{
                      scheduleStore.getEntryForCell(
                        getSlotAt(day, rowIndex - 1)!.id!,
                        scheduleStore.activeClassId!,
                      )?.teacher_name
                    }}
                  </div>

                  <!-- Removal Component Button Logic -->
                  <button
                    class="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white group-hover:flex"
                    @click="onRemoveEntry(getSlotAt(day, rowIndex - 1)!.id!, day)"
                  >
                    ✕
                  </button>
                </div>

                <!-- Empty Availability Default View -->
                <div v-else class="py-2 text-gray-300">
                  <span class="text-xs">Drop di sini</span>
                </div>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
