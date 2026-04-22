<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/common/AppLayout.vue'
import AppCard from '@/components/common/AppCard.vue'
import PageHeader from '@/components/header/PageHeader.vue'
import ReviewTaskCard from '@/components/reviews/ReviewTaskCard.vue'
import type { ReviewTask } from '@/interfaces/reviews/review-task.interface'
import apiService from '@/services/api.service'

const router = useRouter()

const tasks = ref<ReviewTask[]>([])
const isLoading = ref(false)
const fetchError = ref<string | null>(null)

const completedCount = computed(
  () => tasks.value.filter((task) => (task.status ?? '').toLowerCase() === 'completed').length,
)

const pendingCount = computed(() => Math.max(0, tasks.value.length - completedCount.value))

const completionRate = computed(() => {
  if (tasks.value.length === 0) return 0
  return Math.round((completedCount.value / tasks.value.length) * 100)
})

const userName = computed(() => {
  const rawUser = localStorage.getItem('user')
  if (!rawUser) return 'Guru'

  try {
    const parsed = JSON.parse(rawUser)
    return parsed?.fullName || 'Guru'
  } catch {
    return 'Guru'
  }
})

async function fetchReviewTasks() {
  isLoading.value = true
  fetchError.value = null

  try {
    tasks.value = await apiService.get<ReviewTask[]>('/reviews/tasks')
  } catch {
    fetchError.value =
      'Gagal memuat daftar tugas evaluasi. Pastikan server berjalan dan Anda sudah login.'
  } finally {
    isLoading.value = false
  }
}

function openTaskForm(payload: { taskId: string; readOnly: boolean }) {
  router.push({
    name: 'reviews-task-form',
    params: { taskId: payload.taskId },
    query: payload.readOnly ? { mode: 'readonly' } : { mode: 'edit' },
  })
}

onMounted(fetchReviewTasks)
</script>

<template>
  <AppLayout>
    <PageHeader title="Dashboard Saya" subtitle="Pantau tugas dan perkembangan kompetensi Anda.">
      <template #actions>
        <div class="mode-badge">↔ Mode: Guru (User)</div>
      </template>
    </PageHeader>

    <AppCard>
      <div class="greeting-card">
        <h3 class="greeting-title">Halo, {{ userName }}! 👋</h3>
        <p class="greeting-subtitle">
          Berikut adalah ringkasan kinerja dan daftar tugas evaluasi Anda.
        </p>

        <div class="greeting-metrics">
          <div class="metric-pill">
            <span class="metric-label">Belum Diisi</span>
            <strong class="metric-value">{{ pendingCount }}</strong>
          </div>
          <div class="metric-pill metric-pill--success">
            <span class="metric-label">Selesai</span>
            <strong class="metric-value">{{ completedCount }}</strong>
          </div>
          <div class="metric-pill metric-pill--neutral">
            <span class="metric-label">Progress</span>
            <strong class="metric-value">{{ completionRate }}%</strong>
          </div>
        </div>
      </div>
    </AppCard>

    <section class="task-section">
      <div class="task-section-head">
        <h3 class="task-section-title">Daftar Tugas Evaluasi</h3>
        <p class="task-section-subtitle">Pilih tugas untuk mengisi evaluasi atau melihat jawaban.</p>
      </div>

      <AppCard v-if="isLoading">
        <div class="task-state">⏳ Memuat daftar tugas...</div>
      </AppCard>

      <AppCard v-else-if="fetchError">
        <div class="task-state task-state--error">
          <p class="task-state-title">Gagal memuat tugas evaluasi.</p>
          <p class="task-state-text">{{ fetchError }}</p>
          <button type="button" class="retry-btn" @click="fetchReviewTasks">Coba Lagi</button>
        </div>
      </AppCard>

      <AppCard v-else-if="tasks.length === 0">
        <div class="task-state">📭 Belum ada tugas evaluasi untuk Anda saat ini.</div>
      </AppCard>

      <div v-else class="task-list">
        <ReviewTaskCard
          v-for="task in tasks"
          :key="task.taskId"
          :task="task"
          @open="openTaskForm"
        />
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
.mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #fffbeb;
  border: 1px solid #d97706;
  color: #92400e;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
}

.greeting-card {
  padding: 4px 2px;
}

.greeting-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-dark);
}

.greeting-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--text-grey);
}

.task-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-section-title {
  margin: 0;
  color: var(--text-dark);
  font-size: 24px;
  font-weight: 700;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-state {
  padding: 18px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: var(--white);
  color: var(--text-grey);
  font-size: 14px;
}
</style>
