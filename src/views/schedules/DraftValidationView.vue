<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useScheduleWorkspaceStore } from '@/stores/schedules/scheduleWorkspaceStore'
import type { ClassValidationSummaryDTO } from '@/interfaces/schedules/schedule.types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const workspaceStore = useScheduleWorkspaceStore()

const draftId = computed(() => route.params.draftId as string)
const isLoading = ref(true)
const error = ref<string | null>(null)
const selectedClassFilter = ref<string>('ALL')

const validationResults = computed(() => workspaceStore.batchValidationResults)

const filteredResults = computed(() => {
  if (selectedClassFilter.value === 'ALL') {
    return validationResults.value
  }
  return validationResults.value.filter((c: any) => c.classId === selectedClassFilter.value)
})

const totalClasses = computed(() => validationResults.value.length)
const validClasses = computed(() => validationResults.value.filter((c) => c.isValid).length)
const invalidClasses = computed(() => validationResults.value.filter((c) => !c.isValid).length)

const classOptions = computed(() => {
  return validationResults.value.map((c: any) => ({
    classId: c.classId,
    className: c.className,
  }))
})

onMounted(async () => {
  isLoading.value = true
  error.value = null

  const result = await workspaceStore.fetchBatchValidation(draftId.value)

  if (!result) {
    error.value = 'Gagal memuat data validasi. Silakan coba lagi.'
    toast.error(error.value)
  } else if (result.length === 0) {
    error.value = 'Belum ada kelas dalam jadwal ini.'
  }

  isLoading.value = false
})

function onBackToDraft() {
  router.push({ name: 'penyusunan-jadwal' })
}

function onSave() {
  router.push({ name: 'penyusunan-jadwal' })
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] font-sans pb-20">
    <div class="mx-auto max-w-[1200px] px-6 py-10">
      <div class="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">Validasi Jadwal</h1>
          </div>
          <p class="text-sm font-medium text-gray-500 ml-13">
            Draft ID: <span class="font-mono text-gray-400">{{ draftId }}</span>
          </p>
        </div>

        <div class="flex gap-3 mt-4 md:mt-0">
          <button
            @click="onBackToDraft"
            class="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:text-emerald-700 transition-all"
          >
            Kembali ke Draft
          </button>
          <button
            @click="onSave"
            :disabled="isLoading"
            class="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 transition-all flex items-center gap-2"
          >
            <span>Simpan</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        v-if="isLoading"
        class="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm"
      >
        <span
          class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"
        ></span>
        <p class="mt-4 text-sm font-semibold text-gray-500 animate-pulse">
          Menghitung validasi seluruh kelas...
        </p>
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border border-red-200 bg-red-50 p-10 text-center shadow-sm"
      >
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4"
        >
          <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-red-800 mb-1">Terjadi Kesalahan</h3>
        <p class="text-red-600 text-sm mb-6">{{ error }}</p>
        <button
          @click="onBackToDraft"
          class="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-sm"
        >
          Kembali ke Draft
        </button>
      </div>

      <div v-else class="space-y-6">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div
            class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
              Total Kelas
            </div>
            <div class="text-4xl font-black text-gray-800">{{ totalClasses }}</div>
            <div class="absolute -right-4 -top-4 opacity-5 text-gray-900">
              <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"
                />
              </svg>
            </div>
          </div>

          <div
            class="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm"
          >
            <div class="text-xs font-bold uppercase tracking-widest text-emerald-600/70 mb-1">
              Jadwal Lengkap
            </div>
            <div class="text-4xl font-black text-emerald-700">{{ validClasses }}</div>
            <div class="absolute -right-4 -top-4 opacity-10 text-emerald-600">
              <svg class="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>

          <div
            class="relative overflow-hidden rounded-2xl border border-red-200 bg-red-50/50 p-6 shadow-sm"
          >
            <div class="text-xs font-bold uppercase tracking-widest text-red-600/70 mb-1">
              Belum Lengkap
            </div>
            <div class="text-4xl font-black text-red-700">{{ invalidClasses }}</div>
            <div class="absolute -right-4 -top-4 opacity-10 text-red-600">
              <svg class="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          class="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5"
                >Filter Berdasarkan Kelas</label
              >
              <select
                v-model="selectedClassFilter"
                class="block w-64 cursor-pointer appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-800 shadow-sm transition-colors hover:bg-white focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                style="
                  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
                  background-repeat: no-repeat;
                  background-position: right 1rem top 50%;
                  background-size: 0.65rem auto;
                "
              >
                <option value="ALL">Tampilkan Semua Kelas</option>
                <option v-for="cls in classOptions" :key="cls.classId" :value="cls.classId">
                  {{ cls.className }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th
                    class="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-40"
                  >
                    Kelas
                  </th>
                  <th
                    class="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-48 border-l border-gray-200"
                  >
                    Status
                  </th>
                  <th
                    class="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-l border-gray-200"
                  >
                    Rincian Mata Pelajaran Belum Tercapai
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <template v-if="filteredResults.length === 0">
                  <tr>
                    <td colspan="3" class="px-6 py-16 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center">
                        <svg
                          class="h-12 w-12 text-gray-300 mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <span class="font-medium">Tidak ada data kelas yang sesuai filter.</span>
                      </div>
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr
                    v-for="cls in filteredResults"
                    :key="cls.classId"
                    class="transition-colors hover:bg-gray-50/50"
                  >
                    <td class="px-6 py-6 align-middle text-center">
                      <div
                        class="inline-flex h-12 items-center justify-center rounded-xl bg-gray-100 px-5 text-base font-black text-gray-800"
                      >
                        {{ cls.className }}
                      </div>
                    </td>

                    <td class="px-6 py-6 align-middle text-center border-l border-gray-100">
                      <span
                        :class="[
                          'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider',
                          cls.isValid
                            ? 'bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-600/20'
                            : 'bg-red-100/80 text-red-800 ring-1 ring-red-600/20',
                        ]"
                      >
                        <span
                          v-if="cls.isValid"
                          class="h-1.5 w-1.5 rounded-full bg-emerald-600"
                        ></span>
                        <span
                          v-else
                          class="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"
                        ></span>
                        {{ cls.isValid ? 'Lengkap' : 'Belum Lengkap' }}
                      </span>
                    </td>

                    <td class="px-8 py-6 align-middle border-l border-gray-100">
                      <template v-if="cls.incompleteSubjects.length > 0">
                        <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
                          <div
                            v-for="target in cls.incompleteSubjects"
                            :key="target.subjectName"
                            class="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/40 p-3 transition-colors hover:bg-red-50"
                          >
                            <div class="flex items-center gap-3">
                              <div
                                class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white text-red-500 shadow-sm"
                              >
                                <svg
                                  class="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              </div>
                              <span class="font-semibold text-gray-700">{{
                                target.subjectName
                              }}</span>
                            </div>
                            <div class="flex flex-col items-end">
                              <span
                                class="text-xs font-bold text-red-600 bg-red-100/80 px-2 py-1 rounded-md"
                              >
                                {{ target.currentJp }} / {{ target.targetJp }} JP
                              </span>
                            </div>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="flex items-center gap-2 text-emerald-600">
                          <svg
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span class="font-semibold"
                            >Semua target jam pelajaran telah terpenuhi.</span
                          >
                        </div>
                      </template>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
