# گزارش چارچوب تست همگام‌سازی RSS

## Executive Summary

این چارچوب تست، لایه‌ای و قابل‌استفاده مجدد برای ارزیابی کیفیت، مقاومت، determinism، سازگاری و انطباق معماری زیرسیستم همگام‌سازی RSS فراهم می‌کند. هدف اصلی، تأیید رفتار صحیح موتور همگام‌سازی، سرویس واردات، بازیابی خطا، مدیریت checkpoint، قفل‌گذاری، سلامت feed و تلومتری بدون افزودن منطق کسب‌وکار به فضای تولید است.

## Architecture

چارچوب به‌صورت لایه‌محور طراحی شده و از جریان زیر پیروی می‌کند:

1. Test Runner
2. Fixtures
3. Mocks
4. Test Helpers
5. Integration Environment
6. Assertions
7. Compliance Report

این ساختار از اصل Single Responsibility پیروی می‌کند و امکان گسترش به E2E، chaos، mutation و property-based testing را در آینده فراهم می‌سازد.

## Folder Structure

- packages/rss/tests/unit
- packages/rss/tests/integration
- packages/rss/tests/resilience
- packages/rss/tests/compliance
- packages/rss/tests/performance
- packages/rss/tests/fixtures
- packages/rss/tests/mocks
- packages/rss/tests/helpers
- packages/rss/tests/contracts
- packages/rss/tests/types

## Testing Strategy

استراتژی این چارچوب شامل موارد زیر است:

- Unit Tests برای بررسی state machine، difference engine، retry policy، recovery policy، health scoring، checkpoint logic و lock lifecycle
- Integration Tests برای ارزیابی جریان کامل Provider → Parser → Validation → Import → Persistence → Checkpoint → Synchronization → Telemetry → Health
- Contract Tests برای اطمینان از ثبات سطح API و قراردادها
- Resilience Tests برای شبیه‌سازی خطاهای شبکه، خرابی repository، provider failure، checkpoint corruption و lock expiration
- Compliance Tests برای بررسی معماری، قاعده‌های وابستگی، نام‌گذاری و ساختار پوشه‌ها
- Performance Smoke Tests برای اندازه‌گیری latency و حجم حافظه در مسیرهای کلیدی
- Determinism و Idempotency Tests برای اطمینان از تکرارپذیری نتایج و جلوگیری از entity duplication
- Concurrency Tests برای بررسی race condition و lock conflict

## Test Pyramid

- Base: Unit Tests
- Middle: Integration + Contract + Resilience Tests
- Top: Performance Smoke + Compliance Tests

## Coverage Strategy

پوشش تست‌ها بر روی نقاط زیر متمرکز است:

- مسیرهای موفق همگام‌سازی
- مسیرهای شکست و بازیابی
- حالت‌های preview/validation/dry-run
- تولید و بازیابی checkpoint
- چرخه acquire/renew/release/expire lock
- تبدیل و تجمیع متریک و رویداد
- جلوگیری از ایجاد duplicate episode و podcast

## Resilience Strategy

برای تأیید مقاومت سیستم، سناریوهای زیر در چارچوب پوشش داده شده‌اند:

- Fault injection برای provider failure
- Simulation of invalid checkpoint
- Corrupted state handling
- Retry and recovery paths
- Lease/lock expiration scenarios

## Integration Strategy

در سطح ادغام از Fixtures واقعی و Mocks قابل‌استفاده برای شبیه‌سازی جریان کامل استفاده شده است. این رویکرد باعث می‌شود تست‌ها تا حد امکان به رفتار واقعی نزدیک باشند بدون وابستگی به زیرساخت‌های خارجی.

## Performance Strategy

در این بخش، آزمون‌های smoke performance برای اندازه‌گیری زمان اجرای مسیرهای زیر پیاده‌سازی شده‌اند:

- Synchronization latency
- Import latency
- Checkpoint loading
- Metric collection
- Health evaluation

## Unit Tests

تست‌های واحد شامل موارد زیر هستند:

