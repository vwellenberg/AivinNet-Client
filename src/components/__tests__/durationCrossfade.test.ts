import { describe, expect, it } from "vitest";

import { styleBlock } from "./scssBlocks";

// ---------------------------------------------------------------------------
// The duration slot of a track row holds TWO elements in ONE place: the
// duration pill, and — where the backend sends `help_text` — a caption ("N
// plays") absolutely positioned over it. Only one of them may be visible, and
// the thing that decides which is `opacity` on `.song-duration`.
//
// That makes `opacity` on `.song-duration` a CHANNEL, not a free property. The
// row-hover block in SongItem.vue muted album and duration together with a
// blanket `opacity: 0.75`, which outranked both halves of the swap at higher
// specificity — so under the pointer both twins painted at 75 %, stacked, and
// the pill read as two numbers printed on top of each other. It hit every row
// of an artist page below 950px of content width, where the Plays column is
// dropped and `help_text` is the only surface for the count (#541).
//
// The bug is invisible in the file that caused it: SongItem.vue's block says
// "mute the duration", which is exactly what it looks like it does. The
// collision only exists because a component two files away spends the same
// property on something else. So the invariant is checked over BOTH files:
// anything that wants a track-row duration dimmer says so in `color`, and
// `opacity` stays with the pair that crossfades on it.
// ---------------------------------------------------------------------------

const SOURCES = import.meta.glob("/src/**/*.vue", { as: "raw", eager: true }) as Record<string, string>;

/** The one place the swap is allowed to be declared. */
const OWNER = "/src/components/shared/SongItem/TrackDuration.vue";

/** A selector qualified enough to mean "one specific twin", not "the slot". */
const TWIN = /\.has_help_text|\.help-text/;

/** `opacity` as a PROPERTY — `transition: opacity …` names it and sets nothing. */
const SETS_OPACITY = /(^|[;{}\s])opacity\s*:/;

interface Rule {
  selector: string;
  declarations: string;
}

/**
 * Every rule in a (nested) stylesheet as a flattened selector plus its own
 * declarations.
 *
 * At-rules (`@media`, `@include allPhones { … }`) are transparent: they change
 * when a rule applies, never what it selects — and a breakpoint override is
 * exactly where this kind of drift likes to hide.
 */
function rules(css: string, parent = ""): Rule[] {
  const out: Rule[] = [];
  let pending = "";
  let declarations = "";
  let i = 0;

  while (i < css.length) {
    const char = css[i];

    if (char === "{") {
      let depth = 1;
      let j = i + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === "{") depth++;
        else if (css[j] === "}") depth--;
        j++;
      }

      const head = pending.trim();
      const inner = css.slice(i + 1, j - 1);
      out.push(...rules(inner, head.startsWith("@") ? parent : `${parent} ${head.replace(/&/g, parent)}`));

      pending = "";
      i = j;
      continue;
    }

    if (char === ";") {
      declarations += `${pending};`;
      pending = "";
      i++;
      continue;
    }

    pending += char;
    i++;
  }

  out.push({ selector: parent.trim(), declarations });
  return out;
}

/** Every rule of every component whose selector reaches the duration slot. */
function durationRules(): Rule[] {
  return Object.entries(SOURCES)
    .filter(([, source]) => source.includes(".song-duration"))
    .flatMap(([, source]) => rules(styleBlock(source)))
    .filter(rule => /\.song-duration\b/.test(rule.selector));
}

describe("the track-row duration slot", () => {
  it("has rules to inspect at all", () => {
    // The parser is the weak point of a source-scanning test: broken, it finds
    // nothing and reports success (.claude/rules/testing.md).
    expect(durationRules().length).toBeGreaterThanOrEqual(4);
  });

  it("spends `opacity` only on the crossfade between the two twins", () => {
    const offenders = durationRules()
      .filter(rule => SETS_OPACITY.test(rule.declarations))
      .filter(rule => !TWIN.test(rule.selector))
      .map(rule => rule.selector.replace(/\s+/g, " "));

    // A dimmer for the whole slot belongs in `color` (color-mix mutes the text
    // and the pill's currentColor ring alike); `opacity` here silently unstacks
    // the swap.
    expect(offenders).toEqual([]);
  });

  it("swaps duration for caption under the pointer, pointer-gated", () => {
    const css = styleBlock(SOURCES[OWNER]);
    const gated = css.slice(css.indexOf("@media (hover: hover)"));

    expect(css).toContain("@media (hover: hover)");

    const swap = rules(gated).filter(rule => /\.song-duration\b/.test(rule.selector));
    const fadesOut = swap.find(rule => /\.has_help_text/.test(rule.selector));
    const fadesIn = swap.find(rule => /\.help-text/.test(rule.selector) && !/\.has_help_text/.test(rule.selector));

    // Both halves, and both inside the gate: `:hover` latches after a tap on
    // touch, so a half-gated swap would strand the caption on the tapped row.
    expect(fadesOut?.declarations).toMatch(/opacity\s*:\s*0\s*;/);
    expect(fadesIn?.declarations).toMatch(/opacity\s*:\s*1\s*;/);
  });
});
