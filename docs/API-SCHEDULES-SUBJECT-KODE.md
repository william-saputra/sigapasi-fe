# API Documentation: Penambahan Field `kode` pada Subject di Modul Schedules

## Overview

Dokumentasi ini menjelaskan perubahan JSON response akibat penambahan field `kode` (Kode Mata Pelajaran) pada entitas Subjects yangnow ditampilkan di endpoint modul Schedules.

---

## Perubahan JSON Response

### 1. GET /api/schedules/{scheduleId}/entries?class_id={uuid}

**Response DTO:** `ScheduleEntryResponse`

**Perubahan:** Penambahan field `subjectKode`

**Before:**
```json
{
  "entryId": "uuid-1234",
  "timeSlotId": "uuid-5678",
  "dayOfWeek": "SENIN",
  "startTime": "07:00:00",
  "endTime": "07:40:00",
  "teacherId": "uuid-teacher",
  "teacherName": "Budi Santoso, S.Pd",
  "subjectId": "uuid-subject",
  "subjectName": "Matematika"
}
```

**After:**
```json
{
  "entryId": "uuid-1234",
  "timeSlotId": "uuid-5678",
  "dayOfWeek": "SENIN",
  "startTime": "07:00:00",
  "endTime": "07:40:00",
  "teacherId": "uuid-teacher",
  "teacherName": "Budi Santoso, S.Pd",
  "subjectId": "uuid-subject",
  "subjectName": "Matematika",
  "subjectKode": "MTK"
}
```

---

### 2. GET /api/schedules/{scheduleId}/sidebar?class_id={uuid}

**Response DTO:** `SidebarItemResponse`

**Perubahan:** Penambahan field `subjectKode`

**Before:**
```json
{
  "teacherId": "uuid-teacher",
  "teacherName": "Budi Santoso, S.Pd",
  "subjectId": "uuid-subject",
  "subjectName": "Matematika",
  "targetHours": 4,
  "currentHours": 2
}
```

**After:**
```json
{
  "teacherId": "uuid-teacher",
  "teacherName": "Budi Santoso, S.Pd",
  "subjectId": "uuid-subject",
  "subjectName": "Matematika",
  "subjectKode": "MTK",
  "targetHours": 4,
  "currentHours": 2
}
```

---

## Catatan Penting untuk Frontend

### Urutan Field JSON
Urutan field di JSON response adalah sesuai dengan urutan parameter di record/DTO:
1. `teacherId`
2. `teacherName`
3. `subjectId`
4. `subjectName`
5. `subjectKode` ← **BARU**
6. `targetHours`
7. `currentHours`

### Null Safety
- Field `subjectKode` **tidak akan null** karena:
  - Kolom `kode` di database memiliki constraint `NOT NULL`
  - Service melakukan null-check sebelum mapping: `e.getSubject() != null ? e.getSubject().getKode() : null`
- Namun, sebagai fallback defensif, frontend disarankan tetap melakukan null-check atau berikan default value (misalnya: "-") jika terjadi kondisi anomali

---

## Daftar Endpoint yang Terdampak

| No | Endpoint | Method | DTO | Status |
|----|----------|--------|-----|--------|
| 1 | `/api/schedules/{scheduleId}/entries?class_id={uuid}` | GET | ScheduleEntryResponse | ✅ Berubah |
| 2 | `/api/schedules/{scheduleId}/sidebar?class_id={uuid}` | GET | SidebarItemResponse | ✅ Berubah |
| 3 | `/api/schedules/{scheduleId}/classes-summary` | GET | ClassScheduleSummaryResponse | ❌ Tidak Berubah |

---

## File yang Diubah

| File | Jenis Perubahan |
|------|-----------------|
| `Subjects.java` | Perbaikan mappedBy + kode field sudah ada |
| `ScheduleEntryResponse.java` | Penambahan field `subjectKode` |
| `SidebarItemResponse.java` | Penambahan field `subjectKode` |
| `SubjectResponseDTO.java` | Penambahan field `kode` |
| `ScheduleEntryQueryServiceImpl.java` | Update mapping service |

---

## Tanggal Perubahan
19 April 2026
