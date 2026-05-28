// ============================================
// Hero shortcut tabs — sits directly under the hero.
// Two side-by-side buttons that smooth-scroll to the matching
// section. Both sections (#itineraries, #catalog) stay visible
// at all times.
// ============================================
function HeroTabs() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : en;

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const Tab = ({ id, label, sub }) => (
    <button type="button" className="hero-tab" onClick={() => go(id)}>
      <span className="hero-tab-title">{label}</span>
      <span className="hero-tab-sub">{sub}</span>
    </button>
  );

  return (
    <section className="hero-tabs-section" aria-label="Quick links">
      <div className="wrap-wide">
        <div className="hero-tabs-grid">
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
