# Dokumentasi API: Manajemen Kelas dan Target Mata Pelajaran (Schedules Module)

Dokumen ini berisi spesifikasi lengkap untuk seluruh API endpoints yang digunakan dalam fitur CRUD Kelas (`Classes`), Penugasan Target Jam Pelajaran (`ClassSubjectTarget`), serta API pendukung Mata Pelajaran (`Subjects`).

## Informasi Umum
- **Base Path:** `/api`
- **Role Akses:** Seluruh endpoint di bawah ini mewajibkan user memiliki *authority* (role) **`STAFF`**.
- **Format Response Utama:** Semua API dibungkus (wrapped) di dalam `BaseResponseDTO` dengan struktur baku:
  ```json
  {
    "status": 200,
    "message": "Pesan sukses/error",
    "data": { ... }, // Bisa object atau array, null jika error/delete
    "timestamp": "2026-04-12T10:00:00.000+00:00"
  }
  ```

---

## 1. API Manajemen Kelas (ClassController)

Endpoint untuk mengelola data rombongan belajar / kelas.

GET /api/school-levels: Untuk mengisi pilihan jenjang (SD, SMP, SMA) saat membuat kelas baru.

### 1.1 Buat Kelas Baru
- **URL:** `POST /api/classes`
- **Catatan Penting:** Dijalankan di dalam `@Transactional`. Menerapkan validasi untuk memastikan nama kelas tidak duplikat (mengabaikan kapitalisasi/ignore case).
- **Request Body (`ClassRequestDTO`):**
  ```json
  {
    "name": "10-A",
    "gradeLevel": 10,
    "schoolLevelId": "uuid-sd-smp-sma"
  }
  ```
- **Response Success (201 Created):** Mengembalikan `ClassResponseDTO`.

### 1.2 Ambil Semua Kelas
- **URL:** `GET /api/classes`
- **Response Success (200 OK):** Mengembalikan `List<ClassResponseDTO>`.

### 1.3 Ambil Detail Kelas
- **URL:** `GET /api/classes/{id}`
- **Response Success (200 OK):** Mengembalikan `ClassResponseDTO`.

### 1.4 Ubah Data Kelas
- **URL:** `PUT /api/classes/{id}`
- **Catatan Penting:** Dijalankan dalam `@Transactional`. Sistem mengecek apakah nama baru sudah dipakai oleh kelas lain (pengecekan id yang berbeda).
- **Request Body (`ClassRequestDTO`):** Sama seperti pembuatan.
- **Response Success (200 OK):** Mengembalikan `ClassResponseDTO` terbaru.

### 1.5 Hapus Kelas
- **URL:** `DELETE /api/classes/{id}`
- **Catatan Penting:** Menghapus kelas akan men-trigger *cascade delete*. Artinya, seluruh target mata pelajaran (`ClassSubjectTarget`) dan isi jadwal (`ScheduleEntry`) yang terkait dengan kelas ini akan **ikut terhapus**. Dijalankan di dalam `@Transactional`.
- **Response Success (200 OK):** Data bernilai `null`.

---

## 2. API Manajemen Target Mata Pelajaran (ClassSubjectTargetController)

Endpoint untuk mengatur mata pelajaran apa saja yang diajarkan pada suatu kelas, beserta beban jam (`targetHours`) per minggu.

### 2.1 Tambah Target ke Kelas (Single)
- **URL:** `POST /api/classes/{classId}/targets`
- **Catatan Penting:** Dijalankan di dalam `@Transactional`. Terdapat perlindungan *Composite Unique Key* di level Service: Sistem memastikan satu kelas tidak memiliki 2 data target untuk mata pelajaran yang sama persis (mencegah duplikasi).
- **Request Body (`ClassSubjectTargetRequestDTO`):**
  ```json
  {
    "subjectId": "uuid-mapel",
    "targetHours": 4
  }
  ```
- **Response Success (201 Created):** Mengembalikan `ClassSubjectTargetResponseDTO`.

### 2.2 Ambil Semua Target di Satu Kelas
- **URL:** `GET /api/classes/{classId}/targets`
- **Response Success (200 OK):** Mengembalikan `List<ClassSubjectTargetResponseDTO>`.

### 2.3 Ubah Target Jam Pelajaran
- **URL:** `PUT /api/targets/{id}`
- **Catatan Penting:** Dijalankan dalam `@Transactional`. Dapat digunakan untuk mengganti mata pelajaran atau mengubah jumlah jam. Tetap mengecek duplikasi mapel dalam kelas tersebut.
- **Request Body (`ClassSubjectTargetRequestDTO`):** Sama seperti penambahan.
- **Response Success (200 OK):** Mengembalikan `ClassSubjectTargetResponseDTO` terbaru.

