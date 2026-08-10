# PKKMB PROJECT — MASTER DOCUMENTATION

> **Tanggal:** 8 Agustus 2026
>
> **Sifat dokumen:** Dokumentasi otoritatif seluruh sistem PKKMB (Pengenalan Kehidupan Kampus bagi Mahasiswa Baru) Fakultas Teknik UNESA — Kabinet Danadyaksa 2026.
>
> **Sumber kebenaran:** Kode sumber (`backend/`, `pkkmb/`), skema database, test, dan konfigurasi. Dokumen ini **disusun dari audit kode nyata**, bukan dari rencana atau dokumentasi lama.
>
> **Aturan:** Jika terjadi konflik antara dokumen lama dan kode, maka **kode/implementasi nyata = sumber kebenaran**.

---

## 1. Project Overview

### 1.1 Identitas Sistem

| Aspek | Keterangan |
|-------|------------|
| Nama sistem | **PKKMB Portal** (bagian dari "Ekosistem Digital BEM FT UNESA") |
| Nama internal | `pkkmb` (Next.js app) + modul `PkkmbModule` (NestJS) |
| Branding UI | **Portal Adrata** (logo `logo_adrata.png`) |
| Periode | PKKMB FT UNESA 2026 (Kabinet Danadyaksa 2026) |
| Domain produksi (dari Caddyfile) | `pkkmb.bemftunesa.org` |
| Monorepo | npm workspaces + Turborepo (`turbo.json`) |

### 1.2 Tujuan

Mendigitalisasi rangkaian PKKMB Fakultas Teknik UNESA:

1. **Registrasi & Onboarding maba** — termasuk pembacaan otomatis data KTMS (OCR), data kesehatan, persetujuan & tanda tangan digital.
2. **Pembagian Gugus** — pembagian maba ke 50 gugus secara seimbang, penunjukan pendamping, ketua gugus, dan publikasi hasil.
3. **Presensi terpusat** — sesi presensi universal (MABA & PANITIA), check-in mandiri berbasis selfie, QR/manual operator, dan pengajuan izin/sakit.
4. **Penugasan** — distribusi tugas oleh pemateri/panitia, pengumpulan oleh maba, dan penilaian oleh evaluator.
5. **Quiz** — pretest/posttest/quiz materi dengan scoring backend, timer server-side, anti-cheat deterrence, dan import/export Excel.
6. **Informasi & komunikasi** — pengumuman, jadwal, dashboard maba & panitia, notifikasi, skor poin keaktifan.

### 1.3 Konteks & Pengguna

| Pengguna | Peran |
|----------|-------|
| **Maba** (Mahasiswa Baru) | Onboarding, melihat gugus, presensi, mengerjakan tugas & quiz, melihat poin |
| **Panitia PKKMB** | Operasional divisi (Acara, Humas, Pendamping, dll.); *read-only* data presensi |
| **Sie KSK** (Kesekretariatan) | Mengelola administrasi & sesi presensi (management) |
| **Sekretaris / Ketua Pelaksana / Pimpinan** | Monitoring & pengawasan operasional |
| **Super Admin** | Akses penuh seluruh sistem |

### 1.4 Masalah yang Diselesaikan

- Registrasi maba yang sebelumnya manual → alur digital + OCR KTMS.
- Pembagian gugus manual & tidak merata → algoritma distribusi seimbang.
- Presensi kertas → presensi digital real-time dengan peta live.
- Kecurangan quiz → scoring & timer server-side + anti-cheat deterrence.
- Pengelolaan tugas manual → portal tugas + grading digital.

### 1.5 Status Proyek

- **IMPLEMENTED:** Modul inti PKKMB (lihat bagian 25 — Current Implementation Status).
- **PLANNED / POLICY TARGET:** Struktur kepanitiaan resmi 13 Divisi (bagian 6) dan beberapa permission granular (bagian 8) yang belum terhubung ke role seed.
- **NOT IMPLEMENTED:** Beberapa method service yang tidak diekspos ke controller (lihat bagian 26 — Known Issues), modul Tata Tertib/Komdis masih placeholder frontend.

---

## 2. Project Scope

Status yang digunakan: **READY** / **PARTIAL** / **IN PROGRESS** / **PLANNED** / **NOT IMPLEMENTED**.

> Catatan: **READY** hanya diberikan untuk fitur yang kode-nya terverifikasi lengkap (controller → service → schema → frontend → test).

| Modul | Status | Keterangan |
|-------|--------|------------|
| Authentication (Google OAuth + login maba email/password, JWT cookies) | ✅ READY | `auth/`, frontend `/login` |
| Onboarding Maba (KTMS OCR, data diri, kesehatan, pasfoto, consent) | ✅ READY | `pkkmb/onboarding`, `OnboardDto`, `HealthService`, `KtmsOcrService` |
| Master Data (Rumpun, Program Studi) | ✅ READY | `seed-gugus.ts`, `master/rumpun`, `master/study-programs` |
| Gugus (50 gugus, pendamping, auto-distribute, rebalance, publish) | ✅ READY | `pkkmb_gugus`, `seed-gugus.ts`, `seed-pendamping-50.ts` |
| Distribusi gugus — semua prodi merata + rata cowo/cewe SETIAP gugus | ✅ READY | `gugus-assignment.ts` (skor prodi → genderGap → fine-tuning → total) + 17 test; `assignMabaToGroup`, `autoDistributeGugus`, `rebalanceGugus` memakai fungsi sama |
| Presensi PKKMB multi-fase (Pra-PKKMB online, Day 1–2 hybrid, Day 3–4 offline — sesi per tanggal, check-in selfie/QR/manual, izin/sakit, monitoring) | ✅ READY | `PkkmbAttendanceSession/Record`, `checkin.spec.ts`; fase dibedakan via `date`+`title` sesi (belum ada field `phase`, lihat §12.5) |
| RBAC Presensi — KSK manage, panitia read-only | ✅ READY | `assertAttendanceManager`, `attendance-rbac.spec.ts` (test terbukti) |
| Penugasan (task, submission, grading) | ✅ READY | `PkkmbTask`, `PkkmbSubmission`, `task-status.ts` |
| Quiz (CRUD, attempt lifecycle, scoring backend) | ✅ READY | `PkkmbQuiz`, `PkkmbQuizAttempt`, `quiz-scoring.ts`, `quiz-attempt.spec.ts` |
| Quiz Import/Export Excel | ✅ READY | `quiz-import-export.ts` + spec (backend & frontend) |
| Quiz Anti-Cheat / Anti-AI Deterrence | ✅ READY (monitoring; **bukan deteksi AI mutlak**) | `quiz-anticheat.ts` + spec |
| Dashboard Maba / Panitia / Admin | ✅ READY | `dashboard/maba`, `dashboard/panitia`, `dashboard/admin` |
| Pengumuman & Jadwal | ✅ READY | `PkkmbAnnouncement`, `PkkmbSchedule` |
| Poin Keaktifan (skor) | 🟡 PARTIAL | `PkkmbPointLog`; API `maba/points` ada; **tidak ada endpoint admin untuk menambah poin** yang diekspos |
| Tata Tertib / Komdis | 🟡 PARTIAL | Halaman frontend placeholder (`manage/komdis`); method service `getIncidents` **tidak diekspos** di controller |
| Export presensi CSV | 🟡 PARTIAL | Method service `exportAttendanceToCsv` ada tetapi **tidak diekspos** ke controller |
| Mentor manual check-in | 🟡 PARTIAL | Method service `getMentorAttendanceSessions` / `mentorManualCheckin` ada tetapi **tidak diekspos** ke controller |
| Auto-assign gugus (`autoAssignGroups`) | 🟡 PARTIAL | Diekspos (`POST admin/groups/auto-assign`) tetapi bergantung role `maba` yang **tidak ada di seed role** (potensi bug, lihat bagian 26) |
| Permission granular KSK via `division` check | ✅ READY | Implementasi service + test (`attendance-rbac.spec.ts`) |
| Permission granular `ATTENDANCE_*` di enum & seed | ✅ READY | Enum + seed-rbac; **belum semua** dipakai di controller (controller masih gate `MONITORING_READ`) |
| Struktur kepanitiaan resmi 13 Divisi | 🔵 PLANNED / POLICY TARGET | Kode seed hanya memakai subset divisi (lihat bagian 6) |
| Deploy production (docker-compose + Caddy) | ✅ READY (konfigurasi tersedia) | `docker-compose.yml`, `Caddyfile`, GitHub Actions |

---

## 3. System Architecture

### 3.1 Diagram Arsitektur

```text
┌─────────────────────────────────────────────────────┐
│                    PKKMB Portal                      │
│                  Next.js 16 (pkkmb/)                 │
│           port 3002 (dev) · pkkmb.bemftunesa.org     │
│  Pages: login · onboarding · dashboard · presensi    │
│         tugas · quiz · poin · profil · manage/*      │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/REST (axios/fetch) + cookie httpOnly
                         ▼
┌─────────────────────────────────────────────────────┐
│               Backend API (NestJS 11)                │
│                backend/ · port 4000                  │
│              prefix: /api/v1 · CORS strict           │
├─────────────────────────────────────────────────────┤
│ Auth (Google OAuth + JWT) → JwtAuthGuard             │
│ RBAC → PermissionsGuard + @RequiredPermissions       │
│ ValidationPipe (whitelist + forbidNonWhitelisted)    │
│ ThrottlerGuard (rate limit) · Helmet · Compression   │
│ Interceptor: Transform + Performance · EventEmitter  │
├─────────────────────────────────────────────────────┤
│ Modul: PkkmbModule (PkkmbController,                │
│        KtmsOcrController, HealthController)          │
│ Service: PkkmbService · HealthService · KtmsOcrSvc   │
└───────────────┬─────────────────────┬────────────────┘
                │                     │
                ▼                     ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│    MongoDB 6 (Mongoose) │  │   Redis 7 (ioredis)     │
│    users, roles,        │  │   cache (cachedQuery)   │
│    pkkmb_gugus,         │  │   distributed lock       │
│    pkkmb_quizzes, ...   │  │   BullMQ (bg jobs)      │
└─────────────────────────┘  └─────────────────────────┘
```

### 3.2 Hubungan Komponen

1. **Frontend (Next.js)** memanggil API melalui `fetch`/`axios` dengan `credentials: "include"` (cookie httpOnly dibawa otomatis). Base URL dari `NEXT_PUBLIC_API_URL` (di-strip `/api/v1` lalu ditambahkan ulang oleh `pkkmb/src/lib/api.ts`).
2. **Middleware Next.js** (`pkkmb/src/middleware.ts`) memproteksi `/dashboard/*` (tanpa cookie `accessToken` → redirect ke `/login`) dan mengarahkan user terautentikasi menjauh dari `/login`.
3. **Backend (NestJS)** menerima request → `RequestIdMiddleware` & `LoggingMiddleware` → `JwtAuthGuard` (validasi JWT) → `PermissionsGuard` (cek permission) → controller → service → Mongoose models.
4. **Database MongoDB** menyimpan seluruh data; **Redis** dipakai untuk cache query (`cachedQuery`), cache invalidation, distributed lock `autoDistributeGugus`, dan rate-limit per user check-in.
5. **Audit log** dicatat via `EventEmitter` (`audit.log`) → `AuditService` → collection `audit_logs` (alur `write-once, read-many` dipertahankan oleh aplikasi).

### 3.3 Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Frontend | Next.js (App Router) + React + Tailwind CSS | 16.2.12 / 19.2.4 / 4 |
| Backend | NestJS | 11 |
| Database | MongoDB (Mongoose) | 6 / 8.9.5 |
| Cache/Queue | Redis (ioredis, BullMQ) | 7 |
| Auth | JWT (passport-jwt) + Google OAuth 2.0 + bcrypt | — |
| Excel | `xlsx` | 0.18.5 |
| OCR | `tesseract.js` + `sharp` | 7 / 0.34.5 |
| ORM/ODM | Mongoose (`@nestjs/mongoose`) | 11 |

---

## 4. Repository Structure

```text
bemft-unesa-web/
├── backend/                    # NestJS API (data & business logic)
│   ├── src/
│   │   ├── auth/               # Google OAuth, JWT, guards, strategies, decorators
│   │   ├── common/             # auth (permissions), guards, filters, decorators, middleware
│   │   ├── pkkmb/              # ★ Modul PKKMB: controller, service, DTO, quiz-*, health, ktms-ocr
│   │   ├── schemas/            # ★ Semua Mongoose schema (termasuk PKKMB)
│   │   ├── database/seeders/   # ★ seed-rbac, seed-gugus, seed-pendamping(-50)
│   │   ├── audit/              # Audit log (event listener)
│   │   ├── health/             # Health check endpoint (non-PKKMB)
│   │   └── ...                 # Modul lain ekosistem (content, gallery, letters, dll.)
│   ├── scripts/                # ★ Skrip uji/one-off (quiz_*, rbac_absensi, dll.)
│   ├── test/                   # e2e config
│   ├── .env.example
│   └── package.json
├── pkkmb/                      # ★ PKKMB Portal (Next.js)
│   ├── src/
│   │   ├── app/                # (landing), login, onboarding, dashboard/** , verify
│   │   ├── components/         # quiz/QuizForm, onboarding/*, layout/*, landing/*
│   │   ├── lib/                # ★ api, quiz, quiz-anticheat, quiz-import-export, presensi-time
│   │   ├── middleware.ts       # Proteksi route /dashboard
│   │   └── globals.css
│   ├── next.config.ts          # output: standalone
│   └── package.json
├── frontend/                   # Website publik (portal umum BEM FT)
├── ims/                        # Internal Management System (fungsionaris)
├── packages/                   # Shared packages (@bemft/types, @bemft/permissions)
├── docs/                       # Dokumentasi (file ini)
├── scripts/deploy/             # vps_deploy.sh, restart_services.sh, rollback.sh
├── docker-compose.yml          # api, public_web, ims_web, pkkmb_web, caddy, db, redis
├── Caddyfile                   # Reverse proxy + auto-SSL
├── DEPLOYMENT.md
├── CHANGELOG.md
└── turbo.json
```

Folder penting: `backend/src/pkkmb/`, `backend/src/schemas/`, `backend/src/database/seeders/`, `pkkmb/src/app/dashboard/`, `pkkmb/src/lib/`.

---

## 5. User & Role Model

### 5.1 Konsep

- **Authentication** = membuktikan *siapa* user (Google OAuth / email+password / JWT).
- **Authorization** = *apa yang boleh* dilakukan user setelah terautentikasi.
- **Permission** = aksi atomik (mis. `pkkmb.quiz.create`), disimpan di collection `permissions`.
- **Role** = kumpulan permission, disimpan di collection `roles`; user memiliki satu role (field `user.role`).

> **Penting:** Visibilitas menu di frontend **BUKAN security boundary**. Semua keputusan keamanan dilakukan backend (`PermissionsGuard` + `@RequiredPermissions` + cek ownership di service). Frontend hanya menyembunyikan menu berdasarkan `permissions` dari `/auth/me`.

### 5.2 Daftar Role (dari `seed-rbac.ts`)

| Role (slug) | Nama | Deskripsi | Permission inti |
|-------------|------|-----------|-----------------|
| `super_admin` | Super Admin | Akses penuh seluruh sistem | `manage:all` (wildcard) |
| `pimpinan` | Pimpinan BEM & SC | Monitoring & pengawasan eksekutif | `monitoring.read`, `announcement.read`, `schedule.read`, `grading.read_all/update`, `group.read_all`, `task.*` (read/create/update), `quiz.*` (read/create/update/delete/submit/result), `attendance.read`, `profile.*` |
| `ketua_pelaksana` | Ketua Pelaksana | Pengawas seluruh modul operasional | Seperti `pimpinan` + `announcement.create`, `registration.manage`, `group.publish` |
| `sekretaris` | Sekretaris Pelaksana | Pengelola administrasi pengumuman, jadwal, presensi & berkas | `monitoring.read`, `announcement.*` (read/create/update/publish), `schedule.*` (read/create/update), `attendance.read/session_create/update/export`, `grading.read_all/update`, `task.*`, `quiz.*`, `registration.manage`, `group.publish`, `profile.*` |
| `bendahara` | Bendahara Pelaksana | Pengelola keuangan & monitoring | `monitoring.read`, `profile.*` |
| `panitia` | Panitia PKKMB | Anggota operasional divisi | `monitoring.read`, `announcement.read`, `schedule.read`, `group.read_own`, `grading.read_own/create/update`, `task.*`, `quiz.*`, `attendance.read` (**read-only**), `attendance.checkin`, `profile.*` |
| `user` | Mahasiswa Baru | Peserta PKKMB | `announcement.read`, `schedule.read`, `group.read_own`, `task.read/submit`, `quiz.read/submit/result`, `attendance.checkin`, `profile.*`, `health.read_own/write_own`, `consent.read_own/write_own` |

> Catatan: role `maba` disebut di beberapa method service (mis. `autoAssignGroups`) tetapi **tidak ada di seed role** (hanya `user` yang ada). Lihat Known Issues bagian 26.

