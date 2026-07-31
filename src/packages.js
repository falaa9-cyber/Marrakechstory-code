const { useState: useStateP } = React;
const Ip = window.MS_I;
const MAP_CITIES = {
  mkch: { label: "Marrakech", x: 83, y: 78 },
  agafay: { label: "Agafay", x: 76, y: 87 },
  atlas: { label: "Atlas", x: 98, y: 92 },
  essaouira: { label: "Essaouira", x: 53, y: 80 },
  agadir: { label: "Agadir", x: 57, y: 100 },
  casablanca: { label: "Casablanca", x: 90, y: 43 },
  rabat: { label: "Rabat", x: 103, y: 36 },
  fes: { label: "F\xE8s", x: 133, y: 36 },
  merzouga: { label: "Merzouga", x: 152, y: 87 },
  dades: { label: "Dad\xE8s", x: 117, y: 82 }
};
const PKG_ROUTES = {
  "4d3n": ["mkch", "agafay"],
  "5d4n": ["mkch", "atlas", "agafay"],
  "7d6n": ["mkch", "atlas", "essaouira", "agafay"],
  "10d9n": ["mkch", "atlas", "agadir", "agafay"],
  "14d13n": ["mkch", "casablanca", "rabat", "fes", "merzouga", "dades", "mkch", "agafay"]
};
function PkgMap({ pkgId }) {
  const route = PKG_ROUTES[pkgId] || [];
  const cities = route.map((k) => ({ key: k, ...MAP_CITIES[k] })).filter(Boolean);
  return /* @__PURE__ */ React.createElement("div", { className: "pkg-map-overlay", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 200 160", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      className: "pkg-map-land",
      d: "M120,4 L185,23 L183,71 L167,115 L125,133 L1,144 L57,100 L53,80 L75,57 L90,43 L103,36 L108,18 Z"
    }
  ), cities.length > 1 && /* @__PURE__ */ React.createElement(
    "polyline",
    {
      className: "pkg-map-route",
      points: cities.map((c) => `${c.x},${c.y}`).join(" ")
    }
  ), cities.map((city, i) => /* @__PURE__ */ React.createElement("g", { key: city.key + i }, /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: city.x,
      cy: city.y,
      r: i === 0 ? 4.5 : 3.5,
      className: `pkg-map-dot ${i === 0 ? "first" : i === cities.length - 1 ? "last" : ""}`
    }
  ), /* @__PURE__ */ React.createElement("text", { x: city.x, y: city.y - 7, className: "pkg-map-label", textAnchor: "middle" }, city.label)))));
}
function Packages() {
  const PKGS = window.MS_DATA.PACKAGES;
  const { useT, useMS } = window.MS_CTX;
  const t = useT();
  const { lang } = useMS();
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const [active, setActive] = useStateP(PKGS[1].id);
  const [view, setView] = useStateP("timeline");
  const isCustom = active === "custom";
  const pkg = isCustom ? null : PKGS.find((p) => p.id === active);
  return /* @__PURE__ */ React.createElement("section", { className: "packages section", id: "packages" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "section-head reveal", style: { textAlign: "center", margin: "0 auto 56px" } }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, t("pkg_eyebrow")), /* @__PURE__ */ React.createElement("h2", null, t("pkg_title_a"), " ", /* @__PURE__ */ React.createElement("em", null, t("pkg_title_b")), " ", t("pkg_title_c")), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 auto" } }, t("pkg_sub"))), /* @__PURE__ */ React.createElement("div", { className: "pkg-tabs reveal", style: { justifyContent: "center" } }, PKGS.map((p) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: p.id,
      className: `pkg-tab ${active === p.id ? "active" : ""}`,
      onClick: () => {
        setActive(p.id);
        setView("timeline");
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "num" }, p.days, "D"),
    /* @__PURE__ */ React.createElement("span", null, p.title)
  )), /* @__PURE__ */ React.createElement("a", { href: "#plan", className: `pkg-tab pkg-tab-custom` }, /* @__PURE__ */ React.createElement("span", { className: "num" }, "\u2726"), /* @__PURE__ */ React.createElement("span", null, t("pkg_custom_label")))), isCustom ? /* @__PURE__ */ React.createElement("div", { className: "pkg-custom-cta reveal" }, /* @__PURE__ */ React.createElement("div", { className: "pkg-custom-inner" }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow", style: { color: "#ffae7c" } }, t("pkg_custom_eyebrow")), /* @__PURE__ */ React.createElement("h3", { style: { fontFamily: "Fraunces, serif", fontWeight: 400, fontSize: "clamp(28px,4vw,48px)", color: "#fff", margin: "12px 0 16px", letterSpacing: "-0.02em" } }, t("pkg_custom_title_a"), " ", /* @__PURE__ */ React.createElement("em", { style: { fontStyle: "italic", color: "#ffae7c" } }, t("pkg_custom_title_b"))), /* @__PURE__ */ React.createElement("p", { style: { color: "rgba(255,255,255,.75)", maxWidth: 520, margin: "0 0 32px", fontSize: 16 } }, t("pkg_custom_sub")), /* @__PURE__ */ React.createElement("a", { href: "#plan", className: "btn btn-primary", style: { fontSize: 16, padding: "14px 28px" } }, t("pkg_custom_cta"), " ", /* @__PURE__ */ React.createElement(Ip.Arrow, { s: 16 })))) : /* @__PURE__ */ React.createElement("div", { className: "pkg-grid" }, /* @__PURE__ */ React.createElement("div", { className: "pkg-hero reveal", key: pkg.id }, /* @__PURE__ */ React.createElement("div", { className: "pkg-hero-img", style: { backgroundImage: `url(${pkg.img})` } }), /* @__PURE__ */ React.createElement(PkgMap, { pkgId: pkg.id }), /* @__PURE__ */ React.createElement("div", { className: "pkg-hero-info" }, /* @__PURE__ */ React.createElement("div", { className: "label" }, pkg.days, " days \xB7 ", pkg.nights, " nights \xB7 ", pkg.label), /* @__PURE__ */ React.createElement("h3", null, pkg.title), /* @__PURE__ */ React.createElement("p", { style: { color: "rgba(255,255,255,.85)", margin: "0 0 10px", fontSize: 14 } }, pkg.description), /* @__PURE__ */ React.createElement("div", { className: "pkg-badges" }, pkg.tags.map((tag) => /* @__PURE__ */ React.createElement("span", { key: tag, className: "b" }, tag))), /* @__PURE__ */ React.createElement("a", { href: "#plan", className: "btn btn-primary", style: { marginTop: 18 } }, t("pkg_request"), " ", /* @__PURE__ */ React.createElement(Ip.Arrow, null)))), /* @__PURE__ */ React.createElement("div", { key: pkg.id + "-tl" }, /* @__PURE__ */ React.createElement("div", { className: "pkg-view-tabs" }, /* @__PURE__ */ React.createElement("button", { className: `pkg-view-tab ${view === "timeline" ? "active" : ""}`, onClick: () => setView("timeline") }, /* @__PURE__ */ React.createElement(Ip.Cal, null), " ", /* @__PURE__ */ React.createElement("span", null, t("pkg_view_timeline"))), /* @__PURE__ */ React.createElement("button", { className: `pkg-view-tab ${view === "included" ? "active" : ""}`, onClick: () => setView("included") }, /* @__PURE__ */ React.createElement(Ip.Check, null), " ", /* @__PURE__ */ React.createElement("span", null, t("pkg_view_incl"))), /* @__PURE__ */ React.createElement("button", { className: `pkg-view-tab ${view === "terms" ? "active" : ""}`, onClick: () => setView("terms") }, /* @__PURE__ */ React.createElement(Ip.Pin, null), " ", /* @__PURE__ */ React.createElement("span", null, t("pkg_view_terms")))), view === "timeline" && /* @__PURE__ */ React.createElement("div", { className: "timeline" }, pkg.timeline.map((d, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: `tl-day ${i === 0 ? "active" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "tl-marker" }, String(d.day).padStart(2, "0")), /* @__PURE__ */ React.createElement("div", { className: "tl-content" }, /* @__PURE__ */ React.createElement("div", { className: "tl-day-label" }, t("pkg_day"), " ", d.day, " \xB7 ", d.label), /* @__PURE__ */ React.createElement("h4", { className: "tl-title" }, d.title), /* @__PURE__ */ React.createElement("p", { className: "tl-desc" }, d.desc), /* @__PURE__ */ React.createElement("ul", { className: "tl-items" }, d.items.map((it, j) => /* @__PURE__ */ React.createElement("li", { key: it }, /* @__PURE__ */ React.createElement(Ip.Check, { s: 12 }), d.times && d.times[j] && /* @__PURE__ */ React.createElement("span", { className: "tl-time" }, d.times[j]), it))), /* @__PURE__ */ React.createElement("div", { className: "tl-meta" }, /* @__PURE__ */ React.createElement("span", { className: "pill" }, /* @__PURE__ */ React.createElement(Ip.Bed, null), " ", d.stay), /* @__PURE__ */ React.createElement("span", { className: "pill" }, /* @__PURE__ */ React.createElement(Ip.Utensils, null), " ", d.meals)))))), view === "included" && /* @__PURE__ */ React.createElement("div", { className: "pkg-incl-grid" }, /* @__PURE__ */ React.createElement("div", { className: "pkg-incl-card" }, /* @__PURE__ */ React.createElement("div", { className: "pkg-incl-head" }, /* @__PURE__ */ React.createElement("span", { className: "pkg-incl-icon yes" }, /* @__PURE__ */ React.createElement(Ip.Check, { s: 16 })), /* @__PURE__ */ React.createElement("h4", null, t("pkg_included"))), /* @__PURE__ */ React.createElement("ul", null, pkg.included.map((it) => /* @__PURE__ */ React.createElement("li", { key: it }, /* @__PURE__ */ React.createElement(Ip.Check, { s: 14 }), " ", it)))), /* @__PURE__ */ React.createElement("div", { className: "pkg-incl-card not" }, /* @__PURE__ */ React.createElement("div", { className: "pkg-incl-head" }, /* @__PURE__ */ React.createElement("span", { className: "pkg-incl-icon no" }, /* @__PURE__ */ React.createElement(Ip.Minus, { s: 16 })), /* @__PURE__ */ React.createElement("h4", null, t("pkg_not_included"))), /* @__PURE__ */ React.createElement("ul", null, pkg.notIncluded.map((it) => /* @__PURE__ */ React.createElement("li", { key: it }, /* @__PURE__ */ React.createElement(Ip.Minus, { s: 14 }), " ", it)))), /* @__PURE__ */ React.createElement("div", { className: "pkg-incl-cta" }, /* @__PURE__ */ React.createElement("p", { style: { color: "rgba(255,255,255,.7)", fontSize: 14, margin: "0 0 18px" } }, t("pkg_quote_note")), /* @__PURE__ */ React.createElement("a", { href: "#plan", className: "btn btn-primary" }, t("pkg_book"), " ", /* @__PURE__ */ React.createElement(Ip.Arrow, { s: 14 })))), view === "terms" && /* @__PURE__ */ React.createElement("div", { className: "pkg-terms" }, /* @__PURE__ */ React.createElement("div", { className: "pkg-terms-header" }, /* @__PURE__ */ React.createElement("h3", { style: { fontFamily: "Fraunces, serif", fontWeight: 400, fontSize: 22, color: "#fff", margin: "0 0 4px" } }, tx("Thank you for your trust.", "Takk for tilliten.", "Merci de votre confiance.", "Tack f\xF6r ditt f\xF6rtroende."))), /* @__PURE__ */ React.createElement("div", { className: "pkg-terms-block" }, /* @__PURE__ */ React.createElement("h4", null, tx("BOOKING RULES", "BESTILLINGSREGLER", "R\xC8GLES DE R\xC9SERVATION", "BOKNINGSREGLER")), /* @__PURE__ */ React.createElement("ul", { className: "terms-list" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("All bookings must be made in advance.", "Alle bestillinger m\xE5 gj\xF8res p\xE5 forh\xE5nd.", "Toutes les r\xE9servations doivent \xEAtre effectu\xE9es \xE0 l'avance.", "Alla bokningar m\xE5ste g\xF6ras i f\xF6rv\xE4g.")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("Changes depend on availability.", "Endringer avhenger av tilgjengelighet.", "Les modifications d\xE9pendent des disponibilit\xE9s.", "\xC4ndringar beror p\xE5 tillg\xE4nglighet.")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("Cancellations must be made within the timeframes below.", "Avbestillinger m\xE5 gj\xF8res innen tidsrammene nedenfor.", "Les annulations doivent \xEAtre effectu\xE9es dans les d\xE9lais indiqu\xE9s ci-dessous.", "Avbokningar m\xE5ste g\xF6ras inom tidsgr\xE4nserna nedan."))), /* @__PURE__ */ React.createElement("div", { className: "terms-contact" }, /* @__PURE__ */ React.createElement("a", { href: "mailto:Marrakechstory@outlook.com" }, "Marrakechstory@outlook.com"), /* @__PURE__ */ React.createElement("a", { href: "https://www.marrakechstory.com", target: "_blank", rel: "noopener" }, "www.marrakechstory.com"), /* @__PURE__ */ React.createElement("span", null, "+47 457 74 743"))), /* @__PURE__ */ React.createElement("div", { className: "pkg-terms-block" }, /* @__PURE__ */ React.createElement("h4", null, tx("PAYMENT POLICY", "BETALINGSPOLICY", "POLITIQUE DE PAIEMENT", "BETALNINGSPOLICY")), /* @__PURE__ */ React.createElement("p", { style: { color: "rgba(255,255,255,.7)", fontSize: 13, margin: "0 0 10px" } }, tx("You can choose to pay:", "Du kan velge \xE5 betale:", "Vous pouvez choisir de payer :", "Du kan v\xE4lja att betala:")), /* @__PURE__ */ React.createElement("ul", { className: "terms-list" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("20% online: PayPal, Revolut, Wise, Vipps, Norwegian bank transfer.", "20% p\xE5 nett: PayPal, Revolut, Wise, Vipps, Norsk bankoverf\xF8ring.", "20 % en ligne : PayPal, Revolut, Wise, Vipps, virement bancaire norv\xE9gien.", "20% online: PayPal, Revolut, Wise, Vipps, norskt bank\xF6verf\xF6ring.")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("80% cash on arrival to the driver.", "80% kontant ved ankomst til sj\xE5f\xF8ren.", "80 % en esp\xE8ces \xE0 l'arriv\xE9e au chauffeur.", "80% kontant vid ankomst till chauff\xF6ren.")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("Or the full amount online.", "Eller hele bel\xF8pet p\xE5 nett.", "Ou la totalit\xE9 en ligne.", "Eller hela beloppet online.")))), /* @__PURE__ */ React.createElement("div", { className: "pkg-terms-block" }, /* @__PURE__ */ React.createElement("h4", null, tx("CANCELLATION & REFUND POLICY", "AVBESTILLINGS OG REFUSJONSPOLITIKK", "POLITIQUE D'ANNULATION ET DE REMBOURSEMENT", "AVBOKNINGS- OCH \xC5TERBETALNINGSPOLICY")), /* @__PURE__ */ React.createElement("div", { className: "terms-table" }, /* @__PURE__ */ React.createElement("div", { className: "terms-row head" }, /* @__PURE__ */ React.createElement("span", null, tx("Time before experience", "Tid f\xF8r opplevelsen", "D\xE9lai avant l'exp\xE9rience", "Tid f\xF6re upplevelsen")), /* @__PURE__ */ React.createElement("span", null, tx("Refund", "Refusjon", "Remboursement", "\xC5terbetalning"))), [
    {
      notice: tx("Up to 96 hours", "Inntil 96 timer", "Jusqu'\xE0 96 heures", "Upp till 96 timmar"),
      fee: tx("100% refund", "100% refusjon", "100 % rembours\xE9", "100% \xE5terbetalning"),
      ok: true
    },
    {
      notice: tx("24\u201348 hours", "24\u201348 timer", "24\u201348 heures", "24\u201348 timmar"),
      fee: tx("50% refund", "50% refusjon", "50 % rembours\xE9", "50% \xE5terbetalning"),
      ok: true
    },
    {
      notice: tx("Under 24 hours", "Under 24 timer", "Moins de 24 heures", "Under 24 timmar"),
      fee: tx("Non-refundable", "Refunderes ikke", "Non remboursable", "Ej \xE5terbetalningsbar"),
      ok: false
    },
    {
      notice: tx("No-show", "Ikke-oppm\xF8te", "Non-pr\xE9sentation", "Uteblivande"),
      fee: tx("Non-refundable", "Refunderes ikke", "Non remboursable", "Ej \xE5terbetalningsbar"),
      ok: false
    }
  ].map((r) => /* @__PURE__ */ React.createElement("div", { key: r.notice, className: "terms-row" }, /* @__PURE__ */ React.createElement("span", null, r.notice), /* @__PURE__ */ React.createElement("span", { className: !r.ok ? "bad" : "good" }, r.fee)))), /* @__PURE__ */ React.createElement("p", { style: { color: "rgba(255,255,255,.65)", fontSize: 12, marginTop: 10 } }, tx(
    "Weather-dependent activities (e.g. hot-air balloon): Rescheduling or full refund if cancelled for safety reasons.",
    "V\xE6ravhengige aktiviteter (f.eks. varmluftsballong): Omplanlegging eller full refusjon ved avbestilling av sikkerhetsmessige \xE5rsaker.",
    "Activit\xE9s d\xE9pendant de la m\xE9t\xE9o (ex. montgolfi\xE8re) : Reprogrammation ou remboursement int\xE9gral en cas d'annulation pour raisons de s\xE9curit\xE9.",
    "V\xE4derberoende aktiviteter (t.ex. luftballong): Ombokning eller full \xE5terbetalning vid avbokning av s\xE4kerhetssk\xE4l."
  ))), /* @__PURE__ */ React.createElement("div", { className: "pkg-terms-block" }, /* @__PURE__ */ React.createElement("h4", null, tx("IMPORTANT NOTES", "VIKTIGE MERKNADER", "REMARQUES IMPORTANTES", "VIKTIGA ANM\xC4RKNINGAR")), /* @__PURE__ */ React.createElement("ul", { className: "terms-list" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("Be on time for pick-up.", "V\xE6r presis til henting.", "Soyez \xE0 l'heure pour le ramassage.", "Var i tid f\xF6r upph\xE4mtning.")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("Ensure you have WhatsApp and internet access for communication during your stay.", "S\xF8rg for at du har WhatsApp og internett for kommunikasjon under oppholdet.", "Assurez-vous d'avoir WhatsApp et une connexion internet pour communiquer pendant votre s\xE9jour.", "Se till att du har WhatsApp och internet\xE5tkomst f\xF6r kommunikation under vistelsen.")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("Inform us in advance of any dietary restrictions or physical limitations.", "Informer oss p\xE5 forh\xE5nd om kostholdsrestriksjoner eller fysiske begrensninger.", "Informez-nous \xE0 l'avance de toute restriction alimentaire ou limitation physique.", "Informera oss i f\xF6rv\xE4g om eventuella kostbegr\xE4nsningar eller fysiska begr\xE4nsningar.")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("Wear comfortable clothing and appropriate footwear for excursions.", "Bruk komfortable kl\xE6r og passende fott\xF8y til utflukter.", "Portez des v\xEAtements confortables et des chaussures adapt\xE9es pour les excursions.", "B\xE4r bekv\xE4ma kl\xE4der och l\xE4mpligt skodon f\xF6r utflykter.")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Ip.Check, { s: 13 }), " ", tx("Marrakechstory is not responsible for lost personal belongings during activities.", "Marrakechstory er ikke ansvarlig for tapte personlige eiendeler under aktiviteter.", "Marrakechstory n'est pas responsable des effets personnels perdus pendant les activit\xE9s.", "Marrakechstory ansvarar inte f\xF6r f\xF6rlorade personliga tillh\xF6righeter under aktiviteter.")))), /* @__PURE__ */ React.createElement("div", { className: "pkg-terms-note" }, /* @__PURE__ */ React.createElement(Ip.Pin, { s: 14 }), /* @__PURE__ */ React.createElement("span", null, tx(
    "Marrakechstory operates under Moroccan tourism law (Loi n\xB0 31-96) and is licensed by ONMT (licence #14872).",
    "Marrakechstory opererer under marokkansk reiselivslovgivning (Loi n\xB0 31-96) og er lisensiert av ONMT (lisens #14872).",
    "Marrakechstory op\xE8re conform\xE9ment \xE0 la loi marocaine sur le tourisme (Loi n\xB0 31-96) et est agr\xE9\xE9 par l'ONMT (licence n\xB0 14872).",
    "Marrakechstory verkar under marockansk turismlagstiftning (Loi n\xB0 31-96) och \xE4r licensierat av ONMT (licens #14872)."
  ))))))));
}
window.MS_Packages = Packages;
