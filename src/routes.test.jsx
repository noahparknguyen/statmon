import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Dex from "./pages/Dex";
import TypeChart from "./pages/TypeChart";
import Credits from "./pages/Credits";
import StyleGuide from "./pages/StyleGuide";
import NotFound from "./pages/NotFound";
import { ALL_POKEMON, getBySlug, spriteFor } from "./lib/pokemon";
import { WALL_TILES } from "./components/SpriteWall";
import { sortRows } from "./lib/dexTable";

// Renders every route to a string and asserts it produced something. This is a
// smoke test, not a snapshot: it catches the errors that only show up when a
// component actually runs — a bad import, a null deref on an empty selection, a
// hook used wrongly — which unit tests over lib/ cannot see.
//
// react-dom/server needs no DOM, so this stays inside the "pure logic only" test
// setup: no jsdom, no component-testing library. Anything about layout, scroll
// or interaction is still verified by hand against the running app.
//
// The route table is duplicated from router.jsx rather than imported because
// createBrowserRouter needs a browser history; the shape is what matters here.
const routes = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "compare", element: <Compare /> },
      { path: "compare/:p1/vs/:p2", element: <Compare /> },
      { path: "dex", element: <Dex /> },
      { path: "types", element: <TypeChart /> },
      { path: "types/:t1", element: <TypeChart /> },
      { path: "types/:t1/:t2", element: <TypeChart /> },
      { path: "credits", element: <Credits /> },
      { path: "style", element: <StyleGuide /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

const render = (path) =>
  renderToString(
    <RouterProvider
      router={createMemoryRouter(routes, { initialEntries: [path] })}
    />,
  );

// Rendered text rather than raw markup, for assertions that would otherwise trip
// over the site's own markup: sr-only spans ("<sr-only>Generation </sr-only>5"),
// and the comment node React inserts between text and an expression. Hoisted
// here when a third describe wanted it.
const text = (path) =>
  render(path)
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");

// A prop that quietly stopped being passed renders as "undefined" in the markup
// rather than throwing, which every other test here would sail straight past —
// this caught `/style` still handing GenerationStrip the prop names it had
// before a rename, showing an empty label and the wrong chip pressed. Cheap,
// and it covers every route at once.
describe.each([
  "/",
  "/compare",
  "/compare/charizard/vs/blastoise?asof=1",
  "/dex",
  "/dex?asof=1",
  "/types",
  "/types/water/flying",
  "/types/water/flying?asof=1",
  "/credits",
  "/style",
  "/no-such-page",
])("route %s", (path) => {
  it("renders no undefined props into the markup", () => {
    const html = render(path);
    for (const smell of ["undefined", "NaN", "[object Object]"]) {
      expect(html, `${path} rendered "${smell}"`).not.toContain(smell);
    }
  });
});

describe.each([
  ["/", "Statmon"],
  ["/compare", "Compare"],
  ["/compare/volcarona/vs/chandelure", "Volcarona"],
  ["/dex", "Dex"],
  ["/credits", "Credits"],
  ["/style", "Style"],
  ["/no-such-page", "Statmon"],
])("route %s", (path, expected) => {
  it("renders without throwing", () => {
    const html = render(path);
    expect(html).toContain(expected);
  });
});

describe("the compare route's generation views (D-045)", () => {
  it("renders a Gen 1 board with five stats and a Special", () => {
    const html = render("/compare/charizard/vs/blastoise?asof=1");
    expect(html).toContain("Spc");
    expect(html).not.toContain("SpA");
    expect(html).not.toContain("SpD");
    // Five-stat totals, so both read 425 (78+84+78+85+100 and 79+83+100+85+78)
    // where today they are 534 and 530 — Gen 1 had one fewer stat to add up.
    // (React splits text from an expression with a comment node, hence the
    // strip: the markup is literally `Both <!-- -->425`.)
    expect(html.replace(/<!-- -->/g, "")).toContain("Both 425");
    expect(html).toContain("Tied");
    expect(html).not.toContain("534");
    expect(html).not.toContain("530");
  });

  it("keeps the current board on the modern six stats", () => {
    const html = render("/compare/charizard/vs/blastoise");
    expect(html).toContain("SpA");
    expect(html).not.toContain("Spc");
  });

  it("shows the generation strip on every state of the page", () => {
    // The strip's presence used to depend on a computation across both slots,
    // which made it appear and vanish for reasons nothing on screen explained
    // (D-046) — and on the empty page it arrived with the first pick and pushed
    // the board down (D-050). It is now unconditional.
    for (const path of [
      "/compare",
      "/compare/charizard/vs/blastoise",
      "/compare/volcarona/vs/chandelure",
      "/compare?p1=charizard",
    ]) {
      expect(render(path)).toContain("Stats as of");
    }
  });

  it("offers the whole timeline before anything is picked", () => {
    const board = text("/compare");
    for (const gen of [1, 5, 9]) expect(board).toContain(`Generation ${gen}`);
  });

  it("starts the strip at the later debut, so a mixed pair cannot reach Gen 1", () => {
    // Volcarona arrived in Gen 5, so Charizard's Gen 1 stats are unreachable
    // here — which is the answer to comparing a Gen 1 Pokémon with a modern
    // one: five stats never face six.
    const board = text("/compare/charizard/vs/volcarona");
    expect(board).toContain("Generation 5");
    expect(board).not.toContain("Generation 1 ");
    // The strip runs 5–9, so a hand-typed ?asof=1 has nothing to land on.
    expect(render("/compare/charizard/vs/volcarona?asof=1")).toContain("SpA");
  });

  it("marks the generations whose board differs from today", () => {
    // Butterfree's Sp. Atk changed after Gen 5; Volcarona debuted in Gen 5, so
    // the shared strip is 5–9 with exactly one generation marked.
    const marked = render("/compare/butterfree/vs/volcarona").match(
      /stats differ from today/g,
    );
    expect(marked).toHaveLength(1);
    expect(
      render("/compare/volcarona/vs/chandelure").match(
        /stats differ from today/g,
      ),
    ).toBeNull();
  });

  it("scores the STAB matchup on the era's own chart", () => {
    // Gengar is Ghost/Poison. Into Psychic-type Alakazam, Ghost is 2× today and
    // 0× in Gen 1 — the bug the games shipped with.
    expect(render("/compare/gengar/vs/alakazam")).toContain("2×");
    expect(render("/compare/gengar/vs/alakazam?asof=1")).toContain("0×");
  });

  it("falls back to the current view for a generation this matchup never had", () => {
    // Volcarona did not exist in Gen 1, so the parameter is meaningless here.
    const html = render("/compare/volcarona/vs/chandelure?asof=1");
    expect(html).toContain("SpA");
    expect(html).not.toContain("Spc");
  });
});

describe("the dex route's generation lens (D-049)", () => {
  it("renders a Gen 1 dex with five stat columns and a Special", () => {
    const html = render("/dex?asof=1");
    expect(html).toContain('aria-rowcount="151"');
    expect(html).toContain("Spc");
    expect(html).not.toContain("SpA");
  });

  it("caps the rows at what existed, by form rather than by species", () => {
    // forms=1, because this is testing the era ceiling and the default hides
    // forms (D-056) — Alolan Raichu has to be reachable for its absence here
    // to mean anything.
    const html = render("/dex?asof=3&forms=1");
    const expected = ALL_POKEMON.filter((p) => p.introducedIn <= 3).length;
    expect(html).toContain(`aria-rowcount="${expected}"`);
    expect(html).not.toContain("Volcarona");
    // A Gen 1 species whose form arrived in Gen 7.
    expect(html).not.toContain("Raichu Alola");
    expect(html).toContain("Raichu");
  });

  it("ranks by the generation's own values", () => {
    const html = render("/dex?asof=1&sort=special&dir=desc");
    expect(html.indexOf("Mewtwo")).toBeLessThan(html.indexOf("Alakazam"));
    // Tentacruel's Gen 1 Special of 120 is 9th of the 151; its modern Sp. Atk
    // of 80 would be nowhere near the first screen.
    expect(html).toContain("Tentacruel");
  });

  it("shrinks the filters to the generation", () => {
    const html = render("/dex?asof=1");
    expect(html).not.toContain("Fairy");
    expect(html).not.toContain("Gen 7");
    // The origin filter disappears entirely at Gen 1: "introduced in Gen 1" is
    // every row the Gen 1 dex already has, so it could only be a no-op (D-050).
    expect(html).not.toContain("Introduced in");
    expect(render("/dex?asof=3")).toContain("Introduced in");
    expect(render("/dex")).toContain("Fairy");
  });

  it("counts against the generation's dex, not all 1,259", () => {
    expect(render("/dex?asof=1")).toContain("151 Pokémon");
    expect(render("/dex?asof=1")).not.toContain("of 1,259");
  });

  it("survives a lens the dataset cannot honour", () => {
    expect(render("/dex?asof=99&sort=nonsense")).toContain(
      'aria-rowcount="1025"',
    );
  });
});

describe("the type chart route (D-051)", () => {
  it("keeps the header within a 320px screen", () => {
    // Four tools plus the wordmark do not fit on the narrowest phones, and a
    // header that overflows scrolls every page on the site sideways (D-054).
    // The markup check is the cheap half; the sweep measures the real width.
    expect(render("/types")).toContain("hidden xs:inline");
  });

  it("is reachable from the primary nav on every page", () => {
    // A tool nobody can navigate to is not shipped. The Home chip going live
    // is D-043's rule; this is the header, which is easy to forget because the
    // page works perfectly when you type the URL yourself.
    for (const path of ["/", "/compare", "/dex", "/types", "/credits"]) {
      expect(render(path)).toContain('href="/types"');
    }
  });

  it("renders the grid with no typing selected", () => {
    const html = render("/types");
    expect(html).toContain("Full chart");
    // 18 attacking rows + the header row.
    expect((html.match(/<tr/g) ?? []).length).toBe(19);
    // No tier readout until something is picked. (Checked by the section's own
    // id — the grid's row-header carries an sr-only "Attacking type" of its own.)
    expect(html).not.toContain("matchup-heading");
  });

  it("leaves 1× cells blank so only the deviations are marked", () => {
    const html = render("/types");
    // Normal attacking: only Rock (½×), Ghost (0×) and Steel (½×) deviate, so
    // three marked cells in a row of eighteen.
    expect((html.match(/½×/g) ?? []).length).toBeGreaterThan(0);
    // Every blank cell still says 1× to a screen reader.
    expect(html).toContain("1×");
  });

  it("answers a dual typing in tiers, strongest first", () => {
    expect(render("/types/water/flying")).toContain("matchup-heading");
    const board = text("/types/water/flying");
    expect(board).toContain("4×");
    // Electric is the 4× answer for Water/Flying; Ground does nothing.
    expect(board.indexOf("4×")).toBeLessThan(board.indexOf("0×"));
    expect(board).toContain("Electric");
    expect(board).toContain("Ground");
  });

  it("canonicalises the typing so one view has one URL", () => {
    expect(render("/types/flying/water")).toBe(render("/types/water/flying"));
  });

  it("shrinks the chart to the generation being read", () => {
    const gen1 = text("/types?asof=1");
    // 15 types in Gen 1: no Dark, Steel or Fairy on either axis or in the picker.
    expect(gen1).not.toContain("Fairy");
    expect(gen1).not.toContain("Steel");
    const html = render("/types?asof=1");
    expect((html.match(/<tr/g) ?? []).length).toBe(16);
  });

  it("scores the readout on the era's chart", () => {
    // Ghost did nothing to Psychic in Gen 1 (D-047), so it sits in the 0× tier.
    const gen1 = text("/types/psychic?asof=1");
    expect(gen1.slice(gen1.indexOf("0×"))).toContain("Ghost");
  });

  it("drops a type the generation never had", () => {
    // Fairy did not exist in Gen 5, so this degrades to Water alone.
    const board = text("/types/water/fairy?asof=5");
    expect(board).not.toContain("Fairy");
    expect(board).toContain("Water");
  });

  it("survives an unknown type without blowing up", () => {
    expect(render("/types/plastic")).toContain("Full chart");
  });
});

describe("the dex route", () => {
  it("renders a windowed slice of rows, not all 1,259", () => {
    const rowCount = (render("/dex").match(/aria-rowindex/g) ?? []).length;
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThan(100);
  });

  it("declares the full row count for assistive tech", () => {
    // 1,025 default forms: alternate forms are hidden by default (D-056), and
    // the whole 1,259 is one toggle away.
    expect(render("/dex")).toContain('aria-rowcount="1025"');
    expect(render("/dex?forms=1")).toContain('aria-rowcount="1259"');
  });

  it("applies sort and filters from the URL", () => {
    const html = render("/dex?sort=speed&dir=desc&type=fire&gen=5&forms=1");
    expect(html).toContain('aria-sort="descending"');
    // Filtered down from the full dex.
    expect(html).not.toContain('aria-rowcount="1259"');
    // Fastest Gen 5 Fire type (135) sorts above the next fastest (101) — an
    // ordering assertion, not just "the name appears somewhere on the page".
    expect(html.indexOf("Darmanitan Galar Zen")).toBeGreaterThan(-1);
    expect(html.indexOf("Darmanitan Galar Zen")).toBeLessThan(
      html.indexOf("Simisear"),
    );
  });

  it("ORs multiple types and generations from the URL", () => {
    const html = render("/dex?type=fire,fighting&gen=1,3,5&forms=0");
    const expected = ALL_POKEMON.filter(
      (p) =>
        p.isDefault &&
        [1, 3, 5].includes(p.generation) &&
        (p.types.includes("fire") || p.types.includes("fighting")),
    ).length;
    expect(html).toContain(`aria-rowcount="${expected}"`);
    // Wider than either type alone, which is the point of the union.
    const fireOnly = ALL_POKEMON.filter(
      (p) =>
        p.isDefault &&
        [1, 3, 5].includes(p.generation) &&
        p.types.includes("fire"),
    ).length;
    expect(expected).toBeGreaterThan(fireOnly);
  });

  it("counts the same rows a direct dataset query does", () => {
    const html = render("/dex?type=fire&gen=5&forms=0");
    const expected = ALL_POKEMON.filter(
      (p) => p.isDefault && p.generation === 5 && p.types.includes("fire"),
    ).length;
    expect(expected).toBe(15);
    expect(html).toContain(`aria-rowcount="${expected}"`);
  });

  it("survives an unparseable view without blowing up", () => {
    expect(render("/dex?sort=nonsense&gen=99&type=plastic")).toContain(
      'aria-rowcount="1025"',
    );
  });

  it("lifts every sticky header cell above the rows that scroll under it", () => {
    const html = render("/dex");
    // The stat cells position their fill and number, and a positioned element
    // paints over a non-positioned one — so without an explicit z-index the
    // bars drew straight over the sticky header (D-041). Guarded here because
    // it only shows up once the page is scrolled, which no unit test does.
    const headerCells = html.match(/<th\b/g) ?? [];
    const lifted = html.match(/z-index:var\(--z-raised\)/g) ?? [];
    expect(headerCells.length).toBeGreaterThan(0);
    expect(lifted).toHaveLength(headerCells.length);
  });

  it("says so when nothing matches", () => {
    expect(render("/dex?q=zzzznotapokemon")).toContain("No Pokémon match");
  });
});

describe("Home's feature previews (D-043)", () => {
  const html = () => render("/");

  it("still shows the flagship board, under the hero wall", () => {
    const page = html();
    expect(page).toContain("Volcarona");
    expect(page).toContain("Chandelure");
    // The wall opens the page and the board follows it (D-070). Asserted by
    // order rather than by presence, because "the board is on Home somewhere"
    // was true of every layout this page has had.
    expect(page.indexOf("A simple set of Pokémon tools")).toBeLessThan(
      page.indexOf("Volcarona"),
    );
  });

  // The dex preview is the Black & White team (D-044) — the run the project came
  // out of. Asserted by name so the easter egg cannot be lost to a refactor.
  const TEAM = [
    "samurott",
    "krookodile",
    "chandelure",
    "volcarona",
    "archeops",
    "mienshao",
  ];

  it("previews the dex with the Black & White team", () => {
    const page = html();
    for (const slug of TEAM) {
      expect(page).toContain(getBySlug(slug).name);
    }
  });

  it("orders those rows by real descending Speed, not by hand", () => {
    const expected = sortRows(TEAM.map(getBySlug), "speed", "desc").map(
      (p) => p.name,
    );
    expect(expected[0]).toBe("Archeops");
    // Scoped to the preview table: two of the six are the flagship's mascots and
    // appear higher up the page, so searching the whole document would find
    // the flagship board's copy of them rather than the row.
    const page = html();
    const preview = page.slice(page.indexOf(`aria-rowcount="${TEAM.length}"`));
    const positions = expected.map((name) => preview.indexOf(name));
    expect(positions.every((i) => i > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("labels the Speed column as sorted, which it truthfully is", () => {
    expect(html()).toContain('aria-sort="descending"');
  });

  it("shows only the preview slice, never the whole dex", () => {
    const rows = (html().match(/aria-rowindex/g) ?? []).length;
    // Six preview rows; the flagship board has none.
    expect(rows).toBe(TEAM.length);
    expect(html()).toContain(`aria-rowcount="${TEAM.length}"`);
  });

  it("links each preview to the tool it advertises", () => {
    expect(html()).toContain('href="/compare"');
    expect(html()).toContain('href="/dex"');
  });

  it("keeps one h1 and puts the preview heading below it", () => {
    expect((html().match(/<h1/g) ?? []).length).toBe(1);
    expect(html().indexOf("<h1")).toBeLessThan(html().indexOf("<h2"));
  });

  // The flagship went unnamed on Home while every other tool reused its page's
  // title and one-liner (D-067). These four assertions are what stop it from
  // going quietly unnamed again, or from drifting away from the page it sells.
  it("names the flagship, in the tool's own words", () => {
    // The apostrophe in "who's" renders as &#x27;, so the assertion starts
    // after it — this is still the whole of the rest of the sentence, and
    // matching on entity encoding would be a test of React, not of the copy.
    const SUBTITLE = "faster, hits harder, and is bulkier.";
    // Asserted on both surfaces rather than written down once: if /compare
    // rewrites its one-liner, this fails instead of letting Home advertise the
    // old one.
    expect(render("/compare")).toContain(SUBTITLE);
    expect(html()).toContain(SUBTITLE);
  });

  it("heads all three sections, in page order", () => {
    const page = text("/");
    const at = (s) => page.indexOf(s);
    expect(at("Compare")).toBeGreaterThan(-1);
    expect(at("Compare")).toBeLessThan(at("Dex"));
    expect(at("Dex")).toBeLessThan(at("Types"));
    // One h1 (the wordmark) over one h2 per tool.
    expect((html().match(/<h2/g) ?? []).length).toBe(3);
  });

  it("drops the sr-only heading that named the mascots, not the tool", () => {
    expect(html()).not.toContain("Example comparison");
  });

  // The type preview is the defensive read — what beats Ground / Dark — and is
  // unreadable without saying so, hence the shared MatchupHeading (D-067).
  it("says what the type preview's tiers are attacking", () => {
    const page = text("/");
    expect(page).toContain("Attacking");
    expect(page.indexOf("Attacking")).toBeGreaterThan(page.indexOf("Types"));
    // Krookodile's typing, and the tiers the real chart computes for it:
    // strongest first, down to the two attacking types that do nothing at all.
    expect(page).toContain("Ground");
    expect(page).toContain("Dark");
    expect(page.indexOf("2×")).toBeLessThan(page.indexOf("0×"));
    expect(page).toContain("Electric");
    expect(page).toContain("Psychic");
  });

  // The section's promise is "every matchup, including dual types" — the one
  // thing the tool exists for that a per-type page cannot do (D-051). Previewing
  // it with a single type would advertise the wrong capability (D-068).
  it("previews the type chart with a dual typing, and links to it", () => {
    expect(getBySlug("krookodile").types).toHaveLength(2);
    expect(html()).toContain('href="/types/ground/dark"');
  });

  // The wall is the page's greeting (D-070) and is sampled, not listed: it walks
  // the default forms in dex order, so it must actually cross the whole series
  // rather than showing the first 56 Pokémon.
  it("samples the hero wall across every generation", () => {
    const html = render("/");
    const sprites = html.match(/image-rendering:pixelated/g) ?? [];
    // The wall's 2x2 tiling, plus the six dex rows and the flagship board's two
    // heads. The 2x2 is what makes the diagonal loop seam-free, so a change to
    // it is a change to the animation and should fail here.
    expect(sprites.length).toBe(WALL_TILES * 4 + 8);
    // The sample starts at the top of the dex.
    expect(html).toContain(spriteFor(getBySlug("bulbasaur")));
  });

  // The hero's tagline is `primary` where every other tagline on the site is
  // `secondary`, and that is not a style preference: over the 65% scrim the
  // secondary token lands at 2.78:1 and fails AA, which group 8 of
  // `npm run audit:contrast` prints every run. This is the other half of that
  // guarantee — the audit proves the number, this proves the site still uses it.
  it("keeps the hero tagline on the colour the scrim was audited for", () => {
    const tagline = render("/").match(
      /<p[^>]*>A simple set of Pokémon tools\.<\/p>/,
    )?.[0];
    expect(tagline).toBeDefined();
    expect(tagline).toContain("text-primary");
    expect(tagline).not.toContain("text-secondary");
  });
});

describe("the compare route", () => {
  it("renders the empty state with no selection", () => {
    expect(render("/compare")).toContain("No Pokémon selected");
  });

  it("resolves both slugs from a deep link", () => {
    const html = render("/compare/volcarona/vs/chandelure");
    expect(html).toContain("Volcarona");
    expect(html).toContain("Chandelure");
  });
});

// Accessibility fixes that only manifest in a real browser — a keyboard trying
// to scroll, a thumb trying to hit a nav link, an iPhone deciding to zoom. None
// of them throw, so nothing else in this file would notice them regressing.
describe("accessibility guarantees", () => {
  it("makes the type grid's scroll region reachable from a keyboard", () => {
    // The one sideways-scrolling panel on the site. Without tabindex it cannot
    // take focus, and a keyboard user simply cannot reach the columns off the
    // right edge — ten of the eighteen at phone width. (WCAG 2.1.1)
    const html = render("/types");
    expect(html).toMatch(/<div[^>]*tabindex="0"[^>]*role="region"/);
    expect(html).toContain("Type effectiveness chart, scrollable");
  });

  it("gives every primary nav link the header's full height", () => {
    // These were bare 14px text with no padding: a ~17px target in a 56px bar.
    // (WCAG 2.5.8)
    // Scoped to the <nav> itself: the skip link also carries `text-button` and
    // is correctly not full height — it is a focus-only control with its own
    // padding, not a bar item.
    const nav = render("/").match(/<nav\b[\s\S]*?<\/nav>/)?.[0] ?? "";
    const navLinks = nav.match(/<a\b[^>]*>/g) ?? [];
    expect(navLinks.length).toBeGreaterThanOrEqual(4);
    for (const link of navLinks) expect(link).toContain("h-14");
  });

  it("keeps every form control at 16px, so iOS does not force-zoom", () => {
    // Safari zooms the page when a control under 16px takes focus and does not
    // zoom back. `text-body` is 16px; `text-body-sm` is 14px. A responsive
    // variant cannot help — the named text styles are @layer components rules,
    // so `md:text-body-sm` generates nothing (06_style_guide §13).
    for (const path of ["/dex", "/compare"]) {
      const controls = render(path).match(/<(?:input|select)\b[^>]*>/g) ?? [];
      expect(controls.length).toBeGreaterThan(0);
      for (const c of controls) expect(c).not.toContain("text-body-sm");
    }
  });

  it("explains STAB in text rather than a title tooltip", () => {
    // `title=` is unreachable by keyboard, invisible on touch, and unreliably
    // exposed by screen readers — so the expansion is sr-only text now.
    for (const path of ["/", "/compare/volcarona/vs/chandelure"]) {
      const html = render(path);
      expect(html).not.toContain("title=");
      expect(html).toContain("same type attack bonus");
    }
  });

  it("does not make a screen reader say a Pokémon's name twice", () => {
    // The artwork sits beside an <h2> of the same name, so it is decorative.
    const html = render("/compare/volcarona/vs/chandelure");
    expect(html).not.toMatch(/<img[^>]*alt="Volcarona"/);
    expect(html).toMatch(/<img[^>]*alt=""/);
  });
});

// The smoke tests above build their own route table with `element:`, because
// createBrowserRouter needs a browser history. That was a harmless duplication
// while router.jsx also used `element:`; now that every route but Home is
// `lazy:`, it means a typo'd import path in router.jsx would reach production
// with the whole suite green. So the real router is imported and its lazy
// routes are actually resolved.
describe("the real router's lazy routes (D-060)", () => {
  it("resolves every split route to a component", async () => {
    // The route table, not the router: createBrowserRouter needs a browser
    // history, and this test has no DOM.
    const { routes: realRoutes } = await import("./router");
    const children = realRoutes[0].children;
    const lazyRoutes = children.filter((r) => r.lazy);

    // Home is deliberately eager; everything else is split.
    expect(lazyRoutes.length).toBe(children.length - 1);

    for (const route of lazyRoutes) {
      const mod = await route.lazy();
      expect(typeof mod.Component, `${route.path} did not resolve`).toBe(
        "function",
      );
    }
  });
});
