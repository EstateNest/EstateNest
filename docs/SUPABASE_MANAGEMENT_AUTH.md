# Supabase Management Authentication

Estate Nest is a Vite React application with Vercel Functions. Management credentials are verified only by Supabase Auth through the backend login endpoint.

## Login Flow

1. The browser submits an email and password to `POST /api/auth/login`.
2. The Vercel Function calls `supabase.auth.signInWithPassword` using `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
3. The authenticated access token queries `public.user_roles` under Row Level Security.
4. Only approved Estate Nest roles receive access.
5. Supabase access and refresh tokens are stored in `HttpOnly`, `SameSite=Strict` cookies and marked `Secure` in Production.
6. Every management API request verifies the current Supabase user and role before accessing CRM data.

No Supabase token is stored in localStorage, and `SUPABASE_SECRET_KEY` is never exposed to the browser.

## Required Migration

Apply `supabase/migrations/20260801163000_management_user_roles.sql` through the Supabase SQL Editor. It creates `public.user_roles`, enables RLS, permits authenticated users to read only their own role, and maps the verified owner Auth user to `super_admin`.

Authenticated users receive no insert, update, or delete policy on `public.user_roles`. Role assignment remains a server-side administrative operation.

## Required Environment Variables

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` for server-side CRM administration, audit logging, and lead operations
- `SESSION_EXPIRY_DAYS` optionally controls refresh-cookie lifetime

The management frontend does not require `VITE_SUPABASE_*` variables because all authentication requests use same-origin Vercel Functions.

## Preview Testing

Use a separate staging Supabase project for Preview. Configure Preview-scoped `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, apply the migration, and add a branch-scoped staging `SUPABASE_SECRET_KEY` only when testing CRM data operations.

Credential-driven Playwright tests read `MANAGEMENT_TEST_EMAIL` and `MANAGEMENT_TEST_PASSWORD`. Unauthorized-role coverage optionally reads `MANAGEMENT_UNAUTHORIZED_EMAIL` and `MANAGEMENT_UNAUTHORIZED_PASSWORD`. Never commit their values.
