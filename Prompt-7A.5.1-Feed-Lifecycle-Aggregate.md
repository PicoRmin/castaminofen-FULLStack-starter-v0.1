# Prompt-7A.5.1 - Feed Lifecycle Aggregate

## 1. Executive Summary

این سند به‌منظور ارزیابی، مستندسازی و استانداردسازی رفتار Aggregate در حوزه Feed Lifecycle در مخزن فعلی تهیه شده است. در این بازبینی، مشخص شد که لایه Lifecycle Service در حال حاضر قراردادهای انتقال وضعیت را تعریف می‌کند و در مسیر applyTransition از Aggregate به‌عنوان یک نقطهٔ مرجع استفاده می‌کند، اما هنوز هیچ Aggregate مجرد و مرکزی‌ای در سطح دامنه برای مدیریت وضعیت چرخه‌حیات Feed وجود نداشت. در نتیجه، رفتار تغییر وضعیت در این مخزن به‌طور پراکنده و غیرمتمرکز باقی مانده بود.

برای حل این مسئله، یک Aggregate جدید با نام FeedLifecycleAggregateRoot ایجاد شد که وظیفهٔ اصلی خود را در نگهداری وضعیت، نسخه‌گذاری، اسنپ‌شات، متادیتا و اعمال انتقال‌های lifecycle متمرکز کرده است. این Aggregate تنها در حوزه business state و invariants عمل می‌کند و از اجرای validation، guard، policy، persistence، synchronization و worker جلوگیری می‌کند.

## 2. Repository Audit Findings

| حوزه                       | وضعیت     | شواهد مخزن                                                                                                                                        |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feed Status Model          | کامل      | [packages/rss/src/status/types.ts](packages/rss/src/status/types.ts) و [packages/rss/src/status/metadata.ts](packages/rss/src/status/metadata.ts) |
| Lifecycle State Machine    | کامل      | [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)                                                                  |
| Transition Registry        | کامل      | [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)                                                                  |
| Validation Framework       | کامل      | [packages/rss/src/lifecycle/validation-registry.ts](packages/rss/src/lifecycle/validation-registry.ts)                                            |
| Guard Framework            | کامل      | [packages/rss/src/lifecycle/guard-registry.ts](packages/rss/src/lifecycle/guard-registry.ts)                                                      |
| Policy Engine              | کامل      | [packages/rss/src/lifecycle/policy-engine.ts](packages/rss/src/lifecycle/policy-engine.ts)                                                        |
| Decision Engine            | کامل      | [packages/rss/src/lifecycle/decision-engine.ts](packages/rss/src/lifecycle/decision-engine.ts)                                                    |
| Planning Engine            | کامل      | [packages/rss/src/lifecycle/planning-engine.ts](packages/rss/src/lifecycle/planning-engine.ts)                                                    |
| Coordinator                | کامل      | [packages/rss/src/lifecycle/coordinator.ts](packages/rss/src/lifecycle/coordinator.ts)                                                            |
| Lifecycle Service          | کامل      | [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)                                                                    |
| Repository Layer           | جزئی      | [packages/rss/src/repositories/index.ts](packages/rss/src/repositories/index.ts)                                                                  |
| Aggregate Logic            | ناقص      | قبلاً هیچ Aggregate واقعی برای Feed Lifecycle وجود نداشت                                                                                          |
| API Mutation Call Sites    | کامل      | [apps/api/src/modules/feeds/feeds-administration.service.ts](apps/api/src/modules/feeds/feeds-administration.service.ts)                          |
| State Mutation in Services | جزئی/ناقص | سرویس‌های ادمین و API در حال حاضر وضعیت را به‌صورت مستقیم در Prisma و stateStore تغییر می‌دهند                                                    |

## 3. Existing Aggregate Logic

در این مخزن، منطق lifecycle به‌صورت زیر پراکنده بود:

- سرویس lifecycle در [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts) قرارداد انتقال را کنترل می‌کند.
- رجیستری state machine در [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts) قوانین مجاز انتقال را تعریف می‌کند.
- سرویس ادمین در [apps/api/src/modules/feeds/feeds-administration.service.ts](apps/api/src/modules/feeds/feeds-administration.service.ts) با فراخوانی FeedLifecycleService، انتقال‌ها را آغاز می‌کند اما خود state mutation را مستقیماً به Prisma و stateStore واگذار می‌کند.
- هیچ کلاس Aggregate واقعی در سطح دامنه برای Feed وجود نداشت و بنابراین کدهای mutation در حالت Anemic/Scattered باقی مانده بودند.

## 4. Feed Aggregate

Aggregate جدید در [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts) اضافه شد. این Aggregate شامل موارد زیر است:

- هویت Feed
- وضعیت فعلی lifecycle
- نسخه
- اسنپ‌شات
- متادیتای lifecycle / operational / synchronization / configuration
- روال اعمال transition
- روال‌های convenience مانند activate(), pause(), archive(), disable(), enable(), markFailed(), scheduleSync(), recover(), restore()

## 5. Aggregate Responsibilities

| مسئولیت                        | وضعیت                       |
| ------------------------------ | --------------------------- |
| نگهداری lifecycle state        | انجام شد                    |
| اعمال invariant                | انجام شد                    |
| نگهداری version                | انجام شد                    |
| نگهداری snapshot               | انجام شد                    |
| آماده‌سازی future events       | انجام شد (به‌صورت contract) |
| انجام validation/guard/policy  | خارج از مسئولیت Aggregate   |
| persistence                    | خارج از مسئولیت Aggregate   |
| synchronization/import/workers | خارج از مسئولیت Aggregate   |