> **KSK BUKAN role.** KSK = singkatan **Divisi Kesekretariatan** — sebuah **division** di dalam role `panitia` (user ber-role `panitia` + `division: "Sie KSK"`). KSK tidak pernah menjadi `roleSlug`; ia hanya nilai field `division` (lihat §6 dan §8.3).

### 5.3 Sumber Permission

- Enum: `backend/src/common/auth/pkkmb-permissions.ts` (`PkkmbPermission`).
- Seed: `backend/src/database/seeders/seed-rbac.ts` (63 permission, 7 role, 11 akun demo).
- JWT memuat `permissions[]`, `roleSlug`, `roleId` (dihasilkan `AuthService.generateTokens`).

---

## 6. Struktur Kepanitiaan PKKMB

### 6.1 Istilah Resmi

Dokumen ini menggunakan istilah resmi **"Divisi"**. Namun **audit kode menunjukkan** bahwa:

- Data `division` pada user/seed memakai awalan **"Sie"** secara **seragam**: `"Sie Acara"`, `"Sie Humas"`, `"Sie Pendamping"`, dan **`"Sie KSK"`** (Kesekretariatan).
- Nilai lama `"KSK"` di database existing tetap dikenali (case-insensitive, lihat §8.3) — backward compatible.
- **KSK = Divisi Kesekretariatan** (singkatan), **bukan role** — ia nilai `division` pada user ber-role `panitia`. Jangan membacanya sebagai role tersendiri.
- Hanya **subset** divisi yang benar-benar ada di seed (`seed-rbac.ts` demo users).

### 6.2 Divisi yang Terverifikasi di Kode

| Divisi (nilai `division` di DB) | Terlihat di | Modul terkait |
|-------------------------------|-------------|---------------|
| `Sie Acara` | seed-rbac (Koordinator Sie Acara) | Jadwal/Schedule, Pemateri |
| `Sie Humas` | seed-rbac (Koordinator Sie Humas) | Tidak ada modul khusus divisi — permission panitia umum (baca pengumuman/jadwal, presensi read-only); pengumuman dikelola Inti (ketua/sekretaris) |
| `Sie Pendamping` | seed-rbac, seed-pendamping(-50) (50 pendamping) | Gugus, check-in manual gugus, set/unset ketua gugus |
| `Sie KSK` (Kesekretariatan) | seed-rbac (Koordinator Sie KSK), `attendance-rbac.spec.ts` | **Management presensi** (create/update sesi, verifikasi izin) |
| `Inti` | seed-rbac (Ketua Pelaksana, Sekretaris, Bendahara) | Kepengurusan inti |
| `SuperAdmin` | seed-rbac | Admin sistem |
| `Pimpinan` | seed-rbac | Pimpinan BEM & SC |
| `Peserta` | seed-rbac (MABA demo) | Maba |

### 6.3 Struktur Kepanitiaan Resmi (13 Divisi) — POLICY TARGET

Struktur 13 divisi berikut merupakan **kebijakan resmi** (dari perencanaan kepanitiaan) dan **belum seluruhnya direpresentasikan** di seed/kode:

1. Divisi Acara
2. Divisi Hubungan Masyarakat (Humas)
3. Divisi Koordinator Lapangan (Korlap)
4. Divisi Perlengkapan (Perkap)
5. Divisi Publikasi, Dekorasi, dan Dokumentasi (PDD)
6. Divisi Pendamping
7. Divisi Konsumsi
8. Divisi Kesehatan
9. Divisi Keamanan
10. Divisi Sponsorship
11. Divisi Kesekretariatan (KSK)
12. Divisi Pemateri
13. Divisi Tata Tertib (Tatib)

> **Status: 🔵 PLANNED / POLICY TARGET.** Di kode, hanya Divisi Acara, Humas, Pendamping, dan KSK yang memiliki **data seed**; kaitan modul per divisi lihat §6.4 (Humas: akun tanpa modul khusus). Divisi lain belum ada datanya di repository. Tugas/akses per divisi **tidak boleh** dianggap sudah ada sebelum diimplementasikan.

### 6.4 Matriks Divisi → Modul & Permission (status implementasi)

Status mengikuti §25 (✅ READY / 🟡 PARTIAL / 🔴 NOT IMPLEMENTED / 🔵 PLANNED); di matriks ini dipakai ✅ / 🟡 / 🔵. Semua panitia (divisi apa pun) ber-role `panitia` sehingga memiliki permission panitia (task/quiz/attendance.read); **divisi hanya mengatur menu frontend & pengecualian operasional tertentu** (mis. KSK = management presensi, Pendamping = gugus). Backend tetap authority (permission + division check spesifik).

| # | Divisi Resmi | Nilai `division` di seed | Modul terkait | Permission / Guard | Status |
|---|--------------|--------------------------|---------------|--------------------|:------:|
| 1 | Divisi Acara | `Sie Acara` (akun demo) | Jadwal/Schedule, penugasan & quiz (menu frontend `isPemateri` = `pemateri` atau `acara`) | `schedule.read`, permission panitia (`task.*`, `quiz.*`); tanpa division check backend | 🟡 PARTIAL |
| 2 | Divisi Humas | `Sie Humas` (akun demo) | — (baca pengumuman/jadwal, presensi read-only) | permission panitia; tanpa modul khusus divisi | 🟡 PARTIAL |
| 3 | Divisi Korlap | — | — | — | 🔵 PLANNED |
| 4 | Divisi Perkap | — | — | — | 🔵 PLANNED |
| 5 | Divisi PDD | — | — | — | 🔵 PLANNED |
| 6 | Divisi Pendamping | `Sie Pendamping` (akun demo + `seed-pendamping-50`) | Gugus & pendampingan: portal pendamping (frontend `isPendamping`), set/unset ketua gugus; **check-in manual** — service ada, endpoint belum diekspos (§26.1) | `group.read_own`, `attendance.checkin`, division check pendamping (frontend) | 🟡 PARTIAL |
| 7 | Divisi Konsumsi | — | — | — | 🔵 PLANNED |
| 8 | Divisi Kesehatan | — | Modul kesehatan ada (`health.*`) tapi dikelola **user (own)** & admin — belum ada akun/kaitan divisi Kesehatan | `health.read_own/write_own` (user), `health.read_all/manage` (super admin) | 🔵 PLANNED (modul health utk maba/admin sudah READY, kaitan divisi belum ada) |
| 9 | Divisi Keamanan | — | — | — | 🔵 PLANNED |
| 10 | Divisi Sponsorship | — | — | — | 🔵 PLANNED |
| 11 | Divisi Kesekretariatan (KSK) | `Sie KSK` (akun demo) | **Management presensi**: create/update sesi, verifikasi izin/sakit, monitoring | `assertAttendanceManager` (division check case-insensitive `Sie KSK`/`KSK`/`ksk`), `attendance.read/session_create/update/export`; **bukan role** (§5.2) | ✅ READY |
| 12 | Divisi Pemateri | — (tidak ada akun seed) | Penugasan & Quiz: endpoint `pemateri/tasks`, `pemateri/submissions`, `manage/quiz`; menu frontend `isPemateri` | `task.create/update`, `quiz.create/update`, `grading.*` (permission `panitia`); tanpa division check backend | 🟡 PARTIAL |
| 13 | Divisi Tata Tertib (Tatib) | — (tidak ada akun seed) | Komdis / insiden — halaman `manage/komdis` placeholder; `getIncidents` di service tapi tidak diekspos | menu frontend `isTatib` (`tatib`/`komdis`/`tata tertib`); endpoint belum diekspos | 🟡 PARTIAL |

Catatan tambahan (di luar 13 divisi kepanitiaan):

- **Inti** (`division: 'Inti'`) — Ketua Pelaksana, Sekretaris, Bendahara: kelola pengumuman (`announcement.*`), jadwal (`schedule.*`), registrasi, publish gugus, dan **presensi** (sekretaris).
- **SuperAdmin** (`division: 'SuperAdmin'`) — admin sistem (`manage:all`).
- **Peserta** (`division: 'Peserta'`) — maba (`user`).
- Sesi presensi mendukung `targetDivision?` (filter opsional per divisi, mis. `"Sie Acara"`) — model sudah siap untuk sesi khusus divisi.

---

## 7. Authentication

### 7.1 Alur

```text
Login
 → Google OAuth (GET /api/v1/auth/google?state=pkkmb)  ATAU  POST /api/v1/auth/login (email+password)
 → validasi credential (auth.service)
 → generate JWT (access 7 hari, refresh 30 hari) + permission role
 → set cookie httpOnly: accessToken & refreshToken
 → request berikutnya: cookie dibawa otomatis
 → JwtAuthGuard (extract token dari cookie, fallback Authorization: Bearer)
 → CurrentUser (userId, role, permissions)
 → PermissionsGuard (cek permission yang dibutuhkan endpoint)
 → controller/service
```

### 7.2 Implementasi Nyata

| Komponen | File | Keterangan |
|----------|------|------------|
| Google OAuth guard | `auth/guards/google-oauth.guard.ts` | Start flow di `/auth/google` |
| Callback | `auth.controller.ts` `googleCallback` | Validasi email domain `@mhs.unesa.ac.id` / `@unesa.ac.id`; redirect ke `PKKMB_URL`/`IMS_URL` berdasar `state` |
| Login maba | `POST /api/v1/auth/login` | Email + password (bcrypt). Domain harus UNESA |
| Token | `auth.service.ts generateTokens` | JWT payload: `sub, email, permissions, roleSlug, roleId`; access = `JWT_EXPIRES_IN` (default 604800 dtk), refresh = 2592000 dtk |
| Refresh | `POST /api/v1/auth/refresh` | Verifikasi refresh token, terbitkan token baru |
| Switch role | `POST /api/v1/auth/switch-role` | Regenerasi token (endpoint ada; implementasi memakai role aktif user) |
| Logout | `POST /api/v1/auth/logout` | Hapus cookie (tanpa guard — stateless) |
| Profil | `GET /api/v1/auth/me` | Profil + `permissions` + `verificationToken` (NIM terenkripsi AES-256-CBC) |
| Verify NIM | `GET /api/v1/auth/verify-token/:token` | Dekripsi token NIM, balas data user |
| Cookie | `cookieOptions()` | `httpOnly, secure, sameSite=none, path=/`; domain `.bemftunesa.org` hanya saat produksi; dev = tanpa domain (port-scoped) |
| JWT strategy | `auth/strategies/jwt.strategy.ts` | Extract dari cookie `accessToken` → fallback `Bearer` header |

### 7.3 Catatan

- Password maba di-hash bcrypt (`$2b$`).
- Field verifikasi email/OTP masih ada di schema User tetapi **alur OTP/email-verification sudah dihapus** (lihat riwayat commit) — maba langsung lanjut ke onboarding.
- `verificationToken` dibangun dari NIM dengan AES-256-CBC berbasis `JWT_SECRET` (implementasi khusus, bukan standar JWT).

---

## 8. RBAC & Permission

### 8.1 Mekanisme

```text
JWT (berisi permissions + roleSlug)
 → user di-attach ke request oleh JwtAuthGuard
 → PermissionsGuard membaca @RequiredPermissions (REQUIRED_PERMISSIONS_KEY)
 → super admin (manage:all) lolos otomatis
 → selain itu: subset permission user ∩ required != ∅ → lolos, else 403
```

- `@RequiredPermissions(...)` (decorator) → metadata `required_permissions`.
- `PermissionsGuard` menggabungkan `user.permissions` (dari JWT) dan `role.permissions` (jika di-populate).
- `manage:all` = wildcard.
- Otorisasi tambahan berbasis **data** (mis. KSK via `division` dari database) dilakukan di **service** (`assertAttendanceManager`).

### 8.2 Daftar Permission (enum `PkkmbPermission`)

| Permission | Fungsi | Role yang memilikinya (seed) |
|-----------|--------|------------------------------|
| `pkkmb.monitoring.read` | Dashboard & statistik monitoring | pimpinan, ketua_pelaksana, sekretaris, bendahara, panitia (+ super admin via wildcard) |
| `pkkmb.audit.read` | Lihat audit log | (tidak di seed; hanya super admin via `manage:all`) |
| `pkkmb.settings.manage` | Kelola pengaturan portal | (tidak di seed; hanya super admin via `manage:all`) |
| `pkkmb.roles.read` / `pkkmb.roles.manage` | Kelola role | (super admin only via wildcard) |
| `pkkmb.permissions.read` | Lihat permission | (super admin only) |
| `pkkmb.users.manage` | Kelola akun | (super admin only) |
| `pkkmb.announcement.read/create/update/delete/publish/broadcast` | Pengumuman | read: semua; create/update/publish: sekretaris (create: ketua_pelaksana); delete/broadcast: (tidak di seed) |
| `pkkmb.schedule.read/create/update/delete/publish` | Jadwal | read: semua; create/update: sekretaris |
| `pkkmb.grading.read_all/read_own/create/update/export/statistics` | Penilaian tugas | read_all: pimpinan/ketua/sekretaris; read_own/create/update: panitia; export/statistics: (tidak di seed) |
| `pkkmb.task.read/create/update/delete/submit` | Penugasan | read/create/update: panitia, pimpinan, ketua, sekretaris; submit: user; delete: (tidak di seed) |
| `pkkmb.quiz.read/create/update/delete/submit/result` | Quiz | read/create/update/delete/submit/result: panitia, pimpinan, ketua, sekretaris; read/submit/result: user |
| `pkkmb.group.read_all/read_own/create/update/assign_mentor` | Grup/Gugus | read_all: pimpinan/ketua/sekretaris; read_own: panitia & user; create/update/assign_mentor: (tidak di seed) |
| `pkkmb.attendance.read` | Lihat presensi (read-only) | panitia, pimpinan, ketua, sekretaris |
| `pkkmb.attendance.session_create` | Buat sesi | sekretaris |
| `pkkmb.attendance.update` | Buka/tutup sesi & verifikasi izin | sekretaris |
| `pkkmb.attendance.delete` | Hapus record | (tidak di seed; service membatasi admin-only) |
| `pkkmb.attendance.export` | Export data presensi | sekretaris |
| `pkkmb.attendance.checkin` | Check-in | panitia, user |
| `pkkmb.registration.verify/manage/checkin/edit_biodata/upload_document` | Registrasi | manage: ketua_pelaksana, sekretaris |
| `pkkmb.group.publish` | Publish hasil gugus | ketua_pelaksana, sekretaris |
| `pkkmb.profile.read_own/update_own/read_all` | Profil | read_own/update_own: semua; read_all: (tidak di seed) |
| `pkkmb.health.read_own/write_own/read_all/manage` | Kesehatan | read_own/write_own: user; read_all/manage: (tidak di seed → hanya super admin) |
| `pkkmb.consent.read_own/write_own/read_all` | Persetujuan onboarding | read_own/write_own: user; read_all: (tidak di seed) |
| `manage:all` | Wildcard super admin | super_admin |

> **Catatan keamanan:** Endpoint yang membutuhkan permission yang tidak dimiliki role mana pun di seed (mis. `pkkmb.group.create` untuk `auto-distribute`, `pkkmb.settings.manage` untuk `admin/users`) praktis hanya bisa diakses Super Admin. Ini **bukan bug**, tapi perlu disadari oleh operator.

### 8.3 RBAC Presensi KSK (Implementasi Nyata — terverifikasi test)

File: `backend/src/pkkmb/pkkmb.service.ts` → `assertAttendanceManager(userId, opts)`.

- Identitas `userId` dari JWT; **role & division dibaca dari database** (bukan body/JWT).
- **KSK = Divisi Kesekretariatan** — sebuah **division**, bukan role: yang berhak mengelola adalah user ber-role `panitia` dengan `division: "Sie KSK"`.
- Yang boleh **mengelola** presensi (create/update sesi, verifikasi izin):
  1. Super Admin (`manage:all`)
  2. Sekretaris Pelaksana (permission `attendance.session_create` existing)
  3. Panitia dengan **division `Sie KSK`** (case-insensitive: `Sie KSK`, `KSK`, `ksk` — backward compatible dengan nilai lama)
- Panitia divisi lain: **READ-ONLY**.
- **DELETE record: hanya admin** (`manage:all`) — KSK/panitia/sekretaris tidak boleh.
- Semua method write wajib `actorId`; tanpa identitas → 403 (bukan dilewati).
- Manipulasi `role`/`division` di body tidak berpengaruh (`forbidNonWhitelisted` menolak field ekstra).
- Aksi management dicatat ke audit log (`CREATE/UPDATE/APPROVE/REJECT/DELETE`).

Bukti: `backend/src/pkkmb/attendance-rbac.spec.ts` — 20+ test matrix (create/update/verify/delete/IDOR/division-manipulation).

---

## 9. Maba / Mahasiswa

### 9.1 Data Maba (schema `User`)

| Field | Keterangan |
|-------|------------|
| `nim` | NIM (indexed sparse) |
| `name` | Nama lengkap |
| `email` | Email UNESA (unique, lowercase) |
| `studyProgram` / `studyProgramId` | Prodi (string) + referensi `StudyProgram` |
| `gender` | `L`/`P` |
| `phone` | WhatsApp |
| `ktmUrl` | URL KTM/KTMS |
| `emergencyContact` | Kontak darurat |
| `pkkmbGroup` | Referensi gugus (`PkkmbGroup`) |
| `role` | Role (`user` untuk maba) |
| `isOnboarded` | Sudah onboarding? |
| `verificationStatus` | `PENDING_VERIFICATION` / `VERIFIED` / `REJECTED` |
| `assignmentStatus` | `UNASSIGNED` / `ASSIGNED` / `PUBLISHED` |
| `isKetuaGugus` | Status ketua gugus |
| `isActive` | Aktif/tidak |

