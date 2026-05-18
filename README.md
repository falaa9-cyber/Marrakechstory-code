# Marrakech Story — Website

Boutique luxury travel agency operating between Norway and Morocco, primarily serving Norwegian and Scandinavian travellers. Marrakechstory.com is a fully static single-page React app — no build step, no npm, no backend — runnable from any plain HTTP server.

> **Brand voice:** quiet luxury, editorial, generous white space, never markety.  
> **Accent colour:** `#e1432a` (terracotta) · sand: `#C9B99A` · espresso: `#1f1b16` · cream: `#F5EFE4`  
> **Languages:** Norwegian (default) · English · French  
> **Currencies:** NOK · EUR · USD · MAD · GBP — every price flows through one `usePrice()` helper

---

## Quick start

```bash
cd /Users/kjaerekunde
python3 -m http.server 8080
# open http://localhost:8080
```

Any static-file server works (`npx serve`, nginx, Caddy, GitHub Pages). No build, no node_modules.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **React 18 UMD** loaded from CDN | No build pipeline, the site is editable in any text editor |
| Templating | **`<script type="text/babel">` + Babel standalone** | Lets us write JSX in raw `.jsx` files without compilation |
| Styling | **Plain CSS** (`styles.css`) with CSS custom properties + a few brand tokens | Cacheable, no dependency chain |
| State | **localStorage** for auth, profile, favourites, cookie consent | No backend, no third-party tracker, fully GDPR-friendly |
| Data | **`src/data.js`** — one module exports `window.MS_DATA` | Easy to swap in a CMS later if needed |
| Versioning | `?v=N` query string on every `<script>` and stylesheet | Cache-busts in production with one bump |
| Server | Python `http.server` on port 8080 (dev) | Anything works in prod |

**Explicitly not used:** npm, Next.js, Webpack, Vite, Tailwind, TypeScript, Framer Motion, GSAP, Lenis, sharp.

---

## File layout

```
/
├── index.html                    Entry point — script tags load all jsx files in order
├── styles.css                    All site CSS (~5k lines, organised by section)
├── README.md                     This file
│
├── src/
│   ├── i18n.jsx                  EN/NO/FR translations, currency formatters, MSProvider context
│   ├── icons.jsx                 SVG icon set (Arrow, Heart, Star, Pin, Clock, Plane, …)
│   ├── motion.jsx                Motion primitives: PageEntrance, TextReveal, ImageReveal, Cinemagraph, KenBurns
│   ├── data.js                   ACTIVITIES · RESTAURANTS · SPAS · CAMPS · POOLS · TRANSPORT · EXCURSIONS · PACKAGES
│   ├── hero-slider.jsx           6-slide cinematic hero with autoplay + Ken Burns + optional hero video
│   ├── hero.jsx                  (Legacy — hidden via CSS, kept for reference)
│   ├── packages.jsx              (Legacy — Reiser was merged into itineraries; script tag removed)
│   ├── catalog.jsx               6-tab catalog: Activities / Restaurants / Excursions / Spa / Camps / Pools / Transport
│   ├── itineraries.jsx           Reiseplaner — 22 trips (5 most-booked packages + 17 chapters) in catalog-style grid
│   ├── flights.jsx               (Disabled — flight section removed; affiliate scaffolding kept on disk)
│   ├── resources.jsx             (Disabled — Ressurser section removed; PDFs still in /assets/docs)
│   ├── form.jsx                  Multi-step trip-planning form (8 steps, auto-saves)
│   ├── extras.jsx                Instagram strip, contact card, WhatsApp floating widget
│   ├── extras2.jsx               Chatbot · Cookie banner · Profile dashboard
│   ├── auth.jsx                  AuthModal + AuthWidget + AuthSystem (localStorage-backed)
│   └── app.jsx                   App shell — Nav + composition of all sections + Footer + floating widgets
│
├── assets/
│   ├── photos/                   153 venue/destination photos (Lodge Atlas, Agafay, Sultana spa, etc.)
│   ├── wallpapers/               3 brand wallpapers for hero candidates
│   ├── logos/                    3 brand logos + QR code
│   ├── docs/                     12 PDFs (catalogues, sample itineraries, guides, transport offer)
│   ├── videos/                   Hero MP4 goes here — see § Hero video
│   └── catalog/                  Optional canonical real-photo path (resolver checks here first)
│
└── scripts/
    ├── generate_prompts.py       Walks data.js → emits per-venue AI image prompts (placeholder-prompts.json)
    ├── generate_images.py        Reads placeholder-prompts.json → calls Replicate (Flux Pro / Schnell)
    └── README.md                 Prompt-pipeline workflow + cost guidance
```

