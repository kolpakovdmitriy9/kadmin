// gallery-motion — a 3D poster-carousel animation (WebGL, three.js). Deterministic: everything is a function of time t,
// so it can be played live (mountGalleryMotion) or rendered frame by frame (api.seek(t)).
//
//   import { mountGalleryMotion } from './gallery-motion.js';
//   const gm = mountGalleryMotion(document.querySelector('#gm'), { images: ['a.jpg', 'b.jpg', ...] });
//
import * as THREE from './vendor/three.module.min.js';
import { makePosterCanvases } from './posters.js';

export const DURATION = 8.85;

/* ---------- small math helpers ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
const out3 = u => 1 - Math.pow(1 - u, 3);
const out4 = u => 1 - Math.pow(1 - u, 4);
const io3 = u => (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const outBack = (u, c = 1.2) => 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
const ss = u => u * u * (3 - 2 * u);
const rad = d => d * Math.PI / 180;

/* ---------- scene constants (world units, camera at z=10) ---------- */
const H0 = 2.75;          // poster height at scale 1
const POSTER_Y = -0.27;   // flat poster centre
const DOTS_Y = 1.55;      // thumbnail row
const DOT_D = 0.34, DOT_GAP = 0.52;

/* ---------- storyboard (seconds, measured from the reference) ---------- */
const SEQ = [0, 1, 2, 3, 4];                 // poster indices shown full-size
const TS = [2.4, 2.9, 3.7, 4.5, 5.3];        // moment each one is fully formed
const INTRO_RING = [{ p: 5, base: -72 }, { p: 0, base: 0 }, { p: 1, base: 72 }, { p: 2, base: 144 }, { p: 6, base: -144 }];
const T_COLLAPSE = [5.75, 6.2];
const T_BURST_END = 8.0;

