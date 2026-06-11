# Step 04 — Authentication API

**Phase:** 1 — Foundation  
**Status:** Complete  
**Date:** 2026-06-07

---

## What Was Done

| Task | Status |
|------|--------|
| `api/src/middleware/auth.ts` — JWT verification middleware | ✅ |
| `api/src/middleware/rbac.ts` — Role-based access control | ✅ |
| `api/src/routes/auth.ts` — Login, refresh, logout endpoints | ✅ |
| `api/src/app.ts` — Express app (auth only, others added in Steps 05-07) | ✅ |
| `api/src/server.ts` — Entry point with dotenv + app.listen | ✅ |
| `tsc --noEmit` passes with zero errors | ✅ |
| All 5 endpoint tests pass | ✅ |

---

## Files Created / Updated

```
api/src/
├── middleware/
│   ├── auth.ts       ← verifyJWT middleware + AuthRequest interface
│   └── rbac.ts       ← requireRole(roles[]) factory
├── routes/
│   └── auth.ts       ← POST /login, /refresh, /logout
├── app.ts            ← Express app (auth route mounted; admin/student TBD)
└── server.ts         ← dotenv + app.listen on PORT 4000
```

---

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/auth/login` | Public | Issues accessToken + refreshToken cookie |
| POST | `/api/v1/auth/refresh` | Cookie | Returns new accessToken from refresh cookie |
| POST | `/api/v1/auth/logout` | Bearer | Clears refresh cookie |

---

## Test Results

| Test | Expected | Result |
|------|----------|--------|
| A — Login correct creds | 200 + accessToken + cookie | ✅ |
| B — Login wrong password | 401 `Invalid credentials` | ✅ |
| C — Refresh token (via cookie) | 200 + new accessToken | ✅ |
| D — Logout | 200 `Logged out`, cookie cleared | ✅ |
| E — No token on protected route | 401 `Missing or invalid authorization header` | ✅ |

---

## Fixes vs project_structure Reference Files

### 1. `routes/auth.ts` — Prisma findUnique fix
**Problem:** Reference file used `prisma.user.findUnique({ where: { email, deletedAt: null } })`.  
Prisma v6 `findUnique` only accepts `@unique`/`@id` fields in `where`. `deletedAt` is not unique — adding it causes a TypeScript error.

**Fix:** Find by email only, then check `deletedAt` in the result:
```typescript
const user = await prisma.user.findUnique({ where: { email } });
if (!user || user.deletedAt !== null || !user.isActive || ...) { ... }
```

### 2. `routes/auth.ts` — JWT `expiresIn` type fix
**Problem:** `@types/jsonwebtoken` v9 types `expiresIn` as `StringValue | number` (not plain `string`). `process.env.JWT_ACCESS_TTL` is `string | undefined` — TypeScript rejects the assignment.

**Fix:** Extract TTL constants with a cast at the top of the file:
```typescript
import jwt, { SignOptions } from 'jsonwebtoken';
const accessTTL = (process.env.JWT_ACCESS_TTL ?? '15m') as SignOptions['expiresIn'];
const refreshTTL = (process.env.JWT_REFRESH_TTL ?? '7d') as SignOptions['expiresIn'];
```

### 3. `app.ts` — Step-04-only version
The project_structure `app.ts` imports all admin and student routes (which don't exist yet). This step's `app.ts` only imports `authRoutes`. Other route mounts are added incrementally in Steps 05-07.

### 4. `server.ts` — dotenv loaded before any imports
`dotenv.config()` is called at the very top of `server.ts` before any other imports to ensure `process.env.*` is populated before Express/Prisma/JWT modules initialize.

---

## Middleware Details

### `verifyJWT`
- Reads `Authorization: Bearer <token>` header
- Verifies with `JWT_ACCESS_SECRET`
- Attaches `req.user = { id, role, email }` on success
- Returns `401` on missing header or invalid/expired token

### `requireRole(roles[])`
- Call after `verifyJWT` in middleware chain
- Returns `403` if `req.user.role` not in allowed list
- Usage: `router.get('/path', verifyJWT, requireRole(['admin']), handler)`

### JWT Strategy
- **Access token:** 15 min TTL, signed with `JWT_ACCESS_SECRET`, sent in JSON body
- **Refresh token:** 7 day TTL, signed with `JWT_REFRESH_SECRET`, stored in `httpOnly` cookie

---

## Starting the Server

```powershell
cd api
npx ts-node src/server.ts
# or for auto-restart:
npm run dev
```

---

## Next Step

**Step 05 — Admin Course CRUD API**  
Adds admin routes for managing classes, subjects, chapters, and frames. The `app.ts` will be updated to mount these routes behind the `adminGuard` middleware chain.
