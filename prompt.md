Kamu adalah Senior Frontend Architect ahli dalam Vue.js 3 (Composition API) dan Pinia. 
Tugasmu adalah membuat RENCANA IMPLEMENTASI (IMPLEMENTATION PLAN) yang sangat detail untuk fitur "Penyusunan Jadwal (Drag & Drop)" pada proyek BE-SIGAP.

PENTING: TUGASMU HANYA MEMBUAT PLANNING. DILARANG KERAS MENULIS KODE IMPLEMENTASI VUE/TS (KECUALI CONTOH STRUKTUR INTERFACE/STORE SEDERHANA). Rencana ini akan saya berikan ke AI lain untuk di-coding secara bertahap guna menghemat token.

=== KONTEKS PROYEK ===
1. Tech Stack: Vue.js 3 (Composition API, `<script setup>`), Pinia (State Management), Tailwind CSS.
2. Format API: Semua response dibungkus dalam `BaseResponseDTO`: `{ "status": int, "message": string, "data": T, "timestamp": string }`.

=== FUNGSIONALITAS UTAMA & ALUR PENGGUNA (USER FLOW) ===
Sistem menggunakan paradigma "Master Draft" (satu semester bisa memiliki banyak draf).
Terdapat 2 Halaman Utama:

A. Halaman Dashboard Draft
1. Terdapat filter dropdown untuk memilih Tahun Ajaran dan Semester.
2. Saat filter berubah, sistem memanggil API untuk menampilkan daftar draf jadwal berdasarkan `semesterId` yang dipilih.
3. Pengguna bisa membuat Draf Baru (input nama draf + `semesterId`). Backend akan menolak (HTTP 409) jika nama draf duplikat.
4. Pengguna bisa mempublikasikan draf (Ubah status DRAFT -> PUBLISHED).
5. Klik salah satu draf untuk masuk ke "Workspace Penyusunan".

B. Halaman Workspace Penyusunan (Layout 2 Kolom)
Saat masuk, sistem memuat "Master Time Slots" untuk menggambar Grid Kalender kosong (Senin-Minggu, per sesi/jam).

1. Filter Kelas: Di atas header, terdapat dropdown pilihan Kelas (Misal: 10-A). Semua data di Sidebar dan Grid bergantung pada kelas yang aktif ini.
2. Panel Sidebar (Kiri): 
   - Menampilkan daftar Akordion Mata Pelajaran. Di dalamnya terdapat daftar Guru yang berwenang.
   - Terdapat indikator "Target Jam vs Jam Terisi" (misal: 2/4 Jam). Data ini akan reaktif berubah saat ada aktivitas DND.
3. Panel Grid Kalender (Kanan):
   - Tabel waktu yang merender sel kosong, sel abu-abu (jam istirahat/terkunci - secara visual tidak bisa di-drop), dan sel terisi (kartu jadwal).
4. Alur Drag & Drop (Mutasi Data) & Validasi:
   - Pengguna men-drag kartu Guru dari Sidebar dan men-drop-nya ke sel kosong di Grid.
   - Trigger API `POST /bulk-assign` (Payload: classId, timeSlotIds[], subjectId, teacherId). Tampilkan spinner di sel terkait.
   - JIKA SUCCESS (201): Update sel UI. Angka jam di Sidebar bertambah. Muncul Toast Sukses.
   - JIKA WARNING (201, data.status == "WARNING"): Jadwal tetap tersimpan, sel ter-update. Muncul Toast Kuning ("Beban mengajar guru melampaui batas").
   - JIKA ERROR (400/409): Revert sel kembali seperti semula. Muncul Toast Merah sesuai `error_code` dari Backend (Misal: ERR_CONFLICT_CHECKER jika guru bentrok di kelas lain, atau ERR_LOCKED_SLOT jika menabrak jam istirahat).
5. Alur Override (Menimpa Jadwal):
   - Pengguna men-drop kartu Guru baru ke sel yang SUDAH TERISI oleh Guru lama.
   - Jika sukses, sel berubah menjadi Guru baru. Jam Guru lama di Sidebar berkurang, jam Guru baru bertambah (data `overriddenEntries` dari API backend).
6. Hapus Jadwal:
   - Hover pada kartu di Grid -> Muncul icon 'X' -> Klik untuk menghapus 1 entry (Panggil API DELETE).
   - Ada tombol "Kosongkan Kelas" untuk menghapus seluruh jadwal di kelas aktif.
