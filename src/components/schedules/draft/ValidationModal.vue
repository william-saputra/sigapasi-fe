<script setup lang="ts">
import type { ValidationSummary } from '@/interfaces/schedules/schedule.types'
import BaseModal from '@/components/common/BaseModal.vue'
import { AlertTriangle, CheckCircle, Loader } from 'lucide-vue-next'

defineProps<{
  show: boolean
  summary: ValidationSummary | null
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <BaseModal :show="show" :max-width-class="'max-w-3xl'" @close="emit('cancel')">
    <template #header>
      <div class="mb-4 flex justify-center">
        <template v-if="summary === null">
          <Loader class="h-12 w-12 animate-spin text-emerald-600" stroke-width="1.5" />
        </template>
        <template v-else-if="summary.incompleteClasses.length === 0">
          <CheckCircle class="h-12 w-12 text-green-500" stroke-width="1.5" />
        </template>
        <template v-else>
          <AlertTriangle class="h-12 w-12 text-amber-500" stroke-width="1.5" />
        </template>
      </div>
      <h3 class="mb-2 text-lg font-bold text-gray-800">
        {{ summary === null ? 'Memvalidasi...' : 'Validasi Jadwal' }}
      </h3>
      <p v-if="summary && summary.incompleteClasses.length > 0" class="text-sm text-gray-500">
        Terdapat <span class="font-bold text-red-600">{{ summary.totalClasses - summary.completeCount }} kelas</span> yang belum memenuhi target jam pelajaran.
      </p>
      <p v-else-if="summary" class="text-sm text-gray-500">
        Seluruh {{ summary.totalClasses }} kelas telah lengkap.
      </p>
    </template>
    <template #body>
      <div v-if="summary === null" class="py-8 text-center">
        <p class="text-sm text-gray-500">Memeriksa kelengkapan jadwal seluruh kelas...</p>
      </div>
      <div v-else-if="summary.incompleteClasses.length > 0" class="max-h-64 overflow-y-auto text-left">
        <div
          v-for="cls in summary.incompleteClasses"
          :key="cls.classId"
          class="mb-4 rounded-lg p-3"
          :class="cls.isFeasible === false ? 'border border-red-200 bg-red-50' : 'border border-amber-200 bg-amber-50'"
        >
          <div class="mb-2 flex items-center gap-2">
            <AlertTriangle :class="cls.isFeasible === false ? 'h-4 w-4 text-red-600' : 'h-4 w-4 text-amber-600'" />
            <span :class="cls.isFeasible === false ? 'font-bold text-red-800' : 'font-semibold text-amber-800'">{{ cls.className }}</span>
          </div>
          <template v-if="cls.isFeasible === false">
            <ul class="list-disc space-y-1 pl-6 text-xs text-red-800">
              <li><b>Kapasitas Waktu Tidak Mencukupi</b></li>
              <li>Total target melebihi batas fisik sebesar <b>{{ cls.deficit }}</b> Jam Pelajaran</li>
            </ul>
          </template>
          <ul v-else class="list-disc space-y-1 pl-6 text-xs text-amber-800">
            <li v-for="subj in cls.missingSubjects" :key="subj.subjectName">
              <span class="font-semibold">{{ subj.subjectName }}</span>: kurang {{ subj.missingHours }} Jam Pelajaran
            </li>
            <li v-if="cls.missingSubjects.length === 0">
              Terdapat kekurangan Jam Pelajaran (Rincian tidak tersedia)
            </li>
          </ul>
        </div>
      </div>
      <div v-else class="py-4 text-center text-sm text-gray-600">
        <p>Seluruh kelas telah lengkap sesuai target kurikulum.</p>
        <p class="mt-1">Anda dapat menutup workspace penjadwalan.</p>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-center gap-3 pt-3">
        <button
          class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          @click="emit('cancel')"
        >
          Kembali
        </button>
        <button
          :class="[
            'rounded-lg px-6 py-2 text-sm font-bold text-white transition',
            summary && summary.incompleteClasses.length > 0
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-emerald-800 hover:bg-emerald-900',
          ]"
          @click="emit('confirm')"
        >
          {{ summary && summary.incompleteClasses.length > 0 ? 'Simpan' : 'Lanjutkan' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
