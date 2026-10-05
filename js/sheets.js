/* Импорт цен из Google Sheets с автоопределением структуры.
   Ничего не нужно настраивать: ищем блоки «<Тариф> Задача | Стоимость часа | Кол-во час. | Стоимость услуг»,
   строки до «Итого» и блок «Дополнительные расходы». Таблица должна быть открыта «всем, у кого есть ссылка». */
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

  async function fetchGrid(settings, tab) {
    const url = csvUrl(settings.sheetUrl, tab);
    let r;
    try { r = await fetch(url); } catch (e) { throw new Error('Таблица недоступна из браузера: откройте доступ «Все, у кого есть ссылка — просмотр».'); }
    if (!r.ok) throw new Error('Google Sheets вернул ' + r.status + (tab ? ` (лист «${tab}»)` : ''));
    const txt = await r.text();
    if (/^\s*<!doctype html|<html/i.test(txt)) throw new Error('Google вернул страницу входа — откройте доступ к таблице по ссылке (просмотр).');
    return parseCSV(txt);
  }

  const T = (s) => String(s ?? '').replace(/ /g, ' ').trim();
  const low = (s) => T(s).toLowerCase().replace(/ё/g, 'е');

  /** Автодетект структуры листа → {tariffs:[{name,rows,total,hours}], extras:[]} */
  KP.parseEstimateGrid = function (g) {
    const tariffs = [];
    for (let r = 0; r < Math.min(g.length, 40); r++) {
      for (let c = 1; c < (g[r] || []).length - 2; c++) {
        if (/^стоимость\s*часа/.test(low(g[r][c])) && /кол-?\s*во/.test(low(g[r][c + 1])) && T(g[r][c - 1])) {
          const name = KP.normTariffName(T(g[r][c - 1]).replace(/\s*задача\s*$/i, ''));
          const rows = []; let total = 0, hours = 0, empty = 0;
          for (let k = r + 1; k < g.length; k++) {
            const nm = T((g[k] || [])[c - 1]);
            if (/^итого/i.test(nm)) { total = KP.num(g[k][c + 2]); hours = KP.num(g[k][c + 1]); break; }
            if (!nm) { if (++empty > 2) break; continue; }
            empty = 0;
            const rate = KP.num(g[k][c]), hrs = KP.num(g[k][c + 1]), cost = KP.num(g[k][c + 2]);
            if (cost <= 0) continue;                                // задача не входит в тариф
            if (!rate && !hrs) rows.push({ id: KP.uid(), name: nm, rate: '', hours: '', fixed: cost });
            else rows.push({ id: KP.uid(), name: nm, rate, hours: hrs, fixed: '' });
          }
          if (rows.length) tariffs.push({ name, rows, total, hours });
        }
      }
    }
    // доп. расходы
    let extras = [];
    for (let r = 0; r < g.length && !extras.length; r++) {
      for (let c = 0; c < (g[r] || []).length; c++) {
        if (/дополнительные\s+расходы/.test(low(g[r][c]))) {
          for (let k = r + 1; k < g.length; k++) {
            const nm = T((g[k] || [])[c]);
            if (!nm) { if (extras.length) break; continue; }
            let price = '';
            for (let j = c + 1; j < Math.min(c + 8, g[k].length); j++) if (T(g[k][j])) { price = T(g[k][j]); break; }
            if (price) extras.push({ name: nm, price: KP.fmtPrice(price) });
          }
          break;
        }
      }
    }
    return { tariffs, extras };
  };

  // «4000руб/год» → «4 000 ₽/год», «от 200 р/год» → «от 200 ₽/год»
  KP.fmtPrice = (s) => String(s).replace(/(\d[\d\s]*)\s*(?:руб(?:лей|\.)?|р\.?|₽)(?=[\s\/]|$)/gi, (m, n) => KP.grp(parseInt(n.replace(/\s/g, ''), 10)) + ' ₽').replace(/\u00a0/g, ' ');

  /** Применяет таблицу к КП: каждому варианту (CMS) соответствует лист. Возвращает отчёт. */
  KP.syncFromSheet = async function (p, settings) {
    const report = [];
    let gotExtras = null;
    for (const v of p.variants) {
      const tab = v.sheetTab || p.sheetTab || p.client;
      const g = await fetchGrid(settings, tab);
      const res = KP.parseEstimateGrid(g);
      if (!res.tariffs.length) { report.push(`${v.cms}: лист «${tab}» — тарифов не найдено`); continue; }
      const seen = new Set();
      res.tariffs.forEach((rt) => {
        let t = v.tariffs.find((x) => KP.normTariffName(x.name).toLowerCase() === rt.name.toLowerCase());
        if (!t) {
          const neuro = /нейро/i.test(rt.name);
          t = { id: KP.uid(), name: rt.name, profile: KP.profileFor(rt.name), enabled: true, inCompare: true, inPayment: !neuro, estimate: !neuro, months: '', total: '', rows: [] };
          v.tariffs.push(t);
        }
        t.rows = rt.rows; t.total = ''; seen.add(t.id);
      });
      if (p.syncEnables) v.tariffs.forEach((t) => (t.enabled = seen.has(t.id)));
      report.push(`${v.cms}: ${res.tariffs.map((t) => t.name).join(', ')}`);
      if (res.extras.length && !gotExtras) gotExtras = res.extras;
    }
    if (gotExtras) { p.extras = gotExtras; report.push(`доп. расходы: ${gotExtras.length}`); }
    return 'Из таблицы → ' + report.join(' · ');
  };
})();
