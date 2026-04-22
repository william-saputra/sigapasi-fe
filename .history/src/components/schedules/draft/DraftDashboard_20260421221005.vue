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
  'open-draft': [draft: ScheduleDraftDTO]
}>()

// ─── Local State ─────────────────────────────────────────────────────────────
const showCreateModal = ref(false)
const newDraftName = ref('')
const publishingId = ref<string | null>(null)
const submittingId = ref<string | null>(null)
const globalError = ref<string | null>(null)
const modalError = ref<string | null>(null)

// Schedule Approval Modal State
const showApprovalModal = ref(false)
const selectedScheduleId = ref<string | null>(null)
const isLoading = ref(false)

function getAuthRole(): string {
  try {
    const token = localStorage.getItem('token')
    if (!token) return 'STAFF'
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return 'STAFF'
    const decodedPayload = JSON.parse(atob(payloadPart))
    return decodedPayload.role ?? 'STAFF'
  } catch {
    return 'STAFF'
  }
}
const userRole = ref(getAuthRole())

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  if (timeSlotStore.academicYears.length === 0) {
    await timeSlotStore.fetchAcademicYears()
  }

  const activeYear =
    timeSlotStore.academicYears.find((ay) => ay.is_active || ay.isActive) ??
    timeSlotStore.academicYears[0]
  if (activeYear) {
    draftStore.selectAcademicYear(activeYear.id)
    const activeSem =
      activeYear.listSemesters.find((s) => s.is_active || s.isActive) ?? activeYear.listSemesters[0]
    if (activeSem) {
      draftStore.selectSemester(activeSem.id)
      await Promise.all([draftStore.fetchDrafts(), draftStore.fetchAllSchedules()])
    }
  }
})

// ─── Computed ─────────────────────────────────────────────────────────────────
const flattenedSemesters = computed(() => {
  const result: { id: string; label: string; ayId: string }[] = []
  for (const ay of draftStore.academicYears) {
    const yearLabel = `${ay.year_start ?? ay.yearStart}/${ay.year_end ?? ay.yearEnd}`
    for (const sem of ay.listSemesters) {
      result.push({
        id: sem.id,
        ayId: ay.id,
        label: `${sem.name}`,
      })
    }
  }
  return result
})

const mergedDrafts = computed<MergedDraft[]>(() => {
  return draftStore.drafts.map((draft) => {
    const approvalData = draftStore.allSchedules.find(
      (schedule: any) => schedule.id === draft.scheduleId,
    )

    return {
      ...draft,
      revisionNote: (approvalData as any)?.revisionNote || null,
    }
  })
})

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(
  () => draftStore.selectedSemesterId,
  async (val) => {
    if (val) {
      await Promise.all([draftStore.fetchDrafts(), draftStore.fetchAllSchedules()])
    }
  },
)

function onSemesterSelect(e: Event) {
  const semId = (e.target as HTMLSelectElement).value
  if (!semId) {
    draftStore.selectAcademicYear('')
    return
  }
  const found = flattenedSemesters.value.find((s) => s.id === semId)
  if (found) {
    draftStore.selectedAcademicYearId = found.ayId
    draftStore.selectSemester(found.id)
  }
}

// ─── Functions ────────────────────────────────────────────────────────────────

async function onCreateDraft() {
  if (!newDraftName.value.trim() || !draftStore.selectedSemesterId) return

  modalError.value = null
  isLoading.value = true
  const payload = {
    semesterId: draftStore.selectedSemesterId,
    name: newDraftName.value.trim(),
  }

  try {
    const draft = await scheduleService.createDraft(payload)
    draftStore.drafts.unshift(draft)
    showCreateModal.value = false
    newDraftName.value = ''

    router.push({ name: 'penyusunan-jadwal', query: { scheduleId: draft.scheduleId } })
    emit('open-draft', draft)
  } catch (error: any) {
    modalError.value = error.response?.data?.message || 'Gagal membuat draf jadwal.'
  } finally {
    isLoading.value = false
  }
}

async function onPublish(draft: ScheduleDraftDTO) {
  if (draft.status === 'PUBLISHED') return
  publishingId.value = draft.scheduleId
  const ok = await draftStore.publishDraft(draft.scheduleId)
  publishingId.value = null
  if (ok) {
    globalError.value = null
  }
}

// Fungsi baru untuk mengajukan kembali jadwal yang direvisi
async function onSubmitApproval(scheduleId: string) {
  submittingId.value = scheduleId
  const ok = await draftStore.submitDraft(scheduleId)
  submittingId.value = null

  if (ok) {
    globalError.value = null
    await draftStore.fetchAllSchedules()
  }
}

