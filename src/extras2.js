const { useState: useStateE2, useEffect: useEffectE2, useRef: useRefE2 } = React;
const COOKIE_KEY = "ms_cookie_choice";
function CookieBanner() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const [open, setOpen] = useStateE2(false);
  useEffectE2(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);
  const choose = (choice) => {
    localStorage.setItem(COOKIE_KEY, choice);
    setOpen(false);
  };
  if (!open) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "ms-cookie-banner", role: "dialog", "aria-label": "Cookies" }, /* @__PURE__ */ React.createElement("div", { className: "ms-cookie-inner" }, /* @__PURE__ */ React.createElement("div", { className: "ms-cookie-text" }, /* @__PURE__ */ React.createElement("strong", null, tx("We use cookies", "Vi bruker cookies", "Nous utilisons des cookies")), /* @__PURE__ */ React.createElement("p", null, tx(
    "We use a few small files to remember your language, your bookings, and how you use the site. You can say no \u2014 the site will still work.",
    "Vi bruker noen sm\xE5 filer for \xE5 huske spr\xE5ket ditt, bestillingene dine og hvordan du bruker siden. Du kan si nei \u2014 siden fungerer fortsatt.",
    "Nous utilisons quelques petits fichiers pour m\xE9moriser votre langue, vos r\xE9servations et votre utilisation du site. Vous pouvez refuser \u2014 le site fonctionnera quand m\xEAme."
  ))), /* @__PURE__ */ React.createElement("div", { className: "ms-cookie-actions" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline ms-cookie-btn", onClick: () => choose("declined") }, tx("No, thanks", "Nei takk", "Non merci")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary ms-cookie-btn", onClick: () => choose("accepted") }, tx("Accept", "Godta", "Accepter")))));
}
const FAQ = {
  en: [
    { q: "How do I book a trip?", a: "Pick an itinerary you like and tap 'Plan this trip', or fill in the form at the bottom. We reply within 24 hours by email or WhatsApp." },
    { q: "What does the price include?", a: "Each itinerary lists what's included (driver, hotels, some meals) and what's not (flights, drinks, tips). Open any trip and scroll to the 'Included' box." },
    { q: "Can you change the trip for me?", a: "Yes \u2014 every itinerary is a starting point. We change hotels, pace, length and stops to fit you. Just tell us in the form." },
    { q: "How do I pay?", a: "30% to confirm the booking. The rest 30 days before you travel. We send a safe payment link." },
    { q: "Can I cancel?", a: "Free cancel up to 30 days before. 50% from 30 to 14 days. No refund inside 14 days." },
    { q: "How many people can join?", a: "Minimum 2. Children from 6 unless we say otherwise. Bigger groups \u2014 just ask." },
    { q: "Do you handle flights?", a: "We don't sell flights, but we help you find the best route and time. Direct from Oslo to Marrakech runs Nov\u2013Apr." },
    { q: "Where are you based?", a: "In Marrakech. Norwegian-Moroccan team. We answer on WhatsApp from 09 to 22 every day: +47 457 74 743." },
    { q: "Is travel insurance included?", a: "No \u2014 we strongly suggest you take one. We can point you to a partner." },
    { q: "Do you speak Norwegian?", a: "Yes. Aladdin (the founder) is Norwegian-Moroccan. Email, WhatsApp and call in Norwegian, English or French." }
  ],
  no: [
    { q: "Hvordan bestiller jeg en tur?", a: "Velg en reise du liker og trykk 'Planlegg denne turen', eller fyll ut skjemaet nederst. Vi svarer innen 24 timer p\xE5 e-post eller WhatsApp." },
    { q: "Hva er inkludert i prisen?", a: "Hver reise viser hva som er med (sj\xE5f\xF8r, hoteller, noen m\xE5ltider) og hva som ikke er det (fly, drikke, tips). \xC5pne en reise og se 'Inkludert'-boksen." },
    { q: "Kan dere tilpasse reisen?", a: "Ja \u2014 hver reise er et utgangspunkt. Vi endrer hoteller, tempo, lengde og stopp etter deg. Skriv det i skjemaet." },
    { q: "Hvordan betaler jeg?", a: "30 % for \xE5 bekrefte. Resten 30 dager f\xF8r avreise. Vi sender en trygg betalingslenke." },
    { q: "Kan jeg avbestille?", a: "Gratis inntil 30 dager f\xF8r. 50 % fra 30 til 14 dager. Ingen refusjon innen 14 dager." },
    { q: "Hvor mange kan v\xE6re med?", a: "Minimum 2. Barn fra 6 \xE5r dersom ikke annet er sagt. St\xF8rre grupper \u2014 bare sp\xF8r." },
    { q: "Ordner dere fly?", a: "Vi selger ikke fly, men hjelper deg finne beste rute og tid. Direkterute Oslo\u2013Marrakech g\xE5r nov\u2013april." },
    { q: "Hvor holder dere til?", a: "I Marrakech. Norsk-marokkansk team. Vi svarer p\xE5 WhatsApp 09\u201322 hver dag: +47 457 74 743." },
    { q: "Er reiseforsikring med?", a: "Nei \u2014 vi anbefaler sterkt at du tegner en. Vi kan peke deg mot en partner." },
    { q: "Snakker dere norsk?", a: "Ja. Aladdin (gr\xFCnderen) er norsk-marokkansk. E-post, WhatsApp og samtale p\xE5 norsk, engelsk eller fransk." }
  ],
  fr: [
    { q: "Comment r\xE9server un voyage ?", a: "Choisissez un itin\xE9raire et appuyez sur 'Planifier ce voyage', ou remplissez le formulaire en bas. R\xE9ponse sous 24 h par e-mail ou WhatsApp." },
    { q: "Que comprend le prix ?", a: "Chaque itin\xE9raire indique ce qui est inclus (chauffeur, h\xF4tels, certains repas) et ce qui ne l'est pas (vols, boissons, pourboires)." },
    { q: "Pouvez-vous adapter le voyage ?", a: "Oui \u2014 chaque itin\xE9raire est un point de d\xE9part. On change h\xF4tels, rythme, dur\xE9e, \xE9tapes." },
    { q: "Comment je paie ?", a: "30 % pour confirmer. Le solde 30 jours avant le d\xE9part. Lien de paiement s\xE9curis\xE9." },
    { q: "Puis-je annuler ?", a: "Annulation gratuite jusqu'\xE0 30 jours avant. 50 % entre 30 et 14 jours. Aucun remboursement \xE0 moins de 14 jours." },
    { q: "Combien de personnes ?", a: "Minimum 2. Enfants \xE0 partir de 6 ans sauf indication. Grands groupes \u2014 demandez." },
    { q: "G\xE9rez-vous les vols ?", a: "Non, mais nous vous aidons \xE0 trouver la meilleure route. Direct Oslo-Marrakech nov\u2013avril." },
    { q: "O\xF9 \xEAtes-vous ?", a: "\xC0 Marrakech. \xC9quipe norv\xE9gienne-marocaine. WhatsApp 9 h \u2013 22 h tous les jours : +47 457 74 743." },
    { q: "L'assurance est-elle incluse ?", a: "Non \u2014 fortement recommand\xE9e. Nous pouvons vous orienter." },
    { q: "Parlez-vous fran\xE7ais ?", a: "Oui. Norv\xE9gien, anglais, fran\xE7ais \u2014 par e-mail, WhatsApp ou t\xE9l\xE9phone." }
  ]
};
function Chatbot() {
  const { useMS, COMPANY } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const [open, setOpen] = useStateE2(false);
  const [messages, setMessages] = useStateE2([
    { from: "bot", text: tx(
      "Hi! I'm the Marrakechstory helper. Ask me anything \u2014 or pick a question below.",
      "Hei! Jeg er Marrakechstory-hjelperen. Sp\xF8r om hva som helst \u2014 eller velg et sp\xF8rsm\xE5l.",
      "Bonjour ! Je suis l'assistant Marrakechstory. Posez-moi une question \u2014 ou choisissez-en une."
    ) }
  ]);
  const [input, setInput] = useStateE2("");
  const endRef = useRefE2(null);
  const faq = FAQ[lang === "no" ? "no" : lang === "fr" ? "fr" : "en"];
  useEffectE2(() => {
    var _a;
    (_a = endRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const send = (text) => {
    if (!text || !text.trim()) return;
    const userMsg = { from: "user", text };
    const lowered = text.toLowerCase();
    const scored = faq.map((item) => {
      const words = item.q.toLowerCase().split(/\W+/).concat(item.a.toLowerCase().split(/\W+/));
      const score = words.filter((w) => w.length > 3 && lowered.includes(w)).length;
      return { item, score };
    }).sort((a, b) => b.score - a.score);
    const best = scored[0];
    let reply;
    if (best.score === 0) {
      reply = tx(
        "I'll send your question to the team \u2014 they answer within 24 h. Or WhatsApp us right away: +47 457 74 743.",
        "Jeg sender sp\xF8rsm\xE5let ditt til teamet \u2014 de svarer innen 24 t. Eller WhatsApp oss med en gang: +47 457 74 743.",
        "Je transmets votre question \xE0 l'\xE9quipe \u2014 r\xE9ponse sous 24 h. Ou WhatsApp tout de suite : +47 457 74 743."
      );
    } else {
      reply = best.item.a;
    }
    setMessages((m) => [...m, userMsg, { from: "bot", text: reply }]);
    setInput("");
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: `ms-chat-fab ${open ? "open" : ""}`,
      onClick: () => setOpen((o) => !o),
      "aria-label": tx("Open chat", "\xC5pne chat", "Ouvrir le chat")
    },
    open ? /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M18 6L6 18M6 6l12 12" })) : (
      // Gemini-style 4-point sparkle
      /* @__PURE__ */ React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M12 2 L13.6 9.1 Q13.9 10.3 15 10.6 L22 12 L15 13.4 Q13.9 13.7 13.6 14.9 L12 22 L10.4 14.9 Q10.1 13.7 9 13.4 L2 12 L9 10.6 Q10.1 10.3 10.4 9.1 Z" }), /* @__PURE__ */ React.createElement("circle", { cx: "19.5", cy: "4.5", r: "1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "5", cy: "19", r: "1" }))
    )
  ), open && /* @__PURE__ */ React.createElement("div", { className: "ms-chat-panel", role: "dialog" }, /* @__PURE__ */ React.createElement("div", { className: "ms-chat-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, tx("Marrakechstory helper", "Marrakechstory-hjelper", "Assistant Marrakechstory")), /* @__PURE__ */ React.createElement("div", { className: "ms-chat-sub" }, tx("Usually replies in seconds", "Svarer som regel p\xE5 sekunder", "R\xE9ponse en quelques secondes"))), /* @__PURE__ */ React.createElement("button", { className: "ms-chat-close", onClick: () => setOpen(false), "aria-label": "Close" }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "ms-chat-messages" }, messages.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: `ms-chat-msg ${m.from}` }, m.text)), /* @__PURE__ */ React.createElement("div", { ref: endRef })), messages.length < 3 && /* @__PURE__ */ React.createElement("div", { className: "ms-chat-suggestions" }, faq.slice(0, 5).map((f, i) => /* @__PURE__ */ React.createElement("button", { key: i, className: "ms-chat-suggestion", onClick: () => send(f.q) }, f.q))), /* @__PURE__ */ React.createElement("form", { className: "ms-chat-form", onSubmit: (e) => {
    e.preventDefault();
    send(input);
  } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: input,
      onChange: (e) => setInput(e.target.value),
      placeholder: tx("Type a question\u2026", "Skriv et sp\xF8rsm\xE5l \u2026", "Posez une question \u2026")
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", "aria-label": "Send" }, "\u2192"))));
}
const PROFILE_KEY = "ms_profile_data";
const FAVS_KEY = "ms_user_favs";
function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch (e) {
    return {};
  }
}
function writeProfile(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
function readFavs() {
  try {
    return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function ProfilePanel({ user, onClose, onLogout }) {
  var _a;
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const L = (v) => v == null ? "" : typeof v === "object" && !Array.isArray(v) ? v[lang] || v.en || v.no || v.fr || "" : v;
  const [profile, setProfile] = useStateE2(() => ({
    name: (user == null ? void 0 : user.name) || "",
    email: (user == null ? void 0 : user.email) || "",
    phone: "",
    travellers: "",
    interests: "",
    ...readProfile()
  }));
  const [tab, setTab] = useStateE2("overview");
  const [myBookings, setMyBookings] = useStateE2(null);
  const [msgs, setMsgs] = useStateE2([]);
  const [draft, setDraft] = useStateE2("");
  const [loadingPortal, setLoadingPortal] = useStateE2(false);
  const [openItin, setOpenItin] = useStateE2({});
  const ST_LABEL = { new: tx("Received", "Mottatt", "Re\xE7u"), quotation_sent: tx("Quote sent", "Tilbud sendt", "Devis envoy\xE9"), waiting_confirmation: tx("Awaiting", "Avventer", "En attente"), confirmed: tx("Confirmed", "Bekreftet", "Confirm\xE9"), deposit_paid: tx("Deposit paid", "Depositum betalt", "Acompte pay\xE9"), fully_paid: tx("Fully paid", "Fullt betalt", "Pay\xE9"), ongoing: tx("Ongoing", "P\xE5g\xE5r", "En cours"), completed: tx("Completed", "Fullf\xF8rt", "Termin\xE9"), cancelled: tx("Cancelled", "Avbrutt", "Annul\xE9") };
  const fmtD = (d) => {
    if (!d) return "\u2014";
    try {
      return new Date(d).toLocaleDateString(lang === "no" ? "no-NO" : lang === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) {
      return d;
    }
  };
  const krf = (n) => (Number(n) || 0).toLocaleString("en-US") + " kr";
  const loadPortal = async () => {
    const SB = window.MS_SB;
    if (!SB) return;
    setLoadingPortal(true);
    try {
      const [b, m] = await Promise.all([
        SB.from("bookings").select("*").order("arrival_date", { ascending: true }),
        SB.from("messages").select("*").order("created_at", { ascending: true })
      ]);
      setMyBookings(b.data || []);
      setMsgs(m.data || []);
      const unread = (m.data || []).filter((x) => x.sender === "admin" && !x.read_by_client).map((x) => x.id);
      if (unread.length) SB.from("messages").update({ read_by_client: true }).in("id", unread);
    } catch (e) {
      setMyBookings([]);
    }
    setLoadingPortal(false);
  };
  useEffectE2(() => {
    loadPortal();
  }, []);
  const docCss = "body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1310;margin:0;background:#f4f1ec}.w{max-width:720px;margin:0 auto;background:#fff;padding:34px 40px}.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #e0432a;padding-bottom:16px;margin-bottom:22px}.br{font-size:24px;font-weight:800;color:#e0432a;letter-spacing:-.02em}.muted{color:#8a7d70;font-size:12px}h1{font-size:18px;margin:0 0 4px}h3{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#e0432a;margin:20px 0 8px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;padding:8px 0;border-bottom:1px solid #eee}.r{text-align:right}.tot{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}.tot.bal{border-top:2px solid #1a1310;margin-top:6px;padding-top:10px;font-weight:800;font-size:16px}.badge{display:inline-block;background:#fbe7e1;color:#c23a23;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700}.day{display:flex;gap:12px;padding:9px 0;border-bottom:1px solid #f0f0f0}.dn{width:30px;height:30px;border-radius:50%;background:#e0432a;color:#fff;text-align:center;line-height:30px;font-weight:700;flex:0 0 30px}@media print{body{background:#fff}.w{padding:0}}";
  const openDoc = (title, inner) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${docCss}</style></head><body><div class="w">${inner}</div><script>setTimeout(function(){window.print()},350)<\/script></body></html>`);
    w.document.close();
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
  const printInvoice = (b) => {
    const sub = Number(b.selling_price) || 0, paid = Number(b.paid_amount || b.deposit_amount) || 0, bal = Number(b.balance) || sub - paid;
    const inner = `<div class="hd"><div><div class="br">MarrakechStory</div><div class="muted">Bespoke Travel Experiences</div></div><div class="r"><h1>${tx("INVOICE", "FAKTURA", "FACTURE")}</h1><div class="muted">${tx("Ref", "Ref", "R\xE9f")}: ${esc(b.reference || "\u2014")}<br>${fmtD((/* @__PURE__ */ new Date()).toISOString())}</div></div></div>
      <h3>${tx("Billed to", "Fakturert til", "Factur\xE9 \xE0")}</h3><div><strong>${esc(b.client_name || user.name || "")}</strong><br><span class="muted">${esc(user.email || b.email || "")}</span></div>
      <h3>${tx("Trip", "Reise", "Voyage")}</h3><table><tr><th>${tx("Description", "Beskrivelse", "Description")}</th><th class="r">${tx("Amount", "Bel\xF8p", "Montant")}</th></tr>
      <tr><td><strong>${tx("Bespoke Travel Package", "Skreddersydd reisepakke", "Forfait sur mesure")}</strong><br><span class="muted">${esc((b.arrival_city || "Marrakech") + " \u2192 " + (b.departure_city || "Marrakech"))} \xB7 ${b.total_nights || 0} ${tx("nights", "netter", "nuits")} \xB7 ${(b.adults || 0) + (b.kids || 0)} ${tx("travellers", "reisende", "voyageurs")}</span><br><span class="muted">${fmtD(b.arrival_date)} \u2192 ${fmtD(b.departure_date)}</span></td><td class="r">${krf(sub)}</td></tr></table>
      <div style="margin-top:14px"><div class="tot"><span class="muted">${tx("Subtotal", "Subtotal", "Sous-total")}</span><span>${krf(sub)}</span></div><div class="tot"><span class="muted">${tx("Paid", "Betalt", "Pay\xE9")}</span><span>-${krf(paid)}</span></div><div class="tot bal"><span>${tx("Balance due", "Restbel\xF8p", "Solde d\xFB")}</span><span>${krf(bal)}</span></div></div>
      <h3>${tx("Status", "Status", "Statut")}</h3><span class="badge">${esc(ST_LABEL[b.status] || b.status)}</span>
      <p class="muted" style="margin-top:24px">${tx("For bank transfer details please contact us on WhatsApp +212 \u2026. Thank you for travelling with MarrakechStory.", "For bankoverf\xF8ringsdetaljer, kontakt oss p\xE5 WhatsApp. Takk for at du reiser med MarrakechStory.", "Pour les coordonn\xE9es bancaires, contactez-nous sur WhatsApp. Merci de voyager avec MarrakechStory.")}</p>`;
    openDoc("Invoice " + (b.reference || ""), inner);
  };
  const printItinerary = (b) => {
    const itin = Array.isArray(b.daily_itinerary) ? b.daily_itinerary : [];
    const days = itin.map((d, i) => `<div class="day"><div class="dn">${d.day || i + 1}</div><div><strong>${esc(d.city || tx("Day", "Dag", "Jour") + " " + (d.day || i + 1))}</strong>${(d.activities || []).map((a) => `<div class="muted" style="color:#5b4f44">${a.time ? esc(a.time) + " \xB7 " : ""}${esc(a.type || "")}${a.details ? " \u2014 " + esc(a.details) : ""}</div>`).join("")}</div></div>`).join("");
    const inner = `<div class="hd"><div><div class="br">MarrakechStory</div><div class="muted">${tx("Travel Itinerary", "Reiseplan", "Itin\xE9raire")}</div></div><div class="r"><div class="muted">${tx("Ref", "Ref", "R\xE9f")}: ${esc(b.reference || "\u2014")}</div></div></div>
      <h1>${esc((b.arrival_city || "Marrakech") + " \u2192 " + (b.departure_city || "Marrakech"))}</h1><div class="muted">${fmtD(b.arrival_date)} \u2192 ${fmtD(b.departure_date)} \xB7 ${b.total_days || itin.length} ${tx("days", "dager", "jours")}</div>
      <h3>${tx("Day by day", "Dag for dag", "Jour par jour")}</h3>${days || '<p class="muted">' + tx("Your detailed itinerary will appear here once finalised.", "Detaljert reiseplan kommer her n\xE5r den er klar.", "Itin\xE9raire d\xE9taill\xE9 \xE0 venir.") + "</p>"}`;
    openDoc("Itinerary " + (b.reference || ""), inner);
  };
  const sendMsg = async () => {
    const SB = window.MS_SB;
    if (!draft.trim() || !SB) return;
    const body = draft.trim();
    setDraft("");
    await SB.from("messages").insert({ client_email: user.email, sender: "client", body, booking_id: myBookings && myBookings[0] && myBookings[0].id || null });
    loadPortal();
  };
  useEffectE2(() => {
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
  const save = (patch) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    writeProfile(next);
  };
  const [savedNote, setSavedNote] = useStateE2("");
  const saveToAccount = async () => {
    var _a2, _b;
    try {
      if (window.MS_saveSubscriber) await window.MS_saveSubscriber({ email: profile.email || user.email, name: profile.name, phone: profile.phone, country: profile.country, marketingOptIn: true, payload: { interests: profile.interests, travellers: profile.travellers, source: "profile" } }, { source: "profile" });
      if ((_b = (_a2 = window.MS_SB) == null ? void 0 : _a2.auth) == null ? void 0 : _b.updateUser) await window.MS_SB.auth.updateUser({ data: { name: profile.name, phone: profile.phone } });
      setSavedNote(tx("Saved to your account \u2713", "Lagret p\xE5 kontoen din \u2713", "Enregistr\xE9 \u2713"));
    } catch (e) {
      setSavedNote(tx("Saved locally", "Lagret lokalt", "Enregistr\xE9 localement"));
    }
    setTimeout(() => setSavedNote(""), 3e3);
  };
  const favSlugs = readFavs();
  const itins = (window.MS_ITINERARIES || []).filter((t) => favSlugs.includes(t.slug));
  let catFavs = {};
  try {
    catFavs = JSON.parse(localStorage.getItem("ms_catalog_favs") || "{}");
  } catch (e) {
  }
  const catFavList = (() => {
    if (!window.MS_DATA) return [];
    const out = [];
    const arrays = { activities: "ACTIVITIES", restaurants: "RESTAURANTS", spa: "SPAS", camps: "CAMPS", pools: "POOLS", excursions: "EXCURSIONS", transport: "TRANSPORT" };
    Object.entries(arrays).forEach(([tab2, k]) => {
      (window.MS_DATA[k] || []).forEach((it) => {
        if (catFavs[`${tab2}-${it.name}`]) {
          out.push({ tab: tab2, ...it });
        }
      });
    });
    return out;
  })();
  const totalSaved = itins.length + catFavList.length;
  const bookingsArr = myBookings || [];
  const _t0 = /* @__PURE__ */ new Date();
  _t0.setHours(0, 0, 0, 0);
  const upcoming = bookingsArr.filter((b) => !b.archived && !["cancelled", "completed"].includes(b.status) && (!b.departure_date || new Date(b.departure_date) >= _t0));
  const past = bookingsArr.filter((b) => b.archived || ["completed", "cancelled"].includes(b.status) || b.departure_date && new Date(b.departure_date) < _t0);
  const balanceDue = bookingsArr.reduce((s, b) => s + (Number(b.balance) || 0), 0);
  const msgCount = msgs.length;
  const bkCard = (b) => {
    const bal = Number(b.balance) || 0;
    const paid = Number(b.paid_amount) || 0;
    const itin = Array.isArray(b.daily_itinerary) ? b.daily_itinerary : [];
    const open = !!openItin[b.id];
    return /* @__PURE__ */ React.createElement("article", { key: b.id, className: "ms-cp-booking" }, /* @__PURE__ */ React.createElement("div", { className: "ms-cp-bk-top" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "ms-cp-ref" }, b.reference || "\u2014"), /* @__PURE__ */ React.createElement("h3", null, b.arrival_city || "Marrakech", " \u2192 ", b.departure_city || "Marrakech"), /* @__PURE__ */ React.createElement("div", { className: "ms-cp-dates" }, fmtD(b.arrival_date), " \u2192 ", fmtD(b.departure_date), " \xB7 ", b.total_days || "?", " ", tx("days", "dager", "jours"), " \xB7 ", (b.adults || 0) + (b.kids || 0), " ", tx("travellers", "reisende", "voyageurs"))), /* @__PURE__ */ React.createElement("span", { className: `ms-cp-status st-${b.status}` }, ST_LABEL[b.status] || b.status)), /* @__PURE__ */ React.createElement("div", { className: "ms-cp-pay" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, tx("Price", "Pris", "Prix")), /* @__PURE__ */ React.createElement("strong", null, krf(b.selling_price))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, tx("Paid", "Betalt", "Pay\xE9")), /* @__PURE__ */ React.createElement("strong", { className: "ms-cp-green" }, krf(paid))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, tx("Balance", "Restbel\xF8p", "Solde")), /* @__PURE__ */ React.createElement("strong", { style: { color: bal > 0 ? "#e0432a" : void 0 } }, krf(bal)))), /* @__PURE__ */ React.createElement("div", { className: "ms-cp-actions" }, itin.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setOpenItin((s) => ({ ...s, [b.id]: !s[b.id] })) }, open ? tx("Hide itinerary", "Skjul reiseplan", "Masquer") : tx("View itinerary", "Se reiseplan", "Itin\xE9raire"), " (", itin.length, ")"), itin.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => printItinerary(b) }, "\u{1F5CE} ", tx("Itinerary", "Reiseplan", "Itin\xE9raire"), " PDF"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => printInvoice(b) }, "\u{1F9FE} ", tx("Invoice", "Faktura", "Facture"))), open && itin.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-cp-itin" }, itin.map((d, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "ms-cp-day" }, /* @__PURE__ */ React.createElement("div", { className: "ms-cp-day-n" }, d.day || i + 1), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, d.city || tx("Day", "Dag", "Jour") + " " + (d.day || i + 1)), (d.activities || []).map((a, ai) => /* @__PURE__ */ React.createElement("div", { key: ai, className: "ms-cp-act" }, a.time ? a.time + " \xB7 " : "", a.type, a.details ? " \u2014 " + a.details : "")))))));
  };
  const _panel = /* @__PURE__ */ React.createElement("div", { className: "ms-profile-backdrop", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-panel", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "ms-profile-close", onClick: onClose, "aria-label": "Close" }, "\u2715"), /* @__PURE__ */ React.createElement("header", { className: "ms-profile-head" }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-avatar" }, ((user == null ? void 0 : user.name) || "?")[0].toUpperCase()), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "ms-profile-name" }, tx("Hi", "Hei", "Bonjour"), ", ", ((_a = user == null ? void 0 : user.name) == null ? void 0 : _a.split(" ")[0]) || "friend"), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-email" }, user == null ? void 0 : user.email))), /* @__PURE__ */ React.createElement("nav", { className: "ms-profile-tabs" }, [
    { id: "overview", label: tx("Overview", "Oversikt", "Aper\xE7u") },
    { id: "bookings", label: tx("My bookings", "Mine bookinger", "Mes r\xE9servations") },
    { id: "trips", label: tx("Saved", "Lagret", "Sauvegard\xE9s") },
    { id: "profile", label: tx("My info", "Min info", "Mes infos") }
  ].map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: t.id,
      className: `ms-profile-tab ${tab === t.id ? "active" : ""}`,
      onClick: () => setTab(t.id)
    },
    t.label
  ))), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-body" }, tab === "overview" && /* @__PURE__ */ React.createElement("div", { className: "ms-profile-overview" }, /* @__PURE__ */ React.createElement("button", { className: "ms-profile-card", onClick: () => setTab("bookings") }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card-label" }, tx("Upcoming trips", "Kommende reiser", "Voyages \xE0 venir")), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card-value" }, myBookings === null ? "\u2026" : upcoming.length), /* @__PURE__ */ React.createElement("span", { className: "btn btn-text" }, tx("View \u2192", "Se \u2192", "Voir \u2192"))), /* @__PURE__ */ React.createElement("button", { className: "ms-profile-card", onClick: () => setTab("bookings") }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card-label" }, tx("Balance due", "Restbel\xF8p", "Solde d\xFB")), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card-value", style: { color: balanceDue > 0 ? "#e0432a" : void 0 } }, myBookings === null ? "\u2026" : krf(balanceDue)), /* @__PURE__ */ React.createElement("span", { className: "btn btn-text" }, tx("Details \u2192", "Detaljer \u2192", "D\xE9tails \u2192"))), /* @__PURE__ */ React.createElement("button", { className: "ms-profile-card", onClick: () => setTab("bookings") }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card-label" }, tx("Messages", "Meldinger", "Messages")), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card-value" }, msgCount), /* @__PURE__ */ React.createElement("span", { className: "btn btn-text" }, tx("Open \u2192", "\xC5pne \u2192", "Ouvrir \u2192"))), /* @__PURE__ */ React.createElement("button", { className: "ms-profile-card", onClick: () => setTab("trips") }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card-label" }, tx("Saved favourites", "Lagrede favoritter", "Favoris")), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card-value" }, totalSaved), /* @__PURE__ */ React.createElement("span", { className: "btn btn-text" }, tx("View \u2192", "Se \u2192", "Voir \u2192"))), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card ms-profile-card-cta" }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-card-label" }, tx("Need a trip?", "Trenger du en reise?", "Besoin d'un voyage?")), /* @__PURE__ */ React.createElement("p", null, tx("Tell us what you want \u2014 we build it.", "Fortell oss hva du vil \u2014 vi bygger den.", "Dites-nous ce que vous voulez \u2014 on le construit.")), /* @__PURE__ */ React.createElement("a", { className: "btn btn-primary", href: "#plan", onClick: onClose }, tx("Start \u2192", "Start \u2192", "D\xE9marrer \u2192")))), tab === "bookings" && /* @__PURE__ */ React.createElement("div", { className: "ms-cp" }, loadingPortal && myBookings === null ? /* @__PURE__ */ React.createElement("div", { className: "ms-profile-empty" }, /* @__PURE__ */ React.createElement("p", null, tx("Loading your bookings\u2026", "Laster bookingene dine \u2026", "Chargement\u2026"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, !myBookings || myBookings.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "ms-profile-empty" }, /* @__PURE__ */ React.createElement("p", null, tx(
    "No bookings linked to this email yet. Once you send a trip request, it appears here with live status, your day-by-day itinerary and invoice.",
    "Ingen bookinger knyttet til denne e-posten enn\xE5. N\xE5r du sender en reiseforesp\xF8rsel, vises den her med status, dag-for-dag reiseplan og faktura.",
    "Aucune r\xE9servation li\xE9e \xE0 cet e-mail. D\xE8s que vous envoyez une demande, elle appara\xEEt ici avec le statut, l'itin\xE9raire jour par jour et la facture."
  )), /* @__PURE__ */ React.createElement("a", { className: "btn btn-primary", href: "#plan", onClick: onClose }, tx("Plan a trip \u2192", "Planlegg en reise \u2192", "Planifier \u2192"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h4", { className: "ms-profile-section-h" }, tx("Upcoming", "Kommende", "\xC0 venir"), upcoming.length ? ` (${upcoming.length})` : ""), upcoming.length ? upcoming.map(bkCard) : /* @__PURE__ */ React.createElement("p", { className: "ms-cp-thread-empty" }, tx("No upcoming trips.", "Ingen kommende reiser.", "Aucun voyage \xE0 venir.")), past.length > 0 && /* @__PURE__ */ React.createElement("h4", { className: "ms-profile-section-h", style: { marginTop: 22 } }, tx("Trip history", "Reisehistorikk", "Historique"), " (", past.length, ")"), past.map(bkCard)), /* @__PURE__ */ React.createElement("h4", { className: "ms-profile-section-h", style: { marginTop: 24 } }, tx("Messages with MarrakechStory", "Meldinger med MarrakechStory", "Messages avec MarrakechStory")), /* @__PURE__ */ React.createElement("div", { className: "ms-cp-thread" }, msgs.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-cp-thread-empty" }, tx("No messages yet. Ask us anything about your trip \u2014 we reply here.", "Ingen meldinger enn\xE5. Sp\xF8r oss om reisen \u2014 vi svarer her.", "Aucun message. Posez-nous vos questions \u2014 nous r\xE9pondons ici.")), msgs.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id, className: `ms-cp-msg ${m.sender === "client" ? "me" : "them"}` }, /* @__PURE__ */ React.createElement("div", { className: "ms-cp-bubble" }, m.body), /* @__PURE__ */ React.createElement("div", { className: "ms-cp-msg-meta" }, m.sender === "client" ? tx("You", "Du", "Vous") : "MarrakechStory", " \xB7 ", fmtD(m.created_at))))), /* @__PURE__ */ React.createElement("form", { className: "ms-cp-composer", onSubmit: (e) => {
    e.preventDefault();
    sendMsg();
  } }, /* @__PURE__ */ React.createElement("input", { value: draft, onChange: (e) => setDraft(e.target.value), placeholder: tx("Write a message\u2026", "Skriv en melding \u2026", "\xC9crire un message\u2026") }), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn btn-primary", disabled: !draft.trim() }, tx("Send", "Send", "Envoyer"))))), tab === "trips" && /* @__PURE__ */ React.createElement("div", { className: "ms-profile-trips" }, totalSaved === 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-profile-empty" }, /* @__PURE__ */ React.createElement("p", null, tx(
    "No favourites yet. Tap the \u2661 on any trip or catalogue card to save it here.",
    "Ingen favoritter enn\xE5. Trykk \u2661 p\xE5 en reise eller katalogkort for \xE5 lagre den her.",
    "Aucun favori. Touchez \u2661 sur un voyage ou une fiche pour le sauvegarder ici."
  )), /* @__PURE__ */ React.createElement("a", { className: "btn btn-primary", href: "#itineraries", onClick: onClose }, tx("Browse trips \u2192", "Se reiser \u2192", "Voir les voyages \u2192"))), itins.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h4", { className: "ms-profile-section-h" }, tx("Saved trips", "Lagrede reiser", "Voyages sauvegard\xE9s"), " (", itins.length, ")"), itins.map((t) => /* @__PURE__ */ React.createElement("article", { key: t.slug, className: "ms-profile-trip" }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-trip-img", style: { backgroundImage: `url(${t.img})` } }), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-trip-body" }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-trip-chapter" }, "CHAPTER ", t.chapter, " \xB7 ", t.duration), /* @__PURE__ */ React.createElement("h3", null, L(t.title)), /* @__PURE__ */ React.createElement("p", null, L(t.teaser)))))), catFavList.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h4", { className: "ms-profile-section-h" }, tx("Saved places & activities", "Lagrede steder og aktiviteter", "Lieux et activit\xE9s sauvegard\xE9s"), " (", catFavList.length, ")"), catFavList.map((it, i) => /* @__PURE__ */ React.createElement("article", { key: `${it.tab}-${i}`, className: "ms-profile-trip" }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-trip-img", style: { backgroundImage: `url(${it.img})` } }), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-trip-body" }, /* @__PURE__ */ React.createElement("div", { className: "ms-profile-trip-chapter" }, String(it.tab || "").toUpperCase(), " \xB7 ", L(it.filter || it.tag) || ""), /* @__PURE__ */ React.createElement("h3", null, L(it.name)), /* @__PURE__ */ React.createElement("p", null, L(it.desc))))))), tab === "profile" && /* @__PURE__ */ React.createElement("form", { className: "ms-profile-form", onSubmit: (e) => e.preventDefault() }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", null, tx("Full name", "Fullt navn", "Nom complet")), /* @__PURE__ */ React.createElement("input", { value: profile.name, onChange: (e) => save({ name: e.target.value }) })), /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", null, tx("Email", "E-post", "E-mail")), /* @__PURE__ */ React.createElement("input", { type: "email", value: profile.email, onChange: (e) => save({ email: e.target.value }) })), /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", null, tx("Phone (with country code)", "Telefon (med landkode)", "T\xE9l\xE9phone (avec indicatif)")), /* @__PURE__ */ React.createElement("input", { type: "tel", value: profile.phone, onChange: (e) => save({ phone: e.target.value }), placeholder: "+47 \u2026" })), /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", null, tx("How many travellers?", "Hvor mange reisende?", "Combien de voyageurs?")), /* @__PURE__ */ React.createElement("input", { value: profile.travellers, onChange: (e) => save({ travellers: e.target.value }), placeholder: "2 adults, 1 child" })), /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", null, tx("What do you like?", "Hva liker du?", "Qu'aimez-vous?")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 3,
      value: profile.interests,
      onChange: (e) => save({ interests: e.target.value }),
      placeholder: tx("Slow trips, desert, food, hammam\u2026", "Rolige reiser, \xF8rken, mat, hammam \u2026", "Voyages lents, d\xE9sert, cuisine, hammam \u2026")
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "ms-profile-form-foot" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline", onClick: onLogout }, tx("Log out", "Logg ut", "D\xE9connexion")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-primary", onClick: saveToAccount }, tx("Save", "Lagre", "Enregistrer")), /* @__PURE__ */ React.createElement("span", { className: "ms-profile-save-note" }, savedNote || tx("Saved automatically", "Lagres automatisk", "Enregistr\xE9 automatiquement")))))));
  const RD = window.ReactDOM || (typeof ReactDOM !== "undefined" ? ReactDOM : null);
  return RD && RD.createPortal ? RD.createPortal(_panel, document.body) : _panel;
}
window.MS_ProfilePanel = ProfilePanel;
window.MS_CookieBanner = CookieBanner;
window.MS_Chatbot = Chatbot;
