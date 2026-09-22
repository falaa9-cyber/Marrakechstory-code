// Authenticated admin-only operations view. Data comes from the existing RLS-gated bookings query.
(function () {
  const React = window.React;
  const h = React.createElement;
  const { useCallback, useEffect, useMemo, useRef, useState } = React;
  const ZONE = 'Africa/Casablanca';
  const dayInMorocco = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const timeInMorocco = () => new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  const addDay = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const str = v => String(v == null ? '' : v).trim();
  const dateOnly = v => str(v).slice(0, 10);
  const daysBetween = (from, to) => Math.round((Date.parse(to + 'T12:00:00Z') - Date.parse(from + 'T12:00:00Z')) / 864e5);
  const money = n => (Number(n) || 0).toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';
  const statusLabel = { draft: 'Draft', new: 'New', quotation_sent: 'Quotation Sent', waiting_confirmation: 'Awaiting', confirmed: 'Confirmed', deposit_paid: 'Deposit Paid', fully_paid: 'Fully Paid', ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled' };
  function bookingActivity(b, today) {
    const tomorrow = addDay(today, 1), arrival = dateOnly(b.arrival_date), departure = dateOnly(b.departure_date);
    const dayNote = day => {
      const entry = (Array.isArray(b.daily_itinerary) ? b.daily_itinerary : []).find(x => dateOnly(x.date) === day);
      const first = (entry?.activities || []).find(a => a.type || a.details);
      return entry?.city || first?.type || first?.details || '';
    };
    const withNote = (label, day) => label + (dayNote(day) ? ' · ' + dayNote(day) : '');
    if (arrival === today) return withNote('Arrives today', today);
    if (arrival === tomorrow) return withNote('Arrives tomorrow', tomorrow);
    if (departure === today) return withNote('Departs today', today);
    if (departure === tomorrow) return 'Departs tomorrow';
    if (arrival <= today && today <= departure) return dayNote(today) ? 'Today · ' + dayNote(today) : 'On trip today';
    if (arrival <= tomorrow && tomorrow <= departure) return dayNote(tomorrow) ? 'Tomorrow · ' + dayNote(tomorrow) : 'On trip tomorrow';
    return '';
  }
  const pointMoment = (p, today, clock) => {
    if (p.day < today) return 'past';
    if (p.day > today) return 'future';
    const match = str(p.time).match(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?:\D|$)/);
    if (!match) return 'today';
    const minutes = +match[1] * 60 + +match[2], now = +clock.slice(0, 2) * 60 + +clock.slice(3, 5);
    return minutes < now - 30 ? 'past' : minutes <= now + 30 ? 'now' : 'today';
  };
  const coords = v => { if (v?.latitude == null || v?.latitude === '' || v?.longitude == null || v?.longitude === '') return null; const lat = Number(v.latitude), lng = Number(v.longitude); return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0) ? [lat, lng] : null; };
  const CATS = {
    accommodation: ['Stay', '🏡', '#9a6649'], airport: ['Airport', '✈️', '#375b88'], restaurant: ['Restaurant', '🍽️', '#a44d43'],
    tour: ['Guided tour', '🧭', '#795b91'], activity: ['Activity', '✨', '#5e805e'], camp: ['Agafay camp', '🏕️', '#987638'],
    camel: ['Camel ride', '🐪', '#a47742'], quad: ['Quad / buggy', '🏎️', '#806239'], balloon: ['Balloon', '🎈', '#b55469'],
    pickup: ['Transfer pickup', '🚐', '#377b83'], dropoff: ['Transfer drop-off', '🛬', '#377b83'], supplier: ['Supplier', '🤝', '#696c75'], issue: ['Needs attention', '·', '#6b7280']
  };
  function category(type, details) {
    const named = str(type).toLowerCase();
    if (/airport|flight/.test(named)) return 'airport';
    if (/transfer|transport|driver|pickup/.test(named)) return 'pickup';
    if (/restaurant|dinner|lunch|breakfast/.test(named)) return 'restaurant';
    if (/check-in|check-out|riad|hotel|accommodation/.test(named)) return 'accommodation';
    const t = (named + ' ' + str(details)).toLowerCase();
    if (/airport|flight/.test(t)) return 'airport';
    if (/riad|hotel|accommodation|check-in|check-out|stay/.test(t)) return 'accommodation';
    if (/restaurant|dinner|lunch|breakfast|food/.test(t)) return 'restaurant';
    if (/camel/.test(t)) return 'camel';
    if (/quad|buggy/.test(t)) return 'quad';
    if (/balloon/.test(t)) return 'balloon';
    if (/agafay|camp|desert day pass/.test(t)) return 'camp';
    if (/guide|tour|excursion|atlas|essaouira|merzouga|ourika|sahara/.test(t)) return 'tour';
    if (/transfer|transport|driver|pickup/.test(t)) return 'pickup';
    return 'activity';
  }
  function pointsFor(b) {
    const out = [];
    const base = { booking: b, client: b.client_name || 'Guest', reference: b.reference || '—' };
    const add = (data) => out.push({ ...base, ...data, id: `${b.id || b.reference}:${out.length}` });
    const stay = coords({ latitude: b.accommodation_latitude, longitude: b.accommodation_longitude });
    if (str(b.accommodation_address)) add({ day: b.arrival_date, time: '', title: b.accommodation_name || 'Accommodation', address: b.accommodation_address, category: 'accommodation', coords: stay, supplierId: b.collab_accommodation, instructions: '' });
    (Array.isArray(b.daily_itinerary) ? b.daily_itinerary : []).forEach((day, di) => {
      (Array.isArray(day.activities) ? day.activities : []).forEach((a, ai) => {
        const date = str(day.date).slice(0, 10) || (b.arrival_date ? addDay(str(b.arrival_date).slice(0, 10), di) : '');
        const common = { day: date, dayNumber: day.day || di + 1, time: str(a.time), title: str(a.location_name) || str(a.type) || 'Service', description: str(a.details), category: category(a.type, a.details), supplierId: a.supplier_id || a.collaborator_id || '', driverId: a.driver_id || '', guideId: a.guide_id || '', confirmed: a.confirmed === true, status: a.operational_status || '', instructions: str(a.pickup_instructions || a.dropoff_instructions), sourceIndex: [di, ai] };
        // A transfer is represented by its actual endpoints; a synthetic centre pin is misleading.
        const hasEndpoints = str(a.pickup_address) || str(a.dropoff_address) || coords({ latitude: a.pickup_latitude, longitude: a.pickup_longitude }) || coords({ latitude: a.dropoff_latitude, longitude: a.dropoff_longitude });
        if (!hasEndpoints || (str(a.address) && coords(a))) add({ ...common, address: str(a.address), coords: coords(a), locationRole: 'service', sourceUrl: str(a.location_source_url) });
        if (str(a.pickup_address) || coords({ latitude: a.pickup_latitude, longitude: a.pickup_longitude })) add({ ...common, title: 'Pickup · ' + common.title, address: str(a.pickup_address), coords: coords({ latitude: a.pickup_latitude, longitude: a.pickup_longitude }), category: 'pickup', locationRole: 'pickup' });
        if (str(a.dropoff_address) || coords({ latitude: a.dropoff_latitude, longitude: a.dropoff_longitude })) add({ ...common, title: 'Drop-off · ' + common.title, address: str(a.dropoff_address), coords: coords({ latitude: a.dropoff_latitude, longitude: a.dropoff_longitude }), category: 'dropoff', locationRole: 'dropoff' });
      });
    });
    if (!out.length) add({ day: b.arrival_date || '', time: '', title: 'Itinerary not yet scheduled', address: '', category: 'issue', coords: null, status: 'Needs planning' });
    // Preserve the authored activity sequence within a day; labels like "After dinner" are not sortable timestamps.
    return out.sort((a, b) => str(a.day).localeCompare(str(b.day))).map((p, i) => ({ ...p, sequence: i + 1 }));
  }
  const supplierName = (id, suppliers) => (suppliers || []).find(s => String(s.id) === String(id))?.name || '';
  function issuesFor(points) {
    const issues = [];
    points.forEach(p => {
      const informational = /free|leisure|travel preparation|welcome|farewell/i.test(`${p.title} ${p.description}`);
      const operational = !informational && !['accommodation', 'airport'].includes(p.category);
      if (operational && !p.address && p.locationRole !== 'dropoff') issues.push({ point: p, label: 'Missing operational address', action: 'Add the exact meeting point' });
      else if (operational && p.address && !p.coords) issues.push({ point: p, label: 'Address needs coordinates', action: 'Verify the pin on the map' });
      // Pickup and drop-off share one service assignment; alert once, at pickup.
      if (operational && p.locationRole !== 'dropoff' && ['pickup', 'tour', 'activity', 'camp', 'camel', 'quad', 'balloon'].includes(p.category) && !p.supplierId && !p.driverId && !p.guideId) issues.push({ point: p, label: 'No collaborator assigned', action: 'Assign a driver, guide or supplier' });
      if (operational && !p.confirmed && p.sourceIndex && p.locationRole !== 'dropoff') issues.push({ point: p, label: 'Service not confirmed', action: 'Confirm with the client or supplier' });
    });
    const assigned = points.filter(p => p.sourceIndex && p.day && p.time && (p.driverId || p.guideId || p.supplierId));
    for (let i = 0; i < assigned.length; i++) for (let j = i + 1; j < assigned.length; j++) {
      const a = assigned[i], b = assigned[j];
      if (a.booking.id === b.booking.id || a.day !== b.day || a.time !== b.time) continue;
      if ((a.driverId && a.driverId === b.driverId) || (a.guideId && a.guideId === b.guideId) || (a.supplierId && a.supplierId === b.supplierId)) issues.push({ point: b, label: `Assignment conflict with ${a.reference} at ${b.time}` });
    }
    return issues;
  }
  function mapIcon(kind, label, highlighted, muted) {
    const c = CATS[kind] || CATS.activity;
    return window.L.divIcon({ className: 'mso-icon-wrap' + (highlighted ? ' mso-icon-active' : '') + (muted ? ' mso-icon-muted' : ''), html: `<span class="mso-pin" style="--pin:${c[2]}"><span class="mso-pin-glyph">${c[1]}</span>${label ? `<span class="mso-pin-index">${label}</span>` : ''}</span>`, iconSize: [32, 36], iconAnchor: [16, 32] });
  }
  // Liberty exposes city names as MapLibre symbol layers. Give those labels a
  // clear bold face and a restrained halo so they remain readable over routes
  // and the light map treatment at every zoom level.
  function emphasizeCityLabels(glLayer) {
    if (!glLayer || !glLayer.getMaplibreMap) return;
    const gl = glLayer.getMaplibreMap();
    const apply = () => {
      const layers = gl.getStyle?.()?.layers || [];
      layers.forEach(layer => {
        const id = String(layer.id || '').toLowerCase();
        const sourceLayer = String(layer['source-layer'] || '').toLowerCase();
        const isCityLabel = layer.type === 'symbol' &&
          (sourceLayer === 'place' || /(^|[-_])(city|town|village|municipality|locality)([-_]|$)/.test(id) || id.includes('place-label'));
        if (!isCityLabel) return;
        try {
          gl.setLayoutProperty(layer.id, 'text-font', ['Open Sans Regular']);
          gl.setPaintProperty(layer.id, 'text-halo-color', '#ffffff');
          gl.setPaintProperty(layer.id, 'text-halo-width', 1.4);
          gl.setPaintProperty(layer.id, 'text-halo-blur', 0.15);
        } catch (_) { /* styles can change while a basemap is being replaced */ }
      });
    };
    if (gl.isStyleLoaded?.()) apply();
    else gl.once?.('styledata', apply);
  }
  function MapCanvas({ points, route, selected, hovered, onSelect, onHover, today, clock }) {
    const element = useRef(null), map = useRef(null), layer = useRef(null), line = useRef(null), select = useRef(onSelect), prior = useRef('');
    const hover = useRef(onHover);
    const tiles = useRef(null);
    const [zoom, setZoom] = useState(0), [roadRoute, setRoadRoute] = useState(null), [routeLoading, setRouteLoading] = useState(false), [mapLayer, setMapLayer] = useState('road');
    select.current = onSelect; hover.current = onHover;
    useEffect(() => {
      if (!element.current || !window.L) return;
      const L = window.L;
      const m = L.map(element.current, { scrollWheelZoom: true, zoomAnimation: true, fadeAnimation: true, markerZoomAnimation: true, wheelDebounceTime: 35, wheelPxPerZoomLevel: 90 }).setView([31.6295, -7.9811], 10);
      tiles.current = L.maplibreGL ? L.maplibreGL({ style: 'https://tiles.openfreemap.org/styles/liberty' }).addTo(m) : L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(m);
      emphasizeCityLabels(tiles.current);
      map.current = m; layer.current = L.layerGroup().addTo(m); line.current = L.layerGroup().addTo(m);
      const resize = new ResizeObserver(() => m.invalidateSize()); resize.observe(element.current);
      return () => { resize.disconnect(); m.remove(); map.current = null; };
    }, []);
    useEffect(() => {
      const L = window.L, m = map.current; if (!L || !m) return;
      const satellite = mapLayer === 'satellite';
      const url = satellite ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : mapLayer === 'terrain' ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' : mapLayer === 'night' ? 'https://tiles.openfreemap.org/styles/dark' : mapLayer === 'light' ? 'https://tiles.openfreemap.org/styles/positron' : mapLayer === 'road' ? 'https://tiles.openfreemap.org/styles/liberty' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      if (tiles.current) tiles.current.remove();
      const vector = !satellite && !['terrain'].includes(mapLayer) && !!L.maplibreGL;
      tiles.current = vector ? L.maplibreGL({ style: url }) : L.tileLayer(url, { maxZoom: 17, attribution: satellite ? 'Tiles &copy; Esri' : mapLayer === 'terrain' ? '&copy; OpenTopoMap contributors' : '&copy; OpenStreetMap contributors' });
      tiles.current.addTo(m);
      if (vector) emphasizeCityLabels(tiles.current);
    }, [mapLayer]);
    const roadKey = points.filter(p => p.coords).map(p => p.coords.join(',')).join(';');
    useEffect(() => {
      let cancelled = false;
      const located = points.filter(p => p.coords);
      if (!route || located.length < 2) { setRoadRoute(null); setRouteLoading(false); return undefined; }
      setRoadRoute(null);
      setRouteLoading(true);
      const coordinates = located.map(p => `${p.coords[1]},${p.coords[0]}`).join(';');
      fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`, { headers: { Accept: 'application/json' } })
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Route service unavailable')))
        .then(json => { if (!cancelled && json.code === 'Ok' && json.routes?.[0]?.geometry?.coordinates?.length > 1) setRoadRoute(json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])); })
        .catch(() => { if (!cancelled) setRoadRoute(null); })
        .finally(() => { if (!cancelled) setRouteLoading(false); });
      return () => { cancelled = true; };
    }, [route, roadKey]);
    useEffect(() => {
      const L = window.L, m = map.current; if (!L || !m) return;
      layer.current.clearLayers(); line.current.clearLayers();
      const located = points.filter(p => p.coords);
      if (route && roadRoute?.length > 1) {
        L.polyline(roadRoute, { color: '#ffffff', weight: 9, opacity: .88, lineCap: 'round', lineJoin: 'round' }).addTo(line.current);
        L.polyline(roadRoute, { color: '#3b82f6', weight: 5, opacity: .96, lineCap: 'round', lineJoin: 'round', className: 'mso-route-live' }).addTo(line.current);
      } else if (route && located.length > 1) for (let i = 1; i < located.length; i++) {
        const past = pointMoment(located[i], today || dayInMorocco(), clock || timeInMorocco()) === 'past';
        const emphasized = [selected?.id, hovered?.id].includes(located[i].id) || (i === 1 && [selected?.id, hovered?.id].includes(located[0].id));
        L.polyline([located[i - 1].coords, located[i].coords], { color: emphasized ? '#f25335' : past ? '#9a9a9d' : '#e0432a', weight: emphasized ? 6 : past ? 2 : 4, opacity: emphasized ? 1 : past ? .55 : .9, dashArray: past && !emphasized ? '4 8' : '9 9', className: emphasized || !past ? 'mso-route-live' : 'mso-route-past' }).addTo(line.current);
      }
      // Screen-space grid clustering keeps dense views legible without another runtime dependency.
      const size = m.getZoom() < 12 ? 64 : m.getZoom() < 15 ? 44 : 1;
      const groups = new Map(); located.forEach((p, i) => { const px = m.project(p.coords, m.getZoom()); const key = size === 1 ? String(i) : `${Math.floor(px.x / size)}:${Math.floor(px.y / size)}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(p); });
      const overlap = new Map();
      groups.forEach(group => {
        const p = group[0], clustered = group.length > 1;
        const center = clustered ? [group.reduce((n, x) => n + x.coords[0], 0) / group.length, group.reduce((n, x) => n + x.coords[1], 0) / group.length] : p.coords;
        const same = center.join(','); const index = overlap.get(same) || 0; overlap.set(same, index + 1);
        const display = !clustered && index && m.getZoom() >= 15 ? m.unproject(m.project(center, m.getZoom()).add(L.point(Math.cos(index * 2.4) * 20, Math.sin(index * 2.4) * 20)), m.getZoom()) : center;
        const highlighted = !clustered && (selected?.id === p.id || hovered?.id === p.id);
        const marker = L.marker(display, { icon: mapIcon(clustered ? 'activity' : p.category, clustered ? String(group.length) : (route ? String(p.sequence || located.indexOf(p) + 1) : null), highlighted, !highlighted && route && pointMoment(p, today || dayInMorocco(), clock || timeInMorocco()) === 'past'), keyboard: true, title: clustered ? `${group.length} operational points` : p.title, zIndexOffset: highlighted ? 1000 : 0 }).addTo(layer.current);
        if (clustered) marker.on('click', () => { if (m.getZoom() < 16) m.setView(center, m.getZoom() + 2); else select.current(group[0]); });
        else {
          const tip = document.createElement('div'); tip.className = 'mso-map-tooltip';
          const heading = document.createElement('strong'); heading.textContent = `${CATS[p.category]?.[1] || '📍'}  ${String(p.title || 'Stop').slice(0, 42)}`; tip.appendChild(heading);
          const meta = document.createElement('small'); meta.textContent = [p.client, p.reference].filter(Boolean).join(' · '); tip.appendChild(meta);
          const schedule = document.createElement('span'); schedule.textContent = [p.day ? `Day ${p.dayNumber || ''} · ${p.day}` : '', p.time, CATS[p.category]?.[0]].filter(Boolean).join(' · '); schedule.className = 'mso-map-tooltip-detail'; tip.appendChild(schedule);
          if (p.address) { const address = document.createElement('span'); address.textContent = p.address; address.className = 'mso-map-tooltip-address'; tip.appendChild(address); }
          if (p.status || p.supplierId || p.driverId || p.guideId) { const ops = document.createElement('span'); ops.textContent = [p.status, p.supplierId ? 'Supplier assigned' : '', p.driverId ? 'Driver assigned' : '', p.guideId ? 'Guide assigned' : ''].filter(Boolean).join(' · '); ops.className = 'mso-map-tooltip-ops'; tip.appendChild(ops); }
          marker.bindTooltip(tip, { direction: 'top', offset: [0, -25], opacity: 1, className: 'mso-map-tooltip-shell' });
          marker.on('click', () => select.current(p)); marker.on('mouseover', () => hover.current?.(p)); marker.on('mouseout', () => hover.current?.(null));
          if (highlighted) marker.openTooltip();
        }
      });
      const signature = located.map(p => `${p.id}:${p.coords.join(',')}`).join('|');
      if (signature !== prior.current) {
        prior.current = signature;
        if (located.length) {
          const routeZoom = located.length > 1 ? 11 : 15;
          m.fitBounds(L.latLngBounds(located.map(p => p.coords)).pad(route ? .10 : .14), { maxZoom: route ? routeZoom : 12, animate: false });
        }
        else m.setView([31.6295, -7.9811], 10);
      }
      const recluster = () => { /* zoom triggers the same render through local state below */ setZoom(z => z + 1); };
      m.on('zoomend', recluster); return () => m.off('zoomend', recluster);
    }, [points, route, roadRoute, selected?.id, hovered?.id, today, clock, zoom]);
    useEffect(() => { if (selected?.coords && map.current) map.current.flyTo(selected.coords, Math.max(map.current.getZoom(), 13), { duration: .45 }); }, [selected?.id]);
    const extentKey = points.filter(p => p.coords).map(p => `${p.id}:${p.coords.join(',')}`).join('|');
    useEffect(() => {
      const L = window.L, m = map.current;
      if (!L || !m) return;
      const focus = hovered?.coords ? hovered : selected?.coords ? selected : null;
      if (focus) m.flyTo(focus.coords, Math.max(m.getZoom(), 15), { animate: true, duration: .6 });
      else if (route) {
        const located = points.filter(p => p.coords);
        if (located.length) {
          const routeZoom = located.length > 1 ? 11 : 15;
          m.fitBounds(L.latLngBounds(located.map(p => p.coords)).pad(.10), { maxZoom: routeZoom, animate: true });
        }
      }
    }, [hovered?.id, selected?.id, route, extentKey]);
    return h('div', { className: 'mso-map-wrap' }, h('div', { ref: element, className: 'mso-map', role: 'region', 'aria-label': 'Interactive operations map' }), h('div', { className: 'mso-map-layer-buttons' }, [['light', 'Light'], ['night', 'Night'], ['road', 'Liberty'], ['terrain', 'Terrain'], ['satellite', 'Satellite']].map(([value, label]) => h('button', { key: value, className: mapLayer === value ? 'is-active' : '', onClick: () => setMapLayer(value) }, label))), route && h('span', { className: 'mso-route-badge' }, routeLoading ? '↻ Finding road route…' : roadRoute ? '● Road route · live geometry' : '• Planning connector'));
  }
  function PointDetail({ point, suppliers, onBooking }) {
    if (!point) return h('div', { className: 'mso-empty-detail' }, 'Select a stop or agenda item to see operational details.');
    const rows = [['Day / time', [point.day, point.time].filter(Boolean).join(' · ')], ['Client', point.client], ['Reference', point.reference], ['Service details', point.description], ['Address', point.address || 'Missing'], ['Coordinates', point.coords ? point.coords.map(n => n.toFixed(6)).join(', ') : 'Not set'], ['Status', point.status || (point.confirmed ? 'Confirmed' : 'Unconfirmed')], ['Driver', supplierName(point.driverId, suppliers)], ['Guide', supplierName(point.guideId, suppliers)], ['Collaborator', supplierName(point.supplierId, suppliers)], ['Instructions', point.instructions]];
    return h('div', { className: 'mso-detail' }, h('span', { className: 'mso-eyebrow' }, CATS[point.category]?.[0] || 'Service'), h('h3', null, point.title), rows.filter(x => x[1]).map(([k, v]) => h('div', { className: 'mso-detail-row', key: k }, h('span', null, k), h('strong', null, v))), point.sourceUrl && h('a', { className: 'mso-source', href: point.sourceUrl, target: '_blank', rel: 'noopener noreferrer' }, 'View location source ↗'), onBooking && h('button', { className: 'msa-btn msa-btn-primary', onClick: () => onBooking(point.booking) }, 'Open booking'));
  }
  function ItineraryDays({ points, today, clock, selected, hovered, onSelect, onHover, suppliers }) {
    const groups = new Map();
    points.forEach(p => { const key = p.day || 'Undated'; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(p); });
    const dates = [...groups.keys()].sort((a, b) => {
      const rank = d => d === today ? 0 : d < today ? 1 : 2;
      return rank(a) - rank(b) || (a < today ? b.localeCompare(a) : a.localeCompare(b));
    });
    return h('div', { className: 'mso-days' }, dates.map(date => {
      const dayPoints = groups.get(date);
      const dayIndex = dayPoints[0]?.dayNumber;
      return h('section', { className: 'mso-day-group' + (date < today ? ' is-past' : ''), key: date },
        h('div', { className: 'mso-day-title' }, h('span', null, date === today ? 'Today' : date < today ? 'Earlier' : 'Coming up'), h('strong', null, `Day ${dayIndex || '—'} · ${date}`)),
        dayPoints.map((p, i) => {
          const moment = pointMoment(p, today, clock);
          return h(React.Fragment, { key: p.id },
            h('button', { className: 'mso-itinerary-stop is-' + moment + (selected?.id === p.id || hovered?.id === p.id ? ' is-highlighted' : ''), onClick: () => onSelect(p), onMouseEnter: () => onHover(p), onMouseLeave: () => onHover(null), onFocus: () => onHover(p), onBlur: () => onHover(null) },
              h('span', { className: 'mso-itinerary-dot' }, p.locationRole === 'pickup' ? '↑' : p.locationRole === 'dropoff' ? '↓' : p.sequence || i + 1),
              h('span', { className: 'mso-itinerary-copy' }, h('span', { className: 'mso-itinerary-top' }, h('strong', null, p.title), h('em', null, moment === 'now' ? 'NOW' : moment === 'past' ? 'DONE' : moment === 'today' ? 'TODAY' : 'NEXT')), h('small', null, [p.time, p.address || 'Location to confirm'].filter(Boolean).join(' · ')))),
            selected?.id === p.id && h(PointDetail, { point: p, suppliers }));
        }));
    }));
  }
  function BookingJourney({ booking, suppliers }) {
    const points = useMemo(() => pointsFor(booking), [booking]);
    const [selected, setSelected] = useState(null), [hovered, setHovered] = useState(null);
    const [now, setNow] = useState(() => ({ today: dayInMorocco(), clock: timeInMorocco() }));
    useEffect(() => { const timer = setInterval(() => setNow({ today: dayInMorocco(), clock: timeInMorocco() }), 60000); return () => clearInterval(timer); }, []);
    const issues = issuesFor(points);
    return h('section', { className: 'mso-journey' },
      h('div', { className: 'mso-section-head' }, h('div', null, h('span', { className: 'mso-eyebrow' }, 'Live journey'), h('h4', null, 'Itinerary map')), h('span', { className: 'mso-count' }, points.filter(p => p.coords).length + ' mapped · ' + issues.length + ' alerts')),
      h('div', { className: 'mso-journey-grid' }, h(MapCanvas, { points, route: true, selected, hovered, onSelect: setSelected, onHover: setHovered, today: now.today, clock: now.clock }), h('div', { className: 'mso-journey-side' },
        points.length ? h(ItineraryDays, { points, today: now.today, clock: now.clock, selected, hovered, onSelect: setSelected, onHover: setHovered, suppliers }) : h('p', { className: 'msa-dim' }, 'Add services to the daily itinerary to build this map.'), hovered && hovered.id !== selected?.id && h(PointDetail, { point: hovered, suppliers }))));
  }
  function OperationsCalendar({ bookings, today, onPick }) {
    const firstBookedDay = (bookings || []).map(b => dateOnly(b.arrival_date)).filter(Boolean).sort()[0] || today;
    const [calendarView, setCalendarView] = useState('year');
    const currentMonthDay = `${today.slice(0, 7)}-01`;
    const [calendarAnchor, setCalendarAnchor] = useState(currentMonthDay);
    const calendarScroll = useRef(null);
    useEffect(() => {
      if (calendarView !== 'year' || !calendarScroll.current) return;
      const container = calendarScroll.current;
      const month = container.querySelector('[data-current-month="true"]');
      if (month) container.scrollTop += month.getBoundingClientRect().top - container.getBoundingClientRect().top;
    }, [calendarView, calendarAnchor]);
    const base = new Date(calendarAnchor + 'T12:00:00Z');
    const weekStart = new Date(base);
    weekStart.setUTCDate(base.getUTCDate() - base.getUTCDay());
    const viewButtons = [['month', 'Month'], ['week', 'Week'], ['day', 'Day']];
    // Year mode is the default and is intentionally a vertically scrollable timeline.
    // Keep a broad window around the focused year so history and coming years are both reachable.
    const yearOffsets = Array.from({ length: 120 }, (_, offset) => offset - 60);
    const months = (calendarView === 'year' ? yearOffsets : calendarView === 'month' ? [0] : []).map(offset => new Date(Date.UTC(base.getUTCFullYear(), calendarView === 'year' ? base.getUTCMonth() + offset : base.getUTCMonth() + offset, 1)));
    const bookingDays = new Map();
    (bookings || []).forEach(b => {
      const start = dateOnly(b.arrival_date), end = dateOnly(b.departure_date) || start;
      if (!start) return;
      let cursor = new Date(start + 'T12:00:00Z'), finish = new Date(end + 'T12:00:00Z');
      if (finish < cursor) finish = cursor;
      while (cursor <= finish) {
        const day = cursor.toISOString().slice(0, 10);
        if (!bookingDays.has(day)) bookingDays.set(day, []);
        bookingDays.get(day).push(b);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    });
    const [hoverDay, setHoverDay] = useState(null);
    const dayMatches = day => bookingDays.get(day) || [];
    const dayActivities = day => dayMatches(day).flatMap(b => (Array.isArray(b.daily_itinerary) ? b.daily_itinerary.filter(x => dateOnly(x.date) === day).flatMap(x => Array.isArray(x.activities) ? x.activities : []) : [])).map(a => a.location_name || a.type || a.details).filter(Boolean);
    const renderDay = (day, label, className = '') => {
      const matches = bookingDays.get(day) || [];
      const distance = daysBetween(today, day);
      const urgency = matches.length ? distance < 0 ? ' is-past' : distance === 0 ? ' is-active' : distance <= 2 ? ' is-imminent' : distance <= 7 ? ' is-soon' : ' is-later' : '';
      return h('button', { key: day, className: 'mso-calendar-focus-day ' + className + (day === today ? ' is-today' : '') + (matches.length ? ' has-bookings' : '') + urgency, onClick: () => onPick(day) }, h('span', { className: 'mso-calendar-focus-label' }, label), h('strong', null, new Date(day + 'T12:00:00Z').getUTCDate()), h('small', null, matches.length ? `${matches.length} booking${matches.length > 1 ? 's' : ''}` : 'No bookings'));
    };
    const shiftCalendar = direction => {
      const next = new Date(base);
      if (calendarView === 'year') next.setUTCFullYear(next.getUTCFullYear() + direction);
      else if (calendarView === 'month') next.setUTCMonth(next.getUTCMonth() + direction);
      else if (calendarView === 'week') next.setUTCDate(next.getUTCDate() + direction * 7);
      else next.setUTCDate(next.getUTCDate() + direction);
      setCalendarAnchor(next.toISOString().slice(0, 10));
    };
    const focusView = calendarView === 'week' ? h('div', { className: 'mso-calendar-focus mso-calendar-week-view' }, Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setUTCDate(weekStart.getUTCDate() + i); const key = d.toISOString().slice(0, 10); return renderDay(key, d.toLocaleDateString('en-GB', { weekday: 'short' })); })) : calendarView === 'day' ? h('div', { className: 'mso-calendar-focus mso-calendar-day-view' }, renderDay(calendarAnchor, new Date(calendarAnchor + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))) : null;
    return h('div', { className: 'mso-calendar-strip' },
      h('div', { className: 'mso-calendar-strip-head' }, h('div', null, h('strong', null, base.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })), h('small', { className: 'mso-calendar-selection' }, calendarView === 'year' ? 'Scroll up for previous months · down for upcoming' : `Focused ${calendarAnchor}`)), h('div', { className: 'mso-calendar-actions' }, h('div', { className: 'mso-calendar-nav' }, h('button', { onClick: () => shiftCalendar(-1), 'aria-label': 'Previous period' }, '‹'), h('button', { onClick: () => setCalendarAnchor(currentMonthDay), className: 'mso-calendar-today' }, 'Current month'), h('button', { onClick: () => shiftCalendar(1), 'aria-label': 'Next period' }, '›')), h('div', { className: 'mso-calendar-view-buttons' }, viewButtons.map(([value, label]) => h('button', { key: value, className: calendarView === value ? 'is-active' : '', onClick: () => { setCalendarView(value); } }, label))))),
      h('div', { className: 'mso-calendar-scroll', ref: calendarScroll }, focusView || h('div', { className: 'mso-calendar-months' }, months.map(month => {
        const y = month.getUTCFullYear(), m = month.getUTCMonth(), days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), first = month.getUTCDay();
        const cells = [];
        for (let i = 0; i < first; i++) cells.push(h('span', { key: 'e' + i, className: 'mso-cal-day is-empty' }));
        for (let d = 1; d <= days; d++) {
          const day = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, matches = dayMatches(day), activities = dayActivities(day), departures = matches.filter(b => dateOnly(b.departure_date) === day);
          const tooltip = matches.length ? h('span', { className: 'mso-cal-tooltip' }, matches.map((b, i) => h('span', { key: `${b.id || b.reference}-${i}` }, h('strong', null, b.client_name || 'Booking'), activities.length ? h('small', null, activities.slice(0, 3).join(' · ')) : null, dateOnly(b.departure_date) === day ? h('em', null, 'Departure day') : null))) : null;
          const distance = daysBetween(today, day);
          const urgency = matches.length ? distance < 0 ? ' is-past' : distance === 0 ? ' is-active' : distance <= 2 ? ' is-imminent' : distance <= 7 ? ' is-soon' : ' is-later' : '';
          cells.push(h('button', { key: day, className: 'mso-cal-day' + (day === today ? ' is-today' : '') + (matches.length ? ' has-bookings' : '') + (matches.length > 1 ? ' is-multi' : '') + (departures.length ? ' is-departure' : '') + urgency + (matches.some(b => dateOnly(b.arrival_date) === day) && distance >= 0 && distance <= 2 ? ' is-arrival-soon' : ''), title: matches.map(b => b.client_name || 'Booking').join(', '), onMouseEnter: () => setHoverDay(day), onMouseLeave: () => setHoverDay(null), onClick: () => onPick(day) }, h('span', null, d), matches.length ? h('i', null, matches.length > 3 ? '3+' : matches.length) : null, hoverDay === day ? tooltip : null));
        }
        return h('div', { className: 'mso-calendar-month', key: `${y}-${m}`, 'data-current-month': `${y}-${String(m + 1).padStart(2, '0')}` === calendarAnchor.slice(0, 7) ? 'true' : undefined }, h('strong', null, month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })), h('div', { className: 'mso-cal-weekdays' }, ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => h('span', { key: i }, d))), h('div', { className: 'mso-cal-grid' }, cells));
      }))),
      calendarView === 'year' && h('div', { className: 'mso-calendar-legend' }, h('span', null, h('i', { className: 'is-today' }), 'Today / active'), h('span', null, h('i', { className: 'is-imminent' }), 'Next 2 days'), h('span', null, h('i', { className: 'is-soon' }), 'Next 7 days'), h('span', null, h('i', { className: 'is-later' }), 'Later'), h('span', null, h('i', { className: 'is-past' }), 'Past')));
  }
  function CommunicationDock() {
    const [tab, setTab] = useState('outlook');
    const [mail, setMail] = useState({ status: 'connecting', account: 'marrakechstory@outlook.com', messages: [], folders: [] });
    const [wa, setWa] = useState({ status: 'disconnected', qr: null, messages: [] });
    const [reply, setReply] = useState('');
    const [selected, setSelected] = useState(null);
    const [lastSync, setLastSync] = useState(null);
    const refresh = useCallback(async () => {
      const bridge = window.MS_COMMUNICATIONS_BRIDGE;
      if (!bridge) { setMail(x => ({ ...x, status: 'needs-bridge' })); setWa(x => ({ ...x, status: 'needs-bridge' })); return; }
      try {
        const [outlook, whatsapp] = await Promise.all([
          bridge.getOutlook?.('/api/communications/outlook/inbox?top=20'),
          bridge.getWhatsApp?.('/api/communications/whatsapp/session')
        ]);
        if (outlook) setMail({ account: outlook.account || 'marrakechstory@outlook.com', status: outlook.connected ? 'connected' : 'disconnected', messages: outlook.messages || [], folders: outlook.folders || [] });
        if (whatsapp) setWa({ status: whatsapp.status || 'disconnected', qr: whatsapp.qrDataUrl || null, messages: whatsapp.messages || [] });
        setLastSync(new Date());
      } catch (_) { setMail(x => ({ ...x, status: 'error' })); setWa(x => ({ ...x, status: 'error' })); }
    }, []);
    useEffect(() => { refresh(); const timer = setInterval(refresh, 60000); return () => clearInterval(timer); }, [refresh]);
    const sendReply = async () => {
      if (!reply.trim() || !selected || !window.MS_COMMUNICATIONS_BRIDGE?.postOutlook) return;
      await window.MS_COMMUNICATIONS_BRIDGE.postOutlook('/api/communications/outlook/reply', { messageId: selected.id, body: reply.trim() });
      setReply(''); await refresh();
    };
    const connected = mail.status === 'connected';
    return h('section', { className: 'mso-communications' },
      h('div', { className: 'mso-communications-head' }, h('div', null, h('span', { className: 'mso-eyebrow' }, 'CONNECTED INBOXES'), h('h2', null, 'Communications')), h('button', { className: 'mso-communications-refresh', onClick: refresh }, '↻ Refresh')),
      h('div', { className: 'mso-communications-tabs' }, [['outlook', 'Outlook'], ['whatsapp', 'WhatsApp']].map(([key, label]) => h('button', { key, className: tab === key ? 'is-active' : '', onClick: () => setTab(key) }, label))),
      tab === 'outlook' ? h('div', { className: 'mso-mailbox' },
        h('div', { className: 'mso-mailbox-toolbar' }, h('span', { className: connected ? 'is-connected' : '' }, connected ? '● Connected' : mail.status === 'needs-bridge' ? 'Connect bridge to load mail' : 'Connecting…'), h('small', null, lastSync ? `Synced ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Auto refresh: 1 min')),
        !connected ? h('div', { className: 'mso-comms-empty' }, h('strong', null, 'Outlook secure connection'), h('p', null, mail.status === 'needs-bridge' ? 'The dashboard needs the server-side Microsoft Graph bridge before it can read or send mail.' : 'Connecting securely to Marrakechstory Tours…'), h('a', { href: 'https://outlook.live.com/mail/0/', target: '_blank', rel: 'noopener noreferrer' }, 'Open Outlook ↗')) : h('div', { className: 'mso-mail-layout' },
          h('nav', { className: 'mso-mail-folders' }, ['Inbox', 'Drafts', 'Sent', 'Archive'].map(folder => h('button', { key: folder }, folder))),
          h('div', { className: 'mso-mail-list' }, mail.messages.length ? mail.messages.map(message => h('button', { key: message.id, className: selected?.id === message.id ? 'is-selected' : '', onClick: () => setSelected(message) }, h('strong', null, message.subject || '(no subject)'), h('span', null, message.sender || message.from || 'Unknown sender'), h('small', null, message.preview || message.bodyPreview || ''))) : h('p', { className: 'mso-empty' }, 'No messages returned.')),
          selected && h('div', { className: 'mso-mail-reader' }, h('strong', null, selected.subject), h('small', null, selected.sender || selected.from || ''), h('p', null, selected.bodyPreview || selected.body || ''), h('textarea', { value: reply, onChange: e => setReply(e.target.value), placeholder: 'Write a reply…' }), h('button', { className: 'msa-btn msa-btn-primary', onClick: sendReply, disabled: !reply.trim() }, 'Reply with agent ↗'))
        ))
      : h('div', { className: 'mso-whatsapp' },
          wa.status === 'connected' ? h('div', { className: 'mso-wa-connected' }, h('div', { className: 'mso-mailbox-toolbar' }, h('span', { className: 'is-connected' }, '● WhatsApp connected'), h('small', null, 'Live session')), h('div', { className: 'mso-wa-thread' }, wa.messages.length ? wa.messages.map(message => h('div', { key: message.id, className: 'mso-wa-message' }, h('strong', null, message.name || message.from), h('p', null, message.text))) : h('p', { className: 'mso-empty' }, 'No recent WhatsApp messages.'))) : h('div', { className: 'mso-comms-empty mso-wa-connect' }, h('strong', null, 'Connect WhatsApp'), h('p', null, 'Scan the QR code with WhatsApp → Linked devices. The session stays private to this browser bridge.'), wa.qr ? h('img', { src: wa.qr, alt: 'WhatsApp connection QR code' }) : h('div', { className: 'mso-qr-placeholder' }, 'QR will appear here'), h('a', { href: 'https://web.whatsapp.com/', target: '_blank', rel: 'noopener noreferrer' }, 'Open WhatsApp Web ↗')))
      );
  }
  function OperationsMap({ bookings, suppliers, openBooking, openPlanner, activeProgramId, onCloseProgram, renderProgram, reload, embedded, isAdmin = false }) {
    const [now, setNow] = useState(() => ({ today: dayInMorocco(), clock: timeInMorocco() }));
    const agendaScroll = useRef(null);
    const agendaInitialPositioned = useRef(false);
    useEffect(() => { const timer = setInterval(() => setNow({ today: dayInMorocco(), clock: timeInMorocco() }), 60000); return () => clearInterval(timer); }, []);
    const today = now.today;
    const [range, setRange] = useState(embedded ? 'month' : 'month'), [from, setFrom] = useState(today), [to, setTo] = useState(today);
    const [status, setStatus] = useState(''), [service, setService] = useState(''), [person, setPerson] = useState(''), [destination, setDestination] = useState(''), [supplier, setSupplier] = useState(''), [driver, setDriver] = useState(''), [guide, setGuide] = useState(''), [confirmation, setConfirmation] = useState(''), [payment, setPayment] = useState(''), [flag, setFlag] = useState(''), [archived, setArchived] = useState('active'), [query, setQuery] = useState(''), [selected, setSelected] = useState(null), [hovered, setHovered] = useState(null), [activeBookingId, setActiveBookingId] = useState(null), [hoveredBookingId, setHoveredBookingId] = useState(null);
    const [visualView, setVisualView] = useState({ tab: 'overview', dayNumber: 0, sourceIndex: null });
    useEffect(() => { if (activeProgramId) setActiveBookingId(activeProgramId); }, [activeProgramId]);
    const bounds = range === 'custom' ? [from, to] : [today, addDay(today, range === 'tomorrow' ? 1 : range === 'week' ? 6 : range === 'month' ? 29 : 0)];
    if (range === 'tomorrow') bounds[0] = bounds[1];
    const raw = useMemo(() => bookings.flatMap(pointsFor), [bookings]);
    const [resolvedCoords, setResolvedCoords] = useState({}), [geocodeDone, setGeocodeDone] = useState(false);
    const geocodeCandidates = useMemo(() => raw.filter(p => !p.coords && (p.address || (p.title && !/free time|free day|travel preparation|private guided tour|itinerary not yet scheduled/i.test(p.title)))).slice(0, 40), [raw]);
    const geocodeKey = geocodeCandidates.map(p => p.id).join('|');
    useEffect(() => {
      let cancelled = false;
      const run = async () => {
        const next = {};
        const unique = [...new Map(geocodeCandidates.map(point => [[point.address || point.title, point.booking?.arrival_city || 'Marrakech'].join('|'), point])).values()];
        const hits = await Promise.all(unique.map(async point => {
          const q = [point.address || point.title, point.booking?.arrival_city || 'Marrakech', 'Morocco'].filter(Boolean).join(', ');
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
            const rows = await res.json();
            const hit = rows?.[0];
            return hit && Number.isFinite(+hit.lat) && Number.isFinite(+hit.lon) ? { point, hit } : null;
          } catch (_) { return null; }
        }));
        hits.filter(Boolean).forEach(({ point, hit }) => geocodeCandidates.filter(candidate => (candidate.address || candidate.title) === (point.address || point.title) && (candidate.booking?.arrival_city || 'Marrakech') === (point.booking?.arrival_city || 'Marrakech')).forEach(candidate => { next[candidate.id] = { coords: [+hit.lat, +hit.lon], sourceUrl: `https://www.openstreetmap.org/?mlat=${hit.lat}&mlon=${hit.lon}#map=17/${hit.lat}/${hit.lon}` }; }));
        if (!cancelled) { if (Object.keys(next).length) setResolvedCoords(prev => ({ ...prev, ...next })); setGeocodeDone(true); }
      };
      if (geocodeCandidates.length) { setGeocodeDone(false); run(); } else setGeocodeDone(true);
      return () => { cancelled = true; };
    }, [geocodeKey]);
    const enrichedRaw = useMemo(() => raw.map(p => resolvedCoords[p.id] ? { ...p, ...resolvedCoords[p.id], geocoded: true } : p), [raw, resolvedCoords]);
    const issues = useMemo(() => issuesFor(enrichedRaw), [enrichedRaw]);
    const issueIds = new Set(issues.map(x => x.point.id));
    const points = enrichedRaw.filter(p => {
      const b = p.booking, day = p.day || b.arrival_date;
      if (!day || day < bounds[0] || day > bounds[1]) return false;
      if (archived !== 'all' && !!b.archived !== (archived === 'archived')) return false;
      if (status && b.status !== status) return false;
      if (service && p.category !== service) return false;
      if (supplier && p.supplierId !== supplier) return false;
      if (driver && p.driverId !== driver) return false;
      if (guide && p.guideId !== guide) return false;
      if (destination && ![b.arrival_city, b.departure_city, p.address, p.title].join(' ').toLowerCase().includes(destination.toLowerCase())) return false;
      if (confirmation === 'confirmed' && !p.confirmed || confirmation === 'unconfirmed' && p.confirmed) return false;
      if (person && ![p.client, p.reference].join(' ').toLowerCase().includes(person.toLowerCase())) return false;
      if (payment === 'paid' && +b.balance > 0 || payment === 'unpaid' && +b.paid_amount > 0 || payment === 'partial' && !(+b.paid_amount > 0 && +b.balance > 0)) return false;
      if (flag === 'missing-address' && p.address || flag === 'missing-collaborator' && (p.supplierId || p.driverId || p.guideId) || flag === 'conflict' && !issues.some(x => x.point.id === p.id && x.label.startsWith('Assignment conflict')) || flag === 'attention' && !issueIds.has(p.id)) return false;
      if (query && ![p.client, p.reference, p.title, p.address, b.arrival_city, b.departure_city].join(' ').toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    const bookingCount = new Set(points.map(p => p.booking.id)).size;
    const selectedIssues = issues.filter(x => points.some(p => p.id === x.point.id));
    const agendaBookings = bookings.filter(b => {
      const previous = dateOnly(b.departure_date) && dateOnly(b.departure_date) < today;
      // Keep the complete history in the agenda. Archived and fully paid trips
      // must remain visible in the previous section even when the map filter is
      // set to active (the default).
      if (!previous && archived !== 'all' && !!b.archived !== (archived === 'archived')) return false;
      if (status && b.status !== status) return false;
      const paidBooking = b.status === 'fully_paid' || +b.paid_amount > 0 || (+b.balance === 0 && +b.selling_price > 0);
      if (!dateOnly(b.arrival_date) || (b.status === 'cancelled' && !paidBooking)) return false;
      if (person && ![b.client_name, b.reference].join(' ').toLowerCase().includes(person.toLowerCase())) return false;
      if (query && ![b.client_name, b.reference, b.arrival_city, b.departure_city, ...(Array.isArray(b.daily_itinerary) ? b.daily_itinerary.flatMap(d => (d.activities || []).map(a => a.location_name || '')) : [])].join(' ').toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      const aActive = dateOnly(a.arrival_date) <= today && (!dateOnly(a.departure_date) || dateOnly(a.departure_date) >= today), bActive = dateOnly(b.arrival_date) <= today && (!dateOnly(b.departure_date) || dateOnly(b.departure_date) >= today);
      const aPast = dateOnly(a.departure_date) && dateOnly(a.departure_date) < today, bPast = dateOnly(b.departure_date) && dateOnly(b.departure_date) < today;
      return Number(bPast) - Number(aPast) || Number(bActive) - Number(aActive) || str(a.arrival_date).localeCompare(str(b.arrival_date));
    });
    const calendarBookings = bookings.filter(b => b && b.status !== 'cancelled');
    const focusId = hoveredBookingId || activeBookingId;
    const activeAgendaCount = agendaBookings.filter(b => dateOnly(b.arrival_date) <= today && dateOnly(b.departure_date) >= today).length;
    const upcomingAgendaCount = agendaBookings.filter(b => dateOnly(b.arrival_date) > today).length;
    const previousAgendaBookings = agendaBookings.filter(b => dateOnly(b.departure_date) && dateOnly(b.departure_date) < today);
    const previousAgendaCount = previousAgendaBookings.length;
    const firstCurrentAgendaIndex = agendaBookings.findIndex(b => !dateOnly(b.departure_date) || dateOnly(b.departure_date) >= today);
    useEffect(() => {
      if (agendaInitialPositioned.current || !agendaScroll.current || !agendaBookings.length) return;
      const container = agendaScroll.current;
      const current = container.querySelector('[data-agenda-current="true"]');
      if (current) container.scrollTop += current.getBoundingClientRect().top - container.getBoundingClientRect().top;
      agendaInitialPositioned.current = true;
    }, [agendaBookings.length]);
    const mapPoints = focusId ? enrichedRaw.filter(p => String(p.booking.id) === String(focusId) && (!activeProgramId || visualView.dayNumber < 1 || visualView.tab === 'overview' || (visualView.tab !== 'unplanned' && p.dayNumber === visualView.dayNumber))) : points;
    const mapSelected = focusId && selected && String(selected.booking.id) !== String(focusId) ? null : selected;
    const mapHovered = focusId && hovered && String(hovered.booking.id) !== String(focusId) ? null : hovered;
    const selectPoint = p => {
      // Clicking the same activity again closes its detail panel and clears the
      // focused route. A different activity still replaces the open detail.
      if (selected?.id === p.id) { setSelected(null); setActiveBookingId(null); return; }
      setSelected(p); setActiveBookingId(p.booking.id);
    };
    const onVisualViewChange = view => {
      setVisualView(view);
      if (view.sourceIndex == null) { setSelected(null); return; }
      const match = enrichedRaw.find(p => String(p.booking.id) === String(activeProgramId) && p.sourceIndex?.[0] === view.dayNumber - 1 && p.sourceIndex?.[1] === view.sourceIndex && p.locationRole !== 'dropoff');
      setSelected(match || null);
    };
    const pick = (label, value, set, options) => h('label', { className: 'mso-filter' }, h('span', null, label), h('select', { value, onChange: e => set(e.target.value) }, options.map(([v, t]) => h('option', { key: v, value: v }, t))));
    return h('div', { className: 'msa-page mso-page' + (embedded ? ' mso-embedded' : '') + (activeProgramId ? ' mso-has-program' : '') },
      !embedded && h('header', { className: 'msa-page-head mso-hero' }, h('div', null, h('span', { className: 'mso-eyebrow' }, 'MARRAKECHSTORY · LIVE OPERATIONS'), h('h1', null, 'Operations Map'), h('p', null, 'A clear view of every journey, handoff and detail that needs attention.')), h('button', { className: 'msa-btn', onClick: reload }, '↻ Refresh')),
      !embedded && h('div', { className: 'mso-summary' }, [['In map range', bookingCount], ['Services', points.length], ['Mapped', points.filter(p => p.coords).length], ['Needs attention', selectedIssues.length]].map(([k, v]) => h('div', { className: 'mso-summary-card', key: k }, h('span', null, k), h('strong', null, v)))),
      !embedded && h('div', { className: 'mso-range', role: 'group', 'aria-label': 'Date range' }, [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'Next 7 days'], ['month', 'Next 30 days'], ['custom', 'Custom']].map(([v, t]) => h('button', { key: v, className: range === v ? 'active' : '', onClick: () => setRange(v) }, t)), range === 'custom' && h(React.Fragment, null, h('input', { type: 'date', 'aria-label': 'From date', value: from, onChange: e => setFrom(e.target.value) }), h('input', { type: 'date', 'aria-label': 'To date', value: to, min: from, onChange: e => setTo(e.target.value) }))),
      h('div', { className: 'mso-toolbar' }, h('label', { className: 'mso-filter mso-search' }, h('span', null, 'Find a journey or place'), h('input', { value: query, placeholder: 'Search reference, guest, city or venue…', onChange: e => setQuery(e.target.value) })), h('details', { className: 'mso-filter-drawer' }, h('summary', null, 'Filters', ' ', h('span', null, '⌄')), h('div', { className: 'mso-filters' }, h('label', { className: 'mso-filter' }, h('span', null, 'Client / reference'), h('input', { value: person, onChange: e => setPerson(e.target.value) })), h('label', { className: 'mso-filter' }, h('span', null, 'Destination'), h('input', { value: destination, onChange: e => setDestination(e.target.value) })), pick('Status', status, setStatus, [['', 'All statuses'], ...['new','quotation_sent','waiting_confirmation','confirmed','deposit_paid','fully_paid','ongoing','completed','cancelled'].map(v => [v, v.replaceAll('_', ' ')])]), pick('Service', service, setService, [['', 'All services'], ...Object.entries(CATS).filter(([k]) => k !== 'issue').map(([k, v]) => [k, v[0]])]), pick('Collaborator / supplier', supplier, setSupplier, [['', 'All collaborators'], ...(suppliers || []).map(s => [String(s.id), s.name])]), pick('Driver', driver, setDriver, [['', 'All drivers'], ...(suppliers || []).filter(s => s.type === 'driver').map(s => [String(s.id), s.name])]), pick('Guide', guide, setGuide, [['', 'All guides'], ...(suppliers || []).filter(s => s.type === 'guide').map(s => [String(s.id), s.name])]), pick('Confirmation', confirmation, setConfirmation, [['', 'All'], ['confirmed', 'Confirmed'], ['unconfirmed', 'Unconfirmed']]), pick('Payment', payment, setPayment, [['', 'All payments'], ['paid', 'Paid'], ['partial', 'Partially paid'], ['unpaid', 'Unpaid']]), pick('Attention', flag, setFlag, [['', 'All'], ['attention', 'Any alert'], ['missing-address', 'Missing address'], ['missing-collaborator', 'Missing collaborator'], ['conflict', 'Assignment conflict']]), pick('Archive', archived, setArchived, [['active', 'Active'], ['archived', 'Archived'], ['all', 'All']])))),
      h('div', { className: 'mso-main' }, h('div', { className: 'mso-map-card' }, h('div', { className: 'mso-map-head' }, h('div', null, h('span', { className: 'mso-eyebrow' }, focusId ? 'JOURNEY IN FOCUS' : 'LIVE OPERATIONS'), h('strong', null, focusId ? (bookings.find(b => String(b.id) === String(focusId))?.client_name || 'Booking journey') : 'All journeys on the map')), focusId && h('button', { onClick: () => { setActiveBookingId(null); setHoveredBookingId(null); setSelected(null); } }, 'Show all bookings')), h(MapCanvas, { points: mapPoints, route: !!focusId, selected: mapSelected, hovered: mapHovered, onSelect: selectPoint, onHover: setHovered, today, clock: now.clock }), h(OperationsCalendar, { bookings: calendarBookings, today, onPick: day => { setRange('custom'); setFrom(day); setTo(day); } })),
        h('aside', { className: 'mso-panel' }, h('div', { className: 'mso-panel-head' }, h('span', { className: 'mso-eyebrow' }, `${today} · ${now.clock} MOROCCO TIME`), h('h2', null, 'Daily agenda'), h('div', { className: 'mso-panel-stats' }, h('span', null, h('strong', null, activeAgendaCount), ' active'), h('span', null, h('strong', null, upcomingAgendaCount), ' upcoming'), h('span', { className: 'is-previous' }, h('strong', null, previousAgendaCount), ' previous'))),
          h('div', { className: 'mso-booking-list', ref: agendaScroll }, agendaBookings.length ? agendaBookings.map((b, agendaIndex) => {
            const active = dateOnly(b.arrival_date) <= today && (!dateOnly(b.departure_date) || dateOnly(b.departure_date) >= today);
            const previous = dateOnly(b.departure_date) && dateOnly(b.departure_date) < today;
            const countdown = daysBetween(today, dateOnly(active ? b.departure_date : previous ? b.departure_date : b.arrival_date));
            const timing = active ? 'On trip · ' + (countdown === 0 ? 'ends today' : 'ends in ' + countdown + (countdown === 1 ? ' day' : ' days')) : previous ? 'Ended ' + Math.abs(countdown) + (Math.abs(countdown) === 1 ? ' day ago' : ' days ago') : 'Starts ' + (countdown === 0 ? 'today' : countdown === 1 ? 'tomorrow' : 'in ' + countdown + ' days');
            const route = [b.arrival_city, b.departure_city].filter(Boolean).join(' → ');
            const trip = [route, b.total_days ? b.total_days + 'D' : '', ((+b.adults || 0) + (+b.kids || 0)) + ' pax'].filter(Boolean).join(' · ');
            const activity = bookingActivity(b, today);
            const expanded = String(activeBookingId) === String(b.id);
            const bookingPoints = enrichedRaw.filter(p => String(p.booking.id) === String(b.id));
            const serviceItems = (Array.isArray(b.daily_itinerary) ? b.daily_itinerary : []).flatMap(day => Array.isArray(day.activities) ? day.activities : []);
            return h(React.Fragment, { key: b.id },
              agendaIndex === 0 && previousAgendaCount > 0 && h('div', { className: 'mso-booking-section-label' }, `Previous bookings · ${previousAgendaCount} · scroll up to review`),
              agendaIndex === firstCurrentAgendaIndex && previousAgendaCount > 0 && h('div', { className: 'mso-booking-section-label is-current', 'data-agenda-current': 'true' }, 'Current & upcoming · start here'),
              h('div', { className: 'mso-booking-entry' + (expanded ? ' is-open' : '') + (previous ? ' is-previous' : '') + (!active && !previous && countdown <= 2 ? ' is-imminent' : !active && !previous && countdown <= 7 ? ' is-soon' : ''), key: `${b.id}-entry`, onMouseEnter: () => setHoveredBookingId(b.id), onMouseLeave: () => setHoveredBookingId(null) },
              h('button', { className: 'mso-booking-card', 'aria-expanded': expanded, onFocus: () => setHoveredBookingId(b.id), onBlur: () => setHoveredBookingId(null), onClick: () => { if (expanded) onCloseProgram?.(); else if (renderProgram) openPlanner?.(b); setActiveBookingId(expanded ? null : b.id); setSelected(null); } },
                h('span', { className: 'mso-booking-status ' + (active ? 'is-active' : previous ? 'is-previous' : 'is-upcoming') }, active ? '● ON TRIP' : previous ? 'PREVIOUS' : 'UPCOMING'),
                h('strong', null, b.client_name || 'Guest'),
                h('small', { className: 'mso-booking-dates' }, `${b.reference || '—'} · ${dateOnly(b.arrival_date)} → ${dateOnly(b.departure_date) || '—'}`),
                activity && h('span', { className: 'mso-booking-activity' }, activity),
                h('span', { className: 'mso-booking-countdown-block ' + (active ? 'is-active' : previous ? 'is-previous' : countdown <= 2 ? 'is-imminent' : countdown <= 7 ? 'is-soon' : 'is-far') }, h('strong', null, active ? 'NOW' : previous ? '✓' : Math.max(0, countdown)), h('small', null, active ? 'ON TRIP' : previous ? 'DONE' : countdown === 1 ? 'DAY' : 'DAYS')),
                h('span', { className: 'mso-booking-countdown ' + (active ? 'is-active' : previous ? 'is-previous' : countdown <= 2 ? 'is-imminent' : countdown <= 7 ? 'is-soon' : 'is-far') }, timing),
                h('span', { className: 'mso-booking-meta' }, trip),
                h('span', { className: 'mso-booking-footer' }, h('span', { className: 'msa-badge msa-st-' + b.status }, statusLabel[b.status] || b.status || '—'), isAdmin && +b.balance > 0 && h('span', { className: 'mso-booking-owed' }, 'Owes ' + money(b.balance))),
                h('span', { className: 'mso-booking-count' }, `${bookingPoints.length} stops`, h('span', null, expanded ? '⌃' : '⌄'))),
              expanded && h('div', { className: 'mso-booking-itinerary' },
                h('div', { className: 'mso-booking-actions' }, h('span', null, 'Daily itinerary'), h('div', null, h('button', { onClick: () => openBooking(b) }, 'Open booking ↗'))),
                renderProgram ? h('div', { className: 'mso-agenda-program', 'aria-label': `${b.client_name || 'Guest'} daily program` },
                  h('div', { className: 'mso-agenda-context' }, h('span', null, `${bookingPoints.length} route points`), h('span', null, `${serviceItems.filter(item => item.confirmed === true).length} confirmed services`), h('span', null, `${serviceItems.filter(item => item.confirmed !== true).length} to confirm`)),
                  renderProgram(b, { mapPoint: selected, onViewChange: onVisualViewChange, points: bookingPoints, today, clock: now.clock }))
                : h(ItineraryDays, { points: bookingPoints, today, clock: now.clock, selected: selected?.booking.id === b.id ? selected : null, hovered: hovered?.booking.id === b.id ? hovered : null, onSelect: selectPoint, onHover: setHovered, suppliers }),
                !renderProgram && hovered?.booking.id === b.id && hovered.id !== selected?.id && h(PointDetail, { point: hovered, suppliers, onBooking: openBooking }))));
          }) : h('p', { className: 'mso-empty' }, 'No bookings match this view.')))),
      selectedIssues.length > 0 && h('section', { className: 'mso-alerts' }, h('h2', null, `Needs attention · ${selectedIssues.length}`), selectedIssues.slice(0, 30).map((x, i) => h('button', { key: `${x.point.id}-${i}`, onClick: () => { setSelected(x.point); setActiveBookingId(x.point.booking.id); } }, h('strong', null, `${CATS[x.point.category]?.[1] || '⚠️'}  ${x.label}`), h('span', null, `${x.point.reference} · ${x.point.title} · ${x.point.day || 'Undated'}${x.action ? ` · ${x.action}` : ''}`)))));
  }
  window.MS_OperationsMap = OperationsMap;
  window.MS_BookingJourney = BookingJourney;
})();
