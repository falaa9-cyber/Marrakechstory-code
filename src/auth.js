const { useState: useSA, useEffect: useEA, useRef: useRA } = React;
const If2 = window.MS_I;
const AUTH_KEY = "ms_user";
const SOCIAL_LOGIN_ENABLED = false;
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch (e) {
    return null;
  }
}
async function accountFn(action, payload) {
  try {
    const env = window.MS_ENV || {};
    const base = (env.SUPABASE_URL || "").replace(/\/$/, "");
    const key = env.SUPABASE_KEY || "";
    if (!base || !key) return { ok: false, error: "not configured" };
    const r = await fetch(`${base}/functions/v1/client-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ action, ...payload })
    });
    return await r.json();
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}
function nameFromEmail(mail) {
  if (!mail) return "";
  const local = mail.split("@")[0].split("+")[0];
  return local.replace(/[._\-]+/g, " ").split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
function siteRedirectUrl() {
  if (window.MS_authRedirectUrl) return window.MS_authRedirectUrl();
  return window.location.origin + window.location.pathname;
}
async function safeSiteSession() {
  if (window.MS_safeGetSession && window.MS_SB) return await window.MS_safeGetSession(window.MS_SB, "ms-site-auth");
  const { data, error } = await window.MS_SB.auth.getSession();
  return { session: data && data.session || null, error: error || null };
}
function AuthModal({ view: initView, onClose, onLogin }) {
  var _a, _b;
  const ctx = ((_b = (_a = window.MS_CTX) == null ? void 0 : _a.useMS) == null ? void 0 : _b.call(_a)) || {};
  const lang = ctx.lang || "en";
  const T = (en, no, fr) => lang === "no" ? no : lang === "fr" ? fr : lang === "da" ? no || en : en;
  const [view, setView] = useSA(initView === "login" ? "login" : "register");
  const [name, setName] = useSA("");
  const [email, setEmail] = useSA("");
  const [phone, setPhone] = useSA("");
  const [pass, setPass] = useSA("");
  const [err, setErr] = useSA("");
  const [msg, setMsg] = useSA("");
  const [busy, setBusy] = useSA(false);
  useEA(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);
  const seedProfile = (user) => {
    try {
      const prev = JSON.parse(localStorage.getItem("ms_profile_data") || "{}");
      localStorage.setItem("ms_profile_data", JSON.stringify({
        ...prev,
        name: user.name || prev.name || "",
        email: user.email || prev.email || "",
        phone: user.phone || prev.phone || ""
      }));
    } catch (e) {
    }
  };
  const persistSubscriber = (user, source) => {
    if (window.MS_saveSubscriber) window.MS_saveSubscriber({ email: user.email, name: user.name, phone: user.phone, marketingOptIn: true, payload: { source } }, { source });
  };
  const finishAuth = (user, source) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    seedProfile(user);
    persistSubscriber(user, source);
    onLogin(user);
    onClose(true);
  };
  const userFromSession = (u, fallbackName) => {
    var _a2, _b2;
    return {
      id: u.id,
      email: u.email,
      name: ((_a2 = u.user_metadata) == null ? void 0 : _a2.name) || fallbackName || nameFromEmail(u.email) || (u.email || "").split("@")[0],
      phone: ((_b2 = u.user_metadata) == null ? void 0 : _b2.phone) || phone || ""
    };
  };
  const doLogin = async () => {
    var _a2;
    setErr("");
    setMsg("");
    if (!email.trim()) {
      setErr(T("Enter your email", "Skriv inn e-post", "Saisissez votre e-mail"));
      return;
    }
    if (!pass) {
      setErr(T("Enter your password", "Skriv inn passord", "Saisissez votre mot de passe"));
      return;
    }
    if (!((_a2 = window.MS_SB) == null ? void 0 : _a2.auth)) {
      setErr(T("Login service unavailable", "Tjenesten er utilgjengelig", "Service indisponible"));
      return;
    }
    setBusy(true);
    try {
      let { data, error } = await window.MS_SB.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
      if (error && /confirm/i.test(error.message || "")) {
        await accountFn("confirm", { email: email.trim().toLowerCase() });
        ({ data, error } = await window.MS_SB.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass }));
      }
      if (error) {
        if (/invalid login/i.test(error.message || "")) throw new Error(T("Wrong email or password.", "Feil e-post eller passord.", "E-mail ou mot de passe incorrect."));
        throw error;
      }
      finishAuth(userFromSession(data.user), "login");
    } catch (e) {
      setErr((e == null ? void 0 : e.message) || T("Login failed", "Innlogging feilet", "\xC9chec de la connexion"));
    } finally {
      setBusy(false);
    }
  };
  const doRegister = async () => {
    setErr("");
    setMsg("");
    if (!name.trim() || !email.trim()) {
      setErr(T("Fill in name and email", "Fyll inn navn og e-post", "Renseignez nom et e-mail"));
      return;
    }
    if (!pass || pass.length < 6) {
      setErr(T("Password must be at least 6 characters", "Passordet m\xE5 v\xE6re minst 6 tegn", "Au moins 6 caract\xE8res"));
      return;
    }
    setBusy(true);
    try {
      const r = await accountFn("signup", { email: email.trim().toLowerCase(), password: pass, name: name.trim(), phone: phone.trim() });
      if (!r.ok && r.code === "exists") {
        setView("login");
        setMsg(T("You already have an account \u2014 please sign in.", "Du har allerede en konto \u2014 logg inn.", "Vous avez d\xE9j\xE0 un compte \u2014 connectez-vous."));
        setBusy(false);
        return;
      }
      if (!r.ok) {
        throw new Error(r.error === "password too short" ? T("Password must be at least 6 characters", "Passordet m\xE5 v\xE6re minst 6 tegn", "Au moins 6 caract\xE8res") : r.error || T("Sign-up failed", "Registrering feilet", "\xC9chec de l'inscription"));
      }
      const { data, error } = await window.MS_SB.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
      if (error) throw error;
      finishAuth(userFromSession(data.user, name.trim()), "register");
    } catch (e) {
      setErr((e == null ? void 0 : e.message) || T("Sign-up failed", "Registrering feilet", "\xC9chec de l'inscription"));
    } finally {
      setBusy(false);
    }
  };
  const doForgot = async () => {
    setErr("");
    setMsg("");
    if (!email.trim()) {
      setErr(T("Enter your email first", "Skriv inn e-posten din f\xF8rst", "Saisissez votre e-mail"));
      return;
    }
    setBusy(true);
    try {
      await window.MS_SB.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: siteRedirectUrl() });
      setMsg(T("If that email has an account, a reset link is on its way. You can also message us on WhatsApp.", "Hvis e-posten har en konto, sender vi en lenke. Du kan ogs\xE5 melde oss p\xE5 WhatsApp.", "Si un compte existe, un lien arrive. Vous pouvez aussi nous \xE9crire sur WhatsApp."));
    } catch (e) {
      setErr((e == null ? void 0 : e.message) || "Error");
    } finally {
      setBusy(false);
    }
  };
  const doOAuth = async (provider) => {
    var _a2, _b2;
    setErr("");
    setMsg("");
    if (!((_b2 = (_a2 = window.MS_SB) == null ? void 0 : _a2.auth) == null ? void 0 : _b2.signInWithOAuth)) {
      setErr(T("Social sign-in unavailable \u2014 use email.", "Sosial innlogging utilgjengelig \u2014 bruk e-post.", "Connexion sociale indisponible \u2014 utilisez l'e-mail."));
      return;
    }
    setBusy(true);
    try {
      const { error } = await window.MS_SB.auth.signInWithOAuth({ provider, options: { redirectTo: siteRedirectUrl() } });
      if (error) {
        if (/provider|not enabled|disabled|unsupported|validation/i.test(error.message || "")) {
          setErr(T(`${provider[0].toUpperCase() + provider.slice(1)} sign-in is being set up \u2014 please use email for now.`, `Innlogging med ${provider} settes opp \u2014 bruk e-post inntil videre.`, `Connexion ${provider} en cours de configuration \u2014 utilisez l'e-mail.`));
        } else throw error;
      }
    } catch (e) {
      setErr((e == null ? void 0 : e.message) || T("Sign-in failed", "Innlogging feilet", "Connexion \xE9chou\xE9e"));
    } finally {
      setBusy(false);
    }
  };
  const backdropDownTarget = useRA(null);
  const onBackdropPointerDown = (e) => {
    if (e.target === e.currentTarget) backdropDownTarget.current = e.target;
  };
  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget && backdropDownTarget.current === e.target) onClose(false);
    backdropDownTarget.current = null;
  };
  const onInputFocus = (e) => {
    setTimeout(() => {
      try {
        e.target.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (e2) {
      }
    }, 280);
  };
  const isLogin = view === "login";
  const benefits = [
    ["\u2605", T("Get our best offers & seasonal deals first", "F\xE5 v\xE5re beste tilbud og sesongtilbud f\xF8rst", "Recevez nos meilleures offres en avant-premi\xE8re")],
    ["\u{1F9ED}", T("All your bookings, itineraries & invoices in one place", "Alle bestillinger, reiseplaner og fakturaer p\xE5 ett sted", "R\xE9servations, itin\xE9raires et factures au m\xEAme endroit")],
    ["\u2661", T("Save the trips and places you love", "Lagre reisene og stedene du elsker", "Sauvegardez vos voyages et lieux pr\xE9f\xE9r\xE9s")],
    ["\u{1F4AC}", T("Chat directly with Aladdin & Marte", "Chat direkte med Aladdin & Marte", "\xC9changez directement avec Aladdin & Marte")]
  ];
  const _modal = /* @__PURE__ */ React.createElement("div", { className: "auth-backdrop", onPointerDown: onBackdropPointerDown, onClick: onBackdropClick }, /* @__PURE__ */ React.createElement("div", { className: "auth-modal auth-modal-split", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "auth-close", onClick: () => onClose(false), "aria-label": "Close" }, "\u2715"), /* @__PURE__ */ React.createElement("aside", { className: "auth-aside", style: { backgroundImage: "url(assets/photos/riad-pool-dusk-15.jpg)" } }, /* @__PURE__ */ React.createElement("div", { className: "auth-aside-inner" }, /* @__PURE__ */ React.createElement("div", { className: "auth-aside-logo" }, /* @__PURE__ */ React.createElement("img", { src: "assets/logo.png", alt: "MarrakechStory", onError: (e) => {
    e.target.style.display = "none";
  } })), /* @__PURE__ */ React.createElement("h2", { className: "auth-aside-title" }, T("Join MarrakechStory", "Bli med i MarrakechStory", "Rejoignez MarrakechStory")), /* @__PURE__ */ React.createElement("p", { className: "auth-aside-sub" }, T("Create a free account \u2014 it makes planning your Morocco effortless.", "Opprett en gratis konto \u2014 det gj\xF8r planleggingen av Marokko enkel.", "Cr\xE9ez un compte gratuit \u2014 planifier votre Maroc devient simple.")), /* @__PURE__ */ React.createElement("ul", { className: "auth-benefits" }, benefits.map(([ic, txt], i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement("span", { className: "auth-benefit-ic" }, ic), txt))), /* @__PURE__ */ React.createElement("p", { className: "auth-aside-foot" }, T("Free \xB7 takes 20 seconds \xB7 no spam", "Gratis \xB7 tar 20 sekunder \xB7 ingen spam", "Gratuit \xB7 20 secondes \xB7 sans spam")))), /* @__PURE__ */ React.createElement("div", { className: "auth-main" }, /* @__PURE__ */ React.createElement("h2", { className: "auth-title" }, isLogin ? T("Welcome back", "Velkommen tilbake", "Bon retour") : T("Create your account", "Opprett konto", "Cr\xE9er un compte")), /* @__PURE__ */ React.createElement("p", { className: "auth-sub" }, isLogin ? T("Sign in to see your trips & offers.", "Logg inn for \xE5 se reiser og tilbud.", "Connectez-vous pour vos voyages et offres.") : T("One account for offers, bookings & itineraries.", "\xC9n konto for tilbud, bestillinger og reiseplaner.", "Un compte pour offres, r\xE9servations et itin\xE9raires.")), SOCIAL_LOGIN_ENABLED && /* @__PURE__ */ React.createElement("div", { className: "auth-social" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "auth-google-btn", onClick: () => doOAuth("google"), disabled: busy }, /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 48 48" }, /* @__PURE__ */ React.createElement("path", { d: "M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.5z", fill: "#4285F4" }), /* @__PURE__ */ React.createElement("path", { d: "M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.1 0-11.3-4.1-13.1-9.7H2.8v6.1C6.8 42.6 14.9 48 24 48z", fill: "#34A853" }), /* @__PURE__ */ React.createElement("path", { d: "M10.9 28.8c-.5-1.4-.8-2.8-.8-4.3s.3-3 .8-4.3v-6.1H2.8C1 17.4 0 20.6 0 24s1 6.6 2.8 9.9l8.1-5.1z", fill: "#FBBC05" }), /* @__PURE__ */ React.createElement("path", { d: "M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.6 30.4 0 24 0 14.9 0 6.8 5.4 2.8 13.2l8.1 6.1C12.7 13.6 17.9 9.5 24 9.5z", fill: "#EA4335" })), T("Continue with Google", "Fortsett med Google", "Continuer avec Google")), /* @__PURE__ */ React.createElement("div", { className: "auth-social-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "auth-social-btn", onClick: () => doOAuth("facebook"), disabled: busy, "aria-label": "Facebook" }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "#1877F2" }, /* @__PURE__ */ React.createElement("path", { d: "M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11 10.13 11.93v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.23 2.68.23v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.32l-.53 3.49h-2.79V24c5.73-.93 10.13-5.91 10.13-11.93z" })), "Facebook"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "auth-social-btn", onClick: () => doOAuth("apple"), disabled: busy, "aria-label": "Apple" }, /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "#1d1d1f" }, /* @__PURE__ */ React.createElement("path", { d: "M17.05 20.28c-.98.95-2.05.8-3.08.36-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.36C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" })), "Apple"))), SOCIAL_LOGIN_ENABLED && /* @__PURE__ */ React.createElement("div", { className: "auth-divider" }, /* @__PURE__ */ React.createElement("span", null, T("or with email", "eller med e-post", "ou par e-mail"))), /* @__PURE__ */ React.createElement("div", { className: "auth-tabs" }, /* @__PURE__ */ React.createElement("button", { className: `auth-tab ${isLogin ? "active" : ""}`, onClick: () => {
    setErr("");
    setMsg("");
    setView("login");
  } }, T("Sign in", "Logg inn", "Connexion")), /* @__PURE__ */ React.createElement("button", { className: `auth-tab ${!isLogin ? "active" : ""}`, onClick: () => {
    setErr("");
    setMsg("");
    setView("register");
  } }, T("Create account", "Ny konto", "Inscription"))), /* @__PURE__ */ React.createElement(
    "form",
    {
      className: "auth-fields",
      method: "post",
      autoComplete: "on",
      onSubmit: (e) => {
        e.preventDefault();
        isLogin ? doLogin() : doRegister();
      }
    },
    !isLogin && /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "auth-name" }, T("Full name", "Fullt navn", "Nom complet")), /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "auth-name",
        name: "name",
        required: true,
        onFocus: onInputFocus,
        autoComplete: "name",
        value: name,
        onChange: (e) => setName(e.target.value),
        placeholder: T("Your name", "Ditt navn", "Votre nom")
      }
    )),
    /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "auth-email" }, T("Email", "E-post", "E-mail")), /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "auth-email",
        name: "email",
        type: "email",
        required: true,
        onFocus: onInputFocus,
        autoComplete: "email",
        inputMode: "email",
        value: email,
        onChange: (e) => setEmail(e.target.value),
        placeholder: "you@example.com"
      }
    )),
    !isLogin && /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "auth-phone" }, T("Phone (optional)", "Telefon (valgfritt)", "T\xE9l\xE9phone (optionnel)")), /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "auth-phone",
        name: "tel",
        type: "tel",
        onFocus: onInputFocus,
        autoComplete: "tel",
        value: phone,
        onChange: (e) => setPhone(e.target.value),
        placeholder: "+47 \u2026"
      }
    )),
    /* @__PURE__ */ React.createElement("div", { className: "fld" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "auth-pw" }, T("Password", "Passord", "Mot de passe")), /* @__PURE__ */ React.createElement(
      "input",
      {
        id: "auth-pw",
        name: "password",
        type: "password",
        onFocus: onInputFocus,
        autoComplete: isLogin ? "current-password" : "new-password",
        value: pass,
        onChange: (e) => setPass(e.target.value),
        placeholder: isLogin ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : T("At least 6 characters", "Minst 6 tegn", "Au moins 6 caract\xE8res")
      }
    )),
    err && /* @__PURE__ */ React.createElement("p", { className: "auth-err" }, err),
    msg && /* @__PURE__ */ React.createElement("p", { className: "auth-msg" }, msg),
    /* @__PURE__ */ React.createElement("button", { type: "submit", className: "auth-alt-btn auth-alt-btn-primary auth-submit", disabled: busy }, busy ? "\u2026" : isLogin ? T("Sign in", "Logg inn", "Se connecter") : T("Create account", "Opprett konto", "Cr\xE9er un compte")),
    isLogin ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "auth-forgot", onClick: doForgot, disabled: busy }, T("Forgot password?", "Glemt passord?", "Mot de passe oubli\xE9 ?")) : /* @__PURE__ */ React.createElement("p", { className: "auth-fineprint" }, T("By creating an account you agree to receive trip updates. No spam.", "Ved \xE5 opprette konto godtar du reiseoppdateringer. Ingen spam.", "En cr\xE9ant un compte, vous acceptez de recevoir des nouvelles de voyage."))
  ), /* @__PURE__ */ React.createElement("button", { className: "auth-skip", onClick: () => onClose(false) }, T("Maybe later", "Kanskje senere", "Plus tard"), " \u2192"))));
  const RD = window.ReactDOM || (typeof ReactDOM !== "undefined" ? ReactDOM : null);
  return RD && RD.createPortal ? RD.createPortal(_modal, document.body) : _modal;
}
function AuthWidget({ user, onShowModal, onOpenProfile }) {
  if (!user) {
    return /* @__PURE__ */ React.createElement("button", { className: "auth-widget-btn auth-widget-btn-icon", onClick: onShowModal, "aria-label": "Log in" }, /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "7", r: "4" })));
  }
  const initial = ((user.name || user.email || "?").trim()[0] || "?").toUpperCase();
  const first = (user.name || user.email || "").split(/[ @]/)[0];
  return /* @__PURE__ */ React.createElement("button", { className: "auth-widget-user", onClick: onOpenProfile, "aria-label": "My account" }, /* @__PURE__ */ React.createElement("span", { className: "auth-avatar" }, initial), /* @__PURE__ */ React.createElement("span", { className: "auth-name" }, first));
}
function AuthSystem() {
  const [user, setUser] = useSA(getStoredUser);
  const [showModal, setShowModal] = useSA(false);
  const [modalView, setModalView] = useSA("register");
  const [showProfile, setShowProfile] = useSA(false);
  useEA(() => {
    var _a, _b;
    if (!((_b = (_a = window.MS_SB) == null ? void 0 : _a.auth) == null ? void 0 : _b.getSession)) return;
    safeSiteSession().then(({ session, error }) => {
      var _a2, _b2;
      if (error && window.MS_isStaleRefreshTokenError && window.MS_isStaleRefreshTokenError(error)) {
        localStorage.removeItem(AUTH_KEY);
        setUser(null);
        return;
      }
      const u = session == null ? void 0 : session.user;
      if (u) {
        const merged = { id: u.id, email: u.email, name: ((_a2 = u.user_metadata) == null ? void 0 : _a2.name) || nameFromEmail(u.email) || (u.email || "").split("@")[0], phone: ((_b2 = u.user_metadata) == null ? void 0 : _b2.phone) || "" };
        localStorage.setItem(AUTH_KEY, JSON.stringify(merged));
        setUser(merged);
      } else if (!session) {
        if (getStoredUser()) {
          localStorage.removeItem(AUTH_KEY);
          setUser(null);
        }
      }
    });
    const { data: sub } = window.MS_SB.auth.onAuthStateChange((event, session) => {
      var _a2, _b2;
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(AUTH_KEY);
        setUser(null);
      } else if (session == null ? void 0 : session.user) {
        const u = session.user;
        const merged = { id: u.id, email: u.email, name: ((_a2 = u.user_metadata) == null ? void 0 : _a2.name) || nameFromEmail(u.email) || (u.email || "").split("@")[0], phone: ((_b2 = u.user_metadata) == null ? void 0 : _b2.phone) || "" };
        localStorage.setItem(AUTH_KEY, JSON.stringify(merged));
        setUser(merged);
      }
    });
    return () => {
      var _a2, _b2;
      return (_b2 = (_a2 = sub == null ? void 0 : sub.subscription) == null ? void 0 : _a2.unsubscribe) == null ? void 0 : _b2.call(_a2);
    };
  }, []);
  const handleLogin = (u) => {
    setUser(u);
    setShowProfile(true);
  };
  const handleLogout = async () => {
    var _a, _b;
    try {
      if ((_b = (_a = window.MS_SB) == null ? void 0 : _a.auth) == null ? void 0 : _b.signOut) await window.MS_SB.auth.signOut();
    } catch (e) {
    }
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setShowProfile(false);
  };
  const openModal = (view = "register") => {
    setModalView(view);
    setShowModal(true);
  };
  window.MS_Auth_Prompt = (view) => openModal(view || "register");
  window.MS_Auth_PromptAfterBooking = () => {
    if (getStoredUser()) return;
    try {
      if (sessionStorage.getItem("ms_auth_booked")) return;
      sessionStorage.setItem("ms_auth_booked", "1");
    } catch (e) {
    }
    setTimeout(() => {
      if (!getStoredUser()) openModal("register");
    }, 600);
  };
  window.MS_Auth_User = user;
  window.MS_OpenProfile = () => {
    if (user) setShowProfile(true);
    else openModal("login");
  };
  const ProfilePanel = window.MS_ProfilePanel;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AuthWidget, { user, onShowModal: () => openModal("login"), onOpenProfile: () => setShowProfile(true) }), showModal && /* @__PURE__ */ React.createElement(AuthModal, { view: modalView, onLogin: handleLogin, onClose: () => setShowModal(false) }), showProfile && user && ProfilePanel && /* @__PURE__ */ React.createElement(ProfilePanel, { user, onLogout: handleLogout, onClose: () => setShowProfile(false) }));
}
window.MS_AuthSystem = AuthSystem;
