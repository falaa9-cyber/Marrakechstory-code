const { useState: useStateIp, useEffect: useEffectIp, useMemo: useMemoIp } = React;
const IP_USERNAME = "marrakechstory";
const IP_URL = "https://www.instagram.com/marrakechstory/";
const IP_AVATAR = "assets/logo.png";
const IP_POSTS = [
  { id: 1, type: "image", caption: "REISE TIL MAROKKO? Vi hjelper deg \u2708\uFE0F\u{1F1F2}\u{1F1E6}", link: "https://www.instagram.com/marrakechstory/p/DRZgst6jZIC/", thumb: "assets/photos/sahara-sunset-riding-17.jpg", likes: 2148, comments: 87, shares: 312 },
  { id: 2, type: "image", caption: "How We Plan Your Moroccan Trip \u2013 step by step guide \u2728", link: "https://www.instagram.com/marrakechstory/p/DGAnb0pN8NO/", thumb: "assets/photos/riad-courtyard-pool-03.jpg", likes: 1542, comments: 64, shares: 198 },
  { id: 3, type: "image", caption: "Dette sier kundene v\xE5re \u2764\uFE0F Real reviews from real travelers", link: "https://www.instagram.com/marrakechstory/p/DRepQ2ZjO_Y/", thumb: "assets/photos/about-07.webp", likes: 3074, comments: 152, shares: 421 },
  { id: 4, type: "reel", caption: "You booked with MarrakechStory\u2026 and suddenly you\u2019re watching the most beautiful Sahara sunset \u{1F305}", link: "https://www.instagram.com/marrakechstory/reel/DXX00FEDEVm/", thumb: "assets/photos/sahara-dunes-12.jpg", likes: 8930, comments: 412, shares: 1240 },
  { id: 5, type: "reel", caption: "Marrakech \u2013 where tradition and energy meet \u2728 souks, medina, riads", link: "https://www.instagram.com/marrakechstory/reel/DXUbSnBjWWb/", thumb: "assets/photos/medina-food-stall-12.jpg", likes: 6210, comments: 248, shares: 873 },
  { id: 6, type: "reel", caption: "Me & you, together in Morocco \u{1F1F2}\u{1F1E6} from desert vibes to city lights \u2764\uFE0F", link: "https://www.instagram.com/marrakechstory/reel/DXSTo2HjfR5/", thumb: "assets/photos/agafay-12.jpg", likes: 5483, comments: 197, shares: 612 },
  { id: 7, type: "reel", caption: "Lost in the iconic Majorelle Garden \u{1F499} where nature meets art", link: "https://www.instagram.com/marrakechstory/reel/DXRDHJEjeY4/", thumb: "assets/photos/food-garden-restaurant-05.jpg", likes: 4127, comments: 134, shares: 506 },
  { id: 8, type: "reel", caption: "Atlas Mountains \u{1F3D4}\uFE0F snow-capped peaks & hidden Berber villages", link: "https://www.instagram.com/marrakechstory/reel/DXM5hiojc-z/", thumb: "assets/photos/atlas-lodge-05.webp", likes: 7340, comments: 286, shares: 982 },
  { id: 9, type: "reel", caption: "Rabat hits different\u2026 history meets the ocean \u{1F30A}\u2728", link: "https://www.instagram.com/marrakechstory/reel/DXKwDqyDUPk/", thumb: "assets/photos/riad-pool-terrace-08.avif", likes: 2870, comments: 104, shares: 358 },
  { id: 10, type: "reel", caption: "Essaouira \u2013 if Marrakech is the heart, Essaouira is the soul \u{1F30A}\u{1F4A8}", link: "https://www.instagram.com/marrakechstory/reel/DWejJXajYl1/", thumb: "assets/photos/essaouira-beach-horse-01.jpg", likes: 4685, comments: 168, shares: 597 }
];
function fmtCount(n) {
  if (n == null) return "";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}
