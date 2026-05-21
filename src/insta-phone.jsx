// ============================================
// Instagram Phone Mockup — iPhone frame on the right of the hero
// showing an infinite vertical scroll of @marrakechstory posts.
// No bundler: lives on window.MS_InstagramPhone.
// ============================================
const { useState: useStateIp, useEffect: useEffectIp, useMemo: useMemoIp } = React;

const IP_USERNAME = 'marrakechstory';
const IP_URL      = 'https://www.instagram.com/marrakechstory/';
const IP_AVATAR   = 'assets/logo.png';

const IP_POSTS = [
  { id: 1,  type: 'image', caption: 'REISE TIL MAROKKO? Vi hjelper deg ✈️🇲🇦',                                                                  link: 'https://www.instagram.com/marrakechstory/p/DRZgst6jZIC/',     thumb: 'assets/instagram/post-1.jpg',  likes: 2148, comments: 87,  shares: 312 },
  { id: 2,  type: 'image', caption: 'How We Plan Your Moroccan Trip – step by step guide ✨',                                                  link: 'https://www.instagram.com/marrakechstory/p/DGAnb0pN8NO/',     thumb: 'assets/instagram/post-2.jpg',  likes: 1542, comments: 64,  shares: 198 },
  { id: 3,  type: 'image', caption: 'Dette sier kundene våre ❤️ Real reviews from real travelers',                                              link: 'https://www.instagram.com/marrakechstory/p/DRepQ2ZjO_Y/',     thumb: 'assets/instagram/post-3.jpg',  likes: 3074, comments: 152, shares: 421 },
  { id: 4,  type: 'reel',  caption: 'You booked with MarrakechStory… and suddenly you’re watching the most beautiful Sahara sunset 🌅', link: 'https://www.instagram.com/marrakechstory/reel/DXX00FEDEVm/',  thumb: 'assets/instagram/post-4.jpg',  likes: 8930, comments: 412, shares: 1240 },
  { id: 5,  type: 'reel',  caption: 'Marrakech – where tradition and energy meet ✨ souks, medina, riads',                                      link: 'https://www.instagram.com/marrakechstory/reel/DXUbSnBjWWb/',  thumb: 'assets/instagram/post-5.jpg',  likes: 6210, comments: 248, shares: 873 },
  { id: 6,  type: 'reel',  caption: 'Me & you, together in Morocco 🇲🇦 from desert vibes to city lights ❤️',                                  link: 'https://www.instagram.com/marrakechstory/reel/DXSTo2HjfR5/',  thumb: 'assets/instagram/post-6.jpg',  likes: 5483, comments: 197, shares: 612 },
  { id: 7,  type: 'reel',  caption: 'Lost in the iconic Majorelle Garden 💙 where nature meets art',                                            link: 'https://www.instagram.com/marrakechstory/reel/DXRDHJEjeY4/',  thumb: 'assets/instagram/post-7.jpg',  likes: 4127, comments: 134, shares: 506 },
  { id: 8,  type: 'reel',  caption: 'Atlas Mountains 🏔️ snow-capped peaks & hidden Berber villages',                                            link: 'https://www.instagram.com/marrakechstory/reel/DXM5hiojc-z/',  thumb: 'assets/instagram/post-8.jpg',  likes: 7340, comments: 286, shares: 982 },
  { id: 9,  type: 'reel',  caption: 'Rabat hits different… history meets the ocean 🌊✨',                                                        link: 'https://www.instagram.com/marrakechstory/reel/DXKwDqyDUPk/',  thumb: 'assets/instagram/post-9.jpg',  likes: 2870, comments: 104, shares: 358 },
  { id: 10, type: 'reel',  caption: 'Essaouira – if Marrakech is the heart, Essaouira is the soul 🌊💨',                                        link: 'https://www.instagram.com/marrakechstory/reel/DWejJXajYl1/',  thumb: 'assets/instagram/post-10.jpg', likes: 4685, comments: 168, shares: 597 },
];

// Compact short-form formatter — 9876 → "9.9k"
function fmtCount(n) {
  if (n == null) return '';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

// Fallback chain — if a thumbnail file isn't on disk yet, use a brand-coloured local photo
const IP_FALLBACKS = [
  'assets/photos/agafay-valley-marrakech-93.jpg',
  'assets/photos/hammam-mamounia-marrakech-morocco.jpg.avif',
  'assets/photos/agafay-valley-marrakech-70.jpg',
  'assets/photos/marrakech-desert.jpg',
  'assets/photos/cheval-essaouira.jpg',
  'assets/photos/about-us-hq-26-scaled.jpg.webp',
  'assets/photos/lodge-atlas-1-scaled.jpg.webp',
  'assets/photos/about-us-hq-31-scaled.jpg.webp',
  'assets/photos/jemaa-el-fna-18.jpg',
  'assets/photos/agafay-valley-marrakech-38.jpg',
];

// Inline SVGs (avoid loading lucide-react since we don't bundle).
const Ig = {
  verified: (s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="#0095F6" aria-hidden="true">
      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
    </svg>
  ),
  camera: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="14" rx="1.5"/>
      <circle cx="12" cy="13" r="3"/>
      <path d="M7 6 8.5 4h7L17 6"/>
    </svg>
  ),
  heart: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  comment: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  ),
  share: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  bookmark: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  home: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5 12 2l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>
    </svg>
  ),
  search: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  reels: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="3"/>
      <line x1="7" y1="2" x2="11" y2="8"/>
      <line x1="17" y1="2" x2="13" y2="8"/>
      <line x1="2" y1="8" x2="22" y2="8"/>
      <polygon points="10 13 16 16 10 19" fill="currentColor" stroke="none"/>
    </svg>
  ),
  user: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  play: (s = 24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <polygon points="6 3 22 12 6 21 6 3"/>
    </svg>
  ),
  chevronDown: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  insta: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
};

