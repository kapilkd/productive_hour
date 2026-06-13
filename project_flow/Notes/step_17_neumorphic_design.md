# Step 17 — Neumorphic Design System

## Overview
Applied a consistent neumorphic (soft UI) design system across all admin and student-facing pages, replacing the earlier Tailwind dark-mode utility classes with a CSS-variable-driven system defined in `apps/web/src/index.css`.

---

## Design Philosophy
Neumorphic design simulates physical depth using two contrasting box-shadows on a single background color:
- **Raised** — element pops out towards the viewer (light shadow top-left, dark shadow bottom-right)
- **Inset** — element presses into the surface (reversed shadows)
- **Flat** — no shadow, blends into background

The entire app is forced into dark mode via `:root` variables (no OS media query), ensuring the design always renders on the intended dark base (`#1e2130`).

---

## CSS Variables (defined in `apps/web/src/index.css`)

```
--neu-bg:            #1e2130   (main page background)
--neu-shadow-dark:   #161827   (dark side of shadow pair)
--neu-shadow-lite:   #262a3f   (light side of shadow pair)
--neu-text:          #e2e8f0
--neu-text-muted:    #94a3b8
--neu-accent:        #818cf8   (indigo — primary CTA)
--neu-accent-text:   #1e1b4b
--neu-danger:        #f87171
--neu-success:       #4ade80
--neu-warn:          #fb923c
```

---

## CSS Class Reference

| Class | Effect |
|-------|--------|
| `neu-page` | Full-page background color |
| `neu-raised` | Raised shadow (pops out) |
| `neu-inset` | Inset shadow (pressed in) |
| `neu-flat` | No shadow, same background |
| `neu-card` | Raised card with 24px padding + 20px radius |
| `neu-card-sm` | Same but 14px padding + 14px radius |
| `neu-stat-card` | Wide raised stat display card |
| `neu-btn` | Base button reset (all buttons start here) |
| `neu-btn-raised` | Secondary raised button |
| `neu-btn-accent` | Primary accent (indigo) button |
| `neu-btn-danger` | Danger (red) button |
| `neu-btn-pill` | Pill shape modifier |
| `neu-btn-sm` / `neu-btn-lg` | Size modifiers |
| `neu-btn-icon` | Square icon button |
| `neu-input` | Inset input field |
| `neu-textarea` | Inset textarea |
| `neu-select` | Inset select dropdown |
| `neu-label` | Muted uppercase label |
| `neu-input-group` | Wrapper for label + input pairs |
| `neu-toggle-track` / `neu-toggle-thumb` / `neu-toggle-active` | Toggle switch |
| `neu-progress-track` / `neu-progress-fill` | Progress bar |
| `neu-badge` / `neu-badge-accent` / `neu-badge-success` / `neu-badge-warn` / `neu-badge-info` | Status badges |
| `neu-divider` | Hairline separator |
| `neu-nav-link` / `neu-nav-link-active` | Sidebar navigation link states |
| `neu-slide` | Frame presentation card (student listen mode) |
| `neu-bullet-item` | Bullet item with left icon |
| `neu-highlight-box` | Accent-bordered callout box |
| `neu-dropzone` / `neu-dropzone-active` | PDF drag-and-drop upload zone |
| `neu-table` | Full-width table with dividers |

---

## Files Updated

### Shared
- `apps/web/src/index.css` — complete rewrite with neumorphic token system
- `apps/web/src/components/shared/Layout.tsx` — AdminLayout + StudentLayout sidebars/headers

### Admin pages
- `LoginPage.tsx` — split card layout
- `DashboardPage.tsx` — stat cards + quick links
- `BoardsPage.tsx` — board cards with per-board accent colors
- `BoardDetailPage.tsx` — class cards grid
- `ClassDetailPage.tsx` — subject grid with Q-interval badge
- `SubjectDetailPage.tsx` — chapter list with order numbers
- `ChapterDetailPage.tsx` — PDF dropzone + frame list + sticky preview panel
- `StudentsPage.tsx` — create student form
- `StudentDetailPage.tsx` — IQ bars + access management + progress table
- `AnalyticsPage.tsx` — placeholder with neu-card
- `components/admin/FrameEditor.tsx` — frame rows with TTS badges + inline edit
- `components/admin/StudentTable.tsx` — neu-table with status badges

### Student pages
- `SubjectsPage.tsx` — subject cards with color-coded IQ circles
- `SubjectChaptersPage.tsx` — chapter list with lock/unlock states
- `ListenPage.tsx` — full listening player UI
- `ProgressPage.tsx` — placeholder with neu-card
- `components/student/FrameRenderer.tsx` — 8 layout types all themed

---

## Board-specific Colors (BoardsPage)
```
CBSE        → #818cf8 (indigo accent)
ICSE        → #4ade80 (green)
State Board → #fb923c (orange)
Others      → #818cf8 (default accent)
```

---

## Key Decisions
- **Dark always**: No OS-level check — `:root` forces the dark palette so every user sees the same experience.
- **CSS variables over Tailwind**: This lets inline `style=` props reference the same tokens, making shadows consistent without duplication.
- **No raw Tailwind color classes on UI elements**: All bg/text/border colors go through CSS variables. Tailwind is still used for layout utilities (flex, grid, gap, padding, etc.).
- **Spinner convention**: `border-top-transparent` on a square div with `animate-spin`; color inherits from `var(--neu-accent)` or `currentColor`.

---

## TypeScript Verification
`npx tsc --noEmit` on `apps/web` passes with zero errors after all neumorphic changes.
