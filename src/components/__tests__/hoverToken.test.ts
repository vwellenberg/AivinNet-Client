import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// THE POINTER SIGNAL HAS ONE SOURCE: `--mem-hover` (#418).
//
// Before this it had three, and two of them ignored the token that existed for
// exactly this purpose: `candy-row-hover` and `btn-action` each wrote
// `$mem-blush` by hand, while only `btn-quiet` read `$mem-hover`. Changing the
// hover colour therefore meant finding all three — and the question "is hover
// centralised?" had the answer "half".
//
// This test makes the answer permanent. It scans the two stylesheets that own
// hover treatments and fails when a hover rule paints a fill from anything but
// the token.
//
// Read with `readFileSync`, not `import.meta.glob`: the raw glob comes back
// EMPTY for `.scss` because Vite routes stylesheets through a CSS pipeline that
// is stubbed under test — no error, no undefined, just a silently green test.
// See .claude/rules/testing.md.
// ---------------------------------------------------------------------------
const FILES = ["src/assets/scss/_candy.scss", "src/assets/scss/Global/_buttons.scss"];

/**
 * Fills that a hover rule may NOT set — every one of them is an accent.
 *
 * Matched on a WORD BOUNDARY, not as a substring: `$candy-pink` otherwise also
 * matches `$candy-pink-deep`, which would report the right rule for the wrong
 * reason (that one is yellow, not pink).
 */
const FORBIDDEN = [
  "$mem-blush",
  "$mem-blush-soft-static",
  "$candy-pink",
  "$candy-pink-soft",
  "$candy-pink-deep",
  "$mem-panel-static",
  "$mem-soft",
  "$mem-yellow",
];

/** Source with comments stripped, so prose about blush does not trip the scan. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * The bodies of every rule whose selector mentions `:hover`, nested rules
 * removed — a `&:hover { … }` block, not everything that surrounds it.
 */
function hoverBodies(source: string): { name: string; body: string }[] {
  const clean = code(source);
  const found: { name: string; body: string }[] = [];
  const opener = /([^\n{}]*(?::hover|-hover)[^{}]*)\{/g;

  for (let match = opener.exec(clean); match; match = opener.exec(clean)) {
    let depth = 0;
    let body = "";
    for (let i = match.index + match[0].length - 1; i < clean.length; i++) {
      const char = clean[i];
      if (char === "{") depth++;
      else if (char === "}") {
        depth--;
        if (depth === 0) break;
      }
      if (depth === 1 && char !== "{") body += char;
    }
    found.push({ name: match[1].trim(), body });
  }
  return found;
}

describe("hover has one source", () => {
  // A source-scanning test goes silently green when its parser breaks, so it
  // checks its own inputs first (.claude/rules/testing.md).
  it("finds the hover rules it claims to check", () => {
    const all = FILES.flatMap(file => hoverBodies(readFileSync(file, "utf8")));
    expect(all.length).toBeGreaterThanOrEqual(3);

    const names = all.map(rule => rule.name).join(" | ");
    expect(names).toMatch(/mem-row-plate-hover|candy-row-hover/);
    expect(names).toMatch(/:hover/);
  });

  it.each(FILES)("%s paints no hover fill outside the token", file => {
    const offenders: string[] = [];

    for (const { name, body } of hoverBodies(readFileSync(file, "utf8"))) {
      // `--row-fill` is the plate's indirection for the same token; it counts
      // as reading it, not as a second source.
      const fill = body.match(/(?:background-color|--row-fill)\s*:\s*([^;]+);/g) ?? [];
      for (const decl of fill) {
        const hit = FORBIDDEN.find(bad =>
          // `\$` for the sigil, `(?![\w-])` so `$candy-pink` does not swallow
          // `$candy-pink-deep` — a substring match names the wrong token.
          new RegExp(`\\${bad}(?![\\w-])`).test(decl)
        );
        if (hit) offenders.push(`${name}: ${decl.trim()} (${hit})`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("keeps the text and hatch tokens beside the fill", () => {
    // The fill went dark in the light theme, so a hover that swaps the surface
    // without swapping what sits on it leaves ink on ink. Both mixins that own
    // a hover surface have to name the text token.
    const candy = readFileSync("src/assets/scss/_candy.scss", "utf8");
    for (const mixin of ["candy-row-hover", "mem-row-plate-hover"]) {
      const body = hoverBodies(candy).find(rule => rule.name.includes(mixin))?.body ?? "";
      expect(body, `${mixin} does not set --mem-hover-text`).toMatch(/--mem-hover-text/);
    }
  });
});
