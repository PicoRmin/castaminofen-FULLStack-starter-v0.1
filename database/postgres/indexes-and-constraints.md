# Indexes and Constraints

## Core indexes
- `users(email)` unique
- `users(username)` unique
- `creators(handle)` unique
- `content_items(status, published_at)`
- `content_items(creator_id, published_at)`
- `episodes(content_item_id, episode_number)`
- `likes(content_item_id, user_id)`
- `comments(content_item_id, parent_id)`
- `playlists(user_id, is_public)`
- `watch_history(user_id, watched_at)`
- `notifications(user_id, is_read, created_at)`
- `analytics_events(event_type, created_at)`

## Constraints
- foreign keys with `ON DELETE RESTRICT` or `SET NULL`
- check constraints for statuses and booleans
- not-null constraints on mandatory fields
- uniqueness on natural business keys

## Why this helps
- avoids hot-table scans
- supports common read patterns
- preserves data integrity at the database boundary
