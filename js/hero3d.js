/**
 * Hero 3D: a slowly turning torii gate, a red sun disc and drifting sakura petals (Three.js).
 * Loaded lazily after first paint and only on capable devices (see env.canRun3D);
 * otherwise the static SVG fallback inside #hero-stage stays visible.
 */
export async function initHero3D() {
  const stage = document.getElementById('hero-stage');
  if (!stage) return;
  let THREE;
  try { THREE = await import('/assets/vendor/three.module.min.js'); } catch (e) { return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.6, 17);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xfff1f3, 2.2); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.PointLight(0xd7263d, 40, 30); rim.position.set(-5, 2, -2); scene.add(rim);

  // Sun disc
  const sun = new THREE.Mesh(new THREE.CircleGeometry(2.7, 64), new THREE.MeshBasicMaterial({ color: 0xd7263d, transparent: true, opacity: 0.55 }));
  sun.position.set(0, 1.4, -2.5); scene.add(sun);

  // Torii
  const red = new THREE.MeshStandardMaterial({ color: 0xd7263d, roughness: 0.45, metalness: 0.05 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x121722, roughness: 0.6 });
  const torii = new THREE.Group();
  const add = (geo, mat, x, y, z = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz; torii.add(m); return m; };
  [-1.7, 1.7].forEach((x) => {
    add(new THREE.CylinderGeometry(0.2, 0.24, 4.4, 24), red, x, 0, 0);
    add(new THREE.CylinderGeometry(0.3, 0.32, 0.35, 24), dark, x, -2.3, 0);
  });
  add(new THREE.BoxGeometry(4.6, 0.26, 0.3), red, 0, 1.25);               // nuki (lower tie beam)
  add(new THREE.BoxGeometry(5.0, 0.22, 0.46), dark, 0, 2.0);              // shimaki
  add(new THREE.BoxGeometry(6.0, 0.3, 0.6), red, 0, 2.25);                // kasagi
  add(new THREE.BoxGeometry(1.5, 0.3, 0.6), red, -3.4, 2.36, 0, -0.28);    // upturned ends
  add(new THREE.BoxGeometry(1.5, 0.3, 0.6), red, 3.4, 2.36, 0, 0.28);
  add(new THREE.BoxGeometry(0.5, 0.9, 0.2), dark, 0, 1.75);               // gakuzuka
  torii.position.y = -0.2; torii.scale.setScalar(0.85);
  scene.add(torii);

  // Petals (instanced)
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.bezierCurveTo(0.25, 0.1, 0.32, 0.5, 0, 0.62); shape.bezierCurveTo(-0.32, 0.5, -0.25, 0.1, 0, 0);
  const pGeo = new THREE.ShapeGeometry(shape, 8);
  const pMat = new THREE.MeshStandardMaterial({ color: 0xf6c6d0, emissive: 0xf08aa0, emissiveIntensity: 0.25, side: THREE.DoubleSide, roughness: 0.6 });
  const N = 60;
  const petals = new THREE.InstancedMesh(pGeo, pMat, N);
  scene.add(petals);
  const P = Array.from({ length: N }, () => ({
    x: (Math.random() - 0.5) * 14, y: Math.random() * 12 - 6, z: (Math.random() - 0.3) * 8,
    s: 0.25 + Math.random() * 0.35, fall: 0.25 + Math.random() * 0.5, sway: Math.random() * 6,
    rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6, spin: 0.5 + Math.random() * 1.5,
  }));
  const dummy = new THREE.Object3D();

  // Sizing
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage); resize();

  // Pointer parallax
  let mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => { mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });

  // Run only while visible
  let visible = true, last = performance.now(), t = 0, raf = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    torii.rotation.y += ((Math.sin(t * 0.35) * 0.55 + mx * 0.35) - torii.rotation.y) * 0.04;
    torii.rotation.x += ((my * 0.08) - torii.rotation.x) * 0.04;
    torii.position.y = -0.2 + Math.sin(t * 0.8) * 0.12;
    sun.scale.setScalar(1 + Math.sin(t * 0.9) * 0.025);
    P.forEach((p, i) => {
      p.y -= p.fall * dt; if (p.y < -6.5) { p.y = 6.5; p.x = (Math.random() - 0.5) * 14; }
      dummy.position.set(p.x + Math.sin(t * 0.6 + p.sway) * 0.9, p.y, p.z);
      dummy.rotation.set(p.rx + t * p.spin, p.ry + t * p.spin * 0.7, p.rz + t * 0.4);
      dummy.scale.setScalar(p.s); dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix);
    });
    petals.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  };
  const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(stage);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); stage.classList.remove('has-3d'); });

  renderer.render(scene, camera);
  stage.classList.add('has-3d');
  start();
}
