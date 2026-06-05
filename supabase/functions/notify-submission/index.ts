// Edge Function: notify-submission  (v6)
//
// Triggered by an INSERT trigger on public.form_submissions (pg_net.http_post).
// Sends a branded email summary (and optional Slack ping) to the admin inbox.
// The subject line always names what the visitor booked / requested.
//
// Secrets (Supabase → Project Settings → Edge Functions, or app_secrets table):
//   WEBHOOK_SHARED_SECRET — must match X-Webhook-Secret sent by the DB trigger.
//   SLACK_WEBHOOK_URL     — (optional) Slack incoming webhook URL.
//   RESEND_API_KEY        — Resend API key for email (or app_secrets.resend_api_key).
//   ADMIN_EMAIL_TO        — where to send (default f.alaa9@gmail.com).
//   ADMIN_EMAIL_FROM      — sender (default MarrakechStory <onboarding@resend.dev>).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const BRAND = '#e0432a';
const esc = (s: unknown) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c));

// Localized values arrive as {en,no,fr,sv} objects OR plain strings.
function txt(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') return v.en || v.no || v.nb || v.fr || v.sv || (Object.values(v).find((x) => typeof x === 'string') as string) || '';
  return String(v);
}

const CAT: Record<string, string> = { experiences: 'Experience', activities: 'Experience', transport: 'Transport', stays: 'Stay', riads: 'Stay', tours: 'Tour', desert: 'Desert trip', wellness: 'Wellness', food: 'Food & dining', day: 'Day trip', daytrips: 'Day trip' };

// What did this person book / ask for? Works across every form kind.
function bookedTitle(row: any): string {
  const p = row?.payload || {};
  return txt(p?.bookingCtx?.title) || txt(p?.item) || txt(p?.baseTitle) || txt(row?.trip_type);
}

function summary(row: any): string {
  const parts: string[] = [];
  parts.push(`NEW ${String(row?.kind || 'request').toUpperCase()}`);
  const t = bookedTitle(row);
  if (t) parts.push(`— ${t}`);
  if (row?.name) parts.push(`from ${row.name}`);
  if (row?.via) parts.push(`(via ${row.via})`);
  return parts.join(' ');
}

function row2(label: string, value: string) {
  if (!value) return '';
  return `<tr><td style="padding:7px 0;color:#8a7d70;font-size:12px;text-transform:uppercase;letter-spacing:.06em;width:150px;vertical-align:top">${esc(label)}</td><td style="padding:7px 0;color:#1a1310;font-size:14px;font-weight:600">${esc(value)}</td></tr>`;
}

