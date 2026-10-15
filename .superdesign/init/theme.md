# Theme — КП · админка (Вебтех)

## Part 1 — Compact token summary

Stack: static HTML/CSS/vanilla JS, no framework, no build step, no Tailwind. Light/dark via `prefers-color-scheme` only.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f6f6f7` | `#121214` |
| `--card` | `#fff` | `#1b1c1f` |
| `--ink` | `#17181a` | `#f1f1f3` |
| `--mut` | `#6b6f76` | `#9a9da5` |
| `--line` | `#e3e4e8` | `#2c2e33` |
| `--red` (accent) | `#ee2d17` | same |
| `--red2` (gradient start) | `#ff5a47` | same |

- Primary button: `linear-gradient(135deg,#ff5a47,#ee2d17)`, white text.
- Font UI: `'Onest','Inter',system-ui,Arial,sans-serif`, 15px / 1.45. Google Fonts Onest 400/500/600.
- Slide font: `'Atyp Display'` (local `assets/fonts/AtypDisplay-{Regular,Medium,Semibold}.ttf`), fallback Onest. Slide text colour `#151515`.
- Type scale in UI: h1 18px/600 (top bar), table headers 12px uppercase, muted 13px.
- Radii: 8px inputs, 10px buttons, 12px cards/tables, 14px modal, 99px chips, 10px preview frame.
- Shadows: preview `0 8px 30px rgba(0,0,0,.18)`; modal bg `rgba(0,0,0,.45)`.
- Spacing: `.wrap` padding 28px, max-width 1180px; `.top` padding 14px 28px; `.ed-main` padding 22px.
- Breakpoints: none defined. Editor is a fixed 500px side panel + fluid main.
- Slide canvas: 1920×1080 px, print `@page` 1920px 1080px.

## Part 2 — Raw source

