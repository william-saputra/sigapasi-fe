<template>
  <div class="notif-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <button class="back-btn" @click="router.back()">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h1 class="page-title">Notifikasi</h1>
          <p class="page-subtitle">
            {{ totalUnread > 0 ? `${totalUnread} belum dibaca` : 'Semua sudah dibaca' }}
          </p>
        </div>
      </div>

      <div class="page-header-actions">
        <button
          v-if="hasUnread"
          class="btn btn-ghost"
          :disabled="loading"
          @click="handleMarkAllAsRead"
        >
          <i class="fa-solid fa-check-double"></i>
          Tandai semua dibaca
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="notif-list-container">
      <!-- Loading skeleton -->
      <template v-if="loading && filteredItems.length === 0">
        <div v-for="i in 5" :key="i" class="notif-card skeleton">
          <div class="skeleton-icon"></div>
          <div class="skeleton-body">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line long"></div>
            <div class="skeleton-line xshort"></div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon-wrap">
          <i class="fa-regular fa-bell-slash"></i>
        </div>
        <h3>Tidak ada notifikasi</h3>
        <p>
          {{
            activeTab === 'unread'
              ? 'Semua notifikasi sudah dibaca.'
              : 'Belum ada notifikasi untuk ditampilkan.'
          }}
        </p>
      </div>

      <!-- Grouped list -->
      <template v-else>
        <div
          v-for="(group, groupKey) in groupedItems"
          :key="groupKey"
          class="notif-group"
        >
          <div class="group-label">{{ groupKey }}</div>

          <div
            v-for="item in group"
            :key="item.id"
            class="notif-card"
            :class="{ unread: !item.read }"
            @click="handleItemClick(item)"
          >
            <div class="card-icon-wrap" :class="getIconClass(item)">
              <i :class="getIcon(item)"></i>
            </div>

            <div class="card-body">
              <div class="card-top">
                <p class="card-title">{{ item.title }}</p>
                <span class="card-time">{{ formatRelativeTime(item.createdAt) }}</span>
              </div>
              <p v-if="item.message" class="card-message">{{ item.message }}</p>
            </div>

            <div class="card-actions">
              <div v-if="!item.read" class="unread-badge">Baru</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/stores/notifications/notification.store'
import type { Notifications } from '@/interfaces/notifications/notification.interface'

type TabValue = 'all' | 'unread'

const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications, loading } = storeToRefs(notificationStore)

const activeTab = ref<TabValue>('all')

const items = computed<Notifications[]>(() => notifications.value ?? [])
const hasUnread = computed(() => items.value.some((n) => !n.read))
const totalUnread = computed(() => items.value.filter((n) => !n.read).length)

const tabs = computed(() => [
  { label: 'Semua', value: 'all' as TabValue, count: 0 },
  { label: 'Belum dibaca', value: 'unread' as TabValue, count: totalUnread.value },
])

const filteredItems = computed<Notifications[]>(() => {
  if (activeTab.value === 'unread') return items.value.filter((n) => !n.read)
  return items.value
})

// Group by date (Hari ini / Kemarin / Minggu ini / Lebih lama)
const groupedItems = computed(() => {
  const groups: Record<string, Notifications[]> = {}

  for (const item of filteredItems.value) {
    const label = getDateGroupLabel(item.createdAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  }

  return groups
})

function getDateGroupLabel(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  if (date >= startOfToday) return 'Hari ini'
  if (date >= startOfYesterday) return 'Kemarin'
  if (date >= startOfWeek) return 'Minggu ini'
  return 'Lebih lama'
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────
type IconVariant = 'info' | 'success' | 'warning' | 'error' | 'default'

function resolveVariant(item: Notifications): IconVariant {
  const text = `${item.title} ${item.message}`.toLowerCase()
  if (/sukses|berhasil|approved|selesai|completed/.test(text)) return 'success'
  if (/gagal|ditolak|rejected|failed|error/.test(text)) return 'error'
  if (/perhatian|warning|peringatan/.test(text)) return 'warning'
  if (/info|diperbarui|update|baru/.test(text)) return 'info'
  return 'default'
}

function getIcon(item: Notifications) {
  const map: Record<IconVariant, string> = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-xmark',
    warning: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info',
    default: 'fa-solid fa-bell',
  }
  return map[resolveVariant(item)]
}

function getIconClass(item: Notifications) {
  return `card-icon-${resolveVariant(item)}`
}

// ─── Actions ─────────────────────────────────────────────────────────────────
async function handleItemClick(item: Notifications) {
  if (!item.read) {
    await notificationStore.markAsRead(item.id)
  }
}

async function handleMarkAllAsRead() {
  await notificationStore.markAllAsRead()
}

// ─── Time formatting ──────────────────────────────────────────────────────────
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays < 7) return `${diffDays} hari lalu`

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await notificationStore.getMyNotification()
})
</script>

<style scoped>
/* ── Page layout ── */
.notif-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-dark);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}
.back-btn:hover { background: var(--bg-light); }

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-dark);
  line-height: 1.2;
}
.page-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-grey);
}

.page-header-actions { display: flex; gap: 8px; }

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-dark);
}
.btn-ghost:hover:not(:disabled) { background: var(--bg-light); }

/* ── Filter tabs ── */
.filter-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}
.tab-btn {
  padding: 10px 16px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-grey);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn.active {
  color: var(--primary, #6366F1);
  border-bottom-color: var(--primary, #6366F1);
}
.tab-btn:hover:not(.active) { color: var(--text-dark); }

.tab-badge {
  background: var(--primary, #6366F1);
  color: #fff;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.6;
}

/* ── List container ── */
.notif-list-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Group label ── */
.notif-group { margin-bottom: 24px; }
.group-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-grey);
  margin-bottom: 8px;
  padding: 0 4px;
}

/* ── Notification card ── */
.notif-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}
.notif-card:hover {
  background: #F9FAFB;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.notif-card.unread {
  background: var(--success-bg, #ECFDF5);
  border-color: #A7F3D0;
}
.notif-card.unread:hover { background: #D1FAE5; }

/* ── Card icon ── */
.card-icon-wrap {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
}
.card-icon-default  { background: #EEF2FF; color: var(--primary, #6366F1); }
.card-icon-success  { background: #ECFDF5; color: #10B981; }
.card-icon-error    { background: #FEF2F2; color: #EF4444; }
.card-icon-warning  { background: #FFFBEB; color: #F59E0B; }
.card-icon-info     { background: #EFF6FF; color: #3B82F6; }

/* ── Card body ── */
.card-body { flex: 1; min-width: 0; }
.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
  line-height: 1.4;
}
.card-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-grey);
  font-weight: 500;
  white-space: nowrap;
  margin-top: 2px;
}
.card-message {
  margin: 0;
  font-size: 13px;
  color: var(--text-grey);
  line-height: 1.5;
}

/* ── Card actions ── */
.card-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.unread-badge {
  background: var(--primary, #6366F1);
  color: #fff;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}

/* ── Skeleton ── */
.notif-card.skeleton {
  pointer-events: none;
  cursor: default;
}
.skeleton-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton-line.short  { width: 40%; }
.skeleton-line.long   { width: 80%; }
.skeleton-line.xshort { width: 25%; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 64px 24px;
  color: var(--text-grey);
}
.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin: 0 auto 16px;
  opacity: 0.6;
}
.empty-state h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
}
.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .notif-page { padding: 16px 12px 32px; }
  .page-header { gap: 8px; }
  .page-title { font-size: 18px; }
  .notif-card { padding: 12px; }
}
</style>