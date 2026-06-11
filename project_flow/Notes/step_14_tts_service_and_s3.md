# Step 14 — TTS Service and S3 Storage

**Phase:** 2 — Audio Engine
**Status:** Complete
**Date:** 2026-06-09

---

## What Was Done

| File | Status |
|------|--------|
| `api/src/services/tts.service.ts` | ✅ ElevenLabs `textToSpeech.convert()` → stream → Buffer |
| `api/src/services/storage.service.ts` | ✅ AWS S3 PutObject / DeleteObject |
| `api/src/jobs/tts.job.ts` | ✅ Stub replaced — `generating → ready` with real MP3 and S3 URL |
| `api/tsconfig.json` | ✅ Added `"types": ["node"]` (ts-node couldn't find console/process) |
| `api/.env` | ✅ REDIS_URL changed from `localhost` to `127.0.0.1` |

## ElevenLabs SDK — v1.59 API

```typescript
// client.textToSpeech.convert() returns Promise<stream.Readable>
const stream = await client.textToSpeech.convert(voiceId, {
  text,
  model_id: 'eleven_multilingual_v2',
  voice_settings: { stability: 0.5, similarity_boost: 0.75 },
});
const buffer = await streamToBuffer(stream as Readable);
```

`convert()` not `generate()` — the SDK changed the method name in v1.x.

## Fix: Redis localhost → 127.0.0.1

On this Windows machine, `localhost` resolves to IPv6 `::1`, which hits the
WSL relay process (not Docker's Redis). Redis only responds correctly on IPv4
`127.0.0.1`. Changed REDIS_URL and `.env.example` accordingly.

**Diagnosis:** `netstat -ano | grep :6379` showed two PIDs:
- `com.docker.backend` (PID 16860) on `0.0.0.0:6379` — the real Redis
- `wslrelay` (PID 39636) on `[::1]:6379` — WSL networking, resets immediately

## Worker Flow

```
Frame created → enqueueTTSJob() → BullMQ → worker picks up
  → prisma.update(audioStatus: 'generating')
  → generateAudio(text, voiceId) → ElevenLabs → Buffer (≈70KB for short text)
  → uploadAudio(frameId, buffer) → S3 key: audio/frames/{frameId}.mp3
  → prisma.update(audioStatus: 'ready', audioUrl: S3_URL)
```

On error: sets `audioStatus: 'failed'`, re-throws so BullMQ retries (max 3×, exponential backoff).

## Verified

- ElevenLabs API key valid — 78KB MP3 buffer generated
- S3 upload succeeds — file visible in AWS console
- `GET /admin/frames/:id/tts-status` returns `{ audioStatus: 'ready', audioUrl: 'https://...' }`
- URL format: `https://learndb-s3-bucket.s3.ap-south-1.amazonaws.com/audio/frames/{frameId}.mp3`
