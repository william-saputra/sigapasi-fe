<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import apiService from '@/services/api.service'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import type { WorkloadAnalyticsResponse } from '@/interfaces/schedules/schedule.types'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{
  show: boolean
  scheduleId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const toast = useToast()

// State
const subjects = ref<any[]>([])
const selectedSubjectId = ref<string>('')
const useAverage = ref<boolean>(true)
const customIdealHours = ref<number>(24)
const isLoading = ref(false)
const analyticsData = ref<WorkloadAnalyticsResponse | null>(null)

// Computed Chart Data
const chartData = computed(() => {
  if (!analyticsData.value) return { labels: [], datasets: [] }

  const labels = analyticsData.value.teacherWorkloads.map(t => t.teacherName)
  const dataHours = analyticsData.value.teacherWorkloads.map(t => t.totalHours)
  
  // Warnai bar sesuai status
  const backgroundColors = analyticsData.value.teacherWorkloads.map(t => {
    if (t.status === 'IDEAL') return '#10B981' // Emerald 500 (Hijau)
    if (t.status === 'UNDERLOAD') return '#F59E0B' // Amber 500 (Kuning)
    return '#EF4444' // Red 500 (Merah)
  })

  return {
    labels,
    datasets: [
      {
        label: 'Total Jam Mengajar',
        data: dataHours,
        backgroundColor: backgroundColors,
        borderRadius: 4,
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => ` ${context.raw} Jam (Target: ${analyticsData.value?.idealHoursUsed} Jam)`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 2 }
    }
  }
}

// Fetch Master Subjects
// Fetch Master Subjects
async function fetchSubjects() {
  try {
    const res = await apiService.get<any>('/subjects') 
    
    // Perbaikan: Handle berbagai jenis response wrapper dari backend Spring Boot
    if (res.data && Array.isArray(res.data)) {
        subjects.value = res.data
    } else if (res.data && res.data.content && Array.isArray(res.data.content)) {
        subjects.value = res.data.content
    } else if (Array.isArray(res)) {
        subjects.value = res
    } else {
        subjects.value = []
    }

    if (subjects.value.length > 0) {
      selectedSubjectId.value = subjects.value[0].id
    }
  } catch (error) {
    console.error("Gagal memuat mata pelajaran", error)
    toast.error('Gagal mengambil daftar mata pelajaran')
  }
}

// Fetch Analytics
async function fetchAnalytics() {
  // Hanya return jika scheduleId kosong. subjectId sekarang boleh kosong
  if (!props.scheduleId) return

  isLoading.value = true
  try {
    const params = new URLSearchParams({
      scheduleId: props.scheduleId,
      useAverage: useAverage.value.toString()
    })
    
    // Kalau ada mapel yang dipilih, baru kirim subjectId
    if (selectedSubjectId.value) {
        params.append('subjectId', selectedSubjectId.value)
    }

    if (!useAverage.value) {
      params.append('idealHours', customIdealHours.value.toString())
    }    
    if (!useAverage.value) {
      params.append('idealHours', customIdealHours.value.toString())
    }

    const res = await apiService.get<WorkloadAnalyticsResponse>(`/analytics/workload?${params.toString()}`)
    analyticsData.value = res
  } catch (error) {
    toast.error('Gagal mengambil data statistik')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// Re-fetch saat modal dibuka atau ada parameter ganti
watch(() => props.show, async (newVal) => {
  if (newVal) {
    if (subjects.value.length === 0) await fetchSubjects()
    await fetchAnalytics()
  } else {
    analyticsData.value = null // reset saat tutup
  }
})

watch([selectedSubjectId, useAverage], () => {
  if (props.show) fetchAnalytics()
})

// Mencegah debounce berlebih saat ngetik jam manual
let timeout: any
function onManualHoursChange() {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    if (props.show && !useAverage.value) fetchAnalytics()
  }, 800)
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
      
      <div class="mb-4 flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Statistik Beban Jam Mengajar</h2>
          <p class="text-sm text-gray-500">Pantau distribusi jam mengajar guru agar seimbang.</p>
        </div>
        <button @click="emit('close')" class="text-gray-400 hover:text-red-500 text-2xl font-bold transition">&times;</button>
      </div>

      <div class="mb-6 flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div class="flex-1 min-w-[200px]">
          <label class="mb-1 block text-xs font-bold text-gray-600">Pilih Mata Pelajaran</label>
          <select
            v-model="selectedSubjectId"
            class="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
          >
          <option value="">Semua Mata Pelajaran</option>
            <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
          </select>
        </div>

        <div class="w-48">
          <label class="mb-1 block text-xs font-bold text-gray-600">Target Jam Ideal</label>
          <select
            v-model="useAverage"
            class="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option :value="true">Hitung Rata-rata (Auto)</option>
            <option :value="false">Input Manual</option>
          </select>
        </div>

        <div v-if="!useAverage" class="w-32 animate-fade-in">
          <label class="mb-1 block text-xs font-bold text-gray-600">Set Jam</label>
          <div class="relative">
            <input
              v-model="customIdealHours"
              type="number"
              min="1"
              @input="onManualHoursChange"
              class="w-full rounded-lg border border-gray-300 p-2.5 pr-8 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <span class="absolute right-3 top-2.5 text-sm text-gray-400">JP</span>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center py-20">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700 mb-4"></div>
        <p class="text-gray-500 font-medium">Mengkalkulasi beban kerja...</p>
      </div>

      <div v-else-if="analyticsData" class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center">
            <span class="text-sm font-bold text-gray-500 mb-1">Total Guru</span>
            <span class="text-3xl font-black text-gray-800">{{ analyticsData.totalTeachers }}</span>
          </div>
          <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm flex flex-col justify-center items-center text-center">
            <span class="text-sm font-bold text-emerald-700 mb-1">Beban Ideal ({{ analyticsData.idealHoursUsed }} JP)</span>
            <span class="text-3xl font-black text-emerald-600">{{ analyticsData.totalIdeal }}</span>
          </div>
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm flex flex-col justify-center items-center text-center">
            <span class="text-sm font-bold text-amber-700 mb-1">Underload (< {{ analyticsData.idealHoursUsed }} JP)</span>
            <span class="text-3xl font-black text-amber-600">{{ analyticsData.totalUnderload }}</span>
          </div>
          <div class="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm flex flex-col justify-center items-center text-center">
            <span class="text-sm font-bold text-red-700 mb-1">Overload (> {{ analyticsData.idealHoursUsed }} JP)</span>
            <span class="text-3xl font-black text-red-600">{{ analyticsData.totalOverload }}</span>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm min-h-[350px]">
          <h3 class="font-bold text-gray-700 mb-4 text-center">Grafik Jam Mengajar Guru: {{ analyticsData.subjectName }}</h3>
          <div class="h-[300px]">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
</style>