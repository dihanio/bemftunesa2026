# Changelog

All notable changes to the BEM FT UNESA Web Platform will be documented in this file.

## [Unreleased]

### Added
- Added fallback data parsing mechanism in `Galeri` and `Oprec` pages (and their detail layout pages) to gracefully handle varying API response structures (`res.data` vs `res.data.data` etc.) ensuring all FE features safely receive BE data.
- Replaced the previous "Mars Fakultas Teknik UNESA" anthem with the official "Hymne Teknik" in the *Tentang Kami* (`/tentang`) page.
- Added `images.remotePatterns` configuration in `next.config.ts` to whitelist image optimization requests for `localhost` and global `https` endpoints, fixing the `400 Bad Request` images bug on the frontend.
- Added rigorous `PermissionsGuard` and `@RequiredPermissions` to core backend controllers (`GalleryController`, `RecruitmentController`, `ContentController`) to enforce granular Role-Based Access Control (RBAC).
- Created a placeholder `Galeri` CMS page in IMS and added it to the `navigationRegistry` configuration to structure feature management for content publishing.
- Applied required role-based restrictions (`super-admin`, `kabem`, `wakabem`, `kadep`, `staf`, etc.) directly into the `navigationRegistry` for the Publikasi & Eksternal module.
- **PKKMB Quiz: Excel Import/Export** (`pkkmb` + `backend`): download `.xlsx` template, backend-parsed import (validate-only for create flow, atomic APPEND for existing quizzes with order normalization), duplicate detection (in-file = error, vs existing = warning with "Import Tetap/Batalkan"), and backend-generated export (`quiz-{slug}-{id}-questions.xlsx`) — all gated by `pkkmb.quiz.create/update` RBAC, with formula-injection sanitization and 5 MB upload limit. Docs: `docs/QUIZ_IMPORT_EXPORT.md`.
- **PKKMB Quiz: Final Polish** (`pkkmb` + `backend`): attempt lifecycle hardening (stale `IN_PROGRESS` attempt melewati deadline otomatis menjadi `EXPIRED` dan tidak memakan slot `maxAttempts`), delete quiz (soft delete via `DELETE /pkkmb/quiz/:id`, RBAC `pkkmb.quiz.delete`, histori attempt tetap aman), anti-cheat/anti-AI deterrence (violation/events/heartbeat endpoints, server-timestamp, dedupe & rate limit, risk level LOW/MEDIUM/HIGH, management timeline), dan `passingScore` = persentase 0–100 (`percentage >= passingScore` → `passed`). Docs: `docs/QUIZ_MODULE.md`.
- **PKKMB Quiz: Delete Confirmation & Management Counts** (`pkkmb` + `backend`): delete confirmation modal kini menampilkan status, jumlah soal, dan jumlah attempt; management quiz list (`GET /pkkmb/quiz`) menyertakan `questionCount` & `attemptCount` per quiz (soal lengkap hanya dikirim di detail — payload lebih ringan).
- **PKKMB Absensi: RBAC Panitia — KSK Manage, Panitia Read-Only** (`pkkmb` + `backend`): hanya Sie KSK (role `panitia` + division `KSK`), Sekretaris Pelaksana, dan Super Admin yang dapat mengelola absensi (create/update sesi, verify izin, delete record); panitia divisi lain **read-only** (GET monitoring/sesi/izin tetap 200, semua aksi write → 403). Backend adalah authority: `userId` dari JWT, role & division dibaca dari **database** (manipulasi `role`/`division` di body tidak berpengaruh; `forbidNonWhitelisted` juga menolak field ekstra), `actorId` wajib di semua method write. Aksi management tercatat di audit log existing (`CREATE/UPDATE/APPROVE/REJECT/DELETE` via event `audit.log`). Docs: `docs/RBAC_ABSENSI_PANITIA.md`.

### Changed
- **UI Redesign**: Simplified and modernized the entire user interface by removing visual clutter. Removed the excessive use of decorative icons across all cards, navigation tabs, and content sections (News, Gallery, Stats, About, Structure) to create a more professional and minimalist aesthetic.
- **Background Update**: Replaced the previous grid background with a subtle, modern radial gradient background in `layout.tsx` to reduce the "boxy" feel and improve visual aesthetics.
- **Navbar Layout**: Fixed vertical alignment of the BEM FT UNESA logo and text in `Navbar.tsx` by enforcing exact dimensions (`40x40`) and tightening the line-height for a polished look.
- **IMS Navigation Permissions**: Shifted IMS (CMS) module from purely role-based gating to granular permission-based gating (e.g., `content:read`, `gallery:read`, `aspiration:read`) in `navigation-registry.ts` to allow finer control over feature access.
- **Backend Seeds**: Updated `seed-roles-and-org.ts` in the backend to explicitly seed granular permissions (`manage:all`, `content:*`, `gallery:*`, etc.) into the `Permission` collection and assign them properly to organizational roles (Kominfo, Kadep, dll).

### Fixed
- **Backend dev env**: `start:dev`/`start:debug` kini me-`unset MONGODB_URI` & `REDIS_URL` dari environment shell (yang mewarisi nilai root `.env` dengan host docker `db`) sehingga server lokal selalu memakai `backend/.env` (`127.0.0.1:27017`) dan bisa start tanpa override manual. Script `start`/`start:prod` & Dockerfile tidak diubah (produksi tetap memakai host `db` dari compose).
- Fixed TypeScript build failures (`Type error: Property 'data' does not exist`) by correctly typing response objects in `frontend/src/lib/api.ts`.
- Fixed `Cannot read properties of undefined (reading 'data')` crashes when rendering `/galeri` and `/oprec` pages.
- Restored missing files and uncommitted frontend code that inadvertently caused application errors after reverting the UI redesign.
