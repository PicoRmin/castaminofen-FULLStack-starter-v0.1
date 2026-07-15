# گزارش مدل فرمان انتقال و متن اجرای آن

## 1. Executive Summary

در این مخزن، لایه‌ی lifecycle RSS از قبل یک شکل واحد برای درخواست انتقال فید ارائه می‌کرد. با این حال، این شکل به‌صورت پراکنده در چند سطح و با اصطلاحات مختلف در اختیار زیرسیستم قرار داشت. برای استانداردسازی، یک مدل فرمان واحد به نام Transition Command ایجاد شد که به‌عنوان ورودی canonical برای سرویس lifecycle، لایه‌ی pipeline، و آینده‌ی worker/scheduler/event bus عمل می‌کند. این مدل در کنار یک Execution Context متمرکز و Metadata استاندارد شده عرضه شده است تا بدون تغییر درRepository و بدون اجرا یا تغییر وضعیت واقعی، قرارداد آینده‌ی انتقال‌ها آماده شود.

## 2. Repository Audit Findings

| حوزه                             | وضعیت | شواهد در مخزن                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| درخواست انتقال lifecycle موجود   | کامل  | [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)                                                                                                                                                                                                                                                                                                                       |
| سرویس lifecycle                  | کامل  | [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)                                                                                                                                                                                                                                                                                                                   |
| Pipeline انتقال                  | کامل  | [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts)                                                                                                                                                                                                                                                                                                                 |
| Registry و state machine         | کامل  | [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)                                                                                                                                                                                                                                                                                                                 |
| Validation/Guard/Policy/Decision | کامل  | [packages/rss/src/lifecycle/validation-registry.ts](packages/rss/src/lifecycle/validation-registry.ts), [packages/rss/src/lifecycle/guard-registry.ts](packages/rss/src/lifecycle/guard-registry.ts), [packages/rss/src/lifecycle/policy-engine.ts](packages/rss/src/lifecycle/policy-engine.ts), [packages/rss/src/lifecycle/decision-engine.ts](packages/rss/src/lifecycle/decision-engine.ts) |
| مدل فرمان canonical              | جدید  | [packages/rss/src/lifecycle/commands.ts](packages/rss/src/lifecycle/commands.ts)                                                                                                                                                                                                                                                                                                                 |

## 3. Existing Request Models

| مدل                                                  | محل                                                                                | توضیح                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| FeedLifecycleTransitionRequest                       | [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)         | مدل موجود برای درخواست انتقال ساده با feedId/currentState/targetState/actor/reason/correlationId/metadata |
| TransitionPipelineRequest                            | [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts)   | مدل داخلی برای pipeline با requestSource و executionMode                                                  |
| LifecyclePolicyContext / TransitionValidationContext | [packages/rss/src/lifecycle/contracts.ts](packages/rss/src/lifecycle/contracts.ts) | مدل‌های زمینه‌ای برای validation و policy                                                                 |

## 4. Transition Command Model

| بخش               | ویژگی                                                                                                                             | توضیح                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Identity          | id, correlationId, causationId, idempotencyKey, requestId, executionId, pipelineId, traceId                                       | پشتیبانی از شناسایی و ردیابی            |
| Feed              | id, uuid, slug, providerIdentifier, repositoryIdentifier, tenant/workspace identifiers                                            | پشتیبانی از هویت فید و آینده چند مستاجر |
| Transition        | currentState, targetState, identifier, category, type, transitionMetadata, requestedOperation, requestedAction                    | مدل استاندارد برای یک انتقال واحد       |
| Actor             | id, type, role, request/execution/trigger sources, context‌های اداری/سیستمی                                                       | پشتیبانی از منبع درخواست و اجرای آن     |
| Execution Context | timestamp, environment, feature flags, configuration, repository snapshot, metadata‌های pipeline/validation/guard/policy/decision | تمرکز و یکپارچه‌سازی متن اجرا           |
| Metadata          | custom/validation/guard/policy/decision/retry/recovery/notification/audit/metrics/logging                                         | ساختار باز و قابل توسعه                 |

## 5. Execution Context

Execution Context در این پیاده‌سازی به‌صورت یک شی immutable و متمرکز در [packages/rss/src/lifecycle/commands.ts](packages/rss/src/lifecycle/commands.ts) تعریف شده است. این بخش برای آینده‌ی worker، scheduler، retry، monitoring و event bus آماده است و بدون اجرای تراکنش یا تغییر حالت، فقط قرارداد را فراهم می‌کند.

