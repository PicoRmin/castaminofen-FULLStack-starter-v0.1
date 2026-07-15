# Prompt-4F - Feed Deduplication & Conflict Resolution Framework

## 1. هدف این مرحله

این مرحله یک فریم‌ورک مستقل و قابل گسترش برای تشخیص تکرار، تحلیل شباهت، شناسایی تعارض، انتخاب feed canonical و ارائه پیشنهادهای ادغام در لایه RSS فراهم می‌کند. هدف اصلی این است که بدون وابستگی به پایگاه داده، موتور Import، لایه پایگاه داده یا منطق تجاری، بتوان برای مجموعه‌ای از feedها تصمیم‌گیری کرد که آیا این‌ها همان منبع هستند یا نه و در صورت تکراری بودن، چگونه باید با تعارض‌ها برخورد شود.

## 2. معماری کلی

این فریم‌ورک از چند لایه مستقل تشکیل شده است:

- لایه ورودی: لیست feed candidates
- لایه similarity engine: ارزیابی چندsignal شباهت
- لایه duplicate detector: طبقه‌بندی نوع تکرار
- لایه conflict detector: تشخیص تعارض‌های ساختاری و متادیتایی
- لایه resolution strategy: پیشنهاد استراتژی‌های حل تعارض
- لایه identity graph: ساخت گراف روابط در حافظه
- لایه scoring: تولید امتیاز اعتماد و توضیح قابل فهم
- لایه نتیجه: خروجی یکسان و ساختارمند DeduplicationResult

## 3. دیاگرام جریان داده (متنی)

Feed candidates
→ Similarity Engine
→ Duplicate Detection
→ Conflict Detection
→ Conflict Classification
→ Resolution Strategy
→ Identity Graph
→ Confidence Scoring
→ DeduplicationResult

## 4. ساختار پوشه‌ها

- packages/rss/src/deduplication
- packages/rss/src/deduplication/core
- packages/rss/src/deduplication/interfaces
- packages/rss/src/deduplication/types
- packages/rss/src/deduplication/errors
- packages/rss/src/deduplication/scoring
- packages/rss/src/deduplication/conflicts
- packages/rss/src/deduplication/graph
- packages/rss/src/deduplication/strategies

## 5. فایل‌های ایجاد شده

- packages/rss/src/deduplication/index.ts
- packages/rss/src/deduplication/core/index.ts
- packages/rss/src/deduplication/interfaces/index.ts
- packages/rss/src/deduplication/types/index.ts
- packages/rss/src/deduplication/errors/index.ts
- packages/rss/src/deduplication/scoring/index.ts
- packages/rss/src/deduplication/conflicts/index.ts
- packages/rss/src/deduplication/graph/index.ts
- packages/rss/src/deduplication/strategies/index.ts
- packages/rss/tests/deduplication.test.ts

## 6. فایل‌های ویرایش شده

- packages/rss/src/index.ts

## 7. کلاس‌های جدید

- FeedDeduplicationService
- WeightedSimilarityScorer
- DuplicateDetector
- BasicConflictDetector
- SimpleConflictClassifier
- InMemoryIdentityGraphBuilder
- ResolutionStrategyRegistry
- PreferCanonicalUrlStrategy
- PreferNewestMetadataStrategy
- PreserveBothStrategy

## 8. Interface های جدید

- ISimilarityScorer
- IDuplicateDetector
- IConflictDetector
- IConflictClassifier
- IConflictResolver
- IIdentityGraphBuilder
- IDeduplicationService

## 9. Type های جدید

- DeduplicationClassification
- ConflictClassification
- ConflictType
- DeduplicationWarningCode
- DeduplicationErrorCode
- DeduplicationWarning
- DeduplicationErrorInfo
- DeduplicationFeedCandidate
- SimilaritySignal
- SimilarityScoreResult
- DuplicateCandidate
- ConflictDetail
- ResolutionRecommendation
- ConfidenceScore
- FeedIdentityNode
- FeedIdentityEdge
- FeedIdentityGraph
- DeduplicationStatistics
- DeduplicationTiming
- DeduplicationOptions
- DeduplicationResult

## 10. DTO های جدید

در این مرحله DTOهای جدید به‌صورت type-safe و در لایه types ارائه شده‌اند. این ساختار برای انتقال داده بین لایه‌ها و سرویس اصلی استفاده می‌شود و قابل تبدیل به DTOهای رسمی در مراحل بعدی است.

## 11. Error های جدید

- DeduplicationError
- DuplicateDetectionError
- ConflictDetectionError
- ConflictResolutionError
- IdentityGraphError
- SimilarityError
- ScoringError

هر خطا شامل code، stage، context، cause و recovery است.

## 12. Strategy های جدید

- PreferCanonicalUrlStrategy
- PreferNewestMetadataStrategy
- PreserveBothStrategy

این استراتژی‌ها به‌صورت قابل توسعه طراحی شده‌اند و در آینده می‌توان استراتژی‌های جدیدی مانند PreferGUID یا ManualReview اضافه کرد.

## 13. Graph Architecture

گراف هویت feed در حافظه ساخته می‌شود و شامل nodeها و edgeهاست. هر node نشان‌دهنده یک candidate و هر edge رابطه میان دو feed را نشان می‌دهد. این گراف برای نمایش canonical، alias، redirect، merged و related relations در آینده مناسب است.

## 14. Similarity Engine

Similarity Engine بر اساس چندین signal وزن‌دار ارزیابی می‌کند:

- canonical URL
- normalized URL
- website URL
- feed GUID
- title
- language
- publisher
- fingerprint
- categories
- artwork
- description

امتیاز نهایی به‌صورت weighted score تولید می‌شود و در نتیجه به‌صورت normalizedScore ارائه می‌شود.

## 15. Duplicate Detection

Duplicate detection بر اساس سه سطح اصلی تصمیم‌گیری می‌کند:

- exact-duplicate
- strong-duplicate
- possible-duplicate
- related-feed
- different-feed
- unknown

در این نسخه، تشخیص بر پایه fingerprint، similarity score و نشانه‌های متادیتایی انجام می‌شود.

## 16. Conflict Detection

Conflict detection در این مرحله تعارض‌های زیر را شناسایی می‌کند:

- title mismatch
- canonical URL mismatch
- website URL mismatch
- language mismatch
- publisher mismatch
- description mismatch
- feed GUID mismatch
- artwork mismatch

هر تعارض با نوع، توضیح، طبقه‌بندی و سطح شدت بازگردانده می‌شود.

## 17. Resolution Strategy

استراتژی حل تعارض جدا از منطق تشخیص تعارض پیاده‌سازی شده است. این امکان را می‌دهد که در آینده برای انواع جدیدی از تعارض، سیاست‌های جدیدی اضافه شود بدون اینکه ساختار اصلی تغییر کند.

## 18. Confidence Scoring

Confidence scoring شامل:

- امتیاز عددی
- توضیح متناظر
- سطح high/medium/low

این امتیازها برای هر feed candidate تولید می‌شوند تا تصمیم‌گیری‌های بعدی شفاف و قابل استناد باشد.

## 19. Dependency Graph

این فریم‌ورک هیچ‌گونه وابستگی به پایگاه داده، Prisma، Import Engine، Worker یا لایه REST ندارد. وابستگی‌های آن محدود به خود ماژول RSS و انواع مشترک است.

## 20. Public API

Public API اصلی از طریق ماژول زیر در دسترس است:

- packages/rss/src/deduplication

و سرویس اصلی:

- FeedDeduplicationService

## 21. نحوه استفاده

```ts
import { FeedDeduplicationService } from '@castaminofen/rss';

const service = new FeedDeduplicationService();
const result = await service.deduplicate([feedA, feedB]);
```

## 22. نمونه جریان اجرا

1. ورودی feed candidates دریافت می‌شود.
2. Similarity Engine برای هر جفت feed امتیاز می‌دهد.
3. Duplicate Detection نوع تکرار را مشخص می‌کند.
4. Conflict Detection تعارض‌ها را تشخیص می‌دهد.
5. Resolution Strategy پیشنهادهای حل را تولید می‌کند.
6. Identity Graph روابط را در حافظه می‌سازد.
7. نتیجه نهایی به‌صورت DeduplicationResult منتشر می‌شود.

## 23. ویژگی‌های پیاده‌سازی

- کاملاً مستقل از import engine
- با TypeScript strict طراحی شده
- قابل گسترش و بدون تکرار منطق
- قابل استفاده برای هزاران feed در حافظه
- بر اساس composition over inheritance

## 24. نکات Performance

- محاسبه similarity فقط برای جفت‌های candidate انجام می‌شود.
- graph در حافظه و بدون وابستگی DB ساخته می‌شود.
- از hashing و normalization برای جلوگیری از محاسبات تکراری استفاده شده است.
- ساختار برای گسترش به الگوریتم‌های آینده آماده است.

## 25. نکات امنیتی

- هیچ داده‌ای به پایگاه داده منتقل نمی‌شود.
- ورودی‌ها فقط برای تحلیل درونی استفاده می‌شوند.
- خطاها با context و recovery ثبت می‌شوند.
- خروجی‌ها به‌صورت ساختارمند و قابل کنترل هستند.

## 26. محدودیت‌های فعلی

- تعارض‌های پیشرفته semantic similarity هنوز پیاده‌سازی نشده‌اند.
- استراتژی‌های پیچیده‌تر مثل ML-based یا community-based هنوز وجود ندارند.
- graph فعلاً در-memory و ساده است.

## 27. مواردی که عمداً پیاده‌سازی نشده‌اند

- Import Engine
- Database persistence
- Sync و worker pipeline
- Business logic layer
- REST API
- Merge execution

## 28. پیشنهاد برای توسعه آینده

- اضافه‌کردن استراتژی‌های جدید مانند PreferGUID و ManualReview
- افزودن semantic similarity
- افزودن publisher reputation و community verification
- ساخت graph distributable
- افزودن caching برای comparisonهای تکراری

## 29. TODO های مرحله بعد

- اتصال به لایه discovery برای دریافت داده‌های واقعی‌تر
- ادغام با validatorهای RSS موجود
- اضافه‌کردن تست‌های بیشتر برای conflict و graph
- گسترش به الگوریتم‌های similarity پیشرفته‌تر

## 30. خلاصه تغییرات انجام شده

در این مرحله یک فریم‌ورک کامل برای deduplication و conflict resolution در ماژول RSS پیاده‌سازی شد. این فریم‌ورک شامل similarity engine، duplicate detection، conflict detection، conflict resolution strategies، identity graph، confidence scoring و نتیجهٔ یکپارچه DeduplicationResult است. همه این‌ها بدون وابستگی به پایگاه داده یا import engine پیاده‌سازی شده‌اند و برای استفاده در مراحل بعدی آماده‌اند.
