# ðŸ“ RECRUITMENT MANAGEMENT SYSTEM (OR)

**Domain**: `or.bemftunesa.org`
**Version**: **v3.0 (Enterprise ERP Edition)**

---

## 🎯 1. Deskripsi & Tujuan

Aplikasi khusus **Open Recruitment (OR)** dirancang untuk memfasilitasi penjaringan fungsionaris baru BEM FT UNESA serta panitia pelaksana kegiatan (OC) secara transparan, masif, dan terstruktur. Dipisahkan ke subdomain khusus untuk menangani lonjakan lalu lintas data (traffic spike) saat masa pendaftaran mahasiswa baru dibuka.

```
 [APPLICANT PORTAL (or.bemftunesa.org)] ──► [Central API] ──► [IMS REVIEW BOARD]
                     â”‚                                                â”‚
   (Biodata, CV & Upload Berkas)                            (Scoring & Assignment)
                                                                      â”‚
                                                                      â–¼
                                                             [User Auto-Creation]
```

### Core Recruitment Objectives:

- **High Traffic Scalability**: Mengisolasi proses pendaftaran ribuan mahasiswa pendaftar di atas infrastruktur server Next.js (Vercel CDN) untuk mencegah dampak down pada website utama BEM FT.
- **Strict Evaluation Pipeline**: Mendukung kualifikasi bertingkat mulai dari seleksi berkas, penjadwalan wawancara, hingga pengisian nilai (scoring) yang transparan oleh pewawancara.
- **Seamless User Synchronization**: Otomatisasi pembuatan akun fungsionaris baru di dalam sistem database IMS saat status pendaftar diubah menjadi _Accepted/Lolos_.

---

## ðŸ”„ 2. Rekrutmen Pipeline (Recruitment Pipeline)

Proses pendaftaran dikelola melalui lima gerbang seleksi dinamis yang dipantau real-time oleh fungsionaris BPI/BPH melalui dasbor internal IMS:

```
[Applied] ──► [Administration Review] ──► [Interview Schedule] ──► [Interview Scoring] ──► [Final Review] ──► [Accepted/Rejected]
```

### 2.1 Tahapan Evaluasi Detail

1. **Applied (Pendaftaran Awal)**:
   - Pengisian data terintegrasi multi-step form: biodata diri, pilihan departemen/kepanitiaan 1 & 2, penulisan esai motivasi, dan upload berkas kelengkapan (CV, KRS/KRM, Foto).
2. **Administration Review (Seleksi Berkas)**:
   - Fungsionaris BPI (Sekretaris) atau panitia seleksi memeriksa kelengkapan fisik berkas secara digital. Data yang tidak valid ditolak dengan pemberian umpan balik.
3. **Interview Schedule (Penjadwalan Wawancara)**:
   - Integrasi **Interview Scheduler & Assignment**. Pewawancara menentukan slot jam kosong, dan sistem otomatis menetapkan jadwal peserta serta pewawancara pendamping. Kartu ujian wawancara berformat PDF dapat diunduh langsung oleh peserta.
4. **Interview Scoring (Penilaian Wawancara)**:
   - Pewawancara mengisi lembar penilaian berbasis rubrik kriteria kompetensi (Komunikasi, Problem Solving, Komitmen, Kerja Sama Tim) beserta catatan evaluasi kualitatif secara real-time pada dasbor.
5. **Final Review (Keputusan Akhir)**:
   - Rapat pleno BPH (Kabem/Wabem & Kadep) membandingkan skor akumulatif pada _Talent Pool Matrix_ untuk memutuskan status akhir penerimaan peserta.

---

## ðŸ§© 3. Fitur Utama

### 3.1 Portal Calon Pengurus (Applicant Portal)

