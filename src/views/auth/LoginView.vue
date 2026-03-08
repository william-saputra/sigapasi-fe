<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const showPassword = ref(false)

const handleSubmit = () => {
  console.log({
    email: email.value,
    password: password.value,
    rememberMe: rememberMe.value,
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#F7FAF7] text-slate-900">
    <div class="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <!-- Left Panel -->
      <section class="relative hidden overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 lg:flex">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(251,191,36,0.22),_transparent_24%)]" />

        <div class="relative flex w-full flex-col justify-between p-10 xl:p-14">
          <div>
            <div class="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
              Sistem Informasi Akademik & SDM Guru
            </div>

            <div class="mt-10 max-w-xl">
              <h1 class="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Masuk ke <span class="text-amber-300">SIGAPASI</span>
              </h1>
              <p class="mt-5 text-base leading-7 text-emerald-50/90 xl:text-lg">
                Kelola jadwal pelajaran, cuti guru, guru pengganti, dan evaluasi kinerja dalam satu sistem yang rapi, cepat, dan terpusat.
              </p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div class="text-2xl font-bold text-white">4</div>
              <div class="mt-1 text-sm text-emerald-50/80">Role Utama</div>
            </div>
            <div class="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div class="text-2xl font-bold text-white">10</div>
              <div class="mt-1 text-sm text-emerald-50/80">Proses Bisnis</div>
            </div>
            <div class="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div class="text-2xl font-bold text-white">15</div>
              <div class="mt-1 text-sm text-emerald-50/80">Fitur Inti</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Panel -->
      <section class="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div class="w-full max-w-md">
          <div class="mb-8 lg:hidden">
            <div class="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm text-emerald-800 shadow-sm">
              Selamat datang di SIGAPASI
            </div>
            <h1 class="mt-4 text-3xl font-bold leading-tight text-slate-900">
              Masuk ke akun Anda
            </h1>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              Akses sistem untuk mengelola proses akademik dan SDM guru secara terpusat.
            </p>
          </div>

          <div class="rounded-[32px] border border-emerald-100 bg-white p-7 shadow-xl shadow-emerald-100/40 sm:p-8">
            <div class="mb-8 hidden lg:block">
              <div class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Login Sistem
              </div>
              <h2 class="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Masuk ke akun Anda
              </h2>
              <p class="mt-3 text-sm leading-6 text-slate-600">
                Gunakan email dan kata sandi yang terdaftar untuk mengakses dashboard SIGAPASI.
              </p>
            </div>

            <form class="space-y-5" @submit.prevent="handleSubmit">
              <div>
                <label for="email" class="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="nama@sekolah.sch.id"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <div class="mb-2 flex items-center justify-between gap-3">
                  <label for="password" class="block text-sm font-medium text-slate-700">
                    Kata Sandi
                  </label>
                  <a href="#" class="text-sm font-medium text-emerald-700 transition hover:text-emerald-800">
                    Lupa password?
                  </a>
                </div>

                <div class="relative">
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Masukkan kata sandi"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    class="absolute inset-y-0 right-3 my-auto text-sm font-medium text-slate-500 transition hover:text-slate-700"
                    @click="showPassword = !showPassword"
                  >
                    {{ showPassword ? 'Sembunyi' : 'Lihat' }}
                  </button>
                </div>
              </div>

              <label class="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Ingat saya</span>
              </label>

              <button
                type="submit"
                class="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800"
              >
                Masuk
              </button>
            </form>

            <div class="my-6 flex items-center gap-4">
              <div class="h-px flex-1 bg-slate-200" />
              <span class="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">SIGAPASI</span>
              <div class="h-px flex-1 bg-slate-200" />
            </div>

            <div class="rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              Pastikan akun Anda sudah terdaftar oleh admin sistem sekolah sebelum login.
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
