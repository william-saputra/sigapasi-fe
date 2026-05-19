<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ValidationSummary } from '@/interfaces/schedules/schedule.types'
import BaseModal from '@/components/common/BaseModal.vue'
import { AlertTriangle, CheckCircle, Loader } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  summary: ValidationSummary | null
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const selectedClassId = ref<string | null>(null)

watch(
  () => props.summary,
  (newSummary) => {
    if (newSummary && newSummary.incompleteClasses.length > 0) {
      selectedClassId.value = newSummary.incompleteClasses[0]?.classId ?? null
    } else {
      selectedClassId.value = null
    }
  },
  { immediate: true }
)

const selectedClass = computed(() => {
  if (!props.summary || !selectedClassId.value) return null
  return props.summary.incompleteClasses.find((c) => c.classId === selectedClassId.value) || null
})
</script>

<template>
  <BaseModal :show="show" :max-width-class="'max-w-4xl'" @close="emit('cancel')">
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
      <div v-else-if="summary.incompleteClasses.length > 0" class="flex h-[400px] overflow-hidden rounded-xl border border-gray-200">
        <!-- Sisi Kiri: List Kelas -->
        <div class="w-1/3 overflow-y-auto border-r border-gray-200 bg-gray-50">
          <div
            v-for="cls in summary.incompleteClasses"
            :key="cls.classId"
            @click="selectedClassId = cls.classId"
            class="cursor-pointer border-b border-gray-100 p-4 transition hover:bg-gray-100 flex items-center justify-between"
            :class="[
              selectedClassId === cls.classId ? (cls.isFeasible === false ? 'bg-red-50 border-l-4 border-l-red-500' : 'bg-amber-50 border-l-4 border-l-amber-500') : 'border-l-4 border-l-transparent bg-white',
            ]"
          >
            <span class="font-bold truncate pr-2" :class="cls.isFeasible === false ? 'text-red-800' : 'text-amber-800'">
              {{ cls.className }}
            </span>
            <span v-if="cls.isFeasible === false" class="shrink-0 text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Kapasitas Kurang</span>
            <span v-else class="shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{{ cls.missingSubjects.length }} Mapel Kurang</span>
          </div>
        </div>

        <!-- Sisi Kanan: Detail Mapel -->
        <div class="flex-1 overflow-y-auto bg-white p-6">
          <template v-if="selectedClass">
            <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', selectedClass.isFeasible === false ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600']">
                <AlertTriangle class="h-5 w-5" />
              </div>
              <div>
                <h4 class="text-lg font-bold text-gray-800">{{ selectedClass.className }}</h4>
                <p class="text-xs text-gray-500">
                  <template v-if="selectedClass.isFeasible === false">Detail Peringatan Kelas</template>
                  <template v-else>Daftar Mata Pelajaran yang Belum Terpenuhi</template>
                </p>
              </div>
            </div>

            <div v-if="selectedClass.isFeasible === false" class="rounded-lg border border-red-200 bg-red-50 p-4">
              <h5 class="mb-2 font-bold text-red-800">Kapasitas Waktu Tidak Mencukupi</h5>
              <p class="text-sm text-red-700">
                Total target jam pelajaran untuk kelas ini melebihi batas fisik ketersediaan slot waktu sebesar <b class="font-extrabold">{{ selectedClass.deficit }} Jam Pelajaran</b>.
              </p>
              <p class="mt-3 text-xs font-medium text-red-600">
                Solusi: Silakan kurangi target jam pelajaran pada Master Target atau tambahkan ketersediaan slot waktu.
              </p>
            </div>

            <div v-else>
              <ul v-if="selectedClass.missingSubjects.length > 0" class="space-y-2">
                <li
                  v-for="subj in selectedClass.missingSubjects"
                  :key="subj.subjectName"
                  class="flex items-center justify-between rounded-lg border border-amber-100 bg-white p-3 shadow-sm"
                >
                  <div class="flex items-center gap-2 min-w-0 flex-1 pr-3">
                    <span class="h-2 w-2 shrink-0 rounded-full bg-amber-400"></span>
                    <span class="font-semibold text-gray-800 truncate" :title="subj.subjectName">{{ subj.subjectName }}</span>
                  </div>
                  <span class="shrink-0 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 whitespace-nowrap">
                    Kurang {{ subj.missingHours }} JP
                  </span>
                </li>
              </ul>
              <div v-else class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-amber-800">
                <p class="text-sm font-medium">Terdapat kekurangan Jam Pelajaran pada kelas ini.</p>
                <p class="mt-1 text-xs">(Rincian mata pelajaran tidak tersedia)</p>
              </div>
            </div>
          </template>
          <div v-else class="flex h-full items-center justify-center text-center text-gray-400">
            <div>
              <AlertTriangle class="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p class="text-sm">Pilih kelas di sebelah kiri untuk melihat detail.</p>
            </div>
          </div>
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
