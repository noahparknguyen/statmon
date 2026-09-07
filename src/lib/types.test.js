import { describe, it, expect } from "vitest";
import { globSync, readFileSync } from "node:fs";
import {
  TYPES,
  typeColorVar,
  typeFill,
  typeTextVar,
  capitalize,
} from "./types";
import {
  CHART,
  CHART_ERAS,
  TYPE_INTRODUCED_IN,
  chartAsOf,
  effectiveness,
  typeExistsIn,
} from "./typeChart";
import { ALL_POKEMON } from "./pokemon";
import { CURRENT_GEN, eraView } from "./eras";

describe("TYPES", () => {
  it("is the 18 types with no duplicates", () => {
    expect(TYPES).toHaveLength(18);
    expect(new Set(TYPES).size).toBe(18);
  });

  // These three used to be three hand-maintained copies of the same list.
  // Now there is one, and these assertions are what keep it honest.
  it("matches the attacking types in the effectiveness chart", () => {
    expect(Object.keys(CHART).sort()).toEqual([...TYPES].sort());
  });

  it("matches the defending types the chart refers to", () => {
    const defending = new Set(
      Object.values(CHART).flatMap((row) => Object.keys(row)),
    );
    for (const t of defending) expect(TYPES).toContain(t);
  });

  it("covers every type that appears in the dataset", () => {
    const used = new Set(ALL_POKEMON.flatMap((p) => p.types));
    expect([...used].sort()).toEqual([...TYPES].sort());
  });

  it("has a --color-type-* token in index.css for each type", () => {
    const css = readFileSync(new URL("../index.css", import.meta.url), "utf8");
    for (const t of TYPES) {
      expect(css).toContain(`--color-type-${t}:`);
    }
  });

  it("is the only list of the 18 in the codebase", () => {
    // D-038 consolidated three hand-maintained copies into this module — and
    // missed a fourth, in the /style playground, of all places: the page whose
    // stated job is that it cannot drift from the app. Every consumer now
    // imports TYPES, so a new literal list is the thing to catch.
    const sources = globSync("**/*.{js,jsx}", {
      cwd: new URL("..", import.meta.url),
      exclude: (name) => name === "types.js",
    });
    for (const file of sources) {
      const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      // Three or more quoted type names in a row is a list being re-declared;
      // two is a dual typing, which is a legitimate thing to write down
      // (`["steel", "fairy"]` is a Pokémon, not a copy of the chart). Built
      // from TYPES itself rather than from a hardcoded pair, so the guard
      // cannot fall behind the list it guards.
      const run = new RegExp(
        `"(?:${TYPES.join("|")})"(?:\\s*,\\s*"(?:${TYPES.join("|")})"){2,}`,
      );
      expect(
        run.test(text),
        `${file} looks like a second copy of the 18 types — import TYPES instead`,
      ).toBe(false);
    }
  });
});

