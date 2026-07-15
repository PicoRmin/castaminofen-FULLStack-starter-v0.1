# Prompt-7A.4 - Lifecycle Policy Engine

## 1. Executive Summary

این سند بررسی و مستندسازی معماری موتور سیاست‌های چرخه‌حیات فیدهای RSS در این مخزن است. بر اساس بازرسی انجام‌شده در لایه‌های lifecycle، pipeline، service و تست‌های مربوطه، منطق کسب‌وکار مرتبط با سیاست‌های چرخه‌حیات قبلاً در سرویس lifecycle به‌صورت مستقیم و پراکنده وجود داشت. در این نسخه، این منطق به یک موتور سیاست مرکزی، استاندارد و قابل‌گسترش منتقل شده است تا سیاست‌ها از Guards و Validators جدا شوند و از طریق pipeline اصلی ارزیابی شوند.

## 2. Repository Audit Findings

| حوزه                   | وضعیت                     | شواهد در مخزن                                               |
| ---------------------- | ------------------------- | ----------------------------------------------------------- |
| State Machine          | کامل                      | فایل‌های مربوط به registry و state machine در بسته RSS      |
| Transition Registry    | کامل                      | فایل lifecycle/registry.ts                                  |
| Validation Framework   | کامل                      | فایل lifecycle/validation-registry.ts                       |
| Guard Framework        | کامل                      | فایل lifecycle/guard-registry.ts                            |
| Pipeline               | جزئی/نیمه‌کامل            | فایل lifecycle/pipeline.ts با stage placeholder برای policy |
| Policy Logic           | ناقص/پراکنده              | منطق محدود در FeedLifecycleService.validateBusinessRules    |
| Repository Layer       | خارج از محدوده این Prompt | در لایه‌های repository و persistence باقی مانده است         |
| Worker/Scheduler/Retry | خارج از محدوده این Prompt | فقط به‌عنوان extension point نگه داشته شده است              |

## 3. Existing Policy Implementations

| مؤلفه                                      | نوع                  | نتیجه                                        |
| ------------------------------------------ | -------------------- | -------------------------------------------- |
| FeedLifecycleService.validateBusinessRules | منطق کسب‌وکار مستقیم | به موتور جدید منتقل شد                       |
| lifecycle/guard-registry.ts                | Guard                | برای کنترل پیش‌شرط‌های فنی/ساختاری باقی ماند |
| lifecycle/validation-registry.ts           | Validation           | برای اعتبارسنجی درخواست انتقال باقی ماند     |
| pipeline.ts                                | Policy placeholder   | با موتور جدید جایگزین شد                     |

## 4. Lifecycle Policy Engine

### A. Policy Audit Report

| بعد                           | نتیجه                 | مستندات/شواهد                               |
| ----------------------------- | --------------------- | ------------------------------------------- |
| Policy Logic موجود            | بلی، اما پراکنده      | FeedLifecycleService.validateBusinessRules  |
| Policy Logic مرکزی            | خیر، قبل از این تغییر | pipeline placeholder                        |
| Policy Engine جدید            | بلی                   | packages/rss/src/lifecycle/policy-engine.ts |
| Policy Evaluation در Pipeline | بلی                   | packages/rss/src/lifecycle/pipeline.ts      |

### B. Policy Registry Matrix

| شناسه سیاست                                  | دسته            | اولویت | توضیح                                                |
| -------------------------------------------- | --------------- | -----: | ---------------------------------------------------- |
| lifecycle.policy.recovery-gating             | recovery        |    100 | جلوگیری از فعال‌سازی فیدهای شکست‌خورده بدون recovery |
| lifecycle.policy.synchronization-eligibility | synchronization |     90 | محدودسازی synchronization به وضعیت‌های واجد شرایط    |
| lifecycle.policy.state-restrictions          | administrative  |     80 | محدودیت‌های مربوط به archived و deleted              |
| lifecycle.policy.operational-readiness       | operational     |     70 | بررسی سازگاری metadata با وضعیت‌های lifecycle        |

### C. Policy Classification Matrix

