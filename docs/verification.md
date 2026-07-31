# UI selbst verifizieren (Headless)

Werkzeugkiste und Befehle, um eine Änderung an der **laufenden, eingeloggten** App zu prüfen,
statt sie zu behaupten. Die Grundregeln dazu stehen in [CLAUDE.md](../CLAUDE.md); hier steht,
womit man sie einlöst.

Alles liegt auf dem Server unter `~/uitest` (Playwright mit **Chromium und Firefox**).

## Zuerst: JWT prägen

Ohne Token rendert nur die App-Shell. In `~/AivinNet`:

```bash
~/.local/bin/uv run python -c "from swingmusic.app_builder import app, config_jwt; \
from swingmusic.db.userdata import UserTable; from flask_jwt_extended import create_access_token; \
config_jwt(app); app.app_context().push(); \
print(create_access_token(identity=list(UserTable.get_all())[0].todict()))"
```

Dann als Cookie verwenden: `curl -H "Cookie: access_token_cookie=$TOKEN" …`

⚠️ **`sub` muss ein Dict sein, kein JSON-String** — der `user_lookup_loader` macht
`jwt_data["sub"]["id"]`. Ein `json.dumps({"id": 1})` als `sub` ergibt **HTTP 500 auf jedem
Endpoint**, während die Shell weiter rendert: Chrome und Nav sind da, aber null Playlists und
null Alben. Sieht aus wie ein kaputtes UI, ist ein kaputtes Token.

Beim Prägen mit PyJWT (Secret `serverId` aus `~/.config/swingmusic/settings.json`):

```python
pyjwt.encode({"sub": {"id": 1}, "iat": …, "nbf": …, "exp": …,
              "type": "access", "fresh": False, "jti": …}, cfg["serverId"], algorithm="HS256")
```

**Vor jedem Messlauf einmal gegenprüfen:**
`curl -H "Cookie: access_token_cookie=$T" localhost:1970/auth/user`

## Die Skripte

| Skript | wofür |
|---|---|
| `shot.js` | Screenshot: `TOKEN=… CLIP=x,y,w,h OUT=…png node shot.js` |
| `shot2.js` | die flexible Variante: `ROUTE=/playlist/3 MOBILE=1 THEME=dark W=390 H=844 OUT=… node shot2.js` |
| `debug.js` | computed styles auslesen — für „warum greift mein CSS nicht" |
| `rangeshot.js` + `rangemeasure.py` | Regler-Geometrie in **Pixeln**, Chromium und Firefox |
| `wavecheck.js` | welches Element beim Klick eine `v-wave`-Welle wirft, mit Farbe und Dauer |
| `popcheck.js` | liest die **laufende** Transform-Matrix aus, statt der Keyframe-Deklaration zu glauben |
| `btnaudit.js`, `bordermeasure.js`, `audit-shadows.js`, `mobile-audit.js` | Computed-Style-Audits über Routen × Themes |
| `previewproxy.js` + `run*.sh` | Branch-`dist` über einen Proxy servieren und messen |
| `queueseams.js`, `verify3.js` | E2E für Queue-Seams und Group-Sync |

**Für Mobile-Befunde immer `MOBILE=1`** — erst mit `hasTouch` greifen die
`@media (hover: none)`-Zweige, und genau dort stecken die Touch-Bugs.

Die Routen sind Hash-Routen: `http://localhost:1970/#/<route>`.

## ⚠️ Fallen beim Messen

- **Gegen `master` kontrollieren, immer.** Eine Null beweist ohne Kontrolllauf nur, dass man
  nicht misst.
- **Außerhalb des Viewports gibt es kein `elementFromPoint`.** Ein `page.mouse.down()` auf den
  Koordinaten eines Elements unterhalb der Falz landet auf **nichts** — der Test meldet „kein
  Effekt", der Code ist in Ordnung (real passiert: Ordner-Kopf bei y≈1044 in einem 900-px-
  Viewport). Vor jeder Zeiger-Interaktion `scrollIntoViewIfNeeded()`, danach mit
  `elementFromPoint` prüfen, dass die Mitte wirklich das Ziel trifft.