---

## Page structure (in order)

```
<HeroSlider />                    6-slide cinematic hero, autoplay 6.5s, optional video on slide 1
<Itineraries />                   Reiseplaner — 22 trips in 4-col catalog-style grid, 8/page
<Catalog />                       7 tabs of ~200 venues, 4-col catalog-style grid, 8/page
<Form />                          8-step trip-planning form, auto-filled from auth user
<Contact />                       Contact card + map
<Footer />                        Static footer
<WhatsAppWidget />                Bottom-right green floating bubble
<Chatbot />                       Sparkle (Gemini-style) chat bubble above WhatsApp
<InstagramWidget />               Instagram floating bubble at top of the widget stack
<CookieBanner />                  Bottom-centre bar, accept/decline, persists in localStorage
```

---

## Data sources

| Array | Items | Source |
|---|---:|---|
| `ACTIVITIES` | 46 | marrakechbestof.com (curated list) |
| `RESTAURANTS` | 91 | marrakechbestof.com (full scrape with galleries + descriptions) |
| `POOLS` | 63 | marrakechbestof.com (full scrape) |
| `SPAS` | 18 | marrakechbestof.com (full scrape) |
| `EXCURSIONS` | 6 | marrakechbestof.com (full scrape) |
| `CAMPS` | 14 | Curated Agafay desert camps |
| `TRANSPORT` | 5 | dunefleet.com (Renault Clio 5, Dacia Logan, Renault Kardian, Hyundai Tucson, VW T-Roc) |
| `PACKAGES` | 5 | In-house Marrakechstory packages (Medina Escape, Atlas & Medina, Atlas to Sahara, Imperial Cities & Sahara, Grand Morocco) — surfaced as "MOST BOOKED" in the reiseplaner |
| `ITINS` (in `itineraries.jsx`) | 17 | Marrakechstory chapters (3-day Sahara → 15-day Grand Discovery) |

Each catalog item carries: `name · slug · area · cuisine/style · price · rating · reviews · tag · filter · desc · description · img · images[] · atmosphere · perfectFor · offers/prices · practical · whatToOrder · perk`.

---

## Hero video

Slide 1 of `<HeroSlider />` supports a looping background video that plays via IntersectionObserver and falls back to the image on error.

**To enable:** drop your MP4 at `assets/videos/GettyImages-961736404.mp4`.

**Spec (matches the source page):**

| Attribute | Value |
|---|---|
| Source | `assets/videos/GettyImages-961736404.mp4` |
| Dimensions | 1280 × 720 (16:9), object-fit cover |
| Duration | ~36 s, designed to loop seamlessly |
| Attributes | `loop muted playsinline disablepictureinpicture preload=auto` |
| Autoplay | Driven by IntersectionObserver — plays when slide is active **and** the hero is in the viewport |
| Fallback | `poster` = the slide's still image; on `<video onError>` the component unmounts and the still image stays |
| Reduced-motion | `prefers-reduced-motion: reduce` → video not rendered at all |
| CSS | `position: absolute; inset: 0; object-fit: cover; z-index: 2; pointer-events: none; transition: opacity .3s` |
| Container | `<section class="ms-hero">` — same `min-height: 60vh / 480px` as the rest of the hero |

To add a video to other slides, set `video: "assets/videos/your-file.mp4"` on any entry in the `SLIDES` array in `src/hero-slider.jsx`.

---

## Auth & "DB"

