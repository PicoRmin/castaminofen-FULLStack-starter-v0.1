# Streaming and Storage Architecture

## Streaming
- use HLS for adaptive video/audio streaming
- use DASH as a secondary adaptive format for broader compatibility
- generate multiple bitrate renditions and a master manifest
- serve manifests and segments through CDN

## Storage strategy
- store source files and processed renditions in object storage
- use separate buckets for raw, processed, thumbnails, and metadata
- keep metadata in PostgreSQL and search indexes in Elasticsearch

## CDN strategy
- cache manifests, segments, and images at edge nodes
- use signed URLs for protected assets
- configure origin shielding and cache invalidation on asset changes
