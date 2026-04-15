<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

import AppLayout from "@/components/common/AppLayout.vue";
import PageHeader from "@/components/header/PageHeader.vue";
import AppButton from "@/components/common/AppButton.vue";
import AppCard from "@/components/common/AppCard.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import DataTable from "@/components/table/DataTable.vue";

import { useLeaveApprovalStore } from "@/stores/leaves/leaveapproval.store";
import type { LeaveRequestResponseDTO } from "@/interfaces/leaves/leaverequest.interface";

// State Management
const store = useLeaveApprovalStore();
const selectedStatus = ref("PENDING");
const sortOrder = ref("DATE_ASC");

const searchQuery = ref("");

// Modal States
const isReviewModalOpen = ref(false);
const isRejectModalOpen = ref(false);
const rejectReason = ref("");
const hasRejectError = ref(false);
const selectedRequest = ref<LeaveRequestResponseDTO | null>(null);

// Lifecycle & Fetch Data
onMounted(() => {
  fetchData();
});

function fetchData() {
  store.fetchPendingRequests(selectedStatus.value);
}

function handleFilterChange() {
  fetchData();
}

const displayedRequests = computed(() => {
  let list = [...store.pendingRequests];

  // 1. Lakukan Filter Pencarian
  if (searchQuery.value.trim() !== "") {
    const query = searchQuery.value.toLowerCase();
    list = list.filter((req) => {
      const teacherName = (req.teacherName || '').toLowerCase();
      return teacherName.includes(query);
    });
  }

  // 2. Lakukan Sorting
  list.sort((a, b) => {
    switch (sortOrder.value) {
      case "DATE_ASC":
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case "DATE_DESC":
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case "CREATED_DESC":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "CREATED_ASC":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  });

  return list;
});

const isIzinPribadiHarian = computed(() => {
  const detail = store.selectedRequestDetail;
  // Jika detail belum di-load dari BE, jangan tampilkan dulu
  if (!detail) return false;

  // Normalisasi string (buang spasi, jadikan UPPERCASE)
  const category = (detail.category || "").toUpperCase().trim();
  const type = (detail.type || "").toUpperCase().trim();

  // Cek kategori Izin Pribadi & Tipe Harian (tambahkan toleransi data lama)
  const isValidCategory = category === "IZIN_PRIBADI" || category === "IZIN PRIBADI";
  const isValidType = type === "FULL_DAY" || type === "DAILY" || type === "HARIAN";
  return isValidCategory && isValidType;
});

// Table Columns
const columns = [
  { key: "createdAt", label: "TGL PENGAJUAN", thStyle: "width: 15%;" },
  { key: "teacher", label: "NAMA PEMOHON", thStyle: "width: 20%;" },
  { key: "detail", label: "KATEGORI", thStyle: "width: 15%;" },
  { key: "period", label: "WAKTU PELAKSANAAN", thStyle: "width: 20%;" },
  { key: "status", label: "STATUS", thStyle: "width: 12%;" },
  { key: "actions", label: "AKSI", thStyle: "width: 18%;" },
];

// Helpers Formatting
function formatCategory(category: string): string {
  const map: Record<string, string> = {
    SAKIT: "Sakit",
    IZIN_PRIBADI: "Izin Pribadi",
    DINAS_LUAR: "Dinas Luar",
    MELAHIRKAN: "Melahirkan",
  };
  return map[category] || category;
}

function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
    SAKIT: "cat-sakit",
    IZIN_PRIBADI: "cat-izin",
    DINAS_LUAR: "cat-dinas",
    MELAHIRKAN: "cat-lahir",
  };
  return map[category] || "cat-izin";
}

function formatType(type: string): string {
  const map: Record<string, string> = {
    FULL_DAY: "Harian",
    PARTIAL: "Parsial (Jam Tertentu)",
    DAILY: "Harian",
  };
  return map[type] || type;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return map[status] || status;
}

