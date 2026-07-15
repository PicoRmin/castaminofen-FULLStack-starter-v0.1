# گزارش پایه REST API مدیریت Feed RSS

## Executive Summary
این گزارش، پیاده‌سازی لایه‌ی پایه REST API برای مدیریت ثبت Feedهای RSS در مونورپو را توصیف می‌کند. هدف، فراهم‌کردن یک API سبک، قابل‌استفاده مجدد و سازگار با معماری موجود NestJS/Prisma برای ثبت، مشاهده، واردکردن و حذف Feedهاست بدون ورود به منطق‌های اضافی مانند Scheduler، Worker یا API عمومی پادکست.

## Architecture
معماری این لایه بر پایه‌ی اصول Clean Architecture و DDD طراحی شده است:
- Controller: تنها دریافت درخواست و تبدیل آن به سرویس کاربردی
- Service: مدیریت منطق ثبت و بازیابی Feed در سطح اپلیکیشن
- Prisma: دسترسی به داده‌های موجود در پایگاه داده
- DTOs: تعریف ورودی/خروجی و مستندسازی Swagger
- Guards: احراز هویت و استفاده از لایه‌ی موجود Auth

## Responsibilities
- ثبت Feed جدید با URL معتبر
- بازگرداندن لیست Feedهای ثبت‌شده
- بازگرداندن یک Feed بر اساس شناسه
- راه‌اندازی جریان Import اولیه برای Feed ثبت‌شده
- حذف ثبت Feed از سامانه

## Folder Structure
- apps/api/src/modules/feeds
  - feeds.controller.ts
  - feeds.service.ts
  - feeds.module.ts
  - dto/create-feed.dto.ts
  - dto/feed-response.dto.ts

## File Tree
```text
apps/api/src/modules/feeds/
  feeds.controller.ts
  feeds.module.ts
  feeds.service.ts
  dto/
    create-feed.dto.ts
    feed-response.dto.ts
```

## Created Files
- apps/api/src/modules/feeds/feeds.controller.ts
- apps/api/src/modules/feeds/feeds.service.ts
- apps/api/src/modules/feeds/feeds.module.ts
- apps/api/src/modules/feeds/dto/create-feed.dto.ts
- apps/api/src/modules/feeds/dto/feed-response.dto.ts
- apps/api/src/modules/feeds/feeds.service.spec.ts
- docs/rss/RSS-REST-API-Foundation-Report.fa.md

## Modified Files
- apps/api/src/app.module.ts

## Dependency Graph
```text
FeedsController -> FeedsService -> PrismaService -> Podcast model
FeedsService -> JwtAuthGuard (via controller guard)
FeedsController -> Swagger decorators
```

## Public Exports
در این لایه، ماژول Feed به‌صورت داخلی در اپلیکیشن ثبت شده و در سطح API به‌صورت Controller/Service در دسترس است. هیچ export سطح بسته‌ی جداگانه برای این لایه در نظر گرفته نشده است.

## API Architecture
Request -> Auth Guard -> Validation Pipe -> Controller -> Service -> Prisma -> Response

## Endpoint Documentation
### POST /feeds
ثبت یک Feed RSS جدید با URL معتبر.

### GET /feeds
دریافت لیست Feedهای ثبت‌شده.

### GET /feeds/:id
دریافت جزئیات یک Feed با شناسه.

### POST /feeds/:id/import
راه‌اندازی Import اولیه برای یک Feed ثبت‌شده.

### DELETE /feeds/:id
حذف یک Feed از ثبت‌ها.

## Validation Rules
- URL باید در قالب http/https باشد
- URL نباید خالی باشد
- طول URL و عنوان حداقل و حداکثر مشخص شده است
- شناسه مسیر باید به‌صورت رشته معتبر منتقل شود

## Authentication Integration
از Guard موجود JwtAuthGuard استفاده شده است. این لایه به‌صورت یکپارچه با سیستم احراز هویت فعلی ادغام شده و از ایجاد Authentication جدید خودداری شده است.

## Authorization Integration
در این نسخه، از مدل role-based موجود در Guardها استفاده شده و منطق جدید مجوز دهی ایجاد نشده است. برای آینده می‌توان از RolesGuard در سطح روتر یا کنترلر استفاده کرد.

## DTO Structure
- CreateFeedDto: ورودی ثبت Feed
- FeedResponseDto: خروجی یک Feed
- FeedListResponseDto: خروجی لیست Feedها
- ImportFeedResponseDto: خروجی عملیات import
- DeleteFeedResponseDto: خروجی عملیات حذف

## Error Mapping
- 400: خطای اعتبارسنجی ورودی
- 401: احراز هویت نامعتبر یا وجود نداشتن توکن
- 404: Feed یافت نشد
- 409: Feed قبلاً ثبت شده است
- 500: خطای داخلی

## Swagger Integration
Endpoints با decoratorهای Swagger مستندسازی شده‌اند و در Swagger UI تحت برچسب Feeds در دسترس خواهند بود.

## Performance Optimizations
- استفاده از select مناسب در Prisma برای جلوگیری از بار اضافی
- استفاده از lookup مستقیم با شناسه/URL
- پرهیز از ایجاد ساختارهای غیرضروری در کنترلر

## Future API Roadmap
- افزودن PATCH /feeds/:id
- افزودن PUT /feeds/:id
- افزودن POST /feeds/:id/sync
- افزودن GET /feeds/:id/health
- افزودن GET /feeds/:id/statistics
- افزودن GET /feeds/:id/history

## Remaining Work
- ادغام کامل با موتور RSS به‌جای حالت placeholder import
- استفاده از سرویس Import موجود به‌جای پاسخ استاتیک
- افزودن سیاست‌های authorization دقیق‌تر بر اساس نقش
- پوشش تست integration برای مسیرهای HTTP
