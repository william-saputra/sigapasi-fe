<template>
  <div class="user-profile">
    <div class="avatar">
      <i class="fa-solid fa-user"></i>
    </div>

    <div class="info">
      <span class="name">{{ displayName }}</span>
      <span class="role">{{ displayRole }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/accounts/auth.store'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const displayName = computed(() => user.value?.fullName || 'Guest User')

const displayRole = computed(() => {
  switch (user.value?.role) {
    case 'ADMIN':
      return 'Admin'
    case 'STAFF':
      return 'Staf'
    case 'TEACHER':
      return 'Guru'
    case 'HEAD':
      return 'Kepala Sekolah'
    default:
      return '-'
  }
})
</script>

<style scoped>
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #E8F5E9;
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
}

.name {
  font-size: 14px;
  font-weight: 600;
  display: block;
}

.role {
  font-size: 12px;
  color: var(--text-grey);
}
</style>