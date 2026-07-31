import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Every card type a `.cardscroller` row can render has to be listed in the
// shared anatomy block of src/assets/scss/Global/cards.scss.
//
// This is a test rather than a comment because the list is invisible from the
// component: a card that is missing from it still renders, just at its own
// height, radius and elevation — and only in a row that happens to mix it with
// another type does anyone notice. The folder tile sat outside the list and
// measured 176x245 next to a 176x248 playlist tile in "Recently played", with a
// 16px radius instead of 14px and no offset shadow.
// ---------------------------------------------------------------------------
const SOURCES = import.meta.glob("/src/**/*.vue", { as: "raw", eager: true }) as Record<string, string>;
const ANATOMY = import.meta.glob("/src/assets/scss/Global/cards.scss", { as: "raw", eager: true }) as Record<
  string,
  string
>;

const SCROLLER = "/src/components/shared/CardScroller.vue";

// The skeleton shown while a row has no data. Deliberately out of the shared
// anatomy: a placeholder row is never mixed with real tiles (it exists only
// when the row is empty), and its four stacked bars do not fit the
// image + one text zone skeleton.
const EXEMPT = new Set(["CardContent"]);

/** Resolve an import specifier from CardScroller.vue to a key in SOURCES. */
function resolve(specifier: string): string {
  if (specifier.startsWith("@/")) return specifier.replace("@/", "/src/");

  const parts = "/src/components/shared".split("/").filter(Boolean);
  for (const segment of specifier.split("/")) {
    if (segment === ".") continue;
    else if (segment === "..") parts.pop();
    else parts.push(segment);
  }
  return "/" + parts.join("/");
}

/**
 * The components `getComponent()` can return, mapped to their source files.
 * Read out of the switch rather than listed here, so a new `case` shows up
 * without anyone remembering to add it.
 */
function cardComponents(): Map<string, string> {
  const source = SOURCES[SCROLLER];
  const imports = new Map<string, string>();

  for (const [, name, specifier] of source.matchAll(/import\s+(\w+)\s+from\s+["']([^"']+\.vue)["']/g)) {
    imports.set(name, resolve(specifier));
  }

  const body = source.slice(source.indexOf("function getComponent"));
  const returned = new Set(
    [...body.slice(0, body.indexOf("\n}")).matchAll(/return\s+(\w+)/g)].map(match => match[1])
  );

  const cards = new Map<string, string>();
  for (const name of returned) {
    if (EXEMPT.has(name)) continue;
    const file = imports.get(name);
    expect(file, `${name} is returned by getComponent but not imported as a .vue file`).toBeTruthy();
    cards.set(name, file as string);
  }
  return cards;
}

/** The class list of a single-file component's root element. */
function rootClasses(source: string): string[] {
  const template = source.slice(source.indexOf("<template>"));
  let i = 0;

  while (i < template.length) {
    const lt = template.indexOf("<", i);
    if (lt === -1) break;

    if (template.startsWith("<!--", lt)) {
      const end = template.indexOf("-->", lt);
      i = end === -1 ? template.length : end + 3;
      continue;
    }

    // Walk to the tag's own ">", skipping quoted attribute values so a ">"
    // inside a binding cannot end the tag early.
    let j = lt + 1;
    let quote = "";
    while (j < template.length) {
      const c = template[j];
      if (quote) {
        if (c === quote) quote = "";
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === ">") {
        break;
      }
      j++;
    }

    const raw = template.slice(lt + 1, j);
    const name = (raw.match(/^[\w.-]+/) || [""])[0];
    // <template> itself is the wrapper, not the root element.
    if (name && name !== "template") {
      const match = raw.match(/\bclass="([^"]*)"/);
      return match ? match[1].trim().split(/\s+/) : [];
    }
    i = j + 1;
  }

  return [];
}

/** The selectors of the shared anatomy block, e.g. ["p-card", "trackcard", …]. */
function anatomyClasses(): Set<string> {
  // Comments go FIRST. The file explains itself in prose that names the very
  // class names being looked for (".cardscroller", ".foldercard"), so parsing
  // the raw text would let a card pass this test by being mentioned in a
  // comment rather than by being in the selector list.
  const scss = ANATOMY["/src/assets/scss/Global/cards.scss"]
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");

  const outer = scss.indexOf("{", scss.indexOf(".cardscroller"));
  const selectors = scss.slice(outer + 1, scss.indexOf("{", outer + 1));
  return new Set([...selectors.matchAll(/\.([\w-]+)/g)].map(match => match[1]));
}

describe("card row anatomy", () => {
  const cards = cardComponents();
  const listed = anatomyClasses();

  it("finds the card components CardScroller can render", () => {
    // A guard on the parsing above: if the switch is rewritten in a shape this
    // test cannot read, the checks below would pass vacuously.
    expect(cards.size).toBeGreaterThanOrEqual(6);
  });

  it.each([...cards])("%s is covered by the shared anatomy", (_name, file) => {
    const classes = rootClasses(SOURCES[file]);
    expect(classes.length, `${file} root element has no class to key the anatomy off`).toBeGreaterThan(0);
    expect(
      classes.some(cls => listed.has(cls)),
      `${file} root is class="${classes.join(" ")}" — none of these is listed in Global/cards.scss, ` +
        `so this tile computes its own height/radius/elevation and drifts from the rest of the row`
    ).toBe(true);
  });

  // `.rounded` is border-radius: 1rem and overrides the 14px `$candy-radius`
  // the anatomy's tiles share. Three cards carried it and were visibly a
  // different shape in the same row.
  it.each([...cards])("%s does not override the shared radius with .rounded", (_name, file) => {
    expect(rootClasses(SOURCES[file])).not.toContain("rounded");
  });
});
