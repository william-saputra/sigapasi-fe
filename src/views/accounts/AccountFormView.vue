<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accounts/account.store'
import { getAuthToken, getCurrentUser } from '@/lib/auth'

interface SubjectOption {
  id: string
  name: string
  schoolLevel: string
}

interface AuthPayload {
  id?: string
  role?: string
}

function formatDateInput(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Date(value).toISOString().split('T')[0] || ''
}

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const authUser = getCurrentUser()

const isSubmitting = ref(false)
const isLoadingSubjects = ref(false)
const isLoadingDetail = ref(false)
const subjectOptions = ref<SubjectOption[]>([])
const showPassword = ref(false)

const accountId = computed(() => String(route.params.id || ''))
const isEditMode = computed(() => !!accountId.value)

const form = ref({
  id: '',
  email: '',
  fullName: '',
  password: '',
  birthdate: '',
  role: '',
  teacher: {
    employmentType: '',
    maxWeeklyHours: null as number | null,
    schoolLevel: '',
    subjectIds: [] as string[],
  },
})

const isTeacher = computed(() => form.value.role === 'TEACHER')
const maxBirthDate = computed(() => new Date().toISOString().split('T')[0])

const isAdmin = computed(() => authUser?.role === 'ADMIN')
const isOwner = computed(() => !!form.value.id && authUser?.id === form.value.id)

const filteredSubjects = computed(() => {
  if (!form.value.teacher.schoolLevel) return []
  return subjectOptions.value.filter(
    (subject) => subject.schoolLevel === form.value.teacher.schoolLevel,
  )
})

const isEmailDisabled = computed(() => isEditMode.value)
const isRoleDisabled = computed(() => isEditMode.value)

const isFullNameDisabled = computed(() => {
  if (!isEditMode.value) return false
  return !(isAdmin.value || isOwner.value)
})

const isBirthdateDisabled = computed(() => {
  if (!isEditMode.value) return false
  return !(isAdmin.value || isOwner.value)
})

const isPasswordDisabled = computed(() => {
  if (!isEditMode.value) return false
  return !isOwner.value
})

const isTeacherFieldDisabled = computed(() => {
  if (!isEditMode.value) return false
  return !isAdmin.value
})

