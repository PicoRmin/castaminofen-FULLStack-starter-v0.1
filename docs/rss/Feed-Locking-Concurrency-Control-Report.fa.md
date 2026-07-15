# گزارش پیاده‌سازی: Feed Locking & Concurrency Control

## Executive Summary

این ماژول یک چارچوب قابل استفاده مجدد برای مدیریت قفل‌های فید و کنترل هم‌زمانی در لایه Synchronization Infrastructure فراهم می‌کند. هدف آن فقط اعطای حقوق اجرای عملیات‌های همگام‌سازی است و نه انجام خودِ همگام‌سازی، ذخیره‌سازی یا شبکه. این ماژول از مدل‌های immutable، چرخه‌حیات روشن، استراتژی‌های قابل پیکربندی، و hookهای مشاهده‌پذیری برای جلوگیری از اجرای هم‌زمان ناامن استفاده می‌کند.

## Architecture

در این معماری، هر درخواست همگام‌سازی از طریق یک کنترل‌کننده هم‌زمانی بررسی می‌شود و سپس در سطح قفل و اجاره (lease) معتبر می‌شود. اجزای اصلی عبارت‌اند از:

- Synchronization Request
- Concurrency Controller
- Lock Manager
- Lease Manager
- Observability Hooks

این اجزا هرکدام فقط یک مسئولیت مشخص دارند و از یکدیگر مستقل‌اند.

## Responsibilities

- Acquire Lock: اخذ قفل برای یک feed
- Validate Lock Ownership: بررسی مالکیت قفل
- Renew Lease: تمدید اجاره قفل
- Release Lock: آزادسازی قفل
- Expire Lock: منقضی‌کردن قفل بر اساس زمان
- Detect Concurrency Conflict: شناسایی تعارض و هم‌زمانی غیرمجاز
- Generate Lock Metadata: ساخت متادیتا و تاریخچه‌ی انتقال‌ها

## Folder Structure

- packages/rss/src/synchronization/locking
- packages/rss/src/synchronization/concurrency
- packages/rss/src/synchronization/leases
- packages/rss/src/synchronization/interfaces
- packages/rss/src/synchronization/types
- packages/rss/src/synchronization/errors
- packages/rss/src/synchronization/events
- packages/rss/src/synchronization/**tests**

## File Tree

```text
packages/rss/src/synchronization/
  locking/
    feed-lock-manager.ts
  concurrency/
    feed-concurrency-controller.ts
  leases/
    feed-lease-manager.ts
  interfaces/
    locking.ts
  types/
    locking.ts
  errors/
    locking.ts
  events/
    locking.ts
  __tests__/
    feed-locking.test.ts
```

## Created Files

- packages/rss/src/synchronization/locking/feed-lock-manager.ts
- packages/rss/src/synchronization/concurrency/feed-concurrency-controller.ts
- packages/rss/src/synchronization/leases/feed-lease-manager.ts
- packages/rss/src/synchronization/interfaces/locking.ts
- packages/rss/src/synchronization/types/locking.ts
- packages/rss/src/synchronization/errors/locking.ts
- packages/rss/src/synchronization/events/locking.ts
- packages/rss/src/synchronization/**tests**/feed-locking.test.ts
- docs/rss/Feed-Locking-Concurrency-Control-Report.fa.md

## Modified Files

- packages/rss/src/synchronization/index.ts
- packages/rss/src/synchronization/interfaces/index.ts
- packages/rss/src/synchronization/types/index.ts
- packages/rss/src/synchronization/errors/index.ts
- packages/rss/src/synchronization/events/index.ts

## Public Exports

ماژول از طریق barrelهای زیر در دسترس است:

- packages/rss/src/synchronization/index.ts
- packages/rss/src/index.ts

و کلاس‌های عمومی شامل این‌ها هستند:

- FeedLockManager
- FeedConcurrencyController
- FeedLeaseManager
- FeedLockingError
- FeedLockLifecycleHooks