### 9.2 Alur Maba

1. **Login** Google OAuth (`state=pkkmb`) atau email+password.
2. **Onboarding 6 langkah** (`/onboarding`):
   - Langkah 1: **Upload KTMS** → OCR (`POST /pkkmb/ktms/ocr`, tesseract.js + master prodi) → preview.
   - Langkah 2: **Konfirmasi Data** → `POST /pkkmb/onboard` (nim, nama, prodi, gender, phone, avatar/KTM object key).
   - Langkah 3: **Data Kesehatan** → `PUT /pkkmb/health/me` (riwayat penyakit, BPJS, kontak darurat; klasifikasi risiko RENDAH/SEDANG/TINGGI).
   - Langkah 4: **Pasfoto Resmi** (unggah).
   - Langkah 5: **Persetujuan + Tanda Tangan Digital** → `POST /pkkmb/onboard/consent` (SignaturePad → data URL PNG; menyelesaikan onboarding, `isOnboarded=true`).
   - Langkah 6: **Penetapan Adrista (Gugus)** → sistem menetapkan gugus (`assignMabaToGroup`) dengan aturan: gugus berisi campuran **semua prodi** dan **rata cowo/cewe di setiap gugus** (skor prodi → genderGap → fine-tuning → total di `gugus-assignment.ts`).
3. **Dashboard Maba** → lihat gugus, jadwal, pengumuman, presensi, tugas, quiz, poin.

### 9.3 Verifikasi

- `verificationStatus` default `PENDING_VERIFICATION` setelah onboarding.
- Admin dapat `PATCH /pkkmb/admin/maba/:id/verify` / `reject` (permission `registration.manage`).

---

## 10. Master Data

| Master | Collection | Seed | Endpoint | Permission |
|--------|-----------|------|----------|------------|
| Rumpun Akademik | `pkkmb_rumpun` | `seed-gugus.ts` (5 rumpun) | `GET /pkkmb/master/rumpun` | JWT saja |
| Program Studi | `pkkmb_study_programs` | `seed-gugus.ts` (17 prodi) | `GET /pkkmb/master/study-programs` | JWT saja |
| Gugus | `pkkmb_gugus` | `seed-gugus.ts` (50 gugus) | `GET /pkkmb/gugus` | JWT saja |
| Role | `roles` | `seed-rbac.ts` (7 role) | (via roles module ekosistem) | — |
| Permission | `permissions` | `seed-rbac.ts` (63) | (via roles module) | — |
| Penyakit (kesehatan) | `health_conditions` | — (dibuat via API/admin) | `GET/POST/DELETE /pkkmb/health/conditions` | `pkkmb.health.manage` |

> Rumpun: Teknik Mesin, Teknik Elektro, Teknik Informatika, Teknik Sipil, PKK. Prodi tersedia 17 (S1 & D4, Fakultas Teknik).

---

## 11. Gugus

### 11.1 Konsep

- **50 Gugus** (Gugus 01 – Gugus 50), collection `pkkmb_gugus`.
- Setiap gugus: `nomor` (unique), `name` (mis. `Gugus 01 - Garuda Teknik 01`), `kapasitas` (60), `pendampingId`/`pendampingName`/`pendampingWhatsApp`/`pendampingEmail`, `ketuaGugusId`, `totalPoints`, `status` (`ACTIVE`/`INACTIVE`), `grupLink`.
- Nama gugus di-update oleh `seed-pendamping.ts`/`seed-pendamping-50.ts` menjadi nama sejarah (Majapahit, Sriwijaya, ...) beserta data 50 pendamping.

### 11.2 Distribusi (implementasi nyata)

**Kebijakan penempatan gugus (8 Agustus 2026):** setiap gugus harus berisi anggota dari **semua prodi yang ada** DAN komposisi **cowo/cewe yang rata di SETIAP gugus** (selisih ≤ 1 terhadap proporsi keseluruhan — selama data gender tersedia; jika populasi memang timpang, algoritma menyebar secara proporsional). Implementasi memakai modul murni `gugus-assignment.ts` dengan skor keseimbangan:

```text
score = prodiN × 10000 + genderGapN × 100 + sameGenderProdiN × 1 + totalN × 1
       └─ prioritas #1 ─┘  └─ prioritas #2 ─┘    └─ fine-tuning ─┘   └─ tie-break ─┘

prodiN           = jumlah anggota sesama prodi di gugus (semua prodi tersebar)
genderGapN       = selisih BERARAH (sesama gender − lawan gender) di gugus,
                   dihitung relatif gender maba yang ditempatkan:
                   • maba cowo  → genderGapN = cowoN − ceweN
                   • maba cewe  → genderGapN = ceweN − cowoN
                   Skor terkecil = gugus yang “kekurangan” gender maba → maba
                   ditempatkan ke sana → cowo/cewe merata di SETIAP gugus
                   (nilai negatif diperbolehkan dan diinginkan).
sameGenderProdiN = anggota sesama prodi DAN sesama gender (fine-tuning agar
                   dalam satu prodi juga tersebar, bobot kecil)
totalN           = total anggota gugus (tie-break terakhir)
```

Bobot **leksikografis ketat** (kapasitas gugus ≤ 99): 1 unit `prodiN` > selisih
maksimum `genderGapN`; 1 unit `genderGapN` > selisih maksimum
`sameGenderProdiN`/`totalN` → prioritas #1, #2, dan tie-break tidak pernah
saling mendahului.

**Mengapa perlu `genderGapN` (tidak cukup `sameGenderProdiN`)?** Skor lama hanya
menyeimbangkan gender *dalam satu prodi yang sama*. Bila prodi A mayoritas cowo
dan prodi B mayoritas cewe, hasil akhir bisa timpang (beberapa gugus 2 cowo,
beberapa 2 cewe). `genderGapN` berarah menyeimbangkan gender secara **global per
gugus** — teruji oleh simulasi di `gugus-assignment.spec.ts` (prodi X: 8L+2P,
prodi Y: 2L+8P → 10 gugus → selisih cowo-cewe ≤ 1 di semua gugus).

`pickBestGugus()` memilih gugus dengan skor terkecil — deterministik, murni, dan teruji (`gugus-assignment.spec.ts`, 17 test).

| Method | Algoritma |
|--------|-----------|
| `assignMabaToGroup` (per user, saat consent — dipakai alur onboarding) | Agregasi per gugus: total, sesama prodi, sesama prodi+gender, jumlah cowo/cewe → `pickBestGugus` (skor prodi → genderGap → fine-tuning → total) |
| `autoDistributeGugus` (`POST /pkkmb/gugus/auto-distribute`) | **Algoritma sama** (`simulateGugusAssignment`); **distributed lock Redis**; hanya maba `VERIFIED` + `UNASSIGNED`; deterministik (urut NIM) |
| `rebalanceGugus` (`POST /pkkmb/gugus/rebalance`) | **Algoritma sama** (`simulateGugusAssignment`) → setiap gugus semua prodi + cowo/cewe rata (selisih ≤1); deterministik (urut NIM) |
| `autoAssignGroups` (`POST /pkkmb/admin/groups/auto-assign`) | Round-robin bucket `{department}_{gender}`, dry-run default; role dicari dengan `$or: [maba, user, 'Mahasiswa Baru']` (bug slug `maba` diperbaiki) — **legacy, belum memakai skor baru** |

> **Jaminan hasil:** `assignMabaToGroup` (onboarding), `autoDistributeGugus`, dan
> `rebalanceGugus` memakai satu fungsi yang sama (`simulateGugusAssignment` /
> `buildCountsByGugus` + `pickBestGugus`) → hasil akhir konsisten: semua prodi
> di semua gugus + selisih cowo-cewe ≤ 1 per gugus (diverifikasi oleh simulasi
> test; jika gender tidak tersedia untuk sebagian maba, tersebar proporsional).
> `autoAssignGroups` adalah jalur legacy (round-robin per bucket).

### 11.3 Publikasi

- `POST /pkkmb/admin/gugus/publish` → semua `ASSIGNED` menjadi `PUBLISHED` + simpan config `pkkmb_publish_config`.
- `POST /pkkmb/admin/gugus/schedule-publish` → jadwalkan (`publishType: SCHEDULED`).
- `GET /pkkmb/admin/gugus/publish-config` → lihat konfigurasi.
- Permission: `pkkmb.group.publish` (ketua_pelaksana, sekretaris).
- **Ketua gugus** ditetapkan manual oleh pendamping: `POST /pkkmb/admin/groups/set-ketua` / `unset-ketua`.

> Jumlah gugus = **50** hanya berdasarkan seed (`seed-gugus.ts`), **belum diverifikasi dari runtime DB** (lihat bagian 27).

---

## 12. Presensi

### 12.0 Konsep: Satu Sistem, Multi-Fase

Modul Presensi digunakan untuk mencatat kehadiran peserta PKKMB pada **beberapa fase pelaksanaan** kegiatan — bukan satu event tunggal. Sistem presensi dirancang untuk mendukung tiga kondisi pelaksanaan:

1. **Pra-PKKMB — Full Online**
2. **PKKMB Day 1–2 — Hybrid**
3. **PKKMB Day 3–4 — Full Offline**

Perbedaan mode pelaksanaan tersebut harus diperhatikan dalam desain workflow, validasi kehadiran, serta mekanisme monitoring presensi.

> **Istilah penting — jangan tertukar:**
> - **Mode pelaksanaan** = bagaimana kegiatan berjalan (online / hybrid / offline).
> - **Mekanisme presensi** = bagaimana kehadiran dicatat (selfie, QR, operator manual).
> Keduanya berbeda: satu fase boleh memakai beberapa mekanisme presensi, dan satu mekanisme boleh dipakai di banyak fase.

### 12.1 Fase 1 — Pra-PKKMB (Full Online)

Fase sebelum pelaksanaan utama; **seluruh peserta mengikuti kegiatan secara daring**.

Presensi pada fase ini berfungsi ganda:

- presensi peserta Pra-PKKMB;
- **pengujian awal modul Presensi** (real-world testing) — login, akses presensi, validasi identitas, pencatatan waktu, status kehadiran, monitoring, validasi data, dan kemampuan menangani banyak peserta bersamaan;
- validasi kesiapan sistem sebelum PKKMB utama.

Karena seluruh peserta online, mekanisme presensi memakai workflow online yang tersedia (self-check-in).

> **Pra-PKKMB bukan sekadar data dummy atau simulasi** — tahap penggunaan nyata sekaligus validasi kesiapan sistem. Temuan dari fase ini digunakan untuk perbaikan sebelum Day 1 (stabilitas, performa endpoint, kapasitas DB, concurrent attendance, UX, potensi penyalahgunaan).

**Data Pra-PKKMB harus tetap dapat dibedakan dari data PKKMB Day 1–4** (lihat 12.5).

### 12.2 Fase 2 — PKKMB Day 1–2 (Hybrid)

Sebagian peserta hadir **offline**, sebagian **online**. Sistem harus mampu membedakan / mengakomodasi metode kehadiran sesuai kondisi pelaksanaan.

Minimal tersimpan: peserta, kegiatan/hari, waktu presensi, status kehadiran, dan metode kehadiran.

```text
PKKMB Day 1
├── Offline
│   └── Peserta hadir secara langsung
└── Online
    └── Peserta mengikuti kegiatan secara daring
```

Hal yang perlu diperhatikan:

- peserta online **tidak boleh diperlakukan sama persis** dengan peserta offline jika mekanisme validasinya berbeda;
- peserta offline tetap tercatat secara digital (sistem sebagai sumber data utama);
- monitoring melihat keseluruhan kehadiran dalam satu kegiatan;
- data presensi harus dapat dibedakan per hari/kegiatan.

### 12.3 Fase 3 — PKKMB Day 3–4 (Full Offline)

Seluruh peserta hadir secara fisik di lokasi. Mekanisme validasi kehadiran offline (QR / operator panitia) yang tersedia di sistem digunakan.

Tujuan utama:

- memastikan peserta benar-benar tercatat hadir;
- mencatat waktu kehadiran;
- meminimalkan manipulasi presensi;
- mempermudah monitoring panitia;
- menghasilkan rekap kehadiran peserta.

### 12.4 Tabel Mode Pelaksanaan

| Fase | Mode kegiatan | Tujuan sistem |
|------|---------------|---------------|
| **Pra-PKKMB** | Full Online | **Testing nyata + presensi** |
| **Day 1** | Hybrid | Presensi online + offline |
| **Day 2** | Hybrid | Presensi online + offline |
| **Day 3** | Full Offline | Presensi offline |
| **Day 4** | Full Offline | Presensi offline |

### 12.5 Pemetaan Fase → Implementasi Aktual (jujur)

**Yang didukung kode saat ini (terverifikasi):**

| Fase | Representasi di sistem | Mekanisme presensi yang relevan |
|------|------------------------|---------------------------------|
| Pra-PKKMB | Sesi dengan `isOnline: true` + tanggal fase | `SELF_CHECKIN` (selfie kamera) |
| Day 1–2 | Sesi `isOnline: true` (peserta online) + sesi `isOnline: false`/terpisah (peserta offline) pada tanggal yang sama | `SELF_CHECKIN` (online) + `QR_CODE` / `MANUAL_OPERATOR` (offline) |
| Day 3–4 | Sesi `isOnline: false` (default) | `QR_CODE` / `MANUAL_OPERATOR` / `SEARCH_NIM` |

- Sesi presensi dibuat **per tanggal/kegiatan** (`date`, `title`) → satu fase/hari = satu atau lebih sesi (`PkkmbAttendanceSession`).
- `isOnline` menandai sesi daring → pada self check-in **geofence dilewati**.
- `attendanceMethod` pada record membedakan mekanisme: `QR_CODE`, `MANUAL_OPERATOR`, `SEARCH_NIM`, `SELF_CHECKIN`.
- `targetParticipantType` (`ALL`/`MABA`/`PANITIA`) memisahkan target peserta per sesi.
- Unique index `(session, participant)` → satu peserta maksimal satu record per sesi.

**Yang BELUM ada (design target / catatan):**

- ❌ **Tidak ada field `phase` (PRA_PKKMB / DAY_1 / …) di schema** — fase dibedakan secara konvensional via `date` + `title` sesi. Rekap per fase dilakukan dengan filter tanggal/judul sesi, bukan enum fase formal.
- ❌ Belum ada konfigurasi workflow yang berbeda per fase (mis. aturan validasi khusus online vs offline) — semua sesi memakai workflow check-in yang sama.
- ❌ Export CSV presensi: method service ada, endpoint **belum diekspos** (lihat bagian 2 & 26).

### 12.6 Pemisahan Data Presensi (konseptual)

```text
Presensi
│
├── Pra-PKKMB
│   └── Full Online
│
├── PKKMB Day 1
│   └── Hybrid
│       ├── Online
│       └── Offline
│
├── PKKMB Day 2
│   └── Hybrid
│       ├── Online
│       └── Offline
│
├── PKKMB Day 3
│   └── Full Offline
│
└── PKKMB Day 4
    └── Full Offline
```

Data presensi minimal dapat dibedakan berdasarkan: fase/kegiatan, hari, peserta, waktu, status kehadiran, dan metode kehadiran (`attendanceMethod`).

### 12.7 Pemetaan Akses (terverifikasi kode + test)

| Aksi | Siapa |
|------|-------|
| Buat/ubah status sesi | Sie **KSK** (panitia + division `Sie KSK`), Sekretaris, Super Admin |
| Verifikasi izin/sakit | Sie **KSK**, Sekretaris, Super Admin |
| Hapus record | **Admin** (manage:all) saja |
| Lihat monitoring/sesi/izin (read-only) | Panitia/divisi lain, pimpinan, bendahara (200) |
| Check-in mandiri | Maba & panitia (`attendance.checkin`) |

> Kebijakan: KSK menangani administrasi presensi; panitia divisi lain **read-only** untuk monitoring; admin sesuai permission. Frontend hanya menyembunyikan/menampilkan menu — **keamanan nyata di backend** (permission guard).

### 12.8 Model

**Sesi** (`pkkmb_attendance_sessions`): `title, date, startTime, endTime, location, isOnline, targetParticipantType (ALL/MABA/PANITIA), targetDivision, qrCode, qrExpiry, status (DRAFT/PUBLISHED/CLOSED), createdBy`.

**Record** (`pkkmb_attendance_records`): `session, participant, participantType (MABA/PANITIA), role, division, checkInTime, checkOutTime, status (Hadir/Telat/Izin/Sakit/Tidak Hadir), attendanceMethod (QR_CODE/MANUAL_OPERATOR/SEARCH_NIM/SELF_CHECKIN), operator, device, ipAddress, lat/lng, photoUrl, proofUrl, reason, izinStatus (NONE/PENDING/APPROVED/REJECTED)`.

