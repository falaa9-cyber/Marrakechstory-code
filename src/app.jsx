// ============================================
// App shell — nav with lang/curr, ordered sections
// ============================================
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;
const Ia = window.MS_I;

function NavPill({ label, items, value, onSelect, head, align = 'right' }) {
  const [open, setOpen] = useStateA(false);
  const ref = useRefA(null);
  useEffectA(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div className="nav-pill" ref={ref}>
      <button className="nav-pill-btn" onClick={() => setOpen(o => !o)}>
        {label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className={`nav-pill-menu ${align === 'left' ? 'left' : ''}`}>
          {head && <div className="menu-head">{head}</div>}
          {items.map(it => (
            <button key={it.id} className={value === it.id ? 'active' : ''}
              onClick={() => { onSelect(it.id); setOpen(false); }}>
              <span>{it.flag && <span className="flag" style={{ marginRight: 8 }}>{it.flag}</span>}{it.label}</span>
              {value === it.id && <Ia.Check s={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Combined language + currency popover (Apple-style chip — emoji-only, compact)
const CURR_EMOJI = { NOK: '🇳🇴', SEK: '🇸🇪', EUR: '🇪🇺', USD: '🇺🇸', MAD: '🇲🇦', GBP: '🇬🇧' };
const CURR_SYMBOL = { NOK: 'kr', SEK: 'kr', EUR: '€', USD: '$', MAD: 'د.م', GBP: '£' };
function LangCurrPill({ lang, curr, langItem, LANG_LIST, CURR_LIST, setLang, setCurr, langHead, currHead }) {
  const [open, setOpen] = useStateA(false);
  const ref = useRefA(null);
  useEffectA(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div className="ms-lc" ref={ref} style={{ position: 'relative' }}>
      <button className="ms-lc-pill" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={`${lang} / ${curr}`}>
        <span className="ms-lc-flag">{langItem?.flag}</span>
        <span className="ms-lc-sym">{CURR_SYMBOL[curr] || '€'}</span>
      </button>
      {open && (
        <div className="ms-lc-menu" role="listbox">
          <div className="ms-lc-col-head">{langHead}</div>
          <div className="ms-lc-col-head">{currHead}</div>
          <div>
            {LANG_LIST.map(it => (
              <button key={it.id}
                className={`ms-lc-opt ${lang === it.id ? 'is-active' : ''}`}
                onClick={() => { setLang(it.id); }}>
                <span className="flag">{it.flag}</span>
                <span>{it.label}</span>
                {lang === it.id && <Ia.Check s={13} className="check" />}
              </button>
            ))}
          </div>
          <div>
            {CURR_LIST.map(it => (
              <button key={it.id}
                className={`ms-lc-opt ${curr === it.id ? 'is-active' : ''}`}
                onClick={() => { setCurr(it.id); }}>
                <span className="flag">{CURR_EMOJI[it.id] || '💰'}</span>
                <span>{it.label}</span>
                {curr === it.id && <Ia.Check s={13} className="check" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Nav() {
  const { useMS, useT, LANG_LIST, CURR_LIST } = window.MS_CTX;
  const { lang, curr, setLang, setCurr } = useMS();
  const t = useT();
  const [scrolled, setScrolled] = useStateA(false);
  const [overHero, setOverHero] = useStateA(true);

  useEffectA(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setOverHero(window.scrollY < window.innerHeight - 80);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const langItem = LANG_LIST.find(l => l.id === lang);

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''} ${overHero && !scrolled ? 'over-hero' : ''}`}>
      <div className="wrap-wide nav-inner">
        <a href="#home" className="nav-logo">
          <img src="assets/logo.png" alt="Marrakech Story" className="logo-img" />
          <span>Marrakech<em style={{ fontStyle: 'italic', fontWeight: 400, opacity: .7, marginLeft: 2 }}>Story</em></span>
        </a>
        <div className="nav-links">
          <a href="#itineraries">{t('nav_packages')}</a>
          <a href="#catalog">{t('nav_catalog')}</a>
          <a href="#plan">{t('nav_plan')}</a>
          <a href="#contact">{t('nav_contact')}</a>
        </div>
        <div className="nav-cta">
          <LangCurrPill
            lang={lang} curr={curr}
            langItem={langItem}
            LANG_LIST={LANG_LIST} CURR_LIST={CURR_LIST}
            setLang={setLang} setCurr={setCurr}
            langHead={t('nav_lang')} currHead={t('nav_curr')}
          />
          {window.MS_AuthSystem && <window.MS_AuthSystem />}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const { useT, COMPANY } = window.MS_CTX;
  const t = useT();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <a href="#home" className="nav-logo" style={{ color: '#fff' }}>
              <img src="assets/logo.png" alt="Marrakech Story" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover' }} />
              <span style={{ fontSize: 22 }}>Marrakech<em style={{ fontStyle: 'italic', fontWeight: 400, opacity: .7, marginLeft: 2 }}>Story</em></span>
            </a>
            <div className="footer-tag">
              {t('foot_tag_a')}<br />{t('foot_tag_b')} <em style={{ color: '#ff9b78', fontStyle: 'italic' }}>{t('foot_tag_c')}</em>
            </div>
            <div className="footer-contact-list">
              <a href={`mailto:${COMPANY.email}`}><Ia.Mail /> {COMPANY.email}</a>
              <a href={`tel:${COMPANY.phoneIntl}`}><Ia.Phone /> {COMPANY.phone}</a>
              <a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noopener">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
                WhatsApp
              </a>
              <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                <Ia.Pin /> {COMPANY.address}
              </span>
            </div>
          </div>
          <div>
            <h4>{t('foot_plan')}</h4>
            <div className="footer-links">
              <a href="#itineraries">{t('nav_packages')}</a>
              <a href="#plan">{t('nav_plan')}</a>
            </div>
          </div>
          <div>
            <h4>{t('foot_discover')}</h4>
            <div className="footer-links">
              <a href="#catalog">{t('cat_activities')}</a>
              <a href="#catalog">{t('cat_restaurants')}</a>
              <a href="#catalog">{t('cat_spa')}</a>
              <a href="#catalog">{t('cat_camps')}</a>
              <a href="#catalog">{t('cat_pools')}</a>
              <a href="#catalog">{t('cat_transport')}</a>
              <a href="#catalog">{t('cat_excursions')}</a>
            </div>
          </div>
          <div>
            <h4>{t('foot_contact')}</h4>
            <div className="footer-links">
              <a href={`mailto:${COMPANY.email}`}>Email</a>
              <a href={`tel:${COMPANY.phoneIntl}`}>{COMPANY.phone}</a>
              <a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noopener">WhatsApp</a>
              <a href={`https://instagram.com/${COMPANY.instagram}`} target="_blank" rel="noopener">@{COMPANY.instagram}</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Marrakech Story · IATA accredited · ONMT licence #14872 · {t('foot_rights')}</span>
          <span style={{ display: 'flex', gap: 18 }}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

function AppInner() {
  useEffectA(() => {
    const observe = () => {
      const els = document.querySelectorAll('.reveal:not(.in)');
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      els.forEach(el => io.observe(el));
      return io;
    };
    let io = observe();
    const re = setInterval(() => { io.disconnect(); io = observe(); }, 1200);
    return () => { io.disconnect(); clearInterval(re); };
  }, []);

  return (
    <>
      <Nav />
      <window.MS_HeroSlider />
      <window.MS_Itineraries />
      <window.MS_Catalog />
      <window.MS_Form />
      <window.MS_Contact />
      <Footer />
      <window.MS_WhatsApp />
      {window.MS_QuickBookHost && <window.MS_QuickBookHost />}
      {window.MS_Chatbot && <window.MS_Chatbot />}
      <window.MS_InstagramWidget />
      {window.MS_Weather && <window.MS_Weather />}
      {window.MS_CookieBanner && <window.MS_CookieBanner />}
    </>
  );
}

function App() {
  const { MSProvider } = window.MS_CTX;
  return (
    <MSProvider>
      <AppInner />
    </MSProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
