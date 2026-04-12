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

type AspectKey = 'pedagogik' | 'kepribadian' | 'sosial' | 'profesional' | 'digitalSkill'

type QuestionGroup = {
  sectionTitle: string
  sectionShort: string
  aspect: AspectKey
  questions: string[]
}

type QuantitativeQuestion = {
  id: string
  number: number
  text: string
  aspect: AspectKey
  sectionTitle: string
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Sangat Kurang',
  2: 'Kurang',
  3: 'Cukup',
  4: 'Baik',
  5: 'Sangat Baik',
}

const QUESTION_GROUPS: QuestionGroup[] = [
  {
    sectionTitle: 'A. Kompetensi Pedagogik',
    sectionShort: 'Pedagogik',
    aspect: 'pedagogik',
    questions: [
      'Guru menyusun tujuan pembelajaran yang jelas dan terukur.',
      'Guru menyesuaikan strategi mengajar dengan kebutuhan siswa.',
      'Guru membuka pelajaran dengan aktivitas yang memotivasi siswa.',
      'Guru memberi penjelasan materi dengan runtut dan mudah dipahami.',
      'Guru menggunakan asesmen formatif untuk memantau pemahaman siswa.',
      'Guru memberikan umpan balik yang konstruktif kepada siswa.',
      'Guru mengelola waktu pembelajaran secara efektif.',
      'Guru mendorong partisipasi aktif dari seluruh siswa.',
      'Guru menutup pelajaran dengan rangkuman dan refleksi.',
      'Guru memanfaatkan hasil evaluasi untuk perbaikan pembelajaran.',
    ],
  },
  {
    sectionTitle: 'B. Kompetensi Kepribadian',
    sectionShort: 'Kepribadian',
    aspect: 'kepribadian',
    questions: [
      'Guru menunjukkan integritas dan keteladanan dalam bersikap.',
      'Guru bersikap konsisten antara perkataan dan tindakan.',
      'Guru menjaga emosi dan bersikap dewasa dalam situasi sulit.',
      'Guru menunjukkan disiplin terhadap waktu dan tanggung jawab.',
      'Guru terbuka terhadap masukan untuk pengembangan diri.',
      'Guru menunjukkan rasa percaya diri saat menjalankan tugas.',
      'Guru menghormati perbedaan latar belakang siswa dan rekan kerja.',
      'Guru menjaga etika komunikasi dalam setiap interaksi.',
    ],
  },
  {
    sectionTitle: 'C. Kompetensi Sosial',
    sectionShort: 'Sosial',
    aspect: 'sosial',
    questions: [
      'Guru berkomunikasi efektif dengan siswa di dalam dan luar kelas.',
      'Guru bekerja sama dengan rekan guru dalam kegiatan sekolah.',
      'Guru berkolaborasi dengan wali kelas atau BK untuk kebutuhan siswa.',
      'Guru menjalin hubungan positif dengan orang tua siswa.',
      'Guru aktif berkontribusi dalam kegiatan komunitas sekolah.',
      'Guru menyampaikan informasi dengan jelas kepada pihak terkait.',
      'Guru merespons konflik secara bijak dan solutif.',
      'Guru menunjukkan empati terhadap kebutuhan siswa dan rekan kerja.',
    ],
  },
  {
    sectionTitle: 'D. Kompetensi Profesional',
    sectionShort: 'Profesional',
    aspect: 'profesional',
    questions: [
      'Guru menguasai materi ajar sesuai bidang keilmuan.',
      'Guru memperbarui pengetahuan sesuai perkembangan kurikulum.',
      'Guru menyusun perangkat ajar dengan kualitas yang baik.',
      'Guru melaksanakan evaluasi hasil belajar secara objektif.',
      'Guru menggunakan data hasil belajar untuk tindak lanjut.',
      'Guru menunjukkan komitmen pada standar mutu pembelajaran.',
      'Guru aktif mengikuti pelatihan atau pengembangan kompetensi.',
      'Guru mendokumentasikan proses pembelajaran dengan rapi.',
    ],
  },
  {
    sectionTitle: 'E. Kompetensi Digital Skill',
    sectionShort: 'Digital',
    aspect: 'digitalSkill',
    questions: [
      'Guru memanfaatkan LMS atau platform digital untuk pembelajaran.',
      'Guru menggunakan media digital yang relevan dengan tujuan belajar.',
      'Guru mengelola materi ajar digital secara terstruktur.',
      'Guru mengoptimalkan alat kolaborasi daring dengan efektif.',
      'Guru menerapkan etika dan keamanan digital dalam pembelajaran.',
      'Guru membantu siswa menggunakan teknologi secara produktif.',
      'Guru memanfaatkan data dari platform digital untuk refleksi.',
      'Guru mengeksplorasi inovasi teknologi untuk meningkatkan kualitas mengajar.',
    ],
  },
]