7. Simpan & Tutup:
   - Panggil API `GET /validate`. Jika respons menampilkan ada mapel yang target jam-nya belum terpenuhi, tampilkan Modal Peringatan sebelum user kembali ke Dashboard.

=== DOKUMENTASI API BACKEND ===
Dokumentasi API Penyusunan Jadwal (PBI-10)
Dokumentasi ini ditujukan untuk Frontend Developer sebagai panduan integrasi fitur Penyusunan Jadwal (Schedules). API ini mendukung arsitektur Master Draft di mana satu semester dapat memiliki banyak draf jadwal.

📌 Ringkasan Logika & Sistem Validasi
Master Draft: Jadwal tidak lagi berelasi 1:1 dengan semester. Anda dapat membuat banyak draf di satu semester (misalnya: "Draf V1", "Draf Revisi"). Hanya satu yang nanti perlu disepakati namun secara sistem, semua draf independen.
Soft Delete: Menghapus jadwal dari grid (delete entry) dan mengosongkan jadwal kelas tidak benar-benar menghapus data fisik (menghindari error history), melainkan mengisi kolom deleted_at. API GET secara otomatis hanya mengembalikan entri yang aktif.
Konsep Bulk Assign (Drag & Drop): Endpoint /bulk-assign memproses satu guru dan satu mapel ke banyak waktu (time slots) sekaligus.
Validation Engine (8 Lapis):
Hard Block (Error 400/404/409): Validasi data, jadwal harus status DRAFT, semester harus sesuai, slot tidak terkunci (jam istirahat), guru kompeten di mapel tsb, ketersediaan guru (Teacher Availability), dan pencegahan double-booking (mengajar di kelas lain pada jam yang sama).
Logika Override: Jika guru ditaruh di slot yang sudah ada isinya di kelas yang sama, maka guru/mapel lama akan diganti (override) dengan yang baru.
Soft Warning (Lapis 8): Jika setelah assign, jam mengajar guru melebihi batas maksimal mingguannya, API tetap merespons 201 Created tapi status di level data model akan berbunyi "WARNING" beserta detail peringatan.
Format Waktu: Start Time dan End Time divalidasi berupa HH:mm:ss (Contoh: 08:00:00), menggunakan LocalTime.
[UPDATE PENTING] Format Response Terpusat: Seluruh respons API kini telah di-refactor membungkus BaseResponseDTO. Artinya, respons-respons sebelumnya kini diletakkan di dalam key "data". Semua respons JSON akan mengikuti pola ini:
json
{
  "status": 200,
  "message": "Pesan sukses atau error...",
  "data": { ...isi response Anda... },
  "timestamp": "2026-04-02T..."
}
🚀 Grup A: Manajemen Draf Jadwal
Endpoint untuk manajemen pembuatan dan publikasi draf.

1. Ambil Daftar Draf per Semester
GET /api/schedules?semesterId={uuid}

Deskripsi: Mengambil semua draf yang pernah dibuat di semester tersebut (diurutkan dari yang terbaru).
Response (200 OK):
json
{
  "status": 200,
  "message": "Berhasil mengambil daftar draf jadwal",
  "data": [
    {
      "scheduleId": "uuid-draft-1",
      "name": "Draf Uji Coba V1",
      "status": "DRAFT", // atau "PUBLISHED"
      "createdAt": "2024-04-02T10:00:00"
    }
  ],
  "timestamp": "2026-04-02T10:00:00.000+00:00"
}
2. Buat Draf Jadwal Baru
POST /api/schedules

Deskripsi: Membuat draf jadwal kosong baru.
Request Body:
json
{
  "semesterId": "uuid-semester",
  "name": "Draf Uji Coba V1" // Harus unik dalam semester yang sama
}
Response (201 Created):
json
{
  "status": 201,
  "message": "Berhasil membuat draf jadwal baru",
  "data": {
    "scheduleId": "uuid-draft-1",
    "name": "Draf Uji Coba V1",
    "status": "DRAFT",
    "createdAt": "2024-04-02T10:00:00"
  },
  "timestamp": "2026-04-02T10:00:00.000+00:00"
}
Error: 409 Conflict jika nama draf duplikat.
3. Publikasikan Draf
PUT /api/schedules/{scheduleId}/publish

Deskripsi: Mengunci draf agar tidak bisa diubah lagi (Status DRAFT menjadi PUBLISHED).
Response (200 OK): Sama seperti respons GET/POST, model akan dikembalikan di dalam data dengan pesan "Berhasil mempublikasikan jadwal".
Error: 409 Conflict jika jadwal sudah dipublikasikan sebelumnya.
📊 Grup B: Persiapan UI (Data Grid & Sidebar)
Semua endpoint ini bersifat Read-Only (tidak mengubah data).

