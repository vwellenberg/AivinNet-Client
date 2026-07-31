---
paths:
  - "src/assets/scss/**"
  - "src/**/*.scss"
  - "src/**/*.vue"
  - "vite.config.ts"
---

# Styling — Rollen, Schatten, Icons, Bewegung

Aussehen gehört in eine **Rolle**, nicht in die Komponente. Die fünf Rollen stehen in
[Global/_buttons.scss](../../src/assets/scss/Global/_buttons.scss): `btn-primary` · `btn-action` ·
`btn-quiet` · `btn-pill` · `btn-toggle-on`. Ein Button, der von Hand
`background: transparent; border: none; padding: 0` schreibt, ist fast immer ein übersehener Fall.

Wiederkehrendes UI-Element ⇒ geteilte Komponente (`src/components/shared/`) **oder** Rolle,
nicht pro View kopieren.

## ⚠️ Icons nie über `fill` einfärben — immer über `color`

Der Transport-/Chrome-Satz (play, pause, next, shuffle, repeat, repeat-one, lyrics, volume-*) ist
ein einheitlicher **24×24-Satz in `currentColor`**: gefüllte Körper, wo die Form geschlossen ist,
**2px-Strokes**, wo sie offen ist. Eine `svg path { fill: … }`-Regel **flutet die gestrichenen
Glyphen zu schwarzen Klecksen**. Deshalb liegt die Farbe überall auf `color`.

Die eine verbliebene Pauschal-Regel (Kontextmenü-Icons mit Legacy-Glyphen) überspringt Pfade mit
Stroke: `svg path:not([stroke])`. Neue Icons daher **immer** mit `stroke="currentColor"` auf
**jedem** `<path>` zeichnen, nicht auf einer `<g>` — sonst greift dieser Schutz nicht.

