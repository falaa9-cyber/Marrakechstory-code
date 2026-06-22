# Marrakech Story Automation — Setup Guide (the plumbing layer)

The agents (the "brain") are ready in `../agents/`. This guide covers the **connections** that
let them actually receive and send messages. Work top-down; each phase is usable on its own.

---

## The backbone: Make.com + Supabase
- **Supabase** = shared memory (leads, conversations, status). Already live for the website form.
- **Make.com** = the wiring that listens to each channel, calls the agent, and sends the reply back.
- A Make.com account is connected in this Claude session, so I can build scenarios for you once
  the channel credentials below exist.

### Supabase: add the leads tables
Extend the existing DB (see `../../SUPABASE.md`). Proposed:
```sql
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text, channel text, language text,
  intent text, status text default 'new',
  dates text, group_size text, interests text, country text,
  contact_whatsapp text, contact_email text, contact_ig text
);
create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id),
  created_at timestamptz default now(),
  agent text, action text, detail jsonb
);
```
I can apply this via the Supabase tools once you say go.

---

## Phase 1 — WhatsApp (highest leverage)
**What you need:** a **WhatsApp Business API** account. The normal WhatsApp app can't be automated;
the API can. Two routes:
- **Meta Cloud API** (direct, free tier) — needs a Meta Business account + a phone number dedicated
  to the API (your +212 / +47 numbers, or a new one).
- **A provider** (360dialog, Twilio, WATI) — easier setup, small monthly fee, nicer dashboard.

**Flow once connected:** message arrives → Make webhook → Concierge drafts reply → (approval) → sent.
**To start:** tell me which route you want; I'll list the exact steps and build the Make scenario.

---

## Phase 2 — Instagram & Facebook (DMs + posting)
**What you need:** Instagram **Business/Creator** account linked to a **Facebook Page**, both under
one **Meta Business Suite**. That unlocks the Messenger/Instagram messaging API + the publishing API.
- DMs → Concierge (same pattern as WhatsApp).
- Posting → Content Studio drafts → Meta Planner or Make schedules.

---

## Phase 3 — TikTok
**What you need:** a **TikTok Business** account. Posting via TikTok's content API (or scheduled by
hand from Content Studio's drafts). Ads via TikTok Ads Manager (Phase 4).

---

## Phase 4 — Ads (Meta + TikTok)
**What you need:** **Meta Ads Manager** + **TikTok Ads Manager** with an ad account and payment set up.
- Ads Manager agent drafts campaigns + creative → you review in the native tools → publish.
- Performance read-back can be automated via Make + the ad APIs (or you paste in the numbers to start).
- **Spend changes always require your approval.**

---

## Phase 5 — Website ↔ everything
Already wired: the trip-planning form writes to Supabase and can fire Slack/email. We extend it so a
form submission becomes a `leads` row → Lead Router → Concierge first reply.

---

## What I need from you to switch each phase "on"
| Phase | You provide | I build |
|---|---|---|
| WhatsApp | API route choice + access | Make scenario + Concierge wiring |
| IG/FB | Business Suite + page link | DM + posting scenarios |
| TikTok | Business account | Posting/ads drafts |
| Ads | Ad accounts + budget rules | Campaign briefs + read-back |
| Website | (already live) | leads table + router hook |

Nothing here moves money or sends a message without your explicit approval until you choose to
graduate a flow to automatic.
