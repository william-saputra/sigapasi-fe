<script setup lang="ts">
import { computed } from 'vue'
import type { ScheduleEntryDTO, BlockPosition } from '@/interfaces/schedules/schedule.types'
import EdgePullHandle from './EdgePullHandle.vue'

const props = defineProps<{
  entry: ScheduleEntryDTO
  slotId: string
  position: BlockPosition
  isPending: boolean
}>()

const emit = defineEmits<{
  remove: [entryId: string]
  startEdgePull: [entry: ScheduleEntryDTO, slotId: string]
}>()

const borderRadiusClass = computed(() => {
  switch (props.position) {
    case 'start':
      return 'rounded-l-lg rounded-tr-lg rounded-br-none'
    case 'end':
      return 'rounded-r-lg rounded-tl-lg rounded-bl-none'
    case 'middle':
      return 'rounded-none'
    case 'single':
    default:
      return 'rounded-lg'
  }
})

const borderClass = computed(() => {
  switch (props.position) {
    case 'start':
      return 'border-r-0'
    case 'end':
      return 'border-l-0'
    case 'middle':
      return 'border-l-0 border-r-0'
    case 'single':
    default:
      return ''
  }
})

function onRemove() {
  emit('remove', props.entry.entryId)
}

function onStartEdgePull() {
  emit('startEdgePull', props.entry, props.slotId)
}
</script>

<template>
  <div
    :class="[
      'group relative bg-emerald-50 px-1.5 py-1 transition-all',
      borderRadiusClass,
      borderClass,
      isPending ? 'opacity-50' : '',
    ]"
  >
    <div class="text-[11px] font-bold uppercase text-emerald-800" :title="entry.subjectName">
      {{ entry.subjectKode }}
    </div>
    <div class="text-[10px] text-gray-500">
      {{ entry.teacherName }}
    </div>

    <button
      v-if="entry.entryId"
      class="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white hover:bg-red-600 group-hover:flex z-10"
      @click.stop="onRemove"
    >
      ✕
    </button>

    <EdgePullHandle @start-pull="onStartEdgePull" />
  </div>
</template>
