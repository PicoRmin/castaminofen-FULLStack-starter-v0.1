# گزارش پیاده‌سازی Generic RSS Provider

## 1) معماری Generic Provider

Generic Provider به‌عنوان یک لایه‌ی هماهنگ‌کننده و کم‌حجم طراحی شده است. این Provider فقط مسئول اعتبارسنجی URL، دانلود محتوای XML، فراخوانی Parser Factory و بازگرداندن خروجی یکپارچه‌ی ProviderResult است. هیچ‌گونه منطق کسب‌وکار، دسترسی به دیتابیس، سینک‌سازی یا لایه‌ی API در آن تعبیه نشده است.

## 2) خط‌لوله اجرای Provider

1. اعتبارسنجی URL
2. دانلود محتوای XML از طریق abstraction مربوط به دانلود
3. ارسال محتوای دانلودشده به Parser Factory
4. دریافت خروجی ParseResult یکپارچه
5. نرمال‌سازی و بازگشت ProviderResult

## 3) استراتژی اعتبارسنجی URL

Provider از URL استاندارد Node استفاده می‌کند و فقط URLهای HTTP/HTTPS را قبول می‌کند. موارد زیر بررسی می‌شوند:

- URL معیوب
- پروتکل پشتیبانی‌نشده
- hostname خالی
- ورودی خالی یا whitespace

## 4) یکپارچه‌سازی دانلود

Download layer فقط از abstraction تعریف‌شده‌ی دانلود استفاده می‌کند. در نسخه‌ی فعلی، یک downloader پیش‌فرض بر پایه fetch ارائه شده و در صورت نیاز با injection جایگزین می‌شود. Provider هیچ‌گونه retry، caching یا منطق شبکه‌ای اختصاصی ندارد.

## 5) یکپارچه‌سازی Parser

Provider مستقیماً با Parser Factory تعامل دارد و هرگز parser concrete را مستقیماً نمونه‌سازی نمی‌کند. Parser selection و تشخیص نوع feed به‌طور کامل به Parser Framework سپرده شده است.

## 6) مدل متادیتا Provider

متادیتا شامل موارد زیر است:

- شناسه Provider
- نام و نمایش نام
- توضیحات
- نسخه
- اولویت
- فرمت‌های پشتیبانی‌شده
- دامنه‌های پشتیبانی‌شده
- capabilities
- author
- documentationUrl
- experimental و enabled

## 7) مدل Capability

Capabilities شامل پشتیبانی از RSS، Atom، namespace‌های Podcast، redirects، compression و streaming است. این مدل برای توسعه‌ی آتی و providerهای بعدی قابل گسترش است.

## 8) استراتژی مدیریت خطا

خطاها بر اساس hierarchy موجود Provider Framework ساخته شده‌اند. خطاهای اصلی شامل:

- InvalidFeedUrlError
- UnsupportedProtocolError
- DownloadFailedError
- EmptyResponseError
- UnsupportedContentTypeError
- ProviderExecutionError

## 9) استراتژی Warning

Provider برای موارد زیر warning تولید می‌کند یا در خروجی بازمی‌گرداند:

- MIME type غیرمنتظره
- metadata اختیاری از دست رفته
- redirect chains
- feedهای بسیار بزرگ
- فیلدهای منسوخ‌شده
- namespace‌های ناشناخته

## 10) Diagnostics Hooks

Provider یک نقطه‌ی اتصال برای diagnostics فراهم می‌کند تا رویدادهای validation، download و parser را در آینده ثبت یا مشاهده کرد. در این نسخه، hook‌ها به‌صورت سازگار و بدون logging داخلی ارائه شده‌اند.

## 11) ملاحظات Performance

- URL validation با حداقل parsing انجام می‌شود
- Parser Factory یک‌بار ساخته می‌شود و دوباره استفاده می‌شود
- ساخت متادیتا و capabilityها immutable و ثابت است
- Provider به‌صورت stateless در سطح عملیاتی طراحی شده است

## 12) استراتژی توسعه برای Providerهای آینده

این Generic Provider به‌عنوان template برای providerهای آینده طراحی شده است. Providerهای آینده می‌توانند فقط رفتارهای اختصاصی خود را override یا extend کنند و از همان Contract و abstractions استفاده کنند.

## 13) فایل‌های ایجادشده

- packages/rss/src/providers/generic/index.ts
- packages/rss/src/providers/generic/errors.ts
- packages/rss/src/providers/generic/**tests**/generic-provider.test.ts
- packages/rss/src/providers/generic/REPORT_FA.md

## 14) فایل‌های اصلاح‌شده

- packages/rss/src/providers/index.ts
- packages/rss/src/types/index.ts
- packages/rss/src/providers/generic/**tests**/generic-provider.test.ts

## 15) Public exports

- GenericProvider
- GenericProviderOptions

## 16) فاز پیشنهادی بعدی

در مرحله‌ی بعد، می‌توان Generic Provider را با یک downloader واقعی‌تر از لایه‌ی شبکه‌ی پروژه ادغام کرد و تست‌های integration بیشتری برای URLهای واقعی و feedهای RSS/Atom اضافه کرد.
