# Pages — key screens and dependency trees

Vanilla JS. "Dependencies" are script load order from index.html and the functions each view calls.

## List `#/` (viewList, js/app.js:46)
Entry: `index.html` → `js/app.js`
- `js/store.js` — `store.data.proposals`, `store.add/duplicate`
- `js/seed.js` — `KP.newProposal`, default template
- `js/app.js` — `summary(p)`, `fmtDate`, `ask()` modal
- `js/sheets.js` — pull/push GitHub data
- `css/app.css` — `.top`, `table.list`, `.btn`

## Editor `#/p/:id` (viewEditor, js/app.js:83)
Entry: `js/app.js`
- `js/slides.js` — `expand()`, `renderItem()`, `TYPES`, `STATIC`, `termText`
  - `STATIC` images: `assets/*.jpg|webp`, `assets/logo.svg`, `assets/fonts/*`
- `js/store.js` — autosave on change (`#saved`)
- `js/sheets.js` — price refresh from Google Sheets
- `js/app.js` — `slidesPanel()`, `pricesPanel()`, `formFor()`, `fitPreview()`
- `css/app.css` (`.ed*`, `.sl`, `.tabs`, `.pv-wrap`, `.est-t`) + `css/slides.css` (`.slide`)

## Print / PDF `#/print/:id` (viewPrint, js/app.js:220)
- `js/slides.js` — `renderItem()` per slide
- `css/slides.css` — `.slide` 1920×1080, `@page`
- `css/app.css` — `.pbar`, `.pages`, `@media print`

## Settings `#/settings` (viewSettings, js/app.js:241)
- `js/store.js` — settings object, GitHub token (localStorage)
- `css/app.css` — `.wrap` 760px, `.card-b`, `label.l`

Skipped: 404 / offline (none exist).
