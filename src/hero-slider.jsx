// ============================================
// Hero — single static image, minimal welcome text. No slider.
// Image path: assets/photos/hero/hero-menara-sunset.jpg
// Falls back to a local photo if the file isn't on disk yet.
// ============================================
const { useState: useStateHs, useEffect: useEffectHs, useRef: useRefHs, useMemo: useMemoHs } = React;

// Build a flat searchable index across the whole site.
function buildSiteSearchIndex(lang) {
  const L = (v) => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    return v[lang] || v.en || v.no || v.fr || '';
  };
  const items = [];

  // Trips + themes (live on window.MS_ITINERARIES)
  (window.MS_ITINERARIES || []).forEach((t) => {
    items.push({
      kind: 'trip', id: 'trip-' + t.slug, slug: t.slug,
      title: t.title,
      subtitle: `${t.duration || ''} · ${t.route || ''}`.trim(),
      tags: [...(t.themeTags || []), t.idealFor || ''].filter(Boolean),
      teaser: t.teaser || t.overview || '',
      icon: '🗺️',
      action: () => {
        window.dispatchEvent(new CustomEvent('ms:open-trip', { detail: { slug: t.slug } }));
        document.getElementById('itineraries')?.scrollIntoView({ behavior: 'smooth' });
      },
    });
  });

  // Catalog data
  const D = window.MS_DATA || {};
  const tabsToShow = [
    { key: 'activities',  tab: 'activities',  list: D.ACTIVITIES,  icon: '🎈' },
    { key: 'restaurants', tab: 'restaurants', list: D.RESTAURANTS, icon: '🍽️' },
    { key: 'spas',        tab: 'spas',        list: D.SPAS,        icon: '🧖' },
    { key: 'camps',       tab: 'camps',       list: D.CAMPS,       icon: '🏕️' },
    { key: 'pools',       tab: 'pools',       list: D.POOLS,       icon: '🏊' },
    { key: 'transport',   tab: 'transport',   list: D.TRANSPORT,   icon: '🚗' },
    { key: 'excursions',  tab: 'excursions',  list: D.EXCURSIONS,  icon: '🌄' },
  ];
  tabsToShow.forEach(({ tab, list, icon }) => {
    (list || []).forEach((item) => {
      const name = L(item.name);
      if (!name) return;
      items.push({
        kind: tab,
        id: tab + '-' + (item.slug || name.toLowerCase().replace(/\s+/g, '-')),
        slug: item.slug,
        title: name,
        subtitle: L(item.area) || L(item.cuisine) || L(item.style) || '',
        teaser: L(item.desc) || L(item.description) || '',
        tags: item.perfectFor || [],
        icon,
        action: () => {
          window.dispatchEvent(new CustomEvent('ms:open-catalog', { detail: { tab, slug: item.slug, name } }));
          document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
        },
      });
    });
  });

  // Top-level sections so "kontakt", "katalog" etc. resolve too
  const SECTIONS = [
    { id: '#home',         no: 'Hjem',     en: 'Home',     fr: 'Accueil',   icon: '🏠' },
    { id: '#itineraries',  no: 'Reiser',   en: 'Trips',    fr: 'Voyages',   icon: '🗺️' },
    { id: '#catalog',      no: 'Katalog',  en: 'Catalog',  fr: 'Catalogue', icon: '📖' },
    { id: '#plan',         no: 'Planlegg', en: 'Planner',  fr: 'Planifier', icon: '✏️' },
    { id: '#contact',      no: 'Kontakt',  en: 'Contact',  fr: 'Contact',   icon: '✉️' },
  ];
  SECTIONS.forEach((s) => {
    items.push({
      kind: 'section', id: 'section-' + s.id, slug: s.id,
      title: s[lang] || s.en,
      subtitle: '',
      teaser: '',
      tags: [],
      icon: s.icon,
      action: () => { document.querySelector(s.id)?.scrollIntoView({ behavior: 'smooth' }); },
    });
  });

  return items;
}

