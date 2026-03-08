<script setup lang="ts">
import { useScheduleStore } from '@/stores/schedules/scheduleStore'
import SidebarResource from './SidebarResource.vue'
import ScheduleGrid from './ScheduleGrid.vue'

// --- Store ---
const store = useScheduleStore()

// --- Emits ---
const emit = defineEmits<{
  back: []
}>()

// --- Functions ---
/** Closes the currently active draft and navigates back to the dashboard */
function onBack() {
  store.closeDraft()
  emit('back')
}
</script>

<template>
  <div>
    
    <!-- Workspace Header -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      
      <!-- Navigation and Draft Title -->
      <div class="flex items-center gap-3">
        <button
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
          @click="onBack"
        >
          ← Kembali
        </button>
        <div>
          <h2 class="text-xl font-bold text-emerald-800">
            {{ store.currentDraft?.name ?? 'Draft Jadwal' }}
          </h2>
          <span class="text-xs text-gray-400">Draft Mode</span>
        </div>
      </div>

      <!-- Controls Area -->
      <div class="flex items-center gap-3">
        
        <!-- Class Selection Dropdown -->
        <select
          :value="store.activeClassId ?? ''"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
          @change="
            (e) => store.setActiveClass((e.target as HTMLSelectElement).value || null)
          "
        >
          <option value="">— Pilih Kelas —</option>
          <option v-for="cls in store.classes" :key="cls.id" :value="cls.id">
            {{ cls.name }}
          </option>
        </select>

        <!-- Save Action -->
        <button
          class="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-900"
          @click="onBack"
        >
          Simpan & Tutup Draft
        </button>
      </div>
    </div>

    <!-- Active Workspace View -->
    <div v-if="store.activeClassId" class="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      <SidebarResource />
      <ScheduleGrid />
    </div>

    <!-- Empty State View -->
    <div v-else class="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
      <div class="mb-3 text-5xl">📋</div>
      <h3 class="mb-2 text-lg font-bold text-gray-700">Pilih Kelas Terlebih Dahulu</h3>
      <p class="text-sm text-gray-400">
        Gunakan dropdown di atas untuk memilih kelas sebelum menyusun jadwal.
      </p>
    </div>
  </div>
</template>
