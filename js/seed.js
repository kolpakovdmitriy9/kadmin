/* Шаблон КП (порядок слайдов = макет Figma) и пример КП «Абашев» с реальными цифрами из макета */
(function () {
  const KP = (window.KP = window.KP || {});
  const uid = () => Math.random().toString(36).slice(2, 9);
  const SAMPLE = {"wp_base": [{"name": "Интервьюирование клиента", "rate": 2400, "hours": 2, "fixed": ""}, {"name": "Анализ конкурентов и целевой аудитории", "rate": 2600, "hours": 6, "fixed": ""}, {"name": "Прототип сайта", "rate": 2600, "hours": 30, "fixed": ""}, {"name": "Дизайн 3-х версий сайта: desktop, tablet и mobile", "rate": 2600, "hours": 50, "fixed": ""}, {"name": "Техническое задание", "rate": 2500, "hours": 20, "fixed": ""}, {"name": "Верстка 3-х версий сайта: tablet, desktop, mobile", "rate": 2700, "hours": 75, "fixed": ""}, {"name": "Программирование сайта", "rate": 2700, "hours": 145, "fixed": ""}, {"name": "Наполнение сайта контентом", "rate": 2400, "hours": 40, "fixed": ""}, {"name": "Настройка сервера", "rate": 2700, "hours": 3, "fixed": ""}, {"name": "Менеджмент проекта", "rate": 2500, "hours": 75, "fixed": ""}, {"name": "Тестирование и стабилизация", "rate": 2700, "hours": 20, "fixed": ""}, {"name": "Базовая SEO-оптимизация", "rate": "", "hours": "", "fixed": 30000}], "wp_prem": [{"name": "Интервьюирование клиента", "rate": 2400, "hours": 2, "fixed": ""}, {"name": "Анализ конкурентов и целевой аудитории", "rate": 2600, "hours": 10, "fixed": ""}, {"name": "Прототип сайта", "rate": 2600, "hours": 40, "fixed": ""}, {"name": "Дизайн 3-х версий сайта: desktop, tablet и mobile", "rate": 2600, "hours": 85, "fixed": ""}, {"name": "Техническое задание", "rate": 2500, "hours": 28, "fixed": ""}, {"name": "Верстка 3-х версий сайта: tablet, desktop, mobile", "rate": 2700, "hours": 105, "fixed": ""}, {"name": "Программирование сайта", "rate": 2700, "hours": 160, "fixed": ""}, {"name": "Наполнение сайта контентом", "rate": 2400, "hours": 45, "fixed": ""}, {"name": "Настройка сервера", "rate": 2700, "hours": 3, "fixed": ""}, {"name": "Менеджмент проекта", "rate": 2500, "hours": 95, "fixed": ""}, {"name": "Тестирование и стабилизация", "rate": 2700, "hours": 25, "fixed": ""}, {"name": "Базовая SEO-оптимизация", "rate": "", "hours": "", "fixed": 30000}], "bx_base": [{"name": "Интервьюирование клиента", "rate": 2400, "hours": 2, "fixed": ""}, {"name": "Анализ конкурентов и целевой аудитории", "rate": 2600, "hours": 6, "fixed": ""}, {"name": "Прототип сайта", "rate": 2600, "hours": 30, "fixed": ""}, {"name": "Дизайн 3-х версий сайта: desktop, tablet и mobile", "rate": 2600, "hours": 50, "fixed": ""}, {"name": "Техническое задание", "rate": 2500, "hours": 20, "fixed": ""}, {"name": "Верстка 3-х версий сайта: tablet, desktop, mobile", "rate": 2700, "hours": 85, "fixed": ""}, {"name": "Программирование сайта", "rate": 2700, "hours": 200, "fixed": ""}, {"name": "Наполнение сайта контентом", "rate": 2400, "hours": 40, "fixed": ""}, {"name": "Настройка сервера", "rate": 2700, "hours": 3, "fixed": ""}, {"name": "Менеджмент проекта", "rate": 2500, "hours": 87, "fixed": ""}, {"name": "Тестирование и стабилизация", "rate": 2700, "hours": 20, "fixed": ""}, {"name": "Базовая SEO-оптимизация", "rate": "", "hours": "", "fixed": 30000}], "bx_prem": [{"name": "Интервьюирование клиента", "rate": 2400, "hours": 2, "fixed": ""}, {"name": "Анализ конкурентов и целевой аудитории", "rate": 2600, "hours": 10, "fixed": ""}, {"name": "Прототип сайта", "rate": 2600, "hours": 40, "fixed": ""}, {"name": "Дизайн 3-х версий сайта: desktop, tablet и mobile", "rate": 2600, "hours": 85, "fixed": ""}, {"name": "Техническое задание", "rate": 2500, "hours": 28, "fixed": ""}, {"name": "Верстка 3-х версий сайта: tablet, desktop, mobile", "rate": 2700, "hours": 115, "fixed": ""}, {"name": "Программирование сайта", "rate": 2700, "hours": 220, "fixed": ""}, {"name": "Наполнение сайта контентом", "rate": 2400, "hours": 45, "fixed": ""}, {"name": "Настройка сервера", "rate": 2700, "hours": 3, "fixed": ""}, {"name": "Менеджмент проекта", "rate": 2500, "hours": 110, "fixed": ""}, {"name": "Тестирование и стабилизация", "rate": 2700, "hours": 25, "fixed": ""}, {"name": "Базовая SEO-оптимизация", "rate": "", "hours": "", "fixed": 30000}]};
  const EXTRAS = [
    { name: 'Домен', price: 'от 200 ₽/год' }, { name: 'Хостинг', price: '4 000 ₽/год' }, { name: 'SSL-сертификат', price: '2 100 ₽/год' },
    { name: 'Обработчик заявок', price: '9 500 ₽/год' }, { name: 'Мониторинг', price: '3 000 ₽/год' }, { name: 'Генератор клиентов', price: '7 400 ₽/год' },
  ];
  const ST = (asset, enabled = true) => ({ id: uid(), type: 'static', asset, enabled, fields: {} });

  function slides() {
    return [
      { id: uid(), type: 'cover', enabled: true, fields: {} },
      ST('about'), ST('kadema'), ST('statement'), ST('why'), ST('tech'), ST('mistakes'), ST('benefits'), ST('constructor'), ST('project'), ST('timeline'), ST('team'),
      { id: uid(), type: 'variants', enabled: true, fields: { compare: true, packages: true, payment: true, estimate: true } },
      { id: uid(), type: 'extras', enabled: true, fields: {} },
      ST('results'), ST('support'), ST('contacts'),
    ];
  }
  const rows = (arr) => arr.map((r) => ({ id: uid(), name: r.name, rate: r.rate, hours: r.hours, fixed: r.fixed }));
  const T = (name, o = {}) => Object.assign({ id: uid(), name, profile: KP.profileFor(name), enabled: true, inCompare: true, inPayment: true, estimate: true, months: '', total: '', rows: [] }, o);
  const defaultVariant = (cms) => ({ id: uid(), cms, enabled: true, sheetTab: '', tariffs: [T('Базовый'), T('Премиум')] });

  function inDays(n) { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); }

  KP.newProposal = function (client, from) {
    const now = new Date().toISOString();
    const p = from ? JSON.parse(JSON.stringify(from)) : { slides: slides(), variants: [defaultVariant('Битрикс')], extras: EXTRAS.map((e) => ({ ...e })) };
    p.slides.forEach((s) => (s.id = uid()));
    p.variants.forEach((v) => { v.id = uid(); v.tariffs.forEach((t) => { t.id = uid(); (t.rows || []).forEach((l) => (l.id = uid())); }); });
    return Object.assign(p, { id: uid(), client: client || 'Новый клиент', sheetTab: client || '', validUntil: inDays(14), syncEnables: true, createdAt: now, updatedAt: now });
  };
  KP.templateDoc = function () {
    return { id: '__template__', client: 'ШАБЛОН (копируется в каждое новое КП)', sheetTab: '', syncEnables: false, validUntil: inDays(14), slides: slides(), variants: [defaultVariant('Битрикс')], extras: EXTRAS.map((e) => ({ ...e })), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  };
  KP.samplePage = function () {
    const p = KP.newProposal('Абашев', null);
    p.variants = [
      { id: uid(), cms: 'WordPress', enabled: true, sheetTab: '', compareBadge: false, tariffs: [
        T('Нейро', { inPayment: false, estimate: false, total: 1248000 }),
        T('Базовый', { rows: rows(SAMPLE.wp_base) }), T('Премиум', { rows: rows(SAMPLE.wp_prem) }) ] },
      { id: uid(), cms: 'Битрикс', enabled: true, sheetTab: '', tariffs: [
        T('Базовый', { rows: rows(SAMPLE.bx_base) }), T('Премиум', { rows: rows(SAMPLE.bx_prem) }) ] },
    ];
    p.validUntil = '2026-08-31';
    return p;
  };
})();
