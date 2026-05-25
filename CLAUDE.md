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
# Auf dem Server (192.168.0.4):
cd ~/SubspaceRadio-Client
git pull
NODE_OPTIONS='--dns-result-order=ipv4first' yarn install --network-timeout 120000
NODE_OPTIONS='--dns-result-order=ipv4first' yarn build
rm -rf ~/.config/swingmusic/client
cp -r dist ~/.config/swingmusic/client
sudo -n systemctl restart subspaceradio
```

**Wichtig:** Server hat IPv6-Problem — yarn braucht `NODE_OPTIONS='--dns-result-order=ipv4first'`.

## Nächste Schritte

Siehe [ROADMAP.md im Backend-Repo](https://github.com/vwellenberg/SubspaceRadio/blob/master/ROADMAP.md).
