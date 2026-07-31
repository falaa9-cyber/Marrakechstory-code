(function() {
  const { useState, useEffect, useRef } = React;
  const T = (lang) => (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const locale = (lang) => lang === "no" ? "nb-NO" : lang === "fr" ? "fr-FR" : lang === "da" ? "da-DK" : lang === "de" ? "de-DE" : "en-US";
  const fmtDate = (d, loc) => d ? d.toLocaleDateString(loc, { day: "numeric", month: "short" }) : "";
  function Mosaic({ images, alt, onShowAll, tx }) {
    const imgs = images.slice(0, 5);
    const n = imgs.length;
    return /* @__PURE__ */ React.createElement("div", { className: "ms-ld-mosaic" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-mosaic-grid ms-ld-mg-" + n }, imgs.map((src, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "ms-ld-mo" + (i === 0 ? " ms-ld-mo-main" : ""), style: { backgroundImage: `url(${src})` }, onClick: () => onShowAll(i), role: "button", "aria-label": alt }))), images.length > 1 && /* @__PURE__ */ React.createElement("button", { className: "ms-ld-showall", onClick: () => onShowAll(0) }, /* @__PURE__ */ React.createElement("span", { className: "ms-ld-showall-ico", "aria-hidden": "true" }, "\u25A6"), " ", tx("Show all photos", "Vis alle bilder", "Voir toutes les photos")));
  }
  function MobileCarousel({ images, alt }) {
    const [i, setI] = useState(0);
    const n = images.length;
    const start = useRef(null);
    const go = (d) => setI((x) => (x + d + n) % n);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "ms-ld-mcar",
        onTouchStart: (e) => {
          start.current = e.touches[0].clientX;
        },
        onTouchEnd: (e) => {
          const dx = e.changedTouches[0].clientX - (start.current || 0);
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          start.current = null;
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: "ms-ld-mcar-img", style: { backgroundImage: `url(${images[i]})` }, role: "img", "aria-label": alt }),
      n > 1 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-mcar-count" }, i + 1, " / ", n),
      n > 1 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-mcar-dots" }, images.map((_, k) => /* @__PURE__ */ React.createElement("span", { key: k, className: "ms-ld-mcar-dot" + (k === i ? " on" : "") })))
    );
  }
  function Lightbox({ images, alt, start, onClose }) {
    const [i, setI] = useState(start || 0);
    const n = images.length;
    useEffect(() => {
      const k = (e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") setI((x) => (x - 1 + n) % n);
        if (e.key === "ArrowRight") setI((x) => (x + 1) % n);
      };
      document.addEventListener("keydown", k);
      return () => document.removeEventListener("keydown", k);
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "ms-ld-lb", onClick: onClose }, /* @__PURE__ */ React.createElement("button", { className: "ms-ld-lb-close", onClick: onClose, "aria-label": "Close" }, "\u2715"), /* @__PURE__ */ React.createElement("button", { className: "ms-ld-lb-nav prev", onClick: (e) => {
      e.stopPropagation();
      setI((i - 1 + n) % n);
    }, "aria-label": "Previous" }, "\u2039"), /* @__PURE__ */ React.createElement("img", { className: "ms-ld-lb-img", src: images[i], alt, onClick: (e) => e.stopPropagation() }), /* @__PURE__ */ React.createElement("button", { className: "ms-ld-lb-nav next", onClick: (e) => {
      e.stopPropagation();
      setI((i + 1) % n);
    }, "aria-label": "Next" }, "\u203A"), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-lb-count" }, i + 1, " / ", n));
  }
  function Calendar({ lang, sel, setSel }) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [base, setBase] = useState(thisMonth);
    const loc = locale(lang);
    const dows = [];
    for (let i = 0; i < 7; i++) dows.push(new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: "short" }).slice(0, 2));
    const pick = (d) => {
      if (!sel.in || sel.out || d < sel.in) setSel({ in: d, out: null });
      else setSel({ in: sel.in, out: d });
    };
    const month = (off) => {
      const m = new Date(base.getFullYear(), base.getMonth() + off, 1);
      const y = m.getFullYear(), mo = m.getMonth();
      const fd = (new Date(y, mo, 1).getDay() + 6) % 7;
      const dim = new Date(y, mo + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < fd; i++) cells.push(null);
      for (let d = 1; d <= dim; d++) cells.push(new Date(y, mo, d));
      return /* @__PURE__ */ React.createElement("div", { className: "ms-ld-cal-m", key: off }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-cal-mn" }, m.toLocaleDateString(loc, { month: "long", year: "numeric" })), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-cal-dows" }, dows.map((w, i) => /* @__PURE__ */ React.createElement("span", { key: i }, w))), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-cal-grid" }, cells.map((c, i) => {
        if (!c) return /* @__PURE__ */ React.createElement("span", { key: i });
        const past = c < today;
        const isIn = sel.in && c.getTime() === sel.in.getTime();
        const isOut = sel.out && c.getTime() === sel.out.getTime();
        const inRange = sel.in && sel.out && c > sel.in && c < sel.out;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: i,
            disabled: past,
            type: "button",
            className: "ms-ld-cal-d" + (past ? " past" : "") + (isIn || isOut ? " sel" : "") + (inRange ? " range" : ""),
            onClick: () => pick(c)
          },
          c.getDate()
        );
      })));
    };
    return /* @__PURE__ */ React.createElement("div", { className: "ms-ld-cal" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-cal-head" }, /* @__PURE__ */ React.createElement("button", { className: "ms-ld-cal-arrow", type: "button", disabled: base <= thisMonth, onClick: () => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1)), "aria-label": "Previous month" }, "\u2039"), /* @__PURE__ */ React.createElement("button", { className: "ms-ld-cal-arrow", type: "button", onClick: () => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1)), "aria-label": "Next month" }, "\u203A")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-cal-months" }, month(0), month(1)));
  }
  const MS_GEO = {
    "marrakech": [31.6295, -7.9811],
    "agafay": [31.47, -8.16],
    "tizi n'tichka": [31.29, -7.37],
    "tizi": [31.29, -7.37],
    "ait ben haddou": [31.047, -7.13],
    "a\xEFt ben haddou": [31.047, -7.13],
    "ouarzazate": [30.92, -6.91],
    "dades": [31.36, -5.99],
    "dad\xE8s": [31.36, -5.99],
    "todra": [31.52, -5.53],
    "todgha": [31.52, -5.53],
    "tinghir": [31.51, -5.53],
    "merzouga": [31.1, -4.01],
    "sahara": [31.1, -4.01],
    "erg chebbi": [31.1, -4.01],
    "tangier": [35.76, -5.83],
    "tanger": [35.76, -5.83],
    "chefchaouen": [35.17, -5.27],
    "fes": [34.04, -4.99],
    "fez": [34.04, -4.99],
    "f\xE8s": [34.04, -4.99],
    "agadir": [30.42, -9.6],
    "essaouira": [31.51, -9.77],
    "ourika": [31.36, -7.76],
    "high atlas": [31.13, -7.92],
    "atlas": [31.13, -7.92],
    "volubilis": [34.07, -5.55],
    "rissani": [31.28, -4.26],
    "midelt": [32.68, -4.74],
    "azrou": [33.43, -5.22],
    "ifrane": [33.53, -5.11],
    "taroudant": [30.47, -8.88],
    // Marrakech districts & nearby spots used in catalogue "area" fields
    "medina": [31.6258, -7.9806],
    "m\xE9dina": [31.6258, -7.9806],
    "gueliz": [31.6383, -8.0086],
    "gu\xE9liz": [31.6383, -8.0086],
    "hivernage": [31.6228, -8.009],
    "agdal": [31.601, -7.981],
    "palmeraie": [31.665, -7.943],
    "menara": [31.612, -8.024],
    "amizmiz": [31.22, -8.24],
    "asni": [31.247, -7.97],
    "imlil": [31.137, -7.919],
    "setti fatma": [31.223, -7.676],
    "kik": [31.3, -8.05],
    "lalla takerkoust": [31.358, -8.132],
    "takerkoust": [31.358, -8.132],
    "oukaimeden": [31.205, -7.859],
    "zagora": [30.332, -5.838],
    "draa": [30.95, -6.45],
    "erfoud": [31.436, -4.233],
    "casablanca": [33.5731, -7.5898],
    "rabat": [34.0209, -6.8416],
    "ouzoud": [32.015, -6.72],
    "al haouz": [31.3, -7.9],
    "morocco": [31.6295, -7.9811],
    "marrakesh": [31.6295, -7.9811],
    "targa": [31.652, -8.047],
    "golf royal": [31.601, -7.93],
    "route du golf": [31.601, -7.93],
    "barrage": [31.42, -8.08],
    "a\xE9roport": [31.605, -8.036],
    "aeroport": [31.605, -8.036],
    "amizmiz": [31.22, -8.24],
    "route d'amizmiz": [31.4, -8.1]
  };
  const MARRAKECH = { name: "Marrakech", lat: 31.6295, lng: -7.9811 };
  function resolveStops(route, single) {
    if (!route) return [];
    const frags = String(route).split(/→|->|—|·|>|\//).map((x) => x.trim()).filter(Boolean);
    const out = [];
    frags.forEach((fr) => {
      const low = fr.toLowerCase();
      let best = null, key = null;
      for (const k in MS_GEO) {
        if (low.indexOf(k) > -1 && (!key || k.length > key.length)) {
          key = k;
          best = MS_GEO[k];
        }
      }
      if (best) {
        const last = out[out.length - 1];
        if (!last || last.lat !== best[0] || last.lng !== best[1]) out.push({ name: fr, lat: best[0], lng: best[1] });
      }
    });
    return single ? out.slice(0, 1) : out;
  }
  function loadStyleTag(href, id) {
    return new Promise((resolve, reject) => {
      const existing = id ? document.getElementById(id) : null;
      if (existing) {
        resolve();
        return;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      if (id) link.id = id;
      link.crossOrigin = "anonymous";
      link.addEventListener("load", () => resolve(), { once: true });
      link.addEventListener("error", () => reject(new Error("Failed to load " + href)), { once: true });
      document.head.appendChild(link);
    });
  }
  function loadScriptTag(src) {
    return new Promise((resolve, reject) => {
      const abs = new URL(src, window.location.href).toString();
      const existing = Array.from(document.scripts).find((script2) => script2.src === abs);
      if (existing) {
        if (existing.dataset.msLoaded === "1") {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load " + src)), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.addEventListener("load", () => {
        script.dataset.msLoaded = "1";
        resolve();
      }, { once: true });
      script.addEventListener("error", () => reject(new Error("Failed to load " + src)), { once: true });
      document.head.appendChild(script);
    });
  }
  async function ensureLeaflet() {
    if (window.L) return window.L;
    if (!window.__msLeafletPromise) {
      window.__msLeafletPromise = (async () => {
        try {
          await loadStyleTag("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "ms-leaflet-css");
        } catch (_error) {
          await loadStyleTag("https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css", "ms-leaflet-css");
        }
        const sources = [
          "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
          "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"
        ];
        for (const src of sources) {
          try {
            await loadScriptTag(src);
            if (window.L) return window.L;
          } catch (_error) {
          }
        }
        return null;
      })();
    }
    return window.__msLeafletPromise;
  }
  function StopMap({ stops }) {
    const ref = useRef(null);
    useEffect(() => {
      let map = null;
      let cancelled = false;
      (async () => {
        const Leaflet = await ensureLeaflet();
        if (cancelled || !Leaflet || !ref.current || !stops.length) return;
        map = Leaflet.map(ref.current, { scrollWheelZoom: false, zoomControl: true });
        Leaflet.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
          subdomains: "abcd",
          attribution: "\xA9 OpenStreetMap, \xA9 CARTO"
        }).addTo(map);
        const pts = stops.map((s) => [s.lat, s.lng]);
        stops.forEach((s, i) => {
          const single = stops.length === 1;
          const isStart = i === 0, isEnd = i === stops.length - 1;
          const color = single ? "#ea4335" : isStart ? "#34a853" : isEnd ? "#ea4335" : "#1a73e8";
          const label = single ? "" : String(i + 1);
          const icon = Leaflet.divIcon({
            className: "ms-ld-pinwrap",
            html: '<div class="ms-ld-pin" style="background:' + color + '">' + label + "</div>",
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          Leaflet.marker([s.lat, s.lng], { icon }).addTo(map).bindTooltip((label ? label + ". " : "") + s.name, { direction: "top", offset: [0, -14] });
        });
        let casing, line;
        const drawRoute = (latlngs) => {
          [casing, line].forEach((l) => l && map.removeLayer(l));
          casing = Leaflet.polyline(latlngs, { color: "#ffffff", weight: 9, opacity: 0.95, lineJoin: "round", lineCap: "round" }).addTo(map);
          line = Leaflet.polyline(latlngs, { color: "#1a73e8", weight: 5, opacity: 0.95, lineJoin: "round", lineCap: "round" }).addTo(map);
        };
        if (pts.length > 1) {
          drawRoute(pts);
          const coords = stops.map((s) => s.lng + "," + s.lat).join(";");
          fetch("https://router.project-osrm.org/route/v1/driving/" + coords + "?overview=full&geometries=geojson").then((r) => r.ok ? r.json() : null).then((j) => {
            const g = j && j.routes && j.routes[0] && j.routes[0].geometry;
            if (g && g.coordinates && g.coordinates.length && !cancelled) drawRoute(g.coordinates.map((c) => [c[1], c[0]]));
          }).catch(() => {
          });
          map.fitBounds(pts, { padding: [40, 40] });
        } else {
          map.setView(pts[0], 12);
        }
        setTimeout(() => {
          if (!cancelled && map) map.invalidateSize();
        }, 120);
      })().catch(() => {
      });
      return () => {
        cancelled = true;
        try {
          if (map) map.remove();
        } catch (e) {
        }
      };
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "ms-ld-map", ref });
  }
  function MS_ListingDetail(L) {
    const lang = L.lang || "en";
    const tx = T(lang);
    const loc = locale(lang);
    const images = (L.images || []).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    const [lightbox, setLightbox] = useState(null);
    const [showAllAmen, setShowAllAmen] = useState(false);
    const [descOpen, setDescOpen] = useState(false);
    const [sel, setSel] = useState({ in: null, out: null });
    const [guests, setGuests] = useState(2);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
    const [sent, setSent] = useState(false);
    const bookRef = useRef(null);
    useEffect(() => {
      const k = (e) => {
        if (e.key === "Escape" && lightbox == null) L.onClose();
      };
      document.addEventListener("keydown", k);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", k);
        document.body.style.overflow = "";
      };
    }, [lightbox]);
    useEffect(() => {
      try {
        const w = JSON.parse(localStorage.getItem("ms_wishlist") || "[]");
        setSaved(w.includes(L.id));
      } catch (e) {
      }
    }, []);
    useEffect(() => {
      try {
        const p = JSON.parse(localStorage.getItem("ms_profile_data") || "{}");
        setForm((f) => ({ name: p.name || "", email: p.email || "", phone: p.phone || "" }));
      } catch (e) {
      }
    }, []);
    const share = async () => {
      const url = location.origin + location.pathname + "#" + (L.id || "");
      try {
        if (navigator.share) await navigator.share({ title: L.title, url });
        else {
          await navigator.clipboard.writeText(url);
        }
      } catch (e) {
      }
    };
    const toggleSave = () => {
      try {
        let w = JSON.parse(localStorage.getItem("ms_wishlist") || "[]");
        if (w.includes(L.id)) w = w.filter((x) => x !== L.id);
        else w.push(L.id);
        localStorage.setItem("ms_wishlist", JSON.stringify(w));
        setSaved(w.includes(L.id));
      } catch (e) {
      }
    };
    const amenities = L.amenities || [];
    const amenShown = showAllAmen ? amenities : amenities.slice(0, 8);
    const desc = L.description || "";
    const longDesc = desc.length > 320;
    const reserve = () => {
      if (L.reserveForm) {
        if (!form.name.trim() || !form.email.trim()) {
          bookRef.current && bookRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        L.onReserve && L.onReserve({ sel, guests, ...form });
        setSent(true);
      } else {
        L.onReserve && L.onReserve({ sel, guests });
      }
    };
    const bookingCard = /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book", ref: bookRef }, L.banner && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-pill" }, L.banner), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-price" }, /* @__PURE__ */ React.createElement("span", { className: "ms-ld-book-amt" }, L.price && L.price.from), L.price && L.price.per && /* @__PURE__ */ React.createElement("span", { className: "ms-ld-book-per" }, L.price.per)), sent ? /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-sent" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-sent-ic" }, "\u2713"), /* @__PURE__ */ React.createElement("strong", null, tx("Request sent", "Foresp\xF8rsel sendt", "Demande envoy\xE9e")), /* @__PURE__ */ React.createElement("span", null, tx("We\u2019ll reply by email shortly.", "Vi svarer p\xE5 e-post snart.", "Nous r\xE9pondrons par e-mail sous peu."))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-fields" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-dates" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-cell" }, /* @__PURE__ */ React.createElement("span", null, tx("Check-in", "Innsjekk", "Arriv\xE9e")), /* @__PURE__ */ React.createElement("b", null, sel.in ? fmtDate(sel.in, loc) : tx("Add date", "Legg til dato", "Ajouter une date"))), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-cell" }, /* @__PURE__ */ React.createElement("span", null, tx("Check-out", "Utsjekk", "D\xE9part")), /* @__PURE__ */ React.createElement("b", null, sel.out ? fmtDate(sel.out, loc) : tx("Add date", "Legg til dato", "Ajouter une date")))), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-guests" }, /* @__PURE__ */ React.createElement("span", null, tx("Guests", "Gjester", "Voyageurs")), /* @__PURE__ */ React.createElement("select", { value: guests, onChange: (e) => setGuests(+e.target.value) }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => /* @__PURE__ */ React.createElement("option", { key: n, value: n }, n, " ", n === 1 ? tx("guest", "gjest", "voyageur") : tx("guests", "gjester", "voyageurs"))))), L.reserveForm && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-contact" }, /* @__PURE__ */ React.createElement("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: tx("Full name", "Fullt navn", "Nom complet"), autoComplete: "name" }), /* @__PURE__ */ React.createElement("input", { value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), placeholder: tx("Email", "E-post", "E-mail"), type: "email", autoComplete: "email" }), /* @__PURE__ */ React.createElement("input", { value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }), placeholder: tx("Phone (optional)", "Telefon (valgfritt)", "T\xE9l\xE9phone (optionnel)"), autoComplete: "tel" }), /* @__PURE__ */ React.createElement("textarea", { value: form.notes, onChange: (e) => setForm({ ...form, notes: e.target.value }), placeholder: tx("Anything we should know? (optional)", "Noe vi b\xF8r vite? (valgfritt)", "Quelque chose \xE0 signaler ? (optionnel)"), rows: "2" }))), /* @__PURE__ */ React.createElement("button", { className: "ms-ld-book-cta", type: "button", onClick: reserve }, L.reserveLabel || tx("Reserve", "Reserver", "R\xE9server")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-book-note" }, tx("You won\u2019t be charged yet", "Du belastes ikke enn\xE5", "Vous ne serez pas d\xE9bit\xE9")), L.onTweak && /* @__PURE__ */ React.createElement("button", { className: "ms-ld-book-2nd", type: "button", onClick: L.onTweak }, L.tweakLabel || tx("Customise this trip", "Tilpass denne reisen", "Personnaliser"))));
    return /* @__PURE__ */ React.createElement("div", { className: "ms-ld-backdrop", onClick: L.onClose }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-card", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-topbar" }, /* @__PURE__ */ React.createElement("button", { className: "ms-ld-close", type: "button", onClick: L.onClose, "aria-label": "Close" }, "\u2715"), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-actions" }, /* @__PURE__ */ React.createElement("button", { className: "ms-ld-iconbtn", type: "button", onClick: share }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u2197"), " ", tx("Share", "Del", "Partager")), /* @__PURE__ */ React.createElement("button", { className: "ms-ld-iconbtn" + (saved ? " on" : ""), type: "button", onClick: toggleSave }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, saved ? "\u2665" : "\u2661"), " ", tx("Save", "Lagre", "Enregistrer")))), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-scroll" }, /* @__PURE__ */ React.createElement("h1", { className: "ms-ld-title" }, L.title), /* @__PURE__ */ React.createElement(Mosaic, { images, alt: L.title, tx, onShowAll: (i) => setLightbox(i) }), /* @__PURE__ */ React.createElement(MobileCarousel, { images, alt: L.title }), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-grid" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-main" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-headblock" }, L.subtitle && /* @__PURE__ */ React.createElement("h2", { className: "ms-ld-h2" }, L.subtitle), L.metaDots && L.metaDots.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-dots" }, L.metaDots.map((m, i) => /* @__PURE__ */ React.createElement("span", { key: i }, m)))), L.trust && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-badgecard" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-badgecard-ico", "aria-hidden": "true" }, "\u2726"), /* @__PURE__ */ React.createElement("div", null, L.badge && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-badgecard-label" }, L.badge), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-badgecard-sub" }, L.trust))), L.highlights && L.highlights.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, L.highlightsTitle && /* @__PURE__ */ React.createElement("h3", { className: "ms-ld-h3" }, L.highlightsTitle), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-hl-list" }, L.highlights.map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "ms-ld-hl" }, /* @__PURE__ */ React.createElement("span", { className: "ms-ld-hl-ico", "aria-hidden": "true" }, "\u203A"), /* @__PURE__ */ React.createElement("span", null, h))))), desc && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, /* @__PURE__ */ React.createElement("p", { className: "ms-ld-desc" + (longDesc && !descOpen ? " clamp" : "") }, desc), longDesc && /* @__PURE__ */ React.createElement("button", { className: "ms-ld-link", type: "button", onClick: () => setDescOpen((o) => !o) }, descOpen ? tx("Show less", "Vis mindre", "R\xE9duire") : tx("Show more", "Vis mer", "Voir plus"), " \u203A")), amenities.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, /* @__PURE__ */ React.createElement("h3", { className: "ms-ld-h3" }, L.amenitiesTitle || tx("What\u2019s included", "Dette er inkludert", "Ce qui est inclus")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-amen-grid" }, amenShown.map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "ms-ld-amen" }, /* @__PURE__ */ React.createElement("span", { className: "ms-ld-amen-ico", "aria-hidden": "true" }, "\u2713"), /* @__PURE__ */ React.createElement("span", null, a)))), amenities.length > 8 && /* @__PURE__ */ React.createElement("button", { className: "ms-ld-outline", type: "button", onClick: () => setShowAllAmen((o) => !o) }, showAllAmen ? tx("Show less", "Vis mindre", "R\xE9duire") : tx("Show all " + amenities.length, "Vis alle " + amenities.length, "Tout afficher (" + amenities.length + ")")), L.excluded && L.excluded.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-notinc" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-notinc-h" }, tx("Not included", "Ikke inkludert", "Non inclus")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-amen-grid" }, L.excluded.map((x, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "ms-ld-amen ms-ld-amen-no" }, /* @__PURE__ */ React.createElement("span", { className: "ms-ld-amen-ico", "aria-hidden": "true" }, "\u2014"), /* @__PURE__ */ React.createElement("span", null, x)))))), L.passes && (L.passes.day || L.passes.evening || L.passes.spa) && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, /* @__PURE__ */ React.createElement("h3", { className: "ms-ld-h3" }, tx("Passes & offers", "Pass & tilbud", "Pass & offres")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-passes" }, L.passes.day && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-pass" }, /* @__PURE__ */ React.createElement("span", { className: "ms-ld-pass-tag" }, "\u2600\uFE0F ", tx("Day pass", "Dagpass", "Pass journ\xE9e")), /* @__PURE__ */ React.createElement("span", { className: "ms-ld-pass-txt" }, L.passes.day)), L.passes.evening && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-pass" }, /* @__PURE__ */ React.createElement("span", { className: "ms-ld-pass-tag" }, "\u{1F319} ", tx("Evening pass", "Kveldspass", "Pass soir\xE9e")), /* @__PURE__ */ React.createElement("span", { className: "ms-ld-pass-txt" }, L.passes.evening)), L.passes.spa && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-pass" }, /* @__PURE__ */ React.createElement("span", { className: "ms-ld-pass-tag" }, "\u{1F486} ", tx("Spa & wellness", "Spa & velv\xE6re", "Spa & bien-\xEAtre")), /* @__PURE__ */ React.createElement("span", { className: "ms-ld-pass-txt" }, L.passes.spa)))), L.rooms && L.rooms.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, /* @__PURE__ */ React.createElement("h3", { className: "ms-ld-h3" }, tx("Rooms & tents", "Rom & telt", "Chambres & tentes"), " ", /* @__PURE__ */ React.createElement("span", { className: "ms-ld-rooms-n" }, "(", L.rooms.length, ")")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-rooms" }, L.rooms.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "ms-ld-room" }, r.img && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "ms-ld-room-img",
        style: { backgroundImage: `url(${r.img})` },
        "aria-label": r.name,
        onClick: () => {
          const k = images.indexOf(r.img);
          if (k >= 0) setLightbox(k);
        }
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-room-info" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-room-name" }, r.name), r.desc && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-room-desc" }, r.desc), r.price && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-room-price" }, r.price))))), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-rooms-note" }, tx("Room rates are indicative and vary by season \u2014 we confirm the exact price for your dates.", "Romprisene er veiledende og varierer med sesong \u2014 vi bekrefter n\xF8yaktig pris for dine datoer.", "Tarifs indicatifs selon la saison \u2014 nous confirmons le prix exact pour vos dates."))), L.timeline && L.timeline.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, /* @__PURE__ */ React.createElement("h3", { className: "ms-ld-h3" }, tx("Day by day", "Dag for dag", "Jour par jour")), /* @__PURE__ */ React.createElement("ol", { className: "itin-timeline-list ms-ld-timeline" }, L.timeline.map((d, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: "itin-timeline-item" }, /* @__PURE__ */ React.createElement("div", { className: "itin-timeline-marker" }, /* @__PURE__ */ React.createElement("span", { className: "itin-tl-badge", "aria-hidden": "true" }, d.day)), /* @__PURE__ */ React.createElement("div", { className: "itin-timeline-card" }, /* @__PURE__ */ React.createElement("div", { className: "itin-timeline-route" }, d.route), /* @__PURE__ */ React.createElement("div", { className: "itin-tl-rows" }, d.rows.map((r, ri) => /* @__PURE__ */ React.createElement("div", { key: ri, className: "itin-tl-row" }, /* @__PURE__ */ React.createElement("span", { className: "itin-tl-time" + (r.t ? "" : " itin-tl-time-none") }, r.t || "\u2022"), /* @__PURE__ */ React.createElement("span", { className: "itin-tl-act" }, r.a))))))))), L.related && L.related.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, /* @__PURE__ */ React.createElement("h3", { className: "ms-ld-h3" }, tx("Experiences in this trip", "Opplevelser i denne reisen", "Exp\xE9riences de ce voyage")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-avail-sub" }, tx("Tap an experience to see its photos, details & prices from our catalogue.", "Trykk p\xE5 en opplevelse for bilder, detaljer og priser fra katalogen.", "Touchez une exp\xE9rience pour voir ses photos, d\xE9tails & prix dans notre catalogue.")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-related" }, L.related.map((r, i) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: i,
        type: "button",
        className: "ms-ld-htag",
        onClick: () => {
          L.onClose();
          setTimeout(() => window.dispatchEvent(new CustomEvent("ms:open-catalog", { detail: { tab: r.tab, name: r.name } })), 90);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "ms-ld-htag-hash", "aria-hidden": "true" }, "#"),
      r.label
    )))), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, /* @__PURE__ */ React.createElement("h3", { className: "ms-ld-h3" }, tx("Availability", "Tilgjengelighet", "Disponibilit\xE9s")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-avail-sub" }, sel.in && sel.out ? fmtDate(sel.in, loc) + " \u2013 " + fmtDate(sel.out, loc) : tx("Choose your dates \u2014 we tailor every departure", "Velg dine datoer \u2014 vi skreddersyr hver avreise", "Choisissez vos dates \u2014 chaque d\xE9part est sur mesure")), /* @__PURE__ */ React.createElement(Calendar, { lang, sel, setSel })), (() => {
      let stops;
      if (L.mapRoute) {
        stops = resolveStops(L.mapRoute);
      } else if (L.mapPlace || L.mapName) {
        stops = resolveStops(L.mapPlace, true);
        if (!stops.length && L.mapName) stops = resolveStops(L.mapName, true);
        if (!stops.length) stops = [{ ...MARRAKECH }];
      } else {
        stops = [];
      }
      if (!window.L || stops.length === 0) return null;
      return /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, /* @__PURE__ */ React.createElement("h3", { className: "ms-ld-h3" }, stops.length > 1 ? tx("Your route", "Din rute", "Votre itin\xE9raire") : tx("Where you\u2019ll be", "Hvor du skal", "O\xF9 vous serez")), L.locationLabel && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-avail-sub" }, L.locationLabel), /* @__PURE__ */ React.createElement(StopMap, { stops }), stops.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-maplegend" }, stops.map((s, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "ms-ld-maplegend-item" }, /* @__PURE__ */ React.createElement("b", null, i + 1), " ", s.name))));
    })(), L.thingsToKnow && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-sec ms-ld-divtop" }, /* @__PURE__ */ React.createElement("h3", { className: "ms-ld-h3" }, tx("Things to know", "Verdt \xE5 vite", "Bon \xE0 savoir")), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-ttk" }, ["cancellation", "rules", "safety"].map((k) => L.thingsToKnow[k] && /* @__PURE__ */ React.createElement("div", { key: k, className: "ms-ld-ttk-col" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-ttk-h" }, L.thingsToKnow[k].title), /* @__PURE__ */ React.createElement("ul", null, L.thingsToKnow[k].items.map((it, i) => /* @__PURE__ */ React.createElement("li", { key: i }, it))), L.thingsToKnow[k].more && /* @__PURE__ */ React.createElement("button", { className: "ms-ld-link", type: "button", onClick: L.thingsToKnow[k].more }, tx("Learn more", "Les mer", "En savoir plus"), " \u203A"))))), L.breadcrumb && /* @__PURE__ */ React.createElement("div", { className: "ms-ld-crumb" }, L.breadcrumb.join("  \u203A  "))), /* @__PURE__ */ React.createElement("aside", { className: "ms-ld-aside" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-aside-sticky" }, bookingCard, /* @__PURE__ */ React.createElement("button", { className: "ms-ld-report", type: "button", onClick: () => {
      window.open("https://wa.me/4745774743", "_blank", "noopener");
    } }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u2691"), " ", tx("Report this listing", "Rapporter denne oppf\xF8ringen", "Signaler cette annonce")))))), /* @__PURE__ */ React.createElement("div", { className: "ms-ld-mbar" }, /* @__PURE__ */ React.createElement("div", { className: "ms-ld-mbar-price" }, /* @__PURE__ */ React.createElement("b", null, L.price && L.price.from), " ", L.price && L.price.per && /* @__PURE__ */ React.createElement("span", null, L.price.per)), /* @__PURE__ */ React.createElement("button", { className: "ms-ld-mbar-cta", type: "button", onClick: () => {
      if (L.reserveForm) bookRef.current && bookRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      else reserve();
    } }, L.reserveLabel || tx("Reserve", "Reserver", "R\xE9server"))), lightbox != null && /* @__PURE__ */ React.createElement(Lightbox, { images, alt: L.title, start: lightbox, onClose: () => setLightbox(null) })));
  }
  window.MS_ListingDetail = MS_ListingDetail;
})();
