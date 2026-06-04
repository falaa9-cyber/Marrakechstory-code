// ============================================================
// MarrakechStory — Private Admin / Operations system
// Ported from the Marrakechstory-Admin (Firebase) app to this
// site's Supabase + no-build UMD React stack.
//
// Access: open  <site>/#admin   (no link on the public site).
// Auth:   email + password. ONLY the admin email gets in; RLS on
//         Supabase enforces the same rule server-side.
// Tabs:   Dashboard · Bookings · Clients · Collaborators ·
//         Finance · Tasks · Calendar · Leads
// Exposes window.MS_AdminMount() — called by app.jsx on #admin.
// ============================================================
(function () {
  const R = window.React;
  const { useState, useEffect, useMemo, useCallback } = R;
  const h = R.createElement;

  const ADMIN_EMAIL = 'f.alaa9@gmail.com';

  // ---- Dedicated Supabase client that PERSISTS the session ----
  // (the public site client uses persistSession:false; admin needs to stay
  //  logged in across reloads, with its own storage key.)
  let SB = null;
  function getSB() {
    if (SB) return SB;
    if (!window.supabase || !window.MS_ENV || !window.MS_ENV.SUPABASE_URL) return null;
    SB = window.supabase.createClient(
      window.MS_ENV.SUPABASE_URL,
      window.MS_ENV.SUPABASE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ms-admin-auth' } }
    );
    return SB;
  }

  // ---- tiny data helpers ----
  async function dbList(table, order, asc) {
    const sb = getSB(); if (!sb) return [];
    let q = sb.from(table).select('*');
    if (order) q = q.order(order, { ascending: asc !== false });
    const { data, error } = await q;
    if (error) { console.warn('[admin] list ' + table, error.message); return []; }
    return data || [];
  }
  async function dbInsert(table, row) {
    const sb = getSB(); if (!sb) return { error: 'no client' };
    const { data, error } = await sb.from(table).insert(row).select();
    return { data, error };
  }
  async function dbUpdate(table, id, patch) {
    const sb = getSB(); if (!sb) return { error: 'no client' };
    const { data, error } = await sb.from(table).update(patch).eq('id', id).select();
    return { data, error };
  }
  async function dbDelete(table, id) {
    const sb = getSB(); if (!sb) return { error: 'no client' };
    const { error } = await sb.from(table).delete().eq('id', id);
    return { error };
  }

  // ---- formatting ----
  const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US') + ' kr';
  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };
  const todayISO = () => new Date().toISOString().slice(0, 10);

  const STATUS_LABEL = {
    new: 'New', quotation_sent: 'Quote sent', waiting_confirmation: 'Awaiting',
    confirmed: 'Confirmed', deposit_paid: 'Deposit paid', fully_paid: 'Fully paid',
    ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
  };
  const STATUS_ORDER = ['new','quotation_sent','waiting_confirmation','confirmed','deposit_paid','fully_paid','ongoing','completed','cancelled'];

  // =====================================================================
  // LOGIN
  // =====================================================================
  function Login({ onAuthed }) {
    const [email, setEmail] = useState(ADMIN_EMAIL);
    const [pass, setPass] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
      e.preventDefault();
      setErr(''); setBusy(true);
      const sb = getSB();
      if (!sb) { setErr('Supabase not loaded'); setBusy(false); return; }
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
      setBusy(false);
      if (error) { setErr(error.message); return; }
      if (!data.user || data.user.email !== ADMIN_EMAIL) {
        await sb.auth.signOut();
        setErr('This account is not authorised.');
        return;
      }
      onAuthed(data.user);
    };

    return h('div', { className: 'msa-login' },
      h('form', { className: 'msa-login-card', onSubmit: submit },
        h('img', { src: 'assets/logo.png', alt: '', className: 'msa-login-logo',
          onError: (e) => { e.target.style.display = 'none'; } }),
        h('h1', null, 'MarrakechStory'),
        h('p', { className: 'msa-login-sub' }, 'Internal Operations'),
        err && h('div', { className: 'msa-login-err' }, err),
        h('label', null, 'Email'),
        h('input', { type: 'email', autoComplete: 'email', value: email,
          onChange: (e) => setEmail(e.target.value), placeholder: 'admin@…' }),
        h('label', null, 'Password'),
        h('input', { type: 'password', autoComplete: 'current-password', value: pass,
          onChange: (e) => setPass(e.target.value), placeholder: '••••••••' }),
        h('button', { type: 'submit', disabled: busy, className: 'msa-btn msa-btn-primary msa-btn-block' },
          busy ? 'Signing in…' : 'Sign in'),
        h('a', { href: '#', className: 'msa-login-back' }, '← Back to site')
      )
    );
  }

  // =====================================================================
  // DASHBOARD
  // =====================================================================
  function Dashboard({ bookings, tasks, leads, go }) {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 864e5);

    const arrivalsToday = bookings.filter(b => b.arrival_date === todayISO()).length;
    const upcoming = bookings.filter(b => {
      const a = b.arrival_date ? new Date(b.arrival_date) : null;
      return a && a >= now && a <= in30;
    }).length;
    const revenue = bookings.reduce((s, b) => s + (Number(b.selling_price) || 0), 0);
    const costs = bookings.reduce((s, b) => s + (Number(b.total_cost) || 0), 0);
    const profit = revenue - costs;
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
    const unpaid = bookings
      .filter(b => b.status !== 'fully_paid' && b.status !== 'cancelled')
      .reduce((s, b) => s + (Number(b.balance) || 0), 0);

    const recent = bookings.slice(0, 6);

    const stat = (label, value, accent) =>
      h('div', { className: 'msa-stat' },
        h('span', { className: 'msa-stat-label' }, label),
        h('span', { className: 'msa-stat-value' + (accent ? ' msa-accent' : '') }, value)
      );

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' },
        h('h1', null, 'Dashboard'),
        h('p', null, 'Live overview of bookings, revenue and tasks.')
      ),
      h('div', { className: 'msa-stat-grid' },
        stat('Arrivals today', arrivalsToday),
        stat('Upcoming (30d)', upcoming),
        stat('Revenue', fmtMoney(revenue), true),
        stat('Profit', fmtMoney(profit), true),
        stat('Open tasks', pendingTasks),
        stat('Unpaid balance', fmtMoney(unpaid))
      ),
      h('div', { className: 'msa-cols' },
        h('div', { className: 'msa-card' },
          h('div', { className: 'msa-card-head' },
            h('h3', null, 'Recent bookings'),
            h('button', { className: 'msa-link', onClick: () => go('bookings') }, 'View all →')
          ),
          recent.length === 0
            ? h('div', { className: 'msa-empty' }, 'No bookings yet.')
            : h('table', { className: 'msa-table' },
                h('tbody', null,
                  recent.map(b => h('tr', { key: b.id },
                    h('td', null, h('strong', null, b.client_name || '—'),
                      h('div', { className: 'msa-muted' }, b.reference || '')),
                    h('td', null, fmtDate(b.arrival_date)),
                    h('td', null, h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status] || b.status)),
                    h('td', { className: 'msa-right' }, fmtMoney(b.selling_price))
                  ))
                )
              )
        ),
        h('div', { className: 'msa-card' },
          h('div', { className: 'msa-card-head' },
            h('h3', null, 'New leads'),
            h('button', { className: 'msa-link', onClick: () => go('leads') }, 'View all →')
          ),
          leads.length === 0
            ? h('div', { className: 'msa-empty' }, 'No leads yet.')
            : h('div', { className: 'msa-lead-list' },
                leads.slice(0, 6).map(l => h('div', { key: l.id, className: 'msa-lead' },
                  h('div', null, h('strong', null, l.name || l.email || 'Anonymous'),
                    h('div', { className: 'msa-muted' }, [l.kind, l.trip_type, l.duration ? l.duration + 'd' : null].filter(Boolean).join(' · '))),
                  h('span', { className: 'msa-muted' }, fmtDate(l.created_at))
                ))
              )
        )
      )
    );
  }

  // =====================================================================
  // BOOKINGS
  // =====================================================================
  const EMPTY_BOOKING = {
    client_name: '', email: '', phone: '', nationality: '', lead_source: 'website',
    reference: '', arrival_city: 'Marrakech', departure_city: 'Marrakech',
    arrival_date: '', departure_date: '', total_nights: 0, total_days: 0,
    adults: 2, kids: 0, kids_ages: '', status: 'new',
    selling_price: 0, deposit_amount: 0, balance: 0,
    cost_transportation: 0, cost_activities: 0, cost_accommodation: 0, total_cost: 0,
    internal_notes: '', special_requests: '',
  };

  function BookingModal({ initial, onClose, onSaved }) {
    const [b, setB] = useState(initial || EMPTY_BOOKING);
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setB(prev => ({ ...prev, [k]: v }));

    const setCost = (k, v) => setB(prev => {
      const next = { ...prev, [k]: v };
      next.total_cost = (Number(next.cost_transportation) || 0) + (Number(next.cost_activities) || 0) + (Number(next.cost_accommodation) || 0);
      return next;
    });
    const setPrice = (v) => setB(prev => ({ ...prev, selling_price: v, deposit_amount: Math.round(v * 0.2), balance: Math.round(v * 0.8) }));

    const save = async () => {
      if (!b.client_name.trim()) { alert('Client name is required'); return; }
      setBusy(true);
      const row = {
        ...b,
        reference: b.reference || ('MS-' + Math.random().toString(36).slice(2, 8).toUpperCase()),
        travelers: (Number(b.adults) || 0) + (Number(b.kids) || 0),
        balance: (Number(b.selling_price) || 0) - (Number(b.deposit_amount) || 0),
        updated_at: new Date().toISOString(),
      };
      ['total_nights','total_days','adults','kids'].forEach(k => row[k] = Number(row[k]) || 0);
      ['selling_price','deposit_amount','cost_transportation','cost_activities','cost_accommodation','total_cost'].forEach(k => row[k] = Number(row[k]) || 0);
      if (!row.arrival_date) delete row.arrival_date;
      if (!row.departure_date) delete row.departure_date;

      let res;
      if (b.id) res = await dbUpdate('bookings', b.id, row);
      else res = await dbInsert('bookings', { ...row, created_by: ADMIN_EMAIL });
      setBusy(false);
      if (res.error) { alert('Save failed: ' + res.error.message); return; }
      onSaved();
    };

    const field = (label, k, type) => h('div', { className: 'msa-field' },
      h('label', null, label),
      h('input', { type: type || 'text', value: b[k] == null ? '' : b[k],
        onChange: (e) => set(k, type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value) })
    );

    return h('div', { className: 'msa-modal-backdrop', onClick: onClose },
      h('div', { className: 'msa-modal', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'msa-modal-head' },
          h('h2', null, b.id ? 'Edit booking' : 'New booking'),
          h('div', null,
            h('button', { className: 'msa-btn', onClick: onClose }, 'Cancel'),
            h('button', { className: 'msa-btn msa-btn-primary', disabled: busy, onClick: save }, busy ? 'Saving…' : 'Save booking')
          )
        ),
        h('div', { className: 'msa-modal-body' },
          h('h4', { className: 'msa-section' }, '1 · Client'),
          h('div', { className: 'msa-grid-2' },
            field('Full name', 'client_name'),
            field('Email', 'email', 'email'),
            field('Phone', 'phone'),
            field('Nationality', 'nationality'),
            h('div', { className: 'msa-field' },
              h('label', null, 'Lead source'),
              h('select', { value: b.lead_source, onChange: (e) => set('lead_source', e.target.value) },
                ['website','whatsapp','instagram','recommended','other'].map(s => h('option', { key: s, value: s }, s))
              )
            ),
            field('Reference', 'reference')
          ),
          h('h4', { className: 'msa-section' }, '2 · Trip'),
          h('div', { className: 'msa-grid-2' },
            field('Arrival city', 'arrival_city'),
            field('Departure city', 'departure_city'),
            field('Arrival date', 'arrival_date', 'date'),
            field('Departure date', 'departure_date', 'date'),
            field('Nights', 'total_nights', 'number'),
            field('Days', 'total_days', 'number'),
            field('Adults', 'adults', 'number'),
            field('Kids', 'kids', 'number')
          ),
          Number(b.kids) > 0 && field('Kids ages', 'kids_ages'),
          h('h4', { className: 'msa-section' }, '3 · Costs (internal)'),
          h('div', { className: 'msa-grid-2' },
            h('div', { className: 'msa-field' }, h('label', null, 'Transport'),
              h('input', { type: 'number', value: b.cost_transportation || '', onChange: (e) => setCost('cost_transportation', parseFloat(e.target.value) || 0) })),
            h('div', { className: 'msa-field' }, h('label', null, 'Activities'),
              h('input', { type: 'number', value: b.cost_activities || '', onChange: (e) => setCost('cost_activities', parseFloat(e.target.value) || 0) })),
            h('div', { className: 'msa-field' }, h('label', null, 'Accommodation'),
              h('input', { type: 'number', value: b.cost_accommodation || '', onChange: (e) => setCost('cost_accommodation', parseFloat(e.target.value) || 0) })),
            h('div', { className: 'msa-field' }, h('label', null, 'Total cost'),
              h('div', { className: 'msa-readout' }, fmtMoney(b.total_cost)))
          ),
          h('h4', { className: 'msa-section' }, '4 · Pricing & status'),
          h('div', { className: 'msa-grid-2' },
            h('div', { className: 'msa-field' }, h('label', null, 'Selling price'),
              h('input', { type: 'number', value: b.selling_price || '', onChange: (e) => setPrice(parseFloat(e.target.value) || 0) })),
            h('div', { className: 'msa-field' }, h('label', null, 'Status'),
              h('select', { value: b.status, onChange: (e) => set('status', e.target.value) },
                STATUS_ORDER.map(s => h('option', { key: s, value: s }, STATUS_LABEL[s])))),
            h('div', { className: 'msa-field' }, h('label', null, 'Deposit (20%)'),
              h('div', { className: 'msa-readout' }, fmtMoney(b.deposit_amount))),
            h('div', { className: 'msa-field' }, h('label', null, 'Balance (80%)'),
              h('div', { className: 'msa-readout' }, fmtMoney(b.balance)))
          ),
          h('h4', { className: 'msa-section' }, '5 · Notes'),
          h('div', { className: 'msa-field' }, h('label', null, 'Internal notes'),
            h('textarea', { rows: 2, value: b.internal_notes || '', onChange: (e) => set('internal_notes', e.target.value) })),
          h('div', { className: 'msa-field' }, h('label', null, 'Special requests'),
            h('textarea', { rows: 2, value: b.special_requests || '', onChange: (e) => set('special_requests', e.target.value) }))
        )
      )
    );
  }

  function Bookings({ bookings, reload, isAdmin }) {
    const [edit, setEdit] = useState(null);   // booking object or {} for new
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = bookings.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!q) return true;
      const hay = (b.client_name + ' ' + (b.reference || '') + ' ' + (b.email || '')).toLowerCase();
      return hay.includes(q.toLowerCase());
    });

    const del = async (b) => {
      if (!confirm('Delete booking ' + (b.reference || b.client_name) + '?')) return;
      await dbDelete('bookings', b.id); reload();
    };

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' },
        h('div', null, h('h1', null, 'Bookings'), h('p', null, filtered.length + ' booking(s)')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setEdit(EMPTY_BOOKING) }, '+ New booking')
      ),
      h('div', { className: 'msa-toolbar' },
        h('input', { className: 'msa-search', placeholder: 'Search name, ref, email…', value: q, onChange: (e) => setQ(e.target.value) }),
        h('select', { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value) },
          [h('option', { key: 'all', value: 'all' }, 'All statuses')].concat(
            STATUS_ORDER.map(s => h('option', { key: s, value: s }, STATUS_LABEL[s]))))
      ),
      h('div', { className: 'msa-card' },
        filtered.length === 0
          ? h('div', { className: 'msa-empty' }, 'No bookings match.')
          : h('table', { className: 'msa-table' },
              h('thead', null, h('tr', null,
                ['Client','Reference','Arrival','Nights','Pax','Price','Status',''].map((c, i) =>
                  h('th', { key: i, className: i >= 5 ? 'msa-right' : '' }, c)))),
              h('tbody', null,
                filtered.map(b => h('tr', { key: b.id, className: 'msa-row-click', onClick: () => setEdit(b) },
                  h('td', null, h('strong', null, b.client_name || '—'),
                    h('div', { className: 'msa-muted' }, b.email || '')),
                  h('td', null, b.reference || '—'),
                  h('td', null, fmtDate(b.arrival_date)),
                  h('td', null, b.total_nights || '—'),
                  h('td', null, (b.adults || 0) + (b.kids || 0)),
                  h('td', { className: 'msa-right' }, fmtMoney(b.selling_price)),
                  h('td', { className: 'msa-right' }, h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status] || b.status)),
                  h('td', { className: 'msa-right' },
                    isAdmin && h('button', { className: 'msa-icon-btn', title: 'Delete',
                      onClick: (e) => { e.stopPropagation(); del(b); } }, '🗑'))
                )))
            )
      ),
      edit && h(BookingModal, { initial: edit.id ? edit : EMPTY_BOOKING, onClose: () => setEdit(null),
        onSaved: () => { setEdit(null); reload(); } })
    );
  }

  // =====================================================================
  // CLIENTS
  // =====================================================================
  function Clients({ clients, reload, isAdmin }) {
    const [adding, setAdding] = useState(false);
    const [q, setQ] = useState('');
    const [form, setForm] = useState({ name: '', email: '', phone: '', country: '' });

    const add = async () => {
      if (!form.name.trim()) { alert('Name required'); return; }
      await dbInsert('clients', { ...form, created_by: ADMIN_EMAIL });
      setForm({ name: '', email: '', phone: '', country: '' }); setAdding(false); reload();
    };
    const del = async (c) => { if (confirm('Delete ' + c.name + '?')) { await dbDelete('clients', c.id); reload(); } };

    const filtered = clients.filter(c => !q || (c.name + ' ' + (c.email || '') + ' ' + (c.country || '')).toLowerCase().includes(q.toLowerCase()));

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' },
        h('div', null, h('h1', null, 'Clients'), h('p', null, filtered.length + ' client(s)')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setAdding(a => !a) }, adding ? 'Close' : '+ New client')
      ),
      adding && h('div', { className: 'msa-card msa-inline-form' },
        h('div', { className: 'msa-grid-4' },
          h('input', { placeholder: 'Name', value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }),
          h('input', { placeholder: 'Email', value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) }),
          h('input', { placeholder: 'Phone', value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) }),
          h('input', { placeholder: 'Country', value: form.country, onChange: (e) => setForm({ ...form, country: e.target.value }) })
        ),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: add }, 'Add client')
      ),
      h('div', { className: 'msa-toolbar' },
        h('input', { className: 'msa-search', placeholder: 'Search clients…', value: q, onChange: (e) => setQ(e.target.value) })),
      h('div', { className: 'msa-card' },
        filtered.length === 0
          ? h('div', { className: 'msa-empty' }, 'No clients yet.')
          : h('table', { className: 'msa-table' },
              h('thead', null, h('tr', null, ['Name','Email','Phone','Country',''].map((c, i) => h('th', { key: i }, c)))),
              h('tbody', null, filtered.map(c => h('tr', { key: c.id },
                h('td', null, h('strong', null, c.name)),
                h('td', null, c.email ? h('a', { href: 'mailto:' + c.email }, c.email) : '—'),
                h('td', null, c.phone ? h('a', { href: 'https://wa.me/' + String(c.phone).replace(/[^0-9]/g, ''), target: '_blank' }, c.phone) : '—'),
                h('td', null, c.country || '—'),
                h('td', { className: 'msa-right' }, isAdmin && h('button', { className: 'msa-icon-btn', onClick: () => del(c) }, '🗑'))
              )))
            )
      )
    );
  }

  // =====================================================================
  // COLLABORATORS (suppliers)
  // =====================================================================
  const SUP_TYPES = ['hotel','camp','driver','guide','activity'];
  function Suppliers({ suppliers, reload, isAdmin }) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'hotel', city: '', contact: '', phone: '', email: '', rate: '', notes: '' });

    const add = async () => {
      if (!form.name.trim()) { alert('Name required'); return; }
      await dbInsert('suppliers', form);
      setForm({ name: '', type: 'hotel', city: '', contact: '', phone: '', email: '', rate: '', notes: '' });
      setAdding(false); reload();
    };
    const del = async (s) => { if (confirm('Delete ' + s.name + '?')) { await dbDelete('suppliers', s.id); reload(); } };

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head msa-row' },
        h('div', null, h('h1', null, 'Collaborators'), h('p', null, suppliers.length + ' partner(s) — hotels, camps, drivers, guides, activities')),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: () => setAdding(a => !a) }, adding ? 'Close' : '+ New collaborator')
      ),
      adding && h('div', { className: 'msa-card msa-inline-form' },
        h('div', { className: 'msa-grid-4' },
          h('input', { placeholder: 'Name', value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }),
          h('select', { value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value }) },
            SUP_TYPES.map(t => h('option', { key: t, value: t }, t))),
          h('input', { placeholder: 'City', value: form.city, onChange: (e) => setForm({ ...form, city: e.target.value }) }),
          h('input', { placeholder: 'Contact person', value: form.contact, onChange: (e) => setForm({ ...form, contact: e.target.value }) }),
          h('input', { placeholder: 'Phone', value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) }),
          h('input', { placeholder: 'Email', value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) }),
          h('input', { placeholder: 'Rate', value: form.rate, onChange: (e) => setForm({ ...form, rate: e.target.value }) }),
          h('input', { placeholder: 'Notes', value: form.notes, onChange: (e) => setForm({ ...form, notes: e.target.value }) })
        ),
        h('button', { className: 'msa-btn msa-btn-primary', onClick: add }, 'Add collaborator')
      ),
      h('div', { className: 'msa-card-grid' },
        suppliers.length === 0
          ? h('div', { className: 'msa-empty' }, 'No collaborators yet.')
          : suppliers.map(s => h('div', { key: s.id, className: 'msa-mini-card' },
              h('div', { className: 'msa-mini-head' },
                h('strong', null, s.name),
                h('span', { className: 'msa-badge msa-type' }, s.type)
              ),
              h('div', { className: 'msa-muted' }, [s.city, s.contact].filter(Boolean).join(' · ')),
              s.phone && h('div', null, '📞 ', h('a', { href: 'https://wa.me/' + String(s.phone).replace(/[^0-9]/g, ''), target: '_blank' }, s.phone)),
              s.email && h('div', null, '✉ ', h('a', { href: 'mailto:' + s.email }, s.email)),
              s.rate && h('div', { className: 'msa-muted' }, 'Rate: ' + s.rate),
              s.notes && h('div', { className: 'msa-muted msa-notes' }, s.notes),
              isAdmin && h('button', { className: 'msa-icon-btn msa-del-corner', onClick: () => del(s) }, '🗑')
            ))
      )
    );
  }

  // =====================================================================
  // FINANCE
  // =====================================================================
  function Finance({ bookings }) {
    const sales = bookings.reduce((s, b) => s + (Number(b.selling_price) || 0), 0);
    const costs = bookings.reduce((s, b) => s + (Number(b.total_cost) || 0), 0);
    const profit = sales - costs;
    const margin = sales > 0 ? (profit / sales * 100) : 0;
    const deposits = bookings.reduce((s, b) => s + (Number(b.deposit_amount) || 0), 0);
    const balances = bookings
      .filter(b => b.status !== 'fully_paid' && b.status !== 'cancelled')
      .reduce((s, b) => s + (Number(b.balance) || 0), 0);

    const stat = (label, value, accent) => h('div', { className: 'msa-stat' },
      h('span', { className: 'msa-stat-label' }, label),
      h('span', { className: 'msa-stat-value' + (accent ? ' msa-accent' : '') }, value));

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Finance'),
        h('p', null, 'Revenue, costs and profitability across all bookings.')),
      h('div', { className: 'msa-stat-grid' },
        stat('Total sales', fmtMoney(sales), true),
        stat('Total costs', fmtMoney(costs)),
        stat('Net profit', fmtMoney(profit), true),
        stat('Margin', margin.toFixed(1) + '%'),
        stat('Deposits', fmtMoney(deposits)),
        stat('Outstanding', fmtMoney(balances))
      ),
      h('div', { className: 'msa-card' },
        h('div', { className: 'msa-card-head' }, h('h3', null, 'Per booking')),
        bookings.length === 0
          ? h('div', { className: 'msa-empty' }, 'No financial data yet.')
          : h('table', { className: 'msa-table' },
              h('thead', null, h('tr', null,
                ['Client','Status','Sales','Cost','Profit','Margin'].map((c, i) =>
                  h('th', { key: i, className: i >= 2 ? 'msa-right' : '' }, c)))),
              h('tbody', null, bookings.map(b => {
                const s = Number(b.selling_price) || 0, c = Number(b.total_cost) || 0, p = s - c;
                return h('tr', { key: b.id },
                  h('td', null, b.client_name || '—'),
                  h('td', null, h('span', { className: 'msa-badge msa-st-' + b.status }, STATUS_LABEL[b.status] || b.status)),
                  h('td', { className: 'msa-right' }, fmtMoney(s)),
                  h('td', { className: 'msa-right' }, fmtMoney(c)),
                  h('td', { className: 'msa-right ' + (p >= 0 ? 'msa-pos' : 'msa-neg') }, fmtMoney(p)),
                  h('td', { className: 'msa-right' }, s > 0 ? (p / s * 100).toFixed(0) + '%' : '—'));
              }))
            )
      )
    );
  }

  // =====================================================================
  // TASKS
  // =====================================================================
  function Tasks({ tasks, reload }) {
    const [title, setTitle] = useState('');
    const [due, setDue] = useState('');
    const [priority, setPriority] = useState('medium');

    const add = async () => {
      if (!title.trim()) return;
      await dbInsert('tasks', { title: title.trim(), due: due || null, priority, status: 'pending' });
      setTitle(''); setDue(''); setPriority('medium'); reload();
    };
    const toggle = async (t) => { await dbUpdate('tasks', t.id, { status: t.status === 'completed' ? 'pending' : 'completed' }); reload(); };
    const del = async (t) => { await dbDelete('tasks', t.id); reload(); };

    const open = tasks.filter(t => t.status !== 'completed');
    const done = tasks.filter(t => t.status === 'completed');

    const row = (t) => h('div', { key: t.id, className: 'msa-task' + (t.status === 'completed' ? ' done' : '') },
      h('button', { className: 'msa-check', onClick: () => toggle(t) }, t.status === 'completed' ? '✓' : ''),
      h('div', { className: 'msa-task-body' },
        h('span', { className: 'msa-task-title' }, t.title),
        h('span', { className: 'msa-muted' }, [t.due ? 'Due ' + fmtDate(t.due) : null, t.priority].filter(Boolean).join(' · '))),
      h('span', { className: 'msa-badge msa-pri-' + t.priority }, t.priority),
      h('button', { className: 'msa-icon-btn', onClick: () => del(t) }, '🗑')
    );

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Tasks'),
        h('p', null, open.length + ' open · ' + done.length + ' done')),
      h('div', { className: 'msa-card msa-inline-form' },
        h('div', { className: 'msa-task-add' },
          h('input', { placeholder: 'New task…', value: title, onChange: (e) => setTitle(e.target.value),
            onKeyDown: (e) => e.key === 'Enter' && add() }),
          h('input', { type: 'date', value: due, onChange: (e) => setDue(e.target.value) }),
          h('select', { value: priority, onChange: (e) => setPriority(e.target.value) },
            ['low','medium','high'].map(p => h('option', { key: p, value: p }, p))),
          h('button', { className: 'msa-btn msa-btn-primary', onClick: add }, 'Add')
        )
      ),
      h('div', { className: 'msa-card' },
        open.length === 0 ? h('div', { className: 'msa-empty' }, 'No open tasks 🎉') : open.map(row)
      ),
      done.length > 0 && h('div', { className: 'msa-card' },
        h('div', { className: 'msa-card-head' }, h('h3', null, 'Completed')),
        done.map(row)
      )
    );
  }

  // =====================================================================
  // CALENDAR (arrivals & departures list, grouped by date)
  // =====================================================================
  function Calendar({ bookings }) {
    const events = [];
    bookings.forEach(b => {
      if (b.arrival_date) events.push({ date: b.arrival_date, type: 'Arrival', who: b.client_name, city: b.arrival_city });
      if (b.departure_date) events.push({ date: b.departure_date, type: 'Departure', who: b.client_name, city: b.departure_city });
    });
    events.sort((a, b) => (a.date < b.date ? -1 : 1));
    const upcoming = events.filter(e => e.date >= todayISO());

    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Calendar'),
        h('p', null, 'Upcoming arrivals and departures.')),
      h('div', { className: 'msa-card' },
        upcoming.length === 0
          ? h('div', { className: 'msa-empty' }, 'Nothing scheduled.')
          : h('table', { className: 'msa-table' },
              h('thead', null, h('tr', null, ['Date','Event','Client','City'].map((c, i) => h('th', { key: i }, c)))),
              h('tbody', null, upcoming.map((e, i) => h('tr', { key: i },
                h('td', null, fmtDate(e.date)),
                h('td', null, h('span', { className: 'msa-badge msa-ev-' + e.type.toLowerCase() }, e.type)),
                h('td', null, e.who || '—'),
                h('td', null, e.city || '—')
              )))
            )
      )
    );
  }

  // =====================================================================
  // LEADS (form_submissions) + convert to booking
  // =====================================================================
  function Leads({ leads, reload, onConvert, isAdmin }) {
    const del = async (l) => { if (confirm('Delete this lead?')) { await dbDelete('form_submissions', l.id); reload(); } };
    return h('div', { className: 'msa-page' },
      h('header', { className: 'msa-page-head' }, h('h1', null, 'Leads'),
        h('p', null, leads.length + ' form submission(s) from the website.')),
      h('div', { className: 'msa-card' },
        leads.length === 0
          ? h('div', { className: 'msa-empty' }, 'No leads yet. Form submissions land here automatically.')
          : h('table', { className: 'msa-table' },
              h('thead', null, h('tr', null, ['Date','Name','Contact','Type','Trip',''].map((c, i) => h('th', { key: i }, c)))),
              h('tbody', null, leads.map(l => h('tr', { key: l.id },
                h('td', null, fmtDate(l.created_at)),
                h('td', null, h('strong', null, l.name || '—')),
                h('td', null,
                  l.email && h('div', null, h('a', { href: 'mailto:' + l.email }, l.email)),
                  l.phone && h('div', null, h('a', { href: 'https://wa.me/' + String(l.phone).replace(/[^0-9]/g, ''), target: '_blank' }, l.phone))),
                h('td', null, l.kind || '—'),
                h('td', null, [l.trip_type, l.duration ? l.duration + 'd' : null, l.country].filter(Boolean).join(' · ') || '—'),
                h('td', { className: 'msa-right' },
                  h('button', { className: 'msa-btn msa-btn-sm', onClick: () => onConvert(l) }, 'To booking'),
                  isAdmin && h('button', { className: 'msa-icon-btn', onClick: () => del(l) }, '🗑'))
              )))
            )
      )
    );
  }

  // =====================================================================
  // SHELL
  // =====================================================================
  const TABS = [
    ['dashboard', 'Dashboard', '▦'],
    ['bookings', 'Bookings', '🧳'],
    ['calendar', 'Calendar', '📅'],
    ['clients', 'Clients', '👥'],
    ['suppliers', 'Collaborators', '🤝'],
    ['finance', 'Finance', '💳'],
    ['tasks', 'Tasks', '✓'],
    ['leads', 'Leads', '✦'],
  ];

  function Shell({ user, onLogout }) {
    const [tab, setTab] = useState('dashboard');
    const [bookings, setBookings] = useState([]);
    const [clients, setClients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [convertSeed, setConvertSeed] = useState(null);

    const isAdmin = user && user.email === ADMIN_EMAIL;

    const reloadAll = useCallback(async () => {
      const [bk, cl, su, tk, ld] = await Promise.all([
        dbList('bookings', 'created_at', false),
        dbList('clients', 'name', true),
        dbList('suppliers', 'name', true),
        dbList('tasks', 'created_at', false),
        dbList('form_submissions', 'created_at', false),
      ]);
      setBookings(bk); setClients(cl); setSuppliers(su); setTasks(tk); setLeads(ld);
      setLoading(false);
    }, []);

    useEffect(() => { reloadAll(); }, [reloadAll]);

    // Convert a lead → pre-filled new booking
    const handleConvert = (lead) => {
      setConvertSeed({
        ...EMPTY_BOOKING,
        client_name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        nationality: lead.country || '',
        lead_source: lead.kind === 'itinerary' ? 'website' : (lead.via || 'website'),
        total_days: lead.duration || 0,
        arrival_date: lead.start_date || '',
        departure_date: lead.end_date || '',
      });
      setTab('bookings');
    };

    const body = () => {
      if (loading) return h('div', { className: 'msa-page' }, h('div', { className: 'msa-empty' }, 'Loading…'));
      switch (tab) {
        case 'bookings': return h(Bookings, { bookings, reload: reloadAll, isAdmin });
        case 'clients': return h(Clients, { clients, reload: reloadAll, isAdmin });
        case 'suppliers': return h(Suppliers, { suppliers, reload: reloadAll, isAdmin });
        case 'finance': return h(Finance, { bookings });
        case 'tasks': return h(Tasks, { tasks, reload: reloadAll });
        case 'calendar': return h(Calendar, { bookings });
        case 'leads': return h(Leads, { leads, reload: reloadAll, onConvert: handleConvert, isAdmin });
        default: return h(Dashboard, { bookings, tasks, leads, go: setTab });
      }
    };

    return h('div', { className: 'msa-shell' },
      h('aside', { className: 'msa-sidebar' },
        h('div', { className: 'msa-brand' },
          h('img', { src: 'assets/logo.png', alt: '', onError: (e) => { e.target.style.display = 'none'; } }),
          h('span', null, 'MarrakechStory')
        ),
        h('nav', { className: 'msa-nav' },
          TABS.map(([id, label, icon]) => h('button', {
            key: id, className: 'msa-nav-btn' + (tab === id ? ' active' : ''),
            onClick: () => setTab(id)
          }, h('span', { className: 'msa-nav-ico' }, icon), label))
        ),
        h('div', { className: 'msa-user' },
          h('div', { className: 'msa-user-info' },
            h('strong', null, user.user_metadata?.name || 'Admin'),
            h('span', { className: 'msa-muted' }, user.email)),
          h('button', { className: 'msa-btn msa-btn-ghost msa-btn-block', onClick: onLogout }, 'Log out')
        )
      ),
      h('main', { className: 'msa-main' },
        // pass a one-shot convert seed into Bookings via key remount
        convertSeed && tab === 'bookings'
          ? h(BookingModal, { initial: convertSeed, onClose: () => setConvertSeed(null),
              onSaved: () => { setConvertSeed(null); reloadAll(); } })
          : null,
        body()
      )
    );
  }

  // =====================================================================
  // ROOT
  // =====================================================================
  function AdminRoot() {
    const [user, setUser] = useState(undefined); // undefined = checking
    useEffect(() => {
      const sb = getSB();
      if (!sb) { setUser(null); return; }
      sb.auth.getSession().then(({ data }) => {
        const u = data.session?.user || null;
        setUser(u && u.email === ADMIN_EMAIL ? u : null);
      });
      const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
        const u = session?.user || null;
        setUser(u && u.email === ADMIN_EMAIL ? u : null);
      });
      return () => sub?.subscription?.unsubscribe?.();
    }, []);

    const logout = async () => { const sb = getSB(); if (sb) await sb.auth.signOut(); setUser(null); location.hash = ''; };

    if (user === undefined) return h('div', { className: 'msa-login' }, h('div', { className: 'msa-empty' }, 'Loading…'));
    if (!user) return h(Login, { onAuthed: setUser });
    return h(Shell, { user, onLogout: logout });
  }

  // ---- Mount controller (called by app.jsx) ----
  let root = null;
  window.MS_AdminMount = function (containerEl) {
    if (!containerEl) return;
    if (!root) root = window.ReactDOM.createRoot(containerEl);
    root.render(h(AdminRoot));
  };
  window.MS_AdminUnmount = function () {
    if (root) { root.unmount(); root = null; }
  };
})();
