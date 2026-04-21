<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/accounts/auth.store'
import type { LoginRequest } from '@/interfaces/accounts/auth.interface'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)
const isLoading = ref(false)

const loginData = ref<LoginRequest>({
  email: '',
  password: '',
})

const handleLogin = async () => {
  try {
    isLoading.value = true
    await authStore.login(loginData.value)

    if (!authStore.error) {
      router.push('/home')
    }
  } catch (error) {
    console.error('Login gagal:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="flex h-[90vh] items-center justify-center overflow-hidden bg-[#F7FAF7] text-slate-900"
  >
    <div class="w-full max-w-md">
      <div
        class="rounded-[32px] border border-emerald-100 bg-white p-9 shadow-xl shadow-emerald-100/40 sm:p-10"
      >
        <div class="mb-8">
          <div class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Login Sistem
          </div>
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-slate-900">Masuk ke akun Anda</h2>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            Gunakan email dan kata sandi yang terdaftar untuk mengakses dashboard SIGAPASI.
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="mb-2 block text-sm font-medium text-slate-700"> Email </label>
            <input
              id="email"
              v-model="loginData.email"
              type="email"
              placeholder="Masukkan email"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between gap-3">
              <label for="password" class="block text-sm font-medium text-slate-700">
                Kata Sandi
              </label>
              <a
                href="#"
                class="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
              >
                Lupa password?
              </a>
            </div>

            <div class="relative">
              <input
                id="password"
                v-model="loginData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Masukkan kata sandi"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-4 my-auto text-slate-400 transition hover:text-slate-600"
                @click="showPassword = !showPassword"
              >
                <i
                  :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
                  class="text-base"
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {{ isLoading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>

        <div class="my-6 flex items-center gap-4">
          <div class="h-px flex-1 bg-slate-200" />
          <span class="text-xs font-medium uppercase tracking-[0.2em] text-slate-400"
            >SIGAPASI</span
          >
          <div class="h-px flex-1 bg-slate-200" />
        </div>

        <p class="text-center text-sm text-slate-600">
          Belum punya akun?
          <a href="#" class="font-medium text-emerald-700 transition hover:text-emerald-800">
            Hubungi Administrator
          </a>
        </p>
      </div>

      <p class="mt-5 text-center text-xs text-slate-400">© 2026 SIGAPASI. All rights reserved.</p>
    </div>
  </div>
</template>
