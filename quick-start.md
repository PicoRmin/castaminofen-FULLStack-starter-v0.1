# راهنمای شروع سریع

این راهنما نسخه‌ی به‌روز شده و دقیق‌تر برای راه‌اندازی این پروژه در محیط محلی است.

## پیش‌نیازها

قبل از شروع، مطمئن شوید این ابزارها روی سیستم شما نصب هستند:

- Node.js 20 یا بالاتر
- pnpm 10 یا بالاتر
- Docker Desktop یا Docker Engine
- Git
- یک ترمینال مانند VS Code Terminal

برای بررسی نصب‌ها، این دستورها را اجرا کنید:

```bash
node -v
npm -v
pnpm -v
docker --version
git --version
```

اگر pnpm نصب نیست:

```bash
npm install -g pnpm
```

---

## 1) کلون کردن پروژه

```bash
git clone <repository-url>
cd castaminofen-FULLStack-starter-V0.1.3
```

---

## 2) نصب وابستگی‌ها

در ریشه‌ی پروژه:

```bash
pnpm install
```

اگر نصب وابستگی‌ها با خطا مواجه شد:

```bash
pnpm install --frozen-lockfile
```

---

## 3) ساخت فایل محیطی

در این مخزن فایل .env.example وجود ندارد، بنابراین فایل .env را به‌صورت دستی ایجاد کنید:

```bash
cat > .env <<'EOF'
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/castaminofen
REDIS_URL=redis://localhost:6379
REALTIME_PORT=4100
REALTIME_HOST=0.0.0.0
EOF
```

> اگر بخواهید، می‌توانید مقادیر فوق را در فایل .env خود ویرایش کنید.

---

## 4) راه‌اندازی PostgreSQL و Redis

این پروژه برای اجرا به سرویس‌های زیر نیاز دارد:

```bash
docker compose up -d postgres redis
```

برای بررسی وضعیت سرویس‌ها:

```bash
docker compose ps
```

---

## 5) آماده‌سازی دیتابیس با Prisma

```bash
pnpm exec prisma migrate dev
```

اگر شاخه‌ی فعلی Seed داشته باشد، می‌توانید این دستور را هم اجرا کنید:

```bash
pnpm exec prisma db seed
```

---

## 6) اجرای پروژه

برای اجرای همه‌ی سرویس‌های اصلی به‌صورت هم‌زمان:

```bash
pnpm dev
```

این دستور با Turbo چند اپلیکیشن را در کنار هم اجرا می‌کند.

### پورت‌های پیش‌فرض

- API: http://localhost:3000
- Admin: http://localhost:3001
- Realtime: ws://localhost:4100
- Web: معمولاً روی پورت 3000 یا پورت بعدی در دسترس اجرا می‌شود، اگر پورت 3000 توسط API اشغال شده باشد.

---

## 7) اجرای جداگانه‌ی سرویس‌ها

اگر بخواهید فقط یک بخش را اجرا کنید:

```bash
pnpm --filter @castaminofen/app-api dev
pnpm --filter @castaminofen/app-web dev
pnpm --filter @castaminofen/app-admin dev
pnpm --filter @castaminofen/app-realtime dev
pnpm --filter @castaminofen/app-worker dev
```

---

## 8) تست، lint و build

```bash
pnpm test
pnpm lint
pnpm build
```

---

## 9) رفع مشکلات رایج

### مشکل Docker

```bash
docker compose down
docker compose up -d postgres redis
```

### مشکل وابستگی‌ها

```bash
rm -rf node_modules
pnpm install
```

### مشکل دیتابیس

```bash
docker compose restart postgres
```

### مشکل پورت‌های در حال استفاده

- یکی از سرویس‌ها را متوقف کنید
- یا پورت مورد نظر را تغییر دهید

---

## 10) ساختار مهم پروژه

برای کار راحت‌تر با این مخزن، مسیرهای زیر را بشناسید:

- apps/api: API بک‌اند
- apps/web: اپ Frontend
- apps/admin: پنل مدیریت
- apps/realtime: سرویس real-time
- apps/worker: worker پردازش
- packages: ماژول‌ها و کتابخانه‌های مشترک
- prisma: schema و migration ها
- docker-compose.yml: سرویس‌های محلی