function togglePassword() {
  if (isPasswordDisabled.value) return
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

async function loadSubjects() {
  isLoadingSubjects.value = true
  try {
    const result = await accountStore.fetchSubjects()
    subjectOptions.value = Array.isArray(result) ? result : []
  } finally {
    isLoadingSubjects.value = false
  }
}

async function loadSubjectsBySchoolLevel() {
  if (!form.value.teacher.schoolLevel) {
    form.value.teacher.subjectIds = []
    return
  }

  if (subjectOptions.value.length === 0) {
    await loadSubjects()
  }

  const validIds = filteredSubjects.value.map((subject) => subject.id)
  form.value.teacher.subjectIds = form.value.teacher.subjectIds.filter((id) =>
    validIds.includes(id),
  )
}

async function loadAccountDetail() {
  if (!isEditMode.value) return

  isLoadingDetail.value = true
  try {
    const result = await accountStore.getProfileById(accountId.value)
    if (!result) return

    form.value.id = result.id ?? ''
    form.value.email = result.email ?? ''
    form.value.fullName = result.fullName ?? ''
    form.value.password = ''
    form.value.birthdate = formatDateInput(result.birthdate)
    form.value.role = result.role ?? ''

    if (result.role === 'TEACHER' && result.teacher) {
      await loadSubjects()

      form.value.teacher.employmentType = result.teacher.employmentType ?? ''
      form.value.teacher.maxWeeklyHours = result.teacher.maxWeeklyHours ?? null
      form.value.teacher.schoolLevel = result.teacher.schoolLevel ?? ''

      form.value.teacher.subjectIds = subjectOptions.value
        .filter((subject) =>
          (result.teacher.subjects ?? []).includes(subject.name),
        )
        .map((subject) => subject.id)
    }
  } finally {
    isLoadingDetail.value = false
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
    if (isEditMode.value) {
      const payload: any = {
        user: {
          id: form.value.id,
          fullName: form.value.fullName,
          birthdate: form.value.birthdate,
        },
      }

      if (isOwner.value && form.value.password) {
        payload.user.password = form.value.password
      }

      if (isAdmin.value && isTeacher.value) {
        payload.teacher = {
          employmentType: form.value.teacher.employmentType,
          maxWeeklyHours: Number(form.value.teacher.maxWeeklyHours),
          schoolLevel: form.value.teacher.schoolLevel,
          subjects: filteredSubjects.value
            .filter((subject) => form.value.teacher.subjectIds.includes(subject.id))
            .map((subject) => subject.name),
        }
      }

      const result = await accountStore.updateProfile(payload)

      if (result) {
        router.push('/accounts')
      }

      return
    }

    const payload: any = {
      user: {
        email: form.value.email,
        fullName: form.value.fullName,
        password: form.value.password,
        birthdate: form.value.birthdate,
        role: form.value.role,
      },
    }

    if (isTeacher.value) {
      payload.teacher = {
        employmentType: form.value.teacher.employmentType,
        maxWeeklyHours: Number(form.value.teacher.maxWeeklyHours),
        schoolLevel: form.value.teacher.schoolLevel,
        subjects: filteredSubjects.value
          .filter((subject) => form.value.teacher.subjectIds.includes(subject.id))
          .map((subject) => subject.name),
      }
    }

    const result = await accountStore.createProfile(payload)
    console.log('authUser:', authUser)
console.log('isAdmin:', isAdmin.value)
console.log('isOwner:', isOwner.value)
console.log('form.id:', form.value.id)
console.log('update payload:', payload)

    if (result) {
      router.push('/accounts')
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    await loadAccountDetail()
  }
})
</script>

<template>
  <main class="create-account-page">
    <div class="create-account-container">
      <button class="back-button" type="button" @click="goBack">
        <i class="fa-solid fa-arrow-left"></i>
        Kembali
      </button>

      <div class="page-header">
        <h1 class="page-title">
          {{ isEditMode ? 'Edit Akun' : 'Tambah Akun Baru' }}
        </h1>

        <div class="header-actions">
          <button
            class="cancel-button"
            type="button"
            @click="goBack"
            :disabled="isSubmitting"
          >
            Cancel
          </button>

          <button
            class="save-button"
            type="submit"
            form="account-form"
            :disabled="isSubmitting || isLoadingDetail"
          >
            {{ isSubmitting ? 'Menyimpan...' : isEditMode ? 'Update' : 'Simpan' }}
          </button>
        </div>
      </div>

      <div class="form-card">
        <form id="account-form" class="account-form" @submit.prevent="handleSubmit">
          <div v-if="isLoadingDetail" class="helper-box">
            Memuat detail akun...
          </div>

          <template v-else>
            <div class="section-title">Informasi Akun</div>

            <div class="form-grid">
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="Email"
                  :disabled="isEmailDisabled"
                  required
                />
              </div>

              <div class="form-group">
                <label for="fullName">Nama</label>
                <input
                  id="fullName"
                  v-model="form.fullName"
                  type="text"
                  placeholder="Nama Lengkap"
                  :disabled="isFullNameDisabled"
                  required
                />
              </div>

              <div class="form-group">
                <label for="password">
                  Password
                  <span v-if="isEditMode" class="optional-text">
                    {{ isOwner ? '(isi jika ingin ganti)' : '(tidak dapat diubah)' }}
                  </span>
                </label>

                <div class="password-field">
                  <input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Password"
                    :minlength="form.password ? 8 : undefined"
                    :required="!isEditMode"
                    :disabled="isPasswordDisabled"
                  />

                  <button
                    v-if="!isPasswordDisabled"
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
                  v-model="form.birthdate"
                  type="date"
                  :max="maxBirthDate"
                  :disabled="isBirthdateDisabled"
                  required
                />
              </div>

              <div class="form-group">
                <label for="role">Role</label>
                <select
                  id="role"
                  v-model="form.role"
                  :disabled="isRoleDisabled"
                  required
                  @change="handleRoleChange"
                >
                  <option value="" disabled>Pilih role untuk akun ini</option>
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="HEAD">Head</option>
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
                    :disabled="isTeacherFieldDisabled"
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
                    :disabled="isTeacherFieldDisabled"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="schoolLevel">Jenjang Sekolah</label>
                  <select
                    id="schoolLevel"
                    v-model="form.teacher.schoolLevel"
                    :disabled="isTeacherFieldDisabled"
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
                        :disabled="isTeacherFieldDisabled"
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cancel-button {
  padding: 12px 24px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #ffffff;
  color: #475569;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.cancel-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.18);
}

.cancel-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.optional-text {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: #64748b;
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

.form-group input:disabled,
.form-group select:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.helper-text {
  font-size: 12px;
  color: #64748b;
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

</style>