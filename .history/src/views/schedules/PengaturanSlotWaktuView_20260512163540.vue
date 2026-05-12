<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { ALL_DAYS, DAY_LABELS } from '@/interfaces/schedules/timeSlot.types'
import type { DayOfWeekEnum } from '@/interfaces/schedules/timeSlot.types'
import TimeSlotConfig from '@/components/schedules/TimeSlotConfig.vue'
import TimeSlotGrid from '@/components/schedules/TimeSlotGrid.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { AlertTriangle, Calendar, BookOpen } from 'lucide-vue-next'

// --- Store & Router ---
const store = useTimeSlotStore()
const router = useRouter()

// --- State ---
// Integrated Setup Modal State
const showSetupModal = ref(false)
const setupMode = ref<'SELECT_YEAR' | 'NEW_YEAR'>('SELECT_YEAR')
const selectedYearId = ref<string>('')
const newSemesterName = ref('Ganjil')
const newYearStart = ref<number | undefined>(undefined)
const newYearEnd = ref<number | undefined>(undefined)
const setupError = ref('')

// Preserve previous ID to revert if ADD_NEW is cancelled
const prevSemesterId = ref<string>('')

// --- Computed ---
// --- Computed ---

// --- Functions ---
/** Updates the active selected day in the store */
function switchDay(day: DayOfWeekEnum) {
  store.setCurrentDay(day)
}

/** Handles Semester dropdown changes. */
async function onSemesterChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value

  if (value === 'ADD_NEW') {
    select.value = prevSemesterId.value
    store.activeSemesterId = prevSemesterId.value
    showSetupModal.value = true
    setupMode.value = 'SELECT_YEAR'
    selectedYearId.value = store.activeAcademicYearId || ''
    newSemesterName.value = 'Ganjil'
    newYearStart.value = new Date().getFullYear()
    newYearEnd.value = newYearStart.value + 1
    setupError.value = ''
    return
  }

  prevSemesterId.value = value
  // Ensure activeAcademicYearId is somewhat synced if needed, though we rely mostly on activeSemesterId now
  const selectedSem = store.flattenedSemesters.find((s) => s.id === value)
  if (selectedSem) {
    store.activeAcademicYearId = selectedSem.academic_year_id
  }
  await store.fetchSlotStructure()
}

/** Handles Grade dropdown changes. */
async function onGradeChange() {
  await store.fetchSlotStructure()
}

