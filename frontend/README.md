# BEM FT Public Web

Frontend publik BEM FT UNESA berbasis Next.js App Router.

## Menjalankan secara lokal

```bash
bun install
bun run dev
```

App berjalan di `http://localhost:3000`.

## Environment minimum

Buat `.env.local` di `apps/public`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

## Script penting

- `bun run dev`: mode development
- `bun run build`: build production
- `bun run start`: jalankan hasil build
- `bun run lint`: linting

## Catatan keamanan

- Konten HTML artikel disanitasi sebelum dirender.
- CSP header diterapkan lewat `next.config.ts`.
- Hindari menyisipkan HTML raw tanpa sanitasi tambahan.
