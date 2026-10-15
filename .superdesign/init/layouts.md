# Layouts — shell & chrome

No separate layout components: each screen builds its own shell by `app.innerHTML = …` in `js/app.js`. Shared chrome is three patterns.

## 1. List shell (`viewList`, js/app.js:46)
File: `js/app.js` · `#/`
```html
<div class="top"><h1>Коммерческие предложения</h1>
  <input type="search" id="q" placeholder="Поиск по клиенту" style="width:260px">
  <span class="sp"></span> <!-- «Новое КП» .btn.pri, «Шаблон» .btn, «Настройки» .btn -->
</div>
<div class="wrap"> <!-- table.list of proposals --> </div>
<div class="row"><!-- sync buttons .btn.sm: Загрузить / Сохранить в GitHub, Экспорт JSON, Импорт JSON --></div>
```

## 2. Editor shell (`viewEditor`, js/app.js:83–96)
File: `js/app.js` · `#/p/:id`
```html
<div class="ed">
  <div class="top"><button class="btn" data-a="back">← Список</button> …  <span class="muted" id="saved">Автосохранение включено</span><span class="sp"></span> …</div>
  <div class="ed-body">
    <aside class="ed-side">            <!-- 500px, border-right -->
      <div class="tabs"><button data-tab="slides">Слайды</button><button data-tab="prices">Тарифы и цены</button></div>
      <div class="side-scroll" id="side"></div>   <!-- .sl rows: slide list / price panel -->
    </aside>
    <main class="ed-main">
      <div class="pv-wrap" id="pvw"><div class="pv" id="pv"></div></div>  <!-- 16:9 scaled slide preview -->
      <div class="fields" id="fields"></div>                             <!-- form for selected item -->
    </main>
  </div>
</div>
```
Preview scaling: `fitPreview()` sets `transform: scale()` on `.pv` to fit the 1920×1080 slide into `.pv-wrap`.

## 3. Print shell (`viewPrint`, js/app.js:220)
File: `js/app.js` · `#/print/:id`
```html
<div class="pbar"><button class="btn">← К редактору</button><b>{client}</b><span class="muted g">Готовлю…</span>
  <button class="btn pri">Печать → «Сохранить как PDF»</button></div>
<div class="pages"> <!-- .slide × N, each 1920×1080, zoom .55 on screen -->  </div>
```
Print: `.pbar`, `.top`, `.toast` hidden; `.slide` gets `break-after: page`; `@page 1920px 1080px`.

## Global overlays
- `ask(title,label,value)` — modal `.modal-bg > .modal` with input and «Отмена / Создать» (js/app.js:18).
- `KP.toast` — fixed bottom `.toast` (dark pill).
- `viewSettings` — `.top` + `.wrap` with max-width 760px (js/app.js:241).
