# Doctor Hub — Security (Phase 11)

## API hardening

| Control | Implementation |
|---------|----------------|
| Security headers | `helmet` on all responses |
| CORS | Allowlist via `CORS_ORIGINS` or `FRONTEND_URL` + `ADMIN_URL` |
| Rate limiting | Auth: 20 / 15 min; API: 300 / 15 min; uploads: 40 / 15 min; AI: 15 / 15 min |
| Body size | JSON/urlencoded capped at 1 MB |
| Uploads | Images only (JPEG, PNG, WebP, GIF), max 5 MB, max 5 files, temp disk storage |
| Errors | No stack traces to clients in production |
| Env validation | `JWT_SECRET` (≥32 chars), Supabase URL/key required at startup |

## Authentication

- JWT in `Authorization: Bearer <token>` with `userId` + `role`.
- Passwords hashed with bcrypt (10 rounds).
- `express-validator` on auth and documented routes.
- Medical history / prescriptions: immutable at DB + API layer; RBAC on read/write.

## Production checklist

1. Set `NODE_ENV=production`.
2. Generate a strong `JWT_SECRET` (32+ random characters); never commit `.env`.
3. Set `CORS_ORIGINS` to your deployed patient and admin URLs (comma-separated).
4. Use HTTPS on all three apps (Vercel/hosting default).
5. Run `supabase_schema.sql`, `supabase_messages.sql`, then seed if needed.
6. Disable or rotate legacy `ADMIN_EMAIL` / `ADMIN_PASSWORD` env login if not required.
7. Restrict Supabase service key to server-only; use RLS policies if you extend beyond API-only access.

## Local development

With `NODE_ENV` unset, CORS allows all origins when no allowlist is configured. Rate limits are relaxed for easier testing.
