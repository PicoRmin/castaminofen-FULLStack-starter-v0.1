# گزارش پیاده‌سازی فریم‌ورک Feed Discovery و Feed Validation

## 1) معماری Discovery

فریم‌ورک Discovery در بسته RSS به‌صورت جدا از منطق کسب‌وکار و بدون هرگونه وابستگی به پایگاه‌داده، Prisma، Import Engine یا سرویس‌های سینک طراحی شده است. این لایه تنها مسئول کشف، نرمال‌سازی، اعتبارسنجی، شناسایی هویت، ارزیابی کیفیت و سلامت فید است.

معماری این بخش بر اصول زیر استوار است:
- تک‌وظیفه‌گرایی: هر ماژول فقط یک مسئولیت دارد.
- تفکیک لایه‌ای: نرمال‌سازی، اعتبارسنجی، هویت، کیفیت، سلامت و fingerprint از هم جدا شده‌اند.
- وابستگی معکوس: سرویس اصلی از interface‌های مشخص استفاده می‌کند و به جای وابستگی مستقیم به پیاده‌سازی‌های خاص، با کامپوزیشن کار می‌کند.
- عدم وابستگی به دیتابیس: خروجی‌ها فقط داده‌های قابل‌استفاده برای لایه‌های آینده‌اند و هیچ‌گونه entity یا مدل پایگاه‌داده ایجاد نمی‌شوند.

## 2) Pipeline Discovery

پایپ‌لاین فعلی به این ترتیب اجرا می‌شود:
1. دریافت URL اولیه و داده‌های خام فید.
2. نرمال‌سازی URL و متادیتا.
3. اعتبارسنجی ساختار و دسترسی‌پذیری فید.
4. تعیین هویت فید بر اساس چند سیگنال.
5. ارزیابی کیفیت متادیتا و ساختار فید.
6. ارزیابی سلامت فید بر اساس نشانه‌های مشاهده‌پذیر.
7. تولید fingerprint پایدار و Deterministic.
8. بازگرداندن یک DiscoveryResult واحد.

## 3) استراتژی اعتبارسنجی فید

اعتبارسنجی در چند سطح انجام می‌شود:
- بررسی اینکه محتوای XML/Feed خالی یا نامعتبر باشد.
- بررسی وجود فیلدهای ضروری مانند title و language.
- بررسی ساختار کلی فید و وجود metadata پایه.
- تولید warning برای مواردی مانند MIME type غیرمنتظره، feed بزرگ، metadata ضعیف و زبان نامشخص.

این لایه به‌صورت ساختارمند نتایج را برمی‌گرداند و در صورت لزوم خطاهای مشخص ایجاد می‌کند.

## 4) استراتژی Canonicalization

Canonical URL با این اصول نرمال‌سازی می‌شود:
- حذف fragment
- حذف username/password
- حذف پورت پیش‌فرض http/https
- پایین‌نویسی hostname و protocol
- حذف trailing slash اضافی
- نگه‌داشتن URL به‌صورت Deterministic

این کار برای جلوگیری از تفاوت‌های ظاهری ولی معادل در URLها انجام می‌شود.

## 5) استراتژی حل هویت Feed

هویت فید با چند سیگنال همراه با وزن هم‌پوشانی تعیین می‌شود:
- canonical URL
- normalized URL
- website URL
- title
- language
- publisher

این رویکرد از اتکا به یک فیلد منفرد جلوگیری می‌کند و هویت را مقاوم‌تر می‌سازد.

## 6) استراتژی Fingerprint

Fingerprint با استفاده از الگوریتم hash قابل‌پیکربندی تولید می‌شود. در حال حاضر پیش‌فرض sha256 است اما می‌توان در آینده از الگوریتم دیگری استفاده کرد.

ورودی‌های fingerprint شامل موارد زیر است:
- primaryKey هویت فید
- canonical URL
- website URL
- title
- language
- publisher
- version
- URL اولیه

## 7) مدل ارزیابی کیفیت

کیفیت بر اساس وجود یا عدم وجود متادیتاهای مهم ارزیابی می‌شود. شاخص‌های اصلی شامل موارد زیر هستند:
- title
- description
- language
- categories
- author/publisher
- media URLs
- publication date

امتیاز کیفیت از 0 تا 100 تنظیم می‌شود و در چهار سطح طبقه‌بندی می‌شود: excellent، good، fair، poor.

## 8) مدل ارزیابی Health

