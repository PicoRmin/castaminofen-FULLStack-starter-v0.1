# گزارش موتور بازیابی و تلاش مجدد همگام‌سازی

## Executive Summary

این پیاده‌سازی یک لایه‌ی بازیابی و تلاش مجدد قابل استفاده مجدد برای سیستم همگام‌سازی ارائه می‌کند که تنها تصمیم‌گیری و برنامه‌ریزی می‌کند و هیچ‌گونه اجرای همگام‌سازی انجام نمی‌دهد. این لایه بر اساس وضعیت فید، چک‌پوینت‌ها، طبقه‌بندی خطا و سیاست‌های بازپویایی طراحی شده است تا تصمیم‌های زیر را با الگوی استراتژی و سیاست ارائه دهد:

- آیا تلاش مجدد مجاز است؟
- آیا بازیابی مناسب است؟
- آیا از چک‌پوینت ادامه داده شود؟
- آیا جریان متوقف شود یا به خطای دائمی تبدیل شود؟

## Architecture

لایه‌ی جدید بر پایه‌ی معماری زیر ساخته شده است:

1. طبقه‌بندی خطا
2. ارزیابی سیاست retry
3. ارزیابی سیاست recovery
4. انتخاب چک‌پوینت برای ادامه
5. تولید RecoveryPlan و RetryDecision
6. انتشار رویدادهای چرخه‌ی حیات فقط به‌عنوان hook

## Responsibilities

- طبقه‌بندی خطاهای موقت، دائمی، زیرساختی، تأمین‌کننده، مخزن، همگام‌سازی، اعتبارسنجی، timeout و موارد غیرمنتظره
- ارزیابی سیاست‌های Retry شامل no-retry، immediate، fixed-delay، linear-backoff، exponential-backoff، adaptive و custom
- ارزیابی سیاست‌های Recovery شامل resume-from-checkpoint، restart-synchronization، restart-download، restart-import، rollback-state، pause-synchronization، permanent-failure و manual-intervention
- تولید RecoveryPlan و RetryDecision به‌صورت Immutable
- انتخاب چک‌پوینت با استفاده از FeedStateManager و FeedCheckpointManager
- ثبت هشدارهای قابل‌استفاده برای نزدیک‌شدن به حد مجاز retry و چک‌پوینت نامعتبر

## Folder Structure

- packages/rss/src/synchronization/classification
- packages/rss/src/synchronization/policies
- packages/rss/src/synchronization/recovery
- packages/rss/src/synchronization/interfaces
- packages/rss/src/synchronization/types
- packages/rss/src/synchronization/errors
- packages/rss/src/synchronization/events

## File Tree

- packages/rss/src/synchronization/classification/failure-classifier.ts
- packages/rss/src/synchronization/policies/retry-policies.ts
- packages/rss/src/synchronization/policies/recovery-policies.ts
- packages/rss/src/synchronization/recovery/index.ts
- packages/rss/src/synchronization/interfaces/recovery.ts
- packages/rss/src/synchronization/types/recovery.ts
- packages/rss/src/synchronization/errors/recovery.ts
- packages/rss/src/synchronization/events/recovery.ts
- packages/rss/src/synchronization/**tests**/recovery-engine.test.ts

## Created Files

- packages/rss/src/synchronization/classification/failure-classifier.ts
- packages/rss/src/synchronization/policies/retry-policies.ts
- packages/rss/src/synchronization/policies/recovery-policies.ts
- packages/rss/src/synchronization/recovery/index.ts
- packages/rss/src/synchronization/interfaces/recovery.ts
- packages/rss/src/synchronization/types/recovery.ts
- packages/rss/src/synchronization/errors/recovery.ts
- packages/rss/src/synchronization/events/recovery.ts
- packages/rss/src/synchronization/**tests**/recovery-engine.test.ts

## Modified Files

- packages/rss/src/synchronization/index.ts
- packages/rss/src/synchronization/errors/index.ts
- packages/rss/src/synchronization/types/index.ts

## Public Exports

موارد زیر از شاخه‌ی public synchronization در دسترس هستند:

- SynchronizationRecoveryEngine
- FailureClassifier
- RetryPolicyRegistry
- RecoveryPolicyRegistry
- RecoveryEngineError
- RetryPolicyError
- RecoveryPolicyError
- FailureClassificationError
- CheckpointRecoveryError
- RetryLimitExceededError
- RecoveryLifecycleHooks

## Dependency Graph

```text
Failure -> FailureClassifier -> FailureClassification
       -> SynchronizationRecoveryEngine -> RetryPolicyRegistry
       -> RecoveryPolicyRegistry
       -> FeedStateManager / FeedCheckpointManager
       -> RecoveryPlan / RetryDecision
```

## Failure Classification Model

در مدل جدید، هر خطا به یکی از انواع زیر طبقه‌بندی می‌شود:

- transient
- permanent
- infrastructure
- provider
- repository
- synchronization
- validation
- timeout
- unexpected
- unknown

## Retry Policies

سیاست‌های پشتیبانی‌شده عبارت‌اند از:

- none
- immediate
- fixed-delay
- linear-backoff
- exponential-backoff
- exponential-backoff-with-jitter
- adaptive
- custom

## Recovery Policies

سیاست‌های پشتیبانی‌شده عبارت‌اند از:

- resume-from-checkpoint
- restart-synchronization
- restart-download
- restart-import
- rollback-state
- pause-synchronization
- permanent-failure
- manual-intervention

## Recovery Plan

RecoveryPlan شامل موارد زیر است:

- recoveryAction
- checkpointReference
- retryPolicy
- recoveryPolicy
- failureClassification
- retryDecision
- recoveryMetadata
- warnings
- statistics
- createdAt

## Checkpoint Recovery

عملیات بازیابی از چک‌پوینت با استفاده از Strategy جداگانه انجام می‌شود تا:

- چک‌پوینت‌های نامعتبر کنار گذاشته شوند
- چک‌پوینت‌های معتبر برای بازیابی انتخاب شوند
- ادامه‌ی کار از آخرین checkpoint مناسب انجام شود
- تا حد امکان از FeedStateManager و FeedCheckpointManager استفاده شود

## Performance Optimizations

- جلوگیری از ارزیابی مکرر policyها در یک درخواست
- استفاده از ساختارهای immutable و Object.freeze
- کاهش تخصیص‌های مکرر در ساخت RecoveryPlan و RetryDecision
- استفاده از چک‌پوینت انتخاب‌شده با حداقل دسترسی دوباره به store

## Extensibility Roadmap

- ادغام با Circuit Breaker آینده
- پشتیبانی از Distributed Recovery
- امکان Dead Letter Queue و workflow orchestration
- امکان bulk recovery و multi-region recovery
- افزودن hookهای بیشتر بدون تغییر در API اصلی

## Remaining Work

- ادغام با موتور همگام‌سازی اصلی در سطح orchestration
- اتصال به داده‌های real persistence store به‌جای store در-memory
- افزودن آزمون‌های بیشتر برای recovery policyهای مختلف
- تکمیل hookهای lifecycle برای رویدادهای واقعی تولیدی
