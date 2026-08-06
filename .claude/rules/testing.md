---
paths:
  - "src/**/__tests__/**"
  - "vitest.config.*"
---

# Tests

**Vitest 0.x, nicht 1.x** — wegen Vite-3-Kompatibilität. Tests liegen als `*.test.ts` in
`src/**/__tests__/`. `yarn test` (einmal), `yarn test:watch`.

Getestet wird, wo Fehler teuer waren: Store-Logik, Request-Schichten, pure Utils
(`playlistMove`, `shufflePicker`, Sync-Mathematik). **Reines Markup und CSS wird nicht
unit-getestet** — dort ersetzt die headless Screenshot-Verifikation den Test. Submit-,
FormData- und Fetch-Logik ist *nicht* „nur Markup".

Pflicht im selben PR: **Bugfix ⇒ Regressionstest**, der den Bug reproduziert (vor dem Fix rot,
danach grün). Neue Store-/Util-/Request-Logik ⇒ Vitest.

## ⚠️ `setValue()` auf `input[type=range]`

Der VTU-Helper feuert `input`, aber die Komponente sieht dabei den **alten** Wert — Tests
schlagen dann aus Gründen fehl, die nichts mit dem Code zu tun haben. Stattdessen:

```ts
element.value = String(x)
await input.trigger('input')
```

Vorbild: `dragTo()` in `LeftSidebar/NP/__tests__/Progress.test.ts`.

## ⚠️ `vi.resetModules()` ist mit Pinia unzuverlässig

Vitest 0.34 teilt Modul-Instanzen, und der Store-State des Vortests überlebt über eine zweite
Pinia-Kopie. **Kein Registry-Reset.** Stattdessen exportiert der betroffene Store einen
Test-Reset-Helper, der im `beforeEach` aufgerufen wird — Vorbild:
`__resetDeviceSyncTestState()` in `stores/devicesync.ts`.

## ⚠️ Quelltext-scannende Tests: `import.meta.glob(..., { as: "raw" })` liefert bei `.scss` LEER

Es gibt hier mehrere Tests, die den Quelltext selbst prüfen, weil Prosa die Regel nicht gehalten
hat (`headerActionOrder`, `cardAnatomy`, `rowHover`, `queueSeamCensus`). Für `.vue` ist der Glob
richtig — der Test sieht genau
die Dateien, die der Build sieht. Für `.scss` **nicht**: Vite schickt Stylesheets erst durch die
CSS-Pipeline, und die ist unter Test ausgestubbt. Zurück kommt ein **leerer String** — kein
Fehler, kein `undefined`, nichts, woran man es merkt. Die erste Fassung von `cardAnatomy` prüfte
damit jede Karte gegen eine leere Selektorliste und war grün, obwohl der Bug noch drin war.

Stylesheets also mit `readFileSync` lesen, **relativ** (die cwd des Runners ist das
Projekt-Root):

```ts
const ANATOMY_FILE = "src/assets/scss/Global/cards.scss"   // nicht process.cwd(), nicht import.meta.url
```

Die beiden naheliegenderen Anker fallen aus: `process.cwd()` ist in Testdateien ein
**Lint-Fehler** (`no-undef` — die ESLint-Config gibt ihnen keine node-Umgebung), und
`import.meta.url` hinterlässt Vitests Transform in einer Form, die `fileURLToPath()` mit
`ERR_INVALID_ARG_TYPE` ablehnt.

**Und die eigentliche Lehre:** Ein Test, der Quelltext parst, schlägt beim Brechen seines
Parsers nicht fehl, sondern wird **still grün**. Er braucht deshalb Wächter über seine eigenen
Eingaben — „die Komponentenliste ist nicht leer", „die Selektorliste enthält einen bekannten
Treffer". Genau der zweite hat den leeren Glob oben gefunden. Zusätzlich einmal von Hand rot
stellen (die Zeile wieder entfernen, Test laufen lassen) und das Ergebnis in den PR schreiben.

## Realistische Fixtures

Backend-Formate nachbilden, nicht schönen: `image`-Strings mit `?pathhash=`-Suffix,
`image="None"` (String, truthy) für bildlose Playlists, Trackhash-Listen mit Orphans. Ein Test
mit geschöntem `hash.webp` hat einen echten Bug übersehen.
