/** Entry point – wires every module. Static, no build step. */
import { initI18n } from './i18n.js';
import { initUI } from './ui.js';
import { initSlider } from './slider.js';
import { initMotion } from './motion.js';
import { initForm } from './form.js';
import { initMedia } from './media.js';
import { canRun3D } from './env.js';

initI18n();      // first: sets language/dir before anything measures layout
initUI();
initSlider();
initForm();
initMedia();
initMotion();

// 3D hero: after first paint, only on capable devices; otherwise static SVG stays.
if (canRun3D()) {
  const run = () => import('./hero3d.js').then((m) => m.initHero3D()).catch(() => {});
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2500 }); else setTimeout(run, 1200);
}
