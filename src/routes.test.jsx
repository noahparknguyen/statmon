import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Dex from "./pages/Dex";
import Credits from "./pages/Credits";
import StyleGuide from "./pages/StyleGuide";
import NotFound from "./pages/NotFound";
import { ALL_POKEMON, getBySlug } from "./lib/pokemon";
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

describe("the dex route", () => {
  it("renders a windowed slice of rows, not all 1,259", () => {
    const rowCount = (render("/dex").match(/aria-rowindex/g) ?? []).length;
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThan(100);
  });

  it("declares the full row count for assistive tech", () => {
    expect(render("/dex")).toContain('aria-rowcount="1259"');
  });

  it("applies sort and filters from the URL", () => {
    const html = render("/dex?sort=speed&dir=desc&type=fire&gen=5");
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
      'aria-rowcount="1259"',
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

  it("still leads with the comparison hero", () => {
    expect(html()).toContain("Volcarona");
    expect(html()).toContain("Chandelure");
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
    // Scoped to the preview table: two of the six are the hero's mascots and
    // appear higher up the page, so searching the whole document would find
    // the hero's copy of them rather than the row.
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
    // Six preview rows; the hero board has none.
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
