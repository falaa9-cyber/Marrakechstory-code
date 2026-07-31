const { useState: useSF, useEffect: useEF, useMemo: useMF, useRef: useRF } = React;
const If = window.MS_I;
function loadScriptTag(src) {
  return new Promise((resolve, reject) => {
    const abs = new URL(src, window.location.href).toString();
    const existing = Array.from(document.scripts).find((script2) => script2.src === abs);
    if (existing) {
      if (existing.dataset.msLoaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load " + src)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", () => {
      script.dataset.msLoaded = "1";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load " + src)), { once: true });
    document.head.appendChild(script);
  });
}
async function ensureHtml2Pdf() {
  if (window.html2pdf) return window.html2pdf;
  if (!window.__msHtml2pdfPromise) {
    window.__msHtml2pdfPromise = (async () => {
      const sources = [
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
        "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"
      ];
      for (const src of sources) {
        try {
          await loadScriptTag(src);
          if (window.html2pdf) return window.html2pdf;
        } catch (_error) {
        }
      }
      return null;
    })();
  }
  return window.__msHtml2pdfPromise;
}
const ACT_EMOJI = {
  arrival: "\u2708\uFE0F",
  medina: "\u{1F54C}",
  food: "\u{1F37D}\uFE0F",
  agafay: "\u{1F42A}",
  atlas: "\u{1F3D4}\uFE0F",
  spa: "\u{1F6C1}",
  balloon: "\u{1F388}",
  quad: "\u{1F3CD}\uFE0F",
  shopping: "\u{1F6CD}\uFE0F",
  photo: "\u{1F4F8}",
  sahara: "\u{1F335}",
  essaouira: "\u{1F30A}",
  imperial: "\u{1F3DB}\uFE0F",
  pool: "\u2600\uFE0F",
  departure: "\u2708\uFE0F"
};
const ACT_POOL = {
  arrival: {
    title: { no: "Ankomst & velkomst", en: "Arrival & welcome", fr: "Arriv\xE9e & bienvenue" },
    desc: {
      no: "Privat henting p\xE5 flyplassen, innsjekk p\xE5 din riad i medinaen, og myntete p\xE5 taket ved gylne timen.",
      en: "Private airport pickup, check-in at your hand-picked riad in the medina, and mint tea on the rooftop at golden hour.",
      fr: "Accueil priv\xE9 \xE0 l'a\xE9roport, arriv\xE9e dans votre riad de charme au c\u0153ur de la m\xE9dina, th\xE9 \xE0 la menthe sur le toit-terrasse."
    },
    chips: { no: ["Privat transfer", "Riad i medinaen", "Velkomstmiddag"], en: ["Private transfer", "Riad in medina", "Welcome dinner"], fr: ["Transfert priv\xE9", "Riad m\xE9dina", "D\xEEner de bienvenue"] },
    stay: "Riad El Fenn",
    icon: "Plane"
  },
  medina: {
    title: { no: "Medina & paladser", en: "Medina & palaces", fr: "M\xE9dina & palais" },
    desc: {
      no: "En lokal historiker tar deg gjennom Ben Youssef, Bahia-palasset, Saadiernes graver og krydderkvartalet.",
      en: "A local historian walks you through Ben Youssef, Bahia Palace, the Saadian Tombs and the spice quarter.",
      fr: "Un historien local vous guide \xE0 travers Ben Youssef, le palais Bahia, les tombeaux saadiens et le quartier des \xE9pices."
    },
    chips: { no: ["Bahia-palasset", "Ben Youssef", "Souker"], en: ["Bahia Palace", "Ben Youssef", "Souks"], fr: ["Palais Bahia", "Ben Youssef", "Souks"] },
    stay: "Riad El Fenn",
    icon: "Compass"
  },
  food: {
    title: { no: "Matkurs & souk", en: "Cooking class & food souk", fr: "Cours de cuisine & souk" },
    desc: {
      no: "Handle krydder med en lokal kokk, og lag tagine og pastilla i et tradisjonelt hjem.",
      en: "Shop the spice souk with a local chef, then cook a tagine and pastilla in a traditional dar.",
      fr: "Achetez les \xE9pices avec un chef local, puis pr\xE9parez tagine et pastilla dans une dar traditionnelle."
    },
    chips: { no: ["Krydderkurs", "Matlaging", "Pastilla"], en: ["Spice tour", "Cooking class", "Pastilla"], fr: ["Cours d'\xE9pices", "Cuisine", "Pastilla"] },
    stay: "Riad El Fenn",
    icon: "Utensils"
  },
  agafay: {
    title: { no: "Agafay-\xF8rkenen", en: "Agafay stone desert", fr: "D\xE9sert d'Agafay" },
    desc: {
      no: "Kj\xF8r 45 min til Agafay. Kamelritt ved solnedgang og middag rundt b\xE5let under stjernehimmelen.",
      en: "Drive 45min into the Agafay stone desert. Camel sundown and a fire-lit dinner under the stars.",
      fr: "45min jusqu'au d\xE9sert d'Agafay. Coucher de soleil \xE0 dos de chameau et d\xEEner autour du feu sous les \xE9toiles."
    },
    chips: { no: ["Kameltur", "Stjernemiddag", "B\xE5l"], en: ["Camel ride", "Star dinner", "Bonfire"], fr: ["Chameau", "D\xEEner \xE9toil\xE9", "Feu de bois"] },
    stay: "Scarabeo Camp \xB7 Agafay",
    icon: "Tent"
  },
  atlas: {
    title: { no: "Atlasfjellene & berbiske landsbyer", en: "Atlas Mountains & Berber villages", fr: "Atlas & villages berb\xE8res" },
    desc: {
      no: "90 min inn i Atlas. Vandring mellom berbiske landsbyer med hjemmelaget lunsj.",
      en: "90min into the Atlas. Hike between Berber villages with a home-cooked lunch.",
      fr: "1h30 dans l'Atlas. Randonn\xE9e entre villages berb\xE8res avec d\xE9jeuner pr\xE9par\xE9 chez l'habitant."
    },
    chips: { no: ["Vandring", "Lokal lunsj", "Toubkal-utsikt"], en: ["Hike", "Local lunch", "Toubkal viewpoint"], fr: ["Randonn\xE9e", "D\xE9jeuner local", "Vue Toubkal"] },
    stay: "Kasbah du Toubkal",
    icon: "Mountain"
  },
  spa: {
    title: { no: "Hammam & spa", en: "Hammam & spa ritual", fr: "Hammam & rituel spa" },
    desc: {
      no: "Tradisjonell hammam med svart s\xE5pe, peeling og argan-massasje.",
      en: "Traditional hammam \u2014 black soap exfoliation and full argan oil massage.",
      fr: "Hammam traditionnel \u2014 gommage au savon noir et massage \xE0 l'huile d'argan."
    },
    chips: { no: ["Svart s\xE5pe", "Peeling", "Argan-massasje"], en: ["Black soap", "Exfoliation", "Argan massage"], fr: ["Savon noir", "Gommage", "Massage argan"] },
    stay: "Riad El Fenn",
    icon: "Sparkle"
  },
  balloon: {
    title: { no: "Luftballong ved soloppgang", en: "Hot-air balloon at sunrise", fr: "Montgolfi\xE8re au lever du soleil" },
    desc: {
      no: "Lett over Agafay mens Atlas tar imot f\xF8rste lys. Berbisk frokost ved landing.",
      en: "Lift off as the Atlas catches first light. Berber breakfast on landing.",
      fr: "D\xE9collez quand l'Atlas re\xE7oit la premi\xE8re lumi\xE8re. Petit-d\xE9jeuner berb\xE8re \xE0 l'atterrissage."
    },
    chips: { no: ["Soloppgang", "Ballong", "Berbisk frokost"], en: ["Sunrise", "Balloon", "Berber breakfast"], fr: ["Lever du soleil", "Ballon", "Petit-d\xE9jeuner berb\xE8re"] },
    stay: "Riad El Fenn",
    icon: "Sun"
  },
  quad: {
    title: { no: "Quad eller buggy", en: "Quad biking or buggy", fr: "Quad ou buggy" },
    desc: {
      no: "Tre timer i palmeoasen eller Lalla Takerkoust med buggy.",
      en: "Three hours through the palm grove or Lalla Takerkoust by buggy.",
      fr: "Trois heures dans la palmeraie ou \xE0 Lalla Takerkoust en buggy."
    },
    chips: { no: ["Quad", "Off-road", "Palmeoase"], en: ["Quad", "Off-road", "Palm grove"], fr: ["Quad", "Hors-piste", "Palmeraie"] },
    stay: "Riad El Fenn",
    icon: "Compass"
  },
  shopping: {
    title: { no: "Privat shopping i soukene", en: "Private souk shopping", fr: "Shopping priv\xE9 dans les souks" },
    desc: {
      no: "En lokal stylist tar deg til p\xE5litelige h\xE5ndverkere \u2013 tepper, lamper, l\xE6r.",
      en: "A bilingual buyer takes you to her trusted artisans \u2014 rugs, lamps, leather.",
      fr: "Une acheteuse bilingue vous emm\xE8ne chez ses artisans de confiance \u2014 tapis, lampes, cuir."
    },
    chips: { no: ["Tepper", "Lamper", "L\xE6r"], en: ["Rugs", "Lamps", "Leather"], fr: ["Tapis", "Lampes", "Cuir"] },
    stay: "Riad El Fenn",
    icon: "Sparkle"
  },
  photo: {
    title: { no: "Foto-vandring i medinaen", en: "Medina photography walk", fr: "Balade photo dans la m\xE9dina" },
    desc: {
      no: "Tre timer med en lokal fotograf \u2013 skjulte riader, lysrom, fargemakere, taksolnedganger.",
      en: "Three hours with a local photographer \u2014 hidden riads, light pockets, dye-makers, rooftop sunsets.",
      fr: "Trois heures avec un photographe local \u2014 riads cach\xE9s, jeux de lumi\xE8re, teinturiers, couchers de soleil."
    },
    chips: { no: ["Skjulte riader", "Fargemakere", "Tak-solnedgang"], en: ["Hidden riads", "Dye-makers", "Rooftop sunset"], fr: ["Riads cach\xE9s", "Teinturiers", "Couchers de soleil"] },
    stay: "Riad El Fenn",
    icon: "Camera"
  },
  sahara: {
    title: { no: "Sahara \u2013 dyner & luksusleir", en: "Sahara \u2014 dunes & luxury camp", fr: "Sahara \u2014 dunes & camp de luxe" },
    desc: {
      no: "4x4 over Erg Chebbi, kameltur ved solnedgang, middag og trommer ved luksusleir.",
      en: "4x4 across Erg Chebbi, sunset camel trek, dinner and drums at a luxury dune camp.",
      fr: "4x4 sur l'Erg Chebbi, chameau au coucher du soleil, d\xEEner et tambours au camp de luxe."
    },
    chips: { no: ["4x4", "Kameltur", "Luksusleir"], en: ["4x4", "Camel trek", "Luxury camp"], fr: ["4x4", "Caravane", "Camp de luxe"] },
    stay: "Erg Chebbi Luxury Camp",
    icon: "Tent"
  },
  essaouira: {
    title: { no: "Essaouira \u2013 Atlanterhavet", en: "Essaouira \u2014 Atlantic coast", fr: "Essaouira \u2014 c\xF4te atlantique" },
    desc: {
      no: "To timer vest til vindsurf-byen \u2013 fiske-lunsj p\xE5 havna, medina-murer, retur ved solnedgang.",
      en: "2h drive west to the windsurf capital \u2014 fish lunch on the harbour, medina walls, return at sunset.",
      fr: "2h vers l'ouest jusqu'\xE0 la capitale du windsurf \u2014 d\xE9jeuner poissons sur le port, remparts, retour."
    },
    chips: { no: ["Kystkj\xF8ring", "Fiske-lunsj", "Havmurer"], en: ["Coast drive", "Fish lunch", "Sea walls"], fr: ["Route c\xF4ti\xE8re", "D\xE9jeuner poissons", "Remparts"] },
    stay: "Riad El Fenn",
    icon: "Sun"
  },
  imperial: {
    title: { no: "Imperialbyen Fes", en: "Imperial Fes", fr: "F\xE8s, ville imp\xE9riale" },
    desc: {
      no: "Full guidet dag i verdens st\xF8rste bilfrie medina \u2013 garveriene, madrasaene, h\xE5ndverkerne.",
      en: "Full guided day in the world's largest car-free medina \u2014 tanneries, madrasas, artisans.",
      fr: "Journ\xE9e guid\xE9e dans la plus grande m\xE9dina pi\xE9tonne du monde \u2014 tanneries, m\xE9dersas, artisans."
    },
    chips: { no: ["Garverier", "Madrasaer", "H\xE5ndverkere"], en: ["Tanneries", "Madrasas", "Artisans"], fr: ["Tanneries", "M\xE9dersas", "Artisans"] },
    stay: "Riad Fes",
    icon: "Compass"
  },
  pool: {
    title: { no: "Bassengdag p\xE5 Beldi", en: "Pool day at Beldi", fr: "Journ\xE9e piscine \xE0 Beldi" },
    desc: {
      no: "Tre basseng omgitt av olivenlunder og rosenhager. Lang, lat lunsj.",
      en: "Three pools surrounded by olive groves and rose gardens. Long, lazy lunch.",
      fr: "Trois piscines entre oliviers et roseraies. Long d\xE9jeuner langoureux."
    },
    chips: { no: ["3 basseng", "Olivenhage", "Lang lunsj"], en: ["3 pools", "Olive groves", "Long lunch"], fr: ["3 piscines", "Oliviers", "Long d\xE9jeuner"] },
    stay: "Riad El Fenn",
    icon: "Sun"
  },
  departure: {
    title: { no: "Avreise & farvel", en: "Departure & farewell", fr: "D\xE9part & au revoir" },
    desc: {
      no: "Siste shopping, eller en time p\xE5 taket f\xF8r privat transfer til flyplassen.",
      en: "Last-minute shopping, or an hour on the rooftop before a private transfer to the airport.",
      fr: "Derniers achats ou une heure sur le toit avant le transfert priv\xE9 \xE0 l'a\xE9roport."
    },
    chips: { no: ["Fri tid", "Sj\xE5f\xF8r", "Flyplass"], en: ["Free time", "Driver", "Airport"], fr: ["Temps libre", "Chauffeur", "A\xE9roport"] },
    stay: "\u2014",
    icon: "Plane"
  }
};
const FLOAT_EMOJIS = ["\u2708\uFE0F", "\u{1F42A}", "\u{1F305}", "\u{1F54C}", "\u{1F3D4}\uFE0F", "\u{1F388}", "\u{1F6CD}\uFE0F", "\u{1F334}", "\u2B50", "\u{1F30A}", "\u{1F375}", "\u{1F525}", "\u{1F4F8}", "\u{1F3DB}\uFE0F", "\u{1F33A}"];
function buildItinerary(days, interests) {
  if (!days) return [];
  const seq = ["arrival"];
  if (days >= 2) seq.push("medina");
  if (interests.includes("food") && days >= 2) seq.push("food");
  if (days >= 3) seq.push("agafay");
  if ((days >= 4 || interests.includes("hike")) && days >= 4) seq.push("atlas");
  if (interests.includes("balloon") && days >= 4) seq.push("balloon");
  if (interests.includes("photo") && days >= 3) seq.push("photo");
  if (interests.includes("spa") && days >= 3) seq.push("spa");
  if (interests.includes("shop") && days >= 3) seq.push("shopping");
  if (interests.includes("quad") && days >= 4) seq.push("quad");
  if (days >= 6 || interests.includes("coast")) seq.push("essaouira");
  if (days >= 7) {
    seq.push("sahara");
    seq.push("sahara");
  }
  if (days >= 9 || interests.includes("imperial")) seq.push("imperial");
  if (days >= 12) {
    seq.push("imperial");
  }
  if (days >= 14) {
    seq.push("essaouira");
    seq.push("pool");
  }
  if (days >= 18) {
    seq.push("spa");
    seq.push("photo");
    seq.push("shopping");
  }
  if (days >= 22) {
    seq.push("balloon");
    seq.push("atlas");
    seq.push("agafay");
  }
  seq.push("departure");
  const arr = seq[0];
  const dep = seq[seq.length - 1];
  let middle = seq.slice(1, -1);
  const filler = ["medina", "pool", "spa", "food", "shopping", "photo", "agafay", "atlas"];
  let fi = 0;
  while (middle.length < days - 2) {
    middle.push(filler[fi % filler.length]);
    fi++;
  }
  if (middle.length > days - 2) middle = middle.slice(0, days - 2);
  return [arr, ...middle, ...days > 1 ? [dep] : []].map((key) => ({ key }));
}
function RangeCalendar({ start, end, onChange, lang = "no" }) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const initial = start ? new Date(start) : today;
  const [viewMonth, setViewMonth] = useSF(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [hover, setHover] = useSF(null);
  const monthName = (d) => d.toLocaleDateString(
    lang === "no" ? "no-NO" : lang === "fr" ? "fr-FR" : "en-GB",
    { month: "long", year: "numeric" }
  );
  const weekdayLabels = lang === "no" ? ["M", "T", "O", "T", "F", "L", "S"] : lang === "fr" ? ["L", "M", "M", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];
  const buildMonth = (anchor) => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d));
    }
    return cells;
  };
  const fmt = (d) => d ? d.toISOString().slice(0, 10) : "";
  const startD = start ? new Date(start) : null;
  const endD = end ? new Date(end) : null;
  const hoverD = hover ? new Date(hover) : null;
  const cellState = (d) => {
    if (!d) return "";
    if (d < today) return "past";
    const s = fmt(d);
    if (startD && fmt(startD) === s) return "start";
    if (endD && fmt(endD) === s) return "end";
    if (startD && endD && d > startD && d < endD) return "in";
    if (startD && !endD && hoverD && d > startD && d <= hoverD) return "in-hover";
    return "";
  };
  const handleClick = (d) => {
    if (!d || d < today) return;
    if (!startD || startD && endD) {
      onChange(fmt(d), "");
    } else if (d < startD) {
      onChange(fmt(d), "");
    } else {
      onChange(fmt(startD), fmt(d));
    }
  };
  const renderMonth = (anchor) => {
    const cells = buildMonth(anchor);
    return /* @__PURE__ */ React.createElement("div", { className: "rcal-month", key: anchor.getFullYear() + "-" + anchor.getMonth() }, /* @__PURE__ */ React.createElement("div", { className: "rcal-month-head" }, monthName(anchor)), /* @__PURE__ */ React.createElement("div", { className: "rcal-grid" }, weekdayLabels.map((w, i) => /* @__PURE__ */ React.createElement("div", { key: "w" + i, className: "rcal-wd" }, w)), cells.map((d, i) => {
      const state = cellState(d);
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: i,
          type: "button",
          className: `rcal-cell ${state}`,
          disabled: !d || state === "past",
          onClick: () => handleClick(d),
          onMouseEnter: () => d && setHover(fmt(d)),
          onMouseLeave: () => setHover(null)
        },
        d ? d.getDate() : ""
      );
    })));
  };
  const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  return /* @__PURE__ */ React.createElement("div", { className: "rcal" }, /* @__PURE__ */ React.createElement("div", { className: "rcal-bar" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "rcal-nav", onClick: () => {
    const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) setViewMonth(prev);
  } }, "\u2039"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "rcal-nav", onClick: () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)) }, "\u203A")), /* @__PURE__ */ React.createElement("div", { className: "rcal-months" }, renderMonth(viewMonth), renderMonth(next)));
}
function ItineraryBuilder() {
  var _a;
  const { useT, useMS, usePrice, COMPANY } = window.MS_CTX;
  const t = useT();
  const ctx = useMS();
  const price = usePrice();
  const [planShown, setPlanShown] = useSF(false);
  useEF(() => {
    const onOpen = (e) => {
      const d = e && e.detail;
      if (d && typeof d.open === "boolean") setPlanShown(d.open);
    };
    const onCtx = () => setPlanShown(true);
    window.addEventListener("ms:plan-open", onOpen);
    window.addEventListener("ms:booking-context", onCtx);
    return () => {
      window.removeEventListener("ms:plan-open", onOpen);
      window.removeEventListener("ms:booking-context", onCtx);
    };
  }, []);
  const [data, setData] = useSF({
    duration: 0,
    travellers: { adults: 0, children: 0, infants: 0 },
    accommodation: "",
    pace: "",
    interests: [],
    chooseForMe: false,
    occasion: "",
    avoid: "",
    notes: "",
    budget: "",
    startDate: "",
    flex: "flex3",
    name: "",
    email: "",
    phone: "",
    country: "",
    bookedAccom: false,
    bookedAccomAddr: "",
    bookedTransport: false,
    bookedActivities: false,
    endDate: "",
    arriveCity: "",
    departCity: "",
    multiCity: false,
    stops: [],
    tripType: "",
    transport: "",
    vanSeats: 7,
    rentalCar: "",
    flightBooked: "",
    flightDetails: "",
    daySchedule: []
  });
  useEF(() => {
    const user = window.MS_Auth_User;
    let profile = {};
    try {
      profile = JSON.parse(localStorage.getItem("ms_profile_data") || "{}");
    } catch (e) {
    }
    if (!user && !profile.name) return;
    setData((d) => ({
      ...d,
      name: d.name || profile.name || (user == null ? void 0 : user.name) || "",
      email: d.email || profile.email || (user == null ? void 0 : user.email) || "",
      phone: d.phone || profile.phone || "",
      country: d.country || profile.country || (ctx.lang === "no" ? "Norge" : "")
    }));
  }, []);
  const [smakOpen, setSmakOpen] = useSF({});
  const toggleSmak = (key) => setSmakOpen((p) => ({ ...p, [key]: !p[key] }));
  const [activeDay, setActiveDay] = useSF(0);
  const dayPick = (dayIdx, slot, value) => setData((p) => {
    const next2 = [...p.daySchedule];
    while (next2.length <= dayIdx) next2.push({ activities: [], wellness: [], pool: [], restaurant: "" });
    const cur = next2[dayIdx];
    if (slot === "restaurant") {
      next2[dayIdx] = { ...cur, restaurant: cur.restaurant === value ? "" : value };
    } else {
      const list = cur[slot] || [];
      next2[dayIdx] = { ...cur, [slot]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] };
    }
    return { ...p, daySchedule: next2 };
  });
  const [bookingCtx, setBookingCtx] = useSF(() => window.MS_BookingContext || null);
  useEF(() => {
    const sync = () => {
      const c = window.MS_BookingContext;
      if (!c) return;
      setBookingCtx(c);
      setData((d) => {
        let nextNotes = d.notes;
        if (c.needTransport) {
          const line = ctx.lang === "no" ? `Trenger transport (privat sj\xE5f\xF8r) for: ${c.transportItem || c.title || "aktivitet"}.` : ctx.lang === "fr" ? `Transport requis (chauffeur priv\xE9) pour : ${c.transportItem || c.title || "activit\xE9"}.` : `Transport needed (private driver) for: ${c.transportItem || c.title || "activity"}.`;
          if (!nextNotes || !nextNotes.includes(line)) {
            nextNotes = nextNotes ? `${line}
${nextNotes}` : line;
          }
        }
        return {
          ...d,
          duration: c.duration || d.duration,
          tripType: c.tripType || d.tripType,
          notes: nextNotes
        };
      });
      setStep(0);
    };
    sync();
    window.addEventListener("ms:booking-context", sync);
    return () => window.removeEventListener("ms:booking-context", sync);
  }, []);
  const clearBookingCtx = () => {
    window.MS_BookingContext = null;
    setBookingCtx(null);
  };
  const upd = (k, v) => setData((p) => ({ ...p, [k]: v }));
  const toggle = (k, v) => setData((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const updTrav = (k, delta) => setData((p) => ({ ...p, travellers: { ...p.travellers, [k]: Math.max(0, p.travellers[k] + delta) } }));
  const [step, setStep] = useSF(0);
  const [sent, setSent] = useSF(false);
  const allSteps = [
    { id: "contact", label: ctx.lang === "no" ? "Kontakt" : ctx.lang === "fr" ? "Contact" : "Contact" },
    { id: "when", label: ctx.lang === "no" ? "N\xE5r" : ctx.lang === "fr" ? "Quand" : "When" },
    { id: "who", label: ctx.lang === "no" ? "Hvem reiser?" : ctx.lang === "fr" ? "Qui voyage ?" : "Who is going?" },
    { id: "style", label: ctx.lang === "no" ? "Stil" : ctx.lang === "fr" ? "Style" : "Style" },
    { id: "taste", label: ctx.lang === "no" ? "Smak" : ctx.lang === "fr" ? "Go\xFBts" : "Taste" },
    { id: "extra", label: ctx.lang === "no" ? "Det lille ekstra" : ctx.lang === "fr" ? "Le petit plus" : "Little extras" },
    { id: "send", label: ctx.lang === "no" ? "Send" : ctx.lang === "fr" ? "Envoyer" : "Send" }
  ];
  const steps = bookingCtx ? allSteps.filter((s) => ["contact", "when", "send"].includes(s.id)) : allSteps;
  const next = () => {
    const newStep = Math.min(step + 1, steps.length - 1);
    setStep(newStep);
    if (data.email && data.name && window.MS_saveSubscriber) {
      window.MS_saveSubscriber({ name: data.name, email: data.email, phone: data.phone, source: "builder_step" + (step + 1) });
    }
  };
  const buildDailyItinerary = () => {
    const t2 = bookingCtx && bookingCtx.trip;
    if (t2 && Array.isArray(t2.itinerary) && t2.itinerary.length) {
      return t2.itinerary.map((d, i) => ({
        day: d.day || i + 1,
        city: d.route && (d.route[ctx.lang] || d.route.en) || (typeof d.route === "string" ? d.route : ""),
        date: data.startDate ? new Date(new Date(data.startDate).getTime() + i * 864e5).toISOString().slice(0, 10) : "",
        activities: [{ time: "", type: "Plan", details: d.text && (d.text[ctx.lang] || d.text.en) || (typeof d.text === "string" ? d.text : "") }]
      }));
    }
    const out = [];
    const total = data.duration || (data.daySchedule || []).length || 0;
    const strip = (s) => String(s).replace(/^[a-z]:/, "");
    for (let i = 0; i < total; i++) {
      const ds = (data.daySchedule || [])[i] || {};
      const date = data.startDate ? new Date(new Date(data.startDate).getTime() + i * 864e5).toISOString().slice(0, 10) : "";
      const acts = [];
      (ds.activities || []).forEach((a) => acts.push({ time: "", type: "Excursion", details: strip(a) }));
      (ds.wellness || []).forEach((a) => acts.push({ time: "", type: "Spa/Hammam", details: strip(a) }));
      (ds.pool || []).forEach((a) => acts.push({ time: "", type: "Agafay Day Pass", details: strip(a) }));
      if (ds.restaurant) acts.push({ time: "19:00", type: "Restaurant", details: strip(ds.restaurant) });
      if (acts.length === 0 && itinerary[i]) {
        const act = ACT_POOL[itinerary[i].key];
        if (act) acts.push({ time: "", type: "Guided Tour", details: act.title && (act.title[ctx.lang] || act.title.en) || itinerary[i].key });
      }
      out.push({ day: i + 1, city: "", date, activities: acts });
    }
    return out;
  };
  const submittedRef = useRF(false);
  const submitReservation = (via) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (window.MS_submitForm) window.MS_submitForm("itinerary", { ...data, bookingCtx, daily_itinerary: buildDailyItinerary(), summary: buildSummary() }, { via });
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const cid = ((_a = steps[Math.min(step, steps.length - 1)]) == null ? void 0 : _a.id) || "when";
  const show = (...ids) => ids.includes(cid);
  const itinerary = useMF(() => buildItinerary(data.duration, data.interests), [data.duration, data.interests]);
  const generatePDF = () => {
    const totalPax = data.travellers.adults + data.travellers.children + data.travellers.infants;
    const endDate = (() => {
      const d = new Date(data.startDate);
      d.setDate(d.getDate() + data.duration - 1);
      return d.toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" });
    })();
    const startFmt = data.startDate ? new Date(data.startDate).toLocaleDateString("no-NO", { day: "numeric", month: "long", year: "numeric" }) : "\u2014";
    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:720px;margin:0 auto;padding:48px 40px;color:#1a1310;background:#fff;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:36px;padding-bottom:28px;border-bottom:2px solid #e1432a;">
          <div>
            <div style="font-size:28px;font-weight:700;letter-spacing:-0.02em;">Marrakech<em style="font-style:italic;font-weight:400;color:#e1432a;">Story</em></div>
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#6b594d;margin-top:2px;">Premium reise i Marokko</div>
          </div>
        </div>

        <div style="background:#fdfaf6;border-radius:14px;padding:28px 32px;margin-bottom:32px;border:1px solid #ece1d2;">
          <h1 style="font-size:26px;font-weight:700;margin:0 0 6px;letter-spacing:-0.02em;">Reiseplan \u2014 ${data.name || "Gjest"}</h1>
          <div style="font-size:15px;color:#6b594d;">
            ${startFmt} \u2013 ${endDate} \xB7 ${data.duration} dager \xB7 ${totalPax} reisende
          </div>
          <div style="display:flex;gap:24px;margin-top:18px;font-size:13px;">
            <span>\u{1F3E8} ${data.accommodation}</span>
            <span>\u26A1 ${data.pace}</span>
            <span>\u2728 ${data.budget}</span>
          </div>
        </div>

        <h2 style="font-size:16px;font-weight:600;margin:0 0 18px;text-transform:uppercase;letter-spacing:.08em;color:#e1432a;">Dag-for-dag</h2>
        ${itinerary.map((d, i) => {
      const act = ACT_POOL[d.key] || ACT_POOL.medina;
      const dayDate = new Date(data.startDate);
      dayDate.setDate(dayDate.getDate() + i);
      const dateStr = dayDate.toLocaleDateString("no-NO", { weekday: "long", day: "numeric", month: "short" });
      return `
            <div style="display:flex;gap:20px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #ece1d2;">
              <div style="min-width:48px;height:48px;border-radius:50%;background:#e1432a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;">${i + 1}</div>
              <div>
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#6b594d;margin-bottom:2px;">${dateStr}</div>
                <div style="font-size:17px;font-weight:600;margin-bottom:4px;">${act.title[ctx.lang]}</div>
                <div style="font-size:13px;color:#6b594d;line-height:1.5;">${act.desc[ctx.lang]}</div>
                <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                  ${act.chips[ctx.lang].map((c) => `<span style="background:#fbe4dc;color:#e1432a;padding:3px 10px;border-radius:999px;font-size:11px;">${c}</span>`).join("")}
                </div>
              </div>
            </div>
          `;
    }).join("")}

        ${data.notes ? `<div style="background:#fdfaf6;border-radius:10px;padding:20px 24px;margin-top:16px;border:1px solid #ece1d2;"><strong>Notater:</strong> ${data.notes}</div>` : ""}

        <div style="margin-top:40px;padding-top:28px;border-top:1px solid #ece1d2;display:flex;justify-content:space-between;font-size:12px;color:#6b594d;">
          <span>Marrakechstory \xB7 Marrakechstory@outlook.com \xB7 +47 457 74 743</span>
          <span>www.marrakechstory.com</span>
        </div>
      </div>
    `;
    ensureHtml2Pdf().then((html2pdfLib) => {
      if (!html2pdfLib) return;
      const el = document.createElement("div");
      el.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;";
      el.innerHTML = html;
      document.body.appendChild(el);
      const cleanup = () => {
        try {
          document.body.removeChild(el);
        } catch (e) {
        }
      };
      setTimeout(() => {
        html2pdfLib().set({
          margin: 0,
          filename: `Marrakechstory-Reiseplan-${data.name || "gjest"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: 900 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        }).from(el.firstElementChild || el).save().then(cleanup).catch(cleanup);
      }, 60);
    }).catch(() => {
    });
  };
  const buildSummary = () => {
    const totalPax = data.travellers.adults + data.travellers.children + data.travellers.infants;
    const lines = [];
    if (bookingCtx) {
      lines.push(`Reise: ${bookingCtx.title} (${bookingCtx.duration} dager)`);
    } else {
      lines.push(`Varighet: ${data.duration} dager`);
      lines.push(`Stil: ${data.accommodation} \xB7 ${data.pace} \xB7 ${data.budget}`);
      if (data.interests.length) lines.push(`Interesser: ${data.interests.join(", ")}`);
    }
    if (data.chooseForMe) lines.push(`\u2B50 Velg for meg: kunden \xF8nsker at MarrakechStory setter sammen reisen`);
    lines.push(`Reisende: ${data.travellers.adults}v ${data.travellers.children}b ${data.travellers.infants}s (${totalPax} totalt)`);
    lines.push(`Periode: ${data.startDate}${data.endDate ? " \u2192 " + data.endDate : ""} (${data.flex})`);
    lines.push(`Fly: lander i ${data.arriveCity}, hjem fra ${data.departCity}`);
    if (data.occasion) lines.push(`Anledning: ${data.occasion}`);
    if (data.notes) lines.push(`Notater: ${data.notes}`);
    lines.push(`Kontakt: ${data.name} \xB7 ${data.email} \xB7 ${data.phone}`);
    return lines.join("\n");
  };
  const sendWhatsapp = () => {
    const msg = encodeURIComponent(
      (ctx.lang === "no" ? "Hei Marrakechstory! " : "Hi Marrakechstory! ") + (ctx.lang === "no" ? "Jeg vil booke:\n\n" : "I would like to book:\n\n") + buildSummary()
    );
    try {
      const prev2 = JSON.parse(localStorage.getItem("ms_requests") || "[]");
      prev2.unshift({ when: (/* @__PURE__ */ new Date()).toISOString(), via: "whatsapp", ctx: (bookingCtx == null ? void 0 : bookingCtx.title) || null, data });
      localStorage.setItem("ms_requests", JSON.stringify(prev2.slice(0, 20)));
    } catch (e) {
    }
    submitReservation("whatsapp");
    window.open(`https://wa.me/4745774743?text=${msg}`, "_blank");
    setSent(true);
  };
  const saveToProfile = (via) => {
    try {
      const prev2 = JSON.parse(localStorage.getItem("ms_profile_data") || "{}");
      localStorage.setItem("ms_profile_data", JSON.stringify({ ...prev2, name: data.name || prev2.name, email: data.email || prev2.email, phone: data.phone || prev2.phone, country: data.country || prev2.country }));
      const reqs = JSON.parse(localStorage.getItem("ms_requests") || "[]");
      reqs.unshift({ when: (/* @__PURE__ */ new Date()).toISOString(), via, ctx: (bookingCtx == null ? void 0 : bookingCtx.title) || null, data });
      localStorage.setItem("ms_requests", JSON.stringify(reqs.slice(0, 20)));
    } catch (e) {
    }
  };
  const send = () => {
    submitReservation("email");
    saveToProfile("email");
    setSent(true);
    if (window.MS_Auth_PromptAfterBooking) window.MS_Auth_PromptAfterBooking();
  };
  const sendAndRegister = () => {
    send();
    if (!window.MS_Auth_User && window.MS_Auth_Prompt) setTimeout(() => window.MS_Auth_Prompt("register"), 350);
  };
  const OptCard = ({ field, value, ttl, sub, ico, multi }) => {
    const isActive = multi ? data[field].includes(value) : data[field] === value;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `opt-card ${isActive ? "active" : ""}`,
        onClick: () => multi ? toggle(field, value) : upd(field, value)
      },
      ico && /* @__PURE__ */ React.createElement("span", { className: "ico" }, ico),
      /* @__PURE__ */ React.createElement("span", { className: "ttl" }, ttl),
      sub && /* @__PURE__ */ React.createElement("span", { className: "sub" }, sub)
    );
  };
  const durLabel = (n, lang) => {
    if (lang === "no") return n === 1 ? "dag" : "dager";
    if (lang === "fr") return n === 1 ? "jour" : "jours";
    return n === 1 ? "day" : "days";
  };
  const presets = [
    { d: 4, label: { no: "4d \xB7 Lang helg", en: "4d \xB7 Weekend", fr: "4j \xB7 Weekend" } },
    { d: 7, label: { no: "7d \xB7 Klassisk", en: "7d \xB7 Classic", fr: "7j \xB7 Classique" } },
    { d: 10, label: { no: "10d \xB7 Premium", en: "10d \xB7 Premium", fr: "10j \xB7 Premium" } },
    { d: 14, label: { no: "14d \xB7 Grand Tour", en: "14d \xB7 Grand Tour", fr: "14j \xB7 Grand Tour" } },
    { d: 21, label: { no: "21d \xB7 Utvidet", en: "21d \xB7 Extended", fr: "21j \xB7 \xC9tendu" } },
    { d: 30, label: { no: "30d \xB7 Hele Marokko", en: "30d \xB7 Full Morocco", fr: "30j \xB7 Maroc entier" } }
  ];
  return /* @__PURE__ */ React.createElement("section", { className: "itin-section section", id: "plan", style: { display: planShown ? void 0 : "none" } }, /* @__PURE__ */ React.createElement("div", { className: "wrap-wide" }, /* @__PURE__ */ React.createElement("div", { className: "section-head reveal", style: { textAlign: "center", margin: "0 auto 56px" } }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, t("itin_eyebrow")), /* @__PURE__ */ React.createElement("h2", null, t("itin_title_a"), " ", /* @__PURE__ */ React.createElement("em", null, t("itin_title_b")), t("itin_title_c")), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 auto" } }, t("itin_sub"))), window.MS_FavouritesQuickAdd && /* @__PURE__ */ React.createElement(window.MS_FavouritesQuickAdd, null), /* @__PURE__ */ React.createElement("div", { className: "itin-shell reveal" }, /* @__PURE__ */ React.createElement("div", { className: "itin-form" }, !sent && bookingCtx && /* @__PURE__ */ React.createElement("div", { className: "itin-ctx-banner" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "itin-ctx-eyebrow" }, ctx.lang === "no" ? "Du bestiller:" : ctx.lang === "fr" ? "Vous r\xE9servez :" : "You are booking:"), /* @__PURE__ */ React.createElement("strong", null, bookingCtx.title), /* @__PURE__ */ React.createElement("span", { className: "itin-ctx-meta" }, bookingCtx.duration, " ", ctx.lang === "no" ? "dager" : ctx.lang === "fr" ? "jours" : "days", bookingCtx.priceEur ? ` \xB7 ${price(bookingCtx.priceEur * 1.4)}` : "")), /* @__PURE__ */ React.createElement("button", { className: "itin-ctx-clear", onClick: clearBookingCtx, "aria-label": "Start fresh" }, "\u2715")), !sent && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "itin-stepper" }, steps.map((s, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.id,
      className: `itin-step-pill ${i === step ? "active" : i < step ? "done" : ""}`,
      onClick: () => setStep(i)
    },
    /* @__PURE__ */ React.createElement("span", { className: "n" }, i < step ? /* @__PURE__ */ React.createElement(If.Check, { s: 11 }) : i + 1),
    /* @__PURE__ */ React.createElement("span", null, s.label)
  ))), /* @__PURE__ */ React.createElement("div", { className: "itin-step-body" }, show("when") && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, ctx.lang === "no" ? "Velg periode" : ctx.lang === "fr" ? "Choisissez la p\xE9riode" : "Choose your period"), /* @__PURE__ */ React.createElement(
    RangeCalendar,
    {
      start: data.startDate,
      end: data.endDate,
      lang: ctx.lang,
      onChange: (s, e) => {
        upd("startDate", s);
        upd("endDate", e);
        ctx.setDates({ ...ctx.dates, dep: s });
        if (s && e) {
          const diff = Math.max(1, Math.round((new Date(e) - new Date(s)) / 864e5) + 1);
          upd("duration", diff);
        }
      }
    }
  ), data.startDate && data.endDate && /* @__PURE__ */ React.createElement("div", { className: "period-summary" }, data.duration, " ", ctx.lang === "no" ? data.duration === 1 ? "dag" : "dager" : ctx.lang === "fr" ? "jours" : "days", " \xB7 ", Math.max(0, data.duration - 1), " ", ctx.lang === "no" ? "netter" : ctx.lang === "fr" ? "nuits" : "nights"), data.startDate && data.endDate && data.duration > 4 && !bookingCtx && (() => {
    const cityOptions = ["Marrakech", "Essaouira", "Fes", "Casablanca", "Chefchaouen", "Rabat", "Tangier", "Agadir", "Merzouga (Sahara)", "Ouarzazate", "Ait Ben Haddou", "Atlas Mountains"];
    const totalNights = Math.max(0, data.duration - 1);
    const used = data.stops.reduce((s, x) => s + (parseInt(x.nights) || 0), 0);
    const remaining = totalNights - used;
    return /* @__PURE__ */ React.createElement("div", { className: "multicity-block" }, /* @__PURE__ */ React.createElement("h3", { className: "itin-q", style: { marginTop: 28 } }, ctx.lang === "no" ? "\xD8nsker du \xE5 bes\xF8ke flere byer?" : ctx.lang === "fr" ? "Visiter plusieurs villes ?" : "Visit multiple cities?"), /* @__PURE__ */ React.createElement("div", { className: "multicity-toggle" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `mc-toggle ${!data.multiCity ? "active" : ""}`,
        onClick: () => setData((p) => ({ ...p, multiCity: false, stops: [{ city: "Marrakech", nights: totalNights }] }))
      },
      ctx.lang === "no" ? "Kun Marrakech" : ctx.lang === "fr" ? "Marrakech seulement" : "Marrakech only"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `mc-toggle ${data.multiCity ? "active" : ""}`,
        onClick: () => setData((p) => ({ ...p, multiCity: true }))
      },
      ctx.lang === "no" ? "Flere byer" : ctx.lang === "fr" ? "Plusieurs villes" : "Multi-city"
    )), data.multiCity && /* @__PURE__ */ React.createElement("div", { className: "multicity-stops" }, data.stops.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "mc-stop" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: s.city,
        onChange: (e) => setData((p) => ({ ...p, stops: p.stops.map((x, j) => j === i ? { ...x, city: e.target.value } : x) }))
      },
      cityOptions.map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c))
    ), /* @__PURE__ */ React.createElement("div", { className: "mc-night-ctrl" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setData((p) => ({ ...p, stops: p.stops.map((x, j) => j === i ? { ...x, nights: Math.max(0, (parseInt(x.nights) || 0) - 1) } : x) })) }, "\u2212"), /* @__PURE__ */ React.createElement("span", null, s.nights, " ", ctx.lang === "no" ? "n" : "n"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setData((p) => ({ ...p, stops: p.stops.map((x, j) => j === i ? { ...x, nights: (parseInt(x.nights) || 0) + 1 } : x) })) }, "+")), data.stops.length > 1 && /* @__PURE__ */ React.createElement("button", { type: "button", className: "mc-remove", onClick: () => setData((p) => ({ ...p, stops: p.stops.filter((_, j) => j !== i) })) }, "\u2715"))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "mc-add", onClick: () => setData((p) => ({ ...p, stops: [...p.stops, { city: "Essaouira", nights: 1 }] })) }, "+ ", ctx.lang === "no" ? "Legg til by" : ctx.lang === "fr" ? "Ajouter une ville" : "Add city"), /* @__PURE__ */ React.createElement("div", { className: `mc-balance ${remaining === 0 ? "ok" : remaining < 0 ? "over" : "under"}` }, ctx.lang === "no" ? `${used} / ${totalNights} netter fordelt` : ctx.lang === "fr" ? `${used} / ${totalNights} nuits r\xE9parties` : `${used} / ${totalNights} nights allocated`, remaining !== 0 && /* @__PURE__ */ React.createElement("span", null, " \xB7 ", remaining > 0 ? ctx.lang === "no" ? `${remaining} igjen` : ctx.lang === "fr" ? `${remaining} restant` : `${remaining} left` : ctx.lang === "no" ? `${-remaining} for mange` : ctx.lang === "fr" ? `${-remaining} en trop` : `${-remaining} too many`))));
  })(), /* @__PURE__ */ React.createElement("h3", { className: "itin-q", style: { marginTop: 28 } }, ctx.lang === "no" ? "Fly inn / fly ut" : ctx.lang === "fr" ? "Arriv\xE9e / d\xE9part" : "Arrival / departure"), /* @__PURE__ */ React.createElement("div", { className: "fld-row" }, /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", null, ctx.lang === "no" ? "Lander i" : ctx.lang === "fr" ? "Atterrissage \xE0" : "Landing in"), /* @__PURE__ */ React.createElement("select", { value: data.arriveCity, onChange: (e) => upd("arriveCity", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, ctx.lang === "no" ? "Velg\u2026" : ctx.lang === "fr" ? "Choisir\u2026" : "Choose\u2026"), /* @__PURE__ */ React.createElement("option", null, "Marrakech (RAK)"), /* @__PURE__ */ React.createElement("option", null, "Casablanca (CMN)"), /* @__PURE__ */ React.createElement("option", null, "Agadir (AGA)"), /* @__PURE__ */ React.createElement("option", null, "Fes (FEZ)"), /* @__PURE__ */ React.createElement("option", null, "Tangier (TNG)"), /* @__PURE__ */ React.createElement("option", null, "Rabat (RBA)"), /* @__PURE__ */ React.createElement("option", null, "Essaouira (ESU)"), /* @__PURE__ */ React.createElement("option", null, "Ouarzazate (OZZ)"))), /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", null, ctx.lang === "no" ? "Reiser hjem fra" : ctx.lang === "fr" ? "D\xE9part de" : "Departing from"), /* @__PURE__ */ React.createElement("select", { value: data.departCity, onChange: (e) => upd("departCity", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, ctx.lang === "no" ? "Velg\u2026" : ctx.lang === "fr" ? "Choisir\u2026" : "Choose\u2026"), /* @__PURE__ */ React.createElement("option", null, "Marrakech (RAK)"), /* @__PURE__ */ React.createElement("option", null, "Casablanca (CMN)"), /* @__PURE__ */ React.createElement("option", null, "Agadir (AGA)"), /* @__PURE__ */ React.createElement("option", null, "Fes (FEZ)"), /* @__PURE__ */ React.createElement("option", null, "Tangier (TNG)"), /* @__PURE__ */ React.createElement("option", null, "Rabat (RBA)"), /* @__PURE__ */ React.createElement("option", null, "Essaouira (ESU)"), /* @__PURE__ */ React.createElement("option", null, "Ouarzazate (OZZ)")))), /* @__PURE__ */ React.createElement("h3", { className: "itin-q", style: { marginTop: 24 } }, ctx.lang === "no" ? "Har dere bestilt fly?" : ctx.lang === "fr" ? "Avez-vous r\xE9serv\xE9 le vol ?" : "Have you booked your flight?"), /* @__PURE__ */ React.createElement("div", { className: "multicity-toggle" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `mc-toggle ${data.flightBooked === "yes" ? "active" : ""}`,
      onClick: () => upd("flightBooked", "yes")
    },
    ctx.lang === "no" ? "Ja" : "Yes"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `mc-toggle ${data.flightBooked === "no" ? "active" : ""}`,
      onClick: () => upd("flightBooked", "no")
    },
    ctx.lang === "no" ? "Nei" : "No"
  )), data.flightBooked === "yes" && /* @__PURE__ */ React.createElement("div", { className: "fld", style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("label", null, ctx.lang === "no" ? "Flydetaljer (selskap, flynr, tider)" : ctx.lang === "fr" ? "D\xE9tails du vol (compagnie, n\xB0, horaires)" : "Flight details (airline, number, times)"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: "2",
      value: data.flightDetails,
      onChange: (e) => upd("flightDetails", e.target.value),
      placeholder: ctx.lang === "no" ? "F.eks. Royal Air Maroc AT207 \xB7 Ankomst 14:30 \xB7 Avgang 08:50" : "e.g. Royal Air Maroc AT207 \xB7 Arrival 14:30 \xB7 Departure 08:50"
    }
  ))), show("who") && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, ctx.lang === "no" ? "Hvilken type reise?" : ctx.lang === "fr" ? "Quel type de voyage ?" : "What kind of trip?"), /* @__PURE__ */ React.createElement("div", { className: "opt-grid" }, /* @__PURE__ */ React.createElement(
    OptCard,
    {
      field: "tripType",
      value: "solo",
      ttl: ctx.lang === "no" ? "Solo-reisende" : ctx.lang === "fr" ? "Voyageur solo" : "Solo traveller",
      ico: /* @__PURE__ */ React.createElement("span", null, "\u{1F9F3}")
    }
  ), /* @__PURE__ */ React.createElement(
    OptCard,
    {
      field: "tripType",
      value: "couple",
      ttl: ctx.lang === "no" ? "Par" : ctx.lang === "fr" ? "Couple" : "Couple",
      ico: /* @__PURE__ */ React.createElement("span", null, "\u{1F491}")
    }
  ), /* @__PURE__ */ React.createElement(
    OptCard,
    {
      field: "tripType",
      value: "family",
      ttl: ctx.lang === "no" ? "Familie" : ctx.lang === "fr" ? "Famille" : "Family",
      ico: /* @__PURE__ */ React.createElement("span", null, "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}")
    }
  ), /* @__PURE__ */ React.createElement(
    OptCard,
    {
      field: "tripType",
      value: "group",
      ttl: ctx.lang === "no" ? "Gruppe" : ctx.lang === "fr" ? "Groupe" : "Group",
      ico: /* @__PURE__ */ React.createElement("span", null, "\u{1F465}")
    }
  ), /* @__PURE__ */ React.createElement(
    OptCard,
    {
      field: "tripType",
      value: "team",
      ttl: ctx.lang === "no" ? "Team building" : "Team building",
      ico: /* @__PURE__ */ React.createElement("span", null, "\u{1F91D}")
    }
  ), /* @__PURE__ */ React.createElement(
    OptCard,
    {
      field: "tripType",
      value: "wedding",
      ttl: ctx.lang === "no" ? "Bryllupsplanlegger" : ctx.lang === "fr" ? "Organisateur de mariage" : "Wedding planner",
      ico: /* @__PURE__ */ React.createElement("span", null, "\u{1F48D}")
    }
  )), /* @__PURE__ */ React.createElement("h3", { className: "itin-q", style: { marginTop: 28 } }, t("itin_step_who")), /* @__PURE__ */ React.createElement("div", { className: "itin-counter-grid" }, [
    { k: "adults", lbl: t("itin_adults"), sub: t("itin_adults_sub") },
    { k: "children", lbl: t("itin_kids"), sub: t("itin_kids_sub") },
    { k: "infants", lbl: t("itin_infants"), sub: t("itin_infants_sub") }
  ].map((x) => /* @__PURE__ */ React.createElement("div", { key: x.k, className: "form-counter" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "name" }, x.lbl), /* @__PURE__ */ React.createElement("div", { className: "sub" }, x.sub)), /* @__PURE__ */ React.createElement("div", { className: "counter-btns" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => updTrav(x.k, -1) }, /* @__PURE__ */ React.createElement(If.Minus, null)), /* @__PURE__ */ React.createElement("span", { className: "val" }, data.travellers[x.k]), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => updTrav(x.k, 1) }, /* @__PURE__ */ React.createElement(If.Plus, null)))))), /* @__PURE__ */ React.createElement("h3", { className: "itin-q", style: { marginTop: 28 } }, ctx.lang === "no" ? "Har du allerede bestilt noe?" : ctx.lang === "fr" ? "Avez-vous d\xE9j\xE0 r\xE9serv\xE9 quelque chose ?" : "Have you already booked anything?"), /* @__PURE__ */ React.createElement("div", { className: "already-booked-group" }, /* @__PURE__ */ React.createElement("label", { className: "already-booked-check" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: data.bookedAccom, onChange: (e) => upd("bookedAccom", e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, ctx.lang === "no" ? "Overnatting allerede bestilt" : "Accommodation already booked")), data.bookedAccom && /* @__PURE__ */ React.createElement("div", { className: "fld", style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("label", null, ctx.lang === "no" ? "Hotell / riad / adresse" : "Hotel / riad / address"), /* @__PURE__ */ React.createElement("input", { autoComplete: "street-address", value: data.bookedAccomAddr, onChange: (e) => upd("bookedAccomAddr", e.target.value), placeholder: ctx.lang === "no" ? "Navn eller adresse" : "Name or address" })), /* @__PURE__ */ React.createElement("label", { className: "already-booked-check", style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: data.bookedTransport, onChange: (e) => upd("bookedTransport", e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, ctx.lang === "no" ? "Transport / flyplassoverf\xF8ring allerede bestilt" : "Transport / airport transfer already booked")), /* @__PURE__ */ React.createElement("label", { className: "already-booked-check", style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: data.bookedActivities, onChange: (e) => upd("bookedActivities", e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, ctx.lang === "no" ? "Aktiviteter allerede bestilt" : "Activities already booked")))), show("style") && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, t("itin_step_stay")), /* @__PURE__ */ React.createElement("div", { className: "opt-grid" }, /* @__PURE__ */ React.createElement(OptCard, { field: "accommodation", value: "riad", ttl: t("itin_acc_riad"), ico: /* @__PURE__ */ React.createElement(If.Bed, null) }), /* @__PURE__ */ React.createElement(OptCard, { field: "accommodation", value: "luxury", ttl: t("itin_acc_luxury"), ico: /* @__PURE__ */ React.createElement(If.Sparkle, null) }), /* @__PURE__ */ React.createElement(OptCard, { field: "accommodation", value: "villa", ttl: t("itin_acc_villa"), ico: /* @__PURE__ */ React.createElement(If.Bed, null) }), /* @__PURE__ */ React.createElement(OptCard, { field: "accommodation", value: "camp", ttl: t("itin_acc_camp"), ico: /* @__PURE__ */ React.createElement(If.Tent, null) }), /* @__PURE__ */ React.createElement(OptCard, { field: "accommodation", value: "mix", ttl: t("itin_acc_mix"), ico: /* @__PURE__ */ React.createElement(If.Compass, null) }), /* @__PURE__ */ React.createElement(OptCard, { field: "accommodation", value: "surprise", ttl: t("itin_acc_surprise"), ico: /* @__PURE__ */ React.createElement(If.Star, null) })), /* @__PURE__ */ React.createElement("h3", { className: "itin-q", style: { marginTop: 28 } }, t("itin_budget")), /* @__PURE__ */ React.createElement("div", { className: "opt-grid" }, /* @__PURE__ */ React.createElement(OptCard, { field: "budget", value: "mid", ttl: ctx.lang === "no" ? "Komfort" : ctx.lang === "fr" ? "Confort" : "Comfort", sub: ctx.lang === "no" ? "Boutique riader & god service" : "Boutique riads & great service" }), /* @__PURE__ */ React.createElement(OptCard, { field: "budget", value: "premium", ttl: "Premium", sub: ctx.lang === "no" ? "Eksklusivt utvalg & oppgraderinger" : "Exclusive picks & upgrades" }), /* @__PURE__ */ React.createElement(OptCard, { field: "budget", value: "luxury", ttl: ctx.lang === "no" ? "Luksus" : "Luxury", sub: ctx.lang === "no" ? "Ingen kompromisser" : "No compromises" }))), show("style") && (() => {
    const D = window.MS_DATA || {};
    const cars = D.TRANSPORT || [];
    return /* @__PURE__ */ React.createElement("div", { style: { marginTop: 24 } }, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, ctx.lang === "no" ? "Transport" : "Transport"), /* @__PURE__ */ React.createElement("div", { className: "opt-grid" }, /* @__PURE__ */ React.createElement(
      OptCard,
      {
        field: "transport",
        value: "driver-sedan",
        ttl: ctx.lang === "no" ? "Sj\xE5f\xF8r \u2014 Sedan" : ctx.lang === "fr" ? "Chauffeur \u2014 Berline" : "Driver \u2014 Sedan",
        sub: ctx.lang === "no" ? "3\u20134 reisende" : "3\u20134 travellers",
        ico: /* @__PURE__ */ React.createElement(If.Plane, null)
      }
    ), /* @__PURE__ */ React.createElement(
      OptCard,
      {
        field: "transport",
        value: "driver-van",
        ttl: ctx.lang === "no" ? "Sj\xE5f\xF8r \u2014 Van" : ctx.lang === "fr" ? "Chauffeur \u2014 Van" : "Driver \u2014 Van",
        sub: ctx.lang === "no" ? "Velg antall seter" : "Pick seats",
        ico: /* @__PURE__ */ React.createElement(If.Tent, null)
      }
    ), /* @__PURE__ */ React.createElement(
      OptCard,
      {
        field: "transport",
        value: "rental",
        ttl: ctx.lang === "no" ? "Leiebil" : ctx.lang === "fr" ? "Voiture de location" : "Rental car",
        sub: ctx.lang === "no" ? "Velg fra v\xE5r fl\xE5te" : "Pick from our fleet",
        ico: /* @__PURE__ */ React.createElement(If.Compass, null)
      }
    )), data.transport === "driver-van" && /* @__PURE__ */ React.createElement("div", { className: "form-counter", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "name" }, ctx.lang === "no" ? "Seter i van" : ctx.lang === "fr" ? "Places dans le van" : "Van seats"), /* @__PURE__ */ React.createElement("div", { className: "sub" }, ctx.lang === "no" ? "7, 9, 12, 17\u2026" : "7, 9, 12, 17\u2026")), /* @__PURE__ */ React.createElement("div", { className: "counter-btns" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => upd("vanSeats", Math.max(4, data.vanSeats - 1)) }, /* @__PURE__ */ React.createElement(If.Minus, null)), /* @__PURE__ */ React.createElement("span", { className: "val" }, data.vanSeats), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => upd("vanSeats", Math.min(22, data.vanSeats + 1)) }, /* @__PURE__ */ React.createElement(If.Plus, null)))), data.transport === "rental" && /* @__PURE__ */ React.createElement("div", { className: "rental-grid" }, cars.map((c, i) => /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        key: i,
        className: `rental-card ${data.rentalCar === c.name ? "active" : ""}`,
        onClick: () => upd("rentalCar", c.name)
      },
      /* @__PURE__ */ React.createElement(
        "img",
        {
          src: c.img,
          alt: c.name,
          loading: "lazy",
          onError: (e) => {
            e.currentTarget.style.display = "none";
          }
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "rental-card-body" }, /* @__PURE__ */ React.createElement("div", { className: "rental-card-name" }, c.name), /* @__PURE__ */ React.createElement("div", { className: "rental-card-spec" }, c.cuisine), /* @__PURE__ */ React.createElement("div", { className: "rental-card-price" }, c.price))
    ))));
  })(), show("style") && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 24 } }, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, t("itin_step_pace")), /* @__PURE__ */ React.createElement("div", { className: "opt-grid" }, /* @__PURE__ */ React.createElement(OptCard, { field: "pace", value: "slow", ttl: t("itin_pace_slow"), sub: t("itin_pace_slow_sub") }), /* @__PURE__ */ React.createElement(OptCard, { field: "pace", value: "balanced", ttl: t("itin_pace_balanced"), sub: t("itin_pace_balanced_sub") }), /* @__PURE__ */ React.createElement(OptCard, { field: "pace", value: "packed", ttl: t("itin_pace_packed"), sub: t("itin_pace_packed_sub") }))), show("taste") && (() => {
    const D = window.MS_DATA || {};
    if (!data.duration || data.duration < 1) {
      return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, t("itin_step_int")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--ink-3)", marginBottom: 18 } }, ctx.lang === "no" ? "Velg antall dager, s\xE5 fyller du reisen din dag for dag." : ctx.lang === "fr" ? "Choisissez la dur\xE9e, puis remplissez votre voyage jour par jour." : "Pick a trip length, then fill your journey day by day below."), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, presets.map((p) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: p.d,
          type: "button",
          className: "opt-card",
          style: { flex: "1 1 calc(33% - 8px)", minWidth: 100 },
          onClick: () => upd("duration", p.d)
        },
        /* @__PURE__ */ React.createElement("span", { className: "ttl" }, p.label[ctx.lang] || p.label.en)
      ))));
    }
    const totalDays = data.duration;
    const curDay = Math.min(activeDay, totalDays - 1);
    const day = data.daySchedule[curDay] || { activities: [], wellness: [], pool: [], restaurant: "" };
    const dayDate = data.startDate ? (() => {
      const d = new Date(data.startDate);
      d.setDate(d.getDate() + curDay);
      return d.toLocaleDateString(ctx.lang === "no" ? "no-NO" : ctx.lang === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
    })() : "";
    const FIRST = 6;
    const Chip = ({ slot, value, label, active }) => /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `taste-chip ${active ? "active" : ""}`,
        onClick: () => dayPick(curDay, slot, value)
      },
      label
    );
    const Section = ({ id, title, meta, items, slot, picked }) => {
      const key = `${id}-${curDay}`;
      const open = !!smakOpen[key];
      const shown = open ? items : items.slice(0, FIRST);
      const more = items.length - FIRST;
      return /* @__PURE__ */ React.createElement("div", { className: "taste-section" }, /* @__PURE__ */ React.createElement("div", { className: "taste-section-h" }, title, meta != null && /* @__PURE__ */ React.createElement("span", { className: "taste-section-meta" }, meta)), /* @__PURE__ */ React.createElement("div", { className: `taste-chips ${open ? "open" : ""}` }, shown.map((it, i) => /* @__PURE__ */ React.createElement(
        Chip,
        {
          key: i,
          slot,
          value: it.v,
          label: it.label,
          active: slot === "restaurant" ? picked === it.v : (picked || []).includes(it.v)
        }
      ))), more > 0 && /* @__PURE__ */ React.createElement("button", { type: "button", className: "taste-more", onClick: () => toggleSmak(key) }, open ? ctx.lang === "no" ? "Vis f\xE6rre" : "Show less" : ctx.lang === "no" ? `Vis flere (+${more})` : `Show more (+${more})`));
    };
    const restaurantStyles = [
      { v: "r:traditional", label: ctx.lang === "no" ? "\u{1F372} Tradisjonell marokkansk" : "\u{1F372} Traditional Moroccan" },
      { v: "r:fine", label: ctx.lang === "no" ? "\u{1F377} Fine dining" : "\u{1F377} Fine dining" },
      { v: "r:rooftop", label: ctx.lang === "no" ? "\u{1F307} Tak / terrasse" : "\u{1F307} Rooftop / terrasse" },
      { v: "r:festive", label: ctx.lang === "no" ? "\u{1F389} Festlig" : "\u{1F389} Festive" },
      { v: "r:international", label: ctx.lang === "no" ? "\u{1F30D} Internasjonal" : "\u{1F30D} International" },
      { v: "r:asian", label: ctx.lang === "no" ? "\u{1F962} Asiatisk" : "\u{1F962} Asian" },
      { v: "r:brunch", label: ctx.lang === "no" ? "\u{1F950} Brunsj & kaf\xE9" : "\u{1F950} Brunch & caf\xE9" },
      { v: "r:bar", label: ctx.lang === "no" ? "\u{1F378} Bar & lounge" : "\u{1F378} Bar & lounge" },
      { v: "r:club", label: ctx.lang === "no" ? "\u{1F319} Nattklubb" : "\u{1F319} Nightclub" }
    ];
    const acts = (D.ACTIVITIES || []).map((a) => ({ v: `a:${a.name}`, label: a.name }));
    const wellness = [
      { v: "spa-hammam", label: "\u{1F6C1} Hammam" },
      { v: "spa-massage", label: ctx.lang === "no" ? "\u{1F486} Massasje" : "\u{1F486} Massage" },
      { v: "spa-beauty", label: ctx.lang === "no" ? "\u{1F485} Skj\xF8nnhetssalong" : "\u{1F485} Beauty salon" },
      { v: "spa-yoga", label: ctx.lang === "no" ? "\u{1F9D8} Yoga / meditasjon" : "\u{1F9D8} Yoga / meditation" }
    ];
    const agafayPool = [
      ...(D.CAMPS || []).map((c) => ({ v: `c:${c.name}`, label: `\u{1F3DC}\uFE0F ${c.name}` })),
      ...(D.POOLS || []).map((p) => ({ v: `p:${p.name}`, label: `\u2600\uFE0F ${p.name}` }))
    ];
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, ctx.lang === "no" ? "Fyll inn dag for dag" : ctx.lang === "fr" ? "Remplissez jour par jour" : "Fill the trip day by day"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `itin-choose-me ${data.chooseForMe ? "active" : ""}`,
        onClick: () => upd("chooseForMe", !data.chooseForMe)
      },
      /* @__PURE__ */ React.createElement("span", { className: "itin-choose-ico" }, "\u2728"),
      /* @__PURE__ */ React.createElement("span", { className: "itin-choose-txt" }, /* @__PURE__ */ React.createElement("strong", null, ctx.lang === "no" ? "Velg for meg" : ctx.lang === "fr" ? "Choisissez pour moi" : "Choose for me"), /* @__PURE__ */ React.createElement("span", null, ctx.lang === "no" ? "Ikke lyst til \xE5 bruke tid? La MarrakechStory sette sammen reisen for deg." : ctx.lang === "fr" ? "Pas envie de choisir ? Laissez MarrakechStory composer votre voyage." : "Don't want to spend time choosing? Let MarrakechStory craft the trip for you.")),
      /* @__PURE__ */ React.createElement("span", { className: "itin-choose-check" }, data.chooseForMe ? "\u2713" : "")
    ), data.chooseForMe ? /* @__PURE__ */ React.createElement("div", { className: "itin-choose-note" }, ctx.lang === "no" ? "Perfekt \u2014 vi setter sammen en skreddersydd reise basert p\xE5 lengde, reisef\xF8lge og datoer. Du kan legge til \xF8nsker i neste steg." : ctx.lang === "fr" ? "Parfait \u2014 nous composerons un voyage sur mesure selon la dur\xE9e, les voyageurs et les dates. Ajoutez vos souhaits \xE0 l'\xE9tape suivante." : "Perfect \u2014 we'll craft a tailored trip from your length, travellers and dates. Add any wishes in the next step.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "day-nav" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "day-nav-arrow",
        onClick: () => setActiveDay((d) => Math.max(0, d - 1)),
        disabled: curDay === 0
      },
      "\u2039"
    ), /* @__PURE__ */ React.createElement("div", { className: "day-nav-pills" }, Array.from({ length: totalDays }, (_, i) => {
      const dd = data.daySchedule[i];
      const filled = dd && (dd.activities.length || dd.wellness.length || dd.pool.length || dd.restaurant);
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: i,
          type: "button",
          className: `day-nav-pill ${i === curDay ? "active" : ""} ${filled ? "filled" : ""}`,
          onClick: () => setActiveDay(i)
        },
        ctx.lang === "no" ? `Dag ${i + 1}` : `Day ${i + 1}`
      );
    })), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "day-nav-arrow",
        onClick: () => setActiveDay((d) => Math.min(totalDays - 1, d + 1)),
        disabled: curDay >= totalDays - 1
      },
      "\u203A"
    )), /* @__PURE__ */ React.createElement("p", { className: "day-meta" }, ctx.lang === "no" ? `Dag ${curDay + 1} av ${totalDays}` : `Day ${curDay + 1} of ${totalDays}`, dayDate && ` \xB7 ${dayDate}`), /* @__PURE__ */ React.createElement(
      Section,
      {
        id: "acts",
        items: acts,
        meta: acts.length,
        slot: "activities",
        picked: day.activities,
        title: ctx.lang === "no" ? "\u{1F3AF} Aktiviteter" : "\u{1F3AF} Activities"
      }
    ), /* @__PURE__ */ React.createElement(
      Section,
      {
        id: "wellness",
        items: wellness,
        slot: "wellness",
        picked: day.wellness,
        title: ctx.lang === "no" ? "\u{1F486} Velv\xE6re" : "\u{1F486} Wellness"
      }
    ), /* @__PURE__ */ React.createElement(
      Section,
      {
        id: "ap",
        items: agafayPool,
        meta: agafayPool.length,
        slot: "pool",
        picked: day.pool,
        title: ctx.lang === "no" ? "\u{1F3DC}\uFE0F\u2600\uFE0F Agafay & bassenger" : "\u{1F3DC}\uFE0F\u2600\uFE0F Agafay & pools"
      }
    ), /* @__PURE__ */ React.createElement(
      Section,
      {
        id: "rest",
        items: restaurantStyles,
        slot: "restaurant",
        picked: day.restaurant,
        title: ctx.lang === "no" ? "\u{1F37D}\uFE0F Middag \u2014 restaurant-stil" : "\u{1F37D}\uFE0F Dinner \u2014 restaurant style"
      }
    )));
  })(), show("extra") && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, t("itin_step_extra")), /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", null, t("itin_special")), /* @__PURE__ */ React.createElement("input", { autoComplete: "off", value: data.occasion, onChange: (e) => upd("occasion", e.target.value), placeholder: t("itin_special_ph") })), /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", null, t("itin_avoid")), /* @__PURE__ */ React.createElement("textarea", { rows: "2", value: data.avoid, onChange: (e) => upd("avoid", e.target.value), placeholder: t("itin_avoid_ph") })), /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", null, t("itin_notes")), /* @__PURE__ */ React.createElement("textarea", { rows: "3", value: data.notes, onChange: (e) => upd("notes", e.target.value), placeholder: t("itin_notes_ph") }))), show("send") && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, ctx.lang === "no" ? "Klar til \xE5 sende" : ctx.lang === "fr" ? "Pr\xEAt \xE0 envoyer" : "Ready to send"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--ink-3)", margin: "0 0 14px" } }, ctx.lang === "no" ? "Sjekk reiseplanen til h\xF8yre. Vi tar kontakt innen 24 timer og foredler detaljene sammen med deg." : ctx.lang === "fr" ? "V\xE9rifiez l'itin\xE9raire \xE0 droite. Nous vous r\xE9pondons sous 24 h pour affiner ensemble." : "Review your trip on the right. We reply within 24 hours and refine the details with you."), /* @__PURE__ */ React.createElement("ul", { style: { fontSize: 13, color: "var(--ink)", paddingLeft: 18, lineHeight: 1.7 } }, /* @__PURE__ */ React.createElement("li", null, ctx.lang === "no" ? "\u2705 Vi svarer innen 24 timer" : "\u2705 We reply within 24 hours"), /* @__PURE__ */ React.createElement("li", null, ctx.lang === "no" ? "\u2705 Ingen forskudd kreves" : "\u2705 No prepayment required"), /* @__PURE__ */ React.createElement("li", null, ctx.lang === "no" ? "\u2705 Du kan endre alt f\xF8r bekreftelse" : "\u2705 You can change everything before confirming"))), show("contact") && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "itin-q" }, t("itin_step_contact")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "var(--ink-3)", margin: "-8px 0 14px", fontStyle: "italic" } }, ctx.lang === "no" ? "Vi bruker dette til \xE5 sende deg reiseplanen og holde kontakt." : ctx.lang === "fr" ? "Pour vous envoyer l'itin\xE9raire et rester en contact." : "So we can send you the trip and stay in touch."), /* @__PURE__ */ React.createElement("div", { className: "fld-row" }, /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", null, t("itin_name")), /* @__PURE__ */ React.createElement("input", { autoComplete: "name", value: data.name, onChange: (e) => upd("name", e.target.value), placeholder: "Fullt navn" })), /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", null, t("itin_country")), /* @__PURE__ */ React.createElement("input", { autoComplete: "country-name", value: data.country, onChange: (e) => upd("country", e.target.value), placeholder: "Norge" }))), /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", null, t("itin_email")), /* @__PURE__ */ React.createElement("input", { type: "email", autoComplete: "email", value: data.email, onChange: (e) => upd("email", e.target.value), placeholder: "you@example.com" })), /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", null, t("itin_phone")), /* @__PURE__ */ React.createElement("input", { type: "tel", autoComplete: "tel", value: data.phone, onChange: (e) => upd("phone", e.target.value), placeholder: "+47 ..." })))), /* @__PURE__ */ React.createElement("div", { className: "form-nav" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-outline",
      onClick: prev,
      disabled: step === 0,
      style: { opacity: step === 0 ? 0.4 : 1 }
    },
    /* @__PURE__ */ React.createElement(If.Arrow, { s: 14, dir: 180 }),
    " ",
    t("itin_back")
  ), /* @__PURE__ */ React.createElement("div", { className: "progress" }, t("itin_step"), " ", step + 1, " ", t("itin_of"), " ", steps.length), step < steps.length - 1 ? /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: next }, t("itin_next"), " ", /* @__PURE__ */ React.createElement(If.Arrow, { s: 14 })) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-outline",
      onClick: sendWhatsapp,
      title: "WhatsApp",
      disabled: !data.name.trim() || !data.email.trim()
    },
    /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "#25D366" }, /* @__PURE__ */ React.createElement("path", { d: "M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" }))
  ), !window.MS_Auth_User && /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-outline",
      onClick: sendAndRegister,
      disabled: !data.name.trim() || !data.email.trim(),
      title: ctx.lang === "no" ? "Send og opprett konto" : ctx.lang === "fr" ? "Envoyer et cr\xE9er un compte" : "Send and create account"
    },
    ctx.lang === "no" ? "Send + konto" : ctx.lang === "fr" ? "Envoyer + compte" : "Send + account"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "btn btn-primary",
      onClick: send,
      disabled: !data.name.trim() || !data.email.trim()
    },
    ctx.lang === "no" ? "Send" : ctx.lang === "fr" ? "Envoyer" : "Send",
    " \u2192"
  )))), sent && /* @__PURE__ */ React.createElement("div", { className: "form-success" }, /* @__PURE__ */ React.createElement("div", { className: "check" }, /* @__PURE__ */ React.createElement(If.Check, { s: 36 })), /* @__PURE__ */ React.createElement("h4", { className: "serif", style: { fontSize: 36, margin: "0 0 12px", fontWeight: 400, letterSpacing: "-0.02em" } }, t("itin_sent_title")), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--ink-3)", maxWidth: 460, margin: "0 auto 28px" } }, t("itin_sent_sub")), !window.MS_Auth_User && window.MS_Auth_Prompt && /* @__PURE__ */ React.createElement("div", { className: "itin-sent-account" }, /* @__PURE__ */ React.createElement("p", null, ctx.lang === "no" ? "Vil du f\xF8lge bookingen din og svare oss underveis?" : ctx.lang === "fr" ? "Voulez-vous suivre votre r\xE9servation et \xE9changer avec nous ?" : "Want to track your booking and chat with us?"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => window.MS_Auth_Prompt("register") }, ctx.lang === "no" ? "Opprett konto" : ctx.lang === "fr" ? "Cr\xE9er un compte" : "Create an account")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-ink", onClick: () => {
    setSent(false);
    setStep(0);
  } }, t("itin_sent_again")))), /* @__PURE__ */ React.createElement("div", { className: "itin-preview" }, /* @__PURE__ */ React.createElement("div", { className: "itin-floats", "aria-hidden": "true" }, FLOAT_EMOJIS.map((e, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "itin-float", style: {
    left: `${5 + i * 6.2 % 90}%`,
    animationDuration: `${8 + i * 1.3 % 10}s`,
    animationDelay: `${i * 0.7 % 6}s`,
    fontSize: `${14 + i * 2 % 12}px`
  } }, e))), (() => {
    const hasDates = !!(data.startDate && data.endDate);
    const totalPax = data.travellers.adults + data.travellers.children + data.travellers.infants;
    const hasAnyChoice = hasDates || totalPax > 0 || data.tripType || data.accommodation || data.budget || data.pace || data.transport || data.interests.length || data.multiCity || data.arriveCity || data.departCity || data.name || data.email;
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString(ctx.lang === "no" ? "no-NO" : ctx.lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short" }) : "";
    const tripLabel = { solo: ctx.lang === "no" ? "Solo" : "Solo", couple: ctx.lang === "no" ? "Par" : "Couple", family: ctx.lang === "no" ? "Familie" : "Family", group: ctx.lang === "no" ? "Gruppe" : "Group", team: "Team building", wedding: ctx.lang === "no" ? "Bryllup" : "Wedding" }[data.tripType];
    const accLabel = { riad: "Riad", luxury: ctx.lang === "no" ? "Luksushotell" : "Luxury hotel", villa: ctx.lang === "no" ? "Privat villa" : "Private villa", camp: ctx.lang === "no" ? "\xD8rkenleir" : "Desert camp", mix: ctx.lang === "no" ? "Bland det" : "Mix", surprise: ctx.lang === "no" ? "Overrask oss" : "Surprise" }[data.accommodation];
    const budgetLabel = { mid: ctx.lang === "no" ? "Komfort" : "Comfort", premium: "Premium", luxury: ctx.lang === "no" ? "Luksus" : "Luxury" }[data.budget];
    const paceLabel = { slow: ctx.lang === "no" ? "Rolig" : "Slow", balanced: ctx.lang === "no" ? "Balansert" : "Balanced", packed: ctx.lang === "no" ? "Pakket" : "Packed" }[data.pace];
    const transportLabel = {
      "driver-sedan": ctx.lang === "no" ? "Sj\xE5f\xF8r \xB7 Sedan" : "Driver \xB7 Sedan",
      "driver-van": ctx.lang === "no" ? `Sj\xE5f\xF8r \xB7 Van (${data.vanSeats} seter)` : `Driver \xB7 Van (${data.vanSeats} seats)`,
      "rental": data.rentalCar ? `${ctx.lang === "no" ? "Leiebil" : "Rental"} \xB7 ${data.rentalCar}` : ctx.lang === "no" ? "Leiebil" : "Rental car"
    }[data.transport];
    const hasContact = !!(data.name || data.email || data.phone || data.country);
    const genericStay = (key) => {
      if (["atlas"].includes(key)) return ctx.lang === "no" ? "Lodge i Atlas" : "Lodge in Atlas";
      if (["agafay"].includes(key)) return ctx.lang === "no" ? "Leir i Agafay" : "Camp in Agafay";
      if (["sahara"].includes(key)) return ctx.lang === "no" ? "Leir i Sahara" : "Camp in Sahara";
      if (["imperial"].includes(key)) return ctx.lang === "no" ? "Riad i Fes" : "Riad in Fes";
      if (["essaouira"].includes(key)) return ctx.lang === "no" ? "Riad i Essaouira" : "Riad in Essaouira";
      return ctx.lang === "no" ? "Riad i Marrakech" : "Riad in Marrakech";
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, null, hasContact && /* @__PURE__ */ React.createElement("div", { className: "itin-contact-card" }, /* @__PURE__ */ React.createElement("div", { className: "itin-contact-avatar" }, (data.name || data.email || "?")[0].toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "itin-contact-meta" }, /* @__PURE__ */ React.createElement("strong", null, data.name || (ctx.lang === "no" ? "Gjest" : "Guest")), data.email && /* @__PURE__ */ React.createElement("span", null, "\u{1F4E7} ", data.email), data.phone && /* @__PURE__ */ React.createElement("span", null, "\u{1F4DE} ", data.phone), data.country && /* @__PURE__ */ React.createElement("span", null, "\u{1F30D} ", data.country))), /* @__PURE__ */ React.createElement("div", { className: "itin-preview-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow", style: { color: "#fff", opacity: 0.7 } }, t("itin_preview_title")), /* @__PURE__ */ React.createElement("h3", { className: "serif", style: { fontSize: 26, fontWeight: 500, margin: "6px 0 0", letterSpacing: "-0.01em" } }, hasDates ? /* @__PURE__ */ React.createElement(React.Fragment, null, data.duration, " ", durLabel(data.duration, ctx.lang), totalPax > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, " \xB7 ", /* @__PURE__ */ React.createElement("em", { style: { fontStyle: "italic", color: "#ffae7c" } }, totalPax, " ", ctx.lang === "no" ? "reisende" : ctx.lang === "fr" ? "voyageurs" : "travellers"))) : /* @__PURE__ */ React.createElement("em", { style: { fontStyle: "italic", color: "#ffae7c", fontSize: 20 } }, ctx.lang === "no" ? "Velg dato\u2026" : ctx.lang === "fr" ? "Choisir la date\u2026" : "Pick your dates\u2026")), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, opacity: 0.65, margin: "6px 0 0" } }, t("itin_preview_sub"))), hasDates && /* @__PURE__ */ React.createElement("div", { className: "itin-preview-meta" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, t("itin_preview_arrival")), /* @__PURE__ */ React.createElement("span", { className: "val" }, fmtDate(data.startDate))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, t("itin_preview_departure")), /* @__PURE__ */ React.createElement("span", { className: "val" }, fmtDate(data.endDate))))), !hasAnyChoice && /* @__PURE__ */ React.createElement("div", { className: "itin-empty" }, /* @__PURE__ */ React.createElement("span", { className: "itin-empty-icon" }, "\u{1F5FA}\uFE0F"), /* @__PURE__ */ React.createElement("p", null, ctx.lang === "no" ? "Reiseplanen din vises her \u2014 start med \xE5 velge dato til venstre \u2192" : ctx.lang === "fr" ? "Votre itin\xE9raire appara\xEEtra ici \u2014 commencez par choisir une date \u2192" : "Your itinerary will appear here \u2014 start by picking dates on the left \u2192")), hasAnyChoice && /* @__PURE__ */ React.createElement("div", { className: "itin-summary" }, (data.arriveCity || data.departCity) && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u2708\uFE0F Fly" : "\u2708\uFE0F Flights"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, data.arriveCity || "\u2014", " \u2192 ", data.departCity || data.arriveCity || "\u2014")), tripLabel && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u{1F464} Type" : "\u{1F464} Trip"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, tripLabel)), totalPax > 0 && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u{1F9F3} Reisende" : "\u{1F9F3} Travellers"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, data.travellers.adults > 0 && `${data.travellers.adults} ${ctx.lang === "no" ? "voksne" : "adults"}`, data.travellers.children > 0 && `, ${data.travellers.children} ${ctx.lang === "no" ? "barn" : "children"}`, data.travellers.infants > 0 && `, ${data.travellers.infants} ${ctx.lang === "no" ? "spedbarn" : "infants"}`)), accLabel && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u{1F3E8} Overnatting" : "\u{1F3E8} Stay"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, accLabel)), budgetLabel && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u{1F48E} Budsjett" : "\u{1F48E} Budget"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, budgetLabel)), transportLabel && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u{1F697} Transport" : "\u{1F697} Transport"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, transportLabel)), paceLabel && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u26A1 Tempo" : "\u26A1 Pace"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, paceLabel)), data.multiCity && data.stops.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u{1F4CD} Byer" : "\u{1F4CD} Cities"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, data.stops.map((s) => `${s.city} (${s.nights}n)`).join(" \u2192 "))), data.interests.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u2728 Interesser" : "\u2728 Interests"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, data.interests.length, " ", ctx.lang === "no" ? "valgt" : ctx.lang === "fr" ? "s\xE9lectionn\xE9s" : "picked")), data.occasion && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u{1F389} Anledning" : "\u{1F389} Occasion"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, data.occasion)), data.notes && /* @__PURE__ */ React.createElement("div", { className: "itin-sum-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-sum-k" }, ctx.lang === "no" ? "\u{1F4DD} Notater" : "\u{1F4DD} Notes"), /* @__PURE__ */ React.createElement("span", { className: "itin-sum-v" }, data.notes))), hasDates && (() => {
      const stripPrefix = (v) => v.replace(/^[a-z]+:/, "");
      const restLabel = (v) => ({
        "r:traditional": ctx.lang === "no" ? "Tradisjonell marokkansk" : "Traditional Moroccan",
        "r:fine": "Fine dining",
        "r:rooftop": ctx.lang === "no" ? "Tak / terrasse" : "Rooftop / terrasse",
        "r:festive": ctx.lang === "no" ? "Festlig" : "Festive",
        "r:international": ctx.lang === "no" ? "Internasjonal" : "International",
        "r:asian": ctx.lang === "no" ? "Asiatisk" : "Asian",
        "r:brunch": ctx.lang === "no" ? "Brunsj / kaf\xE9" : "Brunch / caf\xE9",
        "r:bar": "Bar & lounge",
        "r:club": ctx.lang === "no" ? "Nattklubb" : "Nightclub"
      })[v] || stripPrefix(v);
      const wellnessLabel = (v) => ({
        "spa-hammam": "Hammam",
        "spa-massage": ctx.lang === "no" ? "Massasje" : "Massage",
        "spa-beauty": ctx.lang === "no" ? "Skj\xF8nnhetssalong" : "Beauty salon",
        "spa-yoga": "Yoga"
      })[v] || stripPrefix(v);
      const hasAnyDayPick = data.daySchedule.some((d) => {
        var _a2, _b, _c;
        return d && (((_a2 = d.activities) == null ? void 0 : _a2.length) || ((_b = d.wellness) == null ? void 0 : _b.length) || ((_c = d.pool) == null ? void 0 : _c.length) || d.restaurant);
      });
      if (!hasAnyDayPick) {
        return /* @__PURE__ */ React.createElement("div", { className: "itin-empty-soft" }, bookingCtx ? ctx.lang === "no" ? "\u2713 Den foresl\xE5tte reiseplanen sendes med foresp\xF8rselen din" : ctx.lang === "fr" ? "\u2713 L'itin\xE9raire sugg\xE9r\xE9 sera envoy\xE9 avec votre demande" : "\u2713 The suggested itinerary will be sent with your request" : ctx.lang === "no" ? "\u2192 G\xE5 til Smak-steget og fyll inn dagene dine" : "\u2192 Go to the Taste step to fill in your days");
      }
      return /* @__PURE__ */ React.createElement("div", { className: "itin-tl" }, Array.from({ length: data.duration }, (_, i) => {
        const day = data.daySchedule[i] || { activities: [], wellness: [], pool: [], restaurant: "" };
        const isEmpty = !(day.activities.length || day.wellness.length || day.pool.length || day.restaurant);
        const dayDate = new Date(data.startDate);
        dayDate.setDate(dayDate.getDate() + i);
        const dateStr = dayDate.toLocaleDateString(ctx.lang === "no" ? "no-NO" : ctx.lang === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
        const stayKey = day.pool.find((p) => p.startsWith("c:")) ? "agafay" : "marrakech";
        return /* @__PURE__ */ React.createElement("div", { key: i, className: "itin-tl-row", style: { animationDelay: `${i * 60}ms` } }, /* @__PURE__ */ React.createElement("div", { className: "itin-tl-spine" }, /* @__PURE__ */ React.createElement("div", { className: "itin-tl-dot" }, isEmpty ? "\xB7" : "\u2726"), i < data.duration - 1 && /* @__PURE__ */ React.createElement("div", { className: "itin-tl-line" })), /* @__PURE__ */ React.createElement("div", { className: "itin-tl-card" }, /* @__PURE__ */ React.createElement("div", { className: "itin-tl-card-top" }, /* @__PURE__ */ React.createElement("span", { className: "itin-tl-day-num" }, ctx.lang === "no" ? "Dag" : "Day", " ", i + 1), /* @__PURE__ */ React.createElement("span", { className: "itin-tl-date" }, dateStr)), isEmpty ? /* @__PURE__ */ React.createElement("div", { className: "itin-tl-desc", style: { fontStyle: "italic", opacity: 0.6 } }, ctx.lang === "no" ? "Ingen valg enn\xE5" : "Nothing picked yet") : /* @__PURE__ */ React.createElement(React.Fragment, null, day.activities.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "itin-day-block" }, /* @__PURE__ */ React.createElement("div", { className: "itin-day-label" }, "\u{1F3AF} ", ctx.lang === "no" ? "Aktiviteter" : "Activities"), /* @__PURE__ */ React.createElement("div", { className: "itin-card-chips" }, day.activities.map((v, j) => /* @__PURE__ */ React.createElement("span", { key: j, className: "itin-chip" }, stripPrefix(v))))), day.wellness.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "itin-day-block" }, /* @__PURE__ */ React.createElement("div", { className: "itin-day-label" }, "\u{1F486} ", ctx.lang === "no" ? "Velv\xE6re" : "Wellness"), /* @__PURE__ */ React.createElement("div", { className: "itin-card-chips" }, day.wellness.map((v, j) => /* @__PURE__ */ React.createElement("span", { key: j, className: "itin-chip" }, wellnessLabel(v))))), day.pool.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "itin-day-block" }, /* @__PURE__ */ React.createElement("div", { className: "itin-day-label" }, "\u{1F3DC}\uFE0F\u2600\uFE0F ", ctx.lang === "no" ? "Agafay / Basseng" : "Agafay / Pool"), /* @__PURE__ */ React.createElement("div", { className: "itin-card-chips" }, day.pool.map((v, j) => /* @__PURE__ */ React.createElement("span", { key: j, className: "itin-chip" }, stripPrefix(v))))), day.restaurant && /* @__PURE__ */ React.createElement("div", { className: "itin-day-block" }, /* @__PURE__ */ React.createElement("div", { className: "itin-day-label" }, "\u{1F37D}\uFE0F ", ctx.lang === "no" ? "Middag" : "Dinner"), /* @__PURE__ */ React.createElement("div", { className: "itin-card-chips" }, /* @__PURE__ */ React.createElement("span", { className: "itin-chip" }, restLabel(day.restaurant))))), /* @__PURE__ */ React.createElement("div", { className: "itin-tl-stay" }, /* @__PURE__ */ React.createElement(If.Bed, { s: 11 }), " ", genericStay(stayKey))));
      }));
    })());
  })()))));
}
window.MS_Form = ItineraryBuilder;
