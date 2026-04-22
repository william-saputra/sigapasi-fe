<template>
  <div class="card">
    <slot />
  </div>
</template>

<style scoped>
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
</style>
