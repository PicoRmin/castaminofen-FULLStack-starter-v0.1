# app-api

این سرویس به‌صورت NestJS REST API برای پادکست، کاربر، پروفایل، کانال، اپیزود، دسته‌بندی، تگ، پلی‌لیست، بوکمارک، تاریخچه، جستجو، اعلان، آپلود و پنل ادمین پیاده‌سازی شده است.

## ویژگی‌های اصلی
- NestJS
- Prisma + PostgreSQL
- JWT Authentication
- Refresh Tokens
- RBAC
- Validation
- Swagger / OpenAPI
- Logging
- Exception Filters
- Interceptors
- Guards
- Rate Limiting
- Health Checks

## مسیرهای اصلی
- Auth: /api/auth/register, /api/auth/login, /api/auth/refresh
- Users: /api/users
- Profiles: /api/profiles/:userId
- Channels: /api/channels
- Podcasts: /api/podcasts
- Episodes: /api/episodes
- Categories: /api/categories
- Tags: /api/tags
- Playlists: /api/playlists
- Bookmarks: /api/bookmarks
- History: /api/history
- Search: /api/search
- Notifications: /api/notifications
- Uploads: /api/uploads
- Admin: /api/admin/dashboard
- Health: /api/health
- Swagger: /docs

## راه‌اندازی
1. Prisma schema را با PostgreSQL هماهنگ کنید.
2. متغیرهای محیطی را تنظیم کنید: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET.
3. دستورهای زیر را اجرا کنید:
   - pnpm install
   - pnpm --filter @castaminofen/app-api build
   - pnpm --filter @castaminofen/app-api test
   - pnpm --filter @castaminofen/app-api dev
