import { describe, expect, it } from "vitest";

import { block, styleBlock } from "./scssBlocks";

// ---------------------------------------------------------------------------
// The player bar has ONE spacing value, and every group of it reads the token.
//
// Measured on the running app before this test existed, the bar carried three:
// 20px between the transport controls, 12px in the track block, and 2px on the
// right, where lyrics, devices and the speaker stand. That is the drift #387
// removed for SIZES, one level out — each group spaced itself, and the odd one
// out is invisible until the buttons get a fill: a 24px glyph in a 44px box
// brings 10px of padding of its own, so bare glyphs look evenly spaced at any
// gap. Give them a frame and the right-hand three read as one welded block.
//
// Counting the groups rather than naming the broken one: a fifth group added
// later fails here until it decides where its spacing comes from.
// ---------------------------------------------------------------------------
const SOURCES = import.meta.glob("/src/**/*.vue", { as: "raw", eager: true }) as Record<string, string>;

/** Every bar group and the selector its spacing lives on. */
const GROUPS: [file: string, selector: string, token: string, what: string][] = [
  ["/src/components/BottomBar/Left.vue", ".left-group", "$bar-gap", "the track block"],
  ["/src/components/LeftSidebar/NP/HotKeys.vue", ".hotkeys", "$bar-gap", "the transport row"],
  ["/src/components/BottomBar/Right.vue", ".right-group", "$bar-gap", "lyrics and devices"],
  [
    "/src/components/BottomBar/Volume.vue",
    ".b-bar .right-group .volume-control",
    "$bar-gap-tight",
    "speaker and slider — one control, so tighter on purpose",
  ],
];

describe("player bar spacing", () => {
  it.each(GROUPS)("%s › %s reads %s (%s)", (file, selector, token) => {
    const source = SOURCES[file];
    expect(source, `${file} not found — did it move?`).toBeTruthy();

    const body = block(styleBlock(source), selector).body;
    expect(body, `no \`${selector} { … }\` block in ${file}`).not.toBe("");

    // The first `gap:` is the group's own; a breakpoint may narrow it further
    // and states its own value inside a nested block.
    const gap = /(?:^|[\s;{])gap\s*:\s*([^;]+);/.exec(body);
    expect(gap, `\`${selector}\` in ${file} states no \`gap\``).toBeTruthy();
    expect(
      (gap as RegExpExecArray)[1].trim(),
      `\`${selector}\` should space itself from ${token}, not from a literal — the bar had three ` +
        "different gaps before this token existed."
    ).toBe(token);
  });

  it("leaves no hand-written pixel gap in the bar", () => {
    const offenders = Object.entries(SOURCES)
      .filter(([path]) => path.includes("/BottomBar/"))
      .flatMap(([path, source]) =>
        [...styleBlock(source).matchAll(/(?:^|[\s;{])gap\s*:\s*(\d+px)/g)].map(m => `${path}: gap: ${m[1]}`)
      );
    expect(offenders, `a bar group is spacing itself in pixels again`).toEqual([]);
  });
});
