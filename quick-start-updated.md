# راهنمای شروع سریع و حرفه‌ای

این نسخه‌ی به‌روز شده، دقیق‌تر و مناسب‌تر برای شروع کار با این monorepo است.

---

## 1) پیش‌نیازهای ضروری

قبل از شروع، مطمئن شوید این ابزارها روی سیستم شما نصب هستند:

- Node.js 20 یا بالاتر
- pnpm 10 یا بالاتر
- Docker Desktop یا Docker Engine
- Git
- VS Code یا هر ترمینال دیگری

### بررسی نصب‌ها

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

## 2) کلون و ورود به پروژه

```bash
git clone <repository-url>
cd castaminofen-FULLStack-starter-V0.1.3
```

---

## 3) نصب وابستگی‌ها

```bash
pnpm install
```

اگر نصب با خطای وابستگی مواجه شد:

```bash
pnpm install --frozen-lockfile
```

---

## 4) ایجاد فایل محیطی

از آن‌جا که فایل .env.example در این مخزن وجود ندارد، فایل .env را به‌صورت دستی ایجاد کنید:

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

---

## 5) راه‌اندازی سرویس‌های پایه با Docker

```bash
docker compose up -d postgres redis
```

بررسی وضعیت:

```bash
docker compose ps
```

---

## 6) آماده‌سازی دیتابیس با Prisma

```bash
pnpm exec prisma migrate dev
```

اگر Seed در شاخه‌ی شما وجود دارد:

```bash
pnpm exec prisma db seed
```

---

## 7) اجرای پروژه

### نسخه‌ی کامل

```bash
pnpm dev
```

### اجرای جداگانه‌ی سرویس‌ها

```bash
pnpm --filter @castaminofen/app-api dev
pnpm --filter @castaminofen/app-web dev
pnpm --filter @castaminofen/app-admin dev
pnpm --filter @castaminofen/app-realtime dev
pnpm --filter @castaminofen/app-worker dev
```

### آدرس‌های مهم

- API: http://localhost:3000
- Admin: http://localhost:3001
- Realtime: ws://localhost:4100
- Web: اگر پورت 3000 توسط API اشغال شده باشد، Next معمولاً پورت بعدی را انتخاب می‌کند.

---

## 8) تست و بررسی کیفیت کد

```bash
pnpm test
pnpm lint
pnpm build
```

---

## 9) رفع مشکلات رایج

### Docker

```bash
docker compose down
docker compose up -d postgres redis
```

### وابستگی‌ها

```bash
rm -rf node_modules
pnpm install
```

### دیتابیس

```bash
docker compose restart postgres
```

### پورت در حال استفاده

- سرویس قبلی را متوقف کنید
- یا پورت را تغییر دهید

---

## 10) ساختار مهم پروژه

- apps/api: API بک‌اند
- apps/web: Frontend وب
- apps/admin: پنل مدیریت
- apps/realtime: سرویس real-time
- apps/worker: worker پردازش
- packages: ماژول‌های مشترک
- prisma: schema و migrations
- docker-compose.yml: سرویس‌های محلی

---

## 11) نسخه‌ی خلاصه برای شروع سریع

```bash
pnpm install
cat > .env <<'EOF'
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/castaminofen
REDIS_URL=redis://localhost:6379
REALTIME_PORT=4100
REALTIME_HOST=0.0.0.0
EOF
docker compose up -d postgres redis
pnpm exec prisma migrate dev
pnpm dev
```
