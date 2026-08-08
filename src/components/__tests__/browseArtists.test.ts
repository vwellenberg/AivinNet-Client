import { readFileSync } from "node:fs";

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BrowseArtists from "@/components/SearchView/BrowseArtists.vue";
import useBrowseStore, { LETTERS } from "@/stores/searchBrowse";

import { blocks, ownDeclarations, styleBlock } from "./scssBlocks";

vi.mock("@/requests/useAxios", () => ({ default: vi.fn() }));

const artist = (name: string) => ({ name, artisthash: name, image: `${name}.webp` });

function mountBand(names: string[]) {
  const store = useBrowseStore();
  store.artists = names.map(artist) as never;
  // The row itself is CardScroller's business and pulls the router with it;
  // this test is about the band.
  return mount(BrowseArtists, { global: { stubs: { CardScroller: true } } });
}

describe("the letter band", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders one key per letter, plus the catch-all", () => {
    const keys = mountBand(["Air", "Bite"]).findAll(".band-key");
    expect(keys).toHaveLength(LETTERS.length);
    expect(keys[0].text()).toContain("#");
  });

  it("states the count on the keys that have one", () => {
    const keys = mountBand(["Air", "Alt-J", "Bite"]).findAll(".band-key");
    const a = keys[LETTERS.indexOf("A")];

    expect(a.find(".n").text()).toBe("2");
    expect(a.attributes("title")).toBe("2 artists under A");
    expect(keys[LETTERS.indexOf("B")].attributes("title")).toBe("1 artist under B");
  });

  // A key that vanishes when its letter is empty moves every other key, which
  // is the one thing a band people aim at must not do.
  it("keeps an empty letter visible, disabled and announced", () => {
    const z = mountBand(["Air"]).findAll(".band-key")[LETTERS.indexOf("Z")];

    expect(z.classes()).toContain("off");
    expect(z.attributes("disabled")).toBeDefined();
    expect(z.find(".n").exists()).toBe(false);
    expect(z.attributes("title")).toBe("No artists under Z");
  });

  it("announces which key is pressed", async () => {
    const w = mountBand(["Air", "Bite"]);
    const a = w.findAll(".band-key")[LETTERS.indexOf("A")];

    expect(a.attributes("aria-pressed")).toBe("false");
    await a.trigger("click");
    expect(a.attributes("aria-pressed")).toBe("true");
    expect(a.classes()).toContain("on");
  });

  it("renders nothing at all while the library has not arrived", () => {
    setActivePinia(createPinia());
    const w = mount(BrowseArtists, { global: { stubs: { CardScroller: true } } });
    expect(w.find(".browse-artists").exists()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The two rules that are invisible in a mounted component: the touch target and
// the plate under the band. Both are the kind that is correct on the day it is
// written and quietly lost later.
// ---------------------------------------------------------------------------
describe("the band's geometry", () => {
  const STYLE = styleBlock(readFileSync("src/components/SearchView/BrowseArtists.vue", "utf-8"));

  it("takes the pill role for its keys", () => {
    const key = ownDeclarations(blocks(STYLE, ".band-key")[0] ?? "");
    expect(key, "no .band-key block to read").toContain("min-width");
    expect(key).toMatch(/@include btn-pill/);
  });

  it("grows the key to the 44px floor on touch, gated on POINTER not width", () => {
    expect(
      STYLE,
      "the touch branch is gated on a width breakpoint — a narrow desktop window is " +
        "not a touch device, and a touch tablet is not narrow (styling.md)"
    ).toMatch(/@media\s*\(hover:\s*none\)/);

    const touch = /@media\s*\(hover:\s*none\)\s*\{([\s\S]*?)\n {2}\}/.exec(STYLE)?.[1] ?? "";
    expect(touch, "nothing inside the touch branch").toContain("band-key");
    expect(touch).toMatch(/height:\s*2\.75rem/);
    expect(touch).toMatch(/min-width:\s*2\.75rem/);
  });

  it("puts the band on a veil plate, because bare controls on the ground do not read", () => {
    const plate = ownDeclarations(blocks(STYLE, ".band-plate")[0] ?? "");
    expect(plate, "no .band-plate block to read").toContain("border-radius");
    expect(plate).toContain("var(--mem-veil)");
    expect(plate).toMatch(/border:\s*\$candy-border/);
  });
});
