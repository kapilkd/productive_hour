# Step 13 — Student Web — Phase 1 Screens (Text-Only)

**Phase:** 1 — Foundation
**Status:** Complete
**Date:** 2026-06-07

---

## What Was Done

| File | Status |
|------|--------|
| `apps/web/src/stores/progress.store.ts` | ✅ Zustand store with fetchProgress + updateFrameProgress |
| `apps/web/src/pages/student/SubjectsPage.tsx` | ✅ Subject cards with IQ score badges |
| `apps/web/src/pages/student/SubjectChaptersPage.tsx` | ✅ Chapter list with status badges (new file) |
| `apps/web/src/pages/student/ListenPage.tsx` | ✅ Text-only reading mode with Prev/Next + frame progress dots |
| `apps/web/src/App.tsx` | ✅ Added `/student/subjects/:subjectId` route |

## Progress Store

`fetchProgress(subjectId)` fires two requests in parallel:
- `GET /student/subjects/:subjectId/chapters` → populates `chapterProgress[subjectId]`
- `GET /student/iq/:subjectId` → populates `iqScores[subjectId]`

No persist middleware — progress is re-fetched on every subject page load.

## ListenPage — Resume Behaviour

On chapter open, `GET /student/chapters/:id` returns `myProgress.lastFrameIndex`. The page starts at that index (clamped to valid range). Every time the student clicks Next, `POST /student/progress/frame` is called for the current frame before advancing.

## Phase 1 Complete

All roles can now perform their full workflows end-to-end:
- Admin: Create class → subject → chapter → frames → assign to student
- Student: Login → see subjects → open chapter → read frames → progress tracked
