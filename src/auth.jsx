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

  // Social sign-in. Redirects to the provider when enabled in Supabase;
  // shows a friendly note (and keeps the email form) if a provider isn't set up.
  const doOAuth = async (provider) => {
    setErr(''); setMsg('');
    if (!window.MS_SB?.auth?.signInWithOAuth) { setErr(T('Social sign-in unavailable — use email.', 'Sosial innlogging utilgjengelig — bruk e-post.', 'Connexion sociale indisponible — utilisez l\'e-mail.')); return; }
    setBusy(true);
    try {
      const { error } = await window.MS_SB.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + window.location.pathname } });
      if (error) {
        if (/provider|not enabled|disabled|unsupported|validation/i.test(error.message || '')) {
          setErr(T(`${provider[0].toUpperCase() + provider.slice(1)} sign-in is being set up — please use email for now.`, `Innlogging med ${provider} settes opp — bruk e-post inntil videre.`, `Connexion ${provider} en cours de configuration — utilisez l'e-mail.`));
        } else throw error;
      }
      // On success the page redirects to the provider; nothing more to do here.
    } catch (e) { setErr(e?.message || T('Sign-in failed', 'Innlogging feilet', 'Connexion échouée')); }
    finally { setBusy(false); }
  };

  const backdropDownTarget = useRA(null);
  const onBackdropPointerDown = (e) => { if (e.target === e.currentTarget) backdropDownTarget.current = e.target; };
  const onBackdropClick = (e) => { if (e.target === e.currentTarget && backdropDownTarget.current === e.target) onClose(false); backdropDownTarget.current = null; };
  const onInputFocus = (e) => { setTimeout(() => { try { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {} }, 280); };

  const isLogin = view === 'login';

  const benefits = [
    ['★', T('Get our best offers & seasonal deals first', 'Få våre beste tilbud og sesongtilbud først', 'Recevez nos meilleures offres en avant-première')],
    ['🧭', T('All your bookings, itineraries & invoices in one place', 'Alle bestillinger, reiseplaner og fakturaer på ett sted', 'Réservations, itinéraires et factures au même endroit')],
    ['♡', T('Save the trips and places you love', 'Lagre reisene og stedene du elsker', 'Sauvegardez vos voyages et lieux préférés')],
    ['💬', T('Chat directly with Aladdin & Marte', 'Chat direkte med Aladdin & Marte', 'Échangez directement avec Aladdin & Marte')],
  ];

  const _modal = (
    <div className="auth-backdrop" onPointerDown={onBackdropPointerDown} onClick={onBackdropClick}>
      <div className="auth-modal auth-modal-split" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={() => onClose(false)} aria-label="Close">✕</button>

        {/* Left — Marrakech welcome panel with the value proposition */}
        <aside className="auth-aside" style={{ backgroundImage: "url(assets/photos/marrakech-jardin-majorelle-01.jpg)" }}>
          <div className="auth-aside-inner">
            <div className="auth-aside-logo"><img src="assets/logo.png" alt="MarrakechStory" onError={(e) => { e.target.style.display = 'none'; }} /></div>
            <h2 className="auth-aside-title">{T('Join MarrakechStory', 'Bli med i MarrakechStory', 'Rejoignez MarrakechStory')}</h2>
            <p className="auth-aside-sub">{T('Create a free account — it makes planning your Morocco effortless.', 'Opprett en gratis konto — det gjør planleggingen av Marokko enkel.', 'Créez un compte gratuit — planifier votre Maroc devient simple.')}</p>
            <ul className="auth-benefits">
              {benefits.map(([ic, txt], i) => (
                <li key={i}><span className="auth-benefit-ic">{ic}</span>{txt}</li>
              ))}
            </ul>
            <p className="auth-aside-foot">{T('Free · takes 20 seconds · no spam', 'Gratis · tar 20 sekunder · ingen spam', 'Gratuit · 20 secondes · sans spam')}</p>
          </div>
        </aside>

        {/* Right — sign in / create account */}
        <div className="auth-main">
          <h2 className="auth-title">{isLogin ? T('Welcome back', 'Velkommen tilbake', 'Bon retour') : T('Create your account', 'Opprett konto', 'Créer un compte')}</h2>
          <p className="auth-sub">{isLogin ? T('Sign in to see your trips & offers.', 'Logg inn for å se reiser og tilbud.', 'Connectez-vous pour vos voyages et offres.') : T('One account for offers, bookings & itineraries.', 'Én konto for tilbud, bestillinger og reiseplaner.', 'Un compte pour offres, réservations et itinéraires.')}</p>

          <div className="auth-social">
            <button type="button" className="auth-google-btn" onClick={() => doOAuth('google')} disabled={busy}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.5z" fill="#4285F4"/><path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.1 0-11.3-4.1-13.1-9.7H2.8v6.1C6.8 42.6 14.9 48 24 48z" fill="#34A853"/><path d="M10.9 28.8c-.5-1.4-.8-2.8-.8-4.3s.3-3 .8-4.3v-6.1H2.8C1 17.4 0 20.6 0 24s1 6.6 2.8 9.9l8.1-5.1z" fill="#FBBC05"/><path d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.6 30.4 0 24 0 14.9 0 6.8 5.4 2.8 13.2l8.1 6.1C12.7 13.6 17.9 9.5 24 9.5z" fill="#EA4335"/></svg>
              {T('Continue with Google', 'Fortsett med Google', 'Continuer avec Google')}
            </button>
            <div className="auth-social-row">
              <button type="button" className="auth-social-btn" onClick={() => doOAuth('facebook')} disabled={busy} aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11 10.13 11.93v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.23 2.68.23v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.32l-.53 3.49h-2.79V24c5.73-.93 10.13-5.91 10.13-11.93z"/></svg>
                Facebook
              </button>
              <button type="button" className="auth-social-btn" onClick={() => doOAuth('apple')} disabled={busy} aria-label="Apple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1d1d1f"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.36-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.36C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Apple
              </button>
            </div>
          </div>

          <div className="auth-divider"><span>{T('or with email', 'eller med e-post', 'ou par e-mail')}</span></div>

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
