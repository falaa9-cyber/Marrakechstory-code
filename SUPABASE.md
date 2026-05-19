# Supabase — operations notes

## What's deployed

| Piece | Location |
|---|---|
| Table | `public.form_submissions` (RLS on, anon-insert only) |
| Trigger | `trg_notify_form_submission` → `net.http_post` → Edge Function |
| Edge Function | `notify-submission` (DB webhook target, no JWT) |

## Schema

See [`supabase/migrations/20260519_form_submissions.sql`](supabase/migrations/20260519_form_submissions.sql).
Apply with `supabase db push` once the CLI is wired up.

## Edge Function secrets

Set in **Supabase Studio → Project Settings → Edge Functions → Secrets**:

| Key | Purpose |
|---|---|
| `WEBHOOK_SHARED_SECRET` | Optional. If set, the function rejects calls that don't send the matching `X-Webhook-Secret` header. Also add the same value to **Vault** under name `WEBHOOK_SHARED_SECRET` so the database trigger can read it. |
| `SLACK_WEBHOOK_URL` | Optional. Slack incoming-webhook URL — every new submission is posted as a Slack message. |
| `RESEND_API_KEY` | Optional. Resend API key. |
| `ADMIN_EMAIL_TO` | Optional. Inbox that receives the email summary. |
| `ADMIN_EMAIL_FROM` | Optional. Defaults to `Marrakech Story <noreply@marrakechstory.com>`. Must be a Resend-verified sender. |

After updating any secret, Supabase redeploys the function automatically.

## Reading submissions

Use Supabase Studio (Table editor → `public.form_submissions`) or any SQL client connected with the service role:

```sql
select created_at, kind, name, email, phone, start_date, end_date, duration, payload
from public.form_submissions
order by created_at desc
limit 50;
```

## Local dev

The site is static — open `index.html` or run `python3 -m http.server 8080`. `src/env.js` is committed with the public URL + publishable key so submissions go straight to the live Supabase project.

To rotate the publishable key for a build:

```sh
VITE_SUPABASE_URL=...    VITE_SUPABASE_PUBLISHABLE_KEY=... \
  npm run build
```

The `generate-env-js` Vite plugin overwrites `dist/src/env.js` with whatever's in `VITE_SUPABASE_*` so the deployed bundle uses those values instead of the source defaults.
