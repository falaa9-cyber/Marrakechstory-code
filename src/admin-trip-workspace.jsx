(function () {
  const { useEffect, useMemo, useRef, useState } = React;
  const dateOnly = value => String(value || '').slice(0, 10);
  const addDate = (value, offset) => {
    if (!value) return '';
    const d = new Date(`${dateOnly(value)}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const daysFor = booking => {
    const saved = Array.isArray(booking?.daily_itinerary) ? booking.daily_itinerary : [];
    if (saved.length) return saved.map((day, index) => ({ ...day, day: index + 1, date: day.date || addDate(booking.arrival_date, index), activities: Array.isArray(day.activities) ? day.activities : [] }));
    const count = Math.min(31, Math.max(0, Number(booking?.total_days) || (booking?.arrival_date && booking?.departure_date ? Math.round((Date.parse(booking.departure_date) - Date.parse(booking.arrival_date)) / 86400000) + 1 : 0)));
    return Array.from({ length: count }, (_, index) => ({ day: index + 1, date: addDate(booking.arrival_date, index), city: index === count - 1 ? booking.departure_city || '' : booking.arrival_city || '', activities: [] }));
  };
  const itemId = (day, item, index) => String(item.id || `${day.day}-${index}`);
  const coordinates = item => {
    const source = item.coordinates || item.location || item;
    const lat = Number(source.latitude ?? source.lat);
    const lng = Number(source.longitude ?? source.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0) ? [lat, lng] : null;
  };
  const displayTitle = booking => booking.trip_title || booking.title || [booking.arrival_city, booking.departure_city].filter(Boolean).join(' to ') || `${booking.client_name || 'Client'}’s Morocco trip`;
  const publicDescription = item => item.client_description || item.details || item.description || '';
  const requestDraft = lead => {
    const p = lead.payload || {};
    const travelers = p.travellers || {};
    return { client_name: lead.name || p.name || '', email: lead.email || p.email || '', phone: lead.phone || p.phone || '', arrival_date: lead.start_date || p.startDate || '', departure_date: lead.end_date || p.endDate || '', arrival_city: p.arriveCity || 'Marrakech', departure_city: p.departCity || 'Marrakech', total_days: Number(lead.duration || p.duration) || p.daily_itinerary.length, adults: Number(travelers.adults) || 0, kids: (Number(travelers.children) || 0) + (Number(travelers.infants) || 0), daily_itinerary: p.daily_itinerary, planner_preferences: { source_request_id: lead.id, pace: p.pace || '', interests: Array.isArray(p.interests) ? p.interests : [], accommodation: p.accommodation || '', budget: p.budget || '', transport: p.transport || '', trip_type: p.tripType || '', occasion: p.occasion || '', stops: Array.isArray(p.stops) ? p.stops : [], day_schedule: Array.isArray(p.daySchedule) ? p.daySchedule : [], flight_details: p.flightDetails || '', notes: p.notes || '' }, special_requests: [p.avoid, p.notes].filter(Boolean).join('\n'), status: 'draft', lead_source: 'website' };
  };
  const statusText = item => item.confirmed === true ? 'Confirmed' : item.supplier_confirmed === true ? 'Supplier ready' : /confirm/i.test(String(item.status || '')) ? 'Unconfirmed' : item.status || 'Draft';
  const dateLabel = value => value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${dateOnly(value)}T12:00:00Z`)) : 'Date pending';
  const routeCache = new Map();
  const routeColors = ['#e64b32', '#547e67', '#376d9b', '#9a7045', '#815a91'];

  function RouteMap({ items, selected, onSelect }) {
    const node = useRef(null);
    const map = useRef(null);
    const markers = useRef([]);
    const lines = useRef([]);
    const routeKey = items.map(item => `${item.dayNumber || 'idea'}:${(coordinates(item) || []).join(',')}`).join('|');
    useEffect(() => {
      if (!node.current || !window.L) return;
      const leaflet = window.L;
      const instance = leaflet.map(node.current, { zoomControl: false, scrollWheelZoom: true }).setView([31.63, -7.98], 7);
      leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(instance);
      leaflet.control.zoom({ position: 'topright' }).addTo(instance);
      map.current = instance;
      const observer = new ResizeObserver(() => instance.invalidateSize());
      observer.observe(node.current);
      return () => { observer.disconnect(); instance.remove(); map.current = null; };
    }, []);
    useEffect(() => {
      const instance = map.current;
      if (!instance || !window.L) return;
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      const bounds = [];
      items.forEach((item, index) => {
        const point = coordinates(item);
        if (!point) return;
        bounds.push(point);
        const icon = L.divIcon({ className: 'atw-marker-shell', html: `<span class="atw-marker${selected === item.key ? ' is-selected' : ''}">${index + 1}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
        const marker = L.marker(point, { icon, title: item.location_name || item.type || 'Itinerary stop' }).addTo(instance);
        marker.on('click', () => onSelect(item.key));
        markers.current.push(marker);
      });
      if (bounds.length) instance.fitBounds(L.latLngBounds(bounds), { padding: [52, 52], maxZoom: bounds.length === 1 ? 12 : 9, animate: true });
      else instance.setView([31.63, -7.98], 7);
    }, [items, selected, onSelect]);
    useEffect(() => {
      let cancelled = false;
      lines.current.forEach(line => line.remove());
      lines.current = [];
      const grouped = new Map();
      items.forEach(item => { const point = coordinates(item); if (!point) return; const key = item.dayNumber || 0; if (!grouped.has(key)) grouped.set(key, []); grouped.get(key).push(point); });
      Array.from(grouped.entries()).forEach(async ([day, points]) => {
        if (points.length < 2) return;
        const key = points.map(point => point.join(',')).join(';');
        let geometry = routeCache.get(key);
        if (!geometry) {
          try {
            const path = points.map(([lat, lng]) => `${lng},${lat}`).join(';');
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&steps=false`);
            const result = response.ok ? await response.json() : null;
            geometry = result?.code === 'Ok' ? result.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) : null;
            if (geometry?.length > 1) routeCache.set(key, geometry);
          } catch (_) { geometry = null; }
        }
        if (!cancelled && geometry?.length > 1 && map.current) lines.current.push(L.polyline(geometry, { color: routeColors[(Number(day) - 1 + routeColors.length) % routeColors.length], weight: 5, opacity: .9, lineCap: 'round' }).addTo(map.current));
      });
      return () => { cancelled = true; lines.current.forEach(line => line.remove()); lines.current = []; };
    }, [routeKey]);
    return <div className="atw-map-area"><div ref={node} className="atw-map" role="img" aria-label={`${items.filter(item => coordinates(item)).length} mapped itinerary places`} /><div className="atw-map-caption"><strong>Trip map</strong><span>{items.filter(item => coordinates(item)).length} geolocated stops · Route lines appear in Daily agenda when routing data exists.</span></div></div>;
  }

  function OperationalContext({ item, points, suppliers, today, clock, expanded }) {
    const matches = points.filter(point => point.sourceIndex?.[0] === item.dayNumber - 1 && point.sourceIndex?.[1] === item.sourceIndex);
    if (!matches.length) return null;
    const main = matches.find(point => point.locationRole === 'service') || matches[0];
    const nameFor = id => suppliers.find(value => String(value.id) === String(id))?.name || '';
    const assignments = [['Driver', main.driverId], ['Guide', main.guideId], ['Supplier', main.supplierId]].map(([role, id]) => [role, nameFor(id)]).filter(([, name]) => name);
    const clockTime = /^\d{1,2}:\d{2}$/.test(main.time || '') ? main.time.padStart(5, '0') : '';
    const timing = main.day < today ? 'Earlier' : main.day > today ? 'Coming up' : clockTime && clockTime <= clock ? 'Today · earlier' : 'Today · next';
    const location = matches.find(point => point.locationRole === 'service' && point.address)?.address || main.address;
    const pickup = matches.find(point => point.locationRole === 'pickup');
    const dropoff = matches.find(point => point.locationRole === 'dropoff');
    return <div className="atw-operational" aria-label="Operational service details">
      <div className="atw-operational-quick"><span>{timing}</span><span className={main.confirmed ? 'is-confirmed' : 'is-pending'}>{main.confirmed ? 'Supplier confirmed' : 'Confirmation pending'}</span><span>{location || pickup?.address || 'Meeting point missing'}</span>{assignments.length > 0 && <span>{assignments.map(([role, name]) => `${role}: ${name}`).join(' · ')}</span>}</div>
      {expanded && <dl className="atw-operational-detail">
        {pickup && <><dt>Pickup</dt><dd>{[pickup.time, pickup.address || 'Address pending'].filter(Boolean).join(' · ')}</dd></>}
        {dropoff && <><dt>Drop-off</dt><dd>{[dropoff.time, dropoff.address || 'Address pending'].filter(Boolean).join(' · ')}</dd></>}
        {location && <><dt>Address</dt><dd>{location}</dd></>}
        {main.coords && <><dt>Map coordinates</dt><dd>{main.coords.map(value => value.toFixed(6)).join(', ')}</dd></>}
        {assignments.map(([role, name]) => <React.Fragment key={role}><dt>{role}</dt><dd>{name}</dd></React.Fragment>)}
        {main.instructions && <><dt>Instructions</dt><dd>{main.instructions}</dd></>}
        {main.status && <><dt>Operational status</dt><dd>{main.status}</dd></>}
      </dl>}
    </div>;
  }

  function DayStay({ points, date }) {
    const stay = points.find(point => point.category === 'accommodation' && point.day === date);
    if (!stay) return null;
    return <div className="atw-day-stay"><span>STAY · {date}</span><strong>{stay.title}</strong><small>{stay.address || 'Accommodation address pending'}</small></div>;
  }

  function Workspace({ bookings = [], suppliers = [], leads = [], initialBookingId, initialTab = 'overview', agendaMode = false, mapPoint, operationalPoints = [], operationToday = '', operationClock = '', onViewChange, onOpenBooking, openBooking, openPdf, saveBooking, reload }) {
    const [bookingId, setBookingId] = useState(initialBookingId || '');
    const [tab, setTab] = useState(initialTab);
    const [selected, setSelected] = useState('');
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState({ type: 'Activity', details: '', time: '', location_name: '', address: '' });
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [dragged, setDragged] = useState(null);
    const [undo, setUndo] = useState(null);
    useEffect(() => { if (initialBookingId) { setBookingId(initialBookingId); setTab(initialTab); } }, [initialBookingId, initialTab]);
    useEffect(() => { if (!bookingId && bookings.length) setBookingId(bookings[0].id); }, [bookings, bookingId]);
    const booking = bookings.find(value => String(value.id) === String(bookingId));
    const days = useMemo(() => daysFor(booking), [booking]);
    const ideas = Array.isArray(booking?.planner_preferences?.unplanned_items) ? booking.planner_preferences.unplanned_items : [];
    const pendingRequests = leads.filter(lead => lead.kind === 'itinerary' && !lead.routed_booking_id && Array.isArray(lead.payload?.daily_itinerary) && lead.payload.daily_itinerary.length);
    const dayIndex = tab.startsWith('day-') ? Number(tab.slice(4)) - 1 : -1;
    const shownDays = tab === 'overview' ? days : dayIndex >= 0 ? days.slice(dayIndex, dayIndex + 1) : [];
    const items = tab === 'unplanned' ? ideas.map((item, index) => ({ ...item, key: `idea-${index}`, sourceIndex: index })) : shownDays.flatMap(day => day.activities.map((item, index) => ({ ...item, key: itemId(day, item, index), dayNumber: day.day, sourceIndex: index, city: item.city || day.city })));
    const viewChange = useRef(onViewChange);
    viewChange.current = onViewChange;
    useEffect(() => {
      const current = items.find(item => item.key === selected);
      viewChange.current?.({ tab, dayNumber: dayIndex + 1, sourceIndex: current?.sourceIndex ?? null });
    }, [bookingId, tab, selected]);
    useEffect(() => {
      if (!agendaMode || !mapPoint?.sourceIndex || String(mapPoint.booking?.id) !== String(bookingId)) return;
      const [di, ai] = mapPoint.sourceIndex;
      const day = days[di];
      const activity = day?.activities?.[ai];
      if (day && activity) { setTab(`day-${day.day}`); setSelected(itemId(day, activity, ai)); }
    }, [mapPoint?.id, agendaMode, bookingId]);
    const confirmed = days.flatMap(day => day.activities).filter(item => item.confirmed === true).length;
    const total = days.reduce((sum, day) => sum + day.activities.length, 0);
    const notify = text => { setMessage(text); window.setTimeout(() => setMessage(''), 3800); };
    const selectItem = key => { const item = items.find(value => value.key === key); if (tab === 'overview' && item?.dayNumber) setTab(`day-${item.dayNumber}`); setSelected(key); window.setTimeout(() => document.getElementById(`atw-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0); };
    const save = async (nextDays, nextIdeas, success, reversible = false) => {
      if (!booking || busy) return false;
      setBusy(true);
      const patch = { daily_itinerary: nextDays, planner_preferences: { ...(booking.planner_preferences || {}), unplanned_items: nextIdeas } };
      const response = await saveBooking?.(booking, patch);
      setBusy(false);
      if (!response || response.error) { notify(response?.error?.message || 'Could not save. Please try again.'); return false; }
      if (reversible) setUndo({ days, ideas }); else setUndo(null);
      await reload?.();
      notify(success);
      return true;
    };
    const moveItem = async (source, targetDay, targetIndex) => {
      if (!source || !booking) return;
      const nextDays = days.map(day => ({ ...day, activities: [...day.activities] }));
      const nextIdeas = [...ideas];
      let item;
      if (source.day === 'unplanned') item = nextIdeas.splice(source.index, 1)[0];
      else item = nextDays[source.day - 1]?.activities.splice(source.index, 1)[0];
      if (!item) return;
      const normalized = { ...item, id: item.id || (window.crypto?.randomUUID?.() || `item-${Date.now()}`) };
      if (targetDay === 'unplanned') nextIdeas.push(normalized);
      else {
        const destination = nextDays[targetDay - 1];
        if (!destination) return;
        const position = source.day === targetDay && source.index < targetIndex ? targetIndex - 1 : targetIndex;
        destination.activities.splice(Math.max(0, position), 0, normalized);
      }
      await save(nextDays, nextIdeas, 'Itinerary order saved · Undo available', true);
    };
    const addItem = async () => {
      if (!draft.details.trim()) return;
      const item = { ...draft, id: window.crypto?.randomUUID?.() || `item-${Date.now()}`, confirmed: false, status: 'Draft' };
      const nextDays = days.map(day => ({ ...day, activities: [...day.activities] }));
      const nextIdeas = [...ideas];
      if (tab === 'unplanned' || !nextDays.length) nextIdeas.push(item);
      else (nextDays[dayIndex >= 0 ? dayIndex : 0] || nextDays[0]).activities.push(item);
      if (await save(nextDays, nextIdeas, 'Draft item saved')) { setEditing(null); setDraft({ type: 'Activity', details: '', time: '', location_name: '', address: '' }); }
    };
    const updateItem = async () => {
      if (!editing || editing.mode !== 'edit') return;
      const nextDays = days.map(day => ({ ...day, activities: [...day.activities] }));
      const nextIdeas = [...ideas];
      if (editing.day === 'unplanned') nextIdeas[editing.index] = { ...nextIdeas[editing.index], ...draft };
      else nextDays[editing.day - 1].activities[editing.index] = { ...nextDays[editing.day - 1].activities[editing.index], ...draft };
      if (await save(nextDays, nextIdeas, 'Item details saved')) setEditing(null);
    };
    const startEdit = (item, mode = 'edit') => { setEditing({ mode, day: item?.dayNumber || 'unplanned', index: item?.sourceIndex ?? -1 }); setDraft(item ? { type: item.type || 'Activity', details: publicDescription(item), time: item.time || '', location_name: item.location_name || '', address: item.address || '' } : { type: 'Activity', details: '', time: '', location_name: '', address: '' }); };
    const sourceFor = item => ({ day: tab === 'unplanned' ? 'unplanned' : item.dayNumber, index: item.sourceIndex });
    if (!booking) return <div className="atw-empty"><h2>Choose a trip to plan</h2><p>Saved client bookings appear here. A website itinerary request remains a request until staff creates or links its booking.</p><button onClick={() => (onOpenBooking || openBooking)?.({})}>Create booking</button>{pendingRequests.length > 0 && <div className="atw-request-list"><h3>Website itinerary requests</h3>{pendingRequests.map(lead => <article key={lead.id}><strong>{lead.name || lead.email || 'New traveler'}</strong><span>{lead.payload.daily_itinerary.length} requested days · {lead.start_date || 'Dates pending'}</span><button onClick={() => (onOpenBooking || openBooking)?.(requestDraft(lead))}>Create draft booking</button></article>)}</div>}</div>;
    if (agendaMode) {
      const currentDay = days[dayIndex] || days[0];
      const agendaItems = currentDay ? currentDay.activities.map((item, index) => ({ ...item, key: itemId(currentDay, item, index), dayNumber: currentDay.day, sourceIndex: index, city: item.city || currentDay.city })) : [];
      return <section className="atw-agenda" aria-label={`${booking.client_name || 'Client'} daily itinerary`}>
        <div className="atw-agenda-head"><div><span className="atw-eyebrow">DAILY ITINERARY · {booking.reference || 'DRAFT'}</span><h3>{booking.client_name || 'Client'}’s program</h3><p>{dateLabel(booking.arrival_date)}–{dateLabel(booking.departure_date)} · {days.length} days · {total} itinerary items</p></div><button onClick={() => (onOpenBooking || openBooking)?.(booking)}>Booking details ↗</button></div>
        <nav className="atw-tabs atw-agenda-days" aria-label="Program days">{days.map(day => <button key={day.day} className={currentDay?.day === day.day ? 'active' : ''} aria-current={currentDay?.day === day.day ? 'date' : undefined} onClick={() => { setTab(`day-${day.day}`); setSelected(''); }}>Day {day.day}<small>{dateLabel(day.date)}</small></button>)}</nav>
        {currentDay ? <div className="atw-agenda-body"><div className="atw-agenda-day-head"><div><span className="atw-eyebrow">{dateLabel(currentDay.date)} · DAY {currentDay.day} OF {days.length}</span><h4>{currentDay.title || currentDay.city || `Day ${currentDay.day}`}</h4><p>{currentDay.summary || currentDay.city || 'Daily details from the saved itinerary'}</p></div><strong>{agendaItems.length} {agendaItems.length === 1 ? 'stop' : 'stops'}</strong></div><DayStay points={operationalPoints} date={currentDay.date} /><div className="atw-agenda-list">{agendaItems.length ? agendaItems.map((item, index) => <article id={`atw-${item.key}`} key={item.key} className={`atw-agenda-stop${selected === item.key ? ' is-selected' : ''}`}><button className="atw-agenda-stop-main" onClick={() => selectItem(item.key)} aria-expanded={selected === item.key}><span className="atw-agenda-time">{item.time || String(index + 1).padStart(2, '0')}</span><span className="atw-agenda-copy"><small>{item.type || 'Activity'} · {item.city || currentDay.city || 'Morocco'}</small><strong>{item.location_name || item.name || item.type || 'Untitled stop'}</strong><span>{publicDescription(item) || 'Description pending'}</span></span><span className={`atw-status ${item.confirmed === true ? 'confirmed' : 'draft'}`}>{statusText(item)}</span></button><OperationalContext item={item} points={operationalPoints} suppliers={suppliers} today={operationToday} clock={operationClock} expanded={selected === item.key} /></article>) : <div className="atw-no-items"><strong>No itinerary stops saved for this day</strong><p>Open the booking to review or add daily details.</p></div>}</div></div> : <div className="atw-no-items"><strong>No daily itinerary saved</strong><p>Open the booking to add a day-by-day program.</p></div>}
      </section>;
    }
    return <div className={`atw-root${agendaMode ? ' atw-agenda-mode' : ''}`}>
      <header className="atw-header"><div><span className="atw-eyebrow">PRIVATE JOURNEY · {booking.reference || 'NO REFERENCE'}</span><h1>{displayTitle(booking)}</h1><p>{booking.client_name || 'Client pending'} · {dateLabel(booking.arrival_date)}–{dateLabel(booking.departure_date)} · {(Number(booking.adults) || 0) + (Number(booking.kids) || 0)} travelers</p></div><div className="atw-header-actions"><select aria-label="Select client trip" value={booking.id} onChange={event => { setBookingId(event.target.value); setTab('overview'); }}><option value={booking.id}>{booking.client_name || displayTitle(booking)}</option>{bookings.filter(value => value.id !== booking.id).map(value => <option key={value.id} value={value.id}>{value.client_name || displayTitle(value)} · {value.reference || 'Draft'}</option>)}</select><button onClick={() => (onOpenBooking || openBooking)?.(booking)}>Booking details</button><button onClick={() => openPdf?.(booking)}>Client PDF</button><button className="atw-primary" onClick={() => startEdit(null, 'add')}>Add item</button></div></header>
      <div className="atw-main"><RouteMap items={items} selected={selected} onSelect={selectItem} /><section className="atw-panel"><nav className="atw-tabs" aria-label="Itinerary days"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>{days.map(day => <button key={day.day} className={tab === `day-${day.day}` ? 'active' : ''} onClick={() => setTab(`day-${day.day}`)}>Day {day.day}<small>{dateLabel(day.date)}</small></button>)}<button className={tab === 'unplanned' ? 'active' : ''} onClick={() => setTab('unplanned')}>Unplanned <small>{ideas.length} ideas</small></button></nav><div className="atw-content">
        {tab === 'overview' && <section className="atw-form-context" aria-label="Traveler brief"><span className="atw-eyebrow">{booking.planner_preferences?.source_request_id ? 'LAG DIN EGEN REISE · WEBSITE REQUEST' : 'CLIENT TRAVEL BRIEF'}</span><h3>Traveler brief</h3><div>{[['Travelers', `${Number(booking.adults) || 0} adults · ${Number(booking.kids) || 0} children`], ['Travel style', booking.planner_preferences?.pace], ['Interests', (booking.planner_preferences?.interests || []).join(', ')], ['Accommodation', booking.planner_preferences?.accommodation], ['Budget', booking.planner_preferences?.budget], ['Transport', booking.planner_preferences?.transport], ['Trip type', booking.planner_preferences?.trip_type], ['Flight details', booking.planner_preferences?.flight_details]].filter(([, value]) => value).map(([label, value]) => <p key={label}><strong>{label}</strong><span>{value}</span></p>)}</div><button onClick={() => (onOpenBooking || openBooking)?.(booking)}>Review full booking form →</button></section>}
        {tab === 'overview' && <><div className="atw-section-title"><div><span className="atw-eyebrow">TRIP AT A GLANCE</span><h2>{booking.client_name ? `${booking.client_name}’s itinerary` : 'Trip itinerary'}</h2><p>Based on the saved booking and the website’s day-by-day itinerary format.</p></div></div><div className="atw-stats"><div><strong>{days.length}</strong><span>Days</span></div><div><strong>{Number(booking.total_nights) || Math.max(0, days.length - 1)}</strong><span>Nights</span></div><div><strong>{new Set(days.map(day => day.city).filter(Boolean)).size}</strong><span>Destinations</span></div><div><strong>{total}</strong><span>Services</span></div></div><div className="atw-overview-grid"><button onClick={() => setTab(days.length ? 'day-1' : 'unplanned')}><span>Daily program</span><strong>{total ? `${total} saved itinerary items` : 'Start planning the days'}</strong><small>Open the timeline →</small></button><button onClick={() => setTab('unplanned')}><span>Saved ideas</span><strong>{ideas.length} unplanned places</strong><small>Assign to a day →</small></button><button onClick={() => (onOpenBooking || openBooking)?.(booking)}><span>Traveler preferences</span><strong>{(booking.planner_preferences?.interests || []).join(', ') || booking.special_requests || 'Review booking form'}</strong><small>Open booking details →</small></button><button onClick={() => openPdf?.(booking)}><span>Client itinerary</span><strong>{confirmed} of {total} services confirmed</strong><small>Preview client-safe PDF →</small></button></div><div className="atw-readiness"><strong>Operational readiness</strong><p>{booking.status || 'Draft'} booking · {total - confirmed} services still unconfirmed. A saved item is never treated as supplier confirmation.</p></div>{pendingRequests.length > 0 && <div className="atw-pending"><h3>Website itinerary requests</h3><p>These submitted plans are not bookings yet. Review each one before creating a draft booking.</p>{pendingRequests.map(lead => <button key={lead.id} onClick={() => (onOpenBooking || openBooking)?.(requestDraft(lead))}><strong>{lead.name || lead.email || 'New traveler'}</strong><span>{lead.payload.daily_itinerary.length} proposed days · Create draft booking →</span></button>)}</div>}</>}
        {tab !== 'overview' && <><div className="atw-section-title"><div><span className="atw-eyebrow">{tab === 'unplanned' ? 'SAVED IDEAS' : dateLabel(days[dayIndex]?.date)}</span><h2>{tab === 'unplanned' ? 'Unplanned places' : days[dayIndex]?.title || days[dayIndex]?.city || `Day ${dayIndex + 1}`}</h2><p>{tab === 'unplanned' ? 'Keep ideas here until their timing and location make sense.' : days[dayIndex]?.summary || `Day ${dayIndex + 1} of ${days.length} · ${days[dayIndex]?.city || 'Destination pending'}`}</p></div><button onClick={() => startEdit(null, 'add')}>Add item</button></div><DayStay points={operationalPoints} date={days[dayIndex]?.date} /><div className="atw-timeline">{items.length ? items.map((item, index) => <article id={`atw-${item.key}`} key={item.key} className={`atw-item ${selected === item.key ? 'is-selected' : ''}`} draggable onDragStart={() => setDragged(sourceFor(item))} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); moveItem(dragged, tab === 'unplanned' ? 'unplanned' : item.dayNumber, item.sourceIndex); setDragged(null); }}><button className="atw-item-main" onClick={() => selectItem(item.key)}><span className="atw-item-time">{item.time || String(index + 1).padStart(2, '0')}</span><span className="atw-item-copy"><small>{item.type || 'Activity'} · {item.city || 'Morocco'}</small><strong>{item.location_name || item.name || item.type || 'Untitled service'}</strong><span>{publicDescription(item) || 'Add a client-facing description.'}</span><em>{item.address || 'Exact location pending'}</em></span><span className={`atw-status ${item.confirmed === true ? 'confirmed' : 'draft'}`}>{statusText(item)}</span></button><OperationalContext item={item} points={operationalPoints} suppliers={suppliers} today={operationToday} clock={operationClock} expanded={selected === item.key} /><div className="atw-item-actions"><button onClick={() => startEdit(item)}>Details</button><label>Move to <select aria-label={`Move ${item.location_name || item.type || 'item'} to day`} value="" onChange={event => { if (event.target.value) moveItem(sourceFor(item), event.target.value === 'unplanned' ? 'unplanned' : Number(event.target.value), 999); }}><option value="">Choose…</option>{days.map(day => <option key={day.day} value={day.day}>Day {day.day} · {day.city || dateLabel(day.date)}</option>)}<option value="unplanned">Unplanned</option></select></label></div></article>) : <div className="atw-no-items"><strong>Nothing scheduled here yet</strong><p>Add a draft activity, transfer, meal or stay. It will be saved to this booking.</p><button onClick={() => startEdit(null, 'add')}>Add first item</button></div>}</div><button className="atw-add-row" onClick={() => startEdit(null, 'add')}>＋ Add another item</button></>}
      </div></section></div>
      {undo && <button className="atw-undo" onClick={async () => { await save(undo.days, undo.ideas, 'Previous order restored'); }}>Undo last move</button>}
      {editing && <div className="atw-overlay" onMouseDown={() => setEditing(null)}><aside className="atw-drawer" onMouseDown={event => event.stopPropagation()}><button className="atw-close" onClick={() => setEditing(null)} aria-label="Close details">×</button><span className="atw-eyebrow">{editing.mode === 'add' ? 'NEW DRAFT SERVICE' : 'ITINERARY DETAILS'}</span><h2>{editing.mode === 'add' ? 'Add to itinerary' : 'Edit itinerary item'}</h2><p>These fields use the existing booking itinerary structure and flow through to the client program.</p><label>Service type<select value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })}>{['Activity', 'Transport', 'Accommodation', 'Meal', 'Free time', 'Custom'].map(type => <option key={type}>{type}</option>)}</select></label><label>Place or service name<input value={draft.location_name} onChange={event => setDraft({ ...draft, location_name: event.target.value })} placeholder="e.g. Ait Ben Haddou" /></label><label>Start time<input type="time" value={draft.time} onChange={event => setDraft({ ...draft, time: event.target.value })} /></label><label>Address<input value={draft.address} onChange={event => setDraft({ ...draft, address: event.target.value })} placeholder="Exact meeting point" /></label><label>Client-facing description<textarea rows="5" value={draft.details} onChange={event => setDraft({ ...draft, details: event.target.value })} placeholder="What will travelers do or see?" /></label><div className="atw-drawer-note">Status remains a draft. Confirm the service through the booking’s operational fields after checking with the supplier.</div><button className="atw-primary" disabled={busy || !draft.details.trim()} onClick={editing.mode === 'add' ? addItem : updateItem}>{busy ? 'Saving…' : 'Save itinerary item'}</button>{editing.mode === 'edit' && <button className="atw-secondary" onClick={() => { setEditing(null); (onOpenBooking || openBooking)?.(booking); }}>Open full booking form</button>}</aside></div>}
      {message && <div className="atw-toast" role="status">{message}</div>}
    </div>;
  }
  window.MS_TripPlanner = Workspace;
})();
