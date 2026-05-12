<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { DayOfWeek } from '@/interfaces/schedules/timeSlot.types'
import type { ScheduleEntryDTO, DragPayload } from '@/interfaces/schedules/schedule.types'
import EntryCard from './EntryCard.vue'

const props = defineProps<{
  slot: { id?: string; slot_type: string; is_locked: boolean; locked_label?: string | null }
  day: DayOfWeek
  entry: ScheduleEntryDTO | null
  isPending: boolean
  isEdgePullTarget: boolean
  isEdgePullPreview: boolean
  blockPosition: 'start' | 'middle' | 'end' | 'single'
}>()

const emit = defineEmits<{
  drop: [slotId: string, payload: DragPayload]
  removeEntry: [entryId: string]
  startEdgePull: [entry: ScheduleEntryDTO, slotId: string]
}>()

const isDroppable = computed(() => {
  return !!props.slot.id && props.slot.slot_type === 'LESSON' && !props.slot.is_locked
})

// Anti-flickering drag counter
const dragCounter = ref(0)
const isDragOver = computed(() => dragCounter.value > 0)

const cellBaseClass = computed(() => {
  if (!props.slot) return 'bg-gray-100'
  // FIX: Jadikan sel BLANK transparan tanpa border
  if (props.slot.slot_type === 'BLANK') return 'bg-gray-50/50 text-transparent border-transparent'

  if (props.slot.slot_type === 'BREAK') return 'bg-amber-50 text-amber-600'
  if (props.slot.is_locked) return 'bg-gray-100 text-gray-400'
  if (props.isEdgePullPreview)
    return 'bg-emerald-100 ring-2 ring-inset ring-emerald-400 ring-dashed'
  if (isDragOver.value && isDroppable.value)
    return 'bg-emerald-50 ring-2 ring-inset ring-emerald-300'
  return 'bg-white'
})

const contentPointerEvents = computed(() => (isDragOver.value ? 'pointer-events-none' : ''))

function onDragEnter(event: DragEvent) {
  if (!isDroppable.value) return
  event.preventDefault() // FIX KRITIS: Wajib ada agar browser tidak membatalkan drop!
  dragCounter.value++
}

function onDragLeave() {
  dragCounter.value--
}

function onDragOver(event: DragEvent) {
  if (!isDroppable.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

function onDrop(event: DragEvent) {
  dragCounter.value = 0

  if (!isDroppable.value) return
  event.preventDefault()

  const raw = event.dataTransfer?.getData('text/plain')
  if (!raw) {
    console.error('Drag failed: Payload kosong atau diblokir oleh browser.')
    return
  }

  try {
    const payload: DragPayload = JSON.parse(raw)
    // Pastikan emit menggunakan id yang sudah divalidasi
    emit('drop', props.slot.id!, payload)
  } catch {
    console.error('Drag failed: Format JSON tidak valid.')
  }
}

function onRemoveEntry(entryId: string) {
  emit('removeEntry', entryId)
}

function onStartEdgePull(entry: ScheduleEntryDTO, slotId: string) {
  emit('startEdgePull', entry, slotId)
}

function onDragSessionEnd() {
  dragCounter.value = 0
}

onMounted(() => {
  window.addEventListener('drag-session-end', onDragSessionEnd)
})

onUnmounted(() => {
  window.removeEventListener('drag-session-end', onDragSessionEnd)
})
</script>

<template>
  <td
    :class="[
      'border border-gray-200 px-2 py-2 text-center text-xs transition-colors',
      cellBaseClass,
    ]"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <template v-if="slot.slot_type === 'BLANK'"> </template>

    <template v-else-if="slot.slot_type === 'BREAK'">
      <span class="text-xs font-semibold">Istirahat</span>
    </template>

    <template v-else-if="slot.is_locked">
      <span class="text-xs font-semibold">
        {{ slot.locked_label ?? 'Terkunci' }}
      </span>
    </template>

    <template v-else>
      <div v-if="isPending" class="flex items-center justify-center py-1">
        <span
          class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700"
        ></span>
      </div>

      <EntryCard
        v-else-if="entry && slot.id"
        :entry="entry"
        :slot-id="slot.id"
        :position="blockPosition"
        :is-pending="false"
        @remove="onRemoveEntry"
        @start-edge-pull="onStartEdgePull"
      />

      <div v-else :class="['py-2 text-gray-300', contentPointerEvents]">
        <span class="text-xs">Drop di sini</span>
      </div>
    </template>
  </td>
</template>
