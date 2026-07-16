# Prompt-7A.5 - Feed Lifecycle Domain Service

## 1. Executive Summary

این مستند بازبینی و استانداردسازی سرویس دامنه چرخه‌حیات فید را در مخزن فعلی مستند می‌کند. در این مخزن، زیرسیستم RSS پیش‌تر ساختارهای متعددی برای وضعیت، ماشین حالت، رجیستری انتقال، اجرای انتقال و سرویس چرخه‌حیات فراهم کرده بود. با این حال، مسئولیت اعمال انتقال‌های تأییدشده به Aggregate فید در یک مسیر مرکزی و یکپارچه هنوز به‌صورت کامل در سطح دامنه واحد تجمیع نشده بود. در نسخه فعلی، سرویس چرخه‌حیات موجود در [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts) به‌عنوان منبع واحد برای بررسی و تأیید انتقال‌ها عمل می‌کند و اکنون با یک مسیر دامنه‌ای برای اعمال Mutation روی Aggregate و هماهنگی با Repository تکمیل شده است.

## 2. Repository Audit Findings

| بخش                     | وضعیت                    | شواهد مخزن                                                                                                                                       |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| مدل وضعیت فید           | کامل                     | [packages/rss/src/status/types.ts](packages/rss/src/status/types.ts), [packages/rss/src/status/metadata.ts](packages/rss/src/status/metadata.ts) |
| ماشین حالت چرخه‌حیات    | کامل                     | [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)                                                                 |
| رجیستری انتقال          | کامل                     | [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)                                                                 |
| چارچوب اعتبارسنجی       | کامل                     | [packages/rss/src/lifecycle/validation-registry.ts](packages/rss/src/lifecycle/validation-registry.ts)                                           |
| چارچوب گارد             | کامل                     | [packages/rss/src/lifecycle/guard-registry.ts](packages/rss/src/lifecycle/guard-registry.ts)                                                     |
| لوله‌پردازش انتقال      | کامل                     | [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts)                                                                 |
| موتور تصمیم‌گیری        | کامل                     | [packages/rss/src/lifecycle/decision-engine.ts](packages/rss/src/lifecycle/decision-engine.ts)                                                   |
| مدل فرمان انتقال        | کامل                     | [packages/rss/src/lifecycle/commands.ts](packages/rss/src/lifecycle/commands.ts)                                                                 |
| موتور برنامه‌ریزی اجرا  | کامل                     | [packages/rss/src/lifecycle/planning-engine.ts](packages/rss/src/lifecycle/planning-engine.ts)                                                   |
| هماهنگ‌ساز اجرای انتقال | کامل                     | [packages/rss/src/lifecycle/coordinator.ts](packages/rss/src/lifecycle/coordinator.ts)                                                           |
| لایه Repository         | جزئی                     | [packages/rss/src/repositories/index.ts](packages/rss/src/repositories/index.ts)                                                                 |
| سرویس دامنه چرخه‌حیات   | تکمیل‌شده و استانداردشده | [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)                                                                   |

## 3. Existing Lifecycle Implementations

| مولفه                                                                                  | نقش                             | نتیجه ارزیابی                                                      |
| -------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)         | سرویس اصلی چرخه‌حیات            | تکمیل شده و به‌صورت مرکزی برای اعمال انتقال‌ها به‌کار گرفته می‌شود |
| [packages/rss/src/lifecycle/coordinator.ts](packages/rss/src/lifecycle/coordinator.ts) | اجرای انتقال و مدیریت جریان     | کامل و در حال حاضر در سطح اجرای جریان استفاده می‌شود               |
| [packages/rss/src/lifecycle/pipeline.ts](packages/rss/src/lifecycle/pipeline.ts)       | پردازش و کنار هم قرار دادن اجزا | کامل و در حد ساختارهای آماده استفاده                               |
| [packages/rss/src/repositories/index.ts](packages/rss/src/repositories/index.ts)       | قرارداد repository              | جزئی و فقط قرارداد بارگذاری اولیه را تعریف می‌کند                  |
| [packages/rss/src/entities/index.ts](packages/rss/src/entities/index.ts)               | Aggregate-مثل Entityهای ساده    | محدود و بدون منطق چرخه‌حیات                                        |

