# Security & Performance Enhancements

This document summarizes the security protocols, performance optimizations, and how to validate them.

## Authentication Guard

- Only authenticated users can access `'/home'` and `'/dashboard'`.
- Implemented in `src/middleware.ts` using NextAuth v5 `auth()`.
- Unauthenticated requests are redirected to `/login` with `callbackUrl` preserved.

## Session Management

- Automatic logout after 15 minutes of inactivity across tabs.
- Implemented by `src/components/idle-timeout.tsx` and wired in `src/app/providers.tsx`.
- On timeout, clears custom `app_session` cookie via `POST /api/auth/logout` and calls NextAuth `signOut`, then redirects to `/login`.

## Login Hardening

- Rate limiting for login attempts (5/min per IP+identifier) via in-memory limiter `src/lib/rate-limit.ts` and enforced in `src/app/api/auth/login/route.ts`.
- CSRF double-submit check for login API (issues token if missing).
- Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax`.
- Sensitive tokens are never exposed to JavaScript.

## Security Headers

- Applied via `src/middleware.ts` to app routes:
  - `Content-Security-Policy` (CSP) with conservative defaults and allowances for Supabase/Google APIs.
  - `Strict-Transport-Security` (HSTS) for 2 years.
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal.
- Use real HTTPS in production (behind a TLS-terminating proxy/load balancer).

## Database Performance

- Employees API now paginated and validated.
  - File: `src/app/api/employees/route.ts`
  - Query params: `limit` (default 25, max 100), `offset` (default 0), `status`, `q`.
  - Avoids `SELECT *` by selecting specific fields and relations.
  - Adds `Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=120` for repeatable list queries.
- Indexing recommendations (PostgreSQL):
  - `CREATE INDEX ON employees (employment_status, full_name);`
  - `CREATE INDEX ON users (email);`
  - `CREATE INDEX ON role_permissions (role_id);`
  - `CREATE INDEX ON employees (user_id);`

## Input Validation

- `zod` used in API: `src/app/api/employees/route.ts` for query param validation.
- For other endpoints, prefer `zod` schemas per-route for body/params.

## CORS

- Default same-origin policy is used for app APIs.
- If exposing APIs cross-origin, use a strict origin allowlist and preflight handling.

## Expected Validation Steps

1. Access `/dashboard` or `/home` without login → redirected to `/login`.
2. Stay idle > 15 minutes → automatic logout and redirect to `/login`.
3. List endpoints (e.g., `/api/employees`) respond < 100ms on indexed datasets and respect pagination.
4. Confirm HTTPS in production and that HSTS/CSP headers are present.
5. Run security audits (e.g., OWASP ZAP, Lighthouse). Address any CSP violations by adjusting `src/middleware.ts` CSP as needed.

## Notes

- NextAuth is configured with JWT sessions and an optional Prisma adapter for OAuth. Supabase credentials flow is available but sensitive details remain server-side.
- Avoid storing plain text passwords; use strong hashing (argon2/bcrypt) in production.

