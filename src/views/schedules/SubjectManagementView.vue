<script setup lang="ts">
import { ref, computed } from 'vue'

const subjects = ref([
  { id: 1, name: 'Matematika Tingkat Lanjut', level: 'SMA' },
  { id: 2, name: 'Ilmu Pengetahuan Alam', level: 'SMP' },
  { id: 3, name: 'Tematik', level: 'SD' },
])

const activeTab = ref('Semua')
const tabs = ['Semua', 'SD', 'SMP', 'SMA']
const searchQuery = ref('')
const isModalOpen = ref(false)

const form = ref({
  id: null as number | null,
  name: '',
  level: 'SD',
})

const filteredSubjects = computed(() => {
  return subjects.value.filter((subject) => {
    const matchLevel = activeTab.value === 'Semua' || subject.level === activeTab.value
    const matchSearch = subject.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchLevel && matchSearch
  })
})

const getBadgeColor = (level: string) => {
  switch (level) {
    case 'SD':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'SMP':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'SMA':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const openModal = (subject: any = null) => {
  if (subject) {
    form.value = { ...subject }
  } else {
    form.value = { id: null, name: '', level: 'SD' }
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveSubject = () => {
  if (form.value.id) {
    const index = subjects.value.findIndex((s) => s.id === form.value.id)
    if (index !== -1) {
      subjects.value[index] = { ...(form.value as any) }
    }
  } else {
    subjects.value.push({
      id: Date.now(),
      name: form.value.name,
      level: form.value.level,
    })
  }
  closeModal()
}

const deleteSubject = (id: number) => {
  subjects.value = subjects.value.filter((s) => s.id !== id)
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] font-sans">
    <div class="mx-auto max-w-[1100px] px-5 py-8">
      <!-- Page Header & Actions -->
      <div
        class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-4"
      >
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Mata Pelajaran</h2>
          <p class="mt-1 text-gray-500">
            Kelola daftar mata pelajaran untuk setiap jenjang pendidikan.
          </p>
        </div>
        <button
          @click="openModal()"
          class="inline-flex items-center justify-center rounded-xl bg-[#014f01] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#014f01] focus:ring-offset-2"
        >
          + Tambah Mapel
        </button>
      </div>

      <!-- Filter & Search Bar -->
      <div class="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Search -->
        <div class="relative w-full sm:w-80">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari mata pelajaran..."
            class="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#014f01] sm:text-sm sm:leading-6"
          />
        </div>

        <!-- Segmented Tabs -->
        <div class="inline-flex rounded-xl bg-gray-100 p-1 w-full sm:w-auto">
          <button
            v-for="tab in tabs"
            :key="tab"
            @click="activeTab = tab"
            :class="[
              'flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            ]"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <!-- Main Data Table -->
      <div
        class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 min-h-[300px]"
      >
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                Nama Mata Pelajaran
              </th>
              <th scope="col" class="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                Jenjang
              </th>
              <th
                scope="col"
                class="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-if="filteredSubjects.length === 0">
              <td colspan="3" class="py-12 text-center text-sm text-gray-500">
                Tidak ada data mata pelajaran.
              </td>
            </tr>
            <tr
              v-for="subject in filteredSubjects"
              :key="subject.id"
              class="transition-colors hover:bg-gray-50"
            >
              <td
                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
              >
                {{ subject.name }}
              </td>
              <td class="whitespace-nowrap py-4 px-3 text-sm">
                <span
                  :class="[
                    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
                    getBadgeColor(subject.level),
                  ]"
                >
                  {{ subject.level }}
                </span>
              </td>
              <td
                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
              >
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openModal(subject)"
                    class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-[#014f01] transition-colors focus:outline-none focus:ring-2 focus:ring-[#014f01]"
                    title="Edit"
                  >
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                      />
                    </svg>
                  </button>
                  <button
                    @click="deleteSubject(subject.id)"
                    class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Hapus"
                  >
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <transition
        enter-active-class="ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isModalOpen" class="relative z-50">
          <!-- Backdrop -->
          <div
            class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            @click="closeModal"
          ></div>

          <!-- Modal Panel -->
          <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <transition
                enter-active-class="ease-out duration-300"
                enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enter-to-class="opacity-100 translate-y-0 sm:scale-100"
                leave-active-class="ease-in duration-200"
                leave-from-class="opacity-100 translate-y-0 sm:scale-100"
                leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <div
                  v-if="isModalOpen"
                  class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                >
                  <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <h3 class="text-xl font-bold leading-6 text-gray-900 mb-6">
                      {{ form.id ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran' }}
                    </h3>

                    <div class="space-y-4">
                      <div>
                        <label for="name" class="block text-sm font-medium leading-6 text-gray-900"
                          >Nama Mata Pelajaran</label
                        >
                        <div class="mt-2">
                          <input
                            v-model="form.name"
                            type="text"
                            id="name"
                            placeholder="Contoh: Fisika Terapan"
                            class="block w-full rounded-xl border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#014f01] sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div>
                        <label for="level" class="block text-sm font-medium leading-6 text-gray-900"
                          >Jenjang</label
                        >
                        <div class="mt-2">
                          <select
                            v-model="form.level"
                            id="level"
                            class="block w-full rounded-xl border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#014f01] sm:text-sm sm:leading-6"
                          >
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      @click="saveSubject"
                      class="inline-flex w-full justify-center rounded-xl bg-[#014f01] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800 sm:ml-3 sm:w-auto transition-colors focus:ring-2 focus:ring-inset focus:ring-[#014f01]"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      @click="closeModal"
                      class="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
