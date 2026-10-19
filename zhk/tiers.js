/* ЖК «Атлас» — behaviours shared by the Базовый and Нейро pages */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.reveal').forEach((e, i) => { e.style.transitionDelay = (e.dataset.d || 0) + 'ms'; io.observe(e); });

  /* plans: tabs + drawn plan + areas and the full price */
  const box = $('#plan-box');
  if (box && window.plans) {
    const tabs = $('#plan-tabs'), money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    let cur = 0;
    tabs.innerHTML = plans.map((p, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="${i === 0}">${p.type}</button>`).join('');
    const set = i => {
      cur = i; const p = plans[i];
      $$('[data-i]', tabs).forEach(b => b.setAttribute('aria-selected', +b.dataset.i === i));
      box.innerHTML = planSvg(p);
      $('#plan-type').textContent = p.type;
      $('#plan-area').innerHTML = p.area + '<small>м²</small>';
      $('#plan-facts').innerHTML = `<span>Жилая <b>${fmt(p.living)} м²</b></span><span>Общая <b>${fmt(p.totalNum)} м²</b></span>${p.terrace ? `<span>Терраса <b>${fmt(p.terrace)} м²</b></span>` : ''}<span>${p.sec} · этаж <b>${p.floor}</b></span><span class="tot">Стоимость <b>${money(p.sum)} ₽</b></span>`;
    };
    tabs.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) set(+b.dataset.i); });
    tabs.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return; e.preventDefault(); const n = (cur + (e.key === 'ArrowRight' ? 1 : plans.length - 1)) % plans.length; set(n); $(`[data-i="${n}"]`, tabs).focus(); });
    set(0);
  }

  /* neighbourhood hotspots */
  const areas = [
    ['01 / Кофейня и пекарня', 'Утро начинается внизу', 'На первом этаже — кофейня, пекарня и цветочный магазин. До них одна минута пешком.'],
    ['02 / Детская площадка', 'Двор, где дети на виду', 'Машины остаются под землёй. Игровые зоны для разных возрастов лежат на уровне первого этажа.'],
    ['03 / Пруд во дворе', 'Вечер у воды', 'Деревянный настил, тёплая подсветка дорожек и скамьи с видом на пруд.']
  ];
  const photos = $$('[data-photo]');
  const setArea = i => {
    $$('[data-area]').forEach(b => { b.setAttribute('aria-pressed', +b.dataset.area === i); b.classList.toggle('active', +b.dataset.area === i); });
    const n = $('#area-num'), t = $('#area-title'), d = $('#area-desc'); if (n) { n.textContent = areas[i][0]; t.textContent = areas[i][1]; d.textContent = areas[i][2]; }
    photos.forEach((p, k) => p.classList.toggle('on', k === i));
  };
  $$('[data-area]').forEach(b => b.addEventListener('click', () => setArea(+b.dataset.area)));
  if (photos.length) setArea(0);

  /* dialog */
  const dlg = $('#dlg');
  if (dlg) {
    $$('[data-dlg]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); $('#dlg-t').textContent = b.dataset.dlg; $('#dlg-p').textContent = b.dataset.txt || 'Обсудите удобное время с отделом продаж: +7 (495) 000-00-00. Это демонстрационный сайт, заявки не отправляются.'; dlg.showModal(); }));
    $('.x', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { const r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close(); });
  }

  /* card tilt (Базовый) */
  $$('[data-tilt]').forEach(c => {
    c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--rx', ((.5 - (e.clientY - r.top) / r.height) * 7).toFixed(2) + 'deg'); c.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 7).toFixed(2) + 'deg'); });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  /* scroll scenes (Нейро) */
  const hero = $('[data-parallax]'), st = $('#statement-text'), grow = $('#grow');
  let words = [];
  if (st) { st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' '); words = $$('.w', st); }
  let tick = false;
  const upd = () => {
    tick = false; const H = innerHeight;
    if (hero) { const y = clamp(-hero.getBoundingClientRect().top, 0, H * 1.2); hero.style.setProperty('--py', (y * .18).toFixed(1) + 'px'); hero.style.setProperty('--fade', (1 - clamp(y / (H * .9)) * .55).toFixed(3)); }
    if (st) { const r = st.getBoundingClientRect(), p = clamp((H * .86 - r.top) / (H * .55)); words.forEach((w, i) => w.classList.toggle('lit', i / words.length < p)); }
    if (grow) { const r = grow.parentElement.getBoundingClientRect(), p = clamp(-r.top / (r.height - H)); const e = p * p * (3 - 2 * p); grow.style.setProperty('--gp', e.toFixed(4)); }
    const bar = $('#progress'); if (bar) bar.style.transform = `scaleX(${clamp(scrollY / (document.documentElement.scrollHeight - H)).toFixed(4)})`;
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); addEventListener('resize', upd); upd();
})();
