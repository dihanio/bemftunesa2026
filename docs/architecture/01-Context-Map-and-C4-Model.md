# Architecture Decision Record 01: Context Map & C4 Model

## 1. Domain Driven Design (DDD) Context Map

Peta konteks ini mendefinisikan batasan (Bounded Contexts) yang jelas di dalam BEM Drive sebagai sebuah Platform Service.

```mermaid
graph TD
    %% Core Contexts
    DriveSDK[DriveSDK Internal Contract]
    
    subgraph Core Domain [BEM Drive Core Platform]
        TenantCtx[Tenant & Workspace Context]
        FileCtx[File & Folder Context]
        StorageCtx[Storage Context]
        AuthCtx[Identity Context]
        PermCtx[Permission & Share Context]
        SearchCtx[Search & Projection Context]
        WfCtx[Workflow & Policy Context]
        ObsCtx[Analytics & Observability Context]
    end

    %% External Systems
    ExternalS3[AWS S3 / MinIO / R2]
    ExternalRedis[Redis Cache]
    ExternalMongo[MongoDB Replica Set]
    ExternalElastic[Elasticsearch / Atlas Search]
    
    %% Other IMS Modules
    ModSurat[Modul Surat]
    ModOprec[Modul Oprec]
    ModKeuangan[Modul Keuangan]

    %% Relationships
    ModSurat -->|Injects & Uses| DriveSDK
    ModOprec -->|Injects & Uses| DriveSDK
    ModKeuangan -->|Injects & Uses| DriveSDK

    DriveSDK -->|Commands & Queries| CoreDomain
    
    FileCtx -->|Validates via| WfCtx
    FileCtx -->|Checks access via| PermCtx
    FileCtx -->|Persists binary via| StorageCtx
    SearchCtx -->|Read Model Sync| FileCtx
    TenantCtx -->|Owns| FileCtx
    
    StorageCtx -.->|Multipart / Stream| ExternalS3
    PermCtx -.->|Cache ACL| ExternalRedis
    FileCtx -.->|CRUD| ExternalMongo
    SearchCtx -.->|Sync Index| ExternalElastic
    ObsCtx -.->|Logs & Metrics| ExternalRedis
```

## 2. C4 Model - Level 1: System Context

```mermaid
C4Context
    title System Context diagram for BEM Drive Platform

    Person(mahasiswa, "Mahasiswa / Pengurus", "Pengguna IMS BEM FT UNESA")
    Person(external, "Pihak Eksternal", "Sponsor, Dekanat (Akses via Public Link)")
    
    System_Ext(ims_modules, "Modul IMS Lain (Surat, Oprec, Keuangan)", "Sistem-sistem yang berjalan di dalam ekosistem BEM FT UNESA")

    System(bem_drive, "BEM Drive Storage Platform", "Menyediakan layanan penyimpanan, pencarian, kolaborasi, dan manajemen siklus hidup file secara terpusat.")

    System_Ext(s3_storage, "Object Storage (S3/MinIO)", "Penyimpanan fisik file binary.")
    System_Ext(onlyoffice, "OnlyOffice Document Server", "Layanan kolaborasi dan edit dokumen realtime.")

    Rel(mahasiswa, bem_drive, "Upload, download, search, share files", "HTTPS")
    Rel(external, bem_drive, "Download/view public shared files", "HTTPS")
    Rel(ims_modules, bem_drive, "Menyimpan attachment & dokumen sistem via DriveSDK", "Internal Call")

    Rel(bem_drive, s3_storage, "Store & retrieve blobs", "S3 API (HTTPS)")
    Rel(bem_drive, onlyoffice, "Sync document locking & sessions", "HTTPS/JWT")
```

## 3. C4 Model - Level 2: Container

