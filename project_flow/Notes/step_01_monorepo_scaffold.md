# Step 01 — Monorepo Scaffold

**Phase:** 1 — Foundation  
**Status:** Complete  
**Date:** 2026-06-07

---

## What Was Built

Top-level monorepo structure with two independently compilable projects (`api/` and `apps/web/`) and a shared types package.

---

## Folder Structure Created

```
productive_hour/          ← project root (existing git repo)
├── api/                  ← Express + Node.js backend
│   ├── src/
│   │   ├── server.ts     ← entry point, starts HTTP server
│   │   └── app.ts        ← Express app, middleware wired up
│   ├── package.json      ← name: "learnflow-api"
│   ├── tsconfig.json
│   └── nodemon.json
├── apps/
│   └── web/              ← Vite + React + TypeScript frontend
│       ├── src/
│       │   └── index.css ← Tailwind v4 import
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── tsconfig.app.json
└── shared/
    └── types/
        └── index.ts      ← Domain types shared across api + web
```

---

## API — `api/`

### Dependencies installed

| Package | Purpose |
|---------|---------|
| express, cors, cookie-parser | HTTP server |
| @prisma/client, prisma | ORM |
| bcrypt, jsonwebtoken | Auth |
| bullmq, ioredis | Job queue |
| @anthropic-ai/sdk | LLM (Claude) |
| elevenlabs | TTS |
| @aws-sdk/client-s3 | File storage |
| zod | Validation |
| typescript, ts-node, nodemon | Dev tooling |
| @types/express, @types/node, @types/bcrypt, @types/jsonwebtoken, @types/cookie-parser, @types/cors | Type declarations |

### `tsconfig.json` key settings
- `target`: ES2020
- `module`: commonjs
- `outDir`: `dist/`
- `rootDir`: `src/`
- `strict`: true
- `esModuleInterop`: true

### `nodemon.json`
- Watches `src/` folder
- Executes via `ts-node src/server.ts`

### npm scripts
```json
"dev":   "nodemon"
"build": "tsc"
"start": "node dist/server.js"
```

---

## Web — `apps/web/`

### Scaffold
- Created with `npm create vite@latest web -- --template react-ts`

### Dependencies installed

| Package | Purpose |
|---------|---------|
| zustand | State management |
| axios | HTTP client |
| howler | Audio playback |
| react-router-dom | Routing |
| react-hook-form, zod, @hookform/resolvers | Forms + validation |
| @types/howler | Type declarations |
| tailwindcss@v4, @tailwindcss/vite | Styling |

### Tailwind v4 setup
- Tailwind v4 does **not** use `tailwind.config.js` or PostCSS
- Plugin added to `vite.config.ts` via `@tailwindcss/vite`
- CSS entry point uses `@import "tailwindcss"` (single line, replaces old three-directive approach)

### `tsconfig.app.json` additions
- `strict`: true
- `baseUrl`: `.`
- `paths`: `{ "@/*": ["src/*"] }` — path alias for cleaner imports

### `vite.config.ts` additions
- `tailwindcss()` plugin from `@tailwindcss/vite`
- `resolve.alias`: `{ '@': '/src' }`

---

## Shared Types — `shared/types/index.ts`

Copied from `project_structure/shared/types/index.ts`.  
Contains all domain interfaces used across both projects:

- `User`, `Class`, `Subject`, `Chapter`, `Frame`
- `StudentSubjectAccess`, `StudentChapterProgress`, `StudentFrameProgress`
- `StudentIqScore`, `LlmQuestion`, `StudentQuestionResponse`
- `LlmQuestionPayload` (shape returned by Claude before DB persist)
- Enums: `Role`, `AudioStatus`, `ChapterStatus`, `Difficulty`

---

## Verification

```
api/     → npx tsc --noEmit   ✅ zero errors
apps/web/ → npx tsc --noEmit  ✅ zero errors
```

---

## Key Decisions & Gotchas

- **Tailwind v4 installed** (not v3). Config approach is entirely different — no `tailwind.config.js`, uses Vite plugin + single CSS import. Do not follow v3 docs.
- **`@types/cors` was not in the original step file** but was required — added as a dev dependency to fix TS7016 error.
- **Express v5** was installed (latest). Type definitions are `@types/express@^5`.
- **TypeScript v6** was installed. Compilation flags compatible.
- **`shared/types/`** is not yet wired as a proper npm workspace package. In a later step, if cross-imports are needed, set up npm workspaces or use path aliases.

---

## Next Step

**Step 02 — Docker and Database Setup**  
Sets up `docker-compose.yml` (PostgreSQL + Redis) and runs the first Prisma migration.
