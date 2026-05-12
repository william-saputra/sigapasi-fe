<template>
  <div class="notif-page">
    <div class="page-header">
      <div class="page-header-left">
        <button class="back-btn" @click="router.back()">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h1 class="page-title">Notifikasi</h1>
          <p class="page-subtitle">
            {{ isSelectionMode ? `${selectedIds.length} dipilih` : (totalUnread > 0 ? `${totalUnread} belum dibaca` : 'Semua sudah dibaca') }}
          </p>
        </div>
      </div>

      <div class="page-header-actions">
        <template v-if="filteredItems.length > 0">
          <button
            v-if="!isSelectionMode"
            class="btn btn-ghost"
            @click="isSelectionMode = true"
          >
            Pilih
          </button>

          <template v-else>
            <button class="btn btn-ghost" @click="toggleSelectAll">
              {{ isAllSelected ? 'Batal Semua' : 'Pilih Semua' }}
            </button>
            <button
              class="btn btn-danger"
              :disabled="selectedIds.length === 0 || loading"
              @click="handleDeleteSelected"
            >
              <i class="fa-solid fa-trash-can"></i>
              Hapus ({{ selectedIds.length }})
            </button>
            <button class="btn btn-text" @click="exitSelectionMode">Batal</button>
          </template>
        </template>

        <button
          v-if="hasUnread && !isSelectionMode"
          class="btn btn-ghost"
          :disabled="loading"
          @click="handleMarkAllAsRead"
        >
          <i class="fa-solid fa-check-double"></i>
          Tandai semua dibaca
        </button>
      </div>
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        @click="changeTab(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
      </button>
    </div>

    <div class="notif-list-container">
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
            :class="{ unread: !item.read, selected: selectedIds.includes(item.id) }"
            @click="handleItemClick(item)"
          >
            <div v-if="isSelectionMode" class="card-checkbox" @click.stop>
              <input
                type="checkbox"
                :value="item.id"
                v-model="selectedIds"
              />
            </div>

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

            <div v-if="!isSelectionMode" class="card-actions">
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

// --- State ---
const activeTab = ref<TabValue>('all')
const isSelectionMode = ref(false)
const selectedIds = ref<string[]>([])

// --- Computed ---
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

const isAllSelected = computed(() => {
  return filteredItems.value.length > 0 && selectedIds.value.length === filteredItems.value.length
})

const groupedItems = computed(() => {
  const groups: Record<string, Notifications[]> = {}
  for (const item of filteredItems.value) {
    const label = getDateGroupLabel(item.createdAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  }
  return groups
})

// --- Logic Functions ---
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

// --- Actions ---
function exitSelectionMode() {
  isSelectionMode.value = false
  selectedIds.value = []
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredItems.value.map(item => item.id)
  }
}

function changeTab(tab: TabValue) {
  activeTab.value = tab
  exitSelectionMode()
}

async function handleItemClick(item: Notifications) {
  if (isSelectionMode.value) {
    const index = selectedIds.value.indexOf(item.id)
    if (index > -1) {
      selectedIds.value.splice(index, 1)
    } else {
      selectedIds.value.push(item.id)
    }
    return
  }

  if (!item.read) {
    await notificationStore.markAsRead(item.id)
  }
  if (item.actionUrl) {
    router.push(item.actionUrl)
  }
}

async function handleMarkAllAsRead() {
  await notificationStore.markAllAsRead()
}

async function handleDeleteSelected() {
  if (selectedIds.value.length === 0) return
  if (confirm(`Hapus ${selectedIds.value.length} notifikasi terpilih?`)) {
    await notificationStore.deleteNotification({ notificationIds: selectedIds.value })
    exitSelectionMode()
  }
}

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

onMounted(async () => {
  await notificationStore.getMyNotification()
})
</script>

<style scoped>
/* --- Page layout --- */
.notif-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

/* --- Header --- */
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

.page-header-actions { display: flex; gap: 8px; align-items: center; }

/* --- Buttons --- */
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
  white-space: nowrap;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-dark);
}
.btn-ghost:hover:not(:disabled) { background: var(--bg-light); }

.btn-danger {
  background: #FEF2F2;
  color: #EF4444;
  border: 1px solid #FCA5A5;
}
.btn-danger:hover:not(:disabled) { background: #FEE2E2; }

.btn-text {
  background: transparent;
  color: var(--text-grey);
}

/* --- Filter tabs --- */
.filter-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
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

/* --- Group label --- */
.notif-group { margin-bottom: 24px; }
.group-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-grey);
  margin: 16px 0 8px 4px;
  padding: 0 4px;
}

/* --- Notification card --- */
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
  transition: all 0.15s ease;
  position: relative;
}
.notif-card:hover {
  background: #F9FAFB;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.notif-card.unread {
  background: var(--success-bg, #ECFDF5);
  border-color: #A7F3D0;
}
.notif-card.selected {
  border-color: var(--primary, #6366F1);
  background: #F5F7FF;
}

/* --- Checkbox --- */
.card-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 10px;
}
.card-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary, #6366F1);
}

/* --- Card icon --- */
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

/* --- Card body --- */
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
  font-size: 11px;
  color: var(--text-grey);
  white-space: nowrap;
  font-weight: 500;
  margin-top: 2px;
}
.card-message {
  margin: 0;
  font-size: 13px;
  color: var(--text-grey);
  line-height: 1.5;
}

.unread-badge {
  background: var(--primary, #6366F1);
  color: #fff;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}

/* --- Skeleton & Shimmer --- */
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

/* --- Empty state --- */
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

@media (max-width: 600px) {
  .page-header-actions { width: 100%; overflow-x: auto; padding-bottom: 4px; }
  .page-title { font-size: 18px; }
}
</style>
