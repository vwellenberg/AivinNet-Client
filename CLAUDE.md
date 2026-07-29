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
- **CSS-Spezifitäts-Falle (Bottom-Bar):** `.b-bar .with-time button{background:transparent}` (0,2,1) schlug `.hotkeys .play` (0,2,0) → weisser Play-Kreis wurde transparent. Fix an der Quelle: `button:not(.play)`. Generell: wenn ein Style nicht greift, computed style im Headless-Browser prüfen, nicht blind `!important`.
- **Icon-Fills uneinheitlich:** manche SVGs `fill="currentColor"` (per CSS `color` färbbar), viele hardcoded `#F2F2F2`/`white`. Umfärben (z.B. dunkles Icon auf weissem Kreis): `.x svg path { fill: <c> }`. play.svg=currentColor; pause/next/shuffle=#F2F2F2; repeat=white.
- **⚠️ SVG-Icons abgeschnitten beim Verkleinern (viewBox!):** `vite-svg-loader` nutzt SVGO, und `removeViewBox` (preset-default) **strippte den viewBox**. Ohne viewBox skaliert das SVG seinen Inhalt NICHT auf die CSS-Größe → es rendert in nativen Koordinaten (z.B. 28px) und das SVG-eigene `overflow:hidden` schneidet alles ab, was über die kleinere CSS-Box ragt. Symptom: Glyph unten abgeschnitten (war bei shuffle/repeat in der Bottom-Bar so, in JEDER Version — nicht Cache/SW!). **Fix liegt global in [vite.config.ts](vite.config.ts):** `svgLoader({ svgoConfig: { plugins:[{name:'preset-default',params:{overrides:{removeViewBox:false}}}] } })`. Bounding-Box-Messung (getBoundingClientRect) verrät das NICHT — nur `getBBox()` (Glyph-Bounds in user units) vs. gerenderte svg-Höhe, oder ein hochauflösender Element-Screenshot (`locator.screenshot()`, deviceScaleFactor 3).
- **Farbsystem (v0.5.x):** `setColorsToStore` wählt die *dominante* Farbe (nicht die gesättigtste), dunkelt via `darkenHex` ab (`colors.bg`/`bg2` = Hex). `getTextColor` luminanz-basiert (weiss/schwarz, nie blau). Seiten-Verlauf jetzt **zentral** in [`pageGradient()`](src/utils/colortools/pageGradient.ts) (Spotify-Fade: `vividTop(bg)` 0% → `bg` 32% → `#121212` 72%), von allen 3 Views genutzt.
- **⚠️ „Kasten/Box" um Detail-Header = `box-shadow`, NICHT der Verlauf:** Ein abgerundeter Schatten-Kasten um Album-/Playlist-Header kam vom `.album-header-ambient`-Element (`box-shadow: 0 .5rem 2rem colors.bg` + `rounded-lg`), **nicht** vom Hintergrund/Verlauf. Mehrere Anläufe scheiterten, weil sie am Verlauf/Background suchten. Der **Artist**-Header hatte ihn nie (rundes Bild → Element entfällt) → taugt als „sauberes" Vorbild. Element in #102 entfernt. **Merke:** bei „Box/Schatten um Header" zuerst `box-shadow` + absolute Ambient-Overlays prüfen (Toggle-Test `box-shadow:none` im Headless-Browser), nicht den Background. Allgemein: ein gerundeter Rahmen/Halo ohne sichtbaren Fill = fast immer ein `box-shadow`.
- **Layout-Grid:** `#app-grid` Zeilen `max-content minmax(0,1fr) 5.125rem` — `minmax(0,...)` ist kritisch, sonst schiebt eine hohe Sidebar die Bottom-Bar aus dem Viewport. Top-Bar (`nav`) full-width schwarz, Logo in `.topnav .left`.
- **Playlist `image="None"`:** Backend liefert für Playlists ohne eigenes Bild `image="None"` (String, truthy!). In der UI auf `pl.has_image` prüfen, nicht auf `pl.image`.
- **⚠️ NIE die geladene Tracklist als „ganze Liste" ans Backend senden.** `playlist.allTracks` enthält nur die **paginiert geladenen** Tracks (~38 von 993) und **niemals Orphan-Hashes**. Der alte `reorderTracks(pid, allTracks.map(t => t.trackhash))` traf ein `PUT /reorder`, das die gespeicherte Liste 1:1 ersetzt → ein Drag machte aus 120 Tracks **44** (Backend antwortete 200/„Done"). Ersetzt durch `movePlaylistTrack(pid, trackhash, beforeTrackhash)` → `PUT /move-track`, Anker per Trackhash statt Position: O(1)-Payload, Server macht die Chirurgie auf seiner eigenen Liste, Pagination und Orphans sind irrelevant (beide Anker sind immer geladen, weil ein Drag nur zwischen zwei gerenderten Zeilen passieren kann). `/reorder` lehnt Nicht-Permutationen jetzt mit 409 ab. Index-Arithmetik (Drop-Gap → finaler Index → Undo) liegt in `utils/playlistMove.ts` und ist gegen ein Modell des Server-Splices getestet — nicht inline in der View wiederholen.
- **Optimistische UI-Mutationen brauchen ein Rollback.** Bei fehlgeschlagenem Request die lokale Änderung zurücknehmen (`resolveMove().undo`), sonst behauptet die Liste eine Ordnung, die der Server abgelehnt hat. Achtung: die Undo-Argumente unterscheiden sich für Auf- vs. Abwärts-Move wegen der `to > from ? to - 1 : to`-Korrektur in `moveTrack`.
- **Zufall gehört nicht in einen Getter.** `queue.nextindex` speist auch den Next-Track-Audio-Preload und (im Group-Mode) den `track_change`-Broadcast — ein `Math.random()` im Getter liefert bei jedem Lesezugriff einen anderen Track. Muster: in einer **Action** würfeln (`rollShuffleNext`), Ergebnis in den State (`shuffleNextIndex`), Getter liest nur. Neu würfeln bei Track-Wechsel, Queue-Ersetzung (`tracklist.setNewList`) und Toggle.
- **Hover-Behandlung für Listenzeilen ist zentralisiert:** `candy-row-base` + `candy-row-hover` in `_candy.scss`. Die Base-Hälfte ist Pflicht (reservierter transparenter 2px-Rand) — ohne sie springt der Inhalt beim Hover, und genau deshalb hatten die Folder-Zeilen (`border: none`) gar keinen Rahmen. Sidebar- und Queue-Zeilen bleiben bewusst flach (Panel-Fläche statt Page-Ground).
- **⚠️ Preview-Proxy-Ports kollidieren:** In `~/uitest` können alte `previewproxy.js`-Prozesse (z.B. auf 8099/8125) noch laufen und ein **veraltetes `dist`** ausliefern — der neue Proxy stirbt still mit `EADDRINUSE` und man diagnostiziert am falschen Build (real passiert: „Button fehlt" an master-CSS gemessen). Immer die Startzeile `preview proxy on <port> serving <dist>` aus dem Log prüfen, frischen Port nehmen und mit `kill $PROXY` (nicht `pkill -f previewproxy`) aufräumen.

## Nächste Schritte

Offene Arbeit als GitHub Issues: `gh issue list --repo vwellenberg/AivinNet-Client`.

## Device Sync / Multiroom (v1.3.0)

Spotify-Connect + Multiroom: Geräte desselben Accounts können einer **Group Session** beitreten; alle joined Geräte spielen hörbar synchron, jedes kann steuern, Volume/Mute bleibt pro Gerät (remote einstellbar). Server = Source of Truth (RAM, `SubspaceRadio/src/swingmusic/lib/groupsession.py`, HTTP `api/devicesync.py`, alle POST unter `/devicesync`).

**Client-Architektur:**
- `src/stores/devicesync.ts` — Herzstück: Poll-Loop (1 s joined / 5 s solo), Cristian-Clock-Offset (`utils/deviceSync/clockSync.ts`, lowest-RTT gewinnt), geplante Command-Ausführung (Server-`execute_at_ms` − Offset → lokales setTimeout; Catch-up wenn verpasst; Dedupe per Command-Id), Drift-Steering 250 ms (`utils/deviceSync/driftSteer.ts`: Deadband 50 ms, playbackRate ±4 %, Hard-Seek > 1 s; im Pause-Zustand nur Hard-Seek-Recovery), Mirror unter `applying`-Guard.
- **Seams**: `queue.ts` (play/playPause/seek/playNext/playPrev/shuffleQueue → `intercept()`, autoPlayNext no-op), `tracklist.ts::insertAt` (Play next / Add to queue → queue-set-Broadcast), `player.ts` (onAudioEnded → Leader plant `track_change`; Gapless/Crossfade im Group-Mode aus), `tracker.ts` (nur Scrobble-Leader submittet; Nicht-Leader verwerfen die Akkumulation), `settings` repeat geteilt.
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