Unique index `(session, participant)` → mencegah duplikat check-in (final protection E11000).

### 12.9 Workflow Check-in

```text
MABA: pilih sesi → ambil selfie (kamera) → upload selfie (POST /contents/upload)
      → POST /pkkmb/attendance/checkin {sessionId, method: SELF_CHECKIN, photoUrl}
      → backend: validasi sesi PUBLISHED + periode [startTime,endTime] (server time/WIB)
      → validasi photoUrl wajib untuk SELF_CHECKIN
      → cek duplikat (unique index) → simpan record → (status Hadir)
```

- Metode lain: `QR_CODE` (validasi token QR + expiry), `MANUAL_OPERATOR` (operator panitia), `SEARCH_NIM`.
- Rate limit: `@Throttle` 10/min per IP + Redis rate limit 5/min per user.
- **Telat** (manual operator): poin -5 dicatat ke `pkkmb_point_logs` (source `Kehadiran`).
- Sesi online (`isOnline: true`) → skip geofence.

### 12.10 Izin / Sakit

```text
MABA: POST /pkkmb/attendance/izin {sessionId, izinType: Izin|Sakit, reason, proofUrl?}
      → record izinStatus = PENDING
KSK/Sekretaris/Admin: GET /pkkmb/attendance/izin/pending → POST /pkkmb/attendance/izin/verify
      → APPROVED (status Izin/Sakit) atau REJECTED (status Tidak Hadir)
```

### 12.11 Monitoring

- `GET /pkkmb/attendance/monitoring` — laporan + statistik; **scope data per gugus** untuk panitia non-admin (pembatasan di service).
- `GET /pkkmb/attendance/my-history` — riwayat sendiri.
- Frontend `manage/attendance`: peta live (Leaflet), log real-time (polling 10 detik), mode baca-saja untuk panitia non-KSK.

---

## 13. Quiz Module

### 13.1 Model

**Quiz** (`pkkmb_quizzes`):

| Field | Tipe | Keterangan |
|-------|------|------------|
| `title`, `description` | string | Judul & deskripsi |
| `type` | enum | `PRETEST` / `POSTTEST` / `MATERIAL` |
| `status` | enum | `DRAFT` / `PUBLISHED` / `CLOSED` (default DRAFT) |
| `questions` | embedded[] | `{question, options[{id,text}], correctAnswer, points, order}` |
| `targetType` | enum | `ALL` / `FACULTY` / `STUDY_PROGRAM` / `GROUP` / `INDIVIDUAL` |
| `targetIds` | mixed[] | ObjectId prodi/grup/user atau nama fakultas |
| `startTime`, `endTime` | date | Periode pengerjaan (WIB) |
| `durationMinutes` | number | Durasi per attempt (default 30) |
| `maxAttempts` | number | Maksimal percobaan (default 1) |
| `passingScore` | number | **Persentase** 0–100 (default 0) |
| `createdBy` | ref User | Pembuat |
| `deletedAt` | date | Soft delete |

**Attempt** (`pkkmb_quiz_attempts`): `quizId, userId, answers[{questionId, selectedAnswer, isCorrect, points}], score, correctCount, totalQuestions, percentage, status (IN_PROGRESS/SUBMITTED/GRADED/EXPIRED), startedAt, submittedAt, attemptNumber, antiCheat{violationCount, violations[], riskLevel, lastHeartbeatAt}`.

Unique index `(quizId, userId, attemptNumber)`.

### 13.2 Lifecycle Attempt

```text
Start (GET /quiz/:id/start)
 ├─ validasi: quiz ada (deletedAt null), ditargetkan ke user, status PUBLISHED,
 │            dalam periode, punya soal, maxAttempts belum terpakai
 ├─ resume: attempt IN_PROGRESS aktif & belum lewat deadline → lanjut (TIDAK buat baru)
 ├─ expired: IN_PROGRESS lewat deadline → status EXPIRED (tidak memakai slot attempt)
 └─ buat attempt baru IN_PROGRESS (attemptNumber = max+1)
     (race E11000 → 400 "Muat ulang halaman")

Save jawaban (PATCH /quiz/:id/attempt/:attemptId/answers)
 └─ hanya IN_PROGRESS milik user, dalam deadline → simpan questionId+selectedAnswer

Submit (POST /quiz/:id/attempt/:attemptId/submit)
 └─ backend grade: gradeQuizAnswers (jawaban benar diambil dari DB)
 └─ hasil: score, correctCount, totalQuestions, percentage, passed = percentage >= passingScore
 └─ status → SUBMITTED

Result (GET /quiz/:id/result/:attemptId)
 └─ hanya milik user sendiri; menampilkan quiz title/type/passingScore + hasil
```

### 13.3 Targeting

- `ALL` → semua maba.
- `FACULTY` → targetIds berisi nama fakultas; dicek via `studyProgram.faculty`.
- `STUDY_PROGRAM` → targetIds berisi ObjectId prodi; dicek via `user.studyProgramId`.
- `GROUP` → targetIds berisi ObjectId gugus; dicek via `user.pkkmbGroup`.
- `INDIVIDUAL` → targetIds berisi ObjectId user.
- Filter diterapkan di `listStudentQuizzes`/`quizTargetFilter` dan `isQuizTargetedTo` (server-side).

### 13.4 Scoring (backend authority)

File: `backend/src/pkkmb/quiz-scoring.ts` — `gradeQuizAnswers(questions, answers)`:
- soal diurutkan berdasar `order`; jawaban benar dibandingkan dengan `correctAnswer` dari DB.
- `score = Σ points benar`; `percentage = round(score/maxScore * 100)`.
- **Input dari client (score/correctCount/percentage) tidak pernah dipercaya.**

### 13.5 Quiz Sebagai Assignment (integrasi §18)

Quiz dapat dikonsumsi dengan **dua cara**:

1. **Standalone** — student melihat & mengerjakan langsung via `GET /pkkmb/quiz` (list student) → player → result.
2. **Via Assignment (type=QUIZ)** — panitia memilih quiz existing dari dropdown saat membuat penugasan (`POST /pkkmb/assignments`); Assignment hanya menyimpan `quizId` (container/entry point, §18).

Saat quiz dipakai melalui Assignment:

- Assignment = **source of truth utk visibility**; targeting quiz **tetap dicek (AND)** saat detail/start/resume — user non-target disembunyikan di list & ditolak (403) saat start.
- **Status penugasan diturunkan dari attempt** (`IN_PROGRESS`/`COMPLETED`/`OVERDUE` + `activeAttemptId`/`bestAttempt`, lihat §18.4) — tidak ada status kedua.
- `DELETE /pkkmb/quiz/:id` → **400** jika quiz sudah direferensikan assignment (delete protection §18.7).
- Soal, attempt, timer, scoring, `maxAttempts`, `passingScore` **tidak berubah** — Quiz Core tetap satu-satunya engine.
- Satu quiz dapat dipakai oleh **banyak Assignment** (bukan relasi satu-ke-satu).

---

## 14. Quiz Security

| Mekanisme | Implementasi |
|-----------|--------------|
| `correctAnswer` tidak dikirim ke student | `buildAttemptPayload` hanya mengirim `question/options/points/order` |
| Scoring backend | `submitQuiz` memanggil `gradeQuizAnswers` dengan jawaban benar dari DB |
| Score/correctCount/percentage tidak dipercaya dari request | DTO `SubmitQuizDto` hanya menerima `answers[]` |
| `userId` dari JWT | `@CurrentUser` di semua handler |
| Attempt ownership (IDOR) | `attempt.userId === user.userId`; quizId di path harus cocok dengan attempt.quizId |
| Timer server-side | `attemptDeadline = startedAt + durationMinutes`; submit/save setelah deadline → EXPIRED + tolak |
| Period validation | `quiz.startTime/endTime` dicek di start & submit |
| `maxAttempts` | Hitung `IN_PROGRESS/SUBMITTED/GRADED`; EXPIRED tidak dihitung |
| DTO whitelist | `ValidationPipe(whitelist, forbidNonWhitelisted)` global |
| Anti-spam | `@Throttle` pada submit (5/min), save (60/min), violation (60/min), events (30/min), heartbeat (60/min) |
| Race condition | Unique index `(quizId,userId,attemptNumber)` + penanganan E11000 |
| Akses via Assignment | Assignment = container `quizId`; targeting assignment **AND** quiz dicek di detail/start/resume (§18.6) — non-target disembunyikan di list, 403 di detail/start |
| Status assignment dari attempt | `studentAssignmentStatus` diturunkan dari `PkkmbQuizAttempt` (`IN_PROGRESS`/`COMPLETED`/`OVERDUE` + `activeAttemptId`) — tidak ada status kedua yang tidak sinkron (§18.4) |
| `correctAnswer` aman via Assignment | Detail assignment hanya mengirim metadata quiz (jumlah soal, durasi, passingScore) — soal & jawaban benar tidak pernah ikut |
| Delete protection | `DELETE /quiz/:id` → **400** jika quiz direferensikan assignment (§18.7) |

> **Jalur ganda tidak melemahkan keamanan:** quiz dapat dikerjakan standalone (`/dashboard/quiz`) ATAU via Assignment (`/dashboard/assignments`) — keduanya menuju player/engine yang sama; otorisasi (targeting, ownership, timer, maxAttempts, scoring) tetap satu-satunya di backend.

---

## 15. Quiz Frontend

| Halaman | Route | Fungsi |
|---------|-------|--------|
| Daftar Quiz (student) | `/dashboard/quiz` | List quiz yang tersedia; status Belum Dibuka/Tersedia/Sedang Dikerjakan/Telah Ditutup; tombol "Lanjutkan pengerjaan" |
| Detail Quiz | `/dashboard/quiz/[id]` | Metadata aman + best attempt + tombol mulai |
| Player | `/dashboard/quiz/[id]/play/[attemptId]` | Soal (tanpa correctAnswer), timer countdown dari `deadlineAt`, autosave (`PATCH .../answers`), submit (`POST .../submit`), anti-cheat events, fullscreen opsional; **resume/refresh**: `GET /quiz/:id/attempt/:attemptId` → restore jawaban + timer (tanpa attempt baru), sessionStorage sebagai cache lokal |
| Result | `/dashboard/quiz/[id]/result/[attemptId]` | Skor, persentase, status passed; **dipanggil juga dari card assignment** `[Lihat Hasil]` |
| Manajemen Quiz | `/dashboard/manage/quiz` | List + search; aksi Edit/Export/Aktivitas/Hapus (modal konfirmasi menampilkan status, jumlah soal, jumlah attempt) |
| Create | `/dashboard/manage/quiz/create` | `QuizForm` (820 baris): metadata + question builder + import Excel |
| Edit | `/dashboard/manage/quiz/[id]/edit` | `QuizForm` dengan data existing |
| Attempts (monitoring) | `/dashboard/manage/quiz/[id]/attempts` | Tabel attempt + timeline anti-cheat + risk level |

Library: `pkkmb/src/lib/quiz.ts` (types), `quiz-anticheat.ts` (mirror backend), `quiz-import-export.ts` (parse/template/export sisi client).

### 15.1 Jalur akses via Assignment (Google Classroom-like)

Player & Result **dipakai ulang** dari card assignment (`/dashboard/assignments`) — tidak ada player/result kedua:

| Status assignment | Tombol card | Route tujuan |
|-------------------|-------------|--------------|
| `NOT_STARTED` | [Mulai Quiz] | start → `/dashboard/quiz/[quizId]/play/[attemptId]` |
| `IN_PROGRESS` | [Lanjutkan Quiz] | `/dashboard/quiz/[quizId]/play/[activeAttemptId]` (resume — tidak buat attempt baru) |
| `COMPLETED` | [Lihat Hasil] | `/dashboard/quiz/[quizId]/result/[attemptId]` |
| `OVERDUE` | [Quiz Ditutup] | — (tombol nonaktif di UI; enforce backend belum ada — lihat catatan gap) |

- Status assignment dihitung dari attempt (§18.4); `activeAttemptId` dikirim di list assignment agar tombol `Lanjutkan` langsung menuju attempt yang benar.
- **Refresh browser** saat mengerjakan: halaman player memanggil `GET /quiz/:id/attempt/:attemptId` → mengembalikan soal, jawaban yang sudah dipilih, dan `deadlineAt` → timer & pilihan direstore; attempt **TIDAK** dibuat ulang (tidak menghabiskan `maxAttempts`).

> **Catatan jujur (gap):** endpoint start bersifat quiz-level (`GET /quiz/:id/start`) — memvalidasi periode **quiz** (`startTime`/`endTime`), **bukan** deadline **assignment**. Jika deadline assignment sudah lewat (status `OVERDUE`) tapi `endTime` quiz belum, student masih bisa start lewat URL langsung. Blocking `OVERDUE` saat ini **UX-level** (tombol nonaktif). Enforce deadline assignment di backend = Known Issue §26.1.

---

## 16. Quiz Import / Export Excel

### 16.1 Format Template

Sheet **SOAL** — kolom:

```
question | option_a | option_b | option_c | option_d | correct_answer | points | order
```

Sheet kedua **PETUNJUK** (hanya untuk template).

### 16.2 Endpoint (RBAC)

| Endpoint | Method | Permission | Fungsi |
|----------|--------|-----------|--------|
| `GET /pkkmb/quiz/template` | GET | `pkkmb.quiz.create` | Download template `.xlsx` |
| `POST /pkkmb/quiz/import` | POST (multipart) | `pkkmb.quiz.create` | Validasi & parse **tanpa simpan** (untuk create flow); error per baris → 422 |
| `POST /pkkmb/quiz/:id/import` | POST (multipart) | `pkkmb.quiz.update` | **APPEND atomic** ke quiz existing + normalisasi order 1..n |
| `GET /pkkmb/quiz/:id/export` | GET | `pkkmb.quiz.update` | Export `.xlsx` (filename `quiz-{slug}-{id}-questions.xlsx`) |

### 16.3 Aturan & Keamanan

- Ukuran file maksimal **5 MB** (`FileInterceptor` limits + `assertValidImportFile`).
- Harus `.xlsx`; MIME divalidasi bila tersedia.
- **Atomic**: jika ada 1 baris invalid → seluruh file ditolak 422 (tidak ada hasil parsial).
- **Duplikat dalam file** = error; **duplikat vs soal existing** = WARNING (`duplicates` di response; UI menawarkan "Import Tetap/Batalkan"; `?skipDuplicates=true` → lanjut).
- **Formula injection protection**: nilai diawali `= + - @` disanitasi jadi teks polos (`sanitizeCell`).
- Kolom wajib: semua; `correct_answer` harus `A/B/C/D`; `points > 0`; `order` bilangan bulat > 0.
- Implementasi murni (`quiz-import-export.ts`) → mudah diuji; spec backend & frontend ada.
- Export selalu dari **backend** (bukan state frontend).

---

## 17. Quiz Anti-Cheating / Anti-AI

### 17.1 Posisi

> **Anticheat = ya (monitoring browser). Anti-AI = TIDAK ada deteksi AI mutlak.**
> Dokumentasi ini menegaskan: sistem **tidak** mendeteksi AI secara 100%. Yang diimplementasikan adalah **"AI-assisted cheating mitigation"** (pembatasan interaksi browser + pencatatan event) sebagai **indikator untuk keputusan panitia**, bukan bukti otomatis dan bukan auto-punishment.

### 17.2 Yang Diimplementasikan (terverifikasi)

**Frontend (`quiz-anticheat.ts` + player page):**
- Deteksi tab hidden / window blur / fullscreen exit / page leave.
- Blokir & catat: copy, cut, paste, context menu, print attempt, keyboard shortcuts tertentu.
- Heuristic devtools (`DEVTOOLS_SUSPECTED`).
- Event informasional (TAB_VISIBLE, WINDOW_FOCUS, PAGE_REFRESH, ATTEMPT_RESUMED) — dicatat, tidak menaikkan skor pelanggaran.
- Fullscreen **opsional** (deterrence; ditolak browser = non-fatal).
- Toast peringatan pada ambang 1/3/5 pelanggaran (deterrence ringan).

**Backend (`quiz-anticheat.ts` + service):**
- Server-timestamp `occurredAt` (client timestamp hanya metadata).
- Dedupe tipe sama beruntun dalam 5 detik; rate limit 30 event/60 dtk per attempt; maks 50 event/request.
- Risk level dihitung backend: `LOW ≤2`, `MEDIUM 3–5`, `HIGH >5`.
- Historis maksimal 100 event tersimpan; **tidak menyimpan isi clipboard/layar/ketikan**.
- Heartbeat 20 detik (`HEARTBEAT_TIMEOUT` = indikator, tidak auto-hukum).
- Management timeline: `GET /quiz/:id/attempts` (permission `pkkmb.monitoring.read`).

### 17.3 Batasan (jujur)

- Tidak mendeteksi perangkat/HP/browser/AI lain yang dipakai di luar tab quiz.
- `DEVTOOLS_SUSPECTED` adalah heuristic, bukan kepastian.
- Semua signal = bahan pertimbangan panitia, bukan bukti pelanggaran otomatis.

---

## 18. Penugasan (Assignment)

### 18.1 Konsep — Google Classroom-like

