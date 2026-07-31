const { useState, useEffect } = React;
const HI = window.MS_I;
function Hero() {
  const { useT, useMS } = window.MS_CTX;
  const t = useT();
  const ctx = useMS();
  const heroImg = "assets/hero-sahara.jpg";
  return /* @__PURE__ */ React.createElement("section", { className: "hero-v2", id: "home" }, /* @__PURE__ */ React.createElement("div", { className: "hero-v2-bg" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "hero-v2-img active",
      style: { backgroundImage: `url(${heroImg})` }
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "hero-v2-tint" }), /* @__PURE__ */ React.createElement("div", { className: "hero-v2-grain" })), /* @__PURE__ */ React.createElement("div", { className: "hero-v2-sun" }), /* @__PURE__ */ React.createElement("svg", { className: "hero-v2-ornament left", viewBox: "0 0 120 200", fill: "none", stroke: "rgba(255,255,255,.22)", strokeWidth: "1" }, /* @__PURE__ */ React.createElement("path", { d: "M0,200 L0,80 Q0,0 60,0 Q120,0 120,80 L120,200" }), /* @__PURE__ */ React.createElement("path", { d: "M20,200 L20,90 Q20,20 60,20 Q100,20 100,90 L100,200" })), /* @__PURE__ */ React.createElement("svg", { className: "hero-v2-ornament right", viewBox: "0 0 120 200", fill: "none", stroke: "rgba(255,255,255,.22)", strokeWidth: "1" }, /* @__PURE__ */ React.createElement("path", { d: "M0,200 L0,80 Q0,0 60,0 Q120,0 120,80 L120,200" }), /* @__PURE__ */ React.createElement("path", { d: "M20,200 L20,90 Q20,20 60,20 Q100,20 100,90 L100,200" })), /* @__PURE__ */ React.createElement("div", { className: "wrap hero-v2-content" }, /* @__PURE__ */ React.createElement("div", { className: "hero-v2-eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), t("hero_eyebrow")), /* @__PURE__ */ React.createElement("p", { className: "hero-v2-hello" }, t("hero_hello")), /* @__PURE__ */ React.createElement("h1", { className: "hero-v2-brand" }, /* @__PURE__ */ React.createElement("span", null, "Marrakech"), /* @__PURE__ */ React.createElement("em", null, "Story.")), /* @__PURE__ */ React.createElement("p", { className: "hero-v2-sub" }, t("hero_sub")), /* @__PURE__ */ React.createElement("div", { className: "hero-v2-cta" }, /* @__PURE__ */ React.createElement("a", { href: "#packages", className: "btn btn-primary" }, t("hero_cta_trips"), " ", /* @__PURE__ */ React.createElement(HI.Arrow, { s: 14 })), /* @__PURE__ */ React.createElement("a", { href: "#plan", className: "btn btn-ghost" }, t("hero_cta_plan"))), /* @__PURE__ */ React.createElement("div", { className: "hero-v2-stats" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "num" }, "14"), /* @__PURE__ */ React.createElement("span", { className: "lbl" }, t("stat_years"))), /* @__PURE__ */ React.createElement("span", { className: "sep" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "num" }, "2,400+"), /* @__PURE__ */ React.createElement("span", { className: "lbl" }, t("stat_travellers"))), /* @__PURE__ */ React.createElement("span", { className: "sep" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "num" }, "4.94\u2605"), /* @__PURE__ */ React.createElement("span", { className: "lbl" }, t("stat_review"))), /* @__PURE__ */ React.createElement("span", { className: "sep" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "num" }, "24/7"), /* @__PURE__ */ React.createElement("span", { className: "lbl" }, t("stat_concierge"))))), /* @__PURE__ */ React.createElement("a", { href: "#packages", className: "hero-v2-scroll", "aria-label": "Scroll" }, /* @__PURE__ */ React.createElement("span", null)));
}
const NORWAY_CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger", "Troms\xF8", "Kristiansand", "Fredrikstad", "Drammen", "\xC5lesund", "Bod\xF8"];
function FlightHelpBox() {
  var _a, _b, _c;
  const { useMS, COMPANY } = window.MS_CTX;
  const ctx = useMS();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [fromCity, setFromCity] = useState("Oslo");
  const [toCity, setToCity] = useState("Oslo");
  const [dep, setDep] = useState(((_a = ctx.dates) == null ? void 0 : _a.dep) || "");
  const [ret, setRet] = useState(((_b = ctx.dates) == null ? void 0 : _b.ret) || "");
  const [people, setPeople] = useState(((_c = ctx.travellers) == null ? void 0 : _c.adults) || 2);
  const lang = ctx.lang || "en";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const label = tx("Need help with flights?", "Trenger du hjelp med fly?", "Besoin d'aide pour le vol ?", "Beh\xF6ver du hj\xE4lp med flyg?");
  const syncContext = (d, r, p) => {
    ctx.setDates({ dep: d, ret: r });
    ctx.setTravellers({ adults: p, children: 0, infants: 0 });
    window.MS_Flight_Data = { dep: d, ret: r, people: p, fromCity, toCity };
  };
  const send = () => {
    syncContext(dep, ret, people);
    const subj = encodeURIComponent(tx(
      `Flight enquiry \u2013 ${fromCity} \u2192 Marrakech`,
      `Flyforslag \u2013 ${fromCity} \u2192 Marrakech`,
      `Demande de vol \u2013 ${fromCity} \u2192 Marrakech`,
      `Flygf\xF6rfr\xE5gan \u2013 ${fromCity} \u2192 Marrakech`
    ));
    const paxLabel = tx(
      `Number of travellers: ${people} person${people > 1 ? "s" : ""}`,
      `Antall reisende: ${people} person${people > 1 ? "er" : ""}`,
      `Nombre de voyageurs : ${people} personne${people > 1 ? "s" : ""}`,
      `Antal resen\xE4rer: ${people} person${people > 1 ? "er" : ""}`
    );
    const body = encodeURIComponent(
      tx(
        `Hi Marrakechstory,

I need help with flights:

\u2708  Outbound: ${fromCity} \u2192 Marrakech (RAK)   ${dep}
\u2708  Return: Marrakech (RAK) \u2192 ${toCity}   ${ret}
\u{1F465}  ${paxLabel}

Please send me the best options!
`,
        `Hei Marrakechstory,

Jeg trenger hjelp med fly:

\u2708  Utreise: ${fromCity} \u2192 Marrakech (RAK)   ${dep}
\u2708  Hjemreise: Marrakech (RAK) \u2192 ${toCity}   ${ret}
\u{1F465}  ${paxLabel}

Send meg gjerne de beste alternativene!
`,
        `Bonjour Marrakechstory,

J'ai besoin d'aide pour les vols :

\u2708  Aller : ${fromCity} \u2192 Marrakech (RAK)   ${dep}
\u2708  Retour : Marrakech (RAK) \u2192 ${toCity}   ${ret}
\u{1F465}  ${paxLabel}

Merci de m'envoyer les meilleures options !
`,
        `Hej Marrakechstory,

Jag beh\xF6ver hj\xE4lp med flyg:

\u2708  Utresa: ${fromCity} \u2192 Marrakech (RAK)   ${dep}
\u2708  Hemresa: Marrakech (RAK) \u2192 ${toCity}   ${ret}
\u{1F465}  ${paxLabel}

Skicka g\xE4rna de b\xE4sta alternativen!
`
      )
    );
    window.location.href = `mailto:${COMPANY.email}?subject=${subj}&body=${body}`;
    setSent(true);
  };
  if (!open) {
    return /* @__PURE__ */ React.createElement("div", { className: "hero-flight-cta-wrap" }, /* @__PURE__ */ React.createElement("button", { className: "hero-flight-toggle", onClick: () => setOpen(true) }, /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M22 2L11 13" }), /* @__PURE__ */ React.createElement("path", { d: "M22 2L15 22l-4-9-9-4 20-7z" })), label, /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "hero-flight-cta-wrap expanded" }, /* @__PURE__ */ React.createElement("div", { className: "flight-help-box" }, /* @__PURE__ */ React.createElement("div", { className: "flight-help-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flight-help-title" }, label), /* @__PURE__ */ React.createElement("div", { className: "flight-help-sub" }, tx(
    "Fill in your details \u2013 we'll find the best flights and link them to your itinerary.",
    "Fyll inn reisedetaljer \u2013 vi finner de beste avgangene og kobler dem til planen din.",
    "Remplissez vos infos \u2013 nous trouvons les meilleures options de vol.",
    "Fyll i reseuppgifter \u2013 vi hittar de b\xE4sta avg\xE5ngarna och kopplar dem till din plan."
  ))), /* @__PURE__ */ React.createElement("button", { className: "flight-help-close", onClick: () => setOpen(false), "aria-label": tx("Close", "Lukk", "Fermer", "St\xE4ng") }, "\u2715")), !sent ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "flight-help-route" }, /* @__PURE__ */ React.createElement("div", { className: "flight-help-fld" }, /* @__PURE__ */ React.createElement("label", null, tx("\u2708 From city (Norway)", "\u2708 Fra by (Norge)", "\u2708 Ville de d\xE9part (Norv\xE8ge)", "\u2708 Fr\xE5n stad (Norge)")), /* @__PURE__ */ React.createElement("input", { list: "fhb-cities-from", value: fromCity, onChange: (e) => setFromCity(e.target.value), placeholder: "Oslo" }), /* @__PURE__ */ React.createElement("datalist", { id: "fhb-cities-from" }, NORWAY_CITIES.map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c })))), /* @__PURE__ */ React.createElement("div", { className: "flight-help-arrow-badge" }, "\u2192 RAK \u2192"), /* @__PURE__ */ React.createElement("div", { className: "flight-help-fld" }, /* @__PURE__ */ React.createElement("label", null, tx("\u2708 Return to (Norway)", "\u2708 Retur til (Norge)", "\u2708 Retour vers (Norv\xE8ge)", "\u2708 Retur till (Norge)")), /* @__PURE__ */ React.createElement("input", { list: "fhb-cities-to", value: toCity, onChange: (e) => setToCity(e.target.value), placeholder: "Oslo" }), /* @__PURE__ */ React.createElement("datalist", { id: "fhb-cities-to" }, NORWAY_CITIES.map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }))))), /* @__PURE__ */ React.createElement("div", { className: "flight-help-fields" }, /* @__PURE__ */ React.createElement("div", { className: "flight-help-fld" }, /* @__PURE__ */ React.createElement("label", null, tx("Departure date", "Avreisedato", "Date de d\xE9part", "Avresedatum")), /* @__PURE__ */ React.createElement("input", { type: "date", value: dep, onChange: (e) => {
    setDep(e.target.value);
    ctx.setDates({ dep: e.target.value, ret });
  } })), /* @__PURE__ */ React.createElement("div", { className: "flight-help-fld" }, /* @__PURE__ */ React.createElement("label", null, tx("Return date", "Hjemreisedato", "Date de retour", "Returdatum")), /* @__PURE__ */ React.createElement("input", { type: "date", value: ret, onChange: (e) => {
    setRet(e.target.value);
    ctx.setDates({ dep, ret: e.target.value });
  } })), /* @__PURE__ */ React.createElement("div", { className: "flight-help-fld narrow" }, /* @__PURE__ */ React.createElement("label", null, tx("Travellers", "Antall reisende", "Voyageurs", "Resen\xE4rer")), /* @__PURE__ */ React.createElement("div", { className: "flight-pax" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
    const p = Math.max(1, people - 1);
    setPeople(p);
    syncContext(dep, ret, p);
  } }, "\u2212"), /* @__PURE__ */ React.createElement("span", null, people), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
    const p = people + 1;
    setPeople(p);
    syncContext(dep, ret, p);
  } }, "+"))), /* @__PURE__ */ React.createElement("button", { className: "flight-help-btn", onClick: send }, /* @__PURE__ */ React.createElement(HI.Mail, { s: 15 }), tx("Send request", "Send foresp\xF8rsel", "Envoyer", "Skicka f\xF6rfr\xE5gan")))) : /* @__PURE__ */ React.createElement("div", { className: "flight-help-sent" }, /* @__PURE__ */ React.createElement(HI.Check, { s: 20 }), tx(
    "Thanks! We'll send flight options shortly. Dates saved to your itinerary.",
    "Takk! Vi sender deg flygingsforslag snart. Datoene er koblet til planen din.",
    "Merci\xA0! Nous vous enverrons des options de vol rapidement. Dates enregistr\xE9es dans votre itin\xE9raire.",
    "Tack! Vi skickar flygalternativ snart. Datumen \xE4r sparade i din plan."
  ))));
}
window.MS_Hero = Hero;
