<script setup lang="ts">
import { computed, reactive, ref, onMounted} from "vue";
import { useRouter } from "vue-router";
import { useLeaveStore } from "@/stores/leaves/leaverequest.store";
import type { CreateLeaveRequestDTO } from "@/interfaces/leaves/leaverequest.interface";

const router = useRouter();
const leaveStore = useLeaveStore();

onMounted(() => {
  leaveStore.fetchLeaveQuota();
});

const showSuccess = ref(false);
const uploadedFile = ref<File | null>(null);

const form = reactive({
  leaveType: "FULL_DAY",
  startDate: "",
  endDate: "",
  singleDate: "",
  startTime: "",
  endTime: "",
  category: "",
  reason: "",
});

const errors = reactive({
  startDate: false,
  endDate: false,
  singleDate: false,
  startTime: false,
  endTime: false,
  category: false,
  reason: false,
  document: false,
  dateRange: false,
  timeRange: false,
  pastDate: false,
  quota: false,
  maxHours: false,
  onlyWeekend: false, // [BARU] State error jika cuti jatuh sepenuhnya di hari libur
});

const isHarian = computed(() => form.leaveType === "FULL_DAY");
const isSakit = computed(() => form.category === "SAKIT");

const isFormInvalid = computed(() => {
  if (!form.category || !form.reason.trim()) return true;
  if (isSakit.value && !uploadedFile.value) return true;

  if (isHarian.value) {
    if (!form.startDate || !form.endDate) return true;
  } else {
    if (!form.singleDate || !form.startTime || !form.endTime) return true;
  }
  return false;
});

function resetErrors() {
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = false;
  });
  showSuccess.value = false;
  leaveStore.error = null;
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  uploadedFile.value = target.files?.[0] ?? null;
}

