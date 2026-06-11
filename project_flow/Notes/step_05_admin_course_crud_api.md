# Step 05 — Admin Course CRUD API

**Phase:** 1 — Foundation  
**Status:** Complete  
**Date:** 2026-06-07

---

## What Was Done

| Task | Status |
|------|--------|
| `api/src/routes/admin/courses.ts` — full CRUD for Class/Subject/Chapter/Frame | ✅ |
| Zod validation on all POST/PUT handlers | ✅ |
| GET `/admin/subjects/:id` added (gap noted in step file) | ✅ |
| TTS job enqueue wired (stub worker picks it up from Step 08) | ✅ |
| `api/src/app.ts` updated to mount admin routes | ✅ |
| `tsc --noEmit` passes with zero errors | ✅ |

---

## Endpoints Added

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/admin/classes` | List all classes |
| POST | `/api/v1/admin/classes` | Create class |
| GET | `/api/v1/admin/classes/:id/subjects` | List subjects in class |
| GET | `/api/v1/admin/subjects/:id` | Get single subject (added gap) |
| POST | `/api/v1/admin/subjects` | Create subject |
| PUT | `/api/v1/admin/subjects/:id` | Update subject |
| GET | `/api/v1/admin/subjects/:id/chapters` | List chapters |
| POST | `/api/v1/admin/chapters` | Create chapter |
| PUT | `/api/v1/admin/chapters/:id` | Update chapter |
| DELETE | `/api/v1/admin/chapters/:id` | Soft delete chapter |
| GET | `/api/v1/admin/chapters/:id/frames` | List frames |
| POST | `/api/v1/admin/frames` | Create frame + enqueue TTS job |
| PUT | `/api/v1/admin/frames/:id` | Update frame + re-enqueue TTS |
| DELETE | `/api/v1/admin/frames/:id` | Hard delete frame |
| GET | `/api/v1/admin/frames/:id/tts-status` | Check TTS status |

---

## Fixes vs Reference Files

### 1. `req.params.id` type cast
Express 5 types params as `string | string[]`. All `req.params.id` usages cast with `as string`.

### 2. TTS calls: initially commented, then re-enabled in Step 08
Step 05 had TTS commented out; Step 08 re-enabled them once the queue was wired.

### 3. `enqueueTTSJob` import
The reference file used `enqueueTTSJob` from `../../jobs/tts.job` which gets created in Step 08. Import is enabled once the job file exists.
