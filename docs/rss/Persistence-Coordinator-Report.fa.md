# گزارش پیاده‌سازی Persistence Coordinator و Transaction Management

## Executive Summary

این ماژول یک فریم‌ورک بازاستفاده‌پذیر برای هماهنگی پایدار و اتمی عملیات ذخیره‌سازی در لایه Application Infrastructure ارائه می‌دهد. هدف اصلی آن اجرای یک Import Plan بدون دخالت در منطق تصمیم‌گیری کسب‌وکار، حفظ نظم اجرای عملیات، مدیریت تراکنش، و فراهم‌سازی rollback قابل پیش‌بینی برای جلوگیری از حالت‌های نیمه‌کاره و ناسازگار است.

## Architecture

این لایه از سه مؤلفه اصلی تشکیل شده است:

1. Persistence Coordinator
   - اجرای یک Import Plan را به‌عنوان یک درخواست پایدار مدیریت می‌کند.
   - مراحل آماده‌سازی، اجرای repository، commit و rollback را بر عهده دارد.
   - از تصمیم‌گیری درباره اینکه چه چیزی باید ذخیره شود خودداری می‌کند.

2. Transaction Manager
   - یک abstraction سطح بالا برای شروع، commit و rollback تراکنش فراهم می‌کند.
   - از context و metadata برای propagation و ردیابی استفاده می‌کند.
   - به‌صورت مستقل از Prisma و سایر لایه‌های فنی عمل می‌کند.

3. Repository Coordinator
   - اجرای repositoryها را در یک order مشخص انجام می‌دهد.
   - failure را در اولین نقطه توقف می‌دهد تا از persistence ناتمام جلوگیری شود.
   - نتایج هر repository را جمع‌آوری و در قالب گزارش‌های typed بازمی‌گرداند.

## Responsibilities

- اجرای دقیق Import Plan بدون تغییر آن
- مدیریت تراکنش و جمع‌آوری metadata
- هماهنگی repositoryها بر اساس order مشخص
- تولید PersistenceResult با success flag، committed/updated/skipped/failed entities و آمار اجرا
- ارائه rollback deterministic با دلیل شکست و توصیه بازیابی
- انتشار رویدادهای چرخه حیات برای hook‌های آینده

## Folder Structure

- packages/rss/src/persistence/
  - coordinator/
  - transactions/
  - interfaces/
  - types/
  - errors/
  - events/
  - __tests__/

## File Tree

```text
packages/rss/src/persistence/
├── coordinator/
│   └── persistence-coordinator.ts
│   └── repository-coordinator.ts
├── transactions/
│   └── transaction-manager.ts
├── interfaces/
│   └── index.ts
├── types/
│   └── index.ts
├── errors/
│   └── index.ts
├── events/
│   └── index.ts
├── index.ts
└── __tests__/
    └── persistence-coordinator.test.ts
```

## Created Files

- packages/rss/src/persistence/index.ts
- packages/rss/src/persistence/coordinator/persistence-coordinator.ts
- packages/rss/src/persistence/coordinator/repository-coordinator.ts
- packages/rss/src/persistence/transactions/transaction-manager.ts
- packages/rss/src/persistence/interfaces/index.ts
- packages/rss/src/persistence/types/index.ts
- packages/rss/src/persistence/errors/index.ts
- packages/rss/src/persistence/events/index.ts
- packages/rss/src/persistence/__tests__/persistence-coordinator.test.ts
- docs/rss/Persistence-Coordinator-Report.fa.md

## Modified Files

- packages/rss/src/index.ts

## Public Exports

ماژول‌های عمومی قابل دسترسی عبارت‌اند از:

- PersistenceCoordinator
- RepositoryCoordinator
- TransactionManager
- انواع errors و error codes
- انواع events و lifecycle event model
- PersistenceRequest / PersistenceResult / RepositoryExecutionTarget / TransactionOptions

## Dependency Graph

```text
ImportPlan
  └── PersistenceCoordinator
        ├── TransactionManager
        ├── RepositoryCoordinator
        │     └── RepositoryExecutionTarget[]
        └── PersistenceResult / RollbackSummary
```

## Execution Flow

1. دریافت ImportPlan و repository targets
2. ایجاد TransactionContext
3. اجرای repositoryها با ترتیب مشخص
4. در صورت موفقیت، commit
5. در صورت شکست، rollback و بازگرداندن نتیجه با failure flag

## Transaction Lifecycle

- begin: ایجاد context و ثبت metadata
- execute: اجرای repositoryها در scope تراکنش
- commit: تکمیل و بسته شدن تراکنش
- rollback: بازگردانی وضعیت و ثبت دلیل شکست

## Repository Coordination Flow

- RepositoryCoordinator targets را بر اساس order مرتب می‌کند.
- هر repository با operation و transaction context فراخوانی می‌شود.
- در صورت خطای repository، چرخه متوقف و failure ثبت می‌شود.

## Rollback Strategy

Rollback در این لایه deterministic است؛ یعنی در هر شکست، یک RollbackSummary با:

- reason
- failed entity
- completed operations
- rolled back operations
- transaction metadata
- recovery recommendation

تولید می‌شود.

## Error Handling

سلسله مراتب خطا در این لایه شامل موارد زیر است:

- PersistenceCoordinatorError
- TransactionFailureError
- RollbackFailureError
- RepositoryExecutionError
- PersistenceConsistencyError
- ExecutionOrderError

هر خطا شامل code، stage، transactionId، entity، context و recovery recommendation است.

## Event Model

رویدادهای چرخه حیات عبارت‌اند از:

- persistence-started
- transaction-opened
- repository-executed
- entity-persisted
- commit-completed
- rollback-completed
- persistence-completed
- persistence-failed

این رویدادها صرفاً برای hook‌ها و آینده‌پذیری طراحی شده‌اند و هیچ Event Bus یا bus implementation ندارند.

## Performance Considerations

- order اجرای repositoryها از پیش قابل تنظیم است.
- transaction scope به‌صورت واحد و متمرکز نگه داشته شده است.
- اجرای repositoryها در یک مسیر خطی و بدون تکرار lookup انجام می‌شود.
- metadata و context با حداقل overhead propagated می‌شوند.

## Future Extensibility

این لایه برای آینده به‌صورت extensible طراحی شده است و می‌تواند برای موارد زیر گسترش یابد:

- Outbox Pattern
- Audit Trail
- Soft Delete
- Version History
- Domain Events
- Multi-tenant persistence
- Distributed transaction abstractions

## Remaining Work

- ادغام نهایی با ImportService موجود در لایه بالاتر
- استفاده از transaction abstraction واقعی Prisma در صورت فراهم بودن backend transaction provider
- افزودن hook‌های observability و tracing دقیق‌تر
- گسترش repository execution order بر اساس مدل‌های domain واقعی

## Important Implementation Notes

- این لایه هیچ‌گونه business validation یا duplicate detection انجام نمی‌دهد.
- منطق تصمیم‌گیری در ImportPlan می‌ماند و coordinator فقط آن را اجرا می‌کند.
- هیچ وابستگی مستقیم به parser، provider، HTTP یا workers وجود ندارد.
- رویدادها به‌صورت reusable interface و lifecycle event تعریف شده‌اند.
