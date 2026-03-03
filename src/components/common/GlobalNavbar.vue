<template>
  <header class="app-navbar">
    <div class="app-navbar__left">
      <slot name="left">
        <div class="app-navbar__brand">SIGAP</div>
      </slot>
    </div>

    <div class="app-navbar__right">
      <NotificationBell v-model="notifications" />
      <UserProfile initials="EV" name="Evelyn Depthios" role="Guru Tetap" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import NotificationBell from "@/components/header/NotificationBell.vue";
import UserProfile from "@/components/header/UserProfile.vue";

const notifications = ref([
  {
    id: "n1",
    icon: "✅",
    title: "Cuti Disetujui",
    message: "Pengajuan cuti sakit Anda (10 Jan) telah disetujui oleh Kepala Sekolah.",
    time: "Baru saja",
    read: false,
  },
  {
    id: "n2",
    icon: "❌",
    title: "Cuti Ditolak",
    message: "Pengajuan izin pribadi Anda (20 Feb) ditolak. Silakan cek alasan penolakan.",
    time: "2 jam yang lalu",
    read: false,
  },
  {
    id: "n3",
    icon: "📢",
    title: "Pengumuman",
    message: "Jatah cuti tahunan telah direset untuk tahun ajaran baru.",
    time: "3 hari yang lalu",
    read: true,
  },
]);
</script>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  background: var(--white);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 30;
}

.app-navbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-navbar__brand {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.app-navbar__right {
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>
