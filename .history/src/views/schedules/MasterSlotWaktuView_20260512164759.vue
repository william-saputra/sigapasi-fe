<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { ALL_DAYS, DAY_LABELS } from '@/interfaces/schedules/timeSlot.types'
import type { DayOfWeekEnum, UISlot } from '@/interfaces/schedules/timeSlot.types'

// --- Storage & Routing ---
const router = useRouter()
const store = useTimeSlotStore()

// --- State ---
// Filter dropdown state
const selectedSchoolLevelId = ref<string>('ALL')

// --- Computed ---
// Evaluation to check if all grades view is selected
const isAllLevels = computed(() => selectedSchoolLevelId.value === 'ALL')

// Returns the array of available grades
const visibleSchoolLevels = computed(() => store.schoolLevels)

// Condition to check if there are any slots across all available days
const hasData = computed(() => ALL_DAYS.some((day) => (store.schedules[day]?.length ?? 0) > 0))

// --- Functions ---
/** Dispatches data fetch actions depending on current grade filter mode */
async function loadData() {
  if (!store.activeSemesterId) return
  if (isAllLevels.value) {
    await store.fetchSlotStructureForAll()
  } else {
    store.activeSchoolLevelId = selectedSchoolLevelId.value
    await store.fetchSlotStructure()
  }
}

/** Handles semester change event and reloads grid data */
async function onSemesterChange() {
  await loadData()
}

/** Handles grade selection change event and reloads grid data */
async function onGradeChange() {
  await loadData()
}

/** Retrieves UI slots corresponding to a specific day for single grade views */
function getDaySlots(day: DayOfWeekEnum): UISlot[] {
  return store.schedules[day] ?? []
}

/** Resolves the CSS styling classes for a single schedule slot card */
function slotCardClass(slot: UISlot): string {
  if (slot.is_locked) return 'bg-gray-100 border-gray-300 text-gray-600'
  if (slot.slot_type === 'BREAK') return 'bg-amber-50 border-amber-200 text-amber-800'
  return 'bg-white border-emerald-100 text-gray-800'
}

/** Formats the display label for a slot considering its type and locking status */
function slotLabel(slot: UISlot): string {
  if (slot.is_locked && slot.locked_label) return slot.locked_label
  if (slot.slot_type === 'BREAK') return 'Istirahat'
  return `JP ${slot.session_number}`
}

/** Determines the styling class for the mini duration badge inside a slot */
function slotBadgeClass(slot: UISlot): string {
  if (slot.is_locked) return 'bg-gray-200 text-gray-600'
  if (slot.slot_type === 'BREAK') return 'bg-amber-200 text-amber-800'
  return 'bg-emerald-100 text-emerald-800'
}

/** Filters and returns slots for a specific day and a specific grade level */
function getLevelDaySlots(day: DayOfWeekEnum, levelId: string): UISlot[] {
  return (store.schedules[day] ?? []).filter((s) => s.school_level_id === levelId)
}

