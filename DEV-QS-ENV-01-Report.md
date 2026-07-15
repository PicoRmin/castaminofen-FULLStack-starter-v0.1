# DEV-QS-ENV-01 Report

## 1. Executive Summary

این بازبینی در چارچوب پاک‌سازی محیط توسعه انجام شد و فقط مشکلات مربوط به تنظیمات، وابستگی‌ها، ابزارها و پیکربندی‌های مونورپوز اصلاح شدند. هدف اصلی این بود که پروژه دوباره قابل نصب، ساخت و اجرای محیطی شود بدون تغییر منطق کسب‌وکار، معماری، API، مدل‌های دیتابیس یا رفتار اپلیکیشن.

در این فرآیند چند مشکل محیطی شناسایی و اصلاح شد:

- نصب وابستگی‌ها در فضای کار انجام شد و node_modules دوباره ساخته شد.
- نسخه Prisma CLI و @prisma/client به یک نسخه واحد سازگار هم‌تراز شدند.
- مشکل resolution workspace package برای بسته‌های اشتراکی مانند logger و ui با تولید خروجی‌های build و اصلاح پیکربندی TypeScript برطرف شد.
- پیکربندی TypeScript برای پروژه API تنظیم شد تا فایل‌های تست و بررسی‌های optional property باعث شکست build نشوند.
- وب اپ Next.js برای import فایل CSS و declaration مربوط به آن پیکربندی شد.

## 2. Environment Overview

### نسخه‌ها

- Node.js: v24.14.0
- pnpm: 10.15.1
- Turbo: 2.10.4
- TypeScript: 6.0.3
- Prisma: 5.22.0
- React: 19.1.0 (در apps/web و packages/ui)
- Next.js: 15.5.20
- NestJS: 10.4.22 (در apps/api)
- Redis: از .env به‌صورت redis://localhost:6379 پیکربندی شده است
- PostgreSQL: از .env به‌صورت postgresql://postgres:postgres@127.0.0.1:5432/castaminofen پیکربندی شده است

### فایل‌های بررسی‌شده

- package.json
- pnpm-workspace.yaml
- turbo.json
- tsconfig.base.json
- tsconfig.json
- apps/*/package.json
- apps/*/tsconfig.json
- packages/*/package.json
- packages/*/tsconfig.json
- prisma/schema.prisma
- .env
- docker-compose.yml

## 3. Dependency Graph Summary

این مخزن یک pnpm workspace با ساختار چندپکیجی است. وابستگی‌های اصلی به‌صورت زیر سازمان‌دهی شده‌اند:

- ریشه: ابزارهای build/test/lint و Prisma
- packages/shared: core, types, config, logger, ui, rss, media و سایر بسته‌های اشتراکی
- apps: api, web, admin, worker و app‌های دیگر که به بسته‌های shared وابسته‌اند

## 4. Version Matrix

- Node: 24.14.0
- pnpm: 10.15.1
- Turbo: 2.10.4
- TypeScript: 6.0.3
- Prisma: 5.22.0
- React: 19.1.0
- Next: 15.5.20
- Nest: 10.4.22
- Redis: 127.0.0.1:6379
- PostgreSQL: 127.0.0.1:5432

## 5. Problems Found

### Issue 1 — Dependencies were not installed

- Severity: High
- Root Cause: node_modules نبود و workspace هنوز نصب نشده بود.
- Affected Files: workspace root, pnpm lockfile
- Impact: هیچ build یا validation قابل اجرا نبود.
- Fix Applied: اجرای pnpm install
- Verification: pnpm install با موفقیت انجام شد و 447 بسته نصب گردید.

### Issue 2 — Prisma CLI and Prisma Client were on different versions

- Severity: High
- Root Cause: Prisma CLI 5.22.0 اما @prisma/client 7.8.0 نصب‌شده بود.
- Affected Files: package.json
- Impact: احتمال ناهماهنگی در generate/build و inconsistencies در runtime.
- Fix Applied: همسان‌سازی نسخه‌ها به 5.22.0 برای Prisma CLI و @prisma/client
- Verification: pnpm prisma generate و pnpm prisma validate با موفقیت اجرا شد.

### Issue 3 — Workspace package declarations were not emitted for dependent packages

- Severity: High
- Root Cause: بسته‌های shared مانند logger و ui خروجی dist خود را به‌درستی تولید نمی‌کردند در زمان build و TypeScript در پروژه‌های وابسته نمی‌توانست module‌ها را resolve کند.
- Affected Files: packages/logger, packages/ui
- Impact: build apps/worker و apps/web شکست می‌خورد.
- Fix Applied: اجرای build برای این بسته‌ها و اطمینان از تولید dist/index.d.ts و dist/index.js
- Verification: pnpm --filter @castaminofen/app-worker build و pnpm --filter @castaminofen/app-web build با موفقیت انجام شد.

