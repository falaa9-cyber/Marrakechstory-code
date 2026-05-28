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
  { code: "OSL", city: "Oslo", name_en: "Oslo Gardermoen", name_nb: "Oslo Gardermoen" },
  { code: "TRF", city: "Sandefjord", name_en: "Sandefjord Torp", name_nb: "Sandefjord Torp" },
  { code: "BGO", city: "Bergen", name_en: "Bergen", name_nb: "Bergen" },
  { code: "SVG", city: "Stavanger", name_en: "Stavanger Sola", name_nb: "Stavanger Sola" },
  { code: "TRD", city: "Trondheim", name_en: "Trondheim Værnes", name_nb: "Trondheim Værnes" },
  { code: "KRS", city: "Kristiansand", name_en: "Kristiansand Kjevik", name_nb: "Kristiansand Kjevik" },
  { code: "BOO", city: "Bodø", name_en: "Bodø", name_nb: "Bodø" },
  { code: "TOS", city: "Tromsø", name_en: "Tromsø Langnes", name_nb: "Tromsø Langnes" },
];

const MOROCCAN_AIRPORTS = [
  { code: "RAK", city: "Marrakech", name_en: "Marrakech Menara", name_nb: "Marrakech Menara" },
  { code: "CMN", city: "Casablanca", name_en: "Casablanca Mohammed V", name_nb: "Casablanca Mohammed V" },
  { code: "AGA", city: "Agadir", name_en: "Agadir Al Massira", name_nb: "Agadir Al Massira" },
  { code: "FEZ", city: "Fez", name_en: "Fez Saïs", name_nb: "Fez Saïs" },
  { code: "TNG", city: "Tangier", name_en: "Tangier Ibn Battouta", name_nb: "Tanger Ibn Battouta" },
  { code: "NDR", city: "Nador", name_en: "Nador El Aroui", name_nb: "Nador El Aroui" },
  { code: "OUD", city: "Oujda", name_en: "Oujda Angads", name_nb: "Oujda Angads" },
  { code: "ESU", city: "Essaouira", name_en: "Essaouira Mogador", name_nb: "Essaouira Mogador" },
  { code: "VIL", city: "Dakhla", name_en: "Dakhla", name_nb: "Dakhla" },
];

