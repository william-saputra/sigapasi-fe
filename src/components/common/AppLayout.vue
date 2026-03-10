<template>
  <div class="app-layout">
    <slot />
  </div>
</template>

<style scoped>
.app-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;

  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
