// ============================================
// Resources — downloadable PDFs (catalogues, itineraries, brochures)
// ============================================
const Ir = window.MS_I;

const RESOURCES = [
  // Brochures / catalogues
  { group: 'catalogue', file: 'assets/docs/welcome-guide.pdf', size: '3.4 MB',
    title_en: 'Your Marrakech Story starts here',
    title_no: 'Marrakechstory — start her',
    title_fr: 'Votre Marrakech Story commence ici',
    desc_en: 'A short introduction to who we are and how we plan trips.',
    desc_no: 'En kort introduksjon til hvem vi er og hvordan vi planlegger reiser.',
    desc_fr: 'Une courte introduction sur qui nous sommes et comment nous planifions des voyages.' },
  { group: 'catalogue', file: 'assets/docs/luxury-presentation.pdf', size: '32 KB',
    title_en: 'Luxury presentation', title_no: 'Luksuspresentasjon', title_fr: 'Présentation luxe',
    desc_en: 'Our top-tier riads, hotels and private experiences.',
    desc_no: 'Våre toppriads, hoteller og private opplevelser.',
    desc_fr: 'Nos meilleurs riads, hôtels et expériences privées.' },
  { group: 'catalogue', file: 'assets/docs/collection-1.pdf', size: '20 MB',
    title_en: 'The full collection', title_no: 'Hele samlingen', title_fr: 'Collection complète',
    desc_en: 'A comprehensive look at our riads, partners and experiences across Marrakech.',
    desc_no: 'En komplett oversikt over våre riads, partnere og opplevelser i Marrakech.',
    desc_fr: 'Un panorama complet de nos riads, partenaires et expériences à Marrakech.' },

  // Sample itineraries
  { group: 'itinerary', file: 'assets/docs/sample-15-day-grand-discovery.pdf', size: '13 MB',
    title_en: 'Sample · 15-day Grand Discovery', title_no: 'Eksempel · 15 dagers Grand Discovery', title_fr: 'Exemple · 15 jours Grand Discovery',
    desc_en: 'A full two-week Morocco itinerary: Marrakech, Atlas, Sahara, coast.',
    desc_no: 'En full to-ukers Marokko-reise: Marrakech, Atlas, Sahara, kysten.',
    desc_fr: 'Un itinéraire de deux semaines au Maroc : Marrakech, Atlas, Sahara, côte.' },
  { group: 'itinerary', file: 'assets/docs/sample-marrakech-taghazout-agafay.pdf', size: '20 KB',
    title_en: 'Sample · Marrakech, Taghazout, Agafay', title_no: 'Eksempel · Marrakech, Taghazout, Agafay', title_fr: 'Exemple · Marrakech, Taghazout, Agafay',
    desc_en: 'A one-week trio: medina, surf coast, desert camp.',
    desc_no: 'En ukestur: medina, surfekyst, ørkenleir.',
    desc_fr: 'Un voyage d\'une semaine : médina, côte surf, camp désert.' },
  { group: 'itinerary', file: 'assets/docs/sample-agafay-proposal.pdf', size: '124 KB',
    title_en: 'Sample · Agafay proposal', title_no: 'Eksempel · Agafay-forslag', title_fr: 'Exemple · Proposition Agafay',
    desc_en: 'A focused desert weekend — camp, ride, dinner under the stars.',
    desc_no: 'En fokusert ørken-helg — leir, ridning, middag under stjernene.',
    desc_fr: 'Un week-end désert ciblé — camp, balade, dîner sous les étoiles.' },
  { group: 'itinerary', file: 'assets/docs/sample-anniversary-20pax.pdf', size: '1.7 MB',
    title_en: 'Sample · Anniversary for 20 guests', title_no: 'Eksempel · Jubileum for 20 gjester', title_fr: 'Exemple · Anniversaire pour 20 invités',
    desc_en: 'How we coordinate group celebrations end-to-end.',
    desc_no: 'Slik koordinerer vi gruppemarkeringer fra A til Å.',
    desc_fr: 'Comment nous coordonnons une célébration de groupe de A à Z.' },
  { group: 'itinerary', file: 'assets/docs/full-pricelist-itineraries.pdf', size: '28 KB',
    title_en: 'Full pricelist & itineraries', title_no: 'Full prisliste og reiseplaner', title_fr: 'Prix complets & itinéraires',
    desc_en: 'Reference prices for our most-booked trips.',
    desc_no: 'Referansepriser for våre mest bestilte turer.',
    desc_fr: 'Prix de référence pour nos voyages les plus réservés.' },

  // Guides
  { group: 'guide', file: 'assets/docs/desert-guide.pdf', size: '12 MB',
    title_en: 'A mini guide to the desert', title_no: 'En liten ørkenguide', title_fr: 'Mini guide du désert',
    desc_en: 'What to bring, when to go, how to dress, what to expect.',
    desc_no: 'Hva du trenger, når du bør dra, hvordan kle deg, hva du kan forvente.',
    desc_fr: 'Que prendre, quand partir, comment s\'habiller, à quoi s\'attendre.' },
  { group: 'guide', file: 'assets/docs/morocco-overview.pdf', size: '19 MB',
    title_en: 'Morocco overview', title_no: 'Marokko-oversikt', title_fr: 'Aperçu du Maroc',
    desc_en: 'Cities, seasons, dress codes, food, transport, etiquette.',
    desc_no: 'Byer, sesonger, klesregler, mat, transport, etikette.',
    desc_fr: 'Villes, saisons, codes vestimentaires, cuisine, transport, étiquette.' },
  { group: 'guide', file: 'assets/docs/transport-offer.pdf', size: '60 KB',
    title_en: 'Transport & transfers', title_no: 'Transport og transfer', title_fr: 'Transport & transferts',
    desc_en: 'Our fleet, airport transfers, day-hire and multi-day driver options.',
    desc_no: 'Vår flåte, flyplasstransfer, dagleie og fleirdags sjåfør.',
    desc_fr: 'Notre flotte, transferts aéroport, location à la journée et chauffeur multi-jours.' },
  { group: 'guide', file: 'assets/docs/pricelist.pdf', size: '44 KB',
    title_en: 'Pricelist', title_no: 'Prisliste', title_fr: 'Liste de prix',
    desc_en: 'Quick reference for activities, transport and add-ons.',
    desc_no: 'Hurtigreferanse for aktiviteter, transport og tillegg.',
    desc_fr: 'Référence rapide pour activités, transport et options.' },
];

