# Prompt-7A.2.1 - مستند ثبت‌نام و متادیتا‌ی رجیستری انتقال چرخه حیات فید

## 1. Executive Summary

این بازبینی نشان داد که در مخزن، ساختار چرخه حیات فید از قبل در قالب سرویس و رجیستری محلی وجود دارد، اما مدل انتقال‌ها هنوز به‌صورت متمرکز و استانداردشده در قالب یک قرارداد مشترک ارائه نشده بود. در نسخه‌ی فعلی، تعریف انتقال‌ها در یک آرایه‌ی محلی در بسته‌ی RSS قرار داشت و سرویس چرخه حیات به‌صورت مستقیم بر روی منطق سازمان‌یافته‌ی خود عمل می‌کرد. این ساختار برای استفاده‌ی آینده قابل‌استفاده بود، اما برای تبدیل شدن به منبع واحد حقیقت در مورد انتقال‌های مجاز، نیازمند یک‌پارچه‌سازی، استانداردسازی و فراهم‌سازی API برای دسترسی و جست‌وجو بود.

در این اجرای انجام‌شده، رجیستری انتقال به‌صورت متمرکز و قابل‌استفاده دوباره طراحی شد و به‌عنوان منبع مرجع برای تعریف‌های انتقال، دسته‌بندی، نوع، دیدپذیری و متادیتای آتی در نظر گرفته شد. همچنین دسترسی‌های لازم برای بازیابی انتقال، انتقال‌های مجاز برای یک وضعیت، و انتقال‌های بازیابی ارائه شد. رفتار سرویس چرخه حیات با حفظ سازگاری قبلی، به این رجیستری وابسته شده است.

## 2. Repository Audit Findings

### یافته‌های کلیدی

- در بسته‌ی RSS، مدل وضعیت فید از قبل در [packages/rss/src/status/types.ts](packages/rss/src/status/types.ts) و [packages/rss/src/status/metadata.ts](packages/rss/src/status/metadata.ts) تعریف شده است.
- در [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts) یک رجیستری انتقال داخلی وجود داشت که انتقال‌های مجاز را تعریف می‌کرد.
- در [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts) منطق اعتبارسنجی و محدودیت‌های تجاری برای چرخه حیات وجود داشت.
- در [packages/rss/tests/feed-lifecycle-service.test.ts](packages/rss/tests/feed-lifecycle-service.test.ts) تست‌هایی برای بررسی رفتار چرخه حیات و دسترسی به رجیستری وجود داشت.

### نتیجه‌ی بازبینی

- تعریف انتقال‌ها در یک محل متمرکز وجود داشت، اما مدل آن محدود و غیر استاندارد بود.
- متادیتای انتقال در سطح رجیستری وجود نداشت.
- هیچ قرارداد سطحی برای دسترسی به انتقال‌های مجاز یا انتقال‌های بازیابی وجود نداشت.
- سرویس چرخه حیات به‌صورت جزئی از منطق داخلی خود استفاده می‌کرد و هنوز به‌طور کامل به رجیستری به‌عنوان منبع حقیقت وابسته نشده بود.

## 3. Existing Transition Definitions

در نسخه‌ی اولیه، انتقال‌های زیر در رجیستری موجود مطرح بودند:

| شناسه انتقال                 | از          | به                | نوع            | دسته           | توضیح                      |
| ---------------------------- | ----------- | ----------------- | -------------- | -------------- | -------------------------- |
| new.registered               | NEW         | REGISTERED        | normal         | lifecycle      | ثبت اولیه فید              |
| new.deleted                  | NEW         | DELETED           | administrative | administrative | حذف فید جدید               |
| registered.validating        | REGISTERED  | VALIDATING        | normal         | operational    | شروع اعتبارسنجی            |
| validating.validation-failed | VALIDATING  | VALIDATION_FAILED | failure        | failure        | شکست اعتبارسنجی            |
| ready.importing              | READY       | IMPORTING         | normal         | operational    | شروع واردکردن              |
| importing.import-failed      | IMPORTING   | IMPORT_FAILED     | failure        | failure        | شکست واردکردن              |
| active.syncing               | ACTIVE      | SYNCING           | normal         | operational    | شروع همگام‌سازی            |
| syncing.sync-failed          | SYNCING     | SYNC_FAILED       | failure        | failure        | شکست همگام‌سازی            |
| sync-failed.active           | SYNC_FAILED | ACTIVE            | recovery       | recovery       | بازیابی از شکست همگام‌سازی |
| active.archived              | ACTIVE      | ARCHIVED          | administrative | administrative | آرشیو فید                  |

