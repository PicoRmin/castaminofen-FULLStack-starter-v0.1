# وضعیت Prompt 6A

## فایل‌های ایجادشده

- [packages/rss/src/synchronization/core/synchronization-engine.ts](packages/rss/src/synchronization/core/synchronization-engine.ts)
- [packages/rss/src/synchronization/locking/feed-lock-manager.ts](packages/rss/src/synchronization/locking/feed-lock-manager.ts)
- [packages/rss/src/synchronization/concurrency/feed-concurrency-controller.ts](packages/rss/src/synchronization/concurrency/feed-concurrency-controller.ts)
- [packages/rss/src/synchronization/leases/feed-lease-manager.ts](packages/rss/src/synchronization/leases/feed-lease-manager.ts)
- [packages/rss/src/persistence/coordinator/persistence-coordinator.ts](packages/rss/src/persistence/coordinator/persistence-coordinator.ts)
- [packages/rss/src/import/service.ts](packages/rss/src/import/service.ts)
- [packages/rss/src/providers/generic/index.ts](packages/rss/src/providers/generic/index.ts)
- [apps/api/src/modules/feeds/feeds.controller.ts](apps/api/src/modules/feeds/feeds.controller.ts)
- [apps/api/src/modules/feeds/feeds-synchronization.service.ts](apps/api/src/modules/feeds/feeds-synchronization.service.ts)

## فایل‌های تغییرکرده

- [packages/rss/src/index.ts](packages/rss/src/index.ts)
- [packages/rss/src/synchronization/index.ts](packages/rss/src/synchronization/index.ts)
- [apps/api/src/modules/feeds/feeds.module.ts](apps/api/src/modules/feeds/feeds.module.ts)
- [apps/api/src/app.module.ts](apps/api/src/app.module.ts)
- [apps/api/src/modules/feeds/dto/sync-feed.dto.ts](apps/api/src/modules/feeds/dto/sync-feed.dto.ts)

## کلاس‌ها و سرویس‌های جدید

- SynchronizationEngine
- FeedLockManager
- FeedConcurrencyController
- FeedLeaseManager
- FeedStateManager
- FeedCheckpointManager
- ImportService
- PersistenceCoordinator
- GenericProvider
- FeedsSynchronizationService

## کارهای تکمیل‌شده

- ساختار اولیه RSS engine و لایه‌های parser/provider/import/sync
- پیاده‌سازی موتور همگام‌سازی، قفل‌کردن، concurrency و recovery
- پیاده‌سازی persistence coordinator و import validation/deduplication
- ایجاد API پایه برای ثبت و همگام‌سازی feedها
- تکمیل validation برای DTO sync request

## کارهای باقی‌مانده

- اتصال نهایی به repositoryهای واقعی Prisma در سطح production
- یکپارچه‌سازی کامل background worker/scheduler برای sync خودکار
- تقویت lock/lease در محیط توزیع‌شده و multi-tenant
- اضافه‌کردن تست‌های end-to-end و سناریوهای خطای واقعی بیشتر
- تکمیل observability و audit trail برای محیط production

## وابستگی‌ها

- بسته RSS در [packages/rss](packages/rss)
- ماژول‌های NestJS در [apps/api/src/modules/feeds](apps/api/src/modules/feeds)
- Prisma schema و PrismaService
- class-validator و class-transformer

## تصمیم‌های معماری

- لایه‌بندی مشخص و مجزا برای parser/provider/import/synchronization/persistence حفظ شد.
- API فقط orchestrator و DTO را مدیریت می‌کند و از تکرار controller/service پرهیز شده است.
- برای Prompt 6A تمرکز بر پیاده‌سازی پایه‌ی قابل‌استفاده بوده است.