function buildQuestionList(): QuantitativeQuestion[] {
  const result: QuantitativeQuestion[] = []
  let number = 1

  for (const group of QUESTION_GROUPS) {
    for (let i = 0; i < group.questions.length; i += 1) {
      const questionText = group.questions[i]
      if (!questionText) {
        continue
      }

      result.push({
        id: `${group.aspect}-${i + 1}`,
        number,
        text: questionText,
        aspect: group.aspect,
        sectionTitle: group.sectionTitle,
      })
      number += 1
    }
  }

  return result
}

const quantitativeQuestions = buildQuestionList()

const questionScores = reactive<Record<string, number>>(
  quantitativeQuestions.reduce(
    (acc, item) => {
      acc[item.id] = 3
      return acc
    },
    {} as Record<string, number>,
  ),
)

const questionTouched = reactive<Record<string, boolean>>(
  quantitativeQuestions.reduce(
    (acc, item) => {
      acc[item.id] = false
      return acc
    },
    {} as Record<string, boolean>,
  ),
)

const form = reactive({
  comment: '',
})

const MIN_COMMENT_LENGTH = 30

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const taskId = computed(() => String(route.params.taskId ?? ''))
const isReadOnly = computed(() => route.query.mode === 'readonly')

const groupedQuestions = computed(() => {
  return QUESTION_GROUPS.map((group) => ({
    sectionTitle: group.sectionTitle,
    sectionShort: group.sectionShort,
    aspect: group.aspect,
    questions: quantitativeQuestions.filter((q) => q.aspect === group.aspect),
  }))
})

const touchedQuestionCount = computed(() =>
  quantitativeQuestions.reduce((sum, question) => sum + (questionTouched[question.id] ? 1 : 0), 0),
)

const completionPercent = computed(() => {
  if (quantitativeQuestions.length === 0) return 0
  return Math.round((touchedQuestionCount.value / quantitativeQuestions.length) * 100)
})

const qualitativeFilled = computed(() => form.comment.trim().length >= MIN_COMMENT_LENGTH)

const commentCharCount = computed(() => form.comment.length)

const commentProgress = computed(() =>
  Math.min(100, Math.round((form.comment.trim().length / MIN_COMMENT_LENGTH) * 100)),
)

const submitHelperText = computed(() => {
  if (!qualitativeFilled.value) {
    const remaining = MIN_COMMENT_LENGTH - form.comment.trim().length
    return `Masukan kualitatif perlu ${remaining} karakter lagi.`
  }

  if (touchedQuestionCount.value === 0) {
    return 'Nilai default adalah 3 (Cukup). Geser slider jika ingin menyesuaikan.'
  }

  return `${touchedQuestionCount.value} dari ${quantitativeQuestions.length} pertanyaan disesuaikan.`
})

function markQuestionTouched(questionId: string) {
  questionTouched[questionId] = true
}

function getGroupTouchedCount(aspect: AspectKey): number {
  return quantitativeQuestions.reduce((sum, question) => {
    if (question.aspect !== aspect) return sum
    return sum + (questionTouched[question.id] ? 1 : 0)
  }, 0)
}

