# CDN, Storage, and Caching Strategy

## CDN strategy
- serve static assets and media thumbnails through CDN
- use signed URLs for protected media assets
- cache immutable assets aggressively
- use edge caching for public content and image variants

## Storage strategy
- use object storage for media, thumbnails, captions, and archives
- MinIO for local development and S3-compatible storage for production
- store metadata in PostgreSQL and search indexes in Elasticsearch

## Caching strategy
- use Redis for session cache, hot content, rate-limit state, and transient job coordination
- use short TTLs for user-specific state
- use longer TTLs for public feeds and catalog metadata
