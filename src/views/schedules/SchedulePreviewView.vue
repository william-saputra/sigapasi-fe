<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { AlertTriangle, Calendar } from 'lucide-vue-next'

import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { useSchedulePreviewStore } from '@/stores/schedules/schedule-preview.store'
import { useAuthStore } from '@/stores/accounts/auth.store'
import type {
  SchedulePreviewCell,
  SchedulePreviewMode,
  SchedulePreviewRow,
} from '@/interfaces/schedules/schedule-preview.interface'

const router = useRouter()

const timeSlotStore = useTimeSlotStore()
const previewStore = useSchedulePreviewStore()
const authStore = useAuthStore()

const {
  preview,
  selectedSemesterId,
  selectedMode,
  selectedClassId,
  selectedTeacherId,
  classes,
  teachers,
  loading,
  loadingOptions,
  exporting,
  error,
} = storeToRefs(previewStore)

const showExportModal = ref(false)
const showExportSuccessModal = ref(false)

const modeOptions = computed(() => {
  if (authStore.user?.role === 'TEACHER') {
    return [{ label: 'Per Guru', value: 'TEACHER' }]
  }
  return [
    { label: 'Per Kelas', value: 'CLASS' },
    { label: 'Per Guru', value: 'TEACHER' },
  ]
})

const availableTeachers = computed(() => {
  if (authStore.user?.role === 'TEACHER') {
    return teachers.value.filter(
      (t) => t.id === authStore.user?.id || t.name === authStore.user?.fullName
    )
  }
  return teachers.value
})

const canLoadPreview = computed(() => previewStore.canLoadPreview)

const canExport = computed(() => {
  return !!preview.value && !loading.value && !exporting.value
})

const displaySubtitle = computed(() => {
  if (!preview.value) {
    return 'Pilih semester dan data jadwal untuk melihat preview.'
  }
  return `Tahun Pelajaran ${preview.value.academicYear || '-'} · ${preview.value.semesterName || '-'} · ${preview.value.scheduleName || '-'}`
})

const displayTitle = computed(() => {
  if (!preview.value) {
    return selectedMode.value === 'CLASS' ? 'Jadwal Kelas' : 'Jadwal Mengajar Guru'
  }
  if (preview.value.mode === 'CLASS') {
    return `Jadwal ${preview.value.selectedClassName || 'Kelas'}`
  }
  return `Jadwal Mengajar: ${preview.value.selectedTeacherName || 'Guru'}`
})

const emptyStateTitle = computed(() => {
  if (!selectedSemesterId.value) return 'Pilih Semester'
  if (selectedMode.value === 'CLASS') return 'Pilih Kelas'
  return 'Pilih Guru'
})

const emptyStateDescription = computed(() => {
  if (!selectedSemesterId.value) {
    return 'Gunakan dropdown semester untuk memilih periode jadwal.'
  }
  if (selectedMode.value === 'CLASS') {
    return 'Preview akan menggunakan jadwal PUBLISHED terbaru pada semester dan kelas yang dipilih.'
  }
  return 'Preview akan menggunakan jadwal PUBLISHED terbaru pada semester dan guru yang dipilih.'
})

function onSemesterChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const semesterId = select.value || null

  previewStore.setSemesterId(semesterId)
  previewStore.clearPreview()

  if (semesterId) {
    timeSlotStore.activeSemesterId = semesterId
  }
}

function onModeChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const mode = select.value as SchedulePreviewMode

  previewStore.setMode(mode)
  previewStore.clearPreview()
}

function onClassChange(event: Event) {
  const select = event.target as HTMLSelectElement
  previewStore.setSelectedClassId(select.value || null)
}

function onTeacherChange(event: Event) {
  const select = event.target as HTMLSelectElement
  previewStore.setSelectedTeacherId(select.value || null)
}

async function loadPreview() {
  if (!canLoadPreview.value) return
  await previewStore.getPreview()
}

function openExportModal() {
  if (!canExport.value) return
  showExportModal.value = true
}

function closeExportModal() {
  if (exporting.value) return
  showExportModal.value = false
}

function closeExportSuccessModal() {
  showExportSuccessModal.value = false
}

async function exportSchedule(format: 'PDF' | 'EXCEL') {
  const success = await previewStore.exportSchedule(format)

  if (success) {
    showExportModal.value = false
    showExportSuccessModal.value = true
  }
}

function getRowLabel(row: SchedulePreviewRow): string {
  if (row.breakTime) return row.breakLabel || 'Istirahat'
  if (row.sessionNumber && row.sessionNumber > 0) return `JP ${row.sessionNumber}`
  return 'Sesi'
}