// Route intelligence — informs the "what to expect" panel and copy
const ROUTE_INTEL = {
  OSL: {
    direct: ["RAK", "AGA"],
    typical_stop: ["AMS", "CDG", "MAD", "CPH", "FRA"],
    carriers: ["Norwegian (DY)", "SAS (SK)", "Royal Air Maroc (AT)", "KLM (KL)", "Air France (AF)"],
    note_en: "Norwegian flies OSL→RAK and OSL→AGA direct, roughly late October to early April. Off-season, expect one stop via Amsterdam, Paris, or Madrid.",
    note_nb: "Norwegian flyr OSL→RAK og OSL→AGA direkte, omtrent fra sen oktober til tidlig april. Utenfor sesong, regn med ett mellomstopp via Amsterdam, Paris eller Madrid.",
  },
  BGO: {
    direct: [],
    typical_stop: ["AMS", "CDG", "CPH"],
    carriers: ["KLM via AMS", "Air France via CDG", "SAS via CPH"],
    note_en: "Always one stop from Bergen. KLM via Amsterdam usually has the best timing.",
    note_nb: "Alltid ett mellomstopp fra Bergen. KLM via Amsterdam har som regel best timing.",
  },
  SVG: {
    direct: [],
    typical_stop: ["AMS", "CDG"],
    carriers: ["KLM via AMS", "Air France via CDG"],
    note_en: "One stop from Stavanger, typically through Amsterdam.",
    note_nb: "Ett mellomstopp fra Stavanger, vanligvis via Amsterdam.",
  },
  TRD: {
    direct: [],
    typical_stop: ["AMS", "CPH"],
    carriers: ["KLM via AMS", "SAS via CPH"],
    note_en: "One stop from Trondheim. Same-day arrivals possible most days.",
    note_nb: "Ett mellomstopp fra Trondheim. Samme-dags ankomst mulig de fleste dager.",
  },
  KRS: { direct: [], typical_stop: ["OSL", "CPH", "AMS"], carriers: ["SAS via CPH", "KLM via AMS"],
    note_en: "Typically two stops; consider driving to OSL for better timings.",
    note_nb: "Vanligvis to mellomstopp; vurder kjøring til OSL for bedre tider." },
  BOO: { direct: [], typical_stop: ["OSL", "AMS"], carriers: ["SAS via OSL/CPH"],
    note_en: "Two stops from Bodø — long travel day; we can plan an overnight in Oslo if useful.",
    note_nb: "To mellomstopp fra Bodø — lang reisedag; vi kan legge inn overnatting i Oslo om ønskelig." },
  TOS: { direct: [], typical_stop: ["OSL", "AMS"], carriers: ["SAS via OSL/CPH"],
    note_en: "Two stops from Tromsø. Best to leave a day early to avoid tight connections.",
    note_nb: "To mellomstopp fra Tromsø. Best å reise en dag tidligere for å unngå korte koblinger." },
  TRF: { direct: [], typical_stop: ["OSL", "AMS"], carriers: ["Most via OSL"],
    note_en: "Two stops from Sandefjord. Many travellers drive to OSL instead.",
    note_nb: "To mellomstopp fra Sandefjord. Mange reisende kjører heller til OSL." },
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
  const m = lang === 'no' ? monthsNo : lang === 'fr' ? monthsFr : monthsEn;
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
  const yymmdd = (iso) => iso.replaceAll("-", "").slice(2);
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
    locale: locale === "nb" ? "nb-NO" : "en-GB",
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
          {a.city} — {lang === 'no' ? a.name_nb : a.name_en} ({a.code})
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
  const months = lang === 'no' ? monthsNo : lang === 'fr' ? monthsFr : monthsEn;
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

  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : en;

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
    locale: lang === 'no' ? 'nb' : 'en',
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
      `Hi Marrakech Story, I'd like help planning flights and a trip. Route: ${fromLabel} → ${toLabel}. Dates: ${formatMonthShort(outbound, lang)}${tripType === 'round_trip' ? ` to ${formatMonthShort(returnDate, lang)}` : ''} (${adults} adults, ${children} children, ${infants} infants). Cabin: ${cabin}. Total: ${totalPax} traveller${totalPax > 1 ? 's' : ''}.`,
      `Hei Marrakech Story, jeg ønsker hjelp til å planlegge fly og en tur. Rute: ${fromLabel} → ${toLabel}. Datoer: ${formatMonthShort(outbound, lang)}${tripType === 'round_trip' ? ` til ${formatMonthShort(returnDate, lang)}` : ''} (${adults} voksne, ${children} barn, ${infants} spedbarn). Klasse: ${cabin}.`,
      `Bonjour Marrakech Story, je souhaite de l'aide pour planifier un vol et un voyage. Itinéraire : ${fromLabel} → ${toLabel}. Dates : ${formatMonthShort(outbound, lang)}${tripType === 'round_trip' ? ` au ${formatMonthShort(returnDate, lang)}` : ''} (${adults} adultes, ${children} enfants, ${infants} bébés). Classe : ${cabin}.`
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
  const intelNote = originIntel ? (lang === 'no' ? originIntel.note_nb : originIntel.note_en) : null;
  const isDirect = originIntel && originIntel.direct.includes(reversed ? from : to);

  return (
    <section className="flights-section section" id="flights">
      <div className="wrap">
        <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
          <span className="eyebrow">{tx('Flights · Norway ↔ Morocco', 'Fly · Norge ↔ Marokko', 'Vols · Norvège ↔ Maroc')}</span>
          <h2>{tx('Fly between Norway and ', 'Fly mellom Norge og ', 'Voler entre la Norvège et le ')}<em>{tx('Morocco', 'Marokko', 'Maroc')}</em></h2>
          <p style={{ margin: '0 auto' }}>
            {tx(
              'We pull live prices from partner airlines and aggregators. Book directly with them — or hand the whole trip to us and we plan the flights and the stay together.',
              'Vi henter priser i sanntid fra partnerflyselskaper og søkemotorer. Bestill direkte hos dem — eller la oss planlegge fly og opphold sammen.',
              'Nous affichons des prix en temps réel via nos partenaires. Réservez directement chez eux — ou confiez-nous l\'ensemble du voyage.'
            )}
          </p>
        </div>

        <div className="flight-form reveal">
          <div className="flight-form-grid">
            <div className="flight-field flight-field-from">
              <label>{tx('From', 'Fra', 'De')}</label>
              <AirportSelect value={from} onChange={setFrom} options={fromList} lang={lang}
                placeholder={tx('Choose origin', 'Velg utgangspunkt', 'Choisir origine')} />
            </div>
            <button type="button" className="flight-swap" onClick={swap} aria-label={tx('Swap direction', 'Bytt retning', 'Inverser')}>
              <Ifl.Arrow s={14} />
            </button>
            <div className="flight-field flight-field-to">
              <label>{tx('To', 'Til', 'À')}</label>
              <AirportSelect value={to} onChange={setTo} options={toList} lang={lang}
                placeholder={tx('Choose destination', 'Velg destinasjon', 'Choisir destination')} />
            </div>

            <div className="flight-field flight-field-trip">
              <label>{tx('Trip', 'Tur', 'Trajet')}</label>
              <div className="flight-trip-toggle">
                <button type="button" className={tripType === 'round_trip' ? 'active' : ''} onClick={() => setTripType('round_trip')}>
                  {tx('Round trip', 'Tur–retur', 'Aller-retour')}
                </button>
                <button type="button" className={tripType === 'one_way' ? 'active' : ''} onClick={() => setTripType('one_way')}>
                  {tx('One way', 'En vei', 'Aller simple')}
                </button>
              </div>
            </div>

            <div className="flight-field flight-field-out">
              <label>{tx('Outbound', 'Avreise', 'Aller')}</label>
              <input type="date" value={outbound} min={todayPlus(0)} onChange={e => setOutbound(e.target.value)} />
            </div>

            {tripType === 'round_trip' && (
              <div className="flight-field flight-field-ret">
                <label>{tx('Return', 'Retur', 'Retour')}</label>
                <input type="date" value={returnDate} min={outbound} onChange={e => setReturnDate(e.target.value)} />
              </div>
            )}

            <div className="flight-field flight-field-pax">
              <label>{tx('Passengers', 'Passasjerer', 'Voyageurs')}</label>
              <details className="flight-pax-details">
                <summary>
                  {adults} {tx('adult', 'voksen', 'adulte')}{adults > 1 ? (lang === 'no' ? 'e' : 's') : ''}
                  {children > 0 && `, ${children} ${tx('child', 'barn', 'enfant')}${children > 1 && lang !== 'no' ? 's' : ''}`}
                  {infants > 0 && `, ${infants} ${tx('infant', 'spedbarn', 'bébé')}${infants > 1 && lang !== 'no' ? 's' : ''}`}
                </summary>
                <div className="flight-pax-panel">
                  <PassengerStepper label={tx('Adults (12+)', 'Voksne (12+)', 'Adultes (12+)')} value={adults} onChange={setAdults} min={1} max={9} />
                  <PassengerStepper label={tx('Children (2–11)', 'Barn (2–11)', 'Enfants (2–11)')} value={children} onChange={setChildren} min={0} max={8} />
                  <PassengerStepper label={tx('Infants (under 2)', 'Spedbarn (under 2)', 'Bébés (moins de 2)')} value={infants} onChange={setInfants} min={0} max={adults} />
                </div>
              </details>
            </div>

            <div className="flight-field flight-field-cabin">
              <label>{tx('Cabin', 'Klasse', 'Classe')}</label>
              <select value={cabin} onChange={e => setCabin(e.target.value)} className="flight-select">
                <option value="economy">{tx('Economy', 'Økonomi', 'Économique')}</option>
                <option value="premium_economy">{tx('Premium Economy', 'Premium økonomi', 'Premium éco')}</option>
                <option value="business">{tx('Business', 'Business', 'Affaires')}</option>
                <option value="first">{tx('First', 'Første', 'Première')}</option>
              </select>
            </div>

            <div className="flight-field flight-field-cur">
              <label>{tx('Currency', 'Valuta', 'Devise')}</label>
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
                'Choisissez un itinéraire Norvège ↔ Maroc valide avec des dates futures.'
              )}
            </p>
          )}

          <div className="flight-cta-row">
            <a className={`btn btn-primary flight-cta ${!valid ? 'disabled' : ''}`}
               href={tpUrl} target="_blank" rel="noopener sponsored"
               onClick={e => { if (!valid) e.preventDefault(); }}>
              {tx('Search on Aviasales', 'Søk på Aviasales', 'Chercher sur Aviasales')}
              <Ifl.Arrow s={14} />
            </a>
            <a className={`btn btn-outline flight-cta ${!valid ? 'disabled' : ''}`}
               href={skyUrl} target="_blank" rel="noopener sponsored"
               onClick={e => { if (!valid) e.preventDefault(); }}>
              {tx('Compare on Skyscanner', 'Sammenlign på Skyscanner', 'Comparer sur Skyscanner')}
            </a>
            <a className={`btn btn-outline flight-cta ${!valid ? 'disabled' : ''}`}
               href={kiwiUrl} target="_blank" rel="noopener sponsored"
               onClick={e => { if (!valid) e.preventDefault(); }}>
              {tx('Kiwi.com', 'Kiwi.com', 'Kiwi.com')}
            </a>
            <button type="button" className="btn btn-text flight-plan" onClick={planWithUs}>
              {tx('Plan with us instead →', 'La oss planlegge for deg →', 'Confiez-nous la planification →')}
            </button>
          </div>
        </div>

        {/* Route intelligence panel */}
        {originIntel && (
          <div className="flight-intel reveal">
            <div className="flight-intel-head">
              <span className="flight-intel-badge">{tx('Route insight', 'Om ruten', 'À propos de la route')}</span>
              <strong>
                {(reversed ? to : from)} → {reversed ? from : to}
                {isDirect && (
                  <span className="flight-intel-pill direct">
                    {tx('Direct in season', 'Direkte i sesong', 'Direct en saison')}
                  </span>
                )}
                {!isDirect && (
                  <span className="flight-intel-pill stop">
                    {tx('Usually 1 stop', 'Vanligvis 1 mellomstopp', 'Habituellement 1 escale')}
                  </span>
                )}
              </strong>
            </div>
            <p className="flight-intel-note">{intelNote}</p>
            <div className="flight-intel-carriers">
              <span className="flight-intel-label">{tx('Typical carriers', 'Vanlige flyselskaper', 'Compagnies habituelles')}:</span>
              {originIntel.carriers.map((c, i) => <span key={i} className="flight-intel-carrier">{c}</span>)}
            </div>

            <div className="flight-season">
              <div className="flight-season-title">
                {tx('Seasonality', 'Sesongkalender', 'Saisonnalité')}
              </div>
              <SeasonalityRow origin={reversed ? to : from} destination={reversed ? from : to} lang={lang} />
              <div className="flight-season-legend">
                <span><i className="lg lg-direct"></i> {tx('Direct flights', 'Direkte fly', 'Vols directs')}</span>
                <span><i className="lg lg-stop"></i> {tx('1 stop fastest', '1 stopp raskest', '1 escale plus rapide')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Affiliate disclosure — mandatory */}
        <aside className="flight-disclosure reveal">
          <strong>{tx('Affiliate disclosure', 'Affiliate-erklæring', 'Information d\'affiliation')}</strong>
          <p>
            {tx(
              'Marrakech Story shows live flight prices via affiliate partners including Aviasales, Skyscanner, and Kiwi.com. When you book through these links, we may receive a commission at no additional cost to you. We are not an airline ticket agent and do not issue tickets or process flight payments; all bookings complete on the partner\'s site under their terms.',
              'Marrakech Story viser flypriser i sanntid via partnere som Aviasales, Skyscanner og Kiwi.com. Når du bestiller via disse lenkene, kan vi motta en provisjon uten ekstra kostnad for deg. Vi er ikke en flybillettagent og utsteder ikke billetter eller behandler flybetalinger; alle bestillinger fullføres på partnerens nettsted under deres vilkår.',
              'Marrakech Story affiche des prix de vols en temps réel via des partenaires comme Aviasales, Skyscanner et Kiwi.com. En réservant via ces liens, nous pouvons recevoir une commission sans coût supplémentaire pour vous. Nous ne sommes pas une agence de billetterie aérienne et n\'émettons ni billets ni paiements de vols ; toutes les réservations se finalisent sur le site du partenaire.'
            )}
          </p>
        </aside>
      </div>
    </section>
  );
}

window.MS_Flights = Flights;
