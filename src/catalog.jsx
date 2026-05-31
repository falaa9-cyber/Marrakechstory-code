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

// Img component with onError fallback chain
function ResolvedImg({ tab, item, alt = '', className = '', style = {}, srcOverride = null }) {
  const { primary, placeholder, remote } = msResolveImg(tab, item);
  const initial = srcOverride || primary;
  const [src, setSrc] = useStateC(initial);
  const [stage, setStage] = useStateC(srcOverride ? 'override' : 'primary');
  // If srcOverride changes (e.g. user clicks thumbnail), update
  useEffectC(() => {
    if (srcOverride) { setSrc(srcOverride); setStage('override'); }
  }, [srcOverride]);
  const onError = () => {
    if (stage === 'override') { setSrc(primary); setStage('primary'); }
    else if (stage === 'primary') { setSrc(placeholder); setStage('placeholder'); }
    else if (stage === 'placeholder') { setSrc(remote); setStage('remote'); }
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
        <span className="cat-modal-tag">{item.tag || item.style || item.cuisine}</span>
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
        <span className="cat-modal-tag">{item.tag || item.style || item.cuisine}</span>
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
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : en;
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

  const bookRentalOnWhatsapp = () => {
    const msg = tx(
      `Hello Marrakech Story, I'd like to book ${item.name} from ${pickupDate} to ${returnDate} (${rentalDays} days).`,
      `Hei Marrakech Story, jeg vil booke ${item.name} fra ${pickupDate} til ${returnDate} (${rentalDays} dager).`,
      `Bonjour Marrakech Story, je souhaite louer ${item.name} du ${pickupDate} au ${returnDate} (${rentalDays} jours).`,
      `Hej Marrakech Story, jag vill boka ${item.name} från ${pickupDate} till ${returnDate} (${rentalDays} dagar).`
    );
    window.open(`https://wa.me/212698164331?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  const addToReservation = () => {
    onClose();
    document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="cat-modal-backdrop" onClick={onClose}>
      <div className="cat-modal" onClick={e => e.stopPropagation()}>
        <button className="cat-modal-close" onClick={onClose} aria-label={tx('Close', 'Lukk', 'Fermer', 'Stäng')}>✕</button>
        <ModalGallery tab={tab} item={item} lang={lang} />
        <div className="cat-modal-body">
          <div className="cat-modal-rating">
            <span className="stars"><Ic.Star /></span>
            <strong>{item.rating}</strong>
            <span className="cat-modal-reviews">({(item.reviews || 0).toLocaleString()} {tx('reviews', 'anmeldelser', 'avis', 'recensioner')})</span>
          </div>
          <h2 className="cat-modal-title">{localize(item.name, lang)}</h2>
          <div className="cat-modal-area"><Ic.Pin s={13} /> {localize(item.area, lang)}</div>
          {item.duration && <div className="cat-modal-duration"><Ic.Clock s={13} /> {localize(item.duration, lang)}</div>}
          <p className="cat-modal-desc">{localize(item.description || item.desc, lang)}</p>
          {item.slogan && <p className="cat-modal-slogan">{localize(item.slogan, lang)}</p>}
          {tab === 'restaurants' && item.cuisine && (
            <div className="cat-modal-meta">
              <span className="cat-modal-pill"><Ic.Utensils s={13} /> {item.cuisine}</span>
              {item.price && <span className="cat-modal-pill">{item.price}</span>}
            </div>
          )}
          {item.style && tab !== 'restaurants' && (
            <div className="cat-modal-meta">
              <span className="cat-modal-pill">{item.style}</span>
            </div>
          )}
          {item.atmosphere && (
            <p className="cat-modal-atmosphere"><Ic.Sparkle s={12} /> {item.atmosphere}</p>
          )}
          {item.whatToOrder && (
            <p className="cat-modal-wto"><strong>{tx('What to order:', 'Bestill:', 'À commander :', 'Beställ:')}</strong> {item.whatToOrder}</p>
          )}
          {item.perk && (
            <div className="cat-modal-perk">
              <span className="cat-modal-perk-label">{tx('Marrakech Story perk', 'Marrakech Story-fordel', 'Avantage Marrakech Story', 'Marrakech Story-fördel')}</span>
              <span className="cat-modal-perk-text">{item.perk}</span>
            </div>
          )}
          {(() => {
            // Marrakech Story policy: transport is NEVER included in catalog
            // bookings except for two activities — hot-air balloons and
            // paragliding — where the operator round-trips you from your
            // riad as part of the safety / weather window.
            const nameStr = (typeof item.name === 'string' ? item.name : (item.name?.en || item.name?.no || '')).toLowerCase();
            const slugStr = (item.slug || '').toLowerCase();
            const isAirActivity = /balloon|paragl|montgolfi[èe]re|para.?pente|luftbal/.test(nameStr + ' ' + slugStr);
            const hasTransport = isAirActivity;
            const transportTab = tab === 'transport';
            if (transportTab) return null;
            if (hasTransport) {
              return (
                <div className="cat-modal-transport included">
                  <div className="cat-modal-transport-icon"><Ic.Check s={16} /></div>
                  <div className="cat-modal-transport-body">
                    <strong>{tx('Transport included', 'Transport inkludert', 'Transport inclus', 'Transport ingår')}</strong>
                    <p>{tx('We pick you up at your hotel and drive you back safely.', 'Vi henter deg på hotellet og kjører deg trygt hjem.', 'Nous vous prenons à l\'hôtel et vous ramenons en toute sécurité.', 'Vi hämtar dig på hotellet och kör dig hem säkert.')}</p>
                  </div>
                </div>
              );
            }
            // Toggle for "need transport" — handed to the booking form
            return (
              <div className="cat-modal-transport not-included">
                <div className="cat-modal-transport-icon"><Ic.Plane s={16} /></div>
                <div className="cat-modal-transport-body">
                  <strong>{tx('Need transport?', 'Trenger du transport?', 'Besoin d\'un transport ?', 'Behöver du transport?')}</strong>
                  <p>{tx('Toggle on and we\'ll add a private driver to your reservation.', 'Skru på, så legger vi privat sjåfør til i reservasjonen.', 'Activez et nous ajoutons un chauffeur privé à la réservation.', 'Aktivera så lägger vi till en privatförare i din bokning.')}</p>
                  <label className="cat-transport-toggle">
                    <input
                      type="checkbox"
                      checked={!!needTransport}
                      onChange={(e) => setNeedTransport(e.target.checked)}
                    />
                    <span className="cat-transport-switch" aria-hidden="true"></span>
                    <span className="cat-transport-label">
                      {needTransport
                        ? tx('Yes, add transport', 'Ja, legg til transport', 'Oui, ajouter le transport', 'Ja, lägg till transport')
                        : tx('No, I\'ll handle it', 'Nei, jeg ordner selv', 'Non, je m\'en occupe', 'Nej, jag ordnar själv')}
                    </span>
                  </label>
                  {needTransport && (
                    <a className="cat-modal-transport-cta" href="#plan"
                       onClick={(e) => {
                         e.preventDefault();
                         window.MS_BookingContext = {
                           mode: 'catalog-transport',
                           title: item.name,
                           needTransport: true,
                           transportItem: item.name,
                         };
                         window.dispatchEvent(new CustomEvent('ms:booking-context'));
                         onClose();
                         setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 60);
                       }}>
                      {tx('Go to reservation →', 'Til reservasjon →', 'Vers la réservation →', 'Till bokning →')}
                    </a>
                  )}
                </div>
              </div>
            );
          })()}
          {item.included && item.included.length > 0 && (
            <div className="cat-modal-included">
              <div className="cat-modal-offers-title">{tx('Included', 'Inkludert', 'Inclus', 'Ingår')}</div>
              <ul className="cat-modal-included-list">
                {item.included.map((inc, i) => <li key={i}><Ic.Check s={13} /> {inc}</li>)}
              </ul>
            </div>
          )}
          {tab === 'transport' && item.prices && item.prices.length > 0 && (
            <div className="cat-modal-offers">
              <div className="cat-modal-offers-title">{tx('Price', 'Pris', 'Tarif', 'Pris')}</div>
              <div className="cat-modal-offers-list">
                <div className="cat-modal-offer-row">
                  <span>{item.prices[0].label}</span>
                  <span className="cat-modal-offer-price">{item.prices[0].price}</span>
                </div>
              </div>
            </div>
          )}
          {item.perfectFor && item.perfectFor.length > 0 && (
            <div className="cat-modal-perfect">
              <div className="cat-modal-offers-title">{tx('Perfect for', 'Perfekt for', 'Idéal pour', 'Perfekt för')}</div>
              <div className="cat-modal-perfect-chips">
                {(Array.isArray(item.perfectFor) ? item.perfectFor : localizeList(item.perfectFor, lang)).map((pf, i) => <span key={i} className="cat-modal-perfect-chip">{localize(pf, lang)}</span>)}
              </div>
            </div>
          )}
          {/* Sub-packages — used for consolidated partner cards like La Bohème */}
          {item.subPackages && item.subPackages.length > 0 && (() => {
            const groups = {};
            for (const sp of item.subPackages) {
              const key = localize(sp.section, lang) || 'Offres';
              if (!groups[key]) groups[key] = [];
              groups[key].push(sp);
            }
            const groupOrder = Object.keys(groups);
            return (
              <div className="cat-sub-pkg">
                <div className="cat-modal-offers-title">{tx('Offers', 'Tilbud', 'Offres', 'Erbjudanden')}</div>
                {groupOrder.map((g) => (
                  <div key={g} className="cat-sub-pkg-group">
                    <div className="cat-sub-pkg-group-h">{g}</div>
                    <div className="cat-sub-pkg-grid">
                      {groups[g].map((sp, i) => (
                        <div key={i} className="cat-sub-pkg-card">
                          {sp.image && (
                            <div className="cat-sub-pkg-img" style={{ backgroundImage: `url(${sp.image})` }}>
                              {sp.badge && <span className="cat-sub-pkg-badge">{localize(sp.badge, lang)}</span>}
                            </div>
                          )}
                          <div className="cat-sub-pkg-body">
                            <div className="cat-sub-pkg-name">{localize(sp.name, lang)}</div>
                            {sp.duration && <div className="cat-sub-pkg-duration">{localize(sp.duration, lang)}</div>}
                            {sp.description && <p className="cat-sub-pkg-desc">{localize(sp.description, lang)}</p>}
                            {sp.includes && (Array.isArray(sp.includes) ? sp.includes.length > 0 : true) && (
                              <ul className="cat-sub-pkg-list">
                                {(Array.isArray(sp.includes) ? sp.includes : localizeList(sp.includes, lang)).map((line, j) => <li key={j}>{localize(line, lang)}</li>)}
                              </ul>
                            )}
                            {/* Prices intentionally hidden — partner offers are quoted on request */}
                            {sp.note && <div className="cat-sub-pkg-note">{localize(sp.note, lang)}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          {item.practical && item.practical.length > 0 && (
            <div className="cat-modal-practical">
              <div className="cat-modal-offers-title">{tx('Good to know', 'Praktisk info', 'Infos pratiques', 'Bra att veta')}</div>
              <ul className="cat-modal-practical-list">
                {(Array.isArray(item.practical) ? item.practical : localizeList(item.practical, lang)).map((p, i) => <li key={i}>{localize(p, lang)}</li>)}
              </ul>
            </div>
          )}
          {tab === 'transport' && (
            <div className="cat-rental-book">
              <div className="cat-rental-book-h">
                {tx('Reserve this car', 'Reservér denne bilen', 'Réserver cette voiture', 'Reservera den här bilen')}
              </div>
              <div className="cat-rental-book-grid">
                <label className="cat-rental-fld">
                  <span>{tx('Pickup', 'Henting', 'Prise en charge', 'Upphämtning')}</span>
                  <input type="date" value={pickupDate} min={_today(0)}
                    onChange={(e) => {
                      setPickupDate(e.target.value);
                      if (returnDate && returnDate <= e.target.value) {
                        const d = new Date(e.target.value); d.setDate(d.getDate() + 1);
                        setReturnDate(d.toISOString().slice(0, 10));
                      }
                    }} />
                </label>
                <label className="cat-rental-fld">
                  <span>{tx('Return', 'Retur', 'Retour', 'Återlämning')}</span>
                  <input type="date" value={returnDate} min={pickupDate}
                    onChange={(e) => setReturnDate(e.target.value)} />
                </label>
                <div className="cat-rental-summary">
                  <div className="cat-rental-summary-row">
                    <span>{rentalDays} {lang === 'no' ? (rentalDays === 1 ? 'dag' : 'dager') : lang === 'fr' ? 'jours' : lang === 'sv' ? (rentalDays === 1 ? 'dag' : 'dagar') : (rentalDays === 1 ? 'day' : 'days')}</span>
                    <strong>€{Math.round(rentalSubtotal)}</strong>
                  </div>
                  <div className="cat-rental-summary-meta">
                    €{baseRate}/{tx('day', 'dag', 'jour', 'dag')}
                  </div>
                </div>
              </div>
              <div className="cat-rental-perks">
                <span className="cat-rental-perks-h">✓ {tx('No hidden costs', 'Ingen skjulte kostnader', 'Aucun frais caché', 'Inga dolda kostnader')}</span>
                <span>{tx('Unlimited mileage', 'Ubegrenset kjørelengde', 'Kilométrage illimité', 'Obegränsat antal mil')}</span>
                <span>·</span>
                <span>{tx('Free hotel / airport delivery', 'Gratis levering på hotell / flyplass', 'Livraison gratuite hôtel / aéroport', 'Gratis leverans hotell / flygplats')}</span>
                <span>·</span>
                <span>{tx('Insurance available', 'Forsikring tilgjengelig', 'Assurance disponible', 'Försäkring tillgänglig')}</span>
              </div>
            </div>
          )}
          <div className="cat-modal-price-row">
            {tab !== 'transport' && (
              <span className="cat-modal-pr-label" style={{ fontSize: 13, opacity: .7, fontStyle: 'italic' }}>
                {tx('Price on request', 'Pris på forespørsel', 'Prix sur demande', 'Pris på förfrågan')}
              </span>
            )}
            {tab === 'transport' && (
              <button className="btn btn-primary cat-modal-cta" onClick={bookRentalOnWhatsapp}
                disabled={rentalDays < 1}
                style={{ opacity: rentalDays < 1 ? .5 : 1 }}>
                {tx('Book on WhatsApp', 'Reservér på WhatsApp', 'Réserver sur WhatsApp', 'Boka på WhatsApp')} →
              </button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {item.sourceUrl && (
                <a className="cat-modal-source" href={item.sourceUrl} target="_blank" rel="noopener"
                   style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', alignSelf: 'center' }}>
                  {tx('Source', 'Kilde', 'Source', 'Källa')}
                </a>
              )}
              <button className="btn btn-outline cat-modal-cta" onClick={() => { onClose(); window.MS_OpenQuickBook?.(item, tab); }}>
                ⚡ {tx('Book just this', 'Bestill kun dette', 'Réserver uniquement ceci', 'Boka bara detta')}
              </button>
              <button className="btn btn-primary cat-modal-cta" onClick={addToReservation}>
                {tx('Add to trip', 'Legg til i reiseplan', 'Ajouter à l\'itinéraire', 'Lägg till i resan')}
                <Ic.Arrow s={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Catalog() {
  const D = window.MS_DATA;
  const { useT, usePrice, useMS } = window.MS_CTX;
  const t = useT();
  const price = usePrice();
  const ctx = useMS();
  const tx = (en, no, fr, sv) => ctx.lang === 'no' ? no : ctx.lang === 'fr' ? fr : ctx.lang === 'sv' ? (sv || no || en) : en;
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
      };
      const list = arrays[localTab] || [];
      const item = list.find(x => x.slug === slug) || list.find(x => (typeof x.name === 'string' ? x.name : x.name?.en) === name);
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
    { id: 'restaurants', label: t('cat_restaurants'), icon: <Ic.Utensils s={16} />, data: D.RESTAURANTS,
      filters: ['All', 'Fine Dining', 'Traditional Moroccan', 'Rooftop', 'Festive', 'International', 'Asian', 'Brunch', 'Café', 'Bar & Lounge', 'Nightclub'], priceLabel: '' },
    { id: 'excursions', label: t('cat_excursions'), icon: <Ic.Mountain s={16} />, data: D.EXCURSIONS,
      filters: ['All', 'Day-trip', 'Half-day', 'Multi-day'], priceLabel: t('cat_per_person') },
    { id: 'spa', label: t('cat_spa'), icon: <Ic.Sparkle s={16} />, data: D.SPAS,
      filters: ['All', 'Palace Spa', 'Boutique', 'Medina Hammam', 'Wellness House', 'Medical'], priceLabel: t('cat_per_person') },
    { id: 'camps', label: t('cat_camps'), icon: <Ic.Tent s={16} />, data: D.CAMPS,
      filters: ['All', 'Day Pass', 'Overnight', 'Events'], priceLabel: t('cat_per_person') },
    { id: 'pools', label: t('cat_pools'), icon: <Ic.Sun s={16} />, data: D.POOLS,
      filters: ['All', 'Palace', 'Boutique', 'Agafay', 'Beach Club', 'Festive', 'Family', 'Women Only', 'Water Park'], priceLabel: t('cat_per_person') },
    { id: 'transport', label: t('cat_transport'), icon: <Ic.Plane s={16} />, data: D.TRANSPORT,
      filters: ['All', 'Compact', 'Compact SUV', 'Sedan', 'SUV'], priceLabel: tx('/ day', '/ dag', '/ jour', '/ dag') },
  ];

  const current = tabs.find(x => x.id === tab);
  const items = useMemoC(() => {
    if (filter === 'All') return current.data;
    return current.data.filter(i => i.filter === filter);
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
                    <span className="cat-tag brand">{it.tag || it.style || it.cuisine}</span>
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
                    <span style={{ color: 'var(--ink-3)' }}>({(it.reviews || 0).toLocaleString()} {tx('reviews', 'anmeldelser', 'avis', 'recensioner')})</span>
                  </div>
                  <h3 className="cat-title">{localize(it.name, ctx.lang)}</h3>
                  <span className="cat-area"><Ic.Pin s={12} /> {localize(it.area, ctx.lang)}</span>
                  {it.duration && <span className="cat-duration"><Ic.Clock s={12} /> {localize(it.duration, ctx.lang)}</span>}
                  <p className="cat-desc">{localize(it.desc, ctx.lang)}</p>
                  <div className="cat-foot">
                    <div className="cat-price">
                      {(() => {
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
