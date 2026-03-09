<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/accounts/account.store'
import type { Users } from '@/interfaces/accounts/account.interface'

const router = useRouter()
const accountStore = useAccountStore()
const { accounts, loading, error } = storeToRefs(accountStore)

const search = ref('')
const showDeleteModal = ref(false)
const selectedAccount = ref<Users | null>(null)

const sortKey = ref<'name' | 'email' | 'role' | ''>('')
const sortOrder = ref<'asc' | 'desc'>('asc')

function getAccountId(account: Users) {
  return (account as any).id || (account as any).accountId || ''
}

function getAccountName(account: Users) {
  return (account as any).name || (account as any).fullName || '-'
}

function getAccountEmail(account: Users) {
  return (account as any).email || '-'
}

function getAccountRole(account: Users) {
  return (account as any).roleName || (account as any).role || '-'
}

function getRoleClass(role: string) {
  switch (role) {
    case 'Admin':
      return 'role-admin'
    case 'Head':
      return 'role-head'
    case 'Teacher':
      return 'role-teacher'
    case 'Staff':
      return 'role-staff'
    default:
      return 'role-default'
  }
}

function setSort(key: 'name' | 'email' | 'role') {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

function getSortIcon(key: 'name' | 'email' | 'role') {
  if (sortKey.value !== key) return 'fa-solid fa-sort'
  return sortOrder.value === 'asc'
    ? 'fa-solid fa-sort-up'
    : 'fa-solid fa-sort-down'
}

const filteredAccounts = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  const result = accounts.value.filter((account) => {
    const name = getAccountName(account).toLowerCase()
    const email = getAccountEmail(account).toLowerCase()
    const role = getAccountRole(account).toLowerCase()

    if (!keyword) return true

    return (
      name.includes(keyword) ||
      email.includes(keyword) ||
      role.includes(keyword)
    )
  })

  if (!sortKey.value) return result

  return [...result].sort((a, b) => {
    let valueA = ''
    let valueB = ''

    if (sortKey.value === 'name') {
      valueA = getAccountName(a).toLowerCase()
      valueB = getAccountName(b).toLowerCase()
    }

    if (sortKey.value === 'email') {
      valueA = getAccountEmail(a).toLowerCase()
      valueB = getAccountEmail(b).toLowerCase()
    }

    if (sortKey.value === 'role') {
      valueA = getAccountRole(a).toLowerCase()
      valueB = getAccountRole(b).toLowerCase()
    }

    if (valueA < valueB) return sortOrder.value === 'asc' ? -1 : 1
    if (valueA > valueB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

function goToCreate() {
  router.push('/account/create')
}

function goToDetail(account: Users) {
  const id = getAccountId(account)
  if (!id) return
  router.push(`/account/${id}`)
}

function openDeleteModal(account: Users) {
  selectedAccount.value = account
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  selectedAccount.value = null
}

async function confirmDelete() {
  const id = selectedAccount.value ? getAccountId(selectedAccount.value) : ''
  if (!id) return

  await accountStore.deleteProfile(id)

  if (!accountStore.error) {
    closeDeleteModal()
  }
}

async function loadAccounts() {
  await accountStore.fetchAccounts()
  console.log('accounts:', accounts.value)
  console.log('error:', error.value)
}

onMounted(() => {
  loadAccounts()
})
</script>

<template>
  <main class="list-account-page">
    <div class="list-account-container">
      <h1 class="page-title">Daftar Akun</h1>

      <div class="controls">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            v-model="search"
            type="text"
            placeholder="Cari akun"
          />
        </div>

        <button class="add-button" @click="goToCreate">
          <i class="fa-solid fa-plus"></i>
          Tambahkan Akun
        </button>
      </div>

      <div v-if="loading" class="state-card">
        <p>Memuat daftar akun...</p>
      </div>

      <div v-else-if="error" class="state-card error">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="filteredAccounts.length === 0" class="state-card">
        <p>Tidak ada akun yang ditemukan.</p>
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click="setSort('name')">
                <span>Nama</span>
                <i :class="getSortIcon('name')"></i>
              </th>
              <th class="sortable" @click="setSort('email')">
                <span>Email</span>
                <i :class="getSortIcon('email')"></i>
              </th>
              <th class="sortable" @click="setSort('role')">
                <span>Role</span>
                <i :class="getSortIcon('role')"></i>
              </th>
              <th class="text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="account in filteredAccounts"
              :key="getAccountId(account)"
            >
              <td>{{ getAccountName(account) }}</td>
              <td>{{ getAccountEmail(account) }}</td>
              <td>
                <span
                  class="role-badge"
                  :class="getRoleClass(getAccountRole(account))"
                >
                  {{ getAccountRole(account) }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button
                    class="icon-button"
                    title="Lihat Detail"
                    @click="goToDetail(account)"
                  >
                    <i class="fa-regular fa-eye"></i>
                  </button>

                  <button
                    class="icon-button delete"
                    title="Hapus"
                    @click="openDeleteModal(account)"
                  >
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="closeDeleteModal"
    >
      <div class="modal-card">
        <h3 class="modal-title">Konfirmasi Hapus</h3>
        <p class="modal-description">
          Apakah Anda yakin ingin menghapus akun
          <strong>{{ selectedAccount ? getAccountName(selectedAccount) : '' }}</strong>?
          Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="modal-actions">
          <button class="modal-button cancel" @click="closeDeleteModal">
            Batal
          </button>
          <button class="modal-button delete" @click="confirmDelete">
            Hapus
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.list-account-page {
  min-height: 100vh;
  background: #f7faf7;
  color: #475569;
}

.list-account-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 56px;
}

.page-title {
  margin-bottom: 32px;
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 500px;
  max-width: 500px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 16px;
  transform: translateY(-50%);
  font-size: 16px;
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #ffffff;
  font-size: 15px;
  color: #334155;
  transition: 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #4a8f5f;
  box-shadow: 0 0 0 4px rgba(74, 143, 95, 0.12);
}

.add-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border: none;
  border-radius: 14px;
  background: #4a8f5f;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
  white-space: nowrap;
}

.add-button:hover {
  background: #2d5f3f;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(45, 95, 63, 0.18);
}

.table-wrapper,
.state-card {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.04);
}

.state-card {
  padding: 28px;
}

.state-card.error {
  color: #dc2626;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  padding: 16px 24px;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  background: #4a8f5f;
}

thead th.text-center {
  text-align: center;
}

thead th.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

thead th.sortable span {
  margin-right: 8px;
}

thead th.sortable i {
  font-size: 12px;
}

tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s ease;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:hover {
  background: #f8fafc;
}

tbody td {
  padding: 18px 24px;
  font-size: 15px;
  color: #334155;
  vertical-align: middle;
}

.role-badge {
  display: inline-block;
  min-width: 90px;
  padding: 6px 14px;
  border-radius: 999px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.role-admin {
  background: #1f6f43;
}

.role-head {
  background: #2d5f3f;
}

.role-teacher {
  background: #5a9b6a;
}

.role-staff {
  background: #7cb88a;
}

.role-default {
  background: #94a3b8;
}

.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.icon-button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: 0.2s ease;
}

.icon-button:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.icon-button.delete:hover {
  background: #fee2e2;
  color: #dc2626;
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
  .list-account-container {
    padding: 24px 16px 40px;
  }

  .page-title {
    font-size: 28px;
  }

  .controls {
    align-items: stretch;
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
    max-width: 100%;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    min-width: 720px;
  }

  thead th,
  tbody td {
    padding: 14px 16px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-button {
    width: 100%;
  }
}
</style>