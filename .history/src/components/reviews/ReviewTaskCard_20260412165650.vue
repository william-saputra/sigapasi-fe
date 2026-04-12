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
const actionLabel = computed(() => (isCompleted.value ? 'Lihat Jawaban' : 'Isi Sekarang'))

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

function openTaskForm() {
  emit('open', {
    taskId: props.task.taskId,
    readOnly: isCompleted.value,
  })
}
</script>

<template>
  <article class="task-card">
    <div class="task-info">
      <div class="task-meta">
        <AppBadge :variant="statusVariant">{{ statusLabel }}</AppBadge>
        <span class="meta-divider">•</span>
        <span class="task-type">{{ typeLabel }}</span>
      </div>

      <h4 class="task-target">{{ task.targetName }}</h4>
      <p class="task-deadline">Batas waktu: {{ deadlineLabel }}</p>
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
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.task-deadline {
  margin: 4px 0 0;
  color: var(--text-grey);
  font-size: 13px;
  font-weight: 500;
}

.task-action {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--white);
  border-radius: 10px;
  padding: 10px 14px;
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
  background: var(--white);
  color: var(--text-dark);
  border-color: #d1d5db;
}

.task-action--completed:hover {
  background: #f9fafb;
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
}
</style>
