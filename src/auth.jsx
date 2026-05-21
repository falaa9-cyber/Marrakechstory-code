// ============================================
// Auth — login / account modal
// Appears on page load (first visit). Mock auth via localStorage.
// ============================================
const { useState: useSA, useEffect: useEA, useRef: useRA } = React;
const Ia = window.MS_I;

const AUTH_KEY = 'ms_user';
const SKIP_KEY = 'ms_auth_skipped';

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

function AuthModal({ view: initView, onClose, onLogin }) {
  const [view, setView] = useSA(initView || 'home');
  const [name, setName] = useSA('');
  const [email, setEmail] = useSA('');
  const [pass, setPass] = useSA('');
  const [err, setErr] = useSA('');

  useEA(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  const skip = () => {
    localStorage.setItem(SKIP_KEY, '1');
    onClose(false);
  };

  // Derive a friendly first name from an email when one isn't provided
  // e.g. "ola.nordmann+marrakech@gmail.com" -> "Ola Nordmann"
  const nameFromEmail = (mail) => {
    if (!mail) return '';
    const local = mail.split('@')[0].split('+')[0];
    return local
      .replace(/[._\-]+/g, ' ')
      .split(' ').filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Seed the profile from the auth event so the contact form is already filled
  const seedProfile = (user) => {
    try {
      const prev = JSON.parse(localStorage.getItem('ms_profile_data') || '{}');
      localStorage.setItem('ms_profile_data', JSON.stringify({
        ...prev,
        name:  prev.name  || user.name  || '',
        email: prev.email || user.email || '',
      }));
    } catch {}
  };

  // Persist to Supabase subscribers (upsert by email) so we can reach
  // the user later for bookings / campaigns. Fire-and-forget, never blocks.
  const persistSubscriber = (user, source) => {
    if (window.MS_saveSubscriber) {
      window.MS_saveSubscriber({
        email: user.email,
        name: user.name,
        phone: user.phone,
        country: user.country,
        marketingOptIn: true,
        payload: { source }
      }, { source });
    }
  };

  const doLogin = () => {
    if (!email.trim()) { setErr('Skriv inn e-post'); return; }
    const user = { name: name || nameFromEmail(email) || email.split('@')[0], email: email.trim() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    seedProfile(user);
    persistSubscriber(user, 'login');
    onLogin(user);
    onClose(true);
  };

  const doRegister = () => {
    if (!name.trim() || !email.trim()) { setErr('Fyll inn navn og e-post'); return; }
    const user = { name: name.trim(), email: email.trim() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    seedProfile(user);
    persistSubscriber(user, 'register');
    onLogin(user);
    onClose(true);
  };

  const doGoogleMock = () => {
    // If the host page wants to inject a real Google email, it can set window.MS_Auth_Google_Email
    const gmail = window.MS_Auth_Google_Email || 'google@example.com';
    const user = { name: nameFromEmail(gmail) || 'Google-bruker', email: gmail, google: true };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    seedProfile(user);
    persistSubscriber(user, 'google');
    onLogin(user);
    onClose(true);
  };

  // Only treat a backdrop tap as "close" if the pointer truly started AND
  // ended on the backdrop itself — not a scroll-drag inside the modal or
  // a stray finger movement around the inputs. Prevents the modal from
  // closing mid-typing on mobile.
  const backdropDownTarget = useRA(null);
  const onBackdropPointerDown = (e) => { if (e.target === e.currentTarget) backdropDownTarget.current = e.target; };
  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget && backdropDownTarget.current === e.target) skip();
    backdropDownTarget.current = null;
  };
  // Push the focused input above the on-screen keyboard.
  const onInputFocus = (e) => {
    setTimeout(() => {
      try { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
    }, 280);
  };

  return (
    <div className="auth-backdrop"
      onPointerDown={onBackdropPointerDown}
      onClick={onBackdropClick}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={() => skip()}>✕</button>

        {view === 'home' && (
          <>
            <div className="auth-logo">
              <img src="assets/logo.png" alt="Marrakech Story" />
            </div>
            <h2 className="auth-title">
              {window.MS_CTX?.useMS?.()?.lang === 'no' ? 'Velkommen til MarrakechStory' :
               window.MS_CTX?.useMS?.()?.lang === 'fr' ? 'Bienvenue chez MarrakechStory' :
               'Welcome to MarrakechStory'}
            </h2>
            <p className="auth-sub">
              Logg inn for å lagre reiseplanen din, se bestillinger og få personlig service.
            </p>
            <button className="auth-google-btn" onClick={doGoogleMock}>
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.5z" fill="#4285F4"/>
                <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.1 0-11.3-4.1-13.1-9.7H2.8v6.1C6.8 42.6 14.9 48 24 48z" fill="#34A853"/>
                <path d="M10.9 28.8c-.5-1.4-.8-2.8-.8-4.3s.3-3 .8-4.3v-6.1H2.8C1 17.4 0 20.6 0 24s1 6.6 2.8 9.9l8.1-5.1z" fill="#FBBC05"/>
                <path d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.6 30.4 0 24 0 14.9 0 6.8 5.4 2.8 13.2l8.1 6.1C12.7 13.6 17.9 9.5 24 9.5z" fill="#EA4335"/>
              </svg>
              Logg inn med Google
            </button>
            <div className="auth-divider"><span>eller</span></div>
            <div className="auth-row">
              <button className="btn btn-outline auth-alt-btn" onClick={() => setView('login')}>Logg inn</button>
              <button className="btn btn-primary auth-alt-btn" onClick={() => setView('register')}>Opprett konto</button>
            </div>
            <button className="auth-skip" onClick={skip}>Hopp over for nå →</button>
          </>
        )}

        {view === 'login' && (
          <>
            <button type="button" className="auth-back" onClick={() => { setErr(''); setView('home'); }}>← Tilbake</button>
            <h2 className="auth-title">Logg inn</h2>
            <p className="auth-sub" style={{ marginBottom: 16 }}>
              Husker deg til senere bestillinger. Du kan hoppe over.
            </p>
            <form className="auth-fields" name="login" method="post" autoComplete="on"
              onSubmit={(e) => { e.preventDefault(); doLogin(); }}>
              <div className="fld">
                <label htmlFor="auth-login-email">E-post</label>
                <input id="auth-login-email" name="email" type="email" required onFocus={onInputFocus}
                  autoComplete="email" inputMode="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="du@example.com" />
              </div>
              <div className="fld">
                <label htmlFor="auth-login-pw">Passord</label>
                <input id="auth-login-pw" name="password" type="password" onFocus={onInputFocus}
                  autoComplete="current-password"
                  value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="••••••••" />
              </div>
              {err && <p className="auth-err">{err}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Logg inn</button>
              <button type="button" className="auth-skip" onClick={skip}
                style={{ marginTop: 8 }}>Hopp over for nå →</button>
            </form>
            <p className="auth-switch">Ingen konto? <button type="button" onClick={() => { setErr(''); setView('register'); }}>Opprett konto</button></p>
          </>
        )}

        {view === 'register' && (
          <>
            <button type="button" className="auth-back" onClick={() => { setErr(''); setView('home'); }}>← Tilbake</button>
            <h2 className="auth-title">Opprett konto</h2>
            <p className="auth-sub" style={{ marginBottom: 20 }}>
              Se reiseplanen din, bestillinger og mer. Du kan hoppe over.
            </p>
            <form className="auth-fields" name="register" method="post" autoComplete="on"
              onSubmit={(e) => { e.preventDefault(); doRegister(); }}>
              <div className="fld">
                <label htmlFor="auth-reg-name">Fullt navn</label>
                <input id="auth-reg-name" name="name" required onFocus={onInputFocus}
                  autoComplete="name"
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ditt navn" />
              </div>
              <div className="fld">
                <label htmlFor="auth-reg-email">E-post</label>
                <input id="auth-reg-email" name="email" type="email" required onFocus={onInputFocus}
                  autoComplete="email" inputMode="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="du@example.com" />
              </div>
              <div className="fld">
                <label htmlFor="auth-reg-pw">Passord</label>
                <input id="auth-reg-pw" name="new-password" type="password" onFocus={onInputFocus}
                  autoComplete="new-password"
                  value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="Minst 8 tegn" />
              </div>
              {err && <p className="auth-err">{err}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Opprett konto</button>
              <button type="button" className="auth-skip" onClick={skip}
                style={{ marginTop: 8 }}>Hopp over for nå →</button>
            </form>
            <p className="auth-switch">Har du konto? <button type="button" onClick={() => { setErr(''); setView('login'); }}>Logg inn</button></p>
          </>
        )}
      </div>
    </div>
  );
}

function AuthWidget({ user, onShowModal, onLogout, onOpenProfile }) {
  const [open, setOpen] = useSA(false);
  if (!user) {
    return (
      <button className="auth-widget-btn auth-widget-btn-icon" onClick={onShowModal} aria-label="Log in">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </button>
    );
  }
  return (
    <div className="auth-widget" style={{ position: 'relative' }}>
      <button className="auth-widget-user" onClick={() => { setOpen(false); onOpenProfile(); }}>
        <span className="auth-avatar">{user.name[0].toUpperCase()}</span>
        <span className="auth-name">{user.name.split(' ')[0]}</span>
      </button>
      {open && (
        <div className="auth-user-menu">
          <div className="auth-user-menu-header">
            <span className="auth-avatar large">{user.name[0].toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <div style={{ fontSize: 12, opacity: .7 }}>{user.email}</div>
            </div>
          </div>
          <a href="#plan" onClick={() => setOpen(false)} className="auth-menu-item">
            <If2.Compass s={14} /> Min reiseplan
          </a>
          <button className="auth-menu-item" onClick={() => { setOpen(false); onLogout(); }}>
            Logg ut
          </button>
        </div>
      )}
    </div>
  );
}

// Need to reference icons — use window.MS_I like other components
const If2 = window.MS_I;

function AuthSystem() {
  const [user, setUser] = useSA(getStoredUser);
  const [showModal, setShowModal] = useSA(false);
  const [modalView, setModalView] = useSA('home');
  const [showProfile, setShowProfile] = useSA(false);

  useEA(() => {
    if (!user && !localStorage.getItem(SKIP_KEY)) {
      setShowModal(true);
    }
  }, []);

  const handleLogin = (u) => { setUser(u); setShowProfile(true); };
  const handleLogout = () => { localStorage.removeItem(AUTH_KEY); setUser(null); setShowProfile(false); };
  const openModal = (view = 'home') => { setModalView(view); setShowModal(true); };

  // Expose prompt for form "Send min reise"
  window.MS_Auth_Prompt = (view) => openModal(view || 'register');
  window.MS_Auth_User = user;
  window.MS_OpenProfile = () => user && setShowProfile(true);

  const ProfilePanel = window.MS_ProfilePanel;
  return (
    <>
      <AuthWidget user={user}
        onShowModal={() => openModal()}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfile(true)} />
      {showModal && (
        <AuthModal
          view={modalView}
          onLogin={handleLogin}
          onClose={(loggedIn) => setShowModal(false)}
        />
      )}
      {showProfile && user && ProfilePanel && (
        <ProfilePanel user={user} onLogout={handleLogout} onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

window.MS_AuthSystem = AuthSystem;
