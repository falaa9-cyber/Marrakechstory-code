import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const ADMIN_EMAIL = 'f.alaa9@gmail.com';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

function callerEmail(req: Request): string {
  try {
    const auth = req.headers.get('Authorization') || '';
    const tok = auth.replace(/^Bearer\s+/i, '');
    const payload = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return String(payload.email || '').toLowerCase();
  } catch (_e) {
    return '';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  if (callerEmail(req) !== ADMIN_EMAIL) return json({ ok: false, error: 'forbidden — admin only' }, 403);

  const url = Deno.env.get('SUPABASE_URL')!;
  const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminHdr = { apikey: srk, Authorization: `Bearer ${srk}`, 'Content-Type': 'application/json' };

  let body: any = {};
  try {
    body = await req.json();
  } catch (_e) {}
  const action = String(body.action || 'set');
  const email = String(body.email || '').trim().toLowerCase();
  const name = body.name ? String(body.name) : null;
  const password = body.password ? String(body.password) : '';

  async function patchSettings(patch: Record<string, unknown>) {
    await fetch(`${url}/rest/v1/admin_settings?id=eq.1`, {
      method: 'PATCH',
      headers: { ...adminHdr, Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
  }

  if (action === 'block') {
    await patchSettings({ partner_blocked: true });
    return json({ ok: true, blocked: true });
  }
  if (action === 'unblock') {
    await patchSettings({ partner_blocked: false });
    return json({ ok: true, blocked: false });
  }
  if (action === 'revoke') {
    await patchSettings({ partner_email: null, partner_name: null, partner_blocked: false });
    return json({ ok: true, revoked: true });
  }

  if (!email || !password || password.length < 8) {
    return json({ ok: false, error: 'email and password (min 8 chars) required' }, 400);
  }

  const create = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHdr,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name, role: 'partner' } }),
  });
  let createdId: string | null = null;
  if (create.ok) {
    const j = await create.json();
    createdId = j.id;
  } else {
    const list = await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers: adminHdr });
    const lj = await list.json();
    const found = (lj.users || []).find((u: any) => String(u.email || '').toLowerCase() === email);
    if (!found) {
      const txt = await create.text();
      return json({ ok: false, error: 'could not create or find user', detail: txt }, 400);
    }
    await fetch(`${url}/auth/v1/admin/users/${found.id}`, {
      method: 'PUT',
      headers: adminHdr,
      body: JSON.stringify({ password, email_confirm: true, user_metadata: { name, role: 'partner' } }),
    });
    createdId = found.id;
  }

  await patchSettings({ partner_email: email, partner_name: name, partner_blocked: false });
  return json({ ok: true, partner_email: email, user_id: createdId });
});
