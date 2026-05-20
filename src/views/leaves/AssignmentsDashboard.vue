<script setup lang="ts">
// 1. TAMBAHKAN 'computed' DI SINI
import { ref, onMounted, watch, computed } from 'vue'
import {
  UserMinus,
  BookX,
  Calendar,
  UserPlus,
  Clock,
  BookOpen,
  UserX,
  UserCheck,
  X
} from 'lucide-vue-next'

import AppLayout from '@/components/common/AppLayout.vue'
import PageHeader from '@/components/header/PageHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'

import { useAssignmentStore } from '@/stores/leaves/assignments.store'
import type { SubstituteAssignmentsCardDTO } from '@/interfaces/leaves/assignments.interface'

const assignmentStore = useAssignmentStore()

// State Tanggal (Menggunakan waktu lokal)
const now = new Date()
const offset = now.getTimezoneOffset() * 60000
const localISOTime = new Date(now.getTime() - offset).toISOString().split('T')[0] ?? ''

const todayStr: string = localISOTime
const selectedDate = ref<string>(todayStr)
const statusFilter = ref<string>('ALL')

// State Modal & Validasi
const showAssignModal = ref(false)
const selectedContext = ref<SubstituteAssignmentsCardDTO | null>(null)
const selectedSubstituteTeacher = ref<string>("")
const validationError = ref<string>("")

const filteredClasses = computed(() => {
  const allData = assignmentStore.dashboardData.emptyClasses || []

  if (statusFilter.value === 'ALL') {
    return allData
  }

  return allData.filter(row => row.status === statusFilter.value)
})

// AC: Auto-fetch setiap kali date berubah
watch(selectedDate, (newDate) => {
  if (newDate) {
    assignmentStore.fetchEmptyClasses(newDate)
  }
})

onMounted(() => {
  assignmentStore.fetchEmptyClasses(selectedDate.value)
})

function setToToday() {
  selectedDate.value = todayStr
}

function getStatusVariant(status: string): 'warning' | 'success' {
  return status === 'NOT_ASSIGNED' ? 'warning' : 'success'
}

function openAssignModal(row: SubstituteAssignmentsCardDTO) {
  selectedContext.value = row
  if (row.status === 'ASSIGNED' && row.substituteTeacherId) {
    selectedSubstituteTeacher.value = row.substituteTeacherId
  } else {
    selectedSubstituteTeacher.value = ""
  }
  validationError.value = "" // Reset error saat buka modal
  showAssignModal.value = true
  assignmentStore.fetchAvailableTeachers(selectedDate.value, row.timeSlotId, row.leaveRequestId)
}

function closeAssignModal() {
  showAssignModal.value = false
  selectedContext.value = null
  validationError.value = ""
}

async function finalizeAssign() {
  if (!selectedSubstituteTeacher.value) {
    validationError.value = "Harap pilih guru pengganti terlebih dahulu!"
    return
  }
  validationError.value = ""

  if (selectedContext.value?.assignmentId) {
    const success = await assignmentStore.assignTeacher(
      selectedContext.value.assignmentId,
      selectedSubstituteTeacher.value
    )

    if (success) {
      closeAssignModal()
      alert("Berhasil! Guru pengganti telah ditugaskan dan notifikasi telah dikirim.")
    } else {
      alert(assignmentStore.error || "Gagal menugaskan guru.")
    }
  } else {
    alert("Error: Assignment ID tidak ditemukan pada sesi ini.")
  }
}
</script>

