# gallery-motion

3D-галерея постеров на WebGL (three.js лежит в `vendor/`, без CDN и без сборки). Длительность 8,85 с, петля бесшовная
(старт и финал — маленький кластер карточек в центре).

Сюжет: карусель карточек разворачивается из точки → постеры по очереди «вытекают» из кружков-миниатюр сверху →
схлопывание в маленькую карточку → разлёт вращающегося 3D-кластера → сжатие обратно.

## Встраивание на сайт

```html
<div id="gm" style="width:100%;aspect-ratio:4/3"></div>
<script type="module">
  import { mountGalleryMotion } from '/gallery-motion/gallery-motion.js';
  mountGalleryMotion(document.getElementById('gm'), {
    images: ['/img/1.jpg', '/img/2.jpg', '/img/3.jpg', '/img/4.jpg', '/img/5.jpg', '/img/6.jpg', '/img/7.jpg', '/img/8.jpg'],
    title: ['Gallery', '+ Motion']
  });
</script>
```

Файлы нужно отдавать по HTTP(S): ES-модули не работают с `file://`. Локально: `python3 -m http.server` в корне сайта.

## Опции
| опция | по умолчанию | что делает |
|---|---|---|
| `images` | встроенные процедурные постеры | ровно 8 своих картинок; первые 5 показываются слайдами, все 8 — в финальном кластере |
| `title` | `['Gallery', '+ Motion']` | две строки подписи слева сверху |
| `background`, `textColor` | `#111313`, `#f2f2f3` | цвета |
| `loop`, `autoplay` | `true`, `true` | зациклить / запускать сразу |

Возвращает `{ play, pause, seek(t), duration, destroy }`. Анимация ставится на паузу вне экрана, а при
`prefers-reduced-motion` показывает статичный кадр. `seek(t)` даёт детерминированный кадр (удобно для рендера в видео).

Постеры в `posters.js` нарисованы с нуля, референс не копировался.
