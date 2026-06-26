# Product Requirements Document (PRD): Information Management System (IMS) BEM FT UNESA

## 1. Pendahuluan
**Information Management System (IMS)** adalah pusat komando dan operasional digital BEM Fakultas Teknik UNESA. Sistem ini tidak hanya beroperasi sebagai *Content Management System* (CMS), melainkan tulang punggung administrasi organisasi yang mengawal kinerja, dokumentasi, transparansi, serta kelancaran regenerasi antarkabinet.

## 2. Aktor Sistem (User Personas)
Pengguna sistem diklasifikasikan menjadi dua kategori besar:

### 2.1 Internal Users (Pengurus)
Menggunakan *Role-Based Access Control* (RBAC) berlandaskan struktur definitif:
1. **Badan Pengurus Inti (BPI):** Kabem, Wakabem, Sekretaris, Bendahara.
2. **Kepala Departemen (Kadep)**
3. **Wakil Kepala Departemen (Wakadep)**
4. **Staf**

### 2.2 External Users (Publik)
- **Mahasiswa FT UNESA:** Mengakses layanan antarmuka publik, seperti pengiriman Aspirasi, pendaftaran Rekrutmen (Oprec), dan penikmat konten *Website*.

### 2.3 System Users (Teknis)
- **Super Administrator:** *Role* teknis (*root*) yang beroperasi di luar struktur formal organisasi. Bertanggung jawab atas inisiasi Periode Kabinet baru, *System Settings*, dan pemulihan data insidental (*Restore Soft Delete*).

---

## 3. Konsep Fundamental Organisasi & Kepemilikan Data

### 3.1 Data Ownership (Kepemilikan Data)
Untuk memperkuat sistem kueri dan aturan otorisasi (RBAC), setiap entitas operasional di dalam sistem (Tugas, Proker, Rapat, Dokumen) wajib memiliki keterkaitan dengan tiga pilar berikut:
1. **Periode Kepengurusan** (Tahun kabinet menjabat).
2. **Departemen** (Milik departemen mana data tersebut berinduk).
3. **Pengguna** (Siapa *Creator*-nya atau siapa *PIC*-nya).

### 3.2 Periode Kepengurusan (Cabinet Periods)
Sistem demarkasi agar data antarmasa kepengurusan tidak saling bercampur.
- **Lifecycle Status:** *Draft* (Persiapan), *Active* (Menjabat), dan *Archived* (Purnatugas/Read-Only).

### 3.3 Hubungan Inti Antar Modul (Relational Map)
Sebuah arsitektur yang digerakkan oleh relasi kuat (*interconnected*). Konsep hierarki entitas digambarkan sebagai berikut:
```text
Cabinet Period
│
├── Departments
│
├── Users (Pengurus)
│
├── Programs (Program Kerja)
│   ├── Tasks (Penugasan Terkait Proker)
│   ├── Meetings (Rapat Evaluasi/Persiapan)
│   └── Documents (TOR, LPJ, RAB)
│
├── Aspirations (Aspirasi Mahasiswa)
│
└── Publications (CMS/Konten)
```

---

## 4. Spesifikasi Modul (MVP - Minimum Viable Product)

### 4.1 Department Management
Entitas departemen bertindak sebagai jangkar (*anchor*) struktural organisasi.
- *Data:* Nama, Deskripsi, Visi Misi, Logo Departemen, Warna Identitas, Kontak Resmi, dan penugasan Kadep/Wakadep beserta Staf.

### 4.2 Manajemen Pengguna & Keamanan (Auth & Users)
Sistem masuk dengan JWT, RBAC, dan pengelolaan data pengurus (NIM, Foto Profil, Jabatan).

### 4.3 Program Kerja (Proker)
- *Informasi & Status:* Nama, Kategori, Periode, PIC, Status (*Planned, Ongoing, Completed, Cancelled*), dan Target Output.
- *Informasi Anggaran:* Estimasi Anggaran dan Status Pendanaan.
- *Arsip Lampiran:* TOR, Proposal, RAB (Rencana Anggaran Biaya), LPJ, dan Dokumentasi.

### 4.4 Task Management (Manajemen Tugas)
- *Siklus:* *To Do ➔ In Progress ➔ Review ➔ Completed ➔ Cancelled*.
- *Atribut:* Deskripsi, Deadline, PIC, Prioritas, Komentar.

### 4.5 Meeting & Notulensi Management (Rapat)
- *Fungsi:* Jadwal, Undangan, Absensi, Notulensi, Lampiran hasil rapat.
- *Tindak Lanjut:* **Action Items** — Kapabilitas terintegrasi untuk menciptakan tugas baru ("*Create Task from Meeting*").

### 4.6 Kanal Aspirasi Mahasiswa
- *Prioritas & SLA:* Tingkat Urgensi (**Low, Medium, High, Urgent**) menentukan durasi target SLA waktu tanggap.

### 4.7 Arsip Dokumen (Document Repository)
- Tempat terpusat menyimpan dokumen dengan manajemen folder tingkat departemen.

### 4.8 Notification Center & Workflow Approval
- *In-App Notification* (dengan kapabilitas Email opsional):
  - **Approval:** Artikel/Proker menunggu persetujuan.
  - **Task & Meeting:** *Task Assigned*, *Task Overdue*, *Meeting Reminder*.
  - **Aspirasi:** Aspirasi baru/didisposisikan.
- *Workflow Approval:* Persetujuan berjenjang untuk artikel (via Kadep) atau Proker (via BPI).

### 4.9 Global Search & System Settings
- **Omnibox (Global Search):** Pencarian terpadu dari *navbar* untuk User, Departemen, Proker, Task, Dokumen, Aspirasi, Rapat.
- **Settings:** Mengamankan variabel dinamis (Nama Kabinet Aktif, Email, Sosmed, Logo Utama).

---

## 5. Pengembangan Lanjutan (Versi 2)
1. **CMS & Website Management:** Publikasi artikel, galeri, media.
2. **Sistem Rekrutmen Terpadu (Oprec):** Mengakomodasi pengguna eksternal mendaftar staf kepanitiaan.
3. **Advanced Dashboard Analytics:** Metrik grafis dinamis.

---

## 6. Non-Functional Requirements (NFR)

### 6.1 Security (Keamanan)
- *Authentication* berbasis JWT.
- Enkripsi kata sandi (*Password Hashing*).
- *Role-Based Access Control (RBAC)* yang solid.
- *Rate Limiting* dan Manajemen Sesi (*Session Management*).

### 6.2 Data Retention (Soft Delete)
- Mencegah insiden *human error* (salah hapus). Semua data krusial seperti Proker, Dokumen, dan Pengurus menerapkan metode **Soft Delete** dan dapat dipulihkan kapan pun oleh fungsi sistem Super Admin (*Recycle Bin/Restore*).

### 6.3 Reliability & Availability
- *Automatic Backup* berkala dan prosedur *Data Recovery*.
- Sistem ditargetkan memiliki metrik ketersediaan (*Target Uptime*) 99%.

### 6.4 Usability & Performance
- Resolusi *Global Search* secepat kilat, *load time* maks 3 detik.
- Kuota unggah 20 MB per file.
- Optimalisasi antarmuka responsif bagi pengguna non-teknis.
- Skalabilitas pengarsipan (*Archiving*) lintas dekade kepengurusan tanpa anjlok kueri data.
