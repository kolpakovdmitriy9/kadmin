/* shared floor-plan data + renderer (also inlined in index.html) */
/* ---------- plans: drawn floor plans (rooms tile the flat, thick outer walls, doors, windows, furniture) ---------- */
// room: [x, y, w, h, name, kind]  kind: l = living, s = service, t = terrace (metres). door: [hingeX,hingeY, closedX,closedY, openX,openY]. window: [x1,y1,x2,y2]
const plans = [
  { g:'studio', tab:'Студии', type:'Студия', floor:'3–12', sec:'Секция 1', ppm:418000, W:4.6, H:6.2,
    rooms:[[0,0,4.6,4.4,'Комната-кухня','l'],[0,4.4,2.6,1.8,'Прихожая','s'],[2.6,4.4,2.0,1.8,'Санузел','s']],
    doors:[[.9,6.2,1.8,6.2,.9,5.3],[2.6,5.4,2.6,6.1,3.3,5.4],[1.4,4.4,2.2,4.4,1.4,3.6]],
    wins:[[.7,0,1.9,0],[2.7,0,3.9,0]],
    fur:[['kit',.05,.05,.6,2.5,'l'],['tbl',1.2,.6,.9,.9],['bed',2.45,2.55,2.05,1.65,'r'],['sofa',.1,2.75,.8,1.4,'l'],['ward',.05,4.45,.45,1.65],['bath',2.7,4.5,1.7,.65],['wc',4.1,5.5,'l'],['sink',3.45,5.8]] },
  { g:'1', tab:'1-комнатные', type:'1-комнатная', floor:'4–20', sec:'Секция 1', ppm:402000, W:5.6, H:7.0,
    rooms:[[0,0,3.6,4.4,'Комната','l'],[3.6,0,2.0,4.4,'Кухня','l'],[0,4.4,2.4,2.6,'Санузел','s'],[2.4,4.4,3.2,2.6,'Холл','s']],
    doors:[[3.0,7.0,3.9,7.0,3.0,6.1],[2.6,4.4,3.4,4.4,2.6,3.6],[5.0,4.4,4.2,4.4,5.0,3.6],[2.4,5.1,2.4,5.9,1.6,5.1]],
    wins:[[.8,0,2.8,0],[4.1,0,5.1,0]],
    fur:[['bed',.3,.15,1.6,2.0,'t'],['ward',.05,3.8,2.0,.55],['desk',2.5,.2,1.0,.6],['kit',5.0,.05,.55,3.1,'r'],['tbl',3.9,1.3,.9,.9],['bath',.1,4.55,.8,1.85],['wc',1.5,6.3,'u'],['sink',1.2,4.5],['ward',4.5,5.5,1.0,.5]] },
  { g:'2', tab:'2-комнатные', type:'Евро-двушка', floor:'4–22', sec:'Секция 2', ppm:395000, W:6.2, H:7.2,
    rooms:[[0,0,3.8,4.6,'Кухня-гостиная','l'],[3.8,0,2.4,4.6,'Спальня','l'],[0,4.6,2.2,2.6,'Санузел','s'],[2.2,4.6,4.0,2.6,'Холл','s']],
    doors:[[3.4,7.2,4.3,7.2,3.4,6.3],[2.6,4.6,3.4,4.6,2.6,3.8],[4.0,4.6,4.8,4.6,4.0,3.8],[2.2,5.3,2.2,6.0,1.5,5.3]],
    wins:[[.7,0,1.9,0],[2.4,0,3.4,0],[4.4,0,5.6,0]],
    fur:[['kit',.05,.1,.6,2.9,'l'],['tbl',1.3,.55,1.1,.9],['sofa',.3,3.45,1.9,.85,'b'],['bed',4.2,.15,1.6,2.0,'t'],['ward',5.6,2.4,.55,2.0],['bath',.1,4.75,.8,1.85],['wc',1.2,6.5,'u'],['sink',1.2,4.7],['ward',4.6,6.5,1.5,.6]] },
  { g:'2', tab:'2-комнатные', type:'2-комнатная', floor:'5–22', sec:'Секция 2', ppm:388000, W:7.0, H:8.2,
    rooms:[[0,0,4.2,5.2,'Гостиная-кухня','l'],[4.2,0,2.8,4.4,'Спальня','l'],[4.2,4.4,2.8,3.8,'Детская','l'],[0,5.2,1.8,3.0,'Санузел','s'],[1.8,5.2,2.4,3.0,'Холл','s']],
    doors:[[2.4,8.2,3.3,8.2,2.4,7.3],[2.2,5.2,3.2,5.2,2.2,4.2],[4.2,1.0,4.2,1.8,3.4,1.0],[4.2,5.8,4.2,6.6,5.0,5.8],[1.8,6.0,1.8,6.7,1.1,6.0]],
    wins:[[.8,0,2.0,0],[2.6,0,3.8,0],[5.2,0,6.6,0],[7,1.0,7,2.8],[7,5.0,7,6.6]],
    fur:[['kit',.05,.1,.6,3.0,'l'],['tbl',1.1,.9,1.5,.9],['sofa',.3,3.7,1.6,.85,'b'],['bed',5.2,.15,1.6,2.0,'t'],['ward',4.25,3.75,2.7,.55],['bed',6.0,4.55,.9,1.9,'t'],['desk',5.0,4.55,.9,.55],['ward',4.6,7.5,2.3,.6],['bath',.1,5.35,.8,1.85],['wc',1.2,7.5,'u'],['sink',1.1,5.3]] },
  { g:'3', tab:'3-комнатные', type:'3-комнатная', floor:'6–23', sec:'Секция 3', ppm:381000, W:9.0, H:8.8,
    rooms:[[0,0,5.2,5.4,'Гостиная-кухня','l'],[5.2,0,3.8,3.8,'Спальня','l'],[5.2,3.8,3.8,2.8,'Детская','l'],[5.2,6.6,3.8,2.2,'Кабинет','l'],[0,5.4,2.4,3.4,'Санузел','s'],[2.4,5.4,2.8,3.4,'Холл','s']],
    doors:[[3.2,8.8,4.1,8.8,3.2,7.9],[3.0,5.4,3.9,5.4,3.0,4.5],[5.2,1.0,5.2,1.9,6.1,1.0],[5.2,4.4,5.2,5.2,6.0,4.4],[5.2,7.2,5.2,8.0,6.0,7.2],[2.4,6.2,2.4,7.0,1.6,6.2]],
    wins:[[.8,0,2.2,0],[3.0,0,4.4,0],[6.0,0,7.8,0],[9,.9,9,2.9],[9,4.4,9,6.0],[9,7.2,9,8.4]],
    fur:[['kit',.05,.1,.6,3.4,'l'],['tbl',1.3,.8,1.9,.95],['sofa',.7,4.2,2.0,.9,'b'],['bed',6.3,.15,1.8,2.1,'t'],['ward',5.25,3.1,3.7,.55],['bed',8.0,4.1,.9,1.9,'t'],['desk',6.4,4.0,1.3,.6],['desk',6.8,7.0,1.4,.6],['ward',5.25,8.25,3.0,.5],['bath',.1,5.55,.85,1.9],['wc',1.5,7.9,'u'],['sink',1.3,5.5],['ward',4.7,5.5,.45,1.4]] },
  { g:'3', tab:'3-комнатные', type:'Квартира с террасой', floor:'24', sec:'Секция 3', ppm:372000, W:12.8, H:9.2,
    rooms:[[0,0,6.0,5.6,'Гостиная-кухня','l'],[6.0,0,3.6,4.6,'Мастер-спальня','l'],[6.0,4.6,3.6,2.2,'Санузел','s'],[6.0,6.8,3.6,2.4,'Гардероб','s'],[0,5.6,3.0,3.6,'Кабинет','l'],[3.0,5.6,3.0,3.6,'Холл','s'],[9.6,0,3.2,6.8,'Терраса','t']],
    doors:[[3.8,9.2,4.8,9.2,3.8,8.2],[3.4,5.6,4.4,5.6,3.4,4.6],[3.0,6.4,3.0,7.3,2.1,6.4],[6.0,7.5,6.0,8.4,6.9,7.5],[6.0,1.0,6.0,2.0,5.0,1.0],[9.1,4.6,8.2,4.6,9.1,5.5],[9.6,2.8,9.6,3.9,10.7,2.8]],
    wins:[[.8,0,2.4,0],[3.0,0,4.6,0],[7.0,0,8.8,0],[0,1.0,0,3.8],[0,6.4,0,8.2],[.8,9.2,2.2,9.2]],
    fur:[['kit',.05,.1,.6,3.6,'l'],['isl',1.5,1.1,2.0,.9],['tbl',2.9,3.2,1.6,.95],['sofa',.4,4.3,2.0,.9,'b'],['bed',7.2,.15,2.1,2.2,'t'],['ward',6.05,2.6,.55,1.9],['bath',6.15,4.8,1.9,.8],['wc',8.9,6.0,'l'],['sink',7.0,6.2],['ward',6.1,6.9,3.3,.45],['ward',6.1,8.7,3.3,.45],['desk',.35,6.1,1.4,.6],['ward',.05,7.6,.5,1.5],['sofa',10.4,.3,2.0,.8,'t'],['tbl',11.0,4.5,1.0,1.0],['plant',12.4,2.2],['plant',12.4,6.4],['plant',10.0,6.2]] }
];

