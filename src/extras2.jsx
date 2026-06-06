// ============================================
// Chatbot + Cookies banner + Profile dashboard
// All client-side, no API calls, no tracking.
// ============================================
const { useState: useStateE2, useEffect: useEffectE2, useRef: useRefE2 } = React;

// ──────────────────────────────────────────────────────────────
// COOKIE BANNER — accept / decline, persists in localStorage
// ──────────────────────────────────────────────────────────────
const COOKIE_KEY = 'ms_cookie_choice';

function CookieBanner() {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : lang === 'da' ? (no || en) : en;
  const [open, setOpen] = useStateE2(false);
  useEffectE2(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      // small delay so it doesn't compete with page entry
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);
  const choose = (choice) => {
    localStorage.setItem(COOKIE_KEY, choice);
    setOpen(false);
  };
  if (!open) return null;
  return (
    <div className="ms-cookie-banner" role="dialog" aria-label="Cookies">
      <div className="ms-cookie-inner">
        <div className="ms-cookie-text">
          <strong>{tx('We use cookies', 'Vi bruker cookies', 'Nous utilisons des cookies')}</strong>
          <p>{tx(
            "We use a few small files to remember your language, your bookings, and how you use the site. You can say no — the site will still work.",
            "Vi bruker noen små filer for å huske språket ditt, bestillingene dine og hvordan du bruker siden. Du kan si nei — siden fungerer fortsatt.",
            "Nous utilisons quelques petits fichiers pour mémoriser votre langue, vos réservations et votre utilisation du site. Vous pouvez refuser — le site fonctionnera quand même."
          )}</p>
        </div>
        <div className="ms-cookie-actions">
          <button className="btn btn-outline ms-cookie-btn" onClick={() => choose('declined')}>
            {tx('No, thanks', 'Nei takk', 'Non merci')}
          </button>
          <button className="btn btn-primary ms-cookie-btn" onClick={() => choose('accepted')}>
            {tx('Accept', 'Godta', 'Accepter')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CHATBOT — pre-canned answers from site content
// Floating bubble on bottom-right above the Instagram widget.
// ──────────────────────────────────────────────────────────────
const FAQ = {
  en: [
    { q: "How do I book a trip?", a: "Pick an itinerary you like and tap 'Plan this trip', or fill in the form at the bottom. We reply within 24 hours by email or WhatsApp." },
    { q: "What does the price include?", a: "Each itinerary lists what's included (driver, hotels, some meals) and what's not (flights, drinks, tips). Open any trip and scroll to the 'Included' box." },
    { q: "Can you change the trip for me?", a: "Yes — every itinerary is a starting point. We change hotels, pace, length and stops to fit you. Just tell us in the form." },
    { q: "How do I pay?", a: "30% to confirm the booking. The rest 30 days before you travel. We send a safe payment link." },
    { q: "Can I cancel?", a: "Free cancel up to 30 days before. 50% from 30 to 14 days. No refund inside 14 days." },
    { q: "How many people can join?", a: "Minimum 2. Children from 6 unless we say otherwise. Bigger groups — just ask." },
    { q: "Do you handle flights?", a: "We don't sell flights, but we help you find the best route and time. Direct from Oslo to Marrakech runs Nov–Apr." },
    { q: "Where are you based?", a: "In Marrakech. Norwegian-Moroccan team. We answer on WhatsApp from 09 to 22 every day: +47 457 74 743." },
    { q: "Is travel insurance included?", a: "No — we strongly suggest you take one. We can point you to a partner." },
    { q: "Do you speak Norwegian?", a: "Yes. Aladdin (the founder) is Norwegian-Moroccan. Email, WhatsApp and call in Norwegian, English or French." },
  ],
  no: [
    { q: "Hvordan bestiller jeg en tur?", a: "Velg en reise du liker og trykk 'Planlegg denne turen', eller fyll ut skjemaet nederst. Vi svarer innen 24 timer på e-post eller WhatsApp." },
    { q: "Hva er inkludert i prisen?", a: "Hver reise viser hva som er med (sjåfør, hoteller, noen måltider) og hva som ikke er det (fly, drikke, tips). Åpne en reise og se 'Inkludert'-boksen." },
    { q: "Kan dere tilpasse reisen?", a: "Ja — hver reise er et utgangspunkt. Vi endrer hoteller, tempo, lengde og stopp etter deg. Skriv det i skjemaet." },
    { q: "Hvordan betaler jeg?", a: "30 % for å bekrefte. Resten 30 dager før avreise. Vi sender en trygg betalingslenke." },
    { q: "Kan jeg avbestille?", a: "Gratis inntil 30 dager før. 50 % fra 30 til 14 dager. Ingen refusjon innen 14 dager." },
    { q: "Hvor mange kan være med?", a: "Minimum 2. Barn fra 6 år dersom ikke annet er sagt. Større grupper — bare spør." },
    { q: "Ordner dere fly?", a: "Vi selger ikke fly, men hjelper deg finne beste rute og tid. Direkterute Oslo–Marrakech går nov–april." },
    { q: "Hvor holder dere til?", a: "I Marrakech. Norsk-marokkansk team. Vi svarer på WhatsApp 09–22 hver dag: +47 457 74 743." },
    { q: "Er reiseforsikring med?", a: "Nei — vi anbefaler sterkt at du tegner en. Vi kan peke deg mot en partner." },
    { q: "Snakker dere norsk?", a: "Ja. Aladdin (gründeren) er norsk-marokkansk. E-post, WhatsApp og samtale på norsk, engelsk eller fransk." },
  ],
  fr: [
    { q: "Comment réserver un voyage ?", a: "Choisissez un itinéraire et appuyez sur 'Planifier ce voyage', ou remplissez le formulaire en bas. Réponse sous 24 h par e-mail ou WhatsApp." },
    { q: "Que comprend le prix ?", a: "Chaque itinéraire indique ce qui est inclus (chauffeur, hôtels, certains repas) et ce qui ne l'est pas (vols, boissons, pourboires)." },
    { q: "Pouvez-vous adapter le voyage ?", a: "Oui — chaque itinéraire est un point de départ. On change hôtels, rythme, durée, étapes." },
    { q: "Comment je paie ?", a: "30 % pour confirmer. Le solde 30 jours avant le départ. Lien de paiement sécurisé." },
    { q: "Puis-je annuler ?", a: "Annulation gratuite jusqu'à 30 jours avant. 50 % entre 30 et 14 jours. Aucun remboursement à moins de 14 jours." },
    { q: "Combien de personnes ?", a: "Minimum 2. Enfants à partir de 6 ans sauf indication. Grands groupes — demandez." },
    { q: "Gérez-vous les vols ?", a: "Non, mais nous vous aidons à trouver la meilleure route. Direct Oslo-Marrakech nov–avril." },
    { q: "Où êtes-vous ?", a: "À Marrakech. Équipe norvégienne-marocaine. WhatsApp 9 h – 22 h tous les jours : +47 457 74 743." },
    { q: "L'assurance est-elle incluse ?", a: "Non — fortement recommandée. Nous pouvons vous orienter." },
    { q: "Parlez-vous français ?", a: "Oui. Norvégien, anglais, français — par e-mail, WhatsApp ou téléphone." },
  ],
};

function Chatbot() {
  const { useMS, COMPANY } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : lang === 'da' ? (no || en) : en;
  const [open, setOpen] = useStateE2(false);
  const [messages, setMessages] = useStateE2([
    { from: 'bot', text: tx(
      "Hi! I'm the Marrakechstory helper. Ask me anything — or pick a question below.",
      "Hei! Jeg er Marrakechstory-hjelperen. Spør om hva som helst — eller velg et spørsmål.",
      "Bonjour ! Je suis l'assistant Marrakechstory. Posez-moi une question — ou choisissez-en une."
    ) },
  ]);
  const [input, setInput] = useStateE2('');
  const endRef = useRefE2(null);
  const faq = FAQ[lang === 'no' ? 'no' : lang === 'fr' ? 'fr' : 'en'];

  useEffectE2(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text) => {
    if (!text || !text.trim()) return;
    const userMsg = { from: 'user', text };
    // Find best FAQ match by keyword overlap
    const lowered = text.toLowerCase();
    const scored = faq.map(item => {
      const words = item.q.toLowerCase().split(/\W+/).concat(item.a.toLowerCase().split(/\W+/));
      const score = words.filter(w => w.length > 3 && lowered.includes(w)).length;
      return { item, score };
    }).sort((a, b) => b.score - a.score);
    const best = scored[0];
    let reply;
    if (best.score === 0) {
      reply = tx(
        "I'll send your question to the team — they answer within 24 h. Or WhatsApp us right away: +47 457 74 743.",
        "Jeg sender spørsmålet ditt til teamet — de svarer innen 24 t. Eller WhatsApp oss med en gang: +47 457 74 743.",
        "Je transmets votre question à l'équipe — réponse sous 24 h. Ou WhatsApp tout de suite : +47 457 74 743."
      );
    } else {
      reply = best.item.a;
    }
    setMessages(m => [...m, userMsg, { from: 'bot', text: reply }]);
    setInput('');
  };

  return (
    <>
      <button className={`ms-chat-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={tx('Open chat', 'Åpne chat', 'Ouvrir le chat')}>
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          // Gemini-style 4-point sparkle
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2 L13.6 9.1 Q13.9 10.3 15 10.6 L22 12 L15 13.4 Q13.9 13.7 13.6 14.9 L12 22 L10.4 14.9 Q10.1 13.7 9 13.4 L2 12 L9 10.6 Q10.1 10.3 10.4 9.1 Z"/>
            <circle cx="19.5" cy="4.5" r="1.5"/>
            <circle cx="5" cy="19" r="1"/>
          </svg>
        )}
      </button>
      {open && (
        <div className="ms-chat-panel" role="dialog">
          <div className="ms-chat-head">
            <div>
              <strong>{tx('Marrakechstory helper', 'Marrakechstory-hjelper', 'Assistant Marrakechstory')}</strong>
              <div className="ms-chat-sub">{tx('Usually replies in seconds', 'Svarer som regel på sekunder', 'Réponse en quelques secondes')}</div>
            </div>
            <button className="ms-chat-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <div className="ms-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ms-chat-msg ${m.from}`}>{m.text}</div>
            ))}
            <div ref={endRef} />
          </div>
          {messages.length < 3 && (
            <div className="ms-chat-suggestions">
              {faq.slice(0, 5).map((f, i) => (
                <button key={i} className="ms-chat-suggestion" onClick={() => send(f.q)}>{f.q}</button>
              ))}
            </div>
          )}
          <form className="ms-chat-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={tx('Type a question…', 'Skriv et spørsmål …', 'Posez une question …')} />
            <button type="submit" aria-label="Send">→</button>
          </form>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// PROFILE DASHBOARD — visible when logged in
// Saves favourites, draft form, basic profile data in localStorage
// ──────────────────────────────────────────────────────────────
const PROFILE_KEY = 'ms_profile_data';
const FAVS_KEY = 'ms_user_favs';

function readProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
}
function writeProfile(p) { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }
function readFavs() {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'); } catch { return []; }
}

function ProfilePanel({ user, onClose, onLogout }) {
  const { useMS } = window.MS_CTX;
  const ctx = useMS();
  const lang = ctx.lang || 'no';
  const tx = (en, no, fr, sv) => lang === 'no' ? no : lang === 'fr' ? fr : lang === 'sv' ? (sv || no || en) : lang === 'da' ? (no || en) : en;
  const [profile, setProfile] = useStateE2(() => ({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    travellers: '',
    interests: '',
    ...readProfile(),
  }));
  const [tab, setTab] = useStateE2('overview');

  // ---- Client portal: real bookings + message thread from Supabase ----
  const [myBookings, setMyBookings] = useStateE2(null);
  const [msgs, setMsgs] = useStateE2([]);
  const [draft, setDraft] = useStateE2('');
  const [loadingPortal, setLoadingPortal] = useStateE2(false);
  const [openItin, setOpenItin] = useStateE2({});
  const ST_LABEL = { new: tx('Received', 'Mottatt', 'Reçu'), quotation_sent: tx('Quote sent', 'Tilbud sendt', 'Devis envoyé'), waiting_confirmation: tx('Awaiting', 'Avventer', 'En attente'), confirmed: tx('Confirmed', 'Bekreftet', 'Confirmé'), deposit_paid: tx('Deposit paid', 'Depositum betalt', 'Acompte payé'), fully_paid: tx('Fully paid', 'Fullt betalt', 'Payé'), ongoing: tx('Ongoing', 'Pågår', 'En cours'), completed: tx('Completed', 'Fullført', 'Terminé'), cancelled: tx('Cancelled', 'Avbrutt', 'Annulé') };
  const fmtD = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString(lang === 'no' ? 'no-NO' : lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };
  const krf = (n) => (Number(n) || 0).toLocaleString('en-US') + ' kr';
  const loadPortal = async () => {
    const SB = window.MS_SB; if (!SB) return; setLoadingPortal(true);
    try {
      const [b, m] = await Promise.all([
        SB.from('bookings').select('*').order('arrival_date', { ascending: true }),
        SB.from('messages').select('*').order('created_at', { ascending: true }),
      ]);
      setMyBookings(b.data || []); setMsgs(m.data || []);
      const unread = (m.data || []).filter(x => x.sender === 'admin' && !x.read_by_client).map(x => x.id);
      if (unread.length) SB.from('messages').update({ read_by_client: true }).in('id', unread);
    } catch (e) { setMyBookings([]); }
    setLoadingPortal(false);
  };
  useEffectE2(() => { loadPortal(); }, []);
  // Printable / downloadable invoice + itinerary (opens a clean window → Save as PDF)
  const docCss = 'body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1310;margin:0;background:#f4f1ec}.w{max-width:720px;margin:0 auto;background:#fff;padding:34px 40px}.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #e0432a;padding-bottom:16px;margin-bottom:22px}.br{font-size:24px;font-weight:800;color:#e0432a;letter-spacing:-.02em}.muted{color:#8a7d70;font-size:12px}h1{font-size:18px;margin:0 0 4px}h3{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#e0432a;margin:20px 0 8px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;padding:8px 0;border-bottom:1px solid #eee}.r{text-align:right}.tot{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}.tot.bal{border-top:2px solid #1a1310;margin-top:6px;padding-top:10px;font-weight:800;font-size:16px}.badge{display:inline-block;background:#fbe7e1;color:#c23a23;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700}.day{display:flex;gap:12px;padding:9px 0;border-bottom:1px solid #f0f0f0}.dn{width:30px;height:30px;border-radius:50%;background:#e0432a;color:#fff;text-align:center;line-height:30px;font-weight:700;flex:0 0 30px}@media print{body{background:#fff}.w{padding:0}}';
  const openDoc = (title, inner) => {
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${docCss}</style></head><body><div class="w">${inner}</div><script>setTimeout(function(){window.print()},350)<\/script></body></html>`);
    w.document.close();
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const printInvoice = (b) => {
    const sub = Number(b.selling_price) || 0, paid = Number(b.paid_amount || b.deposit_amount) || 0, bal = Number(b.balance) || (sub - paid);
    const inner = `<div class="hd"><div><div class="br">MarrakechStory</div><div class="muted">Bespoke Travel Experiences</div></div><div class="r"><h1>${tx('INVOICE','FAKTURA','FACTURE')}</h1><div class="muted">${tx('Ref','Ref','Réf')}: ${esc(b.reference || '—')}<br>${fmtD(new Date().toISOString())}</div></div></div>
      <h3>${tx('Billed to','Fakturert til','Facturé à')}</h3><div><strong>${esc(b.client_name || user.name || '')}</strong><br><span class="muted">${esc(user.email || b.email || '')}</span></div>
      <h3>${tx('Trip','Reise','Voyage')}</h3><table><tr><th>${tx('Description','Beskrivelse','Description')}</th><th class="r">${tx('Amount','Beløp','Montant')}</th></tr>
      <tr><td><strong>${tx('Bespoke Travel Package','Skreddersydd reisepakke','Forfait sur mesure')}</strong><br><span class="muted">${esc((b.arrival_city||'Marrakech')+' → '+(b.departure_city||'Marrakech'))} · ${(b.total_nights||0)} ${tx('nights','netter','nuits')} · ${(b.adults||0)+(b.kids||0)} ${tx('travellers','reisende','voyageurs')}</span><br><span class="muted">${fmtD(b.arrival_date)} → ${fmtD(b.departure_date)}</span></td><td class="r">${krf(sub)}</td></tr></table>
      <div style="margin-top:14px"><div class="tot"><span class="muted">${tx('Subtotal','Subtotal','Sous-total')}</span><span>${krf(sub)}</span></div><div class="tot"><span class="muted">${tx('Paid','Betalt','Payé')}</span><span>-${krf(paid)}</span></div><div class="tot bal"><span>${tx('Balance due','Restbeløp','Solde dû')}</span><span>${krf(bal)}</span></div></div>
      <h3>${tx('Status','Status','Statut')}</h3><span class="badge">${esc(ST_LABEL[b.status] || b.status)}</span>
      <p class="muted" style="margin-top:24px">${tx('For bank transfer details please contact us on WhatsApp +212 …. Thank you for travelling with MarrakechStory.','For bankoverføringsdetaljer, kontakt oss på WhatsApp. Takk for at du reiser med MarrakechStory.','Pour les coordonnées bancaires, contactez-nous sur WhatsApp. Merci de voyager avec MarrakechStory.')}</p>`;
    openDoc('Invoice ' + (b.reference || ''), inner);
  };
  const printItinerary = (b) => {
    const itin = Array.isArray(b.daily_itinerary) ? b.daily_itinerary : [];
    const days = itin.map((d, i) => `<div class="day"><div class="dn">${d.day || i + 1}</div><div><strong>${esc(d.city || (tx('Day','Dag','Jour')+' '+(d.day||i+1)))}</strong>${(d.activities||[]).map(a => `<div class="muted" style="color:#5b4f44">${a.time?esc(a.time)+' · ':''}${esc(a.type||'')}${a.details?' — '+esc(a.details):''}</div>`).join('')}</div></div>`).join('');
    const inner = `<div class="hd"><div><div class="br">MarrakechStory</div><div class="muted">${tx('Travel Itinerary','Reiseplan','Itinéraire')}</div></div><div class="r"><div class="muted">${tx('Ref','Ref','Réf')}: ${esc(b.reference||'—')}</div></div></div>
      <h1>${esc((b.arrival_city||'Marrakech')+' → '+(b.departure_city||'Marrakech'))}</h1><div class="muted">${fmtD(b.arrival_date)} → ${fmtD(b.departure_date)} · ${(b.total_days||itin.length)} ${tx('days','dager','jours')}</div>
      <h3>${tx('Day by day','Dag for dag','Jour par jour')}</h3>${days || '<p class="muted">'+tx('Your detailed itinerary will appear here once finalised.','Detaljert reiseplan kommer her når den er klar.','Itinéraire détaillé à venir.')+'</p>'}`;
    openDoc('Itinerary ' + (b.reference || ''), inner);
  };
  const sendMsg = async () => {
    const SB = window.MS_SB; if (!draft.trim() || !SB) return;
    const body = draft.trim(); setDraft('');
    await SB.from('messages').insert({ client_email: user.email, sender: 'client', body, booking_id: (myBookings && myBookings[0] && myBookings[0].id) || null });
    loadPortal();
  };

  useEffectE2(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  const save = (patch) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    writeProfile(next);
  };
  // Push profile to the account + admin (subscribers + auth metadata).
  const [savedNote, setSavedNote] = useStateE2('');
  const saveToAccount = async () => {
    try {
      if (window.MS_saveSubscriber) await window.MS_saveSubscriber({ email: profile.email || user.email, name: profile.name, phone: profile.phone, country: profile.country, marketingOptIn: true, payload: { interests: profile.interests, travellers: profile.travellers, source: 'profile' } }, { source: 'profile' });
      if (window.MS_SB?.auth?.updateUser) await window.MS_SB.auth.updateUser({ data: { name: profile.name, phone: profile.phone } });
      setSavedNote(tx('Saved to your account ✓', 'Lagret på kontoen din ✓', 'Enregistré ✓'));
    } catch (e) { setSavedNote(tx('Saved locally', 'Lagret lokalt', 'Enregistré localement')); }
    setTimeout(() => setSavedNote(''), 3000);
  };

  // Saved itineraries — match favs (which store slugs)
  const favSlugs = readFavs();
  const itins = (window.MS_ITINERARIES || []).filter(t => favSlugs.includes(t.slug));
  // Saved catalog items (key format: `${tab}-${item.name}`)
  let catFavs = {};
  try { catFavs = JSON.parse(localStorage.getItem('ms_catalog_favs') || '{}'); } catch {}
  const catFavList = (() => {
    if (!window.MS_DATA) return [];
    const out = [];
    const arrays = { activities: 'ACTIVITIES', restaurants: 'RESTAURANTS', spa: 'SPAS', camps: 'CAMPS', pools: 'POOLS', excursions: 'EXCURSIONS', transport: 'TRANSPORT' };
    Object.entries(arrays).forEach(([tab, k]) => {
      (window.MS_DATA[k] || []).forEach(it => {
        if (catFavs[`${tab}-${it.name}`]) {
          out.push({ tab, ...it });
        }
      });
    });
    return out;
  })();
  const totalSaved = itins.length + catFavList.length;

  // ---- derived booking stats (connected to admin via RLS by email) ----
  const bookingsArr = myBookings || [];
  const _t0 = new Date(); _t0.setHours(0, 0, 0, 0);
  const upcoming = bookingsArr.filter(b => !b.archived && !['cancelled', 'completed'].includes(b.status) && (!b.departure_date || new Date(b.departure_date) >= _t0));
  const past = bookingsArr.filter(b => b.archived || ['completed', 'cancelled'].includes(b.status) || (b.departure_date && new Date(b.departure_date) < _t0));
  const balanceDue = bookingsArr.reduce((s, b) => s + (Number(b.balance) || 0), 0);
  const msgCount = msgs.length;

  const bkCard = (b) => {
    const bal = Number(b.balance) || 0; const paid = Number(b.paid_amount) || 0;
    const itin = Array.isArray(b.daily_itinerary) ? b.daily_itinerary : [];
    const open = !!openItin[b.id];
    return (
      <article key={b.id} className="ms-cp-booking">
        <div className="ms-cp-bk-top">
          <div>
            <div className="ms-cp-ref">{b.reference || '—'}</div>
            <h3>{(b.arrival_city || 'Marrakech')} → {(b.departure_city || 'Marrakech')}</h3>
            <div className="ms-cp-dates">{fmtD(b.arrival_date)} → {fmtD(b.departure_date)} · {(b.total_days || '?')} {tx('days', 'dager', 'jours')} · {(b.adults || 0) + (b.kids || 0)} {tx('travellers', 'reisende', 'voyageurs')}</div>
          </div>
          <span className={`ms-cp-status st-${b.status}`}>{ST_LABEL[b.status] || b.status}</span>
        </div>
        <div className="ms-cp-pay">
          <div><span>{tx('Price', 'Pris', 'Prix')}</span><strong>{krf(b.selling_price)}</strong></div>
          <div><span>{tx('Paid', 'Betalt', 'Payé')}</span><strong className="ms-cp-green">{krf(paid)}</strong></div>
          <div><span>{tx('Balance', 'Restbeløp', 'Solde')}</span><strong style={{ color: bal > 0 ? '#e0432a' : undefined }}>{krf(bal)}</strong></div>
        </div>
        <div className="ms-cp-actions">
          {itin.length > 0 && <button className="btn btn-outline btn-sm" onClick={() => setOpenItin(s => ({ ...s, [b.id]: !s[b.id] }))}>{open ? tx('Hide itinerary', 'Skjul reiseplan', 'Masquer') : tx('View itinerary', 'Se reiseplan', 'Itinéraire')} ({itin.length})</button>}
          {itin.length > 0 && <button className="btn btn-outline btn-sm" onClick={() => printItinerary(b)}>🗎 {tx('Itinerary', 'Reiseplan', 'Itinéraire')} PDF</button>}
          <button className="btn btn-outline btn-sm" onClick={() => printInvoice(b)}>🧾 {tx('Invoice', 'Faktura', 'Facture')}</button>
        </div>
        {open && itin.length > 0 && (
          <div className="ms-cp-itin">
            {itin.map((d, i) => (
              <div key={i} className="ms-cp-day">
                <div className="ms-cp-day-n">{d.day || i + 1}</div>
                <div>
                  <strong>{d.city || (tx('Day', 'Dag', 'Jour') + ' ' + (d.day || i + 1))}</strong>
                  {(d.activities || []).map((a, ai) => <div key={ai} className="ms-cp-act">{a.time ? a.time + ' · ' : ''}{a.type}{a.details ? ' — ' + a.details : ''}</div>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    );
  };

  const _panel = (
    <div className="ms-profile-backdrop" onClick={onClose}>
      <div className="ms-profile-panel" onClick={e => e.stopPropagation()}>
        <button className="ms-profile-close" onClick={onClose} aria-label="Close">✕</button>
        <header className="ms-profile-head">
          <div className="ms-profile-avatar">{(user?.name || '?')[0].toUpperCase()}</div>
          <div>
            <h2 className="ms-profile-name">{tx('Hi', 'Hei', 'Bonjour')}, {user?.name?.split(' ')[0] || 'friend'}</h2>
            <div className="ms-profile-email">{user?.email}</div>
          </div>
        </header>
        <nav className="ms-profile-tabs">
          {[
            { id: 'overview',  label: tx('Overview',     'Oversikt',    'Aperçu') },
            { id: 'bookings',  label: tx('My bookings',  'Mine bookinger', 'Mes réservations') },
            { id: 'trips',     label: tx('Saved',        'Lagret',      'Sauvegardés') },
            { id: 'profile',   label: tx('My info',      'Min info',    'Mes infos') },
          ].map(t => (
            <button key={t.id} className={`ms-profile-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>

        <div className="ms-profile-body">
          {tab === 'overview' && (
            <div className="ms-profile-overview">
              <button className="ms-profile-card" onClick={() => setTab('bookings')}>
                <div className="ms-profile-card-label">{tx('Upcoming trips', 'Kommende reiser', 'Voyages à venir')}</div>
                <div className="ms-profile-card-value">{myBookings === null ? '…' : upcoming.length}</div>
                <span className="btn btn-text">{tx('View →', 'Se →', 'Voir →')}</span>
              </button>
              <button className="ms-profile-card" onClick={() => setTab('bookings')}>
                <div className="ms-profile-card-label">{tx('Balance due', 'Restbeløp', 'Solde dû')}</div>
                <div className="ms-profile-card-value" style={{ color: balanceDue > 0 ? '#e0432a' : undefined }}>{myBookings === null ? '…' : krf(balanceDue)}</div>
                <span className="btn btn-text">{tx('Details →', 'Detaljer →', 'Détails →')}</span>
              </button>
              <button className="ms-profile-card" onClick={() => setTab('bookings')}>
                <div className="ms-profile-card-label">{tx('Messages', 'Meldinger', 'Messages')}</div>
                <div className="ms-profile-card-value">{msgCount}</div>
                <span className="btn btn-text">{tx('Open →', 'Åpne →', 'Ouvrir →')}</span>
              </button>
              <button className="ms-profile-card" onClick={() => setTab('trips')}>
                <div className="ms-profile-card-label">{tx('Saved favourites', 'Lagrede favoritter', 'Favoris')}</div>
                <div className="ms-profile-card-value">{totalSaved}</div>
                <span className="btn btn-text">{tx('View →', 'Se →', 'Voir →')}</span>
              </button>
              <div className="ms-profile-card ms-profile-card-cta">
                <div className="ms-profile-card-label">{tx('Need a trip?', 'Trenger du en reise?', 'Besoin d\'un voyage?')}</div>
                <p>{tx('Tell us what you want — we build it.', 'Fortell oss hva du vil — vi bygger den.', 'Dites-nous ce que vous voulez — on le construit.')}</p>
                <a className="btn btn-primary" href="#plan" onClick={onClose}>{tx('Start →', 'Start →', 'Démarrer →')}</a>
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div className="ms-cp">
              {loadingPortal && myBookings === null ? (
                <div className="ms-profile-empty"><p>{tx('Loading your bookings…', 'Laster bookingene dine …', 'Chargement…')}</p></div>
              ) : (
                <>
                  {(!myBookings || myBookings.length === 0) ? (
                    <div className="ms-profile-empty">
                      <p>{tx('No bookings linked to this email yet. Once you send a trip request, it appears here with live status, your day-by-day itinerary and invoice.',
                        'Ingen bookinger knyttet til denne e-posten ennå. Når du sender en reiseforespørsel, vises den her med status, dag-for-dag reiseplan og faktura.',
                        'Aucune réservation liée à cet e-mail. Dès que vous envoyez une demande, elle apparaît ici avec le statut, l\'itinéraire jour par jour et la facture.')}</p>
                      <a className="btn btn-primary" href="#plan" onClick={onClose}>{tx('Plan a trip →', 'Planlegg en reise →', 'Planifier →')}</a>
                    </div>
                  ) : (
                    <>
                      <h4 className="ms-profile-section-h">{tx('Upcoming', 'Kommende', 'À venir')}{upcoming.length ? ` (${upcoming.length})` : ''}</h4>
                      {upcoming.length ? upcoming.map(bkCard) : <p className="ms-cp-thread-empty">{tx('No upcoming trips.', 'Ingen kommende reiser.', 'Aucun voyage à venir.')}</p>}
                      {past.length > 0 && <h4 className="ms-profile-section-h" style={{ marginTop: 22 }}>{tx('Trip history', 'Reisehistorikk', 'Historique')} ({past.length})</h4>}
                      {past.map(bkCard)}
                    </>
                  )}

                  <h4 className="ms-profile-section-h" style={{ marginTop: 24 }}>{tx('Messages with MarrakechStory', 'Meldinger med MarrakechStory', 'Messages avec MarrakechStory')}</h4>
                  <div className="ms-cp-thread">
                    {msgs.length === 0 && <div className="ms-cp-thread-empty">{tx('No messages yet. Ask us anything about your trip — we reply here.', 'Ingen meldinger ennå. Spør oss om reisen — vi svarer her.', 'Aucun message. Posez-nous vos questions — nous répondons ici.')}</div>}
                    {msgs.map(m => (
                      <div key={m.id} className={`ms-cp-msg ${m.sender === 'client' ? 'me' : 'them'}`}>
                        <div className="ms-cp-bubble">{m.body}</div>
                        <div className="ms-cp-msg-meta">{m.sender === 'client' ? tx('You', 'Du', 'Vous') : 'MarrakechStory'} · {fmtD(m.created_at)}</div>
                      </div>
                    ))}
                  </div>
                  <form className="ms-cp-composer" onSubmit={e => { e.preventDefault(); sendMsg(); }}>
                    <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={tx('Write a message…', 'Skriv en melding …', 'Écrire un message…')} />
                    <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>{tx('Send', 'Send', 'Envoyer')}</button>
                  </form>
                </>
              )}
            </div>
          )}

          {tab === 'trips' && (
            <div className="ms-profile-trips">
              {totalSaved === 0 && (
                <div className="ms-profile-empty">
                  <p>{tx(
                    'No favourites yet. Tap the ♡ on any trip or catalogue card to save it here.',
                    'Ingen favoritter ennå. Trykk ♡ på en reise eller katalogkort for å lagre den her.',
                    'Aucun favori. Touchez ♡ sur un voyage ou une fiche pour le sauvegarder ici.'
                  )}</p>
                  <a className="btn btn-primary" href="#itineraries" onClick={onClose}>{tx('Browse trips →', 'Se reiser →', 'Voir les voyages →')}</a>
                </div>
              )}
              {itins.length > 0 && (
                <>
                  <h4 className="ms-profile-section-h">{tx('Saved trips', 'Lagrede reiser', 'Voyages sauvegardés')} ({itins.length})</h4>
                  {itins.map(t => (
                    <article key={t.slug} className="ms-profile-trip">
                      <div className="ms-profile-trip-img" style={{ backgroundImage: `url(${t.img})` }} />
                      <div className="ms-profile-trip-body">
                        <div className="ms-profile-trip-chapter">CHAPTER {t.chapter} · {t.duration}</div>
                        <h3>{t.title}</h3>
                        <p>{t.teaser}</p>
                      </div>
                    </article>
                  ))}
                </>
              )}
              {catFavList.length > 0 && (
                <>
                  <h4 className="ms-profile-section-h">{tx('Saved places & activities', 'Lagrede steder og aktiviteter', 'Lieux et activités sauvegardés')} ({catFavList.length})</h4>
                  {catFavList.map((it, i) => (
                    <article key={`${it.tab}-${i}`} className="ms-profile-trip">
                      <div className="ms-profile-trip-img" style={{ backgroundImage: `url(${it.img})` }} />
                      <div className="ms-profile-trip-body">
                        <div className="ms-profile-trip-chapter">{it.tab.toUpperCase()} · {it.filter || it.tag || ''}</div>
                        <h3>{it.name}</h3>
                        <p>{it.desc}</p>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <form className="ms-profile-form" onSubmit={e => e.preventDefault()}>
              <label>
                <span>{tx('Full name', 'Fullt navn', 'Nom complet')}</span>
                <input value={profile.name} onChange={e => save({ name: e.target.value })} />
              </label>
              <label>
                <span>{tx('Email', 'E-post', 'E-mail')}</span>
                <input type="email" value={profile.email} onChange={e => save({ email: e.target.value })} />
              </label>
              <label>
                <span>{tx('Phone (with country code)', 'Telefon (med landkode)', 'Téléphone (avec indicatif)')}</span>
                <input type="tel" value={profile.phone} onChange={e => save({ phone: e.target.value })} placeholder="+47 …" />
              </label>
              <label>
                <span>{tx('How many travellers?', 'Hvor mange reisende?', 'Combien de voyageurs?')}</span>
                <input value={profile.travellers} onChange={e => save({ travellers: e.target.value })} placeholder="2 adults, 1 child" />
              </label>
              <label>
                <span>{tx('What do you like?', 'Hva liker du?', 'Qu\'aimez-vous?')}</span>
                <textarea rows={3} value={profile.interests} onChange={e => save({ interests: e.target.value })}
                  placeholder={tx('Slow trips, desert, food, hammam…', 'Rolige reiser, ørken, mat, hammam …', 'Voyages lents, désert, cuisine, hammam …')} />
              </label>
              <div className="ms-profile-form-foot">
                <button type="button" className="btn btn-outline" onClick={onLogout}>{tx('Log out', 'Logg ut', 'Déconnexion')}</button>
                <button type="button" className="btn btn-primary" onClick={saveToAccount}>{tx('Save', 'Lagre', 'Enregistrer')}</button>
                <span className="ms-profile-save-note">{savedNote || tx('Saved automatically', 'Lagres automatisk', 'Enregistré automatiquement')}</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
  const RD = window.ReactDOM || (typeof ReactDOM !== 'undefined' ? ReactDOM : null);
  return RD && RD.createPortal ? RD.createPortal(_panel, document.body) : _panel;
}

// Expose to auth.jsx via window so login can open it
window.MS_ProfilePanel = ProfilePanel;
window.MS_CookieBanner = CookieBanner;
window.MS_Chatbot = Chatbot;
