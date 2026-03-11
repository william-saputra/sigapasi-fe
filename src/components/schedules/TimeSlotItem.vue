<script setup lang="ts">
import type { TimeSlot } from '@/interfaces/schedules/timeSlot.types'

// --- Props & Emits ---
const props = defineProps<{
  slot: TimeSlot
  index: number
}>()

const emit = defineEmits<{
  'update-duration': [index: number, duration: number]
  'show-notification': [message: string, type: 'success' | 'error']
  'toggle-lock': [index: number]
  delete: [index: number]
  'drag-start': [index: number, event: DragEvent]
  'drag-over': [event: DragEvent]
  drop: [index: number, event: DragEvent]
  'drag-end': []
}>()

// --- Methods ---
/** Parses input event to a valid duration and emits update if successful */
function onDurationChange(e: Event) {
  const target = e.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  if (isNaN(val) || val <= 0) {
    emit('show-notification', 'Durasi per slot tidak boleh 0 atau minus', 'error')
    target.value = props.slot.duration.toString()
  } else {
    emit('update-duration', props.index, val)
  }
}
</script>

<template>
  <!-- Main Container -->
  <div
    :class="[
      'flex items-center justify-between rounded-lg border px-4 py-3 transition-all duration-200',
      'cursor-grab hover:translate-x-0.5',
      slot.slot_type === 'BREAK'
        ? 'border-amber-300 bg-amber-50'
        : slot.is_locked
          ? 'border-gray-400 bg-gray-100'
          : 'border-gray-300 bg-white hover:border-emerald-800',
    ]"
    draggable="true"
    @dragstart="emit('drag-start', index, $event)"
    @dragover.prevent="emit('drag-over', $event)"
    @drop="emit('drop', index, $event)"
    @dragend="emit('drag-end')"
  >
    <!-- Left Side Content -->
    <div class="flex flex-grow items-center gap-4">
      <!-- Drag Handle -->
      <span class="cursor-grab select-none text-lg text-gray-400">::</span>

      <!-- Time Indicator Badge -->
      <div
        :class="[
          'min-w-[90px] rounded px-2 py-1 text-center text-sm font-semibold text-white',
          slot.slot_type === 'BREAK'
            ? 'bg-amber-500'
            : slot.is_locked
              ? 'bg-gray-500'
              : 'bg-emerald-800',
        ]"
      >
        {{ slot.start_time }} - {{ slot.end_time }}
      </div>

      <!-- Slot Details -->
      <div class="flex flex-col">
        <span class="text-sm font-bold text-gray-800">
          {{
            slot.is_locked && slot.locked_label
              ? slot.locked_label
              : slot.slot_type === 'BREAK'
                ? 'Istirahat'
                : `Jam Ke-${slot.session_number}`
          }}
        </span>
        <span class="text-xs uppercase tracking-wide text-gray-500">
          {{ slot.is_locked ? 'LOCKED' : slot.slot_type === 'LESSON' ? 'PELAJARAN' : 'ISTIRAHAT' }}
        </span>
      </div>
    </div>

    <!-- Right Side Controls -->
    <div class="flex items-center gap-2">
      <!-- Duration Input -->
      <input
        type="number"
        :value="slot.duration"
        :disabled="slot.is_locked"
        class="w-[50px] rounded border border-gray-300 px-1 py-1 text-center text-sm font-bold text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        min="1"
        @change="onDurationChange"
      />
      <span class="text-xs text-gray-500">m</span>

      <!-- Lock Toggle Action -->
      <button
        v-if="slot.slot_type !== 'BREAK'"
        class="rounded p-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
        :title="slot.is_locked ? 'Unlock' : 'Lock'"
        @click="emit('toggle-lock', index)"
      >
        {{ slot.is_locked ? '🔒' : '🔓' }}
      </button>

      <!-- Delete Action -->
      <button
        class="rounded p-1 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
        title="Hapus"
        @click="emit('delete', index)"
      >
        ✖
      </button>
    </div>
  </div>
</template>
