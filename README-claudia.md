# 👩🏻‍💻 Feature Scope – Claudia
SIGAPASI – Sistem Informasi Pengelolaan & Penyusunan Jadwal Sekolah

---

## 📌 Overview
This document describes the features developed by **Claudia** in the SIGAPASI system across Sprint 1, Sprint 2, and Sprint 3.

The implemented features focus on:
- Authentication & Authorization
- Account Management (CRUD)
- Teacher Availability Management
- In-App Notification System

---

# 🚀 Sprint 1
## EPIC 01 – Authentication & Account Management

### ✅ PBI 1 – Login
Users (Admin, Kepala Sekolah, Guru, Staff Kurikulum) can log into the system.

**Features:**
- Email & password authentication
- JWT token generation
- Role-based access control
- Email format validation
- Rate limiting protection

---

### ✅ PBI 2 – Logout
Users can securely log out of the system.

**Features:**
- Token invalidation
- Clear local storage/session
- Redirect to login page

---

### ✅ PBI 3 – Create Account (Admin)
Admin can create accounts for:
- Kepala Sekolah
- Guru
- Staff Kurikulum

**Features:**
- Unique email validation
- Password hashing (encrypted storage)
- Role assignment

---

### ✅ PBI 4 – View Account List (Admin Only)
Admin can view and manage all registered accounts.

**Features:**
- Display list of accounts
- Search/filter by name
- Access to detail page
- Delete action with confirmation modal

---

# 🚀 Sprint 2
## EPIC 03 – Teacher Availability

### ✅ PBI 12 – Create Availability
Guru can input weekly teaching availability.

**Features:**
- Select day & time slot
- Save availability per user
- Store reference to user ID
- Success notification

---

### ✅ PBI 13 – View Availability
Guru can view saved availability.

**Features:**
- Weekly availability display
- Deadline information shown
- Empty state if not yet filled

---

### ✅ PBI 14 – Update Availability
Guru can modify availability before deadline.

**Features:**
- Pre-filled edit form
- Deadline validation (403 if expired)
- Updated_at timestamp tracking
- Error handling for late update

---

## EPIC06 – Approval Cuti

### ✅ PBI 29 – In-App Notification Bell (Global Header)

Provide real-time in-app notification system for Guru.

**Triggered when:**
- Leave request approved
- Leave request rejected
- Assigned as substitute teacher

**Features:**
- 🔔 Notification bell in global header
- Red badge for unread notifications
- Dropdown showing 5 latest notifications
- Highlight unread notifications

---

# 🚀 Sprint 3
## EPIC 01 – Account Management (Continuation)

### ✅ PBI 5 – View Account Detail
Users can view detailed account information.

**Access Rules:**
- Admin → Can view all accounts
- Other roles → Can only view their own account

**Features:**
- Display name, email, role
- Update & delete button (based on role)

---

### ✅ PBI 6 – Update Account
Users can update account information.

**Access Rules:**
- Admin → Can update any account
- Other roles → Can only update their own password

**Features:**
- Form with pre-filled data
- Field validation
- Auto-set updated_at & updated_by
- Success notification

---

### ✅ PBI 7 – Delete Account (Admin Only)
Admin can soft-delete accounts.

**Features:**
- Soft delete (inactive status in database)
- Confirmation modal
- Access revoked after deletion
- Success message

---

# 🧱 Technical Scope

## Backend
- RESTful API endpoints
- JWT Authentication
- Role-Based Access Control (RBAC)
- Soft delete mechanism
- Deadline validation logic
- Automatic notification record creation

## Frontend
- Role-based routing
- Form validation (client-side)
- Modal confirmation dialogs
- Real-time UI updates

---

# 🎯 Impact

These features ensure:
- Secure system authentication
- Proper account lifecycle management
- Accurate teacher availability data
- Real-time notification awareness
- Improved internal communication
- Better scheduling preparation support
