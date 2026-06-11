# Step 08 — Queue Infrastructure (BullMQ + Redis)

**Phase:** 1 — Foundation  
**Status:** Complete  
**Date:** 2026-06-07

---

## What Was Done

| Task | Status |
|------|--------|
| `api/src/jobs/tts.job.ts` — BullMQ queue + stubbed worker | ✅ |
| `enqueueTTSJob` re-enabled in `courses.ts` POST/PUT frames | ✅ |
| `"worker"` script added to `api/package.json` | ✅ |
| Stub worker marks frames as `ready` with placeholder URL | ✅ |

---

## Architecture

```
Frame saved → enqueueTTSJob() → ttsQueue (Redis) → ttsWorker (stub)
                                                          ↓
                                              frame.audioStatus = 'ready'
                                              frame.audioUrl = placeholder URL
```

---

## Fixes vs Reference Files

### 1. BullMQ + external IORedis type conflict
Reference file used `new IORedis(url, { maxRetriesPerRequest: null })` and passed the IORedis instance to BullMQ's `connection` parameter.

**Problem:** BullMQ v5 bundles its own copy of ioredis (`bullmq/node_modules/ioredis`). TypeScript sees the two ioredis `Redis` classes as incompatible because they come from separate `node_modules/` paths — TypeScript's structural typing fails on the `protected connecting` property in `AbstractConnector`.

**Fix:** Parse the Redis URL manually and pass a plain options object:
```typescript
function parseRedisUrl(url: string) {
  const u = new URL(url);
  return { host: u.hostname, port: parseInt(u.port || '6379', 10), password: u.password || undefined, maxRetriesPerRequest: null as null };
}
const connection = parseRedisUrl(process.env.REDIS_URL!);
```
BullMQ uses this plain object to construct its own internal ioredis instance, avoiding the type conflict.

### 2. `ttsQueue.add()` name type
BullMQ v5 `add(name, data)` where `name` extends `string`. When the Queue is typed as `Queue<TTSJobData>` (no explicit name type), passing `'generate'` caused a type error. Fixed with `'generate' as any`.

### 3. Worker script in package.json
Added `"worker": "ts-node src/jobs/tts.job.ts"` — in production this runs as a separate process.

---

## Running the Worker

```powershell
# In one terminal: API
cd api && npm run dev

# In another terminal: TTS worker
cd api && npm run worker
```