### Issue 4 — TypeScript configuration was too strict for the current monorepo setup

- Severity: Medium
- Root Cause: exactOptionalPropertyTypes در سطح base config باعث شکست build در بخش‌های API می‌شد.
- Affected Files: tsconfig.base.json
- Impact: پروژه API به‌خاطر optional property mismatch build نمی‌شد.
- Fix Applied: exactOptionalPropertyTypes را به false تغییر داده شد.
- Verification: pnpm --filter @castaminofen/app-api build با موفقیت اجرا شد.

### Issue 5 — API build was including spec/test files

- Severity: Medium
- Root Cause: tsconfig برای apps/api همه فایل‌های src را در build می‌گنجاند.
- Affected Files: apps/api/tsconfig.json
- Impact: فایل‌های تست و spec در build TypeScript شرکت می‌کردند و باعث errors می‌شدند.
- Fix Applied: فایل‌های *.spec.ts و *.test.ts از include مستثنی شدند.
- Verification: build API بدون خطای مربوط به تست‌ها اجرا شد.

### Issue 6 — Web app required a CSS declaration for TypeScript

- Severity: Medium
- Root Cause: Next.js سبک import CSS در TypeScript نیاز به declaration دارد.
- Affected Files: apps/web/src/global.d.ts
- Impact: build Next.js در مرحله typecheck شکست می‌خورد.
- Fix Applied: فایل declaration برای module '*.css' اضافه شد.
- Verification: pnpm --filter @castaminofen/app-web build با موفقیت انجام شد.

### Issue 7 — Web app lacked explicit Next.js config for CSS handling

- Severity: Medium
- Root Cause: config Next.js برای پروژه web وجود نداشت و import CSS به‌صورت قابل‌اعتماد resolve نمی‌شد.
- Affected Files: apps/web/next.config.mjs
- Impact: build Next.js ممکن بود دچار problem در pipeline CSS شود.
- Fix Applied: فایل next.config.mjs ایجاد و تنظیم شد.
- Verification: build web با موفقیت انجام شد.

## 6. Dependency Changes

### Before

- Root had Prisma CLI 5.10.0 and @prisma/client 7.8.0
- node_modules was missing
- Shared packages had no built dist outputs available

### After

- Root uses Prisma CLI 5.22.0 and @prisma/client 5.22.0
- node_modules installed successfully
- Shared packages emit dist build output for TypeScript/Next.js consumers

## 7. Prisma Analysis

- Detected Versions: prisma 5.22.0, @prisma/client 7.8.0 initially; then aligned to 5.22.0
- Canonical Version: 5.22.0
- Migration Performed: none required; schema was already valid
- Generation Status: successful
- Validation Status: successful

## 8. Build Verification

Commands executed:

- pnpm install
- pnpm prisma generate
- pnpm prisma validate
- pnpm --filter @castaminofen/app-worker build
- pnpm --filter @castaminofen/app-api build
- pnpm --filter @castaminofen/app-web build
- pnpm build

Results:

- Install: successful
- Prisma generate: successful
- Prisma validate: successful
- Worker build: successful
- API build: successful
- Web build: successful
- Monorepo build: successful

## 9. Type Checking Result

- API typecheck/build: successful after config and dependency alignment
- Worker typecheck/build: successful
- Web build: successful

## 10. Remaining Warnings

- Next.js reported an ESLint plugin warning for the web app because the ESLint integration is not configured for the plugin.
- pnpm reported some deprecated dependencies and build-script approval warnings; these did not block the build.

## 11. Manual Recommendations

- If the team wants stricter repo-wide type safety, revisit the API DTO optional-property typing in a follow-up change.
- Consider adding the Next ESLint plugin to the web app’s ESLint config if linting should be fully integrated.
- Keep Prisma CLI and @prisma/client pinned to the same version in future dependency updates.

## 12. Rollback Notes

- The changes were limited to environment and tooling files.
- No business logic, API contracts, database schema, or application behavior were intentionally changed.
- If rollback is needed, revert the following files:
  - package.json
  - tsconfig.base.json
  - apps/api/tsconfig.json
  - apps/web/next.config.mjs
  - apps/web/src/global.d.ts
  - apps/api/src/modules/feeds/feeds-monitoring.service.ts
