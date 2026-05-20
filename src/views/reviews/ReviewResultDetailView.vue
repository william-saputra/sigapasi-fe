<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'vue-chartjs'

import AppLayout from '@/components/common/AppLayout.vue'
import PageHeader from '@/components/header/PageHeader.vue'
import apiService from '@/services/api.service'
import type {
  ReviewDetailData,
  ReviewAspect,
  ReviewChartData,
} from '@/interfaces/reviews/review-chart.interface'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const route = useRoute()
const router = useRouter()

const teacherId = route.params.teacherId as string
const periodId = route.query.periodId as string

const detail = ref<ReviewDetailData | null>(null)
const chartData = ref<ReviewChartData | null>(null)
const isLoading = ref(false)
const fetchError = ref<string | null>(null)

async function fetchAll() {
  if (!teacherId || !periodId) return
  isLoading.value = true
  fetchError.value = null
  try {
    const [detailRes, chartRes] = await Promise.all([
      apiService.get<ReviewDetailData>(`/reviews/results/${teacherId}/details?periodId=${periodId}`),
      apiService.get<ReviewChartData>(`/reviews/results/${teacherId}?periodId=${periodId}`),
    ])
    detail.value = detailRes
    chartData.value = chartRes
  } catch {
    fetchError.value = 'Gagal memuat data. Pastikan server berjalan dan Anda sudah login.'
  } finally {
    isLoading.value = false
  }
}

// ── Chart ──────────────────────────────────────────────────────────────────────

const DATASET_STYLES: Record<string, { border: string; bg: string }> = {
  Self:   { border: 'rgba(59,130,246,1)',  bg: 'rgba(59,130,246,0.15)' },
  Peer:   { border: 'rgba(239,68,68,1)',   bg: 'rgba(239,68,68,0.18)' },
  Atasan: { border: 'rgba(245,158,11,1)',  bg: 'rgba(245,158,11,0.15)' },
}

