// ============================================
// Hero shortcut tabs — sits directly under the hero.
// Two compact side-by-side tabs that toggle which section is visible:
// "Reiseplan" → shows #itineraries, hides #catalog (DEFAULT).
// "Katalog"   → shows #catalog,    hides #itineraries.
// ============================================
const { useState: useStateHt, useEffect: useEffectHt } = React;

function HeroTabs() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;

  const [active, setActive] = useStateHt('itineraries');

  useEffectHt(() => {
    const itin = document.getElementById('itineraries');
    const cat  = document.getElementById('catalog');
    if (itin) itin.style.display = (active === 'itineraries') ? '' : 'none';
    if (cat)  cat.style.display  = (active === 'catalog')     ? '' : 'none';
  }, [active]);

  const onPick = (id) => {
    setActive(id);
    // Smooth-scroll to the active section so the content sits in view.
    setTimeout(() => {
      const target = document.getElementById(id === 'itineraries' ? 'itineraries' : 'catalog');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const Tab = ({ id, label, sub }) => (
    <button type="button"
      className={`hero-tab ${active === id ? 'active' : ''}`}
      onClick={() => onPick(id)}
      aria-pressed={active === id}>
      <span className="hero-tab-title">{label}</span>
      <span className="hero-tab-sub">{sub}</span>
    </button>
  );

  return (
    <section className="hero-tabs-section" aria-label="Section switcher">
      <div className="wrap-wide">
        <div className="hero-tabs-grid" role="tablist">
          <Tab id="itineraries"
            label={tx('Itineraries', 'Reiseplaner', 'Itinéraires')}
            sub={tx('Curated trips',  'Skreddersydde reiser',  'Voyages sur mesure')} />
          <Tab id="catalog"
            label={tx('Catalogue', 'Katalog', 'Catalogue')}
            sub={tx('Activities · stays · rentals',
                    'Aktiviteter · opphold · utleie',
                    'Activités · séjours · location')} />
        </div>
      </div>
    </section>
  );
}
window.MS_HeroTabs = HeroTabs;
