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
    title: "The Marrakech Weekend",
    duration: "3D2N", days: 3, nights: 2,
    route: "Marrakech",
    priceFromEUR: 590,
    img: "assets/photos/jemaa-el-fna-18.jpg",
    badge: "MOST LOVED",
    themeTags: ["Medina", "Riad", "Hammam"],
    teaser: "A long weekend in the red city — medina, garden, hammam.",
    overview: "Three days is enough for Marrakech to leave a mark — provided you spend them well. We open with a slow medina morning, give you a true Moroccan lunch in a private riad courtyard, and finish in the gardens that softened the city for Yves Saint Laurent. Two nights in a hand-picked riad inside the walls.",
    idealFor: "Couples & first-timers",
    highlights: ["Guided 3-hour medina walk", "Lunch at a hidden riad", "Traditional hammam & gommage", "Jardin Majorelle + YSL Museum", "Two nights in a boutique riad"],
    itinerary: [
      { day: 1, route: "Arrival · the first call to prayer", text: "Private airport pickup. Transfer to your riad inside the medina. Mint tea welcome. Optional rooftop sunset over the medina. Light dinner walking distance from the riad." },
      { day: 2, route: "The medina, on foot", text: "Breakfast in the courtyard. Guided 3-hour medina walk: Bahia Palace, the spice souk, Ben Youssef Madrasa, the dyers' quarter. Lunch at a partner riad — three courses. Free afternoon. Traditional hammam & gommage at 17:30. Dinner at Nomad or Le Jardin." },
      { day: 3, route: "Majorelle, then home", text: "Slow breakfast. Final souk run. Visit Jardin Majorelle and the YSL Museum (tickets pre-booked). Light lunch garden-side. Private transfer to RAK three hours before flight." },
    ],
    included: [
      "All private transfers (airport ⇄ riad, riad ⇄ Majorelle) in an air-conditioned vehicle with English-speaking driver",
      "Two nights in a hand-picked boutique riad inside the medina (4★ equivalent), with breakfast",
      "Licensed local guide for the 3-hour medina walking tour",
      "Lunch on Day 02 at a partner riad (three courses)",
      "60-minute traditional hammam & gommage at a private spa",
      "Skip-the-line tickets to Jardin Majorelle and YSL Museum",
      "24/7 in-country support from the Marrakech Story team (WhatsApp)",
      "Welcome briefing and printed walking map of the medina",
    ],
    excluded: [
      "International flights to/from Marrakech",
      "Dinners (we book the tables; you settle the bill)",
      "Travel insurance (strongly recommended)",
      "Tips for driver, guide and riad staff",
      "Personal shopping",
      "Visa fees if applicable",
    ],
  },

  // ===== 4D3N — The Marrakech & Agafay =====
  {
    slug: "marrakech-agafay", chapter: "02",
    title: "The Marrakech & Agafay",
    duration: "4D3N", days: 4, nights: 3,
    route: "Marrakech → Agafay → Marrakech",
    priceFromEUR: 790,
    img: "assets/photos/agafay-valley-marrakech-74.jpg",
    themeTags: ["Medina", "Desert", "Stargazing"],
    teaser: "Three nights in the medina, one in the stone desert under the stars.",
    overview: "The same medina foundation as the Weekend, with a single, well-placed night in the Agafay — the rocky lunar desert forty minutes from the city. You leave the medina after lunch, watch the Atlas turn pink at sunset from a luxury tented camp, ride a camel if you wish, and return the next morning to one final Marrakech afternoon.",
    idealFor: "Couples seeking a soft taste of desert",
    highlights: ["Guided 3-hour medina walk", "Lunch at a hidden riad", "Drive to the Agafay", "Camel ride at sunset", "Dinner under the stars + stargazing", "Sunrise from your tent terrace"],
    itinerary: [
      { day: 1, route: "Arrival in Marrakech", text: "Private airport pickup. Transfer to riad. Mint tea, map orientation. Optional sunset rooftop walk to Jemaa el-Fnaa. Dinner suggestions." },
      { day: 2, route: "The medina, slowly", text: "Guided medina walking tour (3h): Bahia Palace, souks, Ben Youssef Madrasa. Lunch at a hidden riad. Free afternoon — hammam suggested at 17:00. Dinner at Le Jardin or Limoni." },
      { day: 3, route: "Into the Agafay", text: "Late checkout. Driver collects you with luggage. Lunch en route at a Berber café with Atlas views. Arrival at the luxury Agafay camp. Camel ride at sunset (optional). Sunset apéritif. Dinner under the stars — set Moroccan menu, three courses. Stargazing by the fire." },
      { day: 4, route: "Camp sunrise & home", text: "Sunrise from your tent terrace, coffee brought to you. Slow camp breakfast. Return drive to Marrakech (40 min). Day room at the riad if your flight is late. Private transfer to RAK." },
    ],
    included: [
      "All private transfers in an air-conditioned vehicle with English-speaking driver",
      "Two nights in a hand-picked riad in the medina, with breakfast",
      "One night in a luxury tented camp in the Agafay desert (private en-suite tent)",
      "Licensed guide for the 3-hour Marrakech medina walking tour",
      "Lunch on Day 02 at a partner riad",
      "Lunch on Day 03 en route to Agafay",
      "Dinner on Day 03 at the camp (set menu, three courses)",
      "Camel ride at sunset (or substitute activity)",
      "24/7 WhatsApp support from the Marrakech Story team",
    ],
    excluded: [
      "International flights",
      "Marrakech dinners (Day 01 and Day 02)",
      "Hammam & spa (recommended add-on)",
      "Quad bikes / buggies in Agafay",
      "Alcohol at the camp (BYO is permitted)",
      "Travel insurance",
      "Tips",
    ],
  },

  // ===== 5D4N — The Atlas & Sahara Sampler =====
  {
    slug: "atlas-sahara-sampler", chapter: "03",
    title: "The Atlas & Sahara Sampler",
    duration: "5D4N", days: 5, nights: 4,
    route: "Marrakech → Aït Ben Haddou → Dades → Merzouga → Marrakech",
    priceFromEUR: 990,
    img: "assets/photos/lodge-atlas-3-1-scaled.jpg.webp",
    badge: "MOST LOVED",
    themeTags: ["Atlas pass", "Sahara dunes", "UNESCO"],
    teaser: "Marrakech, the High Atlas pass, one night in the true Sahara at Merzouga.",
    overview: "The shortest route to the real Sahara. We cross the Tizi n'Tichka pass, stop at the UNESCO village of Aït Ben Haddou, sleep in the Dades Valley, then push into Merzouga for a night in the orange Erg Chebbi dunes. You leave the city for the dunes and come back changed.",
    idealFor: "First-timers who want the dunes",
    highlights: ["Tizi n'Tichka pass at 2,260 m", "Aït Ben Haddou (UNESCO)", "Dades & Todra gorges", "Camel caravan into Erg Chebbi", "Sunrise from the dunes", "Luxury tented camp"],
    itinerary: [
      { day: 1, route: "Arrival in Marrakech", text: "Private airport pickup. Transfer to riad. Mint tea, orientation. Optional rooftop sunset. Dinner walking distance from the riad." },
      { day: 2, route: "Marrakech → Dades Valley", text: "Early breakfast. Climb the High Atlas via Tizi n'Tichka with photo stops. Coffee at a roadside Berber café. Guided walk through Aït Ben Haddou (UNESCO). Lunch overlooking the ksar. Continue via Ouarzazate. Arrival at a kasbah hotel in Dades. Dinner, early night." },
      { day: 3, route: "Dades → Merzouga", text: "Drive through the Dades Gorges. 30-minute walk in Todra Gorge between 300m cliffs. Lunch in Tinghir. Arrival in Merzouga at the edge of Erg Chebbi. Camel caravan into the dunes (1h) — sunset arrival at the luxury camp. Welcome tea and dates. Dinner around the fire with Berber music." },
      { day: 4, route: "Sahara sunrise & the return", text: "Wake-up call with coffee on your terrace at 06:00. Walk to the top of the nearest dune for sunrise. Camp breakfast. Return camel or 4×4 to Merzouga. Drive back to Marrakech via the direct route. Lunch en route. Arrival at the riad. Light dinner suggested in the medina." },
      { day: 5, route: "Marrakech morning & departure", text: "Breakfast. Free morning — souks, Majorelle or pool. Light lunch suggested. Private transfer to RAK three hours before flight." },
    ],
    included: [
      "All private transfers and a private vehicle with English-speaking driver for the full route",
      "Three nights in boutique riads / hotel kasbahs with breakfast",
      "One night in a luxury tented camp at Erg Chebbi (private en-suite tent)",
      "Guided 1-hour walking tour of Aït Ben Haddou (UNESCO)",
      "Camel caravan into the desert at sunset (or 4×4 alternative)",
      "Dinner on Day 02 at the Dades hotel",
      "Dinner on Day 03 at the desert camp",
      "Lunch stops on Day 02, 03 and 04 (fixed-menu basis)",
      "24/7 WhatsApp support",
    ],
    excluded: [
      "International flights",
      "Marrakech dinners (Day 01 and Day 04)",
      "Drinks not included in set menus",
      "Hammam, spa, optional excursions",
      "Travel insurance",
      "Tips",
    ],
  },

  // ===== 7D6N — The Sahara Signature =====
  {
    slug: "sahara-signature", chapter: "04",
    title: "The Sahara Signature",
    duration: "7D6N", days: 7, nights: 6,
    route: "Marrakech → Skoura → Merzouga → Marrakech",
    priceFromEUR: 1350,
    img: "assets/photos/marrakech-desert.jpg",
    badge: "MOST BOOKED",
    themeTags: ["Sahara", "Slow travel", "Palm grove"],
    teaser: "Our most-requested route. Marrakech, the south, the dunes, the slow return.",
    overview: "The Sahara Sampler's big sister — the same southern route, but with the breathing room it deserves. Two nights in Marrakech, a slower descent through the Atlas with an overnight in Skoura's palm grove, two nights in the desert instead of one, and a final Marrakech evening to land softly before flying home.",
    idealFor: "Couples, families, slow-travel lovers",
    highlights: ["Two nights in the Sahara, not one", "Skoura palm-grove kasbah", "Guided Marrakech medina walk", "Aït Ben Haddou (UNESCO)", "Berber family visit", "A full free day in the dunes"],
    itinerary: [
      { day: 1, route: "Arrival in Marrakech", text: "Private airport pickup. Transfer to riad. Mint tea. Rooftop dinner suggestion." },
      { day: 2, route: "Marrakech, guided", text: "Guided medina tour (3h): souks, palaces, madrasa. Lunch at a partner riad. Free afternoon — hammam at 17:00 suggested. Dinner — Nomad rooftop recommended." },
      { day: 3, route: "Atlas pass to Skoura palm grove", text: "Cross Tizi n'Tichka with photo stops. Aït Ben Haddou guided walk. Lunch at a ksar restaurant. Continue via Ouarzazate to Skoura. Arrival at an authentic kasbah in the palm grove. Dinner at the kasbah." },
      { day: 4, route: "Skoura → Merzouga", text: "Departure via the Valley of Roses. Dades Gorges photo stops. Todra Gorge walk. Lunch in Tinghir. Arrival Merzouga. Camel caravan into Erg Chebbi at sunset. Welcome at the luxury camp. Dinner around the fire with Berber music." },
      { day: 5, route: "A full day in the dunes", text: "The day we built this itinerary around. No driving. Sunrise on the dunes. Slow camp breakfast. Optional Berber family visit (1.5h, with tea). Lunch at the camp. Free afternoon — sandboarding, reading, nap, dune walks. Optional 4×4 excursion to the black desert / fossils. Sundowner. Final desert dinner." },
      { day: 6, route: "Return to Marrakech", text: "Sunrise. Breakfast. Camel or 4×4 back to Merzouga. Drive back to Marrakech. Lunch en route. Arrival at your riad. Farewell dinner in the medina (we book a special table)." },
      { day: 7, route: "Departure", text: "Breakfast. Free morning for shopping or pool. Private transfer to RAK three hours before flight." },
    ],
    included: [
      "All private transfers and a dedicated private vehicle with English-speaking driver for the full route",
      "Three nights in boutique riads, two in a kasbah / hotel, two in a luxury Sahara camp — all breakfasts",
      "Guided 3-hour Marrakech medina walking tour",
      "Guided 1-hour visit to Aït Ben Haddou (UNESCO)",
      "Camel caravan at sunset into the Sahara (or 4×4 alternative)",
      "Six lunches and six dinners across the route (set menus where applicable)",
      "Optional Berber family visit at no extra cost",
      "Sandboards available at the camp",
      "24/7 WhatsApp support throughout",
    ],
    excluded: [
      "International flights",
      "Drinks outside set menus",
      "Hammam, spa treatments",
      "4×4 excursion in the dunes (optional)",
      "Quad / buggy add-ons",
      "Travel insurance",
      "Tips for driver, guide, camp staff",
    ],
  },

  // ===== 10D9N — The Imperial Circuit =====
  {
    slug: "imperial-circuit", chapter: "05",
    title: "The Imperial Circuit",
    duration: "10D9N", days: 10, nights: 9,
    route: "Tangier → Chefchaouen → Fez → Sahara → Marrakech",
    priceFromEUR: 2150,
    img: "assets/photos/about-us-hq-31-scaled.jpg.webp",
    themeTags: ["Imperial cities", "Sahara", "Slow travel"],
    teaser: "North and south joined. Tangier, Chefchaouen, Fez, the Sahara, Marrakech.",
    overview: "A circuit, not a loop. You land in the north, drift through Chefchaouen's blue alleys, give Fez two full days, descend to the Sahara, then end where most people begin — Marrakech. The country unfolds at the right pace, and you fly out from the south knowing you actually saw Morocco.",
    idealFor: "Travellers who want the whole country",
    highlights: ["The blue medina of Chefchaouen", "Volubilis Roman ruins", "Full-day specialist Fez tour", "Cedar forests of Ifrane + Barbary macaques", "Camel caravan into Erg Chebbi", "Aït Ben Haddou + Atlas pass", "Marrakech medina day"],
    itinerary: [
      { day: 1, route: "Arrival Tangier · north to Chefchaouen", text: "Private airport pickup at Tangier (TNG). Transfer (~2.5h) to Chefchaouen via the Rif. Check-in at a boutique hotel. Walk to the Spanish Mosque viewpoint for sunset over the blue town. Dinner at Casa Aladdin or Beldi Bab Ssour." },
      { day: 2, route: "Chefchaouen, slowly", text: "Guided walk through the blue medina (2.5h): the kasbah, Plaza Uta el-Hammam, the dyers' alleys. Lunch at a hidden riad. Free afternoon — optional walk to Ras El-Maa waterfall. Free evening." },
      { day: 3, route: "Chefchaouen → Fez", text: "Departure (~4h drive, with stops). Lunch at Volubilis (Roman ruins) with a brief guided visit (1h). Arrival in Fez. Check-in at a riad in the medina. Rooftop drink as the city calls the evening prayer. Dinner at the riad." },
      { day: 4, route: "Fez, in depth", text: "Full-day guided tour with a specialist Fez guide: tanneries, Karaouine, Al-Attarine and Bou Inania madrasas, artisan quarters. Lunch at a working riad. Free afternoon — hammam suggested. Dinner — pigeon pastilla recommended." },
      { day: 5, route: "Fez → Merzouga via the Middle Atlas", text: "Cross the cedar forests of Ifrane — stop for the Barbary macaques. Lunch in Midelt. Continue through the Ziz Valley — date palms, ksar villages. Arrival Merzouga. Camel caravan into Erg Chebbi at sunset. Dinner at the luxury camp with Berber music." },
      { day: 6, route: "The Sahara day", text: "Sunrise from the dunes. Berber family visit in the morning. Free afternoon — sandboarding, dune walks, rest. Sundowner on a high dune. Dinner around the fire." },
      { day: 7, route: "Merzouga → Dades Valley", text: "Camel or 4×4 out of the dunes. Breakfast. Drive to Todra Gorge. Walk the Todra cliffs (30 min). Lunch nearby. Arrival in the Dades Valley. Check-in at a kasbah hotel. Dinner." },
      { day: 8, route: "Dades → Marrakech via Aït Ben Haddou", text: "Aït Ben Haddou guided walk. Lunch. Tizi n'Tichka pass — Atlas photo stops. Arrival at your Marrakech riad. Dinner in the medina." },
      { day: 9, route: "Marrakech", text: "Guided medina walking tour (3h). Lunch at a partner riad. Free afternoon — hammam at 17:00 suggested. Farewell dinner at a special table booked for you." },
      { day: 10, route: "Departure", text: "Breakfast, free morning. Private transfer to RAK three hours before flight." },
    ],
    included: [
      "Private airport pickup in Tangier and drop-off in Marrakech",
      "Private vehicle with English-speaking driver for the entire route (regional drivers rotate for safety)",
      "Two nights in Chefchaouen, two in Fez, two in the Sahara, one in Dades, two in Marrakech — all breakfasts",
      "Guided tours: Chefchaouen (half-day), Volubilis (1h), Fez (full day with specialist), Aït Ben Haddou (1h), Marrakech medina (3h)",
      "Camel caravan into the Sahara at sunset (or 4×4 alternative)",
      "Berber family visit in Merzouga",
      "Lunches and dinners as listed (most days)",
      "24/7 WhatsApp support",
      "Pre-departure briefing pack: weather, packing, currency, etiquette",
    ],
    excluded: [
      "International flights (open-jaw: TNG in, RAK out — we help with ticketing)",
      "Drinks outside set menus, alcohol",
      "Hammam, spa, optional excursions",
      "Travel insurance",
      "Tips",
      "Visa fees if applicable",
    ],
  },

  // ===== 14D13N — The Grand Morocco =====
  {
    slug: "grand-morocco", chapter: "06",
    title: "The Grand Morocco",
    duration: "14D13N", days: 14, nights: 13,
    route: "Casablanca → Rabat → Chefchaouen → Fez → Sahara → Skoura → Marrakech",
    priceFromEUR: 3290,
    img: "assets/photos/cheval-essaouira.jpg",
    badge: "GRAND TOUR",
    themeTags: ["Coast", "Imperial", "Sahara", "Atlas", "Grand tour"],
    teaser: "Two weeks. The full coast-to-Sahara story.",
    overview: "The journey we send people on when they tell us \"we want to see everything, but properly\". Atlantic coast, blue mountains, imperial cities, the Sahara, the palm groves, the High Atlas, and the red city to close. Two weeks is the right length for Morocco — long enough to slow down, short enough to feel like a journey rather than a relocation.",
    idealFor: "Honeymooners, slow travellers, families on a real holiday",
    highlights: ["Rabat kasbah + Chellah", "Chefchaouen blue medina", "Volubilis Roman ruins", "Full-day Fez deep dive", "Cedar forests + Barbary macaques", "Two nights in the Sahara", "Skoura palm-grove kasbah", "Aït Ben Haddou + Tichka pass", "Atlas Berber-village day", "Optional Essaouira day on Day 13"],
    itinerary: [
      { day: 1, route: "Arrival Casablanca → Rabat", text: "Private pickup at CMN. Transfer to Rabat (~1h). Check-in at a boutique hotel in the kasbah. Walk in the Kasbah des Oudayas as the light turns. Light dinner." },
      { day: 2, route: "Rabat, light and slow", text: "Guided walk: Hassan Tower, Chellah Roman necropolis, the kasbah. Lunch overlooking the Bouregreg. Free afternoon — optional Mohamed VI Museum of Modern Art." },
      { day: 3, route: "Rabat → Chefchaouen", text: "Departure (~4h with a coffee stop). Arrival Chefchaouen. Check-in. Spanish Mosque sunset. Dinner in the medina." },
      { day: 4, route: "Chefchaouen", text: "Guided medina walk (2.5h). Free afternoon — Ras El-Maa waterfall or shopping." },
      { day: 5, route: "Chefchaouen → Fez via Volubilis", text: "Departure. Volubilis Roman ruins (guided 1h) + lunch nearby. Arrival Fez. Riad check-in. Dinner at the riad." },
      { day: 6, route: "Fez deep dive", text: "Full-day specialist guided tour: tanneries, Karaouine, madrasas, artisan quarters. Lunch inside the medina. Free afternoon — hammam suggested." },
      { day: 7, route: "Fez → Merzouga via the Middle Atlas", text: "Cedar forests of Ifrane. Barbary macaques stop. Lunch in Midelt. Continue via Ziz Valley. Camel caravan into the Erg Chebbi. Camp dinner with music." },
      { day: 8, route: "The Sahara day", text: "Sunrise on the dunes. Morning Berber family visit. Free afternoon — sandboarding, walks, rest. Sundowner." },
      { day: 9, route: "Merzouga → Skoura palm grove", text: "Out of the dunes. Todra Gorge walk. Lunch in Tinghir. Drive via Dades and the Valley of Roses. Arrival at a Skoura kasbah hotel — palm grove, pool, silence. Dinner at the kasbah." },
      { day: 10, route: "Skoura → Aït Ben Haddou → Marrakech", text: "Aït Ben Haddou guided walk. Lunch. Tizi n'Tichka pass — Atlas photo stops. Arrival Marrakech riad." },
      { day: 11, route: "Marrakech, guided", text: "Guided medina walking tour (3h). Lunch at a partner riad. Free afternoon — hammam at 17:00 suggested. Dinner." },
      { day: 12, route: "Atlas day trip — Ourika or Imlil", text: "Drive into the High Atlas (~1.5h). Guided walk in a Berber village. Lunch in a Berber home (set menu). Return to Marrakech. Rest at the riad. Dinner." },
      { day: 13, route: "Marrakech free day or Essaouira", text: "Option A — free day in Marrakech (Majorelle, shopping, pool). Option B — day trip to Essaouira (~2.5h each way): Atlantic ramparts, fishing port, fresh seafood lunch. Farewell dinner at a special table." },
      { day: 14, route: "Departure", text: "Breakfast, free morning. Private transfer to RAK three hours before flight." },
    ],
    included: [
      "Private airport pickup in Casablanca and drop-off in Marrakech",
      "Private vehicle with English-speaking driver throughout (regional drivers may rotate)",
      "13 nights in hand-picked accommodation: boutique hotels, riads, a kasbah, and luxury Sahara camp — all breakfasts",
      "Guided tours in Rabat, Chefchaouen, Volubilis, Fez (full day), Aït Ben Haddou, Marrakech medina, and a Berber village in the Atlas",
      "Camel caravan into the Sahara, Berber family visit, sandboards",
      "Lunches and dinners as listed (the majority of meals)",
      "Atlas day trip on Day 12 with home-cooked Berber lunch",
      "One discretionary day on Day 13 (Marrakech or Essaouira — your choice)",
      "24/7 WhatsApp support",
      "Pre-departure briefing pack and printed itinerary booklet on arrival",
    ],
    excluded: [
      "International flights (open-jaw: CMN in / RAK out, or reversible)",
      "Drinks outside set menus, alcohol",
      "Hammam and spa treatments",
      "Travel insurance",
      "Tips for drivers, guides, camp staff",
      "Visa fees if applicable",
      "Optional add-ons: hot-air balloon over Marrakech, private cooking class, paragliding, quad / buggy in Agafay",
    ],
  },
];

