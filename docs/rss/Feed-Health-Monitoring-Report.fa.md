# گزارش پایش سلامت فید RSS

## Executive Summary

این ماژول یک چارچوب قابل‌استفاده و مجدد برای ارزیابی سلامت فیدهای RSS ارائه می‌دهد. این چارچوب فقط جمع‌آوری، تحلیل، رتبه‌بندی و گزارش‌سازی انجام می‌دهد و هیچ‌گونه عملیات همگام‌سازی، retry یا بازیابی را اجرا نمی‌کند. هدف اصلی ساخت یک لایه‌ی Observability است که بتواند وضعیت هر فید را بر اساس شاخص‌های قابل‌سنجش طبقه‌بندی کند.

## Architecture

چارچوب از چهار لایه‌ی اصلی تشکیل شده است:

1. Health Data Collection: دریافت متریک‌های سلامت از ورودی‌های ساختاریافته.
2. Health Evaluation: تبدیل متریک‌ها به امتیاز و وضعیت.
3. Scoring & Classification: تعیین امتیاز و دسته‌ی طبقه‌بندی.
4. Health Report: ساخت report ایستا و immutable برای مصرف لایه‌های بالاتر.

## Responsibilities

- جمع‌آوری اطلاعات سلامت
- ارزیابی وضعیت فید
- محاسبه امتیاز سلامت
- طبقه‌بندی وضعیت فید
- تولید گزارش‌های immutable
- ارائه hook های چرخه عمر برای ادغام‌های بعدی

## Folder Structure

- packages/rss/src/health
- packages/rss/src/health/evaluation
- packages/rss/src/health/scoring
- packages/rss/src/health/classification
- packages/rss/src/health/interfaces
- packages/rss/src/health/types
- packages/rss/src/health/errors
- packages/rss/src/health/events
- packages/rss/src/health/report

## File Tree

```text
packages/rss/src/health
├── classification
│   └── default-feed-health-classification-engine.ts
├── evaluation
│   └── feed-health-evaluator.ts
├── errors
│   └── index.ts
├── events
│   └── index.ts
├── interfaces
│   ├── feed-health-classification-engine.ts
│   ├── feed-health-evaluation-request.ts
│   ├── feed-health-lifecycle-hooks.ts
│   └── feed-health-scoring-engine.ts
├── report
│   └── feed-health-report.ts
├── scoring
│   └── default-feed-health-scoring-engine.ts
├── types
│   ├── feed-health.ts
│   ├── health-metrics.ts
│   ├── health-status.ts
│   ├── health-trend.ts
│   └── index.ts
├── index.ts
└── __tests__
    └── health-framework.test.ts
```

## Health Model

مدل FeedHealth شامل موارد زیر است:

- feedId
- score
- status
- evaluatedAt
- metadata
- warnings
- statistics
- version
- evaluationDurationMs
- trend

همه‌ی مدل‌ها immutable هستند و با Object.freeze ساخته می‌شوند.

## Created Files

- packages/rss/src/health/index.ts
- packages/rss/src/health/types/feed-health.ts
- packages/rss/src/health/types/health-metrics.ts
- packages/rss/src/health/types/health-status.ts
- packages/rss/src/health/types/health-trend.ts
- packages/rss/src/health/interfaces/feed-health-evaluation-request.ts
- packages/rss/src/health/interfaces/feed-health-scoring-engine.ts
- packages/rss/src/health/interfaces/feed-health-classification-engine.ts
- packages/rss/src/health/interfaces/feed-health-lifecycle-hooks.ts
- packages/rss/src/health/evaluation/feed-health-evaluator.ts
- packages/rss/src/health/scoring/default-feed-health-scoring-engine.ts
- packages/rss/src/health/classification/default-feed-health-classification-engine.ts
- packages/rss/src/health/report/feed-health-report.ts
- packages/rss/src/health/errors/index.ts
- packages/rss/src/health/events/index.ts
- packages/rss/src/health/**tests**/health-framework.test.ts

## Modified Files

- packages/rss/src/index.ts
- packages/rss/src/health/index.ts
- docs/rss/Feed-Health-Monitoring-Report.fa.md

## Public Exports

مجموعه‌ی public exports از مسیر زیر در دسترس است:

- packages/rss/src/health/index.ts
- packages/rss/src/index.ts

## Dependency Graph

```text
FeedHealthEvaluationRequest
  -> FeedHealthEvaluator
  -> FeedHealthScoringEngine
  -> FeedHealthClassificationEngine
  -> FeedHealthReport
  -> FeedHealth
```

## Health Evaluation Flow

1. دریافت request شامل feedId و متریک‌ها
2. نرمال‌سازی مقادیر و جمع‌آوری متریک‌ها
3. محاسبه امتیاز با scoring engine
4. تعیین وضعیت بر اساس شاخص‌های امتیاز و failure rate
5. طبقه‌بندی با classification engine
6. ساخت warning ها و report

## Metrics

متریک‌های پشتیبانی‌شده شامل موارد زیر هستند:

- successRate
- failureRate
- averageSyncDurationMs
- averageDownloadTimeMs
- averageImportTimeMs
- checkpointAgeMs
- feedFreshnessMs
- episodeGrowth
- synchronizationFrequency
- metadataChanges
- providerAvailability

## Scoring Model

امتیاز از 0 تا 100 محاسبه می‌شود. مدل فعلی از ترکیب وزن‌دهی بر شاخص‌های موفقیت، خطا، زمان دانلود/ورود داده، freshness و provider availability استفاده می‌کند.

## Classification Model

طبقه‌بندی فعلی از دسته‌های زیر پشتیبانی می‌کند:

- Healthy Feed
- Slow Feed
- Provider Issue
- Outdated Feed
- Unknown Feed

## Trend Analysis

ردیابی trend با سه حالت اصلی صورت می‌گیرد:

- Improving
- Stable
- Declining
- Unknown

## Performance Optimizations

- استفاده از محاسبات یک‌بار مصرف در evaluator
- immutable object creation
- تولید warnings با الگوریتم خطی و بدون دسترسی مجدد به repository
- جلوگیری از اجرای هرگونه منطق همگام‌سازی

## Extensibility Roadmap

- افزودن scoring policy های پیشرفته‌تر
- افزودن predictive health برای آینده
- افزودن provider reputation و fleet health
- ادغام با alert engine یا SLA monitoring

## Remaining Work

- اتصال به repository layer واقعی در محیط production
- تکمیل طبقه‌بندی بر اساس داده‌های تاریخی‌تر
- افزودن policy‌های scoring قابل پیکربندی‌تر
- گسترش health hooks برای integration با alert engine و SLO evaluator
