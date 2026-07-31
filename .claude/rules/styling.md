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
**2,4px-Strokes**, wo sie offen ist. Eine `svg path { fill: … }`-Regel **flutet die gestrichenen
Glyphen zu schwarzen Klecksen**. Deshalb liegt die Farbe überall auf `color`.

Die eine verbliebene Pauschal-Regel (Kontextmenü-Icons mit Legacy-Glyphen) überspringt Pfade mit
Stroke: `svg path:not([stroke])`. Neue Icons daher **immer** mit `stroke="currentColor"` auf
**jedem** `<path>` zeichnen, nicht auf einer `<g>` — sonst greift dieser Schutz nicht.

Größen mit `width`/`height` setzen, **nicht** mit `transform: scale()`: beim Skalieren hängt die
optische Größe am Füllgrad der jeweiligen viewBox (daher kam „Lyrics-Icon zu groß").

## Der Chrome-Satz: ein Raster, keine Kompensation (#311)

Seit #311 sind die Navigations- und Chrome-Glyphen (home, search, folder\*, bookmark\*, playlist\*,
chart, settings, album, artist, delete, plus, queue, more, expand, arrow\*, volume-\*, pin\*,
download, pencil, reload, devices, headphones, clock, a, square, check.filled) **ein** Satz:

- **24×24-Box, ~18 px optisches Glyph** (Ink von 3 bis 21), **2,4 px** Strich, runde Kappen und
  Ecken. 2 px war der erste Wurf und las sich neben den 3-px-Rahmen und der fetten Schrift dieses
  Designs zu dünn.
- `stroke="currentColor"` auf **jedem** `<path>` (siehe die Regel darüber).
- Füllung nur, wo die Form geschlossen ist (`*.fill`-Varianten, Notenkopf, Lautsprecher).

**Wer ein Icon ersetzt, zeichnet es auf dieses Raster** — sonst kommt die Kompensations-Mechanik
zurück, die #311 abgeräumt hat: `NavButtons.vue` trug sechs `--nav-k * (viewBoxSeite / Ink-Höhe)`-
Faktoren und `navitems.ts` ein `iconClass`-Feld, nur weil drei Fremdsätze ihre Box unterschiedlich
stark füllten (Bookmark ~92 %, Home/Ordner/Suche ~60–67 %, Chart ~79 %). Ein Satz = eine Größe.

Zwei Fallen beim Ersetzen eines Legacy-Glyphs:

- **Eine `fill`-Regel, die genau dieses Icon reparierte, wird zur Waffe.** Der Untermenü-Chevron
  hatte `svg path { fill: currentColor }`, weil `expand.svg` `#F2F2F2` hartcodierte — auf dem neuen,
  gestrichenen Chevron hätte dieselbe Regel einen schwarzen Keil ergeben. Beim Neuzeichnen also
  **nach der Kompensation suchen und sie mit entfernen**.
- **Ein Glyph kann anderswo als roher Pfad einkopiert sein.** `FolderCard.vue` trug eine private
  Kopie von `folder-1.svg` im Template, die keine Icon-Änderung je erreicht hätte.

## ⚠️ Ein Icon nicht mit `opacity` dämpfen, wenn es kein Zustand ist

Die Sidebar-Glyphen liefen unter `opacity: 0.75` — ein Rest aus der Zeit der gefüllten
SF-Symbols-Masse, wo das die Härte nahm. Auf 2,4-px-Strichen macht dieselbe Regel aus reiner Tinte
ein **mittleres Grau neben dem eigenen Label** (gemessen: `#17171A` bei 0,75 über Weiß landet bei
etwa `#515154`). Genau das kam als „die Icons wirken schwächer" zurück.

Die Regel dahinter: **`opacity` auf einem Glyph ist eine Zustandsaussage, keine Dekoration.**
Legitim sind deshalb nur `aux-off` (Shuffle/Repeat AUS, 0,45 — beide Transport-Reihen) und
Platzhalter-Glyphen in leeren Bildflächen. Der aktive Nav-Zustand trägt seine Aussage schon in der
Zeile (Blush-Fläche + Ink-Rahmen); das Glyph muss nicht zusätzlich flüstern.

Prüfen statt schätzen: das Glyph und sein Label im **selben** 4×-Element-Screenshot ansehen. Das
Label ist die eigene Referenz-Schwärze des Designs — nebeneinander sieht man den Unterschied
sofort, isoliert nie.

Zeichnerisch gilt: **abgesetzte Radialstriche lesen sich als Sonne, nicht als Zahnrad.** Die Zähne
von `settings.svg` beginnen deshalb *innerhalb* der Ring-Außenkante — und die Sonne ist in dieser
App der Theme-Toggle.

Neu gezeichnete Icons vor dem Commit **ansehen, nicht nur schreiben**: ein Kontaktbogen aus allen
Glyphen, hell und dunkel, bei 24/36/64 px, headless gerendert. Genau daran fiel das Zahnrad auf.

