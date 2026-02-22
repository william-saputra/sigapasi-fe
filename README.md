# SIGAPASI (Sistem Informasi Guru Penjadwalan dan Evaluasi) 🏫

SIGAPASI adalah platform pusat operasional tenaga kerja sekolah (guru) yang dirancang untuk meningkatkan efisiensi administratif dan objektivitas pengembangan SDM melalui integrasi otomasi penjadwalan, manajemen perizinan, dan evaluasi kinerja 360 derajat dalam satu sistem terpusat.

---

## 🚀 Garis Besar Fitur

Sesuai dengan dokumen Product Requirements, berikut adalah fitur-fitur utama sistem:

### 1. Manajemen Akses & Akun
- **Fitur Log In & Log Out:** Akses sistem melalui validasi kredensial sesuai peran (Admin, Kepala Sekolah, Guru, Staff Kurikulum).
- **Fitur Manajemen Akun:** Pengelolaan seluruh akun pengguna oleh Admin dan pembaruan detail akun pribadi oleh pengguna.

### 2. Pengaturan & Penyusunan Jadwal
- **Fitur Pengaturan Slot Waktu:** Konfigurasi struktur waktu pembelajaran, durasi jam pelajaran, dan penetapan Locked Slots untuk kegiatan rutin.
- **Fitur Manajemen Ketersediaan Waktu Guru:** Pengaturan waktu mengajar mandiri oleh guru untuk menghindari bentrok.
- **Fitur Penyusunan Jadwal:** Antarmuka visual untuk menempatkan guru dan mata pelajaran dilengkapi dengan Conflict Checker.
- **Fitur Approval Jadwal:** Peninjauan draf jadwal oleh Kepala Sekolah (Approve atau Request Revision).
- **Dashboard Statistik Beban Kerja:** Visualisasi grafik batang untuk memantau distribusi beban mengajar guru (Hijau/Kuning/Merah).
- **Fitur Ringkasan & Ekspor Jadwal:** Rangkuman jadwal final dalam View Mode serta pengunduhan format PDF/Excel.

### 3. Manajemen Perizinan & Inval
- **Fitur Pengajuan Cuti Guru:** Fasilitas permohonan ketidakhadiran (Cuti Harian atau Cuti Parsial) secara digital.
- **Fitur Approval Cuti:** Verifikasi dan pengambilan keputusan perizinan oleh Kepala Sekolah atau Staff TU.
- **Fitur Penugasan Guru Pengganti:** Pengelolaan kelas kosong dan penunjukan guru pengganti berdasarkan ketersediaan.

### 4. Evaluasi Kinerja (360 Review)
- **Fitur Assign Reviewer Setiap Guru:** Pemetaan subjek (penilai) dan objek (guru yang dinilai) untuk evaluasi 360 derajat.
- **Fitur Review Guru:** Penilaian kinerja komprehensif dari sudut pandang Self, Peer, dan Superior.
- **Fitur Evaluasi Hasil Review:** Visualisasi profil kompetensi guru melalui Spider Chart dan analisis gap.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Vue.js (Reaktivitas tinggi untuk fitur Drag-and-Drop) |
| Backend | Java Spring Boot (Manajemen API, Spring Security, logika bisnis) |
| Database | PostgreSQL (Managed service via Supabase) |
| Architecture | Decoupled Architecture (Frontend di Vercel, Backend via Docker/Cloud) |
| Komunikasi | RESTful API dengan format JSON |

---

## 📁 Struktur Directory
```plaintext
SIGAPASI/
├── sigapasi-frontend/        # Vue.js Project
│   ├── src/
│   │   ├── components/       # UI Elements Catalog
│   │   ├── views/            # Halaman Fitur (Penyusunan Jadwal, Review, dll)
│   │   └── assets/           # Design System (Public Sans, Color Palette)
├── sigapasi-backend/         # Java Spring Boot Project
│   ├── src/main/java/com/
│   │   ├── controller/       # Endpoints API
│   │   ├── service/          # Logic (Conflict Checker, Approval logic)
│   │   └── model/            # Entity Data (Guru, Jadwal, Cuti)
└── docs/                     # PRD, Flowchart, & Design System
```

---

## ⚙️ Panduan Instalasi

### 1. Clone Repository

### 2. Konfigurasi Database
- Gunakan PostgreSQL.
- Impor skema basis data sesuai rancangan fisik di dokumen.

### 3. Running Backend
```bash
cd sigapasi-backend
# Sesuaikan konfigurasi database di application.properties
./mvnw spring-boot:run
```

### 4. Running Frontend
```bash
cd sigapasi-frontend
npm install
npm run dev
```

---

## 👥 Kontributor

**Kelompok B12 (Radjaguguk)** — Sistem Informasi UI 2026

| Nama | NPM |
|---|---|
| Asyer Samuel Marpaung | 2306165925 |
| Claudia Paskalia Koesno | 2306275355 |
| Evelyn Depthios | 2306207543 |
| Salomo Immanuel Putra Manullang | 2306219745 |
| William Matthew Saputra | 2306165862 |