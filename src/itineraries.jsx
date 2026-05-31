// ============================================
// Reiseplaner — 17 Marrakechstory itineraries
// Catalog-style grid (matches catalog.jsx design) + right-side "Make your reiseplan" CTA box
// Each itinerary modal includes booking rules & conditions
// ============================================
const { useState: useStateIt, useRef: useRefIt, useEffect: useEffectIt, useMemo: useMemoIt } = React;
const Iit = window.MS_I;

// ── Standard booking rules — applied to every itinerary unless overridden ──
const STANDARD_TERMS = {
  en: [
    "30% deposit at booking via secure payment link; balance due 30 days before departure.",
    "Free cancellation up to 30 days before departure. 50% from 30–14 days. No refund within 14 days.",
    "Prices in EUR per person, based on two travellers sharing a room. Single supplement on request.",
    "Minimum 2 travellers per itinerary. Children from age 6 unless noted otherwise.",
    "Includes a private driver-guide on all transfers — never shared with another group.",
    "Travel insurance is strongly recommended. We can suggest a partner if needed.",
    "Itinerary is fully customisable — pace, hotels and stops can be adjusted at planning stage.",
    "Reply within 24 hours via email or WhatsApp (+212 698 164 331).",
  ],
  no: [
    "30 % depositum ved booking via sikker betalingslenke; resten betales 30 dager før avreise.",
    "Gratis avbestilling inntil 30 dager før avreise. 50 % fra 30–14 dager. Ingen refusjon innen 14 dager.",
    "Priser i EUR per person, basert på to reisende som deler rom. Singeltillegg på forespørsel.",
    "Minimum 2 reisende per reiseplan. Barn fra 6 år dersom ikke annet er oppgitt.",
    "Inkluderer privat sjåfør-guide på alle transferer — aldri delt med andre grupper.",
    "Reiseforsikring anbefales sterkt. Vi kan foreslå en partner ved behov.",
    "Reiseplanen er fullt tilpassbar — tempo, hoteller og stopp kan justeres under planlegging.",
    "Svar innen 24 timer via e-post eller WhatsApp (+212 698 164 331).",
  ],
  fr: [
    "30 % d'acompte à la réservation via lien sécurisé ; solde dû 30 jours avant le départ.",
    "Annulation gratuite jusqu'à 30 jours avant le départ. 50 % entre 30 et 14 jours. Aucun remboursement à moins de 14 jours.",
    "Prix en EUR par personne, sur base de deux voyageurs en chambre double. Supplément single sur demande.",
    "Minimum 2 voyageurs par itinéraire. Enfants à partir de 6 ans sauf indication contraire.",
    "Inclut un chauffeur-guide privé sur tous les transferts — jamais partagé avec un autre groupe.",
    "Une assurance voyage est fortement recommandée. Nous pouvons suggérer un partenaire.",
    "Itinéraire entièrement personnalisable — rythme, hôtels et étapes ajustables en planification.",
    "Réponse sous 24 h par e-mail ou WhatsApp (+212 698 164 331).",
  ],
  sv: [
    "30 % deposition vid bokning via säker betalningslänk; resterande belopp betalas 30 dagar före avresa.",
    "Kostnadsfri avbokning upp till 30 dagar före avresa. 50 % från 30–14 dagar. Ingen återbetalning inom 14 dagar.",
    "Priser i EUR per person, baserat på två resenärer som delar rum. Enkelrumstillägg på begäran.",
    "Minst 2 resenärer per resplan. Barn från 6 år om inget annat anges.",
    "Inkluderar privat chaufför-guide på alla transfers — aldrig delad med en annan grupp.",
    "Reseförsäkring rekommenderas starkt. Vi kan föreslå en partner vid behov.",
    "Resplanen är fullt anpassningsbar — tempo, hotell och stopp kan justeras under planeringsstadiet.",
    "Svar inom 24 timmar via e-post eller WhatsApp (+212 698 164 331).",
  ],
};

// ── MOST-BOOKED PACKAGES — pulled from data.js PACKAGES, shown first ──
// Each carries `badge: "MOST BOOKED"` so it surfaces with a clear tag.
const MOST_BOOKED = (function() {
  const D = window.MS_DATA || {};
  const pkgs = (D.PACKAGES || []).filter(p => p.id && p.title && Array.isArray(p.timeline));
  return pkgs.map((p, i) => {
    const days = p.days || (p.timeline?.length) || 0;
    const nights = p.nights || Math.max(0, days - 1);
    const dur = `${days}D${nights}N`;
    // Derive teaser from description (first sentence, max ~180 chars)
    const sentences = (p.description || '').split(/(?<=[.!?])\s+/);
    const teaser = (sentences[0] || p.description || '').slice(0, 200);
    // Map timeline → itinerary[]
    const itin = (p.timeline || []).map((d, di) => ({
      day: d.day || di + 1,
      route: d.title || d.label || `Day ${di + 1}`,
      text: d.desc || (d.items ? d.items.join(' · ') : ''),
    }));
    // Highlights from first 6 items across the timeline
    const highlights = [];
    for (const d of (p.timeline || [])) {
      for (const it of (d.items || [])) {
        if (highlights.length < 6) highlights.push(it);
      }
    }
    // Price from label or default
    const priceMap = { "Lang helg": 590, "Mest bestilt": 790, "Signaturreise": 1190, "Premium": 1890, "Drømmereise": 2890 };
    const priceFromEUR = priceMap[p.label] || 600 + i * 300;
    // Match a contextual local photo by tags
    const tagJoin = (p.tags || []).join(' ').toLowerCase();
    let img = "assets/photos/agafay-valley-marrakech-70.jpg";
    if (/imperialbyene|fes|casablanca|rabat/.test(tagJoin)) img = "assets/photos/about-us-hq-31-scaled.jpg.webp";
    else if (/sahara|merzouga/.test(tagJoin))               img = "assets/photos/marrakech-desert.jpg";
    else if (/atlas/.test(tagJoin))                          img = "assets/photos/lodge-atlas-1-scaled.jpg.webp";
    else if (/essaouira|coast|agadir|strand/.test(tagJoin))  img = "assets/photos/cheval-essaouira.jpg";
    else if (/medina|riad|kultur/.test(tagJoin))             img = "assets/photos/about-us-hq-33-scaled.jpg.webp";
    return {
      slug: p.id,
      chapter: "00",   // not really a chapter, but keeps shape consistent
      title: p.title,
      duration: dur,
      days, nights,
      route: "Marrakech → Marrakech",
      priceFromEUR,
      img,
      badge: "MOST BOOKED",
      themeTags: p.tags || [],
      teaser,
      overview: p.description || "",
      highlights,
      itinerary: itin,
      included: p.included || [],
      excluded: p.notIncluded || [],
    };
  });
})();