## 4. Feed Lifecycle Domain Service

سرویس دامنه‌ای فعلی در [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts) اکنون مسئولیت‌های زیر را بر عهده دارد:

- دریافت فرمان انتقال تأییدشده
- بارگذاری Aggregate یا پذیرش Aggregate از طریق ورودی
- بررسی سازگاری وضعیت Aggregate با وضعیت قبلی مورد انتظار
- اعمال Mutation چرخه‌حیات از طریق متد Aggregate
- هماهنگی با Repository از طریق قرارداد abstraction
- بازگرداندن نتیجه‌ی استاندارد دامنه با متادータ‌های آینده برای رویداد، حسابرسی، متریک و لاگ

این سرویس از بقیه اجزای تصمیم‌گیری و اجرای جریان جدا مانده و فقط در سطح Mutation و هماهنگی Aggregate عمل می‌کند.

## 5. Aggregate Responsibilities

| مسئولیت      | توضیح                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| مالکیت state | Aggregate Root مسئول نگهداری وضعیت فید است                               |
| انتقال‌پذیری | Aggregate باید تغییرات را از طریق متد applyLifecycleTransition اعمال کند |
| invariant    | Aggregate باید اصل سازگاری وضعیت و نسخه را حفظ کند                       |
| یکپارچگی     | Aggregate باید در برابر انتقال‌های ناسازگار از خود دفاع کند              |

## 6. Aggregate Invariants

| invariant       | سطح       | توضیح                                                                                |
| --------------- | --------- | ------------------------------------------------------------------------------------ |
| سازگاری هویت    | Aggregate | شناسه فید نباید در طول انتقال تغییر کند                                              |
| سازگاری وضعیت   | Aggregate | وضعیت جدید باید با انتقال مجاز مطابقت داشته باشد                                     |
| سازگاری نسخه    | Aggregate | نسخه می‌تواند در حین انتقال افزایش یابد ولی نباید به‌صورت غیرقابل‌پیش‌بینی تغییر کند |
| سازگاری متادیتا | Aggregate | متادیتا باید در جریان انتقال حفظ شود                                                 |

## 7. State Mutation Model

| مرحله               | توضیح                                                  |
| ------------------- | ------------------------------------------------------ |
| تأیید انتقال        | سرویس با ماشین حالت بررسی می‌کند که انتقال مجاز است    |
| آماده‌سازی Mutation | اطلاعات قبلی/فعلی، علت، actor و timestamp آماده می‌شود |
| اعمال روی Aggregate | Aggregate با متد applyLifecycleTransition تغییر می‌کند |
| ذخیره‌سازی          | Repository با save هماهنگ می‌شود                       |

## 8. Repository Coordination

| نقش         | قرارداد                                                 |
| ----------- | ------------------------------------------------------- |
| بارگذاری    | Repository.load(id)                                     |
| ذخیره       | Repository.save(aggregate)                              |
| عدم دور زدن | هیچ دسترسی مستقیم به پایگاه داده در این لایه وجود ندارد |

## 9. Domain Result Model

| فیلد                  | نقش                         |
| --------------------- | --------------------------- |
| success               | نتیجه‌ی موفق یا ناموفق      |
| aggregateId           | شناسه Aggregate             |
| previousState         | وضعیت قبل از انتقال         |
| currentState          | وضعیت فعلی پس از انتقال     |
| transitionMetadata    | متادیتا مربوط به انتقال     |
| executionMetadata     | متادیتا مربوط به اجرا       |
| futureEventMetadata   | جایگاه برای رویدادهای آینده |
| futureAuditMetadata   | جایگاه برای حسابرسی آینده   |
| futureMetricsMetadata | جایگاه برای متریک‌های آینده |
| futureLoggingMetadata | جایگاه برای لاگ‌های آینده   |
| repositoryUpdated     | وضعیت ذخیره‌سازی            |

