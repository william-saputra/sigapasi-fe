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
      if (!questionText) continue
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

// Default 0 = belum dipilih
const questionScores = reactive<Record<string, number>>(
  quantitativeQuestions.reduce(
    (acc, item) => {
      acc[item.id] = 0
      return acc
    },
    {} as Record<string, number>,
  ),
)

const form = reactive({ comment: '' })
const MIN_COMMENT_LENGTH = 30
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const taskId = computed(() => String(route.params.taskId ?? ''))
const isReadOnly = computed(() => route.query.mode === 'readonly')

const groupedQuestions = computed(() =>
  QUESTION_GROUPS.map((group) => ({
    sectionTitle: group.sectionTitle,
    sectionShort: group.sectionShort,
    aspect: group.aspect,
    questions: quantitativeQuestions.filter((q) => q.aspect === group.aspect),
  })),
)

const answeredQuestionCount = computed(() =>
  quantitativeQuestions.reduce((sum, q) => sum + (questionScores[q.id!] > 0 ? 1 : 0), 0),
)

const completionPercent = computed(() => {
  if (quantitativeQuestions.length === 0) return 0
  return Math.round((answeredQuestionCount.value / quantitativeQuestions.length) * 100)
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
  if (answeredQuestionCount.value < quantitativeQuestions.length) {
    const remaining = quantitativeQuestions.length - answeredQuestionCount.value
    return `${remaining} pertanyaan belum dijawab.`
  }
  return 'Semua pertanyaan telah dijawab. Siap dikirim.'
})

const canSubmit = computed(
  () => qualitativeFilled.value && answeredQuestionCount.value === quantitativeQuestions.length,
)

function setScore(questionId: string, score: number) {
  if (isReadOnly.value || isSubmitting.value) return
  questionScores[questionId] = score
}

function getGroupAnsweredCount(aspect: AspectKey): number {
  return quantitativeQuestions.reduce((sum, q) => {
    if (q.aspect !== aspect) return sum
    return sum + (questionScores[q.id!] > 0 ? 1 : 0)
  }, 0)
}

function getAspectScore(aspect: AspectKey): number {
  const aspectQuestions = quantitativeQuestions.filter((q) => q.aspect === aspect)
  if (aspectQuestions.length === 0) return 3
  const answered = aspectQuestions.filter((q) => questionScores[q.id!] > 0)
  if (answered.length === 0) return 3
  const total = answered.reduce((sum, q) => sum + questionScores[q.id!], 0)
  return Math.min(5, Math.max(1, Math.round(total / answered.length)))
}

