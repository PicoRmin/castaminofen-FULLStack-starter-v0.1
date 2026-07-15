# Prompt-7A.4.3 - Transition Execution Planning Engine

## 1. Executive Summary

این مستند وضعیت فعلی معماری برنامه‌ی RSS Lifecycle را در حوزه‌ی Transition Execution Planning بررسی می‌کند. بر اساس بازرسی انجام‌شده در مخزن، منطق تصمیم‌گیری و فرمان انتقال از قبل در لایه‌ی lifecycle موجود بوده است، اما موتور برنامه‌ریزی اجرایی به‌صورت متمرکز و استاندارد وجود نداشت. برای رفع این شکاف، یک موتور برنامه‌ریزی اجرایی جدید ایجاد شد که فقط مسئول تبدیل تصمیم تأییدشده‌ی انتقال به یک Execution Plan است و هیچ‌گونه اجرای انتقال، تغییر حالت، دسترسی به repository و یا اجرای worker انجام نمی‌دهد.

## 2. Repository Audit Findings

| حوزه                           | وضعیت       | شواهد مخزن                                                                                             |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------ |
| Transition Command Model       | کامل        | [packages/rss/src/lifecycle/commands.ts](packages/rss/src/lifecycle/commands.ts)                       |
| Transition Decision Engine     | کامل        | [packages/rss/src/lifecycle/decision-engine.ts](packages/rss/src/lifecycle/decision-engine.ts)         |
| Transition Processing Pipeline | کامل        | [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts)                       |
| Lifecycle Service              | کامل        | [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)                         |
| Transition Registry            | کامل        | [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)                       |
| Validation Framework           | کامل        | [packages/rss/src/lifecycle/validation-registry.ts](packages/rss/src/lifecycle/validation-registry.ts) |
| Guard Framework                | کامل        | [packages/rss/src/lifecycle/guard-registry.ts](packages/rss/src/lifecycle/guard-registry.ts)           |
| Policy Engine                  | کامل        | [packages/rss/src/lifecycle/policy-engine.ts](packages/rss/src/lifecycle/policy-engine.ts)             |
| Planning Engine                | جدید و کامل | [packages/rss/src/lifecycle/planning-engine.ts](packages/rss/src/lifecycle/planning-engine.ts)         |

## 3. Existing Planning Logic

منطق برنامه‌ریزی قبلی در چند بخش پراکنده وجود داشت:

- در [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts) مرحله‌ی execution به‌صورت placeholder و بدون مدل برنامه‌ی اجرایی استاندارد پیاده‌سازی شده بود.
- در [packages/rss/src/lifecycle/decision-engine.ts](packages/rss/src/lifecycle/decision-engine.ts) داده‌های تصمیم‌گیری برای آینده شامل retry، recovery، audit و logging آماده شده بودند.
- در [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts) سرویس lifecycle تنها جریان را اجرا می‌کرد و خود برنامه‌ی اجرایی نمی‌ساخت.

## 4. Execution Planning Engine

موتور جدید در [packages/rss/src/lifecycle/planning-engine.ts](packages/rss/src/lifecycle/planning-engine.ts) ایجاد شد. این موتور:

- فقط از Decision و Command ورودی استفاده می‌کند.
- یک Execution Plan immutable تولید می‌کند.
- بر اساس نوع تصمیم، استراتژی را تعیین می‌کند.
- مراحل اجرای آینده را به‌صورت ordered stages تعریف می‌کند.
- وابستگی‌های بین مراحل را مستندسازی می‌کند.
- هیچ‌گونه state mutation، repository access یا execution واقعی انجام نمی‌دهد.

## 5. Execution Plan Model

مدل Execution Plan شامل موارد زیر است:

- executionId
- executionStrategy
- executionMode
- stages
- dependencies
- metadata
- expectedOutputs
- futureRecoveryMetadata
- futureRetryMetadata
- futureLoggingMetadata
- futureMetricsMetadata
- futureAuditMetadata
- futureEventMetadata
- futureNotificationMetadata

همه‌ی این بخش‌ها در خروجی immutable و Readonly ارائه شده‌اند.

## 6. Planning Contracts

قراردادهای جدید شامل موارد زیر هستند:

- TransitionExecutionPlanningInput
- TransitionExecutionPlanningContext
- TransitionExecutionPlanningResult
- TransitionExecutionPlan
- PlanningFailure
- انواع خطاهای ساختاری مثل MissingDecision و MissingCommand

