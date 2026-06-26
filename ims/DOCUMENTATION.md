# Information Management System (IMS) - BEM FT UNESA

Dokumen ini menjelaskan struktur, arsitektur, dan fitur dari modul Information Management System (IMS) pada platform BEM FT UNESA.

## 1. Ikhtisar (Overview)
IMS adalah sistem manajemen internal yang dibangun khusus untuk fungsionaris BEM FT UNESA. Tujuannya adalah untuk mendigitalisasi proses administrasi, persuratan, program kerja, inventaris, dan keuangan organisasi.

- **Frontend Stack**: Next.js (App Router), React 19, Tailwind CSS v4.
- **Styling**: Pendekatan UI berkelas dengan tema *Dark Mode* (`bg-background`, efek `glass-subtle`), tipografi bersih, dan ikon dari `lucide-react`.
- **Komunikasi Data**: REST API (`src/lib/api.ts`) yang terhubung dengan backend NestJS/Express di `localhost:5000`.
- **Autentikasi & Otorisasi**: Berbasis Token JWT (`ims_token` di LocalStorage) dan Role-Based Access Control (RBAC).

## 2. Role-Based Access Control (RBAC)
Sistem ini membatasi menu dan aksi berdasarkan *role* (peran) yang dimiliki pengguna di periode yang aktif. 
Menu yang tampil di *sidebar* secara dinamis dirender berdasarkan *role* pengguna saat login (dikonfigurasi pada `src/config/sidebar-registry.ts`).

Daftar peran utama:
1. **Super Admin (Global)**: Memiliki akses penuh ke seluruh modul, termasuk pengaturan sistem dan audit keamanan.
2. **Ketua BEM (Global)**: Akses *view* dan persetujuan (approval) tingkat tertinggi untuk surat, proker, dan keuangan.
3. **Sekretaris (Global)**: Fokus pada modul administrasi (Surat, Arsip, Dokumen, Notulensi, dan Template).
4. **Bendahara (Global)**: Fokus pada modul keuangan (Anggaran, Kas, RAB, SPJ, dan Ledger).
5. **Kepala Departemen / Kadep (Department)**: Akses manajemen untuk lingkup departemennya (Proker, Rapat Departemen).
6. **Staf (Department)**: Akses operasional dasar di dalam departemen (Absensi rapat, pelaksanaan task).

## 3. Modul Utama & Struktur Direktori

Sistem ini dipecah ke dalam beberapa *route* Next.js (berada di dalam `src/app/`):

### A. Modul Program Kerja (`/proker`)
Digunakan untuk mengajukan, melacak progres, dan memonitor program kerja (proker).
- `/proker` (List Proker)
- `/proker/new` (Form Pengajuan Proker)
- `/proker/[id]` (Detail, Status, dan Persetujuan)

### B. Modul Persuratan (`/surat`)
Manajemen surat masuk dan surat keluar dengan alur persetujuan digital.
- `/surat` (Arsip Surat)
- `/surat/new` (Buat Surat / *Drafting*)
- `/surat/[id]` (Detail dan Disposisi)

### C. Modul Rapat & Notulensi (`/rapat`)
Penjadwalan rapat, pencatatan hasil rapat (notulensi), dan absensi kehadiran.
- `/rapat` (Jadwal Rapat)
- `/rapat/new` (Undangan Rapat)
- `/rapat/[id]` (Detail & Hasil)
- `/rapat/[id]/attend` (Presensi / QR Code Scanner)

### D. Modul Keuangan (`/keuangan`)
Manajemen tata kelola uang organisasi.
- `/keuangan/kas`, `/keuangan/rab`, `/keuangan/spj`
- `/keuangan/new` (Form pengajuan dana/laporan pengeluaran)

### E. Modul Inventaris / Aset (`/assets`)
Pencatatan barang dan peminjaman fasilitas organisasi.
- `/assets` (List Aset BEM)
- `/assets/new` (Pendaftaran Aset)
- `/assets/[id]` (Peminjaman / Booking)

### F. Pengaturan & Organisasi (`/settings`, `/organizations`)
Dilindungi secara khusus untuk level eksekutif/admin.
- `/organizations/departments` (Struktur Organisasi)
- `/settings/users`, `/settings/roles` (Manajemen Akun & Otoritas)

## 4. Arsitektur Komponen UI

Aplikasi ini menggunakan komponen layout inti (`DashboardShell`) yang membungkus semua halaman, memberikan konsistensi UI.

- **`DashboardShell.tsx`**: Komponen utama yang bertanggung jawab memastikan state login aman (verifikasi token), mengambil profil pengguna, dan menampilkan `DashboardHeader` serta `DashboardSidebar`. Jika user tidak valid, akan dilempar kembali ke `/login`.
- **`DashboardSidebar.tsx`**: Membaca state *role* aktif dari context, dan mengambil daftar rute dari `sidebar-registry.ts`.
- **`DashboardHeader.tsx`**: Menampilkan notifikasi, breadcrumbs, dan **Menu Switch Role** (memungkinkan pengguna yang memiliki jabatan ganda untuk berpindah *context* tanpa login ulang).

## 5. Flow Autentikasi (Siklus Login)

1. User mengakses `/login`.
2. Klik tombol "Login dengan Akun UNESA" (Google SSO di backend).
3. Backend mengembalikan `token` JWT dan menyimpan *Role Assignments*.
4. Frontend menyimpan `token` di `localStorage("ims_token")` dan di-*redirect* ke `/`.
5. `DashboardShell` di-mount, membaca token, memanggil `GET /v1/auth/me`.
6. Jika sukses, UI dimunculkan. Jika token kedaluwarsa atau *Role* kosong, di-*redirect* kembali ke `/login`.

## 6. Target Pengembangan / UI Polish (Next Steps)
Saat ini sistem telah di-*generate* secara struktural dengan semua *routing* fungsional (tidak ada halaman error 404). Fase selanjutnya berfokus pada:
- Transisi status `Loading` ke komponen Spinner yang mulus.
- Penggunaan library `sonner` untuk pesan Toast (Notifikasi).
- Integrasi logika HTTP yang lebih riil ke endpoint backend secara komprehensif.
