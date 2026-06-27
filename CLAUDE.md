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
- Seiten-Verlauf (Album/Artist/PlaylistView): **zentral** über `pageGradient(colors.bg)` aus [src/utils/colortools/pageGradient.ts](src/utils/colortools/pageGradient.ts) — EIN gemeinsamer Spotify-Fade (vivider Top → `#121212`). Nicht pro View duplizieren. (Die alte `.page-ambient-gradient`-CSS-Klasse ist toter Code, wird nirgends gerendert.)
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
- **Layout-Grid:** `#app-grid` Zeilen `max-content minmax(0,1fr) 5.125rem` — `minmax(0,...)` ist kritisch, sonst schiebt eine hohe Sidebar die Bottom-Bar aus dem Viewport. Top-Bar (`nav`) full-width schwarz, Logo in `.topnav .left`.
- **Playlist `image="None"`:** Backend liefert für Playlists ohne eigenes Bild `image="None"` (String, truthy!). In der UI auf `pl.has_image` prüfen, nicht auf `pl.image`.

## Nächste Schritte

Offene Arbeit als GitHub Issues: `gh issue list --repo vwellenberg/AivinNet-Client`.
