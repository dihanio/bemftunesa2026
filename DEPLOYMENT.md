# Panduan Deployment: Ekosistem Digital BEM FT UNESA

Dokumen ini memuat langkah-langkah untuk melakukan *deployment* ke *production* untuk Frontend (Next.js) dan Backend (NestJS). Kita akan menggunakan arsitektur umum: **Vercel** untuk Frontend dan **Railway** (atau VPS sejenis) untuk Backend.

---

## 1. Persiapan Environment Variables

Sebelum mulai, pastikan Anda memiliki nilai untuk variabel-variabel berikut:

### Backend (`.env` di Railway/VPS)
```ini
# Server Port (Railway otomatis menyediakan PORT)
PORT=5000

# URL Frontend untuk CORS Strict Mode
FRONTEND_URL=https://ims-bemftunesa.vercel.app

# MongoDB Connection String (Gunakan MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/bemft

# Supabase Storage Configuration (Untuk File/PDF)
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_KEY=<your-service-role-key>
SUPABASE_BUCKET=bemft-files

# Autentikasi JWT & Google SSO
JWT_SECRET=<buat_string_acak_yang_panjang_dan_rahasia>
GOOGLE_CLIENT_ID=<dari_google_cloud_console>
GOOGLE_CLIENT_SECRET=<dari_google_cloud_console>
GOOGLE_CALLBACK_URL=https://api-bemftunesa.railway.app/v1/auth/google/callback
```

### Frontend (`.env.local` di Vercel)
```ini
# Endpoint URL ke Backend (Arahkan ke Railway/VPS)
NEXT_PUBLIC_API_URL=https://api-bemftunesa.railway.app/v1
```

---

## 2. Deployment Backend (Railway)

Railway sangat direkomendasikan karena *zero-config* untuk aplikasi berbasis Docker/Node.js.

1. Buka [Railway.app](https://railway.app) dan *login* dengan GitHub.
2. Klik **New Project** -> **Deploy from GitHub repo**.
3. Pilih repository `bemft-unesa-web`.
4. Railway akan mencoba me-*deploy* *root folder*. Kita perlu memberi tahu bahwa Backend ada di dalam folder `backend`:
   - Buka bagian **Settings** dari *service* yang baru terbuat.
   - Pada bagian **Root Directory**, isi dengan `/backend`.
5. Buka bagian **Variables** dan masukkan semua Environment Variables Backend di atas.
6. Pada bagian **Settings** > **Domains**, buat *Custom Domain* (misal: `api-bemftunesa.railway.app`).
7. Tunggu hingga proses *build* (NestJS) selesai. Jika sukses, API sudah siap!

---

## 3. Deployment Frontend (Vercel)

Vercel adalah *platform* terbaik untuk *deployment* aplikasi Next.js.

1. Buka [Vercel.com](https://vercel.com) dan *login* dengan GitHub.
2. Klik **Add New...** -> **Project**.
3. *Import* repository `bemft-unesa-web`.
4. Pada menu konfigurasi *deployment*:
   - **Framework Preset**: Biarkan otomatis mendeteksi `Next.js`.
   - **Root Directory**: Ubah dari `./` menjadi `ims` (folder tempat Next.js berada).
   - **Environment Variables**: Tambahkan `NEXT_PUBLIC_API_URL` dengan *value* URL backend Railway Anda.
5. Klik **Deploy**.
6. Vercel akan menjalankan `npm run build` dan menampilkan domain publik Anda (misal `https://ims-bemftunesa.vercel.app`).

---

## 4. Keamanan Pasca-Deployment (Post-Deployment Hardening)

Setelah kedua layanan *online*:
1. **Google OAuth Callback**: Pastikan Anda memperbarui *Authorized redirect URIs* di Google Cloud Console untuk memasukkan `https://api-bemftunesa.railway.app/v1/auth/google/callback`.
2. **Ubah Password Default MongoDB**: Jangan gunakan password *default* atau *development* di MongoDB Atlas.
3. **CORS Validation**: Coba akses backend dari domain selain Vercel Anda (misal via `curl`). Seharusnya permintaan ditolak oleh aturan *CORS Strict* yang telah dikonfigurasi di `main.ts`.
4. **Rate Limiting**: Backend sudah dibekali `@nestjs/throttler` dengan batas 100 *request* per menit. Jika aplikasi menampilkan perilaku tidak normal (HTTP 429 Too Many Requests) saat diakses banyak pengguna, naikkan limit di `app.module.ts`.

---
*Deployment berhasil! BEM FT UNESA Digital Ecosystem kini mengudara secara publik.*
