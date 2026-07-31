import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Hover on a list row is ONE decision: `candy-row-base` + `candy-row-hover` in
// src/assets/scss/_candy.scss (light fill inside the ink frame, with the frame
// reserved as a transparent border so nothing shifts).
//
// This is a test rather than a comment because the same row drifted three
// times. The folder list hovered with no frame at all (`border: none`), the nav
// and playlist rows reserved the border but only ever coloured the fill, and
// the sidebar's folder header — the row the user reported — kept doing exactly
// that after both of those were fixed, sitting one line below a playlist row
// that drew the frame. Hand-writing `&:hover { background-color: … }` looks
// finished at the call site; only the neighbouring row reveals it isn't.
// ---------------------------------------------------------------------------

// Read through Vite rather than `fs`, so the test sees exactly the files the
// build sees. (`.scss` would come back EMPTY through this glob — see
// .claude/rules/testing.md — hence every row host here is a .vue file.)
const SOURCES = import.meta.glob("/src/**/*.vue", { as: "raw", eager: true }) as Record<string, string>;

/** Every row list in the app, as file + the selector that owns the row. */
const ROWS = [
  { file: "/src/components/LeftSidebar/index.vue", selector: ".sidebar-folder-header" },
  { file: "/src/components/LeftSidebar/index.vue", selector: ".sidebar-playlist-item" },
  { file: "/src/components/LeftSidebar/NavButtons.vue", selector: ".nav-item" },
  { file: "/src/components/FolderView/FolderList.vue", selector: ".f-item" },
  { file: "/src/components/shared/SongItem.vue", selector: ".songlist-item" },
];

/** The static light fills a hovered/marked row is allowed to wear. */
const ROW_FILLS = ["$candy-pink-soft", "$mem-panel-static", "$mem-blush-soft-static"];

function stripComments(source: string): string {
  // `[^:]` guards `https://` — a line comment never follows a colon here.
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** The rule starting at `start`, from its selector to its matching brace. */
function blockFrom(clean: string, start: number, firstBrace: number): string | null {
  let depth = 0;
  for (let i = firstBrace; i < clean.length; i++) {
    if (clean[i] === "{") depth++;
    else if (clean[i] === "}" && --depth === 0) return clean.slice(start, i);
  }
  return null;
}

/**
 * The body of the rule whose selector list starts a line and matches `pattern`
 * exactly, found by brace matching. Selector-scoped rather than file-scoped so
 * `.songlist-item` is not confused with `.songlist-item.contexton`.
 */
function ruleBody(source: string, pattern: RegExp): string | null {
  const clean = stripComments(source);
  const match = pattern.exec(clean);
  if (!match) return null;
  return blockFrom(clean, match.index, match.index + match[0].length - 1);
}

function rowBody(source: string, selector: string): string | null {
  return ruleBody(source, new RegExp(`^\\s*${selector.replace(".", "\\.")}\\s*\\{`, "m"));
}

/** The `&:hover` (or `&:hover:not(…)`) rule nested inside a row's body. */
function hoverBody(rowSource: string): string | null {
  return ruleBody(rowSource, /^\s*&:hover[^{]*\{/m);
}

/** Every `:hover` rule in a file, whatever it is nested under. */
function hoverBodies(source: string): string[] {
  const clean = stripComments(source);
  const bodies: string[] = [];
  const opener = /[^\n{}]*:hover[^{}]*\{/g;

  for (let match = opener.exec(clean); match; match = opener.exec(clean)) {
    const body = blockFrom(clean, match.index, match.index + match[0].length - 1);
    if (body) bodies.push(body);
  }
  return bodies;
}

describe("list row hover", () => {
  // A source-scanning test goes silently GREEN when its parser breaks, so it
  // needs guards over its own inputs first (.claude/rules/testing.md).
  it("reads the row sources it claims to check", () => {
    for (const { file, selector } of ROWS) {
      expect(SOURCES[file], `${file} not readable`).toBeTruthy();
      const body = rowBody(SOURCES[file], selector);
      expect(body, `${selector} not found in ${file}`).toBeTruthy();
      expect(body!.length).toBeGreaterThan(50);
    }
  });

  it.each(ROWS)("$selector takes both halves from the shared mixins", ({ file, selector }) => {
    const body = rowBody(SOURCES[file], selector)!;

    // The base half reserves the frame. Without it the row's content jumps by
    // the border width the moment the frame appears.
    expect(body).toMatch(/@include\s+candy-row-base/);

    const hover = hoverBody(body);
    expect(hover, `${selector} has no &:hover rule`).toBeTruthy();
    expect(hover!).toMatch(/@include\s+candy-row-hover/);
  });

  // The regression the user reported: a sidebar row that fills on hover without
  // drawing the frame. Scoped to the sidebar by the row fills themselves, so a
  // non-row hover (the resize handle's deep pink, the play overlay's black
  // scrim) is out of scope without needing to be named in an exception list.
  it("never fills a sidebar row on hover without the frame", () => {
    const offenders: string[] = [];

    for (const [file, source] of Object.entries(SOURCES)) {
      if (!file.startsWith("/src/components/LeftSidebar/")) continue;

      for (const hover of hoverBodies(source)) {
        const fills = ROW_FILLS.some(fill => hover.includes(fill));
        if (fills && !/@include\s+candy-row-hover/.test(hover)) {
          offenders.push(`${file}: ${hover.split("\n")[0].trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  // Same idea as the header-action row census: a new row that uses either half
  // of the treatment has to be listed above, and is then checked for both.
  // (A row that hand-rolls the whole thing still escapes — the sidebar guard
  // above is what catches that where it has actually happened.)
  it("knows about every row that uses the shared treatment", () => {
    const found = Object.entries(SOURCES)
      .filter(([, source]) => /@include\s+candy-row-(base|hover)/.test(stripComments(source)))
      .map(([file]) => file)
      .sort();

    expect(found).toEqual([...new Set(ROWS.map(row => row.file))].sort());
  });
});
