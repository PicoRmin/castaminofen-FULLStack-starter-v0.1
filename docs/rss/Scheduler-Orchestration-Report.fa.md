# گزارش اجرای پلتفرم زمان‌بندی RSS

## Executive Summary
پلتفرم زمان‌بندی در این نسخه به‌صورت لایه‌ای و مستقل از منطق کسب‌وکار پیاده‌سازی شد. این ماژول تنها مسئول ساخت رویدادهای زمان‌بندی، ارزیابی سیاست‌ها، ایجاد متناظر با Queue Interface و ارسال ترIGGER به Runtime است. اجرای کارهای کسب‌وکار در این لایه انجام نمی‌شود و هیچ وابستگی مستقیم به BullMQ، Worker، Prisma یا منطق کسب‌وکار وجود ندارد.

## Architecture
ساختار این ماژول بر اساس اصول Clean Architecture و Strategy Pattern طراحی شده است:

- Scheduler Runtime: هسته‌ی اجرای زمان‌بندی
- Trigger Engine: مدیریت رویدادهای زمان‌بندی
- Scheduling Policy Engine: ارزیابی سیاست‌های زمان‌بندی
- Scheduler Registry: ثبت و بازیابی triggerها
- Scheduler Factory: ساخت policyها و triggerها
- Queue Integration: استفاده از Queue Adapter به‌جای وابستگی مستقیم به BullMQ
- Telemetry Integration: انتشار رویدادهای چرخه‌ی حیات برای پایش

## Responsibilities
- ایجاد triggerهای Manual, Cron, One-Time, Recurring و Interval
- ارزیابی سیاست‌های Fixed Interval و Exponential Backoff
- ساخت immutable SchedulerContext
- انتشار رویدادهای lifecycle مانند TriggerCreated و TriggerDispatched
- انتقال رویداد به Queue Adapter با استفاده از قراردادهای موجود

## Folder Structure
- packages/rss/src/scheduler
- packages/rss/src/scheduler/contracts
- packages/rss/src/scheduler/context
- packages/rss/src/scheduler/errors
- packages/rss/src/scheduler/events
- packages/rss/src/scheduler/policies
- packages/rss/src/scheduler/runtime
- packages/rss/src/scheduler/triggers
- packages/rss/src/scheduler/builders
- packages/rss/src/scheduler/types

## File Tree
- packages/rss/src/scheduler/index.ts
- packages/rss/src/scheduler/contracts/scheduling-policy-contract.ts
- packages/rss/src/scheduler/contracts/scheduler-trigger-contract.ts
- packages/rss/src/scheduler/context/scheduler-context.ts
- packages/rss/src/scheduler/errors/scheduler-errors.ts
- packages/rss/src/scheduler/events/scheduler-events.ts
- packages/rss/src/scheduler/policies/scheduling-policies.ts
- packages/rss/src/scheduler/runtime/scheduler-runtime.ts
- packages/rss/src/scheduler/runtime/scheduler-registry.ts
- packages/rss/src/scheduler/runtime/scheduler-factory.ts
- packages/rss/src/scheduler/triggers/base-trigger.ts
- packages/rss/src/scheduler/triggers/manual-trigger.ts
- packages/rss/src/scheduler/triggers/cron-trigger.ts
- packages/rss/src/scheduler/triggers/one-time-trigger.ts
- packages/rss/src/scheduler/triggers/recurring-trigger.ts
- packages/rss/src/scheduler/triggers/interval-trigger.ts
- packages/rss/src/scheduler/builders/trigger-builders.ts
- packages/rss/src/scheduler/types/index.ts
- packages/rss/src/scheduler/__tests__/scheduler.test.ts

## Created Files
- packages/rss/src/scheduler/contracts/scheduling-policy-contract.ts
- packages/rss/src/scheduler/contracts/scheduler-trigger-contract.ts
- packages/rss/src/scheduler/context/scheduler-context.ts
- packages/rss/src/scheduler/errors/scheduler-errors.ts
- packages/rss/src/scheduler/events/scheduler-events.ts
- packages/rss/src/scheduler/policies/scheduling-policies.ts
- packages/rss/src/scheduler/runtime/scheduler-runtime.ts
- packages/rss/src/scheduler/runtime/scheduler-registry.ts
- packages/rss/src/scheduler/runtime/scheduler-factory.ts
- packages/rss/src/scheduler/triggers/base-trigger.ts
- packages/rss/src/scheduler/triggers/manual-trigger.ts
- packages/rss/src/scheduler/triggers/cron-trigger.ts
- packages/rss/src/scheduler/triggers/one-time-trigger.ts
- packages/rss/src/scheduler/triggers/recurring-trigger.ts
- packages/rss/src/scheduler/triggers/interval-trigger.ts
- packages/rss/src/scheduler/builders/trigger-builders.ts
- packages/rss/src/scheduler/types/index.ts
- packages/rss/src/scheduler/__tests__/scheduler.test.ts