function scrollToSection(aspect: string) {
  const el = document.getElementById(`section-${aspect}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  const unanswered = quantitativeQuestions.filter((q) => questionScores[q.id] === 0)
  if (unanswered.length > 0) {
    submitError.value = `${unanswered.length} pertanyaan belum dijawab.`
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
    if (status === 400)
      submitError.value =
        'Data penilaian tidak valid. Pastikan semua nilai sesuai rentang 1 sampai 5.'
    else if (status === 403)
      submitError.value =
        'Anda tidak memiliki akses untuk mengirim tugas ini atau tugas sudah completed.'
    else if (status === 404) submitError.value = 'Tugas review tidak ditemukan.'
    else submitError.value = 'Gagal mengirim penilaian. Silakan coba lagi.'
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
      <div class="card-inner">
        <!-- Header -->
        <div class="form-head">
          <h3 class="form-title">Task ID: {{ taskId }}</h3>
          <span class="mode-chip" :class="{ 'mode-chip--readonly': isReadOnly }">
            {{ isReadOnly ? 'Read-Only' : 'Editable' }}
          </span>
        </div>

        <p class="form-note">
          Petunjuk: Klik nilai untuk setiap pertanyaan dari skala
          <strong>1 (Sangat Kurang)</strong> sampai <strong>5 (Sangat Baik)</strong>. Semua
          pertanyaan wajib dijawab sebelum submit.
        </p>

        <!-- Score legend -->
        <div class="score-legend">
          <span v-for="(label, score) in SCORE_LABELS" :key="score" class="legend-item">
            <span class="legend-badge">{{ score }}</span>
            <span class="legend-label">{{ label }}</span>
          </span>
        </div>

        <!-- Progress -->
        <div class="form-progress">
          <div class="form-progress-head">
            <strong class="progress-title">Progress Pengisian</strong>
            <span class="progress-metric">
              {{ answeredQuestionCount }}/{{ quantitativeQuestions.length }} ({{
                completionPercent
              }}%)
            </span>
          </div>
          <div class="form-progress-track">
            <div class="form-progress-fill" :style="{ width: `${completionPercent}%` }" />
          </div>
          <p class="form-progress-note">
            Klik salah satu angka di setiap pertanyaan untuk memberikan nilai.
          </p>
        </div>

        <!-- Section jump nav -->
        <div v-if="!isReadOnly" class="section-nav">
          <span class="section-nav-label">Lompat ke:</span>
          <button
            v-for="group in groupedQuestions"
            :key="group.aspect"
            class="section-nav-btn"
            :class="{
              'section-nav-btn--done':
                getGroupAnsweredCount(group.aspect) === group.questions.length,
            }"
            type="button"
            @click="scrollToSection(group.aspect)"
          >
            {{ group.sectionShort }}
            <span v-if="getGroupAnsweredCount(group.aspect) > 0" class="section-nav-count">
              {{ getGroupAnsweredCount(group.aspect) }}/{{ group.questions.length }}
            </span>
          </button>
          <button class="section-nav-btn" type="button" @click="scrollToSection('qualitative')">
            Masukan
            <span v-if="qualitativeFilled" class="section-nav-count section-nav-count--done"
              >✓</span
            >
          </button>
        </div>

        <!-- Questions A–E -->
        <div class="form-section">
          <h4 class="section-title">
            A–E. Penilaian Kompetensi ({{ quantitativeQuestions.length }} Pertanyaan)
          </h4>

          <div
            v-for="group in groupedQuestions"
            :id="`section-${group.aspect}`"
            :key="group.sectionTitle"
            class="group-block"
          >
            <div class="group-head">
              <h5 class="group-title">{{ group.sectionTitle }}</h5>
              <span
                class="group-progress"
                :class="{
                  'group-progress--done':
                    getGroupAnsweredCount(group.aspect) === group.questions.length,
                }"
              >
                <span
                  v-if="getGroupAnsweredCount(group.aspect) === group.questions.length"
                  class="group-progress-check"
                  >✓</span
                >
                {{ getGroupAnsweredCount(group.aspect) }}/{{ group.questions.length }} dijawab
              </span>
            </div>

            <div
              v-for="question in group.questions"
              :key="question.id"
              class="question-card"
              :class="{ 'question-card--answered': questionScores[question.id] > 0 }"
            >
              <!-- Indicator circle (number → checkmark when answered) -->
              <div class="question-left">
                <div
                  class="question-indicator"
                  :class="{ 'question-indicator--done': questionScores[question.id] > 0 }"
                >
                  <span v-if="questionScores[question.id] > 0" class="indicator-check">✓</span>
                  <span v-else class="indicator-num">{{ question.number }}</span>
                </div>
              </div>

              <!-- Question text + rating buttons -->
              <div class="question-right">
                <p class="question-text">{{ question.text }}</p>

                <div class="rating-row">
                  <button
                    v-for="score in [1, 2, 3, 4, 5]"
                    :key="score"
                    type="button"
                    class="rating-btn"
                    :class="{
                      'rating-btn--selected': questionScores[question.id] === score,
                      'rating-btn--disabled': isReadOnly || isSubmitting,
                    }"
                    :aria-label="`Nilai ${score} — ${SCORE_LABELS[score]}`"
                    :aria-pressed="questionScores[question.id] === score"
                    :disabled="isReadOnly || isSubmitting"
                    @click="setScore(question.id, score)"
                  >
                    <span class="rating-num">{{ score }}</span>
                    <span class="rating-label">{{ SCORE_LABELS[score] }}</span>
                  </button>
                </div>

                <p v-if="questionScores[question.id] === 0 && !isReadOnly" class="question-hint">
                  Pilih nilai untuk pertanyaan ini
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Qualitative -->
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
              <span v-if="!qualitativeFilled && commentCharCount > 0"
                >(min. {{ MIN_COMMENT_LENGTH }})</span
              >
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
          <div
            v-if="!isReadOnly && commentCharCount > 0 && !qualitativeFilled"
            class="comment-progress-track"
          >
            <div class="comment-progress-fill" :style="{ width: `${commentProgress}%` }" />
          </div>
        </div>

        <p v-if="isReadOnly" class="readonly-note">
          Tugas ini sudah berstatus selesai. Form ditampilkan dalam mode baca saja.
        </p>

        <div v-if="submitError" class="note-box danger form-error">{{ submitError }}</div>

        <div v-if="!isReadOnly" class="form-actions">
          <p class="submit-meta" :class="{ 'submit-meta--warn': !canSubmit }">
            {{ submitHelperText }}
          </p>
          <button
            type="button"
            class="btn-submit"
            :disabled="isSubmitting || !canSubmit"
            :title="
              !canSubmit ? 'Jawab semua pertanyaan dan isi masukan kualitatif terlebih dahulu' : ''
            "
            @click="submitReview"
          >
            {{ isSubmitting ? 'Mengirim...' : 'Submit Penilaian' }}
          </button>
        </div>
      </div>
      <!-- /.card-inner -->
    </AppCard>
  </AppLayout>
</template>

<style scoped>
/* ─── Card wrapper ─── */
.card-inner {
  padding: 28px 32px;
}

/* ─── Back nav ─── */
.back-nav {
  margin-bottom: 12px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
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

/* ─── Form header ─── */
.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.form-title {
  margin: 0;
  font-size: 20px;
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
  font-size: 13px;
  font-weight: 700;
  padding: 5px 12px;
}

.mode-chip--readonly {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

/* ─── Form note ─── */
.form-note {
  margin: 20px 0 0;
  color: var(--text-grey);
  font-size: 15px;
  background: #ecfdf5;
  border: 1px solid #d1fae5;
  border-radius: 10px;
  padding: 14px 16px;
  line-height: 1.6;
}

/* ─── Score legend ─── */
.score-legend {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
}

.legend-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--primary);
  color: var(--white);
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.legend-label {
  font-size: 13px;
  color: var(--text-grey);
  font-weight: 500;
}

/* ─── Progress ─── */
.form-progress {
  margin-top: 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #f8fafc;
  padding: 16px 20px;
}

.form-progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.progress-title {
  font-size: 14px;
  color: var(--text-dark);
}

.progress-metric {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-grey);
}

.form-progress-track {
  margin-top: 10px;
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.form-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #166534, #22c55e);
  border-radius: inherit;
  transition: width 0.3s ease;
}

.form-progress-note {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--text-grey);
}

/* ─── Section nav ─── */
.section-nav {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f8fafc;
}

.section-nav-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-grey);
  margin-right: 4px;
}

.section-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--white);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  cursor: pointer;
  font-family: var(--font);
  transition:
    background 0.15s,
    border-color 0.15s;
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
  font-size: 11px;
  font-weight: 700;
  color: #047857;
  background: #bbf7d0;
  border-radius: 999px;
  padding: 1px 6px;
  line-height: 1;
}

.section-nav-count--done {
  background: #047857;
  color: #fff;
}

/* ─── Form sections ─── */
.form-section {
  margin-top: 40px;
}

.section-title {
  margin: 0 0 20px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-dark);
}

/* ─── Group block ─── */
.group-block {
  margin-top: 24px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #f9fafb;
  padding: 20px 24px;
  scroll-margin-top: 80px;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.group-title {
  margin: 0;
  color: var(--text-dark);
  font-size: 17px;
  font-weight: 700;
}

.group-progress {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  color: var(--text-grey);
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 13px;
  font-weight: 700;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.group-progress--done {
  border-color: #bbf7d0;
  background: #ecfdf5;
  color: #047857;
}

.group-progress-check {
  font-size: 12px;
}

/* ─── Question card ─── */
.question-card {
  display: flex;
  gap: 16px;
  padding: 18px 20px;
  border: 2px solid #e5e7eb;
  background: var(--white);
  border-radius: 12px;
  margin-top: 10px;
  transition: border-color 0.2s;
}

.question-card--answered {
  border-color: #6ee7b7;
}

/* Left column: indicator circle */
.question-left {
  flex-shrink: 0;
  padding-top: 2px;
}

.question-indicator {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 2px solid #d1d5db;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.25s,
    border-color 0.25s;
}

.question-indicator--done {
  border-color: #047857;
  background: #047857;
}

.indicator-check {
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
}

.indicator-num {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 700;
}

/* Right column */
.question-right {
  flex: 1;
  min-width: 0;
}

.question-text {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark);
  line-height: 1.55;
}

/* ─── Rating buttons ─── */
.rating-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rating-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 0;
  width: 84px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  font-family: var(--font);
  transition:
    border-color 0.15s,
    background 0.15s,
    transform 0.1s;
}

.rating-btn:hover:not(.rating-btn--disabled) {
  border-color: #6ee7b7;
  background: #f0fdf4;
}

.rating-btn:active:not(.rating-btn--disabled) {
  transform: scale(0.96);
}

.rating-btn--selected {
  border-color: var(--primary);
  background: #ecfdf5;
}

.rating-btn--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.rating-num {
  font-size: 22px;
  font-weight: 700;
  color: #94a3b8;
  line-height: 1;
  transition: color 0.15s;
}

.rating-btn--selected .rating-num {
  color: var(--primary);
}

.rating-label {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-align: center;
  line-height: 1.3;
  transition: color 0.15s;
}

.rating-btn--selected .rating-label {
  color: #047857;
}

.question-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}

/* ─── Qualitative section ─── */
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
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark);
}

.textarea-count {
  font-size: 13px;
  color: var(--text-grey);
  font-weight: 500;
  transition: color 0.2s;
  white-space: nowrap;
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
  padding: 14px 16px;
  font-size: 15px;
  font-family: var(--font);
  color: var(--text-dark);
  resize: vertical;
  min-height: 140px;
  transition: border-color 0.2s;
  line-height: 1.6;
}

.textarea-input:focus {
  outline: 2px solid #bbf7d0;
  border-color: var(--primary);
}

.textarea-input--ok {
  border-color: #22c55e;
}

.comment-progress-track {
  margin-top: 8px;
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

/* ─── Bottom ─── */
.readonly-note {
  margin: 24px 0 0;
  font-size: 14px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 12px 16px;
}

.form-error {
  margin-top: 16px;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  position: sticky;
  bottom: 0;
  background: linear-gradient(to top, var(--white) 75%, rgba(255, 255, 255, 0));
  padding-top: 16px;
  padding-bottom: 4px;
}

.submit-meta {
  margin: 0;
  font-size: 14px;
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
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
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

/* ─── Mobile ─── */
@media (max-width: 768px) {
  .card-inner {
    padding: 16px;
  }
  .form-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .form-progress-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .section-title {
    font-size: 19px;
  }
  .group-block {
    padding: 16px;
  }
  .group-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .question-card {
    flex-direction: column;
    gap: 12px;
  }
  .question-indicator {
    width: 32px;
    height: 32px;
  }
  .rating-row {
    gap: 6px;
  }
  .rating-btn {
    width: 60px;
    padding: 8px 0;
  }
  .rating-num {
    font-size: 18px;
  }
  .rating-label {
    font-size: 9px;
  }
  .score-legend {
    gap: 4px;
  }
  .form-actions {
    position: static;
    flex-direction: column;
    align-items: stretch;
    padding-bottom: 0;
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
