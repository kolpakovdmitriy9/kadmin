# Components — UI primitives

Project has no component directory: primitives are CSS classes in `css/app.css` plus HTML built by JS. The primitives are small, so their full source is in `theme.md` (Part 2). Use these classes directly.

| Primitive | Class / markup | Source |
|---|---|---|
| Button | `.btn` · `.btn.pri` (gradient CTA) · `.btn.sm` · `.btn.ghost` · `.btn.dng` | css/app.css |
| Text input / select / textarea | bare `input[type=text|number|search]`, `select`, `textarea` (full width, 8px radius) | css/app.css |
| Field label | `label.l` (13px muted) | css/app.css |
| Data table | `table.list` with `th` uppercase 12px and row hover | css/app.css |
| Chip / tag | `.chip` · `.chip.off` (struck-through, disabled) | css/app.css |
| Card | `.card-b` (16px padding, 12px radius, border) | css/app.css |
| Toggle switch | `label.sw > input[type=checkbox] + i` (38×22 pill) | css/app.css |
| Tabs | `.tabs > button[.on]` (3px red underline) | css/app.css |
| List row (slide / tariff) | `.sl` · `.sl.sel` · `.sl.off` · `.sl.child` | css/app.css |
| Estimate table | `table.est-t`, `td.cost`, `.sum` | css/app.css |
| Modal | `.modal-bg > .modal` (420px) | css/app.css, js/app.js:18 |
| Toast | `.toast` (dark pill, bottom centre) | css/app.css, KP.toast |
| Row / stack | `.row` (flex gap 10px) · `.row>.g` (grow) | css/app.css |

Business-logic widgets (JS render functions): `formFor(item)`, `slidesPanel()`, `pricesPanel()` in js/app.js; `renderItem(item)` in js/slides.js.
