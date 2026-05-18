<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useScheduleWorkspaceStore } from '@/stores/schedules/scheduleWorkspaceStore'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import SidebarResource from './SidebarResource.vue'
import ScheduleGrid from './ScheduleGrid.vue'
import ClassDropdown from './ClassDropdown.vue'
import ValidationModal from './ValidationModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import type { ScheduleDraftDTO } from '@/interfaces/schedules/schedule.types'
import { Trash2, AlertTriangle, ClipboardList, Lock, Edit3 } from 'lucide-vue-next'

const props = defineProps<{ draft: ScheduleDraftDTO }>()

const emit = defineEmits<{ back: [] }>()

const router = useRouter()
const workspaceStore = useScheduleWorkspaceStore()
const timeSlotStore = useTimeSlotStore()
const toast = useToast()

const isSaving = ref(false)
const isClearingClass = ref(false)
const showClearClassModal = ref(false)
const isInitializing = ref(true)

const isGridReady = computed(() => {
  if (isInitializing.value) return false
  if (timeSlotStore.isLoading) return false
  if (workspaceStore.activeClassId && workspaceStore.isLoadingGrid) return false
  return true
})

onMounted(async () => {
  isInitializing.value = true
  try {
    await Promise.all([
      timeSlotStore.fetchAcademicYears(),
      workspaceStore.initWorkspace(props.draft),
    ])

    if (timeSlotStore.activeSemesterId) {
      await timeSlotStore.fetchSlotStructureForAll()
    }
  } finally {
    isInitializing.value = false
  }
})

onBeforeRouteLeave((to, from, next) => {
  if (workspaceStore.isWorkspaceActive) {
    workspaceStore.setPendingNavigation(
      () => {
        workspaceStore.resetWorkspace()
        next()
      },
      () => {
        next(false)
      }
    )
    workspaceStore.openValidationModal()
  } else {
    next()
  }
})

async function onSelectClass(classId: string) {
  if (classId) await workspaceStore.setActiveClass(classId)
}

async function onSaveAndClose() {
  router.push({
    name: 'jadwal-dashboard',
  })
}

async function onClearClass() {
  if (!workspaceStore.activeClassId) return
  showClearClassModal.value = true
}

async function confirmClearClass() {
  showClearClassModal.value = false
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
  if (workspaceStore.activeClassId && workspaceStore.classSummaries.length > 0) {
    workspaceStore.setPendingNavigation(
      () => {
        workspaceStore.resetWorkspace()
        emit('back')
      },
      () => {}
    )
    workspaceStore.openValidationModal()
  } else {
    workspaceStore.resetWorkspace()
    emit('back')
  }
}

function showToast(msg: string, type: 'success' | 'warning' | 'error') {
  if (type === 'success') toast.success(msg)
  else if (type === 'warning') toast.warning(msg)
  else toast.error(msg)
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          @click="onBack"
        >
          ← Kembali
        </button>
        <div>
          <h2 class="text-xl font-bold text-emerald-800">{{ draft.name }}</h2>
          <span class="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
            <Lock v-if="draft.status === 'PUBLISHED'" class="h-3 w-3" />
            <Edit3 v-else class="h-3 w-3" />
            {{ draft.status === 'PUBLISHED' ? 'Terpublikasi' : 'Draft Mode' }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <ClassDropdown
          v-model="workspaceStore.activeClassId"
          :classes="workspaceStore.classSummaries"
          @update:model-value="onSelectClass"
        />

        <button
          v-if="workspaceStore.activeClassId"
          :disabled="isClearingClass || draft.status === 'PUBLISHED'"
          class="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
          @click="onClearClass"
        >
          {{ isClearingClass ? 'Menghapus...' : 'Kosongkan Kelas' }}
        </button>

        <button
          :disabled="isSaving || draft.status === 'PUBLISHED'"
          class="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:opacity-50"
          @click="onSaveAndClose"
        >
          {{ isSaving ? 'Memvalidasi...' : 'Simpan' }}
        </button>
      </div>
    </div>

    <div
      v-if="isInitializing || timeSlotStore.isLoading"
      class="flex items-center justify-center py-16"
    >
      <div class="text-center">
        <span
          class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-300 border-t-emerald-700"
        ></span>
        <p class="mt-3 text-sm text-gray-500">Memuat data jadwal...</p>
      </div>
    </div>

    <div
      v-else-if="workspaceStore.activeClassId"
      class="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]"
    >
      <div
        v-if="workspaceStore.activeClassFeasibility?.isFeasible === false"
        class="col-span-1 lg:col-span-2 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
      >
        <AlertTriangle class="h-5 w-5 flex-shrink-0 text-red-600" />
        <div class="text-sm">
          <p class="font-semibold">Kapasitas Waktu Tidak Mencukupi</p>
          <p>
            Total target ({{ workspaceStore.activeClassFeasibility.totalTargetJp }} Jam Pelajaran) melebihi slot fisik yang tersedia ({{ workspaceStore.activeClassFeasibility.availableLessonSlots }} slot). Mohon kurangi target sebesar {{ workspaceStore.activeClassFeasibility.deficit }} Jam Pelajaran.
          </p>
        </div>
      </div>
      <SidebarResource />
      <ScheduleGrid :is-grid-ready="isGridReady" @show-toast="showToast" />
    </div>

    <div v-else class="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
      <div class="mb-4 flex justify-center text-gray-300">
        <ClipboardList class="h-14 w-14" />
      </div>
      <h3 class="mb-2 text-lg font-bold text-gray-700">Pilih Kelas Terlebih Dahulu</h3>
      <p class="text-sm text-gray-400">
        Gunakan dropdown di atas untuk memilih kelas sebelum menyusun jadwal.
      </p>
    </div>

    <BaseModal :show="showClearClassModal" @close="showClearClassModal = false">
      <template #header>
        <div class="mb-4 flex justify-center">
          <Trash2 class="h-12 w-12 text-red-500" stroke-width="1.5" />
        </div>
        <h3 class="mb-2 text-lg font-bold text-gray-800">Kosongkan Jadwal Kelas?</h3>
      </template>
      <template #body>
        <p class="mb-6 text-sm text-gray-500">
          Yakin ingin menghapus SELURUH jadwal kelas ini? Tindakan ini tidak bisa dibatalkan.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-center gap-3">
          <button
            class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            @click="showClearClassModal = false"
          >
            Batal
          </button>
          <button
            class="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            @click="confirmClearClass"
          >
            Ya, Kosongkan
          </button>
        </div>
      </template>
    </BaseModal>

    <ValidationModal
      :show="workspaceStore.isValidationModalOpen"
      :summary="workspaceStore.validationSummary"
      @confirm="workspaceStore.confirmValidationAndNavigate()"
      @cancel="workspaceStore.cancelValidation()"
    />
  </div>
</template>