### css/app.css (full)
```css
:root{--bg:#f6f6f7;--card:#fff;--ink:#17181a;--mut:#6b6f76;--line:#e3e4e8;--red:#ee2d17;--red2:#ff5a47}
@media (prefers-color-scheme:dark){:root{--bg:#121214;--card:#1b1c1f;--ink:#f1f1f3;--mut:#9a9da5;--line:#2c2e33}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 'Onest','Inter',system-ui,Arial,sans-serif}
button,input,select,textarea{font:inherit;color:inherit}
a{color:var(--red)}
.top{display:flex;align-items:center;gap:14px;padding:14px 28px;background:var(--card);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
.top h1{font-size:18px;margin:0;font-weight:600}.top .sp{flex:1}
.btn{border:1px solid var(--line);background:var(--card);border-radius:10px;padding:8px 14px;cursor:pointer}
.btn:hover{border-color:var(--red)}
.btn.pri{background:linear-gradient(135deg,var(--red2),var(--red));color:#fff;border:0}
.btn.sm{padding:4px 10px;font-size:13px}.btn.ghost{border-color:transparent;background:none}
.btn.dng:hover{border-color:#d33;color:#d33}
.wrap{max-width:1180px;margin:0 auto;padding:28px}
input[type=text],input[type=number],input[type=search],input[type=password],textarea,select{width:100%;border:1px solid var(--line);background:var(--card);border-radius:8px;padding:8px 10px}
textarea{min-height:90px;resize:vertical}
input:focus,textarea:focus{outline:2px solid color-mix(in srgb,var(--red) 40%,transparent);border-color:var(--red)}
label.l{display:block;font-size:13px;color:var(--mut);margin:12px 0 4px}
table.list{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden}
table.list th,table.list td{padding:12px 14px;border-bottom:1px solid var(--line);text-align:left}
table.list th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut)}
table.list tr:hover td{background:color-mix(in srgb,var(--red) 4%,transparent)}
.chip{display:inline-block;padding:2px 10px;border-radius:99px;background:color-mix(in srgb,var(--red) 12%,transparent);color:var(--red);font-size:12px;margin-right:4px}
.chip.off{background:var(--line);color:var(--mut);text-decoration:line-through}
.row{display:flex;gap:10px;align-items:center}.row>*{flex:0 0 auto}.row>.g{flex:1}
.card-b{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:14px}
.muted{color:var(--mut);font-size:13px}
.ed{display:flex;flex-direction:column;height:100vh}
.ed-body{flex:1;display:flex;min-height:0}
.ed-side{width:500px;border-right:1px solid var(--line);background:var(--card);display:flex;flex-direction:column;min-height:0}
.tabs{display:flex;border-bottom:1px solid var(--line)}
.tabs button{flex:1;padding:12px;border:0;background:none;cursor:pointer;border-bottom:3px solid transparent;color:var(--mut)}
.tabs button.on{color:var(--ink);border-color:var(--red);font-weight:600}
.side-scroll{overflow:auto;padding:12px;flex:1}
.sl{display:flex;align-items:center;gap:8px;padding:8px 8px;border-radius:10px;cursor:pointer;border:1px solid transparent}
.sl:hover{background:color-mix(in srgb,var(--red) 5%,transparent)}
.sl.sel{border-color:var(--red);background:color-mix(in srgb,var(--red) 8%,transparent)}
.sl.off .nm{opacity:.45;text-decoration:line-through}
.sl .nm{flex:1;min-width:0;font-size:14px}.sl small{color:var(--mut);display:block;font-size:11px}
.sl.child{margin-left:34px;font-size:13px}
.ed-main{flex:1;overflow:auto;padding:22px}
.pv-wrap{width:100%;max-width:1100px;margin:0 auto 22px;aspect-ratio:16/9;position:relative;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.18);background:#fff}
.pv-wrap .pv{position:absolute;left:0;top:0;transform-origin:0 0}
.fields{max-width:1100px;margin:0 auto}
.sw{position:relative;width:38px;height:22px;flex:0 0 38px}
.sw input{opacity:0;width:100%;height:100%;position:absolute;margin:0;cursor:pointer;z-index:1}
.sw i{position:absolute;inset:0;background:var(--line);border-radius:99px;transition:.15s}
.sw i:after{content:'';position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.15s}
.sw input:checked+i{background:var(--red)}.sw input:checked+i:after{left:19px}
.est-t{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
.est-t th{font-weight:500;color:var(--mut);text-align:left;font-size:11px;padding:2px 4px}
.est-t td{padding:2px}
.est-t input{padding:4px 6px;font-size:13px}
.est-t td.cost{text-align:right;white-space:nowrap;padding-right:6px;color:var(--mut)}
.sum{display:flex;justify-content:space-between;font-weight:600;margin-top:8px}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#17181a;color:#fff;padding:10px 18px;border-radius:10px;z-index:99;max-width:80vw}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:50}
.modal{background:var(--card);padding:22px;border-radius:14px;width:420px}
.pbar{position:sticky;top:0;z-index:5;background:var(--card);border-bottom:1px solid var(--line);padding:12px 28px;display:flex;gap:14px;align-items:center}
.pages{padding:20px;display:flex;flex-direction:column;align-items:center;gap:20px}
@media screen{.pages .slide{zoom:.55;box-shadow:0 4px 20px rgba(0,0,0,.2)}}
@page{size:1920px 1080px;margin:0}
```

### css/slides.css (full, header + slide base)
```css
@font-face{font-family:'Atyp Display';font-weight:400;font-style:normal;font-display:swap;src:local('Atyp Display Regular'),local('AtypDisplay-Regular'),url('../assets/fonts/AtypDisplay-Regular.woff2') format('woff2'),url('../assets/fonts/AtypDisplay-Regular.woff') format('woff'),url('../assets/fonts/AtypDisplay-Regular.otf') format('opentype'),url('../assets/fonts/AtypDisplay-Regular.ttf') format('truetype')}
/* 500 and 600 weights: same pattern with AtypDisplay-Medium / -Semibold */
.slide{width:1920px;height:1080px;position:relative;overflow:hidden;box-sizing:border-box;font-family:'Atyp Display','Onest','Inter',Arial,sans-serif;color:#151515;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.slide .abs,.abs{position:absolute;box-sizing:border-box}
.slide img.abs{display:block}
```
