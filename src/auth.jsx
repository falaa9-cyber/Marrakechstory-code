// ============================================
// Auth — client login / create-account + profile launcher
// Real Supabase email/password auth. Sign-up creates an instantly-usable
// (email-confirmed) account via the client-account edge function, then
// signs in. Sessions persist via window.MS_SB (storageKey ms-site-auth).
// ============================================
const { useState: useSA, useEffect: useEA, useRef: useRA } = React;
const If2 = window.MS_I;

const AUTH_KEY = 'ms_user';

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

// Invoke the public client-account edge function (creates/confirms accounts).
async function accountFn(action, payload) {
  try {
    const env = window.MS_ENV || {};
    const base = (env.SUPABASE_URL || '').replace(/\/$/, '');
    const key = env.SUPABASE_KEY || '';
    if (!base || !key) return { ok: false, error: 'not configured' };
    const r = await fetch(`${base}/functions/v1/client-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ action, ...payload }),
    });
    return await r.json();
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}

function nameFromEmail(mail) {
  if (!mail) return '';
  const local = mail.split('@')[0].split('+')[0];
  return local.replace(/[._\-]+/g, ' ').split(' ').filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function AuthModal({ view: initView, onClose, onLogin }) {
  const ctx = window.MS_CTX?.useMS?.() || {};
  const lang = ctx.lang || 'en';
  const T = (en, no, fr) => lang === 'no' ? no : lang === 'fr' ? fr : en;

  const [view, setView] = useSA(initView === 'login' ? 'login' : 'register');
  const [name, setName] = useSA('');
  const [email, setEmail] = useSA('');
  const [phone, setPhone] = useSA('');
  const [pass, setPass] = useSA('');
  const [err, setErr] = useSA('');
  const [msg, setMsg] = useSA('');
  const [busy, setBusy] = useSA(false);

  useEA(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  const seedProfile = (user) => {
    try {
      const prev = JSON.parse(localStorage.getItem('ms_profile_data') || '{}');
      localStorage.setItem('ms_profile_data', JSON.stringify({
        ...prev, name: user.name || prev.name || '', email: user.email || prev.email || '', phone: user.phone || prev.phone || '',
      }));
    } catch {}
  };
  const persistSubscriber = (user, source) => {
    if (window.MS_saveSubscriber) window.MS_saveSubscriber({ email: user.email, name: user.name, phone: user.phone, marketingOptIn: true, payload: { source } }, { source });
  };
  const finishAuth = (user, source) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    seedProfile(user); persistSubscriber(user, source);
    onLogin(user); onClose(true);
  };

  const userFromSession = (u, fallbackName) => ({
    id: u.id, email: u.email,
    name: u.user_metadata?.name || fallbackName || nameFromEmail(u.email) || (u.email || '').split('@')[0],
    phone: u.user_metadata?.phone || phone || '',
  });

  const doLogin = async () => {
    setErr(''); setMsg('');
    if (!email.trim()) { setErr(T('Enter your email', 'Skriv inn e-post', 'Saisissez votre e-mail')); return; }
    if (!pass) { setErr(T('Enter your password', 'Skriv inn passord', 'Saisissez votre mot de passe')); return; }
    if (!window.MS_SB?.auth) { setErr(T('Login service unavailable', 'Tjenesten er utilgjengelig', 'Service indisponible')); return; }
    setBusy(true);
    try {
      let { data, error } = await window.MS_SB.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
      // Legacy accounts created before instant-confirm: confirm then retry.
      if (error && /confirm/i.test(error.message || '')) {
        await accountFn('confirm', { email: email.trim().toLowerCase() });
        ({ data, error } = await window.MS_SB.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass }));
      }
      if (error) {
        if (/invalid login/i.test(error.message || '')) throw new Error(T('Wrong email or password.', 'Feil e-post eller passord.', 'E-mail ou mot de passe incorrect.'));
        throw error;
      }
      finishAuth(userFromSession(data.user), 'login');
    } catch (e) {
      setErr(e?.message || T('Login failed', 'Innlogging feilet', 'Échec de la connexion'));
    } finally { setBusy(false); }
  };

  const doRegister = async () => {
    setErr(''); setMsg('');
    if (!name.trim() || !email.trim()) { setErr(T('Fill in name and email', 'Fyll inn navn og e-post', 'Renseignez nom et e-mail')); return; }
    if (!pass || pass.length < 6) { setErr(T('Password must be at least 6 characters', 'Passordet må være minst 6 tegn', 'Au moins 6 caractères')); return; }
    setBusy(true);
    try {
      const r = await accountFn('signup', { email: email.trim().toLowerCase(), password: pass, name: name.trim(), phone: phone.trim() });
      if (!r.ok && r.code === 'exists') {
        setView('login'); setMsg(T('You already have an account — please sign in.', 'Du har allerede en konto — logg inn.', 'Vous avez déjà un compte — connectez-vous.')); setBusy(false); return;
      }
      if (!r.ok) { throw new Error(r.error === 'password too short' ? T('Password must be at least 6 characters', 'Passordet må være minst 6 tegn', 'Au moins 6 caractères') : (r.error || T('Sign-up failed', 'Registrering feilet', 'Échec de l\'inscription'))); }
      // Account is confirmed — sign straight in.
      const { data, error } = await window.MS_SB.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
      if (error) throw error;
      finishAuth(userFromSession(data.user, name.trim()), 'register');
    } catch (e) {
      setErr(e?.message || T('Sign-up failed', 'Registrering feilet', 'Échec de l\'inscription'));
    } finally { setBusy(false); }
  };

  const doForgot = async () => {
    setErr(''); setMsg('');
    if (!email.trim()) { setErr(T('Enter your email first', 'Skriv inn e-posten din først', 'Saisissez votre e-mail')); return; }
    setBusy(true);
    try {
      await window.MS_SB.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: window.location.origin + window.location.pathname });
      setMsg(T('If that email has an account, a reset link is on its way. You can also message us on WhatsApp.', 'Hvis e-posten har en konto, sender vi en lenke. Du kan også melde oss på WhatsApp.', 'Si un compte existe, un lien arrive. Vous pouvez aussi nous écrire sur WhatsApp.'));
    } catch (e) { setErr(e?.message || 'Error'); } finally { setBusy(false); }
  };

  const backdropDownTarget = useRA(null);
  const onBackdropPointerDown = (e) => { if (e.target === e.currentTarget) backdropDownTarget.current = e.target; };
  const onBackdropClick = (e) => { if (e.target === e.currentTarget && backdropDownTarget.current === e.target) onClose(false); backdropDownTarget.current = null; };
  const onInputFocus = (e) => { setTimeout(() => { try { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {} }, 280); };

  const isLogin = view === 'login';

  const _modal = (
    <div className="auth-backdrop" onPointerDown={onBackdropPointerDown} onClick={onBackdropClick}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={() => onClose(false)} aria-label="Close">✕</button>

        <div className="auth-hero">
          <div className="auth-logo"><img src="assets/logo.png" alt="MarrakechStory" onError={(e) => { e.target.style.display = 'none'; }} /></div>
          <h2 className="auth-title">{isLogin ? T('Welcome back', 'Velkommen tilbake', 'Bon retour') : T('Create your account', 'Opprett konto', 'Créer un compte')}</h2>
          <p className="auth-sub">{T('Track your bookings, itineraries and invoices — all in one place.', 'Følg bestillinger, reiseplaner og fakturaer på ett sted.', 'Suivez vos réservations, itinéraires et factures au même endroit.')}</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => { setErr(''); setMsg(''); setView('login'); }}>{T('Sign in', 'Logg inn', 'Connexion')}</button>
          <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setErr(''); setMsg(''); setView('register'); }}>{T('Create account', 'Ny konto', 'Inscription')}</button>
        </div>

        <form className="auth-fields" method="post" autoComplete="on"
          onSubmit={(e) => { e.preventDefault(); isLogin ? doLogin() : doRegister(); }}>
          {!isLogin && (
            <div className="fld">
              <label htmlFor="auth-name">{T('Full name', 'Fullt navn', 'Nom complet')}</label>
              <input id="auth-name" name="name" required onFocus={onInputFocus} autoComplete="name"
                value={name} onChange={e => setName(e.target.value)} placeholder={T('Your name', 'Ditt navn', 'Votre nom')} />
            </div>
          )}
          <div className="fld">
            <label htmlFor="auth-email">{T('Email', 'E-post', 'E-mail')}</label>
            <input id="auth-email" name="email" type="email" required onFocus={onInputFocus} autoComplete="email" inputMode="email"
              value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {!isLogin && (
            <div className="fld">
              <label htmlFor="auth-phone">{T('Phone (optional)', 'Telefon (valgfritt)', 'Téléphone (optionnel)')}</label>
              <input id="auth-phone" name="tel" type="tel" onFocus={onInputFocus} autoComplete="tel"
                value={phone} onChange={e => setPhone(e.target.value)} placeholder="+47 …" />
            </div>
          )}
          <div className="fld">
            <label htmlFor="auth-pw">{T('Password', 'Passord', 'Mot de passe')}</label>
            <input id="auth-pw" name="password" type="password" onFocus={onInputFocus}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={pass} onChange={e => setPass(e.target.value)}
              placeholder={isLogin ? '••••••••' : T('At least 6 characters', 'Minst 6 tegn', 'Au moins 6 caractères')} />
          </div>

          {err && <p className="auth-err">{err}</p>}
          {msg && <p className="auth-msg">{msg}</p>}

          <button type="submit" className="auth-alt-btn auth-alt-btn-primary auth-submit" disabled={busy}>
            {busy ? '…' : (isLogin ? T('Sign in', 'Logg inn', 'Se connecter') : T('Create account', 'Opprett konto', 'Créer un compte'))}
          </button>

          {isLogin
            ? <button type="button" className="auth-forgot" onClick={doForgot} disabled={busy}>{T('Forgot password?', 'Glemt passord?', 'Mot de passe oublié ?')}</button>
            : <p className="auth-fineprint">{T('By creating an account you agree to receive trip updates. No spam.', 'Ved å opprette konto godtar du reiseoppdateringer. Ingen spam.', 'En créant un compte, vous acceptez de recevoir des nouvelles de voyage.')}</p>}
        </form>

        <button className="auth-skip" onClick={() => onClose(false)}>{T('Maybe later', 'Kanskje senere', 'Plus tard')} →</button>
      </div>
    </div>
  );
  const RD = window.ReactDOM || (typeof ReactDOM !== 'undefined' ? ReactDOM : null);
  return RD && RD.createPortal ? RD.createPortal(_modal, document.body) : _modal;
}

function AuthWidget({ user, onShowModal, onOpenProfile }) {
  if (!user) {
    return (
      <button className="auth-widget-btn auth-widget-btn-icon" onClick={onShowModal} aria-label="Log in">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </button>
    );
  }
  const initial = ((user.name || user.email || '?').trim()[0] || '?').toUpperCase();
  const first = (user.name || user.email || '').split(/[ @]/)[0];
  return (
    <button className="auth-widget-user" onClick={onOpenProfile} aria-label="My account">
      <span className="auth-avatar">{initial}</span>
      <span className="auth-name">{first}</span>
    </button>
  );
}

function AuthSystem() {
  const [user, setUser] = useSA(getStoredUser);
  const [showModal, setShowModal] = useSA(false);
  const [modalView, setModalView] = useSA('register');
  const [showProfile, setShowProfile] = useSA(false);

  useEA(() => {
    if (!window.MS_SB?.auth?.getSession) return;
    window.MS_SB.auth.getSession().then(({ data }) => {
      const u = data?.session?.user;
      if (u) {
        const merged = { id: u.id, email: u.email, name: u.user_metadata?.name || nameFromEmail(u.email) || (u.email || '').split('@')[0], phone: u.user_metadata?.phone || '' };
        localStorage.setItem(AUTH_KEY, JSON.stringify(merged));
        setUser(merged);
      } else if (!data?.session) {
        // No live session — clear any stale local record so the UI is honest.
        if (getStoredUser()) { localStorage.removeItem(AUTH_KEY); setUser(null); }
      }
    });
    const { data: sub } = window.MS_SB.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { localStorage.removeItem(AUTH_KEY); setUser(null); }
      else if (session?.user) {
        const u = session.user;
        const merged = { id: u.id, email: u.email, name: u.user_metadata?.name || nameFromEmail(u.email) || (u.email || '').split('@')[0], phone: u.user_metadata?.phone || '' };
        localStorage.setItem(AUTH_KEY, JSON.stringify(merged)); setUser(merged);
      }
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const handleLogin = (u) => { setUser(u); setShowProfile(true); };
  const handleLogout = async () => {
    try { if (window.MS_SB?.auth?.signOut) await window.MS_SB.auth.signOut(); } catch {}
    localStorage.removeItem(AUTH_KEY); setUser(null); setShowProfile(false);
  };
  const openModal = (view = 'register') => { setModalView(view); setShowModal(true); };

  window.MS_Auth_Prompt = (view) => openModal(view || 'register');
  window.MS_Auth_User = user;
  window.MS_OpenProfile = () => { if (user) setShowProfile(true); else openModal('login'); };

  const ProfilePanel = window.MS_ProfilePanel;
  return (
    <>
      <AuthWidget user={user} onShowModal={() => openModal('login')} onOpenProfile={() => setShowProfile(true)} />
      {showModal && <AuthModal view={modalView} onLogin={handleLogin} onClose={() => setShowModal(false)} />}
      {showProfile && user && ProfilePanel && (
        <ProfilePanel user={user} onLogout={handleLogout} onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

window.MS_AuthSystem = AuthSystem;
