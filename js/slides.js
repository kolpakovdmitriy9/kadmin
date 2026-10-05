/* Реестр типов слайдов: рендер в HTML (1920×1080) + схема полей для редактора */
(function () {
  const KP = (window.KP = window.KP || {});

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nl = (s) => esc(s).replace(/\n/g, '<br>');
  const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const uid = () => Math.random().toString(36).slice(2, 9);

  // «2 400», «2,400.50», «1 453 500 ₽», «2400,5» → число
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    let s = String(v ?? '').replace(/[\s ₽руб.р]+$/gi, '').replace(/[\s ]/g, '');
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }
  const grp = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const rub = (n) => grp(n) + ' ₽';
  const plural = (n, f) => {
    n = Math.abs(Math.round(n)) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return f[2];
    if (n1 > 1 && n1 < 5) return f[1];
    if (n1 === 1) return f[0];
    return f[2];
  };

  // ---------- расчёты ----------
  const lineCost = (l) => (num(l.fixed) ? num(l.fixed) : num(l.rate) * num(l.hours));
  const tariffHours = (t) => (t.estimate || []).reduce((a, l) => a + num(l.hours), 0);
  const tariffTotal = (t) => ((t.estimate || []).length ? t.estimate.reduce((a, l) => a + lineCost(l), 0) : num(t.total));

  // «1/3», «40%», «33.3» → доля
  function share(s) {
    s = String(s || '').trim();
    if (s.includes('/')) {
      const [a, b] = s.split('/').map(num);
      return b ? a / b : 0;
    }
    return num(s.replace('%', '')) / 100;
  }
  function stageAmounts(total, stages) {
    let acc = 0;
    return stages.map((st, i) => {
      const v = i === stages.length - 1 ? total - acc : Math.round(total * st.share);
      acc += v;
      return v;
    });
  }
  const parseStages = (txt) => lines(txt).map((l) => {
    const [label, sh] = l.split('|').map((x) => x.trim());
    return { label, share: share(sh || '1/3') };
  });

  const logo = `<div class="logo"><svg width="46" height="38" viewBox="0 0 46 38"><path d="M0 4l9 28 7-17 7 17 7-28h-6l-3 13-5-13h-6l-5 13-3-13z" fill="#EE2D17"/></svg><span>webtex</span></div>`;

  const sub = (s, p) => String(s || '').replace(/\{client\}/g, p.client || '');

  // ---------- типы слайдов ----------
  // dark: тёмный фон; generated: размножается по вариантам/тарифам
  const TYPES = {
    cover: {
      label: 'Обложка',
      figma: '15',
      fields: [
        { key: 'title', label: 'Заголовок', type: 'textarea' },
        { key: 'subtitle', label: 'Подзаголовок ({client} — название клиента)', type: 'text' },
      ],
      render: ({ p, f }) => `<section class="slide dark cover">${logo}<h1>${nl(f.title)}</h1><p class="sub">${esc(sub(f.subtitle, p))}</p></section>`,
    },
    statement: {
      label: 'Тёмный слайд с крупной фразой',
      figma: '01, 02, 03, 06',
      fields: [
        { key: 'kicker', label: 'Красная часть', type: 'textarea' },
        { key: 'text', label: 'Белая часть', type: 'textarea' },
      ],
      render: ({ f }) => `<section class="slide dark statement">${logo}<h2><em>${nl(f.kicker)}</em>${f.kicker && f.text ? '<br>' : ''}${nl(f.text)}</h2></section>`,
    },
    about: {
      label: 'О компании (цифры + рейтинг)',
      figma: '08, 09',
      fields: [
        { key: 'title', label: 'Заголовок', type: 'textarea' },
        { key: 'text', label: 'Текст', type: 'textarea' },
        { key: 'stats', label: 'Цифры: «значение | подпись», по строке', type: 'textarea' },
        { key: 'rating', label: 'Рейтинг (пусто — скрыть)', type: 'text' },
        { key: 'ratingSource', label: 'Источник рейтинга', type: 'text' },
        { key: 'ratingCount', label: 'Число отзывов', type: 'text' },
      ],
      render: ({ f }) => {
        const stats = lines(f.stats).map((l) => { const [v, c] = l.split('|').map((x) => x.trim()); return `<div class="stat"><b>${esc(v)}</b><span>${esc(c)}</span></div>`; }).join('');
        const rating = f.rating ? `<div class="rating"><div class="r-num">${esc(f.rating)} <i>★</i></div><div class="r-src">${esc(f.ratingSource)}</div><div class="r-cnt">${esc(f.ratingCount)}</div></div>` : '';
        return `<section class="slide light about"><h2>${nl(f.title)}</h2><div class="about-grid"><div class="about-text"><p>${nl(f.text)}</p><div class="stats">${stats}</div></div>${rating}</div></section>`;
      },
    },
    text: {
      label: 'Заголовок + текст/список',
      figma: '07, 10, 11, 12, 24',
      fields: [
        { key: 'title', label: 'Заголовок', type: 'textarea' },
        { key: 'lead', label: 'Вводный текст', type: 'textarea' },
        { key: 'bullets', label: 'Пункты списка (по строке)', type: 'textarea' },
      ],
      render: ({ f }) => `<section class="slide light text"><h2>${nl(f.title)}</h2>${f.lead ? `<p class="lead">${nl(f.lead)}</p>` : ''}<ul>${lines(f.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul></section>`,
    },
    cards: {
      label: 'Карточки (сетка 3×2)',
      figma: '04, 05',
      fields: [
        { key: 'title', label: 'Заголовок', type: 'textarea' },
        { key: 'items', label: 'Карточки: «Заголовок | описание», по строке', type: 'textarea' },
      ],
      render: ({ f }) => `<section class="slide light cards"><h2>${nl(f.title)}</h2><div class="grid">${lines(f.items).map((l, i) => { const [t, d] = l.split('|').map((x) => x.trim()); return `<div class="card"><div class="ico">${i + 1}</div><h3>${esc(t)}</h3><p>${esc(d || '')}</p></div>`; }).join('')}</div></section>`,
    },
    table: {
      label: 'Таблица (произвольная)',
      figma: '13',
      fields: [
        { key: 'title', label: 'Заголовок', type: 'textarea' },
        { key: 'head', label: 'Шапка: колонки через |', type: 'text' },
        { key: 'rows', label: 'Строки: ячейки через |', type: 'textarea' },
      ],
      render: ({ f }) => {
        const head = String(f.head || '').split('|').map((x) => `<th>${esc(x.trim())}</th>`).join('');
        const rows = lines(f.rows).map((l) => `<tr>${l.split('|').map((x) => `<td>${esc(x.trim())}</td>`).join('')}</tr>`).join('');
        return `<section class="slide light table"><h2>${nl(f.title)}</h2><table class="tbl"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></section>`;
      },
    },
    compare: {
      label: 'Сравнение тарифов (галочки)',
      figma: '18',
      fields: [
        { key: 'title', label: 'Заголовок', type: 'textarea' },
        { key: 'rows', label: 'Строки: «Функция | + | – ...» — значения по порядку тарифов; + = ✓, – = нет, любой текст как есть', type: 'textarea' },
      ],
      render: ({ f, v }) => {
        const all = (v && v.tariffs) || [];
        const cols = all.map((t, i) => ({ t, i })).filter((c) => c.t.enabled);
        const head = cols.map((c) => `<th class="hot">${esc(c.t.name)}</th>`).join('');
        const rows = lines(f.rows).map((l) => {
          const cells = l.split('|').map((x) => x.trim());
          return `<tr><td>${esc(cells[0])}</td>${cols.map((c) => { const x = cells[c.i + 1] ?? ''; return `<td class="c">${x === '+' ? '<b class="ok">✓</b>' : x === '-' || x === '–' ? '<span class="no">—</span>' : esc(x)}</td>`; }).join('')}</tr>`;
        }).join('');
        return `<section class="slide light compare"><h2>${nl(f.title)}${v && v.cms ? `<span class="badge">${esc(v.cms)}</span>` : ''}</h2><table class="tbl"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></section>`;
      },
    },
    payment: {
      label: 'Порядок оплаты (авто: по вариантам CMS)',
      figma: '20, 37',
      generated: 'variant',
      fields: [
        { key: 'title', label: 'Заголовок', type: 'text' },
        { key: 'stages', label: 'Этапы: «Название | доля» (1/3, 40%…). Последний этап = остаток', type: 'textarea' },
        { key: 'installmentLabel', label: 'Подпись рассрочки (N — число месяцев)', type: 'text' },
      ],
      render: ({ f, v }) => {
        const ts = v.tariffs.filter((t) => t.enabled && tariffTotal(t) > 0);
        const stages = parseStages(f.stages);
        const head = ts.map((t) => `<th class="hot">${esc(t.name)}</th>`).join('');
        const sum = ts.map(() => `<th class="blk">Общая стоимость проекта</th>`).join('');
        const tot = ts.map((t) => `<td class="c big">${rub(tariffTotal(t))}</td>`).join('');
        const amounts = ts.map((t) => stageAmounts(tariffTotal(t), stages));
        const rows = stages.map((s, i) => `<tr><td class="lab">${esc(s.label)}</td>${amounts.map((a) => `<td class="c">${rub(a[i])}</td>`).join('')}</tr>`).join('');
        const inst = ts.filter((t) => num(t.months) > 0);
        const instBlock = inst.length
          ? `<table class="tbl inst"><thead><tr>${inst.map(() => `<th class="lab">Второй вид оплаты</th>`).join('')}</tr><tr>${inst.map((t) => `<th class="blk">${esc(t.name)}</th>`).join('')}</tr></thead><tbody><tr>${inst.map((t) => `<td class="hotcell"><span>${esc(String(f.installmentLabel || 'Рассрочка на N месяцев').replace('N', t.months))}</span><span class="pink">${rub(tariffTotal(t) / num(t.months))} / мес</span></td>`).join('')}</tr></tbody></table>`
          : '';
        return `<section class="slide light payment"><h2>${esc(f.title)}<span class="badge">${esc(v.cms)}</span></h2>
          <table class="tbl pay"><thead><tr><th rowspan="3" class="lab">Этап оплаты</th>${head}</tr><tr>${sum}</tr><tr>${tot}</tr></thead><tbody>${rows}</tbody></table>${instBlock}</section>`;
      },
    },
    estimate: {
      label: 'Смета (авто: по каждому тарифу с расчётом)',
      figma: '34–36, 40–42',
      generated: 'tariff',
      fields: [
        { key: 'title', label: 'Заголовок', type: 'text' },
        { key: 'packLabel', label: 'Плашка (T — название тарифа)', type: 'text' },
        { key: 'headers', label: 'Шапка колонок через |', type: 'text' },
      ],
      render: ({ f, v, t }) => {
        const L = t.estimate || [];
        const h = String(f.headers || 'Этап работ|Стоимость часа, ₽|Кол-во часов|Стоимость, ₽').split('|').map((x) => x.trim());
        const dense = L.length > 14 ? ' dense' : L.length > 11 ? ' mid' : '';
        const rows = L.map((l) => `<tr><td>${esc(l.name)}</td><td>${num(l.fixed) ? '' : grp(num(l.rate))}</td><td>${num(l.fixed) ? '' : num(l.hours)}</td><td>${grp(lineCost(l))}</td></tr>`).join('');
        const hrs = tariffHours(t);
        return `<section class="slide light estimate${dense}"><div class="e-head"><h2>${esc(f.title)}</h2><span class="pill">${esc(String(f.packLabel || 'пакет T').replace('T', t.name))}</span><span class="cms">${esc(v.cms)}</span></div>
          <table class="est"><thead><tr>${h.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
          <div class="e-total"><span>Итого</span><span>${hrs ? grp(hrs) + ' ' + plural(hrs, ['час', 'часа', 'часов']) : ''}</span><b>${rub(tariffTotal(t))}</b></div></section>`;
      },
    },
    contacts: {
      label: 'Контакты (финальный слайд)',
      figma: '14',
      fields: [
        { key: 'title', label: 'Заголовок', type: 'textarea' },
        { key: 'name', label: 'Менеджер', type: 'text' },
        { key: 'phone', label: 'Телефон', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'site', label: 'Сайт', type: 'text' },
      ],
      render: ({ f }) => `<section class="slide dark contacts">${logo}<h2>${nl(f.title)}</h2><div class="ct"><div>${esc(f.name)}</div><div>${esc(f.phone)}</div><div>${esc(f.email)}</div><div>${esc(f.site)}</div></div></section>`,
    },
  };

  /** Разворачивает слайды КП в итоговый список страниц для превью/PDF */
  function expand(p, includeDisabled) {
    const out = [];
    (p.slides || []).forEach((s) => {
      const T = TYPES[s.type];
      if (!T) return;
      if (!s.enabled && !includeDisabled) return;
      const base = { slide: s, type: T, f: s.fields || {}, p, off: !s.enabled };
      const vs = (p.variants || []).filter((v) => v.enabled || includeDisabled);
      if (T.generated === 'variant') {
        vs.forEach((v) => { if (v.tariffs.some((t) => t.enabled && tariffTotal(t) > 0) || includeDisabled) out.push({ ...base, key: s.id + ':' + v.id, v, off: base.off || !v.enabled }); });
      } else if (T.generated === 'tariff') {
        vs.forEach((v) => v.tariffs.forEach((t) => { if (((t.enabled && (t.estimate || []).length) || includeDisabled) && (t.estimate || []).length) out.push({ ...base, key: s.id + ':' + v.id + ':' + t.id, v, t, off: base.off || !v.enabled || !t.enabled }); }));
      } else if (s.type === 'compare') {
        const v = vs[0] || (p.variants || [])[0];
        out.push({ ...base, key: s.id, v });
      } else {
        out.push({ ...base, key: s.id });
      }
    });
    return out;
  }

  const renderItem = (it) => it.type.render({ p: it.p, f: it.f, v: it.v, t: it.t });

  Object.assign(KP, { TYPES, expand, renderItem, esc, lines, uid, num, rub, grp, tariffTotal, tariffHours, lineCost, stageAmounts, parseStages, plural });
})();
