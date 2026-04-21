<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Check, X, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

// ==========================================
// TYPESCRIPT INTERFACES
// ==========================================
type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI'

interface LessonData {
  subject: string
}

interface TimeSlot {
  start: string
  end: string
  type: 'LESSON' | 'BREAK'
  label?: string
  data: Partial<Record<DayOfWeek, LessonData>>
}

// ==========================================
// DUMMY DATA (Sesuai dengan Screenshot)
// ==========================================
const scheduleInfo = ref({
  id: route.params.id || '1111-aaaa',
  name: 'Jadwal Ganjil',
  academicYear: '2026/2027',
  semester: '1',
  createdBy: 'salomo',
  status: 'WAITING_APPROVAL', // WAITING_APPROVAL, REVISION, PUBLISHED
})

// Simulasi daftar kelas
const classes = ['10 IPA 1', '10 IPA 2', '11 IPS 1']
const selectedClass = ref(classes[0])

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: 'Senin',
  TUE: 'Selasa',
  WED: 'Rabu',
  THU: 'Kamis',
  FRI: 'Jumat',
}

// Data Jadwal disesuaikan dengan jam di screenshot
const timeSlots = ref<TimeSlot[]>([
  {
    start: '07:00',
    end: '07:40',
    type: 'LESSON',
    data: {
      MON: { subject: 'Bahasa Indonesia' },
      TUE: { subject: 'Pendidikan Agama Islam' },
      WED: { subject: 'Biologi' },
      THU: { subject: 'Kimia' },
      FRI: { subject: 'Sejarah' },
    },
  },
  {
    start: '07:40',
    end: '08:20',
    type: 'LESSON',
    data: {
      MON: { subject: 'Bahasa Indonesia' },
      TUE: { subject: 'Pendidikan Agama Islam' },
      WED: { subject: 'Biologi' },
      THU: { subject: 'Kimia' },
      FRI: { subject: 'Sejarah' },
    },
  },
  { start: '08:20', end: '08:50', type: 'BREAK', label: 'Istirahat', data: {} },
  {
    start: '08:50',
    end: '09:30',
    type: 'LESSON',
    data: {
      MON: { subject: 'Seni Budaya' },
      TUE: { subject: 'Matematika' },
      WED: { subject: 'Pendidikan Jasmani' },
      THU: { subject: 'Matematika Lanjut' },
      FRI: { subject: 'Seni Budaya' },
    },
  },
  {
    start: '09:30',
    end: '10:10',
    type: 'LESSON',
    data: {
      MON: { subject: 'Seni Budaya' },
      TUE: { subject: 'Matematika' },
      WED: { subject: 'Pendidikan Jasmani' },
      THU: { subject: 'Matematika Lanjut' },
      FRI: { subject: 'Seni Budaya' },
    },
  },
  {
    start: '10:10',
    end: '10:50',
    type: 'LESSON',
    data: {
      MON: { subject: 'Matematika' },
      TUE: { subject: 'Fisika' },
      WED: { subject: 'Bahasa Inggris' },
      THU: { subject: 'Pendidikan Kewarganegaraan' },
    },
  },
])

// ==========================================
// STATE UNTUK MODAL (Tolak & Setujui)
// ==========================================
const showApproveModal = ref(false)
const showRevisionModal = ref(false)
const revisionNote = ref('')
const isSubmitting = ref(false)

// ==========================================
// FUNGSI AKSI
// ==========================================
const handleApprove = () => {
  isSubmitting.value = true
  setTimeout(() => {
    scheduleInfo.value.status = 'PUBLISHED'
    isSubmitting.value = false
    showApproveModal.value = false
    alert('Jadwal berhasil disetujui!')
  }, 1000)
}

