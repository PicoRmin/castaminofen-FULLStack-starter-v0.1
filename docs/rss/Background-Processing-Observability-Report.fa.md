# گزارش بستر مشاهده‌پذیری پردازش پس‌زمینه

## Executive Summary

این گزارش، لایه‌ی مشاهده‌پذیری پردازش پس‌زمینه را در بسته‌ی RSS معرفی می‌کند. این لایه فقط برای نظارت و تحلیل وضعیت اجزاى Queue، Worker، Job، Trigger، Scheduler، Retry، Recovery، Dead Letter، Health، Metrics و Telemetry طراحی شده است و هیچ‌گاه اجرا، زمان‌بندی یا همگام‌سازی را انجام نمی‌دهد.

## Architecture

پلتفرم مشاهده‌پذیری بر اساس الگوی Collector، Provider، Registry و Diagnostics ساخته شده است. داده‌ها از قراردادهای موجود Queue، Worker، Scheduler، Telemetry، Metrics و Health خوانده می‌شوند و در یک Snapshot پایدار جمع‌آوری می‌شوند.

## Responsibilities

- جمع‌آوری فقط از زیرساخت‌های موجود
- ارائه Snapshot‌های خواندنی و Immutable
- تحلیل Diagnotics بدون تغییر وضعیت
- پشتیبانی از مانیتورینگ انواع Queue، Worker، Job و Trigger

## Folder Structure

- packages/rss/src/observability
- packages/rss/src/observability/collectors
- packages/rss/src/observability/context
- packages/rss/src/observability/contracts
- packages/rss/src/observability/diagnostics
- packages/rss/src/observability/errors
- packages/rss/src/observability/events
- packages/rss/src/observability/models
- packages/rss/src/observability/runtime
- packages/rss/src/observability/types

## File Tree

- packages/rss/src/observability/index.ts
- packages/rss/src/observability/runtime/observability-runtime.ts
- packages/rss/src/observability/collectors/collector-registry.ts
- packages/rss/src/observability/collectors/collector-factory.ts
- packages/rss/src/observability/diagnostics/default-diagnostics-engine.ts
- packages/rss/src/observability/models/monitoring-models.ts
- packages/rss/src/observability/context/observability-context.ts
- packages/rss/src/observability/events/observability-events.ts
- packages/rss/src/observability/errors/observability-errors.ts
- packages/rss/src/observability/contracts/observability-contracts.ts
- packages/rss/src/observability/types/observability-types.ts

## Created Files

- packages/rss/src/observability/index.ts
- packages/rss/src/observability/runtime/observability-runtime.ts
- packages/rss/src/observability/collectors/collector-registry.ts
- packages/rss/src/observability/collectors/collector-factory.ts
- packages/rss/src/observability/collectors/queue-monitoring-collector.ts
- packages/rss/src/observability/collectors/worker-monitoring-collector.ts
- packages/rss/src/observability/collectors/job-monitoring-collector.ts
- packages/rss/src/observability/collectors/trigger-monitoring-collector.ts
- packages/rss/src/observability/collectors/scheduler-monitoring-collector.ts
- packages/rss/src/observability/collectors/retry-monitoring-collector.ts
- packages/rss/src/observability/collectors/recovery-monitoring-collector.ts
- packages/rss/src/observability/collectors/dead-letter-monitoring-collector.ts
- packages/rss/src/observability/collectors/health-monitoring-collector.ts
- packages/rss/src/observability/collectors/metrics-monitoring-collector.ts
- packages/rss/src/observability/collectors/telemetry-monitoring-collector.ts
- packages/rss/src/observability/diagnostics/default-diagnostics-engine.ts
- packages/rss/src/observability/models/monitoring-models.ts
- packages/rss/src/observability/context/observability-context.ts
- packages/rss/src/observability/events/observability-events.ts
- packages/rss/src/observability/errors/observability-errors.ts
- packages/rss/src/observability/contracts/observability-contracts.ts
- packages/rss/src/observability/types/observability-types.ts
- packages/rss/src/observability/**tests**/observability-runtime.test.ts

