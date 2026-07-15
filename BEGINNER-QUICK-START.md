# راهنمای خیلی ساده برای شروع

اگر برای اولین بار با این پروژه کار می‌کنید، این راهنما را دقیق دنبال کنید.

## 1) پیش‌نیازها

روی سیستم شما باید این موارد نصب باشد:

- Node.js 20+
- pnpm
- Docker
- Git

بررسی نصب‌ها:

```bash
node -v
pnpm -v
docker --version
git --version
```

اگر pnpm نصب نیست:

```bash
npm install -g pnpm
```

---

## 2) پروژه را دانلود و وارد پوشه شوید

```bash
git clone <repository-url>
cd castaminofen-FULLStack-starter-V0.1.3
```

---

## 3) وابستگی‌ها را نصب کنید

```bash
pnpm install
```

---

## 4) فایل محیطی را بسازید

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

## 5) دیتابیس و Redis را راه‌اندازی کنید

```bash
docker compose up -d postgres redis
```

برای چک وضعیت:

```bash
docker compose ps
```

---

## 6) دیتابیس را آماده کنید

```bash
pnpm exec prisma migrate dev
```

---

## 7) پروژه را اجرا کنید

```bash
pnpm dev
```

بعد از اجرا، این آدرس‌ها را در مرورگر باز کنید:

- http://localhost:3000
- http://localhost:3001

---

## 8) اگر مشکلی پیش آمد

### اگر Docker کار نمی‌کند

```bash
docker compose down
docker compose up -d postgres redis
```

### اگر وابستگی‌ها مشکل داشت

```bash
rm -rf node_modules
pnpm install
```

### اگر دیتابیس وصل نشد

```bash
docker compose restart postgres
```

---

## 9) خلاصه‌ی خیلی کوتاه

اگر بخواهید فقط سریع شروع کنید، این دستورات را اجرا کنید:

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
