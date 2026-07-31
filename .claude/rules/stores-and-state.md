---
paths:
  - "src/stores/**"
  - "src/utils/playlistMove.ts"
  - "src/utils/shufflePicker.ts"
  - "src/requests/**"
---

# Stores und Zustand

Die Aufteilung: `queue/tracklist.ts` = **was** in der Queue liegt und woher (`from`),
`queue.ts` = **wo** man darin ist, `player.ts` = die tatsächlichen Audio-Elemente. Seitendaten
liegen pro Route in `stores/pages/*` und werden im Router-`beforeEnter` geladen, nicht im
`onMounted`. Landkarte: [docs/architecture.md](../../docs/architecture.md).

## ⚠️ Nie die geladene Tracklist als „ganze Liste" ans Backend senden

`playlist.allTracks` enthält nur die **paginiert geladenen** Tracks (~38 von 993) und **niemals
Orphan-Hashes**. Der alte `reorderTracks(pid, allTracks.map(t => t.trackhash))` traf ein
`PUT /reorder`, das die gespeicherte Liste 1:1 ersetzt → **ein Drag machte aus 120 Tracks 44**,
und das Backend antwortete mit 200/„Done".

Ersetzt durch `movePlaylistTrack(pid, trackhash, beforeTrackhash)` → `PUT /move-track`: Anker per
Trackhash statt Position. O(1)-Payload, der Server macht die Chirurgie auf seiner eigenen Liste,
Pagination und Orphans sind irrelevant — beide Anker sind immer geladen, weil ein Drag nur
zwischen zwei gerenderten Zeilen passieren kann. `/reorder` lehnt Nicht-Permutationen jetzt mit
409 ab.

Die Index-Arithmetik (Drop-Gap → finaler Index → Undo) liegt in `utils/playlistMove.ts` und ist
gegen ein Modell des Server-Splices getestet — **nicht inline in der View wiederholen**.

## ⚠️ Optimistische Mutationen brauchen ein Rollback

Bei fehlgeschlagenem Request die lokale Änderung zurücknehmen (`resolveMove().undo`), sonst
behauptet die Liste eine Ordnung, die der Server abgelehnt hat. Achtung: Die Undo-Argumente
unterscheiden sich für Auf- und Abwärts-Move wegen der `to > from ? to - 1 : to`-Korrektur in
`moveTrack`.

## ⚠️ Zufall gehört nicht in einen Getter

`queue.nextindex` speist auch den Next-Track-Audio-Preload und im Gruppenmodus den
`track_change`-Broadcast — ein `Math.random()` im Getter liefert bei jedem Lesezugriff einen
anderen Track. Muster: in einer **Action** würfeln (`rollShuffleNext`), Ergebnis in den State
(`shuffleNextIndex`), der Getter liest nur. Neu würfeln bei Track-Wechsel, Queue-Ersetzung
(`tracklist.setNewList`) und Toggle.

## ⚠️ Ein ausgespielter Track geht NICHT durch `play()`

Der reale Auto-Übergang ist der lückenlose: der Player hat das nächste Audio-Element vorgeladen,
`moveLoadedForward()` schaltet die Quellen um und meldet der Queue nur noch das Ergebnis — über
**`moveForward()`**. Wer „was passiert beim Track-Ende" in `play()` oder `autoPlayNext()` sucht,
sucht falsch: `autoPlayNext()` ruft außerhalb der Tests **niemand** auf.