const IP_FALLBACKS = [
  "assets/photos/agafay-16.jpg",
  "assets/photos/hammam-spa-room-01.avif",
  "assets/photos/agafay-12.jpg",
  "assets/photos/sahara-dunes-11.jpg",
  "assets/photos/essaouira-beach-horse-01.jpg",
  "assets/photos/about-07.webp",
  "assets/photos/atlas-lodge-05.webp",
  "assets/photos/about-09.webp",
  "assets/photos/medina-food-stall-12.jpg",
  "assets/photos/agafay-11.jpg"
];
const Ig = {
  verified: (s = 13) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "#0095F6", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" })),
  camera: (s = 16) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "6", width: "20", height: "14", rx: "1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "13", r: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M7 6 8.5 4h7L17 6" })),
  heart: (s = 22) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })),
  comment: (s = 22) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" })),
  share: (s = 22) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), /* @__PURE__ */ React.createElement("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })),
  bookmark: (s = 22) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" })),
  home: (s = 22) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3 9.5 12 2l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" })),
  search: (s = 22) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })),
  reels: (s = 22) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "7", y1: "2", x2: "11", y2: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "17", y1: "2", x2: "13", y2: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "2", y1: "8", x2: "22", y2: "8" }), /* @__PURE__ */ React.createElement("polygon", { points: "10 13 16 16 10 19", fill: "currentColor", stroke: "none" })),
  user: (s = 22) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "7", r: "4" })),
  play: (s = 24) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "#fff", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("polygon", { points: "6 3 22 12 6 21 6 3" })),
  chevronDown: (s = 14) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" })),
  insta: (s = 16) => /* @__PURE__ */ React.createElement("svg", { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5" }), /* @__PURE__ */ React.createElement("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }), /* @__PURE__ */ React.createElement("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" }))
};
function PostImg({ thumb, fallbackIdx }) {
  const [src, setSrc] = useStateIp(thumb);
  const [stage, setStage] = useStateIp("primary");
  const onError = () => {
    if (stage === "primary") {
      setSrc(IP_FALLBACKS[fallbackIdx % IP_FALLBACKS.length]);
      setStage("fallback");
    } else if (stage === "fallback") {
      setSrc("");
      setStage("placeholder");
    }
  };
  if (stage === "placeholder") {
    return /* @__PURE__ */ React.createElement("div", { className: "ip-post-img ip-post-placeholder", "aria-hidden": "true" });
  }
  return /* @__PURE__ */ React.createElement(
    "img",
    {
      src,
      onError,
      alt: "",
      loading: "lazy",
      decoding: "async",
      className: "ip-post-img"
    }
  );
}
function PostCard({ post, idx }) {
  return /* @__PURE__ */ React.createElement(
    "a",
    {
      href: post.link,
      target: "_blank",
      rel: "noopener",
      className: "ip-post",
      "aria-label": `Open Instagram ${post.type}: ${post.caption}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "ip-post-head" }, /* @__PURE__ */ React.createElement("span", { className: "ip-post-avatar", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("img", { src: IP_AVATAR, alt: "" })), /* @__PURE__ */ React.createElement("span", { className: "ip-post-user" }, /* @__PURE__ */ React.createElement("strong", null, IP_USERNAME), /* @__PURE__ */ React.createElement("span", { className: "ip-post-dot" }, " \xB7 "), /* @__PURE__ */ React.createElement("span", { className: "ip-post-follow" }, "Follow")), /* @__PURE__ */ React.createElement("span", { className: "ip-post-dots", "aria-hidden": "true" }, "\xB7\xB7\xB7")),
    /* @__PURE__ */ React.createElement("div", { className: "ip-post-media" }, /* @__PURE__ */ React.createElement(PostImg, { thumb: post.thumb, fallbackIdx: idx }), post.type === "reel" && /* @__PURE__ */ React.createElement("span", { className: "ip-post-reel-tag", "aria-hidden": "true" }, Ig.play(14), /* @__PURE__ */ React.createElement("span", null, "REEL"))),
    /* @__PURE__ */ React.createElement("div", { className: "ip-post-actions" }, /* @__PURE__ */ React.createElement("span", { className: "ip-post-act" }, Ig.heart(22), /* @__PURE__ */ React.createElement("em", null, fmtCount(post.likes))), /* @__PURE__ */ React.createElement("span", { className: "ip-post-act" }, Ig.comment(22), /* @__PURE__ */ React.createElement("em", null, fmtCount(post.comments))), /* @__PURE__ */ React.createElement("span", { className: "ip-post-act" }, Ig.share(22), /* @__PURE__ */ React.createElement("em", null, fmtCount(post.shares))), /* @__PURE__ */ React.createElement("span", { className: "ip-post-bookmark" }, Ig.bookmark(22))),
    /* @__PURE__ */ React.createElement("div", { className: "ip-post-likes" }, /* @__PURE__ */ React.createElement("strong", null, fmtCount(post.likes)), " likes"),
    /* @__PURE__ */ React.createElement("div", { className: "ip-post-caption" }, /* @__PURE__ */ React.createElement("strong", null, IP_USERNAME), " ", post.caption, " ", /* @__PURE__ */ React.createElement("span", { className: "ip-post-more" }, "\u2026 more")),
    /* @__PURE__ */ React.createElement("div", { className: "ip-post-time" }, "View all ", fmtCount(post.comments), " comments \xB7 2 days ago")
  );
}
function InstagramPhoneMockup() {
  const items = useMemoIp(() => IP_POSTS.concat(IP_POSTS), []);
  return /* @__PURE__ */ React.createElement("div", { className: "ip-wrap", "aria-label": "Instagram feed preview for marrakechstory" }, /* @__PURE__ */ React.createElement("span", { className: "ip-glow", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(
    "a",
    {
      className: "ip-follow-btn",
      href: IP_URL,
      target: "_blank",
      rel: "noopener",
      "aria-label": "Follow Marrakechstory on Instagram"
    },
    /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u{1F4F8}"),
    /* @__PURE__ */ React.createElement("span", null, "Follow us on Instagram ", /* @__PURE__ */ React.createElement("strong", null, "@", IP_USERNAME))
  ), /* @__PURE__ */ React.createElement("div", { className: "ip-phone-stage" }, /* @__PURE__ */ React.createElement("div", { className: "ip-phone" }, /* @__PURE__ */ React.createElement("span", { className: "ip-phone-button ip-phone-button-1", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: "ip-phone-button ip-phone-button-2", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: "ip-phone-button ip-phone-button-3", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: "ip-phone-button ip-phone-button-4", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "ip-screen" }, /* @__PURE__ */ React.createElement("span", { className: "ip-notch", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "ip-top" }, /* @__PURE__ */ React.createElement("span", { className: "ip-top-user" }, /* @__PURE__ */ React.createElement("img", { className: "ip-top-avatar", src: IP_AVATAR, alt: "", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("strong", null, IP_USERNAME), /* @__PURE__ */ React.createElement("span", { className: "ip-top-verified", "aria-label": "Verified" }, Ig.verified(13)), /* @__PURE__ */ React.createElement("span", { className: "ip-top-chev", "aria-hidden": "true" }, Ig.chevronDown(14))), /* @__PURE__ */ React.createElement("span", { className: "ip-top-camera", "aria-hidden": "true" }, Ig.camera(18))), /* @__PURE__ */ React.createElement("div", { className: "ip-feed-viewport" }, /* @__PURE__ */ React.createElement("div", { className: "ip-feed-track" }, items.map((p, i) => /* @__PURE__ */ React.createElement(PostCard, { key: i, post: p, idx: i })))), /* @__PURE__ */ React.createElement("div", { className: "ip-bottom" }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, Ig.home()), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, Ig.search()), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, Ig.reels()), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, Ig.heart()), /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, Ig.user())), /* @__PURE__ */ React.createElement("span", { className: "ip-home-indicator", "aria-hidden": "true" })))));
}
window.MS_InstagramPhone = InstagramPhoneMockup;