Größen mit `width`/`height` setzen, **nicht** mit `transform: scale()`: beim Skalieren hängt die
optische Größe am Füllgrad der jeweiligen viewBox (daher kam „Lyrics-Icon zu groß").

Legacy-Icons (Sidebar, Kontextmenü, Settings) sind weiterhin gemischt — manche `currentColor`,
viele hardcoded `#F2F2F2`/`white`.

## ⚠️ SVG-Icons abgeschnitten beim Verkleinern (viewBox)

`vite-svg-loader` nutzt SVGO, und `removeViewBox` aus `preset-default` **strippte den viewBox**.
Ohne viewBox skaliert das SVG seinen Inhalt nicht auf die CSS-Größe: es rendert in nativen
Koordinaten, und das SVG-eigene `overflow: hidden` schneidet alles ab, was über die kleinere
CSS-Box ragt. Symptom: Glyph unten abgeschnitten — in **jeder** Version, also kein Cache-Problem.

Fix liegt global in [vite.config.ts](../../vite.config.ts):
`svgLoader({ svgoConfig: { plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false } } }] } })`.

`getBoundingClientRect()` verrät das **nicht** — nur `getBBox()` (Glyph-Bounds in user units)
gegen die gerenderte svg-Höhe, oder ein hochauflösender Element-Screenshot
(`locator.screenshot()`, deviceScaleFactor 3).

## ⚠️ Hard-Shadow-System

`candy-shadow($x,$y)` malt den einzigen erlaubten Schatten: kein Blur, immer nach rechts-unten,
Farbe aus dem Theme-Token `--mem-shadow`. `candy-raised($x,$y,$press)` = Schatten +
Hover-Vertiefung + Press-in-den-Schatten.

- **Kacheln nehmen `$press: false`** — CSS-`:active` matcht auch **Vorfahren**, eine pressende
  Karte würde also bei jedem Klick auf ihren eigenen Play-Button hüpfen.
- Jeder `button` bekommt den Schatten global. **Wer einen Button flach macht, MUSS ihn in die
  Ausnahmeliste in [Global/basic.scss](../../src/assets/scss/Global/basic.scss) eintragen** —
  sonst schwebt ein Offset unter nichts (auf runden Buttons als Sichel sichtbar).
- Ein `transition`, das **nach** dem Mixin steht, überschreibt dessen Schatten-Transition —
  dann `box-shadow` mit auflisten.

Prüfen statt hoffen: `~/uitest/audit-shadows.js` läuft alle Routen in Desktop **und** Phone ab
und listet jeden transparenten Button, der noch einen Schatten wirft.

## ⚠️ Touch-Ziele: 44 px, Header-Aktionen haben EINE Anatomie

Sekundäre Aktionen in Seiten-Headern (Favorit, Pin, Download, Cover holen, Optionen, Edit,
Löschen) nehmen die Rolle **`btn-action`**: 2.75rem quadratisch, Panel-Fläche, Rahmen,
Offset-Schatten, 1.5rem-Glyph, `flex-shrink: 0`.

(Bis v1.5.1 hieß das `mem-header-action` in `_candy.scss`; **das Mixin gibt es seit #244 nicht
mehr** — wer danach sucht, sucht vergeblich.)

Die beiden Fallen dahinter:

1. **Ohne `flex-shrink: 0` quetscht eine Header-Reihe auf schmalen Phones ihre eigenen Buttons**
   (gemessen: 16×36 statt 40×40). Header-Reihen bekommen `flex-wrap: wrap`, und der Header eine
   `min-height` statt fixer `height` — sonst läuft die umgebrochene Reihe in den Inhalt darunter.
2. **Transparente Buttons erben aus der globalen Button-Basis statisches Ink.** Auf dem dunklen
   Ground waren Pin und Download schlicht **unsichtbar** → `color: $mem-content-text`.

Messen statt schätzen: `~/uitest/mobile-audit.js` listet pro Route × Theme alle interaktiven
Elemente < 44 px und jedes Element breiter als der Viewport. Legitim unter 44 px bleiben nur der
Slider-Track (der Knopf ist das Ziel) und Inline-Textlinks in Listenzeilen (die ganze Zeile ist
tappbar).

**Detail-Header haben eine feste Reihenfolge:** Play · Favorit · Pin · Zweitaktion · Overflow.
Es gibt **vier** davon — Album, Artist, Playlist und **Mix** (`Mixes/MixesHeader.vue`,
Route `/mix/:mixid`); der letzte wird beim Suchen leicht übersehen.

Die Reihe selbst ist die geteilte Klasse **`.header-actions`** in
[_button-classes.scss](../../src/assets/scss/Global/_button-classes.scss) — Flex, Gap, Wrap und
Staffel-Versatz. Eine neue Header-Reihe bekommt einfach die Klasse; es gibt **keine Liste mehr,
in die man sich eintragen müsste**.

**Reihenfolge und Vollständigkeit sind getestet**
(`src/components/__tests__/headerActionOrder.test.ts`): Ein Button am falschen Ende der Reihe oder
eine fünfte `.header-actions`-Reihe, die der Test nicht kennt, lässt die Suite rot laufen.

⚠️ **Eine geteilte Komponente nimmt ihre Rolle selbst.** `HeartSvg.vue` trug seine Maße lange von
Hand, also wiederholten Album- und Artist-Header wortgleich denselben Patch. Jetzt trägt die
Komponente eine Prop `btn_role` (`quiet` = blanker Glyph, `action` = Header-Platte). Neue
Varianten also als **Rollen-Prop an der Komponente**, nicht als Regel in der aufrufenden View.

## ⚠️ `aspect-ratio` braucht eine Dimension zum Auflösen

`aspect-ratio: 1.5` allein ergibt nichts — es braucht Höhe **oder** Breite. Früher kam die Höhe
unbemerkt aus der globalen Button-Basis (`button { height: 2.25rem }`); **seit #244 ist diese
Basis ein reiner Reset** und liefert sie nicht mehr. Wer nur eines der beiden Maße setzt, bekommt
ein Oval — bei `border-radius: 50%` eine Ellipse. Real passiert: `.heart-button` fiel von 54×36
auf 28×28, und der Now-Playing-Reglerknopf war eine liegende Ellipse, weil nur seine Höhe
überschrieben war.

## ⚠️ Sass wertet NICHTS innerhalb eines Custom-Property-Werts aus

`--btn-pop-delay: $motion-stagger * 3` landet **wörtlich** im Stylesheet — für Sass ist das ein
undurchsichtiges Token. Kein Build-Fehler, kein Lint-Befund, keine roten Tests: im Browser ist der
Wert einfach ungültig und der `var()`-Fallback greift. Immer interpolieren: `--x: #{$token * 3}`.
Real passiert bei #240 — der ganze Staffel-Effekt aus #279 wäre still gestorben.

## Bewegung

- **Die `animation`-Kurzform setzt `animation-delay` und `-fill-mode` zurück.** Die Button-Rollen
  schreiben die komplette Kurzform, und zwar aus einem **tieferen** Selektor, als eine Zeilen-Regel
  erreichen kann — ein `animation-delay` auf den Kindern einer Reihe wurde deshalb jedes Mal
  weggewischt (gemessen: 4 von 5 Buttons bei 0 s). Werte, die eine Rolle überleben sollen, gehören
  in eine **Custom Property**, die die Kurzform liest (`var(--btn-pop-delay, 0s)`).
- **`animation-fill-mode: backwards` ist erlaubt, `both` nicht.** `both` hält zusätzlich den
  **letzten** Frame, und ein Animations-`scale(1)` schlägt jedes deklarierte `transform` — Hover
  und Press wären in allen fünf Rollen still tot. `backwards` gilt nur *während* einer Verzögerung.
- Das Vokabular (Dauern, Kurven, Staffelung) steht in `_motion.scss`.

## Klick-Feedback

**Zeilen** (Nav, Playlists, gepinnte Alben, Ordner-Köpfe, Track-Zeilen) bekommen die
`v-wave`-Welle. **Buttons** bekommen das Press-Feedback ihrer Rolle und **keine** Welle — sonst
kämpfen zwei Effekte um dasselbe Element. Farbe und Dauer stehen **einmal** in `main.ts`
(`var(--mem-line)`, 0,35 s), nicht pro Aufrufstelle.

v-wave setzt `overflow: hidden` auf einen **inneren** Container und erbt den Radius vom Wirt —
Zeilenradius und absolut positionierte Drop-Marken bleiben also heil.

**Hover für Listenzeilen ist zentralisiert:** `candy-row-base` + `candy-row-hover` in
`_candy.scss`. Die Base-Hälfte ist Pflicht (reservierter transparenter 2px-Rand) — ohne sie
springt der Inhalt beim Hover, und genau deshalb hatten die Folder-Zeilen (`border: none`) gar
keinen Rahmen. Sidebar- und Queue-Zeilen bleiben bewusst flach.

## ⚠️ `:hover` latcht auf Touch — nie zum Verstecken nutzen

Auf dem Handy bleibt der Hover-Zustand nach dem ersten Tap hängen. Die mobile Seek-Bar hatte
genau das: `.b-bar:hover #progress::-webkit-slider-thumb { display: none }` — der Knopf verschwand
also, sobald man ihn anfasste. Für Drag-Controls gilt: sichtbarer Knopf, Touch-Größe
(`range-geometry` auf dem Wrapper) und **`touch-action: none`** auf dem Input, sonst frisst der
Page-Scroll die horizontale Geste.

## ⚠️ Regler-Geometrie hat EINE Quelle

`range-geometry($h, $thumb)` in `_candy.scss` setzt `--range-h` (Leistenhöhe), `--range-thumb`
(Knopfdurchmesser) und das daraus abgeleitete `--range-track`. Die Zentrierung wird **berechnet**,
nicht geraten — ein fester `margin-top` kann nur zu genau einem Paar aus Leiste und Knopf passen,
und es gab vier.

Die Variablen gehören auf den **Wrapper** (`.progress-wrap`), nicht auf den `input`: der
Textur-Overlay ist ein *Geschwister* des Inputs und sieht dort gesetzte Werte nie.
`ProgressBar.scss` liest nur noch, immer mit Fallback.

⚠️ **Eine Knopf-Messung ist blind für Geschwister-Overlays.** Ein `margin-top` auf dem
Regler-`input` bläht den Wrapper auf (Inline-Block: die Margin-Box zählt zur Zeilenbox), ohne die
Mitte des Inputs mitzubewegen → Knopf und Overlay 7 px auseinander, während jede Knopf-Messung
±0,00 px meldet. **Abstände gehören auf den Wrapper.**

## Weitere Fallen

- **CSS-Spezifität statt `!important`.** `.b-bar .with-time button{background:transparent}` (0,2,1)
  schlug `.hotkeys .play` (0,2,0) → weißer Play-Kreis wurde transparent. Fix an der Quelle:
  `button:not(.play)`. Wenn ein Style nicht greift: computed style im Headless-Browser prüfen.
- **„Kasten/Box" um einen Detail-Header ist ein `box-shadow`, nicht der Verlauf.** Der abgerundete
  Schatten-Kasten kam vom `.album-header-ambient`-Element, nicht vom Hintergrund; mehrere Anläufe
  scheiterten, weil sie am Verlauf suchten. Allgemein: ein gerundeter Rahmen oder Halo ohne
  sichtbaren Fill ist fast immer ein `box-shadow`.
- **Layout-Grid:** `#app-grid` Zeilen `max-content minmax(0,1fr) 5.125rem` — `minmax(0,...)` ist
  kritisch, sonst schiebt eine hohe Sidebar die Bottom-Bar aus dem Viewport.
- **Farbsystem:** `setColorsToStore` wählt die *dominante* Farbe (nicht die gesättigtste),
  `getTextColor` entscheidet luminanz-basiert. Der Seiten-Verlauf ist **zentral** in
  [`pageGradient()`](../../src/utils/colortools/pageGradient.ts) — nicht pro View duplizieren.
- **Brand-Farben haben eine Quelle:** `src/brand-colors.json`. Nicht hardcoden.
