<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accounts/account.store'

interface SubjectOption {
  id: string
  name: string
  schoolLevel: string
}

const router = useRouter()
const accountStore = useAccountStore()

const isSubmitting = ref(false)
const isLoadingSubjects = ref(false)
const subjectOptions = ref<SubjectOption[]>([])

const form = ref({
  email: '',
  fullName: '',
  password: '',
  birthDate: '',
  role: '',
  teacher: {
    employmentType: '',
    maxWeeklyHours: null as number | null,
    schoolLevel: '',
    subjectIds: [] as string[],
  },
})

const isTeacher = computed(() => form.value.role === 'Teacher')

const maxBirthDate = computed(() => new Date().toISOString().split('T')[0])

const filteredSubjects = computed(() => {
  if (!form.value.teacher.schoolLevel) return []
  return subjectOptions.value.filter(
    (subject) => subject.schoolLevel === form.value.teacher.schoolLevel,
  )
})

const showPassword = ref(false)

function togglePassword() {
  showPassword.value = !showPassword.value
}

function goBack() {
  router.back()
}

function resetTeacherFields() {
  form.value.teacher = {
    employmentType: '',
    maxWeeklyHours: null,
    schoolLevel: '',
    subjectIds: [],
  }
  subjectOptions.value = []
}

function handleRoleChange() {
  if (!isTeacher.value) {
    resetTeacherFields()
  }
}

async function loadSubjectsBySchoolLevel() {
  if (!form.value.teacher.schoolLevel) {
    subjectOptions.value = []
    form.value.teacher.subjectIds = []
    return
  }

  isLoadingSubjects.value = true
  form.value.teacher.subjectIds = []

  try {
    const result = await accountStore.fetchSubjects()
    subjectOptions.value = Array.isArray(result) ? result : []
  } finally {
    isLoadingSubjects.value = false
  }
}

watch(
  () => form.value.teacher.schoolLevel,
  async (newValue, oldValue) => {
    if (!isTeacher.value) return
    if (newValue === oldValue) return
    await loadSubjectsBySchoolLevel()
  },
)

