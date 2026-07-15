# Prompt 7A.1 - مدل دامنه وضعیت فید و استانداردسازی enum

## 1. Executive Summary

این بازبینی نشان داد که مدل وضعیت فید در مخزن به‌صورت پراکنده و غیرمتمرکز پیاده‌سازی شده است. بخش‌های مختلفی از لایه RSS، API، Prisma و سرویس‌های مدیریتی از واژگان متفاوتی برای وضعیت فید استفاده می‌کنند. برای حفظ سازگاری و جلوگیری از تکرار، یک مدل مرجع واحد برای وضعیت فید ایجاد شد که در بسته RSS به‌عنوان منبع مرجع مرکزی در دسترس است و در لایه API نیز برای تبدیل و نرمال‌سازی وضعیت‌های legacy استفاده می‌شود.

## 2. Audit Findings

| حوزه                   | وضعیت | شواهد                                                                                                                                                                                                   |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enum وضعیت در بسته RSS | جزئی  | [packages/rss/src/enums/index.ts](packages/rss/src/enums/index.ts) شامل FeedSyncStatus است، اما وضعیت‌های دامنه‌ای فید را پوشش نمی‌دهد.                                                                 |
| Lifecycle state        | کامل  | [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts) و [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts) یک مجموعه وضعیت استاندارد را تعریف می‌کنند. |
| Prisma model           | جزئی  | [prisma/schema.prisma](prisma/schema.prisma) از String برای status و PodcastSyncStatus برای syncStatus استفاده می‌کند.                                                                                  |
| API administration     | جزئی  | [apps/api/src/modules/feeds/feeds-administration.service.ts](apps/api/src/modules/feeds/feeds-administration.service.ts) وضعیت‌ها را به‌صورت رشته‌ای و با mapping محلی پردازش می‌کند.                   |
| Status validation      | مفقود | هیچ ماژول مرکزی برای validation و metadata وضعیت وجود نداشت.                                                                                                                                            |

## 3. Existing Status Definitions

| تعریف موجود             | نوع         | توضیح                                                       |
| ----------------------- | ----------- | ----------------------------------------------------------- |
| FeedSyncStatus          | enum        | وضعیت‌های Sync را پوشش می‌دهد.                              |
| FeedLifecycleState      | type        | وضعیت‌های چرخه عمر فید را با مقادیر canonical تعریف می‌کند. |
| PodcastSyncStatus       | enum Prisma | وضعیت‌های sync در دیتابیس را تعریف می‌کند.                  |
| String status در Prisma | field       | وضعیت‌های دامنه‌ای فید را به‌صورت رشته‌ای ذخیره می‌کند.     |

## 4. Canonical Status Model

مدل مرجع جدید شامل این مقادیر است:

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

## 5. Status Definitions

| وضعیت             | معنای کسب‌وکار                             | توضیح                           |
| ----------------- | ------------------------------------------ | ------------------------------- |
| NEW               | فید ایجاد شده و در انتظار ثبت              | وضعیت اولیه                     |
| REGISTERED        | فید ثبت شده و آماده اعتبارسنجی             | آماده ورود به فرآیند validation |
| VALIDATING        | اعتبارسنجی در حال اجرا است                 | عملیات validation فعال است      |
| VALIDATION_FAILED | اعتبارسنجی ناموفق بود                      | نیاز به recovery دارد           |
| READY             | فید آماده ورود به import یا activation است | وضعیت عملیاتی قابل استفاده      |
| IMPORTING         | import در حال اجرا است                     | عملیاتی موقت                    |
| IMPORT_FAILED     | import ناموفق بود                          | نیاز به recovery دارد           |
| ACTIVE            | فید به‌صورت فعال همگام‌سازی می‌شود         | وضعیت عملیاتی اصلی              |
| SYNCING           | همگام‌سازی در حال اجرا است                 | وضعیت موقت                      |
| SYNC_FAILED       | همگام‌سازی ناموفق بود                      | نیاز به recovery دارد           |
| PAUSED            | همگام‌سازی موقت متوقف شده                  | غیرفعال اما قابل بازیابی        |
| DISABLED          | فید غیرفعال است                            | دیگر پردازش نمی‌شود             |
| ARCHIVED          | فید بایگانی شده                            | وضعیت پایانی                    |
| DELETED           | فید حذف منطقی شده                          | وضعیت پایانی                    |

