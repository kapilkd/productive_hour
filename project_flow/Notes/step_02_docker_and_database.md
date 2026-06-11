# Step 02 — Docker and Database Setup

**Phase:** 1 — Foundation  
**Status:** Complete  
**Date:** 2026-06-07

---

## What Was Done

| Task | Status |
|------|--------|
| `docker-compose.yml` copied to repo root | ✅ |
| `.env.example` copied to repo root | ✅ |
| `api/.env` created with all variables | ✅ |
| JWT secrets generated (64-char random hex each) | ✅ |
| `api/.env` added to `.gitignore` | ✅ |
| `.gitignore` created at repo root | ✅ |
| PostgreSQL connection verified (`learndb` / `postgres`) | ✅ |
| Redis running (`productive_hour-redis-1`, port 6379) | ✅ |

---

## Files Created / Modified

```
productive_hour/
├── docker-compose.yml        ← copied from project_structure/
├── .env.example              ← copied from project_structure/ (safe to commit)
├── .gitignore                ← created; api/.env is excluded
└── api/
    └── .env                  ← real secrets, never committed
```

---

## Verified Connections

### PostgreSQL
- Host: `localhost:5432`
- User: `postgres`, Password: `1234`
- Database: `learndb`
- PostgreSQL version: 18 (installed at `C:\Program Files\PostgreSQL\18\`)
- `DATABASE_URL` in `api/.env`: `postgresql://postgres:1234@localhost:5432/learndb`

> Note: The user initially typed `postgres:postgres:1234` (malformed). Fixed to `postgres:1234`.

### Redis
- Container: `productive_hour-redis-1` (image: `redis:7-alpine`)
- Port: `6379` mapped to host `localhost:6379`
- Started via: `docker compose up -d redis` from repo root
- `redis-cli ping` → `PONG` ✅
- The pre-existing `zen_yalow` container (redislabs/redis:latest) had no port mapping — not used.

---

## docker-compose.yml — Key Details

```yaml
postgres:
  image: postgres:15-alpine
  POSTGRES_DB: learndb
  POSTGRES_USER: user
  POSTGRES_PASSWORD: password
  port: 5432

redis:
  image: redis:7-alpine
  port: 6379
```

> Note: docker-compose PostgreSQL uses `user/password` credentials but since you have PostgreSQL installed locally (v18), the Docker postgres container is not needed. Only start the `redis` service from docker-compose.

---

## .gitignore — What's Excluded

```
node_modules/
dist/
build/
api/.env          ← secrets
apps/web/.env     ← secrets
.env
.env.local
*.tsbuildinfo
*.log
.DS_Store
```

---

## JWT Secrets

Two 64-character random hex secrets were generated and written to `api/.env`:
- `JWT_ACCESS_SECRET` — 15-minute access tokens
- `JWT_REFRESH_SECRET` — 7-day refresh tokens

Do not change these once the first user logs in (all existing tokens will be invalidated).

---

## Next Step

**Step 03 — Prisma Schema and Migration**

Before running Step 03:
1. Update `api/.env` with the correct PostgreSQL credentials
2. Confirm you can connect to `learndb` with those credentials

Step 03 will run `prisma migrate dev` to create all tables from the schema.