function scoreMatch(item, qLower) {
  // Match priority: title startsWith > word-boundary in title > substring in title > substring in tags/subtitle > substring in teaser
  const t = (item.title || '').toLowerCase();
  if (t.startsWith(qLower)) return 100;
  if (new RegExp('(?:^|\\s)' + qLower.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).test(t)) return 80;
  if (t.includes(qLower)) return 60;
  const sub = (item.subtitle || '').toLowerCase();
  if (sub.includes(qLower)) return 45;
  const tags = (item.tags || []).map(x => String(x).toLowerCase()).join(' ');
  if (tags.includes(qLower)) return 35;
  const teaser = (item.teaser || '').toLowerCase();
  if (teaser.includes(qLower)) return 20;
  return 0;
}

function HeroSearch({ lang, tx }) {
  const [q, setQ] = useStateHs('');
  const [open, setOpen] = useStateHs(false);
  const [active, setActive] = useStateHs(0);
  const wrapRef = useRefHs(null);
  // Re-build whenever the lang flips (display strings localize)
  const [index, setIndex] = useStateHs(() => buildSiteSearchIndex(lang));
  useEffectHs(() => { setIndex(buildSiteSearchIndex(lang)); }, [lang]);

  // Close on outside click
  useEffectHs(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const results = useMemoHs(() => {
    const qLower = q.trim().toLowerCase();
    if (!qLower) return [];
    const scored = [];
    for (const it of index) {
      const s = scoreMatch(it, qLower);
      if (s > 0) scored.push({ it, s });
    }
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, 8).map(x => x.it);
  }, [q, index]);

  const groupLabel = (kind) => {
    const map = {
      trip:       tx('Trips','Reiser','Voyages','Resor'),
      activities: tx('Activities','Aktiviteter','Activités','Aktiviteter'),
      restaurants:tx('Restaurants','Restauranter','Restaurants','Restauranger'),
      spas:       tx('Spa & Hammam','Spa & Hammam','Spa & Hammam','Spa & Hammam'),
      camps:      tx('Camps','Leirer','Campements','Läger'),
      pools:      tx('Pools','Basseng','Piscines','Pooler'),
      transport:  tx('Car rental','Bilutleie','Location','Biluthyrning'),
      excursions: tx('Excursions','Utflukter','Excursions','Utflykter'),
      section:    tx('Section','Seksjon','Section','Sektion'),
    };
    return map[kind] || kind;
  };

  const onSubmit = (e) => {
    e?.preventDefault?.();
    if (results.length > 0) {
      results[active]?.action?.();
      setOpen(false);
    } else if (q.trim()) {
      document.getElementById('itineraries')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Escape')    { setOpen(false); }
  };

  return (
    <div className="ms-hero-search-wrap" ref={wrapRef}>
      <form className="ms-hero-search" onSubmit={onSubmit}>
        <svg className="ms-hero-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          name="q"
          autoComplete="off"
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => { if (q) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder={tx(
            'Search trips, themes, activities…',
            'Søk etter reiser, temaer, opplevelser…',
            'Recherchez voyages, thèmes, activités…',
            'Sök resor, teman, aktiviteter…'
          )}
          aria-label={tx('Search', 'Søk', 'Rechercher', 'Sök')}
        />
        <button type="submit" className="ms-hero-search-btn">
          {tx('Search', 'Søk', 'Rechercher', 'Sök')}
        </button>
      </form>
      {open && q.trim() && (
        <div className="ms-hero-search-dropdown" role="listbox">
          {results.length === 0 ? (
            <div className="ms-hero-search-empty">
              {tx('No matches — try another word', 'Ingen treff — prøv et annet ord', 'Aucun résultat — essayez un autre mot')}
            </div>
          ) : results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className={`ms-hero-search-result ${i === active ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => { r.action?.(); setOpen(false); }}>
              <span className="ms-hero-search-icon-cell" aria-hidden="true">{r.icon}</span>
              <span className="ms-hero-search-result-body">
                <span className="ms-hero-search-result-title">{r.title}</span>
                {(r.subtitle || r.teaser) && (
                  <span className="ms-hero-search-result-sub">{r.subtitle || r.teaser}</span>
                )}
              </span>
              <span className="ms-hero-search-result-tag">{groupLabel(r.kind)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const HERO_IMG      = "assets/photos/hero/hero-riad.jpg?v=69";
const HERO_FALLBACK = "assets/photos/nobu-hotel-marrakech-marbella-review-683ddd3e251e9.avif";

function useResolvedHeroImage(primary, fallback) {
  const [src, setSrc] = useStateHs(primary);
  useEffectHs(() => {
    if (!primary || !fallback) return;
    const img = new Image();
    let alive = true;
    img.onload  = () => { if (alive) setSrc(primary); };
    img.onerror = () => { if (alive) setSrc(fallback); };
    img.src = primary;
    return () => { alive = false; };
  }, [primary, fallback]);
  return src;
}

function HeroSlider() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : en;
  const bg = useResolvedHeroImage(HERO_IMG, HERO_FALLBACK);

  return (
    <section className="ms-hero ms-hero-static" id="home">
      <div className="ms-hero-bg" style={{ backgroundImage: `url(${bg})` }} aria-hidden="true">
        <div className="ms-slide-grad-1" />
        <div className="ms-slide-grad-2" />
        <div className="ms-slide-vignette" />
      </div>

      <div className="ms-hero-content ms-hero-content-centered">
        <span className="ms-hero-eyebrow">
          {tx('Boutique travel · Marrakech, Morocco',
              'Skreddersydde reiser · Marrakech, Marokko',
              'Voyages sur mesure · Marrakech, Maroc',
              'Skräddarsydda resor · Marrakech, Marocko')}
        </span>
        <h1 className="ms-hero-h1 ms-hero-brand">
          <span className="ms-hero-h1-line">
            {tx('Hello &', 'Hei &', 'Bonjour &', 'Hej &')}
          </span>
          <span className="ms-hero-h1-line">
            {tx('Welcome to', 'Velkommen til', 'Bienvenue chez', 'Välkommen till')}
          </span>
          <span className="ms-hero-h1-line ms-hero-brandmark">
            Marrakech<em>Story</em>
          </span>
        </h1>
        <HeroSearch lang={lang} tx={tx} />

        <div className="ms-hero-cta-row">
          <a href="#plan" className="btn btn-primary ms-hero-cta">
            {tx('Plan my trip', 'Planlegg min reise', 'Planifier mon voyage', 'Planera min resa')} →
          </a>
          <a href="https://wa.me/212698164331" target="_blank" rel="noopener" className="btn btn-outline ms-hero-cta ms-hero-cta-alt">
            {tx('Chat on WhatsApp', 'Chat på WhatsApp', 'WhatsApp', 'Chatta på WhatsApp')}
          </a>
        </div>
      </div>

      <div className="ms-hero-credibility">
        <div className="ms-cred-item">
          <span className="ms-cred-icon">★★★★★</span>
          <div>
            <strong>4.9 / 5</strong>
            <span>1,800+ {tx('reviews', 'anmeldelser', 'avis', 'recensioner')}</span>
          </div>
        </div>
        <div className="ms-cred-item">
          <span className="ms-cred-num">2022</span>
          <div>
            <strong>{tx('Since 2022', 'Siden 2022', 'Depuis 2022', 'Sedan 2022')}</strong>
            <span>{tx('Marrakech & beyond', 'Marrakech & utenfor', 'Marrakech et au-delà', 'Marrakech & runt om')}</span>
          </div>
        </div>
        <div className="ms-cred-item">
          <span className="ms-cred-icon">🛡️</span>
          <div>
            <strong>{tx('Licensed agency', 'Lisensiert byrå', 'Agence licenciée', 'Licensierad byrå')}</strong>
            <span>{tx('Moroccan tourism authority', 'Marokkos turistmyndighet', 'Office du tourisme du Maroc', 'Marockos turistmyndighet')}</span>
          </div>
        </div>
        <div className="ms-cred-item">
          <span className="ms-cred-icon">📞</span>
          <div>
            <strong>24 / 7</strong>
            <span>{tx('Concierge on the ground', 'Concierge på bakken', 'Conciergerie sur place', 'Concierge på plats')}</span>
          </div>
        </div>
        <div className="ms-cred-item">
          <span className="ms-cred-icon">✨</span>
          <div>
            <strong>{tx('100% tailor-made', '100% skreddersydd', '100% sur mesure', '100 % skräddarsydd')}</strong>
            <span>{tx('Built around you', 'Bygget rundt deg', 'Conçu pour vous', 'Byggd kring dig')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

window.MS_HeroSlider = HeroSlider;
