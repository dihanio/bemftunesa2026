# Dokumentasi Fitur Ekosistem Digital BEM FT UNESA

Ekosistem Digital BEM FT UNESA (Kabinet Danadyaksa 2026) adalah sebuah sistem terintegrasi yang dirancang untuk mendigitalisasi operasional internal fungsionaris, menyediakan layanan advokasi publik bagi mahasiswa, dan ditenagai oleh API Gateway terpusat. 

Sistem ini terbagi menjadi tiga komponen utama, yaitu **Portal Publik (Frontend)**, **Internal Management System (IMS)**, dan **Backend API**. Berikut adalah bedah detail dari semua fitur yang ada di dalam proyek ini:

---

## 1. 🌐 Portal Publik (`frontend/` / `bemft-unesa-web`)
Portal publik ini didesain khusus untuk mahasiswa Fakultas Teknik UNESA dan masyarakat umum sebagai portal informasi satu pintu dan wadah interaksi advokasi digital.

### Fitur Utama:
*   🏠 **Beranda (Landing Page)**:
    *   **Hero Section**: Tampilan modern dengan animasi interaktif berbasis Framer Motion yang memperkenalkan Kabinet Danadyaksa.
    *   **Quick Stats**: Penghitung statistik real-time jumlah anggota, departemen, program kerja, dan status penyelesaian aspirasi.
    *   **Agenda Timeline**: Widget daftar agenda terdekat BEM FT yang sedang berjalan atau akan dilaksanakan.
    *   **News Ticker**: Ringkasan rilis berita terbaru dengan akses cepat ke detail berita.
*   ℹ️ **Profil & Tentang**:
    *   Menyajikan informasi mendalam tentang filosofi nama, logo, visi, dan misi Kabinet Danadyaksa BEM FT UNESA 2026.
*   👥 **Struktur Organisasi**:
    *   Menampilkan halaman interaktif yang memuat pohon organisasi dari Badan Pengurus Harian (BPH), Badan Pengurus Inti (BPI), Kepala Departemen, hingga staf divisi lengkap dengan foto profil fungsionaris.
*   📊 **Program Kerja (Proker)**:
    *   Direktori lengkap seluruh program kerja BEM FT yang dapat dicari berdasarkan departemen, dilengkapi status progress pelaksanaan kerja.
*   📥 **Kanal Advokasi & Kotak Aspirasi**:
    *   **Aspiration Form**: Formulir pengaduan bagi mahasiswa untuk menyampaikan keluhan seputar fasilitas kampus, banding UKT, birokrasi, atau kesejahteraan. Mahasiswa dapat mengirimkan laporan secara **Anonim** (tanpa nama) demi privasi dan keamanan.
    *   **Aspiration Tracker**: Pelacakan status pengaduan secara real-time menggunakan **ID Tiket unik**. Mahasiswa dapat memantau apakah pengaduan berstatus *Menunggu*, *Sedang Diproses*, atau *Selesai/Ditinjaklanjuti* beserta tanggapan atau solusi tertulis dari BEM FT.
*   📰 **Portal Berita & Publikasi**:
    *   Daftar artikel terbagi dalam tiga kategori utama: *Kegiatan*, *Pengumuman Resmi*, dan *Opini Mahasiswa*.
    *   Dilengkapi dengan fitur pencarian kata kunci dan filter kategori yang instan.
*   📞 **Hubungi Kami (Kontak)**:
    *   Formulir pesan terintegrasi untuk kebutuhan kerja sama eksternal, kemitraan sponsorship, dan saran dari masyarakat umum.

---

## 2. 💼 Internal Management System / IMS (`ims/`)
IMS berfungsi sebagai ERP (Enterprise Resource Planning) organisasi mahasiswa dan menjadi pusat pengelolaan administrasi, operasional, serta kepanitiaan para fungsionaris BEM FT.

### Fitur Utama:
*   🔐 **Google SSO & Session Management**:
    *   Sistem otentikasi login sekali klik menggunakan Google Akun dengan pembatasan wajib menggunakan domain `@mhs.unesa.ac.id` atau `@unesa.ac.id` untuk menjamin keamanan akses fungsionaris internal.
    *   Fitur rotasi token sesi otomatis (*Refresh Token Rotation*) dan kontrol daftar perangkat tepercaya.
*   📊 **Dashboard Internal & Telemetri**:
    *   Visualisasi grafik mengenai alokasi anggaran bulanan per departemen, grafik status siklus hidup program kerja, serta visualisasi beban kerja anggota fungsionaris.
    *   **SysAdmin Telemetry**: Panel khusus bagi admin untuk memantau status CPU, penggunaan memori RAM, kapasitas database MongoDB, serta kontrol *Feature Flags* untuk mengaktifkan/mematikan fitur tertentu dari jarak jauh secara real-time.
*   📋 **Manajemen Program Kerja (Proker)**:
    *   **Kanban Taskboard**: Papan tugas kolaboratif (*To Do, In Progress, Review, Done*) untuk manajemen penugasan setiap fungsionaris.
    *   **Milestone Tracker**: Daftar periksa (checklist) pencapaian target kerja dari suatu program tertentu.
    *   **Ledger Keuangan Proker**: Modul pencatatan kas masuk dan keluar yang spesifik untuk setiap kegiatan.