function toDateOnly(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

// [BARU] Fungsi menghitung hari kerja efektif (skip Sabtu-Minggu)
function calculateWorkingDays(startStr: string, endStr: string) {
  if (!startStr || !endStr) return 0;

  let current = toDateOnly(startStr);
  const end = toDateOnly(endStr);
  let count = 0;

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Bukan Minggu (0) dan Sabtu (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

function validateForm() {
  resetErrors();
  let hasError = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxBackdateAllowed = new Date(today);
  maxBackdateAllowed.setDate(maxBackdateAllowed.getDate() - 7);

  if (isHarian.value) {
    if (form.startDate && form.endDate) {
      const start = toDateOnly(form.startDate);
      const end = toDateOnly(form.endDate);

      if (end < start) {
        errors.dateRange = true;
        hasError = true;
      }

      if (!isSakit.value) {
        if (start < today || end < today) {
          errors.pastDate = true;
          hasError = true;
        }
      } else {
        if (start < maxBackdateAllowed) {
          errors.pastDate = true;
          hasError = true;
        }
      }

      const workingDays = calculateWorkingDays(form.startDate, form.endDate);

      if (workingDays === 0) {
        // Jika 0, berarti rentang tanggal full kena Sabtu/Minggu
        errors.onlyWeekend = true;
        hasError = true;
      } else if (form.category === 'IZIN_PRIBADI') {
        // Validasi sisa kuota menggunakan workingDays
        if (workingDays > leaveStore.leaveQuota) {
          errors.quota = true;
          hasError = true;
        }
      }
    }
  } else {
    // UNTUK PARSIAL
    if (form.singleDate) {
      const single = toDateOnly(form.singleDate);

      if (!isSakit.value) {
        if (single < today) {
          errors.pastDate = true;
          hasError = true;
        }
      } else {
        if (single < maxBackdateAllowed) {
          errors.pastDate = true;
          hasError = true;
        }
      }

      const workingDays = calculateWorkingDays(form.singleDate, form.singleDate);
      if (workingDays === 0) {
        errors.onlyWeekend = true;
        hasError = true;
      }
    }

    if (form.startTime && form.endTime) {
      if (form.endTime <= form.startTime) {
        errors.timeRange = true;
        hasError = true;
      } else {
        const [startH = 0, startM = 0] = form.startTime.split(':').map(Number);
        const [endH = 0, endM = 0] = form.endTime.split(':').map(Number);
        const diffHours = (endH + endM / 60) - (startH + startM / 60);

        if (diffHours > 4) {
          errors.maxHours = true;
          hasError = true;
        }
      }
    }
  }

  return !hasError;
}

async function submitForm() {
  if (!validateForm()) return;

  const payload: CreateLeaveRequestDTO = {
    type: form.leaveType,
    category: form.category,
    reason: form.reason,
    attachment: uploadedFile.value,
    startDate: isHarian.value ? form.startDate : form.singleDate,
    endDate: isHarian.value ? form.endDate : form.singleDate,
    startTime: isHarian.value ? null : form.startTime,
    endTime: isHarian.value ? null : form.endTime,
  };

  try {
    await leaveStore.createLeaveRequest(payload);
    showSuccess.value = true;
    setTimeout(() => {
      router.push({ name: "leaves-history" });
    }, 1500);
  } catch (error) {
    console.error("Gagal submit form:", error);
  }
}

function goBack() {
  router.push({ name: "leaves-history" });
}
</script>

<template>
  <div class="container">
    <div class="request-card">
      <div class="request-card__header">
        <h2>Pengajuan Cuti Guru</h2>
        <div v-if="isHarian" class="quota-badge">
          Sisa Jatah Cuti: <span>{{ leaveStore.leaveQuota }}</span> Hari
        </div>
      </div>

      <div class="request-card__body">
        <div v-if="showSuccess" class="alert-success">
          ✅ Pengajuan berhasil dikirim! Mengalihkan halaman...
        </div>

        <div v-if="leaveStore.error" class="alert-error">
          ⚠️ Gagal: {{ leaveStore.error }}
        </div>

        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label class="form-label">Tipe Izin</label>

            <div class="radio-group-container">
              <label class="radio-card">
                <input v-model="form.leaveType" type="radio" value="FULL_DAY" />
                <div class="radio-card-content">📅 Cuti Harian (Full Day)</div>
              </label>

              <label class="radio-card">
                <input v-model="form.leaveType" type="radio" value="PARTIAL" />
                <div class="radio-card-content">🕒 Izin Parsial (Jam)</div>
              </label>
            </div>
          </div>

          <div v-if="isHarian" id="sectionHarian">
            <div class="form-group">
              <div class="row">
                <div class="col">
                  <label class="form-label">
                    Tanggal Mulai <span class="required-star">*</span>
                  </label>
                  <input
                    v-model="form.startDate"
                    type="date"
                    class="form-control"
                    :class="{ 'is-invalid': errors.startDate || errors.dateRange || errors.pastDate || errors.quota || errors.onlyWeekend }"
                  />
                </div>

                <div class="col">
                  <label class="form-label">
                    Tanggal Selesai <span class="required-star">*</span>
                  </label>
                  <input
                    v-model="form.endDate"
                    type="date"
                    class="form-control"
                    :class="{ 'is-invalid': errors.endDate || errors.dateRange || errors.pastDate || errors.quota || errors.onlyWeekend }"
                  />
                </div>
              </div>

              <div v-if="errors.dateRange" class="error-message show">
                Tanggal selesai tidak boleh lebih awal dari tanggal mulai.
              </div>
              <div v-if="errors.pastDate" class="error-message show">
                Cuti tidak dapat diajukan untuk tanggal yang sudah lewat. Khusus kategori Sakit, maksimal pengajuan adalah 7 hari ke belakang.
              </div>
              <div v-if="errors.quota" class="error-message show">
                Jatah cuti Anda tidak mencukupi untuk jumlah hari yang diajukan.
              </div>
              <div v-if="errors.onlyWeekend" class="error-message show">
                Pengajuan ditolak: Tanggal yang Anda pilih jatuh sepenuhnya pada hari libur (Sabtu/Minggu).
              </div>

              <div class="note">
                Pilih tanggal yang sama jika hanya cuti 1 hari full. (Hari libur tidak memotong jatah cuti).
              </div>
            </div>
          </div>

          <div v-else id="sectionParsial">
            <div class="form-group">
              <label class="form-label">
                Tanggal Izin <span class="required-star">*</span>
              </label>
              <input
                v-model="form.singleDate"
                type="date"
                class="form-control"
                :class="{ 'is-invalid': errors.singleDate || errors.pastDate || errors.onlyWeekend }"
              />
              <div v-if="errors.pastDate" class="error-message show">
                Tidak dapat mengajukan izin parsial pada tanggal yang sudah lewat (Kecuali kategori Sakit).
              </div>
              <div v-if="errors.onlyWeekend" class="error-message show">
                Pengajuan ditolak: Anda tidak dapat mengajukan izin parsial di hari libur.
              </div>
            </div>

            <div class="form-group">
              <div class="row">
                <div class="col">
                  <label class="form-label">
                    Jam Mulai <span class="required-star">*</span>
                  </label>
                  <input
                    v-model="form.startTime"
                    type="time"
                    class="form-control"
                    :class="{ 'is-invalid': errors.startTime || errors.timeRange || errors.maxHours }"
                  />
                </div>

                <div class="col">
                  <label class="form-label">
                    Jam Selesai <span class="required-star">*</span>
                  </label>
                  <input
                    v-model="form.endTime"
                    type="time"
                    class="form-control"
                    :class="{ 'is-invalid': errors.endTime || errors.timeRange || errors.maxHours }"
                  />
                </div>
              </div>

              <div v-if="errors.timeRange" class="error-message show">
                Jam selesai harus lebih besar dari jam mulai.
              </div>
              <div v-if="errors.maxHours" class="error-message show">
                Izin parsial maksimal 4 jam. Jika lebih, silakan ubah tipe izin menjadi Cuti Harian (Full Day).
              </div>
              <div class="note">Contoh: 08:00 - 10:00. Maksimal izin adalah 4 Jam.</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Kategori Izin <span class="required-star">*</span>
            </label>

            <select
              v-model="form.category"
              class="form-control"
              :class="{ 'is-invalid': errors.category }"
            >
              <option value="">Pilih kategori izin</option>
              <option value="IZIN_PRIBADI">Izin Pribadi</option>
              <option value="SAKIT">Sakit</option>
              <option value="DINAS_LUAR">Keperluan Dinas Luar</option>
              <option value="MELAHIRKAN">Melahirkan</option>
            </select>
            <div v-if="errors.category" class="error-message show">
              Kategori izin wajib dipilih.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Alasan / Keterangan <span class="required-star">*</span>
            </label>
            <textarea
              v-model="form.reason"
              class="form-control textarea-control"
              :class="{ 'is-invalid': errors.reason }"
              rows="4"
              placeholder="Tuliskan alasan pengajuan cuti / izin..."
            />
            <div v-if="errors.reason" class="error-message show">
              Alasan pengajuan wajib diisi.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Unggah Dokumen Pendukung
              <span v-if="isSakit" class="required-star">*</span>
            </label>
            <input
              type="file"
              class="form-control"
              accept=".jpg,.jpeg,.png,.pdf"
              @change="handleFileChange"
              :class="{ 'is-invalid': errors.document }"
            />
            <div v-if="errors.document" class="error-message show">
              Dokumen pendukung wajib diunggah untuk kategori Sakit.
            </div>
            <div class="note">Format: PDF/JPG/PNG. Maks 2MB. Wajib untuk kategori Sakit.</div>
          </div>

          <div class="action-row">
            <button type="button" class="btn-secondary" @click="goBack" :disabled="leaveStore.isLoading">
              Batal
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isFormInvalid || leaveStore.isLoading"
            >
              {{ leaveStore.isLoading ? 'Mengirim...' : 'Ajukan Permohonan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
}

.request-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.request-card__header {
  padding: 24px 32px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-card__header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.request-card__body {
  padding: 32px;
}

.quota-badge {
  background-color: #ecfdf5;
  color: var(--primary);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

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
  padding: 12px 16px;
  font-family: var(--font);
  font-size: 15px;
  color: var(--text-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-sizing: border-box;
  transition: all 0.2s;
  background: var(--white);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.1);
}

.form-control:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.textarea-control {
  resize: vertical;
  min-height: 110px;
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

.note {
  font-size: 12px;
  color: var(--text-grey);
  margin-top: 6px;
}

.required-star {
  color: #dc2626;
}

.row {
  display: flex;
  gap: 20px;
}

.col {
  flex: 1;
}

.radio-group-container {
  display: flex;
  gap: 16px;
}

.radio-card {
  flex: 1;
  position: relative;
}

.radio-card input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.radio-card-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: var(--text-grey);
  background: var(--white);
}

.radio-card input:checked + .radio-card-content {
  border-color: var(--primary);
  background-color: #ecfdf5;
  color: var(--primary);
  font-weight: 700;
}

.alert-success {
  background-color: #ecfdf5;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-weight: 500;
}

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #dc2626;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-weight: 500;
}

.action-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 28px;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 160px;
  padding: 12px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: var(--white);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--white);
  color: var(--text-dark);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .request-card__header,
  .action-row,
  .row,
  .radio-group-container {
    flex-direction: column;
  }

  .request-card__header {
    align-items: flex-start;
    gap: 12px;
  }

  .action-row .btn-primary,
  .action-row .btn-secondary {
    width: 100%;
  }
}
</style>
