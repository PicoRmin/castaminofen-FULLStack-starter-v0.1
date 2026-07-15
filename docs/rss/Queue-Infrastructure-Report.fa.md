# گزارش زیرساخت صف (Queue Infrastructure)

## خلاصه اجرایی
این ماژول زیرساختی برای صف‌کاری در بسته RSS پیاده‌سازی شده است تا منطق کسب‌وکار مستقیماً به BullMQ وابسته نباشد. در این طراحی، قراردادهای انتزاعی، فکتوری، رجیستری، سازنده کارها، serializer و adapter برای BullMQ فراهم شده‌اند تا در آینده امکان جایگزینی با بسترهای دیگری مثل RabbitMQ، Kafka یا SQS بدون تغییر منطق کسب‌وکار وجود داشته باشد.

## معماری
- لایه REST/API: درخواست‌های کاربردی به سرویس‌های سطح برنامه ارسال می‌شوند.
- لایه برنامه: با واسطه Queue Interface کار می‌کند.
- لایه adapter: BullMQ Adapter وظیفه ترجمه قراردادهای انتزاعی به عملیات واقعی را بر عهده دارد.
- لایه داده/Redis: جایگاه فنی برای نگهداری و هماهنگی صف‌ها.

## ساختار پوشه
- packages/rss/src/queue/adapters
- packages/rss/src/queue/builders
- packages/rss/src/queue/configuration
- packages/rss/src/queue/contracts
- packages/rss/src/queue/errors
- packages/rss/src/queue/events
- packages/rss/src/queue/factory
- packages/rss/src/queue/interfaces
- packages/rss/src/queue/registry
- packages/rss/src/queue/serializers
- packages/rss/src/queue/types

## مدل صف
- پشتیبانی از Queue Definitions برای صف‌های import، synchronization، retry، recovery، validation، maintenance، health-evaluation و metrics-collection.
- هر job با شناسه، correlationId، feedId، اولویت، نام صف، payload، metadata، زمان ساخت، retry policy، timeout و نسخه مدل‌سازی شده است.

## چرخه حیات Job
- created → queued → waiting → delayed → running → completed/failed/retrying/cancelled/expired/dead-letter

## معماری Adapter
- QueueAdapter یک قرارداد انتزاعی است.
- BullMqQueueAdapter تنها لایه‌ای است که به BullMQ/Redis وابسته می‌شود.
- منطق کسب‌وکار فقط با Queue Interface و Contracts کار می‌کند.

## گراف وابستگی
- Business Logic → Queue Interface/Contracts
- Queue Factory → Queue Registry → Queue Definitions
- BullMQ Adapter → Queue Adapter Contract
- Serializer → Job Payloads

## فایل‌های ایجادشده
- packages/rss/src/queue/index.ts
- packages/rss/src/queue/adapters/bullmq-adapter.ts
- packages/rss/src/queue/builders/queue-job-builder.ts
- packages/rss/src/queue/configuration/queue-configuration.ts
- packages/rss/src/queue/contracts/queue-job-contract.ts
- packages/rss/src/queue/errors/queue-errors.ts
- packages/rss/src/queue/events/queue-lifecycle-events.ts
- packages/rss/src/queue/factory/queue-factory.ts
- packages/rss/src/queue/interfaces/queue-adapter.ts
- packages/rss/src/queue/registry/queue-registry.ts
- packages/rss/src/queue/serializers/json-payload-serializer.ts
- packages/rss/src/queue/serializers/payload-serializer.ts
- packages/rss/src/queue/types/queue-definition.ts
- packages/rss/src/queue/types/queue-types.ts
- packages/rss/src/queue/__tests__/queue-infrastructure.test.ts

## فایل‌های اصلاح‌شده
- packages/rss/src/index.ts
- packages/rss/package.json

## صادرات عمومی
- Queue abstractions از مسیر packages/rss/src/queue/index.ts قابل دسترسی هستند.
- همچنین از مسیر اصلی packages/rss/src/index.ts نیز در دسترس قرار گرفته‌اند.

## نکات عملکرد
- کش شدن Queue Definition در QueueFactory
- جلوگیری از ساخت دوباره صف‌ها
- serializer با نسخه‌پذیری و حالت سازگاری طراحی شده است
- Immutable envelopes برای جلوگیری از تغییرات ناخواسته

## نقشه راه آینده
- افزودن adapterهای واقعی BullMQ با اتصال به Redis
- افزودن worker layer و job execution engine
- افزودن schema validation دقیق‌تر برای payload و metadata
- توسعه registry برای queueهای سفارشی

## کارهای باقیمانده
- اتصال واقعی به BullMQ و Redis
- پیاده‌سازی workerها و مدیریت اجرای job
- ادغام با سرویس‌های موجود import/synchronization/recovery
