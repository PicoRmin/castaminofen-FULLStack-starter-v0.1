# Health Checks

## Recommended health endpoints
- API: `/health`
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- MinIO: `/minio/health/live`
- Elasticsearch: `GET /_cluster/health`
- RabbitMQ: `GET /api/health/check/ports`
- Prometheus: `/-/healthy`
- Grafana: `/api/health`

## Health policy
- use startup, liveness, and readiness probes
- fail fast on dependency unavailability
- alert on repeated failures
