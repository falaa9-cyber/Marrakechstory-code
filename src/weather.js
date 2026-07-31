const { useState: useStateW, useEffect: useEffectW } = React;
const MARRAKECH = { lat: 31.6295, lng: -7.9811, tz: "Africa/Casablanca" };
const REFRESH_MS = 10 * 60 * 1e3;
const STALE_MS = 5 * 60 * 1e3;
function decodeWeather(code, lang) {
  const map = {
    0: { icon: "\u2600", en: "Clear", no: "Klart", fr: "D\xE9gag\xE9" },
    1: { icon: "\u{1F324}", en: "Mostly clear", no: "Hovedsakelig klart", fr: "Surtout d\xE9gag\xE9" },
    2: { icon: "\u26C5", en: "Partly cloudy", no: "Delvis skyet", fr: "Partiellement nuageux" },
    3: { icon: "\u2601", en: "Overcast", no: "Overskyet", fr: "Couvert" },
    45: { icon: "\u{1F32B}", en: "Foggy", no: "T\xE5ke", fr: "Brume" },
    48: { icon: "\u{1F32B}", en: "Rime fog", no: "Rimt\xE5ke", fr: "Brouillard givrant" },
    51: { icon: "\u{1F326}", en: "Light drizzle", no: "Lett yr", fr: "Bruine l\xE9g\xE8re" },
    53: { icon: "\u{1F326}", en: "Drizzle", no: "Yr", fr: "Bruine" },
    55: { icon: "\u{1F326}", en: "Heavy drizzle", no: "Tett yr", fr: "Bruine dense" },
    61: { icon: "\u{1F327}", en: "Light rain", no: "Lett regn", fr: "Pluie l\xE9g\xE8re" },
    63: { icon: "\u{1F327}", en: "Rain", no: "Regn", fr: "Pluie" },
    65: { icon: "\u{1F327}", en: "Heavy rain", no: "Kraftig regn", fr: "Pluie forte" },
    71: { icon: "\u{1F328}", en: "Light snow", no: "Lett sn\xF8", fr: "Neige l\xE9g\xE8re" },
    73: { icon: "\u{1F328}", en: "Snow", no: "Sn\xF8", fr: "Neige" },
    75: { icon: "\u2744", en: "Heavy snow", no: "Kraftig sn\xF8", fr: "Neige forte" },
    80: { icon: "\u{1F327}", en: "Rain showers", no: "Regnbyger", fr: "Averses" },
    81: { icon: "\u{1F327}", en: "Heavy showers", no: "Kraftige byger", fr: "Averses fortes" },
    82: { icon: "\u26C8", en: "Violent showers", no: "Voldsomme byger", fr: "Averses violentes" },
    95: { icon: "\u26C8", en: "Thunderstorm", no: "Torden", fr: "Orage" },
    96: { icon: "\u26C8", en: "Thunder + hail", no: "Torden + hagl", fr: "Orage + gr\xEAle" },
    99: { icon: "\u26C8", en: "Severe storm", no: "Kraftig torden", fr: "Orage violent" }
  };
  const m = map[code] || { icon: "\u{1F321}", en: "\u2014", no: "\u2014", fr: "\u2014" };
  return { icon: m.icon, label: m[lang === "no" ? "no" : lang === "fr" ? "fr" : "en"] };
}
function formatDayName(iso, lang) {
  const d = /* @__PURE__ */ new Date(iso + "T12:00:00");
  const today = /* @__PURE__ */ new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return lang === "no" ? "I dag" : lang === "fr" ? "Aujourd'hui" : "Today";
  const dayNamesNo = ["S\xF8ndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "L\xF8rdag"];
  const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesFr = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const names = lang === "no" ? dayNamesNo : lang === "fr" ? dayNamesFr : dayNamesEn;
  return names[d.getDay()];
}
function formatShortTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function WeatherWidget() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || "no";
  const tx = (en, no, fr, sv) => lang === "no" ? no : lang === "fr" ? fr : lang === "sv" ? sv || no || en : lang === "da" ? no || en : en;
  const [data, setData] = useStateW(null);
  const [err, setErr] = useStateW(false);
  const [open, setOpen] = useStateW(false);
  const [lastFetched, setLastFetched] = useStateW(0);
  useEffectW(() => {
    let alive = true;
    let timer;
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${MARRAKECH.lat}&longitude=${MARRAKECH.lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum,uv_index_max&timezone=${encodeURIComponent(MARRAKECH.tz)}&forecast_days=7&_=${Date.now()}`;
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(r.status);
        const json = await r.json();
        if (alive) {
          setData(json);
          setLastFetched(Date.now());
          setErr(false);
        }
      } catch (e) {
        if (alive) setErr(true);
      }
    };
    const scheduleNext = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await fetchWeather();
        scheduleNext();
      }, REFRESH_MS);
    };
    const onVisible = () => {
      if (document.hidden) return;
      if (Date.now() - lastFetched > STALE_MS) fetchWeather().then(scheduleNext);
    };
    const onOnline = () => {
      fetchWeather().then(scheduleNext);
    };
    fetchWeather().then(scheduleNext);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, []);
  useEffectW(() => {
    if (!open) return;
    if (Date.now() - lastFetched > STALE_MS) {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${MARRAKECH.lat}&longitude=${MARRAKECH.lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum,uv_index_max&timezone=${encodeURIComponent(MARRAKECH.tz)}&forecast_days=7&_=${Date.now()}`,
        { cache: "no-store" }
      ).then((r) => r.json()).then((j) => {
        setData(j);
        setLastFetched(Date.now());
        setErr(false);
      }).catch(() => {
      });
    }
  }, [open]);
  useEffectW(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  if (err || !data) {
    return null;
  }
  const current = data.current || {};
  const daily = data.daily || {};
  const todayCode = decodeWeather(current.weather_code, lang);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "ms-weather-fab",
      onClick: () => setOpen(true),
      "aria-label": tx("Marrakech weather", "Marrakech v\xE6r", "M\xE9t\xE9o Marrakech")
    },
    /* @__PURE__ */ React.createElement("span", { className: "ms-weather-live-dot", "aria-hidden": "true" }),
    /* @__PURE__ */ React.createElement("span", { className: "ms-weather-icon" }, todayCode.icon),
    /* @__PURE__ */ React.createElement("span", { className: "ms-weather-temp" }, Math.round(current.temperature_2m), "\xB0"),
    /* @__PURE__ */ React.createElement("span", { className: "ms-weather-city" }, "Marrakech")
  ), open && /* @__PURE__ */ React.createElement("div", { className: "ms-weather-backdrop", onClick: () => setOpen(false) }, /* @__PURE__ */ React.createElement("div", { className: "ms-weather-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "ms-weather-close", onClick: () => setOpen(false), "aria-label": "Close" }, "\u2715"), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-now" }, /* @__PURE__ */ React.createElement("div", { className: "ms-weather-now-icon" }, todayCode.icon), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-now-meta" }, /* @__PURE__ */ React.createElement("div", { className: "ms-weather-now-eyebrow" }, "\u2014 ", tx("LIVE \xB7 MARRAKECH", "DIREKTE \xB7 MARRAKECH", "EN DIRECT \xB7 MARRAKECH")), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-now-temp" }, Math.round(current.temperature_2m), /* @__PURE__ */ React.createElement("sup", null, "\xB0C")), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-now-label" }, todayCode.label), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-now-feels" }, tx("Feels like", "F\xF8les som", "Ressenti"), " ", Math.round(current.apparent_temperature), "\xB0 \xB7", " ", tx("Humidity", "Luftfuktighet", "Humidit\xE9"), " ", Math.round(current.relative_humidity_2m), "% \xB7", " ", tx("Wind", "Vind", "Vent"), " ", Math.round(current.wind_speed_10m), " km/h"))), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-week" }, /* @__PURE__ */ React.createElement("div", { className: "ms-weather-week-title" }, tx("7-day forecast", "7-dagers varsel", "Pr\xE9visions 7 jours")), (daily.time || []).map((iso, i) => {
    var _a, _b, _c, _d;
    const w = decodeWeather(daily.weather_code[i], lang);
    const hi = Math.round(daily.temperature_2m_max[i]);
    const lo = Math.round(daily.temperature_2m_min[i]);
    const rain = ((_a = daily.precipitation_sum) == null ? void 0 : _a[i]) || 0;
    const uv = ((_b = daily.uv_index_max) == null ? void 0 : _b[i]) || 0;
    const sunrise = (_c = daily.sunrise) == null ? void 0 : _c[i];
    const sunset = (_d = daily.sunset) == null ? void 0 : _d[i];
    return /* @__PURE__ */ React.createElement("div", { key: iso, className: "ms-weather-day" }, /* @__PURE__ */ React.createElement("div", { className: "ms-weather-day-name" }, formatDayName(iso, lang)), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-day-icon" }, w.icon), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-day-label" }, w.label), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-day-temps" }, /* @__PURE__ */ React.createElement("strong", null, hi, "\xB0"), /* @__PURE__ */ React.createElement("span", null, lo, "\xB0")), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-day-meta" }, rain > 0 && /* @__PURE__ */ React.createElement("span", null, "\u{1F4A7} ", rain.toFixed(1), " mm"), uv > 0 && /* @__PURE__ */ React.createElement("span", null, "\u263C UV ", Math.round(uv)), sunrise && sunset && /* @__PURE__ */ React.createElement("span", null, "\u{1F305} ", formatShortTime(sunrise), " \xB7 \u{1F307} ", formatShortTime(sunset))));
  })), /* @__PURE__ */ React.createElement("div", { className: "ms-weather-foot" }, /* @__PURE__ */ React.createElement("span", { className: "ms-weather-live-dot ms-weather-live-dot-foot", "aria-hidden": "true" }), (() => {
    const ago = Math.max(0, Math.floor((Date.now() - lastFetched) / 1e3));
    const agoLabel = ago < 60 ? tx(`Updated just now`, `Oppdatert n\xE5`, `Mis \xE0 jour \xE0 l'instant`) : ago < 3600 ? tx(`Updated ${Math.floor(ago / 60)} min ago`, `Oppdatert for ${Math.floor(ago / 60)} min siden`, `Mis \xE0 jour il y a ${Math.floor(ago / 60)} min`) : tx(`Updated ${Math.floor(ago / 3600)}h ago`, `Oppdatert for ${Math.floor(ago / 3600)}t siden`, `Mis \xE0 jour il y a ${Math.floor(ago / 3600)} h`);
    return agoLabel;
  })(), " \xB7 ", /* @__PURE__ */ React.createElement("a", { href: "https://open-meteo.com/", target: "_blank", rel: "noopener" }, "Open-Meteo")))));
}
window.MS_Weather = WeatherWidget;
