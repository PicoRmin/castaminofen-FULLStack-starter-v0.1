# گزارش مدیر وضعیت خوراک و چک‌پوینت

## Executive Summary

این پیاده‌سازی یک چارچوب مدیریت وضعیت قابل استفاده مجدد برای هر خوراک فراهم می‌کند که مسئولیت‌های آن به‌طور دقیق محدود شده‌اند: ساخت، بازیابی، به‌روزرسانی، اعتبارسنجی و Snapshot‌گیری وضعیت‌های همگام‌سازی بدون انجام هرگونه عملیات شبکه، تحلیل XML، واردکردن داده یا برنامه‌ریزی. ما یک مدل قوی و تایپ‌شده برای وضعیت‌های همگام‌سازی، چک‌پوینت‌ها، ماشین حالت، اسنپ‌شات و خطاهای وضعیت معرفی کرده‌ایم که با الگوی State Pattern و اصول DDD سازگار است.

## Architecture

جریان اصلی به شکل زیر است:

1. درخواست همگام‌سازی از موتور همگام‌سازی دریافت می‌شود.
2. مدیر وضعیت خوراک، وضعیت فعلی را می‌سازد یا بازیابی می‌کند.
3. ماشین حالت، انتقال‌ها را تأیید می‌کند.
4. مدیر چک‌پوینت، چک‌پوینت‌های ایمن و تغییرناپذیر را ایجاد یا بازگردانی می‌کند.
5. اسنپ‌شات وضعیت برای آینده، ممیزی و ارزیابی وضعیت تولید می‌شود.
6. خطاهای وضعیت و هشدارها به‌صورت ساختارمند بازگردانده می‌شوند.

این ماژول فقط وضعیت را مدیریت می‌کند و هیچ‌کدام از مسئولیت‌های زیر را ندارد: HTTP، XML، واردکردن، برنامه‌ریزی، retry، worker و API.

## Responsibilities

- ایجاد وضعیت همگام‌سازی برای هر خوراک
- بازسازی وضعیت از حافظه یا ورودی‌های منتقل‌شده
- به‌روزرسانی وضعیت با انتقال‌های مجاز
- تولید و بازیابی چک‌پوینت
- ارزیابی پیشرفت و هشدارهای مربوط
- ساخت اسنپ‌شات وضعیت برای آینده
- ثبت خطاهای ساختارمند مربوط به انتقال و چک‌پوینت

## Folder Structure

- packages/rss/src/synchronization/state
- packages/rss/src/synchronization/checkpoints
- packages/rss/src/synchronization/state-machine
- packages/rss/src/synchronization/interfaces
- packages/rss/src/synchronization/types
- packages/rss/src/synchronization/errors
- packages/rss/src/synchronization/events
- packages/rss/tests

## File Tree

- packages/rss/src/synchronization/state/feed-state-manager.ts
- packages/rss/src/synchronization/checkpoints/feed-checkpoint-manager.ts
- packages/rss/src/synchronization/state-machine/feed-state-machine.ts
- packages/rss/src/synchronization/interfaces/feed-state.ts
- packages/rss/src/synchronization/types/feed-state.ts
- packages/rss/src/synchronization/errors/feed-state.ts
- packages/rss/src/synchronization/events/feed-state-events.ts
- packages/rss/tests/feed-state-manager.test.ts

## Created Files

- packages/rss/src/synchronization/state/feed-state-manager.ts
- packages/rss/src/synchronization/checkpoints/feed-checkpoint-manager.ts
- packages/rss/src/synchronization/state-machine/feed-state-machine.ts
- packages/rss/src/synchronization/interfaces/feed-state.ts
- packages/rss/src/synchronization/types/feed-state.ts
- packages/rss/src/synchronization/errors/feed-state.ts
- packages/rss/src/synchronization/events/feed-state-events.ts
- packages/rss/tests/feed-state-manager.test.ts

## Modified Files

- packages/rss/src/synchronization/index.ts
- packages/rss/src/synchronization/interfaces/index.ts
- packages/rss/src/synchronization/errors/index.ts
- packages/rss/src/synchronization/events/index.ts
- packages/rss/src/synchronization/types/index.ts

## Public Exports

اجزای عمومی قابل دسترسی از مسیر packages/rss/src/synchronization شامل موارد زیر هستند:

- FeedStateManager
- FeedCheckpointManager
- FeedStateMachine
- FeedSynchronizationState
- FeedCheckpoint
- FeedSynchronizationSnapshot
- FeedStateError
- InvalidStateTransitionError
- CheckpointNotFoundError
- CheckpointValidationError
- SnapshotCreationError
- StateVersionMismatchError
- StateConsistencyError

## Dependency Graph

```text
SynchronizationEngine
  └─ FeedStateManager
       ├─ FeedStateMachine
       ├─ FeedCheckpointManager
       └─ FeedStateLifecycleHooks (optional)
```

## State Lifecycle

وضعیت‌ها در این ماژول از نوع زیر پشتیبانی می‌شوند:

- NeverSynced
- Pending
- Preparing
- Running
- Persisting
- Completed
- Failed
- Cancelled
- Paused
- Outdated
- Unchanged

انتقال‌ها از طریق FeedStateMachine معتبر شده‌اند. هر انتقال نامعتبر یک خطای ساختارمند ایجاد می‌کند.

