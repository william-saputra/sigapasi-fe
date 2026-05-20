<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { useRouter } from 'vue-router'
import { availabilityService } from '@/services/schedule/availability.service'
import { DAY_LABELS, ALL_DAYS } from '@/interfaces/schedules/timeSlot.types'
import type { DayOfWeekEnum } from '@/interfaces/schedules/timeSlot.types'
import {
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  CheckSquare,
  ListChecks,
  Activity,
} from 'lucide-vue-next'

const router = useRouter()
const timeSlotStore = useTimeSlotStore()

// State
const availabilityMap = ref<Record<string, boolean>>({})
const isEditable = ref(true)
const deadlineDate = ref<string | null>(null)
const hasExistingData = ref(false)
const isSaving = ref(false)
const message = ref({ text: '', type: '' })

// Interaksi
const openSlotId = ref<string | null>(null)
const selectedDay = ref<DayOfWeekEnum>('MON')

// Computed
// Computed
const slotsForSelectedDay = computed(() => {
  const rawSlots = timeSlotStore.schedules[selectedDay.value] || []

  if (timeSlotStore.activeSchoolLevelId) {
    return rawSlots.filter((slot) => slot.school_level_id === timeSlotStore.activeSchoolLevelId)
  }

  return rawSlots
})

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

// Fungsi Utama
const loadAvailabilityData = async () => {
  try {
    const response = await availabilityService.getAvailability()
    isEditable.value =
      (response as any).editable !== undefined ? (response as any).editable : response.Editable
    deadlineDate.value = response.deadlineDate
    hasExistingData.value = response.schedules && response.schedules.length > 0

    if (response.schoolLevelId) {
      timeSlotStore.activeSchoolLevelId = response.schoolLevelId
    }

    const newMap: Record<string, boolean> = {}
    response.schedules.forEach((slot) => (newMap[slot.timeSlotId] = slot.isAvailable))
    availabilityMap.value = newMap
  } catch (error: any) {
    if (error.response?.status !== 404) {
      message.value = { text: 'Gagal mengambil data.', type: 'error' }
    }
  }
}

onMounted(async () => {
  await timeSlotStore.fetchAcademicYears()
  await loadAvailabilityData()
})

watch(
  () => timeSlotStore.activeSemesterId,
  async (newId) => {
    if (newId) {
      await timeSlotStore.fetchSlotStructure()
    }
  },
  { immediate: true },
)

const toggleSelection = (id: string | undefined) => {
  if (!id) return
  openSlotId.value = openSlotId.value === id ? null : id
}

const chooseAvailability = (id: string | undefined, isAvailable: boolean) => {
  if (!id) return
  availabilityMap.value[id] = isAvailable
  openSlotId.value = null
}

const handleSave = async () => {
  if (!isEditable.value) {
    alert('Maaf, tenggat waktu pengisian sudah habis.')
    return
  }

  isSaving.value = true
  message.value = { text: '', type: '' }
  openSlotId.value = null

  try {
    const payload = {
      availabilities: Object.entries(availabilityMap.value).map(([timeSlotId, isAvailable]) => ({
        timeSlotId,
        isAvailable,
      })),
    }

    if (hasExistingData.value) {
      await availabilityService.updateAvailability(payload)
    } else {
      await availabilityService.createAvailability(payload)
      hasExistingData.value = true
    }
    message.value = { text: 'Tersimpan!', type: 'success' }
    setTimeout(() => {
      router.push({ name: 'ketersediaan-ringkasan' })
    }, 1500)
  } catch (error: any) {
    message.value = { text: 'Gagal menyimpan.', type: 'error' }
  } finally {
    isSaving.value = false
    setTimeout(() => (message.value.text = ''), 4000)
  }
}

function selectDayAndClearSlot(day: any) {
  selectedDay.value = day
  openSlotId.value = null
}
</script>

