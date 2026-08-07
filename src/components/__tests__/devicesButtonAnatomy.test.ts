import { describe, expect, it } from "vitest";

import { block, styleBlock } from "./scssBlocks";

// ---------------------------------------------------------------------------
// The devices button is ONE button, on every screen it appears on.
//
// It has three hosts, and before this test they had drifted into three
// different controls:
//
//   BottomBar/Right.vue     desktop bar   plated via the host's `btn-action`
//   BottomBar/Left.vue      phone bar     `border: none; background: transparent`
//   NowPlaying/Header.vue   phone NP      a bare 44px box, no role at all
//
// So on a phone — the one device where group playback is the point — it was the
// only control in a row of plated ones with no surface at all, sitting next to a
// prev/play/next that all carry plate, frame and offset shadow. Reported by the
// user as "sieht nicht wie ein Button aus (kein Schatten etc.)".
//
// The shape of the bug is what makes it worth a census rather than a fix: none
// of the three hosts looked wrong on its own. Each was internally consistent,
// and the drift was only visible by putting two screens side by side. So the
// rule under test is not "the phone bar is plated" — it is "no host styles this
// button at all".
//
// ⚠️ A source-scanning test goes quietly green when its parser breaks (see
// .claude/rules/testing.md), so every expectation below is paired with a guard
// over its own input.
// ---------------------------------------------------------------------------
const SOURCES = import.meta.glob("/src/**/*.vue", { as: "raw", eager: true }) as Record<string, string>;

const COMPONENT = "/src/components/DeviceSync/DevicesButton.vue";

/** Every file that renders the button, and the selector it places it with. */
const HOSTS: [file: string, what: string][] = [
  ["/src/components/BottomBar/Left.vue", "the phone player bar"],
  ["/src/components/BottomBar/Right.vue", "the desktop player bar"],
  ["/src/components/NowPlaying/Header.vue", "the Now Playing header"],
];

/**
 * Selectors that would target the button itself. `.np-devices button` is in
 * here because a descendant selector is how the Now Playing header sized it
 * without ever naming it — the drift does not have to spell out the class.
 */
const OWNING_SELECTORS = [".devices-btn", ".bar-devices", ".ds-joined", ".np-devices button"];

describe("devices button anatomy", () => {
  it("takes its own role, at the chrome footprint", () => {
    const source = SOURCES[COMPONENT];
    expect(source, `${COMPONENT} not found — did it move?`).toBeTruthy();

    const css = styleBlock(source);
    // Guard over the input: the class has to be in there, or the two
    // expectations below are asserting against an empty string.
    expect(css, "no `.devices-btn` block — the parser or the file changed").toContain(".devices-btn");

    const body = block(css, ".devices-btn").body;
    expect(body).toMatch(/@include\s+btn-action\(\s*\$size:\s*\$bar-control\s*\)/);

    // The joined state is the app's other persistent on/off and wears the same
    // toggle box shuffle and repeat do — which is also what finally gives it
    // the offset shadow it never had (`candy-box` alone paints fill + frame).
    const joined = block(body, "&.ds-joined").body;
    expect(joined, "no `&.ds-joined` block inside `.devices-btn`").not.toBe("");
    expect(joined).toMatch(/@include\s+btn-toggle-on\(/);
    expect(joined, "the joined fill is the brand green, not a fresh literal").toContain("$brand-green");
  });

  it.each(HOSTS)("%s (%s) styles no part of it", file => {
    const source = SOURCES[file];
    expect(source, `${file} not found — did it move?`).toBeTruthy();

    const css = styleBlock(source);
    // Guard: every host renders the component, so the import must be there. If
    // this file stopped hosting the button, it belongs out of HOSTS rather than
    // passing vacuously.
    expect(source, `${file} no longer imports DevicesButton — update HOSTS`).toContain("DevicesButton");

    for (const selector of OWNING_SELECTORS) {
      // `:not(.devices-btn)` is an EXCLUSION, not a rule about the button — it
      // is how the desktop bar plates its other controls while leaving this one
      // to its own role. Only a selector that opens a block counts.
      expect(
        block(css, selector).body,
        `${file} styles \`${selector}\` — the devices button owns its whole anatomy ` +
          "in DevicesButton.vue, and a host patching it from outside is how the same " +
          "component became three different buttons."
      ).toBe("");
    }
  });
});