const handleReject = () => {
  if (!revisionNote.value.trim()) return
  isSubmitting.value = true
  setTimeout(() => {
    scheduleInfo.value.status = 'REVISION'
    isSubmitting.value = false
    showRevisionModal.value = false
    alert('Jadwal ditolak, catatan revisi dikirim!')
  }, 1000)
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto flex flex-col gap-6 bg-gray-50/50 min-h-screen font-sans">
    <div
      class="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative"
    >
      <div class="flex items-start gap-4">
        <button
          @click="router.push({ name: 'persetujuan-jadwal' })"
          class="mt-1 p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft :size="24" />
        </button>

        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-800">{{ scheduleInfo.name }}</h1>
            <span
              v-if="scheduleInfo.status === 'WAITING_APPROVAL'"
              class="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200"
            >
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              Menunggu Persetujuan
            </span>
            <span
              v-else-if="scheduleInfo.status === 'PUBLISHED'"
              class="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Disetujui
            </span>
            <span
              v-else
              class="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200"
            >
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              Ditolak / Revisi
            </span>
          </div>

          <p class="text-sm text-gray-600">
            Tahun Ajaran:
            <span class="font-medium text-gray-800">{{ scheduleInfo.academicYear }}</span> &bull;
            Semester:
            <span class="font-medium text-gray-800">{{ scheduleInfo.semester }}</span> &bull; Dibuat
            Oleh: <span class="font-medium text-gray-800">{{ scheduleInfo.createdBy }}</span>
          </p>
        </div>
      </div>

      <div v-if="scheduleInfo.status === 'WAITING_APPROVAL'" class="flex items-center gap-3">
        <button
          @click="showRevisionModal = true"
          class="px-6 py-2 border border-red-500 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          Tolak
        </button>
        <button
          @click="showApproveModal = true"
          class="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Setujui
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col gap-4">
      <div class="flex items-center gap-3 mb-2">
        <label class="text-sm font-semibold text-gray-700">Pilih Kelas</label>
        <select
          v-model="selectedClass"
          class="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[150px]"
        >
          <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
        </select>
      </div>

      <div class="overflow-hidden border border-gray-200 rounded-lg">
        <table class="w-full text-sm text-center border-collapse table-fixed min-w-[900px]">
          <thead class="bg-slate-50 text-gray-700">
            <tr>
              <th class="px-4 py-3 border border-gray-200 font-semibold w-32">Waktu</th>
              <th
                v-for="day in DAYS"
                :key="day"
                class="px-4 py-3 border border-gray-200 font-semibold w-48"
              >
                {{ DAY_LABELS[day] }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(slot, index) in timeSlots" :key="index">
              <td class="px-3 py-3 border border-gray-200 text-gray-700 font-medium">
                {{ slot.start }} - {{ slot.end }}
              </td>

              <td
                v-if="slot.type === 'BREAK'"
                colspan="5"
                class="bg-gray-100 border border-gray-200 py-3 text-gray-500 font-semibold tracking-wide"
              >
                {{ slot.label }}
              </td>

              <template v-if="slot.type === 'LESSON'">
                <td
                  v-for="day in DAYS"
                  :key="day"
                  class="border border-gray-200 p-1.5 h-16 align-middle"
                >
                  <div
                    v-if="slot.data[day]"
                    class="h-full w-full bg-blue-50 text-blue-700 rounded-md flex items-center justify-center font-medium px-2 py-1 leading-snug"
                  >
                    {{ slot.data[day]?.subject }}
                  </div>
                  <div
                    v-else
                    class="h-full w-full flex items-center justify-center text-gray-400 bg-white"
                  ></div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showApproveModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-xl">
        <div class="p-6 text-center flex flex-col items-center">
          <div
            class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600"
          >
            <Check :size="28" stroke-width="3" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Setujui Jadwal?</h3>
          <p class="text-sm text-gray-500 mb-6">
            Pastikan jadwal sudah sesuai karena akan dipublikasikan ke seluruh guru dan siswa.
          </p>
          <div class="flex gap-3 w-full">
            <button
              @click="showApproveModal = false"
              class="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              @click="handleApprove"
              :disabled="isSubmitting"
              class="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Ya, Setujui
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showRevisionModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4 text-red-600">
            <AlertTriangle :size="24" />
            <h3 class="text-lg font-bold text-gray-900">Tolak & Minta Revisi</h3>
          </div>
          <p class="text-sm text-gray-600 mb-4">
            Berikan catatan mengenai bagian jadwal mana yang perlu direvisi oleh Staff.
          </p>

          <textarea
            v-model="revisionNote"
            rows="4"
            placeholder="Contoh: Jadwal guru Matematika bentrok di hari Selasa..."
            class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-gray-50"
          ></textarea>
        </div>
        <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            @click="showRevisionModal = false"
            class="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            @click="handleReject"
            :disabled="isSubmitting || !revisionNote.trim()"
            class="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300"
          >
            Kirim Revisi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
