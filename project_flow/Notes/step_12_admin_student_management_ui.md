# Step 12 — Admin Student Management UI

**Phase:** 1 — Foundation
**Status:** Complete
**Date:** 2026-06-07

---

## What Was Done

| File | Status |
|------|--------|
| `apps/web/src/components/admin/StudentTable.tsx` | ✅ Table with name/email/status/manage columns |
| `apps/web/src/pages/admin/StudentsPage.tsx` | ✅ List + inline create form |
| `apps/web/src/pages/admin/StudentDetailPage.tsx` | ✅ IQ scores + subject access management + chapter progress |
| `api/src/routes/admin/students.ts` | ✅ Added `GET /admin/students/:id/access` endpoint |

## StudentDetailPage Data Sources

| Section | API Call |
|---------|----------|
| IQ scores | `GET /admin/students/:id/progress` → `iqScores[]` |
| Subject access | `GET /admin/students/:id/access` → records with nested subject |
| Chapter progress | `GET /admin/students/:id/progress` → `progress[]` |
| Subject dropdown | `GET /admin/subjects` (flat list from Step 11) |
| Student info | Passed via router state, fallback to `GET /admin/students` filter |

## Access Management Flow

- Grant: `POST /admin/students/:id/access { subjectId }` — optimistic UI update
- Revoke: `DELETE /admin/students/:id/access/:subjectId` — removes from local list
- Dropdown only shows subjects NOT already assigned to the student
