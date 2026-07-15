# Prompt-7A-Feed-Lifecycle-State-Machine

## 1. Executive Summary

دامنه چرخه حیات فید در این مخزن قبلاً با لایه‌های مختلفی از جمله مدل‌های Prisma، سرویس‌های API، و ماژول RSS پوشش داده شده بود. با این حال، منطق چرخه حیات در قالب یک منبع واحد و قابل استناد هنوز به‌صورت رسمی وجود نداشت. این تغییر، یک سرویس مرکزی برای چرخه حیات فید ایجاد می‌کند که قوانین انتقال، قانون‌های کسب‌وکار، و گاردهای چرخه حیات را در یک مکان متمرکز نگه می‌دارد و از بکارگیری مستقیم تغییرات حالت در لایه‌های مختلف جلوگیری می‌کند.

## 2. Lifecycle Overview

چرخه حیات فید از وضعیت‌های زیر تشکیل می‌شود:

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

## 3. State Machine Diagram (textual)

```text
NEW -> REGISTERED -> VALIDATING -> READY -> IMPORTING -> ACTIVE -> SYNCING
  \-> VALIDATION_FAILED -> READY
  \-> IMPORT_FAILED -> READY
  \-> SYNC_FAILED -> READY
  \-> DISABLED
  \-> ARCHIVED
  \-> DELETED
```

## 4. Feed States

- NEW: فید تازه ایجاد شده و هنوز ثبت‌نشده است.
- REGISTERED: فید ثبت شده و آماده ورود به فرآیند اعتبارسنجی است.
- VALIDATING: در حال اعتبارسنجی است.
- VALIDATION_FAILED: اعتبارسنجی شکست خورده است.
- READY: برای ورود به فرآیندهای بعدی آماده است.
- IMPORTING: در حال ورود داده‌ها از منبع RSS است.
- IMPORT_FAILED: ورود داده‌ها ناموفق بود.
- ACTIVE: فید فعال است.
- SYNCING: در حال همگام‌سازی است.
- SYNC_FAILED: همگام‌سازی شکست خورده است.
- PAUSED: فید موقتاً متوقف شده است.
- DISABLED: فید غیرفعال شده است.
- ARCHIVED: فید بایگانی شده است.
- DELETED: فید حذف شده است.

## 5. Transition Matrix

| From              | To                | Rule                 |
| ----------------- | ----------------- | -------------------- |
| NEW               | REGISTERED        | ثبت اولیه فید        |
| NEW               | DELETED           | حذف زودهنگام         |
| REGISTERED        | VALIDATING        | شروع اعتبارسنجی      |
| REGISTERED        | READY             | اعتبارسنجی موفق      |
| REGISTERED        | DISABLED          | غیرفعال‌سازی         |
| VALIDATING        | READY             | اعتبارسنجی موفق      |
| VALIDATING        | VALIDATION_FAILED | شکست اعتبارسنجی      |
| VALIDATION_FAILED | READY             | بازسازی و بازیابی    |
| READY             | IMPORTING         | شروع واردکردن محتوا  |
| READY             | ACTIVE            | فعال‌سازی            |
| READY             | DISABLED          | غیرفعال‌سازی         |
| IMPORTING         | ACTIVE            | ورود موفق            |
| IMPORTING         | IMPORT_FAILED     | شکست ورود            |
| ACTIVE            | SYNCING           | شروع همگام‌سازی      |
| ACTIVE            | PAUSED            | توقف موقت            |
| ACTIVE            | DISABLED          | غیرفعال‌سازی         |
| SYNCING           | ACTIVE            | پایان همگام‌سازی     |
| SYNCING           | SYNC_FAILED       | شکست همگام‌سازی      |
| SYNC_FAILED       | READY             | بازسازی              |
| PAUSED            | ACTIVE            | ادامه فعالیت         |
| DISABLED          | ACTIVE            | بازنشانی و فعال‌سازی |
| ARCHIVED          | ACTIVE            | بازیابی از بایگانی   |
| DELETED           | —                 | انتقال غیرمجاز       |

## 6. Business Rules

