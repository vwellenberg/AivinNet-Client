import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { styleBlock } from "./scssBlocks";

// ---------------------------------------------------------------------------
// A section caption on the page ground is a STICKER (`mem-sticker`), never bare
// text.
//
// The ground is grid paper *plus* the memphis doodles, and the doodle tile is
// 3840x1600 — so "a shape happens to sit behind this word" is the normal case,
// not the exception. Every caption in the app had already answered that: the
// card-row captions, "Top Tracks", "Browse Library", "Up Next" / "Queue", the
// chart groups, the page titles, and the recent-searches head. The two on the
// search page's Top tab ("Top Result", "Tracks") never were — they carried a
// theme-aware `color` and nothing else, which does nothing about a saturated
// shape running behind them. Reported by the user off a screenshot of that tab.
//
// The point of the census is the SHAPE of that miss: neither caption looked
// wrong in its own file. It only shows next to the sticker one screen over. So
// this test COLLECTS the hosts (every component that renders an <h2>/<h3>)
// rather than listing the known ones, and makes each of them answer: sticker,
// or an entry below saying which surface it sits on instead. A new page-level
// caption fails here until someone decides which it is.
//
// Scope note: headings are the enumerable half. Captions that are not heading
// elements — CardScroller's `.rtitle` (<b>), `SeeAll` — carry `mem-sticker`
// through their own rules and are covered by nothing here; a heading element is
// what a new section caption is written as.
// ---------------------------------------------------------------------------

/**
 * Hosts whose heading does NOT sit on the page ground, with the surface it sits
 * on instead. An entry here is a claim that has to stay true.
 */
const NOT_ON_THE_GROUND: Record<string, string> = {
  "components/DeviceSync/GestureOverlay.vue": "the join prompt paints its own veil sheet",
  "components/RightSideBar/Queue/QueueActions.vue": "inside the right sidebar panel",
  "components/RightSideBar/Search/TopResults.vue": "inside the right sidebar panel",
  "components/RightSideBar/Search/Top/TopItem.vue": "the top-result card's own title, on the card",
  "components/SettingsView/About.vue": "inside the settings modal",
  "components/modals/RootDirsPrompt.vue": "inside a modal",
  "views/PairView.vue": "on the pairing plate",
};

/** Every `.vue` under the given roots, relative to `src/`. */
function vueFiles(root: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join("src", root, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...vueFiles(root, rel));
    else if (entry.name.endsWith(".vue")) out.push(`${root}/${rel}`);
  }
  return out;
}

const HOSTS = [...vueFiles("views"), ...vueFiles("components")]
  .map(path => ({ path, source: readFileSync(join("src", path), "utf-8") }))
  .filter(({ source }) => /<h[23][\s>]/.test(source));

describe("section captions on the page ground are stickers", () => {
  // A source-scanning test goes quietly green when its parser breaks, so the
  // input set is asserted before anything is asserted about it.
  it("finds the heading hosts", () => {
    expect(HOSTS.length).toBeGreaterThan(5);
    for (const known of Object.keys(NOT_ON_THE_GROUND)) {
      expect(
        HOSTS.map(h => h.path),
        `${known} no longer renders a heading — drop its entry`
      ).toContain(known);
    }
  });

  it.each(HOSTS)("$path either stickers its caption or names its surface", ({ path, source }) => {
    if (NOT_ON_THE_GROUND[path]) return;

    // Comments stripped: the prose above these rules names the mixin, so raw
    // source would stay green after the rule itself was deleted.
    expect(
      styleBlock(source),
      `${path} renders a heading on the page ground without mem-sticker — ` +
        "give it the mixin, or add it to NOT_ON_THE_GROUND with the surface it sits on"
    ).toContain("mem-sticker");
  });
});

describe("the search page's Top tab", () => {
  const SFC = readFileSync("src/views/SearchView/TopResults.vue", "utf-8");
  const STYLE = styleBlock(SFC);

  it("marks both captions with the class the sticker rule is scoped to", () => {
    const headings = SFC.match(/<h3[^>]*>/g) ?? [];
    expect(headings).toHaveLength(2);
    for (const heading of headings) {
      expect(heading, "a caption without .section-title gets no sticker").toContain("section-title");
    }
  });

  // The sticker must NOT hang off the bare `h3` selector in this file: it also
  // reaches the title inside the top-result card, which sits on a panel.
  it("scopes the sticker to the class, not to the element", () => {
    const stickerAt = STYLE.indexOf("mem-sticker");
    expect(stickerAt).toBeGreaterThan(-1);
    expect(STYLE.slice(0, stickerAt)).toMatch(/\.section-title\s*\{[^{}]*$/);
  });

  it("plates the track results on the content veil", () => {
    expect(STYLE).toMatch(/\.right-search-top-tracks\s*\{[^}]*--mem-veil/);
  });
});
