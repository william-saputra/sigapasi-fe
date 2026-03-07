<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { ALL_DAYS, DAY_LABELS } from '@/interfaces/schedules/timeSlot.types'
import type { DayOfWeekEnum } from '@/interfaces/schedules/timeSlot.types'
import TimeSlotConfig from '@/components/schedules/TimeSlotConfig.vue'
import TimeSlotGrid from '@/components/schedules/TimeSlotGrid.vue'
import BaseModal from '@/components/common/BaseModal.vue'

// --- Store ---
const store = useTimeSlotStore()

// --- State ---
// New grade modal state
const showAddGradeModal = ref(false)
const newGradeInput = ref<number | undefined>(undefined)
const addGradeError = ref('')

// --- Functions ---
/** Updates the active selected day in the store */
function switchDay(day: DayOfWeekEnum) {
  store.setCurrentDay(day)
}

/** Triggers grid data reload when academic semester changes */
async function onSemesterChange() {
  await store.fetchSlotStructure()
}

/** 
 * Handles grade level dropdown changes. 
 * Reverts value and opens add-grade modal if 'Add New' is selected. 
 * Otherwise updates the active grade and fetches its specific schedule.
 */
async function onGradeChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value

  if (value === 'ADD_NEW') {
    select.value = store.activeGrade !== null ? String(store.activeGrade) : ''
    newGradeInput.value = undefined
    addGradeError.value = ''
    showAddGradeModal.value = true
    return
  }

  const parsed = parseInt(value, 10)
  if (!isNaN(parsed)) {
    store.activeGrade = parsed
  }

  await store.fetchSlotStructure()
}

/** 
 * Validates the new grade input and adds it to the list if valid.
 * Displays error messages if the input is empty invalid or already exists.
 * Triggers schedule fetch for the newly created grade upon success.
 */
async function confirmAddGrade() {
  addGradeError.value = ''

  if (newGradeInput.value === undefined || newGradeInput.value === null) {
    addGradeError.value = 'Masukkan angka tingkatan kelas.'
    return
  }

  const grade = Number(newGradeInput.value)

  if (!Number.isInteger(grade) || grade <= 0) {
    addGradeError.value = 'Input harus berupa angka positif yang valid.'
    return
  }

  if (store.availableGrades.includes(grade)) {
    addGradeError.value = `Tingkatan kelas ${grade} sudah ada.`
    return
  }

  store.availableGrades.push(grade)
  store.availableGrades.sort((a, b) => a - b)
  store.activeGrade = grade
  showAddGradeModal.value = false
  newGradeInput.value = undefined

  await store.fetchSlotStructure()
}

// --- Lifecycle ---
/** Initializes components by fetching academic years which automatically fetches slots based on active selections */
onMounted(async () => {
  await store.fetchAcademicYears()
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
            
            <!-- Semester Selection -->
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-500">Tahun Ajaran &amp; Semester</label>
              <select
                v-model="store.activeSemesterId"
                class="w-48 sm:w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
                @change="onSemesterChange"
              >
                <option value="" disabled>-- Pilih Semester --</option>
                <template v-for="ay in store.academicYears" :key="ay.id">
                  <option
                    v-for="sem in ay.listSemesters"
                    :key="sem.id"
                    :value="sem.id"
                  >
                    {{ sem.name }}
                  </option>
                </template>
              </select>
            </div>

            <!-- Grade Level Selection -->
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-500">Tingkatan Kelas</label>
              <select
                :value="store.activeGrade !== null ? String(store.activeGrade) : ''"
                class="w-36 sm:w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
                @change="onGradeChange"
              >
                <option value="" disabled>-- Pilih Kelas --</option>
                <option v-for="grade in store.availableGrades" :key="grade" :value="String(grade)">
                  Kelas {{ grade }}
                </option>
                <option value="ADD_NEW">+ Tambah Tingkatan Baru</option>
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
          v-if="!store.activeSemesterId || store.activeGrade === null"
          class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center"
        >
          <span class="mb-3 text-5xl">📅</span>
          <p class="text-base font-semibold text-gray-500">Pilih Semester dan Tingkatan Kelas</p>
          <p class="mt-1 text-sm text-gray-400">Gunakan dropdown di atas untuk memulai.</p>
        </div>
        
        <TimeSlotGrid v-else />
      </div>
    </div>
  </div>

  <!-- Add Grade Modal -->
  <BaseModal :show="showAddGradeModal" @close="showAddGradeModal = false">
    <template #header>
      <div class="mb-4 text-5xl">🏫</div>
      <h3 class="mb-2 text-lg font-bold text-gray-800">Tambah Tingkatan Kelas</h3>
    </template>
    <template #body>
      <p class="mb-4 text-sm text-gray-500">Masukkan nomor tingkatan kelas baru (misal: 10, 11, 12).</p>
      <input
        v-model.number="newGradeInput"
        type="number"
        min="1"
        placeholder="Contoh: 10"
        class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
        @keydown.enter="confirmAddGrade"
      />
      <p v-if="addGradeError" class="mt-2 text-xs text-red-500">{{ addGradeError }}</p>
    </template>
    <template #footer>
      <div class="flex gap-4">
        <button
          class="flex-1 rounded-full border border-gray-300 bg-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors hover:bg-gray-300"
          @click="showAddGradeModal = false"
        >
          Batal
        </button>
        <button
          class="flex-1 rounded-full bg-emerald-800 px-4 py-2.5 font-bold text-white transition-colors hover:bg-emerald-900"
          @click="confirmAddGrade"
        >
          Tambahkan
        </button>
      </div>
    </template>
  </BaseModal>
</template>
