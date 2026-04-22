# Dokumentasi Frontend: Penyusunan & Validasi Jadwal (Drag-and-Drop)

Berdasarkan dokumentasi Backend dan Requirement yang diberikan, berikut adalah panduan lengkap arsitektur dan teknis pengembangan fitur Penyusunan Jadwal dengan Drag-and-Drop di Frontend (Vue 3 / TypeScript).

## 1. Arsitektur Komponen (Views & Components)
Pembuatan jadwal akan direpresentasikan melalui satu halaman utama dan beberapa sub-komponen spesifik untuk memisahkan logika agar lebih rapi:

- **`PengaturanJadwalView.vue` (Page/View Utama)**
  - Bertugas mengelola state global halaman (seperti `class_id` yang dipilih, memilih semester aktif, dll).
  - Melakukan inisialisasi awal saat komponen dimount (memanggil API untuk mendapatkan draft jadwal yang sudah ada dan load workload guru).

- **`SchedulesSidebar.vue` (Komponen Sidebar)**
  - Menampilkan daftar Guru beserta Mata Pelajaran yang diampu dan **Indikator Beban Jam Mengajar** (Workload).
  - Berfungsi sebagai "Source" atau tempat penyedia item yang dapat ditarik (Draggable).

- **`DraggableTeacherCard.vue` (Komponen Item Drag)**
  - Mewakili satu kartu guru dan mata pelajaran di dalam Sidebar.
  - Menyematkan ID Guru dan ID Mapel ke data payload drag.

- **`ScheduleBoard.vue` (Komponen Kalender Utama)**
  - Menampilkan matriks Hari (Senin-Jumat) vs Sesi Waktu (Time Slot / Jam Pelajaran).
  - Memetakan array jam secara vertikal dan hari secara horizontal menjadi grid/flex layout.

- **`ScheduleSlot.vue` (Komponen Drop Zone)**
  - Mewakili satu kotak/sel dalam matriks jadwal (persimpangan antara Hari dan Jam Pelajaran).
  - Menangkap event `dragover`, `dragenter`, `dragleave`, dan `drop` ketika user meletakkan blok guru di kotak ini.
  - Menampilkan isi (Nama Guru & Mapel) jika sel tersebut sudah terisi di Draft.

## 2. State Management (Pinia Store)
Disarankan menggunakan store bernama `useScheduleStore` (di `src/stores/scheduleStore.ts`) untuk menampung state drag-and-drop dan menghindari *prop-drilling* yang terlalu dalam:

```typescript
import { defineStore } from 'pinia';

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    // Draft jadwal yang sedang diseret / disusun
    draftSchedules: [] as any[],
    // Slot waktu yang dikunci secara global (contoh: Upacara)
    lockedSlots: [] as any[],
    // Data beban mengajar guru (Workload indikator)
    workloads: [] as any[],
    
    // Status UI Loading di tingkat operasi spesifik
    isLoadingAssign: false,
    
    // Konteks Halaman
    activeClassId: null as string | null,
    activeSemesterId: null as string | null,
  }),
  actions: {
    async fetchSchedulesAndWorkload(classId: string, semesterId: string) {
       // GET /api/schedules/{class_id}
       // GET /api/workload/{class_id}
       // Lalu set ke dalam state
    },
    async assignSchedule(payload: any) {
       // POST /api/schedules
       // Jika berhasil, tambahkan objek baru ke `draftSchedules`
       // Dan update workload guru (tambah jam API)
    }
  }
});
```

## 3. Alur Interaksi Drag and Drop (HTML5 Native)
Kita akan menggunakan API Drag and Drop bawaan HTML5 yang sudah di-support modern browsers.

1. **Memulai Drag (`dragstart` di area `DraggableTeacherCard.vue`):**
   - Tandai elemen dengan atribut `draggable="true"`.
   - Mengisi payload data dalam event drag:
     ```javascript
     const onDragStart = (event, teacherId, subjectId) => {
       const payload = JSON.stringify({ teacherId, subjectId });
       event.dataTransfer.setData('application/json', payload);
       event.dataTransfer.effectAllowed = 'copyMove';
     };
     ```

