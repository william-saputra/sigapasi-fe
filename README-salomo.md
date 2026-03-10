# 👩🏻‍💻 Frontend Technical Documentation – Salomo
**SIGAPASI – Sistem Informasi Guru Penjadwalan dan Evaluasi**

---

## 📌 Overview
Dokumen ini mendeskripsikan cakupan fitur *Frontend* yang dikembangkan oleh **Salomo** pada sistem SIGAPASI. Pengembangan fokus pada visualisasi data analitik, manajemen state untuk alur persetujuan, dan integrasi modul ekspor dokumen.

**Author:** Salomo Immanuel Putra Manullang (2306219745)

---

# 🚀 Sprint 1
### ✅ PBI 18 – Dashboard Statistik Beban Kerja (Frontend)
Menampilkan visualisasi beban kerja guru untuk membantu Kepala Sekolah dan Staff Kurikulum dalam memantau distribusi jam mengajar.

**Features & Technical Specs:**
* **Data Visualization:** Menggunakan library Chart.js atau Vue-Chartjs untuk menampilkan grafik batang (*Bar Chart*) total Jam Pelajaran (JP) per guru.
* **Dynamic Color Coding:** Implementasi logika warna pada baris grafik (misalnya):
    * **Merah:** Overload (> 24 JP)
    * **Hijau:** Ideal (= 24 JP)
    * **Kuning:** Underload (< 24 JP)
* **Interactive Filters:** Komponen dropdown untuk menyaring data berdasarkan Bidang Studi dan Status Beban Kerja tanpa perlu reload halaman.
* **Empty State Management:** Menampilkan placeholder informatif jika data jadwal belum diinput.

---

# 🚀 Sprint 2
### ✅ PBI 16 & 17 – Fitur Approval Jadwal (Frontend UI/UX)
Menyediakan antarmuka bagi Kepala Sekolah untuk melakukan verifikasi dan memberikan keputusan terhadap draf jadwal.

**Features & Technical Specs:**
* **Approval Console:** Halaman khusus yang menampilkan daftar draf jadwal dengan status `Waiting for Approval`.
* **Decision Modals:** Dialog konfirmasi untuk aksi "Approve" atau "Reject" guna mencegah klik yang tidak disengaja.
* **Revision Input Field:** Text area khusus pada modal Reject agar Kepala Sekolah dapat memberikan catatan revisi yang akan muncul di dashboard Staff.
* **Role-Based Access (RBA):** Memastikan menu Approval hanya muncul dan dapat diakses oleh akun dengan role Kepala Sekolah melalui Vue Router Guards.

---

# 🚀 Sprint 3
### ✅ PBI 20 & 21 – Fitur Ringkasan & Ekspor Jadwal
Modul untuk melihat rangkuman jadwal dan mengunduhnya dalam format dokumen.

**Features & Technical Specs:**
* **Preview Mode:** Menampilkan tabel jadwal yang sudah diformat berdasarkan Kelas atau Guru sebelum diunduh.
* **Export Component:** Integrasi tombol ekspor yang memicu request ke endpoint backend untuk mendapatkan blob data PDF/Excel.
* **Download Manager:** Menangani proses download file di sisi client (browser) dengan penamaan file otomatis (Contoh: `Jadwal_Kelas_10A_2026.pdf`).
* **Print-Friendly CSS:** Pengaturan gaya cetak agar tampilan ringkasan jadwal rapi saat dicetak langsung dari browser.

---

# 🧱 Technical Scope (Frontend)
* **Framework:** Vue.js 3 (Composition API).
* **State Management:** Pinia untuk mengelola state data jadwal dan status approval.
* **Styling:** Tailwind CSS untuk antarmuka yang responsif dan indikator warna status.
* **HTTP Client:** Axios untuk komunikasi dengan RESTful API Backend.
* **Charts:** Chart.js untuk visualisasi dashboard.

---

# 👥 Alur Pengguna (User Flow)
1.  **Kepala Sekolah** masuk ke Dashboard dan melihat **Statistik Beban Kerja**. Bar berwarna merah menandakan ada guru yang kelebihan beban.
2.  **Kepala Sekolah** menavigasi ke menu **Approval Jadwal** untuk meninjau draf yang diajukan Staff.
3.  Jika jadwal sudah sesuai, **Kepala Sekolah** menekan tombol **Approve**. Status jadwal berubah menjadi `Published`.
4.  Setelah status `Published`, **Staff** atau **Kepala Sekolah** dapat membuka menu **Ekspor Jadwal**.
5.  User memilih filter (misal: Per Kelas), melihat preview-nya, lalu menekan tombol **Unduh PDF**.
6.  Sistem secara otomatis mengunduh file jadwal yang siap cetak.

---

