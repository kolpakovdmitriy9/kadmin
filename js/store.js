/* Хранилище: localStorage + (опционально) синхронизация JSON-файла в GitHub-репозитории через API */
(function () {
  const KP = (window.KP = window.KP || {});
  const K_DATA = 'kp.data.v1';
  const K_SET = 'kp.settings.v1';

  const defaults = { sheetUrl: '', sheetTab: '', autoSync: true, ghOwner: '', ghRepo: '', ghBranch: 'main', ghPath: 'data/proposals.json', ghToken: '' };

  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { KP.toast && KP.toast('Не удалось сохранить в браузере: ' + e.message); } };

  const S = (KP.store = {
    settings: Object.assign({}, defaults, read(K_SET, {})),
    data: read(K_DATA, null),

    init() {
      if (!S.data) {
        S.data = { template: KP.templateDoc(), proposals: [KP.samplePage()] };
        S.persist();
      }
      if (!S.data.template) S.data.template = KP.templateDoc();
    },
    persist() { write(K_DATA, S.data); },
    saveSettings(patch) { Object.assign(S.settings, patch); write(K_SET, S.settings); },

    list() { return S.data.proposals.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')); },
    get(id) { return id === '__template__' ? S.data.template : S.data.proposals.find((p) => p.id === id); },
    touch(p) { p.updatedAt = new Date().toISOString(); S.persist(); },
    add(p) { S.data.proposals.push(p); S.persist(); },
    remove(id) { S.data.proposals = S.data.proposals.filter((p) => p.id !== id); S.persist(); },
    duplicate(id) {
      const src = S.get(id);
      const c = KP.newProposal(src.client + ' (копия)', src);
      c.sheetKey = src.sheetKey;
      S.add(c);
      return c;
    },

    exportJSON() { return JSON.stringify(S.data, null, 2); },
    importJSON(txt) {
      const d = JSON.parse(txt);
      if (!d || !Array.isArray(d.proposals)) throw new Error('В файле нет списка proposals');
      S.data = { template: d.template || S.data.template, proposals: d.proposals };
      S.persist();
    },

    // ---------- GitHub ----------
    _gh() {
      const s = S.settings;
      if (!s.ghOwner || !s.ghRepo || !s.ghToken) throw new Error('Заполните владельца, репозиторий и токен в «Настройках»');
      const base = `https://api.github.com/repos/${s.ghOwner}/${s.ghRepo}/contents/${s.ghPath.split('/').map(encodeURIComponent).join('/')}`;
      const headers = { Authorization: 'Bearer ' + s.ghToken, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
      return { base, headers, branch: s.ghBranch || 'main' };
    },
    async githubPull() {
      const { base, headers, branch } = S._gh();
      const r = await fetch(`${base}?ref=${encodeURIComponent(branch)}`, { headers });
      if (r.status === 404) throw new Error('Файл данных в репозитории ещё не создан — нажмите «Сохранить в GitHub»');
      if (!r.ok) throw new Error('GitHub: ' + r.status + ' ' + (await r.text()).slice(0, 160));
      const j = await r.json();
      const txt = decodeURIComponent(escape(atob(j.content.replace(/\n/g, ''))));
      S.importJSON(txt);
      S._sha = j.sha;
    },
    async githubPush() {
      const { base, headers, branch } = S._gh();
      let sha;
      const g = await fetch(`${base}?ref=${encodeURIComponent(branch)}`, { headers });
      if (g.ok) sha = (await g.json()).sha;
      const body = { message: 'KP admin: update data', branch, content: btoa(unescape(encodeURIComponent(S.exportJSON()))) };
      if (sha) body.sha = sha;
      const r = await fetch(base, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(body) });
      if (!r.ok) throw new Error('GitHub: ' + r.status + ' ' + (await r.text()).slice(0, 160));
    },
  });
})();
