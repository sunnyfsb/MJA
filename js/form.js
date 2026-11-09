/**
 * Contact form -> Web3Forms (static-friendly). If the access key is still the
 * placeholder, falls back to opening the visitor's mail app (mailto).
 */
import { t } from './i18n.js';

const MAIL = 'nihonschoolpk@gmail.com';

export function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const btn = form.querySelector('button[type="submit"]');
  const say = (msg, cls) => { status.textContent = msg; status.className = 'form-status ' + (cls || ''); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = new FormData(form);
    if (data.get('botcheck')) return; // honeypot

    // ► Placeholder key not replaced yet → mailto fallback
    if (String(data.get('access_key')).startsWith('YOUR_')) {
      const body = `${data.get('message')}\n\n— ${data.get('name')}${data.get('phone') ? ' (' + data.get('phone') + ')' : ''}\n${data.get('email')}`;
      say(t('contact.form.setup'), 'is-err');
      location.href = `mailto:${MAIL}?subject=${encodeURIComponent('Enquiry from nihonschool.com')}&body=${encodeURIComponent(body)}`;
      return;
    }

    btn.disabled = true; say(t('contact.form.sending'));
    try {
      const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'send failed');
      form.reset(); say(t('contact.form.ok'), 'is-ok');
    } catch (err) {
      say(t('contact.form.err'), 'is-err');
    } finally { btn.disabled = false; }
  });
}
