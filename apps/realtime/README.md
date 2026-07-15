# realtime

This app provides the realtime surface for the platform with a production-oriented Socket.IO server.

## Features

- WebSocket transport with Socket.IO
- Redis Pub/Sub adapter for horizontal scaling
- Presence tracking for rooms
- Live notifications, listening updates, comments, and typing indicators
- Connection recovery and authentication hooks
- In-memory rate limiting to protect the service

## Runtime configuration

- REALTIME_PORT (default: 4100)
- REALTIME_HOST (default: 0.0.0.0)
- REALTIME_AUTH_TOKEN (optional bearer token guard)
- REDIS_URL (optional Redis connection string for scaling and recovery)
- REALTIME_RATE_LIMIT_WINDOW_MS (default: 1000)
- REALTIME_RATE_LIMIT_MAX_REQUESTS (default: 20)

## Development

- pnpm --filter @castaminofen/app-realtime dev
- pnpm --filter @castaminofen/app-realtime build
