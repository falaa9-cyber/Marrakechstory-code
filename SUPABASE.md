# Supabase — current project notes

## Project

- Project name: `falaa9-cyber's Project`
- Project ID: `xcpkujguvrhpsmftgxtn`
- Region: `eu-west-1`

## Current architecture

The website uses the Supabase browser client with the existing project's publishable key for:

- Website account sign-in and password reset
- Customer itinerary / booking inquiry capture
- Customer portal bookings and messages
- Admin console data access under RLS
- Admin file uploads in the `booking-files` bucket
- Lightweight page-view analytics

The repo now tracks these live edge functions:

- `notify-submission`
- `agent-draft`
- `client-account`
- `manage-partner`
- `list-submissions`
- `ga4-insights`

## July 24, 2026 hardening changes

- `booking-files` is now a private bucket.
- Admin file links now use signed URLs instead of public URLs.
- Staff/helper RLS functions were moved into a private schema for policy use.
- Public execution was revoked from privileged helper functions and trigger functions.
- `form_submissions`, `subscribers`, and `page_views` now have validated public-write policies instead of blanket `true` checks.
- Subscriber writes are insert-only from the browser; duplicate emails are ignored instead of merged client-side.

Migration files added in this repo:

- [`supabase/migrations/20260724113000_harden_rls_and_storage.sql`](supabase/migrations/20260724113000_harden_rls_and_storage.sql)
- [`supabase/migrations/20260724121500_rls_policy_cleanup.sql`](supabase/migrations/20260724121500_rls_policy_cleanup.sql)
- [`supabase/migrations/20260724124500_current_user_email_helper.sql`](supabase/migrations/20260724124500_current_user_email_helper.sql)

## Required env vars

Frontend build/runtime:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Edge Function secrets:

- `WEBHOOK_SHARED_SECRET`
- `SLACK_WEBHOOK_URL`
- `RESEND_API_KEY`
- `ADMIN_EMAIL_TO`
- `ADMIN_EMAIL_FROM`
- `ADMIN_PASSWORD` for `list-submissions`

The service-role key must stay server-side only. Never expose it in `src/`, `dist/`, or any `NEXT_PUBLIC_` / `VITE_` variable.

## Remaining platform warnings

- `citext` is still installed in `public`; moving it would require a separate schema/extension migration.
- Supabase Auth leaked-password protection is still disabled and should be enabled in the Auth settings.
- Some database indexes are currently unused; they are safe to leave in place until query patterns are reviewed with production traffic.

## Local and deploy flow

Build with the publishable key only:

```sh
VITE_SUPABASE_URL=... \
VITE_SUPABASE_PUBLISHABLE_KEY=... \
npm run build
```

The Vite `generate-env-js` step writes those public values into `dist/src/env.js` for deployment output.
