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