## 10. Failure Model

| کد خطا                          | کاربرد                                 |
| ------------------------------- | -------------------------------------- |
| invalid-state-transition        | انتقالی که در ماشین حالت مجاز نیست     |
| aggregate-not-found             | Aggregate یافت نشد                     |
| aggregate-conflict              | وضعیت Aggregate با انتظار هماهنگ نیست  |
| domain-execution-failure        | خطای هنگام اعمال Mutation در Aggregate |
| persistence-preparation-failure | خطا در save Repository                 |

## 11. Existing Components Reused

- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- [packages/rss/src/lifecycle/commands.ts](packages/rss/src/lifecycle/commands.ts)
- [packages/rss/src/lifecycle/coordinator.ts](packages/rss/src/lifecycle/coordinator.ts)
- [packages/rss/src/status/validation.ts](packages/rss/src/status/validation.ts)
- [packages/rss/src/status/metadata.ts](packages/rss/src/status/metadata.ts)

## 12. Existing Components Extended

- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)
- [packages/rss/src/lifecycle/index.ts](packages/rss/src/lifecycle/index.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)

## 13. New Components

- تست رگرسیون برای مسیر اعمال انتقال در [packages/rss/tests/feed-lifecycle-service.test.ts](packages/rss/tests/feed-lifecycle-service.test.ts)

## 14. Modified Files

- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)
- [packages/rss/src/lifecycle/index.ts](packages/rss/src/lifecycle/index.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)
- [packages/rss/tests/feed-lifecycle-service.test.ts](packages/rss/tests/feed-lifecycle-service.test.ts)

## 15. New Files

- این مستند در مسیر بالا ایجاد شد.

## 16. Files Left Untouched

- اجزای validation، guard، policy، planning و coordinator در سطح منطق تصمیم‌گیری و اجرای workflow بدون تغییر مستقیم باقی ماندند.
- لایه‌های parser، provider، worker، scheduler و frontend دست‌نخورده ماندند.

## 17. Architecture Decisions

- فقط یک سرویس مرکزی برای اعمال lifecycle transition در نظر گرفته شد.
- منطق تصمیم‌گیری و validation در لایه‌های قبلی باقی ماند.
- Aggregate mutation از طریق یک قرارداد مشترک انجام می‌شود.
- Repository به‌صورت abstraction و نه مستقیم در سرویس استفاده می‌شود.

## 18. Technical Debt

- Repository قرارداد فعلی بسیار ساده است و برای محیط production باید با مدل واقعی Feed Aggregate و persistence adapter تکمیل شود.
- Aggregate واقعی فید در این مخزن هنوز به‌صورت کامل در لایه دامنه موجود نیست.
- برای یکپارچگی کامل با outbox/event bus، نیاز به ارتقای قراردادهای متادیتا و result وجود دارد.

## 19. Risks

- اگر Aggregate واقعی در سرویس‌های بالاتر متفاوت باشد، ممکن است نیاز به adapter وجود داشته باشد.
- اگر repository واقعی با این قرارداد هم‌خوانی نداشته باشد، باید یک adapter اضافه شود.
- در حال حاضر فقط مسیر Mutation و Persistence پایه پیاده‌سازی شده است.

## 20. Future Integration Points

- Event Bus
- Outbox Pattern
- CQRS
- Worker/Scheduler
- Retry Engine
- Monitoring و Metrics
- Audit Log

## 21. Recommendations for Prompt 7A.6

- قرارداد Aggregate واقعی فید را با مدل دامین کامل جایگزین کنید.
- Repository واقعی را به این سرویس متصل کنید.
- برای هر transition یک event domain به‌صورت استاندارد تولید کنید.
- مسیر optimistic concurrency را برای نسخه‌ی Aggregate آماده کنید.
- متادیتاهای آینده را به‌صورت schema‌دار استاندارد کنید.