## 6. Command Metadata

Metadata به‌صورت strongly typed در قالب interface‌های جداگانه و با قابلیت توسعه از طریق Record و پراپرتی‌های سفارشی ارائه شده است. این ساختار برای انتقال در queue/event و future workflow مناسب است.

## 7. Serialization Strategy

| قابلیت                          | وضعیت                    |
| ------------------------------- | ------------------------ |
| toJSON                          | وجود دارد                |
| fromJSON                        | وجود دارد                |
| سازگاری با REST/API/queue/event | آماده برای آینده         |
| transport واقعی                 | در این Prompt پیاده‌نشده |

## 8. Versioning Strategy

نسخه‌ی command با ویژگی version در مدل نگهداری می‌شود. این رویکرد امکان coexist با نسخه‌های آینده را فراهم می‌کند و مانع شکستن compatibility می‌شود.

## 9. Compatibility Analysis

| مؤلفه                      | وضعیت                                                     |
| -------------------------- | --------------------------------------------------------- |
| FeedLifecycleService       | با مدل جدید سازگار شد                                     |
| تست‌های موجود              | بدون تغییر در رفتار قبلی حفظ شدند                         |
| TransitionPipelineRequest  | بدون تغییر باقی ماند                                      |
| Existing request contracts | از طریق createTransitionCommand به مدل جدید تبدیل می‌شوند |

## 10. Existing Components Reused

- [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)
- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts)
- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)

## 11. Existing Components Extended

- سرویس lifecycle برای پذیرش ورودی legacy request و همچنین TransitionCommand
- بسته‌ی RSS برای export مدل جدید

## 12. New Components

- [packages/rss/src/lifecycle/commands.ts](packages/rss/src/lifecycle/commands.ts)
- [packages/rss/tests/transition-command-model.test.ts](packages/rss/tests/transition-command-model.test.ts)

## 13. Modified Files

- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [packages/rss/src/lifecycle/index.ts](packages/rss/src/lifecycle/index.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)

## 14. New Files

- [packages/rss/src/lifecycle/commands.ts](packages/rss/src/lifecycle/commands.ts)
- [packages/rss/tests/transition-command-model.test.ts](packages/rss/tests/transition-command-model.test.ts)

## 15. Files Left Untouched

- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- [packages/rss/src/lifecycle/validation-registry.ts](packages/rss/src/lifecycle/validation-registry.ts)
- [packages/rss/src/lifecycle/guard-registry.ts](packages/rss/src/lifecycle/guard-registry.ts)
- [packages/rss/src/lifecycle/policy-engine.ts](packages/rss/src/lifecycle/policy-engine.ts)
- [packages/rss/src/lifecycle/decision-engine.ts](packages/rss/src/lifecycle/decision-engine.ts)
- [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts)

## 16. Architecture Decisions

- یک مدل فرمان canonical و immutable ایجاد شد.
- سرویس lifecycle از ورودی legacy و از مدل جدید پشتیبانی می‌کند.
- هیچ‌یک از لایه‌های validation/guard/policy/repository/worker اجرا نشده‌اند.

## 17. Technical Debt

- در آینده باید این مدل در worker/scheduler/retry/event bus به‌صورت کامل استفاده شود.
- برخی فیلدها هنوز به‌صورت placeholder در قالب metadata نگهداری می‌شوند.

## 18. Risks

- اگر سایر لایه‌ها هنوز با مدل قدیمی کار کنند، نیاز به مهاجرت تدریجی خواهند داشت.
- برخی جزئیات provider/plugin/tenant در این مرحله placeholder هستند.

## 19. Future Integration Points

- Lifecycle Service
- Workers
- Scheduler
- Retry Engine
- Monitoring
- Event Bus
- CLI
- CQRS-oriented orchestration

## 20. Recommendations for Prompt 7A.5

- مدل Command را در لایه‌ی API و queue به‌طور کامل به کار بگیرید.
- برای هر انتقال، یک نسخه‌ی command با metadata‌های دقیق و versioned ثبت کنید.
- از این مدل به‌عنوان contract مشترک میان service، worker، scheduler و audit استفاده کنید.
