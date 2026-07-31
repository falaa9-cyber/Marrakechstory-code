// ============================================
// Flights — Norway ↔ Morocco affiliate search
// Hands off to Aviasales (Travelpayouts) and Skyscanner
// via tracked deep links. We never process payments.
// ============================================
const { useState: useStateFl, useMemo: useMemoFl, useEffect: useEffectFl } = React;
const Ifl = window.MS_I;

// Affiliate markers — replace once partner accounts are approved.
// Travelpayouts marker: 5–6 digit ID. Skyscanner associate ID: from impact.com.
const TP_MARKER = "000000";          // TODO: set real Travelpayouts marker
const SKYSCANNER_ASSOC = "";          // TODO: set real Skyscanner associate ID

const NORWEGIAN_AIRPORTS = [
  { code: "OSL", city: "Oslo", name_en: "Oslo Gardermoen", name_nb: "Oslo Gardermoen", name_fr: "Oslo Gardermoen", name_sv: "Oslo Gardermoen" },
  { code: "TRF", city: "Sandefjord", name_en: "Sandefjord Torp", name_nb: "Sandefjord Torp", name_fr: "Sandefjord Torp", name_sv: "Sandefjord Torp" },
  { code: "BGO", city: "Bergen", name_en: "Bergen", name_nb: "Bergen", name_fr: "Bergen", name_sv: "Bergen" },
  { code: "SVG", city: "Stavanger", name_en: "Stavanger Sola", name_nb: "Stavanger Sola", name_fr: "Stavanger Sola", name_sv: "Stavanger Sola" },
  { code: "TRD", city: "Trondheim", name_en: "Trondheim Værnes", name_nb: "Trondheim Værnes", name_fr: "Trondheim Værnes", name_sv: "Trondheim Värnes" },
  { code: "KRS", city: "Kristiansand", name_en: "Kristiansand Kjevik", name_nb: "Kristiansand Kjevik", name_fr: "Kristiansand Kjevik", name_sv: "Kristiansand Kjevik" },
  { code: "BOO", city: "Bodø", name_en: "Bodø", name_nb: "Bodø", name_fr: "Bodø", name_sv: "Bodø" },
  { code: "TOS", city: "Tromsø", name_en: "Tromsø Langnes", name_nb: "Tromsø Langnes", name_fr: "Tromsø Langnes", name_sv: "Tromsø Langnes" },
];

const MOROCCAN_AIRPORTS = [
  { code: "RAK", city: "Marrakech", name_en: "Marrakech Menara", name_nb: "Marrakech Menara", name_fr: "Marrakech Menara", name_sv: "Marrakech Menara" },
  { code: "CMN", city: "Casablanca", name_en: "Casablanca Mohammed V", name_nb: "Casablanca Mohammed V", name_fr: "Casablanca Mohammed V", name_sv: "Casablanca Mohammed V" },
  { code: "AGA", city: "Agadir", name_en: "Agadir Al Massira", name_nb: "Agadir Al Massira", name_fr: "Agadir Al Massira", name_sv: "Agadir Al Massira" },
  { code: "FEZ", city: "Fez", name_en: "Fez Saïs", name_nb: "Fez Saïs", name_fr: "Fès Saïs", name_sv: "Fez Saïs" },
  { code: "TNG", city: "Tangier", name_en: "Tangier Ibn Battouta", name_nb: "Tanger Ibn Battouta", name_fr: "Tanger Ibn Battouta", name_sv: "Tanger Ibn Battouta" },
  { code: "NDR", city: "Nador", name_en: "Nador El Aroui", name_nb: "Nador El Aroui", name_fr: "Nador El Aroui", name_sv: "Nador El Aroui" },
  { code: "OUD", city: "Oujda", name_en: "Oujda Angads", name_nb: "Oujda Angads", name_fr: "Oujda Angads", name_sv: "Oujda Angads" },
  { code: "ESU", city: "Essaouira", name_en: "Essaouira Mogador", name_nb: "Essaouira Mogador", name_fr: "Essaouira Mogador", name_sv: "Essaouira Mogador" },
  { code: "VIL", city: "Dakhla", name_en: "Dakhla", name_nb: "Dakhla", name_fr: "Dakhla", name_sv: "Dakhla" },
];

