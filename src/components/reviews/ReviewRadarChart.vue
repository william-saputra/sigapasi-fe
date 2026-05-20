<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
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
import type { ReviewChartData, ReviewPeriodOption } from '@/interfaces/reviews/review-chart.interface'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps<{
  chartData: ReviewChartData | null
  periods: ReviewPeriodOption[]
  selectedPeriodId: string | null
  loading: boolean
  teacherId: string | null
}>()

const emit = defineEmits<{
  'update:selectedPeriodId': [value: string]
}>()

const router = useRouter()

function goToDetail() {
  if (!props.teacherId || !props.selectedPeriodId) return
  router.push({
    name: 'reviews-detail',
    params: { teacherId: props.teacherId },
    query: { periodId: props.selectedPeriodId },
  })
}

const DATASET_STYLES: Record<string, { border: string; bg: string; point: string }> = {
  Self: {
    border: 'rgba(59,130,246,1)',
    bg: 'rgba(59,130,246,0.15)',
    point: 'rgba(59,130,246,1)',
  },
  Peer: {
    border: 'rgba(239,68,68,1)',
    bg: 'rgba(239,68,68,0.15)',
    point: 'rgba(239,68,68,1)',
  },
  Atasan: {
    border: 'rgba(245,158,11,1)',
    bg: 'rgba(245,158,11,0.15)',
    point: 'rgba(245,158,11,1)',
  },
}

const chartJsData = computed(() => {
  if (!props.chartData) return null

  return {
    labels: props.chartData.labels,
    datasets: props.chartData.datasets.map((ds) => {
      const style = DATASET_STYLES[ds.label] ?? {
        border: 'rgba(100,100,100,1)',
        bg: 'rgba(100,100,100,0.15)',
        point: 'rgba(100,100,100,1)',
      }
      return {
        label: ds.label,
        data: ds.data,
        borderColor: style.border,
        backgroundColor: style.bg,
        pointBackgroundColor: style.point,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: style.border,
        borderWidth: 2,
        pointRadius: 4,
        fill: true,
      }
    }),
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}`,
      },
    },
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
      pointLabels: {
        font: { size: 11, weight: 600 },
        color: '#374151',
      },
      grid: { color: 'rgba(148,163,184,0.3)' },
      angleLines: { color: 'rgba(148,163,184,0.4)' },
    },
  },
}))

const legendItems = computed(() =>
  Object.entries(DATASET_STYLES).map(([label, style]) => ({ label, color: style.border })),
)

const hasData = computed(() =>
  props.chartData?.datasets.some((ds) => ds.data.some((v) => v > 0)),
)
</script>

<template>
  <div class="radar-panel">
    <div class="radar-header">
      <div class="radar-title-group">
        <h3 class="radar-title">Rapor Kompetensi Saya</h3>
        <p class="radar-subtitle">Self vs Peer vs Atasan</p>
      </div>
      <select
        v-if="periods.length > 0"
        class="period-select"
        :value="selectedPeriodId ?? ''"
        @change="emit('update:selectedPeriodId', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="p in periods" :key="p.id" :value="p.id">
          {{ p.semesterName }}
        </option>
      </select>
    </div>

    <div class="radar-body">
      <div v-if="loading" class="radar-state">
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        <span>Memuat data...</span>
      </div>

      <div v-else-if="!chartData || !hasData" class="radar-state">
        <i class="fa-regular fa-chart-bar radar-empty-icon"></i>
        <span>Belum ada data evaluasi untuk periode ini.</span>
      </div>

      <template v-else>
        <Radar :data="chartJsData!" :options="chartOptions" />

        <div class="radar-legend">
          <span v-for="item in legendItems" :key="item.label" class="legend-item">
            <span class="legend-dot" :style="{ background: item.color }" />
            {{ item.label }}
          </span>
        </div>

        <button
          v-if="teacherId && selectedPeriodId"
          type="button"
          class="detail-btn"
          @click="goToDetail"
        >
          Lihat Gap Analysis Detail →
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.radar-panel {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.radar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border);
}

.radar-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.radar-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-dark);
}

.radar-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--text-grey);
}

.period-select {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 5px 28px 5px 10px;
  background: var(--bg-light)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
    no-repeat right 8px center;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.period-select:focus {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.radar-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.radar-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--text-grey);
  font-size: 13px;
  text-align: center;
}

.radar-empty-icon {
  font-size: 28px;
  opacity: 0.35;
}

.radar-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
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

.detail-btn {
  width: 100%;
  padding: 9px 16px;
  background: var(--primary, #2563eb);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.detail-btn:hover {
  background: var(--primary-dark, #1d4ed8);
}

.detail-btn:focus-visible {
  outline: 2px solid var(--primary, #2563eb);
  outline-offset: 2px;
}
</style>
