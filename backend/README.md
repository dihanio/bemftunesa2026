# BEM FT API

Backend utama untuk ekosistem website BEM FT UNESA berbasis NestJS.

## Menjalankan secara lokal

```bash
bun install
bun run dev
```

Server berjalan di `http://localhost:3001/v1` dan Swagger di `http://localhost:3001/v1/docs`.

## Environment minimum

Buat file `.env` di `apps/api` dengan variabel berikut:

- `PORT`
- `MONGODB_URI`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_EMAIL`
- `GOOGLE_DRIVE_PRIVATE_KEY`
- `GOOGLE_DRIVE_FOLDER_ID`
- `CORS_ORIGINS` (comma-separated origins)

## Script penting

- `bun run dev`: mode development
- `bun run build`: build production
- `bun run start:prod`: jalankan hasil build
- `bun run test`: unit test
- `bun run test:e2e`: e2e test
- `bun run test:cov`: coverage

## Catatan keamanan

- Jangan commit `.env` atau service-account JSON.
- Login hanya via Google ID token yang diverifikasi signature.
- Endpoint upload mewajibkan JWT dan rate-limit.

## Logging dan observability

- Middleware request log menghasilkan JSON log per request.
- Set header `x-request-id` dari client untuk trace lintas service.
- Jika tidak diset client, server akan generate otomatis.
