<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/accounts/account.store'
import { useAuthStore } from '@/stores/accounts/auth.store'
import type { Users } from '@/interfaces/accounts/account.interface'

const route = useRoute()
const router = useRouter()

const accountStore = useAccountStore()
const authStore = useAuthStore()

const { loading, error } = storeToRefs(accountStore)
const { user: authUser } = storeToRefs(authStore)

const account = ref<Users | null>(null)
const showOptionsMenu = ref(false)
const showDeleteModal = ref(false)
const optionsRef = ref<HTMLElement | null>(null)

const accountId = computed(() => String(route.params.id ?? ''))

const displayId = computed(() => {
  if (!account.value) return accountId.value || '-'
  return account.value.id || accountId.value || '-'
})

const displayEmail = computed(() => {
  if (!account.value) return '-'
  return account.value.email || '-'
})

const displayRole = computed(() => {
  if (!account.value) return '-'
  return account.value.role || '-'
})

const displayName = computed(() => {
  if (!account.value) return '-'
  return account.value.fullName || '-'
})

const formattedBirthDate = computed(() => {
  if (!account.value?.birthdate) return '-'

  const date = new Date(account.value.birthdate)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

const isTeacher = computed(() => account.value?.role === 'TEACHER')

const isAuthenticatedAdmin = computed(() => authUser.value?.role === 'ADMIN')

const displayEmploymentType = computed(() => {
  if (!isTeacher.value || !account.value?.teacher?.employmentType) return '-'

  const employmentType = account.value.teacher.employmentType

  if (employmentType === 'FULL_TIME') return 'FULL TIME'
  if (employmentType === 'PART_TIME') return 'PART TIME'

  return employmentType.replace(/_/g, ' ')
})

const displayMaxWeeklyHours = computed(() => {
  if (!isTeacher.value || !account.value?.teacher) return '-'
  return account.value.teacher.maxWeeklyHours ?? '-'
})

const displaySchoolLevel = computed(() => {
  if (!isTeacher.value || !account.value?.teacher) return '-'
  return account.value.teacher.schoolLevel || '-'
})

const displayRemainingLeaveQuota = computed(() => {
  if (!isTeacher.value || !account.value?.teacher) return '-'
  return account.value.teacher.remainingLeaveQuota || '-'
})

const displaySubjects = computed(() => {
  if (!isTeacher.value || !account.value?.teacher?.subjects?.length) return '-'
  return account.value.teacher.subjects.join(', ')
})

async function loadProfile() {
  if (!accountId.value) return
  account.value = await accountStore.getProfileById(accountId.value)
}

function toggleOptionsMenu() {
  showOptionsMenu.value = !showOptionsMenu.value
}

function closeOptionsMenu() {
  showOptionsMenu.value = false
}

function goToEdit() {
  closeOptionsMenu()
  router.push(`/account/edit/${accountId.value}`)
}

function openDeleteModal() {
  closeOptionsMenu()
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
}

async function confirmDelete() {
  if (!accountId.value) return

  await accountStore.deleteProfile(accountId.value)

  if (!accountStore.error) {
    closeDeleteModal()
    router.push('/accounts')
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (optionsRef.value && !optionsRef.value.contains(target)) {
    closeOptionsMenu()
  }
}

function goBack() {
  router.push('/home')
}

onMounted(() => {
  loadProfile()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <main class="detail-account-page">
    <div class="detail-account-container">
      <button class="back-button" type="button" @click="goBack">
        <i class="fa-solid fa-arrow-left"></i>
        Kembali
      </button>
      <div class="detail-account-header">
        <div>
          <h1 class="detail-account-title">Detail Akun</h1>
          <p class="detail-account-subtitle">ID : {{ displayId }}</p>
        </div>

        <div ref="optionsRef" class="detail-account-actions">
          <button class="options-button" @click.stop="toggleOptionsMenu">
            <i class="fa-solid fa-ellipsis"></i>
            Lainnya
          </button>

          <div v-if="showOptionsMenu" class="options-menu">
            <button class="option-item" @click="goToEdit">
              <i class="fa-solid fa-pen"></i>
              Edit Akun
            </button>

            <button v-if="isAuthenticatedAdmin" class="option-item danger" @click="openDeleteModal">
              <i class="fa-regular fa-trash-can"></i>
              Hapus Akun
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="state-card">
        <p>Memuat detail akun...</p>
      </div>

      <div v-else-if="error" class="state-card error">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="account" class="info-card">
        <section>
          <h2 class="section-title">Informasi Akun</h2>

          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-separator">:</span>
              <span class="info-value">{{ displayEmail }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Password</span>
              <span class="info-separator">:</span>
              <span class="info-value password">**********</span>
            </div>

            <div class="info-row">
              <span class="info-label">Role</span>
              <span class="info-separator">:</span>
              <span class="info-value">{{ displayRole }}</span>
            </div>
          </div>
        </section>

        <div class="section-divider"></div>

        <section>
          <h2 class="section-title">Informasi Pribadi</h2>

          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Nama</span>
              <span class="info-separator">:</span>
              <span class="info-value">{{ displayName }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Tanggal Lahir</span>
              <span class="info-separator">:</span>
              <span class="info-value">{{ formattedBirthDate }}</span>
            </div>

            <template v-if="isTeacher">
              <div class="info-row">
                <span class="info-label">Tipe Kepegawaian</span>
                <span class="info-separator">:</span>
                <span class="info-value">{{ displayEmploymentType }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Maks. Jam / Minggu</span>
                <span class="info-separator">:</span>
                <span class="info-value">{{ displayMaxWeeklyHours }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Jenjang Sekolah</span>
                <span class="info-separator">:</span>
                <span class="info-value">{{ displaySchoolLevel }}</span>
              </div>

              <div class="info-row">
                <span class="info-label">Mata Pelajaran</span>
                <span class="info-separator">:</span>
                <span class="info-value">{{ displaySubjects }}</span>
              </div>
            </template>
          </div>
        </section>
      </div>

      <div v-else class="state-card">
        <p>Data akun tidak ditemukan.</p>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card">
        <h3 class="modal-title">Konfirmasi Hapus</h3>
        <p class="modal-description">
          Apakah Anda yakin ingin menghapus akun
          <strong>{{ displayName }}</strong
          >? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="modal-actions">
          <button class="modal-button cancel" @click="closeDeleteModal">Batal</button>
          <button class="modal-button delete" @click="confirmDelete">Hapus</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 15px;
  cursor: pointer;
  transition: 0.2s ease;
}

.back-button:hover {
  color: #334155;
}

.detail-account-page {
  min-height: 100vh;
  background: #f7faf7;
  color: #475569;
}

.detail-account-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 56px;
}

.detail-account-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.detail-account-title {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.1;
  color: #0f172a;
}

.detail-account-subtitle {
  margin-top: 8px;
  font-size: 16px;
  color: #64748b;
}

.detail-account-actions {
  position: relative;
}

.options-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #ffffff;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.options-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.options-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 190px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  z-index: 20;
}

.option-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: 0.2s ease;
}

.option-item:hover {
  background: #f8fafc;
}

.option-item.danger {
  color: #dc2626;
}

.option-item.danger:hover {
  background: #fef2f2;
}

.info-card,
.state-card {
  padding: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.04);
}

.state-card.error {
  color: #dc2626;
}

.section-title {
  margin-bottom: 22px;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.info-grid {
  display: grid;
  gap: 18px;
}

.info-row {
  display: grid;
  grid-template-columns: 170px 20px 1fr;
  gap: 10px;
  align-items: start;
}

.info-label {
  font-size: 15px;
  font-weight: 600;
  color: #475569;
}

.info-separator {
  color: #94a3b8;
}

.info-value {
  font-size: 15px;
  color: #0f172a;
}

.info-value.password {
  letter-spacing: 3px;
}

.section-divider {
  height: 1px;
  margin: 32px 0;
  background: #e2e8f0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.35);
}

.modal-card {
  width: 100%;
  max-width: 480px;
  border-radius: 24px;
  background: #ffffff;
  padding: 28px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
}

.modal-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.modal-description {
  margin-top: 12px;
  font-size: 15px;
  line-height: 1.7;
  color: #64748b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.modal-button {
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.modal-button.cancel {
  background: #f1f5f9;
  color: #334155;
}

.modal-button.delete {
  background: #dc2626;
  color: #ffffff;
}

.modal-button:hover {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .detail-account-container {
    padding: 24px 16px 40px;
  }

  .detail-account-title {
    font-size: 28px;
  }

  .info-card,
  .state-card {
    padding: 24px 20px;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .info-separator {
    display: none;
  }

  .info-label {
    font-size: 13px;
    color: #64748b;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-button {
    width: 100%;
  }
}
</style>
