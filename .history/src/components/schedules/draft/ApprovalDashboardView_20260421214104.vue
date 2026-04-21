<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import apiService from '@/services/api.service'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import type { ScheduleApprovalListDTO } from '@/interfaces/schedules/schedule.types'

const searchQuery = ref<string>('')
const selectedStatus = ref<string>('')
const emit = defineEmits<{
  (e: 'open-detail', item: ScheduleApprovalListDTO): void
}>()

const timeSlotStore = useTimeSlotStore()
const allApprovals = ref<ScheduleApprovalListDTO[]>([])
const isLoading = ref(true)
const selectedSemesterId = ref<string>('')

// ─── Semester flatten ─────────────────────────────────────────────────────
const flattenedSemesters = computed(() => {
  const result: { id: string; label: string }[] = []
  for (const ay of timeSlotStore.academicYears) {
    for (const sem of ay.listSemesters) {
      result.push({ id: sem.id, label: sem.name })
    }
  }
  return result
})

// ─── Filter approvals ─────────────────────────────────────────────────────
const filteredApprovals = computed(() => {
  return allApprovals.value.filter((item: ScheduleApprovalListDTO) => {
    const matchSemester = !selectedSemesterId.value || item.semesterId === selectedSemesterId.value
    const matchStatus = !selectedStatus.value || item.status === selectedStatus.value
    const matchSearch = !searchQuery.value ||
      item.scheduleName.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchSemester && matchStatus && matchSearch
  })
})

// ─── Fetch data ───────────────────────────────────────────────────────────
const fetchApprovals = async () => {
  isLoading.value = true
  try {
    allApprovals.value = await apiService.get<ScheduleApprovalListDTO[]>('/schedules/approvals')
  } catch (error: any) {
    console.error('Error fetching approvals:', error)
  } finally {
    isLoading.value = false
  }
}

// ─── Formatters & Helpers ─────────────────────────────────────────────────
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

// FUNGSI BARU: Untuk memotong teks catatan revisi agar tidak kepanjangan di card
function truncateText(text: string | null | undefined, maxLength: number = 60) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

function statusBadge(status: string) {
  if (status === 'PUBLISHED') return 'bg-green-100 text-green-800 border-green-200'
  if (status === 'REVISION_REQUIRED') return 'bg-red-100 text-red-800 border-red-200'
  if (status === 'PENDING_APPROVAL' || status === 'DRAFT') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

function statusLabel(status: string) {
  if (status === 'PUBLISHED') return 'Final'
  if (status === 'REVISION_REQUIRED') return 'Butuh Revisi'
  if (status === 'PENDING_APPROVAL' || status === 'DRAFT') return 'Menunggu Persetujuan'
  return status
}

onMounted(async () => {
  if (timeSlotStore.academicYears.length === 0) {
    await timeSlotStore.fetchAcademicYears()
  }
  for (const ay of timeSlotStore.academicYears) {
    const activeSem = ay.listSemesters.find(s => s.is_active || s.isActive)
    if (activeSem) {
      selectedSemesterId.value = activeSem.id
      break
    }
  }
  await fetchApprovals()
})
</script>

<template>
  <div class="space-y-6">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="mb-1 text-2xl font-bold text-emerald-800">Antrean Persetujuan</h2>
        <p class="text-sm text-gray-500">Daftar jadwal yang menunggu verifikasi Anda.</p>
      </div>
    </div>

    <div class="mb-6 flex flex-wrap gap-4 items-end">
      <div class="flex flex-col gap-1 w-72">
        <label class="text-xs font-semibold text-gray-500">Cari Jadwal</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Nama jadwal..."
            class="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1 w-56">
        <label class="text-xs font-semibold text-gray-500">Semester</label>
        <select
          v-model="selectedSemesterId"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">-- Semua Semester --</option>
          <option v-for="sem in flattenedSemesters" :key="sem.id" :value="sem.id">
            {{ sem.label }}
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-1 w-52">
        <label class="text-xs font-semibold text-gray-500">Status</label>
        <select
          v-model="selectedStatus"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">-- Semua Status --</option>
          <option value="PUBLISHED">Final</option>
          <option value="REVISION_REQUIRED">Butuh Revisi</option>
          <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-36 animate-pulse rounded-xl bg-gray-100" />
    </div>

    <div
      v-else-if="filteredApprovals.length === 0"
      class="bg-white p-20 text-center rounded-xl border border-dashed border-gray-300"
    >
      <div class="mb-3 text-4xl">📋</div>
      <p class="text-gray-400">Belum ada jadwal yang sesuai kriteria.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="item in filteredApprovals"
        :key="item.id"
        class="flex min-h-[160px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-teal-500 hover:shadow-md"
      >
        <div>
          <h3 class="mb-2 text-base font-bold text-gray-800">{{ item.scheduleName }}</h3>
          <span :class="['inline-block rounded-full px-3 py-0.5 text-xs font-semibold border', statusBadge(item.status)]">
            {{ statusLabel(item.status) }}
          </span>
          <div class="mt-2 text-xs text-gray-400">
            Tanggal: {{ formatDate(item.createdAt) }}
          </div>

          <div v-if="item.status === 'REVISION_REQUIRED' && item.revisionNote" class="mt-3 rounded-lg bg-red-50 p-2.5 border border-red-100 text-xs">
            <strong class="text-red-800 block mb-0.5">Catatan Terakhir:</strong>
            <p class="text-red-700 italic">"{{ truncateText(item.revisionNote, 65) }}"</p>
          </div>
        </div>
        
        <div class="mt-4">
          <button
            @click="emit('open-detail', item)"
            class="w-full rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-800"
          >
            Review Jadwal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>