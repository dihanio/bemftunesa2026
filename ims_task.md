# IMS BEM FT UNESA - MVP Development Checklist

Dokumen ini melacak kemajuan (*progress*) pengembangan sistem IMS BEM FT UNESA untuk fase *Minimum Viable Product* (MVP).

## 1. Database & Schema Design
- `[x]` Buat skema `CabinetPeriod` (Periode Kepengurusan).
- `[x]` Buat skema `Department` (Termasuk logo, warna, dan kontak).
- `[x]` Refaktor skema `User` (Integrasi dengan Role, Periode, dan Departemen).
- `[x]` Buat skema dasar `AuditLog` (Entity, Action, Change Summary).
- `[x]` Buat skema `Program` (Proker dengan estimasi RAB).
- `[x]` Buat skema `Task` (Tugas dengan Status Lifecycle).
- `[x]` Buat skema `Meeting` (Rapat dan Action Items).
- `[x]` Buat skema `Aspiration` (Dengan tingkat Urgensi dan SLA).
- `[x]` Buat skema `Document` (SOP, LPJ, dll dengan Soft Delete).
- `[x]` Buat skema `SystemSetting` (Nama Kabinet, Kontak, Logo Utama).

## 2. Authentication & Security (RBAC)
- `[x]` Implementasi JWT Authentication untuk *Login*.
- `[x]` Lindungi *endpoint* dengan *Guards* (`JwtAuthGuard`).
- `[x]` Buat sistem *Role Checking* (RBAC) pada setiap *request* (`RolesGuard`).
- `[x]` Buat *Decorator* khusus untuk ekstraksi *User* (`@CurrentUser()`).
- `[x]` Buat *Decorator* proteksi modul (`@Roles()`).

## 3. Backend API Endpoints (Core Operations)
- `[ ]` CRUD & Active State Toggling untuk `CabinetPeriod`.
- `[ ]` CRUD `Department` (Termasuk manajemen staf di dalamnya).
- `[ ]` CRUD `User` (Pendaftaran pengurus baru oleh Super Admin / BPI).
- `[ ]` CRUD `Program` (Beserta Workflow Approval tingkat BPI).
- `[ ]` CRUD `Task` (Update *progress*, komentar, *assignee*).
- `[ ]` CRUD `Meeting` (Termasuk pembuatan Task dari Meeting).
- `[ ]` Modul Penanganan `Aspiration` (Disposisi dan Tanggapan).
- `[ ]` Modul Pengunggahan `Document` (Penyimpanan ke S3/Local dan *soft delete*).
- `[ ]` Endpoint `Global Search` (Pencarian *multi-collection* menggunakan Aggregation).

## 4. Frontend - Layout & Core UI (Next.js)
- `[ ]` Buat arsitektur *layout dashboard* utama.
- `[ ]` *Navbar* dengan komponen **Global Search (Omnibox)**.
- `[ ]` Konfigurasi *Sidebar* dinamis berdasarkan RBAC (*Menu visibility*).
- `[ ]` Halaman *Login* untuk Pengurus.
- `[ ]` Komponen *In-App Notification Dropdown*.

## 5. Frontend - Modul Halaman
- `[ ]` Halaman *System Settings* (Super Admin).
- `[ ]` Halaman *Cabinet & Department Management*.
- `[ ]` Halaman *Users/Staff Management*.
- `[ ]` Halaman *Program Kerja* (Daftar, Detail, Upload LPJ/RAB).
- `[ ]` Halaman *Task Board* (Model Kanban atau List untuk *To Do* hingga *Completed*).
- `[ ]` Halaman *Meeting Room* (Catatan Notulensi & *Action Items*).
- `[ ]` Halaman *Aspirasi Mahasiswa* (Untuk Mahasiswa umum dan Dashboard Pengurus).
- `[ ]` Halaman *Document Repository* (Penelusuran direktori arsip).
- `[ ]` Role-Based *Dashboard Overview* (Metrik untuk BPI, Kadep, dan Staf).

## 6. Integrasi & Finalisasi MVP
- `[ ]` Hubungkan *Frontend* dengan API (menggunakan Axios/Fetch).
- `[ ]` Terapkan penanganan *Error* & *Toast Notifications*.
- `[ ]` Lakukan pengujian Alur Kerja (Create Meeting ➔ Create Task ➔ Change Status).
- `[ ]` Lakukan pengujian *Soft Delete & Restore*.
- `[ ]` Pembersihan *Codebase* & Persiapan Produksi (V1).
