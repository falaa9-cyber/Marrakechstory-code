// ============================================================
// MarrakechStory — Private Admin / Operations console
// Apple-style, fully connected to the website (Supabase).
// Access: <site>/#admin   ·   Auth: configured admin + partner staff accounts.
// ============================================================
(function () {
  const R = window.React;
  const { useState, useEffect, useMemo, useCallback } = R;
  const h = R.createElement;

  const LEGACY_ADMIN_EMAIL = 'f.alaa9@gmail.com';
  const PARTNER_HINT_EMAIL = 'faizsofia20@gmail.com';   // login prefill only — real access is RLS/role-gated
  const COMPANY = (window.MS_CTX && window.MS_CTX.COMPANY) || { phone: '+47 457 74 743', whatsapp: '4745774743' };

  // ---- role (admin vs partner/assistant) ----
  // Single signed-in session, so a module-level value is enough and avoids
  // threading `role` through every component. Set once when the session loads.
  let CURRENT_ROLE = null;   // 'admin' | 'partner'
  let CURRENT_EMAIL = null;
  let CURRENT_NAME = null;
  const isAdminRole = () => CURRENT_ROLE === 'admin';   // money/finance gate
  const canMoney = () => CURRENT_ROLE === 'admin';
  const CAL_DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const CAL_DOW_MINI = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const mondayOffset = (date) => (date.getDay() + 6) % 7;

  // ---- Supabase (persisted admin session) ----
  let SB = null;
  function getSB() {
    if (SB) return SB;
    if (!window.supabase || !window.MS_ENV || !window.MS_ENV.SUPABASE_URL) return null;
    SB = window.supabase.createClient(window.MS_ENV.SUPABASE_URL, window.MS_ENV.SUPABASE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ms-admin-auth', detectSessionInUrl: false } });
    return SB;
  }
  async function dbList(t, order, asc) { const sb = getSB(); if (!sb) return []; let q = sb.from(t).select('*'); if (order) q = q.order(order, { ascending: asc !== false }); const { data, error } = await q; if (error) { console.warn('[admin]', t, error.message); return []; } return data || []; }
  async function dbInsert(t, row) { const sb = getSB(); if (!sb) return { error: 'no client' }; return await sb.from(t).insert(row).select(); }
  async function dbUpdate(t, id, patch) { const sb = getSB(); if (!sb) return { error: 'no client' }; return await sb.from(t).update(patch).eq('id', id).select(); }
  async function dbDelete(t, id) { const sb = getSB(); if (!sb) return { error: 'no client' }; return await sb.from(t).delete().eq('id', id); }

  // ---- audit trail: record what staff change so the admin can monitor ----
  async function logAudit(action, entity, entityId, detail) {
    try {
      const sb = getSB(); if (!sb || !CURRENT_EMAIL) return;
      await sb.from('admin_audit').insert({ actor_email: CURRENT_EMAIL, actor_role: CURRENT_ROLE, action, entity, entity_id: entityId != null ? String(entityId) : null, detail: detail ? String(detail).slice(0, 300) : null });
    } catch (e) { /* never block on audit */ }
  }
  // ---- presence heartbeat: admin can see if the partner is connected ----
  async function touchPresence(view) {
    try {
      const sb = getSB(); if (!sb || !CURRENT_EMAIL) return;
      await sb.from('staff_presence').upsert({ email: CURRENT_EMAIL, name: CURRENT_NAME, role: CURRENT_ROLE, current_view: view || null, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'email' });
    } catch (e) { /* ignore */ }
  }
  // ---- call an authenticated edge function with the current session JWT ----
  async function callFn(name, body) {
    const sb = getSB(); if (!sb) return { ok: false, error: 'no client' };
    const { data: { session } } = await sb.auth.getSession();
    const token = session && session.access_token;
    const base = window.MS_ENV.SUPABASE_URL.replace(/\/$/, '');
    const r = await fetch(`${base}/functions/v1/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: window.MS_ENV.SUPABASE_KEY }, body: JSON.stringify(body || {}) });
    let j = null; try { j = await r.json(); } catch (e) {}
    return j || { ok: r.ok };
  }
  const normEmail = (v) => String(v || '').trim().toLowerCase();
  const adminRecoveryUrl = () => window.MS_authRedirectUrl
    ? window.MS_authRedirectUrl({ adminRecovery: true })
    : (window.location.origin + window.location.pathname + '?admin_recovery=1');
  const isAdminRecoveryLanding = () => {
    const search = new URLSearchParams(window.location.search || '');
    const hash = window.location.hash || '';
    return search.get('admin_recovery') === '1'
      || search.get('type') === 'recovery'
      || /(^|[&#])type=recovery(?:&|$)/.test(hash);
  };
  async function recoverAdminSessionFromSiteClient() {
    if (!isAdminRecoveryLanding() || !window.MS_SB || !window.MS_SB.auth) return null;
    const sb = getSB();
    if (!sb || !sb.auth || !sb.auth.setSession) return null;
    const { data: adminData } = await sb.auth.getSession();
    if (adminData && adminData.session) return adminData.session;
    const { data: siteData } = await window.MS_SB.auth.getSession();
    const siteSession = siteData && siteData.session;
    if (!siteSession || !siteSession.access_token || !siteSession.refresh_token) return null;
    const { data, error } = await sb.auth.setSession({
      access_token: siteSession.access_token,
      refresh_token: siteSession.refresh_token,
    });
    if (error) {
      console.warn('[admin] could not recover site session', error.message);
      return null;
    }
    return (data && data.session) || siteSession;
  }
  function roleFromSettings(user, settings, fallbackEmail) {
    const email = normEmail((user && user.email) || fallbackEmail);
    if (!email) return null;
    const adminEmail = normEmail(settings && settings.admin_email);
    const partnerEmail = normEmail(settings && settings.partner_email);
    if (email === normEmail(LEGACY_ADMIN_EMAIL) || (adminEmail && email === adminEmail)) return 'admin';
    if (partnerEmail && email === partnerEmail && !(settings && settings.partner_blocked)) return 'partner';
    return null;
  }
  async function ensureStaffAccess(user, fallbackEmail) {
    const email = normEmail((user && user.email) || fallbackEmail);
    if (!email) return null;
    if (email === normEmail(LEGACY_ADMIN_EMAIL)) return 'admin';
    const sb = getSB();
    if (!sb) return null;
    const candidate = user && user.email ? user : { ...(user || {}), email };
    const { data, error } = await sb.from('admin_settings').select('id, admin_email, partner_email, partner_blocked').eq('id', 1).maybeSingle();
    if (error || !data) return roleFromSettings(candidate, null, email);
    return roleFromSettings(candidate, data, email);
  }
  async function openStorageFile(bucket, path) {
    try {
      const sb = getSB();
      if (!sb || !bucket || !path) return;
      const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, 60 * 30);
      if (error || !data || !data.signedUrl) throw error || new Error('signed url unavailable');
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (e) {
      alert('Could not open file: ' + ((e && e.message) || e || 'Unknown error'));
    }
  }

  // ---- format ----
  const nf = (n) => (Number(n) || 0).toLocaleString('en-US');
  // Money: always show 2 decimals, Norwegian style (e.g. "12 075,00 kr").
  const kr = (n) => (Number(n) || 0).toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';
  // ---- request/lead display helpers (used by Dashboard + Requests) ----
  const CAT_LABEL = { experiences: 'Experience', activities: 'Experience', transport: 'Transport', stays: 'Stay', riads: 'Stay', tours: 'Tour', desert: 'Desert trip', wellness: 'Wellness', food: 'Food & dining', day: 'Day trip', daytrips: 'Day trip' };
  // Localized values arrive as {en,no,fr,sv} objects OR plain strings.
  function reqText(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'object') return v.en || v.no || v.nb || v.fr || v.sv || (Object.values(v).find(x => typeof x === 'string') || '');
    return String(v);
  }
  // What did this person actually book / ask for? Works across every form kind.
  function reqTitle(l) {
    const p = (l && l.payload) || {};
    return reqText(p.bookingCtx && p.bookingCtx.title) || reqText(p.item) || reqText(p.baseTitle) || (l && l.trip_type) || '';
  }
  const REQ_KIND = { quickbook: 'Booking', itinerary: 'Trip request', tweak: 'Custom trip', collaboration: 'Partnership' };
  function reqKindLabel(l) { return (l && REQ_KIND[l.kind]) || (l && l.kind) || 'Request'; }
  // Pretty-print a submitted value: booleans → Yes/No, empty arrays/objects → None.
  function fmtReqVal(v) {
    if (v == null) return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (v === 'true') return 'Yes';
    if (v === 'false') return 'No';
    if (typeof v === 'string') { const lo = v.trim().toLowerCase(); if (lo === 'yes') return 'Yes'; if (lo === 'no') return 'No'; }
    if (Array.isArray(v)) { const a = v.map(reqText).filter(Boolean); return a.length ? a.join(', ') : 'None'; }
    if (typeof v === 'object') { const s = reqText(v); return s || 'None'; }
    const s = String(v).trim();
    if (s === '' || s === '[]' || s === '{}' || s === '[object Object]') return 'None';
    return s;
  }
  // Friendly label + colour-group for known request fields.
  const REQ_FIELD = {
    name: { l: 'Name', g: 'who' }, email: { l: 'Email', g: 'who' }, phone: { l: 'Phone', g: 'who' }, country: { l: 'Country', g: 'who' }, people: { l: 'Travellers', g: 'who' }, vanSeats: { l: 'Van seats', g: 'who' },
    tripType: { l: 'Trip type', g: 'trip' }, duration: { l: 'Duration (days)', g: 'trip' }, startDate: { l: 'Start date', g: 'trip' }, multiCity: { l: 'Multi-city', g: 'trip' }, arriveCity: { l: 'Arrival city', g: 'trip' }, departCity: { l: 'Departure city', g: 'trip' },
    pace: { l: 'Pace', g: 'style' }, budget: { l: 'Budget', g: 'style' }, accommodation: { l: 'Accommodation', g: 'style' }, flex: { l: 'Flexibility', g: 'style' }, interests: { l: 'Interests', g: 'style' }, stops: { l: 'Stops', g: 'style' }, occasion: { l: 'Occasion', g: 'style' }, daySchedule: { l: 'Day schedule', g: 'style' },
    flightBooked: { l: 'Flights booked', g: 'log' }, bookedAccom: { l: 'Accommodation booked', g: 'log' }, bookedTransport: { l: 'Transport booked', g: 'log' }, bookedActivities: { l: 'Activities booked', g: 'log' },
    notes: { l: 'Notes', g: 'notes' }, avoid: { l: 'Avoid', g: 'notes' },
  };
  const REQ_GROUPS = [['trip', 'Trip'], ['who', 'Traveller & contact'], ['style', 'Style & preferences'], ['log', 'Booked & logistics'], ['notes', 'Notes'], ['other', 'Other details']];
  // Display order that follows the form flow — contact → trip → style → logistics → notes last.
  const REQ_ORDER = ['name', 'email', 'phone', 'country',
    'tripType', 'people', 'startDate', 'endDate', 'duration', 'arriveCity', 'departCity', 'multiCity', 'vanSeats',
    'pace', 'budget', 'accommodation', 'flex', 'interests', 'stops', 'daySchedule', 'occasion',
    'flightBooked', 'bookedAccom', 'bookedTransport', 'bookedActivities'];
  const reqOrderIdx = (k) => { if (k === 'notes') return 90001; if (k === 'avoid') return 90002; const i = REQ_ORDER.indexOf(k); return i < 0 ? 50000 : i; };
  // ── Calendar: what's happening for a booking on a given date (for hover tooltips) ──
  function bkDayProgram(b, k) {
    const itin = Array.isArray(b.daily_itinerary) ? b.daily_itinerary : [];
    let m = itin.find(d => (d.date || '').slice(0, 10) === k);
    if (!m && b.arrival_date) { const diff = Math.round((new Date(k) - new Date(b.arrival_date.slice(0, 10))) / 86400000); if (diff >= 0 && diff < itin.length) m = itin[diff]; }
    return m;
  }
  function bkDayActs(b, k) {
    if (k === (b.arrival_date || '').slice(0, 10)) return 'Arrival · ' + (b.arrival_city || 'Marrakech');
    if (k === (b.departure_date || '').slice(0, 10)) return 'Departure · ' + (b.departure_city || '');
    const prog = bkDayProgram(b, k); if (!prog) return '';
    const acts = (Array.isArray(prog.activities) ? prog.activities : []).map(a => a.type || a.details).filter(Boolean).slice(0, 3).join(' · ');
    return (prog.city ? prog.city : '') + (prog.city && acts ? ' — ' : '') + acts;
  }
  // ── MarrakechStory agent: compose a tailored draft reply from a request. ──
  function agentDraft(l) {
    const p = (l && l.payload) || {};
    const first = (reqText(p.name) || (l && l.name) || '').trim().split(/\s+/)[0] || 'there';
    const lang = ((l && l.lang) || p.lang || '').toString().toLowerCase().slice(0, 2);
    const tripType = (reqText(p.tripType) || (l && l.trip_type) || '').toLowerCase();
    const days = p.duration || (l && l.duration);
    const trav = p.travellers || {};
    const ppl = p.people || ((+trav.adults || 0) + (+trav.children || 0) + (+trav.infants || 0)) || null;
    const start = (l && l.start_date) || reqText(p.startDate);
    const fmtD = start ? fmtDate(start) : '';
    const budget = reqText(p.budget);
    const accom = reqText(p.accommodation);
    const chooseForMe = !!p.chooseForMe;
    const facts = [];
    if (tripType) facts.push(tripType.charAt(0).toUpperCase() + tripType.slice(1) + ' trip');
    if (days) facts.push(days + ' days');
    if (ppl) facts.push(ppl + ' travellers');
    if (fmtD) facts.push('starting ' + fmtD);
    if (accom) facts.push(accom + ' stays');
    if (budget) facts.push(budget + ' budget');
    const factLine = facts.join(' · ');
    if (lang === 'no' || lang === 'nb') {
      return [
        'Hei ' + first + ',', '',
        'Tusen takk for forespørselen din til MarrakechStory — så hyggelig at du vil reise med oss!',
        factLine ? ('Vi har notert oss: ' + factLine + '.') : '',
        chooseForMe ? 'Siden du ønsker at vi skreddersyr turen, setter vi sammen et komplett dag-for-dag-program for deg.' : 'Vi setter sammen et forslag som passer ønskene dine.',
        p.notes ? 'Vi har lest notatene dine og tar med ønskene i planen.' : '', '',
        'Du får et skreddersydd forslag med program og pris innen 24 timer. Si gjerne ifra om datoene er faste, så låser vi de beste riadene og opplevelsene med en gang.', '',
        'Varme hilsener,', 'Aladdin & Marte — MarrakechStory',
      ].filter(x => x !== '').join('\n');
    }
    return [
      'Hi ' + first + ',', '',
      'Thank you so much for your request to MarrakechStory — we’d love to host you!',
      factLine ? ('Here’s what we’ve noted: ' + factLine + '.') : '',
      chooseForMe ? 'Since you’d like us to craft the trip, we’ll put together a complete day-by-day itinerary for you.' : 'We’ll put together a tailored proposal around your wishes.',
      p.notes ? 'We’ve read your notes and will build your wishes into the plan.' : '', '',
      'You’ll receive a tailored proposal with the programme and pricing within 24 hours. If your dates are fixed, just let us know and we’ll lock in the best riads and experiences right away.', '',
      'Warm regards,', 'Aladdin & Marte — MarrakechStory',
    ].filter(x => x !== '').join('\n');
  }
  const fmtDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };
  const fmtDateTime = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return d; } };
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const daysUntil = (d) => { if (!d) return null; const a = new Date(d); a.setHours(0, 0, 0, 0); return Math.round((a - startOfToday()) / 864e5); };
  const countdownLabel = (d) => { const n = daysUntil(d); if (n == null) return ''; if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow'; if (n > 1) return 'in ' + n + ' days'; if (n === -1) return 'yesterday'; return Math.abs(n) + ' days ago'; };
  // Local YYYY-MM-DD helpers used for the "today / tomorrow" activity glow.
  const localDayStr = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const dayOf = (v) => (v || '').slice(0, 10);
  const shiftDay = (s, n) => { const p = s.split('-').map(Number); const dt = new Date(p[0], p[1] - 1, p[2] + n); return localDayStr(dt); };
  const itinOn = (b, day) => { const it = Array.isArray(b.daily_itinerary) ? b.daily_itinerary : []; const d = it.find(x => dayOf(x.date) === day); if (!d) return ''; const acts = (d.activities || []).map(a => a.type || a.details).filter(Boolean); return d.city || acts[0] || ''; };
  // Returns {when:'today'|'tomorrow', label} when a booking has an arrival, departure or
  // on-trip activity today or tomorrow — otherwise null. Drives the slow green glow.
  const bookingActivity = (b) => {
    if (!b || b.status === 'cancelled') return null;
    const T = localDayStr(new Date()), TM = shiftDay(T, 1);
    const a = dayOf(b.arrival_date), dep = dayOf(b.departure_date);
    if (!a) return null;
    const tail = (s) => s ? ' · ' + s : '';
    if (a === T) return { when: 'today', label: 'Arrives today' + tail(itinOn(b, T)) };
    if (a === TM) return { when: 'tomorrow', label: 'Arrives tomorrow' + tail(itinOn(b, TM)) };
    if (dep === T) return { when: 'today', label: 'Departs today' + tail(itinOn(b, T)) };
    if (dep === TM) return { when: 'tomorrow', label: 'Departs tomorrow' };
    if (dep && a <= T && T <= dep) { const act = itinOn(b, T); return { when: 'today', label: act ? 'Today · ' + act : 'On trip today' }; }
    if (dep && a <= TM && TM <= dep) { const act = itinOn(b, TM); return { when: 'tomorrow', label: act ? 'Tomorrow · ' + act : 'On trip tomorrow' }; }
    return null;
  };
  const waLink = (p) => 'https://wa.me/' + String(p || '').replace(/[^0-9]/g, '');

  const STATUS_LABEL = { new: 'New', quotation_sent: 'Quotation Sent', waiting_confirmation: 'Awaiting', confirmed: 'Confirmed', deposit_paid: 'Deposit Paid', fully_paid: 'Fully Paid', ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled' };
  const STATUS_ORDER = Object.keys(STATUS_LABEL);
  const LEAD_SOURCES = ['website', 'whatsapp', 'instagram', 'referral', 'recommended', 'email', 'other'];
  const ACTIVITY_TYPES = ['Transport','Airport Transfer','Private Driver','Check-in','Check-out','Guided Tour','City Tour','Medina Tour','Ourika Valley','Atlas Mountains','Agafay Day Pass','Agafay Dinner','Desert Camp','Sahara Trip','Essaouira Day Trip','Cooking Class','Hot Air Balloon','Paragliding','Quad/Buggy','Camel Ride','Horse Riding','Jet Ski','Surfing','Boat Trip','Golf','Waterfalls Trip','Shopping Tour','Photography Tour','Restaurant','Breakfast','Lunch','Dinner','Show / Entertainment','Spa/Hammam','Massage','Pool Day','Free Time','Other'];
  const SUP_TYPES = [['hotel','Hotel / Riad'],['restaurant','Restaurant'],['driver','Transport / Driver'],['car_rental','Car Rental'],['guide','Guide'],['camp','Desert Camp'],['activity','Activity Provider']];
  // Collaborators are grouped into business categories.
  const SUP_CAT = { hotel: 'accommodation', camp: 'accommodation', driver: 'transport', car_rental: 'carrental', restaurant: 'restaurants', guide: 'activities', activity: 'activities' };
  const SUP_CATS = [['accommodation', 'Accommodation'], ['transport', 'Transport'], ['carrental', 'Car rental'], ['restaurants', 'Restaurants'], ['activities', 'Activities']];
  const SUP_CAT_COLOR = { accommodation: '#e0432a', transport: '#0a84ff', carrental: '#5e5ce6', restaurants: '#ff9f0a', activities: '#34c759' };
  const CURRENCIES = ['NOK', 'MAD', 'EUR', 'USD', 'SEK', 'DKK', 'GBP'];
  const CUR_SYMBOL = { NOK: 'kr', SEK: 'kr', DKK: 'kr', MAD: 'DH', EUR: '€', USD: '$', GBP: '£' };
  const money = (n, cur) => { const v = Math.round((+n || 0)).toLocaleString('nb-NO'); const c = cur || 'NOK'; return (c === 'EUR' || c === 'USD' || c === 'GBP') ? (CUR_SYMBOL[c] + ' ' + v) : (v + ' ' + (CUR_SYMBOL[c] || c)); };
  // Cost-line categories: each booking can have several collaborators per category.
  const COST_CATS = [['transport', 'Transport', 'driver'], ['accommodation', 'Accommodation', 'hotel'], ['activities', 'Activities', 'activity']];
  // Per-collaborator spend for one booking — reads the multi-line cost_lines if
  // present, else falls back to the legacy single-collaborator-per-category fields.
  const bookingCollabSpend = (b) => {
    const lines = Array.isArray(b.cost_lines) ? b.cost_lines : null;
    if (lines && lines.length) return lines.filter(l => l.collab && (+l.amount > 0)).map(l => ({ collab: l.collab, amount: +l.amount, cat: l.cat }));
    const out = [];
    if (b.collab_transport && +b.cost_transportation > 0) out.push({ collab: b.collab_transport, amount: +b.cost_transportation, cat: 'transport' });
    if (b.collab_accommodation && +b.cost_accommodation > 0) out.push({ collab: b.collab_accommodation, amount: +b.cost_accommodation, cat: 'accommodation' });
    if (b.collab_activities && +b.cost_activities > 0) out.push({ collab: b.collab_activities, amount: +b.cost_activities, cat: 'activities' });
    return out;
  };
  const PAYMENT_METHODS = ['Bank Transfer', 'Revolut', 'Wise', 'PayPal', 'Cash', 'NOK Bank', 'MAD Bank'];
  // ── Document languages (matches the public site: Norsk, English, Svenska, Français, Deutsch) ──
  const DOC_LANGS = [['no', 'Norsk'], ['en', 'English'], ['sv', 'Svenska'], ['fr', 'Français'], ['de', 'Deutsch']];
  const DOC_LOCALE = { no: 'nb-NO', en: 'en-GB', sv: 'sv-SE', fr: 'fr-FR', de: 'de-DE' };
  const DOC_TR = {
    itin_kicker: { no: "Privat reiseplan", en: "Private travel itinerary", sv: "Privat resplan", fr: "Itinéraire privé", de: "Private Reiseroute" },
    itin_title: { no: "Reiseplan", en: "Itinerary", sv: "Resplan", fr: "Itinéraire", de: "Reiseplan" },
    for: { no: "For", en: "For", sv: "För", fr: "Pour", de: "Für" },
    trip: { no: "Reise", en: "Trip", sv: "Resa", fr: "Voyage", de: "Reise" },
    dates: { no: "Datoer", en: "Dates", sv: "Datum", fr: "Dates", de: "Daten" },
    travelers: { no: "Reisende", en: "Travellers", sv: "Resenärer", fr: "Voyageurs", de: "Reisende" },
    ref: { no: "Ref", en: "Ref", sv: "Ref", fr: "Réf", de: "Ref" },
    persons: { no: "personer", en: "travellers", sv: "personer", fr: "voyageurs", de: "Personen" },
    nights: { no: "netter", en: "nights", sv: "nätter", fr: "nuits", de: "Nächte" },
    day: { no: "Dag", en: "Day", sv: "Dag", fr: "Jour", de: "Tag" },
    no_itin: { no: "Ingen dagsplan lagt til ennå.", en: "No daily itinerary added yet.", sv: "Inget dagsprogram tillagt ännu.", fr: "Aucun programme journalier ajouté.", de: "Noch kein Tagesprogramm hinzugefügt." },
    tbd: { no: "Kommer", en: "TBD", sv: "Kommer", fr: "À définir", de: "Offen" },
    included: { no: "Inkludert", en: "Included", sv: "Ingår", fr: "Inclus", de: "Inbegriffen" },
    not_included: { no: "Ikke inkludert", en: "Not included", sv: "Ingår inte", fr: "Non inclus", de: "Nicht inbegriffen" },
    foot_thanks: { no: "Takk for at du valgte MarrakechStory. Vi ønsker deg en uforglemmelig reise.", en: "Thank you for choosing MarrakechStory. We wish you an unforgettable journey.", sv: "Tack för att du valde MarrakechStory. Vi önskar dig en oförglömlig resa.", fr: "Merci d'avoir choisi MarrakechStory. Nous vous souhaitons un voyage inoubliable.", de: "Danke, dass Sie MarrakechStory gewählt haben. Wir wünschen Ihnen eine unvergessliche Reise." },
    inv_kicker: { no: "Faktura", en: "Invoice", sv: "Faktura", fr: "Facture", de: "Rechnung" },
    inv_title: { no: "Faktura", en: "Invoice", sv: "Faktura", fr: "Facture", de: "Rechnung" },
    billed_to: { no: "Fakturert til", en: "Billed to", sv: "Fakturerad till", fr: "Facturé à", de: "Rechnung an" },
    invoice_no: { no: "Faktura", en: "Invoice", sv: "Faktura", fr: "Facture", de: "Rechnung" },
    date: { no: "Dato", en: "Date", sv: "Datum", fr: "Date", de: "Datum" },
    method: { no: "Metode", en: "Method", sv: "Metod", fr: "Méthode", de: "Methode" },
    status: { no: "Status", en: "Status", sv: "Status", fr: "Statut", de: "Status" },
    bill_to: { no: "Fakturamottaker", en: "Bill to", sv: "Faktureras till", fr: "Facturer à", de: "Rechnungsempfänger" },
    description: { no: "Beskrivelse", en: "Description", sv: "Beskrivning", fr: "Description", de: "Beschreibung" },
    amount: { no: "Beløp", en: "Amount", sv: "Belopp", fr: "Montant", de: "Betrag" },
    package: { no: "Skreddersydd reisepakke", en: "Bespoke Travel Package", sv: "Skräddarsytt resepaket", fr: "Forfait voyage sur mesure", de: "Maßgeschneidertes Reisepaket" },
    travelers_word: { no: "reisende", en: "travellers", sv: "resenärer", fr: "voyageurs", de: "Reisende" },
    subtotal: { no: "Delsum", en: "Subtotal", sv: "Delsumma", fr: "Sous-total", de: "Zwischensumme" },
    deposit_confirm: { no: "Depositum for å bekrefte", en: "Deposit to confirm", sv: "Handpenning att bekräfta", fr: "Acompte pour confirmer", de: "Anzahlung zur Bestätigung" },
    paid: { no: "Betalt", en: "Paid", sv: "Betalt", fr: "Payé", de: "Bezahlt" },
    balance_due: { no: "Restbeløp", en: "Balance Due", sv: "Återstående", fr: "Solde dû", de: "Restbetrag" },
    to_pay: { no: "Å betale", en: "To pay", sv: "Att betala", fr: "À payer", de: "Zu zahlen" },
    total_amount: { no: "Totalbeløp", en: "Total amount", sv: "Totalbelopp", fr: "Montant total", de: "Gesamtbetrag" },
    rest_to_pay: { no: "Resten å betale", en: "Rest to pay", sv: "Resten att betala", fr: "Reste à payer", de: "Restzahlung" },
    paynote_deposit: { no: "Et depositum på {dep} ({pct}%) bekrefter bestillingen. Resten på {rest} betales før avreise.", en: "A deposit of {dep} ({pct}%) confirms your booking. The remaining {rest} is due before departure.", sv: "En handpenning på {dep} ({pct}%) bekräftar bokningen. Resterande {rest} betalas före avresa.", fr: "Un acompte de {dep} ({pct}%) confirme votre réservation. Le solde de {rest} est dû avant le départ.", de: "Eine Anzahlung von {dep} ({pct}%) bestätigt Ihre Buchung. Der Restbetrag von {rest} ist vor Abreise fällig." },
    paynote_full: { no: "Full betaling på {sub} kreves for å bekrefte bestillingen.", en: "Full payment of {sub} is required to confirm your booking.", sv: "Full betalning på {sub} krävs för att bekräfta bokningen.", fr: "Le paiement intégral de {sub} est requis pour confirmer votre réservation.", de: "Die vollständige Zahlung von {sub} ist zur Bestätigung Ihrer Buchung erforderlich." },
    bank_details: { no: "Bankoverføring", en: "Bank transfer details", sv: "Banköverföring", fr: "Coordonnées bancaires", de: "Bankverbindung" },
    bank_name: { no: "Bank:", en: "Bank name:", sv: "Bank:", fr: "Banque :", de: "Bank:" },
    account_name: { no: "Kontonavn:", en: "Account name:", sv: "Kontonamn:", fr: "Titulaire :", de: "Kontoinhaber:" },
    pay_via: { no: "Betal med", en: "Pay via", sv: "Betala via", fr: "Payer via", de: "Zahlen per" },
    cash_title: { no: "Kontant betaling", en: "Payment in cash", sv: "Kontant betalning", fr: "Paiement en espèces", de: "Barzahlung" },
    label_method: { no: "Metode:", en: "Method:", sv: "Metod:", fr: "Méthode :", de: "Methode:" },
    label_when: { no: "Når:", en: "When:", sv: "När:", fr: "Quand :", de: "Wann:" },
    cash_when: { no: "Betales kontant ved ankomst i Marrakech", en: "Payable in cash on arrival in Marrakech", sv: "Betalas kontant vid ankomst i Marrakech", fr: "Payable en espèces à l'arrivée à Marrakech", de: "Zahlbar in bar bei Ankunft in Marrakesch" },
    cash_word: { no: "Kontant", en: "Cash", sv: "Kontant", fr: "Espèces", de: "Bar" },
    terms: { no: "Vilkår og betingelser", en: "Terms & Conditions", sv: "Villkor", fr: "Conditions générales", de: "Geschäftsbedingungen" }
  };
  const ACT_TR = {
    'Transport': { no: "Transport", sv: "Transport", fr: "Transport", de: "Transport" },
    'Airport Transfer': { no: "Flyplasstransport", sv: "Flygplatstransfer", fr: "Transfert aéroport", de: "Flughafentransfer" },
    'Private Driver': { no: "Privatsjåfør", sv: "Privat chaufför", fr: "Chauffeur privé", de: "Privatfahrer" },
    'Check-in': { no: "Innsjekk", sv: "Incheckning", fr: "Arrivée", de: "Check-in" },
    'Check-out': { no: "Utsjekk", sv: "Utcheckning", fr: "Départ", de: "Check-out" },
    'Guided Tour': { no: "Guidet tur", sv: "Guidad tur", fr: "Visite guidée", de: "Geführte Tour" },
    'City Tour': { no: "Byrundtur", sv: "Stadsrundtur", fr: "Visite de la ville", de: "Stadtrundfahrt" },
    'Medina Tour': { no: "Medina-tur", sv: "Medina-tur", fr: "Visite de la médina", de: "Medina-Tour" },
    'Ourika Valley': { no: "Ourika-dalen", sv: "Ourikadalen", fr: "Vallée de l'Ourika", de: "Ourika-Tal" },
    'Atlas Mountains': { no: "Atlasfjellene", sv: "Atlasbergen", fr: "Montagnes de l'Atlas", de: "Atlasgebirge" },
    'Agafay Day Pass': { no: "Agafay dagspass", sv: "Agafay dagspass", fr: "Pass journée Agafay", de: "Agafay Tagespass" },
    'Agafay Dinner': { no: "Agafay middag", sv: "Agafay middag", fr: "Dîner à Agafay", de: "Agafay Abendessen" },
    'Desert Camp': { no: "Ørkenleir", sv: "Ökenläger", fr: "Camp dans le désert", de: "Wüstencamp" },
    'Sahara Trip': { no: "Sahara-tur", sv: "Sahararesa", fr: "Excursion au Sahara", de: "Sahara-Reise" },
    'Essaouira Day Trip': { no: "Essaouira dagstur", sv: "Essaouira dagstur", fr: "Excursion à Essaouira", de: "Essaouira Tagesausflug" },
    'Cooking Class': { no: "Matlagingskurs", sv: "Matlagningskurs", fr: "Cours de cuisine", de: "Kochkurs" },
    'Hot Air Balloon': { no: "Luftballong", sv: "Luftballong", fr: "Montgolfière", de: "Heißluftballon" },
    'Paragliding': { no: "Paragliding", sv: "Skärmflygning", fr: "Parapente", de: "Gleitschirmfliegen" },
    'Quad/Buggy': { no: "Quad/Buggy", sv: "Quad/Buggy", fr: "Quad/Buggy", de: "Quad/Buggy" },
    'Camel Ride': { no: "Kameltur", sv: "Kamelridning", fr: "Balade à dos de chameau", de: "Kamelritt" },
    'Horse Riding': { no: "Rideturer", sv: "Ridning", fr: "Équitation", de: "Reiten" },
    'Jet Ski': { no: "Vannscooter", sv: "Vattenskoter", fr: "Jet ski", de: "Jetski" },
    'Surfing': { no: "Surfing", sv: "Surfing", fr: "Surf", de: "Surfen" },
    'Boat Trip': { no: "Båttur", sv: "Båttur", fr: "Excursion en bateau", de: "Bootsfahrt" },
    'Golf': { no: "Golf", sv: "Golf", fr: "Golf", de: "Golf" },
    'Waterfalls Trip': { no: "Fossetur", sv: "Vattenfallstur", fr: "Excursion aux cascades", de: "Wasserfälle-Ausflug" },
    'Shopping Tour': { no: "Shoppingtur", sv: "Shoppingtur", fr: "Tour shopping", de: "Shopping-Tour" },
    'Photography Tour': { no: "Fototur", sv: "Fototur", fr: "Tour photo", de: "Foto-Tour" },
    'Restaurant': { no: "Restaurant", sv: "Restaurang", fr: "Restaurant", de: "Restaurant" },
    'Breakfast': { no: "Frokost", sv: "Frukost", fr: "Petit-déjeuner", de: "Frühstück" },
    'Lunch': { no: "Lunsj", sv: "Lunch", fr: "Déjeuner", de: "Mittagessen" },
    'Dinner': { no: "Middag", sv: "Middag", fr: "Dîner", de: "Abendessen" },
    'Show / Entertainment': { no: "Show", sv: "Underhållning", fr: "Spectacle", de: "Show" },
    'Spa/Hammam': { no: "Spa/Hammam", sv: "Spa/Hammam", fr: "Spa/Hammam", de: "Spa/Hammam" },
    'Massage': { no: "Massasje", sv: "Massage", fr: "Massage", de: "Massage" },
    'Pool Day': { no: "Bassengdag", sv: "Pooldag", fr: "Journée piscine", de: "Pooltag" },
    'Free Time': { no: "Fritid", sv: "Fritid", fr: "Temps libre", de: "Freizeit" },
    'Other': { no: "Annet", sv: "Övrigt", fr: "Autre", de: "Sonstiges" }
  };
  // Stable distinct color per booking (so spans are easy to follow on the calendar)
  const BK_PALETTE = ['#e0432a', '#0a84ff', '#34c759', '#ff9f0a', '#af52de', '#ff2d55', '#0aa2c0', '#a2845e', '#d4a017', '#1c7a3f', '#5856d6', '#ff6482', '#00b8a3', '#c2410c'];
  function bkColor(b) { const s = String((b && (b.reference || b.id || b.client_name)) || ''); let n = 0; for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0; return BK_PALETTE[n % BK_PALETTE.length]; }
  const BOOKING_KINDS = ['itinerary', 'quickbook', 'tweak'];

  // ---- SVG icon set (no emoji, professional line icons) ----
  function svg(children, vb) { return h('svg', { width: 18, height: 18, viewBox: vb || '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }, children); }
  const P = (d) => h('path', { d });
  const ICON = {
    dashboard: () => svg([h('rect', { x: 3, y: 3, width: 7, height: 9, rx: 1.5 }), h('rect', { x: 14, y: 3, width: 7, height: 5, rx: 1.5 }), h('rect', { x: 14, y: 12, width: 7, height: 9, rx: 1.5 }), h('rect', { x: 3, y: 16, width: 7, height: 5, rx: 1.5 })]),
    bookings: () => svg([h('rect', { x: 3, y: 7, width: 18, height: 13, rx: 2 }), P('M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2')]),
    calendar: () => svg([h('rect', { x: 3, y: 4, width: 18, height: 17, rx: 2 }), P('M3 9h18M8 2v4M16 2v4')]),
    clients: () => svg([P('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'), h('circle', { cx: 9, cy: 7, r: 4 }), P('M22 21v-2a4 4 0 0 0-3-3.87')]),
    collab: () => svg([P('M16 16l3-8 3 8M2 16l3-8 3 8M7 8h10M12 3v18M9 21h6')]),
    finance: () => svg([P('M3 3v18h18'), P('M7 14l4-4 3 3 5-6')]),
    tasks: () => svg([P('M9 11l3 3L22 4'), P('M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11')]),
    requests: () => svg([P('M22 12h-6l-2 3h-4l-2-3H2'), P('M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z')]),
    search: () => svg([h('circle', { cx: 11, cy: 11, r: 8 }), P('M21 21l-4.3-4.3')]),
    plus: () => svg([P('M12 5v14M5 12h14')]),
    edit: () => svg([P('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'), P('M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z')]),
    trash: () => svg([P('M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6')]),
    pdf: () => svg([P('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'), P('M14 2v6h6M12 18v-6M9 15l3 3 3-3')]),
    doc: () => svg([P('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'), P('M14 2v6h6M8 13h8M8 17h8M8 9h2')]),
    invoice: () => svg([P('M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z'), P('M8 7h8M8 11h8M8 15h5')]),
    whatsapp: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor' }, h('path', { d: 'M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z' })),
    chevL: () => svg([P('M15 18l-6-6 6-6')]),
    chevR: () => svg([P('M9 18l6-6-6-6')]),
    x: () => svg([P('M18 6L6 18M6 6l12 12')]),
    print: () => svg([P('M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'), h('rect', { x: 6, y: 14, width: 12, height: 8, rx: 1 })]),
    logout: () => svg([P('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9')]),
    menu: () => svg([P('M3 12h18M3 6h18M3 18h18')]),
    bell: () => svg([P('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0')]),
    settings: () => svg([h('circle', { cx: 12, cy: 12, r: 3 }), P('M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z')]),
    globe: () => svg([h('circle', { cx: 12, cy: 12, r: 10 }), P('M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20')]),
    insights: () => svg([P('M3 3v18h18'), h('rect', { x: 7, y: 11, width: 3, height: 6, rx: 1 }), h('rect', { x: 12, y: 7, width: 3, height: 10, rx: 1 }), h('rect', { x: 17, y: 13, width: 3, height: 4, rx: 1 })]),
  };

  // =====================================================================
  // LOGIN
  // =====================================================================
  function Login({ onAuthed }) {
    const [mode, setMode] = useState('admin');   // 'admin' | 'partner'
    const [adminHintEmail, setAdminHintEmail] = useState(LEGACY_ADMIN_EMAIL);
    const [email, setEmail] = useState(LEGACY_ADMIN_EMAIL); const [pass, setPass] = useState('');
    const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
    const [remember, setRemember] = useState(true); const [notice, setNotice] = useState('');
    useEffect(() => {
      let alive = true;
      (async () => {
        const sb = getSB(); if (!sb) return;
        const { data } = await sb.from('admin_settings').select('admin_email').eq('id', 1).maybeSingle();
        const nextAdminEmail = normEmail(data && data.admin_email) || LEGACY_ADMIN_EMAIL;
        if (!alive) return;
        setAdminHintEmail(nextAdminEmail);
        setEmail((curr) => mode === 'admin' && (!curr || normEmail(curr) === normEmail(LEGACY_ADMIN_EMAIL)) ? nextAdminEmail : curr);
      })();
      return () => { alive = false; };
    }, []);
    const pickMode = (m) => { setMode(m); setErr(''); setPass(''); setNotice(''); setEmail(m === 'admin' ? adminHintEmail : PARTNER_HINT_EMAIL); };
    const forgot = async (e) => {
      e.preventDefault(); setErr(''); setNotice('');
      if (!email.trim()) { setErr('Enter your email first, then tap “Forgot password”.'); return; }
      const sb = getSB(); if (!sb) { setErr('Supabase not loaded'); return; }
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: adminRecoveryUrl() });
      if (error) setErr(error.message); else setNotice('Password-reset email sent to ' + email.trim() + '. It will return to this admin page.');
    };
    const sendSecureLink = async (e) => {
      e.preventDefault(); setErr(''); setNotice('');
      const sb = getSB(); if (!sb) { setErr('Supabase not loaded'); return; }
      const secureEmail = mode === 'admin' ? (adminHintEmail || email).trim() : email.trim();
      if (!secureEmail) { setErr('Enter your email first, then request the secure sign-in link.'); return; }
      setBusy(true);
      const { error } = await sb.auth.signInWithOtp({
        email: secureEmail,
        options: {
          emailRedirectTo: adminRecoveryUrl(),
          shouldCreateUser: false,
        },
      });
      setBusy(false);
      if (error) { setErr(error.message); return; }
      setNotice('Secure sign-in link sent to ' + secureEmail + '. Open it on this device to enter the admin area without changing your password.');
    };
    const submit = async (e) => {
      e.preventDefault(); setErr(''); setBusy(true);
      const sb = getSB(); if (!sb) { setErr('Supabase not loaded'); setBusy(false); return; }
      const typedEmail = email.trim();
      const { data, error } = await sb.auth.signInWithPassword({ email: typedEmail, password: pass });
      if (error) { setBusy(false); setErr(error.message); return; }
      // Some auth responses can be thin on the first round-trip, so re-check the
      // persisted session and the current user before deciding whether this
      // account is allowed in.
      const { data: sessionData } = await sb.auth.getSession();
      const { data: userData } = await sb.auth.getUser();
      const sessionUser = sessionData && sessionData.session && sessionData.session.user;
      const signedInUser = data.user || (data.session && data.session.user) || sessionUser || (userData && userData.user) || { email: typedEmail };
      const roleData = await ensureStaffAccess(signedInUser, typedEmail)
        || (normEmail(typedEmail) === normEmail(LEGACY_ADMIN_EMAIL) ? 'admin' : null);
      setBusy(false);
      if (!signedInUser || !roleData) { await sb.auth.signOut(); setErr('This account is not authorised.'); return; }
      onAuthed(signedInUser, roleData);
    };
    const secureEmailTarget = mode === 'admin' ? (adminHintEmail || email).trim() : email.trim();
    return h('div', { className: 'msa-login' }, h('form', { className: 'msa-login-card', onSubmit: submit },
      h('div', { className: 'msa-login-logo-wrap' }, h('img', { src: 'assets/logo.png', alt: 'MarrakechStory', className: 'msa-login-logo', onError: (e) => { e.target.style.display = 'none'; } })),
      h('h1', null, 'Sign in to your account'),
      h('p', { className: 'msa-login-sub' }, 'MarrakechStory Operations Console'),
      h('div', { className: 'msa-login-modes' },
        h('button', { type: 'button', className: 'msa-login-mode' + (mode === 'admin' ? ' active' : ''), onClick: () => pickMode('admin') }, '🛡️ Admin'),
        h('button', { type: 'button', className: 'msa-login-mode' + (mode === 'partner' ? ' active' : ''), onClick: () => pickMode('partner') }, '👤 Partner')),
      h('div', { className: 'msa-login-divider' }, h('span', null, 'Sign in with email')),
      err && h('div', { className: 'msa-login-err' }, err),
      notice && h('div', { className: 'msa-login-notice' }, notice),
      h('div', { className: 'msa-login-help' },
        h('strong', null, mode === 'admin' ? 'Admin access' : 'Partner access'),
        h('p', null, mode === 'admin'
          ? 'Use your admin password first. If that fails, send a one-time secure sign-in link to the same admin email without creating a new account or changing your password.'
          : 'Use the partner password first. If you are locked out, send a one-time secure sign-in link to the partner email on file.'),
        secureEmailTarget && h('span', { className: 'msa-login-help-email' }, secureEmailTarget)),
      h('input', { type: 'email', autoComplete: 'email', placeholder: 'Email address', value: email, onChange: (e) => setEmail(e.target.value) }),
      h('input', { type: 'password', autoComplete: 'current-password', placeholder: 'Password', value: pass, onChange: (e) => setPass(e.target.value) }),
      h('div', { className: 'msa-login-row' },
        h('label', { className: 'msa-login-remember' }, h('input', { type: 'checkbox', checked: remember, onChange: (e) => setRemember(e.target.checked) }), 'Remember me on this device'),
        h('a', { href: '#', className: 'msa-login-forgot', onClick: forgot }, 'Reset password')),
      h('button', { type: 'submit', disabled: busy, className: 'msa-login-submit' }, busy ? 'Signing in…' : 'Sign In'),
      h('button', { type: 'button', disabled: busy, className: 'msa-login-secondary', onClick: sendSecureLink }, busy ? 'Sending secure link…' : 'Send a one-time secure sign-in link'),
      h('a', { href: '#', className: 'msa-login-back' }, '← Back to website')));
  }

  // ---- tiny SVG charts ----
  function Donut({ segments, size }) {
    size = size || 150; const r = size / 2 - 14, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
    const total = segments.reduce((s, x) => s + x.value, 0) || 1; let off = 0;
    return h('div', { className: 'msa-donut-wrap' },
      h('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size, className: 'msa-donut' },
        h('circle', { cx, cy, r, fill: 'none', stroke: '#eee', strokeWidth: 16 }),
        segments.map((s, i) => { const len = (s.value / total) * C; const el = h('circle', { key: i, cx, cy, r, fill: 'none', stroke: s.color, strokeWidth: 16, strokeDasharray: len + ' ' + (C - len), strokeDashoffset: -off, transform: 'rotate(-90 ' + cx + ' ' + cy + ')' }); off += len; return el; })),
      h('div', { className: 'msa-donut-mid' }, h('strong', null, Math.round(total / 1000) + 'k'), h('span', null, 'total')));
  }
  function Bars({ data, color }) {
    const max = Math.max(1, ...data.map(d => d.value));
    return h('div', { className: 'msa-bars' }, data.map((d, i) => h('div', { key: i, className: 'msa-bar-col' },
      h('div', { className: 'msa-bar-track' }, h('div', { className: 'msa-bar-fill', style: { height: Math.round(d.value / max * 100) + '%', background: color || 'var(--brand)' }, title: kr(d.value) })),
      h('span', { className: 'msa-bar-label' }, d.label))));
  }

  // Shared month calendar (used on Dashboard + Calendar tab).
  // Includes ALL bookings — upcoming and archived/past.
  function MonthCalendar({ bookings, sel, onSelect, compact, year }) {
    const [cursor, setCursor] = useState(() => { const d = sel ? new Date(sel) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const Y = cursor.getFullYear(), M = cursor.getMonth();
    const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const todayStr = todayISO();
    const dayMap = useMemo(() => { const m = {}; bookings.forEach(b => { if (!b.arrival_date || !b.departure_date) { if (b.arrival_date) (m[b.arrival_date] = m[b.arrival_date] || []).push(b); return; } let d = new Date(b.arrival_date); const e = new Date(b.departure_date); let g = 0; while (d <= e && g++ < 400) { const k = d.toISOString().slice(0, 10); (m[k] = m[k] || []).push(b); d = new Date(d.getTime() + 864e5); } }); return m; }, [bookings]);

    if (year) {
      const miniMonth = (mi) => { const first = mondayOffset(new Date(Y, mi, 1)); const dim = new Date(Y, mi + 1, 0).getDate(); const cells = [];
        CAL_DOW_MINI.forEach((d, i) => cells.push(h('span', { key: 'h' + i, className: 'msa-yr-dow' }, d)));
        for (let i = 0; i < first; i++) cells.push(h('span', { key: 'e' + i, className: 'msa-yr-day empty' }));
        for (let d = 1; d <= dim; d++) { const k = new Date(Y, mi, d).toISOString().slice(0, 10); const items = dayMap[k] || []; const cnt = items.length;
          const st = cnt ? { background: bkColor(items[0]), color: '#fff', fontWeight: 700 } : null;
          cells.push(h('span', { key: d, className: 'msa-yr-day' + (k === todayStr ? ' today' : ''), style: st, onClick: () => onSelect && onSelect(k), title: cnt ? cnt + ' booking(s)' : '' }, d)); }
        return h('div', { key: mi, className: 'msa-yr-month' }, h('div', { className: 'msa-yr-name', onClick: () => onSelect && onSelect(new Date(Y, mi, 1).toISOString().slice(0, 10)) }, MON[mi]), h('div', { className: 'msa-yr-days' }, cells)); };
      return h('div', null,
        h('div', { className: 'msa-card-head' }, h('h3', null, String(Y)),
          h('div', { className: 'msa-cal-controls' }, h('button', { className: 'msa-icon-btn', onClick: () => setCursor(new Date(Y - 1, M, 1)) }, ICON.chevL()),
            h('button', { className: 'msa-btn msa-btn-sm', onClick: () => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); } }, 'This year'),
            h('button', { className: 'msa-icon-btn', onClick: () => setCursor(new Date(Y + 1, M, 1)) }, ICON.chevR()))),
        h('div', { className: 'msa-yr-grid msa-yr-grid-dash' }, MON.map((_, i) => miniMonth(i))));
    }

    const first = mondayOffset(new Date(Y, M, 1)); const dim = new Date(Y, M + 1, 0).getDate();
    const cells = [];
    CAL_DOW.forEach((d, i) => cells.push(h('div', { key: 'dow' + i, className: 'msa-cal-dow' }, d)));
    for (let i = 0; i < first; i++) cells.push(h('div', { key: 'e' + i, className: 'msa-cal-cell out' }));
    for (let d = 1; d <= dim; d++) { const k = new Date(Y, M, d).toISOString().slice(0, 10); const items = dayMap[k] || []; const cnt = items.length; const isToday = k === todayStr;
      cells.push(h('div', { key: d, className: 'msa-cal-cell' + (isToday ? ' is-today' : '') + (k === sel ? ' is-sel' : '') + (compact ? ' mini' : ''), onClick: () => onSelect && onSelect(k) },
        h('span', { className: 'msa-cal-num' }, d),
        cnt > 0 && h('span', { className: 'msa-cal-dot ' + (cnt > 1 ? 'multi' : 'single') }, cnt),
        cnt > 0 && h('div', { className: 'msa-cal-tip' },
          h('div', { className: 'msa-cal-tip-date' }, fmtDate(k)),
          items.slice(0, 6).map((b, i) => { const a = bkDayActs(b, k); return h('div', { key: i, className: 'msa-cal-tip-row' },
            h('span', { className: 'msa-key-dot', style: { background: bkColor(b) } }),
            h('div', { className: 'msa-cal-tip-txt' }, h('strong', null, b.client_name || '—'), a ? h('span', { className: 'msa-cal-tip-act' }, a) : null)); }),
          items.length > 6 && h('div', { className: 'msa-cal-tip-more' }, '+' + (items.length - 6) + ' more')))); }
    return h('div', null,
      h('div', { className: 'msa-card-head' }, h('h3', null, MON[M] + ' ' + Y),
        h('div', { className: 'msa-cal-controls' }, h('button', { className: 'msa-icon-btn', onClick: () => setCursor(new Date(Y, M - 1, 1)) }, ICON.chevL()),
          h('button', { className: 'msa-btn msa-btn-sm', onClick: () => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); onSelect && onSelect(todayISO()); } }, 'Today'),
          h('button', { className: 'msa-icon-btn', onClick: () => setCursor(new Date(Y, M + 1, 1)) }, ICON.chevR()))),
      h('div', { className: 'msa-cal-grid' + (compact ? ' mini' : '') }, cells));
  }

  // =====================================================================
  // DASHBOARD
  // =====================================================================
  // Admin-only indicator: is the partner connected, and what are they changing?
  function TeamActivity() {
    const [presence, setPresence] = useState([]);
    const [audit, setAudit] = useState([]);
    const load = useCallback(async () => {
      const sb = getSB(); if (!sb) return;
      const { data: pres } = await sb.from('staff_presence').select('*');
      const { data: aud } = await sb.from('admin_audit').select('*').order('created_at', { ascending: false }).limit(12);
      setPresence(pres || []); setAudit(aud || []);
    }, []);
    useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
    const now = Date.now();
    const partner = presence.find(p => p.role === 'partner');
    const online = partner && (now - new Date(partner.last_seen).getTime() < 120000);
    const editingNow = audit.length && audit[0].actor_role === 'partner' && (now - new Date(audit[0].created_at).getTime() < 120000);
    return h('div', { className: 'msa-card msa-team' },
      h('div', { className: 'msa-card-head' }, h('h3', null, ICON.clients(), ' Team activity'),
        h('span', { className: 'msa-team-status ' + (online ? 'on' : 'off') }, h('span', { className: 'msa-team-dot' }), online ? 'Partner connected' : 'Partner offline')),
      partner ? h('div', { className: 'msa-team-who' }, h('strong', null, partner.name || partner.email),
        h('span', { className: 'msa-dim' }, online ? ('Active now · ' + (partner.current_view || 'console')) : ('Last seen ' + (agoOf(partner.last_seen) || '?') + ' ago'))) : h('div', { className: 'msa-dim', style: { padding: '4px 0 10px' } }, 'No partner account yet — set one up in Settings.'),
      editingNow ? h('div', { className: 'msa-team-live' }, '● ' + (partner && partner.name || 'Partner') + ' is editing now: ' + (audit[0].action || '') + ' ' + (audit[0].entity || '')) : null,
      h('div', { className: 'msa-team-feed' }, audit.length === 0 ? h('div', { className: 'msa-empty' }, 'No changes logged yet.')
        : audit.map(a => h('div', { key: a.id, className: 'msa-team-row' + (a.actor_role === 'partner' ? ' partner' : '') },
            h('span', { className: 'msa-team-ago' }, agoOf(a.created_at)),
            h('span', { className: 'msa-team-act' }, (a.actor_role === 'partner' ? '👤 ' : '🛡️ ') + (a.action || '') + ' ' + (a.entity || '') + (a.detail ? ' — ' + a.detail : ''))))));
  }

  function Dashboard({ bookings, tasks, leads, clients, go, openBooking, reload }) {
    const isAdmin = isAdminRole();
    const [addTask, setAddTask] = useState(false);
    const [reqPop, setReqPop] = useState(false);
    // Compare on YYYY-MM-DD strings vs the LOCAL date so bookings arriving/leaving
    // "today" aren't dropped by the UTC-vs-local midnight offset.
    const _now = new Date();
    const T = _now.getFullYear() + '-' + String(_now.getMonth() + 1).padStart(2, '0') + '-' + String(_now.getDate()).padStart(2, '0');
    const dStr = (v) => (v || '').slice(0, 10);
    const activeList = bookings.filter(b => !b.archived && b.status !== 'cancelled' && b.arrival_date && b.departure_date && dStr(b.arrival_date) <= T && T <= dStr(b.departure_date))
      .sort((a, b) => dStr(a.departure_date).localeCompare(dStr(b.departure_date)));
    const active = activeList.length;
    const future = bookings.filter(b => !b.archived && b.arrival_date && dStr(b.arrival_date) > T && !['cancelled', 'completed'].includes(b.status)).sort((a, b) => dStr(a.arrival_date).localeCompare(dStr(b.arrival_date)));
    const past = bookings.filter(b => b.archived || ['completed', 'cancelled'].includes(b.status) || (b.departure_date && dStr(b.departure_date) < T)).length;
    const toggleTask = async (t, e) => { if (e) e.stopPropagation(); const done = t.status === 'completed'; await dbUpdate('tasks', t.id, done ? { status: 'pending', done_by: null, done_at: null } : { status: 'completed', done_by: CURRENT_EMAIL, done_at: new Date().toISOString() }); logAudit(done ? 'reopened task' : 'completed task', 'workspace', t.id, t.title); reload && reload(); };
    const revenue = bookings.reduce((s, b) => s + (+b.selling_price || 0), 0);
    const cost = bookings.reduce((s, b) => s + (+b.total_cost || 0), 0);
    const benefit = revenue - cost;
    const openTasks = tasks.filter(t => t.status !== 'completed');
    const newRequests = leads.filter(l => !l.routed_booking_id || true).slice(0, 5);
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    // finance figures for the charts
    const acc = bookings.reduce((s, b) => s + (+b.cost_accommodation || 0), 0);
    const tr = bookings.reduce((s, b) => s + (+b.cost_transportation || 0), 0);
    const ac = bookings.reduce((s, b) => s + (+b.cost_activities || 0), 0);
    const byMonth = {}; bookings.forEach(b => { if (!b.arrival_date) return; const k = b.arrival_date.slice(0, 7); byMonth[k] = (byMonth[k] || 0) + (+b.selling_price || 0); });
    const months = Object.keys(byMonth).sort().slice(-8).map(k => ({ label: k.slice(5) + '/' + k.slice(2, 4), value: byMonth[k] }));

    const kpi = (label, value, cls, tab) => h('button', { className: 'msa-kpi ' + cls, onClick: () => tab && go(tab) },
      h('span', { className: 'msa-kpi-label' }, label), h('span', { className: 'msa-kpi-value' }, value));

    return h(R.Fragment, null,
      addTask && h(TaskModal, { initial: {}, onClose: () => setAddTask(false), onSaved: () => { setAddTask(false); reload(); } }),
      reqPop && h('div', { className: 'msa-modal-backdrop', onClick: () => setReqPop(false) },
        h('div', { className: 'msa-modal', onClick: (e) => e.stopPropagation() },
          h('div', { className: 'msa-modal-head' }, h('h2', null, ICON.requests(), ' Latest requests'),
            h('div', null,
              h('button', { className: 'msa-btn msa-btn-primary', onClick: () => { setReqPop(false); go('requests'); } }, 'Open Requests page'),
              h('button', { className: 'msa-btn', onClick: () => setReqPop(false) }, 'Close'))),
          h('div', { className: 'msa-modal-body' },
            leads.length === 0 ? h('div', { className: 'msa-empty' }, 'No website requests yet.')
              : leads.slice(0, 25).map(l => h('button', { key: l.id, className: 'msa-line-item', style: { width: '100%' }, onClick: () => { setReqPop(false); go('requests'); } },
                  h('div', null, h('strong', null, l.name || l.email || 'Anonymous'),
                    reqTitle(l) ? h('span', { className: 'msa-text-brand', style: { marginLeft: 6, fontWeight: 600 } }, '· ' + reqTitle(l)) : null,
                    h('span', { className: 'msa-dim' }, ' · ' + reqKindLabel(l))),
                  h('span', { className: 'msa-dim' }, fmtDate(l.created_at))))))),
      h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' },
        h('div', null, h('h1', null, 'Dashboard'), h('p', null, 'Status for ' + today)),
        h('div', { className: 'msa-head-actions' },
          h('button', { className: 'msa-notif-btn', onClick: () => setReqPop(true), title: 'Latest requests' }, ICON.requests(), newRequests.length > 0 ? h('span', { className: 'msa-notif-badge' }, newRequests.length) : null),
          h('button', { className: 'msa-btn msa-btn-primary', onClick: () => openBooking({}) }, ICON.plus(), 'New Booking'))),

      // Top section — 4 equal stat boxes
      h('div', { className: 'msa-dash-top' },
        h('button', { className: 'msa-kpi msa-kpi-plain msa-kpi-dual', onClick: () => go('bookings') },
          h('span', { className: 'msa-kpi-label' }, 'Bookings'),
          h('div', { className: 'msa-kpi-dual-row' },
            h('div', null, h('span', { className: 'msa-kpi-value' }, active), h('span', { className: 'msa-kpi-sub' }, 'Active')),
            h('div', { className: 'msa-kpi-divider' }),
            h('div', null, h('span', { className: 'msa-kpi-value' }, future.length), h('span', { className: 'msa-kpi-sub' }, 'Upcoming')),
            h('div', { className: 'msa-kpi-divider' }),
            h('div', null, h('span', { className: 'msa-kpi-value' }, past), h('span', { className: 'msa-kpi-sub' }, 'Past')))),
        isAdmin ? kpi('Total Income', kr(revenue), 'msa-kpi-income', 'finance') : kpi('Clients', nf(clients.length), 'msa-kpi-plain', 'clients'),
        isAdmin ? kpi('Total Cost', kr(cost), 'msa-kpi-cost', 'finance') : kpi('Requests', nf(leads.length), 'msa-kpi-plain', 'requests'),
        isAdmin ? kpi('Total Benefit', kr(benefit), 'msa-kpi-benefit', 'finance') : kpi('Open tasks', nf(tasks.filter(t => t.status !== 'completed').length), 'msa-kpi-plain', 'tasks')),

      // Top section — 2 equal chart boxes (money — admin only)
      isAdmin ? h('div', { className: 'msa-dash-charts' },
        h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Cost breakdown'), h('button', { className: 'msa-link', onClick: () => go('finance') }, 'Finance →')),
          h('div', { className: 'msa-chart-row' }, h(Donut, { segments: [{ label: 'Accommodation', value: acc, color: '#e0432a' }, { label: 'Transportation', value: tr, color: '#0a84ff' }, { label: 'Activities', value: ac, color: '#34c759' }] }),
            h('div', { className: 'msa-legend' },
              h('div', null, h('span', { className: 'msa-dot', style: { background: '#e0432a' } }), 'Accommodation ', h('strong', null, kr(acc))),
              h('div', null, h('span', { className: 'msa-dot', style: { background: '#0a84ff' } }), 'Transportation ', h('strong', null, kr(tr))),
              h('div', null, h('span', { className: 'msa-dot', style: { background: '#34c759' } }), 'Activities ', h('strong', null, kr(ac)))))),
        h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Revenue by month'), h('button', { className: 'msa-link', onClick: () => go('finance') }, 'Finance →')),
          months.length ? h(Bars, { data: months }) : h('div', { className: 'msa-empty' }, 'No dated bookings.'))) : null,

      // Main row — calendar (left) + upcoming bookings / workspace stacked (right)
      h('div', { className: 'msa-dash-main' },
        h('div', { className: 'msa-card msa-dash-cal' },
          h(MonthCalendar, { bookings, sel: todayISO(), onSelect: () => go('calendar'), year: true }),
          h('div', { className: 'msa-cal-legend', style: { marginTop: 12 } }, h('span', null, h('i', { className: 'msa-lg msa-lg-today' }), 'Today'), h('span', null, h('i', { className: 'msa-lg msa-lg-single' }), 'Single booking'), h('span', null, h('i', { className: 'msa-lg msa-lg-multi' }), 'Multiple bookings'))),
        h('div', { className: 'msa-dash-side' },
          h('div', { className: 'msa-card msa-dash-box' },
            h('div', { className: 'msa-card-head' }, h('h3', { className: 'msa-h3-sm' }, ICON.bell(), ' Active & upcoming bookings'), h('button', { className: 'msa-link', onClick: () => go('bookings') }, 'All →')),
            h('div', { className: 'msa-dash-scroll' }, (activeList.length === 0 && future.length === 0) ? h('div', { className: 'msa-empty' }, 'No active or upcoming bookings.')
              : h('div', { className: 'msa-remind-list' },
                activeList.map(b => { const n = daysUntil(dStr(b.departure_date)); const act = bookingActivity(b);
                  return h('button', { key: 'a' + b.id, className: 'msa-remind msa-remind-live' + (act ? ' msa-remind-glow' : ''), onClick: () => openBooking(b) },
                    h('div', { className: 'msa-remind-cd msa-cd-live' }, h('strong', null, '●'), h('span', null, 'now')),
                    h('div', { className: 'msa-remind-body' }, h('strong', null, b.client_name),
                      act ? h('span', { className: 'msa-remind-act' }, act.label) : null,
                      h('span', { className: 'msa-dim' }, 'On trip · ' + (n === 0 ? 'ends today' : 'ends in ' + n + (n === 1 ? ' day' : ' days')) + ' · ' + ((b.adults || 0) + (b.kids || 0)) + ' pax')),
                    h('div', { className: 'msa-remind-meta' }, h('span', { className: 'msa-badge msa-st-live' }, 'On trip'), (isAdmin && +b.balance > 0) && h('span', { className: 'msa-text-red', style: { fontWeight: 600 } }, 'Owes ' + kr(b.balance)))); }),
                future.slice(0, 6).map(b => { const n = daysUntil(dStr(b.arrival_date)); const cd = n <= 30 ? 'msa-cd-soon' : 'msa-cd-far'; const act = bookingActivity(b);
                  return h('button', { key: b.id, className: 'msa-remind' + (act ? ' msa-remind-glow' : ''), onClick: () => openBooking(b) },
                    h('div', { className: 'msa-remind-cd ' + cd }, h('strong', null, n === 0 ? '•' : n), h('span', null, n === 0 ? 'today' : (n === 1 ? 'day' : 'days'))),
                    h('div', { className: 'msa-remind-body' }, h('strong', null, b.client_name),
                      act ? h('span', { className: 'msa-remind-act' }, act.label) : null,
                      h('span', { className: 'msa-dim' }, (b.arrival_city || '') + ' → ' + (b.departure_city || '') + ' · ' + (b.total_days || '?') + 'D · ' + ((b.adults || 0) + (b.kids || 0)) + ' pax')),
                    h('div', { className: 'msa-remind-meta' }, h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status]), (isAdmin && +b.balance > 0) && h('span', { className: 'msa-text-red', style: { fontWeight: 600 } }, 'Owes ' + kr(b.balance)))); })))),
          h('div', { className: 'msa-card msa-dash-box' },
            h('div', { className: 'msa-card-head' }, h('h3', null, ICON.tasks(), ' Workspace'),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                h('button', { className: 'msa-icon-btn', title: 'Add task', onClick: () => setAddTask(true) }, ICON.plus()),
                h('button', { className: 'msa-link', onClick: () => go('tasks') }, 'Open →'))),
            h('div', { className: 'msa-dash-scroll' }, openTasks.length === 0 ? h('div', { className: 'msa-empty' }, 'No shared tasks. Add one in the Workspace.')
              : openTasks.slice(0, 6).map(t => { const n = daysUntil((t.due || '').slice(0, 10)); const overdue = n != null && n < 0; const soon = n != null && n >= 0 && n <= 2;
                  return h('div', { key: t.id, className: 'msa-task-mini' },
                    h('button', { className: 'msa-check msa-check-sm', title: 'Mark done', onClick: (e) => toggleTask(t, e) }, ''),
                    h('div', { className: 'msa-task-mini-body', onClick: () => go('tasks'), style: { cursor: 'pointer' } }, h('span', null, t.title), h('span', { className: 'msa-dim ' + (overdue ? 'msa-text-red' : soon ? 'msa-text-orange' : '') }, (t.due ? fmtDate(t.due) : 'No due') + (overdue ? ' · Overdue' : soon ? ' · Due soon' : ''))),
                    h('span', { className: 'msa-ws-assignee msa-ws-' + (t.assigned_to || 'team') }, assignLabel(t.assigned_to))); }))))),

      // Team activity — moved to the bottom of the dashboard
      isAdmin ? h(TeamActivity, {}) : null));
  }

  // =====================================================================
  // BOOKING MODAL (full edit + itinerary builder + payments)
  // =====================================================================
  const EMPTY_BOOKING = { client_name: '', email: '', phone: '', nationality: '', address: '', lead_source: 'website', reference: '', arrival_city: 'Marrakech', departure_city: 'Marrakech', arrival_date: '', departure_date: '', total_nights: 0, total_days: 0, adults: 2, kids: 0, kids_ages: '', status: 'new', selling_price: 0, deposit_amount: 0, deposit_enabled: true, paid_amount: 0, balance: 0, cost_transportation: 0, cost_activities: 0, cost_accommodation: 0, total_cost: 0, sell_currency: 'NOK', cost_currency: 'MAD', fx_rate: '', collab_transport: '', collab_accommodation: '', collab_activities: '', cost_lines: [], daily_itinerary: [], included: [], excluded: [], internal_notes: '', special_requests: '', payment_method: '', archived: false };

  function BookingModal({ initial, onClose, onSaved, onView, suppliers }) {
    // Seed cost_lines from the legacy single-collaborator fields when editing an
    // older booking that doesn't have line items yet.
    const initCostLines = (init) => {
      if (init && Array.isArray(init.cost_lines) && init.cost_lines.length) return init.cost_lines;
      const out = [];
      if (init && +init.cost_transportation) out.push({ cat: 'transport', collab: init.collab_transport || '', amount: +init.cost_transportation });
      if (init && +init.cost_accommodation) out.push({ cat: 'accommodation', collab: init.collab_accommodation || '', amount: +init.cost_accommodation });
      if (init && +init.cost_activities) out.push({ cat: 'activities', collab: init.collab_activities || '', amount: +init.cost_activities });
      return out;
    };
    const [b, setB] = useState(() => ({ ...EMPTY_BOOKING, ...initial, daily_itinerary: (initial && initial.daily_itinerary) || [], included: (initial && initial.included) || [], excluded: (initial && initial.excluded) || [], cost_lines: initCostLines(initial) }));
    const [busy, setBusy] = useState(false);
    const [thread, setThread] = useState([]); const [reply, setReply] = useState('');
    const loadThread = useCallback(() => { const sb = getSB(); if (!sb || !initial || !initial.email) return; sb.from('messages').select('*').eq('client_email', initial.email).order('created_at', { ascending: true }).then(({ data }) => { setThread(data || []); const unread = (data || []).filter(x => x.sender === 'client' && !x.read_by_admin).map(x => x.id); if (unread.length) sb.from('messages').update({ read_by_admin: true }).in('id', unread); }); }, [initial && initial.id]);
    useEffect(() => { loadThread(); }, [loadThread]);
    const sendReply = async () => { const sb = getSB(); if (!reply.trim() || !sb || !initial || !initial.email) return; const body = reply.trim(); setReply(''); await sb.from('messages').insert({ client_email: initial.email, sender: 'admin', body, booking_id: initial.id, read_by_admin: true }); loadThread(); };

    // ---- Files & documents (Supabase Storage: booking-files/<bookingId>/…) ----
    const FILE_BUCKET = 'booking-files';
    const [files, setFiles] = useState([]);
    const [upBusy, setUpBusy] = useState(false);
    const loadFiles = useCallback(() => {
      const sb = getSB(); if (!sb || !initial || !initial.id) { setFiles([]); return; }
      sb.storage.from(FILE_BUCKET).list(String(initial.id), { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
        .then(({ data }) => setFiles((data || []).filter(f => f.name !== '.emptyFolderPlaceholder')));
    }, [initial && initial.id]);
    useEffect(() => { loadFiles(); }, [loadFiles]);
    const uploadFiles = async (fileList) => {
      const sb = getSB();
      if (!sb || !initial || !initial.id) { alert('Save the booking first, then you can upload files to it.'); return; }
      const list = Array.from(fileList || []); if (!list.length) return;
      setUpBusy(true);
      for (const file of list) {
        const safe = file.name.replace(/[^\w.\-]+/g, '_');
        const path = `${initial.id}/${Date.now()}-${safe}`;
        const { error } = await sb.storage.from(FILE_BUCKET).upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type || undefined });
        if (error) { alert('Upload failed (' + file.name + '): ' + error.message); }
      }
      setUpBusy(false);
      logAudit('uploaded file(s)', 'booking', initial.id, initial.client_name);
      loadFiles();
    };
    const delFile = async (name) => {
      const sb = getSB(); if (!sb || !initial || !initial.id) return;
      if (!confirm('Delete this file?')) return;
      await sb.storage.from(FILE_BUCKET).remove([`${initial.id}/${name}`]);
      logAudit('deleted file', 'booking', initial.id, name);
      loadFiles();
    };
    const openFile = (name) => openStorageFile(FILE_BUCKET, `${initial.id}/${name}`);
    const niceName = (n) => String(n || '').replace(/^\d{10,}-/, '');
    const fmtSize = (bytes) => { const n = +bytes || 0; if (!n) return ''; if (n < 1024) return n + ' B'; if (n < 1048576) return (n / 1024).toFixed(0) + ' KB'; return (n / 1048576).toFixed(1) + ' MB'; };
    const set = (k, v) => setB(p => ({ ...p, [k]: v }));
    // Add a whole number of days to a YYYY-MM-DD string (UTC-safe, no TZ drift).
    const addDaysISO = (iso, add) => {
      const p = String(iso || '').split('-'); if (p.length !== 3) return '';
      const d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); d.setUTCDate(d.getUTCDate() + add);
      return d.toISOString().slice(0, 10);
    };
    // Build `count` day cards from the arrival date, keeping any city/activities
    // already entered for days that still exist.
    const buildDays = (existing, arrival, count) => {
      const out = [];
      for (let i = 0; i < count; i++) {
        const prev = (existing && existing[i]) || {};
        out.push({ day: i + 1, city: prev.city || '', date: arrival ? addDaysISO(arrival, i) : (prev.date || ''), activities: prev.activities || [] });
      }
      return out;
    };
    // Picking arrival/departure in the calendar auto-fills nights, days AND the
    // day-by-day itinerary (one dated card per day).
    const setDate = (k, v) => setB(p => {
      const n = { ...p, [k]: v };
      const arr = k === 'arrival_date' ? v : p.arrival_date;
      const dep = k === 'departure_date' ? v : p.departure_date;
      if (arr && dep) {
        const nights = Math.max(0, Math.round((new Date(dep) - new Date(arr)) / 86400000));
        n.total_nights = nights;
        n.total_days = nights > 0 ? nights + 1 : 0;
        if (n.total_days > 0) n.daily_itinerary = buildDays(p.daily_itinerary, arr, n.total_days);
      }
      return n;
    });
    const setPrice = (v) => setB(p => ({ ...p, selling_price: v, deposit_amount: Math.round(v * 0.2), balance: v - (+p.paid_amount || Math.round(v * 0.2)) }));
    const setPaid = (v) => setB(p => ({ ...p, paid_amount: v, balance: (+p.selling_price || 0) - v }));
    // Cost lines — several collaborators (each with an amount) per category.
    const recalcCosts = (lines) => { const sum = (cat) => lines.filter(l => l.cat === cat).reduce((s, l) => s + (+l.amount || 0), 0); const ct = sum('transport'), ca = sum('accommodation'), cv = sum('activities'); return { cost_lines: lines, cost_transportation: ct, cost_accommodation: ca, cost_activities: cv, total_cost: ct + ca + cv }; };
    const addLine = (cat) => setB(p => { const nl = [...(p.cost_lines || []), { cat: cat, collab: '', amount: 0 }]; return { ...p, ...recalcCosts(nl) }; });
    const setLine = (idx, key, val) => setB(p => { const nl = (p.cost_lines || []).map((l, i) => i === idx ? { ...l, [key]: val } : l); return { ...p, ...recalcCosts(nl) }; });
    const delLine = (idx) => setB(p => { const nl = (p.cost_lines || []).filter((_, i) => i !== idx); return { ...p, ...recalcCosts(nl) }; });
    // Collaborators available for the cost-line dropdowns (incl. ones added inline here).
    const [extraSups, setExtraSups] = useState([]);
    const [collabModal, setCollabModal] = useState(null); // { lineIdx, defType } | null
    const allSups = [...(suppliers || []), ...extraSups];
    const addCollabLine = async (idx, defType) => {
      const name = (window.prompt('New collaborator name:') || '').trim(); if (!name) return;
      const res = await dbInsert('suppliers', { name: name, type: defType || 'activity' });
      if (res.error) { alert('Could not add: ' + res.error.message); return; }
      const row = res.data && res.data[0]; if (!row) return;
      setExtraSups(p => [...p, row]); setLine(idx, 'collab', row.id);
    };
    // Currency helpers (sell currency vs the currency you pay suppliers in)
    const sc = b.sell_currency || 'NOK', cc = b.cost_currency || 'MAD';
    const fx = parseFloat(b.fx_rate) || 0;            // 1 cost-currency unit = fx sell-currency units
    const sameCur = sc === cc;
    const costInSell = sameCur ? (+b.total_cost || 0) : (+b.total_cost || 0) * fx;
    const profitSell = (+b.selling_price || 0) - costInSell;
    const addDay = () => setB(p => ({ ...p, daily_itinerary: [...p.daily_itinerary, { day: p.daily_itinerary.length + 1, city: '', date: '', activities: [] }] }));
    const setDay = (i, k, v) => setB(p => { const a = [...p.daily_itinerary]; a[i] = { ...a[i], [k]: v }; return { ...p, daily_itinerary: a }; });
    const addAct = (i) => setB(p => { const a = [...p.daily_itinerary]; a[i] = { ...a[i], activities: [...(a[i].activities || []), { time: '09:00', type: 'Transport', details: '' }] }; return { ...p, daily_itinerary: a }; });
    const setAct = (di, ai, k, v) => setB(p => { const a = [...p.daily_itinerary]; const ac = [...a[di].activities]; ac[ai] = { ...ac[ai], [k]: v }; a[di] = { ...a[di], activities: ac }; return { ...p, daily_itinerary: a }; });
    const delAct = (di, ai) => setB(p => { const a = [...p.daily_itinerary]; const ac = [...a[di].activities]; ac.splice(ai, 1); a[di] = { ...a[di], activities: ac }; return { ...p, daily_itinerary: a }; });
    const delDay = (i) => setB(p => ({ ...p, daily_itinerary: p.daily_itinerary.filter((_, x) => x !== i).map((d, x) => ({ ...d, day: x + 1 })) }));
    // Keep the raw text (spaces & blank lines allowed); empties are dropped only at display/save time.
    const setList = (k, txt) => set(k, txt.split('\n'));
    // ── Auto-built hand-off notes to send to the driver & the hotel (copy to WhatsApp) ──
    const [collabCopied, setCollabCopied] = useState('');
    const collabPax = () => (+b.adults || 0) + (+b.kids || 0);
    const collabRoute = () => {
      const dests = (Array.isArray(b.daily_itinerary) ? b.daily_itinerary : []).map(d => d.city).filter(Boolean);
      const stops = [b.arrival_city, ...dests, b.departure_city].filter(Boolean);
      const seen = []; stops.forEach(s => { if (!seen.length || seen[seen.length - 1] !== s) seen.push(s); });
      return seen.join(' → ');
    };
    const buildCollab = (kind) => {
      const pax = collabPax();
      const dates = (b.arrival_date || '?') + ' → ' + (b.departure_date || '?');
      if (kind === 'transport') return [
        'MarrakechStory — TRANSPORT',
        'Dates: ' + dates,
        'Client: ' + (b.client_name || ''),
        'Phone: ' + (b.phone || ''),
        'People: ' + pax + (b.kids ? ' (' + (b.adults || 0) + ' adults + ' + b.kids + ' kids)' : ''),
        'Pickup address: ' + (b.address || '—'),
        'Driving / route: ' + (collabRoute() || (b.arrival_city || 'Marrakech')),
        'Arrival: ' + (b.arrival_city || 'Marrakech') + ' · ' + (b.arrival_date || '?') + ' · flight & time: ______',
        'Departure: ' + (b.departure_city || 'Marrakech') + ' · ' + (b.departure_date || '?') + ' · flight & time: ______',
      ].join('\n');
      return [
        'MarrakechStory — ACCOMMODATION',
        'Dates: ' + dates + (b.total_nights ? ' (' + b.total_nights + ' nights)' : ''),
        'Guest: ' + (b.client_name || ''),
        'Phone: ' + (b.phone || ''),
        'Guests: ' + pax + ' pax' + (b.kids ? ' (' + (b.adults || 0) + ' adults + ' + b.kids + ' kids)' : ''),
        'Rooms: ______',
      ].join('\n');
    };
    const [collabTx, setCollabTx] = useState(() => ({ transport: buildCollab('transport'), accommodation: buildCollab('accommodation') }));
    const rebuildCollab = () => setCollabTx({ transport: buildCollab('transport'), accommodation: buildCollab('accommodation') });
    const copyCollab = (kind) => { try { navigator.clipboard.writeText(collabTx[kind] || ''); setCollabCopied(kind); setTimeout(() => setCollabCopied(''), 2000); } catch (e) {} };
    // One age box per kid; stored as a comma-separated string in kids_ages.
    const kidAges = () => String(b.kids_ages || '').split(',').map(s => s.trim());
    const setKidAge = (idx, val) => setB(p => {
      const arr = String(p.kids_ages || '').split(',').map(s => s.trim());
      while (arr.length <= idx) arr.push('');
      arr[idx] = val;
      return { ...p, kids_ages: arr.slice(0, +p.kids || 0).join(', ') };
    });

    const save = async (closeAfter) => {
      if (!b.client_name.trim()) { alert('Client name is required'); return; }
      setBusy(true);
      const row = { ...b, reference: b.reference || ('MS-' + Math.random().toString(36).slice(2, 8).toUpperCase()), travelers: (+b.adults || 0) + (+b.kids || 0), updated_at: new Date().toISOString() };
      ['total_nights','total_days','adults','kids'].forEach(k => row[k] = +row[k] || 0);
      ['selling_price','deposit_amount','paid_amount','balance','cost_transportation','cost_activities','cost_accommodation','total_cost'].forEach(k => row[k] = +row[k] || 0);
      row.fx_rate = (row.fx_rate === '' || row.fx_rate == null) ? null : (parseFloat(row.fx_rate) || null);
      ['collab_transport','collab_accommodation','collab_activities'].forEach(k => { if (!row[k]) row[k] = null; });
      if (!row.arrival_date) delete row.arrival_date; if (!row.departure_date) delete row.departure_date;
      delete row.id; delete row.created_at; delete row.routed_booking_id;
      const res = b.id ? await dbUpdate('bookings', b.id, row) : await dbInsert('bookings', { ...row, created_by: CURRENT_EMAIL || LEGACY_ADMIN_EMAIL });
      setBusy(false);
      if (res.error) { alert('Save failed: ' + res.error.message); return; }
      logAudit(b.id ? 'updated booking' : 'created booking', 'booking', b.id || (res.data && res.data[0] && res.data[0].id), row.client_name || row.reference);
      onSaved(closeAfter);
    };

    const field = (label, k, type) => h('div', { className: 'msa-field' }, h('label', null, label), h('input', { type: type || 'text', value: b[k] == null ? '' : b[k], onChange: (e) => set(k, type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value) }));

    return h('div', { className: 'msa-modal-backdrop', onClick: onClose }, h('div', { className: 'msa-modal msa-modal-wide msa-modal-booking', onClick: (e) => e.stopPropagation() },
      h('div', { className: 'msa-modal-head' },
        h('div', { className: 'msa-bk-title' },
          h('h2', null, b.id ? 'Edit Booking' : 'New Booking', b.reference && h('span', { className: 'msa-ref-chip' }, b.reference)),
          h('p', { className: 'msa-bk-sub' }, b.id ? 'Trip, itinerary, pricing & documents' : 'Create a new client booking')),
        h('div', null,
          b.id && onView && h('button', { className: 'msa-btn', onClick: () => onView(b, 'itinerary') }, ICON.doc(), 'Itinerary'),
          b.id && onView && isAdminRole() && h('button', { className: 'msa-btn', onClick: () => onView(b, 'invoice') }, ICON.invoice(), 'Invoice'),
          h('button', { className: 'msa-btn', onClick: onClose }, 'Cancel'),
          h('button', { className: 'msa-btn msa-btn-primary', disabled: busy, onClick: () => save(true) }, busy ? 'Saving…' : 'Save'))),
      h('div', { className: 'msa-modal-body' },
        h('h4', { className: 'msa-section' }, 'Client'),
        h('div', { className: 'msa-grid-2' }, field('Full Name', 'client_name'), field('Email', 'email', 'email'), field('Phone', 'phone'), field('Nationality', 'nationality'),
          h('div', { className: 'msa-field' }, h('label', null, 'Lead Source'), h('select', { value: b.lead_source, onChange: (e) => set('lead_source', e.target.value) }, LEAD_SOURCES.map(s => h('option', { key: s, value: s }, s)))),
          field('Reference', 'reference'),
          h('div', { className: 'msa-field msa-field-wide' }, h('label', null, 'Address'), h('input', { type: 'text', value: b.address || '', placeholder: 'Street, city, postal code, country', onChange: (e) => set('address', e.target.value) }))),
        h('h4', { className: 'msa-section' }, 'Trip'),
        h('div', { className: 'msa-grid-2' }, field('Arrival City', 'arrival_city'), field('Departure City', 'departure_city'),
          h('div', { className: 'msa-field' }, h('label', null, 'Arrival Date'), h('input', { type: 'date', value: b.arrival_date || '', onChange: (e) => setDate('arrival_date', e.target.value) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Departure Date'), h('input', { type: 'date', value: b.departure_date || '', onChange: (e) => setDate('departure_date', e.target.value) })),
          field('Nights', 'total_nights', 'number'), field('Days', 'total_days', 'number'), field('Adults', 'adults', 'number'), field('Kids', 'kids', 'number')),
        (+b.kids > 0) && h('div', { className: 'msa-field msa-field-wide' }, h('label', null, 'Age of each child'),
          h('div', { className: 'msa-kid-ages' }, Array.from({ length: +b.kids || 0 }).map((_, i) =>
            h('label', { key: i, className: 'msa-kid-age' },
              h('span', { className: 'msa-kid-age-lbl' }, 'Child ' + (i + 1)),
              h('input', { type: 'number', min: 0, max: 17, placeholder: 'Age', value: kidAges()[i] || '', onChange: (e) => setKidAge(i, e.target.value) }))))),
        h('h4', { className: 'msa-section msa-section-row' }, h('span', null, 'Daily Itinerary'), h('button', { className: 'msa-btn msa-btn-sm msa-btn-primary', onClick: addDay }, ICON.plus(), 'Day')),
        h('div', { className: 'msa-day-grid' }, (b.daily_itinerary || []).map((day, di) => h('div', { key: di, className: 'msa-day-card' },
          h('div', { className: 'msa-day-head' }, h('span', { className: 'msa-day-num' }, day.day), h('button', { className: 'msa-icon-btn', onClick: () => delDay(di) }, ICON.trash())),
          h('input', { className: 'msa-day-in', placeholder: 'City', value: day.city || '', onChange: (e) => setDay(di, 'city', e.target.value) }),
          h('input', { className: 'msa-day-in', type: 'date', value: day.date || '', onChange: (e) => setDay(di, 'date', e.target.value) }),
          (day.activities || []).map((a, ai) => h('div', { key: ai, className: 'msa-act' },
            h('div', { className: 'msa-act-row' },
              h('label', { className: 'msa-act-time' }, h('span', { className: 'msa-act-time-lbl' }, 'Time'), h('input', { type: 'time', value: a.time, onChange: (e) => setAct(di, ai, 'time', e.target.value) })),
              h('select', { value: a.type, onChange: (e) => setAct(di, ai, 'type', e.target.value) }, ACTIVITY_TYPES.map(t => h('option', { key: t, value: t }, t))),
              h('button', { className: 'msa-icon-btn', onClick: () => delAct(di, ai) }, ICON.x())),
            h('input', { className: 'msa-day-in', placeholder: 'Details…', value: a.details, onChange: (e) => setAct(di, ai, 'details', e.target.value) }))),
          h('button', { className: 'msa-btn msa-btn-sm', onClick: () => addAct(di) }, '+ Activity')))),
        h('h4', { className: 'msa-section msa-section-row' }, h('span', null, 'Files & documents'),
          (initial && initial.id)
            ? h('label', { className: 'msa-btn msa-btn-sm msa-btn-primary msa-upload-label' }, ICON.plus(), upBusy ? 'Uploading…' : 'Upload',
                h('input', { type: 'file', multiple: true, disabled: upBusy, style: { display: 'none' }, onChange: (e) => { uploadFiles(e.target.files); e.target.value = ''; } }))
            : h('span', { className: 'msa-dim', style: { fontSize: 12, fontWeight: 400 } }, 'Save first to attach files')),
        (initial && initial.id) ? h('div', { className: 'msa-files' },
          files.length === 0
            ? h('div', { className: 'msa-dim', style: { padding: '6px 2px' } }, 'No files yet — upload contracts, vouchers, passports, PDFs or photos from your computer.')
            : files.map(f => h('div', { key: f.name, className: 'msa-file-row' },
                h('a', { className: 'msa-file-name', href: '#', onClick: (e) => { e.preventDefault(); openFile(f.name); } }, ICON.doc(), h('span', null, niceName(f.name))),
                h('span', { className: 'msa-file-size' }, fmtSize(f.metadata && f.metadata.size)),
                h('button', { className: 'msa-icon-btn', title: 'Delete file', onClick: () => delFile(f.name) }, ICON.trash())))) : null,
        isAdminRole() ? h('h4', { className: 'msa-section' }, 'Costs (internal)') : null,
        isAdminRole() ? (function () {
          const lines = Array.isArray(b.cost_lines) ? b.cost_lines : [];
          // One category block with several collaborator lines (amount + who).
          const catBlock = (cat, label, defType) => {
            const items = lines.map((l, i) => ({ l: l, i: i })).filter(x => x.l.cat === cat);
            return h('div', { className: 'msa-field msa-field-wide msa-cost-cat' },
              h('label', null, label + ' — ' + money(b['cost_' + (cat === 'transport' ? 'transportation' : cat)], cc)),
              items.map(({ l, i }) => h('div', { key: i, className: 'msa-costline-row' },
                h('input', { type: 'number', className: 'msa-costline-amt', placeholder: '0', value: l.amount || '', onChange: (e) => setLine(i, 'amount', parseFloat(e.target.value) || 0) }),
                h('select', { className: 'msa-costline-sel', value: l.collab || '', onChange: (e) => setLine(i, 'collab', e.target.value) },
                  h('option', { value: '' }, 'Collaborator…'),
                  allSups.map(s => h('option', { key: s.id, value: s.id }, s.name))),
                h('button', { className: 'msa-icon-btn msa-collab-add', title: 'Create a new collaborator', onClick: () => setCollabModal({ lineIdx: i, defType: defType }) }, ICON.plus()),
                h('button', { className: 'msa-icon-btn', title: 'Remove', onClick: () => delLine(i) }, ICON.trash()))),
              h('button', { className: 'msa-btn msa-btn-sm msa-addline', onClick: () => addLine(cat) }, ICON.plus(), 'Add ' + label.toLowerCase() + ' collaborator'));
          };
          return h('div', { className: 'msa-grid-2' },
            h('div', { className: 'msa-field' }, h('label', null, 'Cost currency (what you pay suppliers in)'), h('select', { value: cc, onChange: (e) => set('cost_currency', e.target.value) }, CURRENCIES.map(c => h('option', { key: c, value: c }, c)))),
            sameCur ? h('div', { className: 'msa-field' }, h('label', null, 'Exchange rate'), h('div', { className: 'msa-readout msa-dim' }, 'Same currency — no conversion'))
              : h('div', { className: 'msa-field' }, h('label', null, '1 ' + cc + ' = ? ' + sc), h('input', { type: 'number', step: '0.0001', placeholder: 'e.g. 0.95', value: b.fx_rate == null ? '' : b.fx_rate, onChange: (e) => set('fx_rate', e.target.value) })),
            catBlock('transport', 'Transport', 'driver'),
            catBlock('accommodation', 'Accommodation', 'hotel'),
            catBlock('activities', 'Activities', 'activity'),
            h('div', { className: 'msa-field' }, h('label', null, 'Total Cost (' + cc + ')'), h('div', { className: 'msa-readout msa-text-red' }, money(b.total_cost, cc))),
            h('div', { className: 'msa-field' }, h('label', null, 'Total Cost in ' + sc), h('div', { className: 'msa-readout msa-text-red' }, sameCur ? money(b.total_cost, sc) : (fx > 0 ? '≈ ' + money(costInSell, sc) : 'Set the exchange rate'))));
        })() : null,
        h('h4', { className: 'msa-section' }, isAdminRole() ? 'Pricing, Payment & Status' : 'Status'),
        isAdminRole() ? h('div', { className: 'msa-grid-2' },
          h('div', { className: 'msa-field' }, h('label', null, 'Selling currency'), h('select', { value: sc, onChange: (e) => set('sell_currency', e.target.value) }, CURRENCIES.map(c => h('option', { key: c, value: c }, c)))),
          h('div', { className: 'msa-field' }, h('label', null, 'Selling Price (' + sc + ')'), h('input', { type: 'number', value: b.selling_price || '', onChange: (e) => setPrice(parseFloat(e.target.value) || 0) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Deposit'),
            h('label', { className: 'msa-toggle' },
              h('input', { type: 'checkbox', checked: b.deposit_enabled !== false, onChange: (e) => set('deposit_enabled', e.target.checked) }),
              h('span', { className: 'msa-toggle-ui' }),
              h('span', { className: 'msa-toggle-lbl' }, (b.deposit_enabled !== false) ? ('Required · ' + money(b.deposit_amount || 0, sc)) : 'Not required'))),
          h('div', { className: 'msa-field' }, h('label', null, 'Status'), h('select', { value: b.status, onChange: (e) => set('status', e.target.value) }, STATUS_ORDER.map(s => h('option', { key: s, value: s }, STATUS_LABEL[s])))),
          h('div', { className: 'msa-field' }, h('label', null, 'Paid so far (' + sc + ')'), h('input', { type: 'number', value: b.paid_amount || '', onChange: (e) => setPaid(parseFloat(e.target.value) || 0) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Balance'), h('div', { className: 'msa-readout ' + ((+b.balance > 0) ? 'msa-text-red' : 'msa-text-green') }, money(b.balance, sc))),
          h('div', { className: 'msa-field' }, h('label', null, 'Payment Method'), h('select', { value: b.payment_method || 'Bank Transfer', onChange: (e) => set('payment_method', e.target.value) }, PAYMENT_METHODS.map(m => h('option', { key: m, value: m }, m)))),
          h('div', { className: 'msa-field msa-field-profit' }, h('label', null, 'Profit (' + sc + ')'), h('div', { className: 'msa-readout ' + (profitSell >= 0 ? 'msa-text-green' : 'msa-text-red') }, (!sameCur && !(fx > 0)) ? 'Set the exchange rate' : money(profitSell, sc))))
          : h('div', { className: 'msa-grid-2' }, h('div', { className: 'msa-field' }, h('label', null, 'Status'), h('select', { value: b.status, onChange: (e) => set('status', e.target.value) }, STATUS_ORDER.map(s => h('option', { key: s, value: s }, STATUS_LABEL[s])))), h('div', { className: 'msa-field' }, h('label', null, 'Payment'), h('div', { className: 'msa-readout msa-dim' }, 'Managed by admin'))),
        h('h4', { className: 'msa-section' }, 'Included / Not included (one per line)'),
        h('div', { className: 'msa-grid-2' },
          h('div', { className: 'msa-field' }, h('label', null, 'Included'), h('textarea', { rows: 4, value: (b.included || []).join('\n'), onChange: (e) => setList('included', e.target.value) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Not included'), h('textarea', { rows: 4, value: (b.excluded || []).join('\n'), onChange: (e) => setList('excluded', e.target.value) }))),
        h('h4', { className: 'msa-section' }, 'Notes'),
        h('div', { className: 'msa-field' }, h('label', null, 'Internal notes'), h('textarea', { rows: 2, value: b.internal_notes || '', onChange: (e) => set('internal_notes', e.target.value) })),
        h('div', { className: 'msa-field' }, h('label', null, 'Special requests'), h('textarea', { rows: 2, value: b.special_requests || '', onChange: (e) => set('special_requests', e.target.value) })),
        h('h4', { className: 'msa-section msa-section-row' }, h('span', null, 'Send to collaborators'), h('button', { type: 'button', className: 'msa-btn msa-btn-sm', onClick: rebuildCollab }, '↻ Rebuild from booking')),
        h('div', { className: 'msa-collab-send' },
          h('div', { className: 'msa-collab-box' },
            h('div', { className: 'msa-collab-box-head' }, h('span', { className: 'msa-collab-box-t' }, ICON.van ? ICON.van() : null, '🚗 Driver / transport'),
              h('button', { type: 'button', className: 'msa-btn msa-btn-sm msa-btn-primary', onClick: () => copyCollab('transport') }, collabCopied === 'transport' ? 'Copied ✓' : 'Copy')),
            h('textarea', { className: 'msa-collab-ta', rows: 9, value: collabTx.transport, onChange: (e) => setCollabTx(s => ({ ...s, transport: e.target.value })) })),
          h('div', { className: 'msa-collab-box' },
            h('div', { className: 'msa-collab-box-head' }, h('span', { className: 'msa-collab-box-t' }, '🏨 Accommodation'),
              h('button', { type: 'button', className: 'msa-btn msa-btn-sm msa-btn-primary', onClick: () => copyCollab('accommodation') }, collabCopied === 'accommodation' ? 'Copied ✓' : 'Copy')),
            h('textarea', { className: 'msa-collab-ta', rows: 9, value: collabTx.accommodation, onChange: (e) => setCollabTx(s => ({ ...s, accommodation: e.target.value })) }))),
        (initial && initial.id && initial.email) ? h('div', null,
          h('h4', { className: 'msa-section' }, 'Messages with client'),
          h('div', { className: 'msa-msg-thread' },
            thread.length === 0 ? h('div', { className: 'msa-dim', style: { padding: '8px 0' } }, 'No messages yet.')
            : thread.map(m => h('div', { key: m.id, className: 'msa-msg ' + (m.sender === 'admin' ? 'me' : 'them') },
                h('div', { className: 'msa-msg-bubble' }, m.body), h('div', { className: 'msa-msg-meta' }, (m.sender === 'admin' ? 'You' : (b.client_name || 'Client')) + ' · ' + fmtDateTime(m.created_at))))),
          h('div', { className: 'msa-msg-composer' },
            h('input', { value: reply, placeholder: 'Reply to the client…', onChange: (e) => setReply(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); sendReply(); } } }),
            h('button', { className: 'msa-btn msa-btn-primary', onClick: sendReply, disabled: !reply.trim() }, 'Send'))) : null),
      collabModal !== null ? h(CollaboratorModal, { initial: { type: collabModal.defType }, onClose: () => setCollabModal(null), onSaved: (savedRow) => { if (savedRow && savedRow.id) { setExtraSups(p => [...p, savedRow]); if (collabModal.lineIdx != null) setLine(collabModal.lineIdx, 'collab', savedRow.id); } setCollabModal(null); } }) : null));
  }

  // =====================================================================
  // DOC MODAL — Itinerary + Invoice, PDF export + print
  // =====================================================================
  // Export BOTH documents — itinerary (page 1) + invoice (page 2), ONE page each.
  // ROBUST against html2canvas's cross-browser quirks (it was clipping the left
  // edge and squishing to the mobile layout): each page is rendered CENTERED inside
  // a much wider white frame and captured at desktop windowWidth, so no edge can be
  // clipped; we then auto-crop the canvas to the real content bounds and fit that to
  // one A4 page. No reliance on exact pixel positioning.
  function exportPDF(filename, srcId) {
    const src = document.getElementById(srcId || 'msa-print-both'); if (!src) return;
    if (!window.html2pdf) { window.print(); return; }
    const pages = Array.prototype.slice.call(src.querySelectorAll('.msa-print-page'));
    if (!pages.length) return;
    const PAGEW = 794, SCALE = 2.5;
    // html2canvas shrink-wraps re-parsed/off-screen HTML to min-content (the "narrow
    // squished PDF" bug). It DOES render the live, styled element correctly — so we
    // briefly move the real print container on-screen (hidden behind a white cover)
    // and capture each page element directly, then restore it off-screen.
    const prevCss = src.style.cssText;
    const cover = document.createElement('div');
    cover.style.cssText = 'position:fixed; inset:0; background:#fff; z-index:2147483646;';
    const reveal = () => { document.body.appendChild(cover); src.style.cssText = 'position:fixed; top:0; left:0; width:' + PAGEW + 'px; background:#fff; z-index:2147483000;'; };
    const restore = () => { src.style.cssText = prevCss; try { cover.remove(); } catch (e) {} };
    pages.forEach((p) => p.querySelectorAll('details').forEach((d) => { d.open = true; }));
    const captureOne = (el) => new Promise((resolve) => {
      window.html2pdf().set({ html2canvas: { scale: SCALE, useCORS: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: -window.scrollY } })
        .from(el).toCanvas().get('canvas', (c) => resolve(c)).then(() => {}, () => resolve(null));
    });
    const waitReady = async () => {
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
      // Wait for logo/stamp images inside the print pages to finish loading.
      const imgs = Array.prototype.slice.call(src.querySelectorAll('img'));
      await Promise.all(imgs.map((im) => (im.complete && im.naturalWidth) ? null : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 2500); })));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    };
    const cropToContent = (canvas) => {
      const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
      const img = ctx.getImageData(0, 0, W, H).data;
      const rs = Math.max(1, Math.floor(H / 600)), thr = 244;
      let minX = W, maxX = 0, minY = H, maxY = 0;
      for (let y = 0; y < H; y += rs) {
        const b = y * W * 4;
        for (let x = 0; x < W; x++) {
          const i = b + x * 4;
          if (img[i] < thr || img[i + 1] < thr || img[i + 2] < thr) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < minX || maxY < minY) return canvas;
      const pad = Math.round(W * 0.006);
      minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
      maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
      const cw = maxX - minX + 1, ch = maxY - minY + 1;
      const o = document.createElement('canvas'); o.width = cw; o.height = ch;
      o.getContext('2d').drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
      return o;
    };
    setTimeout(async () => {
      reveal();
      await waitReady();
      const cropped = [];
      try { for (const el of pages) { const c = await captureOne(el); if (c) cropped.push(cropToContent(c)); } }
      finally { restore(); }
      if (!cropped.length) return;
      const tiny = document.createElement('div'); tiny.style.cssText = 'width:1px;height:1px;'; document.body.appendChild(tiny);
      window.html2pdf().set({ jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, html2canvas: { scale: 1 }, margin: 0 })
        .from(tiny).toPdf().get('pdf', (pdf) => {
          try { tiny.remove(); } catch (e) {}
          const PW = 210, PH = 297, M = 10; let first = true;
          cropped.forEach((c) => {
            if (!first) pdf.addPage(); first = false;
            const availW = PW - 2 * M, availH = PH - 2 * M;
            let w = availW, hh = (c.height / c.width) * w;
            if (hh > availH) { hh = availH; w = (c.width / c.height) * hh; }
            pdf.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', (PW - w) / 2, M, w, hh);
          });
          // Force a real file download (some browsers open pdf.save() in a tab instead).
          try {
            const blob = pdf.output('blob');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            setTimeout(() => { try { URL.revokeObjectURL(url); a.remove(); } catch (e) {} }, 1500);
          } catch (e) { pdf.save(filename); }
        }).then(() => {}, () => {});
    }, 250);
  }

  // Direct programmatic PDF (jsPDF) for a booking's itinerary + invoice. Draws text/lines,
  // so it downloads a real file that can NEVER be blank (unlike the DOM-rasterising html2canvas).
  async function buildBookingPdf(b, S, opts) {
    const J = window.jspdf && window.jspdf.jsPDF; if (!J) return null;
    const lang = (opts && opts.lang) || 'no';
    const curr = (opts && opts.curr) || (b && b.sell_currency) || 'NOK';
    const tr = (k) => (DOC_TR[k] && (DOC_TR[k][lang] || DOC_TR[k].en)) || k;
    const trAct = (ty) => (ACT_TR[ty] && (ACT_TR[ty][lang] || ty)) || ty;
    const trFmt = (k, vals) => { let s = tr(k); Object.keys(vals || {}).forEach((x) => { s = s.split('{' + x + '}').join(vals[x]); }); return s; };
    const m = (n) => money(n, curr);
    const S_ = S || {};
    const cName = S_.company_name || 'MarrakechStory SARL';
    const cPhone = S_.company_phone || COMPANY.phone;
    const cWeb = (S_.website_url || 'https://marrakechstory.com').replace(/^https?:\/\//, '');
    const doc = new J({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const MX = 42, CW = W - 2 * MX, BOTTOM = H - 64;
    const RED = [224, 67, 42], INK = [29, 29, 31], DIM = [130, 130, 138], LN = [228, 228, 232], GRN = [28, 122, 63];
    const loadImg = (src) => new Promise((res) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { try { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); res({ d: c.toDataURL('image/png'), w: im.naturalWidth, h: im.naturalHeight }); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = src; });
    const logo = await loadImg('assets/logo.png');
    const stamp = await loadImg('assets/stamp.png');
    let y = 52;
    // Standard PDF fonts are Latin-1 only — swap glyphs they can't draw (→, smart quotes…).
    const sx = (s) => String(s == null ? '' : s).replace(/→/g, '->').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...');
    const setF = (sz, style, c) => { doc.setFont('helvetica', style || 'normal'); doc.setFontSize(sz); const k = c || INK; doc.setTextColor(k[0], k[1], k[2]); doc.setCharSpace(0); };
    const draw = (c) => doc.setDrawColor(c[0], c[1], c[2]);
    const fill = (c) => doc.setFillColor(c[0], c[1], c[2]);
    const split = (s, w) => doc.splitTextToSize(sx(s), w);
    const T = (s, x, yy, o) => doc.text(Array.isArray(s) ? s.map(sx) : sx(s), x, yy, o);
    const ensure = (sp) => { if (y + sp > BOTTOM) { doc.addPage(); y = 52; } };
    const header = (kicker, title) => {
      y = 52;
      if (logo) { const lw = 42, lh = lw * logo.h / logo.w; doc.addImage(logo.d, 'PNG', W - MX - lw, y - 16, lw, lh); }
      setF(8.5, 'bold', RED); T(String(kicker).toUpperCase(), MX, y);
      y += 21; setF(24, 'bold', INK); T(title, MX, y);
      y += 9; draw(RED); doc.setLineWidth(2.5); doc.line(MX, y, MX + 44, y); y += 24;
    };
    const infoRow = (items) => {
      const n = items.length, colW = CW / n; let maxLines = 1;
      items.forEach((it, i) => { const x = MX + i * colW; setF(7.5, 'bold', DIM); T(String(it[0]).toUpperCase(), x, y);
        setF(9.5, 'bold', INK); const ls = split(it[1] == null || it[1] === '' ? '—' : it[1], colW - 8); if (ls.length > maxLines) maxLines = ls.length; T(ls, x, y + 13); });
      y += 18 + maxLines * 11; draw(LN); doc.setLineWidth(1); doc.line(MX, y, W - MX, y); y += 20;
    };
    const foot = () => { const fy = H - 40; draw(LN); doc.setLineWidth(1); doc.line(MX, fy - 12, W - MX, fy - 12);
      setF(9, 'normal', DIM); T(lang === 'no' ? (S_.invoice_footer || tr('foot_thanks')) : tr('foot_thanks'), MX, fy);
      T(cWeb + '  |  ' + cPhone, W - MX, fy, { align: 'right' }); };

    // ---------- ITINERARY (page 1) ----------
    header(tr('itin_kicker'), tr('itin_title'));
    infoRow([[tr('for'), b.client_name], [tr('trip'), (b.arrival_city || '') + ' -> ' + (b.departure_city || '')],
      [tr('dates'), fmtDate(b.arrival_date) + ' - ' + fmtDate(b.departure_date)],
      [tr('travelers'), ((b.adults || 0) + (b.kids || 0)) + ' ' + tr('persons')], [tr('ref'), b.reference]]);
    const days = Array.isArray(b.daily_itinerary) ? b.daily_itinerary : [];
    if (!days.length) { setF(10, 'normal', DIM); T(tr('no_itin'), MX, y); y += 20; }
    days.forEach((day, i) => {
      const acts = day.activities || [];
      const titleStr = tr('day') + ' ' + (day.day || i + 1) + (day.date ? (' · ' + fmtDate(day.date)) : '') + (day.city ? (' · ' + day.city) : '');
      setF(11, 'bold', INK); const tLines = split(titleStr, CW - 26);
      ensure(6 + tLines.length * 14 + acts.length * 20 + 14);
      fill(RED); doc.circle(MX + 7, y - 3, 8, 'F'); setF(9, 'bold', [255, 255, 255]); T(String(day.day || i + 1), MX + 7, y - 3, { align: 'center', baseline: 'middle' });
      setF(11, 'bold', INK); T(tLines, MX + 24, y); y += tLines.length * 14 + 2;
      acts.forEach((a) => {
        const dLines = a.details ? split(a.details, CW - 78) : [];
        ensure(14 + dLines.length * 11);
        setF(9, 'bold', RED); T(String(a.time || ''), MX + 24, y);
        setF(9.5, 'bold', INK); T(trAct(a.type || ''), MX + 78, y);
        if (dLines.length) { setF(9, 'normal', DIM); T(dLines, MX + 78, y + 12); y += 12 + (dLines.length - 1) * 11; }
        y += 16;
      });
      y += 10;
    });
    const inc = (b.included || []).filter((x) => x && String(x).trim());
    const exc = (b.excluded || []).filter((x) => x && String(x).trim());
    if (inc.length || exc.length) {
      const colW = CW / 2 - 10;
      setF(9, 'normal', INK);
      const incL = inc.map((it) => split('+  ' + it, colW)), excL = exc.map((it) => split('-  ' + it, colW));
      const colH = (arr) => arr.reduce((s, ls) => s + ls.length * 11 + 3, 0);
      ensure(20 + Math.max(colH(incL), colH(excL)));
      setF(9.5, 'bold', INK); if (inc.length) T(tr('included'), MX, y); if (exc.length) T(tr('not_included'), MX + CW / 2, y); y += 15;
      let yL = y, yR = y;
      setF(9, 'normal', GRN); incL.forEach((ls) => { T(ls, MX, yL); yL += ls.length * 11 + 3; });
      setF(9, 'normal', [180, 60, 45]); excL.forEach((ls) => { T(ls, MX + CW / 2, yR); yR += ls.length * 11 + 3; });
      y = Math.max(yL, yR) + 6;
    }
    foot();

    // ---------- INVOICE (page 2) ----------
    doc.addPage();
    header(tr('inv_kicker'), tr('inv_title'));
    const method = b.payment_method || 'Bank Transfer';
    infoRow([[tr('billed_to'), b.client_name], [tr('invoice_no'), (S_.invoice_prefix || 'INV') + '-' + ((b.reference || '').split('-').pop())],
      [tr('date'), new Date().toLocaleDateString(DOC_LOCALE[lang] || undefined)], [tr('method'), method], [tr('status'), STATUS_LABEL[b.status] || b.status]]);
    if (b.address || b.email || b.phone) {
      setF(8, 'bold', DIM); T(tr('bill_to').toUpperCase(), MX, y); y += 14;
      setF(12, 'bold', INK); T(String(b.client_name || ''), MX, y); y += 14;
      setF(9, 'normal', DIM); if (b.address) { const al = split(b.address, CW); T(al, MX, y); y += al.length * 12; }
      const cp = [b.email, b.phone].filter(Boolean).join('   ·   '); if (cp) { T(cp, MX, y); y += 12; } y += 10;
    }
    setF(8, 'bold', DIM); T(tr('description').toUpperCase(), MX, y); T(tr('amount').toUpperCase(), W - MX, y, { align: 'right' });
    y += 6; draw(LN); doc.setLineWidth(1); doc.line(MX, y, W - MX, y); y += 17;
    const sub = +b.selling_price || 0;
    setF(11, 'bold', INK); T(tr('package'), MX, y); T(m(sub), W - MX, y, { align: 'right' }); y += 14;
    setF(9, 'normal', DIM); T((b.total_nights || 0) + ' ' + tr('nights') + ': ' + (b.arrival_city || '') + ' -> ' + (b.departure_city || ''), MX, y); y += 12;
    T(((b.adults || 0) + (b.kids || 0)) + ' ' + tr('travelers_word'), MX, y); y += 24;
    const depEnabled = b.deposit_enabled !== false, depPct = +S_.deposit_pct || 20;
    const dep = depEnabled ? Math.round(sub * depPct / 100) : 0, paid = +b.paid_amount || 0;
    const restToPay = sub - dep, balance = paid > 0 ? (sub - paid) : restToPay;
    const tLX = W - MX - 180, tVX = W - MX;
    const totRow = (label, val, c, bold) => { setF(bold ? 11 : 10, bold ? 'bold' : 'normal', bold ? INK : DIM); T(label, tLX, y); setF(bold ? 12 : 10, bold ? 'bold' : 'normal', c || INK); T(val, tVX, y, { align: 'right' }); y += 16; };
    totRow(tr('total_amount'), m(sub), INK);
    if (depEnabled) totRow(tr('deposit_confirm') + ' (' + depPct + '%)', m(dep), RED);
    if (paid > 0) totRow(tr('paid'), '-' + m(paid), GRN);
    draw(INK); doc.setLineWidth(1.2); doc.line(tLX, y - 4, tVX, y - 4); y += 4;
    totRow(paid > 0 ? tr('balance_due') : tr('rest_to_pay'), m(balance), balance > 0 ? [200, 50, 40] : GRN, true);
    y += 8;
    const payNote = depEnabled ? trFmt('paynote_deposit', { dep: m(dep), pct: depPct, rest: m(sub - dep) }) : trFmt('paynote_full', { sub: m(sub) });
    setF(9, 'normal', DIM); const nl = split(payNote, CW - 20); const nh = nl.length * 12 + 16; fill([247, 247, 245]); doc.roundedRect(MX, y - 2, CW, nh, 4, 4, 'F'); setF(9, 'normal', [70, 70, 76]); T(nl, MX + 10, y + 12); y += nh + 18;
    const isBank = /bank|transfer|virement/i.test(method);
    const bank = isBank ? [[tr('bank_name'), S_.bank_name || 'BMCE Bank of Africa'], [tr('account_name'), S_.account_name || cName], ['RIB:', S_.rib || '011 450 0000 123456789012 34'], ['SWIFT:', S_.swift || 'BMCE MAMC']]
      : [[method + ':', S_.payment_info || S_.company_email || cPhone]];
    const boxH = 30 + bank.length * 14;
    ensure(boxH + 10);
    draw(LN); doc.setLineWidth(1); doc.roundedRect(MX, y, CW, boxH, 6, 6, 'S');
    let by = y + 20; setF(14, 'bold', INK); T(isBank ? tr('bank_details') : (tr('pay_via') + ' ' + method), MX + 14, by); by += 18;
    bank.forEach((row) => { setF(9, 'bold', DIM); T(String(row[0]), MX + 14, by); setF(9, 'normal', INK); T(String(row[1]), MX + 130, by); by += 14; });
    y += boxH + 16;
    if (S_.terms_conditions) {
      ensure(30); setF(9, 'bold', INK); T(tr('terms'), MX, y); y += 14;
      setF(8.5, 'normal', DIM); const tl = split(S_.terms_conditions, CW);
      tl.forEach((ln) => { ensure(11); T(ln, MX, y); y += 11; });
      y += 8;
    }
    if (stamp) { const sw = 118, sh = sw * stamp.h / stamp.w; const sy = Math.min(y + 6, BOTTOM - sh); doc.addImage(stamp.d, 'PNG', W - MX - sw, sy, sw, sh); }
    foot();
    return doc;
  }

  function DocModal({ booking, initialType, onClose, settings, onEdit }) {
    const [type, setType] = useState(initialType || 'itinerary');
    const [lang, setLang] = useState((booking && booking.doc_lang) || 'no');
    const [curr, setCurr] = useState((booking && booking.sell_currency) || 'NOK');
    const b = booking; const S = settings || {};
    // Translate a label key / an activity type / a template with {placeholders}.
    const t = (k) => (DOC_TR[k] && (DOC_TR[k][lang] || DOC_TR[k].en)) || k;
    const tAct = (ty) => (ACT_TR[ty] && (ACT_TR[ty][lang] || ty)) || ty;
    const tFmt = (k, vals) => { let s = t(k); Object.keys(vals || {}).forEach((x) => { s = s.split('{' + x + '}').join(vals[x]); }); return s; };
    // Exact date as dd.mm.yy for each itinerary day.
    const fmtDDMMYY = (iso) => { const p = String(iso || '').split('-'); if (p.length !== 3) return ''; return p[2].slice(0, 2) + '.' + p[1] + '.' + p[0].slice(2); };
    // ---- Documents attached to this booking (Supabase Storage: booking-files/<id>/…) ----
    const DOC_BUCKET = 'booking-files';
    const [docFiles, setDocFiles] = useState([]);
    const [docUpBusy, setDocUpBusy] = useState(false);
    const loadDocFiles = useCallback(() => {
      const sb = getSB(); if (!sb || !b || !b.id) { setDocFiles([]); return; }
      sb.storage.from(DOC_BUCKET).list(String(b.id), { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
        .then(({ data }) => setDocFiles((data || []).filter(f => f.name !== '.emptyFolderPlaceholder')));
    }, [b && b.id]);
    useEffect(() => { loadDocFiles(); }, [loadDocFiles]);
    const uploadDocs = async (fileList) => {
      const sb = getSB();
      if (!sb || !b || !b.id) { alert('This booking must be saved before attaching documents.'); return; }
      const list = Array.from(fileList || []); if (!list.length) return;
      setDocUpBusy(true);
      for (const file of list) {
        const safe = file.name.replace(/[^\w.\-]+/g, '_');
        const path = `${b.id}/${Date.now()}-${safe}`;
        const { error } = await sb.storage.from(DOC_BUCKET).upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type || undefined });
        if (error) alert('Upload failed (' + file.name + '): ' + error.message);
      }
      setDocUpBusy(false);
      logAudit('uploaded document(s)', 'booking', b.id, b.client_name);
      loadDocFiles();
    };
    const delDoc = async (name) => {
      const sb = getSB(); if (!sb || !b || !b.id) return;
      if (!confirm('Delete this document?')) return;
      await sb.storage.from(DOC_BUCKET).remove([`${b.id}/${name}`]);
      logAudit('deleted document', 'booking', b.id, name);
      loadDocFiles();
    };
    const openDoc = (name) => openStorageFile(DOC_BUCKET, `${b.id}/${name}`);
    const docNice = (n) => String(n || '').replace(/^\d{10,}-/, '');
    const docSize = (bytes) => { const n = +bytes || 0; if (!n) return ''; if (n < 1024) return n + ' B'; if (n < 1048576) return (n / 1024).toFixed(0) + ' KB'; return (n / 1048576).toFixed(1) + ' MB'; };
    const docBox = () => h('div', { className: 'msa-doc-docs msa-print-hide' },
      h('h3', null, 'Documents'),
      h('p', { className: 'msa-dim msa-doc-docs-hint' }, 'Vouchers, tickets, passports, contracts — any file. Click to open anytime.'),
      docFiles.length === 0
        ? h('div', { className: 'msa-docbox-empty' }, 'No documents attached yet. Use “Upload” at the top to add files from your computer.')
        : h('div', { className: 'msa-docbox' }, docFiles.map(f => h('div', { key: f.name, className: 'msa-docbox-item' },
            h('a', { className: 'msa-docbox-link', href: '#', onClick: (e) => { e.preventDefault(); openDoc(f.name); } }, ICON.doc(), h('span', null, docNice(f.name))),
            h('span', { className: 'msa-docbox-size' }, docSize(f.metadata && f.metadata.size)),
            h('button', { className: 'msa-icon-btn', title: 'Delete document', onClick: () => delDoc(f.name) }, ICON.trash())))));
    const cName = S.company_name || 'MarrakechStory SARL';
    const cPhone = S.company_phone || COMPANY.phone;
    const cWeb = (S.website_url || 'https://marrakechstory.com').replace(/^https?:\/\//, '');
    const logo = h('img', { src: 'assets/logo.png', alt: '', className: 'msa-doc-logo', crossOrigin: 'anonymous', onError: (e) => { e.target.style.display = 'none'; } });
    const itinerary = () => h('div', { className: 'msa-doc msa-doc-itin' },
      // Decorative travel-magazine header band
      h('div', { className: 'msa-itin-hero' },
        h('img', { src: 'assets/logo.png', alt: '', className: 'msa-itin-logo', crossOrigin: 'anonymous', onError: (e) => { e.target.style.display = 'none'; } }),
        h('span', { className: 'msa-itin-kicker' }, t('itin_kicker')),
        h('h1', { className: 'msa-itin-title' }, t('itin_title')),
        h('div', { className: 'msa-itin-rule', 'aria-hidden': 'true' })),
      // Trip info strip
      h('div', { className: 'msa-itin-info' },
        h('div', { className: 'msa-itin-info-cell' }, h('span', { className: 'msa-itin-info-k' }, t('for')), h('span', { className: 'msa-itin-info-v' }, b.client_name || '—')),
        h('div', { className: 'msa-itin-info-cell' }, h('span', { className: 'msa-itin-info-k' }, t('trip')), h('span', { className: 'msa-itin-info-v' }, (b.arrival_city || '') + ' → ' + (b.departure_city || ''))),
        h('div', { className: 'msa-itin-info-cell' }, h('span', { className: 'msa-itin-info-k' }, t('dates')), h('span', { className: 'msa-itin-info-v' }, fmtDate(b.arrival_date) + ' — ' + fmtDate(b.departure_date))),
        h('div', { className: 'msa-itin-info-cell' }, h('span', { className: 'msa-itin-info-k' }, t('travelers')), h('span', { className: 'msa-itin-info-v' }, ((b.adults || 0) + (b.kids || 0)) + ' ' + t('persons') + ' · ' + (b.total_nights || 0) + ' ' + t('nights'))),
        h('div', { className: 'msa-itin-info-cell' }, h('span', { className: 'msa-itin-info-k' }, t('ref')), h('span', { className: 'msa-itin-info-v' }, b.reference || '—'))),
      (function () {
        const days = (b.daily_itinerary || []);
        if (!days.length) return h('div', { className: 'msa-doc-days' }, h('p', { className: 'msa-dim' }, t('no_itin')));
        const renderDay = (day, i) => h('div', { key: i, className: 'msa-doc-day' },
          h('span', { className: 'msa-doc-daynum', 'aria-hidden': 'true' }, day.day),
          h('div', { className: 'msa-doc-day-card' },
            h('div', { className: 'msa-doc-day-head' },
              h('h3', null,
                t('day') + ' ' + day.day,
                day.date ? h('span', { className: 'msa-doc-day-date' }, ' · ' + fmtDDMMYY(day.date)) : null,
                day.city ? (' · ' + day.city) : '')),
            h('div', { className: 'msa-doc-acts' }, (day.activities || []).map((a, ai) => h('div', { key: ai, className: 'msa-doc-act' }, h('div', { className: 'msa-doc-time' }, a.time), h('div', { className: 'msa-doc-act-body' }, h('strong', null, tAct(a.type)), a.details ? h('p', null, a.details) : null))))));
        // ≤5 days reads best as one column; longer trips split into two balanced
        // columns (explicit flex, NOT CSS multi-column, which html2canvas can't render).
        if (days.length <= 5) return h('div', { className: 'msa-doc-days msa-doc-days-1' }, days.map(renderDay));
        const mid = Math.ceil(days.length / 2);
        return h('div', { className: 'msa-doc-days msa-doc-days-2' },
          h('div', { className: 'msa-doc-col' }, days.slice(0, mid).map(renderDay)),
          h('div', { className: 'msa-doc-col' }, days.slice(mid).map(renderDay)));
      })(),
      (function () {
        const inc = (b.included || []).filter(x => x && String(x).trim());
        const exc = (b.excluded || []).filter(x => x && String(x).trim());
        return (inc.length || exc.length) ? h('div', { className: 'msa-doc-incl' },
          inc.length ? h('div', { className: 'msa-incl-col' }, h('h3', null, t('included')), h('ul', { className: 'msa-incl-list' }, inc.map((x, i) => h('li', { key: i, className: 'msa-incl-yes' }, x)))) : null,
          exc.length ? h('div', { className: 'msa-incl-col' }, h('h3', null, t('not_included')), h('ul', { className: 'msa-incl-list' }, exc.map((x, i) => h('li', { key: i, className: 'msa-incl-no' }, x)))) : null) : null;
      })(),
      docBox(),
      h('div', { className: 'msa-doc-foot' }, h('p', null, lang === 'no' ? (S.invoice_footer || t('foot_thanks')) : t('foot_thanks')), h('p', null, cWeb + ' | ' + cPhone)));
    const invoice = () => {
      const m = (n) => money(n, curr);           // invoice amounts in the chosen currency
      const sub = +b.selling_price || 0;
      const paid = +b.paid_amount || 0;
      const depEnabled = b.deposit_enabled !== false;
      const depPct = +S.deposit_pct || 20;
      const dep = depEnabled ? Math.round(sub * depPct / 100) : 0;   // deposit is always depPct% of the total
      const restToPay = sub - dep;                                    // rest after the deposit
      const balanceHighlight = paid > 0 ? (sub - paid) : restToPay;   // if payments made, show real balance
      const method = b.payment_method || 'Bank Transfer';
      const isBank = /bank|transfer|virement/i.test(method);
      const isCash = /cash/i.test(method);
      const payRow = (k, v) => [h('span', { className: 'msa-dim' }, k), h('span', null, v || '—')];
      const paymentBox = isBank
        ? h('div', { className: 'msa-doc-bank' }, h('h3', null, t('bank_details')), h('div', { className: 'msa-bank-grid' },
            payRow(t('bank_name'), S.bank_name || 'BMCE Bank of Africa'), payRow(t('account_name'), S.account_name || cName),
            payRow('RIB:', S.rib || '011 450 0000 123456789012 34'), payRow('SWIFT:', S.swift || 'BMCE MAMC')))
        : isCash
        ? h('div', { className: 'msa-doc-bank' }, h('h3', null, t('cash_title')), h('div', { className: 'msa-bank-grid' },
            payRow(t('label_method'), t('cash_word')), payRow(t('label_when'), t('cash_when'))))
        : h('div', { className: 'msa-doc-bank' }, h('h3', null, t('pay_via') + ' ' + method), h('div', { className: 'msa-bank-grid' },
            payRow(method + ':', method === 'Revolut' ? (S.revolut || S.company_phone || cPhone)
              : method === 'Wise' ? (S.wise || S.company_email)
              : method === 'PayPal' ? (S.paypal || S.company_email)
              : (S.payment_info || S.company_email))));
      const payNote = depEnabled
        ? tFmt('paynote_deposit', { dep: m(dep), pct: depPct, rest: m(sub - dep) })
        : tFmt('paynote_full', { sub: m(sub) });
      const infoCell = (k, v) => h('div', { className: 'msa-itin-info-cell' }, h('span', { className: 'msa-itin-info-k' }, k), h('span', { className: 'msa-itin-info-v' }, v || '—'));
      return h('div', { className: 'msa-doc msa-doc-itin msa-doc-inv' },
        h('div', { className: 'msa-itin-hero' },
          h('img', { src: 'assets/logo.png', alt: '', className: 'msa-itin-logo', crossOrigin: 'anonymous', onError: (e) => { e.target.style.display = 'none'; } }),
          h('span', { className: 'msa-itin-kicker' }, t('inv_kicker')),
          h('h1', { className: 'msa-itin-title' }, t('inv_title')),
          h('div', { className: 'msa-itin-rule', 'aria-hidden': 'true' })),
        h('div', { className: 'msa-itin-info' },
          infoCell(t('billed_to'), b.client_name),
          infoCell(t('invoice_no'), (S.invoice_prefix || 'INV') + '-' + (b.reference || '').split('-').pop()),
          infoCell(t('date'), new Date().toLocaleDateString(DOC_LOCALE[lang] || undefined)),
          infoCell(t('method'), method),
          infoCell(t('status'), STATUS_LABEL[b.status] || b.status)),
        h('div', { className: 'msa-inv-body' },
          (b.address || b.email || b.phone) ? h('div', { className: 'msa-inv-billto' }, h('h3', null, t('bill_to')), h('p', { className: 'msa-doc-big' }, b.client_name), b.address ? h('p', { className: 'msa-dim' }, b.address) : null, ([b.email, b.phone].filter(Boolean).length ? h('p', { className: 'msa-dim' }, [b.email, b.phone].filter(Boolean).join('   ·   ')) : null)) : null,
          h('table', { className: 'msa-table msa-doc-table' }, h('thead', null, h('tr', null, h('th', null, t('description')), h('th', { className: 'msa-right' }, t('amount')))),
            h('tbody', null, h('tr', null, h('td', null, h('strong', null, t('package')), h('div', { className: 'msa-dim' }, (b.total_nights || 0) + ' ' + t('nights') + ': ' + (b.arrival_city || '') + ' → ' + (b.departure_city || '')), h('div', { className: 'msa-dim' }, ((b.adults || 0) + (b.kids || 0)) + ' ' + t('travelers_word'))), h('td', { className: 'msa-right' }, m(sub))))),
          h('div', { className: 'msa-doc-totals' },
            h('div', null, h('span', { className: 'msa-dim' }, t('total_amount')), h('span', null, m(sub))),
            depEnabled ? h('div', null, h('span', { className: 'msa-dim' }, t('deposit_confirm') + ' (' + depPct + '%)'), h('span', { className: 'msa-text-brand' }, m(dep))) : null,
            (paid > 0) ? h('div', null, h('span', { className: 'msa-dim' }, t('paid')), h('span', { className: 'msa-text-green' }, '-' + m(paid))) : null,
            h('div', { className: 'msa-doc-balance' }, h('span', null, paid > 0 ? t('balance_due') : t('rest_to_pay')), h('span', { className: (balanceHighlight > 0 ? 'msa-text-red' : 'msa-text-green') }, m(balanceHighlight)))),
          h('p', { className: 'msa-doc-paynote' }, payNote),
          paymentBox,
          S.terms_conditions ? h('details', { className: 'msa-doc-terms msa-doc-collapsible' }, h('summary', null, h('span', null, t('terms')), h('span', { className: 'msa-doc-chevron' }, '▾')), h('p', { className: 'msa-doc-terms-text' }, S.terms_conditions)) : null,
          // Company stamp / signature — sits in the empty space bottom-right, never over text.
          h('div', { className: 'msa-doc-sign' }, h('img', { src: 'assets/stamp.png', alt: '', className: 'msa-doc-stamp', crossOrigin: 'anonymous', onError: (e) => { e.target.style.display = 'none'; } }))),
        h('div', { className: 'msa-doc-foot' }, h('p', null, lang === 'no' ? (S.invoice_footer || t('foot_thanks')) : t('foot_thanks')), h('p', null, cWeb + ' | ' + cPhone))); };
    const fname = 'MarrakechStory-' + (type === 'invoice' ? 'Faktura' : 'Reiseplan') + '-' + (b.reference || 'MS') + '.pdf';
    // Native print-to-PDF — uses the browser's own renderer (never blank/squished, crisp
    // selectable text). Isolates #msa-print-both via body.ms-print-doc + the @media print CSS.
    const doPrint = () => {
      try { document.querySelectorAll('#msa-print-both details').forEach((d) => { d.open = true; }); } catch (e) {}
      const oldTitle = document.title;
      document.title = fname.replace(/\.pdf$/i, '');
      document.body.classList.add('ms-print-doc');
      let cleaned = false;
      const cleanup = () => { if (cleaned) return; cleaned = true; document.body.classList.remove('ms-print-doc'); document.title = oldTitle; window.removeEventListener('afterprint', cleanup); };
      window.addEventListener('afterprint', cleanup);
      // Give web fonts a beat to be ready, then open the print dialog.
      const go = () => { window.print(); setTimeout(cleanup, 1200); };
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(() => setTimeout(go, 60)); } else { setTimeout(go, 120); }
    };
    // Real file download built with jsPDF (never blank). Falls back to native print only if jsPDF is unavailable.
    const [dlBusy, setDlBusy] = useState(false);
    const downloadPdf = async () => {
      if (dlBusy) return; setDlBusy(true);
      try {
        const pdf = await buildBookingPdf(b, S, { lang, curr });
        if (!pdf) { doPrint(); return; }
        pdf.save(fname);
      } catch (e) { console.error('PDF build failed', e); doPrint(); }
      finally { setDlBusy(false); }
    };
    const docLabel = type === 'invoice' ? 'fakturaen' : 'reiseplanen';
    const shareSubject = 'MarrakechStory — ' + (type === 'invoice' ? 'Faktura' : 'Reiseplan') + (b.reference ? (' ' + b.reference) : '');
    const shareBody = 'Hei ' + (b.client_name || '') + ',\n\nVedlagt finner du ' + docLabel + ' for reisen din til ' + (b.arrival_city || 'Marokko') + '.'
      + '\nTa gjerne kontakt om du har spørsmål.\n\nVennlig hilsen,\nMarrakechStory\n' + cPhone + ' · ' + cWeb;
    const mailHref = 'mailto:' + encodeURIComponent(b.email || '') + '?subject=' + encodeURIComponent(shareSubject) + '&body=' + encodeURIComponent(shareBody);
    const waHref = waLink(b.phone) + '?text=' + encodeURIComponent(shareBody);
    return h('div', { className: 'msa-modal-backdrop', onClick: onClose }, h('div', { className: 'msa-modal msa-modal-doc', onClick: (e) => e.stopPropagation() },
      h('div', { className: 'msa-modal-head msa-print-hide msa-doc-topbar' },
        h('div', { className: 'msa-doc-head-left' },
          h('div', { className: 'msa-seg msa-seg-sm' }, h('button', { className: type === 'itinerary' ? 'active' : '', onClick: () => setType('itinerary') }, 'Itinerary'), isAdminRole() && h('button', { className: type === 'invoice' ? 'active' : '', onClick: () => setType('invoice') }, 'Invoice')),
          h('label', { className: 'msa-doc-pick', title: 'Document language' },
            ICON.globe ? ICON.globe() : null,
            h('select', { value: lang, onChange: (e) => setLang(e.target.value) }, DOC_LANGS.map(l => h('option', { key: l[0], value: l[0] }, l[1])))),
          (type === 'invoice' && isAdminRole()) ? h('label', { className: 'msa-doc-pick', title: 'Invoice currency' },
            h('select', { value: curr, onChange: (e) => setCurr(e.target.value) }, CURRENCIES.map(c => h('option', { key: c, value: c }, c)))) : null,
          (onEdit && b && b.id) ? h('button', { className: 'msa-btn msa-btn-sm msa-btn-primary msa-doc-edit', onClick: () => onEdit(b), title: 'Edit this trip' }, ICON.edit(), 'Edit') : null),
        h('div', { className: 'msa-doc-head-right' },
          h('label', { className: 'msa-btn msa-btn-sm msa-upload-label', title: 'Upload documents from your computer' }, ICON.pdf(), docUpBusy ? 'Uploading…' : 'Upload',
            h('input', { type: 'file', multiple: true, disabled: docUpBusy, style: { display: 'none' }, onChange: (e) => { uploadDocs(e.target.files); e.target.value = ''; } })),
          h('button', { className: 'msa-btn msa-btn-sm msa-btn-primary', onClick: () => exportPDF(fname), title: 'Download the itinerary + invoice as a PDF file' }, ICON.pdf(), 'Download PDF'),
          h('a', { className: 'msa-btn msa-btn-sm', href: mailHref, title: b.email ? ('Send via email to ' + b.email) : 'Compose email (no address on file)' }, ICON.requests(), 'Email'),
          h('a', { className: 'msa-btn msa-btn-sm', href: waHref, target: '_blank', title: b.phone ? ('Send via WhatsApp to ' + b.phone) : 'Send via WhatsApp' }, ICON.whatsapp(), 'WhatsApp'),
          h('button', { className: 'msa-btn msa-btn-sm msa-doc-close', onClick: onClose }, ICON.x()))),
      h('div', { className: 'msa-modal-body' },
        h('div', { id: 'msa-doc-preview' }, type === 'itinerary' ? itinerary() : invoice()),
        // Always rendered off-screen so Download/Print export BOTH documents,
        // itinerary on page 1 and invoice on page 2.
        h('div', { id: 'msa-print-both', className: 'msa-print-both', 'aria-hidden': 'true' },
          h('div', { className: 'msa-print-page' }, itinerary()),
          h('div', { className: 'msa-print-page msa-print-page-2' }, invoice())))));
  }

  // =====================================================================
  // BOOKINGS
  // =====================================================================
  function Bookings({ bookings, reload, settings, focusBooking, clearFocus, suppliers }) {
    const [edit, setEdit] = useState(null); const [doc, setDoc] = useState(null);
    const [q, setQ] = useState(''); const [statusF, setStatusF] = useState('all'); const [showFilters, setShowFilters] = useState(false);
    const [sort, setSort] = useState({ k: 'arrival_date', d: 'asc' }); const [expanded, setExpanded] = useState({}); const [archiveOpen, setArchiveOpen] = useState(false);
    // Opening a booking (e.g. from the dashboard) shows the itinerary document first;
    // the itinerary has an "Edit trip" button to jump into the full editor.
    useEffect(() => { if (focusBooking) { if (focusBooking.id) setDoc({ booking: focusBooking, type: 'itinerary' }); else setEdit(EMPTY_BOOKING); clearFocus && clearFocus(); } }, [focusBooking]);
    const isArch = (b) => b.archived || b.status === 'completed' || b.status === 'cancelled';
    const matchB = (b) => { if (statusF !== 'all' && b.status !== statusF) return false; if (!q) return true; return [b.client_name, b.reference, b.email, b.phone, b.arrival_date, b.departure_date, b.selling_price, b.total_cost, b.arrival_city].join(' ').toLowerCase().includes(q.toLowerCase()); };
    const val = (b, k) => k === 'profit' ? ((+b.selling_price || 0) - (+b.total_cost || 0)) : k === 'travelers' ? ((+b.adults || 0) + (+b.kids || 0)) : b[k];
    const sorter = (a, b) => { let x = val(a, sort.k), y = val(b, sort.k); if (typeof x === 'string') x = x.toLowerCase(); if (typeof y === 'string') y = y.toLowerCase(); if (x == null) x = ''; if (y == null) y = ''; if (x < y) return sort.d === 'asc' ? -1 : 1; if (x > y) return sort.d === 'asc' ? 1 : -1; return 0; };
    const active = bookings.filter(b => !isArch(b) && matchB(b)).sort(sorter);
    const archived = bookings.filter(b => isArch(b) && matchB(b)).sort(sorter);
    const toggleSort = (k) => setSort(s => s.k === k ? { k, d: s.d === 'asc' ? 'desc' : 'asc' } : { k, d: 'asc' });
    const archiveB = async (b, e) => { e.stopPropagation(); await dbUpdate('bookings', b.id, { archived: !b.archived }); reload(); };
    const del = async (b, e) => { e.stopPropagation(); if (confirm('Delete ' + (b.reference || b.client_name) + '?')) { await dbDelete('bookings', b.id); reload(); } };
    const exportCSV = () => { const rows = active.concat(archived); const head = ['Reference','Client','Email','Phone','Arrival','Departure','Travelers','Price','Cost','Profit','Status']; const esc = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
      const lines = [head.join(',')]; rows.forEach(b => lines.push([b.reference, b.client_name, b.email, b.phone, b.arrival_date, b.departure_date, (+b.adults || 0) + (+b.kids || 0), b.selling_price, b.total_cost, (+b.selling_price || 0) - (+b.total_cost || 0), STATUS_LABEL[b.status]].map(esc).join(',')));
      const blob = new Blob([lines.join('\n')], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'marrakechstory-bookings.csv'; a.click(); URL.revokeObjectURL(url); };

    const COLS = [['reference', 'Reference'], ['client_name', 'Client'], ['arrival_date', 'Dates'], ['travelers', 'Travelers'], ['selling_price', 'Price (NOK)'], ['total_cost', 'Cost (NOK)'], ['profit', 'Profit (NOK)'], ['status', 'Status']].filter(c => isAdminRole() || !['selling_price', 'total_cost', 'profit'].includes(c[0]));
    const headCell = (k, l) => h('th', { key: k, className: 'msa-th-sort' + (['selling_price','total_cost','profit'].includes(k) ? ' msa-right' : ''), onClick: () => toggleSort(k) }, l, h('span', { className: 'msa-sort-ar' }, sort.k === k ? (sort.d === 'asc' ? ' ↑' : ' ↓') : ''));
    const row = (b) => { const profit = (+b.selling_price || 0) - (+b.total_cost || 0); const n = daysUntil(b.arrival_date); const cd = n == null ? '' : (n === 0 ? 'msa-text-green' : (n > 0 && n <= 14 ? 'msa-text-orange' : n < 0 ? 'msa-dim' : 'msa-text-brand')); const ex = !!expanded[b.id]; const act = bookingActivity(b);
      // Row background by proximity: green = active/on-trip, orange = arriving within a month, red = further out.
      const _T = localDayStr(new Date()); const _a = dayOf(b.arrival_date), _dep = dayOf(b.departure_date);
      const onTrip = _a && _dep && _a <= _T && _T <= _dep && b.status !== 'cancelled';
      const tone = onTrip ? 'msa-bt-green' : (n != null && n >= 0 ? (n <= 30 ? 'msa-bt-orange' : 'msa-bt-red') : '');
      const main = h('tr', { key: b.id, className: 'msa-bt-row' + (ex ? ' open' : '') + (tone ? ' ' + tone : '') + (act ? ' msa-bt-glow' : ''), onClick: () => setExpanded(s => ({ ...s, [b.id]: !s[b.id] })) },
        h('td', { className: 'msa-bt-chev', 'data-label': '' }, act ? h('span', { className: 'msa-bt-glowdot', title: act.label }) : null, h('span', { className: 'msa-chevtog' }, ex ? '⌃' : '⌄')),
        h('td', { 'data-label': 'Reference' }, h('span', { className: 'msa-ref-chip' }, b.reference || '—')),
        h('td', { 'data-label': 'Client' }, h('strong', null, b.client_name), act ? h('span', { className: 'msa-bt-act' }, act.label) : null),
        h('td', { 'data-label': 'Dates' }, h('div', null, (b.arrival_date || '—') + ' to ' + (b.departure_date || '—')), n != null && h('div', { className: 'msa-cd-text ' + cd }, countdownLabel(b.arrival_date))),
        h('td', { 'data-label': 'Travelers' }, h('span', { className: 'msa-trav' }, ICON.clients(), (b.adults || 0) + (b.kids || 0))),
        isAdminRole() && h('td', { 'data-label': 'Price', className: 'msa-right' }, kr(b.selling_price)),
        isAdminRole() && h('td', { 'data-label': 'Cost', className: 'msa-right msa-text-red' }, kr(b.total_cost)),
        isAdminRole() && h('td', { 'data-label': 'Profit', className: 'msa-right' }, h('strong', { className: 'msa-text-green' }, kr(profit))),
        h('td', { 'data-label': 'Status' }, h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status])),
        h('td', { 'data-label': '', className: 'msa-right msa-actions' },
          h('button', { className: 'msa-icon-btn', title: 'Edit', onClick: (e) => { e.stopPropagation(); setEdit(b); } }, ICON.edit()),
          h('button', { className: 'msa-icon-btn', title: 'Itinerary PDF', onClick: (e) => { e.stopPropagation(); setDoc({ booking: b, type: 'itinerary' }); } }, ICON.doc()),
          isAdminRole() && h('button', { className: 'msa-icon-btn msa-ic-green', title: 'Invoice PDF', onClick: (e) => { e.stopPropagation(); setDoc({ booking: b, type: 'invoice' }); } }, ICON.invoice()),
          b.phone && h('a', { className: 'msa-icon-btn', title: 'WhatsApp', href: waLink(b.phone), target: '_blank', onClick: (e) => e.stopPropagation() }, ICON.whatsapp())));
      if (!ex) return main;
      const paid = +b.paid_amount || +b.deposit_amount || 0;
      const detail = h('tr', { key: b.id + '-d', className: 'msa-bt-detail' }, h('td', { colSpan: 10 },
        h('div', { className: 'msa-bt-detail-grid' },
          h('div', null, h('span', { className: 'msa-fin-k' }, 'Route & dates'), h('div', null, (b.arrival_city || '') + ' → ' + (b.departure_city || '')), h('div', { className: 'msa-dim' }, (b.total_nights || 0) + ' nights / ' + (b.total_days || 0) + ' days · ' + countdownLabel(b.arrival_date))),
          h('div', null, h('span', { className: 'msa-fin-k' }, 'Contact'), b.email && h('div', null, h('a', { href: 'mailto:' + b.email }, b.email)), b.phone && h('div', null, h('a', { href: waLink(b.phone), target: '_blank' }, b.phone)), h('div', { className: 'msa-dim' }, 'Source: ' + (b.lead_source || '—'))),
          isAdminRole() ? h('div', null, h('span', { className: 'msa-fin-k' }, 'Payment'), h('div', null, 'Paid ', h('strong', { className: 'msa-text-green' }, kr(paid))), h('div', null, 'Balance ', h('strong', { className: (+b.balance > 0 ? 'msa-text-red' : 'msa-text-green') }, kr(b.balance)))) : null,
          h('div', null, h('span', { className: 'msa-fin-k' }, 'Notes'), h('div', { className: 'msa-dim' }, b.internal_notes || b.special_requests || '—'))),
        h('div', { className: 'msa-bt-detail-actions' },
          h('button', { className: 'msa-btn msa-btn-sm msa-btn-primary', onClick: () => setEdit(b) }, ICON.edit(), 'Edit booking'),
          h('button', { className: 'msa-btn msa-btn-sm', onClick: () => setDoc({ booking: b, type: 'itinerary' }) }, ICON.doc(), 'Itinerary PDF'),
          isAdminRole() && h('button', { className: 'msa-btn msa-btn-sm', onClick: () => setDoc({ booking: b, type: 'invoice' }) }, ICON.invoice(), 'Invoice PDF'),
          h('button', { className: 'msa-btn msa-btn-sm', onClick: (e) => archiveB(b, e) }, b.archived ? 'Unarchive' : 'Archive'),
          h('button', { className: 'msa-btn msa-btn-sm', onClick: (e) => del(b, e) }, ICON.trash(), 'Delete'))));
      return [main, detail];
    };
    const table = (rows) => h('table', { className: 'msa-table msa-btable' }, h('thead', null, h('tr', null, h('th', { className: 'msa-bt-chev' }, ''), COLS.map(([k, l]) => headCell(k, l)), h('th', null, ''))), h('tbody', null, rows.map(row)));

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' }, h('div', null, h('h1', null, 'Bookings'), h('p', { className: 'msa-subtitle' }, 'Trips & inquiries management')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setEdit(EMPTY_BOOKING) }, ICON.plus(), 'New Booking')),
      h('div', { className: 'msa-searchbar' },
        h('div', { className: 'msa-searchbar-in' }, ICON.search(), h('input', { placeholder: 'Search bookings…', value: q, onChange: (e) => setQ(e.target.value) })),
        h('button', { className: 'msa-btn' + (showFilters ? ' msa-btn-on' : ''), onClick: () => setShowFilters(s => !s) }, ICON.requests(), 'Filters'),
        isAdminRole() && h('button', { className: 'msa-btn msa-btn-export', onClick: exportCSV }, ICON.pdf(), 'Export CSV')),
      showFilters && h('div', { className: 'msa-filterbar' }, h('label', null, 'Status'), h('select', { value: statusF, onChange: (e) => setStatusF(e.target.value) }, [h('option', { key: 'all', value: 'all' }, 'All statuses')].concat(STATUS_ORDER.map(s => h('option', { key: s, value: s }, STATUS_LABEL[s]))))),
      h('div', { className: 'msa-table-card' }, active.length === 0 ? h('div', { className: 'msa-empty' }, 'No active bookings.') : table(active),
        h('button', { className: 'msa-archive-bar', onClick: () => setArchiveOpen(o => !o) }, h('span', { className: 'msa-archive-count' }, archived.length), 'Past bookings archive', h('span', { className: 'msa-archive-chev' }, archiveOpen ? '⌃' : '⌄'))),
      archiveOpen && h('div', { className: 'msa-table-card', style: { marginTop: 14 } }, archived.length === 0 ? h('div', { className: 'msa-empty' }, 'No archived bookings.') : table(archived)),
      edit && h(BookingModal, { initial: edit.id ? edit : EMPTY_BOOKING, onClose: () => setEdit(null), onSaved: () => { setEdit(null); reload(); }, onView: (bk, t) => setDoc({ booking: bk, type: t }), suppliers }),
      doc && h(DocModal, { booking: doc.booking, initialType: doc.type, settings: settings, onClose: () => setDoc(null), onEdit: (bk) => { setDoc(null); setEdit(bk); } }));
  }

  // =====================================================================
  // CLIENTS
  // =====================================================================
  function Clients({ clients, bookings, reload, initialQuery }) {
    const [adding, setAdding] = useState(false); const [q, setQ] = useState(initialQuery || '');
    const [f, setF] = useState({ name: '', email: '', phone: '', country: '' });
    const [sort, setSort] = useState({ k: 'name', d: 'asc' }); const [expanded, setExpanded] = useState({});
    useEffect(() => { if (initialQuery) setQ(initialQuery); }, [initialQuery]);
    const add = async () => { if (!f.name.trim()) { alert('Name required'); return; } await dbInsert('clients', { ...f, email: f.email ? f.email.toLowerCase() : null, trips: 0, created_by: CURRENT_EMAIL || LEGACY_ADMIN_EMAIL }); setF({ name: '', email: '', phone: '', country: '' }); setAdding(false); reload(); };
    const del = async (c, e) => { e && e.stopPropagation(); if (confirm('Remove ' + c.name + '?')) { await dbDelete('clients', c.id); reload(); } };
    const bookingsFor = (c) => bookings.filter(b => (b.email && c.email && b.email.toLowerCase() === c.email.toLowerCase()) || b.client_name === c.name);
    const profitFor = (c) => bookingsFor(c).reduce((s, b) => s + ((+b.selling_price || 0) - (+b.total_cost || 0)), 0);
    const tripsFor = (c) => bookingsFor(c).length || c.trips || 0;
    const val = (c, k) => k === 'profit' ? profitFor(c) : k === 'trips' ? tripsFor(c) : c[k];
    const sorter = (a, b) => { let x = val(a, sort.k), y = val(b, sort.k); if (typeof x === 'string') x = x.toLowerCase(); if (typeof y === 'string') y = y.toLowerCase(); if (x == null) x = ''; if (y == null) y = ''; if (x < y) return sort.d === 'asc' ? -1 : 1; if (x > y) return sort.d === 'asc' ? 1 : -1; return 0; };
    const list = clients.filter(c => !q || [c.name, c.email, c.phone, c.country].join(' ').toLowerCase().includes(q.toLowerCase())).sort(sorter);
    const toggleSort = (k) => setSort(s => s.k === k ? { k, d: s.d === 'asc' ? 'desc' : 'asc' } : { k, d: 'asc' });
    const exportCSV = () => { const head = ['Name','Email','Phone','Country','Trips','Total Spent','Profit','Last Trip']; const esc = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
      const lines = [head.join(',')]; list.forEach(c => lines.push([c.name, c.email, c.phone, c.country, tripsFor(c), c.total_spent, profitFor(c), c.last_trip].map(esc).join(',')));
      const blob = new Blob([lines.join('\n')], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'marrakechstory-clients.csv'; a.click(); URL.revokeObjectURL(url); };
    const COLS = [['name', 'Client'], ['country', 'Country'], ['phone', 'Contact'], ['trips', 'Trips'], ['total_spent', 'Total Spent'], ['profit', 'Profit'], ['last_trip', 'Last Trip']].filter(c => isAdminRole() || !['total_spent', 'profit'].includes(c[0]));
    const headCell = (k, l) => h('th', { key: k, className: 'msa-th-sort' + (['total_spent','profit'].includes(k) ? ' msa-right' : ''), onClick: () => toggleSort(k) }, l, h('span', { className: 'msa-sort-ar' }, sort.k === k ? (sort.d === 'asc' ? ' ↑' : ' ↓') : ''));
    const row = (c) => { const profit = profitFor(c); const trips = tripsFor(c); const ex = !!expanded[c.id]; const cb = bookingsFor(c);
      const main = h('tr', { key: c.id, className: 'msa-bt-row' + (ex ? ' open' : ''), onClick: () => setExpanded(s => ({ ...s, [c.id]: !s[c.id] })) },
        h('td', { className: 'msa-bt-chev', 'data-label': '' }, h('span', { className: 'msa-chevtog' }, ex ? '⌃' : '⌄')),
        h('td', { 'data-label': 'Client' }, h('div', { className: 'msa-cl-name' }, h('span', { className: 'msa-avatar msa-avatar-sm' }, (c.name || '?').slice(0, 1).toUpperCase()), h('strong', null, c.name))),
        h('td', { 'data-label': 'Country' }, c.country || '—'),
        h('td', { 'data-label': 'Contact' }, c.phone ? h('a', { href: waLink(c.phone), target: '_blank', onClick: (e) => e.stopPropagation() }, c.phone) : (c.email || '—')),
        h('td', { 'data-label': 'Trips' }, trips),
        isAdminRole() && h('td', { 'data-label': 'Total Spent', className: 'msa-right' }, h('strong', { className: 'msa-text-brand' }, kr(c.total_spent))),
        isAdminRole() && h('td', { 'data-label': 'Profit', className: 'msa-right' }, h('strong', { className: 'msa-text-green' }, kr(profit))),
        h('td', { 'data-label': 'Last Trip' }, fmtDate(c.last_trip)),
        h('td', { 'data-label': '', className: 'msa-right msa-actions' },
          c.phone && h('a', { className: 'msa-icon-btn', title: 'WhatsApp', href: waLink(c.phone), target: '_blank', onClick: (e) => e.stopPropagation() }, ICON.whatsapp()),
          c.email && h('a', { className: 'msa-icon-btn', title: 'Email', href: 'mailto:' + c.email, onClick: (e) => e.stopPropagation() }, ICON.requests()),
          h('button', { className: 'msa-icon-btn', title: 'Delete', onClick: (e) => del(c, e) }, ICON.trash())));
      if (!ex) return main;
      const detail = h('tr', { key: c.id + '-d', className: 'msa-bt-detail' }, h('td', { colSpan: 9 },
        h('div', { className: 'msa-bt-detail-grid' },
          h('div', null, h('span', { className: 'msa-fin-k' }, 'Contact'), c.email && h('div', null, h('a', { href: 'mailto:' + c.email }, c.email)), c.phone && h('div', null, h('a', { href: waLink(c.phone), target: '_blank' }, c.phone))),
          isAdminRole() ? h('div', null, h('span', { className: 'msa-fin-k' }, 'Total spent'), h('div', null, h('strong', { className: 'msa-text-brand' }, kr(c.total_spent)))) : null,
          isAdminRole() ? h('div', null, h('span', { className: 'msa-fin-k' }, 'Profit generated'), h('div', null, h('strong', { className: 'msa-text-green' }, kr(profit)))) : null,
          h('div', null, h('span', { className: 'msa-fin-k' }, 'Trips'), h('div', null, trips + ' booking(s)'))),
        cb.length > 0 && h('div', { className: 'msa-cl-trips' }, cb.map(b => {
          const itin = Array.isArray(b.daily_itinerary) ? b.daily_itinerary : [];
          return h('div', { key: b.id, className: 'msa-cl-bk' },
            h('div', { className: 'msa-cl-bk-head', onClick: () => setExpanded(s => ({ ...s, ['itin-' + b.id]: !s['itin-' + b.id] })) },
              h('span', { className: 'msa-ref-chip' }, b.reference || '—'),
              h('span', { className: 'msa-cl-bk-route' }, (b.arrival_city || 'Marrakech') + ' → ' + (b.departure_city || 'Marrakech')),
              h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status]),
              isAdminRole() && h('span', { className: 'msa-text-brand', style: { fontWeight: 700 } }, kr(b.selling_price)),
              itin.length > 0 && h('span', { className: 'msa-cl-bk-chev' }, expanded['itin-' + b.id] ? '⌃' : '⌄')),
            h('div', { className: 'msa-cl-bk-sub' }, fmtDate(b.arrival_date) + ' → ' + fmtDate(b.departure_date) + ' · ' + (b.total_nights || 0) + 'N/' + (b.total_days || 0) + 'D · ' + ((b.adults || 0) + (b.kids || 0)) + ' pax' + (itin.length ? '' : ' · no itinerary yet')),
            (itin.length > 0 && expanded['itin-' + b.id]) ? h('div', { className: 'msa-cl-itin' }, itin.map((d, i) => h('div', { key: i, className: 'msa-cl-itin-day' },
              h('div', { className: 'msa-cl-itin-n' }, d.day || i + 1),
              h('div', { className: 'msa-cl-itin-body' },
                h('strong', null, (d.city || ('Day ' + (d.day || i + 1))) + (d.date ? ' · ' + fmtDate(d.date) : '')),
                (d.activities || []).map((a, ai) => h('div', { key: ai, className: 'msa-cl-itin-act' }, (a.time ? a.time + ' · ' : '') + (a.type || '') + (a.details ? ' — ' + a.details : ''))))))) : null,
            (b.internal_notes || b.special_requests) ? h('div', { className: 'msa-cl-bk-notes' }, b.internal_notes || b.special_requests) : null);
        }))));
      return [main, detail];
    };
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' }, h('div', null, h('h1', null, 'Clients'), h('p', { className: 'msa-subtitle' }, clients.length + ' clients · ' + kr(clients.reduce((s, c) => s + (+c.total_spent || 0), 0)) + ' lifetime value')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setAdding(a => !a) }, adding ? 'Close' : h('span', { className: 'msa-btn', style: { border: 'none', background: 'none', padding: 0, color: 'inherit' } }, ICON.plus(), 'Add Client'))),
      adding && h('div', { className: 'msa-card msa-inline-form' }, h('div', { className: 'msa-grid-4' },
        h('input', { placeholder: 'Full name', value: f.name, onChange: (e) => setF({ ...f, name: e.target.value }) }), h('input', { placeholder: 'Email', value: f.email, onChange: (e) => setF({ ...f, email: e.target.value }) }),
        h('input', { placeholder: 'Phone', value: f.phone, onChange: (e) => setF({ ...f, phone: e.target.value }) }), h('input', { placeholder: 'Country', value: f.country, onChange: (e) => setF({ ...f, country: e.target.value }) })),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: add }, 'Save Client')),
      h('div', { className: 'msa-searchbar' },
        h('div', { className: 'msa-searchbar-in' }, ICON.search(), h('input', { placeholder: 'Search clients…', value: q, onChange: (e) => setQ(e.target.value) })),
        isAdminRole() && h('button', { className: 'msa-btn msa-btn-export', onClick: exportCSV }, ICON.pdf(), 'Export CSV')),
      h('div', { className: 'msa-table-card' }, list.length === 0 ? h('div', { className: 'msa-empty' }, 'No clients found.')
        : h('table', { className: 'msa-table msa-btable' }, h('thead', null, h('tr', null, h('th', { className: 'msa-bt-chev' }, ''), COLS.map(([k, l]) => headCell(k, l)), h('th', null, ''))), h('tbody', null, list.map(row)))));
  }

  // =====================================================================
  // COLLABORATORS (confirmed + pending requests)
  // =====================================================================
  // Add / edit a collaborator — full details + document uploads (price lists, menus…)
  function CollaboratorModal({ initial, onClose, onSaved }) {
    const EMPTY = { name: '', type: 'hotel', city: '', contact: '', phone: '', phone2: '', email: '', rate: '', payment_terms: '', notes: '' };
    const [s, setS] = useState({ ...EMPTY, ...(initial || {}) });
    const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false);
    const BUCKET = 'booking-files';
    const [docs, setDocs] = useState([]); const [upBusy, setUpBusy] = useState(false);
    const set = (k, v) => setS(p => ({ ...p, [k]: v }));
    const loadDocs = useCallback(() => {
      const sb = getSB(); if (!sb || !s.id) { setDocs([]); return; }
      sb.storage.from(BUCKET).list('collab/' + s.id, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } }).then(({ data }) => setDocs(data || [])).catch(() => {});
    }, [s.id]);
    useEffect(() => { loadDocs(); }, [loadDocs]);
    const upload = async (fl) => {
      const sb = getSB(); if (!sb || !s.id) { alert('Save the collaborator first, then upload files.'); return; }
      const arr = Array.from(fl || []); if (!arr.length) return; setUpBusy(true);
      for (const f of arr) { const safe = f.name.replace(/[^\w.\-]+/g, '_'); const { error } = await sb.storage.from(BUCKET).upload('collab/' + s.id + '/' + Date.now() + '-' + safe, f, { cacheControl: '3600', contentType: f.type || undefined }); if (error) alert('Upload failed (' + f.name + '): ' + error.message); }
      setUpBusy(false); loadDocs();
    };
    const delDoc = async (name) => { const sb = getSB(); if (!sb || !s.id) return; if (!confirm('Delete this file?')) return; await sb.storage.from(BUCKET).remove(['collab/' + s.id + '/' + name]); loadDocs(); };
    const openDoc = (name) => openStorageFile(BUCKET, 'collab/' + s.id + '/' + name);
    const niceName = (n) => String(n || '').replace(/^\d{10,}-/, '');
    const save = async () => {
      if (!s.name.trim()) { alert('Name is required'); return; }
      setBusy(true);
      const row = { name: s.name, type: s.type, city: s.city, contact: s.contact, phone: s.phone, phone2: s.phone2, email: s.email, rate: s.rate, payment_terms: s.payment_terms, notes: s.notes };
      const res = s.id ? await dbUpdate('suppliers', s.id, row) : await dbInsert('suppliers', row);
      setBusy(false);
      if (res.error) { alert('Save failed: ' + res.error.message); return; }
      const savedRow = s.id ? { ...s } : (res.data && res.data[0]);
      if (!s.id && savedRow) setS(p => ({ ...p, id: savedRow.id }));
      setSaved(true); setTimeout(() => setSaved(false), 1800);
      onSaved && onSaved(savedRow);
    };
    const fld = (label, k, type, ph) => h('div', { className: 'msa-field' }, h('label', null, label), h('input', { type: type || 'text', value: s[k] == null ? '' : s[k], placeholder: ph || '', onChange: (e) => set(k, e.target.value) }));
    return h('div', { className: 'msa-modal-backdrop', onClick: onClose }, h('div', { className: 'msa-modal msa-modal-wide msa-modal-booking', onClick: (e) => e.stopPropagation() },
      h('div', { className: 'msa-modal-head' },
        h('div', { className: 'msa-bk-title' }, h('h2', null, s.id ? 'Edit Collaborator' : 'New Collaborator'), h('p', { className: 'msa-bk-sub' }, 'Partner details, contacts & documents')),
        h('div', null,
          saved ? h('span', { className: 'msa-text-green', style: { fontWeight: 700, alignSelf: 'center', marginRight: 6 } }, 'Saved ✓') : null,
          h('button', { className: 'msa-btn', onClick: onClose }, 'Close'),
          h('button', { className: 'msa-btn msa-btn-primary', disabled: busy, onClick: save }, busy ? 'Saving…' : 'Save'))),
      h('div', { className: 'msa-modal-body' },
        h('h4', { className: 'msa-section' }, 'Collaborator'),
        h('div', { className: 'msa-grid-2' },
          fld('Name', 'name', 'text', 'e.g. Riad Zeitoun'),
          h('div', { className: 'msa-field' }, h('label', null, 'Category'), h('select', { value: s.type, onChange: (e) => set('type', e.target.value) }, SUP_TYPES.map(([v, l]) => h('option', { key: v, value: v }, l)))),
          fld('City', 'city'), fld('Contact person', 'contact'),
          fld('Phone', 'phone'), fld('Second phone', 'phone2', 'text', 'optional'),
          fld('Email', 'email', 'email'), fld('Rate', 'rate', 'text', 'e.g. 1200 DH/night'),
          h('div', { className: 'msa-field msa-field-wide' }, h('label', null, 'Payment terms'), h('input', { type: 'text', value: s.payment_terms || '', placeholder: 'e.g. 50% deposit, balance on arrival', onChange: (e) => set('payment_terms', e.target.value) })),
          h('div', { className: 'msa-field msa-field-wide' }, h('label', null, 'Notes'), h('textarea', { rows: 2, value: s.notes || '', onChange: (e) => set('notes', e.target.value) }))),
        h('h4', { className: 'msa-section msa-section-row' }, h('span', null, 'Documents — price lists, menus, contracts'),
          s.id ? h('label', { className: 'msa-btn msa-btn-sm msa-btn-primary msa-upload-label' }, ICON.plus(), upBusy ? 'Uploading…' : 'Upload', h('input', { type: 'file', multiple: true, disabled: upBusy, style: { display: 'none' }, onChange: (e) => { upload(e.target.files); e.target.value = ''; } })) : h('span', { className: 'msa-dim', style: { fontSize: 12, fontWeight: 400 } }, 'Save first to attach files')),
        s.id ? h('div', { className: 'msa-files' }, docs.length === 0 ? h('div', { className: 'msa-dim', style: { padding: '6px 2px' } }, 'No documents yet — upload price lists, menus or contracts.') : docs.map(f => h('div', { key: f.name, className: 'msa-file-row' },
          h('a', { className: 'msa-file-name', href: '#', onClick: (e) => { e.preventDefault(); openDoc(f.name); } }, ICON.doc(), h('span', null, niceName(f.name))),
          h('button', { className: 'msa-icon-btn', title: 'Delete', onClick: () => delDoc(f.name) }, ICON.trash())))) : null)));
  }

  function Suppliers({ suppliers, bookings, leads, reload, seed, clearSeed }) {
    const [q, setQ] = useState(''); const [edit, setEdit] = useState(null); const [expanded, setExpanded] = useState({});
    const [sort, setSort] = useState({ k: 'typeLabel', d: 'asc' });
    useEffect(() => { if (seed) { setEdit({ type: 'hotel', ...seed }); clearSeed && clearSeed(); } }, [seed]);
    const typeLabel = (tp) => (SUP_TYPES.find(x => x[0] === tp) || [tp, tp])[1];
    const del = async (s, e) => { e && e.stopPropagation(); if (confirm('Remove ' + s.name + '?')) { await dbDelete('suppliers', s.id); reload(); } };
    const spendFor = (s) => { let total = 0; const hist = []; (bookings || []).forEach(b => { const amt = bookingCollabSpend(b).filter(l => l.collab === s.id).reduce((t, l) => t + l.amount, 0); if (amt > 0) { total += amt; hist.push({ b: b, amt: amt }); } }); return { total: total, hist: hist }; };
    const pending = (leads || []).filter(l => l.kind === 'collaboration');
    const addFromLead = (l) => { const p = l.payload || {}; setEdit({ type: 'hotel', name: l.name || '', city: l.country || '', contact: l.name || '', phone: l.phone || '', email: l.email || '', notes: (p.collaborationType ? 'Type: ' + p.collaborationType + '. ' : '') + (p.message || '') }); };
    const val = (s, k) => k === 'typeLabel' ? typeLabel(s.type) : k === 'spend' ? spendFor(s).total : k === 'bookings' ? spendFor(s).hist.length : s[k];
    const sorter = (a, b) => { let x = val(a, sort.k), y = val(b, sort.k); if (typeof x === 'string') x = x.toLowerCase(); if (typeof y === 'string') y = y.toLowerCase(); if (x == null) x = ''; if (y == null) y = ''; if (x < y) return sort.d === 'asc' ? -1 : 1; if (x > y) return sort.d === 'asc' ? 1 : -1; return 0; };
    const list = suppliers.filter(s => !q || [s.name, s.city, s.phone, s.phone2, s.email, s.type, typeLabel(s.type)].join(' ').toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => { const p = sorter(a, b); if (p !== 0) return p; const an = (a.name || '').toLowerCase(), bn = (b.name || '').toLowerCase(); return an < bn ? -1 : an > bn ? 1 : 0; });
    const toggleSort = (k) => setSort(s => s.k === k ? { k, d: s.d === 'asc' ? 'desc' : 'asc' } : { k, d: 'asc' });
    const COLS = [['name', 'Collaborator'], ['typeLabel', 'Category'], ['city', 'City'], ['phone', 'Contact'], ['bookings', 'Bookings'], ['spend', 'Total Spent']].filter(c => isAdminRole() || c[0] !== 'spend');
    const headCell = (k, l) => h('th', { key: k, className: 'msa-th-sort' + (k === 'spend' ? ' msa-right' : ''), onClick: () => toggleSort(k) }, l, h('span', { className: 'msa-sort-ar' }, sort.k === k ? (sort.d === 'asc' ? ' ↑' : ' ↓') : ''));
    const row = (s) => { const sp = isAdminRole() ? spendFor(s) : { total: 0, hist: [] }; const ex = !!expanded[s.id];
      const main = h('tr', { key: s.id, className: 'msa-bt-row' + (ex ? ' open' : ''), onClick: () => setExpanded(p => ({ ...p, [s.id]: !p[s.id] })) },
        h('td', { className: 'msa-bt-chev', 'data-label': '' }, h('span', { className: 'msa-chevtog' }, ex ? '⌃' : '⌄')),
        h('td', { 'data-label': 'Collaborator' }, h('div', { className: 'msa-cl-name' }, h('span', { className: 'msa-avatar msa-avatar-sm' }, (s.name || '?').slice(0, 1).toUpperCase()), h('strong', null, s.name))),
        h('td', { 'data-label': 'Category' }, h('span', { className: 'msa-badge msa-type' }, typeLabel(s.type))),
        h('td', { 'data-label': 'City' }, s.city || '—'),
        h('td', { 'data-label': 'Contact' }, s.phone ? h('a', { href: waLink(s.phone), target: '_blank', onClick: (e) => e.stopPropagation() }, s.phone) : (s.email || '—')),
        h('td', { 'data-label': 'Bookings' }, sp.hist.length),
        isAdminRole() && h('td', { 'data-label': 'Total Spent', className: 'msa-right' }, h('strong', { className: 'msa-text-brand' }, kr(sp.total))),
        h('td', { 'data-label': '', className: 'msa-right msa-actions' },
          s.phone && h('a', { className: 'msa-icon-btn', title: 'WhatsApp', href: waLink(s.phone), target: '_blank', onClick: (e) => e.stopPropagation() }, ICON.whatsapp()),
          s.email && h('a', { className: 'msa-icon-btn', title: 'Email', href: 'mailto:' + s.email, onClick: (e) => e.stopPropagation() }, ICON.requests()),
          h('button', { className: 'msa-icon-btn', title: 'Edit', onClick: (e) => { e.stopPropagation(); setEdit(s); } }, ICON.edit()),
          h('button', { className: 'msa-icon-btn', title: 'Delete', onClick: (e) => del(s, e) }, ICON.trash())));
      if (!ex) return main;
      const detail = h('tr', { key: s.id + '-d', className: 'msa-bt-detail' }, h('td', { colSpan: 8 },
        h('div', { className: 'msa-bt-detail-grid' },
          h('div', null, h('span', { className: 'msa-fin-k' }, 'Contact'),
            s.contact ? h('div', null, s.contact) : null,
            s.phone ? h('div', null, h('a', { href: waLink(s.phone), target: '_blank' }, s.phone)) : null,
            s.phone2 ? h('div', null, h('a', { href: waLink(s.phone2), target: '_blank' }, s.phone2)) : null,
            s.email ? h('div', null, h('a', { href: 'mailto:' + s.email }, s.email)) : null),
          (s.rate || s.payment_terms) ? h('div', null, h('span', { className: 'msa-fin-k' }, 'Terms'), s.rate ? h('div', null, 'Rate: ' + s.rate) : null, s.payment_terms ? h('div', { className: 'msa-dim' }, s.payment_terms) : null) : null,
          isAdminRole() ? h('div', null, h('span', { className: 'msa-fin-k' }, 'Total spent'), h('div', null, h('strong', { className: 'msa-text-brand' }, kr(sp.total))), h('div', { className: 'msa-dim' }, sp.hist.length + ' booking(s)')) : null,
          s.notes ? h('div', null, h('span', { className: 'msa-fin-k' }, 'Notes'), h('div', { className: 'msa-dim' }, s.notes)) : null),
        (isAdminRole() && sp.hist.length) ? h('div', { className: 'msa-cl-trips' }, sp.hist.map(({ b, amt }) => h('div', { key: b.id, className: 'msa-cl-bk' },
          h('div', { className: 'msa-cl-bk-head' },
            h('span', { className: 'msa-ref-chip' }, b.reference || '—'),
            h('span', { className: 'msa-cl-bk-route' }, b.client_name || ''),
            h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status]),
            h('span', { className: 'msa-text-brand', style: { fontWeight: 700 } }, kr(amt))),
          h('div', { className: 'msa-cl-bk-sub' }, fmtDate(b.arrival_date) + ' → ' + fmtDate(b.departure_date))))) : null));
      return [main, detail];
    };
    // Spend overview — total spend per category (donut) + top collaborators (bars). Admin only.
    const spendOverview = (function () {
      if (!isAdminRole()) return null;
      const perSup = suppliers.map(s => ({ s, total: spendFor(s).total })).filter(x => x.total > 0);
      const grand = perSup.reduce((t, x) => t + x.total, 0);
      if (!grand) return null;
      const catTotals = {}; SUP_CATS.forEach(([c]) => catTotals[c] = 0);
      perSup.forEach(({ s, total }) => { const c = SUP_CAT[s.type] || 'activities'; catTotals[c] += total; });
      const segments = SUP_CATS.map(([c, label]) => ({ label, value: catTotals[c], color: SUP_CAT_COLOR[c] })).filter(x => x.value > 0);
      const top = perSup.slice().sort((a, b) => b.total - a.total).slice(0, 8);
      const max = Math.max(1, ...top.map(x => x.total));
      return h('div', { className: 'msa-card msa-sup-spend' },
        h('div', { className: 'msa-card-head' }, h('h3', null, 'Spend overview'), h('span', { className: 'msa-dim' }, 'Total ' + kr(grand))),
        h('div', { className: 'msa-sup-spend-grid' },
          h('div', null, h('h4', { className: 'msa-sub' }, 'By category'),
            h('div', { className: 'msa-chart-row' }, h(Donut, { segments }),
              h('div', { className: 'msa-legend' }, segments.map((s, i) => h('div', { key: i },
                h('span', { className: 'msa-dot', style: { background: s.color } }), s.label + ' ', h('strong', null, kr(s.value)),
                h('span', { className: 'msa-dim', style: { marginLeft: 4 } }, '· ' + Math.round(s.value / grand * 100) + '%')))))),
          h('div', null, h('h4', { className: 'msa-sub' }, 'Top collaborators'),
            h('div', { className: 'msa-srcbars' }, top.map(({ s, total }, i) => h('div', { key: i, className: 'msa-srcbar' },
              h('span', { className: 'msa-srcbar-l' }, s.name),
              h('div', { className: 'msa-srcbar-track' }, h('div', { className: 'msa-srcbar-fill', style: { width: (total / max * 100) + '%', background: SUP_CAT_COLOR[SUP_CAT[s.type] || 'activities'] } })),
              h('span', { className: 'msa-srcbar-v' }, kr(total)))))) ));
    })();
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' }, h('div', null, h('h1', null, 'Collaborators'), h('p', { className: 'msa-subtitle' }, suppliers.length + ' partners · ' + pending.length + ' pending requests')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setEdit({ type: 'hotel' }) }, ICON.plus(), 'Add')),
      pending.length > 0 && h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Pending collaboration requests')),
        h('div', { className: 'msa-pending-list' }, pending.map(l => h('div', { key: l.id, className: 'msa-pending' },
          h('div', null, h('strong', null, l.name || l.email || 'Anonymous'), h('div', { className: 'msa-dim' }, [(l.payload && l.payload.collaborationType), l.email, l.phone].filter(Boolean).join(' · '))),
          h('button', { className: 'msa-btn msa-btn-sm msa-btn-primary', onClick: () => addFromLead(l) }, 'Add as collaborator'))))),
      h('div', { className: 'msa-searchbar' }, h('div', { className: 'msa-searchbar-in' }, ICON.search(), h('input', { placeholder: 'Search collaborators…', value: q, onChange: (e) => setQ(e.target.value) }))),
      list.length === 0 ? h('div', { className: 'msa-table-card' }, h('div', { className: 'msa-empty' }, 'No collaborators yet. Click “Add” to create one.'))
        : SUP_CATS.map(([cat, label]) => { const rows = list.filter(s => (SUP_CAT[s.type] || 'activities') === cat); if (!rows.length) return null;
            return h('div', { key: cat, className: 'msa-supcat' },
              h('div', { className: 'msa-supcat-head' }, h('h3', null, label), h('span', { className: 'msa-supcat-count' }, rows.length)),
              h('div', { className: 'msa-table-card' }, h('table', { className: 'msa-table msa-btable' }, h('thead', null, h('tr', null, h('th', { className: 'msa-bt-chev' }, ''), COLS.map(([k, l]) => headCell(k, l)), h('th', null, ''))), h('tbody', null, rows.map(row))))); }),
      spendOverview,
      edit !== null ? h(CollaboratorModal, { initial: edit, onClose: () => setEdit(null), onSaved: reload }) : null);
  }

  // =====================================================================
  // FINANCE (charts + breakdown)
  // =====================================================================
  function Finance({ bookings, suppliers }) {
    // Spend per collaborator: sum each booking cost line to its assigned collaborator.
    const collabSpend = (function () {
      const m = {};
      (bookings || []).forEach(b => {
        const seen = {};
        bookingCollabSpend(b).forEach(l => {
          if (!m[l.collab]) m[l.collab] = { total: 0, count: 0 };
          m[l.collab].total += l.amount;
          if (!seen[l.collab]) { m[l.collab].count += 1; seen[l.collab] = 1; }
        });
      });
      return Object.keys(m).map(id => { const s = (suppliers || []).find(x => x.id === id); return { id: id, name: s ? s.name : 'Unknown', type: s ? s.type : '', total: m[id].total, count: m[id].count }; }).sort((a, b) => b.total - a.total);
    })();
    const maxCollab = Math.max(1, ...collabSpend.map(c => c.total));
    const sales = bookings.reduce((s, b) => s + (+b.selling_price || 0), 0);
    const costs = bookings.reduce((s, b) => s + (+b.total_cost || 0), 0);
    const profit = sales - costs; const margin = sales > 0 ? profit / sales * 100 : 0;
    const acc = bookings.reduce((s, b) => s + (+b.cost_accommodation || 0), 0);
    const tr = bookings.reduce((s, b) => s + (+b.cost_transportation || 0), 0);
    const ac = bookings.reduce((s, b) => s + (+b.cost_activities || 0), 0);
    const byMonth = {}; bookings.forEach(b => { if (!b.arrival_date) return; const k = b.arrival_date.slice(0, 7); byMonth[k] = (byMonth[k] || 0) + (+b.selling_price || 0); });
    const months = Object.keys(byMonth).sort().slice(-8).map(k => ({ label: k.slice(5) + '/' + k.slice(2, 4), value: byMonth[k] }));
    const bySource = {}; bookings.forEach(b => { const k = b.lead_source || 'other'; bySource[k] = (bySource[k] || 0) + 1; });
    const sources = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
    const maxSrc = Math.max(1, ...sources.map(s => s[1]));
    // ── Benefit breakdown — average net profit per day / month / year, and the earning period ──
    const profitOf = (b) => (+b.selling_price || 0) - (+b.total_cost || 0);
    const datedB = bookings.filter(b => b.arrival_date);
    const dayKeys = datedB.map(b => b.arrival_date.slice(0, 10)).sort();
    const firstD = dayKeys[0] || null, lastD = dayKeys[dayKeys.length - 1] || null;
    const spanDays = firstD ? Math.max(1, Math.round((new Date(lastD) - new Date(firstD)) / 864e5) + 1) : 0;
    const perDay = spanDays ? profit / spanDays : 0;
    const perMonth = perDay * 30.44, perYear = perDay * 365.25;
    const byYearP = {}; datedB.forEach(b => { const y = b.arrival_date.slice(0, 4); byYearP[y] = (byYearP[y] || 0) + profitOf(b); });
    const yearsP = Object.keys(byYearP).sort();
    const maxYearP = Math.max(1, ...yearsP.map(y => Math.abs(byYearP[y])));
    const byMonthP = {}; datedB.forEach(b => { const k = b.arrival_date.slice(0, 7); byMonthP[k] = (byMonthP[k] || 0) + profitOf(b); });
    const monthsP = Object.keys(byMonthP).sort().slice(-12);
    const maxMonthP = Math.max(1, ...monthsP.map(k => Math.abs(byMonthP[k])));
    const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monLbl = (k) => MON3[+k.slice(5, 7) - 1] + ' ' + k.slice(2, 4);
    const fin = (label, value, cls, sub) => h('div', { className: 'msa-fin-card ' + (cls || '') }, h('span', { className: 'msa-kpi-label' }, label), h('span', { className: 'msa-fin-value' }, value), sub && h('span', { className: 'msa-dim' }, sub));
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Finance'), h('p', null, 'Revenue, costs and profitability · ' + bookings.length + ' bookings')),
      h('div', { className: 'msa-fin-grid' }, fin('Total Revenue', kr(sales), 'msa-kpi-income', bookings.length + ' bookings'), fin('Total Costs', kr(costs), 'msa-kpi-cost', 'operational'), fin('Net Profit', kr(profit), 'msa-kpi-benefit', margin.toFixed(1) + '% margin')),

      // Benefit breakdown — average earnings per day / month / year + earning period
      h('div', { className: 'msa-card msa-fin-breakdown' },
        h('div', { className: 'msa-card-head' }, h('h3', null, 'Benefit breakdown'),
          firstD ? h('span', { className: 'msa-dim' }, 'From ' + fmtDate(firstD) + (lastD && lastD !== firstD ? (' to ' + fmtDate(lastD)) : '') + ' · ' + spanDays + ' days') : null),
        firstD ? h(R.Fragment, null,
          h('div', { className: 'msa-fin-grid' },
            fin('Per day', kr(perDay), 'msa-kpi-benefit', 'avg net profit'),
            fin('Per month', kr(perMonth), 'msa-kpi-benefit', 'avg net profit'),
            fin('Per year', kr(perYear), 'msa-kpi-benefit', 'avg net profit')),
          h('div', { className: 'msa-cols msa-cols-12', style: { marginTop: 16 } },
            h('div', null, h('div', { className: 'msa-fin-k', style: { marginBottom: 8 } }, 'Net profit by year'),
              h('div', { className: 'msa-srcbars' }, yearsP.map((yy, i) => { const v = byYearP[yy]; return h('div', { key: i, className: 'msa-srcbar' },
                h('span', { className: 'msa-srcbar-l' }, yy), h('div', { className: 'msa-srcbar-track' }, h('div', { className: 'msa-srcbar-fill', style: { width: (Math.abs(v) / maxYearP * 100) + '%', background: v >= 0 ? '#34c759' : '#e0432a' } })),
                h('span', { className: 'msa-srcbar-v' }, kr(v))); }))),
            h('div', null, h('div', { className: 'msa-fin-k', style: { marginBottom: 8 } }, 'Net profit by month'),
              h('div', { className: 'msa-srcbars' }, monthsP.map((k, i) => { const v = byMonthP[k]; return h('div', { key: i, className: 'msa-srcbar' },
                h('span', { className: 'msa-srcbar-l' }, monLbl(k)), h('div', { className: 'msa-srcbar-track' }, h('div', { className: 'msa-srcbar-fill', style: { width: (Math.abs(v) / maxMonthP * 100) + '%', background: v >= 0 ? '#34c759' : '#e0432a' } })),
                h('span', { className: 'msa-srcbar-v' }, kr(v))); })))))
          : h('div', { className: 'msa-empty' }, 'No dated bookings yet — add arrival dates to see your earning rate.')),

      h('div', { className: 'msa-cols msa-cols-12' },
        h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Cost breakdown')),
          h('div', { className: 'msa-chart-row' }, h(Donut, { segments: [{ label: 'Accommodation', value: acc, color: '#e0432a' }, { label: 'Transportation', value: tr, color: '#0a84ff' }, { label: 'Activities', value: ac, color: '#34c759' }] }),
            h('div', { className: 'msa-legend' },
              h('div', null, h('span', { className: 'msa-dot', style: { background: '#e0432a' } }), 'Accommodation ', h('strong', null, kr(acc))),
              h('div', null, h('span', { className: 'msa-dot', style: { background: '#0a84ff' } }), 'Transportation ', h('strong', null, kr(tr))),
              h('div', null, h('span', { className: 'msa-dot', style: { background: '#34c759' } }), 'Activities ', h('strong', null, kr(ac)))))),
        h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Revenue by month')), months.length ? h(Bars, { data: months }) : h('div', { className: 'msa-empty' }, 'No dated bookings.'))),
      h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Lead sources')),
        h('div', { className: 'msa-srcbars' }, sources.map(([k, v], i) => h('div', { key: i, className: 'msa-srcbar' }, h('span', { className: 'msa-srcbar-l' }, k), h('div', { className: 'msa-srcbar-track' }, h('div', { className: 'msa-srcbar-fill', style: { width: (v / maxSrc * 100) + '%' } })), h('span', { className: 'msa-srcbar-v' }, v))))),
      h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Spend by collaborator'), h('span', { className: 'msa-dim' }, collabSpend.length + ' partners')),
        collabSpend.length === 0
          ? h('div', { className: 'msa-empty' }, 'Assign collaborators to booking cost lines (Transport / Accommodation / Activities) to track spend here.')
          : h('div', { className: 'msa-srcbars' }, collabSpend.map((c, i) => h('div', { key: i, className: 'msa-srcbar' },
              h('span', { className: 'msa-srcbar-l', title: c.name }, c.name), h('div', { className: 'msa-srcbar-track' }, h('div', { className: 'msa-srcbar-fill', style: { width: (c.total / maxCollab * 100) + '%' } })),
              h('span', { className: 'msa-srcbar-v' }, kr(c.total) + ' · ' + c.count))))),
      h('div', { className: 'msa-card msa-card-flush' }, h('div', { className: 'msa-card-head msa-pad' }, h('h3', null, 'Breakdown by booking')),
        h('table', { className: 'msa-table' }, h('thead', null, h('tr', null, ['Reference','Client','Price','Cost','Profit','Margin','Status'].map((c, i) => h('th', { key: i, className: i >= 2 && i <= 5 ? 'msa-right' : '' }, c)))),
          h('tbody', null, bookings.slice().sort((a, b) => (+b.selling_price || 0) - (+a.selling_price || 0)).map(b => { const s = +b.selling_price || 0, c = +b.total_cost || 0, p = s - c;
            return h('tr', { key: b.id },
              h('td', { 'data-label': 'Reference' }, h('span', { className: 'msa-ref-chip' }, b.reference || '—')), h('td', { 'data-label': 'Client' }, b.client_name),
              h('td', { 'data-label': 'Price', className: 'msa-right' }, kr(s)), h('td', { 'data-label': 'Cost', className: 'msa-right msa-text-red' }, kr(c)),
              h('td', { 'data-label': 'Profit', className: 'msa-right msa-text-green' }, kr(p)), h('td', { 'data-label': 'Margin', className: 'msa-right' }, s ? Math.round(p / s * 100) + '%' : '—'),
              h('td', { 'data-label': 'Status' }, h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status]))); })))));
  }

  // =====================================================================
  // TASKS (add/edit/delete + colors)
  // =====================================================================
  // Who a workspace task is for. 'team' = both; otherwise a specific role.
  const ASSIGN_OPTS = [['team', 'Both (shared)'], ['admin', 'Admin'], ['partner', 'Partner']];
  const assignLabel = (a) => ({ team: 'Shared', admin: 'Admin', partner: 'Partner' }[a] || 'Shared');
  function TaskModal({ initial, onClose, onSaved }) {
    const [t, setT] = useState(() => ({ title: '', body: '', assigned_to: 'team', due_date: (initial && (initial.due || '').slice(0, 10)) || todayISO(), due_time: (initial && (initial.due || '').slice(11, 16)) || '09:00', priority: 'medium', status: 'pending', ...initial }));
    const set = (k, v) => setT(p => ({ ...p, [k]: v }));
    const save = async () => {
      if (!t.title.trim()) return;
      const due = (t.due_date || todayISO()) + ' ' + (t.due_time || '09:00');
      const row = { title: t.title.trim(), body: (t.body || '').trim() || null, assigned_to: t.assigned_to || 'team', due, priority: t.priority, status: t.status };
      if (t.status === 'completed' && (!initial || initial.status !== 'completed')) { row.done_by = CURRENT_EMAIL; row.done_at = new Date().toISOString(); }
      if (initial && initial.id) { await dbUpdate('tasks', initial.id, row); logAudit('updated task', 'workspace', initial.id, row.title + ' → ' + assignLabel(row.assigned_to)); }
      else { await dbInsert('tasks', { ...row, created_by: CURRENT_EMAIL }); logAudit('added task', 'workspace', null, row.title + ' → ' + assignLabel(row.assigned_to)); }
      onSaved();
    };
    return h('div', { className: 'msa-modal-backdrop', onClick: onClose }, h('div', { className: 'msa-modal', onClick: (e) => e.stopPropagation() },
      h('div', { className: 'msa-modal-head' }, h('h2', null, (initial && initial.id) ? 'Edit Task' : 'New Task'), h('div', null, h('button', { className: 'msa-btn', onClick: onClose }, 'Cancel'), h('button', { className: 'msa-btn msa-btn-primary', onClick: save }, 'Save'))),
      h('div', { className: 'msa-modal-body' },
        h('div', { className: 'msa-field' }, h('label', null, 'Task'), h('input', { value: t.title, onChange: (e) => set('title', e.target.value), placeholder: 'What needs to be done?', autoFocus: true })),
        h('div', { className: 'msa-field' }, h('label', null, 'Details / note (optional)'), h('textarea', { rows: 2, value: t.body || '', onChange: (e) => set('body', e.target.value), placeholder: 'Anything the other person should know…' })),
        h('div', { className: 'msa-grid-2' },
          h('div', { className: 'msa-field' }, h('label', null, 'Assign to'), h('select', { value: t.assigned_to || 'team', onChange: (e) => set('assigned_to', e.target.value) }, ASSIGN_OPTS.map(([v, l]) => h('option', { key: v, value: v }, l)))),
          h('div', { className: 'msa-field' }, h('label', null, 'Priority'), h('select', { value: t.priority, onChange: (e) => set('priority', e.target.value) }, ['low','medium','high'].map(p => h('option', { key: p, value: p }, p)))),
          h('div', { className: 'msa-field' }, h('label', null, 'Due date'), h('input', { type: 'date', value: t.due_date, onChange: (e) => set('due_date', e.target.value) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Due time'), h('input', { type: 'time', value: t.due_time, onChange: (e) => set('due_time', e.target.value) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Status'), h('select', { value: t.status, onChange: (e) => set('status', e.target.value) }, ['pending','in_progress','completed'].map(s => h('option', { key: s, value: s }, s.replace('_', ' ')))))))));
  }
  // =====================================================================
  // WORKSPACE — shared task board between admin & partner (assignments)
  // =====================================================================
  function Workspace({ tasks, reload }) {
    const role = isAdminRole() ? 'admin' : 'partner';
    const meName = CURRENT_NAME || (role === 'admin' ? 'Admin' : 'Partner');
    const [edit, setEdit] = useState(null); const [q, setQ] = useState('');
    const [seg, setSeg] = useState('all');   // mine | all | done — default: all open tasks
    const [quick, setQuick] = useState(''); const [quickTo, setQuickTo] = useState(role === 'admin' ? 'partner' : 'admin');
    const mineFor = (t) => t.assigned_to === 'team' || t.assigned_to === role || !t.assigned_to;
    const toggle = async (t) => {
      const done = t.status === 'completed';
      await dbUpdate('tasks', t.id, done ? { status: 'pending', done_by: null, done_at: null } : { status: 'completed', done_by: CURRENT_EMAIL, done_at: new Date().toISOString() });
      logAudit(done ? 'reopened task' : 'completed task', 'workspace', t.id, t.title); reload();
    };
    const del = async (t) => { if (confirm('Delete this task?')) { await dbDelete('tasks', t.id); logAudit('deleted task', 'workspace', t.id, t.title); reload(); } };
    const quickAdd = async () => {
      if (!quick.trim()) return;
      await dbInsert('tasks', { title: quick.trim(), assigned_to: quickTo, status: 'pending', priority: 'medium', due: todayISO() + ' 09:00', created_by: CURRENT_EMAIL });
      logAudit('added task', 'workspace', null, quick.trim() + ' → ' + assignLabel(quickTo));
      setQuick(''); reload();
    };
    const matchQ = (t) => !q || (t.title || '').toLowerCase().includes(q.toLowerCase()) || (t.body || '').toLowerCase().includes(q.toLowerCase());
    const all = tasks.filter(matchQ);
    const open = all.filter(t => t.status !== 'completed');
    const visible = seg === 'done' ? all.filter(t => t.status === 'completed')
      : seg === 'mine' ? open.filter(mineFor)
      : open;
    const whoName = (email) => email === CURRENT_EMAIL ? 'you' : (normEmail(email) === normEmail(LEGACY_ADMIN_EMAIL) ? 'Admin' : 'Partner');

    const card = (t) => { const n = daysUntil((t.due || '').slice(0, 10)); const overdue = t.status !== 'completed' && n != null && n < 0; const soon = t.status !== 'completed' && n != null && n >= 0 && n <= 2;
      return h('div', { key: t.id, className: 'msa-ws-task' + (t.status === 'completed' ? ' done' : '') + (overdue ? ' overdue' : soon ? ' soon' : '') },
        h('button', { className: 'msa-check', onClick: () => toggle(t) }, t.status === 'completed' ? '✓' : ''),
        h('div', { className: 'msa-ws-body', onClick: () => setEdit(t) },
          h('div', { className: 'msa-ws-line1' },
            h('span', { className: 'msa-ws-title' }, t.title),
            h('span', { className: 'msa-ws-assignee msa-ws-' + (t.assigned_to || 'team') }, assignLabel(t.assigned_to)),
            h('span', { className: 'msa-badge msa-pri-' + t.priority }, t.priority)),
          t.body ? h('div', { className: 'msa-ws-note' }, t.body) : null,
          h('div', { className: 'msa-ws-meta' },
            h('span', { className: overdue ? 'msa-text-red' : soon ? 'msa-text-orange' : 'msa-dim' }, (t.due ? fmtDate(t.due) : 'No due date') + (overdue ? ' · Overdue' : soon ? ' · Due soon' : '')),
            t.created_by ? h('span', { className: 'msa-dim' }, ' · added by ' + whoName(t.created_by)) : null,
            (t.status === 'completed' && t.done_by) ? h('span', { className: 'msa-dim' }, ' · done by ' + whoName(t.done_by)) : null)),
        h('button', { className: 'msa-icon-btn', onClick: () => setEdit(t) }, ICON.edit()),
        h('button', { className: 'msa-icon-btn', onClick: () => del(t) }, ICON.trash())); };

    return h('div', { className: 'msa-page msa-narrow' },
      h('header', { className: 'msa-page-head msa-row' }, h('div', null, h('h1', null, 'Workspace'), h('p', { className: 'msa-subtitle' }, 'Shared to-dos for the team · ' + open.length + ' open')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setEdit({ assigned_to: role === 'admin' ? 'partner' : 'admin' }) }, ICON.plus(), 'New task')),
      h('div', { className: 'msa-ws-quick' },
        h('input', { className: 'msa-ws-quick-in', value: quick, placeholder: 'Quick add a task…', onChange: (e) => setQuick(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') quickAdd(); } }),
        h('span', { className: 'msa-dim', style: { fontSize: 12 } }, 'for'),
        h('select', { className: 'msa-ws-quick-sel', value: quickTo, onChange: (e) => setQuickTo(e.target.value) }, ASSIGN_OPTS.map(([v, l]) => h('option', { key: v, value: v }, l))),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: quickAdd }, 'Add')),
      h('div', { className: 'msa-toolbar', style: { gap: 10 } },
        h('div', { className: 'msa-seg msa-seg-sm' }, [['mine', 'For me'], ['all', 'All open'], ['done', 'Done']].map(([k, l]) => h('button', { key: k, className: seg === k ? 'active' : '', onClick: () => setSeg(k) }, l))),
        h('input', { className: 'msa-search', placeholder: 'Search…', value: q, onChange: (e) => setQ(e.target.value) })),
      h('div', { className: 'msa-card' }, visible.length === 0 ? h('div', { className: 'msa-empty' }, seg === 'done' ? 'Nothing completed yet.' : 'All caught up! 🎉') : visible.map(card)),
      edit && h(TaskModal, { initial: edit, onClose: () => setEdit(null), onSaved: () => { setEdit(null); reload(); } }));
  }

  // =====================================================================
  // CALENDAR (full month, today green, single brand / multiple blue)
  // =====================================================================
  function CalendarTab({ bookings, openBooking }) {
    const [view, setView] = useState('year');           // 'year' | 'month' | 'day' — default yearly overview
    const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [sel, setSel] = useState(todayISO());
    const Y = cursor.getFullYear(), M = cursor.getMonth();
    const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const DOW = CAL_DOW;
    const todayStr = todayISO();
    const dayMap = useMemo(() => { const m = {}; bookings.forEach(b => { if (b.arrival_date) (m[b.arrival_date] = m[b.arrival_date] || { arr: [], dep: [], on: [] }).arr.push(b); if (b.departure_date) (m[b.departure_date] = m[b.departure_date] || { arr: [], dep: [], on: [] }).dep.push(b);
      if (b.arrival_date && b.departure_date) { let d = new Date(b.arrival_date); const e = new Date(b.departure_date); let g = 0; while (d <= e && g++ < 400) { const k = d.toISOString().slice(0, 10); (m[k] = m[k] || { arr: [], dep: [], on: [] }).on.push(b); d = new Date(d.getTime() + 864e5); } } }); return m; }, [bookings]);

    const openDay = (k) => { setSel(k); const d = new Date(k); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setView('day'); };
    const prev = () => { if (view === 'year') setCursor(new Date(Y - 1, M, 1)); else if (view === 'month') setCursor(new Date(Y, M - 1, 1)); else { const d = new Date(sel); d.setDate(d.getDate() - 1); setSel(d.toISOString().slice(0, 10)); } };
    const next = () => { if (view === 'year') setCursor(new Date(Y + 1, M, 1)); else if (view === 'month') setCursor(new Date(Y, M + 1, 1)); else { const d = new Date(sel); d.setDate(d.getDate() + 1); setSel(d.toISOString().slice(0, 10)); } };
    const goToday = () => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSel(todayISO()); };
    const title = view === 'year' ? String(Y) : view === 'month' ? (MON[M] + ' ' + Y) : new Date(sel).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // ---- YEAR VIEW ----
    const miniMonth = (mi) => {
      const first = mondayOffset(new Date(Y, mi, 1)); const dim = new Date(Y, mi + 1, 0).getDate(); const cells = [];
      CAL_DOW_MINI.forEach((d, i) => cells.push(h('span', { key: 'h' + i, className: 'msa-yr-dow' }, d)));
      for (let i = 0; i < first; i++) cells.push(h('span', { key: 'e' + i, className: 'msa-yr-day empty' }));
      for (let d = 1; d <= dim; d++) { const k = new Date(Y, mi, d).toISOString().slice(0, 10); const info = dayMap[k]; const cnt = info ? info.on.length : 0;
        const st = cnt ? { background: bkColor(info.on[0]), color: '#fff', fontWeight: 700 } : null;
        cells.push(h('span', { key: d, className: 'msa-yr-day' + (k === todayStr ? ' today' : ''), style: st, onClick: () => openDay(k), title: cnt ? cnt + ' booking(s)' : '' }, d)); }
      return h('div', { key: mi, className: 'msa-yr-month' }, h('div', { className: 'msa-yr-name', onClick: () => { setCursor(new Date(Y, mi, 1)); setView('month'); } }, MON[mi]), h('div', { className: 'msa-yr-days' }, cells));
    };
    const todayLong = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const todayInfo = dayMap[todayStr] || { arr: [], dep: [], on: [] };
    const todayCount = new Set([].concat(todayInfo.arr, todayInfo.dep, todayInfo.on).map(b => b.id)).size;
    const yearView = () => h('div', null,
      h('div', { className: 'msa-card' }, h('div', { className: 'msa-yr-grid' }, MON.map((_, i) => miniMonth(i)))),
      h('div', { className: 'msa-card', style: { marginTop: 16 } },
        h('div', { className: 'msa-card-head' },
          h('h3', null, 'Today · ' + todayLong + (todayCount ? ('  ·  ' + todayCount + ' booking' + (todayCount === 1 ? '' : 's')) : '')),
          h('button', { className: 'msa-link', onClick: () => openDay(todayStr) }, 'Day view →')),
        dayPanel(todayStr, false)));

    // ---- MONTH VIEW ----
    const monthGrid = () => { const first = mondayOffset(new Date(Y, M, 1)); const dim = new Date(Y, M + 1, 0).getDate(); const cells = [];
      DOW.forEach((d, i) => cells.push(h('div', { key: 'dow' + i, className: 'msa-cal-dow' }, d)));
      for (let i = 0; i < first; i++) cells.push(h('div', { key: 'e' + i, className: 'msa-cal-cell out' }));
      for (let d = 1; d <= dim; d++) { const k = new Date(Y, M, d).toISOString().slice(0, 10); const info = dayMap[k] || { arr: [], dep: [], on: [] }; const isToday = k === todayStr;
        const bars = info.on.slice(0, 4).map(b => { const c = bkColor(b); const isStart = b.arrival_date === k; const isEnd = b.departure_date === k;
          return h('div', { key: b.id, className: 'msa-cal-ev' + (isStart ? ' start' : '') + (isEnd ? ' end' : '') + (!isStart && !isEnd ? ' mid' : ''), style: { background: c }, title: b.client_name + (isStart ? ' — arrival' : isEnd ? ' — departure' : ''), onClick: (e) => { e.stopPropagation(); openBooking(b); } },
            isStart ? h('span', { className: 'msa-cal-ev-cap' }, '▶') : null,
            h('span', { className: 'msa-cal-ev-name' }, (isStart || k === new Date(Y, M, 1).toISOString().slice(0, 10) || new Date(k).getDay() === 0) ? ((b.client_name || '').split(' ')[0]) : ''),
            isEnd ? h('span', { className: 'msa-cal-ev-cap' }, '◀') : null); });
        cells.push(h('div', { key: d, className: 'msa-cal-cell tall' + (isToday ? ' is-today' : '') + (k === sel ? ' is-sel' : ''), onClick: () => setSel(k), onDoubleClick: () => openDay(k) },
          h('span', { className: 'msa-cal-num' }, d), h('div', { className: 'msa-cal-evs' }, bars, info.on.length > 4 && h('span', { className: 'msa-cal-more' }, '+' + (info.on.length - 4))))); }
      return h('div', { className: 'msa-cal-grid' }, cells); };
    // Find the itinerary day for a booking that matches a calendar date k
    const dayProgram = (b, k) => {
      const itin = Array.isArray(b.daily_itinerary) ? b.daily_itinerary : [];
      let m = itin.find(d => (d.date || '').slice(0, 10) === k);
      if (!m && b.arrival_date) { const diff = Math.round((new Date(k) - new Date(b.arrival_date.slice(0, 10))) / 86400000); if (diff >= 0 && diff < itin.length) m = itin[diff]; }
      return m;
    };
    const dayPanel = (k, showOpen) => {
      const info = dayMap[k] || { arr: [], dep: [], on: [] };
      const byId = {};
      info.arr.forEach(b => { (byId[b.id] = byId[b.id] || { b, kinds: [] }).kinds.push('Arrival'); });
      info.dep.forEach(b => { (byId[b.id] = byId[b.id] || { b, kinds: [] }).kinds.push('Departure'); });
      info.on.forEach(b => { if (!byId[b.id]) byId[b.id] = { b, kinds: ['On trip'] }; });
      const list = Object.keys(byId).map(id => byId[id]);
      if (!list.length) return h('div', { className: 'msa-empty' }, 'Nothing scheduled.');
      return h('div', { className: 'msa-cal-progs' }, list.map(({ b, kinds }) => {
        const prog = dayProgram(b, k);
        const acts = (prog && Array.isArray(prog.activities)) ? prog.activities : [];
        const dayNo = prog && prog.day ? ('Day ' + prog.day) : null;
        return h('div', { key: b.id, className: 'msa-cal-prog', style: { borderLeft: '4px solid ' + bkColor(b) } },
          h('div', { className: 'msa-cal-prog-head' },
            h('span', { className: 'msa-key-dot', style: { background: bkColor(b) } }),
            h('strong', null, b.client_name),
            kinds.map((kd, i) => h('span', { key: i, className: 'msa-badge ' + (kd === 'Arrival' ? 'msa-ev-arrival' : kd === 'Departure' ? 'msa-ev-departure' : 'msa-st-' + b.status) }, kd === 'On trip' ? STATUS_LABEL[b.status] : kd)),
            dayNo ? h('span', { className: 'msa-dim msa-cal-prog-dayno' }, dayNo) : null,
            h('button', { className: 'msa-link', style: { marginLeft: 'auto' }, onClick: () => openBooking(b) }, 'Open →')),
          h('div', { className: 'msa-cal-prog-meta' },
            h('span', null, (b.arrival_city || '?') + ' → ' + (b.departure_city || '?')),
            h('span', null, ((+b.adults || 0) + (+b.kids || 0)) + ' pax'),
            b.total_nights ? h('span', null, b.total_nights + ' nights') : null,
            b.reference ? h('span', { className: 'msa-ref-chip' }, b.reference) : null,
            b.phone ? h('a', { href: 'tel:' + b.phone, className: 'msa-cal-prog-link' }, '📞 ' + b.phone) : null,
            (prog && prog.city) ? h('span', { className: 'msa-cal-prog-city' }, '📍 ' + prog.city) : null),
          h('div', { className: 'msa-cal-acts' },
            kinds.indexOf('Arrival') >= 0 ? h('div', { className: 'msa-cal-act' }, h('span', { className: 'msa-cal-act-t' }, '~14:00'), h('div', null, h('strong', null, 'Arrival'), h('p', null, 'Airport pickup & check-in in ' + (b.arrival_city || 'Marrakech')))) : null,
            acts.length ? acts.map((a, i) => h('div', { key: i, className: 'msa-cal-act' }, h('span', { className: 'msa-cal-act-t' }, a.time || '·'), h('div', null, h('strong', null, a.type || ''), a.details ? h('p', null, a.details) : null)))
              : (prog ? null : h('div', { className: 'msa-dim', style: { fontSize: 12.5, padding: '4px 2px' } }, 'No detailed program set for this day yet.')),
            kinds.indexOf('Departure') >= 0 ? h('div', { className: 'msa-cal-act' }, h('span', { className: 'msa-cal-act-t' }, '~11:00'), h('div', null, h('strong', null, 'Departure'), h('p', null, 'Transfer to airport'))) : null),
          b.special_requests ? h('div', { className: 'msa-cal-prog-note' }, '📝 ' + b.special_requests) : null);
      }));
    };
    // Color key — which booking is which color (this month)
    const monthBookings = bookings.filter(b => { if (!b.arrival_date && !b.departure_date) return false; const a = b.arrival_date || b.departure_date; const e = b.departure_date || b.arrival_date; return !(e < new Date(Y, M, 1).toISOString().slice(0, 10) || a > new Date(Y, M + 1, 0).toISOString().slice(0, 10)); });
    const colorKey = () => monthBookings.length === 0 ? null : h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Booking colors')),
      h('div', { className: 'msa-keylist' }, monthBookings.map(b => h('button', { key: b.id, className: 'msa-keyitem', onClick: () => openBooking(b) },
        h('span', { className: 'msa-key-dot', style: { background: bkColor(b) } }), h('strong', null, b.client_name), h('span', { className: 'msa-dim' }, (b.arrival_date || '?') + ' → ' + (b.departure_date || '?'))))));
    const monthView = () => h('div', null,
      h('div', { className: 'msa-cols msa-cols-21' },
        h('div', { className: 'msa-card' }, monthGrid()),
        h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, fmtDate(sel)), h('button', { className: 'msa-link', onClick: () => setView('day') }, 'Day view →')), dayPanel(sel))),
      colorKey());
    const dayView = () => h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Schedule'), h('span', { className: 'msa-dim' }, sel === todayStr ? 'Today' : countdownLabel(sel))), dayPanel(sel, false));

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' }, h('div', null, h('h1', null, 'Calendar'), h('p', { className: 'msa-subtitle' }, 'Today is ' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))),
        h('div', { className: 'msa-seg' }, ['year','month','day'].map(v => h('button', { key: v, className: view === v ? 'active' : '', onClick: () => setView(v) }, v.charAt(0).toUpperCase() + v.slice(1))))),
      h('div', { className: 'msa-cal-toolbar' },
        h('div', { className: 'msa-cal-controls' }, h('button', { className: 'msa-icon-btn', onClick: prev }, ICON.chevL()), h('button', { className: 'msa-btn msa-btn-sm', onClick: goToday }, 'Today'), h('button', { className: 'msa-icon-btn', onClick: next }, ICON.chevR())),
        h('div', { className: 'msa-cal-title' }, title),
        h('div', { className: 'msa-cal-legend' }, h('span', null, h('i', { className: 'msa-lg msa-lg-today' }), 'Today'), h('span', null, h('i', { className: 'msa-lg msa-lg-single' }), 'Single'), h('span', null, h('i', { className: 'msa-lg msa-lg-multi' }), 'Multiple'))),
      view === 'year' ? yearView() : view === 'month' ? monthView() : dayView());
  }

  // =====================================================================
  // REQUESTS (website inbox)
  // =====================================================================
  // =====================================================================
  // REQUESTS — cloned from the Bookings layout (expandable rows + actions)
  // =====================================================================
  function Requests({ leads, bookings, reload, settings, suppliers }) {
    const [q, setQ] = useState(''); const [expanded, setExpanded] = useState({});
    const [doc, setDoc] = useState(null); const [editBk, setEditBk] = useState(null);
    const [notes, setNotes] = useState({});    // id -> draft note
    const [replies, setReplies] = useState({}); // id -> draft reply
    const [flash, setFlash] = useState({});     // id -> confirmation text
    const [draftFlag, setDraftFlag] = useState({}); // id -> true while an unsent agent/edited draft exists
    const [agentBusy, setAgentBusy] = useState({}); // id -> true while the AI agent is generating
    const aiSeen = React.useRef(new Set());          // ids we've already auto-upgraded this session
    const setNote = (id, v) => setNotes(s => ({ ...s, [id]: v }));
    const setReply = (id, v) => setReplies(s => ({ ...s, [id]: v }));
    const flashMsg = (id, m) => { setFlash(s => ({ ...s, [id]: m })); setTimeout(() => setFlash(s => ({ ...s, [id]: '' })), 4000); };
    // ── Agent drafts: persisted in localStorage so they survive until sent/deleted.
    //    '' stored = the admin dismissed it (don't auto-regenerate); no key = auto-draft. ──
    const DKEY = (id) => 'msa_req_draft_' + id;
    const setDraft = (id, v) => { setReply(id, v); setDraftFlag(s => ({ ...s, [id]: true })); try { localStorage.setItem(DKEY(id), v); } catch (e) {} };
    // ── MarrakechStory AI agent: calls the `agent-draft` edge function (Claude / ChatGPT).
    //    Falls back to the local template if the LLM isn't configured or errors. ──
    const aiUpgrade = async (l, force) => {
      setAgentBusy(s => ({ ...s, [l.id]: true }));
      let txt = null, provider = null, err = null;
      try {
        const res = await callFn('agent-draft', { lead: l });
        if (res && res.ok && res.draft) { txt = res.draft; provider = res.provider; }
        else err = (res && res.error) || 'failed';
      } catch (e) { err = String(e && e.message || e); }
      if (txt) { setDraft(l.id, txt); if (force) flashMsg(l.id, 'AI draft ready' + (provider ? ' (' + provider + ')' : '') + ' ✓'); }
      else if (force) {
        setDraft(l.id, agentDraft(l));
        flashMsg(l.id, err === 'no_key' ? 'AI not configured — used template. Add ANTHROPIC_API_KEY in Supabase secrets.' : 'AI unavailable — used template.');
      }
      setAgentBusy(s => ({ ...s, [l.id]: false }));
    };
    const regenDraft = (l) => aiUpgrade(l, true);
    const deleteDraft = (l) => { setReply(l.id, ''); setDraftFlag(s => ({ ...s, [l.id]: false })); try { localStorage.setItem(DKEY(l.id), ''); } catch (e) {} };
    const clearDraft = (id) => { setDraftFlag(s => ({ ...s, [id]: false })); try { localStorage.setItem(DKEY(id), ''); } catch (e) {} };
    // When a request is first opened, quietly upgrade its template draft to a real AI draft (once).
    React.useEffect(() => {
      Object.keys(expanded).forEach(id => {
        if (!expanded[id] || aiSeen.current.has(id)) return;
        const l = (leads || []).find(x => String(x.id) === String(id));
        if (!l || l.handled || l.kind === 'collaboration') return;
        aiSeen.current.add(id);
        const cur = replies[id];
        if (cur && cur !== agentDraft(l)) return; // user edited it — leave alone
        aiUpgrade(l, false);
      });
    }, [expanded]);
    React.useEffect(() => {
      const initR = {}, initF = {};
      (leads || []).forEach(l => {
        let s = null; try { s = localStorage.getItem(DKEY(l.id)); } catch (e) {}
        if (s != null) { if (s) { initR[l.id] = s; initF[l.id] = true; } }
        else if (!l.handled && l.kind !== 'collaboration') {
          const txt = agentDraft(l); initR[l.id] = txt; initF[l.id] = true;
          try { localStorage.setItem(DKEY(l.id), txt); } catch (e) {}
        }
      });
      setReplies(prev => ({ ...initR, ...prev }));
      setDraftFlag(prev => ({ ...initF, ...prev }));
    }, [leads]);
    const saveNote = async (l) => {
      const note = notes[l.id] != null ? notes[l.id] : (l.admin_note || '');
      await dbUpdate('form_submissions', l.id, { admin_note: note });
      logAudit('note', 'request', l.id, (l.name || l.email || '') + ': ' + note.slice(0, 80));
      flashMsg(l.id, 'Note saved ✓'); reload();
    };
    // Relay a reply to the client: in-app profile message, email, or WhatsApp.
    const replyProfile = async (l) => {
      const body = (replies[l.id] || '').trim(); if (!body) return;
      if (!l.email) { flashMsg(l.id, 'No client email — use WhatsApp instead'); return; }
      const sb = getSB(); const b = bkFor(l);
      const { error } = await sb.from('messages').insert({ client_email: l.email.toLowerCase(), booking_id: b ? b.id : null, sender: 'admin', body, read_by_admin: true, read_by_client: false });
      if (error) { flashMsg(l.id, 'Failed: ' + error.message); return; }
      logAudit('reply', 'request', l.id, 'to ' + l.email + ' (profile)');
      if (!l.handled) await dbUpdate('form_submissions', l.id, { handled: true });
      setReply(l.id, ''); clearDraft(l.id); flashMsg(l.id, 'Sent to client profile ✓'); reload();
    };
    const replyEmail = (l) => {
      const body = (replies[l.id] || '').trim();
      const subj = 'Re: your MarrakechStory request' + (reqTitle(l) ? ' — ' + reqTitle(l) : '');
      window.open('mailto:' + encodeURIComponent(l.email || '') + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body), '_blank');
      logAudit('reply', 'request', l.id, 'to ' + (l.email || '') + ' (email)');
    };
    const replyWhatsapp = (l) => {
      const body = (replies[l.id] || '').trim();
      if (l.phone) { window.open(waLink(l.phone) + (body ? '?text=' + encodeURIComponent(body) : ''), '_blank'); logAudit('reply', 'request', l.id, 'via WhatsApp'); }
      else flashMsg(l.id, 'No phone number on this request');
    };
    const bkFor = (l) => bookings.find(b => b.id === l.routed_booking_id) || (l.email && bookings.find(b => (b.email || '').toLowerCase() === l.email.toLowerCase())) || null;
    const docBooking = (l, b) => b || ({
      reference: 'REQ-' + String(l.id).replace(/-/g, '').slice(0, 6).toUpperCase(),
      client_name: l.name, email: l.email, phone: l.phone, nationality: l.country,
      arrival_city: (l.payload && l.payload.arriveCity) || 'Marrakech', departure_city: (l.payload && l.payload.departCity) || 'Marrakech',
      arrival_date: l.start_date, departure_date: l.end_date,
      total_days: l.duration || 0, total_nights: Math.max(0, (l.duration || 1) - 1),
      adults: (l.payload && l.payload.travellers && +l.payload.travellers.adults) || 0,
      kids: (l.payload && l.payload.travellers && ((+l.payload.travellers.children || 0) + (+l.payload.travellers.infants || 0))) || 0,
      daily_itinerary: (l.payload && Array.isArray(l.payload.daily_itinerary)) ? l.payload.daily_itinerary : [],
      selling_price: 0, deposit_amount: 0, balance: 0, status: 'new', included: [], excluded: [],
    });
    const del = async (l, e) => { e.stopPropagation(); if (confirm('Delete this request?')) { await dbDelete('form_submissions', l.id); reload(); } };
    const markHandled = async (l, e) => { e && e.stopPropagation(); await dbUpdate('form_submissions', l.id, { handled: !l.handled }); logAudit(l.handled ? 'reopened' : 'handled', 'request', l.id, l.name || l.email || ''); reload(); };
    const list = leads.filter(l => !q || [l.name, l.email, l.phone, l.kind, l.trip_type, l.country, (l.payload && l.payload.bookingCtx && l.payload.bookingCtx.title)].join(' ').toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const row = (l) => {
      const b = bkFor(l); const p = l.payload || {};
      const title = reqTitle(l) || '—';
      const catLabel = p.tab ? (CAT_LABEL[p.tab] || p.tab) : null;
      const itin = (Array.isArray(p.daily_itinerary) && p.daily_itinerary.length) ? p.daily_itinerary : (b && Array.isArray(b.daily_itinerary) ? b.daily_itinerary : []);
      const ex = !!expanded[l.id];
      const st = b ? b.status : (l.kind === 'collaboration' ? 'ongoing' : (l.handled ? 'completed' : 'new'));
      const stLabel = b ? (STATUS_LABEL[b.status] || b.status) : (l.kind === 'collaboration' ? 'Partner' : (l.handled ? 'Seen' : 'New'));
      const n = daysUntil(l.start_date);
      const main = h('tr', { key: l.id, className: 'msa-bt-row' + (ex ? ' open' : '') + (!l.handled ? ' msa-rq-new' : ''), onClick: () => setExpanded(s => ({ ...s, [l.id]: !s[l.id] })) },
        h('td', { className: 'msa-bt-chev', 'data-label': '' }, h('span', { className: 'msa-chevtog' }, ex ? '⌃' : '⌄')),
        h('td', { 'data-label': 'Date' }, fmtDate(l.created_at)),
        h('td', { 'data-label': 'Client' }, h('strong', null, l.name || '—'), !l.handled && h('span', { className: 'msa-rq-dot', title: 'New' })),
        h('td', { 'data-label': 'Booked' }, title === '—' ? h('span', { className: 'msa-dim' }, [l.trip_type, l.duration ? l.duration + 'd' : null].filter(Boolean).join(' · ') || '—') : h('strong', { className: 'msa-text-brand' }, title),
          h('div', { className: 'msa-dim', style: { fontSize: 11, marginTop: 2 } }, [catLabel || reqKindLabel(l), p.people ? p.people + ' pax' : null].filter(Boolean).join(' · '))),
        h('td', { 'data-label': 'Dates' }, l.start_date ? h('div', null, l.start_date + (l.end_date ? ' → ' + l.end_date : '')) : h('span', { className: 'msa-dim' }, '—'), n != null && n >= 0 && h('div', { className: 'msa-cd-text ' + (n === 0 ? 'msa-text-green' : n <= 14 ? 'msa-text-orange' : 'msa-text-brand') }, countdownLabel(l.start_date))),
        h('td', { 'data-label': 'Status' }, h('span', { className: 'msa-badge msa-st-' + st }, stLabel)),
        h('td', { 'data-label': '', className: 'msa-right msa-actions' },
          b && h('button', { className: 'msa-icon-btn', title: 'Edit booking', onClick: (e) => { e.stopPropagation(); setEditBk(b); } }, ICON.edit()),
          (b || itin.length) && h('button', { className: 'msa-icon-btn', title: 'Itinerary PDF', onClick: (e) => { e.stopPropagation(); setDoc({ booking: docBooking(l, b), type: 'itinerary' }); } }, ICON.doc()),
          b && isAdminRole() && h('button', { className: 'msa-icon-btn msa-ic-green', title: 'Invoice PDF', onClick: (e) => { e.stopPropagation(); setDoc({ booking: b, type: 'invoice' }); } }, ICON.invoice()),
          l.phone && h('a', { className: 'msa-icon-btn', title: 'WhatsApp', href: waLink(l.phone), target: '_blank', onClick: (e) => e.stopPropagation() }, ICON.whatsapp())));
      if (!ex) return main;
      const trav = p.travellers || {}; const pax = (+trav.adults || 0) + (+trav.children || 0) + (+trav.infants || 0);
      const flights = [p.arriveCity ? 'In: ' + p.arriveCity : '', p.departCity ? 'Out: ' + p.departCity : '', p.flightBooked ? 'Booked: ' + p.flightBooked : ''].filter(Boolean).join('  ·  ');
      const hasStyle = !!(p.accommodation || p.pace || p.budget || p.occasion);
      const dateStr = l.start_date ? (l.start_date + (l.end_date && l.end_date !== l.start_date ? ' → ' + l.end_date : '')) : (reqText(p.date) || '');
      const transport = p.needTransport ? ('Transport requested' + (p.pickupAddr ? ' · pickup: ' + reqText(p.pickupAddr) : '')) : '';
      // Everything the visitor submitted — only structural/internal keys hidden.
      const HIDE = ['daily_itinerary', 'days', 'summary', 'bookingCtx', 'travellers', 'chooseForMe'];
      const dump = Object.keys(p).filter(k => HIDE.indexOf(k) < 0).map(k => {
        const v = p[k]; if (v == null || v === '') return null;
        const meta = REQ_FIELD[k] || { l: k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()), g: 'other' };
        return { key: k, label: meta.l, group: meta.g, value: fmtReqVal(v) };
      }).filter(Boolean).sort((a, b) => reqOrderIdx(a.key) - reqOrderIdx(b.key));
      const detail = h('tr', { key: l.id + '-d', className: 'msa-bt-detail' }, h('td', { colSpan: 8 },
        p.chooseForMe ? h('div', { className: 'msa-rq-flag' }, '⭐ Choose for me — client wants MarrakechStory to craft the trip') : null,
        h('div', { className: 'msa-rq-head' },
          h('div', { className: 'msa-rq-head-contact' },
            l.email && h('a', { href: 'mailto:' + l.email }, l.email),
            l.phone && h('a', { href: waLink(l.phone), target: '_blank' }, l.phone),
            h('span', { className: 'msa-dim' }, [l.country, 'via ' + (l.via || l.kind)].filter(Boolean).join(' · '))),
          h('div', { className: 'msa-rq-head-trip' }, [title && title !== '—' ? title : null, catLabel || reqKindLabel(l), (p.people || pax) ? ((p.people || pax) + ' pax') : null, l.duration ? l.duration + ' days' : null, dateStr || null, flights || null, hasStyle ? [p.accommodation, p.pace, p.budget].filter(Boolean).join(' / ') : null].filter(Boolean).join('  ·  '))),
        (p.notes || p.avoid) ? h('div', { className: 'msa-bk-notes', style: { marginTop: 10 } }, [p.notes && reqText(p.notes), p.avoid && ('Avoid: ' + reqText(p.avoid))].filter(Boolean).join(' · ')) : null,
        dump.length ? h('details', { className: 'msa-rq-dump' },
          h('summary', { className: 'msa-rq-dump-sum' }, h('span', { className: 'msa-rq-chev' }, '⌄'), 'All submitted details', h('span', { className: 'msa-rq-dump-count' }, dump.length)),
          h('ul', { className: 'msa-rq-simplelist' }, dump.map((d, i) => h('li', { key: i, className: 'msa-rq-sl-row' },
            h('span', { className: 'msa-rq-sl-k' }, d.label),
            h('span', { className: 'msa-rq-sl-v' }, d.value))))) : null,
        itin.length > 0 ? h('div', { className: 'msa-rq-itin', style: { marginTop: 12 } }, itin.map((d, i) => h('div', { key: i, className: 'msa-rq-day' },
          h('div', { className: 'msa-rq-day-n' }, d.day || i + 1),
          h('div', null, h('strong', null, (d.city || ('Day ' + (d.day || i + 1))) + (d.date ? ' · ' + fmtDate(d.date) : '')),
            (d.activities || []).map((a, ai) => h('div', { key: ai, className: 'msa-dim' }, (a.time ? a.time + ' · ' : '') + (a.type || '') + (a.details ? ' — ' + a.details : ''))))))) : null,
        b ? h('div', { className: 'msa-rq-booking', style: { marginTop: 12 } }, h('span', { className: 'msa-ref-chip' }, b.reference || '—'), h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status]), isAdminRole() && h('span', { className: 'msa-text-brand', style: { fontWeight: 700 } }, kr(b.selling_price)), (isAdminRole() && +b.balance > 0) && h('span', { className: 'msa-dim' }, 'Balance ' + kr(b.balance))) : null,
        // MarrakechStory agent — auto-drafts a reply, kept until confirmed / edited / deleted.
        h('div', { className: 'msa-rq-sec-h' }, 'MarrakechStory agent'),
        h('div', { className: 'msa-agent' },
          h('div', { className: 'msa-agent-top' },
            h('div', { className: 'msa-agent-id' },
              h('span', { className: 'msa-agent-av' + (agentBusy[l.id] ? ' msa-agent-av-busy' : '') }, '✦'),
              h('span', { className: 'msa-agent-name' }, 'MarrakechStory AI agent'),
              agentBusy[l.id] ? h('span', { className: 'msa-agent-badge' }, 'Writing…')
                : ((replies[l.id] || '').trim() ? h('span', { className: 'msa-agent-badge' + (draftFlag[l.id] ? '' : ' msa-agent-badge-edit') }, draftFlag[l.id] ? 'Draft — review before sending' : 'Edited') : h('span', { className: 'msa-dim', style: { fontSize: 12 } }, 'No draft'))),
            h('button', { className: 'msa-btn msa-btn-sm', disabled: !!agentBusy[l.id], onClick: () => regenDraft(l), title: 'Generate a tailored reply with the MarrakechStory AI (Claude / ChatGPT)' }, agentBusy[l.id] ? '✦ Writing…' : ((replies[l.id] || '').trim() ? '✦ Regenerate with AI' : '✦ Draft with AI'))),
          h('textarea', { className: 'msa-rq-ta msa-agent-ta', rows: 8, placeholder: agentBusy[l.id] ? 'The AI agent is writing a tailored reply…' : 'The agent will draft a reply here — click “Draft with AI”.', value: replies[l.id] || '', onChange: (e) => setDraft(l.id, e.target.value) }),
          h('div', { className: 'msa-agent-btns' },
            h('div', { className: 'msa-rq-act-grp' },
              h('button', { className: 'msa-btn msa-btn-sm msa-btn-primary', onClick: () => replyProfile(l), disabled: !(replies[l.id] || '').trim(), title: 'Confirm & save to the client’s profile' }, 'Confirm & send to profile'),
              h('button', { className: 'msa-btn msa-btn-sm', onClick: () => replyEmail(l), disabled: !l.email || !(replies[l.id] || '').trim() }, 'Email'),
              h('button', { className: 'msa-btn msa-btn-sm', onClick: () => replyWhatsapp(l), disabled: !l.phone || !(replies[l.id] || '').trim() }, ICON.whatsapp(), 'WhatsApp')),
            h('button', { className: 'msa-btn msa-btn-sm msa-rq-del msa-rq-act-end', onClick: () => deleteDraft(l), disabled: !(replies[l.id] || '').trim() }, 'Delete draft')),
          flash[l.id] ? h('div', { className: 'msa-savemsg', style: { marginTop: 8 } }, flash[l.id]) : null),
        h('div', { className: 'msa-rq-note' },
          h('span', { className: 'msa-fin-k' }, 'Internal note (staff only)'),
          h('textarea', { className: 'msa-rq-ta', rows: 2, placeholder: 'Private note…', value: notes[l.id] != null ? notes[l.id] : (l.admin_note || ''), onChange: (e) => setNote(l.id, e.target.value) }),
          h('button', { className: 'msa-btn msa-btn-sm', onClick: () => saveNote(l) }, 'Save note')),
        h('div', { className: 'msa-rq-sec-h' }, 'Manage'),
        h('div', { className: 'msa-bt-detail-actions' },
          h('div', { className: 'msa-rq-act-grp' },
            b && h('button', { className: 'msa-btn msa-btn-sm msa-btn-primary', onClick: () => setEditBk(b) }, ICON.edit(), 'Open booking editor'),
            (b || itin.length) && h('button', { className: 'msa-btn msa-btn-sm', onClick: () => setDoc({ booking: docBooking(l, b), type: 'itinerary' }) }, ICON.doc(), 'Itinerary PDF'),
            b && isAdminRole() && h('button', { className: 'msa-btn msa-btn-sm', onClick: () => setDoc({ booking: b, type: 'invoice' }) }, ICON.invoice(), 'Invoice PDF'),
            l.phone && h('a', { className: 'msa-btn msa-btn-sm', href: waLink(l.phone), target: '_blank' }, ICON.whatsapp(), 'WhatsApp')),
          h('div', { className: 'msa-rq-act-grp msa-rq-act-end' },
            h('button', { className: 'msa-btn msa-btn-sm', onClick: (e) => markHandled(l, e) }, l.handled ? 'Mark unread' : 'Mark handled'),
            h('button', { className: 'msa-btn msa-btn-sm msa-rq-del', onClick: (e) => del(l, e) }, ICON.trash(), 'Delete')))));
      return [main, detail];
    };

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Requests'), h('p', { className: 'msa-subtitle' }, 'Open a request for the full trip, itinerary, invoice and every option.')),
      h('div', { className: 'msa-searchbar' }, h('div', { className: 'msa-searchbar-in' }, ICON.search(), h('input', { placeholder: 'Search requests — name, email, trip…', value: q, onChange: (e) => setQ(e.target.value) }))),
      h('div', { className: 'msa-table-card' }, list.length === 0 ? h('div', { className: 'msa-empty' }, 'No requests yet.')
        : h('table', { className: 'msa-table msa-btable' }, h('thead', null, h('tr', null, h('th', { className: 'msa-bt-chev' }, ''), ['Date', 'Client', 'Itinerary', 'Dates', 'Status'].map((c, i) => h('th', { key: i }, c)), h('th', null, ''))), h('tbody', null, list.map(row)))),
      doc && h(DocModal, { booking: doc.booking, initialType: doc.type, settings, onClose: () => setDoc(null) }),
      editBk && h(BookingModal, { initial: editBk, onClose: () => setEditBk(null), onSaved: () => { setEditBk(null); reload(); }, onView: (bk, t) => setDoc({ booking: bk, type: t }), suppliers }));
  }

  // =====================================================================
  // SOCIAL MEDIA — monthly invoice for the riad (2 companies, alternating)
  // =====================================================================
  // Two client companies billed for the social-media management, one per month.
  const SM_COMPANIES = [
    { key: 'colombani', name: "COLOMBANI D´EXPLOITATION DES RIAD", ice: '001458075000007' },
    { key: 'stegor', name: 'STREGOR SARL', ice: '000071621000025' },
  ];
  // Everything below is identical on every invoice — only the company, ICE,
  // invoice number and date change month to month.
  const SM_INVOICE = {
    services: [
      'Création du rétro-planning des publications / Stories SM',
      'Création des accroches selon la ligne éditoriale',
      'Réalisation des réels convenus',
      'Publication des posts selon le planning confirmé',
    ],
    price: '5000 DH', subtotal: '5000 DH', tva: '1000 DH', total: '6000 DH',
    bankIce: '003408266000039', bank: 'ATTIJARI WAFA BANK', account: 'MARRAEKCHSTORY SARL', iban: '007450000488800000203358',
    phone: '+212 6 94 34 53 54', web: 'www.marrakechstory.com',
  };
  // Anchor the alternation: March 2026 = Colombani, invoice #1608.
  // (matches the two issued invoices; July 2026 → Colombani, Aug 2026 → Stegor)
  const SM_ANCHOR = { y: 2026, m: 3, no: 1608 };
  function smForMonth(y, m) {
    const k = (y - SM_ANCHOR.y) * 12 + (m - SM_ANCHOR.m);
    const company = ((k % 2) + 2) % 2 === 0 ? SM_COMPANIES[0] : SM_COMPANIES[1];
    const date = '01/' + String(m).padStart(2, '0') + '/' + String(y).slice(-2);
    return { company, no: SM_ANCHOR.no + k, date };
  }
  const SM_MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function SocialMedia() {
    const now = new Date();
    const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
    const auto = smForMonth(ym.y, ym.m);
    const [override, setOverride] = useState({}); // { companyKey?, no?, date? }
    const company = override.companyKey ? (SM_COMPANIES.find(c => c.key === override.companyKey) || auto.company) : auto.company;
    const no = override.no != null ? override.no : auto.no;
    const date = override.date != null ? override.date : auto.date;
    const shiftMonth = (d) => { let m = ym.m + d, y = ym.y; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } setYm({ y, m }); setOverride({}); };
    const download = () => exportPDF('MARRAKECHSTORY ' + company.name.split(' ')[0] + ' ' + date.replace(/\//g, '.') + '.pdf', 'msa-sm-print');

    const invoice = h('div', { id: 'msa-sm-print' },
      h('div', { className: 'msa-print-page sm-invoice' },
        h('div', { className: 'sm-inv-head' },
          h('img', { src: 'assets/logo.png', className: 'sm-inv-logo', crossOrigin: 'anonymous', onError: (e) => { e.target.style.display = 'none'; } }),
          h('div', null, h('div', { className: 'sm-inv-agency' }, 'MARRAKECHSTORY ', h('strong', null, 'SARL.')), h('div', { className: 'sm-inv-sub' }, 'Agence de communication'))),
        h('div', { className: 'sm-inv-hr' }),
        h('div', { className: 'sm-inv-row' },
          h('div', null, h('div', { className: 'sm-inv-title' }, 'FACTURE'), h('div', { className: 'sm-inv-meta' }, 'FACTURE #' + no), h('div', { className: 'sm-inv-meta' }, 'Date: ' + date)),
          h('div', { className: 'sm-inv-client' }, h('div', { className: 'sm-inv-ch' }, 'CLIENT INFORMATION:'), h('div', { className: 'sm-inv-cname' }, company.name), h('div', { className: 'sm-inv-meta' }, 'ICE: ' + company.ice))),
        h('div', { className: 'sm-inv-hr' }),
        h('div', { className: 'sm-inv-row' },
          h('div', null, h('div', { className: 'sm-inv-ch' }, 'SERVICE:'), h('ul', { className: 'sm-inv-serv' }, SM_INVOICE.services.map((s, i) => h('li', { key: i }, s)))),
          h('div', { className: 'sm-inv-pricecol' }, h('div', { className: 'sm-inv-ch' }, 'PRICE:'), h('div', { className: 'sm-inv-price' }, SM_INVOICE.price))),
        h('div', { className: 'sm-inv-spacer' }),
        h('div', { className: 'sm-inv-hr' }),
        h('div', { className: 'sm-inv-row' },
          h('div', null, h('div', { className: 'sm-inv-ch' }, 'COORDONNÉES :'),
            h('div', { className: 'sm-inv-bank' }, 'ICE : ' + SM_INVOICE.bankIce),
            h('div', { className: 'sm-inv-bank' }, SM_INVOICE.bank),
            h('div', { className: 'sm-inv-bank' }, 'NOM DU COMPTE : ' + SM_INVOICE.account),
            h('div', { className: 'sm-inv-bank' }, 'IBAN : ' + SM_INVOICE.iban)),
          h('div', { className: 'sm-inv-totals' },
            h('div', { className: 'sm-inv-trow' }, h('span', null, 'SUB-TOTAL:'), h('span', null, SM_INVOICE.subtotal)),
            h('div', { className: 'sm-inv-trow' }, h('span', null, 'TVA (10 %)'), h('span', null, SM_INVOICE.tva)),
            h('div', { className: 'sm-inv-trow sm-inv-total' }, h('span', null, 'TOTAL:'), h('span', null, SM_INVOICE.total)))),
        h('div', { className: 'sm-inv-foot' }, '📞 ' + SM_INVOICE.phone + '      ' + SM_INVOICE.web + '      ICE : ' + SM_INVOICE.bankIce),
        h('img', { src: 'assets/stamp.png', className: 'sm-inv-stamp', alt: '', crossOrigin: 'anonymous', onError: (e) => { e.target.style.display = 'none'; } })));

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Social media'), h('p', { className: 'msa-subtitle' }, 'Monthly management invoice — the right company & date, ready to send.')),
      h('div', { className: 'msa-card' },
        h('div', { className: 'sm-controls' },
          h('div', { className: 'sm-monthnav' },
            h('button', { className: 'msa-icon-btn', onClick: () => shiftMonth(-1) }, ICON.chevL()),
            h('div', { className: 'sm-monthlbl' }, SM_MON[ym.m - 1] + ' ' + ym.y),
            h('button', { className: 'msa-icon-btn', onClick: () => shiftMonth(1) }, ICON.chevR()),
            h('button', { className: 'msa-btn msa-btn-sm', onClick: () => { setYm({ y: now.getFullYear(), m: now.getMonth() + 1 }); setOverride({}); } }, 'This month')),
          h('div', { className: 'sm-fields' },
            h('div', { className: 'msa-field' }, h('label', null, 'Company (this month)'),
              h('select', { value: company.key, onChange: (e) => setOverride(o => ({ ...o, companyKey: e.target.value })) }, SM_COMPANIES.map(c => h('option', { key: c.key, value: c.key }, c.name)))),
            h('div', { className: 'msa-field' }, h('label', null, 'Invoice #'), h('input', { value: no, onChange: (e) => setOverride(o => ({ ...o, no: e.target.value })) })),
            h('div', { className: 'msa-field' }, h('label', null, 'Date'), h('input', { value: date, onChange: (e) => setOverride(o => ({ ...o, date: e.target.value })) }))),
          h('button', { className: 'msa-btn msa-btn-primary', onClick: download }, ICON.invoice(), 'Download invoice PDF')),
        h('p', { className: 'msa-dim', style: { fontSize: 12.5, marginTop: 4 } }, 'Alternates automatically each month: ' + SM_COMPANIES[0].name.split(' ')[0] + ' ↔ ' + SM_COMPANIES[1].name.split(' ')[0] + '. Everything else stays the same — change the company/number/date above if you ever need to.')),
      h('div', { className: 'msa-card sm-preview-card' }, h('div', { className: 'sm-preview' }, invoice)));
  }

  // =====================================================================
  // GLOBAL SEARCH RESULTS
  // =====================================================================
  function SearchResults({ q, data, route, openBooking, clear }) {
    const t = q.toLowerCase();
    const hit = (s) => (s || '').toString().toLowerCase().includes(t);
    const bk = data.bookings.filter(b => [b.client_name, b.reference, b.email, b.phone, b.arrival_date, b.departure_date, b.selling_price, b.balance].some(hit));
    const cl = data.clients.filter(c => [c.name, c.email, c.phone, c.country, c.total_spent].some(hit));
    const su = data.suppliers.filter(s => [s.name, s.city, s.phone, s.email, s.type].some(hit));
    const tk = data.tasks.filter(x => hit(x.title));
    const rq = data.leads.filter(l => [l.name, l.email, l.phone, l.kind].some(hit));
    const sec = (title, rows) => rows.length ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, title + ' (' + rows.length + ')')), rows) : null;
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' }, h('div', null, h('h1', null, 'Search'), h('p', null, 'Results for “' + q + '”')), h('button', { className: 'msa-btn', onClick: clear }, 'Clear')),
      (bk.length + cl.length + su.length + tk.length + rq.length === 0) && h('div', { className: 'msa-card' }, h('div', { className: 'msa-empty' }, 'No matches.')),
      sec('Bookings', bk.map(b => h('button', { key: b.id, className: 'msa-line-item', onClick: () => openBooking(b) }, h('div', null, h('strong', null, b.client_name), h('span', { className: 'msa-dim' }, ' · ' + (b.reference || '') + (isAdminRole() ? ' · ' + kr(b.selling_price) : ''))), h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status])))),
      sec('Clients', cl.map(c => h('button', { key: c.id, className: 'msa-line-item', onClick: () => route('clients', c.name) }, h('div', null, h('strong', null, c.name), h('span', { className: 'msa-dim' }, ' · ' + (c.phone || '') + ' · ' + kr(c.total_spent))), c.phone && h('span', { className: 'msa-wa-btn' }, ICON.whatsapp())))),
      sec('Collaborators', su.map(s => h('button', { key: s.id, className: 'msa-line-item', onClick: () => route('suppliers') }, h('strong', null, s.name), h('span', { className: 'msa-dim' }, ' · ' + (s.city || ''))))),
      sec('Tasks', tk.map(x => h('button', { key: x.id, className: 'msa-line-item', onClick: () => route('tasks') }, h('strong', null, x.title), h('span', { className: 'msa-dim' }, ' · ' + (x.due || ''))))),
      sec('Requests', rq.map(l => h('button', { key: l.id, className: 'msa-line-item', onClick: () => route('requests') }, h('strong', null, l.name || l.email || '—'), h('span', { className: 'msa-dim' }, ' · ' + (reqTitle(l) || reqKindLabel(l)))))));
  }

  // ---- analytics helpers ----
  function uaParse(ua) {
    ua = ua || ''; var b = 'Other';
    if (/Edg\//.test(ua)) b = 'Edge';
    else if (/OPR\/|Opera/.test(ua)) b = 'Opera';
    else if (/SamsungBrowser/.test(ua)) b = 'Samsung';
    else if (/CriOS/.test(ua)) b = 'Chrome';
    else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) b = 'Chrome';
    else if (/Firefox\//.test(ua) || /FxiOS/.test(ua)) b = 'Firefox';
    else if (/Version\/.*Safari/.test(ua) || /Safari\//.test(ua)) b = 'Safari';
    var o = 'Other';
    if (/iPhone|iPad|iPod/.test(ua)) o = 'iOS';
    else if (/Android/.test(ua)) o = 'Android';
    else if (/Windows/.test(ua)) o = 'Windows';
    else if (/Mac OS X|Macintosh/.test(ua)) o = 'macOS';
    else if (/Linux/.test(ua)) o = 'Linux';
    return { browser: b, os: o };
  }
  function flagOf(cc) {
    if (!cc || cc.length !== 2 || !/^[a-zA-Z]{2}$/.test(cc)) return '🌍';
    return cc.toUpperCase().replace(/./g, function (c) { return String.fromCodePoint(127397 + c.charCodeAt(0)); });
  }
  function agoOf(d) {
    var t = new Date(d).getTime(); if (isNaN(t)) return '';
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return s + 's'; var m = Math.floor(s / 60);
    if (m < 60) return m + 'm'; var hh = Math.floor(m / 60);
    if (hh < 24) return hh + 'h'; return Math.floor(hh / 24) + 'd';
  }
  function fmtDur(sec) { sec = Math.round(sec || 0); return sec >= 60 ? (Math.floor(sec / 60) + 'm ' + (sec % 60) + 's') : (sec + 's'); }
  var LANG_LABEL = { no: 'Norwegian', nb: 'Norwegian', nn: 'Norwegian', en: 'English', fr: 'French', sv: 'Swedish', de: 'German', es: 'Spanish', ar: 'Arabic', da: 'Danish', nl: 'Dutch', it: 'Italian', pt: 'Portuguese' };
  var SEC_LABEL = { home: 'Home', itineraries: 'Trips', catalog: 'Experiences', plan: 'Trip planner', planner: 'Trip planner', contact: 'Contact', instagram: 'Instagram', collaborate: 'Collaborate', reviews: 'Reviews', about: 'About', faq: 'FAQ', gallery: 'Gallery' };
  var WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // =====================================================================
  // INSIGHTS — full website analytics console (real-time)
  // =====================================================================
  function Insights() {
    const [rows, setRows] = useState(null);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [period, setPeriod] = useState('7d');
    const [tick, setTick] = useState(0);
    const load = useCallback(() => {
      const sb = getSB(); if (!sb) { setRows([]); return; }
      sb.from('page_views').select('*').order('created_at', { ascending: false }).limit(8000)
        .then(({ data }) => { setRows(data || []); setUpdatedAt(new Date()); });
    }, []);
    useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
    // 1s ticker so "active now" + relative times stay live between reloads.
    useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, []);
    // ── Live Google Analytics (GA4) via the ga4-insights edge function ──
    const [ga, setGa] = useState(null);
    const loadGa = useCallback(() => {
      const p = period === 'all' ? '90d' : period;
      callFn('ga4-insights', { period: p }).then(r => setGa(r || { ok: false, error: 'no response' })).catch(e => setGa({ ok: false, error: String(e && e.message || e) }));
    }, [period]);
    useEffect(() => { loadGa(); const t = setInterval(loadGa, 60000); return () => clearInterval(t); }, [loadGa]);
    const [gaJson, setGaJson] = useState(''); const [gaPid, setGaPid] = useState(''); const [gaSaving, setGaSaving] = useState(false); const [gaSaveErr, setGaSaveErr] = useState('');
    const saveGa = async () => {
      setGaSaving(true); setGaSaveErr('');
      const r = await callFn('ga4-insights', { action: 'save', serviceAccount: gaJson, propertyId: gaPid });
      setGaSaving(false);
      if (!r || !r.ok) { setGaSaveErr((r && r.error) || 'Save failed'); return; }
      setGa(null); loadGa();
    };
    if (rows === null) return h('div', { className: 'msa-page' }, h('div', { className: 'msa-empty' }, 'Loading analytics…'));

    const now = Date.now();
    const PMAP = { '24h': 1, '7d': 7, '30d': 30, 'all': 0 };
    const pdays = PMAP[period];
    const span = pdays * 86400000;
    const curStart = pdays ? now - span : 0;
    const prevStart = pdays ? now - 2 * span : 0, prevEnd = curStart;
    const ts = (r) => { const t = new Date(r.created_at).getTime(); return isNaN(t) ? 0 : t; };
    const cur = pdays ? rows.filter(r => ts(r) >= curStart) : rows;
    const prev = pdays ? rows.filter(r => ts(r) >= prevStart && ts(r) < prevEnd) : [];

    function metrics(list) {
      const visits = list.length;
      const uniq = new Set(list.map(r => r.session_id)).size;
      const durs = list.filter(r => r.duration_seconds > 0).map(r => r.duration_seconds);
      const avg = durs.length ? Math.round(durs.reduce((s, x) => s + x, 0) / durs.length) : 0;
      const bounces = list.filter(r => { const sl = Array.isArray(r.sections) ? r.sections.length : 0; return (r.duration_seconds || 0) < 10 || sl <= 1; }).length;
      const bounce = visits ? Math.round(bounces / visits * 100) : 0;
      const mob = list.filter(r => r.device === 'mobile' || r.device === 'tablet').length;
      const mobilePct = visits ? Math.round(mob / visits * 100) : 0;
      const secCount = list.reduce((s, r) => s + (Array.isArray(r.sections) ? r.sections.length : 0), 0);
      const ppv = visits ? (secCount / visits) : 0;
      return { visits, uniq, avg, bounce, mobilePct, ppv };
    }
    const M = metrics(cur), Mp = metrics(prev);
    const dPct = (c, p) => (period === 'all' || !prev.length) ? null : (p ? Math.round((c - p) / p * 100) : (c ? 100 : 0));

    // active now — sessions touched in the last 5 minutes
    const active = new Set(rows.filter(r => { const t = new Date(r.updated_at || r.created_at).getTime(); return now - t < 5 * 60000; }).map(r => r.session_id)).size;

    // tally helper
    const tally = (list, fn) => { const m = {}; list.forEach(r => { const k = fn(r); if (k != null && k !== '') m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    const countries = tally(cur, r => r.country).slice(0, 8);
    const ccByName = {}; cur.forEach(r => { if (r.country && r.country_code) ccByName[r.country] = r.country_code; });
    const cities = tally(cur, r => r.city).slice(0, 8);
    const langs = tally(cur, r => (r.lang || '').slice(0, 2).toLowerCase()).slice(0, 6);
    const browsers = tally(cur, r => uaParse(r.user_agent).browser).slice(0, 6);
    const oses = tally(cur, r => uaParse(r.user_agent).os).slice(0, 6);
    const landings = tally(cur, r => { let l = (r.landing || '/').split('?')[0]; return l || '/'; }).slice(0, 6);
    const refs = tally(cur, r => r.referrer || 'direct').slice(0, 6);
    const dev = { desktop: 0, mobile: 0, tablet: 0 }; cur.forEach(r => { const d = r.device || 'desktop'; dev[d] = (dev[d] || 0) + 1; });

    // sections
    const secEntries = (function () { const m = {}; cur.forEach(r => (Array.isArray(r.sections) ? r.sections : []).forEach(s => { m[s] = (m[s] || 0) + 1; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); })();
    const secTotal = secEntries.reduce((s, x) => s + x[1], 0) || 1;

    // time series
    let series;
    if (period === '24h') {
      const byH = new Array(24).fill(0);
      cur.forEach(r => { const hh = new Date(r.created_at).getHours(); if (!isNaN(hh)) byH[hh]++; });
      series = byH.map((v, i) => ({ label: i % 4 === 0 ? (i + 'h') : '', value: v }));
    } else {
      const byDay = {}; cur.forEach(r => { const k = (r.created_at || '').slice(0, 10); if (k) byDay[k] = (byDay[k] || 0) + 1; });
      const keys = Object.keys(byDay).sort(); const n = period === '30d' ? 30 : (period === '7d' ? 7 : keys.length);
      series = keys.slice(-n).map(k => ({ label: k.slice(8) + '/' + k.slice(5, 7), value: byDay[k] }));
    }

    // peak hours + weekday (over current window)
    const byHour = new Array(24).fill(0); cur.forEach(r => { const hh = new Date(r.created_at).getHours(); if (!isNaN(hh)) byHour[hh]++; });
    const hourBars = byHour.map((v, i) => ({ label: i % 4 === 0 ? (i + '') : '', value: v }));
    const peakHour = byHour.indexOf(Math.max(...byHour));
    const byWd = new Array(7).fill(0); cur.forEach(r => { const d = new Date(r.created_at); if (!isNaN(d.getTime())) { byWd[(d.getDay() + 6) % 7]++; } });
    const wdBars = byWd.map((v, i) => ({ label: WD[i], value: v }));

    // conversion funnel (session level)
    const sess = {}; cur.forEach(r => { const sid = r.session_id || r.id; const set = sess[sid] || (sess[sid] = new Set()); (Array.isArray(r.sections) ? r.sections : []).forEach(s => set.add(s)); });
    const sessArr = Object.keys(sess).map(k => sess[k]);
    const reached = (fn) => sessArr.filter(fn).length;
    const funnel = [
      { label: 'Visited the site', n: sessArr.length },
      { label: 'Browsed trips / experiences', n: reached(s => s.has('itineraries') || s.has('catalog')) },
      { label: 'Opened the trip planner', n: reached(s => s.has('plan') || s.has('planner')) },
      { label: 'Reached contact', n: reached(s => s.has('contact')) },
    ];
    const funnelTop = funnel[0].n || 1;

    // recent live feed
    const feed = rows.slice(0, 14);

    // smart insights
    const smart = [];
    if (countries[0]) smart.push('Most visitors come from ' + flagOf(ccByName[countries[0][0]]) + ' ' + countries[0][0] + ' (' + Math.round(countries[0][1] / (M.visits || 1) * 100) + '% of traffic).');
    if (M.visits) smart.push('Peak browsing time is around ' + peakHour + ':00–' + ((peakHour + 1) % 24) + ':00.');
    if (secEntries[0]) smart.push('“' + (SEC_LABEL[secEntries[0][0]] || secEntries[0][0]) + '” is the most-viewed section of the site.');
    smart.push(M.mobilePct + '% of visits are on mobile or tablet, ' + (100 - M.mobilePct) + '% on desktop.');
    if (period !== 'all' && prev.length) { const dv = dPct(M.visits, Mp.visits); smart.push('Traffic is ' + (dv >= 0 ? 'up' : 'down') + ' ' + Math.abs(dv) + '% versus the previous ' + period + '.'); }
    smart.push('Bounce rate is ' + M.bounce + '% — ' + (100 - M.bounce) + '% of visitors engage beyond the first view.');
    if (langs[0]) smart.push('Top audience language: ' + (LANG_LABEL[langs[0][0]] || langs[0][0] || '—') + '.');

    // ---- render helpers ----
    const deltaEl = (d) => d == null ? null : h('span', { className: 'msa-kpi-delta ' + (d >= 0 ? 'up' : 'down') }, (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '%');
    const kpi = (label, value, d, cls, sub) => h('div', { className: 'msa-kpi ' + (cls || 'msa-kpi-plain') },
      h('span', { className: 'msa-kpi-label' }, label),
      h('span', { className: 'msa-kpi-value' }, value),
      h('div', { className: 'msa-kpi-foot' }, deltaEl(d), sub ? h('span', { className: 'msa-kpi-sub' }, sub) : null));
    const srcBars = (entries, opt) => {
      opt = opt || {}; if (!entries || !entries.length) return h('div', { className: 'msa-empty' }, 'No data yet.');
      const max = Math.max(1, ...entries.map(e => e[1])); const tot = entries.reduce((s, e) => s + e[1], 0) || 1;
      return h('div', { className: 'msa-srcbars' }, entries.map(([k, v], i) => h('div', { key: i, className: 'msa-srcbar' },
        h('span', { className: 'msa-srcbar-l' }, opt.label ? opt.label(k) : k),
        h('div', { className: 'msa-srcbar-track' }, h('div', { className: 'msa-srcbar-fill', style: { width: (v / max * 100) + '%', background: opt.color || undefined } })),
        h('span', { className: 'msa-srcbar-v' }, opt.pct ? Math.round(v / tot * 100) + '%' : nf(v)))));
    };
    const barChart = (data, color) => { const max = Math.max(1, ...data.map(d => d.value)); return h('div', { className: 'msa-bars' }, data.map((d, i) => h('div', { key: i, className: 'msa-bar-col' }, h('div', { className: 'msa-bar-track' }, h('div', { className: 'msa-bar-fill', style: { height: Math.round(d.value / max * 100) + '%', background: color || 'var(--brand)' }, title: d.value + ' visits' })), h('span', { className: 'msa-bar-label' }, d.label)))); };
    const card = (title, body, extra) => h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, title), extra || null), body);

    const periodSeg = h('div', { className: 'msa-seg msa-seg-sm' },
      [['24h', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['all', 'All time']].map(([k, lbl]) =>
        h('button', { key: k, className: period === k ? 'active' : '', onClick: () => setPeriod(k) }, lbl)));

    // ── Google Analytics (GA4) live panel ──
    const gaCard = (label, val, cls, sub) => h('div', { className: 'msa-kpi ' + (cls || '') }, h('span', { className: 'msa-kpi-label' }, label), h('span', { className: 'msa-kpi-value' }, val), sub ? h('span', { className: 'msa-kpi-sub' }, sub) : null);
    const gaFmtDur = (s) => { s = Math.round(s || 0); const m = Math.floor(s / 60); return m ? (m + 'm ' + (s % 60) + 's') : (s + 's'); };
    const gaList = (title, items, live) => h('div', { className: 'msa-card msa-dash-box' },
      h('div', { className: 'msa-card-head' }, h('h3', null, live ? h('span', { className: 'msa-live-dot', style: { display: 'inline-block', marginRight: 6 } }) : null, title)),
      h('div', { className: 'msa-dash-scroll' }, (!items || !items.length) ? h('div', { className: 'msa-empty' }, 'No data yet')
        : items.map((it, i) => h('div', { key: i, className: 'msa-line-item' }, h('span', { title: it.key }, (it.key || '(none)')), h('strong', { className: 'msa-text-brand' }, nf(it.value))))));
    const gaDate = (k) => (k && k.length === 8) ? (parseInt(k.slice(6, 8), 10) + '/' + parseInt(k.slice(4, 6), 10)) : k;
    const gaTrend = (data, label) => {
      const d = (data || []).filter(x => x.key && x.key.length === 8);
      const max = Math.max(1, ...d.map(x => x.value));
      return h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, label)),
        !d.length ? h('div', { className: 'msa-empty' }, 'No data yet')
          : h('div', { className: 'msa-ga-trend' }, d.map((x, i) => h('div', { key: i, className: 'msa-ga-trend-col', title: nf(x.value) + ' users · ' + gaDate(x.key) },
              h('div', { className: 'msa-ga-trend-bar', style: { height: Math.max(3, Math.round(x.value / max * 100)) + '%' } }),
              h('span', { className: 'msa-ga-trend-lbl' }, (d.length <= 16 || i % Math.ceil(d.length / 12) === 0) ? gaDate(x.key) : '')))));
    };
    const gaPeriodLabel = period === '24h' ? 'today' : period === 'all' ? 'last 90 days' : 'last ' + period.replace('d', ' days');
    const gaSection = h('div', { className: 'msa-ga-section' },
      h('h4', { className: 'msa-section msa-section-row' }, h('span', null, 'Google Analytics'),
        (ga && ga.configured && ga.ok) ? h('span', { className: 'msa-live' }, h('span', { className: 'msa-live-dot' }), nf(ga.active || 0) + ' active now') : null),
      ga === null ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-empty' }, 'Connecting to Google Analytics…'))
        : (!ga.configured) ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-ga-setup' },
            h('strong', null, 'Connect Google Analytics (one-time)'),
            h('p', { className: 'msa-dim' }, 'Paste your Google service-account key (the JSON file) and your GA4 numeric Property ID. Live data appears here right after you connect.'),
            h('div', { className: 'msa-field' }, h('label', null, 'Service account key (JSON)'), h('textarea', { rows: 5, value: gaJson, placeholder: '{ "type": "service_account", "project_id": "...", "private_key": "...", "client_email": "...@...iam.gserviceaccount.com" }', onChange: (e) => setGaJson(e.target.value) })),
            h('div', { className: 'msa-field' }, h('label', null, 'GA4 Property ID (numbers only)'), h('input', { value: gaPid, placeholder: 'e.g. 312345678', onChange: (e) => setGaPid(e.target.value) })),
            gaSaveErr ? h('div', { className: 'msa-text-red', style: { marginBottom: 8, fontSize: 13 } }, gaSaveErr) : null,
            h('button', { className: 'msa-btn msa-btn-primary', disabled: gaSaving || !gaJson.trim() || !gaPid.trim(), onClick: saveGa }, gaSaving ? 'Connecting…' : 'Connect Google Analytics')))
        : (!ga.ok || ga.error) ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-empty' }, 'Google Analytics error: ' + (ga.error || 'unknown')))
        : h('div', null,
          h('div', { className: 'msa-kpi-grid' },
            gaCard('Active now', nf(ga.active), 'msa-kpi-income'),
            gaCard('Users', nf(ga.summary.users), 'msa-kpi-benefit', (ga.summary.newUsers ? (Math.round(ga.summary.newUsers / Math.max(1, ga.summary.users) * 100) + '% new') : null)),
            gaCard('Sessions', nf(ga.summary.sessions)),
            gaCard('Pageviews', nf(ga.summary.pageviews)),
            gaCard('Engagement', Math.round((ga.summary.engagementRate || 0) * 100) + '%')),
          gaTrend(ga.trend, 'Visitors — ' + gaPeriodLabel),
          h('div', { className: 'msa-cols msa-cols-3' },
            (ga.realtimePages && ga.realtimePages.length) ? gaList('Being viewed now', ga.realtimePages, true) : gaList('Top pages', ga.pages),
            gaList('Channels', ga.channels),
            gaList('Countries', ga.countries))));

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' },
        h('div', null, h('h1', null, 'Insights'), h('p', { className: 'msa-subtitle' }, 'Live website analytics — audience, behaviour & conversion')),
        h('div', { className: 'msa-live-wrap' },
          h('span', { className: 'msa-live' }, h('span', { className: 'msa-live-dot' }), active > 0 ? (active + ' active now') : 'Live'),
          updatedAt && h('span', { className: 'msa-dim', style: { marginRight: 8 } }, 'Updated ' + updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
          h('button', { className: 'msa-btn msa-btn-sm', onClick: load }, 'Refresh'))),

      gaSection,

      h('div', { className: 'msa-insights-bar' }, periodSeg,
        h('span', { className: 'msa-dim' }, M.visits + ' visits · ' + M.uniq + ' unique in this period')),

      rows.length === 0 ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-empty' }, 'No visits recorded yet. Data appears here automatically as people browse the public site.')) : h('div', null,

        // PLAIN-LANGUAGE SUMMARY — the whole picture in a few sentences, first
        h('div', { className: 'msa-card msa-insights-sum' },
          h('div', { className: 'msa-card-head' }, h('h3', null, '📌 At a glance')),
          h('ul', { className: 'msa-smart' }, smart.map((t, i) => h('li', { key: i }, t)))),

        // KPI ROW — the six numbers that matter
        h('div', { className: 'msa-kpi-grid' },
          kpi('Total visits', nf(M.visits), dPct(M.visits, Mp.visits), 'msa-kpi-income'),
          kpi('Unique visitors', nf(M.uniq), dPct(M.uniq, Mp.uniq), 'msa-kpi-benefit'),
          kpi('Avg. time on site', fmtDur(M.avg), dPct(M.avg, Mp.avg), 'msa-kpi-plain'),
          kpi('Pages / visit', M.ppv.toFixed(1), dPct(Math.round(M.ppv * 10), Math.round(Mp.ppv * 10)), 'msa-kpi-plain'),
          kpi('Bounce rate', M.bounce + '%', dPct(M.bounce, Mp.bounce) == null ? null : -dPct(M.bounce, Mp.bounce), 'msa-kpi-cost', 'lower is better'),
          kpi('Mobile share', M.mobilePct + '%', dPct(M.mobilePct, Mp.mobilePct), 'msa-kpi-plain')),

        // ONE TREND CHART
        card(period === '24h' ? 'Visits by hour (today)' : ('Visits — ' + (period === 'all' ? 'all time' : 'last ' + period)),
          series.length ? barChart(series) : h('div', { className: 'msa-empty' }, 'Not enough data.')),

        // THREE ESSENTIALS — who, what, where from
        h('div', { className: 'msa-cols msa-cols-3' },
          card('Where visitors are from', srcBars(countries, { pct: true, label: (k) => h('span', null, flagOf(ccByName[k]), ' ', k) })),
          card('Most-visited sections', srcBars(secEntries.map(([k, v]) => [SEC_LABEL[k] || k, v]), { pct: true })),
          card('How they found us', srcBars(refs, { label: (k) => k === 'direct' ? 'Direct / app' : k }))),

        // CONVERSION FUNNEL — where people drop off
        card('From visit to contact', h('div', { className: 'msa-funnel' }, funnel.map((f, i) => h('div', { key: i, className: 'msa-funnel-row' },
          h('div', { className: 'msa-funnel-top' }, h('span', null, f.label), h('strong', null, f.n + ' · ' + Math.round(f.n / funnelTop * 100) + '%')),
          h('div', { className: 'msa-funnel-track' }, h('div', { className: 'msa-funnel-fill', style: { width: (f.n / funnelTop * 100) + '%' } })))))) ));
  }

  // SHELL
  // =====================================================================
  // =====================================================================
  // SETTINGS (company / invoice info + admin controls)
  // =====================================================================
  function Settings({ settings, onSaved }) {
    const [s, setS] = useState(settings || {});
    const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
    const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [pwMsg, setPwMsg] = useState('');
    const admin = isAdminRole();
    const [pEmail, setPEmail] = useState(''); const [pName, setPName] = useState(''); const [pPass, setPPass] = useState('');
    const [pBusy, setPBusy] = useState(false); const [pMsg, setPMsg] = useState('');
    useEffect(() => { setS(settings || {}); setPEmail((settings && settings.partner_email) || ''); setPName((settings && settings.partner_name) || ''); }, [settings]);
    const savePartner = async () => {
      setPMsg(''); if (!pEmail.trim() || pPass.length < 8) { setPMsg('Enter the partner email and a password (min 8 chars).'); return; }
      setPBusy(true);
      const r = await callFn('manage-partner', { action: 'set', email: pEmail.trim(), name: pName.trim(), password: pPass });
      setPBusy(false);
      setPMsg(r && r.ok ? 'Partner account ready ✓ — they can now sign in with this email & password.' : 'Failed: ' + ((r && r.error) || 'unknown'));
      if (r && r.ok) { setPPass(''); onSaved && onSaved(); }
    };
    const revokePartner = async () => {
      if (!confirm('Remove the partner account entirely? They will no longer be able to sign in and you will need to re-create it.')) return;
      setPBusy(true); const r = await callFn('manage-partner', { action: 'revoke' }); setPBusy(false);
      setPMsg(r && r.ok ? 'Partner account removed.' : 'Failed.'); if (r && r.ok) { setPEmail(''); setPName(''); onSaved && onSaved(); }
    };
    const toggleBlock = async () => {
      const block = !(settings && settings.partner_blocked);
      if (block && !confirm('Block this partner? They stay set up but cannot sign in or see anything until you unblock.')) return;
      setPBusy(true); const r = await callFn('manage-partner', { action: block ? 'block' : 'unblock' }); setPBusy(false);
      setPMsg(r && r.ok ? (block ? 'Partner blocked — access suspended.' : 'Partner unblocked — access restored.') : 'Failed.'); if (r && r.ok) onSaved && onSaved();
    };
    const set = (k, v) => setS(p => ({ ...p, [k]: v }));
    const save = async () => { setBusy(true); setMsg('');
      const row = { id: 1, admin_email: s.admin_email, company_name: s.company_name, company_email: s.company_email, company_phone: s.company_phone, company_address: s.company_address, website_url: s.website_url, bank_name: s.bank_name, account_name: s.account_name, rib: s.rib, swift: s.swift, revolut: s.revolut, wise: s.wise, paypal: s.paypal, invoice_prefix: s.invoice_prefix, invoice_footer: s.invoice_footer, deposit_pct: +s.deposit_pct || 20, currency: s.currency || 'NOK', terms_conditions: s.terms_conditions, payment_info: s.payment_info, updated_at: new Date().toISOString() };
      const sb = getSB(); const { error } = await sb.from('admin_settings').upsert(row, { onConflict: 'id' });
      setBusy(false); setMsg(error ? 'Save failed: ' + error.message : 'Saved ✓'); if (!error) onSaved && onSaved(); };
    const changePw = async () => { setPwMsg(''); if (pw.length < 8) { setPwMsg('Min 8 characters'); return; } if (pw !== pw2) { setPwMsg('Passwords do not match'); return; }
      const sb = getSB(); const { error } = await sb.auth.updateUser({ password: pw }); setPwMsg(error ? error.message : 'Password updated ✓'); if (!error) { setPw(''); setPw2(''); } };
    const fld = (label, k, ph) => h('div', { className: 'msa-field' }, h('label', null, label), h('input', { value: s[k] == null ? '' : s[k], placeholder: ph || '', onChange: (e) => set(k, e.target.value) }));
    return h('div', { className: 'msa-page msa-narrow' },
      h('header', { className: 'msa-page-head msa-row' }, h('div', null, h('h1', null, 'Settings'), h('p', { className: 'msa-subtitle' }, admin ? 'Company info, invoices & admin controls' : 'Your account')),
        admin ? h('button', { className: 'msa-btn msa-btn-primary', disabled: busy, onClick: save }, busy ? 'Saving…' : 'Save changes') : null),
      msg && h('div', { className: 'msa-savemsg' }, msg),
      admin ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Company')),
        h('div', { className: 'msa-grid-2' }, fld('Admin login email', 'admin_email', 'owner@example.com'), fld('Company name', 'company_name'), fld('Email', 'company_email'), fld('Phone', 'company_phone'), fld('Website URL', 'website_url'), fld('Address', 'company_address'))) : null,
      admin ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Invoice & bank (admin only)')),
        h('div', { className: 'msa-grid-2' }, fld('Invoice prefix', 'invoice_prefix', 'INV'), fld('Default deposit %', 'deposit_pct'), fld('Bank name', 'bank_name'), fld('Account name', 'account_name'), fld('RIB', 'rib'), fld('SWIFT', 'swift')),
        h('h4', { className: 'msa-section', style: { marginTop: 16 } }, 'Online payment handles (shown on the invoice for the matching method)'),
        h('div', { className: 'msa-grid-2' }, fld('Revolut', 'revolut', '@revtag or revolut.me/…'), fld('Wise', 'wise', 'email or wise.com/pay/…'), fld('PayPal', 'paypal', 'email or paypal.me/…')),
        h('div', { className: 'msa-field', style: { marginTop: 12 } }, h('label', null, 'Invoice footer note'), h('textarea', { rows: 2, value: s.invoice_footer || '', onChange: (e) => set('invoice_footer', e.target.value) }))) : null,
      admin ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Payment Information & Terms')),
        h('div', { className: 'msa-field' }, h('label', null, 'Payment information (shown on itinerary & invoice)'), h('textarea', { rows: 3, value: s.payment_info || '', onChange: (e) => set('payment_info', e.target.value) })),
        h('div', { className: 'msa-field', style: { marginTop: 12 } }, h('label', null, 'Terms & conditions (shown on itinerary & invoice)'), h('textarea', { rows: 7, value: s.terms_conditions || '', onChange: (e) => set('terms_conditions', e.target.value) }))) : null,
      admin ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Partner access (assistant account)'),
          (settings && settings.partner_email) ? h('span', { className: 'msa-team-status ' + (settings.partner_blocked ? 'off' : 'on') }, h('span', { className: 'msa-team-dot' }), settings.partner_blocked ? 'Blocked' : 'Active') : null),
        h('p', { className: 'msa-dim', style: { margin: '0 0 12px' } }, 'A login for your assistant. They get the full console — bookings, requests, clients, calendar, tasks, insights — but never see Finance, prices, costs or invoices. The Dashboard shows when they are connected and everything they change.'),
        h('div', { className: 'msa-grid-2' },
          h('div', { className: 'msa-field' }, h('label', null, 'Partner name'), h('input', { value: pName, placeholder: 'e.g. Sofia', onChange: (e) => setPName(e.target.value) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Partner email'), h('input', { type: 'email', value: pEmail, autoComplete: 'off', placeholder: 'assistant@example.com', onChange: (e) => setPEmail(e.target.value) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Set / change password'), h('input', { type: 'password', value: pPass, autoComplete: 'new-password', placeholder: 'min 8 characters', onChange: (e) => setPPass(e.target.value) }))),
        pMsg && h('div', { className: 'msa-savemsg' }, pMsg),
        h('div', { style: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' } },
          h('button', { className: 'msa-btn msa-btn-primary', disabled: pBusy, onClick: savePartner }, pBusy ? 'Saving…' : (settings && settings.partner_email ? 'Save / change password' : 'Create partner login')),
          (settings && settings.partner_email) && h('button', { className: 'msa-btn', disabled: pBusy, onClick: toggleBlock }, settings.partner_blocked ? 'Unblock' : 'Block account'),
          (settings && settings.partner_email) && h('button', { className: 'msa-btn', disabled: pBusy, onClick: revokePartner }, ICON.trash(), 'Remove'))) : null,
      h('div', { className: 'msa-card' }, h('div', { className: 'msa-card-head' }, h('h3', null, 'Your password')),
        h('div', { className: 'msa-grid-2' },
          h('div', { className: 'msa-field' }, h('label', null, 'New password'), h('input', { type: 'password', value: pw, autoComplete: 'new-password', onChange: (e) => setPw(e.target.value) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Confirm password'), h('input', { type: 'password', value: pw2, autoComplete: 'new-password', onChange: (e) => setPw2(e.target.value) }))),
        pwMsg && h('div', { className: 'msa-savemsg' }, pwMsg),
        h('button', { className: 'msa-btn', style: { marginTop: 12 }, onClick: changePw }, 'Update password')));
  }

  const TABS = [['dashboard', 'Dashboard', 'dashboard'], ['bookings', 'Bookings', 'bookings'], ['calendar', 'Calendar', 'calendar'], ['clients', 'Clients', 'clients'], ['suppliers', 'Collaborators', 'collab'], ['finance', 'Finance', 'finance'], ['tasks', 'Workspace', 'tasks'], ['requests', 'Requests', 'requests'], ['social', 'Social media', 'invoice'], ['insights', 'Insights', 'insights'], ['settings', 'Settings', 'settings']];

  function Shell({ user, role, onLogout }) {
    const isAdmin = role === 'admin';
    const [tab, setTab] = useState('dashboard'); const [navOpen, setNavOpen] = useState(false);
    const [dark, setDark] = useState(() => { try { return localStorage.getItem('ms-admin-theme') === 'dark'; } catch (e) { return false; } });
    useEffect(() => {
      const root = document.getElementById('ms-admin-root') || document.body;
      if (dark) root.classList.add('msa-dark'); else root.classList.remove('msa-dark');
      try { localStorage.setItem('ms-admin-theme', dark ? 'dark' : 'light'); } catch (e) {}
    }, [dark]);
    useEffect(() => () => { const r = document.getElementById('ms-admin-root'); if (r) r.classList.remove('msa-dark'); }, []);
    // Browser full-screen toggle
    const [isFs, setIsFs] = useState(false);
    useEffect(() => {
      const onFs = () => setIsFs(!!(document.fullscreenElement || document.webkitFullscreenElement));
      document.addEventListener('fullscreenchange', onFs);
      document.addEventListener('webkitfullscreenchange', onFs);
      return () => { document.removeEventListener('fullscreenchange', onFs); document.removeEventListener('webkitfullscreenchange', onFs); };
    }, []);
    const toggleFs = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); }
      else { const el = document.documentElement; (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el); }
    };
    const [bookings, setBookings] = useState([]); const [clients, setClients] = useState([]); const [suppliers, setSuppliers] = useState([]);
    const [tasks, setTasks] = useState([]); const [leads, setLeads] = useState([]); const [loading, setLoading] = useState(true);
    const [supSeed, setSupSeed] = useState(null); const [focusBooking, setFocusBooking] = useState(null);
    const [clientQuery, setClientQuery] = useState(''); const [search, setSearch] = useState(''); const [settings, setSettings] = useState({});
    // Badge = requests still OPEN (not yet fully confirmed & paid). It stays
    // on with the count until the linked booking is fully_paid/completed/
    // cancelled. Collaboration/partial leads don't count.
    const openRequests = leads.filter(l => {
      if (l.kind === 'collaboration' || l.kind === 'lead_partial') return false;
      const b = bookings.find(x => x.id === l.routed_booking_id) || (l.email && bookings.find(x => (x.email || '').toLowerCase() === l.email.toLowerCase()));
      if (b) return !['fully_paid', 'completed', 'cancelled'].includes(b.status);
      return true; // request with no booking yet — still needs handling
    }).length;
    // Partners never see the Finance tab (money is admin-only).
    const visibleTabs = TABS.filter(t => isAdmin || t[0] !== 'finance');
    // Presence heartbeat so the admin can see when the partner is connected.
    useEffect(() => { touchPresence(tab); const t = setInterval(() => touchPresence(tab), 30000);
      const onHide = () => touchPresence(tab); document.addEventListener('visibilitychange', onHide);
      return () => { clearInterval(t); document.removeEventListener('visibilitychange', onHide); }; }, [tab]);
    const goTab = (id) => { setTab(id); setNavOpen(false); setSearch(''); };
    const NAV_BADGE = { requests: openRequests };
    const currentLabel = (TABS.find(t => t[0] === tab) || [, 'Admin'])[1];

    const reloadAll = useCallback(async () => {
      const sb = getSB();
      const [bk, cl, su, tk, ld] = await Promise.all([dbList('bookings', 'created_at', false), dbList('clients', 'name', true), dbList('suppliers', 'name', true), dbList('tasks', 'created_at', false), dbList('form_submissions', 'created_at', false)]);
      setBookings(bk); setClients(cl); setSuppliers(su); setTasks(tk); setLeads(ld); setLoading(false);
      if (sb) { const { data } = await sb.from('admin_settings').select('*').eq('id', 1).maybeSingle(); if (data) setSettings(data); }
    }, []);
    useEffect(() => { reloadAll(); }, [reloadAll]);

    const openBooking = (b) => { setFocusBooking(b && b.id ? b : EMPTY_BOOKING); setSearch(''); setTab('bookings'); };
    const routeTo = (t, term) => { setSearch(''); if (t === 'clients' && term) setClientQuery(term); setTab(t); };

    const body = () => {
      if (loading) return h('div', { className: 'msa-page' }, h('div', { className: 'msa-empty' }, 'Loading…'));
      if (search.trim()) return h(SearchResults, { q: search.trim(), data: { bookings, clients, suppliers, tasks, leads }, route: routeTo, openBooking, clear: () => setSearch('') });
      switch (tab) {
        case 'bookings': return h(Bookings, { bookings, reload: reloadAll, settings, focusBooking, clearFocus: () => setFocusBooking(null), suppliers });
        case 'calendar': return h(CalendarTab, { bookings, openBooking });
        case 'clients': return h(Clients, { clients, bookings, reload: reloadAll, initialQuery: clientQuery });
        case 'suppliers': return h(Suppliers, { suppliers, bookings, leads, reload: reloadAll, seed: supSeed, clearSeed: () => setSupSeed(null) });
        case 'finance': return isAdmin ? h(Finance, { bookings, suppliers }) : h(Dashboard, { bookings, tasks, leads, clients, go: setTab, openBooking, reload: reloadAll, isAdmin });
        case 'tasks': return h(Workspace, { tasks, reload: reloadAll });
        case 'requests': return h(Requests, { leads, bookings, reload: reloadAll, settings, suppliers });
        case 'social': return h(SocialMedia, {});
        case 'insights': return h(Insights, {});
        case 'settings': return h(Settings, { settings, onSaved: reloadAll });
        default: return h(Dashboard, { bookings, tasks, leads, clients, go: setTab, openBooking, reload: reloadAll, isAdmin });
      }
    };

    return h('div', { className: 'msa-shell' + (navOpen ? ' nav-open' : '') },
      h('header', { className: 'msa-topbar' },
        h('button', { className: 'msa-burger', 'aria-label': navOpen ? 'Close' : 'Menu', onClick: () => setNavOpen(o => !o) }, navOpen ? ICON.x() : ICON.menu()),
        h('span', { className: 'msa-topbar-title' }, currentLabel),
        h('div', { className: 'msa-topsearch' }, ICON.search(), h('input', { placeholder: 'Search everything…', value: search, onChange: (e) => setSearch(e.target.value) }), search && h('button', { className: 'msa-icon-btn', onClick: () => setSearch('') }, ICON.x()))),
      h('button', { className: 'msa-edge-toggle', 'aria-label': navOpen ? 'Hide menu' : 'Show menu', onClick: () => setNavOpen(o => !o) }, h('span', { className: 'msa-edge-chev' }, navOpen ? '‹' : '›')),
      h('div', { className: 'msa-nav-overlay', onClick: () => setNavOpen(false) }),
      h('aside', { className: 'msa-sidebar' },
        h('div', { className: 'msa-brand' }, h('img', { src: 'assets/logo.png', alt: '', onError: (e) => { e.target.style.display = 'none'; } }), h('span', null, 'MarrakechStory'), h('button', { className: 'msa-drawer-close', onClick: () => setNavOpen(false) }, ICON.x())),
        h('nav', { className: 'msa-nav' }, visibleTabs.map(([id, label, icon]) => h('button', { key: id, title: label, className: 'msa-nav-btn' + (tab === id && !search ? ' active' : ''), onClick: () => goTab(id) }, h('span', { className: 'msa-nav-ico' }, ICON[icon]()), h('span', { className: 'msa-nav-label' }, label), (NAV_BADGE[id] > 0) && h('span', { className: 'msa-nav-badge' }, NAV_BADGE[id])))),
        h('div', { className: 'msa-user' },
          h('div', { className: 'msa-emoji-row' },
            h('button', { className: 'msa-emoji-btn', onClick: () => setDark(d => !d), title: dark ? 'Light mode' : 'Night mode' }, dark ? '☀️' : '🌙'),
            h('a', { className: 'msa-emoji-btn', href: '#', onClick: () => setNavOpen(false), title: 'Back to website' }, '🌐')),
          h('div', { className: 'msa-user-info' }, h('strong', null, (user.user_metadata && user.user_metadata.name) || (isAdmin ? 'Aladdin faiz' : 'Partner')), h('span', { className: 'msa-dim' }, isAdmin ? 'Administrator' : 'Partner · assistant')),
          h('button', { className: 'msa-btn msa-btn-ghost msa-btn-block', onClick: onLogout, title: 'Log out' }, ICON.logout(), h('span', { className: 'msa-nav-label' }, 'Log out')))),
      h('main', { className: 'msa-main' }, body()));
  }

  function AdminRoot() {
    const [user, setUser] = useState(undefined);
    const [role, setRole] = useState(null);
    const applyUser = useCallback(async (u, resolvedRole) => {
      const sb = getSB();
      if (!u || !sb) { CURRENT_ROLE = CURRENT_EMAIL = CURRENT_NAME = null; setUser(null); setRole(null); return; }
      const r = resolvedRole || await ensureStaffAccess(u);
      if (!r) { CURRENT_ROLE = CURRENT_EMAIL = CURRENT_NAME = null; setUser(null); setRole(null); return; }
      CURRENT_ROLE = r; CURRENT_EMAIL = (u.email || '').toLowerCase();
      CURRENT_NAME = (u.user_metadata && u.user_metadata.name) || (r === 'admin' ? 'Aladdin' : 'Partner');
      if (isAdminRecoveryLanding() && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + '#admin');
      }
      touchPresence('login');
      setRole(r); setUser(u);
    }, []);
    useEffect(() => { const sb = getSB(); if (!sb) { setUser(null); return; }
      (async () => {
        const recovered = await recoverAdminSessionFromSiteClient();
        if (recovered && recovered.user) { applyUser(recovered.user); return; }
        const { data } = await sb.auth.getSession();
        applyUser(data.session && data.session.user);
      })();
      const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { applyUser(s && s.user); });
      return () => sub && sub.subscription && sub.subscription.unsubscribe && sub.subscription.unsubscribe(); }, [applyUser]);
    const logout = async () => {
      const sb = getSB();
      if (sb) await sb.auth.signOut();
      if (window.MS_SB && window.MS_SB.auth && window.MS_SB !== sb) await window.MS_SB.auth.signOut();
      CURRENT_ROLE = CURRENT_EMAIL = CURRENT_NAME = null; setUser(null); setRole(null); location.hash = '';
    };
    if (user === undefined) return h('div', { className: 'msa-login' }, h('div', { className: 'msa-empty' }, 'Loading…'));
    if (!user) return h(Login, { onAuthed: applyUser });
    return h(Shell, { user, role, onLogout: logout });
  }

  let root = null;
  window.MS_AdminMount = function (el) { if (!el) return; if (!root) root = window.ReactDOM.createRoot(el); root.render(h(AdminRoot)); };
  window.MS_AdminUnmount = function () { if (root) { root.unmount(); root = null; } };
})();
