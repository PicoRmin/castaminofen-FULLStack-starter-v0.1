# معماری زیرساختی

## 1. اجزای زیرساختی اصلی

- PostgreSQL
- Prisma
- Redis
- Elasticsearch
- MinIO برای توسعه
- S3-compatible storage برای تولید
- BullMQ
- WebSocket/Socket.io
- FFmpeg
- HLS
- Docker Compose

## 2. لایه‌های زیرساخت

### 2.1 Database Layer

- PostgreSQL به‌عنوان source of truth
- Prisma برای ORM
- schema versioning و migrations
- read/write split در آینده

### 2.2 Cache Layer

- Redis برای sessions، hot reads، queues، caching
- cache policy با invalidation روشن

### 2.3 Search Layer

- Elasticsearch برای全文 جستجو
- indexing از events و ingest pipeline

### 2.4 Media Layer

- object storage برای فایل‌ها
- transcoding و packaging با FFmpeg/HLS
- signed URLs و CDN

### 2.5 Queue Layer

- BullMQ برای background jobs
- retries, backoff, DLQ

### 2.6 Realtime Layer

- WebSocket/Socket.io برای live interaction
- presence و room-based collaboration

## 3. قوانین زیرساختی

- هیچ ماژول کسب‌وکار نباید مستقیم به زیرساخت وابسته باشد.
- همه اتصالات از طریق adapter و ports انجام شود.
- زیرساخت باید قابل تعویض باشد.
