// ============================================
// Agafay Desert section — packages curated from marrakechbestof.com.
// Three tabs: Day passes / Overnight camps / Events & combos.
// Click a card → detail modal with hero, gallery, info, schedule, CTA.
// Data lives in src/agafay-packages.json so it can be edited without touching
// component code; loaded via fetch at runtime.
// ============================================
const { useState: useStateAg, useEffect: useEffectAg, useMemo: useMemoAg } = React;
const Iag = window.MS_I;

const WHATSAPP_AG = "212698164331";

function trimUrl(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }

function AgafayCard({ pkg, lang, onOpen }) {
  const tagline = pkg.tagline?.[lang] || pkg.tagline?.en || '';
  return (
    <div className="ag-card reveal" onClick={() => onOpen(pkg)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(pkg); }}>
      <div className="ag-card-img" style={{ backgroundImage: `url(${pkg.hero})` }}>
        {pkg.rating != null && (
          <span className="ag-card-rating">
            <Iag.Star s={11} /> {pkg.rating.toFixed(1)}
          </span>
        )}
        {pkg.starting_price_eur != null && (
          <span className="ag-card-price">{lang === 'no' ? 'Fra' : lang === 'fr' ? 'Dès' : 'From'} €{pkg.starting_price_eur}</span>
        )}
      </div>
      <div className="ag-card-body">
        <div className="ag-card-loc"><Iag.Pin s={11} /> {pkg.location}</div>
        <h3 className="ag-card-title">{pkg.name}</h3>
        <p className="ag-card-tagline">{tagline}</p>
        <div className="ag-card-tags">
          {(pkg.tags || []).slice(0, 3).map((t, i) => <span key={i} className="ag-card-tag">{t}</span>)}
        </div>
        <button type="button" className="ag-card-cta">
          {lang === 'no' ? 'Se detaljer' : lang === 'fr' ? 'Voir les détails' : 'View details'} →
        </button>
      </div>
    </div>
  );
}

