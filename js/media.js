/**
 * News / certificates / gallery media:
 *  - Gallery filters + "Show more"
 *  - One shared lightbox: prev/next, counter, caption, thumbnail strip,
 *    zoom, swipe, keyboard (Esc, arrows, Home/End), focus trap, video support.
 * Triggers are plain links (<a href="full.webp" data-lb="group">), so without JS
 * every item still opens the full-size file.
 */
import { t } from './i18n.js';
import { reducedMotion } from './env.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const GAL_LIMIT = 12;

/* ───────────── Gallery: filter + show more ───────────── */
function initGallery() {
  const list = $('#gal');
  if (!list) return;
  const items = $$('.gal__item', list);
  const filters = $$('.gal-filter');
  const more = $('#gal-more');
  let filter = 'all';
  let expanded = false;

  const apply = () => {
    const matching = items.filter((li) => filter === 'all' || li.dataset.cat === filter);
    items.forEach((li) => { li.dataset.match = '0'; li.hidden = true; });
    matching.forEach((li, i) => {
      li.dataset.match = '1';
      li.hidden = !expanded && i >= GAL_LIMIT;
      if (!li.hidden) li.classList.add('is-in');   // filtered-in items must not wait for scroll reveal
    });
    more.parentElement.hidden = matching.length <= GAL_LIMIT;
    more.setAttribute('aria-expanded', String(expanded));
    more.querySelector('span').textContent = t(expanded ? 'gallery.less' : 'gallery.more');
  };

  filters.forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.filter; expanded = false;
    filters.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply();
  }));
  more.addEventListener('click', () => {
    expanded = !expanded; apply();
    if (!expanded) list.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
  });
  document.addEventListener('langchange', apply);
  // initial state without marking items revealed (let scroll reveal animate them)
  const matching = items;
  matching.forEach((li, i) => { li.dataset.match = '1'; li.hidden = i >= GAL_LIMIT; });
  more.parentElement.hidden = items.length <= GAL_LIMIT;
}

