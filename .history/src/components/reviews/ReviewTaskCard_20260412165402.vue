<script setup lang="ts">
import { computed } from 'vue'

import AppBadge from '@/components/common/AppBadge.vue'
import type { ReviewTask } from '@/interfaces/reviews/review-task.interface'

const props = defineProps<{
  task: ReviewTask
}>()

const emit = defineEmits<{
  open: [payload: { taskId: string; readOnly: boolean }]
}>()

const isCompleted = computed(() => (props.task.status ?? '').toLowerCase() === 'completed')
const normalizedType = computed(() => (props.task.type ?? '').toUpperCase())

const statusLabel = computed(() => (isCompleted.value ? 'Selesai' : 'Belum Diisi'))
const statusVariant = computed<'success' | 'pending'>(() =>
  isCompleted.value ? 'success' : 'pending',
)
const actionLabel = computed(() => (isCompleted.value ? 'Lihat Jawaban' : 'Isi Sekarang'))

const typeLabel = computed(() => {
  const rawType = props.task.type ?? ''
  const normalized = normalizedType.value

  if (normalized.includes('SELF')) return 'Self Review'
  if (normalized.includes('PEER')) return 'Peer Review'
  if (normalized.includes('SUPERIOR') || normalized.includes('HEAD_TO_TEACHER')) {
    return 'Superior Review'
  }

  return rawType || '-'
})

const reviewTone = computed<'self' | 'peer' | 'superior' | 'generic'>(() => {
  if (normalizedType.value.includes('SELF')) return 'self'
  if (normalizedType.value.includes('PEER')) return 'peer'
  if (normalizedType.value.includes('SUPERIOR') || normalizedType.value.includes('HEAD_TO_TEACHER')) {
    return 'superior'
  }

  return 'generic'
})

function parseDeadlineDate(deadline?: string | null): Date | null {
  if (!deadline) return null

  const parsedDate = new Date(`${deadline}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) return null

  return parsedDate
}

const deadlineDate = computed(() => parseDeadlineDate(props.task.deadline))
const deadlineISO = computed(() => deadlineDate.value?.toISOString().slice(0, 10) ?? '')

const deadlineDayDiff = computed(() => {
  if (!deadlineDate.value) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffInMs = deadlineDate.value.getTime() - today.getTime()

  return Math.floor(diffInMs / (1000 * 60 * 60 * 24))
})

const deadlineState = computed<'normal' | 'soon' | 'overdue' | 'none'>(() => {
  if (deadlineDayDiff.value === null) return 'none'
  if (deadlineDayDiff.value < 0) return 'overdue'
  if (deadlineDayDiff.value <= 2) return 'soon'

  return 'normal'
})

const deadlineHint = computed(() => {
  if (deadlineDayDiff.value === null) return ''
  if (deadlineDayDiff.value < 0) return 'Sudah lewat'
  if (deadlineDayDiff.value === 0) return 'Jatuh tempo hari ini'
  if (deadlineDayDiff.value === 1) return 'Sisa 1 hari'
  if (deadlineDayDiff.value <= 2) return `Sisa ${deadlineDayDiff.value} hari`

  return ''
})

const deadlineLabel = computed(() => {
  if (!props.task.deadline) return 'Tidak ditentukan'

  const parsedDate = new Date(`${props.task.deadline}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) return props.task.deadline

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
})

function openTaskForm() {
  emit('open', {
    taskId: props.task.taskId,
    readOnly: isCompleted.value,
  })
}
</script>

<template>
  <article class="task-card" :class="[`task-card--${reviewTone}`, { 'task-card--completed': isCompleted }]">
    <div class="task-info">
      <div class="task-meta">
        <AppBadge :variant="statusVariant">{{ statusLabel }}</AppBadge>
        <span class="meta-divider">•</span>
        <span class="task-type">{{ typeLabel }}</span>
      </div>

      <h4 class="task-target">{{ task.targetName }}</h4>
      <p class="task-deadline" :class="`task-deadline--${deadlineState}`">
        <span class="task-deadline-label">Batas waktu:</span>
        <time v-if="deadlineState !== 'none'" :datetime="deadlineISO">{{ deadlineLabel }}</time>
        <span v-else>{{ deadlineLabel }}</span>
        <span v-if="deadlineHint" class="task-deadline-hint">({{ deadlineHint }})</span>
      </p>
    </div>

    <button
      type="button"
      class="task-action"
      :class="{ 'task-action--completed': isCompleted }"
      @click="openTaskForm"
    >
      {{ actionLabel }}
      <span class="task-action-icon">›</span>
    </button>
  </article>
</template>

<style scoped>
.task-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--white);
  border-left: 4px solid #d1d5db;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.task-card--self {
  border-left-color: var(--primary);
}

.task-card--peer {
  border-left-color: #0ea5e9;
}

.task-card--superior {
  border-left-color: #f59e0b;
}

.task-card--completed {
  background: #fcfffd;
}

.task-info {
  min-width: 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.meta-divider {
  color: var(--text-grey);
  font-size: 12px;
}

.task-type {
  font-size: 13px;
  color: var(--text-grey);
  font-weight: 600;
}

.task-target {
  margin: 0;
  color: var(--text-dark);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.task-deadline {
  margin: 6px 0 0;
  color: var(--text-grey);
  font-size: 13px;
  font-weight: 500;
}

.task-deadline-label {
  font-weight: 600;
}

.task-deadline-hint {
  font-weight: 700;
}

.task-deadline--soon {
  color: #b45309;
}

.task-deadline--overdue {
  color: #b91c1c;
}

.task-action {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--white);
  border-radius: 10px;
  min-height: 44px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.task-action:hover {
  background: var(--primary-hover);
}

.task-action--completed {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.task-action--completed:hover {
  background: #d1fae5;
}

.task-action:focus-visible {
  outline: 2px solid #86efac;
  outline-offset: 2px;
}

.task-action-icon {
  font-size: 18px;
  line-height: 1;
  transition: transform 0.15s ease;
}

.task-action:hover .task-action-icon {
  transform: translateX(2px);
}

@media (max-width: 768px) {
  .task-card {
    flex-direction: column;
    align-items: stretch;
  }

  .task-action {
    justify-content: center;
    width: 100%;
  }

  .task-target {
    font-size: 28px;
  }
}
</style>
