<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/accounts/auth.store'

type Role = 'ADMIN' | 'STAFF' | 'HEAD' | 'TEACHER'

const authStore = useAuthStore()
const { user: authUser } = storeToRefs(authStore)

const roleLabels: Record<Role, string> = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  HEAD: 'Kepala Sekolah',
  TEACHER: 'Guru',
}

const roleGreetings: Record<Role, string> = {
  ADMIN: 'Kelola dan pantau seluruh operasional sistem dari satu tempat.',
  STAFF: 'Bantu koordinasi jadwal, cuti, dan administrasi harian sekolah.',
  HEAD: 'Pantau kinerja, evaluasi guru, dan ambil keputusan strategis.',
  TEACHER: 'Lihat jadwal mengajar, ajukan cuti, dan pantau perkembangan kelasmu.',
}

const statsMap: Record<Role, { label: string; value: string; note: string; icon: string }[]> = {
  ADMIN: [
    { label: 'Jadwal Aktif', value: '24', note: '2 perlu penyesuaian', icon: 'fa-solid fa-calendar-days' },
    { label: 'Pengajuan Cuti', value: '5', note: '3 menunggu approval', icon: 'fa-solid fa-file-lines' },
    { label: 'Guru Pengganti', value: '3', note: 'Slot perlu ditugaskan', icon: 'fa-solid fa-rotate' },
    { label: 'Review Guru', value: '12', note: '4 evaluasi pending', icon: 'fa-solid fa-star-half-stroke' },
  ],
  STAFF: [
    { label: 'Jadwal Hari Ini', value: '24', note: '2 perlu penyesuaian', icon: 'fa-solid fa-calendar-days' },
    { label: 'Kehadiran Guru', value: '87%', note: 'Dari total guru aktif', icon: 'fa-solid fa-circle-check' },
    { label: 'Cuti Pending', value: '3', note: 'Menunggu diproses', icon: 'fa-solid fa-hourglass-half' },
    { label: 'Notifikasi', value: '7', note: 'Belum ditindaklanjuti', icon: 'fa-solid fa-bell' },
  ],
  HEAD: [
    { label: 'Total Guru', value: '48', note: '2 cuti hari ini', icon: 'fa-solid fa-chalkboard-user' },
    { label: 'Kelas Berjalan', value: '22/24', note: '2 kelas kosong', icon: 'fa-solid fa-school' },
    { label: 'Approval Cuti', value: '5', note: '3 butuh keputusan', icon: 'fa-solid fa-file-circle-check' },
    { label: 'Skor Evaluasi', value: '4.2', note: 'Rata-rata bulan ini', icon: 'fa-solid fa-chart-line' },
  ],
  TEACHER: [
    { label: 'Kelas Hari Ini', value: '3', note: '1 kelas tersisa', icon: 'fa-solid fa-book-open' },
    { label: 'Sisa Cuti', value: '9', note: 'Hari dari jatah tahunan', icon: 'fa-solid fa-umbrella-beach' },
    { label: 'Tugas Pengganti', value: '1', note: 'Jadwal besok pagi', icon: 'fa-solid fa-person-chalkboard' },
    { label: 'Skor Review', value: '4.5', note: 'Periode Januari', icon: 'fa-solid fa-star' },
  ],
}

const menusMap: Record<Role, { title: string; desc: string; to: string; icon: string }[]> = {
  ADMIN: [
    { title: 'Kelola Jadwal', desc: 'Susun, revisi, dan cek bentrok jadwal pelajaran.', to: '/jadwal', icon: 'fa-solid fa-calendar-days' },
    { title: 'Approval Cuti', desc: 'Tinjau dan setujui pengajuan cuti guru.', to: '/leaves/approvals', icon: 'fa-solid fa-file-circle-check' },
    { title: 'Guru Pengganti', desc: 'Cari dan tetapkan guru pengganti kelas kosong.', to: '/guru-pengganti', icon: 'fa-solid fa-rotate' },
    { title: '360 Review', desc: 'Pantau progres dan hasil evaluasi guru.', to: '/review', icon: 'fa-solid fa-chart-line' },
    { title: 'Manajemen Pengguna', desc: 'Kelola akun dan hak akses sistem.', to: '/accounts', icon: 'fa-solid fa-users-gear' },
    { title: 'Laporan', desc: 'Unduh laporan operasional dan kinerja.', to: '/laporan', icon: 'fa-solid fa-file-export' },
  ],
  STAFF: [
    { title: 'Jadwal Hari Ini', desc: 'Cek dan perbarui jadwal pelajaran harian.', to: '/jadwal', icon: 'fa-solid fa-calendar-days' },
    { title: 'Proses Cuti', desc: 'Bantu proses administrasi pengajuan cuti.', to: '/leaves', icon: 'fa-solid fa-file-lines' },
    { title: 'Guru Pengganti', desc: 'Koordinasi penugasan guru pengganti.', to: '/guru-pengganti', icon: 'fa-solid fa-rotate' },
    { title: 'Data Guru', desc: 'Lihat dan perbarui data profil guru.', to: '/guru', icon: 'fa-solid fa-chalkboard-user' },
  ],
  HEAD: [
    { title: 'Dashboard Kinerja', desc: 'Pantau KPI dan kinerja keseluruhan sekolah.', to: '/kinerja', icon: 'fa-solid fa-chart-line' },
    { title: 'Approval Cuti', desc: 'Setujui atau tolak pengajuan cuti guru.', to: '/leaves/approvals', icon: 'fa-solid fa-file-circle-check' },
    { title: 'Hasil Review', desc: 'Lihat rekap evaluasi 360 derajat guru.', to: '/review', icon: 'fa-solid fa-star-half-stroke' },
    { title: 'Jadwal Sekolah', desc: 'Pantau jadwal dan kehadiran kelas.', to: '/jadwal', icon: 'fa-solid fa-school' },
  ],
  TEACHER: [
    { title: 'Jadwal Mengajar', desc: 'Lihat jadwal kelas dan ruanganmu hari ini.', to: '/jadwal', icon: 'fa-solid fa-calendar-days' },
    { title: 'Ajukan Cuti', desc: 'Buat dan pantau status pengajuan cuti.', to: '/leaves/history', icon: 'fa-solid fa-umbrella-beach' },
    { title: 'Review Saya', desc: 'Lihat hasil evaluasi dan feedback.', to: '/review/saya', icon: 'fa-solid fa-star' },
    { title: 'Kelas Pengganti', desc: 'Cek jadwal penggantian yang ditugaskan.', to: '/guru-pengganti', icon: 'fa-solid fa-person-chalkboard' },
  ],
}

