<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">SIGAP</h1>
      <p class="login-subtitle">Sistem Informasi Guru dan Absensi Profesional</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="nama@sekolah.ac.id"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? 'Masuk...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push('/leaves/history')
  } catch {
    errorMsg.value = 'Email atau password salah.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-light);
}

.login-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 40px 36px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 4px;
  text-align: center;
}

.login-subtitle {
  font-size: 13px;
  color: var(--text-grey);
  text-align: center;
  margin: 0 0 32px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
}

.field input {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus {
  border-color: var(--primary);
}

.error-msg {
  font-size: 13px;
  color: #DC2626;
  margin: 0;
}

.login-btn {
  padding: 10px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.login-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