// ── DETAIL MODAL — now with T&Cs section ────────────────────────
function ItinModal({ trip, onClose, lang, fmt }) {
  useEffectIt(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;
  const terms = STANDARD_TERMS[lang === 'no' ? 'no' : lang === 'fr' ? 'fr' : 'en'];
  return (
    <div className="itin-modal-backdrop" onClick={onClose}>
      <div className="itin-modal" onClick={e => e.stopPropagation()}>
        <button className="itin-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="itin-modal-hero" style={{ backgroundImage: `url(${trip.img})` }}>
          <div className="itin-modal-hero-overlay">
            <div className="itin-modal-eyebrow">— CHAPTER {trip.chapter} · {trip.duration}</div>
            <h2 className="itin-modal-title">{trip.title}</h2>
            <div className="itin-modal-route">{trip.route}</div>
          </div>
        </div>
        <div className="itin-modal-body">
          <p className="itin-modal-overview">{trip.overview}</p>

          {trip.partner && (
            <div className="itin-partner-strip">
              <div className="itin-partner-head">
                <div>
                  <div className="itin-partner-eyebrow">{tx('In partnership with', 'I samarbeid med', 'En partenariat avec')}</div>
                  <div className="itin-partner-name">{trip.partner.name}</div>
                  <div className="itin-partner-tag">{trip.partner.tagline} · {trip.partner.location}</div>
                </div>
                <a className="itin-partner-link" href={trip.partner.website} target="_blank" rel="noopener">
                  {tx('Visit site →', 'Besøk siden →', 'Voir le site →')}
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

          {trip.formulas && trip.formulas.length > 0 && (
            <div className="itin-formulas">
              <h3 className="itin-modal-h3">{tx('Choose your formula', 'Velg din formel', 'Choisissez votre formule')}</h3>
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
                        ? <div className="itin-formula-price">{tx('From', 'Fra', 'À partir de')} {fmt ? fmt(fromEUR) : `€${fromEUR}`} <span>/ {tx('week / person', 'uke / person', 'semaine / pers.')}</span></div>
                        : <div className="itin-formula-price">{tx('Custom quote', 'Skreddersydd', 'Sur mesure')}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {trip.extras && trip.extras.length > 0 && (
            <div className="itin-extras">
              <h3 className="itin-modal-h3">{tx('Optional extras', 'Valgfrie tillegg', 'Extras optionnels')}</h3>
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

          <div className="itin-modal-grid">
            <div>
              <h3 className="itin-modal-h3">{tx('Highlights', 'Høydepunkter', 'Temps forts')}</h3>
              <ul className="itin-modal-ul">
                {trip.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="itin-modal-h3">{tx('Theme', 'Tema', 'Thèmes')}</h3>
              <div className="itin-modal-tags">
                {trip.themeTags.map((t, i) => <span key={i} className="itin-modal-tag">{t}</span>)}
              </div>
              <div className="itin-modal-price">
                <span className="itin-modal-price-label">{tx('Price', 'Pris', 'Prix')}</span>
                <span className="itin-modal-price-value" style={{ fontSize: 18, fontStyle: 'italic' }}>
                  {tx('On request', 'På forespørsel', 'Sur demande')}
                </span>
                <span className="itin-modal-price-sub">{tx('we tailor every quote', 'vi skreddersyr hvert tilbud', 'devis personnalisé')}</span>
              </div>
            </div>
          </div>

          <h3 className="itin-modal-h3">{tx('Day by day', 'Dag for dag', 'Jour par jour')}</h3>
          <ol className="itin-modal-days">
            {trip.itinerary.map((d, i) => (
              <li key={i} className="itin-modal-day">
                <div className="itin-modal-day-num">{tx('Day', 'Dag', 'Jour')} {d.day}</div>
                <div className="itin-modal-day-route">{d.route}</div>
                <div className="itin-modal-day-text">{d.text}</div>
              </li>
            ))}
          </ol>

          <div className="itin-modal-grid">
            {trip.included && trip.included.length > 0 && (
              <div>
                <h3 className="itin-modal-h3">{tx('Included', 'Inkludert', 'Inclus')}</h3>
                <ul className="itin-modal-ul itin-included">
                  {trip.included.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {trip.excluded && trip.excluded.length > 0 && (
              <div>
                <h3 className="itin-modal-h3">{tx('Not included', 'Ikke inkludert', 'Non inclus')}</h3>
                <ul className="itin-modal-ul itin-excluded">
                  {trip.excluded.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Rules & conditions */}
          <div className="itin-modal-terms">
            <h3 className="itin-modal-h3">{tx('Rules & conditions', 'Regler og vilkår', 'Règles et conditions')}</h3>
            <ul className="itin-modal-terms-list">
              {terms.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <div className="itin-modal-cta-row">
            <button className="btn btn-primary" onClick={() => {
              onClose();
              // Tiny delay so the close transition finishes before opening tweaker
              setTimeout(() => {
                if (window.MS_TweakItineraryModal) {
                  // Mount a one-off React root for the tweak modal at body
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
              ✏️ {tx('Tweak this trip', 'Tilpass denne reisen', 'Personnaliser ce voyage')}
            </button>
            <a className="btn btn-outline" href="#plan"
               onClick={() => {
                 window.MS_BookingContext = {
                   mode: 'asis',
                   trip,
                   duration: trip.days || trip.nights + 1,
                   title: trip.title,
                   priceEur: trip.priceEur,
                   tag: trip.tag,
                 };
                 window.dispatchEvent(new CustomEvent('ms:booking-context'));
                 onClose();
                 setTimeout(() => {
                   document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' });
                 }, 80);
               }}>
              {tx('Take as-is →', 'Ta som den er →', 'Prendre tel quel →')}
            </a>
            <a className="btn btn-outline" href="https://wa.me/212698164331" target="_blank" rel="noopener">
              {tx('WhatsApp us', 'WhatsApp oss', 'WhatsApp')}
            </a>
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
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;
  const [filter, setFilter] = useStateIt('3D2N');
  const [openTrip, setOpenTrip] = useStateIt(null);
  const [visibleCount, setVisibleCount] = useStateIt(4);
  // +40% markup applied to every itinerary price
  const adjustedPrice = (eur) => price(eur * 1.4);

  useEffectIt(() => { setVisibleCount(4); }, [filter]);

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

            <div className={`trip-slider ${filter !== 'Themes' ? 'trip-slider-feature' : ''}`}>
              {filter === 'Themes' && (
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
                          {t.badge || tx('Best pick', 'Best i klassen', 'Notre coup de cœur')}
                        </span>
                        <span className="trip-feature-duration">{t.duration}</span>
                      </div>
                      <div className="trip-feature-body">
                        <div className="trip-feature-eyebrow">
                          {tx('Chapter', 'Kapittel', 'Chapitre')} {t.chapter} · {t.duration}
                        </div>
                        <h3 className="trip-feature-title">{t.title}</h3>
                        <p className="trip-feature-teaser">{t.teaser}</p>
                        {t.idealFor && (
                          <div className="trip-feature-ideal">
                            <span className="trip-feature-ideal-label">{tx('Ideal for', 'Perfekt for', 'Idéal pour')}</span>
                            <span>{t.idealFor}</span>
                          </div>
                        )}
                        {Array.isArray(t.highlights) && t.highlights.length > 0 && (
                          <ul className="trip-feature-highlights">
                            {t.highlights.slice(0, 5).map((h, hi) => (
                              <li key={hi}>{h}</li>
                            ))}
                          </ul>
                        )}
                        <div className="trip-feature-foot">
                          <div>
                            <span className="trip-feature-from">{tx('From', 'Fra', 'À partir de')}</span>
                            <span className="trip-feature-price">{priceTxt || '—'}</span>
                            <span className="trip-feature-per">{tx('/ person', '/ person', '/ personne')}</span>
                          </div>
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
                      {t.badge && <span className="reiseplan-badge">{t.badge}</span>}
                    </div>
                    <div className="cat-body trip-card-body">
                      <h3 className="cat-title trip-card-title">{t.title}</h3>
                      <span className="cat-area trip-card-route"><Iit.Pin s={12} /> {t.route}</span>
                      <p className="cat-desc trip-card-desc">{t.teaser}</p>
                      {Array.isArray(t.themeTags) && t.themeTags.length > 0 && (
                        <div className="trip-card-tags">
                          {t.themeTags.slice(0, 3).map((tag, ti) => (
                            <span key={ti} className="trip-card-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="cat-foot trip-card-foot">
                        {priceTxt && (
                          <span className="trip-card-price">
                            <span className="trip-card-price-from">{tx('From', 'Fra', 'À partir de')}</span>
                            <span className="trip-card-price-amount">{priceTxt}</span>
                          </span>
                        )}
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
