<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  show: boolean
  scheduleId: string | null
}>()

const emit = defineEmits<{
<<<<<<< HEAD
  'close': []
  'submit': [payload: { status: string, revisionNote: string | null }]
=======
  close: []
  submit: [payload: { status: string; revisionNote: string | null }]
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
}>()

const actionType = ref<'APPROVE' | 'REJECT' | null>(null)
const revisionNote = ref('')

function reset() {
  actionType.value = null
  revisionNote.value = ''
  emit('close')
}

function handleApprove() {
  emit('submit', { status: 'PUBLISHED', revisionNote: null })
  reset()
}

function handleRejectSubmit() {
  if (!revisionNote.value.trim()) return
  emit('submit', { status: 'REVISION_REQUIRED', revisionNote: revisionNote.value })
  reset()
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-xl font-bold text-gray-800">Review Jadwal</h3>
      </div>
<<<<<<< HEAD
      
=======
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
      <div class="px-6 py-6">
        <div v-if="actionType === null" class="flex flex-col gap-4">
          <p class="text-gray-600">Pilih tindakan untuk jadwal ini:</p>
          <div class="flex gap-4">
<<<<<<< HEAD
             <button 
               @click="actionType = 'APPROVE'"
               class="flex-1 rounded-xl bg-emerald-100 p-4 border border-emerald-200 hover:bg-emerald-200 transition text-emerald-800 font-bold"
             >
               <span class="block mb-2 text-2xl">✅</span>
               Setujui (Publish)
             </button>
             <button 
               @click="actionType = 'REJECT'"
               class="flex-1 rounded-xl bg-red-100 p-4 border border-red-200 hover:bg-red-200 transition text-red-800 font-bold"
             >
               <span class="block mb-2 text-2xl">❌</span>
               Tolak (Revisi)
             </button>
=======
            <button
              @click="actionType = 'APPROVE'"
              class="flex-1 rounded-xl bg-emerald-100 p-4 border border-emerald-200 hover:bg-emerald-200 transition text-emerald-800 font-bold"
            >
              <span class="block mb-2 text-2xl">✅</span>
              Setujui (Publish)
            </button>
            <button
              @click="actionType = 'REJECT'"
              class="flex-1 rounded-xl bg-red-100 p-4 border border-red-200 hover:bg-red-200 transition text-red-800 font-bold"
            >
              <span class="block mb-2 text-2xl">❌</span>
              Tolak (Revisi)
            </button>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
          </div>
        </div>

        <div v-else-if="actionType === 'APPROVE'" class="flex flex-col gap-4">
<<<<<<< HEAD
          <p class="text-gray-600">Anda yakin ingin <strong>menyetujui dan mempublikasikan</strong> jadwal ini?<br/>Tindakan ini tidak dapat dibatalkan dan draf tidak akan bisa dimodifikasi lagi.</p>
          <div class="flex justify-end gap-3 mt-4">
            <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition" @click="actionType = null">Kembali</button>
            <button class="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition" @click="handleApprove">Ya, Publikasikan</button>
=======
          <p class="text-gray-600">
            Anda yakin ingin <strong>menyetujui dan mempublikasikan</strong> jadwal ini?<br />Tindakan
            ini tidak dapat dibatalkan dan draf tidak akan bisa dimodifikasi lagi.
          </p>
          <div class="flex justify-end gap-3 mt-4">
            <button
              class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              @click="actionType = null"
            >
              Kembali
            </button>
            <button
              class="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
              @click="handleApprove"
            >
              Ya, Publikasikan
            </button>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
          </div>
        </div>

        <div v-else-if="actionType === 'REJECT'" class="flex flex-col gap-4">
          <p class="text-gray-600">Berikan catatan revisi untuk staf:</p>
<<<<<<< HEAD
          <textarea 
            v-model="revisionNote" 
            rows="4" 
            class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            placeholder="Tuliskan alasan penolakan atau bagian yang perlu direvisi..."
          ></textarea>
          <div class="flex justify-end gap-3 mt-4">
            <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition" @click="actionType = null">Kembali</button>
            <button 
              class="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-50" 
=======
          <textarea
            v-model="revisionNote"
            rows="4"
            class="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Tuliskan alasan penolakan atau bagian yang perlu direvisi..."
          ></textarea>
          <div class="flex justify-end gap-3 mt-4">
            <button
              class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              @click="actionType = null"
            >
              Kembali
            </button>
            <button
              class="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-50"
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
              :disabled="!revisionNote.trim()"
              @click="handleRejectSubmit"
            >
              Kirim Revisi
            </button>
          </div>
        </div>
      </div>
<<<<<<< HEAD
      
      <div v-if="actionType === null" class="px-6 py-4 bg-gray-50 flex justify-end">
        <button class="px-4 py-2 rounded-lg text-gray-600 font-semibold hover:bg-gray-200 transition" @click="reset">Batal</button>
=======

      <div v-if="actionType === null" class="px-6 py-4 bg-gray-50 flex justify-end">
        <button
          class="px-4 py-2 rounded-lg text-gray-600 font-semibold hover:bg-gray-200 transition"
          @click="reset"
        >
          Batal
        </button>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
      </div>
    </div>
  </div>
</template>
