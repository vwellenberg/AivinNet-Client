import { dropSources } from "@/enums";
import { Track } from "@/interfaces";

/**
 * How many accents the colour guide band cycles through. Must match
 * `$mem-band-colours` in _candy.scss, which emits one `band-N` class per entry;
 * a class this returns without a matching rule leaves that row with no band.
 */
// TWO, not five. Five rotating full-strength accents made the list loud and
// said nothing — colour 3 only ever meant "third row in the cycle". Two cool
// tones do the one job a band has to do (tell two neighbouring rows apart), and
// a SECOND dimension carries the meaning instead: see `trackBandFade`.
export const TRACK_BAND_COUNT = 2;

/** Weakest the band ever gets, so row 1 still has a visible spine. */
export const TRACK_BAND_MIN_FADE = 0.25;

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

/**
 * How strong a row's band is: 0.25 at the top of the list, 1 at the bottom.
 *
 * This is the part that carries information. The two alternating colours only
 * separate neighbours; the STRENGTH says how far into the list a row sits —
 * readable mid-scroll, when the scrollbar is the only other clue.
 *
 * Normalised against the list LENGTH, not an absolute step count. An absolute
 * scale keeps one step meaning the same everywhere, but on a 993-track playlist
 * everything past its cap looks identical; normalising uses the whole range in
 * every list, which is what a scrollbar does too.
 *
 * `position` is the 1-based RENDERED position (top row = 1), not the `index`
 * prop. The two disagree exactly where it matters: the album view numbers its
 * rows per disc, and the favourites lists number DOWNWARDS from the total —
 * a fade fed those ordinals would restart mid-list or run upside down.
 *
 * Without a usable total (mixed sources, unknown length) the fade is 1 — a
 * uniform, full-strength band is the honest fallback, never an invisible one.
 */
export function trackBandFade(position: number, total?: number): number {
  if (!Number.isFinite(position) || !total || total < 2) return 1;
  const pos = Math.min(Math.max(position - 1, 0), total - 1);
  return TRACK_BAND_MIN_FADE + (1 - TRACK_BAND_MIN_FADE) * (pos / (total - 1));
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
