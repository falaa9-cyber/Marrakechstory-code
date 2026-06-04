// ============================================================
// MarrakechStory — Private Admin / Operations system
// Faithful port of the Marrakechstory-Admin (Firebase) app to this
// site's Supabase + no-build UMD React stack. Every section, field,
// status, calculation and document matches the original.
//
// Access:  <site>/#admin   (discreet link in the footer + direct URL)
// Auth:    email + password. ONLY f.alaa9@gmail.com. RLS enforces it.
// Sections: Dashboard · Bookings · Itinerary Builder · Calendar ·
//           Clients · Collaborators · Finance · Tasks · Leads
//
// Website forms auto-route into the right section via a DB trigger:
//   itinerary/quickbook/tweak -> bookings (+ clients)
//   collaboration            -> leads (convert to collaborator)
//   all contacts             -> clients
// Exposes window.MS_AdminMount(el) — called by app.jsx on #admin.
// ============================================================
(function () {
  const R = window.React;
  const { useState, useEffect, useMemo, useCallback } = R;
  const h = R.createElement;

  const ADMIN_EMAIL = 'f.alaa9@gmail.com';
  const COMPANY = (window.MS_CTX && window.MS_CTX.COMPANY) || {
    email: 'hei@marrakechstory.com', phone: '+47 457 74 743', whatsapp: '4745774743',
  };

  // ---- Dedicated Supabase client (persists the admin session) ----
  let SB = null;
  function getSB() {
    if (SB) return SB;
    if (!window.supabase || !window.MS_ENV || !window.MS_ENV.SUPABASE_URL) return null;
    SB = window.supabase.createClient(window.MS_ENV.SUPABASE_URL, window.MS_ENV.SUPABASE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ms-admin-auth' } });
    return SB;
  }
  async function dbList(table, order, asc) {
    const sb = getSB(); if (!sb) return [];
    let q = sb.from(table).select('*');
    if (order) q = q.order(order, { ascending: asc !== false });
    const { data, error } = await q;
    if (error) { console.warn('[admin] list ' + table, error.message); return []; }
    return data || [];
  }
  async function dbInsert(table, row) { const sb = getSB(); if (!sb) return { error: 'no client' }; return await sb.from(table).insert(row).select(); }
  async function dbUpdate(table, id, patch) { const sb = getSB(); if (!sb) return { error: 'no client' }; return await sb.from(table).update(patch).eq('id', id).select(); }
  async function dbDelete(table, id) { const sb = getSB(); if (!sb) return { error: 'no client' }; return await sb.from(table).delete().eq('id', id); }

  // ---- formatting (NOK, like the original) ----
  const nf = (n) => (Number(n) || 0).toLocaleString('en-US');
  const fmtNOK = (n) => nf(n) + ' NOK';
  const fmtDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const waLink = (phone) => 'https://wa.me/' + String(phone || '').replace(/[^0-9]/g, '');

  const STATUS_LABEL = {
    new: 'New', quotation_sent: 'Quotation Sent', waiting_confirmation: 'Awaiting Confirmation',
    confirmed: 'Confirmed', deposit_paid: 'Deposit Paid', fully_paid: 'Fully Paid',
    ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
  };
  const STATUS_ORDER = Object.keys(STATUS_LABEL);
  // booking-source + activity-type vocabularies (from the original modals)
  const LEAD_SOURCES = ['website', 'whatsapp', 'instagram', 'recommended', 'email', 'other'];
  const ACTIVITY_TYPES = ['Guided Tour','Cooking Class','Hot Air Balloon','Paragliding','Agafay Day Pass','Agafay Dinner','Quad/Buggy','Camel Ride','Jet Ski','Restaurant','Spa/Hammam','Excursion','Transport'];
  const SUP_TYPES = [['hotel','Hotel/Riad'],['driver','Transport/Driver'],['guide','Guide'],['camp','Desert Camp'],['activity','Activity Provider']];

  // =====================================================================
  // LOGIN
  // =====================================================================
  function Login({ onAuthed }) {
    const [email, setEmail] = useState(ADMIN_EMAIL);
    const [pass, setPass] = useState('');
    const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
    const submit = async (e) => {
      e.preventDefault(); setErr(''); setBusy(true);
      const sb = getSB(); if (!sb) { setErr('Supabase not loaded'); setBusy(false); return; }
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
      setBusy(false);
      if (error) { setErr(error.message); return; }
      if (!data.user || data.user.email !== ADMIN_EMAIL) { await sb.auth.signOut(); setErr('This account is not authorised.'); return; }
      onAuthed(data.user);
    };
    return h('div', { className: 'msa-login' },
      h('form', { className: 'msa-login-card', onSubmit: submit },
        h('img', { src: 'assets/logo.png', alt: '', className: 'msa-login-logo', onError: (e) => { e.target.style.display = 'none'; } }),
        h('h1', null, 'MarrakechStory'),
        h('p', { className: 'msa-login-sub' }, 'Internal Operations System'),
        err && h('div', { className: 'msa-login-err' }, err),
        h('label', null, 'Email'),
        h('input', { type: 'email', autoComplete: 'email', value: email, onChange: (e) => setEmail(e.target.value) }),
        h('label', null, 'Password'),
        h('input', { type: 'password', autoComplete: 'current-password', value: pass, onChange: (e) => setPass(e.target.value), placeholder: '••••••••' }),
        h('button', { type: 'submit', disabled: busy, className: 'msa-btn msa-btn-primary msa-btn-block' }, busy ? 'Signing in…' : 'Sign in with Email'),
        h('a', { href: '#', className: 'msa-login-back' }, '← Back to site')
      )
    );
  }

  // =====================================================================
  // YEARLY / MONTH CALENDAR  (dashboard widget — matches YearlyCalendar.tsx)
  // =====================================================================
  function YearCalendar({ bookings }) {
    const [view, setView] = useState('year');
    const [cursor, setCursor] = useState(new Date());
    // build a set of YYYY-MM-DD strings that fall within any booking range
    const bookingDays = useMemo(() => {
      const map = {};
      bookings.forEach(b => {
        if (!b.arrival_date || !b.departure_date) return;
        let d = new Date(b.arrival_date); const end = new Date(b.departure_date);
        if (isNaN(d) || isNaN(end)) return;
        let guard = 0;
        while (d <= end && guard++ < 400) {
          const k = d.toISOString().slice(0, 10);
          (map[k] = map[k] || []).push(b.client_name || '—');
          d = new Date(d.getTime() + 864e5);
        }
      });
      return map;
    }, [bookings]);

    const Y = cursor.getFullYear(), M = cursor.getMonth();
    const prev = () => setCursor(view === 'year' ? new Date(Y - 1, M, 1) : new Date(Y, M - 1, 1));
    const next = () => setCursor(view === 'year' ? new Date(Y + 1, M, 1) : new Date(Y, M + 1, 1));
    const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const miniMonth = (mi) => {
      const first = new Date(Y, mi, 1); const startDay = first.getDay();
      const dim = new Date(Y, mi + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < startDay; i++) cells.push(h('span', { key: 'e' + i, className: 'msa-mini-day empty' }));
      for (let d = 1; d <= dim; d++) {
        const k = new Date(Y, mi, d).toISOString().slice(0, 10);
        cells.push(h('span', { key: d, className: 'msa-mini-day' + (bookingDays[k] ? ' has' : '') }, d));
      }
      return h('div', { key: mi, className: 'msa-mini-month', onClick: () => { setCursor(new Date(Y, mi, 1)); setView('month'); } },
        h('div', { className: 'msa-mini-name' }, MON[mi]),
        h('div', { className: 'msa-mini-grid' }, ['S','M','T','W','T','F','S'].map((d, i) => h('span', { key: 'h' + i, className: 'msa-mini-dow' }, d)), cells)
      );
    };

    const fullMonth = () => {
      const first = new Date(Y, M, 1); const startDay = first.getDay();
      const dim = new Date(Y, M + 1, 0).getDate();
      const cells = [];
      ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach((d, i) => cells.push(h('div', { key: 'dow' + i, className: 'msa-cal-dow' }, d)));
      for (let i = 0; i < startDay; i++) cells.push(h('div', { key: 'e' + i, className: 'msa-cal-cell out' }));
      for (let d = 1; d <= dim; d++) {
        const k = new Date(Y, M, d).toISOString().slice(0, 10);
        const names = bookingDays[k] || [];
        cells.push(h('div', { key: d, className: 'msa-cal-cell' },
          h('span', { className: 'msa-cal-num' }, d),
          names.slice(0, 3).map((n, i) => h('div', { key: i, className: 'msa-cal-evt', title: n }, n))
        ));
      }
      return h('div', { className: 'msa-cal-grid' }, cells);
    };

    return h('div', { className: 'msa-card' },
      h('div', { className: 'msa-card-head' },
        h('div', null, h('h3', null, view === 'year' ? Y : MON[M] + ' ' + Y),
          h('div', { className: 'msa-muted' }, 'Operational schedule & availability')),
        h('div', { className: 'msa-cal-controls' },
          h('div', { className: 'msa-seg' },
            h('button', { className: view === 'year' ? 'active' : '', onClick: () => setView('year') }, 'Year'),
            h('button', { className: view === 'month' ? 'active' : '', onClick: () => setView('month') }, 'Month')),
          h('button', { className: 'msa-icon-btn', onClick: prev }, '‹'),
          h('button', { className: 'msa-icon-btn', onClick: next }, '›')
        )
      ),
      view === 'year'
        ? h('div', { className: 'msa-mini-months' }, MON.map((_, i) => miniMonth(i)))
        : fullMonth()
    );
  }

  // =====================================================================
  // DASHBOARD  (matches Dashboard.tsx — 5 stat cards + calendar + tasks)
  // =====================================================================
  function Dashboard({ bookings, tasks, leads, go }) {
    const now = new Date();
    const active = bookings.filter(b => {
      const a = b.arrival_date ? new Date(b.arrival_date) : null, d = b.departure_date ? new Date(b.departure_date) : null;
      return a && d && now >= a && now <= d && ['confirmed','deposit_paid','fully_paid'].includes(b.status);
    }).length;
    const upcoming = bookings.filter(b => { const a = b.arrival_date ? new Date(b.arrival_date) : null; return a && a > now && ['confirmed','deposit_paid','fully_paid'].includes(b.status); }).length;
    const revenue = bookings.reduce((s, b) => s + (Number(b.selling_price) || 0), 0);
    const totalCost = bookings.reduce((s, b) => s + (Number(b.total_cost) || 0), 0);
    const benefit = revenue - totalCost;

    const stat = (label, value, cls) => h('div', { className: 'msa-stat ' + (cls || '') },
      h('span', { className: 'msa-stat-label' }, label), h('span', { className: 'msa-stat-value' }, value));

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Hello Marrakechstory'),
        h('p', null, "Here's what's happening with your agency today.")),
      h('div', { className: 'msa-stat-grid msa-stat-5' },
        stat('Active Bookings', active),
        stat('Upcoming', upcoming),
        stat('Total Income', fmtNOK(revenue)),
        stat('Total Cost', fmtNOK(totalCost)),
        stat('Total Benefit', fmtNOK(benefit), 'msa-stat-brand')
      ),
      h('div', { className: 'msa-cols msa-cols-21' },
        h(YearCalendar, { bookings }),
        h('div', { className: 'msa-card' },
          h('div', { className: 'msa-card-head' }, h('h3', null, 'Task Reminders'),
            h('button', { className: 'msa-link', onClick: () => go('tasks') }, 'View all')),
          tasks.length === 0
            ? h('div', { className: 'msa-empty' }, 'No pending tasks.')
            : h('div', null, tasks.slice(0, 8).map(t => h('div', { key: t.id, className: 'msa-task-mini' },
                h('span', { className: 'msa-task-dot' + (t.status === 'completed' ? ' done' : '') }),
                h('div', { className: 'msa-task-mini-body' },
                  h('span', { className: t.status === 'completed' ? 'msa-strike' : '' }, t.title),
                  h('span', { className: 'msa-muted' }, t.due || '')),
                h('span', { className: 'msa-badge msa-pri-' + t.priority }, t.priority))))
        )
      ),
      h('div', { className: 'msa-card' },
        h('div', { className: 'msa-card-head' }, h('h3', null, 'New website leads'),
          h('button', { className: 'msa-link', onClick: () => go('leads') }, 'View all')),
        leads.length === 0
          ? h('div', { className: 'msa-empty' }, 'No leads yet.')
          : h('div', { className: 'msa-lead-list' }, leads.slice(0, 6).map(l => h('div', { key: l.id, className: 'msa-lead' },
              h('div', null, h('strong', null, l.name || l.email || 'Anonymous'),
                h('div', { className: 'msa-muted' }, [l.kind, l.trip_type, l.duration ? l.duration + 'd' : null].filter(Boolean).join(' · '))),
              h('span', { className: 'msa-muted' }, fmtDate(l.created_at)))))
      )
    );
  }

  // =====================================================================
  // BOOKING MODAL  (full create/edit incl. daily itinerary builder)
  // =====================================================================
  const EMPTY_BOOKING = {
    client_name: '', email: '', phone: '', nationality: '', lead_source: 'website',
    reference: '', arrival_city: 'Marrakech', departure_city: 'Marrakech',
    arrival_date: '', departure_date: '', total_nights: 0, total_days: 0,
    adults: 2, kids: 0, kids_ages: '', status: 'new',
    selling_price: 0, deposit_amount: 0, balance: 0,
    cost_transportation: 0, cost_activities: 0, cost_accommodation: 0, total_cost: 0,
    daily_itinerary: [], internal_notes: '', special_requests: '', payment_method: '',
  };

  function BookingModal({ initial, onClose, onSaved }) {
    const [b, setB] = useState(() => ({ ...EMPTY_BOOKING, ...initial, daily_itinerary: (initial && initial.daily_itinerary) || [] }));
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setB(p => ({ ...p, [k]: v }));
    const setCost = (k, v) => setB(p => { const n = { ...p, [k]: v }; n.total_cost = (+n.cost_transportation || 0) + (+n.cost_activities || 0) + (+n.cost_accommodation || 0); return n; });
    const setPrice = (v) => setB(p => ({ ...p, selling_price: v, deposit_amount: Math.round(v * 0.2), balance: Math.round(v * 0.8) }));

    // daily itinerary helpers
    const addDay = () => setB(p => ({ ...p, daily_itinerary: [...p.daily_itinerary, { day: p.daily_itinerary.length + 1, city: '', date: '', activities: [] }] }));
    const setDay = (i, k, v) => setB(p => { const arr = [...p.daily_itinerary]; arr[i] = { ...arr[i], [k]: v }; return { ...p, daily_itinerary: arr }; });
    const addAct = (i) => setB(p => { const arr = [...p.daily_itinerary]; arr[i] = { ...arr[i], activities: [...(arr[i].activities || []), { time: '09:00', type: 'Guided Tour', details: '' }] }; return { ...p, daily_itinerary: arr }; });
    const setAct = (di, ai, k, v) => setB(p => { const arr = [...p.daily_itinerary]; const acts = [...arr[di].activities]; acts[ai] = { ...acts[ai], [k]: v }; arr[di] = { ...arr[di], activities: acts }; return { ...p, daily_itinerary: arr }; });
    const delAct = (di, ai) => setB(p => { const arr = [...p.daily_itinerary]; const acts = [...arr[di].activities]; acts.splice(ai, 1); arr[di] = { ...arr[di], activities: acts }; return { ...p, daily_itinerary: arr }; });
    const delDay = (i) => setB(p => ({ ...p, daily_itinerary: p.daily_itinerary.filter((_, x) => x !== i).map((d, x) => ({ ...d, day: x + 1 })) }));

    const save = async () => {
      if (!b.client_name.trim()) { alert('Client name is required'); return; }
      setBusy(true);
      const row = { ...b,
        reference: b.reference || ('MS-' + Math.random().toString(36).slice(2, 8).toUpperCase()),
        travelers: (+b.adults || 0) + (+b.kids || 0),
        balance: (+b.selling_price || 0) - (+b.deposit_amount || 0),
        updated_at: new Date().toISOString() };
      ['total_nights','total_days','adults','kids'].forEach(k => row[k] = +row[k] || 0);
      ['selling_price','deposit_amount','cost_transportation','cost_activities','cost_accommodation','total_cost'].forEach(k => row[k] = +row[k] || 0);
      if (!row.arrival_date) delete row.arrival_date;
      if (!row.departure_date) delete row.departure_date;
      delete row.id; delete row.created_at; delete row.routed_booking_id;
      const res = b.id ? await dbUpdate('bookings', b.id, row) : await dbInsert('bookings', { ...row, created_by: ADMIN_EMAIL });
      setBusy(false);
      if (res.error) { alert('Save failed: ' + res.error.message); return; }
      onSaved();
    };

    const field = (label, k, type) => h('div', { className: 'msa-field' }, h('label', null, label),
      h('input', { type: type || 'text', value: b[k] == null ? '' : b[k], onChange: (e) => set(k, type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value) }));

    return h('div', { className: 'msa-modal-backdrop', onClick: onClose },
      h('div', { className: 'msa-modal msa-modal-wide', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'msa-modal-head' },
          h('h2', null, b.id ? 'Edit Booking' : 'New Booking'),
          h('div', null, h('button', { className: 'msa-btn', onClick: onClose }, 'Cancel'),
            h('button', { className: 'msa-btn msa-btn-primary', disabled: busy, onClick: save }, busy ? 'Saving…' : 'Save Booking'))),
        h('div', { className: 'msa-modal-body' },
          h('h4', { className: 'msa-section' }, '1 · Client Details'),
          h('div', { className: 'msa-grid-2' },
            field('Full Name', 'client_name'), field('Email', 'email', 'email'),
            field('Phone', 'phone'), field('Nationality', 'nationality'),
            h('div', { className: 'msa-field' }, h('label', null, 'Booking Source'),
              h('select', { value: b.lead_source, onChange: (e) => set('lead_source', e.target.value) }, LEAD_SOURCES.map(s => h('option', { key: s, value: s }, s)))),
            field('Internal Reference', 'reference')),
          h('h4', { className: 'msa-section' }, '2 · Trip Logistics'),
          h('div', { className: 'msa-grid-2' },
            field('Arrival City', 'arrival_city'), field('Departure City', 'departure_city'),
            field('Arrival Date', 'arrival_date', 'date'), field('Departure Date', 'departure_date', 'date'),
            field('Nights', 'total_nights', 'number'), field('Days', 'total_days', 'number'),
            field('Adults', 'adults', 'number'), field('Kids', 'kids', 'number')),
          (+b.kids > 0) && field('Kids Ages', 'kids_ages'),
          h('h4', { className: 'msa-section msa-section-row' }, h('span', null, '3 · Daily Itinerary'),
            h('button', { className: 'msa-btn msa-btn-sm msa-btn-primary', onClick: addDay }, '+ Add Day')),
          h('div', { className: 'msa-day-grid' },
            (b.daily_itinerary || []).map((day, di) => h('div', { key: di, className: 'msa-day-card' },
              h('div', { className: 'msa-day-head' },
                h('span', { className: 'msa-day-num' }, day.day),
                h('button', { className: 'msa-icon-btn', onClick: () => delDay(di) }, '🗑')),
              h('input', { className: 'msa-day-in', placeholder: 'City', value: day.city || '', onChange: (e) => setDay(di, 'city', e.target.value) }),
              h('input', { className: 'msa-day-in', type: 'date', value: day.date || '', onChange: (e) => setDay(di, 'date', e.target.value) }),
              (day.activities || []).map((a, ai) => h('div', { key: ai, className: 'msa-act' },
                h('div', { className: 'msa-act-row' },
                  h('input', { type: 'time', value: a.time, onChange: (e) => setAct(di, ai, 'time', e.target.value) }),
                  h('select', { value: a.type, onChange: (e) => setAct(di, ai, 'type', e.target.value) }, ACTIVITY_TYPES.map(t => h('option', { key: t, value: t }, t))),
                  h('button', { className: 'msa-icon-btn', onClick: () => delAct(di, ai) }, '✕')),
                h('input', { className: 'msa-day-in', placeholder: 'Details…', value: a.details, onChange: (e) => setAct(di, ai, 'details', e.target.value) }))),
              h('button', { className: 'msa-btn msa-btn-sm msa-add-act', onClick: () => addAct(di) }, '+ Activity'))) ),
          h('h4', { className: 'msa-section' }, '4 · Internal Costs'),
          h('div', { className: 'msa-grid-2' },
            h('div', { className: 'msa-field' }, h('label', null, 'Transport'), h('input', { type: 'number', value: b.cost_transportation || '', onChange: (e) => setCost('cost_transportation', parseFloat(e.target.value) || 0) })),
            h('div', { className: 'msa-field' }, h('label', null, 'Activities'), h('input', { type: 'number', value: b.cost_activities || '', onChange: (e) => setCost('cost_activities', parseFloat(e.target.value) || 0) })),
            h('div', { className: 'msa-field' }, h('label', null, 'Accommodation'), h('input', { type: 'number', value: b.cost_accommodation || '', onChange: (e) => setCost('cost_accommodation', parseFloat(e.target.value) || 0) })),
            h('div', { className: 'msa-field' }, h('label', null, 'Total Cost'), h('div', { className: 'msa-readout' }, fmtNOK(b.total_cost)))),
          h('h4', { className: 'msa-section' }, '5 · Pricing & Status'),
          h('div', { className: 'msa-grid-2' },
            h('div', { className: 'msa-field' }, h('label', null, 'Total Selling Price (NOK)'), h('input', { type: 'number', value: b.selling_price || '', onChange: (e) => setPrice(parseFloat(e.target.value) || 0) })),
            h('div', { className: 'msa-field' }, h('label', null, 'Status'), h('select', { value: b.status, onChange: (e) => set('status', e.target.value) }, STATUS_ORDER.map(s => h('option', { key: s, value: s }, STATUS_LABEL[s])))),
            h('div', { className: 'msa-field' }, h('label', null, 'Deposit (20%)'), h('div', { className: 'msa-readout' }, fmtNOK(b.deposit_amount))),
            h('div', { className: 'msa-field' }, h('label', null, 'Balance (80%)'), h('div', { className: 'msa-readout' }, fmtNOK(b.balance)))),
          h('h4', { className: 'msa-section' }, '6 · Notes'),
          h('div', { className: 'msa-field' }, h('label', null, 'Internal notes'), h('textarea', { rows: 2, value: b.internal_notes || '', onChange: (e) => set('internal_notes', e.target.value) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Special requests'), h('textarea', { rows: 2, value: b.special_requests || '', onChange: (e) => set('special_requests', e.target.value) }))
        )
      )
    );
  }

  // =====================================================================
  // DOCUMENT VIEW  (Itinerary + Invoice, printable — matches Bookings.tsx)
  // =====================================================================
  function DocModal({ booking, initialType, onClose }) {
    const [type, setType] = useState(initialType || 'itinerary');
    const b = booking;
    const print = () => window.print();
    const logo = h('img', { src: 'assets/logo.png', alt: '', className: 'msa-doc-logo', onError: (e) => { e.target.style.display = 'none'; } });

    const itinerary = () => h('div', { className: 'msa-doc' },
      h('div', { className: 'msa-doc-top' },
        h('div', { className: 'msa-doc-brand' }, logo, h('div', null, h('h1', null, 'MarrakechStory'), h('p', null, 'Bespoke Travel Experiences'))),
        h('div', { className: 'msa-doc-meta' }, h('h2', null, 'Travel Itinerary'),
          h('p', null, 'Ref: ' + (b.reference || '—')), h('p', null, 'Date: ' + new Date().toLocaleDateString()))),
      h('div', { className: 'msa-doc-cols' },
        h('div', null, h('h3', null, 'Prepared For'), h('p', { className: 'msa-doc-big' }, b.client_name),
          h('p', { className: 'msa-muted' }, ((b.adults || 0) + (b.kids || 0)) + ' Travelers (' + (b.adults || 0) + ' Adults, ' + (b.kids || 0) + ' Kids)')),
        h('div', { className: 'msa-right' }, h('h3', null, 'Trip Overview'),
          h('p', { className: 'msa-doc-big' }, (b.arrival_city || '—') + ' → ' + (b.departure_city || '—')),
          h('p', { className: 'msa-muted' }, (b.total_nights || 0) + ' Nights / ' + (b.total_days || 0) + ' Days'),
          h('p', { className: 'msa-muted' }, fmtDate(b.arrival_date) + ' — ' + fmtDate(b.departure_date)))),
      h('div', { className: 'msa-doc-days' },
        (b.daily_itinerary || []).length === 0
          ? h('p', { className: 'msa-muted' }, 'No daily itinerary added yet.')
          : (b.daily_itinerary || []).map((day, i) => h('div', { key: i, className: 'msa-doc-day' },
              h('div', { className: 'msa-doc-day-head' }, h('h3', null, 'Day ' + day.day), day.city && h('span', null, '— ' + day.city),
                h('span', { className: 'msa-muted msa-doc-date' }, day.date || 'TBD')),
              (day.activities || []).map((a, ai) => h('div', { key: ai, className: 'msa-doc-act' },
                h('div', { className: 'msa-doc-time' }, a.time), h('div', null, h('strong', null, a.type), h('p', null, a.details))))))),
      h('div', { className: 'msa-doc-foot' }, h('p', null, 'Thank you for choosing MarrakechStory. We wish you an unforgettable journey.'),
        h('p', null, 'www.marrakechstory.com | ' + COMPANY.phone))
    );

    const invoice = () => {
      const sub = +b.selling_price || 0, dep = +b.deposit_amount || 0, bal = +b.balance || (sub - dep);
      return h('div', { className: 'msa-doc' },
        h('div', { className: 'msa-doc-top' },
          h('div', { className: 'msa-doc-brand' }, logo, h('div', null, h('h1', null, 'MarrakechStory'),
            h('p', null, 'Invoice #INV-' + (b.reference || '').split('-').pop()))),
          h('div', { className: 'msa-doc-meta' }, h('h2', null, 'INVOICE'), h('p', null, 'Date: ' + new Date().toLocaleDateString()))),
        h('div', { className: 'msa-doc-cols' },
          h('div', null, h('h3', null, 'Bill To'), h('p', { className: 'msa-doc-big' }, b.client_name),
            h('p', { className: 'msa-muted' }, b.email || ''), h('p', { className: 'msa-muted' }, b.phone || '')),
          h('div', { className: 'msa-right' }, h('h3', null, 'Payment Details'),
            h('p', { className: 'msa-muted' }, 'Status: ' + (STATUS_LABEL[b.status] || b.status)),
            h('p', { className: 'msa-muted' }, 'Method: ' + (b.payment_method || 'Bank Transfer')))),
        h('table', { className: 'msa-table msa-doc-table' },
          h('thead', null, h('tr', null, h('th', null, 'Description'), h('th', { className: 'msa-right' }, 'Amount'))),
          h('tbody', null, h('tr', null,
            h('td', null, h('strong', null, 'Bespoke Travel Package'),
              h('div', { className: 'msa-muted' }, (b.total_nights || 0) + ' Nights: ' + (b.arrival_city || '') + ' → ' + (b.departure_city || '')),
              h('div', { className: 'msa-muted' }, ((b.adults || 0) + (b.kids || 0)) + ' Travelers')),
            h('td', { className: 'msa-right' }, fmtNOK(sub))))),
        h('div', { className: 'msa-doc-totals' },
          h('div', null, h('span', { className: 'msa-muted' }, 'Subtotal'), h('span', null, fmtNOK(sub))),
          h('div', null, h('span', { className: 'msa-muted' }, 'Deposit Paid'), h('span', { className: 'msa-pos' }, '-' + fmtNOK(dep))),
          h('div', { className: 'msa-doc-balance' }, h('span', null, 'Balance Due'), h('span', null, fmtNOK(bal)))),
        h('div', { className: 'msa-doc-bank' }, h('h3', null, 'Bank Transfer Details'),
          h('div', { className: 'msa-bank-grid' },
            h('span', { className: 'msa-muted' }, 'Bank Name:'), h('span', null, 'BMCE Bank of Africa'),
            h('span', { className: 'msa-muted' }, 'Account Name:'), h('span', null, 'MarrakechStory SARL'),
            h('span', { className: 'msa-muted' }, 'RIB:'), h('span', null, '011 450 0000 123456789012 34'),
            h('span', { className: 'msa-muted' }, 'SWIFT:'), h('span', null, 'BMCE MAMC'))));
    };

    return h('div', { className: 'msa-modal-backdrop', onClick: onClose },
      h('div', { className: 'msa-modal msa-modal-doc', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'msa-modal-head msa-print-hide' },
          h('div', { className: 'msa-seg' },
            h('button', { className: type === 'itinerary' ? 'active' : '', onClick: () => setType('itinerary') }, 'Itinerary'),
            h('button', { className: type === 'invoice' ? 'active' : '', onClick: () => setType('invoice') }, 'Invoice')),
          h('div', null, h('button', { className: 'msa-btn', onClick: print }, '🖨 Print'),
            h('button', { className: 'msa-btn', onClick: onClose }, 'Close'))),
        h('div', { className: 'msa-modal-body', id: 'msa-printable' }, type === 'itinerary' ? itinerary() : invoice())
      )
    );
  }

  // =====================================================================
  // BOOKINGS
  // =====================================================================
  function Bookings({ bookings, reload, openNew, clearOpenNew }) {
    const [edit, setEdit] = useState(null);
    const [doc, setDoc] = useState(null);
    const [q, setQ] = useState('');
    useEffect(() => { if (openNew) { setEdit(EMPTY_BOOKING); clearOpenNew && clearOpenNew(); } }, [openNew]);
    const filtered = bookings.filter(b => !q || (b.client_name + ' ' + (b.reference || '') + ' ' + (b.email || '')).toLowerCase().includes(q.toLowerCase()));
    const del = async (b, e) => { e.stopPropagation(); if (confirm('Delete ' + (b.reference || b.client_name) + '?')) { await dbDelete('bookings', b.id); reload(); } };
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' },
        h('div', null, h('h1', null, 'Bookings'), h('p', null, 'Manage all your client trips and inquiries.')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setEdit(EMPTY_BOOKING) }, '+ New Booking')),
      h('div', { className: 'msa-toolbar' }, h('input', { className: 'msa-search', placeholder: 'Search by client, reference, or email…', value: q, onChange: (e) => setQ(e.target.value) })),
      h('div', { className: 'msa-card msa-card-flush' },
        filtered.length === 0 ? h('div', { className: 'msa-empty' }, 'No bookings found. Create your first one!')
        : h('table', { className: 'msa-table' },
            h('thead', null, h('tr', null, ['Reference','Client','Dates','Travelers','Price (NOK)','Status',''].map((c, i) => h('th', { key: i }, c)))),
            h('tbody', null, filtered.map(b => h('tr', { key: b.id, className: 'msa-row-click', onClick: () => setEdit(b) },
              h('td', { 'data-label': 'Reference' }, h('span', { className: 'msa-mono' }, b.reference || '—')),
              h('td', { 'data-label': 'Client' }, h('strong', null, b.client_name), h('div', { className: 'msa-muted' }, b.email || '')),
              h('td', { 'data-label': 'Dates' }, h('div', { className: 'msa-muted' }, fmtDate(b.arrival_date)), h('div', { className: 'msa-muted' }, '→ ' + fmtDate(b.departure_date))),
              h('td', { 'data-label': 'Travelers' }, (b.adults || 0) + (b.kids || 0)),
              h('td', { 'data-label': 'Price' }, b.selling_price ? fmtNOK(b.selling_price) : '—'),
              h('td', { 'data-label': 'Status' }, h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status] || b.status)),
              h('td', { 'data-label': 'Actions', className: 'msa-right msa-actions' },
                h('button', { className: 'msa-icon-btn', title: 'Itinerary', onClick: (e) => { e.stopPropagation(); setDoc({ booking: b, type: 'itinerary' }); } }, '📄'),
                h('button', { className: 'msa-icon-btn', title: 'Invoice', onClick: (e) => { e.stopPropagation(); setDoc({ booking: b, type: 'invoice' }); } }, '🧾'),
                b.phone && h('a', { className: 'msa-icon-btn', title: 'WhatsApp', href: waLink(b.phone), target: '_blank', onClick: (e) => e.stopPropagation() }, '💬'),
                h('button', { className: 'msa-icon-btn', title: 'Delete', onClick: (e) => del(b, e) }, '🗑')))))) ),
      edit && h(BookingModal, { initial: edit.id ? edit : EMPTY_BOOKING, onClose: () => setEdit(null), onSaved: () => { setEdit(null); reload(); } }),
      doc && h(DocModal, { booking: doc.booking, initialType: doc.type, onClose: () => setDoc(null) })
    );
  }

  // =====================================================================
  // CLIENTS  (table: Name, Contact, Country, Trips)
  // =====================================================================
  function Clients({ clients, reload }) {
    const [adding, setAdding] = useState(false); const [q, setQ] = useState('');
    const [f, setF] = useState({ name: '', email: '', phone: '', country: '' });
    const add = async () => { if (!f.name.trim()) { alert('Client name is required'); return; } await dbInsert('clients', { ...f, email: f.email ? f.email.toLowerCase() : null, trips: 0, created_by: ADMIN_EMAIL }); setF({ name: '', email: '', phone: '', country: '' }); setAdding(false); reload(); };
    const del = async (c) => { if (confirm('Remove ' + c.name + '?')) { await dbDelete('clients', c.id); reload(); } };
    const filtered = clients.filter(c => !q || (c.name + ' ' + (c.email || '') + ' ' + (c.country || '')).toLowerCase().includes(q.toLowerCase()));
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' },
        h('div', null, h('h1', null, 'Clients'), h('p', null, 'Manage your customer database and travel history.')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setAdding(a => !a) }, adding ? 'Close' : '+ Add Client')),
      adding && h('div', { className: 'msa-card msa-inline-form' },
        h('div', { className: 'msa-grid-4' },
          h('input', { placeholder: 'Full name', value: f.name, onChange: (e) => setF({ ...f, name: e.target.value }) }),
          h('input', { placeholder: 'Email', value: f.email, onChange: (e) => setF({ ...f, email: e.target.value }) }),
          h('input', { placeholder: 'Phone', value: f.phone, onChange: (e) => setF({ ...f, phone: e.target.value }) }),
          h('input', { placeholder: 'Country', value: f.country, onChange: (e) => setF({ ...f, country: e.target.value }) })),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: add }, 'Save Client')),
      h('div', { className: 'msa-toolbar' }, h('input', { className: 'msa-search', placeholder: 'Search by name, email, or country…', value: q, onChange: (e) => setQ(e.target.value) })),
      h('div', { className: 'msa-card msa-card-flush' },
        filtered.length === 0 ? h('div', { className: 'msa-empty' }, 'No clients found.')
        : h('table', { className: 'msa-table' },
            h('thead', null, h('tr', null, ['Name','Contact Info','Country','Trips',''].map((c, i) => h('th', { key: i, className: i === 3 ? 'msa-center' : '' }, c)))),
            h('tbody', null, filtered.map(c => h('tr', { key: c.id },
              h('td', { 'data-label': 'Name' }, h('strong', null, c.name)),
              h('td', { 'data-label': 'Contact' }, c.email && h('div', { className: 'msa-muted' }, '✉ ', h('a', { href: 'mailto:' + c.email }, c.email)), c.phone && h('div', { className: 'msa-muted' }, '📞 ', h('a', { href: waLink(c.phone), target: '_blank' }, c.phone))),
              h('td', { 'data-label': 'Country' }, c.country || '—'),
              h('td', { 'data-label': 'Trips', className: 'msa-center' }, h('strong', null, c.trips || 0)),
              h('td', { 'data-label': '', className: 'msa-right' }, h('button', { className: 'msa-icon-btn', onClick: () => del(c) }, '🗑'))))) ))
    );
  }

  // =====================================================================
  // COLLABORATORS  (card grid — Hotel/Driver/Guide/Camp/Activity)
  // =====================================================================
  function Suppliers({ suppliers, reload, seed, clearSeed }) {
    const [adding, setAdding] = useState(false);
    const [f, setF] = useState({ name: '', type: 'hotel', city: '', contact: '', phone: '', email: '', rate: '', notes: '' });
    useEffect(() => { if (seed) { setF({ name: '', type: 'hotel', city: '', contact: '', phone: '', email: '', rate: '', notes: '', ...seed }); setAdding(true); clearSeed && clearSeed(); } }, [seed]);
    const add = async () => { if (!f.name.trim() || !f.city.trim()) { alert('Name and City are required'); return; } await dbInsert('suppliers', f); setF({ name: '', type: 'hotel', city: '', contact: '', phone: '', email: '', rate: '', notes: '' }); setAdding(false); reload(); };
    const del = async (s) => { if (confirm('Remove ' + s.name + '?')) { await dbDelete('suppliers', s.id); reload(); } };
    const typeLabel = (t) => (SUP_TYPES.find(x => x[0] === t) || [t, t])[1];
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' },
        h('div', null, h('h1', null, 'Collaborators'), h('p', null, 'Your network of hotels, drivers, and guides.')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setAdding(a => !a) }, adding ? 'Close' : '+ Add Collaborator')),
      adding && h('div', { className: 'msa-card msa-inline-form' },
        h('div', { className: 'msa-grid-4' },
          h('input', { placeholder: 'Collaborator name', value: f.name, onChange: (e) => setF({ ...f, name: e.target.value }) }),
          h('select', { value: f.type, onChange: (e) => setF({ ...f, type: e.target.value }) }, SUP_TYPES.map(([v, l]) => h('option', { key: v, value: v }, l))),
          h('input', { placeholder: 'City', value: f.city, onChange: (e) => setF({ ...f, city: e.target.value }) }),
          h('input', { placeholder: 'Contact person', value: f.contact, onChange: (e) => setF({ ...f, contact: e.target.value }) }),
          h('input', { placeholder: 'Phone', value: f.phone, onChange: (e) => setF({ ...f, phone: e.target.value }) }),
          h('input', { placeholder: 'Email', value: f.email, onChange: (e) => setF({ ...f, email: e.target.value }) }),
          h('input', { placeholder: 'Rate', value: f.rate, onChange: (e) => setF({ ...f, rate: e.target.value }) }),
          h('input', { placeholder: 'Notes', value: f.notes, onChange: (e) => setF({ ...f, notes: e.target.value }) })),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: add }, 'Save Collaborator')),
      suppliers.length === 0 ? h('div', { className: 'msa-card' }, h('div', { className: 'msa-empty' }, 'No collaborators added yet.'))
      : h('div', { className: 'msa-card-grid' }, suppliers.map(s => h('div', { key: s.id, className: 'msa-mini-card' },
          h('div', { className: 'msa-mini-head' }, h('span', { className: 'msa-badge msa-type' }, typeLabel(s.type)),
            h('button', { className: 'msa-icon-btn', onClick: () => del(s) }, '🗑')),
          h('strong', { className: 'msa-mini-title' }, s.name),
          h('div', { className: 'msa-muted' }, '📍 ' + (s.city || '—')),
          s.contact && h('div', null, '👤 ' + s.contact),
          s.phone && h('div', null, '📞 ', h('a', { href: waLink(s.phone), target: '_blank' }, s.phone)),
          s.email && h('div', null, '✉ ', h('a', { href: 'mailto:' + s.email }, s.email)),
          s.rate && h('div', { className: 'msa-muted' }, 'Rate: ' + s.rate),
          s.notes && h('div', { className: 'msa-muted msa-notes' }, s.notes))))
    );
  }

  // =====================================================================
  // FINANCE  (3 cards + breakdown table — matches Finance.tsx)
  // =====================================================================
  function Finance({ bookings }) {
    const sales = bookings.reduce((s, b) => s + (+b.selling_price || 0), 0);
    const costs = bookings.reduce((s, b) => s + (+b.total_cost || 0), 0);
    const profit = sales - costs; const margin = sales > 0 ? profit / sales * 100 : 0;
    const card = (label, value, sub, cls) => h('div', { className: 'msa-fin-card' },
      h('span', { className: 'msa-stat-label' }, label), h('span', { className: 'msa-fin-value ' + (cls || '') }, value), sub && h('span', { className: 'msa-muted' }, sub));
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Finance'), h('p', null, "Track your agency's revenue, costs, and profitability.")),
      h('div', { className: 'msa-fin-grid' },
        card('Est. Total Sales', fmtNOK(sales), 'Based on ' + bookings.length + ' trips'),
        card('Est. Total Costs', fmtNOK(costs), 'Total operational costs', 'msa-neg'),
        card('Est. Net Profit', fmtNOK(profit), margin.toFixed(1) + '% margin', 'msa-accent')),
      h('div', { className: 'msa-card msa-card-flush' },
        h('div', { className: 'msa-card-head msa-pad' }, h('h3', null, 'Financial Breakdown by Booking')),
        bookings.length === 0 ? h('div', { className: 'msa-empty' }, 'No financial data available.')
        : h('table', { className: 'msa-table' },
            h('thead', null, h('tr', null, ['Booking','Client','Price','Cost','Profit','Status'].map((c, i) => h('th', { key: i, className: i >= 2 && i <= 4 ? 'msa-right' : '' }, c)))),
            h('tbody', null, bookings.map(b => { const s = +b.selling_price || 0, c = +b.total_cost || 0, p = s - c;
              return h('tr', { key: b.id },
                h('td', { 'data-label': 'Booking' }, h('span', { className: 'msa-mono' }, b.reference || '—')),
                h('td', { 'data-label': 'Client' }, b.client_name),
                h('td', { 'data-label': 'Price', className: 'msa-right' }, fmtNOK(s)),
                h('td', { 'data-label': 'Cost', className: 'msa-right msa-neg' }, fmtNOK(c)),
                h('td', { 'data-label': 'Profit', className: 'msa-right msa-pos' }, fmtNOK(p)),
                h('td', { 'data-label': 'Status' }, h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status] || b.status))); }))))
    );
  }

  // =====================================================================
  // TASKS  (toggle, priority, due date+time)
  // =====================================================================
  function Tasks({ tasks, reload }) {
    const [title, setTitle] = useState(''); const [date, setDate] = useState(todayISO());
    const [time, setTime] = useState('09:00'); const [priority, setPriority] = useState('medium');
    const add = async () => { if (!title.trim()) return; await dbInsert('tasks', { title: title.trim(), due: (date || todayISO()) + ' ' + (time || '09:00'), priority, status: 'pending' }); setTitle(''); reload(); };
    const toggle = async (t) => { await dbUpdate('tasks', t.id, { status: t.status === 'completed' ? 'pending' : 'completed' }); reload(); };
    const del = async (t) => { await dbDelete('tasks', t.id); reload(); };
    const row = (t) => h('div', { key: t.id, className: 'msa-task' + (t.status === 'completed' ? ' done' : '') },
      h('button', { className: 'msa-check', onClick: () => toggle(t) }, t.status === 'completed' ? '✓' : ''),
      h('div', { className: 'msa-task-body' }, h('span', { className: 'msa-task-title' }, t.title), h('span', { className: 'msa-muted' }, '🕑 ' + (t.due || '—'))),
      h('span', { className: 'msa-badge msa-pri-' + t.priority }, t.priority),
      h('button', { className: 'msa-icon-btn', onClick: () => del(t) }, '🗑'));
    return h('div', { className: 'msa-page msa-narrow' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Tasks'), h('p', null, 'Stay on top of your daily operations.')),
      h('div', { className: 'msa-card msa-inline-form' },
        h('div', { className: 'msa-task-add' },
          h('input', { placeholder: 'What needs to be done?', value: title, onChange: (e) => setTitle(e.target.value), onKeyDown: (e) => e.key === 'Enter' && add() }),
          h('input', { type: 'date', value: date, onChange: (e) => setDate(e.target.value) }),
          h('input', { type: 'time', value: time, onChange: (e) => setTime(e.target.value) }),
          h('select', { value: priority, onChange: (e) => setPriority(e.target.value) }, ['low','medium','high'].map(p => h('option', { key: p, value: p }, p + ' priority'))),
          h('button', { className: 'msa-btn msa-btn-primary', onClick: add }, 'Add Task'))),
      h('div', { className: 'msa-card' }, tasks.length === 0 ? h('div', { className: 'msa-empty' }, 'All caught up! No pending tasks.') : tasks.map(row))
    );
  }

  // =====================================================================
  // CALENDAR  (date picker + events for selected day)
  // =====================================================================
  function CalendarTab({ bookings }) {
    const [sel, setSel] = useState(todayISO());
    const events = [];
    bookings.forEach(b => {
      if (b.arrival_date) events.push({ date: b.arrival_date, type: 'Arrival', title: b.client_name + ' Arrival', time: '14:00', cls: 'msa-ev-arrival' });
      if (b.departure_date) events.push({ date: b.departure_date, type: 'Departure', title: b.client_name + ' Departure', time: '11:00', cls: 'msa-ev-departure' });
    });
    const dayEvents = events.filter(e => e.date === sel).sort((a, b) => a.time < b.time ? -1 : 1);
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Calendar'), h('p', null, 'Visual overview of arrivals, departures, and deadlines.')),
      h('div', { className: 'msa-cols msa-cols-12' },
        h('div', { className: 'msa-card' }, h('h3', null, 'Pick a date'),
          h('input', { type: 'date', className: 'msa-date-big', value: sel, onChange: (e) => setSel(e.target.value) }),
          h('div', { className: 'msa-muted', style: { marginTop: 10 } }, events.length + ' total scheduled events')),
        h('div', { className: 'msa-card' },
          h('div', { className: 'msa-card-head' }, h('h3', null, 'Events for ' + fmtDate(sel)), h('span', { className: 'msa-badge' }, dayEvents.length + ' Events')),
          dayEvents.length === 0 ? h('div', { className: 'msa-empty' }, 'No events scheduled for this day.')
          : dayEvents.map((e, i) => h('div', { key: i, className: 'msa-evt-row' },
              h('span', { className: 'msa-badge ' + e.cls }, e.type),
              h('div', { className: 'msa-evt-title' }, e.title),
              h('span', { className: 'msa-evt-time' }, e.time)))))
    );
  }

  // =====================================================================
  // ITINERARY BUILDER  (standalone — title + activities, templates, WA)
  // =====================================================================
  function ItineraryBuilder() {
    const [days, setDays] = useState([{ day: 1, title: 'Arrival in Marrakech', activities: 'Transfer to Riad, Welcome tea, Dinner in Jemaa el-Fna.' }]);
    const add = () => setDays(d => [...d, { day: d.length + 1, title: '', activities: '' }]);
    const rem = (i) => setDays(d => d.filter((_, x) => x !== i).map((x, ix) => ({ ...x, day: ix + 1 })));
    const upd = (i, k, v) => setDays(d => { const a = [...d]; a[i] = { ...a[i], [k]: v }; return a; });
    const copyWA = () => { const t = days.map(d => '*Day ' + d.day + ': ' + d.title + '*\n' + d.activities).join('\n\n'); navigator.clipboard.writeText(t); alert('Itinerary copied for WhatsApp!'); };
    const template = () => setDays([
      { day: 1, title: 'Marrakech to Dades Valley', activities: "Pick up at 8:00 AM. Cross Tizi n'Tichka pass. Visit Kasbah Ait Ben Haddou. Overnight in Dades." },
      { day: 2, title: 'Dades to Merzouga (Desert)', activities: 'Todra Gorges walk. Erfoud fossils. Camel trek at sunset. Luxury desert camp dinner and music.' },
      { day: 3, title: 'Merzouga to Marrakech', activities: 'Sunrise over dunes. Long drive back via Draa Valley. Drop off at Riad around 7:00 PM.' }]);
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' },
        h('div', null, h('h1', null, 'Itinerary Builder'), h('p', null, 'Draft a day-by-day plan and share it instantly.')),
        h('div', { className: 'msa-row-gap' },
          h('button', { className: 'msa-btn', onClick: template }, '✨ 3-Day Desert Template'),
          h('button', { className: 'msa-btn', onClick: copyWA }, '⧉ Copy to WhatsApp'))),
      days.map((d, i) => h('div', { key: i, className: 'msa-card msa-ib-card' },
        h('div', { className: 'msa-card-head' }, h('h3', null, 'Day ' + d.day), h('button', { className: 'msa-icon-btn', onClick: () => rem(i) }, '🗑')),
        h('input', { className: 'msa-day-in', placeholder: 'Day Title (e.g. Exploring the Medina)', value: d.title, onChange: (e) => upd(i, 'title', e.target.value) }),
        h('textarea', { className: 'msa-day-in', rows: 3, placeholder: 'Activities and details…', value: d.activities, onChange: (e) => upd(i, 'activities', e.target.value) }))),
      h('button', { className: 'msa-btn msa-add-day', onClick: add }, '+ Add Day')
    );
  }

  // =====================================================================
  // LEADS  (raw website inbox; convert collaboration -> collaborator)
  // =====================================================================
  function Leads({ leads, reload, go, onConvertCollab }) {
    const del = async (l) => { if (confirm('Delete this lead?')) { await dbDelete('form_submissions', l.id); reload(); } };
    const isBooking = (k) => ['itinerary','quickbook','tweak'].includes(k);
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Leads'), h('p', null, 'Every website form submission — auto-filed into Bookings / Clients. Raw inbox here.')),
      h('div', { className: 'msa-card msa-card-flush' },
        leads.length === 0 ? h('div', { className: 'msa-empty' }, 'No leads yet. Form submissions land here automatically.')
        : h('table', { className: 'msa-table' },
            h('thead', null, h('tr', null, ['Date','Type','Name','Contact','Trip','Routed',''].map((c, i) => h('th', { key: i }, c)))),
            h('tbody', null, leads.map(l => h('tr', { key: l.id },
              h('td', { 'data-label': 'Date' }, fmtDate(l.created_at)),
              h('td', { 'data-label': 'Type' }, h('span', { className: 'msa-badge' }, l.kind || '—')),
              h('td', { 'data-label': 'Name' }, h('strong', null, l.name || '—')),
              h('td', { 'data-label': 'Contact' }, l.email && h('div', { className: 'msa-muted' }, h('a', { href: 'mailto:' + l.email }, l.email)), l.phone && h('div', { className: 'msa-muted' }, h('a', { href: waLink(l.phone), target: '_blank' }, l.phone))),
              h('td', { 'data-label': 'Trip' }, [l.trip_type, l.duration ? l.duration + 'd' : null, l.country].filter(Boolean).join(' · ') || '—'),
              h('td', { 'data-label': 'Routed' }, l.routed_booking_id ? h('span', { className: 'msa-badge msa-st-confirmed', title: 'Auto-created in Bookings' }, '→ Booking') : (l.kind === 'collaboration' ? h('span', { className: 'msa-badge msa-type' }, 'Partner') : h('span', { className: 'msa-muted' }, '—'))),
              h('td', { 'data-label': 'Actions', className: 'msa-right msa-actions' },
                l.kind === 'collaboration' && h('button', { className: 'msa-btn msa-btn-sm', onClick: () => onConvertCollab(l) }, '+ Collaborator'),
                l.routed_booking_id && h('button', { className: 'msa-btn msa-btn-sm', onClick: () => go('bookings') }, 'Open booking'),
                h('button', { className: 'msa-icon-btn', onClick: () => del(l) }, '🗑')))))) )
    );
  }

  // =====================================================================
  // SHELL
  // =====================================================================
  const TABS = [
    ['dashboard', 'Dashboard', '▦'], ['bookings', 'Bookings', '🧳'],
    ['itinerary', 'Itinerary Builder', '✈'], ['calendar', 'Calendar', '📅'],
    ['clients', 'Clients', '👥'], ['suppliers', 'Collaborators', '🤝'],
    ['finance', 'Finance', '💳'], ['tasks', 'Tasks', '✓'], ['leads', 'Leads', '✦'],
  ];

  function Shell({ user, onLogout }) {
    const [tab, setTab] = useState('dashboard');
    const [navOpen, setNavOpen] = useState(false);
    const [bookings, setBookings] = useState([]); const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]); const [tasks, setTasks] = useState([]);
    const [leads, setLeads] = useState([]); const [loading, setLoading] = useState(true);
    const [openNew, setOpenNew] = useState(false); const [supSeed, setSupSeed] = useState(null);
    const goTab = (id) => { setTab(id); setNavOpen(false); };
    const currentLabel = (TABS.find(t => t[0] === tab) || [,'Admin'])[1];

    const reloadAll = useCallback(async () => {
      const [bk, cl, su, tk, ld] = await Promise.all([
        dbList('bookings', 'created_at', false), dbList('clients', 'name', true),
        dbList('suppliers', 'name', true), dbList('tasks', 'created_at', false),
        dbList('form_submissions', 'created_at', false)]);
      setBookings(bk); setClients(cl); setSuppliers(su); setTasks(tk); setLeads(ld); setLoading(false);
    }, []);
    useEffect(() => { reloadAll(); }, [reloadAll]);

    const convertCollab = (lead) => {
      const p = lead.payload || {};
      setSupSeed({ name: lead.name || '', type: 'hotel', city: lead.country || '', contact: lead.name || '',
        phone: lead.phone || '', email: lead.email || '', notes: (p.collaborationType ? ('Type: ' + p.collaborationType + '. ') : '') + (p.message || '') });
      setTab('suppliers');
    };

    const body = () => {
      if (loading) return h('div', { className: 'msa-page' }, h('div', { className: 'msa-empty' }, 'Loading…'));
      switch (tab) {
        case 'bookings': return h(Bookings, { bookings, reload: reloadAll, openNew, clearOpenNew: () => setOpenNew(false) });
        case 'itinerary': return h(ItineraryBuilder, {});
        case 'calendar': return h(CalendarTab, { bookings });
        case 'clients': return h(Clients, { clients, reload: reloadAll });
        case 'suppliers': return h(Suppliers, { suppliers, reload: reloadAll, seed: supSeed, clearSeed: () => setSupSeed(null) });
        case 'finance': return h(Finance, { bookings });
        case 'tasks': return h(Tasks, { tasks, reload: reloadAll });
        case 'leads': return h(Leads, { leads, reload: reloadAll, go: setTab, onConvertCollab: convertCollab });
        default: return h(Dashboard, { bookings, tasks, leads, go: setTab });
      }
    };

    return h('div', { className: 'msa-shell' + (navOpen ? ' nav-open' : '') },
      // Mobile top app bar (hidden on desktop via CSS)
      h('header', { className: 'msa-topbar' },
        h('button', { className: 'msa-burger', 'aria-label': 'Menu', onClick: () => setNavOpen(true) }, '☰'),
        h('span', { className: 'msa-topbar-title' }, currentLabel),
        h('img', { className: 'msa-topbar-logo', src: 'assets/logo.png', alt: '', onError: (e) => { e.target.style.display = 'none'; } })
      ),
      // Drawer overlay (mobile)
      h('div', { className: 'msa-nav-overlay', onClick: () => setNavOpen(false) }),
      h('aside', { className: 'msa-sidebar' },
        h('div', { className: 'msa-brand' },
          h('img', { src: 'assets/logo.png', alt: '', onError: (e) => { e.target.style.display = 'none'; } }),
          h('span', null, 'MarrakechStory'),
          h('button', { className: 'msa-drawer-close', 'aria-label': 'Close', onClick: () => setNavOpen(false) }, '✕')),
        h('nav', { className: 'msa-nav' }, TABS.map(([id, label, icon]) => h('button', { key: id, className: 'msa-nav-btn' + (tab === id ? ' active' : ''), onClick: () => goTab(id) }, h('span', { className: 'msa-nav-ico' }, icon), h('span', { className: 'msa-nav-label' }, label)))),
        h('div', { className: 'msa-user' },
          h('div', { className: 'msa-user-info' }, h('strong', null, 'Admin'), h('span', { className: 'msa-muted' }, user.email)),
          h('button', { className: 'msa-btn msa-btn-ghost msa-btn-block', onClick: onLogout }, 'Log out'))),
      h('main', { className: 'msa-main' }, body())
    );
  }

  function AdminRoot() {
    const [user, setUser] = useState(undefined);
    useEffect(() => {
      const sb = getSB(); if (!sb) { setUser(null); return; }
      sb.auth.getSession().then(({ data }) => { const u = data.session && data.session.user; setUser(u && u.email === ADMIN_EMAIL ? u : null); });
      const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { const u = s && s.user; setUser(u && u.email === ADMIN_EMAIL ? u : null); });
      return () => sub && sub.subscription && sub.subscription.unsubscribe && sub.subscription.unsubscribe();
    }, []);
    const logout = async () => { const sb = getSB(); if (sb) await sb.auth.signOut(); setUser(null); location.hash = ''; };
    if (user === undefined) return h('div', { className: 'msa-login' }, h('div', { className: 'msa-empty' }, 'Loading…'));
    if (!user) return h(Login, { onAuthed: setUser });
    return h(Shell, { user, onLogout: logout });
  }

  let root = null;
  window.MS_AdminMount = function (el) { if (!el) return; if (!root) root = window.ReactDOM.createRoot(el); root.render(h(AdminRoot)); };
  window.MS_AdminUnmount = function () { if (root) { root.unmount(); root = null; } };
})();
