<script setup lang="ts">
defineProps<{
  show: boolean
  maxWidthClass?: string
}>()

const emit = defineEmits<{
  close: []
}>()

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="onOverlayClick"
      >
        <div class="w-full rounded-xl bg-white p-8 text-center shadow-2xl animate-in" :class="maxWidthClass || 'max-w-[400px]'">
          <slot name="header" />
          <slot name="body" />
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-leave-active {
  animation: modal-pop 0.2s ease-in reverse;
}
@keyframes modal-pop {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
