<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { ALL_DAYS, DAY_LABELS } from '@/interfaces/schedules/timeSlot.types'
import type { DayOfWeekEnum, GradeLevelEnum } from '@/interfaces/schedules/timeSlot.types'
import TimeSlotConfig from '@/components/schedules/TimeSlotConfig.vue'
import TimeSlotGrid from '@/components/schedules/TimeSlotGrid.vue'
import BaseModal from '@/components/common/BaseModal.vue'

// --- Store ---
const store = useTimeSlotStore()

// --- State ---
// New Academic Year modal state
const showAddAcademicYearModal = ref(false)
const newYearStart = ref<number | undefined>(undefined)
const newYearEnd = ref<number | undefined>(undefined)
const addYearError = ref('')

// New Semester modal state
const showAddSemesterModal = ref(false)
const newSemesterName = ref('')
const addSemesterError = ref('')

// Preserve previous IDs to revert if ADD_NEW is cancelled
const prevAcademicYearId = ref<string>('')
const prevSemesterId = ref<string>('')

// --- Computed ---
const filteredSemesters = computed(() => {
  const ay = store.academicYears.find(y => y.id === store.activeAcademicYearId)
  return ay ? ay.listSemesters : []
})

// --- Functions ---
/** Updates the active selected day in the store */
function switchDay(day: DayOfWeekEnum) {
  store.setCurrentDay(day)
}

/** Handles Academic Year dropdown changes. */
async function onAcademicYearChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value

  if (value === 'ADD_NEW') {
    select.value = prevAcademicYearId.value
    store.activeAcademicYearId = prevAcademicYearId.value
    newYearStart.value = new Date().getFullYear()
    newYearEnd.value = newYearStart.value + 1
    addYearError.value = ''
    showAddAcademicYearModal.value = true
    return
  }

  prevAcademicYearId.value = value
  store.activeSemesterId = '' // Reset semester when academic year changes
  store.fetchSlotStructure()
}

/** Handles Semester dropdown changes. */
async function onSemesterChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value

  if (value === 'ADD_NEW') {
    select.value = prevSemesterId.value
    store.activeSemesterId = prevSemesterId.value
    newSemesterName.value = ''
    addSemesterError.value = ''
    showAddSemesterModal.value = true
    return
  }

  prevSemesterId.value = value
  await store.fetchSlotStructure()
}

/** Handles Grade dropdown changes. */
async function onGradeChange() {
  await store.fetchSlotStructure()
}

/** Validates and adds a new Academic Year. */
async function confirmAddAcademicYear() {
  addYearError.value = ''
  if (!newYearStart.value || !newYearEnd.value) {
    addYearError.value = 'Tahun mulai dan tahun selesai harus diisi.'
    return
  }
  try {
    await store.createAcademicYear({
      year_start: String(newYearStart.value),
      year_end: String(newYearEnd.value)
    })
    showAddAcademicYearModal.value = false
    prevAcademicYearId.value = store.activeAcademicYearId
  } catch (err: any) {
    addYearError.value = store.error || 'Gagal menambahkan tahun ajaran'
  }
}

/** Validates and adds a new Semester. */
async function confirmAddSemester() {
  addSemesterError.value = ''
  if (!newSemesterName.value.trim()) {
    addSemesterError.value = 'Nama semester harus diisi.'
    return
  }
  if (!store.activeAcademicYearId) {
    addSemesterError.value = 'Pilih Tahun Ajaran terlebih dahulu.'
    return
  }
  try {
    await store.createSemester({
      academic_year_id: store.activeAcademicYearId,
      name: newSemesterName.value.trim()
    })
    showAddSemesterModal.value = false
    // Auto-select the newly added semester? Usually backend creates it, we can just rely on fetchAcademicYears
  } catch (err: any) {
    addSemesterError.value = store.error || 'Gagal menambahkan semester'
  }
}

