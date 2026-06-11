# Step 07 — Student API

**Phase:** 1 — Foundation  
**Status:** Complete  
**Date:** 2026-06-07

---

## What Was Done

| Task | Status |
|------|--------|
| `api/src/routes/student/subjects.ts` — subject list + IQ endpoint | ✅ |
| `api/src/routes/student/chapters.ts` — chapter list + chapter detail | ✅ |
| `api/src/routes/student/progress.ts` — frame progress + respond endpoint | ✅ |
| `api/src/services/iq.service.ts` — pure IQ calculation functions | ✅ |
| All three routers mounted in `api/src/app.ts` | ✅ |

---

## Endpoints Added

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/student/subjects` | My assigned subjects (access-filtered) |
| GET | `/api/v1/student/iq/:subjectId` | My IQ score for a subject |
| GET | `/api/v1/student/subjects/:id/chapters` | Chapters with progress merged in |
| GET | `/api/v1/student/chapters/:id` | Chapter + frames + my progress |
| POST | `/api/v1/student/progress/frame` | Mark frame as listened |
| GET | `/api/v1/student/progress/chapter/:id` | My chapter progress |
| POST | `/api/v1/student/progress/questions/:id/respond` | Answer a question (updates IQ) |

---

## Architecture Decision — Consolidated Router

All student routes live in a single `api/src/routes/student/index.ts` router rather than separate files per resource. The router is mounted once at `app.use('/api/v1/student', ...)`.

The individual `subjects.ts`, `chapters.ts`, and `progress.ts` files remain on disk for reference but are not imported in `app.ts`.

**Why:** Express 5 route shadowing — when multiple sub-routers are mounted at the same base path, parameterized routes in one router can shadow static routes in another. Consolidating into one router eliminates this ambiguity.

## Debugging Note — Stale Server Process

During development, `GET /api/v1/student/subjects` returned 404 despite the route being correctly defined. Root cause: the previous server process was still running with old compiled code. After `kill`-ing the old PID and starting a fresh `ts-node` process, all routes returned 200.

**Lesson:** always kill the old server by PID before testing a new build. Check `netstat -ano | grep :4000` to confirm the correct process is running.

---

## Fixes vs Reference Files

### 1. LLM trigger commented out
`triggerQuestion()` call is commented out in `POST /progress/frame`. The function and its imports from `llm.service` are removed entirely. Re-enable in Phase 3 Step 19.

### 2. `Difficulty` type from `@prisma/client`
Reference file imported `Difficulty` from `../../../../shared/types`. This fails the `rootDir` constraint in `tsconfig.json`. Fixed by importing `Difficulty` from `@prisma/client` (Prisma generates an identical string union type from the schema enum).

### 3. `iq.service.ts` created now (not deferred to Phase 3)
The `respond` endpoint needs `updateIqScore` and `getIqDelta`. These are pure math functions with no external dependencies, so they're safe to create now. The IQ model logic matches CLAUDE.md Section 11.