// Self-healing image — primary → indexed fallback → final placeholder colour
function PostImg({ thumb, fallbackIdx }) {
  const [src, setSrc] = useStateIp(thumb);
  const [stage, setStage] = useStateIp('primary');
  const onError = () => {
    if (stage === 'primary') { setSrc(IP_FALLBACKS[fallbackIdx % IP_FALLBACKS.length]); setStage('fallback'); }
    else if (stage === 'fallback') {
      setSrc('');
      setStage('placeholder');
    }
  };
  if (stage === 'placeholder') {
    return <div className="ip-post-img ip-post-placeholder" aria-hidden="true" />;
  }
  return (
    <img src={src}
      onError={onError}
      alt=""
      loading="lazy"
      decoding="async"
      className="ip-post-img" />
  );
}

function PostCard({ post, idx }) {
  return (
    <a href={post.link} target="_blank" rel="noopener" className="ip-post"
      aria-label={`Open Instagram ${post.type}: ${post.caption}`}>
      <div className="ip-post-head">
        <span className="ip-post-avatar" aria-hidden="true">
          <img src={IP_AVATAR} alt="" />
        </span>
        <span className="ip-post-user">
          <strong>{IP_USERNAME}</strong>
          <span className="ip-post-dot"> · </span>
          <span className="ip-post-follow">Follow</span>
        </span>
        <span className="ip-post-dots" aria-hidden="true">···</span>
      </div>
      <div className="ip-post-media">
        <PostImg thumb={post.thumb} fallbackIdx={idx} />
        {post.type === 'reel' && (
          <span className="ip-post-reel-tag" aria-hidden="true">
            {Ig.play(14)}
            <span>REEL</span>
          </span>
        )}
      </div>
      <div className="ip-post-actions">
        <span className="ip-post-act">{Ig.heart(22)}<em>{fmtCount(post.likes)}</em></span>
        <span className="ip-post-act">{Ig.comment(22)}<em>{fmtCount(post.comments)}</em></span>
        <span className="ip-post-act">{Ig.share(22)}<em>{fmtCount(post.shares)}</em></span>
        <span className="ip-post-bookmark">{Ig.bookmark(22)}</span>
      </div>
      <div className="ip-post-likes"><strong>{fmtCount(post.likes)}</strong> likes</div>
      <div className="ip-post-caption">
        <strong>{IP_USERNAME}</strong> {post.caption} <span className="ip-post-more">… more</span>
      </div>
      <div className="ip-post-time">View all {fmtCount(post.comments)} comments · 2 days ago</div>
    </a>
  );
}

function InstagramPhoneMockup() {
  const items = useMemoIp(() => IP_POSTS.concat(IP_POSTS), []);

  return (
    <div className="ip-wrap" aria-label="Instagram feed preview for marrakechstory">
      {/* Soft Moroccan glow behind the phone */}
      <span className="ip-glow" aria-hidden="true" />

      {/* CTA pill above the phone */}
      <a className="ip-follow-btn" href={IP_URL} target="_blank" rel="noopener"
        aria-label="Follow Marrakech Story on Instagram">
        <span aria-hidden="true">📸</span>
        <span>Follow us on Instagram <strong>@{IP_USERNAME}</strong></span>
      </a>

      {/* Phone */}
      <div className="ip-phone">
        <span className="ip-phone-button ip-phone-button-1" aria-hidden="true" />
        <span className="ip-phone-button ip-phone-button-2" aria-hidden="true" />
        <span className="ip-phone-button ip-phone-button-3" aria-hidden="true" />
        <span className="ip-phone-button ip-phone-button-4" aria-hidden="true" />

        <div className="ip-screen">
          <span className="ip-notch" aria-hidden="true" />

          <div className="ip-top">
            <span className="ip-top-user">
              <strong>{IP_USERNAME}</strong>
              <span className="ip-top-verified" aria-label="Verified">{Ig.verified(13)}</span>
              <span className="ip-top-chev" aria-hidden="true">{Ig.chevronDown(14)}</span>
            </span>
            <span className="ip-top-camera" aria-hidden="true">{Ig.camera(18)}</span>
          </div>

          <div className="ip-feed-viewport">
            <div className="ip-feed-track">
              {items.map((p, i) => <PostCard key={i} post={p} idx={i} />)}
            </div>
          </div>

          <div className="ip-bottom">
            <span aria-hidden="true">{Ig.home()}</span>
            <span aria-hidden="true">{Ig.search()}</span>
            <span aria-hidden="true">{Ig.reels()}</span>
            <span aria-hidden="true">{Ig.heart()}</span>
            <span aria-hidden="true">{Ig.user()}</span>
          </div>

          <span className="ip-home-indicator" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

window.MS_InstagramPhone = InstagramPhoneMockup;