- فید قبل از همگام‌سازی باید موفقیت‌آمیز اعتبارسنجی شده باشد.
- فیدهای ناموفق در اعتبارسنجی، ورود یا همگام‌سازی نمی‌توانند به‌صورت مستقیم فعال شوند.
- فیدهای بایگانی‌شده فقط در موارد محدود و با منطق مشخص می‌توانند به وضعیت فعال بازگردند.
- فیدهای حذف‌شده دیگر قابل انتقال نیستند.
- فیدهای غیرفعال یا متوقف‌شده برای همگام‌سازی مناسب نیستند.

## 7. Lifecycle Guards

- canImport()
- canSynchronize()
- canArchive()
- canDelete()
- canActivate()
- canPause()
- canDisable()
- canRecover()

## 8. Validation Strategy

اعتبارسنجی در سرویس مرکزی چرخه حیات انجام می‌شود. همه انتقال‌ها از طریق این سرویس بررسی شده و در صورت نقض قوانین، خطای ساختاریافته صادر می‌شود.

## 9. Error Strategy

انواع خطا شامل موارد زیر است:

- InvalidStateTransitionError
- FeedValidationRequiredError
- FeedLifecycleViolationError

## 10. Logging Strategy

رویدادهای مهم شامل موارد زیر است:

- lifecycle.started
- lifecycle.transition
- lifecycle.transition.rejected

## 11. Domain Events (Future)

- FeedRegistered
- FeedValidated
- FeedActivated
- FeedPaused
- FeedDisabled
- FeedArchived
- FeedDeleted
- FeedSynchronizationStarted
- FeedSynchronizationFinished
- FeedSynchronizationFailed

## 12. Existing Components Reused

- Prisma models
- RSS package synchronization primitives
- API feed administration service
- Existing DTOs and controllers

## 13. Existing Components Extended

- FeedsAdministrationService
- Feed state machine abstractions in the RSS package

## 14. New Components

- FeedLifecycleService
- lifecycle errors
- lifecycle types and hooks

## 15. Modified Files

- packages/rss/src/index.ts
- packages/rss/src/lifecycle/index.ts
- packages/rss/src/lifecycle/service.ts
- packages/rss/src/lifecycle/errors.ts
- packages/rss/src/lifecycle/types.ts
- apps/api/src/modules/feeds/feeds-administration.service.ts
- apps/api/src/modules/feeds/feeds.module.ts
- packages/rss/tests/feed-lifecycle-service.test.ts

## 16. New Files

- packages/rss/src/lifecycle/index.ts
- packages/rss/src/lifecycle/service.ts
- packages/rss/src/lifecycle/errors.ts
- packages/rss/src/lifecycle/types.ts
- packages/rss/tests/feed-lifecycle-service.test.ts
- Prompt-7A-Feed-Lifecycle-State-Machine.md

## 17. Files Left Untouched

- Parser implementation
- Synchronization engine core
- Import logic
- Worker and scheduler modules
- REST API contracts beyond the feed administration integration

## 18. Architecture Decisions

- یک سرویس مرکزی برای تمام انتقال‌های فید در نظر گرفته شده است.
- منطق کسب‌وکار در یک نقطه متمرکز شده است.
- لایه‌های دیگر برای انجام تغییر حالت باید از این سرویس استفاده کنند.

## 19. Risks

- برخی سرویس‌های قدیمی ممکن است هنوز به‌صورت مستقیم وضعیت را تغییر دهند.
- در آینده نیاز به ادغام با worker و scheduler خواهد بود.

## 20. Future Integration Points

- Worker برای تغییر وضعیت خودکار
- Scheduler برای برنامه‌ریزی همگام‌سازی
- Dashboard و monitoring برای نمایش وضعیت زنده

## 21. Technical Debt

- بعضی بخش‌های Prisma و تایپ‌های API هنوز با مشکل تایپ‌سازی روبه‌رو هستند.
- نیاز به یک لایه نگاشت مابین وضعیت‌های Prisma و وضعیت‌های چرخه حیات وجود دارد.

## 22. Recommendations for Prompt 7B

- ادغام سرویس چرخه حیات با worker و scheduler
- ثبت تاریخچه انتقال‌ها در سطح دامنه
- افزودن رویدادهای دامنه به سیستم رویداد داخلی
