# Rate Limiting and Horizontal Scaling

## Rate limiting
- apply per-user, per-IP, and per-route limits
- enforce limits in API gateway or application middleware
- use Redis for distributed counters and sliding-window state

## Horizontal scaling
- run multiple API instances behind NGINX or a load balancer
- scale worker and media processors independently
- use queue-based background processing to absorb bursts
- keep session state externalized in Redis
