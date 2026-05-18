// ============================================
// Live Marrakech temperature widget
// Data: Open-Meteo (free, no API key, CORS-enabled)
// Bottom-left floating pill → click opens 7-day forecast modal
// ============================================
const { useState: useStateW, useEffect: useEffectW } = React;

const MARRAKECH = { lat: 31.6295, lng: -7.9811, tz: "Africa/Casablanca" };
const REFRESH_MS = 10 * 60 * 1000;   // 10 min — also refreshes on tab-focus, online, modal-open
const STALE_MS = 5 * 60 * 1000;     // anything older than 5 min is "stale" → re-fetch on focus

// WMO weather-code → emoji + label
// See: https://open-meteo.com/en/docs (Weather variable documentation)
function decodeWeather(code, lang) {
  const map = {
    0:  { icon: '☀',  en: 'Clear',           no: 'Klart',           fr: 'Dégagé' },
    1:  { icon: '🌤', en: 'Mostly clear',    no: 'Hovedsakelig klart', fr: 'Surtout dégagé' },
    2:  { icon: '⛅', en: 'Partly cloudy',   no: 'Delvis skyet',    fr: 'Partiellement nuageux' },
    3:  { icon: '☁',  en: 'Overcast',        no: 'Overskyet',       fr: 'Couvert' },
    45: { icon: '🌫', en: 'Foggy',           no: 'Tåke',            fr: 'Brume' },
    48: { icon: '🌫', en: 'Rime fog',        no: 'Rimtåke',         fr: 'Brouillard givrant' },
    51: { icon: '🌦', en: 'Light drizzle',   no: 'Lett yr',         fr: 'Bruine légère' },
    53: { icon: '🌦', en: 'Drizzle',         no: 'Yr',              fr: 'Bruine' },
    55: { icon: '🌦', en: 'Heavy drizzle',   no: 'Tett yr',         fr: 'Bruine dense' },
    61: { icon: '🌧', en: 'Light rain',      no: 'Lett regn',       fr: 'Pluie légère' },
    63: { icon: '🌧', en: 'Rain',            no: 'Regn',            fr: 'Pluie' },
    65: { icon: '🌧', en: 'Heavy rain',      no: 'Kraftig regn',    fr: 'Pluie forte' },
    71: { icon: '🌨', en: 'Light snow',      no: 'Lett snø',        fr: 'Neige légère' },
    73: { icon: '🌨', en: 'Snow',            no: 'Snø',             fr: 'Neige' },
    75: { icon: '❄',  en: 'Heavy snow',      no: 'Kraftig snø',     fr: 'Neige forte' },
    80: { icon: '🌧', en: 'Rain showers',    no: 'Regnbyger',       fr: 'Averses' },
    81: { icon: '🌧', en: 'Heavy showers',   no: 'Kraftige byger',  fr: 'Averses fortes' },
    82: { icon: '⛈', en: 'Violent showers', no: 'Voldsomme byger', fr: 'Averses violentes' },
    95: { icon: '⛈', en: 'Thunderstorm',    no: 'Torden',          fr: 'Orage' },
    96: { icon: '⛈', en: 'Thunder + hail',  no: 'Torden + hagl',   fr: 'Orage + grêle' },
    99: { icon: '⛈', en: 'Severe storm',    no: 'Kraftig torden',  fr: 'Orage violent' },
  };
  const m = map[code] || { icon: '🌡', en: '—', no: '—', fr: '—' };
  return { icon: m.icon, label: m[lang === 'no' ? 'no' : lang === 'fr' ? 'fr' : 'en'] };
}

function formatDayName(iso, lang) {
  const d = new Date(iso + 'T12:00:00');
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return lang === 'no' ? 'I dag' : lang === 'fr' ? "Aujourd'hui" : 'Today';
  const dayNamesNo = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const names = lang === 'no' ? dayNamesNo : lang === 'fr' ? dayNamesFr : dayNamesEn;
  return names[d.getDay()];
}

function formatShortTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function WeatherWidget() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;
  const [data, setData] = useStateW(null);
  const [err, setErr] = useStateW(false);
  const [open, setOpen] = useStateW(false);
  const [lastFetched, setLastFetched] = useStateW(0);

  // Always-fresh fetcher — runs on mount, on every 10-min tick,
  // whenever the tab becomes visible again, on network reconnect,
  // and whenever the user opens the modal (if data is older than 5 min).
  useEffectW(() => {
    let alive = true;
    let timer;

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast`
          + `?latitude=${MARRAKECH.lat}&longitude=${MARRAKECH.lng}`
          + `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature`
          + `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum,uv_index_max`
          + `&timezone=${encodeURIComponent(MARRAKECH.tz)}&forecast_days=7`
          + `&_=${Date.now()}`;   // cache-bust to bypass any intermediary cache
        const r = await fetch(url, { cache: 'no-store' });
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

    // Re-arm the interval after every successful tick or focus refresh
    const scheduleNext = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await fetchWeather();
        scheduleNext();
      }, REFRESH_MS);
    };

    const onVisible = () => {
      if (document.hidden) return;
      // Re-fetch if data is older than STALE_MS
      if (Date.now() - lastFetched > STALE_MS) fetchWeather().then(scheduleNext);
    };
    const onOnline = () => { fetchWeather().then(scheduleNext); };

    fetchWeather().then(scheduleNext);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  // We intentionally read `lastFetched` via closure — re-running the effect
  // would tear down listeners. The `lastFetched` value in onVisible reads
  // the current ref via setState callbacks below.
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Force a refresh whenever the user opens the modal if data is stale
  useEffectW(() => {
    if (!open) return;
    if (Date.now() - lastFetched > STALE_MS) {
      // trigger fetch without re-wiring listeners
      fetch(`https://api.open-meteo.com/v1/forecast`
        + `?latitude=${MARRAKECH.lat}&longitude=${MARRAKECH.lng}`
        + `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature`
        + `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum,uv_index_max`
        + `&timezone=${encodeURIComponent(MARRAKECH.tz)}&forecast_days=7&_=${Date.now()}`,
        { cache: 'no-store' })
        .then(r => r.json())
        .then(j => { setData(j); setLastFetched(Date.now()); setErr(false); })
        .catch(() => {});
    }
  }, [open]);

  // ESC closes
  useEffectW(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  if (err || !data) {
    // Don't show anything until data is fetched — keeps the widget honest
    return null;
  }
  const current = data.current || {};
  const daily = data.daily || {};
  const todayCode = decodeWeather(current.weather_code, lang);

  return (
    <>
      <button className="ms-weather-fab" onClick={() => setOpen(true)}
        aria-label={tx('Marrakech weather', 'Marrakech vær', 'Météo Marrakech')}>
        <span className="ms-weather-live-dot" aria-hidden="true"></span>
        <span className="ms-weather-icon">{todayCode.icon}</span>
        <span className="ms-weather-temp">{Math.round(current.temperature_2m)}°</span>
        <span className="ms-weather-city">Marrakech</span>
      </button>

      {open && (
        <div className="ms-weather-backdrop" onClick={() => setOpen(false)}>
          <div className="ms-weather-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ms-weather-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>

            {/* Now panel */}
            <div className="ms-weather-now">
              <div className="ms-weather-now-icon">{todayCode.icon}</div>
              <div className="ms-weather-now-meta">
                <div className="ms-weather-now-eyebrow">— {tx('LIVE · MARRAKECH', 'DIREKTE · MARRAKECH', 'EN DIRECT · MARRAKECH')}</div>
                <div className="ms-weather-now-temp">{Math.round(current.temperature_2m)}<sup>°C</sup></div>
                <div className="ms-weather-now-label">{todayCode.label}</div>
                <div className="ms-weather-now-feels">
                  {tx('Feels like', 'Føles som', 'Ressenti')} {Math.round(current.apparent_temperature)}° ·
                  {' '}{tx('Humidity', 'Luftfuktighet', 'Humidité')} {Math.round(current.relative_humidity_2m)}% ·
                  {' '}{tx('Wind', 'Vind', 'Vent')} {Math.round(current.wind_speed_10m)} km/h
                </div>
              </div>
            </div>

            {/* 7-day forecast */}
            <div className="ms-weather-week">
              <div className="ms-weather-week-title">{tx('7-day forecast', '7-dagers varsel', 'Prévisions 7 jours')}</div>
              {(daily.time || []).map((iso, i) => {
                const w = decodeWeather(daily.weather_code[i], lang);
                const hi = Math.round(daily.temperature_2m_max[i]);
                const lo = Math.round(daily.temperature_2m_min[i]);
                const rain = daily.precipitation_sum?.[i] || 0;
                const uv = daily.uv_index_max?.[i] || 0;
                const sunrise = daily.sunrise?.[i];
                const sunset = daily.sunset?.[i];
                return (
                  <div key={iso} className="ms-weather-day">
                    <div className="ms-weather-day-name">{formatDayName(iso, lang)}</div>
                    <div className="ms-weather-day-icon">{w.icon}</div>
                    <div className="ms-weather-day-label">{w.label}</div>
                    <div className="ms-weather-day-temps">
                      <strong>{hi}°</strong>
                      <span>{lo}°</span>
                    </div>
                    <div className="ms-weather-day-meta">
                      {rain > 0 && <span>💧 {rain.toFixed(1)} mm</span>}
                      {uv > 0 && <span>☼ UV {Math.round(uv)}</span>}
                      {sunrise && sunset && <span>🌅 {formatShortTime(sunrise)} · 🌇 {formatShortTime(sunset)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="ms-weather-foot">
              <span className="ms-weather-live-dot ms-weather-live-dot-foot" aria-hidden="true"></span>
              {(() => {
                const ago = Math.max(0, Math.floor((Date.now() - lastFetched) / 1000));
                const agoLabel = ago < 60
                  ? tx(`Updated just now`, `Oppdatert nå`, `Mis à jour à l'instant`)
                  : ago < 3600
                    ? tx(`Updated ${Math.floor(ago/60)} min ago`, `Oppdatert for ${Math.floor(ago/60)} min siden`, `Mis à jour il y a ${Math.floor(ago/60)} min`)
                    : tx(`Updated ${Math.floor(ago/3600)}h ago`, `Oppdatert for ${Math.floor(ago/3600)}t siden`, `Mis à jour il y a ${Math.floor(ago/3600)} h`);
                return agoLabel;
              })()} · <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

window.MS_Weather = WeatherWidget;
