# Extractable components

Category `basic` = UI primitive in css/app.css. Category `layout` = shell/chrome. Props are the parts that vary per page.

## Button
- Source: `css/app.css` (`.btn`)
- Category: basic
- Description: Standard, primary (gradient) and small/ghost/danger variants.
- Extractable props: variant (`default|pri|ghost|dng`), size (`sm|md`), label
- Hardcoded: radius 10px, gradient colours, border colour tokens

## Chip
- Source: `css/app.css` (`.chip`)
- Category: basic
- Description: Small red pill label, optionally struck through when disabled.
- Extractable props: label, off (boolean)
- Hardcoded: colour mix 12%, radius 99px

## Card
- Source: `css/app.css` (`.card-b`)
- Category: basic
- Description: Bordered card with 16px padding, used for grouped form sections.
- Extractable props: title, body (slot)

## Toggle (sw)
- Source: `css/app.css` (`.sw`)
- Category: basic
- Description: iOS-style checkbox switch.
- Extractable props: checked (boolean), name

## Top bar
- Source: `js/app.js` (`.top` markup in viewList / viewEditor / viewSettings)
- Category: layout
- Description: Sticky header with back button, title, spacer and action buttons.
- Extractable props: title, backHref, actions (array of buttons)
- Hardcoded: 14px 28px padding, card background, bottom border

## Editor side panel
- Source: `js/app.js` viewEditor (`.ed-side`, `.tabs`, `.side-scroll`)
- Category: layout
- Description: 500px left column with Слайды/Тарифы tabs and a scrollable list.
- Extractable props: activeTab (`slides|prices`), items (array of `.sl` rows), selectedIndex

## Slide list row
- Source: `css/app.css` (`.sl`)
- Category: basic
- Description: Selectable row with name and small caption, can be off or child.
- Extractable props: name, caption, selected, off, child

## Preview frame
- Source: `css/app.css` (`.pv-wrap`, `.pv`) + `js/app.js` `fitPreview()`
- Category: layout
- Description: 16:9 box that scales the 1920×1080 slide to fit.
- Extractable props: slideHtml
