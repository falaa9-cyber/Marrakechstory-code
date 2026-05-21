// ============================================
// Apple-style scroll FX — purely additive layer.
// • .fx-reveal / .fx-reveal-stagger  → fade-up on viewport enter
// • .fx-tilt                          → mousemove 3D rotate-X/Y
// • .fx-parallax (with data-speed)    → translateY based on scroll
// Runs once on load and again after React commits new sections.
// ============================================
(function () {
  if (typeof window === 'undefined') return;

  const PREFER_REDUCED =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (PREFER_REDUCED) return;

  // ── 1. Scroll-reveal ── lazy IntersectionObserver applied to any
  //    element with .fx-reveal or .fx-reveal-stagger.
  const revealOnce = (root = document) => {
    const els = root.querySelectorAll('.fx-reveal:not(.fx-bound), .fx-reveal-stagger:not(.fx-bound)');
    if (!els.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => { el.classList.add('fx-bound'); io.observe(el); });
  };

  // ── 2. 3D mouse-tilt ── for .fx-tilt elements
  const bindTilt = (root = document) => {
    const els = root.querySelectorAll('.fx-tilt:not(.fx-bound)');
    els.forEach((el) => {
      el.classList.add('fx-bound');
      const maxDeg = parseFloat(el.dataset.tiltMax || '8'); // ±8°
      let raf = 0;
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;     // 0..1
        const y = (e.clientY - r.top) / r.height;     // 0..1
        const tx = (x - 0.5) * 2 * maxDeg;            // rotateY (left/right)
        const ty = (0.5 - y) * 2 * maxDeg;            // rotateX (up/down)
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.setProperty('--tx', tx.toFixed(2) + 'deg');
          el.style.setProperty('--ty', ty.toFixed(2) + 'deg');
        });
      };
      const onLeave = () => {
        cancelAnimationFrame(raf);
        el.style.setProperty('--tx', '0deg');
        el.style.setProperty('--ty', '0deg');
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  };

  // ── 3. Parallax ── translateY = scrollDistanceFromCenter × data-speed
  const parallaxEls = [];
  const collectParallax = () => {
    document.querySelectorAll('.fx-parallax:not(.fx-bound)').forEach((el) => {
      el.classList.add('fx-bound');
      parallaxEls.push(el);
    });
  };
  const onScroll = () => {
    const vh = window.innerHeight || 800;
    for (const el of parallaxEls) {
      const r = el.getBoundingClientRect();
      // Distance of element centre from viewport centre, normalised
      const dist = (r.top + r.height / 2) - vh / 2;
      const speed = parseFloat(el.dataset.speed || '0.18');
      const ty = -dist * speed;
      el.style.setProperty('--py', ty.toFixed(1) + 'px');
    }
  };

  const run = () => { revealOnce(); bindTilt(); collectParallax(); onScroll(); };

  // Initial pass + repeat after React mounts more content
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  // Re-bind after every render burst (React mounts new sections async)
  let rebindTimer = 0;
  const rebind = () => {
    clearTimeout(rebindTimer);
    rebindTimer = setTimeout(run, 220);
  };
  const mo = new MutationObserver(rebind);
  mo.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // Auto-tag the obvious candidates so authors don't have to touch JSX
  const autoTag = () => {
    document.querySelectorAll('section.section, .itin-section, .reiseplaner-section, #catalog, #contact, #agafay')
      .forEach(s => s.classList.add('fx-reveal'));
    document.querySelectorAll('.cat-grid, .ag-grid, .reiseplaner-grid')
      .forEach(g => g.classList.add('fx-reveal-stagger'));
    document.querySelectorAll('.cat-card, .ag-card, .opt-card, .dur-pkg-card, .rental-card, .ip-phone-stage')
      .forEach(c => { if (!c.classList.contains('fx-tilt')) c.classList.add('fx-tilt'); });
    document.querySelectorAll('.ms-hero-bg')
      .forEach(b => { b.classList.add('fx-parallax'); b.dataset.speed = '0.15'; });
  };
  autoTag();
  // Re-autoTag after mutations (React mounted new cards)
  new MutationObserver(autoTag).observe(document.body, { childList: true, subtree: true });
})();
