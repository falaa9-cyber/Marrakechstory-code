// ============================================
// LIVE ITINERARY BUILDER
// Left: questions. Right: animated timeline preview.
// ============================================
const { useState: useSF, useEffect: useEF, useMemo: useMF } = React;
const If = window.MS_I;

const ACT_EMOJI = {
  arrival: '✈️', medina: '🕌', food: '🍽️', agafay: '🐪',
  atlas: '🏔️', spa: '🛁', balloon: '🎈', quad: '🏍️',
  shopping: '🛍️', photo: '📸', sahara: '🌵', essaouira: '🌊',
  imperial: '🏛️', pool: '☀️', departure: '✈️',
};

const ACT_POOL = {
  arrival: {
    title: { no: "Ankomst & velkomst", en: "Arrival & welcome", fr: "Arrivée & bienvenue" },
    desc: {
      no: "Privat henting på flyplassen, innsjekk på din riad i medinaen, og myntete på taket ved gylne timen.",
      en: "Private airport pickup, check-in at your hand-picked riad in the medina, and mint tea on the rooftop at golden hour.",
      fr: "Accueil privé à l'aéroport, arrivée dans votre riad de charme au cœur de la médina, thé à la menthe sur le toit-terrasse.",
    },
    chips: { no: ["Privat transfer", "Riad i medinaen", "Velkomstmiddag"], en: ["Private transfer", "Riad in medina", "Welcome dinner"], fr: ["Transfert privé", "Riad médina", "Dîner de bienvenue"] },
    stay: "Riad El Fenn", icon: "Plane",
  },
  medina: {
    title: { no: "Medina & paladser", en: "Medina & palaces", fr: "Médina & palais" },
    desc: {
      no: "En lokal historiker tar deg gjennom Ben Youssef, Bahia-palasset, Saadiernes graver og krydderkvartalet.",
      en: "A local historian walks you through Ben Youssef, Bahia Palace, the Saadian Tombs and the spice quarter.",
      fr: "Un historien local vous guide à travers Ben Youssef, le palais Bahia, les tombeaux saadiens et le quartier des épices.",
    },
    chips: { no: ["Bahia-palasset", "Ben Youssef", "Souker"], en: ["Bahia Palace", "Ben Youssef", "Souks"], fr: ["Palais Bahia", "Ben Youssef", "Souks"] },
    stay: "Riad El Fenn", icon: "Compass",
  },
  food: {
    title: { no: "Matkurs & souk", en: "Cooking class & food souk", fr: "Cours de cuisine & souk" },
    desc: {
      no: "Handle krydder med en lokal kokk, og lag tagine og pastilla i et tradisjonelt hjem.",
      en: "Shop the spice souk with a local chef, then cook a tagine and pastilla in a traditional dar.",
      fr: "Achetez les épices avec un chef local, puis préparez tagine et pastilla dans une dar traditionnelle.",
    },
    chips: { no: ["Krydderkurs", "Matlaging", "Pastilla"], en: ["Spice tour", "Cooking class", "Pastilla"], fr: ["Cours d'épices", "Cuisine", "Pastilla"] },
    stay: "Riad El Fenn", icon: "Utensils",
  },
  agafay: {
    title: { no: "Agafay-ørkenen", en: "Agafay stone desert", fr: "Désert d'Agafay" },
    desc: {
      no: "Kjør 45 min til Agafay. Kamelritt ved solnedgang og middag rundt bålet under stjernehimmelen.",
      en: "Drive 45min into the Agafay stone desert. Camel sundown and a fire-lit dinner under the stars.",
      fr: "45min jusqu'au désert d'Agafay. Coucher de soleil à dos de chameau et dîner autour du feu sous les étoiles.",
    },
    chips: { no: ["Kameltur", "Stjernemiddag", "Bål"], en: ["Camel ride", "Star dinner", "Bonfire"], fr: ["Chameau", "Dîner étoilé", "Feu de bois"] },
    stay: "Scarabeo Camp · Agafay", icon: "Tent",
  },
  atlas: {
    title: { no: "Atlasfjellene & berbiske landsbyer", en: "Atlas Mountains & Berber villages", fr: "Atlas & villages berbères" },
    desc: {
      no: "90 min inn i Atlas. Vandring mellom berbiske landsbyer med hjemmelaget lunsj.",
      en: "90min into the Atlas. Hike between Berber villages with a home-cooked lunch.",
      fr: "1h30 dans l'Atlas. Randonnée entre villages berbères avec déjeuner préparé chez l'habitant.",
    },
    chips: { no: ["Vandring", "Lokal lunsj", "Toubkal-utsikt"], en: ["Hike", "Local lunch", "Toubkal viewpoint"], fr: ["Randonnée", "Déjeuner local", "Vue Toubkal"] },
    stay: "Kasbah du Toubkal", icon: "Mountain",
  },
  spa: {
    title: { no: "Hammam & spa", en: "Hammam & spa ritual", fr: "Hammam & rituel spa" },
    desc: {
      no: "Tradisjonell hammam med svart såpe, peeling og argan-massasje.",
      en: "Traditional hammam — black soap exfoliation and full argan oil massage.",
      fr: "Hammam traditionnel — gommage au savon noir et massage à l'huile d'argan.",
    },
    chips: { no: ["Svart såpe", "Peeling", "Argan-massasje"], en: ["Black soap", "Exfoliation", "Argan massage"], fr: ["Savon noir", "Gommage", "Massage argan"] },
    stay: "Riad El Fenn", icon: "Sparkle",
  },
  balloon: {
    title: { no: "Luftballong ved soloppgang", en: "Hot-air balloon at sunrise", fr: "Montgolfière au lever du soleil" },
    desc: {
      no: "Lett over Agafay mens Atlas tar imot første lys. Berbisk frokost ved landing.",
      en: "Lift off as the Atlas catches first light. Berber breakfast on landing.",
      fr: "Décollez quand l'Atlas reçoit la première lumière. Petit-déjeuner berbère à l'atterrissage.",
    },
    chips: { no: ["Soloppgang", "Ballong", "Berbisk frokost"], en: ["Sunrise", "Balloon", "Berber breakfast"], fr: ["Lever du soleil", "Ballon", "Petit-déjeuner berbère"] },
    stay: "Riad El Fenn", icon: "Sun",
  },
  quad: {
    title: { no: "Quad eller buggy", en: "Quad biking or buggy", fr: "Quad ou buggy" },
    desc: {
      no: "Tre timer i palmeoasen eller Lalla Takerkoust med buggy.",
      en: "Three hours through the palm grove or Lalla Takerkoust by buggy.",
      fr: "Trois heures dans la palmeraie ou à Lalla Takerkoust en buggy.",
    },
    chips: { no: ["Quad", "Off-road", "Palmeoase"], en: ["Quad", "Off-road", "Palm grove"], fr: ["Quad", "Hors-piste", "Palmeraie"] },
    stay: "Riad El Fenn", icon: "Compass",
  },
  shopping: {
    title: { no: "Privat shopping i soukene", en: "Private souk shopping", fr: "Shopping privé dans les souks" },
    desc: {
      no: "En lokal stylist tar deg til pålitelige håndverkere – tepper, lamper, lær.",
      en: "A bilingual buyer takes you to her trusted artisans — rugs, lamps, leather.",
      fr: "Une acheteuse bilingue vous emmène chez ses artisans de confiance — tapis, lampes, cuir.",
    },
    chips: { no: ["Tepper", "Lamper", "Lær"], en: ["Rugs", "Lamps", "Leather"], fr: ["Tapis", "Lampes", "Cuir"] },
    stay: "Riad El Fenn", icon: "Sparkle",
  },
  photo: {
    title: { no: "Foto-vandring i medinaen", en: "Medina photography walk", fr: "Balade photo dans la médina" },
    desc: {
      no: "Tre timer med en lokal fotograf – skjulte riader, lysrom, fargemakere, taksolnedganger.",
      en: "Three hours with a local photographer — hidden riads, light pockets, dye-makers, rooftop sunsets.",
      fr: "Trois heures avec un photographe local — riads cachés, jeux de lumière, teinturiers, couchers de soleil.",
    },
    chips: { no: ["Skjulte riader", "Fargemakere", "Tak-solnedgang"], en: ["Hidden riads", "Dye-makers", "Rooftop sunset"], fr: ["Riads cachés", "Teinturiers", "Couchers de soleil"] },
    stay: "Riad El Fenn", icon: "Camera",
  },
  sahara: {
    title: { no: "Sahara – dyner & luksusleir", en: "Sahara — dunes & luxury camp", fr: "Sahara — dunes & camp de luxe" },
    desc: {
      no: "4x4 over Erg Chebbi, kameltur ved solnedgang, middag og trommer ved luksusleir.",
      en: "4x4 across Erg Chebbi, sunset camel trek, dinner and drums at a luxury dune camp.",
      fr: "4x4 sur l'Erg Chebbi, chameau au coucher du soleil, dîner et tambours au camp de luxe.",
    },
    chips: { no: ["4x4", "Kameltur", "Luksusleir"], en: ["4x4", "Camel trek", "Luxury camp"], fr: ["4x4", "Caravane", "Camp de luxe"] },
    stay: "Erg Chebbi Luxury Camp", icon: "Tent",
  },
  essaouira: {
    title: { no: "Essaouira – Atlanterhavet", en: "Essaouira — Atlantic coast", fr: "Essaouira — côte atlantique" },
    desc: {
      no: "To timer vest til vindsurf-byen – fiske-lunsj på havna, medina-murer, retur ved solnedgang.",
      en: "2h drive west to the windsurf capital — fish lunch on the harbour, medina walls, return at sunset.",
      fr: "2h vers l'ouest jusqu'à la capitale du windsurf — déjeuner poissons sur le port, remparts, retour.",
    },
    chips: { no: ["Kystkjøring", "Fiske-lunsj", "Havmurer"], en: ["Coast drive", "Fish lunch", "Sea walls"], fr: ["Route côtière", "Déjeuner poissons", "Remparts"] },
    stay: "Riad El Fenn", icon: "Sun",
  },
  imperial: {
    title: { no: "Imperialbyen Fes", en: "Imperial Fes", fr: "Fès, ville impériale" },
    desc: {
      no: "Full guidet dag i verdens største bilfrie medina – garveriene, madrasaene, håndverkerne.",
      en: "Full guided day in the world's largest car-free medina — tanneries, madrasas, artisans.",
      fr: "Journée guidée dans la plus grande médina piétonne du monde — tanneries, médersas, artisans.",
    },
    chips: { no: ["Garverier", "Madrasaer", "Håndverkere"], en: ["Tanneries", "Madrasas", "Artisans"], fr: ["Tanneries", "Médersas", "Artisans"] },
    stay: "Riad Fes", icon: "Compass",
  },
  pool: {
    title: { no: "Bassengdag på Beldi", en: "Pool day at Beldi", fr: "Journée piscine à Beldi" },
    desc: {
      no: "Tre basseng omgitt av olivenlunder og rosenhager. Lang, lat lunsj.",
      en: "Three pools surrounded by olive groves and rose gardens. Long, lazy lunch.",
      fr: "Trois piscines entre oliviers et roseraies. Long déjeuner langoureux.",
    },
    chips: { no: ["3 basseng", "Olivenhage", "Lang lunsj"], en: ["3 pools", "Olive groves", "Long lunch"], fr: ["3 piscines", "Oliviers", "Long déjeuner"] },
    stay: "Riad El Fenn", icon: "Sun",
  },
  departure: {
    title: { no: "Avreise & farvel", en: "Departure & farewell", fr: "Départ & au revoir" },
    desc: {
      no: "Siste shopping, eller en time på taket før privat transfer til flyplassen.",
      en: "Last-minute shopping, or an hour on the rooftop before a private transfer to the airport.",
      fr: "Derniers achats ou une heure sur le toit avant le transfert privé à l'aéroport.",
    },
    chips: { no: ["Fri tid", "Sjåfør", "Flyplass"], en: ["Free time", "Driver", "Airport"], fr: ["Temps libre", "Chauffeur", "Aéroport"] },
    stay: "—", icon: "Plane",
  },
};

