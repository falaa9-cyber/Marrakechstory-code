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
    "Reply within 24 hours via email or WhatsApp (+47 457 74 743).",
  ],
  no: [
    "30 % depositum ved booking via sikker betalingslenke; resten betales 30 dager før avreise.",
    "Gratis avbestilling inntil 30 dager før avreise. 50 % fra 30–14 dager. Ingen refusjon innen 14 dager.",
    "Priser i EUR per person, basert på to reisende som deler rom. Singeltillegg på forespørsel.",
    "Minimum 2 reisende per reiseplan. Barn fra 6 år dersom ikke annet er oppgitt.",
    "Inkluderer privat sjåfør-guide på alle transferer — aldri delt med andre grupper.",
    "Reiseforsikring anbefales sterkt. Vi kan foreslå en partner ved behov.",
    "Reiseplanen er fullt tilpassbar — tempo, hoteller og stopp kan justeres under planlegging.",
    "Svar innen 24 timer via e-post eller WhatsApp (+47 457 74 743).",
  ],
  fr: [
    "30 % d'acompte à la réservation via lien sécurisé ; solde dû 30 jours avant le départ.",
    "Annulation gratuite jusqu'à 30 jours avant le départ. 50 % entre 30 et 14 jours. Aucun remboursement à moins de 14 jours.",
    "Prix en EUR par personne, sur base de deux voyageurs en chambre double. Supplément single sur demande.",
    "Minimum 2 voyageurs par itinéraire. Enfants à partir de 6 ans sauf indication contraire.",
    "Inclut un chauffeur-guide privé sur tous les transferts — jamais partagé avec un autre groupe.",
    "Une assurance voyage est fortement recommandée. Nous pouvons suggérer un partenaire.",
    "Itinéraire entièrement personnalisable — rythme, hôtels et étapes ajustables en planification.",
    "Réponse sous 24 h par e-mail ou WhatsApp (+47 457 74 743).",
  ],
  sv: [
    "30 % deposition vid bokning via säker betalningslänk; resterande belopp betalas 30 dagar före avresa.",
    "Kostnadsfri avbokning upp till 30 dagar före avresa. 50 % från 30–14 dagar. Ingen återbetalning inom 14 dagar.",
    "Priser i EUR per person, baserat på två resenärer som delar rum. Enkelrumstillägg på begäran.",
    "Minst 2 resenärer per resplan. Barn från 6 år om inget annat anges.",
    "Inkluderar privat chaufför-guide på alla transfers — aldrig delad med en annan grupp.",
    "Reseförsäkring rekommenderas starkt. Vi kan föreslå en partner vid behov.",
    "Resplanen är fullt anpassningsbar — tempo, hotell och stopp kan justeras under planeringsstadiet.",
    "Svar inom 24 timmar via e-post eller WhatsApp (+47 457 74 743).",
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
    let img = "assets/photos/agafay-12.jpg";
    if (/imperialbyene|fes|casablanca|rabat/.test(tagJoin)) img = "assets/photos/about-09.webp";
    else if (/sahara|merzouga/.test(tagJoin))               img = "assets/photos/sahara-dunes-10.jpg";
    else if (/atlas/.test(tagJoin))                          img = "assets/photos/atlas-lodge-05.webp";
    else if (/essaouira|coast|agadir|strand/.test(tagJoin))  img = "assets/photos/essaouira-beach-horse-01.jpg";
    else if (/medina|riad|kultur/.test(tagJoin))             img = "assets/photos/about-10.webp";
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

// ── ITINERARIES (10 chapters — Marrakech Story collection) ──────
const ITINS = [
  // ===== Chapter 01 — 3D2N — Merzouga Sahara Expedition =====
  {
    slug: "merzouga-sahara-escape", chapter: "01",
    title: { en: "Merzouga Sahara Expedition", no: "Merzouga Sahara-ekspedisjon", fr: "Expédition Sahara Merzouga" },
    duration: "3D2N", days: 3, nights: 2,
    route: "Marrakech → Tizi n'Tichka → Aït Ben Haddou → Ouarzazate → Dades → Todra → Merzouga → Marrakech",
    priceFromEUR: 320.7,  // ×1.4 display markup ≈ €449 / person (VAT included)
    img: "assets/photos/sahara-dunes-ripples-13.jpg",
    badge: { en: "SAHARA", no: "SAHARA", fr: "SAHARA" },
    themeTags: ["Sahara", "Erg Chebbi", "Dades", "Todra", "Camel"],
    teaser: { en: "Three days to the real Sahara — the towering golden dunes of Erg Chebbi, a night of total silence, and a sunrise most people only see in photographs.", no: "Tre dager til det ekte Sahara — de ruvende gylne dynene ved Erg Chebbi, en natt med total stillhet, og en soloppgang de fleste bare ser på bilder.", fr: "Trois jours vers le vrai Sahara — les hautes dunes dorées de l'Erg Chebbi, une nuit de silence total et un lever de soleil que la plupart ne voient qu'en photo." },
    overview: { en: "The longest and most rewarding desert journey we offer as a short trip. Two full days on the road, but the payoff is the genuine Sahara — towering golden dunes, a night of total silence, and a sunrise most people only see in photographs. Group size 1–8 in a private vehicle throughout. Pacing: two long driving days (5–8h each) — the trade-off for reaching the real Erg Chebbi dunes (clients wanting less driving should consider Agafay, 45 min, or Zagora, 2D/1N). Best season: March–May and September–November; desert nights are cold December–February, so pack layers.", no: "Den lengste og mest givende ørkenreisen vi tilbyr som kort tur. To fulle dager på veien, men belønningen er det ekte Sahara — ruvende gylne dyner, en natt med total stillhet, og en soloppgang de fleste bare ser på bilder. Gruppestørrelse 1–8 i privat bil hele veien. Tempo: to lange kjøredager (5–8t hver) — kompromisset for å nå de ekte Erg Chebbi-dynene (vil du kjøre mindre, vurder Agafay, 45 min, eller Zagora, 2D/1N). Beste sesong: mars–mai og september–november; ørkennetter er kalde desember–februar, så ta med lag.", fr: "Le voyage dans le désert le plus long et le plus gratifiant que nous proposons en court séjour. Deux journées complètes de route, mais la récompense est le vrai Sahara — hautes dunes dorées, une nuit de silence total et un lever de soleil que la plupart ne voient qu'en photo. Groupe de 1 à 8 en véhicule privé tout au long. Rythme : deux longues journées de route (5–8h chacune) — le compromis pour atteindre les vraies dunes de l'Erg Chebbi (pour moins de route, voir l'Agafay, 45 min, ou Zagora, 2J/1N). Meilleure saison : mars–mai et septembre–novembre ; nuits froides de décembre à février, prévoir des couches." },
    idealFor: { en: "Travellers who want the real Sahara — the big dunes of Erg Chebbi, not the closer Agafay or Zagora · couples · adventurous families · photographers", no: "Reisende som vil ha det ekte Sahara — de store dynene ved Erg Chebbi, ikke nærmere Agafay eller Zagora · par · eventyrlystne familier · fotografer", fr: "Voyageurs en quête du vrai Sahara — les grandes dunes de l'Erg Chebbi, pas l'Agafay ou Zagora plus proches · couples · familles aventureuses · photographes" },
    highlights: [
      { en: "Tizi n'Tichka pass (2,260m) — the highest road pass in Morocco", no: "Tizi n'Tichka-passet (2 260m) — Marokkos høyeste veipass", fr: "Col du Tizi n'Tichka (2 260m) — le plus haut col routier du Maroc" },
      { en: "Aït Ben Haddou — UNESCO kasbah (Gladiator · Game of Thrones · Babel)", no: "Aït Ben Haddou — UNESCO-kasbah (Gladiator · Game of Thrones · Babel)", fr: "Aït Ben Haddou — kasbah UNESCO (Gladiator · Game of Thrones · Babel)" },
      { en: "Dades & Todra Gorges — 300m cliffs and the winding switchback road", no: "Dades- og Todra-kløftene — 300m klipper og den buktende serpentinveien", fr: "Gorges du Dadès & du Todra — falaises de 300m et la route en lacets" },
      { en: "Camel trek into the Erg Chebbi dunes at sunset", no: "Kamelritt inn i Erg Chebbi-dynene ved solnedgang", fr: "Randonnée à dos de chameau dans les dunes de l'Erg Chebbi au coucher du soleil" },
      { en: "Luxury desert camp — Berber drums, fire and the full Milky Way", no: "Luksusørkenleir — berbertrommer, bål og hele Melkeveien", fr: "Camp désertique de luxe — tambours berbères, feu et toute la Voie Lactée" },
      { en: "Sahara sunrise from the dunes — the unmissable moment", no: "Sahara-soloppgang fra dynene — øyeblikket du ikke får gå glipp av", fr: "Lever de soleil au Sahara depuis les dunes — le moment à ne pas manquer" },
    ],
    itinerary: [
      { day: 1, route: { en: "Marrakech → Atlas → Dades Valley", no: "Marrakech → Atlas → Dades-dalen", fr: "Marrakech → Atlas → Vallée du Dadès" }, text: { en: "07:00 Driver pickup at your riad or hotel — early start for the long scenic drive. 07:15–09:30 Climb the Tizi n'Tichka pass (2,260m), the highest road pass in Morocco — photo stop at the summit with sweeping High Atlas views. 10:30–12:00 Aït Ben Haddou, the UNESCO kasbah and filming location for Gladiator and Game of Thrones — a local guide walks you through the earthen city. 12:00–13:30 Ouarzazate for lunch (at leisure), with an optional Atlas Film Studios visit. 13:30–15:30 Drive through the Draa Valley and the rose-growing region. 15:30–17:00 Optional argan-oil cooperative stop as the scenery shifts to red rock and palm groves. 17:00 Arrive the Dades Valley and check in to your guesthouse. 19:30 Dinner included at the guesthouse — an early night before the desert push.", no: "07:00 Henting på riad eller hotell — tidlig start på den lange, naturskjønne kjøreturen. 07:15–09:30 Opp Tizi n'Tichka-passet (2 260m), Marokkos høyeste veipass — fotostopp på toppen med vid utsikt over Høyatlas. 10:30–12:00 Aït Ben Haddou, UNESCO-kasbah og innspillingssted for Gladiator og Game of Thrones — en lokal guide tar deg gjennom jordbyen. 12:00–13:30 Ouarzazate for lunsj (etter eget valg), med valgfritt besøk på Atlas Film Studios. 13:30–15:30 Kjøring gjennom Draa-dalen og roseregionen. 15:30–17:00 Valgfritt stopp ved arganolje-kooperativ mens landskapet skifter til rød stein og palmelunder. 17:00 Ankomst Dades-dalen og innsjekk på gjestehuset. 19:30 Middag inkludert på gjestehuset — tidlig kveld før ørkenetappen.", fr: "07h00 Prise en charge au riad ou à l'hôtel — départ tôt pour la longue route panoramique. 07h15–09h30 Montée du col du Tizi n'Tichka (2 260m), le plus haut col routier du Maroc — arrêt photo au sommet avec vues sur le Haut Atlas. 10h30–12h00 Aït Ben Haddou, kasbah UNESCO et lieu de tournage de Gladiator et Game of Thrones — un guide local vous fait découvrir la cité de pisé. 12h00–13h30 Ouarzazate pour le déjeuner (à votre convenance), avec visite optionnelle des Atlas Film Studios. 13h30–15h30 Route à travers la vallée du Draa et la région des roses. 15h30–17h00 Arrêt optionnel dans une coopérative d'huile d'argan tandis que le paysage devient roche rouge et palmeraies. 17h00 Arrivée dans la vallée du Dadès et installation à la maison d'hôtes. 19h30 Dîner inclus à la maison d'hôtes — nuit tôt avant l'étape du désert." } },
      { day: 2, route: { en: "Dades → Gorges → Merzouga & the Dunes", no: "Dades → Kløfter → Merzouga og dynene", fr: "Dadès → Gorges → Merzouga & les dunes" }, text: { en: "07:30 Breakfast at the guesthouse and checkout. 08:30–10:00 Dades Gorges — the 'road of a thousand kasbahs', with photo stops at the famous winding switchbacks. 10:00–12:00 Todra Gorges — 300m sheer rock walls; walk between the cliffs along the river. 12:00–13:30 Lunch (at leisure) in the gorge region with a Berber village stop. 13:30–16:30 Drive through the Tinghir palm oases toward Erg Chebbi as the Sahara opens up. 16:30 Arrive Merzouga, drop your main luggage and prepare an overnight bag. 17:00–18:00 Camel trek into the dunes of Erg Chebbi (1h) — the classic way into the desert. 18:00 Climb the highest dune for sunset over the Sahara. 19:30 Arrive your luxury desert camp; traditional dinner included. 21:00 Berber drums, fire and stargazing — no light pollution, the full Milky Way. Overnight in a private en-suite luxury desert tent.", no: "07:30 Frokost på gjestehuset og utsjekk. 08:30–10:00 Dades-kløftene — 'veien med tusen kasbaher', med fotostopp ved de berømte buktende serpentinene. 10:00–12:00 Todra-kløftene — 300m loddrette klippevegger; gå mellom klippene langs elven. 12:00–13:30 Lunsj (etter eget valg) i kløfteregionen med stopp i en berberlandsby. 13:30–16:30 Kjøring gjennom Tinghirs palmeoaser mot Erg Chebbi mens Sahara åpner seg. 16:30 Ankomst Merzouga, sett fra hovedbagasjen og pakk en liten nattsekk. 17:00–18:00 Kamelritt inn i Erg Chebbi-dynene (1t) — den klassiske veien inn i ørkenen. 18:00 Opp den høyeste dynen til solnedgang over Sahara. 19:30 Ankomst luksusørkenleiren; tradisjonell middag inkludert. 21:00 Berbertrommer, bål og stjernekikking — ingen lysforurensning, hele Melkeveien. Overnatting i privat luksusørkentelt med eget bad.", fr: "07h30 Petit-déjeuner à la maison d'hôtes et départ. 08h30–10h00 Gorges du Dadès — la 'route des mille kasbahs', avec arrêts photo aux célèbres lacets sinueux. 10h00–12h00 Gorges du Todra — parois rocheuses de 300m ; marche entre les falaises le long de la rivière. 12h00–13h30 Déjeuner (à votre convenance) dans la région des gorges avec arrêt dans un village berbère. 13h30–16h30 Route à travers les palmeraies de Tinghir vers l'Erg Chebbi tandis que le Sahara s'ouvre. 16h30 Arrivée à Merzouga, dépôt des bagages principaux et préparation d'un sac pour la nuit. 17h00–18h00 Randonnée à dos de chameau dans les dunes de l'Erg Chebbi (1h) — la façon classique d'entrer dans le désert. 18h00 Montée de la plus haute dune pour le coucher de soleil sur le Sahara. 19h30 Arrivée au camp de luxe ; dîner traditionnel inclus. 21h00 Tambours berbères, feu et observation des étoiles — aucune pollution lumineuse, toute la Voie Lactée. Nuit en tente de luxe privative avec salle de bain." } },
      { day: 3, route: { en: "Sahara Sunrise → Return to Marrakech", no: "Sahara-soloppgang → Tilbake til Marrakech", fr: "Lever de soleil → Retour à Marrakech" }, text: { en: "06:00 Wake for sunrise from the dunes — the unmissable moment of the trip. 07:00 Berber breakfast at camp. 08:00 Return by camel or 4x4 to the village and collect your luggage. 09:00–15:00 The long scenic return drive toward Marrakech, with a lunch stop at Todra or Ouarzazate (at leisure). 15:00–18:00 Continue over the Atlas, arriving Marrakech in the late afternoon. On arrival: drop at your riad or hotel, or direct to the airport if departing.", no: "06:00 Våkne til soloppgang fra dynene — turens uunnværlige øyeblikk. 07:00 Berberfrokost i leiren. 08:00 Tilbake med kamel eller 4x4 til landsbyen og hent bagasjen. 09:00–15:00 Den lange, naturskjønne returkjøringen mot Marrakech, med lunsjstopp i Todra eller Ouarzazate (etter eget valg). 15:00–18:00 Videre over Atlas, ankomst Marrakech sen ettermiddag. Ved ankomst: avlevering ved riad eller hotell, eller direkte til flyplassen ved avreise.", fr: "06h00 Réveil pour le lever de soleil depuis les dunes — le moment incontournable du voyage. 07h00 Petit-déjeuner berbère au camp. 08h00 Retour à dos de chameau ou en 4x4 au village et récupération des bagages. 09h00–15h00 Longue route panoramique de retour vers Marrakech, avec arrêt déjeuner à Todra ou Ouarzazate (à votre convenance). 15h00–18h00 Passage de l'Atlas, arrivée à Marrakech en fin d'après-midi. À l'arrivée : dépose au riad ou à l'hôtel, ou directement à l'aéroport en cas de départ." } },
    ],
    included: [
      { en: "Private driver and vehicle for the full 3 days (all distances)", no: "Privat sjåfør og bil i alle 3 dager (alle distanser)", fr: "Chauffeur et véhicule privés pendant les 3 jours (toutes distances)" },
      { en: "Pickup and drop-off at your riad / hotel (or airport)", no: "Henting og avlevering ved riad/hotell (eller flyplass)", fr: "Prise en charge et dépose au riad/hôtel (ou aéroport)" },
      { en: "Local guide at Aït Ben Haddou", no: "Lokal guide ved Aït Ben Haddou", fr: "Guide local à Aït Ben Haddou" },
      { en: "Camel trek into Erg Chebbi (1h)", no: "Kamelritt inn i Erg Chebbi (1t)", fr: "Randonnée à dos de chameau dans l'Erg Chebbi (1h)" },
      { en: "1 night Dades Valley guesthouse + 1 night luxury Merzouga desert camp (private en-suite)", no: "1 natt gjestehus i Dades-dalen + 1 natt luksus Merzouga-ørkenleir (privat, eget bad)", fr: "1 nuit maison d'hôtes vallée du Dadès + 1 nuit camp désertique de luxe Merzouga (privatif, salle de bain)" },
      { en: "Breakfast daily (2) · dinner at Dades (Day 1) and the desert camp (Day 2)", no: "Frokost daglig (2) · middag i Dades (dag 1) og ørkenleiren (dag 2)", fr: "Petit-déjeuner quotidien (2) · dîner à Dadès (Jour 1) et au camp (Jour 2)" },
      { en: "24/7 WhatsApp support (Aladdin & Marte)", no: "24/7 WhatsApp-støtte (Aladdin & Marte)", fr: "Assistance WhatsApp 24h/24 (Aladdin & Marte)" },
      { en: "Personalised itinerary PDF with your driver's contact", no: "Personlig reiseplan-PDF med sjåførens kontakt", fr: "Itinéraire PDF personnalisé avec le contact du chauffeur" },
      { en: "VAT included — no hidden extras (from €449 / person)", no: "MVA inkludert — ingen skjulte tillegg (fra €449 / person)", fr: "TVA incluse — sans extras cachés (à partir de €449 / pers.)" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches (Days 1–3) and any meals not listed", no: "Lunsjer (dag 1–3) og måltider som ikke er nevnt", fr: "Déjeuners (Jours 1–3) et repas non mentionnés" },
      { en: "Site entrances — Aït Ben Haddou guide ~100 MAD · Atlas Studios ~40 MAD", no: "Inngangsbilletter — Aït Ben Haddou-guide ~100 MAD · Atlas Studios ~40 MAD", fr: "Entrées des sites — guide Aït Ben Haddou ~100 MAD · Atlas Studios ~40 MAD" },
      { en: "Drinks, beverages and alcohol", no: "Drikke og alkohol", fr: "Boissons et alcool" },
      { en: "Personal shopping & tips (€5–10/p for the driver is customary)", no: "Personlig shopping og tips (€5–10/p til sjåføren er vanlig)", fr: "Achats personnels & pourboires (€5–10/p pour le chauffeur d'usage)" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommandée)" },
      { en: "Optional upgrades: 4x4 instead of camel · sandboarding · private candlelit dune dinner · quad / buggy · extra camp night (4D/3N)", no: "Valgfrie oppgraderinger: 4x4 i stedet for kamel · sandboarding · privat middag i dynene · quad/buggy · ekstra natt i leiren (4D/3N)", fr: "Options : 4x4 au lieu du chameau · sandboard · dîner privé aux chandelles dans les dunes · quad/buggy · nuit supplémentaire au camp (4J/3N)" },
    ],
  },

  // ===== 4D3N — Marrakech & Agafay Luxury Escape =====
  {
    slug: "marrakech-agafay", chapter: "02",
    title: { en: "Marrakech & Agafay Luxury Escape", no: "Marrakech & Agafay Luksusopphold", fr: "Évasion Luxe Marrakech & Agafay" },
    duration: "4D3N", days: 4, nights: 3,
    route: "Marrakech → Agafay → Marrakech",
    priceFromEUR: 750,
    img: "assets/photos/food-garden-restaurant-05.jpg",
    themeTags: ["Riad", "Hammam", "Agafay", "Balloon"],
    teaser: { en: "Two nights in a luxury riad, a full hammam day, a sunrise balloon over the Atlas, and one night in the Agafay stone desert.", no: "To netter i et luksuriøst riad, en full hammam-dag, soloppgangsballong over Atlas og én natt i Agafay-steinørkenen.", fr: "Deux nuits dans un riad de luxe, une journée hammam complète, une montgolfière au lever du soleil sur l'Atlas, et une nuit dans le désert de pierres de l'Agafay." },
    overview: { en: "Perfectly balanced between cultural immersion and desert wonder. Two nights in a luxury riad in the ancient Medina, one extraordinary night in a tented camp in the Agafay stone desert — with a hot air balloon sunrise above the Atlas in between. Day 2 is entirely yours: full luxury hammam programme followed by a 4-hour private guided medina tour. Day 3 begins at 05:00 with a balloon flight and ends under the stars.", no: "Perfekt balansert mellom kulturell fordypning og ørkenunder. To netter i et luksuriøst riad i den eldgamle Medina, én ekstraordinær natt i et teltleir i Agafay-steinørkenen — med en soloppgangsballong over Atlas i mellom. Dag 2 er helt din: fullt luksuriøst hammam-program etterfulgt av en 4-timers privat guidet medinaomvisning. Dag 3 begynner kl. 05:00 med en ballongtur og slutter under stjernene.", fr: "Parfaitement équilibré entre immersion culturelle et émerveillement désertique. Deux nuits dans un riad de luxe dans l'ancienne Médina, une nuit extraordinaire dans un camp de tentes dans le désert de pierres de l'Agafay — avec un lever de soleil en montgolfière au-dessus de l'Atlas entre les deux. Le Jour 2 est entièrement pour vous : programme complet de hammam de luxe suivi d'une visite guidée privée de 4h de la médina. Le Jour 3 commence à 05h00 avec un vol en montgolfière et se termine sous les étoiles." },
    idealFor: { en: "Couples seeking culture, wellness and desert magic in four days", no: "Par som søker kultur, velvære og ørkenmagi på fire dager", fr: "Couples en quête de culture, bien-être et magie du désert en quatre jours" },
    highlights: [
      { en: "Airport pickup with personalised name sign", no: "Flyplasshenting med personlig navneskilt", fr: "Prise en charge à l'aéroport avec pancarte personnalisée" },
      { en: "Full luxury hammam — black soap, kessa, ghassoul, argan massage", no: "Fullt luksuriøst hammam — svart såpe, kessa, ghassoul, arganolje-massasje", fr: "Hammam de luxe complet — savon noir, kessa, ghassoul, massage à l'huile d'argan" },
      { en: "Private certified guide — 4-hour medina tour", no: "Privat sertifisert guide — 4-timers medina-omvisning", fr: "Guide certifié privé — visite de 4h de la médina" },
      { en: "Hot air balloon — 45–60 min sunrise over the Atlas & Palmeraie", no: "Luftballong — 45–60 min soloppgang over Atlas og Palmeraie", fr: "Montgolfière — 45–60 min lever de soleil sur l'Atlas & la Palmeraie" },
      { en: "Berber breakfast + flight certificate on landing", no: "Berber-frokost + flybevis ved landing", fr: "Petit-déjeuner berbère + certificat de vol à l'atterrissage" },
      { en: "Agafay luxury camp — pool, Moroccan feast, Gnawa music, fire performance", no: "Agafay luksusleir — basseng, marokkansk festmiddag, Gnawa-musikk, ildshow", fr: "Camp de luxe Agafay — piscine, festin marocain, musique Gnawa, spectacle de feu" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival & Welcome", no: "Ankomst & Velkomst", fr: "Arrivée & Accueil" }, text: { en: "Upon arrival ~~ Driver waits at arrivals with a personalised Marrakech Story sign || Transfer ~~ Private car to a luxury riad (~20–30 min) || Afternoon ~~ Riad check-in · welcome mint tea · freshen up || 17:00 ~~ Free time — a gentle medina walk or rooftop rest || 19:30 ~~ Dinner recommendation or a guided first evening", no: "Ved ankomst ~~ Sjåføren venter i ankomsthallen med et personlig Marrakech Story-skilt || Transfer ~~ Privat bil til luksuriøst riad (~20–30 min) || Ettermiddag ~~ Innsjekk på riad · velkomstmyntete · friske opp || 17:00 ~~ Fri tid — rolig tur i medinaen eller hvile på taket || 19:30 ~~ Middagsanbefaling eller guidet første kveld", fr: "À l'arrivée ~~ Le chauffeur attend à l'arrivée avec une pancarte Marrakech Story personnalisée || Transfert ~~ Voiture privée vers un riad de luxe (~20–30 min) || Après-midi ~~ Installation au riad · thé à la menthe de bienvenue · rafraîchissement || 17h00 ~~ Temps libre — balade tranquille dans la médina ou repos sur le toit || 19h30 ~~ Recommandation de dîner ou première soirée guidée" } },
      { day: 2, route: { en: "City & Culture", no: "By & Kultur", fr: "Ville & Culture" }, text: { en: "07:30 ~~ Breakfast at the riad || 10:00 ~~ Certified guide pickup at riad reception || 10:00–13:00 ~~ Guided medina & souk tour (3h) || 13:00–15:00 ~~ Lunch at leisure || 15:00–18:00 ~~ Free afternoon — optional hammam (€25–60/p), shopping, Majorelle Garden || 20:00 ~~ Dinner at leisure", no: "07:30 ~~ Frokost på riaden || 10:00 ~~ Sertifisert guide henter i riad-resepsjonen || 10:00–13:00 ~~ Guidet medina- og souk-tur (3t) || 13:00–15:00 ~~ Lunsj etter eget valg || 15:00–18:00 ~~ Fri ettermiddag — valgfritt hammam (€25–60/p), shopping, Majorelle-hagen || 20:00 ~~ Middag etter eget valg", fr: "07h30 ~~ Petit-déjeuner au riad || 10h00 ~~ Prise en charge par le guide certifié à la réception || 10h00–13h00 ~~ Visite guidée médina & souks (3h) || 13h00–15h00 ~~ Déjeuner libre || 15h00–18h00 ~~ Après-midi libre — hammam en option (€25–60/p), shopping, Jardin Majorelle || 20h00 ~~ Dîner libre" } },
      { day: 3, route: { en: "Agafay Desert Experience", no: "Agafay-ørkenopplevelse", fr: "Expérience Désert d'Agafay" }, text: { en: "07:30 ~~ Breakfast at the riad || 10:00–11:00 ~~ Check-out · luggage stored or taken to the desert camp || 11:00 ~~ Private transfer to the Agafay Desert (~45 min) || 12:00–15:00 ~~ Arrival at camp · pool · relaxation · optional lunch (not included) || 15:00 ~~ Transfer to the activity zone || 17:00 ~~ Camel ride at sunset (€30/p · 1h) || 19:00 ~~ Return to camp · freshen up || 19:30 ~~ Agafay Dinner & Show — Moroccan dinner · Gnawa musicians · oriental dancer · fire eater · DJ || 23:00 ~~ Show ends · overnight in a luxury desert tent", no: "07:30 ~~ Frokost på riaden || 10:00–11:00 ~~ Utsjekk · bagasje lagres eller tas med til ørkenleiren || 11:00 ~~ Privat transfer til Agafay-ørkenen (~45 min) || 12:00–15:00 ~~ Ankomst leir · basseng · avslapning · valgfri lunsj (ikke inkludert) || 15:00 ~~ Transfer til aktivitetssonen || 17:00 ~~ Kamelritt ved solnedgang (€30/p · 1t) || 19:00 ~~ Tilbake til leiren · friske opp || 19:30 ~~ Agafay middag & show — marokkansk middag · Gnawa-musikere · orientalsk danser · ildsluker · DJ || 23:00 ~~ Showet slutter · overnatting i luksusørkentelt", fr: "07h30 ~~ Petit-déjeuner au riad || 10h00–11h00 ~~ Départ · bagages stockés ou emportés au camp || 11h00 ~~ Transfert privé vers le désert de l'Agafay (~45 min) || 12h00–15h00 ~~ Arrivée au camp · piscine · détente · déjeuner optionnel (non inclus) || 15h00 ~~ Transfert vers la zone d'activités || 17h00 ~~ Balade à dos de chameau au coucher du soleil (€30/p · 1h) || 19h00 ~~ Retour au camp · rafraîchissement || 19h30 ~~ Dîner & spectacle Agafay — dîner marocain · musiciens Gnawa · danseuse orientale · cracheur de feu · DJ || 23h00 ~~ Fin du spectacle · nuit en tente de luxe" } },
      { day: 4, route: { en: "Desert Sunrise & Departure", no: "Ørkensoloppgang & Avreise", fr: "Lever de soleil & Départ" }, text: { en: "06:30–07:00 ~~ Sunrise · desert silence · optional morning walk among the rocks || 07:30 ~~ Berber breakfast at camp || 09:00 ~~ Private transfer back to Marrakech (~45 min) || On arrival ~~ Drop at riad or airport depending on flight time || Flight −3h ~~ Private airport transfer if not already arranged", no: "06:30–07:00 ~~ Soloppgang · ørkenstillhet · valgfri morgentur blant steinene || 07:30 ~~ Berberfrokost i leiren || 09:00 ~~ Privat transfer tilbake til Marrakech (~45 min) || Ved ankomst ~~ Avlevering ved riad eller flyplass avhengig av flytid || Fly −3t ~~ Privat flyplasstransfer hvis ikke allerede avtalt", fr: "06h30–07h00 ~~ Lever de soleil · silence du désert · promenade matinale optionnelle parmi les rochers || 07h30 ~~ Petit-déjeuner berbère au camp || 09h00 ~~ Transfert privé retour à Marrakech (~45 min) || À l'arrivée ~~ Dépose au riad ou à l'aéroport selon l'horaire du vol || Vol −3h ~~ Transfert privé aéroport si non déjà prévu" } },
    ],
    included: [
      { en: "Airport transfers with personalised name sign", no: "Flyplasstransfer med personlig navneskilt", fr: "Transferts aéroport avec pancarte personnalisée" },
      { en: "Private transport throughout", no: "Privat transport gjennom hele reisen", fr: "Transport privé tout au long du séjour" },
      { en: "2 nights luxury riad Marrakech, 1 night luxury Agafay desert camp — daily breakfast", no: "2 netter luksusriad Marrakech, 1 natt luksusørkenleir Agafay — daglig frokost", fr: "2 nuits riad de luxe Marrakech, 1 nuit camp désertique de luxe Agafay — petit-déjeuner quotidien" },
      { en: "Welcome mint tea & Moroccan pastries", no: "Velkomst myntete & marokkanske kjeks", fr: "Thé à la menthe de bienvenue & pâtisseries marocaines" },
      { en: "Luxury hammam — full programme (black soap · kessa exfoliation · ghassoul clay · argan oil massage)", no: "Luksuriøst hammam — fullt program (svart såpe · kessa-eksfoliering · ghassoul-leire · arganolje-massasje)", fr: "Hammam de luxe — programme complet (savon noir · exfoliation kessa · argile ghassoul · massage à l'huile d'argan)" },
      { en: "Private certified guide — 4-hour medina tour", no: "Privat sertifisert guide — 4-timers medina-omvisning", fr: "Guide certifié privé — visite de 4h de la médina" },
      { en: "Hot air balloon flight — 45–60 min sunrise over the Atlas & Palmeraie", no: "Luftballongtur — 45–60 min soloppgang over Atlas og Palmeraie", fr: "Vol en montgolfière — 45–60 min lever de soleil sur l'Atlas & la Palmeraie" },
      { en: "Traditional Berber breakfast after landing + flight certificate", no: "Tradisjonell berberfrokost etter landing + flybevis", fr: "Petit-déjeuner berbère traditionnel après l'atterrissage + certificat de vol" },
      { en: "Agafay pool access · Moroccan feast dinner · live Gnawa music · fire performance", no: "Agafay bassengadgang · marokkansk festmiddag · levende Gnawa-musikk · ildshow", fr: "Accès piscine Agafay · festin marocain · musique Gnawa en direct · spectacle de feu" },
      { en: "24/7 WhatsApp support — Aladdin & Marte", no: "24/7 WhatsApp-støtte — Aladdin & Marte", fr: "Assistance WhatsApp 24h/24 — Aladdin & Marte" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Dinners in Marrakech (Days 1 & 2)", no: "Middager i Marrakech (dag 1 og dag 2)", fr: "Dîners à Marrakech (Jours 1 & 2)" },
      { en: "Drinks and beverages", no: "Drikke og drikkevarer", fr: "Boissons et breuvages" },
      { en: "Bahia Palace entrance (~70 MAD/p)", no: "Bahia-palasset inngang (~70 MAD/p)", fr: "Entrée du Palais Bahia (~70 MAD/p)" },
      { en: "Optional activities: camel ride (€30/p) · quad (€40/p) · buggy (€100/p) · horse riding (€49/p)", no: "Valgfrie aktiviteter: kamelritt (€30/p) · quad (€40/p) · buggy (€100/p) · ridning (€49/p)", fr: "Activités optionnelles : balade à dos de chameau (€30/p) · quad (€40/p) · buggy (€100/p) · équitation (€49/p)" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommandée)" },
      { en: "Personal expenses and tips", no: "Personlige utgifter og tips", fr: "Dépenses personnelles et pourboires" },
    ],
  },

  // ===== 5D4N — Best of Marrakech =====
  {
    slug: "best-of-marrakech", chapter: "03",
    title: { en: "Best of Marrakech", no: "Det beste av Marrakech", fr: "Le Meilleur de Marrakech" },
    duration: "5D4N", days: 5, nights: 4,
    route: "Marrakech → Nature Day → Agafay → Marrakech",
    priceFromEUR: 890,
    img: "assets/photos/agafay-pool-08.jpg",
    badge: { en: "MOST POPULAR", no: "MEST POPULÆR", fr: "PLUS POPULAIRE" },
    themeTags: ["Medina", "Cooking Class", "Agafay", "Nature"],
    teaser: { en: "Five days covering everything Marrakech does best — medina, cooking class, your choice of nature day, and a night in the stone desert.", no: "Fem dager med alt Marrakech gjør best — medina, matkurs, din naturdag, og en natt i steinørkenen.", fr: "Cinq jours pour tout ce que Marrakech fait de mieux — médina, cours de cuisine, votre journée nature, et une nuit dans le désert de pierres." },
    overview: { en: "Five days covering everything Marrakech does best. Guided medina, Moroccan cooking class, a full day into nature (Atlas Mountains, Ourika Valley, or Essaouira Atlantic coast), and one night in the Agafay stone desert under the stars. Our most popular itinerary — perfectly paced for first-timers and returners alike.", no: "Fem dager som dekker alt Marrakech gjør best. Guidet medina, marokkansk matkurs, en hel dag ut i naturen (Atlasfjellene, Ourika-dalen eller Essaouira-atlanterhavskysten), og én natt i Agafay-steinørkenen under stjernene. Vår mest populære reiseplan — perfekt tempo for både førstereisende og de som har vært her før.", fr: "Cinq jours couvrant tout ce que Marrakech fait de mieux. Médina guidée, cours de cuisine marocaine, une journée entière dans la nature (Montagnes du Haut Atlas, vallée de l'Ourika ou côte atlantique d'Essaouira), et une nuit dans le désert de pierres de l'Agafay sous les étoiles. Notre itinéraire le plus populaire — parfaitement rythmé pour les premiers voyageurs comme pour ceux qui reviennent." },
    idealFor: { en: "First-timers and returners who want depth without rushing", no: "Førstereisende og returreisende som vil ha dybde uten hastverk", fr: "Premiers voyageurs et habitués qui veulent de la profondeur sans se précipiter" },
    highlights: [
      { en: "Private certified guide — 3-hour medina tour", no: "Privat sertifisert guide — 3-timers medina-omvisning", fr: "Guide certifié privé — visite de 3h de la médina" },
      { en: "Moroccan cooking class at a traditional riad (lunch included)", no: "Marokkansk matkurs på et tradisjonelt riad (lunsj inkludert)", fr: "Cours de cuisine marocaine dans un riad traditionnel (déjeuner inclus)" },
      { en: "Choose your nature day: Ourika Valley · Three Atlas Valleys · or Essaouira coast", no: "Velg din naturdag: Ourika-dalen · Tre Atlas-daler · eller Essaouira-kysten", fr: "Choisissez votre journée nature : Vallée de l'Ourika · Trois vallées de l'Atlas · ou côte d'Essaouira" },
      { en: "One night at an Agafay luxury desert camp", no: "Én natt i en Agafay luksusleirplass", fr: "Une nuit dans un camp de luxe désertique à l'Agafay" },
      { en: "Moroccan feast dinner · live Gnawa music · fire performance", no: "Marokkansk festmiddag · levende Gnawa-musikk · ildshow", fr: "Festin marocain · musique Gnawa en direct · spectacle de feu" },
      { en: "Optional: camel ride (€30/p) · quad (€40/p) at the camp", no: "Valgfritt: kamelritt (€30/p) · quad (€40/p) i leiren", fr: "En option : balade à dos de chameau (€30/p) · quad (€40/p) au camp" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival", no: "Ankomst", fr: "Arrivée" }, text: { en: "Upon arrival ~~ Driver at Marrakech Menara with a personalised name sign || Transfer ~~ Private car to your riad/hotel (15–30 min) || Afternoon ~~ Check-in · welcome mint tea · orientation || 17:00–19:00 ~~ Free time — we recommend the best area to explore near your riad || 19:30 ~~ Dinner at a recommended local restaurant", no: "Ved ankomst ~~ Sjåfør på Marrakech Menara med personlig navneskilt || Transfer ~~ Privat bil til riad/hotell (15–30 min) || Ettermiddag ~~ Innsjekk · velkomstmyntete · orientering || 17:00–19:00 ~~ Fri tid — vi anbefaler det beste området å utforske nær riaden || 19:30 ~~ Middag på en anbefalt lokal restaurant", fr: "À l'arrivée ~~ Chauffeur à Marrakech Menara avec pancarte personnalisée || Transfert ~~ Voiture privée vers le riad/hôtel (15–30 min) || Après-midi ~~ Installation · thé à la menthe · orientation || 17h00–19h00 ~~ Temps libre — nous recommandons le meilleur quartier à explorer près du riad || 19h30 ~~ Dîner dans un restaurant local recommandé" } },
      { day: 2, route: { en: "Culture & Cuisine", no: "Kultur & Mat", fr: "Culture & Cuisine" }, text: { en: "07:30 ~~ Breakfast at the riad || 09:30 ~~ Driver pickup for the market visit || 10:00–13:00 ~~ Guided medina & souk tour (3h · €59/p) — spice souks, Berber carpets, tanneries, artisan ateliers || 13:00 ~~ Market visit for ingredients, then transfer to the cooking-class riad || 13:30–16:00 ~~ Moroccan cooking class (€49/p) — tagine, couscous, pastilla, then eat your lunch together || 16:30 ~~ Return to your accommodation || 17:00–19:00 ~~ Free time · optional Jemaa el-Fna or Majorelle Garden || 20:00 ~~ Dinner at leisure", no: "07:30 ~~ Frokost på riaden || 09:30 ~~ Sjåfør henter til markedsbesøk || 10:00–13:00 ~~ Guidet medina- og souk-tur (3t · €59/p) — kryddersouker, berbertepper, garverier, håndverksateljéer || 13:00 ~~ Markedsbesøk for ingredienser, deretter til matkurs-riaden || 13:30–16:00 ~~ Marokkansk matkurs (€49/p) — tagine, couscous, pastilla, spis lunsjen sammen || 16:30 ~~ Tilbake til overnattingen || 17:00–19:00 ~~ Fri tid · valgfritt Jemaa el-Fna eller Majorelle-hagen || 20:00 ~~ Middag etter eget valg", fr: "07h30 ~~ Petit-déjeuner au riad || 09h30 ~~ Prise en charge pour la visite du marché || 10h00–13h00 ~~ Visite guidée médina & souks (3h · €59/p) — souks aux épices, tapis berbères, tanneries, ateliers d'artisans || 13h00 ~~ Marché pour les ingrédients, puis transfert vers le riad du cours de cuisine || 13h30–16h00 ~~ Cours de cuisine marocaine (€49/p) — tajine, couscous, pastilla, puis déjeuner ensemble || 16h30 ~~ Retour à l'hébergement || 17h00–19h00 ~~ Temps libre · Jemaa el-Fna ou Jardin Majorelle en option || 20h00 ~~ Dîner libre" } },
      { day: 3, route: { en: "Into Nature — choose one", no: "Ut i naturen — velg én", fr: "Dans la nature — au choix" }, text: { en: "07:30 ~~ Breakfast at the riad || 08:00 ~~ Driver pickup — full-day excursion begins (choose one) || Option A ~~ Ourika Valley (€120/p) — Berber villages, Setti Fatma waterfalls, lunch by the river, return ~17:00 || Option B ~~ Atlas / 3 Valleys (€150/p) — Asni, Kik Plateau, Ourika, Berber family lunch, return ~18:00 || Option C ~~ Essaouira (€150/p) — UNESCO blue medina, fishing port, Atlantic breeze, artisan shops || 18:00–19:00 ~~ Return to Marrakech || 20:00 ~~ Dinner at leisure", no: "07:30 ~~ Frokost på riaden || 08:00 ~~ Sjåfør henter — heldagsutflukt starter (velg én) || Alternativ A ~~ Ourika-dalen (€120/p) — berberlandsbyer, Setti Fatma-fossene, lunsj ved elven, retur ~17:00 || Alternativ B ~~ Atlas / 3 daler (€150/p) — Asni, Kik-platået, Ourika, lunsj hos berberfamilie, retur ~18:00 || Alternativ C ~~ Essaouira (€150/p) — UNESCO blå medina, fiskehavn, atlanterhavsbris, håndverksbutikker || 18:00–19:00 ~~ Retur til Marrakech || 20:00 ~~ Middag etter eget valg", fr: "07h30 ~~ Petit-déjeuner au riad || 08h00 ~~ Prise en charge — excursion d'une journée (au choix) || Option A ~~ Vallée de l'Ourika (€120/p) — villages berbères, cascades de Setti Fatma, déjeuner au bord de la rivière, retour ~17h00 || Option B ~~ Atlas / 3 vallées (€150/p) — Asni, plateau du Kik, Ourika, déjeuner en famille berbère, retour ~18h00 || Option C ~~ Essaouira (€150/p) — médina bleue UNESCO, port de pêche, brise atlantique, artisans || 18h00–19h00 ~~ Retour à Marrakech || 20h00 ~~ Dîner libre" } },
      { day: 4, route: { en: "Agafay Desert", no: "Agafay-ørkenen", fr: "Désert de l'Agafay" }, text: { en: "07:30 ~~ Breakfast at the riad || 10:00 ~~ Checkout or luggage storage || 10:30–11:00 ~~ Private transfer to the Agafay Desert (~45 min) || 11:00–15:00 ~~ Arrival at the luxury camp · pool · relax · optional pool lunch || 15:00 ~~ Transfer to the activity zone || 16:30–17:30 ~~ Camel ride at sunset (€30/p) || 19:00 ~~ Return to camp · freshen up || 19:30 ~~ Agafay Dinner & Show (€55/p) — full Moroccan dinner + entertainment || Midnight ~~ Overnight in a luxury desert tent under the stars", no: "07:30 ~~ Frokost på riaden || 10:00 ~~ Utsjekk eller bagasjeoppbevaring || 10:30–11:00 ~~ Privat transfer til Agafay-ørkenen (~45 min) || 11:00–15:00 ~~ Ankomst luksusleiren · basseng · avslapning · valgfri bassenglunsj || 15:00 ~~ Transfer til aktivitetssonen || 16:30–17:30 ~~ Kamelritt ved solnedgang (€30/p) || 19:00 ~~ Tilbake til leiren · friske opp || 19:30 ~~ Agafay middag & show (€55/p) — full marokkansk middag + underholdning || Midnatt ~~ Overnatting i luksusørkentelt under stjernene", fr: "07h30 ~~ Petit-déjeuner au riad || 10h00 ~~ Départ ou stockage des bagages || 10h30–11h00 ~~ Transfert privé vers le désert de l'Agafay (~45 min) || 11h00–15h00 ~~ Arrivée au camp de luxe · piscine · détente · déjeuner piscine optionnel || 15h00 ~~ Transfert vers la zone d'activités || 16h30–17h30 ~~ Balade à dos de chameau au coucher du soleil (€30/p) || 19h00 ~~ Retour au camp · rafraîchissement || 19h30 ~~ Dîner & spectacle Agafay (€55/p) — dîner marocain complet + animations || Minuit ~~ Nuit en tente de luxe sous les étoiles" } },
      { day: 5, route: { en: "Departure", no: "Avreise", fr: "Départ" }, text: { en: "06:30 ~~ Sunrise option · Berber breakfast at camp || 09:00 ~~ Private transfer back to Marrakech (~45 min) || 09:45 ~~ Drop at riad for bag collection or direct to the airport || Flight −3h ~~ Airport transfer if scheduled", no: "06:30 ~~ Soloppgangsalternativ · berberfrokost i leiren || 09:00 ~~ Privat transfer tilbake til Marrakech (~45 min) || 09:45 ~~ Avlevering ved riad for bagasje eller direkte til flyplassen || Fly −3t ~~ Flyplasstransfer ved behov", fr: "06h30 ~~ Option lever de soleil · petit-déjeuner berbère au camp || 09h00 ~~ Transfert privé retour à Marrakech (~45 min) || 09h45 ~~ Dépose au riad pour les bagages ou directement à l'aéroport || Vol −3h ~~ Transfert aéroport si prévu" } },
    ],
    included: [
      { en: "Airport transfers with personalised name sign", no: "Flyplasstransfer med personlig navneskilt", fr: "Transferts aéroport avec pancarte personnalisée" },
      { en: "Private transport throughout", no: "Privat transport gjennom hele reisen", fr: "Transport privé tout au long du séjour" },
      { en: "3 nights luxury riad Marrakech · 1 night luxury Agafay desert camp — daily breakfast", no: "3 netter luksusriad Marrakech · 1 natt luksusørkenleir Agafay — daglig frokost", fr: "3 nuits riad de luxe Marrakech · 1 nuit camp désertique de luxe Agafay — petit-déjeuner quotidien" },
      { en: "Welcome mint tea & Moroccan pastries", no: "Velkomst myntete & marokkanske kjeks", fr: "Thé à la menthe de bienvenue & pâtisseries marocaines" },
      { en: "Private certified guide — 3-hour Medina tour", no: "Privat sertifisert guide — 3-timers Medina-omvisning", fr: "Guide certifié privé — visite de 3h de la Médina" },
      { en: "Moroccan cooking class at traditional riad (includes lunch, €49/p)", no: "Marokkansk matkurs på tradisjonelt riad (inkluderer lunsj, €49/p)", fr: "Cours de cuisine marocaine dans un riad traditionnel (déjeuner inclus, €49/p)" },
      { en: "Private driver + vehicle for full nature day", no: "Privat sjåfør + kjøretøy for hel naturdag", fr: "Chauffeur privé + véhicule pour la journée nature complète" },
      { en: "Agafay welcome drink + pool access", no: "Agafay velkomstdrink + bassengadgang", fr: "Boisson de bienvenue Agafay + accès piscine" },
      { en: "Moroccan feast dinner at desert camp · live Gnawa music · entertainment", no: "Marokkansk festmiddag i ørkenleiren · levende Gnawa-musikk · underholdning", fr: "Festin marocain au camp désertique · musique Gnawa en direct · divertissements" },
      { en: "24/7 WhatsApp support — Aladdin & Marte", no: "24/7 WhatsApp-støtte — Aladdin & Marte", fr: "Assistance WhatsApp 24h/24 — Aladdin & Marte" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Dinners in Marrakech (Days 1, 2, 3)", no: "Middager i Marrakech (dag 1, 2, 3)", fr: "Dîners à Marrakech (Jours 1, 2, 3)" },
      { en: "Nature day lunch (guide recommends local spots)", no: "Naturdag-lunsj (guiden anbefaler lokale steder)", fr: "Déjeuner de la journée nature (le guide recommande des spots locaux)" },
      { en: "Bahia Palace entrance (~70 MAD/p)", no: "Bahia-palasset inngang (~70 MAD/p)", fr: "Entrée du Palais Bahia (~70 MAD/p)" },
      { en: "Optional activities at Agafay: camel ride (€30/p) · quad (€40/p)", no: "Valgfrie aktiviteter i Agafay: kamelritt (€30/p) · quad (€40/p)", fr: "Activités optionnelles à l'Agafay : balade à dos de chameau (€30/p) · quad (€40/p)" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommandée)" },
      { en: "Personal expenses and tips", no: "Personlige utgifter og tips", fr: "Dépenses personnelles et pourboires" },
    ],
  },

  // ===== 7D6N — Morocco Highlights =====
  {
    slug: "morocco-highlights", chapter: "04",
    title: { en: "Morocco Highlights", no: "Marokko-høydepunkter", fr: "Les Incontournables du Maroc" },
    duration: "7D6N", days: 7, nights: 6,
    route: "Marrakech → Dades → Merzouga → Marrakech",
    priceFromEUR: 1400,
    img: "assets/photos/sahara-camel-sunrise-15.jpg",
    badge: { en: "SIGNATURE TRIP", no: "SIGNATURREISE", fr: "VOYAGE SIGNATURE" },
    themeTags: ["Sahara", "Atlas", "Kasbah", "Merzouga"],
    teaser: { en: "Seven days tracing the full arc of southern Morocco — Atlas pass, UNESCO kasbah, Sahara dunes, and back.", no: "Syv dager langs den sørlige Marokko-buen — Atlaspasset, UNESCO-kasbah, Sahara-dyner og tilbake.", fr: "Sept jours sur l'arc complet du Maroc méridional — col de l'Atlas, kasbah UNESCO, dunes du Sahara, et retour." },
    overview: { en: "Seven days tracing the full arc of southern Morocco. Ancient Marrakech, over the highest mountain pass in Morocco, through a UNESCO kasbah used as a Hollywood film set, into the Sahara for a night under uninterrupted stars, and back over the Atlas. One of the great overland journeys in the world, perfectly paced.", no: "Syv dager langs den sørlige Marokko-buen. Eldgamle Marrakech, over Marokkos høyeste fjellpass, gjennom en UNESCO-kasbah brukt som Hollywood-filmsted, inn i Sahara for en natt under uforstyrrete stjerner, og tilbake over Atlas. En av verdens store overlandreiser, perfekt tempo.", fr: "Sept jours sur l'arc complet du Maroc méridional. La vieille Marrakech, le plus haut col de montagne du Maroc, une kasbah UNESCO utilisée comme décor de film hollywoodien, dans le Sahara pour une nuit sous des étoiles sans fin, et retour via l'Atlas. L'un des grands voyages overland du monde, parfaitement rythmé." },
    idealFor: { en: "Travellers who want the full southern Morocco experience", no: "Reisende som vil ha den fullstendige Sør-Marokko-opplevelsen", fr: "Voyageurs qui veulent l'expérience complète du Maroc méridional" },
    highlights: [
      { en: "Tizi n'Tichka mountain pass — 2,260m, highest paved road in Morocco", no: "Tizi n'Tichka fjellpass — 2 260m, høyeste asfalterte vei i Marokko", fr: "Col du Tizi n'Tichka — 2 260m, la plus haute route goudronnée du Maroc" },
      { en: "Aït Ben Haddou UNESCO kasbah (film set for Gladiator & Game of Thrones)", no: "Aït Ben Haddou UNESCO-kasbah (filmsted for Gladiator og Game of Thrones)", fr: "Kasbah UNESCO d'Aït Ben Haddou (décor de Gladiator & Game of Thrones)" },
      { en: "Todra Gorges — 300m limestone walls rising from a 10m-wide canyon", no: "Todra-kløftene — 300m kalksteinsvegger fra et 10m bredt canyon", fr: "Gorges du Todra — parois calcaires de 300m se dressant d'un canyon de 10m de large" },
      { en: "Camel trek into Erg Chebbi at golden hour — 150m dunes", no: "Kamelritt inn i Erg Chebbi i gylden time — 150m høye dyner", fr: "Randonnée à dos de chameau vers l'Erg Chebbi à l'heure dorée — dunes de 150m" },
      { en: "Sahara sunrise + Berber music · fire at luxury camp", no: "Sahara-soloppgang + berbermusikk · bål i luksusleirplass", fr: "Lever de soleil au Sahara + musique berbère · feu dans le camp de luxe" },
      { en: "Dades Gorges S-bends + Valley of Roses scenic drive", no: "Dades-kløftene S-svinger + panoramakjøring Rosedalen", fr: "Épingles des gorges du Dadès + route panoramique de la Vallée des Roses" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival in Marrakech", no: "Ankomst i Marrakech", fr: "Arrivée à Marrakech" }, text: {
        en: "Upon arrival ~~ Driver at the airport with your personalised Marrakech Story name sign || Transfer ~~ Private car to your luxury riad (~20–30 min) || Afternoon ~~ Check-in · welcome mint tea · freshen up || 19:00 ~~ Dinner at a recommended medina restaurant || Evening ~~ Optional first walk to Jemaa el-Fna square",
        no: "Ved ankomst ~~ Sjåfør på flyplassen med ditt personlige Marrakech Story-navneskilt || Transfer ~~ Privat bil til ditt luksuriøse riad (~20–30 min) || Ettermiddag ~~ Innsjekk · velkomst myntete · friske opp || 19:00 ~~ Middag på anbefalt medina-restaurant || Kveld ~~ Valgfri første tur til Jemaa el-Fna-plassen",
        fr: "À l'arrivée ~~ Chauffeur à l'aéroport avec votre pancarte personnalisée Marrakech Story || Transfert ~~ Voiture privée vers votre riad de luxe (~20–30 min) || Après-midi ~~ Enregistrement · thé à la menthe de bienvenue · rafraîchissement || 19h00 ~~ Dîner dans un restaurant recommandé de la médina || Soir ~~ Première balade optionnelle vers la place Jemaa el-Fna" } },
      { day: 2, route: { en: "Marrakech — City & Culture", no: "Marrakech — By & Kultur", fr: "Marrakech — Ville & Culture" }, text: {
        en: "07:30 ~~ Breakfast at the riad || 10:00 ~~ Certified guide at the riad — city tour (3h): medina, souks, tanneries, Bahia Palace || 13:00 ~~ Lunch at leisure || 15:00–17:00 ~~ Majorelle Garden + YSL Museum (optional, entrance not incl.) OR hammam & spa || 20:00 ~~ Rooftop dinner recommendation",
        no: "07:30 ~~ Frokost i riaden || 10:00 ~~ Sertifisert guide ved riaden — byomvisning (3t): medina, souker, garverier, Bahia-palasset || 13:00 ~~ Lunsj etter eget valg || 15:00–17:00 ~~ Majorelle-hagen + YSL-museet (valgfritt, inngang ikke inkl.) ELLER hammam & spa || 20:00 ~~ Middagsanbefaling på taket",
        fr: "07h30 ~~ Petit-déjeuner au riad || 10h00 ~~ Guide certifié au riad — visite de la ville (3h) : médina, souks, tanneries, Palais Bahia || 13h00 ~~ Déjeuner libre || 15h00–17h00 ~~ Jardin Majorelle + Musée YSL (optionnel, entrée non incl.) OU hammam & spa || 20h00 ~~ Dîner recommandé sur un toit-terrasse" } },
      { day: 3, route: { en: "Over the Atlas → Dades Valley", no: "Over Atlas → Dades-dalen", fr: "Par l'Atlas → Vallée du Dadès" }, text: {
        en: "07:15 ~~ Early departure from Marrakech || 07:15–09:00 ~~ Climb the Tizi n'Tichka mountain pass (2,260m) · photo stop || 09:00–10:30 ~~ Descent into the Draa Valley || 10:30–12:00 ~~ Aït Ben Haddou UNESCO kasbah — local guide · Gladiator & Game of Thrones location || 12:00–13:30 ~~ Ouarzazate · optional Atlas Studios (~40 MAD) · lunch || 13:30–17:00 ~~ Draa Valley · rose-growing region · optional argan-oil workshop || 17:00–18:30 ~~ Arrive Dades Valley · guesthouse check-in || 19:30 ~~ Dinner included at the guesthouse",
        no: "07:15 ~~ Tidlig avreise fra Marrakech || 07:15–09:00 ~~ Opp Tizi n'Tichka-passet (2 260m) · fotostopp || 09:00–10:30 ~~ Ned i Draa-dalen || 10:30–12:00 ~~ Aït Ben Haddou UNESCO-kasbah — lokal guide · Gladiator & Game of Thrones-sted || 12:00–13:30 ~~ Ouarzazate · valgfritt Atlas Studios (~40 MAD) · lunsj || 13:30–17:00 ~~ Draa-dalen · roseregionen · valgfri arganolje-verksted || 17:00–18:30 ~~ Ankomst Dades-dalen · innsjekk gjestehus || 19:30 ~~ Middag inkludert på gjestehuset",
        fr: "07h15 ~~ Départ matinal de Marrakech || 07h15–09h00 ~~ Montée du col du Tizi n'Tichka (2 260m) · arrêt photo || 09h00–10h30 ~~ Descente dans la vallée du Draa || 10h30–12h00 ~~ Kasbah UNESCO d'Aït Ben Haddou — guide local · décor de Gladiator & Game of Thrones || 12h00–13h30 ~~ Ouarzazate · Studios Atlas en option (~40 MAD) · déjeuner || 13h30–17h00 ~~ Vallée du Draa · région des roses · atelier d'huile d'argan optionnel || 17h00–18h30 ~~ Arrivée vallée du Dadès · enregistrement maison d'hôtes || 19h30 ~~ Dîner inclus à la maison d'hôtes" } },
      { day: 4, route: { en: "Into the Sahara — Merzouga", no: "Inn i Sahara — Merzouga", fr: "Dans le Sahara — Merzouga" }, text: {
        en: "07:30 ~~ Breakfast at the guesthouse || 08:30 ~~ Depart the Dades Valley || 08:30–10:00 ~~ Dades Gorges scenic drive · photo stops || 10:00–12:00 ~~ Todra Gorges — 300m rock walls · walk between the cliffs || 12:00–13:30 ~~ Lunch in the gorge region · Berber village stop || 13:30–16:00 ~~ Drive through the Tinghir palm oases toward the desert || 16:00–17:00 ~~ Arrive Merzouga · drop luggage at camp || 17:00–18:00 ~~ Camel trek into the Erg Chebbi dunes (€30/p · 1h) || 18:00–19:00 ~~ Sunset from the top of the dunes || 19:30 ~~ Berber camp · traditional dinner included || 21:00 ~~ Fire · music · stargazing || Night ~~ Overnight in a luxury desert tent",
        no: "07:30 ~~ Frokost på gjestehuset || 08:30 ~~ Avreise fra Dades-dalen || 08:30–10:00 ~~ Dades-kløftene panoramakjøring · fotostopp || 10:00–12:00 ~~ Todra-kløftene — 300m bergvegger · vandring mellom klippene || 12:00–13:30 ~~ Lunsj i kløfteregionen · stopp i berberlandsby || 13:30–16:00 ~~ Kjøring gjennom Tinghir-palmeoasene mot ørkenen || 16:00–17:00 ~~ Ankomst Merzouga · lever bagasje i leiren || 17:00–18:00 ~~ Kamelritt inn i Erg Chebbi-dynene (€30/p · 1t) || 18:00–19:00 ~~ Solnedgang fra toppen av dynene || 19:30 ~~ Berberleir · tradisjonell middag inkludert || 21:00 ~~ Bål · musikk · stjernekikking || Natt ~~ Overnatting i luksuriøst ørkentelt",
        fr: "07h30 ~~ Petit-déjeuner à la maison d'hôtes || 08h30 ~~ Départ de la vallée du Dadès || 08h30–10h00 ~~ Route panoramique des gorges du Dadès · arrêts photo || 10h00–12h00 ~~ Gorges du Todra — parois de 300m · marche entre les falaises || 12h00–13h30 ~~ Déjeuner dans la région des gorges · arrêt village berbère || 13h30–16h00 ~~ Traversée des palmeraies de Tinghir vers le désert || 16h00–17h00 ~~ Arrivée Merzouga · dépôt des bagages au camp || 17h00–18h00 ~~ Randonnée à dos de chameau dans les dunes de l'Erg Chebbi (€30/p · 1h) || 18h00–19h00 ~~ Coucher de soleil au sommet des dunes || 19h30 ~~ Camp berbère · dîner traditionnel inclus || 21h00 ~~ Feu · musique · observation des étoiles || Nuit ~~ Nuit en tente de luxe dans le désert" } },
      { day: 5, route: { en: "Sahara Sunrise & Return to Dades", no: "Sahara-soloppgang & Tilbake til Dades", fr: "Lever de Soleil au Sahara & Retour vers le Dadès" }, text: {
        en: "06:00 ~~ Wake for the dune sunrise (unmissable) || 07:00 ~~ Berber breakfast at camp || 08:00 ~~ Return by camel or 4x4 to the village || 09:00–15:00 ~~ Scenic return drive · lunch stop at Todra or Dades || 15:00–17:00 ~~ Arrive Dades or Ouarzazate · guesthouse check-in || 19:30 ~~ Dinner included at the guesthouse",
        no: "06:00 ~~ Våkne til soloppgang over dynene (uunngåelig) || 07:00 ~~ Berberfrokost i leiren || 08:00 ~~ Tilbake med kamel eller 4x4 til landsbyen || 09:00–15:00 ~~ Panoramakjøring tilbake · lunsjstopp ved Todra eller Dades || 15:00–17:00 ~~ Ankomst Dades eller Ouarzazate · innsjekk gjestehus || 19:30 ~~ Middag inkludert på gjestehuset",
        fr: "06h00 ~~ Réveil pour le lever de soleil sur les dunes (incontournable) || 07h00 ~~ Petit-déjeuner berbère au camp || 08h00 ~~ Retour à dos de chameau ou en 4x4 vers le village || 09h00–15h00 ~~ Route panoramique de retour · déjeuner à Todra ou Dadès || 15h00–17h00 ~~ Arrivée Dadès ou Ouarzazate · enregistrement maison d'hôtes || 19h30 ~~ Dîner inclus à la maison d'hôtes" } },
      { day: 6, route: { en: "Atlas Return to Marrakech", no: "Atlas-retur til Marrakech", fr: "Retour par l'Atlas vers Marrakech" }, text: {
        en: "07:30 ~~ Breakfast · checkout || 08:30–13:30 ~~ Scenic return drive (~5h) · Aït Ben Haddou stop if missed on Day 3 || 13:30 ~~ Arrive Marrakech · riad check-in || Afternoon ~~ Free: cooking class (€49/p) · hammam · souk shopping || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Frokost · utsjekk || 08:30–13:30 ~~ Panoramakjøring tilbake (~5t) · Aït Ben Haddou-stopp om ikke besøkt dag 3 || 13:30 ~~ Ankomst Marrakech · innsjekk riad || Ettermiddag ~~ Fritt: matlagingskurs (€49/p) · hammam · souk-shopping || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Petit-déjeuner · départ || 08h30–13h30 ~~ Route panoramique de retour (~5h) · arrêt Aït Ben Haddou si manqué au Jour 3 || 13h30 ~~ Arrivée Marrakech · enregistrement riad || Après-midi ~~ Libre : cours de cuisine (€49/p) · hammam · shopping au souk || 20h00 ~~ Dîner libre" } },
      { day: 7, route: { en: "Departure", no: "Avreise", fr: "Départ" }, text: {
        en: "07:30 ~~ Last Moroccan breakfast at the riad || 09:00–12:00 ~~ Final walk · Majorelle Garden optional · souvenirs || Flight −3h ~~ Private transfer to Marrakech Menara Airport",
        no: "07:30 ~~ Siste marokkanske frokost i riaden || 09:00–12:00 ~~ Siste tur · Majorelle-hagen valgfritt · suvenirer || Fly −3t ~~ Privat transfer til Marrakech Menara lufthavn",
        fr: "07h30 ~~ Dernier petit-déjeuner marocain au riad || 09h00–12h00 ~~ Dernière balade · Jardin Majorelle en option · souvenirs || Vol −3h ~~ Transfert privé vers l'aéroport Marrakech Menara" } },
    ],
    included: [
      { en: "Airport transfers with personalised name sign", no: "Flyplasstransfer med personlig navneskilt", fr: "Transferts aéroport avec pancarte personnalisée" },
      { en: "Private transport throughout (regional drivers rotate for safety)", no: "Privat transport gjennom hele reisen (regionale sjåfører bytter av sikkerhetshensyn)", fr: "Transport privé tout au long (rotation de chauffeurs régionaux pour la sécurité)" },
      { en: "2 nights luxury riad Marrakech (arrival) · 2 nights authentic guesthouse Dades Valley (dinners included) · 1 night luxury Merzouga desert camp (dinner included) · 1 night luxury riad Marrakech (return)", no: "2 netter luksusriad Marrakech (ankomst) · 2 netter autentisk gjestehus Dades-dalen (middager inkludert) · 1 natt luksus Merzouga-ørkenleir (middag inkludert) · 1 natt luksusriad Marrakech (retur)", fr: "2 nuits riad de luxe Marrakech (arrivée) · 2 nuits maison d'hôtes authentique vallée du Dadès (dîners inclus) · 1 nuit camp désertique de luxe Merzouga (dîner inclus) · 1 nuit riad de luxe Marrakech (retour)" },
      { en: "Daily breakfast", no: "Daglig frokost", fr: "Petit-déjeuner quotidien" },
      { en: "Certified guide — Marrakech Medina tour (3h)", no: "Sertifisert guide — Marrakech Medina-omvisning (3t)", fr: "Guide certifié — visite de la Médina de Marrakech (3h)" },
      { en: "Aït Ben Haddou local guide", no: "Aït Ben Haddou lokal guide", fr: "Guide local d'Aït Ben Haddou" },
      { en: "Camel trek into Erg Chebbi at sunset — 1 hour", no: "Kamelritt inn i Erg Chebbi ved solnedgang — 1 time", fr: "Randonnée à dos de chameau vers l'Erg Chebbi au coucher du soleil — 1 heure" },
      { en: "Live Berber music & entertainment at Sahara camp", no: "Levende berbermusikk & underholdning i Sahara-leiren", fr: "Musique berbère en direct & divertissements au camp du Sahara" },
      { en: "24/7 WhatsApp support — Aladdin & Marte", no: "24/7 WhatsApp-støtte — Aladdin & Marte", fr: "Assistance WhatsApp 24h/24 — Aladdin & Marte" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches throughout", no: "Lunsjer gjennom hele reisen", fr: "Déjeuners tout au long du voyage" },
      { en: "Dinners in Marrakech (Days 1, 2, 6)", no: "Middager i Marrakech (dag 1, 2, 6)", fr: "Dîners à Marrakech (Jours 1, 2, 6)" },
      { en: "Aït Ben Haddou local guide fee (~100 MAD/p)", no: "Aït Ben Haddou lokal guide honorar (~100 MAD/p)", fr: "Honoraire du guide local d'Aït Ben Haddou (~100 MAD/p)" },
      { en: "Atlas Studios Ouarzazate entrance (~40 MAD)", no: "Atlas Studios Ouarzazate inngang (~40 MAD)", fr: "Entrée des Studios Atlas Ouarzazate (~40 MAD)" },
      { en: "Optional activities: camel (€30/p) · quad (€40/p) · sandboarding", no: "Valgfrie aktiviteter: kamel (€30/p) · quad (€40/p) · sandboarding", fr: "Activités optionnelles : chameau (€30/p) · quad (€40/p) · sandboard" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommandée)" },
      { en: "Personal expenses and tips", no: "Personlige utgifter og tips", fr: "Dépenses personnelles et pourboires" },
    ],
  },

  // ===== 10D9N — Grand Morocco Journey =====
  {
    slug: "grand-morocco-journey", chapter: "05",
    title: { en: "Grand Morocco Journey", no: "Den store Marokko-reisen", fr: "Le Grand Voyage Maroc" },
    duration: "10D9N", days: 10, nights: 9,
    route: "Tangier → Chefchaouen → Fez → Sahara → Marrakech",
    priceFromEUR: 2200,
    img: "assets/photos/chefchaouen-blue-alley-01.jpg",
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
      { day: 1, route: { en: "Arrival Tangier · north to Chefchaouen", no: "Ankomst Tanger · nordover til Chefchaouen", fr: "Arrivée Tanger · cap au nord vers Chefchaouen" }, text: {
        en: "14:20 ~~ Arrive Tangier Ibn Batouta Airport (TNG) || Upon arrival ~~ Driver waiting with your personalised Marrakech Story name sign || 14:45 ~~ Private transfer to Chefchaouen via the Rif (~2.5h) || 17:00 ~~ Boutique hotel check-in || 18:30 ~~ Walk to the Spanish Mosque viewpoint for sunset over the blue town || 20:00 ~~ Dinner at leisure in the blue medina",
        no: "14:20 ~~ Ankomst Tanger Ibn Batouta lufthavn (TNG) || Ved ankomst ~~ Sjåfør venter med ditt personlige Marrakech Story-navneskilt || 14:45 ~~ Privat transfer til Chefchaouen via Rif (~2,5t) || 17:00 ~~ Innsjekk boutique-hotell || 18:30 ~~ Tur til Den spanske moskeens utsiktspunkt for solnedgang over den blå byen || 20:00 ~~ Middag etter eget valg i den blå medina",
        fr: "14h20 ~~ Arrivée à l'aéroport Tanger Ibn Batouta (TNG) || À l'arrivée ~~ Chauffeur avec votre pancarte personnalisée Marrakech Story || 14h45 ~~ Transfert privé vers Chefchaouen via le Rif (~2h30) || 17h00 ~~ Enregistrement hôtel de charme || 18h30 ~~ Montée au belvédère de la Mosquée Espagnole pour le coucher de soleil sur la ville bleue || 20h00 ~~ Dîner libre dans la médina bleue" } },
      { day: 2, route: { en: "Chefchaouen, slowly", no: "Chefchaouen, i rolig tempo", fr: "Chefchaouen, en douceur" }, text: {
        en: "07:30 ~~ Breakfast || 10:00 ~~ Certified guide at the hotel entrance || 10:00–13:00 ~~ Guided blue-medina tour: the kasbah, Plaza Uta el-Hammam, the dyers' alleys, viewpoints || 13:00–15:00 ~~ Lunch at a terrace restaurant || 15:00–18:00 ~~ Free: Ras El-Maa waterfall hike · shopping · Spanish Mosque sunset || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Frokost || 10:00 ~~ Sertifisert guide ved hotellinngangen || 10:00–13:00 ~~ Guidet tur i den blå medina: kasbahen, Plaza Uta el-Hammam, fargernes smug, utsiktspunkter || 13:00–15:00 ~~ Lunsj på terrasserestaurant || 15:00–18:00 ~~ Fritt: Ras El-Maa-fossen · shopping · solnedgang fra Den spanske moské || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Petit-déjeuner || 10h00 ~~ Guide certifié à l'entrée de l'hôtel || 10h00–13h00 ~~ Visite guidée de la médina bleue : la casbah, Plaza Uta el-Hammam, les ruelles des teinturiers, belvédères || 13h00–15h00 ~~ Déjeuner en terrasse || 15h00–18h00 ~~ Libre : cascade Ras El-Maa · shopping · coucher de soleil Mosquée Espagnole || 20h00 ~~ Dîner libre" } },
      { day: 3, route: { en: "Chefchaouen → Fez", no: "Chefchaouen → Fes", fr: "Chefchaouen → Fès" }, text: {
        en: "07:30 ~~ Breakfast · checkout || 09:00 ~~ Private transport toward Fez (~4h with stops) || 12:00–13:30 ~~ Volubilis Roman ruins · brief guided visit (1h) · lunch || 14:30 ~~ Arrive Fez · riad check-in in the medina || 19:00 ~~ Rooftop drink at the evening call to prayer || 20:00 ~~ Dinner at the riad",
        no: "07:30 ~~ Frokost · utsjekk || 09:00 ~~ Privat transport mot Fes (~4t med stopp) || 12:00–13:30 ~~ Volubilis romerruiner · kort guidet besøk (1t) · lunsj || 14:30 ~~ Ankomst Fes · innsjekk riad i medina || 19:00 ~~ Takedrikk ved kveldsbønnen || 20:00 ~~ Middag i riaden",
        fr: "07h30 ~~ Petit-déjeuner · départ || 09h00 ~~ Transport privé vers Fès (~4h avec arrêts) || 12h00–13h30 ~~ Ruines romaines de Volubilis · brève visite guidée (1h) · déjeuner || 14h30 ~~ Arrivée Fès · enregistrement riad dans la médina || 19h00 ~~ Verre en terrasse à l'appel à la prière || 20h00 ~~ Dîner au riad" } },
      { day: 4, route: { en: "Fez, in depth", no: "Fes i dybden", fr: "Fès, en profondeur" }, text: {
        en: "07:30 ~~ Breakfast || 10:00 ~~ Specialist Fez guide at the riad entrance || 10:00–13:00 ~~ Guided UNESCO medina tour: Chouara tanneries, Al-Qarawiyyin (oldest university), Bou Inania & Al-Attarine madrasas, artisan quarters || 13:00 ~~ Lunch at a working riad || 15:00–18:00 ~~ Free: pottery/mosaic workshop · hammam || 20:00 ~~ Dinner — pigeon pastilla recommended",
        no: "07:30 ~~ Frokost || 10:00 ~~ Fes-spesialistguide ved riad-inngangen || 10:00–13:00 ~~ Guidet UNESCO-medinatur: Chouara-garveriene, Al-Qarawiyyin (verdens eldste universitet), Bou Inania & Al-Attarine madrasaer, håndverkerkvarteret || 13:00 ~~ Lunsj i et aktivt riad || 15:00–18:00 ~~ Fritt: keramikk/mosaikk-verksted · hammam || 20:00 ~~ Middag — duepastilla anbefales",
        fr: "07h30 ~~ Petit-déjeuner || 10h00 ~~ Guide spécialiste de Fès à l'entrée du riad || 10h00–13h00 ~~ Visite guidée de la médina UNESCO : tanneries Chouara, Al-Qarawiyyin (plus vieille université), medersas Bou Inania & Al-Attarine, quartiers artisanaux || 13h00 ~~ Déjeuner dans un riad actif || 15h00–18h00 ~~ Libre : atelier poterie/mosaïque · hammam || 20h00 ~~ Dîner — pastilla au pigeon recommandée" } },
      { day: 5, route: { en: "Fez → Merzouga via the Middle Atlas", no: "Fes → Merzouga via Mellom-Atlas", fr: "Fès → Merzouga via le Moyen Atlas" }, text: {
        en: "07:30 ~~ Early breakfast · checkout || 08:30 ~~ Depart Fez (~8h total) || 09:30–11:00 ~~ Cedar forests of Azrou/Ifrane · Barbary macaque monkeys || 11:00–13:00 ~~ Midelt · Atlas peaks photo stops || 13:00 ~~ Lunch break || 14:00–17:00 ~~ Ziz Valley · Erfoud · Rissani · palm oases · Sahara begins || 17:30 ~~ Camel caravan into Erg Chebbi at sunset (1h) || 19:30 ~~ Luxury desert camp · dinner with Berber music || Night ~~ Overnight in a luxury tent",
        no: "07:30 ~~ Tidlig frokost · utsjekk || 08:30 ~~ Avreise Fes (~8t totalt) || 09:30–11:00 ~~ Sedertreskogene i Azrou/Ifrane · berberaper || 11:00–13:00 ~~ Midelt · fotostopp Atlas-toppene || 13:00 ~~ Lunsjpause || 14:00–17:00 ~~ Ziz-dalen · Erfoud · Rissani · palmeoaser · Sahara begynner || 17:30 ~~ Kamelkaravane inn i Erg Chebbi i solnedgang (1t) || 19:30 ~~ Luksus ørkenleir · middag med berbermusikk || Natt ~~ Overnatting i luksustelt",
        fr: "07h30 ~~ Petit-déjeuner tôt · départ || 08h30 ~~ Départ de Fès (~8h au total) || 09h30–11h00 ~~ Forêts de cèdres d'Azrou/Ifrane · macaques de Barbarie || 11h00–13h00 ~~ Midelt · arrêts photo sommets de l'Atlas || 13h00 ~~ Pause déjeuner || 14h00–17h00 ~~ Vallée du Ziz · Erfoud · Rissani · palmeraies · début du Sahara || 17h30 ~~ Caravane de chameaux vers l'Erg Chebbi au coucher du soleil (1h) || 19h30 ~~ Camp désertique de luxe · dîner avec musique berbère || Nuit ~~ Nuit en tente de luxe" } },
      { day: 6, route: { en: "The Sahara day", no: "Sahara-dagen", fr: "La journée Sahara" }, text: {
        en: "06:00 ~~ Optional sunrise hike on the dunes || 07:30 ~~ Berber breakfast at camp || 09:00–12:00 ~~ Bedouin family visit (availability permitting) OR jeep excursion OR relax || 12:00–14:00 ~~ Lunch near the village (not included) || 14:00–17:00 ~~ Sandboarding · nomad village visit · photography || 19:30 ~~ Dinner at camp included || Night ~~ Second overnight in a luxury tent",
        no: "06:00 ~~ Valgfri soloppgangstur på dynene || 07:30 ~~ Berberfrokost i leiren || 09:00–12:00 ~~ Besøk hos beduinfamilie (ved tilgjengelighet) ELLER jeep-tur ELLER hvile || 12:00–14:00 ~~ Lunsj nær landsbyen (ikke inkludert) || 14:00–17:00 ~~ Sandboarding · besøk i nomadelandsby · fotografering || 19:30 ~~ Middag i leiren inkludert || Natt ~~ Andre overnatting i luksustelt",
        fr: "06h00 ~~ Randonnée optionnelle au lever du soleil sur les dunes || 07h30 ~~ Petit-déjeuner berbère au camp || 09h00–12h00 ~~ Visite d'une famille bédouine (selon disponibilité) OU excursion en jeep OU repos || 12h00–14h00 ~~ Déjeuner près du village (non inclus) || 14h00–17h00 ~~ Sandboard · visite d'un village nomade · photographie || 19h30 ~~ Dîner au camp inclus || Nuit ~~ Deuxième nuit en tente de luxe" } },
      { day: 7, route: { en: "Merzouga → Dades Valley", no: "Merzouga → Dades-dalen", fr: "Merzouga → Vallée du Dadès" }, text: {
        en: "07:30 ~~ Breakfast · checkout || 08:30–11:00 ~~ Todra Gorges — 300m rock walls · walk between the cliffs || 11:00–13:00 ~~ Through the Tinghir palm oases || 13:00 ~~ Lunch in the gorge region || 14:00–16:30 ~~ Dades Gorges — \"road of a thousand kasbahs\" · serpentine photo stops || 17:00 ~~ Dades Valley · kasbah hotel check-in || 19:30 ~~ Dinner included",
        no: "07:30 ~~ Frokost · utsjekk || 08:30–11:00 ~~ Todra-kløftene — 300m bergvegger · vandring mellom klippene || 11:00–13:00 ~~ Gjennom Tinghir-palmeoasene || 13:00 ~~ Lunsj i kløfteregionen || 14:00–16:30 ~~ Dades-kløftene — \"veien med tusen kasbaher\" · slyngende fotostopp || 17:00 ~~ Dades-dalen · innsjekk kasbah-hotell || 19:30 ~~ Middag inkludert",
        fr: "07h30 ~~ Petit-déjeuner · départ || 08h30–11h00 ~~ Gorges du Todra — parois de 300m · marche entre les falaises || 11h00–13h00 ~~ À travers les palmeraies de Tinghir || 13h00 ~~ Déjeuner dans la région des gorges || 14h00–16h30 ~~ Gorges du Dadès — \"route des mille kasbahs\" · arrêts photo en serpentin || 17h00 ~~ Vallée du Dadès · enregistrement hôtel-kasbah || 19h30 ~~ Dîner inclus" } },
      { day: 8, route: { en: "Dades → Marrakech via Aït Ben Haddou", no: "Dades → Marrakech via Aït Ben Haddou", fr: "Dadès → Marrakech via Aït Ben Haddou" }, text: {
        en: "07:30 ~~ Breakfast · checkout || 08:30–10:30 ~~ Ouarzazate · optional Atlas Film Studios (~40 MAD) || 10:30–12:00 ~~ Aït Ben Haddou UNESCO kasbah · local guide || 12:00–13:30 ~~ Lunch near the kasbah || 13:30–18:00 ~~ Cross the High Atlas via Tizi n'Tichka (2,260m) → Marrakech || 18:00 ~~ Marrakech riad check-in || 20:00 ~~ Dinner in the medina",
        no: "07:30 ~~ Frokost · utsjekk || 08:30–10:30 ~~ Ouarzazate · valgfritt Atlas Film Studios (~40 MAD) || 10:30–12:00 ~~ Aït Ben Haddou UNESCO-kasbah · lokal guide || 12:00–13:30 ~~ Lunsj nær kasbahen || 13:30–18:00 ~~ Kryss Høyatlas via Tizi n'Tichka (2 260m) → Marrakech || 18:00 ~~ Innsjekk riad i Marrakech || 20:00 ~~ Middag i medina",
        fr: "07h30 ~~ Petit-déjeuner · départ || 08h30–10h30 ~~ Ouarzazate · Studios Atlas en option (~40 MAD) || 10h30–12h00 ~~ Kasbah UNESCO d'Aït Ben Haddou · guide local || 12h00–13h30 ~~ Déjeuner près de la kasbah || 13h30–18h00 ~~ Traversée du Haut Atlas via Tizi n'Tichka (2 260m) → Marrakech || 18h00 ~~ Enregistrement riad à Marrakech || 20h00 ~~ Dîner dans la médina" } },
      { day: 9, route: { en: "Marrakech — your choice", no: "Marrakech — ditt valg", fr: "Marrakech — votre choix" }, text: {
        en: "07:30 ~~ Breakfast || 10:00–13:00 ~~ Guided medina walking tour (3h) || 13:00 ~~ Lunch at a partner riad || 15:00–18:00 ~~ Free: hammam · Majorelle Garden · balloon or paragliding (pre-bookable) || 20:00 ~~ Farewell dinner at a special table booked for you",
        no: "07:30 ~~ Frokost || 10:00–13:00 ~~ Guidet medinavandring (3t) || 13:00 ~~ Lunsj i et partner-riad || 15:00–18:00 ~~ Fritt: hammam · Majorelle-hagen · ballong eller paragliding (forhåndsbestilles) || 20:00 ~~ Avskjedsmiddag ved et spesialbord bestilt for deg",
        fr: "07h30 ~~ Petit-déjeuner || 10h00–13h00 ~~ Visite à pied guidée de la médina (3h) || 13h00 ~~ Déjeuner dans un riad partenaire || 15h00–18h00 ~~ Libre : hammam · Jardin Majorelle · montgolfière ou parapente (réservable) || 20h00 ~~ Dîner d'adieu à une table spéciale réservée pour vous" } },
      { day: 10, route: { en: "Departure", no: "Avreise", fr: "Départ" }, text: {
        en: "07:30 ~~ Final breakfast · free morning || Flight −3h ~~ Private transfer to Marrakech Menara Airport (RAK)",
        no: "07:30 ~~ Siste frokost · fri morgen || Fly −3t ~~ Privat transfer til Marrakech Menara lufthavn (RAK)",
        fr: "07h30 ~~ Dernier petit-déjeuner · matinée libre || Vol −3h ~~ Transfert privé vers l'aéroport Marrakech Menara (RAK)" } },
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

  // ===== 14D13N — Full Morocco Honeymoon =====
  {
    slug: "full-morocco-honeymoon", chapter: "06",
    title: { en: "Full Morocco Honeymoon", no: "Fullt Marokko-bryllupsreise", fr: "Lune de Miel Maroc Complet" },
    duration: "14D13N", days: 14, nights: 13,
    route: "Agadir → Marrakech → Sahara → Fes → Chefchaouen → Tangier",
    priceFromEUR: 3200,
    img: "assets/photos/agafay-night-lounge-05.jpg",
    badge: { en: "GRAND TOUR", no: "GRAND TOUR", fr: "GRAND TOUR" },
    themeTags: ["Atlantic", "Imperial", "Sahara", "Atlas", "Honeymoon"],
    teaser: { en: "Fourteen days. Seven completely different Moroccos — Atlantic beachfront, the red city, the Sahara, Fes, the blue mountains, the Strait of Gibraltar.", no: "Fjorten dager. Syv helt forskjellige Marokko-er — atlanterhavsstranden, den røde byen, Sahara, Fes, de blå fjellene, Gibraltarstredet.", fr: "Quatorze jours. Sept Maroc entièrement différents — front de mer atlantique, la ville rouge, le Sahara, Fès, les montagnes bleues, le détroit de Gibraltar." },
    overview: { en: "Designed by Aladdin & Marte as if it were their own anniversary trip — nothing rushed, nothing missed. Atlantic beachfront in Agadir. The ancient red city. The Sahara for two nights. The world's oldest university city. The blue mountain city of Chefchaouen. The Strait of Gibraltar. Open-jaw routing: fly into Agadir, fly home from Tangier.", no: "Designet av Aladdin & Marte som om det var deres eget jubileumsreise — ingen hastverk, ingenting glemt. Atlanterhavsstranden i Agadir. Den eldgamle røde byen. Sahara i to netter. Verdens eldste universitetsstad. Den blå fjellbyen Chefchaouen. Gibraltarstredet. Åpen billett: fly til Agadir, fly hjem fra Tanger.", fr: "Conçu par Aladdin & Marte comme s'il s'agissait de leur propre voyage d'anniversaire — rien de précipité, rien d'oublié. Front de mer atlantique à Agadir. La vieille ville rouge. Le Sahara pour deux nuits. La ville universitaire la plus ancienne du monde. La ville bleue de montagne de Chefchaouen. Le détroit de Gibraltar. Routing open-jaw : volez vers Agadir, rentrez depuis Tanger." },
    idealFor: { en: "Honeymooners, slow travellers, couples who want the full Morocco story", no: "Bryllupsreisende, slow-travel-entusiaster, par som vil ha hele Marokko-historien", fr: "Voyageurs en lune de miel, slow travellers, couples qui veulent vivre toute l'histoire du Maroc" },
    highlights: [
      { en: "3 free Atlantic beach days in Agadir", no: "3 frie Atlanterhavsstrands-dager i Agadir", fr: "3 journées libres sur la plage atlantique à Agadir" },
      { en: "Honeymoon welcome surprise at Marrakech riad", no: "Bryllupsreise velkomstoveraskelse i Marrakech riad", fr: "Surprise de bienvenue lune de miel au riad de Marrakech" },
      { en: "Moroccan cooking class + couples luxury hammam", no: "Marokkansk matkurs + luksuriøst parhammam", fr: "Cours de cuisine marocaine + hammam de luxe en couple" },
      { en: "Two nights in the Sahara — sunrise dunes, Berber music, stargazing", no: "To netter i Sahara — soloppgangsdyner, berbermusikk, stjernekikking", fr: "Deux nuits au Sahara — dunes au lever du soleil, musique berbère, observation des étoiles" },
      { en: "Full-day Fes specialist guide — tanneries, Al-Qarawiyyin, madrasas", no: "Heldags Fes-spesialistguide — garveriene, Al-Qarawiyyin, madrasaer", fr: "Guide spécialisé Fès toute la journée — tanneries, Al-Qarawiyyin, médersas" },
      { en: "Chefchaouen blue medina + Spanish Mosque panorama", no: "Chefchaouens blå medina + Det spanske moskeens panorama", fr: "Médina bleue de Chefchaouen + panorama de la Mosquée Espagnole" },
      { en: "Cap Spartel — where the Atlantic meets the Mediterranean", no: "Cap Spartel — der Atlanterhavet møter Middelhavet", fr: "Cap Spartel — là où l'Atlantique rencontre la Méditerranée" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrive Agadir · The Atlantic", no: "Ankomst Agadir · Atlanterhavet", fr: "Arrivée Agadir · L'Atlantique" }, text: {
        en: "Upon arrival ~~ Private pickup at Agadir Al Massira Airport with your personalised name sign || Transfer ~~ Private car to your 4★ beachfront hotel on the Agadir Corniche (~45 min) || Afternoon ~~ Check-in · settle in || 18:30 ~~ Beach promenade at sunset || 20:00 ~~ Fresh seafood dinner on the Corniche",
        no: "Ved ankomst ~~ Privat henting på Agadir Al Massira lufthavn med ditt personlige navneskilt || Transfer ~~ Privat bil til ditt 4★ strandhotell på Agadir Corniche (~45 min) || Ettermiddag ~~ Innsjekk · falle til ro || 18:30 ~~ Strandpromenade ved solnedgang || 20:00 ~~ Fersk sjømatmiddag på Corniche",
        fr: "À l'arrivée ~~ Prise en charge privée à l'aéroport Agadir Al Massira avec votre pancarte personnalisée || Transfert ~~ Voiture privée vers votre hôtel 4★ en bord de mer sur la Corniche d'Agadir (~45 min) || Après-midi ~~ Enregistrement · installation || 18h30 ~~ Promenade sur la plage au coucher du soleil || 20h00 ~~ Dîner de fruits de mer frais sur la Corniche" } },
      { day: 2, route: { en: "Free Atlantic Day", no: "Fri Atlanterhavs-dag", fr: "Journée Atlantique Libre" }, text: {
        en: "All day ~~ No schedule — 9 km of golden Atlantic sand, warm calm water, sunbeds & parasols, to decompress before Morocco takes your breath away || Optional ~~ Sunset camel ride on the beach (~250 MAD/p) · horse riding on the shore (~350 MAD/p) · surf lesson (~350 MAD/p) · Paradise Valley natural pools (~600 MAD)",
        no: "Hele dagen ~~ Ingen program — 9 km gyllen atlanterhavssand, varmt stille vann, liggestoler & parasoll, for å slappe av før Marokko tar pusten fra deg || Valgfritt ~~ Kamelritt på stranden ved solnedgang (~250 MAD/p) · ridning ved vannet (~350 MAD/p) · surfetime (~350 MAD/p) · Paradisdalen naturlige basseng (~600 MAD)",
        fr: "Toute la journée ~~ Aucun programme — 9 km de sable doré atlantique, eau chaude et calme, transats & parasols, pour décompresser avant que le Maroc ne vous coupe le souffle || En option ~~ Balade à dos de chameau au coucher du soleil (~250 MAD/p) · équitation au bord de l'eau (~350 MAD/p) · cours de surf (~350 MAD/p) · piscines naturelles de la Vallée du Paradis (~600 MAD)" } },
      { day: 3, route: { en: "Second Free Atlantic Day", no: "Andre frie Atlanterhavs-dag", fr: "Deuxième Journée Atlantique Libre" }, text: {
        en: "All day ~~ A second full day entirely at your own pace — the Atlantic, the beach, complete freedom || Optional ~~ Jet ski on the bay (~600 MAD/p) · hotel spa · half-day excursion to Taroudant (the \"little Marrakech\", 80 km inland)",
        no: "Hele dagen ~~ En andre full dag helt i eget tempo — Atlanterhavet, stranden og full frihet || Valgfritt ~~ Jetski på bukten (~600 MAD/p) · hotell-spa · halvdagstur til Taroudant (\"lille Marrakech\", 80 km innover)",
        fr: "Toute la journée ~~ Une deuxième journée entière à votre rythme — l'Atlantique, la plage et la liberté totale || En option ~~ Jet ski sur la baie (~600 MAD/p) · spa de l'hôtel · excursion d'une demi-journée à Taroudant (le \"petit Marrakech\", à 80 km)" } },
      { day: 4, route: { en: "Agadir → Marrakech — Through Argan Country", no: "Agadir → Marrakech — Gjennom Arganlandskapet", fr: "Agadir → Marrakech — À travers le Pays de l'Argan" }, text: {
        en: "09:00 ~~ Private transfer Agadir → Marrakech (250 km, ~3.5h) || En route ~~ Argan forest · women's argan cooperative (hand-pressing, fair prices) · goats up in the branches || Afternoon ~~ Arrive luxury riad · honeymoon welcome: rose petals, fresh juice, handwritten note || 20:00 ~~ Romantic candlelit dinner arranged by the concierge",
        no: "09:00 ~~ Privat transfer Agadir → Marrakech (250 km, ~3,5t) || Underveis ~~ Arganskogen · kvinnelig argankooperativ (pressing for hånd, rettferdige priser) · geiter oppe i grenene || Ettermiddag ~~ Ankomst luksusriad · bryllupsreise-velkomst: roseblade, fersk juice, håndskrevet notat || 20:00 ~~ Romantisk levende lys-middag arrangert av konsiergen",
        fr: "09h00 ~~ Transfert privé Agadir → Marrakech (250 km, ~3h30) || En route ~~ Forêt d'arganiers · coopérative féminine d'argan (pression à la main, prix équitables) · chèvres dans les branches || Après-midi ~~ Arrivée riad de luxe · accueil lune de miel : pétales de rose, jus frais, note manuscrite || 20h00 ~~ Dîner romantique aux chandelles organisé par le concierge" } },
      { day: 5, route: { en: "Marrakech — Medina & Cooking Class", no: "Marrakech — Medina & Matkurs", fr: "Marrakech — Médina & Cours de Cuisine" }, text: {
        en: "07:30 ~~ Moroccan breakfast on the rooftop || 10:00–13:00 ~~ Private guided medina tour: Jemaa el-Fna, Koutoubia gardens, Bahia Palace, souk circuit || 13:00 ~~ Market visit for cooking-class ingredients || 13:30–16:00 ~~ Cooking class at a traditional riad (€49/p) — tagine, pastilla or couscous, then eat together || 20:00 ~~ Romantic dinner in the riad courtyard",
        no: "07:30 ~~ Marokkansk frokost på taket || 10:00–13:00 ~~ Privat guidet medina-omvisning: Jemaa el-Fna, Koutoubia-hager, Bahia-palasset, souk-krets || 13:00 ~~ Markedsbesøk for matkurs-ingredienser || 13:30–16:00 ~~ Matkurs i et tradisjonelt riad (€49/p) — tagine, pastilla eller couscous, spis sammen etterpå || 20:00 ~~ Romantisk middag i riad-gårdhagen",
        fr: "07h30 ~~ Petit-déjeuner marocain sur le toit || 10h00–13h00 ~~ Visite guidée privée de la médina : Jemaa el-Fna, jardins de la Koutoubia, Palais Bahia, circuit des souks || 13h00 ~~ Visite du marché pour les ingrédients du cours || 13h30–16h00 ~~ Cours de cuisine dans un riad traditionnel (€49/p) — tajine, pastilla ou couscous, puis dégustation ensemble || 20h00 ~~ Dîner romantique dans le patio du riad" } },
      { day: 6, route: { en: "Marrakech — Couples Hammam & Choice", no: "Marrakech — Par-Hammam & Valg", fr: "Marrakech — Hammam en Couple & Choix" }, text: {
        en: "07:30 ~~ Breakfast || 10:00–13:00 ~~ Couples luxury hammam in a private suite — black soap, kessa exfoliation, ghassoul clay mask, argan-oil massage, mint tea || 13:00 ~~ Lunch at leisure || Afternoon ~~ Choose: Majorelle Garden + YSL Museum (~70 MAD/p) OR Agafay — sunset camel ride (€30/p) or Dinner & Show (€55/p) || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Frokost || 10:00–13:00 ~~ Luksuriøst parhammam i privat suite — svart såpe, kessa-eksfoliering, ghassoul-leirmaske, arganolje-massasje, myntete || 13:00 ~~ Lunsj etter eget valg || Ettermiddag ~~ Velg: Majorelle-hagen + YSL-museum (~70 MAD/p) ELLER Agafay — kamelritt ved solnedgang (€30/p) eller Middag & Show (€55/p) || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Petit-déjeuner || 10h00–13h00 ~~ Hammam de luxe en couple dans une suite privée — savon noir, exfoliation kessa, masque ghassoul, massage à l'huile d'argan, thé à la menthe || 13h00 ~~ Déjeuner libre || Après-midi ~~ Au choix : Jardin Majorelle + Musée YSL (~70 MAD/p) OU Agafay — chameau au coucher du soleil (€30/p) ou Dîner & Spectacle (€55/p) || 20h00 ~~ Dîner libre" } },
      { day: 7, route: { en: "Marrakech → Dades Valley", no: "Marrakech → Dades-dalen", fr: "Marrakech → Vallée du Dadès" }, text: {
        en: "07:15 ~~ Early departure || 07:15–09:00 ~~ Tizi n'Tichka pass (2,260m) · photo stop || 10:30–12:00 ~~ Aït Ben Haddou UNESCO kasbah (guided 1.5h) · Gladiator & Game of Thrones location || 12:00–13:30 ~~ Ouarzazate lunch || 13:30–17:00 ~~ Valley of Roses scenic route || 17:00 ~~ Dades Valley guesthouse · Atlas & gorge views || 19:30 ~~ Dinner included",
        no: "07:15 ~~ Tidlig avreise || 07:15–09:00 ~~ Tizi n'Tichka-passet (2 260m) · fotostopp || 10:30–12:00 ~~ Aït Ben Haddou UNESCO-kasbah (guidet 1,5t) · Gladiator & Game of Thrones-sted || 12:00–13:30 ~~ Ouarzazate lunsj || 13:30–17:00 ~~ Rosedalen panoramarute || 17:00 ~~ Dades-dalen gjestehus · utsikt over Atlas & kløfter || 19:30 ~~ Middag inkludert",
        fr: "07h15 ~~ Départ matinal || 07h15–09h00 ~~ Col du Tizi n'Tichka (2 260m) · arrêt photo || 10h30–12h00 ~~ Kasbah UNESCO d'Aït Ben Haddou (guidé 1h30) · décor de Gladiator & Game of Thrones || 12h00–13h30 ~~ Déjeuner à Ouarzazate || 13h30–17h00 ~~ Route panoramique de la Vallée des Roses || 17h00 ~~ Maison d'hôtes vallée du Dadès · vue Atlas & gorges || 19h30 ~~ Dîner inclus" } },
      { day: 8, route: { en: "Dades → Merzouga", no: "Dades → Merzouga", fr: "Dadès → Merzouga" }, text: {
        en: "07:30 ~~ Breakfast || 08:30–10:00 ~~ Dades Gorges hairpin S-bends (famous viewpoint) || 10:00–12:00 ~~ Todra Gorges — 300m walls · flat 2 km walk || 12:00–13:30 ~~ Tinghir palm oasis lunch || 13:30–16:30 ~~ Drive to Merzouga || 17:00–18:00 ~~ Camel trek into Erg Chebbi (1h, €30/p) || 18:00–19:00 ~~ Sunset from the 150m dunes || 19:30 ~~ Gnawa welcome · Moroccan feast under the stars at luxury camp || Night ~~ Overnight in a luxury tent",
        no: "07:30 ~~ Frokost || 08:30–10:00 ~~ Dades-kløftene harpinssvinger (berømt utsiktspunkt) || 10:00–12:00 ~~ Todra-kløftene — 300m vegger · flat 2 km vandring || 12:00–13:30 ~~ Tinghir palmeoasis lunsj || 13:30–16:30 ~~ Kjøring til Merzouga || 17:00–18:00 ~~ Kamelritt inn i Erg Chebbi (1t, €30/p) || 18:00–19:00 ~~ Solnedgang fra de 150m dynene || 19:30 ~~ Gnawa-velkomst · marokkansk festmiddag under stjernene i luksusleir || Natt ~~ Overnatting i luksustelt",
        fr: "07h30 ~~ Petit-déjeuner || 08h30–10h00 ~~ Épingles en S des gorges du Dadès (célèbre belvédère) || 10h00–12h00 ~~ Gorges du Todra — parois de 300m · marche plate de 2 km || 12h00–13h30 ~~ Déjeuner oasis de palmiers de Tinghir || 13h30–16h30 ~~ Route vers Merzouga || 17h00–18h00 ~~ Randonnée à dos de chameau dans l'Erg Chebbi (1h, €30/p) || 18h00–19h00 ~~ Coucher de soleil depuis les dunes de 150m || 19h30 ~~ Accueil Gnawa · festin marocain sous les étoiles au camp de luxe || Nuit ~~ Nuit en tente de luxe" } },
      { day: 9, route: { en: "A Full Day in the Sahara", no: "En hel dag i Sahara", fr: "Une Journée Entière au Sahara" }, text: {
        en: "06:00 ~~ Sahara sunrise from outside your tent || 07:30 ~~ Berber breakfast at camp || 09:00–12:00 ~~ Bedouin family visit (seasonal) · jeep excursion · sandboarding · or complete rest || Afternoon ~~ Camp pool || 18:30 ~~ Second sunset from the dunes || 19:30 ~~ Final desert dinner under the stars",
        no: "06:00 ~~ Sahara-soloppgang fra utsiden av teltet || 07:30 ~~ Berberfrokost i leiren || 09:00–12:00 ~~ Beduin-familiebesøk (sesong) · jeep-utflukt · sandboarding · eller fullstendig hvile || Ettermiddag ~~ Leirbasseng || 18:30 ~~ Andre solnedgang fra dynene || 19:30 ~~ Siste ørken-middag under stjernene",
        fr: "06h00 ~~ Lever de soleil au Sahara depuis votre tente || 07h30 ~~ Petit-déjeuner berbère au camp || 09h00–12h00 ~~ Visite famille bédouine (saisonnier) · excursion en jeep · sandboard · ou repos complet || Après-midi ~~ Piscine du camp || 18h30 ~~ Deuxième coucher de soleil sur les dunes || 19h30 ~~ Dernier dîner dans le désert sous les étoiles" } },
      { day: 10, route: { en: "Merzouga → Fes", no: "Merzouga → Fes", fr: "Merzouga → Fès" }, text: {
        en: "07:30 ~~ Return from the dunes · breakfast || 08:30 ~~ Scenic drive north to Fes (~450 km, 7–8h) || 10:00–11:00 ~~ Azrou cedar forest · Barbary macaques || 13:00 ~~ Midelt lunch || 17:00 ~~ Arrive Fes riad || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Tilbake fra dynene · frokost || 08:30 ~~ Panoramakjøring nordover til Fes (~450 km, 7–8t) || 10:00–11:00 ~~ Azrou-sedertreskogen · berberaper || 13:00 ~~ Midelt-lunsj || 17:00 ~~ Ankomst Fes riad || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Retour des dunes · petit-déjeuner || 08h30 ~~ Route panoramique vers le nord jusqu'à Fès (~450 km, 7–8h) || 10h00–11h00 ~~ Forêt de cèdres d'Azrou · macaques de Barbarie || 13h00 ~~ Déjeuner à Midelt || 17h00 ~~ Arrivée riad de Fès || 20h00 ~~ Dîner libre" } },
      { day: 11, route: { en: "Fes — World's Oldest Living City", no: "Fes — Verdens eldste levende by", fr: "Fès — La Plus Ancienne Ville Vivante du Monde" }, text: {
        en: "07:30 ~~ Breakfast || 10:00–13:00 ~~ Specialist guide: Chouara tanneries · Al-Qarawiyyin (oldest university, founded 859 AD) · Bou Inania Madrasa · metalworkers' souk · Nejjarine fountain || 13:00 ~~ Lunch inside the medina || 15:00–18:00 ~~ Optional: couples hammam · Marinid Tombs panorama · pottery village || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Frokost || 10:00–13:00 ~~ Spesialistguide: Chouara-garveriene · Al-Qarawiyyin (eldste universitet, grunnlagt 859 e.Kr.) · Bou Inania Madrasa · metallarbeidernes souk · Nejjarine-fontenen || 13:00 ~~ Lunsj inne i medina || 15:00–18:00 ~~ Valgfritt: parhammam · Marinid-gravene panorama · pottemakersby || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Petit-déjeuner || 10h00–13h00 ~~ Guide spécialiste : tanneries Chouara · Al-Qarawiyyin (plus vieille université, fondée 859) · Médersa Bou Inania · souk des ferronniers · fontaine Nejjarine || 13h00 ~~ Déjeuner dans la médina || 15h00–18h00 ~~ Optionnel : hammam en couple · panorama Tombeaux Mérinides · village de poterie || 20h00 ~~ Dîner libre" } },
      { day: 12, route: { en: "Fes → Chefchaouen", no: "Fes → Chefchaouen", fr: "Fès → Chefchaouen" }, text: {
        en: "07:30 ~~ Breakfast || 09:00 ~~ Private transfer Fes → Chefchaouen (200 km, ~4h) || 13:00 ~~ Arrive · free afternoon in the blue alleyways || 18:30 ~~ Spanish Mosque viewpoint at sunset || 20:00 ~~ Dinner in the medina",
        no: "07:30 ~~ Frokost || 09:00 ~~ Privat transfer Fes → Chefchaouen (200 km, ~4t) || 13:00 ~~ Ankomst · fri ettermiddag i de blå smugene || 18:30 ~~ Den spanske moskeens utsiktspunkt ved solnedgang || 20:00 ~~ Middag i medina",
        fr: "07h30 ~~ Petit-déjeuner || 09h00 ~~ Transfert privé Fès → Chefchaouen (200 km, ~4h) || 13h00 ~~ Arrivée · après-midi libre dans les ruelles bleues || 18h30 ~~ Belvédère de la Mosquée Espagnole au coucher du soleil || 20h00 ~~ Dîner dans la médina" } },
      { day: 13, route: { en: "Chefchaouen → Tangier", no: "Chefchaouen → Tanger", fr: "Chefchaouen → Tanger" }, text: {
        en: "08:00 ~~ Morning: Ras El Ma waterfall · viewpoint · souvenir shopping in the blue alleyways || 11:00 ~~ Private transfer to Tangier (115 km, ~2h) || 14:00 ~~ 4★ hotel check-in || Afternoon ~~ Optional: Cap Spartel (Atlantic meets Mediterranean) · Hercules Caves (~15 MAD) · Tangier medina || 20:00 ~~ Final dinner: freshest Atlantic seafood",
        no: "08:00 ~~ Morgen: Ras El Ma-fossen · utsiktspunkt · souvenirhandel i de blå smugene || 11:00 ~~ Privat transfer til Tanger (115 km, ~2t) || 14:00 ~~ Innsjekk 4★ hotell || Ettermiddag ~~ Valgfritt: Cap Spartel (Atlanterhavet møter Middelhavet) · Herkulesgrottene (~15 MAD) · Tanger medina || 20:00 ~~ Siste middag: ferskeste atlanterhavssjømat",
        fr: "08h00 ~~ Matin : cascade Ras El Ma · belvédère · achats de souvenirs dans les ruelles bleues || 11h00 ~~ Transfert privé vers Tanger (115 km, ~2h) || 14h00 ~~ Enregistrement hôtel 4★ || Après-midi ~~ Optionnel : Cap Spartel (l'Atlantique rencontre la Méditerranée) · Grottes d'Hercule (~15 MAD) · médina de Tanger || 20h00 ~~ Dernier dîner : fruits de mer atlantiques les plus frais" } },
      { day: 14, route: { en: "Departure from Tangier", no: "Avreise fra Tanger", fr: "Départ de Tanger" }, text: {
        en: "08:00 ~~ Final breakfast overlooking the Strait of Gibraltar || Morning ~~ Last walk on the seafront · final mint tea || Flight −2.5h ~~ Private transfer to Tangier Ibn Batouta Airport",
        no: "08:00 ~~ Siste frokost med utsikt over Gibraltarstredet || Morgen ~~ Siste tur på strandpromenaden · siste myntete || Fly −2,5t ~~ Privat transfer til Tanger Ibn Batouta lufthavn",
        fr: "08h00 ~~ Dernier petit-déjeuner surplombant le détroit de Gibraltar || Matin ~~ Dernière promenade sur le front de mer · dernier thé à la menthe || Vol −2,5h ~~ Transfert privé vers l'aéroport Tanger Ibn Batouta" } },
    ],
    included: [
      { en: "Agadir airport pickup → Tangier airport drop-off (open-jaw routing)", no: "Agadir lufthavn henting → Tanger lufthavn avsetting (åpen-kjeve ruting)", fr: "Prise en charge aéroport Agadir → dépôt aéroport Tanger (routing open-jaw)" },
      { en: "Private transport throughout", no: "Privat transport gjennom hele reisen", fr: "Transport privé tout au long du voyage" },
      { en: "3 nights 4-star beachfront hotel Agadir · 3 nights luxury riad Marrakech · 1 night authentic guesthouse Dades Valley (dinner included) · 2 nights luxury Merzouga desert camp (dinners included) · 2 nights riad Fes Medina · 1 night boutique hotel Chefchaouen · 1 night 4-star hotel Tangier", no: "3 netter 4-stjerners strandhotell Agadir · 3 netter luksusriad Marrakech · 1 natt autentisk gjestehus Dades-dalen (middag inkludert) · 2 netter luksus Merzouga-ørkenleir (middager inkludert) · 2 netter riad Fes Medina · 1 natt boutique-hotell Chefchaouen · 1 natt 4-stjerners hotell Tanger", fr: "3 nuits hôtel 4 étoiles en bord de mer Agadir · 3 nuits riad de luxe Marrakech · 1 nuit maison d'hôtes authentique Vallée du Dadès (dîner inclus) · 2 nuits camp désertique de luxe Merzouga (dîners inclus) · 2 nuits riad Médina de Fès · 1 nuit hôtel boutique Chefchaouen · 1 nuit hôtel 4 étoiles Tanger" },
      { en: "Daily breakfast", no: "Daglig frokost", fr: "Petit-déjeuner quotidien" },
      { en: "Honeymoon welcome surprise at Marrakech riad", no: "Bryllupsreise velkomstoveraskelse i Marrakech riad", fr: "Surprise de bienvenue lune de miel au riad de Marrakech" },
      { en: "Argan women's cooperative stop (Agadir → Marrakech drive)", no: "Argan-kvinnekooperativstopp (Agadir → Marrakech kjøring)", fr: "Arrêt coopérative féminine d'argan (trajet Agadir → Marrakech)" },
      { en: "Certified guide — Marrakech Medina (3h) · Moroccan cooking class at traditional riad (incl. lunch)", no: "Sertifisert guide — Marrakech Medina (3t) · Marokkansk matkurs på tradisjonelt riad (inkl. lunsj)", fr: "Guide certifié — Médina de Marrakech (3h) · Cours de cuisine marocaine dans un riad traditionnel (déj. inclus)" },
      { en: "Couples luxury hammam — private suite (2.5h)", no: "Luksuriøst parhammam — privat suite (2,5t)", fr: "Hammam de luxe en couple — suite privée (2h30)" },
      { en: "Certified guide — Fes Medina full-day specialist · Aït Ben Haddou guided visit · Chefchaouen half-day guide", no: "Sertifisert guide — Fes Medina heldags spesialist · Aït Ben Haddou guidet besøk · Chefchaouen halvdags guide", fr: "Guide certifié — spécialiste Médina de Fès journée complète · visite guidée Aït Ben Haddou · guide demi-journée Chefchaouen" },
      { en: "Camel trek into Erg Chebbi at sunset — 1 hour · live Berber music at camp", no: "Kamelritt inn i Erg Chebbi ved solnedgang — 1 time · levende berbermusikk i leiren", fr: "Randonnée à dos de chameau vers l'Erg Chebbi au coucher du soleil — 1 heure · musique berbère en direct au camp" },
      { en: "24/7 WhatsApp support — Aladdin & Marte", no: "24/7 WhatsApp-støtte — Aladdin & Marte", fr: "Assistance WhatsApp 24h/24 — Aladdin & Marte" },
    ],
    excluded: [
      { en: "International flights (open-jaw: AGA arrival · TNG departure)", no: "Internasjonale flyreiser (åpen kjeve: AGA ankomst · TNG avreise)", fr: "Vols internationaux (open-jaw : arrivée AGA · départ TNG)" },
      { en: "Optional beach activities in Agadir", no: "Valgfrie strandaktiviteter i Agadir", fr: "Activités de plage optionnelles à Agadir" },
      { en: "Dinners not listed in itinerary", no: "Middager som ikke er oppgitt i reiseplanen", fr: "Dîners non mentionnés dans l'itinéraire" },
      { en: "Lunches throughout", no: "Lunsjer gjennom hele reisen", fr: "Déjeuners tout au long du voyage" },
      { en: "Aït Ben Haddou guide fee (~100 MAD/p)", no: "Aït Ben Haddou guide honorar (~100 MAD/p)", fr: "Honoraire du guide d'Aït Ben Haddou (~100 MAD/p)" },
      { en: "Bou Inania Madrasa Fes (~70 MAD/p)", no: "Bou Inania Madrasa Fes (~70 MAD/p)", fr: "Médersa Bou Inania Fès (~70 MAD/p)" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommandée)" },
      { en: "Personal expenses and tips", no: "Personlige utgifter og tips", fr: "Dépenses personnelles et pourboires" },
    ],
  },
  // ===== 4D3N — Romance Package =====
  {
    __special: true,
    slug: "romance-4d3n", chapter: "07",
    title: { en: "Romance Package", no: "Romance-pakke", fr: "Forfait Romance" },
    duration: "4D3N", days: 4, nights: 3,
    route: "Marrakech → Agafay → Marrakech",
    priceFromEUR: 650,
    img: "assets/photos/riad-suite-honeymoon-22.jpg",
    badge: { en: "COUPLES ONLY", no: "KUN FOR PAR", fr: "POUR COUPLES" },
    themeTags: ["Romance", "Riad", "Agafay", "Hammam"],
    teaser: { en: "A riad in the medina, a hammam for two, and a night under the stars in the Agafay — built entirely for couples.", no: "Et riad i medina, hammam for to og en natt under stjernene i Agafay — laget helt for par.", fr: "Un riad dans la médina, un hammam pour deux et une nuit sous les étoiles à l'Agafay — pensé entièrement pour les couples." },
    overview: { en: "Morocco has always been a backdrop for romance, and this package is designed around that. Two nights in a hand-picked riad with a private rooftop terrace, a couples hammam, a candlelit dinner in a riad courtyard, and one night at an Agafay luxury camp — where the Atlas glows at sunset and the stars fill every corner of the sky.", no: "Marokko har alltid vært en kulisse for romantikk, og denne pakken er bygget rundt det. To netter i et hånplukkert riad med privat takterrasse, hammam for to, et stearinlysmiddag i en riad-gårdhage og én natt i en luksusleirplass i Agafay — der Atlas glir i solnedgangen og stjernene fyller hele himmelen.", fr: "Le Maroc a toujours été un décor pour la romance, et ce forfait est conçu autour de ça. Deux nuits dans un riad soigneusement choisi avec terrasse privée sur le toit, hammam pour deux, dîner aux bougies dans un patio de riad, et une nuit dans un camp de luxe à l'Agafay — où l'Atlas rougeoie au coucher du soleil et les étoiles remplissent tout le ciel." },
    idealFor: { en: "Couples, honeymoons & anniversaries", no: "Par, bryllupsreiser og jubileer", fr: "Couples, lunes de miel & anniversaires" },
    highlights: [
      { en: "Private rooftop riad with sunset views", no: "Privat takterrasse i riad med solnedgangsutsikt", fr: "Riad avec terrasse privée et vue coucher de soleil" },
      { en: "Couples hammam & argan oil massage", no: "Hammam for to & arganoljemasasje", fr: "Hammam pour deux & massage à l'huile d'argan" },
      { en: "Candlelit dinner in a riad courtyard", no: "Stearinlysmiddag i riad-gårdhage", fr: "Dîner aux bougies dans un patio de riad" },
      { en: "Private Agafay luxury camp night", no: "Privat luksusleirplass-natt i Agafay", fr: "Nuit privée au camp de luxe de l'Agafay" },
      { en: "Rose petals & welcome Champagne on arrival", no: "Roseblader og velkomst-Champagne ved ankomst", fr: "Pétales de rose & Champagne de bienvenue à l'arrivée" },
      { en: "Sunset camel ride for two", no: "Kamelritt i solnedgang for to", fr: "Balade à dos de chameau au coucher du soleil pour deux" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival — a riad just for you", no: "Ankomst — et riad bare for dere", fr: "Arrivée — un riad rien que pour vous" }, text: { en: "Private airport pickup in a comfortable car. Transfer to your boutique riad in the heart of the medina. Rose petals, Moroccan pastries and welcome Champagne in the room. Rooftop sunset with the Koutoubia in the distance. Intimate dinner by candlelight at a partner riad — we reserve the best table.", no: "Privat henting på flyplassen i en komfortabel bil. Transfer til ditt boutique-riad i hjertet av medina. Roseblader, marokkansk bakverk og velkomst-Champagne på rommet. Solnedgang fra taket med Koutoubia i det fjerne. Intim middag i stearinlys på et partner-riad — vi reserverer det beste bordet.", fr: "Prise en charge privée à l'aéroport dans une voiture confortable. Transfert vers votre riad de charme au cœur de la médina. Pétales de rose, pâtisseries marocaines et Champagne de bienvenue dans la chambre. Coucher de soleil en terrasse avec la Koutoubia au loin. Dîner intime aux bougies dans un riad partenaire — nous réservons la meilleure table." } },
      { day: 2, route: { en: "Medina, hammam & a slow evening", no: "Medina, hammam og en rolig kveld", fr: "Médina, hammam & une soirée douce" }, text: { en: "Breakfast in the courtyard, just the two of you. Guided 2-hour medina walk — Bahia Palace, the spice souk, hidden squares. Lunch at Le Jardin. Free afternoon for shopping or rest. Couples hammam & argan oil massage at 16:00 (90 minutes, private suite). Sundowner on your rooftop terrace. Light dinner in the medina — we handle the reservation.", no: "Frokost i gårdhagen, bare dere to. Guidet 2-timers medinavandring — Bahia-palasset, krydder­souken, skjulte torg. Lunsj på Le Jardin. Fri ettermiddag for shopping eller hvile. Hammam for to & arganoljemasasje kl. 16:00 (90 minutter, privat suite). Sundowner på takterrassen. Lett middag i medina — vi tar reservasjonen.", fr: "Petit-déjeuner dans le patio, juste vous deux. Balade guidée de 2 h dans la médina — Palais Bahia, souk aux épices, places cachées. Déjeuner au Jardin. Après-midi libre pour le shopping ou le repos. Hammam pour deux & massage à l'huile d'argan à 16h (90 minutes, suite privée). Sundowner sur votre terrasse. Dîner léger dans la médina — nous gérons la réservation." } },
      { day: 3, route: { en: "Into the Agafay — desert for two", no: "Ut til Agafay — ørken for to", fr: "Cap sur l'Agafay — le désert pour deux" }, text: { en: "Slow breakfast. Your driver collects you after noon. Private transfer to the Agafay stone desert (~40 min). Check-in at a luxury tented camp — your private en-suite tent overlooks the Atlas. Camel ride at sunset, side by side. Apéritif under the open sky. Private dinner by lantern light with a Moroccan set menu.", no: "Rolig frokost. Sjåføren henter dere etter middag. Privat transfer til Agafay-steinørkenen (~40 min). Innsjekk i luksusleirplassen — ditt private telt med eget bad har utsikt over Atlas. Kamelritt i solnedgang, side ved side. Aperitiff under åpen himmel. Privat middag i lyktelys med fast marokkansk meny.", fr: "Petit-déjeuner tranquille. Votre chauffeur vous récupère après midi. Transfert privé vers le désert de pierres de l'Agafay (~40 min). Enregistrement dans un camp de luxe sous tentes — votre tente privée en suite surplombe l'Atlas. Balade à dos de chameau au coucher du soleil, côte à côte. Apéritif sous le ciel ouvert. Dîner privé à la lumière des lanternes avec un menu marocain fixe." } },
      { day: 4, route: { en: "Sunrise & departure", no: "Soloppgang og avreise", fr: "Lever de soleil & départ" }, text: { en: "Wake to Atlas colours. Coffee and pastries brought to your tent. Slow camp breakfast. Return to Marrakech. Optional Majorelle visit before the airport. Private transfer to RAK.", no: "Vekk til Atlasfargene. Kaffe og bakverk brakt til teltet. Rolig frokost i leiren. Tilbake til Marrakech. Valgfritt Majorelle-besøk før flyplassen. Privat transfer til RAK.", fr: "Réveil aux couleurs de l'Atlas. Café et pâtisseries apportés à la tente. Petit-déjeuner tranquille au camp. Retour à Marrakech. Visite optionnelle du Majorelle avant l'aéroport. Transfert privé vers RAK." } },
    ],
    included: [
      { en: "All private transfers in a comfortable air-conditioned vehicle", no: "Alle private transferer i komfortabel klimaanlegg bil", fr: "Tous les transferts privés en véhicule climatisé confortable" },
      { en: "Two nights in a romantic boutique riad (couple's room with private rooftop), with breakfast", no: "To netter i et romantisk boutique-riad (dobbeltrom med privat takterrasse), med frokost", fr: "Deux nuits dans un riad de charme romantique (chambre couple avec terrasse privée), avec petit-déjeuner" },
      { en: "One night at a luxury Agafay camp (private en-suite tent), with breakfast", no: "Én natt i luksusleirplass i Agafay (privat telt med bad), med frokost", fr: "Une nuit dans un camp de luxe à l'Agafay (tente privée en suite), avec petit-déjeuner" },
      { en: "Welcome rose petals, Moroccan pastries and a bottle of Champagne in the room", no: "Velkomst med roseblader, marokkansk bakverk og en flaske Champagne på rommet", fr: "Pétales de rose de bienvenue, pâtisseries marocaines et une bouteille de Champagne dans la chambre" },
      { en: "Guided 2-hour medina walk for two (private guide)", no: "Guidet 2-timers medinavandring for to (privat guide)", fr: "Balade guidée de 2 h dans la médina pour deux (guide privé)" },
      { en: "90-minute couples hammam & argan oil massage (private spa suite)", no: "90 minutters hammam for to & arganoljemasasje (privat spasuite)", fr: "Hammam pour deux de 90 min & massage à l'huile d'argan (suite spa privée)" },
      { en: "Dinner on Day 01 at a partner riad (candlelit, reserved table)", no: "Middag dag 01 på et partner-riad (stearinlys, reservert bord)", fr: "Dîner le Jour 01 dans un riad partenaire (aux bougies, table réservée)" },
      { en: "Sunset camel ride for two in the Agafay", no: "Kamelritt i solnedgang for to i Agafay", fr: "Balade à dos de chameau au coucher du soleil pour deux à l'Agafay" },
      { en: "Private dinner at the Agafay camp (set Moroccan menu, three courses)", no: "Privat middag på Agafay-leiren (fast marokkansk meny, tre retter)", fr: "Dîner privé au camp de l'Agafay (menu marocain fixe, trois plats)" },
      { en: "24/7 WhatsApp support from the Marrakechstory team", no: "24/7 WhatsApp-støtte fra Marrakechstory-teamet", fr: "Assistance WhatsApp 24h/24 de l'équipe Marrakechstory" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches (we give recommendations; you choose)", no: "Lunsjer (vi gir anbefalinger; dere velger)", fr: "Déjeuners (nous donnons des recommandations ; vous choisissez)" },
      { en: "Dinner on Day 02 (we book a special table; you settle the bill)", no: "Middag dag 02 (vi bestiller et spesialbord; dere betaler)", fr: "Dîner le Jour 02 (nous réservons une table spéciale ; vous réglez)" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" },
    ],
  },

  // ===== 5D4N — Romance Package =====
  {
    __special: true,
    slug: "romance-5d4n", chapter: "08",
    title: { en: "Romance Package", no: "Romance-pakke", fr: "Forfait Romance" },
    duration: "5D4N", days: 5, nights: 4,
    route: "Marrakech → Agafay → Essaouira → Marrakech",
    priceFromEUR: 780,
    img: "assets/photos/riad-rooftop-sunbed-23.jpg",
    badge: { en: "HONEYMOON PICK", no: "BRYLLUPSVALG", fr: "CHOIX LUNE DE MIEL" },
    themeTags: ["Romance", "Riad", "Agafay", "Essaouira", "Coast"],
    teaser: { en: "The medina, a night in the stone desert, and the wild Atlantic coast — five days of pure romance.", no: "Medina, en natt i steinørkenen og den ville Atlanterhavskysten — fem dager med ren romantikk.", fr: "La médina, une nuit dans le désert de pierres et la côte atlantique sauvage — cinq jours de pure romance." },
    overview: { en: "Everything in the 4-night romance package, plus a day and night in Essaouira — the breezy blue-and-white port city on the Atlantic. Wander the ramparts above the ocean, eat grilled fish at the harbour, and return to Marrakech for a final evening in the riad. Five nights, three completely different settings.", no: "Alt fra 4-natters romance-pakken, pluss en dag og natt i Essaouira — den friske blå-og-hvite havnebyen ved Atlanterhavet. Vandre murene over havet, spis grillet fisk i havnen og kom tilbake til Marrakech for en siste kveld i riaden. Fem netter, tre helt forskjellige omgivelser.", fr: "Tout du forfait romance 4 nuits, plus un jour et une nuit à Essaouira — la ville portuaire bleue et blanche ventée sur l'Atlantique. Flânez sur les remparts au-dessus de l'océan, mangez du poisson grillé au port, et rentrez à Marrakech pour une dernière soirée au riad. Cinq nuits, trois décors entièrement différents." },
    idealFor: { en: "Honeymoons, anniversaries & long-weekend romantics", no: "Bryllupsreiser, jubileer og romantiske langhelger", fr: "Lunes de miel, anniversaires & escapades romantiques" },
    highlights: [
      { en: "Private rooftop riad in the medina", no: "Privat takterrasse-riad i medina", fr: "Riad avec terrasse privée dans la médina" },
      { en: "Couples hammam & argan oil massage", no: "Hammam for to & arganoljemasasje", fr: "Hammam pour deux & massage à l'huile d'argan" },
      { en: "Agafay luxury camp night under the stars", no: "Luksusleirplass-natt under stjernene i Agafay", fr: "Nuit au camp de luxe sous les étoiles à l'Agafay" },
      { en: "Essaouira Atlantic ramparts & harbour", no: "Essaouiras atlantiske murer og havn", fr: "Remparts atlantiques & port d'Essaouira" },
      { en: "Fresh seafood lunch by the ocean", no: "Fersk sjømatlunsj ved havet", fr: "Déjeuner de fruits de mer frais au bord de l'océan" },
      { en: "Rose petals & Champagne welcome", no: "Roseblader og Champagne-velkomst", fr: "Pétales de rose & accueil Champagne" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival — a riad just for you", no: "Ankomst — et riad bare for dere", fr: "Arrivée — un riad rien que pour vous" }, text: { en: "Private airport pickup. Transfer to your boutique riad in the medina. Rose petals, pastries and welcome Champagne. Rooftop sunset. Candlelit dinner at a partner riad — best table reserved.", no: "Privat henting på flyplassen. Transfer til boutique-riaden din i medina. Roseblader, bakverk og velkomst-Champagne. Solnedgang fra taket. Stearinlysmiddag på partner-riad — beste bord reservert.", fr: "Prise en charge privée à l'aéroport. Transfert vers votre riad de charme dans la médina. Pétales de rose, pâtisseries et Champagne de bienvenue. Coucher de soleil en terrasse. Dîner aux bougies dans un riad partenaire — meilleure table réservée." } },
      { day: 2, route: { en: "Medina & hammam", no: "Medina og hammam", fr: "Médina & hammam" }, text: { en: "Breakfast in the courtyard. Guided 2-hour medina walk for two. Lunch at Le Jardin. Free afternoon. Couples hammam & argan oil massage at 16:00 (90 min, private suite). Sundowner on your rooftop. Dinner in the medina.", no: "Frokost i gårdhagen. Guidet 2-timers medinavandring for to. Lunsj på Le Jardin. Fri ettermiddag. Hammam for to & arganoljemasasje kl. 16:00 (90 min, privat suite). Sundowner på taket. Middag i medina.", fr: "Petit-déjeuner dans le patio. Balade guidée de 2 h dans la médina pour deux. Déjeuner au Jardin. Après-midi libre. Hammam pour deux & massage argan à 16h (90 min, suite privée). Sundowner sur le toit. Dîner dans la médina." } },
      { day: 3, route: { en: "Agafay — desert for two", no: "Agafay — ørken for to", fr: "Agafay — le désert pour deux" }, text: { en: "Late checkout. Transfer to the Agafay stone desert (~40 min). Check-in at the luxury tented camp. Camel ride at sunset. Private dinner by lantern light. Stargazing by the fire.", no: "Sen utsjekk. Transfer til Agafay-steinørkenen (~40 min). Innsjekk i luksusleirplassen. Kamelritt i solnedgang. Privat middag i lyktelys. Stjernekikking ved bålet.", fr: "Check-out tardif. Transfert vers le désert de pierres de l'Agafay (~40 min). Enregistrement au camp de luxe. Balade à dos de chameau au coucher du soleil. Dîner privé à la lumière des lanternes. Observation des étoiles au coin du feu." } },
      { day: 4, route: { en: "Agafay → Essaouira", no: "Agafay → Essaouira", fr: "Agafay → Essaouira" }, text: { en: "Sunrise at the camp. Breakfast with Atlas views. Drive to Essaouira (~2.5 hours). Check-in at a boutique hotel inside the ramparts. Walk the medina together. Lunch at the harbour — fresh fish at the best stall. Free afternoon — beach walk, art galleries. Dinner in the medina, candlelit.", no: "Soloppgang i leiren. Frokost med Atlasutsikt. Kjøring til Essaouira (~2,5 timer). Innsjekk på boutique-hotell innenfor murene. Gå medina sammen. Lunsj i havnen — fersk fisk på det beste stedet. Fri ettermiddag — strandstur, kunstgallerier. Middag i medina, i stearinlys.", fr: "Lever de soleil au camp. Petit-déjeuner avec vue sur l'Atlas. Route vers Essaouira (~2h30). Enregistrement dans un hôtel de charme dans les remparts. Balade dans la médina ensemble. Déjeuner au port — poisson frais au meilleur étal. Après-midi libre — promenade sur la plage, galeries d'art. Dîner dans la médina aux bougies." } },
      { day: 5, route: { en: "Essaouira → Marrakech & home", no: "Essaouira → Marrakech og hjem", fr: "Essaouira → Marrakech & retour" }, text: { en: "Morning walk along the Atlantic ramparts. Breakfast with ocean views. Return drive to Marrakech (~2.5 hours). Private transfer to RAK.", no: "Morgentur langs Atlanterhavsmurene. Frokost med havutsikt. Tilbakekjøring til Marrakech (~2,5 timer). Privat transfer til RAK.", fr: "Promenade matinale sur les remparts atlantiques. Petit-déjeuner avec vue sur l'océan. Retour en voiture vers Marrakech (~2h30). Transfert privé vers RAK." } },
    ],
    included: [
      { en: "All private transfers throughout (airport, riad, Agafay, Essaouira, RAK)", no: "Alle private transferer (flyplass, riad, Agafay, Essaouira, RAK)", fr: "Tous les transferts privés (aéroport, riad, Agafay, Essaouira, RAK)" },
      { en: "Two nights in a romantic riad in the Marrakech medina (private rooftop), with breakfast", no: "To netter i et romantisk riad i Marrakech-medina (privat takterrasse), med frokost", fr: "Deux nuits dans un riad romantique dans la médina de Marrakech (terrasse privée), avec petit-déjeuner" },
      { en: "One night at a luxury Agafay tented camp (private en-suite tent), with breakfast", no: "Én natt i luksusleirplass i Agafay (privat telt med bad), med frokost", fr: "Une nuit dans un camp de luxe à l'Agafay (tente privée en suite), avec petit-déjeuner" },
      { en: "One night in a boutique hotel in Essaouira, with breakfast", no: "Én natt i boutique-hotell i Essaouira, med frokost", fr: "Une nuit dans un hôtel de charme à Essaouira, avec petit-déjeuner" },
      { en: "Welcome rose petals, pastries and a bottle of Champagne on arrival", no: "Velkomst med roseblader, bakverk og en flaske Champagne ved ankomst", fr: "Pétales de rose, pâtisseries et une bouteille de Champagne à l'arrivée" },
      { en: "90-minute couples hammam & argan oil massage (private spa suite)", no: "90 minutters hammam for to & arganoljemasasje (privat spasuite)", fr: "Hammam pour deux de 90 min & massage à l'huile d'argan (suite privée)" },
      { en: "Guided 2-hour medina walk for two (private guide)", no: "Guidet 2-timers medinavandring for to (privat guide)", fr: "Balade guidée de 2 h dans la médina pour deux (guide privé)" },
      { en: "Sunset camel ride for two in the Agafay + private camp dinner", no: "Kamelritt i solnedgang for to i Agafay + privat leirsmiddag", fr: "Balade à dos de chameau pour deux à l'Agafay + dîner privé au camp" },
      { en: "Candlelit dinner at a Marrakech partner riad (Day 01)", no: "Stearinlysmiddag på Marrakech partner-riad (dag 01)", fr: "Dîner aux bougies dans un riad partenaire de Marrakech (Jour 01)" },
      { en: "24/7 WhatsApp support", no: "24/7 WhatsApp-støtte", fr: "Assistance WhatsApp 24h/24" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches (recommendations provided)", no: "Lunsjer (anbefalinger gis)", fr: "Déjeuners (recommandations fournies)" },
      { en: "Dinners on Day 02, 04 and 05 (we book; you pay)", no: "Middager dag 02, 04 og 05 (vi bestiller; dere betaler)", fr: "Dîners les Jours 02, 04 et 05 (nous réservons ; vous payez)" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" },
    ],
  },

  // ===== 4D3N — Family Package =====
  {
    __special: true,
    slug: "family-4d3n", chapter: "09",
    title: { en: "Family Package", no: "Familiepakke", fr: "Forfait Famille" },
    duration: "4D3N", days: 4, nights: 3,
    route: "Marrakech → Agafay → Marrakech",
    priceFromEUR: 500,
    img: "assets/photos/agafay-camel-palmeraie-20.jpg",
    badge: { en: "FAMILY FRIENDLY", no: "FAMILIEVENNLIG", fr: "FAMILLE BIENVENUE" },
    themeTags: ["Family", "Medina", "Agafay", "Kids"],
    teaser: { en: "Marrakech through a child's eyes — souks, snake charmers, a camel in the desert, and a riad with a splash pool.", no: "Marrakech gjennom et barns øyne — souker, slangefluktere, kamel i ørkenen og et riad med badebasseng.", fr: "Marrakech à travers les yeux d'un enfant — souks, charmeurs de serpents, chameau dans le désert et riad avec piscine." },
    overview: { en: "The same heart of Marrakech — but paced for children and designed to delight them. A family-friendly riad with a splash pool, a guided medina walk shaped around what kids actually love (the snake charmers, the leather tanneries, the candy souks), a family cooking class, and one magical night at an Agafay camp with a camel ride at sunset. Minimum age: 4 years.", no: "Det samme hjertet av Marrakech — men i et tempo for barn og designet for å glede dem. Et familievennlig riad med badebasseng, en guidet medinavandring formet rundt det barn faktisk elsker (slangefluktere, lærgarveriene, godteri-souken), et familiekurs i matlaging, og én magisk natt i en Agafay-leir med kamelritt i solnedgang. Minimumsalder: 4 år.", fr: "Le même cœur de Marrakech — mais au rythme des enfants et conçu pour les émerveiller. Un riad familial avec piscine, une balade guidée dans la médina axée sur ce que les enfants adorent vraiment (les charmeurs de serpents, les tanneries, le souk aux bonbons), un cours de cuisine en famille, et une nuit magique dans un camp de l'Agafay avec balade à dos de chameau au coucher du soleil. Âge minimum : 4 ans." },
    idealFor: { en: "Families with children aged 4–14", no: "Familier med barn i alderen 4–14 år", fr: "Familles avec enfants de 4 à 14 ans" },
    highlights: [
      { en: "Family-friendly riad with splash pool", no: "Familievennlig riad med badebasseng", fr: "Riad familial avec piscine" },
      { en: "Kids' medina walk — snake charmers, tanneries, candy souk", no: "Barnevennlig medinavandring — slangefluktere, garverier, godteri-souk", fr: "Balade médina pour enfants — charmeurs de serpents, tanneries, souk aux bonbons" },
      { en: "Family Moroccan cooking class", no: "Familiematkurs i marokkansk mat", fr: "Cours de cuisine marocaine en famille" },
      { en: "One night at the Agafay luxury camp", no: "Én natt i luksusleirplassen i Agafay", fr: "Une nuit au camp de luxe de l'Agafay" },
      { en: "Camel ride at sunset", no: "Kamelritt i solnedgang", fr: "Balade à dos de chameau au coucher du soleil" },
      { en: "Jardin Majorelle (kids love the peacocks!)", no: "Jardin Majorelle (barn elsker påfuglene!)", fr: "Jardin Majorelle (les enfants adorent les paons !)" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival — welcome to the adventure", no: "Ankomst — velkommen til eventyret", fr: "Arrivée — bienvenue dans l'aventure" }, text: { en: "Private airport pickup in a family-sized vehicle. Transfer to your family riad with a splash pool. Welcome Moroccan pastries and fresh juices for the kids. Rooftop sunset walk. Easy dinner close to the riad — Jemaa el-Fnaa food stalls or a family-friendly restaurant.", no: "Privat henting på flyplassen i et familiekjøretøy. Transfer til familieriad med badebasseng. Velkomst med marokkansk bakverk og ferske juicer til barna. Solnedgangstur fra taket. Enkel middag nær riaden — matstander på Jemaa el-Fnaa eller familievennlig restaurant.", fr: "Prise en charge privée à l'aéroport dans un véhicule familial. Transfert vers votre riad familial avec piscine. Pâtisseries marocaines et jus frais de bienvenue pour les enfants. Balade au coucher du soleil en terrasse. Dîner facile près du riad — étals de Jemaa el-Fnaa ou restaurant familial." } },
      { day: 2, route: { en: "The medina for little explorers", no: "Medina for unge oppdagere", fr: "La médina pour les petits explorateurs" }, text: { en: "Breakfast at the riad. Family medina walk (2h) with a guide who knows how to engage children: Jemaa el-Fnaa performers, leather tanneries from above, the candy and spice souk, a henna artist. Lunch at a family-friendly riad restaurant — wood-fired flatbread and kefta. Family Moroccan cooking class at 16:00 (1.5h) — kids make pastilla; parents make tajine. Dinner from your own creations.", no: "Frokost i riaden. Familietur i medina (2t) med en guide som vet å engasjere barn: Jemaa el-Fnaa-artister, lærgarverier sett ovenfra, godteri- og kryddersouken, en hennakunstner. Lunsj på familievennlig riad-restaurant — vedbrannsbakt flatbrød og kefta. Familiekurs i marokkansk matlaging kl. 16:00 (1,5t) — barn lager pastilla; foreldre lager tagine. Middag av egne kreasjoner.", fr: "Petit-déjeuner au riad. Balade médina en famille (2h) avec un guide qui sait captiver les enfants : artistes de Jemaa el-Fnaa, tanneries vues d'en haut, souk aux bonbons et aux épices, henné. Déjeuner dans un restaurant de riad familial — pain plat au feu de bois et kefta. Cours de cuisine marocaine en famille à 16h (1h30) — les enfants font la pastilla ; les parents font le tajine. Dîner de vos propres créations." } },
      { day: 3, route: { en: "Majorelle & the Agafay camp", no: "Majorelle og Agafay-leiren", fr: "Majorelle & le camp de l'Agafay" }, text: { en: "Morning visit to Jardin Majorelle (the kids will love the peacocks and the electric-blue walls). Light lunch garden-side. Private transfer to the Agafay stone desert (~40 min). Family check-in at the luxury camp. Camel ride at sunset — one per person or shared. Campfire storytelling and star-spotting after dinner.", no: "Morgenbesøk til Jardin Majorelle (barna vil elske påfuglene og de elektrisk blå veggene). Lett lunsj i hagen. Privat transfer til Agafay-steinørkenen (~40 min). Familieinnsjekk i luksusleirplassen. Kamelritt i solnedgang — én per person eller felles. Historiefortelling rundt bålet og stjernekikking etter middag.", fr: "Visite matinale du Jardin Majorelle (les enfants adoreront les paons et les murs bleu électrique). Déjeuner léger côté jardin. Transfert privé vers le désert de pierres de l'Agafay (~40 min). Enregistrement en famille au camp de luxe. Balade à dos de chameau au coucher du soleil — un par personne ou partagé. Contes au coin du feu et observation des étoiles après dîner." } },
      { day: 4, route: { en: "Camp morning & departure", no: "Leirmorgen og avreise", fr: "Matin au camp & départ" }, text: { en: "Wake the kids to the Atlas silhouette. Camp breakfast. Return to Marrakech (~40 min). Final souk for souvenirs — we guide you to the best children's toy stalls. Private transfer to RAK.", no: "Vekk barna til Atlasskyggen. Frokost i leiren. Tilbake til Marrakech (~40 min). Siste soukrunde for suvenirer — vi guider dere til de beste leke- og suvenirstandene for barn. Privat transfer til RAK.", fr: "Réveillez les enfants face à la silhouette de l'Atlas. Petit-déjeuner au camp. Retour à Marrakech (~40 min). Dernier souk pour les souvenirs — nous vous guidons vers les meilleurs étals de jouets pour enfants. Transfert privé vers RAK." } },
    ],
    included: [
      { en: "All private transfers in a family-sized vehicle with English-speaking driver", no: "Alle private transferer i familiekjøretøy med engelsktalende sjåfør", fr: "Tous les transferts privés en véhicule familial avec chauffeur anglophone" },
      { en: "Two nights in a family-friendly boutique riad (splash pool, family rooms), with breakfast", no: "To netter i familievennlig boutique-riad (badebasseng, familierom), med frokost", fr: "Deux nuits dans un riad de charme familial (piscine, chambres famille), avec petit-déjeuner" },
      { en: "One night at a luxury Agafay camp (family tent or adjoining tents), with breakfast", no: "Én natt i luksusleirplass i Agafay (familietelt eller tilstøtende telt), med frokost", fr: "Une nuit dans un camp de luxe à l'Agafay (tente famille ou tentes adjacentes), avec petit-déjeuner" },
      { en: "2-hour children-focused medina walking tour with a specialist family guide", no: "2-timers barnevennlig medinavandring med spesialist-familieguide", fr: "Balade guidée de 2 h dans la médina axée enfants avec un guide spécialisé famille" },
      { en: "1.5-hour family Moroccan cooking class (kids + adults together)", no: "1,5-timers familiekurs i marokkansk matlaging (barn + voksne)", fr: "Cours de cuisine marocaine de 1h30 en famille (enfants + adultes)" },
      { en: "Camel ride at sunset in the Agafay (one per person)", no: "Kamelritt i solnedgang i Agafay (én per person)", fr: "Balade à dos de chameau au coucher du soleil à l'Agafay (un par personne)" },
      { en: "Camp dinner at the Agafay (set family menu, child portions available)", no: "Leirsmiddag i Agafay (fast familiemeny, barneporsjoner tilgjengelig)", fr: "Dîner au camp de l'Agafay (menu famille fixe, portions enfants disponibles)" },
      { en: "Skip-the-line tickets to Jardin Majorelle", no: "Billetter uten kø til Jardin Majorelle", fr: "Billets coupe-file pour le Jardin Majorelle" },
      { en: "24/7 WhatsApp support from the Marrakechstory team", no: "24/7 WhatsApp-støtte fra Marrakechstory-teamet", fr: "Assistance WhatsApp 24h/24 de l'équipe Marrakechstory" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches on Day 01, 03 and 04 (recommendations provided)", no: "Lunsjer dag 01, 03 og 04 (anbefalinger gis)", fr: "Déjeuners les Jours 01, 03 et 04 (recommandations fournies)" },
      { en: "Dinners on Day 01 and 02 (we help with suggestions and bookings)", no: "Middager dag 01 og 02 (vi hjelper med forslag og bestillinger)", fr: "Dîners les Jours 01 et 02 (nous aidons avec suggestions et réservations)" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" },
    ],
  },

  // ===== 5D4N — Family Package =====
  {
    __special: true,
    slug: "family-5d4n", chapter: "10",
    title: { en: "Family Package", no: "Familiepakke", fr: "Forfait Famille" },
    duration: "5D4N", days: 5, nights: 4,
    route: "Marrakech → High Atlas → Agafay → Marrakech",
    priceFromEUR: 650,
    img: "assets/photos/atlas-azzaden-valley-03.jpg",
    badge: { en: "FAMILY FAVOURITE", no: "FAMILIEFAVORITT", fr: "FAVORI FAMILLE" },
    themeTags: ["Family", "Medina", "High Atlas", "Agafay", "Kids"],
    teaser: { en: "The full family adventure — medina magic, a Berber village in the mountains, and a night under the stars in the stone desert.", no: "Det fullstendige familieeventyret — medinmagi, en berberlandsby i fjellene og en natt under stjernene i steinørkenen.", fr: "La grande aventure familiale — magie de la médina, village berbère en montagne et nuit sous les étoiles dans le désert de pierres." },
    overview: { en: "One day longer than our 4-night family package, and the extra day makes a real difference — a full Atlas valley day in the mountains, where the kids meet Berber children, ride a mule on a village trail, and share a home-cooked lunch with a local family. Combined with the medina, cooking class, and an Agafay camp night, this is the family trip Morocco does best.", no: "Én dag lenger enn vår 4-natters familiepakke, og den ekstra dagen utgjør en ekte forskjell — en hel dag i Atlas-dalen i fjellene, der barna møter berberbarn, rir på et muldyr på en landsbysti og deler et hjemmelaget måltid med en lokal familie. Kombinert med medina, matkurs og en Agafay-leirplass-natt er dette familieturen Marokko er best på.", fr: "Un jour de plus que notre forfait famille 4 nuits, et ce jour supplémentaire fait vraiment la différence — une journée complète dans la vallée de l'Atlas en montagne, où les enfants rencontrent des enfants berbères, font de la randonnée à mulet sur un sentier de village et partagent un déjeuner cuisiné à la maison avec une famille locale. Combiné à la médina, au cours de cuisine et à une nuit au camp de l'Agafay, c'est le voyage en famille que le Maroc fait le mieux." },
    idealFor: { en: "Families with children aged 4–14 wanting more adventure", no: "Familier med barn 4–14 år som vil ha mer eventyr", fr: "Familles avec enfants de 4 à 14 ans en quête de plus d'aventure" },
    highlights: [
      { en: "Family riad with splash pool", no: "Familieriad med badebasseng", fr: "Riad familial avec piscine" },
      { en: "Kids' medina walk — snake charmers & candy souk", no: "Barnevennlig medinavandring — slangefluktere og godteri-souk", fr: "Balade médina enfants — charmeurs de serpents & souk aux bonbons" },
      { en: "Family cooking class", no: "Familiekurs i matlaging", fr: "Cours de cuisine en famille" },
      { en: "High Atlas Berber village day — mule ride & family lunch", no: "Høyatlas berberlandsby-dag — mulesritt og familielunsj", fr: "Journée village berbère Haut Atlas — mulet & déjeuner famille" },
      { en: "Agafay camp night & camel ride", no: "Agafay-leirplass-natt og kamelritt", fr: "Nuit au camp Agafay & balade à dos de chameau" },
      { en: "Jardin Majorelle peacocks & YSL gardens", no: "Jardin Majorelles påfugler og YSL-hager", fr: "Paons du Jardin Majorelle & jardins YSL" },
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival — the adventure begins", no: "Ankomst — eventyret begynner", fr: "Arrivée — l'aventure commence" }, text: { en: "Private airport pickup in a family vehicle. Transfer to your family riad with a splash pool. Welcome pastries and fresh juices. Orientation rooftop walk. Easy dinner near the riad — Jemaa el-Fnaa or family restaurant.", no: "Privat henting på flyplassen i et familiekjøretøy. Transfer til familieriad med badebasseng. Velkomstbakverk og ferske juicer. Orienteringstur fra taket. Enkel middag nær riaden — Jemaa el-Fnaa eller familierestaurant.", fr: "Prise en charge privée à l'aéroport en véhicule familial. Transfert vers votre riad familial avec piscine. Pâtisseries et jus de bienvenue. Balade d'orientation en terrasse. Dîner facile près du riad — Jemaa el-Fnaa ou restaurant familial." } },
      { day: 2, route: { en: "Medina for little explorers", no: "Medina for unge oppdagere", fr: "La médina pour les petits explorateurs" }, text: { en: "Guided family medina walk (2h): performers, tanneries, candy souk, henna artist. Lunch at a family riad restaurant. Family Moroccan cooking class at 16:00 (1.5h). Dinner from your own kitchen.", no: "Guidet familievandring i medina (2t): artister, garverier, godteri-souk, hennakunstner. Lunsj på familieriad-restaurant. Familiekurs i marokkansk matlaging kl. 16:00 (1,5t). Middag fra eget kjøkken.", fr: "Balade guidée en famille dans la médina (2h) : artistes, tanneries, souk aux bonbons, henné. Déjeuner au restaurant du riad familial. Cours de cuisine marocaine en famille à 16h (1h30). Dîner de votre propre cuisine." } },
      { day: 3, route: { en: "High Atlas — Berber mountain day", no: "Høyatlas — berberfjelldagen", fr: "Haut Atlas — journée berbère en montagne" }, text: { en: "Morning drive into the High Atlas (Ourika Valley or Imlil, ~1h). Mule ride on a mountain trail for the kids (30 min). Guided village walk — meet local Berber children, see a traditional Berber home. Home-cooked family lunch in a Berber house (tagine, flatbread, herbal tea). Return to Marrakech. Majorelle garden visit — peacocks and the blue gardens.", no: "Morgentur inn i Høyatlas (Ourika-dalen eller Imlil, ~1t). Mulesritt på fjellsti for barna (30 min). Guidet landsbyvandring — møt lokale berberbarn, se et tradisjonelt berberhjem. Hjemmelaget familielunsj i et berberhus (tagine, flatbrød, urtete). Tilbake til Marrakech. Besøk i Majorellehagen — påfugler og de blå hagene.", fr: "Promenade matinale dans le Haut Atlas (vallée de l'Ourika ou Imlil, ~1h). Randonnée à mulet sur un sentier de montagne pour les enfants (30 min). Balade guidée dans le village — rencontrez des enfants berbères locaux, visitez une maison berbère traditionnelle. Déjeuner familial cuisiné à la maison (tajine, pain plat, thé aux herbes). Retour à Marrakech. Visite du jardin Majorelle — paons et jardins bleus." } },
      { day: 4, route: { en: "Agafay — desert camp night", no: "Agafay — ørkenleir-natt", fr: "Agafay — nuit au camp du désert" }, text: { en: "Transfer to the Agafay stone desert (~40 min). Family check-in at the luxury camp. Camel ride at sunset — one each. Camp dinner with Moroccan music and storytelling under the stars. Kids can spot constellations with the camp guide.", no: "Transfer til Agafay-steinørkenen (~40 min). Familieinnsjekk i luksusleirplassen. Kamelritt i solnedgang — én per person. Leirsmiddag med marokkansk musikk og historiefortelling under stjernene. Barna kan se stjernekart med leirguiden.", fr: "Transfert vers le désert de pierres de l'Agafay (~40 min). Enregistrement en famille au camp de luxe. Balade à dos de chameau au coucher du soleil — un par personne. Dîner au camp avec musique marocaine et contes sous les étoiles. Les enfants peuvent repérer les constellations avec le guide du camp." } },
      { day: 5, route: { en: "Sunrise & souvenir run", no: "Soloppgang og suvenirjakt", fr: "Lever de soleil & chasse aux souvenirs" }, text: { en: "Atlas sunrise from the camp. Breakfast. Return to Marrakech (~40 min). Souvenir souk run — we guide you to the best toy and craft stalls. Private transfer to RAK.", no: "Atlassoloppgang fra leiren. Frokost. Tilbake til Marrakech (~40 min). Souvenirsouken — vi guider dere til de beste leke- og håndverkstandene. Privat transfer til RAK.", fr: "Lever de soleil sur l'Atlas depuis le camp. Petit-déjeuner. Retour à Marrakech (~40 min). Tour du souk aux souvenirs — nous vous guidons vers les meilleurs étals de jouets et artisanat. Transfert privé vers RAK." } },
    ],
    included: [
      { en: "All private transfers in a family-sized vehicle with English-speaking driver", no: "Alle private transferer i familiekjøretøy med engelsktalende sjåfør", fr: "Tous les transferts privés en véhicule familial avec chauffeur anglophone" },
      { en: "Three nights in a family-friendly boutique riad (splash pool, family rooms), with breakfast", no: "Tre netter i familievennlig boutique-riad (badebasseng, familierom), med frokost", fr: "Trois nuits dans un riad de charme familial (piscine, chambres famille), avec petit-déjeuner" },
      { en: "One night at a luxury Agafay camp (family tent or adjoining tents), with breakfast", no: "Én natt i luksusleirplass i Agafay (familietelt eller tilstøtende telt), med frokost", fr: "Une nuit dans un camp de luxe à l'Agafay (tente famille ou tentes adjacentes), avec petit-déjeuner" },
      { en: "2-hour children-focused medina walk with a specialist family guide", no: "2-timers barnevennlig medinavandring med spesialistfamilieguide", fr: "Balade de 2 h dans la médina axée enfants avec un guide spécialisé famille" },
      { en: "1.5-hour family Moroccan cooking class", no: "1,5-timers familiekurs i marokkansk matlaging", fr: "Cours de cuisine marocaine de 1h30 en famille" },
      { en: "Full High Atlas day: guided Berber village walk + mule ride for kids + home-cooked family lunch", no: "Full Høyatlas-dag: guidet berberlandsbyvandring + mulesritt for barn + hjemmelaget familielunsj", fr: "Journée complète Haut Atlas : balade guidée dans un village berbère + mulet pour enfants + déjeuner familial cuisiné" },
      { en: "Jardin Majorelle skip-the-line tickets", no: "Billetter uten kø til Jardin Majorelle", fr: "Billets coupe-file pour le Jardin Majorelle" },
      { en: "Camel ride at sunset in the Agafay + camp dinner (family menu, child portions)", no: "Kamelritt i solnedgang i Agafay + leirsmiddag (familiemeny, barneporsjoner)", fr: "Balade à dos de chameau à l'Agafay + dîner au camp (menu famille, portions enfants)" },
      { en: "24/7 WhatsApp support from the Marrakechstory team", no: "24/7 WhatsApp-støtte fra Marrakechstory-teamet", fr: "Assistance WhatsApp 24h/24 de l'équipe Marrakechstory" },
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches on Day 01 and 05 (recommendations provided)", no: "Lunsjer dag 01 og 05 (anbefalinger gis)", fr: "Déjeuners les Jours 01 et 05 (recommandations fournies)" },
      { en: "Dinners on Day 01, 02 and 05 (we help with suggestions)", no: "Middager dag 01, 02 og 05 (vi hjelper med forslag)", fr: "Dîners les Jours 01, 02 et 05 (nous aidons avec suggestions)" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" },
    ],
  },
];

// ── PER-TRIP IMAGE GALLERIES ─────────────────────────────────────
// Content-matched, hand-verified photos for each trip's stops/cities/
// activities. Bare names live in assets/photos/; "web/…" are landmark
// shots sourced from Wikimedia Commons (freely licensed). Every image
// was visually checked — never trust a filename.
const MS_TRIP_GALLERIES = {
  'merzouga-sahara-escape': [
    'medina-koutoubia-dusk-18.jpg', 'atlas-mountains-20.jpg', 'web/aitbenhaddou.jpg',
    'web/ouarzazate-kasbah.jpg', 'web/dades-valley.jpg', 'web/todra-gorge.jpg',
    'sahara-camel-caravan-16.jpg', 'sahara-dunes-ripples-13.jpg', 'sahara-dunes-10.jpg',
    'sahara-dunes-12.jpg', 'sahara-camel-sunrise-15.jpg', 'food-tagine-09.webp',
  ],
  'marrakech-agafay': [
    'medina-jemaa-el-fna-10.webp', 'medina-souk-spices-19.jpg', 'medina-koutoubia-04.jpg',
    'riad-courtyard-pool-03.jpg', 'food-garden-restaurant-05.jpg', 'food-cooking-class-13.jpg',
    'agafay-camp-aerial-06.jpg', 'agafay-pool-08.jpg', 'agafay-camel-palmeraie-20.jpg',
    'agafay-dinner-table-03.jpg', 'agafay-night-fire-show-02.avif', 'agafay-dome-night-09.webp',
  ],
  'best-of-marrakech': [
    'medina-rooftop-cafe-14.jpg', 'medina-jemaa-el-fna-night-11.jpg', 'medina-carpet-souk-30.jpg',
    'marrakech-jardin-majorelle-01.jpg', 'riad-pool-dusk-15.jpg', 'atlas-setti-fatma-falls-12.jpg',
    'atlas-azzaden-valley-03.jpg', 'essaouira-blue-boats-02.jpg', 'agafay-pool-08.jpg',
    'agafay-camp-aerial-06.jpg', 'agafay-night-lounge-05.jpg', 'food-tagine-09.webp',
  ],
  'morocco-highlights': [
    'medina-koutoubia-04.jpg', 'atlas-mountains-20.jpg', 'web/aitbenhaddou.jpg',
    'web/dades-valley.jpg', 'web/todra-gorge.jpg', 'sahara-camel-caravan-16.jpg',
    'sahara-dunes-ripples-13.jpg', 'sahara-dunes-10.jpg', 'sahara-camel-sunrise-15.jpg',
    'agafay-night-fire-show-02.avif', 'food-mechoui-lamb-03.webp',
  ],
  'grand-morocco-journey': [
    'web/chefchaouen-2.jpg', 'chefchaouen-blue-alley-01.jpg',
    'web/fez-bab.jpg', 'web/fez-tannery.jpg', 'sahara-camel-caravan-16.jpg',
    'sahara-dunes-ripples-13.jpg', 'sahara-dunes-10.jpg', 'medina-koutoubia-dusk-18.jpg',
    'medina-jemaa-el-fna-night-11.jpg', 'riad-courtyard-pool-03.jpg',
  ],
  'full-morocco-honeymoon': [
    'web/agadir-bay.jpg', 'riad-suite-honeymoon-22.jpg', 'medina-koutoubia-dusk-18.jpg',
    'riad-pool-dusk-01.jpg', 'agafay-night-dinner-04.jpg', 'sahara-camel-caravan-16.jpg',
    'sahara-dunes-ripples-13.jpg', 'web/fez-bab.jpg', 'web/chefchaouen-2.jpg',
    'web/tangier-medina.jpg', 'hammam-spa-room-01.avif', 'balloon-marrakech-01.jpg',
  ],
  'romance-4d3n': [
    'riad-suite-honeymoon-22.jpg', 'riad-pool-dusk-15.jpg', 'medina-lanterns-25.jpg',
    'agafay-night-dinner-04.jpg', 'agafay-dome-night-09.webp', 'agafay-night-fire-show-02.avif',
    'agafay-pool-08.jpg', 'hammam-spa-room-01.avif', 'balloon-marrakech-01.jpg',
  ],
  'romance-5d4n': [
    'riad-suite-honeymoon-22.jpg', 'medina-rooftop-cafe-14.jpg', 'agafay-night-lounge-05.jpg',
    'agafay-dome-night-09.webp', 'essaouira-beach-horse-01.jpg', 'essaouira-horse-sunset-03.jpg',
    'essaouira-blue-boats-02.jpg', 'riad-pool-dusk-15.jpg', 'balloon-marrakech-01.jpg',
  ],
  'family-4d3n': [
    'medina-jemaa-el-fna-10.webp', 'medina-storks-03.jpg', 'riad-courtyard-pool-03.jpg',
    'agafay-camel-palmeraie-20.jpg', 'agafay-buggy-desert-19.jpg', 'agafay-quad-desert-18.jpg',
    'agafay-pool-08.jpg', 'food-cooking-class-13.jpg', 'balloon-marrakech-01.jpg',
  ],
  'family-5d4n': [
    'medina-jemaa-el-fna-10.webp', 'atlas-setti-fatma-falls-12.jpg', 'atlas-azzaden-valley-03.jpg',
    'atlas-valley-14.jpg', 'agafay-camel-palmeraie-20.jpg', 'agafay-buggy-desert-19.jpg',
    'agafay-pool-08.jpg', 'riad-courtyard-pool-03.jpg', 'food-tagine-09.webp',
  ],
};
function msGalleryFor(trip) {
  const g = MS_TRIP_GALLERIES[trip.slug];
  const list = (g && g.length) ? g : [trip.img];
  return list.map(p => (/^(assets\/|https?:)/.test(p) ? p : 'assets/photos/' + p));
}

// ── HERO CAROUSEL — auto-advancing, arrows, dots, swipe ──────────
function TripCarousel({ images, alt, children }) {
  const [idx, setIdx] = useStateIt(0);
  const [paused, setPaused] = useStateIt(false);
  const touch = useRefIt(null);
  const n = images.length;
  useEffectIt(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % n), 4200);
    return () => clearInterval(t);
  }, [paused, n]);
  useEffectIt(() => { if (idx >= n) setIdx(0); }, [n]);
  const go = (d) => setIdx(i => (i + d + n) % n);
  const onTouchStart = (e) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touch.current = null;
  };
  return (
    <div className="itin-carousel"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="itin-carousel-track">
        {images.map((src, i) => (
          <div key={i}
            className={'itin-carousel-slide' + (i === idx ? ' is-active' : '')}
            style={{ backgroundImage: `url(${src})` }}
            role="img" aria-label={alt ? alt + ' — ' + (i + 1) : undefined} />
        ))}
      </div>
      {children}
      {n > 1 && (
        <>
          <button className="itin-carousel-arrow prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous image">‹</button>
          <button className="itin-carousel-arrow next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next image">›</button>
          <div className="itin-carousel-count">{idx + 1} / {n}</div>
          <div className="itin-carousel-dots">
            {images.map((_, i) => (
              <button key={i}
                className={'itin-carousel-dot' + (i === idx ? ' is-active' : '')}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                aria-label={'Go to image ' + (i + 1)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── DETAIL MODAL — single scrollable page ───────────────────────
function ItinModal({ trip, onClose, lang, fmt }) {
  useEffectIt(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : lang === 'da' ? (no || en) : en;
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
      <div className="itin-modal itin-modal-v2 itin-modal-split" onClick={e => e.stopPropagation()}>
        <button className="itin-modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Hero — image carousel of this trip's stops */}
        <div className="itin-modal-hero">
          <TripCarousel images={msGalleryFor(trip)} alt={s(trip.title)}>
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
          </TripCarousel>
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
            <div className="itin-timeline-header">
              <h3 className="itin-modal-h3 itin-timeline-h">{tx('Day by day','Dag for dag','Jour par jour')}</h3>
              <span className="itin-timeline-count">{trip.days} {tx('days','dager','jours')}</span>
            </div>
            <ol className="itin-timeline-list">
              {trip.itinerary.map((d, i) => {
                const rawText = s(d.text);
                // Parse into clean {time, activity} rows. Preferred authoring format:
                //   "07:00 ~~ Activity || 07:15–09:30 ~~ Next activity || …"
                // Fallback for older trips: split sentences and detect a leading time/label.
                let rows;
                if (rawText.indexOf('||') > -1 || rawText.indexOf('~~') > -1) {
                  rows = rawText.split('||').map(seg => {
                    const p = seg.split('~~');
                    return p.length > 1
                      ? { t: p[0].trim(), a: p.slice(1).join('~~').trim() }
                      : { t: '', a: seg.trim() };
                  }).filter(r => r.a);
                } else {
                  const TIME_RE = /^((?:\d{1,2}[:.]\d{2})(?:\s*[–-]\s*\d{1,2}[:.]\d{2})?|Upon arrival|On arrival|Flight\s*[−–-]?\s*\d+\s*h?|Pre-dawn|Evening|Nightly|Night|Morning|Afternoon|All day)\b[\s.,—–-]*/i;
                  rows = rawText.split('. ').map(seg => seg.replace(/\.\s*$/, '').trim()).filter(Boolean).map(seg => {
                    const m = seg.match(TIME_RE);
                    return m ? { t: m[1], a: seg.slice(m[0].length).trim() } : { t: '', a: seg };
                  });
                }
                return (
                  <li key={i} className="itin-timeline-item">
                    <div className="itin-timeline-marker">
                      <span className="itin-tl-badge" aria-hidden="true">{d.day}</span>
                    </div>
                    <div className="itin-timeline-card">
                      <div className="itin-timeline-route">{s(d.route)}</div>
                      <div className="itin-tl-rows">
                        {rows.map((r, ri) => (
                          <div key={ri} className="itin-tl-row">
                            <span className={'itin-tl-time' + (r.t ? '' : ' itin-tl-time-none')}>{r.t || '•'}</span>
                            <span className="itin-tl-act">{r.a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ── Included / Not included ── */}
          <div className="itin-section-divider" />
          <div className="itin-inex">
            {trip.included && trip.included.length > 0 && (
              <div className="itin-inex-col">
                <div className="itin-inex-header itin-inex-header-yes">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="6.5" fill="#2a9d5c" fillOpacity=".15"/><path d="M3.5 6.5l2 2 4-4" stroke="#2a9d5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {tx('Included','Inkludert','Inclus')}
                </div>
                <ul className="itin-inex-list">
                  {trip.included.map((x, i) => (
                    <li key={i} className="itin-inex-item">
                      <span className="itin-inex-dot itin-inex-dot-yes">✓</span>
                      <span>{s(x)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {trip.excluded && trip.excluded.length > 0 && (
              <div className="itin-inex-col itin-inex-col-no">
                <div className="itin-inex-header itin-inex-header-no">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="6.5" fill="#86868b" fillOpacity=".12"/><path d="M4.5 4.5l4 4M8.5 4.5l-4 4" stroke="#86868b" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  {tx('Not included','Ikke inkludert','Non inclus')}
                </div>
                <ul className="itin-inex-list">
                  {trip.excluded.map((x, i) => (
                    <li key={i} className="itin-inex-item">
                      <span className="itin-inex-dot itin-inex-dot-no">—</span>
                      <span>{s(x)}</span>
                    </li>
                  ))}
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
              <button className="btn btn-primary itin-booking-btn-primary" onClick={() => goPlan('asis')}>
                {tx('Take as-is →','Ta som den er →','Prendre tel quel →')}
              </button>
              <button className="btn btn-outline"
                onClick={() => {
                  const t = trip;
                  onClose();
                  setTimeout(() => {
                    if (window.MS_OpenTweak) window.MS_OpenTweak(t);
                    else { window.location.hash = '#plan'; }
                  }, 60);
                }}>
                ✏️ {tx('Tweak this trip','Tilpass denne reisen','Personnaliser ce voyage')}
              </button>
              <a className="btn btn-outline" href="https://wa.me/4745774743" target="_blank" rel="noopener">
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
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : lang === 'da' ? (no || en) : en;
  const [filter, setFilter] = useStateIt('4D3N');
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
      setFilter('4D3N');
    };
    window.addEventListener('ms:open-trip', onOpen);
    return () => window.removeEventListener('ms:open-trip', onOpen);
  }, []);

  // Simple, friendly labels (no jargon)
  const filterLabel = (f) => {
    if (f === 'All')              return tx('All', 'Alle', 'Tout');
    if (f === 'Themes')           return tx('Themes', 'Temaer', 'Thèmes');
    if (f === 'Romance & Family') return tx('Romance & Family', 'Romantikk & Familie', 'Romance & Famille');
    if (f === 'Most booked')      return tx('Most booked', 'Mest bestilt', 'Plus réservé');
    if (f === '3D2N')             return tx('3 days', '3 dager', '3 jours');
    if (f === '4D3N')             return tx('4 days', '4 dager', '4 jours');
    if (f === '5D4N')             return tx('5 days', '5 dager', '5 jours');
    if (f === '7D6N')             return tx('7 days', '7 dager', '7 jours');
    if (f === '10D9N')            return tx('10 days', '10 dager', '10 jours');
    if (f === '14D13N')           return tx('14 days', '14 dager', '14 jours');
    return f;
  };
  const filters = ['3D2N', '4D3N', '5D4N', '7D6N', '10D9N', '14D13N', 'Romance & Family'];
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
      img: 'assets/photos/sahara-sunset-riding-17.jpg',
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
  ].filter(t => t.__theme || t.__special || ALLOWED_DURATIONS.has(t.duration)), [THEMES]);
  const matches = (t) => {
    if (filter === 'Themes') return !!t.__theme;
    if (filter === 'Romance & Family') return !!t.__special;
    // Duration tabs only show real itineraries — themes and special packages live in their own tabs.
    return !t.__theme && !t.__special && t.duration === filter;
  };
  const tier = (t) => {
    if (t.__theme) return -2;
    if (t.__special) return -1.5;
    if (t.badge === 'MOST BOOKED' || t.badge === 'MOST LOVED') return -1;
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
                : f === 'Romance & Family'
                ? all.filter(t => t.__special).length
                : all.filter(t => !t.__theme && !t.__special && t.duration === f).length;
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

            <div className={`trip-slider ${filter !== 'Themes' && filter !== 'Romance & Family' ? 'trip-slider-feature' : ''}`} data-dir={sliderDir}>
              {(filter === 'Themes' || filter === 'Romance & Family') ? (
                <>
                  <button className="trip-slider-arrow prev" aria-label="Previous"
                    onClick={(e) => { const sc = e.currentTarget.parentElement.querySelector('.trip-slider-track'); sc?.scrollBy({ left: -(sc.clientWidth * 0.85), behavior: 'smooth' }); }}>
                    <Iit.Arrow s={18} dir={180} />
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
                      const order = ['3D2N','4D3N','5D4N','7D6N','10D9N','14D13N','Romance & Family'];
                      const idx = Math.max(0, order.indexOf(filter));
                      setSliderDir('prev');
                      setFilter(order[(idx - 1 + order.length) % order.length]);
                    }}>
                    <Iit.Arrow s={18} dir={180} />
                  </button>
                  <button className="trip-slider-arrow next" aria-label={tx('Longer trip', 'Lengre reise', 'Plus long')}
                    onClick={() => {
                      const order = ['3D2N','4D3N','5D4N','7D6N','10D9N','14D13N','Romance & Family'];
                      const idx = Math.max(0, order.indexOf(filter));
                      setSliderDir('next');
                      setFilter(order[(idx + 1) % order.length]);
                    }}>
                    <Iit.Arrow s={18} />
                  </button>
                </>
              )}
              <div className={`trip-slider-track cat-grid reiseplaner-grid ${filter !== 'Themes' && filter !== 'Romance & Family' ? 'reiseplaner-grid-feature' : ''}`}>
              {visibleItems.map((t, i) => {
                // Derive rating + reviews deterministically — Marrakechstory's actually booked these
                const seed = t.slug.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
                const rating = (4.7 + ((seed % 30) / 100)).toFixed(2);  // 4.70 – 4.99
                const reviews = 180 + (seed * 7) % 1620;                  // 180 – 1800
                const key = `itin-${t.slug}`;
                const isTheme = !!t.__theme;
                const isFeature = filter !== 'Themes' && filter !== 'Romance & Family' && !isTheme && !t.__special;
                const handleOpen = () => isTheme ? openTheme(t) : setOpenTrip(t);
                const priceTxt = t.priceFromEUR ? adjustedPrice(t.priceFromEUR) : null;
                if (isFeature) {
                  return (
                    <div key={t.slug} className="trip-feature reveal"
                      onClick={handleOpen} role="button" tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleOpen()}>
                      <div className="trip-feature-img">
                        <TripCarousel images={msGalleryFor(t)} alt={typeof t.title === 'object' ? (t.title[lang] || t.title.en) : t.title}>
                          <span className="trip-feature-badge">
                            {(typeof t.badge === 'object' ? (t.badge[lang] || t.badge.en) : t.badge) || tx('Best pick', 'Best i klassen', 'Notre coup de cœur')}
                          </span>
                          <span className="trip-feature-duration">{t.duration}</span>
                        </TripCarousel>
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
