<template>
  <span class="badge" :class="badgeClass">
    <slot />
  </span>
</template>

<script setup>
const props = defineProps({
  variant: { type: String, default: 'pending' }, // pending | success | danger
})

const badgeClass = computed(() => {
  if (props.variant === 'success') return 'badge-success'
  if (props.variant === 'danger') return 'badge-danger'
  return 'badge-pending'
})

import { computed } from 'vue'
</script>

<style scoped>
.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.badge-pending {
  background: var(--warning-bg);
  color: var(--warning-text);
}
.badge-success {
  background: var(--success-bg);
  color: var(--success-text);
}
.badge-danger {
  background: var(--danger-bg);
  color: var(--danger-text);
}
</style>