4. Progress Pengisian Tiap Kelas
GET /api/schedules/{scheduleId}/classes-summary

Deskripsi: Return total target jam vs jam draf terisi untuk semua kelas (bisa dipakai untuk dashboard progress).
Response (200 OK):
json
{
  "status": 200,
  "message": "Berhasil mengambil ringkasan jadwal kelas",
  "data": [
    {
      "classId": "uuid-kelas",
      "className": "Kelas 1A",
      "filledHours": 20,
      "targetHours": 40
    }
  ],
  "timestamp": "2026-04-02T10:00:00.000+00:00"
}
5. Data Sidebar (List Guru & Mapel)
GET /api/schedules/{scheduleId}/sidebar?classId={uuid}

Deskripsi: List relasi Guru dan Mata Pelajaran untuk kelas spesifik. Jika kelas tidak memiliki target beban, "data" akan mereturn array kosong [].
Response (200 OK):
json
{
  "status": 200,
  "message": "Berhasil mengambil data sidebar guru",
  "data": [
    {
      "teacherId": "uuid-teacher",
      "teacherName": "Budi Santoso",
      "subjectId": "uuid-subject",
      "subjectName": "Matematika",
      "targetHours": 4, // target dari kurikulum mapel_kelas tersebut
      "currentHours": 2 // jam aktif yang sedang ter-assign di draf ini (batas guru mengajar)
    }
  ],
  "timestamp": "2026-04-02T10:00:00.000+00:00"
}
6. Data Grid Kalender Jadwal
GET /api/schedules/{scheduleId}/entries?classId={uuid}

Deskripsi: Data existing entry yang merender kartu/kotak di UI kalender jadwal per kelas.
Response (200 OK):
json
{
  "status": 200,
  "message": "Berhasil mengambil data jadwal kelas",
  "data": [
    {
      "entryId": "uuid-entry-jadwal",
      "timeSlotId": "uuid-time-slot",
      "dayOfWeek": "MON",
      "startTime": "08:00:00",
      "endTime": "09:00:00",
      "teacherId": "uuid-teacher",
      "teacherName": "Budi Santoso",
      "subjectId": "uuid-subject",
      "subjectName": "Matematika"
    }
  ],
  "timestamp": "2026-04-02T10:00:00.000+00:00"
}
🖱️ Grup C: Aksi Drag-and-Drop (Mutasi Jadwal)
7. Assign Jadwal (Drag & Drop ke slot kosong / timpa slot)
POST /api/schedules/{scheduleId}/bulk-assign

Deskripsi: Memasukkan seorang guru beserta mapelnya ke dalam satu atau serangkaian slot waktu sekaligus.
Request Body:
json
{
  "classId": "uuid-class",
  "timeSlotIds": ["uuid-slot-1", "uuid-slot-2"],
  "subjectId": "uuid-subject",
  "teacherId": "uuid-teacher"
}
Response (201 Created): Terdapat inner "status" (di dalam data) dari aplikasi bisnis untuk menandakan WARNING beban lebih.
json
{
  "status": 201,
  "message": "Berhasil menetapkan jadwal",
  "data": {
    "status": "SUCCESS", // Bisa berupa "WARNING" jika melebihi target maxWeeklyHours guru
    "warningCode": null, // Jika WARNING, akan ada kode "WARN_MAX_LOAD_EXCEEDED"
    "message": null,     // Pesan human-readable terkait warning
    "newTeacherCurrentLoad": 18, // Update instan Total Jam Guru Baru untuk UI sidebar
    "overriddenEntries": [
      {
        "oldTeacherId": "uuid-guru-lama-jika-ditimpa",
        "oldTeacherCurrentLoad": 16 // Update info jam Guru Lama untuk sidebar 
      }
    ]
  },
  "timestamp": "2026-04-02T10:00:00.000+00:00"
}
Error 409 (Conflict): ERR_CONFLICT_CHECKER: "Guru tersebut sudah mengajar di kelas lain pada jam yang sama." ERR_TEACHER_UNAVAILABLE: Kemungkinan jam ini dilarang oleh guru yang bersangkutan.
8. Hapus Satu Entry (Delete/Silang Kotak Jadwal)
DELETE /api/schedules/entries/{entryId}

