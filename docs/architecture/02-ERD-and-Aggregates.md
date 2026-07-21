# Architecture Decision Record 02: Entity Relationship Diagram & DDD Aggregates

## 1. DDD Aggregate Boundaries

Sistem BEM Drive menerapkan prinsip Domain Driven Design (DDD) secara ketat. Berikut adalah batasan-batasan Agregat (Aggregate Boundaries) yang didefinisikan agar tidak terjadi percampuran (*bleeding*) state antar modul.

1. **Workspace Aggregate**
   - **Root**: `Workspace`
   - **Children**: `WorkspaceMember`, `WorkspaceRole`, `WorkspaceQuota`, `WorkspaceSettings`
   - **Aturan**: Setiap perubahan pada kuota, member, atau pengaturan workspace harus melalui root `Workspace`.

2. **Folder Aggregate**
   - **Root**: `Folder` (atau `DriveItem` bertipe Folder)
   - **Children**: Folder Metadata, `FolderAcl` (Inherited)
   - **Aturan**: Folder menggunakan strategi **Materialized Path** (`path: "/root_id/parent_id/"`) untuk traversal yang super cepat (O(1) menggunakan regex index).

3. **File Aggregate**
   - **Root**: `DriveItem` (bertipe File)
   - **Children**: `DriveItemMetadata`, `FileLock`, `DriveReference`
   - **Aturan**: Segala bentuk penambahan metadata (seperti hasil OCR, virus scan, atau checksum) harus dilakukan lewat root `DriveItem`. 

4. **Version Aggregate**
   - **Root**: `DriveItemVersion`
   - **Aturan**: Data versi bersifat **Immutable**. Jika file diupdate, tidak menimpa file fisik lama melainkan membuat object versi baru di S3 dan row baru di database.

5. **Policy Aggregate**
   - **Root**: `DrivePolicy`
   - **Aturan**: Definisi rule Allow/Deny dinamis yang akan dievaluasi oleh Policy Engine.

## 2. Entity Relationship Diagram (ERD)

Diagram ini menggambarkan relasi antar entitas inti dalam database (menggunakan MongoDB, divisualisasikan dalam bentuk relasional untuk kejelasan).

```mermaid
erDiagram
    %% Identity Context (External)
    USER {
        UUID id PK
        String email
        String name
    }

    %% Tenant & Workspace Context
    TENANT {
        UUID id PK
        String name "BEM / DPM"
    }

    WORKSPACE {
        UUID id PK
        UUID tenantId FK
        String type "Organization, Committee, Personal"
        String name
        Number quotaUsed
        Number quotaLimit
    }

    WORKSPACE_MEMBER {
        UUID workspaceId FK
        UUID userId FK
        String role "Admin, Editor, Viewer"
    }

    %% File & Folder Context (The Core)
    DRIVE_ITEM {
        UUID id PK
        UUID workspaceId FK
        UUID parentId FK "Null if root"
        String type "FOLDER or FILE"
        String name
        String materializedPath "e.g., /parent1_id/parent2_id/"
        String status "Uploading, Ready, Trash, LegalHold"
        DateTime deletedAt
        DateTime createdAt
    }

    DRIVE_METADATA {
        UUID driveItemId FK
        String mimeType
        Number sizeBytes
        String hashAlgorithm "SHA256"
        String hashValue
        String storageClass
        String eTag
        Boolean isEncrypted
        String ocrStatus
        String virusScanStatus
    }

    DRIVE_ITEM_VERSION {
        UUID id PK
        UUID driveItemId FK
        Number versionNumber
        String storageKey "e.g., s3://bucket/obj"
        Number sizeBytes
        String hashValue
        DateTime createdAt
    }

    FILE_LOCK {
        UUID driveItemId FK
        UUID lockedByUserId FK
        String lockType "Pessimistic, Optimistic"
        DateTime expiresAt
        String sessionToken
    }

    %% Integration Context
    DRIVE_REFERENCE {
        UUID id PK
        UUID driveItemId FK
        String moduleName "e.g., Surat, Keuangan"
        String entityId "e.g., surat_id"
        String fieldName "e.g., lampiran"
    }

    %% Permission Context
    SHARE_LINK {
        UUID id PK
        UUID driveItemId FK
        String token UK
        String passwordHash
        DateTime expiresAt
        String accessType "View, Comment, Edit"
        Number downloadLimit
        Number downloadCount
    }

    %% Relationships
    TENANT ||--o{ WORKSPACE : "has"
    WORKSPACE ||--o{ WORKSPACE_MEMBER : "has members"
    WORKSPACE ||--o{ DRIVE_ITEM : "contains root items"
    USER ||--o{ WORKSPACE_MEMBER : "belongs to"
    
    DRIVE_ITEM ||--o{ DRIVE_ITEM : "parent-child (Folder)"
    DRIVE_ITEM ||--|| DRIVE_METADATA : "has metadata"
    DRIVE_ITEM ||--o{ DRIVE_ITEM_VERSION : "has versions"
    DRIVE_ITEM ||--o| FILE_LOCK : "can be locked"
    DRIVE_ITEM ||--o{ SHARE_LINK : "can be shared"
    DRIVE_ITEM ||--o{ DRIVE_REFERENCE : "used by external modules"
```

## 3. Catatan Strategi Desain Database
1. **Materialized Path (Folder Tree)**: Field `materializedPath` ditambahkan untuk menggantikan traversal rekursif ($graphLookup). Mencari semua anak dari folder `A` cukup query `WHERE materializedPath LIKE '/A/%'`.
2. **Immutable Versions**: Field `storageKey` berada di level `DRIVE_ITEM_VERSION`, bukan `DRIVE_ITEM`. Ini memastikan `DRIVE_ITEM` hanya sebagai *pointer* abstrak, sementara *binary* fisik file disimpan abadi sesuai versinya.
3. **Decoupled Extensions**: `DRIVE_REFERENCE` memastikan tabel Surat atau Keuangan tidak perlu dimodifikasi saat file dihapus/dipindahkan. Modul Drive yang akan memelihara integritas relasi ini.
