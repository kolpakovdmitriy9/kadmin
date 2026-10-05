(function () {
  const KP = window.KP;
  const { store, TYPES, expand, renderItem, esc, rub, tariffTotal, tariffHours, lineCost, num } = KP;
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

  // ---------- роутер ----------
  function route() {
    const [, name, id] = (location.hash || '#/').match(/^#\/([^/]*)\/?(.*)$/) || [];
    document.body.className = '';
    if (name === 'p') return viewEditor(decodeURIComponent(id));
    if (name === 'print') return viewPrint(decodeURIComponent(id));
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
    app.onclick = async (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const id = b.closest('tr')?.dataset.id;
      const a = b.dataset.a;
      try {
        if (a === 'new') {
          const name = await ask('Новое КП', 'Название клиента'); if (!name) return;
          const p = KP.newProposal(name, store.data.template); store.add(p); location.hash = '#/p/' + p.id;
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
      <span class="muted" id="saved">Автосохранение включено</span><span class="sp"></span>
      <button class="btn" data-a="gh">⬆ GitHub</button><button class="btn pri" data-a="pdf">Скачать PDF</button></div>
      <div class="ed-body"><aside class="ed-side"><div class="tabs"><button data-tab="slides">Слайды</button><button data-tab="prices">Тарифы и цены</button></div><div class="side-scroll" id="side"></div></aside>
      <main class="ed-main"><div class="pv-wrap" id="pvw"><div class="pv" id="pv"></div></div><div class="fields" id="fields"></div></main></div></div>`;

    // --- левая панель
    function renderSide() {
      $('.tabs').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ed.tab));
      $('#side').innerHTML = ed.tab === 'slides' ? slidesPanel() : pricesPanel();
      refreshComputed();
    }
    function snippet(s) { const f = s.fields || {}; return (f.title || f.kicker || f.text || '').toString().replace(/\n/g, ' ').slice(0, 44); }
    function slidesPanel() {
      const all = items();
      let h = '';
      p.slides.forEach((s, i) => {
        const T = TYPES[s.type]; if (!T) return;
        const mine = all.filter((x) => x.slide === s);
        const first = mine[0] ? mine[0].key : s.id;
        const cnt = T.generated ? ` · ${mine.filter((x) => !x.off).length} шт.` : '';
        h += `<div class="sl ${s.enabled ? '' : 'off'} ${mine.some((x) => x.key === ed.sel) || ed.sel === s.id ? 'sel' : ''}" data-a="sel" data-key="${first}">
          <label class="sw" title="Включить/выключить слайд"><input type="checkbox" data-a="tg" data-i="${i}" ${s.enabled ? 'checked' : ''}><i></i></label>
          <div class="nm">${i + 1}. ${esc(T.label)}${cnt}<small>${esc(snippet(s))}${T.figma ? ' · Figma ' + T.figma : ''}</small></div>
          <button class="btn sm ghost" data-a="up" data-i="${i}">↑</button><button class="btn sm ghost" data-a="dn" data-i="${i}">↓</button><button class="btn sm ghost" data-a="dupS" data-i="${i}" title="Дублировать">⧉</button><button class="btn sm ghost dng" data-a="delS" data-i="${i}">✕</button></div>`;
        if (T.generated) mine.forEach((x) => {
          const lab = T.generated === 'variant' ? x.v.cms : `${x.v.cms} · ${x.t.name}`;
          h += `<div class="sl child ${x.off ? 'off' : ''} ${ed.sel === x.key ? 'sel' : ''}" data-a="sel" data-key="${x.key}"><div class="nm">↳ ${esc(lab)}<small>${x.off ? 'выключено во вкладке «Тарифы и цены»' : ''}</small></div></div>`;
        });
      });
      h += `<div class="row" style="margin-top:14px"><select id="addType" class="g">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${esc(t.label)}</option>`).join('')}</select><button class="btn" data-a="addS">+ слайд</button></div>`;
      return h;
    }
    function pricesPanel() {
      let h = `<div class="card-b"><label class="l">Ключ проекта в Google-таблице (колонка «проект»)</label><input type="text" data-p="sheetKey" value="${esc(p.sheetKey || '')}" placeholder="${esc(p.client)}">
        <label class="row" style="margin-top:10px"><span class="sw"><input type="checkbox" data-p="syncEnables" data-t="bool" ${p.syncEnables ? 'checked' : ''}><i></i></span><span class="g muted">Таблица сама включает только те тарифы и варианты, что в ней есть</span></label>
        <button class="btn pri" style="margin-top:10px;width:100%" data-a="sync">↻ Обновить цены из таблицы</button></div>`;
      p.variants.forEach((v, vi) => {
        h += `<div class="card-b"><div class="row"><label class="sw"><input type="checkbox" data-p="variants.${vi}.enabled" data-t="bool" ${v.enabled ? 'checked' : ''}><i></i></label><input class="g" type="text" data-p="variants.${vi}.cms" value="${esc(v.cms)}" placeholder="CMS / вариант"><button class="btn sm ghost dng" data-a="delV" data-vi="${vi}">✕</button></div>`;
        v.tariffs.forEach((t, ti) => {
          const b = `variants.${vi}.tariffs.${ti}`;
          h += `<div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--line)"><div class="row"><label class="sw"><input type="checkbox" data-p="${b}.enabled" data-t="bool" ${t.enabled ? 'checked' : ''}><i></i></label>
            <input class="g" type="text" data-p="${b}.name" value="${esc(t.name)}"><input type="number" data-p="${b}.months" data-t="num" value="${t.months ?? ''}" style="width:64px" title="Месяцев рассрочки (0 — нет)"><button class="btn sm ghost dng" data-a="delT" data-vi="${vi}" data-ti="${ti}">✕</button></div>
            <div class="row" style="margin-top:6px"><span class="muted g">Итого без сметы (если строк нет)</span><input type="number" data-p="${b}.total" data-t="num" value="${t.total ?? ''}" style="width:130px" ${(t.estimate || []).length ? 'disabled' : ''}></div>
            <table class="est-t"><thead><tr><th>Этап</th><th>₽/ч</th><th>Часы</th><th>Фикс ₽</th><th></th><th></th></tr></thead><tbody>
            ${(t.estimate || []).map((l, li) => { const lb = `${b}.estimate.${li}`; return `<tr><td><input type="text" data-p="${lb}.name" value="${esc(l.name)}"></td><td><input type="number" data-p="${lb}.rate" data-t="num" value="${l.rate ?? ''}" style="width:66px"></td><td><input type="number" data-p="${lb}.hours" data-t="num" value="${l.hours ?? ''}" style="width:56px"></td><td><input type="number" data-p="${lb}.fixed" data-t="num" value="${l.fixed ?? ''}" style="width:76px"></td><td class="cost" id="c-${l.id}"></td><td><button class="btn sm ghost dng" data-a="delL" data-vi="${vi}" data-ti="${ti}" data-li="${li}">✕</button></td></tr>`; }).join('')}
            </tbody></table><div class="row" style="margin-top:6px"><button class="btn sm" data-a="addL" data-vi="${vi}" data-ti="${ti}">+ строка сметы</button><span class="g"></span><span class="sum" id="s-${t.id}"></span></div></div>`;
        });
        h += `<button class="btn sm" style="margin-top:12px" data-a="addT" data-vi="${vi}">+ тариф</button></div>`;
      });
      h += `<button class="btn" style="width:100%" data-a="addV">+ вариант (другая CMS)</button>`;
      return h;
    }
    function refreshComputed() {
      p.variants.forEach((v) => v.tariffs.forEach((t) => {
        (t.estimate || []).forEach((l) => { const c = $('#c-' + l.id); if (c) c.textContent = rub(lineCost(l)); });
        const s = $('#s-' + t.id); if (s) s.textContent = tariffTotal(t) ? `${tariffHours(t) ? tariffHours(t) + ' ч · ' : ''}${rub(tariffTotal(t))}` : '';
      }));
    }

    // --- превью и поля
    function fitPreview() {
      const w = $('#pvw'); const pv = $('#pv'); if (!w) return;
      pv.style.transform = `scale(${w.clientWidth / 1920})`;
    }
    function renderMain() {
      const it = curItem();
      const pv = $('#pv'), fields = $('#fields');
      if (!it) { pv.innerHTML = ''; fields.innerHTML = '<p class="muted">Для этого слайда нет данных: включите вариант/тариф и заполните смету во вкладке «Тарифы и цены».</p>'; return; }
      pv.innerHTML = renderItem(it); fitPreview();
      const T = it.type;
      fields.innerHTML = `<div class="card-b"><b>${esc(T.label)}</b>${T.generated ? '<div class="muted">Поля общие для всех страниц этого слайда; цифры берутся из вкладки «Тарифы и цены».</div>' : ''}` +
        T.fields.map((fd) => `<label class="l">${esc(fd.label)}</label>${fd.type === 'textarea' ? `<textarea data-f="${fd.key}">${esc(it.f[fd.key] ?? '')}</textarea>` : `<input type="text" data-f="${fd.key}" value="${esc(it.f[fd.key] ?? '')}">`}`).join('') + '</div>';
    }
    function repaint() { renderSide(); renderMain(); }
    function refreshPreviewOnly() { const it = curItem(); if (it) { $('#pv').innerHTML = renderItem(it); fitPreview(); } }

    // --- события
    const root = app;
    root.oninput = (e) => {
      const el = e.target;
      if (el.dataset.f) { const it = curItem(); it.slide.fields[el.dataset.f] = el.value; save(); refreshPreviewOnly(); renderSideTitlesOnly(); return; }
      if (el.dataset.p) {
        let v = el.type === 'checkbox' ? el.checked : el.value;
        if (el.dataset.t === 'num') v = el.value === '' ? '' : num(el.value);
        setPath(p, el.dataset.p, v);
        save(); refreshComputed(); refreshPreviewOnly();
        if (el.type === 'checkbox') repaint();
      }
    };
    function renderSideTitlesOnly() { if (ed.tab === 'slides') { const sc = $('#side').scrollTop; $('#side').innerHTML = slidesPanel(); $('#side').scrollTop = sc; } }
    root.onchange = (e) => {
      const el = e.target;
      if (el.dataset.a === 'tg') { p.slides[+el.dataset.i].enabled = el.checked; save(); repaint(); }
    };
    root.onclick = async (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) { ed.tab = tab.dataset.tab; renderSide(); return; }
      const b = e.target.closest('[data-a]'); if (!b || b.dataset.a === 'tg') return;
      const a = b.dataset.a; const i = +b.dataset.i; const vi = +b.dataset.vi, ti = +b.dataset.ti, li = +b.dataset.li;
      e.stopPropagation();
      try {
        if (a === 'back') location.hash = '#/';
        else if (a === 'pdf') location.hash = '#/print/' + p.id;
        else if (a === 'sel') { ed.sel = b.dataset.key; repaint(); }
        else if (a === 'up' && i > 0) { [p.slides[i - 1], p.slides[i]] = [p.slides[i], p.slides[i - 1]]; save(); renderSide(); }
        else if (a === 'dn' && i < p.slides.length - 1) { [p.slides[i + 1], p.slides[i]] = [p.slides[i], p.slides[i + 1]]; save(); renderSide(); }
        else if (a === 'dupS') { const c = JSON.parse(JSON.stringify(p.slides[i])); c.id = KP.uid(); p.slides.splice(i + 1, 0, c); save(); renderSide(); }
        else if (a === 'delS') { if (confirm('Удалить слайд из КП?')) { p.slides.splice(i, 1); save(); repaint(); } }
        else if (a === 'addS') {
          const type = $('#addType').value;
          const fields = {}; TYPES[type].fields.forEach((f) => (fields[f.key] = ''));
          if (type === 'payment') Object.assign(fields, { title: 'Порядок оплаты', stages: 'Предоплата | 1/3\nПо факту готовности дизайна | 1/3\nПо факту готовности сайта | 1/3', installmentLabel: 'Рассрочка на N месяцев' });
          if (type === 'estimate') Object.assign(fields, { title: 'Смета', packLabel: 'пакет T', headers: 'Этап работ|Стоимость часа, ₽|Кол-во часов|Стоимость, ₽' });
          const s = { id: KP.uid(), type, enabled: true, fields }; p.slides.push(s); ed.sel = s.id; save(); repaint();
        }
        else if (a === 'addV') { p.variants.push({ id: KP.uid(), cms: 'Новая CMS', enabled: true, tariffs: [{ id: KP.uid(), name: 'Базовый', enabled: true, months: 12, total: '', estimate: [] }] }); save(); renderSide(); }
        else if (a === 'delV') { if (confirm('Удалить вариант вместе с тарифами?')) { p.variants.splice(vi, 1); save(); repaint(); } }
        else if (a === 'addT') { p.variants[vi].tariffs.push({ id: KP.uid(), name: 'Новый тариф', enabled: true, months: 12, total: '', estimate: [] }); save(); renderSide(); }
        else if (a === 'delT') { if (confirm('Удалить тариф?')) { p.variants[vi].tariffs.splice(ti, 1); save(); repaint(); } }
        else if (a === 'addL') { p.variants[vi].tariffs[ti].estimate.push({ id: KP.uid(), name: '', rate: '', hours: '', fixed: '' }); save(); renderSide(); }
        else if (a === 'delL') { p.variants[vi].tariffs[ti].estimate.splice(li, 1); save(); repaint(); }
        else if (a === 'sync') {
          b.disabled = true; b.textContent = 'Загружаю…';
          try { const msg = await KP.syncFromSheet(p, store.settings); save(); toast(msg, 5000); } finally { repaint(); }
        }
        else if (a === 'gh') { store.touch(p); await store.githubPush(); toast('Сохранено в GitHub'); }
      } catch (er) { toast('Ошибка: ' + er.message, 7000); renderSide(); }
    };
    window.onresize = fitPreview;

    // старт
    const first = items()[0]; ed.sel = first ? first.key : null;
    repaint();
  }

  // ---------- печать / PDF ----------
  async function viewPrint(id) {
    const p = store.get(id);
    if (!p) { location.hash = '#/'; return; }
    document.title = 'КП — ' + p.client;
    app.innerHTML = `<div class="pbar"><button class="btn" data-a="back">← К редактору</button><b>${esc(p.client)}</b><span class="muted g" id="st">Готовлю…</span>
      <button class="btn pri" data-a="print">Печать → «Сохранить как PDF»</button></div><div class="pages" id="pages"></div>`;
    app.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a === 'back') location.hash = '#/p/' + p.id; if (a === 'print') window.print(); };
    let status = '';
    if (store.settings.autoSync && store.settings.sheetUrl && p.id !== '__template__') {
      try { status = await KP.syncFromSheet(p, store.settings); store.touch(p); }
      catch (er) { status = '⚠ Таблица не обновилась (' + er.message + ') — взяты сохранённые цифры.'; }
    }
    const pages = expand(p, false);
    $('#pages').innerHTML = pages.map(renderItem).join('');
    const ph = (JSON.stringify(pages.map((x) => x.f)).match(/ЗАМЕНИТЕ/g) || []).length;
    $('#st').textContent = `${pages.length} стр. ${status ? '· ' + status : ''} ${ph ? '· ⚠ заглушек «ЗАМЕНИТЕ»: ' + ph : ''} · В окне печати: поля «Нет», «Фоновая графика» включить`;
    if (/auto=1/.test(location.hash)) setTimeout(() => window.print(), 400);
  }

  // ---------- настройки ----------
  function viewSettings() {
    const s = store.settings;
    const inp = (k, label, type = 'text', ph = '') => `<label class="l">${label}</label><input type="${type}" data-s="${k}" value="${esc(s[k] ?? '')}" placeholder="${esc(ph)}">`;
    app.innerHTML = `<div class="top"><button class="btn" data-a="back">← Список</button><h1>Настройки</h1></div><div class="wrap" style="max-width:760px">
      <div class="card-b"><h3 style="margin-top:0">Google-таблица с ценами</h3>${inp('sheetUrl', 'Ссылка на таблицу (доступ «все, у кого есть ссылка — просмотр»)', 'text', 'https://docs.google.com/spreadsheets/d/…')}
      ${inp('sheetTab', 'Название листа (пусто — лист из ссылки / первый)')}
      <label class="row" style="margin-top:12px"><span class="sw"><input type="checkbox" data-s="autoSync" data-t="bool" ${s.autoSync ? 'checked' : ''}><i></i></span><span class="g">Подтягивать цены автоматически при выгрузке в PDF</span></label>
      <button class="btn" style="margin-top:12px" data-a="testSheet">Проверить таблицу</button></div>
      <div class="card-b"><h3 style="margin-top:0">GitHub: хранение данных</h3><p class="muted">Лучше отдельный <b>приватный</b> репозиторий для данных — цены клиентов не должны быть публичными. Токен: Fine-grained PAT с правом Contents: read/write только на этот репозиторий. Хранится только в вашем браузере.</p>
      ${inp('ghOwner', 'Владелец (логин)')}${inp('ghRepo', 'Репозиторий')}${inp('ghBranch', 'Ветка')}${inp('ghPath', 'Файл данных')}${inp('ghToken', 'Токен', 'password')}
      <button class="btn" style="margin-top:12px" data-a="testGh">Загрузить данные из GitHub</button></div></div>`;
    app.oninput = (e) => { const k = e.target.dataset.s; if (k) store.saveSettings({ [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value.trim() }); };
    app.onclick = async (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      try {
        if (a === 'back') location.hash = '#/';
        if (a === 'testSheet') { const dummy = { sheetKey: '', client: '', variants: [], syncEnables: false }; try { await KP.syncFromSheet(dummy, store.settings); } catch (er) { if (/нет строк для проекта/.test(er.message)) toast('Таблица читается ✓'); else throw er; } }
        if (a === 'testGh') { await store.githubPull(); toast('Данные загружены из GitHub ✓'); }
      } catch (er) { toast('Ошибка: ' + er.message, 7000); }
    };
  }

  store.init();
  route();
})();