Deskripsi: Menghapus satu kartu jadwal dari grid.
Response (200 OK):
json
{
  "status": 200,
  "message": "Berhasil menghapus entri jadwal",
  "data": {
    "entryId": "uuid-entry-yg-dikosongkan",
    "newCurrentLoad": 14 // Jam guru kini setelah entry dihapus (referensi UI Sidebar)
  },
  "timestamp": "2026-04-02T10:00:00.000+00:00"
}
9. Kosongkan Tabel Jadwal Satu Kelas (Clear Schedule)
DELETE /api/schedules/{scheduleId}/classes/{classId}/clear

Deskripsi: Tombol clear/kosongkan seluruh jadwal pada suatu kelas. Parameter map info balikan mereturn string konfirmasi sederhana di dalam objek data.
Response (200 OK):
json
{
  "status": 200,
  "message": "Berhasil mengosongkan jadwal kelas",
  "data": {
    "message": "Semua entri jadwal kelas berhasil dihapus."
  },
  "timestamp": "2026-04-02T10:00:00.000+00:00"
}
🔒 Grup D: Validasi Akhir
Endpoint ini dieksekusi saat pengguna menekan tombol "Simpan & Tutup" atau "Cek Kelengkapan".

10. Cek Kelengkapan Kelas
GET /api/schedules/{scheduleId}/classes/{classId}/validate

Deskripsi: Mengecek apakah semua target jam mapel (curriculum hours) di kelas tersebut sudah terpenuhi di draf. Ini bersifat informational (selalu kembali HTTP 200). Status di level inner objek bisa "WARNING" jika masih kurang.
Response (200 OK):
json
{
  "status": 200,
  "message": "Berhasil memvalidasi kelengkapan jadwal kelas",
  "data": {
    "status": "OK", // Bisa berupa "WARNING" jika jam kurang
    "unfulfilledSubjects": [
      {
        "subjectName": "Fisika",
        "targetHours": 4,
        "assignedHours": 2
      }
    ]
  },
  "timestamp": "2026-04-02T10:00:00.000+00:00"
}
Jika semua mapel terpenuhi, unfulfilledSubjects akan berupa array kosong [].

=== TUGASMU ===
Berdasarkan alur dan dokumentasi di atas, buatkan rencana implementasi yang dibagi EXACTLY menjadi 3 TAHAPAN (Stages) yang logis dan modular. Rancang 3 Tahapan tersebut dengan format berikut:

TAHAP 1: Data Layer & State Management (DTO & Pinia)
- Definisikan struktur DTO/Interface TypeScript secara lengkap.
- Rancang struktur state, getters, dan actions untuk `scheduleDraftStore` (menangani filter Semester dan daftar draft) dan `scheduleWorkspaceStore`.
- WAJIB DETAILKAN: Bagaimana fungsi action Pinia akan memetakan dan menangani response validasi dari Backend (HTTP 409 ERR_CONFLICT_CHECKER, 201 WARNING beban mengajar, dan payload `overriddenEntries`).

TAHAP 2: UI Layout & Komponen Presentasional (Sistem Visual)
- Rencanakan hierarki komponen modular (misal: `DraftDashboard.vue` dengan filter Semester, `WorkspaceView.vue`, `SidebarResource.vue`, `ScheduleGrid.vue`, `DraggableCard.vue`, `DroppableCell.vue`).
- WAJIB DETAILKAN: Bagaimana komponen UI memvalidasi secara visual (contoh: sel `DroppableCell.vue` membaca properti `is_locked` atau `slot_type == 'BREAK'` dari master time slots untuk men-disable area drop dan memberi warna abu-abu).
- Jelaskan reaktivitas target jam di sidebar terhadap state Pinia.

TAHAP 3: Core Logic (HTML5 DND, Mutasi, & Sinkronisasi Data)
- Rencanakan implementasi HTML5 DND (`dragstart`, `dragover`, `drop`) murni menggunakan event payload (`dataTransfer`).
- WAJIB DETAILKAN ALUR MUTASI: Rencanakan mekanisme Optimistic Update vs Pessimistic Update saat drop terjadi. Bagaimana UI me-revert state jika API bulk-assign merespons HTTP 409 (Conflict)? Bagaimana UI meng-update counter Sidebar Guru Lama jika terjadi Override sukses?
- Rencanakan alur "Simpan & Tutup" beserta Modal Peringatan jika target kelas belum terpenuhi.

Ingat, pastikan rencanamu sangat deskriptif, logis, dan menjelaskan "BAGAIMANA" data mengalir dari Drag -> Store -> API -> UI beserta proteksi validasinya. Akhiri dengan ringkasan langkah.