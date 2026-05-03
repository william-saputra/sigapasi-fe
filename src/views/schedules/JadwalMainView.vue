<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Settings, CalendarDays, LayoutTemplate, BookOpen, Lock } from 'lucide-vue-next'
import { getCurrentUser, isAdmin, isStaff } from '@/lib/rbac'

const user = getCurrentUser()

const canConfigure = computed(() => {
  return isAdmin() || isStaff()
})

const cards = computed(() => [
  {
    title: 'Pengaturan Slot Waktu',
    description:
      'Konfigurasi jumlah jam pelajaran, istirahat, dan durasinya untuk masing-asing jenjang.',
    icon: Settings,
    link: '/pengaturan-slot-waktu',
    color: 'emerald',
    show: canConfigure.value,
  },
  {
    title: 'Penyusunan Jadwal',
    description: 'Atur jadwal mata pelajaran pada slot waktu yang telah ditentukan.',
    icon: CalendarDays,
    link: '/penyusunan-jadwal',
    color: 'teal',
    show: canConfigure.value,
  },
  {
    title: 'Master Slot Waktu',
    description:
      'Lihat seluruh struktur slot waktu dari seluruh jenjang pendidikan dalam satu tampilan.',
    icon: LayoutTemplate,
    link: '/slot-waktu',
    color: 'sky',
    show: true,
  },
  {
    title: 'Kelola Kelas & Target Jam',
    description: 'Manajemen daftar kelas dan alokasi jam mata pelajaran untuk setiap kelas.',
    icon: BookOpen,
    link: '/jadwal/kelola-kelas',
    color: 'indigo',
    show: canConfigure.value,
  },
])

// Filter out cards the user doesn't have access to
const visibleCards = computed(() => cards.value.filter((c) => c.show))
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <div class="mx-auto max-w-[1100px] px-5 py-8">
      <!-- Header Section -->
      <div class="mb-8 border-b-2 border-gray-200 pb-4">
        <h2 class="text-3xl font-bold text-gray-800">Dashboard Jadwal</h2>
        <p class="mt-1 text-gray-500">
          Selamat datang, {{ user?.fullName || 'Pengguna' }}. Silakan pilih menu manajemen jadwal di
          bawah ini.
        </p>
      </div>

      <!-- Cards Grid -->
      <div
        v-if="visibleCards.length > 0"
        class="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        <RouterLink
          v-for="card in visibleCards"
          :key="card.link"
          :to="card.link"
          :class="`group relative flex flex-col items-start justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-2 hover:ring-${card.color}-500 overflow-hidden`"
        >
          <!-- Decorative Background Blob -->
          <div
            :class="`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-${card.color}-50 bg-opacity-50 transition-transform group-hover:scale-150`"
          ></div>

          <div class="relative z-10 w-full">
            <div
              :class="`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${card.color}-100 text-${card.color}-700 ring-4 ring-${card.color}-50`"
            >
              <component :is="card.icon" class="h-6 w-6" :stroke-width="2" />
            </div>

            <h3 class="mb-2 text-lg font-bold text-gray-900 group-hover:text-emerald-700">
              {{ card.title }}
            </h3>

            <p class="mb-6 text-sm text-gray-500 leading-relaxed">
              {{ card.description }}
            </p>
          </div>

          <!-- Bottom Action/Arrow -->
          <div
            class="relative z-10 mt-auto flex w-full items-center text-sm font-semibold text-emerald-600 transition-colors group-hover:text-emerald-800"
          >
            Akses Menu
            <!-- Arrow SVG -->
            <svg
              class="ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>
        </RouterLink>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center text-gray-500"
      >
        <span class="mb-3 text-4xl text-gray-400"><Lock class="h-12 w-12 mx-auto" /></span>
        <p class="font-semibold">Akses Terbatas</p>
        <p class="mt-1 text-sm">Anda tidak memiliki akses ke fitur manajemen jadwal.</p>
      </div>
    </div>
  </div>
</template>