- state machine transitions
- checkpoint lifecycle
- lock lifecycle
- recovery policy evaluation
- health scoring and classification

## Integration Tests

تست‌های یکپارچه شامل:

- ImportService + SynchronizationEngine
- Persistence flow
- Event emission
- End-to-end realistic fixture execution

## Contract Tests

تست‌های قرارداد شامل:

- public API surface برای ImportService
- public API surface برای SynchronizationEngine
- consistency of output shapes and arrays

## Compliance Tests

تست‌های انطباق شامل:

- layered structure compliance
- folder organization
- reusable test asset placement

## Resilience Tests

تست‌های مقاومت شامل:

- provider failure injection
- invalid checkpoint and state corruption
- deterministic fallback behavior

## Performance Tests

تست‌های عملکردی smoke شامل:

- small synchronization path timing
- basic execution budget checks

## Determinism Validation

تست‌ها برای اطمینان از deterministic behavior طراحی شده‌اند و در شرایط مشابه، خروجی‌های مشابهی تولید می‌کنند.

## Idempotency Validation

در این چارچوب تلاش شده است تا از ایجاد duplicate entity و تکرارپذیری غیرمنتظره جلوگیری شود.

## Concurrency Validation

قفل‌ها و lease‌ها در سناریوهای ساده برای بررسی مالکیت، expiration و conflict بررسی شده‌اند.

## Fault Injection Strategy

ساز و کارهای زیر برای Fault Injection فراهم شده‌اند:

- provider-unavailable
- invalid state
- corrupted checkpoint metadata
- failure-aware import service wrapper

## Fixtures

Fixtures قابل استفاده شامل موارد زیر هستند:

- small RSS feed
- duplicate RSS feed
- large RSS feed
- malformed XML
- podcast namespace RSS feed

## Mocks

Mockهای قابل استفاده برای موارد زیر تعریف شده‌اند:

- feed repository
- episode repository
- state store
- persistence coordinator
- event recorder
- fault injection controller

## Test Helpers

کمک‌کننده‌های تست شامل موارد زیر هستند:

- lifecycle reporter
- fixture loader helpers
- mock creators
- shared test framework types

## Public Exports

تابع‌ها و ماژول‌های تستی از طریق فایل زیر قابل دسترسی‌اند:

- packages/rss/tests/index.ts

## Dependency Graph

- Tests → Fixtures
- Tests → Mocks
- Tests → Helpers
- Tests → src/import/service
- Tests → src/synchronization/core/synchronization-engine
- Tests → src/synchronization/state/feed-state-manager
- Tests → src/synchronization/checkpoints/feed-checkpoint-manager
- Tests → src/synchronization/locking/feed-lock-manager
- Tests → src/synchronization/recovery
- Tests → src/health/*

## Remaining Work

- افزودن آزمون‌های E2E در آینده
- افزودن chaos و mutation testing
- افزودن property-based تست برای سناریوهای بازآرایی و retry
- افزودن snapshot و golden master برای گزارش‌های پیچیده‌تر
- گسترش پوشش به بخش‌های concurrency و distributed scenarios

## Created Files

- packages/rss/tests/unit/synchronization-unit.test.ts
- packages/rss/tests/integration/synchronization-integration.test.ts
- packages/rss/tests/resilience/synchronization-resilience.test.ts
- packages/rss/tests/compliance/synchronization-compliance.test.ts
- packages/rss/tests/performance/synchronization-performance.test.ts
- packages/rss/tests/contracts/synchronization-contract.test.ts
- packages/rss/tests/fixtures/synchronization-fixtures.ts
- packages/rss/tests/mocks/synchronization-mocks.ts
- packages/rss/tests/helpers/test-lifecycle.ts
- packages/rss/tests/types/framework.ts
- packages/rss/tests/index.ts

## Modified Files

- هیچ فایل تولیدی برای این کار اصلاح نشده است.
- همه تغییرات در لایه تست و مستندسازی انجام شده‌اند.