describe("the chart as it was (D-045)", () => {
  it("knows when each type arrived", () => {
    expect(typeExistsIn("dark", 1)).toBe(false);
    expect(typeExistsIn("dark", 2)).toBe(true);
    expect(typeExistsIn("fairy", 5)).toBe(false);
    expect(typeExistsIn("fairy", 6)).toBe(true);
    expect(typeExistsIn("fire", 1)).toBe(true);
    // No generation given means today, when everything exists.
    for (const t of TYPES) expect(typeExistsIn(t, null)).toBe(true);
  });

  it("only names types that exist in the era it belongs to", () => {
    for (const { until, chart } of CHART_ERAS) {
      for (const [attacker, row] of Object.entries(chart)) {
        expect(TYPES).toContain(attacker);
        expect(typeExistsIn(attacker, until)).toBe(true);
        for (const defender of Object.keys(row)) {
          expect(typeExistsIn(defender, until)).toBe(true);
        }
      }
    }
  });

  it("leaves types that did not exist out of the matchup entirely", () => {
    // Dark and Steel arrive in Gen 2, Fairy in Gen 6.
    expect(effectiveness("normal", ["steel"], 1)).toBe(1); // ½× today
    expect(effectiveness("dragon", ["fairy"], 5)).toBe(1); // 0× today
    expect(effectiveness("dragon", ["fairy"], 6)).toBe(0);
  });

  it("scores Generation 1 on the Generation 1 chart", () => {
    expect(effectiveness("ghost", ["psychic"], 1)).toBe(0); // the Gen 1 bug
    expect(effectiveness("ghost", ["psychic"])).toBe(2);
    expect(effectiveness("bug", ["poison"], 1)).toBe(2);
    expect(effectiveness("poison", ["bug"], 1)).toBe(2);
    expect(effectiveness("bug", ["poison"])).toBe(0.5);
    expect(effectiveness("ice", ["fire"], 1)).toBe(1); // Fire did not resist Ice
    expect(effectiveness("ice", ["fire"])).toBe(0.5);
  });

  it("scores Generations 2–5 on their own chart", () => {
    expect(effectiveness("ghost", ["steel"], 5)).toBe(0.5);
    expect(effectiveness("dark", ["steel"], 2)).toBe(0.5);
    expect(effectiveness("ghost", ["steel"], 6)).toBe(1);
    expect(effectiveness("dark", ["steel"])).toBe(1);
  });

  it("keeps dual-type multipliers stacking within an era", () => {
    // Bulbasaur, Grass/Poison. In Gen 1 Bug was super effective on both halves
    // — 2× × 2× = 4× — where today it is 2× × ½× = 1×.
    expect(effectiveness("bug", ["grass", "poison"], 1)).toBe(4);
    expect(effectiveness("bug", ["grass", "poison"])).toBe(1);
  });

  it("falls back to the current chart for any generation after the last era", () => {
    for (const gen of [6, 7, 8, CURRENT_GEN, null]) {
      expect(chartAsOf(gen)).toBe(CHART);
    }
    expect(chartAsOf(5)).not.toBe(CHART);
  });

  it("keeps every era chart a complete 18 attacking rows", () => {
    for (const gen of [1, 3, 5]) {
      expect(Object.keys(chartAsOf(gen)).sort()).toEqual([...TYPES].sort());
    }
  });

  it("never shows a Pokémon a typing that did not exist yet", () => {
    // The dataset's type eras have to cover every retype into Dark, Steel or
    // Fairy, or a past view would paint a type onto a generation without it.
    for (const entry of ALL_POKEMON) {
      for (const gen of [entry.introducedIn, CURRENT_GEN - 1]) {
        if (gen < entry.introducedIn) continue;
        for (const type of eraView(entry, gen).types) {
          expect(
            typeExistsIn(type, gen),
            `${entry.slug} is ${type} in gen ${gen}`,
          ).toBe(true);
        }
      }
    }
  });

  it("has a documented arrival for exactly the three late types", () => {
    expect(TYPE_INTRODUCED_IN).toEqual({ dark: 2, steel: 2, fairy: 6 });
  });
});

describe("token helpers", () => {
  it("builds the type color var reference", () => {
    expect(typeColorVar("fire")).toBe("var(--color-type-fire)");
  });

  it("uses one dark badge label color for every type (D-027)", () => {
    expect(typeTextVar()).toBe("var(--color-base)");
  });

  it("capitalizes a type slug for display", () => {
    expect(capitalize("dragon")).toBe("Dragon");
  });
});

// The dex bar carries a whole typing, so a dual type paints a gradient between
// its two colours. Audited for contrast as group 12 of `npm run audit:contrast`
// across all 153 pairs; these assert the VALUE, which the audit cannot see.
describe("typeFill", () => {
  it("is a flat wash for a single type, with no gradient", () => {
    const fill = typeFill(["fire"], "28%");
    expect(fill).toContain(typeColorVar("fire"));
    expect(fill).toContain("28%");
    expect(fill).not.toContain("gradient");
  });

  it("carries BOTH colours for a dual type, primary first", () => {
    const fill = typeFill(["bug", "fire"], "28%");
    expect(fill).toContain("linear-gradient");
    expect(fill).toContain(typeColorVar("bug"));
    expect(fill).toContain(typeColorVar("fire"));
    // Primary leads: Bug/Fire and Fire/Bug are different bars.
    expect(fill.indexOf(typeColorVar("bug"))).toBeLessThan(
      fill.indexOf(typeColorVar("fire")),
    );
  });

  it("runs along the bar, not diagonally like the arena's panels", () => {
    // A stat bar is a horizontal strip whose width is the value; a diagonal has
    // no vertical run to travel across and degrades into a hard edge.
    expect(typeFill(["bug", "fire"], "28%")).toContain("90deg");
  });

  it("mixes with transparent, never with a background colour", () => {
    // The bars sit in a table row that changes colour on hover. Mixing with
    // `--color-base` the way the arena's `tintFor` does would pin every bar to
    // the page background and kill that hover.
    const fill = typeFill(["water", "flying"], "28%");
    expect(fill).toContain("transparent");
    expect(fill).not.toContain("--color-base");
  });

  it("degrades to transparent rather than throwing on no typing", () => {
    expect(typeFill([], "28%")).toBe("transparent");
    expect(typeFill(undefined, "28%")).toBe("transparent");
  });

  it("produces a usable value for every type and every pair", () => {
    for (const t of TYPES) expect(typeFill([t], "28%")).toContain("color-mix");
    for (const a of TYPES)
      for (const b of TYPES)
        if (a !== b)
          expect(typeFill([a, b], "28%")).toContain("linear-gradient");
  });
});