سلامت فید فقط بر اساس نشانه‌های قابل مشاهده تعیین می‌شود:
- اگر اعتبارسنجی شکست بخورد → broken
- اگر امتیاز کیفیت کم باشد → poor یا warning
- اگر language یا metadata‌های مهم وجود نداشته باشند → warning

در این نسخه، تاریخچه همگام‌سازی یا رفتار تاریخی در نظر گرفته نشده است.

## 9) ساختار DiscoveryResult

DiscoveryResult شامل موارد زیر است:
- originalUrl
- canonicalUrl
- resolvedUrl
- normalizedFeed
- identity
- fingerprint
- validation
- quality
- health
- warnings
- errors
- statistics
- timing

این ساختار برای استفاده در لایه‌های آینده مانند Import Engine کاملاً آماده است.

## 10) استراتژی Warning

Warnings به‌صورت ساختارمند تولید می‌شوند و هر warning شامل موارد زیر است:
- code
- message
- stage
- severity

نمونه warningها:
- missing-language
- missing-image
- weak-metadata
- large-feed
- unexpected-mime-type

این warnings مانع از شکست Discovery نمی‌شوند و برای هشداردهی استفاده می‌شوند.

## 11) هیرارشی Error

در این فریم‌ورک چند نوع خطای Discovery-Specific تعریف شده است:
- FeedDiscoveryError
- FeedValidationError
- FeedIdentityError
- FeedQualityError
- FeedHealthError
- CanonicalizationError
- FingerprintError

هر خطا شامل code، stage، context، cause و recovery است.

## 12) بهینه‌سازی‌های عملکرد

برای جلوگیری از هزینه‌های غیرضروری:
- URLها یک‌بار نرمال‌سازی می‌شوند.
- هویت بر اساس چند سیگنال و بدون محاسبه‌های تکراری تعیین می‌شود.
- fingerprint با یک hash deterministic تولید می‌شود.
- ساختار داده‌ها به‌گونه‌ای طراحی شده‌اند که نیاز به بازگشت و پیمایش تکراری را به حداقل برسانند.

## 13) استراتژی Extension

این معماری برای قابلیت توسعه آینده آماده است. در آینده می‌توان بدون بازنویسی لایه اصلی از این فریم‌ورک برای موارد زیر استفاده کرد:
- duplicate detection
- feed merge suggestions
- publisher reputation
- spam detection
- ML-based quality scoring
- recommendations

اما در این پیاده‌سازی فقط لایه‌ی پایه و بدون منطق کسب‌وکار ارائه شده است.

## 14) فایل‌های ایجادشده

- packages/rss/src/discovery/index.ts
- packages/rss/src/discovery/types/index.ts
- packages/rss/src/discovery/interfaces/index.ts
- packages/rss/src/discovery/errors/index.ts
- packages/rss/src/discovery/validators/index.ts
- packages/rss/src/discovery/identity/index.ts
- packages/rss/src/discovery/quality/index.ts
- packages/rss/src/discovery/health/index.ts
- packages/rss/src/discovery/core/index.ts
- packages/rss/tests/discovery.test.ts

## 15) فایل‌های اصلاح‌شده

- packages/rss/src/index.ts

## 16) Public exports

فریم‌ورک از طریق این مسیرها در بسته RSS قابل دسترس است:
- packages/rss/src/discovery
- packages/rss/src/index.ts

این شامل سرویس اصلی و انواع مرتبط می‌شود.

## 17) کارهای باقیمانده قبل از Import Engine

قبل از اتصال به Import Engine، کارهای زیر پیشنهاد می‌شود:
- ادغام با layer HTTP و Parser واقعی‌تر برای استخراج دقیق‌تر metadata
- گسترش validation برای تشخیص HTML masquerading، login pages، Cloudflare barriers و خطاهای HTTP پیچیده‌تر
- اضافه‌کردن تست‌های بیشتر برای حالات edge و feedهای خراب
- افزودن پشتیبانی از namespace‌های بیشتر و parserهای تخصصی‌تر
- اتصال به provider layer برای تولید DiscoveryRequest از داده‌های واقعی

## نتیجه‌گیری

فریم‌ورک Feed Discovery و Feed Validation به‌صورت مستقل، قابل استفاده مجدد، بدون وابستگی به دیتابیس و با تمرکز روی مسئولیت‌های مشخص پیاده‌سازی شده است. این لایه برای استفاده در Import Engine آینده آماده است و از پیاده‌سازی‌های قبلی پروژه استفاده می‌کند.
