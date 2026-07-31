const { useState: useStateB, useEffect: useEffectB, useMemo: useMemoB, useRef: useRefB } = React;
const Ib = window.MS_I;
const WHATSAPP = "4745774743";
function todayPlusBk(days) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function readUserPrefill() {
  try {
    const user = window.MS_Auth_User || JSON.parse(localStorage.getItem("ms_user") || "null");
    const profile = JSON.parse(localStorage.getItem("ms_profile_data") || "{}");
    return {
      name: profile.name || (user == null ? void 0 : user.name) || "",
      email: profile.email || (user == null ? void 0 : user.email) || "",
      phone: profile.phone || ""
    };
  } catch (e) {
    return { name: "", email: "", phone: "" };
  }
}
function whatsappUrl(text) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}
function QuickBookModal({ item, tab, onClose }) {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const prefill = readUserPrefill();
  const [date, setDate] = useStateB(todayPlusBk(14));
  const [people, setPeople] = useStateB(2);
  const [name, setName] = useStateB(prefill.name);
  const [email, setEmail] = useStateB(prefill.email);
  const [phone, setPhone] = useStateB(prefill.phone);
  const [notes, setNotes] = useStateB("");
  const [needTransport, setNeedTransport] = useStateB(false);
  const [pickupAddr, setPickupAddr] = useStateB("");
  const [sent, setSent] = useStateB(false);
  useEffectB(() => {
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
  const dateLabel = new Date(date).toLocaleDateString(
    lang === "no" ? "no-NO" : lang === "fr" ? "fr-FR" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" }
  );
  const transportLine = () => needTransport ? tx(
    `
\u2022 Transport needed: yes${pickupAddr ? ` (pickup: ${pickupAddr})` : ""}`,
    `
\u2022 Trenger transport: ja${pickupAddr ? ` (henting: ${pickupAddr})` : ""}`,
    `
\u2022 Transport n\xE9cessaire : oui${pickupAddr ? ` (prise en charge : ${pickupAddr})` : ""}`
  ) : "";
  const buildMessage = () => {
    return tx(
      `Hi Marrakechstory, I'd like to book just this:

\u2022 ${item.name}
\u2022 Date: ${dateLabel}
\u2022 People: ${people}
\u2022 Name: ${name}
\u2022 Email: ${email}
\u2022 Phone: ${phone}${transportLine()}${notes ? `
\u2022 Notes: ${notes}` : ""}`,
      `Hei Marrakechstory, jeg vil bestille kun dette:

\u2022 ${item.name}
\u2022 Dato: ${dateLabel}
\u2022 Antall: ${people}
\u2022 Navn: ${name}
\u2022 E-post: ${email}
\u2022 Telefon: ${phone}${transportLine()}${notes ? `
\u2022 Notater: ${notes}` : ""}`,
      `Bonjour Marrakechstory, je souhaite r\xE9server uniquement ceci :

\u2022 ${item.name}
\u2022 Date : ${dateLabel}
\u2022 Personnes : ${people}
\u2022 Nom : ${name}
\u2022 Email : ${email}
\u2022 T\xE9l\xE9phone : ${phone}${transportLine()}${notes ? `
\u2022 Notes : ${notes}` : ""}`
    );
  };
  const persistQuickBook = (via) => {
    try {
      const reqs = JSON.parse(localStorage.getItem("ms_requests") || "[]");
      reqs.push({ type: "single", item: item.name, tab, date, people, name, email, phone, notes, needTransport, pickupAddr, at: Date.now() });
      localStorage.setItem("ms_requests", JSON.stringify(reqs));
    } catch (e) {
    }
    if (window.MS_submitForm) {
      window.MS_submitForm("quickbook", {
        item: item.name,
        tab,
        date,
        people,
        name,
        email,
        phone,
        notes,
        needTransport,
        pickupAddr,
        startDate: date,
        endDate: date,
        duration: 1
      }, { via });
    }
  };
  const sendWhatsapp = () => {
    if (!name.trim() || !email.trim()) return;
    persistQuickBook("whatsapp");
    window.open(whatsappUrl(buildMessage()), "_blank", "noopener");
    setSent(true);
    if (window.MS_Auth_PromptAfterBooking) window.MS_Auth_PromptAfterBooking();
  };
  const sendEmail = () => {
    if (!name.trim() || !email.trim()) return;
    const subject = `Booking \u2014 ${item.name}`;
    const body = buildMessage();
    window.location.href = `mailto:marrakechstory@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    persistQuickBook("email");
    setSent(true);
    if (window.MS_Auth_PromptAfterBooking) window.MS_Auth_PromptAfterBooking();
  };
  return /* @__PURE__ */ React.createElement("div", { className: "ms-qb-backdrop", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "ms-qb-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "ms-qb-close", onClick: onClose, "aria-label": "Close" }, "\u2715"), /* @__PURE__ */ React.createElement("div", { className: "ms-qb-head", style: { backgroundImage: `url(${item.img})` } }, /* @__PURE__ */ React.createElement("div", { className: "ms-qb-head-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "ms-qb-head-eyebrow" }, tx("QUICK BOOK", "RASK BOOKING", "R\xC9SERVATION RAPIDE")), /* @__PURE__ */ React.createElement("div", { className: "ms-qb-head-title" }, item.name))), /* @__PURE__ */ React.createElement("div", { className: "ms-qb-body" }, sent ? /* @__PURE__ */ React.createElement("div", { className: "ms-qb-sent" }, /* @__PURE__ */ React.createElement("div", { className: "ms-qb-sent-icon" }, "\u2713"), /* @__PURE__ */ React.createElement("h3", null, tx("Request sent", "Foresp\xF8rsel sendt", "Demande envoy\xE9e")), /* @__PURE__ */ React.createElement("p", null, tx(
    "We've received your booking request. The team will confirm by email or WhatsApp within 24 hours.",
    "Vi har mottatt foresp\xF8rselen din. Teamet bekrefter p\xE5 e-post eller WhatsApp innen 24 timer.",
    "Nous avons re\xE7u votre demande. L'\xE9quipe vous confirmera par e-mail ou WhatsApp sous 24 h."
  )), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, tx("Close", "Lukk", "Fermer"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "ms-qb-intro" }, tx(
    "Just want this one thing? Skip the full planner \u2014 give us a date, who's coming, and how to reach you.",
    "Bare denne ene? Hopp over hele planleggeren \u2014 gi oss en dato, hvem som blir med og kontaktinfo.",
    "Juste cela ? Sautez le planificateur \u2014 donnez-nous une date, qui vient, et comment vous joindre."
  )), /* @__PURE__ */ React.createElement("div", { className: "ms-qb-grid" }, /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field" }, /* @__PURE__ */ React.createElement("span", null, tx("Date", "Dato", "Date")), /* @__PURE__ */ React.createElement("input", { type: "date", value: date, min: todayPlusBk(0), onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field" }, /* @__PURE__ */ React.createElement("span", null, tx("People", "Antall", "Personnes")), /* @__PURE__ */ React.createElement("div", { className: "ms-qb-stepper" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setPeople((p) => Math.max(1, p - 1)) }, "\u2212"), /* @__PURE__ */ React.createElement("span", null, people), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setPeople((p) => Math.min(20, p + 1)) }, "+"))), /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field", style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ React.createElement("span", null, tx("Full name", "Fullt navn", "Nom complet")), /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), autoComplete: "name" })), /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field" }, /* @__PURE__ */ React.createElement("span", null, tx("Email", "E-post", "E-mail")), /* @__PURE__ */ React.createElement("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email" })), /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field" }, /* @__PURE__ */ React.createElement("span", null, tx("Phone", "Telefon", "T\xE9l\xE9phone")), /* @__PURE__ */ React.createElement("input", { type: "tel", value: phone, onChange: (e) => setPhone(e.target.value), autoComplete: "tel", placeholder: "+47 \u2026" })), /* @__PURE__ */ React.createElement("div", { className: "ms-qb-transport" }, /* @__PURE__ */ React.createElement("label", { className: "ms-qb-transport-row" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: needTransport, onChange: (e) => setNeedTransport(e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, tx("I need transportation", "Jeg trenger transport", "J'ai besoin de transport")), /* @__PURE__ */ React.createElement("em", null, tx(
    "Transport is not included \u2014 tick to add a driver.",
    "Transport er ikke inkludert \u2014 kryss av om vi skal legge til sj\xE5f\xF8r.",
    "Le transport n'est pas inclus \u2014 cochez pour ajouter un chauffeur."
  )))), needTransport && /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "ms-qb-transport-addr",
      value: pickupAddr,
      onChange: (e) => setPickupAddr(e.target.value),
      placeholder: tx("Pickup address (hotel / riad name)", "Henteadresse (hotell / riad)", "Adresse de prise en charge")
    }
  )), /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field", style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ React.createElement("span", null, tx("Notes (optional)", "Notater (valgfritt)", "Notes (optionnel)")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 2,
      autoComplete: "off",
      value: notes,
      onChange: (e) => setNotes(e.target.value),
      placeholder: tx("Allergies, time preference\u2026", "Allergier, tidspreferanse \u2026", "Allergies, pr\xE9f\xE9rence horaire \u2026")
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "ms-qb-cta-row" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: sendWhatsapp, disabled: !name.trim() || !email.trim() }, "\u{1F4F1} ", tx("Send via WhatsApp", "Send via WhatsApp", "Envoyer via WhatsApp")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline", onClick: sendEmail, disabled: !name.trim() || !email.trim() }, "\u2709 ", tx("Send by email", "Send p\xE5 e-post", "Envoyer par e-mail"))), /* @__PURE__ */ React.createElement("p", { className: "ms-qb-note" }, tx(
    "No payment now \u2014 we confirm availability and price, you pay directly to the provider.",
    "Ingen betaling n\xE5 \u2014 vi bekrefter ledighet og pris, du betaler direkte til leverand\xF8ren.",
    "Aucun paiement maintenant \u2014 nous confirmons disponibilit\xE9 et prix, vous payez directement."
  ))))));
}
function TweakItineraryModal({ trip, onClose }) {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const L = (v) => v == null ? "" : typeof v === "string" ? v : v[lang] || v.en || v.no || v.nb || v.fr || v.sv || Object.values(v).find((x) => typeof x === "string") || "";
  const prefill = readUserPrefill();
  const initialDays = useMemoB(() => (trip.itinerary || []).map((d, i) => ({
    id: `day-${i}`,
    day: d.day || i + 1,
    route: L(d.route),
    text: L(d.text),
    extras: []
    // added catalog items per day
  })), [trip, lang]);
  const [days, setDays] = useStateB(initialDays);
  const [pickerOpenFor, setPickerOpenFor] = useStateB(null);
  const [date, setDate] = useStateB(todayPlusBk(28));
  const [name, setName] = useStateB(prefill.name);
  const [email, setEmail] = useStateB(prefill.email);
  const [phone, setPhone] = useStateB(prefill.phone);
  const [notes, setNotes] = useStateB("");
  const [sent, setSent] = useStateB(false);
  useEffectB(() => {
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
  const removeDay = (id) => setDays((ds) => ds.filter((d) => d.id !== id));
  const removeExtra = (dayId, extraIdx) => setDays((ds) => ds.map((d) => d.id !== dayId ? d : { ...d, extras: d.extras.filter((_, i) => i !== extraIdx) }));
  const addExtra = (dayId, item, tab) => {
    setDays((ds) => ds.map((d) => d.id !== dayId ? d : { ...d, extras: [...d.extras, { item, tab }] }));
    setPickerOpenFor(null);
  };
  const buildMessage = () => {
    const dateLabel = new Date(date).toLocaleDateString(
      lang === "no" ? "no-NO" : lang === "fr" ? "fr-FR" : "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    );
    const tripLines = days.map((d) => {
      const extrasText = d.extras.map((e) => `   + ${L(e.item.name)}`).join("\n");
      return `Day ${d.day} \u2014 ${d.route}
   ${d.text}${extrasText ? "\n" + extrasText : ""}`;
    }).join("\n\n");
    const baseTitle = L(trip.title);
    return tx(
      `Hi Marrakechstory, I'd like to book this trip with my own tweaks:

Base trip: ${baseTitle} (${trip.duration})
Start date: ${dateLabel}

Name: ${name}
Email: ${email}
Phone: ${phone}

My custom day-by-day:

${tripLines}

${notes ? `Notes: ${notes}` : ""}`,
      `Hei Marrakechstory, jeg vil bestille denne turen med mine tilpasninger:

Basetur: ${baseTitle} (${trip.duration})
Startdato: ${dateLabel}

Navn: ${name}
E-post: ${email}
Telefon: ${phone}

Min tilpassede plan:

${tripLines}

${notes ? `Notater: ${notes}` : ""}`,
      `Bonjour Marrakechstory, je souhaite r\xE9server ce voyage avec mes ajustements :

Base : ${baseTitle} (${trip.duration})
Date de d\xE9but : ${dateLabel}

Nom : ${name}
Email : ${email}
T\xE9l\xE9phone : ${phone}

Mon planning personnalis\xE9 :

${tripLines}

${notes ? `Notes : ${notes}` : ""}`
    );
  };
  const sendRequest = () => {
    if (!name.trim() || !email.trim()) return;
    try {
      const reqs = JSON.parse(localStorage.getItem("ms_requests") || "[]");
      reqs.push({ type: "tweaked", baseTrip: trip.slug, days: days.length, extras: days.reduce((s, d) => s + d.extras.length, 0), name, email, at: Date.now() });
      localStorage.setItem("ms_requests", JSON.stringify(reqs));
    } catch (e) {
    }
    if (window.MS_submitForm) {
      window.MS_submitForm("tweak", {
        name,
        email,
        phone,
        notes,
        baseTrip: trip.slug,
        baseTitle: trip.title,
        baseDuration: trip.duration,
        startDate: date,
        duration: days.length,
        days: days.map((d) => ({ day: d.day, route: d.route, text: d.text, extras: d.extras.map((e) => ({ item: L(e.item && e.item.name), tab: e.tab })) })),
        message: buildMessage()
      }, { via: "website" });
    }
    setSent(true);
    if (window.MS_Auth_PromptAfterBooking) window.MS_Auth_PromptAfterBooking();
  };
  return /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-backdrop", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "ms-tweak-close", onClick: onClose, "aria-label": "Close" }, "\u2715"), /* @__PURE__ */ React.createElement("header", { className: "ms-tweak-head" }, /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-eyebrow" }, "\u2014 ", tx("TWEAK THIS TRIP", "TILPASS DENNE TUREN", "PERSONNALISER CE VOYAGE")), /* @__PURE__ */ React.createElement("h2", null, L(trip.title)), /* @__PURE__ */ React.createElement("p", null, tx(
    "Remove days you don't want. Add anything from our catalogue. We'll cost it up and confirm.",
    "Fjern dager du ikke vil ha. Legg til hva som helst fra katalogen. Vi priser det og bekrefter.",
    "Retirez ce que vous ne voulez pas. Ajoutez ce qui vous pla\xEEt du catalogue. On chiffre et on confirme."
  ))), sent ? /* @__PURE__ */ React.createElement("div", { className: "ms-qb-sent" }, /* @__PURE__ */ React.createElement("div", { className: "ms-qb-sent-icon" }, "\u2713"), /* @__PURE__ */ React.createElement("h3", null, tx("Custom trip request sent", "Tilpasset reise sendt", "Demande personnalis\xE9e envoy\xE9e")), /* @__PURE__ */ React.createElement("p", null, tx(
    "We've got your custom itinerary. Expect a reply within 24 hours.",
    "Vi har mottatt din tilpassede reise. Svar innen 24 timer.",
    "Nous avons re\xE7u votre itin\xE9raire. R\xE9ponse sous 24 h."
  )), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: onClose }, tx("Close", "Lukk", "Fermer"))) : /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-body" }, /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-days" }, days.map((d) => /* @__PURE__ */ React.createElement("div", { key: d.id, className: "ms-tweak-day" }, /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-day-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-day-num" }, tx("Day", "Dag", "Jour"), " ", d.day), /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-day-route" }, d.route)), /* @__PURE__ */ React.createElement("button", { className: "ms-tweak-remove", onClick: () => removeDay(d.id), "aria-label": "Remove day" }, "\u2715")), /* @__PURE__ */ React.createElement("p", { className: "ms-tweak-day-text" }, d.text), d.extras.length > 0 && /* @__PURE__ */ React.createElement("ul", { className: "ms-tweak-extras" }, d.extras.map((e, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement("span", null, "+ ", L(e.item.name)), /* @__PURE__ */ React.createElement("button", { onClick: () => removeExtra(d.id, i), "aria-label": "Remove" }, "\xD7")))), /* @__PURE__ */ React.createElement("button", { className: "ms-tweak-add", onClick: () => setPickerOpenFor(d.id) }, "+ ", tx("Add from catalogue", "Legg til fra katalog", "Ajouter du catalogue")))), days.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-empty" }, tx("No days left. Add one or start fresh.", "Ingen dager igjen. Legg til en eller start p\xE5 nytt.", "Aucun jour. Ajoutez-en un ou recommencez."))), /* @__PURE__ */ React.createElement("div", { className: "ms-tweak-contact" }, /* @__PURE__ */ React.createElement("h3", { className: "ms-tweak-h3" }, tx("Your details", "Dine opplysninger", "Vos coordonn\xE9es")), /* @__PURE__ */ React.createElement("div", { className: "ms-qb-grid" }, /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field" }, /* @__PURE__ */ React.createElement("span", null, tx("Start date", "Startdato", "Date de d\xE9but")), /* @__PURE__ */ React.createElement("input", { type: "date", value: date, min: todayPlusBk(0), onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field" }, /* @__PURE__ */ React.createElement("span", null, tx("Full name", "Fullt navn", "Nom complet")), /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), autoComplete: "name" })), /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field" }, /* @__PURE__ */ React.createElement("span", null, tx("Email", "E-post", "E-mail")), /* @__PURE__ */ React.createElement("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email" })), /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field" }, /* @__PURE__ */ React.createElement("span", null, tx("Phone", "Telefon", "T\xE9l\xE9phone")), /* @__PURE__ */ React.createElement("input", { type: "tel", value: phone, onChange: (e) => setPhone(e.target.value), autoComplete: "tel", placeholder: "+47 \u2026" })), /* @__PURE__ */ React.createElement("label", { className: "ms-qb-field", style: { gridColumn: "1 / -1" } }, /* @__PURE__ */ React.createElement("span", null, tx("Anything else?", "Annet?", "Autre chose ?")), /* @__PURE__ */ React.createElement("textarea", { rows: 2, autoComplete: "off", value: notes, onChange: (e) => setNotes(e.target.value) })))), /* @__PURE__ */ React.createElement("div", { className: "ms-qb-cta-row" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: sendRequest, disabled: !name.trim() || !email.trim() }, tx("Send request", "Send foresp\xF8rsel", "Envoyer la demande"), " \u2192")), /* @__PURE__ */ React.createElement("p", { className: "ms-qb-note" }, tx(
    `${days.reduce((s, d) => s + d.extras.length, 0)} extras added \xB7 ${days.length} days kept`,
    `${days.reduce((s, d) => s + d.extras.length, 0)} ekstrapunkter lagt til \xB7 ${days.length} dager beholdt`,
    `${days.reduce((s, d) => s + d.extras.length, 0)} extras ajout\xE9s \xB7 ${days.length} jours conserv\xE9s`
  ))), pickerOpenFor && /* @__PURE__ */ React.createElement(
    CatalogPicker,
    {
      onClose: () => setPickerOpenFor(null),
      onPick: (item, tab) => addExtra(pickerOpenFor, item, tab),
      lang
    }
  )));
}
function CatalogPicker({ onClose, onPick, lang }) {
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const L = (v) => v == null ? "" : typeof v === "object" && !Array.isArray(v) ? v[lang] || v.en || v.no || v.fr || "" : v;
  const D = window.MS_DATA || {};
  const [tab, setTab] = useStateB("activities");
  const [q, setQ] = useStateB("");
  const TABS = [
    { id: "activities", label: tx("Activities", "Aktiviteter", "Activit\xE9s"), data: D.ACTIVITIES || [] },
    { id: "restaurants", label: tx("Restaurants", "Restauranter", "Restaurants"), data: D.RESTAURANTS || [] },
    { id: "spa", label: tx("Spa", "Spa", "Spa"), data: D.SPAS || [] },
    { id: "pools", label: tx("Pools", "Basseng", "Piscines"), data: D.POOLS || [] },
    { id: "camps", label: tx("Camps", "Leirer", "Camps"), data: D.CAMPS || [] },
    { id: "transport", label: tx("Transport", "Transport", "Transport"), data: D.TRANSPORT || [] }
  ];
  const current = TABS.find((t) => t.id === tab);
  const items = useMemoB(() => {
    if (!q.trim()) return current.data.slice(0, 30);
    const lq = q.toLowerCase();
    return current.data.filter((i) => (L(i.name) + " " + L(i.desc) + " " + L(i.area)).toLowerCase().includes(lq)).slice(0, 30);
  }, [tab, q, current]);
  return /* @__PURE__ */ React.createElement("div", { className: "ms-picker-backdrop", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "ms-picker-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "ms-picker-close", onClick: onClose, "aria-label": "Close" }, "\u2715"), /* @__PURE__ */ React.createElement("header", null, /* @__PURE__ */ React.createElement("h3", null, tx("Add from the catalogue", "Legg til fra katalogen", "Ajouter du catalogue")), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "ms-picker-search",
      type: "search",
      value: q,
      onChange: (e) => setQ(e.target.value),
      placeholder: tx("Search any activity, riad, spa, restaurant\u2026", "S\xF8k aktivitet, riad, spa, restaurant \u2026", "Chercher activit\xE9, riad, spa \u2026")
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "ms-picker-tabs" }, TABS.map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t.id,
      className: `ms-picker-tab ${tab === t.id ? "active" : ""}`,
      onClick: () => setTab(t.id)
    },
    t.label,
    " ",
    /* @__PURE__ */ React.createElement("span", null, t.data.length)
  ))), /* @__PURE__ */ React.createElement("div", { className: "ms-picker-list" }, items.map((it, i) => /* @__PURE__ */ React.createElement("button", { key: i, className: "ms-picker-item", onClick: () => onPick(it, tab) }, /* @__PURE__ */ React.createElement("div", { className: "ms-picker-thumb", style: { backgroundImage: `url(${it.img})` } }), /* @__PURE__ */ React.createElement("div", { className: "ms-picker-meta" }, /* @__PURE__ */ React.createElement("strong", null, L(it.name)), /* @__PURE__ */ React.createElement("span", null, L(it.area))), /* @__PURE__ */ React.createElement("span", { className: "ms-picker-add" }, "+"))), items.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-picker-empty" }, tx("No matches.", "Ingen treff.", "Aucun r\xE9sultat.")))));
}
function FavouritesQuickAdd() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const L = (v) => v == null ? "" : typeof v === "string" ? v : v[lang] || v.en || v.no || v.nb || v.fr || v.sv || Object.values(v).find((x) => typeof x === "string") || "";
  const [favs, setFavs] = useStateB([]);
  const [tweakTrip, setTweakTrip] = useStateB(null);
  const [pickerOpen, setPickerOpen] = useStateB(false);
  useEffectB(() => {
    const refresh = () => {
      let catFavs = {}, itinFavs = [];
      try {
        catFavs = JSON.parse(localStorage.getItem("ms_catalog_favs") || "{}");
        itinFavs = JSON.parse(localStorage.getItem("ms_user_favs") || "[]");
      } catch (e) {
      }
      const D = window.MS_DATA || {};
      const arrays = { activities: "ACTIVITIES", restaurants: "RESTAURANTS", spa: "SPAS", camps: "CAMPS", pools: "POOLS", transport: "TRANSPORT" };
      const items = [];
      Object.entries(arrays).forEach(([tab, k]) => {
        (D[k] || []).forEach((it) => {
          if (catFavs[`${tab}-${it.name}`]) items.push({ kind: "catalog", tab, item: it });
        });
      });
      (window.MS_ITINERARIES || []).filter((t2) => itinFavs.includes(t2.slug)).forEach((t2) => items.push({ kind: "itinerary", trip: t2 }));
      setFavs(items);
    };
    refresh();
    const onStorage = (e) => {
      if (e.key === "ms_catalog_favs" || e.key === "ms_user_favs") refresh();
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(refresh, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);
  if (favs.length === 0) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "ms-favs reveal", id: "my-favourites" }, /* @__PURE__ */ React.createElement("div", { className: "ms-favs-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "ms-favs-eyebrow" }, "\u2014 ", tx("YOUR FAVOURITES", "DINE FAVORITTER", "VOS FAVORIS")), /* @__PURE__ */ React.createElement("h3", null, tx("Start your trip from what you saved", "Start reisen fra det du har lagret", "D\xE9marrez du contenu sauvegard\xE9"))), /* @__PURE__ */ React.createElement("span", { className: "ms-favs-count" }, favs.length)), /* @__PURE__ */ React.createElement("div", { className: "ms-favs-list" }, favs.map((f, i) => {
    if (f.kind === "catalog") {
      return /* @__PURE__ */ React.createElement("div", { key: `c-${i}`, className: "ms-fav-card" }, /* @__PURE__ */ React.createElement("div", { className: "ms-fav-thumb", style: { backgroundImage: `url(${f.item.img})` } }), /* @__PURE__ */ React.createElement("div", { className: "ms-fav-meta" }, /* @__PURE__ */ React.createElement("strong", null, L(f.item.name)), /* @__PURE__ */ React.createElement("span", null, L(f.item.area))), /* @__PURE__ */ React.createElement("button", { className: "ms-fav-cta", onClick: () => {
        var _a;
        return (_a = window.MS_OpenQuickBook) == null ? void 0 : _a.call(window, f.item, f.tab);
      } }, tx("Book this \u2192", "Bestill \u2192", "R\xE9server \u2192")));
    }
    return /* @__PURE__ */ React.createElement("div", { key: `i-${i}`, className: "ms-fav-card ms-fav-card-itin" }, /* @__PURE__ */ React.createElement("div", { className: "ms-fav-thumb", style: { backgroundImage: `url(${f.trip.img})` } }), /* @__PURE__ */ React.createElement("div", { className: "ms-fav-meta" }, /* @__PURE__ */ React.createElement("strong", null, L(f.trip.title)), /* @__PURE__ */ React.createElement("span", null, f.trip.duration, " \xB7 ", L(f.trip.route))), /* @__PURE__ */ React.createElement("button", { className: "ms-fav-cta", onClick: () => setTweakTrip(f.trip) }, tx("Tweak this \u2192", "Tilpass \u2192", "Personnaliser \u2192")));
  })), tweakTrip && /* @__PURE__ */ React.createElement(TweakItineraryModal, { trip: tweakTrip, onClose: () => setTweakTrip(null) }));
}
window.MS_OpenQuickBook = null;
function QuickBookHost() {
  const [current, setCurrent] = useStateB(null);
  useEffectB(() => {
    window.MS_OpenQuickBook = (item, tab) => setCurrent({ item, tab });
    return () => {
      window.MS_OpenQuickBook = null;
    };
  }, []);
  if (!current) return null;
  return /* @__PURE__ */ React.createElement(QuickBookModal, { item: current.item, tab: current.tab, onClose: () => setCurrent(null) });
}
window.MS_QuickBookHost = QuickBookHost;
window.MS_TweakItineraryModal = TweakItineraryModal;
window.MS_OpenTweak = null;
function TweakHost() {
  const [trip, setTrip] = useStateB(null);
  useEffectB(() => {
    window.MS_OpenTweak = (t) => setTrip(t);
    return () => {
      window.MS_OpenTweak = null;
    };
  }, []);
  if (!trip) return null;
  return /* @__PURE__ */ React.createElement(TweakItineraryModal, { trip, onClose: () => setTrip(null) });
}
window.MS_TweakHost = TweakHost;
window.MS_FavouritesQuickAdd = FavouritesQuickAdd;