function getCell(row: SchedulePreviewRow, day: string): SchedulePreviewCell | null {
  return row.cells?.[day] ?? null
}

function isCellBreak(row: SchedulePreviewRow, cell?: SchedulePreviewCell | null): boolean {
  return row.breakTime || !!cell?.breakTime
}

function isCellLocked(cell?: SchedulePreviewCell | null): boolean {
  return !!cell?.locked
}

function isCellEmpty(cell?: SchedulePreviewCell | null): boolean {
  return !cell || !!cell.empty
}

function getCellClass(row: SchedulePreviewRow, cell?: SchedulePreviewCell | null) {
  const isDashCell = !isCellBreak(row, cell) && !isCellLocked(cell) && isCellEmpty(cell)

  return {
    'preview-cell': true,
    'preview-cell-locked': isCellLocked(cell) && !isCellBreak(row, cell),
    'preview-cell-break': isCellBreak(row, cell),
    'preview-cell-filled': !!cell && !cell.empty && !cell.locked && !cell.breakTime,
    'preview-cell-dash': isDashCell,
  }
}

function getPrimaryCellText(row: SchedulePreviewRow, cell?: SchedulePreviewCell | null): string {
  if (isCellBreak(row, cell)) return row.breakLabel || cell?.label || 'Istirahat'
  if (isCellLocked(cell)) return cell?.label || 'Terkunci'
  if (isCellEmpty(cell)) return '-'
  if (preview.value?.mode === 'CLASS') return cell?.subjectName || cell?.label || '-'
  return cell?.className || cell?.label || '-'
}

function getSecondaryCellText(row: SchedulePreviewRow, cell?: SchedulePreviewCell | null): string {
  if (!cell || cell.empty || isCellBreak(row, cell) || isCellLocked(cell)) return ''
  if (preview.value?.mode === 'CLASS') return cell.teacherName || ''
  return cell.subjectName || ''
}

function autoAssignTeacherIfApplicable() {
  if (authStore.user?.role === 'TEACHER') {
    const myTeacher = teachers.value.find(
      (t) => t.id === authStore.user?.id || t.name === authStore.user?.fullName
    )
    if (myTeacher && selectedTeacherId.value !== myTeacher.id) {
      previewStore.setSelectedTeacherId(myTeacher.id)
    }
  }
}

onMounted(async () => {
  await timeSlotStore.fetchAcademicYears()

  // NEW: Force reset selected class and teacher for non-TEACHER users on load.
  // This clears any cached Pinia state so it defaults to the placeholder options.
  if (authStore.user?.role !== 'TEACHER') {
    previewStore.setSelectedClassId(null)
    previewStore.setSelectedTeacherId(null)
  }

  if (authStore.user?.role === 'TEACHER' && selectedMode.value !== 'TEACHER') {
    previewStore.setMode('TEACHER')
  }

  const fetchPromises = []
  
  fetchPromises.push(previewStore.getTeachers())

  if (authStore.user?.role !== 'TEACHER') {
    fetchPromises.push(previewStore.getClasses())
  }

  await Promise.all(fetchPromises)

  if (!selectedSemesterId.value && timeSlotStore.activeSemesterId) {
    previewStore.setSemesterId(timeSlotStore.activeSemesterId)
  }

  autoAssignTeacherIfApplicable()
})

watch(
  () => selectedMode.value,
  async () => {
    previewStore.clearPreview()
    
    // NEW: Force reset selected item when modes switch for non-TEACHER users.
    if (authStore.user?.role !== 'TEACHER') {
      previewStore.setSelectedClassId(null)
      previewStore.setSelectedTeacherId(null)
    }

    if (selectedMode.value === 'TEACHER') {
      if (teachers.value.length === 0) {
        await previewStore.getTeachers()
      }
      autoAssignTeacherIfApplicable()
    }
  },
)

