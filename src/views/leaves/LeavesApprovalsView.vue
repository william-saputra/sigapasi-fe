<template>
  <div class="approval-cuti-page">
    <div class="container">
      <div class="header">
        <div>
          <h1>Daftar Pengajuan Cuti (Approval)</h1>
          <p class="subtitle">Tinjau dan proses permohonan izin staf pengajar.</p>
        </div>
        <div class="user-flex">
          <div class="avatar">KS</div>
          <span class="user-name">Kepala Sekolah</span>
        </div>
      </div>

      <div class="card">
        <table>
          <thead>
          <tr>
            <th>Nama Pemohon</th>
            <th>Tanggal Cuti</th>
            <th>Kategori</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>
              <div class="user-flex">
                <div class="avatar">GA</div>
                <div>
                  <div class="fw-600">Guru Mata Pelajaran A</div>
                  <div class="nip-text">NIP: 199022X</div>
                </div>
              </div>
            </td>
            <td>12 Okt 2025 (Harian)</td>
            <td>Sakit</td>
            <td><span class="badge badge-pending">Pending</span></td>
            <td>
              <button class="btn btn-outline btn-sm" @click="openDetail">Review</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal" :class="{ active: isDetailModalOpen }">
      <div class="modal-content">
        <div class="m-header">
          <h3>Detail Pengajuan</h3>
          <span class="close-btn" @click="closeDetailModal">&times;</span>
        </div>
        <div class="m-body">
          <div class="row-detail">
            <span class="label">Nama Pemohon</span>
            <span class="value">Guru Mata Pelajaran A</span>
          </div>
          <div class="row-detail">
            <span class="label">Kategori</span>
            <span class="value">Sakit</span>
          </div>
          <div class="row-detail">
            <span class="label">Tanggal & Waktu</span>
            <span class="value">
              12 Oktober 2025<br>
              <span class="sub-value">Full Day (Harian)</span>
            </span>
          </div>
          <div class="row-detail">
            <span class="label">Sisa Jatah Cuti</span>
            <span class="value badge badge-success badge-sm">12 Hari</span>
          </div>

          <hr class="divider">

          <div class="mb-16">
            <span class="label block-label">Alasan:</span>
            <div class="reason-box">
              Kondisi kesehatan menurun (gejala tifus) dan memerlukan istirahat total sesuai anjuran dokter.
            </div>
          </div>

          <div>
            <span class="label block-label">Dokumen Pendukung:</span>
            <div class="document-box">
              <span class="doc-icon">📄</span>
              <div>
                <div class="doc-title">Surat_Keterangan_RS.pdf</div>
                <div class="doc-size">1.2 MB • Klik untuk mengunduh file</div>
              </div>
            </div>
          </div>
        </div>
        <div class="m-footer">
          <button class="btn btn-danger" @click="openReject">Tolak Pengajuan</button>
          <button class="btn btn-primary" @click="finalizeApprove">Setuju & Teruskan</button>
        </div>
      </div>
    </div>

    <div class="modal" :class="{ active: isRejectModalOpen }">
      <div class="modal-content">
        <div class="m-header">
          <h3 class="text-danger">Tolak Pengajuan</h3>
          <span class="close-btn" @click="closeRejectModal">&times;</span>
        </div>
        <div class="m-body">
          <p class="reject-desc">
            Silakan isi <strong>alasan penolakan</strong>. Informasi ini akan langsung dikirimkan kepada guru yang bersangkutan.
          </p>
          <textarea
            v-model="rejectReason"
            class="form-control"
            :class="{ 'border-danger': hasRejectError }"
            rows="4"
            placeholder="Contoh: Jatah cuti tidak mencukupi, harap mengajukan ulang..."
          ></textarea>
          <div v-if="hasRejectError" class="error-msg">⚠️ Alasan penolakan wajib diisi!</div>
        </div>
        <div class="m-footer">
          <button class="btn btn-outline" @click="closeRejectModal">Batal</button>
          <button class="btn btn-danger" @click="finalizeReject">Kirim Penolakan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// State Management
const isDetailModalOpen = ref(false);
const isRejectModalOpen = ref(false);
const rejectReason = ref('');
const hasRejectError = ref(false);

// Methods - Modal Navigasi
const openDetail = () => {
  isDetailModalOpen.value = true;
};

const closeDetailModal = () => {
  isDetailModalOpen.value = false;
};

const openReject = () => {
  isDetailModalOpen.value = false;
  rejectReason.value = ''; // Reset form saat dibuka
  hasRejectError.value = false;
  isRejectModalOpen.value = true;
};

const closeRejectModal = () => {
  isRejectModalOpen.value = false;
  hasRejectError.value = false;
};

// Methods - Finalisasi Aksi
const finalizeApprove = () => {
  closeDetailModal();
  // Simulasi API Call
  alert("✅ SUCCESS: Pengajuan telah DISETUJUI.\n\nSistem akan secara otomatis meneruskan data jadwal yang kosong ke menu [Penugasan Guru Pengganti].");
};

