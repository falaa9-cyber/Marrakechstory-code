(function() {
  const { useEffect, useMemo, useRef, useState } = React;
  const itemId = (day, item, index) => String(item.id || item.reference || `${day.day || 1}-${index}-${String(item.details || item.type || "item").slice(0, 24)}`);
  const daysBetween = (a, b) => !a || !b ? 0 : Math.max(0, Math.round((new Date(b) - new Date(a)) / 864e5));
  const safeDays = (b) => Array.isArray(b && b.daily_itinerary) ? b.daily_itinerary : [];
  const bookingTitle = (b) => b.title || b.trip_title || b.name || [b.first_name, b.last_name].filter(Boolean).join(" ") || "MarrakechStory trip";
  const itemView = (day, item, index) => {
    const c = item.coordinates || item.location || {};
    return { ...item, id: itemId(day, item, index), name: item.name || item.title || item.type || "Itinerary item", category: item.category || item.type || "Activity", description: item.details || item.description || item.notes || "", city: item.city || day.city || "", time: item.time || "", end: item.end_time || item.end || "", lat: Number(item.lat || item.latitude || c.lat), lng: Number(item.lng || item.longitude || c.lng), status: item.status || (item.confirmed ? "Confirmed" : "Draft") };
  };
  function TripMap({ items, selected, onSelect }) {
    const el = useRef(null), map = useRef(null), layers = useRef([]);
    useEffect(() => {
      if (!el.current || map.current || !window.L) return;
      map.current = L.map(el.current, { zoomControl: false, scrollWheelZoom: true }).setView([31.63, -7.98], 7);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(map.current);
      L.control.zoom({ position: "topright" }).addTo(map.current);
      return () => {
        map.current && map.current.remove();
        map.current = null;
      };
    }, []);
    useEffect(() => {
      if (!map.current) return;
      layers.current.forEach((x) => x.remove());
      layers.current = [];
      const points = items.filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng)).map((x) => [x.lat, x.lng]);
      if (points.length > 1) layers.current.push(L.polyline(points, { color: "#e1432a", weight: 5, opacity: 0.88, lineCap: "round" }).addTo(map.current));
      items.forEach((it, i) => {
        if (!Number.isFinite(it.lat) || !Number.isFinite(it.lng)) return;
        const html = `<div class="tp-map-pin ${selected === it.id ? "selected" : ""}">${i + 1}</div>`;
        const m = L.marker([it.lat, it.lng], { icon: L.divIcon({ html, className: "tp-map-marker", iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(map.current);
        m.on("click", () => onSelect(it.id));
        layers.current.push(m);
      });
      if (points.length) map.current.fitBounds(L.latLngBounds(points), { padding: [45, 45], maxZoom: points.length === 1 ? 12 : 9, animate: true });
    }, [items, selected, onSelect]);
    return /* @__PURE__ */ React.createElement("div", { className: "tp-map-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "tp-map-tools" }, /* @__PURE__ */ React.createElement("span", null, "Route"), /* @__PURE__ */ React.createElement("span", null, "Hotels"), /* @__PURE__ */ React.createElement("span", null, "Activities")), /* @__PURE__ */ React.createElement("div", { ref: el, className: "tp-map", "aria-label": "Trip route map", role: "application" }), /* @__PURE__ */ React.createElement("div", { className: "tp-route-legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", null), " Saved itinerary route"), /* @__PURE__ */ React.createElement("span", null, "Click a marker to focus")));
  }
  function ItemCard({ item, selected, onSelect, onToggleStatus, onDragStart, onDrop }) {
    return /* @__PURE__ */ React.createElement("article", { id: `item-${item.id}`, draggable: true, className: `tp-item ${selected ? "selected" : ""}`, onDragStart: () => onDragStart(item.id), onDragOver: (e) => e.preventDefault(), onDrop: () => onDrop(item.id), onClick: () => onSelect(item.id), tabIndex: "0" }, /* @__PURE__ */ React.createElement("div", { className: "tp-time" }, /* @__PURE__ */ React.createElement("strong", null, item.time || "\u2014"), /* @__PURE__ */ React.createElement("span", null, item.end || ""), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("div", { className: "tp-item-copy" }, /* @__PURE__ */ React.createElement("div", { className: "tp-category" }, item.category), /* @__PURE__ */ React.createElement("h3", null, item.name), /* @__PURE__ */ React.createElement("p", null, item.description || "No client-facing details saved yet."), /* @__PURE__ */ React.createElement("span", { className: "tp-location" }, "\u2316 ", item.city || "Location pending")), /* @__PURE__ */ React.createElement("div", { className: "tp-item-actions" }, /* @__PURE__ */ React.createElement("button", { className: `tp-status ${String(item.status).toLowerCase().replaceAll(" ", "-")}`, onClick: (e) => {
      e.stopPropagation();
      onToggleStatus(item.id);
    } }, item.status), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u22EF")));
  }
  function Planner({ bookings = [], suppliers = [], openBooking, saveBooking, reload }) {
    var _a, _b, _c;
    const [bookingId, setBookingId] = useState(bookings[0] && bookings[0].id);
    const [active, setActive] = useState("overview");
    const [selected, setSelected] = useState("");
    const [busy, setBusy] = useState(false);
    const [drawer, setDrawer] = useState(false);
    const [toast, setToast] = useState("");
    const [draft, setDraft] = useState({ type: "Activity", details: "", time: "" });
    useEffect(() => {
      if (!bookingId && bookings[0]) setBookingId(bookings[0].id);
      if (bookingId && !bookings.some((b) => b.id === bookingId)) setBookingId(bookings[0] && bookings[0].id);
    }, [bookings, bookingId]);
    const booking = bookings.find((b) => b.id === bookingId) || bookings[0];
    const days = safeDays(booking).map((d, i) => ({ ...d, day: d.day || i + 1 }));
    const tabs = [{ id: "overview", label: "Overview" }, ...days.map((d) => ({ id: `day-${d.day}`, label: `Day ${d.day}` })), { id: "unplanned", label: "Unplanned" }];
    const itemsByDay = useMemo(() => Object.fromEntries(days.map((d) => [`day-${d.day}`, (d.activities || []).map((x, i) => itemView(d, x, i))])), [bookingId, JSON.stringify(days)]);
    const currentItems = active === "overview" ? Object.values(itemsByDay).flat() : itemsByDay[active] || [];
    const notify = (m) => {
      setToast(m);
      window.setTimeout(() => setToast(""), 2800);
    };
    const select = (id) => {
      setSelected(id);
      requestAnimationFrame(() => {
        var _a2;
        return (_a2 = document.getElementById(`item-${id}`)) == null ? void 0 : _a2.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };
    const persist = async (next, msg) => {
      if (!booking || !saveBooking) return;
      setBusy(true);
      const r = await saveBooking(booking, { daily_itinerary: next });
      setBusy(false);
      if (r && r.error) notify(r.error.message || "Could not save itinerary");
      else {
        await (reload == null ? void 0 : reload());
        notify(msg || "Saved");
      }
    };
    const toggleStatus = async (id) => {
      const next = days.map((d) => ({ ...d, activities: (d.activities || []).map((x, i) => itemId(d, x, i) === id ? { ...x, status: String(x.status || "").toLowerCase() === "confirmed" ? "Draft" : "Confirmed", confirmed: String(x.status || "").toLowerCase() !== "confirmed" } : x) }));
      await persist(next, "Confirmation status saved");
    };
    const addItem = async () => {
      if (!draft.details.trim() || !booking) return;
      const target = days.find((d) => `day-${d.day}` === active) || days[0] || { day: 1, date: booking.arrival_date || "", city: "", activities: [] };
      const next = days.map((d) => d.day === target.day ? { ...d, activities: [...d.activities || [], { type: draft.type, details: draft.details.trim(), time: draft.time, status: "Draft", confirmed: false }] } : d);
      if (!days.length) next.push({ ...target, activities: [{ type: draft.type, details: draft.details.trim(), time: draft.time, status: "Draft", confirmed: false }] });
      await persist(next, "Draft item added");
      setDraft({ type: "Activity", details: "", time: "" });
      setDrawer(false);
    };
    const move = async (fromId, toId) => {
      if (!fromId || fromId === toId) return;
      let moved;
      const next = days.map((d) => ({ ...d, activities: (d.activities || []).filter((x, i) => {
        if (itemId(d, x, i) === fromId) {
          moved = x;
          return false;
        }
        return true;
      }) }));
      if (!moved) return;
      const target = next.find((d) => (d.activities || []).some((x, i) => itemId(d, x, i) === toId));
      if (target) target.activities.splice(target.activities.findIndex((x, i) => itemId(target, x, i) === toId), 0, moved);
      await persist(next, "Itinerary order saved");
    };
    const overview = /* @__PURE__ */ React.createElement("div", { className: "tp-overview" }, /* @__PURE__ */ React.createElement("p", { className: "tp-eyebrow" }, "Trip overview"), /* @__PURE__ */ React.createElement("h2", null, bookingTitle(booking)), /* @__PURE__ */ React.createElement("p", null, booking.special_requests || booking.notes || "Build a clear, operationally ready Morocco journey from the saved booking."), /* @__PURE__ */ React.createElement("div", { className: "tp-stats" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, days.length), /* @__PURE__ */ React.createElement("span", null, "Days")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, daysBetween(booking.arrival_date, booking.departure_date)), /* @__PURE__ */ React.createElement("span", null, "Nights")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, new Set(days.map((d) => d.city).filter(Boolean)).size), /* @__PURE__ */ React.createElement("span", null, "Destinations")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, currentItems.length), /* @__PURE__ */ React.createElement("span", null, "Items"))), /* @__PURE__ */ React.createElement("div", { className: "tp-overview-grid" }, /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "Readiness"), /* @__PURE__ */ React.createElement("p", null, currentItems.filter((x) => String(x.status).toLowerCase() === "confirmed").length, " of ", currentItems.length, " itinerary items confirmed"), /* @__PURE__ */ React.createElement("progress", { value: currentItems.filter((x) => String(x.status).toLowerCase() === "confirmed").length, max: currentItems.length || 1 })), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "Booking status"), /* @__PURE__ */ React.createElement("p", null, booking.status || "Draft", " \xB7 ", booking.reference || "No reference")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "Travelers"), /* @__PURE__ */ React.createElement("p", null, booking.travelers || (+booking.adults || 0) + (+booking.kids || 0) || "\u2014", " travelers")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "Operations"), /* @__PURE__ */ React.createElement("p", null, suppliers.length, " suppliers available \xB7 confirmations remain explicit"))));
    if (!booking) return /* @__PURE__ */ React.createElement("div", { className: "tp-empty" }, /* @__PURE__ */ React.createElement("h2", null, "No saved trips yet"), /* @__PURE__ */ React.createElement("p", null, "Create or open a booking first. This planner reads the canonical booking and daily itinerary records."));
    return /* @__PURE__ */ React.createElement("div", { className: "tp-app" }, /* @__PURE__ */ React.createElement("main", null, /* @__PURE__ */ React.createElement("header", { className: "tp-header" }, /* @__PURE__ */ React.createElement("div", { className: "tp-trip-id" }, /* @__PURE__ */ React.createElement("span", null, "Private trip \xB7 ", booking.reference || booking.id), /* @__PURE__ */ React.createElement("h1", null, bookingTitle(booking))), /* @__PURE__ */ React.createElement("div", { className: "tp-meta" }, /* @__PURE__ */ React.createElement("span", null, "\u25A3 ", booking.arrival_date || "\u2014", " \u2192 ", booking.departure_date || "\u2014"), /* @__PURE__ */ React.createElement("span", null, "\u2659 ", booking.travelers || (+booking.adults || 0) + (+booking.kids || 0) || "\u2014", " travelers")), /* @__PURE__ */ React.createElement("div", { className: "tp-head-actions" }, /* @__PURE__ */ React.createElement("select", { value: booking.id, onChange: (e) => {
      setBookingId(e.target.value);
      setActive("overview");
    }, "aria-label": "Select booking" }, bookings.map((b) => /* @__PURE__ */ React.createElement("option", { value: b.id, key: b.id }, bookingTitle(b)))), /* @__PURE__ */ React.createElement("button", { onClick: () => openBooking == null ? void 0 : openBooking(booking) }, "Edit booking"), /* @__PURE__ */ React.createElement("button", { onClick: () => notify("Use the booking export to create the current client-safe PDF") }, "Export PDF"), /* @__PURE__ */ React.createElement("button", { className: "primary", onClick: () => setDrawer(true) }, "\uFF0B Add item"))), /* @__PURE__ */ React.createElement("div", { className: "tp-workspace" }, /* @__PURE__ */ React.createElement(TripMap, { items: currentItems, selected, onSelect: select }), /* @__PURE__ */ React.createElement("section", { className: "tp-panel" }, /* @__PURE__ */ React.createElement("div", { className: "tp-tabs", role: "tablist" }, tabs.map((d) => /* @__PURE__ */ React.createElement("button", { role: "tab", "aria-selected": active === d.id, className: active === d.id ? "active" : "", onClick: () => setActive(d.id), key: d.id }, d.label))), /* @__PURE__ */ React.createElement("div", { className: "tp-panel-body" }, active === "overview" ? overview : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "tp-day-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "tp-eyebrow" }, ((_a = days.find((d) => `day-${d.day}` === active)) == null ? void 0 : _a.date) || "Unplanned ideas"), /* @__PURE__ */ React.createElement("h2", null, active === "unplanned" ? "Unplanned places" : ((_b = days.find((d) => `day-${d.day}` === active)) == null ? void 0 : _b.city) || active.replace("day-", "Day ")), /* @__PURE__ */ React.createElement("p", null, ((_c = days.find((d) => `day-${d.day}` === active)) == null ? void 0 : _c.summary) || "Saved operational items for this part of the journey.")), /* @__PURE__ */ React.createElement("button", { className: "tp-add-small", onClick: () => setDrawer(true) }, "\uFF0B Add item")), /* @__PURE__ */ React.createElement("div", { className: "tp-timeline" }, currentItems.length ? currentItems.map((item) => /* @__PURE__ */ React.createElement(ItemCard, { key: item.id, item, selected: selected === item.id, onSelect: select, onToggleStatus: toggleStatus, onDragStart: setSelected, onDrop: (id) => move(selected, id) })) : /* @__PURE__ */ React.createElement("div", { className: "tp-empty-inline" }, "No items saved for this view. Add a draft item to begin."))))))), drawer && /* @__PURE__ */ React.createElement("div", { className: "tp-drawer-backdrop", onMouseDown: () => setDrawer(false) }, /* @__PURE__ */ React.createElement("aside", { className: "tp-drawer", onMouseDown: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "tp-close", onClick: () => setDrawer(false) }, "\xD7"), /* @__PURE__ */ React.createElement("p", { className: "tp-eyebrow" }, "Add to ", active === "overview" ? "the first day" : active), /* @__PURE__ */ React.createElement("h2", null, "Add a saved itinerary item"), /* @__PURE__ */ React.createElement("label", null, "Type", /* @__PURE__ */ React.createElement("select", { value: draft.type, onChange: (e) => setDraft({ ...draft, type: e.target.value }) }, /* @__PURE__ */ React.createElement("option", null, "Activity"), /* @__PURE__ */ React.createElement("option", null, "Accommodation"), /* @__PURE__ */ React.createElement("option", null, "Transport"), /* @__PURE__ */ React.createElement("option", null, "Meal"), /* @__PURE__ */ React.createElement("option", null, "Free time"))), /* @__PURE__ */ React.createElement("label", null, "Time", /* @__PURE__ */ React.createElement("input", { value: draft.time, placeholder: "09:00", onChange: (e) => setDraft({ ...draft, time: e.target.value }) })), /* @__PURE__ */ React.createElement("label", null, "Details", /* @__PURE__ */ React.createElement("textarea", { value: draft.details, placeholder: "Operational details, address or client-facing description", onChange: (e) => setDraft({ ...draft, details: e.target.value }) })), /* @__PURE__ */ React.createElement("button", { className: "primary", disabled: busy || !draft.details.trim(), onClick: addItem }, busy ? "Saving\u2026" : "Save draft item"))), toast && /* @__PURE__ */ React.createElement("div", { className: "tp-toast", role: "status" }, "\u2713 ", toast));
  }
  window.MS_TripPlanner = Planner;
  if (document.getElementById("ms-trip-planner")) ReactDOM.createRoot(document.getElementById("ms-trip-planner")).render(/* @__PURE__ */ React.createElement(Planner, { bookings: [] }));
})();
