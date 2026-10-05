/* Шаблон КП (порядок слайдов повторяет Figma) и пример КП с реальными цифрами из макета */
(function () {
  const KP = (window.KP = window.KP || {});
  const uid = () => Math.random().toString(36).slice(2, 9);
  const PH = 'ЗАМЕНИТЕ: текст из Figma';

  const L = (name, rate, hours, fixed) => ({ id: uid(), name, rate, hours, fixed: fixed || '' });

  function templateSlides() {
    const S = (type, fields, enabled = true) => ({ id: uid(), type, enabled, fields });
    return [
      S('cover', { title: 'Коммерческое\nпредложение', subtitle: 'на разработку сайта для компании {client}' }),
      S('about', { title: 'Мы — Webtex', text: PH, stats: '35 | специалистов\n10+ | лет на рынке', rating: '5.0', ratingSource: 'Яндекс', ratingCount: '66 отзывов' }),
      S('about', { title: 'Команда', text: PH, stats: '', rating: '', ratingSource: '', ratingCount: '' }, false),
      S('statement', { kicker: 'Не просто код и дизайн —', text: 'а сайт, который приносит заявки' }),
      S('text', { title: 'Почему выбирают Webtex', lead: '', bullets: PH + '\nПункт 2\nПункт 3' }),
      S('text', { title: 'Технологии и сервисы, с которыми работаем', lead: '', bullets: PH }),
      S('text', { title: 'Как мы работаем', lead: '', bullets: PH }, false),
      S('statement', { kicker: 'Этапы работы', text: '' }),
      S('table', { title: 'Этапы и сроки', head: 'Этап | Что делаем | Срок', rows: 'Аналитика | ' + PH + ' | 2 недели\nДизайн | ' + PH + ' | 4 недели' }),
      S('statement', { kicker: 'О проекте', text: '' }),
      S('cards', { title: 'Задачи проекта', items: 'Задача 1 | ' + PH + '\nЗадача 2 | ' + PH + '\nЗадача 3 | ' + PH }),
      S('cards', { title: 'Что вы получите', items: 'Результат 1 | ' + PH + '\nРезультат 2 | ' + PH + '\nРезультат 3 | ' + PH + '\nРезультат 4 | ' + PH + '\nРезультат 5 | ' + PH + '\nРезультат 6 | ' + PH }),
      S('compare', { title: 'Тарифы', rows: 'Прототип сайта | + | +\nДизайн 3-х версий | + | +\nАдаптивная вёрстка | + | +\nБазовая SEO-оптимизация | – | +\nПриоритетная поддержка | – | +' }),
      S('payment', { title: 'Порядок оплаты', stages: 'Предоплата | 1/3\nПо факту готовности дизайна | 1/3\nПо факту готовности сайта | 1/3', installmentLabel: 'Рассрочка на N месяцев' }),
      S('estimate', { title: 'Смета', packLabel: 'пакет T', headers: 'Этап работ|Стоимость часа, ₽|Кол-во часов|Стоимость, ₽' }),
      S('text', { title: 'Гарантии и поддержка', lead: '', bullets: PH }, false),
      S('statement', { kicker: 'Начнём?', text: 'Осталось согласовать смету' }, false),
      S('text', { title: 'Следующие шаги', lead: '', bullets: 'Согласование КП\nДоговор и предоплата\nСтарт работ' }),
      S('contacts', { title: 'Остались вопросы?\nСвяжитесь с нами', name: 'Имя Фамилия', phone: '+7 (000) 000-00-00', email: 'hello@webtex.ru', site: 'webtex.ru' }),
    ];
  }

  function emptyVariant(cms) {
    return {
      id: uid(), cms, enabled: true,
      tariffs: [
        { id: uid(), name: 'Базовый', enabled: true, months: 12, total: '', estimate: [] },
        { id: uid(), name: 'Премиум', enabled: true, months: 12, total: '', estimate: [] },
      ],
    };
  }

  KP.newProposal = function (client, fromTemplate) {
    const now = new Date().toISOString();
    const p = fromTemplate ? JSON.parse(JSON.stringify(fromTemplate)) : { slides: templateSlides(), variants: [emptyVariant('Битрикс')] };
    // новые id, чтобы КП не делили идентификаторы с шаблоном
    p.slides.forEach((s) => (s.id = uid()));
    p.variants.forEach((v) => { v.id = uid(); v.tariffs.forEach((t) => { t.id = uid(); (t.estimate || []).forEach((l) => (l.id = uid())); }); });
    return Object.assign(p, { id: uid(), client: client || 'Новый клиент', sheetKey: client || '', syncEnables: true, createdAt: now, updatedAt: now });
  };

  KP.templateDoc = function () {
    return { id: '__template__', client: 'ШАБЛОН (копируется в каждое новое КП)', sheetKey: '', syncEnables: false, slides: templateSlides(), variants: [emptyVariant('Битрикс')], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  };

  KP.samplePage = function () {
    const p = KP.newProposal('Абашев', null);
    const premium = [
      L('Интервьюирование клиента', 2400, 2), L('Анализ конкурентов и целевой аудитории', 2600, 10), L('Прототип сайта', 2600, 40),
      L('Дизайн 3-х версий сайта: desktop, tablet и mobile', 2600, 85), L('Техническое задание', 2500, 28),
      L('Верстка 3-х версий сайта: tablet, desktop, mobile', 2700, 115), L('Программирование сайта', 2700, 220),
      L('Наполнение сайта контентом', 2400, 45), L('Настройка сервера', 2700, 3), L('Менеджмент проекта', 2500, 110),
      L('Тестирование и стабилизация', 2700, 25), L('Базовая SEO-оптимизация', '', '', 30000),
    ];
    p.variants = [
      { id: uid(), cms: 'Битрикс', enabled: true, tariffs: [
        { id: uid(), name: 'Базовый', enabled: true, months: 12, total: 1453500, estimate: [] },
        { id: uid(), name: 'Премиум', enabled: true, months: 12, total: '', estimate: premium },
      ] },
      { id: uid(), cms: 'WordPress', enabled: true, tariffs: [
        { id: uid(), name: 'Базовый', enabled: true, months: 12, total: 1248000, estimate: [] },
        { id: uid(), name: 'Премиум', enabled: true, months: 12, total: 1592400, estimate: [] },
      ] },
    ];
    return p;
  };
})();
