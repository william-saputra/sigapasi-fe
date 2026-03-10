<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/common/AppLayout.vue'
import PageHeader from '@/components/header/PageHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import apiService from '@/services/api.service'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const periodId = route.params.periodId as string

// ─── Types ────────────────────────────────────────────────────────────────────

type RevieweeStatusDTO = {
  teacherId: string
  fullName: string
  email: string
  employmentType: string | null
  status: 'DRAFT' | 'ASSIGNED' | 'COMPLETED'
}

type TeacherCandidateDTO = {
  id: string
  fullName: string
  email: string
  role: string
}

type PeriodInfo = {
  id: string
  semesterName: string
  startDate: string
  endDate: string
  isActive: boolean
}

// ─── Period Info ──────────────────────────────────────────────────────────────

const periodInfo = ref<PeriodInfo | null>(null)

async function fetchPeriodInfo() {
  try {
    const periods = await apiService.get<PeriodInfo[]>('/reviews/periods')
    const found = periods.find((p) => p.id === periodId)
    if (found) periodInfo.value = found
  } catch {
    // silently fall through; page still works without period name
  }
}

// ─── Teacher List ─────────────────────────────────────────────────────────────

const teachers = ref<RevieweeStatusDTO[]>([])
const isLoading = ref(false)
const fetchError = ref<string | null>(null)

async function fetchTeachers() {
  isLoading.value = true
  fetchError.value = null
  try {
    teachers.value = await apiService.get<RevieweeStatusDTO[]>(
      `/reviews/periods/${periodId}/teachers`,
    )
  } catch {
    fetchError.value = 'Gagal memuat daftar guru. Pastikan server berjalan.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchPeriodInfo(), fetchTeachers()])
})

// ─── Table ────────────────────────────────────────────────────────────────────

const columns = [
  { key: 'namaGuru', label: 'Nama Guru', thStyle: 'width: 30%;' },
  { key: 'jabatan', label: 'Jabatan', thStyle: 'width: 18%;' },
  { key: 'status', label: 'Status', thStyle: 'width: 18%;' },
  { key: 'aksi', label: 'Aksi', thStyle: 'width: 34%;' },
]

const searchQuery = ref('')