## 7. Planning Strategies

استراتژی‌های پشتیبانی‌شده در موتور عبارت‌اند از:

- immediate
- deferred
- background
- manual
- administrative
- scheduled
- recovery
- retry
- migration
- maintenance

## 8. Execution Stages

مراحل پشتیبانی‌شده شامل موارد زیر هستند:

- pre-validation
- pre-execution
- transition-execution
- post-execution
- persistence
- logging
- metrics
- audit
- domain-events
- notifications

## 9. Dependency Model

مدل وابستگی برای هر مرحله شامل موارد زیر است:

- required
- optional
- conditional
- future-async
- future-plugin
- future-provider

در این نسخه، فقط وابستگی‌های required برای ساختاردهی مدل اضافه شده‌اند.

## 10. Failure Model

مدل خطاهای برنامه‌ریزی شامل موارد زیر است:

- PlanningFailure
- MissingDecision
- MissingCommand
- MissingTransition
- MissingExecutionContext
- UnsupportedStrategy
- PlanningConfigurationFailure

## 11. Existing Components Reused

- [packages/rss/src/lifecycle/commands.ts](packages/rss/src/lifecycle/commands.ts)
- [packages/rss/src/lifecycle/decision-engine.ts](packages/rss/src/lifecycle/decision-engine.ts)
- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts)
- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)

## 12. Existing Components Extended

- [packages/rss/src/lifecycle/index.ts](packages/rss/src/lifecycle/index.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)

## 13. New Components

- [packages/rss/src/lifecycle/planning-engine.ts](packages/rss/src/lifecycle/planning-engine.ts)
- [packages/rss/tests/transition-execution-planning-engine.test.ts](packages/rss/tests/transition-execution-planning-engine.test.ts)

## 14. Modified Files

- [packages/rss/src/lifecycle/index.ts](packages/rss/src/lifecycle/index.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)

## 15. New Files

- [packages/rss/src/lifecycle/planning-engine.ts](packages/rss/src/lifecycle/planning-engine.ts)
- [packages/rss/tests/transition-execution-planning-engine.test.ts](packages/rss/tests/transition-execution-planning-engine.test.ts)

## 16. Files Left Untouched

- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts)
- [packages/rss/src/lifecycle/commands.ts](packages/rss/src/lifecycle/commands.ts)
- [packages/rss/src/lifecycle/decision-engine.ts](packages/rss/src/lifecycle/decision-engine.ts)
- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)

## 17. Architecture Decisions

1. برنامه‌ریزی در یک موتور واحد متمرکز شد.
2. هیچ‌کدام از لایه‌های execution، persistence و worker به‌طور مستقیم برنامه‌ریزی نمی‌کنند.
3. قراردادهای Planning با قراردادهای موجود Transition Command و Decision Engine سازگار شده‌اند.
4. مدل‌ها immutable و Readonly طراحی شده‌اند تا برای آینده‌ای با workflow engine و queue layer قابل‌گسترش باشند.

## 18. Technical Debt

- در حال حاضر، موتور برنامه‌ریزی فقط یک مدل برنامه‌ی اجرایی ساختاری تولید می‌کند و dependency resolution واقعی را اجرا نمی‌کند.
- لایه‌ی service فعلی هنوز از pipeline گذشته استفاده می‌کند و در آینده می‌توان آن را به‌طور مستقیم به موتور planning وصل کرد.

## 19. Risks

- اگر در آینده لایه‌ی execution واقعی به این موتور متصل شود، باید قراردادهای stage names و metadata با نیازهای worker/scheduler هم‌خوانی داشته باشند.
- اگر service‌های دیگر در repo خودشان planning بسازند، اصل Single Source of Truth نقض می‌شود.

## 20. Future Integration Points

- Worker Layer
- Scheduler
- Retry Engine
- Recovery Engine
- BullMQ / Background Processing
- Monitoring و Metrics
- Dashboard و Notifications
- Event Bus
- Multi-tenant و Provider Plugins

## 21. Recommendations for Prompt 7A.5

- اتصال مستقیم موتور planning به FeedLifecycleService در لایه‌ی service.
- افزودن adapter برای تولید plan به‌صورت JSON برای worker و scheduler.
- تعریف قراردادهای extension point برای retry و recovery.
- ایجاد تست‌های integration برای سناریوهای deferred و recovery.
