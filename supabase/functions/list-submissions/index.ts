import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': 'https://marrakechstory.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

const DEFAULT_ADMIN_EMAIL = 'f.alaa@live.com';

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  if (
    origin === 'https://marrakechstory.com'
    || origin === 'https://www.marrakechstory.com'
    || origin === 'http://127.0.0.1:4173'
    || origin === 'http://localhost:3000'
  ) {
    return { ...CORS, 'Access-Control-Allow-Origin': origin };
  }
  return CORS;
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400, headers });
  }

  const url = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL');
  const sKey = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !sKey) {
    return new Response(JSON.stringify({ ok: false, error: 'server misconfigured (no service key / url)' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), {
      status: 403,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(url, sKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user?.email) {
    return new Response(JSON.stringify({ ok: false, error: 'server misconfigured (no service key / url)' }), {
      status: 403,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const email = String(authData.user.email || '').trim().toLowerCase();
  const role = String(authData.user.app_metadata?.role || '').trim().toLowerCase();
  const { data: settings } = await admin
    .from('admin_settings')
    .select('admin_email, partner_email, partner_blocked')
    .eq('id', 1)
    .maybeSingle();
  const adminEmail = String(settings?.admin_email || '').trim().toLowerCase();
  const partnerEmail = String(settings?.partner_email || '').trim().toLowerCase();
  const partnerBlocked = !!settings?.partner_blocked;
  const isAdmin = role === 'admin' || email === DEFAULT_ADMIN_EMAIL || (adminEmail && email === adminEmail);
  const isPartner = !partnerBlocked && (role === 'partner' || (partnerEmail && email === partnerEmail));
  if (!isAdmin && !isPartner) {
    return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), {
      status: 403,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const limit = Math.min(Math.max(Number(body?.limit) || 50, 1), 500);
  const kind = body?.kind ? String(body.kind) : null;

  let q = admin.from('form_submissions').select('*').order('created_at', { ascending: false }).limit(limit);
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: true, count: data?.length || 0, rows: data || [] }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
});
