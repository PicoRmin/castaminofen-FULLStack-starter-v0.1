# گزارش موتور همگام‌سازی افزایشی

## Executive Summary

این مستند، پیاده‌سازی موتور همگام‌سازی افزایشی را در بسته RSS خلاصه می‌کند. موتور جدید بر پایه‌ی لایه‌های موجود state، checkpoint، comparison و import طراحی شده و از درخواست‌های شرطی برای جلوگیری از بار اضافی روی شبکه و دیتابیس استفاده می‌کند.

## Architecture

موتور افزایشی از یک جریان ساده و قابل بازاستفاده پیروی می‌کند:

1. بارگذاری state و checkpoint مربوط به فید
2. ارسال درخواست شرطی با If-None-Match/If-Modified-Since
3. اجرای ComparisonEngine و DiffEngine برای شناسایی تغییرات
4. ساخت ImportPlan حداقلی و اجرای ImportService/PersistenceCoordinator
5. به‌روزرسانی checkpoint پس از persistence موفق

## Responsibilities

- بارگذاری state و checkpoint
- استفاده از درخواست‌های شرطی برای شناسایی تغییرات
- تولید Difference و ImportPlan حداقلی
- جلوگیری از اجرای import/persistence در حالت بدون تغییر
- انتشار رویدادهای چرخه‌ی حیات بدون پیاده‌سازی logging

## Folder Structure

- packages/rss/src/synchronization/comparison
- packages/rss/src/synchronization/diff
- packages/rss/src/synchronization/errors
- packages/rss/src/synchronization/events
- packages/rss/src/synchronization/interfaces
- packages/rss/src/synchronization/incremental
- packages/rss/src/synchronization/types

## File Tree

- packages/rss/src/synchronization/comparison/index.ts
- packages/rss/src/synchronization/comparison/strategies.ts
- packages/rss/src/synchronization/diff/index.ts
- packages/rss/src/synchronization/errors/incremental.ts
- packages/rss/src/synchronization/events/incremental.ts
- packages/rss/src/synchronization/interfaces/incremental.ts
- packages/rss/src/synchronization/incremental/index.ts
- packages/rss/src/synchronization/types/incremental.ts
- packages/rss/tests/incremental-synchronization.test.ts

## Created Files

- packages/rss/src/synchronization/comparison/index.ts
- packages/rss/src/synchronization/comparison/strategies.ts
- packages/rss/src/synchronization/diff/index.ts
- packages/rss/src/synchronization/errors/incremental.ts
- packages/rss/src/synchronization/events/incremental.ts
- packages/rss/src/synchronization/interfaces/incremental.ts
- packages/rss/src/synchronization/incremental/index.ts
- packages/rss/src/synchronization/types/incremental.ts
- packages/rss/tests/incremental-synchronization.test.ts
- docs/rss/Incremental-Synchronization-Engine-Report.fa.md

## Modified Files

- packages/rss/src/synchronization/index.ts

## Public Exports

توسعه‌ی بعدی می‌تواند از این مسیرها استفاده کند:

- IncrementalSynchronizationEngine
- ComparisonEngine
- DifferenceEngine
- DiffEngine
- ComparisonDifference
- IncrementalImportPlan

## Dependency Graph

- IncrementalSynchronizationEngine -> FeedStateManager
- IncrementalSynchronizationEngine -> FeedCheckpointManager
- IncrementalSynchronizationEngine -> ComparisonEngine
- IncrementalSynchronizationEngine -> DiffEngine
- IncrementalSynchronizationEngine -> ImportService/PersistenceCoordinator

## Execution Flow

1. درخواست همگام‌سازی افزایشی دریافت می‌شود
2. state و checkpoint بازیابی می‌شوند
3. دانلود شرطی با هدرهای If-None-Match/If-Modified-Since انجام می‌شود
4. در صورت 304، نتیجه‌ی unchanged بازگردانده می‌شود
5. در غیر این صورت، ComparisonEngine تفاوت‌ها را شناسایی می‌کند
6. DiffEngine یک ImportPlan حداقلی می‌سازد
7. ImportService و PersistenceCoordinator در صورت نیاز فراخوانی می‌شوند

## Differential Synchronization Flow

- ComparisonEngine بین snapshot قبلی و snapshot فعلی تفاوت‌های ساختاری و متادیتا را می‌سازد
- DiffEngine این اختلافات را به عملیات import تبدیل می‌کند
- عملیات فقط برای entity‌های تغییرکرده تولید می‌شود و unchangedها حذف می‌شوند

## Checkpoint Usage

- checkpoint قبلی برای ارسال درخواست‌های شرطی استفاده می‌شود
- اعتبارسنجی ساده‌ی feedId/version انجام می‌شود
- در صورت نبود checkpoint یا mismatch، جریان با خطای مناسب متوقف می‌شود

## Performance Optimizations

- استفاده از درخواست‌های شرطی برای جلوگیری از دانلود و پردازش بی‌فایده
- تولید ImportPlan حداقلی و پرهیز از import کامل
- عدم اجرای persistence در حالت unchanged
- استفاده از comparison و diff به‌جای کپی‌برداری‌های سنگین از منطق موجود

## Future Roadmap

- ادغام با providerهای واقعی با پشتیبانی conditional requests
- افزودن استراتژی‌های comparison پیشرفته‌تر مثل bloom filter و semantic diff
- استفاده از snapshot hash و episode hash برای تشخیص دقیق‌تر
- معرفی hook‌های observability و tracing بیشتر

## Remaining Work

- اتصال به providerهای واقعی و HTTP download layer موجود
- تکمیل branch‌های import plan بر اساس snapshot‌های episode و metadata واقعی
- افزودن تست‌های بیشتر برای changed/removed/metadata-update cases
