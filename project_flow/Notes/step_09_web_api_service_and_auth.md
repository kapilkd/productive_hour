# Step 09 — Web API Service and Auth Store

**Phase:** 1 — Foundation  
**Status:** Complete  
**Date:** 2026-06-07

---

## What Was Done

| Task | Status |
|------|--------|
| `apps/web/.env` with `VITE_API_BASE_URL` | ✅ |
| `apps/web/src/services/api.service.ts` — Axios instance + 401 interceptor | ✅ |
| `apps/web/src/stores/auth.store.ts` — Zustand persist store | ✅ |
| `apps/web/src/types/index.ts` — re-exports from `../../../../shared/types` | ✅ |
| `tsc --noEmit` passes with zero errors | ✅ |

---

## Key Behaviors

### Axios interceptor (api.service.ts)
- On 401: lazy-imports `useAuthStore`, calls `refreshToken()`, retries original request once
- On second 401 (refresh also failed): calls `logout()`, user must re-login
- `withCredentials: true` ensures the httpOnly refresh cookie is sent with every request

### Auth store (auth.store.ts)
- Zustand `persist` middleware writes `{ user, accessToken }` to `localStorage` under key `"auth-store"`
- `onRehydrateStorage` callback restores the `Authorization: Bearer <token>` header on Axios after a page reload
- `login()` calls `POST /auth/login`, stores user + token, sets header
- `logout()` fires `POST /auth/logout` (non-blocking), clears store + header
- `refreshToken()` calls `POST /auth/refresh`, updates token + header

---

## Notes
- Circular import between `api.service.ts` and `auth.store.ts` is avoided via lazy `import()` inside the interceptor callback.
