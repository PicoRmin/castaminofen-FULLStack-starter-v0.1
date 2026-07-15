# گزارش API هماهنگ‌سازی فید

## Executive Summary

این مستند، اجرای API هماهنگ‌سازی فید در معماری REST موجود را پوشش می‌دهد. هدف اصلی، ارائه دو انتپوی امن و قابل‌استفاده برای درخواست هماهنگ‌سازی یک فید و همه فیدهای ثبت‌شده است، بدون پیاده‌سازی منطق اجرای هماهنگ‌سازی و بدون معرفی موتورهای جدید یا برنامه‌زمان‌بندی.

## Architecture

لایه HTTP تنها مسئول دریافت درخواست و تبدیل آن به یک درخواست هماهنگ‌سازی است. منطق کسب‌وکار در سرویس کاربردی لایه API قرار دارد و از abstractions موجود در بسته RSS برای استفاده از موتور هماهنگ‌سازی، قفل‌گذاری فید، و telemetry مجدد بهره می‌برد.

## Responsibilities

- Controller: دریافت درخواست HTTP و تبدیل به مدل‌های DTO
- Service: آماده‌سازی درخواست هماهنگ‌سازی و اجرای آن از طریق موتور موجود
- Validation: استفاده از class-validator و NestJS ValidationPipe
- Authentication/Authorization: استفاده از JwtAuthGuard موجود
- Synchronization: استفاده از SynchronizationEngine موجود
- Locking: استفاده از FeedLockManager و FeedConcurrencyController
- Telemetry: اتصال به رویدادهای lifecycle از طریق hooks

## Folder Structure

- apps/api/src/modules/feeds/
  - feeds.controller.ts
  - feeds.module.ts
  - feeds.service.ts
  - feeds-synchronization.service.ts
  - dto/
    - sync-feed.dto.ts
    - sync-response.dto.ts
    - sync-feed.dto.spec.ts

## File Tree

```text
apps/api/src/modules/feeds/
├── dto/
│   ├── create-feed.dto.ts
│   ├── feed-response.dto.ts
│   ├── sync-feed.dto.ts
│   ├── sync-feed.dto.spec.ts
│   ├── sync-response.dto.ts
│   └── ...
├── feeds.controller.ts
├── feeds.module.ts
├── feeds.service.ts
└── feeds-synchronization.service.ts
```

## Created Files

- apps/api/src/modules/feeds/dto/sync-feed.dto.ts
- apps/api/src/modules/feeds/dto/sync-response.dto.ts
- apps/api/src/modules/feeds/dto/sync-feed.dto.spec.ts
- apps/api/src/modules/feeds/feeds-synchronization.service.ts
- docs/rss/Feed-Synchronization-API-Report.fa.md

## Modified Files

- apps/api/src/modules/feeds/feeds.controller.ts
- apps/api/src/modules/feeds/feeds.module.ts
- apps/api/package.json
- apps/api/tsconfig.json
- packages/rss/src/synchronization/comparison/index.ts
- packages/rss/src/synchronization/interfaces/recovery.ts
- packages/rss/src/synchronization/policies/recovery-policies.ts
- packages/rss/src/synchronization/policies/retry-policies.ts
- packages/rss/src/synchronization/leases/feed-lease-manager.ts
- packages/rss/src/synchronization/locking/feed-lock-manager.ts
- packages/rss/src/synchronization/incremental/index.ts
- packages/rss/src/synchronization/recovery/index.ts
- packages/rss/src/synchronization/index.ts

## Public Exports

- FeedsController
- FeedsSynchronizationService
- SyncFeedRequestDto
- SyncFeedOptionsDto
- SyncFeedResponseDto
- SyncAllFeedsResponseDto

## Endpoint Documentation

### POST /api/feeds/:id/sync

- Trigger synchronization for a single feed
- Accepts optional request body with synchronization options
- Returns accepted/rejected status with correlation metadata

### POST /api/feeds/sync-all

- Trigger synchronization for all registered feeds
- Accepts optional request body
- Returns accepted status and feed count

## Synchronization Flow

1. Request enters the controller.
2. Authentication and authorization are enforced by the existing JwtAuthGuard.
3. The controller delegates to the synchronization service.
4. The service resolves the feed and builds a SynchronizationRequest.
5. A feed lock is acquired through the reusable locking abstraction.
6. The request is passed to SynchronizationEngine.
7. Lifecycle events emit telemetry-compatible events.
8. The response is mapped back to the HTTP contract.

## Request Validation

- Route parameter id is accepted as a string and validated through existing NestJS pipeline.
- DTO validation uses class-validator decorators.
- Optional synchronization options support dry run, force, preview, validate-only, priority, reason, and correlationId.

## Authentication Integration

- The endpoints reuse the existing JwtAuthGuard from the API module.
- No custom auth logic was introduced.

## Authorization Integration

- The endpoints follow the existing feed module authorization model.
- No new roles or permissions were added.

## Locking Integration

- Feed locking is integrated through FeedLockManager and FeedConcurrencyController.
- The implementation respects the existing locking abstraction rather than bypassing it.

## Telemetry Integration

- Synchronization lifecycle hooks emit event types such as synchronization-requested, synchronization-accepted, synchronization-rejected, and synchronization-completed.
- No dedicated telemetry SDK was introduced.

## Error Mapping

- Feed not found maps to NotFoundException.
- Lock conflicts are surfaced as structured synchronization errors.
- Validation failures are handled by the existing validation pipeline.

## Swagger Documentation

- Swagger decorators are attached to both endpoints.
- DTOs and response models are documented through NestJS Swagger metadata.

## Performance Optimizations

- Controllers remain thin.
- The API performs one feed lookup and one synchronization request flow per endpoint.
- The service reuses existing engine abstractions rather than reimplementing workflow logic.

## Future Roadmap

- Add dedicated application service integration with real synchronization workers.
- Expand response models to include richer status and progress details.
- Add end-to-end contract tests for the new endpoints.

## Remaining Work

- Connect the API to a real synchronization backend or orchestration service if the platform later requires actual import execution.
- Add integration tests that run through the controller with an authenticated request context.
- Extend the response DTOs to expose richer operational metadata.
