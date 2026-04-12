<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/common/AppLayout.vue'
import AppCard from '@/components/common/AppCard.vue'
import PageHeader from '@/components/header/PageHeader.vue'

const route = useRoute()
const router = useRouter()

const taskId = computed(() => String(route.params.taskId ?? ''))
const isReadOnly = computed(() => route.query.mode === 'readonly')
</script>

<template>
  <AppLayout>
    <div class="back-nav">
      <button class="btn-back" @click="router.push({ name: 'reviews-home' })">
        ← Kembali ke Daftar Tugas
      </button>
    </div>

    <PageHeader title="Form Evaluasi Guru" subtitle="Pengisian 360 Review berdasarkan tugas yang dipilih." />

    <AppCard>
      <div class="form-head">
        <h3 class="form-title">Task ID: {{ taskId }}</h3>
        <span class="mode-chip" :class="{ 'mode-chip--readonly': isReadOnly }">
          {{ isReadOnly ? 'Read-Only' : 'Editable' }}
        </span>
      </div>

      <p class="form-note" v-if="isReadOnly">
        Tugas ini sudah berstatus selesai. Halaman ditampilkan dalam mode baca saja.
      </p>
      <p class="form-note" v-else>
        Halaman form detail sedang disiapkan pada tahap berikutnya. Navigasi task_id sudah aktif.
      </p>
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
}
</style>
