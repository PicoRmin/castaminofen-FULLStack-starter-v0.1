# Prompt-7A.2-Feed-Lifecycle-State-Machine

## 1. Executive Summary

این مستند به‌عنوان گزارش ممیزی و یکپارچه‌سازی ماشین حالت چرخه حیات فید در مخزن ارائه می‌شود. بر اساس بررسی‌های انجام‌شده، مدل وضعیت فید در بسته RSS از قبل وجود داشت، اما تعریف انتقال‌ها در سرویس چرخه حیات به‌صورت درون‌خطی و بدون رجیستری متمرکز پیاده‌سازی شده بود. این تغییر، یک منبع واحد برای تعریف وضعیت‌ها، انتقال‌ها و طبقه‌بندی‌ها ایجاد می‌کند و سرویس چرخه حیات را به این مدل مرجع متصل می‌کند.

## 2. Repository Audit Findings

| حوزه              | وضعیت    | شواهد در مخزن                                                                                                                                                                        |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| مدل وضعیت فید     | COMPLETE | فایل‌های [packages/rss/src/status/types.ts](packages/rss/src/status/types.ts) و [packages/rss/src/status/metadata.ts](packages/rss/src/status/metadata.ts)                           |
| سرویس چرخه حیات   | PARTIAL  | [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)                                                                                                       |
| رجیستری انتقال‌ها | MISSING  | در نسخه قبلی انتقال‌ها درون سرویس تعریف شده بودند                                                                                                                                    |
| ماشین حالت متمرکز | PARTIAL  | [packages/rss/src/synchronization/state-machine/feed-state-machine.ts](packages/rss/src/synchronization/state-machine/feed-state-machine.ts) فقط برای حالت همگام‌سازی استفاده می‌شود |
| API و DTO‌ها      | PARTIAL  | [apps/api/src/modules/feeds/feeds-administration.service.ts](apps/api/src/modules/feeds/feeds-administration.service.ts)                                                             |
| مستندات           | COMPLETE | [Prompt-7A-Feed-Lifecycle-State-Machine.md](Prompt-7A-Feed-Lifecycle-State-Machine.md)                                                                                               |

## 3. Existing Lifecycle Implementations

| مؤلفه                              | نوع        | وضعیت    |
| ---------------------------------- | ---------- | -------- |
| FeedLifecycleService               | سرویس      | PARTIAL  |
| FeedStatus metadata                | متادیتا    | COMPLETE |
| FeedStateMachine (synchronization) | ماشین حالت | PARTIAL  |
| FeedStateManager                   | مدیر حالت  | PARTIAL  |
| API feed administration            | ادغام      | PARTIAL  |

## 4. Canonical State Machine

ماشین حالت مرجع برای فیدها بر اساس وضعیت‌های استاندارد زیر است:

- NEW
- REGISTERED
- VALIDATING
- VALIDATION_FAILED
- READY
- IMPORTING
- IMPORT_FAILED
- ACTIVE
- SYNCING
- SYNC_FAILED
- PAUSED
- DISABLED
- ARCHIVED
- DELETED

## 5. State Definitions

| State             | طبقه‌بندی      | پایانی | بازیاب‌پذیر | هدف عملیاتی                  |
| ----------------- | -------------- | ------ | ----------- | ---------------------------- |
| NEW               | initial        | خیر    | خیر         | ایجاد اولیه فید              |
| REGISTERED        | initial        | خیر    | خیر         | ثبت اولیه                    |
| VALIDATING        | temporary      | خیر    | خیر         | اعتبارسنجی در حال اجرا       |
| VALIDATION_FAILED | failure        | خیر    | بله         | شکست اعتبارسنجی              |
| READY             | operational    | خیر    | خیر         | آماده برای ورود یا فعال‌سازی |
| IMPORTING         | temporary      | خیر    | خیر         | واردکردن محتوا               |
| IMPORT_FAILED     | failure        | خیر    | بله         | شکست ورود                    |
| ACTIVE            | operational    | خیر    | بله         | فعالیت فعال                  |
| SYNCING           | temporary      | خیر    | خیر         | همگام‌سازی در حال اجرا       |
| SYNC_FAILED       | failure        | خیر    | بله         | شکست همگام‌سازی              |
| PAUSED            | administrative | خیر    | بله         | توقف موقت                    |
| DISABLED          | administrative | خیر    | بله         | غیرفعال                      |
| ARCHIVED          | terminal       | بله    | خیر         | بایگانی                      |
| DELETED           | terminal       | بله    | خیر         | حذف منطقی                    |

