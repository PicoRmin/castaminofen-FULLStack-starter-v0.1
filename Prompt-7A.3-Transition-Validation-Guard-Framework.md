# Prompt-7A.3 - Transition Validation and Guard Framework

## 1. Executive Summary

این پیاده‌سازی، چارچوب مرکزی اعتبارسنجی و گارد برای چرخه‌حیات RSS Feed را در بسته‌ی rss استانداردسازی کرده است. هدف اصلی، تبدیل این لایه به مرجع واحد برای تعیین امکان انجام انتقال‌های چرخه‌حیات بوده و جلوگیری از پراکندگی منطق اعتبارسنجی در سرویس‌ها و لایه‌های مختلف است.

در نسخه‌ی فعلی، منطق تعیین وضعیت و ثبت انتقال‌ها از قبل در لایه‌ی lifecycle وجود داشت، اما اعتبارسنجی و گاردها به‌صورت پراکنده و درون‌خطی در سرویس lifecycle اجرا می‌شدند. این پیاده‌سازی با ایجاد قراردادهای استاندارد، رجیستری مرکزی، و یک مسیر اجرای واحد، این ساختار را به حالت قابل‌استفاده و توسعه‌پذیر برای ادغام با موتور سیاست، retry، recovery، workers و scheduler تبدیل کرده است.

## 2. Repository Audit Findings

| حوزه                              | وضعیت                     | شواهد در مخزن                                                                                              |
| --------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Transition Validation             | جزئی                      | فایل‌های lifecycle/service.ts و lifecycle/registry.ts وجود دارند اما هیچ چارچوب مرکزی برای validation نبود |
| Feed Validation                   | جزئی                      | در packages/rss/src/status/validation.ts و packages/rss/src/validators/index.ts موجود است                  |
| Lifecycle Validation              | جزئی                      | در FeedLifecycleService و state machine موجود بود ولی در قالب یک جریان واحد نبود                           |
| Transition Guards                 | جزئی                      | متدهای canImport، canSynchronize و canActivate در FeedLifecycleService وجود داشتند                         |
| Status Validation                 | کامل                      | status/validation.ts و status/metadata.ts از وضعیت‌ها و ترنزیشن‌ها پشتیبانی می‌کنند                        |
| Repository Validation             | مفقود                     | هیچ لایه‌ی مرکزی و استاندارد برای validation repository در این حوزه یافت نشد                               |
| Synchronization Validation        | خارج از محدوده این prompt | در packages/rss/src/synchronization/ وجود دارد اما در این مرحله به‌صورت مستقیم استفاده نشده است            |
| Import Validation                 | خارج از محدوده این prompt | در packages/rss/src/import/ وجود دارد ولی در این پیاده‌سازی به‌صورت مستقیم مورد استفاده قرار نگرفته است    |
| Worker/Scheduler/Retry Validation | مفقود/آینده               | در این prompt فقط ساختارها برای آینده آماده شده‌اند                                                        |

## 3. Existing Validators

| مؤلفه                                      | وضعیت                | توضیح                                                                    |
| ------------------------------------------ | -------------------- | ------------------------------------------------------------------------ |
| packages/rss/src/status/validation.ts      | موجود و قابل استفاده | اعتبارسنجی وضعیت‌های فید، ترمینال بودن، امکان sync/import/retry/recovery |
| packages/rss/src/validators/index.ts       | موجود و قابل استفاده | اعتبارسنجی‌های عمومی برای feed/episode/url                               |
| packages/rss/src/parser/rss/validators.ts  | موجود                | اعتبارسنجی ساختاری برای پارسر RSS                                        |
| packages/rss/src/parser/atom/validators.ts | موجود                | اعتبارسنجی ساختاری برای پارسر Atom                                       |
| packages/rss/src/parser/xml/validator.ts   | موجود                | اعتبارسنجی ساختاری XML                                                   |
| packages/rss/src/network/validation.ts     | موجود                | اعتبارسنجی پاسخ‌های شبکه                                                 |

## 4. Existing Guards

| مؤلفه                               | وضعیت | توضیح                                     |
| ----------------------------------- | ----- | ----------------------------------------- |
| FeedLifecycleService.canImport      | جزئی  | یک قاعده‌ی محدود برای import بررسی می‌کرد |
| FeedLifecycleService.canSynchronize | جزئی  | برای sync یک شرط ساده داشت                |
| FeedLifecycleService.canArchive     | جزئی  | برای archive بررسی انجام می‌داد           |
| FeedLifecycleService.canDelete      | جزئی  | برای delete قانون ساده داشت               |
| FeedLifecycleService.canActivate    | جزئی  | برای activation بررسی انجام می‌داد        |
| FeedLifecycleService.canPause       | جزئی  | برای pause بررسی انجام می‌داد             |
| FeedLifecycleService.canDisable     | جزئی  | برای disable بررسی انجام می‌داد           |
| FeedLifecycleService.canRecover     | جزئی  | برای recovery بررسی انجام می‌داد          |

## 5. Validation Framework

چارچوب اعتبارسنجی جدید شامل موارد زیر است:

- قراردادهای استاندارد برای Validation Result
- رجیستری مرکزی برای تعریف اعتبارسنجی‌ها
- یک مسیر واحد برای ارزیابی درخواست انتقال
- امکان توسعه برای validation‌های lifecycle، metadata، integrity و operational در آینده