### Auth (`src/auth.jsx`)
- **Modal on first visit** (skippable; choice persists in `localStorage['ms_auth_skipped']`)
- **Three flows:** Google (mocked) · Email login · Register
- **Inputs use proper `autocomplete` attributes** so browsers + password managers (iCloud Keychain, 1Password, Google) fill them in
- **`nameFromEmail()`** derives a real first/last name from email when only email is provided (`ola.nordmann@gmail.com` → "Ola Nordmann")
- **`seedProfile()`** writes name+email into the profile store on every login so the contact form prefills immediately
- **`AuthWidget`** lives in the nav — always-accessible login button (white text on hero, dark text elsewhere); when logged in shows the avatar pill that opens the profile dashboard

### "Database" (localStorage schema)

| Key | Type | Set by | Read by |
|---|---|---|---|
| `ms_user` | `{ name, email, google? }` JSON | AuthModal | AuthSystem, ProfilePanel, form auto-fill |
| `ms_auth_skipped` | `"1"` | AuthModal close × | AuthSystem first-visit check |
| `ms_profile_data` | `{ name, email, phone, country, travellers, interests }` JSON | ProfilePanel + login seed | form auto-fill, ProfilePanel |
| `ms_user_favs` | `string[]` of itinerary slugs | itinerary heart click | ProfilePanel "Mine reiser" tab |
| `ms_catalog_favs` | `{ [tab-name]: true }` JSON | catalog heart click | ProfilePanel "Lagrede steder og aktiviteter" tab |
| `ms_cookie_choice` | `"accepted"` \| `"declined"` | CookieBanner | CookieBanner first-visit check |
| `ms_user_locale` | implicit via MSCtx React state (not persisted) | LanguageToggle | every component |

### Profile dashboard (`<ProfilePanel />`)
Opens when a logged-in user clicks the nav avatar. Three tabs:
- **Oversikt** — counts of saved trips, profile-complete %, plus a "Need a trip?" CTA into the planning form
- **Mine reiser** — two sections: *Saved trips* (reiseplaner favourites) + *Saved places & activities* (catalog favourites) with hero image, chapter/category, title, teaser
- **Min info** — auto-saving form for name, email, phone (with country code), traveller count, interests; logout button at the foot

### Adding a real backend (if/when)
The localStorage schema mirrors what a Postgres/Supabase user-profile table would look like. To migrate:
1. Spin up Supabase / Firebase / your own API
2. Replace the `readProfile()` / `writeProfile()` helpers in `extras2.jsx` with fetch calls
3. Replace `getStoredUser()` / `localStorage.setItem(AUTH_KEY, …)` in `auth.jsx` with your auth provider's SDK
4. Wire `MS_Auth_Google_Email` (currently a window var) to the real Google OAuth callback

No catalog code changes needed — `window.MS_Auth_User` stays as the read-side contract.

---

## Multi-language & currency

### Translation (`src/i18n.jsx`)
- `MSProvider` holds `lang` (no/en/fr) and `curr` (NOK/EUR/USD/MAD/GBP) in React state
- `useT()` returns a translator function: `t('cat_eyebrow')` → looks up the key in `TRANSLATIONS[lang]`, falls back to English, then to the key itself
- Components also use an inline `tx(en, no, fr)` helper for one-off strings that aren't worth a key

### Currency (`src/i18n.jsx`)
```js
const CURRENCIES = {
  NOK: { rate: 11.5, format: n => `kr ${Math.round(n).toLocaleString('no-NO')}` },
  EUR: { rate: 1,    format: n => `€${Math.round(n).toLocaleString('en-GB')}` },
  USD: { rate: 1.08, format: n => `$${Math.round(n).toLocaleString('en-US')}` },
  MAD: { rate: 11,   format: n => `${Math.round(n).toLocaleString('fr-MA')} MAD` },
  GBP: { rate: 0.85, format: n => `£${Math.round(n).toLocaleString('en-GB')}` },
};
```
- `usePrice()` returns `eur => CURRENCIES[curr].format(eur * CURRENCIES[curr].rate)`
- **Itineraries apply a +40% markup** before formatting (`adjustedPrice(eur) = price(eur * 1.4)`)
- **Catalog items** display their native price strings as-is (mostly already in € as set by the source)

---

## Components: hero · catalog · reiseplaner

