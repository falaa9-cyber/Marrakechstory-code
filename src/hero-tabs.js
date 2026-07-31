function HeroTabs() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const go = (id) => {
    var _a;
    (_a = document.getElementById(id)) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const Tab = ({ id, label, sub }) => /* @__PURE__ */ React.createElement("button", { type: "button", className: "hero-tab", onClick: () => go(id) }, /* @__PURE__ */ React.createElement("span", { className: "hero-tab-title" }, label), /* @__PURE__ */ React.createElement("span", { className: "hero-tab-sub" }, sub));
  return /* @__PURE__ */ React.createElement("section", { className: "hero-tabs-section", "aria-label": "Quick links" }, /* @__PURE__ */ React.createElement("div", { className: "wrap-wide" }, /* @__PURE__ */ React.createElement("div", { className: "hero-tabs-grid" }, /* @__PURE__ */ React.createElement(
    Tab,
    {
      id: "itineraries",
      label: tx("Itineraries", "Reiseplaner", "Itin\xE9raires", "Reseplaner"),
      sub: tx("Curated trips", "Skreddersydde reiser", "Voyages sur mesure", "Skr\xE4ddarsydda resor")
    }
  ), /* @__PURE__ */ React.createElement(
    Tab,
    {
      id: "catalog",
      label: tx("Catalogue", "Katalog", "Catalogue", "Katalog"),
      sub: tx(
        "Activities \xB7 stays \xB7 rentals",
        "Aktiviteter \xB7 opphold \xB7 utleie",
        "Activit\xE9s \xB7 s\xE9jours \xB7 location",
        "Aktiviteter \xB7 boende \xB7 uthyrning"
      )
    }
  ))));
}
window.MS_HeroTabs = HeroTabs;
