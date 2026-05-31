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
  const { useT, useMS } = window.MS_CTX;
  const t = useT();
  const { lang } = useMS();
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : en;
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
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 22, color: '#fff', margin: '0 0 4px' }}>
                    {tx('Thank you for your trust.', 'Takk for tilliten.', 'Merci de votre confiance.', 'Tack för ditt förtroende.')}
                  </h3>
                </div>

                <div className="pkg-terms-block">
                  <h4>{tx('BOOKING RULES', 'BESTILLINGSREGLER', 'RÈGLES DE RÉSERVATION', 'BOKNINGSREGLER')}</h4>
                  <ul className="terms-list">
                    <li><Ip.Check s={13} /> {tx('All bookings must be made in advance.', 'Alle bestillinger må gjøres på forhånd.', 'Toutes les réservations doivent être effectuées à l\'avance.', 'Alla bokningar måste göras i förväg.')}</li>
                    <li><Ip.Check s={13} /> {tx('Changes depend on availability.', 'Endringer avhenger av tilgjengelighet.', 'Les modifications dépendent des disponibilités.', 'Ändringar beror på tillgänglighet.')}</li>
                    <li><Ip.Check s={13} /> {tx('Cancellations must be made within the timeframes below.', 'Avbestillinger må gjøres innen tidsrammene nedenfor.', 'Les annulations doivent être effectuées dans les délais indiqués ci-dessous.', 'Avbokningar måste göras inom tidsgränserna nedan.')}</li>
                  </ul>
                  <div className="terms-contact">
                    <a href="mailto:Marrakechstory@outlook.com">Marrakechstory@outlook.com</a>
                    <a href="https://www.marrakechstory.com" target="_blank" rel="noopener">www.marrakechstory.com</a>
                    <span>+212 6 943 45 354</span>
                    <span>+47 457 74 743</span>
                  </div>
                </div>

                <div className="pkg-terms-block">
                  <h4>{tx('PAYMENT POLICY', 'BETALINGSPOLICY', 'POLITIQUE DE PAIEMENT', 'BETALNINGSPOLICY')}</h4>
                  <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, margin: '0 0 10px' }}>
                    {tx('You can choose to pay:', 'Du kan velge å betale:', 'Vous pouvez choisir de payer :', 'Du kan välja att betala:')}
                  </p>
                  <ul className="terms-list">
                    <li><Ip.Check s={13} /> {tx('20% online: PayPal, Revolut, Wise, Vipps, Norwegian bank transfer.', '20% på nett: PayPal, Revolut, Wise, Vipps, Norsk bankoverføring.', '20 % en ligne : PayPal, Revolut, Wise, Vipps, virement bancaire norvégien.', '20% online: PayPal, Revolut, Wise, Vipps, norskt banköverföring.')}</li>
                    <li><Ip.Check s={13} /> {tx('80% cash on arrival to the driver.', '80% kontant ved ankomst til sjåføren.', '80 % en espèces à l\'arrivée au chauffeur.', '80% kontant vid ankomst till chauffören.')}</li>
                    <li><Ip.Check s={13} /> {tx('Or the full amount online.', 'Eller hele beløpet på nett.', 'Ou la totalité en ligne.', 'Eller hela beloppet online.')}</li>
                  </ul>
                </div>

                <div className="pkg-terms-block">
                  <h4>{tx('CANCELLATION & REFUND POLICY', 'AVBESTILLINGS OG REFUSJONSPOLITIKK', 'POLITIQUE D\'ANNULATION ET DE REMBOURSEMENT', 'AVBOKNINGS- OCH ÅTERBETALNINGSPOLICY')}</h4>
                  <div className="terms-table">
                    <div className="terms-row head">
                      <span>{tx('Time before experience', 'Tid før opplevelsen', 'Délai avant l\'expérience', 'Tid före upplevelsen')}</span>
                      <span>{tx('Refund', 'Refusjon', 'Remboursement', 'Återbetalning')}</span>
                    </div>
                    {[
                      {
                        notice: tx('Up to 96 hours', 'Inntil 96 timer', 'Jusqu\'à 96 heures', 'Upp till 96 timmar'),
                        fee: tx('100% refund', '100% refusjon', '100 % remboursé', '100% återbetalning'),
                        ok: true,
                      },
                      {
                        notice: tx('24–48 hours', '24–48 timer', '24–48 heures', '24–48 timmar'),
                        fee: tx('50% refund', '50% refusjon', '50 % remboursé', '50% återbetalning'),
                        ok: true,
                      },
                      {
                        notice: tx('Under 24 hours', 'Under 24 timer', 'Moins de 24 heures', 'Under 24 timmar'),
                        fee: tx('Non-refundable', 'Refunderes ikke', 'Non remboursable', 'Ej återbetalningsbar'),
                        ok: false,
                      },
                      {
                        notice: tx('No-show', 'Ikke-oppmøte', 'Non-présentation', 'Uteblivande'),
                        fee: tx('Non-refundable', 'Refunderes ikke', 'Non remboursable', 'Ej återbetalningsbar'),
                        ok: false,
                      },
                    ].map(r => (
                      <div key={r.notice} className="terms-row">
                        <span>{r.notice}</span>
                        <span className={!r.ok ? 'bad' : 'good'}>{r.fee}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, marginTop: 10 }}>
                    {tx(
                      'Weather-dependent activities (e.g. hot-air balloon): Rescheduling or full refund if cancelled for safety reasons.',
                      'Væravhengige aktiviteter (f.eks. varmluftsballong): Omplanlegging eller full refusjon ved avbestilling av sikkerhetsmessige årsaker.',
                      'Activités dépendant de la météo (ex. montgolfière) : Reprogrammation ou remboursement intégral en cas d\'annulation pour raisons de sécurité.',
                      'Väderberoende aktiviteter (t.ex. luftballong): Ombokning eller full återbetalning vid avbokning av säkerhetsskäl.'
                    )}
                  </p>
                </div>

                <div className="pkg-terms-block">
                  <h4>{tx('IMPORTANT NOTES', 'VIKTIGE MERKNADER', 'REMARQUES IMPORTANTES', 'VIKTIGA ANMÄRKNINGAR')}</h4>
                  <ul className="terms-list">
                    <li><Ip.Check s={13} /> {tx('Be on time for pick-up.', 'Vær presis til henting.', 'Soyez à l\'heure pour le ramassage.', 'Var i tid för upphämtning.')}</li>
                    <li><Ip.Check s={13} /> {tx('Ensure you have WhatsApp and internet access for communication during your stay.', 'Sørg for at du har WhatsApp og internett for kommunikasjon under oppholdet.', 'Assurez-vous d\'avoir WhatsApp et une connexion internet pour communiquer pendant votre séjour.', 'Se till att du har WhatsApp och internetåtkomst för kommunikation under vistelsen.')}</li>
                    <li><Ip.Check s={13} /> {tx('Inform us in advance of any dietary restrictions or physical limitations.', 'Informer oss på forhånd om kostholdsrestriksjoner eller fysiske begrensninger.', 'Informez-nous à l\'avance de toute restriction alimentaire ou limitation physique.', 'Informera oss i förväg om eventuella kostbegränsningar eller fysiska begränsningar.')}</li>
                    <li><Ip.Check s={13} /> {tx('Wear comfortable clothing and appropriate footwear for excursions.', 'Bruk komfortable klær og passende fottøy til utflukter.', 'Portez des vêtements confortables et des chaussures adaptées pour les excursions.', 'Bär bekväma kläder och lämpligt skodon för utflykter.')}</li>
                    <li><Ip.Check s={13} /> {tx('Marrakechstory is not responsible for lost personal belongings during activities.', 'Marrakechstory er ikke ansvarlig for tapte personlige eiendeler under aktiviteter.', 'Marrakechstory n\'est pas responsable des effets personnels perdus pendant les activités.', 'Marrakechstory ansvarar inte för förlorade personliga tillhörigheter under aktiviteter.')}</li>
                  </ul>
                </div>

                <div className="pkg-terms-note">
                  <Ip.Pin s={14} />
                  <span>
                    {tx(
                      'Marrakechstory operates under Moroccan tourism law (Loi n° 31-96) and is licensed by ONMT (licence #14872).',
                      'Marrakechstory opererer under marokkansk reiselivslovgivning (Loi n° 31-96) og er lisensiert av ONMT (lisens #14872).',
                      'Marrakechstory opère conformément à la loi marocaine sur le tourisme (Loi n° 31-96) et est agréé par l\'ONMT (licence n° 14872).',
                      'Marrakechstory verkar under marockansk turismlagstiftning (Loi n° 31-96) och är licensierat av ONMT (licens #14872).'
                    )}
                  </span>
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
