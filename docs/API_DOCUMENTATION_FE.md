# Backend Changelog & API Documentation (Scheduling Engine)

Dokumen ini disusun untuk dipelajari oleh Frontend (FE) Engineer atau Frontend AI Agent agar mendapatkan pemahaman mendalam terkait perubahan arsitektur backend terbaru, *state management* status jadwal, serta rincian kontrak API baru yang harus diintegrasikan.

---

## 1. Perubahan Logika *Business State* (Catatan Penting untuk FE)

### A. Konsep Master Draft & Migrasi Status
Backend tidak lagi menggunakan string validasi `"DRAFT"`. Tabel `schedules` saat ini menggunakan **ENUM type** untuk validasi siklus draft dengan 3 state valid:
1. `PENDING_APPROVAL`: Jadwal mulai dibuat / diisi. Bisa dimodifikasi. Modifikasi *entry* guru/jam/hari akan tervalidasi jika jadwal masih di tahap ini.
2. `REVISION_REQUIRED`: Jadwal ditolak oleh atasan dan membutuhkan perbaikan. Bisa dimodifikasi seperti `PENDING_APPROVAL`.
3. `PUBLISHED`: Jadwal bersifat final dan rilis resmi. **TIDAK BISA** dimodifikasi sama sekali (diamankan lewat backend *hard-block layer*).

> [!WARNING]
> Frontend App **HARUS** menyesuaikan UI-nya untuk merender `PENDING_APPROVAL`, `REVISION_REQUIRED`, dan `PUBLISHED`. Pastikan tidak ada komponen vue yang masih mengecek `status === 'DRAFT'`.

### B. Otomatisasi Tutup Semester (*Lazy Evaluation*)
Penutupan *Semester* atau *Tahun Ajaran* ketika tanggal sudah melewati `end_date` sekarang dieksekusi secara **asinkron** di *background backend layer*.
Pengecekan tidak dilakukan per millisecond, melainkan ditrigger saat *Admin* sedang mengakses path `/api/admin/*` dan sejenisnya.
- **Dampak di FE**: Anda tidak perlu khawatir me-routing _cron job_ / trigger ini. Namun pastikan logic init di aplikasi Frontend (_First Load_) selalu memanggil **API GET Active Academic Calendar** yang disediakan di bawah ini, untuk memutuskan apakah akan memblokir fitur pembentukan jadwal baru jika nilai responnya *null*.

---

## 2. API Contracts Baru

Semua _endpoint_ mengusung _convention_ response baku (Standar BaseController Axios-friendly):
```json
{
  "status": 200,
  "message": "Pesan sukses atau string keterangan",
  "data": { ... } // Payload relevan
}
```

### A. Validasi Kalender Akademik
Endpoint ini dapat dihit di *Root Navigation Guard* (Vue Router) atau pada layer komponen Dashboard paling awal (sebelum masuk sub-modul Scheduling).

- **Method**: `GET`
- **Path**: `/api/academic-setup/active`
- **Authorization**: Bearer Token (Global Authenticated User)

**1. Skenario Sukses (Ada kalender yang sedang aktif)**
```json
{
  "status": 200,
  "message": "Active academic calendar retrieved successfully",
  "data": {
    "academicYear": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "yearStart": "2025",
      "yearEnd": "2026",
      "isActive": true
    },
    "semester": {
      "id": "923e4567-e89b-12d3-a456-426614174001",
      "name": "Genap",
      "startDate": "2026-02-01",
      "endDate": "2026-06-30",
      "academicYearId": "123e4567-e89b-12d3-a456-426614174000",
      "isActive": true
    }
  }
}
```

**2. Skenario Kalender Kosong / Expired (Tidak ada yang aktif)**
*FE Harus me-*redirect* superadmin untuk mengatur waktu tahun/semester baru terlebih dahulu.*
```json
{
  "status": 200,
  "message": "No active academic calendar found",
  "data": null
}
```

---

### B. Transisi Status Jadwal (Approval System)
Endpoint ini dieksekusi ketika Head Master (Atasan) menyetujui, meneruskan rilis, atau me-*reject* dengan melampirkan cacatan revisi spesifik.

- **Method**: `PATCH`
- **Path**: `/api/schedules/{scheduleId}/status`
- **Authorization**: ROLE_ADMIN

> [!IMPORTANT]
> - Jika mengirim transisi Approve (`PUBLISHED`), pastikan `revisionNote` bersifat dinamis dan bernilai `null` / dihapus dari parameter body.
> - Jika menolak, gunakan target `REVISION_REQUIRED` dengan body terisi note.

**1. Request Payload (Reject)**
```json
{
  "status": "REVISION_REQUIRED", 
  "revisionNote": "Tolong pastikan jam istirahat untuk kelas SD tidak berbenturan dengan guru OR."
}
```

**2. Response Payload (200 OK)**
```json
{
  "status": 200,
  "message": "Schedule status updated successfully",
  "data": {
    "scheduleId": "923e4567-e89b-12d3-a456-426614174002",
    "status": "REVISION_REQUIRED", // atau PUBLISHED
    "approvedBy": {
      "id": "523e4567-e89b-12d3-a456-426614175555",
      "name": "Nama Lengkap Atasan"
    },
    "revisionNote": "Tolong pastikan jam istirahat untuk kelas SD tidak berbenturan dengan guru OR."
  }
}
```
