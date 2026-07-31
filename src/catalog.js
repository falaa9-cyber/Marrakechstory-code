const { useState: useStateC, useMemo: useMemoC, useEffect: useEffectC } = React;
const Ic = window.MS_I;
function msSlugify(s) {
  return (s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
const MS_CAT_DIR = {
  activities: "activities",
  restaurants: "restaurants",
  spa: "spas",
  camps: "camps",
  pools: "pools",
  excursions: "excursions",
  transport: "transport",
  hotels: "hotels"
};
const MS_CAT_LOCAL = {
  activities: "assets/act-agafay-pool.jpg",
  restaurants: "assets/act-food.jpg",
  spa: "assets/act-zellige.jpg",
  spas: "assets/act-zellige.jpg",
  camps: "assets/act-sahara.jpg",
  pools: "assets/act-agafay-pool.jpg",
  excursions: "assets/hero-ourika.jpg",
  transport: "assets/hero-medina.jpg",
  hotels: "assets/catalog/hotels/coming-soon.svg"
};
function msResolveImg(tab, item) {
  const dir = MS_CAT_DIR[tab] || tab;
  const slug = item.slug || msSlugify(item.name);
  if (tab === "hotels") {
    const ph = "assets/catalog/hotels/coming-soon.svg";
    const primary = item.img ? item.img : ph;
    return { primary, placeholder: ph, remote: ph, slug };
  }
  const real = `assets/catalog/${dir}/${slug}.jpg`;
  const placeholder = `assets/catalog/placeholder_ai/${dir}/${slug}/hero.jpg`;
  const remote = item.img;
  return { primary: real, placeholder, remote, slug };
}
function ResolvedImg({ tab, item, alt = "", className = "", style = {}, srcOverride = null }) {
  const { primary, placeholder, remote } = msResolveImg(tab, item);
  const local = MS_CAT_LOCAL[tab] || MS_CAT_LOCAL[MS_CAT_DIR[tab]] || "assets/hero-medina.jpg";
  const initial = srcOverride || primary;
  const [src, setSrc] = useStateC(initial);
  const [stage, setStage] = useStateC(srcOverride ? "override" : "primary");
  useEffectC(() => {
    if (srcOverride) {
      setSrc(srcOverride);
      setStage("override");
    }
  }, [srcOverride]);
  const onError = () => {
    if (stage === "override") {
      setSrc(primary);
      setStage("primary");
    } else if (stage === "primary") {
      setSrc(placeholder);
      setStage("placeholder");
    } else if (stage === "placeholder") {
      setSrc(remote);
      setStage("remote");
    } else if (stage === "remote") {
      setSrc(local);
      setStage("local");
    }
  };
  const isAi = stage === "placeholder";
  const isDev = typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(location.hostname);
  return /* @__PURE__ */ React.createElement("div", { className: `ms-img-wrap ${className}`, style: { position: "relative", ...style } }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src,
      alt,
      onError,
      loading: "lazy",
      decoding: "async",
      style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
    }
  ), isAi && isDev && /* @__PURE__ */ React.createElement("span", { className: "ms-ai-ribbon" }, "AI placeholder"));
}
function ModalGallery({ tab, item, lang }) {
  const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : null;
  const [active, setActive] = useStateC(0);
  if (!images) {
    return /* @__PURE__ */ React.createElement("div", { className: "cat-modal-img cat-img-resolved" }, /* @__PURE__ */ React.createElement(ResolvedImg, { tab, item, alt: item.name }), /* @__PURE__ */ React.createElement("span", { className: "cat-modal-tag" }, localize(item.tag || item.style || item.cuisine, lang)));
  }
  const total = images.length;
  const prev = () => setActive((a) => (a - 1 + total) % total);
  const next = () => setActive((a) => (a + 1) % total);
  return /* @__PURE__ */ React.createElement("div", { className: "cat-modal-gallery" }, /* @__PURE__ */ React.createElement("div", { className: "cat-modal-img cat-img-resolved" }, /* @__PURE__ */ React.createElement(ResolvedImg, { tab, item, alt: `${item.name} ${active + 1}/${total}`, srcOverride: images[active] }), /* @__PURE__ */ React.createElement("span", { className: "cat-modal-tag" }, localize(item.tag || item.style || item.cuisine, lang)), total > 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "cat-modal-nav prev", onClick: prev, "aria-label": "Previous" }, /* @__PURE__ */ React.createElement(Ic.Arrow, { s: 16 })), /* @__PURE__ */ React.createElement("button", { className: "cat-modal-nav next", onClick: next, "aria-label": "Next" }, /* @__PURE__ */ React.createElement(Ic.Arrow, { s: 16 })), /* @__PURE__ */ React.createElement("div", { className: "cat-modal-counter" }, active + 1, " / ", total))), total > 1 && /* @__PURE__ */ React.createElement("div", { className: "cat-modal-thumbs" }, images.map((url, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: i,
      className: `cat-modal-thumb ${i === active ? "active" : ""}`,
      onClick: () => setActive(i),
      "aria-label": `View image ${i + 1}`
    },
    /* @__PURE__ */ React.createElement("img", { src: url, alt: "", loading: "lazy", decoding: "async" })
  ))));
}
function localize(value, lang) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[lang] || value.en || value.fr || value.no || "";
  }
  return value;
}
function localizeList(arr, lang) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr.map((v) => localize(v, lang));
  return localize(arr, lang) || [];
}
function CatalogModal({ item, tab, onClose, lang }) {
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  useEffectC(() => {
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
  const _today = (offset = 0) => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const [pickupDate, setPickupDate] = useStateC(_today(7));
  const [returnDate, setReturnDate] = useStateC(_today(10));
  const [needTransport, setNeedTransport] = useStateC(false);
  const rentalDays = (() => {
    const a = new Date(pickupDate), b = new Date(returnDate);
    const d = Math.round((b - a) / 864e5);
    return d > 0 ? d : 0;
  })();
  const baseRate = (() => {
    if (tab !== "transport") return 0;
    const m = (item.prices && item.prices[0] && item.prices[0].price || "").match(/€(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  })();
  const rentalSubtotal = baseRate * rentalDays;
  const [r, setR] = useStateC({ name: "", email: "", phone: "", date: _today(7), people: 2, notes: "" });
  const [sent, setSent] = useStateC(false);
  const [busy, setBusy] = useStateC(false);
  const setR1 = (k, v) => setR((p) => ({ ...p, [k]: v }));
  const sendReservation = async () => {
    if (!r.name.trim() || !r.email.trim()) return;
    setBusy(true);
    const isTransport = tab === "transport";
    const start = isTransport ? pickupDate : r.date;
    const end = isTransport ? returnDate : r.date;
    const dur = isTransport ? Math.max(1, rentalDays) : 1;
    try {
      if (window.MS_submitForm) {
        await window.MS_submitForm("quickbook", {
          item: item.name,
          tab,
          name: r.name,
          email: r.email,
          phone: r.phone,
          people: r.people,
          date: start,
          notes: r.notes,
          startDate: start,
          endDate: end,
          duration: dur
        }, { via: "catalog" });
      }
      const prev = JSON.parse(localStorage.getItem("ms_profile_data") || "{}");
      localStorage.setItem("ms_profile_data", JSON.stringify({ ...prev, name: r.name || prev.name, email: r.email || prev.email, phone: r.phone || prev.phone }));
    } catch (e) {
    }
    setBusy(false);
    setSent(true);
    if (window.MS_Auth_PromptAfterBooking) window.MS_Auth_PromptAfterBooking();
  };
  const price = window.MS_CTX.usePrice();
  const slug = item.slug || msSlugify(item.name);
  const imgs = (Array.isArray(item.images) && item.images.length ? item.images : [item.img]).filter(Boolean);
  const priceFrom = item.startingPriceEur ? price(item.startingPriceEur) : null;
  const area = localize(item.area, lang);
  const toISO = (d) => {
    try {
      return d.toISOString().slice(0, 10);
    } catch (e) {
      return _today(7);
    }
  };
  const onReserveCat = async ({ sel, guests, name, email, phone }) => {
    try {
      if (window.MS_submitForm) {
        const start = sel.in ? toISO(sel.in) : _today(7);
        await window.MS_submitForm("quickbook", { item: item.name, tab, name, email, phone, people: guests, date: start, notes: "", startDate: start, endDate: sel.out ? toISO(sel.out) : start, duration: 1 }, { via: "catalog" });
      }
      const prev = JSON.parse(localStorage.getItem("ms_profile_data") || "{}");
      localStorage.setItem("ms_profile_data", JSON.stringify({ ...prev, name: name || prev.name, email: email || prev.email, phone: phone || prev.phone }));
    } catch (e) {
    }
    if (window.MS_Auth_PromptAfterBooking) window.MS_Auth_PromptAfterBooking();
  };
  const L = {
    id: "cat-" + tab + "-" + slug,
    lang,
    onClose,
    title: localize(item.name, lang) + (tab === "camps" && Array.isArray(item.rooms) && item.rooms.length ? " \xB7 " + tx("Accommodation", "Overnatting", "H\xE9bergement", "Boende") : ""),
    subtitle: [area, item.style && !String(area || "").includes(localize(item.style, lang)) ? localize(item.style, lang) : null].filter(Boolean).join(" \xB7 "),
    metaDots: [localize(item.tag, lang), priceFrom ? tx("from", "fra", "d\xE8s") + " " + priceFrom : null].filter(Boolean),
    badge: localize(item.tag || item.style, lang),
    trust: tx("Hand-picked by Marrakech Story \xB7 we book & confirm for you \xB7 24/7 support", "H\xE5ndplukket av Marrakech Story \xB7 vi booker & bekrefter for deg \xB7 24/7 st\xF8tte", "S\xE9lectionn\xE9 par Marrakech Story \xB7 nous r\xE9servons & confirmons pour vous \xB7 assistance 24/7"),
    // Camp galleries also include the room/tent photos (hero mosaic + lightbox).
    images: (() => {
      const roomImgs = Array.isArray(item.rooms) ? item.rooms.map((r2) => r2.img).filter(Boolean) : [];
      const all = [...imgs, ...roomImgs];
      return all.length ? all : ["assets/act-sahara.jpg"];
    })(),
    amenitiesTitle: tx("What this place offers", "Dette tilbys", "Ce que propose ce lieu"),
    amenities: localizeList(item.perfectFor, lang),
    rooms: Array.isArray(item.rooms) ? item.rooms : null,
    passes: item.passes || null,
    description: localize(item.description || item.desc, lang),
    mapPlace: area || "Marrakech",
    mapName: localize(item.name, lang),
    locationLabel: area,
    thingsToKnow: item.practical && item.practical.length ? {
      rules: { title: tx("Good to know", "Verdt \xE5 vite", "Bon \xE0 savoir"), items: localizeList(item.practical, lang) },
      safety: { title: tx("Booking & trust", "Booking & trygghet", "R\xE9servation & confiance"), items: [tx("We confirm availability directly with the venue.", "Vi bekrefter tilgjengelighet direkte med stedet.", "Nous confirmons la disponibilit\xE9 directement avec l\u2019\xE9tablissement."), tx("No online payment \u2014 pay on site or as agreed.", "Ingen nettbetaling \u2014 betal p\xE5 stedet eller som avtalt.", "Pas de paiement en ligne \u2014 sur place ou comme convenu."), tx("24/7 WhatsApp support \u2014 Aladdin & Marte.", "24/7 WhatsApp-st\xF8tte \u2014 Aladdin & Marte.", "Assistance WhatsApp 24/7 \u2014 Aladdin & Marte.")] }
    } : null,
    price: { from: priceFrom || tx("On request", "P\xE5 foresp\xF8rsel", "Sur demande"), per: tab === "hotels" ? tx("/ night", "/ natt", "/ nuit", "/ natt") : tx("/ person", "/ person", "/ personne") },
    banner: tx("We book it for you", "Vi booker for deg", "Nous r\xE9servons pour vous"),
    breadcrumb: ["Morocco", area ? area.split("\xB7")[0].trim() : "Marrakech", localize(item.name, lang)],
    reserveLabel: tx("Send reservation", "Send reservasjon", "Envoyer la r\xE9servation"),
    reserveForm: true,
    onReserve: onReserveCat
  };
  const LD = window.MS_ListingDetail;
  return LD ? /* @__PURE__ */ React.createElement(LD, { ...L }) : null;
}
function Catalog() {
  const D = window.MS_DATA;
  const { useT, usePrice, useMS } = window.MS_CTX;
  const t = useT();
  const price = usePrice();
  const ctx = useMS();
  const tx = (en, no, fr, sv) => ctx.lang === "no" ? no : ctx.lang === "fr" ? fr : ctx.lang === "sv" ? sv || no || en : ctx.lang === "da" ? no || en : en;
  const [tab, setTab] = useStateC("activities");
  const [filter, setFilter] = useStateC("All");
  const [favs, setFavs] = useStateC({});
  const [modal, setModal] = useStateC(null);
  const [visibleCount, setVisibleCount] = useStateC(8);
  const [hubCat, setHubCat] = useStateC(window.MS_HUB_CAT || null);
  useEffectC(() => {
    const onHub = (e) => {
      var _a;
      const c = ((_a = e.detail) == null ? void 0 : _a.cat) || null;
      setHubCat(c);
      if (c) {
        setTab(c);
        setFilter("All");
      }
    };
    window.addEventListener("ms:hub-cat", onHub);
    return () => window.removeEventListener("ms:hub-cat", onHub);
  }, []);
  useEffectC(() => {
    setVisibleCount(8);
  }, [tab, filter]);
  useEffectC(() => {
    const onOpen = (e) => {
      var _a, _b, _c;
      const targetTab = (_a = e.detail) == null ? void 0 : _a.tab;
      const slug = (_b = e.detail) == null ? void 0 : _b.slug;
      const name = (_c = e.detail) == null ? void 0 : _c.name;
      if (!targetTab) return;
      const map = {
        activities: "activities",
        restaurants: "restaurants",
        spas: "spa",
        camps: "camps",
        pools: "pools",
        transport: "transport",
        excursions: "excursions"
      };
      const localTab = map[targetTab] || targetTab;
      setTab(localTab);
      setHubCat(localTab);
      const D2 = window.MS_DATA || {};
      const arrays = {
        activities: D2.ACTIVITIES,
        restaurants: D2.RESTAURANTS,
        spa: D2.SPAS,
        camps: D2.CAMPS,
        pools: D2.POOLS,
        transport: D2.TRANSPORT,
        excursions: D2.EXCURSIONS,
        hotels: D2.HOTELS
      };
      const list = arrays[localTab] || [];
      const nm = (x) => {
        var _a2;
        return (typeof x.name === "string" ? x.name : (_a2 = x.name) == null ? void 0 : _a2.en) || "";
      };
      const item = slug && list.find((x) => x.slug === slug) || name && list.find((x) => nm(x) === name) || name && list.find((x) => nm(x).toLowerCase().includes(String(name).toLowerCase()));
      if (item) {
        setTimeout(() => setModal({ item, tab: localTab }), 30);
      }
    };
    window.addEventListener("ms:open-catalog", onOpen);
    return () => window.removeEventListener("ms:open-catalog", onOpen);
  }, []);
  const tabs = [
    {
      id: "activities",
      label: t("cat_activities"),
      icon: /* @__PURE__ */ React.createElement(Ic.Compass, { s: 16 }),
      data: D.ACTIVITIES,
      filters: ["All", "Discover", "In the Air", "Nautical", "Outdoor"],
      priceLabel: t("cat_per_person")
    },
    {
      id: "camps",
      label: "Agafay",
      icon: /* @__PURE__ */ React.createElement(Ic.Tent, { s: 16 }),
      data: D.CAMPS,
      filters: ["All", "Day Pass", "Overnight", "Events"],
      priceLabel: t("cat_per_person")
    },
    {
      id: "transport",
      label: t("cat_transport"),
      icon: /* @__PURE__ */ React.createElement(Ic.Plane, { s: 16 }),
      data: D.TRANSPORT,
      filters: ["All", "Compact", "Compact SUV", "Sedan", "SUV"],
      priceLabel: tx("/ day", "/ dag", "/ jour", "/ dag")
    },
    {
      id: "restaurants",
      label: t("cat_restaurants"),
      icon: /* @__PURE__ */ React.createElement(Ic.Utensils, { s: 16 }),
      data: D.RESTAURANTS,
      filters: ["All", "Fine Dining", "Traditional Moroccan", "Rooftop", "Festive", "International", "Asian", "Brunch", "Caf\xE9", "Bar & Lounge", "Nightclub"],
      priceLabel: ""
    },
    {
      id: "spa",
      label: t("cat_spa"),
      icon: /* @__PURE__ */ React.createElement(Ic.Sparkle, { s: 16 }),
      data: D.SPAS,
      filters: ["All", "Palace Spa", "Boutique", "Medina Hammam", "Wellness House", "Medical"],
      priceLabel: t("cat_per_person")
    },
    {
      id: "hotels",
      label: tx("Hotels", "Hoteller", "H\xF4tels", "Hotell"),
      icon: /* @__PURE__ */ React.createElement(Ic.Star, { s: 16 }),
      data: D.HOTELS,
      filters: ["All", "5-Star", "4-Star", "Marrakech", "Agadir & Taghazout"],
      priceLabel: tx("/ night", "/ natt", "/ nuit", "/ natt")
    },
    {
      id: "pools",
      label: t("cat_pools"),
      icon: /* @__PURE__ */ React.createElement(Ic.Sun, { s: 16 }),
      data: D.POOLS,
      filters: ["All", "Palace", "Boutique", "Agafay", "Beach Club", "Festive", "Family", "Women Only", "Water Park"],
      priceLabel: t("cat_per_person")
    }
  ];
  const current = tabs.find((x) => x.id === tab);
  const items = useMemoC(() => {
    if (filter === "All") return current.data;
    return current.data.filter((i) => i.filter === filter || i.style === filter);
  }, [tab, filter, current]);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  useEffectC(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ms_catalog_favs") || "{}");
      setFavs(stored);
    } catch (e) {
    }
  }, []);
  const toggleFav = (key) => setFavs((p) => {
    const next = { ...p, [key]: !p[key] };
    if (!next[key]) delete next[key];
    localStorage.setItem("ms_catalog_favs", JSON.stringify(next));
    return next;
  });
  return /* @__PURE__ */ React.createElement("section", { className: "catalog section catalog-hub", id: "catalog", style: { display: hubCat ? void 0 : "none" } }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "cat-filters reveal" }, current.filters.map((f) => /* @__PURE__ */ React.createElement("button", { key: f, className: `filter-chip ${filter === f ? "active" : ""}`, onClick: () => setFilter(f) }, f)), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", alignSelf: "center", fontSize: 12, color: "var(--ink-3)", fontFamily: "JetBrains Mono, monospace" } }, items.length, " ", t("cat_results"))), tab === "transport" && /* @__PURE__ */ React.createElement("div", { className: "cat-rental-banner reveal" }, /* @__PURE__ */ React.createElement("div", { className: "cat-rental-banner-eyebrow", style: { color: "var(--brand)" } }, "\u2713 ", tx("NO HIDDEN COSTS", "INGEN SKJULTE KOSTNADER", "AUCUN FRAIS CACH\xC9", "INGA DOLDA KOSTNADER")), /* @__PURE__ */ React.createElement("div", { className: "cat-rental-banner-row" }, /* @__PURE__ */ React.createElement("div", { className: "cat-rental-banner-perks" }, tx(
    "Unlimited mileage \xB7 Free hotel/airport delivery \xB7 Insurance available \xB7 Fuel policy clear at pickup",
    "Ubegrenset kj\xF8relengde \xB7 Gratis levering hotell/flyplass \xB7 Forsikring tilgjengelig \xB7 Drivstoffregel klart spesifisert ved henting",
    "Kilom\xE9trage illimit\xE9 \xB7 Livraison gratuite h\xF4tel/a\xE9roport \xB7 Assurance disponible \xB7 Politique carburant claire \xE0 la prise en charge",
    "Obegr\xE4nsat antal mil \xB7 Gratis leverans hotell/flygplats \xB7 F\xF6rs\xE4kring tillg\xE4nglig \xB7 Br\xE4nslepolicy tydlig vid upph\xE4mtning"
  )))), /* @__PURE__ */ React.createElement("div", { className: "cat-grid" }, visibleItems.map((it, i) => {
    const key = `${tab}-${it.name}`;
    return /* @__PURE__ */ React.createElement("div", { key, className: "cat-card reveal", style: { transitionDelay: `${i % 6 * 50}ms` } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "cat-img cat-img-resolved",
        onClick: () => setModal({ item: it, tab }),
        role: "button",
        tabIndex: 0,
        onKeyDown: (e) => e.key === "Enter" && setModal({ item: it, tab }),
        style: { cursor: "pointer" }
      },
      /* @__PURE__ */ React.createElement(ResolvedImg, { tab, item: it, alt: it.name }),
      /* @__PURE__ */ React.createElement("div", { className: "cat-img-content" }, /* @__PURE__ */ React.createElement("span", { className: "cat-tag brand" }, localize(it.tag || it.style || it.cuisine, ctx.lang))),
      /* @__PURE__ */ React.createElement("button", { className: `cat-fav ${favs[key] ? "active" : ""}`, onClick: (e) => {
        e.stopPropagation();
        toggleFav(key);
      } }, /* @__PURE__ */ React.createElement(Ic.Heart, { s: 16, filled: favs[key] }), /* @__PURE__ */ React.createElement("span", { className: "ms-fav-plus" }, "+1"))
    ), /* @__PURE__ */ React.createElement("div", { className: "cat-body" }, /* @__PURE__ */ React.createElement("div", { className: "cat-rating" }, /* @__PURE__ */ React.createElement("span", { className: "stars" }, /* @__PURE__ */ React.createElement(Ic.Star, null)), /* @__PURE__ */ React.createElement("strong", null, it.rating), it.reviews ? /* @__PURE__ */ React.createElement("span", { style: { color: "var(--ink-3)" } }, "(", it.reviews.toLocaleString(), " ", tx("reviews", "anmeldelser", "avis", "recensioner"), ")") : it.guestRating ? /* @__PURE__ */ React.createElement("span", { style: { color: "var(--ink-3)" } }, "\xB7 ", it.guestRating, " ", tx("guest score", "gjestescore", "note clients", "g\xE4stbetyg")) : null), /* @__PURE__ */ React.createElement("h3", { className: "cat-title" }, localize(it.name, ctx.lang), tab === "camps" && it.rooms && it.rooms.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "cat-title-acc" }, " \xB7 ", tx("Accommodation", "Overnatting", "H\xE9bergement", "Boende"))), /* @__PURE__ */ React.createElement("span", { className: "cat-area" }, /* @__PURE__ */ React.createElement(Ic.Pin, { s: 12 }), " ", localize(it.area, ctx.lang)), it.duration && /* @__PURE__ */ React.createElement("span", { className: "cat-duration" }, /* @__PURE__ */ React.createElement(Ic.Clock, { s: 12 }), " ", localize(it.duration, ctx.lang)), /* @__PURE__ */ React.createElement("p", { className: "cat-desc" }, localize(it.desc, ctx.lang)), /* @__PURE__ */ React.createElement("div", { className: "cat-foot" }, /* @__PURE__ */ React.createElement("div", { className: "cat-price" }, (() => {
      if (tab === "camps") {
        return /* @__PURE__ */ React.createElement("span", { className: "cat-price-offers" }, tx("Check offers", "Se tilbud", "Voir les offres", "Se erbjudanden"), " \u2192");
      }
      const TAB_DEFAULTS = {
        activities: { base: 35, step: 5, unit: "/person" },
        restaurants: { base: 40, step: 5, unit: "/person" },
        excursions: { base: 75, step: 10, unit: "/person" },
        spa: { base: 55, step: 10, unit: "/person" },
        camps: { base: 65, step: 10, unit: "/person" },
        pools: { base: 30, step: 5, unit: "/person" },
        transport: { base: 29, step: 0, unit: "/day" }
      };
      const seed = (it.slug || it.name || "").toString().split("").reduce((s, c) => s + c.charCodeAt(0), 0);
      const def = TAB_DEFAULTS[tab];
      const fallback = def ? `\u20AC${def.base + (def.step ? seed % 5 * def.step : 0)}${def.unit}` : null;
      const directPrice = it.price && /€|MAD|kr|\$/i.test(it.price) ? it.price : null;
      const tieredPrice = it.prices && it.prices[0] && it.prices[0].price;
      const raw = (directPrice || tieredPrice || fallback || "").replace(/^\s*(from|From|à partir de|fra|från)\s+/i, "");
      if (raw) {
        const fromLabel = ctx.lang === "no" ? "Fra" : ctx.lang === "fr" ? "\xC0 partir de" : ctx.lang === "sv" ? "Fr\xE5n" : "From";
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "cat-price-from" }, fromLabel), /* @__PURE__ */ React.createElement("span", { className: "amount cat-price-amount" }, raw));
      }
      return /* @__PURE__ */ React.createElement("span", { className: "amount", style: { fontSize: 13, fontStyle: "italic", opacity: 0.7 } }, ctx.lang === "no" ? "P\xE5 foresp\xF8rsel" : ctx.lang === "fr" ? "Sur demande" : ctx.lang === "sv" ? "P\xE5 f\xF6rfr\xE5gan" : "On request");
    })()), /* @__PURE__ */ React.createElement("button", { className: "cat-arrow", onClick: () => setModal({ item: it, tab }) }, /* @__PURE__ */ React.createElement(Ic.Arrow, { s: 16 })))));
  })), hasMore && /* @__PURE__ */ React.createElement("div", { className: "cat-showmore-row" }, /* @__PURE__ */ React.createElement("button", { className: "cat-showmore", onClick: () => setVisibleCount((c) => c + 8) }, tx(`Show more (${items.length - visibleCount} remaining)`, `Vis flere (${items.length - visibleCount} igjen)`, `Voir plus (${items.length - visibleCount} restants)`, `Visa fler (${items.length - visibleCount} kvar)`), /* @__PURE__ */ React.createElement(Ic.Arrow, { s: 14 })), visibleCount + 8 < items.length && /* @__PURE__ */ React.createElement("button", { className: "cat-showall", onClick: () => setVisibleCount(items.length) }, tx("Show all", "Vis alle", "Tout voir", "Visa alla")))), modal && /* @__PURE__ */ React.createElement(
    CatalogModal,
    {
      item: modal.item,
      tab: modal.tab,
      lang: ctx.lang,
      onClose: () => setModal(null)
    }
  ));
}
window.MS_Catalog = Catalog;
