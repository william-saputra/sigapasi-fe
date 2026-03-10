<template>
  <div class="user-profile-wrapper" ref="profileRef">
    <button class="user-profile" type="button" @click="toggleDropdown">
      <div class="avatar">
        <i class="fa-solid fa-user"></i>
      </div>

      <div class="info">
        <span class="name">{{ displayName }}</span>
        <span class="role">{{ displayRole }}</span>
      </div>
    </button>

    <div class="dropdown-menu" :class="{ show: isOpen }">
      <button class="dropdown-item" type="button" @click="goToDetailAkun">
        <i class="fa-regular fa-user"></i>
        <span>Detail Akun</span>
      </button>

      <button class="dropdown-item logout" type="button" @click="handleLogout">
        <i class="fa-solid fa-right-from-bracket"></i>
        <span>Logout</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/accounts/auth.store";

const router = useRouter();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const isOpen = ref(false);
const profileRef = ref<HTMLElement | null>(null);

const displayName = computed(() => user.value?.fullName || "Guest User");

const displayRole = computed(() => {
  switch (user.value?.role) {
    case "ADMIN":
      return "Admin";
    case "STAFF":
      return "Staf";
    case "TEACHER":
      return "Guru";
    case "HEAD":
      return "Kepala Sekolah";
    default:
      return "-";
  }
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function closeDropdown() {
  isOpen.value = false;
}

function goToDetailAkun() {
  closeDropdown()

  const userId = user.value?.id
  if (!userId) return

  router.push(`/account/${userId}`)
}

async function handleLogout() {
  closeDropdown();
  await authStore.logout();
  router.push("/login");
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (profileRef.value && !profileRef.value.contains(target)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.user-profile-wrapper {
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #e8f5e9;
  color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar i {
  font-size: 16px;
}

.info {
  line-height: 1.2;
  text-align: left;
}

.name {
  font-size: 14px;
  font-weight: 600;
  display: block;
  color: #1f2937;
}

.role {
  font-size: 12px;
  color: var(--text-grey);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 200px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  padding: 8px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px);
  transition: all 0.2s ease;
  z-index: 1100;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  width: 100%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #334155;
  text-align: left;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.dropdown-item.logout {
  color: #dc2626;
}
</style>