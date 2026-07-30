# SubspaceRadio-Client (AivinNet)

Vue.js 3 Webclient für AivinNet — Fork von [swingmx/swingmusic](https://github.com/swingmx/swingmusic).

## Projekt-Setup

- **Repo:** https://github.com/vwellenberg/SubspaceRadio-Client
- **Stack:** Vue 3, Pinia, TypeScript, SCSS, Vite 3, yarn
- **Backend:** https://github.com/vwellenberg/SubspaceRadio
- **Lokal deployed nach:** `~/.config/swingmusic/client/` auf Server 192.168.0.4

## Entwicklung

```powershell
# Dependencies installieren
yarn install

# Dev-Server starten
yarn dev

# Lint (auto-fix)
yarn lint

# Lint (nur prüfen, kein fix — für CI)
yarn lint:check

# Tests
yarn test
yarn test:watch

# Build
yarn build
```

## Branch-Workflow (verbindlich — keine Ausnahmen)

**Strikte Pflicht:** Jede Code-/Doc-Änderung läuft über **eigenen Worktree + dedizierten Branch + PR**. **Niemals direkt auf `master` committen oder pushen** — auch nicht für „nur eine Kleinigkeit".

Pro Aufgabe/Issue:
1. **Worktree + dedizierter Branch** von `origin/master`:
   `git worktree add -b <prefix>/<slug> ../_wt-<slug> origin/master`
   - **Immer ein frischer Branch pro Aufgabe** — nie auf `master`, nie auf einem fremden/alten Branch weiterarbeiten.
   - **Branch-Name mit geläufigem Prefix** (Conventional-Commits-Stil):
     - `feat/` — neues Feature / sichtbare Funktion
     - `fix/` — Bugfix / Korrektur
     - `refactor/` — Umbau ohne Verhaltensänderung
     - `style/` — reines CSS/Formatting ohne Logikänderung
     - `docs/` — nur Doku (README, CLAUDE.md, Kommentare)
     - `chore/` — Tooling / Deps / Config / Version-Bump
     - `test/` — nur Tests · `perf/` — Performance
   - Slug knapp + sprechend, optional Issue-Nr.: `fix/34-drawer-glow`, `feat/track-edit`.
2. **Implementieren** im Worktree (nie im Hauptverzeichnis auf `master`).
   - **Tests gehören in denselben PR (Pflicht):** Bugfix ⇒ **Regressionstest**, der den Bug reproduziert (vor dem Fix rot, danach grün) — kein Bugfix-PR ohne Test. Neue Store-/Util-/Request-Logik ⇒ Vitest in `src/**/__tests__/`. Realistische Fixtures verwenden (Backend-Formate wie `image`-Strings mit `?pathhash=`-Suffix, `image="None"` etc.). Reines CSS/Markup ist die Ausnahme — dort ersetzt die headless Screenshot-Verifikation (Schritt 6) den Test; Submit-/FormData-/Fetch-Logik ist NICHT „nur Markup".
3. **PR** öffnen → **Self-Review** (`/code-review`), Findings fixen, erneut prüfen — bis sauber.
4. **CI grün abwarten** (Lint/Tests/Build).
5. **Autonom (squash) mergen**, sobald Review sauber: `gh pr merge --repo vwellenberg/AivinNet-Client --squash --delete-branch --auto` — `--auto` merged automatisch, sobald die Required Checks grün sind. Keine Rückfrage, kein Review-Zwang.
6. **Deploy von `master`** + verifizieren (bei UI: Headless-Screenshot), dann **Worktree entfernen** (`git worktree remove`) + lokalen Branch löschen.

- Kein `dev`-Branch (Branches gehen direkt von `master` aus).
- **`master` ändert sich laufend = normal und gewollt:** jeder gemergte PR bewegt `master`. Das ist KEIN Zeichen für Direkt-Commits, sondern der vorgesehene Fluss (Worktree → Branch → PR → Merge).

### Mehrere Agents parallel
- **Vor jedem Merge `git fetch` + `origin/master`-Stand prüfen.** Bei `BEHIND`: `git rebase origin/master`, Konflikte lösen (häufig die `package.json`-Version → auf nächste freie Patch-Version ziehen).
- **Footprint klein halten**, Branch klar benennen, zügig mergen (kurzes offenes Fenster = weniger Konflikte).
- **Gleiche Dateien nicht gleichzeitig** anfassen (v.a. Theming wie `lauflicht.scss`, geteilte Komponenten/Mixins) — sonst Merge-Konflikte und sich überschreibende Design-Entscheidungen. Bei absehbarer Überlappung Bereiche/Lanes informell abgrenzen.

## CI

GitHub Actions laufen (Lint/Tests/Build) und **gaten den Merge** — Branch Protection auf `master` erzwingt diese drei Checks als Required (`strict:false`, kein Review-Zwang, `enforce_admins:false`). Zusätzliches Qualitäts-Gate ist das Self-Review oben:
- **Lint** — ESLint (`yarn lint:check`)
- **Tests** — Vitest (`yarn test`)
- **Build** — Vite Build (`yarn build`)

Tests liegen in `src/**/__tests__/` als `*.test.ts`.

## Brand

```scss
$brand-red:    #FF284E;   // BCS-Rot
$brand-green:  #1D9E75;   // WAVENET-Grün
$brand-purple: #7F77DD;   // Frequenz
```

Definiert in `src/assets/scss/_variables.scss`. `$red` zeigt auf `$brand-red`.

## Architektur-Hinweise

- `SearchInput :on_nav="true"` in `NavBar.vue` beibehalten — nie durch Router-Link ersetzen
- Seiten-Verlauf (Album/Artist/PlaylistView): **zentral** über `pageGradient(colors.bg)` aus [src/utils/colortools/pageGradient.ts](src/utils/colortools/pageGradient.ts) — EIN gemeinsamer Spotify-Fade (vivider Top → `#121212`). Nicht pro View duplizieren.
- Logo-Ring (`::after` auf `.logo-orbit-wrapper`): `inset: 0`, kein Padding zwischen Ring und Icon
- Vitest 0.x (nicht 1.x) — Vite 3 Kompatibilität

## Server deployen

### Frontend (dieser Client)

```bash
# Server 192.168.0.4. Lokaler Ordner heisst noch SubspaceRadio-Client,
# auf Server + GitHub aber AivinNet-Client; systemd-Service heisst aivinnet.
ssh -i /c/Users/vwell/.ssh/id_ed25519 vwellenberg@192.168.0.4 \
  "cd ~/AivinNet-Client && NODE_OPTIONS='--dns-result-order=ipv4first' git pull -q && \
   NODE_OPTIONS='--dns-result-order=ipv4first' yarn build 2>&1 | tail -2 && \
   rm -rf ~/.config/swingmusic/client && cp -r dist ~/.config/swingmusic/client && \
   sudo -n systemctl restart aivinnet && echo deployed"
```

**Wichtig:** Server hat IPv6-Problem — git/yarn brauchen `NODE_OPTIONS='--dns-result-order=ipv4first'`. Nach jedem sichtbaren Deploy `package.json` version bumpen (wird unten in der Sidebar angezeigt).

### Backend ([SubspaceRadio](https://github.com/vwellenberg/AivinNet))

Liegt auf dem Server unter `~/AivinNet` und läuft via **denselben** systemd-Service `aivinnet`
(`ExecStart=/home/vwellenberg/.local/bin/uv run swingmusic --host 0.0.0.0`, Port 1970 — serviert
auch das gebaute Frontend aus `~/.config/swingmusic/client`).

```bash
ssh -i /c/Users/vwell/.ssh/id_ed25519 vwellenberg@192.168.0.4 \
  "cd ~/AivinNet && NODE_OPTIONS='--dns-result-order=ipv4first' git pull -q && \
   ~/.local/bin/uv sync && sudo -n systemctl restart aivinnet && \
   sleep 4 && systemctl is-active aivinnet"
```

**Gotchas:**
- **`uv` ist NICHT im PATH der nicht-interaktiven SSH-Shell** → vollen Pfad `~/.local/bin/uv` nutzen
  (oder `export PATH="$HOME/.local/bin:$PATH"`), sonst „uv: command not found".
- Health-Check: `journalctl -u aivinnet --since '1 min ago'` zeigt beim erfolgreichen Start
  „Loading tracks/albums/artists... Done!"; `curl -s -o /dev/null -w '%{http_code}' http://localhost:1970/` → 200.
- Backend ist ebenfalls ein **Fork** (origin `vwellenberg/AivinNet`, upstream `swingmx/swingmusic`) →
  `gh pr create` immer mit `--repo vwellenberg/AivinNet`. Issues liegen aber in **diesem** Client-Repo →
  Backend-PRs referenzieren mit „For vwellenberg/AivinNet-Client#N" (kein „Closes").

**JWT ohne Passwort minten** (für Endpoint-/Headless-Checks der eingeloggten App) — in `~/AivinNet`:
```bash
~/.local/bin/uv run python -c "from swingmusic.app_builder import app, config_jwt; from swingmusic.db.userdata import UserTable; from flask_jwt_extended import create_access_token; config_jwt(app); app.app_context().push(); print(create_access_token(identity=list(UserTable.get_all())[0].todict()))"
```
Dann als Cookie verwenden: `curl ... -H "Cookie: access_token_cookie=$TOKEN"`, bzw. in Playwright (`~/uitest`)
gegen `http://localhost:1970/#/<route>` (Hash-Routing).

## Learnings / Gotchas (für alle Agents)

- **⚠️ CODE-CURRENCY ZUERST PRÜFEN (vor jeder Analyse/Diagnose/Screenshot):** Immer verifizieren, dass auf dem **aktuellen** Code gearbeitet wird — an BEIDEN Stellen: (1) **Lokal**: `git fetch` + `git rev-list --left-right --count HEAD...origin/master`; bei Rückstand ff-syncen. (2) **Deployt/Live**: Server-Checkout-HEAD (`~/AivinNet-Client`) **und** deployter Build (`~/.config/swingmusic/client`) gegen `origin/master`. **Die Headless-Screenshot-Pipeline trifft die DEPLOYTE App** — die kann viele Commits hinterherhinken, auch wenn `master` aktuell ist (real passiert: Header an 6-Commits-alter App diagnostiziert, Pin noch rechts oben statt inline). Stale → erst syncen (lokal) bzw. aktuellen `master` deployen (mit User-OK), DANN diagnostizieren/screenshotten. Nie Mockups/Befunde von veraltetem Stand als „so ist es" präsentieren.
- **⚠️ SERVICE WORKER / STALE CACHE (ZUERST LESEN):** Wenn der User sagt „Fix sieht man nicht / UI noch alt", obwohl der Deploy nachweislich korrekt auf dem Server liegt → **fast immer ein Service Worker**, der alte vorgecachte Assets ausliefert. **Strg+Shift+R und „Cache löschen" umgehen einen Service Worker NICHT.** Symptom: Headless-Screenshot (kein SW) zeigt den Fix korrekt, aber der User-Browser nicht. Diagnose: `ls ~/.config/swingmusic/client | grep -iE 'sw|workbox'` + im sw.js auf alte `index.*.js`-Hashes prüfen. **Status quo: PWA/SW ist via `selfDestroying: true` in [vite.config.ts](vite.config.ts) abgeschaltet** — nicht ohne triftigen Grund reaktivieren. Falls ein User noch einen alten SW stecken hat: Chrome DevTools (F12) → Application → Storage → „Clear site data" → Tab neu laden (das entfernt den SW; ein normaler Reload reicht nicht). Dieses Problem trat mehrfach auf — bitte SOFORT daran denken, bevor man stundenlang am CSS sucht.
- **UI selbst prüfen (Headless-Screenshot):** Server hat unter `~/uitest` Playwright + Chromium. JWT ohne Passwort minten (App-Secret `serverId`):
  `uv run python -c "from swingmusic.app_builder import app, config_jwt; from swingmusic.db.userdata import UserTable; from flask_jwt_extended import create_access_token; config_jwt(app); app.app_context().push(); print(create_access_token(identity=list(UserTable.get_all())[0].todict()))"`.
  Dann `TOKEN=... CLIP=x,y,w,h OUT=/...png node shot.js` (setzt Cookie `access_token_cookie`, lädt `localhost:1970`), PNG runterladen + ansehen. **`debug.js`** liest computed styles aus (`page.$eval('.sel', el => getComputedStyle(el)...)`) — ideal für „warum greift mein CSS nicht".
  **`shot2.js`** ist die flexible Variante: `ROUTE=/playlist/3 MOBILE=1 THEME=dark W=390 H=844 OUT=… node shot2.js` (Hash-Route, iPhone-Profil mit Touch, Theme-Umschaltung über localStorage). **Für Mobile-Befunde immer `MOBILE=1`** — mit `hasTouch` greifen die `@media (hover: none)`-Zweige, und genau dort stecken die Touch-Bugs (z.B. dauerhaft sichtbare Play-Overlays).
- **CSS-Spezifitäts-Falle (Bottom-Bar):** `.b-bar .with-time button{background:transparent}` (0,2,1) schlug `.hotkeys .play` (0,2,0) → weisser Play-Kreis wurde transparent. Fix an der Quelle: `button:not(.play)`. Generell: wenn ein Style nicht greift, computed style im Headless-Browser prüfen, nicht blind `!important`.
- **⚠️ Icons NIE über `fill` einfärben — immer über `color` (v1.5.0):** Der Transport-/Chrome-Satz (play, pause, next, shuffle, repeat, repeat-one, lyrics, volume-*) ist ein einheitlicher **24×24-Satz in `currentColor`**: gefüllte Körper, wo die Form geschlossen ist, **2px-Strokes**, wo sie offen ist. Eine `svg path { fill: … }`-Regel **flutet die gestrichenen Glyphen zu schwarzen Klecksen** — deshalb liegt die Farbe überall auf `color` (Bars, aktive Aux-Box, Devices-Button). Die eine verbliebene Pauschal-Regel (Kontextmenü-Icons, die noch Legacy-Glyphen rendern) überspringt Pfade mit `stroke`: `svg path:not([stroke])`. Neue Icons daher **immer** mit `stroke="currentColor"` **auf jedem `<path>`** zeichnen (nicht auf einer `<g>`), sonst greift dieser Schutz nicht. Größen setzt man mit `width`/`height`, **nicht** mit `transform: scale()` — beim Skalieren hängt die optische Größe am Füllgrad der jeweiligen viewBox, und genau daher kam „Lyrics-Icon zu groß". Legacy-Icons (Sidebar, Kontextmenü, Settings) sind weiterhin gemischt: manche `currentColor`, viele hardcoded `#F2F2F2`/`white`.
- **⚠️ Hard-Shadow-System (v1.5.0):** `candy-shadow($x,$y)` malt den einzigen erlaubten Schatten (kein Blur, immer nach rechts-unten, Farbe = Theme-Token `--mem-shadow`: Ink auf Papier, weiches Papier auf Dunkel). `candy-raised($x,$y,$press)` = Schatten + Hover-Vertiefung + Press-in-den-Schatten. **Kacheln nehmen `$press: false`** — CSS-`:active` matcht auch **Vorfahren**, eine pressende Karte würde also bei jedem Klick auf ihren eigenen Play-Button hüpfen. Jeder `button` bekommt den Schatten global; **wer einen Button flach macht (`background: transparent; border: none`), MUSS ihn in die Ausnahmeliste in [Global/basic.scss](src/assets/scss/Global/basic.scss) eintragen** — sonst schwebt ein Offset unter nichts (auf runden Buttons als Sichel sichtbar). Prüfen statt hoffen: `~/uitest/audit-shadows.js` läuft alle Routen in Desktop **und** Phone ab und listet jeden transparenten Button, der noch einen Schatten wirft. Achtung: ein `transition`, das **nach** dem Mixin steht, überschreibt dessen Schatten-Transition — dann `box-shadow` mit auflisten.
- **⚠️ `aspect-ratio` verliert gegen die globale Button-Höhe:** `button { height: 2.25rem }` (Global/basic.scss) gilt auch für Icon-Buttons; eine explizite Höhe schlägt `aspect-ratio: 1`. Wer nur die **Breite** setzt (Karten-Play-Button 3.25rem, Download/Pin 2.5rem), bekommt ein **Oval** — bei `border-radius: 50%` eine Ellipse. Entweder `height: auto` (Breite führt) oder beide Maße setzen.
- **⚠️ SVG-Icons abgeschnitten beim Verkleinern (viewBox!):** `vite-svg-loader` nutzt SVGO, und `removeViewBox` (preset-default) **strippte den viewBox**. Ohne viewBox skaliert das SVG seinen Inhalt NICHT auf die CSS-Größe → es rendert in nativen Koordinaten (z.B. 28px) und das SVG-eigene `overflow:hidden` schneidet alles ab, was über die kleinere CSS-Box ragt. Symptom: Glyph unten abgeschnitten (war bei shuffle/repeat in der Bottom-Bar so, in JEDER Version — nicht Cache/SW!). **Fix liegt global in [vite.config.ts](vite.config.ts):** `svgLoader({ svgoConfig: { plugins:[{name:'preset-default',params:{overrides:{removeViewBox:false}}}] } })`. Bounding-Box-Messung (getBoundingClientRect) verrät das NICHT — nur `getBBox()` (Glyph-Bounds in user units) vs. gerenderte svg-Höhe, oder ein hochauflösender Element-Screenshot (`locator.screenshot()`, deviceScaleFactor 3).
- **Farbsystem (v0.5.x):** `setColorsToStore` wählt die *dominante* Farbe (nicht die gesättigtste), dunkelt via `darkenHex` ab (`colors.bg`/`bg2` = Hex). `getTextColor` luminanz-basiert (weiss/schwarz, nie blau). Seiten-Verlauf jetzt **zentral** in [`pageGradient()`](src/utils/colortools/pageGradient.ts) (Spotify-Fade: `vividTop(bg)` 0% → `bg` 32% → `#121212` 72%), von allen 3 Views genutzt.
- **⚠️ „Kasten/Box" um Detail-Header = `box-shadow`, NICHT der Verlauf:** Ein abgerundeter Schatten-Kasten um Album-/Playlist-Header kam vom `.album-header-ambient`-Element (`box-shadow: 0 .5rem 2rem colors.bg` + `rounded-lg`), **nicht** vom Hintergrund/Verlauf. Mehrere Anläufe scheiterten, weil sie am Verlauf/Background suchten. Der **Artist**-Header hatte ihn nie (rundes Bild → Element entfällt) → taugt als „sauberes" Vorbild. Element in #102 entfernt. **Merke:** bei „Box/Schatten um Header" zuerst `box-shadow` + absolute Ambient-Overlays prüfen (Toggle-Test `box-shadow:none` im Headless-Browser), nicht den Background. Allgemein: ein gerundeter Rahmen/Halo ohne sichtbaren Fill = fast immer ein `box-shadow`.
- **Layout-Grid:** `#app-grid` Zeilen `max-content minmax(0,1fr) 5.125rem` — `minmax(0,...)` ist kritisch, sonst schiebt eine hohe Sidebar die Bottom-Bar aus dem Viewport. Top-Bar (`nav`) full-width schwarz, Logo in `.topnav .left`.
- **Playlist `image="None"`:** Backend liefert für Playlists ohne eigenes Bild `image="None"` (String, truthy!). In der UI auf `pl.has_image` prüfen, nicht auf `pl.image`.
- **⚠️ NIE die geladene Tracklist als „ganze Liste" ans Backend senden.** `playlist.allTracks` enthält nur die **paginiert geladenen** Tracks (~38 von 993) und **niemals Orphan-Hashes**. Der alte `reorderTracks(pid, allTracks.map(t => t.trackhash))` traf ein `PUT /reorder`, das die gespeicherte Liste 1:1 ersetzt → ein Drag machte aus 120 Tracks **44** (Backend antwortete 200/„Done"). Ersetzt durch `movePlaylistTrack(pid, trackhash, beforeTrackhash)` → `PUT /move-track`, Anker per Trackhash statt Position: O(1)-Payload, Server macht die Chirurgie auf seiner eigenen Liste, Pagination und Orphans sind irrelevant (beide Anker sind immer geladen, weil ein Drag nur zwischen zwei gerenderten Zeilen passieren kann). `/reorder` lehnt Nicht-Permutationen jetzt mit 409 ab. Index-Arithmetik (Drop-Gap → finaler Index → Undo) liegt in `utils/playlistMove.ts` und ist gegen ein Modell des Server-Splices getestet — nicht inline in der View wiederholen.
- **Optimistische UI-Mutationen brauchen ein Rollback.** Bei fehlgeschlagenem Request die lokale Änderung zurücknehmen (`resolveMove().undo`), sonst behauptet die Liste eine Ordnung, die der Server abgelehnt hat. Achtung: die Undo-Argumente unterscheiden sich für Auf- vs. Abwärts-Move wegen der `to > from ? to - 1 : to`-Korrektur in `moveTrack`.
- **Zufall gehört nicht in einen Getter.** `queue.nextindex` speist auch den Next-Track-Audio-Preload und (im Group-Mode) den `track_change`-Broadcast — ein `Math.random()` im Getter liefert bei jedem Lesezugriff einen anderen Track. Muster: in einer **Action** würfeln (`rollShuffleNext`), Ergebnis in den State (`shuffleNextIndex`), Getter liest nur. Neu würfeln bei Track-Wechsel, Queue-Ersetzung (`tracklist.setNewList`) und Toggle.
- **⚠️ `:hover` latcht auf Touch — nie zum Verstecken nutzen.** Auf dem Handy bleibt der Hover-Zustand nach dem ersten Tap hängen. Die mobile Seek-Bar hatte genau das: `.b-bar:hover #progress::-webkit-slider-thumb { display: none }` — der Knopf verschwand also, sobald man ihn anfasste (dazu `pointer-events: none` auf `.center` und ein 1px-Track; die Bar war im Fork bewusst reine Deko). Für Drag-Controls gilt: sichtbarer Knopf, Touch-Größe (`--range-h`, ProgressBar.scss) und **`touch-action: none`** auf dem Input, sonst frisst der Page-Scroll die horizontale Geste.
- **⚠️ Scrubbing braucht einen eigenen Drag-State.** Der Range-Input ist an den Playhead gebunden, der mehrmals pro Sekunde tickt — ohne lokalen Drag-Zustand reißt jedes Re-Render den Knopf unter dem Finger zurück, und der gemalte Fill bleibt beim Playhead stehen. Muster in `Progress.vue`: `@input` setzt `scrub.active/value`, alle Anzeigen lesen `displayValue`, `change`/`click` beenden den Scrub und seeken.
- **⚠️ Vitest + `setValue()` auf `input[type=range]`:** Der VTU-Helper feuert `input`, aber die Komponente sieht dabei den **alten** Wert — Tests schlagen dann aus Gründen fehl, die nichts mit dem Code zu tun haben. Stattdessen `element.value = x` setzen und `trigger('input')` (siehe `dragTo()` in `LeftSidebar/NP/__tests__/Progress.test.ts`).
- **Hover-Behandlung für Listenzeilen ist zentralisiert:** `candy-row-base` + `candy-row-hover` in `_candy.scss`. Die Base-Hälfte ist Pflicht (reservierter transparenter 2px-Rand) — ohne sie springt der Inhalt beim Hover, und genau deshalb hatten die Folder-Zeilen (`border: none`) gar keinen Rahmen. Sidebar- und Queue-Zeilen bleiben bewusst flach (Panel-Fläche statt Page-Ground).
- **⚠️ Die Queue im NowPlaying ist VIRTUALISIERT — Zeilen zählen misst den Scroller, nicht die Queue.** `DynamicScroller` rendert nur einen Ausschnitt (17 von 22 Zeilen) und lässt nach dem Leeren der Queue **tote Zeilen im DOM** stehen (unsichtbar, aber `querySelectorAll('.songlist-item').length` sagt 16 bei leerer Liste). Ebenso ist die **erste gerenderte Zeile nicht Queue-Index 0** — der Scroller fokussiert den laufenden Track. Für Headless-Checks daher den persistierten Store lesen (`JSON.parse(localStorage['tracklist']).tracklist.length`) statt DOM-Zeilen, und Positionen aus der Server-Wahrheit (`/devicesync/poll` als Beobachter-Gerät) statt aus der Renderreihenfolge ableiten.
- **⚠️ Preview-Proxy-Ports kollidieren:** In `~/uitest` können alte `previewproxy.js`-Prozesse (z.B. auf 8099/8125) noch laufen und ein **veraltetes `dist`** ausliefern — der neue Proxy stirbt still mit `EADDRINUSE` und man diagnostiziert am falschen Build (real passiert: „Button fehlt" an master-CSS gemessen). Immer die Startzeile `preview proxy on <port> serving <dist>` aus dem Log prüfen, frischen Port nehmen und mit `kill $PROXY` (nicht `pkill -f previewproxy`) aufräumen.

## Nächste Schritte

Offene Arbeit als GitHub Issues: `gh issue list --repo vwellenberg/AivinNet-Client`.

## Device Sync / Multiroom (v1.3.0)

Spotify-Connect + Multiroom: Geräte desselben Accounts können einer **Group Session** beitreten; alle joined Geräte spielen hörbar synchron, jedes kann steuern, Volume/Mute bleibt pro Gerät (remote einstellbar). Server = Source of Truth (RAM, `SubspaceRadio/src/swingmusic/lib/groupsession.py`, HTTP `api/devicesync.py`, alle POST unter `/devicesync`).

**Client-Architektur:**
- `src/stores/devicesync.ts` — Herzstück: Poll-Loop (1 s joined / 5 s solo), Cristian-Clock-Offset (`utils/deviceSync/clockSync.ts`, lowest-RTT gewinnt), geplante Command-Ausführung (Server-`execute_at_ms` − Offset → lokales setTimeout; Catch-up wenn verpasst; Dedupe per Command-Id), Drift-Steering 250 ms (`utils/deviceSync/driftSteer.ts`: Deadband 50 ms, playbackRate ±4 %, Hard-Seek > 1 s; im Pause-Zustand nur Hard-Seek-Recovery), Mirror unter `applying`-Guard.
- **Seams**: `queue.ts` (play/playPause/seek/playNext/playPrev/shuffleQueue/**clearQueue** → `intercept()`, autoPlayNext no-op), `tracklist.ts::insertAt` **und `removeByIndex`** (Play next / Add to queue / Remove from queue → queue-set-Broadcast), `player.ts` (onAudioEnded → Leader plant `track_change`; Gapless/Crossfade im Group-Mode aus), `tracker.ts` (nur Scrobble-Leader submittet; Nicht-Leader verwerfen die Akkumulation), `settings` repeat geteilt.
- UI: Cast-Button in `BottomBar/Right.vue` (grün = joined) → `modals/Devices.vue`; `DeviceSync/GestureOverlay.vue` (Autoplay-Block bei Remote-Invite); QR-Pairing = Deep-Link `/#/pair?code=…` → `views/PairView.vue` (Redeem via `/auth/pair?setcookie=true`).

**⚠️ Gotchas:**
- Der `applying`-Guard darf NIE ein `await` überspannen (Resolve VOR dem Guard; `withApplying()` ist sync-only, Tiefe gezählt). Sonst laufen User-Aktionen im Netzwerkfenster lokal statt als Broadcast.
- Bei Leave: `leaveSuppressUntil`-Fenster verhindert, dass ein in-flight Poll das Gerät sofort re-adoptiert; Re-Adopt (Page-Reload mid-session) erzwingt Full-Re-Mirror (`queueId`-Reset).
- Scheduled-Timer werden bei leave/toSolo/Queue-Wechsel gecancelt; `executeCommand` prüft Membership; `track_change`-Index wird geclampt.
- **Vitest 0.34 + Pinia + Modul-Singletons: `vi.resetModules()` ist UNZUVERLÄSSIG** (geteilte Modul-Instanzen, Store-State des Vortests via zweiter Pinia-Kopie). Stattdessen exportiert der Store `__resetDeviceSyncTestState()` — im beforeEach aufrufen, keine Registry-Resets.
- Backend-Constraint: bjoern single-threaded → keine langlebigen Verbindungen; Polling + Scheduled Execution (LEAD 1500 ms) ist der v1-Transport. Poll-Handler serverseitig strikt RAM-only.

### ⚠️ Device-Sync: Feld-Bugs aus v1.3.0 (behoben in 1.3.1)

- **Positionen IMMER als ganze Millisekunden senden.** `audio.currentTime * 1000` ist ein Float; die Sync-API-Felder sind `int`. Ein Float ließ jedes `queue-set` mit **422** auflaufen (pydantic `int_from_float`) → die Server-Queue blieb LEER → andere Geräte hatten nichts zu spiegeln und jedes `track_change` scheiterte mit 400 („queue is empty"). Symptom beim User: „gleicher Song wird angezeigt, aber nichts startet, Next tot" — und scheinbar sporadisch, weil ein Join bei Position exakt 0 (gültiger int) funktionierte. `getCurrentTimeMs()` rundet jetzt.
- **Sync-Requests NIE stillschweigend verwerfen.** `sendQueueSet`/`sendCmd` melden Nicht-2xx per Toast + `console.error`. Ein verschlucktes 422 sah exakt aus wie eine gesunde Gruppe.
- **Mobile-Erreichbarkeit prüfen, nicht annehmen:** Die Bottom-Bar tauscht auf Phones die Aux-Gruppe (`Right.vue`) gegen die Navigation — ein Button, der nur dort hängt, existiert auf dem Handy schlicht nicht. Devices-Button liegt jetzt zusätzlich in `BottomBar/Left.vue` (small phones) und im NowPlaying-Header.
- **Icon-Kollision:** `speaker.svg` ist das Volume-Icon — für Geräte ein eigenes Glyph (`devices.svg`).
- **QR-Pairing:** Auf `/#/pair` darf der 401 der Boot-Requests kein Login-Modal öffnen (`useAxios` prüft die Route), sonst wirkt das Scannen „komisch/kaputt".
- **Verifikationsfalle:** Der erste E2E jointe per API und startete Chromium mit `--autoplay-policy=no-user-gesture-required` — beides umging genau die Pfade, die im Alltag brechen. Group-Sync IMMER über echte UI-Klicks und ohne Autoplay-Flag verifizieren (`~/uitest/verify3.js`).

### Device-Sync: Timing-Mechanik (v1.3.3)

Vier Stellschrauben, die zusammen den hörbaren Versatz bestimmen — in dieser Reihenfolge prüfen, wenn „klingt versetzt" gemeldet wird:

1. **Clock-Kalibrierung beim Join** (`calibrateClock()`, 4 Polls à ~120 ms): Der Estimator behält das Sample mit der niedrigsten RTT. Direkt nach dem Join gab es nur EINES (aus der Join-Antwort) — ein langsames Sample ⇒ Wiedergabe startet messbar versetzt und kriecht erst langsam in Position.
2. **Snap-Window** (`SNAP_WINDOW_MS 2500`, `SNAP_HARD_MS 80`): In den ersten 2,5 s nach einem Transport-Command wird ein Offset > 80 ms **hart gesucht** statt mit ±4 % playbackRate ausgeglichen. Das langsame Ausgleichen war genau das, was am Track-Anfang als Verzögerung hörbar war.
3. **Deadband 25 ms** (`driftSteer.ts`): 50 ms zwischen zwei Lautsprechern im selben Raum sind als Kammfilter/Echo hörbar — das darf das Deadband nicht verschlucken.
4. **Per-Device-Trim** (`utils/deviceSync/audioOffset.ts`, UI im Devices-Panel): Ausgabe-Latenz (Bluetooth 100–200 ms, TV/Soundbar mehr) ist für JEDES Protokoll unsichtbar und braucht einen manuellen Regler (±1000 ms, lokal persistiert, wird auf `expectedPositionMs` addiert). Genau der Knopf, den Sonos/Chromecast auch haben.

**Gruppen-Bildung:** „Invite" joint das eigene Gerät implizit (seedet die Gruppe mit dem, was hier läuft) — niemand soll „sich selbst beitreten" müssen. „Join group" erscheint nur, wenn bereits eine Gruppe läuft.

**⚠️ Autoplay-Prompt:** Der `GestureOverlay` IST die Meldung — kein zusätzlicher Error-Toast (Autoplay-Rejects feuern mehrfach → gestapelte rote Toasts über dem Dialog). Touch-Targets im Overlay per `min-height` erzwingen; ein globales Button-Height-Rule deckelt reines Padding auf 40 px.

### Queue-Mutationen im Gruppen-Modus (v1.5.0, PR #231)

**Jede** Queue-Mutation muss durch `intercept()` → `sendQueueSet` — die lokale Liste zu splicen ändert die
Server-`queue_id` NICHT, also re-mirrort niemand und der gespiegelte `currentindex` zeigt danach auf den
falschen Track (stille Desync). Abgedeckt: `insertTracks`, `removeTracks`, `clearQueue`, `shuffleQueue`.

- **Der Index muss mitreisen.** Nur der Client weiß, ob die Entfernung *vor*, *auf* oder *nach* dem
  laufenden Track lag: darunter ⇒ `currentindex - 1`; **auf** ihm ⇒ Index bleibt (der nächste rutscht nach)
  und `position_ms: 0`; letzter Track ⇒ in die verkürzte Liste geklemmt. Der Server klemmt zwar auch
  (`min(currentindex, len-1)`), aber er kann die Absicht nicht rekonstruieren.
- **⚠️ „Queue ersetzen" ist nicht „Queue leeren".** `PlayBtn.vue`/`TopTracks.vue` riefen `clearQueue()` als
  Vorspiel zu `setFromSearch(...)` + `play()`. Lokal ein No-op — mit dem Seam ein **queue-set einer LEEREN
  Queue**, das gegen das echte rennt (beide `void`, Antwort-Reihenfolge nicht garantiert). Wer eine Queue
  ersetzt, ruft NUR `setFromX` + `play()`.
- **⚠️ Eine leere Gruppen-Queue muss überall stoppen.** `reconcileTransport` behandelte „kein aktueller
  Track" als Resolve-Lücke und stieg früh aus → das alte Audio lief weiter, während der Anker auf 0 stand,
  und der Steer-Loop riss es alle 250 ms auf 0 zurück. Leere Queue ⇒ `queue.playing = false`,
  `pausePlayingSource()`, `resetRate`, `loadedTrackhash = ''`. Dazu Guard in `onTrackEnded`: ein
  `track_change` in eine leere Session beantwortet der Server mit **400** (roter Toast beim Leader).
- E2E: `~/uitest/queueseams.js`.

**Auto-Rejoin (v1.4.1):** Ein Gerät, das UNFREIWILLIG aus der Gruppe fiel (Reap nach 30 s, Netz-Lücke, Server-Neustart), tritt einer **noch laufenden** Gruppe beim nächsten Poll selbst wieder bei. Marker `aivinnet.group_member` in localStorage (überlebt Reloads); gesetzt beim Join, gelöscht NUR bei bewusstem Ausstieg (Leave, „Not now", per `play_here` entfernt) — `toSolo()` lässt ihn absichtlich stehen, das ist der unfreiwillige Pfad. **Harte Regel: Auto-Rejoin darf NIE eine Gruppe ERZEUGEN** (`groupRunning`-Check auf ein anderes joined Gerät), sonst startet ein geöffnetes Handy ungefragt Gruppen-Wiedergabe. Backoff `AUTO_REJOIN_COOLDOWN_MS` 60 s gegen Flapping, wenn ein Rejoin nicht hält.
