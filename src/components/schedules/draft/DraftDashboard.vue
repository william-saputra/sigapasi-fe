<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleDraftStore } from '@/stores/schedules/scheduleDraftStore'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import type { ScheduleDraftDTO } from '@/interfaces/schedules/schedule.types'

// ─── Stores ──────────────────────────────────────────────────────────────────
const router = useRouter()
const draftStore = useScheduleDraftStore()
const timeSlotStore = useTimeSlotStore()

// ─── Emits ───────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  'open-draft': [draft: ScheduleDraftDTO]
}>()

// ─── Local State ─────────────────────────────────────────────────────────────
const showCreateModal = ref(false)
const newDraftName = ref('')
const publishingId = ref<string | null>(null)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  if (timeSlotStore.academicYears.length === 0) {
    await timeSlotStore.fetchAcademicYears()
  }
  // Auto-select tahun ajaran & semester aktif
  const activeYear = timeSlotStore.academicYears.find(ay => ay.is_active || ay.isActive)
    ?? timeSlotStore.academicYears[0]
  if (activeYear) {
    draftStore.selectAcademicYear(activeYear.id)
    const activeSem = activeYear.listSemesters.find(s => s.is_active || s.isActive)
      ?? activeYear.listSemesters[0]
    if (activeSem) {
      draftStore.selectSemester(activeSem.id)
      await draftStore.fetchDrafts()
    }
  }
})

// ─── Computed ─────────────────────────────────────────────────────────────────
const flattenedSemesters = computed(() => {
  const result: { id: string, label: string, ayId: string }[] = []
  for (const ay of draftStore.academicYears) {
    const yearLabel = `${ay.year_start ?? ay.yearStart}/${ay.year_end ?? ay.yearEnd}`
    for (const sem of ay.listSemesters) {
      result.push({
        id: sem.id,
        ayId: ay.id,
        label: `${sem.name}`
      })
    }
  }
  return result
})

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(() => draftStore.selectedSemesterId, async (val) => {
  if (val) await draftStore.fetchDrafts()
})

function onSemesterSelect(e: Event) {
  const semId = (e.target as HTMLSelectElement).value
  if (!semId) {
    draftStore.selectAcademicYear('')
    return
  }
  const found = flattenedSemesters.value.find(s => s.id === semId)
  if (found) {
    draftStore.selectedAcademicYearId = found.ayId
    draftStore.selectSemester(found.id)
  }
}

// ─── Functions ────────────────────────────────────────────────────────────────
async function onCreateDraft() {
  if (!newDraftName.value.trim()) return
  const draft = await draftStore.createDraft(newDraftName.value.trim())
  if (draft) {
    showToast('Draf berhasil dibuat!', 'success')
    showCreateModal.value = false
    newDraftName.value = ''
  } else {
    showToast(draftStore.errorMessage ?? 'Gagal membuat draf.', 'error')
  }
}

async function onPublish(draft: ScheduleDraftDTO) {
  if (draft.status === 'PUBLISHED') return
  publishingId.value = draft.scheduleId
  const ok = await draftStore.publishDraft(draft.scheduleId)
  publishingId.value = null
  if (ok) {
    showToast('Draf berhasil dipublikasikan!', 'success')
  } else {
    showToast(draftStore.errorMessage ?? 'Gagal mempublikasikan.', 'error')
  }
}

function showToast(msg: string, type: 'success' | 'error') {
  toastMessage.value = msg
  toastType.value = type
  setTimeout(() => { toastMessage.value = null }, 4000)
}

function statusBadge(status: string) {
  return status === 'PUBLISHED'
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-100 text-gray-600'
}

function statusLabel(status: string) {
  return status === 'PUBLISHED' ? 'Terpublikasi' : 'Draft'
}
</script>