// --- Lifecycle ---
/** Initializes components by fetching academic years which automatically fetches slots based on active selections */
onMounted(async () => {
  await store.fetchAcademicYears()
  prevAcademicYearId.value = store.activeAcademicYearId
  prevSemesterId.value = store.activeSemesterId
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <div class="mx-auto max-w-[1100px] px-5 py-8">
      
      <!-- Header Section -->
      <div class="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b-2 border-gray-200 pb-4">
        <div>
          <h2 class="mb-1 text-3xl font-bold text-emerald-800">Pengaturan Slot Waktu</h2>
          <p class="text-gray-500">Arsitektur Jadwal</p>
        </div>
        
        <!-- Controls and Master View Action -->
        <div class="flex flex-col items-end gap-3">
          
          <!-- Master Schedule Action -->
          <RouterLink
            to="/slot-waktu"
            class="inline-flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 hover:border-emerald-800"
          >
            📋 Lihat Master Jadwal
          </RouterLink>

          <!-- Dropdowns Container -->
          <div class="flex items-end gap-4">
            
            <!-- Academic Year Selection -->
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-500">Tahun Ajaran</label>
              <select
                v-model="store.activeAcademicYearId"
                class="w-40 sm:w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
                @change="onAcademicYearChange"
              >
                <option value="" disabled>-- Pilih Tahun Ajaran --</option>
                <option v-for="ay in store.academicYears" :key="ay.id" :value="ay.id">
                  {{ ay.year_start ?? ay.yearStart }}/{{ ay.year_end ?? ay.yearEnd }}
                </option>
                <option value="ADD_NEW">+ Tambah Tahun Ajaran Baru</option>
              </select>
            </div>

            <!-- Semester Selection -->
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-500">Semester</label>
              <select
                v-model="store.activeSemesterId"
                class="w-40 sm:w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
                @change="onSemesterChange"
                :disabled="!store.activeAcademicYearId"
              >
                <option value="" disabled>-- Pilih Semester --</option>
                <option v-for="sem in filteredSemesters" :key="sem.id" :value="sem.id">
                  {{ sem.name }}
                </option>
                <option value="ADD_NEW" v-if="store.activeAcademicYearId">+ Tambah Semester Baru</option>
              </select>
            </div>

            <!-- Grade Level Selection -->
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-500">Jenjang</label>
              <select
                v-model="store.activeGrade"
                class="w-32 sm:w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
                @change="onGradeChange"
              >
                <option value="" disabled>-- Pilih Jenjang --</option>
                <option v-for="grade in store.availableGrades" :key="grade" :value="grade">
                  {{ grade }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Notification -->
      <div
        v-if="store.error"
        class="mb-6 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        <span class="text-lg">⚠️</span>
        <span class="flex-1">{{ store.error }}</span>
        <button
          class="cursor-pointer text-xs font-semibold text-red-600 underline hover:text-red-800"
          @click="store.clearError()"
        >
          Tutup
        </button>
      </div>

      <!-- Loading Indicator -->
      <div v-if="store.isLoading" class="mb-6 flex items-center gap-3 text-sm text-gray-500">
        <svg class="h-5 w-5 animate-spin text-emerald-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Memuat data slot waktu...
      </div>

      <!-- Day Navigation Tabs -->
      <div class="mb-6 inline-flex rounded-full bg-gray-200 p-1">
        <button
          v-for="day in ALL_DAYS"
          :key="day"
          :class="[
            'cursor-pointer rounded-full px-6 py-2 text-sm font-semibold transition-all',
            store.currentDay === day
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-transparent text-gray-500 hover:text-gray-700',
          ]"
          @click="switchDay(day)"
        >
          {{ DAY_LABELS[day] }}
        </button>
      </div>

      <!-- Configuration Workspace -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <TimeSlotConfig />
        
        <!-- Setup Requirement Warning -->
        <div
          v-if="!store.activeSemesterId || !store.activeGrade"
          class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center"
        >
          <span class="mb-3 text-5xl">📅</span>
          <p class="text-base font-semibold text-gray-500">Pilih Semester dan Jenjang</p>
          <p class="mt-1 text-sm text-gray-400">Gunakan dropdown di atas untuk memulai.</p>
        </div>
        
        <TimeSlotGrid v-else />
      </div>
    </div>
  </div>

  <!-- Add Academic Year Modal -->
  <BaseModal :show="showAddAcademicYearModal" @close="showAddAcademicYearModal = false">
    <template #header>
      <div class="mb-4 text-5xl">📅</div>
      <h3 class="mb-2 text-lg font-bold text-gray-800">Tambah Tahun Ajaran Baru</h3>
    </template>
    <template #body>
      <div class="mb-4 flex gap-4">
        <div class="flex-1">
          <label class="block text-xs font-semibold text-gray-500 mb-1">Tahun Mulai</label>
          <input
            v-model.number="newYearStart"
            type="number"
            class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
          />
        </div>
        <div class="flex-1">
          <label class="block text-xs font-semibold text-gray-500 mb-1">Tahun Selesai</label>
          <input
            v-model.number="newYearEnd"
            type="number"
            class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
            @keydown.enter="confirmAddAcademicYear"
          />
        </div>
      </div>
      <p v-if="addYearError" class="mt-2 text-xs text-red-500">{{ addYearError }}</p>
    </template>
    <template #footer>
      <div class="flex gap-4">
        <button
          class="flex-1 rounded-full border border-gray-300 bg-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors hover:bg-gray-300"
          @click="showAddAcademicYearModal = false"
        >
          Batal
        </button>
        <button
          class="flex-1 rounded-full bg-emerald-800 px-4 py-2.5 font-bold text-white transition-colors hover:bg-emerald-900"
          @click="confirmAddAcademicYear"
        >
          Tambahkan
        </button>
      </div>
    </template>
  </BaseModal>

  <!-- Add Semester Modal -->
  <BaseModal :show="showAddSemesterModal" @close="showAddSemesterModal = false">
    <template #header>
      <div class="mb-4 text-5xl">📚</div>
      <h3 class="mb-2 text-lg font-bold text-gray-800">Tambah Semester Baru</h3>
    </template>
    <template #body>
      <p class="mb-4 text-sm text-gray-500">Masukkan nama semester (misal: Ganjil, Genap).</p>
      <input
        v-model="newSemesterName"
        type="text"
        placeholder="Contoh: Ganjil"
        class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
        @keydown.enter="confirmAddSemester"
      />
      <p v-if="addSemesterError" class="mt-2 text-xs text-red-500">{{ addSemesterError }}</p>
    </template>
    <template #footer>
      <div class="flex gap-4">
        <button
          class="flex-1 rounded-full border border-gray-300 bg-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors hover:bg-gray-300"
          @click="showAddSemesterModal = false"
        >
          Batal
        </button>
        <button
          class="flex-1 rounded-full bg-emerald-800 px-4 py-2.5 font-bold text-white transition-colors hover:bg-emerald-900"
          @click="confirmAddSemester"
        >
          Tambahkan
        </button>
      </div>
    </template>
  </BaseModal>
</template>
