# ðŸŒ HEADLESS CMS PUBLIC WEB BEM FT UNESA

**Domain**: `bemftunesa.org`
**Version**: **v3.0 (Enterprise ERP Edition)**

---

## 🎯 1. Deskripsi & Tujuan

Website publik **BEM FT UNESA** berfungsi sebagai **wajah media digital utama** organisasi. Menggunakan arsitektur **Headless CMS**, seluruh informasi profil organisasi, jajaran fungsionaris, program kerja, artikel berita, dan dokumentasi kegiatan tidak ditulis secara statis (hardcoded), melainkan disajikan secara dinamis dari **Central ERP API**.

```
 [VISITOR (bemftunesa.org)] ──► [Next.js ISR Layer (Incremental Static)]
                                            â”‚
                                            â–¼
                               [Central API / MongoDB Data]
                               (Managed via IMS CMS Module)
```

### Core Public Web Objectives:

- **SEO-First Performance**: Penggunaan optimal SSG (Static Site Generation) dan ISR (Incremental Static Regeneration) untuk meminimalkan waktu respon halaman (LCP < 1.2 detik).
- **Headless Data Ingestion**: Seluruh komponen dinamis (kartu pengurus departemen, progres proker, berita) bersumber dari endpoint publik terenkripsi.
- **Transparent Document Verification**: Mengakomodasi validasi dokumen digital BEM FT secara instan melalui pencocokan kode hash QR Code.

---

## ðŸ—ºï¸ 2. Sitemap & Arsitektur Konten

```mermaid
graph TD
    A[bemftunesa.org] --> B[Home / Landing Page]
    A --> C[Tentang Kabinet]
    A --> D[Struktur & Fungsionaris]
    A --> E[Program Kerja Publik]
    A --> F[Portal Berita / Media]
    A --> G[Aspirasi & Transparansi]
    A --> H[Verifikasi Surat QR Code]

    C --> C1[Visi & Misi]
    C --> C2[Filosofi Lambang Kabinet]

    D --> D1[Struktur Cabang Depan BPH]
    D --> D2[Detail Profil Pengurus & Bidang]

    F --> F1[Liputan Kegiatan BEM]
    F --> F2[Opini & Pengumuman Mahasiswa]
```

---

## ðŸ§© 3. Fitur Utama Platform

### 3.1 Headless CMS Hub

- **Incremental Static Regeneration (ISR)**: Next.js mengompilasi halaman artikel berita secara statis untuk performa loading kilat. Pemicu revalidasi berjalan setiap 60 detik di latar belakang saat artikel baru diterbitkan di IMS.
- **Semantic Organization Chart Tree**: Visualisasi bagan kepengurusan kabinet interaktif yang merender relasi departemen secara otomatis berdasarkan profil pengguna aktif di database.

### 3.2 Aspirasi Mahasiswa (Public Aspiration Box)

- **Encrypted Submission**: Mahasiswa dapat menyalurkan kritik atau rekomendasi fasilitas secara anonim. Payload dikirim terenkripsi ke backend.
- **Public Tracking Code**: Pengirim aspirasi menerima kode pelacakan unik untuk memantau status penyelesaian aspirasi di IMS (status: `Diterima` -> `Didisposisikan` -> `Diproses` -> `Selesai`).

### 3.3 Verifikasi Keabsahan Surat (Document QR Verifier)

- **Secure Validation**: Setiap surat resmi BEM FT dilengkapi QR Code unik yang menunjuk ke rute `verify/[UUID]`.
- **State Verification**: Halaman verifikasi melakukan lookup database untuk menampilkan detail judul surat, nomor surat resmi, nama fungsionaris penandatangan, tanggal terbit, serta status keabsahan dokumen (Sah / Kadaluwarsa).

---

## ðŸ§± 4. Arsitektur Teknis & Struktur Aplikasi

### 4.1 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui + Glassmorphism effects
- **Data Ingestion**: Axios / TanStack Query -> `api.bemftunesa.org/v1/public/*`
- **Performance Check**: Google Lighthouse Score target > 95 (Core Web Vitals Optimal)

### 4.2 App Structure

```
apps/public/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ page.tsx                     # Landing Page (Highlights, Stat Counter, CTA)
â”‚   â”œâ”€â”€ tentang/
â”‚   â”‚   â”œâ”€â”€ visi-misi/page.tsx       # Visi & Misi Kabinet
â”‚   â”‚   â””â”€â”€ kabinet/page.tsx         # Filosofi & Informasi Kabinet
â”‚   â”œâ”€â”€ struktur/page.tsx            # Tree Bagan Kepengurusan Dinamis
â”‚   â”œâ”€â”€ proker/
â”‚   â”‚   â”œâ”€â”€ page.tsx                 # Grid Timeline Program Kerja Kabinet
â”‚   â”‚   â””â”€â”€ [slug]/page.tsx          # Detail & Dokumentasi Proker Selesai
â”‚   â”œâ”€â”€ berita/
â”‚   â”‚   â”œâ”€â”€ page.tsx                 # Portal Berita & Pengumuman (Paginated)
â”‚   â”‚   â””â”€â”€ [slug]/page.tsx          # Detail Artikel (ISR Rendered)
â”‚   â”œâ”€â”€ aspirasi/page.tsx            # Form Pengaduan & Tracking Aspirasi
â”‚   â”œâ”€â”€ verify/
â”‚   â”‚   â”œâ”€â”€ check/page.tsx           # Form Input Manual Cek UUID Surat
â”‚   â”‚   â””â”€â”€ [uuid]/page.tsx          # Tampilan Validitas Surat Resmi QR
â”‚   â””â”€â”€ layout.tsx
â””â”€â”€ components/
    â”œâ”€â”€ home/
    â”‚   â”œâ”€â”€ stats-counter.tsx        # Widget animasi counter pencapaian proker
    â”‚   â””â”€â”€ quick-nav.tsx            # Navigasi cepat antar-portal ekosistem
    â””â”€â”€ layout/
        â”œâ”€â”€ navbar.tsx               # Transparent Glassmorphic Navigation bar
        â””â”€â”€ footer.tsx               # Footer informasi alamat & media sosial
```

---

## ðŸ—‚ï¸ 5. Skema Integrasi API Terpusat

- **Get Berita Publik**: `GET api.bemftunesa.org/public/articles`
- **Get Proker Aktif**: `GET api.bemftunesa.org/public/proker`
- **Submit Aspirasi**: `POST api.bemftunesa.org/public/aspirations`
- **Verify Surat QR**: `GET api.bemftunesa.org/public/verify/:uuid`
