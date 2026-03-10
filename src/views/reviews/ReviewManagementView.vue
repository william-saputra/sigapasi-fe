<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/common/AppLayout.vue'
import PageHeader from '@/components/header/PageHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import DataTable from '@/components/table/DataTable.vue'
import apiService from '@/services/api.service'
import { useToast } from 'vue-toastification'

const toast = useToast()
const router = useRouter()

// ─── Types ──────────────────────────────────────────────────────────────────

type SemesterOptionDTO = {
  id: string
  displayName: string
  hasReviewPeriod: boolean
}

type ReviewPeriodRow = {
  id: string
  semesterId: string
  semesterName: string
  startDate: string
  endDate: string
  isActive: boolean
  completedAssignments: number
  totalAssignments: number
  createdAt: string
  updatedAt: string
}

// ─── Table Data (from GET /api/reviews/periods) ───────────────────────────────

const rows = ref<ReviewPeriodRow[]>([])
const isLoading = ref(false)
const fetchError = ref<string | null>(null)

async function fetchPeriods() {
  isLoading.value = true
  fetchError.value = null
  try {
    const data = await apiService.get<ReviewPeriodRow[]>('/reviews/periods')
    rows.value = data
  } catch {
    fetchError.value = 'Gagal memuat data. Pastikan server berjalan dan Anda sudah login.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchPeriods)

// ─── Table Columns ────────────────────────────────────────────────────────────

const columns = [
  { key: 'semesterName', label: 'Nama Periode', thStyle: 'width: 35%;' },
  { key: 'status', label: 'Status', thStyle: 'width: 15%;' },
  { key: 'progress', label: 'Progress Pengisian', thStyle: 'width: 30%;' },
  { key: 'aksi', label: 'Aksi', thStyle: 'width: 20%;' },
]

// ─── Search ───────────────────────────────────────────────────────────────────

const searchQuery = ref('')

const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) return rows.value
  return rows.value.filter((r) =>
    r.semesterName.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// ─── Modal State ──────────────────────────────────────────────────────────────

const showModal = ref(false)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

// ─── Semester Options (for dropdown) ─────────────────────────────────────────

const semesterOptions = ref<SemesterOptionDTO[]>([])
const isFetchingOptions = ref(false)

async function fetchSemesterOptions() {
  isFetchingOptions.value = true
  try {
    semesterOptions.value = await apiService.get<SemesterOptionDTO[]>(
      '/reviews/periods/semester-options',
    )
  } catch {
    semesterOptions.value = []
  } finally {
    isFetchingOptions.value = false
  }
}

// semesterId accepts a UUID string — entered manually since no /api/semesters endpoint exists yet
const form = reactive({
  semesterId: '',
  startDate: '',
  endDate: '',
})

const errors = reactive({
  semesterId: false,
  startDate: false,
  endDate: false,
  dateRange: false,
})

function openModal() {
  showModal.value = true
  fetchSemesterOptions()
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  form.semesterId = ''
  form.startDate = ''
  form.endDate = ''
  submitError.value = null
  ;(Object.keys(errors) as (keyof typeof errors)[]).forEach((k) => (errors[k] = false))
}

// ─── Validation & Submit ──────────────────────────────────────────────────────

function validateModal(): boolean {
  ;(Object.keys(errors) as (keyof typeof errors)[]).forEach((k) => (errors[k] = false))
  let hasError = false

  if (!form.semesterId.trim()) {
    errors.semesterId = true
    hasError = true
  }
  if (!form.startDate) {
    errors.startDate = true
    hasError = true
  }
  if (!form.endDate) {
    errors.endDate = true
    hasError = true
  }
  if (form.startDate && form.endDate && form.endDate <= form.startDate) {
    errors.dateRange = true
    hasError = true
  }

  return !hasError
}

async function submitModal() {
  if (!validateModal()) return

  isSubmitting.value = true
  submitError.value = null

  try {
    // POST /api/reviews/periods — CreateReviewPeriodDTO: { semesterId (UUID), startDate, endDate }
    const created = await apiService.post<ReviewPeriodRow>('/reviews/periods', {
      semesterId: form.semesterId,
      startDate: form.startDate,
      endDate: form.endDate,
    })
    rows.value.unshift(created)
    closeModal()
    toast.success('Periode review berhasil dibuat!')
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      submitError.value = 'Semester tidak ditemukan. Pastikan UUID semester benar.'
    } else if (status === 409) {
      submitError.value = 'Periode review untuk semester ini sudah ada.'
    } else {
      submitError.value = 'Gagal menyimpan periode. Silakan coba lagi.'
    }
  } finally {
    isSubmitting.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProgressPercent(row: ReviewPeriodRow): number {
  if (row.totalAssignments === 0) return 0
  return Math.round((row.completedAssignments / row.totalAssignments) * 100)
}
</script>

<template>
  <AppLayout>
    <PageHeader title="Manajemen 360 Review" subtitle="Kelola periode evaluasi dan pantau guru.">
      <template #actions>
        <div class="mode-badge">⚙️ Mode: Staff/Admin</div>
      </template>
    </PageHeader>

    <AppCard>
      <div class="section-header">
        <h3 class="section-title">Daftar Periode Evaluasi</h3>
        <div class="section-actions">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Cari Periode..."
          />
          <AppButton @click="openModal">+ Periode Baru</AppButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="table-state">
        <span class="state-icon">⏳</span> Memuat data periode...
      </div>

      <!-- Error State -->
      <div v-else-if="fetchError" class="table-state table-state--error">
        <span class="state-icon">⚠️</span> {{ fetchError }}
        <button class="btn-retry" @click="fetchPeriods">Coba Lagi</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredRows.length === 0" class="table-state">
        <span class="state-icon">📭</span>
        {{ searchQuery ? 'Tidak ada periode yang cocok.' : 'Belum ada periode evaluasi.' }}
      </div>

      <DataTable v-else :columns="columns" :rows="filteredRows">
        <!-- Nama Periode -->
        <template #cell:semesterName="{ row }">
          <div class="period-name">
            <span class="period-icon">📅</span>
            <span style="font-weight: 600">{{ row.semesterName }}</span>
          </div>
        </template>

        <!-- Status -->
        <template #cell:status="{ row }">
          <span :class="['status-badge', row.isActive ? 'status-aktif' : 'status-selesai']">
            {{ row.isActive ? 'Aktif' : 'Selesai' }}
          </span>
        </template>

        <!-- Progress -->
        <template #cell:progress="{ row }">
          {{ row.completedAssignments }} / {{ row.totalAssignments }} Evaluasi
          <span class="progress-percent">({{ getProgressPercent(row) }}%)</span>
        </template>

        <!-- Aksi -->
        <template #cell:aksi="{ row }">
          <button
            class="btn-outline"
            @click="router.push({ name: 'reviews-period-detail', params: { periodId: row.id } })"
          >
            📂 Buka Periode
          </button>
        </template>
      </DataTable>
    </AppCard>
  </AppLayout>

  <!-- Add Period Modal -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Tambah Periode Evaluasi</h3>
          <button class="modal-close" type="button" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitModal">
            <!-- Semester Dropdown -->
            <div class="form-group">
              <label class="form-label">Semester <span class="required-star">*</span></label>
              <select
                v-model="form.semesterId"
                class="form-control"
                :class="{ 'is-invalid': errors.semesterId }"
                :disabled="isFetchingOptions"
              >
                <option value="" disabled>
                  {{ isFetchingOptions ? 'Memuat semester...' : '— Pilih Semester —' }}
                </option>
                <option
                  v-for="opt in semesterOptions"
                  :key="opt.id"
                  :value="opt.id"
                  :disabled="opt.hasReviewPeriod"
                >
                  {{ opt.displayName }}{{ opt.hasReviewPeriod ? ' (sudah ada periode)' : '' }}
                </option>
              </select>
              <div v-if="errors.semesterId" class="error-message show">
                Pilih semester terlebih dahulu.
              </div>
            </div>

            <!-- Date Range -->
            <div class="row">
              <div class="col">
                <div class="form-group">
                  <label class="form-label">
                    Tanggal Mulai <span class="required-star">*</span>
                  </label>
                  <input
                    v-model="form.startDate"
                    type="date"
                    class="form-control"
                    :class="{ 'is-invalid': errors.startDate || errors.dateRange }"
                  />
                </div>
              </div>
              <div class="col">
                <div class="form-group">
                  <label class="form-label">
                    Tanggal Selesai <span class="required-star">*</span>
                  </label>
                  <input
                    v-model="form.endDate"
                    type="date"
                    class="form-control"
                    :class="{ 'is-invalid': errors.endDate || errors.dateRange }"
                  />
                </div>
              </div>
            </div>
            <div
              v-if="errors.dateRange"
              class="error-message show"
              style="margin-top: -12px; margin-bottom: 16px"
            >
              Tanggal selesai tidak boleh lebih awal dari tanggal mulai.
            </div>

            <!-- Submit Error -->
            <div v-if="submitError" class="submit-error">⚠️ {{ submitError }}</div>

            <!-- Footer Actions -->
            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                :disabled="isSubmitting"
                @click="closeModal"
              >
                Batal
              </button>
              <button type="submit" class="btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Menyimpan...' : 'Simpan Periode' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Mode Badge ─────────────────────────────────────────── */
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

/* ── Table States (loading / error / empty) ─────────────── */
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
  color: var(--primary);
  background: var(--white);
  border: 1px solid var(--primary);
  border-radius: var(--radius);
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.btn-retry:hover {
  background: var(--success-bg);
}

/* ── Card Section Header ────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  padding: 9px 14px;
  font-family: var(--font);
  font-size: 14px;
  color: var(--text-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--white);
  width: 200px;
  transition: all 0.2s;
}

.search-input::placeholder {
  color: var(--text-grey);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.1);
}

/* ── Table Cell Styles ──────────────────────────────────── */
.period-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.period-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}

.status-aktif {
  background: var(--success-bg);
  color: var(--success-text);
}

.status-selesai {
  background: #f3f4f6;
  color: #4b5563;
}

.progress-percent {
  color: var(--primary);
  font-weight: 600;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--white);
  color: var(--text-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font);
  transition: 0.2s;
  white-space: nowrap;
}

.btn-outline:hover {
  background: var(--bg-light);
  border-color: var(--primary);
  color: var(--primary);
}

/* ── Modal ──────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal {
  background: var(--white);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark);
}

.modal-close {
  background: none;
  border: none;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: var(--text-grey);
  padding: 0 4px;
  transition: color 0.2s;
}

.modal-close:hover {
  color: var(--text-dark);
}

.modal-body {
  padding: 24px;
}

/* ── Form (mirrors LeaveRequestView conventions) ────────── */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-dark);
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  font-family: var(--font);
  font-size: 14px;
  color: var(--text-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-sizing: border-box;
  background: var(--white);
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.1);
}

select.form-control {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236B7280' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
  cursor: pointer;
}

select.form-control:disabled {
  background-color: var(--bg-light);
  color: var(--text-grey);
  cursor: not-allowed;
}

select.form-control option:disabled {
  color: var(--text-grey);
}

.form-control.is-invalid {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.error-message {
  color: #dc2626;
  font-size: 13px;
  margin-top: 6px;
  display: none;
}

.error-message.show {
  display: block;
}

.required-star {
  color: #dc2626;
}

.note {
  font-size: 12px;
  color: var(--text-grey);
  margin-top: 6px;
}

.submit-error {
  background: var(--danger-bg);
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 10px 14px;
  border-radius: var(--radius);
  font-size: 13px;
  margin-bottom: 12px;
}

.row {
  display: flex;
  gap: 16px;
}

.col {
  flex: 1;
}

/* ── Modal Footer Buttons ───────────────────────────────── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background: var(--primary);
  color: var(--white);
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: var(--font);
  transition: 0.2s;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background: var(--white);
  color: var(--text-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: var(--font);
  transition: 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-light);
}
</style>
