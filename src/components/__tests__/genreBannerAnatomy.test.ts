import { describe, expect, it } from "vitest";

import { blocks, ownDeclarations, styleBlock } from "./scssBlocks";

// ---------------------------------------------------------------------------
// The genre banner and the stat row under it, on the album and artist pages.
//
// Two halves of one report ("die Genres sind vom Stil her nicht korrekt"), and
// neither looked wrong in its own file:
//
//   1. The chips hand-rolled a plate — `border: 1px solid $mem-line`, no offset
//      shadow — so they were the only hairline-framed, flat objects on a screen
//      built from 3px frames and hard shadows. They also hovered, while nothing
//      in the row is clickable: the design's "you can press this" promise on a
//      caption (styling.md, the sort banner's `.tt` labels made the same call).
//
//   2. The row sat 12px right of the page's leading edge, and the stat tiles
//      below it did too — measured 315px against 303px for the section caption
//      and the cards on the same screen (16px on /stats, which reads the
//      component's own padding instead of the pages' override). That is the
//      leftover the sort banner's chip row had in #528, one page further along.
//
// So this census asks both questions, and it SWEEPS the hosts rather than
// listing them: an inset on these rows does not have to live in their own file
// (it did not — two page stylesheets carried it), and a third page adding one
// is exactly how the last one survived a round of fixes.
//
// ⚠️ A source-scanning test goes quietly green when its parser breaks (see
// .claude/rules/testing.md), so every expectation below is paired with a guard
// over its own input.
// ---------------------------------------------------------------------------
const SOURCES = import.meta.glob("/src/**/*.vue", { as: "raw", eager: true }) as Record<string, string>;

const BANNER = "/src/components/AlbumView/GenreBanner.vue";

/** The rows that carry the page's leading edge, and the hosts we know reach them. */
const ROWS = [".genres-banner", ".statshead", ".statsdates"];
const KNOWN_HOSTS = [
  BANNER,
  "/src/components/Stats/Stats.vue",
  "/src/views/AlbumView/index.vue",
  "/src/views/ArtistView/Main.vue",
];

/** The parts of a box shorthand, `var(…)`/`calc(…)` kept whole. */
function shorthandParts(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value.trim()) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (/\s/.test(char) && depth === 0) {
      if (current) parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) parts.push(current);
  return parts;
}

/** The left value of a box shorthand: 1→all, 2/3→2nd, 4→4th. */
function shorthandLeft(value: string): string | null {
  const parts = shorthandParts(value);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2 || parts.length === 3) return parts[1];
  if (parts.length === 4) return parts[3];
  return null;
}

/** Every left inset a block declares, through the shorthand or on its own. */
function leftInsets(declarations: string): string[] {
  const out: string[] = [];
  for (const property of ["padding", "margin"]) {
    for (const [, value] of declarations.matchAll(new RegExp(`(?:^|[\\s;{])${property}:([^;}]+)`, "g"))) {
      const left = shorthandLeft(value);
      if (left) out.push(left);
    }
    for (const [, value] of declarations.matchAll(new RegExp(`(?:^|[\\s;{])${property}-left:([^;}]+)`, "g"))) {
      out.push(value.trim());
    }
  }
  return out;
}

const isZero = (value: string) => /^0[a-z%]*$/.test(value);

describe("genre banner anatomy", () => {
  it("builds its chips from the shared sticker, not by hand", () => {
    const source = SOURCES[BANNER];
    expect(source, `${BANNER} not found — did it move?`).toBeTruthy();

    const css = styleBlock(source);
    const [chip] = blocks(css, ".genre-chip");
    // Guard over the input: no block, and every expectation below asserts
    // against an empty string.
    expect(chip, "no `.genre-chip` block — the parser or the file changed").toBeTruthy();

    expect(chip, "a genre chip is a sticker: plate, ink frame, offset shadow").toContain(
      "@include mem-sticker("
    );
    // The two halves the hand-rolled plate got wrong. `mem-sticker` owns both,
    // so restating either here is the drift coming back.
    expect(/(^|[\s;])border:/.test(ownDeclarations(chip)), "the frame belongs to `mem-sticker`").toBe(false);
    expect(/(^|[\s;])box-shadow:/.test(ownDeclarations(chip)), "the offset belongs to `mem-sticker`").toBe(
      false
    );
  });

  it("pairs its static fill with static ink", () => {
    const css = styleBlock(SOURCES[BANNER]);
    const chips = [...blocks(css, ".genre-chip"), ...blocks(css, ".genre-chip.is-label")];
    expect(chips.length, "no chip blocks — the parser or the file changed").toBe(2);

    // `mem-sticker` paints a theme-aware panel and writes the matching
    // theme-aware text colour. Overriding the fill with a STATIC accent without
    // moving the text with it is the pairing failure the token note in
    // _candy.scss warns about — paper-on-lavender in the dark theme.
    const fills = chips.filter(chip => /background-color:\s*\$mem-/.test(chip));
    expect(fills.length, "neither chip overrides the sticker's fill any more").toBe(2);
    expect(
      blocks(css, ".genre-chip")[0],
      "a static accent fill needs static ink on it, in both themes"
    ).toMatch(/color:\s*\$mem-ink/);

    // ⚠️ EVERY chip block, not just the base. The label overrides the fill on
    // its own line, so a `color: $candy-text` written next to it is the same
    // failure one rule further down — with the assertion above still green.
    for (const chip of chips) {
      for (const [, value] of chip.matchAll(/(?:^|[\s;])color:([^;}]+)/g)) {
        expect(value.trim(), "a chip on a static fill carries static ink").toBe("$mem-ink");
      }
    }
  });

  it("nothing is styled as if it could be pressed", () => {
    const css = styleBlock(SOURCES[BANNER]);
    // Genres are labels: no route, no handler, no click. A hover (or the hatch,
    // which says the same thing) is a promise the row cannot keep.
    expect(/:hover/.test(css), "a genre chip is not a control — no hover state").toBe(false);
    expect(/mem-hatch/.test(css), "the hatch means `you can press this`").toBe(false);
  });

  it("keeps the page's leading edge, in every host that reaches these rows", () => {
    const hosts = Object.entries(SOURCES).filter(([, source]) =>
      ROWS.some(row => blocks(styleBlock(source), row).length > 0)
    );
    // Guard over the sweep: the four files we know about have to be in it, or
    // the selector match silently stopped working.
    for (const known of KNOWN_HOSTS) {
      expect(
        hosts.some(([path]) => path === known),
        `${known} no longer matches the sweep — did the class names change?`
      ).toBe(true);
    }

    for (const [path, source] of hosts) {
      const css = styleBlock(source);
      for (const row of ROWS) {
        for (const body of blocks(css, row)) {
          for (const left of leftInsets(ownDeclarations(body))) {
            expect(
              isZero(left),
              `${path} insets ${row} by ${left} — these rows start on the page's leading edge`
            ).toBe(true);
          }
        }
      }
    }
  });
});
