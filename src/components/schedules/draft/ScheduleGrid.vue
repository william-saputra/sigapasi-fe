<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { useScheduleWorkspaceStore } from '@/stores/schedules/scheduleWorkspaceStore'
import { ALL_DAYS, DAY_LABELS, type DayOfWeek } from '@/interfaces/schedules/timeSlot.types'
import type { DragPayload, ScheduleEntryDTO } from '@/interfaces/schedules/schedule.types'
import TimeSlotCell from './components/TimeSlotCell.vue'
import { CalendarX } from 'lucide-vue-next'

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

const isPublished = computed(() => workspaceStore.activeDraft?.status === 'PUBLISHED')

// STATE BARU: Untuk melacak baris mana yang sedang di-hover 
// tanpa menggunakan class="group" yang bocor ke sel lain
const hoveredRow = ref<number | null>(null)

const maxSlotCount = computed(() => {
  let max = 0
  for (const day of ALL_DAYS) {
    const schedule = workspaceStore.filteredTimeSlots[day]
    if (schedule && schedule.length > max) max = schedule.length
  }
  return max
})

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

function onDayHeaderClick(day: DayOfWeek) {
  workspaceStore.setDayFilter(day)
}

async function onDrop(slotId: string, payload: DragPayload) {
  const result = await workspaceStore.assignEntry({
    classId: workspaceStore.activeClassId!,
    timeSlotIds: [slotId],
    subjectId: payload.subjectId,
    teacherId: payload.teacherId,
  })

  if (result.error) {
    return
  } else if (result.warning) {
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
  const day = ALL_DAYS.find((d) =>
    workspaceStore.filteredTimeSlots[d as DayOfWeek]?.some((s: any) => s.id === slotId),
  ) as DayOfWeek | undefined
  const slot = day
    ? workspaceStore.filteredTimeSlots[day]?.find((s: any) => s.id === slotId)
    : undefined

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
        if (day) {
          const slot = getSlotAt(day, rows.length - 1 - targetRowIndex)
          if (slot?.id === sourceSlotId) return true
        }
      }
      return false
    })

  const daySlots = workspaceStore.filteredTimeSlots[sourceDay] ?? []
  const sourceIndex = daySlots.findIndex((s: { id: any }) => s.id === sourceSlotId)

  const targetItem = workspaceStore.filteredSidebarItems.find(
    (item: { subjectId: any; teacherId: any }) =>
      item.subjectId === workspaceStore.edgePull.sourceEntry?.subjectId &&
      item.teacherId === workspaceStore.edgePull.sourceEntry?.teacherId
  )
  
  let maxAllowed = 999
  if (targetItem) {
    const teacherAllowed = targetItem.targetHours > 0 ? Math.max(0, targetItem.targetHours - targetItem.currentHours) : 999;
    const subjectAllowed = (targetItem as any).subjectTargetHours > 0 ? Math.max(0, (targetItem as any).subjectTargetHours - (targetItem as any).subjectCurrentHours) : 999;
    maxAllowed = Math.min(teacherAllowed, subjectAllowed);
  }

  const step = targetRowIndex > sourceIndex ? 1 : -1
  const targetSlots: string[] = []

  for (let i = sourceIndex + step; step > 0 ? i <= targetRowIndex : i >= targetRowIndex; i += step) {
    const slot = daySlots[i]
    if (slot?.id && slot.id !== sourceSlotId && slot.slot_type === 'LESSON' && !slot.is_locked) {
      if (targetSlots.length < maxAllowed) {
        targetSlots.push(slot.id)
      } else {
        break
      }
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
      .map((w: any) => {
        const day = ALL_DAYS.find((d) =>
          workspaceStore.filteredTimeSlots[d as DayOfWeek]?.some((s: any) => s.id === w.slotId),
        ) as DayOfWeek | undefined
        const daySlots = day ? workspaceStore.filteredTimeSlots[day] : []
        const slotIndex = daySlots?.findIndex((s: any) => s.id === w.slotId) ?? -1
        return `Sesi ${slotIndex + 1}`
      })
      .join(', ')
    emit(
      'show-toast',
      `Bentrok di slot ${warningMsg}: ${result.warnings[0]?.message || 'Terjadi bentrok'}`,
      'warning',
    )
  }

  if (
    result.successSlots &&
    result.successSlots.length > 0 &&
    result.failedSlots &&
    result.failedSlots.length === 0
  ) {
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
    <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-3">
        <h3 class="text-lg font-bold text-slate-800">
          Grid Jadwal <span class="text-emerald-700">— {{ workspaceStore.activeClassName ?? '...' }}</span>
        </h3>
        
        <button
          v-if="workspaceStore.activeDayFilter !== null"
          @click="workspaceStore.setDayFilter(null)"
          class="group flex items-center gap-1.5 rounded-full bg-emerald-100 pl-3 pr-2 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-600 hover:text-white"
        >
          Tampilkan Semua Hari
          <span class="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200 text-emerald-800 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </span>
        </button>
      </div>
      
      <span class="flex items-center gap-2 text-xs text-gray-400">
        <svg class="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span class="hidden sm:inline">Drag guru ke sel · Tarik handle bawah untuk perpanjang</span>
        <span class="sm:hidden">Drag & Drop · Edge Pull</span>
      </span>
    </div>

    <div
      v-if="
        workspaceStore.isLoadingGrid ||
        workspaceStore.isLoadingSummary ||
        (timeSlotStore as any).isLoading ||
        props.isGridReady === false
      "
      class="flex flex-col items-center justify-center py-20"
    >
      <span class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"></span>
      <p class="mt-4 text-sm font-medium text-slate-500">Memuat matriks jadwal...</p>
    </div>

    <div v-else-if="maxSlotCount === 0" class="py-16 text-center">
      <div class="mb-4 flex justify-center text-slate-300">
        <CalendarX class="h-12 w-12" />
      </div>
      <h4 class="mb-2 text-lg font-bold text-slate-700">Belum ada slot waktu</h4>
      <p class="text-sm text-slate-500">
        Silakan atur master slot waktu di halaman
        <router-link to="/pengaturan-slot-waktu" class="font-semibold text-emerald-600 hover:underline">
          Pengaturan Waktu
        </router-link>
        terlebih dahulu.
      </p>
    </div>

    <div v-else ref="gridBodyRef" class="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table class="w-full border-collapse text-sm bg-white">
        <thead>
          <tr>
            <th
              class="border-b border-r border-slate-300 bg-slate-800 px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"
            >
              Waktu
            </th>
            
            <!-- HEADER HARI DENGAN 3 STATE UI -->
            <th
              v-for="day in activeDays"
              :key="day"
              :class="[
                'border-b border-r px-3 py-3.5 text-center uppercase tracking-wider text-xs transition-all duration-300 ease-in-out cursor-pointer select-none',
                workspaceStore.activeDayFilter === day
                  ? 'bg-emerald-50 text-emerald-700 font-black border-emerald-200 shadow-[inset_0_-4px_0_#10b981] relative z-10 hover:bg-emerald-100 hover:shadow-[inset_0_-4px_0_#059669]' // 1 HARI AKTIF - Green Theme & Interactive Shadow
                  : workspaceStore.activeDayFilter === null
                    ? 'bg-white text-slate-700 font-bold border-slate-200 shadow-[inset_0_-2px_0_#cbd5e1] hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-[inset_0_-3px_0_#10b981]' // DEFAULT (Semua Aktif)
                    : 'bg-slate-50 text-slate-400 font-medium border-slate-200 opacity-60 hover:opacity-100 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-[inset_0_-3px_0_#34d399]' // HARI LAIN SAAT FILTER AKTIF
              ]"
              @click="onDayHeaderClick(day)"
              title="Klik untuk memfokuskan jadwal di hari ini"
            >
              <div class="flex items-center justify-center gap-1.5">
                {{ DAY_LABELS[day] }}
              </div>
            </th>
          </tr>
        </thead>
        
        <tbody>
          <!-- HAPUS CLASS "group" DISINI & GANTI DENGAN EVENT MOUSEENTER -->
          <tr 
            v-for="rowIndex in maxSlotCount" 
            :key="rowIndex"
            @mouseenter="hoveredRow = rowIndex"
            @mouseleave="hoveredRow = null"
          >
            <!-- Kolom Waktu/Sesi merespons hover state lokal, BUKAN Tailwind group -->
            <td
              :class="[
                'whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-center align-middle transition-colors',
                hoveredRow === rowIndex ? 'bg-slate-100' : 'bg-slate-50/80'
              ]"
            >
              <div class="font-bold text-slate-700 text-xs tracking-tight">
                {{ getRowTimeLabel(rowIndex - 1) }}
              </div>
              <div class="mt-1.5 inline-flex items-center justify-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100 shadow-sm">
                {{ getRowLabel(rowIndex - 1) }}
              </div>
            </td>

            <TimeSlotCell
              v-for="day in activeDays"
              :key="`${day}-${rowIndex}`"
              :slot="
                getSlotAt(day, rowIndex - 1) ?? {
                  id: undefined,
                  slot_type: 'BLANK',
                  is_locked: true,
                }
              "
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
              :highlight-status="
                getSlotAt(day, rowIndex - 1)?.id
                  ? workspaceStore.highlightedSlots.get(getSlotAt(day, rowIndex - 1)!.id!)?.status ?? null
                  : null
              "
              :blocked-reason="
                getSlotAt(day, rowIndex - 1)?.id
                  ? workspaceStore.highlightedSlots.get(getSlotAt(day, rowIndex - 1)!.id!)?.blockedReason ?? null
                  : null
              "
              :is-published="isPublished"
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