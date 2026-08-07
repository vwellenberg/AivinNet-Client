import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { block, styleBlock } from "./scssBlocks";

// ---------------------------------------------------------------------------
// The settings modal has ONE height for every pane.
//
// Its panes differ a lot in length — Profile is a handful of fields, Appearance
// is nine setting plates — and the modal is centred, so a box sized by its
// content moved all four edges on every tab switch. Measured at 1440x900 before
// the fix: Appearance at y=32 h=836, every other pane at y=113 h=674, i.e. the
// close button and the whole nav list jumped 81px between two clicks. The user
// reported it as the window jumping back and forth.
//
// Two declarations carry the fix, in two different files:
//   - `.m-content.settings` states the height, from the token, capped by the
//     window (a pane scrolls inside the frame — it already could)
//   - `.settingsmodal` takes `flex: 1`, or it would keep sizing itself to its
//     content inside a box that now has a height of its own, leaving the
//     sidebar's frame hanging in mid-air
//
// That the frame actually stands still was verified in a browser: identical
// rects across all seven tabs at 1440x900 and 1280x720, and across list/detail
// at 390 and 360 wide.
// ---------------------------------------------------------------------------

const read = (path: string) => readFileSync(path, "utf-8");

const VARIABLES = read("src/assets/scss/_variables.scss");
const MODAL = styleBlock(read("src/components/modal.vue"));
const SETTINGS = styleBlock(read("src/components/modals/Settings.vue"));

/** A rule body, with a guard so a broken parse fails loudly instead of green. */
function rule(css: string, selector: string): string {
  const { body } = block(css, selector);
  expect(body, `${selector} not found`).not.toBe("");
  return body;
}

describe("the settings modal keeps one height", () => {
  it("declares that height as a token", () => {
    expect(VARIABLES).toMatch(/^\$settings-modal-h:\s*\d+(\.\d+)?rem;/m);
  });

  it("sizes the modal from the token, not from its content", () => {
    const settings = rule(MODAL, ".m-content.settings");
    // A `min()` against the window keeps a short viewport from being overrun;
    // what must not come back is a height that follows the pane.
    expect(settings).toMatch(/height:.*\$settings-modal-h/);
  });

  it("lets the panes fill that height", () => {
    expect(rule(SETTINGS, ".settingsmodal")).toMatch(/flex:\s*1;/);
  });
});
