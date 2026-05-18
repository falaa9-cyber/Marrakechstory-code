// ============================================
// Motion primitives — vanilla React + CSS only
// (no Framer Motion, no GSAP, no Lenis — static UMD stack)
//
// Easing: cubic-bezier(0.16, 1, 0.3, 1)  out-expo  → content reveals
// Easing: cubic-bezier(0.7, 0, 0.2, 1)            → page transitions
// ============================================
const { useEffect: useEffectM, useRef: useRefM, useState: useStateM } = React;

// Global reduced-motion hook
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useStateM(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffectM(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// ─── Primitive 2 — Image curtain reveal ────────────────────
// A terracotta panel covers the image and retracts upward.
function ImageReveal({ src, alt = "", aspectRatio = "4 / 5", priority = false, direction = "up", className = "" }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRefM(null);
  const [revealed, setRevealed] = useStateM(reduced || priority);
  useEffectM(() => {
    if (reduced || priority) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); io.disconnect(); }
    }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, priority]);
  const dir = direction === 'down' ? 'translateY(100%)' : 'translateY(-100%)';
  return (
    <div ref={ref} className={`ms-image-reveal ${className}`} style={{ aspectRatio, position: 'relative', overflow: 'hidden' }}>
      <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async"
           style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div className="ms-curtain" style={{
        position: 'absolute', inset: 0, background: '#e1432a', pointerEvents: 'none',
        transform: revealed ? dir : 'translateY(0)',
        transition: 'transform 1.2s cubic-bezier(0.7, 0, 0.2, 1)',
      }} />
    </div>
  );
}

// ─── Primitive 3 — Headline word-by-word reveal ──────────
function TextReveal({ children, as: Tag = 'h2', className = '', stagger = 0.08 }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRefM(null);
  const [inView, setInView] = useStateM(reduced);
  useEffectM(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  const text = typeof children === 'string' ? children : String(children ?? '');
  const words = text.split(' ');
  return (
    <Tag ref={ref} className={`ms-text-reveal ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="ms-word-clip">
          <span className="ms-word" style={{
            transform: inView ? 'translateY(0)' : 'translateY(105%)',
            transitionDelay: `${i * stagger}s`,
          }}>
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </Tag>
  );
}

// ─── Primitive 4 — Cinemagraph (silent looping video) ────
function Cinemagraph({ poster, mp4, webm, alt = '', aspectRatio = '4 / 5', priority = false, className = '' }) {
  const reduced = usePrefersReducedMotion();
  const videoRef = useRefM(null);
  useEffectM(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;
    const onVis = () => { document.hidden ? v.pause() : v.play().catch(() => {}); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [reduced]);
  if (reduced || !mp4) {
    return (
      <div className={`ms-cinemagraph ${className}`} style={{ aspectRatio, position: 'relative', overflow: 'hidden' }}>
        <img src={poster} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async"
             style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  return (
    <div className={`ms-cinemagraph ${className}`} style={{ aspectRatio, position: 'relative', overflow: 'hidden' }}>
      <video ref={videoRef} autoPlay loop muted playsInline aria-label={alt}
             poster={poster} preload={priority ? 'auto' : 'metadata'}
             style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}>
        {webm && <source src={webm} type="video/webm" />}
        <source src={mp4} type="video/mp4" />
      </video>
    </div>
  );
}

// ─── Primitive 5 — Ken Burns scroll-driven scale ─────────
function KenBurns({ src, alt = '', maxScale = 1.08, className = '', height = '100vh' }) {
  const reduced = usePrefersReducedMotion();
  const wrap = useRefM(null);
  const img = useRefM(null);
  useEffectM(() => {
    if (reduced) return;
    const w = wrap.current; const i = img.current;
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
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced, maxScale]);
  return (
    <div ref={wrap} className={`ms-kenburns ${className}`} style={{ position: 'relative', overflow: 'hidden', height }}>
      <img ref={img} src={src} alt={alt}
           style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    transition: reduced ? 'none' : 'transform 80ms linear', willChange: reduced ? 'auto' : 'transform' }} />
    </div>
  );
}

// ─── Page-load terracotta sweep entrance ─────────────────
// Renders once on mount; auto-removes after animation.
function PageEntrance() {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useStateM(reduced ? 'done' : 'in');
  useEffectM(() => {
    if (reduced) return;
    const t1 = setTimeout(() => setPhase('out'), 300);
    const t2 = setTimeout(() => setPhase('done'), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reduced]);
  if (phase === 'done') return null;
  return (
    <div className={`ms-page-entrance phase-${phase}`} aria-hidden="true" />
  );
}

// ─── Stagger reveal: wrap a list to fade in children sequentially ─
function Stagger({ children, step = 60, className = '' }) {
  const childArray = React.Children.toArray(children);
  return (
    <>
      {childArray.map((child, i) =>
        React.cloneElement(child, {
          className: `${child.props.className || ''} reveal`.trim(),
          style: { ...(child.props.style || {}), transitionDelay: `${i * step}ms` },
          key: child.key ?? i,
        })
      )}
    </>
  );
}

// Page-visibility-driven pause for all videos
function setupGlobalVideoPause() {
  if (typeof document === 'undefined' || document.__msVideoPauseInstalled) return;
  document.__msVideoPauseInstalled = true;
  const handler = () => {
    document.querySelectorAll('video').forEach(v => {
      if (document.hidden) v.pause();
      else if (v.autoplay) v.play().catch(() => {});
    });
  };
  document.addEventListener('visibilitychange', handler);
}

setupGlobalVideoPause();

window.MS_Motion = {
  ImageReveal,
  TextReveal,
  Cinemagraph,
  KenBurns,
  PageEntrance,
  Stagger,
  usePrefersReducedMotion,
};