const GROUPS = {
  catalogue: { en: 'Brochures', no: 'Brosjyrer', fr: 'Brochures' },
  itinerary: { en: 'Sample itineraries', no: 'Eksempler på reiseplaner', fr: 'Itinéraires types' },
  guide:     { en: 'Practical guides', no: 'Praktiske guider', fr: 'Guides pratiques' },
};

function Resources() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'en';
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : en;
  const T = (item, field) => item[`${field}_${lang === 'no' ? 'no' : lang === 'fr' ? 'fr' : 'en'}`];
  const groupKeys = ['catalogue', 'itinerary', 'guide'];
  return (
    <section className="resources-section section" id="resources">
      <div className="wrap">
        <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 56px' }}>
          <span className="eyebrow">{tx('Resources', 'Ressurser', 'Ressources')}</span>
          <h2>{tx('Brochures, ', 'Brosjyrer, ', 'Brochures, ')}<em>{tx('itineraries', 'reiseplaner', 'itinéraires')}</em>{tx(' & guides', ' og guider', ' & guides')}</h2>
          <p style={{ margin: '0 auto' }}>
            {tx(
              'Download our catalogues, sample itineraries and practical guides — useful before, during and after your trip.',
              'Last ned våre kataloger, eksempler på reiseplaner og praktiske guider — nyttig før, under og etter reisen.',
              'Téléchargez nos catalogues, exemples d\'itinéraires et guides pratiques — utiles avant, pendant et après votre voyage.'
            )}
          </p>
        </div>

        {groupKeys.map(gk => {
          const groupItems = RESOURCES.filter(r => r.group === gk);
          if (!groupItems.length) return null;
          return (
            <div key={gk} className="resources-group reveal">
              <h3 className="resources-group-title">{GROUPS[gk][lang === 'no' ? 'no' : lang === 'fr' ? 'fr' : 'en']}</h3>
              <div className="resources-grid">
                {groupItems.map((r, i) => (
                  <a key={i} className="resource-card" href={r.file} target="_blank" rel="noopener" download>
                    <div className="resource-icon">
                      <Ir.Compass s={18} />
                      <span className="resource-ext">PDF</span>
                    </div>
                    <div className="resource-body">
                      <div className="resource-title">{T(r, 'title')}</div>
                      <div className="resource-desc">{T(r, 'desc')}</div>
                      <div className="resource-meta">{r.size} · {tx('Download', 'Last ned', 'Télécharger')} →</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

window.MS_Resources = Resources;
