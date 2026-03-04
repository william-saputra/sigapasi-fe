<template>
  <div class="user-profile">
    <div class="avatar">{{ initials }}</div>
    <div class="info">
      <span class="name">{{ name }}</span>
      <span class="role">{{ role }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  initials: { type: String, default: "EV" },
  name: { type: String, default: "Evelyn Depthios" },
  role: { type: String, default: "Guru Tetap" },
});
</script>

<style scoped>
.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 36px; height: 36px;
  background: #E8F5E9;
  color: var(--primary);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 14px;
}
.info { line-height: 1.2; }
.name { font-size: 14px; font-weight: 600; display: block; }
.role { font-size: 12px; color: var(--text-grey); }
</style>
