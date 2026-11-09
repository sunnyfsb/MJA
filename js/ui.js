/** Navbar, mobile menu, notice banner, FABs, scroll-spy, anchor scrolling. */
const NOTICE_KEY = 'nihon-notice-dismissed';

export function initUI() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  const topBtn = document.getElementById('fab-top');

  document.getElementById('year').textContent = new Date().getFullYear();

  // ── Notice banner (session-only dismissal: safety message returns next visit)
  const bar = document.getElementById('notice-bar');
  try { if (sessionStorage.getItem(NOTICE_KEY)) bar.hidden = true; } catch (e) { /* ignore */ }
  document.getElementById('notice-close').addEventListener('click', () => {
    bar.hidden = true;
    try { sessionStorage.setItem(NOTICE_KEY, '1'); } catch (e) { /* ignore */ }
  });

  // ── Mobile menu
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    // Hidden menu must not be tabbable on mobile
    if (window.matchMedia('(max-width: 920px)').matches) menu.inert = !open;
  };
  const syncInert = () => { menu.inert = window.matchMedia('(max-width: 920px)').matches && !menu.classList.contains('is-open'); };
  syncInert();
  window.addEventListener('resize', syncInert);
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('is-open') && !menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });

  // ── Anchor links (uses Lenis when present, native smooth otherwise)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    const navH = 84;
    if (window.__lenis) window.__lenis.scrollTo(target, { offset: -navH, duration: 1.2 });
    else target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', a.getAttribute('href'));
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  // ── Scrolled state + back-to-top
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
    topBtn.hidden = window.scrollY < 600;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  topBtn.addEventListener('click', () => {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 }); else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Scroll-spy
  const links = [...document.querySelectorAll('.nav__links a')];
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.remove('is-active'));
      const l = map.get(en.target.id); if (l) l.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
}