| دسته            | کاربرد                                       |
| --------------- | -------------------------------------------- |
| recovery        | کنترل ورود به حالت ACTIVE برای فیدهای failed |
| synchronization | کنترل ورود به SYNCING                        |
| administrative  | محدودیت‌های state-based                      |
| operational     | بررسی readiness و metadata                   |

### D. Policy Contract Matrix

| Contract                        | نقش                   |
| ------------------------------- | --------------------- |
| LifecyclePolicyDefinition       | تعریف سیاست‌ها        |
| LifecyclePolicyContext          | ارسال context ارزیابی |
| LifecyclePolicyResult           | بازگشت نتیجه‌ی سیاست  |
| LifecyclePolicyEvaluationResult | خروجی نهایی موتور     |

### E. Policy Evaluation Matrix

| مرحله               | مسئول               | نتیجه                              |
| ------------------- | ------------------- | ---------------------------------- |
| Registry Resolution | registry            | تعیین transition definition        |
| Validation          | validation registry | بررسی ساختاری و منطقی درخواست      |
| Guards              | guard registry      | جلوگیری از عبور از محدودیت‌های فنی |
| Policy Engine       | policy engine       | تصمیم‌گیری کسب‌وکار                |

### F. Architecture Review

| حوزه                   | نتیجه                                 |
| ---------------------- | ------------------------------------- |
| Separation of Concerns | رعایت شده است                         |
| Single Responsibility  | موتور فقط تصمیم‌گیری می‌کند           |
| Backward Compatibility | حفظ شده است                           |
| Extension Readiness    | برای feature flags و tenant آماده است |

### G. Technical Debt Report

| مورد                   | توضیح                                |
| ---------------------- | ------------------------------------ |
| سیاست‌های plugin-based | هنوز پیاده‌سازی نشده‌اند             |
| policy cache           | برای نسخه‌های آینده پیش‌بینی شده است |
| tenant/provider policy | به‌عنوان extension point آماده است   |

### H. Future Integration Roadmap

| حوزه         | مسیر پیاده‌سازی آینده                     |
| ------------ | ----------------------------------------- |
| Retry Engine | استفاده از retryHint و policy result      |
| Worker       | استفاده از policy metadata در job routing |
| Scheduler    | اعمال سیاست‌های زمان‌بندی                 |
| Monitoring   | ثبت policy outcome و audit trail          |

موتور سیاست چرخه‌حیات یک موتور مرکزی است که تصمیم می‌گیرد آیا انتقال باید ادامه یابد یا توسط سیاست‌های کسب‌وکار رد شود. این موتور فقط تصمیم‌گیری می‌کند و هیچ‌گاه وضعیت فید را تغییر نمی‌دهد و هیچ‌گونه transition را اجرا نمی‌کند.

### مسئولیت‌های اصلی

- ارزیابی سیاست‌ها قبل از اجرای transition
- ثبت نتایج سیاست به‌صورت ساختارمند
- پشتیبانی از ترتیب اجرای سیاست‌ها
- امکان توسعه برای سیاست‌های آینده مانند feature flag، tenant، subscription و provider-specific

## 5. Policy Contracts

| Contract                        | توضیح                                                                 |
| ------------------------------- | --------------------------------------------------------------------- |
| LifecyclePolicyDefinition       | تعریف یک سیاست با شناسه، نام، دسته، اولویت و evaluator                |
| LifecyclePolicyContext          | متناظر با request، metadata، guard/validation result و داده‌های محیطی |
| LifecyclePolicyResult           | نتیجه ارزیابی با status، allowed، reason، code و metadata             |
| LifecyclePolicyEvaluationResult | خروجی نهایی با نتیجه و لیست نتایج سیاست‌ها                            |

## 6. Policy Context

بستر ارزیابی شامل موارد زیر است:

- request انتقال
- transition definition
- metadata وضعیت منبع و مقصد
- نتیجه Guard و Validation
- configuration و environment
- feature flags و repository snapshot
- metadata اجرایی

## 7. Policy Registry

