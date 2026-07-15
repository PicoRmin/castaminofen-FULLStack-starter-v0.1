# گزارش پیاده‌سازی لایه هماهنگ‌سازی پارسر

## 1. معماری فریم‌ورک

فریم‌ورک پارسر در این پیاده‌سازی بر اساس یک لایه‌سازی تمیز طراحی شده است:

1. بارگذاری XML
2. اعتبارسنجی ساختار
3. حل namespace
4. انتخاب پارسر توسط Factory
5. اجرای پارسر مربوطه
6. تبدیل مدل میانی به DTO و ساخت ParseResult یکپارچه

این معماری از هرگونه وابستگی به دیتابیس، رپو، سرویس ورود، برنامه‌های زمان‌بندی و منطق کسب‌وکار دوری کرده است.

## 2. طراحی Parser Factory

Parser Factory یک نقطه ورود واحد برای پردازش مستند XML فراهم می‌کند. این Factory:

- مستند را از ورودی XML دریافت می‌کند
- با استفاده از XmlDocumentFactory XML را می‌خواند
- NamespaceResolver را برای آماده‌سازی زمینه انتخاب استفاده می‌کند
- از Parser Registry برای انتخاب پارسر مناسب استفاده می‌کند
- نتیجه نهایی را در قالب ParseResult یکپارچه بازمی‌گرداند

## 3. معماری Registry

Parser Registry امکان ثبت پویا و انعطاف‌پذیر پارسرها را فراهم می‌کند. در این پیاده‌سازی:

- پارسرهای RSS و Atom به‌صورت خودکار در registry ثبت می‌شوند
- ثبت پارسرها بدون نیاز به تغییر Factory انجام می‌شود
- امکان اضافه‌کردن پارسرهای آینده مانند Podcast Namespace یا Media RSS بدون تغییر کدهای موجود فراهم است

## 4. استراتژی انتخاب پارسر

انتخاب پارسر بر اساس ساختار ریشه XML، namespace و نوع سند انجام می‌شود:

- RSS Parser برای RSS و RDF فعال است
- Atom Parser برای feedهای Atom با namespace مرتبط فعال است
- در صورت عدم تطابق، یک خطای ساختاریافته UnsupportedFeedError/UNSUPPORTED_FEED بازگردانده می‌شود

## 5. هیرارشی خطا

هیرارشی خطاها در قالب یک مدل ساختاریافته پیاده‌سازی شده است. هر خطا شامل موارد زیر است:

- کد خطا
- پیام
- دسته‌بندی
- شدت
- نام پارسر
- مرحله اجرا
- خط و ستون در صورت وجود
- context
- علت اصلی
- پیشنهاد بازیابی

## 6. سیستم Warning

سیستم warning برای موارد غیرمهم اما قابل توجه طراحی شده است. مثال‌ها:

- فیلد اختیاری از دست رفته
- namespace ناشناخته
- المنت نامشخص
- attribute پشتیبانی‌نشده

این warning‌ها باعث شکست parsing نمی‌شوند و در ParseResult نگهداری می‌شوند.

## 7. ساختار ParseResult

ParseResult یک خروجی یکپارچه و مستقل از نوع پارسر است. این ساختار شامل موارد زیر است:

- success
- feed
- episodes
- warnings
- errors
- metadata
- statistics
- timings

## 8. بهینه‌سازی‌های عملکرد

بهینه‌سازی‌های اصلی در این لایه عبارت‌اند از:

- جلوگیری از پیمایش مکرر درخت XML
- استفاده از resolve یک‌باره namespace
- کاهش allocationهای غیرضروری
- استفاده از ساختارهای ساده و قابل بازاستفاده برای خروجی

## 9. استراتژی Metrics

ممکن است در آینده از metrics برای پایش عملکرد استفاده شود. این لایه متریک‌های زیر را در ساختار خود پشتیبانی می‌کند:

- زمان کل parsing
- زمان انتخاب پارسر
- زمان parse
- تعداد XML nodes
- تعداد episode‌های استخراج‌شده
- تعداد warning
- تعداد error

## 10. Diagnostics Hooks

لایه diagnostics با یک hook model پیاده‌سازی شده است تا در آینده امکان ثبت رویدادها فراهم شود. رویدادهای پشتیبانی‌شده شامل:

- انتخاب پارسر
- validation
- namespace resolution
- mapping
- warning
- error

## 11. معماری Plugin

معماری فعلی برای plugin support آماده است. با ثبت یک پارسر جدید در Registry، Factory بدون هیچ تغییری برای آن کار می‌کند. این موضوع امکان افزودن پارسرهای سفارشی، Podcast Namespace یا Media RSS را فراهم می‌کند.

## 12. استراتژی توسعه و گسترش

برای توسعه‌های آینده، اضافه‌کردن پارسر جدید تنها با پیاده‌سازی یک ParserContract و ثبت آن در Registry انجام می‌شود.

## 13. فایل‌های ایجادشده

- packages/rss/src/parser/core/types.ts
- packages/rss/src/parser/core/errors.ts
- packages/rss/src/parser/core/parser-registry.ts
- packages/rss/src/parser/core/parser-factory.ts
- packages/rss/src/parser/core/parser-adapters.ts
- packages/rss/src/parser/core/index.ts
- packages/rss/src/parser/core/parser-orchestrator.test.ts
- packages/rss/PARSER_ORCHESTRATION_REPORT.fa.md

## 14. فایل‌های تغییرکرده

- packages/rss/src/parser/index.ts
- packages/rss/src/index.ts

## 15. Public exports

اکسپورت‌های عمومی جدید شامل موارد زیر هستند:

- ParserFactory
- ParserRegistry
- ParserIssue
- createParserIssue
- همه‌ی ماژول‌های core به‌صورت مستقیم از parser/index قابل دسترسی هستند

## 16. کارهای آینده

کارهای پیشنهادی برای ادامه توسعه:

- اضافه‌کردن parserهای بیشتر مانند Podcast Namespace و Media RSS
- اتصال hookهای diagnostics به logger یا tracing واقعی
- افزودن metrik‌های زمان‌بندی دقیق‌تر و مقیاس‌پذیرتر
- گسترش نوع ParseResult به‌صورت domain-specific برای مصرف‌کنندگان نهایی