// --- Lifecycle ---
/** Initializes components by fetching academic years and slot structures if needed */
onMounted(async () => {
  if (store.schoolLevels.length === 0) {
    await store.fetchSchoolLevels()
  }
  if (store.academicYears.length === 0) {
    await store.fetchAcademicYears()
  }
  if (store.activeSemesterId) {
    await store.fetchSlotStructureForAll()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <div class="mx-auto max-w-[1400px] px-5 py-8">
      <!-- Page Header -->
      <div
        class="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b-2 border-emerald-100 pb-5"
      >
        <div>
          <!-- Back Action -->
          <button
            class="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-gray-100"
            @click="router.back()"
          >
            ← Kembali
          </button>
          <h2 class="text-3xl font-bold text-emerald-800">Master Slot Waktu</h2>
          <p class="mt-0.5 text-sm text-gray-500">
            Tampilan jadwal gabungan seluruh tingkatan kelas
          </p>
        </div>

        <!-- Filter Controls -->
        <div class="flex items-end gap-4 flex-wrap">
          <!-- Semester Selector -->
          <div>
            <label class="mb-1 block text-xs font-semibold text-gray-500"
              >Tahun Ajaran &amp; Semester</label
            >
            <select
              v-model="store.activeSemesterId"
              class="w-52 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm transition-all focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/10 focus:outline-none"
              @change="onSemesterChange"
            >
              <option value="" disabled>-- Pilih Semester --</option>
              <option v-for="sem in store.flattenedSemesters" :key="sem.id" :value="sem.id">
                {{ sem.display_name }}
              </option>
            </select>
          </div>

          <!-- Grade Level Selector -->
          <div>
            <label class="mb-1 block text-xs font-semibold text-gray-500">Tingkatan Kelas</label>
            <select
              v-model="selectedSchoolLevelId"
              class="w-44 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm transition-all focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/10 focus:outline-none"
              @change="onGradeChange"
            >
              <option value="ALL">Semua</option>
              <option v-for="level in visibleSchoolLevels" :key="level.id" :value="level.id">
                {{ level.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Error Notification -->
      <div
        v-if="store.error"
        class="mb-5 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        <span>⚠️</span>
        <span class="flex-1">{{ store.error }}</span>
        <button class="text-xs font-semibold underline" @click="store.clearError()">Tutup</button>
      </div>

      <!-- Loading State -->
      <div
        v-if="store.isLoading"
        class="mb-5 flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      >
        <svg
          class="h-4 w-4 animate-spin"
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
        Memuat data master jadwal...
      </div>

      <!-- Empty View -->
      <div
        v-else-if="!hasData && !store.isLoading"
        class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white py-20 text-center"
      >
        <span class="mb-4 text-6xl">📋</span>
        <p class="text-base font-semibold text-gray-500">Tidak ada data struktur jadwal</p>
        <p class="mt-1 text-sm text-gray-400">
          Pilih Semester dan pastikan slot waktu sudah dikonfigurasi.
        </p>
      </div>

      <!-- Single Grade Layout View -->
      <div v-else-if="!isAllLevels && !store.isLoading">
        <!-- Daily Columns Grid -->
        <div class="grid grid-cols-5 gap-3">
          <div
            v-for="day in ALL_DAYS"
            :key="day"
            class="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            <!-- Column Day Header -->
            <div class="bg-emerald-800 px-3 py-2.5 text-center">
              <span class="text-sm font-bold uppercase tracking-wide text-white">{{
                DAY_LABELS[day]
              }}</span>
            </div>

            <!-- List Slot Items -->
            <div class="flex flex-col gap-1.5 p-2">
              <template v-if="getDaySlots(day).length > 0">
                <div
                  v-for="slot in getDaySlots(day)"
                  :key="slot.id ?? slot.start_time"
                  :class="['rounded-lg border px-2.5 py-2 transition', slotCardClass(slot)]"
                >
                  <!-- Time Indicator -->
                  <div class="mb-1 text-[11px] font-semibold text-gray-500 leading-tight">
                    {{ slot.start_time }} – {{ slot.end_time }}
                  </div>

                  <!-- Name and Duration -->
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-sm font-bold leading-tight">{{ slotLabel(slot) }}</span>
                    <span
                      :class="[
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                        slotBadgeClass(slot),
                      ]"
                    >
                      {{ slot.duration }}m
                    </span>
                  </div>
                </div>
              </template>
              <div v-else class="py-6 text-center text-xs text-gray-400 italic">Belum ada data</div>
            </div>
          </div>
        </div>

        <!-- Single Grade Legend -->
        <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span class="font-semibold text-gray-600">Keterangan:</span>
          <div class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded border border-emerald-100 bg-white"></span
            ><span>Pelajaran</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded border border-amber-200 bg-amber-50"></span
            ><span>Istirahat</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded border border-gray-300 bg-gray-100"></span
            ><span>Slot Terkunci</span>
          </div>
        </div>
      </div>

      <!-- All Grades Layout View -->
      <div
        v-else-if="isAllLevels && !store.isLoading"
        class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <table class="w-full border-collapse text-xs">
          <!-- Table Header -->
          <thead>
            <tr class="bg-emerald-800 text-white uppercase tracking-wide">
              <th class="border border-emerald-700 px-3 py-3 text-center whitespace-nowrap w-16">
                HARI
              </th>
              <th
                v-for="level in visibleSchoolLevels"
                :key="level.id"
                class="border border-emerald-700 px-4 py-3 text-center whitespace-nowrap min-w-[180px]"
              >
                {{ level.name }}
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Table Row For Each Day -->
            <tr v-for="day in ALL_DAYS" :key="day" class="border-b border-gray-200 align-top">
              <!-- Day Identifier Cell -->
              <td
                class="border border-gray-200 bg-emerald-50 px-2 py-3 text-center font-bold text-emerald-900 whitespace-nowrap"
              >
                {{ DAY_LABELS[day] }}
              </td>

              <!-- Grade Columns In Day -->
              <td
                v-for="level in visibleSchoolLevels"
                :key="level.id"
                class="border border-gray-200 p-2 align-top"
              >
                <template v-if="getLevelDaySlots(day, level.id).length > 0">
                  <div
                    v-for="slot in getLevelDaySlots(day, level.id)"
                    :key="slot.id ?? slot.start_time + level.id"
                    :class="[
                      'mb-1.5 last:mb-0 rounded-lg border px-2.5 py-2',
                      slot.is_locked
                        ? 'bg-gray-100 border-gray-300'
                        : slot.slot_type === 'BREAK'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-white border-emerald-100',
                    ]"
                  >
                    <!-- Time And Duration Segment -->
                    <div class="flex items-center justify-between mb-0.5 gap-1">
                      <span
                        class="text-[10px] font-semibold text-gray-400 leading-tight whitespace-nowrap"
                      >
                        {{ slot.start_time }} – {{ slot.end_time }}
                      </span>
                      <span
                        :class="[
                          'rounded-full px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap',
                          slot.is_locked
                            ? 'bg-gray-200 text-gray-600'
                            : slot.slot_type === 'BREAK'
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800',
                        ]"
                      >
                        {{ slot.duration }}m
                      </span>
                    </div>
                    <!-- Label Presentation Segment -->
                    <div
                      :class="[
                        'text-xs font-bold leading-tight',
                        slot.is_locked
                          ? 'text-gray-600'
                          : slot.slot_type === 'BREAK'
                            ? 'text-amber-700'
                            : 'text-emerald-900',
                      ]"
                    >
                      <template v-if="slot.is_locked && slot.locked_label">{{
                        slot.locked_label
                      }}</template>
                      <template v-else-if="slot.slot_type === 'BREAK'">☕ Istirahat</template>
                      <template v-else>JP {{ slot.session_number }}</template>
                    </div>
                  </div>
                </template>
                <div v-else class="py-4 text-center text-[11px] text-gray-300 italic">—</div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- All Grades Legend -->
        <div
          class="flex flex-wrap items-center gap-4 px-4 py-3 text-xs text-gray-500 border-t border-gray-100"
        >
          <span class="font-semibold text-gray-600">Keterangan:</span>
          <div class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded border border-emerald-100 bg-white"></span
            ><span>Pelajaran</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded border border-amber-200 bg-amber-50"></span
            ><span>Istirahat</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded border border-gray-300 bg-gray-100"></span
            ><span>Slot Terkunci</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span
              class="inline-block w-3 h-3 rounded border border-gray-100 bg-gray-50 text-gray-300 text-center leading-3 text-[9px]"
              >—</span
            ><span>Tidak ada data</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
