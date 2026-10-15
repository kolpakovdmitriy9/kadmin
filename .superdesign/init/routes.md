# Routes — hash router (js/app.js:32)

Single-page, hash-based (`location.hash`). No history API. Static hosting (GitHub Pages).

| Hash | View fn | File | Purpose |
|---|---|---|---|
| `#/` (default) | `viewList()` | js/app.js:46 | List of КП, search, GitHub sync, JSON import/export |
| `#/p/__template__` | `viewEditor('__template__')` | js/app.js:83 | Edit the shared template |
| `#/p/:id` | `viewEditor(id)` | js/app.js:83 | Editor: slides tab + tariffs/prices tab + live preview |
| `#/print/:id` | `viewPrint(id)` | js/app.js:220 | Renders all slides at 1920×1080 for «Сохранить как PDF» |
| `#/settings` | `viewSettings()` | js/app.js:241 | Settings: GitHub data repo + token, installment rules |

Slide data pipeline (js/slides.js):
- `STATIC` (js/slides.js:203) — static slide images from `assets/*.jpg`/`.webp` (team, about, benefits, mistakes, timeline, tech, etc.).
- `TYPES` (js/slides.js:210) — dynamic slide types (cover, CMS tariffs: compare/payment/estimate, extra costs, term).
- `expand()` builds the ordered slide list; `renderItem()` returns the slide HTML.

Other files: `js/store.js` (localStorage store), `js/seed.js` (sample data + default template), `js/sheets.js` (Google Sheets import, price parsing), `css/app.css` (UI), `css/slides.css` (slide base).

Pages to map for design work: `#/` list, `#/p/:id` editor, `#/print/:id` print/PDF, `#/settings`.
