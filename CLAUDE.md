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

## Branch-Workflow

- **`dev`** — aktiver Entwicklungs-Branch; Features hier entwickeln
- **`master`** — geschützt; Merge nur via PR, CI muss grün sein
- Branch Protection: `Lint` + `Tests` + `Build` müssen bestehen

## CI

GitHub Actions bei Push auf `dev`/`master` und bei PRs auf `master`:
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
- Ambient-Gradient in AlbumView/ArtistView/PlaylistView: `<div class="page-ambient-gradient">` aus `store.colors.bg`
- Logo-Ring (`::after` auf `.logo-orbit-wrapper`): `inset: 0`, kein Padding zwischen Ring und Icon
- Vitest 0.x (nicht 1.x) — Vite 3 Kompatibilität

## Server deployen

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

## Learnings / Gotchas (für alle Agents)

- **⚠️ SERVICE WORKER / STALE CACHE (ZUERST LESEN):** Wenn der User sagt „Fix sieht man nicht / UI noch alt", obwohl der Deploy nachweislich korrekt auf dem Server liegt → **fast immer ein Service Worker**, der alte vorgecachte Assets ausliefert. **Strg+Shift+R und „Cache löschen" umgehen einen Service Worker NICHT.** Symptom: Headless-Screenshot (kein SW) zeigt den Fix korrekt, aber der User-Browser nicht. Diagnose: `ls ~/.config/swingmusic/client | grep -iE 'sw|workbox'` + im sw.js auf alte `index.*.js`-Hashes prüfen. **Status quo: PWA/SW ist via `selfDestroying: true` in [vite.config.ts](vite.config.ts) abgeschaltet** — nicht ohne triftigen Grund reaktivieren. Falls ein User noch einen alten SW stecken hat: Chrome DevTools (F12) → Application → Storage → „Clear site data" → Tab neu laden (das entfernt den SW; ein normaler Reload reicht nicht). Dieses Problem trat mehrfach auf — bitte SOFORT daran denken, bevor man stundenlang am CSS sucht.
- **UI selbst prüfen (Headless-Screenshot):** Server hat unter `~/uitest` Playwright + Chromium. JWT ohne Passwort minten (App-Secret `serverId`):
  `uv run python -c "from swingmusic.app_builder import app, config_jwt; from swingmusic.db.userdata import UserTable; from flask_jwt_extended import create_access_token; config_jwt(app); app.app_context().push(); print(create_access_token(identity=list(UserTable.get_all())[0].todict()))"`.
  Dann `TOKEN=... CLIP=x,y,w,h OUT=/...png node shot.js` (setzt Cookie `access_token_cookie`, lädt `localhost:1970`), PNG runterladen + ansehen. **`debug.js`** liest computed styles aus (`page.$eval('.sel', el => getComputedStyle(el)...)`) — ideal für „warum greift mein CSS nicht".
- **CSS-Spezifitäts-Falle (Bottom-Bar):** `.b-bar .with-time button{background:transparent}` (0,2,1) schlug `.hotkeys .play` (0,2,0) → weisser Play-Kreis wurde transparent. Fix an der Quelle: `button:not(.play)`. Generell: wenn ein Style nicht greift, computed style im Headless-Browser prüfen, nicht blind `!important`.
- **Icon-Fills uneinheitlich:** manche SVGs `fill="currentColor"` (per CSS `color` färbbar), viele hardcoded `#F2F2F2`/`white`. Umfärben (z.B. dunkles Icon auf weissem Kreis): `.x svg path { fill: <c> }`. play.svg=currentColor; pause/next/shuffle=#F2F2F2; repeat=white.
- **Farbsystem (v0.5.x):** `setColorsToStore` wählt die *dominante* Farbe (nicht die gesättigtste), dunkelt via `darkenHex` ab (`colors.bg`/`bg2` = Hex). `getTextColor` luminanz-basiert (weiss/schwarz, nie blau). Gradient (3 Views): `bg 0%, bg2 28%, #121212 62%`.
- **Layout-Grid:** `#app-grid` Zeilen `max-content minmax(0,1fr) 5.125rem` — `minmax(0,...)` ist kritisch, sonst schiebt eine hohe Sidebar die Bottom-Bar aus dem Viewport. Top-Bar (`nav`) full-width schwarz, Logo in `.topnav .left`.
- **Playlist `image="None"`:** Backend liefert für Playlists ohne eigenes Bild `image="None"` (String, truthy!). In der UI auf `pl.has_image` prüfen, nicht auf `pl.image`.

## Nächste Schritte

Offene Arbeit als GitHub Issues: `gh issue list --repo vwellenberg/AivinNet-Client`.