این انتقال‌ها در نسخه‌ی جدید با متادیتا و قرارداد استاندارد بازتعریف شدند.

## 4. Canonical Transition Registry

رجیستری انتقال canonical در [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts) پیاده‌سازی شد. این رجیستری به‌صورت یک ساختار Immutable و Cacheable طراحی شده و تنها یک منبع مرجع برای انتقال‌های فید است.

### ویژگی‌های اصلی

- تعریف‌های انتقال در یک محل مرکزی نگهداری می‌شوند.
- هر انتقال دارای شناسه، منبع، مقصد، نام قابل‌نمایش، توضیح، دسته، نوع، دیدپذیری و متادیتای عملیاتی است.
- دسترسی به انتقال‌ها از طریق توابع مشخصی انجام می‌شود.
- منطق ماشین حالت از روی این رجیستری استخراج می‌شود.

## 5. Transition Inventory

| شناسه                        | از                | به                | دسته           | نوع            | بازیابی‌پذیر | نیازمند اعتبارسنجی |
| ---------------------------- | ----------------- | ----------------- | -------------- | -------------- | ------------ | ------------------ |
| new.registered               | NEW               | REGISTERED        | lifecycle      | normal         | خیر          | خیر                |
| new.deleted                  | NEW               | DELETED           | administrative | administrative | خیر          | خیر                |
| registered.validating        | REGISTERED        | VALIDATING        | operational    | normal         | خیر          | بله                |
| validating.validation-failed | VALIDATING        | VALIDATION_FAILED | failure        | failure        | بله          | بله                |
| validation-failed.ready      | VALIDATION_FAILED | READY             | recovery       | recovery       | بله          | خیر                |
| ready.importing              | READY             | IMPORTING         | operational    | normal         | خیر          | خیر                |
| importing.import-failed      | IMPORTING         | IMPORT_FAILED     | failure        | failure        | بله          | خیر                |
| active.syncing               | ACTIVE            | SYNCING           | operational    | normal         | خیر          | خیر                |
| syncing.sync-failed          | SYNCING           | SYNC_FAILED       | failure        | failure        | بله          | خیر                |
| sync-failed.active           | SYNC_FAILED       | ACTIVE            | recovery       | recovery       | بله          | خیر                |
| active.archived              | ACTIVE            | ARCHIVED          | administrative | administrative | خیر          | خیر                |

## 6. Transition Metadata Model

مدل متادیتا در [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts) تعریف شده است. این مدل شامل موارد زیر است:

- شناسه انتقال
- منبع و مقصد
- نام قابل‌نمایش
- توضیح
- دسته
- نوع
- دیدپذیری
- قصد عملیاتی
- Severity
- Priority
- Recoverable
- Terminal
- Requires Validation
- Supports Retry
- Supports Recovery
- Supports Scheduling
- Supports Automation
- نام رویداد/متریک/آدیت/اعلان/صف در آینده

## 7. Transition Categories

دسته‌بندی‌های استاندارد شده در این نسخه شامل موارد زیر است:

| دسته           | کاربرد                       |
| -------------- | ---------------------------- |
| lifecycle      | انتقال‌های هسته‌ای چرخه حیات |
| operational    | انتقال‌های عملیاتی و پردازشی |
| administrative | انتقال‌های مدیریتی           |
| recovery       | انتقال‌های بازیابی           |
| failure        | انتقال‌های خطا               |
| system         | برای ادغام آیندهٔ سیستم      |
| user-initiated | برای رویدادهای کاربرمحور     |
| automated      | برای خودکارسازی              |
| scheduled      | برای زمان‌بندی آینده         |
| background     | برای پردازش پس‌زمینه         |

## 8. Transition Types

انواع استاندارد شده:

| نوع            | کاربرد         |
| -------------- | -------------- |
| normal         | انتقال عادی    |
| failure        | انتقال خطا     |
| recovery       | انتقال بازیابی |
| maintenance    | انتقال نگهداری |
| administrative | انتقال اداری   |
| migration      | انتقال مهاجرت  |
| terminal       | انتقال پایانی  |

## 9. Transition Visibility Model

دیدپذیری‌ها به‌صورت استاندارد در این نسخه تعریف شدند:

| دیدپذیری       | کاربرد                              |
| -------------- | ----------------------------------- |
| public         | برای مصرف عمومی                     |
| internal       | برای مصرف داخلی                     |
| administrative | برای عملیات مدیریتی                 |
| system         | برای مصرف سیستم و لایه‌های زیرساختی |

## 10. Registry Contract

قرارداد دسترسی به رجیستری از طریق توابع زیر در دسترس است:

