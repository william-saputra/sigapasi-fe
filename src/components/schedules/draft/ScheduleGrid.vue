<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { useScheduleWorkspaceStore } from '@/stores/schedules/scheduleWorkspaceStore'
import { ALL_DAYS, DAY_LABELS } from '@/interfaces/schedules/timeSlot.types'
import type { DayOfWeek } from '@/interfaces/schedules/timeSlot.types'
import type { DragPayload } from '@/interfaces/schedules/schedule.types'

// ─── Emits ───────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  'show-toast': [message: string, type: 'success' | 'warning' | 'error']
}>()

// ─── Stores ──────────────────────────────────────────────────────────────────
const timeSlotStore = useTimeSlotStore()
const workspaceStore = useScheduleWorkspaceStore()

// ─── Local State ─────────────────────────────────────────────────────────────
const dragOverCell = ref<string | null>(null)
const confirmDeleteEntryId = ref<string | null>(null)

// ─── Computed ─────────────────────────────────────────────────────────────────
const maxSlotCount = computed(() => {
  let max = 0
  for (const day of ALL_DAYS) {
    const schedule = workspaceStore.filteredTimeSlots[day]
    if (schedule && schedule.length > max) max = schedule.length
  }
  return max
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function isDroppable(slot: ReturnType<typeof getSlotAt>): boolean {
  if (!slot) return false
  return slot.slot_type === 'LESSON' && !slot.is_locked
}

// ─── DnD Event Handlers ───────────────────────────────────────────────────────
function onDragOver(event: DragEvent, key: string) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  dragOverCell.value = key
}

function onDragLeave() {
  dragOverCell.value = null
}

async function onDrop(event: DragEvent, slotId: string) {
  event.preventDefault()
  dragOverCell.value = null
  if (!workspaceStore.activeClassId || !event.dataTransfer) return

  const raw = event.dataTransfer.getData('application/json')
  if (!raw) return

  let payload: DragPayload
  try { payload = JSON.parse(raw) } catch { return }

  const result = await workspaceStore.assignEntry({
    classId: workspaceStore.activeClassId,
    timeSlotIds: [slotId],
    subjectId: payload.subjectId,
    teacherId: payload.teacherId,
  })

  if (result.error) {
    emit('show-toast', result.error, 'error')
  } else if (result.warning) {
    emit('show-toast', result.warning, 'warning')
  } else if (result.success) {
    emit('show-toast', result.success, 'success')
  }
}

// ─── Delete Entry ─────────────────────────────────────────────────────────────
async function onRemoveEntry(entryId: string) {
  const result = await workspaceStore.deleteEntry(entryId)
  if (result.error) {
    emit('show-toast', result.error, 'error')
  } else if (result.success) {
    emit('show-toast', result.success, 'success')
  }
  confirmDeleteEntryId.value = null
}

// ─── Cell styling ─────────────────────────────────────────────────────────────
function cellClass(day: DayOfWeek, rowIndex: number): string {
  const slot = getSlotAt(day, rowIndex)
  const key = slot ? cellKey(slot.id, day) : ''
  if (!slot) return 'bg-gray-100'
  if (slot.slot_type === 'BREAK') return 'bg-amber-50 text-amber-600'
  if (slot.is_locked) return 'bg-gray-100 text-gray-400'
  if (dragOverCell.value === key) return 'bg-emerald-50 ring-2 ring-inset ring-emerald-400'
  return 'bg-white'
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <!-- Grid Header -->
    <div class="mb-4 flex items-center justify-between">
      <h3 class="font-bold text-emerald-800">
        Grid Jadwal — {{ workspaceStore.activeClassName ?? '...' }}
      </h3>
      <span class="text-xs text-gray-400">Drag guru dari sidebar ke sel jadwal</span>
    </div>

    <!-- Loading state for grid -->
    <div v-if="workspaceStore.isLoadingGrid" class="flex items-center justify-center py-16">
      <span class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-300 border-t-emerald-700"></span>
    </div>

    <!-- Empty: No time slots configured -->
    <div v-else-if="maxSlotCount === 0" class="py-10 text-center text-gray-400">
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

    <!-- Grid Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th class="border border-gray-200 bg-emerald-800 px-3 py-2.5 text-left text-xs font-semibold text-white">
              Waktu
            </th>
            <th
              v-for="day in ALL_DAYS"
              :key="day"
              class="border border-gray-200 bg-emerald-800 px-3 py-2.5 text-center text-xs font-semibold text-white"
            >
              {{ DAY_LABELS[day] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rowIndex in maxSlotCount" :key="rowIndex">
            <!-- Time label column -->
            <td class="whitespace-nowrap border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
              <div>{{ getRowTimeLabel(rowIndex - 1) }}</div>
              <div class="text-[10px] font-normal text-gray-400">{{ getRowLabel(rowIndex - 1) }}</div>
            </td>

            <!-- Cells -->
            <td
              v-for="day in ALL_DAYS"
              :key="day"
              :class="[
                'border border-gray-200 px-2 py-2 text-center text-xs transition-colors',
                cellClass(day, rowIndex - 1),
              ]"
              @dragover="(e) => {
                const slot = getSlotAt(day, rowIndex - 1)
                if (slot && isDroppable(slot)) onDragOver(e, cellKey(slot.id, day))
              }"
              @dragleave="onDragLeave"
              @drop="(e) => {
                const slot = getSlotAt(day, rowIndex - 1)
                if (slot && slot.id && isDroppable(slot)) onDrop(e, slot.id)
              }"
            >
              <!-- No slot exists -->
              <template v-if="!getSlotAt(day, rowIndex - 1)">
                <span class="text-gray-300">—</span>
              </template>

              <!-- Break slot -->
              <template v-else-if="getSlotAt(day, rowIndex - 1)!.slot_type === 'BREAK'">
                <span class="text-xs font-semibold">Istirahat</span>
              </template>

              <!-- Locked slot -->
              <template v-else-if="getSlotAt(day, rowIndex - 1)!.is_locked">
                <span class="text-xs font-semibold">
                  {{ getSlotAt(day, rowIndex - 1)!.locked_label ?? 'Terkunci' }}
                </span>
              </template>

              <!-- Lesson slot -->
              <template v-else>
                <!-- Pending spinner -->
                <div
                  v-if="getSlotAt(day, rowIndex - 1)?.id && workspaceStore.pendingCells.has(getSlotAt(day, rowIndex - 1)!.id!)"
                  class="flex items-center justify-center py-1"
                >
                  <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700"></span>
                </div>

                <!-- Entry card -->
                <div
                  v-else-if="workspaceStore.activeClassId && getSlotAt(day, rowIndex - 1)?.id && workspaceStore.entryBySlotId[getSlotAt(day, rowIndex - 1)!.id!]"
                  class="group relative rounded bg-emerald-50 px-1.5 py-1"
                >
                  <div class="text-[11px] font-bold text-emerald-800">
                    {{ workspaceStore.entryBySlotId[getSlotAt(day, rowIndex - 1)!.id!]?.subjectName }}
                  </div>
                  <div class="text-[10px] text-gray-500">
                    {{ workspaceStore.entryBySlotId[getSlotAt(day, rowIndex - 1)!.id!]?.teacherName }}
                  </div>
                  <!-- Delete button -->
                  <button
                    class="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white group-hover:flex"
                    @click.stop="onRemoveEntry(workspaceStore.entryBySlotId[getSlotAt(day, rowIndex - 1)!.id!]!.entryId)"
                  >
                    ✕
                  </button>
                </div>

                <!-- Empty droppable cell -->
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