Deshalb blieb der vorgewürfelte Shuffle-Index dort stehen, wo der gerade gestartete Track liegt →
`nextindex` gab den aktuellen Index heraus → Zufallswiedergabe wiederholte einen Song endlos, und
grüne Store-Tests behaupteten das Gegenteil, weil sie `autoPlayNext()` prüften. **Jede Logik am
Track-Wechsel gehört an `moveForward()` genauso wie an `play()`** — und was eine Invariante ist
(„next ist nie der laufende Track"), wird zusätzlich im Getter abgesichert, weil der
Gruppen-Mirror `currentindex` bewusst direkt schreibt.

## ⚠️ Scrubbing braucht einen eigenen Drag-State

Der Range-Input ist an den Playhead gebunden, der mehrmals pro Sekunde tickt — ohne lokalen
Drag-Zustand reißt jedes Re-Render den Knopf unter dem Finger zurück, und der gemalte Fill bleibt
beim Playhead stehen. Muster in `Progress.vue`: `@input` setzt `scrub.active/value`, alle Anzeigen
lesen `displayValue`, `change`/`click` beenden den Scrub und seeken.

## ⚠️ `image="None"` ist ein String und damit truthy

Das Backend liefert für Playlists ohne eigenes Bild `image="None"`. In der UI auf `pl.has_image`
prüfen, **nicht** auf `pl.image`. Verwandt: `Album.image` trägt einen `?pathhash=`-Suffix —
Fixtures in Tests entsprechend realistisch halten.

## ⚠️ Die Queue im NowPlaying ist virtualisiert

`DynamicScroller` rendert nur einen Ausschnitt (17 von 22 Zeilen) und lässt nach dem Leeren der
Queue **tote Zeilen im DOM** stehen — `querySelectorAll('.songlist-item').length` sagt 16 bei
leerer Liste. Ebenso ist die **erste gerenderte Zeile nicht Queue-Index 0**: Der Scroller
fokussiert den laufenden Track.

Für Headless-Checks deshalb den persistierten Store lesen
(`JSON.parse(localStorage['tracklist']).tracklist.length`) statt DOM-Zeilen zu zählen, und
Positionen aus der Server-Wahrheit (`/devicesync/poll` als Beobachter-Gerät) ableiten statt aus
der Renderreihenfolge.

## Die Queue umsortieren: `tracklist.moveTrack` ist die einzige Operation (#309, #312, #315)

Es gibt **zwei** Queue-Ansichten, und beide müssen bedient werden: das Panel der rechten Sidebar
(`RightSideBar/Queue.vue`, rendert `TrackItem` — und existiert nur bei `use_sidebar && xl`) und
die ganzseitige Liste unter `/nowplaying/home` (`views/NowPlaying/main.vue`, rendert `SongItem`).
#309 hat nur die erste erwischt; für die meisten Fenstergrößen war die zweite die einzige
sichtbare Queue.

Drei Dinge, die man dabei falsch machen kann:

- **Der Index muss mitreisen.** `utils/queueMove.ts::resolveQueueMove()` rechnet die Drop-Lücke in
  einen Zielindex um **und** sagt, wohin der laufende Track dabei wandert. Nur der Client weiß, ob
  die gezogene Zeile *über* ihn hinweggegangen ist — **ein Reorder darf nie zum Trackwechsel
  werden.** Der DeviceSync-Seam (`intercept('moveTrack')`) trägt denselben Index mit.
- **Der Drag muss einen Index dieser Liste tragen.** `SongItem` verschickt `track.index`; in der
  Now-Playing-Liste wird der vorher auf die Queue-Position überschrieben, in einer Playlist ist es
  der refIndex in `allTracks`. `TrackItem` nimmt dagegen die `index`-Prop. Wer eine dritte Liste
  ziehbar macht, prüft zuerst, welcher Index dort eigentlich drin steht — und lehnt fremde Drops
  (`source !== dropSources.queue`) ab, deren Index in eine ganz andere Liste zeigt.
- **Eine Zeile mit `<img>` ist immer ziehbar.** Bilder sind nativ draggable, ein Drag auf dem Cover
  feuert also `dragstart` auf der Zeile — auch auf Zeilen, die kein Drag angemeldet haben.
  `onDragStart` gehört deshalb hinter denselben Guard wie `draggable`, und das Cover auf
  `draggable="false"`.

**Spiegeln nur, wenn die Ausrichtung bewiesen ist — und nicht über die Länge.** Eine Playlist-Seite
und die aus ihr gebaute Queue sind legitim unterschiedlich lang: die Seite paginiert (~13 von 43
Zeilen bei einem frischen Besuch), die Queue hält alles. Der erste Wächter verglich die Längen und
war damit im Normalfall falsch — die Spiegelung griff **nie** (#315). Richtig ist
`rangeAligns(seite, queue, lo, hi)`: trackhash für trackhash über genau den Abschnitt, den der Move
berührt.

## Requests

Alles läuft über `requests/useAxios.ts` — es schaltet den Ladebalken, öffnet bei 401 das
Login-Modal (außer auf `#/pair`), meldet bei 422 + „Signature verification failed" ab und wieder
an, und gibt Fehler als Wert zurück statt zu werfen. **Pfade kommen aus `config.ts::paths`**,
nicht aus Aufrufstellen.
