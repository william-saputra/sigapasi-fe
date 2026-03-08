<template>
  <button
    class="btn"
    :type="type"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps({
  type: { type: String, default: "button" },
  disabled: { type: Boolean, default: false },
});
defineEmits(["click"]);
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--primary);
  color: var(--white);
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  font-family: var(--font);
  transition: 0.2s;
}
.btn:hover { background: var(--primary-hover); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
