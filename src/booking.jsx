// ============================================
// Booking flows
// 1. QuickBookModal      — book one catalog item (no full itinerary needed)
// 2. TweakItineraryModal — open an existing itinerary, add/remove catalog items, send request
// 3. FavouritesQuickAdd  — favourites panel surfaced above the planning form
// ============================================
const { useState: useStateB, useEffect: useEffectB, useMemo: useMemoB, useRef: useRefB } = React;
const Ib = window.MS_I;

const WHATSAPP = "212698164331";

// ── Helpers ────────────────────────────────────────────────────
function todayPlusBk(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function readUserPrefill() {
  try {
    const user = window.MS_Auth_User || JSON.parse(localStorage.getItem('ms_user') || 'null');
    const profile = JSON.parse(localStorage.getItem('ms_profile_data') || '{}');
    return {
      name: profile.name || user?.name || '',
      email: profile.email || user?.email || '',
      phone: profile.phone || '',
    };
  } catch { return { name: '', email: '', phone: '' }; }
}
function whatsappUrl(text) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

// ──────────────────────────────────────────────────────────────
// 1. QUICK-BOOK MODAL — book one catalog item, no full itinerary
// ──────────────────────────────────────────────────────────────
function QuickBookModal({ item, tab, onClose }) {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;
  const prefill = readUserPrefill();
  const [date, setDate] = useStateB(todayPlusBk(14));
  const [people, setPeople] = useStateB(2);
  const [name, setName] = useStateB(prefill.name);
  const [email, setEmail] = useStateB(prefill.email);
  const [phone, setPhone] = useStateB(prefill.phone);
  const [notes, setNotes] = useStateB('');
  const [needTransport, setNeedTransport] = useStateB(false);
  const [pickupAddr, setPickupAddr] = useStateB('');
  const [sent, setSent] = useStateB(false);

  useEffectB(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  const dateLabel = new Date(date).toLocaleDateString(lang === 'no' ? 'no-NO' : lang === 'fr' ? 'fr-FR' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' });

  const transportLine = () => needTransport
    ? tx(`\n• Transport needed: yes${pickupAddr ? ` (pickup: ${pickupAddr})` : ''}`,
         `\n• Trenger transport: ja${pickupAddr ? ` (henting: ${pickupAddr})` : ''}`,
         `\n• Transport nécessaire : oui${pickupAddr ? ` (prise en charge : ${pickupAddr})` : ''}`)
    : '';

  const buildMessage = () => {
    return tx(
      `Hi Marrakech Story, I'd like to book just this:\n\n• ${item.name}\n• Date: ${dateLabel}\n• People: ${people}\n• Name: ${name}\n• Email: ${email}\n• Phone: ${phone}${transportLine()}${notes ? `\n• Notes: ${notes}` : ''}`,
      `Hei Marrakech Story, jeg vil bestille kun dette:\n\n• ${item.name}\n• Dato: ${dateLabel}\n• Antall: ${people}\n• Navn: ${name}\n• E-post: ${email}\n• Telefon: ${phone}${transportLine()}${notes ? `\n• Notater: ${notes}` : ''}`,
      `Bonjour Marrakech Story, je souhaite réserver uniquement ceci :\n\n• ${item.name}\n• Date : ${dateLabel}\n• Personnes : ${people}\n• Nom : ${name}\n• Email : ${email}\n• Téléphone : ${phone}${transportLine()}${notes ? `\n• Notes : ${notes}` : ''}`
    );
  };

  const sendWhatsapp = () => {
    if (!name.trim() || !email.trim()) return;
    // Save the request locally so it shows up in the profile dashboard
    try {
      const reqs = JSON.parse(localStorage.getItem('ms_requests') || '[]');
      reqs.push({ type: 'single', item: item.name, tab, date, people, name, email, phone, notes, needTransport, pickupAddr, at: Date.now() });
      localStorage.setItem('ms_requests', JSON.stringify(reqs));
    } catch {}
    window.open(whatsappUrl(buildMessage()), '_blank', 'noopener');
    setSent(true);
  };

  const sendEmail = () => {
    if (!name.trim() || !email.trim()) return;
    const subject = `Booking — ${item.name}`;
    const body = buildMessage();
    window.location.href = `mailto:marrakechstory@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      const reqs = JSON.parse(localStorage.getItem('ms_requests') || '[]');
      reqs.push({ type: 'single', item: item.name, tab, date, people, name, email, phone, notes, needTransport, pickupAddr, at: Date.now() });
      localStorage.setItem('ms_requests', JSON.stringify(reqs));
    } catch {}
    setSent(true);
  };

  return (
    <div className="ms-qb-backdrop" onClick={onClose}>
      <div className="ms-qb-modal" onClick={e => e.stopPropagation()}>
        <button className="ms-qb-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="ms-qb-head" style={{ backgroundImage: `url(${item.img})` }}>
          <div className="ms-qb-head-overlay">
            <div className="ms-qb-head-eyebrow">{tx('QUICK BOOK', 'RASK BOOKING', 'RÉSERVATION RAPIDE')}</div>
            <div className="ms-qb-head-title">{item.name}</div>
          </div>
        </div>
        <div className="ms-qb-body">
          {sent ? (
            <div className="ms-qb-sent">
              <div className="ms-qb-sent-icon">✓</div>
              <h3>{tx('Request sent', 'Forespørsel sendt', 'Demande envoyée')}</h3>
              <p>{tx(
                "We've received your booking request. The team will confirm by email or WhatsApp within 24 hours.",
                "Vi har mottatt forespørselen din. Teamet bekrefter på e-post eller WhatsApp innen 24 timer.",
                "Nous avons reçu votre demande. L'équipe vous confirmera par e-mail ou WhatsApp sous 24 h."
              )}</p>
              <button className="btn btn-primary" onClick={onClose}>{tx('Close', 'Lukk', 'Fermer')}</button>
            </div>
          ) : (
            <>
              <p className="ms-qb-intro">{tx(
                "Just want this one thing? Skip the full planner — give us a date, who's coming, and how to reach you.",
                "Bare denne ene? Hopp over hele planleggeren — gi oss en dato, hvem som blir med og kontaktinfo.",
                "Juste cela ? Sautez le planificateur — donnez-nous une date, qui vient, et comment vous joindre."
              )}</p>

              <div className="ms-qb-grid">
                <label className="ms-qb-field">
                  <span>{tx('Date', 'Dato', 'Date')}</span>
                  <input type="date" value={date} min={todayPlusBk(0)} onChange={e => setDate(e.target.value)} />
                </label>
                <label className="ms-qb-field">
                  <span>{tx('People', 'Antall', 'Personnes')}</span>
                  <div className="ms-qb-stepper">
                    <button type="button" onClick={() => setPeople(p => Math.max(1, p - 1))}>−</button>
                    <span>{people}</span>
                    <button type="button" onClick={() => setPeople(p => Math.min(20, p + 1))}>+</button>
                  </div>
                </label>
                <label className="ms-qb-field" style={{ gridColumn: '1 / -1' }}>
                  <span>{tx('Full name', 'Fullt navn', 'Nom complet')}</span>
                  <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                </label>
                <label className="ms-qb-field">
                  <span>{tx('Email', 'E-post', 'E-mail')}</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </label>
                <label className="ms-qb-field">
                  <span>{tx('Phone', 'Telefon', 'Téléphone')}</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="+47 …" />
                </label>
                <div className="ms-qb-transport">
                  <label className="ms-qb-transport-row">
                    <input type="checkbox" checked={needTransport} onChange={e => setNeedTransport(e.target.checked)} />
                    <span>
                      <strong>{tx('I need transportation', 'Jeg trenger transport', 'J\'ai besoin de transport')}</strong>
                      <em>{tx('Transport is not included — tick to add a driver.',
                              'Transport er ikke inkludert — kryss av om vi skal legge til sjåfør.',
                              'Le transport n\'est pas inclus — cochez pour ajouter un chauffeur.')}</em>
                    </span>
                  </label>
                  {needTransport && (
                    <input className="ms-qb-transport-addr"
                      value={pickupAddr} onChange={e => setPickupAddr(e.target.value)}
                      placeholder={tx('Pickup address (hotel / riad name)', 'Henteadresse (hotell / riad)', 'Adresse de prise en charge')} />
                  )}
                </div>
                <label className="ms-qb-field" style={{ gridColumn: '1 / -1' }}>
                  <span>{tx('Notes (optional)', 'Notater (valgfritt)', 'Notes (optionnel)')}</span>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder={tx('Allergies, time preference…', 'Allergier, tidspreferanse …', 'Allergies, préférence horaire …')} />
                </label>
              </div>

              <div className="ms-qb-cta-row">
                <button className="btn btn-primary" onClick={sendWhatsapp} disabled={!name.trim() || !email.trim()}>
                  📱 {tx('Send via WhatsApp', 'Send via WhatsApp', 'Envoyer via WhatsApp')}
                </button>
                <button className="btn btn-outline" onClick={sendEmail} disabled={!name.trim() || !email.trim()}>
                  ✉ {tx('Send by email', 'Send på e-post', 'Envoyer par e-mail')}
                </button>
              </div>
              <p className="ms-qb-note">{tx(
                'No payment now — we confirm availability and price, you pay directly to the provider.',
                'Ingen betaling nå — vi bekrefter ledighet og pris, du betaler direkte til leverandøren.',
                'Aucun paiement maintenant — nous confirmons disponibilité et prix, vous payez directement.'
              )}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 2. TWEAK ITINERARY MODAL — start from an existing itinerary, customise it
// ──────────────────────────────────────────────────────────────
function TweakItineraryModal({ trip, onClose }) {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;
  const prefill = readUserPrefill();

  // Build editable day-list from the trip
  const initialDays = useMemoB(() => (trip.itinerary || []).map((d, i) => ({
    id: `day-${i}`,
    day: d.day || i + 1,
    route: d.route,
    text: d.text,
    extras: [],   // added catalog items per day
  })), [trip]);
  const [days, setDays] = useStateB(initialDays);
  const [pickerOpenFor, setPickerOpenFor] = useStateB(null);  // day id when picker active
  const [date, setDate] = useStateB(todayPlusBk(28));
  const [name, setName] = useStateB(prefill.name);
  const [email, setEmail] = useStateB(prefill.email);
  const [phone, setPhone] = useStateB(prefill.phone);
  const [notes, setNotes] = useStateB('');
  const [sent, setSent] = useStateB(false);

  useEffectB(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  const removeDay = (id) => setDays(ds => ds.filter(d => d.id !== id));
  const removeExtra = (dayId, extraIdx) => setDays(ds => ds.map(d =>
    d.id !== dayId ? d : { ...d, extras: d.extras.filter((_, i) => i !== extraIdx) }));
  const addExtra = (dayId, item, tab) => {
    setDays(ds => ds.map(d => d.id !== dayId ? d : { ...d, extras: [...d.extras, { item, tab }] }));
    setPickerOpenFor(null);
  };

  const buildMessage = () => {
    const dateLabel = new Date(date).toLocaleDateString(lang === 'no' ? 'no-NO' : lang === 'fr' ? 'fr-FR' : 'en-GB',
      { day: 'numeric', month: 'short', year: 'numeric' });
    const tripLines = days.map(d => {
      const extrasText = d.extras.map(e => `   + ${e.item.name}`).join('\n');
      return `Day ${d.day} — ${d.route}\n   ${d.text}${extrasText ? '\n' + extrasText : ''}`;
    }).join('\n\n');
    return tx(
      `Hi Marrakech Story, I'd like to book this trip with my own tweaks:\n\nBase trip: ${trip.title} (${trip.duration})\nStart date: ${dateLabel}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMy custom day-by-day:\n\n${tripLines}\n\n${notes ? `Notes: ${notes}` : ''}`,
      `Hei Marrakech Story, jeg vil bestille denne turen med mine tilpasninger:\n\nBasetur: ${trip.title} (${trip.duration})\nStartdato: ${dateLabel}\n\nNavn: ${name}\nE-post: ${email}\nTelefon: ${phone}\n\nMin tilpassede plan:\n\n${tripLines}\n\n${notes ? `Notater: ${notes}` : ''}`,
      `Bonjour Marrakech Story, je souhaite réserver ce voyage avec mes ajustements :\n\nBase : ${trip.title} (${trip.duration})\nDate de début : ${dateLabel}\n\nNom : ${name}\nEmail : ${email}\nTéléphone : ${phone}\n\nMon planning personnalisé :\n\n${tripLines}\n\n${notes ? `Notes : ${notes}` : ''}`
    );
  };

  const sendWhatsapp = () => {
    if (!name.trim() || !email.trim()) return;
    try {
      const reqs = JSON.parse(localStorage.getItem('ms_requests') || '[]');
      reqs.push({ type: 'tweaked', baseTrip: trip.slug, days: days.length, extras: days.reduce((s, d) => s + d.extras.length, 0), name, email, at: Date.now() });
      localStorage.setItem('ms_requests', JSON.stringify(reqs));
    } catch {}
    window.open(whatsappUrl(buildMessage()), '_blank', 'noopener');
    setSent(true);
  };

  return (
    <div className="ms-tweak-backdrop" onClick={onClose}>
      <div className="ms-tweak-modal" onClick={e => e.stopPropagation()}>
        <button className="ms-tweak-close" onClick={onClose} aria-label="Close">✕</button>
        <header className="ms-tweak-head">
          <div className="ms-tweak-eyebrow">— {tx('TWEAK THIS TRIP', 'TILPASS DENNE TUREN', 'PERSONNALISER CE VOYAGE')}</div>
          <h2>{trip.title}</h2>
          <p>{tx(
            "Remove days you don't want. Add anything from our catalogue. We'll cost it up and confirm.",
            "Fjern dager du ikke vil ha. Legg til hva som helst fra katalogen. Vi priser det og bekrefter.",
            "Retirez ce que vous ne voulez pas. Ajoutez ce qui vous plaît du catalogue. On chiffre et on confirme."
          )}</p>
        </header>

        {sent ? (
          <div className="ms-qb-sent">
            <div className="ms-qb-sent-icon">✓</div>
            <h3>{tx('Custom trip request sent', 'Tilpasset reise sendt', 'Demande personnalisée envoyée')}</h3>
            <p>{tx(
              "We've got your custom itinerary. Expect a reply within 24 hours.",
              "Vi har mottatt din tilpassede reise. Svar innen 24 timer.",
              "Nous avons reçu votre itinéraire. Réponse sous 24 h."
            )}</p>
            <button className="btn btn-primary" onClick={onClose}>{tx('Close', 'Lukk', 'Fermer')}</button>
          </div>
        ) : (
          <div className="ms-tweak-body">
            {/* Editable day-by-day */}
            <div className="ms-tweak-days">
              {days.map((d) => (
                <div key={d.id} className="ms-tweak-day">
                  <div className="ms-tweak-day-head">
                    <div>
                      <div className="ms-tweak-day-num">{tx('Day', 'Dag', 'Jour')} {d.day}</div>
                      <div className="ms-tweak-day-route">{d.route}</div>
                    </div>
                    <button className="ms-tweak-remove" onClick={() => removeDay(d.id)} aria-label="Remove day">✕</button>
                  </div>
                  <p className="ms-tweak-day-text">{d.text}</p>
                  {d.extras.length > 0 && (
                    <ul className="ms-tweak-extras">
                      {d.extras.map((e, i) => (
                        <li key={i}>
                          <span>+ {e.item.name}</span>
                          <button onClick={() => removeExtra(d.id, i)} aria-label="Remove">×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button className="ms-tweak-add" onClick={() => setPickerOpenFor(d.id)}>
                    + {tx('Add from catalogue', 'Legg til fra katalog', 'Ajouter du catalogue')}
                  </button>
                </div>
              ))}
              {days.length === 0 && (
                <div className="ms-tweak-empty">{tx('No days left. Add one or start fresh.', 'Ingen dager igjen. Legg til en eller start på nytt.', 'Aucun jour. Ajoutez-en un ou recommencez.')}</div>
              )}
            </div>

            {/* Contact block */}
            <div className="ms-tweak-contact">
              <h3 className="ms-tweak-h3">{tx('Your details', 'Dine opplysninger', 'Vos coordonnées')}</h3>
              <div className="ms-qb-grid">
                <label className="ms-qb-field">
                  <span>{tx('Start date', 'Startdato', 'Date de début')}</span>
                  <input type="date" value={date} min={todayPlusBk(0)} onChange={e => setDate(e.target.value)} />
                </label>
                <label className="ms-qb-field">
                  <span>{tx('Full name', 'Fullt navn', 'Nom complet')}</span>
                  <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                </label>
                <label className="ms-qb-field">
                  <span>{tx('Email', 'E-post', 'E-mail')}</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </label>
                <label className="ms-qb-field">
                  <span>{tx('Phone', 'Telefon', 'Téléphone')}</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="+47 …" />
                </label>
                <label className="ms-qb-field" style={{ gridColumn: '1 / -1' }}>
                  <span>{tx('Anything else?', 'Annet?', 'Autre chose ?')}</span>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                </label>
              </div>
            </div>

            <div className="ms-qb-cta-row">
              <button className="btn btn-primary" onClick={sendWhatsapp} disabled={!name.trim() || !email.trim()}>
                📱 {tx('Send custom trip via WhatsApp', 'Send tilpasset reise via WhatsApp', 'Envoyer via WhatsApp')}
              </button>
            </div>
            <p className="ms-qb-note">{tx(
              `${days.reduce((s, d) => s + d.extras.length, 0)} extras added · ${days.length} days kept`,
              `${days.reduce((s, d) => s + d.extras.length, 0)} ekstrapunkter lagt til · ${days.length} dager beholdt`,
              `${days.reduce((s, d) => s + d.extras.length, 0)} extras ajoutés · ${days.length} jours conservés`
            )}</p>
          </div>
        )}

        {pickerOpenFor && (
          <CatalogPicker
            onClose={() => setPickerOpenFor(null)}
            onPick={(item, tab) => addExtra(pickerOpenFor, item, tab)}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CATALOG PICKER — used by TweakItineraryModal and FavouritesQuickAdd
// ──────────────────────────────────────────────────────────────
function CatalogPicker({ onClose, onPick, lang }) {
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;
  const D = window.MS_DATA || {};
  const [tab, setTab] = useStateB('activities');
  const [q, setQ] = useStateB('');

  const TABS = [
    { id: 'activities', label: tx('Activities', 'Aktiviteter', 'Activités'), data: D.ACTIVITIES || [] },
    { id: 'restaurants', label: tx('Restaurants', 'Restauranter', 'Restaurants'), data: D.RESTAURANTS || [] },
    { id: 'spa', label: tx('Spa', 'Spa', 'Spa'), data: D.SPAS || [] },
    { id: 'pools', label: tx('Pools', 'Basseng', 'Piscines'), data: D.POOLS || [] },
    { id: 'camps', label: tx('Camps', 'Leirer', 'Camps'), data: D.CAMPS || [] },
    { id: 'transport', label: tx('Transport', 'Transport', 'Transport'), data: D.TRANSPORT || [] },
  ];
  const current = TABS.find(t => t.id === tab);
  const items = useMemoB(() => {
    if (!q.trim()) return current.data.slice(0, 30);
    const lq = q.toLowerCase();
    return current.data.filter(i => (i.name + ' ' + (i.desc || '') + ' ' + (i.area || '')).toLowerCase().includes(lq)).slice(0, 30);
  }, [tab, q, current]);

  return (
    <div className="ms-picker-backdrop" onClick={onClose}>
      <div className="ms-picker-modal" onClick={e => e.stopPropagation()}>
        <button className="ms-picker-close" onClick={onClose} aria-label="Close">✕</button>
        <header>
          <h3>{tx('Add from the catalogue', 'Legg til fra katalogen', 'Ajouter du catalogue')}</h3>
          <input className="ms-picker-search" type="search" value={q} onChange={e => setQ(e.target.value)}
            placeholder={tx('Search any activity, riad, spa, restaurant…', 'Søk aktivitet, riad, spa, restaurant …', 'Chercher activité, riad, spa …')} />
        </header>
        <div className="ms-picker-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`ms-picker-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>{t.label} <span>{t.data.length}</span></button>
          ))}
        </div>
        <div className="ms-picker-list">
          {items.map((it, i) => (
            <button key={i} className="ms-picker-item" onClick={() => onPick(it, tab)}>
              <div className="ms-picker-thumb" style={{ backgroundImage: `url(${it.img})` }} />
              <div className="ms-picker-meta">
                <strong>{it.name}</strong>
                <span>{it.area}</span>
              </div>
              <span className="ms-picker-add">+</span>
            </button>
          ))}
          {items.length === 0 && (
            <div className="ms-picker-empty">{tx('No matches.', 'Ingen treff.', 'Aucun résultat.')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 3. FAVOURITES QUICK-ADD — small panel placed above the planning form
// ──────────────────────────────────────────────────────────────
function FavouritesQuickAdd() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;
  const [favs, setFavs] = useStateB([]);
  const [tweakTrip, setTweakTrip] = useStateB(null);
  const [pickerOpen, setPickerOpen] = useStateB(false);

  useEffectB(() => {
    // Build the list of favourites (catalog items) + favourite itineraries
    const refresh = () => {
      let catFavs = {}, itinFavs = [];
      try {
        catFavs = JSON.parse(localStorage.getItem('ms_catalog_favs') || '{}');
        itinFavs = JSON.parse(localStorage.getItem('ms_user_favs') || '[]');
      } catch {}
      const D = window.MS_DATA || {};
      const arrays = { activities: 'ACTIVITIES', restaurants: 'RESTAURANTS', spa: 'SPAS', camps: 'CAMPS', pools: 'POOLS', transport: 'TRANSPORT' };
      const items = [];
      Object.entries(arrays).forEach(([tab, k]) => {
        (D[k] || []).forEach(it => {
          if (catFavs[`${tab}-${it.name}`]) items.push({ kind: 'catalog', tab, item: it });
        });
      });
      (window.MS_ITINERARIES || []).filter(t => itinFavs.includes(t.slug))
        .forEach(t => items.push({ kind: 'itinerary', trip: t }));
      setFavs(items);
    };
    refresh();
    const onStorage = (e) => { if (e.key === 'ms_catalog_favs' || e.key === 'ms_user_favs') refresh(); };
    window.addEventListener('storage', onStorage);
    // Also poll lightly because heart clicks happen in the same tab
    const t = setInterval(refresh, 1500);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(t); };
  }, []);

  if (favs.length === 0) return null;
  return (
    <div className="ms-favs reveal" id="my-favourites">
      <div className="ms-favs-head">
        <div>
          <div className="ms-favs-eyebrow">— {tx('YOUR FAVOURITES', 'DINE FAVORITTER', 'VOS FAVORIS')}</div>
          <h3>{tx('Start your trip from what you saved', 'Start reisen fra det du har lagret', 'Démarrez du contenu sauvegardé')}</h3>
        </div>
        <span className="ms-favs-count">{favs.length}</span>
      </div>
      <div className="ms-favs-list">
        {favs.map((f, i) => {
          if (f.kind === 'catalog') {
            return (
              <div key={`c-${i}`} className="ms-fav-card">
                <div className="ms-fav-thumb" style={{ backgroundImage: `url(${f.item.img})` }} />
                <div className="ms-fav-meta">
                  <strong>{f.item.name}</strong>
                  <span>{f.item.area}</span>
                </div>
                <button className="ms-fav-cta" onClick={() => window.MS_OpenQuickBook?.(f.item, f.tab)}>
                  {tx('Book this →', 'Bestill →', 'Réserver →')}
                </button>
              </div>
            );
          }
          // itinerary fav
          return (
            <div key={`i-${i}`} className="ms-fav-card ms-fav-card-itin">
              <div className="ms-fav-thumb" style={{ backgroundImage: `url(${f.trip.img})` }} />
              <div className="ms-fav-meta">
                <strong>{f.trip.title}</strong>
                <span>{f.trip.duration} · {f.trip.route}</span>
              </div>
              <button className="ms-fav-cta" onClick={() => setTweakTrip(f.trip)}>
                {tx('Tweak this →', 'Tilpass →', 'Personnaliser →')}
              </button>
            </div>
          );
        })}
      </div>
      {tweakTrip && <TweakItineraryModal trip={tweakTrip} onClose={() => setTweakTrip(null)} />}
    </div>
  );
}

// Globally expose the QuickBook opener so catalog.jsx can fire it
window.MS_OpenQuickBook = null;  // wired below via the host component

function QuickBookHost() {
  const [current, setCurrent] = useStateB(null);   // { item, tab }
  useEffectB(() => {
    window.MS_OpenQuickBook = (item, tab) => setCurrent({ item, tab });
    return () => { window.MS_OpenQuickBook = null; };
  }, []);
  if (!current) return null;
  return <QuickBookModal item={current.item} tab={current.tab} onClose={() => setCurrent(null)} />;
}

window.MS_QuickBookHost = QuickBookHost;
window.MS_TweakItineraryModal = TweakItineraryModal;
window.MS_FavouritesQuickAdd = FavouritesQuickAdd;
