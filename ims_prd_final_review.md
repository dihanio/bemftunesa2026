# Final Review PRD: IMS BEM FT UNESA

Berikut adalah hasil audit komprehensif terhadap dokumen PRD IMS BEM FT UNESA berdasarkan kelayakan teknis dan operasional untuk eksekusi tahap pengembangan (*development*).

---

## 1. Konsistensi Role dan Hak Akses
- **Observasi:** Dokumen PRD merumuskan *Internal Users* (BPI, Kadep, Wakadep, Staf) secara murni berdasarkan struktur hierarki organisasi mahasiswa. Namun, fitur *Soft Delete Restore* (pemulihan data), pembuatan *Cabinet Period*, dan akses *System Settings* mutlak membutuhkan entitas administrator murni.
- **Rekomendasi:** Perlu mendefinisikan meta-role **"Super Administrator"** yang biasanya dipegang secara ex-officio oleh BPI spesifik (seperti Sekretaris) atau Kadep khusus (seperti PTI / Kominfo). Ini menjaga agar *role* teknis tetap ada tanpa mengotori struktur keorganisasian yang murni.

## 2. Dashboard dan Landing Experience
- **Observasi:** Mengingat MVP memuat Manajemen Tugas (*Task*) dan Persetujuan (*Approval*), *Dashboard* **wajib** masuk di dalam MVP agar pengurus segera tahu apa yang harus dikerjakan tanpa mengeksplorasi setiap menu.
- **Rekomendasi Metrik Ringkas:**
  - **BPI:** Proker Aktif vs Selesai, Sisa Anggaran Global (jika diakumulasi), Persentase Penyelesaian Tugas Semua Departemen.
  - **Kadep & Wakadep:** Tugas tertunda di departemen, Notifikasi *Approval* Artikel/Proker staf, Pengingat *Deadline* LPJ.
  - **Staf:** *My Tasks* (Tugas individu: To Do, In Progress, Review) dan Undangan Rapat Terdekat.

## 3. Audit Log dan Akuntabilitas
- **Observasi:** Skema *Audit Log* yang membedakan catatan ringan (Summary) untuk entitas umum dan perekaman penuh (*Before-After*) khusus untuk 3 entitas sakral (User, Proker, Dokumen) sudah sangat proporsional.
- **Rekomendasi:** Sangat realistis untuk dikerjakan mahasiswa (tidak membuat *server lag*). Secara arsitektural, hal ini dapat diimplementasikan menggunakan fungsi *Mongoose Hooks/Middleware* (Post-Save/Post-Update) agar otomatis tanpa merusak *controller* utama.

## 4. Kelayakan Scope MVP
- **Observasi:** Daftar MVP saat ini cukup padat (*Department, Users, Proker, Task, Meeting, Aspirasi, Doc Repo, Notif, Approval, Global Search, Settings*). 
- **Rekomendasi:** Untuk lingkup skripsi atau tim kecil pengurus, MVP ini berada di batas atas (*borderline heavy*). Namun, dengan penggunaan *framework* modern seperti NestJS dan arsitektur *Clean Code*, ini sangat mungkin dicapai. Fitur **Global Search** bisa menjadi tantangan teknis tersendiri, tetapi karena sangat vital, kami setuju untuk mempertahankannya di MVP. Tidak ada modul yang harus dibuang ke V2.

## 5. Relasi Data dan Skalabilitas
- **Observasi:** Konsep pewarisan data (*Data Ownership*) di mana seluruh entitas terkait pada [Periode Kabinet ➔ Departemen ➔ PIC] adalah desain skema *database* relasional/NoSQL yang jenius untuk mencegah kebocoran otorisasi (*RBAC Leak*). 
- **Rekomendasi:** Konsep ini sudah 100% matang dan tidak memiliki celah keamanan otorisasi lintas tahun. Pengerjaan kueri untuk mengunci akses *read/write* akan sangat tertata.

## 6. Non-Functional Requirements (NFR)
- **Observasi:** NFR (Target Uptime 99%, Max 20MB Upload, *Soft Delete*, *Rate Limiting*) sudah menutupi celah keandalan standar tanpa berlebihan.
- **Rekomendasi:** Cukup. Sistem pencadangan (*Automatic Backup*) bisa mengandalkan fitur bawaan dari penyedia *cloud/hosting* (misal: MongoDB Atlas Backup) sehingga tidak perlu membebani pengodean internal aplikasi.

## 7. Scope Control (Mencegah "Feature Creep")
- **Observasi:** Sangat aman. IMS ini berada tepat di jalur tengah sebagai sistem manajemen birokrasi & organisasi kampus. Tidak bergeser menjadi sistem *Enterprise Resource Planning* (ERP), tidak ada pengolahan neraca keuangan rumit (hanya Estimasi RAB Proker), dan tidak memuat fungsi berkirim obrolan (*Live Chat*) yang mubazir.

---

## 8. Final Verdict (Kesimpulan Akhir)

- **Kelebihan utama PRD:** Memiliki struktur kepemilikan data (Data Ownership) dan Periode Kabinet yang memastikan aplikasi tidak akan rusak atau berantakan setelah pergantian tahun kepengurusan.
- **Kekurangan yang masih kritis:** Ketiadaan definisi teknis *Super Administrator* untuk perlakuan gawat darurat (misal, *restore database* atau inisiasi Kabinet baru).
- **Perbaikan yang wajib dilakukan sebelum development:** Hanya menambahkan klarifikasi bahwa akses *Super Administrator* adalah sistem bawaan (tidak terlihat dalam bagan struktur mahasiswa).
- **Perbaikan yang dapat ditunda:** Pengembangan analitik *Dashboard* yang rumit dapat ditunda. Mulailah dari perhitungan angka sederhana (`countDocuments`).
- **Status Akhir:**
  
  > ### **SIAP DEVELOPMENT**
  
  (Aplikasi ini sudah memiliki landasan arsitektur bisnis yang sempurna untuk diterjemahkan menjadi *Database Schema / Entity-Relationship Diagram*).
