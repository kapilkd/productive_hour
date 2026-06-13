# Step 15 — Board Level (CBSE / ICSE / State Board)

**Phase:** 1 — Foundation (replanning addition)
**Status:** Complete
**Date:** 2026-06-11

---

## What Was Done

| File | Change |
|------|--------|
| `api/src/prisma/schema.prisma` | Added `Board` model; added nullable `boardId` FK on `Class` |
| `api/src/prisma/migrations/20260611073916_add_boards/` | Migration: `CREATE TABLE boards`, `ALTER TABLE classes ADD COLUMN board_id` |
| `api/src/seed.ts` | Upserts CBSE, ICSE, State Board on every seed run |
| `api/src/routes/admin/courses.ts` | Added Board endpoints; `POST /admin/classes` now requires `boardId` |
| `shared/types/index.ts` | Added `Board` interface; added `boardId?` + `_count` to `Class` |
| `apps/web/src/types/index.ts` | Same as shared types |
| `apps/web/src/pages/admin/BoardsPage.tsx` | New — lists all boards, color-coded cards |
| `apps/web/src/pages/admin/BoardDetailPage.tsx` | New — lists classes within a board, creates new classes |
| `apps/web/src/pages/admin/ClassDetailPage.tsx` | Back button now navigates to parent board via location.state |
| `apps/web/src/App.tsx` | Added `/admin/boards` and `/admin/boards/:boardId` routes; removed old `/admin/classes` list route |
| `apps/web/src/components/shared/Layout.tsx` | Sidebar "Courses" link updated from `/admin/classes` to `/admin/boards` |
| `CLAUDE.md` | Updated hierarchy, DB schema, API list, and frontend routes |

---

## New Hierarchy

```
Board (CBSE / ICSE / State Board)
  └── Class (Grade 10, Grade 11 …)
        └── Subject (Mathematics, Physics …)
              └── Chapter (Algebra, Optics …)
                    └── Frame (narrated content)
```

---

## New API Endpoints

```
GET  /admin/boards               → All boards with class count
POST /admin/boards               → Create board (name, description?)
GET  /admin/boards/:id/classes   → Classes under a board (with subject count)
```

### Updated endpoint
`POST /admin/classes` — now requires `boardId: UUID` in the request body.

---

## Seeded Boards

| Name | Description |
|------|-------------|
| CBSE | Central Board of Secondary Education |
| ICSE | Indian Certificate of Secondary Education |
| State Board | State government curriculum boards |

Seed uses `upsert` on `name` — idempotent, safe to run multiple times.

---

## Schema Notes

- `boardId` is **nullable** on `classes` so existing rows (created before this step) are not broken.
- New classes created via the API always require `boardId` (enforced in Zod schema).
- `boards.name` has a `@unique` constraint — prevents duplicate CBSE/ICSE entries.

---

## Frontend Navigation Flow

```
Sidebar "Courses"
  → /admin/boards          (BoardsPage — pick CBSE / ICSE / State Board)
  → /admin/boards/:boardId (BoardDetailPage — Grade 10, Grade 11 …)
  → /admin/classes/:id     (ClassDetailPage — Mathematics, Physics …)
  → /admin/subjects/:id    (SubjectDetailPage — Chapter list)
  → /admin/chapters/:id    (ChapterDetailPage — Frame editor)
```

Back buttons carry `boardId` + `boardName` through `location.state` so each level
knows where to navigate back to.

---

## Key Design Decisions

- **Pre-seeded boards** — admins don't need to create CBSE/ICSE; they just pick from the list.
- **Admin can add new boards** — form on `BoardsPage` allows custom boards (e.g. IB, NIOS).
- **Color coding** — CBSE = blue, ICSE = green, State Board = amber for fast visual scanning.
- **boardId nullable** — avoids a destructive migration on the `classes` table; API enforces it going forward.
