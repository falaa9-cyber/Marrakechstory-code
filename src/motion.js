const { useEffect: useEffectM, useRef: useRefM, useState: useStateM } = React;
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useStateM(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffectM(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
function ImageReveal({ src, alt = "", aspectRatio = "4 / 5", priority = false, direction = "up", className = "" }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRefM(null);
  const [revealed, setRevealed] = useStateM(reduced || priority);
  useEffectM(() => {
    if (reduced || priority) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRevealed(true);
        io.disconnect();
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, priority]);
  const dir = direction === "down" ? "translateY(100%)" : "translateY(-100%)";
  return /* @__PURE__ */ React.createElement("div", { ref, className: `ms-image-reveal ${className}`, style: { aspectRatio, position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src,
      alt,
      loading: priority ? "eager" : "lazy",
      decoding: "async",
      style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "ms-curtain", style: {
    position: "absolute",
    inset: 0,
    background: "#e1432a",
    pointerEvents: "none",
    transform: revealed ? dir : "translateY(0)",
    transition: "transform 1.2s cubic-bezier(0.7, 0, 0.2, 1)"
  } }));
}
function TextReveal({ children, as: Tag = "h2", className = "", stagger = 0.08 }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRefM(null);
  const [inView, setInView] = useStateM(reduced);
  useEffectM(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  const text = typeof children === "string" ? children : String(children != null ? children : "");
  const words = text.split(" ");
  return /* @__PURE__ */ React.createElement(Tag, { ref, className: `ms-text-reveal ${className}` }, words.map((word, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "ms-word-clip" }, /* @__PURE__ */ React.createElement("span", { className: "ms-word", style: {
    transform: inView ? "translateY(0)" : "translateY(105%)",
    transitionDelay: `${i * stagger}s`
  } }, word, i < words.length - 1 ? "\xA0" : ""))));
}
function Cinemagraph({ poster, mp4, webm, alt = "", aspectRatio = "4 / 5", priority = false, className = "" }) {
  const reduced = usePrefersReducedMotion();
  const videoRef = useRefM(null);
  useEffectM(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;
    const onVis = () => {
      document.hidden ? v.pause() : v.play().catch(() => {
      });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reduced]);
  if (reduced || !mp4) {
    return /* @__PURE__ */ React.createElement("div", { className: `ms-cinemagraph ${className}`, style: { aspectRatio, position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: poster,
        alt,
        loading: priority ? "eager" : "lazy",
        decoding: "async",
        style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
      }
    ));
  }
  return /* @__PURE__ */ React.createElement("div", { className: `ms-cinemagraph ${className}`, style: { aspectRatio, position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(
    "video",
    {
      ref: videoRef,
      autoPlay: true,
      loop: true,
      muted: true,
      playsInline: true,
      "aria-label": alt,
      poster,
      preload: priority ? "auto" : "metadata",
      style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
    },
    webm && /* @__PURE__ */ React.createElement("source", { src: webm, type: "video/webm" }),
    /* @__PURE__ */ React.createElement("source", { src: mp4, type: "video/mp4" })
  ));
}
function KenBurns({ src, alt = "", maxScale = 1.08, className = "", height = "100vh" }) {
  const reduced = usePrefersReducedMotion();
  const wrap = useRefM(null);
  const img = useRefM(null);
  useEffectM(() => {
    if (reduced) return;
    const w = wrap.current;
    const i = img.current;
    if (!w || !i) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = w.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = vh + r.height;
        const seen = Math.max(0, Math.min(total, vh - r.top));
        const t = seen / total;
        i.style.transform = `scale(${1 + (maxScale - 1) * t})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced, maxScale]);
  return /* @__PURE__ */ React.createElement("div", { ref: wrap, className: `ms-kenburns ${className}`, style: { position: "relative", overflow: "hidden", height } }, /* @__PURE__ */ React.createElement(
    "img",
    {
      ref: img,
      src,
      alt,
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transition: reduced ? "none" : "transform 80ms linear",
        willChange: reduced ? "auto" : "transform"
      }
    }
  ));
}
function PageEntrance() {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useStateM(reduced ? "done" : "in");
  useEffectM(() => {
    if (reduced) return;
    const t1 = setTimeout(() => setPhase("out"), 300);
    const t2 = setTimeout(() => setPhase("done"), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduced]);
  if (phase === "done") return null;
  return /* @__PURE__ */ React.createElement("div", { className: `ms-page-entrance phase-${phase}`, "aria-hidden": "true" });
}
function Stagger({ children, step = 60, className = "" }) {
  const childArray = React.Children.toArray(children);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, childArray.map(
    (child, i) => {
      var _a;
      return React.cloneElement(child, {
        className: `${child.props.className || ""} reveal`.trim(),
        style: { ...child.props.style || {}, transitionDelay: `${i * step}ms` },
        key: (_a = child.key) != null ? _a : i
      });
    }
  ));
}
function setupGlobalVideoPause() {
  if (typeof document === "undefined" || document.__msVideoPauseInstalled) return;
  document.__msVideoPauseInstalled = true;
  const handler = () => {
    document.querySelectorAll("video").forEach((v) => {
      if (document.hidden) v.pause();
      else if (v.autoplay) v.play().catch(() => {
      });
    });
  };
  document.addEventListener("visibilitychange", handler);
}
setupGlobalVideoPause();
window.MS_Motion = {
  ImageReveal,
  TextReveal,
  Cinemagraph,
  KenBurns,
  PageEntrance,
  Stagger,
  usePrefersReducedMotion
};
