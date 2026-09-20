import * as THREE from 'three';

const TAU = Math.PI * 2;

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform vec2 uPulseOrigin;
  uniform float uPulseRadius;
  uniform float uPulseStrength;
  uniform float uPixelRatio;
  attribute vec2 aCenter;
  attribute float aSpeed;
  attribute float aMix;
  attribute float aSize;
  attribute float aAlpha;
  attribute float aRand;
  varying float vMix;
  varying float vAlpha;

  void main() {
    float ang = uTime * aSpeed;
    float cs = cos(ang);
    float sn = sin(ang);
    vec2 p = position.xy - aCenter;
    p = vec2(p.x * cs - p.y * sn, p.x * sn + p.y * cs) + aCenter;
    vec3 pos = vec3(p, position.z);
    pos.xy *= 1.0 + 0.006 * sin(uTime * 0.4 + aRand * 6.283);

    vec2 dp = pos.xy - uPointer;
    float force = exp(-dot(dp, dp) * 26.0) * uPointerStrength;
    pos.xy += normalize(dp + vec2(1e-4)) * force * 0.17;
    pos.z += force * 0.4;

    vec2 dq = pos.xy - uPulseOrigin;
    float wave = exp(-pow((length(dq) - uPulseRadius) * 7.0, 2.0)) * uPulseStrength;
    pos.xy += normalize(dq + vec2(1e-4)) * wave * 0.14;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (3.4 / -mv.z) * (1.0 + force * 2.4 + wave * 1.8);
    float tw = 0.8 + 0.2 * sin(uTime * (0.6 + aRand * 1.7) + aRand * 40.0);
    vAlpha = aAlpha * tw * (1.0 + force * 1.6 + wave * 1.4);
    vMix = aMix;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uPaper;
  uniform vec3 uAccent;
  varying float vMix;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(uPaper, uAccent, vMix), a);
  }