const FLOAT_EMOJIS = ['✈️','🐪','🌅','🕌','🏔️','🎈','🛍️','🌴','⭐','🌊','🍵','🔥','📸','🏛️','🌺'];

function buildItinerary(days, interests) {
  if (!days) return [];

  const seq = ['arrival'];

  if (days >= 2) seq.push('medina');
  if (interests.includes('food') && days >= 2) seq.push('food');
  if (days >= 3) seq.push('agafay');
  if ((days >= 4 || interests.includes('hike')) && days >= 4) seq.push('atlas');
  if (interests.includes('balloon') && days >= 4) seq.push('balloon');
  if (interests.includes('photo') && days >= 3) seq.push('photo');
  if (interests.includes('spa') && days >= 3) seq.push('spa');
  if (interests.includes('shop') && days >= 3) seq.push('shopping');
  if (interests.includes('quad') && days >= 4) seq.push('quad');
  if (days >= 6 || interests.includes('coast')) seq.push('essaouira');
  if (days >= 7) { seq.push('sahara'); seq.push('sahara'); }
  if (days >= 9 || interests.includes('imperial')) seq.push('imperial');
  if (days >= 12) { seq.push('imperial'); }
  if (days >= 14) { seq.push('essaouira'); seq.push('pool'); }
  if (days >= 18) { seq.push('spa'); seq.push('photo'); seq.push('shopping'); }
  if (days >= 22) { seq.push('balloon'); seq.push('atlas'); seq.push('agafay'); }

  seq.push('departure');

  // Keep arrival and departure fixed; fill/trim the middle
  const arr = seq[0];
  const dep = seq[seq.length - 1];
  let middle = seq.slice(1, -1);

  const filler = ['medina', 'pool', 'spa', 'food', 'shopping', 'photo', 'agafay', 'atlas'];
  let fi = 0;
  while (middle.length < days - 2) { middle.push(filler[fi % filler.length]); fi++; }
  if (middle.length > days - 2) middle = middle.slice(0, days - 2);

  return [arr, ...middle, ...(days > 1 ? [dep] : [])].map(key => ({ key }));
}

