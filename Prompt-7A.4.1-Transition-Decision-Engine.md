# مستند موتور تصمیم‌گیری انتقال چرخه‌عمر فید

## 1. خلاصه اجرایی

در این بازبینی، لایه‌ی تصمیم‌گیری انتقال در ماژول RSS Lifecycle به‌صورت متمرکز و قابل‌استفاده مجدد پیاده‌سازی شد. پایگاه کد پیش‌تر دارای مراحل اعتبارسنجی، گارد و سیاست بود، اما خروجی این مراحل در یک نقطه‌ی واحد به تصمیم نهایی تبدیل نمی‌شد. این شکاف با افزودن یک موتور تصمیم‌گیری متمرکز پر شد تا تنها این موتور مسئولAggregation و تولید تصمیم نهایی باشد و هیچ سرویس دیگری به‌طور مستقل تصمیم نهایی را تشکیل ندهد.

این پیاده‌سازی بر اساس معماری موجود انجام شد و هیچ‌گونه منطق کسب‌وکار جدیدی به موتور اضافه نشد. موتور فقط نتایج مرحله‌های قبلی را جمع‌آوری، نرمال‌سازی و به یک تصمیم قطعی تبدیل می‌کند.

## 2. یافته‌های ممیزی مخزن

| حوزه                      | وضعیت       | شواهد مخزن                                             |
| ------------------------- | ----------- | ------------------------------------------------------ |
| مدل وضعیت چرخه‌عمر فید    | کامل        | فایل‌های مربوط به وضعیت و رجیستری در پوشه lifecycle    |
| ماشین حالت انتقال         | کامل        | فایل‌های registry و service                            |
| رجیستری انتقال            | کامل        | packages/rss/src/lifecycle/registry.ts                 |
| چارچوب اعتبارسنجی         | کامل        | packages/rss/src/lifecycle/validation-registry.ts      |
| چارچوب گارد               | کامل        | packages/rss/src/lifecycle/guard-registry.ts           |
| موتور سیاست چرخه‌عمر      | کامل        | packages/rss/src/lifecycle/policy-engine.ts            |
| خط لوله پردازش انتقال     | کامل        | packages/rss/src/lifecycle/pipeline.ts                 |
| موتور تصمیم‌گیری انتقال   | جدید و کامل | packages/rss/src/lifecycle/decision-engine.ts          |
| منطق تصمیم‌گیری توزیع‌شده | جزئی        | در لایه‌ی pipeline و service وجود داشت اما متمرکز نبود |
| منطق تصمیم‌گیری تکراری    | وجود داشت   | در pipeline و service به‌صورت پراکنده و غیر استاندارد  |

## 3. منطق تصمیم‌گیری موجود

در نسخه‌ی اولیه، چند منطق تصمیم‌گیری در مسیرهای زیر یافت شد:

- اعتبارسنجی در سطح خط لوله با خروجی success/failure
- بررسی گارد با خروجی allowed/blocked
- ارزیابی سیاست با خروجی allowed/rejected/deferred
- سرویس lifecycle که تصمیم را در سطح عملیاتی و نه در سطح قرارداد استاندارد بازتاب می‌داد

این منطق در قالب‌های مختلف در دسترس بود اما هیچ‌کدام مسئول نهایی‌سازی تصمیم نبودند. به همین دلیل، یک قرارداد واحد برای خروجی تصمیم، یک context مشترک و یک الگوریتم Aggregation متمرکز ضروری بود.

## 4. موتور تصمیم‌گیری انتقال

موتور جدید در فایل زیر اضافه شد:

- packages/rss/src/lifecycle/decision-engine.ts

این موتور فقط مسئول موارد زیر است:

- جمع‌آوری نتایج Validation، Guard و Policy
- نرمال‌سازی خروجی‌های مرحله‌ها
- ایجاد یک تصمیم قطعی با چهار نوع ممکن: ALLOW، REJECT، DEFER، CANCEL
- تولید متادیتا و متریک‌های آینده بدون اجرای انتقال

موتور هیچ‌وقت:

- وضعیت فید را تغییر نمی‌دهد
- انتقال را اجرا نمی‌کند
- پایگاه داده یا repository را لمس نمی‌کند
- سیاست‌های کسب‌وکار را مستقیماً ارزیابی نمی‌کند

## 5. قراردادهای تصمیم