function getAspectScore(aspect: AspectKey): number {
  const aspectQuestions = quantitativeQuestions.filter((q) => q.aspect === aspect)

  if (aspectQuestions.length === 0) {
    return 3
  }

  const total = aspectQuestions.reduce((sum, q) => sum + (questionScores[q.id] ?? 3), 0)
  const average = total / aspectQuestions.length

  return Math.min(5, Math.max(1, Math.round(average)))
}

function scrollToSection(aspect: AspectKey) {
  const el = document.getElementById(`section-${aspect}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function buildPayload(): ReviewSubmitRequest {
  return {
    taskId: taskId.value,
    pedagogik: getAspectScore('pedagogik'),
    kepribadian: getAspectScore('kepribadian'),
    sosial: getAspectScore('sosial'),
    profesional: getAspectScore('profesional'),
    digitalSkill: getAspectScore('digitalSkill'),
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

  if (form.comment.trim().length < MIN_COMMENT_LENGTH) {
    submitError.value = `Masukan kualitatif minimal ${MIN_COMMENT_LENGTH} karakter.`
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
        Nilai default semua pertanyaan adalah <strong>3 — Cukup</strong>.
      </p>

      <!-- Score legend -->
      <div class="score-legend">
        <span v-for="(label, score) in SCORE_LABELS" :key="score" class="legend-item">
          <span class="legend-badge">{{ score }}</span>
          <span class="legend-label">{{ label }}</span>
        </span>
      </div>

      <div class="form-progress">
        <div class="form-progress-head">
          <strong class="progress-title">Progress Penyesuaian Pertanyaan</strong>
          <span class="progress-metric"
            >{{ touchedQuestionCount }}/{{ quantitativeQuestions.length }} ({{
              completionPercent
            }}%)</span
          >
        </div>
        <div class="form-progress-track">
          <div class="form-progress-fill" :style="{ width: `${completionPercent}%` }" />
        </div>
        <p class="form-progress-note">
          Geser poin yang ingin Anda sesuaikan — pertanyaan yang belum disentuh tetap di nilai 3.
        </p>
      </div>

      <!-- Section jump nav -->
      <div v-if="!isReadOnly" class="section-nav">
        <span class="section-nav-label">Lompat ke:</span>
        <button
          v-for="group in groupedQuestions"
          :key="group.aspect"
          class="section-nav-btn"
          :class="{ 'section-nav-btn--done': getGroupTouchedCount(group.aspect) === group.questions.length }"
          type="button"
          @click="scrollToSection(group.aspect)"
        >
          {{ group.sectionShort }}
          <span v-if="getGroupTouchedCount(group.aspect) > 0" class="section-nav-count">
            {{ getGroupTouchedCount(group.aspect) }}/{{ group.questions.length }}
          </span>
        </button>
        <button class="section-nav-btn" type="button" @click="scrollToSection('qualitative')">
          Masukan
          <span v-if="qualitativeFilled" class="section-nav-count section-nav-count--done">✓</span>
        </button>
      </div>

      <div class="form-section">
        <h4 class="section-title">A–E. Penilaian Kompetensi ({{ quantitativeQuestions.length }} Pertanyaan)</h4>

        <div
          v-for="group in groupedQuestions"
          :id="`section-${group.aspect}`"
          :key="group.sectionTitle"
          class="group-block"
        >
          <div class="group-head">
            <h5 class="group-title">{{ group.sectionTitle }}</h5>
            <span class="group-progress"
              >{{ getGroupTouchedCount(group.aspect) }}/{{
                group.questions.length
              }}
              disesuaikan</span
            >
          </div>

          <div v-for="question in group.questions" :key="question.id" class="slider-group">
            <div class="slider-head">
              <label class="slider-label" :for="`slider-${question.id}`">
                {{ question.number }}. {{ question.text }}
              </label>
              <span class="slider-value-block">
                <span class="slider-value">{{ questionScores[question.id] }}</span>
                <span class="slider-value-label">{{ SCORE_LABELS[questionScores[question.id]] }}</span>
              </span>
            </div>

            <div class="slider-row">
              <span class="slider-bound">1</span>
              <input
                :id="`slider-${question.id}`"
                v-model.number="questionScores[question.id]"
                type="range"
                min="1"
                max="5"
                step="1"
                :disabled="isReadOnly || isSubmitting"
                class="slider-input"
                :class="{ 'slider-input--touched': questionTouched[question.id] }"
                :aria-label="`${question.number}. ${question.text} (skala 1-5, sekarang ${questionScores[question.id]})`"
                @input="markQuestionTouched(question.id)"
              />
              <span class="slider-bound">5</span>
            </div>

            <div v-if="!questionTouched[question.id] && !isReadOnly" class="slider-hint">
              Belum disesuaikan — nilai default 3 (Cukup)
            </div>
          </div>
        </div>
      </div>

      <div id="section-qualitative" class="form-section">
        <h4 class="section-title">F. Masukan Kualitatif</h4>
        <label class="textarea-label" for="qualitative-comment">
          <span>
            Hal apa yang perlu ditingkatkan?
            <span class="textarea-required">*</span>
          </span>
          <span
            class="textarea-count"
            :class="{
              'textarea-count--warn': commentCharCount > 0 && !qualitativeFilled,
              'textarea-count--ok': qualitativeFilled,
            }"
          >
            {{ commentCharCount }} karakter
            <span v-if="!qualitativeFilled && commentCharCount > 0">
              (min. {{ MIN_COMMENT_LENGTH }})
            </span>
            <span v-if="qualitativeFilled"> ✓</span>
          </span>
        </label>
        <textarea
          id="qualitative-comment"
          v-model="form.comment"
          rows="5"
          class="textarea-input"
          :class="{ 'textarea-input--ok': qualitativeFilled }"
          :disabled="isReadOnly || isSubmitting"
          placeholder="Tulis masukan spesifik mengenai hal yang dapat ditingkatkan oleh guru ini..."
        />
        <div v-if="!isReadOnly && commentCharCount > 0 && !qualitativeFilled" class="comment-progress-track">
          <div class="comment-progress-fill" :style="{ width: `${commentProgress}%` }" />
        </div>
      </div>

      <p v-if="isReadOnly" class="readonly-note">
        Tugas ini sudah berstatus selesai. Form ditampilkan dalam mode baca saja.
      </p>

      <div v-if="submitError" class="note-box danger form-error">{{ submitError }}</div>

      <div v-if="!isReadOnly" class="form-actions">
        <p class="submit-meta" :class="{ 'submit-meta--warn': !qualitativeFilled }">
          {{ submitHelperText }}
        </p>
        <button
          type="button"
          class="btn-submit"
          :disabled="isSubmitting || !qualitativeFilled"
          :title="!qualitativeFilled ? 'Lengkapi masukan kualitatif terlebih dahulu' : ''"
          @click="submitReview"
        >
          {{ isSubmitting ? 'Mengirim...' : 'Submit Penilaian' }}
        </button>
      </div>
    </AppCard>
  </AppLayout>
</template>

<style scoped>
.back-nav {
  margin-bottom: 10px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  cursor: pointer;
  font-family: var(--font);
}

.btn-back:hover {
  background: var(--bg-light);
}

.btn-back:focus-visible {
  outline: 2px solid #bbf7d0;
  outline-offset: 2px;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.form-title {
  margin: 0;
  font-size: 18px;
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
  margin: 14px 0 0;
  color: var(--text-grey);
  font-size: 14px;
  background: #ecfdf5;
  border: 1px solid #d1fae5;
  border-radius: 10px;
  padding: 10px 12px;
}

/* Score legend */
.score-legend {
  margin-top: 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
}

.legend-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--primary);
  color: var(--white);
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.legend-label {
  font-size: 12px;
  color: var(--text-grey);
  font-weight: 500;
}

.form-progress {
  margin-top: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #f8fafc;
  padding: 12px;
}

.form-progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.progress-title {
  font-size: 13px;
  color: var(--text-dark);
}

.progress-metric {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-grey);
}

.form-progress-track {
  margin-top: 8px;
  width: 100%;
  height: 7px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.form-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #166534, #22c55e);
  border-radius: inherit;
  transition: width 0.2s ease;
}

.form-progress-note {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-grey);
}

/* Section jump nav */
.section-nav {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f8fafc;
}

.section-nav-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-grey);
  margin-right: 2px;
}

.section-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dark);
  cursor: pointer;
  font-family: var(--font);
  transition: background 0.15s, border-color 0.15s;
}

.section-nav-btn:hover {
  background: #ecfdf5;
  border-color: #bbf7d0;
  color: #047857;
}

.section-nav-btn--done {
  border-color: #bbf7d0;
  background: #ecfdf5;
  color: #047857;
}

.section-nav-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #047857;
  background: #bbf7d0;
  border-radius: 999px;
  padding: 1px 5px;
  line-height: 1;
}

.section-nav-count--done {
  background: #047857;
  color: #fff;
}

.form-section {
  margin-top: 32px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 24px;
  color: var(--text-dark);
}

.group-block {
  margin-top: 32px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #f9fafb;
  padding: 16px;
  scroll-margin-top: 80px;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.group-title {
  margin: 0;
  color: var(--text-dark);
  font-size: 18px;
}

.group-progress {
  display: inline-flex;
  align-items: center;
  border: 1px solid #bbf7d0;
  background: #ecfdf5;
  color: #047857;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.slider-group {
  padding: 16px 20px;
  border: 1px solid var(--border);
  background: var(--white);
  border-radius: 10px;
  margin-top: 12px;
}

.slider-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 16px;
}

.slider-label {
  font-size: 14px;
  color: var(--text-dark);
  font-weight: 600;
  line-height: 1.4;
}

/* Grouped score badge + label */
.slider-value-block {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.slider-value {
  min-width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 13px;
  color: var(--white);
  background: var(--primary);
  font-weight: 700;
  flex-shrink: 0;
}

.slider-value-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-grey);
  white-space: nowrap;
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

.slider-input:focus-visible {
  outline: 2px solid #bbf7d0;
  outline-offset: 2px;
}

/* Subtle indicator for untouched sliders */
.slider-hint {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-grey);
  opacity: 0.7;
  font-style: italic;
}

/* Qualitative section */
#section-qualitative {
  scroll-margin-top: 80px;
}

.textarea-required {
  color: #dc2626;
  margin-left: 2px;
}

.textarea-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.textarea-count {
  font-size: 12px;
  color: var(--text-grey);
  font-weight: 500;
  transition: color 0.2s;
}

.textarea-count--warn {
  color: #b45309;
}

.textarea-count--ok {
  color: #047857;
  font-weight: 700;
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
  min-height: 126px;
  transition: border-color 0.2s;
}

.textarea-input:focus {
  outline: 2px solid #bbf7d0;
  border-color: var(--primary);
}

.textarea-input--ok {
  border-color: #22c55e;
}

/* Comment minimum-length progress */
.comment-progress-track {
  margin-top: 6px;
  width: 100%;
  height: 3px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.comment-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #b45309, #22c55e);
  border-radius: inherit;
  transition: width 0.2s ease;
}

.readonly-note {
  margin: 18px 0 0;
  font-size: 13px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 10px 12px;
}

.form-error {
  margin-top: 12px;
}

.form-actions {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  position: sticky;
  bottom: 0;
  background: linear-gradient(to top, var(--white) 75%, rgba(255, 255, 255, 0));
  padding-top: 14px;
}

.submit-meta {
  margin: 0;
  font-size: 13px;
  color: var(--text-grey);
  text-align: right;
}

.submit-meta--warn {
  color: #b45309;
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

.btn-submit:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-submit:focus-visible {
  outline: 2px solid #86efac;
  outline-offset: 2px;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--text-grey);
  border-color: var(--text-grey);
}

@media (max-width: 768px) {
  .form-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-progress-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-title {
    font-size: 20px;
  }

  .group-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .slider-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .slider-value-block {
    flex-direction: row;
  }

  .score-legend {
    gap: 4px;
  }

  .form-actions {
    position: static;
    flex-direction: column;
    align-items: stretch;
  }

  .submit-meta {
    text-align: left;
  }

  .btn-submit {
    width: 100%;
  }

  .section-nav {
    gap: 4px;
  }
}
</style>
