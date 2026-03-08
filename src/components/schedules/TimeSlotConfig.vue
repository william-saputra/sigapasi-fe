<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { ALL_DAYS, DAY_LABELS } from '@/interfaces/schedules/timeSlot.types'
import type { DayOfWeekEnum } from '@/interfaces/schedules/timeSlot.types'
import BaseModal from '@/components/common/BaseModal.vue'

// --- Store ---
const store = useTimeSlotStore()

// --- State ---
// Form state
const startTime = ref('07:00')
const stdDuration = ref(45)
const sessionCount = ref(8)

// Checkbox states
const selectedDays = ref<DayOfWeekEnum[]>([])
const applyToAllGrades = ref(false)

// Toast state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

// Modal state
const showClearAllModal = ref(false)
const showApplyModal = ref(false)

// --- Computed ---
const otherDays = computed(() => ALL_DAYS.filter((d) => d !== store.currentDay))
const activeSemesterId = computed(() => store.activeSemesterId)

// --- Functions ---
/** Displays a toast notification with message and type */
function showNotification(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

/** Determines target grades based on 'apply to all grades' checkbox */
function resolveTargetGrades(): number[] {
  if (applyToAllGrades.value) {
    return store.availableGrades
  }
  return store.activeGrade !== null ? [store.activeGrade] : []
}

/** Triggers grid slot generation with configured time, duration, and count */
function onGenerate() {
  store.generateSlots(sessionCount.value, stdDuration.value, startTime.value)
}

/** Inserts a break slot into the current schedule */
function onAddBreak() {
  store.addSlot('BREAK')
}

/** Inserts a lesson slot into the current schedule */
function onAddLesson() {
  store.addSlot('LESSON')
}

/** Updates the schedule start time when input changes */
function onStartTimeChange() {
  store.updateStartTime(startTime.value)
}

/** Persists current day's slot configuration to the backend for selected grades */
async function onSave() {
  const targetGrades = resolveTargetGrades()
  if (targetGrades.length === 0) {
    showNotification('Pilih tingkatan kelas terlebih dahulu.', 'error')
    return
  }
  try {
    await store.saveSlotStructure(
      store.currentDay,
      store.currentSchedule,
      activeSemesterId.value,
      targetGrades,
    )
    const gradeLabel = applyToAllGrades.value
      ? 'semua tingkatan'
      : `Kelas ${store.activeGrade}`
    showNotification(`Struktur slot berhasil disimpan untuk ${gradeLabel}!`, 'success')
  } catch {
    showNotification(store.error || 'Gagal menyimpan struktur slot.', 'error')
  }
}

/** Validates selection before showing copy schedule confirmation modal */
function triggerApply() {
  if (selectedDays.value.length === 0) {
    showNotification('Pilih setidaknya satu hari lain untuk diterapkan.', 'error')
    return
  }
  showApplyModal.value = true
}

/** 
 * Copies and saves schedule to target days.
 * Clones local state first to prevent wipeout during sequential saves.
 */
async function confirmApply() {
  store.copyScheduleToDays(selectedDays.value)
  showApplyModal.value = false

  const targetGrades = resolveTargetGrades()
  if (targetGrades.length === 0) {
    showNotification('Pilih tingkatan kelas terlebih dahulu.', 'error')
    return
  }

  const payloads = selectedDays.value.map((day) => ({
    day: day,
    slots: JSON.parse(JSON.stringify(store.schedules[day])),
  }))

  try {
    await store.saveSlotStructure(
      store.currentDay,
      store.currentSchedule,
      activeSemesterId.value,
      targetGrades,
    )
    for (const payload of payloads) {
      await store.saveSlotStructure(
        payload.day,
        payload.slots,
        activeSemesterId.value,
        targetGrades,
      )
    }
    showNotification('Pengaturan berhasil disimpan dan disalin!', 'success')
  } catch {
    showNotification(store.error || 'Gagal menyimpan.', 'error')
  }

  selectedDays.value = []
}

/** Adds or removes a day from the target days copy list */
function toggleDay(day: DayOfWeekEnum) {
  const idx = selectedDays.value.indexOf(day)
  if (idx >= 0) {
    selectedDays.value.splice(idx, 1)
  } else {
    selectedDays.value.push(day)
  }
}

/** Opens modal to confirm schedule clearing */
function onClearAll() {
  showClearAllModal.value = true
}

/** Clears all slots in current day locally */
function confirmClearAll() {
  store.clearCurrentDaySlots()
  showClearAllModal.value = false
  showNotification('Jadwal hari ini dikosongkan (belum permanen, klik Simpan Hari Ini)', 'success')
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h3 class="mt-0 mb-5 font-bold text-emerald-800">Konfigurasi</h3>

    <!-- Configuration Form -->
    <div class="mb-5">
      <label class="mb-2 block text-sm font-semibold text-gray-800">Jam Masuk</label>
      <input
        v-model="startTime"
        type="time"
        class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
        @change="onStartTimeChange"
      />
    </div>

    <!-- Duration Input -->
    <div class="mb-5">
      <label class="mb-2 block text-sm font-semibold text-gray-800">Durasi JP (Menit)</label>
      <input
        v-model.number="stdDuration"
        type="number"
        min="1"
        class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
      />
    </div>

    <!-- Session Count Input -->
    <div class="mb-5">
      <label class="mb-2 block text-sm font-semibold text-gray-800">Jumlah Sesi</label>
      <input
        v-model.number="sessionCount"
        type="number"
        min="1"
        class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
      />
    </div>

    <!-- Generate Action -->
    <button
      class="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-800 px-4 py-2.5 font-bold text-white transition-colors hover:bg-emerald-900"
      @click="onGenerate"
    >
      <span>⚡ Generate Grid</span>
    </button>

    <hr class="my-5 border-t border-gray-200" />

    <!-- Manual Adjustment Actions -->
    <h4 class="mb-3 text-sm font-semibold text-gray-500">Manual Adjustment</h4>

    <!-- Break Action -->
    <button
      class="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2.5 font-bold text-amber-800 transition-colors hover:bg-amber-100"
      @click="onAddBreak"
    >
      + Sisipkan Istirahat
    </button>

    <!-- Lesson Action -->
    <button
      class="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-300 bg-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors hover:bg-gray-300"
      @click="onAddLesson"
    >
      + Tambah Pelajaran
    </button>

    <!-- Clear Action -->
    <button
      class="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-2.5 font-bold text-red-600 transition-colors hover:bg-red-100"
      @click="onClearAll"
    >
      🗑️ Kosongkan Jadwal
    </button>

    <hr class="my-5 border-t border-gray-200" />

    <!-- Save Configuration Segment -->
    <label class="mb-4 flex cursor-pointer items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
      <input
        v-model="applyToAllGrades"
        type="checkbox"
        class="h-4 w-4 scale-110 accent-blue-600"
      />
      <span class="text-sm text-blue-800">
        Terapkan konfigurasi ini ke <strong>semua tingkatan kelas</strong>
      </span>
    </label>

    <!-- Save Action -->
    <button
      :disabled="store.isSaving"
      :class="[
        'flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2.5 font-bold text-white transition-colors',
        store.isSaving
          ? 'cursor-not-allowed bg-gray-400'
          : 'bg-blue-600 hover:bg-blue-700',
      ]"
      @click="onSave"
    >
      <svg v-if="store.isSaving" class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {{ store.isSaving ? 'Menyimpan...' : '💾 Simpan Hari Ini' }}
    </button>

    <!-- Copy Settings Section -->
    <div class="mt-6 border-t border-dashed border-gray-300 pt-5">
      <h4 class="mb-2 font-bold text-emerald-800">Salin Pengaturan</h4>
      <p class="mb-3 text-xs text-gray-500">
        Terapkan struktur
        <strong>{{ DAY_LABELS[store.currentDay] }}</strong> ke:
      </p>

      <!-- Target Days Selection -->
      <div class="mb-4 grid grid-cols-2 gap-3">
        <label
          v-for="day in otherDays"
          :key="day"
          class="flex cursor-pointer items-center gap-2 text-sm"
        >
          <input
            type="checkbox"
            :checked="selectedDays.includes(day)"
            class="scale-110 accent-emerald-800"
            @change="toggleDay(day)"
          />
          {{ DAY_LABELS[day] }}
        </label>
      </div>

      <!-- Apply Copy Action -->
      <button
        :disabled="store.isSaving"
        :class="[
          'flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2.5 font-bold text-white transition-colors',
          store.isSaving
            ? 'cursor-not-allowed bg-gray-400'
            : 'bg-emerald-800 hover:bg-emerald-900',
        ]"
        @click="triggerApply"
      >
        Simpan & Terapkan
      </button>
    </div>

    <!-- Apply Confirmation Modal -->
    <BaseModal :show="showApplyModal" @close="showApplyModal = false">
      <template #header>
        <div class="mb-4 text-5xl">✅</div>
        <h3 class="mb-2 text-lg font-bold text-gray-800">Konfirmasi Simpan</h3>
      </template>
      <template #body>
        <p class="mb-6 text-sm leading-relaxed text-gray-500">
          Pengaturan {{ DAY_LABELS[store.currentDay] }} akan disalin dan diterapkan ke:
          <strong>{{ selectedDays.map((d) => DAY_LABELS[d]).join(', ') }}</strong
          >. Lanjutkan?
        </p>
      </template>
      <template #footer>
        <div class="flex gap-4">
          <button
            class="flex-1 rounded-full border border-gray-300 bg-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors hover:bg-gray-300"
            @click="showApplyModal = false"
          >
            Kembali
          </button>
          <button
            :disabled="store.isSaving"
            class="flex-1 rounded-full bg-emerald-800 px-4 py-2.5 font-bold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-gray-400"
            @click="confirmApply"
          >
            {{ store.isSaving ? 'Menyimpan...' : 'Terapkan' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Clear All Warning Modal -->
    <BaseModal :show="showClearAllModal" @close="showClearAllModal = false">
      <template #header>
        <div class="mb-4 text-5xl">⚠️</div>
        <h3 class="mb-2 text-lg font-bold text-gray-800">Kosongkan Jadwal?</h3>
      </template>
      <template #body>
        <p class="mb-6 text-sm leading-relaxed text-gray-500">
          Apakah Anda yakin ingin mengosongkan seluruh baris slot di hari ini? 
          <br /><br />
          <span class="text-xs text-red-500">(Perubahan ini akan permanen setelah Anda menekan tombol "Simpan Hari Ini")</span>
        </p>
      </template>
      <template #footer>
        <div class="flex gap-4">
          <button
            class="flex-1 rounded-full border border-gray-300 bg-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors hover:bg-gray-300"
            @click="showClearAllModal = false"
          >
            Batal
          </button>
          <button
            class="flex-1 rounded-full bg-red-500 px-4 py-2.5 font-bold text-white transition-colors hover:bg-red-700"
            @click="confirmClearAll"
          >
            Ya, Kosongkan
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="showToast"
          :class="[
            'fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg',
            toastType === 'success' ? 'bg-emerald-700' : 'bg-red-600',
          ]"
        >
          <span>{{ toastType === 'success' ? '✅' : '❌' }}</span>
          <span>{{ toastMessage }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
