// ============================================
// Hero — refined, centered, exclusive
// Flight search bar embedded directly under stats
// ============================================
const { useState, useEffect } = React;
const I = window.MS_I;

function Hero() {
  const { useT, useMS } = window.MS_CTX;
  const t = useT();
  const ctx = useMS();

  const heroImg = "assets/hero-sahara.jpg";

  return (
    <section className="hero-v2" id="home">
      <div className="hero-v2-bg">
        <div className="hero-v2-img active"
          style={{ backgroundImage: `url(${heroImg})` }} />
        <div className="hero-v2-tint"></div>
        <div className="hero-v2-grain"></div>
      </div>

      <div className="hero-v2-sun"></div>

      <svg className="hero-v2-ornament left" viewBox="0 0 120 200" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1">
        <path d="M0,200 L0,80 Q0,0 60,0 Q120,0 120,80 L120,200" />
        <path d="M20,200 L20,90 Q20,20 60,20 Q100,20 100,90 L100,200" />
      </svg>
      <svg className="hero-v2-ornament right" viewBox="0 0 120 200" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1">
        <path d="M0,200 L0,80 Q0,0 60,0 Q120,0 120,80 L120,200" />
        <path d="M20,200 L20,90 Q20,20 60,20 Q100,20 100,90 L100,200" />
      </svg>

      <div className="wrap hero-v2-content">
        <div className="hero-v2-eyebrow">
          <span className="dot"></span>
          {t('hero_eyebrow')}
        </div>
        <p className="hero-v2-hello">{t('hero_hello')}</p>
        <h1 className="hero-v2-brand">
          <span>Marrakech</span>
          <em>Story.</em>
        </h1>
        <p className="hero-v2-sub">{t('hero_sub')}</p>

        <div className="hero-v2-cta">
          <a href="#packages" className="btn btn-primary">
            {t('hero_cta_trips')} <I.Arrow s={14} />
          </a>
          <a href="#plan" className="btn btn-ghost">{t('hero_cta_plan')}</a>
        </div>

        <div className="hero-v2-stats">
          <div><span className="num">14</span><span className="lbl">{t('stat_years')}</span></div>
          <span className="sep"></span>
          <div><span className="num">2,400+</span><span className="lbl">{t('stat_travellers')}</span></div>
          <span className="sep"></span>
          <div><span className="num">4.94★</span><span className="lbl">{t('stat_review')}</span></div>
          <span className="sep"></span>
          <div><span className="num">24/7</span><span className="lbl">{t('stat_concierge')}</span></div>
        </div>

        {/* FlightHelpBox removed — ticket booking system disabled */}
      </div>

      <a href="#packages" className="hero-v2-scroll" aria-label="Scroll">
        <span></span>
      </a>
    </section>
  );
}

const NORWAY_CITIES = ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø', 'Kristiansand', 'Fredrikstad', 'Drammen', 'Ålesund', 'Bodø'];