/* ───────────── Lightbox ───────────── */
function initLightbox() {
  const lb = $('#lb');
  if (!lb) return;
  const stage = $('#lb-stage'), cap = $('#lb-cap'), count = $('#lb-count'), strip = $('#lb-strip');
  const btnPrev = $('#lb-prev'), btnNext = $('#lb-next'), btnClose = $('#lb-close'), btnZoom = $('#lb-zoom');
  let set = [], idx = 0, opener = null, zoomed = false;

  const groupOf = (a) => {
    const g = a.dataset.lb;
    let els = $$(`.lb-trigger[data-lb="${g}"]`);
    if (g === 'gallery') els = els.filter((el) => el.closest('.gal__item').dataset.match !== '0');
    return els;
  };
  const item = (a) => ({
    href: a.getAttribute('href'), thumb: a.dataset.thumb, cap: a.dataset.cap,
    w: +a.dataset.w || 0, h: +a.dataset.h || 0, video: a.dataset.type === 'video', poster: a.dataset.poster,
  });

  const isRTL = () => document.documentElement.dir === 'rtl';

  function buildStrip() {
    strip.innerHTML = '';
    strip.hidden = set.length < 2;
    set.forEach((it, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'lb__thumb' + (it.video ? ' is-video' : '');
      b.setAttribute('aria-label', `${i + 1}. ${t(it.cap)}`);
      b.innerHTML = `<img src="${it.thumb}" alt="" loading="lazy" decoding="async">`;
      b.addEventListener('click', () => show(i));
      strip.appendChild(b);
    });
  }

  function setZoom(on, e) {
    const media = $('.lb__media', stage);
    if (!media || media.tagName !== 'IMG') on = false;
    const r = media ? media.getBoundingClientRect() : null;   // measure the fitted size *before* zoom styles apply
    zoomed = on;
    lb.classList.toggle('is-zoom', on);
    btnZoom.setAttribute('aria-pressed', String(on));
    if (!media || media.tagName !== 'IMG') return;
    if (on) {
      const fx = e ? (e.clientX - r.left) / r.width : 0.5;
      const fy = e ? (e.clientY - r.top) / r.height : 0.15;
      const scale = Math.max(2, (media.naturalWidth || r.width) / r.width);
      media.style.width = `${Math.round(r.width * scale)}px`;
      requestAnimationFrame(() => {
        stage.scrollLeft = media.offsetWidth * fx - stage.clientWidth / 2;
        stage.scrollTop = media.offsetHeight * fy - stage.clientHeight / 2;
      });
    } else {
      media.style.width = '';
      stage.scrollTo(0, 0);
    }
  }

  function show(i, dir = 0) {
    if (!set.length) return;
    idx = (i + set.length) % set.length;
    const it = set[idx];
    setZoom(false);
    const old = $$('.lb__media', stage);
    let el;
    if (it.video) {
      el = document.createElement('video');
      Object.assign(el, { src: it.href, poster: it.poster || '', controls: true, playsInline: true, preload: 'metadata' });
      el.setAttribute('aria-label', t(it.cap));
    } else {
      el = document.createElement('img');
      el.alt = t(it.cap); el.decoding = 'async';
      if (it.w && it.h) { el.width = it.w; el.height = it.h; }
      lb.classList.add('is-loading');
      el.addEventListener('load', () => lb.classList.remove('is-loading'), { once: true });
      el.addEventListener('error', () => lb.classList.remove('is-loading'), { once: true });
      el.src = it.href;
      // mouse: click toggles zoom at the clicked point; touch: use the zoom button (swipe stays free)
      el.addEventListener('click', (e) => { if (zoomed) setZoom(false); else if (window.matchMedia('(hover: hover)').matches) setZoom(true, e); });
    }
    el.className = 'lb__media';
    if (dir && !reducedMotion) el.classList.add(dir > 0 ? 'from-next' : 'from-prev');
    old.forEach((o) => { if (o.tagName === 'VIDEO') o.pause(); o.remove(); });
    stage.appendChild(el);
    if (it.video) el.play().catch(() => {});

    cap.textContent = t(it.cap);
    count.textContent = set.length > 1 ? `${idx + 1} / ${set.length}` : '';
    btnPrev.hidden = btnNext.hidden = set.length < 2;
    btnZoom.hidden = it.video;
    $$('.lb__thumb', strip).forEach((b, k) => {
      b.classList.toggle('is-active', k === idx);
      if (k === idx) { b.setAttribute('aria-current', 'true'); b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion ? 'auto' : 'smooth' }); }
      else b.removeAttribute('aria-current');
    });
    // preload neighbours
    [1, -1].forEach((d) => { const n = set[(idx + d + set.length) % set.length]; if (n && !n.video) { const p = new Image(); p.src = n.href; } });
  }

  function open(trigger) {
    opener = trigger;
    const els = groupOf(trigger);
    set = els.map(item);
    buildStrip();
    lb.hidden = false;
    document.documentElement.classList.add('lb-open');
    if (window.__lenis) window.__lenis.stop();
    requestAnimationFrame(() => lb.classList.add('is-open'));
    show(Math.max(0, els.indexOf(trigger)));
    btnClose.focus();
  }

  function close() {
    lb.classList.remove('is-open', 'is-zoom', 'is-loading');
    $$('video', stage).forEach((v) => v.pause());
    stage.innerHTML = '';
    lb.hidden = true;
    zoomed = false;
    document.documentElement.classList.remove('lb-open');
    if (window.__lenis) window.__lenis.start();
    if (opener && document.contains(opener) && !opener.hidden) opener.focus({ preventScroll: true });
    else if (opener) { const vis = $(`.lb-trigger[data-lb="${opener.dataset.lb}"]:not([hidden])`); if (vis) vis.focus({ preventScroll: true }); }
  }

  const next = () => show(idx + 1, 1);
  const prev = () => show(idx - 1, -1);

  // Triggers (links) and "open" buttons that point at a trigger by media name
  document.addEventListener('click', (e) => {
    const opn = e.target.closest('[data-lb-open]');
    const a = opn ? $(`.lb-trigger[href$="/${opn.dataset.lbOpen}.webp"]`) : e.target.closest('.lb-trigger');
    if (!a || lb.contains(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return; // allow "open in new tab"
    e.preventDefault();
    open(a);
  });

  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);
  btnClose.addEventListener('click', close);
  btnZoom.addEventListener('click', () => setZoom(!zoomed));
  // click on empty stage area closes
  stage.addEventListener('click', (e) => { if (e.target === stage && !zoomed) close(); });

  lb.addEventListener('keydown', (e) => {
    const fwd = isRTL() ? 'ArrowLeft' : 'ArrowRight';
    const back = isRTL() ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === 'Escape') { e.preventDefault(); if (zoomed) setZoom(false); else close(); }
    else if (e.key === fwd && !zoomed) { e.preventDefault(); next(); }
    else if (e.key === back && !zoomed) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); show(0, -1); }
    else if (e.key === 'End') { e.preventDefault(); show(set.length - 1, 1); }
    else if (e.key === 'Tab') {               // focus trap
      const f = $$('button:not([hidden]), video', lb).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Swipe (touch / pen), only when not zoomed
  let sx = 0, sy = 0, tracking = false;
  stage.addEventListener('pointerdown', (e) => {
    if (zoomed || e.pointerType === 'mouse') return;
    tracking = true; sx = e.clientX; sy = e.clientY;
  });
  stage.addEventListener('pointerup', (e) => {
    if (!tracking) return; tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3 && set.length > 1) {
      const forward = isRTL() ? dx > 0 : dx < 0;
      if (forward) next(); else prev();
    } else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) close();   // swipe down to close
  });
  stage.addEventListener('pointercancel', () => { tracking = false; });

  document.addEventListener('langchange', () => {
    if (lb.hidden || !set.length) return;
    cap.textContent = t(set[idx].cap);
    $$('.lb__thumb', strip).forEach((b, k) => b.setAttribute('aria-label', `${k + 1}. ${t(set[k].cap)}`));
  });
}

export function initMedia() {
  initGallery();
  initLightbox();
}
