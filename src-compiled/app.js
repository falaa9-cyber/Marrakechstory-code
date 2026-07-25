const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;
const Ia = window.MS_I;
function NavPill({ label, items, value, onSelect, head, align = "right" }) {
  const [open, setOpen] = useStateA(false);
  const ref = useRefA(null);
  useEffectA(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "nav-pill", ref }, /* @__PURE__ */ React.createElement("button", { className: "nav-pill-btn", onClick: () => setOpen((o) => !o) }, label, /* @__PURE__ */ React.createElement("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))), open && /* @__PURE__ */ React.createElement("div", { className: `nav-pill-menu ${align === "left" ? "left" : ""}` }, head && /* @__PURE__ */ React.createElement("div", { className: "menu-head" }, head), items.map((it) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: it.id,
      className: value === it.id ? "active" : "",
      onClick: () => {
        onSelect(it.id);
        setOpen(false);
      }
    },
    /* @__PURE__ */ React.createElement("span", null, it.flag && /* @__PURE__ */ React.createElement("span", { className: "flag", style: { marginRight: 8 } }, it.flag), it.label),
    value === it.id && /* @__PURE__ */ React.createElement(Ia.Check, { s: 14 })
  ))));
}
const CURR_EMOJI = { NOK: "🇳🇴", SEK: "🇸🇪", EUR: "🇪🇺", USD: "🇺🇸", MAD: "🇲🇦", GBP: "🇬🇧" };
const CURR_SYMBOL = { NOK: "kr", SEK: "kr", DKK: "kr.", EUR: "€", USD: "$", MAD: "د.م", GBP: "£" };
const LANG_TO_CURR = { no: "NOK", sv: "SEK", da: "DKK", de: "EUR", en: "GBP", fr: "EUR" };
function LangCurrPill({ lang, curr, langItem, LANG_LIST, CURR_LIST, setLang, setCurr, langHead, currHead }) {
  const [open, setOpen] = useStateA(false);
  const ref = useRefA(null);
  useEffectA(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "ms-lc", ref, style: { position: "relative" } }, /* @__PURE__ */ React.createElement("button", { className: "ms-lc-pill", onClick: () => setOpen((o) => !o), "aria-haspopup": "listbox", "aria-expanded": open, "aria-label": `${lang} / ${curr}` }, /* @__PURE__ */ React.createElement("span", { className: "ms-lc-flag" }, langItem?.flag)), open && /* @__PURE__ */ React.createElement("div", { className: "ms-lc-menu ms-lc-menu-lang", role: "listbox" }, /* @__PURE__ */ React.createElement("div", { className: "ms-lc-col-head" }, langHead), /* @__PURE__ */ React.createElement("div", { className: "ms-lc-lang-col" }, LANG_LIST.map((it) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: it.id,
      className: `ms-lc-opt ${lang === it.id ? "is-active" : ""}`,
      onClick: () => {
        setLang(it.id);
        setOpen(false);
      },
      "aria-label": it.label
    },
    /* @__PURE__ */ React.createElement("span", { className: "flag" }, it.flag),
    /* @__PURE__ */ React.createElement("span", { className: "ms-lc-lang-label" }, it.label),
    /* @__PURE__ */ React.createElement("span", { className: "ms-lc-lang-cur" }, LANG_TO_CURR[it.id] || ""),
    lang === it.id && /* @__PURE__ */ React.createElement(Ia.Check, { s: 13, className: "check" })
  )))));
}
function Nav() {
  const { useMS, useT, LANG_LIST, CURR_LIST } = window.MS_CTX;
  const { lang, curr, setLang, setCurr } = useMS();
  const t = useT();
  const [scrolled, setScrolled] = useStateA(false);
  const [overHero, setOverHero] = useStateA(true);
  useEffectA(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setOverHero(window.scrollY < window.innerHeight - 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const langItem = LANG_LIST.find((l) => l.id === lang);
  return /* @__PURE__ */ React.createElement("nav", { className: `nav ${scrolled ? "scrolled" : ""} ${overHero && !scrolled ? "over-hero" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "wrap-wide nav-inner" }, /* @__PURE__ */ React.createElement("a", { href: "#home", className: "nav-logo" }, /* @__PURE__ */ React.createElement("img", { src: "assets/logo.png", alt: "Marrakechstory", className: "logo-img" }), /* @__PURE__ */ React.createElement("span", null, "Marrakech", /* @__PURE__ */ React.createElement("em", { style: { fontStyle: "italic", fontWeight: 400, opacity: 0.7, marginLeft: 2 } }, "Story"))), /* @__PURE__ */ React.createElement("div", { className: "nav-links" }, /* @__PURE__ */ React.createElement("a", { href: "#itineraries" }, t("nav_packages")), /* @__PURE__ */ React.createElement("a", { href: "#itineraries", onClick: (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("ms:open-cat", { detail: { cat: "activities" } }));
  } }, t("nav_catalog")), /* @__PURE__ */ React.createElement("a", { href: "#itineraries", onClick: (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("ms:open-plan"));
  } }, t("nav_plan")), /* @__PURE__ */ React.createElement("a", { href: "#contact" }, t("nav_contact")), /* @__PURE__ */ React.createElement("a", { href: "#gallery" }, t("nav_gallery")), /* @__PURE__ */ React.createElement("a", { href: "#collaborate", className: "nav-collab-link" }, t("nav_collab"))), /* @__PURE__ */ React.createElement("div", { className: "nav-cta" }, /* @__PURE__ */ React.createElement(
    LangCurrPill,
    {
      lang,
      curr,
      langItem,
      LANG_LIST,
      CURR_LIST,
      setLang,
      setCurr,
      langHead: t("nav_lang"),
      currHead: t("nav_curr")
    }
  ), window.MS_AuthSystem && /* @__PURE__ */ React.createElement(window.MS_AuthSystem, null))));
}
function CollabForm() {
  const { useT, COMPANY } = window.MS_CTX;
  const t = useT();
  const [name, setName] = useStateA("");
  const [email, setEmail] = useStateA("");
  const [type, setType] = useStateA("");
  const [msg, setMsg] = useStateA("");
  const [sent, setSent] = useStateA(false);
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (window.MS_submitForm) {
      window.MS_submitForm("collaboration", {
        name,
        email,
        tripType: type,
        payload: { collaborationType: type, message: msg }
      }, { via: "collab-form" });
    }
    const subj = encodeURIComponent(`Collaboration: ${type || "General"} — ${name}`);
    const body = encodeURIComponent(`Name: ${name}
Email: ${email}
Type: ${type}

${msg}`);
    window.open(`mailto:${COMPANY.email}?subject=${subj}&body=${body}`);
    setSent(true);
  };
  const types = [
    { v: "hotel", l: t("collab_type_hotel") },
    { v: "rest", l: t("collab_type_rest") },
    { v: "spa", l: t("collab_type_spa") },
    { v: "activity", l: t("collab_type_activity") },
    { v: "creator", l: t("collab_type_creator") },
    { v: "agency", l: t("collab_type_agency") },
    { v: "other", l: t("collab_type_other") }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "footer-collab reveal", id: "collaborate" }, /* @__PURE__ */ React.createElement("div", { className: "footer-collab-text" }, /* @__PURE__ */ React.createElement("span", { className: "footer-collab-eyebrow" }, t("collab_eyebrow")), /* @__PURE__ */ React.createElement("h4", { className: "footer-collab-title" }, t("collab_title")), /* @__PURE__ */ React.createElement("p", { className: "footer-collab-sub" }, t("collab_sub"))), sent ? /* @__PURE__ */ React.createElement("div", { className: "footer-collab-thanks" }, /* @__PURE__ */ React.createElement("span", null, "✓"), " ", t("collab_thanks")) : /* @__PURE__ */ React.createElement("form", { className: "footer-collab-form", onSubmit: submit }, /* @__PURE__ */ React.createElement("div", { className: "footer-collab-row" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      autoComplete: "name",
      required: true,
      value: name,
      onChange: (e) => setName(e.target.value),
      placeholder: t("collab_name")
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      autoComplete: "email",
      type: "email",
      required: true,
      value: email,
      onChange: (e) => setEmail(e.target.value),
      placeholder: t("collab_email")
    }
  )), /* @__PURE__ */ React.createElement("select", { value: type, onChange: (e) => setType(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, t("collab_type")), types.map((tp) => /* @__PURE__ */ React.createElement("option", { key: tp.v, value: tp.v }, tp.l))), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: 2,
      autoComplete: "off",
      value: msg,
      onChange: (e) => setMsg(e.target.value),
      placeholder: t("collab_msg")
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit" }, t("collab_send"), " →")));
}
function Footer() {
  const { useT, COMPANY } = window.MS_CTX;
  const t = useT();
  return /* @__PURE__ */ React.createElement("footer", { className: "footer" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "footer-grid" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("a", { href: "#home", className: "nav-logo", style: { color: "#fff" } }, /* @__PURE__ */ React.createElement("img", { src: "assets/logo.png", alt: "Marrakechstory", style: { width: 46, height: 46, borderRadius: 10, objectFit: "cover" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, "Marrakech", /* @__PURE__ */ React.createElement("em", { style: { fontStyle: "italic", fontWeight: 400, opacity: 0.7, marginLeft: 2 } }, "Story"))), /* @__PURE__ */ React.createElement("div", { className: "footer-tag" }, t("foot_tag_a"), /* @__PURE__ */ React.createElement("br", null), t("foot_tag_b"), " ", /* @__PURE__ */ React.createElement("em", { style: { color: "#ff9b78", fontStyle: "italic" } }, t("foot_tag_c"))), /* @__PURE__ */ React.createElement("div", { className: "footer-contact-list" }, /* @__PURE__ */ React.createElement("a", { href: `mailto:${COMPANY.email}` }, /* @__PURE__ */ React.createElement(Ia.Mail, null), " ", COMPANY.email), /* @__PURE__ */ React.createElement("a", { href: `tel:${COMPANY.phoneIntl}` }, /* @__PURE__ */ React.createElement(Ia.Phone, null), " ", COMPANY.phone), /* @__PURE__ */ React.createElement("a", { href: `https://wa.me/${COMPANY.whatsapp}`, target: "_blank", rel: "noopener" }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" })), "WhatsApp"), /* @__PURE__ */ React.createElement("span", { style: { color: "rgba(255,255,255,.7)", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 12 } }, /* @__PURE__ */ React.createElement(Ia.Pin, null), " ", COMPANY.address))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", null, t("foot_plan")), /* @__PURE__ */ React.createElement("div", { className: "footer-links" }, /* @__PURE__ */ React.createElement("a", { href: "#itineraries" }, t("nav_packages")), /* @__PURE__ */ React.createElement("a", { href: "#plan" }, t("nav_plan")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", null, t("foot_discover")), /* @__PURE__ */ React.createElement("div", { className: "footer-links" }, /* @__PURE__ */ React.createElement("a", { href: "#catalog" }, t("cat_activities")), /* @__PURE__ */ React.createElement("a", { href: "#catalog" }, t("cat_restaurants")), /* @__PURE__ */ React.createElement("a", { href: "#catalog" }, t("cat_spa")), /* @__PURE__ */ React.createElement("a", { href: "#catalog" }, t("cat_camps")), /* @__PURE__ */ React.createElement("a", { href: "#catalog" }, t("cat_pools")), /* @__PURE__ */ React.createElement("a", { href: "#catalog" }, t("cat_transport")), /* @__PURE__ */ React.createElement("a", { href: "#catalog" }, t("cat_excursions")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", null, t("foot_contact")), /* @__PURE__ */ React.createElement("div", { className: "footer-links" }, /* @__PURE__ */ React.createElement("a", { href: `mailto:${COMPANY.email}` }, t("foot_email")), /* @__PURE__ */ React.createElement("a", { href: `tel:${COMPANY.phoneIntl}` }, COMPANY.phone), /* @__PURE__ */ React.createElement("a", { href: `https://wa.me/${COMPANY.whatsapp}`, target: "_blank", rel: "noopener" }, "WhatsApp"), /* @__PURE__ */ React.createElement("a", { href: `https://instagram.com/${COMPANY.instagram}`, target: "_blank", rel: "noopener" }, "@", COMPANY.instagram)))), /* @__PURE__ */ React.createElement(CollabForm, null), /* @__PURE__ */ React.createElement("div", { className: "footer-bottom" }, /* @__PURE__ */ React.createElement("span", null, "© 2026 Marrakechstory · IATA accredited · ONMT licence #14872 · ", t("foot_rights"), " ", /* @__PURE__ */ React.createElement("a", { href: "#admin", className: "footer-admin-link", title: "Staff area", "aria-label": "Staff area" }, "·")), /* @__PURE__ */ React.createElement("span", { style: { display: "flex", gap: 18 } }, /* @__PURE__ */ React.createElement("a", { href: "#" }, t("foot_privacy")), /* @__PURE__ */ React.createElement("a", { href: "#" }, t("foot_terms")), /* @__PURE__ */ React.createElement("a", { href: "#" }, t("foot_cookies"))))));
}
function AppInner() {
  useEffectA(() => {
    const observe = () => {
      const els = document.querySelectorAll(".reveal:not(.in)");
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io2.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
      els.forEach((el) => io2.observe(el));
      return io2;
    };
    let io = observe();
    const re = setInterval(() => {
      io.disconnect();
      io = observe();
    }, 1200);
    return () => {
      io.disconnect();
      clearInterval(re);
    };
  }, []);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Nav, null), /* @__PURE__ */ React.createElement(window.MS_HeroSlider, null), /* @__PURE__ */ React.createElement(window.MS_Itineraries, null), /* @__PURE__ */ React.createElement(window.MS_Catalog, null), /* @__PURE__ */ React.createElement(window.MS_Form, null), /* @__PURE__ */ React.createElement(window.MS_Contact, null), window.MS_ReviewsGallery && /* @__PURE__ */ React.createElement(window.MS_ReviewsGallery, null), /* @__PURE__ */ React.createElement(Footer, null), /* @__PURE__ */ React.createElement(window.MS_WhatsApp, null), window.MS_QuickBookHost && /* @__PURE__ */ React.createElement(window.MS_QuickBookHost, null), window.MS_TweakHost && /* @__PURE__ */ React.createElement(window.MS_TweakHost, null), window.MS_Chatbot && /* @__PURE__ */ React.createElement(window.MS_Chatbot, null), /* @__PURE__ */ React.createElement(window.MS_InstagramWidget, null), window.MS_Weather && /* @__PURE__ */ React.createElement(window.MS_Weather, null), /* @__PURE__ */ React.createElement(MobileTabBar, null));
}
function MobileTabBar() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const [active, setActive] = useStateA(0);
  const svg = (d) => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, d);
  const ICON = {
    home: svg(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 10.5 12 3l9 7.5" }), /* @__PURE__ */ React.createElement("path", { d: "M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" }))),
    trips: svg(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "6", y: "7", width: "12", height: "13", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11h6" }))),
    search: svg(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "7" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" }))),
    gallery: svg(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }), /* @__PURE__ */ React.createElement("circle", { cx: "8.5", cy: "9.5", r: "1.6" }), /* @__PURE__ */ React.createElement("path", { d: "m4 18 5-5 4 4 3-3 4 4" }))),
    contact: svg(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "m4 7 8 6 8-6" })))
  };
  const goSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const items = [
    { key: "home", label: tx("Home", "Hjem", "Accueil", "Hem"), icon: ICON.home, go: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
    { key: "trips", label: tx("Trips", "Turer", "Voyages", "Resor"), icon: ICON.trips, go: () => goSection("itineraries") },
    { key: "search", label: tx("Search", "Søk", "Recherche", "Sök"), icon: ICON.search, go: () => window.dispatchEvent(new CustomEvent("ms:open-cat", { detail: { cat: "activities" } })) },
    { key: "gallery", label: tx("Gallery", "Galleri", "Galerie", "Galleri"), icon: ICON.gallery, go: () => goSection("gallery") },
    { key: "contact", label: tx("Contact", "Kontakt", "Contact", "Kontakt"), icon: ICON.contact, go: () => goSection("contact") }
  ];
  useEffectA(() => {
    const order = [["home", 0], ["itineraries", 1], ["catalog", 2], ["gallery", 3], ["contact", 4]];
    const onScroll = () => {
      const mid = window.scrollY + window.innerHeight * 0.4;
      let idx = 0;
      order.forEach(([id, i]) => {
        const el = document.getElementById(id);
        if (el && el.offsetParent !== null && el.getBoundingClientRect().top + window.scrollY <= mid) idx = i;
      });
      setActive(idx);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return /* @__PURE__ */ React.createElement("nav", { className: "ms-tabbar", "aria-label": "Primary" }, items.map((it, i) => /* @__PURE__ */ React.createElement("button", { key: it.key, className: `ms-tab${active === i ? " active" : ""}`, onClick: it.go, "aria-current": active === i ? "page" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "ms-tab-ico" }, it.icon), /* @__PURE__ */ React.createElement("span", { className: "ms-tab-lbl" }, it.label))));
}
function App() {
  const { MSProvider } = window.MS_CTX;
  return /* @__PURE__ */ React.createElement(MSProvider, null, /* @__PURE__ */ React.createElement(AppInner, null));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(App, null));
(function() {
  function ensureAdminRoot() {
    let el = document.getElementById("ms-admin-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "ms-admin-root";
      document.body.appendChild(el);
    }
    return el;
  }
  function syncAdmin() {
    const hashRoute = (location.hash || "").replace(/^#/, "").split("?")[0];
    const isAdminRecovery = new URLSearchParams(location.search || "").get("admin_recovery") === "1";
    const isAdmin = hashRoute === "admin" || isAdminRecovery;
    const siteRoot = document.getElementById("root");
    if (isAdmin) {
      const el = ensureAdminRoot();
      el.style.display = "block";
      if (siteRoot) siteRoot.style.display = "none";
      let tries = 0;
      (function mount() {
        if (typeof window.MS_AdminMount === "function") {
          window.MS_AdminMount(el);
        } else if (tries++ < 50) {
          setTimeout(mount, 100);
        }
      })();
    } else {
      const el = document.getElementById("ms-admin-root");
      if (el) {
        el.style.display = "none";
        if (window.MS_AdminUnmount) window.MS_AdminUnmount();
      }
      if (siteRoot) siteRoot.style.display = "";
    }
  }
  window.addEventListener("hashchange", syncAdmin);
  syncAdmin();
})();
