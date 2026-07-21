# Architecture Decision Record 08: Standardization & Conventions

## 1. ID Strategy (UUIDv7)

Sistem lama menggunakan `ObjectId` (24-char hex) bawaan MongoDB sebagai identifier yang dilempar ke *client* (API). Hal ini akan kita **hentikan**.

**Keputusan:**
Semua entitas yang dikomunikasikan secara eksternal (`Workspace`, `DriveItem`, `User`) wajib menggunakan **UUIDv7** atau **ULID**. 
- *Kenapa UUIDv7?* Ini adalah UUID yang berbasis waktu (*time-ordered*). Tidak seperti UUIDv4 yang sepenuhnya acak dan menyebabkan fragmentasi *index* parah di database, UUIDv7 ramah terhadap B-Tree Index.
- `_id` MongoDB internal tetap digunakan demi efisiensi Mongoose (*populate* dll), namun disembunyikan (dikonversi/dimapping) dari *response* REST.

## 2. API Versioning Strategy

Untuk mencegah rusaknya aplikasi client (Mobile, Frontend Web) saat ada perubahan kontrak API, BEM Drive menerapkan sistem versi pada URI.
- Endpoint baru harus menggunakan prefix: `/api/v1/drive/...`
- Ketika terjadi **Breaking Change** (contoh: format respon folder tree diubah), versi akan naik menjadi `/api/v2/drive/...`. API V1 akan ditandai *Deprecated* melalui header `Sunset` dan `Deprecation`.

## 3. Format Respon Seragam (JSend Standard)

Semua respon dari API BEM Drive (baik sukses maupun error) harus distandarisasi menggunakan *Envelope Pattern* (terinspirasi JSend).

**Sukses:**
```json
{
  "status": "success",
  "data": {
    "fileId": "01H2X... (UUIDv7)",
    "name": "Laporan.pdf"
  },
  "metadata": {
    "timestamp": "2026-07-03T00:00:00Z",
    "requestId": "req-9x8a-..."
  }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Akses ditolak karena Workspace Quota habis.",
  "code": "ERR_QUOTA_EXCEEDED",
  "data": {
    "currentUsage": 10240,
    "limit": 10240
  },
  "metadata": {
    "correlationId": "cor-1234-..."
  }
}
```

## 4. Naming Conventions

- **File**: Menggunakan *Kebab Case* untuk nama file (e.g. `drive-item.repository.ts`, `file-uploaded.event.ts`).
- **Kelas/Model**: Menggunakan *PascalCase* (e.g. `DriveItemRepository`).
- **Variabel/Property**: Menggunakan *camelCase*.
- **Konstanta**: Menggunakan *UPPER_SNAKE_CASE*.
- **Database Collections**: Menggunakan bentuk jamak, *snake_case* (e.g. `drive_items`, `workspaces`, `drive_item_versions`).
- **Event Name**: Berbentuk Kata Benda + Past Tense Verb (e.g. `FileUploaded`, `WorkspaceCreated`, `QuotaExceeded`).

## 5. Coding Standards Khusus Drive

1. **NO ANY**: Penggunaan keyword `any` di TypeScript dilarang keras dan akan digagalkan oleh linter.
2. **Dependency Injection**: Kelas Service/Command Handler dilarang melakukan instansiasi provider eksternal secara langsung (jangan menggunakan `new S3Client()`). Provider harus disuntik via constructor untuk memudahkan unit testing.
3. **Transaction / Sessions**: Operasi tulis yang melibatkan lebih dari satu Aggregate atau Koleksi, WAJIB menggunakan Mongoose Transaction Session.
4. **Immutability di DTO**: Seluruh properti di DTO harus `readonly`.
5. **Observability**: Setiap handler / endpoint wajib meneruskan `correlationId` atau `requestId` ke setiap log (menggunakan `nestjs-pino` Async Local Storage / CLS).
