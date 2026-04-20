<script setup lang="ts">
const emit = defineEmits<{
  startPull: []
}>()

function onMouseDown(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  emit('startPull')
}
</script>

<template>
  <div
    class="absolute -right-0.5 top-1/2 z-10 -translate-y-1/2 cursor-ew-resize touch-none rounded bg-emerald-200/60 px-0.5 py-2 opacity-0 transition-opacity hover:bg-emerald-300/80 group-hover:opacity-100"
    @mousedown="onMouseDown"
  >
    <svg width="4" height="12" viewBox="0 0 4 12" fill="currentColor" class="text-emerald-600">
      <circle cx="1" cy="2" r="1" />
      <circle cx="3" cy="2" r="1" />
      <circle cx="1" cy="6" r="1" />
      <circle cx="3" cy="6" r="1" />
      <circle cx="1" cy="10" r="1" />
      <circle cx="3" cy="10" r="1" />
    </svg>
  </div>
</template>
