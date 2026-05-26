// ============================================
// Hero — single static image, minimal welcome text. No slider.
// Image path: assets/photos/hero/hero-menara-sunset.jpg
// Falls back to a local photo if the file isn't on disk yet.
// ============================================
const { useState: useStateHs, useEffect: useEffectHs } = React;

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
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;
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
          {tx('Boutique travel · Marrakech, Morocco', 'Skreddersydde reiser · Marrakech, Marokko', 'Voyages sur mesure · Marrakech, Maroc')}
        </span>
        <h1 className="ms-hero-h1 ms-hero-brand">
          <span className="ms-hero-h1-line">
            {tx('Hello &', 'Hei &', 'Bonjour &')}
          </span>
          <span className="ms-hero-h1-line">
            {tx('Welcome to', 'Velkommen til', 'Bienvenue chez')}
          </span>
          <span className="ms-hero-h1-line ms-hero-brandmark">
            Marrakech<em>Story</em>
          </span>
        </h1>
        <div className="ms-hero-cta-row">
          <a href="#plan" className="btn btn-primary ms-hero-cta">
            {tx('Plan my trip', 'Planlegg min reise', 'Planifier mon voyage')} →
          </a>
          <a href="https://wa.me/212698164331" target="_blank" rel="noopener" className="btn btn-outline ms-hero-cta ms-hero-cta-alt">
            {tx('Chat on WhatsApp', 'Chat på WhatsApp', 'WhatsApp')}
          </a>
        </div>
      </div>

      <div className="ms-hero-credibility">
        <div className="ms-cred-item">
          <span className="ms-cred-icon">★★★★★</span>
          <div>
            <strong>4.9 / 5</strong>
            <span>1,800+ {tx('reviews', 'anmeldelser', 'avis')}</span>
          </div>
        </div>
        <div className="ms-cred-item">
          <span className="ms-cred-num">2022</span>
          <div>
            <strong>{tx('Since 2022', 'Siden 2022', 'Depuis 2022')}</strong>
            <span>{tx('Marrakech & beyond', 'Marrakech & utenfor', 'Marrakech et au-delà')}</span>
          </div>
        </div>
        <div className="ms-cred-item">
          <span className="ms-cred-icon">🛡️</span>
          <div>
            <strong>{tx('Licensed agency', 'Lisensiert byrå', 'Agence licenciée')}</strong>
            <span>{tx('Moroccan tourism authority', 'Marokkos turistmyndighet', 'Office du tourisme du Maroc')}</span>
          </div>
        </div>
        <div className="ms-cred-item">
          <span className="ms-cred-icon">📞</span>
          <div>
            <strong>24 / 7</strong>
            <span>{tx('Concierge on the ground', 'Concierge på bakken', 'Conciergerie sur place')}</span>
          </div>
        </div>
        <div className="ms-cred-item">
          <span className="ms-cred-icon">✨</span>
          <div>
            <strong>{tx('100% tailor-made', '100% skreddersydd', '100% sur mesure')}</strong>
            <span>{tx('Built around you', 'Bygget rundt deg', 'Conçu pour vous')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

window.MS_HeroSlider = HeroSlider;
