<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleDraftStore } from '@/stores/schedules/scheduleDraftStore'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import ScheduleApprovalModal from './ScheduleApprovalModal.vue'
import type { ScheduleDraftDTO } from '@/interfaces/schedules/schedule.types'
import { scheduleService } from '@/services/schedule/schedule.service'

// ─── Extended Type ───────────────────────────────────────────────────────────
interface MergedDraft extends ScheduleDraftDTO {
  revisionNote?: string | null
}

// ─── Stores ──────────────────────────────────────────────────────────────────
const router = useRouter()
const draftStore = useScheduleDraftStore()
const timeSlotStore = useTimeSlotStore()

// ─── Emits ───────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  'open-draft': [id: string]
  'create-draft': []
}>()

// --- Functions ---
/** Prompts the user to generate a draft and switches into workspace mode immediately */
function onCreateDraft() {
  const name = prompt('Masukkan nama draft jadwal:')
  if (name && name.trim()) {
    const draft = store.createDraft(name.trim())
    emit('open-draft', draft.id)
  }
}

/** Determines tailwind color tokens based on string status values */
function statusBadge(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-600'
    case 'WAITING_APPROVAL':
      return 'bg-amber-100 text-amber-700'
    case 'REVISION':
      return 'bg-red-100 text-red-600'
    case 'PUBLISHED':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/** Defines local human readable translation for status labels */
function statusLabel(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'Draft'
    case 'WAITING_APPROVAL':
      return 'Menunggu Persetujuan'
    case 'REVISION':
      return 'Revisi'
    case 'PUBLISHED':
      return 'Terpublikasi'
    default:
      return status
  }
}
</script>

<template>
  <div>

    <!-- Dashboard Header -->
    <div class="mb-6">
      <h2 class="mb-1 text-2xl font-bold text-emerald-800">Daftar Draft Jadwal</h2>
      <p class="text-sm text-gray-500">Pilih draft yang sudah ada atau buat yang baru.</p>
    </div>

    <!-- Draft Selection Grid -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

      <!-- New Draft Button -->
      <button
        class="group flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white transition-all hover:border-emerald-600 hover:bg-emerald-50"
        @click="onCreateDraft"
      >
        <span class="mb-2 text-4xl text-gray-400 transition-colors group-hover:text-emerald-600"
          >＋</span
        >
        <span class="font-semibold text-gray-500 group-hover:text-emerald-700"
          >Buat Draft Baru</span
        >
      </button>

      <!-- Existing Draft Cards -->
      <div
        v-for="draft in store.drafts"
        :key="draft.id"
        class="flex min-h-[160px] cursor-pointer flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-600 hover:shadow-md"
        @click="emit('open-draft', draft.id)"
      >
        <div>
          <h3 class="mb-1 text-base font-bold text-gray-800">{{ draft.name }}</h3>
          <span
            :class="['inline-block rounded-full px-3 py-0.5 text-xs font-semibold', statusBadge(draft.status)]"
          >
            {{ statusLabel(draft.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
