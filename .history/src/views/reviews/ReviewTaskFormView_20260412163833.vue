<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

import AppLayout from '@/components/common/AppLayout.vue'
import AppCard from '@/components/common/AppCard.vue'
import PageHeader from '@/components/header/PageHeader.vue'
import apiService from '@/services/api.service'
import type { ReviewSubmitRequest } from '@/interfaces/reviews/review-submit.interface'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const taskId = computed(() => String(route.params.taskId ?? ''))
const isReadOnly = computed(() => route.query.mode === 'readonly')

const form = reactive<Omit<ReviewSubmitRequest, 'taskId'>>({
  pedagogik: 3,
  kepribadian: 3,
  sosial: 3,
  profesional: 3,
  digitalSkill: 3,
  comment: '',
})

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const aspectFields: Array<{
  key: keyof Omit<ReviewSubmitRequest, 'taskId' | 'comment'>
  label: string
}> = [
  { key: 'pedagogik', label: 'Pedagogik' },
  { key: 'kepribadian', label: 'Kepribadian' },
  { key: 'sosial', label: 'Sosial' },
  { key: 'profesional', label: 'Profesional' },
  { key: 'digitalSkill', label: 'Digital Skill' },
]

function buildPayload(): ReviewSubmitRequest {
  return {
    taskId: taskId.value,
    pedagogik: form.pedagogik,
    kepribadian: form.kepribadian,
    sosial: form.sosial,
    profesional: form.profesional,
    digitalSkill: form.digitalSkill,
    comment: form.comment.trim(),
  }
}

function validateForm(): boolean {
  submitError.value = null

  if (!taskId.value) {
    submitError.value = 'Task ID tidak valid.'
    return false
  }

  if (!form.comment.trim()) {
    submitError.value = 'Masukan kualitatif wajib diisi.'
    return false
  }

  return true
}

async function submitReview() {
  if (isReadOnly.value) return
  if (!validateForm()) return

  isSubmitting.value = true
  submitError.value = null

  try {
    await apiService.post<void>('/reviews/submit', buildPayload())
    toast.success('Penilaian berhasil dikirim.')
    router.push({ name: 'reviews-home' })
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status

    if (status === 400) {
      submitError.value =
        'Data penilaian tidak valid. Pastikan semua nilai sesuai rentang 1 sampai 5.'
    } else if (status === 403) {
      submitError.value =
        'Anda tidak memiliki akses untuk mengirim tugas ini atau tugas sudah completed.'
    } else if (status === 404) {
      submitError.value = 'Tugas review tidak ditemukan.'
    } else {
      submitError.value = 'Gagal mengirim penilaian. Silakan coba lagi.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="back-nav">
      <button class="btn-back" @click="router.push({ name: 'reviews-home' })">
        ← Kembali ke Daftar Tugas
      </button>
    </div>

    <PageHeader
      title="Form Evaluasi Guru"
      subtitle="Pengisian 360 Review berdasarkan tugas yang dipilih."
    />

    <AppCard>
      <div class="form-head">
        <h3 class="form-title">Task ID: {{ taskId }}</h3>
        <span class="mode-chip" :class="{ 'mode-chip--readonly': isReadOnly }">
          {{ isReadOnly ? 'Read-Only' : 'Editable' }}
        </span>
      </div>

      <p class="form-note">
        Petunjuk: Berikan penilaian objektif dari skala 1 (Sangat Kurang) sampai 5 (Sangat Baik).
      </p>

      <div class="form-section">
        <h4 class="section-title">A. Penilaian Kompetensi</h4>

        <div v-for="aspect in aspectFields" :key="aspect.key" class="slider-group">
          <div class="slider-head">
            <label class="slider-label">{{ aspect.label }}</label>
            <span class="slider-value">{{ form[aspect.key] }}</span>
          </div>

          <div class="slider-row">
            <span class="slider-bound">1</span>
            <input
              :id="`slider-${aspect.key}`"
              v-model.number="form[aspect.key]"
              type="range"
              min="1"
              max="5"
              step="1"
              :disabled="isReadOnly || isSubmitting"
              class="slider-input"
            />
            <span class="slider-bound">5</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h4 class="section-title">B. Masukan Kualitatif</h4>
        <label class="textarea-label" for="qualitative-comment"
          >Hal apa yang perlu ditingkatkan?</label
        >
        <textarea
          id="qualitative-comment"
          v-model="form.comment"
          rows="4"
          class="textarea-input"
          :disabled="isReadOnly || isSubmitting"
          placeholder="Tulis masukan Anda di sini..."
        />
      </div>

      <p v-if="isReadOnly" class="readonly-note">
        Tugas ini sudah berstatus selesai. Form ditampilkan dalam mode baca saja.
      </p>

      <div v-if="submitError" class="note-box danger">{{ submitError }}</div>

      <div v-if="!isReadOnly" class="form-actions">
        <button type="button" class="btn-submit" :disabled="isSubmitting" @click="submitReview">
          {{ isSubmitting ? 'Mengirim...' : 'Submit Penilaian' }}
        </button>
      </div>
    </AppCard>
  </AppLayout>
</template>

<style scoped>
.back-nav {
  margin-bottom: 8px;
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
}

.btn-back:hover {
  background: var(--bg-light);
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
}

.mode-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid #d1fae5;
  background: #ecfdf5;
  color: #047857;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
}

.mode-chip--readonly {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.form-note {
  margin: 12px 0 0;
  color: var(--text-grey);
  font-size: 14px;
  background: #ecfdf5;
  border: 1px solid #d1fae5;
  border-radius: 10px;
  padding: 10px 12px;
}

.form-section {
  margin-top: 20px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 20px;
  color: var(--text-dark);
}

.slider-group {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.slider-group:last-child {
  border-bottom: none;
}

.slider-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slider-label {
  font-size: 15px;
  color: var(--text-dark);
  font-weight: 600;
}

.slider-value {
  font-size: 14px;
  color: var(--primary);
  font-weight: 700;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-bound {
  color: var(--text-grey);
  font-size: 12px;
  font-weight: 600;
}

.slider-input {
  width: 100%;
  accent-color: var(--primary);
}

.textarea-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.textarea-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: var(--font);
  color: var(--text-dark);
  resize: vertical;
  min-height: 110px;
}

.textarea-input:focus {
  outline: 2px solid #bbf7d0;
  border-color: var(--primary);
}

.readonly-note {
  margin: 14px 0 0;
  font-size: 13px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 10px 12px;
}

.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.btn-submit {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--white);
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-submit:hover {
  background: var(--primary-hover);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    justify-content: stretch;
  }

  .btn-submit {
    width: 100%;
  }
}
</style>
