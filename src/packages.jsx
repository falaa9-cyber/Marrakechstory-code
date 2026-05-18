// ============================================
// Trip packages — most booked trips
// ============================================
const { useState: useStateP } = React;
const Ip = window.MS_I;

// Morocco map SVG overlay — simplified Morocco silhouette with route cities
// SVG 200×160: x=(lon+13)/12*200, y=(36-lat)/9*160
const MAP_CITIES = {
  mkch:       { label: 'Marrakech',  x: 83,  y: 78 },
  agafay:     { label: 'Agafay',     x: 76,  y: 87 },
  atlas:      { label: 'Atlas',      x: 98,  y: 92 },
  essaouira:  { label: 'Essaouira',  x: 53,  y: 80 },
  agadir:     { label: 'Agadir',     x: 57,  y: 100 },
  casablanca: { label: 'Casablanca', x: 90,  y: 43 },
  rabat:      { label: 'Rabat',      x: 103, y: 36 },
  fes:        { label: 'Fès',        x: 133, y: 36 },
  merzouga:   { label: 'Merzouga',   x: 152, y: 87 },
  dades:      { label: 'Dadès',      x: 117, y: 82 },
};
const PKG_ROUTES = {
  '4d3n':   ['mkch', 'agafay'],
  '5d4n':   ['mkch', 'atlas', 'agafay'],
  '7d6n':   ['mkch', 'atlas', 'essaouira', 'agafay'],
  '10d9n':  ['mkch', 'atlas', 'agadir', 'agafay'],
  '14d13n': ['mkch', 'casablanca', 'rabat', 'fes', 'merzouga', 'dades', 'mkch', 'agafay'],
};