Modul Penugasan adalah wadah utama aktivitas maba. **Quiz adalah salah satu jenis penugasan** (konsep Google Classroom): satu Assignment dapat ber-type:

- **TASK** — tugas dengan pengumpulan (URL file) + grading.
- **QUIZ** — quiz existing dijadikan penugasan; Assignment hanya **container/entry point** (menyimpan `quizId`).

Soal, attempt, timer, scoring, `maxAttempts`, `passingScore`, dan targeting quiz **tetap 100% milik Quiz Core** (§13–§17) — tidak ada duplikasi soal maupun scoring engine. `type: MATERIAL/LINK` belum diimplementasikan (🔵 PLANNED).

### 18.2 Model

**Task/Assignment** (`PkkmbTask`):

| Field | Tipe | Keterangan |
|-------|------|------------|
| `title`, `description` | string | Judul & deskripsi |
| `assignmentType` | enum | `TASK` / `QUIZ` (default `TASK`; backward compatible) |
| `quizId` | ref `PkkmbQuiz` \| null | **Wajib** jika `QUIZ`; `null` utk `TASK` |
| `startTime?`, `deadline` | date | Periode pengerjaan; `deadline` wajib |
| `type` | enum | `individu/kelompok` — **hanya TASK** (tipe submisi) |
| `status` | enum | `PUBLISHED` / `DRAFT` / `CLOSED` |
| `targetType`, `targetIds` | enum + mixed[] | `ALL/FACULTY/STUDY_PROGRAM/GROUP/INDIVIDUAL` |
| `allowedFormats[]` | string[] | Format file diizinkan (TASK) |
| `attachment?`, `link?` | string | Lampiran/link (TASK; untuk MATERIAL/LINK ke depan) |
| `createdBy`, `deletedAt` | ref User + date | Pembuat & soft delete |

**Submission** (`PkkmbSubmission`): `taskId, userId?, groupId?, fileUrl, status (NOT_SUBMITTED/SUBMITTED/LATE/GRADED), score?, feedback?, gradedBy?, submittedAt` — **hanya dipakai TASK** (Quiz memakai `PkkmbQuizAttempt`).

### 18.3 Jenis Assignment

| Jenis | `assignmentType` | `quizId` | `type` (submisi) | Eksekusi |
|-------|------------------|----------|------------------|----------|
| TASK | `TASK` | `null` | wajib (`individu`/`kelompok`) | Workflow pengumpulan + grading (18.5) |
| QUIZ | `QUIZ` | wajib (quiz existing) | tidak dipakai | Quiz Core: player/timer/scoring existing (§13) |

### 18.4 Status Assignment (per student)

Status **selalu diturunkan dari data aktual** — tidak ada status kedua yang tidak sinkron:

| Status | TASK (dari `PkkmbSubmission`) | QUIZ (dari `PkkmbQuizAttempt`) |
|--------|-------------------------------|--------------------------------|
| `NOT_STARTED` | Belum ada submission | Belum ada attempt |
| `IN_PROGRESS` | — | Attempt `IN_PROGRESS` (timer belum lewat) → + `activeAttemptId` |
| `SUBMITTED` | Submission `SUBMITTED/LATE` | — (attempt `SUBMITTED/GRADED` → langsung `COMPLETED`) |
| `COMPLETED` | Submission `GRADED` | Attempt `SUBMITTED/GRADED` → + `bestAttempt` (persentase terbaik) |
| `OVERDUE` | Deadline lewat, belum submit | Deadline lewat, belum selesai |

- **Stale IN_PROGRESS**: attempt `IN_PROGRESS` yang melewati timer (`startedAt + durationMinutes`) TIDAK dianggap aktif → status jatuh ke `NOT_STARTED`/`OVERDUE` (Quiz Core menandainya `EXPIRED` saat start/resume berikutnya; `EXPIRED` tidak memakan `maxAttempts`).
- Derivasi dilakukan **batch** (`deriveAssignmentStatuses`: ±4 query total — attempt, durasi quiz, submission, user), bukan N+1 per assignment.

### 18.5 Workflow

#### Panitia (management)

```text
POST /pkkmb/assignments                       # buat penugasan
 ├─ type=TASK → wajib `type` (individu/kelompok); quizId tidak diisi
 └─ type=QUIZ → wajib `quizId` (dropdown "Gunakan Quiz Existing";
                 quiz TIDAK dibuat otomatis; validasi quiz harus ada)
PATCH /pkkmb/assignments/:id                  # ubah (PATCH parsial aman)
 ├─ field yang TIDAK dikirim TIDAK diubah (targeting tidak di-reset)
 ├─ QUIZ → TASK: quizId dilepas (null)
 ├─ TASK → QUIZ: quizId di-set
 └─ quizId assignment Quiz yang sudah direferensikan → 400 (buat penugasan baru)
GET /pkkmb/assignments                        # semua assignment (panitia)
```

#### Student — Assignment QUIZ

```text
/dashboard/assignments → card Quiz (status + durasi + jumlah soal)
 → [Mulai] / [Lanjutkan Quiz] / [Lihat Hasil]
 → GET /pkkmb/quiz/:id/start                  # Quiz Core: validasi period/target/maxAttempts
 → Quiz Player existing (timer; autosave PATCH /answers; resume
     GET /quiz/:id/attempt/:attemptId → restore jawaban+timer TANPA attempt baru)
 → POST /quiz/:id/attempt/:attemptId/submit   # scoring backend (§13.4)
 → /dashboard/quiz/:id/result/:attemptId      # Quiz Result existing
```

#### Student — Assignment TASK

```text
/dashboard/assignments → card TASK → [Kerjakan]
 → POST /pkkmb/maba/tasks/:id/submit {fileUrl}   # dalam periode; LATE bila lewat deadline
 → Evaluator: GET /pkkmb/pemateri/submissions (scope read_all vs read_own)
     → PATCH /pkkmb/pemateri/submissions/:id/grade {score 0-100, feedback?}
```

### 18.6 Targeting (AND)

- Assignment target = **source of truth utk visibility** (`mabaTaskTargetFilter`).
- Quiz target **tetap dicek** saat detail/start/resume (`isQuizTargetedTo` / `quizTargetedSync`).
- Di list student, assignment quiz yang quiz-nya `DRAFT`/`CLOSED`/dihapus **atau** user bukan target quiz → **disembunyikan**; di detail → 403; start/resume → ditolak Quiz Core.

### 18.7 Delete Protection & Keamanan

- `DELETE /pkkmb/quiz/:id` → **400** jika quiz direferensikan oleh assignment (mencegah kerusakan assignment & riwayat attempt).
- `DELETE /pkkmb/assignments/:id` belum diekspos (🔵 PLANNED).
- Deadline server-authoritative: periode **quiz** (`startTime`/`endTime`) dan timer attempt **ditegakkan di backend** (start setelah `endTime` ditolak; submit setelah timer ditolak). **Pengecualian jujur:** deadline **assignment** (container) saat ini hanya blocking UX-level — `startQuiz` tidak tahu konteks assignment (Known Issue §26.1).

### 18.8 Frontend

| Halaman | Route | Fungsi |
|---------|-------|--------|
| List student (Google Classroom) | `/dashboard/assignments` | Tab Semua / Belum / Sedang / Selesai / Terlambat; card TASK & QUIZ |
| Detail student | `/dashboard/assignments/[id]` | Deskripsi, deadline, status, tombol kontekstual |
| Management list | `/dashboard/manage/assignments` | Tabel Judul \| Tipe \| Target \| Deadline \| Status \| Aksi |
| Management create | `/dashboard/manage/assignments/create` | Form + dropdown quiz existing + summary read-only (jumlah soal, durasi, maxAttempts, passingScore) |
| Legacy tugas | `/dashboard/tugas` | Daftar tugas lama (submission TASK) |
| Dashboard maba | `/dashboard` | Widget "Progres Penugasan" via `GET /dashboard/maba/tasks` |
| Evaluator | `/dashboard/manage/evaluator` | Submission + grading (TASK) |

### 18.9 API Ringkasan

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/assignments` | `task.read` | List assignment (student: hanya PUBLISHED + status & activeAttemptId; panitia: **semua status** PUBLISHED/DRAFT/CLOSED + status assignment) |
| GET | `/pkkmb/assignments/:id` | `task.read` | Detail (cek targeting assignment + quiz) |
| POST | `/pkkmb/assignments` | `task.create` | Buat assignment (QUIZ → `quizId` wajib) |
| PATCH | `/pkkmb/assignments/:id` | `task.update` | Update (quizId immutable; PATCH parsial aman) |
| TASK | `POST /pkkmb/maba/tasks/:id/submit`, `GET /pkkmb/pemateri/submissions`, `PATCH .../submissions/:id/grade` | `task.submit`, `grading.*` | Submisi & grading |
| QUIZ | `GET /pkkmb/quiz/:id/start`, `GET .../attempt/:attemptId`, `PATCH .../answers`, `POST .../submit`, `GET .../result/:attemptId` | `quiz.submit`, `quiz.result` | Player, resume, autosave, submit, hasil |

### 18.10 Contoh End-to-End: "Pretest PKKMB FT 2026" (Assignment Quiz)

Skenario lengkap dengan payload request **aktual** (bentuk sesuai DTO & service, §18.9).

#### 1) Panitia buat Assignment Quiz — `POST /pkkmb/assignments` (perm: `task.create`)

```json
{
  "title": "Pretest PKKMB FT 2026",
  "description": "Kerjakan pretest sebelum mengikuti rangkaian PKKMB.",
  "assignmentType": "QUIZ",
  "quizId": "507f1f77bcf86cd799439011",
  "startTime": "2026-08-10T01:00:00.000Z",
  "deadline": "2026-08-10T16:59:59.000Z",
  "targetType": "ALL",
  "targetIds": []
}
```

→ `201 { success: true, data: { _id: "507f1f77bcf86cd799439014", assignmentType: "QUIZ", quizId: "...011", deadline: "...", status: "PUBLISHED", ... } }`. Quiz **tidak** disalin — assignment hanya menyimpan `quizId` (soal/attempt/scoring tetap di Quiz Core, §13.5).

#### 2) Student lihat list — `GET /pkkmb/assignments` (perm: `task.read`)

Item di `data[]` (status diturunkan dari attempt, §18.4):

```json
{
  "_id": "507f1f77bcf86cd799439014",
  "title": "Pretest PKKMB FT 2026",
  "assignmentType": "QUIZ",
  "quizId": "507f1f77bcf86cd799439011",
  "deadline": "2026-08-10T16:59:59.000Z",
  "status": "NOT_STARTED",
  "activeAttemptId": null,
  "quiz": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Pretest PKKMB FT 2026",
    "type": "PRETEST",
    "durationMinutes": 15,
    "maxAttempts": 1,
    "passingScore": 70,
    "totalQuestions": 10
  }
}
```

> Tanpa `correctAnswer` — detail assignment hanya metadata (jumlah soal, durasi, passing score).

#### 3) Student mulai — `GET /pkkmb/quiz/507f1f77bcf86cd799439011/start` (perm: `quiz.submit`)

Backend memvalidasi: targeting **quiz** (`isQuizTargetedTo` — targeting assignment sudah dicek di list/detail, §18.6), `status=PUBLISHED`, periode `startTime/endTime`, jumlah soal, `maxAttempts`. Response = player payload (`questionId` = indeks soal, `i.toString()`):

```json
{
  "attemptId": "507f1f77bcf86cd799439020",
  "attemptNumber": 1,
  "status": "IN_PROGRESS",
  "startedAt": "2026-08-10T08:00:00.000Z",
  "durationMinutes": 15,
  "deadlineAt": "2026-08-10T08:15:00.000Z",
  "remainingSeconds": 899,
  "isResume": false,
  "answers": [],
  "questions": [
    { "questionId": "0", "question": "Manakah tujuan PKKMB?", "options": [ { "id": "A", "text": "..." }, { "id": "B", "text": "..." }, { "id": "C", "text": "..." }, { "id": "D", "text": "..." } ], "points": 1, "order": 0 },
    { "questionId": "1", "question": "Berapa lama durasi pretest ini?", "options": [ { "id": "A", "text": "..." }, { "id": "B", "text": "..." }, { "id": "C", "text": "..." }, { "id": "D", "text": "..." } ], "points": 1, "order": 1 }
  ]
}
```

Setelah ini, assignment di list berubah `IN_PROGRESS` + `activeAttemptId: "...020"` (tombol jadi [Lanjutkan Quiz], §15.1).

#### 4) Autosave — `PATCH /pkkmb/quiz/.../attempt/507f1f77bcf86cd799439020/answers` (perm: `quiz.submit`)

```json
{ "answers": [ { "questionId": "0", "selectedAnswer": "B" }, { "questionId": "1", "selectedAnswer": "C" } ] }
```

Hanya `questionId` + `selectedAnswer`; `isCorrect`/poin dihitung backend saat submit. (Autosave juga melindungi dari tab tertutup mendadak.)

#### 5) Refresh / resume — `GET /pkkmb/quiz/.../attempt/507f1f77bcf86cd799439020` (perm: `quiz.submit`)

Mengembalikan `attemptId, quizId, status, startedAt, deadlineAt, title, type, answers` (jawaban terpilih di-restore) + `questions`/`remainingSeconds` — player melanjutkan tanpa membuat attempt baru (attemptNumber tetap 1, `maxAttempts` tidak bertambah). Ownership: attempt milik user lain → 403.

#### 6) Submit — `POST /pkkmb/quiz/.../attempt/507f1f77bcf86cd799439020/submit` (perm: `quiz.submit`)

```json
{ "answers": [ { "questionId": "0", "selectedAnswer": "B" }, { "questionId": "1", "selectedAnswer": "C" } ] }
```

Scoring backend (`gradeQuizAnswers` dari DB, §13.4). `passingScore` = **persentase** (§24):

```json
{
  "attemptId": "507f1f77bcf86cd799439020",
  "score": 8,
  "correctCount": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "passingScore": 70,
  "status": "SUBMITTED",
  "passed": true,
  "submittedAt": "2026-08-10T08:09:00.000Z"
}
```

Assignment kini `COMPLETED` (dari attempt `SUBMITTED` → §18.4) — tombol card menjadi [Lihat Hasil].

> `bestAttempt` di list/detail assignment kini menyertakan **`attemptId`** (attempt terbaik, `SUBMITTED/GRADED`) — dipakai card & detail untuk membuka **halaman result existing**: `/dashboard/quiz/[quizId]/result/[attemptId]` (route `[quizId]/result/[attemptId]`). Sebelum ini tombol [Lihat Hasil] hanya mengarah ke halaman detail quiz.

#### 7) Lihat hasil — `GET /pkkmb/quiz/.../result/507f1f77bcf86cd799439020` (perm: `quiz.result`)

```json
{
  "quizTitle": "Pretest PKKMB FT 2026",
  "quizType": "PRETEST",
  "score": 8,
  "correctCount": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "passingScore": 70,
  "passed": true,
  "status": "SUBMITTED",
  "attemptNumber": 1,
  "submittedAt": "2026-08-10T08:09:00.000Z"
}
```

**Status alur:** `NOT_STARTED` → (start) `IN_PROGRESS` → (submit) `COMPLETED`; `OVERDUE` bila deadline lewat tanpa attempt (blocking UX-level, lihat Known Issue §26.1).

---

## 19. Dashboard

### 19.1 Dashboard Maba (`GET /pkkmb/dashboard/maba`)

- Banner sambutan + profil (gugus, nama).
- Jadwal PKKMB hari ini (`dashboard/maba/schedules`).
- Progres penugasan (`dashboard/maba/tasks`).
- Aksi mendesak (pending tasks).
- Kehadiran (selfie) (`dashboard/maba/attendance`).
- Papan pengumuman + notifikasi (bell dengan unread count).
- Pintasan cepat (menu).
- Progress (`dashboard/maba/progress`).

### 19.2 Dashboard Panitia (`GET /pkkmb/dashboard/panitia`)

`MONITORING_READ` → `statistics (totalPeserta, attendanceTodayPercent)`, `activities`, `announcements`, `schedules`, `tasks (totalSubmissions, pendingGrading, graded)`, `attendance.today`.

Plus: `dashboard/panitia/stats`, `dashboard/panitia/activities`, `dashboard/panitia/announcements`, `dashboard/panitia/schedules`.

### 19.3 Dashboard Admin (`GET /pkkmb/dashboard/admin`)

`MONITORING_READ` → `totalMaba`, `attendanceToday`, `tasksSubmitted`; **scope dibatasi** per gugus untuk non-admin (hanya admin/`read_all` melihat semua).

### 19.4 Menu Sidebar (frontend, berdasarkan role/division)

- Maba (`user`/`maba`): Maba Hub, Penugasan, Quiz, Presensi, Skor Keaktifan.
- Panitia: Portal Panitia/Pendamping, Data Maba, Evaluasi Penugasan, Kontrol Presensi (+ Tata Tertib untuk Tatib, Manajemen Gugus/Akun untuk Super Admin, Manajemen Quiz jika punya `quiz.create/update`).
- Redirect: role maba belum onboarding → `/onboarding`.

---

## 20. API Documentation

Semua endpoint di bawah ini **diverifikasi dari controller** (`backend/src/pkkmb/pkkmb.controller.ts`, `health.controller.ts`, `ktms-ocr.controller.ts`, `auth.controller.ts`, `content.controller.ts`). Prefix global: `/api/v1`.

### Auth (`/auth`)

| Method | Endpoint | Guard/Permission | Fungsi |
|--------|----------|------------------|--------|
| GET | `/auth/google` | GoogleOauthGuard | Mulai flow Google OAuth |
| GET | `/auth/google/callback` | GoogleOauthGuard | Callback; set cookie; redirect |
| POST | `/auth/login` | — (throttle 10/min) | Login maba email+password |
| POST | `/auth/refresh` | — | Refresh token |
| POST | `/auth/switch-role` | JWT | Regenerasi token |
| POST | `/auth/logout` | — | Hapus cookie |
| GET | `/auth/me` | JWT | Profil + permissions + verificationToken |
| GET | `/auth/verify-token/:token` | — | Verifikasi NIM (token terenkripsi) |
| PATCH | `/auth/profile` | JWT | Update studyProgram/avatar |
| GET | `/auth/bypass` | — | Selalu 403 (disabled) |

### PKKMB — Maba & Dashboard

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/me` | JWT | Profil maba/pendamping |
| GET | `/pkkmb/dashboard/maba` | JWT | Data agregasi dashboard maba |
| GET | `/pkkmb/dashboard/maba/announcements` | JWT | Pengumuman prioritas |
| GET | `/pkkmb/dashboard/maba/announcements/notifications` | JWT | Feed notifikasi read/unread |
| POST | `/pkkmb/dashboard/maba/announcements/read` | JWT | Tandai dibaca |
| GET | `/pkkmb/dashboard/maba/schedules` | JWT | Jadwal mendatang |
| POST | `/pkkmb/onboard` | JWT | Submit data onboarding |
| GET | `/pkkmb/dashboard/maba/tasks` | JWT | Status tugas |
| GET | `/pkkmb/dashboard/maba/attendance` | JWT | Ringkasan kehadiran hari ini |
| GET | `/pkkmb/dashboard/maba/progress` | JWT | Progress PKKMB |

