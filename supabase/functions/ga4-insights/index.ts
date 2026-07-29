import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const DEFAULT_ADMIN_EMAIL = 'f.alaa@live.com';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

function callerClaims(req: Request): { email: string; role: string } {
  try {
    const auth = req.headers.get('Authorization') || '';
    const tok = auth.replace(/^Bearer\s+/i, '');
    const payload = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return {
      email: String(payload.email || '').toLowerCase(),
      role: String(payload?.app_metadata?.role || '').trim().toLowerCase(),
    };
  } catch (_e) {
    return { email: '', role: '' };
  }
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

function parseSA(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch (_e) {}
  try {
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw.replace(/\s+/g, '')), (c) => c.charCodeAt(0))));
  } catch (_e) {}
  return null;
}

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlStr(str: string): string {
  return b64url(new TextEncoder().encode(str));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/, '').replace(/-----END [^-]+-----/, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64urlStr(JSON.stringify(header))}.${b64urlStr(JSON.stringify(claim))}`;
  const keyData = pemToArrayBuffer(String(sa.private_key).replace(/\\n/g, '\n'));
  const key = await crypto.subtle.importKey('pkcs8', keyData, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64url(sig)}`;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('token error: ' + JSON.stringify(j));
  return j.access_token;
}

async function ga(token: string, propertyId: string, method: string, body: any) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await r.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  const { email, role } = callerClaims(req);
  if (!email) return json({ ok: false, error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const isAdmin = role === 'admin' || (await allowedAdminEmails(url, srk)).has(email);
  if (!isAdmin) return json({ ok: false, error: 'forbidden — admin only' }, 403);
  const adminHdr = { apikey: srk, Authorization: `Bearer ${srk}`, 'Content-Type': 'application/json' };

  let body: any = {};
  try {
    body = await req.json();
  } catch (_e) {}

  if (body.action === 'save') {
    if (!isAdmin) return json({ ok: false, error: 'forbidden — admin only' }, 403);
    const sa = parseSA(String(body.serviceAccount || '').trim());
    const pid = String(body.propertyId || '').trim().replace(/[^0-9]/g, '');
    if (!sa || !sa.client_email || !sa.private_key) {
      return json({ ok: false, error: 'Service account JSON missing client_email / private_key.' });
    }
    if (!pid) return json({ ok: false, error: 'Property ID must be numeric.' });
    const up = async (k: string, v: string) =>
      fetch(`${url}/rest/v1/app_secrets?on_conflict=key`, {
        method: 'POST',
        headers: { ...adminHdr, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ key: k, value: v, updated_at: new Date().toISOString() }),
      });
    await up('ga4_service_account', JSON.stringify(sa));
    await up('ga4_property_id', pid);
    return json({ ok: true, saved: true, client_email: sa.client_email, propertyId: pid });
  }

  const sres = await fetch(`${url}/rest/v1/app_secrets?key=in.(ga4_service_account,ga4_property_id)&select=key,value`, {
    headers: adminHdr,
  });
  const srows = await sres.json();
  const cfg: Record<string, string> = {};
  (Array.isArray(srows) ? srows : []).forEach((r: any) => {
    cfg[r.key] = r.value;
  });
  const propertyId = (cfg.ga4_property_id || '').trim();
  if (!cfg.ga4_service_account || !propertyId) return json({ ok: true, configured: false });

  const sa = parseSA(cfg.ga4_service_account);
  if (!sa || !sa.private_key) return json({ ok: false, configured: true, error: 'bad service account JSON' });

  const period = String(body.period || '7d');
  const startDate = period === '24h' ? 'today' : period === '30d' ? '30daysAgo' : period === '90d' ? '90daysAgo' : '7daysAgo';

  try {
    const token = await getAccessToken(sa);
    const dr = [{ startDate, endDate: 'today' }];
    const rep = (dims: string[], mets: string[], limit = 8, orderMetric?: string) =>
      ga(token, propertyId, 'runReport', {
        dateRanges: dr,
        dimensions: dims.map((n) => ({ name: n })),
        metrics: mets.map((n) => ({ name: n })),
        limit,
        orderBys: orderMetric
          ? [{ metric: { metricName: orderMetric }, desc: true }]
          : dims[0] === 'date'
            ? [{ dimension: { dimensionName: 'date' } }]
            : undefined,
      });
    const [realtime, rtPages, summary, trend, pages, landing, channels, srcMed, countries, cities, devices, events, langs] =
      await Promise.all([
        ga(token, propertyId, 'runRealtimeReport', { metrics: [{ name: 'activeUsers' }] }),
        ga(token, propertyId, 'runRealtimeReport', {
          dimensions: [{ name: 'unifiedScreenName' }],
          metrics: [{ name: 'activeUsers' }],
          limit: 6,
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        }),
        ga(token, propertyId, 'runReport', {
          dateRanges: dr,
          metrics: ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'screenPageViews', 'averageSessionDuration', 'engagementRate', 'userEngagementDuration', 'eventCount'].map((n) => ({ name: n })),
        }),
        rep(['date'], ['activeUsers'], 92),
        rep(['pagePath'], ['screenPageViews'], 8, 'screenPageViews'),
        rep(['landingPage'], ['sessions'], 8, 'sessions'),
        rep(['sessionDefaultChannelGroup'], ['sessions'], 8, 'sessions'),
        rep(['sessionSourceMedium'], ['sessions'], 8, 'sessions'),
        rep(['country'], ['activeUsers'], 8, 'activeUsers'),
        rep(['city'], ['activeUsers'], 8, 'activeUsers'),
        rep(['deviceCategory'], ['activeUsers'], 5, 'activeUsers'),
        rep(['eventName'], ['eventCount'], 8, 'eventCount'),
        rep(['language'], ['activeUsers'], 6, 'activeUsers'),
      ]);
    const apiErr = summary?.error || realtime?.error;
    if (apiErr) return json({ ok: false, configured: true, error: apiErr.message || JSON.stringify(apiErr) });
    const num = (rep2: any, mi = 0) => Number(rep2?.rows?.[0]?.metricValues?.[mi]?.value || 0);
    const rowsOf = (rep2: any) => (rep2?.rows || []).map((r: any) => ({ key: r.dimensionValues?.[0]?.value || '', value: Number(r.metricValues?.[0]?.value || 0) }));
    return json({
      ok: true,
      configured: true,
      period,
      active: num(realtime),
      realtimePages: rowsOf(rtPages),
      summary: {
        users: num(summary, 0),
        newUsers: num(summary, 1),
        sessions: num(summary, 2),
        engagedSessions: num(summary, 3),
        pageviews: num(summary, 4),
        avgDuration: num(summary, 5),
        engagementRate: num(summary, 6),
        engagementTime: num(summary, 7),
        events: num(summary, 8),
      },
      trend: rowsOf(trend),
      pages: rowsOf(pages),
      landing: rowsOf(landing),
      channels: rowsOf(channels),
      sourceMedium: rowsOf(srcMed),
      countries: rowsOf(countries),
      cities: rowsOf(cities),
      devices: rowsOf(devices),
      topEvents: rowsOf(events),
      languages: rowsOf(langs),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return json({ ok: false, configured: true, error: String((e as any)?.message || e) });
  }
});