function PkgMap({ pkgId }) {
  const route = PKG_ROUTES[pkgId] || [];
  const cities = route.map(k => ({ key: k, ...MAP_CITIES[k] })).filter(Boolean);
  return (
    <div className="pkg-map-overlay" aria-hidden="true">
      <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Simplified Morocco silhouette */}
        <path className="pkg-map-land"
          d="M120,4 L185,23 L183,71 L167,115 L125,133 L1,144 L57,100 L53,80 L75,57 L90,43 L103,36 L108,18 Z" />
        {/* Route polyline */}
        {cities.length > 1 && (
          <polyline className="pkg-map-route"
            points={cities.map(c => `${c.x},${c.y}`).join(' ')} />
        )}
        {/* City dots & labels */}
        {cities.map((city, i) => (
          <g key={city.key + i}>
            <circle cx={city.x} cy={city.y} r={i === 0 ? 4.5 : 3.5}
              className={`pkg-map-dot ${i === 0 ? 'first' : i === cities.length - 1 ? 'last' : ''}`} />
            <text x={city.x} y={city.y - 7} className="pkg-map-label" textAnchor="middle">{city.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Packages() {
  const PKGS = window.MS_DATA.PACKAGES;
  const { useT } = window.MS_CTX;
  const t = useT();
  const [active, setActive] = useStateP(PKGS[1].id);
  const [view, setView] = useStateP('timeline'); // 'timeline' | 'included' | 'terms'
  const isCustom = active === 'custom';
  const pkg = isCustom ? null : PKGS.find(p => p.id === active);

  return (
    <section className="packages section" id="packages">
      <div className="wrap">
        <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 56px' }}>
          <span className="eyebrow">{t('pkg_eyebrow')}</span>
          <h2>{t('pkg_title_a')} <em>{t('pkg_title_b')}</em> {t('pkg_title_c')}</h2>
          <p style={{ margin: '0 auto' }}>{t('pkg_sub')}</p>
        </div>

        <div className="pkg-tabs reveal" style={{ justifyContent: 'center' }}>
          {PKGS.map(p => (
            <button key={p.id} className={`pkg-tab ${active === p.id ? 'active' : ''}`}
              onClick={() => { setActive(p.id); setView('timeline'); }}>
              <span className="num">{p.days}D</span>
              <span>{p.title}</span>
            </button>
          ))}
          <a href="#plan" className={`pkg-tab pkg-tab-custom`}>
            <span className="num">✦</span>
            <span>{t('pkg_custom_label')}</span>
          </a>
        </div>

        {isCustom ? (
          <div className="pkg-custom-cta reveal">
            <div className="pkg-custom-inner">
              <span className="eyebrow" style={{ color: '#ffae7c' }}>{t('pkg_custom_eyebrow')}</span>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 'clamp(28px,4vw,48px)', color: '#fff', margin: '12px 0 16px', letterSpacing: '-0.02em' }}>
                {t('pkg_custom_title_a')} <em style={{ fontStyle: 'italic', color: '#ffae7c' }}>{t('pkg_custom_title_b')}</em>
              </h3>
              <p style={{ color: 'rgba(255,255,255,.75)', maxWidth: 520, margin: '0 0 32px', fontSize: 16 }}>{t('pkg_custom_sub')}</p>
              <a href="#plan" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 28px' }}>
                {t('pkg_custom_cta')} <Ip.Arrow s={16} />
              </a>
            </div>
          </div>
        ) : (
        <div className="pkg-grid">
          <div className="pkg-hero reveal" key={pkg.id}>
            <div className="pkg-hero-img" style={{ backgroundImage: `url(${pkg.img})` }}></div>
            <PkgMap pkgId={pkg.id} />
            <div className="pkg-hero-info">
              <div className="label">{pkg.days} days · {pkg.nights} nights · {pkg.label}</div>
              <h3>{pkg.title}</h3>
              <p style={{ color: 'rgba(255,255,255,.85)', margin: '0 0 10px', fontSize: 14 }}>{pkg.description}</p>
              <div className="pkg-badges">
                {pkg.tags.map(tag => <span key={tag} className="b">{tag}</span>)}
              </div>
              <a href="#plan" className="btn btn-primary" style={{ marginTop: 18 }}>{t('pkg_request')} <Ip.Arrow /></a>
            </div>
          </div>

          <div key={pkg.id + '-tl'}>
            <div className="pkg-view-tabs">
              <button className={`pkg-view-tab ${view === 'timeline' ? 'active' : ''}`} onClick={() => setView('timeline')}>
                <Ip.Cal /> <span>{t('pkg_view_timeline')}</span>
              </button>
              <button className={`pkg-view-tab ${view === 'included' ? 'active' : ''}`} onClick={() => setView('included')}>
                <Ip.Check /> <span>{t('pkg_view_incl')}</span>
              </button>
              <button className={`pkg-view-tab ${view === 'terms' ? 'active' : ''}`} onClick={() => setView('terms')}>
                <Ip.Pin /> <span>{t('pkg_view_terms')}</span>
              </button>
            </div>

            {view === 'timeline' && (
              <div className="timeline">
                {pkg.timeline.map((d, i) => (
                  <div key={i} className={`tl-day ${i === 0 ? 'active' : ''}`}>
                    <div className="tl-marker">{String(d.day).padStart(2, '0')}</div>
                    <div className="tl-content">
                      <div className="tl-day-label">{t('pkg_day')} {d.day} · {d.label}</div>
                      <h4 className="tl-title">{d.title}</h4>
                      <p className="tl-desc">{d.desc}</p>
                      <ul className="tl-items">
                        {d.items.map((it, j) => (
                          <li key={it}>
                            <Ip.Check s={12} />
                            {d.times && d.times[j] && <span className="tl-time">{d.times[j]}</span>}
                            {it}
                          </li>
                        ))}
                      </ul>
                      <div className="tl-meta">
                        <span className="pill"><Ip.Bed /> {d.stay}</span>
                        <span className="pill"><Ip.Utensils /> {d.meals}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'included' && (
              <div className="pkg-incl-grid">
                <div className="pkg-incl-card">
                  <div className="pkg-incl-head">
                    <span className="pkg-incl-icon yes"><Ip.Check s={16} /></span>
                    <h4>{t('pkg_included')}</h4>
                  </div>
                  <ul>
                    {pkg.included.map(it => (
                      <li key={it}><Ip.Check s={14} /> {it}</li>
                    ))}
                  </ul>
                </div>
                <div className="pkg-incl-card not">
                  <div className="pkg-incl-head">
                    <span className="pkg-incl-icon no"><Ip.Minus s={16} /></span>
                    <h4>{t('pkg_not_included')}</h4>
                  </div>
                  <ul>
                    {pkg.notIncluded.map(it => (
                      <li key={it}><Ip.Minus s={14} /> {it}</li>
                    ))}
                  </ul>
                </div>
                <div className="pkg-incl-cta">
                  <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, margin: '0 0 18px' }}>{t('pkg_quote_note')}</p>
                  <a href="#plan" className="btn btn-primary">{t('pkg_book')} <Ip.Arrow s={14} /></a>
                </div>
              </div>
            )}

            {view === 'terms' && (
              <div className="pkg-terms">
                <div className="pkg-terms-header">
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 22, color: '#fff', margin: '0 0 4px' }}>Takk for tilliten.</h3>
                </div>

                <div className="pkg-terms-block">
                  <h4>BESTILLINGSREGLER</h4>
                  <ul className="terms-list">
                    <li><Ip.Check s={13} /> Alle bestillinger må gjøres på forhånd.</li>
                    <li><Ip.Check s={13} /> Endringer avhenger av tilgjengelighet.</li>
                    <li><Ip.Check s={13} /> Avbestillinger må gjøres innen tidsrammene nedenfor.</li>
                  </ul>
                  <div className="terms-contact">
                    <a href="mailto:Marrakechstory@outlook.com">Marrakechstory@outlook.com</a>
                    <a href="https://www.marrakechstory.com" target="_blank" rel="noopener">www.marrakechstory.com</a>
                    <span>+212 6 943 45 354</span>
                    <span>+47 457 74 743</span>
                  </div>
                </div>

                <div className="pkg-terms-block">
                  <h4>BETALINGSPOLICY</h4>
                  <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, margin: '0 0 10px' }}>Du kan velge å betale:</p>
                  <ul className="terms-list">
                    <li><Ip.Check s={13} /> 20% på nett: PayPal, Revolut, Wise, Vipps, Norsk bankoverføring.</li>
                    <li><Ip.Check s={13} /> 80% kontant ved ankomst til sjåføren.</li>
                    <li><Ip.Check s={13} /> Eller hele beløpet på nett.</li>
                  </ul>
                </div>

                <div className="pkg-terms-block">
                  <h4>AVBESTILLINGS OG REFUSJONSPOLITIKK</h4>
                  <div className="terms-table">
                    <div className="terms-row head">
                      <span>Tid før opplevelsen</span>
                      <span>Refusjon</span>
                    </div>
                    {[
                      { notice: 'Inntil 96 timer', fee: '100% refusjon', ok: true },
                      { notice: '24–48 timer', fee: '50% refusjon', ok: true },
                      { notice: 'Under 24 timer', fee: 'Refunderes ikke', ok: false },
                      { notice: 'Ikke-oppmøte', fee: 'Refunderes ikke', ok: false },
                    ].map(r => (
                      <div key={r.notice} className="terms-row">
                        <span>{r.notice}</span>
                        <span className={!r.ok ? 'bad' : 'good'}>{r.fee}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, marginTop: 10 }}>
                    Væravhengige aktiviteter (f.eks. varmluftsballong): Omplanlegging eller full refusjon ved avbestilling av sikkerhetsmessige årsaker.
                  </p>
                </div>

                <div className="pkg-terms-block">
                  <h4>VIKTIGE MERKNADER</h4>
                  <ul className="terms-list">
                    <li><Ip.Check s={13} /> Vær presis til henting.</li>
                    <li><Ip.Check s={13} /> Sørg for at du har WhatsApp og internett for kommunikasjon under oppholdet.</li>
                    <li><Ip.Check s={13} /> Informer oss på forhånd om kostholdsrestriksjoner eller fysiske begrensninger.</li>
                    <li><Ip.Check s={13} /> Bruk komfortable klær og passende fottøy til utflukter.</li>
                    <li><Ip.Check s={13} /> Marrakechstory er ikke ansvarlig for tapte personlige eiendeler under aktiviteter.</li>
                  </ul>
                </div>

                <div className="pkg-terms-note">
                  <Ip.Pin s={14} />
                  <span>Marrakechstory opererer under marokkansk reiselivslovgivning (Loi n° 31-96) og er lisensiert av ONMT (lisens #14872).</span>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}

window.MS_Packages = Packages;
