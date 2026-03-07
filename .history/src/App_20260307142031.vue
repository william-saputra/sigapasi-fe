<template>
  <div class="app-root">
    <GlobalNavbar />
    <main class="app-main">
      <RouterView />
    </main>
    <Toaster position="top-right" richColors />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import GlobalNavbar from "@/components/common/GlobalNavbar.vue";
import { Toaster } from "vue-sonner";
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  background: var(--bg-light);
}

.app-main {
  padding: 24px 0 32px;
}
</style>
