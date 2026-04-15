<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useScheduleWorkspaceStore } from '@/stores/schedules/scheduleWorkspaceStore'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import SidebarResource from './SidebarResource.vue'
import ScheduleGrid from './ScheduleGrid.vue'
import type { ScheduleDraftDTO } from '@/interfaces/schedules/schedule.types'

// ─── Props ───────────────────────────────────────────────────────────────────
const props = defineProps<{ draft: ScheduleDraftDTO }>()

// ─── Emits ───────────────────────────────────────────────────────────────────
const emit = defineEmits<{ back: [] }>()

// ─── Stores ──────────────────────────────────────────────────────────────────
const workspaceStore = useScheduleWorkspaceStore()
const timeSlotStore = useTimeSlotStore()

// ─── Local State ─────────────────────────────────────────────────────────────
const isSaving = ref(false)
const isClearingClass = ref(false)
const showValidationModal = ref(false)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'warning' | 'error'>('success')

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await workspaceStore.initWorkspace(props.draft)
  // Pastikan time slots sudah dimuat (semesterId dari draft jika tersedia)
  if (timeSlotStore.academicYears.length > 0 && timeSlotStore.activeSemesterId) {
    await timeSlotStore.fetchSlotStructure()
  }
})

// ─── Functions ────────────────────────────────────────────────────────────────
async function onSelectClass(event: Event) {
  const classId = (event.target as HTMLSelectElement).value
  if (classId) await workspaceStore.setActiveClass(classId)
}

async function onSaveAndClose() {
  if (!workspaceStore.activeClassId) {
    emit('back')
    return
  }
  isSaving.value = true
  const result = await workspaceStore.validateClass()
  isSaving.value = false

  if (!result || result.status === 'OK') {
    emit('back')
  } else {
    // Ada mapel yang belum terpenuhi → tampilkan modal peringatan
    showValidationModal.value = true
  }
}

async function onClearClass() {
  if (!workspaceStore.activeClassId) return
  if (!confirm('Yakin ingin menghapus SELURUH jadwal kelas ini? Tindakan ini tidak bisa dibatalkan.')) return
  isClearingClass.value = true
  const result = await workspaceStore.clearClassEntries()
  isClearingClass.value = false
  if (result.error) {
    showToast(result.error, 'error')
  } else if (result.success) {
    showToast(result.success, 'success')
  }
}

function onBack() {
  workspaceStore.resetWorkspace()
  emit('back')
}

function showToast(msg: string, type: 'success' | 'warning' | 'error') {
  toastMessage.value = msg
  toastType.value = type
  setTimeout(() => { toastMessage.value = null }, 4500)
}

function toastBgClass() {
  if (toastType.value === 'success') return 'bg-emerald-600 text-white'
  if (toastType.value === 'warning') return 'bg-amber-500 text-white'
  return 'bg-red-600 text-white'
}
</script>

<template>
  <div>
    <!-- ─── Toast Notification ──────────────────────────────────────────── -->
    <div
      v-if="toastMessage"
      :class="['fixed top-5 right-5 z-50 max-w-sm rounded-lg px-5 py-3 text-sm font-semibold shadow-lg', toastBgClass()]"
    >
      {{ toastMessage }}
    </div>

    <!-- ─── Workspace Header ───────────────────────────────────────────────── -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <!-- Back + Title -->
      <div class="flex items-center gap-3">
        <button
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          @click="onBack"
        >
          ← Kembali
        </button>
        <div>
          <h2 class="text-xl font-bold text-emerald-800">{{ draft.name }}</h2>
          <span class="text-xs text-gray-400">
            {{ draft.status === 'PUBLISHED' ? '🔒 Terpublikasi' : '✏️ Draft Mode' }}
          </span>
        </div>
      </div>

      <!-- Controls: Class Select + Actions -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Class Dropdown -->
        <select
          :value="workspaceStore.activeClassId ?? ''"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
          @change="onSelectClass"
        >
          <option value="">— Pilih Kelas —</option>
          <option
            v-for="cls in workspaceStore.classSummaries"
            :key="cls.classId"
            :value="cls.classId"
          >
            {{ cls.className }}
            ({{ cls.filledHours }}/{{ cls.targetHours }} jam)
          </option>
        </select>

        <!-- Clear class button -->
        <button
          v-if="workspaceStore.activeClassId"
          :disabled="isClearingClass || draft.status === 'PUBLISHED'"
          class="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
          @click="onClearClass"
        >
          {{ isClearingClass ? 'Menghapus...' : 'Kosongkan Kelas' }}
        </button>

        <!-- Save & Close -->
        <button
          :disabled="isSaving || draft.status === 'PUBLISHED'"
          class="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:opacity-50"
          @click="onSaveAndClose"
        >
          {{ isSaving ? 'Memvalidasi...' : 'Simpan & Tutup' }}
        </button>
      </div>
    </div>

    <!-- ─── Active Class Workspace ─────────────────────────────────────────── -->
    <div v-if="workspaceStore.activeClassId" class="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      <SidebarResource />
      <ScheduleGrid @show-toast="showToast" />
    </div>

    <!-- ─── Empty State (no class selected) ──────────────────────────────── -->
    <div v-else class="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
      <div class="mb-3 text-5xl">📋</div>
      <h3 class="mb-2 text-lg font-bold text-gray-700">Pilih Kelas Terlebih Dahulu</h3>
      <p class="text-sm text-gray-400">
        Gunakan dropdown di atas untuk memilih kelas sebelum menyusun jadwal.
      </p>
    </div>

    <!-- ─── Validation Warning Modal ──────────────────────────────────────── -->
    <div
      v-if="showValidationModal && workspaceStore.validationResult"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-center gap-3">
          <span class="text-3xl">⚠️</span>
          <div>
            <h3 class="text-lg font-bold text-gray-800">Jadwal Belum Lengkap</h3>
            <p class="text-sm text-gray-500">Beberapa mata pelajaran belum memenuhi target jam.</p>
          </div>
        </div>

        <!-- Unfulfilled subjects table -->
        <div class="mb-5 max-h-60 overflow-y-auto rounded-lg border border-gray-200">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Mata Pelajaran</th>
                <th class="px-4 py-2 text-center text-xs font-semibold text-gray-600">Target</th>
                <th class="px-4 py-2 text-center text-xs font-semibold text-gray-600">Terisi</th>
                <th class="px-4 py-2 text-center text-xs font-semibold text-gray-600">Kurang</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="sub in workspaceStore.validationResult.unfulfilledSubjects"
                :key="sub.subjectName"
                class="border-t border-gray-100"
              >
                <td class="px-4 py-2 font-medium text-gray-800">{{ sub.subjectName }}</td>
                <td class="px-4 py-2 text-center text-gray-600">{{ sub.targetHours }} jam</td>
                <td class="px-4 py-2 text-center text-gray-600">{{ sub.assignedHours }} jam</td>
                <td class="px-4 py-2 text-center font-bold text-red-600">
                  {{ sub.targetHours - sub.assignedHours }} jam
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end gap-3">
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            @click="showValidationModal = false"
          >
            Kembali Susun
          </button>
          <button
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            @click="showValidationModal = false; onBack()"
          >
            Tetap Keluar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
