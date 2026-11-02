// Procedural placeholder posters (all drawn here, nothing copied). Pass your own `images` to mountGalleryMotion to replace them.

function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

function footer(g, W, H, color, a = .55) {
  g.fillStyle = color; g.globalAlpha = a; g.font = `500 ${H * 0.014}px ${FONT}`;
  g.fillText('GALLERY + MOTION', W * 0.06, H * 0.955); g.textAlign = 'right';
  g.fillText('VOL. 03 — 2026', W * 0.94, H * 0.955); g.textAlign = 'left'; g.globalAlpha = 1;
}

// 1. light poster with a stepped black block
function blackBlock() {
  const W = 768, H = 1024, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#ececec'; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, 0, H * .55); gr.addColorStop(0, '#b9b9b9'); gr.addColorStop(1, '#ececec');
  g.fillStyle = gr; g.fillRect(0, 0, W, H * .55);
  g.fillStyle = '#0b0b0b';
  g.fillRect(W * .46, H * .22, W * .34, H * .5);
  for (let i = 0; i < 9; i++) { const y = H * (.22 + i * .056), x = W * (.28 + ((i * 37) % 5) * .035); g.fillRect(x, y, W * .5 - x + W * .1, H * .035); }
  g.fillRect(W * .30, H * .50, W * .30, H * .06);
  footer(g, W, H, '#111');
  return c;
}

// 2. seven-segment numerals
function digits() {
  const W = 768, H = 1024, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#f5f5f5'; g.fillRect(0, 0, W, H);
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  const gw = 150, gh = 250, lw = 15;
  function glyph(d, x, y) {
    const seg = {
      a: [x + lw, y, x + gw - lw, y], b: [x + gw, y + lw, x + gw, y + gh / 2 - lw], c: [x + gw, y + gh / 2 + lw, x + gw, y + gh - lw],
      d: [x + lw, y + gh, x + gw - lw, y + gh], e: [x, y + gh / 2 + lw, x, y + gh - lw], f: [x, y + lw, x, y + gh / 2 - lw], g: [x + lw, y + gh / 2, x + gw - lw, y + gh / 2]
    };
    g.strokeStyle = '#0d0d0d'; g.lineWidth = lw; g.lineCap = 'round';
    for (const k of SEG[d]) { const s = seg[k]; g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke(); }
  }
  for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) glyph(r * 3 + q + 1, W * .5 - 1.5 * gw - 70 + q * (gw + 70), H * .16 + r * (gh + 90));
  footer(g, W, H, '#111');
  return c;
}

// 3. exhibition room (landscape)
function exhibition() {
  const W = 1024, H = 768, c = cv(W, H), g = c.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0f0f10'); gr.addColorStop(.45, '#8d8a88'); gr.addColorStop(.47, '#d9d5d2'); gr.addColorStop(.6, '#6a6361'); gr.addColorStop(1, '#2b2626');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#f2f1f0'; g.fillRect(W * .72, H * .18, W * .26, H * .5);
  const bx = W * .12, by = H * .26, bw = W * .56, bh = H * .42;
  gr = g.createLinearGradient(0, by, 0, by + bh);
  [[0, '#efe6dc'], [.30, '#f3d9c2'], [.45, '#e6a69a'], [.55, '#8a6fb4'], [.68, '#f0a468'], [.82, '#efe0cf'], [1, '#d8cfc6']].forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillRect(bx, by, bw, bh);
  const sh = g.createLinearGradient(bx, 0, bx + bw, 0); sh.addColorStop(0, 'rgba(0,0,0,.28)'); sh.addColorStop(.5, 'rgba(255,255,255,.12)'); sh.addColorStop(1, 'rgba(0,0,0,.18)');
  g.fillStyle = sh; g.fillRect(bx, by, bw, bh);
  g.save(); g.globalAlpha = .35; g.scale(1, -.35); g.fillStyle = gr; g.fillRect(bx, -(by + bh) / .35 - bh * .9, bw, bh); g.restore();
  g.fillStyle = '#16120f'; g.beginPath(); g.arc(W * .8, H * .45, 17, 0, 7); g.fill();
  g.beginPath(); g.roundRect(W * .8 - 24, H * .47, 48, 150, 18); g.fill();
  g.fillStyle = '#fff'; g.save(); g.translate(W * .9, H * .35); g.rotate(.5); g.fillRect(-8, 0, 16, 170); g.restore();
  return c;
}

