const { useState: useSE, useEffect: useEE } = React;
const Ie = window.MS_I;
const IG_POSTS = [
  { img: "https://images.unsplash.com/photo-1489493512598-d08130f49bea?w=600&q=80&auto=format&fit=crop", caption: "Dawn at Erg Chebbi" },
  { img: "https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=600&q=80&auto=format&fit=crop", caption: "Jardin Majorelle in cobalt" },
  { img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80&auto=format&fit=crop", caption: "The Koutoubia at golden hour" },
  { img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80&auto=format&fit=crop", caption: "High Atlas, late October" },
  { img: "https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=600&q=80&auto=format&fit=crop", caption: "Camp lanterns in Agafay" },
  { img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop", caption: "Tagine night, Caf\xE9 Clock" },
  { img: "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=600&q=80&auto=format&fit=crop", caption: "Inside the medina, blue door" },
  { img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80&auto=format&fit=crop", caption: "A wedding in a riad" }
];
function InstagramStrip() {
  const { useT, COMPANY } = window.MS_CTX;
  const t = useT();
  return /* @__PURE__ */ React.createElement("section", { className: "ig section", id: "instagram" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "ig-follow-wrap reveal", style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, t("ig_eyebrow")), /* @__PURE__ */ React.createElement("h2", { style: { margin: "12px 0 8px" } }, t("ig_title_a"), " ", /* @__PURE__ */ React.createElement("em", null, t("ig_title_b"))), /* @__PURE__ */ React.createElement("p", { style: { margin: "0 auto 32px", maxWidth: 480 } }, t("ig_sub")), /* @__PURE__ */ React.createElement(
    "a",
    {
      href: `https://instagram.com/${COMPANY.instagram}`,
      target: "_blank",
      rel: "noopener",
      className: "btn btn-ink",
      style: { display: "inline-flex", alignItems: "center", gap: 10 }
    },
    /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5" }), /* @__PURE__ */ React.createElement("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" }), /* @__PURE__ */ React.createElement("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" })),
    t("ig_follow"),
    " @",
    COMPANY.instagram
  ))));
}
function ContactSection() {
  const { useT, COMPANY } = window.MS_CTX;
  const t = useT();
  return /* @__PURE__ */ React.createElement("section", { className: "contact section", id: "contact" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "contact-card reveal" }, /* @__PURE__ */ React.createElement("div", { className: "contact-info" }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow", style: { color: "#ffae7c" } }, t("contact_eyebrow")), /* @__PURE__ */ React.createElement("h2", { className: "serif", style: { fontSize: "clamp(25px, 3.2vw, 38px)", fontWeight: 400, color: "#fff", margin: "14px 0 12px", letterSpacing: "-0.025em", lineHeight: 1 } }, t("contact_title_a")), /* @__PURE__ */ React.createElement("span", { style: { display: "block", width: 56, height: 3, borderRadius: 3, background: "#ffae7c", margin: "0 0 18px" }, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("p", { style: { color: "rgba(255,255,255,.75)", fontSize: 16, maxWidth: 460, margin: "0 0 32px" } }, t("contact_sub")), /* @__PURE__ */ React.createElement("div", { className: "contact-rows" }, /* @__PURE__ */ React.createElement("a", { href: `mailto:${COMPANY.email}`, className: "contact-row" }, /* @__PURE__ */ React.createElement("span", { className: "contact-row-ico" }, /* @__PURE__ */ React.createElement(Ie.Mail, { s: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "contact-row-lbl" }, "Email"), /* @__PURE__ */ React.createElement("span", { className: "contact-row-val" }, COMPANY.email))), /* @__PURE__ */ React.createElement("a", { href: `tel:${COMPANY.phoneIntl}`, className: "contact-row" }, /* @__PURE__ */ React.createElement("span", { className: "contact-row-ico" }, /* @__PURE__ */ React.createElement(Ie.Phone, { s: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "contact-row-lbl" }, "Phone"), /* @__PURE__ */ React.createElement("span", { className: "contact-row-val" }, COMPANY.phone))), /* @__PURE__ */ React.createElement("a", { href: `https://wa.me/${COMPANY.whatsapp}`, target: "_blank", rel: "noopener", className: "contact-row" }, /* @__PURE__ */ React.createElement("span", { className: "contact-row-ico", style: { background: "rgba(37,211,102,.18)", color: "#25d366" } }, /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "contact-row-lbl" }, "WhatsApp"), /* @__PURE__ */ React.createElement("span", { className: "contact-row-val" }, COMPANY.phone))), /* @__PURE__ */ React.createElement("div", { className: "contact-row", style: { cursor: "default" } }, /* @__PURE__ */ React.createElement("span", { className: "contact-row-ico" }, /* @__PURE__ */ React.createElement(Ie.Pin, { s: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "contact-row-lbl" }, "Studio"), /* @__PURE__ */ React.createElement("span", { className: "contact-row-val" }, COMPANY.address)))), /* @__PURE__ */ React.createElement("div", { className: "contact-cta-row" }, /* @__PURE__ */ React.createElement("a", { href: `mailto:${COMPANY.email}`, className: "btn btn-primary" }, /* @__PURE__ */ React.createElement(Ie.Mail, { s: 14 }), " ", t("contact_email_btn")), /* @__PURE__ */ React.createElement("a", { href: `https://wa.me/${COMPANY.whatsapp}`, target: "_blank", rel: "noopener", className: "btn btn-outline", style: { color: "#fff", borderColor: "rgba(255,255,255,.25)" } }, t("contact_wa_btn")))), /* @__PURE__ */ React.createElement("div", { className: "contact-phone-wrap" }, window.MS_InstagramPhone && /* @__PURE__ */ React.createElement(window.MS_InstagramPhone, null)))));
}
function WhatsAppWidget() {
  const { useT, COMPANY } = window.MS_CTX;
  const t = useT();
  const [open, setOpen] = useSE(false);
  const [hint, setHint] = useSE(false);
  useEE(() => {
    const t1 = setTimeout(() => setHint(true), 4e3);
    const t2 = setTimeout(() => setHint(false), 9e3);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "wa-widget" }, open && /* @__PURE__ */ React.createElement("div", { className: "wa-panel" }, /* @__PURE__ */ React.createElement("div", { className: "wa-panel-head" }, /* @__PURE__ */ React.createElement("div", { className: "wa-avatar" }, /* @__PURE__ */ React.createElement("img", { src: "assets/logo.png", alt: "" })), /* @__PURE__ */ React.createElement("div", { className: "wa-panel-info" }, /* @__PURE__ */ React.createElement("strong", null, "Marrakechstory"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "wa-online" }), " Typically replies in minutes")), /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen(false), className: "wa-close", "aria-label": "Close" }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })))), /* @__PURE__ */ React.createElement("div", { className: "wa-bubble" }, "Hi \u{1F44B} We're here to help with your trip to Marrakech. Send us a message \u2014 we usually reply within minutes."), /* @__PURE__ */ React.createElement(
    "a",
    {
      href: `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent("Hi Marrakechstory, I'd like some advice about a trip to Marrakech.")}`,
      target: "_blank",
      rel: "noopener",
      className: "wa-cta"
    },
    /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" })),
    "Start chat on WhatsApp"
  )), hint && !open && /* @__PURE__ */ React.createElement("div", { className: "wa-hint" }, /* @__PURE__ */ React.createElement("strong", null, t("wa_label")), /* @__PURE__ */ React.createElement("span", null, t("wa_sub"))), /* @__PURE__ */ React.createElement("button", { className: "wa-btn", onClick: () => setOpen((o) => !o), "aria-label": "WhatsApp" }, /* @__PURE__ */ React.createElement("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" })), /* @__PURE__ */ React.createElement("span", { className: "wa-pulse" })));
}
function InstagramScrollWidget() {
  const { COMPANY } = window.MS_CTX;
  const [visible, setVisible] = useSE(false);
  const [expanded, setExpanded] = useSE(false);
  useEE(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const igUrl = `https://instagram.com/${COMPANY.instagram}`;
  return /* @__PURE__ */ React.createElement("div", { className: `ig-scroll-widget ${visible ? "visible" : ""} ${expanded ? "expanded" : ""}` }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "ig-scroll-btn",
      onClick: () => setExpanded((e) => !e),
      "aria-label": "Follow us on Instagram"
    },
    /* @__PURE__ */ React.createElement("span", { className: "ig-scroll-ring" }),
    /* @__PURE__ */ React.createElement("span", { className: "ig-scroll-ring ig-scroll-ring-2" }),
    /* @__PURE__ */ React.createElement("svg", { className: "ig-scroll-icon", width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5" }), /* @__PURE__ */ React.createElement("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" }), /* @__PURE__ */ React.createElement("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" })),
    /* @__PURE__ */ React.createElement("span", { className: "ig-scroll-dot" })
  ), expanded && /* @__PURE__ */ React.createElement("div", { className: "ig-scroll-popup" }, /* @__PURE__ */ React.createElement("div", { className: "ig-scroll-popup-head" }, /* @__PURE__ */ React.createElement("div", { className: "ig-scroll-avatar" }, /* @__PURE__ */ React.createElement("img", { src: "assets/logo.png", alt: "Marrakechstory" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "ig-scroll-name" }, "@", COMPANY.instagram), /* @__PURE__ */ React.createElement("div", { className: "ig-scroll-followers" }, "12.4k followers"))), /* @__PURE__ */ React.createElement("p", { className: "ig-scroll-desc" }, "Daily stories from the medina, the Atlas and the desert. Follow along."), /* @__PURE__ */ React.createElement("a", { href: igUrl, target: "_blank", rel: "noopener", className: "ig-scroll-cta" }, "Follow on Instagram", /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }), /* @__PURE__ */ React.createElement("polyline", { points: "15 3 21 3 21 9" }), /* @__PURE__ */ React.createElement("line", { x1: "10", y1: "14", x2: "21", y2: "3" })))));
}
window.MS_Instagram = InstagramStrip;
window.MS_Contact = ContactSection;
window.MS_WhatsApp = WhatsAppWidget;
window.MS_InstagramWidget = InstagramScrollWidget;
