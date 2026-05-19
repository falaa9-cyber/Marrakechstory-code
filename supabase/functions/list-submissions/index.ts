// Edge Function: list-submissions
//
// Lets the internal /admin.html page list rows from public.form_submissions.
// The admin page POSTs JSON { password, limit?, kind? } and gets back the
// rows. Service-role key stays on the server side; never sent to the browser.
//
// Required secrets (set in Supabase → Project Settings → Edge Functions):
//   ADMIN_PASSWORD            — shared with the admin page; rotate freely.
//   SB_SERVICE_ROLE_KEY       — Supabase service role key (set manually).
//                               Falls back to the platform-provided
//                               SUPABASE_SERVICE_ROLE_KEY if available.
//   PROJECT_URL (optional)    — falls back to SUPABASE_URL.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405, headers: CORS });

  let body: any = null;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400, headers: CORS }); }

  const expectedPw = Deno.env.get('ADMIN_PASSWORD');
  if (!expectedPw) {
    return new Response(JSON.stringify({ ok: false, error: 'ADMIN_PASSWORD not configured on the server' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  if (!body?.password || body.password !== expectedPw) {
    return new Response(JSON.stringify({ ok: false, error: 'forbidden' }),
      { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  const url  = Deno.env.get('PROJECT_URL')  || Deno.env.get('SUPABASE_URL');
  const sKey = Deno.env.get('SB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !sKey) {
    return new Response(JSON.stringify({ ok: false, error: 'server misconfigured (no service key / url)' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  const limit = Math.min(Math.max(Number(body?.limit) || 50, 1), 500);
  const kind  = body?.kind ? String(body.kind) : null;

  const supabase = createClient(url, sKey, { auth: { persistSession: false } });
  let q = supabase.from('form_submissions').select('*').order('created_at', { ascending: false }).limit(limit);
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ ok: true, count: data?.length || 0, rows: data || [] }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
});