## Modified Files
- packages/rss/src/scheduler/index.ts
- packages/rss/package.json

## Public Exports
ماژول از طریق فایل اصلی زیر در دسترس است:
- packages/rss/src/scheduler/index.ts

و exportهای کلیدی شامل:
- SchedulerRuntime
- SchedulerRegistry
- SchedulerFactory
- ManualTrigger
- CronTrigger
- OneTimeTrigger
- RecurringTrigger
- IntervalTrigger
- FixedIntervalPolicy
- CronExpressionPolicy
- AdaptiveSchedulingPolicy
- ExponentialBackoffPolicy
- PrioritySchedulingPolicy
- SchedulerContextFactory
- SchedulerError و زیر کلاس‌های آن

## Scheduler Runtime
Runtime فعلی بر اساس این اصول طراحی شده است:
- ثبت Scheduler و Trigger
- ارزیابی triggerها
- dispatch بر اساس Queue Adapter
- انتشار رویدادهای lifecycle
- نگه‌داشتن سیاست‌های پیش‌فرض برای پشتیبانی از triggerهای اولیه

## Trigger Engine
موتور trigger از کلاس پایه BaseTrigger و triggerهای خاص پشتیبانی می‌کند. این لایه به‌صورت extensible طراحی شده و امکان افزودن triggerهای سفارشی در آینده بدون تغییر طراحی کلی وجود دارد.

## Scheduling Policies
سیاست‌های پشتیبانی‌شده در این نسخه:
- Fixed Interval
- Cron Expression
- Adaptive Scheduling
- Exponential Backoff
- Priority Scheduling

## Trigger Lifecycle
چرخه‌ی حیات trigger در این نسخه از حالت‌های زیر پشتیبانی می‌کند:
- created
- scheduled
- waiting
- triggered
- dispatched
- skipped
- cancelled
- expired
- completed

## Queue Integration
یکپارچگی با Queue Infrastructure از طریق QueueAdapter انجام می‌شود. این لایه از ایجاد مستقیم وابستگی به BullMQ خودداری می‌کند و فقط Envelope‌های Job را به Queue Interface می‌سپارد.

## Time Management
- زمان‌بندی بر اساس Time Provider قابل تزریق انجام می‌شود
- Clock abstraction از طریق SchedulerTimeProvider فراهم شده است
- به‌صورت پیش‌فرض از SystemTimeProvider استفاده می‌شود

## Configuration Model
تنظیمات پشتیبانی‌شده شامل:
- Cron Expressions
- Intervals
- Delays
- Priorities
- Concurrency Limits
- Maintenance Windows
- Retry Delays
- Recovery Windows
- Timezone
- Jitter
- Feature Flags

## Error Handling
خطاهای scheduler-specific شامل موارد زیر ایجاد شده‌اند:
- SchedulerConfigurationError
- InvalidCronExpression
- InvalidSchedulingPolicy
- TriggerDispatchError
- ScheduleConflictError
- TimeProviderError

هر خطا متادیتای لازم شامل SchedulerId، TriggerId، CorrelationId، PolicyId، ExecutionStage و RecoveryRecommendation را در خود دارد.

## Telemetry Integration
رویدادهای چرخه‌ی حیات از طریق Telemetry interface و createSchedulerLifecycleEvent منتشر می‌شوند. این لایه فقط Hooks و Events را فراهم می‌کند و از پیاده‌سازی SDK خودداری می‌کند.

## Performance Optimizations
- جلوگیری از اسکن مجدد registry برای triggerهای ثبت‌شده
- استفاده از Map برای lookup سریع
- ساخت immutable context و event payload
- استفاده از cache و policy‌های پیش‌فرض بدون parsing تکراری

## Future Roadmap
- افزودن پشتیبانی دقیق‌تر از Cron parsing و timezone-aware execution
- افزودن policyهای Maintenance Window، Business Hours و Off-Peak
- افزودن Registry برای policyها و schedule definitions
- افزودن support برای Recovery و Retry triggers
- اتصال به runtime‌های خارجی مانند Temporal، Quartz و Kubernetes CronJobs در نسخه‌های آینده

## Remaining Work
- ادغام با موتورهای scheduling واقعی‌تر با parserهای cron پیشرفته
- افزودن support کامل برای maintenance و recovery workflows
- تکمیل policyهای پیشرفته‌تر با در نظر گرفتن زمان‌بندی‌های منطقه‌ای و DST
- گسترش تست‌های end-to-end برای dispatch و lifecycle events
