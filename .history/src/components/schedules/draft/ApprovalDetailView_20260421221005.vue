<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useScheduleWorkspaceStore } from '@/stores/schedules/scheduleWorkspaceStore'
import { useScheduleDraftStore } from '@/stores/schedules/scheduleDraftStore'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import ScheduleGrid from '@/components/schedules/draft/ScheduleGrid.vue'
import type {
  ScheduleApprovalListDTO,
  ScheduleDraftDTO,
} from '@/interfaces/schedules/schedule.types'
import apiService from '@/services/api.service'

// ─── Props ───────────────────────────────────────────────────────────────────
const props = defineProps<{
  approvalData: ScheduleApprovalListDTO
}>()

// ─── Emits ───────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  back: []
}>()

// ─── Stores ──────────────────────────────────────────────────────────────────
const workspaceStore = useScheduleWorkspaceStore()
const timeSlotStore = useTimeSlotStore()
const draftStore = useScheduleDraftStore()
const toast = useToast()

// ─── Local State ─────────────────────────────────────────────────────────────
const isInitializing = ref(true)

// State khusus untuk modal Revisi
const showRevisionModal = ref(false)
const revisionNote = ref('')
const isSubmitting = ref(false)

// State khusus untuk modal Approve
const showApproveModal = ref(false)
const isApproving = ref(false)

// ─── Computed ─────────────────────────────────────────────────────────────────
const isGridReady = computed(() => {
  if (isInitializing.value) return false
  if (timeSlotStore.isLoading) return false
  if (workspaceStore.activeClassId && workspaceStore.isLoadingGrid) return false
  return true
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  isInitializing.value = true
  try {
    const draftAdapter: ScheduleDraftDTO = {
      scheduleId: props.approvalData.id,
      name: props.approvalData.scheduleName,
      status: props.approvalData.status as any,
      createdAt: props.approvalData.createdAt,
    }

    await Promise.all([
      timeSlotStore.fetchAcademicYears(),
      workspaceStore.initWorkspace(draftAdapter),
    ])

    if (timeSlotStore.activeSemesterId || props.approvalData.semesterId) {
      draftStore.selectedSemesterId = props.approvalData.semesterId
      await timeSlotStore.fetchSlotStructure()
    }
  } catch (error) {
    console.error('Gagal memuat detail approval:', error)
    showToast('Gagal memuat detail jadwal', 'error')
  } finally {
    isInitializing.value = false
  }
})

// ─── Functions ────────────────────────────────────────────────────────────────
async function onSelectClass(classId: string) {
  if (classId) await workspaceStore.setActiveClass(classId)
}

function onBack() {
  workspaceStore.resetWorkspace()
  emit('back')
}

function showToast(msg: string, type: 'success' | 'warning' | 'error') {
  if (type === 'success') toast.success(msg)
  else if (type === 'warning') toast.warning(msg)
  else toast.error(msg)
}

// ─── Action: Approve ─────────────────────────────────────────────────────────
function openApproveModal() {
  showApproveModal.value = true
}

async function submitApprove() {
  isApproving.value = true
  try {
    await apiService.put(`/schedules/${props.approvalData.id}/approve`, {})
    showToast('Jadwal berhasil disetujui dan diterbitkan!', 'success')
    showApproveModal.value = false
    onBack()
  } catch (error) {
    showToast('Gagal menyetujui jadwal', 'error')
    console.error(error)
  } finally {
    isApproving.value = false
  }
}

