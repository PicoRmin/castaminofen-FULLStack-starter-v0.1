# Prompt 7A.4.4 - Transition Execution Coordinator

## 1. Executive Summary

این سند بازبینی، استانداردسازی و تکمیل هماهنگ‌ساز اجرای انتقال چرخه‌ی عمر فید را در پکیج RSS مستند می‌کند. بر اساس بازرسی مخزن، منطق اجرایی قبلاً در چند لایه پراکنده بود؛ در حال حاضر یک هماهنگ‌ساز مرکزی برای اجرای انتقال‌ها ایجاد شده است که جریان را از دریافت فرمان تا آماده‌سازی خروجی نهایی یکپارچه می‌کند و بدون بازنویسی منطق کسب‌وکار، فقط مسئول هماهنگی اجراست.

## 2. Repository Audit Findings

| مؤلفه                  | وضعیت          | شواهد مخزن                                                    |
| ---------------------- | -------------- | ------------------------------------------------------------- |
| مدل وضعیت فید          | کامل           | فایل‌های مربوط به وضعیت در packages/rss/src/status و registry |
| ماشین حالت چرخه‌ی عمر  | کامل           | packages/rss/src/lifecycle/registry.ts                        |
| ثبت‌نام انتقال         | کامل           | packages/rss/src/lifecycle/registry.ts                        |
| چارچوب اعتبارسنجی      | کامل           | packages/rss/src/lifecycle/validation-registry.ts             |
| چارچوب گارد            | کامل           | packages/rss/src/lifecycle/guard-registry.ts                  |
| Pipeline پردازش انتقال | کامل           | packages/rss/src/lifecycle/pipeline.ts                        |
| موتور سیاست            | کامل           | packages/rss/src/lifecycle/policy-engine.ts                   |
| موتور تصمیم            | کامل           | packages/rss/src/lifecycle/decision-engine.ts                 |
| مدل فرمان انتقال       | کامل           | packages/rss/src/lifecycle/commands.ts                        |
| موتور برنامه‌ریزی اجرا | کامل           | packages/rss/src/lifecycle/planning-engine.ts                 |
| لایه سرویس چرخه‌ی عمر  | جزئی           | packages/rss/src/lifecycle/service.ts                         |
| هماهنگ‌ساز اجرا        | جدید/تکمیل‌شده | packages/rss/src/lifecycle/coordinator.ts                     |

## 3. Existing Coordination Logic

منطق هماهنگی قبلی در سرویس FeedLifecycleService قرار داشت و این سرویس خود،Pipeline،Decision وPlanning را فرا می‌خواند اما مسئولیت اصلی هماهنگ‌سازی را درون خود نگه می‌داشت. با ایجاد هماهنگ‌ساز جدید، این مسئولیت به یک نقطه‌ی مرکزی انتقال یافت.

## 4. Transition Execution Coordinator

هماهنگ‌ساز جدید در فایل packages/rss/src/lifecycle/coordinator.ts تعریف شده است. این مؤلفه فقط موارد زیر را انجام می‌دهد:

- دریافت فرمان انتقال
- اجرای Pipeline
- تولید Context اجرایی استاندارد
- ایجاد برنامه‌ی اجرا از طریق Planning Engine
- فراخوانی سرویس دامنه‌ی چرخه‌ی عمر
- آماده‌سازی متادیتا برای persistence/logging/metrics/events
- بازگرداندن نتیجه‌ی اجرایی

## 5. Execution Flow

| مرحله | توضیح                                                             |
| ----- | ----------------------------------------------------------------- |
| 1     | دریافت TransitionCommand یا FeedLifecycleTransitionRequest        |
| 2     | ساخت Context اجرایی                                               |
| 3     | اجرای TransitionProcessingPipeline                                |
| 4     | تولید DecisionResult                                              |
| 5     | ساخت ExecutionPlan                                                |
| 6     | فراخوانی Lifecycle Service                                        |
| 7     | آماده‌سازی متادیتای آینده برای persistence/logging/metrics/events |
| 8     | بازگشت TransitionExecutionResult                                  |

## 6. Execution Context

Context اجرایی شامل موارد زیر است:

- executionId
- correlationId
- causationId
- commandId
- pipelineId
- traceId
- scope
- transaction
- cancellation
- timeout
- repositoryContext
- configurationSnapshot
- featureFlags
- environment
- tenantContext
- subscriptionContext

## 7. Transaction Boundary Preparation

برای سازگاری آینده، قراردادهای مربوط به Transaction Scope، Transaction Metadata، Rollback Preparation و Compensation Placeholder در Coordinator آماده شده‌اند. هیچ تراکنش واقعی در این مرحله اجرا نمی‌شود.

## 8. Cancellation Model

مدل لغو در سطح قرارداد آماده شده است و شامل Cancellation Request، Cancellation Reason و Cancellation Metadata می‌شود. اجرای واقعی لغو در این مرحله پیاده‌سازی نشده است.

## 9. Timeout Model

قراردادهای timeout برای execution/planning/worker/retry/scheduler در Context Coordinator تعریف شده‌اند و برای ادغام آینده آماده‌اند.

## 10. Hook Architecture

هک‌ها برای نقاط زیر فراهم شده‌اند:

- Before Coordination
- Before Validation
- After Validation
- Before Decision
- After Decision
- Before Lifecycle
- After Lifecycle
- Before Persistence
- After Persistence
- Before Logging
- After Logging
- Before Metrics
- After Metrics
- Before Events
- After Events

## 11. Failure Model

نوع‌های خطای استاندارد برای CoordinationFailure، ExecutionFailure، PipelineFailure، PlanningFailure و UnexpectedFailure در سطح قراردادهای Coordinator آماده شده‌اند.

## 12. Existing Components Reused

- FeedLifecycleService
- TransitionProcessingPipeline
- TransitionDecisionEngine
- TransitionExecutionPlanningEngine
- TransitionCommand
- Lifecycle registry and validation framework

## 13. Existing Components Extended

- FeedLifecycleService برای استفاده از Coordinator
- Entry points در packages/rss/src/index.ts برای انتشار API Coordinator

## 14. New Components

- TransitionExecutionCoordinator
- انواع Context/Scope/Hook/Failure/Result مرتبط

## 15. Modified Files

- packages/rss/src/lifecycle/service.ts
- packages/rss/src/lifecycle/coordinator.ts
- packages/rss/src/lifecycle/index.ts
- packages/rss/src/index.ts
- packages/rss/tests/transition-execution-coordinator.test.ts

## 16. New Files

- packages/rss/src/lifecycle/coordinator.ts
- packages/rss/tests/transition-execution-coordinator.test.ts
- Prompt-7A.4.4-Transition-Execution-Coordinator.md

## 17. Files Left Untouched

- منطق کسب‌وکار و قواعد انتقال
- Validation/Guard/Policy/Planning/Repository/Persistence و Worker/Scheduler

## 18. Architecture Decisions

- یک هماهنگ‌ساز مرکزی به‌جای چند منبع orchestration
- مسئولیت فقط اجرای جریان و آماده‌سازی قراردادهای آینده
- حفظ سازگاری با API موجود
- نگه‌داشتن منطق کسب‌وکار در لایه‌های موجود

## 19. Technical Debt

- اجرای واقعی persistence/logging/metrics/events هنوز تعبیه نشده است
- تراکنش و لغو واقعی هنوز پیاده‌سازی نشده‌اند
- سرویس‌های آینده باید از این Coordinator برای اجرای انتقال استفاده کنند

## 20. Risks

- اگر سرویس‌های دیگر هنوز مستقیماً orchestration انجام دهند، دوباره تکرار ایجاد می‌شود
- ادغام با Worker/Scheduler/BullMQ نیازمند تکمیل لایه‌ی بعدی است

## 21. Future Integration Points

- Lifecycle Domain Service
- Repository Layer
- Workers
- Scheduler
- Retry Engine
- Monitoring
- Metrics
- Notifications
- Event Bus
- Distributed Workflow Runtime

## 22. Recommendations for Prompt 7A.5

- قراردادهای واقعی برای persistence/logging/metrics/events را به‌صورت اجرایی تکمیل کند
- Coordinator را با Worker/Scheduler/BullMQ ادغام کند
- transactional execution و cancellation واقعی را پیاده‌سازی کند
- از این Coordinator برای تمام مسیرهای lifecycle استفاده کند