/** Validates and acts on the integrated setup modal. */
async function confirmSetup() {
  setupError.value = ''

  if (setupMode.value === 'NEW_YEAR') {
    if (!newYearStart.value || !newYearEnd.value) {
      setupError.value = 'Tahun mulai dan tahun selesai harus diisi.'
      return
    }
    if (newYearStart.value <= 0 || newYearEnd.value <= 0) {
      setupError.value = 'Tahun ajaran tidak boleh 0 atau minus.'
      return
    }
    if (newYearEnd.value <= newYearStart.value) {
      setupError.value = 'Tahun selesai harus lebih besar dari tahun mulai.'
      return
    }
  } else {
    if (!selectedYearId.value) {
      setupError.value = 'Pilih Tahun Ajaran terlebih dahulu.'
      return
    }
  }

  if (!newSemesterName.value.trim()) {
    setupError.value = 'Pilih atau isi nama semester.'
    return
  }

  try {
<<<<<<< HEAD
    store.isLoading = true; // Use store loading state or local if preferred
    let targetAcademicYearId = selectedYearId.value;
    let academicYearLabel = '';

    if (setupMode.value === 'NEW_YEAR') {
      const res = await store.createAcademicYear({
        year_start: String(newYearStart.value),
        year_end: String(newYearEnd.value)
      }, true)
=======
    store.isLoading = true // Use store loading state or local if preferred
    let targetAcademicYearId = selectedYearId.value
    let academicYearLabel = ''

    if (setupMode.value === 'NEW_YEAR') {
      const res = await store.createAcademicYear(
        {
          year_start: String(newYearStart.value),
          year_end: String(newYearEnd.value),
        },
        true,
      )
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
      if (!res.success) {
        setupError.value = res.error || 'Gagal menyimpan pengaturan baru.'
        return
      }
<<<<<<< HEAD
      // The API doesn't return the created ID directly in academicYears action, 
=======
      // The API doesn't return the created ID directly in academicYears action,
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
      // but fetchAcademicYears updates the store. We find the matched one.
      const newlyCreated = store.academicYears.find(
        (ay) =>
          (ay.year_start === String(newYearStart.value) ||
            ay.yearStart === String(newYearStart.value)) &&
          (ay.year_end === String(newYearEnd.value) || ay.yearEnd === String(newYearEnd.value)),
      )
      if (newlyCreated) {
<<<<<<< HEAD
          targetAcademicYearId = newlyCreated.id
          academicYearLabel = `${newlyCreated.year_start ?? newlyCreated.yearStart}/${newlyCreated.year_end ?? newlyCreated.yearEnd}`
=======
        targetAcademicYearId = newlyCreated.id
        academicYearLabel = `${newlyCreated.year_start ?? newlyCreated.yearStart}/${newlyCreated.year_end ?? newlyCreated.yearEnd}`
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
      } else {
        throw new Error('Gagal menemukan tahun ajaran yang baru dibuat.')
      }
    } else {
      const selectedAy = store.academicYears.find((ay) => ay.id === targetAcademicYearId)
      if (selectedAy) {
        academicYearLabel = `${selectedAy.year_start ?? selectedAy.yearStart}/${selectedAy.year_end ?? selectedAy.yearEnd}`
      }
    } else {
      const selectedAy = store.academicYears.find(ay => ay.id === targetAcademicYearId)
      if (selectedAy) {
        academicYearLabel = `${selectedAy.year_start ?? selectedAy.yearStart}/${selectedAy.year_end ?? selectedAy.yearEnd}`
      }
    }

    const finalSemesterName = `${newSemesterName.value.trim()} ${academicYearLabel}`.trim()

<<<<<<< HEAD
    const resSem = await store.createSemester({
      academic_year_id: targetAcademicYearId,
      name: finalSemesterName
    }, true)
    
    if (!resSem.success) {
      setupError.value = resSem.error || 'Gagal menyimpan pengaturan baru.'
      return
    }
    
    showSetupModal.value = false
    
    // Auto-select the newly added semester (last one in the target academic year)
    const targetAy = store.academicYears.find(ay => ay.id === targetAcademicYearId)
    if (targetAy && targetAy.listSemesters.length > 0) {
        const newestSem = targetAy.listSemesters[targetAy.listSemesters.length - 1]
        if (newestSem) {
            store.activeSemesterId = newestSem.id
            prevSemesterId.value = newestSem.id
            store.activeAcademicYearId = targetAcademicYearId
            await store.fetchSlotStructure()
        }
=======
    const resSem = await store.createSemester(
      {
        academic_year_id: targetAcademicYearId,
        name: finalSemesterName,
      },
      true,
    )

    if (!resSem.success) {
      setupError.value = resSem.error || 'Gagal menyimpan pengaturan baru.'
      return
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
    }

    showSetupModal.value = false

    // Auto-select the newly added semester (last one in the target academic year)
    const targetAy = store.academicYears.find((ay) => ay.id === targetAcademicYearId)
    if (targetAy && targetAy.listSemesters.length > 0) {
      const newestSem = targetAy.listSemesters[targetAy.listSemesters.length - 1]
      if (newestSem) {
        store.activeSemesterId = newestSem.id
        prevSemesterId.value = newestSem.id
        store.activeAcademicYearId = targetAcademicYearId
        await store.fetchSlotStructure()
      }
    }
  } catch (err: any) {
    setupError.value = store.error || 'Gagal menyimpan pengaturan baru.'
  } finally {
    store.isLoading = false
  }
}

// --- Auto-hide Errors ---
<<<<<<< HEAD
let errorTimeout: number | undefined;
watch(() => store.error, (newVal) => {
  if (newVal) {
    clearTimeout(errorTimeout);
    errorTimeout = window.setTimeout(() => {
      if (store.error === newVal) store.clearError();
    }, 5000);
  }
});

let setupErrorTimeout: number | undefined;
watch(setupError, (newVal) => {
  if (newVal) {
    clearTimeout(setupErrorTimeout);
    setupErrorTimeout = window.setTimeout(() => {
      if (setupError.value === newVal) setupError.value = '';
    }, 5000);
  }
});
=======
let errorTimeout: number | undefined
watch(
  () => store.error,
  (newVal) => {
    if (newVal) {
      clearTimeout(errorTimeout)
      errorTimeout = window.setTimeout(() => {
        if (store.error === newVal) store.clearError()
      }, 5000)
    }
  },
)

let setupErrorTimeout: number | undefined
watch(setupError, (newVal) => {
  if (newVal) {
    clearTimeout(setupErrorTimeout)
    setupErrorTimeout = window.setTimeout(() => {
      if (setupError.value === newVal) setupError.value = ''
    }, 5000)
  }
})
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6

// --- Lifecycle ---
/** Initializes components by fetching school levels and academic years which automatically fetches slots based on active selections */
onMounted(async () => {
  await store.fetchSchoolLevels()
  await store.fetchAcademicYears()
  prevSemesterId.value = store.activeSemesterId
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <div class="mx-auto max-w-[1100px] px-5 py-8">
<<<<<<< HEAD
      
=======
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
      <!-- Back Button -->
      <div class="mb-4">
        <button
          @click="router.push('/jadwal')"
          class="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-emerald-800"
        >
<<<<<<< HEAD
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
=======
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
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
          </svg>
          Kembali ke Dashboard
        </button>
      </div>

      <!-- Header Section -->
      <div
        class="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b-2 border-gray-200 pb-4"
      >
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
            Lihat Master Jadwal
          </RouterLink>

          <!-- Dropdowns Container -->
          <div class="flex items-end gap-4">
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
                <option v-for="sem in store.flattenedSemesters" :key="sem.id" :value="sem.id">
                  {{ sem.display_name }}
                </option>
                <option value="ADD_NEW">+ Tambah Semester Baru</option>
              </select>
            </div>

            <!-- Grade Level Selection -->
            <div>
              <label class="mb-1 block text-xs font-semibold text-gray-500">Jenjang</label>
              <select
                v-model="store.activeSchoolLevelId"
                class="w-32 sm:w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
                @change="onGradeChange"
              >
                <option value="" disabled>-- Pilih Jenjang --</option>
                <option v-for="level in store.schoolLevels" :key="level.id" :value="level.id">
                  {{ level.name }}
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
        <AlertTriangle class="h-5 w-5 text-red-600 shrink-0" />
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
        <svg
          class="h-5 w-5 animate-spin text-emerald-800"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
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
          v-if="!store.activeSemesterId || !store.activeSchoolLevelId"
          class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center"
        >
          <Calendar class="h-12 w-12 text-gray-400 mb-3" stroke-width="1.5" />
          <p class="text-base font-semibold text-gray-500">Pilih Semester dan Jenjang</p>
          <p class="mt-1 text-sm text-gray-400">Gunakan dropdown di atas untuk memulai.</p>
        </div>

        <TimeSlotGrid v-else />
      </div>
    </div>
  </div>

  <!-- Integrated Setup Modal -->
  <BaseModal :show="showSetupModal" @close="showSetupModal = false">
    <template #header>
<<<<<<< HEAD
      <div class="mb-4 flex justify-center"><BookOpen class="h-12 w-12 text-emerald-800" stroke-width="1.5" /></div>
=======
      <div class="mb-4 flex justify-center">
        <BookOpen class="h-12 w-12 text-emerald-800" stroke-width="1.5" />
      </div>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
      <h3 class="mb-2 text-lg font-bold text-gray-800">
        {{ setupMode === 'NEW_YEAR' ? 'Tambah Tahun Ajaran & Semester' : 'Tambah Semester Baru' }}
      </h3>
    </template>
    <template #body>
      <!-- Semester Type Input -->
      <div class="mb-4">
        <label class="block text-xs font-semibold text-gray-500 mb-1">Tipe Semester</label>
        <select
          v-model="newSemesterName"
          class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
        >
          <option value="Ganjil">Ganjil</option>
          <option value="Genap">Genap</option>
        </select>
      </div>

      <!-- Year Selection Mode -->
      <div v-show="setupMode === 'SELECT_YEAR'" class="mb-4">
        <label class="block text-xs font-semibold text-gray-500 mb-1">Tahun Ajaran</label>
        <select
          v-model="selectedYearId"
          class="w-full flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
        >
          <option value="" disabled>-- Pilih Tahun Ajaran --</option>
          <option v-for="ay in store.academicYears" :key="ay.id" :value="ay.id">
            {{ ay.year_start ?? ay.yearStart }}/{{ ay.year_end ?? ay.yearEnd }}
          </option>
        </select>
        <button
          class="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
          @click="setupMode = 'NEW_YEAR'"
        >
          Tambah tahun ajaran
        </button>
      </div>

      <!-- New Year Mode -->
      <div v-show="setupMode === 'NEW_YEAR'" class="mb-4">
        <label class="block text-xs font-semibold text-gray-500 mb-2">Buat Tahun Ajaran Baru</label>
        <div class="flex gap-4">
          <div class="flex-1">
            <label
              class="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide"
              >Tahun Mulai</label
            >
            <input
              v-model.number="newYearStart"
              type="number"
              class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
            />
          </div>
          <div class="flex-1">
            <label
              class="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide"
              >Tahun Selesai</label
            >
            <input
              v-model.number="newYearEnd"
              type="number"
              class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
            />
          </div>
        </div>
        <button
          class="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
          @click="setupMode = 'SELECT_YEAR'"
        >
          Batal tambah tahun, pilih yang sudah ada
        </button>
      </div>

      <p v-if="setupError" class="mt-2 text-xs text-red-500">{{ setupError }}</p>
    </template>
    <template #footer>
      <div class="flex gap-4">
        <button
          class="flex-1 rounded-full border border-gray-300 bg-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors hover:bg-gray-300"
          @click="showSetupModal = false"
        >
          Batal
        </button>
        <button
          class="flex-1 rounded-full bg-emerald-800 px-4 py-2.5 font-bold text-white transition-colors hover:bg-emerald-900 disabled:opacity-50"
          @click="confirmSetup"
          :disabled="store.isLoading"
        >
          {{ store.isLoading ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
