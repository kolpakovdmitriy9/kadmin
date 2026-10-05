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

  function sheetRef(src) {
    src = (src || '').trim();
    if (!src) throw new Error('Не указана ссылка на Google-таблицу: вставьте её в поле «Google-таблица» вверху КП');
    if (/output=csv|format=csv/.test(src)) return { direct: src };
    const id = (src.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/) || [])[1];
    if (!id) throw new Error('Не удалось найти ID таблицы в ссылке');
    return { id, gid: (src.match(/[#&?]gid=(\d+)/) || [])[1] };
  }

  async function getCSV(url, tab) {
    let r;
    try { r = await fetch(url); } catch (e) { throw new Error('Таблица недоступна из браузера: откройте доступ «Все, у кого есть ссылка — просмотр».'); }
    if (!r.ok) throw new Error('Google Sheets вернул ' + r.status + (tab ? ` (лист «${tab}»)` : ''));
    const txt = await r.text();
    if (/^\s*<!doctype html|<html/i.test(txt)) throw new Error('Google вернул страницу входа — откройте доступ к таблице по ссылке (просмотр).');
    return parseCSV(txt);
  }

  // Лист без имени (по ссылке) — через export: он отдаёт ячейки как есть, без «умных» заголовков gviz.
  // Лист по имени — через gviz (export умеет только gid). Если export не сработал — тоже gviz.
  async function fetchGrid(src, tab) {
    const ref = sheetRef(src);
    if (ref.direct) return getCSV(ref.direct, tab);
    const gviz = `https://docs.google.com/spreadsheets/d/${ref.id}/gviz/tq?tqx=out:csv` + (tab ? '&sheet=' + encodeURIComponent(tab) : ref.gid ? '&gid=' + ref.gid : '');
    if (tab) return getCSV(gviz, tab);
    try { return await getCSV(`https://docs.google.com/spreadsheets/d/${ref.id}/export?format=csv` + (ref.gid ? '&gid=' + ref.gid : ''), tab); }
    catch (e) { return getCSV(gviz, tab); }
  }

  const T = (s) => String(s ?? '').replace(/ /g, ' ').trim();
  const low = (s) => T(s).toLowerCase().replace(/ё/g, 'е');

  /** Автодетект структуры листа → {tariffs:[{name,rows,total,hours}], extras:[]} */
  KP.parseEstimateGrid = function (g) {
    const tariffs = [];
    for (let r = 0; r < Math.min(g.length, 40); r++) {
      for (let c = 1; c < (g[r] || []).length - 2; c++) {
        if (/^стоимость\s*часа/.test(low(g[r][c])) && /кол-?\s*во/.test(low(g[r][c + 1])) && T(g[r][c - 1])) {
          // имя тарифа: «Базовый Задача» в одной ячейке (gviz склеивает заголовки) или над «Задача» в той же колонке
          let name = T(g[r][c - 1]).replace(/\s*задача\s*$/i, '');
          for (let u = r - 1; !name && u >= Math.max(0, r - 3); u--) name = T((g[u] || [])[c - 1]);
          name = KP.normTariffName(name || 'Тариф ' + (tariffs.length + 1));
          const rows = []; let total = 0, hours = 0, empty = 0, months = '', discount = null, pay = null;
          for (let k = r + 1; k < g.length; k++) {
            const nm = T((g[k] || [])[c - 1]);
            if (/^итого/i.test(nm)) {
              total = KP.num(g[k][c + 2]); hours = KP.num(g[k][c + 1]);
              // под «Итого»: «Рассрочка на N» → N мес. («-» — без рассрочки), «Скидка N%» со значением → скидка,
              // «100% предоплата» → вся сумма в первом этапе, остальные — прочерк
              for (let j = k + 1; j < Math.min(k + 8, g.length); j++) {
                const lb = low((g[j] || [])[c + 1]), val = T((g[j] || [])[c + 2]);
                const on = val && val !== '-' && KP.num(val) > 0;
                if (/^рассрочка/.test(lb) && months === '') { const n = lb.match(/(\d+)/); months = n && on ? +n[1] : 0; }
                else if (/^скидка/.test(lb)) { const n = lb.match(/(\d+(?:[.,]\d+)?)\s*%/); discount = n && on ? parseFloat(n[1].replace(',', '.')) : ''; }
                else if (/100\s*%\s*предоплат/.test(lb) && on) pay = ['100%', '-', '-', '-', '-', '-'];
              }
              break;
            }
            if (!nm) { if (++empty > 2) break; continue; }
            empty = 0;
            const rate = KP.num(g[k][c]), hrs = KP.num(g[k][c + 1]), cost = KP.num(g[k][c + 2]);
            if (cost <= 0) continue;                                // задача не входит в тариф
            if (!rate && !hrs) rows.push({ id: KP.uid(), name: nm, rate: '', hours: '', fixed: cost });
            else rows.push({ id: KP.uid(), name: nm, rate, hours: hrs, fixed: '' });
          }
          if (rows.length) tariffs.push({ name, rows, total, hours, months, discount, pay });
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
    // клиент: ячейка «Клиент / Заказчик / Компания / Проект» и значение справа (или «Клиент: Имя» в одной ячейке)
    let client = '';
    for (let r = 0; r < Math.min(g.length, 15) && !client; r++) {
      for (let c = 0; c < (g[r] || []).length && !client; c++) {
        const m = T(g[r][c]).match(/^(?:клиент|заказчик|компания|проект)\s*:?\s*(.*)$/i);
        if (!m) continue;
        if (m[1]) client = m[1];
        else for (let j = c + 1; j < Math.min(c + 4, g[r].length); j++) if (T(g[r][j])) { client = T(g[r][j]); break; }
      }
    }
    return { tariffs, extras, client };
  };

  // «4000руб/год» → «4 000 ₽/год», «от 200 р/год» → «от 200 ₽/год»
  KP.fmtPrice = (s) => String(s).replace(/(\d[\d\s]*)\s*(?:руб(?:лей|\.)?|р\.?|₽)(?=[\s\/]|$)/gi, (m, n) => KP.grp(parseInt(n.replace(/\s/g, ''), 10)) + ' ₽').replace(/\u00a0/g, ' ');

  /** Применяет таблицу к КП: каждому варианту (CMS) соответствует лист. Возвращает отчёт. */
  KP.syncFromSheet = async function (p, settings, info = {}) {
    const report = [];
    let gotExtras = null;
    // Своя ссылка у КП важнее общей из «Настроек». Со своей ссылкой лист по умолчанию — тот, что открыт по ссылке (gid).
    const own = (p.sheetUrl || '').trim();
    const src = own || settings.sheetUrl;
    const used = new Set();
    for (const v of p.variants) {
      const tab = v.sheetTab || p.sheetTab || (own ? '' : p.client);
      if (used.has(tab)) { report.push(`${v.cms}: пропущен — укажите для него «лист таблицы»`); continue; }
      used.add(tab);
      const g = await fetchGrid(src, tab);
      const res = KP.parseEstimateGrid(g);
      if (!res.tariffs.length) { report.push(`${v.cms}: ${tab ? `лист «${tab}»` : "лист по ссылке"} — тарифов не найдено`); continue; }
      const seen = new Set();
      res.tariffs.forEach((rt) => {
        let t = v.tariffs.find((x) => KP.normTariffName(x.name).toLowerCase() === rt.name.toLowerCase());
        if (!t) {
          // раз тариф есть в таблице со сметой — показываем его везде (в т. ч. Нейро); лишнее выключается вручную
          t = { id: KP.uid(), name: rt.name, profile: KP.profileFor(rt.name), enabled: true, inCompare: true, inPayment: true, estimate: true, months: '', total: '', rows: [] };
          v.tariffs.push(t);
        }
        t.rows = rt.rows; t.total = ''; if (rt.months !== '') t.months = rt.months; if (rt.discount !== null) t.discount = rt.discount; if (rt.pay) t.pay = rt.pay; seen.add(t.id);
      });
      if (p.syncEnables) v.tariffs.forEach((t) => (t.enabled = seen.has(t.id)));
      report.push(`${v.cms}: ${res.tariffs.map((t) => t.name).join(', ')}`);
      if (res.extras.length && !gotExtras) gotExtras = res.extras;
      if (res.client && !info.client) info.client = res.client;
    }
    if (gotExtras) { p.extras = gotExtras; report.push(`доп. расходы: ${gotExtras.length}`); }
    return 'Из таблицы → ' + report.join(' · ');
  };
})();
