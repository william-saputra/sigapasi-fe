<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accounts/account.store'
import { getCurrentUser } from '@/lib/auth'

interface SubjectOption {
  id: string
  name: string
  schoolLevel: string
}

function formatDateInput(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Date(value).toISOString().split('T')[0] || ''
}

function normalizeEmploymentType(value: string | null | undefined): string {
  if (!value) return ''

  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, '_')

  if (normalized === 'FULL_TIME') return 'FULL_TIME'
  if (normalized === 'PART_TIME') return 'PART_TIME'

  return ''
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

      form.value.teacher.employmentType = normalizeEmploymentType(result.teacher.employmentType)
      form.value.teacher.maxWeeklyHours = result.teacher.maxWeeklyHours ?? null
      form.value.teacher.schoolLevel = result.teacher.schoolLevel ?? ''

      form.value.teacher.subjectIds = subjectOptions.value
        .filter((subject) => (result.teacher.subjects ?? []).includes(subject.name))
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

      if (result && isAdmin.value) {
        router.push(`/account/${form.value.id}`)
      } else if (result && isOwner.value) {
        await router.push(`/account/${form.value.id}`)
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
      </div>

      <div class="form-card">
        <form id="account-form" @submit.prevent="handleSubmit">
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
                    {{ isOwner ? '(isi jika ingin ganti)' : '(tidak dapat mengubah)' }}
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
                    <option value="FULL_TIME">FULL TIME</option>
                    <option value="PART_TIME">PART TIME</option>
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
                    Pilih jenjang sekolah terlebih dahulu.
                  </div>
                  <div v-else-if="isLoadingSubjects" class="helper-box">
                    Memuat mata pelajaran...
                  </div>
                  <div v-else class="subjects-list">
                    <label
                      v-for="subject in filteredSubjects"
                      :key="subject.id"
                      class="subject-item"
                      :class="{ disabled: isTeacherFieldDisabled }"
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
                </div>
              </div>
            </template>
          </template>
        </form>
      </div>

      <div class="outside-actions">
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
  margin-bottom: 32px;
}

.page-title {
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
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

.form-group input,
.form-group select {
  padding: 12px 16px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #ffffff;
  font-size: 15px;
  transition: 0.2s ease;
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

.password-field {
  position: relative;
}

.password-field input {
  width: 100%;
  padding-right: 42px;
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
  padding: 12px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
}

.helper-box {
  padding: 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
}

.outside-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.cancel-button {
  padding: 12px 28px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #ffffff;
  color: #475569;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.save-button {
  padding: 12px 40px;
  border: none;
  border-radius: 12px;
  background: #4a8f5f;
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s ease;
  box-shadow: 0 4px 12px rgba(74, 143, 95, 0.15);
}

.save-button:hover:not(:disabled) {
  background: #2d5f3f;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(74, 143, 95, 0.25);
}

.cancel-button:hover:not(:disabled) {
  background: #f1f5f9;
}

.save-button:disabled, .cancel-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .outside-actions {
    flex-direction: column-reverse;
    gap: 12px;
  }
  .cancel-button, .save-button {
    width: 100%;
  }
}
</style>