## Checkpoint Lifecycle

1. ایجاد چک‌پوینت بر اساس وضعیت فعلی
2. ذخیره‌سازی ایمن برای بازیابی آینده
3. بررسی تطابق نسخه، هش، cursor و metadata
4. باطل‌سازی در صورت لزوم
5. منقضی‌سازی بر اساس TTL و زمان فعلی
6. بازگردانی به وضعیت قبل در صورتی که یک چک‌پوینت با نسخه مطابقت داشته باشد

## Recovery Model

مدل بازیابی این ماژول به‌صورت زیر طراحی شده است:

- اگر وضعیت موجود نباشد، یک وضعیت جدید ساخته می‌شود.
- اگر چک‌پوینت وجود داشته باشد، به وضعیت مرتبط متصل می‌شود.
- اگر نسخه چک‌پوینت با وضعیت فعلی انطباق نداشته باشد، یک خطای نسخه‌تطبیق ایجاد می‌شود.
- اعتبارسنجی‌های ساختارمند از هویت خوراک، نسخه، زمان و چک‌پوینت اطمینان می‌دهند.

## Performance Notes

- ساخت و بازیابی وضعیت‌ها به‌صورت deterministically انجام می‌شود.
- چک‌پوینت‌های تغییرناپذیر و ایزوله هستند.
- اسنپ‌شات‌ها با ساختار ثابت و بدون سربار غیرضروری ساخته می‌شوند.
- داده‌های metadata به‌صورت Readonly نگه‌داری می‌شوند تا از تغییرات تصادفی جلوگیری شود.
- ساختار ماژول به‌گونه‌ای تنظیم شده که در آینده بدون تغییر در API اصلی، به storage‌های دوردست یا snapshot persistence گسترش یابد.

## Feed State Model

مدل وضعیت خوراک شامل موارد زیر است:

- شناسه وضعیت
- شناسه خوراک
- correlationId
- حالت فعلی و قبلی
- نسخه فعلی و قبلی
- زمان آخرین همگام‌سازی موفق
- زمان آخرین تلاش
- شمارش خطا و موفقیت
- مرجع چک‌پوینت
- metadata
- timestamp وضعیت
- history و failure/success history

## Checkpoint Model

مدل چک‌پوینت به‌صورت immutable طراحی شده و شامل موارد زیر است:

- شناسه چک‌پوینت
- شناسه خوراک
- نسخه و نسخه همگام‌سازی
- ETag
- Last-Modified
- Feed Hash
- شمارش اپیزودها
- شناسه آخرین اپیزود
- تاریخ انتشار آخرین اپیزود
- cursor
- snapshot hash
- metadata
- زمان ایجاد
- validity و invalidation/expiration metadata

## State Machine

ماشین حالت از انتقال‌های مجاز زیر استفاده می‌کند:

- NeverSynced -> Pending/Preparing
- Pending -> Preparing/Cancelled/Failed/Outdated/Unchanged
- Preparing -> Running/Cancelled/Failed
- Running -> Persisting/Paused/Failed/Cancelled/Outdated
- Persisting -> Completed/Failed/Cancelled/Unchanged
- Completed -> Unchanged/Outdated
- Failed -> Pending/Preparing
- Cancelled -> Pending
- Paused -> Running/Pending
- Outdated -> Pending/Preparing
- Unchanged -> Pending/Outdated

## Snapshot Model

اسنپ‌شات ایجادشده شامل موارد زیر است:

- وضعیت فعلی
- مرجع چک‌پوینت
- metadata
- آمار خلاصه
- هشدارها
- زمان ایجاد

## Versioning Strategy

- هر وضعیت دارای currentVersion است.
- هر چک‌پوینت در برچسب version و synchronizationVersion قرار دارد.
- نسخه‌ها در انتقال وضعیت و ساخت چک‌پوینت، به‌صورت صریح افزایش می‌یابند.
- این طراحی برای مهاجرت‌های آینده و نگهداری history آماده است.

## Failure Tracking

مدل خطا شامل موارد زیر است:

- شمارش خطاهای متوالی
- آخرین خطا
- دلیل خطا
- زمان خطا
- eligibility برای بازیابی
- history خطاها

## Performance Optimizations

- بازیابی وضعیت و چک‌پوینت به‌صورت مستقیم و بدون ساخت مجدد غیرضروری انجام می‌شود.
- داده‌ها تمیز و immutable نگه‌داری می‌شوند.
- هشدارها به‌صورت lazy و بر اساس وضعیت/چک‌پوینت حاصل می‌شوند.
- اسنپ‌شات‌ها بدون ایجاد محاسبات اضافی ساخته می‌شوند.

## Extensibility Roadmap

در آینده این ماژول می‌تواند به موارد زیر گسترش یابد:

- ذخیره‌سازی چک‌پوینت در remote storage
- snapshot persistence
- audit history
- replication و multi-region state sync
- checkpoint encryption
- migration روی نسخه‌های مختلف وضعیت

## Remaining Work

- ادغام مستقیم با لایه‌های ذخیره‌سازی پایگاه‌داده در صورت نیاز به persistence real
- افزودن تاریخچه بلندمدت برای state history
- اضافه‌کردن hook‌های بیشتر برای بازرسی و observability
- پیاده‌سازی سازگاری با storage‌های دوردست در صورت نیاز به distributed checkpoints
