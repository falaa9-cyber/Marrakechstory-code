import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const DEFAULT_ADMIN_EMAIL = 'f.alaa@live.com';
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

function mergeAppMeta(existing: any, role: string) {
  return { ...(existing || {}), role };
}

async function patchSettings(url: string, adminHdr: HeadersInit, patch: Record<string, unknown>) {
  return await fetch(`${url}/rest/v1/admin_settings?id=eq.1`, {
    method: 'PATCH',
    headers: { ...adminHdr, Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
}

async function allowedAdminEmails(url: string, srk: string): Promise<Set<string>> {
  const adminHdr = { apikey: srk, Authorization: `Bearer ${srk}` };
  const out = new Set<string>([DEFAULT_ADMIN_EMAIL]);
  try {
    const r = await fetch(`${url}/rest/v1/admin_settings?id=eq.1&select=admin_email`, { headers: adminHdr });
    if (r.ok) {
      const rows = await r.json();
      const adminEmail = String(rows?.[0]?.admin_email || '').trim().toLowerCase();
      if (adminEmail) out.add(adminEmail);
    }
  } catch (_e) {}
  return out;
}

async function listUsers(url: string, adminHdr: HeadersInit): Promise<any[]> {
  const users: any[] = [];
  let page = 1;
  while (page <= 5) {
    const r = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: adminHdr });
    if (!r.ok) break;
    const j = await r.json();
    const batch = Array.isArray(j.users) ? j.users : [];
    users.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }
  return users;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  const caller = callerEmail(req);
  if (!caller) return json({ ok: false, error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminHdr = { apikey: srk, Authorization: `Bearer ${srk}`, 'Content-Type': 'application/json' };
  if (!(await allowedAdminEmails(url, srk)).has(caller)) return json({ ok: false, error: 'forbidden — admin only' }, 403);

  let body: any = {};
  try {
    body = await req.json();
  } catch (_e) {}

  const action = String(body.action || 'set');
  const nextEmail = String(body.email || '').trim().toLowerCase();
  const nextPassword = String(body.password || '');

  if (action !== 'set') return json({ ok: false, error: 'unsupported action' }, 400);
  if (!nextEmail || !nextPassword || nextPassword.length < 8) {
    return json({ ok: false, error: 'email and password (min 8 chars) required' }, 400);
  }

  const users = await listUsers(url, adminHdr);
  const allowed = await allowedAdminEmails(url, srk);
  const currentAdminUser = users.find((u) => allowed.has(String(u?.email || '').trim().toLowerCase())) || null;
  const targetUser = users.find((u) => String(u?.email || '').trim().toLowerCase() === nextEmail) || null;

  const sourceUser = targetUser || currentAdminUser || null;
  const payload = {
    email: nextEmail,
    password: nextPassword,
    email_confirm: true,
    app_metadata: mergeAppMeta(sourceUser && sourceUser.app_metadata, 'admin'),
    user_metadata: { ...(sourceUser && sourceUser.user_metadata || {}), name: 'Admin', role: 'admin' },
  };

  if (targetUser) {
    const r = await fetch(`${url}/auth/v1/admin/users/${targetUser.id}`, {
      method: 'PUT',
      headers: adminHdr,
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      return json({ ok: false, error: 'could not update target admin user', detail: await r.text() }, 400);
    }
  } else if (currentAdminUser) {
    const r = await fetch(`${url}/auth/v1/admin/users/${currentAdminUser.id}`, {
      method: 'PUT',
      headers: adminHdr,
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      return json({ ok: false, error: 'could not update current admin user', detail: await r.text() }, 400);
    }
  } else {
    const create = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: adminHdr,
      body: JSON.stringify(payload),
    });
    if (!create.ok) {
      return json({ ok: false, error: 'could not create admin user', detail: await create.text() }, 400);
    }
  }

  const settingsRes = await patchSettings(url, adminHdr, { admin_email: nextEmail, updated_at: new Date().toISOString() });
  if (!settingsRes.ok) {
    return json({ ok: false, error: 'admin user updated but settings could not be synced', detail: await settingsRes.text() }, 400);
  }

  return json({ ok: true, admin_email: nextEmail });
});