async function handleSubmit() {
  if (isSubmitting.value) return

  isSubmitting.value = true

  try {
    const payload: any = {
      user: {
        email: form.value.email,
        fullName: form.value.fullName,
        password: form.value.password,
        birthdate: form.value.birthDate,
        role: form.value.role,
      },
    }

    if (isTeacher.value) {
      payload.teacher = {
        employmentType: form.value.teacher.employmentType,
        maxWeeklyHours: Number(form.value.teacher.maxWeeklyHours),
        schoolLevel: form.value.teacher.schoolLevel,
        subjects: filteredSubjects.value
          .filter((subject) =>
            form.value.teacher.subjectIds.includes(subject.id),
          )
          .map((subject) => subject.name),
      }
    }

    console.log("payload:", payload)

    const result = await accountStore.createProfile(payload)

    if (result) {
      router.push('/accounts')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="create-account-page">
    <div class="create-account-container">
      <button class="back-button" type="button" @click="goBack">
        <i class="fa-solid fa-arrow-left"></i>
        Kembali
      </button>

      <div class="page-header">
        <h1 class="page-title">Tambah Akun Baru</h1>

        <button
          class="save-button"
          type="button"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>

      <div class="form-card">
        <form class="account-form" @submit.prevent="handleSubmit">
          <div class="section-title">Informasi Akun</div>

          <div class="form-grid">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="Masukkan email pengguna"
                required
              />
            </div>

            <div class="form-group">
              <label for="fullName">Nama</label>
              <input
                id="fullName"
                v-model="form.fullName"
                type="text"
                placeholder="Masukkan nama pengguna"
                required
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="password-field">
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password pengguna"
                  minlength="8"
                  required
                />

                <button
                  type="button"
                  class="toggle-password"
                  @click="togglePassword"
                >
                  <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="birthDate">Tanggal Lahir</label>
              <input
                id="birthDate"
                v-model="form.birthDate"
                type="date"
                :max="maxBirthDate"
                required
              />
            </div>

            <div class="form-group">
              <label for="role">Role</label>
              <select
                id="role"
                v-model="form.role"
                required
                @change="handleRoleChange"
              >
                <option value="" disabled>Pilih role untuk akun ini</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
                <option value="Teacher">Teacher</option>
                <option value="Head">Head</option>
              </select>
            </div>
          </div>

          <template v-if="isTeacher">
            <div class="section-title teacher-section-title">Informasi Teacher</div>

            <div class="form-grid">
              <div class="form-group">
                <label for="employmentType">Employment Type</label>
                <select
                  id="employmentType"
                  v-model="form.teacher.employmentType"
                  required
                >
                  <option value="" disabled>Pilih employment type</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div class="form-group">
                <label for="maxWeeklyHours">Maksimal Jam per Minggu</label>
                <input
                  id="maxWeeklyHours"
                  v-model.number="form.teacher.maxWeeklyHours"
                  type="number"
                  min="1"
                  placeholder="Contoh: 24"
                  required
                />
              </div>

              <div class="form-group">
                <label for="schoolLevel">Jenjang Sekolah</label>
                <select
                  id="schoolLevel"
                  v-model="form.teacher.schoolLevel"
                  required
                >
                  <option value="" disabled>Pilih jenjang sekolah</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                </select>
              </div>

              <div class="form-group form-group-full">
                <label for="subjects">Mata Pelajaran</label>

                <div v-if="!form.teacher.schoolLevel" class="helper-box">
                  Pilih jenjang sekolah terlebih dahulu untuk memuat mata pelajaran.
                </div>

                <div v-else-if="isLoadingSubjects" class="helper-box">
                  Memuat mata pelajaran...
                </div>

                <div v-else-if="filteredSubjects.length === 0" class="helper-box">
                  Tidak ada mata pelajaran untuk jenjang ini.
                </div>

                <div v-else class="subjects-list">
                  <label
                    v-for="subject in filteredSubjects"
                    :key="subject.id"
                    class="subject-item"
                  >
                    <input
                      v-model="form.teacher.subjectIds"
                      type="checkbox"
                      :value="subject.id"
                    />
                    <span>{{ subject.name }}</span>
                  </label>
                </div>

                <small class="helper-text">
                  Pilih satu atau lebih mata pelajaran sesuai jenjang sekolah.
                </small>
              </div>
            </div>
          </template>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
.create-account-page {
  min-height: 100vh;
  background: #f7faf7;
}

.create-account-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 56px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 15px;
  cursor: pointer;
  transition: 0.2s ease;
}

.back-button:hover {
  color: #334155;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.page-title {
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
}

.save-button {
  padding: 12px 32px;
  border: none;
  border-radius: 12px;
  background: #4a8f5f;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.save-button:hover {
  background: #2d5f3f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 95, 63, 0.18);
}

.save-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.form-card {
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #ffffff;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.04);
}

.section-title {
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 18px;
  font-weight: 700;
  color: #334155;
}

.teacher-section-title {
  margin-top: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #ffffff;
  font-size: 15px;
  color: #334155;
  transition: 0.2s ease;
}
.form-group select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #ffffff;
  font-size: 15px;
  color: #334155;
  transition: 0.2s ease;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background-image: url("data:image/svg+xml;utf8,<svg fill='none' stroke='%2364758b' stroke-width='2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/></svg>");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4a8f5f;
  box-shadow: 0 0 0 4px rgba(74, 143, 95, 0.12);
}

.helper-text {
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 768px) {
  .create-account-container {
    padding: 24px 16px 40px;
  }

  .page-title {
    font-size: 28px;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .save-button {
    width: 100%;
  }

  .form-card {
    padding: 24px 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

.helper-box {
  padding: 12px 14px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 14px;
  color: #64748b;
}

.subjects-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.subject-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: 0.2s ease;
}

.subject-item:hover {
  border-color: #4a8f5f;
  background: #f7fbf8;
}

.subject-item input {
  width: 16px;
  height: 16px;
  accent-color: #4a8f5f;
}

.password-field {
  position: relative;
  width: 100%;
}

.password-field input {
  width: 100%;
  padding: 12px 42px 12px 16px;
  box-sizing: border-box;
}

.toggle-password {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
}

.toggle-password:hover {
  color: #334155;
}
</style>