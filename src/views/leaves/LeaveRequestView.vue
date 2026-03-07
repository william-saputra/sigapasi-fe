<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";

type LeaveType = "harian" | "parsial";

const router = useRouter();
const leaveQuota = 4;

const showSuccess = ref(false);
const uploadedFile = ref<File | null>(null);

const form = reactive({
  leaveType: "harian" as LeaveType,
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
});

const isHarian = computed(() => form.leaveType === "harian");
const isSakit = computed(() => form.category === "sakit");

function resetErrors() {
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = false;
  });
  showSuccess.value = false;
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

function calculateDaysInclusive(start: string, end: string) {
  const startDate = toDateOnly(start);
  const endDate = toDateOnly(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function validateForm() {
  resetErrors();
  let hasError = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isHarian.value) {
    if (!form.startDate) {
      errors.startDate = true;
      hasError = true;
    }
    if (!form.endDate) {
      errors.endDate = true;
      hasError = true;
    }

    if (form.startDate && form.endDate) {
      const start = toDateOnly(form.startDate);
      const end = toDateOnly(form.endDate);

      if (end < start) {
        errors.dateRange = true;
        hasError = true;
      }

      if (!isSakit.value && (start < today || end < today)) {
        errors.pastDate = true;
        hasError = true;
      }

      const totalDays = calculateDaysInclusive(form.startDate, form.endDate);
      if (totalDays > leaveQuota) {
        errors.quota = true;
        hasError = true;
      }
    }
  } else {
    if (!form.singleDate) {
      errors.singleDate = true;
      hasError = true;
    }
    if (!form.startTime) {
      errors.startTime = true;
      hasError = true;
    }
    if (!form.endTime) {
      errors.endTime = true;
      hasError = true;
    }

    if (form.singleDate) {
      const single = toDateOnly(form.singleDate);
      if (!isSakit.value && single < today) {
        errors.pastDate = true;
        hasError = true;
      }
    }

    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      errors.timeRange = true;
      hasError = true;
    }
  }

  if (!form.category) {
    errors.category = true;
    hasError = true;
  }

  if (!form.reason.trim()) {
    errors.reason = true;
    hasError = true;
  }

  if (isSakit.value && !uploadedFile.value) {
    errors.document = true;
    hasError = true;
  }

  return !hasError;
}

function submitForm() {
  if (!validateForm()) return;

  showSuccess.value = true;

  // nanti bisa diganti ke API submit
  console.log("Submit payload", {
    ...form,
    document: uploadedFile.value?.name ?? null,
  });
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
        <div class="quota-badge">
          Sisa Jatah Cuti: <span>{{ leaveQuota }}</span> Hari
        </div>
      </div>

      <div class="request-card__body">
        <div v-if="showSuccess" class="alert-success">
          ✅ Pengajuan berhasil dikirim! Status saat ini:
          <strong>Pending Approval</strong>.
        </div>

        <form @submit.prevent="submitForm">
          <!-- Tipe Izin -->
          <div class="form-group">
            <label class="form-label">Tipe Izin</label>

            <div class="radio-group-container">
              <label class="radio-card">
                <input v-model="form.leaveType" type="radio" value="harian" />
                <div class="radio-card-content">📅 Cuti Harian (Full Day)</div>
              </label>

              <label class="radio-card">
                <input v-model="form.leaveType" type="radio" value="parsial" />
                <div class="radio-card-content">🕒 Izin Parsial (Jam)</div>
              </label>
            </div>
          </div>

          <!-- Mode Harian -->
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
                    :class="{ 'is-invalid': errors.startDate || errors.dateRange || errors.pastDate || errors.quota }"
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
                    :class="{ 'is-invalid': errors.endDate || errors.dateRange || errors.pastDate || errors.quota }"
                  />
                </div>
              </div>

              <div v-if="errors.dateRange" class="error-message show">
                Tanggal selesai tidak boleh lebih awal dari tanggal mulai.
              </div>
              <div v-if="errors.pastDate" class="error-message show">
                Tidak dapat mengajukan cuti pada tanggal yang sudah lewat (Kecuali kategori Sakit).
              </div>
              <div v-if="errors.quota" class="error-message show">
                Jatah cuti Anda tidak mencukupi untuk jumlah hari yang diajukan.
              </div>

              <div class="note">
                Pilih tanggal yang sama jika hanya cuti 1 hari full.
              </div>
            </div>
          </div>

          <!-- Mode Parsial -->
          <div v-else id="sectionParsial">
            <div class="form-group">
              <label class="form-label">
                Tanggal Izin <span class="required-star">*</span>
              </label>
              <input
                v-model="form.singleDate"
                type="date"
                class="form-control"
                :class="{ 'is-invalid': errors.singleDate || errors.pastDate }"
              />
              <div v-if="errors.pastDate" class="error-message show">
                Tidak dapat mengajukan izin parsial pada tanggal yang sudah lewat (Kecuali kategori Sakit).
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
                    :class="{ 'is-invalid': errors.startTime || errors.timeRange }"
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
                    :class="{ 'is-invalid': errors.endTime || errors.timeRange }"
                  />
                </div>
              </div>

              <div v-if="errors.timeRange" class="error-message show">
                Jam selesai harus lebih besar dari jam mulai.
              </div>
              <div class="note">Contoh: 08:00 - 10:00.</div>
            </div>
          </div>

          <!-- Kategori -->
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
              <option value="pribadi">Izin Pribadi</option>
              <option value="sakit">Sakit</option>
              <option value="keluarga">Keperluan Keluarga</option>
              <option value="dinas">Keperluan Dinas</option>
            </select>
            <div v-if="errors.category" class="error-message show">
              Kategori izin wajib dipilih.
            </div>
          </div>

          <!-- Alasan -->
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

          <!-- Upload -->
          <div class="form-group">
            <label class="form-label">
              Unggah Dokumen Pendukung
              <span v-if="isSakit" class="required-star">*</span>
            </label>
            <input
              type="file"
              class="form-control"
              accept=".jpg,.png,.pdf"
              @change="handleFileChange"
              :class="{ 'is-invalid': errors.document }"
            />
            <div v-if="errors.document" class="error-message show">
              Dokumen pendukung wajib diunggah untuk kategori Sakit.
            </div>
            <div class="note">Format: PDF/JPG/PNG. Maks 2MB. Wajib untuk kategori Sakit.</div>
          </div>

          <!-- Actions -->
          <div class="action-row">
            <button type="button" class="btn-secondary" @click="goBack">
              Kembali
            </button>
            <button type="submit" class="btn-primary">
              Ajukan Permohonan
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

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--white);
  color: var(--text-dark);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: #f9fafb;
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
