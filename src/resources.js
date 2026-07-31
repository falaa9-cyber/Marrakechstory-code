const Ir = window.MS_I;
const RESOURCES = [
  // Brochures / catalogues
  {
    group: "catalogue",
    file: "assets/docs/welcome-guide.pdf",
    size: "3.4 MB",
    title_en: "Your Marrakech Story starts here",
    title_no: "Marrakechstory \u2014 start her",
    title_fr: "Votre Marrakech Story commence ici",
    desc_en: "A short introduction to who we are and how we plan trips.",
    desc_no: "En kort introduksjon til hvem vi er og hvordan vi planlegger reiser.",
    desc_fr: "Une courte introduction sur qui nous sommes et comment nous planifions des voyages."
  },
  {
    group: "catalogue",
    file: "assets/docs/luxury-presentation.pdf",
    size: "32 KB",
    title_en: "Luxury presentation",
    title_no: "Luksuspresentasjon",
    title_fr: "Pr\xE9sentation luxe",
    desc_en: "Our top-tier riads, hotels and private experiences.",
    desc_no: "V\xE5re toppriads, hoteller og private opplevelser.",
    desc_fr: "Nos meilleurs riads, h\xF4tels et exp\xE9riences priv\xE9es."
  },
  {
    group: "catalogue",
    file: "assets/docs/collection-1.pdf",
    size: "20 MB",
    title_en: "The full collection",
    title_no: "Hele samlingen",
    title_fr: "Collection compl\xE8te",
    desc_en: "A comprehensive look at our riads, partners and experiences across Marrakech.",
    desc_no: "En komplett oversikt over v\xE5re riads, partnere og opplevelser i Marrakech.",
    desc_fr: "Un panorama complet de nos riads, partenaires et exp\xE9riences \xE0 Marrakech."
  },
  // Sample itineraries
  {
    group: "itinerary",
    file: "assets/docs/sample-15-day-grand-discovery.pdf",
    size: "13 MB",
    title_en: "Sample \xB7 15-day Grand Discovery",
    title_no: "Eksempel \xB7 15 dagers Grand Discovery",
    title_fr: "Exemple \xB7 15 jours Grand Discovery",
    desc_en: "A full two-week Morocco itinerary: Marrakech, Atlas, Sahara, coast.",
    desc_no: "En full to-ukers Marokko-reise: Marrakech, Atlas, Sahara, kysten.",
    desc_fr: "Un itin\xE9raire de deux semaines au Maroc : Marrakech, Atlas, Sahara, c\xF4te."
  },
  {
    group: "itinerary",
    file: "assets/docs/sample-marrakech-taghazout-agafay.pdf",
    size: "20 KB",
    title_en: "Sample \xB7 Marrakech, Taghazout, Agafay",
    title_no: "Eksempel \xB7 Marrakech, Taghazout, Agafay",
    title_fr: "Exemple \xB7 Marrakech, Taghazout, Agafay",
    desc_en: "A one-week trio: medina, surf coast, desert camp.",
    desc_no: "En ukestur: medina, surfekyst, \xF8rkenleir.",
    desc_fr: "Un voyage d'une semaine : m\xE9dina, c\xF4te surf, camp d\xE9sert."
  },
  {
    group: "itinerary",
    file: "assets/docs/sample-agafay-proposal.pdf",
    size: "124 KB",
    title_en: "Sample \xB7 Agafay proposal",
    title_no: "Eksempel \xB7 Agafay-forslag",
    title_fr: "Exemple \xB7 Proposition Agafay",
    desc_en: "A focused desert weekend \u2014 camp, ride, dinner under the stars.",
    desc_no: "En fokusert \xF8rken-helg \u2014 leir, ridning, middag under stjernene.",
    desc_fr: "Un week-end d\xE9sert cibl\xE9 \u2014 camp, balade, d\xEEner sous les \xE9toiles."
  },
  {
    group: "itinerary",
    file: "assets/docs/sample-anniversary-20pax.pdf",
    size: "1.7 MB",
    title_en: "Sample \xB7 Anniversary for 20 guests",
    title_no: "Eksempel \xB7 Jubileum for 20 gjester",
    title_fr: "Exemple \xB7 Anniversaire pour 20 invit\xE9s",
    desc_en: "How we coordinate group celebrations end-to-end.",
    desc_no: "Slik koordinerer vi gruppemarkeringer fra A til \xC5.",
    desc_fr: "Comment nous coordonnons une c\xE9l\xE9bration de groupe de A \xE0 Z."
  },
  {
    group: "itinerary",
    file: "assets/docs/full-pricelist-itineraries.pdf",
    size: "28 KB",
    title_en: "Full pricelist & itineraries",
    title_no: "Full prisliste og reiseplaner",
    title_fr: "Prix complets & itin\xE9raires",
    desc_en: "Reference prices for our most-booked trips.",
    desc_no: "Referansepriser for v\xE5re mest bestilte turer.",
    desc_fr: "Prix de r\xE9f\xE9rence pour nos voyages les plus r\xE9serv\xE9s."
  },
  // Guides
  {
    group: "guide",
    file: "assets/docs/desert-guide.pdf",
    size: "12 MB",
    title_en: "A mini guide to the desert",
    title_no: "En liten \xF8rkenguide",
    title_fr: "Mini guide du d\xE9sert",
    desc_en: "What to bring, when to go, how to dress, what to expect.",
    desc_no: "Hva du trenger, n\xE5r du b\xF8r dra, hvordan kle deg, hva du kan forvente.",
    desc_fr: "Que prendre, quand partir, comment s'habiller, \xE0 quoi s'attendre."
  },
  {
    group: "guide",
    file: "assets/docs/morocco-overview.pdf",
    size: "19 MB",
    title_en: "Morocco overview",
    title_no: "Marokko-oversikt",
    title_fr: "Aper\xE7u du Maroc",
    desc_en: "Cities, seasons, dress codes, food, transport, etiquette.",
    desc_no: "Byer, sesonger, klesregler, mat, transport, etikette.",
    desc_fr: "Villes, saisons, codes vestimentaires, cuisine, transport, \xE9tiquette."
  },
  {
    group: "guide",
    file: "assets/docs/transport-offer.pdf",
    size: "60 KB",
    title_en: "Transport & transfers",
    title_no: "Transport og transfer",
    title_fr: "Transport & transferts",
    desc_en: "Our fleet, airport transfers, day-hire and multi-day driver options.",
    desc_no: "V\xE5r fl\xE5te, flyplasstransfer, dagleie og fleirdags sj\xE5f\xF8r.",
    desc_fr: "Notre flotte, transferts a\xE9roport, location \xE0 la journ\xE9e et chauffeur multi-jours."
  },
  {
    group: "guide",
    file: "assets/docs/pricelist.pdf",
    size: "44 KB",
    title_en: "Pricelist",
    title_no: "Prisliste",
    title_fr: "Liste de prix",
    desc_en: "Quick reference for activities, transport and add-ons.",
    desc_no: "Hurtigreferanse for aktiviteter, transport og tillegg.",
    desc_fr: "R\xE9f\xE9rence rapide pour activit\xE9s, transport et options."
  }
];
const GROUPS = {
  catalogue: { en: "Brochures", no: "Brosjyrer", fr: "Brochures" },
  itinerary: { en: "Sample itineraries", no: "Eksempler p\xE5 reiseplaner", fr: "Itin\xE9raires types" },
  guide: { en: "Practical guides", no: "Praktiske guider", fr: "Guides pratiques" }
};
function Resources() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "en";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const T = (item, field) => item[`${field}_${lang === "no" ? "no" : lang === "fr" ? "fr" : "en"}`];
  const groupKeys = ["catalogue", "itinerary", "guide"];
  return /* @__PURE__ */ React.createElement("section", { className: "resources-section section", id: "resources" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "section-head reveal", style: { textAlign: "center", margin: "0 auto 56px" } }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, tx("Resources", "Ressurser", "Ressources")), /* @__PURE__ */ React.createElement("h2", null, tx("Brochures, ", "Brosjyrer, ", "Brochures, "), /* @__PURE__ */ React.createElement("em", null, tx("itineraries", "reiseplaner", "itin\xE9raires")), tx(" & guides", " og guider", " & guides")), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 auto" } }, tx(
    "Download our catalogues, sample itineraries and practical guides \u2014 useful before, during and after your trip.",
    "Last ned v\xE5re kataloger, eksempler p\xE5 reiseplaner og praktiske guider \u2014 nyttig f\xF8r, under og etter reisen.",
    "T\xE9l\xE9chargez nos catalogues, exemples d'itin\xE9raires et guides pratiques \u2014 utiles avant, pendant et apr\xE8s votre voyage."
  ))), groupKeys.map((gk) => {
    const groupItems = RESOURCES.filter((r) => r.group === gk);
    if (!groupItems.length) return null;
    return /* @__PURE__ */ React.createElement("div", { key: gk, className: "resources-group reveal" }, /* @__PURE__ */ React.createElement("h3", { className: "resources-group-title" }, GROUPS[gk][lang === "no" ? "no" : lang === "fr" ? "fr" : "en"]), /* @__PURE__ */ React.createElement("div", { className: "resources-grid" }, groupItems.map((r, i) => /* @__PURE__ */ React.createElement("a", { key: i, className: "resource-card", href: r.file, target: "_blank", rel: "noopener", download: true }, /* @__PURE__ */ React.createElement("div", { className: "resource-icon" }, /* @__PURE__ */ React.createElement(Ir.Compass, { s: 18 }), /* @__PURE__ */ React.createElement("span", { className: "resource-ext" }, "PDF")), /* @__PURE__ */ React.createElement("div", { className: "resource-body" }, /* @__PURE__ */ React.createElement("div", { className: "resource-title" }, T(r, "title")), /* @__PURE__ */ React.createElement("div", { className: "resource-desc" }, T(r, "desc")), /* @__PURE__ */ React.createElement("div", { className: "resource-meta" }, r.size, " \xB7 ", tx("Download", "Last ned", "T\xE9l\xE9charger"), " \u2192"))))));
  })));
}
window.MS_Resources = Resources;
