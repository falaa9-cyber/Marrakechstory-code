# Supabase — operations notes

## What's deployed

| Piece | Location |
|---|---|
| Table | `public.form_submissions` (RLS on, anon-insert only) |
| Trigger | `trg_notify_form_submission` → `net.http_post` → Edge Function |
| Edge Function | `notify-submission` (DB webhook target, no JWT) |
| Edge Function | `list-submissions` (powers `/admin.html`, no JWT) |

## Schema

See [`supabase/migrations/20260519_form_submissions.sql`](supabase/migrations/20260519_form_submissions.sql).
Apply with `supabase db push` once the CLI is wired up.

## Edge Function secrets

Set in **Supabase Studio → Project Settings → Edge Functions → Secrets**:

| Key | Required by | Purpose |
|---|---|---|
| `WEBHOOK_SHARED_SECRET` | notify-submission | Optional. If set, the function rejects calls that don't send the matching `X-Webhook-Secret` header. Also add the same value to **Vault** under name `WEBHOOK_SHARED_SECRET` so the database trigger can read it. |
| `SLACK_WEBHOOK_URL` | notify-submission | Optional. Slack incoming-webhook URL — every new submission is posted as a Slack message. |
| `RESEND_API_KEY` | notify-submission | Optional. Resend API key. |
| `ADMIN_EMAIL_TO` | notify-submission | Optional. Inbox that receives the email summary. |
| `ADMIN_EMAIL_FROM` | notify-submission | Optional. Defaults to `Marrakech Story <noreply@marrakechstory.com>`. Must be a Resend-verified sender. |
| `ADMIN_PASSWORD` | list-submissions | **Required for /admin.html to work.** Pick something long and random. |
| `SB_SERVICE_ROLE_KEY` | list-submissions | Service-role key for the project. The platform also injects `SUPABASE_SERVICE_ROLE_KEY` automatically; either name works. |

After updating any secret, Supabase redeploys the function automatically.

## Local dev

The site is static — open `index.html` (or `python3 -m http.server 8080`). `src/env.js` is committed with the public URL + publishable key so submissions go straight to the live Supabase project.

To rotate the publishable key for a build:

```sh
VITE_SUPABASE_URL=...    VITE_SUPABASE_PUBLISHABLE_KEY=... \
  npm run build
```

The `generate-env-js` Vite plugin overwrites `dist/src/env.js` with whatever's in `VITE_SUPABASE_*` so the deployed bundle uses those values instead of the source defaults.

## Admin view

- URL: `/admin.html` on whatever domain the site is deployed to.
- Login: prompts once for `ADMIN_PASSWORD` (cached in `sessionStorage`; cleared on Sign out).
- Lists the 100 newest submissions, filterable by `kind`. Click a row to expand the full JSON payload.