// Route intelligence — informs the "what to expect" panel and copy
const ROUTE_INTEL = {
  OSL: {
    direct: ["RAK", "AGA"],
    typical_stop: ["AMS", "CDG", "MAD", "CPH", "FRA"],
    carriers: ["Norwegian (DY)", "SAS (SK)", "Royal Air Maroc (AT)", "KLM (KL)", "Air France (AF)"],
    note_en: "Norwegian flies OSL→RAK and OSL→AGA direct, roughly late October to early April. Off-season, expect one stop via Amsterdam, Paris, or Madrid.",
    note_nb: "Norwegian flyr OSL→RAK og OSL→AGA direkte, omtrent fra sen oktober til tidlig april. Utenfor sesong, regn med ett mellomstopp via Amsterdam, Paris eller Madrid.",
    note_fr: "Norwegian assure des vols directs OSL→RAK et OSL→AGA de fin octobre à début avril environ. Hors saison, comptez une escale via Amsterdam, Paris ou Madrid.",
    note_sv: "Norwegian flyger OSL→RAK och OSL→AGA direkt, ungefär från sen oktober till tidig april. Utanför säsong, räkna med ett mellanlandning via Amsterdam, Paris eller Madrid.",
  },
  BGO: {
    direct: [],
    typical_stop: ["AMS", "CDG", "CPH"],
    carriers: ["KLM via AMS", "Air France via CDG", "SAS via CPH"],
    note_en: "Always one stop from Bergen. KLM via Amsterdam usually has the best timing.",
    note_nb: "Alltid ett mellomstopp fra Bergen. KLM via Amsterdam har som regel best timing.",
    note_fr: "Toujours une escale depuis Bergen. KLM via Amsterdam offre généralement les meilleurs horaires.",
    note_sv: "Alltid ett mellanlandning från Bergen. KLM via Amsterdam har vanligtvis bäst tidtabell.",
  },
  SVG: {
    direct: [],
    typical_stop: ["AMS", "CDG"],
    carriers: ["KLM via AMS", "Air France via CDG"],
    note_en: "One stop from Stavanger, typically through Amsterdam.",
    note_nb: "Ett mellomstopp fra Stavanger, vanligvis via Amsterdam.",
    note_fr: "Une escale depuis Stavanger, généralement via Amsterdam.",
    note_sv: "Ett mellanlandning från Stavanger, vanligtvis via Amsterdam.",
  },
  TRD: {
    direct: [],
    typical_stop: ["AMS", "CPH"],
    carriers: ["KLM via AMS", "SAS via CPH"],
    note_en: "One stop from Trondheim. Same-day arrivals possible most days.",
    note_nb: "Ett mellomstopp fra Trondheim. Samme-dags ankomst mulig de fleste dager.",
    note_fr: "Une escale depuis Trondheim. Arrivées le jour même possibles la plupart des jours.",
    note_sv: "Ett mellanlandning från Trondheim. Samma-dags ankomst möjlig de flesta dagar.",
  },
  KRS: { direct: [], typical_stop: ["OSL", "CPH", "AMS"], carriers: ["SAS via CPH", "KLM via AMS"],
    note_en: "Typically two stops; consider driving to OSL for better timings.",
    note_nb: "Vanligvis to mellomstopp; vurder kjøring til OSL for bedre tider.",
    note_fr: "Généralement deux escales ; envisagez de conduire jusqu'à Oslo pour de meilleurs horaires.",
    note_sv: "Vanligtvis två mellanlandningar; överväg att köra till Oslo för bättre avgångstider." },
  BOO: { direct: [], typical_stop: ["OSL", "AMS"], carriers: ["SAS via OSL/CPH"],
    note_en: "Two stops from Bodø — long travel day; we can plan an overnight in Oslo if useful.",
    note_nb: "To mellomstopp fra Bodø — lang reisedag; vi kan legge inn overnatting i Oslo om ønskelig.",
    note_fr: "Deux escales depuis Bodø — longue journée de voyage ; nous pouvons prévoir une nuit à Oslo si utile.",
    note_sv: "Två mellanlandningar från Bodø — lång resesdag; vi kan planera ett övernattande i Oslo om det är praktiskt." },
  TOS: { direct: [], typical_stop: ["OSL", "AMS"], carriers: ["SAS via OSL/CPH"],
    note_en: "Two stops from Tromsø. Best to leave a day early to avoid tight connections.",
    note_nb: "To mellomstopp fra Tromsø. Best å reise en dag tidligere for å unngå korte koblinger.",
    note_fr: "Deux escales depuis Tromsø. Mieux vaut partir un jour plus tôt pour éviter les correspondances serrées.",
    note_sv: "Två mellanlandningar från Tromsø. Bäst att resa en dag tidigare för att undvika korta anslutningar." },
  TRF: { direct: [], typical_stop: ["OSL", "AMS"], carriers: ["Most via OSL"],
    note_en: "Two stops from Sandefjord. Many travellers drive to OSL instead.",
    note_nb: "To mellomstopp fra Sandefjord. Mange reisende kjører heller til OSL.",
    note_fr: "Deux escales depuis Sandefjord. Beaucoup de voyageurs préfèrent conduire jusqu'à Oslo.",
    note_sv: "Två mellanlandningar från Sandefjord. Många resenärer kör hellre till Oslo." },
};

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatMonthShort(iso, lang) {
  const d = new Date(iso);
  const monthsNo = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
  const monthsFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsSv = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const m = lang === 'no' ? monthsNo : lang === 'fr' ? monthsFr : lang === 'sv' ? monthsSv : monthsEn;
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
}

