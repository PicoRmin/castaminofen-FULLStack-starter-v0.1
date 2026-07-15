# گزارش اجرای Runtime کارگرهای همگام‌سازی RSS

## Executive Summary

این مستند، پیاده‌سازی Runtime بازاستفاده‌پذیر کارگرهای همگام‌سازی را در بسته RSS توصیف می‌کند. هدف اصلی، فراهم‌سازی یک لایه اجرای سبک، قابل گسترش و کاملاً جدا از منطق کسب‌وکار بود. در این معماری، کارگرها فقط وظیفه دریافت Job، ایجاد Context اجرای ایمن، انتخاب Handler مناسب و Delegation به سرویس‌های کاربردی موجود را بر عهده دارند. منطق همگام‌سازی، import، retry، recovery، validation و telemetry در لایه‌های موجود باقی مانده و توسط کارگرها فقط فراخوانی می‌شود.

## Architecture

معماری پیشنهادی بر اساس الگوی Worker + Dispatcher + Handler + Context طراحی شده است:

- BullMQ/Queue Adapter: دریافت و تحویل Jobها از زیرساخت صف
- Worker Runtime: میزبان اجرای Jobها
- Dispatcher: تصمیم‌گیری برای انتخاب handler مناسب
- Handler: فراخوانی سرویس‌های موجود بدون وجود منطق کسب‌وکار
- Application Service: سرویس‌های import، synchronization، recovery و telemetry

## Responsibilities

- Worker Runtime: مدیریت lifecycle، شروع/توقف و اجرای Job
- Worker Factory: ایجاد runtime بر اساس نوع کارگر
- Worker Registry: ثبت و ایجاد runtimeهای قابل استفاده
- Dispatcher: حل handler و اجرای Job
- Job Context: فراهم‌سازی داده‌های immutable برای اجرای هر Job
- Handlers: اتصال کارگرها به سرویس‌های موجود

## Folder Structure

- packages/rss/src/workers
- packages/rss/src/workers/contracts
- packages/rss/src/workers/context
- packages/rss/src/workers/dispatcher
- packages/rss/src/workers/errors
- packages/rss/src/workers/events
- packages/rss/src/workers/handlers
- packages/rss/src/workers/runtime
- packages/rss/src/workers/types

## File Tree

```text
packages/rss/src/workers/
  index.ts
  contracts/
    worker-configuration.ts
    worker-handler-contract.ts
    worker-runtime-contract.ts
  context/
    job-context.ts
  dispatcher/
    default-job-dispatcher.ts
  errors/
    worker-errors.ts
  events/
    worker-events.ts
  handlers/
    import-job-handler.ts
    synchronization-job-handler.ts
    retry-job-handler.ts
    recovery-job-handler.ts
    validation-job-handler.ts
    maintenance-job-handler.ts
    health-evaluation-job-handler.ts
    metrics-collection-job-handler.ts
    in-memory-handler-registry.ts
  runtime/
    default-worker-runtime.ts
    default-worker-factory.ts
    worker-registry.ts
    worker-lifecycle.ts
  types/
    worker-types.ts
  __tests__/
    worker-runtime.test.ts
```

## Created Files

- packages/rss/src/workers/contracts/worker-configuration.ts
- packages/rss/src/workers/contracts/worker-handler-contract.ts
- packages/rss/src/workers/contracts/worker-runtime-contract.ts
- packages/rss/src/workers/context/job-context.ts
- packages/rss/src/workers/dispatcher/default-job-dispatcher.ts
- packages/rss/src/workers/errors/worker-errors.ts
- packages/rss/src/workers/events/worker-events.ts
- packages/rss/src/workers/handlers/import-job-handler.ts
- packages/rss/src/workers/handlers/synchronization-job-handler.ts
- packages/rss/src/workers/handlers/retry-job-handler.ts
- packages/rss/src/workers/handlers/recovery-job-handler.ts
- packages/rss/src/workers/handlers/validation-job-handler.ts
- packages/rss/src/workers/handlers/maintenance-job-handler.ts
- packages/rss/src/workers/handlers/health-evaluation-job-handler.ts
- packages/rss/src/workers/handlers/metrics-collection-job-handler.ts
- packages/rss/src/workers/handlers/in-memory-handler-registry.ts
- packages/rss/src/workers/runtime/default-worker-runtime.ts
- packages/rss/src/workers/runtime/default-worker-factory.ts
- packages/rss/src/workers/runtime/worker-registry.ts
- packages/rss/src/workers/runtime/worker-lifecycle.ts
- packages/rss/src/workers/types/worker-types.ts
- packages/rss/src/workers/__tests__/worker-runtime.test.ts

