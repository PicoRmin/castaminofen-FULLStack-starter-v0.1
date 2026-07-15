# Caching Architecture

## Recommended caching strategy
- use Next.js built-in cache for route and data-fetching requests where appropriate
- cache server-rendered results for public content
- use revalidation tags for content updates and invalidation
- keep user-specific data uncached or short-lived

## Principles
- cache public and immutable content aggressively
- cache personalized content conservatively
- invalidate on mutation and content changes
- keep API layer responsible for cache-aware request configuration