function getStatusVariant(status: string): "pending" | "success" | "danger" {
  const map: Record<string, "pending" | "success" | "danger"> = {
    PENDING: "pending",
    APPROVED: "success",
    REJECTED: "danger",
  };
  return map[status] || "pending";
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(time: string | null): string {
  if (!time) return "";
  return time.slice(0, 5);
}

function calculateWorkingDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let count = 0;
  let current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

function getPeriodDisplay(row: LeaveRequestResponseDTO): { label: string; meta: string } {
  const startLabel = formatDate(row.startDate);
  const endLabel = formatDate(row.endDate);

  if (row.type === "PARTIAL") {
    return {
      label: startLabel,
      meta: `${formatTimeOnly(row.startTime)} - ${formatTimeOnly(row.endTime)} WIB`,
    };
  }

  const days = calculateWorkingDays(row.startDate, row.endDate);

  return {
    label: row.startDate === row.endDate ? startLabel : `${startLabel} - ${endLabel}`,
    meta: `${days} Hari Kerja`,
  };
}

// Modal Actions
function openReview(request: LeaveRequestResponseDTO) {
  selectedRequest.value = request;
  isReviewModalOpen.value = true;
  store.fetchRequestDetail(request.id);
}

function closeReviewModal() {
  isReviewModalOpen.value = false;
  selectedRequest.value = null;
}

function openRejectForm() {
  isReviewModalOpen.value = false;
  rejectReason.value = "";
  hasRejectError.value = false;
  isRejectModalOpen.value = true;
}

function closeRejectModal() {
  isRejectModalOpen.value = false;
  hasRejectError.value = false;
}

// Fungsi saat tombol hijau "Setujui Pengajuan" diklik
async function finalizeApprove() {
  if (!selectedRequest.value) return;

  // Panggil store dan tangkap status sukses beserta jumlah kelas pengganti
  const { success, count } = await store.approveRequest(selectedRequest.value.id);

  if (success) {
    if (count !== undefined && count > 0) {
      alert(`SUCCESS: Pengajuan telah DISETUJUI.\nSistem berhasil menyiapkan ${count} jadwal guru pengganti secara otomatis.`);
    } else {
      alert(`SUCCESS: Pengajuan telah DISETUJUI.\n(Tidak ada jadwal mengajar yang bertabrakan).`);
    }

    closeReviewModal(); // Tutup modal otomatis
    fetchData();        // Refresh data antrean di tabel belakang
  } else {
    alert(`GAGAL: ${store.error}`);
  }
}

async function finalizeReject() {
  if (!selectedRequest.value) return;
  if (rejectReason.value.trim() === "") {
    hasRejectError.value = true;
    return;
  }
  const success = await store.rejectRequest(selectedRequest.value.id, rejectReason.value);
  if (success) {
    alert("SUCCESS: Pengajuan berhasil ditolak.");
    closeRejectModal();
    fetchData();
  } else {
    alert(`GAGAL: ${store.error}`);
  }
}
</script>

<template>
  <AppLayout>
    <PageHeader
      title="Daftar Pengajuan Cuti (Approval)"
      subtitle="Tinjau dan proses permohonan izin staf pengajar."
    >
      <template #actions>
        <div class="header-filters-wrapper">

          <div class="search-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control-sm search-input"
              placeholder="🔍 Cari nama guru..."
            />
          </div>

          <div class="dropdown-wrapper">
            <div class="filter-group">
              <label for="sortOrder" class="filter-label">Urutkan:</label>
              <select id="sortOrder" v-model="sortOrder" class="form-control-sm">
                <option value="DATE_ASC">Pelaksanaan Terdekat</option>
                <option value="DATE_DESC">Pelaksanaan Terjauh</option>
                <option value="CREATED_DESC">Pengajuan Terbaru</option>
                <option value="CREATED_ASC">Pengajuan Terlama</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="statusFilter" class="filter-label">Status:</label>
              <select id="statusFilter" v-model="selectedStatus" @change="handleFilterChange" class="form-control-sm">
                <option value="PENDING">Menunggu Persetujuan</option>
                <option value="APPROVED">Telah Disetujui</option>
                <option value="REJECTED">Ditolak</option>
                <option value="ALL">Semua Riwayat</option>
              </select>
            </div>
          </div>

        </div>
      </template>
    </PageHeader>

    <AppCard>
      <div v-if="store.isLoading" style="text-align: center; padding: 20px;">
        Memuat data persetujuan...
      </div>

      <div v-else-if="store.error" style="color: red; text-align: center; padding: 20px;">
        {{ store.error }}
      </div>

      <div v-else-if="displayedRequests.length === 0" style="text-align: center; padding: 60px 20px; color: var(--text-grey);">
        <h3 style="margin-bottom: 8px;">Tidak Ditemukan</h3>
        <p v-if="searchQuery">Tidak ada hasil yang cocok dengan kata kunci "<b>{{ searchQuery }}</b>".</p>
        <p v-else>Tidak ada pengajuan cuti dengan status {{ formatStatus(selectedStatus) }}.</p>
      </div>

      <DataTable v-else :columns="columns" :rows="displayedRequests">

        <template #cell:createdAt="{ row }">
          <div style="font-weight: 500">{{ formatDate(row.createdAt) }}</div>
        </template>

        <template #cell:teacher="{ row }">
          <div style="font-weight: 600; color: var(--text-dark, #1F2937);">
            {{ row.teacherName || row.nama_guru || 'Nama Belum Termuat' }}
          </div>
          <div style="font-size: 12px; color: var(--text-grey, #6B7280); margin-top: 2px;">
            ID: {{ row.teacherId?.substring(0,8) || 'N/A' }}
          </div>
        </template>

        <template #cell:detail="{ row }">
          <span :class="['cat-badge', getCategoryClass(row.category)]">
            <span class="dot"></span>
            {{ formatCategory(row.category) }}
          </span>
          <div class="meta-text">{{ formatType(row.type) }}</div>
        </template>

        <template #cell:period="{ row }">
          <div style="font-weight: 500">{{ getPeriodDisplay(row).label }}</div>
          <div class="meta-text">{{ getPeriodDisplay(row).meta }}</div>
        </template>

        <template #cell:status="{ row }">
          <AppBadge :variant="getStatusVariant(row.status)">
            {{ formatStatus(row.status) }}
          </AppBadge>
        </template>

        <template #cell:actions="{ row }">
          <AppButton
            v-if="row.status === 'PENDING'"
            variant="outline"
            @click="openReview(row)"
          >
            Review Pengajuan
          </AppButton>
          <AppButton
            v-else
            variant="outline"
            @click="openReview(row)"
          >
            Lihat Detail
          </AppButton>
        </template>
      </DataTable>
    </AppCard>

    <div v-if="isReviewModalOpen" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Detail Pengajuan Cuti</h3>
          <button class="btn-close" @click="closeReviewModal">&times;</button>
        </div>

        <div class="modal-body" v-if="store.isDetailLoading" style="text-align: center; padding: 40px;">
          <p style="color: var(--text-grey);">Memuat detail lengkap...</p>
        </div>

        <div class="modal-body" v-else-if="store.error && !store.selectedRequestDetail" style="text-align: center; padding: 40px;">
          <p class="text-danger">⚠️ {{ store.error }}</p>
        </div>

        <div class="modal-body" v-else-if="store.selectedRequestDetail" style="padding-top: 16px;">

          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <div style="font-size: 18px; font-weight: 700; color: var(--text-dark);">
                {{ store.selectedRequestDetail.teacherName || '-' }}
              </div>
              <div style="font-size: 13px; color: var(--text-grey); font-family: monospace;">
                ID: {{ store.selectedRequestDetail.teacherId || '-' }}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: var(--text-grey); font-weight: 500;">Tanggal Pengajuan</div>
              <div style="font-size: 14px; font-weight: 600;">{{ formatDate(store.selectedRequestDetail.createdAt) }}</div>
            </div>
          </div>

          <div class="highlight-info-box">
            <div class="hl-item">
              <div class="hl-icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div class="hl-label">Durasi Cuti</div>
                <div class="hl-value text-primary">{{ getPeriodDisplay(store.selectedRequestDetail).meta }}</div>
              </div>
            </div>

            <div class="hl-item" v-if="isIzinPribadiHarian">
              <div class="hl-icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <div>
                <div class="hl-label">Sisa Kuota Cuti</div>
                <div class="hl-value" :class="store.selectedRequestDetail.remainingQuota < parseInt(getPeriodDisplay(store.selectedRequestDetail).meta) ? 'text-danger' : 'text-success'">
                  {{ store.selectedRequestDetail.remainingQuota ?? 0 }} Hari
                </div>
              </div>
            </div>
          </div>

          <div class="detail-row">
            <span class="detail-label">Kategori Izin</span>
            <span class="detail-value">{{ formatCategory(store.selectedRequestDetail.category) }} ({{ formatType(store.selectedRequestDetail.type) }})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Waktu Pelaksanaan</span>
            <span class="detail-value">
              {{ getPeriodDisplay(store.selectedRequestDetail).label }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Lampiran Bukti</span>
            <span class="detail-value">
              <a v-if="store.selectedRequestDetail.attachmentUrl"
                 :href="store.selectedRequestDetail.attachmentUrl"
                 target="_blank"
                 style="color: var(--primary, #1b5e20); text-decoration: underline; font-weight: 600;">
                Lihat Lampiran ↗
              </a>
              <span v-else style="color: var(--text-grey); font-style: italic; font-weight: 400;">
                Tidak ada
              </span>
            </span>
          </div>

          <hr class="divider">

          <div class="detail-block">
            <span class="detail-label">Alasan / Keterangan:</span>
            <div class="reason-box">{{ store.selectedRequestDetail.reason }}</div>
          </div>

          <div class="detail-block" v-if="store.selectedRequestDetail.status === 'REJECTED'">
            <span class="detail-label text-danger">Alasan Penolakan:</span>
            <div class="reason-box border-danger">{{ store.selectedRequestDetail.rejectionReason }}</div>
          </div>
        </div>

        <div class="modal-footer" v-if="!store.isDetailLoading">
          <template v-if="store.selectedRequestDetail?.status === 'PENDING'">

            <AppButton variant="outline" style="color: #dc2626; border-color: #dc2626;" @click="openRejectForm" :disabled="store.isLoading">
              Tolak Pengajuan
            </AppButton>

            <AppButton
              @click="finalizeApprove"
              style="background: #15803d; border: none; color: white;"
              :disabled="store.isLoading"
            >
              {{ store.isLoading ? 'Memproses...' : 'Setujui Pengajuan' }}
            </AppButton>

          </template>

          <template v-else-if="store.selectedRequestDetail">
            <span style="margin-right: auto; align-self: center; font-size: 13px; color: var(--text-grey);">
              Pengajuan ini telah diproses.
            </span>
            <AppButton variant="outline" @click="closeReviewModal">Tutup</AppButton>
          </template>
        </div>
      </div>
    </div>

    <div v-if="isRejectModalOpen" class="modal-backdrop">
      <div class="modal-card" style="max-width: 450px;">
        <div class="modal-header">
          <h3 class="text-danger">Konfirmasi Penolakan</h3>
          <button class="btn-close" @click="closeRejectModal">&times;</button>
        </div>

        <div class="modal-body">
          <div style="margin-bottom: 20px; background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Menolak pengajuan dari:</div>
            <div style="font-weight: 600; color: #1f2937;">{{ selectedRequest?.teacherName }}</div>
          </div>

          <div class="form-group">
            <label style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; display: block;">
              Alasan Penolakan <span class="text-danger">*</span>
            </label>
            <textarea
              v-model="rejectReason"
              class="form-textarea"
              rows="4"
              placeholder="Tuliskan alasan penolakan..."
            ></textarea>
            <div v-if="hasRejectError" class="text-danger" style="font-size: 12px; margin-top: 6px; font-weight: 500;">
              ⚠️ Alasan penolakan wajib diisi!
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <AppButton variant="outline" @click="closeRejectModal" :disabled="store.isLoading">
            Batal
          </AppButton>

          <AppButton
            @click="finalizeReject"
            style="background: #dc2626; color: white;"
            :disabled="rejectReason.trim() === '' || store.isLoading"
          >
            {{ store.isLoading ? 'Memproses...' : 'Tolak Pengajuan' }}
          </AppButton>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.meta-text {
  font-size: 13px;
  color: var(--text-grey, #6b7280);
  margin-top: 2px;
}
.text-danger { color: #dc2626; }

.header-filters-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* Rata kanan */
  gap: 12px;
}

.dropdown-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-grey, #6b7280);
  white-space: nowrap;
}

.search-wrapper {
  width: 100%;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  background-image: none !important;
  padding-right: 16px !important;
}

.form-control-sm {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: #ffffff;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 12px top 50%;
  background-size: 10px auto;
  padding: 8px 36px 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.form-control-sm:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
}

.form-control-sm:focus {
  outline: none;
  border-color: var(--primary, #1b5e20);
  box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.15);
}

@media (max-width: 768px) {
  .header-filters-wrapper {
    align-items: stretch;
  }
  .dropdown-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .filter-group {
    justify-content: space-between;
  }
}

/* Modals Custom */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-card {
  background: white;
  width: 90%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  overflow: hidden;
}
.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border, #e5e7eb);
  display: flex; justify-content: space-between; align-items: center;
}
.modal-header h3 { margin: 0; font-size: 18px; }
.btn-close {
  background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;
}
.modal-body { padding: 24px; }
.modal-footer {
  padding: 16px 24px; background: #f9fafb; border-top: 1px solid var(--border, #e5e7eb);
  display: flex; justify-content: flex-end; gap: 12px;
}

/* Styling untuk Highlight Box di Modal */
.hl-icon-container {
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: white;
  color: var(--primary, #1b5e20);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
}

.highlight-info-box {
  display: flex;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  gap: 32px;
  margin-bottom: 24px;
}

.hl-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.hl-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.hl-value {
  font-size: 18px;
  font-weight: 700;
}

.text-primary { color: var(--primary, #1b5e20); }
.text-success { color: #059669; } /* Hijau terang */
.text-danger { color: #dc2626; } /* Merah terang untuk kuota tipis */

@media (max-width: 480px) {
  .highlight-info-box {
    flex-direction: column;
    gap: 16px;
  }
}

.detail-row {
  display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;
}
.detail-label { color: #6b7280; font-weight: 500; }
.detail-value { font-weight: 600; text-align: right; }
.divider { border: 0; border-top: 1px solid var(--border, #e5e7eb); margin: 16px 0; }
.detail-block { margin-bottom: 16px; }
.reason-box {
  background: #f9fafb; padding: 12px; border-radius: 8px; font-size: 14px; border: 1px solid var(--border, #e5e7eb);
  margin-top: 8px; line-height: 1.5;
}
.reason-box.border-danger { border-color: #fca5a5; background: #fef2f2; }

.cat-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 500;
  border: 1px solid transparent;
}
.cat-badge .dot {
  width: 7px; height: 7px;
  border-radius: 50%; flex-shrink: 0;
}
.cat-sakit  { background:#FCEBEB; border-color:#F09595; color:#791F1F; }
.cat-sakit .dot  { background:#E24B4A; }

.cat-izin   { background:#FAEEDA; border-color:#FAC775; color:#633806; }
.cat-izin .dot   { background:#BA7517; }

.cat-dinas  { background:#E6F1FB; border-color:#85B7EB; color:#0C447C; }
.cat-dinas .dot  { background:#378ADD; }

.cat-lahir  { background:#FBEAF0; border-color:#ED93B1; color:#72243E; }
.cat-lahir .dot  { background:#D4537E; }

.form-textarea {
  width: 100%; padding: 12px; border: 1px solid var(--border, #e5e7eb); border-radius: 8px;
  font-family: inherit; font-size: 14px; box-sizing: border-box; resize: vertical; outline: none;
}
.form-textarea:focus { border-color: var(--primary, #1b5e20); }
.form-textarea.is-invalid { border-color: #dc2626; }
</style>
