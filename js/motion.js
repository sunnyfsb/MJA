/**
 * Motion layer: Lenis smooth scroll, GSAP/ScrollTrigger parallax + counters,
 * reveal-on-scroll, split-word headings, 3D tilt, magnetic buttons,
 * sakura petals, affiliations marquee. Everything degrades to static content.
 */
import { reducedMotion, finePointer, saveData, lowPower, isNarrow } from './env.js';

const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ── Split headings into word spans (re-run after language change) ── */
export function splitHeadings() {
  $$('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}"><span>${w}</span></span>`).join(' ');
  });
}

/* ── Reveal on scroll (IntersectionObserver; light-weight, no GSAP needed) ── */
function initReveal() {
  const items = $$('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  // Stagger siblings
  const seen = new Map();
  items.forEach((el) => {
    const p = el.parentElement; const n = seen.get(p) || 0; seen.set(p, n + 1);
    el.style.setProperty('--d', Math.min(n, 5) * 0.08 + 's');
    io.observe(el);
  });
}

/* ── Counters ── */
function initCounters(gsap, ScrollTrigger) {
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const o = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }),
    });
  });
}

/* ── Sakura petals (CSS animated) ── */
function initSakura() {
  if (saveData || lowPower) return;
  const n = isNarrow() ? 5 : 12;
  const wrap = document.createElement('div');
  wrap.className = 'sakura'; wrap.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'); p.className = 'petal';
    p.style.cssText = `left:${Math.random() * 100}%;--s:${8 + Math.random() * 10}px;--dur:${14 + Math.random() * 14}s;--delay:${-Math.random() * 24}s;--dx:${(Math.random() - 0.5) * 220}px`;
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
}

/* ── Affiliations marquee (clone track for a seamless loop) ── */
function initMarquee() {
  const track = document.getElementById('marquee-track');
  const box = document.getElementById('marquee');
  const btn = document.getElementById('marquee-toggle');
  if (!track) return;
  if (!reducedMotion) {
    const originals = [...track.children];
    const setW = () => originals.reduce((w, el) => w + el.getBoundingClientRect().width + 18, 0);
    const build = () => {
      $$('[data-clone]', track).forEach((c) => c.remove());
      const w = setW(); if (!w) return;
      const copies = Math.ceil(window.innerWidth / w) + 1;
      for (let c = 0; c < copies; c++) originals.forEach((el) => {
        const k = el.cloneNode(true); k.dataset.clone = '1'; k.setAttribute('aria-hidden', 'true'); track.appendChild(k);
      });
      track.style.setProperty('--shift', w + 'px');
    };
    build();
    let r; window.addEventListener('resize', () => { clearTimeout(r); r = setTimeout(build, 200); });
    document.addEventListener('langchange', () => setTimeout(build, 50));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  }
  btn.addEventListener('click', () => {
    const p = box.classList.toggle('is-paused'); btn.setAttribute('aria-pressed', String(p));
  });
}

/* ── Tilt + magnetic (fine pointers only) ── */
function initPointerFx(gsap) {
  if (!finePointer || reducedMotion) return;
  if (window.VanillaTilt) window.VanillaTilt.init($$('[data-tilt]'), { max: 6, speed: 600, glare: true, 'max-glare': 0.16, scale: 1.015, perspective: 1100 });
  $$('.magnetic').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.22); y((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

export function initMotion() {
  initMarquee(); // works without GSAP

  const ok = window.gsap && window.ScrollTrigger && !reducedMotion;
  if (!ok) { splitHeadings(); return; }       // content stays visible & static
  document.documentElement.classList.add('js-motion');
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  splitHeadings();
  document.addEventListener('langchange', splitHeadings);
  initReveal();
  initCounters(gsap, ScrollTrigger);
  initPointerFx(gsap);
  initSakura();

  // Smooth scrolling (Lenis) wired into ScrollTrigger
  if (window.Lenis && finePointer) {
    const lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Parallax
  gsap.to('.hero__slides', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__kanji', { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.utils.toArray('.blob').forEach((b) => gsap.to(b, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: b.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.utils.toArray('.section__kanji').forEach((k) => gsap.to(k, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: k.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
}