const VERT = /* glsl */`
  uniform float uBend, uScaleY, uNeck; uniform vec2 uSize;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float v = 0.5 - p.y;                       // 0 at the top edge, 1 at the bottom edge
    p.y = 0.5 - v * uScaleY;                   // collapse towards the top edge (the "drip")
    p.x *= mix(uNeck, 1.0, smoothstep(0.0, 0.45, v));
    float xw = p.x * uSize.x;
    if (abs(uBend) > 1e-4) {                   // bend around the vertical axis
      float a = xw * uBend;
      xw = sin(a) / uBend;
      p.z = -(1.0 - cos(a)) / uBend;
    }
    p.x = xw / uSize.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const FRAG = /* glsl */`
  uniform sampler2D uTex; uniform float uOpacity, uBlur, uShade, uCircle, uAspect;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    if (uCircle > 0.5) {
      if (length(vUv - 0.5) > 0.5) discard;
      if (uAspect > 1.0) uv.x = (uv.x - 0.5) / uAspect + 0.5; else uv.y = (uv.y - 0.5) * uAspect + 0.5;
    }
    vec4 c = vec4(0.0);
    for (int i = 0; i < 7; i++) { float o = (float(i) - 3.0) / 3.0; c += texture2D(uTex, uv + vec2(o * uBlur, 0.0)); }
    c /= 7.0;
    gl_FragColor = vec4(c.rgb * uShade, c.a * uOpacity);
  }`;

export function mountGalleryMotion(container, opts = {}) {
  const o = Object.assign({
    images: null,                 // optional array of image URLs replacing the built-in posters (8 recommended)
    background: '#111313',
    textColor: '#f2f2f3',
    title: ['Gallery', '+ Motion'],
    loop: true,
    autoplay: true,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    preserveDrawingBuffer: false
  }, opts);

  container.style.position = container.style.position || 'relative';
  container.style.overflow = 'hidden';
  container.style.background = o.background;
  if (!container.style.aspectRatio && !container.clientHeight) container.style.aspectRatio = '4 / 3';

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: o.preserveDrawingBuffer });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(o.pixelRatio);
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 100);
  camera.position.set(0, 0, 10);
  const root = new THREE.Group(); scene.add(root);

  let ready = false, current = 0, raf = 0, playing = false, t0 = 0, visible = true;

  /* ---------- text overlay ---------- */
  const label = document.createElement('div');
  label.style.cssText = `position:absolute;left:12.5%;top:13%;color:${o.textColor};font:500 1em/1.25 Inter,"Helvetica Neue",Arial,sans-serif;letter-spacing:-.01em;pointer-events:none;white-space:pre`;
  const dash = document.createElement('div');
  dash.style.cssText = `position:absolute;left:12.5%;top:7%;width:1.6em;height:.7em;opacity:.45;pointer-events:none;background:linear-gradient(${o.textColor} 1px,transparent 1px) 0 0/100% .24em`;
  const dot = document.createElement('div');
  dot.style.cssText = `position:absolute;right:3%;bottom:4%;width:.28em;height:.28em;border-radius:50%;background:${o.textColor};opacity:.8`;
  container.append(dash, label, dot);

  /* ---------- textures ---------- */
  const meshes = [], dots = [];
  const aspects = [];
  const mats = [];
  function makeMat(tex, aspect, circle) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: tex }, uOpacity: { value: 1 }, uBlur: { value: 0 }, uShade: { value: 1 }, uCircle: { value: circle ? 1 : 0 },
        uAspect: { value: aspect }, uBend: { value: 0 }, uScaleY: { value: 1 }, uNeck: { value: 1 }, uSize: { value: new THREE.Vector2(1, 1) }
      },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide
    });
  }
  function build(sources) {
    sources.forEach((src, i) => {
      const tex = src.isTexture ? src : new THREE.CanvasTexture(src);
      tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.needsUpdate = true;
      const w = (src.width || src.image?.width), h = (src.height || src.image?.height);
      const aspect = w / h; aspects[i] = aspect;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 40, 24), makeMat(tex, aspect, false));
      m.visible = false; root.add(m); meshes[i] = m;
      const d = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), makeMat(tex, aspect, true));
      d.visible = false; scene.add(d); dots[i] = d;
    });
    ready = true; render(current);
  }
  /* ---------- pose helpers ---------- */
  function pose(i, s) {
    const m = meshes[i], u = m.material.uniforms;
    const h = H0 * (s.s ?? 1), w = h * aspects[i] * (s.wx ?? 1);
    m.visible = (s.opacity ?? 1) > 0.003;
    m.scale.set(w, h, 1);
    const top = s.top;
    m.position.set(s.x ?? 0, top != null ? top - h / 2 : (s.y ?? 0), s.z ?? 0);
    m.rotation.set(s.rx ?? 0, s.ry ?? 0, s.rz ?? 0);
    u.uSize.value.set(w, h);
    u.uBend.value = s.bend ?? 0; u.uScaleY.value = s.sy ?? 1; u.uNeck.value = s.neck ?? 1;
    u.uBlur.value = s.blur ?? 0; u.uOpacity.value = s.opacity ?? 1;
    u.uShade.value = 1 - 0.42 * Math.abs(Math.sin(s.ry ?? 0));
    m.renderOrder = -(s.z ?? 0) * 10;
  }
  // the thumbnail row can show the same poster twice, so dots are drawn from a small pool of meshes
  const dotPool = [];
  function dotMesh(k, id) {
    if (!dotPool[k]) {
      const src = dots[((id % 8) + 8) % 8];
      const m = new THREE.Mesh(src.geometry, src.material.clone()); scene.add(m); dotPool[k] = m;
    }
    const m = dotPool[k], i = ((id % 8) + 8) % 8;
    m.material.uniforms.uTex.value = dots[i].material.uniforms.uTex.value;
    m.material.uniforms.uAspect.value = aspects[i];
    return m;
  }

  /* ---------- the storyboard ---------- */
  function render(tt) {
    if (!ready) return;
    const t = o.loop ? ((tt % DURATION) + DURATION) % DURATION : clamp(tt, 0, DURATION);
    meshes.forEach(m => (m.visible = false));
    dotPool.forEach(m => m && (m.visible = false));
    root.rotation.set(0, 0, 0);

    /* --- A: intro, a 3-D ring of cards unwinds out of a point (0 → 2.1 s) --- */
    if (t < 2.45) {
      const spin = 380 * (1 - out4(prog(t, 0, 1.0)));
      const theta = (t < 1.0 ? spin : 0) - 72 * io3(prog(t, 1.0, 1.85));
      const dTheta = (-(380 * (out4(prog(t + .01, 0, 1.0)) - out4(prog(t - .01, 0, 1.0))) / .02) * (t < 1 ? 1 : 0)) + (-72 * (io3(prog(t + .01, 1.0, 1.85)) - io3(prog(t - .01, 1.0, 1.85))) / .02);
      const R = lerp(0.15, 3.4, out3(prog(t, 0, 0.55))) * (1 - io3(prog(t, 1.7, 2.0)));
      const S = lerp(0.12, 1.0, out3(prog(t, 0, 0.6)));
      const bend = lerp(1.5, 0, io3(prog(t, 0.12, 0.95)));
      const blur = clamp(Math.abs(dTheta) / 1500 * 0.1, 0, 0.1);
      INTRO_RING.forEach(c => {
        const phi = rad(c.base + theta), cosP = Math.cos(phi);
        let op = ss(clamp((cosP + 0.55) / 0.75));
        if (c.p !== 1) op *= 1 - ss(prog(t, 1.72, 2.0));
        if (t >= 2.0 && c.p !== 1) op = 0;
        const y = POSTER_Y * ss(prog(t, 1.6, 2.1));
        if (c.p === 1 && t >= TS[0] - 0.42) return; // the digits poster is handled by the drip below
        pose(c.p, { x: R * Math.sin(phi), y, z: R * (cosP - 1), ry: phi, s: S, bend: bend * (R > 0.4 ? 1 : 0), blur, opacity: op });
      });
    }

    /* --- B: slideshow — each poster drips out of its thumbnail (2.0 → 5.75 s) --- */
    if (t >= TS[0] - 0.42 && t < T_COLLAPSE[0]) {
      const topFlat = POSTER_Y + H0 / 2, dotTop = DOTS_Y - 0.05;
      for (let i = 0; i < SEQ.length; i++) {
        const e = TS[i], m = e - 0.22, a = e - 0.42;
        const nextA = i + 1 < SEQ.length ? TS[i + 1] - 0.42 : T_COLLAPSE[0];
        if (t >= a && t < m) {                           // 1) previous poster is sucked up into the thumbnail row
          const u = io3(prog(t, a, m)), prev = i === 0 ? 1 : SEQ[i - 1];
          pose(prev, { x: 0, top: lerp(topFlat, dotTop, u), sy: Math.max(1 - u, 0.001), neck: lerp(1, 0.12, u), wx: lerp(0.3, 1, Math.sqrt(1 - u)) });
        } else if (t >= m && t < e) {                    // 2) the new one drips back down out of it
          const u = prog(t, m, e);
          const sy = Math.max(outBack(u, 0.5), 0.001);
          pose(SEQ[i], { x: 0, top: lerp(dotTop, topFlat, out3(u)), sy, neck: lerp(0.12, 1, out3(u)), wx: lerp(0.3, 1, Math.sqrt(Math.min(sy, 1))) });
        } else if (t >= e && t < nextA) {                // 3) it rests
          pose(SEQ[i], { x: 0, y: POSTER_Y });
        }
      }
    }

    /* --- thumbnails above the poster: the left-most one flies to the centre and melts into the next poster --- */
    if (t >= 2.25 && t < 6.05) {
      const fadeIn = ss(prog(t, 2.3, 2.55)), fadeOut = 1 - ss(prog(t, 5.7, 6.0));
      const c = [1, 2, 3, 4].reduce((acc, i) => acc + io3(prog(t, TS[i], TS[i] + 0.35)), 0);
      let k = 0;
      for (let id = 1; id <= 8; id++) {
        const ci = SEQ.indexOf(id);
        let drop = 0, grow = 1, op = 1, flyU = 0;
        if (ci >= 1) {
          const a = TS[ci] - 0.42, e = TS[ci];
          if (t >= e) continue;
          if (t >= a) { const u = prog(t, a, e); flyU = out3(u); drop = -0.2 * flyU; grow = lerp(1, 1.4, flyU); op = 1 - ss(prog(t, e - 0.16, e)); }
        }
        const slot = (id - 1) - c;
        const edge = clamp(slot + 0.7) * clamp(5.2 - slot);
        const x = lerp((slot - 2) * DOT_GAP, 0, flyU), y = DOTS_Y + lerp(0.9, 0, out3(prog(t, 2.3, 2.6))) + drop;
        const m = dotMesh(k++, id), sc = DOT_D * grow * (0.4 + 0.6 * fadeOut);
        m.scale.set(sc, sc, 1); m.position.set(x, y, 0.2);
        m.material.uniforms.uOpacity.value = edge * fadeIn * fadeOut * op;
        m.visible = m.material.uniforms.uOpacity.value > 0.01;
      }
    }

    /* --- C: collapse into a tiny card (5.75 → 6.2 s), D: burst into a spinning 3-D cluster (6.2 → 8.85 s) --- */
    if (t >= T_COLLAPSE[0]) {
      const uC = io3(prog(t, T_COLLAPSE[0], T_COLLAPSE[1]));
      if (t < T_COLLAPSE[1] + 0.15) {
        pose(4, { x: 0, y: lerp(POSTER_Y, 0, uC), s: lerp(1, 0.12, uC), opacity: 1 - ss(prog(t, 6.15, 6.35)) });
      }
      if (t >= T_COLLAPSE[1] - 0.05) {
        const tb = t - T_COLLAPSE[1];
        const shrink = io3(prog(t, T_BURST_END, DURATION));
        const R = (2.5 * out3(prog(t, 6.2, 6.95)) + 0.1) * (1 - 0.95 * shrink);
        const S = lerp(0.12, 0.52, out3(prog(t, 6.2, 7.0))) * (1 - 0.8 * shrink);
        const theta = 1.1 * tb + 6.0 * (1 - out3(prog(t, 6.2, 7.5))) + 2.2 * ss(prog(t, T_BURST_END, DURATION));
        const omega = 1.1 + 6.0 * 3 * Math.pow(1 - prog(t, 6.2, 7.5), 2) / 1.3 * (t < 7.5 ? 1 : 0);
        root.rotation.set(0.5, 0, 0.22);
        for (let k = 0; k < 8; k++) {
          if (k === 4 && t < 6.35) continue;          // the collapsing card is still crossfading out
          const phi = theta + k * (Math.PI * 2 / 8);
          const wob = 0.4 * Math.sin(k * 1.7);
          pose(k, {
            x: R * Math.sin(phi), y: R * 0.22 * Math.sin(k * 2.1 + tb * .8), z: R * (Math.cos(phi) - 1) * 0.9,
            ry: phi + wob, rx: 0.25 * Math.sin(k + tb), s: S, blur: clamp(omega / 20 * 0.12, 0, 0.09),
            opacity: ss(prog(t, 6.15, 6.5)) * (Math.cos(phi) > -0.9 ? 1 : 0.55)
          });
        }
      }
    }

    /* --- title (typed in at 0.3 s, glitched away 8.1 → 8.6 s) --- */
    const full = o.title.join('\n');
    const n = Math.floor(full.length * ss(prog(t, 0.3, 0.7)));
    let txt = '';
    for (let i = 0; i < full.length; i++) {
      const ch = full[i];
      if (i >= n) { txt += ' '; continue; }
      const g = prog(t, 8.1, 8.6);
      const h = Math.abs(Math.sin((i + 1) * 12.9898 + Math.floor(t * 22) * 78.233) * 43758.5453) % 1;
      txt += (ch === '\n' || h > g) ? ch : (h > g * 0.5 ? '·' : ' ');
    }
    label.textContent = txt;
    dash.style.opacity = (.45 * ss(prog(t, 0.3, 0.6)) * (1 - prog(t, 8.1, 8.4))).toFixed(3);

    renderer.render(scene, camera);
  }

  /* ---------- sizing ---------- */
  function resize() {
    const w = container.clientWidth || 640, h = container.clientHeight || 480;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const visW43 = 2 * 10 * Math.tan(rad(15)) * (4 / 3);        // keep the 4:3 composition fully visible
    const vFov = 2 * Math.atan(Math.max(visW43 / camera.aspect, 2 * 10 * Math.tan(rad(15))) / 2 / 10);
    camera.fov = vFov * 180 / Math.PI; camera.updateProjectionMatrix();
    container.style.fontSize = Math.max(8, h * 0.046) + 'px';
    render(current);
  }
  const ro = new ResizeObserver(resize); ro.observe(container);

  /* ---------- playback ---------- */
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(now) {
    if (!playing) return;
    current = (now - t0) / 1000; if (!o.loop && current > DURATION) { current = DURATION; playing = false; }
    render(current); raf = requestAnimationFrame(tick);
  }
  function play() { if (playing) return; playing = true; t0 = performance.now() - current * 1000; raf = requestAnimationFrame(tick); }
  function pause() { playing = false; cancelAnimationFrame(raf); }
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && o.autoplay && !reduce) play(); else pause(); }, { threshold: 0.05 });
  io.observe(container);
  // textures are created last so every helper above is initialised
  if (o.images && o.images.length) {
    const loader = new THREE.TextureLoader(); loader.crossOrigin = 'anonymous';
    Promise.all(o.images.map(u => new Promise((res, rej) => loader.load(u, t => res(t), undefined, rej)))).then(texs => build(texs)).catch(() => build(makePosterCanvases()));
  } else build(makePosterCanvases());

  resize();
  if (reduce) { current = 3.0; render(current); } else if (o.autoplay) play();

  return {
    seek(t) { pause(); current = t; render(t); },
    play, pause, duration: DURATION,
    destroy() { pause(); ro.disconnect(); io.disconnect(); renderer.dispose(); container.replaceChildren(); }
  };
}
