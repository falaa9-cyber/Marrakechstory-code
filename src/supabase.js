// Supabase client bootstrap for the static site.
// Loads the UMD bundle from a <script> tag in index.html (window.supabase),
// then exposes the typed client as window.MS_SB plus a couple of helpers
// the rest of the app can call without knowing anything about Supabase.

(function () {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('[MS_SB] @supabase/supabase-js UMD not loaded yet');
    return;
  }
  if (!window.MS_ENV || !window.MS_ENV.SUPABASE_URL) {
    console.warn('[MS_SB] MS_ENV is missing; check src/env.js');
    return;
  }

  window.MS_SB = window.supabase.createClient(
    window.MS_ENV.SUPABASE_URL,
    window.MS_ENV.SUPABASE_KEY,
    { auth: { persistSession: false } }
  );

  // Save (or upsert by email) a row into public.subscribers.
  // Used by the auth modal: when a guest fills in name + email we store
  // the contact so they can be remembered for future bookings + campaigns.
  // Never throws — callers can fire-and-forget.
  window.MS_saveSubscriber = async function (data, opts) {
    opts = opts || {};
    try {
      if (!data || !data.email) return { ok: false, error: 'no email' };
      const row = {
        email: String(data.email).trim().toLowerCase().slice(0, 200),
        name: data.name ? String(data.name).slice(0, 160) : null,
        phone: data.phone ? String(data.phone).slice(0, 80) : null,
        country: data.country ? String(data.country).slice(0, 80) : null,
        source: opts.source || 'login',
        marketing_opt_in: data.marketingOptIn !== false,
        last_seen_at: new Date().toISOString(),
        user_agent: navigator.userAgent ? navigator.userAgent.slice(0, 400) : null,
        payload: data.payload || {}
      };
      // Try INSERT first; if the email already exists (Postgres 23505),
      // fall back to an UPDATE keyed by email. Both INSERT and UPDATE
      // are anon-allowed; we avoid .upsert() because its implicit
      // return-representation SELECT is denied by RLS.
      const ins = await window.MS_SB.from('subscribers').insert(row);
      if (ins.error && (ins.error.code === '23505' || /duplicate key/i.test(ins.error.message || ''))) {
        const { id: _id, created_at: _ca, visit_count: _vc, ...patch } = row;
        const { error: upErr } = await window.MS_SB
          .from('subscribers')
          .update(patch)
          .eq('email', row.email);
        if (upErr) {
          console.warn('[MS_SB] subscribers update failed', upErr.message);
          return { ok: false, error: upErr.message };
        }
        return { ok: true, updated: true };
      }
      if (ins.error) {
        console.warn('[MS_SB] subscribers insert failed', ins.error.message);
        return { ok: false, error: ins.error.message };
      }
      return { ok: true };
    } catch (e) {
      console.warn('[MS_SB] saveSubscriber unexpected', e && e.message);
      return { ok: false, error: String(e && e.message || e) };
    }
  };

  // Insert one row into form_submissions. Never throws — callers can
  // fire-and-forget without breaking the existing mailto/WhatsApp path.
  window.MS_submitForm = async function (kind, data, opts) {
    opts = opts || {};
    try {
      const row = {
        kind: kind || 'itinerary',
        name: data && data.name ? String(data.name).slice(0, 160) : null,
        email: data && data.email ? String(data.email).slice(0, 160) : null,
        phone: data && data.phone ? String(data.phone).slice(0, 80) : null,
        country: data && data.country ? String(data.country).slice(0, 80) : null,
        start_date: data && data.startDate ? data.startDate : null,
        end_date: data && data.endDate ? data.endDate : null,
        duration: data && Number.isFinite(data.duration) ? data.duration : null,
        trip_type: data && data.tripType ? data.tripType : null,
        via: opts.via || null,
        user_agent: navigator.userAgent ? navigator.userAgent.slice(0, 400) : null,
        source_url: window.location.href.slice(0, 400),
        payload: data || {}
      };
      // No .select() chain — anon role can INSERT but not SELECT (RLS),
      // and PostgREST's default return=representation triggers a blocked
      // read that surfaces as a misleading "RLS violation" on the client.
      const { error } = await window.MS_SB
        .from('form_submissions')
        .insert(row);
      if (error) {
        console.warn('[MS_SB] insert failed', error.message);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (e) {
      console.warn('[MS_SB] unexpected', e && e.message);
      return { ok: false, error: String(e && e.message || e) };
    }
  };
})();