```mermaid
C4Container
    title Container diagram for BEM Drive Platform

    Person(user, "User", "Mahasiswa, Eksternal")
    System_Ext(ims, "Other IMS Modules", "Surat, Keuangan, dll.")

    Container(spa, "Web Application", "React/Next.js", "Antarmuka BEM Drive (Workspace, Explorer, Share, Dashboard Analytics)")
    Container(api_gateway, "API Gateway / BFF", "NestJS", "Routing request, otentikasi JWT, API Versioning")
    
    Boundary(c_backend, "Drive Backend Services") {
        Container(sdk, "DriveSDK", "TypeScript", "Internal Service Contract untuk modul IMS lain.")
        Container(cmd_service, "Command Service", "NestJS", "Menangani write operations (Upload, Move, Delete, Share)")
        Container(query_service, "Query Service", "NestJS", "Menangani read operations (Search, List, Dashboard)")
        Container(event_bus, "Event Publisher Port", "EventEmitter2/Redis PubSub", "Mendistribusikan Domain Events")
        
        Container(worker_pool, "Worker Pool", "Node.js (BullMQ)", "Independent workers: OCR, Virus Scan, Thumbnail, Metadata, Search Indexer")
    }

    ContainerDb(mongo, "Primary Database", "MongoDB", "Menyimpan Workspace, DriveItem, Permissions, Audit Log")
    ContainerDb(redis, "Cache & Session", "Redis", "Menyimpan Lock, Session, Quota Counter, ACL Cache")
    ContainerDb(elastic, "Search Projection", "Elasticsearch / Atlas Search", "Read-model untuk Semantic Search & Filter cepat")
    ContainerDb(s3, "Object Storage", "MinIO/AWS S3", "Penyimpanan Binary Files")

    Rel(user, spa, "Mengunjungi", "HTTPS")
    Rel(spa, api_gateway, "API calls", "JSON/HTTPS")
    Rel(ims, sdk, "Memanggil metode Drive", "Internal In-Process")
    
    Rel(api_gateway, cmd_service, "Routes commands")
    Rel(api_gateway, query_service, "Routes queries")
    Rel(sdk, cmd_service, "Routes commands")
    Rel(sdk, query_service, "Routes queries")

    Rel(cmd_service, mongo, "Writes to")
    Rel(cmd_service, redis, "Locks & Caches")
    Rel(cmd_service, event_bus, "Publishes Domain Events")
    Rel(cmd_service, s3, "Uploads Blobs (Multipart)")

    Rel(query_service, mongo, "Reads from")
    Rel(query_service, redis, "Reads cache")
    Rel(query_service, elastic, "Advanced Searches")

    Rel(event_bus, worker_pool, "Subscribes to events")
    Rel(worker_pool, s3, "Reads Blobs for processing")
    Rel(worker_pool, elastic, "Updates Search Index")
    Rel(worker_pool, mongo, "Updates File Metadata")
```

## 4. C4 Model - Level 3: Component (Command Service)

```mermaid
C4Component
    title Component diagram for Command Service (Write Operations)

    Container(api, "API Layer", "NestJS Controllers", "Menerima Request HTTP (e.g. UploadController, FileController)")
    
    Component(upload_handler, "Upload Handler", "CQRS Command Handler", "Menangani logika TUS / Resumable Upload")
    Component(policy_engine, "Policy Engine", "Domain Service", "Mengevaluasi rules (Allow/Deny/Condition)")
    Component(storage_gw, "FileStorageGateway", "Domain Port", "Abstraksi penyimpanan fisik")
    Component(s3_provider, "S3StorageProvider", "Infrastructure Adapter", "Implementasi spesifik AWS/MinIO")
    Component(repo, "DriveItemRepository", "Infrastructure Adapter", "Menyimpan metadata ke MongoDB")
    Component(event_pub, "EventPublisher", "Infrastructure Adapter", "Mempublish event ke Event Bus")

    Rel(api, upload_handler, "Execute(UploadFileCommand)")
    Rel(upload_handler, policy_engine, "Check Policies (Can Upload?)")
    Rel(upload_handler, storage_gw, "Save Blob via Gateway")
    Rel(storage_gw, s3_provider, "Implemented by")
    Rel(upload_handler, repo, "Save Metadata (DriveItem)")
    Rel(upload_handler, event_pub, "Publish(FileUploadedEvent)")
```