### Hero (`<HeroSlider />`)
- 6 slides, autoplay every 6.5s, hover-to-pause, keyboard ← →, touch swipe
- Each slide: full-bleed image (or video), 4-point sand-coloured eyebrow, Fraunces headline, lead paragraph, 3 chips, primary CTA (brand orange) + ghost CTA, 5-star trust line
- Right-side trust card in **brand terracotta gradient**: "Siden 2022 · Bygger reiser" / "6,000+ Tours delivered" / "5.0★ Google" / "24/7 In-country support" / "● Licensed & fully insured"
- Bottom progress bar (6 segments, active in brand orange) + prev/next arrows + `01 / 06` counter
- **40% shorter** than the original (`60vh` / 480px min) with adapted text sizes (clamp 28–50px headline)
- Old `<Hero />` from `hero.jsx` is **hidden via CSS** (`.hero-v2 { display: none }`) — kept on disk for reference

### Catalog (`<Catalog />`)
- 7 tabs in a rounded white pill bar (cat-tabs-v2): **Aktiviteter · Restauranter · Utflukter · Spa & Hammam · Agafay-leirer · Basseng · Transport** — each with item count
- Category filter chips below the tab bar
- **4 cards per row** (`.cat-grid` — `repeat(4, 1fr)`, 18px gap; responsive 4→3→2→1 at 1200/900/560px)
- Cards show: image with category badge + favourite heart, star rating, Fraunces title, area pin, duration line, teaser, price + circular arrow CTA
- **8 visible by default**; Show more reveals +8 each click; "Show all" jumps to the full list
- **Modal** with hero image (carousel if `images[]` is present), atmosphere, perfectFor chips, prices table, included list, practical bullets, **transport box** (auto-green if transport detected in the data, terracotta with "Need transport?" CTA otherwise), Marrakech Story perk panel where negotiated
- **Transport tab** also shows the long-rental discount banner (10+/-5% · 20+/-10% · 30+/-15% · unlimited mileage · free delivery · insurance)

### Reiseplaner (`<Itineraries />`)
- Same `cat-tabs-v2` filter bar as catalog: **Alle · Mest bestilt · 3 dager · 4 dager · 5 dager · Dagsturer · 1 uke+** with counts
- Below: orange animated **"+ Lag din reise" pill** + chapter count on the right
- Catalog grid layout (4 cards per row, 8 per page)
- Each card: image with `3D2N` duration chip + `MOST BOOKED / SLOW TRAVEL / LUXURY` badge, fav heart, star rating, Fraunces title, route pin, chapter line, teaser, **price in selected currency × 1.4 markup**, circular arrow CTA
- **Modal:** hero with overlay, full overview, highlights, theme chips, price card, day-by-day cards, included (✓) / excluded (✕) grid, **Regler og vilkår** (8-point booking T&Cs in plain Norwegian), CTAs to plan or WhatsApp
- 22 chapters total: 5 most-booked Marrakechstory packages first (Medina Escape → Grand Morocco), then 17 curated itineraries (Three Days In The Sahara → The Grand Discovery — 15 Days)

---

## Floating widgets (bottom-right, stacked)

| Z-order (bottom → top) | Widget | Bottom offset |
|---|---|---|
| 1 | WhatsApp green bubble | 24px |
| 2 | **Chatbot** — Gemini-style sparkle in purple→orange gradient with pulsing ring | 96px |
| 3 | Instagram gradient bubble | 168px |

### Chatbot (`<Chatbot />`)
- Pre-canned FAQ with 10 questions/answers per language (book, prices, customise, payment, cancel, group size, flights, location, insurance, language)
- Keyword-overlap scorer routes user text to best matching FAQ answer
- Unknown questions → "I'll send to the team; reply in 24 h, or WhatsApp +212 698 164 331"
- Panel header in brand terracotta gradient; user bubbles same gradient; bot bubbles white-on-cream

### Cookie banner (`<CookieBanner />`)
- 800ms delay after load
- "We use cookies" — plain-language explainer in NO/EN/FR
- [No, thanks] [Accept] · choice persisted in `ms_cookie_choice`

---

## Motion primitives (`src/motion.jsx`)

Vanilla React + CSS, no external libraries. All five primitives respect `prefers-reduced-motion`.

