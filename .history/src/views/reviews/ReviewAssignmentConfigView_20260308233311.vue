<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/common/AppLayout.vue'
import PageHeader from '@/components/header/PageHeader.vue'
import apiService from '@/services/api.service'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const periodId = route.params.periodId as string
const teacherId = route.params.teacherId as string
// Passed as query params to avoid an extra fetch
const teacherName = (route.query.teacherName as string) ?? '...'
const semesterName = (route.query.semesterName as string) ?? '...'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewerCandidate = {
  id: string
  fullName: string
  email: string
  role: string
}

// ─── Reviewer Candidates ──────────────────────────────────────────────────────

const reviewers = ref<ReviewerCandidate[]>([])
const isLoadingReviewers = ref(false)

async function fetchReviewers() {
  isLoadingReviewers.value = true
  try {
    reviewers.value = await apiService.get<ReviewerCandidate[]>(
      `/teachers/reviewers?exclude_id=${teacherId}`,
    )
  } catch {
    toast.error('Gagal memuat daftar guru. Pastikan server berjalan.')
  } finally {
    isLoadingReviewers.value = false
  }
}

onMounted(fetchReviewers)

// ─── Form State ───────────────────────────────────────────────────────────────

const selectedSuperiorId = ref<string>('')
const selectedPeerIds = ref<string[]>([])
const isSubmitting = ref(false)

// ─── Peer Search ──────────────────────────────────────────────────────────────

const peerSearch = ref('')

const filteredPeers = computed(() => {
  // Peers cannot be the selected superior
  const base = reviewers.value.filter((r) => r.id !== selectedSuperiorId.value)
  if (!peerSearch.value.trim()) return base
  return base.filter((r) => r.fullName.toLowerCase().includes(peerSearch.value.toLowerCase()))
})

// When superior changes, remove from peer selection if already picked
function onSuperiorChange() {
  selectedPeerIds.value = selectedPeerIds.value.filter((id) => id !== selectedSuperiorId.value)
}

function isPeerSelected(id: string): boolean {
  return selectedPeerIds.value.includes(id)
}

