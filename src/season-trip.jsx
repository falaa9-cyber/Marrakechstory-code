// ============================================================
// Season trips — Norwegian-calendar "event" trips.
// Picks the current OR next upcoming Norwegian vacation and builds
// THREE full itineraries for it (Par / Venner / Familie) in the same
// schema as the regular trips. All programmes stay in Marrakech & around
// (medina riad · Jardin Majorelle · hot-air balloon · Agafay luxury camp).
// Exposes:
//   window.MS_SEASON_ITINS  — array of 3 trip objects (current season)
//   window.MS_SEASON_META   — { key, no, en, week, dateLabel }
// The featured season rotates automatically with the calendar.
// ============================================================
(function () {
  // ── Easter (Gregorian computus) ──
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100,
      d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
      i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
      m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31),
      da = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mo - 1, da);
  }
  const mk = (y, m, d) => new Date(y, m - 1, d);
  const addDays = (dt, n) => { const r = new Date(dt); r.setDate(r.getDate() + n); return r; };
  function windowFor(key, y) {
    switch (key) {
      case 'vinterferie': return [mk(y, 2, 14), mk(y, 3, 1)];
      case 'paske':       { const e = easter(y); return [addDays(e, -9), addDays(e, 1)]; }
      case 'mai':         return [mk(y, 5, 14), mk(y, 5, 20)];
      case 'sommerferie': return [mk(y, 6, 28), mk(y, 8, 10)];
      case 'hostferie':   return [mk(y, 9, 27), mk(y, 10, 12)];
      case 'jul':         return [mk(y, 12, 18), mk(y + 1, 1, 2)];
    }
    return [mk(y, 1, 1), mk(y, 1, 1)];
  }
  const ORDER = ['vinterferie', 'paske', 'mai', 'sommerferie', 'hostferie', 'jul'];
  function pickSeason(now) {
    const inst = [];
    for (const dy of [-1, 0, 1]) {
      const y = now.getFullYear() + dy;
      for (const k of ORDER) { const w = windowFor(k, y); inst.push({ k, s: w[0], e: w[1] }); }
    }
    const cur = inst.find(x => now >= x.s && now <= x.e);
    if (cur) return Object.assign({ active: true }, cur);
    const up = inst.filter(x => x.s > now).sort((a, b) => a.s - b.s)[0];
    return Object.assign({ active: false }, up || inst[0]);
  }

  const P = (no, en) => ({ no, en });
  const BOOK_EARLY = {
    no: 'Book i god tid: denne sesongturen har begrenset kapasitet — pris og program kan endres ved sen booking.',
    en: 'Book early: this seasonal trip has limited capacity — the price and programme may change if you book late.',
  };
  const STD_INC = [
    ['Privat sjåfør-guide og all transport', 'Private driver-guide and all transport'],
    ['Henting og avlevering på flyplassen', 'Airport pickup & drop-off'],
    ['Frokost hver dag', 'Breakfast every day'],
    ['24/7 WhatsApp-støtte — Aladdin & Marte', '24/7 WhatsApp support — Aladdin & Marte'],
    ['Personlig reiseplan-PDF', 'Personalised itinerary PDF'],
    ['MVA inkludert — ingen skjulte tillegg', 'VAT included — no hidden extras'],
  ];
  const STD_EXC = [
    ['Internasjonale flyreiser', 'International flights'],
    ['Middager i byen (restaurant etter eget valg)', 'City dinners (restaurant of your choice)'],
    ['Drikke og alkohol', 'Drinks & alcohol'],
    ['Reiseforsikring (anbefales)', 'Travel insurance (recommended)'],
    ['Personlige utgifter og tips', 'Personal expenses & tips'],
  ];

  // ── Season framing only (name + window + short seasonal note + price add-on) ──
  const SEASONS_META = {
    vinterferie: { no: 'Vinterferie', en: 'Winter break', week: 'Uke 8–9',
      note: P('Vinterferie i 20 varmegrader, langt fra norsk vinter.', 'A winter break at 20°C, far from the Norwegian cold.') },
    paske: { no: 'Påske', en: 'Easter', week: 'Palmesøndag–2. påskedag',
      note: P('Påskeferie med vårluft og lange, lyse kvelder.', 'An Easter break with spring air and long, bright evenings.') },
    mai: { no: '17. mai-helgen', en: 'The May long weekend', week: 'Langhelg i mai',
      note: P('En forlenget 17. mai-helg i sola.', 'An extended May long weekend in the sun.') },
    sommerferie: { no: 'Sommerferie', en: 'Summer break', week: 'Fellesferien · uke 28–30',
      note: P('Sommerferie midt i den norske fellesferien.', 'A summer break right in the Norwegian common holiday.') },
    hostferie: { no: 'Høstferie', en: 'Autumn break', week: 'Uke 40',
      note: P('Høstferie i Marokkos aller fineste vær.', 'An autumn break in Morocco’s very finest weather.') },
    jul: { no: 'Jul & nyttår', en: 'Christmas & New Year', week: '20. des–2. jan', priceAdj: 200,
      note: P('Jul og nyttår i varmen — med festlig stemning og gallamiddag.', 'Christmas and New Year in the warmth — festive mood and a gala dinner.') },
  };

  // ── Shared programmes (Marrakech & around). Itinerary text uses the
  //    "segment || segment", each "label ~~ detail" format the modal parses. ──
  const VARIANTS = {
    par: {
      tab: P('Par', 'Couple'), suffix: P('for to', 'for two'), price: 1090,
      img: 'assets/photos/agafay-dinner-table-03.jpg', route: 'Marrakech · Agafay',
      // Gallery follows the itinerary: riad → rooftop dinner → hammam → Majorelle → balloon → Agafay camel → dinner under stars → luxury tent
      g: ['agafay-dinner-table-03.jpg', 'riad-pool-dusk-01.jpg', 'riad-rooftop-terrace-24.jpg', 'hammam-spa-room-01.avif', 'marrakech-jardin-majorelle-01.jpg', 'balloon-marrakech-01.jpg', 'agafay-camel-palmeraie-20.jpg', 'agafay-night-lounge-05.jpg', 'agafay-tent-lounge-07.jpg'],
      tags: ['Marrakech', 'Agafay', 'Romantikk'],
      ideal: P('Par som vil ha romantikk og rolig luksus', 'Couples after romance and easy luxury'),
      teaser: P('Riad, hammam, Jardin Majorelle, luftballong og en natt under stjernene i Agafay.', 'Riad, hammam, Jardin Majorelle, a hot-air balloon and a night under the stars in Agafay.'),
      overview: P('Det beste av Marrakech og Agafay for to: to netter i et luksusriad i medinaen, privat hammam, Jardin Majorelle, en soloppgang i luftballong og en siste natt under stjernene i Agafay med kamelritt og middag i ørkenen.', 'The best of Marrakech and Agafay for two: two nights in a medina luxury riad, a private hammam, Jardin Majorelle, a sunrise hot-air balloon and a final night under the stars in Agafay with a camel ride and a desert dinner.'),
      hi: [['Luksusriad i medinaen', 'Luxury medina riad'], ['Privat hammam & Jardin Majorelle', 'Private hammam & Jardin Majorelle'], ['Luftballong ved soloppgang', 'Sunrise hot-air balloon'], ['Agafay: kamelritt & middag under stjernene', 'Agafay: camel ride & dinner under the stars'], ['Overnatting i luksustelt', 'Overnight in a luxury tent']],
      tl: [
        ['Ankomst & Marrakech', 'Arrival & Marrakech', 'Henting ~~ Sjåfør med navneskilt på flyplassen || Innsjekk ~~ Luksusriad i hjertet av medinaen, velkomst med myntete || Kveld ~~ Romantisk middag på en takterrasse over den opplyste byen', 'Pickup ~~ Driver with a name sign at the airport || Check-in ~~ Luxury riad in the heart of the medina, welcome mint tea || Evening ~~ Romantic dinner on a rooftop above the lit-up city'],
        ['Hammam & Majorelle', 'Hammam & Majorelle', 'Formiddag ~~ Privat luksushammam: svart såpe, kessa-skrubb og arganolje-massasje || Ettermiddag ~~ Jardin Majorelle og privat guidet tur i medinaen || Kveld ~~ Middag på en restaurant dere velger fra katalogen vår', 'Morning ~~ Private luxury hammam: black soap, kessa scrub and an argan-oil massage || Afternoon ~~ Jardin Majorelle and a private guided medina tour || Evening ~~ Dinner at a restaurant you choose from our catalogue'],
        ['Ballong & Agafay', 'Balloon & Agafay', '05:00 ~~ Luftballong ved soloppgang over Atlas og palmelundene, med berberfrokost og flybevis || Ettermiddag ~~ Privat transfer til Agafay, kamelritt eller aktivitet etter eget valg || Kveld ~~ Middag under stjernene, overnatting i et luksuriøst ørkentelt', '05:00 ~~ Sunrise hot-air balloon over the Atlas and palm groves, with a Berber breakfast and a flight certificate || Afternoon ~~ Private transfer to Agafay, a camel ride or an activity of your choice || Evening ~~ Dinner under the stars, overnight in a luxury desert tent'],
        ['Frokost & avreise', 'Breakfast & departure', 'Morgen ~~ Soloppgang og frokost i ørkenen || Transfer ~~ Privat tur tilbake til Marrakech eller direkte til flyplassen', 'Morning ~~ Sunrise and breakfast in the desert || Transfer ~~ Private ride back to Marrakech or straight to the airport'],
      ],
      inc: [['2 netter luksusriad + 1 natt luksustelt i Agafay', '2 nights luxury riad + 1 night luxury Agafay tent'], ['Privat luksushammam', 'Private luxury hammam'], ['Jardin Majorelle + privat guidet medinatur', 'Jardin Majorelle + private guided medina tour'], ['Luftballong ved soloppgang med flybevis', 'Sunrise hot-air balloon with certificate'], ['Kamelritt eller aktivitet etter eget valg i Agafay', 'Camel ride or activity of choice in Agafay'], ['Middag under stjernene i Agafay', 'Dinner under the stars in Agafay']],
      exc: [['Inngang Jardin Majorelle (~150 MAD)', 'Jardin Majorelle entrance (~150 MAD)']],
    },
    venner: {
      tab: P('Venner', 'Friends'), suffix: P('med venner', 'with friends'), price: 990,
      img: 'assets/photos/agafay-quad-desert-18.jpg', route: 'Marrakech · Agafay',
      // Gallery follows the itinerary: Jemaa el-Fna night → rooftop → hammam → Majorelle → souks → balloon → Agafay quad → Gnawa feast → luxury tent
      g: ['agafay-quad-desert-18.jpg', 'medina-jemaa-el-fna-night-11.jpg', 'medina-rooftop-cafe-14.jpg', 'hammam-spa-03.webp', 'marrakech-jardin-majorelle-01.jpg', 'medina-souk-15.jpg', 'balloon-marrakech-01.jpg', 'agafay-gnawa-show-22.jpg', 'agafay-tent-lounge-07.jpg'],
      tags: ['Marrakech', 'Agafay', 'Uteliv'],
      ideal: P('Vennegjenger som vil ha action og gode kvelder', 'Friend groups after action and good nights'),
      teaser: P('Medina og uteliv, Majorelle, luftballong, quad i Agafay og festmiddag under stjernene.', 'Medina and nightlife, Majorelle, a balloon, Agafay quads and a feast under the stars.'),
      overview: P('Marrakech og Agafay for vennegjengen: riad i medinaen, takbarer og Jemaa el-Fna, hammam og Majorelle, en soloppgang i luftballong og en Agafay-natt med quad, kamelritt og festmiddag under stjernene.', 'Marrakech and Agafay for the group: a medina riad, rooftop bars and Jemaa el-Fna, a hammam and Majorelle, a sunrise balloon and an Agafay night with quads, a camel ride and a feast under the stars.'),
      hi: [['Takbar & Jemaa el-Fna', 'Rooftop bar & Jemaa el-Fna'], ['Jardin Majorelle & souker', 'Jardin Majorelle & souks'], ['Luftballong + quad/buggy', 'Hot-air balloon + quad/buggy'], ['Festmiddag med Gnawa i Agafay', 'Gnawa feast in Agafay'], ['Overnatting i luksustelt', 'Overnight in a luxury tent']],
      tl: [
        ['Ankomst & uteliv', 'Arrival & nightlife', 'Henting ~~ Transfer til riad i medinaen || Kveld ~~ Takbar og street food på Jemaa el-Fna', 'Pickup ~~ Transfer to a medina riad || Evening ~~ A rooftop bar and street food on Jemaa el-Fna'],
        ['Hammam & medina', 'Hammam & medina', 'Formiddag ~~ Hammam og avslapning || Ettermiddag ~~ Jardin Majorelle og guidet medina- og souktur || Kveld ~~ Middag på en restaurant dere velger fra katalogen vår', 'Morning ~~ Hammam and downtime || Afternoon ~~ Jardin Majorelle and a guided medina & souk tour || Evening ~~ Dinner at a restaurant you choose from our catalogue'],
        ['Ballong, quad & Agafay', 'Balloon, quad & Agafay', '05:00 ~~ Luftballong ved soloppgang || Ettermiddag ~~ Agafay: quad eller buggy og kamelritt etter eget valg || Kveld ~~ Festmiddag med Gnawa under stjernene, overnatting i luksustelt', '05:00 ~~ Sunrise hot-air balloon || Afternoon ~~ Agafay: quad or buggy and a camel ride of your choice || Evening ~~ A Gnawa feast under the stars, overnight in a luxury tent'],
        ['Frokost & avreise', 'Breakfast & departure', 'Morgen ~~ Frokost i ørkenen || Transfer ~~ Tilbake til Marrakech eller flyplassen', 'Morning ~~ Breakfast in the desert || Transfer ~~ Back to Marrakech or the airport'],
      ],
      inc: [['2 netter riad + 1 natt luksustelt i Agafay', '2 nights riad + 1 night luxury Agafay tent'], ['Hammam', 'Hammam'], ['Jardin Majorelle + guidet medina- og souktur', 'Jardin Majorelle + guided medina & souk tour'], ['Luftballong ved soloppgang', 'Sunrise hot-air balloon'], ['Agafay: kamelritt (quad/buggy som tillegg)', 'Agafay: camel ride (quad/buggy add-on)'], ['Festmiddag med Gnawa under stjernene', 'Gnawa feast under the stars']],
      exc: [['Quad/buggy i Agafay (~€40/p)', 'Quad/buggy in Agafay (~€40/p)'], ['Drikke på takbar', 'Rooftop-bar drinks']],
    },
    familie: {
      tab: P('Familie', 'Family'), suffix: P('med familien', 'with family'), price: 950,
      img: 'assets/photos/agafay-camel-palmeraie-20.jpg', route: 'Marrakech · Agafay',
      // Gallery follows the itinerary: riad pool → Majorelle → family medina tour → balloon → Agafay pool → desert dinner → family tent
      g: ['agafay-camel-palmeraie-20.jpg', 'riad-courtyard-pool-03.jpg', 'marrakech-jardin-majorelle-01.jpg', 'medina-city-tour-46.jpg', 'balloon-marrakech-01.jpg', 'agafay-pool-08.jpg', 'agafay-night-dinner-04.jpg', 'agafay-camp-lounge-01.jpg', 'riad-garden-pool-07.jpg'],
      tags: ['Marrakech', 'Agafay', 'Familie'],
      ideal: P('Familier som vil ha trygt, barnevennlig tempo', 'Families wanting a safe, kid-friendly pace'),
      teaser: P('Riad med basseng, Majorelle, kameler i Palmeraien, luftballong og en natt i luksustelt.', 'A riad with a pool, Majorelle, camels in the Palmeraie, a balloon and a night in a luxury tent.'),
      overview: P('Marrakech og Agafay for hele familien: riad med basseng, Jardin Majorelle og en familievennlig medinatur, kamelritt i Palmeraien, en soloppgang i luftballong (eller aktivitet etter eget valg) og en trygg natt i et romslig luksustelt i Agafay.', 'Marrakech and Agafay for the whole family: a riad with a pool, Jardin Majorelle and a family-friendly medina tour, a camel ride in the Palmeraie, a sunrise balloon (or activity of choice) and a safe night in a spacious Agafay luxury tent.'),
      hi: [['Riad med basseng', 'Riad with a pool'], ['Jardin Majorelle & Palmeraie-kamelritt', 'Jardin Majorelle & Palmeraie camel ride'], ['Luftballong eller aktivitet etter eget valg', 'Hot-air balloon or activity of choice'], ['Agafay: kamelritt & basseng', 'Agafay: camel ride & pool'], ['Romslig familie-luksustelt', 'Spacious family luxury tent']],
      tl: [
        ['Ankomst & basseng', 'Arrival & pool', 'Henting ~~ Navneskilt på flyplassen || Innsjekk ~~ Riad med basseng og myntete || Kveld ~~ Familiemiddag på en takterrasse', 'Pickup ~~ Name sign at the airport || Check-in ~~ Riad with a pool and mint tea || Evening ~~ Family dinner on a rooftop'],
        ['Majorelle & Palmeraie', 'Majorelle & Palmeraie', 'Formiddag ~~ Jardin Majorelle og familievennlig guidet medinatur || Ettermiddag ~~ Kamelritt i Palmeraien || Kveld ~~ Middag på en restaurant dere velger fra katalogen vår', 'Morning ~~ Jardin Majorelle and a family-friendly guided medina tour || Afternoon ~~ Camel ride in the Palmeraie || Evening ~~ Dinner at a restaurant you choose from our catalogue'],
        ['Ballong & Agafay', 'Balloon & Agafay', '05:00 ~~ Luftballong ved soloppgang (eller aktivitet etter eget valg) || Ettermiddag ~~ Agafay: kamelritt og basseng || Kveld ~~ Middag under stjernene, overnatting i et romslig luksustelt', '05:00 ~~ Sunrise hot-air balloon (or an activity of your choice) || Afternoon ~~ Agafay: camel ride and the pool || Evening ~~ Dinner under the stars, overnight in a spacious luxury tent'],
        ['Frokost & avreise', 'Breakfast & departure', 'Morgen ~~ Frokost i ørkenen || Transfer ~~ Tilbake til Marrakech eller flyplassen', 'Morning ~~ Breakfast in the desert || Transfer ~~ Back to Marrakech or the airport'],
      ],
      inc: [['2 netter riad med basseng + 1 natt romslig luksustelt', '2 nights riad with pool + 1 night spacious luxury tent'], ['Jardin Majorelle + familievennlig guidet tur', 'Jardin Majorelle + family-friendly guided tour'], ['Kamelritt i Palmeraien', 'Camel ride in the Palmeraie'], ['Luftballong ved soloppgang (eller aktivitet etter eget valg)', 'Sunrise hot-air balloon (or activity of choice)'], ['Kamelritt og basseng i Agafay', 'Camel ride and pool in Agafay'], ['Middag under stjernene i Agafay', 'Dinner under the stars in Agafay']],
      exc: [['Barneseng/ekstraseng på forespørsel', 'Cot/extra bed on request'], ['Inngang Jardin Majorelle (~150 MAD)', 'Jardin Majorelle entrance (~150 MAD)']],
    },
  };

  // ── Per-season × per-variant galleries. Every one of the 18 trips gets its
  //    OWN set of images — no photo is reused between trips, and each picture is
  //    chosen to match that trip's programme and season (winter sun, Easter
  //    gardens, May medina, summer balloon, autumn Atlas, Christmas feast). ──
  const GALLERIES = {
    // Every cover is a colourful scenic hero shot; every image is sightseeing-worthy
    // (turquoise riad pools, Jardin Majorelle, Koutoubia, colourful souks & streets,
    //  Atlas valleys/oasis/falls, Agafay desert, festive food) — no plain interiors.
    vinterferie: {
      par:     ['riad-pool-dusk-01.jpg', 'riad-rooftop-terrace-24.jpg', 'medina-rooftop-cafe-14.jpg', 'agafay-dinner-table-03.jpg', 'medina-koutoubia-dusk-18.jpg', 'riad-courtyard-10.jpg'],
      venner:  ['medina-jemaa-el-fna-night-11.jpg', 'medina-souk-spices-19.jpg', 'riad-pool-04.jpg', 'agafay-quad-desert-18.jpg', 'medina-night-lights-22.jpg', 'medina-rooftops-07.jpg'],
      familie: ['riad-courtyard-pool-03.jpg', 'agafay-camel-palmeraie-20.jpg', 'medina-market-24.jpg', 'riad-garden-pool-07.jpg', 'riad-pool-09.jpg', 'medina-carpet-souk-30.jpg'],
    },
    paske: {
      par:     ['marrakech-jardin-majorelle-01.jpg', 'riad-pool-dusk-15.jpg', 'atlas-oasis-15.jpg', 'agafay-night-dinner-04.jpg', 'medina-garden-23.jpg', 'riad-rooftop-sunbed-23.jpg'],
      venner:  ['atlas-paragliding-21.jpg', 'medina-jemaa-el-fna-10.webp', 'agafay-buggy-desert-19.jpg', 'atlas-valley-14.jpg', 'riad-pool-14.jpg', 'medina-rooftop-view-45.jpg'],
      familie: ['atlas-setti-fatma-falls-12.jpg', 'atlas-azzaden-valley-03.jpg', 'agafay-camp-aerial-06.jpg', 'riad-garden-pool-11.jpg', 'medina-storks-03.jpg', 'atlas-oasis-19.jpg'],
    },
    mai: {
      par:     ['medina-koutoubia-04.jpg', 'riad-pool-terrace-08.avif', 'agafay-10.jpg', 'medina-lanterns-25.jpg', 'riad-fountain-13.jpg', 'medina-blue-door-26.jpg'],
      venner:  ['medina-fantasia-horses-02.jpg', 'medina-lanterns-38.jpg', 'agafay-13.jpg', 'medina-souk-vendor-17.jpg', 'riad-pool-arches-02.webp', 'medina-spice-souk-37.jpg'],
      familie: ['atlas-menara-pool-17.jpg', 'agafay-16.jpg', 'medina-souk-32.jpg', 'medina-souk-arch-47.jpg', 'medina-artisan-20.jpg', 'medina-textiles-21.jpg'],
    },
    sommerferie: {
      par:     ['balloon-marrakech-01.jpg', 'atlas-palm-oasis-02.jpg', 'agafay-night-fire-show-02.avif', 'medina-blue-street-30.jpg', 'medina-red-street-34.jpg', 'medina-blue-door-35.jpg'],
      venner:  ['medina-pink-street-08.jpg', 'agafay-quad-night-17.webp', 'atlas-mountains-04.jpg', 'medina-souk-15.jpg', 'food-street-food-12.webp', 'agafay-pool-08.jpg'],
      familie: ['atlas-mountains-13.jpg', 'agafay-camp-lounge-01.jpg', 'atlas-palm-18.jpg', 'food-cooking-class-13.jpg', 'medina-koutoubia-04.jpg', 'riad-courtyard-pool-03.jpg'],
    },
    hostferie: {
      par:     ['atlas-valley-panorama-01.avif', 'atlas-oasis-15.jpg', 'agafay-night-lounge-05.jpg', 'medina-lanterns-25.jpg', 'riad-rooftop-terrace-24.jpg', 'medina-koutoubia-dusk-18.jpg'],
      venner:  ['atlas-mountains-20.jpg', 'atlas-oasis-19.jpg', 'agafay-dome-night-09.webp', 'medina-blue-street-30.jpg', 'atlas-valley-14.jpg', 'food-tagine-09.webp'],
      familie: ['atlas-menara-palms-16.jpg', 'agafay-11.jpg', 'atlas-azzaden-valley-03.jpg', 'medina-red-street-34.jpg', 'atlas-paragliding-21.jpg', 'food-garden-restaurant-05.jpg'],
    },
    jul: {
      par:     ['medina-night-lights-22.jpg', 'agafay-tent-lounge-07.jpg', 'food-menu-noel-02.jpg', 'food-tea-tray-11.jpg', 'medina-lanterns-38.jpg', 'food-tagine-10.jpg'],
      venner:  ['agafay-gnawa-show-22.jpg', 'food-menu-noel-07.jpg', 'medina-blue-door-26.jpg', 'food-mechoui-lamb-04.webp', 'agafay-dome-night-09.webp', 'medina-souk-spices-19.jpg'],
      familie: ['agafay-camp-aerial-06.jpg', 'food-menu-noel-08.jpg', 'food-bakery-01.webp', 'marrakech-jardin-majorelle-01.jpg', 'atlas-mountains-20.jpg', 'medina-market-24.jpg'],
    },
  };

  function buildTrip(seasonKey, vk) {
    const S = SEASONS_META[seasonKey];
    const V = VARIANTS[vk];
    const G = (GALLERIES[seasonKey] && GALLERIES[seasonKey][vk]) || V.g || [];
    const days = V.tl.length;
    const nights = Math.max(1, days - 1);
    return {
      __season: true,
      audienceKey: vk,
      who: V.tab,
      slug: `season-${seasonKey}-${vk}`,
      chapter: S.week,
      title: { no: `${S.no} ${V.suffix.no}`, en: `${S.en} ${V.suffix.en}` },
      duration: `${days}D${nights}N`, days, nights,
      route: V.route,
      priceFromEUR: Math.round((V.price + (S.priceAdj || 0)) / 1.4),  // ×1.4 display markup
      img: (/^(assets\/|https?:)/.test(G[0] || V.img) ? (G[0] || V.img) : 'assets/photos/' + G[0]),
      gallery: G.map(p => (/^(assets\/|https?:)/.test(p) ? p : 'assets/photos/' + p)),
      badge: { no: S.no, en: S.en },
      themeTags: V.tags,
      teaser: V.teaser,
      idealFor: V.ideal,
      overview: { no: `${BOOK_EARLY.no} ${S.note.no} ${V.overview.no}`, en: `${BOOK_EARLY.en} ${S.note.en} ${V.overview.en}` },
      highlights: [BOOK_EARLY, ...V.hi.map(h => P(h[0], h[1]))],
      itinerary: V.tl.map((r, i) => ({ day: i + 1, route: P(r[0], r[1]), text: P(r[2], r[3]) })),
      included: [...V.inc.map(p => P(p[0], p[1])), ...STD_INC.map(p => P(p[0], p[1]))],
      excluded: [...STD_EXC.map(p => P(p[0], p[1])), ...(V.exc || []).map(p => P(p[0], p[1]))],
    };
  }

  function build() {
    const now = new Date();
    const sel = pickSeason(now);
    const fmtNo = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long' });
    // All seasons (whole year), each with its next-occurring date window + 3 trips.
    const all = ORDER.map(k => {
      const inst = [-1, 0, 1].map(dy => { const y = now.getFullYear() + dy; const w = windowFor(k, y); return { y, s: w[0], e: w[1] }; });
      const cur = inst.find(x => now >= x.s && now <= x.e);
      const up = inst.filter(x => x.e >= now).sort((a, b) => a.s - b.s)[0] || inst[1];
      const pick = cur || up;
      const S = SEASONS_META[k];
      return {
        key: k, no: S.no, en: S.en, week: S.week,
        dateLabel: `${fmtNo.format(pick.s)} – ${fmtNo.format(pick.e)} ${pick.e.getFullYear()}`,
        upcoming: !!cur,
        trips: ['par', 'venner', 'familie'].map(vk => buildTrip(k, vk)),
      };
    });
    const defaultIdx = Math.max(0, ORDER.indexOf(sel.k));
    window.MS_SEASONS_ALL = all;
    window.MS_SEASON_DEFAULT_INDEX = defaultIdx;
    // Back-compat single-season exports (current/upcoming season).
    window.MS_SEASON_ITINS = all[defaultIdx].trips;
    window.MS_SEASON_META = { key: all[defaultIdx].key, no: all[defaultIdx].no, en: all[defaultIdx].en, week: all[defaultIdx].week, dateLabel: all[defaultIdx].dateLabel };
  }
  build();
})();
