# Prompt-7A.5.2 — مستندات حسابرسی و قراردادهای رویدادهای دامنه چرخه‌عمری فید

## 1. Executive Summary

بر اساس بازبینی مستقیم در کدهای موجود در [packages/rss/src/lifecycle](packages/rss/src/lifecycle)، [packages/rss/src/import](packages/rss/src/import)، [packages/rss/src/synchronization](packages/rss/src/synchronization)، [packages/rss/src/persistence](packages/rss/src/persistence)، [packages/rss/src/queue](packages/rss/src/queue)، [packages/rss/src/scheduler](packages/rss/src/scheduler)، [packages/rss/src/workers](packages/rss/src/workers)، [packages/rss/src/health](packages/rss/src/health) و [packages/rss/src/observability](packages/rss/src/observability)، وضعیت فعلی سیستم رویدادها در این مخزن به‌صورت پراکنده، نیمه‌متمرکز و غیر یکنواخت است.

رویدادهای چرخه‌عمری فید در حال حاضر در چند لایه مختلف وجود دارند:

- رویدادهای چرخه‌عمری فید در [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts)
- ثبت‌نام انتقال‌ها و نام‌های رویداد آتی در [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- رویدادهای ورود و بارگذاری در [packages/rss/src/import/service.ts](packages/rss/src/import/service.ts) و [packages/rss/src/import/types.ts](packages/rss/src/import/types.ts)
- هوک‌های رویدادی در [packages/rss/src/synchronization/events](packages/rss/src/synchronization/events)
- رویدادهای چرخه‌عمری در [packages/rss/src/persistence/events/index.ts](packages/rss/src/persistence/events/index.ts)
- رویدادهای صف و کارگر در [packages/rss/src/queue/events/queue-lifecycle-events.ts](packages/rss/src/queue/events/queue-lifecycle-events.ts) و [packages/rss/src/workers/events/worker-events.ts](packages/rss/src/workers/events/worker-events.ts)
- رویدادهای زمان‌بندی و سلامت در [packages/rss/src/scheduler/events/scheduler-events.ts](packages/rss/src/scheduler/events/scheduler-events.ts) و [packages/rss/src/health/events/index.ts](packages/rss/src/health/events/index.ts)

نتیجه‌گیری کلی این است که یک «معماری رویداد دامنه‌ی واحد و رسمی» در مخزن وجود ندارد؛ در عوض، چند الگوی مشابه اما غیر یکنواخت برای رویدادها به‌کار رفته‌اند. این مستند برای آماده‌سازی یک قرارداد واحد و قابل‌استفاده برای آینده، بدون پیاده‌سازی Event Bus، Outbox، Broker یا Worker، تهیه شده است.

## 2. Repository Audit Findings

| مؤلفه                                | وضعیت        | شواهد                                                                                                                                                                                                                                                                                                | توضیح                                                                                                                             |
| ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| رویدادهای چرخه‌عمری فید در Aggregate | PARTIAL      | [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts)                                                                                                                                                                                                                   | تنها یک رویداد ساده با نوع `FeedLifecycleTransitionApplied` تولید می‌شود و هیچ بسته‌ی استانداردی برای envelope یا metadata ندارد. |
| ثبت انتقال‌ها و نام رویدادهای آتی    | PARTIAL      | [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)                                                                                                                                                                                                                     | در این فایل برای بسیاری از انتقال‌ها فیلدهای `futureEventName` تعریف شده‌اند، اما قرارداد نهایی و مرکزی برای رویداد وجود ندارد.   |
| قرارداد رویدادهای ورود/واردات        | PARTIAL      | [packages/rss/src/import/types.ts](packages/rss/src/import/types.ts) و [packages/rss/src/import/service.ts](packages/rss/src/import/service.ts)                                                                                                                                                      | رویدادها از نوع ساده و محلی استفاده می‌شوند و فاقد envelope، identity و version مشترک هستند.                                      |
| رویدادهای همگام‌سازی                 | PARTIAL      | [packages/rss/src/synchronization/events/index.ts](packages/rss/src/synchronization/events/index.ts)                                                                                                                                                                                                 | چند هوک جداگانه برای مراحل مختلف وجود دارد، اما یک قرارداد واحد و مشترک برای همه رویدادهای همگام‌سازی وجود ندارد.                 |
| رویدادهای پایدارسازی/پایگاه‌داده     | COMPLETE     | [packages/rss/src/persistence/events/index.ts](packages/rss/src/persistence/events/index.ts)                                                                                                                                                                                                         | این بخش از نظر نوع‌گذاری نسبتاً منظم و مشخص است، اما هنوز در قالب دامنه‌ی فید به‌صورت یکپارچه استفاده نشده است.                   |
| رویدادهای صف و کارگر                 | PARTIAL      | [packages/rss/src/queue/events/queue-lifecycle-events.ts](packages/rss/src/queue/events/queue-lifecycle-events.ts) و [packages/rss/src/workers/events/worker-events.ts](packages/rss/src/workers/events/worker-events.ts)                                                                            | ساختار مشابهی دارند اما با مدل‌های متفاوت و بدون استاندارد دامنه‌ی فید.                                                           |
| رویدادهای زمان‌بندی                  | PARTIAL      | [packages/rss/src/scheduler/events/scheduler-events.ts](packages/rss/src/scheduler/events/scheduler-events.ts)                                                                                                                                                                                       | یک تابع سازنده برای ساخت رویداد وجود دارد، اما این رویداد هنوز به‌صورت قرارداد دامنه‌ی فید استاندارد نشده است.                    |
| رویدادهای سلامت                      | PARTIAL      | [packages/rss/src/health/events/index.ts](packages/rss/src/health/events/index.ts)                                                                                                                                                                                                                   | رویدادهای سلامت وجود دارند ولی به‌صورت محدود و بدون envelope کلی.                                                                 |
| قرارداد envelope استاندارد           | MISSING      | —                                                                                                                                                                                                                                                                                                    | در مخزن هیچ `EventEnvelope` واحدی برای رویدادهای فید وجود ندارد.                                                                  |
| قرارداد metadata استاندارد           | MISSING      | —                                                                                                                                                                                                                                                                                                    | متادیتاهای مختلف در چند نقطه پراکنده‌اند و هیچ مدل مرکزی برای آن وجود ندارد.                                                      |
| قرارداد versioning و compatibility   | MISSING      | —                                                                                                                                                                                                                                                                                                    | هیچ استراتژی رسمی برای نسخه‌پذیری رویدادها و سازگاری backward/forward در مخزن دیده نمی‌شود.                                       |
| مدل failure contract                 | MISSING      | —                                                                                                                                                                                                                                                                                                    | هیچ قرارداد ساختاریافته‌ای برای خطاهای رویدادی مانند `InvalidEventContract` یا `UnsupportedVersion` در سطح دامنه دیده نمی‌شود.    |
| تکرار الگوهای رویدادی                | DUPLICATED   | [packages/rss/src/synchronization/events](packages/rss/src/synchronization/events)، [packages/rss/src/persistence/events/index.ts](packages/rss/src/persistence/events/index.ts)، [packages/rss/src/queue/events/queue-lifecycle-events.ts](packages/rss/src/queue/events/queue-lifecycle-events.ts) | الگوی `type + stage/message/context/timestamp` در چند ماژول تکرار شده است.                                                        |
| سازگاری با معماری آینده              | INCONSISTENT | [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts) و [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts)                                                                                                                                | برخی انتقال‌ها نام رویداد آتی دارند ولی هیچ قرارداد قطعی برای انتشار، envelope یا متادیتای اجرایی وجود ندارد.                     |

## 3. Existing Event Implementations

| دسته                        | نمونه رویداد/هوک                                                                                   | وضعیت                    | ملاحظات                                                                                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| چرخه‌عمری فید               | `FeedLifecycleTransitionApplied`                                                                   | موجود                    | در [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts) ساخته می‌شود.                                                                                                                                                           |
| انتقال‌های از پیش تعریف‌شده | `feed.registered`, `feed.validation.started`, `feed.import.started`, `feed.sync.completed`         | موجود به‌صورت تعریف مسیر | در [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts) به‌عنوان `futureEventName` ثبت شده‌اند.                                                                                                                                   |
| ورود/واردات                 | `import-started`, `provider-resolved`, `feed-downloaded`, `parsing-completed`, `import-completed`  | موجود                    | در [packages/rss/src/import/service.ts](packages/rss/src/import/service.ts) منتشر می‌شوند، اما ساختار ساده و غیر استاندارد است.                                                                                                                               |
| همگام‌سازی                  | `onStarted`, `onProgress`, `onCompleted`, `onFailed`, `onCancelled`, `onSkipped`, `onStateChanged` | موجود                    | در [packages/rss/src/synchronization/events/index.ts](packages/rss/src/synchronization/events/index.ts) و [packages/rss/src/synchronization/core/synchronization-engine.ts](packages/rss/src/synchronization/core/synchronization-engine.ts) استفاده می‌شوند. |
| حالت فید در همگام‌سازی      | `onStateCreated`, `onCheckpointCreated`, `onSnapshotCreated`                                       | موجود                    | در [packages/rss/src/synchronization/events/feed-state-events.ts](packages/rss/src/synchronization/events/feed-state-events.ts) تعریف شده‌اند.                                                                                                                |
| قفل‌کردن                    | `onLockRequested`, `onLockAcquired`, `onLeaseExpired`                                              | موجود                    | در [packages/rss/src/synchronization/events/locking.ts](packages/rss/src/synchronization/events/locking.ts).                                                                                                                                                  |
| بازیابی                     | `onFailureClassified`, `onRetryScheduled`, `onRecoveryCompleted`                                   | موجود                    | در [packages/rss/src/synchronization/events/recovery.ts](packages/rss/src/synchronization/events/recovery.ts).                                                                                                                                                |
| پایدارسازی                  | `persistence-started`, `transaction-opened`, `commit-completed`                                    | موجود                    | در [packages/rss/src/persistence/events/index.ts](packages/rss/src/persistence/events/index.ts).                                                                                                                                                              |
| صف و کارگر                  | `onQueueCreated`, `onJobQueued`, `onJobFailed`                                                     | موجود                    | در [packages/rss/src/queue/events/queue-lifecycle-events.ts](packages/rss/src/queue/events/queue-lifecycle-events.ts) و [packages/rss/src/workers/events/worker-events.ts](packages/rss/src/workers/events/worker-events.ts).                                 |
| زمان‌بندی                   | `createSchedulerLifecycleEvent`                                                                    | موجود                    | در [packages/rss/src/scheduler/events/scheduler-events.ts](packages/rss/src/scheduler/events/scheduler-events.ts).                                                                                                                                            |
| سلامت                       | `evaluation-started`, `evaluation-failed`                                                          | موجود                    | در [packages/rss/src/health/events/index.ts](packages/rss/src/health/events/index.ts).                                                                                                                                                                        |

## 4. Domain Event Architecture

معماری پیشنهادی برای این مرحله، بدون ورود به Event Bus، Outbox یا Broker، بر پایه‌ی یک قرارداد واحد و مرکزی برای رویدادهای چرخه‌عمری فید است.

### چهارچوب پیشنهادی

1. یک envelope واحد برای همه رویدادهای دامنه‌ی فید.
2. یک payload استاندارد برای هر دسته رویداد: lifecycle، synchronization، import، failure، operational.
3. یک metadata مرکزی برای اجرای تراکنش، actor، محیط، feature flag، trace و audit.
4. یک استراتژی نسخه‌پذیری که سازگاری backward و forward را حفظ کند.
5. یک طبقه‌بندی ثابت برای رویدادها تا از تعریف‌های پراکنده جلوگیری شود.

### رویدادهای مرجع پیشنهادی

| رویداد                                               | وضعیت فعلی          | وضعیت پیشنهادی                              |
| ---------------------------------------------------- | ------------------- | ------------------------------------------- |
| `FeedLifecycleTransitionApplied`                     | موجود               | استاندارد شود و به envelope کامل تبدیل شود. |
| `feed.registered`                                    | نام آتی در registry | در قرارداد مرکزی ثبت شود.                   |
| `feed.validation.started`                            | نام آتی در registry | در قرارداد مرکزی ثبت شود.                   |
| `feed.import.started`                                | نام آتی در registry | در قرارداد مرکزی ثبت شود.                   |
| `feed.sync.completed`                                | نام آتی در registry | در قرارداد مرکزی ثبت شود.                   |
| `import-started`                                     | موجود               | به envelope استاندارد تبدیل شود.            |
| `import-completed`                                   | موجود               | به envelope استاندارد تبدیل شود.            |
| `synchronization-started` / `synchronization-failed` | موجود به‌صورت هوک   | به قرارداد دامنه‌ی واحد تبدیل شود.          |

## 5. Event Envelope

| فیلد                         | وضعیت فعلی | وضعیت پیشنهادی                                                                                                       |
| ---------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Event ID                     | MISSING    | باید در همه رویدادها موجود باشد.                                                                                     |
| Event Name                   | PARTIAL    | باید از یک enum/union مرکزی تأمین شود.                                                                               |
| Aggregate ID                 | PARTIAL    | باید از Aggregate فید آمده باشد.                                                                                     |
| Aggregate Type               | MISSING    | باید به صورت ثابت `Feed` یا `FeedLifecycleAggregate` باشد.                                                           |
| Aggregate Version            | PARTIAL    | از نسخه Aggregate در [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts) استخراج شود. |
| Occurred At                  | PARTIAL    | از `timestamp`/`occurredAt` موجود در ماژول‌ها استفاده شود.                                                           |
| Correlation ID               | PARTIAL    | باید از request/transition metadata تأمین شود.                                                                       |
| Causation ID                 | MISSING    | برای پیگیری علت رویداد باید موجود باشد.                                                                              |
| Trace ID                     | MISSING    | برای ردیابی اجرای زنجیره‌ای لازم است.                                                                                |
| Execution ID                 | MISSING    | برای اجرای مرحله‌ای و plan execution ضروری است.                                                                      |
| Producer                     | MISSING    | باید مشخص کند رویداد از کدام ماژول یا service آمده است.                                                              |
| Event Version                | MISSING    | باید نسخه‌ی قرارداد رویداد را نشان دهد.                                                                              |
| Schema Version               | MISSING    | برای سازگاری در آینده ضروری است.                                                                                     |
| Metadata                     | PARTIAL    | باید از یک ساختار مرکزی استفاده کند.                                                                                 |
| Payload                      | PARTIAL    | باید به شکل immutable و strongly typed باشد.                                                                         |
| Future Tenant Metadata       | MISSING    | برای معماری چندمستاجری آماده شود.                                                                                    |
| Future Subscription Metadata | MISSING    | برای سیاست‌های اشتراک آماده شود.                                                                                     |

## 6. Event Contracts

| قرارداد                         | وضعیت    | پیشنهاد                                                                                                                                                             |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FeedLifecycleDomainEvent`      | PARTIAL  | در [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts) موجود است اما فقط یک اسکلت ساده است.                                                  |
| `ImportEvent`                   | PARTIAL  | در [packages/rss/src/import/types.ts](packages/rss/src/import/types.ts) تعریف شده است و باید به envelope کامل تبدیل شود.                                            |
| `SynchronizationLifecycleEvent` | PARTIAL  | در [packages/rss/src/synchronization/events/index.ts](packages/rss/src/synchronization/events/index.ts) تعریف شده است و باید در یک قرارداد مرکزی ادغام شود.         |
| `PersistenceLifecycleEvent`     | COMPLETE | در [packages/rss/src/persistence/events/index.ts](packages/rss/src/persistence/events/index.ts) از نظر ساختار نسبتاً کامل است ولی باید برای دامنه‌ی فید متمرکز شود. |
| `QueueLifecycleEvent`           | PARTIAL  | در [packages/rss/src/queue/events/queue-lifecycle-events.ts](packages/rss/src/queue/events/queue-lifecycle-events.ts) وجود دارد اما جدا از دامنه‌ی فید است.         |
| `SchedulerLifecycleEvent`       | PARTIAL  | در [packages/rss/src/scheduler/events/scheduler-events.ts](packages/rss/src/scheduler/events/scheduler-events.ts) وجود دارد، اما باید به envelope مشترک منطبق شود.  |
| `FeedHealthLifecycleEvent`      | PARTIAL  | در [packages/rss/src/health/events/index.ts](packages/rss/src/health/events/index.ts) وجود دارد و باید به قرارداد عمومی تبدیل شود.                                  |

### قرارداد پیشنهادی برای Contract مرکزی

- `FeedLifecycleEventEnvelope<TPayload, TMetadata>`
- `FeedLifecycleEventName` به‌صورت union مرکزی
- `FeedLifecycleEventPayload` برای رویدادهای lifecycle
- `FeedLifecycleSynchronizationPayload` برای رویدادهای همگام‌سازی
- `FeedLifecycleImportPayload` برای رویدادهای واردات
- `FeedLifecycleFailurePayload` برای رویدادهای شکست
- `FeedLifecycleEventMetadata` برای متادیتای مشترک

## 7. Event Metadata

| نوع متادیتا                   | وضعیت   | پیشنهاد                                                                                                                                                                       |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Execution Metadata            | MISSING | باید شامل `executionId`، `planId` و `stage` باشد.                                                                                                                             |
| Transition Metadata           | PARTIAL | از [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts) و [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts) گرفته شود. |
| Actor Metadata                | PARTIAL | باید از `actor` و `reason` موجود در انتقال‌ها استخراج شود.                                                                                                                    |
| Environment                   | MISSING | باید شامل `environment`, `region`, `tenant` باشد.                                                                                                                             |
| Feature Flags                 | MISSING | برای آینده آماده شود.                                                                                                                                                         |
| Request Metadata              | PARTIAL | از `correlationId` و `metadata` در [packages/rss/src/import/types.ts](packages/rss/src/import/types.ts) استفاده شود.                                                          |
| Repository Snapshot Reference | MISSING | برای replay و audit لازم است.                                                                                                                                                 |
| Audit Metadata                | MISSING | باید شامل شاخص‌های حسابرسی و ردیابی باشد.                                                                                                                                     |
| Logging Metadata              | MISSING | برای log correlation آماده شود.                                                                                                                                               |
| Metrics Metadata              | MISSING | برای observability آماده شود.                                                                                                                                                 |
| Future Notification Metadata  | MISSING | برای آینده نگه داشته شود.                                                                                                                                                     |
| Future Retry Metadata         | MISSING | برای retry و recovery آماده شود.                                                                                                                                              |

## 8. Event Versioning Strategy

| جنبه                   | وضعیت   | پیشنهاد                                                |
| ---------------------- | ------- | ------------------------------------------------------ |
| Event Version          | MISSING | باید در envelope وجود داشته باشد.                      |
| Schema Version         | MISSING | باید جدا از event version نگه‌داری شود.                |
| Backward Compatibility | MISSING | باید برای رویدادهای قدیمی در نظر گرفته شود.            |
| Forward Compatibility  | MISSING | باید با افزودن فیلدهای اختیاری انجام شود.              |
| Event Evolution        | MISSING | باید با سیاست افزودن-نگه‌داشتن-تغییر تدریجی انجام شود. |
| Deprecation Strategy   | MISSING | باید اعلام رسمی و نسخه‌دار باشد.                       |

### سیاست پیشنهادی

- نسخه‌ی رویداد در هر تغییر قرارداد افزایش یابد.
- نسخه‌ی schema مستقل از event version باشد.
- فیلدهای جدید اختیاری و با default باشند.
- حذف فیلدها فقط در نسخه‌های بعدی و با deprecation انجام شود.
- رویدادهای قدیمی با `compatibilityMode` یا `schemaVersion` قابل شناسایی باشند.

## 9. Event Classification

| طبقه                      | نمونه                                               | وضعیت                                  |
| ------------------------- | --------------------------------------------------- | -------------------------------------- |
| Lifecycle Events          | `FeedLifecycleTransitionApplied`                    | موجود و قابل استانداردسازی             |
| Synchronization Events    | `onCompleted`, `onFailed`, `onStateChanged`         | موجود                                  |
| Import Events             | `import-started`, `import-completed`                | موجود                                  |
| Operational Events        | `provider-resolved`, `feed-downloaded`              | موجود                                  |
| Administrative Events     | انتقال‌های مدیریتی مانند pause/disable/archive      | در registry وجود دارد                  |
| Recovery Events           | `validation-retried`, `recovery-completed`          | در registry و recovery hooks وجود دارد |
| Failure Events            | `validation-failed`, `import-failed`, `sync-failed` | در registry وجود دارد                  |
| Audit Events              | فعلاً نه به‌صورت قرارداد مرکزی                      | MISSING                                |
| Future Integration Events | برای Event Bus/CQRS/Microservice                    | MISSING                                |

## 10. Event Compatibility

| مولفه                        | وضعیت سازگاری | توضیح                                                                                                  |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| Feed Aggregate               | PARTIAL       | Aggregate رویداد تولید می‌کند اما با envelope کامل سازگار نیست.                                        |
| Lifecycle Domain Service     | PARTIAL       | سرویس چرخه‌عمری از transition و hooks پشتیبانی می‌کند ولی رویدادها را به‌صورت مرکزی استاندارد نمی‌کند. |
| Repositories                 | PARTIAL       | مخزن‌ها داده را نگه می‌دارند اما گواهی رویدادی مستقیم ندارند.                                          |
| Workers                      | PARTIAL       | رویدادهای کارگر جداگانه‌اند و با دامنه‌ی فید یکپارچه نیستند.                                           |
| Scheduler                    | PARTIAL       | رویدادهای زمان‌بندی جداگانه‌اند اما قابل تبدیل به envelope مشترک هستند.                                |
| Monitoring                   | PARTIAL       | در [packages/rss/src/observability](packages/rss/src/observability) الگوهای رویدادی دیده می‌شود.       |
| Metrics                      | PARTIAL       | برای متریک‌ها الگوهای رویدادی وجود دارد اما با دامنه‌ی فید یک‌دست نیست.                                |
| Audit                        | MISSING       | هنوز قرارداد حسابرسی جداگانه و مرکزی وجود ندارد.                                                       |
| Future Event Bus             | MISSING       | این نسخه فقط قراردادها را آماده می‌کند.                                                                |
| Future CQRS / Event Sourcing | MISSING       | آماده‌سازی برای آینده انجام شده اما پیاده‌سازی نشده است.                                               |
| Future Microservices         | MISSING       | نیاز به envelope و versioning استاندارد دارد.                                                          |

## 11. Existing Components Reused

| مؤلفه                                                                                                              | دلیل استفاده                                        |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts)                                 | برای استخراج رویداد اصلی چرخه‌عمری فید              |
| [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)                                   | برای استخراج نام‌های رویداد و انتقال‌های آتی        |
| [packages/rss/src/import/service.ts](packages/rss/src/import/service.ts)                                           | برای بازطراحی رویدادهای واردات به قرارداد استاندارد |
| [packages/rss/src/synchronization/events](packages/rss/src/synchronization/events)                                 | برای ادغام رویدادهای همگام‌سازی                     |
| [packages/rss/src/persistence/events/index.ts](packages/rss/src/persistence/events/index.ts)                       | برای استفاده از الگوی رویداد پایدارسازی             |
| [packages/rss/src/queue/events/queue-lifecycle-events.ts](packages/rss/src/queue/events/queue-lifecycle-events.ts) | برای استفاده از الگوی رویدادهای صف                  |
| [packages/rss/src/scheduler/events/scheduler-events.ts](packages/rss/src/scheduler/events/scheduler-events.ts)     | برای استفاده از الگوی رویدادهای زمان‌بندی           |
| [packages/rss/src/health/events/index.ts](packages/rss/src/health/events/index.ts)                                 | برای استفاده از رویدادهای سلامت فید                 |

## 12. Existing Components Extended

| مؤلفه                                                                                                | وضعیت                                                           |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)                           | باید به‌صورت مرکزی با envelope و metadata استاندارد گسترش یابد. |
| [packages/rss/src/import/types.ts](packages/rss/src/import/types.ts)                                 | باید برای انجام contract استاندارد گسترش یابد.                  |
| [packages/rss/src/synchronization/events/index.ts](packages/rss/src/synchronization/events/index.ts) | باید با یک envelope مشترک و payloadهای دامنه‌ای گسترش یابد.     |

## 13. New Components

| مؤلفه پیشنهادی                 | نوع  | توضیح                                                                 |
| ------------------------------ | ---- | --------------------------------------------------------------------- |
| قرارداد مرکزی رویداد دامنه فید | جدید | یک envelope، metadata و payload مشترک برای همه رویدادهای چرخه‌عمری.   |
| طبقه‌بندی مرکزی رویدادها       | جدید | برای lifecycle، synchronization، import، failure، operational، audit. |
| استراتژی نسخه‌پذیری            | جدید | برای backward/forward compatibility و deprecation.                    |
| قرارداد failure model          | جدید | برای خطاهای رویدادی ساختاریافته و قابل‌استفاده در آینده.              |

## 14. Modified Files

| فایل                                                     | وضعیت                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| هیچ فایل موجودی در این مرحله به‌صورت کد تغییر نکرده است. | این مستند فقط برای آماده‌سازی قراردادهای معماری و حسابرسی ایجاد شده است. |

## 15. New Files

| فایل                                                                                           | وضعیت     |
| ---------------------------------------------------------------------------------------------- | --------- |
| [Prompt-7A.5.2-Feed-Lifecycle-Domain-Events.md](Prompt-7A.5.2-Feed-Lifecycle-Domain-Events.md) | ایجاد شد. |

## 16. Files Left Untouched

| فایل                                                                               | دلیل                                                       |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts) | فقط مستندسازی شده و تغییر در منطق اجرا نشده است.           |
| [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)   | برای این مرحله فقط audit انجام شد.                         |
| [packages/rss/src/import/service.ts](packages/rss/src/import/service.ts)           | هیچ انتشار یا منطق جدیدی اضافه نشده است.                   |
| [packages/rss/src/synchronization/events](packages/rss/src/synchronization/events) | فقط برای استخراج الگوهای موجود استفاده شده است.            |
| سایر ماژول‌های رویدادی                                                             | بر اساس اصل «عدم تغییر در معماری موجود» دست‌کاری نشده‌اند. |

## 17. Architecture Decisions

| تصمیم                           | توضیح                                                                                                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حفظ معماری فعلی                 | هیچ Event Bus، Outbox، Broker، Queue یا Worker اضافه نشده است.                                                                                                                                                                   |
| تمرکز بر قراردادها              | فقط ساختار و استانداردهای رویدادی مستندسازی شده‌اند.                                                                                                                                                                             |
| عدم تکرار رویدادها              | رویدادها باید از یک منبع واحد و مرکزی برای دامنه‌ی فید تأمین شوند.                                                                                                                                                               |
| سازگاری با آینده                | ساختار پیشنهادی برای CQRS، Event Sourcing، Microservices و Outbox آماده است.                                                                                                                                                     |
| استفاده مجدد از ساختارهای موجود | الگوهای فعلی در [packages/rss/src/persistence/events/index.ts](packages/rss/src/persistence/events/index.ts) و [packages/rss/src/synchronization/events](packages/rss/src/synchronization/events) به‌عنوان پایه استفاده می‌شوند. |

## 18. Technical Debt

| مورد                          | توضیح                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------- |
| نام‌گذاری پراکنده رویدادها    | بسیاری از رویدادها با نام‌های محلی و غیر استاندارد تعریف شده‌اند.            |
| نبود envelope واحد            | عدم وجود envelope مشترک مانع استفاده‌ی یکپارچه در آینده می‌شود.              |
| نبود metadata مرکزی           | هر ماژول متادیتای خود را دارد.                                               |
| نبود versioning رسمی          | برنامه‌های مصرف‌کننده و تولیدکننده رویداد از نظر schema با هم سازگار نیستند. |
| وجود الگوهای مشابه ولی متفاوت | این موضوع احتمال تکرار و گم‌شدن قراردادها را افزایش می‌دهد.                  |

## 19. Risks

| ریسک                               | اثر                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| ادغام ناقص رویدادها                | ممکن است در آینده چند قرارداد موازی ایجاد شود.                                    |
| عدم تطابق با الگوهای آینده         | اگر envelope و metadata استاندارد نشوند، ادغام با Event Bus یا CQRS دشوار می‌شود. |
| استفاده از payload‌های غیر یکنواخت | مصرف‌کننده‌ها برای هر رویداد باید منطق جداگانه داشته باشند.                       |
| نبود failure contract              | خطاهای رویدادی به‌صورت ساختاریافته رصد نمی‌شوند.                                  |

## 20. Future Integration Points

| نقطه                             | توضیح                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Outbox Pattern                   | قراردادهای فعلی برای این مرحله آماده‌اند و نیاز به تغییر معماری اصلی ندارند. |
| Event Bus                        | envelope و metadata مرکزی برای اتصال به Event Bus آماده می‌شود.              |
| CQRS                             | رویدادهای دامنه برای read/write separation مناسب‌اند.                        |
| Event Sourcing                   | payload و versioning برای replay آینده مناسب‌اند.                            |
| Monitoring و Metrics             | رویدادهای استاندارد برای telemtry و observability قابل استفاده‌اند.          |
| Workers و Scheduler              | رویدادهای صف و زمان‌بندی می‌توانند به envelope مشترک تبدیل شوند.             |
| Multi-Tenant و Regional Policies | tenant/subscription metadata برای آینده آماده است.                           |

## 21. Recommendations for Prompt 7A.6

1. یک قرارداد مرکزی برای رویدادهای دامنه‌ی فید در سطح [packages/rss/src/lifecycle](packages/rss/src/lifecycle) تعریف شود.
2. رویدادهای موجود در [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts)، [packages/rss/src/import/service.ts](packages/rss/src/import/service.ts)، [packages/rss/src/synchronization/events](packages/rss/src/synchronization/events) و [packages/rss/src/persistence/events/index.ts](packages/rss/src/persistence/events/index.ts) به یک envelope واحد تبدیل شوند.
3. نسخه‌پذیری و compatibility policy برای هر رویداد در سطح مرکزی مستند و پیاده‌سازی شود.
4. یک failure contract استاندارد برای رویدادهای نامعتبر یا پشتیبانی‌نشده تعریف شود.
5. از قراردادهای جدید فقط برای contract و documentation استفاده شود و هیچ Event Bus، Outbox یا Broker در این مرحله پیاده‌سازی نگردد.

## خلاصه نهایی

در این مخزن، رویدادهای چرخه‌عمری فید وجود دارند اما به‌صورت پراکنده و بدون یک قرارداد مرکزی و استاندارد نگه‌داری می‌شوند. بهترین مسیر برای مرحله‌ی بعدی، ایجاد یک envelope واحد، یک metadata مرکزی، یک versioning policy و یک classification مرکزی برای رویدادهای دامنه‌ی فید است؛ این کار بدون تخریب معماری موجود و بدون پیاده‌سازی زیرساخت انتقال، امکان پذیر است.
