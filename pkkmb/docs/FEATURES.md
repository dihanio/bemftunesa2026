# Dokumentasi Fitur Website PKKMB FT

## 1. Latar Belakang

Website PKKMB FT (Pengenalan Kehidupan Kampus bagi Mahasiswa Baru, Fakultas Teknik) sudah dibangun dan saat ini sedang dikembangkan lebih lanjut untuk mendetailkan fitur-fitur di dalamnya. Dokumen ini merangkum seluruh fitur yang direncanakan, lengkap dengan deskripsi, alur penggunaan, aktor/role yang terlibat, dan catatan teknis awal untuk memudahkan proses development.

## 2. Tujuan

- Mendigitalkan proses PKKMB agar lebih tertib, transparan, dan minim kerja manual bagi panitia.
- Mempermudah maba (mahasiswa baru) dalam mengikuti rangkaian kegiatan, mengumpulkan tugas, dan mengetahui informasi penting.
- Menyediakan data rekap yang bisa langsung dipakai untuk pelaporan ke pihak fakultas.

## 3. Aktor / Role Pengguna

| Role | Deskripsi |
|---|---|
| Maba (Peserta) | Mahasiswa baru yang mengikuti PKKMB |
| Kakak Pendamping (Divisi Pendamping) | Mendampingi kelompok tertentu, mengelola absensi kelompoknya masing-masing |
| Divisi Pemateri | Mengelola pengumpulan dan penilaian tugas |
| Divisi Acara | Mengelola jadwal kegiatan dan pengumuman |
| Divisi PDD (Publikasi, Dokumentasi, Dekorasi) | Mengelola galeri/dokumentasi kegiatan yang dilihat maba |
| Divisi Tata Tertib | Mengawasi kedisiplinan dan poin kelompok maba |
| Admin (BEM FT) | Akses penuh, mengatur role dan konfigurasi sistem |

> Catatan: role dibatasi hanya untuk divisi yang berinteraksi langsung dengan maba melalui website (absensi, tugas, jadwal/pengumuman, galeri, poin/leaderboard). Divisi lain (Kesehatan, Sponsor, Humas, KSK, Konsumsi, Perlengkapan, Keamanan, Korlap) tidak didaftarkan sebagai role di sistem karena tugasnya bersifat operasional lapangan/administratif dan tidak melibatkan interaksi langsung dengan maba di website.

## 4. Daftar Fitur

### 4.1 Absensi

**Deskripsi:** Sistem pencatatan kehadiran maba per sesi/hari kegiatan.

**Alur penggunaan:**
1. Kakak pendamping membuka sesi absensi untuk kelompoknya sendiri (generate QR code unik per sesi/hari, khusus kelompok tersebut).
2. Maba di kelompok itu scan QR code menggunakan akun masing-masing (login wajib agar tidak bisa dititip).
3. Sistem mencatat waktu scan dan menandai status: Hadir / Telat / Tidak Hadir.
4. Kakak pendamping dapat melihat dan mengoreksi manual rekap kehadiran kelompoknya sendiri; Admin/Divisi Acara dapat melihat rekap gabungan semua kelompok secara real-time.

**Catatan teknis:**
- Akses absensi dibatasi per kelompok — kakak pendamping hanya bisa membuka/mengedit sesi absensi kelompok yang menjadi tanggung jawabnya (role scope berbasis kelompok, bukan global).
- QR code sebaiknya di-generate ulang (expired) tiap sesi untuk mencegah screenshot dan titip absen.
- Opsional: tambahkan validasi lokasi (geofencing) jika kegiatan berlangsung di area kampus yang jelas koordinatnya.
- Simpan histori absensi per user per sesi untuk kebutuhan rekap dan export.

### 4.2 Pengumpulan Tugas

**Deskripsi:** Tempat maba mengunggah tugas individu maupun kelompok sesuai instruksi panitia.

**Alur penggunaan:**
1. Divisi Pemateri membuat instruksi tugas baru sesuai materi yang dibawakan (judul, deskripsi, deadline, format file yang diizinkan, individu/kelompok).
2. Maba mengunggah file tugas melalui dashboard masing-masing.
3. Status tugas otomatis terupdate: Belum Submit / Sudah Submit / Terlambat.
4. Divisi Pemateri mereview, memberi feedback/nilai, dan dapat mengunduh seluruh tugas per kelompok/materi.

**Catatan teknis:**
- Batasi ukuran dan tipe file yang bisa diunggah.
- Tandai otomatis submit yang melewati deadline sebagai "Terlambat" (bukan diblokir, agar tetap tercatat).
- Simpan versi terbaru jika maba mengunggah ulang, namun tetap log riwayat submit sebelumnya.

### 4.3 Jadwal Kegiatan

**Deskripsi:** Menampilkan rangkaian acara PKKMB secara kronologis per hari.

**Alur penggunaan:**
1. Panitia divisi acara menyusun jadwal (nama kegiatan, waktu, lokasi, PJ kegiatan).
2. Maba dapat melihat jadwal harian dalam tampilan timeline/kalender.
3. Opsional: maba dapat menyinkronkan jadwal ke Google Calendar pribadi.

### 4.4 Pengumuman

**Deskripsi:** Papan informasi terpusat agar seluruh info penting tidak tersebar di berbagai grup WhatsApp.

**Alur penggunaan:**
1. Panitia memposting pengumuman (judul, isi, lampiran opsional, target audiens: semua/kelompok tertentu).
2. Maba melihat daftar pengumuman terbaru di halaman utama/dashboard.
3. Pengumuman penting dapat ditandai "prioritas" agar tampil paling atas.

