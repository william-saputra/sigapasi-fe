<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/accounts/auth.store'
import type { LoginRequest } from '@/interfaces/accounts/auth.interface'

const router = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)
const isLoading = ref(false)
const passwordError = ref('')
const emailError = ref('')

const loginData = ref<LoginRequest>({
  email: '',
  password: '',
})

const validateForm = () => {
  emailError.value = ''
  passwordError.value = ''

  let isValid = true

  const email = loginData.value.email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email) {
    emailError.value = 'Email tidak boleh kosong'
    isValid = false
  } else if (!emailRegex.test(email)) {
    emailError.value = 'Format email tidak valid (contoh: nama@email.com)'
    isValid = false
  }

  if (!loginData.value.password.trim()) {
    passwordError.value = 'Password tidak boleh kosong'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) return

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
  <div class="flex min-h-screen items-center justify-center bg-[#F7FAF7] px-4 py-12 text-slate-900">
    <div class="w-full max-w-md">
      <div class="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-100/40 sm:p-10">
        <div class="mb-8">
          <div class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Login Sistem
          </div>
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-slate-900">Masuk ke akun Anda</h2>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            Gunakan email dan kata sandi yang terdaftar untuk mengakses dashboard SIGAPASI.
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="handleLogin" novalidate>
          <div>
            <label for="email" class="mb-2 block text-sm font-medium text-slate-700"> Email </label>
            <input
              id="email"
              v-model="loginData.email"
              type="email"
              placeholder="Masukkan email"
              class="w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4"
              :class="emailError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'"
            />
            <p v-if="emailError" class="mt-2 text-xs text-red-500 flex items-center gap-1">
              {{ emailError }}
            </p>
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
                class="w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4"
                :class="passwordError 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-4 flex items-center text-slate-400 transition hover:text-slate-600"
                @click="showPassword = !showPassword"
              >
                <i
                  :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
                  class="text-base"
                />
              </button>
            </div>
            <p v-if="passwordError" class="mt-2 text-xs text-red-500 flex items-center gap-1">
              {{ passwordError }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full overflow-hidden rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <div class="flex items-center justify-center gap-2">
              <i v-if="isLoading" class="fa-solid fa-circle-notch animate-spin text-white"></i>
              <span>{{ isLoading ? 'Memproses...' : 'Masuk' }}</span>
            </div>
          </button>
        </form>

        <div class="my-8 flex items-center gap-4">
          <div class="h-px flex-1 bg-slate-200" />
          <span class="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">SIGAPASI</span>
          <div class="h-px flex-1 bg-slate-200" />
        </div>

        <p class="text-center text-sm text-slate-600">
          Belum punya akun?
          <a href="#" class="font-bold text-emerald-700 transition hover:text-emerald-800">
            Hubungi Administrator
          </a>
        </p>
      </div>

      <p class="mt-8 text-center text-xs text-slate-400">
        © 2026 SIGAPASI. All rights reserved.
      </p>
    </div>
  </div>
</template>