*   👥 **Manajemen Kepanitiaan (Ad Hoc)**:
    *   Modul untuk pencatatan struktur kepanitiaan kegiatan (OC & SC), pembagian divisi kepanitiaan, dan batasan hak akses fungsionaris berdasarkan perannya di proker terkait.
*   📄 **Modul Persuratan Digital**:
    *   **Automatic Numbering**: Penomoran surat otomatis yang berdasarkan pada kategori, jenis surat, dan tanggal keluar guna mencegah adanya nomor surat ganda.
    *   **Multi-Step Approval**: Alur verifikasi surat yang berjenjang: draf oleh staf ➡️ verifikasi nomor oleh Sekretaris ➡️ persetujuan (ACC) Sekretaris ➡️ persetujuan akhir dan TTD oleh Ketua BEM.
    *   **Digital Signature**: Tanda tangan digital otomatis pada file PDF surat final, dilengkapi dengan **Kode QR** verifikasi keaslian surat yang dapat dipindai oleh pihak publik.
    *   **Version Control**: Manajemen riwayat revisi draf surat yang dilengkapi fitur rollback.
*   💰 **Verifikasi Anggaran & RAB**:
    *   Fitur penyusunan RAB (Rencana Anggaran Belanja) mendetail untuk setiap item barang.
    *   Sistem alur pengajuan proposal kegiatan, verifikasi administrasi anggaran oleh Bendahara, dan persetujuan akhir alokasi dana oleh Ketua BEM.
    *   Pencatatan SPJ (Surat Pertanggungjawaban) dan LPJ keuangan pasca-kegiatan.
*   🗓️ **Manajemen Rapat & Absensi**:
    *   **QR Attendance**: Pengelolaan absensi rapat otomatis dengan pemindaian kode QR unik yang terus berganti setiap menitnya.
    *   **GPS Geofencing**: Validasi koordinat lokasi (garis lintang/bujur) dan radius peserta rapat untuk meminimalisasi manipulasi atau kehadiran palsu.
    *   Fitur pembuatan dan pengarsipan notulensi rapat secara digital.
*   📦 **Inventarisasi Aset & Peminjaman**:
    *   Pencatatan daftar aset organisasi secara lengkap dengan kode identifikasi unik (misal: `BEM-2026-CHAIR-001`).
    *   Pengelolaan alur peminjaman aset fungsionaris lengkap dengan notifikasi pengingat untuk pengembalian barang.
*   🏆 **Reward & Point Keaktifan**:
    *   Sistem pemberian poin apresiasi (*gamification*) atas keaktifan fungsionaris, seperti kehadiran rapat tepat waktu atau penyelesaian tugas program kerja.
    *   **Leaderboard**: Papan peringkat keaktifan anggota di tingkat departemen.

---

## 3. ⚡ Backend API (`backend/`)
Backend merupakan mesin utama ekosistem digital yang melayani API RESTful, mengelola otorisasi data, menjalankan antrean latar belakang (*background job*), serta menangani integrasi dengan penyimpanan objek.

### Fitur Utama:
*   🛡️ **Granular RBAC (Role-Based Access Control) Engine**:
    *   Sistem perizinan hak akses berbasis peran yang bertingkat, mencakup: *Super Admin, Ketua BEM, Wakil Ketua BEM, Administrator, Sekretaris, Bendahara, Kepala Departemen, Wakil Kepala Departemen, Staf Divisi,* dan *Tamu*.
    *   Penerapan (enforcement) scope akses data secara ketat: 
        *   `Global`: Akses ke seluruh data BEM.
        *   `Department-scoped`: Akses terbatas pada departemen sendiri.
        *   `Committee-scoped`: Akses terbatas pada data kepanitiaan tertentu.
        *   `Own-scoped`: Akses terbatas pada data pribadi milik fungsionaris tersebut.
*   🔒 **Audit Trail Immutable**:
    *   Pencatatan histori (log) atas aktivitas-aktivitas krusial fungsionaris (seperti transfer dana, persetujuan surat, update role).
    *   Data audit disimpan secara permanen di database dengan sistem *write-once, read-many* (tanpa kapabilitas hapus/modifikasi untuk memastikan akuntabilitas).
*   🚀 **Antrean Proses & Notifikasi (BullMQ + Redis)**:
    *   Sistem antrean pekerjaan (background queue) untuk mendistribusikan email pemberitahuan secara otomatis kepada fungsionaris, contohnya jika ada proposal atau draf surat yang memerlukan persetujuan (approval) secara cepat.
*   📁 **Integrasi Storage Object (Supabase Storage)**:
    *   Integrasi aman dan tersentralisasi menggunakan layanan cloud storage untuk menyimpan berbagai dokumen PDF seperti proposal, LPJ, maupun aset tanda tangan.

---

*Dokumentasi ini mencerminkan ruang lingkup dan arsitektur pengembangan Ekosistem Digital BEM FT UNESA.*
