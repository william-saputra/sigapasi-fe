<template>
  <header class="global-navbar">
    <div class="global-navbar__inner">
      <img class="global-navbar__logo" :src="logoSrc" alt="Logo" />

      <div class="global-navbar__right">
        <NotificationBell v-model="notifications" />
        <UserProfile initials="EV" name="Evelyn Depthios" role="Guru Tetap" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import NotificationBell from "@/components/header/NotificationBell.vue";
import UserProfile from "@/components/header/UserProfile.vue";
import logoSrc from "@/assets/logo-candle-tree.png";

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
.global-navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  background: #eef1f4;
  border-bottom: 1px solid #d8dee6;
}

.global-navbar__inner {
  width: 100%;
  min-height: 72px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.global-navbar__logo {
  height: 34px;
  width: auto;
  display: block;
  object-fit: contain;
}

.global-navbar__right {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