function statusBadge(status: string) {
  if (status === 'PUBLISHED') return 'bg-green-100 text-green-800 border-green-200'
  if (status === 'REVISION_REQUIRED') return 'bg-red-100 text-red-800 border-red-200'
  if (status === 'PENDING_APPROVAL' || status === 'DRAFT')
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

function statusLabel(status: string) {
  if (status === 'PUBLISHED') return 'Final'
  if (status === 'REVISION_REQUIRED') return 'Butuh Revisi'
  if (status === 'PENDING_APPROVAL' || status === 'DRAFT') return 'Menunggu Persetujuan'
  return status
}

function openApprovalModal(draft: ScheduleDraftDTO) {
  selectedScheduleId.value = draft.scheduleId
  showApprovalModal.value = true
}

async function handleApprovalSubmit(payload: { status: string; revisionNote: string | null }) {
  if (!selectedScheduleId.value) return
  const ok = await draftStore.updateScheduleStatus(
    selectedScheduleId.value,
    payload.status,
    payload.revisionNote,
  )
  if (ok) {
    showApprovalModal.value = false
    selectedScheduleId.value = null
    await draftStore.fetchAllSchedules()
  }
}

function clearAndCloseErrors() {
  globalError.value = null
  draftStore.clearError()
}

function closeCreateModal() {
  showCreateModal.value = false
  newDraftName.value = ''
}
</script>

<template>
  <div>
    <div
      v-if="globalError || draftStore.errorMessage"
      class="mb-5 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span>⚠️</span>
      <span class="flex-1">{{ globalError || draftStore.errorMessage }}</span>
      <button class="text-xs font-semibold underline" @click="clearAndCloseErrors">Tutup</button>
    </div>

    <div class="mb-4">
      <button
        @click="router.push('/jadwal')"
        class="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-emerald-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
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

    <div
      v-if="draftStore.isLoadingDrafts"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div v-for="i in 3" :key="i" class="h-36 animate-pulse rounded-xl bg-gray-100" />
    </div>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="draft in mergedDrafts"
        :key="draft.scheduleId"
        class="flex min-h-[160px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-600 hover:shadow-md"
      >
        <div class="cursor-pointer" @click="emit('open-draft', draft)">
          <h3 class="mb-1 text-base font-bold text-gray-800">{{ draft.name }}</h3>
          <span
            :class="[
              'inline-block rounded-full px-3 py-0.5 text-xs font-semibold',
              statusBadge(draft.status),
            ]"
          >
            {{ statusLabel(draft.status) }}
          </span>
          <div class="mt-2 text-xs text-gray-400">
            Dibuat: {{ new Date(draft.createdAt).toLocaleDateString('id-ID') }}
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2">
          <div
            v-if="draft.status === 'REVISION_REQUIRED' && draft.revisionNote"
            class="rounded-lg bg-red-50 p-3 mb-2 border border-red-200 text-xs"
          >
            <strong class="text-red-800 block mb-1">⚠️ Catatan Revisi Atasan:</strong>
            <p class="text-red-700">{{ draft.revisionNote }}</p>
          </div>

          <div class="flex gap-2">
            <button
              v-if="userRole === 'HEAD'"
              class="flex-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-800"
              @click="emit('open-draft', draft)"
            >
              Lihat Detail Jadwal
            </button>
            <button
              v-else
              class="flex-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800"
              @click="emit('open-draft', draft)"
            >
              {{ draft.status === 'PUBLISHED' ? 'Lihat Jadwal' : 'Edit Jadwal' }}
            </button>

            <button
              v-if="
                userRole !== 'HEAD' &&
                (draft.status === 'REVISION_REQUIRED' || draft.status === 'DRAFT')
              "
              :disabled="
                (draftStore.isPublishing && publishingId === draft.scheduleId) ||
                submittingId === draft.scheduleId
              "
              class="flex-1 rounded-lg border border-yellow-500 bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700 transition hover:bg-yellow-100 disabled:opacity-50"
              @click="onSubmitApproval(draft.scheduleId)"
            >
              {{ submittingId === draft.scheduleId ? 'Mengajukan...' : 'Ajukan' }}
            </button>

            <button
              v-if="userRole === 'HEAD' && draft.status !== 'PUBLISHED'"
              :disabled="draftStore.isPublishing && publishingId === draft.scheduleId"
              class="flex-1 rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
              @click="openApprovalModal(draft)"
            >
              Review Jadwal
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="
          mergedDrafts.length === 0 && draftStore.selectedSemesterId && !draftStore.isLoadingDrafts
        "
        class="col-span-full py-12 text-center text-gray-400"
      >
        <div class="mb-3 text-4xl">📋</div>
        <p>Belum ada draf untuk semester ini.</p>
      </div>
    </div>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showCreateModal = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="mb-4 text-lg font-bold text-gray-800">Buat Draft Jadwal Baru</h3>

        <div
          v-if="modalError"
          class="mb-4 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800"
        >
          <span>⚠️</span>
          <span class="flex-1">{{ modalError }}</span>
          <button class="text-xs font-semibold underline" @click="modalError = null">Tutup</button>
        </div>

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
            @click="closeCreateModal"
          >
            Batal
          </button>
          <button
            :disabled="isLoading || !newDraftName.trim()"
            class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
            @click="onCreateDraft"
          >
            {{ isLoading ? 'Membuat...' : 'Buat Draft' }}
          </button>
        </div>
      </div>
    </div>

    <ScheduleApprovalModal
      :show="showApprovalModal"
      :schedule-id="selectedScheduleId"
      @close="showApprovalModal = false"
      @submit="handleApprovalSubmit"
    />
  </div>
</template>