- **Mobile-Responsive Multi-Step Form**: Pengisian berkas pendaftaran terbagi menjadi beberapa tahapan intuitif dilengkapi fitur _Auto-Save_ (localStorage) untuk menghindari kehilangan data pendaftaran akibat koneksi internet terputus.
- **Real-time NIM Validation & Deduplication**: Sistem secara otomatis mengecek format NIM aktif mahasiswa Fakultas Teknik dan memblokir pendaftaran ganda dari identitas NIM yang sama.
- **Self-Check Status Portal**: Pengguna masuk menggunakan NIM dan tanggal lahir untuk melihat progress seleksi kelulusan secara mandiri.

### 3.2 Dasbor Penilai Internal (Reviewer Dashboard - IMS Connected)

- **Talent Pool Matrix**: Tampilan tabel ringkasan pelamar dilengkapi pencarian NIM, filter pilihan departemen, dan pengurutan (sorting) otomatis berdasarkan skor nilai wawancara tertinggi.
- **Auto User Provisioning Trigger**: Ketika administrator menyetujui status pendaftar menjadi `Accepted/Lolos`, sistem di backend secara otomatis memicu generator user untuk membuat data pengurus baru lengkap dengan _default role_ (Fungsionaris/Staff) dan department yang dipilih.

---

## ðŸ§± 4. Arsitektur Teknis & Struktur Aplikasi

### 4.1 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui + Framer Motion (Transisi Form Animasi)
- **State Management**: Zustand (Kelola form data antar step & detail status login peserta)
- **Data Fetching**: TanStack Query (Komunikasi API ke `api.bemftunesa.org/v1/recruitment/*`)
- **File Storage**: Supabase Storage (Alokasi CV & kelengkapan berkas)

### 4.2 App Structure

```
apps/or/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ page.tsx                     # Landing page Open Recruitment (Timeline & Info)
â”‚   â”œâ”€â”€ daftar/
â”‚   â”‚   â””â”€â”€ page.tsx                 # Multi-Step Form Pendaftaran
â”‚   â”œâ”€â”€ status/
â”‚   â”‚   â””â”€â”€ page.tsx                 # Cek Status kelulusan & jadwal wawancara (NIM Login)
â”‚   â”œâ”€â”€ pengumuman/
â”‚   â”‚   â””â”€â”€ page.tsx                 # Halaman kelulusan akhir kabinet BEM FT
â”‚   â””â”€â”€ layout.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ form/
â”‚   â”‚   â”œâ”€â”€ step-biodata.tsx         # Input biodata pelamar
â”‚   â”‚   â”œâ”€â”€ step-pilihan.tsx         # Dropdown departemen pilihan 1 & 2
â”‚   â”‚   â”œâ”€â”€ step-esai.tsx            # Form isian esai motivasi diri
â”‚   â”‚   â””â”€â”€ step-upload.tsx          # Upload CV, KRS, Foto ke Supabase
â”‚   â””â”€â”€ status/
â”‚       â””â”€â”€ status-timeline.tsx      # Tampilan progress tracker status peserta
â””â”€â”€ lib/
    â”œâ”€â”€ form-schema.ts               # Skema Zod validator untuk input form pelamar
    â””â”€â”€ api.ts                       # Axios client terkonfigurasi rate limit
```

---

## ðŸ—‚ï¸ 5. Skema Koleksi Database (OR Modules)

- **Collection `applicants`**:
  `id, name, nim, email, phone, dept_choice_1, dept_choice_2, motivation, cv_url, photo_url, status ('Applied' | 'Verified' | 'Scheduled' | 'Scored' | 'Accepted' | 'Rejected'), createdAt`
- **Collection `recruitment_scores`**:
  `id, applicantId (Ref: applicants), interviewerId (Ref: users), score (0-100), criteria (JSON map: communication, problem_solving, alignment), notes, createdAt`
- **Collection `recruitment_schedules`**:
  `id, applicantId (Ref: applicants), date, startTime, endTime, roomLocation, interviewerIds (Ref: users array)`
