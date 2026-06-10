# 🎓 PKKMB & MENTORING PORTAL BEM FT UNESA

**Domain**: `pkkmb.bemftunesa.org`
**Version**: **v2.0 (Enterprise ERP Edition)**

---

## 🎯 1. Deskripsi & Tujuan

Aplikasi khusus **PKKMB & Mentoring** Fakultas Teknik UNESA dirancang sebagai portal terpadu untuk mendistribusikan materi, memantau tata tertib, mengumpulkan tugas harian, serta merekam presensi kehadiran mahasiswa baru secara real-time. Platform ini secara langsung terhubung ke **Central API & IMS Core** untuk memfasilitasi panitia penilai (reviewers) dalam melakukan audit tugas.

```
 [MAHASISWA BARU (pkkmb.bemftunesa.org)] ──► [Central API] ──► [IMS REVIEW BOARD]
                     â”‚                                                â”‚
   (NIM Auth, Tasks Submit, QR Attendance)                  (Coordinators, Grading)
                                                                      â”‚
                                                                      â–¼
                                                             [Points Leaderboard]
```

### Core PKKMB Objectives:

- **High-Throughput Load Balancing**: Mengantisipasi lonjakan traffic masif dari ribuan mahasiswa baru yang mengakses halaman tugas secara serentak.
- **Granular Evaluator Role (Reviewer System)**: Memberikan akses **Dynamic PKKMB Role** bagi fungsionaris BEM atau panitia luar yang ditunjuk untuk menguji berkas tugas tanpa memberikan hak bypass data master organisasi.
- **Integrated Student Performance Analytics**: Menyinkronkan nilai tugas mahasiswa baru secara terpusat untuk memetakan kelompok terbaik dan mahasiswa teraktif.

---

## ðŸ‘¥ 2. Hierarki Akses & Peran Panitia PKKMB

Melalui sistem S-RBAC, panitia PKKMB mendapatkan delegasi hak akses temporal yang dikunci berdasarkan siklus hidup kepanitiaan:

| Peran Pengguna          | Context Otoritas         | Otoritas Modul PKKMB                                                                          |
| :---------------------- | :----------------------- | :-------------------------------------------------------------------------------------------- |
| **BPI (KaBEM/WaKaBEM)** | Global Organisasi        | Full access, ekspor rekapitulasi nilai mahasiswa baru, otorisasi kelulusan.                   |
| **Kordinator Panitia**  | Dynamic Scope (PKKMB)    | Manajemen draf tugas, setup parameter deadline, alokasi mentor kelompok.                      |
| **Mentor / Reviewer**   | Dynamic Scope (Kelompok) | Validasi kehadiran kelompok binaan, memberikan skor tugas (grading), input catatan perbaikan. |
| **Mahasiswa Baru**      | Scoped NIM               | Membaca materi/guidebook, submit tugas harian, scan QR presensi.                              |

---

## ðŸ”„ 3. Alur Tugas & Penilaian (Task Workflow)

```
[Kordiv PKKMB Buat Tugas] ──► [Peserta Login via NIM] ──► [Submit Tugas via Supabase Storage]
                                                                  â”‚
                                                                  â–¼
[Penilaian Dinamis oleh Mentor/Reviewer] â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
  â”œâ”€â”€ Status: Verified & Graded (Skor 0-100)
  â””â”€â”€ Status: Need Revision (Kembalikan ke Maba)
                                  â”‚
                                  â–¼
             [Leaderboard Kelompok & Point Sync di IMS]
```

---

## ðŸ§© 4. Fitur Utama Portal

### 4.1 Portal Mahasiswa Baru (Participant Portal)

- **NIM-Based High-Concurrency Login**: Otentikasi aman berbasis NIM yang terintegrasi database mahasiswa Fakultas Teknik UNESA untuk mencegah duplikasi pendaftaran atau pemalsuan identitas.
- **Task Submission Gateway**: Form pengunggahan berkas tugas (file PDF, gambar poster, link video) yang terkompresi otomatis sebelum dikirim ke cold storage Supabase.
- **Dynamic QR Code Attendance**: Sistem presensi check-in harian menggunakan scan QR Code dinamis yang berubah setiap 30 detik untuk mencegah kecurangan titip absen.

### 4.2 Dasbor Evaluator (IMS Reviewer Panel)

- **Grading Interface**: Halaman penilaian bagi mentor untuk memberikan skor numerik dan evaluasi kualitatif secara cepat per-kelompok binaan.
- **Automatic Point Dispersion**: Akumulasi nilai secara otomatis mendistribusikan poin ke _leaderboard kelompok mentoring terbaik_ di halaman depan portal.

---

## ðŸ§± 5. Arsitektur Teknis & Struktur Aplikasi

### 5.1 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Data Layer**: TanStack Query -> `api.bemftunesa.org/v1/pkkmb/*`
- **Real-time Sync**: Web Push Notification (Pemberitahuan deadline mendadak)

### 5.2 App Structure

```
apps/pkkmb/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ page.tsx                     # Landing Page (Countdown & Welcome Message)
â”‚   â”œâ”€â”€ login/page.tsx               # Halaman Login NIM & Kode Kelompok
â”‚   â”œâ”€â”€ jadwal/page.tsx              # Timeline Harian & Dresscode
â”‚   â”œâ”€â”€ panduan/page.tsx             # E-Guidebook Interaktif
â”‚   â”œâ”€â”€ tugas/
â”‚   â”‚   â”œâ”€â”€ page.tsx                 # List Tugas Aktif (Status Pengumpulan)
â”‚   â”‚   â””â”€â”€ [id]/page.tsx            # Form Submission Tugas
â”‚   â””â”€â”€ layout.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ pkkmb/
â”‚   â”‚   â”œâ”€â”€ countdown.tsx            # Widget Countdown acara utama
â”‚   â”‚   â””â”€â”€ attendance-scanner.tsx   # Scanner QR Code presensi peserta
â”‚   â””â”€â”€ ui/
â””â”€â”€ lib/
    â”œâ”€â”€ api.ts                       # Fetch wrapper terhubung central-api
    â””â”€â”€ utils.ts
```

---

## ðŸ—‚ï¸ 6. Skema Koleksi Database (PKKMB Subsystem)

- **Collection `pkkmb_participants`**:
  `id, nim, name, email, phone, groupId, attendanceLogs (array), status`
- **Collection `pkkmb_tasks`**:
  `id, title, description, deadline, pointsMax, attachments (array)`
- **Collection `pkkmb_submissions`**:
  `id, taskId (Ref), participantId (Ref), fileUrl, textContent, score (0-100), status ('Pending' | 'Graded' | 'Revision'), gradedBy (Ref: users)`
