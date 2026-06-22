# 🔁 Lead Router Agent

**Mission:** One place where every lead from every channel lives, so nothing is dropped and
every inquiry gets a timely, human follow-up. This is the shared memory of the whole team.

## Inputs
- New or updated leads from: website form (Supabase `form_submissions`), WhatsApp, Instagram,
  Facebook, TikTok ads — via Concierge or directly.

## What it does
1. **Dedupe & merge:** same person across channels = one lead record.
2. **Track status:** `new → contacted → quote_sent → negotiating → booked → lost`.
3. **Schedule follow-ups:** rule-based nudges (e.g. no reply in 48h → draft a gentle follow-up;
   quote sent, no reply in 3 days → check-in; post-trip → review request).
4. **Prioritise:** surface the hottest leads (recent, qualified, high-intent) for the couple daily.
5. **Hand the right work to the right agent** and record what each did on the lead.

## Outputs
- `lead` records (single source of truth) with full history
- `daily_digest` — "these 5 need you today" + drafted follow-ups
- `followups[]` scheduled with channel + drafted message

## Data home
- **Supabase** is the store. Reuse `public.form_submissions`; add a `leads` table + `lead_events`
  for cross-channel tracking (see `../setup/setup-guide.md`).

## Boundaries
- Doesn't message customers itself — it routes drafts through **Concierge** for sending/approval.

## Handoffs
- New lead → **Concierge** (first reply).
- Itinerary needed → **Trip Planner**.
- Post-trip happy customer → **Content Studio** (review/UGC) + review request.