// ── ITINERARIES (17 chapters, Marrakech-anchored) ──────────────
// ── ITINERARIES (6 signature journeys — Marrakech Story collection) ──
const ITINS = [
  // ===== 3D2N — The Marrakech Weekend =====
  {
    slug: "marrakech-weekend", chapter: "01",
    title: { en: "The Marrakech Weekend", no: "Marrakech-helgen", fr: "Le Week-end Marrakech" },
    duration: "3D2N", days: 3, nights: 2,
    route: "Marrakech",
    priceFromEUR: 590,
    img: "assets/photos/le-jardin-lotus16-marrakechstory.jpg",
    badge: { en: "MOST LOVED", no: "MER ELSKET", fr: "PLUS AIMÉ" },
    themeTags: ["Medina", "Riad", "Hammam"],
    teaser: { en: "A long weekend in the red city — medina, garden, hammam.", no: "En lang helg i den røde byen — medina, hage, hammam.", fr: "Un long week-end dans la ville rouge — médina, jardin, hammam." },
    overview: { en: "Three days is enough for Marrakech to leave a mark — provided you spend them well. We open with a slow medina morning, give you a true Moroccan lunch in a private riad courtyard, and finish in the gardens that softened the city for Yves Saint Laurent. Two nights in a hand-picked riad inside the walls.", no: "Tre dager er nok til å la Marrakech sette spor — om du bruker dem riktig. Vi starter med en rolig morgen i medina, gir deg en ekte marokkansk lunsj i en privat riad-gårdhage, og avslutter i hagene som mykte opp byen for Yves Saint Laurent. To netter i et hånplukkert riad innenfor bymurene.", fr: "Trois jours suffisent pour que Marrakech laisse une empreinte — à condition de les passer bien. Matinée lente dans la médina, déjeuner marocain dans la cour d'un riad privé, et clôture dans les jardins qui ont adouci la ville pour Yves Saint Laurent. Deux nuits dans un riad soigneusement sélectionné intra-muros." },
    idealFor: { en: "Couples & first-timers", no: "Par og førstereisende", fr: "Couples & premiers voyageurs" },
    highlights: [
      { en: "Guided 3-hour medina walk", no: "Guidet 3-timers medinavandr­ing", fr: "Balade guidée de 3 h dans la médina" },
      { en: "Lunch at a hidden riad", no: "Lunsj i et skjult riad", fr: "Déjeuner dans un riad caché" },
      { en: "Traditional hammam & gommage", no: "Tradisjonelt hammam & gommage", fr: "Hammam traditionnel & gommage" },
      { en: "Jardin Majorelle + YSL Museum", no: "Jardin Majorelle + YSL-museet", fr: "Jardin Majorelle + Musée YSL" },
      { en: "Two nights in a boutique riad", no: "To netter i et boutique-riad", fr: "Deux nuits dans un riad de charme" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival · the first call to prayer", no: "Ankomst · det første bønneropet", fr: "Arrivée · le premier appel à la prière" }, text: { en: "Private airport pickup. Transfer to your riad inside the medina. Mint tea welcome. Optional rooftop sunset over the medina. Light dinner walking distance from the riad.", no: "Privat flyplass­henting. Transfer til riaden din inne i medina. Velkomst med myntete. Valgfri solnedgang fra taket over medina. Lett middag i gangavstand fra riaden.", fr: "Prise en charge privée à l'aéroport. Transfert vers votre riad dans la médina. Accueil au thé à la menthe. Coucher de soleil en option depuis le toit. Dîner léger à deux pas du riad." } },
      { day: 2, route: { en: "The medina, on foot", no: "Medina til fots", fr: "La médina, à pied" }, text: { en: "Breakfast in the courtyard. Guided 3-hour medina walk: Bahia Palace, the spice souk, Ben Youssef Madrasa, the dyers' quarter. Lunch at a partner riad — three courses. Free afternoon. Traditional hammam & gommage at 17:30. Dinner at Nomad or Le Jardin.", no: "Frokost i gårdhagen. Guidet 3-timers medinavandr­ing: Bahia-palasset, krydder­souken, Ben Youssef Madrasa, fargernes kvartal. Lunsj i et partner-riad — tre retter. Fri ettermiddag. Tradisjonelt hammam & gommage kl. 17:30. Middag på Nomad eller Le Jardin.", fr: "Petit-déjeuner dans le patio. Balade guidée de 3 h dans la médina : Palais Bahia, souk aux épices, Medersa Ben Youssef, le quartier des teinturiers. Déjeuner dans un riad partenaire — trois plats. Après-midi libre. Hammam traditionnel & gommage à 17h30. Dîner au Nomad ou au Jardin." } },
      { day: 3, route: { en: "Majorelle, then home", no: "Majorelle, så hjem", fr: "Majorelle, puis le retour" }, text: { en: "Slow breakfast. Final souk run. Visit Jardin Majorelle and the YSL Museum (tickets pre-booked). Light lunch garden-side. Private transfer to RAK three hours before flight.", no: "Rolig frokost. Siste soukrunde. Besøk Jardin Majorelle og YSL-museet (billetter forhåndsbestilt). Lett lunsj i hagen. Privat transfer til RAK tre timer før flyet.", fr: "Petit-déjeuner tranquille. Dernier tour du souk. Visite du Jardin Majorelle et du Musée YSL (billets pré-réservés). Déjeuner léger côté jardin. Transfert privé vers RAK trois heures avant le vol." } },
    ],
    included: [
      { en: "All private transfers (airport ⇄ riad, riad ⇄ Majorelle) in an air-conditioned vehicle with English-speaking driver", no: "Alle private transferer (flyplass ⇄ riad, riad ⇄ Majorelle) i klimaanlegg kjøretøy med engelsktalende sjåfør", fr: "Tous les transferts privés (aéroport ⇄ riad, riad ⇄ Majorelle) en véhicule climatisé avec chauffeur anglophone" },
      { en: "Two nights in a hand-picked boutique riad inside the medina (4★ equivalent), with breakfast", no: "To netter i et hånplukkert boutique-riad inne i medina (4★-ekvivalent), med frokost", fr: "Deux nuits dans un riad de charme soigneusement sélectionné intra-muros (équivalent 4★), avec petit-déjeuner" },
      { en: "Licensed local guide for the 3-hour medina walking tour", no: "Lisensiert lokal guide for den 3 timer lange medinavandr­ingen", fr: "Guide local agréé pour la visite à pied de 3 h dans la médina" },
      { en: "Lunch on Day 02 at a partner riad (three courses)", no: "Lunsj dag 02 i et partner-riad (tre retter)", fr: "Déjeuner le Jour 02 dans un riad partenaire (trois plats)" },
      { en: "60-minute traditional hammam & gommage at a private spa", no: "60 minutters tradisjonelt hammam & gommage på et privat spa", fr: "Hammam traditionnel de 60 min & gommage dans un spa privé" },
      { en: "Skip-the-line tickets to Jardin Majorelle and YSL Museum", no: "Billetter uten kø til Jardin Majorelle og YSL-museet", fr: "Billets coupe-file pour le Jardin Majorelle et le Musée YSL" },
      { en: "24/7 in-country support from the Marrakech Story team (WhatsApp)", no: "24/7 støtte i landet fra Marrakech Story-teamet (WhatsApp)", fr: "Assistance 24h/24 sur place par l'équipe Marrakech Story (WhatsApp)" },
      { en: "Welcome briefing and printed walking map of the medina", no: "Velkomstbriefing og trykt vandrekart over medina", fr: "Briefing d'accueil et carte de balade imprimée de la médina" },
    ],
    excluded: [
      { en: "International flights to/from Marrakech", no: "Internasjonale flyreiser til/fra Marrakech", fr: "Vols internationaux vers/depuis Marrakech" },
      { en: "Dinners (we book the tables; you settle the bill)", no: "Middager (vi bestiller bordene; du betaler regningen)", fr: "Dîners (nous réservons les tables ; vous réglez l'addition)" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommandée)" },
      { en: "Tips for driver, guide and riad staff", no: "Tips til sjåfør, guide og riad-ansatte", fr: "Pourboires pour le chauffeur, le guide et le personnel du riad" },
      { en: "Personal shopping", no: "Personlig shopping", fr: "Achats personnels" },
      { en: "Visa fees if applicable", no: "Visumavgifter hvis aktuelt", fr: "Frais de visa le cas échéant" },
    ],
  },

  // ===== 4D3N — The Marrakech & Agafay =====
  {
    slug: "marrakech-agafay", chapter: "02",
    title: { en: "The Marrakech & Agafay", no: "Marrakech & Agafay", fr: "Marrakech & Agafay" },
    duration: "4D3N", days: 4, nights: 3,
    route: "Marrakech → Agafay → Marrakech",
    priceFromEUR: 790,
    img: "assets/photos/agafay-valley-marrakech-74.jpg",
    themeTags: ["Medina", "Desert", "Stargazing"],
    teaser: { en: "Three nights in the medina, one in the stone desert under the stars.", no: "Medina-grunnlaget, pluss én velplassert natt i steinørkenen under stjernene.", fr: "La base médina, plus une nuit bien choisie dans le désert de pierres sous les étoiles." },
    overview: { en: "The same medina foundation as the Weekend, with a single, well-placed night in the Agafay — the rocky lunar desert forty minutes from the city. You leave the medina after lunch, watch the Atlas turn pink at sunset from a luxury tented camp, ride a camel if you wish, and return the next morning to one final Marrakech afternoon.", no: "Det samme medina-grunnlaget som helgeturen, med én velplassert natt i Agafay — den steinete månelandskapsørkenen førti minutter fra byen. Du forlater medina etter lunsj, ser Atlas bli rosa i solnedgangen fra en luksusleirplass, rir gjerne kamel, og vender tilbake neste morgen til en siste Marrakech-ettermiddag.", fr: "La même base médina que le Week-end, avec une unique nuit bien choisie à l'Agafay — le désert lunaire et rocheux à quarante minutes de la ville. Vous quittez la médina après le déjeuner, regardez l'Atlas virer au rose au coucher du soleil depuis un camp de luxe, montez un chameau si vous le souhaitez, et rentrez le lendemain matin pour un ultime après-midi marrakchi." },
    idealFor: { en: "Couples seeking a soft taste of desert", no: "Par som vil ha et mykt glimt av ørkenen", fr: "Couples en quête d'un avant-goût du désert" },
    highlights: [
      { en: "Guided 3-hour medina walk", no: "Guidet 3-timers medinavandr­ing", fr: "Balade guidée de 3 h dans la médina" },
      { en: "Lunch at a hidden riad", no: "Lunsj i et skjult riad", fr: "Déjeuner dans un riad caché" },
      { en: "Drive to the Agafay", no: "Kjøretur til Agafay", fr: "Route vers l'Agafay" },
      { en: "Camel ride at sunset", no: "Kamelritt i solnedgang", fr: "Balade à dos de chameau au coucher du soleil" },
      { en: "Dinner under the stars + stargazing", no: "Middag under stjernene + stjernekikking", fr: "Dîner sous les étoiles + observation du ciel" },
      { en: "Sunrise from your tent terrace", no: "Soloppgang fra teltterrassen din", fr: "Lever de soleil depuis la terrasse de votre tente" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival in Marrakech", no: "Ankomst i Marrakech", fr: "Arrivée à Marrakech" }, text: { en: "Private airport pickup. Transfer to riad. Mint tea, map orientation. Optional sunset rooftop walk to Jemaa el-Fnaa. Dinner suggestions.", no: "Privat henting på flyplassen. Transfer til riad. Myntete og kart­orientering. Valgfri solnedgangstur på taket mot Jemaa el-Fnaa. Middagsanbefalinger.", fr: "Prise en charge privée à l'aéroport. Transfert vers le riad. Thé à la menthe et orientation sur plan. Balade sur les toits au coucher du soleil vers Jemaa el-Fnaa en option. Suggestions de dîner." } },
      { day: 2, route: { en: "The medina, slowly", no: "Medina, i rolig tempo", fr: "La médina, en douceur" }, text: { en: "Guided medina walking tour (3h): Bahia Palace, souks, Ben Youssef Madrasa. Lunch at a hidden riad. Free afternoon — hammam suggested at 17:00. Dinner at Le Jardin or Limoni.", no: "Guidet medinavandr­ing (3t): Bahia-palasset, souker, Ben Youssef Madrasa. Lunsj i et skjult riad. Fri ettermiddag — hammam anbefales kl. 17:00. Middag på Le Jardin eller Limoni.", fr: "Visite à pied guidée de la médina (3h) : Palais Bahia, souks, Medersa Ben Youssef. Déjeuner dans un riad caché. Après-midi libre — hammam recommandé à 17h. Dîner au Jardin ou au Limoni." } },
      { day: 3, route: { en: "Into the Agafay", no: "Ut til Agafay", fr: "Cap sur l'Agafay" }, text: { en: "Late checkout. Driver collects you with luggage. Lunch en route at a Berber café with Atlas views. Arrival at the luxury Agafay camp. Camel ride at sunset (optional). Sunset apéritif. Dinner under the stars — set Moroccan menu, three courses. Stargazing by the fire.", no: "Sen utsjekk. Sjåføren henter deg med bagasje. Lunsj underveis på en berberkafé med Atlasutsikt. Ankomst til luksusleirplassen i Agafay. Kamelritt i solnedgang (valgfritt). Aperitiff i solnedgangen. Middag under stjernene — fast marokkansk meny, tre retter. Stjernekikking ved bålet.", fr: "Check-out tardif. Le chauffeur vous récupère avec les bagages. Déjeuner en route dans un café berbère avec vue sur l'Atlas. Arrivée au camp de luxe de l'Agafay. Balade à dos de chameau au coucher du soleil (optionnel). Apéritif au crépuscule. Dîner sous les étoiles — menu marocain fixe, trois plats. Observation des étoiles au coin du feu." } },
      { day: 4, route: { en: "Camp sunrise & home", no: "Soloppgang i leiren og hjemreise", fr: "Lever de soleil au camp & retour" }, text: { en: "Sunrise from your tent terrace, coffee brought to you. Slow camp breakfast. Return drive to Marrakech (40 min). Day room at the riad if your flight is late. Private transfer to RAK.", no: "Soloppgang fra teltterrassen, kaffe servert til deg. Rolig frokost i leiren. Tilbakekjøring til Marrakech (40 min). Dagrom i riaden om flyet er sent. Privat transfer til RAK.", fr: "Lever de soleil depuis la terrasse de la tente, café apporté. Petit-déjeuner tranquille au camp. Retour en voiture vers Marrakech (40 min). Chambre de jour au riad si votre vol est tardif. Transfert privé vers RAK." } },
    ],
    included: [
      { en: "All private transfers in an air-conditioned vehicle with English-speaking driver", no: "Alle private transferer i klimaanlegg kjøretøy med engelsktalende sjåfør", fr: "Tous les transferts privés en véhicule climatisé avec chauffeur anglophone" },
      { en: "Two nights in a hand-picked riad in the medina, with breakfast", no: "To netter i et hånplukkert riad i medina, med frokost", fr: "Deux nuits dans un riad soigneusement sélectionné dans la médina, avec petit-déjeuner" },
      { en: "One night in a luxury tented camp in the Agafay desert (private en-suite tent)", no: "Én natt i en luksusleirplass i Agafay-ørkenen (privat telt med bad)", fr: "Une nuit dans un camp de luxe à l'Agafay (tente privative avec salle de bain)" },
      { en: "Licensed guide for the 3-hour Marrakech medina walking tour", no: "Lisensiert guide for den 3 timer lange medinavandr­ingen i Marrakech", fr: "Guide agréé pour la visite à pied de 3 h dans la médina de Marrakech" },
      { en: "Lunch on Day 02 at a partner riad", no: "Lunsj dag 02 i et partner-riad", fr: "Déjeuner le Jour 02 dans un riad partenaire" },
      { en: "Lunch on Day 03 en route to Agafay", no: "Lunsj dag 03 på vei til Agafay", fr: "Déjeuner le Jour 03 en route vers l'Agafay" },
      { en: "Dinner on Day 03 at the camp (set menu, three courses)", no: "Middag dag 03 i leiren (fast meny, tre retter)", fr: "Dîner le Jour 03 au camp (menu fixe, trois plats)" },
      { en: "Camel ride at sunset (or substitute activity)", no: "Kamelritt i solnedgang (eller alternativ aktivitet)", fr: "Balade à dos de chameau au coucher du soleil (ou activité de substitution)" },
      { en: "24/7 WhatsApp support from the Marrakech Story team", no: "24/7 WhatsApp-støtte fra Marrakech Story-teamet", fr: "Assistance WhatsApp 24h/24 de l'équipe Marrakech Story" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Marrakech dinners (Day 01 and Day 02)", no: "Middager i Marrakech (dag 01 og dag 02)", fr: "Dîners à Marrakech (Jours 01 et 02)" },
      { en: "Hammam & spa (recommended add-on)", no: "Hammam & spa (anbefalt tillegg)", fr: "Hammam & spa (supplément recommandé)" },
      { en: "Quad bikes / buggies in Agafay", no: "Firhjuling / buggy i Agafay", fr: "Quads / buggies à l'Agafay" },
      { en: "Alcohol at the camp (BYO is permitted)", no: "Alkohol i leiren (medbring selv er tillatt)", fr: "Alcool au camp (apportez le vôtre, c'est autorisé)" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" },
    ],
  },

  // ===== 5D4N — The Atlas & Sahara Sampler =====
  {
    slug: "atlas-sahara-sampler", chapter: "03",
    title: { en: "The Atlas & Sahara Sampler", no: "Atlas & Sahara-smakebiten", fr: "Avant-goût Atlas & Sahara" },
    duration: "5D4N", days: 5, nights: 4,
    route: "Marrakech → Aït Ben Haddou → Dades → Merzouga → Marrakech",
    priceFromEUR: 990,
    img: "assets/photos/lodge-atlas-3-1-scaled.jpg.webp",
    badge: { en: "MOST LOVED", no: "MER ELSKET", fr: "PLUS AIMÉ" },
    themeTags: ["Atlas pass", "Sahara dunes", "UNESCO"],
    teaser: { en: "Marrakech, the High Atlas pass, one night in the true Sahara at Merzouga.", no: "Marrakech, Atlaspasset, og én natt i ekte Sahara ved Merzouga.", fr: "Marrakech, le col de l'Atlas, et une nuit dans le vrai Sahara à Merzouga." },
    overview: { en: "The shortest route to the real Sahara. We cross the Tizi n'Tichka pass, stop at the UNESCO village of Aït Ben Haddou, sleep in the Dades Valley, then push into Merzouga for a night in the orange Erg Chebbi dunes. You leave the city for the dunes and come back changed.", no: "Den korteste veien til ekte Sahara. Vi krysser Tizi n'Tichka-passet, stopper i UNESCO-landsbyen Aït Ben Haddou, overnatter i Dades-dalen og fortsetter til Merzouga for en natt i de oransje Erg Chebbi-dynene. Du forlater byen mot dynene og kommer tilbake forandret.", fr: "La route la plus courte vers le vrai Sahara. On traverse le col du Tizi n'Tichka, on s'arrête au village UNESCO d'Aït Ben Haddou, on dort dans la vallée du Dadès, puis on pousse jusqu'à Merzouga pour une nuit dans les dunes orangées de l'Erg Chebbi. Vous partez vers les dunes et vous revenez changé." },
    idealFor: { en: "First-timers who want the dunes", no: "Førstereisende som vil se dynene", fr: "Premiers voyageurs en quête des dunes" },
    highlights: [
      { en: "Tizi n'Tichka pass at 2,260 m", no: "Tizi n'Tichka-passet på 2 260 m", fr: "Col du Tizi n'Tichka à 2 260 m" },
      { en: "Aït Ben Haddou (UNESCO)", no: "Aït Ben Haddou (UNESCO)", fr: "Aït Ben Haddou (UNESCO)" },
      { en: "Dades & Todra gorges", no: "Dades- og Todra-kløftene", fr: "Gorges du Dadès & du Todra" },
      { en: "Camel caravan into Erg Chebbi", no: "Kamelkaravane inn i Erg Chebbi", fr: "Caravane de chameaux vers l'Erg Chebbi" },
      { en: "Sunrise from the dunes", no: "Soloppgang fra dynene", fr: "Lever de soleil depuis les dunes" },
      { en: "Luxury tented camp", no: "Luksusleirplass", fr: "Camp de luxe sous tente" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival in Marrakech", no: "Ankomst i Marrakech", fr: "Arrivée à Marrakech" }, text: { en: "Private airport pickup. Transfer to riad. Mint tea, orientation. Optional rooftop sunset. Dinner walking distance from the riad.", no: "Privat henting på flyplassen. Transfer til riad. Myntete og orientering. Valgfri solnedgang fra taket. Middag i gangavstand fra riaden.", fr: "Prise en charge privée à l'aéroport. Transfert vers le riad. Thé à la menthe et orientation. Coucher de soleil depuis les toits en option. Dîner à deux pas du riad." } },
      { day: 2, route: { en: "Marrakech → Dades Valley", no: "Marrakech → Dades-dalen", fr: "Marrakech → Vallée du Dadès" }, text: { en: "Early breakfast. Climb the High Atlas via Tizi n'Tichka with photo stops. Coffee at a roadside Berber café. Guided walk through Aït Ben Haddou (UNESCO). Lunch overlooking the ksar. Continue via Ouarzazate. Arrival at a kasbah hotel in Dades. Dinner, early night.", no: "Tidlig frokost. Klatre Høyatlas via Tizi n'Tichka med fotostopp. Kaffe på en berber­kafé langs veien. Guidet tur gjennom Aït Ben Haddou (UNESCO). Lunsj med utsikt over ksaren. Videre via Ouarzazate. Ankomst til et kasbah-hotell i Dades. Middag, tidlig kveld.", fr: "Petit-déjeuner tôt. Montée du Haut Atlas via le Tizi n'Tichka avec arrêts photos. Café dans un café berbère en bord de route. Balade guidée à Aït Ben Haddou (UNESCO). Déjeuner face au ksar. Continuation via Ouarzazate. Arrivée à un hôtel-kasbah dans le Dadès. Dîner, coucher tôt." } },
      { day: 3, route: { en: "Dades → Merzouga", no: "Dades → Merzouga", fr: "Dadès → Merzouga" }, text: { en: "Drive through the Dades Gorges. 30-minute walk in Todra Gorge between 300m cliffs. Lunch in Tinghir. Arrival in Merzouga at the edge of Erg Chebbi. Camel caravan into the dunes (1h) — sunset arrival at the luxury camp. Welcome tea and dates. Dinner around the fire with Berber music.", no: "Kjøring gjennom Dades-kløftene. 30 minutters vandring i Todra-kløften mellom 300 m høye klipper. Lunsj i Tinghir. Ankomst Merzouga ved kanten av Erg Chebbi. Kamelkaravane inn i dynene (1t) — ankomst til luksusleirplassen i solnedgang. Velkomst med te og dadler. Middag rundt bålet med berbermusikk.", fr: "Route à travers les gorges du Dadès. Marche de 30 min dans les gorges du Todra entre des falaises de 300 m. Déjeuner à Tinghir. Arrivée à Merzouga au bord de l'Erg Chebbi. Caravane de chameaux dans les dunes (1h) — arrivée au camp de luxe au coucher du soleil. Thé et dattes de bienvenue. Dîner autour du feu avec musique berbère." } },
      { day: 4, route: { en: "Sahara sunrise & the return", no: "Sahara-soloppgang og hjemreisen", fr: "Lever de soleil sur le Sahara & retour" }, text: { en: "Wake-up call with coffee on your terrace at 06:00. Walk to the top of the nearest dune for sunrise. Camp breakfast. Return camel or 4×4 to Merzouga. Drive back to Marrakech via the direct route. Lunch en route. Arrival at the riad. Light dinner suggested in the medina.", no: "Vekking med kaffe på terrassen kl. 06:00. Gå til toppen av nærmeste dyne for soloppgang. Frokost i leiren. Tilbake med kamel eller 4×4 til Merzouga. Kjøring tilbake til Marrakech via direkteruten. Lunsj underveis. Ankomst til riaden. Lett middag anbefales i medina.", fr: "Réveil avec café sur la terrasse à 06h00. Montée au sommet de la dune la plus proche pour le lever de soleil. Petit-déjeuner au camp. Retour à Merzouga en chameau ou 4×4. Route vers Marrakech par l'itinéraire direct. Déjeuner en route. Arrivée au riad. Dîner léger conseillé dans la médina." } },
      { day: 5, route: { en: "Marrakech morning & departure", no: "Marrakech-morgen og avreise", fr: "Matinée à Marrakech & départ" }, text: { en: "Breakfast. Free morning — souks, Majorelle or pool. Light lunch suggested. Private transfer to RAK three hours before flight.", no: "Frokost. Fri morgen — souker, Majorelle eller basseng. Lett lunsj anbefales. Privat transfer til RAK tre timer før flyet.", fr: "Petit-déjeuner. Matinée libre — souks, Majorelle ou piscine. Déjeuner léger conseillé. Transfert privé vers RAK trois heures avant le vol." } },
    ],
    included: [
      { en: "All private transfers and a private vehicle with English-speaking driver for the full route", no: "Alle private transferer og privat kjøretøy med engelsktalende sjåfør for hele ruten", fr: "Tous les transferts privés et un véhicule privé avec chauffeur anglophone pour l'ensemble du trajet" },
      { en: "Three nights in boutique riads / hotel kasbahs with breakfast", no: "Tre netter i boutique-riader / kasbah-hoteller med frokost", fr: "Trois nuits dans des riads de charme / hôtels-kasbahs avec petit-déjeuner" },
      { en: "One night in a luxury tented camp at Erg Chebbi (private en-suite tent)", no: "Én natt i luksusleirplass ved Erg Chebbi (privat telt med bad)", fr: "Une nuit dans un camp de luxe à l'Erg Chebbi (tente privative avec salle de bain)" },
      { en: "Guided 1-hour walking tour of Aït Ben Haddou (UNESCO)", no: "Guidet 1-times vandring i Aït Ben Haddou (UNESCO)", fr: "Visite à pied guidée d'1 h à Aït Ben Haddou (UNESCO)" },
      { en: "Camel caravan into the desert at sunset (or 4×4 alternative)", no: "Kamelkaravane inn i ørkenen i solnedgang (eller 4×4 alternativ)", fr: "Caravane de chameaux dans le désert au coucher du soleil (ou alternative en 4×4)" },
      { en: "Dinner on Day 02 at the Dades hotel", no: "Middag dag 02 på Dades-hotellet", fr: "Dîner le Jour 02 à l'hôtel du Dadès" },
      { en: "Dinner on Day 03 at the desert camp", no: "Middag dag 03 i ørkenleiren", fr: "Dîner le Jour 03 au camp du désert" },
      { en: "Lunch stops on Day 02, 03 and 04 (fixed-menu basis)", no: "Lunsjestopp dag 02, 03 og 04 (fast meny)", fr: "Arrêts déjeuner les Jours 02, 03 et 04 (menu fixe)" },
      { en: "24/7 WhatsApp support", no: "24/7 WhatsApp-støtte", fr: "Assistance WhatsApp 24h/24" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Marrakech dinners (Day 01 and Day 04)", no: "Middager i Marrakech (dag 01 og dag 04)", fr: "Dîners à Marrakech (Jours 01 et 04)" },
      { en: "Drinks not included in set menus", no: "Drikke som ikke er inkludert i faste menyer", fr: "Boissons non comprises dans les menus fixes" },
      { en: "Hammam, spa, optional excursions", no: "Hammam, spa, valgfrie utflukter", fr: "Hammam, soins spa, excursions optionnelles" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" },
    ],
  },

  // ===== 7D6N — The Sahara Signature =====
  {
    slug: "sahara-signature", chapter: "04",
    title: { en: "The Sahara Signature", no: "Sahara Signaturreise", fr: "La Signature Sahara" },
    duration: "7D6N", days: 7, nights: 6,
    route: "Marrakech → Skoura → Merzouga → Marrakech",
    priceFromEUR: 1350,
    img: "assets/photos/marrakech-desert.jpg",
    badge: { en: "MOST BOOKED", no: "MEST BESTILT", fr: "PLUS RÉSERVÉ" },
    themeTags: ["Sahara", "Slow travel", "Palm grove"],
    teaser: { en: "Our most-requested route. Marrakech, the south, the dunes, the slow return.", no: "Vår mest etterspurte rute. Marrakech, sør, dynene, den rolige returreisen.", fr: "Notre itinéraire le plus demandé. Marrakech, le sud, les dunes, le retour apaisé." },
    overview: { en: "The Sahara Sampler's big sister — the same southern route, but with the breathing room it deserves. Two nights in Marrakech, a slower descent through the Atlas with an overnight in Skoura's palm grove, two nights in the desert instead of one, and a final Marrakech evening to land softly before flying home.", no: "Den store søsteren til Sahara-smakebiten — den samme sørlige ruten, men med lufterommet den fortjener. To netter i Marrakech, en roligere nedstigning gjennom Atlas med overnatting i Skourapalmegroven, to netter i ørkenen i stedet for én, og en siste Marrakech-kveld for å lande mykt før hjemflyet.", fr: "La grande sœur de l'Avant-goût Sahara — le même itinéraire sud, mais avec l'espace pour respirer qu'il mérite. Deux nuits à Marrakech, une descente plus lente à travers l'Atlas avec une nuit dans la palmeraie de Skoura, deux nuits dans le désert au lieu d'une, et une dernière soirée marrakchie pour atterrir en douceur avant de rentrer." },
    idealFor: { en: "Couples, families, slow-travel lovers", no: "Par, familier og slow-travel-entusiaster", fr: "Couples, familles, amateurs de slow travel" },
    highlights: [
      { en: "Two nights in the Sahara, not one", no: "To netter i Sahara, ikke én", fr: "Deux nuits au Sahara, pas une" },
      { en: "Skoura palm-grove kasbah", no: "Kasbah i Skoura-palmegroven", fr: "Kasbah dans la palmeraie de Skoura" },
      { en: "Guided Marrakech medina walk", no: "Guidet medinavandr­ing i Marrakech", fr: "Balade guidée dans la médina de Marrakech" },
      { en: "Aït Ben Haddou (UNESCO)", no: "Aït Ben Haddou (UNESCO)", fr: "Aït Ben Haddou (UNESCO)" },
      { en: "Berber family visit", no: "Besøk hos berberfamilie", fr: "Visite d'une famille berbère" },
      { en: "A full free day in the dunes", no: "En hel fri dag i dynene", fr: "Une journée entière libre dans les dunes" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival in Marrakech", no: "Ankomst i Marrakech", fr: "Arrivée à Marrakech" }, text: { en: "Private airport pickup. Transfer to riad. Mint tea. Rooftop dinner suggestion.", no: "Privat henting på flyplassen. Transfer til riad. Myntete. Middagsanbefaling fra taket.", fr: "Prise en charge privée à l'aéroport. Transfert vers le riad. Thé à la menthe. Suggestion de dîner en terrasse." } },
      { day: 2, route: { en: "Marrakech, guided", no: "Marrakech med guide", fr: "Marrakech, avec guide" }, text: { en: "Guided medina tour (3h): souks, palaces, madrasa. Lunch at a partner riad. Free afternoon — hammam at 17:00 suggested. Dinner — Nomad rooftop recommended.", no: "Guidet medinatur (3t): souker, palasser, madrasa. Lunsj i et partner-riad. Fri ettermiddag — hammam kl. 17:00 anbefales. Middag — Nomad-takterrassen anbefales.", fr: "Visite guidée de la médina (3h) : souks, palais, medersa. Déjeuner dans un riad partenaire. Après-midi libre — hammam à 17h conseillé. Dîner — terrasse du Nomad recommandée." } },
      { day: 3, route: { en: "Atlas pass to Skoura palm grove", no: "Atlaspasset til Skoura-palmegroven", fr: "Col de l'Atlas jusqu'à la palmeraie de Skoura" }, text: { en: "Cross Tizi n'Tichka with photo stops. Aït Ben Haddou guided walk. Lunch at a ksar restaurant. Continue via Ouarzazate to Skoura. Arrival at an authentic kasbah in the palm grove. Dinner at the kasbah.", no: "Kryss Tizi n'Tichka med fotostopp. Guidet tur i Aït Ben Haddou. Lunsj på en ksarrestaurant. Videre via Ouarzazate til Skoura. Ankomst til en autentisk kasbah i palmegroven. Middag i kasbah­en.", fr: "Traversée du Tizi n'Tichka avec arrêts photos. Balade guidée à Aït Ben Haddou. Déjeuner dans un restaurant du ksar. Continuation via Ouarzazate jusqu'à Skoura. Arrivée dans une kasbah authentique dans la palmeraie. Dîner à la kasbah." } },
      { day: 4, route: { en: "Skoura → Merzouga", no: "Skoura → Merzouga", fr: "Skoura → Merzouga" }, text: { en: "Departure via the Valley of Roses. Dades Gorges photo stops. Todra Gorge walk. Lunch in Tinghir. Arrival Merzouga. Camel caravan into Erg Chebbi at sunset. Welcome at the luxury camp. Dinner around the fire with Berber music.", no: "Avreise via Rosedalen. Fotostopp i Dades-kløftene. Vandring i Todra-kløften. Lunsj i Tinghir. Ankomst Merzouga. Kamelkaravane inn i Erg Chebbi i solnedgang. Velkomst i luksusleirplassen. Middag rundt bålet med berbermusikk.", fr: "Départ via la Vallée des Roses. Arrêts photos dans les gorges du Dadès. Marche dans les gorges du Todra. Déjeuner à Tinghir. Arrivée à Merzouga. Caravane de chameaux vers l'Erg Chebbi au coucher du soleil. Accueil au camp de luxe. Dîner autour du feu avec musique berbère." } },
      { day: 5, route: { en: "A full day in the dunes", no: "En hel dag i dynene", fr: "Une journée entière dans les dunes" }, text: { en: "The day we built this itinerary around. No driving. Sunrise on the dunes. Slow camp breakfast. Optional Berber family visit (1.5h, with tea). Lunch at the camp. Free afternoon — sandboarding, reading, nap, dune walks. Optional 4×4 excursion to the black desert / fossils. Sundowner. Final desert dinner.", no: "Dagen vi bygde denne reiseplanen rundt. Ingen kjøring. Soloppgang over dynene. Rolig frokost i leiren. Valgfritt besøk hos berberfamilie (1,5t, med te). Lunsj i leiren. Fri ettermiddag — sand­boarding, lesing, lur, dynetur. Valgfri 4×4 til den svarte ørkenen / fossiler. Sundowner. Siste ørken­middag.", fr: "Le jour autour duquel nous avons conçu cet itinéraire. Pas de route. Lever de soleil sur les dunes. Petit-déjeuner tranquille au camp. Visite optionnelle d'une famille berbère (1h30, avec thé). Déjeuner au camp. Après-midi libre — sandboard, lecture, sieste, promenades dans les dunes. Excursion optionnelle en 4×4 dans le désert noir / fossiles. Sundowner. Dernier dîner dans le désert." } },
      { day: 6, route: { en: "Return to Marrakech", no: "Tilbake til Marrakech", fr: "Retour à Marrakech" }, text: { en: "Sunrise. Breakfast. Camel or 4×4 back to Merzouga. Drive back to Marrakech. Lunch en route. Arrival at your riad. Farewell dinner in the medina (we book a special table).", no: "Soloppgang. Frokost. Kamel eller 4×4 tilbake til Merzouga. Kjøring tilbake til Marrakech. Lunsj underveis. Ankomst til riaden. Avskjedsmiddag i medina (vi bestiller et spesialbord).", fr: "Lever de soleil. Petit-déjeuner. Chameau ou 4×4 retour à Merzouga. Route vers Marrakech. Déjeuner en route. Arrivée au riad. Dîner d'adieu dans la médina (nous réservons une table spéciale)." } },
      { day: 7, route: { en: "Departure", no: "Avreise", fr: "Départ" }, text: { en: "Breakfast. Free morning for shopping or pool. Private transfer to RAK three hours before flight.", no: "Frokost. Fri morgen for shopping eller basseng. Privat transfer til RAK tre timer før flyet.", fr: "Petit-déjeuner. Matinée libre pour le shopping ou la piscine. Transfert privé vers RAK trois heures avant le vol." } },
    ],
    included: [
      { en: "All private transfers and a dedicated private vehicle with English-speaking driver for the full route", no: "Alle private transferer og dedikert privat kjøretøy med engelsktalende sjåfør for hele ruten", fr: "Tous les transferts privés et un véhicule privé dédié avec chauffeur anglophone pour l'ensemble du trajet" },
      { en: "Three nights in boutique riads, two in a kasbah / hotel, two in a luxury Sahara camp — all breakfasts", no: "Tre netter i boutique-riader, to i kasbah / hotell, to i luksusleirplass i Sahara — alle frokoster", fr: "Trois nuits dans des riads de charme, deux dans une kasbah / hôtel, deux dans un camp de luxe au Sahara — tous les petits-déjeuners" },
      { en: "Guided 3-hour Marrakech medina walking tour", no: "Guidet 3-timers medinavandr­ing i Marrakech", fr: "Visite à pied guidée de 3 h dans la médina de Marrakech" },
      { en: "Guided 1-hour visit to Aït Ben Haddou (UNESCO)", no: "Guidet 1-times besøk i Aït Ben Haddou (UNESCO)", fr: "Visite guidée d'1 h à Aït Ben Haddou (UNESCO)" },
      { en: "Camel caravan at sunset into the Sahara (or 4×4 alternative)", no: "Kamelkaravane i solnedgang inn i Sahara (eller 4×4 alternativ)", fr: "Caravane de chameaux au coucher du soleil dans le Sahara (ou alternative en 4×4)" },
      { en: "Six lunches and six dinners across the route (set menus where applicable)", no: "Seks lunsjer og seks middager langs ruten (fast meny der det er aktuelt)", fr: "Six déjeuners et six dîners sur l'itinéraire (menus fixes selon les étapes)" },
      { en: "Optional Berber family visit at no extra cost", no: "Valgfritt besøk hos berberfamilie uten ekstra kostnad", fr: "Visite optionnelle d'une famille berbère sans supplément" },
      { en: "Sandboards available at the camp", no: "Sandboards tilgjengelig i leiren", fr: "Sandboards disponibles au camp" },
      { en: "24/7 WhatsApp support throughout", no: "24/7 WhatsApp-støtte gjennom hele reisen", fr: "Assistance WhatsApp 24h/24 tout au long du voyage" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Drinks outside set menus", no: "Drikke utenom faste menyer", fr: "Boissons hors menus fixes" },
      { en: "Hammam, spa treatments", no: "Hammam, spa-behandlinger", fr: "Hammam, soins spa" },
      { en: "4×4 excursion in the dunes (optional)", no: "4×4-utflukt i dynene (valgfritt)", fr: "Excursion en 4×4 dans les dunes (optionnel)" },
      { en: "Quad / buggy add-ons", no: "Quad / buggy-tillegg", fr: "Suppléments quad / buggy" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips for driver, guide, camp staff", no: "Tips til sjåfør, guide og leirpersonale", fr: "Pourboires pour le chauffeur, le guide et le personnel du camp" },
    ],
  },

  // ===== 10D9N — The Imperial Circuit =====
  {
    slug: "imperial-circuit", chapter: "05",
    title: { en: "The Imperial Circuit", no: "Det keiserlige kretsløpet", fr: "Le Circuit Impérial" },
    duration: "10D9N", days: 10, nights: 9,
    route: "Tangier → Chefchaouen → Fez → Sahara → Marrakech",
    priceFromEUR: 2150,
    img: "assets/photos/about-us-hq-31-scaled.jpg.webp",
    themeTags: ["Imperial cities", "Sahara", "Slow travel"],
    teaser: { en: "North and south joined. Tangier, Chefchaouen, Fez, the Sahara, Marrakech.", no: "Nord og sør forent. Tanger, Chefchaouen, Fes, Sahara, Marrakech.", fr: "Nord et sud réunis. Tanger, Chefchaouen, Fès, le Sahara, Marrakech." },
    overview: { en: "A circuit, not a loop. You land in the north, drift through Chefchaouen's blue alleys, give Fez two full days, descend to the Sahara, then end where most people begin — Marrakech. The country unfolds at the right pace, and you fly out from the south knowing you actually saw Morocco.", no: "Et kretsløp, ikke en rundtur. Du lander i nord, vandrer gjennom Chefchaouens blå smug, gir Fes to fulle dager, stiger ned til Sahara og avslutter der de fleste begynner — Marrakech. Landet åpner seg i riktig tempo, og du flyr sørfra med visshet om at du faktisk så Marokko.", fr: "Un circuit, pas une boucle. Vous atterrissez au nord, vous dérivez dans les ruelles bleues de Chefchaouen, vous consacrez deux jours entiers à Fès, vous descendez vers le Sahara, puis vous terminez là où la plupart commencent — Marrakech. Le pays se déroule au bon rythme, et vous reprenez l'avion depuis le sud en sachant que vous avez vraiment vu le Maroc." },
    idealFor: { en: "Travellers who want the whole country", no: "Reisende som vil se hele landet", fr: "Voyageurs qui veulent voir tout le pays" },
    highlights: [
      { en: "The blue medina of Chefchaouen", no: "Den blå medina i Chefchaouen", fr: "La médina bleue de Chefchaouen" },
      { en: "Volubilis Roman ruins", no: "Romerruinene i Volubilis", fr: "Les ruines romaines de Volubilis" },
      { en: "Full-day specialist Fez tour", no: "Heldags spesialisttur i Fes", fr: "Visite spécialisée de Fès toute la journée" },
      { en: "Cedar forests of Ifrane + Barbary macaques", no: "Sedertreskogene i Ifrane + berberap­er", fr: "Forêts de cèdres d'Ifrane + macaques de Barbarie" },
      { en: "Camel caravan into Erg Chebbi", no: "Kamelkaravane inn i Erg Chebbi", fr: "Caravane de chameaux vers l'Erg Chebbi" },
      { en: "Aït Ben Haddou + Atlas pass", no: "Aït Ben Haddou + Atlaspasset", fr: "Aït Ben Haddou + col de l'Atlas" },
      { en: "Marrakech medina day", no: "Medinadag i Marrakech", fr: "Journée médina à Marrakech" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival Tangier · north to Chefchaouen", no: "Ankomst Tanger · nordover til Chefchaouen", fr: "Arrivée Tanger · cap au nord vers Chefchaouen" }, text: { en: "Private airport pickup at Tangier (TNG). Transfer (~2.5h) to Chefchaouen via the Rif. Check-in at a boutique hotel. Walk to the Spanish Mosque viewpoint for sunset over the blue town. Dinner at Casa Aladdin or Beldi Bab Ssour.", no: "Privat henting på flyplassen i Tanger (TNG). Transfer (~2,5t) til Chefchaouen via Rif-fjellene. Innsjekk på et boutique-hotell. Tur til Den spanske moskeens utsiktspunkt for solnedgang over den blå byen. Middag på Casa Aladdin eller Beldi Bab Ssour.", fr: "Prise en charge privée à l'aéroport de Tanger (TNG). Transfert (~2h30) vers Chefchaouen via le Rif. Enregistrement dans un hôtel de charme. Marche jusqu'au belvédère de la Mosquée Espagnole pour le coucher de soleil sur la ville bleue. Dîner au Casa Aladdin ou au Beldi Bab Ssour." } },
      { day: 2, route: { en: "Chefchaouen, slowly", no: "Chefchaouen, i rolig tempo", fr: "Chefchaouen, en douceur" }, text: { en: "Guided walk through the blue medina (2.5h): the kasbah, Plaza Uta el-Hammam, the dyers' alleys. Lunch at a hidden riad. Free afternoon — optional walk to Ras El-Maa waterfall. Free evening.", no: "Guidet vandring gjennom den blå medina (2,5t): kasbah­en, Plaza Uta el-Hammam, fargernes smug. Lunsj i et skjult riad. Fri ettermiddag — valgfri tur til Ras El-Maa-fossen. Fri kveld.", fr: "Balade guidée dans la médina bleue (2h30) : la casbah, Plaza Uta el-Hammam, les ruelles des teinturiers. Déjeuner dans un riad caché. Après-midi libre — promenade optionnelle jusqu'à la cascade Ras El-Maa. Soirée libre." } },
      { day: 3, route: { en: "Chefchaouen → Fez", no: "Chefchaouen → Fes", fr: "Chefchaouen → Fès" }, text: { en: "Departure (~4h drive, with stops). Lunch at Volubilis (Roman ruins) with a brief guided visit (1h). Arrival in Fez. Check-in at a riad in the medina. Rooftop drink as the city calls the evening prayer. Dinner at the riad.", no: "Avreise (~4t kjøring med stopp). Lunsj ved Volubilis (romerruinene) med kort guidet besøk (1t). Ankomst til Fes. Innsjekk i et riad i medina. Takedrikk mens byen kaller til kveldsbonn. Middag i riaden.", fr: "Départ (~4h de route avec arrêts). Déjeuner à Volubilis (ruines romaines) avec une brève visite guidée (1h). Arrivée à Fès. Enregistrement dans un riad de la médina. Verre en terrasse pendant l'appel à la prière du soir. Dîner au riad." } },
      { day: 4, route: { en: "Fez, in depth", no: "Fes i dybden", fr: "Fès, en profondeur" }, text: { en: "Full-day guided tour with a specialist Fez guide: tanneries, Karaouine, Al-Attarine and Bou Inania madrasas, artisan quarters. Lunch at a working riad. Free afternoon — hammam suggested. Dinner — pigeon pastilla recommended.", no: "Heldags guidet tur med en Fes-spesialist: garverne, Karaouine, Al-Attarine og Bou Inania madrasaer, håndverkerkvarteret. Lunsj i et aktivt riad. Fri ettermiddag — hammam anbefales. Middag — duepastilla anbefales.", fr: "Visite guidée toute la journée avec un guide spécialiste de Fès : tanneries, Karaouine, medersas Al-Attarine et Bou Inania, quartiers artisanaux. Déjeuner dans un riad actif. Après-midi libre — hammam conseillé. Dîner — pastilla au pigeon recommandée." } },
      { day: 5, route: { en: "Fez → Merzouga via the Middle Atlas", no: "Fes → Merzouga via Mellom-Atlas", fr: "Fès → Merzouga via le Moyen Atlas" }, text: { en: "Cross the cedar forests of Ifrane — stop for the Barbary macaques. Lunch in Midelt. Continue through the Ziz Valley — date palms, ksar villages. Arrival Merzouga. Camel caravan into Erg Chebbi at sunset. Dinner at the luxury camp with Berber music.", no: "Kryss seder­treskogene i Ifrane — stopp for berberap­ene. Lunsj i Midelt. Videre gjennom Ziz-dalen — daddelpalmer, ksarlandsbyer. Ankomst Merzouga. Kamelkaravane inn i Erg Chebbi i solnedgang. Middag i luksusleirplassen med berbermusikk.", fr: "Traversée des forêts de cèdres d'Ifrane — arrêt pour les macaques de Barbarie. Déjeuner à Midelt. Continuation à travers la vallée du Ziz — palmiers dattiers, villages de ksar. Arrivée à Merzouga. Caravane de chameaux vers l'Erg Chebbi au coucher du soleil. Dîner au camp de luxe avec musique berbère." } },
      { day: 6, route: { en: "The Sahara day", no: "Sahara-dagen", fr: "La journée Sahara" }, text: { en: "Sunrise from the dunes. Berber family visit in the morning. Free afternoon — sandboarding, dune walks, rest. Sundowner on a high dune. Dinner around the fire.", no: "Soloppgang fra dynene. Besøk hos berberfamilie om morgenen. Fri ettermiddag — sandboarding, dyneturer, hvile. Sundowner på en høy dyne. Middag rundt bålet.", fr: "Lever de soleil depuis les dunes. Visite d'une famille berbère le matin. Après-midi libre — sandboard, promenades dans les dunes, repos. Sundowner depuis une haute dune. Dîner autour du feu." } },
      { day: 7, route: { en: "Merzouga → Dades Valley", no: "Merzouga → Dades-dalen", fr: "Merzouga → Vallée du Dadès" }, text: { en: "Camel or 4×4 out of the dunes. Breakfast. Drive to Todra Gorge. Walk the Todra cliffs (30 min). Lunch nearby. Arrival in the Dades Valley. Check-in at a kasbah hotel. Dinner.", no: "Kamel eller 4×4 ut av dynene. Frokost. Kjøring til Todra-kløften. Vandring langs Todra-klippene (30 min). Lunsj i nærheten. Ankomst Dades-dalen. Innsjekk på kasbah-hotell. Middag.", fr: "Chameau ou 4×4 hors des dunes. Petit-déjeuner. Route vers les gorges du Todra. Marche dans les falaises du Todra (30 min). Déjeuner à proximité. Arrivée dans la vallée du Dadès. Enregistrement dans un hôtel-kasbah. Dîner." } },
      { day: 8, route: { en: "Dades → Marrakech via Aït Ben Haddou", no: "Dades → Marrakech via Aït Ben Haddou", fr: "Dadès → Marrakech via Aït Ben Haddou" }, text: { en: "Aït Ben Haddou guided walk. Lunch. Tizi n'Tichka pass — Atlas photo stops. Arrival at your Marrakech riad. Dinner in the medina.", no: "Guidet tur i Aït Ben Haddou. Lunsj. Tizi n'Tichka-passet — fotostopp i Atlas. Ankomst til riaden i Marrakech. Middag i medina.", fr: "Balade guidée à Aït Ben Haddou. Déjeuner. Col du Tizi n'Tichka — arrêts photos dans l'Atlas. Arrivée au riad à Marrakech. Dîner dans la médina." } },
      { day: 9, route: { en: "Marrakech", no: "Marrakech", fr: "Marrakech" }, text: { en: "Guided medina walking tour (3h). Lunch at a partner riad. Free afternoon — hammam at 17:00 suggested. Farewell dinner at a special table booked for you.", no: "Guidet medinavandr­ing (3t). Lunsj i et partner-riad. Fri ettermiddag — hammam kl. 17:00 anbefales. Avskjedsmiddag ved et spesialbord bestilt for deg.", fr: "Visite à pied guidée de la médina (3h). Déjeuner dans un riad partenaire. Après-midi libre — hammam à 17h conseillé. Dîner d'adieu à une table spéciale réservée pour vous." } },
      { day: 10, route: { en: "Departure", no: "Avreise", fr: "Départ" }, text: { en: "Breakfast, free morning. Private transfer to RAK three hours before flight.", no: "Frokost, fri morgen. Privat transfer til RAK tre timer før flyet.", fr: "Petit-déjeuner, matinée libre. Transfert privé vers RAK trois heures avant le vol." } },
    ],
    included: [
      { en: "Private airport pickup in Tangier and drop-off in Marrakech", no: "Privat henting på flyplassen i Tanger og avsetting i Marrakech", fr: "Prise en charge privée à l'aéroport de Tanger et dépôt à Marrakech" },
      { en: "Private vehicle with English-speaking driver for the entire route (regional drivers rotate for safety)", no: "Privat kjøretøy med engelsktalende sjåfør for hele ruten (regionale sjåfører bytter av sikkerhetshensyn)", fr: "Véhicule privé avec chauffeur anglophone pour l'ensemble du trajet (rotation de chauffeurs régionaux pour la sécurité)" },
      { en: "Two nights in Chefchaouen, two in Fez, two in the Sahara, one in Dades, two in Marrakech — all breakfasts", no: "To netter i Chefchaouen, to i Fes, to i Sahara, én i Dades, to i Marrakech — alle frokoster", fr: "Deux nuits à Chefchaouen, deux à Fès, deux au Sahara, une dans le Dadès, deux à Marrakech — tous les petits-déjeuners" },
      { en: "Guided tours: Chefchaouen (half-day), Volubilis (1h), Fez (full day with specialist), Aït Ben Haddou (1h), Marrakech medina (3h)", no: "Guidede turer: Chefchaouen (halvdag), Volubilis (1t), Fes (heldags med spesialist), Aït Ben Haddou (1t), Marrakech-medina (3t)", fr: "Visites guidées : Chefchaouen (demi-journée), Volubilis (1h), Fès (journée entière avec spécialiste), Aït Ben Haddou (1h), médina de Marrakech (3h)" },
      { en: "Camel caravan into the Sahara at sunset (or 4×4 alternative)", no: "Kamelkaravane inn i Sahara i solnedgang (eller 4×4 alternativ)", fr: "Caravane de chameaux dans le Sahara au coucher du soleil (ou alternative en 4×4)" },
      { en: "Berber family visit in Merzouga", no: "Besøk hos berberfamilie i Merzouga", fr: "Visite d'une famille berbère à Merzouga" },
      { en: "Lunches and dinners as listed (most days)", no: "Lunsjer og middager som oppgitt (de fleste dager)", fr: "Déjeuners et dîners tels que listés (la plupart des jours)" },
      { en: "24/7 WhatsApp support", no: "24/7 WhatsApp-støtte", fr: "Assistance WhatsApp 24h/24" },
      { en: "Pre-departure briefing pack: weather, packing, currency, etiquette", no: "Forbriefingpakke: vær, pakking, valuta, etikette", fr: "Pack de briefing pré-départ : météo, bagages, monnaie, étiquette" },
    ],
    excluded: [
      { en: "International flights (open-jaw: TNG in, RAK out — we help with ticketing)", no: "Internasjonale flyreiser (åpen kjeve: TNG inn, RAK ut — vi hjelper med billetter)", fr: "Vols internationaux (open-jaw : TNG à l'aller, RAK au retour — nous aidons pour la billetterie)" },
      { en: "Drinks outside set menus, alcohol", no: "Drikke utenom faste menyer, alkohol", fr: "Boissons hors menus fixes, alcool" },
      { en: "Hammam, spa, optional excursions", no: "Hammam, spa, valgfrie utflukter", fr: "Hammam, spa, excursions optionnelles" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" },
      { en: "Visa fees if applicable", no: "Visumavgifter hvis aktuelt", fr: "Frais de visa le cas échéant" },
    ],
  },

  // ===== 14D13N — The Grand Morocco =====
  {
    slug: "grand-morocco", chapter: "06",
    title: { en: "The Grand Morocco", no: "Det store Marokko", fr: "Le Grand Maroc" },
    duration: "14D13N", days: 14, nights: 13,
    route: "Casablanca → Rabat → Chefchaouen → Fez → Sahara → Skoura → Marrakech",
    priceFromEUR: 3290,
    img: "assets/photos/cheval-essaouira.jpg",
    badge: { en: "GRAND TOUR", no: "GRAND TOUR", fr: "GRAND TOUR" },
    themeTags: ["Coast", "Imperial", "Sahara", "Atlas", "Grand tour"],
    teaser: { en: "Two weeks. The full coast-to-Sahara story.", no: "To uker. Den fullstendige historien fra kysten til Sahara.", fr: "Deux semaines. L'histoire complète de la côte au Sahara." },
    overview: { en: "The journey we send people on when they tell us \"we want to see everything, but properly\". Atlantic coast, blue mountains, imperial cities, the Sahara, the palm groves, the High Atlas, and the red city to close. Two weeks is the right length for Morocco — long enough to slow down, short enough to feel like a journey rather than a relocation.", no: "Reisen vi sender folk på når de sier «vi vil se alt, men skikkelig». Atlanterhavskysten, de blå fjellene, keiserbyene, Sahara, palmegrovene, Høyatlas og den røde byen til slutt. To uker er den rette lengden for Marokko — lenge nok til å senke tempoet, kort nok til å kjennes som en reise og ikke en flytting.", fr: "Le voyage que nous proposons quand les gens nous disent « on veut tout voir, mais vraiment ». Côte atlantique, montagnes bleues, villes impériales, le Sahara, les palmeraies, le Haut Atlas, et la ville rouge pour clore. Deux semaines, c'est la bonne durée pour le Maroc — assez long pour ralentir, assez court pour que ça reste un voyage et pas un déménagement." },
    idealFor: { en: "Honeymooners, slow travellers, families on a real holiday", no: "Bryllupsreisende, slow-travel-entusiaster, familier på en skikkelig ferie", fr: "Voyageurs en lune de miel, slow travellers, familles en vraie vacances" },
    highlights: [
      { en: "Rabat kasbah + Chellah", no: "Kasbah i Rabat + Chellah", fr: "Kasbah de Rabat + Chellah" },
      { en: "Chefchaouen blue medina", no: "Chefchaouens blå medina", fr: "Médina bleue de Chefchaouen" },
      { en: "Volubilis Roman ruins", no: "Romerruinene i Volubilis", fr: "Ruines romaines de Volubilis" },
      { en: "Full-day Fez deep dive", no: "Heldags dypdykk i Fes", fr: "Immersion d'une journée à Fès" },
      { en: "Cedar forests + Barbary macaques", no: "Sedertreskog + berberap­er", fr: "Forêts de cèdres + macaques de Barbarie" },
      { en: "Two nights in the Sahara", no: "To netter i Sahara", fr: "Deux nuits au Sahara" },
      { en: "Skoura palm-grove kasbah", no: "Kasbah i Skoura-palmegroven", fr: "Kasbah dans la palmeraie de Skoura" },
      { en: "Aït Ben Haddou + Tichka pass", no: "Aït Ben Haddou + Tichka-passet", fr: "Aït Ben Haddou + col du Tichka" },
      { en: "Atlas Berber-village day", no: "Berberlansby­dag i Atlas", fr: "Journée dans un village berbère de l'Atlas" },
      { en: "Optional Essaouira day on Day 13", no: "Valgfri Essaouira-dag dag 13", fr: "Journée optionnelle à Essaouira le Jour 13" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival Casablanca → Rabat", no: "Ankomst Casablanca → Rabat", fr: "Arrivée Casablanca → Rabat" }, text: { en: "Private pickup at CMN. Transfer to Rabat (~1h). Check-in at a boutique hotel in the kasbah. Walk in the Kasbah des Oudayas as the light turns. Light dinner.", no: "Privat henting på CMN. Transfer til Rabat (~1t). Innsjekk på et boutique-hotell i kasbah­en. Tur i Kasbah des Oudayas mens lyset skifter. Lett middag.", fr: "Prise en charge privée à CMN. Transfert vers Rabat (~1h). Enregistrement dans un hôtel de charme dans la kasbah. Promenade dans la Kasbah des Oudayas à l'heure dorée. Dîner léger." } },
      { day: 2, route: { en: "Rabat, light and slow", no: "Rabat, lett og rolig", fr: "Rabat, en légèreté" }, text: { en: "Guided walk: Hassan Tower, Chellah Roman necropolis, the kasbah. Lunch overlooking the Bouregreg. Free afternoon — optional Mohamed VI Museum of Modern Art.", no: "Guidet tur: Hassan-tårnet, Chellah romersk nekropol, kasbah­en. Lunsj med utsikt over Bouregreg. Fri ettermiddag — valgfritt Mohamed VI-museum for moderne kunst.", fr: "Balade guidée : Tour Hassan, nécropole romaine de Chellah, la kasbah. Déjeuner avec vue sur le Bouregreg. Après-midi libre — Musée Mohammed VI d'art moderne en option." } },
      { day: 3, route: { en: "Rabat → Chefchaouen", no: "Rabat → Chefchaouen", fr: "Rabat → Chefchaouen" }, text: { en: "Departure (~4h with a coffee stop). Arrival Chefchaouen. Check-in. Spanish Mosque sunset. Dinner in the medina.", no: "Avreise (~4t med kaffestopp). Ankomst Chefchaouen. Innsjekk. Solnedgang fra Den spanske moskeen. Middag i medina.", fr: "Départ (~4h avec un arrêt café). Arrivée à Chefchaouen. Enregistrement. Coucher de soleil à la Mosquée Espagnole. Dîner dans la médina." } },
      { day: 4, route: { en: "Chefchaouen", no: "Chefchaouen", fr: "Chefchaouen" }, text: { en: "Guided medina walk (2.5h). Free afternoon — Ras El-Maa waterfall or shopping.", no: "Guidet medinavandr­ing (2,5t). Fri ettermiddag — Ras El-Maa-fossen eller shopping.", fr: "Balade guidée dans la médina (2h30). Après-midi libre — cascade Ras El-Maa ou shopping." } },
      { day: 5, route: { en: "Chefchaouen → Fez via Volubilis", no: "Chefchaouen → Fes via Volubilis", fr: "Chefchaouen → Fès via Volubilis" }, text: { en: "Departure. Volubilis Roman ruins (guided 1h) + lunch nearby. Arrival Fez. Riad check-in. Dinner at the riad.", no: "Avreise. Romerruinene i Volubilis (guidet 1t) + lunsj i nærheten. Ankomst Fes. Innsjekk i riad. Middag i riaden.", fr: "Départ. Ruines romaines de Volubilis (guidé 1h) + déjeuner à proximité. Arrivée à Fès. Enregistrement au riad. Dîner au riad." } },
      { day: 6, route: { en: "Fez deep dive", no: "Dypdykk i Fes", fr: "Immersion à Fès" }, text: { en: "Full-day specialist guided tour: tanneries, Karaouine, madrasas, artisan quarters. Lunch inside the medina. Free afternoon — hammam suggested.", no: "Heldags spesialisttur: garverne, Karaouine, madrasaer, håndverkerkvarteret. Lunsj inne i medina. Fri ettermiddag — hammam anbefales.", fr: "Visite guidée spécialisée toute la journée : tanneries, Karaouine, medersas, quartiers artisanaux. Déjeuner dans la médina. Après-midi libre — hammam conseillé." } },
      { day: 7, route: { en: "Fez → Merzouga via the Middle Atlas", no: "Fes → Merzouga via Mellom-Atlas", fr: "Fès → Merzouga via le Moyen Atlas" }, text: { en: "Cedar forests of Ifrane. Barbary macaques stop. Lunch in Midelt. Continue via Ziz Valley. Camel caravan into the Erg Chebbi. Camp dinner with music.", no: "Seder­treskogene i Ifrane. Stopp for berberap­ene. Lunsj i Midelt. Videre via Ziz-dalen. Kamelkaravane inn i Erg Chebbi. Middag i leiren med musikk.", fr: "Forêts de cèdres d'Ifrane. Arrêt pour les macaques de Barbarie. Déjeuner à Midelt. Continuation via la vallée du Ziz. Caravane de chameaux vers l'Erg Chebbi. Dîner au camp avec musique." } },
      { day: 8, route: { en: "The Sahara day", no: "Sahara-dagen", fr: "La journée Sahara" }, text: { en: "Sunrise on the dunes. Morning Berber family visit. Free afternoon — sandboarding, walks, rest. Sundowner.", no: "Soloppgang over dynene. Besøk hos berberfamilie om morgenen. Fri ettermiddag — sandboarding, turer, hvile. Sundowner.", fr: "Lever de soleil sur les dunes. Visite d'une famille berbère le matin. Après-midi libre — sandboard, promenades, repos. Sundowner." } },
      { day: 9, route: { en: "Merzouga → Skoura palm grove", no: "Merzouga → Skoura-palmegroven", fr: "Merzouga → Palmeraie de Skoura" }, text: { en: "Out of the dunes. Todra Gorge walk. Lunch in Tinghir. Drive via Dades and the Valley of Roses. Arrival at a Skoura kasbah hotel — palm grove, pool, silence. Dinner at the kasbah.", no: "Ut av dynene. Vandring i Todra-kløften. Lunsj i Tinghir. Kjøring via Dades og Rosedalen. Ankomst kasbah-hotell i Skoura — palmegrov, basseng, stillhet. Middag i kasbah­en.", fr: "Hors des dunes. Marche dans les gorges du Todra. Déjeuner à Tinghir. Route via le Dadès et la Vallée des Roses. Arrivée à un hôtel-kasbah à Skoura — palmeraie, piscine, silence. Dîner à la kasbah." } },
      { day: 10, route: { en: "Skoura → Aït Ben Haddou → Marrakech", no: "Skoura → Aït Ben Haddou → Marrakech", fr: "Skoura → Aït Ben Haddou → Marrakech" }, text: { en: "Aït Ben Haddou guided walk. Lunch. Tizi n'Tichka pass — Atlas photo stops. Arrival Marrakech riad.", no: "Guidet tur i Aït Ben Haddou. Lunsj. Tizi n'Tichka-passet — fotostopp i Atlas. Ankomst Marrakech riad.", fr: "Balade guidée à Aït Ben Haddou. Déjeuner. Col du Tizi n'Tichka — arrêts photos dans l'Atlas. Arrivée au riad de Marrakech." } },
      { day: 11, route: { en: "Marrakech, guided", no: "Marrakech med guide", fr: "Marrakech, avec guide" }, text: { en: "Guided medina walking tour (3h). Lunch at a partner riad. Free afternoon — hammam at 17:00 suggested. Dinner.", no: "Guidet medinavandr­ing (3t). Lunsj i et partner-riad. Fri ettermiddag — hammam kl. 17:00 anbefales. Middag.", fr: "Visite à pied guidée de la médina (3h). Déjeuner dans un riad partenaire. Après-midi libre — hammam à 17h conseillé. Dîner." } },
      { day: 12, route: { en: "Atlas day trip — Ourika or Imlil", no: "Atlas-dagstur — Ourika eller Imlil", fr: "Excursion Atlas — Ourika ou Imlil" }, text: { en: "Drive into the High Atlas (~1.5h). Guided walk in a Berber village. Lunch in a Berber home (set menu). Return to Marrakech. Rest at the riad. Dinner.", no: "Kjøring inn i Høyatlas (~1,5t). Guidet tur i en berberlandsby. Lunsj hjemme hos en berberfamilie (fast meny). Tilbake til Marrakech. Hvile i riaden. Middag.", fr: "Route vers le Haut Atlas (~1h30). Balade guidée dans un village berbère. Déjeuner dans une maison berbère (menu fixe). Retour à Marrakech. Repos au riad. Dîner." } },
      { day: 13, route: { en: "Marrakech free day or Essaouira", no: "Fri dag i Marrakech eller Essaouira", fr: "Jour libre à Marrakech ou Essaouira" }, text: { en: "Option A — free day in Marrakech (Majorelle, shopping, pool). Option B — day trip to Essaouira (~2.5h each way): Atlantic ramparts, fishing port, fresh seafood lunch. Farewell dinner at a special table.", no: "Alternativ A — fri dag i Marrakech (Majorelle, shopping, basseng). Alternativ B — dagstur til Essaouira (~2,5t hver vei): atlantiske bymurer, fiskerihavn, fersk sjømatlunsj. Avskjedsmiddag ved et spesialbord.", fr: "Option A — jour libre à Marrakech (Majorelle, shopping, piscine). Option B — excursion à Essaouira (~2h30 aller-retour) : remparts atlantiques, port de pêche, déjeuner de fruits de mer frais. Dîner d'adieu à une table spéciale." } },
      { day: 14, route: { en: "Departure", no: "Avreise", fr: "Départ" }, text: { en: "Breakfast, free morning. Private transfer to RAK three hours before flight.", no: "Frokost, fri morgen. Privat transfer til RAK tre timer før flyet.", fr: "Petit-déjeuner, matinée libre. Transfert privé vers RAK trois heures avant le vol." } },
    ],
    included: [
      { en: "Private airport pickup in Casablanca and drop-off in Marrakech", no: "Privat henting på flyplassen i Casablanca og avsetting i Marrakech", fr: "Prise en charge privée à l'aéroport de Casablanca et dépôt à Marrakech" },
      { en: "Private vehicle with English-speaking driver throughout (regional drivers may rotate)", no: "Privat kjøretøy med engelsktalende sjåfør gjennom hele reisen (regionale sjåfører kan bytte)", fr: "Véhicule privé avec chauffeur anglophone tout au long du voyage (rotation possible de chauffeurs régionaux)" },
      { en: "13 nights in hand-picked accommodation: boutique hotels, riads, a kasbah, and luxury Sahara camp — all breakfasts", no: "13 netter i hånplukkede overnattingssteder: boutique-hoteller, riader, kasbah og luksusleirplass i Sahara — alle frokoster", fr: "13 nuits dans des hébergements soigneusement sélectionnés : hôtels de charme, riads, une kasbah et un camp de luxe au Sahara — tous les petits-déjeuners" },
      { en: "Guided tours in Rabat, Chefchaouen, Volubilis, Fez (full day), Aït Ben Haddou, Marrakech medina, and a Berber village in the Atlas", no: "Guidede turer i Rabat, Chefchaouen, Volubilis, Fes (heldags), Aït Ben Haddou, Marrakech-medina og en berberlandsby i Atlas", fr: "Visites guidées à Rabat, Chefchaouen, Volubilis, Fès (journée entière), Aït Ben Haddou, médina de Marrakech et un village berbère dans l'Atlas" },
      { en: "Camel caravan into the Sahara, Berber family visit, sandboards", no: "Kamelkaravane inn i Sahara, besøk hos berberfamilie, sandboards", fr: "Caravane de chameaux dans le Sahara, visite d'une famille berbère, sandboards" },
      { en: "Lunches and dinners as listed (the majority of meals)", no: "Lunsjer og middager som oppgitt (de fleste måltider)", fr: "Déjeuners et dîners tels que listés (la majorité des repas)" },
      { en: "Atlas day trip on Day 12 with home-cooked Berber lunch", no: "Atlas-dagstur dag 12 med hjemmelaget berberfrokost", fr: "Excursion Atlas le Jour 12 avec déjeuner berbère cuisiné à la maison" },
      { en: "One discretionary day on Day 13 (Marrakech or Essaouira — your choice)", no: "Én valgfri dag dag 13 (Marrakech eller Essaouira — ditt valg)", fr: "Une journée au choix le Jour 13 (Marrakech ou Essaouira — à vous de décider)" },
      { en: "24/7 WhatsApp support", no: "24/7 WhatsApp-støtte", fr: "Assistance WhatsApp 24h/24" },
      { en: "Pre-departure briefing pack and printed itinerary booklet on arrival", no: "Forbriefingpakke og trykt reiseplanhefte ved ankomst", fr: "Pack de briefing pré-départ et carnet d'itinéraire imprimé à l'arrivée" },
    ],
    excluded: [
      { en: "International flights (open-jaw: CMN in / RAK out, or reversible)", no: "Internasjonale flyreiser (åpen kjeve: CMN inn / RAK ut, eller omvendt)", fr: "Vols internationaux (open-jaw : CMN à l'aller / RAK au retour, ou inversible)" },
      { en: "Drinks outside set menus, alcohol", no: "Drikke utenom faste menyer, alkohol", fr: "Boissons hors menus fixes, alcool" },
      { en: "Hammam and spa treatments", no: "Hammam og spa-behandlinger", fr: "Hammam et soins spa" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips for drivers, guides, camp staff", no: "Tips til sjåfører, guider og leirpersonale", fr: "Pourboires pour les chauffeurs, les guides et le personnel du camp" },
      { en: "Visa fees if applicable", no: "Visumavgifter hvis aktuelt", fr: "Frais de visa le cas échéant" },
      { en: "Optional add-ons: hot-air balloon over Marrakech, private cooking class, paragliding, quad / buggy in Agafay", no: "Valgfrie tillegg: luftballong over Marrakech, privat matkurs, paragliding, quad / buggy i Agafay", fr: "Suppléments optionnels : montgolfière sur Marrakech, cours de cuisine privé, parapente, quad / buggy à l'Agafay" },
    ],
  },
];

// ── DETAIL MODAL — single scrollable page ───────────────────────
function ItinModal({ trip, onClose, lang, fmt }) {
  useEffectIt(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : en;
  const s = (field) => typeof field === 'object' && field !== null ? (field[lang] || field.en || field) : field;
  const terms = STANDARD_TERMS[lang === 'no' ? 'no' : lang === 'fr' ? 'fr' : lang === 'sv' ? 'sv' : 'en'];

  const goPlan = (mode) => {
    window.MS_BookingContext = {
      mode: mode || 'asis',
      trip,
      duration: trip.days || trip.nights + 1,
      title: s(trip.title),
      priceEur: trip.priceFromEUR,
    };
    window.dispatchEvent(new CustomEvent('ms:booking-context'));
    onClose();
    setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  const priceTxt = trip.priceFromEUR ? (fmt ? fmt(trip.priceFromEUR) : `€${trip.priceFromEUR}`) : null;

  return (
    <div className="itin-modal-backdrop" onClick={onClose}>
      <div className="itin-modal itin-modal-v2" onClick={e => e.stopPropagation()}>
        <button className="itin-modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Hero */}
        <div className="itin-modal-hero" style={{ backgroundImage: `url(${trip.img})` }}>
          <div className="itin-modal-hero-overlay">
            <div className="itin-modal-eyebrow">— {tx('Chapter','Kapittel','Chapitre')} {trip.chapter} · {trip.duration}</div>
            <h2 className="itin-modal-title">{s(trip.title)}</h2>
            <div className="itin-modal-route">{trip.route}</div>
            {trip.idealFor && (
              <span className="itin-modal-hero-pill">
                <span className="itin-modal-hero-pill-label">{tx('Ideal for','Perfekt for','Idéal pour')}</span>
                {s(trip.idealFor)}
              </span>
            )}
          </div>
        </div>

        {/* Single scrollable body */}
        <div className="itin-modal-body">

          {/* ── Overview ── */}
          <p className="itin-modal-overview">{s(trip.overview)}</p>

          <div className="itin-stat-row">
            <div className="itin-stat">
              <span className="itin-stat-label">{tx('Duration','Varighet','Durée')}</span>
              <span className="itin-stat-value">{trip.duration}</span>
            </div>
            <div className="itin-stat">
              <span className="itin-stat-label">{tx('From','Fra','À partir de')}</span>
              <span className="itin-stat-value itin-stat-price">{priceTxt || tx('On request','På forespørsel','Sur demande')}</span>
            </div>
            <div className="itin-stat">
              <span className="itin-stat-label">{tx('Route','Rute','Itinéraire')}</span>
              <span className="itin-stat-value itin-stat-route">{trip.route}</span>
            </div>
          </div>

          {trip.partner && (
            <div className="itin-partner-strip">
              <div className="itin-partner-head">
                <div>
                  <div className="itin-partner-eyebrow">{tx('In partnership with','I samarbeid med','En partenariat avec')}</div>
                  <div className="itin-partner-name">{trip.partner.name}</div>
                  <div className="itin-partner-tag">{trip.partner.tagline} · {trip.partner.location}</div>
                </div>
                <a className="itin-partner-link" href={trip.partner.website} target="_blank" rel="noopener">
                  {tx('Visit site →','Besøk siden →','Voir le site →')}
                </a>
              </div>
              {trip.partner.gallery && trip.partner.gallery.length > 0 && (
                <div className="itin-partner-gallery">
                  {trip.partner.gallery.map((src, i) => (
                    <div key={i} className="itin-partner-thumb" style={{ backgroundImage: `url(${src})` }} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="itin-modal-grid">
            <div>
              <h3 className="itin-modal-h3">{tx('Highlights','Høydepunkter','Temps forts')}</h3>
              <ul className="itin-modal-ul">
                {trip.highlights.map((h, i) => <li key={i}>{s(h)}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="itin-modal-h3">{tx('Theme','Tema','Thèmes')}</h3>
              <div className="itin-modal-tags">
                {trip.themeTags.map((t, i) => <span key={i} className="itin-modal-tag">{t}</span>)}
              </div>
            </div>
          </div>

          {trip.formulas && trip.formulas.length > 0 && (
            <div className="itin-formulas">
              <h3 className="itin-modal-h3">{tx('Choose your formula','Velg din formel','Choisissez votre formule')}</h3>
              <div className="itin-formula-grid">
                {trip.formulas.map((f) => {
                  const name = f.name[lang] || f.name.en;
                  const tagline = f.tagline[lang] || f.tagline.en;
                  const fromEUR = f.prices ? Math.min(...Object.values(f.prices)) : null;
                  return (
                    <div key={f.id} className="itin-formula-card">
                      <div className="itin-formula-name">{name}</div>
                      <div className="itin-formula-tag">{tagline}</div>
                      {fromEUR
                        ? <div className="itin-formula-price">{tx('From','Fra','À partir de')} {fmt ? fmt(fromEUR) : `€${fromEUR}`} <span>/ {tx('week / person','uke / person','semaine / pers.')}</span></div>
                        : <div className="itin-formula-price">{tx('Custom quote','Skreddersydd','Sur mesure')}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {trip.extras && trip.extras.length > 0 && (
            <div className="itin-extras">
              <h3 className="itin-modal-h3">{tx('Optional extras','Valgfrie tillegg','Extras optionnels')}</h3>
              <div className="itin-extra-grid">
                {trip.extras.map((x) => (
                  <div key={x.id} className="itin-extra-card">
                    <div className="itin-extra-name">{x.name[lang] || x.name.en}</div>
                    <div className="itin-extra-desc">{x.desc[lang] || x.desc.en}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Day by day ── */}
          <div className="itin-section-divider" />
          <div className="itin-timeline">
            <h3 className="itin-modal-h3 itin-timeline-h">{tx('Day by day','Dag for dag','Jour par jour')}</h3>
            <ol className="itin-timeline-list">
              {trip.itinerary.map((d, i) => (
                <li key={i} className="itin-timeline-item">
                  <div className="itin-timeline-marker">
                    <span className="itin-timeline-dot" aria-hidden="true" />
                    <span className="itin-timeline-day">{d.day}</span>
                  </div>
                  <div className="itin-timeline-card">
                    <div className="itin-timeline-eyebrow">{tx('Day','Dag','Jour')} {d.day}</div>
                    <div className="itin-timeline-route">{s(d.route)}</div>
                    <p className="itin-timeline-text">{s(d.text)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* ── Included / Not included ── */}
          <div className="itin-section-divider" />
          <div className="itin-modal-grid itin-includes-grid">
            {trip.included && trip.included.length > 0 && (
              <div className="itin-includes-col itin-includes-col-yes">
                <h3 className="itin-modal-h3">{tx('Included','Inkludert','Inclus')}</h3>
                <ul className="itin-modal-ul itin-included">
                  {trip.included.map((x, i) => <li key={i}>{s(x)}</li>)}
                </ul>
              </div>
            )}
            {trip.excluded && trip.excluded.length > 0 && (
              <div className="itin-includes-col itin-includes-col-no">
                <h3 className="itin-modal-h3">{tx('Not included','Ikke inkludert','Non inclus')}</h3>
                <ul className="itin-modal-ul itin-excluded">
                  {trip.excluded.map((x, i) => <li key={i}>{s(x)}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* ── Booking ── */}
          <div className="itin-section-divider" />
          <div className="itin-booking">
            <div className="itin-booking-price-card">
              <span className="itin-booking-from">{tx('From','Fra','À partir de')}</span>
              <span className="itin-booking-amount">{priceTxt || tx('On request','På forespørsel','Sur demande')}</span>
              <span className="itin-booking-per">{tx('/ person — tailored to your dates','/ person — tilpasset dine datoer','/ personne — sur mesure')}</span>
            </div>

            <div className="itin-booking-cta-row">
              <button className="btn btn-primary itin-booking-btn-primary"
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    if (window.MS_TweakItineraryModal) {
                      const div = document.createElement('div');
                      div.className = 'ms-tweak-root';
                      document.body.appendChild(div);
                      const root = ReactDOM.createRoot(div);
                      const TweakModal = window.MS_TweakItineraryModal;
                      const close = () => { root.unmount(); div.remove(); };
                      root.render(React.createElement(window.MS_CTX.MSProvider, null,
                        React.createElement(TweakModal, { trip, onClose: close })));
                    }
                  }, 60);
                }}>
                ✏️ {tx('Tweak this trip','Tilpass denne reisen','Personnaliser ce voyage')}
              </button>
              <button className="btn btn-outline" onClick={() => goPlan('asis')}>
                {tx('Take as-is →','Ta som den er →','Prendre tel quel →')}
              </button>
              <a className="btn btn-outline" href="https://wa.me/212698164331" target="_blank" rel="noopener">
                {tx('WhatsApp us','WhatsApp oss','WhatsApp')}
              </a>
            </div>

            <details className="itin-modal-terms itin-terms-collapsible">
              <summary>
                <span className="itin-terms-eyebrow">{tx('Rules & conditions','Regler og vilkår','Règles et conditions','Regler & villkor')}</span>
                <span className="itin-terms-chev" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </summary>
              <ul className="itin-modal-terms-list">
                {terms.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </details>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── CATALOG-STYLE GRID + RIGHT-SIDE PLAN CTA ────────────────────
function Itineraries() {
  const { useMS, usePrice } = window.MS_CTX;
  const ctx = useMS();
  const price = usePrice();
  const lang = ctx.lang || 'en';
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : en;
  const [filter, setFilter] = useStateIt('3D2N');
  const [sliderDir, setSliderDir] = useStateIt('next');
  const [openTrip, setOpenTrip] = useStateIt(null);
  const [visibleCount, setVisibleCount] = useStateIt(4);
  // +40% markup applied to every itinerary price
  const adjustedPrice = (eur) => price(eur * 1.4);

  useEffectIt(() => { setVisibleCount(4); }, [filter]);

  // Open a trip modal from the hero search dropdown.
  useEffectIt(() => {
    const onOpen = (e) => {
      const slug = e.detail?.slug;
      if (!slug) return;
      // Real itineraries
      const trip = (window.MS_ITINERARIES || []).find(t => t.slug === slug);
      if (trip) { setOpenTrip(trip); return; }
      // Theme cards — switch filter to Themes and scroll (themes go straight to form when clicked)
      setFilter('Themes');
    };
    window.addEventListener('ms:open-trip', onOpen);
    return () => window.removeEventListener('ms:open-trip', onOpen);
  }, []);

  // Simple, friendly labels (no jargon)
  const filterLabel = (f) => {
    if (f === 'All')         return tx('All', 'Alle', 'Tout');
    if (f === 'Themes')      return tx('Themes', 'Temaer', 'Thèmes');
    if (f === 'Most booked') return tx('Most booked', 'Mest bestilt', 'Plus réservé');
    if (f === '3D2N')        return tx('3 days', '3 dager', '3 jours');
    if (f === '4D3N')        return tx('4 days', '4 dager', '4 jours');
    if (f === '5D4N')        return tx('5 days', '5 dager', '5 jours');
    if (f === '7D6N')        return tx('7 days', '7 dager', '7 jours');
    if (f === '10D9N')       return tx('10 days', '10 dager', '10 jours');
    if (f === '14D13N')      return tx('14 days', '14 dager', '14 jours');
    return f;
  };
  const filters = ['3D2N', '4D3N', '5D4N', '7D6N', '10D9N', '14D13N', 'Themes'];
  // Only ship trips with the allowed durations
  const ALLOWED_DURATIONS = new Set(['3D2N','4D3N','5D4N','7D6N','10D9N','14D13N']);

  // ─── THEME cards: mixed straight into the trips grid. Clicking one
  // routes to the planner form (no detail modal).
  const THEMES = useMemoIt(() => [
    {
      __theme: true, slug: 'theme-culinary', id: 'culinary', emoji: '🍯', tripType: 'culinary',
      priceFromEUR: 890,
      title: tx('Culinary trip', 'Mat & smaker', 'Voyage culinaire'),
      teaser: tx('Markets, tagine masterclasses, rooftop dinners and a Moroccan cooking-class week.',
                 'Markeder, tagine-kurs, takdinerer og en uke med marokkansk matlaging.',
                 'Marchés, masterclass de tajine, dîners sur les toits et une semaine autour de la cuisine.'),
      duration: '5D4N', days: 5,
      route: 'Marrakech · Atlas foothills',
      themeTags: ['Culinary', 'Tagine', 'Markets'],
      badge: 'THEME',
      img: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=1100&q=72',
      chapter: 'CULINARY',
    },
    {
      __theme: true, slug: 'theme-romantic', id: 'romantic', emoji: '💞', tripType: 'romantic',
      priceFromEUR: 1090,
      title: tx('Romantic trip', 'Romantisk reise', 'Voyage romantique'),
      teaser: tx('Riad hammam, candle-lit Agafay dinner, sunset camel ride and slow palmeraie mornings.',
                 'Riad-hammam, stearinlysmiddag i Agafay, kameltur i solnedgang og rolige palmeraie-morgener.',
                 'Hammam au riad, dîner aux chandelles à l\'Agafay, balade à dos de chameau et matins doux à la palmeraie.'),
      duration: '5D4N', days: 5,
      route: 'Riad · Agafay · Palmeraie',
      themeTags: ['Romantic', 'Spa', 'Slow'],
      badge: 'THEME',
      img: 'assets/photos/sunset-riding.jpg',
      chapter: 'ROMANTIC',
    },
    {
      __theme: true, slug: 'theme-cultural', id: 'cultural', emoji: '🕌', tripType: 'cultural',
      priceFromEUR: 1390,
      title: tx('Cultural trip', 'Kulturreise', 'Voyage culturel'),
      teaser: tx('Medinas, palaces, museums and the imperial cities — Marrakech, Fez and Chefchaouen.',
                 'Medinaer, palasser, museer og keiserbyer — Marrakech, Fez og Chefchaouen.',
                 'Médinas, palais, musées et villes impériales — Marrakech, Fès et Chefchaouen.'),
      duration: '7D6N', days: 7,
      route: 'Marrakech · Fez · Chefchaouen',
      themeTags: ['Culture', 'Heritage', 'Medina'],
      badge: 'THEME',
      img: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1100&q=72',
      chapter: 'CULTURAL',
    },
    {
      __theme: true, slug: 'theme-mountain', id: 'mountain', emoji: '🏔️', tripType: 'mountain',
      priceFromEUR: 890,
      title: tx('Mountain trek & nature', 'Fjelltur & natur', 'Trek & nature'),
      teaser: tx('High Atlas valleys, Toubkal base camp, walnut groves and Berber lodges.',
                 'Høye Atlas-daler, Toubkal-base-camp, valnøttlunder og berber-losjier.',
                 'Vallées du Haut Atlas, camp de base du Toubkal, noyers et lodges berbères.'),
      duration: '5D4N', days: 5,
      route: 'Imlil · Toubkal · Berber villages',
      themeTags: ['Mountain', 'Trek', 'Nature'],
      badge: 'THEME',
      img: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1100&q=72',
      chapter: 'MOUNTAIN',
    },
    {
      __theme: true, slug: 'theme-desert-marathon', id: 'desert-marathon', emoji: '🏃', tripType: 'desert-marathon',
      priceFromEUR: 1490,
      title: tx('Desert marathon trip', 'Ørken-maraton', 'Marathon du désert'),
      teaser: tx('Train and recover around Marathon des Sables — Agafay long runs, Sahara taper and recovery riad.',
                 'Tren og restituer rundt Marathon des Sables — lange løp i Agafay, taper i Sahara og restitusjons-riad.',
                 'Préparation autour du Marathon des Sables — sorties longues à l\'Agafay, taper au Sahara et riad récup.'),
      duration: '7D6N', days: 7,
      route: 'Agafay · Sahara · recovery riad',
      themeTags: ['Endurance', 'Sahara', 'Training'],
      badge: 'THEME',
      img: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1100&q=72',
      chapter: 'MARATHON',
    },
    {
      __theme: true, slug: 'theme-sport', id: 'sport', emoji: '🏄', tripType: 'sport',
      priceFromEUR: 1290,
      title: tx('Sport trip', 'Sportsreise', 'Voyage sportif'),
      teaser: tx('Surf in Taghazout, mountain biking in the Atlas, paragliding, padel and golf — handled by the team.',
                 'Surf i Taghazout, terrengsykling i Atlas, paragliding, padel og golf — vi tar oss av alt.',
                 'Surf à Taghazout, VTT dans l\'Atlas, parapente, padel et golf — l\'équipe s\'occupe de tout.'),
      duration: '7D6N', days: 7,
      route: 'Taghazout · Atlas · Palmeraie',
      themeTags: ['Surf', 'Bike', 'Padel'],
      badge: 'THEME',
      img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1100&q=72',
      chapter: 'SPORT',
    },
    {
      __theme: true, slug: 'theme-festival', id: 'festival', emoji: '🎶', tripType: 'festival',
      priceFromEUR: 990,
      title: tx('Festival trip', 'Festivalreise', 'Voyage festival'),
      teaser: tx('Built around Marrakech festivals — Gnaoua Essaouira, Marrakech du Rire, FIFM and the Sahara music nights.',
                 'Bygd rundt festivaler — Gnaoua i Essaouira, Marrakech du Rire, FIFM og musikknetter i Sahara.',
                 'Calé sur les festivals — Gnaoua d\'Essaouira, Marrakech du Rire, FIFM et nuits musicales au Sahara.'),
      duration: '5D4N', days: 5,
      route: 'Marrakech · Essaouira',
      themeTags: ['Music', 'Festival', 'Culture'],
      badge: 'THEME',
      img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1100&q=72',
      chapter: 'FESTIVAL',
    },
  ], [lang]);

  const openTheme = (t) => {
    window.MS_BookingContext = {
      mode: 'theme',
      title: t.title,
      duration: t.days,
      tripType: t.tripType,
      themeId: t.id,
      themeBrief: t.teaser,
    };
    window.dispatchEvent(new CustomEvent('ms:booking-context'));
    setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  const all = useMemoIt(() => [
    ...THEMES,
    ...ITINS,
  ].filter(t => t.__theme || ALLOWED_DURATIONS.has(t.duration)), [THEMES]);
  const matches = (t) => {
    if (filter === 'Themes') return !!t.__theme;
    // Duration tabs only show real itineraries — themes live in Temaer.
    return !t.__theme && t.duration === filter;
  };
  const tier = (t) => {
    if (t.__theme) return -2;
    if (t.badge === 'MOST BOOKED' || t.badge === 'MOST LOVED') return -1;
    if (t.duration === '3D2N')   return 0;
    if (t.duration === '4D3N')   return 1;
    if (t.duration === '5D4N')   return 2;
    if (t.duration === '7D6N')   return 3;
    if (t.duration === '10D9N')  return 4;
    if (t.duration === '14D13N') return 5;
    return 6;
  };
  const items = useMemoIt(() =>
    all.filter(matches).sort((a, b) => tier(a) - tier(b)), [filter, all]);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <section className="reiseplaner-section catalog section" id="itineraries">
      <div className="wrap">
        <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 56px' }}>
          <span className="eyebrow">— {tx('Reiseplaner', 'Reiseplaner', 'Itinéraires')}</span>
          <h2>{tx('Our best ', 'Våre beste ', 'Nos meilleurs ')}<em>{tx('itineraries', 'reiser', 'voyages')}</em></h2>
          <p style={{ margin: '0 auto' }}>{tx(
            'Pick the trip you like — we write the rest with you.',
            'Velg reisen du liker — vi skriver resten med deg.',
            'Choisissez le voyage qui vous plaît — nous écrivons le reste avec vous.'
          )}</p>
        </div>

        {/* Single one-line tab bar — duration filters, Themes, then the
            three booking CTAs (Team building, Bryllup, Lag din reise last). */}
        <div className="trip-filter-bar reveal">
          <div className="trip-filter-scroll">
            {filters.map(f => {
              const count = f === 'Themes'
                ? all.filter(t => t.__theme).length
                : all.filter(t => !t.__theme && t.duration === f).length;
              return (
                <button key={f} className={`trip-filter-chip ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}>
                  <span>{filterLabel(f)}</span>
                  <span className="trip-filter-count">{count}</span>
                </button>
              );
            })}
            <span className="trip-filter-sep" aria-hidden="true" />
            <button className="trip-filter-chip trip-filter-cta"
              onClick={() => {
                window.MS_BookingContext = { mode: 'team', title: tx('Team building', 'Team building', 'Team building'), duration: 5, tripType: 'team' };
                window.dispatchEvent(new CustomEvent('ms:booking-context'));
                setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 60);
              }}>
              🤝 {tx('Team building', 'Team building', 'Team building')}
            </button>
            <button className="trip-filter-chip trip-filter-cta"
              onClick={() => {
                window.MS_BookingContext = { mode: 'wedding', title: tx('Wedding planner', 'Bryllup', 'Mariage'), duration: 7, tripType: 'wedding' };
                window.dispatchEvent(new CustomEvent('ms:booking-context'));
                setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 60);
              }}>
              💍 {tx('Wedding', 'Bryllup', 'Mariage')}
            </button>
            <button className="trip-filter-chip trip-filter-cta trip-filter-cta-primary"
              onClick={() => {
                window.MS_BookingContext = null;
                window.dispatchEvent(new CustomEvent('ms:booking-context'));
                setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 30);
              }}>
              ✨ {tx('Make your trip', 'Lag din reise', 'Créer mon voyage')} →
            </button>
          </div>
        </div>

            <div className={`trip-slider ${filter !== 'Themes' ? 'trip-slider-feature' : ''}`} data-dir={sliderDir}>
              {filter === 'Themes' ? (
                <>
                  <button className="trip-slider-arrow prev" aria-label="Previous"
                    onClick={(e) => { const sc = e.currentTarget.parentElement.querySelector('.trip-slider-track'); sc?.scrollBy({ left: -(sc.clientWidth * 0.85), behavior: 'smooth' }); }}>
                    <Iit.Arrow s={18} />
                  </button>
                  <button className="trip-slider-arrow next" aria-label="Next"
                    onClick={(e) => { const sc = e.currentTarget.parentElement.querySelector('.trip-slider-track'); sc?.scrollBy({ left: sc.clientWidth * 0.85, behavior: 'smooth' }); }}>
                    <Iit.Arrow s={18} />
                  </button>
                </>
              ) : (
                <>
                  {/* Feature mode: arrows step through the 6 duration buckets */}
                  <button className="trip-slider-arrow prev" aria-label={tx('Shorter trip', 'Kortere reise', 'Plus court')}
                    onClick={() => {
                      const order = ['3D2N','4D3N','5D4N','7D6N','10D9N','14D13N','Themes'];
                      const idx = Math.max(0, order.indexOf(filter));
                      setSliderDir('prev');
                      setFilter(order[(idx - 1 + order.length) % order.length]);
                    }}>
                    <Iit.Arrow s={18} />
                  </button>
                  <button className="trip-slider-arrow next" aria-label={tx('Longer trip', 'Lengre reise', 'Plus long')}
                    onClick={() => {
                      const order = ['3D2N','4D3N','5D4N','7D6N','10D9N','14D13N','Themes'];
                      const idx = Math.max(0, order.indexOf(filter));
                      setSliderDir('next');
                      setFilter(order[(idx + 1) % order.length]);
                    }}>
                    <Iit.Arrow s={18} />
                  </button>
                </>
              )}
              <div className={`trip-slider-track cat-grid reiseplaner-grid ${filter !== 'Themes' ? 'reiseplaner-grid-feature' : ''}`}>
              {visibleItems.map((t, i) => {
                // Derive rating + reviews deterministically — Marrakechstory's actually booked these
                const seed = t.slug.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
                const rating = (4.7 + ((seed % 30) / 100)).toFixed(2);  // 4.70 – 4.99
                const reviews = 180 + (seed * 7) % 1620;                  // 180 – 1800
                const key = `itin-${t.slug}`;
                const isTheme = !!t.__theme;
                const isFeature = filter !== 'Themes' && !isTheme;
                const handleOpen = () => isTheme ? openTheme(t) : setOpenTrip(t);
                const priceTxt = t.priceFromEUR ? adjustedPrice(t.priceFromEUR) : null;
                if (isFeature) {
                  return (
                    <div key={t.slug} className="trip-feature reveal"
                      onClick={handleOpen} role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleOpen()}>
                      <div className="trip-feature-img" style={{ backgroundImage: `url(${t.img})` }}>
                        <span className="trip-feature-badge">
                          {(typeof t.badge === 'object' ? (t.badge[lang] || t.badge.en) : t.badge) || tx('Best pick', 'Best i klassen', 'Notre coup de cœur')}
                        </span>
                        <span className="trip-feature-duration">{t.duration}</span>
                      </div>
                      <div className="trip-feature-body">
                        <div className="trip-feature-eyebrow">
                          {tx('Chapter', 'Kapittel', 'Chapitre')} {t.chapter} · {t.duration}
                        </div>
                        <h3 className="trip-feature-title">{typeof t.title === 'object' ? (t.title[lang] || t.title.en) : t.title}</h3>
                        <p className="trip-feature-teaser">{typeof t.teaser === 'object' ? (t.teaser[lang] || t.teaser.en) : t.teaser}</p>
                        {t.idealFor && (
                          <div className="trip-feature-ideal">
                            <span className="trip-feature-ideal-label">{tx('Ideal for', 'Perfekt for', 'Idéal pour')}</span>
                            <span>{typeof t.idealFor === 'object' ? (t.idealFor[lang] || t.idealFor.en) : t.idealFor}</span>
                          </div>
                        )}
                        {Array.isArray(t.highlights) && t.highlights.length > 0 && (
                          <ul className="trip-feature-highlights">
                            {t.highlights.slice(0, 5).map((h, hi) => (
                              <li key={hi}>{typeof h === 'object' ? (h[lang] || h.en) : h}</li>
                            ))}
                          </ul>
                        )}
                        <div className="trip-feature-foot">
                          <button className="trip-feature-cta" onClick={(e) => { e.stopPropagation(); handleOpen(); }}>
                            {tx('See full itinerary', 'Se hele reisen', 'Voir l\'itinéraire')} →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={t.slug} className={`cat-card reveal ${isTheme ? 'cat-card-theme' : ''}`} style={{ transitionDelay: `${(i % 6) * 50}ms` }}
                    onClick={handleOpen} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleOpen()}>
                    <div className="cat-img" style={{ backgroundImage: `url(${t.img})`, cursor: 'pointer' }}>
                      <div className="cat-img-content">
                        <span className="cat-tag brand">{isTheme ? `${t.emoji} ${tx('Theme','Tema','Thème')}` : t.duration}</span>
                      </div>
                      {t.badge && <span className="reiseplan-badge">{typeof t.badge === 'object' ? (t.badge[lang] || t.badge.en) : t.badge}</span>}
                    </div>
                    <div className="cat-body trip-card-body">
                      <h3 className="cat-title trip-card-title">{typeof t.title === 'object' ? (t.title[lang] || t.title.en) : t.title}</h3>
                      <span className="cat-area trip-card-route"><Iit.Pin s={12} /> {t.route}</span>
                      <p className="cat-desc trip-card-desc">{typeof t.teaser === 'object' ? (t.teaser[lang] || t.teaser.en) : t.teaser}</p>
                      {Array.isArray(t.themeTags) && t.themeTags.length > 0 && (
                        <div className="trip-card-tags">
                          {t.themeTags.slice(0, 3).map((tag, ti) => (
                            <span key={ti} className="trip-card-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="cat-foot trip-card-foot">
                        <span className="trip-card-cta-label">
                          {isTheme
                            ? tx('Plan this →', 'Planlegg →', 'Planifier →')
                            : tx('See details →', 'Se detaljer →', 'Voir →')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

        {hasMore && (
          <div className="cat-showmore-row">
            <button className="cat-showmore" onClick={() => setVisibleCount(c => c + 4)}>
              {tx(`Show more (${items.length - visibleCount} left)`,
                  `Vis flere (${items.length - visibleCount} igjen)`,
                  `Voir plus (${items.length - visibleCount} restants)`)}
              <Iit.Arrow s={14} />
            </button>
            {visibleCount + 4 < items.length && (
              <button className="cat-showall" onClick={() => setVisibleCount(items.length)}>
                {tx('Show all', 'Vis alle', 'Tout voir')}
              </button>
            )}
          </div>
        )}
      </div>

      {openTrip && <ItinModal trip={openTrip} lang={lang} fmt={adjustedPrice} onClose={() => setOpenTrip(null)} />}
    </section>
  );
}

window.MS_ITINERARIES = ITINS;
window.MS_Itineraries = Itineraries;