## Dependency Graph

```text
FeedLockManager
  -> FeedLock (immutable model)
  -> FeedLockPolicy
  -> FeedLockTransitionRecord

FeedLeaseManager
  -> FeedLease
  -> FeedLeaseRequest / FeedLeaseValidationRequest

FeedConcurrencyController
  -> FeedLockManagerLike
  -> FeedLeaseManagerLike
  -> FeedLockLifecycleHooks

Synchronization Barrel
  -> locking / concurrency / leases / types / interfaces / errors / events
```

## Lock Model

قفل‌ها با نوع FeedLock تعریف می‌شوند و شامل موارد زیر هستند:

- id
- feedId
- ownerId
- correlationId
- createdAt
- expiresAt
- leaseId
- version
- state
- strategy
- metadata
- history
- lastUpdatedAt

تمامی مدل‌ها immutable هستند و تاریخچه‌ی انتقال‌ها نیز در خود قفل نگهداری می‌شود.

## Lease Model

Leaseها مستقل از منطق همگام‌سازی تعریف می‌شوند و شامل موارد زیر هستند:

- id
- owner
- startTime
- expiration
- renewalCount
- version
- metadata
- lockId
- state

## Lock Lifecycle

حالت‌های پشتیبانی‌شده برای قفل عبارت‌اند از:

- Available
- Pending
- Acquired
- Renewing
- Expired
- Released
- Failed
- Cancelled

رویدادهای چرخه‌ی عمر شامل:

- acquire
- renew
- release
- expire
- recover
- invalidate

## Concurrency Strategies

استراتژی‌های پشتیبانی‌شده در این نسخه شامل موارد زیر هستند:

- single-feed
- global
- read
- write
- optimistic
- pessimistic
- custom

این طراحی به‌گونه‌ای است که بدون بازطراحی، استراتژی‌های جدید اضافه شوند.

## Conflict Detection

این ماژول تعارضات زیر را به‌صورت ساختارمند بازمی‌گرداند:

- lock-state-invalid
- ownership-conflict
- lock-missing
- feed-mismatch
- lease-expired
- lease-mismatch

## Performance Optimizations

برای کاهش هزینه‌ی اجرای مکرر و بهینه‌سازی عملکرد:

- استفاده از Map برای lookup سریع قفل و lease
- جلوگیری از ایجاد دوباره‌ی اشیاء غیرضروری
- استفاده از Object.freeze برای مدل‌های immutable
- نگه‌داری متادیتا به‌صورت read-only
- جلوگیری از عملیات تکراری در اعتبارسنجی مالکیت و اجاره

## Security Considerations

- مالکیت قفل همیشه با ownerId بررسی می‌شود.
- feedId در جریان authorizeExecution با قفل تطبیق داده می‌شود.
- lease owner با identity درخواست‌کننده مقایسه می‌شود.
- metadata از خارج قابل اعتماد نیست و فقط به‌صورت read-only نگهداری می‌شود.
- هر خطا با اطلاعات code، stage، lockId، feedId و recovery ارائه می‌شود.

## Extensibility Roadmap

پیش‌نویس‌های آینده برای گسترش این ماژول:

- ادغام با distributed lock backends مثل Redis / etcd / ZooKeeper
- پشتیبانی از database advisory lock
- افزودن recovery persistence layer
- افزودن policy manager برای استراتژی‌های پیچیده‌تر
- اضافه‌کردن hookهای متمرکزتر برای tracing و tracing-based observability

## Remaining Work

- ادغام با persistence layer واقعی برای نگه‌داری قفل‌ها در سطح پایدار
- افزودن یک Store یا Repository برای lock history و lease history
- گسترش تست‌های پوشش‌دهی برای expired/steal/conflict scenarios
- اتصال به موتور همگام‌سازی واقعی از طریق یک thin adapter
