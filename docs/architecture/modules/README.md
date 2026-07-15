# راهنمای ماژول‌ها

## هدف

این پوشه مرجع معماری ماژول‌های کسب‌وکار و زیرساختی پروژه است.

## ماژول‌های اصلی

- Authentication
- Users
- Profiles
- Channels
- Creators
- Podcast
- Episodes
- Media
- Search
- Notifications
- Analytics
- Admin
- Moderation
- Payments
- AI
- Messaging
- Realtime

## الگوی هر ماژول

هر ماژول باید از لایه‌های زیر تشکیل شود:

- domain
- application
- infrastructure
- interfaces
- tests

## قواعد

- هیچ ماژولی نباید مستقیم به ماژول دیگر وابسته باشد.
- ارتباط فقط از طریق contracts، services یا events انجام شود.
- هر ماژول باید Public API و Private API مشخص داشته باشد.
