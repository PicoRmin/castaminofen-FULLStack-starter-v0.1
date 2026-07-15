# گزارش پیاده‌سازی API کنترل عملیاتی فید

## Executive Summary

این مستند خلاصه‌ای از پیاده‌سازی API کنترل عملیاتی فید در این مخزن است. در این نسخه، تنها لایه‌های عملیاتی و REST برای دسترسی به وضعیت فید، تاریخچه checkpoint، درخواست retry، درخواست recovery و درخواست restore از checkpoint ارائه شده‌اند. هیچ منطق اجراکنندهٔ synchronization، retry یا recovery در این لایه اضافه نشده است و همهٔ عملیات از سرویس‌های موجود RSS Engine و مدیریت وضعیت استفاده می‌کنند.

## Architecture

API جدید در لایهٔ Controller و Service اپلیکیشن NestJS قرار گرفته است. این لایه به‌صورت نازک عمل می‌کند و از مدیرهای موجود FeedStateManager، FeedCheckpointManager و SynchronizationRecoveryEngine استفاده می‌کند. این طراحی از اصول Thin Controller، Dependency Inversion و Separation of Concerns پیروی می‌کند.

## Responsibilities

- ارائه endpoints GET/POST برای کنترل عملیاتی فید
- استفاده از سرویس‌های موجود برای خواندن وضعیت و checkpoint
- استفاده از موتور recovery به‌صورت ارزیابی‌محور و بدون اجرای retry یا recovery
- پشتیبانی از Swagger و DTOهای قوی برای مستندسازی

## Folder Structure

- apps/api/src/modules/feeds/
  - feeds-operational.controller.ts
  - feeds-operational.service.ts
  - dto/operational-request.dto.ts
  - dto/operational-response.dto.ts
  - feeds-operational.service.spec.ts

## File Tree

```text
apps/api/src/modules/feeds/
├── dto/
│   ├── operational-request.dto.ts
│   └── operational-response.dto.ts
├── feeds-operational.controller.ts
├── feeds-operational.service.ts
└── feeds-operational.service.spec.ts
```

## Created Files

- apps/api/src/modules/feeds/feeds-operational.controller.ts
- apps/api/src/modules/feeds/feeds-operational.service.ts
- apps/api/src/modules/feeds/dto/operational-request.dto.ts
- apps/api/src/modules/feeds/dto/operational-response.dto.ts
- apps/api/src/modules/feeds/feeds-operational.service.spec.ts
- docs/rss/Feed-Operational-Control-API-Report.fa.md

## Modified Files

- apps/api/src/modules/feeds/feeds.module.ts
- apps/api/src/modules/feeds/dto/monitoring-response.dto.ts

## Dependency Graph

```text
Controller -> FeedsOperationalService -> PrismaService
Controller -> FeedStateManager
Controller -> FeedCheckpointManager
Controller -> SynchronizationRecoveryEngine
```

## Public Exports

در حال حاضر این لایه از طریق ماژول FeedsModule در NestJS ثبت شده است. هیچ export عمومی جدیدی برای بستهٔ production اضافه نشده است، زیرا این API فقط در لایهٔ برنامه کاربردی مورد نیاز است.

## Operational API Architecture

- Authentication: از JwtAuthGuard موجود استفاده شد.
- Authorization: از همان Guardهای موجود استفاده شد، بدون ایجاد permission جدید.
- Validation: از DTOهای class-validator و ValidationPipe موجود استفاده شد.
- Controller: فقط پارس و روتینگ را انجام می‌دهد.
- Service: منطق دسترسی به داده و ادغام با RSS Engine را انجام می‌دهد.

## Endpoint Documentation

- GET /feeds/:id/state
- GET /feeds/:id/checkpoints
- GET /feeds/:id/checkpoints/:checkpointId
- POST /feeds/:id/retry
- POST /feeds/:id/recover
- POST /feeds/:id/checkpoints/:checkpointId/restore

## State Management Integration

وضعیت فعلی فید از FeedStateManager ایجاد و بازگردانده می‌شود. این بخش فقط وضعیت را فراهم می‌کند و هیچ عملیات synchronization انجام نمی‌دهد.

## Checkpoint Integration

Checkpointها از FeedCheckpointManager مدیریت می‌شوند. این ماناژر برای دسترسی و بازسازی checkpoint‌های موجود استفاده شده است.

## Recovery Integration

درخواست‌های retry و recovery از SynchronizationRecoveryEngine ارزیابی می‌شوند. این موتور فقط تصمیم‌گیری و برنامه‌ریزی را انجام می‌دهد و اجرای واقعی recovery/retry را پیاده‌سازی نمی‌کند.

## Retry Integration

درخواست retry به‌صورت ارزیابی‌محور و با ارائه وضعیت و metadata به موتور recovery ارسال می‌شود.

## Validation Rules

- id فید باید وجود داشته باشد.
- checkpointId باید معتبر باشد.
- DTOهای ورودی با class-validator بررسی می‌شوند.
- Route parameters از NestJS validation و Swagger پشتیبانی می‌شوند.

## Authentication Integration

از JwtAuthGuard موجود استفاده شده است. این لایه به‌صورت مستقل برای همهٔ endpoints اعمال می‌شود.

## Authorization Integration

در این نسخه از همان auth guard و الگوی موجود استفاده شده است و هیچ سطح دسترسی جدید ایجاد نشده است.

## Error Mapping

- Feed not found → NotFoundException
- Checkpoint not found → NotFoundException
- Invalid checkpoint access → NotFoundException در سطح API

## Swagger Documentation

تمام endpoints با ApiOperation، ApiResponse، ApiParam و ApiBody مستند شده‌اند. DTOها با ApiProperty و ApiPropertyOptional همراه هستند.

## Performance Optimizations

- استفاده از مدیرهای موجود به‌جای ایجاد منطق تکراری
- نگه‌داشتن controller سبک
- جلوگیری از دسترسی مستقیم به persistence در لایهٔ controller

## Future Roadmap

- اتصال به storage واقعی checkpoint در صورت آماده شدن persistence اختصاصی
- افزودن endpointهای عملیاتی بیشتر مانند pause/resume/cancel/restart
- افزودن نگاشت خطای دقیق‌تر بر اساس exceptions domain

## Remaining Work

- ادغام با persistence واقعی checkpoint و state در صورت وجود backend اختصاصی
- اضافه‌کردن تست‌های e2e برای endpoints REST
- افزایش دقت error mapping برای وضعیت‌های retry/recovery/prohibit