2. **Kotak Merespons (`dragover` dan `dragenter` di `ScheduleSlot.vue`):**
   - Agar area drop bisa menerima item drag, harus mencegah perilaku bawaan browser dengan memanggil `event.preventDefault()`.
   - Tambahkan CSS transisi misal warna latar belakang memudar (biru pucat/abu-abu) ketika item di-*hover-over* untuk memberi tanda bahwa area tersebut siap menerima (Drop Zone).
   - **Validasi Visual:** Jika kotak berstatus *Locked Slot*, hilangkan styling drop zone atau blok event, set tampilan kursor dengan *not-allowed*.

3. **Kotak Menerima (`drop` di `ScheduleSlot.vue`):**
   - Mencegah default dan mengambil ID slot tujuan.
   - Mengambil data dari payload hasil drag:
     ```javascript
     const onDrop = async (event, timeSlotId) => {
       event.preventDefault();
       const data = event.dataTransfer.getData('application/json');
       const { teacherId, subjectId } = JSON.parse(data);
       
       // Panggil action store (POST Request)
       await scheduleStore.assignSchedule({
         semester_id: scheduleStore.activeSemesterId,
         class_id: scheduleStore.activeClassId,
         time_slot_id: timeSlotId,
         subject_id: subjectId,
         teacher_id: teacherId
       });
     };
     ```

## 4. Alur Integrasi API (Request & Logic Response)

Strategi disarankan: **Pessimistic UI** (Tunggu response berhasil dari backend sebelum menambahkan secara visual di halaman dan menambah beban jam mengelompok di sidebar).

1. User mendrop (meletakkan) item di sel kalender.
2. Sel memunculkan Spinner loading kecil di dalamnya (mengatur Local State `isAssigning = true` di sel tersebut).
3. Melakukan HTTP Post ke `POST /api/schedules`.

**Kemungkinan Skenario Balasan (Sesuai BE):**
- **Jika Sukses (201 Created):**
  - Spinner dihentikan.
  - Kartu Guru & Mapel akan dirender di dalam sel tersebut menggantikan slot kosong.
  - State Beban Jam Guru di Sidebar otomatis bertambah nilainya.
  - Jika ini adalah operasi "Override" (Meniban pelajaran lama), maka jam mengajar guru mapel lama akan dikurangi di Sidebar, lalu digantikan jam pengajar baru. (Paling mudah untuk sinkronisasi = lakukan *refresh/refetch* GET `/api/workload/` sehabis API hit *create* sukses).

- **Jika Gagal/Bentrok (409 Conflict):**
  - Spinner dihentikan, blok tidak jadi masuk (sel tetap kosong atau terisi materi sebelum ditiban).
  - Tampilkan Pop-Up Toaster Error / SweetAlert merah.
  - Ambil pesan di dari API (`res.data.message` yang berbunyi seperti `"Validasi Gagal: Asyer Samuel Marpaung sudah memiliki jadwal... "`), lalu presentasikan di notifikasi error tersebut.

## 5. UI/UX & Edge Cases
Untuk memastikan UI ini elegan dan premium (sesuai standard yang baik):
- **Locked Slots Handling:** Slot seperti upacara, break/istirahat tidak bisa diperlakukan sebagai dropzone. Render berbeda (dengan ikon garis-garis atau gembok berwarna abu-abu). Event `ondragover` / `ondrop` di drop zone jangan disertakan (atau ditolak secara logikal).
- **Auto-Scroll:** Jika kalender cukup besar, pastikan library layout memampukan *auto-scroll* selama melakukan *drag*.
- **Toaster Notification:** Integrasikan library toaster (seperti `vue-toastification` atau bawaan UI component library kalian) untuk *feedback* yang kilat karena admin mungkin akan drag drop berpuluh-puluh slot pelajaran dengan cepat.
- **Batasan Drag & Drop Berkelanjutan:** Saat API `POST` sedang di-hit, backend bisa terkendala lambat. Cegah Staff melakukan *drop* bertubi-tubi pada kotak yang sama secara beruntun dengan me-disable drop sel tersebut (pointer-events: none) saat `isAssigning = true`.