| آیتم                       | نوع    | توضیح                                                     |
| -------------------------- | ------ | --------------------------------------------------------- |
| decisionId                 | string | شناسه‌ی یکتا برای هر تصمیم                                |
| decisionType               | enum   | ALLOW / REJECT / DEFER / CANCEL                           |
| decisionReason             | string | دلیل تصمیم نهایی                                          |
| decisionCategory           | enum   | aggregation / validation / guard / policy / configuration |
| decisionSeverity           | enum   | info / warning / critical / administrative / emergency    |
| decisionPriority           | enum   | standard / blocking / deferred / override                 |
| decisionConfidence         | number | سطح اطمینان تصمیم                                         |
| evaluationTimestamp        | string | زمان ارزیابی                                              |
| executionIdentifier        | string | شناسه‌ی اجرای خط لوله                                     |
| correlationIdentifier      | string | شناسه‌ی همبستگی درخواست                                   |
| transitionIdentifier       | string | شناسه‌ی انتقال                                            |
| sourceState / targetState  | string | وضعیت اولیه و مقصد                                        |
| validationSummary          | object | خلاصه‌ی نتیجه اعتبارسنجی                                  |
| guardSummary               | object | خلاصه‌ی نتیجه گارد                                        |
| policySummary              | object | خلاصه‌ی نتیجه سیاست                                       |
| metadata                   | object | متادیتای مشترک                                            |
| futureRetryMetadata        | object | نقطه‌ی توسعه برای Retry Engine                            |
| futureRecoveryMetadata     | object | نقطه‌ی توسعه برای Recovery Engine                         |
| futureNotificationMetadata | object | نقطه‌ی توسعه برای Notification                            |
| futureAuditMetadata        | object | نقطه‌ی توسعه برای Audit                                   |
| futureMetricsMetadata      | object | نقطه‌ی توسعه برای Metrics                                 |
| futureLoggingMetadata      | object | نقطه‌ی توسعه برای Logging                                 |

## 6. Context تصمیم

Context مشترک در موتور شامل موارد زیر است:

| بخش                                        | مثال                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| request                                    | اطلاعات انتقال فید شامل feedId، currentState، targetState، actor و reason |
| transitionDefinition                       | تعریف انتقال از رجیستری                                                   |
| executionIdentifier                        | شناسه‌ی اجرای خط لوله                                                     |
| correlationIdentifier                      | شناسه‌ی همبستگی درخواست                                                   |
| validationResult                           | خروجی مرحله‌ی اعتبارسنجی                                                  |
| guardResult                                | خروجی مرحله‌ی گارد                                                        |
| policyResult                               | خروجی مرحله‌ی سیاست                                                       |
| repositorySnapshot                         | نقطه‌ی توسعه برای snapshot مخزن                                           |
| configuration / environment / featureFlags | تنظیمات و قابلیت‌ها                                                       |
| metadata                                   | اطلاعات اضافی برای آینده                                                  |

## 7. جریان Aggregation تصمیم

فلوچارت منطقی به‌صورت زیر است:

1. دریافت نتایج مراحل Validation، Guard و Policy
2. بررسی وجود داده‌های لازم
3. اگر Validation شکست خورد، تصمیم REJECT صادر می‌شود
4. اگر Guard شکست خورد، تصمیم REJECT صادر می‌شود
5. اگر Policy deferred باشد، تصمیم DEFER صادر می‌شود
6. اگر Policy rejected باشد، تصمیم REJECT صادر می‌شود
7. در صورت قبول همه‌ی مراحل، تصمیم ALLOW صادر می‌شود

این جریان Deterministic است و بر اساس ترتیب تعریف‌شده اجرا می‌شود.

## 8. مدل نتیجه تصمیم

| نوع تصمیم | زمان استفاده                             |
| --------- | ---------------------------------------- |
| ALLOW     | همه‌ی مراحل با موفقیت عبور کردند         |
| REJECT    | اعتبارسنجی، گارد یا سیاست مانع ایجاد شد  |
| DEFER     | سیاست به‌صورت موقت مانع را اعلام کرد     |
| CANCEL    | داده‌های لازم برای تصمیم‌گیری موجود نبود |

## 9. مدل اولویت تصمیم

| اولویت                  | کاربرد                             |
| ----------------------- | ---------------------------------- |
| standard                | تصمیم عادی و قابل ادامه            |
| blocking                | تصمیمی که جریان را متوقف می‌کند    |
| warning                 | تصمیم هشداردهنده                   |
| deferred                | تصمیم معلق برای ارزیابی آینده      |
| administrative-override | نقطه‌ی توسعه برای override اداری   |
| emergency-override      | نقطه‌ی توسعه برای override اضطراری |
| maintenance-override    | نقطه‌ی توسعه برای override نگهداری |

## 10. مدل خطا

