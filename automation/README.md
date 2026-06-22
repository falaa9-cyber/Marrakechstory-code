# 🤖 Marrakech Story — Automation System

A team of connected agents that handle inquiries, content, ads, and follow-up across
WhatsApp, Instagram, Facebook, TikTok, and the website — all in your brand voice,
all sharing one memory.

## The team
| Agent | Job | File |
|---|---|---|
| 🗣️ Concierge | First reply to every inbound message (WhatsApp/IG/FB), in the customer's language | [agents/concierge.md](agents/concierge.md) |
| 📅 Trip Planner | Turns an inquiry into a full itinerary + quote | [agents/trip-planner.md](agents/trip-planner.md) |
| 📸 Content Studio | Calendar, captions, Canva visuals for IG/TikTok/FB | [agents/content-studio.md](agents/content-studio.md) |
| 📊 Ads Manager | Drafts + analyses Facebook/TikTok ads | [agents/ads-manager.md](agents/ads-manager.md) |
| 🔁 Lead Router | One home for every lead; nothing dropped, follow-ups scheduled | [agents/lead-router.md](agents/lead-router.md) |

## How they connect
**Supabase is the shared memory.** Every lead, message, and status lives there, so each agent
sees what the others did. **Make.com is the wiring** that carries messages between the real
apps (WhatsApp, Instagram, etc.) and the agents.

```
 WhatsApp ─┐
 Instagram ─┤                         ┌─► Trip Planner ─┐
 Facebook ─┼─► Concierge ─► Lead Router┤                 ├─► (reply drafted → you approve → sent)
 TikTok ───┤        ▲      (Supabase)  └─► Content Studio │
 Website ──┘        └──────────────────────────────────────┘
                              Ads Manager feeds leads in ◄── Meta/TikTok Ads
```

## Shared truth
- [brand-context.md](brand-context.md) — voice, prices, channels, rules. Every agent reads this.
- Deep references live in the `marrakechstory-agent` skill (itineraries, services, social, marketing).

## Setup (the plumbing)
[setup/setup-guide.md](setup/setup-guide.md) — phased: WhatsApp → IG/FB → TikTok → Ads → Website.
Each phase lists exactly what you provide and what gets built.

## Safety
- No agent confirms a booking or takes payment.
- No message is sent and no ad budget changes without your approval, until you choose to graduate
  a specific routine flow to automatic.

## Using the team today (before the plumbing is live)
You can already use every agent manually in Claude. Examples:
- "Concierge: a Norwegian couple asked about a 5-day honeymoon in October — draft a reply."
- "Trip Planner: build a 4-day family itinerary, 2 adults + 1 kid, loves the desert."
- "Content Studio: plan next week's Instagram + 3 captions about Agafay."
- "Ads Manager: draft a Meta lead campaign targeting Norway honeymooners, €300 budget."
- "Lead Router: here are 6 inquiries — who do I call first and what do I say?"
