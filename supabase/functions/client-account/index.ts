import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Public client account helper for the website.
// Creates EMAIL-CONFIRMED accounts via the service role so sign-up works
// instantly (no email-confirmation round-trip), and can confirm legacy
// unconfirmed accounts so they can sign in. Never returns passwords.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function findUser(url: string, hdr: Record<string, string>, email: string) {
  for (let page = 1; page <= 5; page++) {
    const r = await fetch(`${url}/auth/v1/admin/users?per_page=200&page=${page}`, { headers: hdr });
    if (!r.ok) break;
    const j = await r.json();
    const users = j.users || [];
    const found = users.find((u: any) => String(u.email || '').toLowerCase() === email);
    if (found) return found;
    if (users.length < 200) break;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const hdr = { apikey: srk, Authorization: `Bearer ${srk}`, 'Content-Type': 'application/json' };

  let body: any = {};
  try {
    body = await req.json();
  } catch (_e) {}
  const action = String(body.action || 'signup');
  const email = String(body.email || '').trim().toLowerCase();
  const password = body.password ? String(body.password) : '';
  const name = body.name ? String(body.name).slice(0, 120) : null;
  const phone = body.phone ? String(body.phone).slice(0, 60) : null;
  const country = body.country ? String(body.country).slice(0, 80) : null;

  if (!emailRe.test(email)) return json({ ok: false, error: 'invalid email' }, 400);

  try {
    if (action === 'confirm') {
      const u = await findUser(url, hdr, email);
      if (!u) return json({ ok: false, code: 'not_found' });
      if (!u.email_confirmed_at && !u.confirmed_at) {
        await fetch(`${url}/auth/v1/admin/users/${u.id}`, {
          method: 'PUT',
          headers: hdr,
          body: JSON.stringify({ email_confirm: true }),
        });
      }
      return json({ ok: true, confirmed: true });
    }

    if (!password || password.length < 6) {
      return json({ ok: false, error: 'password too short' }, 400);
    }
    const existing = await findUser(url, hdr, email);
    if (existing) return json({ ok: false, code: 'exists' });
    const create = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: hdr,
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name, phone, country } }),
    });
    if (!create.ok) {
      const t = await create.text();
      return json({ ok: false, error: 'create failed', detail: t }, 400);
    }
    const j = await create.json();
    return json({ ok: true, user_id: j.id });
  } catch (e) {
    return json({ ok: false, error: String((e as any)?.message || e) }, 500);
  }
});
