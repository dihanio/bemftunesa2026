# Architecture Decision Record 06: Sequence Diagrams

## 1. Flow: Internal Modular Upload (Via DriveSDK)

Sequence ini mendemonstrasikan bagaimana modul IMS lain (contoh: Modul Surat) menggunakan `DriveSDK` untuk mengunggah lampiran dengan aman, tanpa melalui HTTP REST.

```mermaid
sequenceDiagram
    actor Pengurus as Pengurus (User)
    participant API as Surat Controller
    participant SDK as DriveSDK (Injected)
    participant Cmd as Drive Command Service
    participant S3 as S3StorageProvider
    participant DB as MongoDB (DriveItem)
    participant Bus as EventPublisher
    
    Pengurus->>API: POST /surat (File: proposal.pdf)
    
    API->>API: Save Data Surat (Transactional)
    
    API->>SDK: upload({ fileBuffer, moduleName: "SURAT", entityId: "123" })
    
    SDK->>Cmd: Execute(UploadFileCommand)
    
    Cmd->>Cmd: Validasi Policy & Mime
    Cmd->>S3: Stream Buffer ke Cloud
    S3-->>Cmd: Return storageKey & eTag
    
    Cmd->>DB: Insert DriveItem (Status: Processing)
    Cmd->>DB: Insert DriveReference (Link Surat 123)
    
    Cmd->>Bus: Publish(FileUploadedEvent)
    
    Cmd-->>SDK: Return DriveItem Entity
    SDK-->>API: DriveItem (id)
    API-->>Pengurus: Sukses Membuat Surat
```

## 2. Flow: Public Download via Signed URL

Untuk keamanan tinggi, BEM Drive tidak melayani unduhan binary file secara langsung melalui Node.js, melainkan memberikan otoritas terbatas berupa *Signed URL*.

```mermaid
sequenceDiagram
    actor Mahasiswa as Mahasiswa
    participant API as Drive Controller
    participant Qry as Query Service
    participant S3 as AWS S3 / Cloudflare R2
    
    Mahasiswa->>API: GET /drive/download/:fileId (beserta JWT)
    
    API->>Qry: Execute(DownloadFileQuery)
    
    Qry->>Qry: Validasi Akses & Policy (Allow?)
    
    Qry->>S3: Generate Signed URL (Expire in 15 mins)
    S3-->>Qry: URL (https://s3.../?signature=xxx)
    
    Qry-->>API: Return Redirect URL
    
    API-->>Mahasiswa: HTTP 302 Redirect (Location: Signed URL)
    
    Mahasiswa->>S3: Direct GET ke URL
    S3-->>Mahasiswa: Streaming Binary (Bypass Node.js)
```

## 3. Flow: Shared Password Access

```mermaid
sequenceDiagram
    actor Eksternal as Pihak Sponsor
    participant SPA as Web Frontend
    participant API as Drive API
    
    Eksternal->>SPA: Buka Link (bem.unesa.ac.id/share/Xyz123)
    SPA->>API: GET /share/Xyz123/verify
    
    API-->>SPA: Required Password (401)
    
    SPA-->>Eksternal: Tampilkan Modal Password
    
    Eksternal->>SPA: Input Password ("Rahasia123")
    SPA->>API: POST /share/Xyz123/auth { password }
    
    API->>API: bcrypt.compare()
    API-->>SPA: Success + Token JWT khusus Share
    
    SPA->>API: GET /share/Xyz123/content (Bearer ShareToken)
    API-->>SPA: Return File Metadata
```

## 4. Flow: OnlyOffice Co-authoring (Pessimistic Lock)

```mermaid
sequenceDiagram
    actor A as User A
    actor B as User B
    participant OODS as OnlyOffice Server
    participant API as Drive API (Callback)
    
    A->>OODS: Buka Dokumen DocX
    OODS->>API: Callback (Status: 1 - Editing)
    API->>API: Acquire Pessimistic Lock (UserId A)
    API->>Bus: Publish(LockAcquired)
    
    B->>OODS: Buka Dokumen yang Sama
    OODS-->>B: Masuk Mode Co-editing (WebSockets OODS)
    
    A->>OODS: Close Tab
    B->>OODS: Close Tab
    
    OODS->>OODS: Wait 10s (Force Save)
    
    OODS->>API: Callback (Status: 2 - Ready to Save + URL)
    API->>S3: Download dari OODS URL & Save as Version 2
    API->>API: Release Lock
    API->>Bus: Publish(FileVersionAdded)
```
