<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import type { ClassSummaryDTO, CompletionStatus } from '@/interfaces/schedules/schedule.types'

const props = defineProps<{
  modelValue: string | null
  classes: ClassSummaryDTO[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectClass(classId: string) {
  emit('update:modelValue', classId)
  isOpen.value = false
}

function getStatusDotClass(status: CompletionStatus): string {
  switch (status) {
    case 'COMPLETE': return 'bg-green-500'
    case 'PARTIAL': return 'bg-amber-500'
    case 'EMPTY': return 'bg-red-500'
    default: return 'bg-gray-400'
  }
}

function getStatusLabel(status: CompletionStatus): string {
  switch (status) {
    case 'COMPLETE': return 'Lengkap'
    case 'PARTIAL': return 'Belum Lengkap'
    case 'EMPTY': return 'Kosong'
    default: return 'Unknown'
  }
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const getGradeLevel = (name: string): number => {
  const match = name.match(/^(\d+)/)
  return match && match[1] ? parseInt(match[1], 10) : 0
}

const compareClasses = (a: ClassSummaryDTO, b: ClassSummaryDTO) => {
  const levelA = getGradeLevel(a.className)
  const levelB = getGradeLevel(b.className)

  if (levelA !== levelB) {
    return levelA - levelB
  }
  return a.className.localeCompare(b.className, undefined, { numeric: true, sensitivity: 'base' })
}

const incompleteClasses = computed(() => {
  return props.classes
    .filter((cls) => cls.completionStatus !== 'COMPLETE')
    .sort(compareClasses)
})

const completeClasses = computed(() => {
  return props.classes
    .filter((cls) => cls.completionStatus === 'COMPLETE')
    .sort(compareClasses)
})
</script>

<template>
  <div ref="dropdownRef" class="relative w-full">
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:border-emerald-500 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
      @click="toggleDropdown"
    >
      <span v-if="modelValue" class="flex items-center gap-2">
        <span
          v-for="cls in classes"
          v-show="cls.classId === modelValue"
          :key="cls.classId"
          :class="['h-2.5 w-2.5 rounded-full', getStatusDotClass(cls.completionStatus)]"
        ></span>
        <span class="truncate">
          {{ classes.find(c => c.classId === modelValue)?.className || '— Pilih Kelas —' }}
        </span>
        <AlertTriangle v-if="classes.find(c => c.classId === modelValue)?.isFeasible === false" class="h-4 w-4 text-red-500" />
      </span>
      <span v-else class="text-gray-400">— Pilih Kelas —</span>
      <svg
        class="h-4 w-4 text-gray-400 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <ul
        v-if="isOpen"
        class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      >
        <!-- Belum Lengkap Section -->
        <template v-if="incompleteClasses.length > 0">
          <li class="bg-gray-50 px-4 py-1.5 text-xs font-bold text-gray-500 border-b border-gray-100 select-none">
            Belum Lengkap ({{ incompleteClasses.length }})
          </li>
          <li
            v-for="cls in incompleteClasses"
            :key="cls.classId"
            class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50"
            :class="{
              'bg-emerald-50': cls.classId === modelValue,
              'border-l-4 border-emerald-500 pl-3': cls.classId === modelValue
            }"
            @click="selectClass(cls.classId)"
          >
            <span
              :class="['h-2.5 w-2.5 flex-shrink-0 rounded-full', getStatusDotClass(cls.completionStatus)]"
            ></span>
            <span class="flex-1 truncate text-gray-700">{{ cls.className }}</span>
            <AlertTriangle v-if="cls.isFeasible === false" class="h-4 w-4 flex-shrink-0 text-red-500" />
            <span class="text-xs text-gray-400">{{ cls.filledHours }}/{{ cls.targetHours }} Jam Pelajaran</span>
          </li>
        </template>

        <!-- Sudah Lengkap Section -->
        <template v-if="completeClasses.length > 0">
          <li class="bg-gray-50 px-4 py-1.5 text-xs font-bold text-gray-500 border-b border-gray-100 select-none" :class="{ 'mt-2': incompleteClasses.length > 0 }">
            Sudah Lengkap ({{ completeClasses.length }})
          </li>
          <li
            v-for="cls in completeClasses"
            :key="cls.classId"
            class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-emerald-50"
            :class="{
              'bg-emerald-50': cls.classId === modelValue,
              'border-l-4 border-emerald-500 pl-3': cls.classId === modelValue
            }"
            @click="selectClass(cls.classId)"
          >
            <span
              :class="['h-2.5 w-2.5 flex-shrink-0 rounded-full', getStatusDotClass(cls.completionStatus)]"
            ></span>
            <span class="flex-1 truncate text-gray-700">{{ cls.className }}</span>
            <AlertTriangle v-if="cls.isFeasible === false" class="h-4 w-4 flex-shrink-0 text-red-500" />
            <span class="text-xs text-gray-400">{{ cls.filledHours }}/{{ cls.targetHours }} Jam Pelajaran</span>
          </li>
        </template>
      </ul>
    </Transition>

    <div v-if="modelValue" class="mt-2 flex items-center gap-2 text-xs">
      <template v-for="cls in classes" :key="cls.classId">
        <div v-if="cls.classId === modelValue" class="flex items-center gap-2">
          <span
            :class="['h-2.5 w-2.5 rounded-full', getStatusDotClass(cls.completionStatus)]"
            :title="cls.completionStatus"
          ></span>
          <span class="text-gray-600">{{ getStatusLabel(cls.completionStatus) }}</span>
          <span class="text-gray-400">|</span>
          <span class="text-gray-500">{{ cls.subjectCompletions?.length || 0 }} mapel</span>
          <span v-if="cls.isFeasible === false" class="ml-2 flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 font-medium text-red-700">
            <AlertTriangle class="h-3 w-3" />
            Melebihi Kapasitas
          </span>
        </div>
      </template>
    </div>
  </div>
</template>