function FlightHelpBox() {
  const { useMS, COMPANY } = window.MS_CTX;
  const ctx = useMS();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [fromCity, setFromCity] = useState('Oslo');
  const [toCity, setToCity] = useState('Oslo');
  const [dep, setDep] = useState(ctx.dates?.dep || '');
  const [ret, setRet] = useState(ctx.dates?.ret || '');
  const [people, setPeople] = useState(ctx.travellers?.adults || 2);

  const label = ctx.lang === 'no' ? 'Trenger du hjelp med fly?'
              : ctx.lang === 'fr' ? "Besoin d'aide pour le vol ?"
              : 'Need help with flights?';

  const syncContext = (d, r, p) => {
    ctx.setDates({ dep: d, ret: r });
    ctx.setTravellers({ adults: p, children: 0, infants: 0 });
    window.MS_Flight_Data = { dep: d, ret: r, people: p, fromCity, toCity };
  };

  const send = () => {
    syncContext(dep, ret, people);
    const subj = encodeURIComponent(`Flyforslag – ${fromCity} → Marrakech`);
    const body = encodeURIComponent(
      `Hei Marrakech Story,\n\nJeg trenger hjelp med fly:\n\n` +
      `✈  Utreise: ${fromCity} → Marrakech (RAK)   ${dep}\n` +
      `✈  Hjemreise: Marrakech (RAK) → ${toCity}   ${ret}\n` +
      `👥  Antall reisende: ${people} person${people > 1 ? 'er' : ''}\n\n` +
      `Send meg gjerne de beste alternativene!\n`
    );
    window.location.href = `mailto:${COMPANY.email}?subject=${subj}&body=${body}`;
    setSent(true);
  };

  if (!open) {
    return (
      <div className="hero-flight-cta-wrap">
        <button className="hero-flight-toggle" onClick={() => setOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
          {label}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="hero-flight-cta-wrap expanded">
      <div className="flight-help-box">
        <div className="flight-help-head">
          <div>
            <div className="flight-help-title">{label}</div>
            <div className="flight-help-sub">
              {ctx.lang === 'no'
                ? 'Fyll inn reisedetaljer – vi finner de beste avgangene og kobler dem til planen din.'
                : ctx.lang === 'fr'
                ? 'Remplissez vos infos – nous trouvons les meilleures options de vol.'
                : 'Fill in your details – we\'ll find the best flights and link them to your itinerary.'}
            </div>
          </div>
          <button className="flight-help-close" onClick={() => setOpen(false)} aria-label="Lukk">✕</button>
        </div>
        {!sent ? (<>
          <div className="flight-help-route">
            <div className="flight-help-fld">
              <label>{ctx.lang === 'no' ? '✈ Fra by (Norge)' : '✈ From city (Norway)'}</label>
              <input list="fhb-cities-from" value={fromCity} onChange={e => setFromCity(e.target.value)} placeholder="Oslo" />
              <datalist id="fhb-cities-from">{NORWAY_CITIES.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="flight-help-arrow-badge">→ RAK →</div>
            <div className="flight-help-fld">
              <label>{ctx.lang === 'no' ? '✈ Retur til (Norge)' : '✈ Return to (Norway)'}</label>
              <input list="fhb-cities-to" value={toCity} onChange={e => setToCity(e.target.value)} placeholder="Oslo" />
              <datalist id="fhb-cities-to">{NORWAY_CITIES.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
          <div className="flight-help-fields">
            <div className="flight-help-fld">
              <label>{ctx.lang === 'no' ? 'Avreisedato' : 'Departure date'}</label>
              <input type="date" value={dep} onChange={e => { setDep(e.target.value); ctx.setDates({ dep: e.target.value, ret }); }} />
            </div>
            <div className="flight-help-fld">
              <label>{ctx.lang === 'no' ? 'Hjemreisedato' : 'Return date'}</label>
              <input type="date" value={ret} onChange={e => { setRet(e.target.value); ctx.setDates({ dep, ret: e.target.value }); }} />
            </div>
            <div className="flight-help-fld narrow">
              <label>{ctx.lang === 'no' ? 'Antall reisende' : 'Travellers'}</label>
              <div className="flight-pax">
                <button type="button" onClick={() => { const p = Math.max(1, people - 1); setPeople(p); syncContext(dep, ret, p); }}>−</button>
                <span>{people}</span>
                <button type="button" onClick={() => { const p = people + 1; setPeople(p); syncContext(dep, ret, p); }}>+</button>
              </div>
            </div>
            <button className="flight-help-btn" onClick={send}>
              <I.Mail s={15} />
              {ctx.lang === 'no' ? 'Send forespørsel' : ctx.lang === 'fr' ? 'Envoyer' : 'Send request'}
            </button>
          </div>
        </>) : (
          <div className="flight-help-sent">
            <I.Check s={20} />
            {ctx.lang === 'no'
              ? 'Takk! Vi sender deg flygingsforslag snart. Datoene er koblet til planen din.'
              : 'Thanks! We\'ll send flight options shortly. Dates saved to your itinerary.'}
          </div>
        )}
      </div>
    </div>
  );
}

window.MS_Hero = Hero;
