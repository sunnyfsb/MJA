/** Hero slider: cross-fading backgrounds + text, progress dots, pause, swipe, keyboard. */
import { reducedMotion } from './env.js';
import { t } from './i18n.js';

export function initSlider() {
  const hero = document.getElementById('home');
  if (!hero) return;
  const bgs = [...hero.querySelectorAll('.hero__bg')];
  const texts = [...hero.querySelectorAll('.hero__text')];
  const dots = [...hero.querySelectorAll('.hero__dots button')];
  const pauseBtn = document.getElementById('hero-pause');
  const SLIDE_MS = 7000;
  hero.style.setProperty('--slide-ms', SLIDE_MS + 'ms');

  let index = 0, userPaused = reducedMotion, hoverPaused = false, offscreen = false;

  const apply = () => hero.classList.toggle('is-paused', userPaused || hoverPaused || offscreen);

  function go(i) {
    index = (i + bgs.length) % bgs.length;
    bgs.forEach((el, n) => el.classList.toggle('is-active', n === index));
    texts.forEach((el, n) => { el.classList.toggle('is-active', n === index); el.setAttribute('aria-hidden', String(n !== index)); });
    dots.forEach((d, n) => d.setAttribute('aria-selected', String(n === index)));
  }

  // Auto-advance when the active progress bar finishes (pauses with the animation)
  dots.forEach((d, n) => {
    d.addEventListener('click', () => go(n));
    d.querySelector('i').addEventListener('animationend', () => { if (!userPaused) go(index + 1); });
  });
  document.getElementById('hero-prev').addEventListener('click', () => go(index - 1));
  document.getElementById('hero-next').addEventListener('click', () => go(index + 1));

  const setUserPaused = (v) => {
    userPaused = v; apply();
    const key = v ? 'hero.play' : 'hero.pause';
    pauseBtn.dataset.i18nAttr = 'aria-label:' + key;
    pauseBtn.setAttribute('aria-label', t(key));
  };
  pauseBtn.addEventListener('click', () => setUserPaused(!userPaused));

  hero.addEventListener('mouseenter', () => { hoverPaused = true; apply(); });
  hero.addEventListener('mouseleave', () => { hoverPaused = false; apply(); });
  hero.addEventListener('focusin', () => { hoverPaused = true; apply(); });
  hero.addEventListener('focusout', () => { hoverPaused = false; apply(); });

  // Swipe on touch
  let x0 = null;
  hero.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1) * (document.dir === 'rtl' ? -1 : 1));
  }, { passive: true });

  new IntersectionObserver(([e]) => { offscreen = !e.isIntersecting; apply(); }, { threshold: 0.2 }).observe(hero);
  texts.forEach((el, n) => el.setAttribute('aria-hidden', String(n !== 0)));
  apply();
}
