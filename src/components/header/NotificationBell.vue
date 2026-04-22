<template>
  <div class="notification-wrapper" ref="wrapper">
    <div class="notification-bell" @click.stop="toggle">
      <i class="fa-solid fa-bell"></i>
      <div v-if="hasUnread" class="notification-dot" />
    </div>

    <div class="notif-dropdown" :class="{ show: open }">
      <div class="notif-header">
        <h3>Notifikasi</h3>
        <span
          v-if="hasUnread"
          class="mark-read-btn"
          @click.stop="handleMarkAllAsRead"
        >
          Tandai semua dibaca
        </span>
      </div>

      <div class="notif-body">
        <div v-if="loading && items.length === 0" class="notif-empty">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Memuat notifikasi...</span>
        </div>

        <div v-else-if="items.length === 0" class="notif-empty">
          <i class="fa-regular fa-bell-slash notif-empty-icon"></i>
          <span>Belum ada notifikasi</span>
        </div>

        <div
          v-else
          v-for="item in latestItems"
          :key="item.id"
          class="notif-item"
          :class="{ unread: !item.read }"
          @click.stop="handleNotificationClick(item)"
        >
          <div class="notif-icon-wrap" :class="getIconClass(item)">
            <i :class="getIcon(item)"></i>
          </div>

          <div class="notif-content">
            <p class="notif-title">
              <strong>{{ item.title }}</strong>
            </p>
            <p v-if="item.message" class="notif-message">{{ item.message }}</p>
            <div class="notif-time">
              <i class="fa-regular fa-clock"></i>
              {{ formatRelativeTime(item.createdAt) }}
            </div>
          </div>

          <div v-if="!item.read" class="unread-dot" />
        </div>
      </div>

      <div class="notif-footer">
        <router-link to="/notifications" class="view-all-link" @click="open = false">
          <span>Lihat semua notifikasi</span>
          <i class="fa-solid fa-arrow-right"></i>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/stores/notifications/notification.store'
import type { Notifications } from '@/interfaces/notifications/notification.interface'

const MAX_VISIBLE = 5

const wrapper = ref<HTMLElement | null>(null)
const open = ref(false)

const notificationStore = useNotificationStore()
const { notifications, loading } = storeToRefs(notificationStore)

const items = computed<Notifications[]>(() => notifications.value ?? [])
const latestItems = computed(() => items.value.slice(0, MAX_VISIBLE))
const hasUnread = computed(() => items.value.some((item) => !item.read))

type IconVariant = 'info' | 'success' | 'warning' | 'error' | 'default'

function resolveVariant(item: Notifications): IconVariant {
  const text = `${item.title ?? ''} ${item.message ?? ''}`.toLowerCase()

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
  return `notif-icon-${resolveVariant(item)}`
}

function toggle() {
  open.value = !open.value
}

async function handleMarkAllAsRead() {
  await notificationStore.markAllAsRead()
}

async function handleNotificationClick(item: Notifications) {
  if (!item.read) {
    await notificationStore.markAsRead(item.id)
  }
}

function onWindowClick(event: MouseEvent) {
  const target = event.target as Node | null
  if (wrapper.value && target && !wrapper.value.contains(target)) {
    open.value = false
  }
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

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
  window.addEventListener('click', onWindowClick)

  await notificationStore.getMyNotification()
  notificationStore.connectNotificationStream()
})

onBeforeUnmount(() => {
  window.removeEventListener('click', onWindowClick)
  notificationStore.disconnectNotificationStream()
})
</script>

<style scoped>
.notification-wrapper { position: relative; }

/* ── Bell button ── */
.notification-bell {
  position: relative;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-grey);
  padding: 8px;
  background: var(--white);
  border-radius: 50%;
  border: 1px solid var(--border);
  user-select: none;
  transition: background 0.15s;
}
.notification-bell:hover {
  background: var(--bg-light);
}

.notification-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  background: var(--danger-text);
  border-radius: 50%;
  border: 2px solid var(--white);
}

/* ── Dropdown ── */
.notif-dropdown {
  position: absolute;
  top: 120%;
  right: 0;
  width: 360px;
  background: var(--white);
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.12);
  display: none;
  z-index: 50;
  overflow: hidden;
  transform: translateY(10px);
  opacity: 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.notif-dropdown.show {
  display: block;
  transform: translateY(0);
  opacity: 1;
}

/* ── Header ── */
.notif-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}
.notif-header h3 {
  margin: 0;
  font-size: 15px;
  color: var(--text-dark);
}
.notif-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-dark);
}
.mark-read-btn {
  font-size: 12px;
  color: var(--primary);
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}
.mark-read-btn:hover {
  text-decoration: underline;
}

/* ── Body ── */
.notif-body {
  max-height: 360px;
  overflow-y: auto;
}

.notif-item {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 12px;
  align-items: flex-start;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #F3F4F6; }
.notif-item.unread { background: var(--success-bg, #ECFDF5); }
.notif-item.unread:hover { background: #D1FAE5; }

/* ── Icon variants ── */
.notif-icon-wrap {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}
.notif-icon-default  { background: #EEF2FF; color: var(--primary, #6366F1); }
.notif-icon-success  { background: #ECFDF5; color: #10B981; }
.notif-icon-error    { background: #FEF2F2; color: #EF4444; }
.notif-icon-warning  { background: #FFFBEB; color: #F59E0B; }
.notif-icon-info     { background: #EFF6FF; color: #3B82F6; }

/* ── Content ── */
.notif-content {
  flex: 1;
  min-width: 0;
}
.notif-title {
  margin: 0 0 2px;
  font-size: 13px;
  color: var(--text-dark);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notif-message {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--text-grey);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.notif-time {
  font-size: 11px;
  color: var(--text-grey);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Unread indicator ── */
.unread-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary, #6366F1);
  margin-top: 4px;
}

/* ── Empty state ── */
.notif-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-grey);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.notif-empty-icon {
  font-size: 28px;
  opacity: 0.35;
}

/* ── Footer ── */
.notif-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  background: #F9FAFB;
}
.view-all-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary, #6366F1);
  text-decoration: none;
  transition: opacity 0.15s;
}
.view-all-link:hover { opacity: 0.75; text-decoration: underline; }
</style>
