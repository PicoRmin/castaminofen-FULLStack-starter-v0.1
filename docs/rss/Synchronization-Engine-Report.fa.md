# گزارش اجرای Synchronization Engine

## Executive Summary
در این اجرای اولیه، یک لایه کاربردی بازاستفاده‌پذیر برای Synchronization Engine در بسته RSS اضافه شد که بدون دسترسی مستقیم به HTTP، XML Parser یا Worker، وظیفه هماهنگی فرآیند همگام‌سازی فید پادکست با Import Service و Persistence Coordinator را بر عهده دارد. این موتور بر اساس Request/Result typed، State Machine روشن، استراتژی‌های قابل‌گسترش، و خطا/هشدار ساختاریافته طراحی شده تا در آینده برای سینک‌های full، incremental، preview و validation قابل توسعه باشد.

## Architecture
موتور در لایه Application Service قرار گرفته و با اجزای موجود از طریق interfaceهای انتزاعی همکاری می‌کند:
- Synchronization Engine: نقطه ورود اصلی و هماهنگ‌کننده
- Import Service: مسئول اجرای import و تولید خروجی‌های import result
- State Store: نگه‌داری وضعیت قبلی و fingerprint
- Persistence Coordinator: هماهنگ‌سازی persist در صورت نیاز
- Strategies: انتخاب رفتار و تصمیم‌گیری برای نوع همگام‌سازی
- Events: hookهای lifecycle برای وقایع شروع/پیشرفت/کامل/شکست/رد

## Responsibilities
- اعتبارسنجی درخواست همگام‌سازی
- بارگذاری state قبلی
- انتخاب استراتژی مناسب
- اجرای import از طریق Import Service
- تولید report و warnings/errors ساختاریافته
- بازگرداندن نتیجه‌ی deterministic برای همگام‌سازی‌های تکراری

## Folder Structure
- packages/rss/src/synchronization/core
- packages/rss/src/synchronization/errors
- packages/rss/src/synchronization/events
- packages/rss/src/synchronization/interfaces
- packages/rss/src/synchronization/strategies
- packages/rss/src/synchronization/types

## File Tree
- packages/rss/src/synchronization/index.ts
- packages/rss/src/synchronization/core/index.ts
- packages/rss/src/synchronization/core/synchronization-engine.ts
- packages/rss/src/synchronization/errors/index.ts
- packages/rss/src/synchronization/events/index.ts
- packages/rss/src/synchronization/interfaces/index.ts
- packages/rss/src/synchronization/strategies/index.ts
- packages/rss/src/synchronization/types/index.ts

## Created Files
- packages/rss/src/synchronization/index.ts
- packages/rss/src/synchronization/core/index.ts
- packages/rss/src/synchronization/core/synchronization-engine.ts
- packages/rss/src/synchronization/errors/index.ts
- packages/rss/src/synchronization/events/index.ts
- packages/rss/src/synchronization/interfaces/index.ts
- packages/rss/src/synchronization/strategies/index.ts
- packages/rss/src/synchronization/types/index.ts
- packages/rss/tests/synchronization.test.ts
- docs/rss/Synchronization-Engine-Report.fa.md

## Modified Files
- packages/rss/src/index.ts

## Public Exports
- SynchronizationEngine
- SynchronizationError
- SynchronizationStateError
- SynchronizationConflictError
- SynchronizationTimeoutError
- SynchronizationCancelledError
- SynchronizationStrategyError
- SynchronizationLifecycleHooks
- SynchronizationStrategy
- DefaultSynchronizationStrategyRegistry
- SynchronizationRequest / SynchronizationResult / SynchronizationStateModel

## Dependency Graph
- SynchronizationEngine -> ImportService (via interface)
- SynchronizationEngine -> StateStore (via interface)
- SynchronizationEngine -> PersistenceCoordinator (optional)
- SynchronizationEngine -> Strategies (strategy selection)
- SynchronizationEngine -> Events Hooks (lifecycle integration)

## Synchronization Lifecycle
- Pending
- Starting
- Downloading
- Importing
- Persisting
- Completed / Failed / Cancelled / Unchanged

## State Machine
- never-synchronized -> starting -> importing -> completed
- never-synchronized -> starting -> failed
- never-synchronized -> starting -> cancelled
- completed -> unchanged (for repeat sync with no changes)

## Synchronization Strategies
- FullSynchronizationStrategy
- IncrementalSynchronizationStrategy
- MetadataSynchronizationStrategy
- EpisodeSynchronizationStrategy
- PreviewSynchronizationStrategy
- ValidationSynchronizationStrategy

## Conflict Handling
- Konflیک‌های ساختاریافته با نوع SynchronizationConflict در خروجی موتور بازگردانده می‌شوند.
- خطاهای خاص مثل SynchronizationConflictError و SynchronizationStateError برای وضعیت‌های غیرمنتظره استفاده می‌شوند.

## Performance Notes
- از بارگذاری state و انتخاب استراتژی به‌صورت deterministic استفاده شده است.
- برای همگام‌سازی‌های تکراری، در صورت نبود تغییر، خروجی unchanged صادر می‌شود تا از import تکراری جلوگیری شود.
- استراتژی‌های سبک و بدون وابستگی مستقیم به شبکه یا parser پیاده‌سازی شده‌اند.

## Future Roadmap
- افزودن استراتژی‌های بیشتر مانند selective sync و tenant-aware sync
- اتصال به persistence plan واقعی و repository layer عمیق‌تر
- افزودن hookهای richer برای audit trail و checkpoint recovery
- گسترش Conflict Detection به metadata/category/author/version

## Known Limitations
- این نسخه از موتور هنوز از Import Service با interfaceهای ساده‌ی موجود استفاده می‌کند و به‌صورت کامل با repository layer واقعی ادغام نشده است.
- State persistence در این نسخه به‌صورت store interface و state model اولیه پیاده‌سازی شده است.
- Conflict detection در سطح اولیه و ساختاریافته است.

## Remaining Work
- اتصال نهایی به Persistence Coordinator با plan واقعی
- پیاده‌سازی state transition history دقیق‌تر
- افزودن تست‌های بیشتر برای full/incremental/conflict paths
- ادغام با استراتژی‌های domain-specific در آینده