// ───────────────────────────────────────────────────────────────
// Booking.com-style two-month range calendar.
// Hides past dates. Click start → click end. Click again to reset.
// ───────────────────────────────────────────────────────────────
function RangeCalendar({ start, end, onChange, lang = 'no' }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const initial = start ? new Date(start) : today;
  const [viewMonth, setViewMonth] = useSF(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [hover, setHover] = useSF(null);

  const monthName = (d) => d.toLocaleDateString(
    lang === 'no' ? 'no-NO' : lang === 'fr' ? 'fr-FR' : 'en-GB',
    { month: 'long', year: 'numeric' }
  );

  const weekdayLabels = lang === 'no'
    ? ['M','T','O','T','F','L','S']
    : lang === 'fr' ? ['L','M','M','J','V','S','D']
    : ['M','T','W','T','F','S','S'];

  const buildMonth = (anchor) => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    // Monday-first
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d));
    }
    return cells;
  };

  const fmt = (d) => d ? d.toISOString().slice(0, 10) : '';
  const startD = start ? new Date(start) : null;
  const endD   = end   ? new Date(end)   : null;
  const hoverD = hover ? new Date(hover) : null;

  const cellState = (d) => {
    if (!d) return '';
    if (d < today) return 'past';
    const s = fmt(d);
    if (startD && fmt(startD) === s) return 'start';
    if (endD && fmt(endD) === s)     return 'end';
    if (startD && endD && d > startD && d < endD) return 'in';
    if (startD && !endD && hoverD && d > startD && d <= hoverD) return 'in-hover';
    return '';
  };

  const handleClick = (d) => {
    if (!d || d < today) return;
    if (!startD || (startD && endD)) {
      onChange(fmt(d), '');
    } else if (d < startD) {
      onChange(fmt(d), '');
    } else {
      onChange(fmt(startD), fmt(d));
    }
  };

  const renderMonth = (anchor) => {
    const cells = buildMonth(anchor);
    return (
      <div className="rcal-month" key={anchor.getFullYear() + '-' + anchor.getMonth()}>
        <div className="rcal-month-head">{monthName(anchor)}</div>
        <div className="rcal-grid">
          {weekdayLabels.map((w, i) => <div key={'w' + i} className="rcal-wd">{w}</div>)}
          {cells.map((d, i) => {
            const state = cellState(d);
            return (
              <button
                key={i}
                type="button"
                className={`rcal-cell ${state}`}
                disabled={!d || state === 'past'}
                onClick={() => handleClick(d)}
                onMouseEnter={() => d && setHover(fmt(d))}
                onMouseLeave={() => setHover(null)}>
                {d ? d.getDate() : ''}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);

  return (
    <div className="rcal">
      <div className="rcal-bar">
        <button type="button" className="rcal-nav" onClick={() => {
          const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
          if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) setViewMonth(prev);
        }}>‹</button>
        <button type="button" className="rcal-nav" onClick={() =>
          setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
        }>›</button>
      </div>
      <div className="rcal-months">
        {renderMonth(viewMonth)}
        {renderMonth(next)}
      </div>
    </div>
  );
}

function ItineraryBuilder() {
  const { useT, useMS, usePrice, COMPANY } = window.MS_CTX;
  const t = useT();
  const ctx = useMS();
  const price = usePrice();

  const [data, setData] = useSF({
    duration: 0,
    travellers: { adults: 0, children: 0, infants: 0 },
    accommodation: '',
    pace: '',
    interests: [],
    occasion: '',
    avoid: '',
    notes: '',
    budget: '',
    startDate: '',
    flex: 'flex3',
    name: '',
    email: '',
    phone: '',
    country: '',
    bookedAccom: false,
    bookedAccomAddr: '',
    bookedTransport: false,
    bookedActivities: false,
    endDate: '',
    arriveCity: '',
    departCity: '',
    multiCity: false,
    stops: [],
    tripType: '',
    transport: '',
    vanSeats: 7,
    rentalCar: '',
    flightBooked: '',
    flightDetails: '',
    daySchedule: [],
  });

  // Form owns its own state — no two-way sync with global context.
  // (Previous sync caused an infinite render loop because ctx.travellers
  // was re-created on every parent render.)

  // Auto-fill from logged-in user + saved profile so guests don't retype.
  // Runs once on mount (and stays stable — guarded by the `||` chain so it
  // never overwrites a value the user has already typed).
  useEF(() => {
    const user = window.MS_Auth_User;
    let profile = {};
    try { profile = JSON.parse(localStorage.getItem('ms_profile_data') || '{}'); } catch {}
    if (!user && !profile.name) return;
    setData(d => ({
      ...d,
      name:    d.name    || profile.name    || user?.name  || '',
      email:   d.email   || profile.email   || user?.email || '',
      phone:   d.phone   || profile.phone   || '',
      country: d.country || profile.country || (ctx.lang === 'no' ? 'Norge' : ''),
    }));
  }, []);

  // Track which Smak categories are expanded ("first line" by default)
  const [smakOpen, setSmakOpen] = useSF({});
  const toggleSmak = (key) => setSmakOpen(p => ({ ...p, [key]: !p[key] }));

  // Day-by-day Smak picker — current day index + per-day picks helper
  const [activeDay, setActiveDay] = useSF(0);
  const dayPick = (dayIdx, slot, value) => setData(p => {
    const next = [...p.daySchedule];
    while (next.length <= dayIdx) next.push({ activities: [], wellness: [], pool: [], restaurant: '' });
    const cur = next[dayIdx];
    if (slot === 'restaurant') {
      next[dayIdx] = { ...cur, restaurant: cur.restaurant === value ? '' : value };
    } else {
      const list = cur[slot] || [];
      next[dayIdx] = { ...cur, [slot]: list.includes(value) ? list.filter(x => x !== value) : [...list, value] };
    }
    return { ...p, daySchedule: next };
  });

  // Pick up booking context from itinerary "Take as-is" / Tweak handoffs
  const [bookingCtx, setBookingCtx] = useSF(() => window.MS_BookingContext || null);
  useEF(() => {
    const sync = () => {
      const c = window.MS_BookingContext;
      if (!c) return;
      setBookingCtx(c);
      setData(d => ({
        ...d,
        duration: c.duration || d.duration,
        tripType: c.tripType || d.tripType,
        // Itinerary already defines pace/interests/stay — leave them at sensible defaults
      }));
      // Always start at step 1 so the user reviews dates, travellers, style, etc.
      setStep(0);
    };
    sync();
    window.addEventListener('ms:booking-context', sync);
    return () => window.removeEventListener('ms:booking-context', sync);
  }, []);
  const clearBookingCtx = () => {
    window.MS_BookingContext = null;
    setBookingCtx(null);
  };

  const upd = (k, v) => setData(p => ({ ...p, [k]: v }));
  const toggle = (k, v) => setData(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));
  const updTrav = (k, delta) => setData(p => ({ ...p, travellers: { ...p.travellers, [k]: Math.max(0, p.travellers[k] + delta) } }));

  const [step, setStep] = useSF(0);
  const [sent, setSent] = useSF(false);

  // Smart, condensed steps. When the user picked a ready-made itinerary,
  // we already know duration/pace/interests — so we only ask for dates + contact.
  const allSteps = [
    { id: 'contact', label: ctx.lang === 'no' ? 'Kontakt'          : ctx.lang === 'fr' ? 'Contact'       : 'Contact' },
    { id: 'when',    label: ctx.lang === 'no' ? 'Når'              : ctx.lang === 'fr' ? 'Quand'         : 'When' },
    { id: 'who',     label: ctx.lang === 'no' ? 'Hvem reiser?'     : ctx.lang === 'fr' ? 'Qui voyage ?'  : 'Who is going?' },
    { id: 'style',   label: ctx.lang === 'no' ? 'Stil'              : ctx.lang === 'fr' ? 'Style'         : 'Style' },
    { id: 'taste',   label: ctx.lang === 'no' ? 'Smak'              : ctx.lang === 'fr' ? 'Goûts'         : 'Taste' },
    { id: 'extra',   label: ctx.lang === 'no' ? 'Det lille ekstra'  : ctx.lang === 'fr' ? 'Le petit plus' : 'Little extras' },
    { id: 'send',    label: ctx.lang === 'no' ? 'Send'              : ctx.lang === 'fr' ? 'Envoyer'       : 'Send' },
  ];
  const steps = allSteps;

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));
  const cid = steps[Math.min(step, steps.length - 1)]?.id || 'when';
  const show = (...ids) => ids.includes(cid);

  const itinerary = useMF(() => buildItinerary(data.duration, data.interests), [data.duration, data.interests]);

  const generatePDF = () => {
    const totalPax = data.travellers.adults + data.travellers.children + data.travellers.infants;
    const endDate = (() => {
      const d = new Date(data.startDate);
      d.setDate(d.getDate() + data.duration - 1);
      return d.toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' });
    })();
    const startFmt = data.startDate
      ? new Date(data.startDate).toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';

    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:720px;margin:0 auto;padding:48px 40px;color:#1a1310;background:#fff;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:36px;padding-bottom:28px;border-bottom:2px solid #e1432a;">
          <div>
            <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em;">Marrakech<em style="font-style:italic;font-weight:400;color:#e1432a;">Story</em></div>
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#6b594d;margin-top:2px;">Premium reise i Marokko</div>
          </div>
        </div>

        <div style="background:#fdfaf6;border-radius:14px;padding:28px 32px;margin-bottom:32px;border:1px solid #ece1d2;">
          <h1 style="font-size:26px;font-weight:700;margin:0 0 6px;letter-spacing:-0.02em;">Reiseplan — ${data.name || 'Gjest'}</h1>
          <div style="font-size:15px;color:#6b594d;">
            ${startFmt} – ${endDate} · ${data.duration} dager · ${totalPax} reisende
          </div>
          <div style="display:flex;gap:24px;margin-top:18px;font-size:13px;">
            <span>🏨 ${data.accommodation}</span>
            <span>⚡ ${data.pace}</span>
            <span>✨ ${data.budget}</span>
          </div>
        </div>

        <h2 style="font-size:16px;font-weight:600;margin:0 0 18px;text-transform:uppercase;letter-spacing:.08em;color:#e1432a;">Dag-for-dag</h2>
        ${itinerary.map((d, i) => {
          const act = ACT_POOL[d.key] || ACT_POOL.medina;
          const dayDate = new Date(data.startDate);
          dayDate.setDate(dayDate.getDate() + i);
          const dateStr = dayDate.toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'short' });
          return `
            <div style="display:flex;gap:20px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #ece1d2;">
              <div style="min-width:48px;height:48px;border-radius:50%;background:#e1432a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;">${i+1}</div>
              <div>
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#6b594d;margin-bottom:2px;">${dateStr}</div>
                <div style="font-size:17px;font-weight:600;margin-bottom:4px;">${act.title[ctx.lang]}</div>
                <div style="font-size:13px;color:#6b594d;line-height:1.5;">${act.desc[ctx.lang]}</div>
                <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                  ${act.chips[ctx.lang].map(c => `<span style="background:#fbe4dc;color:#e1432a;padding:3px 10px;border-radius:999px;font-size:11px;">${c}</span>`).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}

        ${data.notes ? `<div style="background:#fdfaf6;border-radius:10px;padding:20px 24px;margin-top:16px;border:1px solid #ece1d2;"><strong>Notater:</strong> ${data.notes}</div>` : ''}

        <div style="margin-top:40px;padding-top:28px;border-top:1px solid #ece1d2;display:flex;justify-content:space-between;font-size:12px;color:#6b594d;">
          <span>MarrakechStory · Marrakechstory@outlook.com · +212 6 943 45 354</span>
          <span>www.marrakechstory.com</span>
        </div>
      </div>
    `;

    if (window.html2pdf) {
      const el = document.createElement('div');
      el.innerHTML = html;
      document.body.appendChild(el);
      window.html2pdf().set({
        margin: 0,
        filename: `MarrakechStory-Reiseplan-${data.name || 'gjest'}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save().then(() => document.body.removeChild(el));
    }
  };

  const buildSummary = () => {
    const totalPax = data.travellers.adults + data.travellers.children + data.travellers.infants;
    const lines = [];
    if (bookingCtx) {
      lines.push(`Reise: ${bookingCtx.title} (${bookingCtx.duration} dager)`);
    } else {
      lines.push(`Varighet: ${data.duration} dager`);
      lines.push(`Stil: ${data.accommodation} · ${data.pace} · ${data.budget}`);
      if (data.interests.length) lines.push(`Interesser: ${data.interests.join(', ')}`);
    }
    lines.push(`Reisende: ${data.travellers.adults}v ${data.travellers.children}b ${data.travellers.infants}s (${totalPax} totalt)`);
    lines.push(`Periode: ${data.startDate}${data.endDate ? ' → ' + data.endDate : ''} (${data.flex})`);
    lines.push(`Fly: lander i ${data.arriveCity}, hjem fra ${data.departCity}`);
    if (data.occasion) lines.push(`Anledning: ${data.occasion}`);
    if (data.notes)    lines.push(`Notater: ${data.notes}`);
    lines.push(`Kontakt: ${data.name} · ${data.email} · ${data.phone}`);
    return lines.join('\n');
  };

  const sendWhatsapp = () => {
    if (!window.MS_Auth_User && window.MS_Auth_Prompt) window.MS_Auth_Prompt('register');
    const msg = encodeURIComponent(
      (ctx.lang === 'no' ? 'Hei Marrakech Story! ' : 'Hi Marrakech Story! ') +
      (ctx.lang === 'no' ? 'Jeg vil booke:\n\n' : 'I would like to book:\n\n') +
      buildSummary()
    );
    try {
      const prev = JSON.parse(localStorage.getItem('ms_requests') || '[]');
      prev.unshift({ when: new Date().toISOString(), via: 'whatsapp', ctx: bookingCtx?.title || null, data });
      localStorage.setItem('ms_requests', JSON.stringify(prev.slice(0, 20)));
    } catch {}
    window.open(`https://wa.me/212698164331?text=${msg}`, '_blank');
    setSent(true);
  };

  const send = () => {
    // Prompt account creation if not logged in
    if (!window.MS_Auth_User && window.MS_Auth_Prompt) {
      window.MS_Auth_Prompt('register');
    }

    // Generate PDF
    generatePDF();

    const totalPax = data.travellers.adults + data.travellers.children + data.travellers.infants;
    const body = encodeURIComponent(
      `Hei Marrakech Story,\n\nJeg vil planlegge en reise — detaljer fra reiseplanleggeren:\n\n` +
      `— VARIGHET —\n${data.duration} dager\n\n` +
      `— REISENDE —\n${data.travellers.adults} voksne · ${data.travellers.children} barn · ${data.travellers.infants} spedbarn (${totalPax} totalt)\n\n` +
      `— DATOER —\nStart: ${data.startDate} (${data.flex})\n\n` +
      `— STIL —\nOvernatting: ${data.accommodation}\nTempo: ${data.pace}\nBudsjett: ${data.budget}\n\n` +
      `— INTERESSER —\n${data.interests.join(', ') || 'åpent'}\n\n` +
      `— ANLEDNING —\n${data.occasion || '—'}\n\n` +
      `— UNNGÅ —\n${data.avoid || '—'}\n\n` +
      `— NOTATER —\n${data.notes || '—'}\n\n` +
      `— UTKAST REISEPLAN —\n${itinerary.map((d, i) => `Dag ${i + 1}: ${(ACT_POOL[d.key]?.title?.[ctx.lang]) || d.key}`).join('\n')}\n\n` +
      `— KONTAKT —\n${data.name}\n${data.email}\n${data.phone}\n${data.country}\n\nGleder meg til å høre fra dere!\n`
    );
    const subject = encodeURIComponent(`Ny reiseforespørsel — ${data.name || 'gjest'} · ${data.duration} dager`);
    window.location.href = `mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const OptCard = ({ field, value, ttl, sub, ico, multi }) => {
    const isActive = multi ? data[field].includes(value) : data[field] === value;
    return (
      <button type="button" className={`opt-card ${isActive ? 'active' : ''}`}
        onClick={() => multi ? toggle(field, value) : upd(field, value)}>
        {ico && <span className="ico">{ico}</span>}
        <span className="ttl">{ttl}</span>
        {sub && <span className="sub">{sub}</span>}
      </button>
    );
  };

  const durLabel = (n, lang) => {
    if (lang === 'no') return n === 1 ? 'dag' : 'dager';
    if (lang === 'fr') return n === 1 ? 'jour' : 'jours';
    return n === 1 ? 'day' : 'days';
  };

  const presets = [
    { d: 4,  label: { no: '4d · Lang helg', en: '4d · Weekend', fr: '4j · Weekend' } },
    { d: 7,  label: { no: '7d · Klassisk', en: '7d · Classic', fr: '7j · Classique' } },
    { d: 10, label: { no: '10d · Premium', en: '10d · Premium', fr: '10j · Premium' } },
    { d: 14, label: { no: '14d · Grand Tour', en: '14d · Grand Tour', fr: '14j · Grand Tour' } },
    { d: 21, label: { no: '21d · Utvidet', en: '21d · Extended', fr: '21j · Étendu' } },
    { d: 30, label: { no: '30d · Hele Marokko', en: '30d · Full Morocco', fr: '30j · Maroc entier' } },
  ];

  return (
    <section className="itin-section section" id="plan">
      <div className="wrap-wide">
        <div className="section-head reveal" style={{ textAlign: 'center', margin: '0 auto 56px' }}>
          <span className="eyebrow">{t('itin_eyebrow')}</span>
          <h2>{t('itin_title_a')} <em>{t('itin_title_b')}</em> {t('itin_title_c')}</h2>
          <p style={{ margin: '0 auto' }}>{t('itin_sub')}</p>
        </div>

        {window.MS_FavouritesQuickAdd && <window.MS_FavouritesQuickAdd />}

        <div className="itin-shell reveal">
          {/* LEFT: form */}
          <div className="itin-form">
            {!sent && bookingCtx && (
              <div className="itin-ctx-banner">
                <div>
                  <span className="itin-ctx-eyebrow">
                    {ctx.lang === 'no' ? 'Du bestiller:' : ctx.lang === 'fr' ? 'Vous réservez :' : 'You are booking:'}
                  </span>
                  <strong>{bookingCtx.title}</strong>
                  <span className="itin-ctx-meta">
                    {bookingCtx.duration} {ctx.lang === 'no' ? 'dager' : ctx.lang === 'fr' ? 'jours' : 'days'}
                    {bookingCtx.priceEur ? ` · ${price(bookingCtx.priceEur * 1.4)}` : ''}
                  </span>
                </div>
                <button className="itin-ctx-clear" onClick={clearBookingCtx} aria-label="Start fresh">✕</button>
              </div>
            )}
            {!sent && (
              <>
                <div className="itin-stepper">
                  {steps.map((s, i) => (
                    <button key={s.id} className={`itin-step-pill ${i === step ? 'active' : i < step ? 'done' : ''}`}
                      onClick={() => setStep(i)}>
                      <span className="n">{i < step ? <If.Check s={11} /> : i + 1}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>

                <div className="itin-step-body">
                  {show('when') && (
                    <div>
                      <h3 className="itin-q">
                        {ctx.lang === 'no' ? 'Velg periode' : ctx.lang === 'fr' ? 'Choisissez la période' : 'Choose your period'}
                      </h3>
                      <RangeCalendar
                        start={data.startDate}
                        end={data.endDate}
                        lang={ctx.lang}
                        onChange={(s, e) => {
                          upd('startDate', s);
                          upd('endDate', e);
                          ctx.setDates({ ...ctx.dates, dep: s });
                          if (s && e) {
                            const diff = Math.max(1, Math.round((new Date(e) - new Date(s)) / 86400000) + 1);
                            upd('duration', diff);
                          }
                        }}
                      />
                      {data.startDate && data.endDate && (
                        <div className="period-summary">
                          {data.duration} {ctx.lang === 'no' ? (data.duration === 1 ? 'dag' : 'dager') : ctx.lang === 'fr' ? 'jours' : 'days'}
                          {' · '}
                          {Math.max(0, data.duration - 1)} {ctx.lang === 'no' ? 'netter' : ctx.lang === 'fr' ? 'nuits' : 'nights'}
                        </div>
                      )}

                      {/* Multi-city — only if longer than 4 days */}
                      {data.startDate && data.endDate && data.duration > 4 && (() => {
                        const cityOptions = ['Marrakech', 'Essaouira', 'Fes', 'Casablanca', 'Chefchaouen', 'Rabat', 'Tangier', 'Agadir', 'Merzouga (Sahara)', 'Ouarzazate', 'Ait Ben Haddou', 'Atlas Mountains'];
                        const totalNights = Math.max(0, data.duration - 1);
                        const used = data.stops.reduce((s, x) => s + (parseInt(x.nights) || 0), 0);
                        const remaining = totalNights - used;
                        return (
                          <div className="multicity-block">
                            <h3 className="itin-q" style={{ marginTop: 28 }}>
                              {ctx.lang === 'no' ? 'Ønsker du å besøke flere byer?' : ctx.lang === 'fr' ? 'Visiter plusieurs villes ?' : 'Visit multiple cities?'}
                            </h3>
                            <div className="multicity-toggle">
                              <button type="button"
                                className={`mc-toggle ${!data.multiCity ? 'active' : ''}`}
                                onClick={() => setData(p => ({ ...p, multiCity: false, stops: [{ city: 'Marrakech', nights: totalNights }] }))}>
                                {ctx.lang === 'no' ? 'Kun Marrakech' : ctx.lang === 'fr' ? 'Marrakech seulement' : 'Marrakech only'}
                              </button>
                              <button type="button"
                                className={`mc-toggle ${data.multiCity ? 'active' : ''}`}
                                onClick={() => setData(p => ({ ...p, multiCity: true }))}>
                                {ctx.lang === 'no' ? 'Flere byer' : ctx.lang === 'fr' ? 'Plusieurs villes' : 'Multi-city'}
                              </button>
                            </div>

                            {data.multiCity && (
                              <div className="multicity-stops">
                                {data.stops.map((s, i) => (
                                  <div key={i} className="mc-stop">
                                    <select value={s.city}
                                      onChange={e => setData(p => ({ ...p, stops: p.stops.map((x, j) => j === i ? { ...x, city: e.target.value } : x) }))}>
                                      {cityOptions.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                    <div className="mc-night-ctrl">
                                      <button type="button" onClick={() =>
                                        setData(p => ({ ...p, stops: p.stops.map((x, j) => j === i ? { ...x, nights: Math.max(0, (parseInt(x.nights) || 0) - 1) } : x) }))
                                      }>−</button>
                                      <span>{s.nights} {ctx.lang === 'no' ? 'n' : 'n'}</span>
                                      <button type="button" onClick={() =>
                                        setData(p => ({ ...p, stops: p.stops.map((x, j) => j === i ? { ...x, nights: (parseInt(x.nights) || 0) + 1 } : x) }))
                                      }>+</button>
                                    </div>
                                    {data.stops.length > 1 && (
                                      <button type="button" className="mc-remove" onClick={() =>
                                        setData(p => ({ ...p, stops: p.stops.filter((_, j) => j !== i) }))
                                      }>✕</button>
                                    )}
                                  </div>
                                ))}
                                <button type="button" className="mc-add" onClick={() =>
                                  setData(p => ({ ...p, stops: [...p.stops, { city: 'Essaouira', nights: 1 }] }))
                                }>
                                  + {ctx.lang === 'no' ? 'Legg til by' : ctx.lang === 'fr' ? 'Ajouter une ville' : 'Add city'}
                                </button>
                                <div className={`mc-balance ${remaining === 0 ? 'ok' : remaining < 0 ? 'over' : 'under'}`}>
                                  {ctx.lang === 'no'
                                    ? `${used} / ${totalNights} netter fordelt`
                                    : ctx.lang === 'fr'
                                      ? `${used} / ${totalNights} nuits réparties`
                                      : `${used} / ${totalNights} nights allocated`}
                                  {remaining !== 0 && (
                                    <span> · {remaining > 0
                                      ? (ctx.lang === 'no' ? `${remaining} igjen` : ctx.lang === 'fr' ? `${remaining} restant` : `${remaining} left`)
                                      : (ctx.lang === 'no' ? `${-remaining} for mange` : ctx.lang === 'fr' ? `${-remaining} en trop` : `${-remaining} too many`)
                                    }</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <h3 className="itin-q" style={{ marginTop: 28 }}>
                        {ctx.lang === 'no' ? 'Fly inn / fly ut' : ctx.lang === 'fr' ? 'Arrivée / départ' : 'Arrival / departure'}
                      </h3>
                      <div className="fld-row">
                        <div className="fld">
                          <label>{ctx.lang === 'no' ? 'Lander i' : ctx.lang === 'fr' ? 'Atterrissage à' : 'Landing in'}</label>
                          <select value={data.arriveCity} onChange={e => upd('arriveCity', e.target.value)}>
                            <option value="">{ctx.lang === 'no' ? 'Velg…' : ctx.lang === 'fr' ? 'Choisir…' : 'Choose…'}</option>
                            <option>Marrakech (RAK)</option>
                            <option>Casablanca (CMN)</option>
                            <option>Agadir (AGA)</option>
                            <option>Fes (FEZ)</option>
                            <option>Tangier (TNG)</option>
                            <option>Rabat (RBA)</option>
                            <option>Essaouira (ESU)</option>
                            <option>Ouarzazate (OZZ)</option>
                          </select>
                        </div>
                        <div className="fld">
                          <label>{ctx.lang === 'no' ? 'Reiser hjem fra' : ctx.lang === 'fr' ? 'Départ de' : 'Departing from'}</label>
                          <select value={data.departCity} onChange={e => upd('departCity', e.target.value)}>
                            <option value="">{ctx.lang === 'no' ? 'Velg…' : ctx.lang === 'fr' ? 'Choisir…' : 'Choose…'}</option>
                            <option>Marrakech (RAK)</option>
                            <option>Casablanca (CMN)</option>
                            <option>Agadir (AGA)</option>
                            <option>Fes (FEZ)</option>
                            <option>Tangier (TNG)</option>
                            <option>Rabat (RBA)</option>
                            <option>Essaouira (ESU)</option>
                            <option>Ouarzazate (OZZ)</option>
                          </select>
                        </div>
                      </div>

                      <h3 className="itin-q" style={{ marginTop: 24 }}>
                        {ctx.lang === 'no' ? 'Har dere bestilt fly?' : ctx.lang === 'fr' ? 'Avez-vous réservé le vol ?' : 'Have you booked your flight?'}
                      </h3>
                      <div className="multicity-toggle">
                        <button type="button"
                          className={`mc-toggle ${data.flightBooked === 'yes' ? 'active' : ''}`}
                          onClick={() => upd('flightBooked', 'yes')}>
                          {ctx.lang === 'no' ? 'Ja' : 'Yes'}
                        </button>
                        <button type="button"
                          className={`mc-toggle ${data.flightBooked === 'no' ? 'active' : ''}`}
                          onClick={() => upd('flightBooked', 'no')}>
                          {ctx.lang === 'no' ? 'Nei' : 'No'}
                        </button>
                      </div>
                      {data.flightBooked === 'yes' && (
                        <div className="fld" style={{ marginTop: 10 }}>
                          <label>{ctx.lang === 'no' ? 'Flydetaljer (selskap, flynr, tider)' : ctx.lang === 'fr' ? 'Détails du vol (compagnie, n°, horaires)' : 'Flight details (airline, number, times)'}</label>
                          <textarea rows="2" value={data.flightDetails}
                            onChange={e => upd('flightDetails', e.target.value)}
                            placeholder={ctx.lang === 'no' ? 'F.eks. Royal Air Maroc AT207 · Ankomst 14:30 · Avgang 08:50' : 'e.g. Royal Air Maroc AT207 · Arrival 14:30 · Departure 08:50'} />
                        </div>
                      )}
                    </div>
                  )}

                  {show('who') && (
                    <div>
                      <h3 className="itin-q">
                        {ctx.lang === 'no' ? 'Hvilken type reise?' : ctx.lang === 'fr' ? 'Quel type de voyage ?' : 'What kind of trip?'}
                      </h3>
                      <div className="opt-grid">
                        <OptCard field="tripType" value="solo"
                          ttl={ctx.lang === 'no' ? 'Solo-reisende' : ctx.lang === 'fr' ? 'Voyageur solo' : 'Solo traveller'}
                          ico={<span>🧳</span>} />
                        <OptCard field="tripType" value="couple"
                          ttl={ctx.lang === 'no' ? 'Par' : ctx.lang === 'fr' ? 'Couple' : 'Couple'}
                          ico={<span>💑</span>} />
                        <OptCard field="tripType" value="family"
                          ttl={ctx.lang === 'no' ? 'Familie' : ctx.lang === 'fr' ? 'Famille' : 'Family'}
                          ico={<span>👨‍👩‍👧</span>} />
                        <OptCard field="tripType" value="group"
                          ttl={ctx.lang === 'no' ? 'Gruppe' : ctx.lang === 'fr' ? 'Groupe' : 'Group'}
                          ico={<span>👥</span>} />
                        <OptCard field="tripType" value="team"
                          ttl={ctx.lang === 'no' ? 'Team building' : 'Team building'}
                          ico={<span>🤝</span>} />
                        <OptCard field="tripType" value="wedding"
                          ttl={ctx.lang === 'no' ? 'Bryllupsplanlegger' : ctx.lang === 'fr' ? 'Organisateur de mariage' : 'Wedding planner'}
                          ico={<span>💍</span>} />
                      </div>

                      <h3 className="itin-q" style={{ marginTop: 28 }}>{t('itin_step_who')}</h3>
                      <div className="itin-counter-grid">
                        {[
                          { k: 'adults', lbl: t('itin_adults'), sub: t('itin_adults_sub') },
                          { k: 'children', lbl: t('itin_kids'), sub: t('itin_kids_sub') },
                          { k: 'infants', lbl: t('itin_infants'), sub: t('itin_infants_sub') },
                        ].map(x => (
                          <div key={x.k} className="form-counter">
                            <div>
                              <div className="name">{x.lbl}</div>
                              <div className="sub">{x.sub}</div>
                            </div>
                            <div className="counter-btns">
                              <button type="button" onClick={() => updTrav(x.k, -1)}><If.Minus /></button>
                              <span className="val">{data.travellers[x.k]}</span>
                              <button type="button" onClick={() => updTrav(x.k, 1)}><If.Plus /></button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <h3 className="itin-q" style={{ marginTop: 28 }}>
                        {ctx.lang === 'no' ? 'Har du allerede bestilt noe?' : ctx.lang === 'fr' ? 'Avez-vous déjà réservé quelque chose ?' : 'Have you already booked anything?'}
                      </h3>
                      <div className="already-booked-group">
                        <label className="already-booked-check">
                          <input type="checkbox" checked={data.bookedAccom} onChange={e => upd('bookedAccom', e.target.checked)} />
                          <span>{ctx.lang === 'no' ? 'Overnatting allerede bestilt' : 'Accommodation already booked'}</span>
                        </label>
                        {data.bookedAccom && (
                          <div className="fld" style={{ marginTop: 8 }}>
                            <label>{ctx.lang === 'no' ? 'Hotell / riad / adresse' : 'Hotel / riad / address'}</label>
                            <input value={data.bookedAccomAddr} onChange={e => upd('bookedAccomAddr', e.target.value)} placeholder={ctx.lang === 'no' ? 'Navn eller adresse' : 'Name or address'} />
                          </div>
                        )}
                        <label className="already-booked-check" style={{ marginTop: 8 }}>
                          <input type="checkbox" checked={data.bookedTransport} onChange={e => upd('bookedTransport', e.target.checked)} />
                          <span>{ctx.lang === 'no' ? 'Transport / flyplassoverføring allerede bestilt' : 'Transport / airport transfer already booked'}</span>
                        </label>
                        <label className="already-booked-check" style={{ marginTop: 8 }}>
                          <input type="checkbox" checked={data.bookedActivities} onChange={e => upd('bookedActivities', e.target.checked)} />
                          <span>{ctx.lang === 'no' ? 'Aktiviteter allerede bestilt' : 'Activities already booked'}</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {show('style') && (
                    <div>
                      <h3 className="itin-q">{t('itin_step_stay')}</h3>
                      <div className="opt-grid">
                        <OptCard field="accommodation" value="riad" ttl={t('itin_acc_riad')} ico={<If.Bed />} />
                        <OptCard field="accommodation" value="luxury" ttl={t('itin_acc_luxury')} ico={<If.Sparkle />} />
                        <OptCard field="accommodation" value="villa" ttl={t('itin_acc_villa')} ico={<If.Bed />} />
                        <OptCard field="accommodation" value="camp" ttl={t('itin_acc_camp')} ico={<If.Tent />} />
                        <OptCard field="accommodation" value="mix" ttl={t('itin_acc_mix')} ico={<If.Compass />} />
                        <OptCard field="accommodation" value="surprise" ttl={t('itin_acc_surprise')} ico={<If.Star />} />
                      </div>
                      <h3 className="itin-q" style={{ marginTop: 28 }}>
                        {t('itin_budget')}
                      </h3>
                      <div className="opt-grid">
                        <OptCard field="budget" value="mid" ttl={ctx.lang === 'no' ? 'Komfort' : ctx.lang === 'fr' ? 'Confort' : 'Comfort'} sub={ctx.lang === 'no' ? 'Boutique riader & god service' : 'Boutique riads & great service'} />
                        <OptCard field="budget" value="premium" ttl="Premium" sub={ctx.lang === 'no' ? 'Eksklusivt utvalg & oppgraderinger' : 'Exclusive picks & upgrades'} />
                        <OptCard field="budget" value="luxury" ttl={ctx.lang === 'no' ? 'Luksus' : 'Luxury'} sub={ctx.lang === 'no' ? 'Ingen kompromisser' : 'No compromises'} />
                      </div>
                    </div>
                  )}

                  {show('style') && (() => {
                    const D = window.MS_DATA || {};
                    const cars = D.TRANSPORT || [];
                    return (
                      <div style={{ marginTop: 24 }}>
                        <h3 className="itin-q">
                          {ctx.lang === 'no' ? 'Transport' : 'Transport'}
                        </h3>
                        <div className="opt-grid">
                          <OptCard field="transport" value="driver-sedan"
                            ttl={ctx.lang === 'no' ? 'Sjåfør — Sedan' : ctx.lang === 'fr' ? 'Chauffeur — Berline' : 'Driver — Sedan'}
                            sub={ctx.lang === 'no' ? '3–4 reisende' : '3–4 travellers'}
                            ico={<If.Plane />} />
                          <OptCard field="transport" value="driver-van"
                            ttl={ctx.lang === 'no' ? 'Sjåfør — Van' : ctx.lang === 'fr' ? 'Chauffeur — Van' : 'Driver — Van'}
                            sub={ctx.lang === 'no' ? 'Velg antall seter' : 'Pick seats'}
                            ico={<If.Tent />} />
                          <OptCard field="transport" value="rental"
                            ttl={ctx.lang === 'no' ? 'Leiebil' : ctx.lang === 'fr' ? 'Voiture de location' : 'Rental car'}
                            sub={ctx.lang === 'no' ? 'Velg fra vår flåte' : 'Pick from our fleet'}
                            ico={<If.Compass />} />
                        </div>

                        {data.transport === 'driver-van' && (
                          <div className="form-counter" style={{ marginTop: 14 }}>
                            <div>
                              <div className="name">{ctx.lang === 'no' ? 'Seter i van' : ctx.lang === 'fr' ? 'Places dans le van' : 'Van seats'}</div>
                              <div className="sub">{ctx.lang === 'no' ? '7, 9, 12, 17…' : '7, 9, 12, 17…'}</div>
                            </div>
                            <div className="counter-btns">
                              <button type="button" onClick={() => upd('vanSeats', Math.max(4, data.vanSeats - 1))}><If.Minus /></button>
                              <span className="val">{data.vanSeats}</span>
                              <button type="button" onClick={() => upd('vanSeats', Math.min(22, data.vanSeats + 1))}><If.Plus /></button>
                            </div>
                          </div>
                        )}

                        {data.transport === 'rental' && (
                          <div className="rental-grid">
                            {cars.map((c, i) => (
                              <button type="button" key={i}
                                className={`rental-card ${data.rentalCar === c.name ? 'active' : ''}`}
                                onClick={() => upd('rentalCar', c.name)}>
                                <img src={c.img} alt={c.name} loading="lazy"
                                  onError={e => { e.currentTarget.style.display = 'none'; }} />
                                <div className="rental-card-body">
                                  <div className="rental-card-name">{c.name}</div>
                                  <div className="rental-card-spec">{c.cuisine}</div>
                                  <div className="rental-card-price">{c.price}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {show('style') && (
                    <div style={{ marginTop: 24 }}>
                      <h3 className="itin-q">{t('itin_step_pace')}</h3>
                      <div className="opt-grid">
                        <OptCard field="pace" value="slow" ttl={t('itin_pace_slow')} sub={t('itin_pace_slow_sub')} />
                        <OptCard field="pace" value="balanced" ttl={t('itin_pace_balanced')} sub={t('itin_pace_balanced_sub')} />
                        <OptCard field="pace" value="packed" ttl={t('itin_pace_packed')} sub={t('itin_pace_packed_sub')} />
                      </div>
                    </div>
                  )}

                  {show('taste') && (() => {
                    const D = window.MS_DATA || {};
                    if (!data.duration || data.duration < 1) {
                      return (
                        <div>
                          <h3 className="itin-q">{t('itin_step_int')}</h3>
                          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                            {ctx.lang === 'no'
                              ? '← Gå tilbake til Når-steget og velg en periode først, så fyller du reisen dag for dag her.'
                              : '← Go back to the When step and pick a date range first — then fill your trip day by day here.'}
                          </p>
                        </div>
                      );
                    }
                    const totalDays = data.duration;
                    const curDay = Math.min(activeDay, totalDays - 1);
                    const day = data.daySchedule[curDay] || { activities: [], wellness: [], pool: [], restaurant: '' };
                    const dayDate = data.startDate ? (() => {
                      const d = new Date(data.startDate);
                      d.setDate(d.getDate() + curDay);
                      return d.toLocaleDateString(ctx.lang === 'no' ? 'no-NO' : ctx.lang === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                    })() : '';

                    const FIRST = 6;
                    const Chip = ({ slot, value, label, active }) => (
                      <button type="button"
                        className={`taste-chip ${active ? 'active' : ''}`}
                        onClick={() => dayPick(curDay, slot, value)}>
                        {label}
                      </button>
                    );
                    const Section = ({ id, title, meta, items, slot, picked }) => {
                      const key = `${id}-${curDay}`;
                      const open = !!smakOpen[key];
                      const shown = open ? items : items.slice(0, FIRST);
                      const more = items.length - FIRST;
                      return (
                        <div className="taste-section">
                          <div className="taste-section-h">
                            {title}
                            {meta != null && <span className="taste-section-meta">{meta}</span>}
                          </div>
                          <div className={`taste-chips ${open ? 'open' : ''}`}>
                            {shown.map((it, i) => (
                              <Chip key={i} slot={slot} value={it.v} label={it.label}
                                active={slot === 'restaurant' ? picked === it.v : (picked || []).includes(it.v)} />
                            ))}
                          </div>
                          {more > 0 && (
                            <button type="button" className="taste-more" onClick={() => toggleSmak(key)}>
                              {open
                                ? (ctx.lang === 'no' ? 'Vis færre' : 'Show less')
                                : (ctx.lang === 'no' ? `Vis flere (+${more})` : `Show more (+${more})`)}
                            </button>
                          )}
                        </div>
                      );
                    };
                    const restaurantStyles = [
                      { v: 'r:traditional',  label: ctx.lang === 'no' ? '🍲 Tradisjonell marokkansk' : '🍲 Traditional Moroccan' },
                      { v: 'r:fine',         label: ctx.lang === 'no' ? '🍷 Fine dining'             : '🍷 Fine dining' },
                      { v: 'r:rooftop',      label: ctx.lang === 'no' ? '🌇 Tak / terrasse'          : '🌇 Rooftop / terrasse' },
                      { v: 'r:festive',      label: ctx.lang === 'no' ? '🎉 Festlig'                 : '🎉 Festive' },
                      { v: 'r:international',label: ctx.lang === 'no' ? '🌍 Internasjonal'           : '🌍 International' },
                      { v: 'r:asian',        label: ctx.lang === 'no' ? '🥢 Asiatisk'                : '🥢 Asian' },
                      { v: 'r:brunch',       label: ctx.lang === 'no' ? '🥐 Brunsj & kafé'           : '🥐 Brunch & café' },
                      { v: 'r:bar',          label: ctx.lang === 'no' ? '🍸 Bar & lounge'            : '🍸 Bar & lounge' },
                      { v: 'r:club',         label: ctx.lang === 'no' ? '🌙 Nattklubb'               : '🌙 Nightclub' },
                    ];
                    const acts  = (D.ACTIVITIES || []).map(a => ({ v: `a:${a.name}`, label: a.name }));
                    const wellness = [
                      { v: 'spa-hammam',  label: '🛁 Hammam' },
                      { v: 'spa-massage', label: ctx.lang === 'no' ? '💆 Massasje' : '💆 Massage' },
                      { v: 'spa-beauty',  label: ctx.lang === 'no' ? '💅 Skjønnhetssalong' : '💅 Beauty salon' },
                      { v: 'spa-yoga',    label: ctx.lang === 'no' ? '🧘 Yoga / meditasjon' : '🧘 Yoga / meditation' },
                    ];
                    const agafayPool = [
                      ...(D.CAMPS || []).map(c => ({ v: `c:${c.name}`, label: `🏜️ ${c.name}` })),
                      ...(D.POOLS || []).map(p => ({ v: `p:${p.name}`, label: `☀️ ${p.name}` })),
                    ];

                    return (
                      <div>
                        <h3 className="itin-q">
                          {ctx.lang === 'no' ? 'Fyll inn dag for dag' : ctx.lang === 'fr' ? 'Remplissez jour par jour' : 'Fill the trip day by day'}
                        </h3>

                        <div className="day-nav">
                          <button type="button" className="day-nav-arrow"
                            onClick={() => setActiveDay(d => Math.max(0, d - 1))}
                            disabled={curDay === 0}>‹</button>
                          <div className="day-nav-pills">
                            {Array.from({ length: totalDays }, (_, i) => {
                              const dd = data.daySchedule[i];
                              const filled = dd && (dd.activities.length || dd.wellness.length || dd.pool.length || dd.restaurant);
                              return (
                                <button key={i} type="button"
                                  className={`day-nav-pill ${i === curDay ? 'active' : ''} ${filled ? 'filled' : ''}`}
                                  onClick={() => setActiveDay(i)}>
                                  {ctx.lang === 'no' ? `Dag ${i + 1}` : `Day ${i + 1}`}
                                </button>
                              );
                            })}
                          </div>
                          <button type="button" className="day-nav-arrow"
                            onClick={() => setActiveDay(d => Math.min(totalDays - 1, d + 1))}
                            disabled={curDay >= totalDays - 1}>›</button>
                        </div>

                        <p className="day-meta">
                          {ctx.lang === 'no' ? `Dag ${curDay + 1} av ${totalDays}` : `Day ${curDay + 1} of ${totalDays}`}
                          {dayDate && ` · ${dayDate}`}
                        </p>

                        <Section id="acts"     items={acts}        meta={acts.length}        slot="activities" picked={day.activities}
                          title={ctx.lang === 'no' ? '🎯 Aktiviteter' : '🎯 Activities'} />
                        <Section id="wellness" items={wellness}                              slot="wellness"   picked={day.wellness}
                          title={ctx.lang === 'no' ? '💆 Velvære' : '💆 Wellness'} />
                        <Section id="ap"       items={agafayPool}  meta={agafayPool.length}  slot="pool"       picked={day.pool}
                          title={ctx.lang === 'no' ? '🏜️☀️ Agafay & bassenger' : '🏜️☀️ Agafay & pools'} />
                        <Section id="rest"     items={restaurantStyles}                       slot="restaurant" picked={day.restaurant}
                          title={ctx.lang === 'no' ? '🍽️ Middag — restaurant-stil' : '🍽️ Dinner — restaurant style'} />
                      </div>
                    );
                  })()}

                  {show('extra') && (
                    <div>
                      <h3 className="itin-q">{t('itin_step_extra')}</h3>
                      <div className="fld">
                        <label>{t('itin_special')}</label>
                        <input value={data.occasion} onChange={e => upd('occasion', e.target.value)} placeholder={t('itin_special_ph')} />
                      </div>
                      <div className="fld">
                        <label>{t('itin_avoid')}</label>
                        <textarea rows="2" value={data.avoid} onChange={e => upd('avoid', e.target.value)} placeholder={t('itin_avoid_ph')} />
                      </div>
                      <div className="fld">
                        <label>{t('itin_notes')}</label>
                        <textarea rows="3" value={data.notes} onChange={e => upd('notes', e.target.value)} placeholder={t('itin_notes_ph')} />
                      </div>
                    </div>
                  )}

                  {show('send') && (
                    <div>
                      <h3 className="itin-q">
                        {ctx.lang === 'no' ? 'Klar til å sende' : ctx.lang === 'fr' ? 'Prêt à envoyer' : 'Ready to send'}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 14px' }}>
                        {ctx.lang === 'no'
                          ? 'Sjekk reiseplanen til høyre. Vi tar kontakt innen 24 timer og foredler detaljene sammen med deg.'
                          : ctx.lang === 'fr'
                            ? 'Vérifiez l\'itinéraire à droite. Nous vous répondons sous 24 h pour affiner ensemble.'
                            : 'Review your trip on the right. We reply within 24 hours and refine the details with you.'}
                      </p>
                      <ul style={{ fontSize: 13, color: 'var(--ink)', paddingLeft: 18, lineHeight: 1.7 }}>
                        <li>{ctx.lang === 'no' ? '✅ Vi svarer innen 24 timer' : '✅ We reply within 24 hours'}</li>
                        <li>{ctx.lang === 'no' ? '✅ Ingen forskudd kreves' : '✅ No prepayment required'}</li>
                        <li>{ctx.lang === 'no' ? '✅ Du kan endre alt før bekreftelse' : '✅ You can change everything before confirming'}</li>
                      </ul>
                    </div>
                  )}

                  {show('contact') && (
                    <div>
                      <h3 className="itin-q">{t('itin_step_contact')}</h3>
                      <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '-8px 0 14px', fontStyle: 'italic' }}>
                        {ctx.lang === 'no' ? 'Vi bruker dette til å sende deg reiseplanen og holde kontakt.' : ctx.lang === 'fr' ? 'Pour vous envoyer l\'itinéraire et rester en contact.' : 'So we can send you the trip and stay in touch.'}
                      </p>
                      <div className="fld-row">
                        <div className="fld">
                          <label>{t('itin_name')}</label>
                          <input autoComplete="name" value={data.name} onChange={e => upd('name', e.target.value)} placeholder="Fullt navn" />
                        </div>
                        <div className="fld">
                          <label>{t('itin_country')}</label>
                          <input autoComplete="country-name" value={data.country} onChange={e => upd('country', e.target.value)} placeholder="Norge" />
                        </div>
                      </div>
                      <div className="fld">
                        <label>{t('itin_email')}</label>
                        <input type="email" autoComplete="email" value={data.email} onChange={e => upd('email', e.target.value)} placeholder="you@example.com" />
                      </div>
                      <div className="fld">
                        <label>{t('itin_phone')}</label>
                        <input type="tel" autoComplete="tel" value={data.phone} onChange={e => upd('phone', e.target.value)} placeholder="+47 ..." />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-nav">
                  <button className="btn btn-outline" onClick={prev} disabled={step === 0}
                    style={{ opacity: step === 0 ? .4 : 1 }}>
                    <If.Arrow s={14} dir={180} /> {t('itin_back')}
                  </button>
                  <div className="progress">{t('itin_step')} {step + 1} {t('itin_of')} {steps.length}</div>
                  {step < steps.length - 1 ? (
                    <button className="btn btn-primary" onClick={next}>
                      {t('itin_next')} <If.Arrow s={14} />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline" onClick={send} title="Email"
                        disabled={!data.name.trim() || !data.email.trim()}>
                        <If.Mail s={14} />
                      </button>
                      <button className="btn btn-primary" onClick={sendWhatsapp}
                        disabled={!data.name.trim() || !data.email.trim()}>
                        {ctx.lang === 'no' ? 'Send via WhatsApp' : ctx.lang === 'fr' ? 'Envoyer par WhatsApp' : 'Send via WhatsApp'} →
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {sent && (
              <div className="form-success">
                <div className="check"><If.Check s={36} /></div>
                <h4 className="serif" style={{ fontSize: 36, margin: '0 0 12px', fontWeight: 400, letterSpacing: '-0.02em' }}>
                  {t('itin_sent_title')}
                </h4>
                <p style={{ color: 'var(--ink-3)', maxWidth: 460, margin: '0 auto 28px' }}>
                  {t('itin_sent_sub')}
                </p>
                <button className="btn btn-ink" onClick={() => { setSent(false); setStep(0); }}>{t('itin_sent_again')}</button>
              </div>
            )}
          </div>

          {/* RIGHT: animated timeline preview */}
          <div className="itin-preview">
            {/* floating travel emojis background */}
            <div className="itin-floats" aria-hidden="true">
              {FLOAT_EMOJIS.map((e, i) => (
                <span key={i} className="itin-float" style={{
                  left: `${5 + (i * 6.2) % 90}%`,
                  animationDuration: `${8 + (i * 1.3) % 10}s`,
                  animationDelay: `${(i * 0.7) % 6}s`,
                  fontSize: `${14 + (i * 2) % 12}px`,
                }}>{e}</span>
              ))}
            </div>

            {(() => {
              const hasDates = !!(data.startDate && data.endDate);
              const totalPax = data.travellers.adults + data.travellers.children + data.travellers.infants;
              const hasAnyChoice = hasDates || totalPax > 0 || data.tripType || data.accommodation || data.budget || data.pace || data.transport || data.interests.length || data.multiCity || data.arriveCity || data.departCity || data.name || data.email;
              const fmtDate = (d) => d ? new Date(d).toLocaleDateString(ctx.lang === 'no' ? 'no-NO' : ctx.lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' }) : '';
              const tripLabel = { solo: ctx.lang === 'no' ? 'Solo' : 'Solo', couple: ctx.lang === 'no' ? 'Par' : 'Couple', family: ctx.lang === 'no' ? 'Familie' : 'Family', group: ctx.lang === 'no' ? 'Gruppe' : 'Group', team: 'Team building', wedding: ctx.lang === 'no' ? 'Bryllup' : 'Wedding' }[data.tripType];
              const accLabel = { riad: 'Riad', luxury: ctx.lang === 'no' ? 'Luksushotell' : 'Luxury hotel', villa: ctx.lang === 'no' ? 'Privat villa' : 'Private villa', camp: ctx.lang === 'no' ? 'Ørkenleir' : 'Desert camp', mix: ctx.lang === 'no' ? 'Bland det' : 'Mix', surprise: ctx.lang === 'no' ? 'Overrask oss' : 'Surprise' }[data.accommodation];
              const budgetLabel = { mid: ctx.lang === 'no' ? 'Komfort' : 'Comfort', premium: 'Premium', luxury: ctx.lang === 'no' ? 'Luksus' : 'Luxury' }[data.budget];
              const paceLabel = { slow: ctx.lang === 'no' ? 'Rolig' : 'Slow', balanced: ctx.lang === 'no' ? 'Balansert' : 'Balanced', packed: ctx.lang === 'no' ? 'Pakket' : 'Packed' }[data.pace];
              const transportLabel = {
                'driver-sedan': ctx.lang === 'no' ? 'Sjåfør · Sedan' : 'Driver · Sedan',
                'driver-van':   ctx.lang === 'no' ? `Sjåfør · Van (${data.vanSeats} seter)` : `Driver · Van (${data.vanSeats} seats)`,
                'rental':       data.rentalCar ? `${ctx.lang === 'no' ? 'Leiebil' : 'Rental'} · ${data.rentalCar}` : (ctx.lang === 'no' ? 'Leiebil' : 'Rental car'),
              }[data.transport];
              const hasContact = !!(data.name || data.email || data.phone || data.country);

              // Map specific lodge names → generic city/area tag for the preview
              const genericStay = (key) => {
                if (['atlas'].includes(key)) return ctx.lang === 'no' ? 'Lodge i Atlas' : 'Lodge in Atlas';
                if (['agafay'].includes(key)) return ctx.lang === 'no' ? 'Leir i Agafay' : 'Camp in Agafay';
                if (['sahara'].includes(key)) return ctx.lang === 'no' ? 'Leir i Sahara' : 'Camp in Sahara';
                if (['imperial'].includes(key)) return ctx.lang === 'no' ? 'Riad i Fes' : 'Riad in Fes';
                if (['essaouira'].includes(key)) return ctx.lang === 'no' ? 'Riad i Essaouira' : 'Riad in Essaouira';
                return ctx.lang === 'no' ? 'Riad i Marrakech' : 'Riad in Marrakech';
              };

              return (
                <>
                  {hasContact && (
                    <div className="itin-contact-card">
                      <div className="itin-contact-avatar">
                        {(data.name || data.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="itin-contact-meta">
                        <strong>{data.name || (ctx.lang === 'no' ? 'Gjest' : 'Guest')}</strong>
                        {data.email && <span>📧 {data.email}</span>}
                        {data.phone && <span>📞 {data.phone}</span>}
                        {data.country && <span>🌍 {data.country}</span>}
                      </div>
                    </div>
                  )}

                  <div className="itin-preview-head">
                    <div>
                      <div className="eyebrow" style={{ color: '#fff', opacity: .7 }}>{t('itin_preview_title')}</div>
                      <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, margin: '6px 0 0', letterSpacing: '-0.01em' }}>
                        {hasDates ? (
                          <>
                            {data.duration} {durLabel(data.duration, ctx.lang)}
                            {totalPax > 0 && <> · <em style={{ fontStyle: 'italic', color: '#ffae7c' }}>{totalPax} {ctx.lang === 'no' ? 'reisende' : ctx.lang === 'fr' ? 'voyageurs' : 'travellers'}</em></>}
                          </>
                        ) : (
                          <em style={{ fontStyle: 'italic', color: '#ffae7c', fontSize: 20 }}>
                            {ctx.lang === 'no' ? 'Velg dato…' : ctx.lang === 'fr' ? 'Choisir la date…' : 'Pick your dates…'}
                          </em>
                        )}
                      </h3>
                      <p style={{ fontSize: 13, opacity: .65, margin: '6px 0 0' }}>{t('itin_preview_sub')}</p>
                    </div>
                    {hasDates && (
                      <div className="itin-preview-meta">
                        <div>
                          <span className="lbl">{t('itin_preview_arrival')}</span>
                          <span className="val">{fmtDate(data.startDate)}</span>
                        </div>
                        <div>
                          <span className="lbl">{t('itin_preview_departure')}</span>
                          <span className="val">{fmtDate(data.endDate)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!hasAnyChoice && (
                    <div className="itin-empty">
                      <span className="itin-empty-icon">🗺️</span>
                      <p>{ctx.lang === 'no' ? 'Reiseplanen din vises her — start med å velge dato til venstre →' : ctx.lang === 'fr' ? 'Votre itinéraire apparaîtra ici — commencez par choisir une date →' : 'Your itinerary will appear here — start by picking dates on the left →'}</p>
                    </div>
                  )}

                  {hasAnyChoice && (
                    <div className="itin-summary">
                      {(data.arriveCity || data.departCity) && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '✈️ Fly' : '✈️ Flights'}</span>
                          <span className="itin-sum-v">
                            {data.arriveCity || '—'} → {data.departCity || data.arriveCity || '—'}
                          </span>
                        </div>
                      )}
                      {tripLabel && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '👤 Type' : '👤 Trip'}</span>
                          <span className="itin-sum-v">{tripLabel}</span>
                        </div>
                      )}
                      {totalPax > 0 && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '🧳 Reisende' : '🧳 Travellers'}</span>
                          <span className="itin-sum-v">
                            {data.travellers.adults > 0 && `${data.travellers.adults} ${ctx.lang === 'no' ? 'voksne' : 'adults'}`}
                            {data.travellers.children > 0 && `, ${data.travellers.children} ${ctx.lang === 'no' ? 'barn' : 'children'}`}
                            {data.travellers.infants > 0 && `, ${data.travellers.infants} ${ctx.lang === 'no' ? 'spedbarn' : 'infants'}`}
                          </span>
                        </div>
                      )}
                      {accLabel && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '🏨 Overnatting' : '🏨 Stay'}</span>
                          <span className="itin-sum-v">{accLabel}</span>
                        </div>
                      )}
                      {budgetLabel && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '💎 Budsjett' : '💎 Budget'}</span>
                          <span className="itin-sum-v">{budgetLabel}</span>
                        </div>
                      )}
                      {transportLabel && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '🚗 Transport' : '🚗 Transport'}</span>
                          <span className="itin-sum-v">{transportLabel}</span>
                        </div>
                      )}
                      {paceLabel && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '⚡ Tempo' : '⚡ Pace'}</span>
                          <span className="itin-sum-v">{paceLabel}</span>
                        </div>
                      )}
                      {data.multiCity && data.stops.length > 0 && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '📍 Byer' : '📍 Cities'}</span>
                          <span className="itin-sum-v">
                            {data.stops.map(s => `${s.city} (${s.nights}n)`).join(' → ')}
                          </span>
                        </div>
                      )}
                      {data.interests.length > 0 && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '✨ Interesser' : '✨ Interests'}</span>
                          <span className="itin-sum-v">
                            {data.interests.length} {ctx.lang === 'no' ? 'valgt' : ctx.lang === 'fr' ? 'sélectionnés' : 'picked'}
                          </span>
                        </div>
                      )}
                      {data.occasion && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '🎉 Anledning' : '🎉 Occasion'}</span>
                          <span className="itin-sum-v">{data.occasion}</span>
                        </div>
                      )}
                      {data.notes && (
                        <div className="itin-sum-row">
                          <span className="itin-sum-k">{ctx.lang === 'no' ? '📝 Notater' : '📝 Notes'}</span>
                          <span className="itin-sum-v">{data.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {hasDates && (() => {
                    const stripPrefix = (v) => v.replace(/^[a-z]+:/, '');
                    const restLabel = (v) => ({
                      'r:traditional': ctx.lang === 'no' ? 'Tradisjonell marokkansk' : 'Traditional Moroccan',
                      'r:fine':        'Fine dining',
                      'r:rooftop':     ctx.lang === 'no' ? 'Tak / terrasse' : 'Rooftop / terrasse',
                      'r:festive':     ctx.lang === 'no' ? 'Festlig' : 'Festive',
                      'r:international': ctx.lang === 'no' ? 'Internasjonal' : 'International',
                      'r:asian':       ctx.lang === 'no' ? 'Asiatisk' : 'Asian',
                      'r:brunch':      ctx.lang === 'no' ? 'Brunsj / kafé' : 'Brunch / café',
                      'r:bar':         'Bar & lounge',
                      'r:club':        ctx.lang === 'no' ? 'Nattklubb' : 'Nightclub',
                    }[v] || stripPrefix(v));
                    const wellnessLabel = (v) => ({
                      'spa-hammam':  'Hammam',
                      'spa-massage': ctx.lang === 'no' ? 'Massasje' : 'Massage',
                      'spa-beauty':  ctx.lang === 'no' ? 'Skjønnhetssalong' : 'Beauty salon',
                      'spa-yoga':    'Yoga',
                    }[v] || stripPrefix(v));

                    const hasAnyDayPick = data.daySchedule.some(d => d && (d.activities?.length || d.wellness?.length || d.pool?.length || d.restaurant));
                    if (!hasAnyDayPick) {
                      return (
                        <div className="itin-empty-soft">
                          {ctx.lang === 'no' ? '→ Gå til Smak-steget og fyll inn dagene dine' : '→ Go to the Taste step to fill in your days'}
                        </div>
                      );
                    }
                    return (
                      <div className="itin-tl">
                        {Array.from({ length: data.duration }, (_, i) => {
                          const day = data.daySchedule[i] || { activities: [], wellness: [], pool: [], restaurant: '' };
                          const isEmpty = !(day.activities.length || day.wellness.length || day.pool.length || day.restaurant);
                          const dayDate = new Date(data.startDate);
                          dayDate.setDate(dayDate.getDate() + i);
                          const dateStr = dayDate.toLocaleDateString(ctx.lang === 'no' ? 'no-NO' : ctx.lang === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                          const stayKey = day.pool.find(p => p.startsWith('c:')) ? 'agafay' : 'marrakech';
                          return (
                            <div key={i} className="itin-tl-row" style={{ animationDelay: `${i * 60}ms` }}>
                              <div className="itin-tl-spine">
                                <div className="itin-tl-dot">{isEmpty ? '·' : '✦'}</div>
                                {i < data.duration - 1 && <div className="itin-tl-line"></div>}
                              </div>
                              <div className="itin-tl-card">
                                <div className="itin-tl-card-top">
                                  <span className="itin-tl-day-num">
                                    {ctx.lang === 'no' ? 'Dag' : 'Day'} {i + 1}
                                  </span>
                                  <span className="itin-tl-date">{dateStr}</span>
                                </div>
                                {isEmpty ? (
                                  <div className="itin-tl-desc" style={{ fontStyle: 'italic', opacity: .6 }}>
                                    {ctx.lang === 'no' ? 'Ingen valg ennå' : 'Nothing picked yet'}
                                  </div>
                                ) : (
                                  <>
                                    {day.activities.length > 0 && (
                                      <div className="itin-day-block">
                                        <div className="itin-day-label">🎯 {ctx.lang === 'no' ? 'Aktiviteter' : 'Activities'}</div>
                                        <div className="itin-card-chips">
                                          {day.activities.map((v, j) => <span key={j} className="itin-chip">{stripPrefix(v)}</span>)}
                                        </div>
                                      </div>
                                    )}
                                    {day.wellness.length > 0 && (
                                      <div className="itin-day-block">
                                        <div className="itin-day-label">💆 {ctx.lang === 'no' ? 'Velvære' : 'Wellness'}</div>
                                        <div className="itin-card-chips">
                                          {day.wellness.map((v, j) => <span key={j} className="itin-chip">{wellnessLabel(v)}</span>)}
                                        </div>
                                      </div>
                                    )}
                                    {day.pool.length > 0 && (
                                      <div className="itin-day-block">
                                        <div className="itin-day-label">🏜️☀️ {ctx.lang === 'no' ? 'Agafay / Basseng' : 'Agafay / Pool'}</div>
                                        <div className="itin-card-chips">
                                          {day.pool.map((v, j) => <span key={j} className="itin-chip">{stripPrefix(v)}</span>)}
                                        </div>
                                      </div>
                                    )}
                                    {day.restaurant && (
                                      <div className="itin-day-block">
                                        <div className="itin-day-label">🍽️ {ctx.lang === 'no' ? 'Middag' : 'Dinner'}</div>
                                        <div className="itin-card-chips">
                                          <span className="itin-chip">{restLabel(day.restaurant)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                                <div className="itin-tl-stay">
                                  <If.Bed s={11} /> {genericStay(stayKey)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

window.MS_Form = ItineraryBuilder;