- **Preview-Proxy-Ports kollidieren.** Alte `previewproxy.js`-Prozesse liefern womöglich ein
  **veraltetes `dist`** aus; der neue Proxy stirbt still mit `EADDRINUSE`, und man diagnostiziert
  am falschen Build (real passiert: „Button fehlt" an master-CSS gemessen). Immer die Startzeile
  `preview proxy on <port> serving <dist>` im Log prüfen, frischen Port nehmen, mit `kill $PROXY`
  aufräumen (nicht `pkill -f previewproxy`).
- **⚠️ `~/preview` gehört niemandem — für einen Messlauf einen eigenen Checkout nehmen.** Das
  Verzeichnis wird von mehreren Sitzungen benutzt: eine andere kann es mitten im Lauf auf ihren
  Branch zurücksetzen und neu bauen, und dann misst man deren Code. Real passiert: erste Messung
  gelb, zweite gegen dasselbe `dist` wieder teal — `git log` in `~/preview` stand auf einem
  fremden Commit.

  ```bash
  git clone -q --shared ~/preview ~/preview-<thema>
  cd ~/preview-<thema> && git remote set-url origin <fork-repo>
  git fetch origin <branch> && git checkout FETCH_HEAD
  ln -s ~/preview/node_modules node_modules
  yarn build
  ```

  Danach **am gebauten Artefakt** prüfen, dass die eigene Änderung wirklich drin ist:
  `grep -o "<selektor>{[^}]*}" dist/assets/index.*.css` — und zwar gegen die CSS-Datei, die
  `dist/index.html` auch tatsächlich lädt (es liegen mehrere `index.*.css` herum).
- **Dienste nie per `ssh host '… &'` detachen** — das hängt die Sitzung. Die `run*.sh` bündeln
  deshalb Proxy (Hintergrund) + Messung (Vordergrund) + `kill` in **einer** Sitzung.
- **Die Queue im NowPlaying ist virtualisiert** — Zeilen zählen misst den Scroller, nicht die
  Queue. Stattdessen den persistierten Store lesen
  (`JSON.parse(localStorage['tracklist']).tracklist.length`).
- **Group-Sync nur über echte UI-Klicks verifizieren**, ohne `--autoplay-policy`-Flag: Der erste
  E2E jointe per API und umging damit genau die Pfade, die im Alltag brechen — grün, während das
  Feature kaputt war.
- **`waitUntil: 'networkidle'` läuft ins Timeout, sobald etwas spielt.** Der Audio-Stream hält eine
  Verbindung offen; jede Navigation *nach* dem ersten Play braucht `domcontentloaded` plus eine
  feste Wartezeit. Symptom sonst: „Seite lädt nicht", obwohl sie längst da ist.
- **Erst scrollen, bis die Liste nicht mehr wächst.** Ein einzelnes `scrollTop = scrollHeight`
  triggert den Infinite-Scroll-Sentinel, der nachlädt und den Boden verschiebt — die „letzte"
  Zeile ist dann gar nicht die letzte. In einer Schleife scrollen, bis `scrollHeight` stabil ist.
  Und weil der Scroller recycelte Zeilen im DOM stehen lässt, ist die letzte Zeile die mit der
  **größten Unterkante**, nicht der letzte Knoten.
- **Die Now-Playing-Queue liegt unter der Falz.** Ihr Header füllt fast den ganzen Viewport, die
  erste Zeile beginnt bei y≈738 von 900. Ohne vorheriges Scrollen des Scrollers gibt es genau eine
  sichtbare Zeile — ein Drag darauf hat kein Ziel und meldet „Feature kaputt".
- **Ein Test-Schritt kann die Vorbedingung des nächsten zerstören.** Ein Queue-Reorder bringt die
  Queue absichtlich aus dem Tritt mit der Playlist-Seite; der Spiegelungs-Wächter verweigert dann
  **korrekt**. Rot heißt hier „falsche Reihenfolge im Test", nicht „Bug". Schritte so ordnen, dass
  jeder seine Vorbedingung selbst herstellt.
- **Nach einem `play()` neu rendern, bevor gezogen wird.** `playFromPlaylistPage` lädt die
  vollständige Tracklist nach und baut den Scroller neu auf; ein Drag in eine noch wackelnde Liste
  landet zwischen zwei wandernden Zeilen und geht verloren.