const filteredTeachers = computed(() => {
  if (!searchQuery.value.trim()) return teachers.value
  return teachers.value.filter((t) =>
    t.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

function getStatusVariant(status: string): 'pending' | 'success' | 'danger' {
  if (status === 'COMPLETED') return 'success'
  if (status === 'ASSIGNED') return 'pending'
  return 'danger'
}

function getStatusLabel(status: string): string {
  if (status === 'COMPLETED') return 'Selesai'
  if (status === 'ASSIGNED') return 'Penilai Diatur'
  return 'Draft'
}

// ─── Add Teacher Modal ────────────────────────────────────────────────────────

const showAddModal = ref(false)
const candidateSearch = ref('')
const candidates = ref<TeacherCandidateDTO[]>([])
const isFetchingCandidates = ref(false)
const selectedIds = ref<string[]>([])
const isSubmittingAdd = ref(false)

async function openAddModal() {
  showAddModal.value = true
  candidateSearch.value = ''
  selectedIds.value = []
  isFetchingCandidates.value = true
  try {
    candidates.value = await apiService.get<TeacherCandidateDTO[]>(
      `/teachers/candidates?period_id=${periodId}`,
    )
  } catch {
    candidates.value = []
    toast.error('Gagal memuat daftar kandidat guru.')
  } finally {
    isFetchingCandidates.value = false
  }
}

function closeAddModal() {
  showAddModal.value = false
}

const filteredCandidates = computed(() => {
  if (!candidateSearch.value.trim()) return candidates.value
  return candidates.value.filter((c) =>
    c.fullName.toLowerCase().includes(candidateSearch.value.toLowerCase()),
  )
})

function isSelected(id: string): boolean {
  return selectedIds.value.includes(id)
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

async function submitAddTeachers() {
  if (selectedIds.value.length === 0) return

  isSubmittingAdd.value = true
  let successCount = 0
  let failCount = 0

  for (const teacherId of selectedIds.value) {
    try {
      await apiService.post(`/reviews/periods/${periodId}/teachers`, { teacherId })
      successCount++
    } catch {
      failCount++
    }
  }

  isSubmittingAdd.value = false
  closeAddModal()

  if (successCount > 0) {
    toast.success(
      successCount === 1
        ? '1 guru berhasil ditambahkan ke periode.'
        : `${successCount} guru berhasil ditambahkan ke periode.`,
    )
    await fetchTeachers()
  }
  if (failCount > 0) {
    toast.error(`${failCount} guru gagal ditambahkan.`)
  }
}

// ─── Delete Teacher ───────────────────────────────────────────────────────────────────

const showDeleteModal = ref(false)
const teacherToDelete = ref<RevieweeStatusDTO | null>(null)
const isDeletingTeacher = ref(false)

// ─── Reviewer Mapping ────────────────────────────────────────────────────────

type MappingState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; superiorName: string | null; peers: { id: string; fullName: string }[] }

const mappingCache = ref<Record<string, MappingState>>({})

async function fetchMapping(teacherId: string) {
  if (mappingCache.value[teacherId]) return
  mappingCache.value[teacherId] = { status: 'loading' }
  try {
    const data = await apiService.get<{
      superiorName: string | null
      peers: { id: string; fullName: string }[]
    }>(`/reviews/periods/${periodId}/teachers/${teacherId}/mapping`)
    mappingCache.value[teacherId] = {
      status: 'loaded',
      superiorName: data.superiorName,
      peers: data.peers,
    }
  } catch {
    mappingCache.value[teacherId] = { status: 'error' }
  }
}

function openDeleteConfirm(teacher: RevieweeStatusDTO) {
  teacherToDelete.value = teacher
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  teacherToDelete.value = null
}

async function confirmDeleteTeacher() {
  if (!teacherToDelete.value) return
  isDeletingTeacher.value = true
  try {
    await apiService.delete(
      `/reviews/periods/${periodId}/teachers/${teacherToDelete.value.teacherId}`,
    )
    toast.success(`${teacherToDelete.value.fullName} berhasil dihapus dari periode.`)
    closeDeleteModal()
    await fetchTeachers()
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 400) {
      toast.error('Guru tidak dapat dihapus karena sudah memiliki penugasan reviewer.')
    } else {
      toast.error('Gagal menghapus guru. Silakan coba lagi.')
    }
  } finally {
    isDeletingTeacher.value = false
  }
}
</script>

<template>
  <AppLayout>
    <!-- Back Navigation -->
    <div class="back-nav">
      <button class="btn-back" @click="router.push({ name: 'reviews-periods' })">
        ← Kembali ke Daftar Periode
      </button>
    </div>

    <PageHeader title="Manajemen 360 Review" subtitle="Kelola periode evaluasi dan pantau guru.">
      <template #actions>
        <div class="mode-badge">⚙️ Mode: Staff/Admin</div>
      </template>
    </PageHeader>

    <AppCard>
      <!-- Section Header -->
      <div class="section-header">
        <div>
          <h3 class="section-title">Daftar Guru &amp; Status Evaluasi</h3>
          <p class="section-subtitle">
            Periode:
            <strong>{{ periodInfo?.semesterName ?? '...' }}</strong>
          </p>
        </div>
        <div class="section-actions">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Cari Guru..."
          />
          <AppButton @click="openAddModal">+ Tambah Guru</AppButton>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="table-state">
        <span class="state-icon">⏳</span> Memuat daftar guru...
      </div>

      <!-- Error -->
      <div v-else-if="fetchError" class="table-state table-state--error">
        <span class="state-icon">⚠️</span> {{ fetchError }}
        <button class="btn-retry" @click="fetchTeachers">Coba Lagi</button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredTeachers.length === 0" class="table-state">
        <span class="state-icon">📭</span>
        {{
          searchQuery
            ? 'Tidak ada guru yang cocok.'
            : 'Belum ada guru yang ditambahkan ke periode ini.'
        }}
      </div>

      <DataTable
        v-else
        :columns="columns"
        :rows="filteredTeachers"
        expandable
        @expand="fetchMapping"
      >
        <!-- Nama Guru -->
        <template #cell:namaGuru="{ row }">
          <div>
            <div style="font-weight: 600">{{ row.fullName }}</div>
            <div class="meta-text">{{ row.email }}</div>
          </div>
        </template>

        <!-- Jabatan -->
        <template #cell:jabatan="{ row }">
          <span>{{ row.employmentType ?? '—' }}</span>
        </template>

        <!-- Status -->
        <template #cell:status="{ row }">
          <AppBadge :variant="getStatusVariant(row.status)">
            {{ getStatusLabel(row.status) }}
          </AppBadge>
        </template>

        <!-- Aksi -->
        <template #cell:aksi="{ row }">
          <div class="aksi-group">
            <button
              v-if="row.status === 'DRAFT'"
              class="btn-outline"
              @click="
                router.push({
                  name: 'reviews-assign',
                  params: { periodId, teacherId: row.teacherId },
                  query: {
                    teacherName: row.fullName,
                    semesterName: periodInfo?.semesterName ?? '',
                  },
                })
              "
            >
              ⚙️ Atur Penilai
            </button>
            <button v-else class="btn-outline">👁️ Lihat Hasil</button>
            <button
              v-if="row.status === 'DRAFT'"
              class="btn-outline btn-outline--danger"
              @click="openDeleteConfirm(row)"
            >
              🗑️ Hapus
            </button>
          </div>
        </template>

        <!-- Expanded Mapping Row -->
        <template #expanded="{ row }">
          <div class="mapping-panel">
            <div v-if="mappingCache[row.teacherId]?.status === 'loading'" class="mapping-loading">
              ⏳ Memuat mapping...
            </div>
            <div v-else-if="mappingCache[row.teacherId]?.status === 'error'" class="mapping-error">
              ⚠️ Gagal memuat mapping.
            </div>
            <template v-else-if="mappingCache[row.teacherId]?.status === 'loaded'">
              <div class="mapping-row">
                <span class="mapping-label">Superior (Atasan)</span>
                <span class="mapping-value">
                  {{
                    (
                      mappingCache[row.teacherId] as {
                        status: 'loaded'
                        superiorName: string | null
                        peers: any[]
                      }
                    ).superiorName ?? 'Mapping belum diatur'
                  }}
                </span>
              </div>
              <div class="mapping-row">
                <span class="mapping-label">Peer (Rekan Sejawat)</span>
                <span
                  v-if="
                    (
                      mappingCache[row.teacherId] as {
                        status: 'loaded'
                        superiorName: string | null
                        peers: { id: string; fullName: string }[]
                      }
                    ).peers.length === 0
                  "
                  class="mapping-value mapping-value--empty"
                >
                  Mapping belum diatur
                </span>
                <div v-else class="mapping-peers">
                  <span
                    v-for="peer in (
                      mappingCache[row.teacherId] as {
                        status: 'loaded'
                        superiorName: string | null
                        peers: { id: string; fullName: string }[]
                      }
                    ).peers"
                    :key="peer.id"
                    class="peer-chip"
                  >
                    {{ peer.fullName }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </template>
      </DataTable>
    </AppCard>
  </AppLayout>

  <!-- Add Teacher Modal -->
  <Teleport to="body">
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Tambah Guru ke Periode</h3>
          <button class="modal-close" type="button" @click="closeAddModal">×</button>
        </div>

        <div class="modal-body">
          <!-- Search -->
          <div class="form-group">
            <label class="form-label">Cari Guru</label>
            <div class="search-wrapper">
              <span class="search-icon">🔍</span>
              <input
                v-model="candidateSearch"
                type="text"
                class="form-control search-with-icon"
                placeholder="Ketik nama guru..."
              />
            </div>
          </div>

          <!-- Candidate List -->
          <div class="form-group">
            <label class="form-label">
              Hasil Pencarian
              <span v-if="selectedIds.length > 0" class="selected-count">
                ({{ selectedIds.length }} dipilih)
              </span>
            </label>

            <div v-if="isFetchingCandidates" class="candidate-state">
              <span>⏳ Memuat kandidat...</span>
            </div>

            <div v-else-if="filteredCandidates.length === 0" class="candidate-state">
              <span>{{
                candidateSearch ? 'Tidak ada hasil.' : 'Semua guru sudah ditambahkan.'
              }}</span>
            </div>

            <div v-else class="candidate-list">
              <label
                v-for="candidate in filteredCandidates"
                :key="candidate.id"
                class="candidate-item"
                :class="{ 'candidate-item--selected': isSelected(candidate.id) }"
              >
                <input
                  type="checkbox"
                  class="candidate-checkbox"
                  :checked="isSelected(candidate.id)"
                  @change="toggleSelect(candidate.id)"
                />
                <div class="candidate-info">
                  <span class="candidate-name">{{ candidate.fullName }}</span>
                  <span class="candidate-role">{{ candidate.role }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn-secondary"
              :disabled="isSubmittingAdd"
              @click="closeAddModal"
            >
              Batal
            </button>
            <button
              type="button"
              class="btn-primary"
              :disabled="isSubmittingAdd || selectedIds.length === 0"
              @click="submitAddTeachers"
            >
              {{ isSubmittingAdd ? 'Menambahkan...' : 'Tambahkan' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete Confirm Modal -->
  <Teleport to="body">
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal--sm">
        <div class="modal-header">
          <h3>Hapus Guru dari Periode?</h3>
          <button class="modal-close" type="button" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <p class="delete-confirm-text">
            Guru <strong>{{ teacherToDelete?.fullName }}</strong> akan dihapus dari periode ini.
            Tindakan ini tidak dapat dibatalkan, namun guru dapat ditambahkan kembali.
          </p>
          <div class="modal-footer">
            <button
              type="button"
              class="btn-secondary"
              :disabled="isDeletingTeacher"
              @click="closeDeleteModal"
            >
              Batal
            </button>
            <button
              type="button"
              class="btn-danger"
              :disabled="isDeletingTeacher"
              @click="confirmDeleteTeacher"
            >
              {{ isDeletingTeacher ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Back Navigation ─────────────────────────────────────────────────────── */
.back-nav {
  margin-bottom: 16px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dark);
  cursor: pointer;
  font-family: var(--font);
  transition:
    background 0.15s,
    border-color 0.15s;
}

.btn-back:hover {
  background: var(--bg-light);
  border-color: #c5cdd6;
}

/* ── Mode Badge ──────────────────────────────────────────────────────────── */
.mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #fffbeb;
  border: 1px solid #d97706;
  color: #92400e;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

/* ── Section Header ──────────────────────────────────────────────────────── */
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  gap: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 4px;
}

.section-subtitle {
  font-size: 13px;
  color: var(--text-grey);
  margin: 0;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-family: var(--font);
  color: var(--text-dark);
  background: white;
  outline: none;
  width: 200px;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: var(--primary);
}

/* ── Table States ────────────────────────────────────────────────────────── */
.table-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 40px 24px;
  font-size: 14px;
  color: var(--text-grey);
}

.table-state--error {
  color: var(--danger-text);
}

.state-icon {
  font-size: 20px;
}

.btn-retry {
  margin-left: 8px;
  padding: 5px 12px;
  font-size: 13px;
  font-family: var(--font);
  border: 1px solid var(--danger-text);
  border-radius: var(--radius);
  background: transparent;
  color: var(--danger-text);
  cursor: pointer;
}

/* ── Action Buttons (in table) ───────────────────────────────────────────── */
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-family: var(--font);
  color: var(--text-dark);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.btn-outline:hover {
  background: var(--bg-light);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-outline--danger:hover {
  background: var(--danger-bg);
  border-color: var(--danger-text);
  color: var(--danger-text);
}

.aksi-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 480px;
  max-width: 95vw;
  box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--text-grey);
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  font-family: var(--font);
}

.modal-close:hover {
  color: var(--text-dark);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.selected-count {
  color: var(--primary);
  font-weight: 600;
}

.form-control {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-family: var(--font);
  color: var(--text-dark);
  background: white;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.form-control:focus {
  border-color: var(--primary);
}

/* Search with icon */
.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  pointer-events: none;
}

.search-with-icon {
  padding-left: 32px;
}

/* Candidate list */
.candidate-state {
  padding: 16px 12px;
  font-size: 13px;
  color: var(--text-grey);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-align: center;
}

.candidate-list {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  max-height: 240px;
  overflow-y: auto;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid var(--border);
}

.candidate-item:last-child {
  border-bottom: none;
}

.candidate-item:hover {
  background: var(--bg-light);
}

.candidate-item--selected {
  background: #f0faf4;
}

.candidate-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
  cursor: pointer;
  flex-shrink: 0;
}

.candidate-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.candidate-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.candidate-role {
  font-size: 12px;
  color: var(--text-grey);
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  margin-top: 4px;
}

.btn-secondary {
  padding: 9px 18px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font);
  color: var(--text-dark);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-light);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  padding: 9px 20px;
  background: var(--primary);
  border: none;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font);
  color: white;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  padding: 9px 20px;
  background: var(--danger-text);
  border: none;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font);
  color: white;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal--sm {
  width: 400px;
}

.delete-confirm-text {
  font-size: 14px;
  color: var(--text-dark);
  line-height: 1.6;
  margin: 0 0 20px;
}

/* ── Mapping Panel ───────────────────────────────────────────────────────── */
.mapping-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 20px 0 52px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.mapping-loading,
.mapping-error {
  font-size: 13px;
  color: var(--text-grey);
  padding: 14px 0;
}

.mapping-error {
  color: var(--danger-text);
}

.mapping-row {
  display: flex;
  align-items: flex-start;
  gap: 0;
  font-size: 13px;
  padding: 11px 0;
  border-bottom: 1px solid #f0f0f0;
}

.mapping-row:last-child {
  border-bottom: none;
}

.mapping-label {
  min-width: 160px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-top: 2px;
}

.mapping-value {
  color: var(--text-dark);
  font-weight: 500;
}

.mapping-value--empty {
  color: #9ca3af;
  font-style: italic;
  font-weight: 400;
}

.mapping-peers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.peer-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
</style>
