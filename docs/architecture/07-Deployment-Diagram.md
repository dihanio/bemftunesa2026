# Architecture Decision Record 07: Deployment Diagram & Infrastructure

## 1. Topologi Infrastruktur (Deployment Diagram)

Dokumen ini mendeskripsikan bagaimana arsitektur BEM Drive dideploy ke lingkungan *Staging* maupun *Production*, di dalam kerangka Kubernetes atau Docker Compose.

```mermaid
graph TD
    %% Eksternal
    Users[Client Browsers / Mobile App]
    OnlyOffice[OnlyOffice Document Server]

    subgraph Load Balancer Layer [Cloudflare / NGINX Ingress]
        LB(Ingress / API Gateway)
    end

    subgraph App Cluster [Kubernetes / Docker Swarm Cluster]
        UI[Frontend (Next.js)]
        API[API Gateway & Command/Query Service]
        
        subgraph Worker Nodes [Background Processors]
            W_OCR[OCR Worker]
            W_Thumb[Thumbnail Worker]
            W_Search[Search Index Worker]
            W_Meta[Metadata Worker]
        end
    end

    subgraph Persistence Layer [Stateful Storage]
        Mongo[(MongoDB Replica Set)]
        Redis[(Redis Cluster)]
        Elastic[(Elasticsearch / Atlas Search)]
    end

    subgraph Object Storage [AWS / MinIO / R2]
        Bucket[(S3 Bucket)]
    end

    %% Routing
    Users -->|HTTPS| LB
    LB -->|/api/*| API
    LB -->|/*| UI
    
    %% API Interactions
    API -->|Write/Read| Mongo
    API -->|Cache/PubSub| Redis
    API -->|Search Query| Elastic
    API -->|Multipart Upload| Bucket
    
    %% Worker Interactions
    Redis -.->|Consume Queue| WorkerNodes
    W_OCR -->|Pull file & Push OCR text| Mongo
    W_Search -->|Sync Read Model| Elastic
    W_Thumb -->|Upload Thumbs| Bucket

    %% Integrations
    OnlyOffice <-->|Callback Sync| LB
```

## 2. Strategi Deployment

BEM Drive sebagai *Platform Service* harus *High Availability* (HA). 
1. **API Gateway (NestJS)** didesain murni **Stateless**. Autentikasi menggunakan JWT dan Sesi (Locks) menggunakan Redis. Hal ini memungkinkan Pod/Container API di-skalakan secara horizontal tanpa limitasi.
2. **Workers** di-skalakan berdasarkan beban Queue. Memanfaatkan `BullMQ`, kita dapat menambah `Replica` dari *Worker Node* saat jam-jam padat (misalnya di akhir kepengurusan saat banyak pengguna mengunggah LPJ bersamaan).
3. **MongoDB Replica Set**: Digunakan minimal dengan arsitektur P-S-S (Primary, Secondary, Secondary) untuk toleransi kegagalan dan menjaga *eventual consistency* (*Read Preferences: Secondary Preferred* jika pencarian tidak hit Elastic).
4. **Redis**: Berperan sangat sentral sebagai *Queue Broker* (BullMQ), *Permission Cache*, dan *Rate Limiter*. Wajib Redis dengan persistensi RDB (AOF) atau Redis Cluster.

## 3. Strategi Storage Cost (Tiering)

Mengingat anggaran BEM yang tidak setara korporasi besar, storage dikonfigurasi sebagai berikut:
- **Hot Tier**: File di bawah 6 bulan disimpan di S3 Standard (AWS/R2) untuk akses instan.
- **Archive Tier**: File lama yang sudah melewati *Retention Check* (misal: Dokumentasi proker tahun-tahun lalu) dapat dipindahkan (*Lifecycle Policy*) oleh Cloud Provider ke kelas S3 Glacier (Cold Storage), namun metadata di MongoDB tetap utuh. Saat user mencoba mengunduh, API akan memberikan instruksi bahwa file sedang direstorasi (butuh waktu 1-12 jam).