const VBW = 372, VBH = 252;
const fmt = n => n.toFixed(1).replace('.', ',');
plans.forEach(p => {
  p.rooms.forEach(r => { r[6] = +(r[2] * r[3]).toFixed(2); });
  p.living = p.rooms.filter(r => r[5] === 'l').reduce((a, r) => a + r[6], 0);
  p.totalNum = p.rooms.filter(r => r[5] !== 't').reduce((a, r) => a + r[6], 0);
  p.terrace = p.rooms.filter(r => r[5] === 't').reduce((a, r) => a + r[6], 0);
  p.area = fmt(p.totalNum);
  p.sum = Math.round(p.totalNum * p.ppm / 1000) * 1000;
  p.price = (p.sum / 1e6).toFixed(1).replace('.', ',');
});
const money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const groups = [['all','Все'],['studio','Студии'],['1','1-комн.'],['2','2-комн.'],['3','3 и больше']];
let group = 'all', sel = 0;
const visible = () => plans.map((p, i) => [p, i]).filter(([p]) => group === 'all' || p.g === group);
const INK = '#2f2a27', FUR = '#f3f0ec';
function planSvg(p) {
  const S = Math.min((VBW - 36) / p.W, (VBH - 26) / p.H, 44), hasT = p.rooms.some(r => r[5] === 't'), fullW = p.W, ox = (VBW - fullW * S) / 2, oy = (VBH - p.H * S) / 2;
  const X = v => (ox + v * S).toFixed(1), Y = v => (oy + v * S).toFixed(1), L = v => (v * S).toFixed(1);
  const ln = (x1, y1, x2, y2, w = .9, c = INK) => `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${c}" stroke-width="${w}"/>`;
  const rc = (x, y, w, h, o = '') => `<rect x="${X(x)}" y="${Y(y)}" width="${L(w)}" height="${L(h)}" ${o}/>`;
  const fr = (x, y, w, h, rx = 0) => rc(x, y, w, h, `fill="${FUR}" stroke="${INK}" stroke-width=".8" rx="${(rx * S).toFixed(1)}"`);
  const ci = (x, y, r, o = '') => `<circle cx="${X(x)}" cy="${Y(y)}" r="${L(r)}" ${o}/>`;
  const loop = (x, y, w, h) => `M${X(x + w / 2)} ${Y(y)}H${X(x + w)}V${Y(y + h)}H${X(x)}V${Y(y)}H${X(x + w / 2)}`;
  const hole = `fill="none" stroke="${INK}" stroke-width=".7"`, seat = `fill="${FUR}" stroke="${INK}" stroke-width=".8"`;
  let g = '';
  // floors
  p.rooms.forEach(([x, y, w, h, , k]) => { g += rc(x, y, w, h, `fill="${k === 't' ? '#efe6dc' : '#fff'}"`); });
  // walls: every room outline, the terrace dashed, the building shell heavy
  p.rooms.forEach(([x, y, rw, rh, , k], i) => {
    if (k === 't') g += rc(x, y, rw, rh, `fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="4 3"`);
    else g += `<path class="wall" pathLength="1" d="${loop(x, y, rw, rh)}" fill="none" style="stroke-width:2.6px;transition-delay:${(.06 * i).toFixed(2)}s"/>`;
  });
  const shellW = hasT ? p.W - 3.2 : p.W;
  g += `<path class="wall" pathLength="1" d="${loop(0, 0, shellW, p.H)}" fill="none" style="stroke-width:6px"/>`;
  let o = '';
  p.wins.forEach(([x1, y1, x2, y2]) => {
    o += ln(x1, y1, x2, y2, 7.6, '#fff');
    const vert = x1 === x2;
    [-2.2, 0, 2.2].forEach(t => { o += vert ? `<line x1="${(+X(x1) + t).toFixed(1)}" y1="${Y(y1)}" x2="${(+X(x1) + t).toFixed(1)}" y2="${Y(y2)}" stroke="${INK}" stroke-width=".8"/>` : `<line x1="${X(x1)}" y1="${(+Y(y1) + t).toFixed(1)}" x2="${X(x2)}" y2="${(+Y(y1) + t).toFixed(1)}" stroke="${INK}" stroke-width=".8"/>`; });
  });
  p.doors.forEach(([hx, hy, ex, ey, qx, qy]) => {
    const r = Math.hypot(ex - hx, ey - hy), cross = (ex - hx) * (qy - hy) - (ey - hy) * (qx - hx);
    o += ln(hx, hy, ex, ey, 6.8, '#fff') + ln(hx, hy, qx, qy, 1.2);
    o += `<path d="M${X(ex)} ${Y(ey)} A${L(r)} ${L(r)} 0 0 ${cross > 0 ? 1 : 0} ${X(qx)} ${Y(qy)}" fill="none" stroke="${INK}" stroke-width=".7" stroke-dasharray="2 2"/>`;
  });
  let F = '';
  p.fur.forEach(([t, x, y, a, b, c]) => {
    if (t === 'bed') {
      const W = a, H = b, v = c === 't' || c === 'b', pw = v ? (W - .3) / 2 : .38, ph = v ? .38 : (H - .3) / 2;
      F += fr(x, y, W, H, .04);
      if (c === 't') F += fr(x + .1, y + .08, pw, ph, .1) + fr(x + .2 + pw, y + .08, pw, ph, .1) + ln(x, y + .62, x + W, y + .62, .8);
      if (c === 'b') F += fr(x + .1, y + H - .08 - ph, pw, ph, .1) + fr(x + .2 + pw, y + H - .08 - ph, pw, ph, .1) + ln(x, y + H - .62, x + W, y + H - .62, .8);
      if (c === 'r') F += fr(x + W - .08 - pw, y + .1, pw, ph, .1) + fr(x + W - .08 - pw, y + .2 + ph, pw, ph, .1) + ln(x + W - .62, y, x + W - .62, y + H, .8);
      if (c === 'l') F += fr(x + .08, y + .1, pw, ph, .1) + fr(x + .08, y + .2 + ph, pw, ph, .1) + ln(x + .62, y, x + .62, y + H, .8);
    } else if (t === 'sofa') {
      const W = a, H = b, d = .24;
      F += fr(x, y, W, H, .08);
      if (c === 't') F += fr(x, y, W, d, .08) + ln(x + W / 2, y + d, x + W / 2, y + H, .7);
      if (c === 'b') F += fr(x, y + H - d, W, d, .08) + ln(x + W / 2, y, x + W / 2, y + H - d, .7);
      if (c === 'l') F += fr(x, y, d, H, .08) + ln(x + d, y + H / 2, x + W, y + H / 2, .7);
      if (c === 'r') F += fr(x + W - d, y, d, H, .08) + ln(x, y + H / 2, x + W - d, y + H / 2, .7);
    } else if (t === 'kit') {
      F += fr(x, y, a, b);
      if (b > a) { const cx = x + a / 2; F += ci(cx, y + b * .2, .1, hole) + ci(cx, y + b * .34, .1, hole) + fr(x + .1, y + b * .52, a - .2, .5, .05) + ci(cx, y + b * .52 + .25, .08, hole) + fr(x + .02, y + b - .62, a - .04, .6); }
    } else if (t === 'isl') {
      F += fr(x, y, a, b) + [.45, a / 2, a - .45].map(dx => ci(x + dx, y + b + .28, .17, seat)).join('');
    } else if (t === 'tbl') {
      F += fr(x, y, a, b, .08);
      const n = Math.max(2, Math.round(a / .55));
      for (let i = 0; i < n; i++) { const cx = x + (i + .5) * a / n; F += fr(cx - .18, y - .3, .36, .26, .06) + fr(cx - .18, y + b + .04, .36, .26, .06); }
    } else if (t === 'desk') {
      F += fr(x, y, a, b) + ci(x + a / 2, y + b + .3, .2, seat);
    } else if (t === 'ward') {
      F += fr(x, y, a, b);
      const hz = a >= b, n = Math.max(2, Math.round((hz ? a : b) / .55));
      for (let i = 1; i < n; i++) F += hz ? ln(x + i * a / n, y, x + i * a / n, y + b, .6) : ln(x, y + i * b / n, x + a, y + i * b / n, .6);
    } else if (t === 'bath') {
      F += fr(x, y, a, b, .14) + fr(x + .08, y + .08, a - .16, b - .16, .12) + ci(x + a / 2, y + .28, .05, `fill="${INK}"`);
    } else if (t === 'wc') {
      if (b === 'u') F += fr(x - .2, y + .3, .4, .18, .03) + `<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${L(.17)}" ry="${L(.24)}" ${seat}/>`;
      else F += fr(x + .3, y - .2, .18, .4, .03) + `<ellipse cx="${X(x)}" cy="${Y(y)}" rx="${L(.24)}" ry="${L(.17)}" ${seat}/>`;
    } else if (t === 'sink') {
      F += fr(x, y, .55, .4, .06) + ci(x + .275, y + .2, .1, hole);
    } else if (t === 'plant') {
      F += ci(x, y, .26, `fill="#e1ead9" stroke="${INK}" stroke-width=".7"`) + ln(x - .2, y, x + .2, y, .6) + ln(x, y - .2, x, y + .2, .6) + ln(x - .14, y - .14, x + .14, y + .14, .6) + ln(x - .14, y + .14, x + .14, y - .14, .6);
    }
  });
  g += `<g class="fx">${F}</g><g class="fx">${o}</g>`;
  // room captions go to the free spot nearest the room's centre, clear of furniture and door swings
  const bbx = ([t, x, y, a, b]) => t === 'tbl' ? [x, y - .32, x + a, y + b + .32] : t === 'desk' ? [x, y, x + a, y + b + .5] : t === 'isl' ? [x, y, x + a, y + b + .46] : t === 'wc' ? (b === 'u' ? [x - .2, y - .26, x + .2, y + .48] : [x - .26, y - .2, x + .48, y + .2]) : t === 'sink' ? [x, y, x + .55, y + .4] : t === 'plant' ? [x - .26, y - .26, x + .26, y + .26] : [x, y, x + a, y + b];
  const blocks = p.fur.map(bbx);
  p.doors.forEach(([hx, hy, ex, ey, qx, qy]) => { const fx = ex + qx - hx, fy = ey + qy - hy, b = [Math.min(hx, ex, qx, fx), Math.min(hy, ey, qy, fy), Math.max(hx, ex, qx, fx), Math.max(hy, ey, qy, fy)]; blocks.push(b); blocks.push(Math.abs(hy - ey) < 1e-9 ? [b[0], 2 * hy - b[3], b[2], 2 * hy - b[1]] : [2 * hx - b[2], b[1], 2 * hx - b[0], b[3]]); });
  p.rooms.forEach(([x, y, rw, rh, name, , a]) => {
    const lw = Math.max(name.length * 3.6, 18) / S / 2, lh = 12 / S, top = 8 / S, cands = [];
    for (let px = x + lw + .12; px <= x + rw - lw - .12 + 1e-6; px += .15) for (let py = y + top + .15; py <= y + rh - lh - .15 + 1e-6; py += .15) cands.push([px, py]);
    cands.sort((u, v) => Math.hypot(u[0] - x - rw / 2, u[1] - y - rh / 2) - Math.hypot(v[0] - x - rw / 2, v[1] - y - rh / 2));
    const free = cands.find(([px, py]) => !blocks.some(b => px + lw > b[0] - .12 && px - lw < b[2] + .12 && py + lh > b[1] - .12 && py - top < b[3] + .12));
    const [px, py] = free || [x + rw / 2, y + rh / 2];
    g += `<text class="nm" x="${X(px)}" y="${Y(py - 0.0).replace(/^/, '')}" dy="-4" text-anchor="middle">${name}</text><text class="n" x="${X(px)}" y="${Y(py)}" dy="8" text-anchor="middle">${fmt(a)}</text>`;
  });
  return `<svg viewBox="0 0 ${VBW} ${VBH}" aria-hidden="true">${g}</svg>`;
}
