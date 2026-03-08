<script setup lang="ts">
import { computed, reactive, ref } from "vue";

import AppLayout from "@/components/common/AppLayout.vue";
import PageHeader from "@/components/header/PageHeader.vue";
import AppButton from "@/components/common/AppButton.vue";
import AppCard from "@/components/common/AppCard.vue";
import DataTable from "@/components/table/DataTable.vue";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewPeriodRow = {
  id: string;
  semesterId: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  completedAssignments: number;
  totalAssignments: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Mock Semester Options (for CreateReviewPeriodDTO.semesterId) ─────────────

const availableSemesters = [
  { id: "sem-ganjil-2627", name: "Semester Ganjil 2026/2027" },
  { id: "sem-genap-2526", name: "Semester Genap 2025/2026" },
];

// ─── Mock Table Data (shape: ReviewPeriodResponseDTO) ────────────────────────

const rows = ref<ReviewPeriodRow[]>([
  {
    id: "rp-001",
    semesterId: "sem-ganjil-2526",
    semesterName: "Semester Ganjil 2025/2026",
    startDate: "2025-07-01",
    endDate: "2025-12-31",
    isActive: true,
    completedAssignments: 45,
    totalAssignments: 50,
    createdAt: "2025-07-01T08:00:00+07:00",
    updatedAt: "2025-07-01T08:00:00+07:00",
  },
  {
    id: "rp-002",
    semesterId: "sem-genap-2425",
    semesterName: "Semester Genap 2024/2025",
    startDate: "2025-01-01",
    endDate: "2025-06-30",
    isActive: false,
    completedAssignments: 50,
    totalAssignments: 50,
    createdAt: "2025-01-01T08:00:00+07:00",
    updatedAt: "2025-01-01T08:00:00+07:00",
  },
]);

// ─── Table Columns ────────────────────────────────────────────────────────────

const columns = [
  { key: "semesterName", label: "Nama Periode", thStyle: "width: 35%;" },
  { key: "status", label: "Status", thStyle: "width: 15%;" },
  { key: "progress", label: "Progress Pengisian", thStyle: "width: 30%;" },
  { key: "aksi", label: "Aksi", thStyle: "width: 20%;" },
];

// ─── Search ───────────────────────────────────────────────────────────────────

const searchQuery = ref("");

const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) return rows.value;
  return rows.value.filter((r) =>
    r.semesterName.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});

// ─── Modal State ──────────────────────────────────────────────────────────────

const showModal = ref(false);

const form = reactive({
  semesterId: "",
  startDate: "",
  endDate: "",
});

const errors = reactive({
  semesterId: false,
  startDate: false,
  endDate: false,
  dateRange: false,
});

function openModal() {
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  resetForm();
}

function resetForm() {
  form.semesterId = "";
  form.startDate = "";
  form.endDate = "";
  (Object.keys(errors) as (keyof typeof errors)[]).forEach((k) => (errors[k] = false));
}

// ─── Validation & Submit ──────────────────────────────────────────────────────

function validateModal(): boolean {
  (Object.keys(errors) as (keyof typeof errors)[]).forEach((k) => (errors[k] = false));
  let hasError = false;

  if (!form.semesterId) {
    errors.semesterId = true;
    hasError = true;
  }
  if (!form.startDate) {
    errors.startDate = true;
    hasError = true;
  }
  if (!form.endDate) {
    errors.endDate = true;
    hasError = true;
  }
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.dateRange = true;
    hasError = true;
  }

  return !hasError;
}

function submitModal() {
  if (!validateModal()) return;

  const semester = availableSemesters.find((s) => s.id === form.semesterId);

  // TODO: replace with API call
  // apiService.post('/reviews/periods', {
  //   semesterId: form.semesterId,
  //   startDate: form.startDate,
  //   endDate: form.endDate,
  // });

  console.log("Create review period payload", {
    semesterId: form.semesterId,
    startDate: form.startDate,
    endDate: form.endDate,
  });

  // Optimistic update
  rows.value.unshift({
    id: `rp-${Date.now()}`,
    semesterId: form.semesterId,
    semesterName: semester?.name ?? "",
    startDate: form.startDate,
    endDate: form.endDate,
    isActive: false,
    completedAssignments: 0,
    totalAssignments: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  closeModal();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProgressPercent(row: ReviewPeriodRow): number {
  if (row.totalAssignments === 0) return 0;
  return Math.round((row.completedAssignments / row.totalAssignments) * 100);
}
</script>

<template>
  <AppLayout>
    <PageHeader
      title="Manajemen 360 Review"
      subtitle="Kelola periode evaluasi dan pantau guru."
    >
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

      <DataTable :columns="columns" :rows="filteredRows">
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
            {{ row.isActive ? "Aktif" : "Selesai" }}
          </span>
        </template>

        <!-- Progress -->
        <template #cell:progress="{ row }">
          {{ row.completedAssignments }} / {{ row.totalAssignments }} Evaluasi
          <span class="progress-percent">({{ getProgressPercent(row) }}%)</span>
        </template>

        <!-- Aksi -->
        <template #cell:aksi>
          <button class="btn-outline">📂 Buka Periode</button>
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
            <!-- Nama Periode (semesterId) -->
            <div class="form-group">
              <label class="form-label">
                Nama Periode <span class="required-star">*</span>
              </label>
              <select
                v-model="form.semesterId"
                class="form-control"
                :class="{ 'is-invalid': errors.semesterId }"
              >
                <option value="">Misal: Semester Ganjil 2026/2027</option>
                <option
                  v-for="s in availableSemesters"
                  :key="s.id"
                  :value="s.id"
                >
                  {{ s.name }}
                </option>
              </select>
              <div v-if="errors.semesterId" class="error-message show">
                Nama periode wajib dipilih.
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
            <div v-if="errors.dateRange" class="error-message show" style="margin-top: -12px; margin-bottom: 16px">
              Tanggal selesai tidak boleh lebih awal dari tanggal mulai.
            </div>

            <!-- Footer Actions -->
            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">
                Batal
              </button>
              <button type="submit" class="btn-primary">Simpan Periode</button>
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
