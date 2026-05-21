// ============================================
// Hero shortcut tabs — sits directly under the hero.
// Two large side-by-side cards: Itineraries + Catalog.
// ============================================
function HeroTabs() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;

  const go = (id) => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="hero-tabs-section" aria-label="Quick navigation">
      <div className="wrap-wide">
        <div className="hero-tabs-grid">
          <button type="button" className="hero-tab hero-tab-itineraries"
            onClick={() => go('itineraries')}>
            <span className="hero-tab-eyebrow">— 01</span>
            <span className="hero-tab-title">
              {tx('Itineraries', 'Reiseplaner', 'Itinéraires')}
            </span>
            <span className="hero-tab-sub">
              {tx('Curated trips from 3 days to 14',
                  'Skreddersydde reiser fra 3 til 14 dager',
                  'Voyages sur mesure de 3 à 14 jours')}
            </span>
            <span className="hero-tab-arrow" aria-hidden="true">→</span>
          </button>
          <button type="button" className="hero-tab hero-tab-catalog"
            onClick={() => go('catalog')}>
            <span className="hero-tab-eyebrow">— 02</span>
            <span className="hero-tab-title">
              {tx('Catalogue', 'Katalog', 'Catalogue')}
            </span>
            <span className="hero-tab-sub">
              {tx('Activities · restaurants · spa · pools · rentals',
                  'Aktiviteter · restauranter · spa · basseng · bilutleie',
                  'Activités · restaurants · spa · piscines · location')}
            </span>
            <span className="hero-tab-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
window.MS_HeroTabs = HeroTabs;