watch(
  () => [
    selectedSemesterId.value,
    selectedMode.value,
    selectedClassId.value,
    selectedTeacherId.value,
  ],
  async () => {
    if (!canLoadPreview.value) return
    await loadPreview()
  },
)
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <div class="mx-auto max-w-[1200px] px-5 py-8">
      <!-- Back Button -->
      <div class="mb-4">
        <button
          @click="router.push('/jadwal')"
          class="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-emerald-800"
        >
          <span>←</span>
          Kembali ke Dashboard
        </button>
      </div>

      <!-- Header -->
      <div
        class="mb-8 flex flex-col gap-4 border-b-2 border-gray-200 pb-4 md:flex-row md:items-start md:justify-between"
      >
        <div>
          <h2 class="mb-1 text-3xl font-bold text-emerald-800">
            Preview Jadwal Mingguan
          </h2>
          <p class="text-gray-500">
            {{ displaySubtitle }}
          </p>
        </div>

        <button
          type="button"
          :disabled="!canExport"
          class="inline-flex items-center justify-center rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-800 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          @click="openExportModal"
        >
          {{ exporting ? 'Mengekspor...' : 'Export Jadwal' }}
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <!-- Semester -->
          <div>
            <label class="mb-1 block text-xs font-semibold text-gray-500">
              Semester
            </label>

            <select
              :value="selectedSemesterId || ''"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
              @change="onSemesterChange"
            >
              <option value="" disabled>-- Pilih Semester --</option>

              <option
                v-for="sem in timeSlotStore.flattenedSemesters"
                :key="sem.id"
                :value="sem.id"
              >
                {{ sem.display_name }}
              </option>
            </select>
          </div>

          <!-- Mode -->
          <div>
            <label class="mb-1 block text-xs font-semibold text-gray-500">
              Tampilan
            </label>

            <select
              :value="selectedMode"
              :disabled="authStore.user?.role === 'TEACHER'"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 focus:outline-none disabled:bg-gray-100 disabled:font-semibold disabled:text-gray-600"
              @change="onModeChange"
            >
              <!-- MODIFIED: loop modeOptions dari computed -->
              <option
                v-for="option in modeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Class Dropdown (Hanya muncul jika mode = CLASS) -->
          <div v-if="selectedMode === 'CLASS'">
            <label class="mb-1 block text-xs font-semibold text-gray-500">
              Kelas
            </label>

            <select
              :value="selectedClassId || ''"
              :disabled="loadingOptions"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 focus:outline-none disabled:bg-gray-100"
              @change="onClassChange"
            >
              <option value="" disabled>-- Pilih Kelas --</option>

              <option
                v-for="cls in classes"
                :key="cls.id"
                :value="cls.id"
              >
                {{ cls.name }}
              </option>
            </select>
          </div>

          <!-- Teacher Dropdown (Hanya muncul jika mode = TEACHER) -->
          <div v-if="selectedMode === 'TEACHER'">
            <label class="mb-1 block text-xs font-semibold text-gray-500">
              Guru
            </label>

            <!-- MODIFIED: dropdown dimatikan untuk role TEACHER dan data diloop dari availableTeachers -->
            <select
              :value="selectedTeacherId || ''"
              :disabled="loadingOptions || authStore.user?.role === 'TEACHER'"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10 focus:outline-none disabled:bg-gray-100 disabled:font-semibold disabled:text-gray-600"
              @change="onTeacherChange"
            >
              <option value="" disabled v-if="authStore.user?.role !== 'TEACHER'">
                -- Pilih Guru --
              </option>

              <option
                v-for="teacher in availableTeachers"
                :key="teacher.id"
                :value="teacher.id"
              >
                {{ teacher.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-6 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        <AlertTriangle class="h-5 w-5 shrink-0 text-red-600" />
        <span class="flex-1">{{ error }}</span>

        <button
          class="text-xs font-semibold text-red-600 underline hover:text-red-800"
          @click="previewStore.clearError()"
        >
          Tutup
        </button>
      </div>

      <!-- Preview Card -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-800">
              {{ displayTitle }}
            </h3>
            <p v-if="preview" class="mt-1 text-xs text-gray-400">
              Data slot mengikuti filter {{ preview.mode === 'CLASS' ? 'kelas' : 'guru' }} yang dipilih.
            </p>
          </div>
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-20"
        >
          <span
            class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"
          />
          <p class="mt-4 text-sm font-medium text-slate-500">
            Memuat matriks jadwal...
          </p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!preview"
          class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center"
        >
          <Calendar class="mb-3 h-12 w-12 text-gray-400" stroke-width="1.5" />

          <p class="text-base font-semibold text-gray-500">
            {{ emptyStateTitle }}
          </p>

          <p class="mt-1 max-w-[520px] text-sm text-gray-400">
            {{ emptyStateDescription }}
          </p>
        </div>

        <!-- No Slot State -->
        <div
          v-else-if="preview.rows.length === 0"
          class="py-16 text-center"
        >
          <div class="mb-4 text-5xl">🗓️</div>
          <h4 class="mb-2 text-lg font-bold text-slate-700">
            Belum ada jadwal
          </h4>
          <p class="text-sm text-slate-500">
            Belum ada slot atau jadwal published untuk filter yang dipilih.
          </p>
        </div>

        <!-- Grid -->
        <div
          v-else
          class="overflow-x-auto rounded-lg border border-slate-200 shadow-sm"
        >
          <table class="w-full border-collapse bg-white text-sm">
            <thead>
              <tr>
                <th
                  class="border-b border-r border-slate-300 bg-slate-800 px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"
                >
                  Waktu
                </th>

                <th
                  v-for="day in preview.days"
                  :key="day"
                  class="border-b border-r border-slate-200 bg-white px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-700 shadow-[inset_0_-2px_0_#cbd5e1]"
                >
                  {{ day }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(row, rowIndex) in preview.rows"
                :key="`${row.startTime}-${row.endTime}-${row.sessionNumber}-${rowIndex}`"
              >
                <!-- Time Column -->
                <td
                  class="whitespace-nowrap border-b border-r border-slate-200 bg-slate-50/80 px-3 py-3 text-center align-middle"
                >
                  <div class="text-xs font-bold tracking-tight text-slate-700">
                    {{ row.timeLabel }}
                  </div>

                  <div
                    class="mt-1.5 inline-flex items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 shadow-sm"
                  >
                    {{ getRowLabel(row) }}
                  </div>
                </td>

                <!-- Day Cells -->
                <td
                  v-for="day in preview.days"
                  :key="`${row.sessionNumber}-${day}`"
                  :class="getCellClass(row, getCell(row, day))"
                >
                  <div class="font-bold leading-snug">
                    {{ getPrimaryCellText(row, getCell(row, day)) }}
                  </div>

                  <div
                    v-if="getSecondaryCellText(row, getCell(row, day))"
                    class="mt-1 text-xs font-medium text-gray-500"
                  >
                    {{ getSecondaryCellText(row, getCell(row, day)) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <!-- Export Modal -->
      <div
        v-if="showExportModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
        @click.self="closeExportModal"
      >
        <div class="w-full max-w-[520px] rounded-2xl bg-white px-10 py-9 text-center shadow-2xl">
          <h3 class="text-2xl font-bold text-emerald-900">
            Export Jadwal
          </h3>

          <p class="mt-3 text-sm text-gray-500">
            Pilih format dokumen untuk jadwal yang telah dipilih.
          </p>

          <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <button
              type="button"
              :disabled="exporting"
              class="rounded-xl border border-gray-200 bg-white px-6 py-8 transition hover:border-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              @click="exportSchedule('PDF')"
            >
              <div class="text-4xl">📄</div>
              <div class="mt-4 text-base font-bold text-gray-900">
                Dokumen PDF
              </div>
              <div class="mt-2 text-xs font-medium text-gray-500">
                Siap cetak & rapi
              </div>
            </button>

            <button
              type="button"
              :disabled="exporting"
              class="rounded-xl border border-gray-200 bg-white px-6 py-8 transition hover:border-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              @click="exportSchedule('EXCEL')"
            >
              <div class="text-4xl">📊</div>
              <div class="mt-4 text-base font-bold text-gray-900">
                File Excel
              </div>
              <div class="mt-2 text-xs font-medium text-gray-500">
                Olah data digital
              </div>
            </button>
          </div>

          <button
            type="button"
            :disabled="exporting"
            class="mt-8 text-sm font-bold rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-white shadow-sm transition hover:border-emerald-800 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            @click="closeExportModal"
          >
            {{ exporting ? 'Menyiapkan file...' : 'Batal' }}
          </button>
        </div>
      </div>

      <!-- Export Success Modal -->
      <div
        v-if="showExportSuccessModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
        @click.self="closeExportSuccessModal"
      >
        <div class="w-full max-w-[420px] rounded-2xl bg-white px-9 py-9 text-center shadow-2xl">
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-4xl text-emerald-700"
          >
            ✓
          </div>

          <h3 class="mt-6 text-2xl font-bold text-emerald-900">
            Ekspor Berhasil!
          </h3>

          <p class="mt-4 text-sm leading-6 text-gray-500">
            File jadwal Anda sedang disiapkan dan akan terunduh secara otomatis dalam beberapa detik.
            Silakan periksa folder unduhan Anda.
          </p>

          <button
            type="button"
            class="mt-7 w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
            @click="closeExportSuccessModal"
          >
            Kembali
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.preview-cell {
  min-width: 150px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 14px 10px;
  text-align: center;
  vertical-align: middle;
  color: #24342b;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.preview-cell-filled {
  background: #ffffff;
  color: #1f2937;
}

.preview-cell-empty {
  background: #ffffff;
  color: #b8c0ba;
  font-style: italic;
}

.preview-cell-locked {
  background: #eef2ef;
  color: #7f8a82;
  font-style: italic;
}

.preview-cell-break {
  background: #fef3c7;
  color: #3f4d39;
  font-weight: 800;
}

.preview-cell-dash {
  background: #eef2ef;
  color: #7f8a82;
  font-weight: 700;
}
</style>