<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { availabilityService } from '@/services/schedule/availability.service'
import { DAY_LABELS, ALL_DAYS } from '@/interfaces/schedules/timeSlot.types'
import type { DayOfWeekEnum } from '@/interfaces/schedules/timeSlot.types'
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ListChecks,
  Activity,
  Pencil,
  Lock,
  Coffee,
  HelpCircle,
} from 'lucide-vue-next'

const router = useRouter()
const timeSlotStore = useTimeSlotStore()

const availabilityMap = ref<Record<string, boolean>>({})
const isEditable = ref(true)
const deadlineDate = ref<string | null>(null)
const selectedDay = ref<DayOfWeekEnum>('MON')

const slotsForSelectedDay = computed(() => timeSlotStore.schedules[selectedDay.value] || [])

// STATISTIK
const totalValidSlots = computed(() => {
  let count = 0
  ALL_DAYS.forEach((day) => {
    const daySlots = timeSlotStore.schedules[day] || []
    daySlots.forEach((slot) => {
      if (slot.id && slot.slot_type !== 'BREAK' && !slot.is_locked) count++
    })
  })
  return count
})

const totalFilledSlots = computed(() => Object.keys(availabilityMap.value).length)
const totalAvailableSlots = computed(
  () => Object.values(availabilityMap.value).filter((s) => s === true).length,
)

const fillPercentage = computed(() =>
  totalValidSlots.value === 0
    ? 0
    : Math.round((totalFilledSlots.value / totalValidSlots.value) * 100),
)
const availablePercentage = computed(() =>
  totalFilledSlots.value === 0
    ? 0
    : Math.round((totalAvailableSlots.value / totalValidSlots.value) * 100),
)

const loadAvailabilityData = async () => {
  try {
    const response = await availabilityService.getAvailability()
    isEditable.value =
      (response as any).editable !== undefined ? (response as any).editable : response.Editable
    deadlineDate.value = response.deadlineDate

    const newMap: Record<string, boolean> = {}
    response.schedules.forEach((slot) => (newMap[slot.timeSlotId] = slot.isAvailable))
    availabilityMap.value = newMap
  } catch (error: any) {
    console.log('Data ketersediaan belum ada.')
  }
}

onMounted(async () => {
  await timeSlotStore.fetchAcademicYears()
  await loadAvailabilityData()
})

watch(
  () => timeSlotStore.activeSemesterId,
  async (newId) => {
    if (newId) await timeSlotStore.fetchSlotStructure()
  },
)
</script>

<template>
  <div class="p-3 md:p-5 max-w-4xl mx-auto flex flex-col gap-4">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div>
        <h1 class="text-lg font-bold text-gray-800">Ringkasan Ketersediaan</h1>
        <p class="text-gray-500 text-[11px]">Daftar jam mengajar Anda semester ini.</p>
      </div>

      <button
        @click="router.push({ name: 'ketersediaan-mengajar' })"
        class="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-bold text-[11px] shadow-sm transition-all active:scale-95"
      >
        <Pencil :size="12" /> Edit Jadwal
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div
        class="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between shadow-sm"
      >
        <span class="text-[10px] font-bold text-gray-400 uppercase">Semester</span>
        <div class="text-xs font-bold text-gray-700 truncate mt-1">
          {{
            timeSlotStore.academicYears.find((ay) =>
              ay.listSemesters.some((s) => s.id === timeSlotStore.activeSemesterId),
            )?.yearStart
          }}/{{
            timeSlotStore.academicYears.find((ay) =>
              ay.listSemesters.some((s) => s.id === timeSlotStore.activeSemesterId),
            )?.yearEnd
          }}
        </div>
      </div>

      <div class="bg-slate-800 p-3 rounded-lg flex flex-col justify-between shadow-sm text-white">
        <span class="text-[10px] font-bold text-slate-400 uppercase">Progress Isi</span>
        <div class="flex items-end gap-1.5 mt-1">
          <span class="text-lg font-black leading-none">{{ totalFilledSlots }}</span>
          <span class="text-[10px] font-bold text-slate-400">/ {{ totalValidSlots }} Slot</span>
        </div>
      </div>

      <div class="bg-blue-600 p-3 rounded-lg flex flex-col justify-between shadow-sm text-white">
        <span class="text-[10px] font-bold text-blue-200 uppercase">Bisa Mengajar</span>
        <div class="flex items-end gap-1.5 mt-1">
          <span class="text-lg font-black leading-none">{{ totalAvailableSlots }}</span>
          <span class="text-[10px] font-bold text-blue-200">Jam</span>
        </div>
      </div>

      <div class="bg-green-500 p-3 rounded-lg flex flex-col justify-between shadow-sm text-white">
        <span class="text-[10px] font-bold text-green-100 uppercase">Persentase</span>
        <div class="text-lg font-black mt-1 leading-none">{{ availablePercentage }}%</div>
      </div>
    </div>

    <div v-if="timeSlotStore.isLoading" class="flex justify-center py-10">
      <div
        class="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"
      ></div>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="flex border-b border-gray-100 bg-gray-50">
        <button
          v-for="day in ALL_DAYS"
          :key="day"
          @click="selectedDay = day"
          :class="[
            'flex-1 py-2 text-[11px] font-bold transition-all outline-none border-b-2',
            selectedDay === day
              ? 'bg-white border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:bg-gray-100',
          ]"
        >
          {{ DAY_LABELS[day].toUpperCase() }}
        </button>
      </div>

      <div class="flex flex-col">
        <div
          v-if="slotsForSelectedDay.length === 0"
          class="py-12 text-center text-gray-400 text-xs font-medium"
        >
          Tidak ada jadwal tersedia.
        </div>

        <div v-else class="flex flex-col divide-y divide-gray-50">
          <div
            v-for="slot in slotsForSelectedDay"
            :key="slot.id"
            class="flex items-center justify-between p-3 px-4 hover:bg-gray-50/50 transition-colors"
            :class="{
              'opacity-50 grayscale bg-gray-50': slot.slot_type === 'BREAK' || slot.is_locked,
            }"
          >
            <div class="flex items-center gap-4">
              <div class="text-[11px] font-black text-gray-700 w-20">
                {{ slot.start_time }} - {{ slot.end_time }}
              </div>

              <span
                v-if="slot.slot_type === 'BREAK'"
                class="text-[10px] font-bold text-gray-400 flex items-center gap-1"
              >
                <Coffee :size="10" /> ISTIRAHAT
              </span>
              <span
                v-else
                class="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100"
              >
                JP {{ slot.session_number }}
              </span>
            </div>

            <div class="flex items-center">
              <div v-if="slot.slot_type === 'BREAK'" class="text-[10px] text-gray-300">-</div>

              <div
                v-else-if="slot.is_locked"
                class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1"
              >
                <Lock :size="10" /> LOCKED
              </div>

              <div
                v-else-if="slot.id && availabilityMap[slot.id] === true"
                class="text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1"
              >
                <CheckCircle2 :size="12" /> BISA
              </div>

              <div
                v-else-if="slot.id && availabilityMap[slot.id] === false"
                class="text-[10px] font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200 flex items-center gap-1"
              >
                <XCircle :size="12" /> TIDAK
              </div>
              <div
                v-else
                class="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200 border-dashed flex items-center gap-1"
              >
                <HelpCircle :size="12" /> BELUM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Sembunyikan scrollbar */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