Noch im alten Stil (selten, einzeln, kein sichtbarer Stilbruch): `mic`, `paintbrush`, `tag`,
`calendar`, `explicit`, `lastfm`, `sdcard`, `symlink`, `grid`, `radio`, `sparkles`, `timer`,
`hifi`, `phone`, `image`, `info`, `eye*`, `logout`, `avatar`, `upload`, `lyrics*`, `add_to_queue`,
`add-to-queue`, `play-next`, `previous`, `heart*`.

## ⚠️ Der Inhalt läuft HINTER der Player-Bar — jeder Scroller reserviert sie

`#acontent` spannt die Grid-Zeilen 2–4 (`grid-row: 2 / 4`), damit der Memphis-Grund hinter der Bar
durchläuft und die Seite nicht in einer Naht endet. Die Konsequenz: die Bar überdeckt den unteren
Rand **jedes** Scroll-Containers, und jeder muss sich `$bottombarheight` (bzw.
`$bottombarheight-phone`) selbst reservieren.

`.content-page` tat das seit jeher, `.v-scroll-page .scroller` nicht — 4rem Reserve gegen eine
5,125rem hohe Bar, also lagen die letzten ~18 px der letzten Zeile darunter, auf dem Handy ~88 px
(#307). Betroffen war damit **jede** virtualisierte Seite, weil sie alle durch denselben Scroller
laufen. Die Höhe hat jetzt eine Quelle in `_variables.scss`; nicht wieder ausschreiben.

Beim Messen: **erst scrollen, bis die Liste nicht mehr wächst.** Ein einzelnes
`scrollTop = scrollHeight` löst den Infinite-Scroll-Sentinel aus, der nachlädt und den Boden
verschiebt — man misst dann eine Zeile, die gar nicht die letzte ist. Und eine Freiraum-Zahl
beweist nichts ohne Gegenprobe: den alten Wert im laufenden Browser zurücksetzen und zeigen, dass
er verdeckt wird (gemessen: 836 gegen Bar-Oberkante 818, mit Fix 754).

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

## ⚠️ Breakpoints lesen die Breite — bis auf einen

`content-width.ts` und die Mixins in `_mixins.scss` sind bis auf **eine** Ausnahme reine
`max-width`-Regeln. Ein quer gehaltenes Telefon ist aber **breit UND niedrig**: 844×390 fiel in
`isLargerMobile` (660–900) und bekam deshalb die reichere Leisten-Gruppe, während `isMobile`
zusätzlich die Navigationszeile einblendete. Die Höhe kam in keiner Bedingung vor.

Gemessen war das kein Schönheitsfehler: die Chrome ist ein **fester** Posten von 249 px — 30 %
eines 390×844-Bildschirms, aber **64 %** desselben Geräts gedreht (nutzbar 133 statt 579 px).
Dazu waren die drei Detail-Header (288/288/208 px) **höher als der ganze Inhaltsbereich**, ihre
eigene Aktionsreihe hing also unten heraus.

Die Ausnahme ist ein Paar, und **beide Hälften müssen synchron bleiben**:

| | |
|---|---|
| `isShort` in `content-width.ts` | `win_height <= 500 && win_width > win_height` |
| `@mixin shortViewport` in `_mixins.scss` | `(max-height: 500px) and (orientation: landscape)` |

**Die Orientierung gehört zwingend dazu.** Ein hochkant gehaltenes Tablet liegt in derselben
Breiten-Spanne (834 px) und ist nicht niedrig — ohne die zweite Hälfte verlöre es seine Leiste
mit. Der Test dazu (`stores/__tests__/shortViewport.test.ts`) prüft genau diesen Fall.

Zwei Dinge, die daran hängen:

- **Die Leiste im kurzen Viewport ist die PHONE-Leiste.** Die Bedingung steht als `phoneBar`
  einmal in `BottomBar/Left.vue` und wird dreimal gelesen. Wer nur einen der Zweige anfasst,
  baut die stille Sackgasse aus #326 wieder auf: ein Gerät, das mit `Actions` die Lautstärke
  verliert und den Unmute-Knopf nicht bekommt, ist stumm ohne Weg zurück.
- **Wer die Bar-Höhe ändert, ändert die Scroller-Reserve mit** (`$bottombarheight-short`) —
  siehe die Regel weiter unten: `#acontent` läuft hinter der Bar, jeder Scroller reserviert sie
  selbst.

⚠️ **Ein `min-height` ist ein Boden und will gelöst werden, nicht gesenkt** — und die Reihenfolge
im Block entscheidet: der `shortViewport`-Block im Playlist-Header stand zuerst **vor**
`.sqr_img`. Gleiche Spezifität, früher im Block ⇒ das 16rem-Cover gewann, und der Header stand bei
264 statt 127 px, obwohl `min-height` und Titelgröße nachweislich griffen. Solche Blöcke gehören
ans **Ende** ihres Selektors.

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
- **Eine Reihe von Buttons trifft von links nach rechts ein** — `@include btn-pop-stagger` auf das
  Element, dessen **direkte Kinder** die Buttons sind. `.header-actions` bindet es ein, der
  Sortier-Banner der Alben-/Künstlerliste ebenso. Die fünf `nth-child`-Regeln nicht abschreiben:
  genau das ließ den Banner als einzige Stelle elf Chips gleichzeitig aufploppen, während die
  Header-Reihe zwei Klicks weiter staffelte.
- **Was man nicht drücken kann, darf nicht wie ein Bedienelement erscheinen.** Der Pop ist die
  Aussage „hier ist ein Button aufgetaucht". Die beiden Etiketten des Sortier-Banners (`.tt`,
  `pointer-events: none`) leihen sich `btn-action` nur für die Platte und bekommen deshalb
  `animation: none`. Wer eine Rolle für reine Geometrie borgt, prüft, was er sich an Verhalten
  mitgeholt hat.
