// ============================================
// Catalog — 6 categories
// ============================================
const { useState: useStateC, useMemo: useMemoC, useEffect: useEffectC } = React;
const Ic = window.MS_I;

// Strip diacritics + lowercase + hyphenate.
function msSlugify(s) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Tab id → asset folder. Catalog tab "spa" maps to /assets/catalog/spas/.
const MS_CAT_DIR = {
  activities: 'activities',
  restaurants: 'restaurants',
  spa: 'spas',
  camps: 'camps',
  pools: 'pools',
  excursions: 'excursions',
  transport: 'transport',
};

// Final local fallback per category — guaranteed-present files in assets/.
const MS_CAT_LOCAL = {
  activities: 'assets/act-agafay-pool.jpg',
  restaurants: 'assets/act-food.jpg',
  spa:         'assets/act-zellige.jpg',
  spas:        'assets/act-zellige.jpg',
  camps:       'assets/act-sahara.jpg',
  pools:       'assets/act-agafay-pool.jpg',
  excursions:  'assets/hero-ourika.jpg',
  transport:   'assets/hero-medina.jpg',
};

// Resolver: try real photo at canonical path first, then AI placeholder, then existing Unsplash URL.
// Returns { primary, fallback1, fallback2, isAi }.
function msResolveImg(tab, item) {
  const dir = MS_CAT_DIR[tab] || tab;
  const slug = item.slug || msSlugify(item.name);
  const real = `assets/catalog/${dir}/${slug}.jpg`;
  const placeholder = `assets/catalog/placeholder_ai/${dir}/${slug}/hero.jpg`;
  const remote = item.img;
  return { primary: real, placeholder, remote, slug };
}

// Img component with onError fallback chain:
// primary (assets/catalog/…) → placeholder_ai → remote (item.img) → local category image
function ResolvedImg({ tab, item, alt = '', className = '', style = {}, srcOverride = null }) {
  const { primary, placeholder, remote } = msResolveImg(tab, item);
  const local = MS_CAT_LOCAL[tab] || MS_CAT_LOCAL[MS_CAT_DIR[tab]] || 'assets/hero-medina.jpg';
  const initial = srcOverride || primary;
  const [src, setSrc] = useStateC(initial);
  const [stage, setStage] = useStateC(srcOverride ? 'override' : 'primary');
  useEffectC(() => {
    if (srcOverride) { setSrc(srcOverride); setStage('override'); }
  }, [srcOverride]);
  const onError = () => {
    if (stage === 'override')     { setSrc(primary);      setStage('primary');     }
    else if (stage === 'primary') { setSrc(placeholder);  setStage('placeholder'); }
    else if (stage === 'placeholder') { setSrc(remote);   setStage('remote');      }
    else if (stage === 'remote')  { setSrc(local);        setStage('local');       }
    // 'local' is a guaranteed-present file — no further fallback needed
  };
  const isAi = stage === 'placeholder';
  const isDev = (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(location.hostname));
  return (
    <div className={`ms-img-wrap ${className}`} style={{ position: 'relative', ...style }}>
      <img src={src} alt={alt} onError={onError} loading="lazy" decoding="async"
           style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {isAi && isDev && <span className="ms-ai-ribbon">AI placeholder</span>}
    </div>
  );
}

