const { useState: useStateIt, useRef: useRefIt, useEffect: useEffectIt, useMemo: useMemoIt } = React;
const Iit = window.MS_I;
const STANDARD_TERMS = {
  en: [
    "30% deposit at booking via secure payment link; balance due 30 days before departure.",
    "Free cancellation up to 30 days before departure. 50% from 30\u201314 days. No refund within 14 days.",
    "Prices in EUR per person, based on two travellers sharing a room. Single supplement on request.",
    "Minimum 2 travellers per itinerary. Children from age 6 unless noted otherwise.",
    "Includes a private driver-guide on all transfers \u2014 never shared with another group.",
    "Travel insurance is strongly recommended. We can suggest a partner if needed.",
    "Itinerary is fully customisable \u2014 pace, hotels and stops can be adjusted at planning stage.",
    "Reply within 24 hours via email or WhatsApp (+47 457 74 743)."
  ],
  no: [
    "30 % depositum ved booking via sikker betalingslenke; resten betales 30 dager f\xF8r avreise.",
    "Gratis avbestilling inntil 30 dager f\xF8r avreise. 50 % fra 30\u201314 dager. Ingen refusjon innen 14 dager.",
    "Priser i EUR per person, basert p\xE5 to reisende som deler rom. Singeltillegg p\xE5 foresp\xF8rsel.",
    "Minimum 2 reisende per reiseplan. Barn fra 6 \xE5r dersom ikke annet er oppgitt.",
    "Inkluderer privat sj\xE5f\xF8r-guide p\xE5 alle transferer \u2014 aldri delt med andre grupper.",
    "Reiseforsikring anbefales sterkt. Vi kan foresl\xE5 en partner ved behov.",
    "Reiseplanen er fullt tilpassbar \u2014 tempo, hoteller og stopp kan justeres under planlegging.",
    "Svar innen 24 timer via e-post eller WhatsApp (+47 457 74 743)."
  ],
  fr: [
    "30 % d'acompte \xE0 la r\xE9servation via lien s\xE9curis\xE9 ; solde d\xFB 30 jours avant le d\xE9part.",
    "Annulation gratuite jusqu'\xE0 30 jours avant le d\xE9part. 50 % entre 30 et 14 jours. Aucun remboursement \xE0 moins de 14 jours.",
    "Prix en EUR par personne, sur base de deux voyageurs en chambre double. Suppl\xE9ment single sur demande.",
    "Minimum 2 voyageurs par itin\xE9raire. Enfants \xE0 partir de 6 ans sauf indication contraire.",
    "Inclut un chauffeur-guide priv\xE9 sur tous les transferts \u2014 jamais partag\xE9 avec un autre groupe.",
    "Une assurance voyage est fortement recommand\xE9e. Nous pouvons sugg\xE9rer un partenaire.",
    "Itin\xE9raire enti\xE8rement personnalisable \u2014 rythme, h\xF4tels et \xE9tapes ajustables en planification.",
    "R\xE9ponse sous 24 h par e-mail ou WhatsApp (+47 457 74 743)."
  ],
  sv: [
    "30 % deposition vid bokning via s\xE4ker betalningsl\xE4nk; resterande belopp betalas 30 dagar f\xF6re avresa.",
    "Kostnadsfri avbokning upp till 30 dagar f\xF6re avresa. 50 % fr\xE5n 30\u201314 dagar. Ingen \xE5terbetalning inom 14 dagar.",
    "Priser i EUR per person, baserat p\xE5 tv\xE5 resen\xE4rer som delar rum. Enkelrumstill\xE4gg p\xE5 beg\xE4ran.",
    "Minst 2 resen\xE4rer per resplan. Barn fr\xE5n 6 \xE5r om inget annat anges.",
    "Inkluderar privat chauff\xF6r-guide p\xE5 alla transfers \u2014 aldrig delad med en annan grupp.",
    "Resef\xF6rs\xE4kring rekommenderas starkt. Vi kan f\xF6resl\xE5 en partner vid behov.",
    "Resplanen \xE4r fullt anpassningsbar \u2014 tempo, hotell och stopp kan justeras under planeringsstadiet.",
    "Svar inom 24 timmar via e-post eller WhatsApp (+47 457 74 743)."
  ]
};
const MOST_BOOKED = function() {
  const D = window.MS_DATA || {};
  const pkgs = (D.PACKAGES || []).filter((p) => p.id && p.title && Array.isArray(p.timeline));
  return pkgs.map((p, i) => {
    var _a;
    const days = p.days || ((_a = p.timeline) == null ? void 0 : _a.length) || 0;
    const nights = p.nights || Math.max(0, days - 1);
    const dur = `${days}D${nights}N`;
    const sentences = (p.description || "").split(/(?<=[.!?])\s+/);
    const teaser = (sentences[0] || p.description || "").slice(0, 200);
    const itin = (p.timeline || []).map((d, di) => ({
      day: d.day || di + 1,
      route: d.title || d.label || `Day ${di + 1}`,
      text: d.desc || (d.items ? d.items.join(" \xB7 ") : "")
    }));
    const highlights = [];
    for (const d of p.timeline || []) {
      for (const it of d.items || []) {
        if (highlights.length < 6) highlights.push(it);
      }
    }
    const priceMap = { "Lang helg": 590, "Mest bestilt": 790, "Signaturreise": 1190, "Premium": 1890, "Dr\xF8mmereise": 2890 };
    const priceFromEUR = priceMap[p.label] || 600 + i * 300;
    const tagJoin = (p.tags || []).join(" ").toLowerCase();
    let img = "assets/photos/agafay-12.jpg";
    if (/imperialbyene|fes|casablanca|rabat/.test(tagJoin)) img = "assets/photos/about-09.webp";
    else if (/sahara|merzouga/.test(tagJoin)) img = "assets/photos/sahara-dunes-10.jpg";
    else if (/atlas/.test(tagJoin)) img = "assets/photos/atlas-lodge-05.webp";
    else if (/essaouira|coast|agadir|strand/.test(tagJoin)) img = "assets/photos/essaouira-beach-horse-01.jpg";
    else if (/medina|riad|kultur/.test(tagJoin)) img = "assets/photos/about-10.webp";
    return {
      slug: p.id,
      chapter: "00",
      // not really a chapter, but keeps shape consistent
      title: p.title,
      duration: dur,
      days,
      nights,
      route: "Marrakech \u2192 Marrakech",
      priceFromEUR,
      img,
      badge: "MOST BOOKED",
      themeTags: p.tags || [],
      teaser,
      overview: p.description || "",
      highlights,
      itinerary: itin,
      included: p.included || [],
      excluded: p.notIncluded || []
    };
  });
}();
const ITINS = [
  // ===== Chapter 01 — 3D2N — Merzouga Sahara Expedition =====
  {
    slug: "merzouga-sahara-escape",
    chapter: "01",
    title: { en: "Merzouga Sahara Expedition", no: "Merzouga Sahara-ekspedisjon", fr: "Exp\xE9dition Sahara Merzouga" },
    duration: "3D2N",
    days: 3,
    nights: 2,
    route: "Marrakech \u2192 Tizi n'Tichka \u2192 A\xEFt Ben Haddou \u2192 Ouarzazate \u2192 Dades \u2192 Todra \u2192 Merzouga \u2192 Marrakech",
    priceFromEUR: 320.7,
    // ×1.4 display markup ≈ €449 / person (VAT included)
    img: "assets/photos/sahara-dunes-ripples-13.jpg",
    badge: { en: "SAHARA", no: "SAHARA", fr: "SAHARA" },
    themeTags: ["Sahara", "Erg Chebbi", "Dades", "Todra", "Camel"],
    teaser: { en: "Three days to the real Sahara \u2014 the towering golden dunes of Erg Chebbi, a night of total silence, and a sunrise most people only see in photographs.", no: "Tre dager til det ekte Sahara \u2014 de ruvende gylne dynene ved Erg Chebbi, en natt med total stillhet, og en soloppgang de fleste bare ser p\xE5 bilder.", fr: "Trois jours vers le vrai Sahara \u2014 les hautes dunes dor\xE9es de l'Erg Chebbi, une nuit de silence total et un lever de soleil que la plupart ne voient qu'en photo." },
    overview: { en: "The longest and most rewarding desert journey we offer as a short trip. Two full days on the road, but the payoff is the genuine Sahara \u2014 towering golden dunes, a night of total silence, and a sunrise most people only see in photographs. Group size 1\u20138 in a private vehicle throughout. Pacing: two long driving days (5\u20138h each) \u2014 the trade-off for reaching the real Erg Chebbi dunes (clients wanting less driving should consider Agafay, 45 min, or Zagora, 2D/1N). Best season: March\u2013May and September\u2013November; desert nights are cold December\u2013February, so pack layers.", no: "Den lengste og mest givende \xF8rkenreisen vi tilbyr som kort tur. To fulle dager p\xE5 veien, men bel\xF8nningen er det ekte Sahara \u2014 ruvende gylne dyner, en natt med total stillhet, og en soloppgang de fleste bare ser p\xE5 bilder. Gruppest\xF8rrelse 1\u20138 i privat bil hele veien. Tempo: to lange kj\xF8redager (5\u20138t hver) \u2014 kompromisset for \xE5 n\xE5 de ekte Erg Chebbi-dynene (vil du kj\xF8re mindre, vurder Agafay, 45 min, eller Zagora, 2D/1N). Beste sesong: mars\u2013mai og september\u2013november; \xF8rkennetter er kalde desember\u2013februar, s\xE5 ta med lag.", fr: "Le voyage dans le d\xE9sert le plus long et le plus gratifiant que nous proposons en court s\xE9jour. Deux journ\xE9es compl\xE8tes de route, mais la r\xE9compense est le vrai Sahara \u2014 hautes dunes dor\xE9es, une nuit de silence total et un lever de soleil que la plupart ne voient qu'en photo. Groupe de 1 \xE0 8 en v\xE9hicule priv\xE9 tout au long. Rythme : deux longues journ\xE9es de route (5\u20138h chacune) \u2014 le compromis pour atteindre les vraies dunes de l'Erg Chebbi (pour moins de route, voir l'Agafay, 45 min, ou Zagora, 2J/1N). Meilleure saison : mars\u2013mai et septembre\u2013novembre ; nuits froides de d\xE9cembre \xE0 f\xE9vrier, pr\xE9voir des couches." },
    idealFor: { en: "Travellers who want the real Sahara \u2014 the big dunes of Erg Chebbi, not the closer Agafay or Zagora \xB7 couples \xB7 adventurous families \xB7 photographers", no: "Reisende som vil ha det ekte Sahara \u2014 de store dynene ved Erg Chebbi, ikke n\xE6rmere Agafay eller Zagora \xB7 par \xB7 eventyrlystne familier \xB7 fotografer", fr: "Voyageurs en qu\xEAte du vrai Sahara \u2014 les grandes dunes de l'Erg Chebbi, pas l'Agafay ou Zagora plus proches \xB7 couples \xB7 familles aventureuses \xB7 photographes" },
    highlights: [
      { en: "Tizi n'Tichka pass (2,260m) \u2014 the highest road pass in Morocco", no: "Tizi n'Tichka-passet (2 260m) \u2014 Marokkos h\xF8yeste veipass", fr: "Col du Tizi n'Tichka (2 260m) \u2014 le plus haut col routier du Maroc" },
      { en: "A\xEFt Ben Haddou \u2014 UNESCO kasbah (Gladiator \xB7 Game of Thrones \xB7 Babel)", no: "A\xEFt Ben Haddou \u2014 UNESCO-kasbah (Gladiator \xB7 Game of Thrones \xB7 Babel)", fr: "A\xEFt Ben Haddou \u2014 kasbah UNESCO (Gladiator \xB7 Game of Thrones \xB7 Babel)" },
      { en: "Dades & Todra Gorges \u2014 300m cliffs and the winding switchback road", no: "Dades- og Todra-kl\xF8ftene \u2014 300m klipper og den buktende serpentinveien", fr: "Gorges du Dad\xE8s & du Todra \u2014 falaises de 300m et la route en lacets" },
      { en: "Camel trek into the Erg Chebbi dunes at sunset", no: "Kamelritt inn i Erg Chebbi-dynene ved solnedgang", fr: "Randonn\xE9e \xE0 dos de chameau dans les dunes de l'Erg Chebbi au coucher du soleil" },
      { en: "Luxury desert camp \u2014 Berber drums, fire and the full Milky Way", no: "Luksus\xF8rkenleir \u2014 berbertrommer, b\xE5l og hele Melkeveien", fr: "Camp d\xE9sertique de luxe \u2014 tambours berb\xE8res, feu et toute la Voie Lact\xE9e" },
      { en: "Sahara sunrise from the dunes \u2014 the unmissable moment", no: "Sahara-soloppgang fra dynene \u2014 \xF8yeblikket du ikke f\xE5r g\xE5 glipp av", fr: "Lever de soleil au Sahara depuis les dunes \u2014 le moment \xE0 ne pas manquer" }
    ],
    itinerary: [
      { day: 1, route: { en: "Marrakech \u2192 Atlas \u2192 Dades Valley", no: "Marrakech \u2192 Atlas \u2192 Dades-dalen", fr: "Marrakech \u2192 Atlas \u2192 Vall\xE9e du Dad\xE8s" }, text: { en: "07:00 Driver pickup at your riad or hotel \u2014 early start for the long scenic drive. 07:15\u201309:30 Climb the Tizi n'Tichka pass (2,260m), the highest road pass in Morocco \u2014 photo stop at the summit with sweeping High Atlas views. 10:30\u201312:00 A\xEFt Ben Haddou, the UNESCO kasbah and filming location for Gladiator and Game of Thrones \u2014 a local guide walks you through the earthen city. 12:00\u201313:30 Ouarzazate for lunch (at leisure), with an optional Atlas Film Studios visit. 13:30\u201315:30 Drive through the Draa Valley and the rose-growing region. 15:30\u201317:00 Optional argan-oil cooperative stop as the scenery shifts to red rock and palm groves. 17:00 Arrive the Dades Valley and check in to your guesthouse. 19:30 Dinner included at the guesthouse \u2014 an early night before the desert push.", no: "07:00 Henting p\xE5 riad eller hotell \u2014 tidlig start p\xE5 den lange, naturskj\xF8nne kj\xF8returen. 07:15\u201309:30 Opp Tizi n'Tichka-passet (2 260m), Marokkos h\xF8yeste veipass \u2014 fotostopp p\xE5 toppen med vid utsikt over H\xF8yatlas. 10:30\u201312:00 A\xEFt Ben Haddou, UNESCO-kasbah og innspillingssted for Gladiator og Game of Thrones \u2014 en lokal guide tar deg gjennom jordbyen. 12:00\u201313:30 Ouarzazate for lunsj (etter eget valg), med valgfritt bes\xF8k p\xE5 Atlas Film Studios. 13:30\u201315:30 Kj\xF8ring gjennom Draa-dalen og roseregionen. 15:30\u201317:00 Valgfritt stopp ved arganolje-kooperativ mens landskapet skifter til r\xF8d stein og palmelunder. 17:00 Ankomst Dades-dalen og innsjekk p\xE5 gjestehuset. 19:30 Middag inkludert p\xE5 gjestehuset \u2014 tidlig kveld f\xF8r \xF8rkenetappen.", fr: "07h00 Prise en charge au riad ou \xE0 l'h\xF4tel \u2014 d\xE9part t\xF4t pour la longue route panoramique. 07h15\u201309h30 Mont\xE9e du col du Tizi n'Tichka (2 260m), le plus haut col routier du Maroc \u2014 arr\xEAt photo au sommet avec vues sur le Haut Atlas. 10h30\u201312h00 A\xEFt Ben Haddou, kasbah UNESCO et lieu de tournage de Gladiator et Game of Thrones \u2014 un guide local vous fait d\xE9couvrir la cit\xE9 de pis\xE9. 12h00\u201313h30 Ouarzazate pour le d\xE9jeuner (\xE0 votre convenance), avec visite optionnelle des Atlas Film Studios. 13h30\u201315h30 Route \xE0 travers la vall\xE9e du Draa et la r\xE9gion des roses. 15h30\u201317h00 Arr\xEAt optionnel dans une coop\xE9rative d'huile d'argan tandis que le paysage devient roche rouge et palmeraies. 17h00 Arriv\xE9e dans la vall\xE9e du Dad\xE8s et installation \xE0 la maison d'h\xF4tes. 19h30 D\xEEner inclus \xE0 la maison d'h\xF4tes \u2014 nuit t\xF4t avant l'\xE9tape du d\xE9sert." } },
      { day: 2, route: { en: "Dades \u2192 Gorges \u2192 Merzouga & the Dunes", no: "Dades \u2192 Kl\xF8fter \u2192 Merzouga og dynene", fr: "Dad\xE8s \u2192 Gorges \u2192 Merzouga & les dunes" }, text: { en: "07:30 Breakfast at the guesthouse and checkout. 08:30\u201310:00 Dades Gorges \u2014 the 'road of a thousand kasbahs', with photo stops at the famous winding switchbacks. 10:00\u201312:00 Todra Gorges \u2014 300m sheer rock walls; walk between the cliffs along the river. 12:00\u201313:30 Lunch (at leisure) in the gorge region with a Berber village stop. 13:30\u201316:30 Drive through the Tinghir palm oases toward Erg Chebbi as the Sahara opens up. 16:30 Arrive Merzouga, drop your main luggage and prepare an overnight bag. 17:00\u201318:00 Camel trek into the dunes of Erg Chebbi (1h) \u2014 the classic way into the desert. 18:00 Climb the highest dune for sunset over the Sahara. 19:30 Arrive your luxury desert camp; traditional dinner included. 21:00 Berber drums, fire and stargazing \u2014 no light pollution, the full Milky Way. Overnight in a private en-suite luxury desert tent.", no: "07:30 Frokost p\xE5 gjestehuset og utsjekk. 08:30\u201310:00 Dades-kl\xF8ftene \u2014 'veien med tusen kasbaher', med fotostopp ved de ber\xF8mte buktende serpentinene. 10:00\u201312:00 Todra-kl\xF8ftene \u2014 300m loddrette klippevegger; g\xE5 mellom klippene langs elven. 12:00\u201313:30 Lunsj (etter eget valg) i kl\xF8fteregionen med stopp i en berberlandsby. 13:30\u201316:30 Kj\xF8ring gjennom Tinghirs palmeoaser mot Erg Chebbi mens Sahara \xE5pner seg. 16:30 Ankomst Merzouga, sett fra hovedbagasjen og pakk en liten nattsekk. 17:00\u201318:00 Kamelritt inn i Erg Chebbi-dynene (1t) \u2014 den klassiske veien inn i \xF8rkenen. 18:00 Opp den h\xF8yeste dynen til solnedgang over Sahara. 19:30 Ankomst luksus\xF8rkenleiren; tradisjonell middag inkludert. 21:00 Berbertrommer, b\xE5l og stjernekikking \u2014 ingen lysforurensning, hele Melkeveien. Overnatting i privat luksus\xF8rkentelt med eget bad.", fr: "07h30 Petit-d\xE9jeuner \xE0 la maison d'h\xF4tes et d\xE9part. 08h30\u201310h00 Gorges du Dad\xE8s \u2014 la 'route des mille kasbahs', avec arr\xEAts photo aux c\xE9l\xE8bres lacets sinueux. 10h00\u201312h00 Gorges du Todra \u2014 parois rocheuses de 300m ; marche entre les falaises le long de la rivi\xE8re. 12h00\u201313h30 D\xE9jeuner (\xE0 votre convenance) dans la r\xE9gion des gorges avec arr\xEAt dans un village berb\xE8re. 13h30\u201316h30 Route \xE0 travers les palmeraies de Tinghir vers l'Erg Chebbi tandis que le Sahara s'ouvre. 16h30 Arriv\xE9e \xE0 Merzouga, d\xE9p\xF4t des bagages principaux et pr\xE9paration d'un sac pour la nuit. 17h00\u201318h00 Randonn\xE9e \xE0 dos de chameau dans les dunes de l'Erg Chebbi (1h) \u2014 la fa\xE7on classique d'entrer dans le d\xE9sert. 18h00 Mont\xE9e de la plus haute dune pour le coucher de soleil sur le Sahara. 19h30 Arriv\xE9e au camp de luxe ; d\xEEner traditionnel inclus. 21h00 Tambours berb\xE8res, feu et observation des \xE9toiles \u2014 aucune pollution lumineuse, toute la Voie Lact\xE9e. Nuit en tente de luxe privative avec salle de bain." } },
      { day: 3, route: { en: "Sahara Sunrise \u2192 Return to Marrakech", no: "Sahara-soloppgang \u2192 Tilbake til Marrakech", fr: "Lever de soleil \u2192 Retour \xE0 Marrakech" }, text: { en: "06:00 Wake for sunrise from the dunes \u2014 the unmissable moment of the trip. 07:00 Berber breakfast at camp. 08:00 Return by camel or 4x4 to the village and collect your luggage. 09:00\u201315:00 The long scenic return drive toward Marrakech, with a lunch stop at Todra or Ouarzazate (at leisure). 15:00\u201318:00 Continue over the Atlas, arriving Marrakech in the late afternoon. On arrival: drop at your riad or hotel, or direct to the airport if departing.", no: "06:00 V\xE5kne til soloppgang fra dynene \u2014 turens uunnv\xE6rlige \xF8yeblikk. 07:00 Berberfrokost i leiren. 08:00 Tilbake med kamel eller 4x4 til landsbyen og hent bagasjen. 09:00\u201315:00 Den lange, naturskj\xF8nne returkj\xF8ringen mot Marrakech, med lunsjstopp i Todra eller Ouarzazate (etter eget valg). 15:00\u201318:00 Videre over Atlas, ankomst Marrakech sen ettermiddag. Ved ankomst: avlevering ved riad eller hotell, eller direkte til flyplassen ved avreise.", fr: "06h00 R\xE9veil pour le lever de soleil depuis les dunes \u2014 le moment incontournable du voyage. 07h00 Petit-d\xE9jeuner berb\xE8re au camp. 08h00 Retour \xE0 dos de chameau ou en 4x4 au village et r\xE9cup\xE9ration des bagages. 09h00\u201315h00 Longue route panoramique de retour vers Marrakech, avec arr\xEAt d\xE9jeuner \xE0 Todra ou Ouarzazate (\xE0 votre convenance). 15h00\u201318h00 Passage de l'Atlas, arriv\xE9e \xE0 Marrakech en fin d'apr\xE8s-midi. \xC0 l'arriv\xE9e : d\xE9pose au riad ou \xE0 l'h\xF4tel, ou directement \xE0 l'a\xE9roport en cas de d\xE9part." } }
    ],
    included: [
      { en: "Private driver and vehicle for the full 3 days (all distances)", no: "Privat sj\xE5f\xF8r og bil i alle 3 dager (alle distanser)", fr: "Chauffeur et v\xE9hicule priv\xE9s pendant les 3 jours (toutes distances)" },
      { en: "Pickup and drop-off at your riad / hotel (or airport)", no: "Henting og avlevering ved riad/hotell (eller flyplass)", fr: "Prise en charge et d\xE9pose au riad/h\xF4tel (ou a\xE9roport)" },
      { en: "Local guide at A\xEFt Ben Haddou", no: "Lokal guide ved A\xEFt Ben Haddou", fr: "Guide local \xE0 A\xEFt Ben Haddou" },
      { en: "Camel trek into Erg Chebbi (1h)", no: "Kamelritt inn i Erg Chebbi (1t)", fr: "Randonn\xE9e \xE0 dos de chameau dans l'Erg Chebbi (1h)" },
      { en: "1 night Dades Valley guesthouse + 1 night luxury Merzouga desert camp (private en-suite)", no: "1 natt gjestehus i Dades-dalen + 1 natt luksus Merzouga-\xF8rkenleir (privat, eget bad)", fr: "1 nuit maison d'h\xF4tes vall\xE9e du Dad\xE8s + 1 nuit camp d\xE9sertique de luxe Merzouga (privatif, salle de bain)" },
      { en: "Breakfast daily (2) \xB7 dinner at Dades (Day 1) and the desert camp (Day 2)", no: "Frokost daglig (2) \xB7 middag i Dades (dag 1) og \xF8rkenleiren (dag 2)", fr: "Petit-d\xE9jeuner quotidien (2) \xB7 d\xEEner \xE0 Dad\xE8s (Jour 1) et au camp (Jour 2)" },
      { en: "24/7 WhatsApp support (Aladdin & Marte)", no: "24/7 WhatsApp-st\xF8tte (Aladdin & Marte)", fr: "Assistance WhatsApp 24h/24 (Aladdin & Marte)" },
      { en: "Personalised itinerary PDF with your driver's contact", no: "Personlig reiseplan-PDF med sj\xE5f\xF8rens kontakt", fr: "Itin\xE9raire PDF personnalis\xE9 avec le contact du chauffeur" },
      { en: "VAT included \u2014 no hidden extras (from \u20AC449 / person)", no: "MVA inkludert \u2014 ingen skjulte tillegg (fra \u20AC449 / person)", fr: "TVA incluse \u2014 sans extras cach\xE9s (\xE0 partir de \u20AC449 / pers.)" }
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches (Days 1\u20133) and any meals not listed", no: "Lunsjer (dag 1\u20133) og m\xE5ltider som ikke er nevnt", fr: "D\xE9jeuners (Jours 1\u20133) et repas non mentionn\xE9s" },
      { en: "Site entrances \u2014 A\xEFt Ben Haddou guide ~100 MAD \xB7 Atlas Studios ~40 MAD", no: "Inngangsbilletter \u2014 A\xEFt Ben Haddou-guide ~100 MAD \xB7 Atlas Studios ~40 MAD", fr: "Entr\xE9es des sites \u2014 guide A\xEFt Ben Haddou ~100 MAD \xB7 Atlas Studios ~40 MAD" },
      { en: "Drinks, beverages and alcohol", no: "Drikke og alkohol", fr: "Boissons et alcool" },
      { en: "Personal shopping & tips (\u20AC5\u201310/p for the driver is customary)", no: "Personlig shopping og tips (\u20AC5\u201310/p til sj\xE5f\xF8ren er vanlig)", fr: "Achats personnels & pourboires (\u20AC5\u201310/p pour le chauffeur d'usage)" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommand\xE9e)" },
      { en: "Optional upgrades: 4x4 instead of camel \xB7 sandboarding \xB7 private candlelit dune dinner \xB7 quad / buggy \xB7 extra camp night (4D/3N)", no: "Valgfrie oppgraderinger: 4x4 i stedet for kamel \xB7 sandboarding \xB7 privat middag i dynene \xB7 quad/buggy \xB7 ekstra natt i leiren (4D/3N)", fr: "Options : 4x4 au lieu du chameau \xB7 sandboard \xB7 d\xEEner priv\xE9 aux chandelles dans les dunes \xB7 quad/buggy \xB7 nuit suppl\xE9mentaire au camp (4J/3N)" }
    ]
  },
  // ===== 4D3N — Marrakech & Agafay Luxury Escape =====
  {
    slug: "marrakech-agafay",
    chapter: "02",
    title: { en: "Marrakech & Agafay Luxury Escape", no: "Marrakech & Agafay Luksusopphold", fr: "\xC9vasion Luxe Marrakech & Agafay" },
    duration: "4D3N",
    days: 4,
    nights: 3,
    route: "Marrakech \u2192 Agafay \u2192 Marrakech",
    priceFromEUR: 750,
    img: "assets/photos/medina-koutoubia-04.jpg",
    themeTags: ["Riad", "Hammam", "Agafay", "Balloon"],
    teaser: { en: "Two nights in a luxury riad, a full hammam day, a sunrise balloon over the Atlas, and one night in the Agafay stone desert.", no: "To netter i et luksuri\xF8st riad, en full hammam-dag, soloppgangsballong over Atlas og \xE9n natt i Agafay-stein\xF8rkenen.", fr: "Deux nuits dans un riad de luxe, une journ\xE9e hammam compl\xE8te, une montgolfi\xE8re au lever du soleil sur l'Atlas, et une nuit dans le d\xE9sert de pierres de l'Agafay." },
    overview: { en: "Perfectly balanced between cultural immersion and desert wonder. Two nights in a luxury riad in the ancient Medina, one extraordinary night in a tented camp in the Agafay stone desert \u2014 with a hot air balloon sunrise above the Atlas in between. Day 2 is entirely yours: full luxury hammam programme followed by a 4-hour private guided medina tour. Day 3 begins at 05:00 with a balloon flight and ends under the stars.", no: "Perfekt balansert mellom kulturell fordypning og \xF8rkenunder. To netter i et luksuri\xF8st riad i den eldgamle Medina, \xE9n ekstraordin\xE6r natt i et teltleir i Agafay-stein\xF8rkenen \u2014 med en soloppgangsballong over Atlas i mellom. Dag 2 er helt din: fullt luksuri\xF8st hammam-program etterfulgt av en 4-timers privat guidet medinaomvisning. Dag 3 begynner kl. 05:00 med en ballongtur og slutter under stjernene.", fr: "Parfaitement \xE9quilibr\xE9 entre immersion culturelle et \xE9merveillement d\xE9sertique. Deux nuits dans un riad de luxe dans l'ancienne M\xE9dina, une nuit extraordinaire dans un camp de tentes dans le d\xE9sert de pierres de l'Agafay \u2014 avec un lever de soleil en montgolfi\xE8re au-dessus de l'Atlas entre les deux. Le Jour 2 est enti\xE8rement pour vous : programme complet de hammam de luxe suivi d'une visite guid\xE9e priv\xE9e de 4h de la m\xE9dina. Le Jour 3 commence \xE0 05h00 avec un vol en montgolfi\xE8re et se termine sous les \xE9toiles." },
    idealFor: { en: "Couples seeking culture, wellness and desert magic in four days", no: "Par som s\xF8ker kultur, velv\xE6re og \xF8rkenmagi p\xE5 fire dager", fr: "Couples en qu\xEAte de culture, bien-\xEAtre et magie du d\xE9sert en quatre jours" },
    highlights: [
      { en: "Airport pickup with personalised name sign", no: "Flyplasshenting med personlig navneskilt", fr: "Prise en charge \xE0 l'a\xE9roport avec pancarte personnalis\xE9e" },
      { en: "Full luxury hammam \u2014 black soap, kessa, ghassoul, argan massage", no: "Fullt luksuri\xF8st hammam \u2014 svart s\xE5pe, kessa, ghassoul, arganolje-massasje", fr: "Hammam de luxe complet \u2014 savon noir, kessa, ghassoul, massage \xE0 l'huile d'argan" },
      { en: "Private certified guide \u2014 4-hour medina tour", no: "Privat sertifisert guide \u2014 4-timers medina-omvisning", fr: "Guide certifi\xE9 priv\xE9 \u2014 visite de 4h de la m\xE9dina" },
      { en: "Hot air balloon \u2014 45\u201360 min sunrise over the Atlas & Palmeraie", no: "Luftballong \u2014 45\u201360 min soloppgang over Atlas og Palmeraie", fr: "Montgolfi\xE8re \u2014 45\u201360 min lever de soleil sur l'Atlas & la Palmeraie" },
      { en: "Berber breakfast + flight certificate on landing", no: "Berber-frokost + flybevis ved landing", fr: "Petit-d\xE9jeuner berb\xE8re + certificat de vol \xE0 l'atterrissage" },
      { en: "Agafay luxury camp \u2014 pool, Moroccan feast, Gnawa music, fire performance", no: "Agafay luksusleir \u2014 basseng, marokkansk festmiddag, Gnawa-musikk, ildshow", fr: "Camp de luxe Agafay \u2014 piscine, festin marocain, musique Gnawa, spectacle de feu" }
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival & Welcome", no: "Ankomst & Velkomst", fr: "Arriv\xE9e & Accueil" }, text: { en: "Upon arrival ~~ Driver waits at arrivals with a personalised Marrakech Story sign || Transfer ~~ Private car to a luxury riad (~20\u201330 min) || Afternoon ~~ Riad check-in \xB7 welcome mint tea \xB7 freshen up || 17:00 ~~ Free time \u2014 a gentle medina walk or rooftop rest || 19:30 ~~ Dinner recommendation or a guided first evening", no: "Ved ankomst ~~ Sj\xE5f\xF8ren venter i ankomsthallen med et personlig Marrakech Story-skilt || Transfer ~~ Privat bil til luksuri\xF8st riad (~20\u201330 min) || Ettermiddag ~~ Innsjekk p\xE5 riad \xB7 velkomstmyntete \xB7 friske opp || 17:00 ~~ Fri tid \u2014 rolig tur i medinaen eller hvile p\xE5 taket || 19:30 ~~ Middagsanbefaling eller guidet f\xF8rste kveld", fr: "\xC0 l'arriv\xE9e ~~ Le chauffeur attend \xE0 l'arriv\xE9e avec une pancarte Marrakech Story personnalis\xE9e || Transfert ~~ Voiture priv\xE9e vers un riad de luxe (~20\u201330 min) || Apr\xE8s-midi ~~ Installation au riad \xB7 th\xE9 \xE0 la menthe de bienvenue \xB7 rafra\xEEchissement || 17h00 ~~ Temps libre \u2014 balade tranquille dans la m\xE9dina ou repos sur le toit || 19h30 ~~ Recommandation de d\xEEner ou premi\xE8re soir\xE9e guid\xE9e" } },
      { day: 2, route: { en: "City & Culture", no: "By & Kultur", fr: "Ville & Culture" }, text: { en: "07:30 ~~ Breakfast at the riad || 10:00 ~~ Certified guide pickup at riad reception || 10:00\u201313:00 ~~ Guided medina & souk tour (3h) || 13:00\u201315:00 ~~ Lunch at leisure || 15:00\u201318:00 ~~ Free afternoon \u2014 optional hammam (\u20AC25\u201360/p), shopping, Majorelle Garden || 20:00 ~~ Dinner at leisure", no: "07:30 ~~ Frokost p\xE5 riaden || 10:00 ~~ Sertifisert guide henter i riad-resepsjonen || 10:00\u201313:00 ~~ Guidet medina- og souk-tur (3t) || 13:00\u201315:00 ~~ Lunsj etter eget valg || 15:00\u201318:00 ~~ Fri ettermiddag \u2014 valgfritt hammam (\u20AC25\u201360/p), shopping, Majorelle-hagen || 20:00 ~~ Middag etter eget valg", fr: "07h30 ~~ Petit-d\xE9jeuner au riad || 10h00 ~~ Prise en charge par le guide certifi\xE9 \xE0 la r\xE9ception || 10h00\u201313h00 ~~ Visite guid\xE9e m\xE9dina & souks (3h) || 13h00\u201315h00 ~~ D\xE9jeuner libre || 15h00\u201318h00 ~~ Apr\xE8s-midi libre \u2014 hammam en option (\u20AC25\u201360/p), shopping, Jardin Majorelle || 20h00 ~~ D\xEEner libre" } },
      { day: 3, route: { en: "Agafay Desert Experience", no: "Agafay-\xF8rkenopplevelse", fr: "Exp\xE9rience D\xE9sert d'Agafay" }, text: { en: "07:30 ~~ Breakfast at the riad || 10:00\u201311:00 ~~ Check-out \xB7 luggage stored or taken to the desert camp || 11:00 ~~ Private transfer to the Agafay Desert (~45 min) || 12:00\u201315:00 ~~ Arrival at camp \xB7 pool \xB7 relaxation \xB7 optional lunch (not included) || 15:00 ~~ Transfer to the activity zone || 17:00 ~~ Camel ride at sunset (\u20AC30/p \xB7 1h) || 19:00 ~~ Return to camp \xB7 freshen up || 19:30 ~~ Agafay Dinner & Show \u2014 Moroccan dinner \xB7 Gnawa musicians \xB7 oriental dancer \xB7 fire eater \xB7 DJ || 23:00 ~~ Show ends \xB7 overnight in a luxury desert tent", no: "07:30 ~~ Frokost p\xE5 riaden || 10:00\u201311:00 ~~ Utsjekk \xB7 bagasje lagres eller tas med til \xF8rkenleiren || 11:00 ~~ Privat transfer til Agafay-\xF8rkenen (~45 min) || 12:00\u201315:00 ~~ Ankomst leir \xB7 basseng \xB7 avslapning \xB7 valgfri lunsj (ikke inkludert) || 15:00 ~~ Transfer til aktivitetssonen || 17:00 ~~ Kamelritt ved solnedgang (\u20AC30/p \xB7 1t) || 19:00 ~~ Tilbake til leiren \xB7 friske opp || 19:30 ~~ Agafay middag & show \u2014 marokkansk middag \xB7 Gnawa-musikere \xB7 orientalsk danser \xB7 ildsluker \xB7 DJ || 23:00 ~~ Showet slutter \xB7 overnatting i luksus\xF8rkentelt", fr: "07h30 ~~ Petit-d\xE9jeuner au riad || 10h00\u201311h00 ~~ D\xE9part \xB7 bagages stock\xE9s ou emport\xE9s au camp || 11h00 ~~ Transfert priv\xE9 vers le d\xE9sert de l'Agafay (~45 min) || 12h00\u201315h00 ~~ Arriv\xE9e au camp \xB7 piscine \xB7 d\xE9tente \xB7 d\xE9jeuner optionnel (non inclus) || 15h00 ~~ Transfert vers la zone d'activit\xE9s || 17h00 ~~ Balade \xE0 dos de chameau au coucher du soleil (\u20AC30/p \xB7 1h) || 19h00 ~~ Retour au camp \xB7 rafra\xEEchissement || 19h30 ~~ D\xEEner & spectacle Agafay \u2014 d\xEEner marocain \xB7 musiciens Gnawa \xB7 danseuse orientale \xB7 cracheur de feu \xB7 DJ || 23h00 ~~ Fin du spectacle \xB7 nuit en tente de luxe" } },
      { day: 4, route: { en: "Desert Sunrise & Departure", no: "\xD8rkensoloppgang & Avreise", fr: "Lever de soleil & D\xE9part" }, text: { en: "06:30\u201307:00 ~~ Sunrise \xB7 desert silence \xB7 optional morning walk among the rocks || 07:30 ~~ Berber breakfast at camp || 09:00 ~~ Private transfer back to Marrakech (~45 min) || On arrival ~~ Drop at riad or airport depending on flight time || Flight \u22123h ~~ Private airport transfer if not already arranged", no: "06:30\u201307:00 ~~ Soloppgang \xB7 \xF8rkenstillhet \xB7 valgfri morgentur blant steinene || 07:30 ~~ Berberfrokost i leiren || 09:00 ~~ Privat transfer tilbake til Marrakech (~45 min) || Ved ankomst ~~ Avlevering ved riad eller flyplass avhengig av flytid || Fly \u22123t ~~ Privat flyplasstransfer hvis ikke allerede avtalt", fr: "06h30\u201307h00 ~~ Lever de soleil \xB7 silence du d\xE9sert \xB7 promenade matinale optionnelle parmi les rochers || 07h30 ~~ Petit-d\xE9jeuner berb\xE8re au camp || 09h00 ~~ Transfert priv\xE9 retour \xE0 Marrakech (~45 min) || \xC0 l'arriv\xE9e ~~ D\xE9pose au riad ou \xE0 l'a\xE9roport selon l'horaire du vol || Vol \u22123h ~~ Transfert priv\xE9 a\xE9roport si non d\xE9j\xE0 pr\xE9vu" } }
    ],
    included: [
      { en: "Airport transfers with personalised name sign", no: "Flyplasstransfer med personlig navneskilt", fr: "Transferts a\xE9roport avec pancarte personnalis\xE9e" },
      { en: "Private transport throughout", no: "Privat transport gjennom hele reisen", fr: "Transport priv\xE9 tout au long du s\xE9jour" },
      { en: "2 nights luxury riad Marrakech, 1 night luxury Agafay desert camp \u2014 daily breakfast", no: "2 netter luksusriad Marrakech, 1 natt luksus\xF8rkenleir Agafay \u2014 daglig frokost", fr: "2 nuits riad de luxe Marrakech, 1 nuit camp d\xE9sertique de luxe Agafay \u2014 petit-d\xE9jeuner quotidien" },
      { en: "Welcome mint tea & Moroccan pastries", no: "Velkomst myntete & marokkanske kjeks", fr: "Th\xE9 \xE0 la menthe de bienvenue & p\xE2tisseries marocaines" },
      { en: "Luxury hammam \u2014 full programme (black soap \xB7 kessa exfoliation \xB7 ghassoul clay \xB7 argan oil massage)", no: "Luksuri\xF8st hammam \u2014 fullt program (svart s\xE5pe \xB7 kessa-eksfoliering \xB7 ghassoul-leire \xB7 arganolje-massasje)", fr: "Hammam de luxe \u2014 programme complet (savon noir \xB7 exfoliation kessa \xB7 argile ghassoul \xB7 massage \xE0 l'huile d'argan)" },
      { en: "Private certified guide \u2014 4-hour medina tour", no: "Privat sertifisert guide \u2014 4-timers medina-omvisning", fr: "Guide certifi\xE9 priv\xE9 \u2014 visite de 4h de la m\xE9dina" },
      { en: "Hot air balloon flight \u2014 45\u201360 min sunrise over the Atlas & Palmeraie", no: "Luftballongtur \u2014 45\u201360 min soloppgang over Atlas og Palmeraie", fr: "Vol en montgolfi\xE8re \u2014 45\u201360 min lever de soleil sur l'Atlas & la Palmeraie" },
      { en: "Traditional Berber breakfast after landing + flight certificate", no: "Tradisjonell berberfrokost etter landing + flybevis", fr: "Petit-d\xE9jeuner berb\xE8re traditionnel apr\xE8s l'atterrissage + certificat de vol" },
      { en: "Agafay pool access \xB7 Moroccan feast dinner \xB7 live Gnawa music \xB7 fire performance", no: "Agafay bassengadgang \xB7 marokkansk festmiddag \xB7 levende Gnawa-musikk \xB7 ildshow", fr: "Acc\xE8s piscine Agafay \xB7 festin marocain \xB7 musique Gnawa en direct \xB7 spectacle de feu" },
      { en: "24/7 WhatsApp support \u2014 Aladdin & Marte", no: "24/7 WhatsApp-st\xF8tte \u2014 Aladdin & Marte", fr: "Assistance WhatsApp 24h/24 \u2014 Aladdin & Marte" }
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Dinners in Marrakech (Days 1 & 2)", no: "Middager i Marrakech (dag 1 og dag 2)", fr: "D\xEEners \xE0 Marrakech (Jours 1 & 2)" },
      { en: "Drinks and beverages", no: "Drikke og drikkevarer", fr: "Boissons et breuvages" },
      { en: "Bahia Palace entrance (~70 MAD/p)", no: "Bahia-palasset inngang (~70 MAD/p)", fr: "Entr\xE9e du Palais Bahia (~70 MAD/p)" },
      { en: "Optional activities: camel ride (\u20AC30/p) \xB7 quad (\u20AC40/p) \xB7 buggy (\u20AC100/p) \xB7 horse riding (\u20AC49/p)", no: "Valgfrie aktiviteter: kamelritt (\u20AC30/p) \xB7 quad (\u20AC40/p) \xB7 buggy (\u20AC100/p) \xB7 ridning (\u20AC49/p)", fr: "Activit\xE9s optionnelles : balade \xE0 dos de chameau (\u20AC30/p) \xB7 quad (\u20AC40/p) \xB7 buggy (\u20AC100/p) \xB7 \xE9quitation (\u20AC49/p)" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommand\xE9e)" },
      { en: "Personal expenses and tips", no: "Personlige utgifter og tips", fr: "D\xE9penses personnelles et pourboires" }
    ]
  },
  // ===== 5D4N — Best of Marrakech =====
  {
    slug: "best-of-marrakech",
    chapter: "03",
    title: { en: "Best of Marrakech", no: "Det beste av Marrakech", fr: "Le Meilleur de Marrakech" },
    duration: "5D4N",
    days: 5,
    nights: 4,
    route: "Marrakech \u2192 Nature Day \u2192 Agafay \u2192 Marrakech",
    priceFromEUR: 890,
    img: "assets/photos/agafay-pool-08.jpg",
    badge: { en: "MOST POPULAR", no: "MEST POPUL\xC6R", fr: "PLUS POPULAIRE" },
    themeTags: ["Medina", "Cooking Class", "Agafay", "Nature"],
    teaser: { en: "Five days covering everything Marrakech does best \u2014 medina, cooking class, your choice of nature day, and a night in the stone desert.", no: "Fem dager med alt Marrakech gj\xF8r best \u2014 medina, matkurs, din naturdag, og en natt i stein\xF8rkenen.", fr: "Cinq jours pour tout ce que Marrakech fait de mieux \u2014 m\xE9dina, cours de cuisine, votre journ\xE9e nature, et une nuit dans le d\xE9sert de pierres." },
    overview: { en: "Five days covering everything Marrakech does best. Guided medina, Moroccan cooking class, a full day into nature (Atlas Mountains, Ourika Valley, or Essaouira Atlantic coast), and one night in the Agafay stone desert under the stars. Our most popular itinerary \u2014 perfectly paced for first-timers and returners alike.", no: "Fem dager som dekker alt Marrakech gj\xF8r best. Guidet medina, marokkansk matkurs, en hel dag ut i naturen (Atlasfjellene, Ourika-dalen eller Essaouira-atlanterhavskysten), og \xE9n natt i Agafay-stein\xF8rkenen under stjernene. V\xE5r mest popul\xE6re reiseplan \u2014 perfekt tempo for b\xE5de f\xF8rstereisende og de som har v\xE6rt her f\xF8r.", fr: "Cinq jours couvrant tout ce que Marrakech fait de mieux. M\xE9dina guid\xE9e, cours de cuisine marocaine, une journ\xE9e enti\xE8re dans la nature (Montagnes du Haut Atlas, vall\xE9e de l'Ourika ou c\xF4te atlantique d'Essaouira), et une nuit dans le d\xE9sert de pierres de l'Agafay sous les \xE9toiles. Notre itin\xE9raire le plus populaire \u2014 parfaitement rythm\xE9 pour les premiers voyageurs comme pour ceux qui reviennent." },
    idealFor: { en: "First-timers and returners who want depth without rushing", no: "F\xF8rstereisende og returreisende som vil ha dybde uten hastverk", fr: "Premiers voyageurs et habitu\xE9s qui veulent de la profondeur sans se pr\xE9cipiter" },
    highlights: [
      { en: "Private certified guide \u2014 3-hour medina tour", no: "Privat sertifisert guide \u2014 3-timers medina-omvisning", fr: "Guide certifi\xE9 priv\xE9 \u2014 visite de 3h de la m\xE9dina" },
      { en: "Moroccan cooking class at a traditional riad (lunch included)", no: "Marokkansk matkurs p\xE5 et tradisjonelt riad (lunsj inkludert)", fr: "Cours de cuisine marocaine dans un riad traditionnel (d\xE9jeuner inclus)" },
      { en: "Choose your nature day: Ourika Valley \xB7 Three Atlas Valleys \xB7 or Essaouira coast", no: "Velg din naturdag: Ourika-dalen \xB7 Tre Atlas-daler \xB7 eller Essaouira-kysten", fr: "Choisissez votre journ\xE9e nature : Vall\xE9e de l'Ourika \xB7 Trois vall\xE9es de l'Atlas \xB7 ou c\xF4te d'Essaouira" },
      { en: "One night at an Agafay luxury desert camp", no: "\xC9n natt i en Agafay luksusleirplass", fr: "Une nuit dans un camp de luxe d\xE9sertique \xE0 l'Agafay" },
      { en: "Moroccan feast dinner \xB7 live Gnawa music \xB7 fire performance", no: "Marokkansk festmiddag \xB7 levende Gnawa-musikk \xB7 ildshow", fr: "Festin marocain \xB7 musique Gnawa en direct \xB7 spectacle de feu" },
      { en: "Optional: camel ride (\u20AC30/p) \xB7 quad (\u20AC40/p) at the camp", no: "Valgfritt: kamelritt (\u20AC30/p) \xB7 quad (\u20AC40/p) i leiren", fr: "En option : balade \xE0 dos de chameau (\u20AC30/p) \xB7 quad (\u20AC40/p) au camp" }
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival", no: "Ankomst", fr: "Arriv\xE9e" }, text: { en: "Upon arrival ~~ Driver at Marrakech Menara with a personalised name sign || Transfer ~~ Private car to your riad/hotel (15\u201330 min) || Afternoon ~~ Check-in \xB7 welcome mint tea \xB7 orientation || 17:00\u201319:00 ~~ Free time \u2014 we recommend the best area to explore near your riad || 19:30 ~~ Dinner at a recommended local restaurant", no: "Ved ankomst ~~ Sj\xE5f\xF8r p\xE5 Marrakech Menara med personlig navneskilt || Transfer ~~ Privat bil til riad/hotell (15\u201330 min) || Ettermiddag ~~ Innsjekk \xB7 velkomstmyntete \xB7 orientering || 17:00\u201319:00 ~~ Fri tid \u2014 vi anbefaler det beste omr\xE5det \xE5 utforske n\xE6r riaden || 19:30 ~~ Middag p\xE5 en anbefalt lokal restaurant", fr: "\xC0 l'arriv\xE9e ~~ Chauffeur \xE0 Marrakech Menara avec pancarte personnalis\xE9e || Transfert ~~ Voiture priv\xE9e vers le riad/h\xF4tel (15\u201330 min) || Apr\xE8s-midi ~~ Installation \xB7 th\xE9 \xE0 la menthe \xB7 orientation || 17h00\u201319h00 ~~ Temps libre \u2014 nous recommandons le meilleur quartier \xE0 explorer pr\xE8s du riad || 19h30 ~~ D\xEEner dans un restaurant local recommand\xE9" } },
      { day: 2, route: { en: "Culture & Cuisine", no: "Kultur & Mat", fr: "Culture & Cuisine" }, text: { en: "07:30 ~~ Breakfast at the riad || 09:30 ~~ Driver pickup for the market visit || 10:00\u201313:00 ~~ Guided medina & souk tour (3h \xB7 \u20AC59/p) \u2014 spice souks, Berber carpets, tanneries, artisan ateliers || 13:00 ~~ Market visit for ingredients, then transfer to the cooking-class riad || 13:30\u201316:00 ~~ Moroccan cooking class (\u20AC49/p) \u2014 tagine, couscous, pastilla, then eat your lunch together || 16:30 ~~ Return to your accommodation || 17:00\u201319:00 ~~ Free time \xB7 optional Jemaa el-Fna or Majorelle Garden || 20:00 ~~ Dinner at leisure", no: "07:30 ~~ Frokost p\xE5 riaden || 09:30 ~~ Sj\xE5f\xF8r henter til markedsbes\xF8k || 10:00\u201313:00 ~~ Guidet medina- og souk-tur (3t \xB7 \u20AC59/p) \u2014 kryddersouker, berbertepper, garverier, h\xE5ndverksatelj\xE9er || 13:00 ~~ Markedsbes\xF8k for ingredienser, deretter til matkurs-riaden || 13:30\u201316:00 ~~ Marokkansk matkurs (\u20AC49/p) \u2014 tagine, couscous, pastilla, spis lunsjen sammen || 16:30 ~~ Tilbake til overnattingen || 17:00\u201319:00 ~~ Fri tid \xB7 valgfritt Jemaa el-Fna eller Majorelle-hagen || 20:00 ~~ Middag etter eget valg", fr: "07h30 ~~ Petit-d\xE9jeuner au riad || 09h30 ~~ Prise en charge pour la visite du march\xE9 || 10h00\u201313h00 ~~ Visite guid\xE9e m\xE9dina & souks (3h \xB7 \u20AC59/p) \u2014 souks aux \xE9pices, tapis berb\xE8res, tanneries, ateliers d'artisans || 13h00 ~~ March\xE9 pour les ingr\xE9dients, puis transfert vers le riad du cours de cuisine || 13h30\u201316h00 ~~ Cours de cuisine marocaine (\u20AC49/p) \u2014 tajine, couscous, pastilla, puis d\xE9jeuner ensemble || 16h30 ~~ Retour \xE0 l'h\xE9bergement || 17h00\u201319h00 ~~ Temps libre \xB7 Jemaa el-Fna ou Jardin Majorelle en option || 20h00 ~~ D\xEEner libre" } },
      { day: 3, route: { en: "Into Nature \u2014 choose one", no: "Ut i naturen \u2014 velg \xE9n", fr: "Dans la nature \u2014 au choix" }, text: { en: "07:30 ~~ Breakfast at the riad || 08:00 ~~ Driver pickup \u2014 full-day excursion begins (choose one) || Option A ~~ Ourika Valley (\u20AC120/p) \u2014 Berber villages, Setti Fatma waterfalls, lunch by the river, return ~17:00 || Option B ~~ Atlas / 3 Valleys (\u20AC150/p) \u2014 Asni, Kik Plateau, Ourika, Berber family lunch, return ~18:00 || Option C ~~ Essaouira (\u20AC150/p) \u2014 UNESCO blue medina, fishing port, Atlantic breeze, artisan shops || 18:00\u201319:00 ~~ Return to Marrakech || 20:00 ~~ Dinner at leisure", no: "07:30 ~~ Frokost p\xE5 riaden || 08:00 ~~ Sj\xE5f\xF8r henter \u2014 heldagsutflukt starter (velg \xE9n) || Alternativ A ~~ Ourika-dalen (\u20AC120/p) \u2014 berberlandsbyer, Setti Fatma-fossene, lunsj ved elven, retur ~17:00 || Alternativ B ~~ Atlas / 3 daler (\u20AC150/p) \u2014 Asni, Kik-plat\xE5et, Ourika, lunsj hos berberfamilie, retur ~18:00 || Alternativ C ~~ Essaouira (\u20AC150/p) \u2014 UNESCO bl\xE5 medina, fiskehavn, atlanterhavsbris, h\xE5ndverksbutikker || 18:00\u201319:00 ~~ Retur til Marrakech || 20:00 ~~ Middag etter eget valg", fr: "07h30 ~~ Petit-d\xE9jeuner au riad || 08h00 ~~ Prise en charge \u2014 excursion d'une journ\xE9e (au choix) || Option A ~~ Vall\xE9e de l'Ourika (\u20AC120/p) \u2014 villages berb\xE8res, cascades de Setti Fatma, d\xE9jeuner au bord de la rivi\xE8re, retour ~17h00 || Option B ~~ Atlas / 3 vall\xE9es (\u20AC150/p) \u2014 Asni, plateau du Kik, Ourika, d\xE9jeuner en famille berb\xE8re, retour ~18h00 || Option C ~~ Essaouira (\u20AC150/p) \u2014 m\xE9dina bleue UNESCO, port de p\xEAche, brise atlantique, artisans || 18h00\u201319h00 ~~ Retour \xE0 Marrakech || 20h00 ~~ D\xEEner libre" } },
      { day: 4, route: { en: "Agafay Desert", no: "Agafay-\xF8rkenen", fr: "D\xE9sert de l'Agafay" }, text: { en: "07:30 ~~ Breakfast at the riad || 10:00 ~~ Checkout or luggage storage || 10:30\u201311:00 ~~ Private transfer to the Agafay Desert (~45 min) || 11:00\u201315:00 ~~ Arrival at the luxury camp \xB7 pool \xB7 relax \xB7 optional pool lunch || 15:00 ~~ Transfer to the activity zone || 16:30\u201317:30 ~~ Camel ride at sunset (\u20AC30/p) || 19:00 ~~ Return to camp \xB7 freshen up || 19:30 ~~ Agafay Dinner & Show (\u20AC55/p) \u2014 full Moroccan dinner + entertainment || Midnight ~~ Overnight in a luxury desert tent under the stars", no: "07:30 ~~ Frokost p\xE5 riaden || 10:00 ~~ Utsjekk eller bagasjeoppbevaring || 10:30\u201311:00 ~~ Privat transfer til Agafay-\xF8rkenen (~45 min) || 11:00\u201315:00 ~~ Ankomst luksusleiren \xB7 basseng \xB7 avslapning \xB7 valgfri bassenglunsj || 15:00 ~~ Transfer til aktivitetssonen || 16:30\u201317:30 ~~ Kamelritt ved solnedgang (\u20AC30/p) || 19:00 ~~ Tilbake til leiren \xB7 friske opp || 19:30 ~~ Agafay middag & show (\u20AC55/p) \u2014 full marokkansk middag + underholdning || Midnatt ~~ Overnatting i luksus\xF8rkentelt under stjernene", fr: "07h30 ~~ Petit-d\xE9jeuner au riad || 10h00 ~~ D\xE9part ou stockage des bagages || 10h30\u201311h00 ~~ Transfert priv\xE9 vers le d\xE9sert de l'Agafay (~45 min) || 11h00\u201315h00 ~~ Arriv\xE9e au camp de luxe \xB7 piscine \xB7 d\xE9tente \xB7 d\xE9jeuner piscine optionnel || 15h00 ~~ Transfert vers la zone d'activit\xE9s || 16h30\u201317h30 ~~ Balade \xE0 dos de chameau au coucher du soleil (\u20AC30/p) || 19h00 ~~ Retour au camp \xB7 rafra\xEEchissement || 19h30 ~~ D\xEEner & spectacle Agafay (\u20AC55/p) \u2014 d\xEEner marocain complet + animations || Minuit ~~ Nuit en tente de luxe sous les \xE9toiles" } },
      { day: 5, route: { en: "Departure", no: "Avreise", fr: "D\xE9part" }, text: { en: "06:30 ~~ Sunrise option \xB7 Berber breakfast at camp || 09:00 ~~ Private transfer back to Marrakech (~45 min) || 09:45 ~~ Drop at riad for bag collection or direct to the airport || Flight \u22123h ~~ Airport transfer if scheduled", no: "06:30 ~~ Soloppgangsalternativ \xB7 berberfrokost i leiren || 09:00 ~~ Privat transfer tilbake til Marrakech (~45 min) || 09:45 ~~ Avlevering ved riad for bagasje eller direkte til flyplassen || Fly \u22123t ~~ Flyplasstransfer ved behov", fr: "06h30 ~~ Option lever de soleil \xB7 petit-d\xE9jeuner berb\xE8re au camp || 09h00 ~~ Transfert priv\xE9 retour \xE0 Marrakech (~45 min) || 09h45 ~~ D\xE9pose au riad pour les bagages ou directement \xE0 l'a\xE9roport || Vol \u22123h ~~ Transfert a\xE9roport si pr\xE9vu" } }
    ],
    included: [
      { en: "Airport transfers with personalised name sign", no: "Flyplasstransfer med personlig navneskilt", fr: "Transferts a\xE9roport avec pancarte personnalis\xE9e" },
      { en: "Private transport throughout", no: "Privat transport gjennom hele reisen", fr: "Transport priv\xE9 tout au long du s\xE9jour" },
      { en: "3 nights luxury riad Marrakech \xB7 1 night luxury Agafay desert camp \u2014 daily breakfast", no: "3 netter luksusriad Marrakech \xB7 1 natt luksus\xF8rkenleir Agafay \u2014 daglig frokost", fr: "3 nuits riad de luxe Marrakech \xB7 1 nuit camp d\xE9sertique de luxe Agafay \u2014 petit-d\xE9jeuner quotidien" },
      { en: "Welcome mint tea & Moroccan pastries", no: "Velkomst myntete & marokkanske kjeks", fr: "Th\xE9 \xE0 la menthe de bienvenue & p\xE2tisseries marocaines" },
      { en: "Private certified guide \u2014 3-hour Medina tour", no: "Privat sertifisert guide \u2014 3-timers Medina-omvisning", fr: "Guide certifi\xE9 priv\xE9 \u2014 visite de 3h de la M\xE9dina" },
      { en: "Moroccan cooking class at traditional riad (includes lunch, \u20AC49/p)", no: "Marokkansk matkurs p\xE5 tradisjonelt riad (inkluderer lunsj, \u20AC49/p)", fr: "Cours de cuisine marocaine dans un riad traditionnel (d\xE9jeuner inclus, \u20AC49/p)" },
      { en: "Private driver + vehicle for full nature day", no: "Privat sj\xE5f\xF8r + kj\xF8ret\xF8y for hel naturdag", fr: "Chauffeur priv\xE9 + v\xE9hicule pour la journ\xE9e nature compl\xE8te" },
      { en: "Agafay welcome drink + pool access", no: "Agafay velkomstdrink + bassengadgang", fr: "Boisson de bienvenue Agafay + acc\xE8s piscine" },
      { en: "Moroccan feast dinner at desert camp \xB7 live Gnawa music \xB7 entertainment", no: "Marokkansk festmiddag i \xF8rkenleiren \xB7 levende Gnawa-musikk \xB7 underholdning", fr: "Festin marocain au camp d\xE9sertique \xB7 musique Gnawa en direct \xB7 divertissements" },
      { en: "24/7 WhatsApp support \u2014 Aladdin & Marte", no: "24/7 WhatsApp-st\xF8tte \u2014 Aladdin & Marte", fr: "Assistance WhatsApp 24h/24 \u2014 Aladdin & Marte" }
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Dinners in Marrakech (Days 1, 2, 3)", no: "Middager i Marrakech (dag 1, 2, 3)", fr: "D\xEEners \xE0 Marrakech (Jours 1, 2, 3)" },
      { en: "Nature day lunch (guide recommends local spots)", no: "Naturdag-lunsj (guiden anbefaler lokale steder)", fr: "D\xE9jeuner de la journ\xE9e nature (le guide recommande des spots locaux)" },
      { en: "Bahia Palace entrance (~70 MAD/p)", no: "Bahia-palasset inngang (~70 MAD/p)", fr: "Entr\xE9e du Palais Bahia (~70 MAD/p)" },
      { en: "Optional activities at Agafay: camel ride (\u20AC30/p) \xB7 quad (\u20AC40/p)", no: "Valgfrie aktiviteter i Agafay: kamelritt (\u20AC30/p) \xB7 quad (\u20AC40/p)", fr: "Activit\xE9s optionnelles \xE0 l'Agafay : balade \xE0 dos de chameau (\u20AC30/p) \xB7 quad (\u20AC40/p)" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommand\xE9e)" },
      { en: "Personal expenses and tips", no: "Personlige utgifter og tips", fr: "D\xE9penses personnelles et pourboires" }
    ]
  },
  // ===== 7D6N — Morocco Highlights =====
  {
    slug: "morocco-highlights",
    chapter: "04",
    title: { en: "Morocco Highlights", no: "Marokko-h\xF8ydepunkter", fr: "Les Incontournables du Maroc" },
    duration: "7D6N",
    days: 7,
    nights: 6,
    route: "Marrakech \u2192 Dades \u2192 Merzouga \u2192 Marrakech",
    priceFromEUR: 1400,
    img: "assets/photos/sahara-camel-sunrise-15.jpg",
    badge: { en: "SIGNATURE TRIP", no: "SIGNATURREISE", fr: "VOYAGE SIGNATURE" },
    themeTags: ["Sahara", "Atlas", "Kasbah", "Merzouga"],
    teaser: { en: "Seven days tracing the full arc of southern Morocco \u2014 Atlas pass, UNESCO kasbah, Sahara dunes, and back.", no: "Syv dager langs den s\xF8rlige Marokko-buen \u2014 Atlaspasset, UNESCO-kasbah, Sahara-dyner og tilbake.", fr: "Sept jours sur l'arc complet du Maroc m\xE9ridional \u2014 col de l'Atlas, kasbah UNESCO, dunes du Sahara, et retour." },
    overview: { en: "Seven days tracing the full arc of southern Morocco. Ancient Marrakech, over the highest mountain pass in Morocco, through a UNESCO kasbah used as a Hollywood film set, into the Sahara for a night under uninterrupted stars, and back over the Atlas. One of the great overland journeys in the world, perfectly paced.", no: "Syv dager langs den s\xF8rlige Marokko-buen. Eldgamle Marrakech, over Marokkos h\xF8yeste fjellpass, gjennom en UNESCO-kasbah brukt som Hollywood-filmsted, inn i Sahara for en natt under uforstyrrete stjerner, og tilbake over Atlas. En av verdens store overlandreiser, perfekt tempo.", fr: "Sept jours sur l'arc complet du Maroc m\xE9ridional. La vieille Marrakech, le plus haut col de montagne du Maroc, une kasbah UNESCO utilis\xE9e comme d\xE9cor de film hollywoodien, dans le Sahara pour une nuit sous des \xE9toiles sans fin, et retour via l'Atlas. L'un des grands voyages overland du monde, parfaitement rythm\xE9." },
    idealFor: { en: "Travellers who want the full southern Morocco experience", no: "Reisende som vil ha den fullstendige S\xF8r-Marokko-opplevelsen", fr: "Voyageurs qui veulent l'exp\xE9rience compl\xE8te du Maroc m\xE9ridional" },
    highlights: [
      { en: "Tizi n'Tichka mountain pass \u2014 2,260m, highest paved road in Morocco", no: "Tizi n'Tichka fjellpass \u2014 2 260m, h\xF8yeste asfalterte vei i Marokko", fr: "Col du Tizi n'Tichka \u2014 2 260m, la plus haute route goudronn\xE9e du Maroc" },
      { en: "A\xEFt Ben Haddou UNESCO kasbah (film set for Gladiator & Game of Thrones)", no: "A\xEFt Ben Haddou UNESCO-kasbah (filmsted for Gladiator og Game of Thrones)", fr: "Kasbah UNESCO d'A\xEFt Ben Haddou (d\xE9cor de Gladiator & Game of Thrones)" },
      { en: "Todra Gorges \u2014 300m limestone walls rising from a 10m-wide canyon", no: "Todra-kl\xF8ftene \u2014 300m kalksteinsvegger fra et 10m bredt canyon", fr: "Gorges du Todra \u2014 parois calcaires de 300m se dressant d'un canyon de 10m de large" },
      { en: "Camel trek into Erg Chebbi at golden hour \u2014 150m dunes", no: "Kamelritt inn i Erg Chebbi i gylden time \u2014 150m h\xF8ye dyner", fr: "Randonn\xE9e \xE0 dos de chameau vers l'Erg Chebbi \xE0 l'heure dor\xE9e \u2014 dunes de 150m" },
      { en: "Sahara sunrise + Berber music \xB7 fire at luxury camp", no: "Sahara-soloppgang + berbermusikk \xB7 b\xE5l i luksusleirplass", fr: "Lever de soleil au Sahara + musique berb\xE8re \xB7 feu dans le camp de luxe" },
      { en: "Dades Gorges S-bends + Valley of Roses scenic drive", no: "Dades-kl\xF8ftene S-svinger + panoramakj\xF8ring Rosedalen", fr: "\xC9pingles des gorges du Dad\xE8s + route panoramique de la Vall\xE9e des Roses" }
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival in Marrakech", no: "Ankomst i Marrakech", fr: "Arriv\xE9e \xE0 Marrakech" }, text: {
        en: "Upon arrival ~~ Driver at the airport with your personalised Marrakech Story name sign || Transfer ~~ Private car to your luxury riad (~20\u201330 min) || Afternoon ~~ Check-in \xB7 welcome mint tea \xB7 freshen up || 19:00 ~~ Dinner at a recommended medina restaurant || Evening ~~ Optional first walk to Jemaa el-Fna square",
        no: "Ved ankomst ~~ Sj\xE5f\xF8r p\xE5 flyplassen med ditt personlige Marrakech Story-navneskilt || Transfer ~~ Privat bil til ditt luksuri\xF8se riad (~20\u201330 min) || Ettermiddag ~~ Innsjekk \xB7 velkomst myntete \xB7 friske opp || 19:00 ~~ Middag p\xE5 anbefalt medina-restaurant || Kveld ~~ Valgfri f\xF8rste tur til Jemaa el-Fna-plassen",
        fr: "\xC0 l'arriv\xE9e ~~ Chauffeur \xE0 l'a\xE9roport avec votre pancarte personnalis\xE9e Marrakech Story || Transfert ~~ Voiture priv\xE9e vers votre riad de luxe (~20\u201330 min) || Apr\xE8s-midi ~~ Enregistrement \xB7 th\xE9 \xE0 la menthe de bienvenue \xB7 rafra\xEEchissement || 19h00 ~~ D\xEEner dans un restaurant recommand\xE9 de la m\xE9dina || Soir ~~ Premi\xE8re balade optionnelle vers la place Jemaa el-Fna"
      } },
      { day: 2, route: { en: "Marrakech \u2014 City & Culture", no: "Marrakech \u2014 By & Kultur", fr: "Marrakech \u2014 Ville & Culture" }, text: {
        en: "07:30 ~~ Breakfast at the riad || 10:00 ~~ Certified guide at the riad \u2014 city tour (3h): medina, souks, tanneries, Bahia Palace || 13:00 ~~ Lunch at leisure || 15:00\u201317:00 ~~ Majorelle Garden + YSL Museum (optional, entrance not incl.) OR hammam & spa || 20:00 ~~ Rooftop dinner recommendation",
        no: "07:30 ~~ Frokost i riaden || 10:00 ~~ Sertifisert guide ved riaden \u2014 byomvisning (3t): medina, souker, garverier, Bahia-palasset || 13:00 ~~ Lunsj etter eget valg || 15:00\u201317:00 ~~ Majorelle-hagen + YSL-museet (valgfritt, inngang ikke inkl.) ELLER hammam & spa || 20:00 ~~ Middagsanbefaling p\xE5 taket",
        fr: "07h30 ~~ Petit-d\xE9jeuner au riad || 10h00 ~~ Guide certifi\xE9 au riad \u2014 visite de la ville (3h) : m\xE9dina, souks, tanneries, Palais Bahia || 13h00 ~~ D\xE9jeuner libre || 15h00\u201317h00 ~~ Jardin Majorelle + Mus\xE9e YSL (optionnel, entr\xE9e non incl.) OU hammam & spa || 20h00 ~~ D\xEEner recommand\xE9 sur un toit-terrasse"
      } },
      { day: 3, route: { en: "Over the Atlas \u2192 Dades Valley", no: "Over Atlas \u2192 Dades-dalen", fr: "Par l'Atlas \u2192 Vall\xE9e du Dad\xE8s" }, text: {
        en: "07:15 ~~ Early departure from Marrakech || 07:15\u201309:00 ~~ Climb the Tizi n'Tichka mountain pass (2,260m) \xB7 photo stop || 09:00\u201310:30 ~~ Descent into the Draa Valley || 10:30\u201312:00 ~~ A\xEFt Ben Haddou UNESCO kasbah \u2014 local guide \xB7 Gladiator & Game of Thrones location || 12:00\u201313:30 ~~ Ouarzazate \xB7 optional Atlas Studios (~40 MAD) \xB7 lunch || 13:30\u201317:00 ~~ Draa Valley \xB7 rose-growing region \xB7 optional argan-oil workshop || 17:00\u201318:30 ~~ Arrive Dades Valley \xB7 guesthouse check-in || 19:30 ~~ Dinner included at the guesthouse",
        no: "07:15 ~~ Tidlig avreise fra Marrakech || 07:15\u201309:00 ~~ Opp Tizi n'Tichka-passet (2 260m) \xB7 fotostopp || 09:00\u201310:30 ~~ Ned i Draa-dalen || 10:30\u201312:00 ~~ A\xEFt Ben Haddou UNESCO-kasbah \u2014 lokal guide \xB7 Gladiator & Game of Thrones-sted || 12:00\u201313:30 ~~ Ouarzazate \xB7 valgfritt Atlas Studios (~40 MAD) \xB7 lunsj || 13:30\u201317:00 ~~ Draa-dalen \xB7 roseregionen \xB7 valgfri arganolje-verksted || 17:00\u201318:30 ~~ Ankomst Dades-dalen \xB7 innsjekk gjestehus || 19:30 ~~ Middag inkludert p\xE5 gjestehuset",
        fr: "07h15 ~~ D\xE9part matinal de Marrakech || 07h15\u201309h00 ~~ Mont\xE9e du col du Tizi n'Tichka (2 260m) \xB7 arr\xEAt photo || 09h00\u201310h30 ~~ Descente dans la vall\xE9e du Draa || 10h30\u201312h00 ~~ Kasbah UNESCO d'A\xEFt Ben Haddou \u2014 guide local \xB7 d\xE9cor de Gladiator & Game of Thrones || 12h00\u201313h30 ~~ Ouarzazate \xB7 Studios Atlas en option (~40 MAD) \xB7 d\xE9jeuner || 13h30\u201317h00 ~~ Vall\xE9e du Draa \xB7 r\xE9gion des roses \xB7 atelier d'huile d'argan optionnel || 17h00\u201318h30 ~~ Arriv\xE9e vall\xE9e du Dad\xE8s \xB7 enregistrement maison d'h\xF4tes || 19h30 ~~ D\xEEner inclus \xE0 la maison d'h\xF4tes"
      } },
      { day: 4, route: { en: "Into the Sahara \u2014 Merzouga", no: "Inn i Sahara \u2014 Merzouga", fr: "Dans le Sahara \u2014 Merzouga" }, text: {
        en: "07:30 ~~ Breakfast at the guesthouse || 08:30 ~~ Depart the Dades Valley || 08:30\u201310:00 ~~ Dades Gorges scenic drive \xB7 photo stops || 10:00\u201312:00 ~~ Todra Gorges \u2014 300m rock walls \xB7 walk between the cliffs || 12:00\u201313:30 ~~ Lunch in the gorge region \xB7 Berber village stop || 13:30\u201316:00 ~~ Drive through the Tinghir palm oases toward the desert || 16:00\u201317:00 ~~ Arrive Merzouga \xB7 drop luggage at camp || 17:00\u201318:00 ~~ Camel trek into the Erg Chebbi dunes (\u20AC30/p \xB7 1h) || 18:00\u201319:00 ~~ Sunset from the top of the dunes || 19:30 ~~ Berber camp \xB7 traditional dinner included || 21:00 ~~ Fire \xB7 music \xB7 stargazing || Night ~~ Overnight in a luxury desert tent",
        no: "07:30 ~~ Frokost p\xE5 gjestehuset || 08:30 ~~ Avreise fra Dades-dalen || 08:30\u201310:00 ~~ Dades-kl\xF8ftene panoramakj\xF8ring \xB7 fotostopp || 10:00\u201312:00 ~~ Todra-kl\xF8ftene \u2014 300m bergvegger \xB7 vandring mellom klippene || 12:00\u201313:30 ~~ Lunsj i kl\xF8fteregionen \xB7 stopp i berberlandsby || 13:30\u201316:00 ~~ Kj\xF8ring gjennom Tinghir-palmeoasene mot \xF8rkenen || 16:00\u201317:00 ~~ Ankomst Merzouga \xB7 lever bagasje i leiren || 17:00\u201318:00 ~~ Kamelritt inn i Erg Chebbi-dynene (\u20AC30/p \xB7 1t) || 18:00\u201319:00 ~~ Solnedgang fra toppen av dynene || 19:30 ~~ Berberleir \xB7 tradisjonell middag inkludert || 21:00 ~~ B\xE5l \xB7 musikk \xB7 stjernekikking || Natt ~~ Overnatting i luksuri\xF8st \xF8rkentelt",
        fr: "07h30 ~~ Petit-d\xE9jeuner \xE0 la maison d'h\xF4tes || 08h30 ~~ D\xE9part de la vall\xE9e du Dad\xE8s || 08h30\u201310h00 ~~ Route panoramique des gorges du Dad\xE8s \xB7 arr\xEAts photo || 10h00\u201312h00 ~~ Gorges du Todra \u2014 parois de 300m \xB7 marche entre les falaises || 12h00\u201313h30 ~~ D\xE9jeuner dans la r\xE9gion des gorges \xB7 arr\xEAt village berb\xE8re || 13h30\u201316h00 ~~ Travers\xE9e des palmeraies de Tinghir vers le d\xE9sert || 16h00\u201317h00 ~~ Arriv\xE9e Merzouga \xB7 d\xE9p\xF4t des bagages au camp || 17h00\u201318h00 ~~ Randonn\xE9e \xE0 dos de chameau dans les dunes de l'Erg Chebbi (\u20AC30/p \xB7 1h) || 18h00\u201319h00 ~~ Coucher de soleil au sommet des dunes || 19h30 ~~ Camp berb\xE8re \xB7 d\xEEner traditionnel inclus || 21h00 ~~ Feu \xB7 musique \xB7 observation des \xE9toiles || Nuit ~~ Nuit en tente de luxe dans le d\xE9sert"
      } },
      { day: 5, route: { en: "Sahara Sunrise & Return to Dades", no: "Sahara-soloppgang & Tilbake til Dades", fr: "Lever de Soleil au Sahara & Retour vers le Dad\xE8s" }, text: {
        en: "06:00 ~~ Wake for the dune sunrise (unmissable) || 07:00 ~~ Berber breakfast at camp || 08:00 ~~ Return by camel or 4x4 to the village || 09:00\u201315:00 ~~ Scenic return drive \xB7 lunch stop at Todra or Dades || 15:00\u201317:00 ~~ Arrive Dades or Ouarzazate \xB7 guesthouse check-in || 19:30 ~~ Dinner included at the guesthouse",
        no: "06:00 ~~ V\xE5kne til soloppgang over dynene (uunng\xE5elig) || 07:00 ~~ Berberfrokost i leiren || 08:00 ~~ Tilbake med kamel eller 4x4 til landsbyen || 09:00\u201315:00 ~~ Panoramakj\xF8ring tilbake \xB7 lunsjstopp ved Todra eller Dades || 15:00\u201317:00 ~~ Ankomst Dades eller Ouarzazate \xB7 innsjekk gjestehus || 19:30 ~~ Middag inkludert p\xE5 gjestehuset",
        fr: "06h00 ~~ R\xE9veil pour le lever de soleil sur les dunes (incontournable) || 07h00 ~~ Petit-d\xE9jeuner berb\xE8re au camp || 08h00 ~~ Retour \xE0 dos de chameau ou en 4x4 vers le village || 09h00\u201315h00 ~~ Route panoramique de retour \xB7 d\xE9jeuner \xE0 Todra ou Dad\xE8s || 15h00\u201317h00 ~~ Arriv\xE9e Dad\xE8s ou Ouarzazate \xB7 enregistrement maison d'h\xF4tes || 19h30 ~~ D\xEEner inclus \xE0 la maison d'h\xF4tes"
      } },
      { day: 6, route: { en: "Atlas Return to Marrakech", no: "Atlas-retur til Marrakech", fr: "Retour par l'Atlas vers Marrakech" }, text: {
        en: "07:30 ~~ Breakfast \xB7 checkout || 08:30\u201313:30 ~~ Scenic return drive (~5h) \xB7 A\xEFt Ben Haddou stop if missed on Day 3 || 13:30 ~~ Arrive Marrakech \xB7 riad check-in || Afternoon ~~ Free: cooking class (\u20AC49/p) \xB7 hammam \xB7 souk shopping || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Frokost \xB7 utsjekk || 08:30\u201313:30 ~~ Panoramakj\xF8ring tilbake (~5t) \xB7 A\xEFt Ben Haddou-stopp om ikke bes\xF8kt dag 3 || 13:30 ~~ Ankomst Marrakech \xB7 innsjekk riad || Ettermiddag ~~ Fritt: matlagingskurs (\u20AC49/p) \xB7 hammam \xB7 souk-shopping || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Petit-d\xE9jeuner \xB7 d\xE9part || 08h30\u201313h30 ~~ Route panoramique de retour (~5h) \xB7 arr\xEAt A\xEFt Ben Haddou si manqu\xE9 au Jour 3 || 13h30 ~~ Arriv\xE9e Marrakech \xB7 enregistrement riad || Apr\xE8s-midi ~~ Libre : cours de cuisine (\u20AC49/p) \xB7 hammam \xB7 shopping au souk || 20h00 ~~ D\xEEner libre"
      } },
      { day: 7, route: { en: "Departure", no: "Avreise", fr: "D\xE9part" }, text: {
        en: "07:30 ~~ Last Moroccan breakfast at the riad || 09:00\u201312:00 ~~ Final walk \xB7 Majorelle Garden optional \xB7 souvenirs || Flight \u22123h ~~ Private transfer to Marrakech Menara Airport",
        no: "07:30 ~~ Siste marokkanske frokost i riaden || 09:00\u201312:00 ~~ Siste tur \xB7 Majorelle-hagen valgfritt \xB7 suvenirer || Fly \u22123t ~~ Privat transfer til Marrakech Menara lufthavn",
        fr: "07h30 ~~ Dernier petit-d\xE9jeuner marocain au riad || 09h00\u201312h00 ~~ Derni\xE8re balade \xB7 Jardin Majorelle en option \xB7 souvenirs || Vol \u22123h ~~ Transfert priv\xE9 vers l'a\xE9roport Marrakech Menara"
      } }
    ],
    included: [
      { en: "Airport transfers with personalised name sign", no: "Flyplasstransfer med personlig navneskilt", fr: "Transferts a\xE9roport avec pancarte personnalis\xE9e" },
      { en: "Private transport throughout (regional drivers rotate for safety)", no: "Privat transport gjennom hele reisen (regionale sj\xE5f\xF8rer bytter av sikkerhetshensyn)", fr: "Transport priv\xE9 tout au long (rotation de chauffeurs r\xE9gionaux pour la s\xE9curit\xE9)" },
      { en: "2 nights luxury riad Marrakech (arrival) \xB7 2 nights authentic guesthouse Dades Valley (dinners included) \xB7 1 night luxury Merzouga desert camp (dinner included) \xB7 1 night luxury riad Marrakech (return)", no: "2 netter luksusriad Marrakech (ankomst) \xB7 2 netter autentisk gjestehus Dades-dalen (middager inkludert) \xB7 1 natt luksus Merzouga-\xF8rkenleir (middag inkludert) \xB7 1 natt luksusriad Marrakech (retur)", fr: "2 nuits riad de luxe Marrakech (arriv\xE9e) \xB7 2 nuits maison d'h\xF4tes authentique vall\xE9e du Dad\xE8s (d\xEEners inclus) \xB7 1 nuit camp d\xE9sertique de luxe Merzouga (d\xEEner inclus) \xB7 1 nuit riad de luxe Marrakech (retour)" },
      { en: "Daily breakfast", no: "Daglig frokost", fr: "Petit-d\xE9jeuner quotidien" },
      { en: "Certified guide \u2014 Marrakech Medina tour (3h)", no: "Sertifisert guide \u2014 Marrakech Medina-omvisning (3t)", fr: "Guide certifi\xE9 \u2014 visite de la M\xE9dina de Marrakech (3h)" },
      { en: "A\xEFt Ben Haddou local guide", no: "A\xEFt Ben Haddou lokal guide", fr: "Guide local d'A\xEFt Ben Haddou" },
      { en: "Camel trek into Erg Chebbi at sunset \u2014 1 hour", no: "Kamelritt inn i Erg Chebbi ved solnedgang \u2014 1 time", fr: "Randonn\xE9e \xE0 dos de chameau vers l'Erg Chebbi au coucher du soleil \u2014 1 heure" },
      { en: "Live Berber music & entertainment at Sahara camp", no: "Levende berbermusikk & underholdning i Sahara-leiren", fr: "Musique berb\xE8re en direct & divertissements au camp du Sahara" },
      { en: "24/7 WhatsApp support \u2014 Aladdin & Marte", no: "24/7 WhatsApp-st\xF8tte \u2014 Aladdin & Marte", fr: "Assistance WhatsApp 24h/24 \u2014 Aladdin & Marte" }
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches throughout", no: "Lunsjer gjennom hele reisen", fr: "D\xE9jeuners tout au long du voyage" },
      { en: "Dinners in Marrakech (Days 1, 2, 6)", no: "Middager i Marrakech (dag 1, 2, 6)", fr: "D\xEEners \xE0 Marrakech (Jours 1, 2, 6)" },
      { en: "A\xEFt Ben Haddou local guide fee (~100 MAD/p)", no: "A\xEFt Ben Haddou lokal guide honorar (~100 MAD/p)", fr: "Honoraire du guide local d'A\xEFt Ben Haddou (~100 MAD/p)" },
      { en: "Atlas Studios Ouarzazate entrance (~40 MAD)", no: "Atlas Studios Ouarzazate inngang (~40 MAD)", fr: "Entr\xE9e des Studios Atlas Ouarzazate (~40 MAD)" },
      { en: "Optional activities: camel (\u20AC30/p) \xB7 quad (\u20AC40/p) \xB7 sandboarding", no: "Valgfrie aktiviteter: kamel (\u20AC30/p) \xB7 quad (\u20AC40/p) \xB7 sandboarding", fr: "Activit\xE9s optionnelles : chameau (\u20AC30/p) \xB7 quad (\u20AC40/p) \xB7 sandboard" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommand\xE9e)" },
      { en: "Personal expenses and tips", no: "Personlige utgifter og tips", fr: "D\xE9penses personnelles et pourboires" }
    ]
  },
  // ===== 10D9N — Grand Morocco Journey =====
  {
    slug: "grand-morocco-journey",
    chapter: "05",
    title: { en: "Grand Morocco Journey", no: "Den store Marokko-reisen", fr: "Le Grand Voyage Maroc" },
    duration: "10D9N",
    days: 10,
    nights: 9,
    route: "Tangier \u2192 Chefchaouen \u2192 Fez \u2192 Sahara \u2192 Marrakech",
    priceFromEUR: 2200,
    img: "assets/photos/chefchaouen-blue-alley-01.jpg",
    themeTags: ["Imperial cities", "Sahara", "Slow travel"],
    teaser: { en: "North and south joined. Tangier, Chefchaouen, Fez, the Sahara, Marrakech.", no: "Nord og s\xF8r forent. Tanger, Chefchaouen, Fes, Sahara, Marrakech.", fr: "Nord et sud r\xE9unis. Tanger, Chefchaouen, F\xE8s, le Sahara, Marrakech." },
    overview: { en: "A circuit, not a loop. You land in the north, drift through Chefchaouen's blue alleys, give Fez two full days, descend to the Sahara, then end where most people begin \u2014 Marrakech. The country unfolds at the right pace, and you fly out from the south knowing you actually saw Morocco.", no: "Et kretsl\xF8p, ikke en rundtur. Du lander i nord, vandrer gjennom Chefchaouens bl\xE5 smug, gir Fes to fulle dager, stiger ned til Sahara og avslutter der de fleste begynner \u2014 Marrakech. Landet \xE5pner seg i riktig tempo, og du flyr s\xF8rfra med visshet om at du faktisk s\xE5 Marokko.", fr: "Un circuit, pas une boucle. Vous atterrissez au nord, vous d\xE9rivez dans les ruelles bleues de Chefchaouen, vous consacrez deux jours entiers \xE0 F\xE8s, vous descendez vers le Sahara, puis vous terminez l\xE0 o\xF9 la plupart commencent \u2014 Marrakech. Le pays se d\xE9roule au bon rythme, et vous reprenez l'avion depuis le sud en sachant que vous avez vraiment vu le Maroc." },
    idealFor: { en: "Travellers who want the whole country", no: "Reisende som vil se hele landet", fr: "Voyageurs qui veulent voir tout le pays" },
    highlights: [
      { en: "The blue medina of Chefchaouen", no: "Den bl\xE5 medina i Chefchaouen", fr: "La m\xE9dina bleue de Chefchaouen" },
      { en: "Volubilis Roman ruins", no: "Romerruinene i Volubilis", fr: "Les ruines romaines de Volubilis" },
      { en: "Full-day specialist Fez tour", no: "Heldags spesialisttur i Fes", fr: "Visite sp\xE9cialis\xE9e de F\xE8s toute la journ\xE9e" },
      { en: "Cedar forests of Ifrane + Barbary macaques", no: "Sedertreskogene i Ifrane + berberap\xADer", fr: "For\xEAts de c\xE8dres d'Ifrane + macaques de Barbarie" },
      { en: "Camel caravan into Erg Chebbi", no: "Kamelkaravane inn i Erg Chebbi", fr: "Caravane de chameaux vers l'Erg Chebbi" },
      { en: "A\xEFt Ben Haddou + Atlas pass", no: "A\xEFt Ben Haddou + Atlaspasset", fr: "A\xEFt Ben Haddou + col de l'Atlas" },
      { en: "Marrakech medina day", no: "Medinadag i Marrakech", fr: "Journ\xE9e m\xE9dina \xE0 Marrakech" }
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival Tangier \xB7 north to Chefchaouen", no: "Ankomst Tanger \xB7 nordover til Chefchaouen", fr: "Arriv\xE9e Tanger \xB7 cap au nord vers Chefchaouen" }, text: {
        en: "14:20 ~~ Arrive Tangier Ibn Batouta Airport (TNG) || Upon arrival ~~ Driver waiting with your personalised Marrakech Story name sign || 14:45 ~~ Private transfer to Chefchaouen via the Rif (~2.5h) || 17:00 ~~ Boutique hotel check-in || 18:30 ~~ Walk to the Spanish Mosque viewpoint for sunset over the blue town || 20:00 ~~ Dinner at leisure in the blue medina",
        no: "14:20 ~~ Ankomst Tanger Ibn Batouta lufthavn (TNG) || Ved ankomst ~~ Sj\xE5f\xF8r venter med ditt personlige Marrakech Story-navneskilt || 14:45 ~~ Privat transfer til Chefchaouen via Rif (~2,5t) || 17:00 ~~ Innsjekk boutique-hotell || 18:30 ~~ Tur til Den spanske moskeens utsiktspunkt for solnedgang over den bl\xE5 byen || 20:00 ~~ Middag etter eget valg i den bl\xE5 medina",
        fr: "14h20 ~~ Arriv\xE9e \xE0 l'a\xE9roport Tanger Ibn Batouta (TNG) || \xC0 l'arriv\xE9e ~~ Chauffeur avec votre pancarte personnalis\xE9e Marrakech Story || 14h45 ~~ Transfert priv\xE9 vers Chefchaouen via le Rif (~2h30) || 17h00 ~~ Enregistrement h\xF4tel de charme || 18h30 ~~ Mont\xE9e au belv\xE9d\xE8re de la Mosqu\xE9e Espagnole pour le coucher de soleil sur la ville bleue || 20h00 ~~ D\xEEner libre dans la m\xE9dina bleue"
      } },
      { day: 2, route: { en: "Chefchaouen, slowly", no: "Chefchaouen, i rolig tempo", fr: "Chefchaouen, en douceur" }, text: {
        en: "07:30 ~~ Breakfast || 10:00 ~~ Certified guide at the hotel entrance || 10:00\u201313:00 ~~ Guided blue-medina tour: the kasbah, Plaza Uta el-Hammam, the dyers' alleys, viewpoints || 13:00\u201315:00 ~~ Lunch at a terrace restaurant || 15:00\u201318:00 ~~ Free: Ras El-Maa waterfall hike \xB7 shopping \xB7 Spanish Mosque sunset || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Frokost || 10:00 ~~ Sertifisert guide ved hotellinngangen || 10:00\u201313:00 ~~ Guidet tur i den bl\xE5 medina: kasbahen, Plaza Uta el-Hammam, fargernes smug, utsiktspunkter || 13:00\u201315:00 ~~ Lunsj p\xE5 terrasserestaurant || 15:00\u201318:00 ~~ Fritt: Ras El-Maa-fossen \xB7 shopping \xB7 solnedgang fra Den spanske mosk\xE9 || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Petit-d\xE9jeuner || 10h00 ~~ Guide certifi\xE9 \xE0 l'entr\xE9e de l'h\xF4tel || 10h00\u201313h00 ~~ Visite guid\xE9e de la m\xE9dina bleue : la casbah, Plaza Uta el-Hammam, les ruelles des teinturiers, belv\xE9d\xE8res || 13h00\u201315h00 ~~ D\xE9jeuner en terrasse || 15h00\u201318h00 ~~ Libre : cascade Ras El-Maa \xB7 shopping \xB7 coucher de soleil Mosqu\xE9e Espagnole || 20h00 ~~ D\xEEner libre"
      } },
      { day: 3, route: { en: "Chefchaouen \u2192 Fez", no: "Chefchaouen \u2192 Fes", fr: "Chefchaouen \u2192 F\xE8s" }, text: {
        en: "07:30 ~~ Breakfast \xB7 checkout || 09:00 ~~ Private transport toward Fez (~4h with stops) || 12:00\u201313:30 ~~ Volubilis Roman ruins \xB7 brief guided visit (1h) \xB7 lunch || 14:30 ~~ Arrive Fez \xB7 riad check-in in the medina || 19:00 ~~ Rooftop drink at the evening call to prayer || 20:00 ~~ Dinner at the riad",
        no: "07:30 ~~ Frokost \xB7 utsjekk || 09:00 ~~ Privat transport mot Fes (~4t med stopp) || 12:00\u201313:30 ~~ Volubilis romerruiner \xB7 kort guidet bes\xF8k (1t) \xB7 lunsj || 14:30 ~~ Ankomst Fes \xB7 innsjekk riad i medina || 19:00 ~~ Takedrikk ved kveldsb\xF8nnen || 20:00 ~~ Middag i riaden",
        fr: "07h30 ~~ Petit-d\xE9jeuner \xB7 d\xE9part || 09h00 ~~ Transport priv\xE9 vers F\xE8s (~4h avec arr\xEAts) || 12h00\u201313h30 ~~ Ruines romaines de Volubilis \xB7 br\xE8ve visite guid\xE9e (1h) \xB7 d\xE9jeuner || 14h30 ~~ Arriv\xE9e F\xE8s \xB7 enregistrement riad dans la m\xE9dina || 19h00 ~~ Verre en terrasse \xE0 l'appel \xE0 la pri\xE8re || 20h00 ~~ D\xEEner au riad"
      } },
      { day: 4, route: { en: "Fez, in depth", no: "Fes i dybden", fr: "F\xE8s, en profondeur" }, text: {
        en: "07:30 ~~ Breakfast || 10:00 ~~ Specialist Fez guide at the riad entrance || 10:00\u201313:00 ~~ Guided UNESCO medina tour: Chouara tanneries, Al-Qarawiyyin (oldest university), Bou Inania & Al-Attarine madrasas, artisan quarters || 13:00 ~~ Lunch at a working riad || 15:00\u201318:00 ~~ Free: pottery/mosaic workshop \xB7 hammam || 20:00 ~~ Dinner \u2014 pigeon pastilla recommended",
        no: "07:30 ~~ Frokost || 10:00 ~~ Fes-spesialistguide ved riad-inngangen || 10:00\u201313:00 ~~ Guidet UNESCO-medinatur: Chouara-garveriene, Al-Qarawiyyin (verdens eldste universitet), Bou Inania & Al-Attarine madrasaer, h\xE5ndverkerkvarteret || 13:00 ~~ Lunsj i et aktivt riad || 15:00\u201318:00 ~~ Fritt: keramikk/mosaikk-verksted \xB7 hammam || 20:00 ~~ Middag \u2014 duepastilla anbefales",
        fr: "07h30 ~~ Petit-d\xE9jeuner || 10h00 ~~ Guide sp\xE9cialiste de F\xE8s \xE0 l'entr\xE9e du riad || 10h00\u201313h00 ~~ Visite guid\xE9e de la m\xE9dina UNESCO : tanneries Chouara, Al-Qarawiyyin (plus vieille universit\xE9), medersas Bou Inania & Al-Attarine, quartiers artisanaux || 13h00 ~~ D\xE9jeuner dans un riad actif || 15h00\u201318h00 ~~ Libre : atelier poterie/mosa\xEFque \xB7 hammam || 20h00 ~~ D\xEEner \u2014 pastilla au pigeon recommand\xE9e"
      } },
      { day: 5, route: { en: "Fez \u2192 Merzouga via the Middle Atlas", no: "Fes \u2192 Merzouga via Mellom-Atlas", fr: "F\xE8s \u2192 Merzouga via le Moyen Atlas" }, text: {
        en: "07:30 ~~ Early breakfast \xB7 checkout || 08:30 ~~ Depart Fez (~8h total) || 09:30\u201311:00 ~~ Cedar forests of Azrou/Ifrane \xB7 Barbary macaque monkeys || 11:00\u201313:00 ~~ Midelt \xB7 Atlas peaks photo stops || 13:00 ~~ Lunch break || 14:00\u201317:00 ~~ Ziz Valley \xB7 Erfoud \xB7 Rissani \xB7 palm oases \xB7 Sahara begins || 17:30 ~~ Camel caravan into Erg Chebbi at sunset (1h) || 19:30 ~~ Luxury desert camp \xB7 dinner with Berber music || Night ~~ Overnight in a luxury tent",
        no: "07:30 ~~ Tidlig frokost \xB7 utsjekk || 08:30 ~~ Avreise Fes (~8t totalt) || 09:30\u201311:00 ~~ Sedertreskogene i Azrou/Ifrane \xB7 berberaper || 11:00\u201313:00 ~~ Midelt \xB7 fotostopp Atlas-toppene || 13:00 ~~ Lunsjpause || 14:00\u201317:00 ~~ Ziz-dalen \xB7 Erfoud \xB7 Rissani \xB7 palmeoaser \xB7 Sahara begynner || 17:30 ~~ Kamelkaravane inn i Erg Chebbi i solnedgang (1t) || 19:30 ~~ Luksus \xF8rkenleir \xB7 middag med berbermusikk || Natt ~~ Overnatting i luksustelt",
        fr: "07h30 ~~ Petit-d\xE9jeuner t\xF4t \xB7 d\xE9part || 08h30 ~~ D\xE9part de F\xE8s (~8h au total) || 09h30\u201311h00 ~~ For\xEAts de c\xE8dres d'Azrou/Ifrane \xB7 macaques de Barbarie || 11h00\u201313h00 ~~ Midelt \xB7 arr\xEAts photo sommets de l'Atlas || 13h00 ~~ Pause d\xE9jeuner || 14h00\u201317h00 ~~ Vall\xE9e du Ziz \xB7 Erfoud \xB7 Rissani \xB7 palmeraies \xB7 d\xE9but du Sahara || 17h30 ~~ Caravane de chameaux vers l'Erg Chebbi au coucher du soleil (1h) || 19h30 ~~ Camp d\xE9sertique de luxe \xB7 d\xEEner avec musique berb\xE8re || Nuit ~~ Nuit en tente de luxe"
      } },
      { day: 6, route: { en: "The Sahara day", no: "Sahara-dagen", fr: "La journ\xE9e Sahara" }, text: {
        en: "06:00 ~~ Optional sunrise hike on the dunes || 07:30 ~~ Berber breakfast at camp || 09:00\u201312:00 ~~ Bedouin family visit (availability permitting) OR jeep excursion OR relax || 12:00\u201314:00 ~~ Lunch near the village (not included) || 14:00\u201317:00 ~~ Sandboarding \xB7 nomad village visit \xB7 photography || 19:30 ~~ Dinner at camp included || Night ~~ Second overnight in a luxury tent",
        no: "06:00 ~~ Valgfri soloppgangstur p\xE5 dynene || 07:30 ~~ Berberfrokost i leiren || 09:00\u201312:00 ~~ Bes\xF8k hos beduinfamilie (ved tilgjengelighet) ELLER jeep-tur ELLER hvile || 12:00\u201314:00 ~~ Lunsj n\xE6r landsbyen (ikke inkludert) || 14:00\u201317:00 ~~ Sandboarding \xB7 bes\xF8k i nomadelandsby \xB7 fotografering || 19:30 ~~ Middag i leiren inkludert || Natt ~~ Andre overnatting i luksustelt",
        fr: "06h00 ~~ Randonn\xE9e optionnelle au lever du soleil sur les dunes || 07h30 ~~ Petit-d\xE9jeuner berb\xE8re au camp || 09h00\u201312h00 ~~ Visite d'une famille b\xE9douine (selon disponibilit\xE9) OU excursion en jeep OU repos || 12h00\u201314h00 ~~ D\xE9jeuner pr\xE8s du village (non inclus) || 14h00\u201317h00 ~~ Sandboard \xB7 visite d'un village nomade \xB7 photographie || 19h30 ~~ D\xEEner au camp inclus || Nuit ~~ Deuxi\xE8me nuit en tente de luxe"
      } },
      { day: 7, route: { en: "Merzouga \u2192 Dades Valley", no: "Merzouga \u2192 Dades-dalen", fr: "Merzouga \u2192 Vall\xE9e du Dad\xE8s" }, text: {
        en: '07:30 ~~ Breakfast \xB7 checkout || 08:30\u201311:00 ~~ Todra Gorges \u2014 300m rock walls \xB7 walk between the cliffs || 11:00\u201313:00 ~~ Through the Tinghir palm oases || 13:00 ~~ Lunch in the gorge region || 14:00\u201316:30 ~~ Dades Gorges \u2014 "road of a thousand kasbahs" \xB7 serpentine photo stops || 17:00 ~~ Dades Valley \xB7 kasbah hotel check-in || 19:30 ~~ Dinner included',
        no: '07:30 ~~ Frokost \xB7 utsjekk || 08:30\u201311:00 ~~ Todra-kl\xF8ftene \u2014 300m bergvegger \xB7 vandring mellom klippene || 11:00\u201313:00 ~~ Gjennom Tinghir-palmeoasene || 13:00 ~~ Lunsj i kl\xF8fteregionen || 14:00\u201316:30 ~~ Dades-kl\xF8ftene \u2014 "veien med tusen kasbaher" \xB7 slyngende fotostopp || 17:00 ~~ Dades-dalen \xB7 innsjekk kasbah-hotell || 19:30 ~~ Middag inkludert',
        fr: '07h30 ~~ Petit-d\xE9jeuner \xB7 d\xE9part || 08h30\u201311h00 ~~ Gorges du Todra \u2014 parois de 300m \xB7 marche entre les falaises || 11h00\u201313h00 ~~ \xC0 travers les palmeraies de Tinghir || 13h00 ~~ D\xE9jeuner dans la r\xE9gion des gorges || 14h00\u201316h30 ~~ Gorges du Dad\xE8s \u2014 "route des mille kasbahs" \xB7 arr\xEAts photo en serpentin || 17h00 ~~ Vall\xE9e du Dad\xE8s \xB7 enregistrement h\xF4tel-kasbah || 19h30 ~~ D\xEEner inclus'
      } },
      { day: 8, route: { en: "Dades \u2192 Marrakech via A\xEFt Ben Haddou", no: "Dades \u2192 Marrakech via A\xEFt Ben Haddou", fr: "Dad\xE8s \u2192 Marrakech via A\xEFt Ben Haddou" }, text: {
        en: "07:30 ~~ Breakfast \xB7 checkout || 08:30\u201310:30 ~~ Ouarzazate \xB7 optional Atlas Film Studios (~40 MAD) || 10:30\u201312:00 ~~ A\xEFt Ben Haddou UNESCO kasbah \xB7 local guide || 12:00\u201313:30 ~~ Lunch near the kasbah || 13:30\u201318:00 ~~ Cross the High Atlas via Tizi n'Tichka (2,260m) \u2192 Marrakech || 18:00 ~~ Marrakech riad check-in || 20:00 ~~ Dinner in the medina",
        no: "07:30 ~~ Frokost \xB7 utsjekk || 08:30\u201310:30 ~~ Ouarzazate \xB7 valgfritt Atlas Film Studios (~40 MAD) || 10:30\u201312:00 ~~ A\xEFt Ben Haddou UNESCO-kasbah \xB7 lokal guide || 12:00\u201313:30 ~~ Lunsj n\xE6r kasbahen || 13:30\u201318:00 ~~ Kryss H\xF8yatlas via Tizi n'Tichka (2 260m) \u2192 Marrakech || 18:00 ~~ Innsjekk riad i Marrakech || 20:00 ~~ Middag i medina",
        fr: "07h30 ~~ Petit-d\xE9jeuner \xB7 d\xE9part || 08h30\u201310h30 ~~ Ouarzazate \xB7 Studios Atlas en option (~40 MAD) || 10h30\u201312h00 ~~ Kasbah UNESCO d'A\xEFt Ben Haddou \xB7 guide local || 12h00\u201313h30 ~~ D\xE9jeuner pr\xE8s de la kasbah || 13h30\u201318h00 ~~ Travers\xE9e du Haut Atlas via Tizi n'Tichka (2 260m) \u2192 Marrakech || 18h00 ~~ Enregistrement riad \xE0 Marrakech || 20h00 ~~ D\xEEner dans la m\xE9dina"
      } },
      { day: 9, route: { en: "Marrakech \u2014 your choice", no: "Marrakech \u2014 ditt valg", fr: "Marrakech \u2014 votre choix" }, text: {
        en: "07:30 ~~ Breakfast || 10:00\u201313:00 ~~ Guided medina walking tour (3h) || 13:00 ~~ Lunch at a partner riad || 15:00\u201318:00 ~~ Free: hammam \xB7 Majorelle Garden \xB7 balloon or paragliding (pre-bookable) || 20:00 ~~ Farewell dinner at a special table booked for you",
        no: "07:30 ~~ Frokost || 10:00\u201313:00 ~~ Guidet medinavandring (3t) || 13:00 ~~ Lunsj i et partner-riad || 15:00\u201318:00 ~~ Fritt: hammam \xB7 Majorelle-hagen \xB7 ballong eller paragliding (forh\xE5ndsbestilles) || 20:00 ~~ Avskjedsmiddag ved et spesialbord bestilt for deg",
        fr: "07h30 ~~ Petit-d\xE9jeuner || 10h00\u201313h00 ~~ Visite \xE0 pied guid\xE9e de la m\xE9dina (3h) || 13h00 ~~ D\xE9jeuner dans un riad partenaire || 15h00\u201318h00 ~~ Libre : hammam \xB7 Jardin Majorelle \xB7 montgolfi\xE8re ou parapente (r\xE9servable) || 20h00 ~~ D\xEEner d'adieu \xE0 une table sp\xE9ciale r\xE9serv\xE9e pour vous"
      } },
      { day: 10, route: { en: "Departure", no: "Avreise", fr: "D\xE9part" }, text: {
        en: "07:30 ~~ Final breakfast \xB7 free morning || Flight \u22123h ~~ Private transfer to Marrakech Menara Airport (RAK)",
        no: "07:30 ~~ Siste frokost \xB7 fri morgen || Fly \u22123t ~~ Privat transfer til Marrakech Menara lufthavn (RAK)",
        fr: "07h30 ~~ Dernier petit-d\xE9jeuner \xB7 matin\xE9e libre || Vol \u22123h ~~ Transfert priv\xE9 vers l'a\xE9roport Marrakech Menara (RAK)"
      } }
    ],
    included: [
      { en: "Private airport pickup in Tangier and drop-off in Marrakech", no: "Privat henting p\xE5 flyplassen i Tanger og avsetting i Marrakech", fr: "Prise en charge priv\xE9e \xE0 l'a\xE9roport de Tanger et d\xE9p\xF4t \xE0 Marrakech" },
      { en: "Private vehicle with English-speaking driver for the entire route (regional drivers rotate for safety)", no: "Privat kj\xF8ret\xF8y med engelsktalende sj\xE5f\xF8r for hele ruten (regionale sj\xE5f\xF8rer bytter av sikkerhetshensyn)", fr: "V\xE9hicule priv\xE9 avec chauffeur anglophone pour l'ensemble du trajet (rotation de chauffeurs r\xE9gionaux pour la s\xE9curit\xE9)" },
      { en: "Two nights in Chefchaouen, two in Fez, two in the Sahara, one in Dades, two in Marrakech \u2014 all breakfasts", no: "To netter i Chefchaouen, to i Fes, to i Sahara, \xE9n i Dades, to i Marrakech \u2014 alle frokoster", fr: "Deux nuits \xE0 Chefchaouen, deux \xE0 F\xE8s, deux au Sahara, une dans le Dad\xE8s, deux \xE0 Marrakech \u2014 tous les petits-d\xE9jeuners" },
      { en: "Guided tours: Chefchaouen (half-day), Volubilis (1h), Fez (full day with specialist), A\xEFt Ben Haddou (1h), Marrakech medina (3h)", no: "Guidede turer: Chefchaouen (halvdag), Volubilis (1t), Fes (heldags med spesialist), A\xEFt Ben Haddou (1t), Marrakech-medina (3t)", fr: "Visites guid\xE9es : Chefchaouen (demi-journ\xE9e), Volubilis (1h), F\xE8s (journ\xE9e enti\xE8re avec sp\xE9cialiste), A\xEFt Ben Haddou (1h), m\xE9dina de Marrakech (3h)" },
      { en: "Camel caravan into the Sahara at sunset (or 4\xD74 alternative)", no: "Kamelkaravane inn i Sahara i solnedgang (eller 4\xD74 alternativ)", fr: "Caravane de chameaux dans le Sahara au coucher du soleil (ou alternative en 4\xD74)" },
      { en: "Berber family visit in Merzouga", no: "Bes\xF8k hos berberfamilie i Merzouga", fr: "Visite d'une famille berb\xE8re \xE0 Merzouga" },
      { en: "Lunches and dinners as listed (most days)", no: "Lunsjer og middager som oppgitt (de fleste dager)", fr: "D\xE9jeuners et d\xEEners tels que list\xE9s (la plupart des jours)" },
      { en: "24/7 WhatsApp support", no: "24/7 WhatsApp-st\xF8tte", fr: "Assistance WhatsApp 24h/24" },
      { en: "Pre-departure briefing pack: weather, packing, currency, etiquette", no: "Forbriefingpakke: v\xE6r, pakking, valuta, etikette", fr: "Pack de briefing pr\xE9-d\xE9part : m\xE9t\xE9o, bagages, monnaie, \xE9tiquette" }
    ],
    excluded: [
      { en: "International flights (open-jaw: TNG in, RAK out \u2014 we help with ticketing)", no: "Internasjonale flyreiser (\xE5pen kjeve: TNG inn, RAK ut \u2014 vi hjelper med billetter)", fr: "Vols internationaux (open-jaw : TNG \xE0 l'aller, RAK au retour \u2014 nous aidons pour la billetterie)" },
      { en: "Drinks outside set menus, alcohol", no: "Drikke utenom faste menyer, alkohol", fr: "Boissons hors menus fixes, alcool" },
      { en: "Hammam, spa, optional excursions", no: "Hammam, spa, valgfrie utflukter", fr: "Hammam, spa, excursions optionnelles" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" },
      { en: "Visa fees if applicable", no: "Visumavgifter hvis aktuelt", fr: "Frais de visa le cas \xE9ch\xE9ant" }
    ]
  },
  // ===== 14D13N — Full Morocco Honeymoon =====
  {
    slug: "full-morocco-honeymoon",
    chapter: "06",
    title: { en: "Full Morocco Honeymoon", no: "Fullt Marokko-bryllupsreise", fr: "Lune de Miel Maroc Complet" },
    duration: "14D13N",
    days: 14,
    nights: 13,
    route: "Agadir \u2192 Marrakech \u2192 Sahara \u2192 Fes \u2192 Chefchaouen \u2192 Tangier",
    priceFromEUR: 3200,
    img: "assets/photos/agafay-night-lounge-05.jpg",
    badge: { en: "GRAND TOUR", no: "GRAND TOUR", fr: "GRAND TOUR" },
    themeTags: ["Atlantic", "Imperial", "Sahara", "Atlas", "Honeymoon"],
    teaser: { en: "Fourteen days. Seven completely different Moroccos \u2014 Atlantic beachfront, the red city, the Sahara, Fes, the blue mountains, the Strait of Gibraltar.", no: "Fjorten dager. Syv helt forskjellige Marokko-er \u2014 atlanterhavsstranden, den r\xF8de byen, Sahara, Fes, de bl\xE5 fjellene, Gibraltarstredet.", fr: "Quatorze jours. Sept Maroc enti\xE8rement diff\xE9rents \u2014 front de mer atlantique, la ville rouge, le Sahara, F\xE8s, les montagnes bleues, le d\xE9troit de Gibraltar." },
    overview: { en: "Designed by Aladdin & Marte as if it were their own anniversary trip \u2014 nothing rushed, nothing missed. Atlantic beachfront in Agadir. The ancient red city. The Sahara for two nights. The world's oldest university city. The blue mountain city of Chefchaouen. The Strait of Gibraltar. Open-jaw routing: fly into Agadir, fly home from Tangier.", no: "Designet av Aladdin & Marte som om det var deres eget jubileumsreise \u2014 ingen hastverk, ingenting glemt. Atlanterhavsstranden i Agadir. Den eldgamle r\xF8de byen. Sahara i to netter. Verdens eldste universitetsstad. Den bl\xE5 fjellbyen Chefchaouen. Gibraltarstredet. \xC5pen billett: fly til Agadir, fly hjem fra Tanger.", fr: "Con\xE7u par Aladdin & Marte comme s'il s'agissait de leur propre voyage d'anniversaire \u2014 rien de pr\xE9cipit\xE9, rien d'oubli\xE9. Front de mer atlantique \xE0 Agadir. La vieille ville rouge. Le Sahara pour deux nuits. La ville universitaire la plus ancienne du monde. La ville bleue de montagne de Chefchaouen. Le d\xE9troit de Gibraltar. Routing open-jaw : volez vers Agadir, rentrez depuis Tanger." },
    idealFor: { en: "Honeymooners, slow travellers, couples who want the full Morocco story", no: "Bryllupsreisende, slow-travel-entusiaster, par som vil ha hele Marokko-historien", fr: "Voyageurs en lune de miel, slow travellers, couples qui veulent vivre toute l'histoire du Maroc" },
    highlights: [
      { en: "3 free Atlantic beach days in Agadir", no: "3 frie Atlanterhavsstrands-dager i Agadir", fr: "3 journ\xE9es libres sur la plage atlantique \xE0 Agadir" },
      { en: "Honeymoon welcome surprise at Marrakech riad", no: "Bryllupsreise velkomstoveraskelse i Marrakech riad", fr: "Surprise de bienvenue lune de miel au riad de Marrakech" },
      { en: "Moroccan cooking class + couples luxury hammam", no: "Marokkansk matkurs + luksuri\xF8st parhammam", fr: "Cours de cuisine marocaine + hammam de luxe en couple" },
      { en: "Two nights in the Sahara \u2014 sunrise dunes, Berber music, stargazing", no: "To netter i Sahara \u2014 soloppgangsdyner, berbermusikk, stjernekikking", fr: "Deux nuits au Sahara \u2014 dunes au lever du soleil, musique berb\xE8re, observation des \xE9toiles" },
      { en: "Full-day Fes specialist guide \u2014 tanneries, Al-Qarawiyyin, madrasas", no: "Heldags Fes-spesialistguide \u2014 garveriene, Al-Qarawiyyin, madrasaer", fr: "Guide sp\xE9cialis\xE9 F\xE8s toute la journ\xE9e \u2014 tanneries, Al-Qarawiyyin, m\xE9dersas" },
      { en: "Chefchaouen blue medina + Spanish Mosque panorama", no: "Chefchaouens bl\xE5 medina + Det spanske moskeens panorama", fr: "M\xE9dina bleue de Chefchaouen + panorama de la Mosqu\xE9e Espagnole" },
      { en: "Cap Spartel \u2014 where the Atlantic meets the Mediterranean", no: "Cap Spartel \u2014 der Atlanterhavet m\xF8ter Middelhavet", fr: "Cap Spartel \u2014 l\xE0 o\xF9 l'Atlantique rencontre la M\xE9diterran\xE9e" }
    ],
    itinerary: [
      { day: 1, route: { en: "Arrive Agadir \xB7 The Atlantic", no: "Ankomst Agadir \xB7 Atlanterhavet", fr: "Arriv\xE9e Agadir \xB7 L'Atlantique" }, text: {
        en: "Upon arrival ~~ Private pickup at Agadir Al Massira Airport with your personalised name sign || Transfer ~~ Private car to your 4\u2605 beachfront hotel on the Agadir Corniche (~45 min) || Afternoon ~~ Check-in \xB7 settle in || 18:30 ~~ Beach promenade at sunset || 20:00 ~~ Fresh seafood dinner on the Corniche",
        no: "Ved ankomst ~~ Privat henting p\xE5 Agadir Al Massira lufthavn med ditt personlige navneskilt || Transfer ~~ Privat bil til ditt 4\u2605 strandhotell p\xE5 Agadir Corniche (~45 min) || Ettermiddag ~~ Innsjekk \xB7 falle til ro || 18:30 ~~ Strandpromenade ved solnedgang || 20:00 ~~ Fersk sj\xF8matmiddag p\xE5 Corniche",
        fr: "\xC0 l'arriv\xE9e ~~ Prise en charge priv\xE9e \xE0 l'a\xE9roport Agadir Al Massira avec votre pancarte personnalis\xE9e || Transfert ~~ Voiture priv\xE9e vers votre h\xF4tel 4\u2605 en bord de mer sur la Corniche d'Agadir (~45 min) || Apr\xE8s-midi ~~ Enregistrement \xB7 installation || 18h30 ~~ Promenade sur la plage au coucher du soleil || 20h00 ~~ D\xEEner de fruits de mer frais sur la Corniche"
      } },
      { day: 2, route: { en: "Free Atlantic Day", no: "Fri Atlanterhavs-dag", fr: "Journ\xE9e Atlantique Libre" }, text: {
        en: "All day ~~ No schedule \u2014 9 km of golden Atlantic sand, warm calm water, sunbeds & parasols, to decompress before Morocco takes your breath away || Optional ~~ Sunset camel ride on the beach (~250 MAD/p) \xB7 horse riding on the shore (~350 MAD/p) \xB7 surf lesson (~350 MAD/p) \xB7 Paradise Valley natural pools (~600 MAD)",
        no: "Hele dagen ~~ Ingen program \u2014 9 km gyllen atlanterhavssand, varmt stille vann, liggestoler & parasoll, for \xE5 slappe av f\xF8r Marokko tar pusten fra deg || Valgfritt ~~ Kamelritt p\xE5 stranden ved solnedgang (~250 MAD/p) \xB7 ridning ved vannet (~350 MAD/p) \xB7 surfetime (~350 MAD/p) \xB7 Paradisdalen naturlige basseng (~600 MAD)",
        fr: "Toute la journ\xE9e ~~ Aucun programme \u2014 9 km de sable dor\xE9 atlantique, eau chaude et calme, transats & parasols, pour d\xE9compresser avant que le Maroc ne vous coupe le souffle || En option ~~ Balade \xE0 dos de chameau au coucher du soleil (~250 MAD/p) \xB7 \xE9quitation au bord de l'eau (~350 MAD/p) \xB7 cours de surf (~350 MAD/p) \xB7 piscines naturelles de la Vall\xE9e du Paradis (~600 MAD)"
      } },
      { day: 3, route: { en: "Second Free Atlantic Day", no: "Andre frie Atlanterhavs-dag", fr: "Deuxi\xE8me Journ\xE9e Atlantique Libre" }, text: {
        en: 'All day ~~ A second full day entirely at your own pace \u2014 the Atlantic, the beach, complete freedom || Optional ~~ Jet ski on the bay (~600 MAD/p) \xB7 hotel spa \xB7 half-day excursion to Taroudant (the "little Marrakech", 80 km inland)',
        no: 'Hele dagen ~~ En andre full dag helt i eget tempo \u2014 Atlanterhavet, stranden og full frihet || Valgfritt ~~ Jetski p\xE5 bukten (~600 MAD/p) \xB7 hotell-spa \xB7 halvdagstur til Taroudant ("lille Marrakech", 80 km innover)',
        fr: `Toute la journ\xE9e ~~ Une deuxi\xE8me journ\xE9e enti\xE8re \xE0 votre rythme \u2014 l'Atlantique, la plage et la libert\xE9 totale || En option ~~ Jet ski sur la baie (~600 MAD/p) \xB7 spa de l'h\xF4tel \xB7 excursion d'une demi-journ\xE9e \xE0 Taroudant (le "petit Marrakech", \xE0 80 km)`
      } },
      { day: 4, route: { en: "Agadir \u2192 Marrakech \u2014 Through Argan Country", no: "Agadir \u2192 Marrakech \u2014 Gjennom Arganlandskapet", fr: "Agadir \u2192 Marrakech \u2014 \xC0 travers le Pays de l'Argan" }, text: {
        en: "09:00 ~~ Private transfer Agadir \u2192 Marrakech (250 km, ~3.5h) || En route ~~ Argan forest \xB7 women's argan cooperative (hand-pressing, fair prices) \xB7 goats up in the branches || Afternoon ~~ Arrive luxury riad \xB7 honeymoon welcome: rose petals, fresh juice, handwritten note || 20:00 ~~ Romantic candlelit dinner arranged by the concierge",
        no: "09:00 ~~ Privat transfer Agadir \u2192 Marrakech (250 km, ~3,5t) || Underveis ~~ Arganskogen \xB7 kvinnelig argankooperativ (pressing for h\xE5nd, rettferdige priser) \xB7 geiter oppe i grenene || Ettermiddag ~~ Ankomst luksusriad \xB7 bryllupsreise-velkomst: roseblade, fersk juice, h\xE5ndskrevet notat || 20:00 ~~ Romantisk levende lys-middag arrangert av konsiergen",
        fr: "09h00 ~~ Transfert priv\xE9 Agadir \u2192 Marrakech (250 km, ~3h30) || En route ~~ For\xEAt d'arganiers \xB7 coop\xE9rative f\xE9minine d'argan (pression \xE0 la main, prix \xE9quitables) \xB7 ch\xE8vres dans les branches || Apr\xE8s-midi ~~ Arriv\xE9e riad de luxe \xB7 accueil lune de miel : p\xE9tales de rose, jus frais, note manuscrite || 20h00 ~~ D\xEEner romantique aux chandelles organis\xE9 par le concierge"
      } },
      { day: 5, route: { en: "Marrakech \u2014 Medina & Cooking Class", no: "Marrakech \u2014 Medina & Matkurs", fr: "Marrakech \u2014 M\xE9dina & Cours de Cuisine" }, text: {
        en: "07:30 ~~ Moroccan breakfast on the rooftop || 10:00\u201313:00 ~~ Private guided medina tour: Jemaa el-Fna, Koutoubia gardens, Bahia Palace, souk circuit || 13:00 ~~ Market visit for cooking-class ingredients || 13:30\u201316:00 ~~ Cooking class at a traditional riad (\u20AC49/p) \u2014 tagine, pastilla or couscous, then eat together || 20:00 ~~ Romantic dinner in the riad courtyard",
        no: "07:30 ~~ Marokkansk frokost p\xE5 taket || 10:00\u201313:00 ~~ Privat guidet medina-omvisning: Jemaa el-Fna, Koutoubia-hager, Bahia-palasset, souk-krets || 13:00 ~~ Markedsbes\xF8k for matkurs-ingredienser || 13:30\u201316:00 ~~ Matkurs i et tradisjonelt riad (\u20AC49/p) \u2014 tagine, pastilla eller couscous, spis sammen etterp\xE5 || 20:00 ~~ Romantisk middag i riad-g\xE5rdhagen",
        fr: "07h30 ~~ Petit-d\xE9jeuner marocain sur le toit || 10h00\u201313h00 ~~ Visite guid\xE9e priv\xE9e de la m\xE9dina : Jemaa el-Fna, jardins de la Koutoubia, Palais Bahia, circuit des souks || 13h00 ~~ Visite du march\xE9 pour les ingr\xE9dients du cours || 13h30\u201316h00 ~~ Cours de cuisine dans un riad traditionnel (\u20AC49/p) \u2014 tajine, pastilla ou couscous, puis d\xE9gustation ensemble || 20h00 ~~ D\xEEner romantique dans le patio du riad"
      } },
      { day: 6, route: { en: "Marrakech \u2014 Couples Hammam & Choice", no: "Marrakech \u2014 Par-Hammam & Valg", fr: "Marrakech \u2014 Hammam en Couple & Choix" }, text: {
        en: "07:30 ~~ Breakfast || 10:00\u201313:00 ~~ Couples luxury hammam in a private suite \u2014 black soap, kessa exfoliation, ghassoul clay mask, argan-oil massage, mint tea || 13:00 ~~ Lunch at leisure || Afternoon ~~ Choose: Majorelle Garden + YSL Museum (~70 MAD/p) OR Agafay \u2014 sunset camel ride (\u20AC30/p) or Dinner & Show (\u20AC55/p) || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Frokost || 10:00\u201313:00 ~~ Luksuri\xF8st parhammam i privat suite \u2014 svart s\xE5pe, kessa-eksfoliering, ghassoul-leirmaske, arganolje-massasje, myntete || 13:00 ~~ Lunsj etter eget valg || Ettermiddag ~~ Velg: Majorelle-hagen + YSL-museum (~70 MAD/p) ELLER Agafay \u2014 kamelritt ved solnedgang (\u20AC30/p) eller Middag & Show (\u20AC55/p) || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Petit-d\xE9jeuner || 10h00\u201313h00 ~~ Hammam de luxe en couple dans une suite priv\xE9e \u2014 savon noir, exfoliation kessa, masque ghassoul, massage \xE0 l'huile d'argan, th\xE9 \xE0 la menthe || 13h00 ~~ D\xE9jeuner libre || Apr\xE8s-midi ~~ Au choix : Jardin Majorelle + Mus\xE9e YSL (~70 MAD/p) OU Agafay \u2014 chameau au coucher du soleil (\u20AC30/p) ou D\xEEner & Spectacle (\u20AC55/p) || 20h00 ~~ D\xEEner libre"
      } },
      { day: 7, route: { en: "Marrakech \u2192 Dades Valley", no: "Marrakech \u2192 Dades-dalen", fr: "Marrakech \u2192 Vall\xE9e du Dad\xE8s" }, text: {
        en: "07:15 ~~ Early departure || 07:15\u201309:00 ~~ Tizi n'Tichka pass (2,260m) \xB7 photo stop || 10:30\u201312:00 ~~ A\xEFt Ben Haddou UNESCO kasbah (guided 1.5h) \xB7 Gladiator & Game of Thrones location || 12:00\u201313:30 ~~ Ouarzazate lunch || 13:30\u201317:00 ~~ Valley of Roses scenic route || 17:00 ~~ Dades Valley guesthouse \xB7 Atlas & gorge views || 19:30 ~~ Dinner included",
        no: "07:15 ~~ Tidlig avreise || 07:15\u201309:00 ~~ Tizi n'Tichka-passet (2 260m) \xB7 fotostopp || 10:30\u201312:00 ~~ A\xEFt Ben Haddou UNESCO-kasbah (guidet 1,5t) \xB7 Gladiator & Game of Thrones-sted || 12:00\u201313:30 ~~ Ouarzazate lunsj || 13:30\u201317:00 ~~ Rosedalen panoramarute || 17:00 ~~ Dades-dalen gjestehus \xB7 utsikt over Atlas & kl\xF8fter || 19:30 ~~ Middag inkludert",
        fr: "07h15 ~~ D\xE9part matinal || 07h15\u201309h00 ~~ Col du Tizi n'Tichka (2 260m) \xB7 arr\xEAt photo || 10h30\u201312h00 ~~ Kasbah UNESCO d'A\xEFt Ben Haddou (guid\xE9 1h30) \xB7 d\xE9cor de Gladiator & Game of Thrones || 12h00\u201313h30 ~~ D\xE9jeuner \xE0 Ouarzazate || 13h30\u201317h00 ~~ Route panoramique de la Vall\xE9e des Roses || 17h00 ~~ Maison d'h\xF4tes vall\xE9e du Dad\xE8s \xB7 vue Atlas & gorges || 19h30 ~~ D\xEEner inclus"
      } },
      { day: 8, route: { en: "Dades \u2192 Merzouga", no: "Dades \u2192 Merzouga", fr: "Dad\xE8s \u2192 Merzouga" }, text: {
        en: "07:30 ~~ Breakfast || 08:30\u201310:00 ~~ Dades Gorges hairpin S-bends (famous viewpoint) || 10:00\u201312:00 ~~ Todra Gorges \u2014 300m walls \xB7 flat 2 km walk || 12:00\u201313:30 ~~ Tinghir palm oasis lunch || 13:30\u201316:30 ~~ Drive to Merzouga || 17:00\u201318:00 ~~ Camel trek into Erg Chebbi (1h, \u20AC30/p) || 18:00\u201319:00 ~~ Sunset from the 150m dunes || 19:30 ~~ Gnawa welcome \xB7 Moroccan feast under the stars at luxury camp || Night ~~ Overnight in a luxury tent",
        no: "07:30 ~~ Frokost || 08:30\u201310:00 ~~ Dades-kl\xF8ftene harpinssvinger (ber\xF8mt utsiktspunkt) || 10:00\u201312:00 ~~ Todra-kl\xF8ftene \u2014 300m vegger \xB7 flat 2 km vandring || 12:00\u201313:30 ~~ Tinghir palmeoasis lunsj || 13:30\u201316:30 ~~ Kj\xF8ring til Merzouga || 17:00\u201318:00 ~~ Kamelritt inn i Erg Chebbi (1t, \u20AC30/p) || 18:00\u201319:00 ~~ Solnedgang fra de 150m dynene || 19:30 ~~ Gnawa-velkomst \xB7 marokkansk festmiddag under stjernene i luksusleir || Natt ~~ Overnatting i luksustelt",
        fr: "07h30 ~~ Petit-d\xE9jeuner || 08h30\u201310h00 ~~ \xC9pingles en S des gorges du Dad\xE8s (c\xE9l\xE8bre belv\xE9d\xE8re) || 10h00\u201312h00 ~~ Gorges du Todra \u2014 parois de 300m \xB7 marche plate de 2 km || 12h00\u201313h30 ~~ D\xE9jeuner oasis de palmiers de Tinghir || 13h30\u201316h30 ~~ Route vers Merzouga || 17h00\u201318h00 ~~ Randonn\xE9e \xE0 dos de chameau dans l'Erg Chebbi (1h, \u20AC30/p) || 18h00\u201319h00 ~~ Coucher de soleil depuis les dunes de 150m || 19h30 ~~ Accueil Gnawa \xB7 festin marocain sous les \xE9toiles au camp de luxe || Nuit ~~ Nuit en tente de luxe"
      } },
      { day: 9, route: { en: "A Full Day in the Sahara", no: "En hel dag i Sahara", fr: "Une Journ\xE9e Enti\xE8re au Sahara" }, text: {
        en: "06:00 ~~ Sahara sunrise from outside your tent || 07:30 ~~ Berber breakfast at camp || 09:00\u201312:00 ~~ Bedouin family visit (seasonal) \xB7 jeep excursion \xB7 sandboarding \xB7 or complete rest || Afternoon ~~ Camp pool || 18:30 ~~ Second sunset from the dunes || 19:30 ~~ Final desert dinner under the stars",
        no: "06:00 ~~ Sahara-soloppgang fra utsiden av teltet || 07:30 ~~ Berberfrokost i leiren || 09:00\u201312:00 ~~ Beduin-familiebes\xF8k (sesong) \xB7 jeep-utflukt \xB7 sandboarding \xB7 eller fullstendig hvile || Ettermiddag ~~ Leirbasseng || 18:30 ~~ Andre solnedgang fra dynene || 19:30 ~~ Siste \xF8rken-middag under stjernene",
        fr: "06h00 ~~ Lever de soleil au Sahara depuis votre tente || 07h30 ~~ Petit-d\xE9jeuner berb\xE8re au camp || 09h00\u201312h00 ~~ Visite famille b\xE9douine (saisonnier) \xB7 excursion en jeep \xB7 sandboard \xB7 ou repos complet || Apr\xE8s-midi ~~ Piscine du camp || 18h30 ~~ Deuxi\xE8me coucher de soleil sur les dunes || 19h30 ~~ Dernier d\xEEner dans le d\xE9sert sous les \xE9toiles"
      } },
      { day: 10, route: { en: "Merzouga \u2192 Fes", no: "Merzouga \u2192 Fes", fr: "Merzouga \u2192 F\xE8s" }, text: {
        en: "07:30 ~~ Return from the dunes \xB7 breakfast || 08:30 ~~ Scenic drive north to Fes (~450 km, 7\u20138h) || 10:00\u201311:00 ~~ Azrou cedar forest \xB7 Barbary macaques || 13:00 ~~ Midelt lunch || 17:00 ~~ Arrive Fes riad || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Tilbake fra dynene \xB7 frokost || 08:30 ~~ Panoramakj\xF8ring nordover til Fes (~450 km, 7\u20138t) || 10:00\u201311:00 ~~ Azrou-sedertreskogen \xB7 berberaper || 13:00 ~~ Midelt-lunsj || 17:00 ~~ Ankomst Fes riad || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Retour des dunes \xB7 petit-d\xE9jeuner || 08h30 ~~ Route panoramique vers le nord jusqu'\xE0 F\xE8s (~450 km, 7\u20138h) || 10h00\u201311h00 ~~ For\xEAt de c\xE8dres d'Azrou \xB7 macaques de Barbarie || 13h00 ~~ D\xE9jeuner \xE0 Midelt || 17h00 ~~ Arriv\xE9e riad de F\xE8s || 20h00 ~~ D\xEEner libre"
      } },
      { day: 11, route: { en: "Fes \u2014 World's Oldest Living City", no: "Fes \u2014 Verdens eldste levende by", fr: "F\xE8s \u2014 La Plus Ancienne Ville Vivante du Monde" }, text: {
        en: "07:30 ~~ Breakfast || 10:00\u201313:00 ~~ Specialist guide: Chouara tanneries \xB7 Al-Qarawiyyin (oldest university, founded 859 AD) \xB7 Bou Inania Madrasa \xB7 metalworkers' souk \xB7 Nejjarine fountain || 13:00 ~~ Lunch inside the medina || 15:00\u201318:00 ~~ Optional: couples hammam \xB7 Marinid Tombs panorama \xB7 pottery village || 20:00 ~~ Dinner at leisure",
        no: "07:30 ~~ Frokost || 10:00\u201313:00 ~~ Spesialistguide: Chouara-garveriene \xB7 Al-Qarawiyyin (eldste universitet, grunnlagt 859 e.Kr.) \xB7 Bou Inania Madrasa \xB7 metallarbeidernes souk \xB7 Nejjarine-fontenen || 13:00 ~~ Lunsj inne i medina || 15:00\u201318:00 ~~ Valgfritt: parhammam \xB7 Marinid-gravene panorama \xB7 pottemakersby || 20:00 ~~ Middag etter eget valg",
        fr: "07h30 ~~ Petit-d\xE9jeuner || 10h00\u201313h00 ~~ Guide sp\xE9cialiste : tanneries Chouara \xB7 Al-Qarawiyyin (plus vieille universit\xE9, fond\xE9e 859) \xB7 M\xE9dersa Bou Inania \xB7 souk des ferronniers \xB7 fontaine Nejjarine || 13h00 ~~ D\xE9jeuner dans la m\xE9dina || 15h00\u201318h00 ~~ Optionnel : hammam en couple \xB7 panorama Tombeaux M\xE9rinides \xB7 village de poterie || 20h00 ~~ D\xEEner libre"
      } },
      { day: 12, route: { en: "Fes \u2192 Chefchaouen", no: "Fes \u2192 Chefchaouen", fr: "F\xE8s \u2192 Chefchaouen" }, text: {
        en: "07:30 ~~ Breakfast || 09:00 ~~ Private transfer Fes \u2192 Chefchaouen (200 km, ~4h) || 13:00 ~~ Arrive \xB7 free afternoon in the blue alleyways || 18:30 ~~ Spanish Mosque viewpoint at sunset || 20:00 ~~ Dinner in the medina",
        no: "07:30 ~~ Frokost || 09:00 ~~ Privat transfer Fes \u2192 Chefchaouen (200 km, ~4t) || 13:00 ~~ Ankomst \xB7 fri ettermiddag i de bl\xE5 smugene || 18:30 ~~ Den spanske moskeens utsiktspunkt ved solnedgang || 20:00 ~~ Middag i medina",
        fr: "07h30 ~~ Petit-d\xE9jeuner || 09h00 ~~ Transfert priv\xE9 F\xE8s \u2192 Chefchaouen (200 km, ~4h) || 13h00 ~~ Arriv\xE9e \xB7 apr\xE8s-midi libre dans les ruelles bleues || 18h30 ~~ Belv\xE9d\xE8re de la Mosqu\xE9e Espagnole au coucher du soleil || 20h00 ~~ D\xEEner dans la m\xE9dina"
      } },
      { day: 13, route: { en: "Chefchaouen \u2192 Tangier", no: "Chefchaouen \u2192 Tanger", fr: "Chefchaouen \u2192 Tanger" }, text: {
        en: "08:00 ~~ Morning: Ras El Ma waterfall \xB7 viewpoint \xB7 souvenir shopping in the blue alleyways || 11:00 ~~ Private transfer to Tangier (115 km, ~2h) || 14:00 ~~ 4\u2605 hotel check-in || Afternoon ~~ Optional: Cap Spartel (Atlantic meets Mediterranean) \xB7 Hercules Caves (~15 MAD) \xB7 Tangier medina || 20:00 ~~ Final dinner: freshest Atlantic seafood",
        no: "08:00 ~~ Morgen: Ras El Ma-fossen \xB7 utsiktspunkt \xB7 souvenirhandel i de bl\xE5 smugene || 11:00 ~~ Privat transfer til Tanger (115 km, ~2t) || 14:00 ~~ Innsjekk 4\u2605 hotell || Ettermiddag ~~ Valgfritt: Cap Spartel (Atlanterhavet m\xF8ter Middelhavet) \xB7 Herkulesgrottene (~15 MAD) \xB7 Tanger medina || 20:00 ~~ Siste middag: ferskeste atlanterhavssj\xF8mat",
        fr: "08h00 ~~ Matin : cascade Ras El Ma \xB7 belv\xE9d\xE8re \xB7 achats de souvenirs dans les ruelles bleues || 11h00 ~~ Transfert priv\xE9 vers Tanger (115 km, ~2h) || 14h00 ~~ Enregistrement h\xF4tel 4\u2605 || Apr\xE8s-midi ~~ Optionnel : Cap Spartel (l'Atlantique rencontre la M\xE9diterran\xE9e) \xB7 Grottes d'Hercule (~15 MAD) \xB7 m\xE9dina de Tanger || 20h00 ~~ Dernier d\xEEner : fruits de mer atlantiques les plus frais"
      } },
      { day: 14, route: { en: "Departure from Tangier", no: "Avreise fra Tanger", fr: "D\xE9part de Tanger" }, text: {
        en: "08:00 ~~ Final breakfast overlooking the Strait of Gibraltar || Morning ~~ Last walk on the seafront \xB7 final mint tea || Flight \u22122.5h ~~ Private transfer to Tangier Ibn Batouta Airport",
        no: "08:00 ~~ Siste frokost med utsikt over Gibraltarstredet || Morgen ~~ Siste tur p\xE5 strandpromenaden \xB7 siste myntete || Fly \u22122,5t ~~ Privat transfer til Tanger Ibn Batouta lufthavn",
        fr: "08h00 ~~ Dernier petit-d\xE9jeuner surplombant le d\xE9troit de Gibraltar || Matin ~~ Derni\xE8re promenade sur le front de mer \xB7 dernier th\xE9 \xE0 la menthe || Vol \u22122,5h ~~ Transfert priv\xE9 vers l'a\xE9roport Tanger Ibn Batouta"
      } }
    ],
    included: [
      { en: "Agadir airport pickup \u2192 Tangier airport drop-off (open-jaw routing)", no: "Agadir lufthavn henting \u2192 Tanger lufthavn avsetting (\xE5pen-kjeve ruting)", fr: "Prise en charge a\xE9roport Agadir \u2192 d\xE9p\xF4t a\xE9roport Tanger (routing open-jaw)" },
      { en: "Private transport throughout", no: "Privat transport gjennom hele reisen", fr: "Transport priv\xE9 tout au long du voyage" },
      { en: "3 nights 4-star beachfront hotel Agadir \xB7 3 nights luxury riad Marrakech \xB7 1 night authentic guesthouse Dades Valley (dinner included) \xB7 2 nights luxury Merzouga desert camp (dinners included) \xB7 2 nights riad Fes Medina \xB7 1 night boutique hotel Chefchaouen \xB7 1 night 4-star hotel Tangier", no: "3 netter 4-stjerners strandhotell Agadir \xB7 3 netter luksusriad Marrakech \xB7 1 natt autentisk gjestehus Dades-dalen (middag inkludert) \xB7 2 netter luksus Merzouga-\xF8rkenleir (middager inkludert) \xB7 2 netter riad Fes Medina \xB7 1 natt boutique-hotell Chefchaouen \xB7 1 natt 4-stjerners hotell Tanger", fr: "3 nuits h\xF4tel 4 \xE9toiles en bord de mer Agadir \xB7 3 nuits riad de luxe Marrakech \xB7 1 nuit maison d'h\xF4tes authentique Vall\xE9e du Dad\xE8s (d\xEEner inclus) \xB7 2 nuits camp d\xE9sertique de luxe Merzouga (d\xEEners inclus) \xB7 2 nuits riad M\xE9dina de F\xE8s \xB7 1 nuit h\xF4tel boutique Chefchaouen \xB7 1 nuit h\xF4tel 4 \xE9toiles Tanger" },
      { en: "Daily breakfast", no: "Daglig frokost", fr: "Petit-d\xE9jeuner quotidien" },
      { en: "Honeymoon welcome surprise at Marrakech riad", no: "Bryllupsreise velkomstoveraskelse i Marrakech riad", fr: "Surprise de bienvenue lune de miel au riad de Marrakech" },
      { en: "Argan women's cooperative stop (Agadir \u2192 Marrakech drive)", no: "Argan-kvinnekooperativstopp (Agadir \u2192 Marrakech kj\xF8ring)", fr: "Arr\xEAt coop\xE9rative f\xE9minine d'argan (trajet Agadir \u2192 Marrakech)" },
      { en: "Certified guide \u2014 Marrakech Medina (3h) \xB7 Moroccan cooking class at traditional riad (incl. lunch)", no: "Sertifisert guide \u2014 Marrakech Medina (3t) \xB7 Marokkansk matkurs p\xE5 tradisjonelt riad (inkl. lunsj)", fr: "Guide certifi\xE9 \u2014 M\xE9dina de Marrakech (3h) \xB7 Cours de cuisine marocaine dans un riad traditionnel (d\xE9j. inclus)" },
      { en: "Couples luxury hammam \u2014 private suite (2.5h)", no: "Luksuri\xF8st parhammam \u2014 privat suite (2,5t)", fr: "Hammam de luxe en couple \u2014 suite priv\xE9e (2h30)" },
      { en: "Certified guide \u2014 Fes Medina full-day specialist \xB7 A\xEFt Ben Haddou guided visit \xB7 Chefchaouen half-day guide", no: "Sertifisert guide \u2014 Fes Medina heldags spesialist \xB7 A\xEFt Ben Haddou guidet bes\xF8k \xB7 Chefchaouen halvdags guide", fr: "Guide certifi\xE9 \u2014 sp\xE9cialiste M\xE9dina de F\xE8s journ\xE9e compl\xE8te \xB7 visite guid\xE9e A\xEFt Ben Haddou \xB7 guide demi-journ\xE9e Chefchaouen" },
      { en: "Camel trek into Erg Chebbi at sunset \u2014 1 hour \xB7 live Berber music at camp", no: "Kamelritt inn i Erg Chebbi ved solnedgang \u2014 1 time \xB7 levende berbermusikk i leiren", fr: "Randonn\xE9e \xE0 dos de chameau vers l'Erg Chebbi au coucher du soleil \u2014 1 heure \xB7 musique berb\xE8re en direct au camp" },
      { en: "24/7 WhatsApp support \u2014 Aladdin & Marte", no: "24/7 WhatsApp-st\xF8tte \u2014 Aladdin & Marte", fr: "Assistance WhatsApp 24h/24 \u2014 Aladdin & Marte" }
    ],
    excluded: [
      { en: "International flights (open-jaw: AGA arrival \xB7 TNG departure)", no: "Internasjonale flyreiser (\xE5pen kjeve: AGA ankomst \xB7 TNG avreise)", fr: "Vols internationaux (open-jaw : arriv\xE9e AGA \xB7 d\xE9part TNG)" },
      { en: "Optional beach activities in Agadir", no: "Valgfrie strandaktiviteter i Agadir", fr: "Activit\xE9s de plage optionnelles \xE0 Agadir" },
      { en: "Dinners not listed in itinerary", no: "Middager som ikke er oppgitt i reiseplanen", fr: "D\xEEners non mentionn\xE9s dans l'itin\xE9raire" },
      { en: "Lunches throughout", no: "Lunsjer gjennom hele reisen", fr: "D\xE9jeuners tout au long du voyage" },
      { en: "A\xEFt Ben Haddou guide fee (~100 MAD/p)", no: "A\xEFt Ben Haddou guide honorar (~100 MAD/p)", fr: "Honoraire du guide d'A\xEFt Ben Haddou (~100 MAD/p)" },
      { en: "Bou Inania Madrasa Fes (~70 MAD/p)", no: "Bou Inania Madrasa Fes (~70 MAD/p)", fr: "M\xE9dersa Bou Inania F\xE8s (~70 MAD/p)" },
      { en: "Travel insurance (strongly recommended)", no: "Reiseforsikring (sterkt anbefalt)", fr: "Assurance voyage (fortement recommand\xE9e)" },
      { en: "Personal expenses and tips", no: "Personlige utgifter og tips", fr: "D\xE9penses personnelles et pourboires" }
    ]
  },
  // ===== 4D3N — Romance Package =====
  {
    __special: true,
    slug: "romance-4d3n",
    chapter: "07",
    title: { en: "Romance Package", no: "Romance-pakke", fr: "Forfait Romance" },
    duration: "4D3N",
    days: 4,
    nights: 3,
    route: "Marrakech \u2192 Agafay \u2192 Marrakech",
    priceFromEUR: 650,
    img: "assets/photos/agafay-dinner-table-03.jpg",
    badge: { en: "COUPLES ONLY", no: "KUN FOR PAR", fr: "POUR COUPLES" },
    themeTags: ["Romance", "Riad", "Agafay", "Hammam"],
    teaser: { en: "A riad in the medina, a hammam for two, and a night under the stars in the Agafay \u2014 built entirely for couples.", no: "Et riad i medina, hammam for to og en natt under stjernene i Agafay \u2014 laget helt for par.", fr: "Un riad dans la m\xE9dina, un hammam pour deux et une nuit sous les \xE9toiles \xE0 l'Agafay \u2014 pens\xE9 enti\xE8rement pour les couples." },
    overview: { en: "Morocco has always been a backdrop for romance, and this package is designed around that. Two nights in a hand-picked riad with a private rooftop terrace, a couples hammam, a candlelit dinner in a riad courtyard, and one night at an Agafay luxury camp \u2014 where the Atlas glows at sunset and the stars fill every corner of the sky.", no: "Marokko har alltid v\xE6rt en kulisse for romantikk, og denne pakken er bygget rundt det. To netter i et h\xE5nplukkert riad med privat takterrasse, hammam for to, et stearinlysmiddag i en riad-g\xE5rdhage og \xE9n natt i en luksusleirplass i Agafay \u2014 der Atlas glir i solnedgangen og stjernene fyller hele himmelen.", fr: "Le Maroc a toujours \xE9t\xE9 un d\xE9cor pour la romance, et ce forfait est con\xE7u autour de \xE7a. Deux nuits dans un riad soigneusement choisi avec terrasse priv\xE9e sur le toit, hammam pour deux, d\xEEner aux bougies dans un patio de riad, et une nuit dans un camp de luxe \xE0 l'Agafay \u2014 o\xF9 l'Atlas rougeoie au coucher du soleil et les \xE9toiles remplissent tout le ciel." },
    idealFor: { en: "Couples, honeymoons & anniversaries", no: "Par, bryllupsreiser og jubileer", fr: "Couples, lunes de miel & anniversaires" },
    highlights: [
      { en: "Private rooftop riad with sunset views", no: "Privat takterrasse i riad med solnedgangsutsikt", fr: "Riad avec terrasse priv\xE9e et vue coucher de soleil" },
      { en: "Couples hammam & argan oil massage", no: "Hammam for to & arganoljemasasje", fr: "Hammam pour deux & massage \xE0 l'huile d'argan" },
      { en: "Candlelit dinner in a riad courtyard", no: "Stearinlysmiddag i riad-g\xE5rdhage", fr: "D\xEEner aux bougies dans un patio de riad" },
      { en: "Private Agafay luxury camp night", no: "Privat luksusleirplass-natt i Agafay", fr: "Nuit priv\xE9e au camp de luxe de l'Agafay" },
      { en: "Rose petals & welcome Champagne on arrival", no: "Roseblader og velkomst-Champagne ved ankomst", fr: "P\xE9tales de rose & Champagne de bienvenue \xE0 l'arriv\xE9e" },
      { en: "Sunset camel ride for two", no: "Kamelritt i solnedgang for to", fr: "Balade \xE0 dos de chameau au coucher du soleil pour deux" }
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival \u2014 a riad just for you", no: "Ankomst \u2014 et riad bare for dere", fr: "Arriv\xE9e \u2014 un riad rien que pour vous" }, text: { en: "Private airport pickup in a comfortable car. Transfer to your boutique riad in the heart of the medina. Rose petals, Moroccan pastries and welcome Champagne in the room. Rooftop sunset with the Koutoubia in the distance. Intimate dinner by candlelight at a partner riad \u2014 we reserve the best table.", no: "Privat henting p\xE5 flyplassen i en komfortabel bil. Transfer til ditt boutique-riad i hjertet av medina. Roseblader, marokkansk bakverk og velkomst-Champagne p\xE5 rommet. Solnedgang fra taket med Koutoubia i det fjerne. Intim middag i stearinlys p\xE5 et partner-riad \u2014 vi reserverer det beste bordet.", fr: "Prise en charge priv\xE9e \xE0 l'a\xE9roport dans une voiture confortable. Transfert vers votre riad de charme au c\u0153ur de la m\xE9dina. P\xE9tales de rose, p\xE2tisseries marocaines et Champagne de bienvenue dans la chambre. Coucher de soleil en terrasse avec la Koutoubia au loin. D\xEEner intime aux bougies dans un riad partenaire \u2014 nous r\xE9servons la meilleure table." } },
      { day: 2, route: { en: "Medina, hammam & a slow evening", no: "Medina, hammam og en rolig kveld", fr: "M\xE9dina, hammam & une soir\xE9e douce" }, text: { en: "Breakfast in the courtyard, just the two of you. Guided 2-hour medina walk \u2014 Bahia Palace, the spice souk, hidden squares. Lunch at Le Jardin. Free afternoon for shopping or rest. Couples hammam & argan oil massage at 16:00 (90 minutes, private suite). Sundowner on your rooftop terrace. Light dinner in the medina \u2014 we handle the reservation.", no: "Frokost i g\xE5rdhagen, bare dere to. Guidet 2-timers medinavandring \u2014 Bahia-palasset, krydder\xADsouken, skjulte torg. Lunsj p\xE5 Le Jardin. Fri ettermiddag for shopping eller hvile. Hammam for to & arganoljemasasje kl. 16:00 (90 minutter, privat suite). Sundowner p\xE5 takterrassen. Lett middag i medina \u2014 vi tar reservasjonen.", fr: "Petit-d\xE9jeuner dans le patio, juste vous deux. Balade guid\xE9e de 2 h dans la m\xE9dina \u2014 Palais Bahia, souk aux \xE9pices, places cach\xE9es. D\xE9jeuner au Jardin. Apr\xE8s-midi libre pour le shopping ou le repos. Hammam pour deux & massage \xE0 l'huile d'argan \xE0 16h (90 minutes, suite priv\xE9e). Sundowner sur votre terrasse. D\xEEner l\xE9ger dans la m\xE9dina \u2014 nous g\xE9rons la r\xE9servation." } },
      { day: 3, route: { en: "Into the Agafay \u2014 desert for two", no: "Ut til Agafay \u2014 \xF8rken for to", fr: "Cap sur l'Agafay \u2014 le d\xE9sert pour deux" }, text: { en: "Slow breakfast. Your driver collects you after noon. Private transfer to the Agafay stone desert (~40 min). Check-in at a luxury tented camp \u2014 your private en-suite tent overlooks the Atlas. Camel ride at sunset, side by side. Ap\xE9ritif under the open sky. Private dinner by lantern light with a Moroccan set menu.", no: "Rolig frokost. Sj\xE5f\xF8ren henter dere etter middag. Privat transfer til Agafay-stein\xF8rkenen (~40 min). Innsjekk i luksusleirplassen \u2014 ditt private telt med eget bad har utsikt over Atlas. Kamelritt i solnedgang, side ved side. Aperitiff under \xE5pen himmel. Privat middag i lyktelys med fast marokkansk meny.", fr: "Petit-d\xE9jeuner tranquille. Votre chauffeur vous r\xE9cup\xE8re apr\xE8s midi. Transfert priv\xE9 vers le d\xE9sert de pierres de l'Agafay (~40 min). Enregistrement dans un camp de luxe sous tentes \u2014 votre tente priv\xE9e en suite surplombe l'Atlas. Balade \xE0 dos de chameau au coucher du soleil, c\xF4te \xE0 c\xF4te. Ap\xE9ritif sous le ciel ouvert. D\xEEner priv\xE9 \xE0 la lumi\xE8re des lanternes avec un menu marocain fixe." } },
      { day: 4, route: { en: "Sunrise & departure", no: "Soloppgang og avreise", fr: "Lever de soleil & d\xE9part" }, text: { en: "Wake to Atlas colours. Coffee and pastries brought to your tent. Slow camp breakfast. Return to Marrakech. Optional Majorelle visit before the airport. Private transfer to RAK.", no: "Vekk til Atlasfargene. Kaffe og bakverk brakt til teltet. Rolig frokost i leiren. Tilbake til Marrakech. Valgfritt Majorelle-bes\xF8k f\xF8r flyplassen. Privat transfer til RAK.", fr: "R\xE9veil aux couleurs de l'Atlas. Caf\xE9 et p\xE2tisseries apport\xE9s \xE0 la tente. Petit-d\xE9jeuner tranquille au camp. Retour \xE0 Marrakech. Visite optionnelle du Majorelle avant l'a\xE9roport. Transfert priv\xE9 vers RAK." } }
    ],
    included: [
      { en: "All private transfers in a comfortable air-conditioned vehicle", no: "Alle private transferer i komfortabel klimaanlegg bil", fr: "Tous les transferts priv\xE9s en v\xE9hicule climatis\xE9 confortable" },
      { en: "Two nights in a romantic boutique riad (couple's room with private rooftop), with breakfast", no: "To netter i et romantisk boutique-riad (dobbeltrom med privat takterrasse), med frokost", fr: "Deux nuits dans un riad de charme romantique (chambre couple avec terrasse priv\xE9e), avec petit-d\xE9jeuner" },
      { en: "One night at a luxury Agafay camp (private en-suite tent), with breakfast", no: "\xC9n natt i luksusleirplass i Agafay (privat telt med bad), med frokost", fr: "Une nuit dans un camp de luxe \xE0 l'Agafay (tente priv\xE9e en suite), avec petit-d\xE9jeuner" },
      { en: "Welcome rose petals, Moroccan pastries and a bottle of Champagne in the room", no: "Velkomst med roseblader, marokkansk bakverk og en flaske Champagne p\xE5 rommet", fr: "P\xE9tales de rose de bienvenue, p\xE2tisseries marocaines et une bouteille de Champagne dans la chambre" },
      { en: "Guided 2-hour medina walk for two (private guide)", no: "Guidet 2-timers medinavandring for to (privat guide)", fr: "Balade guid\xE9e de 2 h dans la m\xE9dina pour deux (guide priv\xE9)" },
      { en: "90-minute couples hammam & argan oil massage (private spa suite)", no: "90 minutters hammam for to & arganoljemasasje (privat spasuite)", fr: "Hammam pour deux de 90 min & massage \xE0 l'huile d'argan (suite spa priv\xE9e)" },
      { en: "Dinner on Day 01 at a partner riad (candlelit, reserved table)", no: "Middag dag 01 p\xE5 et partner-riad (stearinlys, reservert bord)", fr: "D\xEEner le Jour 01 dans un riad partenaire (aux bougies, table r\xE9serv\xE9e)" },
      { en: "Sunset camel ride for two in the Agafay", no: "Kamelritt i solnedgang for to i Agafay", fr: "Balade \xE0 dos de chameau au coucher du soleil pour deux \xE0 l'Agafay" },
      { en: "Private dinner at the Agafay camp (set Moroccan menu, three courses)", no: "Privat middag p\xE5 Agafay-leiren (fast marokkansk meny, tre retter)", fr: "D\xEEner priv\xE9 au camp de l'Agafay (menu marocain fixe, trois plats)" },
      { en: "24/7 WhatsApp support from the Marrakechstory team", no: "24/7 WhatsApp-st\xF8tte fra Marrakechstory-teamet", fr: "Assistance WhatsApp 24h/24 de l'\xE9quipe Marrakechstory" }
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches (we give recommendations; you choose)", no: "Lunsjer (vi gir anbefalinger; dere velger)", fr: "D\xE9jeuners (nous donnons des recommandations ; vous choisissez)" },
      { en: "Dinner on Day 02 (we book a special table; you settle the bill)", no: "Middag dag 02 (vi bestiller et spesialbord; dere betaler)", fr: "D\xEEner le Jour 02 (nous r\xE9servons une table sp\xE9ciale ; vous r\xE9glez)" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" }
    ]
  },
  // ===== 5D4N — Romance Package =====
  {
    __special: true,
    slug: "romance-5d4n",
    chapter: "08",
    title: { en: "Romance Package", no: "Romance-pakke", fr: "Forfait Romance" },
    duration: "5D4N",
    days: 5,
    nights: 4,
    route: "Marrakech \u2192 Agafay \u2192 Essaouira \u2192 Marrakech",
    priceFromEUR: 780,
    img: "assets/photos/medina-rooftop-cafe-14.jpg",
    badge: { en: "HONEYMOON PICK", no: "BRYLLUPSVALG", fr: "CHOIX LUNE DE MIEL" },
    themeTags: ["Romance", "Riad", "Agafay", "Essaouira", "Coast"],
    teaser: { en: "The medina, a night in the stone desert, and the wild Atlantic coast \u2014 five days of pure romance.", no: "Medina, en natt i stein\xF8rkenen og den ville Atlanterhavskysten \u2014 fem dager med ren romantikk.", fr: "La m\xE9dina, une nuit dans le d\xE9sert de pierres et la c\xF4te atlantique sauvage \u2014 cinq jours de pure romance." },
    overview: { en: "Everything in the 4-night romance package, plus a day and night in Essaouira \u2014 the breezy blue-and-white port city on the Atlantic. Wander the ramparts above the ocean, eat grilled fish at the harbour, and return to Marrakech for a final evening in the riad. Five nights, three completely different settings.", no: "Alt fra 4-natters romance-pakken, pluss en dag og natt i Essaouira \u2014 den friske bl\xE5-og-hvite havnebyen ved Atlanterhavet. Vandre murene over havet, spis grillet fisk i havnen og kom tilbake til Marrakech for en siste kveld i riaden. Fem netter, tre helt forskjellige omgivelser.", fr: "Tout du forfait romance 4 nuits, plus un jour et une nuit \xE0 Essaouira \u2014 la ville portuaire bleue et blanche vent\xE9e sur l'Atlantique. Fl\xE2nez sur les remparts au-dessus de l'oc\xE9an, mangez du poisson grill\xE9 au port, et rentrez \xE0 Marrakech pour une derni\xE8re soir\xE9e au riad. Cinq nuits, trois d\xE9cors enti\xE8rement diff\xE9rents." },
    idealFor: { en: "Honeymoons, anniversaries & long-weekend romantics", no: "Bryllupsreiser, jubileer og romantiske langhelger", fr: "Lunes de miel, anniversaires & escapades romantiques" },
    highlights: [
      { en: "Private rooftop riad in the medina", no: "Privat takterrasse-riad i medina", fr: "Riad avec terrasse priv\xE9e dans la m\xE9dina" },
      { en: "Couples hammam & argan oil massage", no: "Hammam for to & arganoljemasasje", fr: "Hammam pour deux & massage \xE0 l'huile d'argan" },
      { en: "Agafay luxury camp night under the stars", no: "Luksusleirplass-natt under stjernene i Agafay", fr: "Nuit au camp de luxe sous les \xE9toiles \xE0 l'Agafay" },
      { en: "Essaouira Atlantic ramparts & harbour", no: "Essaouiras atlantiske murer og havn", fr: "Remparts atlantiques & port d'Essaouira" },
      { en: "Fresh seafood lunch by the ocean", no: "Fersk sj\xF8matlunsj ved havet", fr: "D\xE9jeuner de fruits de mer frais au bord de l'oc\xE9an" },
      { en: "Rose petals & Champagne welcome", no: "Roseblader og Champagne-velkomst", fr: "P\xE9tales de rose & accueil Champagne" }
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival \u2014 a riad just for you", no: "Ankomst \u2014 et riad bare for dere", fr: "Arriv\xE9e \u2014 un riad rien que pour vous" }, text: { en: "Private airport pickup. Transfer to your boutique riad in the medina. Rose petals, pastries and welcome Champagne. Rooftop sunset. Candlelit dinner at a partner riad \u2014 best table reserved.", no: "Privat henting p\xE5 flyplassen. Transfer til boutique-riaden din i medina. Roseblader, bakverk og velkomst-Champagne. Solnedgang fra taket. Stearinlysmiddag p\xE5 partner-riad \u2014 beste bord reservert.", fr: "Prise en charge priv\xE9e \xE0 l'a\xE9roport. Transfert vers votre riad de charme dans la m\xE9dina. P\xE9tales de rose, p\xE2tisseries et Champagne de bienvenue. Coucher de soleil en terrasse. D\xEEner aux bougies dans un riad partenaire \u2014 meilleure table r\xE9serv\xE9e." } },
      { day: 2, route: { en: "Medina & hammam", no: "Medina og hammam", fr: "M\xE9dina & hammam" }, text: { en: "Breakfast in the courtyard. Guided 2-hour medina walk for two. Lunch at Le Jardin. Free afternoon. Couples hammam & argan oil massage at 16:00 (90 min, private suite). Sundowner on your rooftop. Dinner in the medina.", no: "Frokost i g\xE5rdhagen. Guidet 2-timers medinavandring for to. Lunsj p\xE5 Le Jardin. Fri ettermiddag. Hammam for to & arganoljemasasje kl. 16:00 (90 min, privat suite). Sundowner p\xE5 taket. Middag i medina.", fr: "Petit-d\xE9jeuner dans le patio. Balade guid\xE9e de 2 h dans la m\xE9dina pour deux. D\xE9jeuner au Jardin. Apr\xE8s-midi libre. Hammam pour deux & massage argan \xE0 16h (90 min, suite priv\xE9e). Sundowner sur le toit. D\xEEner dans la m\xE9dina." } },
      { day: 3, route: { en: "Agafay \u2014 desert for two", no: "Agafay \u2014 \xF8rken for to", fr: "Agafay \u2014 le d\xE9sert pour deux" }, text: { en: "Late checkout. Transfer to the Agafay stone desert (~40 min). Check-in at the luxury tented camp. Camel ride at sunset. Private dinner by lantern light. Stargazing by the fire.", no: "Sen utsjekk. Transfer til Agafay-stein\xF8rkenen (~40 min). Innsjekk i luksusleirplassen. Kamelritt i solnedgang. Privat middag i lyktelys. Stjernekikking ved b\xE5let.", fr: "Check-out tardif. Transfert vers le d\xE9sert de pierres de l'Agafay (~40 min). Enregistrement au camp de luxe. Balade \xE0 dos de chameau au coucher du soleil. D\xEEner priv\xE9 \xE0 la lumi\xE8re des lanternes. Observation des \xE9toiles au coin du feu." } },
      { day: 4, route: { en: "Agafay \u2192 Essaouira", no: "Agafay \u2192 Essaouira", fr: "Agafay \u2192 Essaouira" }, text: { en: "Sunrise at the camp. Breakfast with Atlas views. Drive to Essaouira (~2.5 hours). Check-in at a boutique hotel inside the ramparts. Walk the medina together. Lunch at the harbour \u2014 fresh fish at the best stall. Free afternoon \u2014 beach walk, art galleries. Dinner in the medina, candlelit.", no: "Soloppgang i leiren. Frokost med Atlasutsikt. Kj\xF8ring til Essaouira (~2,5 timer). Innsjekk p\xE5 boutique-hotell innenfor murene. G\xE5 medina sammen. Lunsj i havnen \u2014 fersk fisk p\xE5 det beste stedet. Fri ettermiddag \u2014 strandstur, kunstgallerier. Middag i medina, i stearinlys.", fr: "Lever de soleil au camp. Petit-d\xE9jeuner avec vue sur l'Atlas. Route vers Essaouira (~2h30). Enregistrement dans un h\xF4tel de charme dans les remparts. Balade dans la m\xE9dina ensemble. D\xE9jeuner au port \u2014 poisson frais au meilleur \xE9tal. Apr\xE8s-midi libre \u2014 promenade sur la plage, galeries d'art. D\xEEner dans la m\xE9dina aux bougies." } },
      { day: 5, route: { en: "Essaouira \u2192 Marrakech & home", no: "Essaouira \u2192 Marrakech og hjem", fr: "Essaouira \u2192 Marrakech & retour" }, text: { en: "Morning walk along the Atlantic ramparts. Breakfast with ocean views. Return drive to Marrakech (~2.5 hours). Private transfer to RAK.", no: "Morgentur langs Atlanterhavsmurene. Frokost med havutsikt. Tilbakekj\xF8ring til Marrakech (~2,5 timer). Privat transfer til RAK.", fr: "Promenade matinale sur les remparts atlantiques. Petit-d\xE9jeuner avec vue sur l'oc\xE9an. Retour en voiture vers Marrakech (~2h30). Transfert priv\xE9 vers RAK." } }
    ],
    included: [
      { en: "All private transfers throughout (airport, riad, Agafay, Essaouira, RAK)", no: "Alle private transferer (flyplass, riad, Agafay, Essaouira, RAK)", fr: "Tous les transferts priv\xE9s (a\xE9roport, riad, Agafay, Essaouira, RAK)" },
      { en: "Two nights in a romantic riad in the Marrakech medina (private rooftop), with breakfast", no: "To netter i et romantisk riad i Marrakech-medina (privat takterrasse), med frokost", fr: "Deux nuits dans un riad romantique dans la m\xE9dina de Marrakech (terrasse priv\xE9e), avec petit-d\xE9jeuner" },
      { en: "One night at a luxury Agafay tented camp (private en-suite tent), with breakfast", no: "\xC9n natt i luksusleirplass i Agafay (privat telt med bad), med frokost", fr: "Une nuit dans un camp de luxe \xE0 l'Agafay (tente priv\xE9e en suite), avec petit-d\xE9jeuner" },
      { en: "One night in a boutique hotel in Essaouira, with breakfast", no: "\xC9n natt i boutique-hotell i Essaouira, med frokost", fr: "Une nuit dans un h\xF4tel de charme \xE0 Essaouira, avec petit-d\xE9jeuner" },
      { en: "Welcome rose petals, pastries and a bottle of Champagne on arrival", no: "Velkomst med roseblader, bakverk og en flaske Champagne ved ankomst", fr: "P\xE9tales de rose, p\xE2tisseries et une bouteille de Champagne \xE0 l'arriv\xE9e" },
      { en: "90-minute couples hammam & argan oil massage (private spa suite)", no: "90 minutters hammam for to & arganoljemasasje (privat spasuite)", fr: "Hammam pour deux de 90 min & massage \xE0 l'huile d'argan (suite priv\xE9e)" },
      { en: "Guided 2-hour medina walk for two (private guide)", no: "Guidet 2-timers medinavandring for to (privat guide)", fr: "Balade guid\xE9e de 2 h dans la m\xE9dina pour deux (guide priv\xE9)" },
      { en: "Sunset camel ride for two in the Agafay + private camp dinner", no: "Kamelritt i solnedgang for to i Agafay + privat leirsmiddag", fr: "Balade \xE0 dos de chameau pour deux \xE0 l'Agafay + d\xEEner priv\xE9 au camp" },
      { en: "Candlelit dinner at a Marrakech partner riad (Day 01)", no: "Stearinlysmiddag p\xE5 Marrakech partner-riad (dag 01)", fr: "D\xEEner aux bougies dans un riad partenaire de Marrakech (Jour 01)" },
      { en: "24/7 WhatsApp support", no: "24/7 WhatsApp-st\xF8tte", fr: "Assistance WhatsApp 24h/24" }
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches (recommendations provided)", no: "Lunsjer (anbefalinger gis)", fr: "D\xE9jeuners (recommandations fournies)" },
      { en: "Dinners on Day 02, 04 and 05 (we book; you pay)", no: "Middager dag 02, 04 og 05 (vi bestiller; dere betaler)", fr: "D\xEEners les Jours 02, 04 et 05 (nous r\xE9servons ; vous payez)" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" }
    ]
  },
  // ===== 4D3N — Family Package =====
  {
    __special: true,
    slug: "family-4d3n",
    chapter: "09",
    title: { en: "Family Package", no: "Familiepakke", fr: "Forfait Famille" },
    duration: "4D3N",
    days: 4,
    nights: 3,
    route: "Marrakech \u2192 Agafay \u2192 Marrakech",
    priceFromEUR: 500,
    img: "assets/photos/agafay-camel-palmeraie-20.jpg",
    badge: { en: "FAMILY FRIENDLY", no: "FAMILIEVENNLIG", fr: "FAMILLE BIENVENUE" },
    themeTags: ["Family", "Medina", "Agafay", "Kids"],
    teaser: { en: "Marrakech through a child's eyes \u2014 souks, snake charmers, a camel in the desert, and a riad with a splash pool.", no: "Marrakech gjennom et barns \xF8yne \u2014 souker, slangefluktere, kamel i \xF8rkenen og et riad med badebasseng.", fr: "Marrakech \xE0 travers les yeux d'un enfant \u2014 souks, charmeurs de serpents, chameau dans le d\xE9sert et riad avec piscine." },
    overview: { en: "The same heart of Marrakech \u2014 but paced for children and designed to delight them. A family-friendly riad with a splash pool, a guided medina walk shaped around what kids actually love (the snake charmers, the leather tanneries, the candy souks), a family cooking class, and one magical night at an Agafay camp with a camel ride at sunset. Minimum age: 4 years.", no: "Det samme hjertet av Marrakech \u2014 men i et tempo for barn og designet for \xE5 glede dem. Et familievennlig riad med badebasseng, en guidet medinavandring formet rundt det barn faktisk elsker (slangefluktere, l\xE6rgarveriene, godteri-souken), et familiekurs i matlaging, og \xE9n magisk natt i en Agafay-leir med kamelritt i solnedgang. Minimumsalder: 4 \xE5r.", fr: "Le m\xEAme c\u0153ur de Marrakech \u2014 mais au rythme des enfants et con\xE7u pour les \xE9merveiller. Un riad familial avec piscine, une balade guid\xE9e dans la m\xE9dina ax\xE9e sur ce que les enfants adorent vraiment (les charmeurs de serpents, les tanneries, le souk aux bonbons), un cours de cuisine en famille, et une nuit magique dans un camp de l'Agafay avec balade \xE0 dos de chameau au coucher du soleil. \xC2ge minimum : 4 ans." },
    idealFor: { en: "Families with children aged 4\u201314", no: "Familier med barn i alderen 4\u201314 \xE5r", fr: "Familles avec enfants de 4 \xE0 14 ans" },
    highlights: [
      { en: "Family-friendly riad with splash pool", no: "Familievennlig riad med badebasseng", fr: "Riad familial avec piscine" },
      { en: "Kids' medina walk \u2014 snake charmers, tanneries, candy souk", no: "Barnevennlig medinavandring \u2014 slangefluktere, garverier, godteri-souk", fr: "Balade m\xE9dina pour enfants \u2014 charmeurs de serpents, tanneries, souk aux bonbons" },
      { en: "Family Moroccan cooking class", no: "Familiematkurs i marokkansk mat", fr: "Cours de cuisine marocaine en famille" },
      { en: "One night at the Agafay luxury camp", no: "\xC9n natt i luksusleirplassen i Agafay", fr: "Une nuit au camp de luxe de l'Agafay" },
      { en: "Camel ride at sunset", no: "Kamelritt i solnedgang", fr: "Balade \xE0 dos de chameau au coucher du soleil" },
      { en: "Jardin Majorelle (kids love the peacocks!)", no: "Jardin Majorelle (barn elsker p\xE5fuglene!)", fr: "Jardin Majorelle (les enfants adorent les paons !)" }
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival \u2014 welcome to the adventure", no: "Ankomst \u2014 velkommen til eventyret", fr: "Arriv\xE9e \u2014 bienvenue dans l'aventure" }, text: { en: "Private airport pickup in a family-sized vehicle. Transfer to your family riad with a splash pool. Welcome Moroccan pastries and fresh juices for the kids. Rooftop sunset walk. Easy dinner close to the riad \u2014 Jemaa el-Fnaa food stalls or a family-friendly restaurant.", no: "Privat henting p\xE5 flyplassen i et familiekj\xF8ret\xF8y. Transfer til familieriad med badebasseng. Velkomst med marokkansk bakverk og ferske juicer til barna. Solnedgangstur fra taket. Enkel middag n\xE6r riaden \u2014 matstander p\xE5 Jemaa el-Fnaa eller familievennlig restaurant.", fr: "Prise en charge priv\xE9e \xE0 l'a\xE9roport dans un v\xE9hicule familial. Transfert vers votre riad familial avec piscine. P\xE2tisseries marocaines et jus frais de bienvenue pour les enfants. Balade au coucher du soleil en terrasse. D\xEEner facile pr\xE8s du riad \u2014 \xE9tals de Jemaa el-Fnaa ou restaurant familial." } },
      { day: 2, route: { en: "The medina for little explorers", no: "Medina for unge oppdagere", fr: "La m\xE9dina pour les petits explorateurs" }, text: { en: "Breakfast at the riad. Family medina walk (2h) with a guide who knows how to engage children: Jemaa el-Fnaa performers, leather tanneries from above, the candy and spice souk, a henna artist. Lunch at a family-friendly riad restaurant \u2014 wood-fired flatbread and kefta. Family Moroccan cooking class at 16:00 (1.5h) \u2014 kids make pastilla; parents make tajine. Dinner from your own creations.", no: "Frokost i riaden. Familietur i medina (2t) med en guide som vet \xE5 engasjere barn: Jemaa el-Fnaa-artister, l\xE6rgarverier sett ovenfra, godteri- og kryddersouken, en hennakunstner. Lunsj p\xE5 familievennlig riad-restaurant \u2014 vedbrannsbakt flatbr\xF8d og kefta. Familiekurs i marokkansk matlaging kl. 16:00 (1,5t) \u2014 barn lager pastilla; foreldre lager tagine. Middag av egne kreasjoner.", fr: "Petit-d\xE9jeuner au riad. Balade m\xE9dina en famille (2h) avec un guide qui sait captiver les enfants : artistes de Jemaa el-Fnaa, tanneries vues d'en haut, souk aux bonbons et aux \xE9pices, henn\xE9. D\xE9jeuner dans un restaurant de riad familial \u2014 pain plat au feu de bois et kefta. Cours de cuisine marocaine en famille \xE0 16h (1h30) \u2014 les enfants font la pastilla ; les parents font le tajine. D\xEEner de vos propres cr\xE9ations." } },
      { day: 3, route: { en: "Majorelle & the Agafay camp", no: "Majorelle og Agafay-leiren", fr: "Majorelle & le camp de l'Agafay" }, text: { en: "Morning visit to Jardin Majorelle (the kids will love the peacocks and the electric-blue walls). Light lunch garden-side. Private transfer to the Agafay stone desert (~40 min). Family check-in at the luxury camp. Camel ride at sunset \u2014 one per person or shared. Campfire storytelling and star-spotting after dinner.", no: "Morgenbes\xF8k til Jardin Majorelle (barna vil elske p\xE5fuglene og de elektrisk bl\xE5 veggene). Lett lunsj i hagen. Privat transfer til Agafay-stein\xF8rkenen (~40 min). Familieinnsjekk i luksusleirplassen. Kamelritt i solnedgang \u2014 \xE9n per person eller felles. Historiefortelling rundt b\xE5let og stjernekikking etter middag.", fr: "Visite matinale du Jardin Majorelle (les enfants adoreront les paons et les murs bleu \xE9lectrique). D\xE9jeuner l\xE9ger c\xF4t\xE9 jardin. Transfert priv\xE9 vers le d\xE9sert de pierres de l'Agafay (~40 min). Enregistrement en famille au camp de luxe. Balade \xE0 dos de chameau au coucher du soleil \u2014 un par personne ou partag\xE9. Contes au coin du feu et observation des \xE9toiles apr\xE8s d\xEEner." } },
      { day: 4, route: { en: "Camp morning & departure", no: "Leirmorgen og avreise", fr: "Matin au camp & d\xE9part" }, text: { en: "Wake the kids to the Atlas silhouette. Camp breakfast. Return to Marrakech (~40 min). Final souk for souvenirs \u2014 we guide you to the best children's toy stalls. Private transfer to RAK.", no: "Vekk barna til Atlasskyggen. Frokost i leiren. Tilbake til Marrakech (~40 min). Siste soukrunde for suvenirer \u2014 vi guider dere til de beste leke- og suvenirstandene for barn. Privat transfer til RAK.", fr: "R\xE9veillez les enfants face \xE0 la silhouette de l'Atlas. Petit-d\xE9jeuner au camp. Retour \xE0 Marrakech (~40 min). Dernier souk pour les souvenirs \u2014 nous vous guidons vers les meilleurs \xE9tals de jouets pour enfants. Transfert priv\xE9 vers RAK." } }
    ],
    included: [
      { en: "All private transfers in a family-sized vehicle with English-speaking driver", no: "Alle private transferer i familiekj\xF8ret\xF8y med engelsktalende sj\xE5f\xF8r", fr: "Tous les transferts priv\xE9s en v\xE9hicule familial avec chauffeur anglophone" },
      { en: "Two nights in a family-friendly boutique riad (splash pool, family rooms), with breakfast", no: "To netter i familievennlig boutique-riad (badebasseng, familierom), med frokost", fr: "Deux nuits dans un riad de charme familial (piscine, chambres famille), avec petit-d\xE9jeuner" },
      { en: "One night at a luxury Agafay camp (family tent or adjoining tents), with breakfast", no: "\xC9n natt i luksusleirplass i Agafay (familietelt eller tilst\xF8tende telt), med frokost", fr: "Une nuit dans un camp de luxe \xE0 l'Agafay (tente famille ou tentes adjacentes), avec petit-d\xE9jeuner" },
      { en: "2-hour children-focused medina walking tour with a specialist family guide", no: "2-timers barnevennlig medinavandring med spesialist-familieguide", fr: "Balade guid\xE9e de 2 h dans la m\xE9dina ax\xE9e enfants avec un guide sp\xE9cialis\xE9 famille" },
      { en: "1.5-hour family Moroccan cooking class (kids + adults together)", no: "1,5-timers familiekurs i marokkansk matlaging (barn + voksne)", fr: "Cours de cuisine marocaine de 1h30 en famille (enfants + adultes)" },
      { en: "Camel ride at sunset in the Agafay (one per person)", no: "Kamelritt i solnedgang i Agafay (\xE9n per person)", fr: "Balade \xE0 dos de chameau au coucher du soleil \xE0 l'Agafay (un par personne)" },
      { en: "Camp dinner at the Agafay (set family menu, child portions available)", no: "Leirsmiddag i Agafay (fast familiemeny, barneporsjoner tilgjengelig)", fr: "D\xEEner au camp de l'Agafay (menu famille fixe, portions enfants disponibles)" },
      { en: "Skip-the-line tickets to Jardin Majorelle", no: "Billetter uten k\xF8 til Jardin Majorelle", fr: "Billets coupe-file pour le Jardin Majorelle" },
      { en: "24/7 WhatsApp support from the Marrakechstory team", no: "24/7 WhatsApp-st\xF8tte fra Marrakechstory-teamet", fr: "Assistance WhatsApp 24h/24 de l'\xE9quipe Marrakechstory" }
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches on Day 01, 03 and 04 (recommendations provided)", no: "Lunsjer dag 01, 03 og 04 (anbefalinger gis)", fr: "D\xE9jeuners les Jours 01, 03 et 04 (recommandations fournies)" },
      { en: "Dinners on Day 01 and 02 (we help with suggestions and bookings)", no: "Middager dag 01 og 02 (vi hjelper med forslag og bestillinger)", fr: "D\xEEners les Jours 01 et 02 (nous aidons avec suggestions et r\xE9servations)" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" }
    ]
  },
  // ===== 5D4N — Family Package =====
  {
    __special: true,
    slug: "family-5d4n",
    chapter: "10",
    title: { en: "Family Package", no: "Familiepakke", fr: "Forfait Famille" },
    duration: "5D4N",
    days: 5,
    nights: 4,
    route: "Marrakech \u2192 High Atlas \u2192 Agafay \u2192 Marrakech",
    priceFromEUR: 650,
    img: "assets/photos/atlas-setti-fatma-falls-12.jpg",
    badge: { en: "FAMILY FAVOURITE", no: "FAMILIEFAVORITT", fr: "FAVORI FAMILLE" },
    themeTags: ["Family", "Medina", "High Atlas", "Agafay", "Kids"],
    teaser: { en: "The full family adventure \u2014 medina magic, a Berber village in the mountains, and a night under the stars in the stone desert.", no: "Det fullstendige familieeventyret \u2014 medinmagi, en berberlandsby i fjellene og en natt under stjernene i stein\xF8rkenen.", fr: "La grande aventure familiale \u2014 magie de la m\xE9dina, village berb\xE8re en montagne et nuit sous les \xE9toiles dans le d\xE9sert de pierres." },
    overview: { en: "One day longer than our 4-night family package, and the extra day makes a real difference \u2014 a full Atlas valley day in the mountains, where the kids meet Berber children, ride a mule on a village trail, and share a home-cooked lunch with a local family. Combined with the medina, cooking class, and an Agafay camp night, this is the family trip Morocco does best.", no: "\xC9n dag lenger enn v\xE5r 4-natters familiepakke, og den ekstra dagen utgj\xF8r en ekte forskjell \u2014 en hel dag i Atlas-dalen i fjellene, der barna m\xF8ter berberbarn, rir p\xE5 et muldyr p\xE5 en landsbysti og deler et hjemmelaget m\xE5ltid med en lokal familie. Kombinert med medina, matkurs og en Agafay-leirplass-natt er dette familieturen Marokko er best p\xE5.", fr: "Un jour de plus que notre forfait famille 4 nuits, et ce jour suppl\xE9mentaire fait vraiment la diff\xE9rence \u2014 une journ\xE9e compl\xE8te dans la vall\xE9e de l'Atlas en montagne, o\xF9 les enfants rencontrent des enfants berb\xE8res, font de la randonn\xE9e \xE0 mulet sur un sentier de village et partagent un d\xE9jeuner cuisin\xE9 \xE0 la maison avec une famille locale. Combin\xE9 \xE0 la m\xE9dina, au cours de cuisine et \xE0 une nuit au camp de l'Agafay, c'est le voyage en famille que le Maroc fait le mieux." },
    idealFor: { en: "Families with children aged 4\u201314 wanting more adventure", no: "Familier med barn 4\u201314 \xE5r som vil ha mer eventyr", fr: "Familles avec enfants de 4 \xE0 14 ans en qu\xEAte de plus d'aventure" },
    highlights: [
      { en: "Family riad with splash pool", no: "Familieriad med badebasseng", fr: "Riad familial avec piscine" },
      { en: "Kids' medina walk \u2014 snake charmers & candy souk", no: "Barnevennlig medinavandring \u2014 slangefluktere og godteri-souk", fr: "Balade m\xE9dina enfants \u2014 charmeurs de serpents & souk aux bonbons" },
      { en: "Family cooking class", no: "Familiekurs i matlaging", fr: "Cours de cuisine en famille" },
      { en: "High Atlas Berber village day \u2014 mule ride & family lunch", no: "H\xF8yatlas berberlandsby-dag \u2014 mulesritt og familielunsj", fr: "Journ\xE9e village berb\xE8re Haut Atlas \u2014 mulet & d\xE9jeuner famille" },
      { en: "Agafay camp night & camel ride", no: "Agafay-leirplass-natt og kamelritt", fr: "Nuit au camp Agafay & balade \xE0 dos de chameau" },
      { en: "Jardin Majorelle peacocks & YSL gardens", no: "Jardin Majorelles p\xE5fugler og YSL-hager", fr: "Paons du Jardin Majorelle & jardins YSL" }
    ],
    itinerary: [
      { day: 1, route: { en: "Arrival \u2014 the adventure begins", no: "Ankomst \u2014 eventyret begynner", fr: "Arriv\xE9e \u2014 l'aventure commence" }, text: { en: "Private airport pickup in a family vehicle. Transfer to your family riad with a splash pool. Welcome pastries and fresh juices. Orientation rooftop walk. Easy dinner near the riad \u2014 Jemaa el-Fnaa or family restaurant.", no: "Privat henting p\xE5 flyplassen i et familiekj\xF8ret\xF8y. Transfer til familieriad med badebasseng. Velkomstbakverk og ferske juicer. Orienteringstur fra taket. Enkel middag n\xE6r riaden \u2014 Jemaa el-Fnaa eller familierestaurant.", fr: "Prise en charge priv\xE9e \xE0 l'a\xE9roport en v\xE9hicule familial. Transfert vers votre riad familial avec piscine. P\xE2tisseries et jus de bienvenue. Balade d'orientation en terrasse. D\xEEner facile pr\xE8s du riad \u2014 Jemaa el-Fnaa ou restaurant familial." } },
      { day: 2, route: { en: "Medina for little explorers", no: "Medina for unge oppdagere", fr: "La m\xE9dina pour les petits explorateurs" }, text: { en: "Guided family medina walk (2h): performers, tanneries, candy souk, henna artist. Lunch at a family riad restaurant. Family Moroccan cooking class at 16:00 (1.5h). Dinner from your own kitchen.", no: "Guidet familievandring i medina (2t): artister, garverier, godteri-souk, hennakunstner. Lunsj p\xE5 familieriad-restaurant. Familiekurs i marokkansk matlaging kl. 16:00 (1,5t). Middag fra eget kj\xF8kken.", fr: "Balade guid\xE9e en famille dans la m\xE9dina (2h) : artistes, tanneries, souk aux bonbons, henn\xE9. D\xE9jeuner au restaurant du riad familial. Cours de cuisine marocaine en famille \xE0 16h (1h30). D\xEEner de votre propre cuisine." } },
      { day: 3, route: { en: "High Atlas \u2014 Berber mountain day", no: "H\xF8yatlas \u2014 berberfjelldagen", fr: "Haut Atlas \u2014 journ\xE9e berb\xE8re en montagne" }, text: { en: "Morning drive into the High Atlas (Ourika Valley or Imlil, ~1h). Mule ride on a mountain trail for the kids (30 min). Guided village walk \u2014 meet local Berber children, see a traditional Berber home. Home-cooked family lunch in a Berber house (tagine, flatbread, herbal tea). Return to Marrakech. Majorelle garden visit \u2014 peacocks and the blue gardens.", no: "Morgentur inn i H\xF8yatlas (Ourika-dalen eller Imlil, ~1t). Mulesritt p\xE5 fjellsti for barna (30 min). Guidet landsbyvandring \u2014 m\xF8t lokale berberbarn, se et tradisjonelt berberhjem. Hjemmelaget familielunsj i et berberhus (tagine, flatbr\xF8d, urtete). Tilbake til Marrakech. Bes\xF8k i Majorellehagen \u2014 p\xE5fugler og de bl\xE5 hagene.", fr: "Promenade matinale dans le Haut Atlas (vall\xE9e de l'Ourika ou Imlil, ~1h). Randonn\xE9e \xE0 mulet sur un sentier de montagne pour les enfants (30 min). Balade guid\xE9e dans le village \u2014 rencontrez des enfants berb\xE8res locaux, visitez une maison berb\xE8re traditionnelle. D\xE9jeuner familial cuisin\xE9 \xE0 la maison (tajine, pain plat, th\xE9 aux herbes). Retour \xE0 Marrakech. Visite du jardin Majorelle \u2014 paons et jardins bleus." } },
      { day: 4, route: { en: "Agafay \u2014 desert camp night", no: "Agafay \u2014 \xF8rkenleir-natt", fr: "Agafay \u2014 nuit au camp du d\xE9sert" }, text: { en: "Transfer to the Agafay stone desert (~40 min). Family check-in at the luxury camp. Camel ride at sunset \u2014 one each. Camp dinner with Moroccan music and storytelling under the stars. Kids can spot constellations with the camp guide.", no: "Transfer til Agafay-stein\xF8rkenen (~40 min). Familieinnsjekk i luksusleirplassen. Kamelritt i solnedgang \u2014 \xE9n per person. Leirsmiddag med marokkansk musikk og historiefortelling under stjernene. Barna kan se stjernekart med leirguiden.", fr: "Transfert vers le d\xE9sert de pierres de l'Agafay (~40 min). Enregistrement en famille au camp de luxe. Balade \xE0 dos de chameau au coucher du soleil \u2014 un par personne. D\xEEner au camp avec musique marocaine et contes sous les \xE9toiles. Les enfants peuvent rep\xE9rer les constellations avec le guide du camp." } },
      { day: 5, route: { en: "Sunrise & souvenir run", no: "Soloppgang og suvenirjakt", fr: "Lever de soleil & chasse aux souvenirs" }, text: { en: "Atlas sunrise from the camp. Breakfast. Return to Marrakech (~40 min). Souvenir souk run \u2014 we guide you to the best toy and craft stalls. Private transfer to RAK.", no: "Atlassoloppgang fra leiren. Frokost. Tilbake til Marrakech (~40 min). Souvenirsouken \u2014 vi guider dere til de beste leke- og h\xE5ndverkstandene. Privat transfer til RAK.", fr: "Lever de soleil sur l'Atlas depuis le camp. Petit-d\xE9jeuner. Retour \xE0 Marrakech (~40 min). Tour du souk aux souvenirs \u2014 nous vous guidons vers les meilleurs \xE9tals de jouets et artisanat. Transfert priv\xE9 vers RAK." } }
    ],
    included: [
      { en: "All private transfers in a family-sized vehicle with English-speaking driver", no: "Alle private transferer i familiekj\xF8ret\xF8y med engelsktalende sj\xE5f\xF8r", fr: "Tous les transferts priv\xE9s en v\xE9hicule familial avec chauffeur anglophone" },
      { en: "Three nights in a family-friendly boutique riad (splash pool, family rooms), with breakfast", no: "Tre netter i familievennlig boutique-riad (badebasseng, familierom), med frokost", fr: "Trois nuits dans un riad de charme familial (piscine, chambres famille), avec petit-d\xE9jeuner" },
      { en: "One night at a luxury Agafay camp (family tent or adjoining tents), with breakfast", no: "\xC9n natt i luksusleirplass i Agafay (familietelt eller tilst\xF8tende telt), med frokost", fr: "Une nuit dans un camp de luxe \xE0 l'Agafay (tente famille ou tentes adjacentes), avec petit-d\xE9jeuner" },
      { en: "2-hour children-focused medina walk with a specialist family guide", no: "2-timers barnevennlig medinavandring med spesialistfamilieguide", fr: "Balade de 2 h dans la m\xE9dina ax\xE9e enfants avec un guide sp\xE9cialis\xE9 famille" },
      { en: "1.5-hour family Moroccan cooking class", no: "1,5-timers familiekurs i marokkansk matlaging", fr: "Cours de cuisine marocaine de 1h30 en famille" },
      { en: "Full High Atlas day: guided Berber village walk + mule ride for kids + home-cooked family lunch", no: "Full H\xF8yatlas-dag: guidet berberlandsbyvandring + mulesritt for barn + hjemmelaget familielunsj", fr: "Journ\xE9e compl\xE8te Haut Atlas : balade guid\xE9e dans un village berb\xE8re + mulet pour enfants + d\xE9jeuner familial cuisin\xE9" },
      { en: "Jardin Majorelle skip-the-line tickets", no: "Billetter uten k\xF8 til Jardin Majorelle", fr: "Billets coupe-file pour le Jardin Majorelle" },
      { en: "Camel ride at sunset in the Agafay + camp dinner (family menu, child portions)", no: "Kamelritt i solnedgang i Agafay + leirsmiddag (familiemeny, barneporsjoner)", fr: "Balade \xE0 dos de chameau \xE0 l'Agafay + d\xEEner au camp (menu famille, portions enfants)" },
      { en: "24/7 WhatsApp support from the Marrakechstory team", no: "24/7 WhatsApp-st\xF8tte fra Marrakechstory-teamet", fr: "Assistance WhatsApp 24h/24 de l'\xE9quipe Marrakechstory" }
    ],
    excluded: [
      { en: "International flights", no: "Internasjonale flyreiser", fr: "Vols internationaux" },
      { en: "Lunches on Day 01 and 05 (recommendations provided)", no: "Lunsjer dag 01 og 05 (anbefalinger gis)", fr: "D\xE9jeuners les Jours 01 et 05 (recommandations fournies)" },
      { en: "Dinners on Day 01, 02 and 05 (we help with suggestions)", no: "Middager dag 01, 02 og 05 (vi hjelper med forslag)", fr: "D\xEEners les Jours 01, 02 et 05 (nous aidons avec suggestions)" },
      { en: "Travel insurance", no: "Reiseforsikring", fr: "Assurance voyage" },
      { en: "Tips", no: "Tips", fr: "Pourboires" }
    ]
  }
];
const MS_TRIP_LINKS = [
  { re: /camel|kamel|chameau/i, tab: "activities", name: "Camel Ride in Agafay" },
  { re: /\bquad\b/i, tab: "activities", name: "Quad Ride in Agafay" },
  { re: /\bbuggy\b/i, tab: "activities", name: "Buggy in Agafay" },
  { re: /balloon|ballong|montgolf/i, tab: "activities", name: "Hot Air Balloon" },
  { re: /cooking class|matkurs|cours de cuisine|cooking/i, tab: "activities", name: "Cooking Class in a Riad" },
  { re: /paraglid|parapente/i, tab: "activities", name: "Paragliding over the Atlas" },
  { re: /horse ?rid|horseback|ridning|cheval|équitation/i, tab: "activities", name: "Horseback Riding in Agafay" },
  { re: /hammam|spa\b/i, tab: "spa", name: "Hammam de la rose" },
  { re: /medina (tour|& souk|and souk)|souk|guided medina|medinaomvisning|medina-omvisning|médina/i, tab: "activities", name: "Souks & Jamaa el Fna Guided Tour" },
  { re: /bahia|saadian|koutoubia/i, tab: "activities", name: "Bahia & Badii Palaces + Koutoubia Tour" },
  { re: /ourika/i, tab: "excursions", name: "Vall\xE9e de l'Ourika" },
  { re: /essaouira/i, tab: "excursions", name: "Essaouira" },
  { re: /ouzoud/i, tab: "excursions", name: "Cascades d'Ouzoud" },
  { re: /a[iï]t ben haddou|ouarzazate/i, tab: "excursions", name: "Ouarzazate & Kasbah Ait Ben Haddou" },
  { re: /dinner ?& ?show|dinner show|middag & show|d[îi]ner & spectacle|agafay dinner|gnawa/i, tab: "camps", name: "La Boh\xE8me Marrakech" }
];
function msTripRelated(trip, s) {
  const text = (trip.itinerary || []).map((d) => s(d.text) + " " + s(d.route)).join(" ") + " " + (trip.included || []).map(s).join(" ") + " " + s(trip.overview || "");
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  MS_TRIP_LINKS.forEach((l) => {
    if (l.re.test(text) && !seen.has(l.name)) {
      seen.add(l.name);
      out.push({ label: l.name, tab: l.tab, name: l.name });
    }
  });
  return out;
}
const MS_TRIP_GALLERIES = {
  "merzouga-sahara-escape": [
    "medina-koutoubia-dusk-18.jpg",
    "atlas-mountains-20.jpg",
    "web/aitbenhaddou.jpg",
    "web/ouarzazate-kasbah.jpg",
    "web/dades-valley.jpg",
    "web/todra-gorge.jpg",
    "sahara-camel-caravan-16.jpg",
    "sahara-dunes-ripples-13.jpg",
    "sahara-dunes-10.jpg",
    "sahara-dunes-12.jpg",
    "sahara-camel-sunrise-15.jpg",
    "food-tagine-09.webp"
  ],
  "marrakech-agafay": [
    "medina-koutoubia-04.jpg",
    "medina-jemaa-el-fna-10.webp",
    "medina-souk-spices-19.jpg",
    "riad-courtyard-pool-03.jpg",
    "food-garden-restaurant-05.jpg",
    "food-cooking-class-13.jpg",
    "agafay-pool-08.jpg",
    "agafay-camel-palmeraie-20.jpg",
    "agafay-dinner-table-03.jpg",
    "agafay-night-fire-show-02.avif",
    "agafay-dome-night-09.webp"
  ],
  "best-of-marrakech": [
    "medina-rooftop-cafe-14.jpg",
    "medina-jemaa-el-fna-night-11.jpg",
    "medina-carpet-souk-30.jpg",
    "marrakech-jardin-majorelle-01.jpg",
    "riad-pool-dusk-15.jpg",
    "atlas-setti-fatma-falls-12.jpg",
    "atlas-azzaden-valley-03.jpg",
    "essaouira-blue-boats-02.jpg",
    "agafay-pool-08.jpg",
    "agafay-night-lounge-05.jpg",
    "food-tagine-09.webp"
  ],
  "morocco-highlights": [
    "web/aitbenhaddou.jpg",
    "atlas-mountains-20.jpg",
    "medina-koutoubia-04.jpg",
    "web/dades-valley.jpg",
    "web/todra-gorge.jpg",
    "sahara-camel-caravan-16.jpg",
    "sahara-dunes-ripples-13.jpg",
    "sahara-dunes-10.jpg",
    "sahara-camel-sunrise-15.jpg",
    "agafay-night-fire-show-02.avif",
    "food-mechoui-lamb-03.webp"
  ],
  "grand-morocco-journey": [
    "web/chefchaouen-2.jpg",
    "chefchaouen-blue-alley-01.jpg",
    "web/fez-bab.jpg",
    "web/fez-tannery.jpg",
    "sahara-camel-caravan-16.jpg",
    "sahara-dunes-ripples-13.jpg",
    "sahara-dunes-10.jpg",
    "medina-koutoubia-dusk-18.jpg",
    "medina-jemaa-el-fna-night-11.jpg",
    "riad-courtyard-pool-03.jpg"
  ],
  "full-morocco-honeymoon": [
    "web/agadir-bay.jpg",
    "riad-suite-honeymoon-22.jpg",
    "medina-koutoubia-dusk-18.jpg",
    "riad-pool-dusk-01.jpg",
    "agafay-night-dinner-04.jpg",
    "sahara-camel-caravan-16.jpg",
    "sahara-dunes-ripples-13.jpg",
    "web/fez-bab.jpg",
    "web/chefchaouen-2.jpg",
    "web/tangier-medina.jpg",
    "hammam-spa-room-01.avif",
    "balloon-marrakech-01.jpg"
  ],
  "romance-4d3n": [
    "agafay-dinner-table-03.jpg",
    "agafay-night-dinner-04.jpg",
    "riad-rooftop-terrace-24.jpg",
    "riad-pool-dusk-15.jpg",
    "medina-lanterns-25.jpg",
    "agafay-dome-night-09.webp",
    "agafay-night-fire-show-02.avif",
    "riad-suite-honeymoon-22.jpg",
    "hammam-spa-room-01.avif",
    "balloon-marrakech-01.jpg"
  ],
  "romance-5d4n": [
    "medina-rooftop-cafe-14.jpg",
    "agafay-dinner-table-03.jpg",
    "riad-rooftop-terrace-24.jpg",
    "agafay-night-lounge-05.jpg",
    "essaouira-horse-sunset-03.jpg",
    "essaouira-beach-horse-01.jpg",
    "agafay-dome-night-09.webp",
    "riad-pool-dusk-15.jpg",
    "riad-suite-honeymoon-22.jpg",
    "balloon-marrakech-01.jpg"
  ],
  "family-4d3n": [
    "medina-jemaa-el-fna-10.webp",
    "medina-storks-03.jpg",
    "riad-courtyard-pool-03.jpg",
    "agafay-camel-palmeraie-20.jpg",
    "agafay-buggy-desert-19.jpg",
    "agafay-quad-desert-18.jpg",
    "agafay-pool-08.jpg",
    "food-cooking-class-13.jpg",
    "balloon-marrakech-01.jpg"
  ],
  "family-5d4n": [
    "medina-jemaa-el-fna-10.webp",
    "atlas-setti-fatma-falls-12.jpg",
    "atlas-azzaden-valley-03.jpg",
    "atlas-valley-14.jpg",
    "agafay-camel-palmeraie-20.jpg",
    "agafay-buggy-desert-19.jpg",
    "agafay-pool-08.jpg",
    "riad-courtyard-pool-03.jpg",
    "food-tagine-09.webp"
  ]
};
function msGalleryFor(trip) {
  if (trip.gallery && trip.gallery.length) return trip.gallery.map((p) => /^(assets\/|https?:)/.test(p) ? p : "assets/photos/" + p);
  const g = MS_TRIP_GALLERIES[trip.slug];
  const list = g && g.length ? g : [trip.img];
  return list.map((p) => /^(assets\/|https?:)/.test(p) ? p : "assets/photos/" + p);
}
function TripCarousel({ images, alt, children }) {
  const [idx, setIdx] = useStateIt(0);
  const [paused, setPaused] = useStateIt(false);
  const touch = useRefIt(null);
  const n = images.length;
  useEffectIt(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), 4200);
    return () => clearInterval(t);
  }, [paused, n]);
  useEffectIt(() => {
    if (idx >= n) setIdx(0);
  }, [n]);
  const go = (d) => setIdx((i) => (i + d + n) % n);
  const onTouchStart = (e) => {
    touch.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touch.current = null;
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "itin-carousel",
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      onTouchStart,
      onTouchEnd
    },
    /* @__PURE__ */ React.createElement("div", { className: "itin-carousel-track" }, images.map((src, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        className: "itin-carousel-slide" + (i === idx ? " is-active" : ""),
        style: { backgroundImage: `url(${src})` },
        role: "img",
        "aria-label": alt ? alt + " \u2014 " + (i + 1) : void 0
      }
    ))),
    children,
    n > 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "itin-carousel-arrow prev", onClick: (e) => {
      e.stopPropagation();
      go(-1);
    }, "aria-label": "Previous image" }, "\u2039"), /* @__PURE__ */ React.createElement("button", { className: "itin-carousel-arrow next", onClick: (e) => {
      e.stopPropagation();
      go(1);
    }, "aria-label": "Next image" }, "\u203A"), /* @__PURE__ */ React.createElement("div", { className: "itin-carousel-count" }, idx + 1, " / ", n), /* @__PURE__ */ React.createElement("div", { className: "itin-carousel-dots" }, images.map((_, i) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: i,
        className: "itin-carousel-dot" + (i === idx ? " is-active" : ""),
        onClick: (e) => {
          e.stopPropagation();
          setIdx(i);
        },
        "aria-label": "Go to image " + (i + 1)
      }
    ))))
  );
}
function ItinModal({ trip, onClose, lang, fmt }) {
  useEffectIt(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const s = (field) => typeof field === "object" && field !== null ? field[lang] || field.en || field : field;
  const terms = STANDARD_TERMS[lang === "no" ? "no" : lang === "fr" ? "fr" : lang === "sv" ? "sv" : "en"];
  const goPlan = (mode) => {
    window.MS_BookingContext = {
      mode: mode || "asis",
      trip,
      duration: trip.days || trip.nights + 1,
      title: s(trip.title),
      priceEur: trip.priceFromEUR
    };
    window.dispatchEvent(new CustomEvent("ms:booking-context"));
    onClose();
    setTimeout(() => {
      var _a;
      return (_a = document.getElementById("plan")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };
  const priceTxt = trip.priceFromEUR ? fmt ? fmt(trip.priceFromEUR) : `\u20AC${trip.priceFromEUR}` : null;
  const parseRows = (rawText) => {
    if (rawText.indexOf("||") > -1 || rawText.indexOf("~~") > -1) {
      return rawText.split("||").map((seg) => {
        const p = seg.split("~~");
        return p.length > 1 ? { t: p[0].trim(), a: p.slice(1).join("~~").trim() } : { t: "", a: seg.trim() };
      }).filter((r) => r.a);
    }
    const TIME_RE = /^((?:\d{1,2}[:.]\d{2})(?:\s*[–-]\s*\d{1,2}[:.]\d{2})?|Upon arrival|On arrival|Flight\s*[−–-]?\s*\d+\s*h?|Pre-dawn|Evening|Nightly|Night|Morning|Afternoon|All day)\b[\s.,—–-]*/i;
    return rawText.split(". ").map((seg) => seg.replace(/\.\s*$/, "").trim()).filter(Boolean).map((seg) => {
      const m = seg.match(TIME_RE);
      return m ? { t: m[1], a: seg.slice(m[0].length).trim() } : { t: "", a: seg };
    });
  };
  const groupTxt = trip.days >= 7 ? tx("Group 2\u20138", "Gruppe 2\u20138", "Groupe 2\u20138") : tx("Group 1\u201310", "Gruppe 1\u201310", "Groupe 1\u201310");
  const region = /Merzouga|Sahara/i.test(trip.route) ? "Merzouga, Morocco" : /Tangier|Chefchaouen|Fes|Fez/i.test(trip.route) ? "Chefchaouen, Morocco" : /Agadir/i.test(trip.route) ? "Agadir, Morocco" : "Marrakech, Morocco";
  const LD = window.MS_ListingDetail;
  const L = {
    id: "trip-" + trip.slug,
    lang,
    onClose,
    title: s(trip.title),
    subtitle: tx("Private guided journey in Morocco", "Privat guidet reise i Marokko", "Voyage priv\xE9 guid\xE9 au Maroc"),
    metaDots: [trip.days + " " + tx("days", "dager", "jours"), trip.nights + " " + tx("nights", "netter", "nuits"), groupTxt],
    badge: s(trip.badge),
    trust: tx("Licensed Moroccan-Norwegian agency \xB7 private & tailor-made \xB7 24/7 support", "Lisensiert marokkansk-norsk byr\xE5 \xB7 privat & skreddersydd \xB7 24/7 st\xF8tte", "Agence maroco-norv\xE9gienne agr\xE9\xE9e \xB7 priv\xE9 & sur mesure \xB7 assistance 24/7"),
    images: msGalleryFor(trip),
    highlightsTitle: tx("Trip highlights", "Reisens h\xF8ydepunkter", "Points forts"),
    highlights: trip.highlights.map(s),
    description: s(trip.overview),
    amenitiesTitle: tx("What\u2019s included", "Dette er inkludert", "Ce qui est inclus"),
    amenities: (trip.included || []).map(s),
    excluded: (trip.excluded || []).map(s),
    timeline: trip.itinerary.map((d) => ({ day: d.day, route: s(d.route), rows: parseRows(s(d.text)) })),
    related: msTripRelated(trip, s),
    mapRoute: trip.route,
    locationLabel: trip.route,
    thingsToKnow: {
      cancellation: { title: tx("Cancellation", "Avbestilling", "Annulation"), items: [tx("20% deposit to confirm, 80% on arrival.", "20% depositum for \xE5 bekrefte, 80% ved ankomst.", "Acompte de 20% pour confirmer, 80% \xE0 l\u2019arriv\xE9e."), tx("Free changes up to 30 days before.", "Gratis endringer inntil 30 dager f\xF8r.", "Modifications gratuites jusqu\u2019\xE0 30 jours avant.")] },
      rules: { title: tx("Good to know", "Verdt \xE5 vite", "Bon \xE0 savoir"), items: [groupTxt, tx("Private vehicle & driver throughout.", "Privat bil & sj\xE5f\xF8r hele veien.", "V\xE9hicule priv\xE9 & chauffeur tout au long."), tx("Best season: spring & autumn.", "Beste sesong: v\xE5r & h\xF8st.", "Meilleure saison : printemps & automne.")] },
      safety: { title: tx("Safety & trust", "Sikkerhet & trygghet", "S\xE9curit\xE9 & confiance"), items: [tx("Licensed tourism agency.", "Lisensiert turismebyr\xE5.", "Agence de tourisme agr\xE9\xE9e."), tx("24/7 WhatsApp support \u2014 Aladdin & Marte.", "24/7 WhatsApp-st\xF8tte \u2014 Aladdin & Marte.", "Assistance WhatsApp 24/7 \u2014 Aladdin & Marte."), tx("VAT included in the price.", "MVA inkludert i prisen.", "TVA incluse dans le prix.")] }
    },
    // No price shown for trips — every journey is quoted after an inquiry.
    price: { from: tx("Price on request", "Pris p\xE5 foresp\xF8rsel", "Prix sur demande"), per: tx("\u2014 tailored to your dates", "\u2014 tilpasset dine datoer", "\u2014 selon vos dates") },
    banner: tx("VAT & taxes included", "MVA & avgifter inkludert", "TVA & taxes incluses"),
    breadcrumb: ["Morocco", region.split(",")[0], s(trip.title)],
    reserveLabel: tx("Send inquiry", "Send foresp\xF8rsel", "Envoyer une demande"),
    reserveForm: true,
    onReserve: ({ sel, guests, name, email, phone, notes }) => {
      const iso = (d) => {
        try {
          return d.toISOString().slice(0, 10);
        } catch (e) {
          return "";
        }
      };
      const start = sel && sel.in ? iso(sel.in) : "";
      try {
        if (window.MS_submitForm) {
          window.MS_submitForm("itinerary", {
            item: s(trip.title),
            trip: trip.slug,
            tripDuration: trip.duration,
            name,
            email,
            phone,
            people: guests,
            notes: notes || "",
            startDate: start,
            endDate: sel && sel.out ? iso(sel.out) : start,
            duration: trip.days,
            summary: s(trip.title) + " \xB7 " + trip.route
          }, { via: "trip-modal" });
        }
        const prev = JSON.parse(localStorage.getItem("ms_profile_data") || "{}");
        localStorage.setItem("ms_profile_data", JSON.stringify({ ...prev, name: name || prev.name, email: email || prev.email, phone: phone || prev.phone }));
      } catch (e) {
      }
      if (window.MS_Auth_PromptAfterBooking) window.MS_Auth_PromptAfterBooking();
    }
  };
  return LD ? /* @__PURE__ */ React.createElement(LD, { ...L }) : null;
}
function Itineraries() {
  const { useMS, usePrice } = window.MS_CTX;
  const ctx = useMS();
  const price = usePrice();
  const lang = ctx.lang || "en";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const SEASONS_ALL = window.MS_SEASONS_ALL || [];
  const isNo = lang === "no" || lang === "sv" || lang === "da";
  const [topTab, setTopTab] = useStateIt(SEASONS_ALL.length ? "season" : "tours");
  const [seasonIdx, setSeasonIdx] = useStateIt(window.MS_SEASON_DEFAULT_INDEX || 0);
  const [seasonWho, setSeasonWho] = useStateIt(0);
  const [filter, setFilter] = useStateIt("4D3N");
  const CD = window.MS_DATA || {};
  const cnt = (a) => Array.isArray(a) ? a.length : 0;
  const CAT_TABS = [
    ["activities", tx("Activities", "Aktiviteter", "Activit\xE9s", "Aktiviteter"), "\u{1F9ED}", cnt(CD.ACTIVITIES)],
    ["camps", "Agafay", "\u26FA", cnt(CD.CAMPS)],
    ["transport", tx("Car rental", "Bilutleie", "Location de voiture", "Biluthyrning"), "\u{1F697}", cnt(CD.TRANSPORT)],
    ["restaurants", tx("Restaurants", "Restauranter", "Restaurants", "Restauranger"), "\u{1F374}", cnt(CD.RESTAURANTS)],
    ["spa", tx("Spa & Hammam", "Spa & Hammam", "Spa & Hammam", "Spa & Hammam"), "\u{1F33F}", cnt(CD.SPAS)],
    ["hotels", tx("Hotels", "Hoteller", "H\xF4tels", "Hotell"), "\u2B50", cnt(CD.HOTELS)],
    ["pools", tx("Pools", "Basseng", "Piscines", "Pooler"), "\u2600\uFE0F", cnt(CD.POOLS)]
  ];
  const TRIP_TABS_META = { season: "\u{1F5D3}\uFE0F", tours: "\u{1F9F3}", plan: "\u270F\uFE0F" };
  const [catMode, setCatMode] = useStateIt(null);
  useEffectIt(() => {
    window.MS_HUB_CAT = catMode;
    window.dispatchEvent(new CustomEvent("ms:hub-cat", { detail: { cat: catMode } }));
    window.dispatchEvent(new CustomEvent("ms:plan-open", { detail: { open: !catMode && topTab === "plan" } }));
  }, [catMode, topTab]);
  useEffectIt(() => {
    const onOpenPlan = () => {
      setCatMode(null);
      setTopTab("plan");
      setTimeout(() => {
        var _a;
        return (_a = document.getElementById("itineraries")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    };
    const onOpenCat = (e) => {
      const id = e && e.detail && e.detail.cat || "activities";
      setCatMode(id);
      window.MS_HUB_CAT = id;
      window.dispatchEvent(new CustomEvent("ms:hub-cat", { detail: { cat: id } }));
      setTimeout(() => {
        var _a;
        return (_a = document.getElementById("itineraries")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    };
    window.addEventListener("ms:open-plan", onOpenPlan);
    window.addEventListener("ms:open-cat", onOpenCat);
    return () => {
      window.removeEventListener("ms:open-plan", onOpenPlan);
      window.removeEventListener("ms:open-cat", onOpenCat);
    };
  }, []);
  const pickTrip = (t) => {
    setCatMode(null);
    setTopTab(t);
    if (t === "plan") setTimeout(() => {
      var _a;
      return (_a = document.getElementById("itineraries")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };
  const pickCat = (id) => {
    setCatMode(id);
    window.MS_HUB_CAT = id;
    window.dispatchEvent(new CustomEvent("ms:hub-cat", { detail: { cat: id } }));
    setTimeout(() => {
      var _a;
      return (_a = document.getElementById("catalog")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };
  const scrollToPlan = () => {
    window.MS_BookingContext = null;
    window.dispatchEvent(new CustomEvent("ms:booking-context"));
    setTimeout(() => {
      var _a;
      return (_a = document.getElementById("plan")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };
  const [sliderDir, setSliderDir] = useStateIt("next");
  const [openTrip, setOpenTrip] = useStateIt(null);
  const [visibleCount, setVisibleCount] = useStateIt(4);
  const adjustedPrice = (eur) => price(eur * 1.4);
  useEffectIt(() => {
    setVisibleCount(4);
  }, [filter, topTab]);
  useEffectIt(() => {
    const onOpen = (e) => {
      var _a;
      const slug = (_a = e.detail) == null ? void 0 : _a.slug;
      if (!slug) return;
      const trip = (window.MS_ITINERARIES || []).find((t) => t.slug === slug);
      if (trip) {
        setOpenTrip(trip);
        return;
      }
      setFilter("4D3N");
    };
    window.addEventListener("ms:open-trip", onOpen);
    return () => window.removeEventListener("ms:open-trip", onOpen);
  }, []);
  const filterLabel = (f) => {
    if (f === "Sesong") return seasonLabel;
    if (f === "All") return tx("All", "Alle", "Tout");
    if (f === "Themes") return tx("Themes", "Temaer", "Th\xE8mes");
    if (f === "Romance & Family") return tx("Romance & Family", "Romantikk & Familie", "Romance & Famille");
    if (f === "Most booked") return tx("Most booked", "Mest bestilt", "Plus r\xE9serv\xE9");
    if (f === "3D2N") return tx("3 days", "3 dager", "3 jours");
    if (f === "4D3N") return tx("4 days", "4 dager", "4 jours");
    if (f === "5D4N") return tx("5 days", "5 dager", "5 jours");
    if (f === "7D6N") return tx("7 days", "7 dager", "7 jours");
    if (f === "10D9N") return tx("10 days", "10 dager", "10 jours");
    if (f === "14D13N") return tx("14 days", "14 dager", "14 jours");
    return f;
  };
  const filters = ["3D2N", "4D3N", "5D4N", "7D6N", "10D9N", "14D13N", "Romance & Family"];
  const ALLOWED_DURATIONS = /* @__PURE__ */ new Set(["3D2N", "4D3N", "5D4N", "7D6N", "10D9N", "14D13N"]);
  const THEMES = useMemoIt(() => [
    {
      __theme: true,
      slug: "theme-culinary",
      id: "culinary",
      emoji: "\u{1F36F}",
      tripType: "culinary",
      priceFromEUR: 890,
      title: tx("Culinary trip", "Mat & smaker", "Voyage culinaire"),
      teaser: tx(
        "Markets, tagine masterclasses, rooftop dinners and a Moroccan cooking-class week.",
        "Markeder, tagine-kurs, takdinerer og en uke med marokkansk matlaging.",
        "March\xE9s, masterclass de tajine, d\xEEners sur les toits et une semaine autour de la cuisine."
      ),
      duration: "5D4N",
      days: 5,
      route: "Marrakech \xB7 Atlas foothills",
      themeTags: ["Culinary", "Tagine", "Markets"],
      badge: "THEME",
      img: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=1100&q=72",
      chapter: "CULINARY"
    },
    {
      __theme: true,
      slug: "theme-romantic",
      id: "romantic",
      emoji: "\u{1F49E}",
      tripType: "romantic",
      priceFromEUR: 1090,
      title: tx("Romantic trip", "Romantisk reise", "Voyage romantique"),
      teaser: tx(
        "Riad hammam, candle-lit Agafay dinner, sunset camel ride and slow palmeraie mornings.",
        "Riad-hammam, stearinlysmiddag i Agafay, kameltur i solnedgang og rolige palmeraie-morgener.",
        "Hammam au riad, d\xEEner aux chandelles \xE0 l'Agafay, balade \xE0 dos de chameau et matins doux \xE0 la palmeraie."
      ),
      duration: "5D4N",
      days: 5,
      route: "Riad \xB7 Agafay \xB7 Palmeraie",
      themeTags: ["Romantic", "Spa", "Slow"],
      badge: "THEME",
      img: "assets/photos/sahara-sunset-riding-17.jpg",
      chapter: "ROMANTIC"
    },
    {
      __theme: true,
      slug: "theme-cultural",
      id: "cultural",
      emoji: "\u{1F54C}",
      tripType: "cultural",
      priceFromEUR: 1390,
      title: tx("Cultural trip", "Kulturreise", "Voyage culturel"),
      teaser: tx(
        "Medinas, palaces, museums and the imperial cities \u2014 Marrakech, Fez and Chefchaouen.",
        "Medinaer, palasser, museer og keiserbyer \u2014 Marrakech, Fez og Chefchaouen.",
        "M\xE9dinas, palais, mus\xE9es et villes imp\xE9riales \u2014 Marrakech, F\xE8s et Chefchaouen."
      ),
      duration: "7D6N",
      days: 7,
      route: "Marrakech \xB7 Fez \xB7 Chefchaouen",
      themeTags: ["Culture", "Heritage", "Medina"],
      badge: "THEME",
      img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1100&q=72",
      chapter: "CULTURAL"
    },
    {
      __theme: true,
      slug: "theme-mountain",
      id: "mountain",
      emoji: "\u{1F3D4}\uFE0F",
      tripType: "mountain",
      priceFromEUR: 890,
      title: tx("Mountain trek & nature", "Fjelltur & natur", "Trek & nature"),
      teaser: tx(
        "High Atlas valleys, Toubkal base camp, walnut groves and Berber lodges.",
        "H\xF8ye Atlas-daler, Toubkal-base-camp, valn\xF8ttlunder og berber-losjier.",
        "Vall\xE9es du Haut Atlas, camp de base du Toubkal, noyers et lodges berb\xE8res."
      ),
      duration: "5D4N",
      days: 5,
      route: "Imlil \xB7 Toubkal \xB7 Berber villages",
      themeTags: ["Mountain", "Trek", "Nature"],
      badge: "THEME",
      img: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1100&q=72",
      chapter: "MOUNTAIN"
    },
    {
      __theme: true,
      slug: "theme-desert-marathon",
      id: "desert-marathon",
      emoji: "\u{1F3C3}",
      tripType: "desert-marathon",
      priceFromEUR: 1490,
      title: tx("Desert marathon trip", "\xD8rken-maraton", "Marathon du d\xE9sert"),
      teaser: tx(
        "Train and recover around Marathon des Sables \u2014 Agafay long runs, Sahara taper and recovery riad.",
        "Tren og restituer rundt Marathon des Sables \u2014 lange l\xF8p i Agafay, taper i Sahara og restitusjons-riad.",
        "Pr\xE9paration autour du Marathon des Sables \u2014 sorties longues \xE0 l'Agafay, taper au Sahara et riad r\xE9cup."
      ),
      duration: "7D6N",
      days: 7,
      route: "Agafay \xB7 Sahara \xB7 recovery riad",
      themeTags: ["Endurance", "Sahara", "Training"],
      badge: "THEME",
      img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1100&q=72",
      chapter: "MARATHON"
    },
    {
      __theme: true,
      slug: "theme-sport",
      id: "sport",
      emoji: "\u{1F3C4}",
      tripType: "sport",
      priceFromEUR: 1290,
      title: tx("Sport trip", "Sportsreise", "Voyage sportif"),
      teaser: tx(
        "Surf in Taghazout, mountain biking in the Atlas, paragliding, padel and golf \u2014 handled by the team.",
        "Surf i Taghazout, terrengsykling i Atlas, paragliding, padel og golf \u2014 vi tar oss av alt.",
        "Surf \xE0 Taghazout, VTT dans l'Atlas, parapente, padel et golf \u2014 l'\xE9quipe s'occupe de tout."
      ),
      duration: "7D6N",
      days: 7,
      route: "Taghazout \xB7 Atlas \xB7 Palmeraie",
      themeTags: ["Surf", "Bike", "Padel"],
      badge: "THEME",
      img: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1100&q=72",
      chapter: "SPORT"
    },
    {
      __theme: true,
      slug: "theme-festival",
      id: "festival",
      emoji: "\u{1F3B6}",
      tripType: "festival",
      priceFromEUR: 990,
      title: tx("Festival trip", "Festivalreise", "Voyage festival"),
      teaser: tx(
        "Built around Marrakech festivals \u2014 Gnaoua Essaouira, Marrakech du Rire, FIFM and the Sahara music nights.",
        "Bygd rundt festivaler \u2014 Gnaoua i Essaouira, Marrakech du Rire, FIFM og musikknetter i Sahara.",
        "Cal\xE9 sur les festivals \u2014 Gnaoua d'Essaouira, Marrakech du Rire, FIFM et nuits musicales au Sahara."
      ),
      duration: "5D4N",
      days: 5,
      route: "Marrakech \xB7 Essaouira",
      themeTags: ["Music", "Festival", "Culture"],
      badge: "THEME",
      img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1100&q=72",
      chapter: "FESTIVAL"
    }
  ], [lang]);
  const openTheme = (t) => {
    window.MS_BookingContext = {
      mode: "theme",
      title: t.title,
      duration: t.days,
      tripType: t.tripType,
      themeId: t.id,
      themeBrief: t.teaser
    };
    window.dispatchEvent(new CustomEvent("ms:booking-context"));
    setTimeout(() => {
      var _a;
      return (_a = document.getElementById("plan")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };
  const all = useMemoIt(() => [
    ...THEMES,
    ...ITINS
  ].filter((t) => t.__theme || t.__special || ALLOWED_DURATIONS.has(t.duration)), [THEMES]);
  const matches = (t) => {
    if (filter === "Themes") return !!t.__theme;
    if (filter === "Romance & Family") return !!t.__special;
    return !t.__theme && !t.__special && !t.__season && t.duration === filter;
  };
  const tier = (t) => {
    if (t.__season) return -3;
    if (t.__theme) return -2;
    if (t.__special) return -1.5;
    if (t.badge === "MOST BOOKED" || t.badge === "MOST LOVED") return -1;
    if (t.duration === "4D3N") return 1;
    if (t.duration === "5D4N") return 2;
    if (t.duration === "7D6N") return 3;
    if (t.duration === "10D9N") return 4;
    if (t.duration === "14D13N") return 5;
    return 6;
  };
  const items = useMemoIt(() => {
    if (topTab === "season") {
      const s = SEASONS_ALL[Math.min(seasonIdx, SEASONS_ALL.length - 1)];
      if (!s) return [];
      const trip = s.trips[Math.min(seasonWho, s.trips.length - 1)];
      return trip ? [trip] : [];
    }
    if (topTab === "plan") return [];
    return all.filter(matches).sort((a, b) => tier(a) - tier(b));
  }, [topTab, filter, all, seasonIdx, seasonWho]);
  const featureMode = topTab === "season" || topTab === "tours" && filter !== "Themes" && filter !== "Romance & Family";
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  return /* @__PURE__ */ React.createElement("section", { className: `reiseplaner-section catalog section ${catMode ? "cat-active" : ""} ${!catMode && topTab === "plan" ? "plan-active" : ""}`, id: "itineraries" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "section-head reveal", style: { textAlign: "center", margin: "0 auto 56px" } }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, "\u2014 ", tx("Reiseplaner", "Reiseplaner", "Itin\xE9raires")), /* @__PURE__ */ React.createElement("h2", null, tx("Our best ", "V\xE5re beste ", "Nos meilleures ", "V\xE5ra b\xE4sta "), /* @__PURE__ */ React.createElement("em", null, tx("offers", "tilbud", "offres", "erbjudanden"))), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 auto" } }, tx(
    "Pick the trip you like \u2014 we write the rest with you.",
    "Velg reisen du liker \u2014 vi skriver resten med deg.",
    "Choisissez le voyage qui vous pla\xEEt \u2014 nous \xE9crivons le reste avec vous."
  ))), /* @__PURE__ */ React.createElement("div", { className: "trip-bar reveal" }, /* @__PURE__ */ React.createElement("div", { className: "cat-tabs-v2 trip-maintabs-v2", role: "tablist" }, SEASONS_ALL.length > 0 && /* @__PURE__ */ React.createElement(
    "button",
    {
      role: "tab",
      "aria-selected": !catMode && topTab === "season",
      className: `cat-tab-v2 ${!catMode && topTab === "season" ? "active" : ""}`,
      onClick: () => pickTrip("season")
    },
    /* @__PURE__ */ React.createElement("span", null, tx("Season tours", "Sesongturer", "Voyages saisonniers"))
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      role: "tab",
      "aria-selected": !catMode && topTab === "tours",
      className: `cat-tab-v2 ${!catMode && topTab === "tours" ? "active" : ""}`,
      onClick: () => pickTrip("tours")
    },
    /* @__PURE__ */ React.createElement("span", null, tx("Tours", "Turer", "Circuits"))
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      role: "tab",
      "aria-selected": !catMode && topTab === "plan",
      className: `cat-tab-v2 ${!catMode && topTab === "plan" ? "active" : ""}`,
      onClick: () => pickTrip("plan")
    },
    /* @__PURE__ */ React.createElement("span", null, tx("Build your trip", "Lag din egen", "Sur mesure", "Skapa egen"))
  ), /* @__PURE__ */ React.createElement("span", { className: "trip-maintabs-sep", "aria-hidden": "true" }), CAT_TABS.map(([id, label, ico, count]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: id,
      role: "tab",
      "aria-selected": catMode === id,
      className: `cat-tab-v2 ${catMode === id ? "active" : ""}`,
      onClick: () => pickCat(id)
    },
    /* @__PURE__ */ React.createElement("span", null, label),
    /* @__PURE__ */ React.createElement("span", { className: "count" }, count)
  ))), !catMode && topTab === "season" && SEASONS_ALL.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "trip-bar-ctx" }, /* @__PURE__ */ React.createElement("div", { className: "season-vac-line", role: "tablist", "aria-label": tx("Vacation", "Ferie", "Vacances") }, SEASONS_ALL.map((s, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.key,
      role: "tab",
      "aria-selected": seasonIdx === i,
      className: `season-vac-pill ${seasonIdx === i ? "active" : ""} ${s.upcoming ? "is-now" : ""}`,
      onClick: () => setSeasonIdx(i)
    },
    isNo ? s.no : s.en,
    s.upcoming && /* @__PURE__ */ React.createElement("span", { className: "season-vac-now" }, tx("Now", "N\xE5", "Maintenant"))
  ))), /* @__PURE__ */ React.createElement("span", { className: "trip-bar-sep", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "season-subtabs-track", role: "tablist", "aria-label": tx("Who travels", "Hvem reiser", "Qui voyage") }, SEASONS_ALL[seasonIdx].trips.map((s, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.slug,
      role: "tab",
      "aria-selected": seasonWho === i,
      className: `season-subtab ${seasonWho === i ? "active" : ""}`,
      onClick: () => setSeasonWho(i)
    },
    typeof s.who === "object" ? s.who[lang] || s.who.en : s.who
  ))))), !catMode && topTab === "tours" && /* @__PURE__ */ React.createElement("div", { className: "trip-filter-bar reveal" }, /* @__PURE__ */ React.createElement("div", { className: "trip-filter-scroll" }, filters.map((f) => {
    const count = f === "Themes" ? all.filter((t) => t.__theme).length : f === "Romance & Family" ? all.filter((t) => t.__special).length : all.filter((t) => !t.__theme && !t.__special && t.duration === f).length;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: f,
        className: `trip-filter-chip ${filter === f ? "active" : ""}`,
        onClick: () => setFilter(f)
      },
      /* @__PURE__ */ React.createElement("span", null, filterLabel(f)),
      /* @__PURE__ */ React.createElement("span", { className: "trip-filter-count" }, count)
    );
  }), /* @__PURE__ */ React.createElement("span", { className: "trip-filter-sep", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "trip-filter-chip trip-filter-cta",
      onClick: () => {
        window.MS_BookingContext = { mode: "wedding", title: tx("Wedding planner", "Bryllup", "Mariage"), duration: 7, tripType: "wedding" };
        window.dispatchEvent(new CustomEvent("ms:booking-context"));
        pickTrip("plan");
      }
    },
    "\u{1F48D} ",
    tx("Wedding", "Bryllup", "Mariage")
  ))), !catMode && topTab !== "plan" && /* @__PURE__ */ React.createElement("div", { className: `trip-slider ${featureMode ? "trip-slider-feature" : ""}`, "data-dir": sliderDir }, topTab === "tours" && (filter === "Themes" || filter === "Romance & Family") ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "trip-slider-arrow prev",
      "aria-label": "Previous",
      onClick: (e) => {
        const sc = e.currentTarget.parentElement.querySelector(".trip-slider-track");
        sc == null ? void 0 : sc.scrollBy({ left: -(sc.clientWidth * 0.85), behavior: "smooth" });
      }
    },
    /* @__PURE__ */ React.createElement(Iit.Arrow, { s: 18, dir: 180 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "trip-slider-arrow next",
      "aria-label": "Next",
      onClick: (e) => {
        const sc = e.currentTarget.parentElement.querySelector(".trip-slider-track");
        sc == null ? void 0 : sc.scrollBy({ left: sc.clientWidth * 0.85, behavior: "smooth" });
      }
    },
    /* @__PURE__ */ React.createElement(Iit.Arrow, { s: 18 })
  )) : topTab === "tours" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "trip-slider-arrow prev",
      "aria-label": tx("Shorter trip", "Kortere reise", "Plus court"),
      onClick: () => {
        const order = ["3D2N", "4D3N", "5D4N", "7D6N", "10D9N", "14D13N", "Romance & Family"];
        const idx = Math.max(0, order.indexOf(filter));
        setSliderDir("prev");
        setFilter(order[(idx - 1 + order.length) % order.length]);
      }
    },
    /* @__PURE__ */ React.createElement(Iit.Arrow, { s: 18, dir: 180 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "trip-slider-arrow next",
      "aria-label": tx("Longer trip", "Lengre reise", "Plus long"),
      onClick: () => {
        const order = ["3D2N", "4D3N", "5D4N", "7D6N", "10D9N", "14D13N", "Romance & Family"];
        const idx = Math.max(0, order.indexOf(filter));
        setSliderDir("next");
        setFilter(order[(idx + 1) % order.length]);
      }
    },
    /* @__PURE__ */ React.createElement(Iit.Arrow, { s: 18 })
  )) : null, /* @__PURE__ */ React.createElement("div", { className: `trip-slider-track cat-grid reiseplaner-grid ${featureMode ? "reiseplaner-grid-feature" : ""}` }, visibleItems.map((t, i) => {
    const seed = t.slug.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    const rating = (4.7 + seed % 30 / 100).toFixed(2);
    const reviews = 180 + seed * 7 % 1620;
    const key = `itin-${t.slug}`;
    const isTheme = !!t.__theme;
    const isFeature = featureMode && !isTheme && !t.__special;
    const handleOpen = () => isTheme ? openTheme(t) : setOpenTrip(t);
    const priceTxt = t.priceFromEUR ? adjustedPrice(t.priceFromEUR) : null;
    if (isFeature) {
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: t.slug,
          className: "trip-feature reveal",
          onClick: handleOpen,
          role: "button",
          tabIndex: 0,
          onKeyDown: (e) => e.key === "Enter" && handleOpen()
        },
        /* @__PURE__ */ React.createElement("div", { className: "trip-feature-img" }, /* @__PURE__ */ React.createElement(TripCarousel, { images: msGalleryFor(t), alt: typeof t.title === "object" ? t.title[lang] || t.title.en : t.title }, /* @__PURE__ */ React.createElement("span", { className: "trip-feature-badge" }, (typeof t.badge === "object" ? t.badge[lang] || t.badge.en : t.badge) || tx("Best pick", "Best i klassen", "Notre coup de c\u0153ur")), /* @__PURE__ */ React.createElement("span", { className: "trip-feature-duration" }, t.duration))),
        /* @__PURE__ */ React.createElement("div", { className: "trip-feature-body" }, /* @__PURE__ */ React.createElement("div", { className: "trip-feature-eyebrow" }, t.__season ? /* @__PURE__ */ React.createElement(React.Fragment, null, tx("Seasonal trip", "Sesongtur", "Voyage saisonnier"), " \xB7 ", t.chapter) : /* @__PURE__ */ React.createElement(React.Fragment, null, tx("Chapter", "Kapittel", "Chapitre"), " ", t.chapter), " \xB7 ", t.duration, t.__season && SEASONS_ALL[seasonIdx] && /* @__PURE__ */ React.createElement("span", { className: "trip-feature-dates" }, " \xB7 ", SEASONS_ALL[seasonIdx].dateLabel)), /* @__PURE__ */ React.createElement("h3", { className: "trip-feature-title" }, typeof t.title === "object" ? t.title[lang] || t.title.en : t.title), /* @__PURE__ */ React.createElement("p", { className: "trip-feature-teaser" }, typeof t.teaser === "object" ? t.teaser[lang] || t.teaser.en : t.teaser), t.idealFor && /* @__PURE__ */ React.createElement("div", { className: "trip-feature-ideal" }, /* @__PURE__ */ React.createElement("span", { className: "trip-feature-ideal-label" }, tx("Ideal for", "Perfekt for", "Id\xE9al pour")), /* @__PURE__ */ React.createElement("span", null, typeof t.idealFor === "object" ? t.idealFor[lang] || t.idealFor.en : t.idealFor)), Array.isArray(t.highlights) && t.highlights.length > 0 && /* @__PURE__ */ React.createElement("ul", { className: "trip-feature-highlights" }, t.highlights.slice(0, 5).map((h, hi) => /* @__PURE__ */ React.createElement("li", { key: hi }, typeof h === "object" ? h[lang] || h.en : h))), /* @__PURE__ */ React.createElement("div", { className: "trip-feature-foot" }, /* @__PURE__ */ React.createElement("button", { className: "trip-feature-cta", onClick: (e) => {
          e.stopPropagation();
          handleOpen();
        } }, tx("See full itinerary", "Se hele reisen", "Voir l'itin\xE9raire"), " \u2192")))
      );
    }
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: t.slug,
        className: `cat-card reveal ${isTheme ? "cat-card-theme" : ""}`,
        style: { transitionDelay: `${i % 6 * 50}ms` },
        onClick: handleOpen,
        role: "button",
        tabIndex: 0,
        onKeyDown: (e) => e.key === "Enter" && handleOpen()
      },
      /* @__PURE__ */ React.createElement("div", { className: "cat-img", style: { backgroundImage: `url(${t.img})`, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("div", { className: "cat-img-content" }, /* @__PURE__ */ React.createElement("span", { className: "cat-tag brand" }, isTheme ? `${t.emoji} ${tx("Theme", "Tema", "Th\xE8me")}` : t.duration)), t.badge && /* @__PURE__ */ React.createElement("span", { className: "reiseplan-badge" }, typeof t.badge === "object" ? t.badge[lang] || t.badge.en : t.badge)),
      /* @__PURE__ */ React.createElement("div", { className: "cat-body trip-card-body" }, /* @__PURE__ */ React.createElement("h3", { className: "cat-title trip-card-title" }, typeof t.title === "object" ? t.title[lang] || t.title.en : t.title), /* @__PURE__ */ React.createElement("span", { className: "cat-area trip-card-route" }, /* @__PURE__ */ React.createElement(Iit.Pin, { s: 12 }), " ", t.route), /* @__PURE__ */ React.createElement("p", { className: "cat-desc trip-card-desc" }, typeof t.teaser === "object" ? t.teaser[lang] || t.teaser.en : t.teaser), Array.isArray(t.themeTags) && t.themeTags.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "trip-card-tags" }, t.themeTags.slice(0, 3).map((tag, ti) => /* @__PURE__ */ React.createElement("span", { key: ti, className: "trip-card-tag" }, tag))), /* @__PURE__ */ React.createElement("div", { className: "cat-foot trip-card-foot" }, /* @__PURE__ */ React.createElement("span", { className: "trip-card-cta-label" }, isTheme ? tx("Plan this \u2192", "Planlegg \u2192", "Planifier \u2192") : tx("See details \u2192", "Se detaljer \u2192", "Voir \u2192"))))
    );
  }))), hasMore && /* @__PURE__ */ React.createElement("div", { className: "cat-showmore-row" }, /* @__PURE__ */ React.createElement("button", { className: "cat-showmore", onClick: () => setVisibleCount((c) => c + 4) }, tx(
    `Show more (${items.length - visibleCount} left)`,
    `Vis flere (${items.length - visibleCount} igjen)`,
    `Voir plus (${items.length - visibleCount} restants)`
  ), /* @__PURE__ */ React.createElement(Iit.Arrow, { s: 14 })), visibleCount + 4 < items.length && /* @__PURE__ */ React.createElement("button", { className: "cat-showall", onClick: () => setVisibleCount(items.length) }, tx("Show all", "Vis alle", "Tout voir")))), openTrip && /* @__PURE__ */ React.createElement(ItinModal, { trip: openTrip, lang, fmt: adjustedPrice, onClose: () => setOpenTrip(null) }));
}
window.MS_ITINERARIES = ITINS;
window.MS_Itineraries = Itineraries;