const finalizeReject = () => {
  // Validasi: Alasan tidak boleh kosong
  if (rejectReason.value.trim() === "") {
    hasRejectError.value = true;
    return;
  }

  closeRejectModal();
  // Simulasi API Call
  alert(`❌ REJECTED: Pengajuan berhasil DITOLAK.\n\nAlasan: ${rejectReason.value}\n\nNotifikasi penolakan telah dikirimkan ke guru.`);
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap');

/* --- DESIGN SYSTEM CANDLE TREE --- */
.approval-cuti-page {
  --primary: #1B5E20;
  --primary-hover: #144a18;
  --bg-light: #F9FAFB;
  --text-dark: #1F2937;
  --text-grey: #6B7280;
  --border: #E5E7EB;
  --white: #FFFFFF;
  --radius: 8px;
  --font: 'Public Sans', sans-serif;

  /* Status Colors */
  --warning-bg: #FFF7ED; --warning-text: #C2410C;
  --success-bg: #ECFDF5; --success-text: #047857;
  --danger-bg: #FEF2F2; --danger-text: #DC2626;

  font-family: var(--font);
  background: var(--bg-light);
  color: var(--text-dark);
  min-height: 100vh;
  padding: 40px;
}

/* --- LAYOUT --- */
.container { max-width: 900px; margin: 0 auto; }

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
h1 { font-size: 24px; color: var(--primary); margin: 0; }
.subtitle { margin: 4px 0 0 0; color: var(--text-grey); font-size: 14px; }
.user-name { font-size: 14px; font-weight: 600; }

.card {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

/* --- TABLE --- */
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; padding: 16px; background: #F9FAFB; color: var(--text-grey); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
td { padding: 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }

.user-flex { display: flex; align-items: center; gap: 12px; }
.avatar { width: 32px; height: 32px; background: #E8F5E9; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
.fw-600 { font-weight: 600; }
.nip-text { font-size: 11px; color: var(--text-grey); }

.badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-pending { background: var(--warning-bg); color: var(--warning-text); }
.badge-danger { background: var(--danger-bg); color: var(--danger-text); }
.badge-success { background: var(--success-bg); color: var(--success-text); }
.badge-sm { padding: 4px 8px; font-size: 12px; }

/* --- BUTTONS --- */
.btn { padding: 10px 18px; border-radius: var(--radius); font-weight: 600; font-size: 14px; cursor: pointer; border: 1px solid transparent; transition: 0.2s; font-family: var(--font); }
.btn-sm { padding: 6px 12px; font-size: 12px; }

.btn-outline { background: transparent; border-color: var(--border); color: var(--text-dark); }
.btn-outline:hover { background: #F3F4F6; }

.btn-primary { background: var(--primary); color: var(--white); border: none; }
.btn-primary:hover { background: var(--primary-hover); }

.btn-danger { background: var(--danger-bg); color: var(--danger-text); border-color: #FECACA; }
.btn-danger:hover { background: #FEE2E2; }

/* --- MODAL (POP-UP) --- */
.modal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;
  opacity: 0; pointer-events: none; transition: opacity 0.2s;
  z-index: 100;
}
.modal.active { opacity: 1; pointer-events: all; }

.modal-content {
  background: var(--white); width: 500px; border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  transform: translateY(10px); transition: transform 0.2s;
}
.modal.active .modal-content { transform: translateY(0); }

.m-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.m-header h3 { margin: 0; font-size: 18px; color: var(--primary); }
.close-btn { cursor: pointer; font-size: 20px; color: var(--text-grey); }

.m-body { padding: 24px; }

.m-footer { padding: 16px 24px; background: #F9FAFB; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; border-radius: 0 0 12px 12px; }

/* Detail Rows */
.row-detail { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
.label { color: var(--text-grey); font-weight: 500; }
.value { font-weight: 600; text-align: right; }
.sub-value { font-size: 12px; color: var(--text-grey); font-weight: 400; }

.divider { border: 0; border-top: 1px solid var(--border); margin: 16px 0; }
.mb-16 { margin-bottom: 16px; }
.block-label { display: block; margin-bottom: 8px; }

.reason-box { background: var(--bg-light); padding: 12px; border-radius: var(--radius); font-size: 14px; line-height: 1.5; border: 1px solid var(--border); }
.document-box { background: #F9FAFB; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius); display: flex; align-items: center; gap: 12px; cursor: pointer; }
.doc-icon { font-size: 24px; }
.doc-title { font-weight: 600; font-size: 13px; color: var(--primary); }
.doc-size { font-size: 11px; color: var(--text-grey); }

/* Form Textarea */
.form-control {
  width: 100%; padding: 12px; border: 1px solid var(--border);
  border-radius: var(--radius); font-family: var(--font); font-size: 14px;
  box-sizing: border-box; resize: none; outline: none;
}
.form-control:focus { border-color: var(--primary); }
.border-danger { border-color: var(--danger-text) !important; }

.text-danger { color: var(--danger-text) !important; }
.reject-desc { font-size: 14px; color: var(--text-dark); margin-bottom: 12px; line-height: 1.5; }
.error-msg { color: var(--danger-text); font-size: 12px; margin-top: 6px; }
</style>
