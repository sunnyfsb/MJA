/** Capability detection shared by all modules. */
const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
const conn = navigator.connection || {};

export const reducedMotion = mq('(prefers-reduced-motion: reduce)');
export const finePointer = mq('(hover: hover) and (pointer: fine)');
export const saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
export const lowPower = (navigator.hardwareConcurrency || 4) < 4 || (navigator.deviceMemory || 4) < 4;
export const isNarrow = () => window.innerWidth < 900;

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

/** Heavy 3D hero only on capable, motion-friendly, wide, fine-pointer devices. */
export const canRun3D = () => !reducedMotion && !saveData && !lowPower && finePointer && !isNarrow() && hasWebGL();
