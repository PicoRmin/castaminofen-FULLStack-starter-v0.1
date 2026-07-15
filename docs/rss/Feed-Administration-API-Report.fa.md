# گزارش پیاده‌سازی API مدیریت فید

## Executive Summary
این گزارش، پیاده‌سازی لایه REST مدیریت فید در محیط ماژول Feeds را مستند می‌کند. هدف اصلی، ارائه endpointهای اداری برای مدیریت چرخه حیات فید، بدون اجرای منطق همگام‌سازی یا بازیابی، و با بهره‌گیری از الگوهای موجود در APIهای فعلی بوده است.

## Architecture
معماری پیشنهادی بر اساس لایه‌بندی Clean Architecture و NestJS طراحی شده است:

1. Controller: دریافت درخواست‌های HTTP و تبدیل آن‌ها به ورودی‌های کاربردی.
2. Service: اجرای منطق اداری و نگهداری وضعیت فید.
3. Repository: استفاده از PrismaService برای دسترسی به مدل Podcast.
4. DTOs: تعریف قرارداد ورودی/خروجی و مستندسازی Swagger.

## Responsibilities
- مدیریت متادیتای قابل ویرایش فید
- فعال/غیرفعال‌سازی فید
- آرشیو و بازیابی فید
- بازنشانی وضعیت اداری فید
- درخواست بازاعتبارسنجی
- بازیابی و به‌روزرسانی پیکربندی فید

## Folder Structure
- apps/api/src/modules/feeds/
  - feeds-administration.controller.ts
  - feeds-administration.service.ts
  - dto/administration-request.dto.ts
  - dto/administration-response.dto.ts

## File Tree
```text
apps/api/src/modules/feeds/
├── feeds-administration.controller.ts
├── feeds-administration.service.ts
├── feeds.module.ts
└── dto/
    ├── administration-request.dto.ts
    └── administration-response.dto.ts
```

## Created Files
- apps/api/src/modules/feeds/feeds-administration.controller.ts
- apps/api/src/modules/feeds/feeds-administration.service.ts
- apps/api/src/modules/feeds/dto/administration-request.dto.ts
- apps/api/src/modules/feeds/dto/administration-response.dto.ts
- apps/api/src/modules/feeds/feeds-administration.service.spec.ts
- docs/rss/Feed-Administration-API-Report.fa.md

## Modified Files
- apps/api/src/modules/feeds/feeds.module.ts

## Dependency Graph
```text
FeedsAdministrationController
  └── FeedsAdministrationService
        └── PrismaService

FeedsAdministrationService
  └── Podcast model (Prisma)
```

## Public Exports
- FeedsAdministrationController
- FeedsAdministrationService
- DTOهای مربوط به درخواست و پاسخ اداری

## Administration API Architecture
API اداری به‌صورت جداگانه در ماژول Feeds پیاده‌سازی شده است تا از تداخل با منطق همگام‌سازی جلوگیری شود. این لایه فقط state و configuration را مدیریت می‌کند و نه پردازش‌های زمان‌بر یا اجرای کارهای پس‌زمینه.

## Endpoint Documentation
### PATCH /feeds/:id
به‌روزرسانی متادیتای قابل ویرایش فید.

### POST /feeds/:id/enable
فعال‌سازی فید.

### POST /feeds/:id/disable
غیرفعال‌سازی فید بدون حذف ثبت آن.

### POST /feeds/:id/archive
آرشیو فید.

### POST /feeds/:id/unarchive
بازیابی فید آرشیو شده.

### POST /feeds/:id/reset
بازنشانی وضعیت اداری فید.

### POST /feeds/:id/revalidate
درخواست اجرای pipeline اعتبارسنجی.

### GET /feeds/:id/configuration
دریافت snapshot پیکربندی فید.

### PATCH /feeds/:id/configuration
به‌روزرسانی مقادیر پیکربندی.

## Configuration Model
پیکربندی فعلی به‌صورت snapshot ساختاریافته و قابل توسعه پیاده‌سازی شده است و شامل موارد زیر است:
- syncEnabled
- importEnabled
- healthEvaluationEnabled
- retryPolicy
- recoveryPolicy
- priority
- retentionPolicy
- schedulingPolicy
- providerOverrides
- metadataPolicy

## Validation Rules
- شناسه فید باید معتبر باشد.
- ورودی‌های request با ValidationPipe و decorators class-validator بررسی می‌شوند.
- فیلدهای اختیاری باید در صورت وجود معتبر باشند.

## Authentication Integration
- از JwtAuthGuard استفاده شده است.
- لاگین و احراز هویت در سطح موجود reuse می‌شود.

## Authorization Integration
- از RolesGuard و decorator Roles استفاده شده است.
- دسترسی به endpointهای اداری برای role admin در نظر گرفته شده است.

## Error Mapping
- Feed not found → NotFoundException
- Unauthorized → JwtAuthGuard
- Forbidden → RolesGuard
- Validation errors → ValidationPipe

## Swagger Documentation
تمام endpointهای جدید با ApiOperation، ApiBody، ApiResponse و ApiParam مستندسازی شده‌اند و در Swagger قابل مشاهده خواهند بود.

## Performance Optimizations
- کنترلرها باریک نگه داشته شده‌اند.
- دسترسی به repository به‌صورت مستقیم در service انجام می‌شود.
- عملیات اداری به‌صورت محدود و بدون اجرای پردازش طولانی پیاده‌سازی شده‌اند.

## Future Roadmap
- افزودن endpointهای «clone»، «export»، «import-settings»، «transfer» و «audit»
- ادغام با serviceهای پیکربندی دقیق‌تر در لایه application
- گسترش validation و mapping به schemaهای دامین‌محور

## Remaining Work
- ادغام کامل با serviceهای application لایه بالاتر در صورت نیاز به منطق دامین پیچیده‌تر
- اضافه شدن تست‌های integration برای endpointها
- بررسی نهایی روی محیط سازمانی با policyهای auth/roles واقعی
