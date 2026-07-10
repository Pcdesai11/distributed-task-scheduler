# Chronos — Distributed Task Scheduler

A deployable distributed job scheduler with a React dashboard, Express API, BullMQ workers, Postgres persistence, and Redis queuing.

## Architecture

```
Dashboard (React) → API (Express) → Postgres
                         ↓
                      Redis (BullMQ)
                         ↓
                    Worker process(es)
```

## Quick start (local dev)

### 1. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 2. Configure environment

```bash
cp .env.example .env
```

### 3. Install and migrate

```bash
npm install
npm install --prefix backend
npm run db:migrate
```

### 4. Seed demo data (optional)

```bash
npm run db:seed --prefix backend
```

### 5. Run everything

```bash
npm run dev:all
```

Open **http://localhost:5173**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/api/health |

## Docker (full stack)

```bash
docker compose up --build
```

Open **http://localhost:8080**

## Deploy to production

### Recommended stack

| Component | Service |
|-----------|---------|
| Frontend | Vercel / Cloudflare Pages |
| API | Railway / Fly.io |
| Worker | Railway / Fly.io (separate process) |
| Postgres | Neon / Supabase |
| Redis | Upstash |

### Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string |
| `API_KEY` | Bearer token for API auth |
| `PORT` | API port (default 3001) |
| `WORKER_ID` | Unique worker identifier |
| `WORKER_NAME` | Display name for worker |
| `WORKER_REGION` | Region label |
| `WORKER_CAPACITY` | Max concurrent jobs |
| `VITE_API_URL` | Frontend API base (production) |
| `SEED_DEMO_DATA` | `true` to seed on startup (dev only) |

### Railway deployment

1. Create a project with **Postgres** and **Redis** add-ons
2. Deploy `backend/Dockerfile` as the **API** service
3. Deploy `backend/Dockerfile.worker` as the **Worker** service
4. Set env vars on both services
5. Deploy frontend to Vercel with `VITE_API_URL=https://your-api.railway.app`

### Job handlers

Jobs are dispatched to handler functions in `backend/src/handlers/`:

| Handler | What it does |
|---------|--------------|
| `webhook-retry` | POST to a URL |
| `email-digest` | Simulated email send (swap for Resend/SendGrid) |
| `report-export` | Simulated report generation |
| `invoice-sync` | Simulated invoice sync |
| `data-backfill` | Simulated data backfill |
| `generic` | Default fallback handler |

Add your own handlers in `backend/src/handlers/index.ts`.

## API

```
GET    /api/health
GET    /api/jobs?page=1&limit=50&status=queued
POST   /api/jobs
POST   /api/jobs/:id/retry
DELETE /api/jobs/:id
GET    /api/metrics
GET    /api/workers
POST   /api/workers/:id/failover
GET    /api/monitoring/alerts
```

## Scripts

```bash
npm run dev:all          # API + worker + frontend
npm run dev:backend      # API only
npm run dev:worker       # Worker only
npm run docker:up        # Postgres + Redis
npm run db:migrate       # Run migrations
```
