import fs from 'node:fs';
import process from 'node:process';

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/).map(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    return m ? [m[1], m[2].replace(/^['"]|['"]$/g, '')] : null;
  }).filter(Boolean));
}
const fileEnv = { ...readEnv('.env'), ...readEnv('.env.production') };
const env = { ...fileEnv, ...process.env };
const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const expected = env.EXPECTED_SUPABASE_PROJECT_REF || '';
let actual = '';
try { actual = new URL(url).hostname.split('.')[0]; } catch (_) {}
const headers = { apikey: key, Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN || key}`, Accept: 'application/json' };
const tables = ['bookings', 'clients', 'form_submissions', 'suppliers', 'tasks', 'messages', 'whatsapp_contacts', 'whatsapp_conversations', 'whatsapp_messages'];
const result = { environment: env.NODE_ENV || 'production', actual_supabase_project_ref: actual, expected_supabase_project_ref: expected, match: !!expected && actual === expected, counts: {}, latest_bookings: [], incomplete: {}, errors: [] };
async function request(path, options = {}) {
  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await response.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
  if (!response.ok) throw new Error(`${response.status} ${typeof body === 'string' ? body : body?.message || JSON.stringify(body)}`);
  return { body, range: response.headers.get('content-range') || '' };
}
async function count(table) {
  const { range } = await request(`${table}?select=id&limit=1`, { headers: { Prefer: 'count=exact' } });
  const m = range.match(/\/(\d+)$/); return m ? Number(m[1]) : 0;
}
for (const table of tables) {
  try { result.counts[table] = await count(table); } catch (error) { result.counts[table] = null; result.errors.push(`${table}: ${error.message}`); }
}
try {
  const { body } = await request('bookings?select=id,reference,client_name,email,arrival_date,departure_date,status,paid_amount,balance,updated_at&order=updated_at.desc&limit=10000');
  const allBookings = body || [];
  result.latest_bookings = allBookings.slice(0, 10);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  result.counts.active = allBookings.filter(b => b.status !== 'cancelled' && b.arrival_date && b.departure_date && new Date(b.arrival_date) <= today && today <= new Date(b.departure_date)).length;
  result.counts.confirmed = allBookings.filter(b => ['confirmed', 'deposit_paid', 'fully_paid', 'ongoing', 'completed'].includes(b.status)).length;
  result.counts.unconfirmed = allBookings.filter(b => !['confirmed', 'deposit_paid', 'fully_paid', 'ongoing', 'completed', 'cancelled'].includes(b.status)).length;
} catch (error) { result.errors.push(`bookings: ${error.message}`); }
console.log(JSON.stringify(result, null, 2));
if (!result.match) process.exitCode = 2;
