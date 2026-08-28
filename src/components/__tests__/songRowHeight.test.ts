import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { SONG_ROW_HEIGHT } from "@/utils/songItemMethods";

// ---------------------------------------------------------------------------
// A fixed-size scroller pitches its rows at exactly `item-size`. It does not
// measure, and nothing complains when the number is wrong: the item wrapper is
// `overflow: visible` (app-grid.scss), so a row taller than the pitch simply
// draws over the one above it. What disappears under that overlap is the
// BOTTOM of the previous row — which is where the inlay's perforation lives.
//
// Three lists shipped a hand-written `64` against a 72px row. Measured on the
// running app, every separator on the artist "show all tracks" page and the
// search Tracks tab came out rgb(226,224,220) instead of the ink rgb(23,23,26)
// the album view (a measuring DynamicScroller) painted: 8% of the dashes
// showing through the next row's 92%-opaque veil plate. No test, no lint and no
// screenshot of a single file could say so — the number was right next to a
// scroller that behaved, and the row height lived in a stylesheet.
//
// So both halves are pinned here: the constant against the SCSS token, and
// every fixed-size track scroller against the constant.
// ---------------------------------------------------------------------------

const VUE_SOURCES = import.meta.glob("/src/**/*.vue", { as: "raw", eager: true }) as Record<
  string,
  string
>;

/** Comments name the very literals this census bans — strip them first. */
function stripComments(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

describe("the track row height has one source", () => {
  it("mirrors $song-item-height from the stylesheet", () => {
    const scss = readFileSync("src/assets/scss/_variables.scss", "utf-8");
    const match = scss.match(/\$song-item-height:\s*([\d.]+)rem/);

    expect(match, "$song-item-height must stay a rem value in _variables.scss").toBeTruthy();
    expect(Number(match![1]) * 16).toBe(SONG_ROW_HEIGHT);
  });

  // The census marker is the SHARED FEATURE, not a hand-kept file list: a
  // fixed-size scroller that stacks track rows joins this census by existing.
  // A list of three would have been exactly as green before the bug as after.
  it("is what every fixed-size track scroller pitches its rows at", () => {
    const offenders: string[] = [];

    for (const [path, raw] of Object.entries(VUE_SOURCES)) {
      const source = stripComments(raw);
      if (!source.includes("<RecycleScroller")) continue;
      if (!/SongItem/.test(source)) continue;

      const binding = source.match(/:item-size="([^"]+)"/);
      if (!binding) {
        offenders.push(`${path}: no :item-size binding`);
        continue;
      }

      const expression = binding[1].trim();
      if (expression === "SONG_ROW_HEIGHT") continue;

      // Bound through a local constant — then THAT has to be the constant.
      // Collected with matchAll rather than a per-name regex built from a
      // template literal: `\s` inside one is just `s`, and the census would
      // have gone quietly green on every file it was meant to catch.
      const locals = new Map<string, string>();
      for (const decl of source.matchAll(
        /const\s+([A-Za-z_$][\w$]*)\s*(?::\s*number\s*)?=\s*([^\n;]+)/g
      )) {
        locals.set(decl[1], decl[2].trim());
      }

      const local = locals.get(expression);
      if (local === "SONG_ROW_HEIGHT") continue;

      offenders.push(`${path}: :item-size="${expression}"${local ? ` (= ${local})` : ""}`);
    }

    expect(offenders, "fixed-size track scrollers must pitch rows at SONG_ROW_HEIGHT").toEqual([]);
  });
});
