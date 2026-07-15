# Backups

## Strategy
- daily logical backups for PostgreSQL
- daily snapshots for object storage buckets
- weekly full backups for analytics and archive data
- point-in-time recovery enabled where supported

## Recommended tooling
- pg_dump for PostgreSQL
- object storage versioning for MinIO/S3
- encrypted backup storage
- retention policy: 30 days hot, 90 days cold
