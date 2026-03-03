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

## 🗄️ Skema Database

Berikut adalah rancangan struktur database yang digunakan dalam sistem SIGAPASI:

<details>
<summary><b>1. Manajemen Akun & Pengguna (Users, Roles, Teacher)</b></summary>

**Tabel `ROLES`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | (Admin, Guru, Staff, Kepala Sekolah) |

**Tabel `USERS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| role_id | UUID | PK, FK ke ROLES.id |
| full_name | VARCHAR | |
| email | VARCHAR | |
| password | TEXT | |
| phone | VARCHAR | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Tabel `TEACHER`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| teacher_id | UUID | PK, FK ke USERS.id |
| employment_type| ENUM | FULL_TIME / PART_TIME |
| max_weekly_hours| INT | |
| remaining_leave_quota| INT | |
| Work_hour | INT | |

</details>

<details>
<summary><b>2. Akademik, Kelas & Mata Pelajaran</b></summary>

**Tabel `ACADEMIC_YEARS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| year_start | YEAR | |
| year_end | YEAR | |
| is_active | BOOLEAN | |

**Tabel `SEMESTERS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| academic_year_id| UUID | FK ke ACADEMIC_YEARS.id |
| name | ENUM | GANJIL / GENAP |
| start_date | DATE | |
| end_date | DATE | |
| is_active | BOOLEAN | |

**Tabel `SUBJECTS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | |

**Tabel `CLASSES`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | |
| grade_level | VARCHAR | |

**Tabel `TEACHER_SUBJECTS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| teacher_id | UUID | PK, FK ke TEACHER.teacher_id |
| subject_id | UUID | PK, FK ke SUBJECTS.id |

**Tabel `CLASS_SUBJECT_TARGETS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| class_id | UUID | FK ke CLASSES.id |
| subject_id | UUID | FK ke SUBJECTS.id |
| target_hours | INT | |

</details>

<details>
<summary><b>3. Penjadwalan (Schedules, Time Slots, Workload)</b></summary>

**Tabel `TIME_SLOTS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| semester_id | UUID | PK, FK ke SEMESTERS.id |
| day_of_week | ENUM | MON - SUN |
| session_number| INT | |
| start_time | TIME | |
| end_time | TIME | |
| is_locked | BOOLEAN | |
| locked_label | VARCHAR | NULLABLE |
| slot_type | ENUM | LESSON / BREAK |

**Tabel `TEACHER_AVAILABILITY`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| teacher_id | UUID | PK, FK ke TEACHER.teacher_id |
| time_slot_id | UUID | PK, FK ke TIME_SLOTS.id |
| is_available | BOOLEAN | |

**Tabel `SCHEDULES`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| semester_id | UUID | PK, FK ke SEMESTERS.id |
| status | ENUM | DRAFT, WAITING_APPROVAL, REVISION, PUBLISHED |
| created_by | UUID | PK, FK ke USERS.id |
| approved_by | UUID | nullable, FK ke USERS.id |
| revision_note | TEXT | |
| created_at | TIMESTAMP | |
| approved_at | TIMESTAMP | |

**Tabel `SCHEDULE_ENTRY`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| schedule_id | UUID | PK, FK ke SCHEDULES.id |
| class_id | UUID | PK, FK ke CLASSES.id |
| time_slot_id | UUID | PK, FK ke TIME_SLOTS.id |
| subject_id | UUID | PK, FK ke SUBJECTS.id |
| teacher_id | UUID | PK, FK ke TEACHER.teacher_id |

**Tabel `TEACHER_WORKLOADS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| teacher_id | UUID | PK, FK ke TEACHER.teacher_id |
| semester_id | UUID | PK, FK ke SEMESTERS.id |
| total_hours | INT | |
| status | ENUM | UNDERLOAD, IDEAL, OVERLOAD |

</details>

<details>
<summary><b>4. Perizinan & Inval (Leave, Substitutes)</b></summary>

**Tabel `LEAVE_REQUEST`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| teacher_id | UUID | FK ke TEACHER.teacher_id |
| type | ENUM | FULL_DAY, PARTIAL |
| category | ENUM | SAKIT, IZIN_PRIBADI, DINAS_LUAR, MELAHIRKAN |
| start_date | DATE | |
| end_date | DATE | |
| start_time | TIME | NULLABLE |
| end_time | TIME | NULLABLE |
| reason | TEXT | |
| attachment_url| TEXT | |
| status | ENUM | PENDING, APPROVED, REJECTED |
| approved_by | UUID | FK ke USERS.id |
| rejection_reason| TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Tabel `LEAVE_QUOTAS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| teacher_id | UUID | FK ke TEACHER.teacher_id (PK) |
| year | INT | PK |
| total_quota | INT | |

**Tabel `SUBSTITUTE_ASSIGNMENTS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| leave_request_id | UUID | FK ke LEAVE_REQUEST.id |
| schedule_entry_id| UUID | FK ke SCHEDULE_ENTRY.id |
| absent_teacher_id| UUID | FK ke TEACHER.teacher_id |
| substitute_teacher_id| UUID | FK ke TEACHER.teacher_id |
| assigned_by | UUID | FK ke USERS.id |
| assignment_date| Date | |
| status | ENUM | ASSIGNED, NOT ASSIGNED |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

</details>

<details>
<summary><b>5. Evaluasi Kinerja (360 Review)</b></summary>

**Tabel `REVIEW_ASSIGNMENT`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| review_period_id| UUID | FK ke REVIEW_PERIODS.id |
| reviewer_id | UUID | FK ke USERS.id |
| reviewee_id | UUID | FK ke USERS.id |
| type | ENUM | SELF, PEER, SUPERIOR |
| status | ENUM | PENDING, SUBMITTED |

**Tabel `REVIEW_QUESTIONS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| question_text | TEXT | |
| category | VARCHAR | |

**Tabel `REVIEW_ANSWERS`**
| Nama Atribut | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | PK |
| review_assignment_id| UUID | FK ke REVIEW_ASSIGNMENT.id |
| question_id | UUID | FK ke REVIEW_QUESTIONS.id |
| score | INT | (1-5) |
| comment | TEXT | |

</details>

---

## 📁 Struktur Directory
```plaintext
SIGAPASI/
├── sigapasi-frontend/                # Vue.js Project
│   ├── src/
│   │   ├── components/       # UI Elements Catalog
│   │   ├── views/            # Halaman Fitur (Penyusunan Jadwal, Review, dll)
│   │   └── assets/           # Design System (Public Sans, Color Palette)
├── sigapasi-backend/         # Java Spring Boot Project
│   ├── src/main/java/com/
        ├── authprofile/
        │   ├── controller/
        │   ├── dto/
        │   ├── model/
        │   ├── repository/
        │   └── service/
        ├── common/
        ├── config/
        ├── leaves/
        ├── reviews/
        ├── schedules/
        ├── security/
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