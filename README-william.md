# 👩🏻‍💻 Feature Scope – William
SIGAPASI – Sistem Informasi Guru Penjadwalan dan Evaluasi

---

## 📌 Overview
Dokumen ini merinci fitur-fitur yang dikembangkan oleh **William** dalam sistem SIGAPASI selama Sprint 1, Sprint 2, dan Sprint 3.

Fitur yang diimplementasikan berfokus pada ekosistem evaluasi kinerja guru:
- Pengelolaan Periode & Pemetaan Penilai (360 Degree Mapping)
- Pelaksanaan Penilaian (Review Workflow)
- Analitik & Visualisasi Hasil Evaluasi (Radar Chart & Gap Analysis)

---

# 🚀 Sprint 1
## EPIC 08 – Assign Reviewer Setiap Guru

### ✅ PBI 33 – Manajemen Periode Review
Memungkinkan Staff Kurikulum untuk mengorganisir penilaian berdasarkan periode waktu yang spesifik untuk memastikan evaluasi terorganisir.

**Fitur:**
- Pembuatan periode evaluasi baru melalui modal (Nama, Tanggal Mulai/Selesai).
- Validasi rentang tanggal di mana tanggal mulai wajib lebih awal dari tanggal selesai.
- *Progress tracking* pengisian evaluasi (jumlah tugas selesai/total tugas) untuk setiap periode.
- Penanganan konflik jika nama periode sudah ada (duplikat).

---

### ✅ PBI 34 – Mapping & Assign Reviewer
Menentukan subjek (penilai) dan objek (yang dinilai) agar data evaluasi 360 derajat valid dan objektif.

**Fitur:**
- Penunjukan 1 Atasan (*Superior*) melalui menu *dropdown*.
- Pemilihan satu atau lebih Rekan Sejawat (*Peer*) menggunakan *checklist*.
- Otomasi pembuatan tugas *Self-Review* untuk guru yang menjadi objek penilaian.
- Validasi untuk mencegah guru menilai diri sendiri sebagai rekan sejawat atau atasan.

---

# 🚀 Sprint 2
## EPIC 09 – Review Guru

### ✅ PBI 35 – Daftar Tugas Evaluasi
Menyediakan pusat kendali tugas bagi Guru dan Kepala Sekolah untuk memantau kewajiban penilaian mereka.

**Fitur:**
- Filter tugas yang hanya menampilkan data sesuai dengan identitas penilai yang sedang *login*.
- *Badge status* dinamis: `badge-pending` (Belum Diisi) dan `badge-completed` (Selesai).
- Pengurutan tugas berdasarkan status *pending* terlebih dahulu dan *deadline* terdekat.
- Tombol "Isi Sekarang" yang mengarahkan pengguna langsung ke formulir evaluasi terkait.

---

### ✅ PBI 36 – Pengisian Form 360 Review
Fasilitas pengumpulan umpan balik kinerja secara terstruktur dengan tetap menjaga anonimitas pengisi survei.

**Fitur:**
- Input skor kuantitatif skala 1-5 untuk kompetensi: Pedagogik, Kepribadian, Sosial, Profesional, dan Digital Skill.
- Kolom *textarea* untuk masukan kualitatif (saran pengembangan diri).
- Proteksi status tugas untuk mencegah pengiriman ulang pada tugas yang sudah berstatus *Completed*.
- Logika Anonimitas: Identitas penilai tidak ditampilkan pada hasil akhir yang dilihat oleh objek review.

---

# 🚀 Sprint 3
## EPIC 10 – Evaluasi Hasil Review

### ✅ PBI 37 – Dashboard Radar Chart
Visualisasi komprehensif untuk membandingkan persepsi penilaian diri sendiri dengan berbagai sudut pandang eksternal secara instan.

**Fitur:**
- Integrasi **Chart.js** tipe Radar (Spider Chart).
- Menampilkan 3 *dataset* dengan warna berbeda: Biru (Self), Merah (Peer), dan Kuning (Atasan).
- Kalkulasi otomatis nilai rata-rata dari seluruh responden per kategori kompetensi.
- *Filter dropdown* periode untuk memperbarui data grafik secara reaktif.

---

### ✅ PBI 38 – Tabel Gap Analysis
Menyediakan data detail untuk analisis kebutuhan pengembangan SDM atau pelatihan guru berdasarkan kesenjangan kompetensi.

**Fitur:**
- **Masking Penilai:** Penyamaran nama penilai kategori *Peer* (format: J*** S***).
- **Blind Spot Detection:** Penanda otomatis jika selisih mutlak antara skor *Self* dan rata-rata *Peer* lebih dari 1.0 poin.
- **Highlight Performa:** Penanda khusus untuk kompetensi dengan nilai tertinggi atau stabil ("Performa Bagus").
- **Insight-Box Dinamis:** Panel informasi yang berubah warna (Merah jika ada *gap* tinggi, Hijau jika stabil).

---

# 🧱 Technical Scope

## Backend
- RESTful API endpoints untuk manajemen periode, penugasan reviewer, dan submit review.
- Logika kalkulasi rata-rata (agregasi) dan penanganan data anonim.
- Mekanisme *Masking* data nama untuk proteksi privasi rekan sejawat.
- Validasi logika bisnis untuk pendeteksian *Blind Spot* dan *Circular Assignment*.

## Frontend
- Visualisasi data menggunakan library **Chart.js**.
- Komponen input *Slider* atau *Range* untuk pengisian skor kompetensi.
- UI Reaktif untuk filter periode yang memperbarui tampilan grafik dan tabel secara instan.
- *Insight box* berbasis kondisi (*conditional rendering*) untuk menampilkan analisis *gap*.

---

# 🎯 Impact

Fitur-fitur ini memastikan:
- Penilaian kinerja guru yang lebih objektif melalui perspektif 360 derajat.
- Identifikasi dini kesenjangan kompetensi tenaga pendidik melalui analisis *Blind Spot*.
- Tersedianya umpan balik kualitatif yang jujur berkat jaminan anonimitas sistem.
- Kemudahan bagi manajemen sekolah dalam mengambil keputusan strategis untuk program pengembangan SDM berbasis data.