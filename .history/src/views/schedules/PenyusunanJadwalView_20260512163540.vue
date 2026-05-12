<script setup lang="ts">
import { ref } from 'vue'
import DraftDashboard from '@/components/schedules/draft/DraftDashboard.vue'
import DraftWorkspace from '@/components/schedules/draft/DraftWorkspace.vue'
import type { ScheduleDraftDTO } from '@/interfaces/schedules/schedule.types'

// --- State ---
const viewMode = ref<'dashboard' | 'workspace'>('dashboard')
const activeDraft = ref<ScheduleDraftDTO | null>(null)

// --- Functions ---
function onOpenDraft(draft: ScheduleDraftDTO) {
  activeDraft.value = draft
  viewMode.value = 'workspace'
}

function onBackToDashboard() {
  activeDraft.value = null
  viewMode.value = 'dashboard'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <div class="mx-auto max-w-[1400px] px-5 py-8">
      <!-- Dashboard Application View -->
<<<<<<< HEAD
      <DraftDashboard
        v-if="viewMode === 'dashboard'"
        @open-draft="onOpenDraft"
      />

      <!-- Workspace Composition View -->
      <DraftWorkspace
        v-else-if="activeDraft"
        :draft="activeDraft"
        @back="onBackToDashboard"
      />
=======
      <DraftDashboard v-if="viewMode === 'dashboard'" @open-draft="onOpenDraft" />

      <!-- Workspace Composition View -->
      <DraftWorkspace v-else-if="activeDraft" :draft="activeDraft" @back="onBackToDashboard" />
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
    </div>
  </div>
</template>
