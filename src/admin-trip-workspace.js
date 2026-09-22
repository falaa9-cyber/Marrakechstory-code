(function() {
  const { useEffect, useMemo, useRef, useState } = React;
  const dateOnly = (value) => String(value || "").slice(0, 10);
  const addDate = (value, offset) => {
    if (!value) return "";
    const d = /* @__PURE__ */ new Date(`${dateOnly(value)}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const daysFor = (booking) => {
    const saved = Array.isArray(booking == null ? void 0 : booking.daily_itinerary) ? booking.daily_itinerary : [];
    if (saved.length) return saved.map((day, index) => ({ ...day, day: index + 1, date: day.date || addDate(booking.arrival_date, index), activities: Array.isArray(day.activities) ? day.activities : [] }));
    const count = Math.min(31, Math.max(0, Number(booking == null ? void 0 : booking.total_days) || ((booking == null ? void 0 : booking.arrival_date) && (booking == null ? void 0 : booking.departure_date) ? Math.round((Date.parse(booking.departure_date) - Date.parse(booking.arrival_date)) / 864e5) + 1 : 0)));
    return Array.from({ length: count }, (_, index) => ({ day: index + 1, date: addDate(booking.arrival_date, index), city: index === count - 1 ? booking.departure_city || "" : booking.arrival_city || "", activities: [] }));
  };
  const itemId = (day, item, index) => String(item.id || `${day.day}-${index}`);
  const coordinates = (item) => {
    var _a, _b;
    const source = item.coordinates || item.location || item;
    const lat = Number((_a = source.latitude) != null ? _a : source.lat);
    const lng = Number((_b = source.longitude) != null ? _b : source.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0) ? [lat, lng] : null;
  };
  const displayTitle = (booking) => booking.trip_title || booking.title || [booking.arrival_city, booking.departure_city].filter(Boolean).join(" to ") || `${booking.client_name || "Client"}\u2019s Morocco trip`;
  const publicDescription = (item) => item.client_description || item.details || item.description || "";
  const requestDraft = (lead) => {
    const p = lead.payload || {};
    const travelers = p.travellers || {};
    return { client_name: lead.name || p.name || "", email: lead.email || p.email || "", phone: lead.phone || p.phone || "", arrival_date: lead.start_date || p.startDate || "", departure_date: lead.end_date || p.endDate || "", arrival_city: p.arriveCity || "Marrakech", departure_city: p.departCity || "Marrakech", total_days: Number(lead.duration || p.duration) || p.daily_itinerary.length, adults: Number(travelers.adults) || 0, kids: (Number(travelers.children) || 0) + (Number(travelers.infants) || 0), daily_itinerary: p.daily_itinerary, planner_preferences: { source_request_id: lead.id, pace: p.pace || "", interests: Array.isArray(p.interests) ? p.interests : [], accommodation: p.accommodation || "", budget: p.budget || "", transport: p.transport || "", trip_type: p.tripType || "", occasion: p.occasion || "", stops: Array.isArray(p.stops) ? p.stops : [], day_schedule: Array.isArray(p.daySchedule) ? p.daySchedule : [], flight_details: p.flightDetails || "", notes: p.notes || "" }, special_requests: [p.avoid, p.notes].filter(Boolean).join("\n"), status: "draft", lead_source: "website" };
  };
  const statusText = (item) => item.confirmed === true ? "Confirmed" : item.supplier_confirmed === true ? "Supplier ready" : /confirm/i.test(String(item.status || "")) ? "Unconfirmed" : item.status || "Draft";
  const dateLabel = (value) => value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(/* @__PURE__ */ new Date(`${dateOnly(value)}T12:00:00Z`)) : "Date pending";
  const routeCache = /* @__PURE__ */ new Map();
  const routeColors = ["#e64b32", "#547e67", "#376d9b", "#9a7045", "#815a91"];
  function RouteMap({ items, selected, onSelect }) {
    const node = useRef(null);
    const map = useRef(null);
    const markers = useRef([]);
    const lines = useRef([]);
    const routeKey = items.map((item) => `${item.dayNumber || "idea"}:${(coordinates(item) || []).join(",")}`).join("|");
    useEffect(() => {
      if (!node.current || !window.L) return;
      const leaflet = window.L;
      const instance = leaflet.map(node.current, { zoomControl: false, scrollWheelZoom: true }).setView([31.63, -7.98], 7);
      leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(instance);
      leaflet.control.zoom({ position: "topright" }).addTo(instance);
      map.current = instance;
      const observer = new ResizeObserver(() => instance.invalidateSize());
      observer.observe(node.current);
      return () => {
        observer.disconnect();
        instance.remove();
        map.current = null;
      };
    }, []);
    useEffect(() => {
      const instance = map.current;
      if (!instance || !window.L) return;
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      const bounds = [];
      items.forEach((item, index) => {
        const point = coordinates(item);
        if (!point) return;
        bounds.push(point);
        const icon = L.divIcon({ className: "atw-marker-shell", html: `<span class="atw-marker${selected === item.key ? " is-selected" : ""}">${index + 1}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
        const marker = L.marker(point, { icon, title: item.location_name || item.type || "Itinerary stop" }).addTo(instance);
        marker.on("click", () => onSelect(item.key));
        markers.current.push(marker);
      });
      if (bounds.length) instance.fitBounds(L.latLngBounds(bounds), { padding: [52, 52], maxZoom: bounds.length === 1 ? 12 : 9, animate: true });
      else instance.setView([31.63, -7.98], 7);
    }, [items, selected, onSelect]);
    useEffect(() => {
      let cancelled = false;
      lines.current.forEach((line) => line.remove());
      lines.current = [];
      const grouped = /* @__PURE__ */ new Map();
      items.forEach((item) => {
        const point = coordinates(item);
        if (!point) return;
        const key = item.dayNumber || 0;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(point);
      });
      Array.from(grouped.entries()).forEach(async ([day, points]) => {
        var _a, _b, _c, _d;
        if (points.length < 2) return;
        const key = points.map((point) => point.join(",")).join(";");
        let geometry = routeCache.get(key);
        if (!geometry) {
          try {
            const path = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&steps=false`);
            const result = response.ok ? await response.json() : null;
            geometry = (result == null ? void 0 : result.code) === "Ok" ? (_d = (_c = (_b = (_a = result.routes) == null ? void 0 : _a[0]) == null ? void 0 : _b.geometry) == null ? void 0 : _c.coordinates) == null ? void 0 : _d.map(([lng, lat]) => [lat, lng]) : null;
            if ((geometry == null ? void 0 : geometry.length) > 1) routeCache.set(key, geometry);
          } catch (_) {
            geometry = null;
          }
        }
        if (!cancelled && (geometry == null ? void 0 : geometry.length) > 1 && map.current) lines.current.push(L.polyline(geometry, { color: routeColors[(Number(day) - 1 + routeColors.length) % routeColors.length], weight: 5, opacity: 0.9, lineCap: "round" }).addTo(map.current));
      });
      return () => {
        cancelled = true;
        lines.current.forEach((line) => line.remove());
        lines.current = [];
      };
    }, [routeKey]);
    return /* @__PURE__ */ React.createElement("div", { className: "atw-map-area" }, /* @__PURE__ */ React.createElement("div", { ref: node, className: "atw-map", role: "img", "aria-label": `${items.filter((item) => coordinates(item)).length} mapped itinerary places` }), /* @__PURE__ */ React.createElement("div", { className: "atw-map-caption" }, /* @__PURE__ */ React.createElement("strong", null, "Trip map"), /* @__PURE__ */ React.createElement("span", null, items.filter((item) => coordinates(item)).length, " geolocated stops \xB7 Route lines appear in Daily agenda when routing data exists.")));
  }
  function OperationalContext({ item, points, suppliers, today, clock, expanded }) {
    var _a;
    const matches = points.filter((point) => {
      var _a2, _b;
      return ((_a2 = point.sourceIndex) == null ? void 0 : _a2[0]) === item.dayNumber - 1 && ((_b = point.sourceIndex) == null ? void 0 : _b[1]) === item.sourceIndex;
    });
    if (!matches.length) return null;
    const main = matches.find((point) => point.locationRole === "service") || matches[0];
    const nameFor = (id) => {
      var _a2;
      return ((_a2 = suppliers.find((value) => String(value.id) === String(id))) == null ? void 0 : _a2.name) || "";
    };
    const assignments = [["Driver", main.driverId], ["Guide", main.guideId], ["Supplier", main.supplierId]].map(([role, id]) => [role, nameFor(id)]).filter(([, name]) => name);
    const clockTime = /^\d{1,2}:\d{2}$/.test(main.time || "") ? main.time.padStart(5, "0") : "";
    const timing = main.day < today ? "Earlier" : main.day > today ? "Coming up" : clockTime && clockTime <= clock ? "Today \xB7 earlier" : "Today \xB7 next";
    const location = ((_a = matches.find((point) => point.locationRole === "service" && point.address)) == null ? void 0 : _a.address) || main.address;
    const pickup = matches.find((point) => point.locationRole === "pickup");
    const dropoff = matches.find((point) => point.locationRole === "dropoff");
    return /* @__PURE__ */ React.createElement("div", { className: "atw-operational", "aria-label": "Operational service details" }, /* @__PURE__ */ React.createElement("div", { className: "atw-operational-quick" }, /* @__PURE__ */ React.createElement("span", null, timing), /* @__PURE__ */ React.createElement("span", { className: main.confirmed ? "is-confirmed" : "is-pending" }, main.confirmed ? "Supplier confirmed" : "Confirmation pending"), /* @__PURE__ */ React.createElement("span", null, location || (pickup == null ? void 0 : pickup.address) || "Meeting point missing"), assignments.length > 0 && /* @__PURE__ */ React.createElement("span", null, assignments.map(([role, name]) => `${role}: ${name}`).join(" \xB7 "))), expanded && /* @__PURE__ */ React.createElement("dl", { className: "atw-operational-detail" }, pickup && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("dt", null, "Pickup"), /* @__PURE__ */ React.createElement("dd", null, [pickup.time, pickup.address || "Address pending"].filter(Boolean).join(" \xB7 "))), dropoff && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("dt", null, "Drop-off"), /* @__PURE__ */ React.createElement("dd", null, [dropoff.time, dropoff.address || "Address pending"].filter(Boolean).join(" \xB7 "))), location && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("dt", null, "Address"), /* @__PURE__ */ React.createElement("dd", null, location)), main.coords && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("dt", null, "Map coordinates"), /* @__PURE__ */ React.createElement("dd", null, main.coords.map((value) => value.toFixed(6)).join(", "))), assignments.map(([role, name]) => /* @__PURE__ */ React.createElement(React.Fragment, { key: role }, /* @__PURE__ */ React.createElement("dt", null, role), /* @__PURE__ */ React.createElement("dd", null, name))), main.instructions && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("dt", null, "Instructions"), /* @__PURE__ */ React.createElement("dd", null, main.instructions)), main.status && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("dt", null, "Operational status"), /* @__PURE__ */ React.createElement("dd", null, main.status))));
  }
  function DayStay({ points, date }) {
    const stay = points.find((point) => point.category === "accommodation" && point.day === date);
    if (!stay) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "atw-day-stay" }, /* @__PURE__ */ React.createElement("span", null, "STAY \xB7 ", date), /* @__PURE__ */ React.createElement("strong", null, stay.title), /* @__PURE__ */ React.createElement("small", null, stay.address || "Accommodation address pending"));
  }
  function Workspace({ bookings = [], suppliers = [], leads = [], initialBookingId, initialTab = "overview", agendaMode = false, mapPoint, operationalPoints = [], operationToday = "", operationClock = "", onViewChange, onOpenBooking, openBooking, openPdf, saveBooking, reload }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    const [bookingId, setBookingId] = useState(initialBookingId || "");
    const [tab, setTab] = useState(initialTab);
    const [selected, setSelected] = useState("");
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState({ type: "Activity", details: "", time: "", location_name: "", address: "" });
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [dragged, setDragged] = useState(null);
    const [undo, setUndo] = useState(null);
    useEffect(() => {
      if (initialBookingId) {
        setBookingId(initialBookingId);
        setTab(initialTab);
      }
    }, [initialBookingId, initialTab]);
    useEffect(() => {
      if (!bookingId && bookings.length) setBookingId(bookings[0].id);
    }, [bookings, bookingId]);
    const booking = bookings.find((value) => String(value.id) === String(bookingId));
    const days = useMemo(() => daysFor(booking), [booking]);
    const ideas = Array.isArray((_a = booking == null ? void 0 : booking.planner_preferences) == null ? void 0 : _a.unplanned_items) ? booking.planner_preferences.unplanned_items : [];
    const pendingRequests = leads.filter((lead) => {
      var _a2;
      return lead.kind === "itinerary" && !lead.routed_booking_id && Array.isArray((_a2 = lead.payload) == null ? void 0 : _a2.daily_itinerary) && lead.payload.daily_itinerary.length;
    });
    const dayIndex = tab.startsWith("day-") ? Number(tab.slice(4)) - 1 : -1;
    const shownDays = tab === "overview" ? days : dayIndex >= 0 ? days.slice(dayIndex, dayIndex + 1) : [];
    const items = tab === "unplanned" ? ideas.map((item, index) => ({ ...item, key: `idea-${index}`, sourceIndex: index })) : shownDays.flatMap((day) => day.activities.map((item, index) => ({ ...item, key: itemId(day, item, index), dayNumber: day.day, sourceIndex: index, city: item.city || day.city })));
    const viewChange = useRef(onViewChange);
    viewChange.current = onViewChange;
    useEffect(() => {
      var _a2, _b2;
      const current = items.find((item) => item.key === selected);
      (_b2 = viewChange.current) == null ? void 0 : _b2.call(viewChange, { tab, dayNumber: dayIndex + 1, sourceIndex: (_a2 = current == null ? void 0 : current.sourceIndex) != null ? _a2 : null });
    }, [bookingId, tab, selected]);
    useEffect(() => {
      var _a2, _b2;
      if (!agendaMode || !(mapPoint == null ? void 0 : mapPoint.sourceIndex) || String((_a2 = mapPoint.booking) == null ? void 0 : _a2.id) !== String(bookingId)) return;
      const [di, ai] = mapPoint.sourceIndex;
      const day = days[di];
      const activity = (_b2 = day == null ? void 0 : day.activities) == null ? void 0 : _b2[ai];
      if (day && activity) {
        setTab(`day-${day.day}`);
        setSelected(itemId(day, activity, ai));
      }
    }, [mapPoint == null ? void 0 : mapPoint.id, agendaMode, bookingId]);
    const confirmed = days.flatMap((day) => day.activities).filter((item) => item.confirmed === true).length;
    const total = days.reduce((sum, day) => sum + day.activities.length, 0);
    const notify = (text) => {
      setMessage(text);
      window.setTimeout(() => setMessage(""), 3800);
    };
    const selectItem = (key) => {
      const item = items.find((value) => value.key === key);
      if (tab === "overview" && (item == null ? void 0 : item.dayNumber)) setTab(`day-${item.dayNumber}`);
      setSelected(key);
      window.setTimeout(() => {
        var _a2;
        return (_a2 = document.getElementById(`atw-${key}`)) == null ? void 0 : _a2.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
    };
    const save = async (nextDays, nextIdeas, success, reversible = false) => {
      var _a2;
      if (!booking || busy) return false;
      setBusy(true);
      const patch = { daily_itinerary: nextDays, planner_preferences: { ...booking.planner_preferences || {}, unplanned_items: nextIdeas } };
      const response = await (saveBooking == null ? void 0 : saveBooking(booking, patch));
      setBusy(false);
      if (!response || response.error) {
        notify(((_a2 = response == null ? void 0 : response.error) == null ? void 0 : _a2.message) || "Could not save. Please try again.");
        return false;
      }
      if (reversible) setUndo({ days, ideas });
      else setUndo(null);
      await (reload == null ? void 0 : reload());
      notify(success);
      return true;
    };
    const moveItem = async (source, targetDay, targetIndex) => {
      var _a2, _b2, _c2;
      if (!source || !booking) return;
      const nextDays = days.map((day) => ({ ...day, activities: [...day.activities] }));
      const nextIdeas = [...ideas];
      let item;
      if (source.day === "unplanned") item = nextIdeas.splice(source.index, 1)[0];
      else item = (_a2 = nextDays[source.day - 1]) == null ? void 0 : _a2.activities.splice(source.index, 1)[0];
      if (!item) return;
      const normalized = { ...item, id: item.id || (((_c2 = (_b2 = window.crypto) == null ? void 0 : _b2.randomUUID) == null ? void 0 : _c2.call(_b2)) || `item-${Date.now()}`) };
      if (targetDay === "unplanned") nextIdeas.push(normalized);
      else {
        const destination = nextDays[targetDay - 1];
        if (!destination) return;
        const position = source.day === targetDay && source.index < targetIndex ? targetIndex - 1 : targetIndex;
        destination.activities.splice(Math.max(0, position), 0, normalized);
      }
      await save(nextDays, nextIdeas, "Itinerary order saved \xB7 Undo available", true);
    };
    const addItem = async () => {
      var _a2, _b2;
      if (!draft.details.trim()) return;
      const item = { ...draft, id: ((_b2 = (_a2 = window.crypto) == null ? void 0 : _a2.randomUUID) == null ? void 0 : _b2.call(_a2)) || `item-${Date.now()}`, confirmed: false, status: "Draft" };
      const nextDays = days.map((day) => ({ ...day, activities: [...day.activities] }));
      const nextIdeas = [...ideas];
      if (tab === "unplanned" || !nextDays.length) nextIdeas.push(item);
      else (nextDays[dayIndex >= 0 ? dayIndex : 0] || nextDays[0]).activities.push(item);
      if (await save(nextDays, nextIdeas, "Draft item saved")) {
        setEditing(null);
        setDraft({ type: "Activity", details: "", time: "", location_name: "", address: "" });
      }
    };
    const updateItem = async () => {
      if (!editing || editing.mode !== "edit") return;
      const nextDays = days.map((day) => ({ ...day, activities: [...day.activities] }));
      const nextIdeas = [...ideas];
      if (editing.day === "unplanned") nextIdeas[editing.index] = { ...nextIdeas[editing.index], ...draft };
      else nextDays[editing.day - 1].activities[editing.index] = { ...nextDays[editing.day - 1].activities[editing.index], ...draft };
      if (await save(nextDays, nextIdeas, "Item details saved")) setEditing(null);
    };
    const startEdit = (item, mode = "edit") => {
      var _a2;
      setEditing({ mode, day: (item == null ? void 0 : item.dayNumber) || "unplanned", index: (_a2 = item == null ? void 0 : item.sourceIndex) != null ? _a2 : -1 });
      setDraft(item ? { type: item.type || "Activity", details: publicDescription(item), time: item.time || "", location_name: item.location_name || "", address: item.address || "" } : { type: "Activity", details: "", time: "", location_name: "", address: "" });
    };
    const sourceFor = (item) => ({ day: tab === "unplanned" ? "unplanned" : item.dayNumber, index: item.sourceIndex });
    if (!booking) return /* @__PURE__ */ React.createElement("div", { className: "atw-empty" }, /* @__PURE__ */ React.createElement("h2", null, "Choose a trip to plan"), /* @__PURE__ */ React.createElement("p", null, "Saved client bookings appear here. A website itinerary request remains a request until staff creates or links its booking."), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      var _a2;
      return (_a2 = onOpenBooking || openBooking) == null ? void 0 : _a2({});
    } }, "Create booking"), pendingRequests.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "atw-request-list" }, /* @__PURE__ */ React.createElement("h3", null, "Website itinerary requests"), pendingRequests.map((lead) => /* @__PURE__ */ React.createElement("article", { key: lead.id }, /* @__PURE__ */ React.createElement("strong", null, lead.name || lead.email || "New traveler"), /* @__PURE__ */ React.createElement("span", null, lead.payload.daily_itinerary.length, " requested days \xB7 ", lead.start_date || "Dates pending"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      var _a2;
      return (_a2 = onOpenBooking || openBooking) == null ? void 0 : _a2(requestDraft(lead));
    } }, "Create draft booking")))));
    if (agendaMode) {
      const currentDay = days[dayIndex] || days[0];
      const agendaItems = currentDay ? currentDay.activities.map((item, index) => ({ ...item, key: itemId(currentDay, item, index), dayNumber: currentDay.day, sourceIndex: index, city: item.city || currentDay.city })) : [];
      return /* @__PURE__ */ React.createElement("section", { className: "atw-agenda", "aria-label": `${booking.client_name || "Client"} daily itinerary` }, /* @__PURE__ */ React.createElement("div", { className: "atw-agenda-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "atw-eyebrow" }, "DAILY ITINERARY \xB7 ", booking.reference || "DRAFT"), /* @__PURE__ */ React.createElement("h3", null, booking.client_name || "Client", "\u2019s program"), /* @__PURE__ */ React.createElement("p", null, dateLabel(booking.arrival_date), "\u2013", dateLabel(booking.departure_date), " \xB7 ", days.length, " days \xB7 ", total, " itinerary items")), /* @__PURE__ */ React.createElement("button", { onClick: () => {
        var _a2;
        return (_a2 = onOpenBooking || openBooking) == null ? void 0 : _a2(booking);
      } }, "Booking details \u2197")), /* @__PURE__ */ React.createElement("nav", { className: "atw-tabs atw-agenda-days", "aria-label": "Program days" }, days.map((day) => /* @__PURE__ */ React.createElement("button", { key: day.day, className: (currentDay == null ? void 0 : currentDay.day) === day.day ? "active" : "", "aria-current": (currentDay == null ? void 0 : currentDay.day) === day.day ? "date" : void 0, onClick: () => {
        setTab(`day-${day.day}`);
        setSelected("");
      } }, "Day ", day.day, /* @__PURE__ */ React.createElement("small", null, dateLabel(day.date))))), currentDay ? /* @__PURE__ */ React.createElement("div", { className: "atw-agenda-body" }, /* @__PURE__ */ React.createElement("div", { className: "atw-agenda-day-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "atw-eyebrow" }, dateLabel(currentDay.date), " \xB7 DAY ", currentDay.day, " OF ", days.length), /* @__PURE__ */ React.createElement("h4", null, currentDay.title || currentDay.city || `Day ${currentDay.day}`), /* @__PURE__ */ React.createElement("p", null, currentDay.summary || currentDay.city || "Daily details from the saved itinerary")), /* @__PURE__ */ React.createElement("strong", null, agendaItems.length, " ", agendaItems.length === 1 ? "stop" : "stops")), /* @__PURE__ */ React.createElement(DayStay, { points: operationalPoints, date: currentDay.date }), /* @__PURE__ */ React.createElement("div", { className: "atw-agenda-list" }, agendaItems.length ? agendaItems.map((item, index) => /* @__PURE__ */ React.createElement("article", { id: `atw-${item.key}`, key: item.key, className: `atw-agenda-stop${selected === item.key ? " is-selected" : ""}` }, /* @__PURE__ */ React.createElement("button", { className: "atw-agenda-stop-main", onClick: () => selectItem(item.key), "aria-expanded": selected === item.key }, /* @__PURE__ */ React.createElement("span", { className: "atw-agenda-time" }, item.time || String(index + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("span", { className: "atw-agenda-copy" }, /* @__PURE__ */ React.createElement("small", null, item.type || "Activity", " \xB7 ", item.city || currentDay.city || "Morocco"), /* @__PURE__ */ React.createElement("strong", null, item.location_name || item.name || item.type || "Untitled stop"), /* @__PURE__ */ React.createElement("span", null, publicDescription(item) || "Description pending")), /* @__PURE__ */ React.createElement("span", { className: `atw-status ${item.confirmed === true ? "confirmed" : "draft"}` }, statusText(item))), /* @__PURE__ */ React.createElement(OperationalContext, { item, points: operationalPoints, suppliers, today: operationToday, clock: operationClock, expanded: selected === item.key }))) : /* @__PURE__ */ React.createElement("div", { className: "atw-no-items" }, /* @__PURE__ */ React.createElement("strong", null, "No itinerary stops saved for this day"), /* @__PURE__ */ React.createElement("p", null, "Open the booking to review or add daily details.")))) : /* @__PURE__ */ React.createElement("div", { className: "atw-no-items" }, /* @__PURE__ */ React.createElement("strong", null, "No daily itinerary saved"), /* @__PURE__ */ React.createElement("p", null, "Open the booking to add a day-by-day program.")));
    }
    return /* @__PURE__ */ React.createElement("div", { className: `atw-root${agendaMode ? " atw-agenda-mode" : ""}` }, /* @__PURE__ */ React.createElement("header", { className: "atw-header" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "atw-eyebrow" }, "PRIVATE JOURNEY \xB7 ", booking.reference || "NO REFERENCE"), /* @__PURE__ */ React.createElement("h1", null, displayTitle(booking)), /* @__PURE__ */ React.createElement("p", null, booking.client_name || "Client pending", " \xB7 ", dateLabel(booking.arrival_date), "\u2013", dateLabel(booking.departure_date), " \xB7 ", (Number(booking.adults) || 0) + (Number(booking.kids) || 0), " travelers")), /* @__PURE__ */ React.createElement("div", { className: "atw-header-actions" }, /* @__PURE__ */ React.createElement("select", { "aria-label": "Select client trip", value: booking.id, onChange: (event) => {
      setBookingId(event.target.value);
      setTab("overview");
    } }, /* @__PURE__ */ React.createElement("option", { value: booking.id }, booking.client_name || displayTitle(booking)), bookings.filter((value) => value.id !== booking.id).map((value) => /* @__PURE__ */ React.createElement("option", { key: value.id, value: value.id }, value.client_name || displayTitle(value), " \xB7 ", value.reference || "Draft"))), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      var _a2;
      return (_a2 = onOpenBooking || openBooking) == null ? void 0 : _a2(booking);
    } }, "Booking details"), /* @__PURE__ */ React.createElement("button", { onClick: () => openPdf == null ? void 0 : openPdf(booking) }, "Client PDF"), /* @__PURE__ */ React.createElement("button", { className: "atw-primary", onClick: () => startEdit(null, "add") }, "Add item"))), /* @__PURE__ */ React.createElement("div", { className: "atw-main" }, /* @__PURE__ */ React.createElement(RouteMap, { items, selected, onSelect: selectItem }), /* @__PURE__ */ React.createElement("section", { className: "atw-panel" }, /* @__PURE__ */ React.createElement("nav", { className: "atw-tabs", "aria-label": "Itinerary days" }, /* @__PURE__ */ React.createElement("button", { className: tab === "overview" ? "active" : "", onClick: () => setTab("overview") }, "Overview"), days.map((day) => /* @__PURE__ */ React.createElement("button", { key: day.day, className: tab === `day-${day.day}` ? "active" : "", onClick: () => setTab(`day-${day.day}`) }, "Day ", day.day, /* @__PURE__ */ React.createElement("small", null, dateLabel(day.date)))), /* @__PURE__ */ React.createElement("button", { className: tab === "unplanned" ? "active" : "", onClick: () => setTab("unplanned") }, "Unplanned ", /* @__PURE__ */ React.createElement("small", null, ideas.length, " ideas"))), /* @__PURE__ */ React.createElement("div", { className: "atw-content" }, tab === "overview" && /* @__PURE__ */ React.createElement("section", { className: "atw-form-context", "aria-label": "Traveler brief" }, /* @__PURE__ */ React.createElement("span", { className: "atw-eyebrow" }, ((_b = booking.planner_preferences) == null ? void 0 : _b.source_request_id) ? "LAG DIN EGEN REISE \xB7 WEBSITE REQUEST" : "CLIENT TRAVEL BRIEF"), /* @__PURE__ */ React.createElement("h3", null, "Traveler brief"), /* @__PURE__ */ React.createElement("div", null, [["Travelers", `${Number(booking.adults) || 0} adults \xB7 ${Number(booking.kids) || 0} children`], ["Travel style", (_c = booking.planner_preferences) == null ? void 0 : _c.pace], ["Interests", (((_d = booking.planner_preferences) == null ? void 0 : _d.interests) || []).join(", ")], ["Accommodation", (_e = booking.planner_preferences) == null ? void 0 : _e.accommodation], ["Budget", (_f = booking.planner_preferences) == null ? void 0 : _f.budget], ["Transport", (_g = booking.planner_preferences) == null ? void 0 : _g.transport], ["Trip type", (_h = booking.planner_preferences) == null ? void 0 : _h.trip_type], ["Flight details", (_i = booking.planner_preferences) == null ? void 0 : _i.flight_details]].filter(([, value]) => value).map(([label, value]) => /* @__PURE__ */ React.createElement("p", { key: label }, /* @__PURE__ */ React.createElement("strong", null, label), /* @__PURE__ */ React.createElement("span", null, value)))), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      var _a2;
      return (_a2 = onOpenBooking || openBooking) == null ? void 0 : _a2(booking);
    } }, "Review full booking form \u2192")), tab === "overview" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "atw-section-title" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "atw-eyebrow" }, "TRIP AT A GLANCE"), /* @__PURE__ */ React.createElement("h2", null, booking.client_name ? `${booking.client_name}\u2019s itinerary` : "Trip itinerary"), /* @__PURE__ */ React.createElement("p", null, "Based on the saved booking and the website\u2019s day-by-day itinerary format."))), /* @__PURE__ */ React.createElement("div", { className: "atw-stats" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, days.length), /* @__PURE__ */ React.createElement("span", null, "Days")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, Number(booking.total_nights) || Math.max(0, days.length - 1)), /* @__PURE__ */ React.createElement("span", null, "Nights")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, new Set(days.map((day) => day.city).filter(Boolean)).size), /* @__PURE__ */ React.createElement("span", null, "Destinations")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, total), /* @__PURE__ */ React.createElement("span", null, "Services"))), /* @__PURE__ */ React.createElement("div", { className: "atw-overview-grid" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setTab(days.length ? "day-1" : "unplanned") }, /* @__PURE__ */ React.createElement("span", null, "Daily program"), /* @__PURE__ */ React.createElement("strong", null, total ? `${total} saved itinerary items` : "Start planning the days"), /* @__PURE__ */ React.createElement("small", null, "Open the timeline \u2192")), /* @__PURE__ */ React.createElement("button", { onClick: () => setTab("unplanned") }, /* @__PURE__ */ React.createElement("span", null, "Saved ideas"), /* @__PURE__ */ React.createElement("strong", null, ideas.length, " unplanned places"), /* @__PURE__ */ React.createElement("small", null, "Assign to a day \u2192")), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      var _a2;
      return (_a2 = onOpenBooking || openBooking) == null ? void 0 : _a2(booking);
    } }, /* @__PURE__ */ React.createElement("span", null, "Traveler preferences"), /* @__PURE__ */ React.createElement("strong", null, (((_j = booking.planner_preferences) == null ? void 0 : _j.interests) || []).join(", ") || booking.special_requests || "Review booking form"), /* @__PURE__ */ React.createElement("small", null, "Open booking details \u2192")), /* @__PURE__ */ React.createElement("button", { onClick: () => openPdf == null ? void 0 : openPdf(booking) }, /* @__PURE__ */ React.createElement("span", null, "Client itinerary"), /* @__PURE__ */ React.createElement("strong", null, confirmed, " of ", total, " services confirmed"), /* @__PURE__ */ React.createElement("small", null, "Preview client-safe PDF \u2192"))), /* @__PURE__ */ React.createElement("div", { className: "atw-readiness" }, /* @__PURE__ */ React.createElement("strong", null, "Operational readiness"), /* @__PURE__ */ React.createElement("p", null, booking.status || "Draft", " booking \xB7 ", total - confirmed, " services still unconfirmed. A saved item is never treated as supplier confirmation.")), pendingRequests.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "atw-pending" }, /* @__PURE__ */ React.createElement("h3", null, "Website itinerary requests"), /* @__PURE__ */ React.createElement("p", null, "These submitted plans are not bookings yet. Review each one before creating a draft booking."), pendingRequests.map((lead) => /* @__PURE__ */ React.createElement("button", { key: lead.id, onClick: () => {
      var _a2;
      return (_a2 = onOpenBooking || openBooking) == null ? void 0 : _a2(requestDraft(lead));
    } }, /* @__PURE__ */ React.createElement("strong", null, lead.name || lead.email || "New traveler"), /* @__PURE__ */ React.createElement("span", null, lead.payload.daily_itinerary.length, " proposed days \xB7 Create draft booking \u2192"))))), tab !== "overview" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "atw-section-title" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "atw-eyebrow" }, tab === "unplanned" ? "SAVED IDEAS" : dateLabel((_k = days[dayIndex]) == null ? void 0 : _k.date)), /* @__PURE__ */ React.createElement("h2", null, tab === "unplanned" ? "Unplanned places" : ((_l = days[dayIndex]) == null ? void 0 : _l.title) || ((_m = days[dayIndex]) == null ? void 0 : _m.city) || `Day ${dayIndex + 1}`), /* @__PURE__ */ React.createElement("p", null, tab === "unplanned" ? "Keep ideas here until their timing and location make sense." : ((_n = days[dayIndex]) == null ? void 0 : _n.summary) || `Day ${dayIndex + 1} of ${days.length} \xB7 ${((_o = days[dayIndex]) == null ? void 0 : _o.city) || "Destination pending"}`)), /* @__PURE__ */ React.createElement("button", { onClick: () => startEdit(null, "add") }, "Add item")), /* @__PURE__ */ React.createElement(DayStay, { points: operationalPoints, date: (_p = days[dayIndex]) == null ? void 0 : _p.date }), /* @__PURE__ */ React.createElement("div", { className: "atw-timeline" }, items.length ? items.map((item, index) => /* @__PURE__ */ React.createElement("article", { id: `atw-${item.key}`, key: item.key, className: `atw-item ${selected === item.key ? "is-selected" : ""}`, draggable: true, onDragStart: () => setDragged(sourceFor(item)), onDragOver: (event) => event.preventDefault(), onDrop: (event) => {
      event.preventDefault();
      moveItem(dragged, tab === "unplanned" ? "unplanned" : item.dayNumber, item.sourceIndex);
      setDragged(null);
    } }, /* @__PURE__ */ React.createElement("button", { className: "atw-item-main", onClick: () => selectItem(item.key) }, /* @__PURE__ */ React.createElement("span", { className: "atw-item-time" }, item.time || String(index + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("span", { className: "atw-item-copy" }, /* @__PURE__ */ React.createElement("small", null, item.type || "Activity", " \xB7 ", item.city || "Morocco"), /* @__PURE__ */ React.createElement("strong", null, item.location_name || item.name || item.type || "Untitled service"), /* @__PURE__ */ React.createElement("span", null, publicDescription(item) || "Add a client-facing description."), /* @__PURE__ */ React.createElement("em", null, item.address || "Exact location pending")), /* @__PURE__ */ React.createElement("span", { className: `atw-status ${item.confirmed === true ? "confirmed" : "draft"}` }, statusText(item))), /* @__PURE__ */ React.createElement(OperationalContext, { item, points: operationalPoints, suppliers, today: operationToday, clock: operationClock, expanded: selected === item.key }), /* @__PURE__ */ React.createElement("div", { className: "atw-item-actions" }, /* @__PURE__ */ React.createElement("button", { onClick: () => startEdit(item) }, "Details"), /* @__PURE__ */ React.createElement("label", null, "Move to ", /* @__PURE__ */ React.createElement("select", { "aria-label": `Move ${item.location_name || item.type || "item"} to day`, value: "", onChange: (event) => {
      if (event.target.value) moveItem(sourceFor(item), event.target.value === "unplanned" ? "unplanned" : Number(event.target.value), 999);
    } }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Choose\u2026"), days.map((day) => /* @__PURE__ */ React.createElement("option", { key: day.day, value: day.day }, "Day ", day.day, " \xB7 ", day.city || dateLabel(day.date))), /* @__PURE__ */ React.createElement("option", { value: "unplanned" }, "Unplanned")))))) : /* @__PURE__ */ React.createElement("div", { className: "atw-no-items" }, /* @__PURE__ */ React.createElement("strong", null, "Nothing scheduled here yet"), /* @__PURE__ */ React.createElement("p", null, "Add a draft activity, transfer, meal or stay. It will be saved to this booking."), /* @__PURE__ */ React.createElement("button", { onClick: () => startEdit(null, "add") }, "Add first item"))), /* @__PURE__ */ React.createElement("button", { className: "atw-add-row", onClick: () => startEdit(null, "add") }, "\uFF0B Add another item"))))), undo && /* @__PURE__ */ React.createElement("button", { className: "atw-undo", onClick: async () => {
      await save(undo.days, undo.ideas, "Previous order restored");
    } }, "Undo last move"), editing && /* @__PURE__ */ React.createElement("div", { className: "atw-overlay", onMouseDown: () => setEditing(null) }, /* @__PURE__ */ React.createElement("aside", { className: "atw-drawer", onMouseDown: (event) => event.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "atw-close", onClick: () => setEditing(null), "aria-label": "Close details" }, "\xD7"), /* @__PURE__ */ React.createElement("span", { className: "atw-eyebrow" }, editing.mode === "add" ? "NEW DRAFT SERVICE" : "ITINERARY DETAILS"), /* @__PURE__ */ React.createElement("h2", null, editing.mode === "add" ? "Add to itinerary" : "Edit itinerary item"), /* @__PURE__ */ React.createElement("p", null, "These fields use the existing booking itinerary structure and flow through to the client program."), /* @__PURE__ */ React.createElement("label", null, "Service type", /* @__PURE__ */ React.createElement("select", { value: draft.type, onChange: (event) => setDraft({ ...draft, type: event.target.value }) }, ["Activity", "Transport", "Accommodation", "Meal", "Free time", "Custom"].map((type) => /* @__PURE__ */ React.createElement("option", { key: type }, type)))), /* @__PURE__ */ React.createElement("label", null, "Place or service name", /* @__PURE__ */ React.createElement("input", { value: draft.location_name, onChange: (event) => setDraft({ ...draft, location_name: event.target.value }), placeholder: "e.g. Ait Ben Haddou" })), /* @__PURE__ */ React.createElement("label", null, "Start time", /* @__PURE__ */ React.createElement("input", { type: "time", value: draft.time, onChange: (event) => setDraft({ ...draft, time: event.target.value }) })), /* @__PURE__ */ React.createElement("label", null, "Address", /* @__PURE__ */ React.createElement("input", { value: draft.address, onChange: (event) => setDraft({ ...draft, address: event.target.value }), placeholder: "Exact meeting point" })), /* @__PURE__ */ React.createElement("label", null, "Client-facing description", /* @__PURE__ */ React.createElement("textarea", { rows: "5", value: draft.details, onChange: (event) => setDraft({ ...draft, details: event.target.value }), placeholder: "What will travelers do or see?" })), /* @__PURE__ */ React.createElement("div", { className: "atw-drawer-note" }, "Status remains a draft. Confirm the service through the booking\u2019s operational fields after checking with the supplier."), /* @__PURE__ */ React.createElement("button", { className: "atw-primary", disabled: busy || !draft.details.trim(), onClick: editing.mode === "add" ? addItem : updateItem }, busy ? "Saving\u2026" : "Save itinerary item"), editing.mode === "edit" && /* @__PURE__ */ React.createElement("button", { className: "atw-secondary", onClick: () => {
      var _a2;
      setEditing(null);
      (_a2 = onOpenBooking || openBooking) == null ? void 0 : _a2(booking);
    } }, "Open full booking form"))), message && /* @__PURE__ */ React.createElement("div", { className: "atw-toast", role: "status" }, message));
  }
  window.MS_TripPlanner = Workspace;
})();