## 6. Aggregate Identity

Aggregate از هویت‌های زیر پشتیبانی می‌کند:

- Feed ID
- Slug
- Provider Identifier
- Repository Identifier
- Tenant Identifier

## 7. Aggregate State

State Aggregate شامل موارد زیر است:

- currentStatus / status / lifecycleState
- metadata
- lifecycleMetadata
- operationalMetadata
- synchronizationMetadata
- configurationSnapshot
- subscriptionMetadata
- regionalMetadata

## 8. Aggregate Mutations

| Mutation                 | توضیح                                 |
| ------------------------ | ------------------------------------- |
| applyLifecycleTransition | اعمال انتقال معتبر با کنترل invariant |
| activate                 | انتقال به ACTIVE                      |
| pause                    | انتقال به PAUSED                      |
| archive                  | انتقال به ARCHIVED                    |
| disable                  | انتقال به DISABLED                    |
| enable                   | انتقال به ACTIVE                      |
| markFailed               | انتقال به SYNC_FAILED                 |
| scheduleSync             | انتقال به SYNCING                     |
| recover                  | انتقال به ACTIVE                      |
| restore                  | انتقال به ACTIVE                      |

## 9. Aggregate Invariants

| Invariant                 | توضیح                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| Identity integrity        | Aggregate id اجباری است                                                |
| Current state consistency | انتقال فقط در صورتی مجاز است که state فعلی با previousState منطبق باشد |
| Transition validity       | فقط انتقال‌های مجاز از state machine قابل قبول هستند                   |
| Version progression       | نسخه در هر transition افزایش می‌یابد                                   |
| Snapshot coherence        | هر mutation اسنپ‌شات جدید صادر می‌کند                                  |

## 10. Snapshot Strategy

اسنپ‌شات در Aggregate به‌صورت immutable-like در دسترس است و برای آینده برای persistence، cache، replay، audit و event-driven workflows آماده است. در این مرحله فقط contract و ساختار داده‌ای فراهم شده است.

## 11. Versioning Strategy

نسخه‌پردازی در Aggregate از طریق property version پشتیبانی می‌شود. این ساختار برای optimistic concurrency در آینده آماده است، اما هیچ منطق persistence یا conflict resolution در این مرحله اعمال نشده است.

## 12. Future Domain Events

پشتیبانی برای eventهای آتی در سطح types و Aggregate فراهم شده است. نمونه‌ها:

- FeedActivated
- FeedPaused
- FeedArchived
- FeedRecovered
- FeedFailed
- FeedDeleted

## 13. Existing Components Reused

- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- [packages/rss/src/status/metadata.ts](packages/rss/src/status/metadata.ts)
- [packages/rss/src/lifecycle/errors.ts](packages/rss/src/lifecycle/errors.ts)

## 14. Existing Components Extended

- [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)
- [packages/rss/src/lifecycle/index.ts](packages/rss/src/lifecycle/index.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)

## 15. New Components

- [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts)
- [packages/rss/tests/feed-lifecycle-aggregate.test.ts](packages/rss/tests/feed-lifecycle-aggregate.test.ts)

## 16. Modified Files

- [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)
- [packages/rss/src/lifecycle/index.ts](packages/rss/src/lifecycle/index.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)

## 17. New Files

- [packages/rss/src/lifecycle/aggregate.ts](packages/rss/src/lifecycle/aggregate.ts)
- [packages/rss/tests/feed-lifecycle-aggregate.test.ts](packages/rss/tests/feed-lifecycle-aggregate.test.ts)

## 18. Files Left Untouched

- [apps/api/src/modules/feeds/feeds-administration.service.ts](apps/api/src/modules/feeds/feeds-administration.service.ts)
- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- [packages/rss/src/lifecycle/coordinator.ts](packages/rss/src/lifecycle/coordinator.ts)

## 19. Architecture Decisions

- Aggregate مسئول تغییر state است، نه validation یا workflow.
- Lifecycle service همچنان نقطهٔ ورود برای transition است.
- Repository و persistence از Aggregate جدا نگه داشته شده‌اند.
- ساختار فعلی با backward compatibility حفظ شده است.

## 20. Technical Debt

- سرویس‌های API همچنان برخی وضعیت‌ها را به‌صورت مستقیم در Prisma و stateStore نگه می‌دارند.
- برای دستیابی به complete centralization، لازم است در مرحله‌های بعدی call sites به‌طور تدریجی به Aggregate هدایت شوند.
- stateStore و configurationStore در ادمین سرویس هنوز به‌صورت موقت و محلی باقی مانده‌اند.

## 21. Risks

- اگر call sites قدیمی در آینده مستقیماً وضعیت را تغییر دهند، Aggregate centralization تضعیف می‌شود.
- برای رسیدن به full DDD، لازم است این Aggregate در لایه‌ی application/service با repository و outbox یکپارچه شود.

## 22. Future Integration Points

- repository implementation
- outbox/event publishing
- CQRS projection
- worker/scheduler integration
- multi-tenant metadata support

## 23. Recommendations for Prompt 7A.6

- Aggregate را به repository و persistence وصل کنید.
- از event publishing برای transitions استفاده کنید.
- در لایه‌ی application، همه‌ی تغییرات lifecycle از Aggregate عبور داده شوند.
- در ادامه، سرویس‌های API و workerها از mutation مستقیم خارج شوند.