### 2.4 Hapus Target Pelajaran
- **URL:** `DELETE /api/targets/{id}`
- **Response Success (200 OK):** Data bernilai `null`.

---

## 3. API Pendukung (Fitur UI & Validasi Frontend)

Endpoint ini sangat krusial untuk membuat User Interface (UI) bekerja secara reaktif, mulus, dan menghindari *lag* pada request jaringan.

### 3.1 Ambil Daftar Seluruh Mata Pelajaran (Filterable)
- **URL:** `GET /api/subjects`
- **Query Params (Opsional):** `?schoolLevelId={uuid}`
- **Fungsi:** Mengambil semua mata pelajaran. Jika `schoolLevelId` diisi, maka hanya akan mengembalikan mata pelajaran yang khusus untuk jenjang tersebut (contoh: Hanya mapel SMA).

### 3.2 Ambil Daftar Mata Pelajaran yang Belum Di-assign (Unassigned)
- **URL:** `GET /api/subjects/unassigned?classId={uuid}`
- **Fungsi:** Menampilkan mata pelajaran yang *belum pernah* ditambahkan/diatur target jamnya pada kelas tersebut.
- **Logika & Keamanan:** Selain mengecek yang belum di-assign, sistem otomatis memfilter mapel agar sesuai dengan **jenjang (School Level)** dari kelas tersebut. (Mencegah mapel "Matematika SD" muncul di opsi dropdown saat mengatur target untuk kelas "10-A SMA").

### 3.3 Ambil Rekap Target Kelas (Summary)
- **URL:** `GET /api/classes/{classId}/target-summary`
- **Fungsi:** Menghitung akumulasi total `targetHours` dari semua mata pelajaran di kelas tersebut, beserta jumlah mata pelajaran (`totalSubjects`).
- **Penggunaan Frontend:** Sangat direkomendasikan untuk dipakai guna menampilkan peringatan batas waktu maksimal jam sekolah di bagian UI (misal: memunculkan bar warna merah jika total target > 40 jam).
- **Response Success (200 OK):**
  ```json
  "data": {
    "totalTargetHours": 32,
    "totalSubjects": 10
  }
  ```

### 3.4 Penambahan Target Pelajaran Secara Massal (Bulk Assign)
- **URL:** `POST /api/classes/{classId}/targets/bulk`
- **Catatan Penting:** 
  - Operasi ini dibungkus menggunakan single `@Transactional`. Artinya, jika ada pengiriman 10 mata pelajaran, dan mata pelajaran ke-8 gagal karena validasi (misal duplikat), **seluruh transaksi akan dibatalkan (rollback)** sehingga tidak terjadi inkonsistensi data sebagian.
  - Memeriksa duplikasi data pada *payload* yang dikirim (jika dalam 1 *array* ada 2 mapel yang sama, langsung di-reject).
  - Melakukan *batch save* (`saveAll`) guna menghemat pemrosesan memori dan koneksi ke database ketimbang request satu persatu.
- **Request Body (`BulkClassSubjectTargetRequestDTO`):**
  ```json
  {
    "targets": [
      {
        "subjectId": "uuid-mapel-1",
        "targetHours": 4
      },
      {
        "subjectId": "uuid-mapel-2",
        "targetHours": 2
      }
    ]
  }
  ```
- **Response Success (201 Created):** Mengembalikan `List<ClassSubjectTargetResponseDTO>` berisi semua data target yang baru dimasukkan.

---

## Standar Kode Error / Exception Handling

Kesalahan (Error) yang terjadi pada seluruh endpoint di atas sudah disentralisasi di `GlobalExceptionHandler.java` dengan gaya balasan sebagai berikut:

- **400 Bad Request:** Jika payload tidak valid (contoh: `name` kosong, `targetHours` di bawah 1).
- **401 Unauthorized / 403 Forbidden:** Jika user tidak login atau tidak memiliki *role* `STAFF`.
- **404 Not Found (EntityNotFoundException):** Jika UUID kelas, mata pelajaran, atau target tidak ditemukan di database.
- **409 Conflict (DuplicateResourceException):** Jika ada pelanggaran logika duplikasi (misal: kelas dengan nama "10-A" sudah dibuat sebelumnya, atau mapel "Fisika" sudah di-assign di kelas yang sama).