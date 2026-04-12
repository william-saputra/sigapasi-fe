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

const statusLabel = computed(() => (isCompleted.value ? 'Selesai' : 'Belum Diisi'))
const statusVariant = computed<'success' | 'pending'>(() =>
  isCompleted.value ? 'success' : 'pending',
)

const typeLabel = computed(() => {
  const rawType = props.task.type ?? ''
  const normalized = rawType.toUpperCase()

  if (normalized.includes('SELF')) return 'Self Review'
  if (normalized.includes('PEER')) return 'Peer Review'
  if (normalized.includes('SUPERIOR') || normalized.includes('HEAD_TO_TEACHER')) {
    return 'Superior Review'
  }

  return rawType || '-'
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

const deadlineData = computed(() => {
  if (!props.task.deadline || isCompleted.value) return { isWarn: false, isError: false, hint: '' }

  const targetDate = new Date(`${props.task.deadline}T00:00:00`)
  if (Number.isNaN(targetDate.getTime())) return { isWarn: false, isError: false, hint: '' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { isWarn: false, isError: true, hint: `(Terlewat ${Math.abs(diffDays)} hari)` }
  }

  if (diffDays === 0) {
    return { isWarn: true, isError: false, hint: '(Hari ini)' }
  }

  if (diffDays <= 3) {
    return { isWarn: true, isError: false, hint: `(Tersisa ${diffDays} hari)` }
  }

  return { isWarn: false, isError: false, hint: '' }
})

const typeClasses = computed(() => {
  const t = typeLabel.value
  return {
    'task-type--self': t === 'Self Review',
    'task-type--peer': t === 'Peer Review',
    'task-type--sup': t === 'Superior Review',
  }
})

function openTaskForm() {
  emit('open', {
    taskId: props.task.taskId,
    readOnly: isCompleted.value,
  })
}
</script>

<template>
  <article class="task-card" :class="{ 'task-card--completed': isCompleted }">
    <div class="task-info">
      <div class="task-meta">
        <AppBadge :variant="statusVariant">{{ statusLabel }}</AppBadge>
        <span class="meta-divider">•</span>
        <span class="task-type" :class="typeClasses">{{ typeLabel }}</span>
      </div>

      <h4 class="task-target">{{ task.targetName }}</h4>

      <p class="task-deadline">
        Batas waktu: <span class="deadline-date">{{ deadlineLabel }}</span>
        <span
          v-if="deadlineData.hint"
          class="deadline-hint"
          :class="{
            'deadline-hint--warn': deadlineData.isWarn,
            'deadline-hint--error': deadlineData.isError,
          }"
        >
          {{ deadlineData.hint }}
        </span>
      </p>
    </div>

    <button
      v-if="!isCompleted"
      type="button"
      class="task-action"
      @click="openTaskForm"
    >
      Isi Sekarang
      <span class="task-action-icon">›</span>
    </button>
  </article>
</template>

<style scoped>
.task-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--white);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.task-card--completed {
  background: #f8fafc;
}

.task-card--completed:hover {
  box-shadow: none;
  border-color: var(--border);
}

.task-info {
  min-width: 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.meta-divider {
  color: var(--text-grey);
  font-size: 12px;
}

.task-type {
  font-size: 13px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--bg-light);
  color: #475569;
}

.task-type--self {
  background: #e0e7ff;
  color: #047857;
}

.task-type--peer {
  background: #ede9fe;
  color: #4338ca;
}

.task-type--sup {
  background: #ffedd5;
  color: #c2410c;
}

.task-target {
  margin: 0;
  color: var(--text-dark);
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
}

.task-deadline {
  margin: 6px 0 0;
  color: var(--text-grey);
  font-size: 13px;
  font-weight: 500;
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.deadline-date {
  font-weight: 700;
}

.deadline-hint {
  font-weight: 700;
  font-size: 12px;
}

.deadline-hint--warn {
  color: #ea580c;
}

.deadline-hint--error {
  color: #dc2626;
}

.task-action {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--white);
  border-radius: 10px;
  padding: 10px 18px;
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
    border-color 0.15s ease,
    transform 0.1s ease;
}

.task-action:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.task-action:focus-visible {
  outline: 2px solid #86efac;
  outline-offset: 2px;
}

.task-action--completed {
  background: var(--white);
  color: var(--text-dark);
  border-color: #d1d5db;
}

.task-action--completed:hover {
  background: #f1f5f9;
  transform: none;
}

.task-action-icon {
  font-size: 16px;
  line-height: 1;
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
    font-size: 18px;
  }
}
</style>
