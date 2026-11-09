/**
 * Tiny i18n layer: swaps text/attributes from data/translations.js,
 * flips <html dir/lang> for Urdu (RTL), remembers choice in localStorage.
 */
import { LANGS, T } from '../data/translations.js';

const KEY = 'nihon-lang';
const WA_NUMBER = '923066811100';
let current = 'en';

const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } };

export const t = (key) => (T[current] && T[current][key]) || T.en[key] || key;
export const getLang = () => current;

export function setLang(lang, { persist = true } = {}) {
  if (!LANGS[lang]) lang = 'en';
  current = lang;
  const { dir, htmlLang } = LANGS[lang];
  const root = document.documentElement;
  root.lang = htmlLang;
  root.dir = dir;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = t(el.dataset.i18n);
    if (v.includes('<')) el.innerHTML = v; else el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
  document.title = t('meta.title');
  document.querySelectorAll('.lang [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));

  // WhatsApp links carry a pre-filled message in the active language
  const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t('contact.wa.msg'))}`;
  document.querySelectorAll('#wa-link,#fab-wa').forEach((a) => { a.href = wa; });

  if (persist) write(lang);
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function initI18n() {
  document.querySelectorAll('.lang [data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  setLang(read() || 'en', { persist: false });
}