## 6. Transition Graph

| From              | To                | شناسه انتقال                 | هدف عملیاتی      |
| ----------------- | ----------------- | ---------------------------- | ---------------- |
| NEW               | REGISTERED        | new.registered               | ثبت اولیه        |
| NEW               | DELETED           | new.deleted                  | حذف اولیه        |
| REGISTERED        | VALIDATING        | registered.validating        | شروع اعتبارسنجی  |
| REGISTERED        | READY             | registered.ready             | تکمیل اعتبارسنجی |
| REGISTERED        | DISABLED          | registered.disabled          | غیرفعال‌سازی     |
| VALIDATING        | READY             | validating.ready             | تکمیل اعتبارسنجی |
| VALIDATING        | VALIDATION_FAILED | validating.validation-failed | شکست اعتبارسنجی  |
| VALIDATION_FAILED | VALIDATING        | validation-failed.validating | تلاش مجدد        |
| VALIDATION_FAILED | READY             | validation-failed.ready      | بازیابی          |
| READY             | IMPORTING         | ready.importing              | شروع ورود        |
| READY             | ACTIVE            | ready.active                 | فعال‌سازی        |
| READY             | DISABLED          | ready.disabled               | غیرفعال‌سازی     |
| IMPORTING         | ACTIVE            | importing.active             | تکمیل ورود       |
| IMPORTING         | IMPORT_FAILED     | importing.import-failed      | شکست ورود        |
| ACTIVE            | SYNCING           | active.syncing               | شروع همگام‌سازی  |
| ACTIVE            | PAUSED            | active.paused                | توقف موقت        |
| ACTIVE            | DISABLED          | active.disabled              | غیرفعال‌سازی     |
| SYNCING           | ACTIVE            | syncing.active               | پایان همگام‌سازی |
| SYNCING           | SYNC_FAILED       | syncing.sync-failed          | شکست همگام‌سازی  |
| SYNC_FAILED       | ACTIVE            | sync-failed.active           | بازیابی          |
| SYNC_FAILED       | READY             | sync-failed.ready            | بازیابی          |
| PAUSED            | ACTIVE            | paused.active                | ادامه فعالیت     |
| DISABLED          | ACTIVE            | disabled.active              | فعال‌سازی دوباره |
| ARCHIVED          | ACTIVE            | archived.active              | بازیابی          |
| ARCHIVED          | DELETED           | archived.deleted             | حذف              |
| ACTIVE            | ARCHIVED          | active.archived              | بایگانی          |
| ACTIVE            | READY             | active.ready                 | بازگشت به آماده  |
| READY             | ARCHIVED          | ready.archived               | بایگانی          |
| READY             | DELETED           | ready.deleted                | حذف              |
| ACTIVE            | DELETED           | active.deleted               | حذف              |
| PAUSED            | DELETED           | paused.deleted               | حذف              |
| DISABLED          | DELETED           | disabled.deleted             | حذف              |
| ARCHIVED          | READY             | archived.ready               | بازسازی          |

## 7. Transition Matrix

| From              | To                | نوع انتقال     | توضیح            |
| ----------------- | ----------------- | -------------- | ---------------- |
| NEW               | REGISTERED        | automatic      | ثبت اولیه        |
| NEW               | DELETED           | administrative | حذف اولیه        |
| REGISTERED        | VALIDATING        | automatic      | شروع اعتبارسنجی  |
| REGISTERED        | READY             | automatic      | اعتبارسنجی موفق  |
| VALIDATING        | READY             | automatic      | اعتبارسنجی موفق  |
| VALIDATING        | VALIDATION_FAILED | failure        | شکست اعتبارسنجی  |
| VALIDATION_FAILED | READY             | recovery       | بازیابی          |
| READY             | IMPORTING         | automatic      | شروع ورود        |
| READY             | ACTIVE            | automatic      | فعال‌سازی        |
| IMPORTING         | ACTIVE            | automatic      | ورود موفق        |
| IMPORTING         | IMPORT_FAILED     | failure        | شکست ورود        |
| ACTIVE            | SYNCING           | automatic      | شروع همگام‌سازی  |
| ACTIVE            | PAUSED            | administrative | توقف موقت        |
| SYNCING           | ACTIVE            | automatic      | پایان همگام‌سازی |
| SYNCING           | SYNC_FAILED       | failure        | شکست همگام‌سازی  |
| PAUSED            | ACTIVE            | administrative | ادامه            |
| DISABLED          | ACTIVE            | administrative | بازفعالسازی      |
| ARCHIVED          | ACTIVE            | administrative | بازسازی          |

