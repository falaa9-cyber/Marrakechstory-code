// Edge Function: notify-submission
//
// Triggered by an INSERT trigger on public.form_submissions (pg_net.http_post).
// Forwards a short human-readable summary to Slack and/or an email inbox.
//
// Required secrets (set in Supabase → Project Settings → Edge Functions):
//   WEBHOOK_SHARED_SECRET — random string; must match the X-Webhook-Secret
//                          header sent by the database trigger.
//   SLACK_WEBHOOK_URL     — (optional) Slack incoming webhook URL.
//   RESEND_API_KEY        — (optional) Resend API key for email.
//   ADMIN_EMAIL_TO        — (optional) where to send the email summary.
//   ADMIN_EMAIL_FROM      — (optional, default: noreply@marrakechstory.com).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

function summary(row: any): string {
  const parts: string[] = [];
  parts.push(`NEW ${String(row?.kind || 'submission').toUpperCase()}`);
  if (row?.name) parts.push(`from ${row.name}`);
  if (row?.email) parts.push(`<${row.email}>`);
  if (row?.phone) parts.push(`(${row.phone})`);
  const dates: string[] = [];
  if (row?.start_date) dates.push(String(row.start_date));
  if (row?.end_date) dates.push(String(row.end_date));
  if (dates.length) parts.push(`· ${dates.join(' → ')}`);
  if (row?.duration) parts.push(`· ${row.duration} days`);
  if (row?.trip_type) parts.push(`· ${row.trip_type}`);
  if (row?.via) parts.push(`· via ${row.via}`);
  return parts.join(' ');
}

async function postSlack(text: string, payload: any) {
  const url = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!url) return { skipped: 'no SLACK_WEBHOOK_URL' };
  const blocks = [
    { type: 'section', text: { type: 'mrkdwn', text: `*${text}*` } },
    { type: 'context', elements: [{ type: 'mrkdwn', text: '```' + JSON.stringify(payload, null, 2).slice(0, 2500) + '```' }] }
  ];
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, blocks })
  });
  return { status: r.status };
}

async function sendEmail(subject: string, html: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  const to  = Deno.env.get('ADMIN_EMAIL_TO');
  const from = Deno.env.get('ADMIN_EMAIL_FROM') || 'Marrakech Story <noreply@marrakechstory.com>';
  if (!key || !to) return { skipped: 'no RESEND_API_KEY / ADMIN_EMAIL_TO' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html })
  });
  return { status: r.status };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const sharedSecret = Deno.env.get('WEBHOOK_SHARED_SECRET');
  if (sharedSecret) {
    const got = req.headers.get('x-webhook-secret') || '';
    if (got !== sharedSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  }

  let body: any = null;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const row = body?.record || body;
  const text = summary(row);
  const fullPayload = row?.payload ?? row;

  const [slack, email] = await Promise.allSettled([
    postSlack(text, fullPayload),
    sendEmail(text, `<h2 style="font-family:system-ui">${text}</h2><pre style="font-family:ui-monospace,monospace;font-size:12px;background:#f5f5f0;padding:12px;border-radius:0;border:1px solid #e8e3d6">${JSON.stringify(fullPayload, null, 2).replace(/</g,'&lt;')}</pre>`)
  ]);
  return new Response(JSON.stringify({
    ok: true,
    summary: text,
    slack: slack.status === 'fulfilled' ? slack.value : { error: String(slack.reason) },
    email: email.status === 'fulfilled' ? email.value : { error: String(email.reason) },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
