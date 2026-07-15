# Schema Organization

## Logical schema layout
- `public` for core application tables
- `audit` for audit and change history tables
- `analytics` for analytics and event tables
- `search` for search metadata and indexing support
- `media` for media metadata and processing tables
- `notifications` for notification infrastructure tables
- `recommendations` for recommendation inputs and outputs

## Why this helps
- isolates operational concerns
- simplifies access control and maintenance
- supports partitioning and archival by domain
- reduces contention between hot and cold data