| نوع خطا                      | کاربرد                        |
| ---------------------------- | ----------------------------- |
| DecisionConflict             | تعارض در خروجی مراحل مختلف    |
| IncompleteEvaluation         | ارزیابی ناقص                  |
| MissingValidationResult      | نتیجه‌ی اعتبارسنجی ارائه نشده |
| MissingGuardResult           | نتیجه‌ی گارد ارائه نشده       |
| MissingPolicyResult          | نتیجه‌ی سیاست ارائه نشده      |
| DecisionAggregationFailure   | خطا در جمع‌آوری یا نرمال‌سازی |
| UnexpectedDecisionState      | وضعیت غیرمنتظره در تصمیم      |
| DecisionConfigurationFailure | خطای پیکربندی موتور           |

## 11. اجزای موجودی که استفاده شدند

- packages/rss/src/lifecycle/validation-registry.ts
- packages/rss/src/lifecycle/guard-registry.ts
- packages/rss/src/lifecycle/policy-engine.ts
- packages/rss/src/lifecycle/pipeline.ts
- packages/rss/src/lifecycle/service.ts
- packages/rss/src/lifecycle/registry.ts
- packages/rss/src/lifecycle/types.ts

## 12. اجزای موجودی که توسعه یافتند

- pipeline lifecycle برای افزودن مرحله‌ی decision
- قراردادهای lifecycle برای پشتیبانی از Decision Result
- export‌های index برای در دسترس بودن موتور در سطح بسته

## 13. اجزای جدید

- packages/rss/src/lifecycle/decision-engine.ts
- tests/transition-decision-engine.test.ts

## 14. فایل‌های اصلاح‌شده

- packages/rss/src/lifecycle/index.ts
- packages/rss/src/lifecycle/pipeline.ts

## 15. فایل‌های جدید

- packages/rss/src/lifecycle/decision-engine.ts
- packages/rss/tests/transition-decision-engine.test.ts
- Prompt-7A.4.1-Transition-Decision-Engine.md

## 16. فایل‌های دست‌نخورده

بخش‌های زیر به‌صورت intentional دست‌نخورده باقی ماندند تا از بازطراحی گسترده جلوگیری شود:

- packages/rss/src/lifecycle/registry.ts
- packages/rss/src/lifecycle/validation-registry.ts
- packages/rss/src/lifecycle/guard-registry.ts
- packages/rss/src/lifecycle/policy-engine.ts
- packages/rss/src/lifecycle/service.ts
- packages/rss/src/lifecycle/errors.ts

## 17. تصمیمات معماری

- تصمیم‌گیری در یک نقطه‌ی واحد متمرکز شد.
- موتور تصمیم‌گیری Stateless و بدون side effect طراحی شد.
- منطق کسب‌وکار در موتور قرار نگرفت.
- خط لوله‌ی موجود حفظ شد و به‌جای تعویض، تکمیل شد.
- از Dependency Injection و Composition استفاده شد.

## 18. بدهی فنی

- موتور فعلی برای ادغام با Retry، Recovery، Monitoring و Event Bus آماده است اما هنوز این ادغام‌ها فعال نشده‌اند.
- خروجی‌های آینده برای notification و audit به‌صورت placeholder ارائه شده‌اند.
- سیاست‌های خاص کسب‌وکار هنوز در موتور تصمیم‌گیری مستقیماً پیاده‌سازی نشده‌اند و فقط به‌عنوان extension point آماده شده‌اند.

## 19. ریسک‌ها

| ریسک                        | توضیح                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| ادغام با سرویس‌های آینده    | اگر Retry یا Recovery به‌صورت جدی به موتور وصل شوند، نیاز به گسترش metadata و contract وجود دارد |
| تغییر قراردادهای خارجی      | اگر لایه‌ی بالاتر قراردادهای جدیدی بخواهد، contract باید تکمیل شود                               |
| شکاف بین pipeline و service | اگر service از این موتور به‌صورت مستقیم استفاده نکند، منطق دوباره ممکن است تکرار شود             |

## 20. نقاط ادغام آینده

- Retry Engine
- Recovery Engine
- Workers
- BullMQ
- Scheduler
- Monitoring و Metrics
- Dashboard
- Notifications
- Audit Log
- Event Bus
- Feature Flags
- Provider Plugins
- Multi-Tenant و Subscription Plans

## 21. توصیه‌ها برای Prompt 7A.5

- قرارداد تصمیم‌گیری را در سطح بسته‌ی RSS و لایه‌های بالاتر مستندسازی و استانداردسازی شود.
- ادغام با Retry و Recovery Engine در مرحله‌ی بعدی انجام شود.
- برای Dashboard و Monitoring، خروجی‌های تصمیم با ساختار قابل‌استعلام آماده شوند.
- برای Event Bus و Notification، metadata‌ی آینده به‌صورت schema‌دار استاندارد شود.
