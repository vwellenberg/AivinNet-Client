import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// The scrollbar's width and the page veil's overhang are ONE number
// ($scrollbar-w, _variables.scss).
//
// The content scrollers reserve that width as a gutter on both edges
// (`scrollbar-gutter: stable both-edges`), and a gutter lives OUTSIDE the
// padding box — the box an absolute child spans. So `.page-gradient-decor`,
// which sits inside the scroller in order to scroll away with the header, has
// to reach back over both gutters or it stops short of the content area.
//
// This is a test because the gap was invisible in every file that caused it:
// the decor said `left/right: 0` and meant "full width", the scroller's gutter
// was declared three rules further up for an unrelated reason (centring the
// column), and the 12px itself lived in a third file, spelled as a literal.
// The user saw it as "the gradient isn't clean, something's missing left and
// right" — a strip of bare grid paper down each side of the veil, the full
// height of the header band.
// ---------------------------------------------------------------------------

// `.scss` comes back EMPTY through import.meta.glob (see
// .claude/rules/testing.md), so stylesheets are read off disk, relative to the
// runner's cwd (the project root).
const read = (path: string) => readFileSync(path, "utf-8");

const VARIABLES = read("src/assets/scss/_variables.scss");
const SCROLLBARS = read("src/assets/scss/Global/scrollbars.scss");
const APP_GRID = read("src/assets/scss/Global/app-grid.scss");

/** The rule body that follows `selector {`, brace-balanced. */
function block(source: string, selector: string): string {
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

  it("reaches the page veil back over both gutters", () => {
    const decor = block(APP_GRID, ".page-gradient-decor");
    expect(decor).toMatch(/left:\s*-\$scrollbar-w;/);
    expect(decor).toMatch(/right:\s*-\$scrollbar-w;/);
  });

  it("shows that overhang instead of scrolling to it", () => {
    // Without the clip margin the overhang is either cut off again (back to
    // the bare strips) or answered with sideways scroll.
    const scroller = block(APP_GRID, ".scroller");
    expect(scroller).toMatch(/overflow-x:\s*clip;/);
    expect(scroller).toMatch(/overflow-clip-margin:\s*\$scrollbar-w;/);
  });
});