// Gallery — image carousel with thumbnails. Used in modal when item.images present.
function ModalGallery({ tab, item, lang }) {
  const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : null;
  const [active, setActive] = useStateC(0);
  if (!images) {
    // Single image — original layout
    return (
      <div className="cat-modal-img cat-img-resolved">
        <ResolvedImg tab={tab} item={item} alt={item.name} />
        <span className="cat-modal-tag">{localize(item.tag || item.style || item.cuisine, lang)}</span>
      </div>
    );
  }
  const total = images.length;
  const prev = () => setActive(a => (a - 1 + total) % total);
  const next = () => setActive(a => (a + 1) % total);
  return (
    <div className="cat-modal-gallery">
      <div className="cat-modal-img cat-img-resolved">
        <ResolvedImg tab={tab} item={item} alt={`${item.name} ${active + 1}/${total}`} srcOverride={images[active]} />
        <span className="cat-modal-tag">{localize(item.tag || item.style || item.cuisine, lang)}</span>
        {total > 1 && (
          <>
            <button className="cat-modal-nav prev" onClick={prev} aria-label="Previous"><Ic.Arrow s={16} /></button>
            <button className="cat-modal-nav next" onClick={next} aria-label="Next"><Ic.Arrow s={16} /></button>
            <div className="cat-modal-counter">{active + 1} / {total}</div>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="cat-modal-thumbs">
          {images.map((url, i) => (
            <button key={i} className={`cat-modal-thumb ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}>
              <img src={url} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Localization helper — accepts either a plain string or { en, no, fr } object
function localize(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value[lang] || value.en || value.fr || value.no || '';
  }
  return value;
}
function localizeList(arr, lang) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr.map((v) => localize(v, lang));
  return localize(arr, lang) || [];
}

function CatalogModal({ item, tab, onClose, lang }) {
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : lang === 'da' ? (no || en) : en;
  useEffectC(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  // Per-car rental dates (transport tab only)
  const _today = (offset = 0) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const [pickupDate, setPickupDate] = useStateC(_today(7));
  const [returnDate, setReturnDate] = useStateC(_today(10));
  const [needTransport, setNeedTransport] = useStateC(false);
  const rentalDays = (() => {
    const a = new Date(pickupDate), b = new Date(returnDate);
    const d = Math.round((b - a) / 86400000);
    return d > 0 ? d : 0;
  })();
  const baseRate = (() => {
    if (tab !== 'transport') return 0;
    const m = (item.prices && item.prices[0] && item.prices[0].price || '').match(/€(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  })();
  const rentalSubtotal = baseRate * rentalDays;

  // Single in-modal reservation — sends straight to the admin (Requests) and
  // the email. No second popup, no jump to the trips form.
  const [r, setR] = useStateC({ name: '', email: '', phone: '', date: _today(7), people: 2, notes: '' });
  const [sent, setSent] = useStateC(false);
  const [busy, setBusy] = useStateC(false);
  const setR1 = (k, v) => setR(p => ({ ...p, [k]: v }));
  const sendReservation = async () => {
    if (!r.name.trim() || !r.email.trim()) return;
    setBusy(true);
    const isTransport = tab === 'transport';
    const start = isTransport ? pickupDate : r.date;
    const end = isTransport ? returnDate : r.date;
    const dur = isTransport ? Math.max(1, rentalDays) : 1;
    try {
      if (window.MS_submitForm) {
        await window.MS_submitForm('quickbook', {
          item: item.name, tab, name: r.name, email: r.email, phone: r.phone,
          people: r.people, date: start, notes: r.notes,
          startDate: start, endDate: end, duration: dur,
        }, { via: 'catalog' });
      }
      const prev = JSON.parse(localStorage.getItem('ms_profile_data') || '{}');
      localStorage.setItem('ms_profile_data', JSON.stringify({ ...prev, name: r.name || prev.name, email: r.email || prev.email, phone: r.phone || prev.phone }));
    } catch (e) {}
    setBusy(false); setSent(true);
    if (window.MS_Auth_PromptAfterBooking) window.MS_Auth_PromptAfterBooking();
  };

  const price = window.MS_CTX.usePrice();
  const slug = item.slug || msSlugify(item.name);
  const imgs = (Array.isArray(item.images) && item.images.length ? item.images : [item.img]).filter(Boolean);
  const priceFrom = item.startingPriceEur ? price(item.startingPriceEur) : null;
  const area = localize(item.area, lang);
  const toISO = (d) => { try { return d.toISOString().slice(0,10); } catch(e){ return _today(7); } };
  const onReserveCat = async ({ sel, guests, name, email, phone }) => {
    try {
      if (window.MS_submitForm) {
        const start = sel.in ? toISO(sel.in) : _today(7);
        await window.MS_submitForm("quickbook", { item: item.name, tab, name, email, phone, people: guests, date: start, notes: "", startDate: start, endDate: sel.out ? toISO(sel.out) : start, duration: 1 }, { via: "catalog" });
      }
      const prev = JSON.parse(localStorage.getItem("ms_profile_data") || "{}");
      localStorage.setItem("ms_profile_data", JSON.stringify({ ...prev, name: name || prev.name, email: email || prev.email, phone: phone || prev.phone }));
    } catch (e) {}
    if (window.MS_Auth_PromptAfterBooking) window.MS_Auth_PromptAfterBooking();
  };
  const L = {
    id: "cat-" + tab + "-" + slug, lang, onClose,
    title: localize(item.name, lang) + (tab === 'camps' && Array.isArray(item.rooms) && item.rooms.length ? ' · ' + tx('Accommodation', 'Overnatting', 'Hébergement', 'Boende') : ''),
    subtitle: [area, localize(item.style, lang)].filter(Boolean).join(" · "),
    metaDots: [localize(item.tag, lang), priceFrom ? tx("from","fra","dès") + " " + priceFrom : null].filter(Boolean),
    badge: localize(item.tag || item.style, lang),
    trust: tx("Hand-picked by Marrakech Story · we book & confirm for you · 24/7 support","Håndplukket av Marrakech Story · vi booker & bekrefter for deg · 24/7 støtte","Sélectionné par Marrakech Story · nous réservons & confirmons pour vous · assistance 24/7"),
    // Camp galleries also include the room/tent photos (hero mosaic + lightbox).
    images: (() => {
      const roomImgs = Array.isArray(item.rooms) ? item.rooms.map(r => r.img).filter(Boolean) : [];
      const all = [...imgs, ...roomImgs];
      return all.length ? all : ["assets/act-sahara.jpg"];
    })(),
    amenitiesTitle: tx("What this place offers","Dette tilbys","Ce que propose ce lieu"),
    amenities: localizeList(item.perfectFor, lang),
    rooms: Array.isArray(item.rooms) ? item.rooms : null,
    passes: item.passes || null,
    description: localize(item.description || item.desc, lang),
    mapPlace: area || "Marrakech",
    mapName: localize(item.name, lang),
    locationLabel: area,
    thingsToKnow: (item.practical && item.practical.length) ? {
      rules: { title: tx("Good to know","Verdt å vite","Bon à savoir"), items: localizeList(item.practical, lang) },
      safety: { title: tx("Booking & trust","Booking & trygghet","Réservation & confiance"), items: [tx("We confirm availability directly with the venue.","Vi bekrefter tilgjengelighet direkte med stedet.","Nous confirmons la disponibilité directement avec l’établissement."), tx("No online payment — pay on site or as agreed.","Ingen nettbetaling — betal på stedet eller som avtalt.","Pas de paiement en ligne — sur place ou comme convenu."), tx("24/7 WhatsApp support — Aladdin & Marte.","24/7 WhatsApp-støtte — Aladdin & Marte.","Assistance WhatsApp 24/7 — Aladdin & Marte.")] },
    } : null,
    price: { from: priceFrom || tx("On request","På forespørsel","Sur demande"), per: tx("/ person","/ person","/ personne") },
    banner: tx("We book it for you","Vi booker for deg","Nous réservons pour vous"),
    breadcrumb: ["Morocco", area ? area.split("·")[0].trim() : "Marrakech", localize(item.name, lang)],
    reserveLabel: tx("Send reservation","Send reservasjon","Envoyer la réservation"),
    reserveForm: true,
    onReserve: onReserveCat,
  };
  const LD = window.MS_ListingDetail;
  return LD ? <LD {...L} /> : null;
}

function Catalog() {
  const D = window.MS_DATA;
  const { useT, usePrice, useMS } = window.MS_CTX;
  const t = useT();
  const price = usePrice();
  const ctx = useMS();
  const tx = (en, no, fr, sv) => ctx.lang === 'no' ? no : ctx.lang === 'fr' ? fr : ctx.lang === 'sv' ? (sv || no || en) : ctx.lang === 'da' ? (no || en) : en;
  const [tab, setTab] = useStateC('activities');
  const [filter, setFilter] = useStateC('All');
  const [favs, setFavs] = useStateC({});
  const [modal, setModal] = useStateC(null);
  const [visibleCount, setVisibleCount] = useStateC(4);

  useEffectC(() => { setVisibleCount(4); }, [tab, filter]);

  // Open a catalog item directly from the hero search dropdown.
  useEffectC(() => {
    const onOpen = (e) => {
      const targetTab = e.detail?.tab;
      const slug = e.detail?.slug;
      const name = e.detail?.name;
      if (!targetTab) return;
      const map = {
        activities: 'activities', restaurants: 'restaurants', spas: 'spa',
        camps: 'camps', pools: 'pools', transport: 'transport', excursions: 'excursions',
      };
      const localTab = map[targetTab] || targetTab;
      setTab(localTab);
      const D = window.MS_DATA || {};
      const arrays = {
        activities: D.ACTIVITIES, restaurants: D.RESTAURANTS, spa: D.SPAS,
        camps: D.CAMPS, pools: D.POOLS, transport: D.TRANSPORT, excursions: D.EXCURSIONS,
        hotels: D.HOTELS,
      };
      const list = arrays[localTab] || [];
      const nm = (x) => (typeof x.name === 'string' ? x.name : x.name?.en) || '';
      const item = (slug && list.find(x => x.slug === slug))
        || (name && list.find(x => nm(x) === name))
        || (name && list.find(x => nm(x).toLowerCase().includes(String(name).toLowerCase())));
      if (item) {
        // Defer one frame so the tab swap settles first.
        setTimeout(() => setModal({ item, tab: localTab }), 30);
      }
    };
    window.addEventListener('ms:open-catalog', onOpen);
    return () => window.removeEventListener('ms:open-catalog', onOpen);
  }, []);

  const tabs = [
    { id: 'activities', label: t('cat_activities'), icon: <Ic.Compass s={16} />, data: D.ACTIVITIES,
      filters: ['All', 'Discover', 'In the Air', 'Nautical', 'Outdoor'], priceLabel: t('cat_per_person') },
    { id: 'camps', label: 'Agafay', icon: <Ic.Tent s={16} />, data: D.CAMPS,
      filters: ['All', 'Day Pass', 'Overnight', 'Events'], priceLabel: t('cat_per_person') },
    { id: 'transport', label: t('cat_transport'), icon: <Ic.Plane s={16} />, data: D.TRANSPORT,
      filters: ['All', 'Compact', 'Compact SUV', 'Sedan', 'SUV'], priceLabel: tx('/ day', '/ dag', '/ jour', '/ dag') },
    { id: 'restaurants', label: t('cat_restaurants'), icon: <Ic.Utensils s={16} />, data: D.RESTAURANTS,
      filters: ['All', 'Fine Dining', 'Traditional Moroccan', 'Rooftop', 'Festive', 'International', 'Asian', 'Brunch', 'Café', 'Bar & Lounge', 'Nightclub'], priceLabel: '' },
    { id: 'spa', label: t('cat_spa'), icon: <Ic.Sparkle s={16} />, data: D.SPAS,
      filters: ['All', 'Palace Spa', 'Boutique', 'Medina Hammam', 'Wellness House', 'Medical'], priceLabel: t('cat_per_person') },
    { id: 'hotels', label: tx('Hotels', 'Hoteller', 'Hôtels', 'Hotell'), icon: <Ic.Star s={16} />, data: D.HOTELS,
      filters: ['All', '5-Star', '4-Star', 'Marrakech', 'Agadir & Taghazout'], priceLabel: tx('/ night', '/ natt', '/ nuit', '/ natt') },
    { id: 'pools', label: t('cat_pools'), icon: <Ic.Sun s={16} />, data: D.POOLS,
      filters: ['All', 'Palace', 'Boutique', 'Agafay', 'Beach Club', 'Festive', 'Family', 'Women Only', 'Water Park'], priceLabel: t('cat_per_person') },
  ];

  const current = tabs.find(x => x.id === tab);
  const items = useMemoC(() => {
    if (filter === 'All') return current.data;
    return current.data.filter(i => i.filter === filter || i.style === filter);
  }, [tab, filter, current]);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  // Sync favs with localStorage so they appear in the profile dashboard
  useEffectC(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ms_catalog_favs') || '{}');
      setFavs(stored);
    } catch {}
  }, []);
  const toggleFav = (key) => setFavs(p => {
    const next = { ...p, [key]: !p[key] };
    if (!next[key]) delete next[key];
    localStorage.setItem('ms_catalog_favs', JSON.stringify(next));
    return next;
  });

  return (
    <section className="catalog section" id="catalog">
      <div className="wrap">
        <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 56px' }}>
          <span className="eyebrow">{t('cat_eyebrow')}</span>
          <h2>{t('cat_title_a')} <em>{t('cat_title_b')}</em>{(() => { const c = t('cat_title_c'); return c && c !== 'cat_title_c' ? ` ${c}` : ''; })()}</h2>
          <p style={{ margin: '0 auto' }}>{t('cat_sub')}</p>
        </div>

        <div className="cat-tabs-v2 reveal">
          {tabs.map(x => (
            <button key={x.id} className={`cat-tab-v2 ${tab === x.id ? 'active' : ''}`}
              onClick={() => { setTab(x.id); setFilter('All'); }}>
              <span className="ico">{x.icon}</span>
              <span>{x.label}</span>
              <span className="count">{x.data.length}</span>
            </button>
          ))}
        </div>

        <div className="cat-filters reveal">
          {current.filters.map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
          <div style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12, color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            {items.length} {t('cat_results')}
          </div>
        </div>

        {tab === 'transport' && (
          <div className="cat-rental-banner reveal">
            <div className="cat-rental-banner-eyebrow" style={{ color: 'var(--brand)' }}>
              ✓ {tx('NO HIDDEN COSTS', 'INGEN SKJULTE KOSTNADER', 'AUCUN FRAIS CACHÉ', 'INGA DOLDA KOSTNADER')}
            </div>
            <div className="cat-rental-banner-row">
              <div className="cat-rental-banner-perks">
                {tx(
                  'Unlimited mileage · Free hotel/airport delivery · Insurance available · Fuel policy clear at pickup',
                  'Ubegrenset kjørelengde · Gratis levering hotell/flyplass · Forsikring tilgjengelig · Drivstoffregel klart spesifisert ved henting',
                  'Kilométrage illimité · Livraison gratuite hôtel/aéroport · Assurance disponible · Politique carburant claire à la prise en charge',
                  'Obegränsat antal mil · Gratis leverans hotell/flygplats · Försäkring tillgänglig · Bränslepolicy tydlig vid upphämtning'
                )}
              </div>
            </div>
          </div>
        )}

        <div className="cat-grid">
          {visibleItems.map((it, i) => {
            const key = `${tab}-${it.name}`;
            return (
              <div key={key} className="cat-card reveal" style={{ transitionDelay: `${(i % 6) * 50}ms` }}>
                <div className="cat-img cat-img-resolved"
                  onClick={() => setModal({ item: it, tab })} role="button" tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setModal({ item: it, tab })}
                  style={{ cursor: 'pointer' }}>
                  <ResolvedImg tab={tab} item={it} alt={it.name} />
                  <div className="cat-img-content">
                    <span className="cat-tag brand">{localize(it.tag || it.style || it.cuisine, ctx.lang)}</span>
                  </div>
                  <button className={`cat-fav ${favs[key] ? 'active' : ''}`} onClick={e => { e.stopPropagation(); toggleFav(key); }}>
                    <Ic.Heart s={16} filled={favs[key]} />
                    <span className="ms-fav-plus">+1</span>
                  </button>
                </div>
                <div className="cat-body">
                  <div className="cat-rating">
                    <span className="stars"><Ic.Star /></span>
                    <strong>{it.rating}</strong>
                    {it.reviews
                      ? <span style={{ color: 'var(--ink-3)' }}>({it.reviews.toLocaleString()} {tx('reviews', 'anmeldelser', 'avis', 'recensioner')})</span>
                      : (it.guestRating ? <span style={{ color: 'var(--ink-3)' }}>· {it.guestRating} {tx('guest score', 'gjestescore', 'note clients', 'gästbetyg')}</span> : null)}
                  </div>
                  <h3 className="cat-title">
                    {localize(it.name, ctx.lang)}
                    {tab === 'camps' && it.rooms && it.rooms.length > 0 && (
                      <span className="cat-title-acc"> · {tx('Accommodation', 'Overnatting', 'Hébergement', 'Boende')}</span>
                    )}
                  </h3>
                  <span className="cat-area"><Ic.Pin s={12} /> {localize(it.area, ctx.lang)}</span>
                  {it.duration && <span className="cat-duration"><Ic.Clock s={12} /> {localize(it.duration, ctx.lang)}</span>}
                  <p className="cat-desc">{localize(it.desc, ctx.lang)}</p>
                  <div className="cat-foot">
                    <div className="cat-price">
                      {(() => {
                        // Camps: no price on the card — visitors see prices in
                        // the popup's passes & rooms ("check offers").
                        if (tab === 'camps') {
                          return (
                            <span className="cat-price-offers">
                              {tx('Check offers', 'Se tilbud', 'Voir les offres', 'Se erbjudanden')} →
                            </span>
                          );
                        }
                        // Sensible per-tab default so every offer shows a from-price even
                        // when the data file doesn't carry one. Tweaked per item index
                        // (small ± so the grid doesn't read like a single number).
                        const TAB_DEFAULTS = {
                          activities:  { base: 35, step: 5,  unit: '/person' },
                          restaurants: { base: 40, step: 5,  unit: '/person' },
                          excursions:  { base: 75, step: 10, unit: '/person' },
                          spa:         { base: 55, step: 10, unit: '/person' },
                          camps:       { base: 65, step: 10, unit: '/person' },
                          pools:       { base: 30, step: 5,  unit: '/person' },
                          transport:   { base: 29, step: 0,  unit: '/day' },
                        };
                        const seed = (it.slug || it.name || '').toString()
                          .split('').reduce((s, c) => s + c.charCodeAt(0), 0);
                        const def = TAB_DEFAULTS[tab];
                        const fallback = def
                          ? `€${def.base + (def.step ? (seed % 5) * def.step : 0)}${def.unit}`
                          : null;

                        const directPrice = it.price && /€|MAD|kr|\$/i.test(it.price) ? it.price : null;
                        const tieredPrice = it.prices && it.prices[0] && it.prices[0].price;
                        const raw = (directPrice || tieredPrice || fallback || '')
                          .replace(/^\s*(from|From|à partir de|fra|från)\s+/i, '');

                        if (raw) {
                          const fromLabel = ctx.lang === 'no' ? 'Fra'
                            : ctx.lang === 'fr' ? 'À partir de'
                            : ctx.lang === 'sv' ? 'Från' : 'From';
                          return (
                            <>
                              <span className="cat-price-from">{fromLabel}</span>
                              <span className="amount cat-price-amount">{raw}</span>
                            </>
                          );
                        }
                        return (
                          <span className="amount" style={{ fontSize: 13, fontStyle: 'italic', opacity: .7 }}>
                            {ctx.lang === 'no' ? 'På forespørsel'
                              : ctx.lang === 'fr' ? 'Sur demande'
                              : ctx.lang === 'sv' ? 'På förfrågan'
                              : 'On request'}
                          </span>
                        );
                      })()}
                    </div>
                    <button className="cat-arrow" onClick={() => setModal({ item: it, tab })}><Ic.Arrow s={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {hasMore && (
          <div className="cat-showmore-row">
            <button className="cat-showmore" onClick={() => setVisibleCount(c => c + 4)}>
              {tx(`Show more (${items.length - visibleCount} remaining)`, `Vis flere (${items.length - visibleCount} igjen)`, `Voir plus (${items.length - visibleCount} restants)`, `Visa fler (${items.length - visibleCount} kvar)`)}
              <Ic.Arrow s={14} />
            </button>
            {visibleCount + 4 < items.length && (
              <button className="cat-showall" onClick={() => setVisibleCount(items.length)}>
                {tx('Show all', 'Vis alle', 'Tout voir', 'Visa alla')}
              </button>
            )}
          </div>
        )}
      </div>
      {modal && (
        <CatalogModal
          item={modal.item}
          tab={modal.tab}
          lang={ctx.lang}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}

window.MS_Catalog = Catalog;
