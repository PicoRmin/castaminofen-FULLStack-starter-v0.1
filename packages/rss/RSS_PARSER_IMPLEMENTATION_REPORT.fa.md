# گزارش پیاده‌سازی RSS Parser

## 1. معماری RSS Parser

RSS Parser به‌صورت ماژولار و مستقل در مسیر packages/rss/src/parser/rss پیاده‌سازی شده است. این ماژول تنها با مدل داخلی XmlDocument کار می‌کند و هیچ وابستگی به دیتابیس، repository، import، sync یا لایه‌های business logic ندارد. ساختار اصلی شامل سه لایه‌ی مستقل است:

- لایه‌ی ورودی: XmlDocumentFactory و XmlReader برای تولید درخت XML
- لایه‌ی تحلیل: RssParser برای اجرای pipeline RSS 2.0
- لایه‌ی اعتبارسنجی و نگاشت: RssValidators و DTOها برای تبدیل به داده‌های قوی‌تایپ‌شده

## 2. pipeline تحلیل

پایپ‌لاین فعلی به‌صورت زیر اجرا می‌شود:

1. ساخت XmlDocument از متن XML
2. اعتبارسنجی ساختار ریشه
3. بررسی نسخه RSS و وجود channel
4. تحلیل channel metadata
5. تحلیل آیتم‌های item
6. نگاشت به DTOهای RSS
7. بازگرداندن ParseResult با errors و warnings

## 3. استراتژی تحلیل channel

برای channel از عناصر استاندارد RSS 2.0 پشتیبانی می‌شود و شامل موارد زیر است:

- title, link, description
- language, copyright, managingEditor, webMaster
- pubDate, lastBuildDate
- category‌های چندگانه
- generator, docs
- cloud, ttl, image, rating, textInput
- skipHours, skipDays

عناصر ناشناخته در قالب unknownElements نگهداری می‌شوند تا در آینده برای extensions قابل استفاده باشند.

## 4. استراتژی تحلیل item

برای هر item، اطلاعات زیر استخراج می‌شود:

- guid با توجه به isPermaLink
- title, description, link
- author, category‌های چندگانه
- comments, enclosure, pubDate, source

در صورت نبود عناصر اختیاری، تحلیل شکست نمی‌خورد و فقط داده‌ی مربوطه undefined یا خالی می‌شود.

## 5. استراتژی تحلیل enclosure

برای enclosure، مقدارهای url، type و length استخراج می‌شود. در صورت نامعتبر بودن:

- URL invalid → خطای ساختاری
- type خالی → خطای ساختاری
- length غیرعدد → خطای ساختاری

این بخش با RssValidators انجام می‌شود و خروجی فقط در صورت معتبر بودن به DTO می‌رسد.

## 6. استراتژی اعتبارسنجی

اعتبارسنجی به سه لایه تقسیم شده است:

- Structural validation: بررسی وجود rss، version، channel
- Content validation: بررسی URL و enclosure
- Semantic validation: normalization تاریخ و هشدارهای مربوطه

## 7. استراتژی نگاشت DTO

تمام خروجی‌های پارسر فقط در قالب DTOهای داخلی packages/rss بازگردانده می‌شوند. هیچ XML node یا ساختار خام به بیرون داده نمی‌شود.

## 8. استراتژی حفظ عناصر ناشناخته

عناصر فرزند ناشناخته در داخل channel و item جمع‌آوری شده و در unknownElements نگهداری می‌شوند. این کار باعث می‌شود parser در آینده برای extensions مثل Media RSS یا iTunes بدون تغییر هسته‌ی اصلی قابل توسعه باشد.

## 9. سلسله‌مراتب خطا

خطاهای پارسر با کلاس‌های اختصاصی زیر تعریف شده‌اند:

- InvalidRssDocumentError
- UnsupportedVersionError
- ChannelValidationError
- ItemValidationError
- EnclosureValidationError

هر خطا شامل code، message، stage، location و context است.

## 10. ملاحظات Performance

- از traversal تکراری پرهیز شده است
- به‌جای جست‌وجوی چندباره، از یک ساختار درختی ساده و خوانا استفاده شده است
- برای هزاران item، طراحی به‌گونه‌ای است که در هر مرحله فقط یک عبور منطقی انجام شود

## 11. Future extension points

- افزودن namespace-aware parsing برای Podcast و Media RSS
- افزودن support برای Atom در ماژول جداگانه
- توسعه validation‌های بیشتر بدون تغییر هسته‌ی parser

## 12. فایل‌های ایجادشده

- packages/rss/src/parser/rss/dto.ts
- packages/rss/src/parser/rss/errors.ts
- packages/rss/src/parser/rss/validators.ts
- packages/rss/src/parser/rss/index.ts
- packages/rss/RSS_PARSER_IMPLEMENTATION_REPORT.fa.md

## 13. فایل‌های modified

- packages/rss/src/index.ts
- packages/rss/src/parser/index.ts
- packages/rss/src/parser/xml/document-factory.ts
- packages/rss/src/parser/xml/reader.ts
- packages/rss/src/parser/xml/validator.ts

## 14. Public exports

- RssParser از مسیر packages/rss/src/parser/rss
- DTOهای RSS از packages/rss/src/parser/rss/dto
- خطاهای RSS از packages/rss/src/parser/rss/errors
- RssValidators از packages/rss/src/parser/rss/validators