## Modified Files

- packages/rss/src/index.ts

## Public Exports

- ObservabilityRuntime
- DefaultCollectorRegistry
- CollectorFactory
- DefaultDiagnosticsEngine
- MonitoringSnapshot
- ObservabilityContext
- ObservabilityEvent
- ObservabilityError
- CollectionPolicy

## Observability Runtime

Runtime جدید با ورودی Context و داده‌های مانیتورینگ، اقدام به ثبت رویدادهای ObservationStarted/Completed/SnapshotCreated و اجرای Collectors می‌کند.

## Collector Architecture

- QueueMonitoringCollector
- WorkerMonitoringCollector
- JobMonitoringCollector
- TriggerMonitoringCollector
- SchedulerMonitoringCollector
- RetryMonitoringCollector
- RecoveryMonitoringCollector
- DeadLetterMonitoringCollector
- HealthMonitoringCollector
- MetricsMonitoringCollector
- TelemetryMonitoringCollector

## Diagnostics Engine

Diagnostics Engine تحلیل‌های Failure، Recovery، Retry، Queue، Worker، Scheduler، Latency، Capacity و Throughput را ارائه می‌دهد و هیچ‌گاه وضعیت را تغییر نمی‌دهد.

## Monitoring Components

- Queue Monitoring
- Worker Monitoring
- Job Monitoring
- Trigger Monitoring
- Scheduler Monitoring
- Retry Monitoring
- Recovery Monitoring
- Dead Letter Monitoring
- Health Monitoring
- Metrics Monitoring
- Telemetry Monitoring

## Queue Monitoring

وضعیت صف، طول صف، کارهای در انتظار، کارهای تأخیری، کارهای در حال اجرا، کارهای تکمیل‌شده، کارهای شکست‌خورده، Retry Queue و Dead Letter Queue پوشش داده شده‌اند.

## Worker Monitoring

وضعیت Worker، تعداد Worker، کارهای در حال اجرا، Workerهای بی‌کار و شاغل، زمان اجرای متوسط، Crash Count، Restart Count، Health و Utilization پوشش داده شده‌اند.

## Scheduler Monitoring

وضعیت Scheduler، تعداد Triggerها و زمان اجرای بعدی/قبلی پوشش داده شده‌اند.

## Job Monitoring

وضعیت Job، Duration، Queue Time، Execution Time، Retry Count، Recovery Count، Priority، Attempts، Cancellation، Failure Reason و Correlation ID پوشش داده شده‌اند.

## Trigger Monitoring

وضعیت Trigger، تعداد Triggerها، Next/Previous Execution و آمار Skipped/Delayed/Cancelled/Expired پوشش داده شده‌اند.

## Performance Analysis

تحلیل‌های Latency، Capacity، Throughput و Bottleneck در Snapshot‌های Diagnostics موجود هستند.

## Error Handling

خطاهای Observability شامل CollectorFailure، DiagnosticsFailure، SnapshotFailure، ConfigurationFailure و MonitoringProviderFailure با اطلاعات ObservationId، Component، CorrelationId و RecoveryRecommendation ارائه شده‌اند.

## Telemetry Integration

لایه‌ی مشاهده‌پذیری از Telemetry موجود استفاده می‌کند و یک لایه‌ی خواندنی بر روی رویدادهای telemetry می‌سازد.

## Health Integration

این لایه از Health Framework موجود استفاده می‌کند و از حساب‌کردن Health مستقیم خودداری می‌کند.

## Extensibility

معماری با Collector و Registry امکان افزودن Providerها و Collectors جدید را در آینده فراهم می‌کند.

## Future Roadmap

- ادغام با Prometheus/Grafana/OpenTelemetry
- افزودن Providerهای خارجی برای Export
- گسترش Diagnostics برای الگوهای پیچیده‌تر

## Remaining Work

- ادغام کامل با محیط‌های عملیاتی واقعی
- افزودن تست‌های بیشتر برای Collectors و Diagnostics
- اتصال نهایی به درایورهای مانیتورینگ بیرونی
