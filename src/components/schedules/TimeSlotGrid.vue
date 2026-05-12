<script setup lang="ts">
import { ref } from 'vue'
import { useTimeSlotStore } from '@/stores/schedules/timeSlotStore'
import { DAY_LABELS } from '@/interfaces/schedules/timeSlot.types'
import { useToast } from 'vue-toastification'
import TimeSlotItem from './TimeSlotItem.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { Calendar, Lock, Unlock } from 'lucide-vue-next'

// --- Store ---
const store = useTimeSlotStore()
const toast = useToast()

// --- State ---
// Drag and drop state
const dragIndex = ref<number | null>(null)

// Lock modal state (Local)
const showLockModal = ref(false)
const lockTargetIndex = ref<number | null>(null)
const lockLabel = ref('')
const isUnlocking = ref(false)

// --- Functions ---
/** Records the starting index when a drag operation begins */
function onDragStart(index: number, _event: DragEvent) {
  dragIndex.value = index
}

/** Processes drop action and triggers reorder if indices differ */
function onDrop(targetIndex: number, _event: DragEvent) {
  if (dragIndex.value !== null && dragIndex.value !== targetIndex) {
    store.reorderSlots(dragIndex.value, targetIndex)
  }
  dragIndex.value = null
}

/** Clears the drag state when operation finishes */
function onDragEnd() {
  dragIndex.value = null
}

/**

 * Prepares the target slot configuration before showing the lock modal.
 * Adjusts lock state indicators based on current status.
 */
function openLockModal(index: number) {
  lockTargetIndex.value = index
  const slot = store.currentSchedule[index]
  if (slot && slot.is_locked) {
    isUnlocking.value = true
    lockLabel.value = ''
  } else {
    isUnlocking.value = false
    lockLabel.value = ''
  }
  showLockModal.value = true
}

/**
 * Applies lock or unlock changes to the targeted slot locally.
 * Cleans up temporary states to reset modal logic.
 */
async function confirmLock() {
  if (lockTargetIndex.value === null) return

  const slot = store.currentSchedule[lockTargetIndex.value]
  if (!slot) return

  if (!isUnlocking.value) {
    if (!lockLabel.value || !lockLabel.value.trim()) {
      toast.error('Nama label tidak boleh kosong!')
      return
    }
  }

  // JIKA SLOT SUDAH ADA DI DATABASE (Punya ID)
  if (slot.id) {
    try {
      if (isUnlocking.value) {
        await store.unlockSlot(slot.id)
        toast.success('Slot berhasil dibuka kunci')

        // Update state lokal SETELAH API sukses (jangan panggil fetch)
        slot.is_locked = false
        slot.locked_label = null
      } else {
        await store.lockSlot(slot.id, lockLabel.value.trim())
        toast.success('Slot berhasil dikunci')

        // Update state lokal SETELAH API sukses
        slot.is_locked = true
        slot.locked_label = lockLabel.value.trim()
      }

      showLockModal.value = false
      lockTargetIndex.value = null
      lockLabel.value = ''
    } catch (error) {
      console.error('Gagal mengunci/membuka kunci:', error)
      // Jika gagal, state lokal tidak diubah, perubahan dibatalkan
    }
  } else {
    slot.is_locked = !isUnlocking.value
    slot.locked_label = slot.is_locked ? lockLabel.value.trim() : null

    toast.success(
      isUnlocking.value ? 'Slot berhasil dibuka (Lokal)' : 'Slot berhasil dikunci (Lokal)',
    )

    showLockModal.value = false
    lockTargetIndex.value = null
    lockLabel.value = ''
  }
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <!-- Grid Header -->
    <div class="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
      <span class="font-bold text-emerald-800">Preview: {{ DAY_LABELS[store.currentDay] }}</span>
      <span class="text-xs text-gray-500">Drag untuk atur ulang urutan</span>
    </div>

    <!-- Loading State -->
    <div
      v-if="store.isLoading"
      class="flex flex-col items-center justify-center py-16 text-gray-400"
    >
      <svg
        class="mb-3 h-8 w-8 animate-spin text-emerald-800"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p class="text-sm">Memuat slot waktu...</p>
    </div>

    <!-- Schedule List -->
    <div v-else-if="store.currentSchedule.length > 0" class="flex flex-col gap-3">
      <TimeSlotItem
        v-for="(slotItem, index) in store.currentSchedule"
        :key="slotItem.id ?? `slot-${index}`"
        :slot="slotItem"
        :index="index"
        @update-duration="(i, d) => store.updateSlotDuration(i, d)"
        @toggle-lock="openLockModal"
        @delete="(i) => store.removeSlot(i)"
        @drag-start="onDragStart"
        @drag-over="() => {}"
        @drop="onDrop"
        @drag-end="onDragEnd"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="py-10 text-center text-gray-500">
      <div class="mb-3 flex justify-center">
        <Calendar class="h-12 w-12 text-gray-400" stroke-width="1.5" />
      </div>
      <p>
        Belum ada slot waktu.<br />
        Gunakan panel kiri untuk generate.
      </p>
    </div>

    <!-- Lock Confirmation Modal -->
    <BaseModal :show="showLockModal" @close="showLockModal = false">
      <template #header>
        <div class="mb-4 flex justify-center">
          <Unlock v-if="isUnlocking" class="h-12 w-12 text-emerald-800" stroke-width="1.5" />
          <Lock v-else class="h-12 w-12 text-emerald-800" stroke-width="1.5" />
        </div>
        <h3 class="mb-2 text-lg font-bold text-gray-800">
          {{ isUnlocking ? 'Buka Kunci Slot?' : 'Kunci Slot Waktu' }}
        </h3>
      </template>
      <template #body>
        <p v-if="isUnlocking" class="mb-6 text-sm leading-relaxed text-gray-500">
          Slot ini akan kembali menjadi slot pelajaran biasa.
        </p>
        <template v-else>
          <p class="mb-4 text-sm leading-relaxed text-gray-500">
            Slot yang dikunci tidak dapat diubah durasinya. Masukkan nama kegiatan:
          </p>
          <div class="mb-6 text-left">
            <label class="mb-1 block text-sm font-semibold text-gray-800">Label Kegiatan:</label>
            <input
              v-model="lockLabel"
              type="text"
              placeholder="Contoh: Upacara Bendera"
              class="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm transition-all focus:border-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-800/10 focus:outline-none"
            />
          </div>
        </template>
      </template>
      <template #footer>
        <div class="flex gap-4">
          <button
            class="flex-1 rounded-full border border-gray-300 bg-gray-200 px-4 py-2.5 font-bold text-gray-800 transition-colors hover:bg-gray-300 disabled:opacity-50"
            @click="showLockModal = false"
            :disabled="store.isSaving"
          >
            Kembali
          </button>
          <button
            class="flex-1 rounded-full bg-emerald-800 px-4 py-2.5 font-bold text-white transition-colors hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="confirmLock"
            :disabled="store.isSaving"
          >
            {{ store.isSaving ? 'Memproses...' : isUnlocking ? 'Buka Kunci' : 'Simpan' }}
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped></style>
