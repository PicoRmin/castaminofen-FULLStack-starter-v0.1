# Logging, Tracing, and Metrics

## Logging
- use structured JSON logs
- include request id, trace id, user id, and service name
- ship logs to Loki

## Tracing
- use OpenTelemetry
- export traces to Tempo or Jaeger
- trace API requests, background jobs, and media processing

## Metrics
- expose Prometheus metrics from API, worker, and media services
- collect latency, error rate, queue depth, memory usage, and throughput
- visualize in Grafana