ثبت‌نام سیاست‌ها در یک آرایه مرکزی انجام شده است. این آرایه در فایل policy-engine.ts تعریف شده و هر سیاست یک‌بار ثبت می‌شود. مصرف‌کننده‌ها از طریق موتور و نه از لیست‌های پراکنده استفاده می‌کنند.

## 8. Policy Classification

| دسته            | مثال                        |
| --------------- | --------------------------- |
| operational     | Operational Readiness       |
| administrative  | State Restrictions          |
| recovery        | Recovery Gating             |
| synchronization | Synchronization Eligibility |

## 9. Policy Evaluation Flow

1. Transition Registry
2. Validation
3. Guards
4. Policy Engine
5. Lifecycle Service

این ترتیب در pipeline حفظ شده است و policy engine در مرحله‌ی چهارم قبل از ادامه‌ی pipeline اجرا می‌شود.

## 10. Policy Composition Strategy

استراتژی شامل چند اصل است:

- چندین سیاست می‌توانند به‌صورت ترتیبی اجرا شوند
- هر سیاست مستقل از سیاست‌های دیگر است
- امکان افزودن سیاست‌های آینده بدون بازطراحی وجود دارد
- موتور بر اساس first-rejection و order-based execution عمل می‌کند

## 11. Existing Components Reused

- lifecycle/registry.ts
- lifecycle/validation-registry.ts
- lifecycle/guard-registry.ts
- lifecycle/pipeline.ts
- lifecycle/service.ts
- status metadata و validation helpers

## 12. Existing Components Extended

- TransitionPipelineContext
- TransitionPolicyResult
- FeedLifecycleService

## 13. New Components

- lifecycle/policy-engine.ts
- تست‌های جدید برای موتور سیاست

## 14. Modified Files

- packages/rss/src/lifecycle/contracts.ts
- packages/rss/src/lifecycle/pipeline.ts
- packages/rss/src/lifecycle/service.ts
- packages/rss/src/lifecycle/policy-engine.ts
- packages/rss/tests/lifecycle-policy-engine.test.ts

## 15. New Files

- packages/rss/src/lifecycle/policy-engine.ts
- packages/rss/tests/lifecycle-policy-engine.test.ts
- Prompt-7A.4-Lifecycle-Policy-Engine.md

## 16. Files Left Untouched

- state machine definition
- transition registry definitions
- validation framework
- guard framework
- repositories
- workers
- schedulers
- persistence layer

## 17. Architecture Decisions

- سیاست‌ها از Guards و Validators جدا شدند
- state mutation در این لایه انجام نمی‌شود
- موتور سیاست تنها مسئول تصمیم‌گیری است
- pipeline به‌عنوان نقطه‌ی یکپارچه برای ارزیابی سیاست استفاده شده است

## 18. Technical Debt

- هنوز سیاست‌های بیشتری برای feature flag، tenant و subscription در این نسخه اضافه نشده‌اند
- برخی فیلدهای metadata در آینده می‌توانند به‌صورت richer schema درآیند
- policy engine در حال حاضر بر اساس policies hardcoded است و برای plugin-based extension آماده است اما هنوز به‌صورت fully dynamic ارائه نشده است

## 19. Risks

- در آینده ممکن است نیاز به policy composition پیچیده‌تر باشد
- برای محیط‌های چند-tenant یا چند-provider، نیاز به context richer احساس می‌شود
- اگر policy‌ها به‌صورت مستقیم به repository یا persistence دسترسی پیدا کنند، اصل Clean Architecture نقض می‌شود

## 20. Future Integration Points

- Retry Engine
- Worker Runtime
- Scheduler
- Monitoring/Metrics
- Feature Flag Provider
- Tenant/Subscription-aware policies
- Provider-specific policy plugins

## 21. Recommendations for Prompt 7A.5

- اضافه کردن policy plugins بر اساس provider و tenant
- افزودن policy cache با memoization برای جلوگیری از ارزیابی تکراری
- اضافه کردن policy telemetry و audit trail
- اتصال موتور به سرویس lifecycle/domain service در مرحله‌ی بعدی