<template>
  <div class="p-3 md:p-5 max-w-5xl mx-auto flex flex-col gap-4">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-800">Ketersediaan Mengajar</h1>
        <p class="text-gray-500 text-xs mt-0.5">Tentukan jam di mana Anda bisa mengajar.</p>
      </div>

      <button
        @click="handleSave"
        :disabled="isSaving || Object.keys(availabilityMap).length === 0"
        class="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium text-xs shadow-sm transition-all"
      >
        <Save :size="14" />
        {{ isSaving ? 'Menyimpan...' : 'Simpan Ketersediaan' }}
      </button>
    </div>

    <Transition name="fade">
      <div
        v-if="message.text"
        :class="`p-2.5 rounded-md flex items-center gap-2 font-medium text-xs border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`"
      >
        <CheckCircle2 v-if="message.type === 'success'" :size="16" class="text-green-500" />
        <AlertCircle v-else :size="16" class="text-red-500" />
        {{ message.text }}
      </div>
    </Transition>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div
        class="md:col-span-5 bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-center gap-2"
      >
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label class="text-xs font-bold text-gray-700 w-24">Semester:</label>
          <select
            v-model="timeSlotStore.activeSemesterId"
            class="flex-1 w-full border-gray-300 rounded text-xs bg-gray-50 py-1.5 px-2 outline-none"
          >
            <optgroup
              v-for="ay in timeSlotStore.academicYears"
              :key="ay.id"
              :label="`${ay.yearStart}/${ay.yearEnd}`"
            >
              <option v-for="sem in ay.listSemesters" :key="sem.id" :value="sem.id">
                Semester {{ sem.name }} {{ sem.isActive ? '(Aktif)' : '' }}
              </option>
            </optgroup>
          </select>
        </div>
        <div
          v-if="deadlineDate"
          :class="`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-semibold border ${isEditable ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`"
        >
          <Calendar :size="14" />
          <span
            >{{ isEditable ? 'Batas Isi:' : 'Tenggat Habis:' }}
            {{
              new Date(deadlineDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            }}</span
          >
        </div>
      </div>

      <div
        class="md:col-span-4 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between"
      >
        <div class="flex justify-between items-center mb-1">
          <h3 class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <ListChecks :size="14" class="text-slate-500" /> Progress Isi
          </h3>
          <span class="text-[10px] font-bold text-slate-600"
            >{{ totalFilledSlots }} / {{ totalValidSlots }} Slot</span
          >
        </div>
        <div class="w-full bg-slate-200 rounded-full h-1.5 mb-1.5">
          <div
            class="bg-slate-600 h-1.5 rounded-full transition-all duration-500"
            :style="`width: ${fillPercentage}%`"
          ></div>
        </div>
        <div class="text-[10px] text-slate-500 font-medium text-right">
          {{ fillPercentage }}% Selesai
        </div>
      </div>

      <div
        class="md:col-span-3 bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col justify-between"
      >
        <div class="flex justify-between items-center mb-1">
          <h3 class="text-xs font-bold text-blue-800 flex items-center gap-1.5">
            <Activity :size="14" class="text-blue-500" /> BISA Mengajar
          </h3>
          <span class="text-[10px] font-bold text-blue-700">{{ totalAvailableSlots }} Slot</span>
        </div>
        <div class="w-full bg-blue-200 rounded-full h-1.5 mb-1.5">
          <div
            class="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
            :style="`width: ${availablePercentage}%`"
          ></div>
        </div>
        <div class="text-[10px] text-blue-600 font-medium text-right">
          {{ availablePercentage }}% Ketersediaan
        </div>
      </div>
    </div>

    <div v-if="timeSlotStore.isLoading" class="flex justify-center py-10">
      <div
        class="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"
      ></div>
    </div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="flex overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-hide">
        <button
          v-for="day in ALL_DAYS"
          :key="day"
          @click="selectDayAndClearSlot(day)"
          :class="[
            'flex-1 min-w-[80px] py-2.5 text-xs font-bold text-center transition-all border-b-2 outline-none',
            selectedDay === day
              ? 'bg-white border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100',
          ]"
        >
          {{ DAY_LABELS[day] }}
        </button>
      </div>

      <div class="p-4 bg-gray-50/50 min-h-[300px]">
        <div
          v-if="slotsForSelectedDay.length === 0"
          class="text-center py-10 text-gray-400 text-xs"
        >
          Tidak ada jadwal pelajaran untuk hari ini.
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          <div
            v-for="slot in slotsForSelectedDay"
            :key="slot.id"
            class="p-2.5 rounded-md border flex flex-col justify-between bg-white relative"
            :class="
              slot.slot_type === 'BREAK' || slot.is_locked
                ? 'border-gray-200 opacity-60 bg-gray-50'
                : 'border-gray-200 hover:border-blue-300'
            "
          >
            <div class="flex justify-between items-center mb-2.5">
              <div class="flex items-center gap-1 text-gray-800 font-bold text-xs">
                <Clock :size="12" class="text-gray-400" />
                {{ slot.start_time }}-{{ slot.end_time }}
              </div>
              <span class="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                {{ slot.slot_type === 'BREAK' ? 'IST' : `JP ${slot.session_number}` }}
              </span>
            </div>

            <div
              v-if="!slot.id"
              class="h-7 flex items-center justify-center text-[9px] text-amber-600 bg-amber-50 rounded mt-auto"
            >
              Menunggu
            </div>

            <div
              v-else-if="slot.slot_type === 'BREAK' || slot.is_locked"
              class="h-7 w-full bg-gray-100 text-gray-500 rounded flex items-center justify-center text-[9px] font-bold mt-auto"
            >
              {{ slot.slot_type === 'BREAK' ? 'ISTIRAHAT' : 'TERKUNCI' }}
            </div>

            <div v-else class="mt-auto w-full">
              <div v-if="openSlotId === slot.id" class="flex gap-1 h-7 w-full">
                <button
                  @click.prevent.stop="chooseAvailability(slot.id, true)"
                  class="flex-1 rounded flex items-center justify-center font-bold text-[9px] border border-green-500 bg-green-50 text-green-700 hover:bg-green-500 hover:text-white"
                >
                  BISA
                </button>
                <button
                  @click.prevent.stop="chooseAvailability(slot.id, false)"
                  class="flex-1 rounded flex items-center justify-center font-bold text-[9px] border border-red-500 bg-red-50 text-red-700 hover:bg-red-500 hover:text-white"
                >
                  TIDAK
                </button>
              </div>

              <button
                v-else
                @click.prevent.stop="toggleSelection(slot.id)"
                :class="[
                  'h-7 w-full rounded flex items-center justify-between px-2 font-bold text-[9px] border outline-none',
                  availabilityMap[slot.id] === true
                    ? 'bg-green-50 border-green-400 text-green-700'
                    : availabilityMap[slot.id] === false
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : 'bg-white border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-600',
                ]"
              >
                <div class="flex items-center">
                  <template v-if="availabilityMap[slot.id] === true">
                    <CheckCircle2 :size="12" class="mr-1" /> BISA
                  </template>
                  <template v-else-if="availabilityMap[slot.id] === false">
                    <XCircle :size="12" class="mr-1" /> TIDAK
                  </template>
                  <template v-else>
                    <CheckSquare :size="12" class="mr-1 opacity-50" /> PILIH
                  </template>
                </div>
                <ChevronDown :size="12" class="opacity-50" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