## 6. Status Metadata

برای هر وضعیت Metadata مرکزی شامل مواردی مانند displayName، severity، operationalCategory، isTerminal، allowsSynchronization و supportsRecovery فراهم شده است.

## 7. Mapping Strategy

| مقدار legacy         | مقدار canonical |
| -------------------- | --------------- |
| draft/new/created    | NEW             |
| pending/registered   | REGISTERED      |
| success/ready        | READY           |
| failed/failure/error | SYNC_FAILED     |
| disabled/inactive    | DISABLED        |
| archived             | ARCHIVED        |
| deleted              | DELETED         |

## 8. Validation Strategy

توابع مرکزی شامل isValidFeedStatus، isTerminalFeedStatus، isOperationalFeedStatus، canSynchronize، canRetry و canRecover در ماژول status فراهم شده‌اند.

## 9. Compatibility Strategy

برای حفظ سازگاری با کدهای قدیمی، mapping به‌صورت یک‌طرفه و بدون تغییر schema دیتابیس انجام شد. مقادیر legacy در لایه سرویس به وضعیت canonical تبدیل می‌شوند.

## 10. Serialization Strategy

مقادیر وضعیت با serializeFeedStatus و deserializeFeedStatus به فرم ثابت uppercase تبدیل می‌شوند تا در دیتابیس، لاگ و API یکسان باشند.

## 11. Logging Strategy

به‌جای افزودن لاگ‌های پراکنده، این ماژول از رویکرد مرکزی و بدون افشای اطلاعات حساس پیروی می‌کند. در آینده می‌توان لاگ‌های normalization و mapping error را در اینجا متمرکز کرد.

## 12. Existing Components Reused

- [packages/rss/src/lifecycle/types.ts](packages/rss/src/lifecycle/types.ts)
- [packages/rss/src/lifecycle/service.ts](packages/rss/src/lifecycle/service.ts)
- [apps/api/src/modules/feeds/feeds-administration.service.ts](apps/api/src/modules/feeds/feeds-administration.service.ts)
- [prisma/schema.prisma](prisma/schema.prisma)

## 13. Existing Components Extended

- ماژول RSS برای export کردن status central
- سرویس administration برای استفاده از normalization و mapping

## 14. New Components

- [packages/rss/src/status/index.ts](packages/rss/src/status/index.ts)
- [packages/rss/src/status/types.ts](packages/rss/src/status/types.ts)
- [packages/rss/src/status/metadata.ts](packages/rss/src/status/metadata.ts)
- [packages/rss/src/status/validation.ts](packages/rss/src/status/validation.ts)
- [packages/rss/src/status/mapping.ts](packages/rss/src/status/mapping.ts)
- [packages/rss/src/status/serialization.ts](packages/rss/src/status/serialization.ts)
- [packages/rss/src/status/errors.ts](packages/rss/src/status/errors.ts)
- [packages/rss/src/status/**tests**/feed-status.test.ts](packages/rss/src/status/__tests__/feed-status.test.ts)

## 15. Modified Files

- [packages/rss/src/index.ts](packages/rss/src/index.ts)
- [apps/api/src/modules/feeds/feeds-administration.service.ts](apps/api/src/modules/feeds/feeds-administration.service.ts)

## 16. New Files

- تمام فایل‌های موجود در section 14

## 17. Files Left Untouched

- منطق import
- منطق sync
- منطق parser
- منطق worker
- controllerهای API

## 18. Architecture Decisions

- استفاده از یک source of truth در بسته RSS
- استفاده از mapping برای backward compatibility
- عدم ایجاد enum‌های موازی در لایه‌های دیگر

## 19. Technical Debt

- Prisma هنوز از String به‌جای enum canonical استفاده می‌کند.
- برخی سرویس‌ها仍 به‌صورت hard-coded با وضعیت‌های legacy کار می‌کنند.

## 20. Future Integration Points

- Lifecycle state machine
- Monitoring/dashboard
- Admin UI
- Event bus / queue

## 21. Recommendations for Prompt 7A.2

- ادغام مدل وضعیت با lifecycle engine
- تبدیل Prisma schema به enum canonical در مرحله بعدی
- گسترش validation و mapping به لایه‌های دیگر