### PKKMB — Master & Gugus

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/master/rumpun` | JWT | Master rumpun |
| GET | `/pkkmb/master/study-programs` | JWT | Master prodi |
| GET | `/pkkmb/gugus` | JWT | Daftar 50 gugus |
| GET | `/pkkmb/gugus/:id` | JWT | Detail gugus + statistik |
| GET | `/pkkmb/gugus/analytics` | `monitoring.read` | Analitik distribusi |
| GET | `/pkkmb/gugus/pendamping` | `settings.manage` | Daftar panitia pendamping |
| POST | `/pkkmb/gugus/:id/pendamping` | `settings.manage` | Tetapkan pendamping |
| POST | `/pkkmb/gugus/auto-distribute` | `group.create` | Distribusi otomatis (lock Redis) |
| POST | `/pkkmb/gugus/rebalance` | `group.create` | Rebalance |
| POST | `/pkkmb/admin/gugus/publish` | `group.publish` | Publish hasil gugus |
| POST | `/pkkmb/admin/gugus/schedule-publish` | `group.publish` | Jadwal publish |
| GET | `/pkkmb/admin/gugus/publish-config` | `group.publish` | Lihat konfigurasi |
| GET | `/pkkmb/admin/maba/pending-verification` | `registration.manage` | Maba menunggu verifikasi |
| PATCH | `/pkkmb/admin/maba/:id/verify` | `registration.manage` | Verifikasi maba |
| PATCH | `/pkkmb/admin/maba/:id/reject` | `registration.manage` | Tolak verifikasi |

### PKKMB — Presensi

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/attendance/sessions` | `attendance.checkin` | Daftar sesi |
| POST | `/pkkmb/attendance/sessions` | `monitoring.read` (gate) + **KSK/sekretaris/admin di service** | Buat sesi |
| PATCH | `/pkkmb/attendance/sessions/:id/status` | `monitoring.read` (gate) + KSK di service | Ubah status sesi |
| POST | `/pkkmb/attendance/checkin` | `attendance.checkin` | Check-in (selfie/QR/manual/NIM) |
| POST | `/pkkmb/attendance/izin` | JWT | Ajukan izin/sakit |
| GET | `/pkkmb/attendance/izin/pending` | `attendance.read` atau `monitoring.read` | Daftar izin pending |
| POST | `/pkkmb/attendance/izin/verify` | `monitoring.read` (gate) + KSK di service | Approve/Reject izin |
| DELETE | `/pkkmb/attendance/records/:id` | `monitoring.read` (gate) + **admin-only di service** | Hapus record |
| GET | `/pkkmb/attendance/monitoring` | `attendance.read` atau `monitoring.read` | Monitoring & laporan |
| GET | `/pkkmb/attendance/my-history` | `profile.read_own` | Riwayat presensi sendiri |

### PKKMB — Penugasan & Poin

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/tasks` | `task.read` | Daftar tugas |
| GET | `/pkkmb/maba/submissions` | `task.read` | Status pengumpulan sendiri |
| POST | `/pkkmb/maba/tasks/:id/submit` | `task.submit` | Kumpulkan tugas (URL) |
| POST | `/pkkmb/pemateri/tasks` | `task.create` | Buat tugas |
| GET | `/pkkmb/pemateri/submissions` | `grading.read_all` atau `read_own` | Semua submission |
| PATCH | `/pkkmb/pemateri/submissions/:id/grade` | `grading.update` | Nilai + feedback |
| GET | `/pkkmb/assignments` | JWT | Assignment TASK+QUIZ (student: +status & activeAttemptId; panitia: semua) |
| GET | `/pkkmb/assignments/:id` | JWT | Detail assignment (cek targeting assignment AND quiz; student non-target → 403) |
| POST | `/pkkmb/assignments` | `task.create` | Buat assignment (QUIZ → `quizId` wajib, gunakan quiz existing) |
| PATCH | `/pkkmb/assignments/:id` | `task.update` | Update assignment (PATCH parsial aman; `quizId` immutable) |
| GET | `/pkkmb/maba/points/summary` | JWT | Total poin |
| GET | `/pkkmb/maba/points` | JWT | Riwayat poin |

### PKKMB — Quiz

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/quiz` | `quiz.read` | List (student: aman / management: +counts) |
| POST | `/pkkmb/quiz` | `quiz.create` | Buat quiz |
| GET | `/pkkmb/quiz/:id` | `quiz.read` | Detail (student tanpa correctAnswer) |
| PATCH | `/pkkmb/quiz/:id` | `quiz.update` | Ubah quiz |
| DELETE | `/pkkmb/quiz/:id` | `quiz.delete` | Soft delete (**400** jika quiz dipakai Assignment) |
| GET | `/pkkmb/quiz/:id/start` | `quiz.submit` | Mulai/resume attempt |
| GET | `/pkkmb/quiz/:id/attempt/:attemptId` | `quiz.submit` | Resume attempt |
| PATCH | `/pkkmb/quiz/:id/attempt/:attemptId/answers` | `quiz.submit` | Autosave jawaban |
| POST | `/pkkmb/quiz/:id/attempt/:attemptId/submit` | `quiz.submit` | Submit (scoring backend) |
| GET | `/pkkmb/quiz/:id/result/:attemptId` | `quiz.result` | Hasil sendiri |
| POST | `/pkkmb/quiz/:id/attempt/:attemptId/violation` | `quiz.submit` | Lapor pelanggaran |
| POST | `/pkkmb/quiz/:id/attempt/:attemptId/events` | `quiz.submit` | Batch event anti-cheat |
| POST | `/pkkmb/quiz/:id/attempt/:attemptId/heartbeat` | `quiz.submit` | Heartbeat |
| GET | `/pkkmb/quiz/:id/attempts` | `monitoring.read` | Monitoring attempt + anti-cheat |
| GET | `/pkkmb/quiz/template` | `quiz.create` | Download template Excel |
| POST | `/pkkmb/quiz/import` | `quiz.create` | Preview import (tanpa simpan) |
| POST | `/pkkmb/quiz/:id/import` | `quiz.update` | Import append |
| GET | `/pkkmb/quiz/:id/export` | `quiz.update` | Export Excel |

### PKKMB — Dashboard Panitia/Admin

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/dashboard/panitia` | `monitoring.read` | Dashboard panitia |
| GET | `/pkkmb/dashboard/panitia/stats` | `monitoring.read` | Statistik peserta & kehadiran |
| GET | `/pkkmb/dashboard/panitia/activities` | `monitoring.read` | Aktivitas terbaru |
| GET | `/pkkmb/dashboard/panitia/announcements` | `monitoring.read` | Pengumuman terbaru |
| GET | `/pkkmb/dashboard/panitia/schedules` | `monitoring.read` | Jadwal mendatang |
| GET | `/pkkmb/dashboard/admin` | `monitoring.read` | Dashboard admin |

### PKKMB — Pengumuman & Jadwal

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/announcements` | `announcement.read` | List pengumuman (filter grup utk maba) |
| POST | `/pkkmb/admin/announcements` | `announcement.create` | Buat pengumuman |
| PATCH | `/pkkmb/admin/announcements/:id` | `announcement.create` | Ubah pengumuman |
| DELETE | `/pkkmb/admin/announcements/:id` | `announcement.create` | Hapus pengumuman |
| GET | `/pkkmb/schedules` | `schedule.read` | List jadwal |
| POST | `/pkkmb/admin/schedules` | `schedule.create` | Buat jadwal |
| PATCH | `/pkkmb/admin/schedules/:id` | `schedule.create` | Ubah jadwal |
| DELETE | `/pkkmb/admin/schedules/:id` | `schedule.create` | Hapus jadwal |

### PKKMB — Admin User & Grup

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/admin/maba` | `group.read_all` atau `read_own` | Seluruh maba (scope per gugus utk non-admin) |
| POST | `/pkkmb/admin/groups/set-ketua` | `monitoring.read` | Tetapkan ketua gugus |
| POST | `/pkkmb/admin/groups/unset-ketua` | `monitoring.read` | Batal ketua gugus |
| POST | `/pkkmb/admin/groups/auto-assign` | `settings.manage` | Auto-assign gugus (dry-run default) |
| GET | `/pkkmb/admin/users` | `settings.manage` | Semua user |
| POST | `/pkkmb/admin/users` | `settings.manage` | Buat user |
| PATCH | `/pkkmb/admin/users/:id` | `settings.manage` | Update user |
| DELETE | `/pkkmb/admin/users/:id` | `settings.manage` | Hapus user |

### PKKMB — Kesehatan & Consent (`health.controller.ts`)

| Method | Endpoint | Permission | Fungsi |
|--------|----------|-----------|--------|
| GET | `/pkkmb/health/conditions` | `health.manage` | Master penyakit |
| POST | `/pkkmb/health/conditions` | `health.manage` | Tambah penyakit |
| DELETE | `/pkkmb/health/conditions/:id` | `health.manage` | Hapus penyakit |
| GET | `/pkkmb/health/me` | `health.read_own` | Profil kesehatan sendiri |
| PUT | `/pkkmb/health/me` | `health.write_own` | Simpan profil kesehatan |
| GET | `/pkkmb/health/all` | `health.read_all` | Data kesehatan semua |
| POST | `/pkkmb/onboard/consent` | `consent.write_own` | TTD & selesaikan onboarding |

### PKKMB — KTMS OCR (`ktms-ocr.controller.ts`)

| Method | Endpoint | Guard | Fungsi |
|--------|----------|-------|--------|
| POST | `/pkkmb/ktms/ocr` | JWT | OCR KTMS (maks 5 MB, tesseract.js) |

### Lainnya

| Method | Endpoint | Guard | Fungsi |
|--------|----------|-------|--------|
| POST | `/contents/upload` | JWT | Upload file (selfie, bukti izin) |
| GET | `/health` | — | Health check (docker-compose) |

---

## 21. Database

### 21.1 Collection & Relasi

```text
roles ─────────────┐
permissions ───────┤ (role.permissions → Permission)
users.role ────────┤
                   ▼
users (role, department, pkkmbGroup, studyProgramId)
 │
 ├── pkkmb_gugus (pendampingId→User, ketuaGugusId→User)
 ├── pkkmb_attendance_sessions (createdBy→User)
 ├── pkkmb_attendance_records (session→Sesi, participant→User, operator→User)
 ├── pkkmb_tasks (createdBy→User)
 ├── pkkmb_submissions (taskId→Task, userId→User, groupId→Gugus, gradedBy→User)
 ├── pkkmb_quizzes (createdBy→User)
 ├── pkkmb_quiz_attempts (quizId→Quiz, userId→User)
 ├── pkkmb_announcements (targetGroups→Gugus)
 ├── pkkmb_schedules
 ├── pkkmb_point_logs (groupId→Gugus, userId→User, createdBy→User)
 ├── pkkmb_rumpun / pkkmb_study_programs (prodi.rumpun→Rumpun)
 ├── health_profiles (studentId→User, unique)
 ├── health_records (studentId→User, conditionId→HealthCondition)
 ├── health_conditions
 ├── onboarding_consent (studentId→User, unique)
 ├── pkkmb_publish_config (singleton)
 ├── audit_logs (audit trail)
 └── (modul ekosistem lain: contents, galleries, letters, dll.)
