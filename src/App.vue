<template>
  <GlobalNavbar />
  <main class="app-content">
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import GlobalNavbar from '@/components/common/GlobalNavbar.vue'
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  background: var(--bg-light);
}

.app-main {
  padding: 24px 0 32px;
}

.app-content {
  padding-top: 72px;
  min-height: 100vh;
}
</style>
