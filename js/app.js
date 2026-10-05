(function () {
  const KP = window.KP;
  const { store, TYPES, STATIC, expand, renderItem, esc, rub, tariffTotal, tariffHours, tariffRows, tariffMonths, lineCost, num } = KP;
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');

  // ---------- утилиты ----------
  KP.toast = function (msg, ms = 3200) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  };
  const toast = KP.toast;
  const fmtDate = (s) => (s ? new Date(s).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '');
  const setPath = (o, path, v) => { const k = path.split('.'); for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = v; };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  function ask(title, label, value = '') {
    return new Promise((res) => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal"><h3 style="margin:0 0 8px">${esc(title)}</h3><label class="l">${esc(label)}</label><input type="text" value="${esc(value)}"><div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn" data-x="0">Отмена</button><button class="btn pri" data-x="1">Создать</button></div></div>`;
      document.body.appendChild(bg);
      const inp = $('input', bg); inp.focus(); inp.select();
      const done = (ok) => { bg.remove(); res(ok ? inp.value.trim() : null); };
      bg.addEventListener('click', (e) => { if (e.target === bg) done(false); const x = e.target.dataset.x; if (x) done(x === '1'); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
    });
  }

  /** «Новое КП»: ссылка на таблицу → загрузка прямо в окне → готовое КП. null — отмена. */
  function newFromSheet() {
    return new Promise((res) => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal" style="width:520px"><h3 style="margin:0 0 4px">Новое КП</h3>
        <p class="muted" style="margin:0 0 6px">Вставьте ссылку на Google-таблицу со сметой — цены, тарифы и доп. расходы заполнятся сами.</p>
        <label class="l">Ссылка на Google-таблицу</label><input type="text" data-f="url" placeholder="https://docs.google.com/spreadsheets/d/…">
        <label class="l">Название клиента <span class="muted">(если пусто — возьмём из таблицы)</span></label><input type="text" data-f="name">
        <div data-f="st" class="muted" style="margin-top:12px;min-height:20px;white-space:pre-wrap"></div>
        <div class="row" style="margin-top:12px;justify-content:space-between"><button class="btn ghost" data-x="empty">Без таблицы</button><span class="row" style="gap:8px"><button class="btn" data-x="0">Отмена</button><button class="btn pri" data-x="1">Загрузить</button></span></div></div>`;
      document.body.appendChild(bg);
      const url = $('[data-f="url"]', bg), name = $('[data-f="name"]', bg), st = $('[data-f="st"]', bg), go = $('[data-x="1"]', bg);
      url.focus();
      let busy = false;
      const close = (v) => { bg.remove(); res(v); };
      const err = (m) => { st.style.color = 'var(--red, #e53935)'; st.textContent = m; };
      async function load() {
        if (busy) return;
        const link = url.value.trim();
        if (!/docs\.google\.com\/spreadsheets\/d\//.test(link)) { err('Нужна ссылка вида https://docs.google.com/spreadsheets/d/…'); url.focus(); return; }
        busy = true; go.disabled = true; go.textContent = 'Загружаю…'; st.style.color = ''; st.textContent = 'Читаю таблицу…';
        try {
          const p = KP.newProposal(name.value.trim() || 'Новый клиент', store.data.template);
          p.sheetUrl = link; p.sheetTab = '';
          const info = {};
          const msg = await KP.syncFromSheet(p, store.settings, info);
          const found = p.variants.some((v) => v.tariffs.some((t) => (t.rows || []).length));
          if (!found) throw new Error('В таблице не нашлось блоков со сметой («<Тариф> Задача | Стоимость часа | Кол-во час. | Стоимость услуг»). ' + msg);
          let noName = false;
          if (!name.value.trim()) { if (info.client) { p.client = info.client; } else noName = true; }
          close({ p, msg, noName });
        } catch (e) { err('Не получилось: ' + e.message); busy = false; go.disabled = false; go.textContent = 'Загрузить'; }
      }
      bg.addEventListener('click', (e) => {
        if (e.target === bg && !busy) return close(null);
        const x = e.target.dataset.x;
        if (x === '0') close(null);
        else if (x === '1') load();
        else if (x === 'empty') { const n = name.value.trim(); if (!n) { err('Без таблицы — введите название клиента'); name.focus(); return; } close({ p: KP.newProposal(n, store.data.template), msg: 'КП создано', noName: false }); }
      });
      [url, name].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') load(); if (e.key === 'Escape' && !busy) close(null); }));
      url.addEventListener('paste', () => setTimeout(load, 0));
    });
  }



  // ---------- роутер ----------
  function route() {
    const [, name, id] = (location.hash || '#/').match(/^#\/([^/]*)\/?(.*)$/) || [];
    const clean = decodeURIComponent((id || '').split('?')[0]);
    if (name === 'p') return viewEditor(clean);
    if (name === 'print') return viewPrint(clean);
    if (name === 'settings') return viewSettings();
    return viewList();
  }
  window.addEventListener('hashchange', route);

  // ---------- список ----------
  function summary(p) {
    return (p.variants || []).map((v) => `<div class="${v.enabled ? '' : 'muted'}"><b>${esc(v.cms)}</b> ` + v.tariffs.map((t) => `<span class="chip ${v.enabled && t.enabled ? '' : 'off'}">${esc(t.name)} ${tariffTotal(t) ? rub(tariffTotal(t)) : '—'}</span>`).join('') + '</div>').join('');
  }
  function viewList(filter = '') {
    const rows = store.list().filter((p) => !filter || (p.client || '').toLowerCase().includes(filter.toLowerCase()));
    app.innerHTML = `<div class="top"><h1>Коммерческие предложения</h1><input type="search" id="q" placeholder="Поиск по клиенту" style="width:260px" value="${esc(filter)}"><span class="sp"></span>
      <button class="btn" data-a="tpl">Шаблон КП</button><button class="btn" data-a="set">Настройки</button><button class="btn pri" data-a="new">+ Новое КП</button></div>
      <div class="wrap"><table class="list"><thead><tr><th>Клиент</th><th>Варианты и тарифы</th><th>Изменено</th><th></th></tr></thead><tbody>
      ${rows.map((p) => `<tr data-id="${p.id}"><td><a href="#/p/${p.id}"><b>${esc(p.client)}</b></a></td><td>${summary(p)}</td><td class="muted">${fmtDate(p.updatedAt)}</td>
        <td style="white-space:nowrap"><button class="btn sm" data-a="open">Открыть</button> <button class="btn sm pri" data-a="pdf">PDF</button> <button class="btn sm" data-a="dup">Копия</button> <button class="btn sm dng" data-a="del">✕</button></td></tr>`).join('') || '<tr><td colspan="4" class="muted">Пока пусто — создайте первое КП.</td></tr>'}
      </tbody></table>
      <div class="row" style="margin-top:18px"><button class="btn sm" data-a="pull">⬇ Загрузить из GitHub</button><button class="btn sm" data-a="push">⬆ Сохранить в GitHub</button><span class="g"></span><button class="btn sm" data-a="exp">Экспорт JSON</button><label class="btn sm">Импорт JSON<input type="file" id="imp" accept=".json" hidden></label></div>
      <p class="muted">Данные хранятся в этом браузере и, по кнопке, в вашем GitHub-репозитории (см. «Настройки»).</p></div>`;
    $('#q').oninput = (e) => { viewList(e.target.value); const q = $('#q'); q.focus(); q.setSelectionRange(99, 99); };
    $('#imp').onchange = async (e) => {
      try { store.importJSON(await e.target.files[0].text()); toast('Импортировано'); viewList(); } catch (er) { toast('Ошибка: ' + er.message); }
    };
    app.oninput = null; app.onchange = null;
    app.onclick = async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const id = b.closest('tr')?.dataset.id;
      const a = b.dataset.a;
      try {
        if (a === 'new') {
          const res = await newFromSheet(); if (!res) return;
          store.add(res.p); location.hash = '#/p/' + res.p.id + (res.noName ? '?name=1' : '');
          toast(res.msg, 6000);
        } else if (a === 'tpl') location.hash = '#/p/__template__';
        else if (a === 'set') location.hash = '#/settings';
        else if (a === 'open') location.hash = '#/p/' + id;
        else if (a === 'pdf') location.hash = '#/print/' + id;
        else if (a === 'dup') { const c = store.duplicate(id); toast('Создана копия'); location.hash = '#/p/' + c.id; }
        else if (a === 'del') { if (confirm('Удалить КП «' + store.get(id).client + '»?')) { store.remove(id); viewList(filter); } }
        else if (a === 'pull') { await store.githubPull(); toast('Загружено из GitHub'); viewList(); }
        else if (a === 'push') { await store.githubPush(); toast('Сохранено в GitHub'); }
        else if (a === 'exp') { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([store.exportJSON()], { type: 'application/json' })); l.download = 'kp-backup.json'; l.click(); }
      } catch (er) { toast('Ошибка: ' + er.message, 6000); }
    };
  }

  // ---------- редактор ----------
  function viewEditor(id) {
    const p = store.get(id);
    if (!p) { location.hash = '#/'; return; }
    const ed = { tab: 'slides', sel: null };
    const save = debounce(() => { store.touch(p); const s = $('#saved'); if (s) s.textContent = 'Сохранено ' + new Date().toLocaleTimeString('ru-RU'); }, 300);
    const items = () => expand(p, true);
    const curItem = () => items().find((i) => i.key === ed.sel);

    app.innerHTML = `<div class="ed"><div class="top"><button class="btn" data-a="back">← Список</button>
      <input type="text" data-p="client" value="${esc(p.client)}" style="width:300px;font-weight:600">
      <input type="text" data-p="sheetUrl" data-sheet="1" value="${esc(p.sheetUrl || '')}" placeholder="Вставьте ссылку на Google-таблицу — цены подтянутся сами" style="width:380px" title="Google-таблица этого КП (доступ «все, у кого есть ссылка — просмотр»)">
      <button class="btn" data-a="sync">↻ Из таблицы</button>
      <span class="muted" id="saved">Автосохранение включено</span><span class="sp"></span>
      <button class="btn" data-a="gh">⬆ GitHub</button><button class="btn pri" data-a="pdf">Скачать PDF</button></div>
      <div class="ed-body"><aside class="ed-side"><div class="tabs"><button data-tab="slides">Слайды</button><button data-tab="prices">Тарифы и цены</button></div><div class="side-scroll" id="side"></div></aside>
      <main class="ed-main"><div class="pv-wrap" id="pvw"><div class="pv" id="pv"></div></div><div class="fields" id="fields"></div></main></div></div>`;

    const baseLabel = (s) => (s.type === 'static' ? (STATIC[s.asset] || [s.asset])[0] : TYPES[s.type].label);
    const baseTag = (s) => (s.type === 'static' ? ((STATIC[s.asset] || [])[1] || '') : TYPES[s.type].figma || '');

    function slidesPanel() {
      const all = items();
      let h = '';
      p.slides.forEach((s, i) => {
        const mine = all.filter((x) => x.slide === s);
        const first = mine[0] ? mine[0].key : s.id;
        const sel = mine.some((x) => x.key === ed.sel) || ed.sel === s.id;
        h += `<div class="sl ${s.enabled ? '' : 'off'} ${sel ? 'sel' : ''}" data-a="sel" data-key="${first}">
          <label class="sw"><input type="checkbox" data-a="tg" data-i="${i}" ${s.enabled ? 'checked' : ''}><i></i></label>
          <div class="nm">${i + 1}. ${esc(baseLabel(s))}<small>${baseTag(s) ? 'Figma ' + esc(baseTag(s)) : ''}${s.type === 'variants' ? ` · страниц: ${mine.filter((x) => !x.off).length}` : ''}</small></div>
          <button class="btn sm ghost" data-a="up" data-i="${i}">↑</button><button class="btn sm ghost" data-a="dn" data-i="${i}">↓</button></div>`;
        if (s.type === 'variants') mine.forEach((x) => {
          h += `<div class="sl child ${x.off ? 'off' : ''} ${ed.sel === x.key ? 'sel' : ''}" data-a="sel" data-key="${x.key}"><div class="nm">↳ ${esc(x.label)}${x.off ? '<small>выключено (вкладка «Тарифы и цены»)</small>' : ''}</div></div>`;
        });
      });
      return h;
    }

    const tog = (path, checked, label) => `<label class="row" style="gap:6px"><span class="sw" style="transform:scale(.8)"><input type="checkbox" data-p="${path}" data-t="bool" ${checked ? 'checked' : ''}><i></i></span><span style="font-size:13px">${label}</span></label>`;
    function pricesPanel() {
      let h = `<div class="card-b"><label class="l" style="margin-top:0">Лист Google-таблицы по умолчанию</label><input type="text" data-p="sheetTab" value="${esc(p.sheetTab || '')}" placeholder="${esc(p.sheetUrl ? 'лист, открытый по ссылке' : p.client)}">
        ${tog('syncEnables', p.syncEnables, 'Таблица сама включает только найденные в ней тарифы')}
        <button class="btn pri" style="margin-top:10px;width:100%" data-a="sync">↻ Из таблицы</button></div>`;
      p.variants.forEach((v, vi) => {
        h += `<div class="card-b"><div class="row"><label class="sw"><input type="checkbox" data-p="variants.${vi}.enabled" data-t="bool" ${v.enabled ? 'checked' : ''}><i></i></label><input class="g" type="text" data-p="variants.${vi}.cms" value="${esc(v.cms)}" placeholder="CMS / вариант"><input type="text" style="width:130px" data-p="variants.${vi}.sheetTab" value="${esc(v.sheetTab || '')}" placeholder="лист таблицы"><button class="btn sm ghost dng" data-a="delV" data-vi="${vi}">✕</button></div><div style="margin-top:8px">${tog('variants.' + vi + '.compareBadge', v.compareBadge !== false, 'Плашка CMS на слайде сравнения')}</div>`;
        v.tariffs.forEach((t, ti) => {
          const b = `variants.${vi}.tariffs.${ti}`;
          h += `<div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--line)"><div class="row"><label class="sw"><input type="checkbox" data-p="${b}.enabled" data-t="bool" ${t.enabled ? 'checked' : ''}><i></i></label>
            <input class="g" type="text" data-p="${b}.name" value="${esc(t.name)}"><select data-p="${b}.profile" style="width:105px" title="Какой столбец сравнения использовать">${Object.keys(KP.PROFILES).map((k) => `<option ${t.profile === k ? 'selected' : ''}>${k}</option>`).join('')}</select><button class="btn sm ghost dng" data-a="delT" data-vi="${vi}" data-ti="${ti}">✕</button></div>
            <div class="row" style="margin-top:6px;flex-wrap:wrap;gap:12px">${tog(b + '.inCompare', t.inCompare, 'Сравнение')}${tog(b + '.inPayment', t.inPayment, 'Оплата')}${tog(b + '.estimate', t.estimate, 'Смета')}</div>
            <div class="row" style="margin-top:6px"><span class="muted g">Рассрочка, мес.</span><input type="number" style="width:116px" data-p="${b}.months" data-t="blank" value="${t.months ?? ''}" placeholder="авто: ${KP.autoMonths(tariffTotal(t))}"></div>
            <div class="row" style="margin-top:6px"><span class="muted g">Итого без сметы</span><input type="number" style="width:120px" data-p="${b}.total" data-t="num" value="${t.total ?? ''}" ${tariffRows(t).length ? 'disabled' : ''}></div>
            <table class="est-t"><thead><tr><th>Этап</th><th>₽/ч</th><th>Часы</th><th>Фикс ₽</th><th></th><th></th></tr></thead><tbody>
            ${(t.rows || []).map((l, li) => { const lb = `${b}.rows.${li}`; return `<tr><td><input type="text" data-p="${lb}.name" value="${esc(l.name)}"></td><td><input type="number" data-p="${lb}.rate" data-t="num" value="${l.rate ?? ''}" style="width:64px"></td><td><input type="number" data-p="${lb}.hours" data-t="num" value="${l.hours ?? ''}" style="width:54px"></td><td><input type="number" data-p="${lb}.fixed" data-t="num" value="${l.fixed ?? ''}" style="width:74px"></td><td class="cost" id="c-${l.id}"></td><td><button class="btn sm ghost dng" data-a="delL" data-vi="${vi}" data-ti="${ti}" data-li="${li}">✕</button></td></tr>`; }).join('')}
            </tbody></table><div class="row" style="margin-top:6px"><button class="btn sm" data-a="addL" data-vi="${vi}" data-ti="${ti}">+ строка</button><span class="g"></span><span class="sum" id="s-${t.id}"></span></div></div>`;
        });
        h += `<button class="btn sm" style="margin-top:12px" data-a="addT" data-vi="${vi}">+ тариф</button></div>`;
      });
      h += `<button class="btn" style="width:100%" data-a="addV">+ вариант (другая CMS)</button>`;
      return h;
    }
    function renderSide() {
      $('.tabs').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ed.tab));
      const sc = $('#side').scrollTop;
      $('#side').innerHTML = ed.tab === 'slides' ? slidesPanel() : pricesPanel();
      $('#side').scrollTop = sc; refreshComputed();
    }
    function refreshComputed() {
      p.variants.forEach((v) => v.tariffs.forEach((t) => {
        (t.rows || []).forEach((l) => { const c = $('#c-' + l.id); if (c) c.textContent = rub(lineCost(l)); });
        const s = $('#s-' + t.id); if (s) s.textContent = tariffTotal(t) ? `${tariffHours(t) ? tariffHours(t) + ' ч · ' : ''}${rub(tariffTotal(t))}` : '';
      }));
    }

    function fitPreview() { const w = $('#pvw'), pv = $('#pv'); if (w) pv.style.transform = `scale(${w.clientWidth / 1920})`; }
    function formFor(it) {
      const s = it.slide;
      if (s.type === 'cover') return `<div class="card-b"><b>Обложка</b><label class="l">Название клиента</label><input type="text" data-p="client" value="${esc(p.client)}"><label class="l">КП действительно до</label><input type="date" data-p="validUntil" value="${esc(p.validUntil || '')}"></div>`;
      if (it.kind === 'payment') {
        const stages = KP.payStages(p), v = it.v, vi = p.variants.indexOf(v);
        const ts = v.tariffs.map((t, ti) => ({ t, ti })).filter(({ t }) => t.enabled && t.inPayment && tariffTotal(t) > 0);
        let h = `<div class="card-b"><b>Порядок оплаты · ${esc(v.cms)}</b><label class="l">Этапы оплаты — по одному в строке (общие для всего КП)</label><textarea data-x="payStages" style="min-height:96px">${esc(stages.join('\n'))}</textarea>
          <p class="muted" style="margin:10px 0 0">В ячейке: пусто — авто (остаток делится поровну), <b>-</b> — прочерк, <b>30%</b> — доля от итога, <b>100000</b> — сумма, любой другой текст выводится как есть.</p>`;
        if (!ts.length) h += `<p class="muted">Нет тарифов с включённой «Оплатой» — включите во вкладке «Тарифы и цены».</p>`;
        else {
          h += `<table class="est-t" style="margin-top:10px"><thead><tr><th>Этап</th>${ts.map(({ t }) => `<th>${esc(t.name)}</th>`).join('')}</tr></thead><tbody>`;
          const plans = ts.map(({ t }) => KP.payPlan(t, stages));
          stages.forEach((st, si) => {
            h += `<tr><td>${esc(st)}</td>${ts.map(({ t, ti }, k) => { if (!Array.isArray(t.pay)) t.pay = []; return `<td><input type="text" data-p="variants.${vi}.tariffs.${ti}.pay.${si}" data-pay="1" value="${esc(t.pay[si] ?? '')}" placeholder="${plans[k][si].auto ? 'авто: ' + esc(plans[k][si].text) : ''}"></td>`; }).join('')}</tr>`;
          });
          h += `<tr><td><b>Скидка, %</b><br><small class="muted">пусто — без скидки</small></td>${ts.map(({ t, ti }) => `<td><input type="text" data-p="variants.${vi}.tariffs.${ti}.discount" data-pay="1" value="${esc(t.discount ?? '')}" placeholder="—"></td>`).join('')}</tr>`;
          h += `</tbody></table><button class="btn sm" style="margin-top:8px" data-a="payReset" data-vi="${vi}">Сбросить: всё поровну</button>`;
        }
        return h + `</div>`;
      }
      if (s.type === 'variants') {
        const f = s.fields; const sw = (k, l) => tog('slides.' + p.slides.indexOf(s) + '.fields.' + k, f[k] !== false, l);
        return `<div class="card-b"><b>Блок по CMS</b><div class="muted">Для каждого включённого варианта CMS создаются страницы. Какие тарифы показывать и в каких таблицах — во вкладке «Тарифы и цены».</div><div class="row" style="flex-wrap:wrap;gap:16px;margin-top:10px">${sw('compare', 'Сравнение тарифов')}${sw('packages', 'Пакеты дизайна (только 1-й вариант)')}${sw('payment', 'Порядок оплаты')}${sw('estimate', 'Сметы')}</div></div>`;
      }
      if (s.type === 'extras') return `<div class="card-b"><b>Дополнительные расходы</b><label class="l">Строки: «Название | цена». Из Google-таблицы подтягиваются автоматически.</label><textarea data-x="extras" style="min-height:160px">${esc((p.extras || []).map((e) => e.name + ' | ' + e.price).join('\n'))}</textarea></div>`;
      return `<div class="card-b muted">Статичный слайд из макета Figma: его можно включать, выключать и переставлять. Содержимое берётся из макета без изменений.</div>`;
    }
    function renderMain() {
      const it = curItem(); const pv = $('#pv'), fields = $('#fields');
      if (!it) { pv.innerHTML = ''; fields.innerHTML = '<p class="muted">Для этого блока нет страниц: включите вариант/тариф и заполните цены во вкладке «Тарифы и цены».</p>'; return; }
      pv.innerHTML = renderItem(it); fitPreview(); fields.innerHTML = formFor(it);
    }
    const repaint = () => { renderSide(); renderMain(); };
    // подсказки «авто: …» в таблице оплаты пересчитываются при вводе
    function refreshPayHints() {
      const stages = KP.payStages(p);
      document.querySelectorAll('[data-pay]').forEach((inp) => {
        const [, vi, , ti, key, si] = inp.dataset.p.split('.');
        if (key !== 'pay') return;
        const c = KP.payPlan(p.variants[+vi].tariffs[+ti], stages)[+si];
        inp.placeholder = c && c.auto ? 'авто: ' + c.text : '';
      });
    }
    const refreshPreviewOnly = () => { const it = curItem(); if (it) { $('#pv').innerHTML = renderItem(it); fitPreview(); } };

    app.oninput = (e) => {
      const el = e.target;
      if (el.dataset.x === 'payStages') { p.payStages = KP.lines(el.value); save(); refreshPreviewOnly(); return; }
      if (el.dataset.x === 'extras') { p.extras = KP.lines(el.value).map((l) => { const [n, ...r] = l.split('|'); return { name: n.trim(), price: r.join('|').trim() }; }); save(); refreshPreviewOnly(); return; }
      if (el.dataset.p) {
        let v = el.type === 'checkbox' ? el.checked : el.value;
        if (el.dataset.t === 'num') v = el.value === '' ? '' : num(el.value);
        if (el.dataset.t === 'blank') v = el.value === '' ? '' : num(el.value);
        setPath(p, el.dataset.p, v);
        save(); refreshComputed(); refreshPreviewOnly();
        if (el.dataset.pay) refreshPayHints();
        if (el.type === 'checkbox' || el.tagName === 'SELECT') repaint();
      }
    };
    const syncNow = async () => {
      const btns = [...document.querySelectorAll('[data-a="sync"]')]; btns.forEach((x) => { x.disabled = true; x.textContent = 'Загружаю…'; });
      try { const msg = await KP.syncFromSheet(p, store.settings); save(); toast(msg, 6000); }
      catch (er) { toast('Ошибка: ' + er.message, 7000); }
      finally { btns.forEach((x) => { x.disabled = false; x.textContent = '↻ Из таблицы'; }); repaint(); }
    };
    app.onchange = (e) => {
      const el = e.target;
      if (el.dataset.a === 'tg') { p.slides[+el.dataset.i].enabled = el.checked; save(); repaint(); }
      if (el.dataset.x === 'payStages') renderMain();
      if (el.dataset.sheet && p.sheetUrl) { p.sheetTab = ''; save(); syncNow(); }
    };
    app.onclick = async (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) { ed.tab = tab.dataset.tab; renderSide(); return; }
      const b = e.target.closest('[data-a]'); if (!b || b.dataset.a === 'tg') return;
      const a = b.dataset.a; const i = +b.dataset.i, vi = +b.dataset.vi, ti = +b.dataset.ti, li = +b.dataset.li;
      e.stopPropagation();
      try {
        if (a === 'back') location.hash = '#/';
        else if (a === 'pdf') location.hash = '#/print/' + p.id;
        else if (a === 'sel') { ed.sel = b.dataset.key; repaint(); }
        else if (a === 'up' && i > 0) { [p.slides[i - 1], p.slides[i]] = [p.slides[i], p.slides[i - 1]]; save(); renderSide(); }
        else if (a === 'dn' && i < p.slides.length - 1) { [p.slides[i + 1], p.slides[i]] = [p.slides[i], p.slides[i + 1]]; save(); renderSide(); }
        else if (a === 'addV') { p.variants.push({ id: KP.uid(), cms: 'Новая CMS', enabled: true, sheetTab: '', tariffs: [{ id: KP.uid(), name: 'Базовый', profile: 'Базовый', enabled: true, inCompare: true, inPayment: true, estimate: true, months: '', total: '', rows: [] }] }); save(); renderSide(); }
        else if (a === 'delV') { if (confirm('Удалить вариант вместе с тарифами?')) { p.variants.splice(vi, 1); save(); repaint(); } }
        else if (a === 'addT') { p.variants[vi].tariffs.push({ id: KP.uid(), name: 'Новый тариф', profile: 'Базовый', enabled: true, inCompare: true, inPayment: true, estimate: true, months: '', total: '', rows: [] }); save(); renderSide(); }
        else if (a === 'delT') { if (confirm('Удалить тариф?')) { p.variants[vi].tariffs.splice(ti, 1); save(); repaint(); } }
        else if (a === 'addL') { p.variants[vi].tariffs[ti].rows.push({ id: KP.uid(), name: '', rate: '', hours: '', fixed: '' }); save(); renderSide(); }
        else if (a === 'delL') { p.variants[vi].tariffs[ti].rows.splice(li, 1); save(); repaint(); }
        else if (a === 'sync') await syncNow();
        else if (a === 'payReset') { p.variants[vi].tariffs.forEach((t) => (t.pay = [])); save(); repaint(); }
        else if (a === 'gh') { store.touch(p); await store.githubPush(); toast('Сохранено в GitHub'); }
      } catch (er) { toast('Ошибка: ' + er.message, 7000); renderSide(); }
    };
    window.onresize = fitPreview;
    const first = items()[0]; ed.sel = first ? first.key : null;
    repaint();
    if (/[?&]sync=1/.test(location.hash)) { history.replaceState(null, '', '#/p/' + p.id); syncNow(); }
    if (/[?&]name=1/.test(location.hash)) { history.replaceState(null, '', '#/p/' + p.id); const c = $('[data-p="client"]'); c.focus(); c.select(); toast('Введите название клиента вверху', 5000); }
  }

  // ---------- печать / PDF ----------
  async function viewPrint(id) {
    const p = store.get(id);
    if (!p) { location.hash = '#/'; return; }
    document.title = 'КП — ' + p.client;
    app.innerHTML = `<div class="pbar"><button class="btn" data-a="back">← К редактору</button><b>${esc(p.client)}</b><span class="muted g" id="st">Готовлю…</span>
      <button class="btn" data-a="print">🖨 Печать</button><button class="btn pri" data-a="savePdf">⬇ Сохранить в PDF</button></div><div class="pages" id="pages"></div>`;
    app.oninput = null; app.onchange = null;
    app.onclick = (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'back') location.hash = '#/p/' + p.id;
      if (a === 'print') window.print();
      if (a === 'savePdf') savePdf(p, e.target.closest('button'));
    };
    let status = '';
    if (store.settings.autoSync && (p.sheetUrl || store.settings.sheetUrl) && p.id !== '__template__') {
      try { status = await KP.syncFromSheet(p, store.settings); store.touch(p); }
      catch (er) { status = '⚠ Таблица не обновилась (' + er.message + ') — взяты сохранённые цифры.'; }
    }
    const pages = expand(p, false);
    $('#pages').innerHTML = pages.map(renderItem).join('');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    $('#st').textContent = `${pages.length} стр. ${status ? '· ' + status : ''} · В окне печати: поля «Нет», «Фоновая графика» включить`;
    if (/auto=1/.test(location.hash)) setTimeout(() => window.print(), 400);
  }

  // ---------- PDF-файл: каждый слайд 1920×1080 → картинка → страница PDF ----------
  const loadScript = (src) => new Promise((ok, fail) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => fail(new Error('Не загрузилась библиотека PDF — проверьте интернет'));
    document.head.appendChild(s);
  });
  async function savePdf(p, btn) {
    const st = $('#st'), was = btn.textContent;
    btn.disabled = true;
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:-20000px;top:0;width:1920px;height:1080px;overflow:hidden';
    document.body.appendChild(box);
    try {
      btn.textContent = 'Готовлю…';
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const slides = [...document.querySelectorAll('#pages > .slide')];
      const pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080], hotfixes: ['px_scaling'], compress: true });
      for (let i = 0; i < slides.length; i++) {
        btn.textContent = `Страница ${i + 1} из ${slides.length}…`;
        const c = slides[i].cloneNode(true); c.style.zoom = '1'; c.style.boxShadow = 'none';
        box.replaceChildren(c);
        await Promise.all([...c.querySelectorAll('img')].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
        const canvas = await window.html2canvas(c, { width: 1920, height: 1080, scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false });
        if (i) pdf.addPage([1920, 1080], 'landscape');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 1920, 1080);
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pdf.output('blob'));
      a.download = `КП — ${p.client}.pdf`.replace(/[\\/:*?"<>|]+/g, ' ');
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      toast('PDF сохранён');
    } catch (er) { toast('Ошибка PDF: ' + er.message + '. Можно сохранить через «Печать».', 8000); }
    finally { box.remove(); btn.disabled = false; btn.textContent = was; }
  }

  // ---------- настройки ----------
  function viewSettings() {
    const s = store.settings;
    const inp = (k, label, type = 'text', ph = '') => `<label class="l">${label}</label><input type="${type}" data-s="${k}" value="${esc(s[k] ?? '')}" placeholder="${esc(ph)}">`;
    app.innerHTML = `<div class="top"><button class="btn" data-a="back">← Список</button><h1>Настройки</h1></div><div class="wrap" style="max-width:760px">
      <div class="card-b"><h3 style="margin-top:0">Google-таблица с ценами</h3>${inp('sheetUrl', 'Ссылка на таблицу (доступ «все, у кого есть ссылка — просмотр»)', 'text', 'https://docs.google.com/spreadsheets/d/…')}
      <p class="muted">Каждый лист — один проект (имя листа = «лист таблицы» в КП, по умолчанию название клиента). Структуру блоков с тарифами и доп. расходами админка определяет сама.</p>
      <label class="row" style="margin-top:12px"><span class="sw"><input type="checkbox" data-s="autoSync" data-t="bool" ${s.autoSync ? 'checked' : ''}><i></i></span><span class="g">Подтягивать цены автоматически при выгрузке в PDF</span></label>
      <button class="btn" style="margin-top:12px" data-a="testSheet">Проверить таблицу</button></div>
      <div class="card-b"><h3 style="margin-top:0">Рассрочка</h3>${inp('installRules', 'Правила: «сумма до : месяцев», через запятую (inf — всё что выше)')}${inp('installMin', 'Минимальная сумма для рассрочки, ₽', 'number')}</div>
      <div class="card-b"><h3 style="margin-top:0">GitHub: хранение данных</h3><p class="muted">Лучше отдельный <b>приватный</b> репозиторий для данных. Токен: Fine-grained PAT с правом Contents: read/write только на него. Хранится только в вашем браузере.</p>
      ${inp('ghOwner', 'Владелец (логин)')}${inp('ghRepo', 'Репозиторий')}${inp('ghBranch', 'Ветка')}${inp('ghPath', 'Файл данных')}${inp('ghToken', 'Токен', 'password')}
      <button class="btn" style="margin-top:12px" data-a="testGh">Загрузить данные из GitHub</button></div></div>`;
    app.onchange = null;
    app.oninput = (e) => { const k = e.target.dataset.s; if (k) store.saveSettings({ [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? num(e.target.value) : e.target.value.trim() }); };
    app.onclick = async (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      try {
        if (a === 'back') location.hash = '#/';
        if (a === 'testSheet') { const probe = { sheetTab: '', client: '', variants: [{ cms: 'test', sheetTab: '', tariffs: [] }], extras: [], syncEnables: false }; await KP.syncFromSheet(probe, store.settings); toast('Таблица читается ✓ ' + probe.variants[0].tariffs.map((t) => t.name).join(', ')); }
        if (a === 'testGh') { await store.githubPull(); toast('Данные загружены из GitHub ✓'); }
      } catch (er) { toast('Ошибка: ' + er.message, 7000); }
    };
  }

  store.init();
  route();
})();
