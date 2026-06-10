# BEM FT UNESA Digital Ecosystem 🌐

![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

Repositori pusat (Monorepo) untuk seluruh layanan digital dan sistem informasi Badan Eksekutif Mahasiswa (BEM) Fakultas Teknik, Universitas Negeri Surabaya. Dibangun dengan menggunakan arsitektur monorepo **Turborepo** dan **Bun** sebagai *package manager*.

---

## 🏗️ Struktur Ekosistem (Apps)

Ekosistem ini dibagi menjadi beberapa aplikasi utama yang saling terintegrasi:

| Aplikasi | Deskripsi | Teknologi | Port Akses |
| -------- | --------- | --------- | ---------- |
| **`frontend`** | Portal Publik & Landing Page (`bemftunesa.org`) | Next.js, TailwindCSS | `3000` |
| **`backend`** | Central API & Logic Layer (`api.bemftunesa.org`) | NestJS, MongoDB, BullMQ | `3001` |
| **`ims`** | Information Management System / Dashboard Admin | Next.js, Shadcn UI | `3004` |
| **`oprec`** | Portal Pendaftaran & Open Recruitment | Next.js, TailwindCSS | `3002` |

## 📦 Shared Packages

Kode internal yang digunakan secara bersama-sama oleh aplikasi di atas terletak pada folder `packages/`:

- `@bemft/api-client`: Konfigurasi Axios & TanStack Query terpusat.
- `@bemft/permissions`: Sistem ACL (Access Control List) & Role-Based Security.
- `@bemft/types`: Definisi *TypeScript interfaces* dan skema validasi Zod.
- `@bemft/utils`: Fungsi *helper* dan *utilities*.
- `@bemft/workflow`: *Engine* sistem dokumen dan *workflow state*.

---

## ✨ Fitur Utama (Bahasa Awam / Non-IT)

Untuk teman-teman pengurus BEM yang bukan dari jurusan IT, ini adalah ringkasan apa saja yang bisa dilakukan oleh sistem kita:

1. 📝 **Sistem Persuratan & LPJ Otomatis**: Pengajuan proposal, surat menyurat, hingga LPJ tidak perlu lagi dikirim manual via WA. Semua lewat sistem (Dashboard IMS) dan bisa dilacak statusnya (apakah sedang direvisi, disetujui, atau ditolak).
2. 🔐 **Keamanan & Persetujuan Ketat**: Persetujuan dana (RAB/Proposal) membutuhkan verifikasi ganda (seperti masuk m-banking) oleh Ketua BEM atau Bendahara, sehingga uang organisasi sangat aman.
3. 🔔 **Notifikasi Otomatis**: Jika ada proposal yang butuh tanda tangan atau batas waktu revisi LPJ mau habis, sistem akan otomatis mengirimkan notifikasi.
4. 🌐 **Portal Informasi Terpusat**: Mahasiswa umum bisa melihat berita terbaru, struktur kabinet, dan mengecek transparansi program kerja BEM langsung di website utama (`bemftunesa.org`).
5. 🎯 **Pendaftaran Panitia & Pengurus (Oprec)**: Mahasiswa yang ingin mendaftar kepanitiaan atau menjadi pengurus BEM bisa langsung mengisi form, mengunggah berkas, dan melihat hasil seleksi di portal khusus Oprec (`oprec.bemftunesa.org`).
6. 🕵️ **Rekam Jejak Transparan**: Semua perubahan data, siapa yang menyetujui dokumen, dan jam berapa mereka login akan tercatat permanen di sistem, sehingga tidak ada data yang bisa dimanipulasi secara diam-diam.

---

## 🚀 Memulai Pengembangan Lokal (Getting Started)

### Prasyarat Instalasi
Pastikan komputer kamu sudah terinstal alat-alat berikut:
1. **[Node.js](https://nodejs.org/)** (v18 atau lebih baru)
2. **[Bun](https://bun.sh/)** (Sangat direkomendasikan sebagai *package manager* utama)
3. **[Docker](https://www.docker.com/)** (Opsional, untuk menjalankan database)

### Langkah Instalasi

1. **Kloning Repositori**
   ```bash
   git clone https://github.com/dihanio/bemftunesa2026.git
   cd bemftunesa2026
   ```

2. **Instalasi Dependencies**
   Gunakan Bun untuk menginstal semua *dependencies* (paket eksternal maupun internal):
   ```bash
   bun install
   ```

3. **Konfigurasi Environment**
   Setiap aplikasi (`frontend`, `backend`, dll) membutuhkan file `.env`.
   - Copy `.env.example` menjadi `.env` di folder *root* dan di masing-masing aplikasi (jika tersedia).
   - Isi kredensial database (MongoDB) dan konfigurasi JWT di `backend/.env`.

4. **Jalankan Aplikasi**
   Karena ini adalah Monorepo, kamu bisa menjalankan semua aplikasi secara bersamaan dari *root directory*:
   ```bash
   # Menjalankan SEMUA aplikasi sekaligus
   bun run dev:all
   
   # ATAU menjalankan aplikasi secara spesifik
   bun run dev:frontend
   bun run dev:backend
   bun run dev:ims
   ```

---

## ☁️ Deployment (Produksi)

Aplikasi ini dirancang untuk di-*deploy* menggunakan layanan cloud modern:
- **Frontend, IMS, Oprec**: Dirancang agar terintegrasi penuh dengan **Vercel** secara langsung. Cukup arahkan *Root Directory* Vercel ke folder yang sesuai (`frontend`, `ims`, atau `oprec`).
- **Backend API**: Di-*deploy* menggunakan Docker. Konfigurasi `docker-compose.yml` telah disediakan di *root directory*.

---

## 🛡️ Kebijakan & Lisensi
Sistem informasi ini adalah milik hak kekayaan intelektual (HKI) dari Departemen Kominfo BEM FT UNESA. Tidak untuk disebarluaskan untuk penggunaan di luar lingkup internal tanpa izin tertulis.

> Dikembangkan dengan ❤️ oleh Tim Dev BEM FT UNESA.