function buildEmail(row: any): { subject: string; html: string } {
  const p = row?.payload || {};
  const trav = p?.travellers || {};
  const pax = (Number(trav.adults) || 0) + (Number(trav.children) || 0) + (Number(trav.infants) || 0);
  const isCatalog = String(row?.kind) === 'quickbook' || !!p?.item;
  const isTweak = String(row?.kind) === 'tweak';
  const tripTitle = bookedTitle(row);
  const itemName = txt(p?.item);
  const category = p?.tab ? (CAT[String(p.tab)] || String(p.tab)) : '';
  const baseTitle = txt(p?.baseTitle);
  const transport = p?.needTransport ? ('Yes' + (p?.pickupAddr ? ' · pickup: ' + txt(p.pickupAddr) : '')) : '';
  const flight = [p?.arriveCity ? `In: ${txt(p.arriveCity)}` : '', p?.departCity ? `Out: ${txt(p.departCity)}` : '', p?.flightBooked ? `Booked: ${txt(p.flightBooked)}` : ''].filter(Boolean).join(' · ');

  const itin = Array.isArray(p?.daily_itinerary) ? p.daily_itinerary : [];
  const days = itin.map((d: any, i: number) => {
    const acts = (d?.activities || []).map((a: any) => `${a.time ? esc(a.time) + ' · ' : ''}${esc(txt(a.type))}${a.details ? ' — ' + esc(txt(a.details)) : ''}`).join('<br>');
    const dateSpan = d?.date ? ` <span style="color:#8a7d70;font-weight:400;font-size:12px">· ${esc(d.date)}</span>` : '';
    const actsBlock = acts ? `<div style="color:#5b4f44;font-size:13px;line-height:1.5;margin-top:3px">${acts}</div>` : '';
    return `<tr><td style="vertical-align:top;padding:10px 14px 10px 0;width:46px"><div style="width:32px;height:32px;border-radius:50%;background:${BRAND};color:#fff;text-align:center;line-height:32px;font-weight:700">${d?.day || i + 1}</div></td><td style="vertical-align:top;padding:10px 0;border-bottom:1px solid #eee"><div style="font-weight:700;color:#1a1310;font-size:14px">${esc(txt(d?.city) || ('Day ' + (d?.day || i + 1)))}${dateSpan}</div>${actsBlock}</td></tr>`;
  }).join('');

  const kindLabel = isCatalog ? 'New reservation' : (isTweak ? 'Custom trip request' : 'New booking request');
  const subject = `${kindLabel}${tripTitle ? ': ' + tripTitle : ''} — ${row?.name || 'guest'}`;

  const catSpan = category ? ` <span style="opacity:.7;font-weight:500">· ${esc(category)}</span>` : '';
  const titlePill = tripTitle ? `<div style="background:#fbe7e1;color:#c23a23;display:inline-block;padding:6px 14px;border-radius:999px;font-weight:700;font-size:13px;margin-bottom:18px">${esc(tripTitle)}${catSpan}</div>` : '';
  const chooseBanner = p?.chooseForMe ? `<div style="background:#fff4e5;color:#9a6400;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:600;margin-bottom:18px">⭐ Choose for me — client wants MarrakechStory to craft the trip.</div>` : '';
  const itinBlock = days ? `<h2 style="font-size:16px;margin:0 0 10px;color:${BRAND};text-transform:uppercase;letter-spacing:.06em">Itinerary</h2><table style="width:100%;border-collapse:collapse">${days}</table>` : '';

  const html = `
  <div style="background:#f4f1ec;padding:28px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.06)">
      <div style="background:${BRAND};padding:24px 30px;color:#fff"><div style="font-size:22px;font-weight:800;letter-spacing:-.02em">MarrakechStory</div><div style="opacity:.85;font-size:13px;margin-top:2px">${kindLabel}</div></div>
      <div style="padding:28px 30px">
        ${titlePill}
        ${chooseBanner}
        <h2 style="font-size:16px;margin:0 0 6px;color:${BRAND};text-transform:uppercase;letter-spacing:.06em">Contact</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:22px">${row2('Name', row?.name)}${row2('Email', row?.email)}${row2('Phone', row?.phone)}${row2('Country', row?.country)}</table>
        <h2 style="font-size:16px;margin:0 0 6px;color:${BRAND};text-transform:uppercase;letter-spacing:.06em">${isCatalog ? 'Reservation' : 'Trip & flights'}</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:22px">${row2('Item', itemName)}${row2('Category', category)}${row2('Based on', baseTitle)}${row2('People', p?.people ? String(p.people) : '')}${row2('Dates', [row?.start_date, row?.end_date].filter(Boolean).join(' → '))}${row2('Duration', row?.duration ? row.duration + ' days' : '')}${row2('Travellers', pax ? (pax + ' (' + (trav.adults || 0) + ' ad, ' + (trav.children || 0) + ' ch, ' + (trav.infants || 0) + ' inf)') : '')}${row2('Transport', transport)}${row2('Flights', flight)}${row2('Flight details', txt(p?.flightDetails))}${row2('Occasion', txt(p?.occasion))}${row2('Notes', txt(p?.notes))}${row2('Avoid', txt(p?.avoid))}</table>
        ${itinBlock}
      </div>
      <div style="padding:18px 30px;background:#faf7f2;color:#8a7d70;font-size:12px;text-align:center">Sent automatically from the MarrakechStory website</div>
    </div>
  </div>`;
  return { subject, html };
}

let _secrets: Record<string, string> | null = null;
async function loadSecrets(): Promise<Record<string, string>> {
  if (_secrets) return _secrets;
  _secrets = {};
  try {
    const url = Deno.env.get('SUPABASE_URL'); const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (url && srk) {
      const r = await fetch(`${url}/rest/v1/app_secrets?select=key,value`, { headers: { apikey: srk, Authorization: `Bearer ${srk}` } });
      const j = await r.json();
      if (Array.isArray(j)) for (const row of j) _secrets[row.key] = row.value;
    }
  } catch (_e) { /* ignore */ }
  return _secrets;
}

async function postSlack(text: string) {
  const url = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!url) return { skipped: 'no SLACK_WEBHOOK_URL' };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
  return { status: r.status };
}

async function sendEmail(subject: string, html: string) {
  const s = await loadSecrets();
  const key = Deno.env.get('RESEND_API_KEY') || s.resend_api_key;
  const to = Deno.env.get('ADMIN_EMAIL_TO') || s.admin_email_to || 'f.alaa9@gmail.com';
  const from = Deno.env.get('ADMIN_EMAIL_FROM') || s.admin_email_from || 'MarrakechStory <onboarding@resend.dev>';
  if (!key) return { skipped: 'no resend key' };
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to, subject, html }) });
  let detail: any = null; try { detail = await r.json(); } catch (_e) { /* ignore */ }
  return { status: r.status, to, detail };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const sharedSecret = Deno.env.get('WEBHOOK_SHARED_SECRET');
  if (sharedSecret) { const got = req.headers.get('x-webhook-secret') || ''; if (got !== sharedSecret) return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } }); }
  let body: any = null;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const row = body?.record || body;
  const text = summary(row);
  const { subject, html } = buildEmail(row);
  const [slack, email] = await Promise.allSettled([postSlack(text), sendEmail(subject, html)]);
  return new Response(JSON.stringify({ ok: true, summary: text, subject, slack: slack.status === 'fulfilled' ? slack.value : { error: String(slack.reason) }, email: email.status === 'fulfilled' ? email.value : { error: String(email.reason) } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
