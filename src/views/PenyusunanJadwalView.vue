<script setup lang="ts">
import { ref } from 'vue'
import { useScheduleStore } from '@/stores/schedules/scheduleStore'
import DraftDashboard from '@/components/schedules/draft/DraftDashboard.vue'
import DraftWorkspace from '@/components/schedules/draft/DraftWorkspace.vue'

// --- Store ---
const store = useScheduleStore()

// --- State ---
// Current active view mode determination
const viewMode = ref<'dashboard' | 'workspace'>('dashboard')

// --- Functions ---
/** Opens a specific draft by id and switches view to workspace */
function onOpenDraft(id: string) {
  store.openDraft(id)
  viewMode.value = 'workspace'
}

/** Transitions the view back to the main draft dashboard */
function onBackToDashboard() {
  viewMode.value = 'dashboard'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <div class="mx-auto max-w-[1200px] px-5 py-8">
      
      <!-- Dashboard Application View -->
      <DraftDashboard
        v-if="viewMode === 'dashboard'"
        @open-draft="onOpenDraft"
        @create-draft="() => {}"
      />
      
      <!-- Workspace Composition View -->
      <DraftWorkspace v-else @back="onBackToDashboard" />
      
    </div>
  </div>
</template>
