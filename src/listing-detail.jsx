/* ============================================================================
   MS_ListingDetail — Airbnb-style listing-detail modal (trips + catalogue)
   Renders a normalized `listing` (L) object. By request: NO reviews / host
   sections (we don't fabricate named customer reviews on a live site).
   ========================================================================== */
(function () {
  const { useState, useEffect, useRef } = React;
  const T = (lang) => (en, no, fr, sv) =>
    lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : lang === 'da' ? (no || en) : en;
  const locale = (lang) => lang === 'no' ? 'nb-NO' : lang === 'fr' ? 'fr-FR' : lang === 'da' ? 'da-DK' : lang === 'de' ? 'de-DE' : 'en-US';
  const fmtDate = (d, loc) => d ? d.toLocaleDateString(loc, { day: 'numeric', month: 'short' }) : '';

  /* ---- Photo mosaic (desktop) ---- */
  function Mosaic({ images, alt, onShowAll, tx }) {
    const imgs = images.slice(0, 5);          // use only the real images — never duplicate to pad
    const n = imgs.length;
    return (
      <div className="ms-ld-mosaic">
        <div className={'ms-ld-mosaic-grid ms-ld-mg-' + n}>
          {imgs.map((src, i) => (
            <div key={i} className={'ms-ld-mo' + (i === 0 ? ' ms-ld-mo-main' : '')} style={{ backgroundImage: `url(${src})` }} onClick={() => onShowAll(i)} role="button" aria-label={alt} />
          ))}
        </div>
        {images.length > 1 && (
          <button className="ms-ld-showall" onClick={() => onShowAll(0)}>
            <span className="ms-ld-showall-ico" aria-hidden="true">▦</span> {tx('Show all photos', 'Vis alle bilder', 'Voir toutes les photos')}
          </button>
        )}
      </div>
    );
  }

  /* ---- Mobile swipe carousel ---- */
  function MobileCarousel({ images, alt }) {
    const [i, setI] = useState(0); const n = images.length; const start = useRef(null);
    const go = (d) => setI(x => (x + d + n) % n);
    return (
      <div className="ms-ld-mcar"
        onTouchStart={e => { start.current = e.touches[0].clientX; }}
        onTouchEnd={e => { const dx = e.changedTouches[0].clientX - (start.current || 0); if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); start.current = null; }}>
        <div className="ms-ld-mcar-img" style={{ backgroundImage: `url(${images[i]})` }} role="img" aria-label={alt} />
        {n > 1 && <div className="ms-ld-mcar-count">{i + 1} / {n}</div>}
        {n > 1 && <div className="ms-ld-mcar-dots">{images.map((_, k) => <span key={k} className={'ms-ld-mcar-dot' + (k === i ? ' on' : '')} />)}</div>}
      </div>
    );
  }

  /* ---- Full-screen lightbox ---- */
  function Lightbox({ images, alt, start, onClose }) {
    const [i, setI] = useState(start || 0); const n = images.length;
    useEffect(() => {
      const k = e => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') setI(x => (x - 1 + n) % n); if (e.key === 'ArrowRight') setI(x => (x + 1) % n); };
      document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
    }, []);
    return (
      <div className="ms-ld-lb" onClick={onClose}>
        <button className="ms-ld-lb-close" onClick={onClose} aria-label="Close">✕</button>
        <button className="ms-ld-lb-nav prev" onClick={e => { e.stopPropagation(); setI((i - 1 + n) % n); }} aria-label="Previous">‹</button>
        <img className="ms-ld-lb-img" src={images[i]} alt={alt} onClick={e => e.stopPropagation()} />
        <button className="ms-ld-lb-nav next" onClick={e => { e.stopPropagation(); setI((i + 1) % n); }} aria-label="Next">›</button>
        <div className="ms-ld-lb-count">{i + 1} / {n}</div>
      </div>
    );
  }

  /* ---- 2-month availability calendar ---- */
  function Calendar({ lang, sel, setSel }) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [base, setBase] = useState(thisMonth);
    const loc = locale(lang);
    const dows = []; for (let i = 0; i < 7; i++) dows.push(new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: 'short' }).slice(0, 2));
    const pick = (d) => { if (!sel.in || sel.out || d < sel.in) setSel({ in: d, out: null }); else setSel({ in: sel.in, out: d }); };
    const month = (off) => {
      const m = new Date(base.getFullYear(), base.getMonth() + off, 1);
      const y = m.getFullYear(), mo = m.getMonth();
      const fd = (new Date(y, mo, 1).getDay() + 6) % 7;
      const dim = new Date(y, mo + 1, 0).getDate();
      const cells = []; for (let i = 0; i < fd; i++) cells.push(null); for (let d = 1; d <= dim; d++) cells.push(new Date(y, mo, d));
      return (
        <div className="ms-ld-cal-m" key={off}>
          <div className="ms-ld-cal-mn">{m.toLocaleDateString(loc, { month: 'long', year: 'numeric' })}</div>
          <div className="ms-ld-cal-dows">{dows.map((w, i) => <span key={i}>{w}</span>)}</div>
          <div className="ms-ld-cal-grid">
            {cells.map((c, i) => {
              if (!c) return <span key={i} />;
              const past = c < today;
              const isIn = sel.in && c.getTime() === sel.in.getTime();
              const isOut = sel.out && c.getTime() === sel.out.getTime();
              const inRange = sel.in && sel.out && c > sel.in && c < sel.out;
              return <button key={i} disabled={past} type="button"
                className={'ms-ld-cal-d' + (past ? ' past' : '') + (isIn || isOut ? ' sel' : '') + (inRange ? ' range' : '')}
                onClick={() => pick(c)}>{c.getDate()}</button>;
            })}
          </div>
        </div>
      );
    };
    return (
      <div className="ms-ld-cal">
        <div className="ms-ld-cal-head">
          <button className="ms-ld-cal-arrow" type="button" disabled={base <= thisMonth} onClick={() => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
          <button className="ms-ld-cal-arrow" type="button" onClick={() => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1))} aria-label="Next month">›</button>
        </div>
        <div className="ms-ld-cal-months">{month(0)}{month(1)}</div>
      </div>
    );
  }

  /* ---- Geo gazetteer + route → stops resolver ---- */
  const MS_GEO = {
    'marrakech': [31.6295, -7.9811], 'agafay': [31.47, -8.16], "tizi n'tichka": [31.29, -7.37], 'tizi': [31.29, -7.37],
    'ait ben haddou': [31.047, -7.13], 'aït ben haddou': [31.047, -7.13], 'ouarzazate': [30.92, -6.91],
    'dades': [31.36, -5.99], 'dadès': [31.36, -5.99], 'todra': [31.52, -5.53], 'todgha': [31.52, -5.53], 'tinghir': [31.51, -5.53],
    'merzouga': [31.10, -4.01], 'sahara': [31.10, -4.01], 'erg chebbi': [31.10, -4.01],
    'tangier': [35.76, -5.83], 'tanger': [35.76, -5.83], 'chefchaouen': [35.17, -5.27],
    'fes': [34.04, -4.99], 'fez': [34.04, -4.99], 'fès': [34.04, -4.99],
    'agadir': [30.42, -9.60], 'essaouira': [31.51, -9.77], 'ourika': [31.36, -7.76],
    'high atlas': [31.13, -7.92], 'atlas': [31.13, -7.92], 'volubilis': [34.07, -5.55],
    'rissani': [31.28, -4.26], 'midelt': [32.68, -4.74], 'azrou': [33.43, -5.22], 'ifrane': [33.53, -5.11], 'taroudant': [30.47, -8.88],
    // Marrakech districts & nearby spots used in catalogue "area" fields
    'medina': [31.6258, -7.9806], 'médina': [31.6258, -7.9806],
    'gueliz': [31.6383, -8.0086], 'guéliz': [31.6383, -8.0086],
    'hivernage': [31.6228, -8.0090], 'agdal': [31.6010, -7.9810],
    'palmeraie': [31.6650, -7.9430], 'menara': [31.6120, -8.0240],
    'amizmiz': [31.2200, -8.2400], 'asni': [31.2470, -7.9700], 'imlil': [31.1370, -7.9190],
    'setti fatma': [31.2230, -7.6760], 'kik': [31.30, -8.05], 'lalla takerkoust': [31.3580, -8.1320],
    'takerkoust': [31.3580, -8.1320], 'oukaimeden': [31.2050, -7.8590],
    'zagora': [30.3320, -5.8380], 'draa': [30.95, -6.45], 'erfoud': [31.4360, -4.2330],
    'casablanca': [33.5731, -7.5898], 'rabat': [34.0209, -6.8416], 'ouzoud': [32.0150, -6.7200],
    'al haouz': [31.30, -7.90], 'morocco': [31.6295, -7.9811], 'marrakesh': [31.6295, -7.9811],
    'targa': [31.6520, -8.0470], 'golf royal': [31.6010, -7.9300], 'route du golf': [31.6010, -7.9300],
    'barrage': [31.4200, -8.0800], 'aéroport': [31.6050, -8.0360], 'aeroport': [31.6050, -8.0360],
    'amizmiz': [31.2200, -8.2400], "route d'amizmiz": [31.40, -8.10],
  };
  const MARRAKECH = { name: 'Marrakech', lat: 31.6295, lng: -7.9811 };
  function resolveStops(route, single) {
    if (!route) return [];
    const frags = String(route).split(/→|->|—|·|>|\//).map(x => x.trim()).filter(Boolean);
    const out = [];
    frags.forEach(fr => {
      const low = fr.toLowerCase(); let best = null, key = null;
      for (const k in MS_GEO) { if (low.indexOf(k) > -1 && (!key || k.length > key.length)) { key = k; best = MS_GEO[k]; } }
      if (best) { const last = out[out.length - 1]; if (!last || last.lat !== best[0] || last.lng !== best[1]) out.push({ name: fr, lat: best[0], lng: best[1] }); }
    });
    return single ? out.slice(0, 1) : out;
  }

  /* ---- Map of the itinerary stops — Google-style basemap (CARTO Voyager) +
         real road-following route from OSRM, drawn as a blue Google route line.
         No API key required. ---- */
  function StopMap({ stops }) {
    const ref = useRef(null);
    useEffect(() => {
      if (!window.L || !ref.current || !stops.length) return;
      const map = window.L.map(ref.current, { scrollWheelZoom: false, zoomControl: true });
      // Clean Google-Maps-like raster basemap (free, no key)
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd', attribution: '© OpenStreetMap, © CARTO',
      }).addTo(map);
      const pts = stops.map(s => [s.lat, s.lng]);

      // Google-style numbered pins: green start · red end · blue waypoints
      stops.forEach((s, i) => {
        const single = stops.length === 1;
        const isStart = i === 0, isEnd = i === stops.length - 1;
        const color = single ? '#ea4335' : isStart ? '#34a853' : isEnd ? '#ea4335' : '#1a73e8';
        const label = single ? '' : String(i + 1);
        const icon = window.L.divIcon({
          className: 'ms-ld-pinwrap',
          html: '<div class="ms-ld-pin" style="background:' + color + '">' + label + '</div>',
          iconSize: [28, 28], iconAnchor: [14, 14],
        });
        window.L.marker([s.lat, s.lng], { icon }).addTo(map)
          .bindTooltip((label ? label + '. ' : '') + s.name, { direction: 'top', offset: [0, -14] });
      });

      // Blue route line (Google Directions look): white casing under a blue line
      let casing, line;
      const drawRoute = (latlngs) => {
        [casing, line].forEach(l => l && map.removeLayer(l));
        casing = window.L.polyline(latlngs, { color: '#ffffff', weight: 9, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }).addTo(map);
        line = window.L.polyline(latlngs, { color: '#1a73e8', weight: 5, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }).addTo(map);
      };
      if (pts.length > 1) {
        drawRoute(pts); // instant straight fallback
        const coords = stops.map(s => s.lng + ',' + s.lat).join(';');
        fetch('https://router.project-osrm.org/route/v1/driving/' + coords + '?overview=full&geometries=geojson')
          .then(r => (r.ok ? r.json() : null))
          .then(j => {
            const g = j && j.routes && j.routes[0] && j.routes[0].geometry;
            if (g && g.coordinates && g.coordinates.length) drawRoute(g.coordinates.map(c => [c[1], c[0]]));
          })
          .catch(() => {});
        map.fitBounds(pts, { padding: [40, 40] });
      } else {
        map.setView(pts[0], 12);
      }
      setTimeout(() => map.invalidateSize(), 120);
      return () => { try { map.remove(); } catch (e) {} };
    }, []);
    return <div className="ms-ld-map" ref={ref} />;
  }

  /* ---- Main listing-detail modal ---- */
  function MS_ListingDetail(L) {
    const lang = L.lang || 'en'; const tx = T(lang); const loc = locale(lang);
    // De-duplicate the photo set (same URL never shown twice).
    const images = (L.images || []).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    const [lightbox, setLightbox] = useState(null);
    const [showAllAmen, setShowAllAmen] = useState(false);
    const [descOpen, setDescOpen] = useState(false);
    const [sel, setSel] = useState({ in: null, out: null });
    const [guests, setGuests] = useState(2);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
    const [sent, setSent] = useState(false);
    const bookRef = useRef(null);

    useEffect(() => {
      const k = e => { if (e.key === 'Escape' && lightbox == null) L.onClose(); };
      document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
      return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
    }, [lightbox]);
    useEffect(() => { try { const w = JSON.parse(localStorage.getItem('ms_wishlist') || '[]'); setSaved(w.includes(L.id)); } catch {} }, []);
    useEffect(() => { try { const p = JSON.parse(localStorage.getItem('ms_profile_data') || '{}'); setForm(f => ({ name: p.name || '', email: p.email || '', phone: p.phone || '' })); } catch {} }, []);

    const share = async () => {
      const url = location.origin + location.pathname + '#' + (L.id || '');
      try { if (navigator.share) await navigator.share({ title: L.title, url }); else { await navigator.clipboard.writeText(url); } } catch {}
    };
    const toggleSave = () => {
      try { let w = JSON.parse(localStorage.getItem('ms_wishlist') || '[]'); if (w.includes(L.id)) w = w.filter(x => x !== L.id); else w.push(L.id); localStorage.setItem('ms_wishlist', JSON.stringify(w)); setSaved(w.includes(L.id)); } catch {}
    };

    const amenities = L.amenities || [];
    const amenShown = showAllAmen ? amenities : amenities.slice(0, 8);
    const desc = L.description || '';
    const longDesc = desc.length > 320;

    const reserve = () => {
      if (L.reserveForm) {
        if (!form.name.trim() || !form.email.trim()) { bookRef.current && bookRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        L.onReserve && L.onReserve({ sel, guests, ...form });
        setSent(true);
      } else {
        L.onReserve && L.onReserve({ sel, guests });
      }
    };

    const bookingCard = (
      <div className="ms-ld-book" ref={bookRef}>
        {L.banner && <div className="ms-ld-book-pill">{L.banner}</div>}
        <div className="ms-ld-book-price">
          <span className="ms-ld-book-amt">{L.price && L.price.from}</span>
          {L.price && L.price.per && <span className="ms-ld-book-per">{L.price.per}</span>}
        </div>
        {sent ? (
          <div className="ms-ld-book-sent">
            <div className="ms-ld-book-sent-ic">✓</div>
            <strong>{tx('Request sent', 'Forespørsel sendt', 'Demande envoyée')}</strong>
            <span>{tx('We’ll reply by email shortly.', 'Vi svarer på e-post snart.', 'Nous répondrons par e-mail sous peu.')}</span>
          </div>
        ) : (
          <>
            <div className="ms-ld-book-fields">
              <div className="ms-ld-book-dates">
                <div className="ms-ld-book-cell"><span>{tx('Check-in', 'Innsjekk', 'Arrivée')}</span><b>{sel.in ? fmtDate(sel.in, loc) : tx('Add date', 'Legg til dato', 'Ajouter une date')}</b></div>
                <div className="ms-ld-book-cell"><span>{tx('Check-out', 'Utsjekk', 'Départ')}</span><b>{sel.out ? fmtDate(sel.out, loc) : tx('Add date', 'Legg til dato', 'Ajouter une date')}</b></div>
              </div>
              <div className="ms-ld-book-guests">
                <span>{tx('Guests', 'Gjester', 'Voyageurs')}</span>
                <select value={guests} onChange={e => setGuests(+e.target.value)}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} {n === 1 ? tx('guest', 'gjest', 'voyageur') : tx('guests', 'gjester', 'voyageurs')}</option>)}
                </select>
              </div>
              {L.reserveForm && (
                <div className="ms-ld-book-contact">
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={tx('Full name', 'Fullt navn', 'Nom complet')} autoComplete="name" />
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={tx('Email', 'E-post', 'E-mail')} type="email" autoComplete="email" />
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={tx('Phone (optional)', 'Telefon (valgfritt)', 'Téléphone (optionnel)')} autoComplete="tel" />
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={tx('Anything we should know? (optional)', 'Noe vi bør vite? (valgfritt)', 'Quelque chose à signaler ? (optionnel)')} rows="2" />
                </div>
              )}
            </div>
            <button className="ms-ld-book-cta" type="button" onClick={reserve}>{L.reserveLabel || tx('Reserve', 'Reserver', 'Réserver')}</button>
            <div className="ms-ld-book-note">{tx("You won’t be charged yet", 'Du belastes ikke ennå', 'Vous ne serez pas débité')}</div>
            {L.onTweak && <button className="ms-ld-book-2nd" type="button" onClick={L.onTweak}>{L.tweakLabel || tx('Customise this trip', 'Tilpass denne reisen', 'Personnaliser')}</button>}
          </>
        )}
      </div>
    );

    return (
      <div className="ms-ld-backdrop" onClick={L.onClose}>
        <div className="ms-ld-card" onClick={e => e.stopPropagation()}>
          {/* sticky top bar */}
          <div className="ms-ld-topbar">
            <button className="ms-ld-close" type="button" onClick={L.onClose} aria-label="Close">✕</button>
            <div className="ms-ld-actions">
              <button className="ms-ld-iconbtn" type="button" onClick={share}><span aria-hidden="true">↗</span> {tx('Share', 'Del', 'Partager')}</button>
              <button className={'ms-ld-iconbtn' + (saved ? ' on' : '')} type="button" onClick={toggleSave}><span aria-hidden="true">{saved ? '♥' : '♡'}</span> {tx('Save', 'Lagre', 'Enregistrer')}</button>
            </div>
          </div>

          <div className="ms-ld-scroll">
            <h1 className="ms-ld-title">{L.title}</h1>
            <Mosaic images={images} alt={L.title} tx={tx} onShowAll={(i) => setLightbox(i)} />
            <MobileCarousel images={images} alt={L.title} />

            <div className="ms-ld-grid">
              <div className="ms-ld-main">
                {/* header block */}
                <div className="ms-ld-headblock">
                  {L.subtitle && <h2 className="ms-ld-h2">{L.subtitle}</h2>}
                  {L.metaDots && L.metaDots.length > 0 && <div className="ms-ld-dots">{L.metaDots.map((m, i) => <span key={i}>{m}</span>)}</div>}
                </div>

                {/* trust / highlight badge card */}
                {L.trust && (
                  <div className="ms-ld-badgecard">
                    <div className="ms-ld-badgecard-ico" aria-hidden="true">✦</div>
                    <div>
                      {L.badge && <div className="ms-ld-badgecard-label">{L.badge}</div>}
                      <div className="ms-ld-badgecard-sub">{L.trust}</div>
                    </div>
                  </div>
                )}

                {/* listing highlights */}
                {L.highlights && L.highlights.length > 0 && (
                  <div className="ms-ld-sec ms-ld-divtop">
                    {L.highlightsTitle && <h3 className="ms-ld-h3">{L.highlightsTitle}</h3>}
                    <div className="ms-ld-hl-list">
                      {L.highlights.map((h, i) => (<div key={i} className="ms-ld-hl"><span className="ms-ld-hl-ico" aria-hidden="true">›</span><span>{h}</span></div>))}
                    </div>
                  </div>
                )}

                {/* description */}
                {desc && (
                  <div className="ms-ld-sec ms-ld-divtop">
                    <p className={'ms-ld-desc' + (longDesc && !descOpen ? ' clamp' : '')}>{desc}</p>
                    {longDesc && <button className="ms-ld-link" type="button" onClick={() => setDescOpen(o => !o)}>{descOpen ? tx('Show less', 'Vis mindre', 'Réduire') : tx('Show more', 'Vis mer', 'Voir plus')} ›</button>}
                  </div>
                )}

                {/* amenities / what's included */}
                {amenities.length > 0 && (
                  <div className="ms-ld-sec ms-ld-divtop">
                    <h3 className="ms-ld-h3">{L.amenitiesTitle || tx("What’s included", 'Dette er inkludert', 'Ce qui est inclus')}</h3>
                    <div className="ms-ld-amen-grid">
                      {amenShown.map((a, i) => (<div key={i} className="ms-ld-amen"><span className="ms-ld-amen-ico" aria-hidden="true">✓</span><span>{a}</span></div>))}
                    </div>
                    {amenities.length > 8 && (
                      <button className="ms-ld-outline" type="button" onClick={() => setShowAllAmen(o => !o)}>
                        {showAllAmen ? tx('Show less', 'Vis mindre', 'Réduire') : tx('Show all ' + amenities.length, 'Vis alle ' + amenities.length, 'Tout afficher (' + amenities.length + ')')}
                      </button>
                    )}
                    {L.excluded && L.excluded.length > 0 && (
                      <div className="ms-ld-notinc">
                        <div className="ms-ld-notinc-h">{tx('Not included', 'Ikke inkludert', 'Non inclus')}</div>
                        <div className="ms-ld-amen-grid">
                          {L.excluded.map((x, i) => (<div key={i} className="ms-ld-amen ms-ld-amen-no"><span className="ms-ld-amen-ico" aria-hidden="true">—</span><span>{x}</span></div>))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* passes & offers (camps) */}
                {L.passes && (L.passes.day || L.passes.evening || L.passes.spa) && (
                  <div className="ms-ld-sec ms-ld-divtop">
                    <h3 className="ms-ld-h3">{tx('Passes & offers', 'Pass & tilbud', 'Pass & offres')}</h3>
                    <div className="ms-ld-passes">
                      {L.passes.day && (
                        <div className="ms-ld-pass">
                          <span className="ms-ld-pass-tag">☀️ {tx('Day pass', 'Dagpass', 'Pass journée')}</span>
                          <span className="ms-ld-pass-txt">{L.passes.day}</span>
                        </div>
                      )}
                      {L.passes.evening && (
                        <div className="ms-ld-pass">
                          <span className="ms-ld-pass-tag">🌙 {tx('Evening pass', 'Kveldspass', 'Pass soirée')}</span>
                          <span className="ms-ld-pass-txt">{L.passes.evening}</span>
                        </div>
                      )}
                      {L.passes.spa && (
                        <div className="ms-ld-pass">
                          <span className="ms-ld-pass-tag">💆 {tx('Spa & wellness', 'Spa & velvære', 'Spa & bien-être')}</span>
                          <span className="ms-ld-pass-txt">{L.passes.spa}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* rooms & tents (camps) */}
                {L.rooms && L.rooms.length > 0 && (
                  <div className="ms-ld-sec ms-ld-divtop">
                    <h3 className="ms-ld-h3">{tx('Rooms & tents', 'Rom & telt', 'Chambres & tentes')} <span className="ms-ld-rooms-n">({L.rooms.length})</span></h3>
                    <div className="ms-ld-rooms">
                      {L.rooms.map((r, i) => (
                        <div key={i} className="ms-ld-room">
                          {r.img && (
                            <button type="button" className="ms-ld-room-img" style={{ backgroundImage: `url(${r.img})` }} aria-label={r.name}
                              onClick={() => { const k = images.indexOf(r.img); if (k >= 0) setLightbox(k); }} />
                          )}
                          <div className="ms-ld-room-info">
                            <div className="ms-ld-room-name">{r.name}</div>
                            {r.desc && <div className="ms-ld-room-desc">{r.desc}</div>}
                            {r.price && <div className="ms-ld-room-price">{r.price}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="ms-ld-rooms-note">{tx('Room rates are indicative and vary by season — we confirm the exact price for your dates.', 'Romprisene er veiledende og varierer med sesong — vi bekrefter nøyaktig pris for dine datoer.', 'Tarifs indicatifs selon la saison — nous confirmons le prix exact pour vos dates.')}</div>
                  </div>
                )}

                {/* day by day (trips) */}
                {L.timeline && L.timeline.length > 0 && (
                  <div className="ms-ld-sec ms-ld-divtop">
                    <h3 className="ms-ld-h3">{tx('Day by day', 'Dag for dag', 'Jour par jour')}</h3>
                    <ol className="itin-timeline-list ms-ld-timeline">
                      {L.timeline.map((d, i) => (
                        <li key={i} className="itin-timeline-item">
                          <div className="itin-timeline-marker"><span className="itin-tl-badge" aria-hidden="true">{d.day}</span></div>
                          <div className="itin-timeline-card">
                            <div className="itin-timeline-route">{d.route}</div>
                            <div className="itin-tl-rows">{d.rows.map((r, ri) => (<div key={ri} className="itin-tl-row"><span className={'itin-tl-time' + (r.t ? '' : ' itin-tl-time-none')}>{r.t || '•'}</span><span className="itin-tl-act">{r.a}</span></div>))}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* related experiences — catalogue items mentioned in this trip */}
                {L.related && L.related.length > 0 && (
                  <div className="ms-ld-sec ms-ld-divtop">
                    <h3 className="ms-ld-h3">{tx('Experiences in this trip', 'Opplevelser i denne reisen', 'Expériences de ce voyage')}</h3>
                    <div className="ms-ld-avail-sub">{tx('Tap an experience to see its photos, details & prices from our catalogue.', 'Trykk på en opplevelse for bilder, detaljer og priser fra katalogen.', 'Touchez une expérience pour voir ses photos, détails & prix dans notre catalogue.')}</div>
                    <div className="ms-ld-related">
                      {L.related.map((r, i) => (
                        <button key={i} type="button" className="ms-ld-htag"
                          onClick={() => { L.onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('ms:open-catalog', { detail: { tab: r.tab, name: r.name } })), 90); }}>
                          <span className="ms-ld-htag-hash" aria-hidden="true">#</span>{r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* availability calendar */}
                <div className="ms-ld-sec ms-ld-divtop">
                  <h3 className="ms-ld-h3">{tx('Availability', 'Tilgjengelighet', 'Disponibilités')}</h3>
                  <div className="ms-ld-avail-sub">{sel.in && sel.out ? fmtDate(sel.in, loc) + ' – ' + fmtDate(sel.out, loc) : tx('Choose your dates — we tailor every departure', 'Velg dine datoer — vi skreddersyr hver avreise', 'Choisissez vos dates — chaque départ est sur mesure')}</div>
                  <Calendar lang={lang} sel={sel} setSel={setSel} />
                </div>

                {/* map — itinerary stops on OpenStreetMap. Hidden entirely if it can't render. */}
                {(() => {
                  let stops;
                  if (L.mapRoute) {
                    stops = resolveStops(L.mapRoute);                       // trip route → ordered pins
                  } else if (L.mapPlace || L.mapName) {
                    // single venue: try its area, then its name, else default to Marrakech
                    stops = resolveStops(L.mapPlace, true);
                    if (!stops.length && L.mapName) stops = resolveStops(L.mapName, true);
                    if (!stops.length) stops = [{ ...MARRAKECH }];
                  } else {
                    stops = [];
                  }
                  if (!window.L || stops.length === 0) return null;
                  return (
                    <div className="ms-ld-sec ms-ld-divtop">
                      <h3 className="ms-ld-h3">{stops.length > 1 ? tx('Your route', 'Din rute', 'Votre itinéraire') : tx('Where you’ll be', 'Hvor du skal', 'Où vous serez')}</h3>
                      {L.locationLabel && <div className="ms-ld-avail-sub">{L.locationLabel}</div>}
                      <StopMap stops={stops} />
                      {stops.length > 1 && (
                        <div className="ms-ld-maplegend">{stops.map((s, i) => <span key={i} className="ms-ld-maplegend-item"><b>{i + 1}</b> {s.name}</span>)}</div>
                      )}
                    </div>
                  );
                })()}

                {/* things to know */}
                {L.thingsToKnow && (
                  <div className="ms-ld-sec ms-ld-divtop">
                    <h3 className="ms-ld-h3">{tx('Things to know', 'Verdt å vite', 'Bon à savoir')}</h3>
                    <div className="ms-ld-ttk">
                      {['cancellation', 'rules', 'safety'].map(k => L.thingsToKnow[k] && (
                        <div key={k} className="ms-ld-ttk-col">
                          <div className="ms-ld-ttk-h">{L.thingsToKnow[k].title}</div>
                          <ul>{L.thingsToKnow[k].items.map((it, i) => <li key={i}>{it}</li>)}</ul>
                          {L.thingsToKnow[k].more && <button className="ms-ld-link" type="button" onClick={L.thingsToKnow[k].more}>{tx('Learn more', 'Les mer', 'En savoir plus')} ›</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* breadcrumb */}
                {L.breadcrumb && <div className="ms-ld-crumb">{L.breadcrumb.join('  ›  ')}</div>}
              </div>

              {/* sticky booking card */}
              <aside className="ms-ld-aside">
                <div className="ms-ld-aside-sticky">
                  {bookingCard}
                  <button className="ms-ld-report" type="button" onClick={() => { window.open('https://wa.me/4745774743', '_blank', 'noopener'); }}>
                    <span aria-hidden="true">⚑</span> {tx('Report this listing', 'Rapporter denne oppføringen', 'Signaler cette annonce')}
                  </button>
                </div>
              </aside>
            </div>
          </div>

          {/* mobile fixed bottom bar */}
          <div className="ms-ld-mbar">
            <div className="ms-ld-mbar-price"><b>{L.price && L.price.from}</b> {L.price && L.price.per && <span>{L.price.per}</span>}</div>
            <button className="ms-ld-mbar-cta" type="button" onClick={() => { if (L.reserveForm) bookRef.current && bookRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); else reserve(); }}>
              {L.reserveLabel || tx('Reserve', 'Reserver', 'Réserver')}
            </button>
          </div>

          {lightbox != null && <Lightbox images={images} alt={L.title} start={lightbox} onClose={() => setLightbox(null)} />}
        </div>
      </div>
    );
  }

  window.MS_ListingDetail = MS_ListingDetail;
})();
