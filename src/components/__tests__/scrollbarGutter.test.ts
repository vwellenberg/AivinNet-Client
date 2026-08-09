import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// The cover veil has to survive the scrollbar.
//
// The content scrollers reserve the bar's width as a gutter on both edges
// (`scrollbar-gutter: stable both-edges`). The right gutter is not empty space
// — it holds the real scrollbar widget, and Chrome paints that in a layer of
// its own, outside the scrollport where scrolled CONTENT is clipped. A veil
// built as a CHILD of the scroller therefore stops $scrollbar-w short of the
// right content edge, and the transparent track shows bare grid paper through
// the gap, the full height of the header band. That was #483's
// `.page-gradient-decor`, and no left/right value could have fixed it: those
// pixels belong to the scrollbar, not to the content.
//
// A BACKGROUND of the scroll container does reach them — it is painted under
// the scrollbar and shows through the transparent track — and
// `background-attachment: local` keeps it scrolling away with the header, which
// was the reason the veil sat inside the scroller in the first place.
//
// ⚠️ Why this is a census and not a screenshot test: headless Chromium paints
// NO scrollbar at all. Even a fully opaque red track leaves the screenshot
// unchanged, so the strip measures clean headless whether it is broken or not
// — which is how #483 was signed off while the gap was still there on the
// user's screen. The real-browser check is the one that counts.
// ---------------------------------------------------------------------------

// `.scss` comes back EMPTY through import.meta.glob (see
// .claude/rules/testing.md), so stylesheets are read off disk, relative to the
// runner's cwd (the project root).
const read = (path: string) => readFileSync(path, "utf-8");

const VARIABLES = read("src/assets/scss/_variables.scss");
const SCROLLBARS = read("src/assets/scss/Global/scrollbars.scss");
const APP_GRID = read("src/assets/scss/Global/app-grid.scss");
const VIEWS = [
  "src/views/AlbumView/index.vue",
  "src/views/ArtistView/Main.vue",
  "src/views/PlaylistView/index.vue",
].map(read);

/** The rule body that follows `selector {`, brace-balanced. */
function block(raw: string, selector: string): string {
  // Comments first: this file's own prose talks about `{` and `}` often
  // enough that counting them raw would slice the wrong block.
  const source = raw.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const start = source.indexOf(`${selector} {`);
  expect(start, `${selector} not found`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = source.indexOf("{", start); i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(start, i);
  }
  throw new Error(`unbalanced braces after ${selector}`);
}

describe("the scrollbar gutter has one width", () => {
  it("declares it as a token", () => {
    expect(VARIABLES).toMatch(/^\$scrollbar-w:\s*\d+px;/m);
  });

  it("paints the scrollbar at the token width", () => {
    // The narrow bars inside dropdowns and menus are their own decision and
    // reserve no gutter — only the app-wide bar is bound to this token.
    expect(block(SCROLLBARS, ".designatedOS ::-webkit-scrollbar")).toMatch(
      /width:\s*\$scrollbar-w;/
    );
  });
});

describe("the cover veil is painted under the scrollbar", () => {
  const scroller = block(APP_GRID, ".scroller");

  it("is the scroll container's own background", () => {
    expect(scroller).toMatch(/background-image:\s*var\(--page-gradient,\s*none\);/);
    expect(scroller).toMatch(/background-repeat:\s*no-repeat;/);
    expect(scroller).toMatch(/background-size:\s*100%\s*\d+px;/);
  });

  it("still scrolls away with the header", () => {
    // `scroll` (the default) would pin the band to the viewport and leave it
    // hanging over the track list.
    expect(scroller).toMatch(/background-attachment:\s*local;/);
  });

  it("keeps no decor child that would double the tint", () => {
    // Both mechanisms at once paint the gradient twice — measurably darker
    // (96,96,124 -> 46,46,85 on playlist 11).
    expect(APP_GRID).not.toContain("page-gradient-decor");
    for (const view of VIEWS) expect(view).not.toContain("page-gradient-decor");
  });
});