<template>
  <AppLayout>
    <PageHeader
      title="Penugasan Guru Pengganti (Inval)"
      subtitle="Kelola jadwal kelas kosong akibat ketidakhadiran guru."
    />

    <div class="filter-section">
      <div class="filter-group">
        <Calendar :size="20" class="icon-filter" />
        <span class="filter-label">Tanggal:</span>
        <input type="date" class="form-control-date" v-model="selectedDate" />
        <AppButton variant="secondary" @click="setToToday">Hari Ini</AppButton>
      </div>

      <div class="divider-vertical"></div>

      <div class="filter-group">
        <span class="filter-label">Status:</span>
        <select v-model="statusFilter" class="form-control-select filter-select">
          <option value="ALL">Semua Kelas</option>
          <option value="NOT_ASSIGNED">Belum Ditugaskan (Not Assigned)</option>
          <option value="ASSIGNED">Sudah Ditugaskan (Assigned)</option>
        </select>
      </div>
    </div>

    <div class="widget-grid">
      <div class="widget-card">
        <div class="widget-icon warning-icon">
          <UserMinus :size="24" />
        </div>
        <div class="widget-info">
          <p class="widget-val">
            <span v-if="assignmentStore.isLoading">...</span>
            <span v-else>{{ assignmentStore.dashboardData.totalGuruCuti }}</span>
          </p>
          <p class="widget-label">Total Guru Cuti / Izin</p>
        </div>
      </div>

      <div class="widget-card">
        <div class="widget-icon danger-icon">
          <BookX :size="24" />
        </div>
        <div class="widget-info">
          <p class="widget-val">
            <span v-if="assignmentStore.isLoading">...</span>
            <span v-else>{{ assignmentStore.dashboardData.totalSesiKosong }}</span>
          </p>
          <p class="widget-label">Sesi Kelas Kosong (NOT ASSIGNED)</p>
        </div>
      </div>
    </div>

    <div class="content-section">

      <div v-if="assignmentStore.isLoading" class="state-container">
        <div class="spinner"></div>
        <p>Memuat data jadwal...</p>
      </div>

      <div v-else-if="assignmentStore.error" class="state-container error-state">
        <p>{{ assignmentStore.error }}</p>
      </div>

      <div v-else-if="filteredClasses.length === 0" class="state-container empty-state">
        <Calendar :size="48" color="#9ca3af" style="margin-bottom: 16px;"/>
        <h3>Data Tidak Ditemukan</h3>
        <p v-if="assignmentStore.dashboardData.emptyClasses.length === 0">
          Tidak ada jadwal kelas kosong pada tanggal ini.
        </p>
        <p v-else>
          Tidak ada kelas dengan status <strong>{{ statusFilter === 'NOT_ASSIGNED' ? 'Belum Ditugaskan' : 'Sudah Ditugaskan' }}</strong>.
        </p>
      </div>

      <div v-else class="cards-grid">
        <div
          v-for="row in filteredClasses"
          :key="row.scheduleEntryId"
          class="assignment-card"
        >
          <div class="card-header">
            <div class="class-title">{{ row.className }}</div>
            <AppBadge :variant="getStatusVariant(row.status)">
              {{ row.status === 'NOT_ASSIGNED' ? 'Not Assigned' : 'Assigned' }}
            </AppBadge>
          </div>

          <div class="card-body">
            <div class="info-row">
              <Clock :size="16" class="info-icon" />
              <span>Jam ke-{{ row.sessionNumber }} ({{ row.startTime?.slice(0,5) }} - {{ row.endTime?.slice(0,5) }})</span>
            </div>

            <div class="info-row">
              <BookOpen :size="16" class="info-icon" />
              <span class="main-text">{{ row.subjectName }}</span>
            </div>

            <div class="divider"></div>

            <div class="info-row align-start">
              <UserX :size="16" class="info-icon text-danger mt-1" />
              <div>
                <div class="text-label">Guru Asli (Cuti)</div>
                <div class="main-text">{{ row.originalTeacherName }}</div>
              </div>
            </div>

            <div class="info-row align-start">
              <UserCheck :size="16" class="info-icon mt-1" :class="row.status === 'NOT_ASSIGNED' ? 'text-grey' : 'text-success'" />
              <div>
                <div class="text-label">Guru Pengganti</div>
                <div v-if="row.status === 'NOT_ASSIGNED'" class="italic-text">Belum ada pengganti</div>
                <div v-else class="success-text">{{ row.substituteTeacherName }}</div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <AppButton
              :variant="row.status === 'NOT_ASSIGNED' ? 'primary' : 'secondary'"
              @click="openAssignModal(row)"
              class="btn-full-width"
            >
              <UserPlus :size="16" />
              <span>{{ row.status === 'NOT_ASSIGNED' ? 'Pilih Guru Pengganti' : 'Ubah Pengganti' }}</span>
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAssignModal && selectedContext" class="modal-overlay" @click.self="closeAssignModal">
      <div class="modal-container">
        <div class="m-header">
          <h3>Pilih Guru Pengganti</h3>
          <button class="btn-close" @click="closeAssignModal">
            <X :size="20" />
          </button>
        </div>

        <div class="m-body">
          <div class="warning-box">
            Menampilkan rekomendasi guru yang <strong>Available (Tidak Mengajar)</strong> pada:<br>
            <strong style="color: var(--primary);">{{ selectedContext.className }}</strong> •
            <strong>Jam ke-{{ selectedContext.sessionNumber }} ({{ selectedContext.startTime?.slice(0,5) }} - {{ selectedContext.endTime?.slice(0,5) }})</strong>.
          </div>

          <div style="margin-top: 16px;">
            <label class="form-label">Daftar Kandidat Tersedia <span style="color: #DC2626;">*</span></label>

            <select
              v-model="selectedSubstituteTeacher"
              class="form-control-select"
              :class="{ 'is-invalid': validationError }"
              :disabled="assignmentStore.isFetchingTeachers"
              @change="validationError = ''" >
              <option value="" disabled selected v-if="assignmentStore.isFetchingTeachers">
                Mencari guru available...
              </option>
              <option value="" disabled selected v-else>-- Pilih Guru Pengganti --</option>
              <option
                v-if="selectedContext?.status === 'ASSIGNED' && selectedContext?.substituteTeacherName"
                :value="selectedContext.substituteTeacherId"
              >
                {{ selectedContext.substituteTeacherName }} (Petugas Saat Ini)
              </option>
              <option
                v-for="teacher in assignmentStore.availableTeachers"
                :key="teacher.teacherId"
                :value="teacher.teacherId"
              >
                {{ teacher.namaGuru }} ({{ teacher.deskripsiMapel }})
              </option>
            </select>

            <span v-if="validationError" class="error-text">{{ validationError }}</span>
          </div>
        </div>

        <div class="m-footer">
          <AppButton variant="secondary" @click="closeAssignModal">Batal</AppButton>
          <AppButton variant="primary" @click="finalizeAssign" :disabled="assignmentStore.isFetchingTeachers">
            Tugaskan Guru
          </AppButton>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.filter-section {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  background: var(--white, #ffffff);
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid var(--border, #e5e7eb);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-dark, #1f2937);
}

.icon-filter {
  color: var(--text-grey, #6b7280);
}

.divider-vertical {
  width: 1px;
  height: 32px;
  background-color: var(--border, #e5e7eb);
}

.widget-grid {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.widget-card {
  flex: 1;
  background: var(--white, #ffffff);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--border, #e5e7eb);
  display: flex;
  align-items: center;
  gap: 20px;
}

.widget-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon { background: #FFF7ED; color: #C2410C; }
.danger-icon { background: #FEF2F2; color: #DC2626; }

.widget-val {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-dark, #1f2937);
  margin: 0 0 4px 0;
  line-height: 1.1;
}

.widget-label {
  font-size: 14px;
  color: var(--text-grey, #6b7280);
  font-weight: 500;
  margin: 0;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.assignment-card {
  background: var(--white, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: transform 0.2s, box-shadow 0.2s;
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border, #e5e7eb);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fdfdfd;
}

.class-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark, #1f2937);
}

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.card-footer {
  padding: 16px 20px;
  background: #f9fafb;
  border-top: 1px solid var(--border, #e5e7eb);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-dark, #1f2937);
}

.align-start { align-items: flex-start; }
.info-icon { color: var(--text-grey, #6b7280); flex-shrink: 0; }
.divider { height: 1px; background: var(--border, #e5e7eb); margin: 4px 0; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: var(--white, #ffffff);
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  margin: 16px;
}

.m-header {
  padding: 20px;
  border-bottom: 1px solid var(--border, #e5e7eb);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.m-header h3 { margin: 0; font-size: 18px; color: var(--primary, #1B5E20); }

.m-body { padding: 24px; }

.m-footer {
  padding: 16px 24px;
  background: #F9FAFB;
  border-top: 1px solid var(--border, #e5e7eb);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-radius: 0 0 12px 12px;
}

.warning-box {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  color: #166534;
  padding: 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-dark, #1f2937);
}

.form-control-date,
.form-control-select {
  padding: 10px 14px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  color: var(--text-dark, #1f2937);
  background: #fff;
  transition: 0.2s;
}

.form-control-date:focus,
.form-control-select:focus {
  border-color: var(--primary, #1B5E20);
  box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.1);
}

.form-control-select { cursor: pointer; }
.form-control-select:disabled { background: #f3f4f6; cursor: not-allowed; color: #9ca3af; }

.filter-select {
  width: auto;
  min-width: 180px;
  padding: 8px 12px;
}

/* Button & Close Actions */
:deep(.btn-full-width) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-grey, #6b7280);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.btn-close:hover { background: #f3f4f6; color: #1f2937; }

/* Validation Styles */
.is-invalid {
  border-color: #DC2626 !important;
  background-color: #FEF2F2;
}
.error-text {
  display: block;
  color: #DC2626;
  font-size: 13px;
  margin-top: 6px;
  font-weight: 500;
}

.state-container {
  background: var(--white, #ffffff);
  border: 1px dashed var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-grey, #6b7280);
}

.state-container h3 { margin: 0 0 8px 0; color: var(--text-dark, #1f2937); }
.state-container p { margin: 0; font-size: 14px; }
.error-state { color: #DC2626; border-color: #fca5a5; background: #fef2f2; }

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: var(--primary, #1B5E20);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.mt-1 { margin-top: 2px; }
.text-danger { color: #DC2626; }
.text-success { color: var(--primary, #1B5E20); }
.text-grey { color: #9ca3af; }

.text-label { font-size: 12px; color: var(--text-grey, #6b7280); margin-bottom: 2px; }
.main-text { font-weight: 600; }
.italic-text { font-style: italic; color: #9ca3af; }
.success-text { font-weight: 700; color: var(--primary, #1B5E20); }

@media (max-width: 768px) {
  .widget-grid { flex-direction: column; }
  .cards-grid { grid-template-columns: 1fr; }

  .filter-section {
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-group {
    width: 100%;
    flex-wrap: wrap;
  }
  .divider-vertical { display: none; }
  .form-control-date,
  .filter-select {
    width: 100%;
  }
}
</style>
