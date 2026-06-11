# Step 10 — Web Routing and Layouts

**Phase:** 1 — Foundation  
**Status:** Complete  
**Date:** 2026-06-07

---

## What Was Done

| Task | Status |
|------|--------|
| `apps/web/src/components/shared/Layout.tsx` — AdminLayout + StudentLayout | ✅ |
| `apps/web/src/pages/LoginPage.tsx` — email/password form with role-based redirect | ✅ |
| `apps/web/src/App.tsx` — BrowserRouter with ProtectedRoute guard | ✅ |
| Placeholder pages for all routes (admin + student) | ✅ |
| `tsc --noEmit` passes with zero errors | ✅ |

---

## Route Structure

```
/login                          → LoginPage (public)
/admin                          → ProtectedRoute (admin, super_admin) → AdminLayout
  /admin/dashboard              → DashboardPage (placeholder)
  /admin/classes                → ClassesPage (placeholder, Step 11)
  /admin/classes/:classId       → ClassDetailPage (placeholder, Step 11)
  /admin/subjects/:subjectId    → SubjectDetailPage (placeholder, Step 11)
  /admin/chapters/:chapterId    → ChapterDetailPage (placeholder, Step 11)
  /admin/students               → StudentsPage (placeholder, Step 12)
  /admin/students/:studentId    → StudentDetailPage (placeholder, Step 12)
  /admin/analytics              → AnalyticsPage (placeholder, Step 21)
/student                        → ProtectedRoute (student) → StudentLayout
  /student/subjects             → SubjectsPage (placeholder, Step 13)
  /student/chapters/:id/listen  → ListenPage (placeholder, Step 15)
  /student/progress             → ProgressPage (placeholder, Step 22)
* → redirect to /login
```

## How to Access the App

1. Start the API: `cd api && npm run dev`
2. Start the web: `cd apps/web && npm run dev`
3. Open `http://localhost:5173` → redirects to `/login`
4. Login as admin (`admin@learnflow.com` / `Admin@1234`) → redirects to `/admin/dashboard`

---

## Key Behaviors

### AdminLayout
- Left sidebar (56px wide) with NavLink-based navigation
- Active route highlighted with indigo background
- Logout button at bottom clears store + navigates to /login

### StudentLayout
- Top header with app name + student's name + logout button
- Full-width content area below header

### ProtectedRoute
- `user === null` → redirect to `/login`
- `user.role` not in `allowedRoles` → redirect to `/login`
- Otherwise renders children (the layout with `<Outlet />`)
