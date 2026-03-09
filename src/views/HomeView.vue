<script setup lang="ts">

const features = [
  {
    title: "Penyusunan Jadwal",
    icon: "fa-solid fa-calendar-days",
    description:
      "Susun jadwal pelajaran dengan conflict checker, status draft, dan alur approval yang terstruktur.",
  },
  {
    title: "Manajemen Cuti Guru",
    icon: "fa-solid fa-calendar-minus",
    description:
      "Ajukan, tinjau, dan setujui cuti guru secara digital dengan alur yang jelas dan terdokumentasi.",
  },
  {
    title: "Guru Pengganti",
    icon: "fa-solid fa-user-clock",
    description:
      "Temukan guru pengganti yang tersedia untuk menjaga KBM tetap berjalan tanpa slot kosong.",
  },
  {
    title: "360 Review",
    icon: "fa-solid fa-clipboard-check",
    description:
      "Lakukan evaluasi guru dari self, peer, dan superior untuk hasil yang lebih objektif.",
  },
]

const stats = [
  { label: "Role Utama", value: "4" },
  { label: "Proses Bisnis", value: "10" },
  { label: "Fitur Inti", value: "15" },
]

const roles = [
  ["Admin", "Kelola akun, hak akses, dan data pengguna sistem."],
  ["Staff Kurikulum", "Susun jadwal, atur slot waktu, dan tugaskan guru pengganti."],
  ["Kepala Sekolah", "Tinjau approval jadwal, cuti, dan evaluasi hasil review."],
  ["Guru", "Lihat jadwal, isi ketersediaan, ajukan cuti, dan lakukan review."],
]

</script>

<template>
  <div class="min-h-screen bg-[#F7FAF7] text-slate-900">
    <main>

      <!-- Hero Section -->
      <section class="relative pt-28 lg:pt-32 pb-16 lg:pb-20">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-100/40 via-transparent to-amber-100/40"></div>
        <div class="relative mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-18">
          <div>
            <div class="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm text-emerald-800 shadow-sm">
              Operasional Penjadwalan Guru dan Evaluasi
            </div>
            <div class="flex flex-col gap-3">
              <h1 class="text-4xl font-bold leading-tight lg:text-6xl">
                Selamat datang di
                <span class="text-emerald-700">SIGAPASI</span>
              </h1>
              <p class="max-w-2xl text-base leading-7 text-slate-600 lg:text-lg">
                Sistem informasi untuk mengelola jadwal, cuti, guru pengganti, dan evaluasi guru secara lebih cepat, rapi, dan terpusat.
              </p>
            </div>

            <div class="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="item in stats"
                :key="item.label"
                class="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm"
              >
                <div class="text-2xl font-bold text-emerald-700">{{ item.value }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ item.label }}</div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      <!-- Features Section -->
      <section id="fitur" class="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12 mt-10">
        <div class="mb-8 max-w-2xl">
          <div class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Fitur Utama</div>
          <h2 class="mt-2 text-3xl font-bold tracking-tight">Satu beranda untuk proses akademik dan SDM guru</h2>
          <p class="mt-3 text-slate-600">
            Dirancang untuk mengurangi pekerjaan manual, menghindari bentrok jadwal, dan membantu sekolah mengambil keputusan berbasis data.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <i :class="feature.icon"></i>
            </div>
            <h3 class="text-lg font-semibold">{{ feature.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-600">{{ feature.description }}</p>
          </div>
        </div>
      </section>

      <!-- Roles Section -->
      <section id="peran" class="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
        <div class="rounded-[32px] border border-emerald-100 bg-gradient-to-r from-emerald-700 to-emerald-800 p-8 text-white shadow-xl lg:p-12">
            <div class="mb-8">
                <div class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">Peran Pengguna</div>
                <h2 class="mt-2 text-3xl font-bold tracking-tight">Disesuaikan untuk tiap kebutuhan pengguna</h2>
            </div>

            <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div
                    v-for="([role, desc]) in roles"
                    :key="role"
                    class="rounded-3xl border-slate-200 bg-white p-6 shadow-sm bg-white/10"
                >
                    <div class="text-lg font-semibold">{{ role }}</div>
                    <p class="mt-2 text-sm text-emerald-50/80">{{ desc }}</p>
                </div>
            </div>
        </div>
      </section>

    </main>
  </div>
</template>