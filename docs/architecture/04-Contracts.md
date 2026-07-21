# Architecture Decision Record 04: Kontrak Eksternal & Internal (Contracts)

## 1. DriveSDK Internal Contract

`DriveSDK` adalah satu-satunya antarmuka yang diizinkan untuk digunakan oleh modul IMS lain (misalnya Modul Surat, Keuangan, Oprec) untuk berinteraksi dengan BEM Drive. Modul lain dilarang memanggil REST API BEM Drive secara HTTP untuk menghindari *network overhead* dan kebocoran sekuritas.

```typescript
export interface DriveSDK {
  /**
   * Mengunggah file baru yang ditautkan ke modul eksternal.
   * Akan secara otomatis membuat DriveReference.
   */
  upload(params: UploadSdkParams): Promise<DriveItem>;

  /**
   * Mengambil metadata file dan Signed URL sementara untuk diunduh.
   */
  getFile(fileId: UUID): Promise<DriveItemWithUrl>;

  /**
   * Mengamankan / share file dengan spesifik member, mereturn token.
   */
  share(params: ShareSdkParams): Promise<ShareLink>;

  /**
   * Menghapus file secara halus (Soft Delete) dan melepas DriveReference.
   */
  delete(fileId: UUID, moduleContext: string): Promise<boolean>;

  /**
   * Mengunci file secara pesimis (Pessimistic Lock) agar tidak bisa diedit.
   */
  acquireLock(fileId: UUID, userId: UUID): Promise<FileLock>;
}

export interface UploadSdkParams {
  workspaceId: UUID;
  folderId?: UUID;
  fileBuffer: Buffer | NodeJS.ReadableStream;
  originalName: string;
  mimeType: string;
  moduleName: string; // e.g. "SURAT"
  entityId: string;   // e.g. "surat_keluar_123"
  fieldName: string;  // e.g. "lampiran_utama"
}
```

## 2. Plugin Contract

Sistem *Pluggable Architecture* memungkinkan penambahan fitur pemrosesan tanpa menyentuh *core domain*. Semua plugin harus di-register pada saat aplikasi *bootstrap* dan mengimplementasikan `DrivePlugin` interface.

```typescript
export interface DrivePlugin {
  name: string;
  version: string;

  /**
   * Dipanggil saat module di-load. Untuk setup DB atau koneksi eksternal.
   */
  initialize(): Promise<void>;

  /**
   * Dipanggil SEBELUM upload dimulai.
   * Bisa digunakan untuk menolak upload (melempar Error), misal: DLP Plugin mendeteksi file rahasia,
   * atau VirusScan Plugin mendeteksi signature mencurigakan dari stream awal.
   */
  beforeUpload(ctx: UploadContext): Promise<UploadContext>;

  /**
   * Dipanggil SETELAH upload selesai (dan status = Processing).
   * Digunakan oleh OCRPlugin, WatermarkPlugin, dll.
   */
  afterUpload(file: DriveItem): Promise<void>;

  /**
   * Mengizinkan plugin membatalkan penghapusan (misal: Legal Hold Plugin).
   */
  beforeDelete(file: DriveItem): Promise<boolean>;

  /**
   * Cleanup resource external terkait file ini.
   */
  afterDelete(fileId: UUID): Promise<void>;
}
```

## 3. Storage Provider Contract

Abstraksi murni terhadap layanan penyimpanan *Object Storage*. Tidak ada terminologi khusus AWS (seperti S3 Bucket atau ACL) di luar adapter ini.

```typescript
export interface FileStorageGateway {
  /**
   * Stream file berukuran kecil ke menengah.
   */
  putObject(key: string, stream: NodeJS.ReadableStream, mimeType: string): Promise<StorageResult>;

  /**
   * Inisiasi Multipart Upload (Chunking) untuk file berukuran raksasa (> 5GB).
   */
  initiateMultipartUpload(key: string, mimeType: string): Promise<string /* uploadId */>;
  
  /**
   * Upload potongan chunk.
   */
  uploadPart(key: string, uploadId: string, partNumber: number, stream: NodeJS.ReadableStream): Promise<string /* eTag */>;
  
  /**
   * Menggabungkan chunk menjadi satu file utuh.
   */
  completeMultipartUpload(key: string, uploadId: string, parts: PartSignature[]): Promise<StorageResult>;

  /**
   * Menghasilkan URL sementara (Temporary Signed URL) yang akan expired.
   */
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;

  deleteObject(key: string): Promise<void>;
}
```

## 4. Worker Contract (Task Payload)

Format standarisasi untuk pengiriman *job* ke Queue (BullMQ) bagi para independent worker.

```typescript
export interface BaseWorkerJob<T = any> {
  jobId: string;
  correlationId: string;
  eventName: string;
  timestamp: string;
  payload: T;
}

export interface ThumbnailWorkerPayload {
  fileId: UUID;
  storageKey: string;
  mimeType: string;
  desiredWidth: number;
}
```
