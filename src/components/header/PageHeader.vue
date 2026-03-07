<template>
  <div class="page-header">
    <div class="page-header__left">
      <h1>{{ title }}</h1>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.actions" class="page-header__right">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header__left h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--primary);
}

.subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--text-grey);
}

.page-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .page-header__right {
    width: 100%;
  }
}
</style>
