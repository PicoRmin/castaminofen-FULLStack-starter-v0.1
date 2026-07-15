# Relations

## Core relation patterns
- one-to-one: `users` to `profiles`
- one-to-many: `users` to `sessions`, `playlists`, `notifications`
- one-to-many: `creators` to `channels` and `content_items`
- one-to-many: `content_items` to `episodes`, `likes`, `comments`, `media_assets`
- many-to-many: `content_items` to `tags` through `content_item_tags`
- many-to-many: `playlists` to `content_items` through `playlist_items`
- many-to-many: `users` to `content_items` through `likes`

## Relationship guidance
- prefer explicit join tables for many-to-many relations
- keep foreign keys nullable only when the relationship is optional
- avoid deep joins in write-heavy paths by keeping the main relationship on the child table
