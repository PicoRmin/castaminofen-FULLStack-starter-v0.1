# Team Quick Start

This guide reflects the current monorepo layout and the commands that are valid for local development.

## Prerequisites

Make sure the following tools are installed:

- Node.js 20+
- pnpm 10+
- Docker Desktop or Docker Engine
- Git
- VS Code or another terminal

Verify installation:

```bash
node -v
npm -v
pnpm -v
docker --version
git --version
```

If pnpm is missing:

```bash
npm install -g pnpm
```

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd castaminofen-FULLStack-starter-V0.1.3
```

---

## 2. Install Dependencies

```bash
pnpm install
```

If installation fails, retry with:

```bash
pnpm install --frozen-lockfile
```

---

## 3. Configure Environment Variables

There is no .env.example file in this repository, so create .env manually:

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

## 4. Start Infrastructure Services

Run the required local services:

```bash
docker compose up -d postgres redis
```

Check status:

```bash
docker compose ps
```

---

## 5. Prepare the Database

Run Prisma migrations:

```bash
pnpm exec prisma migrate dev
```

If seed data is available:

```bash
pnpm exec prisma db seed
```

---

## 6. Start the Application

Start the full development stack:

```bash
pnpm dev
```

Expected local URLs:

- http://localhost:3000
- http://localhost:3001
- ws://localhost:4100

If a port is already in use, confirm the actual address from the terminal output.

---

## 7. Useful Commands

### Run API only

```bash
pnpm --filter @castaminofen/app-api dev
```

### Run Web only

```bash
pnpm --filter @castaminofen/app-web dev
```

### Run Admin only

```bash
pnpm --filter @castaminofen/app-admin dev
```

### Run Realtime only

```bash
pnpm --filter @castaminofen/app-realtime dev
```

### Run Worker only

```bash
pnpm --filter @castaminofen/app-worker dev
```

### Run tests

```bash
pnpm test
```

### Run lint

```bash
pnpm lint
```

### Build for production

```bash
pnpm build
```

---

## 8. Troubleshooting

### Docker issues

```bash
docker compose down
docker compose up -d postgres redis
```

### Dependency issues

```bash
rm -rf node_modules
pnpm install
```

### Database issues

```bash
docker compose restart postgres
```

---

## 9. Project Structure

- apps/api: backend API
- apps/web: frontend web app
- apps/admin: admin panel
- apps/realtime: realtime service
- apps/worker: background worker
- packages: shared packages
- prisma: database schema and migrations
- docker-compose.yml: local infrastructure setup
