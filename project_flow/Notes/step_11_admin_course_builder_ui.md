# Step 11 — Admin Course Builder UI

**Phase:** 1 — Foundation
**Status:** Complete
**Date:** 2026-06-07

---

## What Was Done

| File | Status |
|------|--------|
| `apps/web/src/pages/admin/DashboardPage.tsx` | ✅ Analytics stat cards (totalStudents, totalSubjects, avgIQ) |
| `apps/web/src/pages/admin/ClassesPage.tsx` | ✅ List + inline create form |
| `apps/web/src/pages/admin/ClassDetailPage.tsx` | ✅ Subjects list + create (questionEveryNFrames, sequentialChapters) |
| `apps/web/src/pages/admin/SubjectDetailPage.tsx` | ✅ Chapters list + create + delete |
| `apps/web/src/pages/admin/ChapterDetailPage.tsx` | ✅ Frames list with add/edit/delete |
| `apps/web/src/components/admin/FrameEditor.tsx` | ✅ AddFrameForm + FrameRow + TTSBadge |
| `api/src/routes/admin/courses.ts` | ✅ Added `GET /admin/subjects` flat list |
| `apps/web/tsconfig.app.json` | ✅ Added `ignoreDeprecations: "6.0"` for baseUrl warning |

## Navigation Flow

```
/admin/classes → ClassesPage
  → /admin/classes/:classId  (state: { className }) → ClassDetailPage
    → /admin/subjects/:subjectId  (state: { subjectName }) → SubjectDetailPage
      → /admin/chapters/:chapterId  (state: { chapterTitle }) → ChapterDetailPage
```

Location state is used to carry display names without extra API calls.

## Fix: Unused React imports

`noUnusedLocals: true` + TypeScript 6 JSX transform = `import React from 'react'` is unused when React APIs are accessed via named imports only. Stripped the default import from all new files.

## Fix: `ignoreDeprecations: "6.0"`

`baseUrl` in tsconfig is deprecated in TypeScript 7. Added `ignoreDeprecations: "6.0"` to suppress the warning while keeping the alias working.
