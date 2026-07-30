// Supabase client bootstrap for the static site.
// Loads the UMD bundle from a <script> tag in index.html (window.supabase),
// then exposes the typed client as window.MS_SB plus a couple of helpers
// the rest of the app can call without knowing anything about Supabase.

(function () {
  const SITE_AUTH_STORAGE_KEY = 'ms-site-auth';
  const isAdminSurface = () => {
    try {
      return !!(document.body && document.body.dataset && document.body.dataset.msSurface === 'admin');
    } catch (_error) {
      return false;
    }
  };

  function normalizeSiteUrl(raw) {
    try {
      const fallback = new URL(window.location.origin + window.location.pathname);
      const url = new URL(raw || fallback.toString(), fallback.toString());
      url.hash = '';
      url.search = '';
      return url.toString();
    } catch (_error) {
      return window.location.origin + window.location.pathname;
    }
  }

  function readCanonicalSiteUrl() {
    const el = document.querySelector('link[rel="canonical"]');
    return el && el.href ? el.href : '';
  }

  window.MS_getSiteUrl = function getSiteUrl() {
    return normalizeSiteUrl(
      (window.MS_ENV && window.MS_ENV.SITE_URL)
      || readCanonicalSiteUrl()
      || (window.location.origin + window.location.pathname)
    );
  };

  window.MS_authRedirectUrl = function authRedirectUrl(opts) {
    const options = opts || {};
    const url = new URL(window.MS_getSiteUrl());
    if (options.adminRecovery) url.searchParams.set('admin_recovery', '1');
    if (options.hash) url.hash = options.hash;
    return url.toString();
  };

  function authErrorMessage(error) {
    return String(
      (error && (error.message || error.error_description || error.error))
      || ''
    );
  }

  function isStaleRefreshTokenError(error) {
    return /invalid refresh token|refresh token not found|refresh_token_not_found/i.test(authErrorMessage(error));
  }

  window.MS_isStaleRefreshTokenError = isStaleRefreshTokenError;
  window.MS_clearSupabaseAuthStorage = function clearSupabaseAuthStorage(storageKey) {
    const key = storageKey || SITE_AUTH_STORAGE_KEY;
    try { localStorage.removeItem(key); } catch (_error) {}
    try { sessionStorage.removeItem(key); } catch (_error) {}
  };
  window.MS_safeGetSession = async function safeGetSession(client, storageKey) {
    if (!client || !client.auth || !client.auth.getSession) return { session: null, error: null };
    const { data, error } = await client.auth.getSession();
    if (error && isStaleRefreshTokenError(error)) {
      window.MS_clearSupabaseAuthStorage(storageKey);
      return { session: null, error };
    }
    return { session: (data && data.session) || null, error: error || null };
  };

  if (!window.MS_AdminAuthHotfixApplied && typeof window.fetch === 'function') {
    window.MS_AdminAuthHotfixApplied = true;
    const originalFetch = window.fetch;

    function requestUrl(input) {
      if (typeof input === 'string') return input;
      if (input && typeof input.url === 'string') return input.url;
      return '';
    }

    function isPasswordGrant(url) {
      return /\/auth\/v1\/token(?:\?|$)/.test(url) && /(?:[?&])grant_type=password(?:&|$)/.test(url);
    }

    window.fetch = async function patchedFetch(input, init) {
      const response = await originalFetch.call(this, input, init);
      try {
        const url = requestUrl(input);
        if (!response || !response.ok || !isPasswordGrant(url)) return response;

        const contentType = response.headers && response.headers.get && response.headers.get('content-type');
        if (!contentType || !/application\/json/i.test(contentType)) return response;

        const payload = await response.clone().json();
        if (!payload || payload.user || !(payload.session && payload.session.user)) return response;

        const headers = new Headers(response.headers);
        const body = JSON.stringify({ ...payload, user: payload.session.user });
        headers.delete('content-length');
        return new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (_error) {
        return response;
      }
    };
  }

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
    { auth: { persistSession: true, autoRefreshToken: true, storageKey: SITE_AUTH_STORAGE_KEY } }
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
        .upsert(row, { onConflict: 'email', ignoreDuplicates: true });
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
      if (isAdminSurface() || (location.hash || '').replace('#', '').split('?')[0] === 'admin') return;
      var SB = window.MS_SB;
      var uuid = function () {
        try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
      };
      var sid = sessionStorage.getItem('ms_sid');
      if (!sid) { sid = uuid(); sessionStorage.setItem('ms_sid', sid); }
      // Client-generated row id — we INSERT with this id and UPDATE by it.
      // (Anon can insert/update but NOT select, so we never use .select().)
      var pvId = sessionStorage.getItem('ms_pv_id');
      var isNewRow = !pvId;
      if (!pvId) { pvId = uuid(); sessionStorage.setItem('ms_pv_id', pvId); }
      var ua = navigator.userAgent || '';
      var device = /Mobi|Android|iPhone|iPod/i.test(ua) ? 'mobile' : (/iPad|Tablet/i.test(ua) ? 'tablet' : 'desktop');
      var lang = (navigator.language || '').slice(0, 5);
      var ref = document.referrer ? (function () { try { return new URL(document.referrer).hostname; } catch (e) { return document.referrer; } })() : 'direct';
      var started = Date.now();
      var sections = {};
      var geo = {};

      function durSec() { return Math.round((Date.now() - started) / 1000); }
      function sectionList() { return Object.keys(sections).sort(function (a, b) { return sections[b] - sections[a]; }); }

      try {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting && en.target.id) { sections[en.target.id] = (sections[en.target.id] || 0) + 1; } });
        }, { threshold: 0.35 });
        document.querySelectorAll('section[id], [data-track-section][id]').forEach(function (el) { io.observe(el); });
      } catch (e) {}

      // INSERT the visit row immediately (explicit id, NO .select()).
      function insertRow() {
        var row = { id: pvId, session_id: sid, device: device, lang: lang, referrer: ref,
          landing: (location.pathname + location.hash).slice(0, 300), sections: sectionList(),
          duration_seconds: durSec(), user_agent: ua.slice(0, 400) };
        if (geo.country) { row.country = geo.country; row.country_code = geo.country_code; row.city = geo.city; }
        SB.from('page_views').insert(row).then(function (r) { if (r && r.error) console.warn('[MS analytics] insert', r.error.message); }, function () {});
      }
      function updateRow() {
        var patch = { sections: sectionList(), duration_seconds: durSec(), updated_at: new Date().toISOString() };
        if (geo.country) { patch.country = geo.country; patch.country_code = geo.country_code; patch.city = geo.city; }
        SB.from('page_views').update(patch).eq('id', pvId).then(function () {}, function () {});
      }

      // Country via free IP geolocation (best-effort).
      fetch('https://ipwho.is/?fields=success,country,country_code,city')
        .then(function (r) { return r.json(); })
        .then(function (g) { if (g && g.success) { geo = { country: g.country, country_code: g.country_code, city: g.city }; updateRow(); } })
        .catch(function () {});

      if (isNewRow) insertRow(); else updateRow();
      setInterval(updateRow, 15000);
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') updateRow(); });
      window.addEventListener('pagehide', updateRow);
    } catch (e) { /* analytics never breaks the site */ }
  })();
})();