// ─── Action: Request Revision ────────────────────────────────────────────────
async function submitRevision() {
  if (!revisionNote.value.trim()) {
    showToast('Catatan revisi wajib diisi!', 'warning')
    return
  }

  isSubmitting.value = true
  try {
    await apiService.put(`/schedules/${props.approvalData.id}/revision`, {
      revisionNote: revisionNote.value.trim(),
    })
    showToast('Jadwal dikembalikan ke Staff untuk direvisi.', 'success')
    showRevisionModal.value = false
    onBack()
  } catch (error) {
    showToast('Gagal mengirim revisi', 'error')
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  if (status === 'PUBLISHED') return 'bg-green-100 text-green-800 border-green-200'
  if (status === 'REVISION_REQUIRED') return 'bg-red-100 text-red-800 border-red-200'
  if (status === 'PENDING_APPROVAL' || status === 'DRAFT')
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

function statusLabel(status: string) {
  if (status === 'PUBLISHED') return 'Final / Disetujui'
  if (status === 'REVISION_REQUIRED') return 'Butuh Revisi'
  if (status === 'PENDING_APPROVAL' || status === 'DRAFT') return 'Menunggu Persetujuan'
  return status
}
function closeRevisionModal() {
  showRevisionModal.value = false
  revisionNote.value = ''
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-200">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <button
            class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 hover:text-emerald-700"
            @click="onBack"
            title="Kembali ke Antrean"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div>
            <div class="flex items-center gap-3 mb-1">
              <h2 class="text-xl font-bold text-emerald-800">{{ approvalData.scheduleName }}</h2>
              <span
                :class="[
                  'rounded-full px-3 py-0.5 text-xs font-semibold border',
                  statusBadge(approvalData.status),
                ]"
              >
                {{ statusLabel(approvalData.status) }}
              </span>
            </div>
            <span class="text-xs text-gray-500 font-medium">
              Pengaju: {{ approvalData.createdBy }} • Diajukan:
              {{ new Date(approvalData.createdAt).toLocaleDateString('id-ID') }}
            </span>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            class="rounded-lg border-2 border-red-500 bg-white px-5 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            @click="showRevisionModal = true"
          >
            {{
              approvalData.status === 'PUBLISHED'
                ? '❌ Batal Publikasi & Revisi'
                : '❌ Minta Revisi'
            }}
          </button>

          <button
            v-if="approvalData.status !== 'PUBLISHED'"
            class="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            @click="openApproveModal"
          >
            ✅ Setujui & Publikasikan
          </button>
        </div>
      </div>

      <div
        v-if="approvalData.status === 'REVISION_REQUIRED' && approvalData.revisionNote"
        class="w-full rounded-lg bg-red-50 p-3 border border-red-100 mt-2"
      >
        <strong class="text-sm text-red-800 block mb-1">Catatan Revisi Saat Ini:</strong>
        <p class="text-sm text-red-700 italic">"{{ approvalData.revisionNote }}"</p>
      </div>
    </div>

    <div
      v-if="isInitializing || timeSlotStore.isLoading"
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700"
      ></div>
      <p class="mt-4 text-sm font-medium text-gray-500">Memuat detail jadwal...</p>
    </div>

    <div v-else class="flex gap-4 items-start">
      <div
        class="w-64 shrink-0 rounded-xl bg-white p-4 shadow-sm border border-gray-200 sticky top-4"
      >
        <h3 class="mb-0.5 text-sm font-bold text-emerald-800">Pilih Kelas</h3>
        <p class="mb-3 text-xs text-gray-400">Klik kartu untuk melihat jadwal.</p>

        <div class="flex flex-col gap-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
          <button
            v-for="cls in workspaceStore.classSummaries"
            :key="cls.classId"
            class="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-semibold transition text-left w-full"
            :class="
              workspaceStore.activeClassId === cls.classId
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50'
            "
            @click="onSelectClass(cls.classId)"
          >
            <span class="truncate mr-2">{{ cls.className }}</span>
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="
                workspaceStore.activeClassId === cls.classId
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-white border border-gray-200 text-gray-500'
              "
            >
              {{ cls.filledHours }}/{{ cls.targetHours }} jam
            </span>
          </button>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div
          v-if="workspaceStore.activeClassId"
          class="relative w-full rounded-xl bg-white p-4 shadow-sm border border-gray-200 overflow-x-auto"
        >
          <div
            class="absolute inset-0 z-10 cursor-not-allowed"
            title="Mode Pratinjau (Read-Only)"
          ></div>
          <ScheduleGrid :is-grid-ready="isGridReady" @show-toast="showToast" />
        </div>

        <div v-else class="rounded-xl border border-gray-200 bg-white py-20 text-center shadow-sm">
          <div class="mb-4 text-6xl">👁️</div>
          <h3 class="mb-2 text-xl font-bold text-gray-800">Mode Pratinjau Jadwal</h3>
          <p class="text-sm text-gray-500 max-w-md mx-auto">
            Silakan pilih kelas pada panel di kiri untuk melihat susunan jadwal sebelum Anda
            memberikan persetujuan atau meminta revisi.
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="showRevisionModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showRevisionModal = false"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h3 class="mb-2 text-xl font-bold text-gray-800">
          {{
            approvalData.status === 'PUBLISHED'
              ? 'Tarik Publikasi & Minta Revisi'
              : 'Minta Revisi Jadwal'
          }}
        </h3>
        <p class="mb-5 text-sm text-gray-500">
          <span v-if="approvalData.status === 'PUBLISHED'">
            Jadwal ini akan <strong>ditarik dari publikasi</strong> dan dikembalikan ke Staff dengan
            status <span class="font-bold text-red-600">Butuh Revisi</span>.
          </span>
          <span v-else>
            Jadwal ini akan dikembalikan ke Staff dengan status
            <span class="font-bold text-red-600">Butuh Revisi</span>.
          </span>
          Tuliskan detail perbaikannya di bawah ini.
        </p>

        <textarea
          v-model="revisionNote"
          rows="4"
          placeholder="Contoh: Jadwal Bu Susi di hari Senin bentrok dengan rapat guru..."
          class="w-full rounded-xl border border-gray-300 p-4 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none resize-none"
        ></textarea>

        <div class="mt-6 flex justify-end gap-3">
          <button
            class="rounded-lg px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
            @click="closeRevisionModal"
            :disabled="isSubmitting"
          >
            Batal
          </button>
          <button
            :disabled="isSubmitting || !revisionNote.trim()"
            class="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
            @click="submitRevision"
          >
            {{
              isSubmitting
                ? 'Mengirim...'
                : approvalData.status === 'PUBLISHED'
                  ? 'Ya, Unpublish & Revisi'
                  : 'Kirim Catatan Revisi'
            }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showApproveModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showApproveModal = false"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl text-center transform transition-all"
      >
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h3 class="mb-2 text-2xl font-bold text-gray-800">Setujui Jadwal?</h3>
        <p class="mb-8 text-sm text-gray-500 leading-relaxed">
          Jadwal <span class="font-bold text-gray-700">"{{ approvalData.scheduleName }}"</span> akan
          diterbitkan dan menjadi jadwal resmi. Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex justify-center gap-3">
          <button
            class="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
            @click="showApproveModal = false"
            :disabled="isApproving"
          >
            Batal
          </button>
          <button
            :disabled="isApproving"
            class="flex min-w-[140px] items-center justify-center rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-70"
            @click="submitApprove"
          >
            <span
              v-if="isApproving"
              class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            ></span>
            {{ isApproving ? 'Memproses...' : 'Ya, Terbitkan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
