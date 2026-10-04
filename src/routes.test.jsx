import { readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Dex from "./pages/Dex";
import TypeChart from "./pages/TypeChart";
import Games from "./pages/Games";
import GameHigher from "./pages/GameHigher";
import GameEffective from "./pages/GameEffective";
import About from "./pages/About";
import StyleGuide from "./pages/StyleGuide";
import NotFound from "./pages/NotFound";
import { ALL_POKEMON, getBySlug, spriteFor } from "./lib/pokemon";
import { CURRENT_GEN } from "./lib/eras";
import { WALL_TILES } from "./components/SpriteWall";
import { sortRows } from "./lib/dexTable";
import { compareUrl } from "./lib/compareUrl";
import { HIGHER_PRESETS, higherUrl } from "./lib/games";
import { TIER_DESC } from "./lib/effective";

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
      { path: "games", element: <Games /> },
      // The `handle` matters here, not just the element: Layout reads
      // `handle.bare` to drop the footer on a board (D-109), so a copy of the
      // table without it renders a footer the real app does not. This is the
      // duplication the note above warns about, caught by the first test that
      // depended on a handle.
      {
        path: "games/higher",
        element: <GameHigher />,
        handle: { title: "Higher", bare: true },
      },
      {
        path: "games/effective",
        element: <GameEffective />,
        handle: { title: "Effective", bare: true },
      },
      { path: "about", element: <About /> },
      { path: "style", element: <StyleGuide /> },
      {
        path: "*",
        element: <NotFound />,
        handle: { title: "Page not found", noindex: true },
      },
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
  "/games",
  "/games/higher",
  "/games/higher?stats=speed&n=4",
  "/games/higher?stats=special&asof=1",
  "/games/higher?stats=speed&gen=1&type=water",
  "/about",
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
  ["/games", "Games"],
  ["/games/higher", "Higher"],
  ["/games/effective", "Effective"],
  ["/about", "About"],
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
    const marked = (path) => render(path).match(/differs from today/g) ?? [];
    expect(marked("/compare/butterfree/vs/volcarona")).toHaveLength(1);
    // Neither Pokémon here has history of any kind — no stat era, no type era,
    // no ability era — so the strip is five unmarked chips.
    expect(marked("/compare/volcarona/vs/samurott")).toHaveLength(0);
  });

  it("marks a generation an ability changed in, not only a stat (D-073)", () => {
    // Chandelure's hidden ability was Shadow Tag through Gen 5 and is
    // Infiltrator now, so a Gen 5 board is a different board — and the mascot
    // matchup, which used to be the site's example of "nothing ever changed",
    // now has exactly one marked chip because of it.
    const marked = (path) => render(path).match(/differs from today/g) ?? [];
    expect(marked("/compare/volcarona/vs/chandelure")).toHaveLength(1);
    // The wording is deliberately not "stats differ": on this board no stat
    // does. It said that until abilities could mark a generation too.
    expect(render("/compare/volcarona/vs/chandelure")).not.toContain(
      "stats differ from today",
    );
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
    for (const path of ["/", "/compare", "/dex", "/types", "/about"]) {
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

// Abilities on both tools (D-073, D-074, D-075). The maths is unit-tested in
// abilities.test.js; these are the things only a rendered page can go wrong at
// — a band that collapses, a URL parameter that survives when it should not,
// and the correction actually reaching the chip.
describe("abilities", () => {
  it("scores the STAB block through the defender's first ability", () => {
    // The roadmap's own example: Ground is 2× into an Electric type, and
    // Eelektross has Levitate, so the board must not say 2×.
    const board = text("/compare/krookodile/vs/eelektross");
    expect(board).toContain("Levitate");
    expect(board).toContain("0×");
    // The chart's own answer stays on screen beside the corrected one, because
    // the correction is the interesting part.
    expect(board).toContain("2× on the chart");
    // Stated once by the caption, not repeated on the chip (D-079).
    expect(board.match(/Levitate/g) ?? []).toHaveLength(2); // card chip + caption
  });

  it("changes the answer with the generation, not just the roster", () => {
    // Gengar carried Levitate through Gen 6, so the same matchup reads 0× there
    // and 2× today. This is the interaction the era machinery buys for free.
    const gen6 = text("/compare/krookodile/vs/gengar?asof=6");
    expect(gen6).toContain("2× on the chart");
    // The ability is named once by the group's caption rather than on every
    // corrected chip (D-079), beside what is being attacked.
    // "· changed by Levitate" — the separator is aria-hidden and the accent dot
    // carries an sr-only expansion, because the dot means "this ability changes
    // type matchups" and colour alone does not say that (04_design §9).
    expect(gen6).toMatch(/vs Ghost \/ Poison\s*·?\s*changed by\s*Levitate/);
    expect(text("/compare/krookodile/vs/gengar")).not.toContain(
      "2× on the chart",
    );
  });

  it("degrades a bad ability parameter rather than throwing", () => {
    // `?as=` had this test and `?a1`/`?a2` did not, which is the half of the
    // forgiving-parse claim in Compare.jsx nothing was holding to account.
    // An ability the Pokémon does not have, an empty one, and a junk one all
    // fall back to the era's slot 1 rather than rendering or crashing.
    for (const qs of ["a2=not-an-ability", "a2=", "a1=levitate&a2=%%%"]) {
      const html = render(`/compare/krookodile/vs/gengar?${qs}`);
      expect(html, qs).toContain("Cursed Body");
      expect(html, qs).not.toContain("undefined");
    }
    // And one it DOES have is kept.
    expect(render("/compare/krookodile/vs/gengar?asof=6&a1=moxie")).toContain(
      "Moxie",
    );
  });

  it("names the ability only when it actually changed something", () => {
    // Gengar's Cursed Body is not in the effect table at all, so nothing is
    // corrected and the caption stays a plain statement of the defender's
    // typing — an ability that changed nothing must not be advertised as if it
    // had. Krookodile's Ground STAB is 2× either way here.
    const today = text("/compare/krookodile/vs/gengar");
    expect(today).toContain("vs Ghost / Poison");
    expect(today).not.toContain("Cursed Body ·");
  });

  it("keeps the ability band on the board where there are no abilities", () => {
    // Below Gen 3 nobody had one. The band says so rather than vanishing: a
    // control that comes and goes shoves the board around and teaches nobody
    // why it went (D-050).
    const gen1 = text("/compare/charizard/vs/blastoise?asof=1");
    expect(gen1).toContain("Abilities arrived in Gen 3");
    expect(text("/compare/charizard/vs/blastoise")).not.toContain(
      "Abilities arrived in Gen 3",
    );
  });

  it("marks the abilities that change a matchup, and only those", () => {
    // Shedinja's Wonder Guard is marked; Krookodile's three are not.
    expect(text("/compare/gengar/vs/shedinja")).toContain(
      "Changes type matchups",
    );
    expect(text("/compare/gengar/vs/krookodile")).not.toContain(
      "Changes type matchups",
    );
  });

  it("answers the type chart for a Pokémon, not just a typing", () => {
    const board = text("/types/electric?as=eelektross");
    expect(board).toContain("Eelektross");
    // Ground is Electric's one weakness, and Levitate is why that is not true
    // here: it leaves the 2× tier and joins the 0× one. Bounded at "Full
    // chart", since the 18×18 grid below the readout is full of 2× cells and
    // is not what this is asserting about.
    const tiers = board.slice(
      board.indexOf("Attacking"),
      board.indexOf("Full chart"),
    );
    expect(tiers).not.toContain("2×");
    expect(tiers.slice(tiers.indexOf("0×"))).toContain("Ground");
  });

  it("lets Wonder Guard rewrite the whole tier list", () => {
    // Shedinja: five attacking types do anything at all, and the other
    // thirteen do nothing — which the tier list shows rather than describes.
    const board = text("/types/bug/ghost?as=shedinja");
    expect(board).toContain("Shedinja");
    const tiers = board.slice(
      board.indexOf("Attacking"),
      board.indexOf("Full chart"),
    );
    expect(tiers.indexOf("2×")).toBeLessThan(tiers.indexOf("0×"));
    // Bug/Ghost has a 4× row on the chart (Ghost and Dark both stack); Wonder
    // Guard flattens everything above 1× to a single 2× tier, so its absence
    // is the assertion.
    expect(tiers).not.toContain("4×");
  });

  it("drops a Pokémon whose typing is not the one on screen", () => {
    // The URL is one source of truth, not two: `?as=` is validated against the
    // path rather than trusted, so a stale or hand-edited link degrades to a
    // plainer view of the same page instead of claiming a Volcarona that is
    // somehow Electric.
    const board = text("/types/electric?as=volcarona");
    expect(board).not.toContain("Volcarona");
    expect(board).toContain("Attacking");
  });

  it("keeps the plain typing readout when no Pokémon is named", () => {
    expect(text("/types/water/flying")).toContain("Attacking");
    expect(render("/types/water/flying")).toContain("matchup-heading");
  });
});

// A dex bar carries the whole typing, not just the primary (D-115). The value
// itself is unit-tested in types.test.js; these assert it survives the trip
// through React's style serialisation, which is where the one dangerous mistake
// lives.
// The Form and Ability rows hold one chip's height whether or not there are
// chips (D-125). Both placeholders — the em-dash for the 845 single-form
// entries, and the sentence `AbilityChips` renders for a Gen 1 board — are
// inline text, so their boxes took the INHERITED line-height (24px) rather than
// a chip's 21, and the labels shifted the moment a Pokémon had a form.
//
// The offsets themselves are a browser measurement and belong to
// `npm run sweep:widths`; what a server render can hold is that both cells
// still reserve the box.
describe("the card's controls band does not twitch", () => {
  const RESERVED = "min-h-[21px]";

  it.each([
    // A Pokémon with no alternate forms against one with Megas — the case that
    // was reported.
    "/compare/volcarona/vs/charizard",
    // A Gen 1 board, where NEITHER card has abilities and both fall to the
    // sentence placeholder.
    "/compare/charizard/vs/blastoise?asof=1",
  ])("reserves a chip's height on both rows of both cards at %s", (path) => {
    const page = render(path);
    // Two cards x two rows x BOTH SIDES of each row — the label carries the
    // same reservation as the cell (D-125), which is what makes its position
    // independent of whether the cell holds chips, a dash, or a wrapped row.
    expect((page.match(/min-h-\[21px\]/g) ?? []).length).toBe(8);
  });

  it("holds the label steady when the chips wrap to a second line", () => {
    // Hydrapple has the widest ability roster in the dex — three chips over two
    // lines — and Happiny beside it has one. Both labels must still sit in a
    // 21px box; the cell below them is free to grow.
    const page = render("/compare/hydrapple/vs/happiny");
    expect((page.match(/min-h-\[21px\]/g) ?? []).length).toBe(8);
    // The band aligns on `items-start`, not `items-baseline`: a wrapped flex row
    // takes its baseline from its first line, which moves as the row grows.
    expect(page).toContain("items-start");
    expect(page).not.toContain("items-baseline");
  });

  it("has no band to reserve on the empty card, which is deliberate", () => {
    // `EmptyCard` merges head, controls and portrait into one zone rather than
    // mirroring the filled card's three bands (D-083), so there is no Form or
    // Ability row there to hold open. Asserted rather than assumed, because the
    // test above would otherwise look like it is missing a case.
    const page = render("/compare");
    expect(page).toContain("No Pokémon selected");
    expect(page).not.toContain(RESERVED);
  });
});

// The last two items off D-043's "partially shipped" list (D-123, D-124).
describe("the comparison board's own bars, and Random", () => {
  it("grows in EVERY bar on the board, not only the middle card", () => {
    // `.animate-grow-w` is the shared grow-in. Home's board has had it since
    // D-023; the tool it advertises rendered instantly for as long.
    //
    // The count is what makes this mean something. The comparison card alone
    // renders 24 — six mirrored rows and six per-stat cards, two bars each —
    // and the two Pokémon cards add six apiece. So a floor above 24 is the
    // assertion that the SIDE cards animate, which is what shipped broken the
    // first time: the middle grew in and the two beside it did not, and the
    // board looked like it was loading in halves.
    const page = render("/compare/volcarona/vs/chandelure");
    const animated = (page.match(/animate-grow-w/g) ?? []).length;
    const sideTracks = (page.match(/bg-track-glass/g) ?? []).length;
    expect(sideTracks).toBe(12); // two cards, six stats each
    expect(animated).toBeGreaterThan(24);
  });

  it("has nothing to animate on an empty board", () => {
    // Non-vacuous: proves the class above comes from bars that exist rather
    // than from something the page always renders.
    expect(render("/compare")).not.toContain("animate-grow-w");
  });

  it("leaves the real dex table static", () => {
    // The dex windows its rows, so rows mount continuously while scrolling and
    // every one of them would animate on arrival (D-067). Only Home's preview
    // passes `animate`, and this is the guard that keeps it that way.
    expect(render("/dex")).not.toContain("animate-grow-w");
  });

  it("offers a random matchup, and offers it on an empty board", () => {
    // The one control here that works with nothing selected — which is the
    // state it is most useful in.
    for (const path of ["/compare", "/compare/volcarona/vs/chandelure"]) {
      const page = render(path);
      const buttons = [
        ...page.matchAll(/<button[^>]*>[\s\S]*?<\/button>/g),
      ].map((m) => m[0]);
      const random = buttons.find((b) => b.includes(">Random</button>"));
      expect(random, path).toBeTruthy();
      // The ATTRIBUTE, not the substring: every Button carries
      // `disabled:opacity-40` in its class list, so a plain `toContain`
      // matches the styling of a button that is not disabled at all.
      expect(random, `${path} — Random must never be disabled`).not.toMatch(
        /\sdisabled=""/,
      );
      // And Swap on an empty board IS disabled, which is what makes the
      // assertion above mean something.
      if (path === "/compare") {
        const swap = buttons.find((b) => b.includes(">Swap</button>"));
        expect(swap).toMatch(/\sdisabled=""/);
      }
    }
  });
});

// One colour per surface (D-144). A dual type's fills were a gradient between
// both colours, and two darkened type colours together read as mud however the
// blend was tuned; the badges carry the whole typing instead.
describe("a type fill is one colour, the primary type's", () => {
  it("fills a dual type's dex bars with its primary type alone", () => {
    // Bulbasaur is Grass/Poison. Scoped to its row so another row's fill
    // cannot satisfy the assertion.
    const page = render("/dex?q=bulbasaur");
    expect(page).toMatch(
      /background-color:color-mix\(in srgb, var\(--color-type-grass\) var\(--mix-dex-fill\)/,
    );
    expect(page).not.toContain("var(--color-type-poison) var(--mix-dex-fill)");
    expect(page).not.toContain("linear-gradient");
  });

  it("is never drawn as a gradient in the code that tints by type", () => {
    for (const f of [
      "src/lib/types.js",
      "src/components/gameChrome.jsx",
      "src/components/DexRow.jsx",
      "src/components/ContenderPanel.jsx",
      "src/components/MatchupPanel.jsx",
    ])
      expect(readFileSync(f, "utf8"), f).not.toMatch(/linear-gradient\(/);
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
    // Found first, then ordered: an `indexOf` of -1 is less than anything,
    // so a renamed tagline would otherwise pass this by not being there.
    const tagline = page.indexOf("Pokémon stats, matchups, and games");
    expect(tagline).toBeGreaterThan(-1);
    expect(tagline).toBeLessThan(page.indexOf("Volcarona"));
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
    "beartic",
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
    // Scoped to the preview table: two of them are the flagship's mascots and
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
    // One row per team member; the flagship board has none.
    expect(rows).toBe(TEAM.length);
    expect(html()).toContain(`aria-rowcount="${TEAM.length}"`);
  });

  // The href immediately preceding a CTA's label is that anchor's own, which is
  // how these get scoped to the BUTTON rather than to the page. Written this way
  // because the previous version of this test asserted `href="/compare"` and
  // `href="/dex"` and passed no matter what the CTAs did: the nav and the tools
  // chip row at the foot of the page both carry those bare links, so it was
  // matching them instead. It went on passing when the CTAs changed, which is
  // the failure mode a test like this exists to not have.
  const ctaHref = (page, label) => {
    const before = page.slice(0, page.indexOf(label));
    const hrefs = [...before.matchAll(/href="([^"]*)"/g)];
    return hrefs.at(-1)?.[1];
  };

  it("opens each preview's CTA on the exact view it was advertising", () => {
    const page = html();
    // The flagship board IS this matchup, so its CTA is that matchup rather
    // than two empty slots. All four CTAs say "Open the …" since D-126 —
    // "Try it out" was the one string on the site written as a pitch.
    expect(ctaHref(page, "Open the comparison")).toBe(
      compareUrl("volcarona", "chandelure"),
    );
    // The dex preview is the Gen 5 team read by Speed, descending (D-044), so
    // the CTA is the whole of Gen 5 under that same reading. `&` is escaped in
    // rendered HTML.
    expect(ctaHref(page, "Open the dex")).toBe(
      "/dex?sort=speed&amp;dir=desc&amp;gen=5",
    );
    // Krookodile's typing, which is what the type preview is answering for.
    expect(ctaHref(page, "Open the type chart")).toBe("/types/ground/dark");
    // The games section advertises two games, so the index is the honest
    // destination — deep-linking one would hide the other.
    expect(ctaHref(page, "Open the games")).toBe("/games");
  });

  // Home's games preview is a cameo like every other section (D-044): Mienshao,
  // reserved for it by D-068, and Samurott. The round itself is held to the
  // generator's bar in games.test.js; this is the half that asserts the two
  // actually reach the page.
  it("previews the games with named contenders, not a random draw", () => {
    const page = html();
    const preview = page.slice(page.indexOf("Which has the higher"));
    expect(preview).toContain("Mienshao");
    expect(preview).toContain("Samurott");
    // Resolved, so the preview shows the whole loop rather than a question —
    // the accent ring is what marks the winner.
    expect(preview).toContain("--color-accent");
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

  it("heads every section, in page order", () => {
    const page = text("/");
    const at = (s) => page.indexOf(s);
    expect(at("Compare")).toBeGreaterThan(-1);
    expect(at("Compare")).toBeLessThan(at("Dex"));
    expect(at("Dex")).toBeLessThan(at("Types"));
    expect(at("Types")).toBeLessThan(at("Games"));
    // One h1 (the wordmark) over one h2 per tool. Four now that the games
    // shipped (D-091), which is the count D-043 named as this pattern's limit —
    // a fifth tool should become a grid of compact previews rather than a fifth
    // full-height band.
    // Scoped to <main>: the footer carries an `sr-only` <h2> of its own so its
    // "Tools" and "Built with" groups do not skip from the page's <h1> to an
    // <h3> (D-119). That heading is not one of Home's sections.
    const doc = html();
    const main = doc.slice(doc.indexOf("<main"), doc.indexOf("</main>"));
    expect((main.match(/<h2/g) ?? []).length).toBe(4);
  });

  it("drops the sr-only heading that named the mascots, not the tool", () => {
    expect(html()).not.toContain("Example comparison");
  });

  // The type preview is the defensive read — what beats Krookodile — and is
  // unreadable without saying so, hence the shared heading (D-067, D-075).
  it("says what the type preview's tiers are attacking", () => {
    const page = text("/");
    expect(page).toContain("Attacking");
    expect(page.indexOf("Attacking")).toBeGreaterThan(page.indexOf("Types"));
    // Scoped to the preview, the way the dex preview's ordering test is: the
    // flagship board above now prints a 0× of its own (Chandelure's Flash Fire,
    // D-074), so searching the whole document for the tier order would find
    // that one instead of these.
    const preview = page.slice(page.indexOf("Attacking"));
    // Krookodile is named, not just its typing — the preview advertises the
    // Pokémon search the tool grew (D-075).
    expect(preview).toContain("Krookodile");
    // Its typing, and the tiers the real chart computes for it: strongest
    // first, down to the two attacking types that do nothing at all.
    expect(preview).toContain("Ground");
    expect(preview).toContain("Dark");
    expect(preview.indexOf("2×")).toBeLessThan(preview.indexOf("0×"));
    expect(preview).toContain("Electric");
    expect(preview).toContain("Psychic");
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
    // The wall's 2x2 tiling, plus one per dex row, the flagship board's two
    // heads, and Krookodile's in the type preview's heading (D-075). The 2x2 is
    // what makes the diagonal loop seam-free, so a change to it is a change to
    // the animation and should fail here.
    //
    // The dex rows are COUNTED off TEAM rather than folded into a literal. This
    // was `+ 9`, which silently meant "six rows and three other sprites" — so
    // adding a seventh team member failed here with an off-by-one that said
    // nothing about the wall it is named for.
    const OTHER_SPRITES = TEAM.length + 3;
    expect(sprites.length).toBe(WALL_TILES * 4 + OTHER_SPRITES);
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
      /<p[^>]*>Pokémon stats, matchups, and games\.<\/p>/,
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

    // Home is deliberately eager, and /credits is a redirect with no component
    // to split (D-118); everything else is lazily imported. Both exceptions are
    // named rather than subtracted as a number, so a route that quietly loses
    // its `lazy` fails here instead of moving the count.
    const eager = children.filter((r) => r.index);
    const redirects = children.filter((r) => r.loader && !r.lazy);
    expect(eager).toHaveLength(1);
    expect(redirects).toHaveLength(1);
    expect(lazyRoutes.length).toBe(
      children.length - eager.length - redirects.length,
    );

    for (const route of lazyRoutes) {
      const mod = await route.lazy();
      expect(typeof mod.Component, `${route.path} did not resolve`).toBe(
        "function",
      );
    }
  });
});

// The site's own name, in the two places it is written down.
//
// These had silently disagreed — index.html said "Pokémon comparison, dex and
// type chart" while Layout's SITE_TITLE said "Pokémon stat tools", under a
// comment asserting they matched. A crawler read one and a visitor who clicked
// Home read the other. It survived because no check reads prose (D-086), so
// this one does: it is the cheapest possible guard against the exact class of
// fault that session catalogued. (D-091)
//
// Read as text rather than imported, because `SITE_TITLE` cannot be exported —
// `react-refresh` requires a component file to export only components
// (06_style_guide §12 rule 8).
describe("the site's name", () => {
  const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");

  it("is identical in index.html and in Layout", () => {
    const inHtml = read("../index.html").match(/<title>([^<]+)<\/title>/)?.[1];
    const inLayout = read("./components/Layout.jsx").match(
      /SITE_TITLE = "([^"]+)"/,
    )?.[1];
    expect(inHtml).toBeTruthy();
    expect(inLayout).toBe(inHtml);
  });

  it("names every tool the site ships", () => {
    const title = read("../index.html").match(/<title>([^<]+)<\/title>/)[1];
    // The enumeration is the established voice (D-063), and this is the check
    // that it keeps up: a fifth tool fails here rather than quietly shipping a
    // title that describes the site as it was.
    for (const tool of ["comparison", "dex", "type chart", "games"]) {
      expect(title.toLowerCase(), tool).toContain(tool);
    }
  });
});

// The games' arena (D-096). These are server renders, so they say nothing about
// layout — that is `npm run sweep:widths`' job. What they do catch is the class
// of fault a smoke test is for: a round that renders no Pokémon, a settings
// combination that throws, and the empty state being unreachable when it should
// not be.
// The clash animates every direct CHILD of `.animate-clash-shake`, not the
// element itself (D-114) — that is what puts the parts of a panel out of phase
// instead of sliding them as one rigid block.
//
// The cost of that selector is a silent failure mode: flatten a panel's markup,
// or wrap its contents in one more span, and the shake stops or applies to a
// single node, with nothing to notice. CSS cannot be unit-tested here, but the
// SHAPE it depends on can be, so this asserts the contract the stylesheet is
// written against rather than the stylesheet.
describe("the clash has parts to shake (D-114)", () => {
  // Immediate element children of the tag whose opening tag ends at `from`.
  // Depth-aware rather than a fixed window: the first version of this counted
  // tags in the 4000 characters after the wrapper, which runs straight past it
  // into the sibling panels — so it passed even when the wrapper had exactly
  // one child, which is the whole thing it exists to catch.
  const VOID = new Set(["img", "br", "hr", "input", "source", "meta", "link"]);
  const immediateChildren = (page, from) => {
    let depth = 0;
    let count = 0;
    const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
    tag.lastIndex = from;
    let m;
    while ((m = tag.exec(page))) {
      const [, closing, name, selfClosed] = m;
      if (closing) {
        if (depth === 0) break; // the wrapper's own closing tag
        depth -= 1;
        continue;
      }
      if (depth === 0) count += 1;
      if (!selfClosed && !VOID.has(name.toLowerCase())) depth += 1;
    }
    return count;
  };

  // Both boards, because the two panels have different children — three or four
  // in `ContenderPanel`, up to five in `MatchupPanel` — and the `4n+k` cycle is
  // what makes that difference produce two different rhythms.
  for (const route of [
    "/games/higher?stats=speed&n=4",
    "/games/effective?tier=hard",
  ]) {
    it(`gives every shaking wrapper more than one child on ${route}`, () => {
      const page = render(route);
      const marker = /class="[^"]*animate-clash-shake[^"]*"[^>]*>/g;
      let m;
      let wrappers = 0;
      while ((m = marker.exec(page))) {
        wrappers += 1;
        expect(immediateChildren(page, m.index + m[0].length)).toBeGreaterThan(
          1,
        );
      }
      // Non-vacuous: a test that passes by finding nothing is worse than none.
      expect(wrappers).toBeGreaterThan(0);
    });
  }
});

describe("the stat game's arena", () => {
  it("renders a playable round with its prompt and its contenders", () => {
    const page = text("/games/higher?stats=speed");
    expect(page).toContain("Higher Speed?");
    // Two panels, so two dashes standing in for the unrevealed values.
    expect(page.match(/–/g) ?? []).toHaveLength(2);
  });

  it("asks for the highest, not the higher, with four contenders", () => {
    const page = text("/games/higher?stats=bst&n=4");
    expect(page).toContain("Highest Base stat total?");
    expect(page).not.toContain("Higher Base stat total?");
  });

  it("says so rather than rendering nothing when the filters leave no round", () => {
    // Gen 1 has exactly three Ghost types, so a four-contender round cannot be
    // seated. The setup panel refuses to Play this — it counts the pool and
    // disables the button — so the only way in is a hand-edited URL, which is
    // precisely why the page needs the state rather than assuming it away.
    const page = text("/games/higher?asof=1&type=ghost&n=4");
    expect(page).toContain("No round to play");
    expect(page).toContain("Open setup");
  });

  it("self-heals a filter the era never had, rather than emptying the pool", () => {
    // Fairy arrives in Gen 6, so `?type=fairy&asof=5` is not an empty game — it
    // is a game with no type filter, the same forgiving parse /dex applies to
    // the identical parameter (D-049). A stale link degrades to a plainer view
    // of the same page rather than to a dead end.
    const page = text("/games/higher?type=fairy&asof=5");
    expect(page).not.toContain("No round to play");
    expect(page).toContain("Setup");
  });

  it("keeps the game's own <h1> and does not add a second", () => {
    const html = render("/games/higher");
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect(html).toContain("Higher");
  });

  // The record reads through `browserStorage()`, which is null under a server
  // render — the same path a browser with site data blocked takes. A game that
  // only works where localStorage does is a game that white-screens for some
  // people (D-098).
  it("renders with no storage available at all", () => {
    // A parameterised URL, because a bare one now asks how you want to play
    // rather than dealing a round (D-108).
    expect(text("/games/higher?stats=speed")).toContain("Best");
  });
});

// The type game's hard tier hides three things until you answer, and each is a
// different way of printing the answer on screen (D-104). Rendered rather than
// reasoned about, because every one of them is a prop being passed correctly
// somewhere three components deep.
describe("Effective's hard tier does not give the answer away", () => {
  // Twelve rounds rather than one: the defender is drawn at random, so a single
  // render could pass by drawing a Pokémon with no ability and one type.
  const hard = () =>
    Array.from({ length: 12 }, () => render("/games/effective?tier=hard"));

  it("never shows the defender's typing before it is answered", () => {
    for (const html of hard()) {
      // TypeBadge's fill is the one thing on this page that sets a type token
      // as a BACKGROUND colour directly. Deliberately not `text-badge`, which
      // the ability pill shares — that assertion failed for the right reason
      // and would have kept failing for the wrong one. The attacking type is
      // `color:` and the defender's tint is a `color-mix()`, so neither is a
      // false positive.
      expect(html).not.toContain("background-color:var(--color-type-");
    }
  });

  it("never marks the ability as one that changes matchups", () => {
    // The accent dot is the marker AbilityChips shows on /compare and /types.
    // Here it would say "this one counts" before you had decided whether it
    // does — which is the whole of the hard tier's question, and the whole of
    // the Flame-Body-not-Flash-Fire trap.
    for (const html of hard()) {
      expect(html).not.toContain("Changes type matchups");
    }
  });

  it("still shows the ability itself, which is the question", () => {
    // At least one of twelve rounds must name an ability — if none did, the
    // two assertions above would be passing for the wrong reason.
    const withAbility = hard().filter((html) => html.includes("In play: "));
    expect(withAbility.length).toBeGreaterThan(0);
  });
});

// A bare URL asks; a parameterised URL plays (D-108). The distinction is the
// whole of what makes the start screen compatible with settings living in the
// URL — a shared link carries a game, never a form.
describe("the games ask how you want to play", () => {
  it.each(["/games/higher", "/games/effective"])(
    "%s offers presets rather than dealing a round",
    (path) => {
      const page = text(path);
      expect(page).toContain("How do you want to play?");
      for (const label of ["Easy", "Medium", "Hard", "Customise"]) {
        expect(page, label).toContain(label);
      }
      // The game bar belongs to a round in progress, so it must not be here.
      expect(page).not.toContain("Streak");
    },
  );

  it.each([
    "/games/higher?stats=speed&n=4",
    "/games/effective?tier=hard",
    // The URLs the default presets produce. These ARE the reload regression:
    // before D-116 both were the bare path, so refreshing after choosing
    // Medium landed back on the picker.
    "/games/higher?play",
    "/games/effective?play",
  ])("%s goes straight to the board", (path) => {
    const page = text(path);
    expect(page).not.toContain("How do you want to play?");
    expect(page).toContain("Streak");
  });

  // The Medium preset for the stat game IS the defaults, so its settings write
  // no parameters. That used to make its URL the bare one — the picker's own
  // URL — so choosing it and reloading put you back on the picker with the
  // game forgotten, and the link you copied did not carry it. `?play` closes
  // that: no preset can produce a bare URL now (D-116).
  it("gives every preset a URL that plays, the defaults included", () => {
    expect(HIGHER_PRESETS.length).toBeGreaterThan(0);
    for (const p of HIGHER_PRESETS)
      expect(higherUrl(p.settings), p.id).not.toBe("/games/higher");
  });
});

// The two game BOARDS drop the footer, because they are sized to fill the
// viewport exactly and anything beneath one makes every game page scroll by
// that much (D-109). Everything else keeps it — including the /games index you
// arrive through, and including the difficulty picker, which lives on the same
// route as a board but is an ordinary page with nothing to be pushed by
// (D-116). It had lost the footer by association.
// The setup panel is rendered on every game route even while closed, so the
// <dialog> element exists to be opened. The browser hides a dialog without the
// `open` attribute — but a `display` utility beats that UA rule, and `flex` did:
// the closed panel painted as a 2px-tall bordered box under the header, 576px
// wide, on a picker with nothing else to hide it. Nothing failed (D-116).
// The difficulty picker previews each preset with a real board at that preset's
// own settings (D-117) — D-043's rule one rung down from the games index. The
// COUNT of panels is what separates the stat game's presets, so it is what is
// asserted; an artwork per contender is the cheapest way to count them.
describe("the difficulty picker previews each preset", () => {
  // `<img>` only. React 19 also emits `<link rel="preload" as="image">` for
  // eager artwork, so matching the bare path counts each picture twice on some
  // pages and once on others — which is how this test first "found" a Pokémon
  // on the medium tier that was not there.
  const artworks = (page) =>
    [...page.matchAll(/<img src="\/artwork\//g)].length;

  it("draws two, two and four contenders across the stat game's presets", () => {
    // Easy and Medium deal two; Hard deals four. 2 + 2 + 4.
    expect(artworks(render("/games/higher"))).toBe(8);
  });

  it("climbs the type game's ladder: a type, a dual type, then a Pokémon", () => {
    // Only the hard tier's defender IS a Pokémon, so only that card carries
    // artwork — which is the tier ladder being visible rather than described.
    expect(artworks(render("/games/effective"))).toBe(1);
  });

  it("leaves the games index on the same two thumbnails", () => {
    // The stat game's card deals two contenders; the type game's medium tier
    // is two typings and no Pokémon. Guards the extraction into gameThumbs.
    expect(artworks(render("/games"))).toBe(2);
  });

  it("shows a board on the picker, not a picture of one", () => {
    // Non-vacuous: the panels are the game's own components, so the round's
    // values reach the card. Without a preview these cards are text only.
    const page = render("/games/higher");
    expect(page).toContain("Highest");
    expect(page).toContain("How do you want to play?");
  });
});

describe("the closed setup dialog stays out of the layout", () => {
  it.each(["/games/higher", "/games/effective", "/games/higher?play"])(
    "declares display per state on %s",
    (path) => {
      const tag = render(path).match(/<dialog[^>]*>/)?.[0];
      expect(tag).toBeTruthy();
      const classes = tag.match(/class="([^"]*)"/)[1].split(/\s+/);
      expect(classes).toContain("hidden");
      expect(classes).toContain("open:flex");
      // A bare `flex` is the thing that overrode the UA rule. `flex-col` is
      // direction, not display, and is fine.
      expect(classes).not.toContain("flex");
    },
  );
});

// index.html's <title>, `SITE_TITLE` and the web manifest are three copies of
// the site's name, and nothing read the third: the manifest still said
// "comparison, dex and type chart" after the games shipped and after abilities
// did, because no check reads prose (D-086) and no test had ever opened it.
describe("the site's name and description agree everywhere", () => {
  const manifest = JSON.parse(readFileSync("public/site.webmanifest", "utf8"));
  const html = readFileSync("index.html", "utf8");
  const titleOf = (s) => s.match(/<title>([^<]+)<\/title>/)[1];
  const metaOf = (s, name) =>
    s.match(new RegExp(`name="${name}"[^>]*content="([^"]+)"`, "s"))?.[1] ??
    s.match(new RegExp(`content="([^"]+)"[^>]*name="${name}"`, "s"))?.[1];

  // What a search result and a link preview show, so it is copy like any
  // other: no em dash in a sentence (06_style_guide §14, D-138).
  it("writes the description without an em dash", () => {
    expect(metaOf(html, "description")).not.toContain("—");
    expect(manifest.description).not.toContain("—");
  });

  it("uses one name in the tag, the manifest and the app shell", () => {
    const title = titleOf(html);
    expect(manifest.name).toBe(title);
    // `SITE_TITLE` is asserted against the tag elsewhere; this closes the third
    // corner of the triangle.
    expect(title).toContain("games");
  });

  it("uses one description in the tag and the manifest", () => {
    expect(manifest.description).toBe(metaOf(html, "description"));
  });

  it("names every shipped tool in both", () => {
    // The failure this catches is a shipped feature that never reached the
    // copy — which is exactly what happened to games.
    for (const tool of ["comparison", "dex", "type chart", "games"]) {
      expect(manifest.name.toLowerCase(), tool).toContain(tool);
    }
  });
});

// The alternate-forms chip is the same field on three surfaces, and it read
// two different ways: the dex was lit when forms were HIDDEN, both game setups
// when they were SHOWN (D-126). Same component, same default, opposite meaning.
describe("one control, one meaning: the alternate-forms chip", () => {
  const sources = [
    "src/components/DexFilters.jsx",
    "src/components/HigherSetup.jsx",
    "src/components/EffectiveSetup.jsx",
  ].map((f) => readFileSync(f, "utf8"));

  it("uses the same label on every surface", () => {
    for (const src of sources) {
      expect(src).toContain('label="Hide alternate forms"');
      expect(src).not.toContain('label="Alternate forms"');
    }
  });

  it("is lit when the forms are hidden, on every surface", () => {
    // Negated against the include flag — lit means a narrowing is applied,
    // which is what every other FilterChip on the site means.
    for (const src of sources) {
      expect(src).toMatch(/active=\{!\w+\.includeForms\}/);
      expect(src).not.toMatch(/active=\{\w+\.includeForms\}/);
    }
  });
});

// The dex's sort headers append the full column name for screen readers,
// because the visible label is an abbreviation and WCAG 2.5.3 needs the
// accessible name to contain it. Two of the nine columns are NOT abbreviated,
// and those read "Name sort by Name" and "HP sort by HP" (D-126) — audible
// only, which is why it shipped.
describe("the dex's sort headers do not stutter", () => {
  it("names the column once, however it is abbreviated", () => {
    const page = render("/dex");
    const hints = [
      ...page.matchAll(/<span class="sr-only">, sort(?: by ([^<]*))?<\/span>/g),
    ];
    // Non-vacuous: the dex really does render a sort hint per column.
    expect(hints.length).toBeGreaterThan(5);

    // The two columns whose visible label already IS the full name add nothing
    // after "sort".
    expect(page).not.toContain(", sort by Name");
    expect(page).not.toContain(", sort by HP");

    // The abbreviated ones still spell it out, which is the whole point of the
    // hint and what WCAG 2.5.3 needs the accessible name to carry.
    expect(page).toContain(", sort by Sp. Attack");
    expect(page).toContain(", sort by Base stat total");
    expect(page).toContain(", sort by Dex number");
  });
});

// Two copy rules that are mechanical enough to assert, so they do not depend on
// anyone re-reading 186 strings (D-126). Everything else the copy pass turned up
// was a judgement call and lives in 06_style_guide §14 instead — a linter for
// "does this sentence earn its place" would be a linter that cries wolf.
//
// A test rather than a `check:copy` script, because these read source files the
// way the manifest and title assertions already do, and a check nobody
// remembers to run is worse than one that rides along with the suite.
describe("the copy is spelled one way and does not shout", () => {
  const FILES = readdirSync("src/pages")
    .map((f) => `src/pages/${f}`)
    .concat(readdirSync("src/components").map((f) => `src/components/${f}`))
    .filter((f) => f.endsWith(".jsx") && !f.includes(".test."))
    // The design playground is documentation for whoever is building the site,
    // not copy for whoever is using it, and robots.txt keeps it out of search.
    .filter((f) => !f.endsWith("StyleGuide.jsx"));

  // JSX text nodes and the label-ish props that reach a reader, with comments
  // stripped so prose about the code is not mistaken for the code's prose.
  const stringsIn = (src) => {
    const code = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    return [
      // The `>` of an ARROW is not the `>` of a tag. Without the lookbehind
      // this matched from `=>` through to the next `<` and reported a chunk of
      // `gameThumbs.jsx` as shouty copy — which is how the extractor's own bug
      // was found.
      //
      // **A text node may wrap** (D-138). This pattern used to stop at the
      // end of a line, on the reasoning that a wrapped node is still one line
      // of prose per source line — but a node that wraps never reaches `<` on
      // its first line, so it matched nothing at all. Every sentence long
      // enough for Prettier to wrap was invisible to the tests below, which
      // was found by putting an em dash back into the games index and
      // watching the em-dash test pass. Whitespace is collapsed after. And a
      // node may end at an expression rather than a tag — the footer's legal
      // line runs into `{" "}` before its link — so `{` closes one too.
      ...[
        ...code.matchAll(
          /(?<![=!<>-])>\s*([A-Za-z][^<>{}]*[A-Za-z.?!…])\s*[<{]/g,
        ),
      ].map((m) => m[1].replace(/\s+/g, " ")),
      ...[
        ...code.matchAll(
          /\b(?:aria-label|alt|placeholder|title|label|subtitle|blurb|desc|cta)="([^"]{2,})"/g,
        ),
      ].map((m) => m[1]),
    ];
  };

  const all = FILES.flatMap((f) =>
    stringsIn(readFileSync(f, "utf8")).map((s) => ({ f, s })),
  );

  it("finds strings to check at all", () => {
    expect(all.length).toBeGreaterThan(80);
  });

  it("never shouts", () => {
    // 06_style_guide §14: no exclamation mark, in either register.
    const shouty = all.filter(({ s }) => s.includes("!"));
    expect(shouty.map(({ f, s }) => `${f}: ${s}`)).toEqual([]);
  });

  it("picks one spelling and keeps it", () => {
    // Both spellings of the same word shipped on /style before this pass.
    const PAIRS = [
      ["colour", "color"],
      ["favourite", "favorite"],
      ["customise", "customize"],
      ["licence", "license"],
      ["centre", "center"],
      ["grey", "gray"],
      ["analyse", "analyze"],
      ["organise", "organize"],
    ];
    const text = all
      .map(({ s }) => s)
      .join(" ")
      .toLowerCase();
    for (const [a, b] of PAIRS) {
      const hasA = new RegExp(`\\b${a}`).test(text);
      const hasB = new RegExp(`\\b${b}`).test(text);
      expect(hasA && hasB, `both "${a}" and "${b}" are used`).toBe(false);
    }
  });

  // 06_style_guide §14 rule 9 (D-138): no em dash in a sentence. A colon, a
  // comma or a full stop does the job, and an em dash in running copy is the
  // habit most often read as machine-written. The dash survives only as a
  // glyph that stands alone — a tie, an empty slot, a separator in a heading
  // or a title — and none of those is prose, so none reaches this extractor.
  it("keeps em dashes out of sentences", () => {
    const dashed = all.filter(({ s }) => s.includes("—"));
    expect(dashed.map(({ f, s }) => `${f}: ${s}`)).toEqual([]);
  });

  it("keeps em dashes out of the sentences that live in lib/", () => {
    // The tier sentences are rendered from data, not written in JSX, so the
    // extractor above cannot see them. The site's description is checked with
    // the rest of the metadata, below.
    for (const desc of Object.values(TIER_DESC))
      expect(desc).not.toContain("—");
  });
});

// Removing a selection was only possible by searching for a replacement or
// reloading (D-127). Each filled card carries a Remove now; the URL already
// spelled every partial state, so the control is a navigation and not new
// state.
describe("a selected Pokémon can be removed", () => {
  it("offers Remove on each filled card, named after the Pokémon", () => {
    const page = render("/compare/volcarona/vs/chandelure");
    // Named, not a bare "Remove": two identical controls on one board tell a
    // screen reader nothing about which side they belong to — the reason the
    // two search fields and the two ability groups are named too.
    expect(page).toContain('aria-label="Remove Volcarona"');
    expect(page).toContain('aria-label="Remove Chandelure"');
  });

  it("offers none on an empty board, where there is nothing to remove", () => {
    // Non-vacuous: the empty card is a different component, so this proves the
    // control comes from a selection rather than from the page.
    expect(render("/compare")).not.toContain('aria-label="Remove');
  });

  it("offers one on a half-filled board", () => {
    const page = render("/compare?p1=volcarona");
    expect((page.match(/aria-label="Remove /g) ?? []).length).toBe(1);
    expect(page).toContain('aria-label="Remove Volcarona"');
  });
});

// Scroll restoration is keyed per history entry, and every IN-TOOL navigation
// opts out of the reset (D-129). The opt-out is what stops the board jumping
// away on every click — measured at 327px before D-087 — so a `navigate()` that
// forgets it reintroduces that bug on one control, silently.
//
// Source-level, because scroll position is a browser fact and this is the
// invariant behind it: on this site an in-tool change is always a `replace`,
// and a `replace` must always prevent the reset.
describe("in-tool navigations never yank the page to the top", () => {
  const FILES = [
    "src/pages/Compare.jsx",
    "src/pages/Dex.jsx",
    "src/pages/TypeChart.jsx",
    "src/pages/GameHigher.jsx",
    "src/pages/GameEffective.jsx",
  ];

  it("pairs every `replace` navigation with `preventScrollReset`", () => {
    let total = 0;
    for (const f of FILES) {
      const src = readFileSync(f, "utf8");
      const replaces = (src.match(/replace:\s*true/g) ?? []).length;
      const guarded = (src.match(/preventScrollReset:\s*true/g) ?? []).length;
      expect(
        guarded,
        `${f} has ${replaces} replaces but ${guarded} guards`,
      ).toBe(replaces);
      total += replaces;
    }
    // Non-vacuous: there really are navigations to check.
    expect(total).toBeGreaterThanOrEqual(9);
  });

  it("leaves scroll restoration keyed per history entry", () => {
    // A `getKey` that collapses a tool's URLs into one key is what made
    // RETURNING to a tool restore its old position — which a nav click should
    // not do, however much a Back should.
    const layout = readFileSync("src/components/Layout.jsx", "utf8");
    expect(layout).toContain("<ScrollRestoration />");
    expect(layout).not.toMatch(/<ScrollRestoration\s+getKey/);
  });
});

describe("the footer", () => {
  const ATTRIBUTION = "unofficial fan project";

  it.each([
    "/games/higher?stats=speed",
    "/games/effective?tier=hard",
    // The default presets' URLs are boards too, and they are the ones that
    // used to be indistinguishable from the picker.
    "/games/higher?play",
    "/games/effective?play",
  ])("is absent on the board at %s", (path) => {
    expect(render(path)).not.toContain(ATTRIBUTION);
  });

  // Same two routes, no query — the picker rather than the board.
  it.each(["/games/higher", "/games/effective"])(
    "is present on the difficulty picker at %s",
    (path) => {
      const page = render(path);
      expect(page).toContain("How do you want to play?");
      expect(page).toContain(ATTRIBUTION);
    },
  );

  // The picker is not pinned to the viewport, so it must not carry the board's
  // exact-height shell — that is what would push the footer off screen.
  // `h-svh` on its own, not inside the page floor's `min-h-svh`.
  const PINNED = /(?<![\w-])h-svh(?![\w-])/;
  it.each(["/games/higher", "/games/effective"])(
    "sizes the picker as an ordinary page at %s",
    (path) => {
      expect(render(path)).not.toMatch(PINNED);
    },
  );

  it.each(["/games/higher?play", "/games/effective?play"])(
    "keeps the board pinned to the viewport at %s",
    (path) => {
      expect(render(path)).toMatch(PINNED);
    },
  );

  // Every page but a board is at least one screen tall, so its footer is
  // never on screen when it loads (D-142). The sweep measures the result; this
  // holds the markup that decides it.
  const FLOOR = /<main[^>]*[\s"]min-h-svh[\s"]/;
  it.each(["/games", "/games/higher", "/about"])(
    "holds %s to at least a screen's height",
    (path) => {
      expect(render(path)).toMatch(FLOOR);
    },
  );

  it.each(["/games/higher?play", "/games/effective?play"])(
    "leaves the board's height to the board at %s",
    (path) => {
      expect(render(path)).not.toMatch(FLOOR);
    },
  );

  it.each(["/", "/games", "/compare", "/dex", "/types", "/about"])(
    "is present on %s",
    (path) => {
      expect(render(path)).toContain(ATTRIBUTION);
    },
  );

  // The one thing the boards give up. Asserted rather than left as a comment,
  // so that if the attribution ever stops being reachable from the games index
  // the trade stops being the one that was agreed.
  //
  // The credits are the footer itself now (D-119), so this checks the sources
  // rather than a link to a page about them — which is a stronger guarantee,
  // since they are on every route that has a footer at all.
  it("still reaches the attribution from the games index", () => {
    const page = render("/games");
    expect(page).toContain('href="https://pokeapi.co/"');
    expect(page).toContain('href="https://github.com/PokeAPI/sprites"');
    expect(page).toContain("unofficial fan project");
  });

  // The footer states two facts about the dataset. Both are READ off it rather
  // than typed, because a footer that states a count is a footer that can be
  // wrong about one — and `npm run build:data` is the thing that would make it
  // wrong, silently, months later (D-121).
  it("reads its dex size and generation off the dataset", () => {
    const page = render("/about");
    // React's server renderer separates adjacent text and expressions with an
    // empty comment, so "Generation {CURRENT_GEN}" arrives as
    // `Generation <!-- -->9`. Stripping those is what makes this assert the
    // text a reader sees rather than the markup around it.
    const footer = page
      .slice(page.indexOf("<footer"))
      .replaceAll("<!-- -->", "");
    expect(footer).toContain(ALL_POKEMON.length.toLocaleString());
    expect(footer).toContain(`Generation ${CURRENT_GEN}`);
    // Non-vacuous: these are real values, not an empty string matching anything.
    expect(ALL_POKEMON.length).toBeGreaterThan(1000);
    expect(CURRENT_GEN).toBeGreaterThanOrEqual(9);
  });

  // Every external link in the footer leaves the site, and a screen reader is
  // told so rather than only shown an icon — the arrow is `aria-hidden`, so
  // without this the only signal is visual. EVERY one, not most: the first
  // version of this allowed a slack of one and passed while the licence and
  // notice links said nothing.
  it("says when a footer link opens in a new tab", () => {
    const page = render("/about");
    const footer = page.slice(page.indexOf("<footer"));
    const external = (footer.match(/target="_blank"/g) ?? []).length;
    const announced = (footer.match(/opens in a new tab/g) ?? []).length;
    // Non-vacuous: the footer really does carry a handful of outbound links.
    expect(external).toBeGreaterThanOrEqual(6);
    expect(announced).toBe(external);
  });
});

// The game's name is the way back to the difficulty picker (D-109).
describe("the game bar's title", () => {
  it.each(["/games/higher?stats=speed", "/games/effective?tier=hard"])(
    "is a control on %s, named by its visible word",
    (path) => {
      const html = render(path);
      // WCAG 2.5.3: the visible text has to be inside the accessible name, so
      // the clause is appended rather than replacing it with an aria-label.
      expect(html).toContain("choose a different game");
      expect(text(path)).toContain(
        path.includes("higher") ? "Higher" : "Effective",
      );
    },
  );
});

// A card on the games index is one link, all the way through (D-111). The stat
// game's thumbnail used to render `ContenderPanel` as a disabled `<button>`,
// which put a button inside an anchor — invalid, and it swallowed every click
// over the top half of the card, so only the text below opened the game.
describe("the games index cards are clickable everywhere", () => {
  it("puts no interactive element inside a card's link", () => {
    const html = render("/games");
    // Anchors on this page are the cards themselves; none of them may contain
    // a control, which is both the HTML rule and the reason the click worked
    // on one half of the card and not the other.
    for (const anchor of html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? []) {
      expect(anchor, anchor.slice(0, 80)).not.toMatch(
        /<(button|input|select)\b/,
      );
    }
  });

  it("still renders both thumbnails", () => {
    const page = text("/games");
    expect(page).toContain("Higher");
    expect(page).toContain("Effective");
    // The thumbnail is the real component against a real round, so a Pokémon
    // name proves it rendered rather than fell back to nothing (D-043).
    expect(render("/games")).toContain("Attacking");
  });
});

// One component per job (06_style_guide §12.2, D-135). The site's near-copies
// were never wrong on the day they were written — they drifted afterwards,
// one careless edit at a time, which is the failure §12 rule 8 exists for. So
// the merges are guarded at the source: a second copy has to fail something.
describe("one component per job", () => {
  const src = (f) => readFileSync(`src/${f}`, "utf8");
  const components = readdirSync("src/components")
    .filter((f) => f.endsWith(".jsx"))
    .map((f) => `components/${f}`);

  it("draws every stat bar with StatBar", () => {
    // `statPct` is what turns a stat into a bar's length. Outside StatBar the
    // only caller is the dex's cell fill, which is a different object by
    // design: a number over a proportional wash, not a bar (D-039).
    const callers = components.filter((f) => src(f).includes("statPct("));
    expect(callers.sort()).toEqual([
      "components/DexRow.jsx",
      "components/StatBar.jsx",
    ]);
  });

  it("ends both games' rounds on the shared cards", () => {
    for (const page of ["pages/GameHigher.jsx", "pages/GameEffective.jsx"]) {
      const code = src(page);
      expect(code, page).toContain(
        'import { NoRound, Verdict } from "../components/RoundCard"',
      );
      // A hand-rolled card would need its own button for Next.
      expect(code, page).not.toContain("<Button");
    }
  });

  it("builds every text field from the shared field", () => {
    // Two searches on /compare, one on /types, the name filter on /dex.
    for (const [path, n] of [
      ["/compare", 2],
      ["/types", 1],
      ["/dex", 1],
    ]) {
      const html = render(path);
      expect((html.match(/focus-ring-within/g) ?? []).length, path).toBe(n);
      expect(html, path).toContain("border-border-field");
      // The old focus cue: a border changing shade, which no one would call
      // a focus indicator (D-136).
      expect(html, path).not.toContain("focus-within:border-border-strong");
    }
  });

  it("keeps the generation strip on one line", () => {
    // Nine numerals share the width rather than wrapping the ninth onto a
    // line of its own (D-137): one column per chip, each at most 36px.
    expect(render("/dex")).toContain("repeat(9, minmax(0, 2.25rem))");
    // Volcarona arrived in Gen 5, so its board offers five.
    expect(render("/compare/volcarona/vs/chandelure")).toContain(
      "repeat(5, minmax(0, 2.25rem))",
    );
  });

  it("holds the speed banner's text off the flame's dark end", () => {
    // `.flame-inset` is the rule; group 11 of `npm run audit:contrast` is the
    // number behind it (D-136).
    expect(render("/compare/volcarona/vs/chandelure")).toContain("flame-inset");
    expect(render("/")).toContain("flame-inset");
  });

  it("lays out every tool's controls on the one panel", () => {
    // The panel spaces its own blocks (pageChrome's PANEL, D-140). Spaced by
    // margins on the children instead, the dex and the type chart put their
    // type chips 4px apart — the same control, in the same place, on two pages.
    for (const f of [
      "pages/Compare.jsx",
      "pages/TypeChart.jsx",
      "components/DexFilters.jsx",
    ]) {
      expect(src(f), f).toMatch(/\bPANEL\b/);
    }
    const handRolled = [
      ...components,
      "pages/Compare.jsx",
      "pages/TypeChart.jsx",
    ]
      .filter((f) => f !== "components/pageChrome.jsx")
      .filter((f) => src(f).includes("bg-surface p-4"));
    expect(handRolled).toEqual([]);
  });

  it("saves the accent ring for the answer", () => {
    // The stat game rings its winner. The type game's panels used to ring the
    // defender on every reveal, which is not an answer (D-137).
    expect(src("components/MatchupPanel.jsx")).not.toMatch(/\bring\(/);
  });
});

// Alignment that only a browser can measure, guarded where the markup decides
// it (D-141). The measurements themselves are in the decision; these hold the
// structure that produced them.
describe("things that line up stay lined up", () => {
  it("aligns a number column's header with its numbers", () => {
    // A number column's header is right-aligned with the sort caret BEFORE the
    // label, so the label's right edge lands on the numbers'. Centred, the
    // headers sat 27px off their numbers; right-aligned with the caret after,
    // 13px.
    for (const html of [render("/dex"), render("/")]) {
      const head = html.slice(html.indexOf("<thead"), html.indexOf("</thead>"));
      expect(head).not.toContain("justify-center");
      for (const label of ["HP", "Atk", "BST"]) {
        const at = head.indexOf(`>${label}<`);
        expect(at, label).toBeGreaterThan(-1);
        // The nearest opening tag before the label: the caret's <svg>, ending
        // just before it, for a right-aligned column.
        expect(head.slice(at - 5, at + 1), label).toBe("</svg>");
      }
    }
  });

  it("frames a selected type chart column without moving the grid", () => {
    // Borders are layout in a collapsed table, so selecting a type grew the
    // grid by 2px and shifted every row. The frame is inset shadows now.
    const html = render("/types/water");
    const grid = html.slice(html.indexOf("<table"), html.indexOf("</table>"));
    expect(grid).toContain("box-shadow:inset");
    expect(grid).not.toMatch(/border-(left|right|top|bottom):/);
  });
});

// A game's card is named by its title, not by the round drawn on it (D-146).
// The thumbnail sits inside the link or button it advertises, so unless it is
// hidden its text becomes the control's name.
describe("a game's thumbnail is a picture, hidden from assistive tech", () => {
  it.each(["/games", "/games/higher", "/games/effective"])(
    "hides every thumbnail on %s",
    (path) => {
      const thumbs = [
        ...render(path).matchAll(/<div[^>]*class="h-48[^"]*"[^>]*>/g),
      ].map((m) => m[0]);
      expect(thumbs.length).toBeGreaterThan(1);
      for (const t of thumbs) expect(t).toContain('aria-hidden="true"');
    },
  );
});

// An unknown URL is answered 200 with the not-found page (D-030), so that page
// asks not to be indexed. Layout adds the tag in an effect, which a server
// render cannot see, so this holds the route's flag; D-146 records the tag
// measured in a browser.
describe("the not-found page stays out of search results", () => {
  it("flags the catch-all route noindex, and Layout reads the flag", () => {
    const router = readFileSync("src/router.jsx", "utf8");
    expect(router).toMatch(/path: "\*",[\s\S]{0,300}noindex: true/);
    expect(readFileSync("src/components/Layout.jsx", "utf8")).toContain(
      "m.handle?.noindex",
    );
  });
});

// Where a round's cards sit (D-143). A resolved round cannot be rendered on the
// server, so these hold the markup that decides it; the browser measurements
// are in the decision.
describe("a round's cards sit where they are read", () => {
  const src = (f) => readFileSync(`src/${f}`, "utf8");

  it("puts the type game's verdict in the answer cluster, above the answers", () => {
    expect(src("pages/GameEffective.jsx")).toMatch(
      /<AnswerCluster[^>]*verdict=/,
    );
    const cluster = src("components/AnswerCluster.jsx");
    // An absolutely positioned grid child with no end line spans to the far
    // edge, which put the card at the bottom of the column.
    expect(cluster).toContain("row-start-1 row-end-2");
    // The floor that keeps the tallest verdict above the answers.
    expect(cluster).toContain("minmax(15rem,1fr)");
  });

  it("keeps the stat game's question on screen once answered", () => {
    const page = src("pages/GameHigher.jsx");
    // The question card used to be `hidden` side by side once resolved.
    expect(page).not.toMatch(/invisible (sm|lg):hidden/);
    // And the verdict's line answers in the question's words, for the
    // stacked board, where the verdict covers the question card.
    expect(page).toMatch(
      /\{question\(settings\.n, round\.stat\)\}: \{round\.winner\.name\}/,
    );
  });
});