// 4. "pace+" – yellow wordmark, figure silhouette
function pace() {
  const W = 768, H = 1024, c = cv(W, H), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#d5d8d9'); gr.addColorStop(1, '#eceeee');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#35362f'; g.beginPath(); g.roundRect(W * .3, H * .05, W * .4, H * .36, 60); g.fill();
  g.fillStyle = '#4a4b42'; g.beginPath(); g.roundRect(W * .34, H * .38, W * .12, H * .46, 30); g.fill();
  g.beginPath(); g.roundRect(W * .54, H * .38, W * .12, H * .46, 30); g.fill();
  g.fillStyle = '#e8ee3c'; g.beginPath(); g.ellipse(W * .39, H * .88, 70, 28, -.1, 0, 7); g.fill(); g.beginPath(); g.ellipse(W * .61, H * .88, 70, 28, .1, 0, 7); g.fill();
  g.fillStyle = '#f4ff2f'; g.font = `900 ${W * .34}px ${FONT}`; g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 18;
  g.fillText('pace+', W / 2, H * .5); g.shadowBlur = 0; g.textAlign = 'left';
  footer(g, W, H, '#222', .4);
  return c;
}

// 5. giant white "S" on a deep red
function bigS() {
  const W = 768, H = 1024, c = cv(W, H), g = c.getContext('2d');
  let gr = g.createRadialGradient(W / 2, H * .4, 40, W / 2, H * .5, H * .8); gr.addColorStop(0, '#5a2a28'); gr.addColorStop(1, '#2a0f0f');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = rnd(5); g.globalAlpha = .12; for (let i = 0; i < 2500; i++) { g.fillStyle = r() > .5 ? '#fff' : '#000'; g.fillRect(r() * W, r() * H, 2, 2); } g.globalAlpha = 1;
  g.fillStyle = '#c9c4c4'; g.beginPath(); g.ellipse(W / 2, H * .22, 150, 120, 0, 0, 7); g.fill();
  g.font = `900 ${W * 1.02}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = 'rgba(0,200,255,.7)'; g.fillText('S', W / 2 - 10, H * .82);
  g.fillStyle = 'rgba(255,60,120,.7)'; g.fillText('S', W / 2 + 10, H * .82 + 6);
  g.fillStyle = '#f4f2f2'; g.fillText('S', W / 2, H * .82); g.textAlign = 'left';
  footer(g, W, H, '#fff', .5);
  return c;
}

// 6. blue typography on white
function blue() {
  const W = 768, H = 1024, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#f6f6f6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1b2cff'; g.fillRect(0, H * .62, W, H * .38);
  g.font = `900 ${W * .2}px ${FONT}`; ['BECOM-', 'ING', 'TIP', 'GREAT'].forEach((s, i) => g.fillText(s, W * .08, H * (.17 + i * .15)));
  g.fillStyle = '#e9964f'; g.beginPath(); g.arc(W * .72, H * .5, 90, 0, 7); g.fill();
  g.fillStyle = '#f6f6f6'; g.font = `700 ${H * .02}px ${FONT}`; g.fillText('A SERIES ON GROWTH', W * .08, H * .93);
  return c;
}

// 7. lime pixel blob on black
function lime() {
  const W = 768, H = 1024, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#0e0f10'; g.fillRect(0, 0, W, H);
  const r = rnd(11), n = 24, cs = W / n;
  for (let y = 0; y < 32; y++) for (let x = 0; x < n; x++) {
    const d = Math.hypot(x - n * .5, y - 15) / 14;
    if (r() > d * 1.1 - .05) { g.fillStyle = r() > .2 ? '#dcf63f' : '#9bb52a'; g.fillRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2); }
  }
  g.fillStyle = '#e8fb4a'; g.font = `900 ${W * .24}px ${FONT}`; g.fillText('PIECES', W * .05, H * .93);
  return c;
}

// 8. grey typographic "AU"
function au() {
  const W = 768, H = 1024, c = cv(W, H), g = c.getContext('2d');
  g.fillStyle = '#dedede'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#7d7d7d'; g.font = `900 ${W * .62}px ${FONT}`; g.fillText('AU', W * .02, H * .66);
  g.fillStyle = '#111'; g.font = `800 ${W * .09}px ${FONT}`; g.fillText('ASIII', W * .06, H * .14); g.fillText('OA', W * .55, H * .26);
  footer(g, W, H, '#111');
  return c;
}

export function makePosterCanvases() {
  return [blackBlock(), digits(), exhibition(), pace(), bigS(), blue(), lime(), au()];
}