- Das Vokabular (Dauern, Kurven, Staffelung) steht in `_motion.scss`.

## Klick-Feedback

**Zeilen** (Nav, Playlists, gepinnte Alben, Ordner-Köpfe, Track-Zeilen) bekommen die
`v-wave`-Welle. **Buttons** bekommen das Press-Feedback ihrer Rolle und **keine** Welle — sonst
kämpfen zwei Effekte um dasselbe Element. Farbe und Dauer stehen **einmal** in `main.ts`
(`var(--mem-line)`, 0,35 s), nicht pro Aufrufstelle.

v-wave setzt `overflow: hidden` auf einen **inneren** Container und erbt den Radius vom Wirt —
Zeilenradius und absolut positionierte Drop-Marken bleiben also heil.

**Hover für Listenzeilen ist zentralisiert:** `candy-row-base` + `candy-row-hover` in
`_candy.scss`. Die Base-Hälfte ist Pflicht (reservierter transparenter Rand in `$candy-border-w`)
— ohne sie springt der Inhalt beim Hover, und genau deshalb hatten die Folder-Zeilen
(`border: none`) gar keinen Rahmen. „Flach" heißt bei Sidebar- und Queue-Zeilen **kein
Offset-Schatten**, nicht „kein Rahmen": gehoverte Zeilen sind überall gerahmt.

**Beide Hälften werden als Mixin genommen, nie von Hand ausgeschrieben.** Eine Zeile, die den
transparenten Rand selbst deklariert, behält zwar die Reservierung, verliert aber den Hinweis,
dass da ein Rahmen kommt — und das danebenstehende handgeschriebene
`&:hover { background-color: … }` sieht dann vollständig aus, obwohl es keinen Rahmen malt. Genau
so blieb der **Ordner-Kopf der Sidebar** die einzige Bibliotheks-Zeile ohne Rahmen, nachdem
Nav-Zeilen und Playlist-Zeilen schon gefixt waren — auffällig nur im direkten Vergleich mit der
Zeile eine Reihe darüber. Der Zensus dazu ist getestet
(`src/components/__tests__/rowHover.test.ts`): Er kennt jede Zeile, die eines der beiden Mixins
benutzt, verlangt für jede **beide** Hälften, und lässt in der Sidebar keine Hover-Regel durch,
die eine Zeilen-Fläche (`$candy-pink-soft`, `$mem-panel-static`, `$mem-blush-soft-static`) ohne
`candy-row-hover` setzt.

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

## ⚠️ Eine Trennlinie gehört der Textseite, nicht der Medienzelle

Ein `border-right` auf einem Element mit `border-radius` wird **entlang dieses Radius gezeichnet** —
auf einem runden Element also als Bogen, nicht als gerade Linie. In der Now-Playing-Quelle
(`PlayingFrom.vue`) trägt das Vorschaubild auf der **Artist**-Quelle `.circular`
(`border-radius: 10rem`), auf der Album-Quelle `rounded-sm` und beim Playlist-Fall gar keinen —
dieselbe Regel ergab drei verschiedene Bilder, und ausgerechnet der geprüfte Fall (Playlist,
eckiges Glyph-Feld) sah richtig aus.

Die Regel: **Die Linie zwischen zwei Zellen gehört an die Kante, deren Form man kennt.** Als
Geschwister-Paar formuliert (`img + .from-text, .from-icon + .from-text`), damit sie nur erscheint,
wenn wirklich etwas davorsteht — bei leerer Queue rendert `playingFrom()` weder Bild noch Glyph.

Allgemeiner: Eine Medienzelle kann ihre Form von einer Utility-Klasse bekommen, die die View gar
nicht setzt. Wer eine Kante auf so eine Zelle legt, prüft **jede** Quelle einzeln — Element-
Screenshot pro Variante, nicht nur die, die man gerade offen hat.

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
