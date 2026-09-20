# MarrakechStory data audit — 2026-09-20

## Verified canonical project

- Project: `falaa9-cyber's Project`
- Ref: `xcpkujguvrhpsmftgxtn`
- Region: `eu-west-1`
- Status: `ACTIVE_HEALTHY`
- Production URL in `.env.production`, `src/env.js`, and Vite output: `https://xcpkujguvrhpsmftgxtn.supabase.co`

Supabase project inventory returned exactly one accessible project. Repository history and all tracked environment/configuration files contain this same ref; no second MarrakechStory Supabase URL, API route, or legacy project was found.

## Pre-change backup

Before application changes, an additive snapshot was created in the canonical database under schema `ms_backup_20260920`. It includes bookings, clients, form submissions, suppliers, tasks, messages, WhatsApp contacts/conversations/messages/send audit, automation log, admin settings, staff presence, and admin audit. No production rows were deleted or overwritten.

## Canonical database snapshot

Counts returned by the Supabase management connection:

- Bookings: 22
- Clients: 19
- Form submissions / requests: 10
- Suppliers: 21
- Tasks: 23
- Messages: 2
- WhatsApp contacts: 3
- WhatsApp conversations: 2
- WhatsApp messages: 2

Booking statuses: 1 cancelled, 6 completed, 1 confirmed, 3 deposit paid, 1 draft, 2 fully paid, 8 new.

Duplicate checks on booking reference, email, and phone returned no duplicate groups. No legacy project was accessible to reconcile; therefore no invented or speculative records were imported.

## Incomplete records requiring review

- Missing itinerary: 9
- Missing accommodation: 19
- Missing driver/transport: 21
- Unpaid balances: 10
- Deposits pending: 5

These are warnings only. The admin health panel now exposes them live from the canonical dataset.

The WhatsApp public tables had RLS enabled without authenticated admin policies. That access gap is now fixed with admin-only policies; the private `whatsapp_internal` schema remains service-role only.