// Aviasales deep link — pattern from Travelpayouts docs.
// Format: /search/{ORIGIN}{DDMM}{DEST}{DDMM_return}{ADULTS}?marker={MARKER}
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

// Skyscanner deep link — works without API approval for deep referral.
function skyscannerLink({ origin, destination, outbound, returnDate, tripType, adults, children, infants, cabin, locale }) {
  const yymmdd = (iso) => iso.split("-").join("").slice(2);
  const out = yymmdd(outbound);
  const ret = returnDate ? yymmdd(returnDate) : "";
  const path = tripType === "round_trip"
    ? `flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${out}/${ret}`
    : `flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${out}`;
  const params = new URLSearchParams({
    adults: String(adults),
    children: String(children),
    infants: String(infants),
    cabinclass: cabin,
    locale: locale === "nb" ? "nb-NO" : locale === "sv" ? "sv-SE" : "en-GB",
  });
  if (SKYSCANNER_ASSOC) params.set("associateid", SKYSCANNER_ASSOC);
  return `https://www.skyscanner.net/transport/${path}/?${params.toString()}`;
}

// Kiwi.com deep link — open search-results page with affiliate parameter.
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
  return (
    <select className="flight-select" value={value} onChange={e => onChange(e.target.value)}>
      <option value="" disabled>{placeholder}</option>
      {options.map(a => (
        <option key={a.code} value={a.code}>
          {a.city} — {lang === 'no' ? a.name_nb : lang === 'fr' ? (a.name_fr || a.name_en) : lang === 'sv' ? (a.name_sv || a.name_en) : a.name_en} ({a.code})
        </option>
      ))}
    </select>
  );
}

