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

function isEdgePullTarget(day: DayOfWeek, rowIndex: number): boolean {
  const slot = getSlotAt(day, rowIndex)
  if (!slot?.id) return false
  return workspaceStore.edgePull.previewSlotIds.has(slot.id)
}

async function onDrop(slotId: string, payload: DragPayload) {
  const result = await workspaceStore.assignEntry({
    classId: workspaceStore.activeClassId!,
    timeSlotIds: [slotId],
    subjectId: payload.subjectId,
    teacherId: payload.teacherId,
  })

  if (result.warning) {
    emit('show-toast', result.warning, 'warning')
  } else if (result.success) {
    emit('show-toast', result.success, 'success')
  }
}

async function onRemoveEntry(entryId: string) {
  const result = await workspaceStore.deleteEntry(entryId)
  if (result.success) {
    emit('show-toast', result.success, 'success')
  }
  confirmDeleteEntryId.value = null
}

function onStartEdgePull(entry: ScheduleEntryDTO, slotId: string) {
  const day = ALL_DAYS.find((d) => workspaceStore.filteredTimeSlots[d as DayOfWeek]?.some((s: any) => s.id === slotId)) as DayOfWeek | undefined
  const slot = day ? workspaceStore.filteredTimeSlots[day]?.find((s: any) => s.id === slotId) : undefined

  if (day) {
    workspaceStore.startEdgePull(entry, slotId, day)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
}

function onMouseMove(event: MouseEvent) {
  if (!workspaceStore.edgePull.isPulling || !gridBodyRef.value) return

  const { sourceDay, sourceSlotId } = workspaceStore.edgePull
  if (!sourceDay || !sourceSlotId) return

  const table = gridBodyRef.value.querySelector('table')
  if (!table) return

  const tbody = table.querySelector('tbody')
  if (!tbody) return

  const rows = tbody.querySelectorAll('tr')
  if (rows.length === 0) return

  const tbodyRect = tbody.getBoundingClientRect()
  const rowHeight = tbodyRect.height / rows.length

  const relativeY = event.clientY - tbodyRect.top
  const targetRowIndex = Math.floor(relativeY / rowHeight)

  if (targetRowIndex < 0 || targetRowIndex >= rows.length) return

  const sourceRowIndex =
    rows.length -
    1 -
    Array.from(rows).findIndex((row) => {
      const tds = row.querySelectorAll('td')
      for (let i = 1; i < tds.length; i++) {
        const dayIndex = i - 1
        const day = ALL_DAYS[dayIndex]
        const slot = getSlotAt(day, rows.length - 1 - targetRowIndex)
        if (slot?.id === sourceSlotId) return true
      }
      return false
    })

  const daySlots = workspaceStore.filteredTimeSlots[sourceDay] ?? []
  const sourceIndex = daySlots.findIndex((s) => s.id === sourceSlotId)

  const minIndex = Math.min(sourceIndex, targetRowIndex)
  const maxIndex = Math.max(sourceIndex, targetRowIndex)

  const targetSlots: string[] = []
  for (let i = minIndex; i <= maxIndex; i++) {
    const slot = daySlots[i]
    if (slot?.id && slot.id !== sourceSlotId && slot.slot_type === 'LESSON' && !slot.is_locked) {
      targetSlots.push(slot.id)
    }
  }

  workspaceStore.updateEdgePullTarget(targetSlots)
}

async function onMouseUp() {
  cleanupMouseEvents()

  if (!workspaceStore.edgePull.isPulling) return

  const result = await workspaceStore.executeEdgePull()

  if (result.warnings && result.warnings.length > 0) {
    const warningMsg = result.warnings
      .map((w) => {
        const daySlots =
          workspaceStore.filteredTimeSlots[
            ALL_DAYS.find((d) =>
              workspaceStore.filteredTimeSlots[d]?.some((s) => s.id === w.slotId),
            ) as DayOfWeek | undefined
          ]
        const slotIndex = daySlots?.findIndex((s) => s.id === w.slotId) ?? -1
        return `Sesi ${slotIndex + 1}`
      })
      .join(', ')
    emit('show-toast', `Bentrok di slot ${warningMsg}: ${result.warnings[0].message}`, 'warning')
  }

  if (result.successSlots && result.successSlots.length > 0 && result.failedSlots && result.failedSlots.length === 0) {
    emit('show-toast', `${result.successSlots.length} slot berhasil diisi`, 'success')
  }
}

function onVisibilityChange() {
  if (document.hidden && workspaceStore.edgePull.isPulling) {
    cleanupMouseEvents()
    workspaceStore.cancelEdgePull()
  }
}

function cleanupMouseEvents() {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('visibilitychange', onVisibilityChange)
}

onUnmounted(() => {
  cleanupMouseEvents()
})
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="font-bold text-emerald-800">
        Grid Jadwal — {{ workspaceStore.activeClassName ?? '...' }}
      </h3>
      <span class="text-xs text-gray-400">
        <span class="hidden sm:inline">Drag guru dari sidebar</span>
        <span class="sm:hidden">Drag</span>
        · Tarik handle untuk perpanjang
      </span>
    </div>

    <div
      v-if="
        workspaceStore.isLoadingGrid ||
        workspaceStore.isLoadingSummary ||
        (timeSlotStore as any).isLoading ||
        props.isGridReady === false
      "
      class="flex items-center justify-center py-16"
    >
      <div class="text-center">
        <span
          class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-300 border-t-emerald-700"
        ></span>
        <p class="mt-3 text-sm text-gray-500">Memuat data slot waktu...</p>
      </div>
    </div>

    <div
      v-else-if="maxSlotCount === 0"
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

            <TimeSlotCell
              v-for="day in activeDays"
              :key="`${day}-${rowIndex}`"
              :slot="getSlotAt(day, rowIndex - 1) ?? { id: undefined, slot_type: 'BLANK', is_locked: true }"
              :day="day"
              :entry="
                workspaceStore.activeClassId && getSlotAt(day, rowIndex - 1)?.id
                  ? (workspaceStore.entryBySlotId[getSlotAt(day, rowIndex - 1)!.id!] ?? null)
                  : null
              "
              :is-pending="
                getSlotAt(day, rowIndex - 1)?.id
                  ? workspaceStore.pendingCells.has(getSlotAt(day, rowIndex - 1)!.id!)
                  : false
              "
              :is-edge-pull-target="isEdgePullTarget(day, rowIndex - 1)"
              :is-edge-pull-preview="isEdgePullTarget(day, rowIndex - 1)"
              :block-position="getBlockPosition(day, rowIndex - 1)"
              @drop="onDrop"
              @remove-entry="onRemoveEntry"
              @start-edge-pull="onStartEdgePull"
            />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>