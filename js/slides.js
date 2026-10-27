/* Движок слайдов. Статичные слайды — точные растры макета Figma (assets/*.jpg).
   Динамические (обложка, сравнение тарифов, оплата, сметы, доп. расходы) — HTML по измеренной геометрии макета. */
(function () {
  const KP = (window.KP = window.KP || {});

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const uid = () => Math.random().toString(36).slice(2, 9);

  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    let s = String(v ?? '').replace(/[\s ]/g, '').replace(/(руб\.?|р\.?|₽)+$/i, '');
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }
  const grp = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const rub = (n) => grp(n) + ' ₽';
  const hrsFmt = (h) => String(Math.round(h * 100) / 100).replace(".", ",");
  const plural = (n, f) => {
    n = Math.abs(Math.round(n)) % 100; const n1 = n % 10;
    if (n > 10 && n < 20) return f[2];
    if (n1 > 1 && n1 < 5) return f[1];
    if (n1 === 1) return f[0];
    return f[2];
  };
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  function dateRu(iso) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso || '';
    return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]} года`;
  }

  // ---------- расчёты ----------
  const lineCost = (l) => (num(l.fixed) ? num(l.fixed) : num(l.rate) * num(l.hours));
  const tariffRows = (t) => (t.rows || []).filter((l) => lineCost(l) > 0);
  const tariffHours = (t) => tariffRows(t).reduce((a, l) => a + num(l.hours), 0);
  const tariffTotal = (t) => (tariffRows(t).length ? tariffRows(t).reduce((a, l) => a + lineCost(l), 0) : num(t.total));

  // правила рассрочки: «300000:4, 500000:6, …, inf:12»; сумма ниже минимума — без рассрочки
  const DEFAULT_RULES = '300000:4, 500000:6, 800000:8, 1200000:10, inf:12';
  function parseRules(txt) {
    return String(txt || DEFAULT_RULES).split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
      const [a, b] = x.split(':'); return [/inf|∞/i.test(a) ? Infinity : num(a), num(b)];
    }).sort((p, q) => p[0] - q[0]);
  }
  function autoMonths(total) {
    const s = (KP.store && KP.store.settings) || {};
    if (total < num(s.installMin ?? 150000)) return 0;
    const r = parseRules(s.installRules).find(([lim]) => total <= lim);
    return r ? r[1] : 0;
  }
  const tariffMonths = (t) => (t.months === '' || t.months == null ? autoMonths(tariffTotal(t)) : num(t.months));

  // ---------- профили сравнения тарифов (из макета) ----------
  const CHECK = '✓';
  const PROFILES = {
    'Нейро': ['—', 'Нейро', '—', '—', '—', '—', 'Junior/Middle', CHECK, CHECK],
    'Базовый': [CHECK, 'Оптимальный', CHECK, '2 пакета', 'По запросу', CHECK, 'Middle/Senior', CHECK, CHECK],
    'Премиум': ['Расширенная', 'Премиальный', CHECK, '3 пакета', 'По запросу', CHECK, 'Middle/Senior', CHECK, CHECK],
  };
  const COMPARE_ROWS = [
    ['Аналитика целевой аудитории', 64], ['Дизайн', 64], ['Анимации', 64], ['Пакеты правок', 64], ['SEO-проектирование', 64],
    ['Контроль дизайна и кода senior специалистов', 88], ['Уровень команды', 64], ['Базовая SEO-оптимизация', 64], ['Гарантия 12 месяцев', 64],
  ];
  const ALIAS = { 'база': 'Базовый', 'базовый': 'Базовый', 'оптимальный': 'Базовый', 'премиум': 'Премиум', 'премиальный': 'Премиум', 'нейро': 'Нейро' };
  const normTariffName = (n) => { const k = String(n || '').trim().toLowerCase().replace(/ё/g, 'е'); return k === 'база' ? 'Базовый' : String(n || '').trim(); };
  const profileFor = (name) => ALIAS[String(name || '').trim().toLowerCase()] || 'Базовый';
  // порядок столбцов везде: Нейро → Базовый → Премиум (по типу тарифа из выпадашки), остальное — после
  const ORDER = ['Нейро', 'Базовый', 'Премиум'];
  const rank = (t) => { const i = ORDER.indexOf(t.profile || profileFor(t.name)); return i < 0 ? ORDER.length : i; };
  const sortTariffs = (v) => { if (v && v.tariffs) v.tariffs = v.tariffs.map((t, i) => [t, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map((x) => x[0]); };

  const PAY_STAGES = ['Предоплата', 'По факту готовности дизайна', 'По факту готовности сайта'];
  const payStages = (p) => (p && p.payStages && p.payStages.length ? p.payStages : PAY_STAGES);
  /** Сумма по каждому этапу оплаты тарифа. t.pay[i]: пусто — авто (остаток поровну), «-» — прочерк,
      «30%» — доля от итога, число — фиксированная сумма, любой другой текст выводится как есть. */
  const tariffDiscount = (t) => { const d = num(t.discount); return t.discountOn && d > 0 && d < 100 ? d : 0; };
  const discountedTotal = (t) => Math.round(tariffTotal(t) * (1 - tariffDiscount(t) / 100));
  function payPlan(t, stages) {
    const tot = discountedTotal(t);   // этапы считаются от цены со скидкой; рассрочка — от полной (как в макете)
    const cells = stages.map((_, i) => String(((t.pay || [])[i]) ?? '').trim());
    const out = cells.map((c) => {
      if (!c) return { kind: 'auto' };
      if (/^[-–—]+$/.test(c)) return { kind: 'text', text: '-' };
      const pc = c.match(/^(\d+(?:[.,]\d+)?)\s*%$/);
      if (pc) return { kind: 'sum', value: Math.round((tot * parseFloat(pc[1].replace(',', '.'))) / 100) };
      const n = num(c);
      if (n > 0 && /^[\d\s .,]+(?:₽|р\.?|руб\.?)?$/i.test(c)) return { kind: 'sum', value: n };
      return { kind: 'text', text: c };
    });
    const autos = out.filter((o) => o.kind === 'auto');
    const rest = Math.max(0, tot - out.reduce((a, o) => a + (o.kind === 'sum' ? o.value : 0), 0));
    const part = autos.length ? Math.round(rest / autos.length) : 0;
    autos.forEach((o, i) => { o.kind = 'sum'; o.value = i === autos.length - 1 ? rest - part * (autos.length - 1) : part; o.auto = true; });
    return out.map((o) => (o.kind === 'sum' ? { ...o, text: rub(o.value) } : o));
  }
  // ---------- хелперы разметки ----------
  const A = (x, y, w, h, st, inner, cls) => `<div class="abs ${cls || ''}" style="left:${x}px;top:${y}px;${w != null ? 'width:' + w + 'px;' : ''}${h != null ? 'height:' + h + 'px;' : ''}${st || ''}">${inner ?? ''}</div>`;
  const checkSvg = `<svg width="28" height="28" viewBox="0 0 28 28"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5A47"/><stop offset="1" stop-color="#E5200B"/></linearGradient></defs><circle cx="14" cy="14" r="14" fill="url(#g)"/><path d="M8.5 14.4l3.8 3.7 7.3-7.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const GRAD = 'background:linear-gradient(135deg,#FF5A47,#E5200B);color:#fff;';
  const cell = (x, y, w, h, st, inner) => A(x, y, w, h, `border:1px solid #d9d9d9;border-radius:6px;box-sizing:border-box;display:flex;align-items:center;${st || ''}`, inner);
  // Логотип (кириллица) на тёмных слайдах — слева, по левому краю текста
  const LOGO_ON = ['cover', 'benefits', 'project', 'statement', 'results', 'contacts'];
  const logo = () => `<img class="abs" src="assets/logo.svg" style="left:120px;top:96px;width:193px;height:37px">`;
  // Слайды — JPEG 3840×2160: в PDF вставляется как есть, без пересжатия (WebP Chrome пересжимает)
  const wrap = (inner, bg) => {
    return `<section class="slide"${bg ? ` style="background:url(${bg}) 0 0/1920px 1080px"` : ''}>${inner}</section>`;
  };

  // ---------- рендеры ----------
  function renderCover(it) {
    const { p } = it;
    const d = dateRu(p.validUntil);
    return wrap(
      A(120, 526, 1200, 50, 'font-size:30px;line-height:50px;color:#fff;', 'на разработку сайта для компании ' + esc(p.client)) +
      (d ? A(1288, 946, 560, 30, 'font-size:20px;line-height:30px;color:#fff;', 'до ' + esc(d)) : '') + logo(),
      'assets/cover.jpg');
  }
  // «Сроки и этапы»: срок реализации задаётся вручную цифрами (от / до, месяцев)
  const termText = (f) => {
    const a = parseInt(f && f.termFrom, 10), b = parseInt(f && f.termTo, 10);
    const from = a > 0 ? a : 3, to = b > 0 ? b : (f && f.termTo === '' ? from : 4);
    return from === to ? from + ' ' + plural(from, ['месяц', 'месяца', 'месяцев']) + '*' : from + '-' + to + ' ' + plural(to, ['месяц', 'месяца', 'месяцев']) + '*';
  };
  const renderStatic = (it) => it.asset === 'timeline'
    // «Срок реализации» и срок — одной строкой, одним шрифтом и кеглем, по общей базовой линии
    ? wrap(A(700, 101, 1092.5, 48, 'font-size:48px;line-height:48px;font-weight:500;color:#151A27;text-align:right;white-space:nowrap;', 'Срок реализации<span style="color:#EE3824;margin-left:60px">' + esc(termText(it.slide && it.slide.fields)) + '</span>'), 'assets/timeline_base.jpg')
    : wrap(LOGO_ON.includes(it.asset) ? logo() : '', 'assets/' + it.asset + '.jpg');

  function renderCompare(it) {
    const { v } = it;
    const ts = v.tariffs.filter((t) => t.enabled && t.inCompare);
    // плашку CMS («Битрикс» и т. п.) на слайдах не показываем
    const x0 = 251, y0 = 173, W = 344, G = 4;
    let h = `<img class="abs" src="assets/t_compare_a.png" style="left:241px;top:60px;width:684px;height:75px">`;
    h += cell(x0, y0, W, 64, 'background:#1a1a1a;color:#fff;font-size:18px;padding-left:20px;border-color:#1a1a1a;', 'Критерий сравнения');
    ts.forEach((t, i) => (h += A(x0 + (W + G) * (i + 1), y0, W, 64, `${GRAD}border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:500;`, esc(t.name))));
    let y = y0 + 68;
    COMPARE_ROWS.forEach(([label, rh], ri) => {
      h += cell(x0, y, W, rh, 'background:#f5f5f5;font-size:18px;padding:0 20px;line-height:24px;', esc(label));
      ts.forEach((t, i) => {
        const val = (PROFILES[t.profile] || PROFILES['Базовый'])[ri];
        h += cell(x0 + (W + G) * (i + 1), y, W, rh, 'background:#fff;justify-content:center;font-size:18px;', val === CHECK ? checkSvg : esc(val));
      });
      y += rh + G;
    });
    const red = 'border:1px solid #EE3824;color:#EE3824;background:#fff;';
    h += cell(x0, y, W, 64, red + 'font-size:18px;padding-left:20px;', 'Стоимость');
    ts.forEach((t, i) => (h += cell(x0 + (W + G) * (i + 1), y, W, 64, red + 'justify-content:center;font-size:24px;font-weight:500;', rub(tariffTotal(t)))));
    return wrap(h);
  }

  // ---------- «Пакеты разработки сайтов»: колонка на каждый включённый тариф (Нейро / Базовый / Премиум) ----------
  const PACKAGES = {
    'Нейро': { title: 'Пакет «Нейро»', lead: 'Быстрый и бюджетный запуск сайта с помощью ИИ.',
      text: 'На основе информации о компании, услугах и ваших пожеланий мы создаём готовый сайт с простой современной структурой и аккуратным дизайном.',
      items: ['одна готовая концепция;', 'простой современный дизайн;', 'создание сайта с помощью ИИ;', 'адаптация под мобильные устройства;', 'система управления контентом.'],
      note: ['Важно:', 'бесплатные правки после создания концепции не предусмотрены.'],
      fit: 'важны минимальный бюджет и быстрый запуск.' },
    'Базовый': { title: 'Пакет «Базовый дизайн»', lead: 'Индивидуальная разработка сайта нашей командой без сложной дизайнерской проработки.',
      text: 'Мы прорабатываем структуру, содержание, страницы и функциональность под задачи бизнеса. Дизайн остаётся лаконичным и современным, с использованием фирменных цветов.',
      items: ['индивидуальная структура сайта;', 'разработка всех необходимых страниц;', 'простой современный дизайн;', 'фирменные цвета и стилистика;', 'необходимый функционал.'],
      note: ['Без:', 'сложной графики, фирменных паттернов, нестандартных визуальных решений и сложных анимаций.'],
      fit: 'нужен полноценный индивидуальный сайт, не требуется сложный дизайн и выраженное визуальное отличие от конкурентов.' },
    'Премиум': { title: 'Пакет «Премиум-дизайн»', lead: 'Индивидуальный сайт с полной дизайнерской проработкой.',
      text: 'Разрабатываем уникальную визуальную концепцию, детально прорабатываем страницы, графику, мобильные версии, анимацию и нестандартные элементы интерфейса.',
      items: ['индивидуальная структура и прототипы;', 'уникальная дизайн-концепция;', 'детальная проработка страниц;', 'авторская графика и визуальные решения;', 'анимации;', 'проработка мобильных версий;', 'несколько этапов согласования;', 'возможность реализации сложного функционала.'],
      fit: 'сайт должен работать на имидж бренда и заметно выделяться среди конкурентов.' },
  };
  // какие пакеты показывать: типы включённых тарифов во всех включённых CMS, по порядку Нейро → Базовый → Премиум
  const packageKinds = (p) => ORDER.filter((k) => (p.variants || []).some((v) => v.enabled !== false && v.tariffs.some((t) => t.enabled && (t.profile || profileFor(t.name)) === k)));
  function renderPackages(it) {
    const kinds = packageKinds(it.p);
    const L = 123, R = 1797, G = 26, n = Math.max(kinds.length, 1), w = (R - L - G * (n - 1)) / n;
    let h = A(L, 92, 1100, 80, 'font-size:64px;line-height:80px;font-weight:500;letter-spacing:-0.5px;white-space:nowrap;', 'Пакеты разработки сайтов');
    if (!kinds.length) h += A(L, 240, R - L, 200, 'border:2px dashed #e53935;border-radius:16px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:30px;color:#e53935;', 'Нет включённых тарифов Нейро / Базовый / Премиум.<br><small style="font-size:22px">В PDF эта страница не попадёт.</small>');
    kinds.forEach((k, i) => {
      const P = PACKAGES[k], x = L + (w + G) * i;
      h += A(x, 216, w, 62, GRAD + 'display:flex;align-items:center;padding-left:30px;font-size:26px;', esc(P.title));
      h += A(x, 300, n === 1 ? Math.min(w, 900) : w - 10, null, 'font-size:18px;line-height:26px;color:#151515;',
        `<p style="margin:0 0 6px;font-weight:600">${esc(P.lead)}</p><p style="margin:0">${esc(P.text)}</p>` +
        `<div style="font-size:30px;line-height:36px;font-weight:500;margin:34px 0 14px">Что входит:</div>` +
        `<ul style="margin:0;padding-left:26px;line-height:28px">${P.items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` +
        (P.note ? `<div style="font-size:30px;line-height:36px;font-weight:500;margin:34px 0 12px">${esc(P.note[0])}</div><p style="margin:0;line-height:28px;max-width:470px">${esc(P.note[1])}</p>` : '') +
        `<p style="margin:34px 0 0;font-weight:600;max-width:470px">Подходит, если: ${esc(P.fit)}</p>`);
    });
    // кнопка-капсула «Показать примеры» справа на уровне заголовка (ссылка кликабельна и в PDF)
    const url = String((KP.store && KP.store.settings && KP.store.settings.examplesUrl) || '').trim();
    if (url && kinds.length && (it.f || {}).examples !== false) {
      const right = R;
      h += `<a class="abs" href="${esc(url)}" target="_blank" rel="noopener" style="left:${right}px;top:67px;transform:translateX(-100%);height:60px;${GRAD}border-radius:999px;display:flex;align-items:center;gap:16px;padding:0 8px 0 32px;font-size:22px;font-weight:500;text-decoration:none;white-space:nowrap">Показать примеры<span style="width:44px;height:44px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M4 10h11M10.5 5l5 5-5 5" fill="none" stroke="#E5200B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>`;
    }
    return wrap(h);
  }

  function renderPayment(it) {
    const { v, f } = it;
    const ts = v.tariffs.filter((t) => t.enabled && t.inPayment && tariffTotal(t) > 0);
    let h = `<img class="abs" src="assets/t_payment.png" style="left:130px;top:80px;width:415px;height:65px">`;
    const B = 'border:1px solid #e2e2e2;box-sizing:border-box;';
    const x0 = 139, lw = 422, cw = 380;
    // в PDF такая страница не попадает; в редакторе подсказываем, почему пусто
    if (!ts.length) return h + A(x0, 179, 1500, 200, 'border:2px dashed #e53935;border-radius:16px;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;font-size:30px;color:#e53935;', 'Нет тарифов для этой страницы.<br>Во вкладке «Тарифы и цены» включите тариф и переключатель «Оплата».<br><small style="font-size:22px">В PDF эта страница не попадёт.</small>');
    h += A(x0, 179, lw, 232, B + 'background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:22px;', 'Этап оплаты');
    ts.forEach((t, i) => {
      const x = x0 + lw + cw * i;
      h += A(x, 179, cw, 78, B + GRAD + 'display:flex;align-items:center;justify-content:center;font-size:27px;font-weight:500;', esc(t.name));
      h += A(x, 257, cw, 78, B + 'background:#161616;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;', 'Общая стоимость проекта');
      h += A(x, 335, cw, 76, B + 'background:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;', rub(tariffTotal(t)));
    });
    const stages = payStages(it.p);
    const plans = ts.map((t) => payPlan(t, stages));
    let y0 = 411;
    const ds = ts.map(tariffDiscount);
    if (ds.some((d) => d > 0)) {
      const uniq = [...new Set(ds.filter((d) => d > 0))];
      h += A(x0, y0, lw, 77, B + GRAD + 'display:flex;align-items:center;padding-left:24px;font-size:22px;', 'Стоимость со скидкой' + (uniq.length === 1 ? ' ' + String(uniq[0]).replace('.', ',') + '%' : ''));
      ts.forEach((t, i) => { h += A(x0 + lw + cw * i, y0, cw, 77, B + 'background:#ffe5e2;display:flex;align-items:center;justify-content:center;font-size:22px;', ds[i] ? rub(discountedTotal(t)) : '-'); });
      y0 += 77;
    }
    stages.forEach((label, si) => {
      const y = y0 + 77 * si;
      h += A(x0, y, lw, 77, B + 'background:#f5f5f5;display:flex;align-items:center;padding-left:24px;font-size:22px;', esc(label));
      ts.forEach((t, i) => {
        h += A(x0 + lw + cw * i, y, cw, 77, B + 'background:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;', esc(plans[i][si].text));
      });
    });
    const inst = ts.filter((t) => tariffMonths(t) > 0);
    const yi = Math.max(808, y0 + 77 * stages.length + 60);
    inst.forEach((t, i) => {
      const x = 140 + 559 * i, m = tariffMonths(t);
      h += A(x, yi, 559, 78, B + 'background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:22px;', 'Второй вид оплаты');
      h += A(x, yi + 78, 559, 63, B + 'background:#161616;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;', esc(t.name));
      h += A(x, yi + 140, 344, 64, B + GRAD + 'display:flex;align-items:center;padding-left:20px;font-size:18px;', `Рассрочка на ${m} ${plural(m, ['месяц', 'месяца', 'месяцев'])}`);
      h += A(x + 344, yi + 140, 215, 64, B + 'background:#ffe5e2;display:flex;align-items:center;justify-content:center;font-size:18px;', rub(tariffTotal(t) / m) + ' / мес');
    });
    return wrap(h);
  }

  function renderEstimate(it) {
    const { v, t, f } = it;
    const rows = tariffRows(t);
    const n = rows.length, pitch = Math.min(42, Math.floor(660 / Math.max(n, 1)));
    // поля как на остальных слайдах: текст от x=123 до 1800, заголовок на y≈104 (раньше 292…1630, y≈128)
    const DX = -169, DY = -24, K = (1800 - 123) / (1630 - 292);
    const X = (x) => Math.round(123 + (x - 292) * K), Wd = (w) => Math.round(w * K);
    let h = `<img class="abs" src="assets/t_estimate.png" style="left:${280 + DX}px;top:${105 + DY}px;width:175px;height:70px">`;
    h += A(484 + DX, 124 + DY, null, 52, 'background:#EE3824;color:#fff;border-radius:26px;padding:0 24px;display:flex;align-items:center;font-size:20px;white-space:nowrap;', 'пакет ' + esc(t.name));
    const hd = 'font-size:20px;font-weight:500;line-height:42px;padding-top:2px;';
    h += A(X(290), 223 + DY, Wd(600), 42, hd, 'Этап работ') + A(X(979), 223 + DY, Wd(240), 42, hd, 'Стоимость часа, ₽') + A(X(1232), 223 + DY, Wd(180), 42, hd, 'Кол-во часов') + A(X(1431), 223 + DY, Wd(200), 42, hd, 'Стоимость, ₽');
    rows.forEach((l, i) => {
      const y = 276 + DY + pitch * i, fx = num(l.fixed) > 0;
      const st = `font-size:18px;line-height:${pitch}px;`;
      h += A(X(290), y, X(1630) - X(290), pitch, `border-bottom:1px solid #f0f0f0;box-sizing:border-box;`, '');
      h += A(X(290), y + 2, Wd(660), pitch, st, esc(l.name)) + A(X(979), y + 2, Wd(240), pitch, st, fx ? '' : grp(num(l.rate))) + A(X(1232), y + 2, Wd(190), pitch, st, fx ? '' : hrsFmt(num(l.hours))) + A(X(1431), y + 2, Wd(200), pitch, st, grp(lineCost(l)));
    });
    const yb = 275 + DY + pitch * n + 10, hrs = tariffHours(t);
    h += A(X(290), yb, 300, 44, 'font-size:22px;line-height:44px;color:#EE3824;', 'Итого');
    h += A(X(1296) - 296, yb, 296, 44, 'font-size:28px;line-height:44px;color:#EE3824;text-align:right;', hrs ? `${grp(hrs)} ${plural(hrs, ['час', 'часа', 'часов'])}` : '');
    h += A(X(1517) - 200, yb, 200, 44, 'font-size:28px;line-height:44px;color:#EE3824;text-align:right;', rub(tariffTotal(t)));
    return wrap(h);
  }

  function renderExtras(it) {
    const { p } = it;
    const list = (p.extras || []).filter((e) => e.name);
    let h = `<img class="abs" src="assets/t_extra.png" style="left:110px;top:105px;width:640px;height:70px">`;
    const B = 'border:1px solid #d6d6d6;box-sizing:border-box;display:flex;align-items:center;font-size:18px;';
    h += A(120, 243, 344, 64, B + 'background:#EE3824;color:#fff;padding-left:20px;', 'Услуга') + A(464, 243, 460, 64, B + 'background:#161616;color:#fff;justify-content:center;', 'Стоимость');
    list.forEach((e, i) => {
      const y = 307 + 64 * i;
      h += A(120, y, 344, 64, B + 'background:#f5f5f5;padding-left:20px;', esc(e.name)) + A(464, y, 460, 64, B + 'background:#fff;justify-content:center;', esc(e.price));
    });
    return wrap(h);
  }

  // ---------- реестр типов слайдов (для списка и форм) ----------
  const STATIC = {
    about: ['О компании: команда, №1 в Пензе', '08'], kadema: ['Вебтех — часть агентства Kadema Digital', '09'], statement: ['Не просто код и дизайн', '01'],
    why: ['Почему именно Вебтех', '10'], tech: ['Технологии и сервисы', '11'], mistakes: ['Распространённые ошибки при разработке', '12'],
    benefits: ['Основные преимущества наших проектов', '03'], constructor: ['Конструктор или индивидуальная разработка', '13'], project: ['О проекте: задача', '02'],
    timeline: ['Сроки и этапы', '04'], team: ['Команда проекта', '05'], packages: ['Пакеты: Базовый / Премиум дизайн', '37'],
    results: ['Работаем на результат', '06'], support: ['Комплексная техническая поддержка', '07'], contacts: ['Контакты', '14'],
  };
  const TYPES = {
    cover: { label: 'Обложка (клиент, срок действия)', figma: '15' },
    static: { label: 'Статичный слайд' },
    variants: { label: 'Блок по CMS: сравнение, оплата, сметы', figma: '18, 20, 34–36, 40–42', generated: true },
    extras: { label: 'Дополнительные расходы', figma: '24' },
  };

  /** Разворачивает КП в список страниц {key,kind,...}; includeDisabled — для списка слева */
  function expand(p, includeDisabled) {
    (p.variants || []).forEach(sortTariffs);
    if ((p.variants || []).length === 1) p.variants[0].enabled = true;   // единственную CMS выключить нельзя — иначе пропадают все её страницы
    const out = [];
    const push = (o) => out.push(Object.assign({ p }, o));
    (p.slides || []).forEach((s) => {
      const base = { slide: s, off: !s.enabled };
      if (!s.enabled && !includeDisabled) return;
      if (s.type === 'cover') push({ ...base, key: s.id, kind: 'cover', label: 'Обложка' });
      else if (s.type === 'static') push({ ...base, key: s.id, kind: 'static', asset: s.asset, label: STATIC[s.asset] ? STATIC[s.asset][0] : s.asset });
      else if (s.type === 'extras') push({ ...base, key: s.id, kind: 'extras', label: 'Дополнительные расходы' });
      else if (s.type === 'variants') {
        const f = s.fields || {};
        (p.variants || []).forEach((v, vi) => {
          if (!v.enabled && !includeDisabled) return;
          const vb = { ...base, off: base.off || !v.enabled, v, f };
          const on = (arr) => v.tariffs.filter((t) => t.enabled && arr(t));
          if (f.compare !== false && (on((t) => t.inCompare).length || includeDisabled)) push({ ...vb, key: `${s.id}:${v.id}:cmp`, kind: 'compare', label: `Сравнение · ${v.cms}` });
          if (f.packages !== false && vi === 0 && (packageKinds(p).length || includeDisabled)) push({ ...vb, off: !packageKinds(p).length, key: `${s.id}:${v.id}:pk`, kind: 'packages', label: 'Пакеты: ' + (packageKinds(p).join(' / ') || 'нет тарифов') });
          if (f.payment !== false && (on((t) => t.inPayment && tariffTotal(t) > 0).length || includeDisabled)) push({ ...vb, key: `${s.id}:${v.id}:pay`, kind: 'payment', label: `Порядок оплаты · ${v.cms}` });
          if (f.estimate !== false) v.tariffs.forEach((t) => { if ((t.estimate && tariffRows(t).length && (t.enabled || includeDisabled))) push({ ...vb, off: vb.off || !t.enabled, key: `${s.id}:${v.id}:${t.id}`, kind: 'estimate', t, label: `Смета · ${v.cms} · ${t.name}` }); });
        });
      }
    });
    return out;
  }

  const RENDER = { cover: renderCover, static: renderStatic, compare: renderCompare, packages: renderPackages, payment: renderPayment, estimate: renderEstimate, extras: renderExtras };
  // версия картинок: меняйте при обновлении файлов в assets/, чтобы браузер не брал старые из кэша
  const ASSET_V = '20261027d';
  const renderItem = (it) => (RENDER[it.kind] ? RENDER[it.kind](it) : '').replace(/assets\/([\w.-]+\.(?:webp|png|jpg|svg))/g, `assets/$1?v=${ASSET_V}`);

  Object.assign(KP, { termText, sortTariffs, payStages, payPlan, tariffDiscount, discountedTotal, TYPES, STATIC, PROFILES, expand, renderItem, esc, lines, uid, num, rub, grp, tariffTotal, tariffHours, tariffRows, tariffMonths, lineCost, plural, normTariffName, profileFor, dateRu, DEFAULT_RULES, autoMonths });
})();
