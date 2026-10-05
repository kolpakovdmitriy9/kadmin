/* Импорт цифр из Google Sheets (таблица должна быть доступна «всем, у кого есть ссылка» — просмотр).
   Формат листа (длинная таблица, одна строка = одна строка сметы):
     проект | cms | тариф | этап | ставка | часы | фикс | итого | месяцев
   Подробности — в README. */
(function () {
  const KP = (window.KP = window.KP || {});

  function parseCSV(text) {
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  function csvUrl(src, tab) {
    src = (src || '').trim();
    if (!src) throw new Error('Не указана ссылка на Google-таблицу (Настройки)');
    if (/output=csv|format=csv/.test(src)) return src;
    const id = (src.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/) || [])[1];
    if (!id) throw new Error('Не удалось найти ID таблицы в ссылке');
    const gid = (src.match(/[#&?]gid=(\d+)/) || [])[1];
    let u = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
    if (tab) u += '&sheet=' + encodeURIComponent(tab); else if (gid) u += '&gid=' + gid;
    return u;
  }

  const norm = (s) => String(s || '').trim().toLowerCase().replace(/ё/g, 'е');
  const COLS = {
    project: ['проект', 'project', 'клиент'], cms: ['cms'], tariff: ['тариф', 'tariff'], stage: ['этап', 'работа', 'stage'],
    rate: ['ставка', 'стоимость часа', 'rate'], hours: ['часы', 'кол-во часов', 'hours'], fixed: ['фикс', 'fixed', 'стоимость'],
    total: ['итого', 'total'], months: ['месяцев', 'рассрочка', 'months'],
  };

  async function fetchRows(settings) {
    const url = csvUrl(settings.sheetUrl, settings.sheetTab);
    let r;
    try { r = await fetch(url); } catch (e) { throw new Error('Таблица недоступна из браузера. Проверьте доступ «Все, у кого есть ссылка» или опубликуйте лист в вебе (Файл → Опубликовать).'); }
    if (!r.ok) throw new Error('Google Sheets вернул ' + r.status);
    const txt = await r.text();
    if (/^\s*<!doctype html|<html/i.test(txt)) throw new Error('Google вернул страницу входа — откройте доступ к таблице по ссылке (просмотр).');
    const rows = parseCSV(txt).filter((r) => r.some((c) => String(c).trim()));
    if (rows.length < 2) throw new Error('В таблице нет данных');
    const head = rows[0].map(norm);
    const idx = {};
    Object.entries(COLS).forEach(([k, names]) => { idx[k] = head.findIndex((h) => names.includes(h)); });
    if (idx.project < 0) throw new Error('В шапке листа нет колонки «проект»');
    return rows.slice(1).map((r) => {
      const o = {};
      Object.keys(idx).forEach((k) => (o[k] = idx[k] >= 0 ? String(r[idx[k]] ?? '').trim() : ''));
      return o;
    });
  }

  /** Применяет строки листа к КП. Возвращает текстовый отчёт. */
  KP.syncFromSheet = async function (p, settings) {
    const all = await fetchRows(settings);
    const key = norm(p.sheetKey || p.client);
    const mine = all.filter((r) => norm(r.project) === key);
    if (!mine.length) throw new Error(`В таблице нет строк для проекта «${p.sheetKey || p.client}»`);

    const seenV = new Set(), seenT = new Set();
    let nLines = 0;
    const cleared = new Set();

    mine.forEach((r) => {
      let v = p.variants.find((x) => norm(x.cms) === norm(r.cms || p.variants[0]?.cms));
      if (!v) { v = { id: KP.uid(), cms: r.cms || 'CMS', enabled: true, tariffs: [] }; p.variants.push(v); }
      let t = v.tariffs.find((x) => norm(x.name) === norm(r.tariff));
      if (!t) { t = { id: KP.uid(), name: r.tariff || 'Тариф', enabled: true, months: 12, total: '', estimate: [] }; v.tariffs.push(t); }
      seenV.add(v.id); seenT.add(t.id);
      if (r.months) t.months = KP.num(r.months);
      if (!cleared.has(t.id)) { t.estimate = []; cleared.add(t.id); }
      if (r.stage) {
        t.estimate.push({ id: KP.uid(), name: r.stage, rate: r.rate ? KP.num(r.rate) : '', hours: r.hours ? KP.num(r.hours) : '', fixed: r.fixed ? KP.num(r.fixed) : '' });
        nLines++;
      } else if (r.total) t.total = KP.num(r.total);
    });

    if (p.syncEnables) {
      p.variants.forEach((v) => { v.enabled = seenV.has(v.id); v.tariffs.forEach((t) => (t.enabled = seenT.has(t.id))); });
    }
    return `Из таблицы: ${seenV.size} вар., ${seenT.size} тар., ${nLines} строк сметы`;
  };
})();
