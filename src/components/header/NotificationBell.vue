<template>
  <div class="notification-wrapper" ref="wrapper">
    <div class="notification-bell" @click.stop="toggle">
      🔔
      <div v-if="hasUnread" class="notification-dot" />
    </div>

    <div class="notif-dropdown" :class="{ show: open }">
      <div class="notif-header">
        <h3>Notifikasi ({{ items.length }})</h3>
        <span class="mark-read-btn" @click="markAllAsRead">Tandai dibaca</span>
      </div>

      <div class="notif-body">
        <div
          v-for="item in items"
          :key="item.id"
          class="notif-item"
          :class="{ unread: !item.read }"
          @click="markOneAsRead(item.id)"
        >
          <div class="notif-icon">{{ item.icon }}</div>
          <div class="notif-content">
            <p>
              <strong>{{ item.title }}:</strong> {{ item.message }}
            </p>
            <div class="notif-time">{{ item.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  modelValue: { type: Array, default: () => [] }, // list notif
});
const emit = defineEmits(["update:modelValue"]);

const open = ref(false);

const items = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const hasUnread = computed(() => items.value.some((x) => !x.read));

function toggle() {
  open.value = !open.value;
}

function markAllAsRead() {
  items.value = items.value.map((x) => ({ ...x, read: true }));
}

function markOneAsRead(id) {
  items.value = items.value.map((x) => (x.id === id ? { ...x, read: true } : x));
}

function onWindowClick(e) {
  // close if click outside
  if (!e.target.closest(".notification-wrapper")) open.value = false;
}

onMounted(() => window.addEventListener("click", onWindowClick));
onBeforeUnmount(() => window.removeEventListener("click", onWindowClick));
</script>

<style scoped>
.notification-wrapper { position: relative; }
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
}
.notification-bell:hover { background: var(--bg-light); }

.notification-dot {
  position: absolute;
  top: 4px; right: 4px;
  width: 10px; height: 10px;
  background: var(--danger-text);
  border-radius: 50%;
  border: 2px solid var(--white);
}

/* Dropdown */
.notif-dropdown {
  position: absolute;
  top: 120%;
  right: 0;
  width: 340px;
  background: var(--white);
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
  display: none;
  z-index: 50;
  overflow: hidden;
  transform: translateY(10px);
  opacity: 0;
  transition: all 0.2s ease-in-out;
}
.notif-dropdown.show {
  display: block;
  transform: translateY(0);
  opacity: 1;
}

.notif-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F9FAFB;
}
.notif-header h3 { margin: 0; font-size: 15px; color: var(--text-dark); }

.mark-read-btn {
  font-size: 12px;
  color: var(--primary);
  cursor: pointer;
  font-weight: 600;
}
.mark-read-btn:hover { text-decoration: underline; }

.notif-body { max-height: 350px; overflow-y: auto; }

.notif-item {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: #F3F4F6; }

.notif-item.unread { background: var(--success-bg); }
.notif-item.unread:hover { background: #D1FAE5; }

.notif-icon { font-size: 20px; }
.notif-content p { margin: 0; font-size: 13px; color: var(--text-dark); line-height: 1.5; }
.notif-time { font-size: 11px; color: var(--text-grey); margin-top: 6px; font-weight: 500; }
</style>