const chartJsData = computed(() => {
  if (!chartData.value) return null
  return {
    labels: chartData.value.labels,
    datasets: chartData.value.datasets.map((ds) => {
      const s = DATASET_STYLES[ds.label] ?? { border: 'rgba(100,100,100,1)', bg: 'rgba(100,100,100,0.15)' }
      return {
        label: ds.label,
        data: ds.data,
        borderColor: s.border,
        backgroundColor: s.bg,
        pointBackgroundColor: s.border,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: s.border,
        borderWidth: 2,
        pointRadius: 4,
        fill: true,
      }
    }),
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}` } },
  },
  scales: {
    r: {
      min: 0,
      max: 5,
      ticks: {
        stepSize: 1,
        font: { size: 10 },
        color: '#94a3b8',
        backdropColor: 'transparent',
      },
      pointLabels: { font: { size: 11, weight: 600 }, color: '#374151' },
      grid: { color: 'rgba(148,163,184,0.25)' },
      angleLines: { color: 'rgba(148,163,184,0.35)' },
    },
  },
}

const legendItems = Object.entries(DATASET_STYLES).map(([label, s]) => ({ label, color: s.border }))

// ── Insights ───────────────────────────────────────────────────────────────────

const blindSpotAspect    = computed(() => detail.value?.aspects.find((a) => a.tag === 'BLIND_SPOT')          ?? null)
const goodPerformAspect  = computed(() => detail.value?.aspects.find((a) => a.tag === 'GOOD_PERFORMANCE')    ?? null)
const consistentStrength = computed(() => detail.value?.aspects.find((a) => a.tag === 'CONSISTENT_STRENGTH') ?? null)

const hasAnyInsight = computed(() => blindSpotAspect.value || goodPerformAspect.value || consistentStrength.value)

// ── Helpers ────────────────────────────────────────────────────────────────────

function roleLabel(role: string): string {
  return role === 'SELF' ? 'Self' : role === 'PEER' ? 'Peer' : role === 'SUPERIOR' ? 'Atasan' : role
}

function roleClass(role: string): string {
  return role === 'SELF'
    ? 'role-pill role-pill--self'
    : role === 'PEER'
    ? 'role-pill role-pill--peer'
    : 'role-pill role-pill--superior'
}

function overallScore(aspect: ReviewAspect): string {
  const scores = [aspect.selfScore, aspect.peerScore, aspect.superiorScore].filter((s) => s > 0)
  if (scores.length === 0) return '—'
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return avg.toFixed(1)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(fetchAll)
</script>

<template>
  <AppLayout>
    <PageHeader
      title="Hasil Evaluasi"
      subtitle="Analisis mendalam kompetensi berdasarkan hasil evaluasi 360 derajat."
    >
      <template #actions>
        <button type="button" class="back-btn" @click="router.back()">
          ← Kembali ke Dashboard
        </button>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="isLoading" class="card state-card">
      <span class="state-text">⏳ Memuat data...</span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="card state-card state-card--error">
      <p class="state-title">Gagal memuat data.</p>
      <p class="state-text">{{ fetchError }}</p>
      <button type="button" class="retry-btn" @click="fetchAll">Coba Lagi</button>
    </div>

    <template v-else-if="detail">

      <!-- ── Row 1: radar (left) + right column ── -->
      <div class="top-grid">

        <!-- Radar -->
        <div class="card radar-card">
          <div class="card-header">
            <span class="card-title">Hasil Evaluasi</span>
          </div>
          <div class="radar-body">
            <div class="radar-chart-wrap">
              <Radar v-if="chartJsData" :data="chartJsData" :options="chartOptions" />
              <div v-else class="state-text">Belum ada data chart.</div>
            </div>
            <div class="radar-legend">
              <span v-for="item in legendItems" :key="item.label" class="legend-item">
                <span class="legend-dot" :style="{ background: item.color }" />
                {{ item.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Score + Insight stacked -->
        <div class="right-col">

          <!-- Detail Skor -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Detail Skor</span>
            </div>
            <div class="score-table-wrap">
              <table class="score-tbl">
                <thead>
                  <tr>
                    <th class="st-aspect">Kompetensi</th>
                    <th class="st-score st-self">Self</th>
                    <th class="st-score st-peer">Peer</th>
                    <th class="st-score st-superior">Atasan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="aspect in detail.aspects" :key="aspect.name">
                    <td class="st-aspect-val">{{ aspect.name }}</td>
                    <td class="st-score-val">{{ aspect.selfScore > 0 ? aspect.selfScore : '—' }}</td>
                    <td
                      class="st-score-val"
                      :class="{ 'score-val--red': aspect.tag === 'BLIND_SPOT' }"
                    >{{ aspect.peerScore > 0 ? aspect.peerScore : '—' }}</td>
                    <td class="st-score-val">{{ aspect.superiorScore > 0 ? aspect.superiorScore : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Insight -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Insight</span>
            </div>
            <div class="insight-body">

              <div v-if="!hasAnyInsight" class="insight-box insight-box--neutral">
                <span class="insight-icon">✓</span>
                <div>
                  <strong class="insight-title">Penilaian Stabil</strong>
                  <p class="insight-text">Tidak ada gap signifikan antar penilai pada periode ini.</p>
                </div>
              </div>

              <div v-if="blindSpotAspect" class="insight-box insight-box--danger">
                <span class="insight-icon">⚠</span>
                <div>
                  <strong class="insight-title">Blind Spot (Titik Buta)</strong>
                  <p class="insight-text">
                    Terdapat gap signifikan
                    ({{ (blindSpotAspect.selfScore - blindSpotAspect.peerScore).toFixed(1) }} poin)
                    pada <strong>Kompetensi {{ blindSpotAspect.name }}</strong>.
                    Guru menilai diri sendiri tinggi ({{ blindSpotAspect.selfScore }}), namun
                    rekan kerja menilai cukup rendah ({{ blindSpotAspect.peerScore }}).
                  </p>
                </div>
              </div>

              <div v-if="goodPerformAspect" class="insight-box insight-box--success">
                <span class="insight-icon">★</span>
                <div>
                  <strong class="insight-title">Performa Bagus</strong>
                  <p class="insight-text">
                    Rekan menilai <strong>{{ goodPerformAspect.name }}</strong> lebih tinggi
                    ({{ goodPerformAspect.peerScore }}) dari penilaian diri sendiri
                    ({{ goodPerformAspect.selfScore }}).
                  </p>
                </div>
              </div>

              <div v-if="consistentStrength" class="insight-box insight-box--success">
                <span class="insight-icon">★</span>
                <div>
                  <strong class="insight-title">Kekuatan Konsisten</strong>
                  <p class="insight-text">
                    <strong>{{ consistentStrength.name }}</strong> adalah aspek terkuat dengan
                    konsensus tinggi antar semua penilai.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      <!-- ── Row 2: feedbacks full-width ── -->
      <div class="card">
        <div class="card-header feedback-header">
          <span class="card-title">Detail Respon Masuk</span>
          <span class="privacy-note">🔒 Nama disamarkan untuk privasi</span>
        </div>

        <div v-if="detail.feedbacks.length === 0" class="state-text" style="padding: 20px 24px;">
          📭 Belum ada respon masuk untuk periode ini.
        </div>

        <div v-else class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>TANGGAL</th>
                <th>PENILAI (ROLE)</th>
                <th class="th-center">RATA-RATA SKOR</th>
                <th>MASUKAN KUALITATIF</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(fb, idx) in detail.feedbacks" :key="idx">
                <td class="td-date">{{ formatDate(fb.date) }}</td>
                <td>
                  <div class="reviewer-cell">
                    <span class="masked-name">{{ fb.maskedName }}</span>
                    <span :class="roleClass(fb.role)">{{ roleLabel(fb.role) }}</span>
                  </div>
                </td>
                <td class="td-center">
                  {{ fb.avgScore != null ? fb.avgScore.toFixed(1) : '—' }}
                </td>
                <td class="td-comment">
                  <em v-if="fb.comment" class="comment-text">"{{ fb.comment }}"</em>
                  <span v-else class="muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>
  </AppLayout>
</template>

<style scoped>
/* ── Base card (mirrors AppCard but lets us control padding) ── */
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

/* ── Page header button ── */
.back-btn {
  padding: 7px 16px;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-dark);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.back-btn:hover { background: var(--bg-light); }

/* ── State cards ── */
.state-card { padding: 32px 24px; }
.state-card--error { color: #7f1d1d; }
.state-title { margin: 0 0 6px; font-size: 14px; font-weight: 700; }
.state-text  { font-size: 14px; color: var(--text-grey); }
.retry-btn {
  margin-top: 14px;
  border: 1px solid #f87171;
  background: #fff;
  color: #991b1b;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 14px;
  cursor: pointer;
}

/* ── Top two-column grid ── */
.top-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 20px;
  align-items: start;
}

/* ── Card header (shared) ── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-dark);
}

/* ── Radar card ── */
.radar-card { display: flex; flex-direction: column; }

.radar-body {
  padding: 20px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.radar-chart-wrap {
  width: 100%;
  max-width: 420px;
}

.radar-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dark);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Right column ── */
.right-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Score table ── */
.score-table-wrap { overflow-x: auto; }

.score-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.score-tbl thead tr {
  border-bottom: 1px solid var(--border);
}

.score-tbl th {
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.st-aspect { text-align: left; color: var(--text-grey); }

.st-score {
  text-align: center;
  width: 72px;
}

/* colored column headers */
.st-self     { color: rgba(59,130,246,1); }
.st-peer     { color: rgba(239,68,68,1); }
.st-superior { color: rgba(245,158,11,1); }

.score-tbl tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}
.score-tbl tbody tr:last-child { border-bottom: none; }
.score-tbl tbody tr:hover { background: var(--bg-light); }

.st-aspect-val {
  padding: 11px 16px;
  font-size: 13.5px;
  color: var(--text-dark);
}

.st-score-val {
  padding: 11px 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.score-val--red { color: #dc2626; }

/* ── Insight ── */
.insight-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.insight-box {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 8px;
  border-left: 4px solid transparent;
}

.insight-box--danger  { background: #fef2f2; border-color: #ef4444; color: #7f1d1d; }
.insight-box--success { background: #f0fdf4; border-color: #22c55e; color: #14532d; }
.insight-box--neutral { background: var(--bg-light); border-color: var(--border); color: var(--text-grey); }

.insight-icon {
  font-size: 15px;
  flex-shrink: 0;
  line-height: 1.6;
}

.insight-title {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 3px;
}

.insight-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
}

/* ── Feedback card header ── */
.feedback-header { }

.privacy-note {
  font-size: 12px;
  color: var(--text-grey);
}

/* ── Feedbacks table ── */
.table-wrap { overflow-x: auto; }

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.tbl th {
  text-align: left;
  padding: 10px 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-grey);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.tbl td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  color: var(--text-dark);
}

.tbl tbody tr:last-child td { border-bottom: none; }
.tbl tbody tr:hover td { background: var(--bg-light); }

.th-center { text-align: center; }
.td-center  { text-align: center; font-weight: 600; font-size: 14px; }
.td-date    { white-space: nowrap; color: var(--text-grey); font-size: 13px; width: 120px; }
.td-comment { max-width: 420px; }

.muted { color: var(--text-grey); }

/* ── Reviewer cell ── */
.reviewer-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.masked-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--text-dark);
}

.role-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  width: fit-content;
}
.role-pill--self     { background: #eff6ff; color: #1d4ed8; }
.role-pill--peer     { background: #fef2f2; color: #991b1b; }
.role-pill--superior { background: #fffbeb; color: #92400e; }

/* ── Comment ── */
.comment-text {
  font-style: italic;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-dark);
}

/* ── Responsive ── */
@media (max-width: 920px) {
  .top-grid { grid-template-columns: 1fr; }
}
</style>
