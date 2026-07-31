const { useState: useStateFl, useMemo: useMemoFl, useEffect: useEffectFl } = React;
const Ifl = window.MS_I;
const TP_MARKER = "000000";
const SKYSCANNER_ASSOC = "";
const NORWEGIAN_AIRPORTS = [
  { code: "OSL", city: "Oslo", name_en: "Oslo Gardermoen", name_nb: "Oslo Gardermoen", name_fr: "Oslo Gardermoen", name_sv: "Oslo Gardermoen" },
  { code: "TRF", city: "Sandefjord", name_en: "Sandefjord Torp", name_nb: "Sandefjord Torp", name_fr: "Sandefjord Torp", name_sv: "Sandefjord Torp" },
  { code: "BGO", city: "Bergen", name_en: "Bergen", name_nb: "Bergen", name_fr: "Bergen", name_sv: "Bergen" },
  { code: "SVG", city: "Stavanger", name_en: "Stavanger Sola", name_nb: "Stavanger Sola", name_fr: "Stavanger Sola", name_sv: "Stavanger Sola" },
  { code: "TRD", city: "Trondheim", name_en: "Trondheim V\xE6rnes", name_nb: "Trondheim V\xE6rnes", name_fr: "Trondheim V\xE6rnes", name_sv: "Trondheim V\xE4rnes" },
  { code: "KRS", city: "Kristiansand", name_en: "Kristiansand Kjevik", name_nb: "Kristiansand Kjevik", name_fr: "Kristiansand Kjevik", name_sv: "Kristiansand Kjevik" },
  { code: "BOO", city: "Bod\xF8", name_en: "Bod\xF8", name_nb: "Bod\xF8", name_fr: "Bod\xF8", name_sv: "Bod\xF8" },
  { code: "TOS", city: "Troms\xF8", name_en: "Troms\xF8 Langnes", name_nb: "Troms\xF8 Langnes", name_fr: "Troms\xF8 Langnes", name_sv: "Troms\xF8 Langnes" }
];
const MOROCCAN_AIRPORTS = [
  { code: "RAK", city: "Marrakech", name_en: "Marrakech Menara", name_nb: "Marrakech Menara", name_fr: "Marrakech Menara", name_sv: "Marrakech Menara" },
  { code: "CMN", city: "Casablanca", name_en: "Casablanca Mohammed V", name_nb: "Casablanca Mohammed V", name_fr: "Casablanca Mohammed V", name_sv: "Casablanca Mohammed V" },
  { code: "AGA", city: "Agadir", name_en: "Agadir Al Massira", name_nb: "Agadir Al Massira", name_fr: "Agadir Al Massira", name_sv: "Agadir Al Massira" },
  { code: "FEZ", city: "Fez", name_en: "Fez Sa\xEFs", name_nb: "Fez Sa\xEFs", name_fr: "F\xE8s Sa\xEFs", name_sv: "Fez Sa\xEFs" },
  { code: "TNG", city: "Tangier", name_en: "Tangier Ibn Battouta", name_nb: "Tanger Ibn Battouta", name_fr: "Tanger Ibn Battouta", name_sv: "Tanger Ibn Battouta" },
  { code: "NDR", city: "Nador", name_en: "Nador El Aroui", name_nb: "Nador El Aroui", name_fr: "Nador El Aroui", name_sv: "Nador El Aroui" },
  { code: "OUD", city: "Oujda", name_en: "Oujda Angads", name_nb: "Oujda Angads", name_fr: "Oujda Angads", name_sv: "Oujda Angads" },
  { code: "ESU", city: "Essaouira", name_en: "Essaouira Mogador", name_nb: "Essaouira Mogador", name_fr: "Essaouira Mogador", name_sv: "Essaouira Mogador" },
  { code: "VIL", city: "Dakhla", name_en: "Dakhla", name_nb: "Dakhla", name_fr: "Dakhla", name_sv: "Dakhla" }
];
const ROUTE_INTEL = {
  OSL: {
    direct: ["RAK", "AGA"],
    typical_stop: ["AMS", "CDG", "MAD", "CPH", "FRA"],
    carriers: ["Norwegian (DY)", "SAS (SK)", "Royal Air Maroc (AT)", "KLM (KL)", "Air France (AF)"],
    note_en: "Norwegian flies OSL\u2192RAK and OSL\u2192AGA direct, roughly late October to early April. Off-season, expect one stop via Amsterdam, Paris, or Madrid.",
    note_nb: "Norwegian flyr OSL\u2192RAK og OSL\u2192AGA direkte, omtrent fra sen oktober til tidlig april. Utenfor sesong, regn med ett mellomstopp via Amsterdam, Paris eller Madrid.",
    note_fr: "Norwegian assure des vols directs OSL\u2192RAK et OSL\u2192AGA de fin octobre \xE0 d\xE9but avril environ. Hors saison, comptez une escale via Amsterdam, Paris ou Madrid.",
    note_sv: "Norwegian flyger OSL\u2192RAK och OSL\u2192AGA direkt, ungef\xE4r fr\xE5n sen oktober till tidig april. Utanf\xF6r s\xE4song, r\xE4kna med ett mellanlandning via Amsterdam, Paris eller Madrid."
  },
  BGO: {
    direct: [],
    typical_stop: ["AMS", "CDG", "CPH"],
    carriers: ["KLM via AMS", "Air France via CDG", "SAS via CPH"],
    note_en: "Always one stop from Bergen. KLM via Amsterdam usually has the best timing.",
    note_nb: "Alltid ett mellomstopp fra Bergen. KLM via Amsterdam har som regel best timing.",
    note_fr: "Toujours une escale depuis Bergen. KLM via Amsterdam offre g\xE9n\xE9ralement les meilleurs horaires.",
    note_sv: "Alltid ett mellanlandning fr\xE5n Bergen. KLM via Amsterdam har vanligtvis b\xE4st tidtabell."
  },
  SVG: {
    direct: [],
    typical_stop: ["AMS", "CDG"],
    carriers: ["KLM via AMS", "Air France via CDG"],
    note_en: "One stop from Stavanger, typically through Amsterdam.",
    note_nb: "Ett mellomstopp fra Stavanger, vanligvis via Amsterdam.",
    note_fr: "Une escale depuis Stavanger, g\xE9n\xE9ralement via Amsterdam.",
    note_sv: "Ett mellanlandning fr\xE5n Stavanger, vanligtvis via Amsterdam."
  },
  TRD: {
    direct: [],
    typical_stop: ["AMS", "CPH"],
    carriers: ["KLM via AMS", "SAS via CPH"],
    note_en: "One stop from Trondheim. Same-day arrivals possible most days.",
    note_nb: "Ett mellomstopp fra Trondheim. Samme-dags ankomst mulig de fleste dager.",
    note_fr: "Une escale depuis Trondheim. Arriv\xE9es le jour m\xEAme possibles la plupart des jours.",
    note_sv: "Ett mellanlandning fr\xE5n Trondheim. Samma-dags ankomst m\xF6jlig de flesta dagar."
  },
  KRS: {
    direct: [],
    typical_stop: ["OSL", "CPH", "AMS"],
    carriers: ["SAS via CPH", "KLM via AMS"],
    note_en: "Typically two stops; consider driving to OSL for better timings.",
    note_nb: "Vanligvis to mellomstopp; vurder kj\xF8ring til OSL for bedre tider.",
    note_fr: "G\xE9n\xE9ralement deux escales ; envisagez de conduire jusqu'\xE0 Oslo pour de meilleurs horaires.",
    note_sv: "Vanligtvis tv\xE5 mellanlandningar; \xF6verv\xE4g att k\xF6ra till Oslo f\xF6r b\xE4ttre avg\xE5ngstider."
  },
  BOO: {
    direct: [],
    typical_stop: ["OSL", "AMS"],
    carriers: ["SAS via OSL/CPH"],
    note_en: "Two stops from Bod\xF8 \u2014 long travel day; we can plan an overnight in Oslo if useful.",
    note_nb: "To mellomstopp fra Bod\xF8 \u2014 lang reisedag; vi kan legge inn overnatting i Oslo om \xF8nskelig.",
    note_fr: "Deux escales depuis Bod\xF8 \u2014 longue journ\xE9e de voyage ; nous pouvons pr\xE9voir une nuit \xE0 Oslo si utile.",
    note_sv: "Tv\xE5 mellanlandningar fr\xE5n Bod\xF8 \u2014 l\xE5ng resesdag; vi kan planera ett \xF6vernattande i Oslo om det \xE4r praktiskt."
  },
  TOS: {
    direct: [],
    typical_stop: ["OSL", "AMS"],
    carriers: ["SAS via OSL/CPH"],
    note_en: "Two stops from Troms\xF8. Best to leave a day early to avoid tight connections.",
    note_nb: "To mellomstopp fra Troms\xF8. Best \xE5 reise en dag tidligere for \xE5 unng\xE5 korte koblinger.",
    note_fr: "Deux escales depuis Troms\xF8. Mieux vaut partir un jour plus t\xF4t pour \xE9viter les correspondances serr\xE9es.",
    note_sv: "Tv\xE5 mellanlandningar fr\xE5n Troms\xF8. B\xE4st att resa en dag tidigare f\xF6r att undvika korta anslutningar."
  },
  TRF: {
    direct: [],
    typical_stop: ["OSL", "AMS"],
    carriers: ["Most via OSL"],
    note_en: "Two stops from Sandefjord. Many travellers drive to OSL instead.",
    note_nb: "To mellomstopp fra Sandefjord. Mange reisende kj\xF8rer heller til OSL.",
    note_fr: "Deux escales depuis Sandefjord. Beaucoup de voyageurs pr\xE9f\xE8rent conduire jusqu'\xE0 Oslo.",
    note_sv: "Tv\xE5 mellanlandningar fr\xE5n Sandefjord. M\xE5nga resen\xE4rer k\xF6r hellre till Oslo."
  }
};
function todayPlus(days) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function formatMonthShort(iso, lang) {
  const d = new Date(iso);
  const monthsNo = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
  const monthsFr = ["janv.", "f\xE9vr.", "mars", "avr.", "mai", "juin", "juil.", "ao\xFBt", "sept.", "oct.", "nov.", "d\xE9c."];
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsSv = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const m = lang === "no" ? monthsNo : lang === "fr" ? monthsFr : lang === "sv" ? monthsSv : monthsEn;
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
}
function aviasalesLink({ origin, destination, outbound, returnDate, adults, currency }) {
  const dd = (iso) => {
    const d = new Date(iso);
    return String(d.getDate()).padStart(2, "0") + String(d.getMonth() + 1).padStart(2, "0");
  };
  const out = dd(outbound);
  const ret = returnDate ? dd(returnDate) : "";
  const path = `${origin}${out}${destination}${ret}${adults}`;
  const params = new URLSearchParams({ marker: TP_MARKER, currency: currency.toLowerCase() });
  return `https://www.aviasales.com/search/${path}?${params.toString()}`;
}
function skyscannerLink({ origin, destination, outbound, returnDate, tripType, adults, children, infants, cabin, locale }) {
  const yymmdd = (iso) => iso.split("-").join("").slice(2);
  const out = yymmdd(outbound);
  const ret = returnDate ? yymmdd(returnDate) : "";
  const path = tripType === "round_trip" ? `flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${out}/${ret}` : `flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${out}`;
  const params = new URLSearchParams({
    adults: String(adults),
    children: String(children),
    infants: String(infants),
    cabinclass: cabin,
    locale: locale === "nb" ? "nb-NO" : locale === "sv" ? "sv-SE" : "en-GB"
  });
  if (SKYSCANNER_ASSOC) params.set("associateid", SKYSCANNER_ASSOC);
  return `https://www.skyscanner.net/transport/${path}/?${params.toString()}`;
}
function kiwiLink({ origin, destination, outbound, returnDate, tripType, adults, children, infants, cabin }) {
  const url = new URL("https://www.kiwi.com/deep");
  url.searchParams.set("from", origin);
  url.searchParams.set("to", destination);
  url.searchParams.set("departure", outbound);
  if (returnDate && tripType === "round_trip") url.searchParams.set("return", returnDate);
  url.searchParams.set("adults", String(adults));
  url.searchParams.set("children", String(children));
  url.searchParams.set("infants", String(infants));
  url.searchParams.set("cabinClass", cabin.toUpperCase());
  url.searchParams.set("currency", "nok");
  return url.toString();
}
function AirportSelect({ value, onChange, options, lang, placeholder }) {
  return /* @__PURE__ */ React.createElement("select", { className: "flight-select", value, onChange: (e) => onChange(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "", disabled: true }, placeholder), options.map((a) => /* @__PURE__ */ React.createElement("option", { key: a.code, value: a.code }, a.city, " \u2014 ", lang === "no" ? a.name_nb : lang === "fr" ? a.name_fr || a.name_en : lang === "sv" ? a.name_sv || a.name_en : a.name_en, " (", a.code, ")")));
}
function PassengerStepper({ label, value, onChange, min = 0, max = 9 }) {
  return /* @__PURE__ */ React.createElement("div", { className: "flight-pax-row" }, /* @__PURE__ */ React.createElement("span", { className: "flight-pax-label" }, label), /* @__PURE__ */ React.createElement("div", { className: "flight-pax-control" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => onChange(Math.max(min, value - 1)), disabled: value <= min, "aria-label": "\u2212" }, "\u2212"), /* @__PURE__ */ React.createElement("span", null, value), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => onChange(Math.min(max, value + 1)), disabled: value >= max, "aria-label": "+" }, "+")));
}
function SeasonalityRow({ origin, destination, lang }) {
  const directRoute = origin === "OSL" && (destination === "RAK" || destination === "AGA");
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsNo = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
  const monthsFr = ["Jan", "F\xE9v", "Mar", "Avr", "Mai", "Jun", "Jul", "Ao\xFB", "Sep", "Oct", "Nov", "D\xE9c"];
  const monthsSv = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
  const months = lang === "no" ? monthsNo : lang === "fr" ? monthsFr : lang === "sv" ? monthsSv : monthsEn;
  const directMonths = [0, 1, 2, 3, 10, 11];
  return /* @__PURE__ */ React.createElement("div", { className: "flight-season-row" }, months.map((m, i) => {
    const cls = directRoute && directMonths.includes(i) ? "direct" : "stop";
    return /* @__PURE__ */ React.createElement("div", { key: i, className: `flight-season-cell ${cls}` }, /* @__PURE__ */ React.createElement("span", null, m));
  }));
}
function Flights() {
  var _a, _b, _c, _d;
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "en";
  const [from, setFrom] = useStateFl("OSL");
  const [to, setTo] = useStateFl("RAK");
  const [reversed, setReversed] = useStateFl(false);
  const [tripType, setTripType] = useStateFl("round_trip");
  const [outbound, setOutbound] = useStateFl(((_a = ctx.dates) == null ? void 0 : _a.dep) || todayPlus(14));
  const [returnDate, setReturnDate] = useStateFl(((_b = ctx.dates) == null ? void 0 : _b.ret) || todayPlus(21));
  const [adults, setAdults] = useStateFl(((_c = ctx.travellers) == null ? void 0 : _c.adults) || 2);
  const [children, setChildren] = useStateFl(((_d = ctx.travellers) == null ? void 0 : _d.children) || 0);
  const [infants, setInfants] = useStateFl(0);
  const [cabin, setCabin] = useStateFl("economy");
  const [currency, setCurrency] = useStateFl(ctx.currency || "NOK");
  const fromList = reversed ? MOROCCAN_AIRPORTS : NORWEGIAN_AIRPORTS;
  const toList = reversed ? NORWEGIAN_AIRPORTS : MOROCCAN_AIRPORTS;
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const swap = () => {
    setReversed((r) => !r);
    if (!reversed) {
      setFrom("RAK");
      setTo("OSL");
    } else {
      setFrom("OSL");
      setTo("RAK");
    }
  };
  const params = {
    origin: from,
    destination: to,
    outbound,
    returnDate: tripType === "round_trip" ? returnDate : void 0,
    tripType,
    adults,
    children,
    infants,
    cabin,
    currency,
    locale: lang === "no" ? "nb" : lang === "sv" ? "sv" : "en"
  };
  const valid = from && to && from !== to && outbound && (tripType === "one_way" || returnDate && returnDate >= outbound) && adults + children <= 9 && infants <= adults;
  const tpUrl = valid ? aviasalesLink(params) : "#";
  const skyUrl = valid ? skyscannerLink(params) : "#";
  const kiwiUrl = valid ? kiwiLink(params) : "#";
  const planWithUs = () => {
    const fromA = fromList.find((a) => a.code === from);
    const toA = toList.find((a) => a.code === to);
    const fromLabel = fromA ? `${fromA.city} (${fromA.code})` : from;
    const toLabel = toA ? `${toA.city} (${toA.code})` : to;
    const totalPax = adults + children + infants;
    const message = tx(
      `Hi Marrakechstory, I'd like help planning flights and a trip. Route: ${fromLabel} \u2192 ${toLabel}. Dates: ${formatMonthShort(outbound, lang)}${tripType === "round_trip" ? ` to ${formatMonthShort(returnDate, lang)}` : ""} (${adults} adults, ${children} children, ${infants} infants). Cabin: ${cabin}. Total: ${totalPax} traveller${totalPax > 1 ? "s" : ""}.`,
      `Hei Marrakechstory, jeg \xF8nsker hjelp til \xE5 planlegge fly og en tur. Rute: ${fromLabel} \u2192 ${toLabel}. Datoer: ${formatMonthShort(outbound, lang)}${tripType === "round_trip" ? ` til ${formatMonthShort(returnDate, lang)}` : ""} (${adults} voksne, ${children} barn, ${infants} spedbarn). Klasse: ${cabin}.`,
      `Bonjour Marrakechstory, je souhaite de l'aide pour planifier un vol et un voyage. Itin\xE9raire : ${fromLabel} \u2192 ${toLabel}. Dates : ${formatMonthShort(outbound, lang)}${tripType === "round_trip" ? ` au ${formatMonthShort(returnDate, lang)}` : ""} (${adults} adultes, ${children} enfants, ${infants} b\xE9b\xE9s). Classe : ${cabin}.`,
      `Hej Marrakechstory, jag vill ha hj\xE4lp med att planera flyg och en resa. Rutt: ${fromLabel} \u2192 ${toLabel}. Datum: ${formatMonthShort(outbound, lang)}${tripType === "round_trip" ? ` till ${formatMonthShort(returnDate, lang)}` : ""} (${adults} vuxna, ${children} barn, ${infants} sp\xE4dbarn). Klass: ${cabin}. Totalt: ${totalPax} resen\xE4r${totalPax > 1 ? "er" : ""}.`
    );
    if (window.MS_Flight_Data !== void 0) {
      window.MS_Flight_Data = { from, to, outbound, returnDate, adults, children, infants, cabin, message };
    }
    if (ctx.setDates) ctx.setDates({ dep: outbound, ret: returnDate });
    if (ctx.setTravellers) ctx.setTravellers({ adults, children, infants });
    const planEl = document.getElementById("plan");
    if (planEl) planEl.scrollIntoView({ behavior: "smooth" });
  };
  const originIntel = ROUTE_INTEL[reversed ? to : from];
  const intelNote = originIntel ? lang === "no" ? originIntel.note_nb : lang === "fr" ? originIntel.note_fr || originIntel.note_en : lang === "sv" ? originIntel.note_sv || originIntel.note_en : originIntel.note_en : null;
  const isDirect = originIntel && originIntel.direct.includes(reversed ? from : to);
  return /* @__PURE__ */ React.createElement("section", { className: "flights-section section", id: "flights" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "section-head reveal", style: { textAlign: "center", margin: "0 auto 48px" } }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, tx("Flights \xB7 Norway \u2194 Morocco", "Fly \xB7 Norge \u2194 Marokko", "Vols \xB7 Norv\xE8ge \u2194 Maroc", "Flyg \xB7 Norge \u2194 Marocko")), /* @__PURE__ */ React.createElement("h2", null, tx("Fly between Norway and ", "Fly mellom Norge og ", "Voler entre la Norv\xE8ge et le ", "Flyg mellan Norge och "), /* @__PURE__ */ React.createElement("em", null, tx("Morocco", "Marokko", "Maroc", "Marocko"))), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 auto" } }, tx(
    "We pull live prices from partner airlines and aggregators. Book directly with them \u2014 or hand the whole trip to us and we plan the flights and the stay together.",
    "Vi henter priser i sanntid fra partnerflyselskaper og s\xF8kemotorer. Bestill direkte hos dem \u2014 eller la oss planlegge fly og opphold sammen.",
    "Nous affichons des prix en temps r\xE9el via nos partenaires. R\xE9servez directement chez eux \u2014 ou confiez-nous l'ensemble du voyage.",
    "Vi h\xE4mtar priser i realtid fr\xE5n partnerflygbolag och s\xF6kmotorer. Boka direkt hos dem \u2014 eller l\xE5t oss planera flyg och boende tillsammans."
  ))), /* @__PURE__ */ React.createElement("div", { className: "flight-form reveal" }, /* @__PURE__ */ React.createElement("div", { className: "flight-form-grid" }, /* @__PURE__ */ React.createElement("div", { className: "flight-field flight-field-from" }, /* @__PURE__ */ React.createElement("label", null, tx("From", "Fra", "De", "Fr\xE5n")), /* @__PURE__ */ React.createElement(
    AirportSelect,
    {
      value: from,
      onChange: setFrom,
      options: fromList,
      lang,
      placeholder: tx("Choose origin", "Velg utgangspunkt", "Choisir origine", "V\xE4lj avg\xE5ngsort")
    }
  )), /* @__PURE__ */ React.createElement("button", { type: "button", className: "flight-swap", onClick: swap, "aria-label": tx("Swap direction", "Bytt retning", "Inverser", "Byt riktning") }, /* @__PURE__ */ React.createElement(Ifl.Arrow, { s: 14 })), /* @__PURE__ */ React.createElement("div", { className: "flight-field flight-field-to" }, /* @__PURE__ */ React.createElement("label", null, tx("To", "Til", "\xC0", "Till")), /* @__PURE__ */ React.createElement(
    AirportSelect,
    {
      value: to,
      onChange: setTo,
      options: toList,
      lang,
      placeholder: tx("Choose destination", "Velg destinasjon", "Choisir destination", "V\xE4lj destination")
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flight-field flight-field-trip" }, /* @__PURE__ */ React.createElement("label", null, tx("Trip", "Tur", "Trajet", "Resa")), /* @__PURE__ */ React.createElement("div", { className: "flight-trip-toggle" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: tripType === "round_trip" ? "active" : "", onClick: () => setTripType("round_trip") }, tx("Round trip", "Tur\u2013retur", "Aller-retour", "Tur/retur")), /* @__PURE__ */ React.createElement("button", { type: "button", className: tripType === "one_way" ? "active" : "", onClick: () => setTripType("one_way") }, tx("One way", "En vei", "Aller simple", "Enkel resa")))), /* @__PURE__ */ React.createElement("div", { className: "flight-field flight-field-out" }, /* @__PURE__ */ React.createElement("label", null, tx("Outbound", "Avreise", "Aller", "Avresa")), /* @__PURE__ */ React.createElement("input", { type: "date", value: outbound, min: todayPlus(0), onChange: (e) => setOutbound(e.target.value) })), tripType === "round_trip" && /* @__PURE__ */ React.createElement("div", { className: "flight-field flight-field-ret" }, /* @__PURE__ */ React.createElement("label", null, tx("Return", "Retur", "Retour", "Retur")), /* @__PURE__ */ React.createElement("input", { type: "date", value: returnDate, min: outbound, onChange: (e) => setReturnDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "flight-field flight-field-pax" }, /* @__PURE__ */ React.createElement("label", null, tx("Passengers", "Passasjerer", "Voyageurs", "Passagerare")), /* @__PURE__ */ React.createElement("details", { className: "flight-pax-details" }, /* @__PURE__ */ React.createElement("summary", null, adults, " ", tx("adult", "voksen", "adulte", "vuxen"), adults > 1 ? lang === "no" ? "e" : lang === "sv" ? "a" : "s" : "", children > 0 && `, ${children} ${tx("child", "barn", "enfant", "barn")}${children > 1 && lang !== "no" && lang !== "sv" ? "s" : ""}`, infants > 0 && `, ${infants} ${tx("infant", "spedbarn", "b\xE9b\xE9", "sp\xE4dbarn")}${infants > 1 && lang !== "no" && lang !== "sv" ? "s" : ""}`), /* @__PURE__ */ React.createElement("div", { className: "flight-pax-panel" }, /* @__PURE__ */ React.createElement(PassengerStepper, { label: tx("Adults (12+)", "Voksne (12+)", "Adultes (12+)", "Vuxna (12+)"), value: adults, onChange: setAdults, min: 1, max: 9 }), /* @__PURE__ */ React.createElement(PassengerStepper, { label: tx("Children (2\u201311)", "Barn (2\u201311)", "Enfants (2\u201311)", "Barn (2\u201311)"), value: children, onChange: setChildren, min: 0, max: 8 }), /* @__PURE__ */ React.createElement(PassengerStepper, { label: tx("Infants (under 2)", "Spedbarn (under 2)", "B\xE9b\xE9s (moins de 2)", "Sp\xE4dbarn (under 2)"), value: infants, onChange: setInfants, min: 0, max: adults })))), /* @__PURE__ */ React.createElement("div", { className: "flight-field flight-field-cabin" }, /* @__PURE__ */ React.createElement("label", null, tx("Cabin", "Klasse", "Classe", "Klass")), /* @__PURE__ */ React.createElement("select", { value: cabin, onChange: (e) => setCabin(e.target.value), className: "flight-select" }, /* @__PURE__ */ React.createElement("option", { value: "economy" }, tx("Economy", "\xD8konomi", "\xC9conomique", "Ekonomi")), /* @__PURE__ */ React.createElement("option", { value: "premium_economy" }, tx("Premium Economy", "Premium \xF8konomi", "Premium \xE9co", "Premium ekonomi")), /* @__PURE__ */ React.createElement("option", { value: "business" }, tx("Business", "Business", "Affaires", "Business")), /* @__PURE__ */ React.createElement("option", { value: "first" }, tx("First", "F\xF8rste", "Premi\xE8re", "F\xF6rsta klass")))), /* @__PURE__ */ React.createElement("div", { className: "flight-field flight-field-cur" }, /* @__PURE__ */ React.createElement("label", null, tx("Currency", "Valuta", "Devise", "Valuta")), /* @__PURE__ */ React.createElement("div", { className: "flight-cur-toggle" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: currency === "NOK" ? "active" : "", onClick: () => setCurrency("NOK") }, "NOK"), /* @__PURE__ */ React.createElement("button", { type: "button", className: currency === "EUR" ? "active" : "", onClick: () => setCurrency("EUR") }, "EUR")))), !valid && /* @__PURE__ */ React.createElement("p", { className: "flight-form-error" }, tx(
    "Please choose a valid Norway \u2194 Morocco route with dates in the future.",
    "Velg en gyldig rute Norge \u2194 Marokko med datoer i fremtiden.",
    "Choisissez un itin\xE9raire Norv\xE8ge \u2194 Maroc valide avec des dates futures.",
    "V\xE4lj en giltig rutt Norge \u2194 Marocko med framtida datum."
  )), /* @__PURE__ */ React.createElement("div", { className: "flight-cta-row" }, /* @__PURE__ */ React.createElement(
    "a",
    {
      className: `btn btn-primary flight-cta ${!valid ? "disabled" : ""}`,
      href: tpUrl,
      target: "_blank",
      rel: "noopener sponsored",
      onClick: (e) => {
        if (!valid) e.preventDefault();
      }
    },
    tx("Search on Aviasales", "S\xF8k p\xE5 Aviasales", "Chercher sur Aviasales", "S\xF6k p\xE5 Aviasales"),
    /* @__PURE__ */ React.createElement(Ifl.Arrow, { s: 14 })
  ), /* @__PURE__ */ React.createElement(
    "a",
    {
      className: `btn btn-outline flight-cta ${!valid ? "disabled" : ""}`,
      href: skyUrl,
      target: "_blank",
      rel: "noopener sponsored",
      onClick: (e) => {
        if (!valid) e.preventDefault();
      }
    },
    tx("Compare on Skyscanner", "Sammenlign p\xE5 Skyscanner", "Comparer sur Skyscanner", "J\xE4mf\xF6r p\xE5 Skyscanner")
  ), /* @__PURE__ */ React.createElement(
    "a",
    {
      className: `btn btn-outline flight-cta ${!valid ? "disabled" : ""}`,
      href: kiwiUrl,
      target: "_blank",
      rel: "noopener sponsored",
      onClick: (e) => {
        if (!valid) e.preventDefault();
      }
    },
    tx("Kiwi.com", "Kiwi.com", "Kiwi.com")
  ), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-text flight-plan", onClick: planWithUs }, tx("Plan with us instead \u2192", "La oss planlegge for deg \u2192", "Confiez-nous la planification \u2192", "L\xE5t oss planera \xE5t dig \u2192")))), originIntel && /* @__PURE__ */ React.createElement("div", { className: "flight-intel reveal" }, /* @__PURE__ */ React.createElement("div", { className: "flight-intel-head" }, /* @__PURE__ */ React.createElement("span", { className: "flight-intel-badge" }, tx("Route insight", "Om ruten", "\xC0 propos de la route", "Om rutten")), /* @__PURE__ */ React.createElement("strong", null, reversed ? to : from, " \u2192 ", reversed ? from : to, isDirect && /* @__PURE__ */ React.createElement("span", { className: "flight-intel-pill direct" }, tx("Direct in season", "Direkte i sesong", "Direct en saison", "Direktflyg i s\xE4song")), !isDirect && /* @__PURE__ */ React.createElement("span", { className: "flight-intel-pill stop" }, tx("Usually 1 stop", "Vanligvis 1 mellomstopp", "Habituellement 1 escale", "Vanligtvis 1 mellanlandning")))), /* @__PURE__ */ React.createElement("p", { className: "flight-intel-note" }, intelNote), /* @__PURE__ */ React.createElement("div", { className: "flight-intel-carriers" }, /* @__PURE__ */ React.createElement("span", { className: "flight-intel-label" }, tx("Typical carriers", "Vanlige flyselskaper", "Compagnies habituelles", "Vanliga flygbolag"), ":"), originIntel.carriers.map((c, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "flight-intel-carrier" }, c))), /* @__PURE__ */ React.createElement("div", { className: "flight-season" }, /* @__PURE__ */ React.createElement("div", { className: "flight-season-title" }, tx("Seasonality", "Sesongkalender", "Saisonnalit\xE9", "S\xE4songskalender")), /* @__PURE__ */ React.createElement(SeasonalityRow, { origin: reversed ? to : from, destination: reversed ? from : to, lang }), /* @__PURE__ */ React.createElement("div", { className: "flight-season-legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "lg lg-direct" }), " ", tx("Direct flights", "Direkte fly", "Vols directs", "Direktflyg")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "lg lg-stop" }), " ", tx("1 stop fastest", "1 stopp raskest", "1 escale plus rapide", "1 mellanlandning snabbast"))))), /* @__PURE__ */ React.createElement("aside", { className: "flight-disclosure reveal" }, /* @__PURE__ */ React.createElement("strong", null, tx("Affiliate disclosure", "Affiliate-erkl\xE6ring", "Information d'affiliation", "Affiliateinformation")), /* @__PURE__ */ React.createElement("p", null, tx(
    "Marrakechstory shows live flight prices via affiliate partners including Aviasales, Skyscanner, and Kiwi.com. When you book through these links, we may receive a commission at no additional cost to you. We are not an airline ticket agent and do not issue tickets or process flight payments; all bookings complete on the partner's site under their terms.",
    "Marrakechstory viser flypriser i sanntid via partnere som Aviasales, Skyscanner og Kiwi.com. N\xE5r du bestiller via disse lenkene, kan vi motta en provisjon uten ekstra kostnad for deg. Vi er ikke en flybillettagent og utsteder ikke billetter eller behandler flybetalinger; alle bestillinger fullf\xF8res p\xE5 partnerens nettsted under deres vilk\xE5r.",
    "Marrakechstory affiche des prix de vols en temps r\xE9el via des partenaires comme Aviasales, Skyscanner et Kiwi.com. En r\xE9servant via ces liens, nous pouvons recevoir une commission sans co\xFBt suppl\xE9mentaire pour vous. Nous ne sommes pas une agence de billetterie a\xE9rienne et n'\xE9mettons ni billets ni paiements de vols ; toutes les r\xE9servations se finalisent sur le site du partenaire.",
    "Marrakechstory visar flygpriser i realtid via affiliatepartners som Aviasales, Skyscanner och Kiwi.com. N\xE4r du bokar via dessa l\xE4nkar kan vi f\xE5 en provision utan extra kostnad f\xF6r dig. Vi \xE4r inte en flygbiljettagent och utf\xE4rdar inte biljetter eller hanterar flygbetalningar; alla bokningar slutf\xF6rs p\xE5 partnerns webbplats enligt deras villkor."
  )))));
}
window.MS_Flights = Flights;