```

### 21.2 Index Penting

| Collection | Index | Jenis |
|------------|-------|-------|
| `users` | `email` | unique (schema) |
| `users` | `nim` | sparse index |
| `users` | `googleId` | sparse unique |
| `users` | `pkkmbGroup, deletedAt`, `role, deletedAt`, `studyProgram, deletedAt` | regular |
| `roles` | `slug` | unique |
| `permissions` | `name` | unique |
| `pkkmb_gugus` | `nomor` | unique |
| `pkkmb_attendance_records` | `(session, participant)` | **unique** (anti-duplikat check-in) |
| `pkkmb_quiz_attempts` | `(quizId, userId, attemptNumber)` | **unique** |
| `health_profiles` / `onboarding_consent` | `studentId` | unique |
| `pkkmb_quizzes` | `status+startTime+endTime`, `targetType+targetIds`, `deletedAt` | regular |
| `health_conditions` | `name` | unique |

---

## 22. Security Architecture

| # | Layer | Status | Keterangan |
|---|-------|--------|------------|
| 1 | Authentication | ✅ IMPLEMENTED | Google OAuth + email/password + JWT |
| 2 | JWT (httpOnly cookie) | ✅ IMPLEMENTED | `secure`, `sameSite=none`, domain prod |
| 3 | Authorization (PermissionsGuard) | ✅ IMPLEMENTED | `@RequiredPermissions` + wildcard `manage:all` |
| 4 | RBAC (role → permission) | ✅ IMPLEMENTED | Seed 7 role × 63 permission |
| 5 | Data-scope authorization | ✅ IMPLEMENTED | Per-gugus scope, ownership attempt, KSK division check |
| 6 | DTO validation | ✅ IMPLEMENTED | `ValidationPipe` whitelist + forbidNonWhitelisted + transform global |
| 7 | Input sanitization | ✅ IMPLEMENTED | `sanitizeCell` (formula injection), `sanitizeFilename`, avatar sanitizer |
| 8 | Ownership validation (IDOR) | ✅ IMPLEMENTED | Quiz attempt, result, save, violation, heartbeat |
| 9 | Server-side scoring | ✅ IMPLEMENTED | Quiz & poin dihitung backend |
| 10 | File validation | ✅ IMPLEMENTED | 5 MB, `.xlsx`, MIME; KTMS 5 MB |
| 11 | Formula injection protection | ✅ IMPLEMENTED | Excel import/export |
| 12 | Rate limiting | ✅ IMPLEMENTED | Global ThrottlerGuard 300/min + `@Throttle` per endpoint + Redis per-user |
| 13 | Helmet / CORS / compression | ✅ IMPLEMENTED | CORS strict `.bemftunesa.org` + localhost |
| 14 | Anti-cheat monitoring | ✅ IMPLEMENTED | Lihat bagian 17 |
| 15 | Audit trail | ✅ IMPLEMENTED | Event `audit.log` → `audit_logs` |
| 16 | Content-Security-Policy | ⚠️ PARTIAL | Diaktifkan hanya di production (dev dimatikan untuk Swagger) |
| 17 | Refresh token rotation / revoke | 🔵 RECOMMENDED | Token refresh stateless tanpa daftar revoke |
| 18 | 2FA / device trust | 🔵 RECOMMENDED | Belum ada |
| 19 | Password policy maba | 🟡 PARTIAL | bcrypt + domain UNESA; tanpa aturan kekuatan password eksplisit |

---

## 23. Validation

| Area | Backend | Frontend |
|------|---------|----------|
| Request body | `class-validator` DTO + `ValidationPipe(whitelist, forbidNonWhitelisted, transform)` | Form state + validasi ringan (required, pola) |
| Params/Query | `PaginationDto`, `AttendanceFilterDto`, `IsMongoId` | — |
| Presensi | Periode `[start,end]` (WIB server), status sesi PUBLISHED, duplikat (unique index), QR token + expiry, selfie wajib, rate limit | Sesi aktif (`getPeriodStatus`), sudah presensi?, selfie wajib, retry 4xx handling |
| Task | `deadline` wajib, `type` enum, `targetType` enum, URL `@IsUrl`, periode | Form |
| Quiz | DTO `CreateQuizDto` (enum type/status/targetType, `passingScore` 0–100 int), `SubmitQuizDto` (answers non-empty), `ReportQuizEventsDto` (max 50, `ValidateNested`), ownership & timer | Question builder, player timer, import parser |
| Excel | `parseQuizExcel` (header, kolom wajib, A/B/C/D, points>0, order int>0, duplikat), 5 MB | `parseImportFile` mirror + `validateImportRows` |
| Kesehatan | `health.dto` (enum kategori, status, maxLength) | HealthStep |
| Consent | Signature wajib non-empty; data onboarding wajib lengkap | SignaturePad |

---

## 24. Testing

### 24.1 Backend (Jest)

Hasil eksekusi nyata (8 Agustus 2026, di repo):

```text
Test Suites: 16 passed, 16 total
Tests:       202 passed, 202 total
```

| File | Area |
|------|------|
| `quiz-scoring.spec.ts` | Scoring quiz (backend authority) |
| `quiz-attempt.spec.ts` | Lifecycle attempt (start/resume/expired/maxAttempts/submit/IDOR) |
| `assignment.spec.ts` | Integrasi Quiz→Assignment (create, delete-protection, status dari attempt, stale IN_PROGRESS, visibility AND, PATCH parsial aman) |
| `quiz-anticheat.spec.ts` | Anti-cheat (risk, dedupe, rate limit) |
| `quiz-import-export.spec.ts` | Parser Excel (valid/invalid/duplikat/template/export) |
| `quiz-import-export.service.spec.ts` | Service import/export (append, duplicates 422, RBAC decorator) |
| `attendance-rbac.spec.ts` | RBAC presensi KSK (matrix lengkap) |
| `checkin.spec.ts` | Validasi periode & duplicate check-in |
| `gugus-assignment.spec.ts` | Skor & pemilihan gugus (prodi→genderGap→fine-tuning→total) + simulasi distribusi global |
| `wib-time.spec.ts` | Parsing WIB & periode |
| `task-status.spec.ts` | Status submission (SUBMITTED/LATE/GRADED) |
| `aspirations.*.spec.ts`, `programs.*.spec.ts`, `user.service.spec.ts` | Modul ekosistem lain |

### 24.2 Frontend PKKMB (node:test)

`pkkmb/src/lib/quiz-anticheat.test.ts` + `quiz-import-export.test.ts` — **26 test pass** (dieksekusi dengan `node --experimental-strip-types --test`).

### 24.3 Catatan

- `backend/test/app.e2e-spec.ts` (jest-e2e) tersedia di repo; status eksekusi **tidak diverifikasi** pada audit ini.
- Skrip ad-hoc di `backend/scripts/*.cjs` adalah tooling one-off (bukan test otomatis).

---

## 25. Current Implementation Status

| Feature | Status | Evidence |
|---------|--------|----------|
| Auth Google + JWT cookie | ✅ READY | `auth.controller.ts`, `jwt.strategy.ts` |
| Onboarding 6 langkah + OCR KTMS | ✅ READY | `pkkmb/app/onboarding/page.tsx`, `ktms-ocr.service.ts` |
| Gugus 50 + pendamping | ✅ READY | `seed-gugus.ts`, `seed-pendamping-50.ts` |
| Distribusi gugus (onboard/auto/rebalance) | ✅ READY | `pkkmb.service.ts` (assignMabaToGroup, autoDistributeGugus, rebalanceGugus) + `gugus-assignment.ts` (satu fungsi bersama) |
| Publish gugus | ✅ READY | `publishGugus`, `pkkmb_publish_config` |
| Presensi multi-fase (Pra-PKKMB/Day 1–2/Day 3–4) + selfie | ✅ READY | `checkIn`, `checkin.spec.ts`; sesi per tanggal (`isOnline`, `attendanceMethod`); tanpa field `phase` (§12.5) |
| RBAC presensi KSK | ✅ READY | `assertAttendanceManager`, `attendance-rbac.spec.ts` |
| Izin/sakit + verifikasi | ✅ READY | `submitIzin`, `verifyIzin`, frontend manage/attendance |
| Penugasan + grading + **Integrasi Quiz→Assignment** | ✅ READY | `PkkmbTask/Submission` (+`assignmentType`/`quizId`), `assignments/*`, `assignment.spec.ts` (38 test) |
| Quiz CRUD + attempt lifecycle | ✅ READY | `quiz-attempt.spec.ts`, frontend quiz/* |
| Quiz scoring backend | ✅ READY | `quiz-scoring.ts` + spec |
| Quiz targeting | ✅ READY | `isQuizTargetedTo`, `quizTargetFilter` |
| Quiz import/export Excel | ✅ READY | `quiz-import-export.ts` + specs |
| Quiz anti-cheat deterrence | ✅ READY | `quiz-anticheat.ts` + specs, player page |
| Dashboard (maba/panitia/admin) | ✅ READY | `dashboard/*` endpoints + pages |
| Pengumuman & jadwal | ✅ READY | `PkkmbAnnouncement/Schedule` |
| Poin maba (baca) | 🟡 PARTIAL | API read ada; **admin write point endpoint tidak diekspos** |
| Komdis / Tata Tertib | 🟡 PARTIAL | Halaman placeholder; `getIncidents` tidak diekspos |
| Export CSV presensi | 🟡 PARTIAL | Service ada, endpoint tidak diekspos |
| Mentor manual checkin | 🟡 PARTIAL | Service ada, endpoint tidak diekspos |
| Auto-assign gugus (role maba) | 🟡 PARTIAL | Endpoint ada; dependensi role `maba` tidak di seed |
| Struktur 13 Divisi resmi | 🔵 PLANNED | Hanya subset divisi di seed |
| Deploy docker-compose + Caddy | ✅ READY | `docker-compose.yml`, `Caddyfile` |

---

## 26. Known Issues

### 26.1 Issues Aktif (ditemukan saat audit)

| Severity | Modul | Deskripsi | Impact | Rekomendasi |
|----------|-------|-----------|--------|-------------|
| MEDIUM | Presensi | `getAdminDashboardStats` membaca `submissionModel` dengan field `mabaId` (tidak ada di schema — seharusnya `userId`) → `tasksSubmitted` bisa salah/0 | Statistik dashboard admin tidak akurat | Perbaiki query ke `userId`/`groupId` |
| LOW | Quiz | `submitQuiz` tidak melakukan `expireStaleAttempts` untuk attempt IN_PROGRESS user lain di quiz yang sama (hanya cek attempt yang di-submit) | Minor; attempt stale lain tetap IN_PROGRESS sampai di-start ulang | Panggil expire di start (sudah dilakukan di `startQuiz`) |
| LOW | Observability | `PermissionsGuard` menyisakan `console.log('uniquePermissions:', ...)` | Kebocoran informasi permission di log | Hapus log |
| MEDIUM | Assignment→Quiz | `startQuiz` (quiz-level, `GET /quiz/:id/start`) **tidak memvalidasi deadline assignment** — hanya periode quiz (`endTime`); assignment `OVERDUE` masih bisa di-start via URL langsung jika `endTime` quiz belum lewat | Blocking `OVERDUE` hanya UX-level (tombol nonaktif); student bisa mengerjakan lewat jalur langsung | Enforce deadline assignment saat quiz dipakai via assignment (mis. `startQuiz` menerima `assignmentId` opsional dan menolak jika `now > assignment.deadline`) |
| LOW | UX/Security | `getMentorAttendanceSessions`, `mentorManualCheckin`, `exportAttendanceToCsv`, `getIncidents` ada di service tetapi **tidak diekspos** di controller | Fitur tidak dapat diakses via API; dead-ish code | Ekspos atau hapus |
| LOW | UX | Halaman `manage/komdis` adalah placeholder statis (tanpa koneksi API) | Komdis belum fungsional | Hubungkan ke endpoint insiden |
| INFO | Auth | `verificationToken` memakai AES-256-CBC custom dari NIM (bukan JWT standar) | Maintainability | Dokumentasikan / ganti JWT short-lived |

### 26.2 Resolved Issues (perbaikan yang sudah terverifikasi)

| Issue lama | Status | Bukti |
|-----------|--------|-------|
| IN_PROGRESS attempt ditinggal menghabiskan maxAttempts | ✅ RESOLVED | `startQuiz`/`resumeQuizAttempt`/`submitQuiz` menandai stale IN_PROGRESS → `EXPIRED`; EXPIRED tidak dihitung; `quiz-attempt.spec.ts` |
| Delete Quiz belum tersedia | ✅ RESOLVED | `DELETE /pkkmb/quiz/:id` (soft delete) + modal konfirmasi |
| Player belum bisa resume setelah refresh | ✅ RESOLVED | `GET /quiz/:id/attempt/:attemptId` + autosave + sessionStorage |
| passingScore ambigu (persen vs absolut) | ✅ RESOLVED | `passingScore` = persentase 0–100; `passed = percentage >= passingScore`; DTO `@Min(0) @Max(100)` |
| Distribusi gugus hanya meratakan prodi, buta gender | ✅ RESOLVED | `gugus-assignment.ts` (skor prodi → genderGap berarah → fine-tuning → total) dipakai `assignMabaToGroup` (onboarding), `autoDistributeGugus`, & `rebalanceGugus` (satu fungsi bersama); `autoAssignGroups` (legacy) mencari role dengan `$or [maba, user]` |
| getStudentQuizDetail dead code | ⚠️ TIDAK dead | Dipakai `getQuizDetail` dispatcher (maba) — tetap dipertahankan |
| Targeting FACULTY gagal jika `faculty` tersimpan ObjectId vs `targetIds` string (komparasi `===` mentah) | ✅ RESOLVED | Normalisasi `toString()` di dua sisi: `quizUserContext` (faculty → string), `quizTargetedSync` & `isTaskTargetedTo` (bandingkan `toString()`); test `assignment.spec.ts` (faculty ObjectId-like vs `'Fakultas Teknik'`) |

---

## 27. Data & Current Environment

> **PENTING:** Jumlah data runtime (users, gugus terisi, quiz aktif, attempts) **TIDAK dapat diverifikasi** tanpa akses database produksi. Angka di bawah hanya dari seed.

| Data | Jumlah (seed) | Runtime |
|------|--------------|---------|
| Gugus | 50 (seed) | **Not verified** |
| Rumpun | 5 | **Not verified** |
| Program Studi | 17 | **Not verified** |
| Role | 7 | **Not verified** |
| Permission | 63 | **Not verified** |
| Akun demo | 11 (seed-rbac) + 50 pendamping (seed-pendamping-50) | **Not verified** |
| Test backend | 16 suite / 202 test (termasuk `gugus-assignment.spec.ts` & `assignment.spec.ts`) | **Terverifikasi (dieksekusi)** |

Environment: `docker-compose.yml` (api :4000, pkkmb_web :3000 di container, Caddy :80/:443), domain `pkkmb.bemftunesa.org`. Dev lokal: backend `npm run start:dev` (port 4000), pkkmb `npm run dev` (port 3002). Catatan: `start:dev` me-`unset MONGODB_URI/REDIS_URL` agar memakai `backend/.env` lokal (127.0.0.1), bukan root `.env` docker (`db`).

---

## 28. Development Workflow

```bash
# 1. Install dependencies (root)
npm install

# 2. Environment
cp backend/.env.example backend/.env      # isi MONGODB_URI, JWT_SECRET, dll.
cp pkkmb/.env.example pkkmb/.env.local    # NEXT_PUBLIC_API_URL (tanpa /api/v1)

# 3. Seed database (urutan penting)
cd backend
npm run seed:rbac          # permissions + roles + akun demo
npm run seed:gugus         # rumpun + prodi + 50 gugus
npm run seed:pendamping    # 50 akun pendamping + assign ke gugus

# 4. Run backend (dev, port 4000)
npm run start:dev

# 5. Run frontend (dev, port 3002)
cd ../pkkmb && npm run dev

# 6. Test
cd backend && npm test                       # 16 suites / 202 test
cd pkkmb && node --experimental-strip-types --test src/lib/*.test.ts

# 7. Lint & build
npm run lint   # root (turbo)
npm run build  # root (turbo)
```

Script lain: `start:debug` (backend), `start` (prod), `test:cov`, `test:e2e`. Skrip one-off: `backend/scripts/*.cjs`.

---

## 29. Dependencies

### Frontend `pkkmb/package.json`

| Dependency | Versi | Fungsi |
|-----------|-------|--------|
| next | 16.2.12 | Framework |
| react / react-dom | 19.2.4 | UI |
| tailwindcss | 4 | Styling |
| framer-motion | 12.43 | Animasi |
| lucide-react | 0.475 | Ikon |
| @tanstack/react-query | 5.101.4 | Data fetching |
| axios | 1.19 | HTTP client |
| zustand | 5.0.14 | State |
| leaflet / react-leaflet | 1.9.4 / 5.0.0 | Peta presensi live |
| react-qr-code / jsqr | 2.2.0 / 1.4.0 | QR generate/scan |
| react-easy-crop | 5.2.0 | Crop pasfoto |
| react-hot-toast | 2.6.0 | Toast |
| lenis | 1.3.25 | Smooth scroll |
| next-themes | 0.4.6 | Tema |
| xlsx | 0.18.5 | Excel import/export |
| next-auth | 4.24.15 | (terpasang; alur aktif memakai cookie JWT custom) |

### Backend `backend/package.json`

| Dependency | Versi | Fungsi |
|-----------|-------|--------|
| @nestjs/* | 11 | Framework |
| mongoose / @nestjs/mongoose | 8.9.5 / 11 | ODM |
| @nestjs/jwt, passport-jwt | 11 / 4.0.1 | JWT |
| bcrypt | 6.0.0 | Hash password |
| class-validator / class-transformer | 0.15.1 / 0.5.1 | Validasi |
| @nestjs/throttler | 6.5.0 | Rate limit |
| ioredis | (via @nestjs/bullmq dep) | Cache/lock/rate-limit |
| @nestjs/bullmq / bullmq | 11 / 5.79.2 | Background queue |
| @nestjs/event-emitter | 3.1.0 | Audit log events |
| xlsx | 0.18.5 | Excel |
| tesseract.js | 7.0.0 | OCR KTMS |
| sharp | 0.34.5 | Preprocess OCR |
| helmet / compression / cookie-parser | 8.2 / 1.8.1 / 1.4.7 | Security |
| googleapis | 173 | Google OAuth |
| @nestjs/swagger | 11.4.4 | Swagger UI |

---

## 30. File Map

| Feature | Backend | Frontend | Schema | Test |
|---------|---------|----------|--------|------|
| Quiz | `pkkmb/pkkmb.service.ts` (L3306+), `pkkmb/pkkmb.controller.ts` (L576+) | `dashboard/quiz/**`, `manage/quiz/**`, `components/quiz/QuizForm.tsx`, `lib/quiz.ts` | `schemas/pkkmb-quiz.schema.ts` | `quiz-scoring.spec.ts`, `quiz-attempt.spec.ts` |
| Quiz import/export | `pkkmb/quiz-import-export.ts`, controller (L790+) | `lib/quiz-import-export.ts`, QuizForm, manage/quiz | (utilitas murni) | `quiz-import-export.spec.ts`, `quiz-import-export.service.spec.ts`, `lib/*.test.ts` |
| Anti-cheat | `pkkmb/quiz-anticheat.ts`, service (L4110+) | `lib/quiz-anticheat.ts`, play page | `pkkmb-quiz.schema.ts` (QuizAntiCheat) | `quiz-anticheat.spec.ts` |
| Presensi | `pkkmb.service.ts` (L1004+, L1095–1693), controller (L296+) | `dashboard/presensi`, `manage/attendance` (+LiveAttendanceMap) | `pkkmb-attendance.schema.ts` | `checkin.spec.ts`, `attendance-rbac.spec.ts` |
| Gugus | `pkkmb.service.ts` (L312–1000), `pkkmb/gugus-assignment.ts` | `manage/groups`, dashboard maba | `pkkmb-group.schema.ts` | `gugus-assignment.spec.ts` |
| Penugasan (+Integrasi Quiz→Assignment) | `pkkmb.service.ts` (L1694–2148, L2323–2470), controller `assignments/*` | `dashboard/tugas`, `dashboard/assignments`, `dashboard/assignments/[id]`, `manage/evaluator`, `manage/assignments`(+create) | `pkkmb-task.schema.ts` | `task-status.spec.ts`, `assignment.spec.ts` |
| Onboarding/Kesehatan | `health.service.ts`, `ktms-ocr.*`, `pkkmb.service.ts` (L281) | `onboarding/page.tsx`, `components/onboarding/*` | `health-*.schema.ts`, `onboarding-consent.schema.ts` | (spec OCR belum ada) |
| RBAC | `common/auth/pkkmb-permissions.ts`, `seeders/seed-rbac.ts`, guards | `dashboard/layout.tsx`, `manage/attendance/page.tsx` | `role.schema.ts`, `permission.schema.ts` | `attendance-rbac.spec.ts` |
| Dashboard | `pkkmb.service.ts` (L2323–3000) | `dashboard/page.tsx` | — | — |

---

## 31. User Journeys

### Maba

```text
Login (Google/email) → (belum onboarding) → /onboarding (6 langkah: KTMS→data→kesehatan→pasfoto→TTD→gugus)
→ Dashboard Maba → Lihat pengumuman & jadwal → Lihat gugus & pendamping
→ Presensi per fase (Pra-PKKMB online → Day 1–2 hybrid → Day 3–4 offline; selfie/QR/manual sesuai sesi) → Izin/sakit bila perlu → Cek rekapitulasi
→ Tugas/Assignment: lihat `/dashboard/assignments` (tab Semua/Belum/Sedang/Selesai/Terlambat) → Assignment Quiz: [Mulai] / [Lanjutkan Quiz] (resume attempt) / [Lihat Hasil] → Quiz Player & Result existing → TASK: kumpulkan → cek nilai
→ Quiz: lihat → mulai → jawab (timer) → submit → hasil
→ Poin keaktifan → Profil & ID Card
```

### Panitia

```text
Login → Portal Panitia → Dashboard (statistik)
→ Data Maba (per gugus utk non-admin) → Evaluasi Penugasan (grading)
→ Kontrol Presensi (read-only, kecuali KSK/sekretaris/admin)
→ Manajemen Quiz (jika permission) → Monitoring attempt & anti-cheat
```

### KSK — Divisi Kesekretariatan (bukan role: user role `panitia` + division `Sie KSK`)

```text
Login → Portal Panitia → Kontrol Presensi (management mode)
→ Buat/ubah sesi → Verifikasi izin/sakit → Monitoring real-time (peta + log)
→ Export/administrasi sesuai permission
```

### Ketua / Pimpinan

```text
Login → Dashboard Panitia/Admin → Monitoring statistik & aktivitas
→ Pengumuman/Jadwal (sesuai permission) → Manajemen sesuai permission
```

---

## 32. Permission Matrix

Berdasarkan seed RBAC aktual (bukan asumsi). ✓ = punya; — = tidak.

| Fitur / Permission | Maba (`user`) | Panitia | KSK* | Sekretaris | Ketua | Pimpinan | Bendahara | Super Admin |
|--------------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat pengumuman & jadwal | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Check-in presensi | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ |
| Lihat data presensi (read-only) | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Buat/ubah sesi presensi | — | — | ✓ | ✓ | — | — | — | ✓ |
| Verifikasi izin | — | — | ✓ | ✓ | — | — | — | ✓ |
| Hapus record presensi | — | — | — | — | — | — | — | ✓ |
| Baca/mengerjakan quiz (submit) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Kelola quiz (create/update/delete) | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Monitoring attempt/anti-cheat | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lihat & kumpulkan tugas | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Buat tugas | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Menilai tugas (grading.update) | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Data kesehatan sendiri | ✓ | — | — | — | — | — | — | ✓ |
| Data kesehatan semua | — | — | — | — | — | — | — | ✓ |
| Kelola pengguna/akun | — | — | — | — | — | — | — | ✓ |
| Publish gugus | — | — | — | ✓ | ✓ | — | — | ✓ |
| Distribusi gugus (auto/rebalance) | — | — | — | — | — | — | — | ✓ (via `group.create`) |

> *KSK = **Divisi Kesekretariatan** — **BUKAN role tersendiri**: user ber-role `panitia` dengan `division: "Sie KSK"`. Kolom KSK menunjukkan akses *management presensi* (diperoleh via division check di service), sedangkan akses lain sama dengan Panitia. Implementasi division-check KSK **sudah diterapkan dan diuji** (`attendance-rbac.spec.ts`).

---

## 33. Glossary

| Istilah | Arti |
|---------|------|
| **PKKMB** | Pengenalan Kehidupan Kampus bagi Mahasiswa Baru |
| **Maba** | Mahasiswa Baru |
| **Gugus** | Kelompok kecil peserta PKKMB (50 gugus) beserta pendamping |
| **Adrista** | Penamaan branding gugus/dashboard PKKMB FT UNESA 2026 |
| **NIM** | Nomor Induk Mahasiswa |
| **Prodi** | Program Studi (17 prodi FT UNESA) |
| **Fakultas** | Fakultas Teknik UNESA |
| **Rumpun** | Pengelompokan akademik prodi (Mesin, Elektro, Informatika, Sipil, PKK) |
| **Divisi** | Istilah resmi unit kepanitiaan (kode menggunakan awalan "Sie" di data lama) |
| **KSK** | Singkatan "Kesekretariatan" — **divisi** (bukan role) pengelola administrasi & presensi, di dalam role `panitia` |
| **Sie Pendamping** | Divisi pendamping gugus |
| **Quiz** | Ujian pretest/posttest/materi |
| **Attempt** | Satu kali pengerjaan quiz (IN_PROGRESS/SUBMITTED/GRADED/EXPIRED) |
| **Targeting** | Penentuan audiens quiz/tugas (ALL/FACULTY/STUDY_PROGRAM/GROUP/INDIVIDUAL) |
| **RBAC** | Role-Based Access Control |
| **JWT** | JSON Web Token (autentikasi) |
| **Permission** | Izin aksi atomik dalam sistem |
| **EXPIRED (attempt)** | Attempt ditinggal hingga lewat deadline; tidak memakai slot maxAttempts |

---

## 34. Changelog Documentation

## Documentation Changelog

| Tanggal | Perubahan | Status |
|---------|-----------|--------|
| 8 Agustus 2026 (revisi 12) | **Wiring tombol assignment → player/result existing**: verifikasi `/dashboard/assignments` & `/[id]` — [Mulai] & [Lanjutkan Quiz] sudah mengarah ke player (`/dashboard/quiz/:id/play/:attemptId`, resume via `GET /quiz/:id/attempt/:attemptId`); perbaiki **gap [Lihat Hasil]** — `bestAttempt` kini menyertakan `attemptId` (deriveAssignmentStatuses) sehingga tombol COMPLETED membuka halaman result existing `/dashboard/quiz/[quizId]/result/[attemptId]` (sebelumnya hanya ke detail quiz); test `assignment.spec` assert `bestAttempt.attemptId`; manage list tetap hanya aksi Edit (manajemen) | PUBLISHED |
| 8 Agustus 2026 | Pembuatan `docs/PKKMB_PROJECT.md` (master documentation) berdasar audit repository | PUBLISHED |
| 8 Agustus 2026 (revisi 4) | **Integrasi Quiz→Penugasan (Google Classroom-like)**: `PkkmbTask.assignmentType/quizId` (container → Quiz Core, tanpa duplikasi soal/scoring); endpoint `GET/POST /pkkmb/assignments` & `GET/PATCH /pkkmb/assignments/:id`; status student diturunkan dari QuizAttempt (`NOT_STARTED/IN_PROGRESS/COMPLETED/OVERDUE`; IN_PROGRESS stale dilewati); targeting assignment AND quiz (non-target **disembunyikan** di list, 403 di detail); derivasi status **batch** (tanpa N+1); PATCH parsial tidak me-reset targeting & QUIZ→TASK melepas `quizId`; `DELETE /pkkmb/quiz/:id` diproteksi (400) jika dipakai assignment; frontend `/dashboard/assignments`(+/[id]) & `manage/assignments`(+create); test backend → **16 suite / 202 test** | PUBLISHED |
| 8 Agustus 2026 (revisi 11) | **Contoh End-to-End §18.10**: skenario lengkap "Buat Assignment Quiz Pretest" → list student → start → autosave → refresh/resume → submit → lihat hasil, dengan payload request/response aktual (DTO `CreateTaskDto`, `QuizAnswerDto`, `SubmitQuizDto`; bentuk `buildAttemptPayload`/`submitQuiz`/`getQuizResult`) | PUBLISHED |
| 8 Agustus 2026 (revisi 10) | **Koreksi jujur deadline**: klaim "start ditolak backend" utk assignment `OVERDUE` ditarik — `startQuiz` hanya memvalidasi periode quiz, bukan deadline assignment; §15.1 & §18.7 diperbarui, gap dicatat sebagai Known Issue §26.1 (MEDIUM) | PUBLISHED |
| 8 Agustus 2026 (revisi 9) | **§14 Quiz Security & §15 Quiz Frontend** disinkronkan dengan integrasi Assignment: 4 baris keamanan baru (akses via Assignment AND-targeting, status assignment dari attempt, `correctAnswer` tidak bocor via detail assignment, delete protection) + §15.1 jalur akses via Assignment (status → tombol → route; resume/refresh via `GET /quiz/:id/attempt/:attemptId` tanpa attempt baru) | PUBLISHED |
| 8 Agustus 2026 (revisi 8) | **Matriks Divisi → Modul & Permission**: tambah §6.4 — pemetaan 13 divisi resmi ke modul, permission/guard, dan status implementasi per divisi (✅ READY / 🟡 PARTIAL / 🔵 PLANNED); koreksi §6.2 (pengumuman dikelola Inti, bukan Humas); catatan `targetDivision` pada sesi presensi | PUBLISHED |
| 8 Agustus 2026 (revisi 7) | **Audit KSK-as-role**: verifikasi seluruh repo (seed, service, controller, frontend, scripts, docs) — **tidak ada referensi yang memperlakukan KSK sebagai role**: seed hanya berisi 7 role (`super_admin/pimpinan/ketua_pelaksana/sekretaris/bendahara/panitia/user`, tanpa `ksk`), tidak ada permission `pkkmb.ksk.*`, service & frontend memeriksa `division` (bukan `roleSlug`); `role: 'ksk'` di spec (payload spoof) dan label `ksk` di script (key login akun) diberi komentar klarifikasi | PUBLISHED |
| 8 Agustus 2026 (revisi 6) | **Konsistensi nilai division KSK**: nilai seed `division` KSK diseragamkan menjadi **`Sie KSK`** (sama dengan `Sie Acara`/`Sie Humas`/dll.) di `seed-rbac.ts`, `attendance-rbac.spec.ts`, dan script `rbac_absensi.cjs`; service (`assertAttendanceManager`) tetap case-insensitive (`includes('ksk')`) sehingga nilai lama `'KSK'` di DB existing **backward compatible**; frontend manage/attendance sudah lowercase sebelum cek — tidak perlu perubahan | PUBLISHED |
| 8 Agustus 2026 (revisi 5) | **Penajaman Assignment & targeting**: `listAssignments` panitia menampilkan **semua status** (PUBLISHED/DRAFT/CLOSED) dan mengembalikan status *assignment* (bukan status turunan per-user; derivasi per-user hanya utk student); normalisasi komparasi **targeting FACULTY** (`toString()` dua sisi di `quizUserContext`/`quizTargetedSync`/`isTaskTargetedTo`) agar ObjectId vs string tetap cocok; test backend → **16 suite / 202 test** | PUBLISHED |
| 8 Agustus 2026 (revisi 3) | Dokumen Presensi sebagai **satu sistem multi-fase**: Pra-PKKMB (Full Online), Day 1–2 (Hybrid), Day 3–4 (Full Offline); tabel mode pelaksanaan vs mekanisme presensi; pemetaan jujur fase → implementasi (sesi per tanggal, `isOnline`, `attendanceMethod`; **belum ada field `phase`**) | PUBLISHED |
| 8 Agustus 2026 (revisi 2) | Perkuat keseimbangan gender: skor gugus kini `prodi → genderGapN berarah → fine-tuning → total` (leksikografis ketat) sehingga **setiap gugus** rata cowo/cewe (selisih ≤1), tidak lagi hanya per-prodi; `assignMabaToGroup`, `autoDistributeGugus`, & `rebalanceGugus` memakai satu fungsi bersama (`buildCountsByGugus`/`simulateGugusAssignment`), deterministik (urut NIM); duplikasi antara pkkmb.service & health.service dihapus; 17 test `gugus-assignment` termasuk simulasi global | PUBLISHED |

---

## 35. Documentation Rules

- Bahasa Indonesia, teknis namun mudah dipahami.
- Konsisten; gunakan istilah resmi **"Divisi"** (bukan "Seksi").
- Tabel untuk data tabular; code block untuk API/kode; diagram ASCII untuk arsitektur.
- Status fitur selalu dilabeli: ✅ READY / 🟡 PARTIAL / 🔵 PLANNED / 🔴 NOT IMPLEMENTED.

---

## 36. Source of Truth

1. Source code (`backend/src`, `pkkmb/src`)
2. Database / schema (`backend/src/schemas`)
3. Test (`*.spec.ts`, `*.test.ts`)
4. API / controller
5. Existing documentation
6. Project notes

Konflik → **source code > test > documentation**.

---

## 37. Anti-Hallucination Rule

Fitur dianggap **IMPLEMENTED** hanya jika ada bukti yang dapat diverifikasi: file, endpoint, schema, test, komponen. Hal-hal berikut **TIDAK** dianggap implementasi: TODO, komentar, roadmap, dead code, fungsi yang tidak terpakai, atau dokumentasi semata.

- [x] Semua fitur pada dokumen ini dirujuk ke file/endpoint/schema/test.
- [x] Fitur anti-AI ditulis sebagai "mitigasi", bukan "deteksi AI".
- [x] Jumlah data runtime diberi label "Not verified" bila belum dicek dari DB.

---

## 38. Final Audit

Checklist akhir terhadap dokumen ini:

- [x] Tidak ada fitur fiktif (semua mengacu kode/seed/test)
- [x] Tidak ada endpoint fiktif (semua dari controller)
- [x] Tidak ada role fiktif (7 role dari seed-rbac)
- [x] Tidak ada permission fiktif (63 dari seed + enum)
- [x] Tidak ada jumlah data fiktif (label "Not verified" untuk runtime)
- [x] Semua modul utama tercakup (onboarding, gugus, presensi, quiz, penugasan, dashboard, master data, kesehatan)
- [x] Quiz tercakup (bagian 13–17)
- [x] Import/export tercakup (bagian 16)
- [x] Presensi tercakup (bagian 12)
- [x] Penugasan tercakup (bagian 18)
- [x] RBAC tercakup (bagian 5, 8, 32)
- [x] Divisi tercakup (bagian 6)
- [x] KSK tercakup (bagian 8.3, 12, 32)
- [x] Security tercakup (bagian 14, 22)
- [x] Testing tercakup (bagian 24)
- [x] Known issues tercakup (bagian 26)
- [x] Status fitur diverifikasi (bagian 2, 25)
- [x] Terminologi konsisten ("Divisi")

---

## 39. Output & Report

```text
DOCUMENTATION:  PASS
AUDIT:          PASS
SECTIONS:       39
FEATURES DOCUMENTED:
  - Auth (Google OAuth + JWT), Onboarding + OCR KTMS, Kesehatan, Consent/TTD
  - Master Data (Rumpun/Prodi), Gugus (50) + distribusi + publish
  - Presensi universal + RBAC KSK, Izin/Sakit, Monitoring
  - Penugasan + grading, Poin (baca)
  - Quiz (CRUD, attempt lifecycle, scoring backend, targeting)
  - Quiz Import/Export Excel, Anti-Cheat Deterrence
  - Dashboard (Maba/Panitia/Admin), Pengumuman, Jadwal
FILES AUDITED:
  - backend: pkkmb.controller.ts, pkkmb.service.ts, pkkmb.module.ts, dto/pkkmb.dto.ts,
    health.controller/service.ts, ktms-ocr.*, quiz-scoring.ts, quiz-anticheat.ts,
    quiz-import-export.ts, wib-time.ts, task-status.ts, common/auth/*, auth/*,
    schemas/* (PKKMB + auth), database/seeders/*, main.ts, app.module.ts
  - pkkmb: app/* (login, onboarding, dashboard/**, manage/**), components/**,
    lib/*, middleware.ts, next.config.ts
  - infra: package.json (root/backend/pkkmb), docker-compose.yml, Caddyfile,
    DEPLOYMENT.md, CHANGELOG.md
UNVERIFIED ITEMS:
  - Jumlah data runtime DB (users/gugus/quiz/attempts) — Not verified
  - Eksekusi test e2e (backend/test/app.e2e-spec.ts)
  - Status deploy production aktual (apakah sudah live di pkkmb.bemftunesa.org)
  - Skrip backend/scripts/*.cjs (tooling one-off, tidak diaudit detail)
KNOWN ISSUES:
  - autoAssignGroups bergantung role 'maba' (tidak ada di seed) → potensi 500
  - getAdminDashboardStats memakai field mabaId (tidak ada di schema submission)
  - console.log tersisa di PermissionsGuard
  - getMentorAttendanceSessions / mentorManualCheckin / exportAttendanceToCsv /
    getIncidents tidak diekspos di controller
  - Halaman Komdis placeholder tanpa koneksi API
CONFLICTS FOUND:
  - Istilah "Seksi" (kode) vs "Divisi" (resmi) → dokumen memakai "Divisi" resmi,
    dengan catatan nilai division di DB masih "Sie ..."
  - Role 'maba' disebut di beberapa service tetapi seed hanya punya 'user'
  - DEPLOYMENT.md (Railway/Vercel) vs docker-compose.yml (VPS + Caddy) →
    dokumen memakai docker-compose sebagai deployment aktual
FINAL: READY
```
