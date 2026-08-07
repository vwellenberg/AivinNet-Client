import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// The folder view's breadcrumb head is a PLATE, and the three rules that make it
// one are each breakable in a way nothing else in the app notices.
//
// It shipped as a bare $mem-ground fill with a single `border-bottom`. A line
// only reads as an edge when it runs into the content card's ink frame at both
// ends, and this one could not: the scroller carries side padding, so the line
// stopped 44px short on each side and floated there — 3px above the folder
// plate's own frame, so the two printed as one 6px double rule. The user
// reported it as "the border is missing at the top".
//
// What holds the fix together (each of these broke once while building it):
//
//   - The SCOPE has to match the condition under which the template renders the
//     head inside the scroller. Scoped to `.is_alt_layout` alone, the medium and
//     phone layouts kept a head with no surface at all.
//   - The gap to the first row has to sit in the sticky wrapper's CONTENT box
//     (`flow-root` plus a margin on the plate). vue-virtual-scroller measures
//     the slot with a ResizeObserver, whose box is the content box: padding on
//     the wrapper and a collapsing margin are both invisible to it, and the rows
//     land flush against the plate's frame.
//   - The sticky `top` has to stay 0. It clamps to the scroller's padding edge,
//     so any offset shifts the plate down off its flow position while the rows
//     stay put — eating exactly that gap.
//
// The geometry itself is a browser question and was answered in a browser: 8px
// above and below the plate, identical position at rest and while stuck, at
// 1440 / 390 / 360 wide, in both themes.
// ---------------------------------------------------------------------------

// `.vue`/`.scss` come back EMPTY through import.meta.glob (see
// .claude/rules/testing.md), so the file is read off disk, relative to the
// runner's cwd (the project root).
const SFC = readFileSync("src/views/FolderView.vue", "utf-8");
const STYLE = SFC.slice(SFC.indexOf("<style"));

/** The rule body that follows `selector {`, brace-balanced. */
function block(raw: string, selector: string): string {
  // Comments first: the prose around these rules is long enough that a stray
  // brace in it would slice the wrong block.
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

const WRAPPER = ".scroller > div.vue-recycle-scroller__slot:first-child";

describe("the folder head is a plate wherever the scroller renders it", () => {
  it("styles every layout the template renders the head in", () => {
    // The `#before` slot is what puts the head inside the scroller; its
    // condition is the list of layouts that need these rules.
    const condition = SFC.match(/#before"?\s+v-if="([^"]+)"/)?.[1];
    expect(condition, "the #before slot lost its v-if").toBeTruthy();

    const flags = (condition as string).split("||").map(f => f.trim());
    expect(flags.length).toBeGreaterThan(1);

    for (const flag of flags) {
      expect(STYLE, `no rules for .${flag}`).toContain(`.folder-view.${flag}`);
    }
  });

  it("frames the head on all four sides, over an opaque surface", () => {
    const plate = block(STYLE, "#folder-nav-title");
    expect(plate).toMatch(/border:\s*\$candy-border;/);
    expect(plate).toMatch(/border-radius:\s*\$candy-radius;/);
    // Chrome over a scrolling list takes the panel surface, not the veil: rows
    // pass behind it and would otherwise show through its own text.
    expect(plate).toMatch(/background-color:\s*\$mem-panel;/);
    // Half an edge is what this fixed — a lone bottom border must not come back.
    expect(plate).not.toMatch(/border-bottom:/);
  });

  it("keeps the gap to the first row where the scroller can measure it", () => {
    expect(block(STYLE, "#folder-nav-title")).toMatch(/margin-bottom:\s*\$small;/);
    // Without a block formatting context that margin collapses through the
    // wrapper and the scroller never sees it.
    expect(block(STYLE, WRAPPER)).toMatch(/display:\s*flow-root;/);
  });

  it("sticks without an offset", () => {
    const wrapper = block(STYLE, WRAPPER);
    expect(wrapper).toMatch(/position:\s*sticky;/);
    expect(wrapper).toMatch(/top:\s*0;/);
  });
});