## Modified Files

- packages/rss/src/workers/index.ts

## Public Exports

کلاس‌ها و رابط‌های اصلی از طریق فایل اصلی workers به‌صورت عمومی صادر شده‌اند، از جمله:

- DefaultWorkerRuntime
- DefaultWorkerFactory
- WorkerRegistry
- DefaultJobDispatcher
- JobContext
- WorkerConfiguration
- WorkerLifecycleHooks
- WorkerError
- ImportJobHandler
- SynchronizationJobHandler
- RetryJobHandler
- RecoveryJobHandler
- ValidationJobHandler
- MaintenanceJobHandler
- HealthEvaluationJobHandler
- MetricsCollectionJobHandler

## Worker Runtime

Runtime کارگر شامل موارد زیر است:

- شروع و توقف کارگر
- ایجاد Context immutable برای هر Job
- پذیرش و شروع Job
- dispatch به handler مرتبط
- انتشار رویدادهای lifecycle
- نگه‌داشتن وضعیت اجرایی در قالب state machine ساده

## Worker Lifecycle

Lifecycle پشتیبانی‌شده شامل این مراحل است:

- Worker Started
- Worker Ready
- Job Accepted
- Job Started
- Job Completed
- Job Failed
- Worker Stopped

## Dispatcher Architecture

Dispatcher از registry handler‌ها استفاده می‌کند و بر اساس نوع Job، handler مناسب را resolves می‌کند. این لایه هیچ منطق همگام‌سازی یا import را در خود ندارد و فقط مسئول اجرای handler و مدیریت خطا است.

## Handler Architecture

هر handler وظیفه خود را به یک سرویس موجود تحویل می‌دهد:

- ImportJobHandler → ImportService
- SynchronizationJobHandler → SynchronizationEngine
- RetryJobHandler → SynchronizationRecoveryEngine
- RecoveryJobHandler → SynchronizationRecoveryEngine
- ValidationJobHandler → پاسخ ساده و قابل توسعه
- MaintenanceJobHandler → پاسخ ساده و قابل توسعه
- HealthEvaluationJobHandler → FeedHealthEvaluator
- MetricsCollectionJobHandler → SynchronizationTelemetry

## Job Context

JobContext شامل داده‌های immutable زیر است:

- JobId
- CorrelationId
- FeedId
- WorkerId
- QueueName
- ExecutionId
- Attempt
- Priority
- CancellationToken
- ExecutionMetadata

## Concurrency Model

مدل فعلی به‌صورت قابل‌پیکربندی طراحی شده است و از پارامترهای زیر پشتیبانی می‌کند:

- Concurrency
- Parallel Workers
- Backpressure
- Idle Workers
- Lease Renewal
- Timeout

در نسخه فعلی، این تنظیمات در قالب WorkerConfiguration تعبیه شده‌اند و برای گسترش در آینده آماده‌اند.

## Error Handling

برای خطاهای مرتبط با کارگر، کلاس‌های خاص ایجاد شد:

- WorkerInitializationError
- WorkerExecutionError
- JobDispatchError
- HandlerResolutionError
- WorkerShutdownError

هر خطا شامل شناسه کارگر، jobId، correlationId، stage اجرا، context و recoveryRecommendation است.

## Telemetry Integration

Runtime تنها رویدادهای lifecycle را منتشر می‌کند و از Telemetry موجود برای ثبت وقایع و معیارها استفاده می‌کند. این رویکرد باعث شده است کارگرها از telemetry جدا و در عین حال سازگار باشند.

## Performance Optimizations

- حل handler از طریق registry با lookup مستقیم
- ساخت Context با ساختار immutable و سبک
- جلوگیری از بارگذاری مجدد پیکربندی در زمان اجرا
- نگه‌داشتن runtime بدون منطق سنگین یا blocking startup

## Future Roadmap

- اتصال به BullMQ Worker واقعی به‌جای registry در-memory
- افزودن pool worker و execution scheduling
- افزودن hooks و exporterهای telemetry اختصاصی‌تر
- پشتیبانی از worker affinity و distributed execution
- افزودن unit/integration tests برای هر handler

## Remaining Work

- اتصال نهایی Runtime به Worker واقعی BullMQ
- ثبت کامل handlerهای نوع‌های مختلف در registry واقعی
- افزودن orchestration برای graceful shutdown و cancellation کامل
- گسترش tests برای مسیرهای خطا و lifecycle