مؤلفه‌های جدید:

- packages/rss/src/lifecycle/contracts.ts
- packages/rss/src/lifecycle/validation-registry.ts

## 6. Guard Framework

چارچوب گارد جدید شامل موارد زیر است:

- قراردادهای استاندارد برای Guard Result
- رجیستری مرکزی برای تعریف گاردها
- ارزیابی deterministic روی درخواست انتقال
- جلوگیری از اجرای انتقال در شرایطی مانند state terminal

مؤلفه‌های جدید:

- packages/rss/src/lifecycle/guard-registry.ts

## 7. Validation Contracts

| قرارداد                        | شرح                                                                  |
| ------------------------------ | -------------------------------------------------------------------- |
| TransitionValidationResult     | شامل success، identifier، category، reason، code، metadata و context |
| TransitionValidationDefinition | شامل id، category، description و validate                            |
| TransitionValidationContext    | شامل request و متادیتای وضعیت‌های منبع و مقصد                        |

## 8. Guard Contracts

| قرارداد                   | شرح                                                                 |
| ------------------------- | ------------------------------------------------------------------- |
| TransitionGuardResult     | شامل allowed، guardId، transition، reason، code، metadata و context |
| TransitionGuardDefinition | شامل id، category، description و evaluate                           |
| TransitionGuardContext    | شامل request و متادیتای وضعیت‌های مربوطه                            |

## 9. Validation Registry

رجیستری اعتبارسنجی در فایل زیر مرکزی شده است:

- packages/rss/src/lifecycle/validation-registry.ts

اعتبارسنجی‌های فعلی:

- lifecycle.transition.validation
- lifecycle.state.metadata

## 10. Guard Registry

رجیستری گارد در فایل زیر مرکزی شده است:

- packages/rss/src/lifecycle/guard-registry.ts

گاردهای فعلی:

- lifecycle.terminal-state
- lifecycle.transition-definition

## 11. Validation Pipeline

روند فعلی به شکل زیر است:

1. Transition Request
2. Validation Registry
3. Guard Registry
4. Lifecycle Service
5. Transition Execution (در آینده)

## 12. Guard Pipeline

روند فعلی به شکل زیر است:

1. Transition Request
2. Guard Evaluation
3. Decision (allow/deny)
4. Lifecycle Service

## 13. Existing Components Reused

- packages/rss/src/status/metadata.ts
- packages/rss/src/status/validation.ts
- packages/rss/src/lifecycle/registry.ts
- packages/rss/src/lifecycle/service.ts
- packages/rss/src/lifecycle/errors.ts

## 14. Existing Components Extended

- FeedLifecycleService
- lifecycle/index.ts

## 15. New Components

- contracts.ts
- validation-registry.ts
- guard-registry.ts
- tests/transition-validation-framework.test.ts

## 16. Modified Files

- packages/rss/src/lifecycle/index.ts
- packages/rss/src/lifecycle/service.ts

## 17. New Files

- packages/rss/src/lifecycle/contracts.ts
- packages/rss/src/lifecycle/validation-registry.ts
- packages/rss/src/lifecycle/guard-registry.ts
- packages/rss/tests/transition-validation-framework.test.ts

## 18. Files Left Untouched

- packages/rss/src/status/metadata.ts
- packages/rss/src/status/validation.ts
- packages/rss/src/lifecycle/registry.ts
- packages/rss/src/lifecycle/errors.ts
- packages/rss/src/import/**
- packages/rss/src/synchronization/**
- packages/rss/src/workers/**
- packages/rss/src/scheduler/**

## 19. Architecture Decisions

- منطق اعتبارسنجی و گارد از سرویس lifecycle جدا شد.
- هر دو جریان از قراردادهای ثابت استفاده می‌کنند.
- Transition Registry همچنان منبع حقیقت برای امکان‌پذیری انتقال‌ها است.
- منطق کسب‌وکار به این لایه اضافه نشده و فقط چارچوب ساختاری فراهم شده است.

## 20. Technical Debt

- هنوز چندین گارد تخصصی‌تر مانند repository، security و operational در این مرحله وجود ندارند.
- برخی قوانین فعلی در FeedLifecycleService همچنان به‌صورت business-rule باقی مانده‌اند و می‌توانند در مرحله‌ی بعدی به validation framework منتقل شوند.
- برای ادغام کامل با policy engine، باید قراردادهای آینده‌ی event/metric/audit در این لایه گسترش یابند.

## 21. Risks

- اگر در آینده منطق business policy به‌طور مستقیم در سرویس lifecycle باقی بماند، چارچوب مرکزی دچار انحراف می‌شود.
- اگر گاردهای آینده به‌صورت پراکنده اضافه شوند، اصل single source of truth نقض می‌شود.

## 22. Future Integration Points

- Policy Engine
- Retry Engine
- Recovery Engine
- Workers
- Scheduler
- Monitoring / Metrics
- Audit / Notifications
- Event Bus

## 23. Recommendations for Prompt 7A.4

- انتقال قوانین business-policy از FeedLifecycleService به یک Policy Engine جداگانه
- اضافه‌کردن گاردهای repository و security
- اضافه‌کردن پشتیبانی از event/logging/metrics در Validation و Guard contracts
- گسترش تست‌های regression برای انتقال‌های failure/recovery و administrative