<template>
  <div>
    <!-- ─── Toast Notification ──────────────────────────────────────────── -->
    <div
      v-if="toastMessage"
      :class="[
        'fixed top-5 right-5 z-50 rounded-lg px-5 py-3 text-sm font-semibold shadow-lg transition-all',
        toastType === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
      ]"
    >
      {{ toastMessage }}
    </div>

    <!-- ─── Header ────────────────────────────────────────────────────────── -->
    <div class="mb-4">
      <button
        @click="router.push('/jadwal')"
        class="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-emerald-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 19-7-7 7-7"/>
          <path d="M19 12H5"/>
        </svg>
        Kembali ke Dashboard
      </button>
    </div>
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="mb-1 text-2xl font-bold text-emerald-800">Daftar Draft Jadwal</h2>
        <p class="text-sm text-gray-500">Pilih draft yang sudah ada atau buat yang baru.</p>
      </div>
      <button
        class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800"
        @click="showCreateModal = true"
      >
        + Buat Draft Baru
      </button>
    </div>

    <!-- ─── Semester Filter ────────────────────────────────────────────────── -->
    <div class="mb-6 flex flex-wrap gap-4">
      <div class="flex flex-col gap-1 w-64">
        <label class="text-xs font-semibold text-gray-500">Pilih Semester</label>
        <select
          :value="draftStore.selectedSemesterId ?? ''"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          @change="onSemesterSelect"
        >
          <option value="">-- Pilih Semester --</option>
          <option v-for="sem in flattenedSemesters" :key="sem.id" :value="sem.id">
            {{ sem.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- ─── Loading Skeleton ──────────────────────────────────────────────── -->
    <div v-if="draftStore.isLoadingDrafts" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-36 animate-pulse rounded-xl bg-gray-100"
      />
    </div>

    <!-- ─── Draft Cards Grid ──────────────────────────────────────────────── -->
    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Existing Draft Cards -->
      <div
        v-for="draft in draftStore.drafts"
        :key="draft.scheduleId"
        class="flex min-h-[160px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-600 hover:shadow-md"
      >
        <!-- Card Top: Info + Status -->
        <div
          class="cursor-pointer"
          @click="emit('open-draft', draft)"
        >
          <h3 class="mb-1 text-base font-bold text-gray-800">{{ draft.name }}</h3>
          <span
            :class="['inline-block rounded-full px-3 py-0.5 text-xs font-semibold', statusBadge(draft.status)]"
          >
            {{ statusLabel(draft.status) }}
          </span>
          <div class="mt-2 text-xs text-gray-400">
            Dibuat: {{ new Date(draft.createdAt).toLocaleDateString('id-ID') }}
          </div>
        </div>

        <!-- Card Bottom: Actions -->
        <div class="mt-4 flex gap-2">
          <button
            class="flex-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800"
            @click="emit('open-draft', draft)"
          >
            Buka
          </button>
          <button
            v-if="draft.status === 'DRAFT'"
            :disabled="publishingId === draft.scheduleId"
            class="flex-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
            @click="onPublish(draft)"
          >
            {{ publishingId === draft.scheduleId ? 'Memproses...' : 'Publikasikan' }}
          </button>
        </div>
      </div>

      <!-- Empty State (when no drafts for selected semester) -->
      <div
        v-if="draftStore.drafts.length === 0 && draftStore.selectedSemesterId && !draftStore.isLoadingDrafts"
        class="col-span-full py-12 text-center text-gray-400"
      >
        <div class="mb-3 text-4xl">📋</div>
        <p>Belum ada draf untuk semester ini.</p>
      </div>
    </div>

    <!-- ─── Create Draft Modal ────────────────────────────────────────────── -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showCreateModal = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-lg font-bold text-gray-800">Buat Draft Jadwal Baru</h3>
        <div class="mb-4">
          <label class="mb-1 block text-sm font-semibold text-gray-600">Nama Draft</label>
          <input
            v-model="newDraftName"
            type="text"
            placeholder="Contoh: Draft Ganjil 2025/2026 v1"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            @keyup.enter="onCreateDraft"
          />
        </div>
        <div class="flex justify-end gap-3">
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            @click="showCreateModal = false; newDraftName = ''"
          >
            Batal
          </button>
          <button
            :disabled="draftStore.isCreating || !newDraftName.trim()"
            class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
            @click="onCreateDraft"
          >
            {{ draftStore.isCreating ? 'Membuat...' : 'Buat Draft' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
