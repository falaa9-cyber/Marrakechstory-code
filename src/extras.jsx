// ============================================
// Instagram, Contact, WhatsApp floating widget
// ============================================
const { useState: useSE, useEffect: useEE } = React;
const Ie = window.MS_I;

const IG_POSTS = [
  { img: "https://images.unsplash.com/photo-1489493512598-d08130f49bea?w=600&q=80&auto=format&fit=crop", caption: "Dawn at Erg Chebbi" },
  { img: "https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=600&q=80&auto=format&fit=crop", caption: "Jardin Majorelle in cobalt" },
  { img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80&auto=format&fit=crop", caption: "The Koutoubia at golden hour" },
  { img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80&auto=format&fit=crop", caption: "High Atlas, late October" },
  { img: "https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=600&q=80&auto=format&fit=crop", caption: "Camp lanterns in Agafay" },
  { img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format&fit=crop", caption: "Tagine night, Café Clock" },
  { img: "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=600&q=80&auto=format&fit=crop", caption: "Inside the medina, blue door" },
  { img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80&auto=format&fit=crop", caption: "A wedding in a riad" },
];

function InstagramStrip() {
  const { useT, COMPANY } = window.MS_CTX;
  const t = useT();
  return (
    <section className="ig section" id="instagram">
      <div className="wrap">
        <div className="ig-follow-wrap reveal" style={{ textAlign: 'center' }}>
          <span className="eyebrow">{t('ig_eyebrow')}</span>
          <h2 style={{ margin: '12px 0 8px' }}>{t('ig_title_a')} <em>{t('ig_title_b')}</em></h2>
          <p style={{ margin: '0 auto 32px', maxWidth: 480 }}>{t('ig_sub')}</p>
          <a href={`https://instagram.com/${COMPANY.instagram}`} target="_blank" rel="noopener"
            className="btn btn-ink" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            {t('ig_follow')} @{COMPANY.instagram}
          </a>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const { useT, COMPANY } = window.MS_CTX;
  const t = useT();
  return (
    <section className="contact section" id="contact">
      <div className="wrap">
        <div className="contact-card reveal">
          <div className="contact-info">
            <span className="eyebrow" style={{ color: '#ffae7c' }}>{t('contact_eyebrow')}</span>
            <h2 className="serif" style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 400, color: '#fff', margin: '14px 0 14px', letterSpacing: '-0.025em', lineHeight: 1 }}>
              {t('contact_title_a')}<br />
              <em style={{ fontStyle: 'italic', color: '#ffae7c' }}>{t('contact_title_b')}</em>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 16, maxWidth: 460, margin: '0 0 32px' }}>
              {t('contact_sub')}
            </p>

            <div className="contact-rows">
              <a href={`mailto:${COMPANY.email}`} className="contact-row">
                <span className="contact-row-ico"><Ie.Mail s={18} /></span>
                <div>
                  <span className="contact-row-lbl">Email</span>
                  <span className="contact-row-val">{COMPANY.email}</span>
                </div>
              </a>
              <a href={`tel:${COMPANY.phoneIntl}`} className="contact-row">
                <span className="contact-row-ico"><Ie.Phone s={18} /></span>
                <div>
                  <span className="contact-row-lbl">Phone</span>
                  <span className="contact-row-val">{COMPANY.phone}</span>
                </div>
              </a>
              <a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noopener" className="contact-row">
                <span className="contact-row-ico" style={{ background: 'rgba(37,211,102,.18)', color: '#25d366' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
                </span>
                <div>
                  <span className="contact-row-lbl">WhatsApp</span>
                  <span className="contact-row-val">{COMPANY.phone}</span>
                </div>
              </a>
              <div className="contact-row" style={{ cursor: 'default' }}>
                <span className="contact-row-ico"><Ie.Pin s={18} /></span>
                <div>
                  <span className="contact-row-lbl">Studio</span>
                  <span className="contact-row-val">{COMPANY.address}</span>
                </div>
              </div>
            </div>

            <div className="contact-cta-row">
              <a href={`mailto:${COMPANY.email}`} className="btn btn-primary">
                <Ie.Mail s={14} /> {t('contact_email_btn')}
              </a>
              <a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noopener" className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}>
                {t('contact_wa_btn')}
              </a>
            </div>
          </div>

          <div className="contact-phone-wrap">
            {window.MS_InstagramPhone && <window.MS_InstagramPhone />}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatsAppWidget() {
  const { useT, COMPANY } = window.MS_CTX;
  const t = useT();
  const [open, setOpen] = useSE(false);
  const [hint, setHint] = useSE(false);

  useEE(() => {
    const t1 = setTimeout(() => setHint(true), 4000);
    const t2 = setTimeout(() => setHint(false), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="wa-widget">
      {open && (
        <div className="wa-panel">
          <div className="wa-panel-head">
            <div className="wa-avatar">
              <img src="assets/logo.png" alt="" />
            </div>
            <div className="wa-panel-info">
              <strong>Marrakech Story</strong>
              <span><span className="wa-online"></span> Typically replies in minutes</span>
            </div>
            <button onClick={() => setOpen(false)} className="wa-close" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="wa-bubble">
            Hi 👋 We're here to help with your trip to Marrakech. Send us a message — we usually reply within minutes.
          </div>
          <a href={`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent("Hi Marrakech Story, I'd like some advice about a trip to Marrakech.")}`}
            target="_blank" rel="noopener" className="wa-cta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
            Start chat on WhatsApp
          </a>
        </div>
      )}
      {hint && !open && (
        <div className="wa-hint">
          <strong>{t('wa_label')}</strong>
          <span>{t('wa_sub')}</span>
        </div>
      )}
      <button className="wa-btn" onClick={() => setOpen(o => !o)} aria-label="WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1s-.5-.1-.7.1c-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.8-1.5-4-3.5-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.3 3.1c.1.2 2.1 3.4 5.2 4.7 1.9.8 2.7.9 3.6.7.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
        <span className="wa-pulse"></span>
      </button>
    </div>
  );
}

function InstagramScrollWidget() {
  const { COMPANY } = window.MS_CTX;
  const [visible, setVisible] = useSE(false);
  const [expanded, setExpanded] = useSE(false);

  useEE(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const igUrl = `https://instagram.com/${COMPANY.instagram}`;

  return (
    <div className={`ig-scroll-widget ${visible ? 'visible' : ''} ${expanded ? 'expanded' : ''}`}>
      <button
        className="ig-scroll-btn"
        onClick={() => setExpanded(e => !e)}
        aria-label="Follow us on Instagram"
      >
        <span className="ig-scroll-ring"></span>
        <span className="ig-scroll-ring ig-scroll-ring-2"></span>
        <svg className="ig-scroll-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
        <span className="ig-scroll-dot"></span>
      </button>
      {expanded && (
        <div className="ig-scroll-popup">
          <div className="ig-scroll-popup-head">
            <div className="ig-scroll-avatar">
              <img src="assets/logo.png" alt="Marrakech Story" />
            </div>
            <div>
              <div className="ig-scroll-name">@{COMPANY.instagram}</div>
              <div className="ig-scroll-followers">12.4k followers</div>
            </div>
          </div>
          <p className="ig-scroll-desc">Daily stories from the medina, the Atlas and the desert. Follow along.</p>
          <a href={igUrl} target="_blank" rel="noopener" className="ig-scroll-cta">
            Follow on Instagram
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      )}
    </div>
  );
}

window.MS_Instagram = InstagramStrip;
window.MS_Contact = ContactSection;
window.MS_WhatsApp = WhatsAppWidget;
window.MS_InstagramWidget = InstagramScrollWidget;
