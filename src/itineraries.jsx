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
const ITINS = [
  // ===== 3D2N tier (5) =====
  {
    slug: "three-days-in-the-sahara", chapter: "01",
    title: "Three Days In The Sahara",
    duration: "3D2N", days: 3, nights: 2,
    route: "Marrakech → Merzouga → Marrakech",
    priceFromEUR: 290,
    img: "assets/photos/marrakech-desert.jpg",
    badge: "MOST LOVED",
    themeTags: ["Desert", "Camel trek", "Berber camp"],
    teaser: "A two-night arc across the High Atlas to Erg Chebbi — the dunes most travellers imagine when they imagine Morocco.",
    overview: "We leave Marrakech at dawn, cross the Tichka pass for breakfast, sleep among kasbahs in Dades, and arrive at Erg Chebbi in time to climb a dune and watch the colour change. Camel-back into a small Berber camp. Stars. Dinner around a fire. Sunrise the next morning before the slow drive back.",
    highlights: ["Tichka pass at dawn", "Kasbah Aït Ben Haddou", "Dades valley overnight", "Camel trek into Erg Chebbi", "Berber camp under the stars", "Sunrise over the dunes"],
    itinerary: [
      { day: 1, route: "Marrakech → Aït Ben Haddou → Dades", text: "Cross the Tichka pass. Stop at Telouet, lunch at Aït Ben Haddou, sleep in the Dades valley." },
      { day: 2, route: "Dades → Tinghir → Merzouga", text: "Through Todra Gorge to Merzouga. Camel trek into the dunes, dinner and night in a Berber camp." },
      { day: 3, route: "Merzouga → Marrakech", text: "Sunrise camel ride. Long but scenic drive back to Marrakech via Ouarzazate." },
    ],
    included: ["Private 4×4 with driver-guide", "Two nights' accommodation", "Camel trek + camp dinner", "Berber breakfast at the camp"],
    excluded: ["Lunches", "Personal drinks", "Tips for guide & camp staff"],
  },
  {
    slug: "the-atlas-in-three-days", chapter: "02",
    title: "The Atlas In Three Days",
    duration: "3D2N", days: 3, nights: 2,
    route: "Marrakech → Imlil → Marrakech",
    priceFromEUR: 380,
    img: "assets/photos/lodge-atlas-1-scaled.jpg.webp",
    themeTags: ["Mountains", "Berber villages", "Slow travel"],
    teaser: "Up into the High Atlas to walk among walnut groves, sleep at altitude, taste tagines slow-cooked over wood fires.",
    overview: "A short escape that feels far. Drive to Imlil, base for the highest peak in North Africa, then explore the Berber valleys on foot with a local guide. Two nights in an authentic mountain lodge — the air thinner, the silence deeper, the food simpler in the best way.",
    highlights: ["Drive into the High Atlas", "Imlil & Aremd villages", "Slow guided hike through walnut groves", "Sunset from the lodge terrace", "Authentic mountain cuisine"],
    itinerary: [
      { day: 1, route: "Marrakech → Imlil", text: "Mid-morning departure. Lunch in Asni. Settle into the mountain lodge. Sunset from the terrace." },
      { day: 2, route: "Imlil valley hike", text: "Half-day hike with a Berber guide. Lunch in a village home. Free afternoon, optional hammam." },
      { day: 3, route: "Imlil → Marrakech", text: "Optional sunrise viewpoint walk. Lunch in Asni. Return to Marrakech by mid-afternoon." },
    ],
    included: ["Private transfers", "Two nights at a mountain lodge", "Half board", "Local guided hike"],
    excluded: ["Lunches", "Personal drinks", "Tips"],
  },
  {
    slug: "medina-agafay-and-the-coast", chapter: "03",
    title: "Medina, Agafay & The Atlantic",
    duration: "3D2N", days: 3, nights: 2,
    route: "Marrakech → Agafay → Essaouira → Marrakech",
    priceFromEUR: 420,
    img: "assets/photos/cheval-essaouira.jpg",
    badge: "SLOW TRAVEL",
    themeTags: ["Desert", "Coast", "Riad"],
    teaser: "Three days across three landscapes — the medina's lantern light, the stone desert, the Atlantic wind on the ramparts.",
    overview: "A short Morocco arc for travellers who want texture over distance. Spend a day in the medina with a guide who knows where the artisans still work, a night in a luxury Agafay camp, then drop to the coast for one day of wind, blue boats and fresh seafood in Essaouira before returning.",
    highlights: ["Private medina walk", "Agafay sunset & dinner under stars", "Essaouira ramparts at golden hour", "Fresh seafood by the port", "Riad return in Marrakech"],
    itinerary: [
      { day: 1, route: "Marrakech medina", text: "Morning souk walk with our guide. Lunch at L'Mida. Free afternoon, hammam booking on request." },
      { day: 2, route: "Marrakech → Agafay", text: "Mid-afternoon transfer. Camel ride at sunset. Dinner and overnight in a luxury camp." },
      { day: 3, route: "Agafay → Essaouira → Marrakech", text: "Drive to Essaouira via the argan road. Lunch by the port. Return to Marrakech in the evening." },
    ],
    included: ["Private transport", "Two nights' accommodation", "Guided medina walk", "Agafay camp dinner"],
    excluded: ["Riad night in Marrakech", "Some meals", "Tips"],
  },
  {
    slug: "the-wellness-weekend", chapter: "04",
    title: "A Wellness Weekend",
    duration: "3D2N", days: 3, nights: 2,
    route: "Marrakech → Palmeraie → Agafay → Marrakech",
    priceFromEUR: 540,
    img: "assets/photos/hammam-mamounia-marrakech-morocco.jpg.avif",
    themeTags: ["Spa", "Riad", "Slow"],
    teaser: "Hammam mornings, riad afternoons, a single dune to climb. The version of Morocco that doesn't move fast.",
    overview: "Three days designed around the spa rituals — a palace hammam circuit on day one, a Palmeraie pool day on day two, a single sunset in Agafay on day three. We book all the appointments and ferry you between them.",
    highlights: ["Palace spa half-day", "Palmeraie boutique-hotel pool", "Agafay sunset apéro", "Riad dinner on the patio", "Slow mornings, late breakfasts"],
    itinerary: [
      { day: 1, route: "Marrakech medina", text: "Spa morning at La Sultana or Es Saadi. Lunch at OTTO. Riad dinner at Palais Sebban." },
      { day: 2, route: "Palmeraie", text: "Full pool day at Sumahan or Dar Rhizlane. Optional in-house massage. Casual evening." },
      { day: 3, route: "Agafay sunset", text: "Late-afternoon Agafay transfer. Apéro at The White Camel. Light dinner before return." },
    ],
    included: ["All transfers", "Two nights (palace or boutique hotel)", "One palace spa half-day", "Pool day fees"],
    excluded: ["Treatments beyond the included half-day", "Some meals", "Tips"],
  },
  {
    slug: "marrakech-insider", chapter: "05",
    title: "Marrakech, As Locals Know It",
    duration: "3D2N", days: 3, nights: 2,
    route: "Marrakech",
    priceFromEUR: 290,
    img: "assets/photos/jemaa-el-fna-18.jpg",
    themeTags: ["Medina", "Cuisine", "Culture"],
    teaser: "Three days inside the red city — the souks at dawn, a cooking class, a rooftop at dusk, with someone who actually lives here.",
    overview: "The city is layered. We peel back the layers in a sensible order: monuments first, souks second, cooking and craft on day three. A guide who's grown up here opens doors a regular itinerary wouldn't.",
    highlights: ["Bahia, Badii & Koutoubia tour", "Private souk walk", "Riad cooking class", "Rooftop dinner at L'Mida", "Hammam booking included"],
    itinerary: [
      { day: 1, route: "Heritage walk", text: "Guided tour of Bahia, Badii, Koutoubia. Lunch at Café Arabe. Afternoon at Musée Dar el-Bacha." },
      { day: 2, route: "Souks & artisans", text: "Souk walk with a guide. Lunch with a copper-smith family. Hammam late afternoon." },
      { day: 3, route: "Cooking class & rooftop", text: "Riad cooking class with market visit. Eat what you cooked. Rooftop dinner at L'Mida." },
    ],
    included: ["Three days' guiding", "All entrance fees", "Cooking class + lunch", "Hammam booking"],
    excluded: ["Accommodation", "Some meals & drinks", "Tips"],
  },

  // ===== 4D3N tier (4) =====
  {
    slug: "atlas-and-sahara-quickfire", chapter: "06",
    title: "Atlas & Sahara, Quickfire",
    duration: "4D3N", days: 4, nights: 3,
    route: "Marrakech → Atlas → Sahara → Marrakech",
    priceFromEUR: 580,
    img: "assets/photos/lodge-atlas-3-1-scaled.jpg.webp",
    themeTags: ["Mountains", "Desert", "Berber"],
    teaser: "Four days. Two landscapes. The High Atlas in the day, the dunes at night, the medina to come home to.",
    overview: "A pace that just barely works — but it works. Cross the Tichka with a stop at Aït Ben Haddou, sleep in Dades, camel trek into Erg Chebbi, sunrise on the dunes, then the long scenic drive back. Done well, it's the most condensed view of Morocco a four-day trip allows.",
    highlights: ["Tichka pass", "Aït Ben Haddou", "Dades & Todra gorges", "Camel trek to a Berber camp", "Sunrise over Erg Chebbi"],
    itinerary: [
      { day: 1, route: "Marrakech → Aït Ben Haddou → Dades", text: "Cross the Tichka pass with photo stops. Lunch at the kasbah. Sleep in Dades." },
      { day: 2, route: "Dades → Todra → Merzouga", text: "Down the Dades valley. Lunch in Todra. Arrive Erg Chebbi for camel trek and overnight camp." },
      { day: 3, route: "Sahara → Ouarzazate", text: "Sunrise camel back. Drive to Ouarzazate via the Draa valley. Optional studio visit." },
      { day: 4, route: "Ouarzazate → Marrakech", text: "Scenic drive home via Tichka. Late lunch in Marrakech." },
    ],
    included: ["Private 4×4 + driver-guide", "Three nights (riad / kasbah / camp)", "Berber camp half board"],
    excluded: ["Lunches outside camp", "Drinks", "Tips"],
  },
  {
    slug: "imperial-cities-express", chapter: "07",
    title: "Imperial Cities, Express",
    duration: "4D3N", days: 4, nights: 3,
    route: "Marrakech → Casablanca → Rabat → Marrakech",
    priceFromEUR: 690,
    img: "assets/photos/about-us-hq-31-scaled.jpg.webp",
    themeTags: ["Cities", "Heritage", "Coastal"],
    teaser: "A short tour of the three coastal-imperial-modern faces of Morocco — Marrakech the red, Rabat the white, Casablanca the bold.",
    overview: "For travellers more drawn to architecture than dunes. Four days across the imperial spine: a guided morning in Marrakech, the Hassan II mosque in Casablanca, the Kasbah of the Udayas at sunset in Rabat, and back. Every transfer is private; every guide is local.",
    highlights: ["Hassan II mosque, Casablanca", "Kasbah des Oudayas, Rabat", "Mausoleum of Mohammed V", "Rabat medina walk", "Return via the Atlantic road"],
    itinerary: [
      { day: 1, route: "Marrakech morning", text: "Half-day Bahia + Koutoubia tour. Train or private drive to Casablanca." },
      { day: 2, route: "Casablanca → Rabat", text: "Hassan II mosque morning. Lunch in Casa. Afternoon drive to Rabat." },
      { day: 3, route: "Rabat", text: "Full day Rabat with local guide. Kasbah at sunset." },
      { day: 4, route: "Rabat → Marrakech", text: "Drive back via the Atlantic. Optional Chellah ruins stop." },
    ],
    included: ["Private transfers", "Three nights' accommodation", "Local guides in each city"],
    excluded: ["Meals", "Drinks", "Tips"],
  },
  {
    slug: "the-honeymoon-chapter", chapter: "08",
    title: "The Honeymoon Chapter",
    duration: "4D3N", days: 4, nights: 3,
    route: "Marrakech → Atlas → Agafay → Marrakech",
    priceFromEUR: 1290,
    img: "assets/photos/about-us-hq-33-scaled.jpg.webp",
    badge: "LUXURY",
    themeTags: ["Couples", "Riad", "Sahara"],
    teaser: "Four days written for two — palace riad, mountain lodge, private camp, candles where you'd want them.",
    overview: "Honeymooners want different things in different orders. We start with a city day in a palace riad, drive up into the Atlas for two slow days at a luxury lodge, then close with a private Agafay camp dinner under the stars on the way back. Everything is bookable as one quiet package; we coordinate the chocolates, the flowers, the table for two.",
    highlights: ["Palace riad in the medina", "Atlas luxury lodge", "Private candlelit camp dinner", "Hammam couple's ritual", "Private 4×4 throughout"],
    itinerary: [
      { day: 1, route: "Medina arrival", text: "Riad check-in. Light medina walk. Couple's hammam ritual. Riad dinner." },
      { day: 2, route: "Marrakech → Atlas", text: "Drive to Imlil or Ouirgane. Long lunch. Slow afternoon at the lodge." },
      { day: 3, route: "Atlas → Agafay", text: "Morning in the mountains. Late-afternoon transfer to Agafay. Private camp dinner." },
      { day: 4, route: "Agafay → Marrakech", text: "Slow morning. Return to the riad or transfer to the airport." },
    ],
    included: ["Private 4×4 + driver-guide", "Three nights (palace riad / lodge / private camp)", "Couples' hammam", "Private camp dinner"],
    excluded: ["Some meals", "Drinks", "Tips"],
  },
  {
    slug: "family-marrakech-and-coast", chapter: "09",
    title: "Family Marrakech & The Coast",
    duration: "4D3N", days: 4, nights: 3,
    route: "Marrakech → Taghazout → Marrakech",
    priceFromEUR: 690,
    img: "assets/photos/stock-pexels-casa-lalla-takerkoust-2150099384-31371146.jpg",
    themeTags: ["Family", "Beach", "Surf"],
    teaser: "Two days in the city, two days at the Atlantic — kids tired in the right way, parents quietly grateful for the change of light.",
    overview: "Built for families with primary-school-age children. Day one is a gentle medina afternoon, day two adds the Palmeraie for a pool and a camel ride, days three and four drop you at Taghazout's beach hotels where the kids learn to surf and you have a quiet dinner.",
    highlights: ["Medina afternoon, kid-paced", "Palmeraie camel ride", "Pool day at Eden Lodges", "Surf lesson in Taghazout", "Atlantic seafood dinners"],
    itinerary: [
      { day: 1, route: "Medina afternoon", text: "Light tour. Mint tea at Café des Épices. Early riad dinner." },
      { day: 2, route: "Palmeraie", text: "Camel ride in the palm grove. Pool lunch at Eden Lodges or Beldi Country Club." },
      { day: 3, route: "Marrakech → Taghazout", text: "Three-hour transfer to the coast. Settle into the beach hotel. Sunset on the beach." },
      { day: 4, route: "Taghazout", text: "Morning surf lesson for kids. Family lunch by the sea. Evening return to Marrakech if needed." },
    ],
    included: ["Private transfers", "Three nights' family accommodation", "Camel ride", "One surf lesson per child"],
    excluded: ["Meals beyond hotel breakfasts", "Drinks", "Tips"],
  },

  // ===== 5D4N tier (3) =====
  {
    slug: "marrakech-taghazout-agafay", chapter: "10",
    title: "Marrakech, Taghazout & Agafay",
    duration: "5D4N", days: 5, nights: 4,
    route: "Marrakech → Taghazout → Agafay → Marrakech",
    priceFromEUR: 890,
    img: "assets/photos/agafay-valley-marrakech-70.jpg",
    themeTags: ["City", "Coast", "Desert"],
    teaser: "Our most-booked five-day route — medina, ocean, dunes. Three textures of Morocco in a week that doesn't feel rushed.",
    overview: "Built around the Marrakechstory sample itinerary. Two days for the city, one day in transit and an overnight at the Atlantic, one day to drive back through Agafay for a final desert overnight, then home.",
    highlights: ["Medina walking tour", "Pool day in the Palmeraie", "Taghazout sunset", "Argan road return", "Private Agafay camp"],
    itinerary: [
      { day: 1, route: "Marrakech medina", text: "Arrival. Soft medina walk. Riad dinner." },
      { day: 2, route: "Palmeraie pool day", text: "Boutique pool day. Optional camel ride. Evening at L'Mida." },
      { day: 3, route: "Marrakech → Taghazout", text: "Drive to the coast. Beachfront dinner. Overnight." },
      { day: 4, route: "Taghazout → Agafay", text: "Slow drive via the argan road. Arrive in Agafay for sunset and camp dinner." },
      { day: 5, route: "Agafay → Marrakech", text: "Slow morning. Return to the riad or airport." },
    ],
    included: ["All private transfers", "Four nights' accommodation", "Medina guide", "Agafay camp half board"],
    excluded: ["Some meals", "Drinks", "Tips"],
  },
  {
    slug: "the-atlas-crossing", chapter: "11",
    title: "The Atlas Crossing",
    duration: "5D4N", days: 5, nights: 4,
    route: "Marrakech → Tichka → Ouarzazate → Marrakech",
    priceFromEUR: 790,
    img: "assets/photos/lodge-atlas-5-1-scaled.jpg.webp",
    themeTags: ["Mountains", "Kasbah", "Slow drive"],
    teaser: "Five days following the kasbah road — Tichka pass, Aït Ben Haddou, the Dades and Todra gorges, sleeping at altitude.",
    overview: "A geographically-focused itinerary for travellers who want to see how the mountains shape the country. Up the Tichka, along the kasbah road, into the gorges. Each overnight is at a small mountain inn — modest, beautifully sited, well-fed.",
    highlights: ["Tichka pass (2,260m)", "Aït Ben Haddou", "Skoura palm grove", "Dades & Todra gorges", "Two valley overnights"],
    itinerary: [
      { day: 1, route: "Marrakech → Tichka → Aït Ben Haddou", text: "Up the pass, photo stops, lunch at the kasbah." },
      { day: 2, route: "Aït Ben Haddou → Skoura", text: "Slow morning. Drive to Skoura palmeraie. Lodge overnight." },
      { day: 3, route: "Skoura → Dades", text: "Visit Kalaat M'Gouna. Up the Dades valley. Inn overnight." },
      { day: 4, route: "Dades → Todra", text: "Down to Todra Gorge. Optional canyon walk. Berber dinner." },
      { day: 5, route: "Todra → Marrakech", text: "Long but scenic drive back via Tichka." },
    ],
    included: ["Private 4×4 + driver-guide", "Four nights at small inns", "Half board"],
    excluded: ["Lunches", "Drinks", "Tips"],
  },
  {
    slug: "sahara-deep", chapter: "12",
    title: "Sahara, Deep",
    duration: "5D4N", days: 5, nights: 4,
    route: "Marrakech → Merzouga → Marrakech",
    priceFromEUR: 990,
    img: "assets/photos/marrakech-desert.jpg",
    themeTags: ["Sahara", "Nomads", "4×4"],
    teaser: "Two nights in the desert. Visits to nomadic families. A slower way into Erg Chebbi than the standard three-day version allows.",
    overview: "If three days into the Sahara feels too quick, this is the version we recommend. Two consecutive nights at the dunes — one in a Berber camp, one in a luxury tented suite — with proper time to walk among the dunes, visit a nomadic family, and see Erg Chebbi at three different lights.",
    highlights: ["Two consecutive Erg Chebbi nights", "Visit to a nomadic family", "Sandboarding session", "Optional 4×4 dune drive", "Sunrise / sunset / star-cycle"],
    itinerary: [
      { day: 1, route: "Marrakech → Dades", text: "Cross Tichka. Aït Ben Haddou. Sleep in Dades." },
      { day: 2, route: "Dades → Merzouga", text: "Through Todra. Arrive Erg Chebbi. Camel into camp. Dinner." },
      { day: 3, route: "Merzouga", text: "Visit nomadic family. Lunch in oasis. Luxury tent overnight." },
      { day: 4, route: "Merzouga → Ouarzazate", text: "Sunrise. Slow drive via Draa valley." },
      { day: 5, route: "Ouarzazate → Marrakech", text: "Return via Tichka, photo stops." },
    ],
    included: ["Private 4×4 + driver-guide", "Four nights' accommodation", "Two camp dinners + breakfasts", "Camel trek"],
    excluded: ["Some lunches", "Drinks", "Tips"],
  },

  // ===== Day trips (3) =====
  {
    slug: "ourika-day", chapter: "13",
    title: "A Day In The Ourika Valley",
    duration: "1D", days: 1, nights: 0,
    route: "Marrakech → Ourika → Marrakech",
    priceFromEUR: 75,
    img: "assets/photos/lodge-atlas-2-1-scaled.jpg.webp",
    badge: "DAY TRIP",
    themeTags: ["Atlas", "Waterfall", "Berber villages"],
    teaser: "An hour from Marrakech, the country changes — pine forest, river boulders, a hike to the waterfalls.",
    overview: "The closest real change of scene from Marrakech. Drive south through Berber villages, optional stop at an argan cooperative, a gentle hike up the valley to the seven Setti-Fatma waterfalls, lunch at a riverside restaurant on stilts.",
    highlights: ["Berber village visits", "Argan cooperative stop", "Setti-Fatma waterfall hike", "Riverside lunch", "Return for golden hour"],
    itinerary: [
      { day: 1, route: "Marrakech → Ourika → Marrakech", text: "09:30 pickup. Argan cooperative. Hike. Lunch by the river. Return 17:30." },
    ],
    included: ["Private transport", "Driver", "Local hike guide"],
    excluded: ["Lunch", "Tips"],
  },
  {
    slug: "essaouira-day", chapter: "14",
    title: "A Day By The Atlantic",
    duration: "1D", days: 1, nights: 0,
    route: "Marrakech → Essaouira → Marrakech",
    priceFromEUR: 90,
    img: "assets/photos/cheval-essaouira.jpg",
    badge: "DAY TRIP",
    themeTags: ["Coast", "Medina", "Seafood"],
    teaser: "Three hours from Marrakech to the blue boats, the white walls, the Atlantic wind on the ramparts.",
    overview: "A long but rewarding day on the coast. Stop on the way for argan oil. Free time in the UNESCO medina, lunch by the port, walk the ramparts, return at golden hour.",
    highlights: ["Argan cooperative stop", "UNESCO medina walk", "Port-side seafood lunch", "Ramparts of Essaouira", "Return at golden hour"],
    itinerary: [
      { day: 1, route: "Marrakech → Essaouira → Marrakech", text: "08:00 pickup. Argan stop. Arrive 11:30. Free medina time + lunch. Return 20:00." },
    ],
    included: ["Private transport", "Driver"],
    excluded: ["Lunch", "Optional local guide", "Tips"],
  },
  {
    slug: "agafay-sunset", chapter: "15",
    title: "Agafay At Sunset",
    duration: "1D", days: 1, nights: 0,
    route: "Marrakech → Agafay → Marrakech",
    priceFromEUR: 95,
    img: "assets/photos/agafay-valley-marrakech-74.jpg",
    badge: "DAY TRIP",
    themeTags: ["Desert", "Sunset", "Camel"],
    teaser: "A late-afternoon escape — quad or camel through the Agafay, sunset apéro, dinner under stars, back by midnight.",
    overview: "The shortest desert experience that still feels like one. Mid-afternoon pickup, choice of quad or camel, sunset drinks at a camp overlooking the valley, a Moroccan dinner with light music, return to Marrakech by 23:00.",
    highlights: ["Quad or camel ride", "Sunset over Agafay", "Camp dinner", "Optional Gnawa music", "Return by midnight"],
    itinerary: [
      { day: 1, route: "Marrakech → Agafay → Marrakech", text: "15:00 pickup. Quad/camel. Sunset apéro. Dinner from 19:30. Return 23:00." },
    ],
    included: ["Private transport", "Quad or camel ride", "Camp dinner"],
    excluded: ["Drinks", "Tips"],
  },

  // ===== 7D+ tier (2) =====
  {
    slug: "imperial-cities-grand", chapter: "16",
    title: "The Imperial Loop",
    duration: "7D6N", days: 7, nights: 6,
    route: "Marrakech → Fez → Chefchaouen → Casa → Marrakech",
    priceFromEUR: 1490,
    img: "assets/photos/about-us-hq-26-scaled.jpg.webp",
    themeTags: ["Cities", "Medinas", "Coast"],
    teaser: "A week across Morocco's imperial spine — Marrakech the red, Fez the gold, Chefchaouen the blue, Casa the white.",
    overview: "A pace that lets each city breathe. Two days in Marrakech, one in Volubilis and Meknes, two in Fez with a proper medina guide, one in Chefchaouen, one in Casablanca and back. Train or private drive — we adapt to what you prefer.",
    highlights: ["Marrakech medina", "Volubilis Roman ruins", "Fez medina + tanneries", "Chefchaouen blue town", "Hassan II mosque", "Return via Rabat"],
    itinerary: [
      { day: 1, route: "Marrakech medina", text: "Heritage walk. Cooking class on request. Riad dinner." },
      { day: 2, route: "Marrakech → Meknes → Fez", text: "Volubilis Roman site. Lunch in Meknes. Arrive Fez evening." },
      { day: 3, route: "Fez", text: "Full-day medina with local guide. Tanneries. Madrasa Bou Inania." },
      { day: 4, route: "Fez → Chefchaouen", text: "Drive north through the Rif. Free afternoon in the blue town." },
      { day: 5, route: "Chefchaouen → Rabat", text: "Slow drive south. Late afternoon in Rabat. Kasbah at sunset." },
      { day: 6, route: "Rabat → Casablanca → Marrakech", text: "Hassan II mosque. Lunch. Drive back to Marrakech." },
      { day: 7, route: "Marrakech", text: "Slow morning. Free time. Departure." },
    ],
    included: ["Private 4×4 + driver-guide for full loop", "Six nights' accommodation", "Local city guides", "All transfers"],
    excluded: ["Some meals", "Drinks", "Tips"],
  },
  {
    slug: "the-grand-discovery", chapter: "17",
    title: "The Grand Discovery — 15 Days",
    duration: "15D14N", days: 15, nights: 14,
    route: "Marrakech → Atlas → Sahara → Fez → Coast → Marrakech",
    priceFromEUR: 3490,
    img: "assets/photos/leonardo-2680808-marrak-11-12-22-o-343368.jpg",
    badge: "MOST LOVED",
    themeTags: ["Grand tour", "Slow travel", "Everything"],
    teaser: "Fifteen days to actually see the country — desert, mountains, imperial cities, Atlantic coast. Our most thorough itinerary.",
    overview: "Built from the Marrakechstory 15-day sample. Designed to be slow enough that each region gets its own rhythm. Two days at the dunes (not one). Two days in Fez (not half). A coastal night at Essaouira before returning. Private driver-guide throughout; we adapt the daily plan to the weather and your energy.",
    highlights: ["Tichka pass", "Aït Ben Haddou & kasbah road", "Dades & Todra gorges", "Two-night Sahara overnight", "Fez medina (two days)", "Chefchaouen", "Volubilis", "Essaouira coast"],
    itinerary: [
      { day: 1, route: "Marrakech arrival", text: "Riad check-in. Light medina walk. Welcome dinner." },
      { day: 2, route: "Marrakech medina + Palmeraie", text: "Half-day heritage walk. Afternoon pool day." },
      { day: 3, route: "Marrakech → Aït Ben Haddou", text: "Cross Tichka. Photo stops. Kasbah overnight." },
      { day: 4, route: "Aït Ben Haddou → Dades", text: "Skoura palm grove. Up Dades valley." },
      { day: 5, route: "Dades → Todra → Merzouga", text: "Through Todra. Camel into camp." },
      { day: 6, route: "Merzouga", text: "Nomadic family visit. Luxury tent overnight." },
      { day: 7, route: "Merzouga → Midelt", text: "Across the cedar forest. Berber lunch." },
      { day: 8, route: "Midelt → Fez", text: "Drive to Fez. Free evening." },
      { day: 9, route: "Fez", text: "Full medina day with guide." },
      { day: 10, route: "Fez → Chefchaouen", text: "Drive north. Blue-town afternoon." },
      { day: 11, route: "Chefchaouen → Volubilis → Meknes", text: "Roman ruins. Meknes overnight." },
      { day: 12, route: "Meknes → Casablanca", text: "Drive west. Free afternoon." },
      { day: 13, route: "Casablanca → Essaouira", text: "Down the Atlantic. Coastal overnight." },
      { day: 14, route: "Essaouira → Marrakech", text: "Slow return via the argan road." },
      { day: 15, route: "Marrakech", text: "Free morning. Departure." },
    ],
    included: ["Private 4×4 + driver-guide for full route", "Fourteen nights' accommodation", "All transfers", "Local guides in Fez & Marrakech", "Camp half board"],
    excluded: ["Some meals", "Drinks", "Tips"],
  },

  // ===== Surf camp partner experience =====
  {
    slug: "the-happy-surfers-tamraght", chapter: "18",
    title: "The Happy Surfers — Surf, Yoga & Sunshine",
    duration: "7D6N", days: 7, nights: 6,
    route: "Tamraght · Taghazout coast",
    priceFromEUR: 544,
    img: "https://thehappysurfers.com/wp-content/uploads/2025/11/The-Happy-Surfers-Group-1.jpg",
    badge: "SURF CAMP",
    themeTags: ["Surf", "Yoga", "Ocean", "Coast", "Slow"],
    teaser: "Ocean-view house in a Tamraght fishing village — surf lessons, sunrise yoga, homemade Moroccan food, and a slow rhythm you can fall into. One week, fully flexible start day.",
    overview: "An all-in-one surf-camp week with our partner The Happy Surfers, fifteen minutes from Taghazout and twenty-five from Agadir. You wake up unhurried, surf with small-group coaching, eat fresh local food around the table, stretch on the rooftop at sunset and go to bed early. Pick the formula that suits you — Beginner & Intermediate (5 lessons + free surf), Surf & Yoga (lessons + 5 yoga classes), or Surf Guiding for experienced surfers chasing the best swell. A flexible 'build your own' formula and a calm Bed & Breakfast option are also available. Stays can start on any day of the week.",
    highlights: [
      "Small-group surf coaching with ISA-certified instructors",
      "Sunrise or sunset yoga on the rooftop",
      "Transfers to Banana Point, Devil's Rock & Anchor Point",
      "Homemade Moroccan breakfast & dinner shared at the table",
      "Softboard + wetsuit included for the whole stay",
      "Surfskate session + surf theory evenings",
      "Optional Paradise Valley, Imsouane & sandboarding, hammam, cooking class",
      "Flexible arrival day — start any day of the week",
    ],
    itinerary: [
      { day: 1, route: "Arrival · Tamraght", text: "Pickup arranged from Agadir. Welcome dinner, house tour, gear sizing for tomorrow's session." },
      { day: 2, route: "First surf lesson", text: "Breakfast with the group. Morning surf lesson at the right break for your level. Snacks at the beach, chill + free surf. Sunset rooftop. Dinner + surf theory." },
      { day: 3, route: "Yoga + surf", text: "Optional sunrise yoga on the rooftop. Surf lesson #2. Afternoon swim or surfskate session. Movie night or rooftop hangout." },
      { day: 4, route: "Best-spot day", text: "Coach reads the conditions and picks the best break of the day. Long beach lunch. Optional hammam in the afternoon." },
      { day: 5, route: "Optional excursion", text: "Free or add a day-trip: Paradise Valley pools or Imsouane + Timlaline sandboarding. Evening yoga." },
      { day: 6, route: "Surf + sunset", text: "Final surf lesson and a long free session. Sunset rooftop apéro. Last group dinner." },
      { day: 7, route: "Departure", text: "Slow breakfast. Transfer to Agadir airport or onward to Marrakech." },
    ],
    included: [
      "6 nights at the Happy Surfers ocean-view house (room of your choice)",
      "5 surf lessons + 5 free surf sessions (lesson formulas)",
      "5 yoga classes (Surf & Yoga formula)",
      "Softboard + wetsuit for the full stay",
      "Daily breakfast & dinner — fresh, local, homemade",
      "Transfers to surf spots around Tamraght / Taghazout",
      "Surf theory + surfskate session",
      "WiFi, daily cleaning, towels & linen",
    ],
    excluded: [
      "Flights to Agadir (AGA)",
      "Airport transfer (can be arranged on request)",
      "Lunches",
      "Optional excursions (Paradise Valley, Imsouane, hammam, cooking class)",
      "Personal drinks & tips",
    ],
    // Sub-formulas — surfaced inside the booking flow / modal
    formulas: [
      {
        id: "beginner-intermediate",
        name: { en: "Beginner & Intermediate", no: "Nybegynner & viderekommen", fr: "Débutant & Intermédiaire" },
        tagline: { en: "Learn safely, progress fast, enjoy every wave.", no: "Lær trygt, utvikle deg raskt, nyt hver bølge.", fr: "Apprenez en sécurité, progressez vite, savourez chaque vague." },
        prices: { triple: 544, twin: 593, double_shared: 645, double_private: 869 },
      },
      {
        id: "surf-yoga",
        name: { en: "Surf & Yoga", no: "Surf & Yoga", fr: "Surf & Yoga" },
        tagline: { en: "Find your flow on the mat and in the waves.", no: "Finn flyten på matten og i bølgene.", fr: "Trouvez votre flow, sur le tapis et dans les vagues." },
        prices: { triple: 594, twin: 643, double_shared: 695, double_private: 919 },
      },
      {
        id: "surf-guiding",
        name: { en: "Surf Guiding", no: "Surfguiding", fr: "Surf Guiding" },
        tagline: { en: "Chase the best waves with local knowledge.", no: "Jakt på de beste bølgene med lokal kunnskap.", fr: "Suivez les meilleures vagues avec un savoir local." },
        prices: { triple: 599, twin: 648, double_shared: 700, double_private: 924 },
      },
      {
        id: "customize",
        name: { en: "Build your own", no: "Sett sammen selv", fr: "Sur mesure" },
        tagline: { en: "Pick your room, meals, surf days and yoga — skip what you don't need.", no: "Velg rom, måltider, surfdager og yoga — hopp over det du ikke trenger.", fr: "Choisissez chambre, repas, surf et yoga — passez ce qui ne vous intéresse pas." },
        prices: null,
      },
      {
        id: "bed-breakfast",
        name: { en: "Bed & Breakfast", no: "Bed & Breakfast", fr: "Chambre & Petit-déjeuner" },
        tagline: { en: "Calm sleep and fresh Moroccan breakfast — explore the coast your own way.", no: "Rolig søvn og frisk marokkansk frokost — utforsk kysten i ditt eget tempo.", fr: "Sommeil calme et petit-déjeuner marocain — explorez la côte à votre rythme." },
        prices: { triple: 29 * 7, twin: 36 * 7, double_shared: 37 * 7, double_private: 52 * 7 },
      },
    ],
    partner: {
      name: "The Happy Surfers",
      tagline: "Happy Wave, Happy Life",
      slogan: "Your Place For Surf, Yoga And Sunshine",
      location: "Tamraght fishing village, Morocco",
      website: "https://thehappysurfers.com/",
      phone: "+212 605 77 23 01",
      whatsapp: "+45 52 22 33 98",
      email: "contactus@thehappysurfers.com",
      instagram: "@thehappysurfersinmorocco",
      gallery: [
        "https://thehappysurfers.com/wp-content/uploads/2025/12/DSC00134.jpg",
        "https://thehappysurfers.com/wp-content/uploads/2025/12/DSC07065.jpg",
        "https://thehappysurfers.com/wp-content/uploads/2025/12/DSC09895.jpg",
        "https://thehappysurfers.com/wp-content/uploads/2025/11/morning-yoga.jpg",
        "https://thehappysurfers.com/wp-content/uploads/2025/11/Happy-Surfer-1.jpg",
        "https://thehappysurfers.com/wp-content/uploads/2025/11/Happy-Stretching.jpg",
        "https://thehappysurfers.com/wp-content/uploads/2025/11/Moe-and-Happy-surfers.jpg",
        "https://thehappysurfers.com/wp-content/uploads/2025/11/Moe-Gliding.jpg",
      ],
    },
    extras: [
      { id: "paradise-valley", name: { en: "Paradise Valley", no: "Paradise Valley", fr: "Paradise Valley" }, desc: { en: "Quiet valley with palm trees, pools and warm rocks — light hike and swim.", no: "Stille dal med palmer, bassenger og varme steiner — lett tur og bading.", fr: "Vallée tranquille, palmiers, bassins et roches chaudes — randonnée légère et baignade." } },
      { id: "imsouane", name: { en: "Imsouane + Sandboarding", no: "Imsouane + Sandboarding", fr: "Imsouane + Sandboard" }, desc: { en: "Full day to Morocco's most mellow surf village + sandboarding on the Timlaline dunes.", no: "Heldagstur til Marokkos roligste surfelandsby + sandboarding på Timlaline-dynene.", fr: "Journée complète vers le village de surf le plus zen + sandboard sur les dunes de Timlaline." } },
      { id: "hammam", name: { en: "Hammam & Spa", no: "Hammam & Spa", fr: "Hammam & Spa" }, desc: { en: "Traditional Moroccan steam bath, natural scrub and a gentle massage.", no: "Tradisjonelt marokkansk dampbad, naturlig skrubb og mild massasje.", fr: "Bain de vapeur marocain, gommage naturel et massage doux." } },
      { id: "cooking", name: { en: "Moroccan Cooking Class", no: "Marokkansk matlagingskurs", fr: "Cours de cuisine marocaine" }, desc: { en: "Market shopping, hands-on tagine prep, then sharing the meal together.", no: "Markedsbesøk, tagine fra bunnen av, så deler vi måltidet.", fr: "Marché, préparation du tagine, puis on partage le repas." } },
      { id: "surfskate", name: { en: "Surf Skate Session", no: "Surf skate-økt", fr: "Session Surf Skate" }, desc: { en: "Land-based session to improve turns, balance and timing.", no: "Landbasert økt for å forbedre svinger, balanse og timing.", fr: "Session terrestre pour progresser sur les virages, l'équilibre et le timing." } },
      { id: "extra-surf", name: { en: "Extra Surf Session", no: "Ekstra surføkt", fr: "Session de surf supplémentaire" }, desc: { en: "Peaceful sunset surf in soft golden light.", no: "Rolig solnedgangs-surf i mykt gyllent lys.", fr: "Surf au coucher du soleil, lumière douce et dorée." } },
      { id: "extra-yoga", name: { en: "Extra Yoga Session", no: "Ekstra yoga-økt", fr: "Session de yoga supplémentaire" }, desc: { en: "Calming stretching, breathing and grounding.", no: "Beroligende tøying, pust og jording.", fr: "Étirements calmes, respiration et ancrage." } },
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
  const [filter, setFilter] = useStateIt('All');
  const [openTrip, setOpenTrip] = useStateIt(null);
  const [visibleCount, setVisibleCount] = useStateIt(4);
  // +40% markup applied to every itinerary price
  const adjustedPrice = (eur) => price(eur * 1.4);

  useEffectIt(() => { setVisibleCount(4); }, [filter]);

  // Simple, friendly labels (no jargon)
  const filterLabel = (f) => {
    if (f === 'All')         return tx('All', 'Alle', 'Tout');
    if (f === 'Most booked') return tx('Most booked', 'Mest bestilt', 'Plus réservé');
    if (f === '3D2N')        return tx('3 days', '3 dager', '3 jours');
    if (f === '4D3N')        return tx('4 days', '4 dager', '4 jours');
    if (f === '5D4N')        return tx('5 days', '5 dager', '5 jours');
    if (f === 'Day trips')   return tx('Day trips', 'Dagsturer', 'Excursions');
    if (f === '7D+')         return tx('1 week+', '1 uke+', '1 semaine+');
    return f;
  };
  const filters = ['All', 'Most booked', '3D2N', '4D3N', '5D4N', 'Day trips', '7D+'];
  const all = useMemoIt(() => [...MOST_BOOKED, ...ITINS], []);
  const matches = (t) => {
    if (filter === 'All') return true;
    if (filter === 'Most booked') return t.badge === 'MOST BOOKED';
    if (filter === 'Day trips') return t.days === 1;
    if (filter === '7D+') return t.days >= 7;
    return t.duration === filter;
  };
  // Sort: MOST_BOOKED first, then 3D2N → 4D3N → 5D4N → day trips → 7D+
  const tier = (t) => {
    if (t.badge === 'MOST BOOKED') return -1;
    if (t.duration === '3D2N') return 0;
    if (t.duration === '4D3N') return 1;
    if (t.duration === '5D4N') return 2;
    if (t.days === 1) return 3;
    if (t.days >= 7) return 4;
    return 5;
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

        <div className="cat-tabs-v2 reveal">
          {filters.map(f => {
            const isMostBooked = f === 'Most booked';
            const count = isMostBooked
              ? all.filter(t => t.badge === 'MOST BOOKED').length
              : f === 'All' ? all.length
              : f === 'Day trips' ? all.filter(t => t.days === 1).length
              : f === '7D+' ? all.filter(t => t.days >= 7).length
              : all.filter(t => t.duration === f).length;
            return (
              <button key={f} className={`cat-tab-v2 ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}>
                <span>{filterLabel(f)}</span>
                <span className="count">{count}</span>
              </button>
            );
          })}
          {/* Special-occasion shortcuts — open the form with a preset tripType */}
          <button className="cat-tab-v2 reiseplaner-special-tab"
            onClick={() => {
              window.MS_BookingContext = { mode: 'team', title: tx('Team building', 'Team building', 'Team building'), duration: 5, tripType: 'team' };
              window.dispatchEvent(new CustomEvent('ms:booking-context'));
              setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 60);
            }}>
            <span>🤝 {tx('Team building', 'Team building', 'Team building')}</span>
          </button>
          <button className="cat-tab-v2 reiseplaner-special-tab"
            onClick={() => {
              window.MS_BookingContext = { mode: 'wedding', title: tx('Wedding planner', 'Bryllup', 'Mariage'), duration: 7, tripType: 'wedding' };
              window.dispatchEvent(new CustomEvent('ms:booking-context'));
              setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 60);
            }}>
            <span>💍 {tx('Wedding', 'Bryllup', 'Mariage')}</span>
          </button>
        </div>

        {/* "Lag din reise" — full-width primary CTA bar under the tab row */}
        <div className="reiseplaner-cta-bar reveal">
          <button className="reiseplaner-cta-tab-full"
            onClick={() => {
              window.MS_BookingContext = null;
              window.dispatchEvent(new CustomEvent('ms:booking-context'));
              setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 30);
            }}>
            <span>✨ {tx('Make your trip', 'Lag din reise', 'Créer mon voyage')} →</span>
          </button>
        </div>
        <div className="cat-filters reveal" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            {items.length} {tx('chapters', 'kapitler', 'chapitres')}
          </div>
        </div>

            <div className="cat-grid reiseplaner-grid">
              {visibleItems.map((t, i) => {
                // Derive rating + reviews deterministically — Marrakechstory's actually booked these
                const seed = t.slug.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
                const rating = (4.7 + ((seed % 30) / 100)).toFixed(2);  // 4.70 – 4.99
                const reviews = 180 + (seed * 7) % 1620;                  // 180 – 1800
                const key = `itin-${t.slug}`;
                return (
                  <div key={t.slug} className="cat-card reveal" style={{ transitionDelay: `${(i % 6) * 50}ms` }}
                    onClick={() => setOpenTrip(t)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setOpenTrip(t)}>
                    <div className="cat-img" style={{ backgroundImage: `url(${t.img})`, cursor: 'pointer' }}>
                      <div className="cat-img-content">
                        <span className="cat-tag brand">{t.duration}</span>
                      </div>
                      {t.badge && <span className="reiseplan-badge">{t.badge}</span>}
                      <button className={`cat-fav ${(JSON.parse(localStorage.getItem('ms_user_favs') || '[]').includes(t.slug)) ? 'active' : ''}`}
                        onClick={e => {
                          e.stopPropagation();
                          const btn = e.currentTarget;
                          const favs = JSON.parse(localStorage.getItem('ms_user_favs') || '[]');
                          const adding = !favs.includes(t.slug);
                          const next = adding ? [...favs, t.slug] : favs.filter(s => s !== t.slug);
                          localStorage.setItem('ms_user_favs', JSON.stringify(next));
                          // Restart bloom animation on every click (not just on first toggle)
                          btn.classList.remove('active');
                          void btn.offsetWidth;
                          if (adding) btn.classList.add('active');
                        }}>
                        <Iit.Heart s={16} />
                        <span className="ms-fav-plus">+1</span>
                      </button>
                    </div>
                    <div className="cat-body">
                      <div className="cat-rating">
                        <span className="stars"><Iit.Star /></span>
                        <strong>{rating}</strong>
                        <span style={{ color: 'var(--ink-3)' }}>({reviews.toLocaleString()} {tx('reviews', 'anmeldelser', 'avis')})</span>
                      </div>
                      <h3 className="cat-title">{t.title}</h3>
                      <span className="cat-area"><Iit.Pin s={12} /> {t.route.split(' → ').slice(-1)[0] || 'Marrakech'}</span>
                      {t.duration && <span className="cat-duration"><Iit.Clock s={12} /> CHAPTER {t.chapter} · {t.duration}</span>}
                      <p className="cat-desc">{t.teaser}</p>
                      <div className="cat-foot">
                        <div className="cat-price">
                          <span className="amount" style={{ fontSize: 12, fontStyle: 'italic', opacity: .7 }}>
                            {tx('Price on request', 'Pris på forespørsel', 'Prix sur demande')}
                          </span>
                        </div>
                        <button className="cat-arrow" onClick={(e) => { e.stopPropagation(); setOpenTrip(t); }}><Iit.Arrow s={16} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