function AgafayModal({ pkg, lang, onClose }) {
  const [gIdx, setGIdx] = useStateAg(0);

  useEffectAg(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  const desc = pkg.description?.[lang] || pkg.description?.en || '';
  const info = pkg.info?.[lang] || pkg.info?.en || [];

  const whatsappMsg = encodeURIComponent(
    lang === 'no'
      ? `Hei, jeg vil booke ${pkg.name} i Agafay-ørkenen.`
      : lang === 'fr'
        ? `Bonjour, je souhaite réserver ${pkg.name} dans le désert d'Agafay.`
        : `Hello, I'd like to book ${pkg.name} in the Agafay desert.`
  );

  return (
    <div className="ag-modal-backdrop" onClick={onClose}>
      <div className="ag-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ag-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="ag-modal-hero" style={{ backgroundImage: `url(${pkg.gallery?.[gIdx] || pkg.hero})` }}>
          <div className="ag-modal-hero-overlay">
            <div className="ag-modal-hero-meta">
              <span className="ag-modal-eyebrow">— {pkg.location}</span>
              <h2 className="ag-modal-title">{pkg.name}</h2>
              {pkg.rating != null && (
                <span className="ag-modal-rating">
                  <Iag.Star s={13} /> {pkg.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {pkg.gallery && pkg.gallery.length > 0 && (
          <div className="ag-modal-thumbs">
            {pkg.gallery.slice(0, 6).map((src, i) => (
              <button key={i} type="button"
                className={`ag-modal-thumb ${i === gIdx ? 'active' : ''}`}
                onClick={() => setGIdx(i)}
                style={{ backgroundImage: `url(${src})` }}
                aria-label={`Image ${i + 1}`} />
            ))}
          </div>
        )}

        <div className="ag-modal-body">
          {pkg.starting_price_eur != null && (
            <div className="ag-modal-price-banner">
              <span className="ag-modal-price-label">{lang === 'no' ? 'Fra' : lang === 'fr' ? 'À partir de' : 'Starting from'}</span>
              <span className="ag-modal-price-value">€{pkg.starting_price_eur}</span>
              <span className="ag-modal-price-sub">{lang === 'no' ? 'per person · betaling som beskrevet under' : lang === 'fr' ? 'par personne · paiement comme décrit ci-dessous' : 'per person · payment as described below'}</span>
            </div>
          )}

          <h3 className="ag-modal-h3">{lang === 'no' ? 'Beskrivelse' : lang === 'fr' ? 'Description' : 'About'}</h3>
          <p className="ag-modal-desc">{desc}</p>

          {pkg.tags && pkg.tags.length > 0 && (
            <div className="ag-modal-tags">
              {pkg.tags.map((t, i) => <span key={i} className="ag-card-tag">{t}</span>)}
            </div>
          )}

          {info.length > 0 && (
            <>
              <h3 className="ag-modal-h3">{lang === 'no' ? 'Praktisk informasjon' : lang === 'fr' ? 'Informations pratiques' : 'Important information'}</h3>
              <ul className="ag-modal-info-list">
                {info.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </>
          )}

          <div className="ag-modal-cta-row">
            <a className="btn btn-primary" href={`https://wa.me/${WHATSAPP_AG}?text=${whatsappMsg}`} target="_blank" rel="noopener">
              {lang === 'no' ? 'Book på WhatsApp' : lang === 'fr' ? 'Réserver sur WhatsApp' : 'Book on WhatsApp'} →
            </a>
            {pkg.source_url && (
              <a className="ag-modal-source" href={pkg.source_url} target="_blank" rel="noopener">
                {lang === 'no' ? 'Kilde' : lang === 'fr' ? 'Source' : 'Source'}: {trimUrl(pkg.source_url)}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgafayPackages() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'en';
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;

  const [data, setData] = useStateAg(null);
  const [activeTab, setActiveTab] = useStateAg('day');
  const [open, setOpen] = useStateAg(null);

  useEffectAg(() => {
    fetch('src/agafay-packages.json?v=76')
      .then(r => r.json())
      .then(setData)
      .catch(e => console.warn('[Agafay] failed to load packages', e));
  }, []);

  const filtered = useMemoAg(() => {
    if (!data) return [];
    return data.packages.filter(p => p.category === activeTab);
  }, [data, activeTab]);

  if (!data) return null;

  const categoryLabel = (c) => c[`label_${lang}`] || c.label_en;

  return (
    <section className="ag-section section" id="agafay">
      <div className="wrap">
        <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 40px' }}>
          <span className="eyebrow">— {tx('Agafay desert', 'Agafay-ørkenen', 'Désert d\'Agafay')}</span>
          <h2>{tx('Camps & ', 'Leirer & ', 'Camps & ')}<em>{tx('experiences', 'opplevelser', 'expériences')}</em></h2>
          <p style={{ margin: '0 auto', maxWidth: 640 }}>{tx(
            'Hand-picked camps and combos in the Agafay stone desert — pool days, dinners under the stars, and full-package evenings with transport.',
            'Håndplukkede leirer og opplevelser i Agafay-steinørkenen — bassengdager, middag under stjernene og kveldspakker med transport inkludert.',
            'Camps et combos sélectionnés dans le désert d\'Agafay — piscine, dîners sous les étoiles et soirées tout-inclus avec transport.'
          )}</p>
        </div>

        <div className="ag-tabs reveal">
          {data.categories.map(c => (
            <button key={c.id}
              className={`ag-tab ${activeTab === c.id ? 'active' : ''}`}
              onClick={() => setActiveTab(c.id)}>
              {categoryLabel(c)}
              <span className="ag-tab-count">{data.packages.filter(p => p.category === c.id).length}</span>
            </button>
          ))}
        </div>

        <div className="ag-grid">
          {filtered.map((p) => (
            <AgafayCard key={p.slug} pkg={p} lang={lang} onOpen={setOpen} />
          ))}
        </div>

        {open && (
          <AgafayModal pkg={open} lang={lang} onClose={() => setOpen(null)} />
        )}
      </div>
    </section>
  );
}

window.MS_AgafayPackages = AgafayPackages;
