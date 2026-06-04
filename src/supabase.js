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
    { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ms-site-auth' } }
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
      const { error } = await window.MS_SB
        .from('subscribers')
        .upsert(row, { onConflict: 'email', ignoreDuplicates: false });
      if (error) {
        console.warn('[MS_SB] subscribers upsert failed', error.message);
        return { ok: false, error: error.message };
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

  // ============================================================
  // Lightweight website analytics — one row per visit, enriched with
  // device, country, referrer, time-on-site and sections viewed.
  // Privacy-friendly: no cookies, session id in sessionStorage only.
  // ============================================================
  (function analytics() {
    try {
      if (!window.MS_SB) return;
      // Don't track the admin console itself.
      if ((location.hash || '').replace('#', '').split('?')[0] === 'admin') return;
      var SB = window.MS_SB;
      var sid = sessionStorage.getItem('ms_sid');
      if (!sid) { sid = (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)); sessionStorage.setItem('ms_sid', sid); }
      // Only one DB row per browser session.
      var rowId = sessionStorage.getItem('ms_pv_id') || null;
      var ua = navigator.userAgent || '';
      var device = /Mobi|Android|iPhone|iPod/i.test(ua) ? 'mobile' : (/iPad|Tablet/i.test(ua) ? 'tablet' : 'desktop');
      var lang = (navigator.language || '').slice(0, 5);
      var ref = document.referrer ? (function () { try { return new URL(document.referrer).hostname; } catch (e) { return document.referrer; } })() : 'direct';
      var started = Date.now();
      var sections = {};
      var SECTION_NAMES = { home: 'Home', itineraries: 'Trips', catalog: 'Catalog', plan: 'Trip planner', contact: 'Contact', instagram: 'Instagram', collaborate: 'Collaborate', reviews: 'Reviews' };

      function durSec() { return Math.round((Date.now() - started) / 1000); }
      function sectionList() { return Object.keys(sections).sort(function (a, b) { return sections[b] - sections[a]; }); }

      // Observe known sections to learn what gets seen.
      try {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting && en.target.id) { sections[en.target.id] = (sections[en.target.id] || 0) + 1; } });
        }, { threshold: 0.4 });
        document.querySelectorAll('section[id], [data-track-section][id]').forEach(function (el) { io.observe(el); });
      } catch (e) {}

      function persist(isUpdate) {
        var base = { session_id: sid, device: device, lang: lang, referrer: ref, landing: location.pathname + location.hash,
          sections: sectionList(), duration_seconds: durSec(), user_agent: ua.slice(0, 400), updated_at: new Date().toISOString() };
        if (rowId) {
          SB.from('page_views').update(base).eq('id', rowId).then(function () {}, function () {});
        } else {
          SB.from('page_views').insert(base).select('id').then(function (res) {
            if (res && res.data && res.data[0]) { rowId = res.data[0].id; sessionStorage.setItem('ms_pv_id', rowId); }
          }, function () {});
        }
      }

      // Country via free IP geolocation (best-effort, no key).
      fetch('https://ipwho.is/?fields=success,country,country_code,city').then(function (r) { return r.json(); }).then(function (g) {
        if (g && g.success) {
          var patch = { country: g.country, country_code: g.country_code, city: g.city };
          if (rowId) SB.from('page_views').update(patch).eq('id', rowId).then(function () {}, function () {});
          else { window.__ms_geo = patch; }
        }
      }).catch(function () {});

      // Initial insert (after a short tick so a few sections register), then
      // periodic + on-hide updates for duration & sections.
      setTimeout(function () {
        var first = { session_id: sid, device: device, lang: lang, referrer: ref, landing: location.pathname + location.hash,
          sections: sectionList(), duration_seconds: durSec(), user_agent: ua.slice(0, 400) };
        if (window.__ms_geo) { first.country = window.__ms_geo.country; first.country_code = window.__ms_geo.country_code; first.city = window.__ms_geo.city; }
        SB.from('page_views').insert(first).select('id').then(function (res) {
          if (res && res.data && res.data[0]) { rowId = res.data[0].id; sessionStorage.setItem('ms_pv_id', rowId); }
        }, function () {});
      }, 1500);

      setInterval(function () { if (rowId) persist(true); }, 20000);
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && rowId) persist(true); });
      window.addEventListener('pagehide', function () { if (rowId) persist(true); });
    } catch (e) { /* analytics never breaks the site */ }
  })();
})();
