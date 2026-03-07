# Fitur Pengajuan Cuti, Approval Cuti, dan Penugasan Guru Pengganti
Modul terintegrasi untuk mengelola siklus ketidakhadiran guru secara digital. Sistem ini memfasilitasi pengajuan izin guru, proses verifikasi dan *approval* oleh Kepala Sekolah, hingga pencarian dan penugasan guru pengganti (inval) oleh Staff TU guna memastikan Kegiatan Belajar Mengajar (KBM) tetap berjalan lancar.

**Author:** Evelyn Depthios (2306207543)
---

## 🚀 Fitur Utama

### 1. Fitur Pengajuan Cuti (Role: Guru)
* **Formulir Dinamis:** Mendukung pengajuan Cuti Harian (*Full Day*) dan Izin Parsial (*Short Term* / Jam tertentu).
* **Validasi Pintar:** Pengecekan sisa jatah cuti, validasi tanggal mundur (*backdate*), dan pencegahan jadwal bentrok (*overlap*).
* **Manajemen Dokumen:** Wajib unggah dokumen pendukung (Surat Dokter) khusus untuk kategori "Sakit".
* **Riwayat & Status:** Guru dapat memantau status pengajuannya (*Pending*, *Approved*, *Rejected*) beserta alasan penolakan dari Kepala Sekolah.

### 2. Fitur Approval Cuti (Role: Kepala Sekolah)
* **Daftar Pengajuan Cuti:** Menampilkan daftar pengajuan cuti yang menunggu persetujuan, diurutkan dari tanggal pelaksanaan terdekat.
* **Review Komprehensif:** Menampilkan detail pengajuan, sisa jatah cuti pemohon, dan *preview* lampiran dokumen.
* **Persetujuan (Approve):** Menyetujui cuti dan secara otomatis mengekstrak jadwal kelas yang ditinggalkan untuk diteruskan ke modul Penugasan.
* **Penolakan (Reject):** Menolak pengajuan dengan **wajib** menyertakan catatan/alasan penolakan yang akan dikirim kembali ke guru.

### 3. Fitur Penugasan Guru Pengganti (Role: Staff)
* **Pemantauan Kelas Kosong:** *Mini-dashboard* ringkasan jumlah guru absen dan tabel sesi kelas yang kosong berdasarkan filter tanggal.
* **Smart Filtering Kandidat:** Mencari dan merekomendasikan guru yang berstatus *Available* (tidak memiliki jadwal mengajar dan tidak sedang cuti) secara spesifik pada slot waktu kelas yang kosong.
* **Assignment Real-time:** Eksekusi penunjukan guru pengganti per sesi kelas secara instan.

---

## 📡 Daftar API Endpoints Utama (Backend) Sementara

**Leaves (Pengajuan Cuti)**
* `POST /api/leaves` - Submit form pengajuan cuti (mendukung `multipart/form-data` untuk *upload* file).
* `GET /api/leaves/history` - Mengambil riwayat pengajuan cuti milik user yang sedang *login*.

**Admin/Approval (Kepala Sekolah)**
* `GET /api/admin/leaves?status=pending` - Mengambil daftar antrean pengajuan cuti.
* `GET /api/admin/leaves/{id}` - Melihat detail satu pengajuan cuti.
* `POST /api/admin/leaves/{id}/approve` - Mengeksekusi persetujuan cuti.
* `POST /api/admin/leaves/{id}/reject` - Mengeksekusi penolakan cuti (wajib payload `reject_reason`).

**Assignments (Penugasan Inval)**
* `GET /api/assignments/empty-classes?date={date}` - Mendapatkan data sesi kelas yang kosong.
* `GET /api/teachers/available?date={date}&time_slot_id={id}` - Mendapatkan rekomendasi guru pengganti.
* `POST /api/assignments/assign` - Mengeksekusi penunjukan guru pengganti.

---

## 👥 Alur Pengguna (User Flow)
1. **Guru** mengajukan cuti via form.
2. Pengajuan masuk ke *Dashboard Approval*. **Kepala Sekolah** meninjau dokumen dan menyetujuinya.
3. Sistem secara otomatis membaca jadwal mengajar Guru yang cuti, lalu memindahkannya ke daftar "Kelas Kosong".
4. **Staff** membuka menu Penugasan, melihat jadwal yang bolong, dan memilih guru pengganti dari daftar guru yang sedang *available*.
5. **Guru Pengganti** menerima notifikasi tugas *inval* di akunnya.