const normalizeRole = (role?: string | null): Role => {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return 'ADMIN'
    case 'STAFF':
      return 'STAFF'
    case 'HEAD':
      return 'HEAD'
    case 'TEACHER':
      return 'TEACHER'
    default:
      return 'ADMIN'
  }
}

const currentRole = computed<Role>(() => normalizeRole(authUser.value?.role))
const stats = computed(() => statsMap[currentRole.value])
const menus = computed(() => menusMap[currentRole.value])
const greeting = computed(() => roleGreetings[currentRole.value])
const roleLabel = computed(() => roleLabels[currentRole.value])
</script>

<template>
  <main class="page">
    <section class="hero">
      <div class="inner">
        <span class="hero-badge">
          <i class="fa-solid fa-user-tie"></i>
          {{ roleLabel }}
        </span>
        <h1 class="hero-title">Selamat datang kembali 👋</h1>
        <p class="hero-sub">{{ greeting }}</p>
      </div>
    </section>

    <section class="stats-section">
      <div class="inner">
        <div class="stats-grid">
          <div
            v-for="(s, i) in stats"
            :key="s.label"
            class="stat-card"
            :style="`--i:${i}`"
          >
            <div class="stat-icon">
              <i :class="s.icon"></i>
            </div>
            <div>
              <p class="stat-label">{{ s.label }}</p>
              <p class="stat-value">{{ s.value }}</p>
              <p class="stat-note">{{ s.note }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="inner">
        <div class="card">
          <div class="card-head">
            <div>
              <p class="eyebrow">Akses Cepat</p>
              <h2 class="card-title">Modul Utama</h2>
            </div>
          </div>

          <div class="menus-grid">
            <RouterLink
              v-for="menu in menus"
              :key="menu.title"
              :to="menu.to"
              class="menu-item"
            >
              <div class="menu-icon-box">
                <i :class="menu.icon"></i>
              </div>
              <div class="menu-text">
                <p class="menu-title">{{ menu.title }}</p>
                <p class="menu-desc">{{ menu.desc }}</p>
              </div>
              <i class="fa-solid fa-chevron-right menu-arrow"></i>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  --green: #014f01;
  --green-light: #e6f4e6;
  --green-pale: #f2faf2;
  --white: #ffffff;
  --surface: #f8fafc;
  --border: #e2e8f0;
  --ink: #0f172a;
  --ink-soft: #64748b;
  --r-sm: 10px;
  --r: 14px;
  --r-lg: 20px;

  min-height: 100vh;
  background: var(--surface);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

.inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.hero {
  background: var(--green);
  padding: 52px 0 56px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 999px;
}

.hero-title {
  margin-top: 16px;
  font-size: clamp(32px, 4vw, 46px);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.hero-sub {
  margin-top: 12px;
  max-width: 680px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.7;
}

.stats-section {
  padding: 32px 0 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 22px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  animation: fadeUp 0.35s ease both;
  animation-delay: calc(var(--i) * 55ms);
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(1, 79, 1, 0.08);
  transform: translateY(-2px);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-label {
  font-size: 14px;
  color: var(--ink-soft);
  font-weight: 600;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  font-size: 30px;
  color: var(--green);
  min-width: 40px;
}

.stat-value {
  margin-top: 6px;
  font-size: 32px;
  font-weight: 800;
  color: var(--green);
  letter-spacing: -0.04em;
  line-height: 1;
}

.stat-note {
  margin-top: 8px;
  font-size: 13px;
  color: var(--ink-soft);
}

.content-section {
  padding: 28px 0 56px;
}

.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 28px;
}

.card-head {
  margin-bottom: 20px;
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.card-title {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.2;
}

.menus-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 14px;
}

@media (min-width: 768px) {
  .menus-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: var(--r);
  border: 1px solid var(--border);
  background: var(--surface);
  text-decoration: none;
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.menu-item:hover {
  background: var(--green-pale);
  border-color: #a3d9a3;
  box-shadow: 0 6px 18px rgba(1, 79, 1, 0.07);
}

.menu-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--r-sm);
  background: var(--green-light);
  color: var(--green);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
  transition: background 0.18s ease, color 0.18s ease;
}

.menu-item:hover .menu-icon-box {
  background: var(--green);
  color: #ffffff;
}

.menu-text {
  flex: 1;
  min-width: 0;
}

.menu-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
}

.menu-desc {
  margin-top: 4px;
  font-size: 14px;
  color: var(--ink-soft);
  line-height: 1.55;
}

.menu-arrow {
  font-size: 13px;
  color: var(--ink-soft);
  flex-shrink: 0;
  transition: color 0.15s ease, transform 0.15s ease;
}

.menu-item:hover .menu-arrow {
  color: var(--green);
  transform: translateX(2px);
}
</style>
