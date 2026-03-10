# Fitur Pengaturan Slot Waktu, Penyusunan Jadwal, dan Indikator Beban Mengajar

Modul terintegrasi untuk mengelola kerangka waktu pembelajaran dan penyusunan jadwal kelas secara digital. Sistem ini memfasilitasi pembuatan struktur jam pelajaran yang dinamis, penguncian jadwal untuk kegiatan rutin, hingga penempatan guru ke dalam kelas menggunakan metode *drag-and-drop* interaktif yang dilengkapi dengan validasi konflik (bentrok) secara otomatis.

**Author:** Asyer Samuel Marpaung (2306165925)

## 🚀 Fitur Utama

**1. Fitur Konfigurasi Struktur Jadwal Harian (Role: Staff Kurikulum)**
* **Generator Dinamis:** Mendukung pembuatan slot jam pelajaran secara otomatis berdasarkan input jam mulai, durasi, dan jumlah slot.
* **Fleksibilitas Harian:** Memungkinkan pengaturan durasi yang berbeda per slot, serta kemampuan menyisipkan waktu istirahat (Break) di antara jam pelajaran.
* **Fitur *Apply To*:** Mempercepat proses pengaturan dengan menyalin konfigurasi dari satu hari ke hari lainnya (misal: salin jadwal Senin ke Selasa dan Rabu).

**2. Fitur Locked Slots / Slot Kunci (Role: Staff Kurikulum)**
* **Penguncian Global:** Memungkinkan penguncian slot waktu tertentu (seperti Upacara atau Senam) yang berlaku serentak untuk seluruh kelas pada tahun ajaran aktif.
* **Visualisasi Informatif:** Slot yang dikunci akan berubah warna dan menampilkan label kegiatan, serta otomatis dinonaktifkan (*disabled*) pada halaman penyusunan jadwal.

**3. Fitur Penyusunan & Validasi Jadwal (Role: Staff Kurikulum)**
* **Antarmuka *Drag-and-Drop*:** Menempatkan guru dan mata pelajaran ke dalam slot jadwal kosong secara visual, interaktif, dan mudah.
* **Validasi Konflik Pintar (3 Lapis):** Sistem otomatis mencegah terjadinya *double booking* dengan mengecek jadwal mengajar guru di kelas lain, status ketersediaan (*availability*) guru, dan status *locked slots*.


**4. Fitur Indikator Beban Jam (Role: Staff Kurikulum)**
* **Monitoring *Real-time*:** Menampilkan rasio pemenuhan jam pelajaran (Terisi / Target) untuk setiap mata pelajaran saat jadwal sedang disusun.
* *Smart Color-Coding*: Indikator otomatis berubah warna menjadi Hijau (jika target pas), Merah (jika *overload*/kelebihan jam), atau Abu-abu (jika jam masih kurang).

## 📡 Daftar API Endpoints Utama (Backend) Sementara

**Konfigurasi Struktur Jadwal (Time Slots)**
* `PUT /api/configuration/structure` - Menyimpan atau memperbarui konfigurasi array jadwal harian (Lesson & Break).
* `GET /api/configuration/structure` - Mengambil data struktur jadwal lengkap untuk di-render oleh Frontend.

**Manajemen Slot Kunci (Locked Slots)**
* `POST /api/configuration/locked-slots` - Mengeksekusi penguncian slot waktu secara global.
* `DELETE /api/configuration/locked-slots/{id}` - Membuka kunci (menghapus) kegiatan rutin pada slot tertentu.

**Penyusunan Jadwal (Schedules)**
* `GET /api/schedules/{class_id}` - Mengambil daftar draf jadwal untuk kelas tertentu.
* `POST /api/schedules` - Mengeksekusi penempatan item jadwal (*drag-and-drop*) dengan menjalankan *Conflict Checker* di latar belakang.

**Pemantauan Beban Jam (Workload)**
* `GET /api/workload/{class_id}` - Mendapatkan data agregasi *real-time* sisa target jam mengajar per mata pelajaran.

## 👥 Alur Pengguna (User Flow)

1.  Staff mengatur kerangka waktu harian dengan men-*generate* slot pelajaran dan menyisipkan waktu istirahat melalui menu Pengaturan Slot Waktu.
2.  Staff mengunci slot waktu tertentu untuk kegiatan wajib sekolah (seperti Upacara Bendera pada hari Senin jam pertama).
3.  Staff masuk ke menu Penyusunan Jadwal, lalu memilih Kelas dan Tahun Ajaran yang ingin dijadwalkan.
4.  Sistem menampilkan tabel jadwal (dengan slot istirahat dan kunci yang sudah *disabled*) beserta daftar Guru & Mata Pelajaran.
5.  Staff menarik (*drag*) nama guru dan menjatuhkannya (*drop*) ke slot waktu yang kosong.
6.  Sistem memvalidasi ketersediaan guru. Jika aman, jadwal tersimpan sebagai draf. Jika bentrok, sistem menampilkan peringatan merah dan mengembalikan nama guru ke daftar semula.
7.  Secara bersamaan, Staff memantau panel Indikator Beban Jam yang angkanya bertambah secara *real-time* untuk memastikan target jam mata pelajaran kelas tersebut terpenuhi (Hijau).
8.  Setelah semua slot terisi dengan benar, Staff menekan "Simpan & Tutup Draft" untuk menyelesaikan sesi penyusunan.