function PassengerStepper({ label, value, onChange, min = 0, max = 9 }) {
  return (
    <div className="flight-pax-row">
      <span className="flight-pax-label">{label}</span>
      <div className="flight-pax-control">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="−">−</button>
        <span>{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="+">+</button>
      </div>
    </div>
  );
}

function SeasonalityRow({ origin, destination, lang }) {
  // 12-month strip — green = direct in season, terracotta = 1-stop fastest, ink = longer routings.
  // Currently only OSL→RAK / OSL→AGA have a direct season (late Oct – early Apr).
  const directRoute = (origin === "OSL" && (destination === "RAK" || destination === "AGA"));
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsNo = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
  const monthsFr = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const monthsSv = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
  const months = lang === 'no' ? monthsNo : lang === 'fr' ? monthsFr : lang === 'sv' ? monthsSv : monthsEn;
  // 0 = Jan ... 11 = Dec. Direct season is Nov(10), Dec(11), Jan(0), Feb(1), Mar(2), Apr(3).
  const directMonths = [0, 1, 2, 3, 10, 11];
  return (
    <div className="flight-season-row">
      {months.map((m, i) => {
        const cls = directRoute && directMonths.includes(i) ? "direct" : "stop";
        return <div key={i} className={`flight-season-cell ${cls}`}><span>{m}</span></div>;
      })}
    </div>
  );
}

function Flights() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'en';

  const [from, setFrom] = useStateFl("OSL");
  const [to, setTo] = useStateFl("RAK");
  const [reversed, setReversed] = useStateFl(false);   // when true: Morocco → Norway
  const [tripType, setTripType] = useStateFl("round_trip");
  const [outbound, setOutbound] = useStateFl(ctx.dates?.dep || todayPlus(14));
  const [returnDate, setReturnDate] = useStateFl(ctx.dates?.ret || todayPlus(21));
  const [adults, setAdults] = useStateFl(ctx.travellers?.adults || 2);
  const [children, setChildren] = useStateFl(ctx.travellers?.children || 0);
  const [infants, setInfants] = useStateFl(0);
  const [cabin, setCabin] = useStateFl("economy");
  const [currency, setCurrency] = useStateFl(ctx.currency || "NOK");

  const fromList = reversed ? MOROCCAN_AIRPORTS : NORWEGIAN_AIRPORTS;
  const toList = reversed ? NORWEGIAN_AIRPORTS : MOROCCAN_AIRPORTS;

  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : lang === 'da' ? (no || en) : en;

  const swap = () => {
    setReversed(r => !r);
    // After swap, reset the dropdowns to a default valid pair
    if (!reversed) { setFrom("RAK"); setTo("OSL"); }
    else { setFrom("OSL"); setTo("RAK"); }
  };

  const params = {
    origin: from,
    destination: to,
    outbound,
    returnDate: tripType === "round_trip" ? returnDate : undefined,
    tripType,
    adults,
    children,
    infants,
    cabin,
    currency,
    locale: lang === 'no' ? 'nb' : lang === 'sv' ? 'sv' : 'en',
  };

  const valid = from && to && from !== to && outbound &&
    (tripType === "one_way" || (returnDate && returnDate >= outbound)) &&
    (adults + children) <= 9 && (infants <= adults);

  const tpUrl = valid ? aviasalesLink(params) : "#";
  const skyUrl = valid ? skyscannerLink(params) : "#";
  const kiwiUrl = valid ? kiwiLink(params) : "#";

  const planWithUs = () => {
    const fromA = fromList.find(a => a.code === from);
    const toA = toList.find(a => a.code === to);
    const fromLabel = fromA ? `${fromA.city} (${fromA.code})` : from;
    const toLabel = toA ? `${toA.city} (${toA.code})` : to;
    const totalPax = adults + children + infants;
    const message = tx(
      `Hi Marrakechstory, I'd like help planning flights and a trip. Route: ${fromLabel} → ${toLabel}. Dates: ${formatMonthShort(outbound, lang)}${tripType === 'round_trip' ? ` to ${formatMonthShort(returnDate, lang)}` : ''} (${adults} adults, ${children} children, ${infants} infants). Cabin: ${cabin}. Total: ${totalPax} traveller${totalPax > 1 ? 's' : ''}.`,
      `Hei Marrakechstory, jeg ønsker hjelp til å planlegge fly og en tur. Rute: ${fromLabel} → ${toLabel}. Datoer: ${formatMonthShort(outbound, lang)}${tripType === 'round_trip' ? ` til ${formatMonthShort(returnDate, lang)}` : ''} (${adults} voksne, ${children} barn, ${infants} spedbarn). Klasse: ${cabin}.`,
      `Bonjour Marrakechstory, je souhaite de l'aide pour planifier un vol et un voyage. Itinéraire : ${fromLabel} → ${toLabel}. Dates : ${formatMonthShort(outbound, lang)}${tripType === 'round_trip' ? ` au ${formatMonthShort(returnDate, lang)}` : ''} (${adults} adultes, ${children} enfants, ${infants} bébés). Classe : ${cabin}.`,
      `Hej Marrakechstory, jag vill ha hjälp med att planera flyg och en resa. Rutt: ${fromLabel} → ${toLabel}. Datum: ${formatMonthShort(outbound, lang)}${tripType === 'round_trip' ? ` till ${formatMonthShort(returnDate, lang)}` : ''} (${adults} vuxna, ${children} barn, ${infants} spädbarn). Klass: ${cabin}. Totalt: ${totalPax} resenär${totalPax > 1 ? 'er' : ''}.`
    );
    // Hand off to existing form / WhatsApp via global
    if (window.MS_Flight_Data !== undefined) {
      window.MS_Flight_Data = { from, to, outbound, returnDate, adults, children, infants, cabin, message };
    }
    if (ctx.setDates) ctx.setDates({ dep: outbound, ret: returnDate });
    if (ctx.setTravellers) ctx.setTravellers({ adults, children, infants });
    const planEl = document.getElementById('plan');
    if (planEl) planEl.scrollIntoView({ behavior: 'smooth' });
  };

  const originIntel = ROUTE_INTEL[reversed ? to : from];
  const intelNote = originIntel
    ? (lang === 'no' ? originIntel.note_nb : lang === 'fr' ? (originIntel.note_fr || originIntel.note_en) : lang === 'sv' ? (originIntel.note_sv || originIntel.note_en) : originIntel.note_en)
    : null;
  const isDirect = originIntel && originIntel.direct.includes(reversed ? from : to);

  return (
    <section className="flights-section section" id="flights">
      <div className="wrap">
        <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
          <span className="eyebrow">{tx('Flights · Norway ↔ Morocco', 'Fly · Norge ↔ Marokko', 'Vols · Norvège ↔ Maroc', 'Flyg · Norge ↔ Marocko')}</span>
          <h2>{tx('Fly between Norway and ', 'Fly mellom Norge og ', 'Voler entre la Norvège et le ', 'Flyg mellan Norge och ')}<em>{tx('Morocco', 'Marokko', 'Maroc', 'Marocko')}</em></h2>
          <p style={{ margin: '0 auto' }}>
            {tx(
              'We pull live prices from partner airlines and aggregators. Book directly with them — or hand the whole trip to us and we plan the flights and the stay together.',
              'Vi henter priser i sanntid fra partnerflyselskaper og søkemotorer. Bestill direkte hos dem — eller la oss planlegge fly og opphold sammen.',
              'Nous affichons des prix en temps réel via nos partenaires. Réservez directement chez eux — ou confiez-nous l\'ensemble du voyage.',
              'Vi hämtar priser i realtid från partnerflygbolag och sökmotorer. Boka direkt hos dem — eller låt oss planera flyg och boende tillsammans.'
            )}
          </p>
        </div>

        <div className="flight-form reveal">
          <div className="flight-form-grid">
            <div className="flight-field flight-field-from">
              <label>{tx('From', 'Fra', 'De', 'Från')}</label>
              <AirportSelect value={from} onChange={setFrom} options={fromList} lang={lang}
                placeholder={tx('Choose origin', 'Velg utgangspunkt', 'Choisir origine', 'Välj avgångsort')} />
            </div>
            <button type="button" className="flight-swap" onClick={swap} aria-label={tx('Swap direction', 'Bytt retning', 'Inverser', 'Byt riktning')}>
              <Ifl.Arrow s={14} />
            </button>
            <div className="flight-field flight-field-to">
              <label>{tx('To', 'Til', 'À', 'Till')}</label>
              <AirportSelect value={to} onChange={setTo} options={toList} lang={lang}
                placeholder={tx('Choose destination', 'Velg destinasjon', 'Choisir destination', 'Välj destination')} />
            </div>

            <div className="flight-field flight-field-trip">
              <label>{tx('Trip', 'Tur', 'Trajet', 'Resa')}</label>
              <div className="flight-trip-toggle">
                <button type="button" className={tripType === 'round_trip' ? 'active' : ''} onClick={() => setTripType('round_trip')}>
                  {tx('Round trip', 'Tur–retur', 'Aller-retour', 'Tur/retur')}
                </button>
                <button type="button" className={tripType === 'one_way' ? 'active' : ''} onClick={() => setTripType('one_way')}>
                  {tx('One way', 'En vei', 'Aller simple', 'Enkel resa')}
                </button>
              </div>
            </div>

            <div className="flight-field flight-field-out">
              <label>{tx('Outbound', 'Avreise', 'Aller', 'Avresa')}</label>
              <input type="date" value={outbound} min={todayPlus(0)} onChange={e => setOutbound(e.target.value)} />
            </div>

            {tripType === 'round_trip' && (
              <div className="flight-field flight-field-ret">
                <label>{tx('Return', 'Retur', 'Retour', 'Retur')}</label>
                <input type="date" value={returnDate} min={outbound} onChange={e => setReturnDate(e.target.value)} />
              </div>
            )}

            <div className="flight-field flight-field-pax">
              <label>{tx('Passengers', 'Passasjerer', 'Voyageurs', 'Passagerare')}</label>
              <details className="flight-pax-details">
                <summary>
                  {adults} {tx('adult', 'voksen', 'adulte', 'vuxen')}{adults > 1 ? (lang === 'no' ? 'e' : lang === 'sv' ? 'a' : 's') : ''}
                  {children > 0 && `, ${children} ${tx('child', 'barn', 'enfant', 'barn')}${children > 1 && lang !== 'no' && lang !== 'sv' ? 's' : ''}`}
                  {infants > 0 && `, ${infants} ${tx('infant', 'spedbarn', 'bébé', 'spädbarn')}${infants > 1 && lang !== 'no' && lang !== 'sv' ? 's' : ''}`}
                </summary>
                <div className="flight-pax-panel">
                  <PassengerStepper label={tx('Adults (12+)', 'Voksne (12+)', 'Adultes (12+)', 'Vuxna (12+)')} value={adults} onChange={setAdults} min={1} max={9} />
                  <PassengerStepper label={tx('Children (2–11)', 'Barn (2–11)', 'Enfants (2–11)', 'Barn (2–11)')} value={children} onChange={setChildren} min={0} max={8} />
                  <PassengerStepper label={tx('Infants (under 2)', 'Spedbarn (under 2)', 'Bébés (moins de 2)', 'Spädbarn (under 2)')} value={infants} onChange={setInfants} min={0} max={adults} />
                </div>
              </details>
            </div>

            <div className="flight-field flight-field-cabin">
              <label>{tx('Cabin', 'Klasse', 'Classe', 'Klass')}</label>
              <select value={cabin} onChange={e => setCabin(e.target.value)} className="flight-select">
                <option value="economy">{tx('Economy', 'Økonomi', 'Économique', 'Ekonomi')}</option>
                <option value="premium_economy">{tx('Premium Economy', 'Premium økonomi', 'Premium éco', 'Premium ekonomi')}</option>
                <option value="business">{tx('Business', 'Business', 'Affaires', 'Business')}</option>
                <option value="first">{tx('First', 'Første', 'Première', 'Första klass')}</option>
              </select>
            </div>

            <div className="flight-field flight-field-cur">
              <label>{tx('Currency', 'Valuta', 'Devise', 'Valuta')}</label>
              <div className="flight-cur-toggle">
                <button type="button" className={currency === 'NOK' ? 'active' : ''} onClick={() => setCurrency('NOK')}>NOK</button>
                <button type="button" className={currency === 'EUR' ? 'active' : ''} onClick={() => setCurrency('EUR')}>EUR</button>
              </div>
            </div>
          </div>

          {!valid && (
            <p className="flight-form-error">
              {tx(
                'Please choose a valid Norway ↔ Morocco route with dates in the future.',
                'Velg en gyldig rute Norge ↔ Marokko med datoer i fremtiden.',
                'Choisissez un itinéraire Norvège ↔ Maroc valide avec des dates futures.',
                'Välj en giltig rutt Norge ↔ Marocko med framtida datum.'
              )}
            </p>
          )}

          <div className="flight-cta-row">
            <a className={`btn btn-primary flight-cta ${!valid ? 'disabled' : ''}`}
               href={tpUrl} target="_blank" rel="noopener sponsored"
               onClick={e => { if (!valid) e.preventDefault(); }}>
              {tx('Search on Aviasales', 'Søk på Aviasales', 'Chercher sur Aviasales', 'Sök på Aviasales')}
              <Ifl.Arrow s={14} />
            </a>
            <a className={`btn btn-outline flight-cta ${!valid ? 'disabled' : ''}`}
               href={skyUrl} target="_blank" rel="noopener sponsored"
               onClick={e => { if (!valid) e.preventDefault(); }}>
              {tx('Compare on Skyscanner', 'Sammenlign på Skyscanner', 'Comparer sur Skyscanner', 'Jämför på Skyscanner')}
            </a>
            <a className={`btn btn-outline flight-cta ${!valid ? 'disabled' : ''}`}
               href={kiwiUrl} target="_blank" rel="noopener sponsored"
               onClick={e => { if (!valid) e.preventDefault(); }}>
              {tx('Kiwi.com', 'Kiwi.com', 'Kiwi.com')}
            </a>
            <button type="button" className="btn btn-text flight-plan" onClick={planWithUs}>
              {tx('Plan with us instead →', 'La oss planlegge for deg →', 'Confiez-nous la planification →', 'Låt oss planera åt dig →')}
            </button>
          </div>
        </div>

        {/* Route intelligence panel */}
        {originIntel && (
          <div className="flight-intel reveal">
            <div className="flight-intel-head">
              <span className="flight-intel-badge">{tx('Route insight', 'Om ruten', 'À propos de la route', 'Om rutten')}</span>
              <strong>
                {(reversed ? to : from)} → {reversed ? from : to}
                {isDirect && (
                  <span className="flight-intel-pill direct">
                    {tx('Direct in season', 'Direkte i sesong', 'Direct en saison', 'Direktflyg i säsong')}
                  </span>
                )}
                {!isDirect && (
                  <span className="flight-intel-pill stop">
                    {tx('Usually 1 stop', 'Vanligvis 1 mellomstopp', 'Habituellement 1 escale', 'Vanligtvis 1 mellanlandning')}
                  </span>
                )}
              </strong>
            </div>
            <p className="flight-intel-note">{intelNote}</p>
            <div className="flight-intel-carriers">
              <span className="flight-intel-label">{tx('Typical carriers', 'Vanlige flyselskaper', 'Compagnies habituelles', 'Vanliga flygbolag')}:</span>
              {originIntel.carriers.map((c, i) => <span key={i} className="flight-intel-carrier">{c}</span>)}
            </div>

            <div className="flight-season">
              <div className="flight-season-title">
                {tx('Seasonality', 'Sesongkalender', 'Saisonnalité', 'Säsongskalender')}
              </div>
              <SeasonalityRow origin={reversed ? to : from} destination={reversed ? from : to} lang={lang} />
              <div className="flight-season-legend">
                <span><i className="lg lg-direct"></i> {tx('Direct flights', 'Direkte fly', 'Vols directs', 'Direktflyg')}</span>
                <span><i className="lg lg-stop"></i> {tx('1 stop fastest', '1 stopp raskest', '1 escale plus rapide', '1 mellanlandning snabbast')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Affiliate disclosure — mandatory */}
        <aside className="flight-disclosure reveal">
          <strong>{tx('Affiliate disclosure', 'Affiliate-erklæring', 'Information d\'affiliation', 'Affiliateinformation')}</strong>
          <p>
            {tx(
              'Marrakechstory shows live flight prices via affiliate partners including Aviasales, Skyscanner, and Kiwi.com. When you book through these links, we may receive a commission at no additional cost to you. We are not an airline ticket agent and do not issue tickets or process flight payments; all bookings complete on the partner\'s site under their terms.',
              'Marrakechstory viser flypriser i sanntid via partnere som Aviasales, Skyscanner og Kiwi.com. Når du bestiller via disse lenkene, kan vi motta en provisjon uten ekstra kostnad for deg. Vi er ikke en flybillettagent og utsteder ikke billetter eller behandler flybetalinger; alle bestillinger fullføres på partnerens nettsted under deres vilkår.',
              'Marrakechstory affiche des prix de vols en temps réel via des partenaires comme Aviasales, Skyscanner et Kiwi.com. En réservant via ces liens, nous pouvons recevoir une commission sans coût supplémentaire pour vous. Nous ne sommes pas une agence de billetterie aérienne et n\'émettons ni billets ni paiements de vols ; toutes les réservations se finalisent sur le site du partenaire.',
              'Marrakechstory visar flygpriser i realtid via affiliatepartners som Aviasales, Skyscanner och Kiwi.com. När du bokar via dessa länkar kan vi få en provision utan extra kostnad för dig. Vi är inte en flygbiljettagent och utfärdar inte biljetter eller hanterar flygbetalningar; alla bokningar slutförs på partnerns webbplats enligt deras villkor.'
            )}
          </p>
        </aside>
      </div>
    </section>
  );
}

window.MS_Flights = Flights;
