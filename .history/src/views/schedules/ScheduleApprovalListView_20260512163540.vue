<script setup lang="ts">
import { ref } from 'vue'
import ApprovalDashboard from '@/components/schedules/draft/ApprovalDashboardView.vue'
// import ApprovalDetail from '@/components/schedules/approval/ApprovalDetail.vue'

// Sesuaikan dengan interface DTO List dari Backend (ScheduleApprovalListResponseDTO)
import type { ScheduleApprovalListDTO } from '@/interfaces/schedules/schedule.types'
const searchQuery = ref<string>('')
const selectedStatus = ref<string>('')
// --- State ---
const viewMode = ref<'dashboard' | 'detail'>('dashboard')
const activeApproval = ref<ScheduleApprovalListDTO | null>(null)

// --- Functions ---
function onOpenDetail(approvalItem: ScheduleApprovalListDTO) {
  activeApproval.value = approvalItem
  viewMode.value = 'detail'
}

function onBackToDashboard() {
  activeApproval.value = null
  viewMode.value = 'dashboard'
}

// import ApprovalDashboard from '@/components/schedules/.vue'
import ApprovalDetail from '@/components/schedules/draft/ApprovalDetailView.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <div class="mx-auto max-w-[1400px] px-5 py-8">
<<<<<<< HEAD
      
      <ApprovalDashboard
        v-if="viewMode === 'dashboard'"
        @open-detail="onOpenDetail"
      />
=======
      <ApprovalDashboard v-if="viewMode === 'dashboard'" @open-detail="onOpenDetail" />
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6

      <ApprovalDetail
        v-else-if="activeApproval"
        :approval-data="activeApproval"
        @back="onBackToDashboard"
      />
<<<<<<< HEAD
      
    </div>
  </div>
</template>
=======
    </div>
  </div>
</template>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
