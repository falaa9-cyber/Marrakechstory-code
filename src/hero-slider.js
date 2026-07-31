const { useState: useStateHs, useEffect: useEffectHs, useRef: useRefHs, useMemo: useMemoHs } = React;
function buildSiteSearchIndex(lang) {
  const L = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v[lang] || v.en || v.no || v.fr || "";
  };
  const items = [];
  (window.MS_ITINERARIES || []).forEach((t) => {
    items.push({
      kind: "trip",
      id: "trip-" + t.slug,
      slug: t.slug,
      title: L(t.title),
      subtitle: `${L(t.duration) || ""} \xB7 ${L(t.route) || ""}`.trim().replace(/^· |· $/, ""),
      tags: [...t.themeTags || [], L(t.idealFor)].filter(Boolean),
      teaser: L(t.teaser) || L(t.overview) || "",
      icon: "\u{1F5FA}\uFE0F",
      action: () => {
        var _a;
        window.dispatchEvent(new CustomEvent("ms:open-trip", { detail: { slug: t.slug } }));
        (_a = document.getElementById("itineraries")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
  const D = window.MS_DATA || {};
  const tabsToShow = [
    { key: "activities", tab: "activities", list: D.ACTIVITIES, icon: "\u{1F388}" },
    { key: "restaurants", tab: "restaurants", list: D.RESTAURANTS, icon: "\u{1F37D}\uFE0F" },
    { key: "spas", tab: "spas", list: D.SPAS, icon: "\u{1F9D6}" },
    { key: "camps", tab: "camps", list: D.CAMPS, icon: "\u{1F3D5}\uFE0F" },
    { key: "pools", tab: "pools", list: D.POOLS, icon: "\u{1F3CA}" },
    { key: "transport", tab: "transport", list: D.TRANSPORT, icon: "\u{1F697}" },
    { key: "excursions", tab: "excursions", list: D.EXCURSIONS, icon: "\u{1F304}" }
  ];
  tabsToShow.forEach(({ tab, list, icon }) => {
    (list || []).forEach((item) => {
      const name = L(item.name);
      if (!name) return;
      items.push({
        kind: tab,
        id: tab + "-" + (item.slug || name.toLowerCase().replace(/\s+/g, "-")),
        slug: item.slug,
        title: name,
        subtitle: L(item.area) || L(item.cuisine) || L(item.style) || "",
        teaser: L(item.desc) || L(item.description) || "",
        tags: item.perfectFor || [],
        icon,
        action: () => {
          var _a;
          window.dispatchEvent(new CustomEvent("ms:open-catalog", { detail: { tab, slug: item.slug, name } }));
          (_a = document.getElementById("catalog")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  });
  const SECTIONS = [
    { id: "#home", no: "Hjem", en: "Home", fr: "Accueil", icon: "\u{1F3E0}" },
    { id: "#itineraries", no: "Reiser", en: "Trips", fr: "Voyages", icon: "\u{1F5FA}\uFE0F" },
    { id: "#catalog", no: "Katalog", en: "Catalog", fr: "Catalogue", icon: "\u{1F4D6}" },
    { id: "#plan", no: "Planlegg", en: "Planner", fr: "Planifier", icon: "\u270F\uFE0F" },
    { id: "#contact", no: "Kontakt", en: "Contact", fr: "Contact", icon: "\u2709\uFE0F" }
  ];
  SECTIONS.forEach((s) => {
    items.push({
      kind: "section",
      id: "section-" + s.id,
      slug: s.id,
      title: s[lang] || s.en,
      subtitle: "",
      teaser: "",
      tags: [],
      icon: s.icon,
      action: () => {
        var _a;
        (_a = document.querySelector(s.id)) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
  return items;
}
function scoreMatch(item, qLower) {
  const t = String(item.title || "").toLowerCase();
  if (t.startsWith(qLower)) return 100;
  if (new RegExp("(?:^|\\s)" + qLower.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).test(t)) return 80;
  if (t.includes(qLower)) return 60;
  const sub = String(item.subtitle || "").toLowerCase();
  if (sub.includes(qLower)) return 45;
  const tags = (item.tags || []).map((x) => String(x).toLowerCase()).join(" ");
  if (tags.includes(qLower)) return 35;
  const teaser = String(item.teaser || "").toLowerCase();
  if (teaser.includes(qLower)) return 20;
  return 0;
}
function HeroSearch({ lang, tx, compact }) {
  const [q, setQ] = useStateHs("");
  const [open, setOpen] = useStateHs(false);
  const [active, setActive] = useStateHs(0);
  const wrapRef = useRefHs(null);
  const [index, setIndex] = useStateHs(() => buildSiteSearchIndex(lang));
  useEffectHs(() => {
    setIndex(buildSiteSearchIndex(lang));
  }, [lang]);
  useEffectHs(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const results = useMemoHs(() => {
    const qLower = q.trim().toLowerCase();
    if (!qLower) return [];
    const scored = [];
    for (const it of index) {
      const s = scoreMatch(it, qLower);
      if (s > 0) scored.push({ it, s });
    }
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, 8).map((x) => x.it);
  }, [q, index]);
  const groupLabel = (kind) => {
    const map = {
      trip: tx("Trips", "Reiser", "Voyages", "Resor"),
      activities: tx("Activities", "Aktiviteter", "Activit\xE9s", "Aktiviteter"),
      restaurants: tx("Restaurants", "Restauranter", "Restaurants", "Restauranger"),
      spas: tx("Spa & Hammam", "Spa & Hammam", "Spa & Hammam", "Spa & Hammam"),
      camps: tx("Camps", "Leirer", "Campements", "L\xE4ger"),
      pools: tx("Pools", "Basseng", "Piscines", "Pooler"),
      transport: tx("Car rental", "Bilutleie", "Location", "Biluthyrning"),
      excursions: tx("Excursions", "Utflukter", "Excursions", "Utflykter"),
      section: tx("Section", "Seksjon", "Section", "Sektion")
    };
    return map[kind] || kind;
  };
  const onSubmit = (e) => {
    var _a, _b, _c, _d;
    (_a = e == null ? void 0 : e.preventDefault) == null ? void 0 : _a.call(e);
    if (results.length > 0) {
      (_c = (_b = results[active]) == null ? void 0 : _b.action) == null ? void 0 : _c.call(_b);
      setOpen(false);
    } else if (q.trim()) {
      (_d = document.getElementById("itineraries")) == null ? void 0 : _d.scrollIntoView({ behavior: "smooth" });
    }
  };
  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: `ms-hero-search-wrap${compact ? " ms-hero-search-wrap--nav" : ""}`, ref: wrapRef, style: compact ? { width: "170px", maxWidth: "22vw", margin: 0 } : void 0 }, /* @__PURE__ */ React.createElement("form", { className: "ms-hero-search", onSubmit, style: compact ? { width: "100%" } : void 0 }, /* @__PURE__ */ React.createElement("svg", { className: "ms-hero-search-icon", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "7" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" })), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "search",
      name: "q",
      autoComplete: "off",
      value: q,
      onChange: (e) => {
        setQ(e.target.value);
        setActive(0);
        setOpen(true);
      },
      onFocus: () => {
        if (q) setOpen(true);
      },
      onKeyDown,
      placeholder: tx(
        "Search trips, themes, activities\u2026",
        "S\xF8k etter reiser, temaer, opplevelser\u2026",
        "Recherchez voyages, th\xE8mes, activit\xE9s\u2026",
        "S\xF6k resor, teman, aktiviteter\u2026"
      ),
      "aria-label": tx("Search", "S\xF8k", "Rechercher", "S\xF6k")
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "ms-hero-search-submit-hidden", "aria-label": tx("Search", "S\xF8k", "Rechercher", "S\xF6k"), tabIndex: -1 })), open && q.trim() && /* @__PURE__ */ React.createElement("div", { className: "ms-hero-search-dropdown", role: "listbox" }, results.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "ms-hero-search-empty" }, tx("No matches \u2014 try another word", "Ingen treff \u2014 pr\xF8v et annet ord", "Aucun r\xE9sultat \u2014 essayez un autre mot")) : results.map((r, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: r.id,
      type: "button",
      role: "option",
      "aria-selected": i === active,
      className: `ms-hero-search-result ${i === active ? "is-active" : ""}`,
      onMouseEnter: () => setActive(i),
      onClick: () => {
        var _a;
        (_a = r.action) == null ? void 0 : _a.call(r);
        setOpen(false);
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "ms-hero-search-icon-cell", "aria-hidden": "true" }, r.icon),
    /* @__PURE__ */ React.createElement("span", { className: "ms-hero-search-result-body" }, /* @__PURE__ */ React.createElement("span", { className: "ms-hero-search-result-title" }, r.title), (r.subtitle || r.teaser) && /* @__PURE__ */ React.createElement("span", { className: "ms-hero-search-result-sub" }, r.subtitle || r.teaser)),
    /* @__PURE__ */ React.createElement("span", { className: "ms-hero-search-result-tag" }, groupLabel(r.kind))
  ))));
}
const HERO_IMG = "assets/photos/medina-koutoubia-04.jpg?v=266";
const HERO_FALLBACK = "assets/photos/riad-courtyard-pool-03.jpg";
function useResolvedHeroImage(primary, fallback) {
  const [src, setSrc] = useStateHs(primary);
  useEffectHs(() => {
    if (!primary || !fallback) return;
    const img = new Image();
    let alive = true;
    img.onload = () => {
      if (alive) setSrc(primary);
    };
    img.onerror = () => {
      if (alive) setSrc(fallback);
    };
    img.src = primary;
    return () => {
      alive = false;
    };
  }, [primary, fallback]);
  return src;
}
function HeroSlider() {
  const { useMS, COMPANY } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const bg = useResolvedHeroImage(HERO_IMG, HERO_FALLBACK);
  return /* @__PURE__ */ React.createElement("section", { className: "ms-hero ms-hero-static", id: "home" }, /* @__PURE__ */ React.createElement("div", { className: "ms-hero-bg", style: { backgroundImage: `url(${bg})` }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "ms-slide-grad-1" }), /* @__PURE__ */ React.createElement("div", { className: "ms-slide-grad-2" }), /* @__PURE__ */ React.createElement("div", { className: "ms-slide-vignette" })), /* @__PURE__ */ React.createElement("div", { className: "ms-hero-content ms-hero-content-centered ms-hero-content-top" }, /* @__PURE__ */ React.createElement("h1", { className: "ms-hero-h1 ms-hero-brand ms-hero-h1-sm" }, /* @__PURE__ */ React.createElement("span", { className: "ms-hero-h1-line" }, tx("Hello &", "Hei &", "Bonjour &", "Hej &")), /* @__PURE__ */ React.createElement("span", { className: "ms-hero-h1-line" }, tx("Welcome to", "Velkommen til", "Bienvenue chez", "V\xE4lkommen till")), /* @__PURE__ */ React.createElement("span", { className: "ms-hero-h1-line ms-hero-brandmark" }, "Marrakech", /* @__PURE__ */ React.createElement("em", null, "Story"))), /* @__PURE__ */ React.createElement("div", { className: "ms-hero-searchrow" }, /* @__PURE__ */ React.createElement(HeroSearch, { lang, tx }))), /* @__PURE__ */ React.createElement("div", { className: "ms-hero-bottom" }, /* @__PURE__ */ React.createElement("div", { className: "ms-hero-cta-row" }, /* @__PURE__ */ React.createElement(
    "a",
    {
      href: "#itineraries",
      className: "btn btn-primary ms-hero-cta",
      onClick: (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("ms:open-plan"));
      }
    },
    tx("Plan my trip", "Planlegg min reise", "Planifier mon voyage", "Planera min resa"),
    " \u2192"
  ), /* @__PURE__ */ React.createElement("a", { href: "#itineraries", className: "btn btn-outline ms-hero-cta ms-hero-cta-alt" }, tx("Trips", "Turer", "Voyages", "Resor"))), /* @__PURE__ */ React.createElement("div", { className: "ms-hero-socials-bar" }, [
    [
      "Instagram",
      COMPANY.igFollowers,
      `https://instagram.com/${COMPANY.instagram}`,
      "M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 1.8A4 4 0 0 0 3.8 7.8v8.4a4 4 0 0 0 4 4h8.4a4 4 0 0 0 4-4V7.8a4 4 0 0 0-4-4H7.8zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM17.6 6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"
    ],
    [
      "Facebook",
      COMPANY.fbFollowers,
      `https://facebook.com/${COMPANY.facebook}`,
      "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"
    ],
    [
      "TikTok",
      COMPANY.ttFollowers,
      `https://tiktok.com/@${COMPANY.tiktok}`,
      "M16.5 2c.3 2.2 1.6 3.9 3.8 4.1v2.6c-1.3.1-2.6-.3-3.8-1v6.7c0 4.5-4.9 7.3-8.8 5-2.5-1.5-3.1-5-1.3-7.3 1.2-1.6 3.2-2.4 5.2-2v2.7c-.5-.1-1-.2-1.5-.1-1.3.2-2.2 1.5-1.8 2.8.4 1.5 2.3 2 3.4.9.6-.5.8-1.3.8-2.1V2h3z"
    ]
  ].map(([name, count, href, path], i) => /* @__PURE__ */ React.createElement("a", { key: i, className: "ms-social-item", href, target: "_blank", rel: "noopener", "aria-label": name }, /* @__PURE__ */ React.createElement("span", { className: "ms-social-icon" }, /* @__PURE__ */ React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: path }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, count), /* @__PURE__ */ React.createElement("span", null, name)))))));
}
window.MS_HeroSlider = HeroSlider;
window.MS_HeroSearch = HeroSearch;