| Primitive | What it does |
|---|---|
| `<TextReveal as="h2">` | Word-by-word rise with `cubic-bezier(0.16, 1, 0.3, 1)` easing, 80ms stagger |
| `<ImageReveal src=... aspectRatio=... priority>` | Terracotta curtain retracts upward over 1.2s on viewport enter |
| `<Cinemagraph mp4=... poster=...>` | Silent looping video with poster fallback, autoplay paused when tab hidden |
| `<KenBurns src=... maxScale={1.08}>` | Slow scroll-driven scale on hero images |
| `<PageEntrance />` | (Disabled — was the terracotta sweep on first load; removed per brand preference) |

Brand easing tokens in CSS: `--ease-content: cubic-bezier(0.16, 1, 0.3, 1)` for content reveals, `--ease-page: cubic-bezier(0.7, 0, 0.2, 1)` for transitions.

---

## Versioning workflow

Every JS file is loaded with `?v=N`. To force a cache refresh after a code change:

```bash
# In index.html
sed -i '' 's/?v=36/?v=37/g' index.html
```

Current version: **`?v=36`**.

---

## Asset pipeline

### Real photos
Drop venue photos at `assets/photos/<filename>` and reference them as `img: "assets/photos/<filename>"` in `src/data.js`. The catalog's `<ResolvedImg>` component will use them with an `onError` fallback chain: real → AI placeholder → remote URL.

### AI placeholder pipeline (`scripts/`)
For venues without real photos:

```bash
# Generate per-venue prompts
python3 scripts/generate_prompts.py

# Review prompts in placeholder-prompts.json

# Generate images (your Replicate token, your billing)
export REPLICATE_API_TOKEN=r8_...
python3 scripts/generate_images.py --dry-run                    # confirms ~$7.68
python3 scripts/generate_images.py --only=activities --max-cost=2
```

See `scripts/README.md` for full workflow + cost guardrails.

### Downloadable PDFs (`assets/docs/`)
12 catalogues, sample itineraries, brochures (welcome guide, desert guide, 15-day Grand Discovery, transport offer, etc.). The Resources section that exposed these was removed per brand simplification; PDFs remain on disk for direct linking.

---

## Known caveats

- **No build pipeline** = no AVIF/WebP transcoding; bring photos in pre-optimised
- **Babel-standalone parses JSX in the browser** — fine for development and small-team deployment, slow for first paint on cold cache. Move to a precompiled bundle (esbuild/vite) when traffic warrants
- **localStorage as DB** caps profile data at ~5MB per origin; fine for thousands of saved favourites
- **No SSR** = limited SEO. Per-route landing pages would require Next.js / Astro
- **External CDN dependencies:** unpkg.com (React UMD), Google Fonts (Fraunces / Inter / JetBrains Mono). For an air-gapped deployment, host these locally

---

## Brand non-negotiables

These are baked into the design system; don't violate them when adding features.

1. Headline easing is `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo). No springs, no bounces.
2. Page transition overlay (when used) is `#e1432a`, not a gradient.
3. **Cards lift; images don't zoom** on hover. Cards translate `Y(-2px)` with deepened shadow.
4. **`prefers-reduced-motion` is honoured** everywhere (CSS media query + JS hook).
5. **No autoplay video with sound.** Hero video and cinemagraphs are silent.
6. **Transform and opacity only** for animations. Never animate `top/left/width/height`.
7. **Page hidden → pause everything.** `extras2.jsx` and `motion.jsx` install Page-Visibility listeners that pause `<video>` elements.
8. **No skeleton shimmers, no icon spins.** Loading states are static.
9. **Affiliate disclosure visible** wherever third-party prices are surfaced (was the case for the flights module; that module is currently disabled).

---

## Credits

- **Photography:** Marrakechstory in-house team + curated Unsplash + marrakechbestof.com
- **Stock photography:** Pexels (56 photos under the `stock-*` prefix)
- **Fleet imagery:** Dunefleet.com (5 vehicles, served directly from their CDN)
- **Fonts:** Fraunces (headlines), Inter (body), JetBrains Mono (eyebrows / counters)
- **Icons:** custom SVG set in `src/icons.jsx`

---

**Contact:** marrakechstory@outlook.com · WhatsApp `+212 698 164 331`
