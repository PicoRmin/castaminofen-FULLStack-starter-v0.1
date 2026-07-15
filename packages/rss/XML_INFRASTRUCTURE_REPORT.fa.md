# گزارش پیاده‌سازی لایه XML Infrastructure

## 1) نمای کلی معماری XML

لایه XML پیاده‌سازی‌شده به‌صورت مستقل و قابل استفاده مجدد طراحی شده است. این لایه فقط با XML سر و کار دارد و هیچ‌گونه منطق RSS، Atom، پایگاه داده، API یا سرویس تجاری را در برنمی‌گیرد. جریان کلی آن شامل بارگذاری ورودی، تشخیص کدگذاری، اعتبارسنجی ساختار، ساخت مدل داخلی و بازگرداندن سند XML است.

## 2) ماژول‌های ایجادشده

- XmlLoader: بارگذاری ورودی از string، Buffer، Uint8Array و Readable
- XmlEncodingDetector: تشخیص خودکار کدگذاری با توجه به BOM، اعلان XML و fallback
- XmlValidator: اعتبارسنجی ساختاری XML شامل declaration، ریشه، برچسب‌ها و کاراکترهای نامعتبر
- XmlDocument / XmlNode / XmlElement / XmlAttribute / XmlText / XmlComment / XmlCData / XmlDeclaration / XmlNamespace: مدل داخلی قوی‌تایپ‌شده
- XmlDocumentFactory: هماهنگ‌کننده اصلی تولید سند XML
- XmlReader: تبدیل داده‌های XML به مدل داخلی
- XmlErrorFactory: تولید خطاهای ساختاریافته
- XmlUtilities: ابزارهای کمکی برای whitespace، snippet و بررسی نام‌ها

## 3) انواع ورودی پشتیبانی‌شده

- string
- Buffer
- Uint8Array
- Readable Stream (به‌صورت طراحی‌آماده برای آینده)

## 4) استراتژی تشخیص کدگذاری

- تشخیص بر اساس BOM برای UTF-8، UTF-16 LE و UTF-16 BE
- تشخیص بر اساس اعلان XML declaration
- fallback برای موارد نامشخص با محدودیت‌های امن و روشن
- در صورت کدگذاری پشتیبانی‌نشده، خطای ساختاریافته بازگردانده می‌شود

## 5) استراتژی اعتبارسنجی

- بررسی خالی بودن سند
- بررسی وجود declaration XML
- اعتبارسنجی version در declaration
- بررسی وجود ریشه‌ی واحد
- بررسی تگ‌های بسته‌شده و ترتیب آنها
- تشخیص کاراکترهای غیرمجاز
- جلوگیری از ورود به منطق RSS یا دامنه‌های خاص

## 6) ملاحظات امنیتی

- از parserهای پرخطر و تنظیمات DTD/XXE جلوگیری شده است
- XML به‌صورت امن خوانده می‌شود
- هیچ fetch یا دسترسی به منابع خارجی انجام نمی‌شود
- لایه فقط روی ساختار XML تمرکز دارد

## 7) مدل داخلی XML

مدل داخلی بر پایه کلاس‌های تایپ‌شده طراحی شده است و هر نود، صفت، namespace و declaration جداگانه و با نوع مشخص ارائه می‌شود. این مدل از افشای اشیاء third-party به لایه‌های بالاتر جلوگیری می‌کند.

## 8) استراتژی حفظ namespace

namespace‌ها در مدل داخلی نگهداری می‌شوند و در ساختار عنصر و صفت‌ها حفظ می‌شوند. این لایه در حال حاضر فقط اطلاعات namespace را نگه می‌دارد و حل یا تفسیر آنها را انجام نمی‌دهد.

## 9) سلسله‌مراتب خطا

- XmlError
  - XmlSyntaxError
  - XmlEncodingError
  - XmlValidationError
  - UnsupportedEncodingError
  - MalformedDocumentError

هر خطا شامل code، message، line، column، position و context snippet است.

## 10) انتخاب کتابخانه ثالث و توجیه

برای parsing XML از کتابخانه sax استفاده شد. این انتخاب به دلیل:

- سبک بودن
- پشتیبانی خوب از XML و ساختارهای ساده
- امکان استفاده در محیط TypeScript
- امکان کنترل و محدودسازی رفتار برای امنیت بهتر

## 11) ملاحظات Performance

- جلوگیری از کپی‌های بی‌دلیل
- استفاده از جریان ساختارمند و مدل داخلی سبک
- طراحی ماژولار برای توسعه آینده و streaming-ready
- حداقل سربار برای ساخت مدل داخلی

## 12) Future extension points

این لایه به‌صورت Open/Closed طراحی شده است و برای افزودن parserهای آینده مانند RSS، Atom، Podcast، Media RSS یا OPML بدون تغییر لایه XML قابل توسعه است.

## 13) فایل‌های ایجادشده

- packages/rss/src/parser/xml/errors.ts
- packages/rss/src/parser/xml/types.ts
- packages/rss/src/parser/xml/document.ts
- packages/rss/src/parser/xml/error-factory.ts
- packages/rss/src/parser/xml/utilities.ts
- packages/rss/src/parser/xml/loader.ts
- packages/rss/src/parser/xml/encoding-detector.ts
- packages/rss/src/parser/xml/validator.ts
- packages/rss/src/parser/xml/reader.ts
- packages/rss/src/parser/xml/document-factory.ts
- packages/rss/src/parser/xml/index.ts
- packages/rss/XML_INFRASTRUCTURE_REPORT.fa.md

## 14) فایل‌های修改شده

- packages/rss/src/parser/index.ts
- packages/rss/package.json

## 15) Public exports

- export * from './xml' در parser/index.ts
- ماژول‌های XML از مسیر packages/rss/src/parser/xml قابل دسترسی‌اند