`;

// Particle layout of a chronograph: bezel ticks, minute track, two subdials
// with fast hands, a 60-second sweep hand, and ambient dust.
function buildDial(quality) {
  const position = [];
  const center = [];
  const speed = [];
  const mix = [];
  const size = [];
  const alpha = [];
  const rand = [];
  const rnd = (spread = 1) => (Math.random() - 0.5) * spread;

  const push = (x, y, options = {}) => {
    const { cx = 0, cy = 0, spd = 0, mx = 0, sz = 2, al = 0.3, z = rnd(0.05) } = options;
    position.push(x, y, z);
    center.push(cx, cy);
    speed.push(spd);
    mix.push(mx);
    size.push(sz);
    alpha.push(al);
    rand.push(Math.random());
  };

  // Bezel: 60 tick dashes, longer every fifth
  for (let t = 0; t < 60; t += 1) {
    const angle = (t / 60) * TAU;
    const major = t % 5 === 0;
    const len = major ? 0.085 : 0.05;
    const count = major ? 10 : 6;
    for (let i = 0; i < count; i += 1) {
      const r = 1.0 + (i / (count - 1)) * len + rnd(0.006);
      push(Math.cos(angle) * r + rnd(0.005), Math.sin(angle) * r + rnd(0.005), {
        spd: 0.012, sz: major ? 3.1 : 2.7, al: major ? 0.85 : 0.6,
      });
    }
  }

  // Minute track: thin dense ring
  const trackCount = Math.round(1500 * quality);
  for (let i = 0; i < trackCount; i += 1) {
    const angle = Math.random() * TAU;
    const r = 0.84 + rnd(0.014);
    push(Math.cos(angle) * r, Math.sin(angle) * r, { spd: -0.006, sz: 2.0, al: 0.46 });
  }

  // Dust field with a few accent motes
  const dustCount = Math.round(3200 * quality);
  for (let i = 0; i < dustCount; i += 1) {
    const angle = Math.random() * TAU;
    const r = 0.1 + Math.sqrt(Math.random()) * 1.16;
    push(Math.cos(angle) * r, Math.sin(angle) * r, {
      spd: rnd(0.05), mx: Math.random() < 0.06 ? 1 : 0,
      sz: 1.5 + Math.random() * 1.7, al: 0.12 + Math.random() * 0.26, z: rnd(0.12),
    });
  }

  // Two chronograph subdials: ring + ticks + fast accent hand
  const subdial = (cx, cy, radius, handSpeed) => {
    const ringCount = Math.round(300 * quality * (radius / 0.2));
    for (let i = 0; i < ringCount; i += 1) {
      const angle = Math.random() * TAU;
      const r = radius + rnd(0.008);
      push(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, {
        cx, cy, spd: handSpeed * 0.04, sz: 1.9, al: 0.4,
      });
    }
    for (let t = 0; t < 12; t += 1) {
      const angle = (t / 12) * TAU;
      for (let i = 0; i < 3; i += 1) {
        const r = radius * (0.82 - i * 0.07);
        push(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, { cx, cy, sz: 2.2, al: 0.5 });
      }
    }
    const handCount = 40;
    for (let i = 0; i < handCount; i += 1) {
      const r = (i / handCount) * radius * 0.9;
      push(cx + rnd(0.006), cy + r + rnd(0.006), { cx, cy, spd: handSpeed, mx: 1, sz: 2.6, al: 0.8 });
    }
  };
  subdial(0.42, 0.2, 0.2, 0.7);
  subdial(-0.38, -0.16, 0.16, -0.45);

  // Sweep hand: one revolution per minute, accent, with counterweight + cap
  const sweepCount = 210;
  for (let i = 0; i < sweepCount; i += 1) {
    const r = -0.16 + (i / sweepCount) * 1.13;
    push(rnd(0.008), r + rnd(0.008), {
      spd: -TAU / 60, mx: 1, sz: i > sweepCount - 14 ? 3.4 : 2.8, al: 0.85,
    });
  }
  for (let i = 0; i < 26; i += 1) {
    const angle = Math.random() * TAU;
    const r = Math.random() * 0.035;
    push(Math.cos(angle) * r, Math.sin(angle) * r, { spd: -TAU / 60, mx: 1, sz: 2.6, al: 0.9 });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('aCenter', new THREE.Float32BufferAttribute(center, 2));
  geometry.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speed, 1));
  geometry.setAttribute('aMix', new THREE.Float32BufferAttribute(mix, 1));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
  geometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alpha, 1));
  geometry.setAttribute('aRand', new THREE.Float32BufferAttribute(rand, 1));
  return geometry;
}

export function initHeroScene() {
  const host = document.querySelector('[data-hero-scene]');
  const hero = host?.closest('.hero');
  if (!host || !hero) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return; // No WebGL: the SVG ambience stays as the fallback.
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
  camera.position.z = 3.9;

  const quality = Math.min(1, Math.max(0.45, innerWidth / 1100));
  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(9, 9) },
    uPointerStrength: { value: 0 },
    uPulseOrigin: { value: new THREE.Vector2(0, 0) },
    uPulseRadius: { value: 0 },
    uPulseStrength: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uPaper: { value: new THREE.Color('#eceee6') },
    uAccent: { value: new THREE.Color('#d9644a') },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const group = new THREE.Group();
  group.add(new THREE.Points(buildDial(quality), material));
  scene.add(group);

  const visibleHeight = () => 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visH = visibleHeight();
    const fit = 0.94 * Math.min(visH * camera.aspect, visH * 1.08);
    group.scale.setScalar(fit / 2.2);
    if (reduceMotion) renderer.render(scene, camera);
  };
  resize();
  new ResizeObserver(resize).observe(host);

  // Light theme: additive pale particles wash out on a bright canvas, so
  // switch to dark ink motes with normal blending.
  const applyTheme = () => {
    const light = document.documentElement.dataset.theme === 'light';
    uniforms.uPaper.value.set(light ? '#26261f' : '#eceee6');
    material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    material.needsUpdate = true;
    if (reduceMotion) renderer.render(scene, camera);
  };
  applyTheme();
  addEventListener('novaform:theme', applyTheme);

  if (reduceMotion) {
    renderer.render(scene, camera); // Single still frame: no drift, no loop.
    return;
  }

  const pointerNDC = new THREE.Vector2(0, 0);
  const pointerDial = new THREE.Vector2(9, 9);
  const smoothed = new THREE.Vector2(9, 9);
  let lastMove = -1e4;

  const toDial = (clientX, clientY) => {
    const rect = hero.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
    pointerNDC.set(nx, ny);
    const visH = visibleHeight();
    pointerDial.set(
      (nx * visH * camera.aspect) / 2 / group.scale.x,
      (ny * visH) / 2 / group.scale.x,
    );
  };

  addEventListener('pointermove', (event) => {
    toDial(event.clientX, event.clientY);
    lastMove = performance.now();
    if (smoothed.x > 8) smoothed.copy(pointerDial);
  }, { passive: true });

  let pulseAge = 1e4;
  hero.addEventListener('pointerdown', (event) => {
    toDial(event.clientX, event.clientY);
    uniforms.uPulseOrigin.value.copy(pointerDial);
    pulseAge = 0;
  });

  let running = true;
  new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting;
  }).observe(hero);

  const clock = new THREE.Clock();
  const frame = () => {
    requestAnimationFrame(frame);
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value = clock.elapsedTime;

    smoothed.lerp(pointerDial, 0.09);
    uniforms.uPointer.value.copy(smoothed);
    const active = performance.now() - lastMove < 2500 ? 1 : 0;
    uniforms.uPointerStrength.value += (active - uniforms.uPointerStrength.value) * 0.06;

    pulseAge += dt;
    uniforms.uPulseRadius.value = pulseAge * 1.5;
    uniforms.uPulseStrength.value = Math.exp(-pulseAge * 1.6);

    group.rotation.x += (-pointerNDC.y * 0.1 - group.rotation.x) * 0.04;
    group.rotation.y += (pointerNDC.x * 0.14 - group.rotation.y) * 0.04;
    renderer.render(scene, camera);
  };
  frame();
}
