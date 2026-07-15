# گزارش اجرای موتور اعتبارسنجی و ددپلیکیشن واردات

## 1) معماری موتور
موتور جدید در بسته RSS با لایه‌گذاری تمیز طراحی شده است:
- Validation layer: مسئول اعتبارسنجی سطوح کاربردی و تولید هشدار/errorها بدون دسترسی به XML، HTTP یا پایگاه داده.
- Matching layer: مسئول تطبیق هویت‌های ورودی با استراتژی‌های قابل گسترش مثل GUID، canonical URL و media URL.
- Conflicts layer: مسئول شناسایی تضادهای ساختاریافته میان داده ورودی و موجود.
- Strategies layer: مسئول انتخاب رفتار merge/update/ignore/reject بر اساس تضادها.
- Deduplication layer: مسئول ساختن ImportPlan و تصمیم‌های typed برای podcast و episode.

## 2) استراتژی اعتبارسنجی
اعتبارسنجی فعلی برای موارد زیر انجام می‌شود:
- وجود عنوان پادکست و اپیزود
- وجود URL فید در قالب http/https
- اعتبار GUID و media URL
- اعتبار تاریخ انتشار
- فرم زبان (language code)
- وجود categories و authors در سطح warning

## 3) استراتژی حل هویت
هویت‌ها به‌صورت مستقل و با استفاده از چندین سیگنال قابل‌استفاده حل می‌شوند:
- Podcast/Feed identity از feedId/providerId/canonicalUrl/feedUrl/title استخراج می‌شود.
- Episode identity از guid/canonicalUrl/mediaUrl/title استخراج می‌شود.
- Media identity بر اساس media URL و canonical URL.
- Author/category identity با نرمال‌سازی lowercase.

## 4) استراتژی تطبیق
در لایه matching، استراتژی‌های قابل‌پیکربندی شامل GUID و canonical URL پشتیبانی می‌شوند. این لایه با interface MatchStrategy و MatchEngine طراحی شده تا در آینده استراتژی‌های جدید بدون تغییر کدهای موجود افزوده شوند.

## 5) مدل امتیاز اعتمادی
هر تطبیق در خروجی خود confidence و reason دارد. مقادیر پشتیبانی‌شده:
- Exact
- Very High
- High
- Medium
- Low
- Unknown

## 6) استراتژی ددپلیکیشن
ددپلیکیشن بر اساس استراتژی‌های هویتی انجام می‌شود و خروجی آن شامل تصمیم‌های deterministic برای ساخت، به‌روزرسانی یا skip است. این موتور فقط تصمیم می‌گیرد و هیچ عملیات پایگاهی انجام نمی‌دهد.

## 7) استراتژی merge
در لایه strategies، MergeStrategy با رفتار conservative تعریف شده است. در صورت وجود conflict، action update انتخاب می‌شود و در صورت نبود conflict، action merge برگردانده می‌شود.

## 8) استراتژی تشخیص conflict
conflicts برای تغییرات title/feed-url/guid بر اساس داده ورودی و موجود شناسایی می‌شود و در خروجی ImportPlan به‌صورت structured بازمی‌گردد.

## 9) ساختار Import Plan
ImportPlan شامل موارد زیر است:
- decisions
- entitiesToCreate
- entitiesToUpdate
- entitiesToMerge
- entitiesToSkip
- rejectedEntities
- warnings
- conflicts
- statistics
- metadata

## 10) استراتژی hashing
هشینگ در ValidationEngine با الگوریتم deterministic ارائه شده است. این لایه برای تولید fingerprint‌های پایدار و قابل‌تعویض در آینده طراحی شده است.

## 11) بهینه‌سازی‌های عملکرد
- حذف محاسبه مجدد چندباره در validation/matching
- استفاده از ساختار سبک و بدون N+1 query
- طراحی deterministic برای جلوگیری از تغییر خروجی در اجرای‌های تکراری

## 12) استراتژی extensibility
برای افزودن استراتژی‌های جدید، فقط کافی است یک MatchStrategy یا MergeStrategy جدید تعریف شود. هیچ بخش مرکزی‌ای برای افزودن استراتژی نیاز به تغییر در کدهای موجود ندارد.

## 13) فایل‌های ایجادشده
- packages/rss/src/import/validation/errors.ts
- packages/rss/src/import/validation/index.ts
- packages/rss/src/import/matching/index.ts
- packages/rss/src/import/conflicts/index.ts
- packages/rss/src/import/strategies/index.ts
- packages/rss/src/import/deduplication/index.ts
- packages/rss/src/import/__tests__/engine.test.ts

## 14) فایل‌های اصلاح‌شده
- packages/rss/src/import/index.ts
- packages/rss/src/index.ts

## 15) Public exports
موتور از طریق این مسیرها در دسترس است:
- packages/rss/src/import/validation
- packages/rss/src/import/deduplication
- packages/rss/src/import/matching
- packages/rss/src/import/conflicts
- packages/rss/src/import/strategies
- packages/rss/src/import/index.ts
- packages/rss/src/index.ts

## 16) کارهای باقیمانده قبل از Synchronization Engine
- ادغام با repository layer واقعی به‌جای داده‌های در-memory
- افزودن استراتژی‌های matching بیشتر مانند slug/title-date/provider-id
- توسعه conflict detector برای metadata/category/author/duration/language
- اتصال به ImportService فعلی برای استفاده از ImportDecisionEngine به‌جای منطق ساده فعلی
- افزودن testهای بیشتر برای update/skip/reject و duplicate detection
