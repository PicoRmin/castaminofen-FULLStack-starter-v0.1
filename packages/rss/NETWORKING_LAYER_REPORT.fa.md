# گزارش لایه دانلود HTTP

## 1. معماری شبکه
لایه شبکه در بسته RSS به‌صورت مستقل و مجزا از پارسر، دیتابیس، سرویس واردات و منطق کسب‌وکار پیاده‌سازی شده است. این لایه فقط مسئول ساخت، اعتبارسنجی، اجرای و نرمال‌سازی درخواست‌های HTTP است و برای ارائه‌دهندگان قابل استفاده است.

## 2. Pipeline درخواست
درخواست از طریق مراحل زیر جریان می‌یابد:
1. ساخت درخواست با HttpRequestBuilder
2. اعتبارسنجی اولیه توسط HttpResponseValidator
3. اجرای درخواست از طریق HttpClientAdapter
4. مدیریت retry و redirect
5. پردازش compression و تولید HttpResponse نرمال‌شده
6. بازگرداندن DownloadResult به مصرف‌کننده

## 3. انتزاع HTTP
یک interface به نام HttpClientAdapter ایجاد شده است که اجرای درخواست را پنهان می‌کند. این امکان را می‌دهد که آینده‌اَ در آینده از fetch، axios، undici یا هر کتابخانه دیگر بدون تغییر ارائه‌دهنده‌ها استفاده شود.

## 4. استراتژی retry
پشتیبانی از retry با سیاست قابل پیکربندی انجام شده است. پیش‌فرض از backoff نمایی استفاده می‌کند و برای روش‌های GET/HEAD و وضعیت‌های retryable مانند 408، 429، 500، 502، 503 و 504 قابل اجراست.

## 5. استراتژی redirect
پشتیبانی از redirect با محدودیت حداکثری، تشخیص redirect loop و جلوگیری از حلقه بی‌نهایت فراهم شده است. این لایه اطلاعات redirect را در مدل پاسخ نگه می‌دارد.

## 6. استراتژی timeout
زمان‌بندی timeout به‌صورت جداگانه برای اتصال، خواندن و کل درخواست پشتیبانی می‌شود. خطاهای timeout به‌صورت ساختارمند بازگردانده می‌شوند.

## 7. پشتیبانی conditional request
ساختار درخواست شامل فیلدهای If-None-Match و If-Modified-Since است و لایه آماده استفاده از metadata شرطی است، بدون اینکه منطق همگام‌سازی را اجرا کند.

## 8. استراتژی compression
پشتیبانی از gzip، deflate، br و identity وجود دارد. این بخش با ساختار extensible طراحی شده تا در آینده encoding‌های جدید اضافه شوند.

## 9. مدل پاسخ
مدل HttpResponse شامل status، headers، body، encoding، content length، content type، etag، last modified، timing و statistics است. خروجی‌ها از نوع raw HTTP library خارج شده‌اند.

## 10. سلسله مراتب خطا
خطاهای ساختارمند شامل TimeoutError، NetworkError، RedirectLoopError، DownloadFailedError، CompressionError، UnsupportedEncodingError، InvalidContentTypeError، InvalidStatusCodeError و CancellationError ایجاد شده‌اند.

## 11. Hooks diagnostics
Hook‌های diagnostics برای رویدادهای request started، request completed، retry، redirect، download completed، timeout، cancellation و validation warning در دسترس هستند.

## 12. مدل metrics
متریک‌های اختیاری مانند DNS، connection، TLS، download time، total time، downloaded bytes، compressed bytes و decompressed bytes در مدل پاسخ و metrics موجود هستند.

## 13. ملاحظات امنیتی
بررسی‌های اولیه برای URL validation، protocol downgrade، unsafe redirect، redirect loop و unsupported encoding انجام شده است. لایه از اجرای محتوای ریموت جلوگیری می‌کند و فقط درخواست را اجرا می‌کند.

## 14. بهینه‌سازی‌های عملکرد
از کاهش allocation، استفاده مجدد از ساختارهای ساده، مدیریت retry و decompression با ساختار قابل توسعه و جلوگیری از کپی‌های غیرضروری پشتیبانی شده است.

## 15. انتخاب کتابخانه ثالث و توجیه
به‌دلیل عدم وجود نیاز به کتابخانه جدید و این‌که fetch در محیط Node.js در دسترس است، از آن به‌صورت کاملاً پشت abstraction استفاده شده است. این انتخاب باعث شده است وابستگی مستقیم به یک HTTP client خاص در لایه ارائه‌دهنده‌ها وجود نداشته باشد.

## 16. فایل‌های ایجادشده
- packages/rss/src/network/index.ts
- packages/rss/src/network/types.ts
- packages/rss/src/network/errors.ts
- packages/rss/src/network/request-builder.ts
- packages/rss/src/network/retry-policy.ts
- packages/rss/src/network/validation.ts
- packages/rss/src/network/service.ts
- packages/rss/tests/network.test.mjs

## 17. فایل‌های اصلاح‌شده
- packages/rss/src/index.ts
- packages/rss/src/providers/generic/index.ts

## 18. Public exports
- HttpRequestBuilder
- HttpDownloadService
- DefaultRetryPolicy
- HttpResponseValidator
- انواع خطا شبکه
- انواع Request/Response/Diagnostics/Config

## 19. فاز بعدی پیشنهادی
در فاز بعدی، می‌توان این لایه را به‌صورت کامل‌تر با adapter مخصوص fetch/undici، پشتیبانی از auth، cookies، proxy و HTTP/2/3 همراه کرد و سپس ارائه‌دهنده‌ها را به‌طور کامل از هر نوع درخواست مستقیم HTTP جدا کرد.
