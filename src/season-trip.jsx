// ============================================================
// Season Trip — Norwegian-calendar "event trip" of the moment.
// Picks the current OR next upcoming Norwegian school/Christian
// vacation, then features ONE themed trip for it with three
// itineraries (Par / Venner / Familie) and a "book early" notice.
// The featured trip rotates automatically with the calendar.
// Registers window.MS_SeasonTrip.
// ============================================================
(function () {
  const { useState, useMemo } = React;
  const MSctx = window.MS_CTX;

  // ── Easter (Gregorian computus) → drives Påske and the May cluster ──
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

  // Date window (recurring per year) for each Norwegian vacation.
  function windowFor(key, y) {
    switch (key) {
      case 'vinterferie': return [mk(y, 2, 14), mk(y, 3, 1)];     // uke 8–9
      case 'paske':       { const e = easter(y); return [addDays(e, -9), addDays(e, 1)]; }
      case 'mai':         return [mk(y, 5, 14), mk(y, 5, 20)];     // 17. mai-helgen
      case 'sommerferie': return [mk(y, 6, 28), mk(y, 8, 10)];     // fellesferien
      case 'hostferie':   return [mk(y, 9, 27), mk(y, 10, 12)];    // uke 40
      case 'jul':         return [mk(y, 12, 18), mk(y + 1, 1, 2)]; // jul & nyttår
    }
    return [mk(y, 1, 1), mk(y, 1, 1)];
  }
  const ORDER = ['vinterferie', 'paske', 'mai', 'sommerferie', 'hostferie', 'jul'];

  // Active window (today inside it) wins; else the soonest upcoming one.
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

  // tl row: [noTitle, enTitle, noText, enText] · hi row: [no, en]
  const SEASONS = {
    vinterferie: {
      no: 'Vinterferie', en: 'Winter break', week: 'Uke 8–9',
      title: { no: 'Vinterferie i sola', en: 'Winter break in the sun' },
      intro: { no: 'Bytt vinterkulda mot 20 varmegrader, palmer og Sahara — den perfekte flukten i vinterferien.', en: 'Swap the Norwegian cold for 20°C, palms and the Sahara — the perfect winter-break escape.' },
      img: 'assets/photos/sahara-dunes-10.jpg',
      variants: {
        par: { days: 4, eur: 890, who: { no: 'For to', en: 'For two' },
          pitch: { no: 'Privat ørkenromantikk: luksusleir i Merzouga, kamelritt i solnedgang og hele Melkeveien over teltet.', en: 'Private desert romance: a luxury Merzouga camp, a sunset camel trek and the full Milky Way over your tent.' },
          hi: [['Privat sjåfør hele veien', 'Private driver throughout'], ['Luksusleir med eget bad', 'Luxury en-suite camp'], ['Kamelritt i solnedgang', 'Sunset camel trek'], ['Stjernehimmel uten lysforurensning', 'Stargazing, zero light pollution']],
          tl: [['Marrakech → Atlas', 'Marrakech → Atlas', 'Over Tizi n’Tichka-passet og UNESCO-kasbahen Aït Ben Haddou.', 'Over the Tizi n’Tichka pass and the UNESCO kasbah of Aït Ben Haddou.'],
               ['Inn i Sahara', 'Into the Sahara', 'Dades- og Todra-kløftene, så kamelritt inn i Erg Chebbi til solnedgang.', 'Dades & Todra gorges, then a camel trek into Erg Chebbi at sunset.'],
               ['Sahara-soloppgang', 'Sahara sunrise', 'Soloppgang fra dynene, berberfrokost og fri dag i ørkenen.', 'Sunrise from the dunes, Berber breakfast and a free desert day.'],
               ['Tilbake til Marrakech', 'Back to Marrakech', 'Naturskjønn retur over Atlas, kveld på takterrasse i medinaen.', 'Scenic return over the Atlas, rooftop evening in the medina.']] },
        venner: { days: 4, eur: 790, who: { no: 'Vennegjengen', en: 'The friends' },
          pitch: { no: 'Adrenalin og ørken: quad og buggy i Agafay, festmiddag med Gnawa og en natt under stjernene.', en: 'Adrenaline and desert: quad and buggy in Agafay, a Gnawa feast and a night under the stars.' },
          hi: [['Quad & buggy i Agafay', 'Quad & buggy in Agafay'], ['Festmiddag med Gnawa-musikk', 'Feast with Gnawa music'], ['Takbar-kvelder i Marrakech', 'Rooftop-bar nights'], ['Ørkenleir for gjengen', 'Desert camp for the group']],
          tl: [['Ankomst & medina', 'Arrival & medina', 'Innsjekk i riad, kveld på Jemaa el-Fna og takbar.', 'Riad check-in, an evening on Jemaa el-Fna and a rooftop bar.'],
               ['Agafay adrenalin', 'Agafay adrenaline', 'Quad/buggy i steinørkenen, basseng og festmiddag med show.', 'Quad/buggy in the stone desert, pool and a dinner show.'],
               ['Ørkennatt', 'Desert night', 'Kamelritt, bål og Gnawa-trommer i luksusleir.', 'Camel ride, fire and Gnawa drums at a luxury camp.'],
               ['Souk & shopping', 'Souk & shopping', 'Guidet medina, souk-shopping og avskjedsmiddag.', 'Guided medina, souk shopping and a farewell dinner.']] },
        familie: { days: 5, eur: 720, who: { no: 'Hele familien', en: 'The whole family' },
          pitch: { no: 'Vintersol uten lange kjøreturer: basseng, kameler i Palmeraie og en trygg, barnevennlig ørkenleir.', en: 'Winter sun without long drives: pools, camels in the Palmeraie and a safe, kid-friendly desert camp.' },
          hi: [['Riad med basseng', 'Riad with a pool'], ['Kamelritt i Palmeraie', 'Camel ride in the Palmeraie'], ['Kort kjøring til Agafay', 'Short drive to Agafay'], ['Barnevennlig tempo', 'Kid-friendly pace']],
          tl: [['Ankomst Marrakech', 'Arrival Marrakech', 'Henting med navneskilt, riad med basseng og myntete.', 'Name-sign pickup, a riad with a pool and mint tea.'],
               ['Medina & Palmeraie', 'Medina & Palmeraie', 'Familievennlig byvandring og kamelritt i palmelunden.', 'Family-friendly city walk and a camel ride in the palm grove.'],
               ['Agafay-natt', 'Agafay night', 'Kort kjøretur til ørkenleir: basseng, middag og stjerner.', 'Short drive to a desert camp: pool, dinner and stars.'],
               ['Naturdag', 'Nature day', 'Ourika-dalen med fossefall og lunsj ved elven.', 'The Ourika valley with waterfalls and lunch by the river.'],
               ['Rolig avslutning', 'Easy finish', 'Basseng, siste shopping og transfer til flyplassen.', 'Pool, last shopping and the airport transfer.']] },
      },
    },
    paske: {
      no: 'Påske', en: 'Easter', week: 'Palmesøndag–2. påskedag',
      title: { no: 'Påske i Atlas & ørkenen', en: 'Easter in the Atlas & the desert' },
      intro: { no: 'Bruk påskeferien på blomstrende daler, snøkledde Atlas-topper og varme ørkenkvelder.', en: 'Spend Easter among blossoming valleys, snow-capped Atlas peaks and warm desert nights.' },
      img: 'assets/photos/atlas-lodge-05.webp',
      variants: {
        par: { days: 4, eur: 940, who: { no: 'For to', en: 'For two' },
          pitch: { no: 'En Atlas-lodge med utsikt, soloppgang i luftballong og en natt i Agafay — påskeromantikk i særklasse.', en: 'An Atlas lodge with a view, a sunrise balloon and a night in Agafay — Easter romance at its finest.' },
          hi: [['Luftballong ved soloppgang', 'Sunrise hot-air balloon'], ['Atlas-lodge med utsikt', 'Atlas lodge with a view'], ['Privat hammam', 'Private hammam'], ['Agafay-natt under stjernene', 'Agafay night under the stars']],
          tl: [['Ankomst & hammam', 'Arrival & hammam', 'Riad i medinaen, full hammam og rolig første kveld.', 'A medina riad, a full hammam and a calm first evening.'],
               ['Opp i Atlas', 'Up into the Atlas', 'Lodge i fjellene, vandring til berberlandsby og lunsj med utsikt.', 'A mountain lodge, a walk to a Berber village and lunch with a view.'],
               ['Ballong & Agafay', 'Balloon & Agafay', 'Soloppgang i ballong, så en natt i Agafay-leir.', 'A sunrise balloon, then a night at an Agafay camp.'],
               ['Medina-finale', 'Medina finale', 'Souker, Majorelle-hagen og avskjedsmiddag på taket.', 'Souks, the Majorelle garden and a rooftop farewell.']] },
        venner: { days: 5, eur: 860, who: { no: 'Vennegjengen', en: 'The friends' },
          pitch: { no: 'Trekking i Atlas, en Sahara-road trip og kvelder rundt bålet — den aktive påsketuren.', en: 'Atlas trekking, a Sahara road trip and nights around the fire — the active Easter trip.' },
          hi: [['Trekking i Atlas-dalene', 'Trekking in the Atlas valleys'], ['Sahara road trip', 'Sahara road trip'], ['Erg Chebbi-dynene', 'The Erg Chebbi dunes'], ['Bål & berbermusikk', 'Fire & Berber music']],
          tl: [['Ankomst Marrakech', 'Arrival Marrakech', 'Rooftop-kveld og planlegging over myntete.', 'A rooftop evening and planning over mint tea.'],
               ['Atlas-trekking', 'Atlas trekking', 'Dagstur i Imlil/Azzaden-dalen med fjellguide.', 'A day hike in the Imlil/Azzaden valley with a mountain guide.'],
               ['Mot Sahara', 'Toward the Sahara', 'Aït Ben Haddou og kløftene på vei til Merzouga.', 'Aït Ben Haddou and the gorges en route to Merzouga.'],
               ['Erg Chebbi', 'Erg Chebbi', 'Kamelritt, sandboarding og natt i ørkenleir.', 'Camel trek, sandboarding and a night at a desert camp.'],
               ['Retur', 'Return', 'Soloppgang i dynene og naturskjønn kjøretur tilbake.', 'Sunrise in the dunes and the scenic drive back.']] },
        familie: { days: 5, eur: 740, who: { no: 'Hele familien', en: 'The whole family' },
          pitch: { no: 'Grønne daler, fossefall og en trygg ørkennatt — påskeferie i rolig tempo for store og små.', en: 'Green valleys, waterfalls and a safe desert night — an easy-paced family Easter.' },
          hi: [['Ourika-dalens fossefall', 'Ourika valley waterfalls'], ['Kamelritt for barna', 'Camel ride for the kids'], ['Riad med basseng', 'Riad with a pool'], ['Kort kjøring hver dag', 'Short drives each day']],
          tl: [['Ankomst & basseng', 'Arrival & pool', 'Riad med basseng, myntete og en rolig kveld.', 'A riad with a pool, mint tea and an easy evening.'],
               ['Ourika-dalen', 'Ourika valley', 'Fossefall, elvelunsj og frisk fjelluft.', 'Waterfalls, riverside lunch and fresh mountain air.'],
               ['Agafay-natt', 'Agafay night', 'Kort kjøring til ørkenleir med basseng og kameler.', 'A short drive to a desert camp with a pool and camels.'],
               ['Medina-eventyr', 'Medina adventure', 'Souker, fortellere og gelato på Jemaa el-Fna.', 'Souks, storytellers and gelato on Jemaa el-Fna.'],
               ['Rolig avreise', 'Easy departure', 'Basseng om morgenen og transfer til flyplassen.', 'A morning by the pool and the airport transfer.']] },
      },
    },
    mai: {
      no: '17. mai-helgen', en: 'The May long weekend', week: 'Langhelg i mai',
      title: { no: 'Forleng 17. mai i Marrakech', en: 'Stretch the May weekend in Marrakech' },
      intro: { no: 'En lang mai-helg er nok til et solfylt byeventyr — feir våren med palmer, souker og mynte-te.', en: 'A long May weekend is all it takes for a sun-soaked city break — palms, souks and mint tea.' },
      img: 'assets/photos/medina-koutoubia-dusk-18.jpg',
      variants: {
        par: { days: 3, eur: 690, who: { no: 'For to', en: 'For two' },
          pitch: { no: 'Riad, hammam og én natt i Agafay — en kort, romantisk byflukt over langhelgen.', en: 'A riad, a hammam and one night in Agafay — a short, romantic city escape over the long weekend.' },
          hi: [['Luksusriad i medinaen', 'Luxury medina riad'], ['Privat hammam', 'Private hammam'], ['Agafay-natt', 'Agafay night'], ['Takterrasse-middag', 'Rooftop dinner']],
          tl: [['Ankomst & medina', 'Arrival & medina', 'Riad, hammam og kveld blant lanternene.', 'Riad, hammam and an evening among the lanterns.'],
               ['Agafay', 'Agafay', 'Kort transfer til ørkenleir: basseng, middag og stjerner.', 'A short transfer to a desert camp: pool, dinner and stars.'],
               ['Souker & hjem', 'Souks & home', 'Guidet medina, siste shopping og transfer.', 'Guided medina, last shopping and transfer.']] },
        venner: { days: 3, eur: 640, who: { no: 'Vennegjengen', en: 'The friends' },
          pitch: { no: 'Medina, takbarer og en dose Agafay-adrenalin — den perfekte langhelg-byturen.', en: 'Medina, rooftop bars and a hit of Agafay adrenaline — the perfect long-weekend city trip.' },
          hi: [['Jemaa el-Fna om kvelden', 'Jemaa el-Fna by night'], ['Quad i Agafay', 'Quad in Agafay'], ['Takbarer', 'Rooftop bars'], ['Souk-shopping', 'Souk shopping']],
          tl: [['Ankomst', 'Arrival', 'Rooftop-kveld og street food på Jemaa el-Fna.', 'A rooftop evening and street food on Jemaa el-Fna.'],
               ['Agafay-dagen', 'Agafay day', 'Quad/buggy, basseng og festmiddag med show.', 'Quad/buggy, pool and a dinner show.'],
               ['Souk & hjem', 'Souk & home', 'Shopping i souken og avskjedslunsj.', 'Shopping in the souk and a farewell lunch.']] },
        familie: { days: 4, eur: 720, who: { no: 'Hele familien', en: 'The whole family' },
          pitch: { no: 'En rolig byferie med basseng, kameler i Palmeraien og masse å oppdage for barna.', en: 'A relaxed city break with a pool, camels in the Palmeraie and plenty for kids to discover.' },
          hi: [['Riad med basseng', 'Riad with a pool'], ['Kamelritt i Palmeraien', 'Camel ride in the Palmeraie'], ['Fortellere på Jemaa el-Fna', 'Storytellers on Jemaa el-Fna'], ['Rolig tempo', 'Relaxed pace']],
          tl: [['Ankomst & basseng', 'Arrival & pool', 'Riad med basseng og en rolig første kveld.', 'A riad with a pool and an easy first evening.'],
               ['Medina & Palmeraie', 'Medina & Palmeraie', 'Byvandring og kamelritt i palmelunden.', 'A city walk and a camel ride in the palm grove.'],
               ['Naturdag', 'Nature day', 'Utflukt til Ourika-dalen med fossefall.', 'A trip to the Ourika valley with waterfalls.'],
               ['Avreise', 'Departure', 'Basseng om morgenen og transfer til flyplassen.', 'A morning by the pool and the airport transfer.']] },
      },
    },
    sommerferie: {
      no: 'Sommerferie', en: 'Summer break', week: 'Fellesferien · uke 28–30',
      title: { no: 'Sommerferie i Marokko', en: 'Summer holiday in Morocco' },
      intro: { no: 'Norges fellesferie møter Atlanterhavskysten og Marrakech — sol fra morgen til kveld, strand, basseng og ørken i ett.', en: 'Norway’s common holiday meets the Atlantic coast and Marrakech — sun all day, beach, pool and desert in one.' },
      img: 'assets/photos/essaouira-beach-horse-01.jpg',
      variants: {
        par: { days: 5, eur: 980, who: { no: 'For to', en: 'For two' },
          pitch: { no: 'Kyst og kasbah for to: riad i Marrakech, Essaouiras blå båter og en sommernatt i Agafay.', en: 'Coast and kasbah for two: a Marrakech riad, Essaouira’s blue boats and a summer night in Agafay.' },
          hi: [['Riad med basseng', 'Riad with a pool'], ['Essaouira-kysten', 'The Essaouira coast'], ['Ridning i solnedgang', 'Sunset horse riding'], ['Agafay-natt', 'Agafay night']],
          tl: [['Ankomst Marrakech', 'Arrival Marrakech', 'Riad med basseng, hammam og kveld i medinaen.', 'A riad with a pool, a hammam and an evening in the medina.'],
               ['Essaouira', 'Essaouira', 'Kjør til kysten: blå båter, sjømat og ridning på stranden ved solnedgang.', 'Drive to the coast: blue boats, seafood and sunset horse riding on the beach.'],
               ['Agafay-natt', 'Agafay night', 'Basseng om dagen, middag og stjerner i ørkenleir.', 'Pool by day, dinner and stars at a desert camp.'],
               ['Marrakech', 'Marrakech', 'Majorelle, souker og avskjedsmiddag på taket.', 'Majorelle, souks and a rooftop farewell dinner.']] },
        venner: { days: 5, eur: 890, who: { no: 'Vennegjengen', en: 'The friends' },
          pitch: { no: 'Surf, quad og nattliv: Taghazout-bølger, Agafay-adrenalin og takbarer i Marrakech.', en: 'Surf, quad and nightlife: Taghazout waves, Agafay adrenaline and Marrakech rooftops.' },
          hi: [['Surf i Taghazout', 'Surf in Taghazout'], ['Quad & buggy i Agafay', 'Quad & buggy in Agafay'], ['Strandbarer', 'Beach bars'], ['Takbar-kvelder', 'Rooftop nights']],
          tl: [['Ankomst', 'Arrival', 'Rooftop og Jemaa el-Fna om kvelden.', 'A rooftop and Jemaa el-Fna in the evening.'],
               ['Agafay', 'Agafay', 'Quad/buggy, basseng og festmiddag med Gnawa.', 'Quad/buggy, pool and a Gnawa feast.'],
               ['Kysten', 'The coast', 'Taghazout: surf, strandbar og solnedgang.', 'Taghazout: surf, a beach bar and the sunset.'],
               ['Marrakech', 'Marrakech', 'Souk-shopping og siste takbar-kveld.', 'Souk shopping and a last rooftop night.']] },
        familie: { days: 6, eur: 760, who: { no: 'Hele familien', en: 'The whole family' },
          pitch: { no: 'Strand og basseng for hele familien: dager ved Atlanterhavet i Agadir og et fargerikt Marrakech-eventyr.', en: 'Beach and pool for the whole family: Atlantic days in Agadir and a colourful Marrakech adventure.' },
          hi: [['Strandhotell i Agadir', 'Beach hotel in Agadir'], ['Barnebasseng', 'Kids’ pool'], ['Kamelritt i Palmeraien', 'Camel ride in the Palmeraie'], ['Kort kjøring', 'Short drives']],
          tl: [['Ankomst Agadir', 'Arrival Agadir', 'Strandhotell, basseng og første bad i Atlanterhavet.', 'A beach hotel, the pool and a first dip in the Atlantic.'],
               ['Strand & basseng', 'Beach & pool', 'Late dager på stranden og i barnebassenget.', 'Lazy days on the beach and in the kids’ pool.'],
               ['Paradisdalen', 'Paradise valley', 'Trygg natur, fossefall og lunsj ved vannet.', 'Safe nature, waterfalls and lunch by the water.'],
               ['Mot Marrakech', 'To Marrakech', 'Transfer til den røde byen og kveld i medinaen.', 'Transfer to the red city and an evening in the medina.'],
               ['Marrakech-eventyr', 'Marrakech adventure', 'Kamelritt i Palmeraien, gelato og fortellere.', 'Camel ride in the Palmeraie, gelato and storytellers.'],
               ['Avreise', 'Departure', 'Basseng om morgenen og transfer til flyplassen.', 'A morning by the pool and the airport transfer.']] },
      },
    },
    hostferie: {
      no: 'Høstferie', en: 'Autumn break', week: 'Uke 40',
      title: { no: 'Høstferie i Atlas & Sahara', en: 'Autumn break in the Atlas & Sahara' },
      intro: { no: 'Høstferiens beste vær i Marokko — klar luft, behagelig varme og gylne dyner i den fineste sesongen.', en: 'The best autumn-break weather in Morocco — clear air, comfortable heat and golden dunes in the finest season.' },
      img: 'assets/photos/atlas-mountains-13.jpg',
      variants: {
        par: { days: 4, eur: 910, who: { no: 'For to', en: 'For two' },
          pitch: { no: 'Atlas-lodge og en natt i Merzouga: klar høstluft, gylne dyner og stjernehimmel for to.', en: 'An Atlas lodge and a night in Merzouga: clear autumn air, golden dunes and starry skies for two.' },
          hi: [['Atlas-lodge', 'Atlas lodge'], ['Merzouga luksusleir', 'Merzouga luxury camp'], ['Kamelritt i solnedgang', 'Sunset camel trek'], ['Privat sjåfør', 'Private driver']],
          tl: [['Marrakech → Atlas', 'Marrakech → Atlas', 'Tizi n’Tichka og Aït Ben Haddou på vei østover.', 'Tizi n’Tichka and Aït Ben Haddou heading east.'],
               ['Inn i Sahara', 'Into the Sahara', 'Dades & Todra, så kamelritt inn i dynene.', 'Dades & Todra, then a camel trek into the dunes.'],
               ['Soloppgang', 'Sunrise', 'Soloppgang over Erg Chebbi og fri ørkendag.', 'Sunrise over Erg Chebbi and a free desert day.'],
               ['Retur', 'Return', 'Naturskjønn kjøretur tilbake til Marrakech.', 'The scenic drive back to Marrakech.']] },
        venner: { days: 5, eur: 880, who: { no: 'Vennegjengen', en: 'The friends' },
          pitch: { no: 'Den store Sahara-road tripen: kløfter, kasbaher, dyner og bål — høstferiens eventyr.', en: 'The big Sahara road trip: gorges, kasbahs, dunes and fire — the autumn-break adventure.' },
          hi: [['Sahara road trip', 'Sahara road trip'], ['Sandboarding', 'Sandboarding'], ['Kasbaher & kløfter', 'Kasbahs & gorges'], ['Bål & musikk', 'Fire & music']],
          tl: [['Ankomst & medina', 'Arrival & medina', 'Rooftop-kveld og planlegging i den røde byen.', 'A rooftop evening and planning in the red city.'],
               ['Mot ørkenen', 'Toward the desert', 'Aït Ben Haddou og Dades-dalen.', 'Aït Ben Haddou and the Dades valley.'],
               ['Erg Chebbi', 'Erg Chebbi', 'Todra-kløften, kamelritt og natt i leiren.', 'Todra gorge, a camel trek and a night at camp.'],
               ['Ørkendag', 'Desert day', 'Sandboarding, quad og andre solnedgang i dynene.', 'Sandboarding, quads and a second sunset in the dunes.'],
               ['Retur', 'Return', 'Lang naturskjønn kjøretur tilbake.', 'The long scenic drive back.']] },
        familie: { days: 5, eur: 730, who: { no: 'Hele familien', en: 'The whole family' },
          pitch: { no: 'Ørken i barnevennlig tempo: Marrakech, kameler og en trygg natt i Agafay eller Zagora.', en: 'Desert at a kid-friendly pace: Marrakech, camels and a safe night in Agafay or Zagora.' },
          hi: [['Riad med basseng', 'Riad with a pool'], ['Kamelritt for barna', 'Camel ride for the kids'], ['Kort kjøring', 'Short drives'], ['Ørkenleir med basseng', 'Desert camp with a pool']],
          tl: [['Ankomst Marrakech', 'Arrival Marrakech', 'Riad med basseng og en rolig første kveld.', 'A riad with a pool and an easy first evening.'],
               ['Medina & Palmeraie', 'Medina & Palmeraie', 'Familievandring og kamelritt i palmelunden.', 'A family walk and a camel ride in the palm grove.'],
               ['Agafay-natt', 'Agafay night', 'Kort kjøring til ørkenleir med basseng og stjerner.', 'A short drive to a desert camp with a pool and stars.'],
               ['Naturdag', 'Nature day', 'Ourika-dalen med fossefall og elvelunsj.', 'The Ourika valley with waterfalls and a riverside lunch.'],
               ['Avreise', 'Departure', 'Basseng og siste shopping før transfer.', 'Pool time and last shopping before the transfer.']] },
      },
    },
    jul: {
      no: 'Jul & nyttår', en: 'Christmas & New Year', week: '20. des–2. jan',
      title: { no: 'Jul & nyttår i Marrakech', en: 'Christmas & New Year in Marrakech' },
      intro: { no: 'Feir høytiden i 20 varmegrader — festkledde riads, ørkenfest til nyttår og en jul helt utenom det vanlige.', en: 'Celebrate the holidays at 20°C — festive riads, a desert New Year and a Christmas like no other.' },
      img: 'assets/photos/medina-lanterns-25.jpg',
      variants: {
        par: { days: 5, eur: 1190, who: { no: 'For to', en: 'For two' },
          pitch: { no: 'Romantisk nyttår i ørkenen: luksusriad, Merzouga og en nyttårsfeiring under Saharas stjerner.', en: 'A romantic New Year in the desert: a luxury riad, Merzouga and a New Year under Saharan stars.' },
          hi: [['Festkledd luksusriad', 'Festive luxury riad'], ['Nyttårsfest i ørkenleir', 'New Year at a desert camp'], ['Kamelritt i solnedgang', 'Sunset camel trek'], ['Privat sjåfør', 'Private driver']],
          tl: [['Ankomst & riad', 'Arrival & riad', 'Festkledd riad, hammam og kveld i medinaen.', 'A festive riad, a hammam and an evening in the medina.'],
               ['Mot Sahara', 'Toward the Sahara', 'Aït Ben Haddou og kløftene østover.', 'Aït Ben Haddou and the gorges heading east.'],
               ['Nyttår i dynene', 'New Year in the dunes', 'Kamelritt, gallamiddag og nyttårsfeiring i leiren.', 'A camel trek, a gala dinner and a New Year celebration at camp.'],
               ['Soloppgang', 'Sunrise', 'Første soloppgang i det nye året over Erg Chebbi.', 'The year’s first sunrise over Erg Chebbi.'],
               ['Retur', 'Return', 'Naturskjønn kjøretur tilbake til Marrakech.', 'The scenic drive back to Marrakech.']] },
        venner: { days: 5, eur: 1090, who: { no: 'Vennegjengen', en: 'The friends' },
          pitch: { no: 'Nyttårsfeiring i Agafay: gallamiddag, Gnawa, ildshow og DJ under stjernene.', en: 'New Year in Agafay: a gala dinner, Gnawa, a fire show and a DJ under the stars.' },
          hi: [['Agafay nyttårsgalla', 'Agafay New Year gala'], ['Ildshow & DJ', 'Fire show & DJ'], ['Takbarer i Marrakech', 'Marrakech rooftops'], ['Ørkenleir for gjengen', 'Desert camp for the group']],
          tl: [['Ankomst', 'Arrival', 'Rooftop-kveld og festlig medina.', 'A rooftop evening and a festive medina.'],
               ['Medina & souker', 'Medina & souks', 'Guidet medina, souk-shopping og takbar.', 'Guided medina, souk shopping and a rooftop bar.'],
               ['Nyttårsaften i Agafay', 'New Year’s Eve in Agafay', 'Gallamiddag, Gnawa, ildshow og DJ til midnatt.', 'A gala dinner, Gnawa, a fire show and a DJ to midnight.'],
               ['Nyttårsdag', 'New Year’s Day', 'Sen frokost, basseng og rolig retur til byen.', 'A late breakfast, the pool and an easy return to the city.'],
               ['Avreise', 'Departure', 'Siste shopping og transfer til flyplassen.', 'Last shopping and the airport transfer.']] },
        familie: { days: 6, eur: 980, who: { no: 'Hele familien', en: 'The whole family' },
          pitch: { no: 'En annerledes familiejul: festkledd riad, kameler, basseng og en magisk ørkennatt.', en: 'A different family Christmas: a festive riad, camels, pools and one magical desert night.' },
          hi: [['Festkledd riad med basseng', 'Festive riad with a pool'], ['Kamelritt i Palmeraien', 'Camel ride in the Palmeraie'], ['Agafay-natt', 'Agafay night'], ['Barnevennlig tempo', 'Kid-friendly pace']],
          tl: [['Ankomst Marrakech', 'Arrival Marrakech', 'Festkledd riad med basseng og myntete.', 'A festive riad with a pool and mint tea.'],
               ['Julaften i medinaen', 'Christmas Eve in the medina', 'Fortellere, lanterner og familiemiddag.', 'Storytellers, lanterns and a family dinner.'],
               ['Palmeraie', 'Palmeraie', 'Kamelritt og rolig dag ved bassenget.', 'A camel ride and an easy day by the pool.'],
               ['Agafay-natt', 'Agafay night', 'Kort kjøring til ørkenleir: middag og stjerner.', 'A short drive to a desert camp: dinner and stars.'],
               ['Naturdag', 'Nature day', 'Ourika-dalen med fossefall og snø på toppene.', 'The Ourika valley with waterfalls and snow on the peaks.'],
               ['Avreise', 'Departure', 'Basseng og transfer til flyplassen.', 'Pool time and the airport transfer.']] },
      },
    },
  };

  const VKEYS = ['par', 'venner', 'familie'];
  const VLABEL = { par: { no: 'Par', en: 'Couple' }, venner: { no: 'Venner', en: 'Friends' }, familie: { no: 'Familie', en: 'Family' } };

  function SeasonTrip() {
    const ctx = (MSctx && MSctx.useMS) ? MSctx.useMS() : { lang: 'no' };
    const lang = ctx.lang || 'no';
    const price = (MSctx && MSctx.usePrice) ? MSctx.usePrice() : (e => '€' + e);
    const isNo = (lang === 'no' || lang === 'sv' || lang === 'da');
    const T = (no, en) => (isNo ? no : en);

    const sel = useMemo(() => pickSeason(new Date()), []);
    const S = SEASONS[sel.k];
    const [who, setWho] = useState('par');
    if (!S) return null;
    const v = S.variants[who];

    const fmt = new Intl.DateTimeFormat(isNo ? 'nb-NO' : 'en-GB', { day: 'numeric', month: 'long' });
    const dateLabel = `${fmt.format(sel.s)} – ${fmt.format(sel.e)} ${sel.e.getFullYear()}`;

    const goPlan = () => {
      const el = document.querySelector('#plan') || document.querySelector('#contact');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
      <section className="season reveal" id="season-trip" style={{ '--season-img': `url(${S.img})` }}>
        <div className="season-card">
          <div className="season-ribbon">{T('Sesongens ferietur', 'This season’s trip')}</div>

          <div className="season-head">
            <div className="season-meta">
              <span className="season-chip season-chip-when">{T(S.no, S.en)} · {S.week}</span>
              <span className="season-chip season-chip-date">{dateLabel}</span>
            </div>
            <h2 className="season-title">{S.title[isNo ? 'no' : 'en']}</h2>
            <p className="season-intro">{S.intro[isNo ? 'no' : 'en']}</p>

            <div className="season-bookearly">
              <span className="season-be-dot" aria-hidden="true"></span>
              <strong>{T('Book i god tid', 'Book well in advance')}</strong>
              <span>{T('Norske skoleferier og flyseter fylles raskt — vi tar et begrenset antall reisende per periode.', 'Norwegian school holidays and flights fill fast — we take a limited number of travellers per period.')}</span>
            </div>
          </div>

          <div className="season-tabs" role="tablist" aria-label={T('Velg reisefølge', 'Choose your group')}>
            {VKEYS.map(k => (
              <button key={k} role="tab" aria-selected={who === k}
                className={`season-tab ${who === k ? 'active' : ''}`}
                onClick={() => setWho(k)}>
                {VLABEL[k][isNo ? 'no' : 'en']}
                <span className="season-tab-sub">{S.variants[k].who[isNo ? 'no' : 'en']}</span>
              </button>
            ))}
          </div>

          <div className="season-body">
            <div className="season-pitch-row">
              <p className="season-pitch">{v.pitch[isNo ? 'no' : 'en']}</p>
              <div className="season-priceblock">
                <span className="season-price-label">{T('Fra', 'From')}</span>
                <span className="season-price">{price(v.eur)}</span>
                <span className="season-price-unit">{T('per person · ' + v.tl.length + ' dager', 'per person · ' + v.tl.length + ' days')}</span>
              </div>
            </div>

            <div className="season-chips">
              {v.hi.map((h, i) => <span key={i} className="season-hi">{h[isNo ? 0 : 1]}</span>)}
            </div>

            <ol className="season-timeline">
              {v.tl.map((row, i) => (
                <li key={i} className="season-day">
                  <span className="season-day-n">{T('Dag', 'Day')} {i + 1}</span>
                  <div className="season-day-body">
                    <strong className="season-day-title">{row[isNo ? 0 : 1]}</strong>
                    <span className="season-day-text">{row[isNo ? 2 : 3]}</span>
                  </div>
                </li>
              ))}
            </ol>

            <div className="season-cta">
              <button className="season-btn season-btn-primary" onClick={goPlan}>
                {T('Planlegg ' + S.no.toLowerCase(), 'Plan ' + S.en.toLowerCase())} →
              </button>
              <a className="season-btn season-btn-ghost"
                 href={`https://wa.me/4745774743?text=${encodeURIComponent(T('Hei! Jeg ønsker ' + S.no + '-turen (' + VLABEL[who].no + ') — kan dere sende mer info?', 'Hi! I’m interested in the ' + S.en + ' trip (' + VLABEL[who].en + ') — could you send more info?'))}`}
                 target="_blank" rel="noopener">
                {T('Spør på WhatsApp', 'Ask on WhatsApp')}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  window.MS_SeasonTrip = SeasonTrip;
})();
