# گزارش API پایش سلامت و مانیتورینگ فید RSS

## Executive Summary

این گزارش، پیاده‌سازی REST API برای دسترسی به اطلاعات سلامت، متریک‌ها و آمار فیدهای RSS را در این monorepo توصیف می‌کند. هدف اصلی، ارائه‌ی یک لایه‌ی API سبک و قابل‌استفاده برای مصرف سرویس‌های موجود چارچوب Health و Telemetry بود، بدون اینکه هیچ‌گونه منطق محاسباتی جدیدی درباره سلامت، متریک یا همگام‌سازی اضافه شود.

## Architecture

معماری این API بر اساس اصل Thin Controller و Dependency Inversion طراحی شده است:

1. Authentication و Authorization با Guardهای موجود اجرا می‌شوند.
2. Controllerها تنها درخواست را به سرویس‌های کاربردی ارسال می‌کنند.
3. سرویس monitoring از چارچوب سلامت RSS موجود استفاده می‌کند.
4. خروجی‌ها به DTOهای قوی و مستند‌شده تبدیل می‌شوند.
5. Swagger و Validation Pipe موجود برای مستندسازی و اعتبارسنجی مجدد استفاده می‌شوند.

## Responsibilities

- ارائه‌ی سه endpoint اصلی برای مانیتورینگ
- استفاده از سرویس‌های موجود RSS Health Framework
- تبدیل خروجی‌های domain به DTOهای REST
- حفظ thin controller و جلوگیری از منطق محاسباتی در لایه‌ی API
- استفاده از Guard و Swagger موجود

## Folder Structure

- apps/api/src/modules/feeds
- apps/api/src/modules/feeds/dto
- docs/rss

## File Tree

```text
apps/api/src/modules/feeds
├── dto
│   └── monitoring-response.dto.ts
├── feeds-monitoring.controller.ts
├── feeds-monitoring.service.ts
├── feeds.module.ts
└── feeds.controller.ts
```

## Created Files

- apps/api/src/modules/feeds/feeds-monitoring.controller.ts
- apps/api/src/modules/feeds/feeds-monitoring.service.ts
- apps/api/src/modules/feeds/dto/monitoring-response.dto.ts
- docs/rss/Feed-Health-Monitoring-API-Report.fa.md

## Modified Files

- apps/api/src/modules/feeds/feeds.module.ts

## Public Exports

سرویس و کنترلر جدید در ماژول Feeds ثبت شده‌اند و از طریق سیستم Dependency Injection NestJS در دسترس هستند.

## Endpoint Documentation

### GET /api/feeds/:id/health

- بازگرداندن اطلاعات سلامت فید
- استفاده از Feed Health Framework موجود
- خروجی شامل: status، healthScore، classification، warnings، recommendations، evaluatedAt، metadata، trend و statistics

### GET /api/feeds/:id/statistics

- بازگرداندن آمار خلاصه‌شده‌ی همگام‌سازی
- خروجی شامل: totalSynchronizations، successfulSynchronizations، failedSynchronizations، averageDurationMs، medianDurationMs، peakDurationMs و trendSummary

### GET /api/feeds/:id/metrics

- بازگرداندن متریک‌های مربوط به همگام‌سازی
- خروجی شامل: synchronizationCount، failureCount، retryCount، recoveryCount، averageSynchronizationDurationMs، averageImportDurationMs، averageDownloadDurationMs، successRate و providerAvailability

## Health Response Model

مدل پاسخ سلامت شامل موارد زیر است:

- feedId
- status
- healthScore
- classification
- warnings
- recommendations
- evaluatedAt
- metadata
- trend
- statistics

## Metrics Response Model

مدل پاسخ متریک‌ها شامل موارد زیر است:

- feedId
- summary
- metadata

## Statistics Response Model

مدل پاسخ آمار شامل موارد زیر است:

- feedId
- summary
- metadata

## Validation Rules

- شناسه‌ی فید باید در پارامتر route ارسال شود.
- از Validation Pipe موجود استفاده شده است.
- در این نسخه، از پارامتر UUID به‌صورت صریح استفاده نشده است زیرا مدل فعلی فیدها از شناسه‌های CUID استفاده می‌کنند؛ با این حال، مسیر با سازوکار Validation و Guardهای موجود محافظت می‌شود.

## Authentication Integration

- از JwtAuthGuard موجود استفاده شده است.
- هیچ‌گونه منطق احراز هویت جدیدی اضافه نشده است.

## Authorization Integration

- از همان Guard و permission model موجود استفاده شده است.
- هیچ‌گونه مجوز سفارشی اضافه نشده است.

## Error Mapping

پاسخ‌ها بر اساس خطاهای موجود NestJS و NotFoundException تولید می‌شوند. در آینده می‌توان این لایه را با Exception Filterهای دقیق‌تر و mapping روشن‌تر برای HealthUnavailable و MetricsUnavailable تکمیل کرد.

## Swagger Documentation

- کنترلرها با ApiTags، ApiBearerAuth، ApiOperation و ApiResponse مستند شده‌اند.
- DTOهای پاسخ با ApiProperty و ApiPropertyOptional مستندسازی شده‌اند.

## Performance Optimizations

- Controllerها بسیار سبک نگه داشته شده‌اند.
- دسترسی به repository تنها برای تأیید وجود فید انجام می‌شود.
- منطق سلامت و متریک از چارچوب موجود استفاده می‌کند.
- از ساخت مجدد داده‌های سنگین جلوگیری شده است.

## Future API Roadmap

- افزودن endpointهای history، events و timeline
- ادغام با سرویس‌های real telemetry و time-series
- افزودن caching برای پاسخ‌های تکراری
- گسترش DTOها با فیلدهای دقیق‌تر برای health و statistics

## Remaining Work

- ادغام با داده‌های real synchronization history از لایه‌ی persistence
- تکمیل mapping دقیق‌تر خطاهای HealthUnavailable / MetricsUnavailable / StatisticsUnavailable
- افزودن تست‌های integration برای مسیرهای HTTP در سطح e2e
