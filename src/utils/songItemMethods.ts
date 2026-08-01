import { dropSources } from "@/enums";
import { Track } from "@/interfaces";

/**
 * How many accents the colour guide band cycles through. Must match
 * `$mem-band-colours` in _candy.scss, which emits one `band-N` class per entry;
 * a class this returns without a matching rule leaves that row with no band.
 */
export const TRACK_BAND_COUNT = 5;

/**
 * The `band-N` class for a track row's colour guide band (the inlay spine on
 * the leading edge).
 *
 * Derived from the row's ordinal rather than `:nth-child`, because track lists
 * render through vue-virtual-scroller: it RECYCLES row elements, so DOM
 * position there follows the scroll offset instead of the list, and an
 * nth-child rule would give the same track a different colour on every scroll.
 *
 * `index` is whatever the call site passes as the ordinal, and that is not
 * always a plain integer — the album view passes the track number off the tags,
 * SongList counts down when given a total, and the prop's type allows a string.
 * Anything unparseable falls back to the first accent, so a row is never the
 * only one without a spine.
 */
export function trackBandClass(index: number | string): string {
  const n = Number.parseInt(String(index), 10);
  if (!Number.isFinite(n)) return "band-0";
  // JS `%` keeps the sign of the dividend, and `band--2` matches no rule.
  return `band-${((n % TRACK_BAND_COUNT) + TRACK_BAND_COUNT) % TRACK_BAND_COUNT}`;
}

export function showDragStart(
  e: DragEvent,
  track: Track,
  oldIndex: number,
  source: dropSources = dropSources.folder
) {
  console.log("drag start");
  console.log(source);
  const dragDiv = document.getElementById("drag-img") as HTMLDivElement;
  dragDiv.innerText = track.title;
  e.dataTransfer?.setDragImage(dragDiv, -15, 0);

  // add track object to dataTransfer
  e.dataTransfer?.clearData();
  e.dataTransfer?.setData(
    "swing-track",
    JSON.stringify({ track, source, oldIndex })
  );
}

export function handleDrop(e: DragEvent, index: number, top: boolean) {
  const data = e.dataTransfer?.getData("swing-track");
  if (!data) return;

  const drop_data = JSON.parse(data) as {
    track: Track;
    oldIndex: number;
    source: dropSources;
  };
  console.log(drop_data);

  // find dropped index
  const newIndex = top ? index - 1 : index + 1;
  console.log(newIndex + 1);
  return { ...drop_data, newIndex };
}