function togglePeer(id: string) {
  const idx = selectedPeerIds.value.indexOf(id)
  if (idx >= 0) {
    selectedPeerIds.value.splice(idx, 1)
  } else {
    selectedPeerIds.value.push(id)
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

const errors = ref<{ superior: boolean; peers: boolean }>({ superior: false, peers: false })

function validate(): boolean {
  errors.value.superior = !selectedSuperiorId.value
  errors.value.peers = selectedPeerIds.value.length === 0
  return !errors.value.superior && !errors.value.peers
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function submit() {
  if (!validate()) return

  isSubmitting.value = true
  try {
    // POST /api/reviews/assignments — AssignReviewerRequestDTO
    await apiService.post('/reviews/assignments', {
      periodId,
      targetTeacherId: teacherId,
      superiorId: selectedSuperiorId.value,
      peerIds: selectedPeerIds.value,
    })
    toast.success(`Penilai untuk ${teacherName} berhasil disimpan & dipublish.`)
    router.push({
      name: 'reviews-period-detail',
      params: { periodId },
      query: { semesterName },
    })
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 409) {
      toast.error('Penilai untuk guru ini sudah pernah dikonfigurasi.')
    } else if (status === 400) {
      toast.error('Data tidak valid. Periksa pilihan superior dan peer.')
    } else {
      toast.error('Gagal menyimpan konfigurasi penilai. Silakan coba lagi.')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AppLayout>
    <!-- Back Navigation -->
    <div class="back-nav">
      <button
        class="btn-back"
        @click="router.push({ name: 'reviews-period-detail', params: { periodId }, query: { semesterName } })"
      >
        ← Kembali ke Daftar Guru
      </button>
    </div>

    <PageHeader title="Manajemen 360 Review" subtitle="Kelola periode evaluasi dan pantau guru.">
      <template #actions>
        <div class="mode-badge">⚙️ Mode: Staff/Admin</div>
      </template>
    </PageHeader>

    <!-- Two-column layout -->
    <div class="config-layout">
      <!-- Left: Configuration Form -->
      <div class="config-card">
        <div class="config-card__header">
          <h3 class="config-card__title">Konfigurasi Penilai</h3>
          <p class="config-card__subtitle">
            Atur siapa yang menilai <strong>{{ teacherName }}</strong>.
          </p>
        </div>

        <div class="config-card__body">
          <!-- Loading -->
          <div v-if="isLoadingReviewers" class="loading-state">
            <span>⏳ Memuat daftar guru...</span>
          </div>

          <template v-else>
            <!-- Superior Dropdown -->
            <div class="form-group">
              <label class="form-label">
                Pilih Superior (Atasan)
                <span class="required-star">*</span>
              </label>
              <select
                v-model="selectedSuperiorId"
                class="form-control"
                :class="{ 'is-invalid': errors.superior }"
                @change="onSuperiorChange"
              >
                <option value="" disabled>— Pilih Superior —</option>
                <option v-for="r in reviewers" :key="r.id" :value="r.id">
                  {{ r.fullName }} ({{ r.role }})
                </option>
              </select>
              <div v-if="errors.superior" class="error-message">
                Superior wajib dipilih.
              </div>
            </div>

            <!-- Peer Checklist -->
            <div class="form-group">
              <label class="form-label">
                Pilih Peer (Rekan Sejawat)
                <span class="required-star">*</span>
                <span class="hint-text">– min. 1</span>
              </label>

              <!-- Peer search -->
              <input
                v-model="peerSearch"
                type="text"
                class="form-control peer-search"
                placeholder="Cari guru..."
              />

              <div class="peer-list" :class="{ 'is-invalid': errors.peers }">
                <div v-if="filteredPeers.length === 0" class="peer-empty">
                  {{ peerSearch ? 'Tidak ada hasil pencarian.' : 'Tidak ada guru tersedia.' }}
                </div>
                <label
                  v-for="peer in filteredPeers"
                  :key="peer.id"
                  class="peer-item"
                  :class="{ 'peer-item--selected': isPeerSelected(peer.id) }"
                >
                  <input
                    type="checkbox"
                    class="peer-checkbox"
                    :checked="isPeerSelected(peer.id)"
                    @change="togglePeer(peer.id)"
                  />
                  <div class="peer-info">
                    <span class="peer-name">{{ peer.fullName }}</span>
                    <span class="peer-role">{{ peer.role }}</span>
                  </div>
                </label>
              </div>
              <div v-if="errors.peers" class="error-message">
                Pilih minimal 1 guru sebaya.
              </div>
            </div>

            <!-- Submit -->
            <button
              type="button"
              class="btn-publish"
              :disabled="isSubmitting"
              @click="submit"
            >
              {{ isSubmitting ? 'Menyimpan...' : '📤 Simpan & Publish' }}
            </button>
          </template>
        </div>
      </div>

      <!-- Right: System Note -->
      <div class="note-card">
        <div class="note-card__icon">ℹ</div>
        <h4 class="note-card__title">Catatan Sistem</h4>
        <p class="note-card__body">
          Setelah tombol <strong>Publish</strong> ditekan, akses form evaluasi akan terbuka
          untuk penilai yang dipilih.
        </p>
        <ul class="note-card__list">
          <li>
            <strong>Superior</strong> yang dipilih akan mendapatkan akses form untuk menilai guru
            sebagai atasan.
          </li>
          <li>
            <strong>Peer</strong> yang dipilih akan mendapatkan akses form untuk menilai guru
            sebagai rekan sejawat.
          </li>
          <li>Guru yang bersangkutan akan melakukan <strong>penilaian mandiri</strong> (self-review).</li>
          <li>Konfigurasi ini tidak dapat diubah setelah dipublish.</li>
        </ul>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* ── Back Navigation ─────────────────────────────────────────────────────── */
.back-nav {
  margin-bottom: 16px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dark);
  cursor: pointer;
  font-family: var(--font);
  transition: background 0.15s, border-color 0.15s;
}

.btn-back:hover {
  background: var(--bg-light);
  border-color: #c5cdd6;
}

/* ── Mode Badge ──────────────────────────────────────────────────────────── */
.mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #fffbeb;
  border: 1px solid #d97706;
  color: #92400e;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

/* ── Two-column Layout ───────────────────────────────────────────────────── */
.config-layout {
  display: grid;
  grid-template-columns: 1fr 0.75fr;
  gap: 24px;
  align-items: start;
}

/* ── Config Card (Left) ──────────────────────────────────────────────────── */
.config-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.config-card__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
}

.config-card__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 4px;
}

.config-card__subtitle {
  font-size: 13px;
  color: var(--text-grey);
  margin: 0;
}

.config-card__body {
  padding: 20px 24px 24px;
}

/* ── Note Card (Right) ───────────────────────────────────────────────────── */
.note-card {
  background: #fdf8ec;
  border: 1px solid #e8d9a0;
  border-radius: 12px;
  padding: 20px 24px;
}

.note-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #d4a017;
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
}

.note-card__title {
  font-size: 14px;
  font-weight: 700;
  color: #7a5c00;
  margin: 0 0 10px;
}

.note-card__body {
  font-size: 13px;
  color: #63500a;
  line-height: 1.6;
  margin: 0 0 12px;
}

.note-card__list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #63500a;
  line-height: 1.8;
}

/* ── Form Elements ───────────────────────────────────────────────────────── */
.loading-state {
  padding: 24px 0;
  font-size: 14px;
  color: var(--text-grey);
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.required-star {
  color: var(--danger-text);
  margin-left: 2px;
}

.hint-text {
  font-weight: 400;
  color: var(--text-grey);
  font-size: 12px;
}

.form-control {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-family: var(--font);
  color: var(--text-dark);
  background: white;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  appearance: auto;
}

.form-control:focus {
  border-color: var(--primary);
}

.form-control.is-invalid {
  border-color: var(--danger-text);
}

/* ── Peer Checklist ──────────────────────────────────────────────────────── */
.peer-search {
  margin-bottom: 8px;
  appearance: none;
}

.peer-list {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  max-height: 220px;
  overflow-y: auto;
  transition: border-color 0.15s;
}

.peer-list.is-invalid {
  border-color: var(--danger-text);
}

.peer-empty {
  padding: 16px 14px;
  font-size: 13px;
  color: var(--text-grey);
  text-align: center;
}

.peer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid var(--border);
}

.peer-item:last-child {
  border-bottom: none;
}

.peer-item:hover {
  background: var(--bg-light);
}

.peer-item--selected {
  background: #f0faf4;
}

.peer-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
  cursor: pointer;
  flex-shrink: 0;
}

.peer-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.peer-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.peer-role {
  font-size: 12px;
  color: var(--text-grey);
}

/* ── Error Message ───────────────────────────────────────────────────────── */
.error-message {
  margin-top: 6px;
  font-size: 12px;
  color: var(--danger-text);
}

/* ── Publish Button ──────────────────────────────────────────────────────── */
.btn-publish {
  display: block;
  width: 100%;
  padding: 12px 20px;
  background: var(--primary);
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font);
  color: white;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.15s;
  letter-spacing: 0.01em;
}

.btn-publish:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-publish:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