- getFeedLifecycleTransitionRegistry
- getFeedLifecycleTransitionDefinitions
- getFeedLifecycleTransitionById
- getAllowedTransitions
- getRecoveryTransitions
- getFeedLifecycleTransitionCategories
- getFeedLifecycleTransitionTypes

این قرارداد برای مصرف‌کننده‌های آینده مانند خدمات چرخه حیات، Guard Engine، Retry Engine، Scheduler و Dashboard طراحی شده است.

## 11. Lookup Strategy

استراتژی جست‌وجو در این اجرا ساده و مستقیم است:

- برای یافتن یک انتقال با شناسه، از getFeedLifecycleTransitionById استفاده می‌شود.
- برای یافتن انتقال‌های مجاز از یک وضعیت، از getAllowedTransitions استفاده می‌شود.
- برای یافتن انتقال‌های بازیابی، از getRecoveryTransitions استفاده می‌شود.
- برای دسترسی به ماشین حالت، از getFeedLifecycleStateMachine استفاده می‌شود.

## 12. Consistency Analysis

### سازگاری با مدل وضعیت

مدل وضعیت در [packages/rss/src/status/types.ts](packages/rss/src/status/types.ts) و [packages/rss/src/status/metadata.ts](packages/rss/src/status/metadata.ts) با رجیستری انتقال هماهنگ است.

### سازگاری با سرویس چرخه حیات

سرویس [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts) حالا از رجیستری برای تشخیص مجاز بودن انتقال استفاده می‌کند و از منطق داخلی مستقل برای تعیین مجوز انتقال استفاده نمی‌کند.

### سازگاری با تست‌ها

تست‌های [packages/rss/tests/feed-lifecycle-service.test.ts](packages/rss/tests/feed-lifecycle-service.test.ts) برای بررسی رجیستری و انتقال‌های مجاز به‌روزرسانی شدند.

## 13. Existing Components Reused

- [packages/rss/src/status/metadata.ts](packages/rss/src/status/metadata.ts)
- [packages/rss/src/status/types.ts](packages/rss/src/status/types.ts)
- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [packages/rss/tests/feed-lifecycle-service.test.ts](packages/rss/tests/feed-lifecycle-service.test.ts)

## 14. Existing Components Extended

- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)

## 15. New Components

- تابع ایجاد انتقال استاندارد در رجیستری
- توابع lookup برای انتقال‌ها
- متادیتای استاندارد برای انتقال‌ها

## 16. Modified Files

- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)
- [packages/rss/tests/feed-lifecycle-service.test.ts](packages/rss/tests/feed-lifecycle-service.test.ts)

## 17. New Files

- [Prompt-7A.2.1-Transition-Registry-Metadata.md](Prompt-7A.2.1-Transition-Registry-Metadata.md)

## 18. Files Left Untouched

- منطق Parser
- منطق Provider
- منطق Import
- منطق Synchronization
- منطق Worker
- منطق Retry
- منطق Scheduler
- منطق Monitoring

## 19. Architecture Decisions

1. رجیستری انتقال به‌عنوان منبع واحد حقیقت در نظر گرفته شد.
2. متادیتا به‌صورت Immutable و متمرکز تعریف شد.
3. قرارداد lookup برای مصرف‌کننده‌های آینده فراهم شد.
4. سرویس چرخه حیات به‌صورت سازگار با رفتار قبلی باقی ماند.

## 20. Technical Debt

- برخی لایه‌های بالادستی هنوز به‌طور مستقیم از منطق داخلی خدمات استفاده می‌کنند و نیازمند مهاجرت به رجیستری در آینده هستند.
- دسته‌بندی‌های نهایی برای مصرف لایه‌های Dashboard و Monitoring هنوز می‌توانند در آینده گسترش یابند.

## 21. Risks

- در صورت اضافه شدن وضعیت‌های جدید، لازم است انتقال‌های مرتبط در رجیستری تکمیل شوند.
- لایه‌های بالادستی باید از این قرارداد استفاده کنند تا دوقلوی منطق انتقالی ایجاد نشود.

## 22. Future Integration Points

- Guard Engine
- Policy Engine
- Retry Engine
- Worker Layer
- Scheduler
- Monitoring
- Dashboard
- Event Bus
- Audit Log

## 23. Recommendations for Prompt 7A.3

- انتقال‌های جدید باید فقط از طریق رجیستری تعریف شوند.
- هر لایه‌ی آینده باید از توابع lookup رجیستری استفاده کند.
- در مرحله‌ی بعدی، Guard و Policy باید به این قرارداد متصل شوند تا منطق تصمیم‌گیری از روی رجیستری استخراج شود.