## 8. State Classification

| طبقه‌بندی      | وضعیت‌ها                                      |
| -------------- | --------------------------------------------- |
| initial        | NEW, REGISTERED                               |
| operational    | READY, ACTIVE                                 |
| temporary      | VALIDATING, IMPORTING, SYNCING                |
| failure        | VALIDATION_FAILED, IMPORT_FAILED, SYNC_FAILED |
| administrative | PAUSED, DISABLED                              |
| terminal       | ARCHIVED, DELETED                             |

## 9. Transition Classification

| نوع            | کاربرد                    |
| -------------- | ------------------------- |
| automatic      | انتقال‌های داخلی و خودکار |
| administrative | تغییرات مدیریتی           |
| failure        | شکست‌های فرآیندی          |
| recovery       | بازیابی از وضعیت‌های شکست |

## 10. Transition Registry

رجیستری انتقال‌ها در [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts) به‌صورت متمرکز تعریف شده و از آن برای ارزیابی قانون انتقال در [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts) استفاده می‌شود.

## 11. Transition Metadata

هر انتقال در رجیستری شامل شناسه، منبع، مقصد، دسته‌بندی، توضیح، هدف عملیاتی، نوع انتقال و سطح دیده‌شدن است. این ساختار برای ادغام آینده با گارد، خط مشی، لاگ و متریک آماده است.

## 12. Future Integration Points

- Guards و Policies
- Retry Engine
- Scheduler و Worker
- Monitoring و Metrics
- Event Bus
- Dashboard

## 13. Existing Components Reused

- [packages/rss/src/status](packages/rss/src/status)
- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [apps/api/src/modules/feeds/feeds-administration.service.ts](apps/api/src/modules/feeds/feeds-administration.service.ts)

## 14. Existing Components Extended

- سرویس چرخه حیات فید
- ماشین حالت همگام‌سازی

## 15. New Components

- رجیستری انتقال‌های چرخه حیات
- ماشین حالت مرجع چرخه حیات
- متادیتای طبقه‌بندی وضعیت

## 16. Modified Files

- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [packages/rss/src/lifecycle/index.ts](packages/rss/src/lifecycle/index.ts)
- [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)
- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- [packages/rss/src/index.ts](packages/rss/src/index.ts)
- [packages/rss/tests/feed-lifecycle-service.test.ts](packages/rss/tests/feed-lifecycle-service.test.ts)

## 17. New Files

- [packages/rss/src/lifecycle/registry.ts](packages/rss/src/lifecycle/registry.ts)
- [Prompt-7A.2-Feed-Lifecycle-State-Machine.md](Prompt-7A.2-Feed-Lifecycle-State-Machine.md)

## 18. Files Left Untouched

- منطق Import
- منطق Parser
- منطق Worker
- منطق Scheduler
- منطق Retry
- API REST مستقیماً به جز ادغام‌های سطحی

## 19. Architecture Decisions

- یک منبع واحد برای وضعیت‌ها و انتقال‌ها حفظ شده است.
- سرویس چرخه حیات از رجیستری مشترک برای ارزیابی انتقال‌ها استفاده می‌کند.
- با حفظ backward compatibility، مدل قبلی پابرجا مانده است.

## 20. Technical Debt

- برخی زیرسیستم‌ها هنوز به‌صورت مستقیم از وضعیت‌های قدیمی استفاده می‌کنند.
- ادغام با APIها و workerها در مراحل بعدی نیاز به سازگاری بیشتر دارد.

## 21. Risks

- در صورت وجود لایه‌های قدیمی‌تر با منطق موازی، ممکن است ناسازگاری‌های جزئی رخ دهد.
- ادغام نهایی با موتور همگام‌سازی و worker نیازمند بازبینی بیشتر است.

## 22. Recommendations for Prompt 7A.3

- ادغام با worker و scheduler
- افزودن رویدادهای دامنه و لاگ‌های ساختاریافته
- گسترش رجیستری با گاردها و سیاست‌های آینده