### 4.5 Pembagian Kelompok

**Deskripsi:** Menampilkan pembagian kelompok maba beserta mentor pendamping.

**Alur penggunaan:**
1. Admin/panitia mengunggah atau menyusun data pembagian kelompok.
2. Maba dapat mencari namanya untuk mengetahui kelompok dan mentor pendamping.
3. Setiap kelompok memiliki halaman ringkas: daftar anggota, mentor, dan progres tugas/absensi kelompok.

### 4.6 Leaderboard / Poin Kelompok

**Deskripsi:** Sistem poin antar kelompok berdasarkan kedisiplinan, keaktifan, dan hasil games/kompetisi selama PKKMB.

**Alur penggunaan:**
1. Panitia menambahkan/mengurangi poin kelompok melalui dashboard admin (misal: poin kehadiran otomatis, poin games manual).
2. Sistem menampilkan papan peringkat kelompok secara real-time.

### 4.7 E-Sertifikat Otomatis

**Deskripsi:** Menerbitkan sertifikat digital otomatis untuk peserta maupun panitia setelah PKKMB selesai.

**Alur penggunaan:**
1. Admin menentukan syarat kelulusan (misal: minimal persentase kehadiran, tugas terkumpul semua).
2. Sistem mengecek otomatis siapa saja yang memenuhi syarat.
3. Sertifikat digenerate otomatis (nama, nomor sertifikat, QR verifikasi) dan dapat diunduh peserta dalam format PDF.

### 4.8 FAQ & Kontak Panitia

**Deskripsi:** Kumpulan pertanyaan umum dan kontak tiap divisi panitia untuk mempermudah maba yang bingung.

**Alur penggunaan:**
1. Panitia mengisi daftar FAQ.
2. Maba dapat mencari FAQ berdasarkan kata kunci.
3. Jika tidak ditemukan jawaban, tersedia kontak/CP per divisi.

### 4.9 Notifikasi

**Deskripsi:** Pengingat otomatis untuk deadline tugas, jadwal kegiatan, dan pengumuman penting.

**Alur penggunaan:**
1. Sistem mengirim notifikasi (in-app/email/push) H-1 atau beberapa jam sebelum deadline/jadwal.
2. Maba dapat mengatur preferensi notifikasi (opsional).

### 4.10 Profil Peserta

**Deskripsi:** Dashboard pribadi maba berisi data diri, kelompok, riwayat absensi, dan status tugas dalam satu tempat.

**Alur penggunaan:**
1. Maba melengkapi data diri saat pertama login (foto, NIM, kontak).
2. Dashboard menampilkan ringkasan: persentase kehadiran, tugas yang sudah/belum dikumpulkan, kelompok, dan poin.

### 4.11 Dokumentasi / Galeri

**Deskripsi:** Kumpulan foto kegiatan tiap hari sebagai dokumentasi dan kenang-kenangan.

**Alur penggunaan:**
1. Panitia dokumentasi mengunggah foto per hari/sesi kegiatan.
2. Maba dan panitia dapat melihat dan mengunduh galeri foto.

### 4.12 Dashboard Rekap (Admin/Panitia)

**Deskripsi:** Ringkasan statistik real-time untuk memantau jalannya PKKMB.

**Isi dashboard:**
- Persentase kehadiran per hari/kelompok/angkatan
- Jumlah tugas yang sudah masuk vs belum
- Leaderboard kelompok
- Grafik tren kehadiran dari hari ke hari

### 4.13 Export Data

**Deskripsi:** Mengunduh data rekap (kehadiran, tugas, nilai) dalam format Excel/PDF untuk keperluan laporan ke fakultas.

### 4.14 Manajemen Role & Akses

**Deskripsi:** Setiap panitia memiliki akses berbeda sesuai divisinya (role-based access control), agar tidak semua panitia bisa mengubah data yang bukan tanggung jawabnya.

**Contoh pembagian akses:**
- Kakak Pendamping → hanya bisa kelola sesi & data absensi kelompoknya sendiri
- Divisi Pemateri → hanya bisa kelola instruksi & penilaian tugas
- Divisi Acara → hanya bisa kelola jadwal & pengumuman
- Divisi PDD → hanya bisa kelola galeri/dokumentasi
- Divisi Tata Tertib → hanya bisa kelola poin/leaderboard kelompok
- Admin (BEM FT) → akses penuh ke semua modul, termasuk mengatur role divisi lain

## 5. Prioritas Pengembangan (Saran)

| Prioritas | Fitur |
|---|---|
| Wajib (MVP) | Absensi, Pengumpulan Tugas, Jadwal Kegiatan, Pengumuman, Profil Peserta |
| Penting | Pembagian Kelompok, Dashboard Rekap, Manajemen Role |
| Nice-to-have | Leaderboard, E-Sertifikat, Notifikasi, FAQ, Galeri, Export Data |

## 6. Catatan Tambahan

- Fitur Manajemen Role & Akses dapat memanfaatkan pola RBAC yang sama seperti yang sedang dikembangkan pada sistem IMS BEM FT, sehingga bisa jadi latihan pola arsitektur yang konsisten antar proyek.
- Struktur database sebaiknya dirancang modular per fitur (users, groups, attendance, tasks, submissions, announcements, points) agar mudah dikembangkan bertahap sesuai prioritas di atas.
